"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  Brain,
  AlertCircle,
  Binary,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  LineChart as LineIcon,
  TableProperties
} from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from "recharts";
import { ParsedResult } from "@/utils/parser";
import { formatNumber } from "@/utils/formatter";

interface AdvancedInsightsProps {
  parsedData: ParsedResult;
  datasetLoaded: boolean;
  runQuery: (sql: string) => Promise<Record<string, unknown>[] | { error: string }>;
}

type TabType = "trend" | "outlier" | "correlation";

interface TrendPoint {
  date: string;
  actual: number;
  trend: number;
}

interface TrendResult {
  direction: "increasing" | "decreasing" | "flat";
  slope: number;
  intercept: number;
  projection: number;
  points: TrendPoint[];
}

interface OutlierResult {
  bounds: {
    q1: number;
    q3: number;
    iqr: number;
    lower_bound: number;
    upper_bound: number;
  };
  summary: {
    total_points: number;
    outlier_count: number;
  };
  points: Record<string, unknown>[];
  labelColumn: string | null;
}

interface CorrelationResult {
  matrix: Record<string, Record<string, number>>;
  plain_summary: string;
  strongest_positive: {
    columns: [string, string] | null;
    coefficient: number | null;
  };
  strongest_negative: {
    columns: [string, string] | null;
    coefficient: number | null;
  };
}

interface DotProps {
  cx?: number;
  cy?: number;
  payload?: {
    is_outlier?: boolean;
    [key: string]: unknown;
  };
}

export default function AdvancedInsights({
  parsedData,
  datasetLoaded,
  runQuery
}: AdvancedInsightsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>("trend");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Column Selectors State
  const [trendDateCol, setTrendDateCol] = useState("");
  const [trendMetricCol, setTrendMetricCol] = useState("");
  const [outlierMetricCol, setOutlierMetricCol] = useState("");

  // Results Cache
  const [trendResult, setTrendResult] = useState<TrendResult | null>(null);
  const [outlierResult, setOutlierResult] = useState<OutlierResult | null>(null);
  const [correlationResult, setCorrelationResult] = useState<CorrelationResult | null>(null);

  // Filter columns by type from parsedData schema
  const dateCols = useMemo(() => {
    return parsedData.schema.filter(c => c.currentType === "date");
  }, [parsedData.schema]);

  const numCols = useMemo(() => {
    return parsedData.schema.filter(c => c.currentType === "number" || c.currentType === "currency");
  }, [parsedData.schema]);

  // Set default column dropdown choices
  useEffect(() => {
    if (dateCols.length > 0) {
      setTrendDateCol(dateCols[0].columnName);
    }
    if (numCols.length > 0) {
      setTrendMetricCol(numCols[0].columnName);
      setOutlierMetricCol(numCols[0].columnName);
    }
  }, [dateCols, numCols]);

  // Helper to get currency details
  const getColCurrencySymbol = useCallback((colName: string): string => {
    const col = parsedData.schema.find(c => c.columnName === colName);
    return col?.currencySymbol || "$";
  }, [parsedData.schema]);

  const getColType = useCallback((colName: string): "number" | "currency" => {
    const col = parsedData.schema.find(c => c.columnName === colName);
    return (col?.currentType as "number" | "currency") || "number";
  }, [parsedData.schema]);

  // Main execution trigger
  const runAnalysis = async (tab: TabType) => {
    if (!datasetLoaded) return;
    setLoading(true);
    setError(null);

    try {
      if (tab === "trend") {
        if (!trendDateCol || !trendMetricCol) {
          throw new Error("Please select both a date column and a numeric column to forecast trends.");
        }

        const dateColSchema = parsedData.schema.find(c => c.columnName === trendDateCol);
        const metricColSchema = parsedData.schema.find(c => c.columnName === trendMetricCol);
        if (!dateColSchema || !metricColSchema) {
          throw new Error("Selected columns are invalid.");
        }

        // Query data from DuckDB-WASM first (restricted to 5000 rows & relevant columns)
        const sql = `
          SELECT
            "${dateColSchema.sqlSafeName}" AS "${trendDateCol}",
            "${metricColSchema.sqlSafeName}" AS "${trendMetricCol}"
          FROM dataset
          WHERE "${dateColSchema.sqlSafeName}" IS NOT NULL
            AND "${metricColSchema.sqlSafeName}" IS NOT NULL
          ORDER BY "${dateColSchema.sqlSafeName}" ASC
          LIMIT 5000
        `.trim();

        const dbRows = await runQuery(sql);
        if ("error" in dbRows) {
          throw new Error(`DuckDB query error: ${dbRows.error}`);
        }

        if (dbRows.length < 2) {
          throw new Error("Insufficient data points for trend analysis (minimum 2 valid data rows required).");
        }

        // POST JSON rows to serverless Python API
        const response = await fetch("/api/insights", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: "trend",
            data: dbRows,
            date_column: trendDateCol,
            metric_column: trendMetricCol
          })
        });

        const apiResult = await response.json();
        if (!response.ok || apiResult.status === "error") {
          throw new Error(apiResult.error || "Failed to execute Python statistical model.");
        }

        setTrendResult(apiResult.result);

      } else if (tab === "outlier") {
        if (!outlierMetricCol) {
          throw new Error("Please select a numeric column to detect outliers.");
        }

        const metricColSchema = parsedData.schema.find(c => c.columnName === outlierMetricCol);
        if (!metricColSchema) {
          throw new Error("Selected column is invalid.");
        }

        // UX touch: pull first date/label column if available to make outlier scatter plot tooltips amazing
        const labelCol = dateCols[0] || parsedData.schema.find(c => c.currentType === "category") || null;

        let sql = "";
        if (labelCol) {
          sql = `
            SELECT
              "${labelCol.sqlSafeName}" AS "${labelCol.columnName}",
              "${metricColSchema.sqlSafeName}" AS "${outlierMetricCol}"
            FROM dataset
            WHERE "${metricColSchema.sqlSafeName}" IS NOT NULL
            LIMIT 5000
          `.trim();
        } else {
          sql = `
            SELECT
              "${metricColSchema.sqlSafeName}" AS "${outlierMetricCol}"
            FROM dataset
            WHERE "${metricColSchema.sqlSafeName}" IS NOT NULL
            LIMIT 5000
          `.trim();
        }

        const dbRows = await runQuery(sql);
        if ("error" in dbRows) {
          throw new Error(`DuckDB query error: ${dbRows.error}`);
        }

        if (dbRows.length === 0) {
          throw new Error("Dataset has no rows to analyze.");
        }

        // POST JSON rows to serverless Python API
        const response = await fetch("/api/insights", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: "outlier",
            data: dbRows,
            metric_column: outlierMetricCol
          })
        });

        const apiResult = await response.json();
        if (!response.ok || apiResult.status === "error") {
          throw new Error(apiResult.error || "Failed to execute Python statistical model.");
        }

        setOutlierResult({
          ...apiResult.result,
          labelColumn: labelCol ? labelCol.columnName : null
        });

      } else if (tab === "correlation") {
        if (numCols.length < 2) {
          throw new Error("Not enough numeric columns for correlation analysis (minimum 2 required).");
        }

        // Select all numeric column SQL-safe representations
        const selectColsStr = numCols
          .map(c => `"${c.sqlSafeName}" AS "${c.columnName}"`)
          .join(", ");

        const sql = `
          SELECT ${selectColsStr}
          FROM dataset
          LIMIT 5000
        `.trim();

        const dbRows = await runQuery(sql);
        if ("error" in dbRows) {
          throw new Error(`DuckDB query error: ${dbRows.error}`);
        }

        if (dbRows.length < 2) {
          throw new Error("Insufficient numeric data rows to correlate.");
        }

        // POST JSON rows to serverless Python API
        const response = await fetch("/api/insights", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: "correlation",
            data: dbRows,
            numeric_columns: numCols.map(c => c.columnName)
          })
        });

        const apiResult = await response.json();
        if (!response.ok || apiResult.status === "error") {
          throw new Error(apiResult.error || "Failed to execute Python statistical model.");
        }

        setCorrelationResult(apiResult.result);
      }
    } catch (err: unknown) {
      console.error("Advanced Insights Analysis failed:", err);
      setError(err instanceof Error ? err.message : "Failed to run statistical analysis.");
    } finally {
      setLoading(false);
    }
  };

  // Re-run analysis automatically when active tab or inputs change (if panel is open)
  useEffect(() => {
    if (isOpen) {
      if (activeTab === "correlation" && !correlationResult) {
        runAnalysis("correlation");
      } else if (activeTab === "trend" && !trendResult && trendDateCol && trendMetricCol) {
        runAnalysis("trend");
      } else if (activeTab === "outlier" && !outlierResult && outlierMetricCol) {
        runAnalysis("outlier");
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, activeTab]);

  // Clear visual results cache when dataset changes
  useEffect(() => {
    setTrendResult(null);
    setOutlierResult(null);
    setCorrelationResult(null);
    setError(null);
  }, [parsedData.fileName]);

  // Custom Dot component to color outliers differently
  const OutlierDotRenderer = (props: DotProps) => {
    const { cx, cy, payload } = props;
    if (!payload || cx === undefined || cy === undefined) return null;
    if (payload.is_outlier) {
      return (
        <circle
          cx={cx}
          cy={cy}
          r={6}
          fill="#ef4444"
          stroke="#0f172a"
          strokeWidth={2}
          className="animate-pulse"
        >
          <title>{`Outlier! Value: ${payload[outlierMetricCol]}`}</title>
        </circle>
      );
    }
    return <circle cx={cx} cy={cy} r={3} fill="#3b82f6" />;
  };

  return (
    <div className="bg-[#111827] border border-gray-800 rounded-xl overflow-hidden flex flex-col">
      {/* Panel Header (Click to collapse/expand) */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="px-6 py-5 flex items-center justify-between hover:bg-gray-900/30 transition text-left w-full outline-none"
      >
        <div className="flex items-center space-x-3">
          <div className="bg-blue-500/10 p-2 rounded-lg border border-blue-500/20">
            <Brain className="h-5 w-5 text-blue-400" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-lg font-bold text-white">Advanced Insights (Python Statistical Layer)</h2>
              {!isOpen && (
                <span className="text-[10px] bg-gray-900 border border-gray-800 text-gray-400 font-semibold px-2 py-0.5 rounded">
                  Collapsed
                </span>
              )}
            </div>
            <p className="text-xs text-gray-400 mt-0.5">
              Leverage serverless Python (Pandas/Numpy) for advanced trend forecasting, outlier detection, and correlation.
            </p>
          </div>
        </div>
        <div className="text-gray-400">
          {isOpen ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
        </div>
      </button>

      {/* Panel Body */}
      {isOpen && (
        <div className="p-6 pt-0 border-t border-gray-800 space-y-6 animate-fade-in">
          {/* Tabs header row */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-800 pb-4 pt-4">
            <div className="flex space-x-1 bg-gray-950 p-1 rounded-lg border border-gray-850">
              {(["trend", "outlier", "correlation"] as const).map(tab => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-2 rounded-md text-xs font-bold uppercase tracking-wider transition ${
                    activeTab === tab
                      ? "bg-blue-600 text-white"
                      : "text-gray-400 hover:text-white hover:bg-gray-900"
                  }`}
                >
                  {tab === "trend" ? "📈 Trend Forecast" : tab === "outlier" ? "🚨 Outlier Detection" : "📊 Correlation"}
                </button>
              ))}
            </div>

            <button
              onClick={() => runAnalysis(activeTab)}
              disabled={loading || !datasetLoaded}
              className="flex items-center space-x-2 px-4 py-2 bg-gray-900 hover:bg-gray-800 text-gray-300 hover:text-white border border-gray-800 hover:border-gray-700 rounded-lg text-xs font-bold transition disabled:opacity-40"
            >
              {loading ? <RefreshCw className="h-3.5 w-3.5 animate-spin text-blue-400" /> : <RefreshCw className="h-3.5 w-3.5 text-gray-400" />}
              <span>{loading ? "Calculating..." : "Run Analysis"}</span>
            </button>
          </div>

          {/* Configuration forms (Column Pickers) */}
          {activeTab === "trend" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-950 border border-gray-850 p-4 rounded-xl text-xs">
              <div className="flex flex-col space-y-1.5">
                <label className="font-bold text-gray-400">Date/Time Dimension</label>
                <select
                  value={trendDateCol}
                  onChange={(e) => {
                    setTrendDateCol(e.target.value);
                    setTrendResult(null);
                  }}
                  className="bg-gray-900 border border-gray-800 rounded-lg p-2.5 text-white outline-none focus:border-blue-500 cursor-pointer text-xs"
                >
                  {dateCols.length === 0 && <option value="">No date columns found</option>}
                  {dateCols.map(col => (
                    <option key={col.columnName} value={col.columnName}>
                      📅 {col.displayName}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col space-y-1.5">
                <label className="font-bold text-gray-400">Numeric/Currency Metric</label>
                <select
                  value={trendMetricCol}
                  onChange={(e) => {
                    setTrendMetricCol(e.target.value);
                    setTrendResult(null);
                  }}
                  className="bg-gray-900 border border-gray-800 rounded-lg p-2.5 text-white outline-none focus:border-blue-500 cursor-pointer text-xs"
                >
                  {numCols.length === 0 && <option value="">No numeric columns found</option>}
                  {numCols.map(col => (
                    <option key={col.columnName} value={col.columnName}>
                      {col.currentType === "currency" ? "💰" : "🔢"} {col.displayName}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {activeTab === "outlier" && (
            <div className="bg-gray-950 border border-gray-850 p-4 rounded-xl text-xs flex flex-col space-y-1.5 max-w-md">
              <label className="font-bold text-gray-400">Numeric/Currency Metric</label>
              <select
                value={outlierMetricCol}
                onChange={(e) => {
                  setOutlierMetricCol(e.target.value);
                  setOutlierResult(null);
                }}
                className="bg-gray-900 border border-gray-800 rounded-lg p-2.5 text-white outline-none focus:border-blue-500 cursor-pointer text-xs"
              >
                {numCols.length === 0 && <option value="">No numeric columns found</option>}
                {numCols.map(col => (
                  <option key={col.columnName} value={col.columnName}>
                    {col.currentType === "currency" ? "💰" : "🔢"} {col.displayName}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Loading Indicator */}
          {loading && (
            <div className="flex flex-col items-center justify-center space-y-3 py-16">
              <RefreshCw className="h-8 w-8 text-blue-500 animate-spin" />
              <div className="text-center space-y-1">
                <p className="text-sm font-bold text-white">Transiting data to Serverless Python Model</p>
                <p className="text-xs text-gray-400 max-w-xs mx-auto">This utilizes pandas + numpy to run statistics client-queried DuckDB subset. Fast & secure.</p>
              </div>
            </div>
          )}

          {/* Error Banner */}
          {!loading && error && (
            <div className="flex items-start space-x-3 p-4 bg-rose-950/20 border border-rose-900/30 rounded-xl">
              <AlertCircle className="h-5 w-5 text-rose-500 mt-0.5 flex-shrink-0" />
              <div className="space-y-1">
                <p className="text-sm font-semibold text-rose-400">Analysis Unavailable</p>
                <p className="text-xs text-gray-300 leading-relaxed font-mono">{error}</p>
              </div>
            </div>
          )}

          {/* Results Render Area */}
          {!loading && !error && (
            <>
              {/* 1. Trend Forecast Render */}
              {activeTab === "trend" && trendResult && (
                <div className="space-y-6 animate-fade-in">
                  {/* Metric highlights */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-gray-950 border border-gray-850 p-4 rounded-xl space-y-1">
                      <span className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">Trend Direction</span>
                      <span className={`text-xl font-extrabold block capitalize ${
                        trendResult.direction === "increasing" ? "text-emerald-400" : trendResult.direction === "decreasing" ? "text-rose-400" : "text-gray-400"
                      }`}>
                        {trendResult.direction === "increasing" ? "📈 Increasing" : trendResult.direction === "decreasing" ? "📉 Decreasing" : "➡️ Flat"}
                      </span>
                    </div>

                    <div className="bg-gray-950 border border-gray-850 p-4 rounded-xl space-y-1">
                      <span className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">Linear Regression Slope</span>
                      <span className="text-xl font-extrabold text-white block font-mono">
                        {trendResult.slope.toFixed(4)}
                      </span>
                    </div>

                    <div className="bg-gray-950 border border-gray-850 p-4 rounded-xl space-y-1">
                      <span className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">Next Period Forecast</span>
                      <span className="text-xl font-extrabold text-blue-400 block font-mono">
                        {formatNumber(trendResult.projection, getColType(trendMetricCol), getColCurrencySymbol(trendMetricCol))}
                      </span>
                    </div>
                  </div>

                  {/* Recharts trend Line Chart */}
                  <div className="bg-gray-950 border border-gray-850 p-5 rounded-xl space-y-3">
                    <div className="flex items-center space-x-2">
                      <LineIcon className="h-4 w-4 text-blue-400" />
                      <span className="text-xs font-bold text-white uppercase tracking-wider">Actual vs Trend Line Regression Overlay</span>
                    </div>

                    <div className="h-72 w-full text-[10px] pt-4">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={trendResult.points} margin={{ top: 10, right: 10, left: 15, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
                          <XAxis
                            dataKey="date"
                            stroke="#6b7280"
                            tickLine={false}
                            axisLine={false}
                            dy={8}
                          />
                          <YAxis
                            stroke="#6b7280"
                            tickLine={false}
                            axisLine={false}
                            width={80}
                            tickFormatter={(v) => formatNumber(v, getColType(trendMetricCol), getColCurrencySymbol(trendMetricCol))}
                          />
                          <Tooltip
                            contentStyle={{ backgroundColor: "#111827", borderColor: "#374151", borderRadius: "8px" }}
                            itemStyle={{ color: "#f3f4f6" }}
                            labelStyle={{ color: "#9ca3af", fontWeight: "bold" }}
                            formatter={(value, name) => [
                              formatNumber(value as number, getColType(trendMetricCol), getColCurrencySymbol(trendMetricCol)),
                              name === "actual" ? "Actual Value" : "Trend Overlay"
                            ]}
                          />
                          <Legend verticalAlign="top" height={36} iconType="circle" />
                          <Line
                            type="monotone"
                            dataKey="actual"
                            name="Actual"
                            stroke="#3b82f6"
                            strokeWidth={2}
                            dot={{ r: 2.5 }}
                          />
                          <Line
                            type="monotone"
                            dataKey="trend"
                            name="Trend Line"
                            stroke="#10b981"
                            strokeDasharray="5 5"
                            strokeWidth={2}
                            dot={false}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Verbal narrative paragraph */}
                  <div className="p-4 bg-gray-950 border border-gray-850 rounded-xl text-xs leading-relaxed text-gray-300">
                    <strong>Trend analysis summary:</strong> Based on the linear regression fitting of <strong>{trendResult.points.length} data points</strong>, the overall direction of <strong>{trendMetricCol}</strong> is <span className="font-semibold text-white">{trendResult.direction}</span> (slope rate of <code className="text-gray-200">{trendResult.slope.toFixed(4)}</code> per step). The project equation predicts the upcoming step value will land around <strong className="text-blue-400">{formatNumber(trendResult.projection, getColType(trendMetricCol), getColCurrencySymbol(trendMetricCol))}</strong>.
                  </div>
                </div>
              )}

              {/* 2. Outlier Detection Render */}
              {activeTab === "outlier" && outlierResult && (
                <div className="space-y-6 animate-fade-in">
                  {/* Highlights */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-gray-950 border border-gray-850 p-4 rounded-xl space-y-1">
                      <span className="text-[10px] uppercase font-bold text-gray-500 tracking-wider font-sans">Outliers Flagged</span>
                      <span className={`text-xl font-extrabold block font-mono ${outlierResult.summary.outlier_count > 0 ? "text-rose-400" : "text-emerald-400"}`}>
                        {outlierResult.summary.outlier_count} Point{outlierResult.summary.outlier_count === 1 ? "" : "s"}
                      </span>
                    </div>

                    <div className="bg-gray-950 border border-gray-850 p-4 rounded-xl space-y-1">
                      <span className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">Calculated Lower Bound</span>
                      <span className="text-xl font-extrabold text-white block font-mono">
                        {formatNumber(outlierResult.bounds.lower_bound, getColType(outlierMetricCol), getColCurrencySymbol(outlierMetricCol))}
                      </span>
                    </div>

                    <div className="bg-gray-950 border border-gray-850 p-4 rounded-xl space-y-1">
                      <span className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">Calculated Upper Bound</span>
                      <span className="text-xl font-extrabold text-white block font-mono">
                        {formatNumber(outlierResult.bounds.upper_bound, getColType(outlierMetricCol), getColCurrencySymbol(outlierMetricCol))}
                      </span>
                    </div>

                    <div className="bg-gray-950 border border-gray-850 p-4 rounded-xl space-y-1">
                      <span className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">Interquartile Range (IQR)</span>
                      <span className="text-xl font-extrabold text-white block font-mono">
                        {formatNumber(outlierResult.bounds.iqr, getColType(outlierMetricCol), getColCurrencySymbol(outlierMetricCol))}
                      </span>
                    </div>
                  </div>

                  {/* Recharts Scatter Highlight overlay Line Chart */}
                  <div className="bg-gray-950 border border-gray-850 p-5 rounded-xl space-y-3">
                    <div className="flex items-center space-x-2">
                      <LineIcon className="h-4 w-4 text-blue-400" />
                      <span className="text-xs font-bold text-white uppercase tracking-wider">Outliers Highlighted in Red (Values Outside IQR Bounds)</span>
                    </div>

                    <div className="h-72 w-full text-[10px] pt-4">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={outlierResult.points} margin={{ top: 10, right: 10, left: 15, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
                          <XAxis
                            dataKey={outlierResult.labelColumn || undefined}
                            stroke="#6b7280"
                            tickLine={false}
                            axisLine={false}
                            dy={8}
                            tickFormatter={(v) => (v === undefined ? "" : String(v).length > 10 ? `${String(v).slice(0, 8)}...` : String(v))}
                          />
                          <YAxis
                            stroke="#6b7280"
                            tickLine={false}
                            axisLine={false}
                            width={80}
                            tickFormatter={(v) => formatNumber(v, getColType(outlierMetricCol), getColCurrencySymbol(outlierMetricCol))}
                          />
                          <Tooltip
                            contentStyle={{ backgroundColor: "#111827", borderColor: "#374151", borderRadius: "8px" }}
                            itemStyle={{ color: "#f3f4f6" }}
                            labelStyle={{ color: "#9ca3af", fontWeight: "bold" }}
                            formatter={(value, name, item) => {
                              const isOutlier = item.payload.is_outlier;
                              return [
                                `${formatNumber(value as number, getColType(outlierMetricCol), getColCurrencySymbol(outlierMetricCol))} ${isOutlier ? "🚨 OUTLIER" : ""}`,
                                outlierMetricCol
                              ];
                            }}
                          />
                          <Legend verticalAlign="top" height={36} iconType="circle" />
                          <Line
                            type="monotone"
                            dataKey={outlierMetricCol}
                            name={outlierMetricCol}
                            stroke="#3b82f6"
                            strokeWidth={1.5}
                            dot={<OutlierDotRenderer />}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* verbal narrative summary */}
                  <div className="p-4 bg-gray-950 border border-gray-850 rounded-xl text-xs leading-relaxed text-gray-300">
                    <strong>Outlier analysis summary:</strong> Out of <strong>{outlierResult.summary.total_points} total rows</strong>, standard 1.5x IQR boundary detection flagged <strong className="text-rose-400">{outlierResult.summary.outlier_count} point{outlierResult.summary.outlier_count === 1 ? "" : "s"}</strong> as statistical outliers. Quartile boundaries reside between <span className="text-white font-semibold">{formatNumber(outlierResult.bounds.lower_bound, getColType(outlierMetricCol), getColCurrencySymbol(outlierMetricCol))}</span> and <span className="text-white font-semibold">{formatNumber(outlierResult.bounds.upper_bound, getColType(outlierMetricCol), getColCurrencySymbol(outlierMetricCol))}</span>. Any value outside this threshold represents an extreme fluctuation worth auditing.
                  </div>
                </div>
              )}

              {/* 3. Correlation matrix heatmap rendering */}
              {activeTab === "correlation" && correlationResult && (
                <div className="space-y-6 animate-fade-in">
                  <div className="bg-gray-950 border border-gray-850 p-5 rounded-xl space-y-4">
                    <div className="flex items-center space-x-2 border-b border-gray-850 pb-3">
                      <TableProperties className="h-4 w-4 text-blue-400" />
                      <span className="text-xs font-bold text-white uppercase tracking-wider">Pairwise Correlation Heatmap Matrix</span>
                    </div>

                    <div className="overflow-x-auto w-full">
                      <table className="w-full text-left border-collapse table-fixed text-[11px] font-semibold text-gray-300">
                        <thead>
                          <tr className="border-b border-gray-800">
                            <th className="p-3 bg-gray-900 border-r border-gray-850 text-gray-400 w-32 font-bold truncate">Column</th>
                            {Object.keys(correlationResult.matrix).map(col => (
                              <th key={col} className="p-3 bg-gray-900 border-r border-gray-850 text-center font-bold truncate" title={col}>
                                {col}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-850">
                          {Object.keys(correlationResult.matrix).map(rowCol => (
                            <tr key={rowCol} className="hover:bg-gray-900/10">
                              <td className="p-3 bg-gray-900 border-r border-gray-850 font-bold truncate text-gray-400" title={rowCol}>
                                {rowCol}
                              </td>
                              {Object.keys(correlationResult.matrix).map(colCol => {
                                const score = correlationResult.matrix[rowCol][colCol];

                                // Color shading helper logic based on Pearson score (-1.0 to 1.0)
                                let bgClass = "bg-gray-950";
                                let textClass = "text-gray-400";

                                if (score >= 0.7) {
                                  bgClass = "bg-emerald-950/70 border border-emerald-900/60";
                                  textClass = "text-emerald-400 font-bold";
                                } else if (score >= 0.4) {
                                  bgClass = "bg-emerald-950/30 border border-emerald-950/20";
                                  textClass = "text-emerald-300";
                                } else if (score <= -0.7) {
                                  bgClass = "bg-rose-950/70 border border-rose-900/60";
                                  textClass = "text-rose-400 font-bold";
                                } else if (score <= -0.4) {
                                  bgClass = "bg-rose-950/30 border border-rose-950/20";
                                  textClass = "text-rose-300";
                                } else if (score > 0) {
                                  bgClass = "bg-gray-900/30";
                                  textClass = "text-gray-300";
                                }

                                return (
                                  <td
                                    key={colCol}
                                    className={`p-3 border-r border-gray-850 text-center font-mono text-xs ${bgClass} ${textClass}`}
                                  >
                                    {score.toFixed(3)}
                                  </td>
                                );
                              })}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* verbal narrative summary */}
                  <div className="p-4 bg-gray-950 border border-gray-850 rounded-xl text-xs leading-relaxed text-gray-300">
                    <strong>Correlation analysis narrative:</strong> {correlationResult.plain_summary}
                  </div>
                </div>
              )}
            </>
          )}

          {/* Graceful empty layout guidance */}
          {!loading && !error && !trendResult && !outlierResult && !correlationResult && (
            <div className="text-center py-12 bg-gray-950 border border-gray-850 rounded-xl space-y-3">
              <Binary className="h-8 w-8 text-gray-600 mx-auto" />
              <h4 className="text-sm font-bold text-white uppercase tracking-wider">Click &quot;Run Analysis&quot; to begin</h4>
              <p className="text-xs text-gray-400 max-w-sm mx-auto leading-relaxed">
                Choose parameters above and run calculations to see live statistical results powered by Pandas on serverless compute.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
