"use client";

import React, { useState, useRef, useTransition } from "react";
import {
  Upload,
  FileSpreadsheet,
  RefreshCw,
  AlertCircle,
  Calendar,
  Hash,
  DollarSign,
  Tag,
  Type,
  Trash2,
  TableProperties
} from "lucide-react";
import {
  parseCSV,
  parseExcel,
  castValue,
  ColumnType,
  ParsedResult,
  ColumnSchema
} from "../utils/parser";

// Constants for Tailwind-friendly hex colors and layout spacing
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB

export default function Home() {
  const [parsedData, setParsedData] = useState<ParsedResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isPending, startTransition] = useTransition();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle parsing a selected File
  const handleFileProcess = (file: File) => {
    setError(null);

    // Enforce 5MB limit client-side
    if (file.size > MAX_FILE_SIZE_BYTES) {
      setError(`File is too large (${(file.size / (1024 * 1024)).toFixed(2)}MB). Maximum size allowed is 5MB.`);
      return;
    }

    const name = file.name.toLowerCase();
    const isCsv = name.endsWith(".csv");
    const isXls = name.endsWith(".xls") || name.endsWith(".xlsx");

    if (!isCsv && !isXls) {
      setError("Unsupported file format. Please upload a CSV (.csv) or Excel (.xlsx, .xls) file.");
      return;
    }

    startTransition(async () => {
      try {
        let result: ParsedResult;
        if (isCsv) {
          result = await parseCSV(file);
        } else {
          result = await parseExcel(file);
        }
        setParsedData(result);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "An unexpected error occurred while parsing.";
        setError(msg);
      }
    });
  };

  // Input click handlers
  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFileProcess(e.target.files[0]);
    }
  };

  const triggerFileBrowser = () => {
    fileInputRef.current?.click();
  };

  // Drag and drop events
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileProcess(e.dataTransfer.files[0]);
    }
  };

  // Clear file state and restart
  const handleClear = () => {
    setParsedData(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Handler for manual type override of a column
  const handleTypeOverride = (colName: string, newType: ColumnType) => {
    if (!parsedData) return;

    const updatedSchema = parsedData.schema.map((col) => {
      if (col.columnName === colName) {
        return { ...col, currentType: newType };
      }
      return col;
    });

    setParsedData({
      ...parsedData,
      schema: updatedSchema,
    });
  };

  // Format bytes helper
  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  // Icon mapping for types
  const getTypeIcon = (type: ColumnType) => {
    switch (type) {
      case "date":
        return <Calendar className="h-3 w-3 text-emerald-400" />;
      case "number":
        return <Hash className="h-3 w-3 text-blue-400" />;
      case "currency":
        return <DollarSign className="h-3 w-3 text-amber-400" />;
      case "category":
        return <Tag className="h-3 w-3 text-purple-400" />;
      case "text":
      default:
        return <Type className="h-3 w-3 text-gray-400" />;
    }
  };

  // Type label helper
  const getTypeLabel = (type: ColumnType) => {
    switch (type) {
      case "date": return "📅 date";
      case "number": return "🔢 number";
      case "currency": return "💰 currency";
      case "category": return "🏷️ category";
      case "text": return "📝 text";
    }
  };

  return (
    <div className="flex-1 w-full max-w-7xl mx-auto px-4 py-8 space-y-8">

      {/* Page Title & Context Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-800 pb-6">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white via-gray-200 to-gray-400 bg-clip-text text-transparent">
            File Upload & Parsing
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            Upload CSV or Excel spreadsheets to parse them and configure column metadata entirely in-browser.
          </p>
        </div>
        {parsedData && (
          <button
            onClick={handleClear}
            className="flex items-center space-x-2 px-4 py-2 bg-rose-950/20 hover:bg-rose-900/30 text-rose-400 border border-rose-900/40 hover:border-rose-900/60 rounded-lg text-sm transition font-medium"
          >
            <Trash2 className="h-4 w-4" />
            <span>Clear / Upload New</span>
          </button>
        )}
      </div>

      {/* Main Upload Area (when no file is successfully parsed) */}
      {!parsedData && (
        <div className="max-w-3xl mx-auto space-y-6">
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={triggerFileBrowser}
            className={`border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all duration-200 flex flex-col items-center justify-center space-y-4 ${
              isDragging
                ? "border-accent bg-accent/5 scale-[0.99]"
                : "border-gray-800 hover:border-gray-700 bg-surface/50 hover:bg-surface/80"
            }`}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileInputChange}
              accept=".csv,.xlsx,.xls"
              className="hidden"
            />

            <div className="h-14 w-14 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center">
              <Upload className="h-7 w-7 text-accent" />
            </div>

            <div className="space-y-1">
              <p className="text-lg font-semibold text-white">Drag & drop your spreadsheet here</p>
              <p className="text-sm text-gray-400">
                or <span className="text-accent hover:underline font-medium">browse your files</span>
              </p>
            </div>

            <p className="text-xs text-gray-500 font-medium">
              Accepts .CSV, .XLSX, or .XLS • Max 5MB
            </p>
          </div>

          {/* Loader */}
          {isPending && (
            <div className="flex items-center justify-center space-x-3 p-4 bg-surface border border-gray-800 rounded-xl">
              <RefreshCw className="h-5 w-5 text-accent animate-spin" />
              <span className="text-sm text-gray-300 font-medium">Parsing and analyzing dataset columns...</span>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="flex items-start space-x-3 p-4 bg-rose-950/20 border border-rose-900/30 rounded-xl">
              <AlertCircle className="h-5 w-5 text-rose-500 mt-0.5 flex-shrink-0" />
              <div className="space-y-1">
                <p className="text-sm font-semibold text-rose-400">Unable to Parse File</p>
                <p className="text-xs text-gray-300 leading-relaxed">{error}</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Parsed Output / Preview Panel */}
      {parsedData && (
        <div className="space-y-6 animate-fade-in">
          {/* File summary bar */}
          <div className="bg-surface border border-gray-800 rounded-xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center space-x-4">
              <div className="h-12 w-12 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center flex-shrink-0">
                <FileSpreadsheet className="h-6 w-6 text-emerald-400" />
              </div>
              <div>
                <h3 className="font-semibold text-white text-base leading-tight truncate max-w-md">
                  {parsedData.fileName}
                </h3>
                <p className="text-xs text-gray-400 mt-1">
                  Size: {formatBytes(parsedData.fileSize)}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-6 self-stretch sm:self-auto justify-between border-t sm:border-t-0 border-gray-800 pt-3 sm:pt-0">
              <div className="text-center sm:text-right">
                <span className="block text-xs text-gray-400 font-medium">Total Rows</span>
                <span className="text-lg font-bold text-white">
                  {parsedData.rawRows.length.toLocaleString()}
                </span>
              </div>
              <div className="h-8 w-[1px] bg-gray-800 hidden sm:block"></div>
              <div className="text-center sm:text-right">
                <span className="block text-xs text-gray-400 font-medium">Total Columns</span>
                <span className="text-lg font-bold text-white">
                  {parsedData.columns.length}
                </span>
              </div>
            </div>
          </div>

          {/* Table Container */}
          <div className="bg-surface border border-gray-800 rounded-xl overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-gray-800 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <TableProperties className="h-4 w-4 text-accent" />
                <span className="text-sm font-semibold text-white">Data Preview (First 20 Rows)</span>
              </div>
              <span className="text-xs text-gray-400">
                Type overrides are applied immediately
              </span>
            </div>

            <div className="overflow-x-auto w-full">
              <table className="w-full text-left border-collapse table-auto">
                <thead>
                  <tr className="border-b border-gray-800 bg-background/50">
                    {parsedData.schema.map((col: ColumnSchema) => (
                      <th
                        key={col.columnName}
                        className="px-6 py-4 font-medium text-xs align-top border-r border-gray-800 last:border-r-0 min-w-[200px]"
                      >
                        {/* Interactive schema header */}
                        <div className="flex flex-col space-y-3">
                          {/* Type dropdown override */}
                          <div className="flex items-center justify-between">
                            <span className="inline-flex items-center space-x-1.5 px-2 py-0.5 rounded-md bg-gray-900 border border-gray-800 text-[10px] font-semibold tracking-wide uppercase text-gray-300">
                              {getTypeIcon(col.currentType)}
                              <span>{col.currentType}</span>
                            </span>

                            <select
                              value={col.currentType}
                              onChange={(e) => handleTypeOverride(col.columnName, e.target.value as ColumnType)}
                              className="text-[10px] bg-gray-950 border border-gray-800 hover:border-gray-700 text-gray-400 hover:text-white rounded px-1.5 py-0.5 font-medium outline-none cursor-pointer focus:border-accent"
                            >
                              <option value="text">📝 text</option>
                              <option value="number">🔢 number</option>
                              <option value="currency">💰 currency</option>
                              <option value="date">📅 date</option>
                              <option value="category">🏷️ category</option>
                            </select>
                          </div>

                          {/* Original Display Name */}
                          <span className="text-sm font-bold text-white tracking-wide block truncate" title={col.displayName}>
                            {col.displayName}
                          </span>

                          {/* Stats metadata banner */}
                          <div className="flex flex-col space-y-1 text-[10px] text-gray-500 font-semibold border-t border-gray-800/60 pt-2">
                            <div className="flex justify-between">
                              <span>Detected:</span>
                              <span className="text-gray-400">{getTypeLabel(col.detectedType)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Uniqueness:</span>
                              <span className="text-gray-400">
                                {col.totalCount > 0
                                  ? `${col.uniqueCount} (${((col.uniqueCount / col.totalCount) * 100).toFixed(0)}%)`
                                  : "0 (0%)"}
                              </span>
                            </div>
                          </div>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {parsedData.rawRows.slice(0, 20).map((row, rowIdx) => (
                    <tr
                      key={rowIdx}
                      className="hover:bg-gray-900/30 transition-colors"
                    >
                      {parsedData.schema.map((col: ColumnSchema) => {
                        const rawVal = row[col.columnName];
                        // Cast the raw cell value based on the selected column override type
                        const castedVal = castValue(rawVal, col.currentType);

                        let displayCell = "";
                        if (castedVal !== null && castedVal !== undefined) {
                          if (col.currentType === "currency") {
                            const sym = col.currencySymbol || "$";
                            displayCell = `${sym}${Number(castedVal).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
                          } else if (col.currentType === "number") {
                            displayCell = Number(castedVal).toLocaleString();
                          } else {
                            displayCell = String(castedVal);
                          }
                        }

                        return (
                          <td
                            key={col.columnName}
                            className="px-6 py-3 text-sm border-r border-gray-800 last:border-r-0 max-w-[280px] truncate"
                          >
                            {displayCell !== "" ? (
                              <span className="text-gray-200 font-medium">{displayCell}</span>
                            ) : (
                              <span className="text-gray-600 italic text-xs">null</span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="px-6 py-4 border-t border-gray-800 bg-background/30 flex justify-between items-center text-xs text-gray-400">
              <span>Showing {Math.min(20, parsedData.rawRows.length)} of {parsedData.rawRows.length.toLocaleString()} rows</span>
              {parsedData.rawRows.length > 20 && (
                <span>Remaining {parsedData.rawRows.length - 20} rows omitted from preview.</span>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
