"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  TrendingUp,
  BarChart3,
  Hash,
  DollarSign,
  Layers,
  AlertCircle,
  Sparkles
} from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from "recharts";
import { ParsedResult } from "@/utils/parser";
import { formatNumber } from "@/utils/formatter";

interface DashboardProps {
  parsedData: ParsedResult;
  datasetLoaded: boolean;
  runQuery: (sql: string) => Promise<Record<string, unknown>[] | { error: string }>;
  onDashboardLoaded?: () => void;
}

export default function Dashboard({
  parsedData,
  datasetLoaded,
  runQuery,
  onDashboardLoaded
}: DashboardProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // States for database metrics
  const [rowMetrics, setRowMetrics] = useState<number | null>(null);
  const [kpiData, setKpiData] = useState<Record<string, { sum: number; avg: number; min: number; max: number }> | null>(null);
  const [lineChartsData, setLineChartsData] = useState<Record<string, { date_bucket: string; total_val: number }[]> | null>(null);
  const [lineChartGranularity, setLineChartGranularity] = useState<"daily" | "monthly">("daily");
  const [barChartsData, setBarChartsData] = useState<Record<string, { category: string; val: number }[]> | null>(null);

  // Determine current active schema columns
  const dateCols = useMemo(() => parsedData.schema.filter(c => c.currentType === "date"), [parsedData.schema]);
  const numCols = useMemo(() => parsedData.schema.filter(c => c.currentType === "number" || c.currentType === "currency"), [parsedData.schema]);
  const catCols = useMemo(() => parsedData.schema.filter(c => c.currentType === "category"), [parsedData.schema]);

  // Load the dashboard metrics
  const loadDashboardData = useCallback(async () => {
    if (!datasetLoaded) return;
    setLoading(true);
    setError(null);

    try {
      // 1. Fetch total row count
      const countRes = await runQuery("SELECT COUNT(*) as total_rows FROM dataset");
      if ("error" in countRes) throw new Error(countRes.error);
      const totalRows = Number(countRes[0]?.total_rows ?? 0);
      setRowMetrics(totalRows);

      // 2. Fetch KPI Metrics for each number/currency column
      const kpis: Record<string, { sum: number; avg: number; min: number; max: number }> = {};
      for (const col of numCols) {
        const sql = `
          SELECT
            SUM("${col.sqlSafeName}") as s,
            AVG("${col.sqlSafeName}") as a,
            MIN("${col.sqlSafeName}") as mn,
            MAX("${col.sqlSafeName}") as mx
          FROM dataset
        `;
        const res = await runQuery(sql);
        if ("error" in res) throw new Error(res.error);
        kpis[col.columnName] = {
          sum: Number(res[0]?.s ?? 0),
          avg: Number(res[0]?.a ?? 0),
          min: Number(res[0]?.mn ?? 0),
          max: Number(res[0]?.mx ?? 0),
        };
      }
      setKpiData(kpis);

      // 3. Determine Date Granularity (daily if <60 days, monthly if larger)
      let granularity: "daily" | "monthly" = "daily";
      if (dateCols.length > 0 && numCols.length > 0) {
        const dateCol = dateCols[0];
        const diffSql = `SELECT DATEDIFF('day', MIN("${dateCol.sqlSafeName}"), MAX("${dateCol.sqlSafeName}")) as days_diff FROM dataset`;
        const diffRes = await runQuery(diffSql);
        if (!("error" in diffRes) && diffRes[0]) {
          const daysDiff = diffRes[0].days_diff;
          if (daysDiff !== null && daysDiff !== undefined && Number(daysDiff) >= 60) {
            granularity = "monthly";
          }
        }
      }
      setLineChartGranularity(granularity);

      // 4. Fetch Line Charts Data (Cap at first 4 numeric columns vs date column)
      const lineData: Record<string, { date_bucket: string; total_val: number }[]> = {};
      if (dateCols.length > 0 && numCols.length > 0) {
        const dateCol = dateCols[0];
        const lineChartCols = numCols.slice(0, 4);
        for (const col of lineChartCols) {
          const formatStr = granularity === "monthly" ? "%Y-%m" : "%Y-%m-%d";
          const sql = `
            SELECT
              strftime("${dateCol.sqlSafeName}", '${formatStr}') as date_bucket,
              SUM("${col.sqlSafeName}") as total_val
            FROM dataset
            WHERE "${dateCol.sqlSafeName}" IS NOT NULL
            GROUP BY 1
            ORDER BY date_bucket ASC
          `;
          const res = await runQuery(sql);
          if ("error" in res) throw new Error(res.error);
          lineData[col.columnName] = res.map(row => ({
            date_bucket: String(row.date_bucket ?? "N/A"),
            total_val: Number(row.total_val ?? 0),
          }));
        }
      }
      setLineChartsData(lineData);

      // 5. Fetch Bar Charts Data (Cap at first 4 category columns)
      const barData: Record<string, { category: string; val: number }[]> = {};
      if (catCols.length > 0) {
        const catColsToUse = catCols.slice(0, 4);
        const firstNum = numCols[0];

        for (const col of catColsToUse) {
          let sql = "";
          if (firstNum) {
            // Pair category with the FIRST numeric/currency column
            sql = `
              WITH ranked_categories AS (
                SELECT
                  "${col.sqlSafeName}" AS category,
                  SUM("${firstNum.sqlSafeName}") AS val,
                  ROW_NUMBER() OVER (ORDER BY SUM("${firstNum.sqlSafeName}") DESC) as rnk
                FROM dataset
                WHERE "${col.sqlSafeName}" IS NOT NULL
                GROUP BY 1
              ),
              top10 AS (
                SELECT category, val, rnk
                FROM ranked_categories
                WHERE rnk <= 10
              ),
              others AS (
                SELECT 'Other' AS category, SUM(val) AS val, 11 AS rnk
                FROM ranked_categories
                WHERE rnk > 10
              )
              SELECT category, val, rnk FROM top10
              UNION ALL
              SELECT category, val, rnk FROM others WHERE val IS NOT NULL
              ORDER BY rnk ASC;
            `;
          } else {
            // Category alone (Row counts) - only triggered if NO numeric columns at all
            sql = `
              WITH ranked_categories AS (
                SELECT
                  "${col.sqlSafeName}" AS category,
                  COUNT(*) AS val,
                  ROW_NUMBER() OVER (ORDER BY COUNT(*) DESC) as rnk
                FROM dataset
                WHERE "${col.sqlSafeName}" IS NOT NULL
                GROUP BY 1
              ),
              top10 AS (
                SELECT category, val, rnk
                FROM ranked_categories
                WHERE rnk <= 10
              ),
              others AS (
                SELECT 'Other' AS category, SUM(val) AS val, 11 AS rnk
                FROM ranked_categories
                WHERE rnk > 10
              )
              SELECT category, val, rnk FROM top10
              UNION ALL
              SELECT category, val, rnk FROM others WHERE val IS NOT NULL
              ORDER BY rnk ASC;
            `;
          }

          const res = await runQuery(sql);
          if ("error" in res) throw new Error(res.error);
          barData[col.columnName] = res.map(row => ({
            category: String(row.category ?? "N/A"),
            val: Number(row.val ?? 0),
          }));
        }
      }
      setBarChartsData(barData);

      // Callback to parent component to signal query completion
      if (onDashboardLoaded) {
        onDashboardLoaded();
      }
    } catch (err: unknown) {
      console.error("Dashboard calculation failed:", err);
      setError(err instanceof Error ? err.message : "Failed to load dashboard statistics.");
    } finally {
      setLoading(false);
    }
  }, [datasetLoaded, dateCols, numCols, catCols, runQuery, onDashboardLoaded]);

  // Re-run queries when dataset or metadata changes
  useEffect(() => {
    if (datasetLoaded) {
      loadDashboardData();
    }
  }, [datasetLoaded, parsedData.schema, loadDashboardData]);

  // Helper to get currency metadata
  const getColCurrencySymbol = useCallback((colName: string): string => {
    const col = parsedData.schema.find(c => c.columnName === colName);
    return col?.currencySymbol || "$";
  }, [parsedData.schema]);

  // Loading skeleton screen
  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        {/* KPI Row Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, idx) => (
            <div key={idx} className="bg-[#111827] border border-gray-800 p-5 rounded-xl space-y-3">
              <div className="h-4 w-24 bg-gray-800 rounded"></div>
              <div className="h-8 w-32 bg-gray-800 rounded"></div>
              <div className="h-3 w-44 bg-gray-800 rounded pt-2"></div>
            </div>
          ))}
        </div>

        {/* Charts Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[...Array(2)].map((_, idx) => (
            <div key={idx} className="bg-[#111827] border border-gray-800 p-6 rounded-xl space-y-4">
              <div className="h-5 w-48 bg-gray-800 rounded"></div>
              <div className="h-64 w-full bg-gray-800/50 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Error state display
  if (error) {
    return (
      <div className="flex items-start space-x-3 p-5 bg-rose-950/20 border border-rose-900/30 rounded-xl">
        <AlertCircle className="h-5 w-5 text-rose-500 mt-0.5 flex-shrink-0" />
        <div className="space-y-1">
          <p className="text-sm font-semibold text-rose-400">Dashboard Generation Error</p>
          <p className="text-xs text-gray-300 leading-relaxed font-mono">{error}</p>
        </div>
      </div>
    );
  }

  // Verify if we actually have generated dashboard components
  const hasKpiCards = numCols.length > 0 || rowMetrics !== null;
  const hasLineCharts = lineChartsData && Object.keys(lineChartsData).length > 0;
  const hasBarCharts = barChartsData && Object.keys(barChartsData).length > 0;

  if (!hasKpiCards && !hasLineCharts && !hasBarCharts) {
    return (
      <div className="text-center py-12 px-6 bg-[#111827] border border-gray-800 rounded-xl space-y-4">
        <Sparkles className="h-10 w-10 text-gray-600 mx-auto" />
        <h3 className="text-lg font-bold text-white">No Dashboard Generated</h3>
        <p className="text-sm text-gray-400 max-w-md mx-auto leading-relaxed">
          We analyzed your dataset columns but couldn&apos;t generate automatic charts. This usually happens if the dataset contains only general text columns.
        </p>
        <p className="text-xs text-blue-400 font-medium">
          Try overriding column types to Date, Category, or Number/Currency above!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">

      {/* KPI Stats Cards Row/Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Row Count Card */}
        {rowMetrics !== null && (
          <div className="bg-[#111827] border border-gray-800 p-5 rounded-xl hover:border-gray-700/80 transition-all flex flex-col justify-between relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-3 text-gray-800 group-hover:text-gray-700 transition">
              <Layers className="h-14 w-14 translate-x-3 -translate-y-3 opacity-15" />
            </div>
            <div>
              <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">Total Rows</span>
              <span className="text-3xl font-extrabold text-white mt-1.5 block tracking-tight">
                {rowMetrics.toLocaleString()}
              </span>
            </div>
            <div className="text-[11px] text-gray-500 font-semibold mt-3 pt-2 border-t border-gray-800/40">
              Complete database size
            </div>
          </div>
        )}

        {/* Dynamic Metric Columns cards */}
        {numCols.map((col) => {
          const stats = kpiData?.[col.columnName];
          if (!stats) return null;

          const isCurrency = col.currentType === "currency";
          const sym = isCurrency ? getColCurrencySymbol(col.columnName) : undefined;

          return (
            <div key={col.columnName} className="bg-[#111827] border border-gray-800 p-5 rounded-xl hover:border-gray-700/80 transition-all flex flex-col justify-between relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-3 text-gray-800 group-hover:text-gray-700 transition">
                {isCurrency ? (
                  <DollarSign className="h-14 w-14 translate-x-3 -translate-y-3 opacity-15" />
                ) : (
                  <Hash className="h-14 w-14 translate-x-3 -translate-y-3 opacity-15" />
                )}
              </div>

              <div>
                <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block truncate max-w-[190px]" title={col.displayName}>
                  Total {col.displayName}
                </span>
                <span className="text-3xl font-extrabold text-white mt-1.5 block tracking-tight truncate">
                  {formatNumber(stats.sum, col.currentType as "number" | "currency", sym)}
                </span>
              </div>

              {/* Sub-aggregates Grid */}
              <div className="grid grid-cols-3 gap-1 text-[10px] text-gray-400 font-semibold mt-4 pt-2 border-t border-gray-800/40">
                <div>
                  <span className="text-gray-500 block uppercase tracking-wide text-[9px]">Average</span>
                  <span className="truncate block mt-0.5 text-gray-200" title={formatNumber(stats.avg, col.currentType as "number" | "currency", sym)}>
                    {formatNumber(stats.avg, col.currentType as "number" | "currency", sym)}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500 block uppercase tracking-wide text-[9px]">Minimum</span>
                  <span className="truncate block mt-0.5 text-gray-200" title={formatNumber(stats.min, col.currentType as "number" | "currency", sym)}>
                    {formatNumber(stats.min, col.currentType as "number" | "currency", sym)}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500 block uppercase tracking-wide text-[9px]">Maximum</span>
                  <span className="truncate block mt-0.5 text-gray-200" title={formatNumber(stats.max, col.currentType as "number" | "currency", sym)}>
                    {formatNumber(stats.max, col.currentType as "number" | "currency", sym)}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Generated Charts Responsive Grid (2 columns on desktop, 1 on mobile) */}
      {(hasLineCharts || hasBarCharts) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* 1. Line Charts */}
          {hasLineCharts && lineChartsData && Object.keys(lineChartsData).map((colName) => {
            const data = lineChartsData[colName];
            const isCurrency = parsedData.schema.find(c => c.columnName === colName)?.currentType === "currency";
            const sym = isCurrency ? getColCurrencySymbol(colName) : undefined;
            const displayName = parsedData.schema.find(c => c.columnName === colName)?.displayName || colName;

            return (
              <div key={colName} className="bg-[#111827] border border-gray-800 p-6 rounded-xl flex flex-col space-y-4 shadow-xl">
                <div className="flex items-center justify-between border-b border-gray-850 pb-3">
                  <div className="flex items-center space-x-2">
                    <TrendingUp className="h-4 w-4 text-[#3b82f6]" />
                    <h3 className="text-sm font-bold text-white tracking-wide uppercase">
                      {displayName} by {lineChartGranularity === "monthly" ? "Month" : "Day"}
                    </h3>
                  </div>
                  <span className="text-[10px] bg-blue-950/40 text-blue-400 border border-blue-900/30 font-semibold px-2 py-0.5 rounded-full capitalize">
                    {lineChartGranularity} Trend
                  </span>
                </div>

                <div className="h-64 w-full text-xs">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data} margin={{ top: 10, right: 10, left: 15, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
                      <XAxis
                        dataKey="date_bucket"
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
                        tickFormatter={(v) => formatNumber(v, isCurrency ? "currency" : "number", sym)}
                      />
                      <Tooltip
                        contentStyle={{ backgroundColor: "#111827", borderColor: "#374151", borderRadius: "8px" }}
                        itemStyle={{ color: "#f3f4f6" }}
                        labelStyle={{ color: "#9ca3af", fontWeight: "bold" }}
                        formatter={(value) => [formatNumber(value, isCurrency ? "currency" : "number", sym), displayName]}
                      />
                      <Legend verticalAlign="top" height={36} iconType="circle" />
                      <Line
                        type="monotone"
                        dataKey="total_val"
                        name={displayName}
                        stroke="#3b82f6"
                        strokeWidth={2.5}
                        activeDot={{ r: 6 }}
                        dot={{ r: 3, strokeWidth: 1.5 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            );
          })}

          {/* 2. Bar Charts */}
          {hasBarCharts && barChartsData && Object.keys(barChartsData).map((colName) => {
            const data = barChartsData[colName];
            const catColDisplayName = parsedData.schema.find(c => c.columnName === colName)?.displayName || colName;

            // Determine if paired with a metric or counting rows
            const firstNum = numCols[0];
            const metricName = firstNum ? firstNum.displayName : "Count";
            const isCurrency = firstNum?.currentType === "currency";
            const sym = isCurrency ? getColCurrencySymbol(firstNum.columnName) : undefined;
            const metricType = firstNum ? (firstNum.currentType as "number" | "currency") : "number";

            return (
              <div key={colName} className="bg-[#111827] border border-gray-800 p-6 rounded-xl flex flex-col space-y-4 shadow-xl">
                <div className="flex items-center justify-between border-b border-gray-850 pb-3">
                  <div className="flex items-center space-x-2">
                    <BarChart3 className="h-4 w-4 text-[#10b981]" />
                    <h3 className="text-sm font-bold text-white tracking-wide uppercase">
                      {metricName} by {catColDisplayName}
                    </h3>
                  </div>
                  <span className="text-[10px] bg-emerald-950/40 text-emerald-400 border border-emerald-900/30 font-semibold px-2 py-0.5 rounded-full">
                    Top 10 categories
                  </span>
                </div>

                <div className="h-64 w-full text-xs">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data} margin={{ top: 10, right: 10, left: 15, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
                      <XAxis
                        dataKey="category"
                        stroke="#6b7280"
                        tickLine={false}
                        axisLine={false}
                        dy={8}
                        tickFormatter={(v) => (String(v).length > 12 ? `${String(v).slice(0, 10)}...` : String(v))}
                      />
                      <YAxis
                        stroke="#6b7280"
                        tickLine={false}
                        axisLine={false}
                        width={80}
                        tickFormatter={(v) => formatNumber(v, metricType, sym)}
                      />
                      <Tooltip
                        contentStyle={{ backgroundColor: "#111827", borderColor: "#374151", borderRadius: "8px" }}
                        itemStyle={{ color: "#f3f4f6" }}
                        labelStyle={{ color: "#9ca3af", fontWeight: "bold" }}
                        formatter={(value) => [formatNumber(value, metricType, sym), metricName]}
                      />
                      <Legend verticalAlign="top" height={36} iconType="circle" />
                      <Bar
                        dataKey="val"
                        name={metricName}
                        fill="#10b981"
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            );
          })}

        </div>
      )}

    </div>
  );
}
