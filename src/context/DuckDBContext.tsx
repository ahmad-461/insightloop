"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import * as duckdb from "@duckdb/duckdb-wasm";
import { getDuckDB, serializeQueryResult } from "@/utils/duckdb";
import { ParsedResult, ColumnSchema } from "@/utils/parser";
import { loadParsedDataIntoDuckDB, loadSecondDatasetIntoDuckDB } from "@/utils/duckdbLoader";
import { cleanAndValidateSql } from "@/utils/sqlValidator";

interface DuckDBContextType {
  db: duckdb.AsyncDuckDB | null;
  loading: boolean;
  error: string | null;
  datasetLoaded: boolean;
  loadDataset: (parsedData: ParsedResult) => Promise<{ success: boolean; error?: string }>;
  runQuery: (sql: string) => Promise<Record<string, unknown>[] | { error: string }>;
  joinDatasets: (parsedData1: ParsedResult, parsedData2: ParsedResult, leftCol: string, rightCol: string, joinType: "INNER" | "LEFT") => Promise<{ success: boolean; result?: ParsedResult; error?: string }>;
}

const DuckDBContext = createContext<DuckDBContextType>({
  db: null,
  loading: true,
  error: null,
  datasetLoaded: false,
  loadDataset: async () => ({ success: false, error: "DuckDB is not initialized" }),
  runQuery: async () => ({ error: "DuckDB is not initialized" }),
  joinDatasets: async () => ({ success: false, error: "DuckDB is not initialized" }),
});

export const useDuckDB = () => useContext(DuckDBContext);

export const DuckDBProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [db, setDb] = useState<duckdb.AsyncDuckDB | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [datasetLoaded, setDatasetLoaded] = useState(false);

  const initDuckDB = useCallback(async (): Promise<duckdb.AsyncDuckDB> => {
    if (db) return db;
    setLoading(true);
    setError(null);
    try {
      const duckdbInstance = await getDuckDB();
      setDb(duckdbInstance);
      setLoading(false);
      return duckdbInstance;
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : "Failed to initialize DuckDB";
      setError(errMsg);
      setLoading(false);
      throw err;
    }
  }, [db]);

  const loadDataset = useCallback(async (parsedData: ParsedResult): Promise<{ success: boolean; error?: string }> => {
    setDatasetLoaded(false);
    try {
      const activeDb = db || await initDuckDB();
      const result = await loadParsedDataIntoDuckDB(activeDb, parsedData);
      if (result.success) {
        setDatasetLoaded(true);
      }
      return result;
    } catch (err: unknown) {
      return { success: false, error: err instanceof Error ? err.message : "Failed to initialize database engine." };
    }
  }, [db, initDuckDB]);

  const runQuery = useCallback(async (sql: string): Promise<Record<string, unknown>[] | { error: string }> => {
    let activeDb = db;
    if (!activeDb) {
      try {
        activeDb = await initDuckDB();
      } catch (err: unknown) {
        return { error: "Database engine failed to load: " + (err instanceof Error ? err.message : String(err)) };
      }
    }

    // 1. Validate & sanitize SQL
    const validation = cleanAndValidateSql(sql);
    if (!validation.isValid) {
      return { error: validation.error || "Blocked query: Invalid or unsafe SQL." };
    }

    const cleanSql = validation.cleanSql!;
    let conn;
    try {
      conn = await activeDb.connect();
      const arrowResult = await conn.query(cleanSql);

      // Convert Arrow Table to Array of JS Objects
      const rawRows = arrowResult.toArray().map((row) => row.toJSON());

      // Safe BigInt serialization
      const safeRows = serializeQueryResult(rawRows) as Record<string, unknown>[];
      return safeRows;
    } catch (err: unknown) {
      console.error("SQL query failed to execute:", err);
      return {
        error: err instanceof Error ? err.message : "SQL query failed to execute.",
      };
    } finally {
      if (conn) {
        try {
          await conn.close();
        } catch (closeErr) {
          console.error("Failed to close connection after query:", closeErr);
        }
      }
    }
  }, [db, initDuckDB]);

  const joinDatasets = useCallback(async (
    parsedData1: ParsedResult,
    parsedData2: ParsedResult,
    leftCol: string,
    rightCol: string,
    joinType: "INNER" | "LEFT"
  ): Promise<{ success: boolean; result?: ParsedResult; error?: string }> => {
    let activeDb = db;
    if (!activeDb) {
      try {
        activeDb = await initDuckDB();
      } catch (err: unknown) {
        return { success: false, error: "Database engine failed to load: " + (err instanceof Error ? err.message : String(err)) };
      }
    }

    try {
      // 1. Load second dataset as dataset_2
      const loadRes = await loadSecondDatasetIntoDuckDB(activeDb, parsedData2);
      if (!loadRes.success) {
        return { success: false, error: loadRes.error || "Failed to load second dataset into DuckDB." };
      }

      // 2. Identify safe column names and map schemas
      const colLeft = parsedData1.schema.find(c => c.columnName === leftCol);
      const colRight = parsedData2.schema.find(c => c.columnName === rightCol);

      if (!colLeft || !colRight) {
        return { success: false, error: "Invalid join columns selected." };
      }

      const selectParts: string[] = [];
      const combinedSchema: ColumnSchema[] = [];
      const seenSqlNames = new Set<string>();

      // Columns from dataset 1
      parsedData1.schema.forEach((col) => {
        selectParts.push(`dataset."${col.sqlSafeName}" AS "${col.sqlSafeName}"`);
        seenSqlNames.add(col.sqlSafeName);
        combinedSchema.push({ ...col });
      });

      // Columns from dataset 2
      parsedData2.schema.forEach((col) => {
        let sqlSafe = col.sqlSafeName;
        let displayName = col.displayName;
        if (seenSqlNames.has(sqlSafe)) {
          sqlSafe = `${sqlSafe}_joined`;
          displayName = `${displayName} (Joined)`;
        }

        selectParts.push(`dataset_2."${col.sqlSafeName}" AS "${sqlSafe}"`);
        seenSqlNames.add(sqlSafe);

        combinedSchema.push({
          ...col,
          columnName: displayName,
          displayName,
          sqlSafeName: sqlSafe
        });
      });

      const sql = `
        SELECT ${selectParts.join(", ")}
        FROM dataset
        ${joinType} JOIN dataset_2 ON dataset."${colLeft.sqlSafeName}" = dataset_2."${colRight.sqlSafeName}"
      `.trim();

      // Run query
      const conn = await activeDb.connect();
      try {
        const arrowResult = await conn.query(sql);
        const rawRows = arrowResult.toArray().map((row) => row.toJSON());
        const safeRows = serializeQueryResult(rawRows) as Record<string, unknown>[];

        // Format rawRows to match ParsedResult rawRows where keys are displayNames (columnName)
        const finalRows = safeRows.map((row) => {
          const rowObj: Record<string, unknown> = {};
          combinedSchema.forEach((col) => {
            rowObj[col.columnName] = row[col.sqlSafeName] === undefined ? null : row[col.sqlSafeName];
          });
          return rowObj;
        });

        // Combined column list
        const combinedColumns = combinedSchema.map(c => c.columnName);

        const joinedParsedResult: ParsedResult = {
          fileName: `${parsedData1.fileName.replace(/\.[^/.]+$/, "")}_joined_${parsedData2.fileName.replace(/\.[^/.]+$/, "")}`,
          fileSize: parsedData1.fileSize + parsedData2.fileSize,
          columns: combinedColumns,
          schema: combinedSchema,
          rawRows: finalRows
        };

        return { success: true, result: joinedParsedResult };
      } finally {
        await conn.close();
      }
    } catch (err: unknown) {
      console.error("Join execution failed:", err);
      return { success: false, error: err instanceof Error ? err.message : "An unexpected error occurred during join query execution." };
    }
  }, [db, initDuckDB]);

  return (
    <DuckDBContext.Provider value={{ db, loading, error, datasetLoaded, loadDataset, runQuery, joinDatasets }}>
      {children}
    </DuckDBContext.Provider>
  );
};
