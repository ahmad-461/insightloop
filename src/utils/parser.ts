import * as Papa from "papaparse";
import * as XLSX from "xlsx";

export type ColumnType = "date" | "number" | "currency" | "category" | "text";

export interface ColumnSchema {
  columnName: string; // The unique display name of the column
  displayName: string; // Original cleaned display name
  sqlSafeName: string; // Unique SQL-safe name for DuckDB
  detectedType: ColumnType;
  currentType: ColumnType; // Can be manually overridden
  sampleValues: unknown[]; // First 50 non-empty raw values
  uniqueCount: number; // Unique non-empty count over the whole dataset
  totalCount: number; // Total non-empty count over the whole dataset
  currencySymbol?: string; // e.g. "$", "€", "£"
}

export interface ParsedResult {
  fileName: string;
  fileSize: number;
  columns: string[]; // List of unique displayNames
  schema: ColumnSchema[];
  rawRows: Record<string, unknown>[]; // Cleaned headers, raw cell values
}

// Convert display name to SQL-safe lowercase snake_case
export function toSqlSafeName(name: string): string {
  const base = name.toLowerCase();
  // Convert any non-alphanumeric characters to underscores
  let safe = base.replace(/[^a-z0-9_]/g, "_");
  // Replace multiple underscores with a single underscore
  safe = safe.replace(/__+/g, "_");
  // Trim leading and trailing underscores
  safe = safe.replace(/^_+|_+$/g, "");
  // If it starts with a number or is empty, prefix with "col_"
  if (!safe || /^[0-9]/.test(safe)) {
    safe = "col_" + (safe || "");
  }
  return safe;
}

// Process raw headers to handle empty and duplicate values
export function processHeaders(rawHeaders: unknown[]): { displayNames: string[]; sqlSafeNames: string[] } {
  const displayNames: string[] = [];
  const seenDisplay = new Map<string, number>();

  rawHeaders.forEach((raw, idx) => {
    let name = String(raw || "").trim();
    if (!name) {
      name = `Column_${idx + 1}`;
    }

    if (seenDisplay.has(name)) {
      let count = seenDisplay.get(name)!;
      let candidate = `${name}_${count + 1}`;
      while (seenDisplay.has(candidate)) {
        count++;
        candidate = `${name}_${count + 1}`;
      }
      seenDisplay.set(name, count + 1);
      seenDisplay.set(candidate, 1);
      displayNames.push(candidate);
    } else {
      seenDisplay.set(name, 1);
      displayNames.push(name);
    }
  });

  // Now generate unique sqlSafeNames
  const sqlSafeNames: string[] = [];
  const seenSql = new Map<string, number>();

  displayNames.forEach((displayName) => {
    const baseSafe = toSqlSafeName(displayName);
    const safe = baseSafe;
    if (seenSql.has(safe)) {
      let count = seenSql.get(safe)!;
      let candidate = `${safe}_${count + 1}`;
      while (seenSql.has(candidate)) {
        count++;
        candidate = `${safe}_${count + 1}`;
      }
      seenSql.set(safe, count + 1);
      seenSql.set(candidate, 1);
      sqlSafeNames.push(candidate);
    } else {
      seenSql.set(safe, 1);
      sqlSafeNames.push(safe);
    }
  });

  return { displayNames, sqlSafeNames };
}

// Detection patterns and utilities
export function isDateValue(val: unknown): boolean {
  if (val === null || val === undefined || val === "") return false;
  if (val instanceof Date) return !isNaN(val.getTime());

  const str = String(val).trim();
  // Exclude simple digits / plain numbers (e.g. "2024", "100") from being auto-detected as dates
  if (/^\d+$/.test(str)) return false;

  const isDateStr = /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:?\d{2})?)?$/.test(str) ||
                    /^\d{1,2}[/\-]\d{1,2}[/\-]\d{2,4}$/.test(str) ||
                    /^\d{4}[/\-]\d{1,2}[/\-]\d{1,2}$/.test(str);
  if (!isDateStr) return false;

  const timestamp = Date.parse(str);
  return !isNaN(timestamp);
}

// Detect currency symbol and clean number
const CURRENCY_SYMBOLS = ["$", "€", "£", "¥", "₹", "円", "元"];
const CURRENCY_HINTS = ["price", "cost", "revenue", "amount", "budget", "sales", "spend", "salary", "fee", "payment", "total"];

export function detectCurrency(val: unknown): { isCurrency: boolean; symbol?: string; cleanedValue?: number } {
  if (val === null || val === undefined || val === "") return { isCurrency: false };
  if (typeof val === "number") return { isCurrency: false }; // Plain numbers aren't currency strings, but might be classified as currency by column name hint later

  const str = String(val).trim();

  // Check if starts or ends with currency symbol
  for (const sym of CURRENCY_SYMBOLS) {
    if (str.startsWith(sym)) {
      const rest = str.slice(sym.length).trim().replace(/,/g, "");
      const num = parseFloat(rest);
      if (!isNaN(num)) {
        return { isCurrency: true, symbol: sym, cleanedValue: num };
      }
    }
    if (str.endsWith(sym)) {
      const rest = str.slice(0, -sym.length).trim().replace(/,/g, "");
      const num = parseFloat(rest);
      if (!isNaN(num)) {
        return { isCurrency: true, symbol: sym, cleanedValue: num };
      }
    }
  }

  return { isCurrency: false };
}

export function isNumericValue(val: unknown): boolean {
  if (val === null || val === undefined || val === "") return false;
  if (typeof val === "number") return !isNaN(val);
  const str = String(val).trim().replace(/,/g, "");
  if (!str) return false;
  const num = Number(str);
  return !isNaN(num) && isFinite(num);
}

// Safe value casting functions based on target column type
export function castValue(val: unknown, targetType: ColumnType): unknown {
  if (val === null || val === undefined || val === "") return null;

  switch (targetType) {
    case "number": {
      if (typeof val === "number") return val;
      const cleanStr = String(val).trim().replace(/,/g, "");
      const parsed = parseFloat(cleanStr);
      return isNaN(parsed) ? null : parsed;
    }
    case "currency": {
      if (typeof val === "number") return val;
      const str = String(val).trim();
      // Try extracting via currency check first
      const currencyCheck = detectCurrency(val);
      if (currencyCheck.isCurrency && currencyCheck.cleanedValue !== undefined) {
        return currencyCheck.cleanedValue;
      }
      // Fallback: strip standard currency symbols and commas
      const cleanStr = str.replace(/[$€£¥₹円元,]/g, "").trim();
      const parsed = parseFloat(cleanStr);
      return isNaN(parsed) ? null : parsed;
    }
    case "date": {
      if (val instanceof Date) {
        const year = val.getFullYear();
        const month = String(val.getMonth() + 1).padStart(2, "0");
        const day = String(val.getDate()).padStart(2, "0");
        return `${year}-${month}-${day}`;
      }
      const str = String(val).trim();
      if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
        return str;
      }
      const timestamp = Date.parse(str);
      if (isNaN(timestamp)) return null;
      const d = new Date(timestamp);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
    }
    case "category":
    case "text":
    default:
      return String(val).trim();
  }
}

// Parse array of arrays (unified interface)
export function parseRawData(rawRows: unknown[][], fileName: string, fileSize: number): ParsedResult {
  if (rawRows.length === 0) {
    throw new Error("The selected file contains no data.");
  }

  const rawHeaders = rawRows[0];
  const { displayNames, sqlSafeNames } = processHeaders(rawHeaders);

  const dataRows = rawRows.slice(1);

  // Map each data row into Record<displayName, rawCellValue>
  const parsedRows: Record<string, unknown>[] = dataRows.map((row) => {
    const rowObj: Record<string, unknown> = {};
    displayNames.forEach((colName, colIdx) => {
      const val = row[colIdx];
      rowObj[colName] = val === undefined ? null : val;
    });
    return rowObj;
  });

  // Calculate schema for each column
  const schema: ColumnSchema[] = displayNames.map((colName, colIdx) => {
    const sqlSafeName = sqlSafeNames[colIdx];

    // Collect all non-empty values from this column
    const allNonEmptyValues: unknown[] = [];
    parsedRows.forEach((row) => {
      const val = row[colName];
      if (val !== null && val !== undefined && val !== "") {
        allNonEmptyValues.push(val);
      }
    });

    const totalCount = allNonEmptyValues.length;

    // Sample first 50 non-empty values for type detection
    const sampleValues = allNonEmptyValues.slice(0, 50);

    // Uniqueness calculations
    const uniqueVals = new Set(allNonEmptyValues);
    const uniqueCount = uniqueVals.size;

    // Run detectors on sample values
    let dateHits = 0;
    let currencyHits = 0;
    let numericHits = 0;
    const detectedSymbols = new Map<string, number>();

    sampleValues.forEach((val) => {
      if (isDateValue(val)) dateHits++;

      const currencyCheck = detectCurrency(val);
      if (currencyCheck.isCurrency) {
        currencyHits++;
        if (currencyCheck.symbol) {
          detectedSymbols.set(currencyCheck.symbol, (detectedSymbols.get(currencyCheck.symbol) || 0) + 1);
        }
      }

      if (isNumericValue(val)) numericHits++;
    });

    const sampleCount = sampleValues.length;

    // Determine type
    let detectedType: ColumnType = "text";
    let currencySymbol: string | undefined = undefined;

    // Check if column header itself has currency hint
    const colNameLower = colName.toLowerCase();
    const hasCurrencyHint = CURRENCY_HINTS.some((hint) => colNameLower.includes(hint));

    if (sampleCount > 0) {
      if (dateHits / sampleCount >= 0.8) {
        detectedType = "date";
      } else if (currencyHits / sampleCount >= 0.8) {
        detectedType = "currency";
        // Find most frequent currency symbol
        let maxSym = "$";
        let maxCount = 0;
        detectedSymbols.forEach((count, sym) => {
          if (count > maxCount) {
            maxCount = count;
            maxSym = sym;
          }
        });
        currencySymbol = maxSym;
      } else if (hasCurrencyHint && numericHits / sampleCount >= 0.8) {
        // Has a hint like "price" and the values are mostly numbers
        detectedType = "currency";
        currencySymbol = "$"; // default fallback symbol
      } else if (numericHits / sampleCount >= 0.8) {
        detectedType = "number";
      } else {
        // Check category vs text using the rules:
        // (<20% unique ratio) OR (<=10 unique absolute values)
        const uniqueRatio = totalCount > 0 ? uniqueCount / totalCount : 0;
        if (uniqueRatio < 0.2 || uniqueCount <= 10) {
          detectedType = "category";
        } else {
          detectedType = "text";
        }
      }
    } else {
      // Empty column fallback
      detectedType = "text";
    }

    return {
      columnName: colName,
      displayName: colName,
      sqlSafeName,
      detectedType,
      currentType: detectedType,
      sampleValues,
      uniqueCount,
      totalCount,
      currencySymbol,
    };
  });

  return {
    fileName,
    fileSize,
    columns: displayNames,
    schema,
    rawRows: parsedRows,
  };
}

// Parse helper for PapaParse (CSV)
export function parseCSV(file: File): Promise<ParsedResult> {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: false,
      skipEmptyLines: "greedy",
      complete: (results) => {
        try {
          const rawRows = results.data as unknown[][];
          // Filter out completely empty or blank lines if they survived greedy skip
          const filteredRows = rawRows.filter((row) => row.some((cell) => cell !== null && cell !== undefined && String(cell).trim() !== ""));

          if (filteredRows.length === 0) {
            reject(new Error("The CSV file is empty or contains no readable data."));
            return;
          }
          const parsed = parseRawData(filteredRows, file.name, file.size);
          resolve(parsed);
        } catch (err: unknown) {
          const errorMsg = err instanceof Error ? err.message : String(err);
          reject(new Error(`CSV Parsing failed: ${errorMsg}`));
        }
      },
      error: (err) => {
        reject(new Error(`CSV Parsing failed: ${err.message}`));
      },
    });
  });
}

// Parse helper for Excel (xlsx, xls) using SheetJS
export function parseExcel(file: File): Promise<ParsedResult> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        if (!data) {
          reject(new Error("Failed to read Excel file data."));
          return;
        }
        const workbook = XLSX.read(data, { type: "array" });
        if (workbook.SheetNames.length === 0) {
          reject(new Error("The Excel workbook contains no sheets."));
          return;
        }
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        // Parse worksheet to array of arrays
        const rawRows = XLSX.utils.sheet_to_json<unknown[]>(worksheet, { header: 1, defval: "" });

        // Filter out completely empty rows
        const filteredRows = rawRows.filter((row) => Array.isArray(row) && row.some((cell) => cell !== null && cell !== undefined && String(cell).trim() !== ""));

        if (filteredRows.length === 0) {
          reject(new Error("The Excel sheet is empty or contains no readable data."));
          return;
        }

        const parsed = parseRawData(filteredRows, file.name, file.size);
        resolve(parsed);
      } catch (err: unknown) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        reject(new Error(`Excel Parsing failed: ${errorMsg}`));
      }
    };
    reader.onerror = () => {
      reject(new Error("Error reading the Excel file."));
    };
    reader.readAsArrayBuffer(file);
  });
}
