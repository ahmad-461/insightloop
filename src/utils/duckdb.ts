"use client";

import * as duckdb from "@duckdb/duckdb-wasm";

let databaseInstance: duckdb.AsyncDuckDB | null = null;
let databasePromise: Promise<duckdb.AsyncDuckDB> | null = null;

/**
 * Initializes and returns a singleton instance of AsyncDuckDB.
 * Since Next.js is an SSR environment, we ensure this code only runs in the client browser.
 */
export async function getDuckDB(): Promise<duckdb.AsyncDuckDB> {
  if (typeof window === "undefined") {
    throw new Error("DuckDB-WASM can only be initialized on the client side.");
  }

  if (databaseInstance) {
    return databaseInstance;
  }

  if (databasePromise) {
    return databasePromise;
  }

  databasePromise = (async () => {
    try {
      const JSDELIVR_BUNDLES = duckdb.getJsDelivrBundles();

      // Select the optimal bundle based on browser feature checks
      const bundle = await duckdb.selectBundle(JSDELIVR_BUNDLES);

      // Create a worker using blob importScripts to avoid cross-origin issues
      const worker_url = URL.createObjectURL(
        new Blob([`importScripts("${bundle.mainWorker}");`], { type: "text/javascript" })
      );

      const worker = new Worker(worker_url);
      const logger = new duckdb.ConsoleLogger();
      const db = new duckdb.AsyncDuckDB(logger, worker);

      await db.instantiate(bundle.mainModule, bundle.pthreadWorker);

      URL.revokeObjectURL(worker_url);

      databaseInstance = db;
      return db;
    } catch (err) {
      databasePromise = null; // Reset promise so it can be retried if it fails
      throw err;
    }
  })();

  return databasePromise;
}

/**
 * Recursively inspects and converts BigInt values to standard numbers or strings,
 * and formats other complex objects to prevent React rendering or JSON serialization crashes.
 */
export function serializeQueryResult(val: unknown): unknown {
  if (val === null || val === undefined) {
    return val;
  }

  if (typeof val === "bigint") {
    const num = Number(val);
    if (num <= Number.MAX_SAFE_INTEGER && num >= Number.MIN_SAFE_INTEGER) {
      return num;
    }
    return val.toString();
  }

  if (Array.isArray(val)) {
    return val.map(serializeQueryResult);
  }

  if (typeof val === "object") {
    if (val instanceof Date) {
      return val.toISOString();
    }

    // Check if it's a plain object or a record
    const copy: Record<string, unknown> = {};
    for (const key of Object.keys(val)) {
      copy[key] = serializeQueryResult((val as Record<string, unknown>)[key]);
    }
    return copy;
  }

  return val;
}
