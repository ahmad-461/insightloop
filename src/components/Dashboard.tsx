"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  TrendingUp,
  BarChart3,
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
  Download,
  MessageSquare
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
  Tooltip
} from "recharts";
import { ParsedResult, ColumnType } from "@/utils/parser";
import { formatNumber } from "@/utils/formatter";
import { getOrCreateSessionId } from "@/utils/session";
import { supabase } from "@/utils/supabaseClient";
import ChatPanel from "./ChatPanel";
import AdvancedInsights from "./AdvancedInsights";
import { AnimatePresence, motion } from "framer-motion";

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

function generateLocalHeuristicCaption(widget: WidgetConfig, data: Record<string, unknown>[]): string {
  if (!data || data.length === 0) return "No data available for analysis.";

  if (widget.type === "line") {
    const values = data.map(d => Number(d.total_val ?? 0)).filter(v => !isNaN(v));
    if (values.length === 0) return `${widget.title}: Data analysis complete.`;
    const minVal = Math.min(...values);
    const maxVal = Math.max(...values);
    const avgVal = values.reduce((sum, v) => sum + v, 0) / values.length;
    const firstVal = values[0];
    const lastVal = values[values.length - 1];
    const direction = lastVal > firstVal ? "growth" : lastVal < firstVal ? "decline" : "stable trend";

    return `${widget.title} demonstrates a overall ${direction}, averaging ${avgVal.toLocaleString(undefined, { maximumFractionDigits: 1 })}, with values spanning from a low of ${minVal.toLocaleString()} to a peak of ${maxVal.toLocaleString()}.`;
  } else if (widget.type === "bar") {
    const values = data.map(d => Number(d.val ?? 0)).filter(v => !isNaN(v));
    if (values.length === 0) return `${widget.title}: Categories analyzed.`;
    const maxIdx = values.indexOf(Math.max(...values));
    const minIdx = values.indexOf(Math.min(...values));
    const maxCat = data[maxIdx]?.category || "N/A";
    const minCat = data[minIdx]?.category || "N/A";
    const maxVal = values[maxIdx];

    return `${widget.title} indicates ${maxCat} is the highest performing category at ${maxVal.toLocaleString()}, while ${minCat} represents the minimum value.`;
  }
  return `${widget.title}: Summary analysis ready.`;
}

export default function Dashboard({
  parsedData,
  datasetLoaded,
  runQuery,
  onDashboardLoaded,
  dashboardId,
  setDashboardId
}: DashboardProps) {
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
  const [barMetricCol, setBarMetricCol] = useState("");
  const [barAgg, setBarAgg] = useState<"SUM" | "COUNT">("SUM");

  // Save Dashboard Modal State
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [saveTitle, setSaveTitle] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveSuccessId, setSaveSuccessId] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  const [exportingPdf, setExportingPdf] = useState(false);

  // 3-ZONE COMMAND CENTER STATES
  const [focusedWidgetId, setFocusedWidgetId] = useState<string | null>(null);
  const [isChatOpen, setIsChatOpen] = useState(true);
  const [explanationsCache, setExplanationsCache] = useState<Record<string, string>>({});
  const [autoExplLoading, setAutoExplLoading] = useState<Record<string, boolean>>({});

  // Caching mechanism helper
  const getCacheKey = useCallback((widget: WidgetConfig): string => {
    const data = widgetData[widget.id] || [];
    const serializedData = JSON.stringify(data.slice(0, 10));
    let hash = 0;
    for (let i = 0; i < serializedData.length; i++) {
      hash = (hash << 5) - hash + serializedData.charCodeAt(i);
      hash |= 0;
    }
    return `${widget.id}_${hash}`;
  }, [widgetData]);

  // Determine active schema columns
  const dateCols = useMemo(() => parsedData.schema.filter(c => c.currentType === "date"), [parsedData.schema]);
  const numCols = useMemo(() => parsedData.schema.filter(c => c.currentType === "number" || c.currentType === "currency"), [parsedData.schema]);
  const catCols = useMemo(() => parsedData.schema.filter(c => c.currentType === "category"), [parsedData.schema]);

  const getColCurrencySymbol = useCallback((colName: string): string => {
    const col = parsedData.schema.find(c => c.columnName === colName);
    return col?.currencySymbol || "$";
  }, [parsedData.schema]);

  // Generate complete set of automatic default widgets
  const initializeDashboardWidgets = useCallback(async () => {
    if (!datasetLoaded) return;
    setError(null);

    try {
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

      // Total Rows Card
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

      // Numeric/Currency aggregates KPI Cards
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

      // Line Charts
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

      // Bar Charts
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

      // Auto focus the first non-KPI chart
      const firstChart = defaultWidgets.find(w => w.type !== "kpi");
      if (firstChart) {
        setFocusedWidgetId(firstChart.id);
      } else if (defaultWidgets.length > 0) {
        setFocusedWidgetId(defaultWidgets[0].id);
      }

      setWidgetData({});
      setWidgetErrors({});
      setLoadingWidgets({});

      if (onDashboardLoaded) {
        onDashboardLoaded();
      }
    } catch (err: unknown) {
      console.error("Dashboard defaults generation failed:", err);
      setError(err instanceof Error ? err.message : "Failed to load dashboard statistics.");
    }
  }, [datasetLoaded, dateCols, numCols, catCols, runQuery, onDashboardLoaded]);

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

  // Always-On AI Annotations Trigger
  useEffect(() => {
    if (!focusedWidgetId) return;
    const widget = widgets.find(w => w.id === focusedWidgetId);
    if (!widget || widget.type === "kpi") return;

    const data = widgetData[focusedWidgetId];
    if (!data || data.length === 0) return;

    const cacheKey = getCacheKey(widget);
    if (explanationsCache[cacheKey]) return; // Already cached

    const fetchCaption = async () => {
      setAutoExplLoading(prev => ({ ...prev, [focusedWidgetId]: true }));
      try {
        const res = await fetch("/api/explain-chart", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: widget.title,
            type: widget.type,
            data,
          }),
        });

        if (!res.ok) {
          throw new Error("API failed");
        }

        const resData = await res.json();
        setExplanationsCache(prev => ({
          ...prev,
          [cacheKey]: resData.explanation,
        }));
      } catch (err) {
        console.warn("API explanation failed, using local heuristic fallback:", err);
        const fallback = generateLocalHeuristicCaption(widget, data);
        setExplanationsCache(prev => ({
          ...prev,
          [cacheKey]: fallback,
        }));
      } finally {
        setAutoExplLoading(prev => ({ ...prev, [focusedWidgetId]: false }));
      }
    };

    fetchCaption();
  }, [focusedWidgetId, widgetData, widgets, getCacheKey, explanationsCache]);

  // Reordering & deleting
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

  const removeWidget = (id: string) => {
    setWidgets((prev) => prev.filter((w) => w.id !== id));
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
    if (focusedWidgetId === id) {
      setFocusedWidgetId(null);
    }
  };

  // Pre-populate Form selections
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

  // Add Custom Widget
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
    setFocusedWidgetId(id);
    setCustomTitle("");
    setNewType("");
    setShowAddForm(false);
  };

  // Save Dashboard
  const handleSaveDashboard = async () => {
    setSaving(true);
    setSaveError(null);
    setSaveSuccessId(null);

    try {
      const sessionId = getOrCreateSessionId();
      const titleToSave = saveTitle.trim() || parsedData.fileName;

      if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
        throw new Error("Supabase connection parameters are not fully set in the workspace.");
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

        if (supabaseError) throw supabaseError;
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

        if (supabaseError) throw supabaseError;
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

  const triggerSaveModal = () => {
    const cleanFileName = parsedData.fileName.replace(/\.(csv|xlsx|xls)$/i, "");
    setSaveTitle(cleanFileName);
    setSaveError(null);
    setSaveSuccessId(dashboardId);
    setShowSaveModal(true);
  };

  // High-fidelity PDF Export
  const handleExportPDF = async () => {
    if (widgets.length === 0) return;
    setExportingPdf(true);
    try {
      const { default: jsPDF } = await import("jspdf");
      const { default: html2canvas } = await import("html2canvas");

      const element = document.getElementById("pdf-export-hidden-container");
      if (!element) {
        throw new Error("PDF export container not found.");
      }

      element.classList.add("pdf-export-mode");
      document.body.classList.add("pdf-export-mode");

      const isDarkModeActive = document.documentElement.classList.contains("dark");

      let canvas;
      try {
        canvas = await html2canvas(element, {
          scale: 2,
          backgroundColor: isDarkModeActive ? "#0f172a" : "#ffffff",
          useCORS: true,
          logging: false,
        });
      } finally {
        element.classList.remove("pdf-export-mode");
        document.body.classList.remove("pdf-export-mode");
      }

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
      pdf.save(`${cleanFileName}_dashboard_report.pdf`);
    } catch (err) {
      console.error("PDF export failed:", err);
      alert("Failed to export PDF. Please try again.");
    } finally {
      setExportingPdf(false);
    }
  };

  // Handle Command Palette Global Events
  useEffect(() => {
    const handleExportEvent = () => handleExportPDF();
    const handleSaveEvent = () => triggerSaveModal();

    window.addEventListener("insightloop-export-pdf", handleExportEvent);
    window.addEventListener("insightloop-save-dashboard", handleSaveEvent);

    return () => {
      window.removeEventListener("insightloop-export-pdf", handleExportEvent);
      window.removeEventListener("insightloop-save-dashboard", handleSaveEvent);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [widgets, parsedData, saveTitle, dashboardId]);

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

  // Split widgets into KPIs and Charts for the Command Center
  const kpiWidgets = widgets.filter(w => w.type === "kpi");
  const chartWidgets = widgets.filter(w => w.type !== "kpi");

  // Determine active focused widget config
  const activeWidget = widgets.find(w => w.id === focusedWidgetId) || chartWidgets[0] || widgets[0];

  return (
    <div className="space-y-6 animate-fade-in font-sans relative">

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

          {/* Chat toggle button on desktop */}
          <button
            onClick={() => setIsChatOpen(!isChatOpen)}
            className="hidden lg:flex items-center space-x-1.5 px-3 py-1.5 bg-surface hover:bg-surface-subtle text-foreground border border-border rounded-lg text-xs font-medium transition-all focus-visible:ring-2 focus-visible:ring-accent"
          >
            <MessageSquare className="h-3.5 w-3.5 text-accent" />
            <span>{isChatOpen ? "Hide Chat" : "Show Chat"}</span>
          </button>
        </div>
      </div>

      {/* ➕ Add Custom Widget Form Panel */}
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
            <p className="text-[10px] text-muted mt-1 font-normal">Specify layout configuration to build a new chart or KPI card.</p>
          </div>

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

      {/* 🚀 3-ZONE COMMAND CENTER WORKSPACE */}
      <div className="flex flex-col lg:flex-row gap-6 items-stretch w-full">

        {/* ZONE 1: LEFT RAIL (Narrow, Persistent, Compact KPIs) */}
        <div className="w-full lg:w-64 xl:w-72 shrink-0 flex flex-col gap-4 overflow-y-auto max-h-[calc(100vh-180px)] lg:sticky lg:top-24 scrollbar-none border-b lg:border-b-0 lg:border-r border-border pb-6 lg:pb-0 lg:pr-4">
          <div className="font-mono text-[10px] font-extrabold text-muted uppercase tracking-wider border-b border-border pb-2 mb-1 flex items-center justify-between">
            <span>KPI Metrics</span>
            <span className="text-[9px] bg-background border border-border px-1.5 py-0.5 rounded text-muted font-bold">{kpiWidgets.length}</span>
          </div>

          <div className="flex flex-row lg:flex-col gap-3 overflow-x-auto lg:overflow-x-visible pb-2 lg:pb-0 shrink-0 select-none">
            {kpiWidgets.map((widget) => {
              const isWidgetLoading = loadingWidgets[widget.id];
              const errorMsg = widgetErrors[widget.id];
              const data = widgetData[widget.id];

              const isCurrency = widget.metadata.metricType === "currency";
              const sym = isCurrency ? getColCurrencySymbol(widget.metadata.metricColumn || "") : undefined;
              const metricType = (widget.metadata.metricType as "number" | "currency") || "number";

              let mainVal = 0;
              if (data && data[0]) {
                const row = data[0];
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
              }

              return (
                <div
                  key={widget.id}
                  className="bg-surface border border-border hover:border-text-secondary/60 rounded-xl p-3.5 flex flex-col justify-between min-w-[150px] lg:w-full shrink-0 shadow-xs relative overflow-hidden transition-all"
                >
                  <div className="flex items-center justify-between gap-2 border-b border-border/40 pb-1.5 mb-2">
                    <span className="text-[10px] font-bold text-foreground truncate block uppercase tracking-wider" title={widget.title}>
                      {widget.title}
                    </span>
                    <button
                      onClick={() => removeWidget(widget.id)}
                      className="text-muted hover:text-rose-500 rounded p-0.5 transition"
                      title="Remove KPI"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>

                  {isWidgetLoading ? (
                    <div className="h-6 w-16 bg-surface-subtle animate-pulse rounded" />
                  ) : errorMsg ? (
                    <span className="text-[9px] text-rose-500 font-mono truncate">{errorMsg}</span>
                  ) : (
                    <span className="text-lg font-extrabold text-foreground tracking-tight block truncate">
                      {formatNumber(mainVal, metricType, sym)}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* ZONE 2: CENTER CANVAS (Focus Mode, filmstrip navigation, always-on AI Annotations, AdvancedInsights) */}
        <div className="flex-1 flex flex-col gap-6 overflow-hidden">

          {/* Focused Active Chart Card */}
          {activeWidget && activeWidget.type !== "kpi" ? (() => {
            const isWidgetLoading = loadingWidgets[activeWidget.id];
            const errorMsg = widgetErrors[activeWidget.id];
            const data = widgetData[activeWidget.id];

            const cacheKey = getCacheKey(activeWidget);
            const activeCaption = explanationsCache[cacheKey];
            const isCaptionLoading = autoExplLoading[activeWidget.id];

            const index = widgets.findIndex(w => w.id === activeWidget.id);

            return (
              <div className="bg-surface border border-border rounded-xl p-6 shadow-sm relative flex flex-col justify-between min-h-[460px] animate-fade-in">

                {/* Header with Widget Controls */}
                <div className="flex items-center justify-between border-b border-border pb-3 mb-4 select-none">
                  <div className="flex items-center space-x-2">
                    {activeWidget.type === "line" ? (
                      <TrendingUp className="h-4.5 w-4.5 text-accent" />
                    ) : (
                      <BarChart3 className="h-4.5 w-4.5 text-accent" />
                    )}
                    <h3 className="font-sans text-xs font-bold text-foreground uppercase tracking-wider truncate max-w-sm" title={activeWidget.title}>
                      {activeWidget.title}
                    </h3>
                  </div>

                  {/* Move/Delete controls on center canvas */}
                  <div className="flex items-center space-x-1.5 bg-background border border-border p-1 rounded-lg">
                    <button
                      type="button"
                      onClick={() => moveWidget(index, "up")}
                      disabled={index <= 0}
                      className="p-1 text-muted hover:text-foreground disabled:opacity-20 disabled:cursor-not-allowed rounded"
                      title="Move Left"
                    >
                      <ChevronUp className="h-3.5 w-3.5 rotate-270" />
                    </button>
                    <button
                      type="button"
                      onClick={() => moveWidget(index, "down")}
                      disabled={index >= widgets.length - 1}
                      className="p-1 text-muted hover:text-foreground disabled:opacity-20 disabled:cursor-not-allowed rounded"
                      title="Move Right"
                    >
                      <ChevronDown className="h-3.5 w-3.5 rotate-270" />
                    </button>
                    <div className="w-[1px] h-3.5 bg-border" />
                    <button
                      type="button"
                      onClick={() => removeWidget(activeWidget.id)}
                      className="p-1 text-muted hover:text-rose-500 rounded"
                      title="Delete Widget"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                {/* Chart Visualization canvas */}
                <div className="flex-1 flex flex-col justify-center min-h-[250px]">
                  {isWidgetLoading ? (
                    <div className="flex items-center justify-center space-x-2 py-10">
                      <RefreshCw className="h-5 w-5 text-accent animate-spin" />
                      <span className="text-xs text-muted font-bold uppercase tracking-wider">Loading database query...</span>
                    </div>
                  ) : errorMsg ? (
                    <div className="p-4 bg-rose-500/10 border border-rose-500/20 text-rose-500 rounded-lg text-xs font-mono">
                      {errorMsg}
                    </div>
                  ) : !data || data.length === 0 ? (
                    <span className="text-xs text-muted italic text-center block">No data found</span>
                  ) : (
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={activeWidget.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.15 }}
                        className="w-full h-[250px]"
                      >
                        {activeWidget.type === "line" && (() => {
                          const isCurrency = activeWidget.metadata.metricType === "currency";
                          const sym = isCurrency ? getColCurrencySymbol(activeWidget.metadata.metricColumn || "") : undefined;
                          const colName = activeWidget.metadata.metricColumn || "";
                          const displayName = parsedData.schema.find(c => c.columnName === colName)?.displayName || colName;

                          return (
                            <ResponsiveContainer width="100%" height="100%">
                              <LineChart data={data} margin={{ top: 10, right: 10, left: 15, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                                <XAxis dataKey="date_bucket" stroke="var(--text-secondary)" tickLine={false} axisLine={false} />
                                <YAxis stroke="var(--text-secondary)" tickLine={false} axisLine={false} width={80} tickFormatter={(v) => formatNumber(v, isCurrency ? "currency" : "number", sym)} />
                                <Tooltip
                                  contentStyle={{ backgroundColor: "var(--surface)", borderColor: "var(--border)", borderRadius: "6px" }}
                                  itemStyle={{ color: "var(--text-primary)" }}
                                  labelStyle={{ color: "var(--text-secondary)", fontWeight: "500" }}
                                />
                                <Line type="monotone" dataKey="total_val" name={displayName} stroke="var(--accent)" strokeWidth={2} dot={{ r: 2 }} />
                              </LineChart>
                            </ResponsiveContainer>
                          );
                        })()}

                        {activeWidget.type === "bar" && (() => {
                          const colName = activeWidget.metadata.metricColumn || "";
                          const metricName = activeWidget.metadata.metricColumn
                            ? (parsedData.schema.find(c => c.columnName === colName)?.displayName || colName)
                            : "Count";
                          const isCurrency = activeWidget.metadata.metricType === "currency";
                          const sym = isCurrency ? getColCurrencySymbol(colName) : undefined;
                          const metricType = (activeWidget.metadata.metricType as "number" | "currency") || "number";

                          return (
                            <ResponsiveContainer width="100%" height="100%">
                              <BarChart data={data} margin={{ top: 10, right: 10, left: 15, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                                <XAxis dataKey="category" stroke="var(--text-secondary)" tickLine={false} axisLine={false} tickFormatter={(v) => (String(v).length > 12 ? `${String(v).slice(0, 10)}...` : String(v))} />
                                <YAxis stroke="var(--text-secondary)" tickLine={false} axisLine={false} width={80} tickFormatter={(v) => formatNumber(v, metricType, sym)} />
                                <Tooltip
                                  contentStyle={{ backgroundColor: "var(--surface)", borderColor: "var(--border)", borderRadius: "6px" }}
                                  itemStyle={{ color: "var(--text-primary)" }}
                                  labelStyle={{ color: "var(--text-secondary)", fontWeight: "500" }}
                                />
                                <Bar dataKey="val" name={metricName} fill="var(--accent)" radius={[2, 2, 0, 0]} />
                              </BarChart>
                            </ResponsiveContainer>
                          );
                        })()}
                      </motion.div>
                    </AnimatePresence>
                  )}
                </div>

                {/* Always-on AI chart annotation caption directly beneath */}
                <div className="mt-6 pt-4 border-t border-border select-text">
                  <span className="text-[9px] font-mono text-accent uppercase font-extrabold tracking-widest block mb-2">AI CHART CAPTION</span>
                  {isCaptionLoading ? (
                    <div className="space-y-1.5 animate-pulse">
                      <div className="h-3 bg-surface-subtle rounded w-3/4"></div>
                    </div>
                  ) : (
                    <p className="text-xs text-foreground leading-relaxed font-normal">
                      {activeCaption || "Calculating stats interpretation..."}
                    </p>
                  )}
                </div>

              </div>
            );
          })() : (
            <div className="bg-surface border border-border rounded-xl p-8 text-center text-muted italic text-xs h-[300px] flex items-center justify-center">
              Please configure custom charts using the &quot;Add Custom Widget&quot; dialog above.
            </div>
          )}

          {/* FILMSTRIP NAVIGATION (Horizontal row of small thumbnail-style previews below focused chart) */}
          <div className="space-y-2 select-none">
            <span className="text-[10px] font-mono text-muted uppercase font-bold tracking-wider block">Chart Filmstrip Navigation</span>
            <div className="flex items-stretch gap-3 overflow-x-auto pb-2 scrollbar-thin">
              {chartWidgets.map((widget) => (
                <button
                  key={widget.id}
                  onClick={() => setFocusedWidgetId(widget.id)}
                  className={`p-3 rounded-xl border text-left shrink-0 w-44 flex flex-col justify-between gap-1 transition-all focus-visible:ring-2 focus-visible:ring-accent ${
                    focusedWidgetId === widget.id
                      ? "bg-accent/5 border-accent shadow-xs"
                      : "bg-surface border-border hover:border-text-secondary/60"
                  }`}
                >
                  <span className="text-[10px] font-bold text-foreground truncate block w-full" title={widget.title}>
                    {widget.title}
                  </span>
                  <div className="flex items-center space-x-1.5 text-[8px] font-bold text-muted uppercase tracking-wider">
                    {widget.type === "line" ? (
                      <>
                        <TrendingUp className="h-3 w-3 text-accent" />
                        <span>Line Chart</span>
                      </>
                    ) : (
                      <>
                        <BarChart3 className="h-3 w-3 text-accent" />
                        <span>Bar Chart</span>
                      </>
                    )}
                  </div>
                </button>
              ))}
              {chartWidgets.length === 0 && (
                <span className="text-[10px] text-muted italic p-2">No active charts on filmstrip</span>
              )}
            </div>
          </div>

          {/* Expandable AdvancedInsights inside the Center Canvas */}
          <div className="mt-2">
            <AdvancedInsights
              parsedData={parsedData}
              datasetLoaded={datasetLoaded}
              runQuery={runQuery}
            />
          </div>

          {/* Mobile Collapsible AI Chat bottom drawer */}
          <div className="block lg:hidden mt-4">
            <div className="font-mono text-[10px] font-extrabold text-muted uppercase tracking-wider border-b border-border pb-2 mb-3">
              Conversational Co-Pilot (Mobile Sheet)
            </div>
            <ChatPanel
              datasetLoaded={datasetLoaded}
              schema={parsedData.schema}
              runQuery={runQuery}
              dashboardId={dashboardId}
            />
          </div>

        </div>

        {/* ZONE 3: RIGHT PANEL (Persistent AI Chat, Defaults Open, Collapsible on Desktop) */}
        {isChatOpen && (
          <div className="hidden lg:flex w-96 shrink-0 flex-col sticky top-24 max-h-[calc(100vh-180px)] overflow-y-auto scrollbar-none border-l border-border pl-4">
            <div className="font-mono text-[10px] font-extrabold text-muted uppercase tracking-wider border-b border-border pb-2 mb-3 flex items-center justify-between">
              <span>Conversational Assistant</span>
              <button
                onClick={() => setIsChatOpen(false)}
                className="text-xs text-muted hover:text-foreground font-bold"
              >
                Hide
              </button>
            </div>
            <ChatPanel
              datasetLoaded={datasetLoaded}
              schema={parsedData.schema}
              runQuery={runQuery}
              dashboardId={dashboardId}
            />
          </div>
        )}

      </div>

      {/* 💾 Save Dashboard Modal */}
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

            {saveSuccessId ? (
              <div className="text-center py-2 space-y-3">
                <div className="h-10 w-10 bg-success/10 border border-success/20 text-success rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle2 className="h-5 w-5" />
                </div>
                <div className="space-y-1">
                  <h3 className="font-sans text-xs font-bold text-foreground uppercase tracking-wider">Dashboard Saved!</h3>
                  <p className="text-xs text-muted leading-relaxed">
                    Your layout and column definitions have been persisted under your session.
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
              <div className="space-y-4 font-sans text-xs font-normal">
                <div>
                  <h3 className="font-sans text-xs font-bold text-foreground uppercase tracking-wider">Save Dashboard</h3>
                  <p className="text-xs text-muted mt-1">Provide a name to revisit your customized layout and schema later.</p>
                </div>

                <div className="flex flex-col space-y-1.5">
                  <label className="text-[9px] font-bold uppercase tracking-wider text-muted font-sans">Dashboard Title</label>
                  <input
                    type="text"
                    value={saveTitle}
                    onChange={(e) => setSaveTitle(e.target.value)}
                    placeholder="Enter dashboard name"
                    disabled={saving}
                    className="bg-background border border-border rounded-lg p-2.5 text-foreground outline-none focus:border-accent placeholder-muted/30 focus-visible:ring-2 focus-visible:ring-accent/20"
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

      {/* 📄 HIDDEN FULL-GRID CONTAINER FOR HIGH-FIDELITY COMPLETE PDF EXPORTS */}
      <div className="absolute left-[-9999px] top-[-9999px] w-[1000px] flex flex-col gap-6 p-8 bg-slate-900 text-slate-100 rounded-xl" id="pdf-export-hidden-container">
        <div className="border-b border-slate-800 pb-4 mb-2 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-slate-50">{parsedData.fileName} - Dashboard Report</h1>
            <p className="text-xs text-slate-400">InsightLoop AI Analytical Executive PDF Summary</p>
          </div>
          <span className="text-xs font-mono text-accent">ID: {dashboardId || "local_sandbox"}</span>
        </div>

        {/* KPIs in the hidden PDF layout */}
        <div className="grid grid-cols-4 gap-4">
          {kpiWidgets.map(widget => {
            const data = widgetData[widget.id];
            const isCurrency = widget.metadata.metricType === "currency";
            const sym = isCurrency ? getColCurrencySymbol(widget.metadata.metricColumn || "") : undefined;
            const metricType = (widget.metadata.metricType as "number" | "currency") || "number";

            let val = 0;
            if (data && data[0]) {
              const row = data[0];
              if (widget.id === "kpi_total_rows" || !widget.metadata.metricColumn) {
                val = Number(row.cnt ?? row.total_rows ?? Object.values(row)[0] ?? 0);
              } else {
                const agg = widget.metadata.aggregation || "SUM";
                if (agg === "SUM") val = Number(row.s ?? 0);
                else if (agg === "AVG") val = Number(row.a ?? 0);
                else if (agg === "MIN") val = Number(row.mn ?? 0);
                else if (agg === "MAX") val = Number(row.mx ?? 0);
                else if (agg === "COUNT") val = Number(row.cnt ?? 0);
              }
            }

            return (
              <div key={widget.id} className="border border-slate-800 rounded-xl p-4 bg-slate-950 flex flex-col justify-between">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider truncate mb-1">{widget.title}</span>
                <span className="text-lg font-bold text-slate-50">{formatNumber(val, metricType, sym)}</span>
              </div>
            );
          })}
        </div>

        {/* Charts stacked/gridded inside hidden PDF container */}
        <div className="grid grid-cols-2 gap-6 mt-4">
          {chartWidgets.map(widget => {
            const data = widgetData[widget.id];
            if (!data || data.length === 0) return null;

            return (
              <div key={widget.id} className="border border-slate-800 rounded-xl p-5 bg-slate-950 flex flex-col justify-between min-h-[350px]">
                <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider mb-4 pb-2 border-b border-slate-800">{widget.title}</h3>

                <div className="h-52 w-full text-[9px]">
                  <ResponsiveContainer width="100%" height="100%">
                    {widget.type === "line" ? (() => {
                      const isCurrency = widget.metadata.metricType === "currency";
                      const sym = isCurrency ? getColCurrencySymbol(widget.metadata.metricColumn || "") : undefined;
                      const colName = widget.metadata.metricColumn || "";
                      const displayName = parsedData.schema.find(c => c.columnName === colName)?.displayName || colName;

                      return (
                        <LineChart data={data}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                          <XAxis dataKey="date_bucket" stroke="#94a3b8" />
                          <YAxis stroke="#94a3b8" width={60} tickFormatter={(v) => formatNumber(v, isCurrency ? "currency" : "number", sym)} />
                          <Line type="monotone" dataKey="total_val" name={displayName} stroke="#3b82f6" strokeWidth={2} dot={false} />
                        </LineChart>
                      );
                    })() : (() => {
                      const colName = widget.metadata.metricColumn || "";
                      const metricName = widget.metadata.metricColumn
                        ? (parsedData.schema.find(c => c.columnName === colName)?.displayName || colName)
                        : "Count";
                      const isCurrency = widget.metadata.metricType === "currency";
                      const sym = isCurrency ? getColCurrencySymbol(colName) : undefined;
                      const metricType = (widget.metadata.metricType as "number" | "currency") || "number";

                      return (
                        <BarChart data={data}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                          <XAxis dataKey="category" stroke="#94a3b8" tickFormatter={(v) => (String(v).length > 10 ? `${String(v).slice(0, 8)}...` : String(v))} />
                          <YAxis stroke="#94a3b8" width={60} tickFormatter={(v) => formatNumber(v, metricType, sym)} />
                          <Bar dataKey="val" name={metricName} fill="#3b82f6" />
                        </BarChart>
                      );
                    })()}
                  </ResponsiveContainer>
                </div>

                <div className="mt-3 pt-3 border-t border-slate-800 text-[10px] text-slate-400 leading-relaxed font-normal">
                  <span className="font-bold text-slate-300 block mb-1">AI INSIGHT INSIGHTS</span>
                  {explanationsCache[getCacheKey(widget)] || generateLocalHeuristicCaption(widget, data)}
                </div>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}
