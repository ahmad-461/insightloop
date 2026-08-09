import { AsyncDuckDB } from "@duckdb/duckdb-wasm";
import { ParsedResult, castValue } from "./parser";

/**
 * Maps the parsed data schema into a DuckDB table named `dataset`
 * entirely client-side. Respects user-defined column types and over-rides.
 */
export async function loadSecondDatasetIntoDuckDB(
  db: AsyncDuckDB,
  parsedData: ParsedResult
): Promise<{ success: boolean; error?: string }> {
  let conn;
  try {
    const mappedRows = parsedData.rawRows.map((row) => {
      const mappedRow: Record<string, unknown> = {};
      parsedData.schema.forEach((col) => {
        const castedVal = castValue(row[col.columnName], col.currentType);
        mappedRow[col.sqlSafeName] = castedVal;
      });
      return mappedRow;
    });

    const jsonStr = JSON.stringify(mappedRows);
    await db.registerFileText("dataset_2.json", jsonStr);

    conn = await db.connect();
    await conn.query("DROP TABLE IF EXISTS dataset_2;");

    const columnsDefinitions = parsedData.schema.map((col) => {
      let dbType = "VARCHAR";
      switch (col.currentType) {
        case "date":
          dbType = "DATE";
          break;
        case "number":
        case "currency":
          dbType = "DOUBLE";
          break;
        case "category":
        case "text":
        default:
          dbType = "VARCHAR";
          break;
      }
      return `"${col.sqlSafeName}" ${dbType}`;
    });

    const createTableSql = `CREATE TABLE dataset_2 (${columnsDefinitions.join(", ")});`;
    await conn.query(createTableSql);

    const colNames = parsedData.schema.map((col) => `"${col.sqlSafeName}"`).join(", ");

    const selectCasts = parsedData.schema.map((col) => {
      let dbType = "VARCHAR";
      switch (col.currentType) {
        case "date":
          dbType = "DATE";
          break;
        case "number":
        case "currency":
          dbType = "DOUBLE";
          break;
        case "category":
        case "text":
        default:
          dbType = "VARCHAR";
          break;
      }
      return `TRY_CAST("${col.sqlSafeName}" AS ${dbType}) AS "${col.sqlSafeName}"`;
    }).join(", ");

    const insertSql = `
      INSERT INTO dataset_2 (${colNames})
      SELECT ${selectCasts}
      FROM read_json_auto('dataset_2.json');
    `;
    await conn.query(insertSql);

    return { success: true };
  } catch (err: unknown) {
    console.error("Failed to load dataset_2 into DuckDB:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "An unexpected error occurred while loading dataset_2.",
    };
  } finally {
    if (conn) {
      try {
        await conn.close();
      } catch (closeErr) {
        console.error("Failed to close connection after loading dataset_2:", closeErr);
      }
    }
  }
}

export async function loadParsedDataIntoDuckDB(
  db: AsyncDuckDB,
  parsedData: ParsedResult
): Promise<{ success: boolean; error?: string }> {
  let conn;
  try {
    // 1. Map the raw rows into objects keyed by sqlSafeName, casting them using parsedData schema.
    const mappedRows = parsedData.rawRows.map((row) => {
      const mappedRow: Record<string, unknown> = {};
      parsedData.schema.forEach((col) => {
        const castedVal = castValue(row[col.columnName], col.currentType);
        mappedRow[col.sqlSafeName] = castedVal;
      });
      return mappedRow;
    });

    // 2. Register the mapped rows as a virtual JSON file inside DuckDB's filesystem.
    const jsonStr = JSON.stringify(mappedRows);
    await db.registerFileText("dataset.json", jsonStr);

    // 3. Connect to the database
    conn = await db.connect();

    // 4. Drop existing table to ensure clean slate
    await conn.query("DROP TABLE IF EXISTS dataset;");

    // 5. Generate CREATE TABLE query with proper types
    const columnsDefinitions = parsedData.schema.map((col) => {
      let dbType = "VARCHAR";
      switch (col.currentType) {
        case "date":
          dbType = "DATE";
          break;
        case "number":
        case "currency":
          dbType = "DOUBLE";
          break;
        case "category":
        case "text":
        default:
          dbType = "VARCHAR";
          break;
      }
      return `"${col.sqlSafeName}" ${dbType}`;
    });

    const createTableSql = `CREATE TABLE dataset (${columnsDefinitions.join(", ")});`;
    await conn.query(createTableSql);

    // 6. Generate INSERT INTO query with TRY_CAST to safely load the JSON data
    const colNames = parsedData.schema.map((col) => `"${col.sqlSafeName}"`).join(", ");

    const selectCasts = parsedData.schema.map((col) => {
      let dbType = "VARCHAR";
      switch (col.currentType) {
        case "date":
          dbType = "DATE";
          break;
        case "number":
        case "currency":
          dbType = "DOUBLE";
          break;
        case "category":
        case "text":
        default:
          dbType = "VARCHAR";
          break;
      }
      return `TRY_CAST("${col.sqlSafeName}" AS ${dbType}) AS "${col.sqlSafeName}"`;
    }).join(", ");

    const insertSql = `
      INSERT INTO dataset (${colNames})
      SELECT ${selectCasts}
      FROM read_json_auto('dataset.json');
    `;
    await conn.query(insertSql);

    return { success: true };
  } catch (err: unknown) {
    console.error("Failed to load parsed data into DuckDB:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "An unexpected error occurred while loading dataset.",
    };
  } finally {
    if (conn) {
      try {
        await conn.close();
      } catch (closeErr) {
        console.error("Failed to close connection after loading:", closeErr);
      }
    }
  }
}
