"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import * as duckdb from "@duckdb/duckdb-wasm";
import { getDuckDB, serializeQueryResult } from "@/utils/duckdb";
import { ParsedResult } from "@/utils/parser";
import { loadParsedDataIntoDuckDB } from "@/utils/duckdbLoader";
import { cleanAndValidateSql } from "@/utils/sqlValidator";

interface DuckDBContextType {
  db: duckdb.AsyncDuckDB | null;
  loading: boolean;
  error: string | null;
  datasetLoaded: boolean;
  loadDataset: (parsedData: ParsedResult) => Promise<{ success: boolean; error?: string }>;
  runQuery: (sql: string) => Promise<Record<string, unknown>[] | { error: string }>;
}

const DuckDBContext = createContext<DuckDBContextType>({
  db: null,
  loading: true,
  error: null,
  datasetLoaded: false,
  loadDataset: async () => ({ success: false, error: "DuckDB is not initialized" }),
  runQuery: async () => ({ error: "DuckDB is not initialized" }),
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

  return (
    <DuckDBContext.Provider value={{ db, loading, error, datasetLoaded, loadDataset, runQuery }}>
      {children}
    </DuckDBContext.Provider>
  );
};
