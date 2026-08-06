"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [datasetLoaded, setDatasetLoaded] = useState(false);

  useEffect(() => {
    let active = true;

    async function init() {
      try {
        const duckdbInstance = await getDuckDB();
        if (active) {
          setDb(duckdbInstance);
          setLoading(false);
        }
      } catch (err: unknown) {
        if (active) {
          console.error("DuckDB initialization failed:", err);
          setError(err instanceof Error ? err.message : "Failed to initialize DuckDB");
          setLoading(false);
        }
      }
    }

    init();

    return () => {
      active = false;
    };
  }, []);

  const loadDataset = useCallback(async (parsedData: ParsedResult): Promise<{ success: boolean; error?: string }> => {
    if (!db) {
      return { success: false, error: "Database engine is not fully loaded yet." };
    }
    setDatasetLoaded(false);
    const result = await loadParsedDataIntoDuckDB(db, parsedData);
    if (result.success) {
      setDatasetLoaded(true);
    }
    return result;
  }, [db]);

  const runQuery = useCallback(async (sql: string): Promise<Record<string, unknown>[] | { error: string }> => {
    if (!db) {
      return { error: "Database engine is not fully loaded yet." };
    }

    // 1. Validate & sanitize SQL
    const validation = cleanAndValidateSql(sql);
    if (!validation.isValid) {
      return { error: validation.error || "Blocked query: Invalid or unsafe SQL." };
    }

    const cleanSql = validation.cleanSql!;
    let conn;
    try {
      conn = await db.connect();
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
  }, [db]);

  return (
    <DuckDBContext.Provider value={{ db, loading, error, datasetLoaded, loadDataset, runQuery }}>
      {children}
    </DuckDBContext.Provider>
  );
};
