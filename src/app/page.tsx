"use client";

import React, { useState, useRef, useTransition, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
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
  Play,
  CheckCircle,
  Server,
  CodeXml,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  LayoutDashboard,
  MessageSquare,
  Cpu,
  ShieldCheck,
  UserCheck,
  Zap,
  ArrowRight,
  FileDown,
  TrendingUp
} from "lucide-react";
import { motion } from "framer-motion";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer
} from "recharts";
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
import { supabase } from "@/utils/supabaseClient";

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB

// Scroll-Reveal Animated Card Component using IntersectionObserver / Framer Motion
function ScrollRevealCard({
  children,
  index,
  reducedMotion
}: {
  children: React.ReactNode;
  index: number;
  reducedMotion: boolean;
}) {
  return (
    <motion.div
      initial={reducedMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
      whileInView={reducedMotion ? { opacity: 1, y: 0 } : { opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={
        reducedMotion
          ? { duration: 0 }
          : { duration: 0.5, ease: "easeOut", delay: index * 0.1 }
      }
      className="h-full"
    >
      {children}
    </motion.div>
  );
}

// Sample Data for Hero Dashboard Preview Chart
const SAMPLE_CHART_DATA = [
  { month: "Jan", sales: 14000, targets: 12000 },
  { month: "Feb", sales: 19000, targets: 13500 },
  { month: "Mar", sales: 26000, targets: 18000 },
  { month: "Apr", sales: 34000, targets: 24000 },
  { month: "May", sales: 42000, targets: 31000 },
  { month: "Jun", sales: 51000, targets: 38000 },
];

function HomeContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const reactivateId = searchParams ? searchParams.get("reactivate") : null;
  const scrollParam = searchParams ? searchParams.get("scroll") : null;

  const [parsedData, setParsedData] = useState<ParsedResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isPending, startTransition] = useTransition();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Reactivation flow states
  const [targetDashboard, setTargetDashboard] = useState<{ title: string | null; dataset_summary: unknown } | null>(null);
  const [reactivateWarning, setReactivateWarning] = useState<string | null>(null);

  // DuckDB Integration State
  const { loading: dbLoading, error: dbError, datasetLoaded, loadDataset, runQuery } = useDuckDB();
  const [syncStatus, setSyncStatus] = useState<{ loading: boolean; error: string | null }>({ loading: false, error: null });
  const [sqlQuery, setSqlQuery] = useState("SELECT * FROM dataset LIMIT 10");
  const [queryResults, setQueryResults] = useState<Record<string, unknown>[] | null>(null);
  const [queryError, setQueryError] = useState<string | null>(null);
  const [queryRunning, setQueryRunning] = useState(false);

  // Shared Dashboard ID state for Persisted Analytics
  const [dashboardId, setDashboardId] = useState<string | null>(null);

  // UI Panels collapsing states
  const [isPreviewCollapsed, setIsPreviewCollapsed] = useState(false);
  const [isConsoleCollapsed, setIsConsoleCollapsed] = useState(true);

  // Prefers reduced motion media query hook
  const [reducedMotion, setReducedMotion] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined") return;
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mediaQuery.matches);
    const listener = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mediaQuery.addEventListener("change", listener);
    return () => mediaQuery.removeEventListener("change", listener);
  }, []);

  // Handle URL query parameters for scrolling on mount
  useEffect(() => {
    if (scrollParam) {
      router.replace("/");

      setTimeout(() => {
        const el = document.getElementById(scrollParam);
        if (el) {
          el.scrollIntoView({ behavior: reducedMotion ? "auto" : "smooth" });
        }
      }, 300);
    }
  }, [scrollParam, router, reducedMotion]);

  // Automatically collapse preview when dashboard loaded
  const handleDashboardLoaded = () => {
    setIsPreviewCollapsed(true);
  };

  // Fetch target dashboard schema summary for reactivation matching
  useEffect(() => {
    if (!reactivateId) {
      setTargetDashboard(null);
      return;
    }

    const fetchTargetSummary = async () => {
      try {
        const { data, error: sbError } = await supabase
          .from("dashboards")
          .select("title, dataset_summary")
          .eq("id", reactivateId)
          .single();

        if (sbError) throw sbError;
        if (data) {
          setTargetDashboard(data);
        }
      } catch (err) {
        console.error("Failed to load dashboard summary for reactivation:", err);
      }
    };

    fetchTargetSummary();
  }, [reactivateId]);

  // Automatic DuckDB Load / Re-creation sync effect for standard flow
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
  }, [parsedData, loadDataset]);

  // Schema matching checker
  const matchSchemas = (savedSummary: unknown, uploadedSchema: ColumnSchema[]): boolean => {
    if (!savedSummary) return false;

    let savedSchema: ColumnSchema[] = [];
    if (typeof savedSummary === "object" && !Array.isArray(savedSummary) && "schema" in savedSummary) {
      savedSchema = Array.isArray((savedSummary as { schema: unknown }).schema) ? ((savedSummary as { schema: ColumnSchema[] }).schema) : [];
    } else if (Array.isArray(savedSummary)) {
      savedSchema = savedSummary as ColumnSchema[];
    } else {
      return false;
    }

    if (savedSchema.length === 0) return false;

    const isCompatible = (t1: string, t2: string) => {
      if (t1 === t2) return true;
      if ((t1 === "text" || t1 === "category") && (t2 === "text" || t2 === "category")) return true;
      if ((t1 === "number" || t1 === "currency") && (t2 === "number" || t2 === "currency")) return true;
      return false;
    };

    for (const savedCol of savedSchema) {
      const uploadedCol = uploadedSchema.find((u) => u.sqlSafeName === savedCol.sqlSafeName);
      if (!uploadedCol) {
        console.warn("Schema match failed: missing column", savedCol.sqlSafeName);
        return false;
      }
      if (!isCompatible(savedCol.currentType, uploadedCol.currentType)) {
        console.warn(
          "Schema match failed: incompatible type for column",
          savedCol.sqlSafeName,
          "saved:",
          savedCol.currentType,
          "uploaded:",
          uploadedCol.currentType
        );
        return false;
      }
    }

    return true;
  };

  // Handle parsing a selected File
  const handleFileProcess = (file: File) => {
    setError(null);
    setReactivateWarning(null);
    setQueryResults(null);
    setQueryError(null);

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

        if (reactivateId && targetDashboard) {
          const matches = matchSchemas(targetDashboard.dataset_summary, result.schema);
          if (matches) {
            let savedCols: ColumnSchema[] = [];
            const summary = targetDashboard.dataset_summary;
            if (
              summary &&
              typeof summary === "object" &&
              !Array.isArray(summary) &&
              "schema" in (summary as Record<string, unknown>)
            ) {
              savedCols = (summary as { schema: ColumnSchema[] }).schema;
            } else if (Array.isArray(summary)) {
              savedCols = summary as ColumnSchema[];
            }

            const alignedSchema = result.schema.map((uploadedCol) => {
              const matchedSavedCol = savedCols.find((s) => s.sqlSafeName === uploadedCol.sqlSafeName);
              if (matchedSavedCol) {
                return {
                  ...uploadedCol,
                  currentType: matchedSavedCol.currentType,
                };
              }
              return uploadedCol;
            });

            const alignedResult = {
              ...result,
              schema: alignedSchema,
            };

            setSyncStatus({ loading: true, error: null });
            const loadRes = await loadDataset(alignedResult);
            if (!loadRes.success) {
              throw new Error(loadRes.error || "Failed to load reactivated database.");
            }
            setSyncStatus({ loading: false, error: null });

            const strippedResult = {
              ...alignedResult,
              rawRows: [],
            };
            sessionStorage.setItem(`insightloop_reactivated_parsed_data_${reactivateId}`, JSON.stringify(strippedResult));

            router.push(`/dashboards/${reactivateId}`);
            return;
          } else {
            setReactivateWarning(
              `The uploaded file's schema does not match the saved dashboard. Reverting to normal auto-generation.`
            );
          }
        }

        setParsedData(result);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "An unexpected error occurred while parsing.";
        setError(msg);
      }
    });
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFileProcess(e.target.files[0]);
    }
  };

  const triggerFileBrowser = () => {
    fileInputRef.current?.click();
  };

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

  const handleClear = () => {
    setParsedData(null);
    setError(null);
    setReactivateWarning(null);
    setQueryResults(null);
    setQueryError(null);
    setSqlQuery("SELECT * FROM dataset LIMIT 10");
    setIsPreviewCollapsed(false);
    setIsConsoleCollapsed(true);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

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

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const getTypeIcon = (type: ColumnType) => {
    switch (type) {
      case "date":
        return <Calendar className="h-3 w-3 text-accent" />;
      case "number":
        return <Hash className="h-3 w-3 text-accent" />;
      case "currency":
        return <DollarSign className="h-3 w-3 text-accent" />;
      case "category":
        return <Tag className="h-3 w-3 text-accent" />;
      case "text":
      default:
        return <Type className="h-3 w-3 text-muted" />;
    }
  };

  const getTypeLabel = (type: ColumnType) => {
    switch (type) {
      case "date": return "📅 date";
      case "number": return "🔢 number";
      case "currency": return "💰 currency";
      case "category": return "🏷️ category";
      case "text": return "📝 text";
    }
  };

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
    <div className="flex-1 w-full max-w-7xl mx-auto px-6 py-12 space-y-16 relative z-10 pt-10">
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes draw-path {
          from { stroke-dashoffset: 400; }
          to { stroke-dashoffset: 0; }
        }
        .animate-draw-path {
          stroke-dasharray: 400;
          stroke-dashoffset: 400;
          animation: draw-path 4s linear infinite;
        }
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(4px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 0.4s ease-out forwards;
        }
        .enterprise-dot-grid {
          background-image: radial-gradient(var(--border) 1px, transparent 1px);
          background-size: 20px 20px;
        }
      `}} />

      {/* REACTIVATION INFO BOX */}
      {reactivateId && targetDashboard && !parsedData && (
        <div className="bg-surface border border-border p-5 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 max-w-3xl mx-auto animate-fade-in shadow-sm">
          <div className="flex items-start space-x-3">
            <RefreshCw className="h-5 w-5 text-accent mt-0.5 animate-spin flex-shrink-0" />
            <div className="space-y-1">
              <h4 className="text-xs font-bold text-foreground">Reactivating Saved Dashboard</h4>
              <p className="text-xs text-muted leading-relaxed">
                Please upload the original spreadsheet for &quot;<strong className="text-foreground">{targetDashboard.title}</strong>&quot; to restore interactive views and chats.
              </p>
            </div>
          </div>
          <button
            onClick={() => router.replace("/")}
            className="text-xs text-muted hover:text-foreground transition font-semibold underline shrink-0 focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none rounded"
          >
            Cancel Reactivation
          </button>
        </div>
      )}

      {/* REACTIVATION WARNING */}
      {reactivateWarning && (
        <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-xl flex items-start space-x-3 max-w-3xl mx-auto animate-fade-in text-amber-600">
          <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="text-xs font-bold text-foreground">Schema Mismatch Detected</p>
            <p className="text-xs text-muted leading-relaxed">{reactivateWarning}</p>
          </div>
        </div>
      )}

      {/* Main Corporate Hero Area (when no file is successfully parsed) */}
      {!parsedData && (
        <div className="space-y-24">

          {/* Hero Header & Upload Block with Dot-Grid Pattern */}
          <div className="relative rounded-2xl border border-border bg-surface-subtle overflow-hidden enterprise-dot-grid py-12 md:py-20 px-6 md:px-12 shadow-sm">
            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-surface/40 pointer-events-none" />

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center relative z-10">

              {/* Left Column: Copy & Actions */}
              <div className="lg:col-span-6 space-y-6 text-left">
                <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-accent/10 border border-accent/20 text-xs font-bold tracking-wide text-accent">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  <span>Secure & Local Business Intelligence</span>
                </span>

                <h1 className="font-sans text-3xl md:text-4xl lg:text-5xl font-extrabold text-foreground tracking-tight leading-[1.1]">
                  Business intelligence that runs in your browser
                </h1>

                <p className="text-sm md:text-base text-muted max-w-xl leading-relaxed">
                  Upload your data and get instant dashboards, AI-powered analysis, and predictive insights — with your data never leaving your device.
                </p>

                {/* Main Upload Dropzone */}
                <div id="upload-zone" className="pt-2">
                  <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={triggerFileBrowser}
                    className={`flex flex-col items-center justify-center p-8 text-center cursor-pointer border-2 rounded-xl transition-all duration-300 bg-surface ${
                      isDragging
                        ? "border-accent bg-accent/5 scale-[0.99] shadow-md"
                        : "border-dashed border-border hover:border-accent hover:shadow-sm"
                    }`}
                  >
                    <div className="h-12 w-12 bg-surface-subtle border border-border rounded-lg flex items-center justify-center text-accent shadow-sm mb-4">
                      <Upload className="h-5 w-5" />
                    </div>

                    <div className="space-y-1.5">
                      <p className="text-sm font-bold text-foreground">
                        Drag and drop your spreadsheet here
                      </p>
                      <p className="text-xs text-muted">
                        or <span className="text-accent hover:underline font-semibold">browse files</span> on your system
                      </p>
                    </div>

                    <p className="text-[10px] text-muted/80 mt-5 font-mono uppercase tracking-wider font-semibold">
                      Supports CSV, XLSX, or XLS (Max 5MB)
                    </p>

                    {isPending && (
                      <div className="mt-4 flex items-center space-x-2 text-xs text-accent">
                        <RefreshCw className="h-4 w-4 animate-spin" />
                        <span>Processing columns safely in memory...</span>
                      </div>
                    )}

                    {error && (
                      <div className="mt-4 flex items-start space-x-2 text-left p-3 bg-rose-500/10 border border-rose-500/20 rounded-lg text-xs text-rose-600 max-w-md">
                        <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                        <span>{error}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Right Column: Embedded Professional Screenshot Metaphor */}
              <div className="lg:col-span-6">
                <div className="bg-surface border border-border rounded-xl shadow-lg overflow-hidden flex flex-col h-[380px] text-left select-none">
                  {/* Chrome window layout */}
                  <div className="px-4 py-3 bg-surface-subtle border-b border-border flex items-center justify-between">
                    <div className="flex items-center space-x-1.5">
                      <span className="w-3 h-3 rounded-full bg-border" />
                      <span className="w-3 h-3 rounded-full bg-border" />
                      <span className="w-3 h-3 rounded-full bg-border" />
                    </div>
                    <span className="text-xs text-muted font-bold tracking-wide uppercase">InsightLoop Analyzer</span>
                    <div className="w-8" />
                  </div>

                  {/* Mock Screenshot Content */}
                  <div className="flex-1 p-5 flex flex-col justify-between bg-surface">
                    {/* Mock KPIs */}
                    <div className="grid grid-cols-3 gap-4">
                      <div className="border border-border p-3 rounded-lg bg-surface-subtle">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-muted">Gross Sales</span>
                        <span className="block text-lg font-extrabold text-foreground mt-1">$142,500.00</span>
                      </div>
                      <div className="border border-border p-3 rounded-lg bg-surface-subtle">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-muted">Active Users</span>
                        <span className="block text-lg font-extrabold text-foreground mt-1">1,240</span>
                      </div>
                      <div className="border border-border p-3 rounded-lg bg-surface-subtle">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-muted">YOY Growth</span>
                        <span className="block text-lg font-extrabold text-success mt-1">+18.4%</span>
                      </div>
                    </div>

                    {/* Chart Container */}
                    <div className="h-44 w-full text-[10px] mt-4 font-sans">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={SAMPLE_CHART_DATA} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                          <XAxis dataKey="month" stroke="var(--text-secondary)" tickLine={false} axisLine={false} dy={4} />
                          <YAxis stroke="var(--text-secondary)" tickLine={false} axisLine={false} width={35} tickFormatter={(v) => `$${v / 1000}k`} />
                          <defs>
                            <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="var(--accent)" stopOpacity={0.15} />
                              <stop offset="95%" stopColor="var(--accent)" stopOpacity={0.0} />
                            </linearGradient>
                          </defs>
                          <Area type="monotone" dataKey="sales" stroke="var(--accent)" strokeWidth={2} fillOpacity={1} fill="url(#colorSales)" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>

                    <div className="border-t border-border pt-3.5 flex items-center justify-between text-[11px] text-muted">
                      <span className="flex items-center space-x-1">
                        <CheckCircle className="h-3.5 w-3.5 text-success" />
                        <span>Interactive preview matching active schema</span>
                      </span>
                      <span className="font-mono text-[9px] uppercase font-bold text-muted/60">Static Demo</span>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileInputChange}
            accept=".csv,.xlsx,.xls"
            className="hidden"
          />

          {/* CREDIBILITY STRIP: Place immediately under hero block (first thing after fold) */}
          <section className="bg-surface border border-border rounded-xl p-6 md:p-8 shadow-sm">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 items-start divide-y sm:divide-y-0 lg:divide-x divide-border">
              {/* Item 1 */}
              <div className="flex items-start space-x-3.5 pb-4 sm:pb-0 sm:pr-4">
                <div className="p-2.5 rounded-lg bg-accent/5 border border-accent/15 text-accent">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-xs font-bold text-foreground">Local Execution</h4>
                  <p className="text-[11px] text-muted leading-relaxed">
                    Data never leaves your browser. All parsing and queries run locally on client memory.
                  </p>
                </div>
              </div>

              {/* Item 2 */}
              <div className="flex items-start space-x-3.5 pt-4 sm:pt-0 sm:pl-4 lg:pl-6 pb-4 sm:pb-0 sm:pr-4">
                <div className="p-2.5 rounded-lg bg-accent/5 border border-accent/15 text-accent">
                  <UserCheck className="h-5 w-5" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-xs font-bold text-foreground">No Account Required</h4>
                  <p className="text-[11px] text-muted leading-relaxed">
                    Zero signup steps. Instantly drag-and-drop spreadsheets and get immediate dashboards.
                  </p>
                </div>
              </div>

              {/* Item 3 */}
              <div className="flex items-start space-x-3.5 pt-4 sm:pt-0 sm:pl-4 lg:pl-6 pb-4 sm:pb-0 sm:pr-4">
                <div className="p-2.5 rounded-lg bg-accent/5 border border-accent/15 text-accent">
                  <Cpu className="h-5 w-5" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-xs font-bold text-foreground">Open-Source Engine</h4>
                  <p className="text-[11px] text-muted leading-relaxed">
                    Powered by standardized open technology: DuckDB-WASM, React, and Supabase security.
                  </p>
                </div>
              </div>

              {/* Item 4 */}
              <div className="flex items-start space-x-3.5 pt-4 sm:pt-0 sm:pl-4 lg:pl-6">
                <div className="p-2.5 rounded-lg bg-accent/5 border border-accent/15 text-accent">
                  <Zap className="h-5 w-5" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-xs font-bold text-foreground">Instant Results</h4>
                  <p className="text-[11px] text-muted leading-relaxed">
                    High-performance local execution delivers sub-second insights, chats, and exports.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* UNDERSTATED TECHNICAL DATA-FLOW DIAGRAM */}
          <section className="space-y-8 text-center pt-4">
            <div className="space-y-2">
              <span className="text-[10px] uppercase font-extrabold text-accent tracking-widest block">System Integration</span>
              <h2 className="font-sans text-2xl font-bold text-foreground tracking-tight">Transparent Architecture Flow</h2>
              <p className="text-xs text-muted max-w-sm mx-auto leading-relaxed">
                See how your spreadsheet parses locally and triggers contextual AI and visual analysis.
              </p>
            </div>

            <div className="relative border border-border bg-surface-subtle rounded-xl p-8 max-w-4xl mx-auto overflow-hidden shadow-sm">
              <div className="grid grid-cols-1 md:grid-cols-7 gap-6 items-center relative z-10">
                {/* Node 1 */}
                <div className="md:col-span-1 flex flex-col items-center text-center space-y-2">
                  <div className="h-11 w-11 bg-surface border border-border rounded-xl flex items-center justify-center text-accent shadow-sm">
                    <FileSpreadsheet className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="text-[11px] font-bold text-foreground leading-tight">1. Upload</h4>
                    <p className="text-[9px] text-muted mt-0.5">CSV / Excel</p>
                  </div>
                </div>

                {/* Arrow 1 */}
                <div className="md:col-span-1 flex justify-center text-muted">
                  <ArrowRight className="h-4 w-4 rotate-90 md:rotate-0" />
                </div>

                {/* Node 2 */}
                <div className="md:col-span-1 flex flex-col items-center text-center space-y-2">
                  <div className="h-11 w-11 bg-surface border border-border rounded-xl flex items-center justify-center text-accent shadow-sm">
                    <Cpu className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="text-[11px] font-bold text-foreground leading-tight">2. Local DB</h4>
                    <p className="text-[9px] text-muted mt-0.5">DuckDB-WASM</p>
                  </div>
                </div>

                {/* Arrow 2 */}
                <div className="md:col-span-1 flex justify-center text-muted">
                  <ArrowRight className="h-4 w-4 rotate-90 md:rotate-0" />
                </div>

                {/* Node 3 */}
                <div className="md:col-span-1 flex flex-col items-center text-center space-y-2">
                  <div className="h-11 w-11 bg-surface border border-border rounded-xl flex items-center justify-center text-accent shadow-sm">
                    <MessageSquare className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="text-[11px] font-bold text-foreground leading-tight">3. AI Insights</h4>
                    <p className="text-[9px] text-muted mt-0.5">Gemini Co-Pilot</p>
                  </div>
                </div>

                {/* Arrow 3 */}
                <div className="md:col-span-1 flex justify-center text-muted">
                  <ArrowRight className="h-4 w-4 rotate-90 md:rotate-0" />
                </div>

                {/* Node 4 */}
                <div className="md:col-span-1 flex flex-col items-center text-center space-y-2">
                  <div className="h-11 w-11 bg-surface border border-border rounded-xl flex items-center justify-center text-accent shadow-sm">
                    <FileDown className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="text-[11px] font-bold text-foreground leading-tight">4. Export</h4>
                    <p className="text-[9px] text-muted mt-0.5">High-Fidelity PDF</p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* "BENTO GRID FEATURES" — Restrained, Confident, Data-forward */}
          <section className="scroll-mt-24 space-y-12">
            <div className="text-center space-y-2">
              <span className="text-[10px] uppercase font-extrabold text-accent tracking-widest block">Capabilities Overview</span>
              <h2 className="font-sans text-2xl sm:text-3xl font-bold text-foreground tracking-tight">
                Designed for Business Decision-Making
              </h2>
              <p className="text-xs sm:text-sm text-muted max-w-sm mx-auto leading-relaxed">
                Unlock advanced browser-native analytics, SQL debug options, and real-time AI consulting.
              </p>
            </div>

            {/* Asymmetric Bento Grid wrapped in ScrollRevealCard */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

              {/* Card 1: AI Chat Analyst (Featured - Size 7 columns) */}
              <div className="lg:col-span-7">
                <ScrollRevealCard index={0} reducedMotion={reducedMotion}>
                  <div className="bg-surface border border-border p-8 rounded-xl h-full flex flex-col justify-between hover:border-accent hover:shadow-md transition-all duration-200">
                    <div className="space-y-4">
                      <div className="h-10 w-10 bg-surface-subtle border border-border rounded-lg flex items-center justify-center text-accent shadow-sm">
                        <MessageSquare className="h-5 w-5" />
                      </div>
                      <div className="space-y-1.5">
                        <h3 className="text-sm font-bold text-foreground">Interactive AI Chat Analyst</h3>
                        <p className="text-xs text-muted leading-relaxed font-normal">
                          Converse directly with a smart AI data assistant. Ask questions in plain English, and the model translates your queries into raw SQL executed directly inside your local DuckDB engine. Fits right into Tableau-like experiences.
                        </p>
                      </div>
                    </div>

                    <div className="border-t border-border mt-6 pt-4 flex items-center text-[10px] text-muted font-semibold">
                      <span>Includes query recovery, schema mapping, & chart visualization</span>
                    </div>
                  </div>
                </ScrollRevealCard>
              </div>

              {/* Card 2: CSV Upload & Instant Dashboard (Size 5 columns) */}
              <div className="lg:col-span-5">
                <ScrollRevealCard index={1} reducedMotion={reducedMotion}>
                  <div className="bg-surface border border-border p-8 rounded-xl h-full flex flex-col justify-between hover:border-accent hover:shadow-md transition-all duration-200">
                    <div className="space-y-4">
                      <div className="h-10 w-10 bg-surface-subtle border border-border rounded-lg flex items-center justify-center text-accent shadow-sm">
                        <LayoutDashboard className="h-5 w-5" />
                      </div>
                      <div className="space-y-1.5">
                        <h3 className="text-sm font-bold text-foreground">Instant Interactive Dashboard</h3>
                        <p className="text-xs text-muted leading-relaxed font-normal">
                          Drop spreadsheets to generate high-fidelity, customized metrics and graphs. Fully responsive, adapts perfectly to light and dark theme configurations, and includes editable schema columns.
                        </p>
                      </div>
                    </div>

                    <div className="border-t border-border mt-6 pt-4 flex items-center text-[10px] text-muted font-semibold">
                      <span>Fully compatible with Excel sheets and standard CSVs</span>
                    </div>
                  </div>
                </ScrollRevealCard>
              </div>

              {/* Card 3: Predictive Analytics & Outliers (Size 5 columns) */}
              <div className="lg:col-span-5">
                <ScrollRevealCard index={2} reducedMotion={reducedMotion}>
                  <div className="bg-surface border border-border p-8 rounded-xl h-full flex flex-col justify-between hover:border-accent hover:shadow-md transition-all duration-200">
                    <div className="space-y-4">
                      <div className="h-10 w-10 bg-surface-subtle border border-border rounded-lg flex items-center justify-center text-accent shadow-sm">
                        <TrendingUp className="h-5 w-5" />
                      </div>
                      <div className="space-y-1.5">
                        <h3 className="text-sm font-bold text-foreground">Predictive Statistical Analysis</h3>
                        <p className="text-xs text-muted leading-relaxed font-normal">
                          Leverage the serverless Python layer for automated data projections, linear trends, and out-of-bounds anomaly detection. Perfect for operations planning and forecasting.
                        </p>
                      </div>
                    </div>

                    <div className="border-t border-border mt-6 pt-4 flex items-center text-[10px] text-muted font-semibold">
                      <span>Runs IQR outlier checks and standard linear regression</span>
                    </div>
                  </div>
                </ScrollRevealCard>
              </div>

              {/* Card 4: Collaborative Workspace and PDF Sync (Size 7 columns) */}
              <div className="lg:col-span-7">
                <ScrollRevealCard index={3} reducedMotion={reducedMotion}>
                  <div className="bg-surface border border-border p-8 rounded-xl h-full flex flex-col justify-between hover:border-accent hover:shadow-md transition-all duration-200">
                    <div className="space-y-4">
                      <div className="h-10 w-10 bg-surface-subtle border border-border rounded-lg flex items-center justify-center text-accent shadow-sm">
                        <FileDown className="h-5 w-5" />
                      </div>
                      <div className="space-y-1.5">
                        <h3 className="text-sm font-bold text-foreground">Enterprise Export & Persistent Sync</h3>
                        <p className="text-xs text-muted leading-relaxed font-normal">
                          Persist configured layouts to Supabase using a local session key. Compile complete dashboards into clean, multi-page vector-based PDFs instantly for offline reports or corporate slide decks.
                        </p>
                      </div>
                    </div>

                    <div className="border-t border-border mt-6 pt-4 flex items-center text-[10px] text-muted font-semibold">
                      <span>Safeguarded against wrong-theme flashes or render failures</span>
                    </div>
                  </div>
                </ScrollRevealCard>
              </div>

            </div>
          </section>

          {/* Technical Trust Stack Section */}
          <section className="flex flex-col items-center justify-center space-y-4 pt-10 border-t border-border/80">
            <span className="text-[10px] uppercase font-extrabold text-muted tracking-widest flex items-center gap-1.5">
              <Cpu className="h-3.5 w-3.5 text-accent" />
              <span>Technical Engine Stack</span>
            </span>
            <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs font-semibold text-muted">
              <span className="flex items-center gap-1.5 hover:text-foreground transition duration-200">
                <span className="w-1.5 h-1.5 rounded-full bg-accent" />
                <span>Gemini API (2.5 Flash)</span>
              </span>
              <span className="text-border hidden sm:inline">|</span>
              <span className="flex items-center gap-1.5 hover:text-foreground transition duration-200">
                <span className="w-1.5 h-1.5 rounded-full bg-accent" />
                <span>DuckDB-WASM Engine</span>
              </span>
              <span className="text-border hidden sm:inline">|</span>
              <span className="flex items-center gap-1.5 hover:text-foreground transition duration-200">
                <span className="w-1.5 h-1.5 rounded-full bg-accent" />
                <span>Supabase Cloud Database</span>
              </span>
            </div>
          </section>
        </div>
      )}

      {/* Active Workspace Header Bar */}
      {parsedData && (
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-6 pt-4">
          <div>
            <h1 className="text-2xl font-sans font-bold tracking-tight text-foreground">
              Interactive Workspace
            </h1>
            <p className="text-muted text-xs mt-1">
              Configure column overrides, query database directly, and consult your custom visual workspace.
            </p>
          </div>
          <button
            onClick={handleClear}
            className="flex items-center space-x-1.5 px-4 py-2 bg-surface hover:bg-surface-subtle text-rose-600 border border-border rounded-lg text-xs transition-all font-semibold focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
          >
            <Trash2 className="h-3.5 w-3.5" />
            <span>Clear / Upload New</span>
          </button>
        </div>
      )}

      {/* Parsed Output / Preview Panel */}
      {parsedData && (
        <div className="space-y-6 animate-fade-in relative z-10">
          {/* File summary bar */}
          <div className="bg-surface border border-border p-4 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
            <div className="flex items-center space-x-3">
              <div className="h-10 w-10 rounded-lg bg-surface border border-border flex items-center justify-center flex-shrink-0">
                <FileSpreadsheet className="h-5 w-5 text-success" />
              </div>
              <div>
                <h3 className="font-sans font-bold text-foreground text-sm leading-tight truncate max-w-md">
                  {parsedData.fileName}
                </h3>
                <p className="text-[10px] text-muted mt-1 font-medium">
                  Size: {formatBytes(parsedData.fileSize)}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-6 self-stretch sm:self-auto justify-between border-t sm:border-t-0 border-border pt-3 sm:pt-0">
              <div className="text-center sm:text-right">
                <span className="block text-[9px] text-muted font-bold uppercase tracking-wider">Total Rows</span>
                <span className="text-sm font-bold text-foreground">
                  {parsedData.rawRows.length.toLocaleString()}
                </span>
              </div>
              <div className="h-6 w-[1px] bg-border hidden sm:block"></div>
              <div className="text-center sm:text-right">
                <span className="block text-[9px] text-muted font-bold uppercase tracking-wider">Total Columns</span>
                <span className="text-sm font-bold text-foreground">
                  {parsedData.columns.length}
                </span>
              </div>
            </div>
          </div>

          {/* Table Container */}
          <div className="bg-surface border border-border rounded-xl overflow-hidden flex flex-col shadow-sm">
            <button
              onClick={() => setIsPreviewCollapsed(!isPreviewCollapsed)}
              className="px-5 py-3.5 border-b border-border flex items-center justify-between hover:bg-surface-subtle transition-all text-left w-full outline-none focus-visible:bg-surface-subtle"
            >
              <div className="flex items-center space-x-2">
                <TableProperties className="h-4 w-4 text-accent" />
                <span className="font-sans text-xs font-bold text-foreground uppercase tracking-wider">Data Preview (First 20 Rows)</span>
                {isPreviewCollapsed && (
                  <span className="text-[9px] bg-background border border-border text-muted font-bold px-1.5 py-0.5 rounded ml-2">
                    Collapsed
                  </span>
                )}
              </div>
              <div className="flex items-center space-x-3 text-xs text-muted">
                <span className="hidden sm:inline">Type overrides are applied immediately</span>
                {isPreviewCollapsed ? <ChevronDown className="h-4 w-4 text-foreground" /> : <ChevronUp className="h-4 w-4 text-foreground" />}
              </div>
            </button>

            {!isPreviewCollapsed && (
              <>
                <div className="overflow-x-auto w-full select-none">
                  <table className="w-full text-left border-collapse table-auto">
                    <thead>
                      <tr className="border-b border-border bg-background/50">
                        {parsedData.schema.map((col: ColumnSchema) => (
                          <th
                            key={col.columnName}
                            className="px-5 py-3 font-semibold text-xs align-top border-r border-border last:border-r-0 min-w-[200px]"
                          >
                            <div className="flex flex-col space-y-2.5">
                              <div className="flex items-center justify-between">
                                <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded bg-background border border-border text-[9px] font-bold uppercase text-muted">
                                  {getTypeIcon(col.currentType)}
                                  <span>{col.currentType}</span>
                                </span>

                                <select
                                  value={col.currentType}
                                  onChange={(e) => handleTypeOverride(col.columnName, e.target.value as ColumnType)}
                                  className="text-[9px] bg-background border border-border hover:border-text-secondary text-muted hover:text-foreground rounded px-1.5 py-0.5 font-semibold outline-none cursor-pointer focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
                                >
                                  <option value="text">📝 text</option>
                                  <option value="number">🔢 number</option>
                                  <option value="currency">💰 currency</option>
                                  <option value="date">📅 date</option>
                                  <option value="category">🏷️ category</option>
                                </select>
                              </div>

                              <span className="text-xs font-bold text-foreground tracking-wide block truncate" title={col.displayName}>
                                {col.displayName}
                              </span>

                              <div className="flex flex-col space-y-1 text-[9px] text-muted border-t border-border/60 pt-2 font-normal">
                                <div className="flex justify-between">
                                  <span>Detected:</span>
                                  <span className="text-foreground">{getTypeLabel(col.detectedType)}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span>Uniqueness:</span>
                                  <span className="text-foreground font-semibold">
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
                    <tbody className="divide-y divide-border">
                      {parsedData.rawRows.slice(0, 20).map((row, rowIdx) => (
                        <tr
                          key={rowIdx}
                          className="hover:bg-surface-subtle transition-colors"
                        >
                          {parsedData.schema.map((col: ColumnSchema) => {
                            const rawVal = row[col.columnName];
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
                                className="px-5 py-3 text-xs border-r border-border last:border-r-0 max-w-[280px] truncate"
                              >
                                {displayCell !== "" ? (
                                  <span className="text-foreground font-semibold">{displayCell}</span>
                                ) : (
                                  <span className="text-muted/40 italic">null</span>
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="px-5 py-3 border-t border-border bg-background/30 flex justify-between items-center text-[10px] text-muted font-bold">
                  <span>Showing {Math.min(20, parsedData.rawRows.length)} of {parsedData.rawRows.length.toLocaleString()} rows</span>
                  {parsedData.rawRows.length > 20 && (
                    <span>Remaining {parsedData.rawRows.length - 20} rows omitted from preview.</span>
                  )}
                </div>
              </>
            )}
          </div>

          {/* 📊 Automatic Analytics Dashboard */}
          <div className="space-y-3 pt-6 border-t border-border">
            <div className="flex items-center space-x-2.5">
              <div className="p-1.5 rounded-lg border border-border text-accent bg-surface">
                <LayoutDashboard className="h-4.5 w-4.5" />
              </div>
              <div>
                <h2 className="font-sans text-xs font-bold text-foreground uppercase tracking-wider">Interactive Analytics Dashboard</h2>
                <p className="text-[10px] text-muted mt-0.5 font-normal">Automatically generated insights and trends based on your file&apos;s schema.</p>
              </div>
            </div>

            <Dashboard
              parsedData={parsedData}
              datasetLoaded={datasetLoaded}
              runQuery={runQuery}
              onDashboardLoaded={handleDashboardLoaded}
              dashboardId={dashboardId}
              setDashboardId={setDashboardId}
            />
          </div>

          {/* 🧠 Python Advanced Insights Section */}
          <div className="pt-6 border-t border-border space-y-3">
            <AdvancedInsights
              parsedData={parsedData}
              datasetLoaded={datasetLoaded}
              runQuery={runQuery}
            />
          </div>

          {/* 💬 AI Text-to-SQL Co-Pilot Section */}
          <div className="pt-6 border-t border-border space-y-3">
            <ChatPanel
              datasetLoaded={datasetLoaded}
              schema={parsedData.schema}
              runQuery={runQuery}
              dashboardId={dashboardId}
            />
          </div>

          {/* 🛠️ Debug SQL Console */}
          <div className="bg-surface border border-border rounded-xl overflow-hidden flex flex-col shadow-sm">
            <button
              onClick={() => setIsConsoleCollapsed(!isConsoleCollapsed)}
              className="px-5 py-4 flex items-center justify-between hover:bg-surface-subtle transition-all text-left w-full outline-none focus-visible:bg-surface-subtle"
            >
              <div className="flex items-center space-x-2.5">
                <div className="p-1.5 rounded-lg border border-border text-accent bg-surface">
                  <Cpu className="h-4.5 w-4.5" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h2 className="font-sans text-xs font-bold text-foreground uppercase tracking-wider">Debug SQL Console</h2>
                    {isConsoleCollapsed && (
                      <span className="text-[9px] bg-background border border-border text-muted font-bold px-1.5 py-0.5 rounded">
                        Collapsed
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-muted mt-0.5 font-normal">Run real-time analytical SQL queries directly on your dataset.</p>
                </div>
              </div>
              <div className="text-foreground">
                {isConsoleCollapsed ? <ChevronDown className="h-4.5 w-4.5" /> : <ChevronUp className="h-4.5 w-4.5" />}
              </div>
            </button>

            {!isConsoleCollapsed && (
              <div className="p-5 pt-0 border-t border-border space-y-4">
                {/* Status Banner */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-3 pt-3">
                  <div className="text-[10px] text-muted">
                    Interact directly with DuckDB using raw SQL.
                  </div>
                  <div className="flex items-center space-x-1.5 bg-background border border-border px-2.5 py-1 rounded-lg text-[10px] font-semibold self-start sm:self-auto">
                    {dbLoading ? (
                      <>
                        <RefreshCw className="h-3 w-3 text-accent animate-spin" />
                        <span className="text-accent">Initializing DuckDB WASM...</span>
                      </>
                    ) : dbError ? (
                      <>
                        <AlertCircle className="h-3 w-3 text-rose-500" />
                        <span className="text-rose-500">DuckDB Error: {dbError}</span>
                      </>
                    ) : syncStatus.loading ? (
                      <>
                        <RefreshCw className="h-3 w-3 text-warning animate-spin" />
                        <span className="text-warning">Syncing database schema...</span>
                      </>
                    ) : syncStatus.error ? (
                      <>
                        <AlertCircle className="h-3 w-3 text-rose-500" />
                        <span className="text-rose-500">Sync failed: {syncStatus.error}</span>
                      </>
                    ) : datasetLoaded ? (
                      <>
                        <CheckCircle className="h-3 w-3 text-success" />
                        <span className="text-success">DB synced: &apos;dataset&apos; active</span>
                      </>
                    ) : (
                      <>
                        <Server className="h-3 w-3 text-muted" />
                        <span className="text-muted">DuckDB idle</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Quick Sample Queries */}
                <div className="space-y-1.5">
                  <span className="text-[9px] font-bold uppercase tracking-wider text-muted block">Quick Test Queries</span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    {samples.map((sample, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          setSqlQuery(sample.query);
                          handleRunQuery(sample.query);
                        }}
                        className="flex flex-col items-start p-3 bg-background hover:bg-surface-subtle border border-border rounded-lg text-left transition-colors focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
                      >
                        <span className="text-[10px] font-bold text-accent flex items-center space-x-1">
                          <span>{sample.label}</span>
                          <ChevronRight className="h-3 w-3" />
                        </span>
                        <span className="text-[9px] text-muted mt-1 leading-snug font-normal">{sample.description}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Input Console */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label htmlFor="query-console" className="text-[9px] font-bold uppercase tracking-wider text-muted">
                      SQL Query Input
                    </label>
                    <span className="text-[9px] text-muted">Table name: <code className="bg-background px-1.5 py-0.5 rounded border border-border text-foreground">dataset</code></span>
                  </div>
                  <div className="relative">
                    <textarea
                      id="query-console"
                      value={sqlQuery}
                      onChange={(e) => setSqlQuery(e.target.value)}
                      className="w-full h-28 bg-background border border-border focus:border-accent rounded-lg p-3 font-mono text-xs text-foreground placeholder-muted/30 outline-none transition-colors"
                      placeholder="SELECT * FROM dataset LIMIT 10..."
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => handleRunQuery()}
                    disabled={queryRunning || dbLoading || syncStatus.loading}
                    className="flex items-center justify-center space-x-1.5 px-4 py-2 bg-accent hover:opacity-90 disabled:opacity-40 text-white font-semibold rounded-lg text-xs transition-colors disabled:cursor-not-allowed focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
                  >
                    {queryRunning ? (
                      <>
                        <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                        <span>Executing Query...</span>
                      </>
                    ) : (
                      <>
                        <Play className="h-3.5 w-3.5 fill-white text-white" />
                        <span>Run Query</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Query Error Area */}
                {queryError && (
                  <div className="flex items-start space-x-2.5 p-3.5 bg-rose-500/10 border border-rose-500/20 rounded-lg animate-fade-in">
                    <AlertCircle className="h-4 w-4 text-rose-500 mt-0.5 flex-shrink-0" />
                    <div className="space-y-1">
                      <p className="text-xs font-bold text-rose-600">Query Failed</p>
                      <p className="text-[10px] text-muted leading-relaxed font-mono">{queryError}</p>
                    </div>
                  </div>
                )}

                {/* Query Results Area */}
                {queryResults !== null && (
                  <div className="space-y-3 animate-fade-in">
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] font-bold uppercase tracking-wider text-muted">Query Output</span>
                      <span className="text-[10px] text-success font-semibold bg-success/10 px-2 py-0.5 border border-success/20 rounded-lg">
                        Returned {queryResults.length.toLocaleString()} row{queryResults.length === 1 ? "" : "s"}
                      </span>
                    </div>

                    {queryResults.length === 0 ? (
                      <div className="text-center py-10 bg-background border border-border rounded-lg">
                        <CodeXml className="h-6 w-6 text-muted/30 mx-auto mb-1.5" />
                        <p className="text-xs text-muted font-medium">No rows matching your query were found.</p>
                      </div>
                    ) : (
                      <div className="bg-background border border-border rounded-lg overflow-hidden flex flex-col max-h-72">
                        <div className="overflow-x-auto w-full">
                          <table className="w-full text-left border-collapse table-auto">
                            <thead>
                              <tr className="border-b border-border bg-surface/50">
                                {Object.keys(queryResults[0]).map((colName) => (
                                  <th
                                    key={colName}
                                    className="px-4 py-2.5 font-bold text-[10px] text-muted uppercase tracking-wider border-r border-border last:border-r-0"
                                  >
                                    {colName}
                                  </th>
                                ))}
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                              {queryResults.slice(0, 100).map((row, rowIdx) => (
                                <tr
                                  key={rowIdx}
                                  className="hover:bg-surface-subtle transition-colors"
                                >
                                  {Object.keys(queryResults[0]).map((colName) => {
                                    const val = row[colName];
                                    return (
                                      <td
                                        key={colName}
                                        className="px-4 py-2 text-xs border-r border-border last:border-r-0 text-foreground font-normal"
                                      >
                                        {val === null || val === undefined ? (
                                          <span className="text-muted/30 italic">null</span>
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
                          <div className="px-4 py-2 bg-surface text-[10px] text-muted border-t border-border">
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

// Suspense Boundary Wrapper to prevent static de-optimization build errors
export default function Home() {
  return (
    <Suspense
      fallback={
        <div className="flex-1 flex flex-col items-center justify-center space-y-3 py-20 animate-pulse">
          <RefreshCw className="h-6 w-6 text-accent animate-spin" />
          <span className="text-xs text-muted font-semibold">Initializing workspace co-pilot...</span>
        </div>
      }
    >
      <HomeContent />
    </Suspense>
  );
}
