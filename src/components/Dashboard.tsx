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
  CheckCircle2,
  Download
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

  const [exportingPdf, setExportingPdf] = useState(false);

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

      if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
        throw new Error("Supabase connection parameters are not fully set in the workspace. Please make sure variables are configured.");
      }

      const datasetSummaryPayload = {
        totalRows: parsedData.rawRows.length,
        schema: parsedData.schema
      };

      let resData;
      if (dashboardId) {
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
    const cleanFileName = parsedData.fileName.replace(/\.(csv|xlsx|xls)$/i, "");
    setSaveTitle(cleanFileName);
    setSaveError(null);
    setSaveSuccessId(dashboardId);
    setShowSaveModal(true);
  };

  // High-fidelity PDF export logic
  const handleExportPDF = async () => {
    if (widgets.length === 0) return;
    setExportingPdf(true);
    try {
      const { default: jsPDF } = await import("jspdf");
      const { default: html2canvas } = await import("html2canvas");

      const element = document.getElementById("dashboard-widgets-container");
      if (!element) {
        throw new Error("Widgets container not found.");
      }

      const isDarkModeActive = document.documentElement.classList.contains("dark");

      const canvas = await html2canvas(element, {
        scale: 2,
        backgroundColor: isDarkModeActive ? "#0a0a0a" : "#ffffff",
        useCORS: true,
        logging: false,
      });

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const imgWidth = 210;
      const pageHeight = 297;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      const cleanFileName = parsedData.fileName.replace(/\.[^/.]+$/, "");
      pdf.save(`${cleanFileName}_dashboard.pdf`);
    } catch (err) {
      console.error("PDF export failed:", err);
      alert("Failed to export PDF. Please try again.");
    } finally {
      setExportingPdf(false);
    }
  };

  // Standard loading skeleton
  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, idx) => (
            <div key={idx} className="bg-surface border border-border p-5 rounded-lg space-y-3">
              <div className="h-4 w-24 bg-surface-subtle rounded"></div>
              <div className="h-8 w-32 bg-surface-subtle rounded"></div>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[...Array(2)].map((_, idx) => (
            <div key={idx} className="bg-surface border border-border p-6 rounded-lg space-y-4">
              <div className="h-5 w-48 bg-surface-subtle rounded"></div>
              <div className="h-60 w-full bg-surface-subtle/40 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-start space-x-2.5 p-4 bg-rose-500/10 border border-rose-500/20 rounded-lg">
        <AlertCircle className="h-4 w-4 text-rose-500 mt-0.5 flex-shrink-0" />
        <div className="space-y-1">
          <p className="text-xs font-bold text-rose-600">Dashboard Generation Error</p>
          <p className="text-xs text-muted leading-relaxed font-mono">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in font-sans">

      {/* 🛠 Dashboard Toolbar */}
      <div className="bg-surface border border-border p-4 rounded-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-2">
          <Sparkles className="h-4 w-4 text-accent" />
          <span className="font-sans text-xs font-bold text-foreground uppercase tracking-wider">Dashboard Controls</span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Add Widget Button */}
          <button
            onClick={() => {
              setShowAddForm(!showAddForm);
              setNewType("kpi");
            }}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none ${
              showAddForm
                ? "bg-surface-subtle border-border text-foreground"
                : "bg-surface border-border hover:bg-surface-subtle text-foreground"
            }`}
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Add Custom Widget</span>
          </button>

          {/* Reset to Defaults */}
          <button
            onClick={initializeDashboardWidgets}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-surface hover:bg-surface-subtle text-muted hover:text-foreground border border-border rounded-lg text-xs font-medium transition-all focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
            title="Restore original charts & KPI cards"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span>Reset to Defaults</span>
          </button>

          {/* Save Dashboard */}
          <button
            onClick={triggerSaveModal}
            className="flex items-center space-x-1.5 px-3.5 py-1.5 bg-accent hover:opacity-90 active:scale-95 text-white rounded-lg text-xs font-medium transition-all focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
          >
            <Save className="h-3.5 w-3.5" />
            <span>Save Dashboard</span>
          </button>

          {/* Export PDF Button */}
          <button
            onClick={handleExportPDF}
            disabled={exportingPdf || widgets.length === 0}
            className="flex items-center space-x-1.5 px-3.5 py-1.5 bg-surface hover:bg-surface-subtle disabled:opacity-45 text-foreground border border-border rounded-lg text-xs font-medium transition-all focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
          >
            {exportingPdf ? (
              <>
                <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                <span>Exporting PDF...</span>
              </>
            ) : (
              <>
                <Download className="h-3.5 w-3.5" />
                <span>Export PDF</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* ➕ "Add Custom Widget" Sliding Panel */}
      {showAddForm && (
        <div className="bg-surface border border-border p-5 rounded-lg space-y-4 animate-fade-in relative">
          <button
            onClick={() => setShowAddForm(false)}
            className="absolute top-4 right-4 text-muted hover:text-foreground transition focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none rounded p-1"
          >
            <X className="h-4 w-4" />
          </button>

          <div>
            <h3 className="font-sans text-xs font-bold text-foreground uppercase tracking-wider">Configure Custom Widget</h3>
            <p className="text-[10px] text-muted mt-1 font-normal">Specify layout configuration and aggregates to construct a new chart or KPI card.</p>
          </div>

          {/* Tabs for Widget Type */}
          <div className="grid grid-cols-3 gap-2 border-b border-border pb-3">
            {(["kpi", "line", "bar"] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setNewType(t)}
                className={`py-1.5 px-3 rounded-lg text-xs font-medium border transition-colors uppercase tracking-wider focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none ${
                  newType === t
                    ? "bg-accent border-accent text-white"
                    : "bg-background border-border text-muted hover:text-foreground"
                }`}
              >
                {t === "kpi" ? "🔢 KPI Card" : t === "line" ? "📈 Line" : "📊 Bar"}
              </button>
            ))}
          </div>

          <form onSubmit={handleAddWidget} className="space-y-4 text-xs font-normal">
            <div className="flex flex-col space-y-1">
              <label className="font-bold text-muted">Custom Title (Optional)</label>
              <input
                type="text"
                placeholder="Leave blank for auto-generated title"
                value={customTitle}
                onChange={(e) => setCustomTitle(e.target.value)}
                className="bg-background border border-border rounded-lg p-2 text-foreground outline-none focus:border-accent text-xs placeholder-muted/30 focus-visible:ring-2 focus-visible:ring-accent/20"
              />
            </div>

            {newType === "kpi" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col space-y-1">
                  <label className="font-bold text-muted">Select Column</label>
                  <select
                    value={kpiCol}
                    onChange={(e) => setKpiCol(e.target.value)}
                    className="bg-background border border-border rounded-lg p-2 text-foreground outline-none focus:border-accent cursor-pointer text-xs font-medium focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
                  >
                    <option value="row_count">📝 Dataset Row Count (Standard COUNT)</option>
                    {numCols.map((col) => (
                      <option key={col.columnName} value={col.columnName}>
                        {col.currentType === "currency" ? "💰" : "🔢"} {col.displayName}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col space-y-1">
                  <label className="font-bold text-muted">Aggregation Method</label>
                  <select
                    value={kpiAgg}
                    disabled={kpiCol === "row_count"}
                    onChange={(e) => setKpiAgg(e.target.value as "SUM" | "AVG" | "MIN" | "MAX" | "COUNT")}
                    className="bg-background border border-border rounded-lg p-2 text-foreground outline-none focus:border-accent disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer text-xs font-medium focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
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

            {newType === "line" && (
              <div className="space-y-4">
                {dateCols.length === 0 || numCols.length === 0 ? (
                  <div className="p-3 bg-warning/10 border border-warning/30 rounded-lg text-warning leading-relaxed">
                    Line charts require at least <strong>1 Date column</strong> and <strong>1 Numeric/Currency column</strong>.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="flex flex-col space-y-1">
                      <label className="font-bold text-muted">Date Dimension</label>
                      <select
                        value={lineDateCol}
                        onChange={(e) => setLineDateCol(e.target.value)}
                        className="bg-background border border-border rounded-lg p-2 text-foreground outline-none focus:border-accent cursor-pointer text-xs font-medium focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
                      >
                        {dateCols.map((col) => (
                          <option key={col.columnName} value={col.columnName}>
                            📅 {col.displayName}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="flex flex-col space-y-1">
                      <label className="font-bold text-muted">Metric Value</label>
                      <select
                        value={lineMetricCol}
                        onChange={(e) => setLineMetricCol(e.target.value)}
                        className="bg-background border border-border rounded-lg p-2 text-foreground outline-none focus:border-accent cursor-pointer text-xs font-medium focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
                      >
                        {numCols.map((col) => (
                          <option key={col.columnName} value={col.columnName}>
                            {col.currentType === "currency" ? "💰" : "🔢"} {col.displayName}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="flex flex-col space-y-1">
                      <label className="font-bold text-muted">Trend Aggregation</label>
                      <select
                        value={lineAgg}
                        onChange={(e) => setLineAgg(e.target.value as "SUM" | "AVG")}
                        className="bg-background border border-border rounded-lg p-2 text-foreground outline-none focus:border-accent cursor-pointer text-xs font-medium focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
                      >
                        <option value="SUM">SUM (Total over time)</option>
                        <option value="AVG">AVG (Average over time)</option>
                      </select>
                    </div>

                    <div className="flex flex-col space-y-1">
                      <label className="font-bold text-muted">Time Bucket Granularity</label>
                      <select
                        value={lineGran}
                        onChange={(e) => setLineGran(e.target.value as "daily" | "monthly")}
                        className="bg-background border border-border rounded-lg p-2 text-foreground outline-none focus:border-accent cursor-pointer text-xs font-medium focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
                      >
                        <option value="daily">📅 Daily Buckets</option>
                        <option value="monthly">📆 Monthly Buckets</option>
                      </select>
                    </div>
                  </div>
                )}
              </div>
            )}

            {newType === "bar" && (
              <div className="space-y-4">
                {catCols.length === 0 ? (
                  <div className="p-3 bg-warning/10 border border-warning/30 rounded-lg text-warning leading-relaxed">
                    Bar charts require at least <strong>1 Category column</strong>.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="flex flex-col space-y-1">
                      <label className="font-bold text-muted">Category Dimension</label>
                      <select
                        value={barCatCol}
                        onChange={(e) => setBarCatCol(e.target.value)}
                        className="bg-background border border-border rounded-lg p-2 text-foreground outline-none focus:border-accent cursor-pointer text-xs font-medium focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
                      >
                        {catCols.map((col) => (
                          <option key={col.columnName} value={col.columnName}>
                            🏷️ {col.displayName}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="flex flex-col space-y-1">
                      <label className="font-bold text-muted">Aggregate Metric</label>
                      <select
                        value={barMetricCol}
                        onChange={(e) => setBarMetricCol(e.target.value)}
                        className="bg-background border border-border rounded-lg p-2 text-foreground outline-none focus:border-accent cursor-pointer text-xs font-medium focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
                      >
                        <option value="row_count">📝 Row Count (Frequency of Categories)</option>
                        {numCols.map((col) => (
                          <option key={col.columnName} value={col.columnName}>
                            {col.currentType === "currency" ? "💰" : "🔢"} {col.displayName}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="flex flex-col space-y-1">
                      <label className="font-bold text-muted">Aggregation Method</label>
                      <select
                        value={barAgg}
                        disabled={!barMetricCol || barMetricCol === "row_count"}
                        onChange={(e) => setBarAgg(e.target.value as "SUM" | "COUNT")}
                        className="bg-background border border-border rounded-lg p-2 text-foreground outline-none focus:border-accent disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer text-xs font-medium focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
                      >
                        <option value="SUM">SUM (Total Metric SUM)</option>
                        <option value="COUNT">COUNT (Count of records)</option>
                      </select>
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={
                  (newType === "line" && (dateCols.length === 0 || numCols.length === 0)) ||
                  (newType === "bar" && catCols.length === 0)
                }
                className="flex items-center space-x-1.5 px-4 py-2 bg-accent hover:opacity-90 disabled:opacity-40 text-white font-medium rounded-lg transition-colors focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
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
        <div className="text-center py-12 px-6 bg-surface border border-border rounded-lg space-y-3">
          <Sparkles className="h-8 w-8 text-muted/30 mx-auto" />
          <h3 className="font-sans text-xs font-bold text-foreground uppercase tracking-wider">Your dashboard is empty</h3>
          <p className="text-xs text-muted max-w-sm mx-auto leading-relaxed">
            All widgets were removed. Click &quot;Add Custom Widget&quot; to manually customize your layout or click &quot;Reset to Defaults&quot; to restore automatic configurations.
          </p>
        </div>
      ) : (
        <div id="dashboard-widgets-container" className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 items-start">
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
                className={`${gridColSpan} bg-surface border border-border rounded-lg flex flex-col justify-between relative overflow-hidden group hover:border-text-secondary transition-all p-5 h-full`}
                style={{ minHeight: isKpi ? "150px" : "350px" }}
              >
                {/* Header Action Row */}
                <div className="flex items-start justify-between border-b border-border pb-3 mb-4">
                  <div className="flex items-center space-x-2 truncate pr-2">
                    {widget.type === "line" && <TrendingUp className="h-4 w-4 text-accent" />}
                    {widget.type === "bar" && <BarChart3 className="h-4 w-4 text-accent" />}
                    {isKpi && (
                      widget.metadata.metricType === "currency" ? (
                        <DollarSign className="h-4 w-4 text-accent" />
                      ) : (
                        <Hash className="h-4 w-4 text-accent" />
                      )
                    )}
                    <h3
                      className="font-sans text-xs font-bold text-foreground uppercase tracking-wide truncate max-w-[150px] sm:max-w-[200px]"
                      title={widget.title}
                    >
                      {widget.title}
                    </h3>
                  </div>

                  {/* Move up / Move down / Delete Action Buttons */}
                  <div data-html2canvas-ignore="true" className="flex items-center space-x-0.5 flex-shrink-0 bg-background border border-border p-1 rounded-lg">
                    <button
                      type="button"
                      onClick={() => moveWidget(index, "up")}
                      disabled={index === 0}
                      title="Move Up"
                      className="p-1 text-muted hover:text-foreground hover:bg-surface rounded-md disabled:opacity-20 disabled:hover:bg-transparent disabled:cursor-not-allowed transition"
                    >
                      <ChevronUp className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => moveWidget(index, "down")}
                      disabled={index === widgets.length - 1}
                      title="Move Down"
                      className="p-1 text-muted hover:text-foreground hover:bg-surface rounded-md disabled:opacity-20 disabled:hover:bg-transparent disabled:cursor-not-allowed transition"
                    >
                      <ChevronDown className="h-3.5 w-3.5" />
                    </button>
                    <div className="w-[1px] h-3.5 bg-border mx-1" />
                    <button
                      type="button"
                      onClick={() => removeWidget(widget.id)}
                      title="Remove Widget"
                      className="p-1 text-muted hover:text-rose-500 hover:bg-rose-500/10 rounded-md transition"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                {/* Main Card Content */}
                <div className="flex-1 flex flex-col justify-center">
                  {/* Error State */}
                  {errorMsg && (
                    <div className="flex items-start space-x-2 text-rose-500 p-2 bg-rose-500/10 border border-rose-500/20 rounded-lg">
                      <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                      <span className="text-[10px] font-semibold leading-relaxed font-mono truncate max-w-[240px]" title={errorMsg}>
                        {errorMsg}
                      </span>
                    </div>
                  )}

                  {/* Loading State */}
                  {isWidgetLoading && (
                    <div className="flex items-center justify-center space-x-2 py-4">
                      <RefreshCw className="h-4 w-4 text-accent animate-spin" />
                      <span className="text-[10px] text-muted font-bold uppercase tracking-wider">Querying DuckDB...</span>
                    </div>
                  )}

                  {/* No Data State */}
                  {!isWidgetLoading && !errorMsg && (!data || data.length === 0) && (
                    <div className="text-center text-muted italic text-[11px] py-4">
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
                              <span className="text-3xl font-extrabold text-foreground block tracking-tight truncate">
                                {formatNumber(mainVal, metricType, sym)}
                              </span>
                            </div>

                            {/* Sub-aggregates details */}
                            {hasSubMetrics && widget.id !== "kpi_total_rows" && (
                              <div className="grid grid-cols-3 gap-1.5 text-[9px] text-muted font-medium mt-4 pt-2.5 border-t border-border">
                                <div>
                                  <span className="text-muted/60 block uppercase tracking-wide text-[8px]">Average</span>
                                  <span className="truncate block mt-0.5 text-foreground" title={formatNumber(row.a as number, metricType, sym)}>
                                    {formatNumber(row.a as number, metricType, sym)}
                                  </span>
                                </div>
                                <div>
                                  <span className="text-muted/60 block uppercase tracking-wide text-[8px]">Minimum</span>
                                  <span className="truncate block mt-0.5 text-foreground" title={formatNumber(row.mn as number, metricType, sym)}>
                                    {formatNumber(row.mn as number, metricType, sym)}
                                  </span>
                                </div>
                                <div>
                                  <span className="text-muted/60 block uppercase tracking-wide text-[8px]">Maximum</span>
                                  <span className="truncate block mt-0.5 text-foreground" title={formatNumber((row.max ?? row.mx) as number, metricType, sym)}>
                                    {formatNumber((row.max ?? row.mx) as number, metricType, sym)}
                                  </span>
                                </div>
                              </div>
                            )}

                            {!hasSubMetrics && (
                              <div className="text-[10px] text-muted mt-3 pt-2.5 border-t border-border">
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
                          <div className="h-60 w-full text-[10px] mt-2 select-none">
                            <ResponsiveContainer width="100%" height="100%">
                              <LineChart data={data} margin={{ top: 10, right: 10, left: 15, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                                <XAxis
                                  dataKey="date_bucket"
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
                                  tickFormatter={(v) => formatNumber(v, isCurrency ? "currency" : "number", sym)}
                                />
                                <Tooltip
                                  contentStyle={{ backgroundColor: "var(--surface)", borderColor: "var(--border)", borderRadius: "6px" }}
                                  itemStyle={{ color: "var(--text-primary)" }}
                                  labelStyle={{ color: "var(--text-secondary)", fontWeight: "500" }}
                                  formatter={(value) => [formatNumber(value as number, isCurrency ? "currency" : "number", sym), displayName]}
                                />
                                <Legend verticalAlign="top" height={36} iconType="circle" />
                                <Line
                                  type="monotone"
                                  dataKey="total_val"
                                  name={displayName}
                                  stroke="var(--accent)"
                                  strokeWidth={2}
                                  activeDot={{ r: 5 }}
                                  dot={{ r: 2, strokeWidth: 1.5 }}
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
                          <div className="h-60 w-full text-[10px] mt-2 select-none">
                            <ResponsiveContainer width="100%" height="100%">
                              <BarChart data={data} margin={{ top: 10, right: 10, left: 15, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                                <XAxis
                                  dataKey="category"
                                  stroke="var(--text-secondary)"
                                  tickLine={false}
                                  axisLine={false}
                                  dy={8}
                                  tickFormatter={(v) => (String(v).length > 12 ? `${String(v).slice(0, 10)}...` : String(v))}
                                />
                                <YAxis
                                  stroke="var(--text-secondary)"
                                  tickLine={false}
                                  axisLine={false}
                                  width={80}
                                  tickFormatter={(v) => formatNumber(v, metricType, sym)}
                                />
                                <Tooltip
                                  contentStyle={{ backgroundColor: "var(--surface)", borderColor: "var(--border)", borderRadius: "6px" }}
                                  itemStyle={{ color: "var(--text-primary)" }}
                                  labelStyle={{ color: "var(--text-secondary)", fontWeight: "500" }}
                                  formatter={(value) => [formatNumber(value as number, metricType, sym), metricName]}
                                />
                                <Legend verticalAlign="top" height={36} iconType="circle" />
                                <Bar
                                  dataKey="val"
                                  name={metricName}
                                  fill="var(--accent)"
                                  radius={[2, 2, 0, 0]}
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 animate-fade-in">
          <div className="bg-surface border border-border rounded-lg p-5 w-full max-w-md relative space-y-4 shadow-lg">
            <button
              onClick={() => setShowSaveModal(false)}
              disabled={saving}
              className="absolute top-4 right-4 text-muted hover:text-foreground disabled:opacity-30 transition focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none rounded p-1"
            >
              <X className="h-4 w-4" />
            </button>

            {/* Success Screen */}
            {saveSuccessId ? (
              <div className="text-center py-2 space-y-3">
                <div className="h-10 w-10 bg-success/10 border border-success/20 text-success rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle2 className="h-5 w-5" />
                </div>
                <div className="space-y-1">
                  <h3 className="font-sans text-xs font-bold text-foreground uppercase tracking-wider">Dashboard Saved!</h3>
                  <p className="text-xs text-muted leading-relaxed">
                    Your layout and column definitions have been persisted under session ID cookie.
                  </p>
                </div>

                <div className="bg-background border border-border p-3 rounded-lg space-y-1 text-[10px] font-mono select-all">
                  <span className="text-muted block text-[8px] font-bold uppercase tracking-wider mb-1">Dashboard ID</span>
                  <span className="text-accent font-bold block">{saveSuccessId}</span>
                </div>

                <div className="pt-2">
                  <button
                    onClick={() => setShowSaveModal(false)}
                    className="w-full py-2 bg-surface hover:bg-surface-subtle text-foreground rounded-lg text-xs font-medium border border-border transition-colors focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
                  >
                    Close Dialog
                  </button>
                </div>
              </div>
            ) : (
              /* Name Form Screen */
              <div className="space-y-4 font-sans">
                <div>
                  <h3 className="font-sans text-xs font-bold text-foreground uppercase tracking-wider">Save Dashboard</h3>
                  <p className="text-xs text-muted mt-1 font-normal">Provide a name to revisit your customized layout and schema later.</p>
                </div>

                <div className="flex flex-col space-y-1.5 text-xs">
                  <label className="text-[9px] font-bold uppercase tracking-wider text-muted font-sans">Dashboard Title</label>
                  <input
                    type="text"
                    value={saveTitle}
                    onChange={(e) => setSaveTitle(e.target.value)}
                    placeholder="Enter dashboard name"
                    disabled={saving}
                    className="bg-background border border-border rounded-lg p-2.5 text-foreground outline-none focus:border-accent text-xs placeholder-muted/30 focus-visible:ring-2 focus-visible:ring-accent/20"
                    maxLength={100}
                  />
                </div>

                {saveError && (
                  <div className="flex items-start space-x-2 text-rose-500 p-2 bg-rose-500/10 border border-rose-500/20 rounded-lg text-xs font-mono">
                    <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    <span>{saveError}</span>
                  </div>
                )}

                <div className="flex justify-end space-x-2 pt-2">
                  <button
                    type="button"
                    disabled={saving}
                    onClick={() => setShowSaveModal(false)}
                    className="px-3.5 py-1.5 bg-background border border-border hover:bg-surface-subtle text-muted hover:text-foreground rounded-lg text-xs font-medium transition-colors focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={saving}
                    onClick={handleSaveDashboard}
                    className="flex items-center space-x-1 px-4 py-1.5 bg-accent hover:opacity-90 disabled:opacity-40 text-white rounded-lg text-xs font-medium transition-colors focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
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
