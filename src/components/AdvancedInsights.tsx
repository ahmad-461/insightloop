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

  useEffect(() => {
    setTrendResult(null);
    setOutlierResult(null);
    setCorrelationResult(null);
    setError(null);
  }, [parsedData.fileName]);

  const OutlierDotRenderer = (props: DotProps) => {
    const { cx, cy, payload } = props;
    if (!payload || cx === undefined || cy === undefined) return null;
    if (payload.is_outlier) {
      return (
        <circle
          cx={cx}
          cy={cy}
          r={5}
          fill="var(--warning)"
          stroke="var(--bg)"
          strokeWidth={1.5}
        >
          <title>{`Outlier Value: ${payload[outlierMetricCol]}`}</title>
        </circle>
      );
    }
    return <circle cx={cx} cy={cy} r={3} fill="var(--accent)" />;
  };

  return (
    <div className="bg-surface border border-border rounded-lg overflow-hidden flex flex-col shadow-sm font-sans">
      {/* Panel Header */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="px-5 py-4 flex items-center justify-between hover:bg-surface-subtle transition-all text-left w-full outline-none focus-visible:bg-surface-subtle"
      >
        <div className="flex items-center space-x-2.5">
          <div className="p-1.5 rounded-lg border border-border text-accent bg-surface">
            <Brain className="h-4.5 w-4.5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="font-sans text-xs font-bold text-foreground uppercase tracking-wider">Advanced Insights (Python Statistical Layer)</h2>
              {!isOpen && (
                <span className="text-[9px] bg-background border border-border text-muted font-medium px-1.5 py-0.5 rounded">
                  Collapsed
                </span>
              )}
            </div>
            <p className="text-[10px] text-muted mt-0.5 font-normal">
              Leverage serverless Python (Pandas/Numpy) for advanced trend forecasting, outlier detection, and correlation.
            </p>
          </div>
        </div>
        <div className="text-foreground">
          {isOpen ? <ChevronUp className="h-4.5 w-4.5" /> : <ChevronDown className="h-4.5 w-4.5" />}
        </div>
      </button>

      {/* Panel Body */}
      {isOpen && (
        <div className="p-5 pt-0 border-t border-border space-y-4 animate-fade-in">
          {/* Tabs header row */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-3 pt-3">
            <div className="flex space-x-1.5 bg-background p-1.5 rounded-lg border border-border">
              {(["trend", "outlier", "correlation"] as const).map(tab => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveTab(tab)}
                  className={`px-3 py-1 rounded-lg text-xs font-medium uppercase tracking-wider transition-colors focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none ${
                    activeTab === tab
                      ? "bg-accent text-white"
                      : "text-muted hover:text-foreground"
                  }`}
                >
                  {tab === "trend" ? "Trend Forecast" : tab === "outlier" ? "Outlier Detection" : "Correlation"}
                </button>
              ))}
            </div>

            <button
              onClick={() => runAnalysis(activeTab)}
              disabled={loading || !datasetLoaded}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-background hover:bg-surface-subtle text-muted hover:text-foreground border border-border rounded-lg text-xs font-medium transition-colors focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
            >
              {loading ? <RefreshCw className="h-3.5 w-3.5 animate-spin text-accent" /> : <RefreshCw className="h-3.5 w-3.5 text-muted" />}
              <span>{loading ? "Calculating..." : "Run Analysis"}</span>
            </button>
          </div>

          {/* Configuration forms */}
          {activeTab === "trend" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-background border border-border p-3 rounded-lg text-xs font-normal">
              <div className="flex flex-col space-y-1">
                <label className="font-bold text-muted">Date/Time Dimension</label>
                <select
                  value={trendDateCol}
                  onChange={(e) => {
                    setTrendDateCol(e.target.value);
                    setTrendResult(null);
                  }}
                  className="bg-surface border border-border rounded-lg p-2 text-foreground outline-none focus:border-accent cursor-pointer text-xs font-medium focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
                >
                  {dateCols.length === 0 && <option value="">No date columns found</option>}
                  {dateCols.map(col => (
                    <option key={col.columnName} value={col.columnName}>
                      📅 {col.displayName}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col space-y-1">
                <label className="font-bold text-muted">Numeric/Currency Metric</label>
                <select
                  value={trendMetricCol}
                  onChange={(e) => {
                    setTrendMetricCol(e.target.value);
                    setTrendResult(null);
                  }}
                  className="bg-surface border border-border rounded-lg p-2 text-foreground outline-none focus:border-accent cursor-pointer text-xs font-medium focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
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
            <div className="bg-background border border-border p-3 rounded-lg text-xs flex flex-col space-y-1 max-w-md font-normal">
              <label className="font-bold text-muted">Numeric/Currency Metric</label>
              <select
                value={outlierMetricCol}
                onChange={(e) => {
                  setOutlierMetricCol(e.target.value);
                  setOutlierResult(null);
                }}
                className="bg-surface border border-border rounded-lg p-2 text-foreground outline-none focus:border-accent cursor-pointer text-xs font-medium focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
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
            <div className="flex flex-col items-center justify-center space-y-2 py-10">
              <RefreshCw className="h-6 w-6 text-accent animate-spin" />
              <div className="text-center space-y-0.5">
                <p className="font-sans text-xs font-bold text-foreground uppercase tracking-wider">Transiting data to Serverless Python Model</p>
                <p className="text-[10px] text-muted max-w-xs mx-auto">This utilizes pandas + numpy to run statistics securely. Fast & private.</p>
              </div>
            </div>
          )}

          {/* Error Banner */}
          {!loading && error && (
            <div className="flex items-start space-x-2.5 p-3.5 bg-rose-500/10 border border-rose-500/20 rounded-lg">
              <AlertCircle className="h-4 w-4 text-rose-500 mt-0.5 flex-shrink-0" />
              <div className="space-y-1">
                <p className="text-xs font-bold text-rose-600">Analysis Unavailable</p>
                <p className="text-xs text-muted leading-relaxed font-mono">{error}</p>
              </div>
            </div>
          )}

          {/* Results Render Area */}
          {!loading && !error && (
            <>
              {/* 1. Trend Forecast */}
              {activeTab === "trend" && trendResult && (
                <div className="space-y-4 animate-fade-in font-sans">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-background border border-border p-3.5 rounded-lg space-y-0.5">
                      <span className="text-[9px] uppercase font-bold text-muted tracking-wider block">Trend Direction</span>
                      <span className={`text-base font-bold block capitalize ${
                        trendResult.direction === "increasing" ? "text-success" : trendResult.direction === "decreasing" ? "text-rose-500" : "text-muted"
                      }`}>
                        {trendResult.direction === "increasing" ? "📈 Increasing" : trendResult.direction === "decreasing" ? "📉 Decreasing" : "➡️ Flat"}
                      </span>
                    </div>

                    <div className="bg-background border border-border p-3.5 rounded-lg space-y-0.5">
                      <span className="text-[9px] uppercase font-bold text-muted tracking-wider block">Linear Regression Slope</span>
                      <span className="text-base font-bold text-foreground block font-mono">
                        {trendResult.slope.toFixed(4)}
                      </span>
                    </div>

                    <div className="bg-background border border-border p-3.5 rounded-lg space-y-0.5">
                      <span className="text-[9px] uppercase font-bold text-muted tracking-wider block">Next Period Forecast</span>
                      <span className="text-base font-bold text-accent block font-mono">
                        {formatNumber(trendResult.projection, getColType(trendMetricCol), getColCurrencySymbol(trendMetricCol))}
                      </span>
                    </div>
                  </div>

                  <div className="bg-background border border-border p-4 rounded-lg space-y-2">
                    <div className="flex items-center space-x-1.5">
                      <LineIcon className="h-4 w-4 text-accent" />
                      <span className="text-[10px] font-bold text-foreground uppercase tracking-wider">Actual vs Trend Line Regression Overlay</span>
                    </div>

                    <div className="h-60 w-full text-[10px] pt-2 select-none">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={trendResult.points} margin={{ top: 10, right: 10, left: 15, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                          <XAxis
                            dataKey="date"
                            stroke="var(--text-secondary)"
                            tickLine={false}
                            axisLine={false}
                            dy={8}
                          />
                          <YAxis
                            stroke="var(--text-secondary)"
                            tickLine={false}
                            axisLine={false}
                            width={80}
                            tickFormatter={(v) => formatNumber(v, getColType(trendMetricCol), getColCurrencySymbol(trendMetricCol))}
                          />
                          <Tooltip
                            contentStyle={{ backgroundColor: "var(--surface)", borderColor: "var(--border)", borderRadius: "6px" }}
                            itemStyle={{ color: "var(--text-primary)" }}
                            labelStyle={{ color: "var(--text-secondary)", fontWeight: "500" }}
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
                            stroke="var(--accent)"
                            strokeWidth={2}
                            dot={{ r: 2 }}
                          />
                          <Line
                            type="monotone"
                            dataKey="trend"
                            name="Trend Line"
                            stroke="var(--text-secondary)"
                            strokeDasharray="4 4"
                            strokeWidth={1.5}
                            dot={false}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  <div className="p-3 bg-background border border-border rounded-lg text-xs leading-relaxed text-muted">
                    <strong className="text-foreground font-medium">Trend Summary:</strong> Based on the linear regression fitting of <strong className="text-foreground font-medium">{trendResult.points.length} data points</strong>, the overall direction of <span className="font-semibold text-foreground">{trendMetricCol}</span> is <span className="font-semibold text-foreground">{trendResult.direction}</span> (slope rate of <code className="text-foreground">{trendResult.slope.toFixed(4)}</code> per step). The project equation predicts the upcoming step value will land around <strong className="text-accent font-semibold">{formatNumber(trendResult.projection, getColType(trendMetricCol), getColCurrencySymbol(trendMetricCol))}</strong>.
                  </div>
                </div>
              )}

              {/* 2. Outlier Detection */}
              {activeTab === "outlier" && outlierResult && (
                <div className="space-y-4 animate-fade-in font-sans">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-background border border-border p-3 rounded-lg space-y-0.5">
                      <span className="text-[9px] uppercase font-bold text-muted tracking-wider block font-sans">Outliers Flagged</span>
                      <span className={`text-base font-bold block font-mono ${outlierResult.summary.outlier_count > 0 ? "text-warning" : "text-success"}`}>
                        {outlierResult.summary.outlier_count} Point{outlierResult.summary.outlier_count === 1 ? "" : "s"}
                      </span>
                    </div>

                    <div className="bg-background border border-border p-3 rounded-lg space-y-0.5">
                      <span className="text-[9px] uppercase font-bold text-muted tracking-wider block">Lower Bound</span>
                      <span className="text-base font-bold text-foreground block font-mono">
                        {formatNumber(outlierResult.bounds.lower_bound, getColType(outlierMetricCol), getColCurrencySymbol(outlierMetricCol))}
                      </span>
                    </div>

                    <div className="bg-background border border-border p-3 rounded-lg space-y-0.5">
                      <span className="text-[9px] uppercase font-bold text-muted tracking-wider block">Upper Bound</span>
                      <span className="text-base font-bold text-foreground block font-mono">
                        {formatNumber(outlierResult.bounds.upper_bound, getColType(outlierMetricCol), getColCurrencySymbol(outlierMetricCol))}
                      </span>
                    </div>

                    <div className="bg-background border border-border p-3 rounded-lg space-y-0.5">
                      <span className="text-[9px] uppercase font-bold text-muted tracking-wider block">IQR</span>
                      <span className="text-base font-bold text-foreground block font-mono">
                        {formatNumber(outlierResult.bounds.iqr, getColType(outlierMetricCol), getColCurrencySymbol(outlierMetricCol))}
                      </span>
                    </div>
                  </div>

                  <div className="bg-background border border-border p-4 rounded-lg space-y-2">
                    <div className="flex items-center space-x-1.5">
                      <LineIcon className="h-4 w-4 text-accent" />
                      <span className="text-[10px] font-bold text-foreground uppercase tracking-wider">Outliers Highlighted in Amber (Outside IQR Bounds)</span>
                    </div>

                    <div className="h-60 w-full text-[10px] pt-2 select-none">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={outlierResult.points} margin={{ top: 10, right: 10, left: 15, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                          <XAxis
                            dataKey={outlierResult.labelColumn || undefined}
                            stroke="var(--text-secondary)"
                            tickLine={false}
                            axisLine={false}
                            dy={8}
                            tickFormatter={(v) => (v === undefined ? "" : String(v).length > 10 ? `${String(v).slice(0, 8)}...` : String(v))}
                          />
                          <YAxis
                            stroke="var(--text-secondary)"
                            tickLine={false}
                            axisLine={false}
                            width={80}
                            tickFormatter={(v) => formatNumber(v, getColType(outlierMetricCol), getColCurrencySymbol(outlierMetricCol))}
                          />
                          <Tooltip
                            contentStyle={{ backgroundColor: "var(--surface)", borderColor: "var(--border)", borderRadius: "6px" }}
                            itemStyle={{ color: "var(--text-primary)" }}
                            labelStyle={{ color: "var(--text-secondary)", fontWeight: "500" }}
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
                            stroke="var(--accent)"
                            strokeWidth={1.5}
                            dot={<OutlierDotRenderer />}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  <div className="p-3 bg-background border border-border rounded-lg text-xs leading-relaxed text-muted">
                    <strong className="text-foreground">Outlier summary:</strong> Out of <strong className="text-foreground">{outlierResult.summary.total_points} total rows</strong>, standard 1.5x IQR boundary detection flagged <strong className="text-warning font-semibold">{outlierResult.summary.outlier_count} point{outlierResult.summary.outlier_count === 1 ? "" : "s"}</strong> as statistical outliers. Quartile boundaries reside between <span className="text-foreground font-semibold">{formatNumber(outlierResult.bounds.lower_bound, getColType(outlierMetricCol), getColCurrencySymbol(outlierMetricCol))}</span> and <span className="text-foreground font-semibold">{formatNumber(outlierResult.bounds.upper_bound, getColType(outlierMetricCol), getColCurrencySymbol(outlierMetricCol))}</span>.
                  </div>
                </div>
              )}

              {/* 3. Correlation */}
              {activeTab === "correlation" && correlationResult && (
                <div className="space-y-4 animate-fade-in font-sans">
                  <div className="bg-background border border-border p-4 rounded-lg space-y-3">
                    <div className="flex items-center space-x-1.5 border-b border-border pb-2.5">
                      <TableProperties className="h-4 w-4 text-accent" />
                      <span className="font-sans text-[10px] font-bold text-foreground uppercase tracking-wider">Pairwise Correlation Heatmap Matrix</span>
                    </div>

                    <div className="overflow-x-auto w-full select-none">
                      <table className="w-full text-left border-collapse table-fixed text-[10px] font-medium text-muted">
                        <thead>
                          <tr className="border-b border-border">
                            <th className="p-2.5 bg-surface border-r border-border text-muted w-28 font-bold truncate">Column</th>
                            {Object.keys(correlationResult.matrix).map(col => (
                              <th key={col} className="p-2.5 bg-surface border-r border-border text-center font-bold truncate" title={col}>
                                {col}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                          {Object.keys(correlationResult.matrix).map(rowCol => (
                            <tr key={rowCol} className="hover:bg-surface-subtle">
                              <td className="p-2.5 bg-surface border-r border-border font-bold truncate text-muted" title={rowCol}>
                                {rowCol}
                              </td>
                              {Object.keys(correlationResult.matrix).map(colCol => {
                                const score = correlationResult.matrix[rowCol][colCol];

                                let bgClass = "bg-background";
                                let textClass = "text-muted";

                                if (score >= 0.7) {
                                  bgClass = "bg-success/15 border border-success/20";
                                  textClass = "text-success font-bold";
                                } else if (score >= 0.4) {
                                  bgClass = "bg-success/5 border border-success/10";
                                  textClass = "text-success/90";
                                } else if (score <= -0.7) {
                                  bgClass = "bg-rose-500/10 border border-rose-500/20";
                                  textClass = "text-rose-500 font-bold";
                                } else if (score <= -0.4) {
                                  bgClass = "bg-rose-500/5 border border-rose-500/10";
                                  textClass = "text-rose-400";
                                } else if (score > 0) {
                                  bgClass = "bg-surface/10";
                                  textClass = "text-foreground";
                                }

                                return (
                                  <td
                                    key={colCol}
                                    className={`p-2.5 border-r border-border last:border-r-0 text-center font-mono text-xs ${bgClass} ${textClass}`}
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

                  <div className="p-3 bg-background border border-border rounded-lg text-xs leading-relaxed text-muted">
                    <strong className="text-foreground">Correlation summary:</strong> {correlationResult.plain_summary}
                  </div>
                </div>
              )}
            </>
          )}

          {!loading && !error && !trendResult && !outlierResult && !correlationResult && (
            <div className="text-center py-10 bg-background border border-border rounded-lg space-y-2">
              <Binary className="h-6 w-6 text-muted/30 mx-auto" />
              <h4 className="font-sans text-[10px] font-bold text-foreground uppercase tracking-wider">Click &quot;Run Analysis&quot; to begin</h4>
              <p className="text-xs text-muted max-w-sm mx-auto leading-relaxed">
                Choose parameters above and run calculations to see live statistical results powered by Pandas on serverless compute.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
