"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  TrendingUp,
  BarChart3,
  Hash,
  DollarSign,
  AlertCircle,
  Sparkles,
  ChevronUp,
  ChevronDown,
  Trash2,
  Plus,
  Save,
  RefreshCw,
  X,
  CheckCircle2
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
import { ParsedResult, ColumnType } from "@/utils/parser";
import { formatNumber } from "@/utils/formatter";
import { getOrCreateSessionId } from "@/utils/session";
import { supabase } from "@/utils/supabaseClient";

// Widget Layout Config Interface
export interface WidgetConfig {
  id: string;
  type: "kpi" | "line" | "bar";
  title: string;
  sql: string;
  metadata: {
    metricColumn?: string;
    metricColumnSqlSafe?: string;
    metricType?: ColumnType;
    aggregation?: "SUM" | "AVG" | "MIN" | "MAX" | "COUNT";
    dateColumn?: string;
    dateColumnSqlSafe?: string;
    categoryColumn?: string;
    categoryColumnSqlSafe?: string;
    lineChartGranularity?: "daily" | "monthly";
  };
}

interface DashboardProps {
  parsedData: ParsedResult;
  datasetLoaded: boolean;
  runQuery: (sql: string) => Promise<Record<string, unknown>[] | { error: string }>;
  onDashboardLoaded?: () => void;
  dashboardId: string | null;
  setDashboardId: (id: string | null) => void;
}

export default function Dashboard({
  parsedData,
  datasetLoaded,
  runQuery,
  onDashboardLoaded,
  dashboardId,
  setDashboardId
}: DashboardProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Layout State
  const [widgets, setWidgets] = useState<WidgetConfig[]>([]);
  const [widgetData, setWidgetData] = useState<Record<string, Record<string, unknown>[]>>({});
  const [widgetErrors, setWidgetErrors] = useState<Record<string, string>>({});
  const [loadingWidgets, setLoadingWidgets] = useState<Record<string, boolean>>({});

  // Form State for Adding Widget
  const [showAddForm, setShowAddForm] = useState(false);
  const [newType, setNewType] = useState<"kpi" | "line" | "bar" | "">("");
  const [customTitle, setCustomTitle] = useState("");

  // KPI Form Fields
  const [kpiCol, setKpiCol] = useState("");
  const [kpiAgg, setKpiAgg] = useState<"SUM" | "AVG" | "MIN" | "MAX" | "COUNT">("SUM");

  // Line Form Fields
  const [lineDateCol, setLineDateCol] = useState("");
  const [lineMetricCol, setLineMetricCol] = useState("");
  const [lineAgg, setLineAgg] = useState<"SUM" | "AVG">("SUM");
  const [lineGran, setLineGran] = useState<"daily" | "monthly">("daily");

  // Bar Form Fields
  const [barCatCol, setBarCatCol] = useState("");
  const [barMetricCol, setBarMetricCol] = useState(""); // empty string means Row Count
  const [barAgg, setBarAgg] = useState<"SUM" | "COUNT">("SUM");

  // Save Dashboard Modal State
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [saveTitle, setSaveTitle] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveSuccessId, setSaveSuccessId] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Determine active schema columns
  const dateCols = useMemo(() => parsedData.schema.filter(c => c.currentType === "date"), [parsedData.schema]);
  const numCols = useMemo(() => parsedData.schema.filter(c => c.currentType === "number" || c.currentType === "currency"), [parsedData.schema]);
  const catCols = useMemo(() => parsedData.schema.filter(c => c.currentType === "category"), [parsedData.schema]);

  // Helper to get currency metadata
  const getColCurrencySymbol = useCallback((colName: string): string => {
    const col = parsedData.schema.find(c => c.columnName === colName);
    return col?.currencySymbol || "$";
  }, [parsedData.schema]);

  // Generate complete set of automatic default widgets
  const initializeDashboardWidgets = useCallback(async () => {
    if (!datasetLoaded) return;
    setLoading(true);
    setError(null);

    try {
      // 1. Determine Date Granularity
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

      const defaultWidgets: WidgetConfig[] = [];

      // 2. Add Total Rows Card
      defaultWidgets.push({
        id: "kpi_total_rows",
        type: "kpi",
        title: "Total Rows",
        sql: "SELECT COUNT(*) as cnt FROM dataset",
        metadata: {
          aggregation: "COUNT",
          metricType: "number"
        }
      });

      // 3. Add Numeric/Currency aggregates KPI Cards
      numCols.forEach((col) => {
        defaultWidgets.push({
          id: `kpi_${col.columnName}`,
          type: "kpi",
          title: `Total ${col.displayName}`,
          sql: `SELECT SUM("${col.sqlSafeName}") as s, AVG("${col.sqlSafeName}") as a, MIN("${col.sqlSafeName}") as mn, MAX("${col.sqlSafeName}") as mx, COUNT("${col.sqlSafeName}") as cnt FROM dataset`,
          metadata: {
            metricColumn: col.columnName,
            metricColumnSqlSafe: col.sqlSafeName,
            metricType: col.currentType,
            aggregation: "SUM"
          }
        });
      });

      // 4. Add Line Charts (Cap at first 4 numeric columns vs first date column)
      if (dateCols.length > 0 && numCols.length > 0) {
        const dateCol = dateCols[0];
        const lineChartCols = numCols.slice(0, 4);
        lineChartCols.forEach((col) => {
          const formatStr = granularity === "monthly" ? "%Y-%m" : "%Y-%m-%d";
          defaultWidgets.push({
            id: `line_${col.columnName}_by_${dateCol.columnName}`,
            type: "line",
            title: `${col.displayName} by ${granularity === "monthly" ? "Month" : "Day"}`,
            sql: `
              SELECT
                strftime("${dateCol.sqlSafeName}", '${formatStr}') as date_bucket,
                SUM("${col.sqlSafeName}") as total_val
              FROM dataset
              WHERE "${dateCol.sqlSafeName}" IS NOT NULL
              GROUP BY 1
              ORDER BY date_bucket ASC
            `.trim(),
            metadata: {
              dateColumn: dateCol.columnName,
              dateColumnSqlSafe: dateCol.sqlSafeName,
              metricColumn: col.columnName,
              metricColumnSqlSafe: col.sqlSafeName,
              metricType: col.currentType,
              aggregation: "SUM",
              lineChartGranularity: granularity
            }
          });
        });
      }

      // 5. Add Bar Charts (Cap at first 4 category columns vs first numeric column or row count)
      if (catCols.length > 0) {
        const catColsToUse = catCols.slice(0, 4);
        const firstNum = numCols[0];

        catColsToUse.forEach((col) => {
          let sql = "";
          if (firstNum) {
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
            `.trim();
          } else {
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
            `.trim();
          }

          defaultWidgets.push({
            id: `bar_${col.columnName}`,
            type: "bar",
            title: firstNum ? `${firstNum.displayName} by ${col.displayName}` : `Count by ${col.displayName}`,
            sql,
            metadata: {
              categoryColumn: col.columnName,
              categoryColumnSqlSafe: col.sqlSafeName,
              metricColumn: firstNum?.columnName,
              metricColumnSqlSafe: firstNum?.sqlSafeName,
              metricType: firstNum ? firstNum.currentType : "number",
              aggregation: firstNum ? "SUM" : "COUNT"
            }
          });
        });
      }

      setWidgets(defaultWidgets);
      setWidgetData({});
      setWidgetErrors({});
      setLoadingWidgets({});

      if (onDashboardLoaded) {
        onDashboardLoaded();
      }
    } catch (err: unknown) {
      console.error("Dashboard defaults generation failed:", err);
      setError(err instanceof Error ? err.message : "Failed to load dashboard statistics.");
    } finally {
      setLoading(false);
    }
  }, [datasetLoaded, dateCols, numCols, catCols, runQuery, onDashboardLoaded]);

  // Sync widget initialization on initial mount & schema changes
  useEffect(() => {
    if (datasetLoaded) {
      initializeDashboardWidgets();
    }
  }, [datasetLoaded, parsedData.schema, initializeDashboardWidgets]);

  // Execute query for a specific widget
  const fetchWidgetData = useCallback(async (widget: WidgetConfig) => {
    setLoadingWidgets(prev => ({ ...prev, [widget.id]: true }));
    setWidgetErrors(prev => {
      const copy = { ...prev };
      delete copy[widget.id];
      return copy;
    });

    try {
      const res = await runQuery(widget.sql);
      if ("error" in res) {
        setWidgetErrors(prev => ({ ...prev, [widget.id]: res.error }));
      } else {
        setWidgetData(prev => ({ ...prev, [widget.id]: res as Record<string, unknown>[] }));
      }
    } catch (err: unknown) {
      setWidgetErrors(prev => ({ ...prev, [widget.id]: err instanceof Error ? err.message : "Failed to execute query." }));
    } finally {
      setLoadingWidgets(prev => ({ ...prev, [widget.id]: false }));
    }
  }, [runQuery]);

  // Reactively fetch data for missing widgets
  useEffect(() => {
    widgets.forEach((widget) => {
      if (
        widgetData[widget.id] === undefined &&
        !loadingWidgets[widget.id] &&
        !widgetErrors[widget.id]
      ) {
        fetchWidgetData(widget);
      }
    });
  }, [widgets, widgetData, loadingWidgets, widgetErrors, fetchWidgetData]);

  // Reordering handler
  const moveWidget = (index: number, direction: "up" | "down") => {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= widgets.length) return;

    setWidgets((prev) => {
      const copy = [...prev];
      const temp = copy[index];
      copy[index] = copy[targetIndex];
      copy[targetIndex] = temp;
      return copy;
    });
  };

  // Delete handler
  const removeWidget = (id: string) => {
    setWidgets((prev) => prev.filter((w) => w.id !== id));
    // Clean up cached states
    setWidgetData((prev) => {
      const copy = { ...prev };
      delete copy[id];
      return copy;
    });
    setWidgetErrors((prev) => {
      const copy = { ...prev };
      delete copy[id];
      return copy;
    });
  };

  // Pre-populate Form selections cleanly when newType is chosen
  useEffect(() => {
    if (newType === "kpi") {
      setKpiCol(numCols.length > 0 ? numCols[0].columnName : "row_count");
      setKpiAgg("SUM");
    } else if (newType === "line") {
      setLineDateCol(dateCols.length > 0 ? dateCols[0].columnName : "");
      setLineMetricCol(numCols.length > 0 ? numCols[0].columnName : "");
      setLineAgg("SUM");
      setLineGran("daily");
    } else if (newType === "bar") {
      setBarCatCol(catCols.length > 0 ? catCols[0].columnName : "");
      setBarMetricCol(numCols.length > 0 ? numCols[0].columnName : "row_count");
      setBarAgg("SUM");
    }
  }, [newType, dateCols, numCols, catCols]);

  // Add Widget submission handler
  const handleAddWidget = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newType) return;

    const id = `custom_${Date.now()}`;
    let title = customTitle.trim();
    let sql = "";
    let metadata: WidgetConfig["metadata"] = {};

    if (newType === "kpi") {
      if (!kpiCol || kpiCol === "row_count") {
        title = title || "Total Rows";
        sql = "SELECT COUNT(*) as cnt FROM dataset";
        metadata = {
          aggregation: "COUNT",
          metricType: "number"
        };
      } else {
        const col = parsedData.schema.find(c => c.columnName === kpiCol);
        if (!col) return;
        title = title || `${kpiAgg} of ${col.displayName}`;
        sql = `SELECT SUM("${col.sqlSafeName}") as s, AVG("${col.sqlSafeName}") as a, MIN("${col.sqlSafeName}") as mn, MAX("${col.sqlSafeName}") as mx, COUNT("${col.sqlSafeName}") as cnt FROM dataset`;
        metadata = {
          metricColumn: col.columnName,
          metricColumnSqlSafe: col.sqlSafeName,
          metricType: col.currentType,
          aggregation: kpiAgg
        };
      }
    } else if (newType === "line") {
      const dateCol = parsedData.schema.find(c => c.columnName === lineDateCol);
      const metricCol = parsedData.schema.find(c => c.columnName === lineMetricCol);
      if (!dateCol || !metricCol) return;

      title = title || `${metricCol.displayName} (${lineAgg}) by ${lineGran === "monthly" ? "Month" : "Day"}`;
      const formatStr = lineGran === "monthly" ? "%Y-%m" : "%Y-%m-%d";
      sql = `
        SELECT
          strftime("${dateCol.sqlSafeName}", '${formatStr}') as date_bucket,
          ${lineAgg}("${metricCol.sqlSafeName}") as total_val
        FROM dataset
        WHERE "${dateCol.sqlSafeName}" IS NOT NULL
        GROUP BY 1
        ORDER BY date_bucket ASC
      `.trim();

      metadata = {
        dateColumn: dateCol.columnName,
        dateColumnSqlSafe: dateCol.sqlSafeName,
        metricColumn: metricCol.columnName,
        metricColumnSqlSafe: metricCol.sqlSafeName,
        metricType: metricCol.currentType,
        aggregation: lineAgg,
        lineChartGranularity: lineGran
      };
    } else if (newType === "bar") {
      const catCol = parsedData.schema.find(c => c.columnName === barCatCol);
      if (!catCol) return;

      const metricCol = barMetricCol && barMetricCol !== "row_count"
        ? parsedData.schema.find(c => c.columnName === barMetricCol)
        : null;

      title = title || (metricCol ? `${metricCol.displayName} by ${catCol.displayName}` : `Count by ${catCol.displayName}`);

      if (metricCol) {
        sql = `
          WITH ranked_categories AS (
            SELECT
              "${catCol.sqlSafeName}" AS category,
              SUM("${metricCol.sqlSafeName}") AS val,
              ROW_NUMBER() OVER (ORDER BY SUM("${metricCol.sqlSafeName}") DESC) as rnk
            FROM dataset
            WHERE "${catCol.sqlSafeName}" IS NOT NULL
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
        `.trim();
      } else {
        sql = `
          WITH ranked_categories AS (
            SELECT
              "${catCol.sqlSafeName}" AS category,
              COUNT(*) AS val,
              ROW_NUMBER() OVER (ORDER BY COUNT(*) DESC) as rnk
            FROM dataset
            WHERE "${catCol.sqlSafeName}" IS NOT NULL
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
        `.trim();
      }

      metadata = {
        categoryColumn: catCol.columnName,
        categoryColumnSqlSafe: catCol.sqlSafeName,
        metricColumn: metricCol?.columnName,
        metricColumnSqlSafe: metricCol?.sqlSafeName,
        metricType: metricCol ? metricCol.currentType : "number",
        aggregation: metricCol ? "SUM" : "COUNT"
      };
    }

    const newWidget: WidgetConfig = {
      id,
      type: newType,
      title,
      sql,
      metadata
    };

    setWidgets((prev) => [...prev, newWidget]);
    setCustomTitle("");
    setNewType("");
    setShowAddForm(false);
  };

  // Save Dashboard handler
  const handleSaveDashboard = async () => {
    setSaving(true);
    setSaveError(null);
    setSaveSuccessId(null);

    try {
      const sessionId = getOrCreateSessionId();
      const titleToSave = saveTitle.trim() || parsedData.fileName;

      // Verify Supabase env keys exist
      if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
        throw new Error("Supabase connection parameters are not fully set in the workspace. Please make sure variables are configured.");
      }

      // Structured dataset summary
      const datasetSummaryPayload = {
        totalRows: parsedData.rawRows.length,
        schema: parsedData.schema
      };

      let resData;
      if (dashboardId) {
        // Update existing dashboard
        const { data, error: supabaseError } = await supabase
          .from("dashboards")
          .update({
            title: titleToSave,
            layout_config: widgets,
            dataset_summary: datasetSummaryPayload
          })
          .eq("id", dashboardId)
          .select();

        if (supabaseError) {
          throw new Error(supabaseError.message);
        }
        resData = data;
      } else {
        // Insert new dashboard
        const { data, error: supabaseError } = await supabase
          .from("dashboards")
          .insert([
            {
              session_id: sessionId,
              title: titleToSave,
              layout_config: widgets,
              dataset_summary: datasetSummaryPayload
            }
          ])
          .select();

        if (supabaseError) {
          throw new Error(supabaseError.message);
        }
        resData = data;
      }

      if (resData && resData[0]) {
        setSaveSuccessId(resData[0].id);
        setDashboardId(resData[0].id);
      } else {
        throw new Error("Did not receive a validation response from database.");
      }
    } catch (err: unknown) {
      console.error("Supabase Save Error:", err);
      setSaveError(err instanceof Error ? err.message : "An unexpected error occurred while saving.");
    } finally {
      setSaving(false);
    }
  };

  // Open Save Modal and pre-fill title
  const triggerSaveModal = () => {
    // Strip file extensions for cleaner titles
    const cleanFileName = parsedData.fileName.replace(/\.(csv|xlsx|xls)$/i, "");
    setSaveTitle(cleanFileName);
    setSaveError(null);
    setSaveSuccessId(dashboardId); // Use shared dashboard ID if exists
    setShowSaveModal(true);
  };

  // Standard loading skeleton
  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, idx) => (
            <div key={idx} className="bg-[#111827] border border-gray-800 p-5 rounded-xl space-y-3">
              <div className="h-4 w-24 bg-gray-800 rounded"></div>
              <div className="h-8 w-32 bg-gray-800 rounded"></div>
              <div className="h-3 w-44 bg-gray-800 rounded pt-2"></div>
            </div>
          ))}
        </div>
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

  return (
    <div className="space-y-8 animate-fade-in">

      {/* 🛠️ Dashboard Toolbar */}
      <div className="bg-[#111827] border border-gray-800 p-4 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-2">
          <Sparkles className="h-4 w-4 text-blue-400 animate-pulse" />
          <span className="text-sm font-bold text-white uppercase tracking-wider">Dashboard Controls</span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Add Widget Button */}
          <button
            onClick={() => {
              setShowAddForm(!showAddForm);
              setNewType("kpi");
            }}
            className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold border transition ${
              showAddForm
                ? "bg-gray-800 border-gray-700 text-white"
                : "bg-blue-950/35 text-blue-400 border-blue-900/40 hover:bg-blue-900/40 hover:border-blue-800"
            }`}
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Add Custom Widget</span>
          </button>

          {/* Reset to Defaults */}
          <button
            onClick={initializeDashboardWidgets}
            className="flex items-center space-x-2 px-3.5 py-1.5 bg-gray-900 hover:bg-gray-800 text-gray-400 hover:text-white border border-gray-800 rounded-lg text-xs font-semibold transition"
            title="Restore original charts & KPI cards"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span>Reset to Defaults</span>
          </button>

          {/* Save Dashboard */}
          <button
            onClick={triggerSaveModal}
            className="flex items-center space-x-2 px-4 py-1.5 bg-accent hover:bg-blue-600 text-white rounded-lg text-xs font-bold shadow-md shadow-accent/15 transition"
          >
            <Save className="h-3.5 w-3.5" />
            <span>Save Dashboard</span>
          </button>
        </div>
      </div>

      {/* ➕ "Add Custom Widget" Sliding Panel */}
      {showAddForm && (
        <div className="bg-[#111827] border border-gray-800 p-6 rounded-xl space-y-5 animate-fade-in relative">
          <button
            onClick={() => setShowAddForm(false)}
            className="absolute top-4 right-4 text-gray-500 hover:text-white transition"
          >
            <X className="h-4 w-4" />
          </button>

          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Configure Custom Widget</h3>
            <p className="text-xs text-gray-400 mt-1">Specify layout configuration and aggregates to construct a new chart or KPI card.</p>
          </div>

          {/* Tabs for Widget Type */}
          <div className="grid grid-cols-3 gap-2 border-b border-gray-850 pb-4">
            {(["kpi", "line", "bar"] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setNewType(t)}
                className={`py-2 px-4 rounded-lg text-xs font-bold border transition uppercase tracking-wider ${
                  newType === t
                    ? "bg-accent border-accent text-white"
                    : "bg-gray-950 border-gray-850 text-gray-400 hover:text-white"
                }`}
              >
                {t === "kpi" ? "🔢 KPI Card" : t === "line" ? "📈 Line Chart" : "📊 Bar Chart"}
              </button>
            ))}
          </div>

          <form onSubmit={handleAddWidget} className="space-y-4 text-xs">
            {/* Custom Optional Title */}
            <div className="flex flex-col space-y-1.5">
              <label className="font-bold text-gray-400">Custom Title (Optional)</label>
              <input
                type="text"
                placeholder="Leave blank for auto-generated title"
                value={customTitle}
                onChange={(e) => setCustomTitle(e.target.value)}
                className="bg-gray-950 border border-gray-850 rounded-lg p-3 text-white outline-none focus:border-accent font-medium text-xs placeholder-gray-700"
              />
            </div>

            {/* 1. KPI Options */}
            {newType === "kpi" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col space-y-1.5">
                  <label className="font-bold text-gray-400">Select Column</label>
                  <select
                    value={kpiCol}
                    onChange={(e) => setKpiCol(e.target.value)}
                    className="bg-gray-950 border border-gray-850 rounded-lg p-3 text-white outline-none focus:border-accent cursor-pointer text-xs"
                  >
                    <option value="row_count">📝 Dataset Row Count (Standard COUNT)</option>
                    {numCols.map((col) => (
                      <option key={col.columnName} value={col.columnName}>
                        {col.currentType === "currency" ? "💰" : "🔢"} {col.displayName}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col space-y-1.5">
                  <label className="font-bold text-gray-400">Aggregation Method</label>
                  <select
                    value={kpiAgg}
                    disabled={kpiCol === "row_count"}
                    onChange={(e) => setKpiAgg(e.target.value as "SUM" | "AVG" | "MIN" | "MAX" | "COUNT")}
                    className="bg-gray-950 border border-gray-850 rounded-lg p-3 text-white outline-none focus:border-accent disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer text-xs"
                  >
                    <option value="SUM">SUM (Total Aggregate)</option>
                    <option value="AVG">AVG (Average)</option>
                    <option value="MIN">MIN (Minimum value)</option>
                    <option value="MAX">MAX (Maximum value)</option>
                    <option value="COUNT">COUNT (Non-empty rows)</option>
                  </select>
                </div>
              </div>
            )}

            {/* 2. Line Chart Options */}
            {newType === "line" && (
              <div className="space-y-4">
                {dateCols.length === 0 || numCols.length === 0 ? (
                  <div className="p-4 bg-amber-950/20 border border-amber-900/30 rounded-lg text-amber-400 leading-relaxed">
                    Line charts require at least <strong>1 Date column</strong> and <strong>1 Numeric/Currency column</strong>.
                    Please change your column types in the preview panel above if necessary.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="flex flex-col space-y-1.5">
                      <label className="font-bold text-gray-400">Date Dimension</label>
                      <select
                        value={lineDateCol}
                        onChange={(e) => setLineDateCol(e.target.value)}
                        className="bg-gray-950 border border-gray-850 rounded-lg p-3 text-white outline-none focus:border-accent cursor-pointer text-xs"
                      >
                        {dateCols.map((col) => (
                          <option key={col.columnName} value={col.columnName}>
                            📅 {col.displayName}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="flex flex-col space-y-1.5">
                      <label className="font-bold text-gray-400">Metric Value</label>
                      <select
                        value={lineMetricCol}
                        onChange={(e) => setLineMetricCol(e.target.value)}
                        className="bg-gray-950 border border-gray-850 rounded-lg p-3 text-white outline-none focus:border-accent cursor-pointer text-xs"
                      >
                        {numCols.map((col) => (
                          <option key={col.columnName} value={col.columnName}>
                            {col.currentType === "currency" ? "💰" : "🔢"} {col.displayName}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="flex flex-col space-y-1.5">
                      <label className="font-bold text-gray-400">Trend Aggregation</label>
                      <select
                        value={lineAgg}
                        onChange={(e) => setLineAgg(e.target.value as "SUM" | "AVG")}
                        className="bg-gray-950 border border-gray-850 rounded-lg p-3 text-white outline-none focus:border-accent cursor-pointer text-xs"
                      >
                        <option value="SUM">SUM (Total over time)</option>
                        <option value="AVG">AVG (Average over time)</option>
                      </select>
                    </div>

                    <div className="flex flex-col space-y-1.5">
                      <label className="font-bold text-gray-400">Time Bucket Granularity</label>
                      <select
                        value={lineGran}
                        onChange={(e) => setLineGran(e.target.value as "daily" | "monthly")}
                        className="bg-gray-950 border border-gray-850 rounded-lg p-3 text-white outline-none focus:border-accent cursor-pointer text-xs"
                      >
                        <option value="daily">📅 Daily Buckets</option>
                        <option value="monthly">📆 Monthly Buckets</option>
                      </select>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 3. Bar Chart Options */}
            {newType === "bar" && (
              <div className="space-y-4">
                {catCols.length === 0 ? (
                  <div className="p-4 bg-amber-950/20 border border-amber-900/30 rounded-lg text-amber-400 leading-relaxed">
                    Bar charts require at least <strong>1 Category column</strong>.
                    Please change your column types in the preview panel above if necessary.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="flex flex-col space-y-1.5">
                      <label className="font-bold text-gray-400">Category Dimension</label>
                      <select
                        value={barCatCol}
                        onChange={(e) => setBarCatCol(e.target.value)}
                        className="bg-gray-950 border border-gray-850 rounded-lg p-3 text-white outline-none focus:border-accent cursor-pointer text-xs"
                      >
                        {catCols.map((col) => (
                          <option key={col.columnName} value={col.columnName}>
                            🏷️ {col.displayName}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="flex flex-col space-y-1.5">
                      <label className="font-bold text-gray-400">Aggregate Metric</label>
                      <select
                        value={barMetricCol}
                        onChange={(e) => setBarMetricCol(e.target.value)}
                        className="bg-gray-950 border border-gray-850 rounded-lg p-3 text-white outline-none focus:border-accent cursor-pointer text-xs"
                      >
                        <option value="row_count">📝 Row Count (Frequency of Categories)</option>
                        {numCols.map((col) => (
                          <option key={col.columnName} value={col.columnName}>
                            {col.currentType === "currency" ? "💰" : "🔢"} {col.displayName}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="flex flex-col space-y-1.5">
                      <label className="font-bold text-gray-400">Aggregation Method</label>
                      <select
                        value={barAgg}
                        disabled={!barMetricCol || barMetricCol === "row_count"}
                        onChange={(e) => setBarAgg(e.target.value as "SUM" | "COUNT")}
                        className="bg-gray-950 border border-gray-850 rounded-lg p-3 text-white outline-none focus:border-accent disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer text-xs"
                      >
                        <option value="SUM">SUM (Total Metric SUM)</option>
                        <option value="COUNT">COUNT (Count of records)</option>
                      </select>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Submit Action */}
            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={
                  (newType === "line" && (dateCols.length === 0 || numCols.length === 0)) ||
                  (newType === "bar" && catCols.length === 0)
                }
                className="flex items-center space-x-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-850 disabled:text-gray-500 text-white font-bold rounded-lg transition"
              >
                <Plus className="h-4 w-4" />
                <span>Create Widget</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 🚀 Active Layout Widgets Render Grid */}
      {widgets.length === 0 ? (
        <div className="text-center py-16 px-6 bg-[#111827] border border-gray-800 rounded-xl space-y-4">
          <Sparkles className="h-10 w-10 text-gray-600 mx-auto" />
          <h3 className="text-base font-bold text-white">Your dashboard is empty</h3>
          <p className="text-xs text-gray-400 max-w-sm mx-auto leading-relaxed">
            All widgets were removed. Click &quot;Add Custom Widget&quot; to manually customize your layout or click &quot;Reset to Defaults&quot; to restore automatic configurations.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 items-start">
          {widgets.map((widget, index) => {
            const isKpi = widget.type === "kpi";
            const gridColSpan = isKpi
              ? "col-span-1"
              : "col-span-1 md:col-span-2 xl:col-span-2";

            const errorMsg = widgetErrors[widget.id];
            const isWidgetLoading = loadingWidgets[widget.id];
            const data = widgetData[widget.id];

            return (
              <div
                key={widget.id}
                className={`${gridColSpan} bg-[#111827] border border-gray-800 rounded-xl flex flex-col justify-between shadow-xl relative overflow-hidden group hover:border-gray-700/80 transition-all p-5 h-full`}
                style={{ minHeight: isKpi ? "160px" : "360px" }}
              >
                {/* Header Action Row */}
                <div className="flex items-start justify-between border-b border-gray-850 pb-3 mb-4">
                  <div className="flex items-center space-x-2 truncate pr-2">
                    {widget.type === "line" && <TrendingUp className="h-4 w-4 text-[#3b82f6]" />}
                    {widget.type === "bar" && <BarChart3 className="h-4 w-4 text-[#10b981]" />}
                    {isKpi && (
                      widget.metadata.metricType === "currency" ? (
                        <DollarSign className="h-4 w-4 text-amber-400" />
                      ) : (
                        <Hash className="h-4 w-4 text-blue-400" />
                      )
                    )}
                    <h3
                      className="text-xs font-bold text-white tracking-wide uppercase truncate max-w-[150px] sm:max-w-[200px]"
                      title={widget.title}
                    >
                      {widget.title}
                    </h3>
                  </div>

                  {/* Move up / Move down / Delete Action Buttons */}
                  <div className="flex items-center space-x-0.5 flex-shrink-0 bg-gray-950/40 border border-gray-850/50 p-1 rounded-lg">
                    <button
                      type="button"
                      onClick={() => moveWidget(index, "up")}
                      disabled={index === 0}
                      title="Move Up"
                      className="p-1 text-gray-500 hover:text-white hover:bg-gray-800 rounded disabled:opacity-20 disabled:hover:bg-transparent disabled:cursor-not-allowed transition"
                    >
                      <ChevronUp className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => moveWidget(index, "down")}
                      disabled={index === widgets.length - 1}
                      title="Move Down"
                      className="p-1 text-gray-500 hover:text-white hover:bg-gray-800 rounded disabled:opacity-20 disabled:hover:bg-transparent disabled:cursor-not-allowed transition"
                    >
                      <ChevronDown className="h-3.5 w-3.5" />
                    </button>
                    <div className="w-[1px] h-3.5 bg-gray-850 mx-1" />
                    <button
                      type="button"
                      onClick={() => removeWidget(widget.id)}
                      title="Remove Widget"
                      className="p-1 text-gray-500 hover:text-rose-400 hover:bg-rose-950/40 rounded transition"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                {/* Main Card Content */}
                <div className="flex-1 flex flex-col justify-center">
                  {/* Error State */}
                  {errorMsg && (
                    <div className="flex items-start space-x-2 text-rose-500 p-2 bg-rose-950/10 border border-rose-950/20 rounded">
                      <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                      <span className="text-[10px] font-semibold leading-relaxed font-mono truncate max-w-[240px]" title={errorMsg}>
                        {errorMsg}
                      </span>
                    </div>
                  )}

                  {/* Loading State */}
                  {isWidgetLoading && (
                    <div className="flex items-center justify-center space-x-2 py-4">
                      <RefreshCw className="h-4 w-4 text-blue-500 animate-spin" />
                      <span className="text-[10px] text-gray-400 font-bold">Querying DuckDB...</span>
                    </div>
                  )}

                  {/* No Data State */}
                  {!isWidgetLoading && !errorMsg && (!data || data.length === 0) && (
                    <div className="text-center text-gray-600 italic text-[11px] py-4">
                      No results returned.
                    </div>
                  )}

                  {/* Render Widget */}
                  {!isWidgetLoading && !errorMsg && data && data.length > 0 && (
                    <>
                      {/* 1. Render KPI Card */}
                      {isKpi && (() => {
                        const isCurrency = widget.metadata.metricType === "currency";
                        const sym = isCurrency ? getColCurrencySymbol(widget.metadata.metricColumn || "") : undefined;
                        const metricType = (widget.metadata.metricType as "number" | "currency") || "number";

                        const row = data[0];
                        let mainVal = 0;

                        if (widget.id === "kpi_total_rows" || !widget.metadata.metricColumn) {
                          mainVal = Number(row.cnt ?? row.total_rows ?? Object.values(row)[0] ?? 0);
                        } else {
                          const agg = widget.metadata.aggregation || "SUM";
                          if (agg === "SUM") mainVal = Number(row.s ?? 0);
                          else if (agg === "AVG") mainVal = Number(row.a ?? 0);
                          else if (agg === "MIN") mainVal = Number(row.mn ?? 0);
                          else if (agg === "MAX") mainVal = Number(row.mx ?? 0);
                          else if (agg === "COUNT") mainVal = Number(row.cnt ?? 0);
                        }

                        const hasSubMetrics = row.s !== undefined;

                        return (
                          <div className="flex flex-col justify-between h-full">
                            <div>
                              <span className="text-3xl font-extrabold text-white block tracking-tight truncate">
                                {formatNumber(mainVal, metricType, sym)}
                              </span>
                            </div>

                            {/* Sub-aggregates details */}
                            {hasSubMetrics && widget.id !== "kpi_total_rows" && (
                              <div className="grid grid-cols-3 gap-1.5 text-[9px] text-gray-400 font-bold mt-4 pt-2.5 border-t border-gray-850">
                                <div>
                                  <span className="text-gray-500 block uppercase tracking-wide text-[8px]">Average</span>
                                  <span className="truncate block mt-0.5 text-gray-200" title={formatNumber(row.a as number, metricType, sym)}>
                                    {formatNumber(row.a as number, metricType, sym)}
                                  </span>
                                </div>
                                <div>
                                  <span className="text-gray-500 block uppercase tracking-wide text-[8px]">Minimum</span>
                                  <span className="truncate block mt-0.5 text-gray-200" title={formatNumber(row.mn as number, metricType, sym)}>
                                    {formatNumber(row.mn as number, metricType, sym)}
                                  </span>
                                </div>
                                <div>
                                  <span className="text-gray-500 block uppercase tracking-wide text-[8px]">Maximum</span>
                                  <span className="truncate block mt-0.5 text-gray-200" title={formatNumber((row.max ?? row.mx) as number, metricType, sym)}>
                                    {formatNumber((row.max ?? row.mx) as number, metricType, sym)}
                                  </span>
                                </div>
                              </div>
                            )}

                            {!hasSubMetrics && (
                              <div className="text-[10px] text-gray-500 font-semibold mt-3 pt-2.5 border-t border-gray-850">
                                Aggregation Method: {widget.metadata.aggregation || "COUNT"}
                              </div>
                            )}
                          </div>
                        );
                      })()}

                      {/* 2. Render Line Chart */}
                      {widget.type === "line" && (() => {
                        const isCurrency = widget.metadata.metricType === "currency";
                        const sym = isCurrency ? getColCurrencySymbol(widget.metadata.metricColumn || "") : undefined;
                        const colName = widget.metadata.metricColumn || "";
                        const displayName = parsedData.schema.find(c => c.columnName === colName)?.displayName || colName;

                        return (
                          <div className="h-64 w-full text-[10px] mt-2">
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
                                  formatter={(value) => [formatNumber(value as number, isCurrency ? "currency" : "number", sym), displayName]}
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
                        );
                      })()}

                      {/* 3. Render Bar Chart */}
                      {widget.type === "bar" && (() => {
                        const colName = widget.metadata.metricColumn || "";
                        const metricName = widget.metadata.metricColumn
                          ? (parsedData.schema.find(c => c.columnName === colName)?.displayName || colName)
                          : "Count";
                        const isCurrency = widget.metadata.metricType === "currency";
                        const sym = isCurrency ? getColCurrencySymbol(colName) : undefined;
                        const metricType = (widget.metadata.metricType as "number" | "currency") || "number";

                        return (
                          <div className="h-64 w-full text-[10px] mt-2">
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
                                  formatter={(value) => [formatNumber(value as number, metricType, sym), metricName]}
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
                        );
                      })()}
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 💾 Save Dashboard Modal Dialog */}
      {showSaveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 animate-fade-in">
          <div className="bg-[#111827] border border-gray-800 rounded-2xl p-6 w-full max-w-md shadow-2xl relative space-y-5 animate-scale-up">
            <button
              onClick={() => setShowSaveModal(false)}
              disabled={saving}
              className="absolute top-4 right-4 text-gray-400 hover:text-white disabled:opacity-30 transition"
            >
              <X className="h-4 w-4" />
            </button>

            {/* Success Confirmation Screen */}
            {saveSuccessId ? (
              <div className="text-center py-4 space-y-4">
                <div className="h-12 w-12 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle2 className="h-6 w-6" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-base font-bold text-white">Dashboard Saved Successfully!</h3>
                  <p className="text-xs text-gray-400 px-4 leading-relaxed">
                    Your layout and column definitions have been persisted under session ID cookie.
                  </p>
                </div>

                <div className="bg-gray-950 border border-gray-850 p-3.5 rounded-xl space-y-1 text-[11px] font-mono select-all">
                  <span className="text-gray-500 block text-[9px] font-bold uppercase tracking-wider font-sans mb-1">Generated Dashboard ID</span>
                  <span className="text-blue-400 font-bold block">{saveSuccessId}</span>
                </div>

                <div className="pt-3">
                  <button
                    onClick={() => setShowSaveModal(false)}
                    className="w-full py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg text-xs font-bold transition"
                  >
                    Close Dialog
                  </button>
                </div>
              </div>
            ) : (
              /* Name Form Screen */
              <div className="space-y-4">
                <div>
                  <h3 className="text-base font-bold text-white">Save Dashboard to Database</h3>
                  <p className="text-xs text-gray-400 mt-1">Provide a name to revisit your customized layout and schema later.</p>
                </div>

                <div className="flex flex-col space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Dashboard Title</label>
                  <input
                    type="text"
                    value={saveTitle}
                    onChange={(e) => setSaveTitle(e.target.value)}
                    placeholder="Enter dashboard name"
                    disabled={saving}
                    className="bg-gray-950 border border-gray-850 rounded-lg p-3 text-white outline-none focus:border-accent text-xs placeholder-gray-700 font-medium"
                    maxLength={100}
                  />
                </div>

                {saveError && (
                  <div className="flex items-start space-x-2 text-rose-400 p-3 bg-rose-950/20 border border-rose-900/30 rounded-lg text-xs font-mono">
                    <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    <span>{saveError}</span>
                  </div>
                )}

                <div className="flex justify-end space-x-2.5 pt-2">
                  <button
                    type="button"
                    disabled={saving}
                    onClick={() => setShowSaveModal(false)}
                    className="px-4 py-2 bg-gray-950 border border-gray-850 hover:bg-gray-900 text-gray-400 hover:text-white rounded-lg text-xs font-bold transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={saving}
                    onClick={handleSaveDashboard}
                    className="flex items-center space-x-1.5 px-5 py-2 bg-accent hover:bg-blue-600 disabled:bg-gray-800 text-white rounded-lg text-xs font-bold transition shadow-md shadow-accent/15"
                  >
                    {saving ? (
                      <>
                        <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                        <span>Saving...</span>
                      </>
                    ) : (
                      <>
                        <Save className="h-3.5 w-3.5" />
                        <span>Save Now</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
