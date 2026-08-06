"use client";

import React, { useState, useRef, useTransition, useEffect } from "react";
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
  TableProperties,
  Terminal,
  Play,
  CheckCircle,
  Server,
  CodeXml,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  LayoutDashboard
} from "lucide-react";
import {
  parseCSV,
  parseExcel,
  castValue,
  ColumnType,
  ParsedResult,
  ColumnSchema
} from "../utils/parser";
import { useDuckDB } from "@/context/DuckDBContext";
import Dashboard from "@/components/Dashboard";
import ChatPanel from "@/components/ChatPanel";
import AdvancedInsights from "@/components/AdvancedInsights";

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB

export default function Home() {
  const [parsedData, setParsedData] = useState<ParsedResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isPending, startTransition] = useTransition();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // DuckDB Integration State
  const { loading: dbLoading, error: dbError, datasetLoaded, loadDataset, runQuery } = useDuckDB();
  const [syncStatus, setSyncStatus] = useState<{ loading: boolean; error: string | null }>({ loading: false, error: null });
  const [sqlQuery, setSqlQuery] = useState("SELECT * FROM dataset LIMIT 10");
  const [queryResults, setQueryResults] = useState<Record<string, unknown>[] | null>(null);
  const [queryError, setQueryError] = useState<string | null>(null);
  const [queryRunning, setQueryRunning] = useState(false);

  // UI Panels collapsing states
  const [isPreviewCollapsed, setIsPreviewCollapsed] = useState(false);
  const [isConsoleCollapsed, setIsConsoleCollapsed] = useState(true);

  // Automatically collapse preview when dashboard loaded
  const handleDashboardLoaded = () => {
    setIsPreviewCollapsed(true);
  };

  // Automatic DuckDB Load / Re-creation sync effect
  useEffect(() => {
    if (parsedData) {
      setSyncStatus({ loading: true, error: null });
      loadDataset(parsedData).then((res) => {
        if (res.success) {
          setSyncStatus({ loading: false, error: null });
        } else {
          setSyncStatus({ loading: false, error: res.error || "Failed to load database." });
        }
      });
    }
  }, [parsedData, loadDataset]); // Automatically re-triggers when overrides update parsedData schema or loadDataset is changed

  // Handle parsing a selected File
  const handleFileProcess = (file: File) => {
    setError(null);
    setQueryResults(null);
    setQueryError(null);

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
    setQueryResults(null);
    setQueryError(null);
    setSqlQuery("SELECT * FROM dataset LIMIT 10");
    setIsPreviewCollapsed(false);
    setIsConsoleCollapsed(true);
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

  // Handle running raw SQL Query against DuckDB
  const handleRunQuery = async (queryToRun: string = sqlQuery) => {
    setQueryRunning(true);
    setQueryError(null);
    setQueryResults(null);
    try {
      const result = await runQuery(queryToRun);
      if ("error" in result) {
        setQueryError(result.error);
      } else {
        setQueryResults(result);
      }
    } catch (err: unknown) {
      setQueryError(err instanceof Error ? err.message : "An unexpected error occurred while running the query.");
    } finally {
      setQueryRunning(false);
    }
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

  // Helpers to resolve dynamic query columns based on actual schema for dynamic testing
  const getFirstCol = () => parsedData?.schema[0]?.sqlSafeName || "column_1";
  const getCategoryCol = () => parsedData?.schema.find(c => c.currentType === "category")?.sqlSafeName || getFirstCol();
  const getNumCol = () => parsedData?.schema.find(c => c.currentType === "number" || c.currentType === "currency")?.sqlSafeName || getFirstCol();

  const samples = parsedData ? [
    {
      label: "🔍 SELECT 10 ROWS",
      query: "SELECT * FROM dataset LIMIT 10",
      description: "Returns the first 10 rows of the dataset"
    },
    {
      label: "📊 COUNT TOTAL ROWS",
      query: "SELECT COUNT(*) as total_rows FROM dataset",
      description: "Gets the total row count"
    },
    {
      label: "🏷️ GROUP BY CATEGORY",
      query: `SELECT "${getCategoryCol()}", COUNT(*) as count FROM dataset GROUP BY "${getCategoryCol()}" ORDER BY count DESC LIMIT 5`,
      description: `Counts items grouped by the '${getCategoryCol()}' column`
    },
    {
      label: "📈 AGGREGATE VALUES",
      query: `SELECT COUNT(*) as total_rows, SUM("${getNumCol()}") as sum_total, AVG("${getNumCol()}") as average_val FROM dataset`,
      description: `Aggregates sum and average for the '${getNumCol()}' column`
    }
  ] : [];

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
        <div className="space-y-8 animate-fade-in">
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
            <button
              onClick={() => setIsPreviewCollapsed(!isPreviewCollapsed)}
              className="px-6 py-4 border-b border-gray-800 flex items-center justify-between hover:bg-gray-900/30 transition text-left w-full outline-none"
            >
              <div className="flex items-center space-x-2">
                <TableProperties className="h-4 w-4 text-accent" />
                <span className="text-sm font-semibold text-white">Data Preview (First 20 Rows)</span>
                {isPreviewCollapsed && (
                  <span className="text-[10px] bg-gray-900 border border-gray-800 text-gray-400 font-semibold px-2 py-0.5 rounded ml-2">
                    Collapsed
                  </span>
                )}
              </div>
              <div className="flex items-center space-x-3 text-xs text-gray-400">
                <span className="hidden sm:inline">Type overrides are applied immediately</span>
                {isPreviewCollapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
              </div>
            </button>

            {!isPreviewCollapsed && (
              <>
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
              </>
            )}
          </div>

          {/* 📊 Automatic Analytics Dashboard */}
          <div className="space-y-4 pt-4 border-t border-gray-800/60">
            <div className="flex items-center space-x-3">
              <div className="bg-blue-500/10 p-2 rounded-lg border border-blue-500/20">
                <LayoutDashboard className="h-5 w-5 text-accent" />
              </div>
              <div>
                <h2 className="text-xl font-extrabold text-white tracking-tight">Interactive Analytics Dashboard</h2>
                <p className="text-xs text-gray-400 mt-0.5 animate-fade-in">Automatically generated insights and trends based on your file&apos;s schema.</p>
              </div>
            </div>

            <Dashboard
              parsedData={parsedData}
              datasetLoaded={datasetLoaded}
              runQuery={runQuery}
              onDashboardLoaded={handleDashboardLoaded}
            />
          </div>

          {/* 🧠 Python Advanced Insights Section */}
          <div className="pt-4 border-t border-gray-800/60 space-y-4">
            <AdvancedInsights
              parsedData={parsedData}
              datasetLoaded={datasetLoaded}
              runQuery={runQuery}
            />
          </div>

          {/* 💬 AI Text-to-SQL Co-Pilot Section */}
          <div className="pt-4 border-t border-gray-800/60 space-y-4">
            <ChatPanel
              datasetLoaded={datasetLoaded}
              schema={parsedData.schema}
              runQuery={runQuery}
            />
          </div>

          {/* 🛠️ Debug SQL Console (Visible only after a file is loaded) */}
          <div className="bg-surface border border-gray-800 rounded-xl overflow-hidden flex flex-col">
            <button
              onClick={() => setIsConsoleCollapsed(!isConsoleCollapsed)}
              className="px-6 py-5 flex items-center justify-between hover:bg-gray-900/30 transition text-left w-full outline-none animate-fade-in"
            >
              <div className="flex items-center space-x-3">
                <div className="bg-blue-500/10 p-2 rounded-lg border border-blue-500/20">
                  <Terminal className="h-5 w-5 text-accent" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h2 className="text-lg font-bold text-white">Debug SQL Console</h2>
                    {isConsoleCollapsed && (
                      <span className="text-[10px] bg-gray-900 border border-gray-800 text-gray-400 font-semibold px-2 py-0.5 rounded">
                        Collapsed
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">Run real-time analytical SQL queries directly on your dataset.</p>
                </div>
              </div>
              <div className="text-gray-400">
                {isConsoleCollapsed ? <ChevronDown className="h-5 w-5" /> : <ChevronUp className="h-5 w-5" />}
              </div>
            </button>

            {!isConsoleCollapsed && (
              <div className="p-6 pt-0 border-t border-gray-800 space-y-6">
                {/* Status Banner */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-800 pb-4 pt-4">
                  <div className="text-xs text-gray-400">
                    Interact directly with DuckDB using raw SQL.
                  </div>
                  <div className="flex items-center space-x-2 bg-gray-950 border border-gray-800 px-3 py-1.5 rounded-lg text-xs font-semibold self-start sm:self-auto">
                    {dbLoading ? (
                      <>
                        <RefreshCw className="h-3 w-3 text-blue-400 animate-spin" />
                        <span className="text-blue-400">Initializing DuckDB WASM...</span>
                      </>
                    ) : dbError ? (
                      <>
                        <AlertCircle className="h-3 w-3 text-rose-500" />
                        <span className="text-rose-400">DuckDB Error: {dbError}</span>
                      </>
                    ) : syncStatus.loading ? (
                      <>
                        <RefreshCw className="h-3 w-3 text-amber-500 animate-spin" />
                        <span className="text-amber-400">Syncing database schema...</span>
                      </>
                    ) : syncStatus.error ? (
                      <>
                        <AlertCircle className="h-3 w-3 text-rose-500" />
                        <span className="text-rose-400">Sync failed: {syncStatus.error}</span>
                      </>
                    ) : datasetLoaded ? (
                      <>
                        <CheckCircle className="h-3.5 w-3.5 text-emerald-400" />
                        <span className="text-emerald-400 font-semibold">DB synced: &apos;dataset&apos; active</span>
                      </>
                    ) : (
                      <>
                        <Server className="h-3 w-3 text-gray-500" />
                        <span className="text-gray-400">DuckDB idle</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Quick Sample Queries */}
                <div className="space-y-2">
                  <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">Quick Test Queries</span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    {samples.map((sample, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          setSqlQuery(sample.query);
                          handleRunQuery(sample.query);
                        }}
                        className="flex flex-col items-start p-3 bg-gray-950 hover:bg-gray-900 border border-gray-800 hover:border-gray-700 rounded-lg text-left transition"
                      >
                        <span className="text-xs font-bold text-blue-400 flex items-center space-x-1">
                          <span>{sample.label}</span>
                          <ChevronRight className="h-3 w-3" />
                        </span>
                        <span className="text-[10px] text-gray-400 mt-1 leading-snug">{sample.description}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Input Console */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label htmlFor="query-console" className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                      SQL Query Input
                    </label>
                    <span className="text-[10px] text-gray-500 font-medium">Table name: <code className="bg-gray-950 px-1 py-0.5 rounded text-gray-300">dataset</code></span>
                  </div>
                  <div className="relative">
                    <textarea
                      id="query-console"
                      value={sqlQuery}
                      onChange={(e) => setSqlQuery(e.target.value)}
                      className="w-full h-32 bg-gray-950 border border-gray-800 focus:border-accent rounded-lg p-4 font-mono text-sm text-gray-100 placeholder-gray-700 outline-none transition focus:ring-1 focus:ring-accent/30"
                      placeholder="SELECT * FROM dataset LIMIT 10..."
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => handleRunQuery()}
                    disabled={queryRunning || dbLoading || syncStatus.loading}
                    className="w-full sm:w-auto flex items-center justify-center space-x-2 px-6 py-3 bg-accent hover:bg-blue-600 disabled:bg-gray-800 text-white font-semibold rounded-lg text-sm transition disabled:cursor-not-allowed shadow-lg shadow-accent/10"
                  >
                    {queryRunning ? (
                      <>
                        <RefreshCw className="h-4 w-4 animate-spin" />
                        <span>Executing Query...</span>
                      </>
                    ) : (
                      <>
                        <Play className="h-4 w-4 fill-white" />
                        <span>Run Query</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Query Error Area */}
                {queryError && (
                  <div className="flex items-start space-x-3 p-4 bg-rose-950/20 border border-rose-900/30 rounded-xl animate-fade-in">
                    <AlertCircle className="h-5 w-5 text-rose-500 mt-0.5 flex-shrink-0" />
                    <div className="space-y-1">
                      <p className="text-sm font-semibold text-rose-400">Query Failed</p>
                      <p className="text-xs text-gray-300 leading-relaxed font-mono">{queryError}</p>
                    </div>
                  </div>
                )}

                {/* Query Results Area */}
                {queryResults !== null && (
                  <div className="space-y-4 animate-fade-in">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">Query Output</span>
                      <span className="text-xs text-emerald-400 font-semibold bg-emerald-950/20 px-2.5 py-1 border border-emerald-900/30 rounded-full">
                        Returned {queryResults.length.toLocaleString()} row{queryResults.length === 1 ? "" : "s"}
                      </span>
                    </div>

                    {queryResults.length === 0 ? (
                      <div className="text-center py-8 bg-gray-950 border border-gray-800 rounded-lg">
                        <CodeXml className="h-8 w-8 text-gray-600 mx-auto mb-2" />
                        <p className="text-sm text-gray-400">No rows matching your query were found.</p>
                      </div>
                    ) : (
                      <div className="bg-gray-950 border border-gray-800 rounded-lg overflow-hidden flex flex-col max-h-96">
                        <div className="overflow-x-auto w-full">
                          <table className="w-full text-left border-collapse table-auto">
                            <thead>
                              <tr className="border-b border-gray-800 bg-background/50">
                                {Object.keys(queryResults[0]).map((colName) => (
                                  <th
                                    key={colName}
                                    className="px-5 py-3 font-semibold text-xs text-gray-400 uppercase tracking-wider border-r border-gray-800 last:border-r-0"
                                  >
                                    {colName}
                                  </th>
                                ))}
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-800">
                              {queryResults.slice(0, 100).map((row, rowIdx) => (
                                <tr
                                  key={rowIdx}
                                  className="hover:bg-gray-900/20 transition-colors"
                                >
                                  {Object.keys(queryResults[0]).map((colName) => {
                                    const val = row[colName];
                                    return (
                                      <td
                                        key={colName}
                                        className="px-5 py-2.5 text-sm border-r border-gray-800 last:border-r-0 text-gray-200"
                                      >
                                        {val === null || val === undefined ? (
                                          <span className="text-gray-600 italic text-xs">null</span>
                                        ) : typeof val === "object" ? (
                                          JSON.stringify(val)
                                        ) : (
                                          String(val)
                                        )}
                                      </td>
                                    );
                                  })}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                        {queryResults.length > 100 && (
                          <div className="px-5 py-3 bg-background/30 text-[11px] text-gray-500 border-t border-gray-800">
                            * Query output truncated. Showing first 100 rows.
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

          </div>
        </div>
      )}

    </div>
  );
}
