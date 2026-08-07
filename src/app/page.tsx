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
  Terminal,
  Play,
  CheckCircle,
  Server,
  CodeXml,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  LayoutDashboard,
  XCircle,
  Cpu,
  ArrowRight,
  Zap,
  Bot,
  Database,
  Lock
} from "lucide-react";
import { motion, useInView } from "framer-motion";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
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
import {
  AuroraBackground,
  FloatingAIIcons,
  MagneticButton
} from "@/components/PremiumEffects";

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB

// Tech Stack Badge Component
function TechBadge({
  icon: Icon,
  name,
  desc
}: {
  icon: React.ComponentType<{ className?: string }>;
  name: string;
  desc: string;
}) {
  return (
    <div className="flex flex-col p-4 bg-surface border border-border/60 rounded-xl hover:border-text-secondary transition duration-300 shadow-xs relative overflow-hidden group">
      <div className="absolute top-0 left-0 w-1 h-full bg-accent/30 scale-y-0 group-hover:scale-y-100 transition-transform origin-top duration-300" />
      <div className="flex items-center space-x-3 mb-2">
        <div className="p-1.5 rounded-lg border border-border bg-background text-accent">
          <Icon className="h-4 w-4" />
        </div>
        <span className="text-xs font-bold text-foreground">{name}</span>
      </div>
      <p className="text-[11px] text-muted leading-relaxed font-normal">{desc}</p>
    </div>
  );
}

// Animated Counter Component
function AnimatedCounter({ value, label, trigger }: { value: number; label: string; trigger: boolean }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!trigger) return;
    let start = 0;
    const end = value;
    if (start === end) return;

    const totalDuration = 1500;
    const incrementTime = Math.max(Math.floor(totalDuration / end), 25);

    const timer = setInterval(() => {
      start += Math.ceil(end / 40);
      if (start >= end) {
        clearInterval(timer);
        setCount(end);
      } else {
        setCount(start);
      }
    }, incrementTime);

    return () => clearInterval(timer);
  }, [value, trigger]);

  return (
    <div className="text-center space-y-1">
      <span className="text-3xl sm:text-4xl font-extrabold text-foreground tracking-tight block">
        {count.toLocaleString()}+
      </span>
      <span className="text-[10px] uppercase font-extrabold tracking-widest text-muted block">
        {label}
      </span>
    </div>
  );
}

// Sample Data for Real AreaChart View inside Hero
const HERO_CHART_DATA = [
  { quarter: "Q1", revenue: 12500 },
  { quarter: "Q2", revenue: 18400 },
  { quarter: "Q3", revenue: 26100 },
  { quarter: "Q4", revenue: 42300 },
];

// Live AI Showcase scripted typing simulation hook
function useTypingAnimation(text: string, trigger: boolean) {
  const [displayedText, setDisplayedText] = useState("");

  useEffect(() => {
    if (!trigger) {
      setDisplayedText("");
      return;
    }

    let i = 0;
    const timer = setInterval(() => {
      setDisplayedText((prev) => prev + text.charAt(i));
      i++;
      if (i >= text.length) {
        clearInterval(timer);
      }
    }, 50);

    return () => clearInterval(timer);
  }, [text, trigger]);

  return displayedText;
}

// 4-step "How It Works" Connecting Line Animation Hook
function useScrollProgress(ref: React.RefObject<HTMLDivElement>) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      if (!ref.current) return;
      const rect = ref.current.getBoundingClientRect();
      const windowHeight = window.innerHeight;

      const totalHeight = rect.height;
      const visibleStart = windowHeight / 2;
      const progressCalculated = Math.min(
        Math.max((visibleStart - rect.top) / totalHeight, 0),
        1
      );
      setProgress(progressCalculated);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [ref]);

  return progress;
}

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

  // Shared Dashboard ID state
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

  const handleScrollToSection = (targetId: string) => {
    const el = document.getElementById(targetId);
    if (el) {
      el.scrollIntoView({ behavior: reducedMotion ? "auto" : "smooth" });
    }
  };

  // 4-step elements trigger refs
  const stepsContainerRef = useRef<HTMLDivElement>(null);
  const scrollProgress = useScrollProgress(stepsContainerRef);

  // Live AI Showcase trigger refs
  const liveShowcaseRef = useRef<HTMLDivElement>(null);
  const isLiveShowcaseInView = useInView(liveShowcaseRef, { once: true, margin: "-100px" });

  const typedQuestion = useTypingAnimation(
    "Which region had the highest revenue growth this quarter?",
    isLiveShowcaseInView
  );

  const [showShowcaseLoader, setShowShowcaseLoader] = useState(false);
  const [showShowcaseChart, setShowShowcaseChart] = useState(false);
  const [showShowcaseExpl, setShowShowcaseExpl] = useState(false);

  useEffect(() => {
    if (!isLiveShowcaseInView) return;

    // Once typing is complete, show translation loader
    const loaderTimer = setTimeout(() => {
      setShowShowcaseLoader(true);
    }, typedQuestion.length * 50 + 400);

    // Render chart and explanation after loading completes
    const renderTimer = setTimeout(() => {
      setShowShowcaseLoader(false);
      setShowShowcaseChart(true);
    }, typedQuestion.length * 50 + 1800);

    const explanationTimer = setTimeout(() => {
      setShowShowcaseExpl(true);
    }, typedQuestion.length * 50 + 2600);

    return () => {
      clearTimeout(loaderTimer);
      clearTimeout(renderTimer);
      clearTimeout(explanationTimer);
    };
  }, [isLiveShowcaseInView, typedQuestion.length]);

  // Animated Statistics stats triggers
  const statsRef = useRef<HTMLDivElement>(null);
  const isStatsInView = useInView(statsRef, { once: true, margin: "-100px" });

  const SHOWCASE_REGIONS_DATA = [
    { region: "North Region", growth: 12 },
    { region: "East Region", growth: 7 },
    { region: "West Region", growth: 18 },
    { region: "South Region", growth: 5 },
  ];

  return (
    <div className="flex-1 w-full max-w-7xl mx-auto px-6 py-6 space-y-12 relative z-10">
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
      `}} />

      {/* REACTIVATION INFO BOX */}
      {reactivateId && targetDashboard && !parsedData && (
        <div className="bg-surface/80 backdrop-blur border border-border p-5 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 max-w-3xl mx-auto animate-fade-in shadow-md">
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
        <div className="bg-warning/10 border border-warning/30 p-4 rounded-xl flex items-start space-x-3 max-w-3xl mx-auto animate-fade-in text-warning">
          <XCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="text-xs font-bold text-foreground">Schema Mismatch Detected</p>
            <p className="text-xs text-muted leading-relaxed">{reactivateWarning}</p>
          </div>
        </div>
      )}

      {/* SaaS Premium Homepage (when no file is successfully parsed) */}
      {!parsedData && (
        <div className="space-y-24 py-4 relative">

          {/* 1. HERO SECTION */}
          <section className="relative pt-8 pb-12 overflow-hidden flex flex-col items-center">
            {/* Background elements */}
            <div className="absolute inset-0 z-0">
              <AuroraBackground />
              <FloatingAIIcons />
            </div>

            <div className="max-w-4xl text-center space-y-6 relative z-10 mb-16 px-4">
              <motion.div
                initial={reducedMotion ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                className="inline-flex items-center space-x-2 bg-accent/10 border border-accent/20 px-3.5 py-1.5 rounded-full text-[10px] font-bold text-accent uppercase tracking-widest"
              >
                <Zap className="h-3 w-3 fill-accent text-accent" />
                <span>Next-Gen Browser Business Intelligence</span>
              </motion.div>

              <motion.h1
                initial={reducedMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
                className="text-4xl sm:text-5xl md:text-6xl font-sans font-extrabold tracking-tight text-foreground leading-[1.1]"
              >
                Unlock instant insights <br className="hidden sm:inline" />
                directly from your browser.
              </motion.h1>

              <motion.p
                initial={reducedMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="text-sm sm:text-base md:text-lg text-muted max-w-2xl mx-auto leading-relaxed"
              >
                Upload any CSV or Excel file to automatically build interactive visual dashboards, execute low-latency in-memory SQL, and run conversational statistical forecasts without your data ever leaving your machine.
              </motion.p>

              <motion.div
                initial={reducedMotion ? { opacity: 1 } : { opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="flex flex-wrap items-center justify-center gap-4 pt-2"
              >
                <MagneticButton
                  onClick={() => handleScrollToSection("upload-zone")}
                  className="flex items-center space-x-1.5 px-6 py-3 bg-accent text-white font-semibold rounded-xl text-sm transition-all shadow-lg shadow-accent/15 focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
                >
                  <span>Upload your data</span>
                  <ArrowRight className="h-4 w-4" />
                </MagneticButton>

                <button
                  onClick={() => handleScrollToSection("how-it-works")}
                  className="flex items-center space-x-1.5 px-5 py-3 bg-surface hover:bg-surface-subtle border border-border text-foreground font-semibold rounded-xl text-sm transition-all focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
                >
                  <span>See how it works</span>
                </button>
              </motion.div>
            </div>

            {/* Dashboard Mock Preview Frame with Floating KPI cards */}
            <div className="relative w-full max-w-4xl px-4 z-10 flex justify-center">
              {/* Card 1: Revenue */}
              <div
                className={`absolute left-[-20px] top-[15%] z-20 bg-surface/95 border border-border p-4 rounded-xl flex flex-col justify-between shadow-lg backdrop-blur-md max-w-[140px] select-none ${
                  reducedMotion ? "" : "animate-[float_6s_ease-in-out_infinite]"
                }`}
              >
                <span className="text-[10px] font-mono text-muted uppercase font-bold tracking-wider">Revenue</span>
                <span className="text-base font-extrabold text-foreground mt-1 truncate">+12.4% MoM</span>
              </div>

              {/* Card 2: Rows analyzed */}
              <div
                className={`absolute right-[-10px] top-[40%] z-20 bg-surface/95 border border-border p-4 rounded-xl flex flex-col justify-between shadow-lg backdrop-blur-md max-w-[140px] select-none ${
                  reducedMotion ? "" : "animate-[float_6.5s_ease-in-out_infinite_1.5s]"
                }`}
              >
                <span className="text-[10px] font-mono text-muted uppercase font-bold tracking-wider">Processed</span>
                <span className="text-base font-extrabold text-foreground mt-1 truncate">1,204 rows</span>
              </div>

              {/* Card 3: AI Insights */}
              <div
                className={`absolute left-[-10px] bottom-[10%] z-20 bg-surface/95 border border-border p-4 rounded-xl flex flex-col justify-between shadow-lg backdrop-blur-md max-w-[150px] select-none ${
                  reducedMotion ? "" : "animate-[float_7s_ease-in-out_infinite_3s]"
                }`}
              >
                <span className="text-[10px] font-mono text-muted uppercase font-bold tracking-wider">Co-Pilot Core</span>
                <span className="text-base font-extrabold text-foreground mt-1 truncate">3 AI insights</span>
              </div>

              {/* Preview Container Wrapper */}
              <div className="w-full bg-surface border border-border rounded-2xl overflow-hidden shadow-xl flex flex-col h-[340px]">
                {/* Titlebar Chrome */}
                <div className="px-4 py-2.5 bg-surface-subtle border-b border-border flex items-center justify-between font-mono select-none">
                  <div className="flex items-center space-x-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
                    <span className="w-2.5 h-2.5 rounded-full bg-green-500/80" />
                  </div>
                  <span className="text-[10px] text-muted uppercase font-bold tracking-widest">dashboard.preview</span>
                  <div className="w-12" />
                </div>

                <div className="flex-1 p-6 flex flex-col justify-between select-none">
                  <div>
                    <span className="text-[10px] font-mono uppercase font-bold text-muted block tracking-wider">YTD Revenue Trend</span>
                    <span className="text-lg font-bold text-foreground mt-1 block">$42,300.00 YTD</span>
                  </div>

                  <div className="h-44 w-full text-[10px] font-mono mt-4">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={HERO_CHART_DATA} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                        <XAxis
                          dataKey="quarter"
                          stroke="var(--text-secondary)"
                          tickLine={false}
                          axisLine={false}
                          dy={8}
                        />
                        <YAxis
                          stroke="var(--text-secondary)"
                          tickLine={false}
                          axisLine={false}
                          width={40}
                          tickFormatter={(v) => `$${v / 1000}k`}
                        />
                        <Tooltip
                          contentStyle={{ backgroundColor: "var(--surface)", borderColor: "var(--border)", borderRadius: "6px" }}
                          itemStyle={{ color: "var(--text-primary)" }}
                          labelStyle={{ color: "var(--text-secondary)", fontWeight: "500" }}
                          formatter={(v) => [`$${Number(v).toLocaleString()}`, "Revenue"]}
                        />
                        <defs>
                          <linearGradient id="heroColorRevenue" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="var(--accent)" stopOpacity={0.2} />
                            <stop offset="95%" stopColor="var(--accent)" stopOpacity={0.0} />
                          </linearGradient>
                        </defs>
                        <Area
                          type="monotone"
                          dataKey="revenue"
                          stroke="var(--accent)"
                          strokeWidth={2}
                          fillOpacity={1}
                          fill="url(#heroColorRevenue)"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* 2. STANDALONE UPLOAD ZONE */}
          <section id="upload-zone" className="scroll-mt-24 max-w-4xl mx-auto px-4">
            <div className="text-center space-y-2 mb-8">
              <span className="text-[10px] uppercase font-extrabold text-accent tracking-widest block">Core Input</span>
              <h2 className="font-sans text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
                Secure Data Upload Portal
              </h2>
              <p className="text-xs sm:text-sm text-muted max-w-md mx-auto leading-relaxed">
                Parse datasets in real-time. Zero network uploads. Zero cookies or privacy compromises.
              </p>
            </div>

            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={triggerFileBrowser}
              className={`w-full min-h-[220px] bg-surface hover:bg-surface-subtle/50 border border-border border-dashed hover:border-text-secondary/60 rounded-2xl flex flex-col items-center justify-center p-8 text-center cursor-pointer transition-all duration-300 relative overflow-hidden group ${
                isDragging ? "bg-accent/10 border-solid border-accent scale-[0.98]" : "shadow-xs"
              }`}
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-accent/40 scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-300" />

              <div className="h-12 w-12 bg-background border border-border rounded-xl flex items-center justify-center text-accent shadow-sm mb-4">
                <Upload className="h-5 w-5" />
              </div>

              <div className="space-y-1.5 font-sans">
                <div className="flex items-center justify-center space-x-1.5 text-xs sm:text-sm text-foreground font-bold">
                  <span className="text-accent">&gt;</span>
                  <span>Drag & drop CSV or Excel spreadsheet here</span>
                </div>
                <p className="text-xs text-muted">
                  or <span className="text-accent underline font-semibold">browse your system directory</span>
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 text-[10px] text-muted/60 mt-6 uppercase tracking-wider font-extrabold font-mono">
                <span>CSV</span>
                <span>•</span>
                <span>XLSX</span>
                <span>•</span>
                <span>XLS</span>
                <span>•</span>
                <span>Max Size 5MB</span>
              </div>

              {isPending && (
                <div className="mt-4 flex items-center space-x-2 text-[11px] text-accent font-bold">
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  <span>Parsing Columns & Aligning Types...</span>
                </div>
              )}

              {error && (
                <div className="mt-4 flex items-start space-x-2.5 text-left p-3.5 bg-rose-500/10 border border-rose-500/20 rounded-xl text-xs text-rose-500 max-w-sm">
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}
            </div>

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileInputChange}
              accept=".csv,.xlsx,.xls"
              className="hidden"
            />
          </section>

          {/* 3. FEATURES SECTION — Bento Grid */}
          <section id="features" className="scroll-mt-24 space-y-12">
            <div className="text-center space-y-2">
              <span className="text-[10px] uppercase font-extrabold text-accent tracking-widest block font-mono">Advanced Capabilities</span>
              <h2 className="font-sans text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
                Premium Analytical Toolkit
              </h2>
              <p className="text-xs sm:text-sm text-muted max-w-sm mx-auto leading-relaxed">
                Enterprise power, zero server infrastructure. Optimized for immediate exploration.
              </p>
            </div>

            {/* Bento Grid Layout (Uniform responsive sizes) */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-stretch">
              {/* Card 1: Instant Dashboards (Span 7) */}
              <div className="md:col-span-7 bg-surface border border-border/80 p-6 rounded-2xl flex flex-col justify-between hover:border-text-secondary transition-all duration-300 shadow-xs relative group overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-accent/30 scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-300" />
                <div className="space-y-4">
                  <div className="h-10 w-10 bg-background border border-border rounded-xl flex items-center justify-center text-accent">
                    <LayoutDashboard className="h-4.5 w-4.5" />
                  </div>
                  <div className="space-y-1.5">
                    <h3 className="text-sm font-bold text-foreground">Instant Interactive Dashboards</h3>
                    <p className="text-xs text-muted leading-relaxed font-normal">
                      Reorder, customize, and add custom metrics instantly. Automatic chart generation adapts to detected columns and data shapes on the fly.
                    </p>
                  </div>
                </div>
              </div>

              {/* Card 2: AI text-to-SQL (Span 5) */}
              <div className="md:col-span-5 bg-surface border border-border/80 p-6 rounded-2xl flex flex-col justify-between hover:border-text-secondary transition-all duration-300 shadow-xs relative group overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-accent/30 scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-300" />
                <div className="space-y-4">
                  <div className="h-10 w-10 bg-background border border-border rounded-xl flex items-center justify-center text-accent">
                    <Bot className="h-4.5 w-4.5" />
                  </div>
                  <div className="space-y-1.5">
                    <h3 className="text-sm font-bold text-foreground">Conversational AI Co-Pilot</h3>
                    <p className="text-xs text-muted leading-relaxed font-normal">
                      Converse in plain natural English. The Gemini model automatically structures clean SQL queries, executes them locally, and plots visual results.
                    </p>
                  </div>
                </div>
              </div>

              {/* Card 3: In-browser DuckDB (Span 4) */}
              <div className="md:col-span-4 bg-surface border border-border/80 p-6 rounded-2xl flex flex-col justify-between hover:border-text-secondary transition-all duration-300 shadow-xs relative group overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-accent/30 scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-300" />
                <div className="space-y-4">
                  <div className="h-10 w-10 bg-background border border-border rounded-xl flex items-center justify-center text-accent">
                    <Database className="h-4.5 w-4.5" />
                  </div>
                  <div className="space-y-1.5">
                    <h3 className="text-sm font-bold text-foreground">DuckDB SQL Engine</h3>
                    <p className="text-xs text-muted leading-relaxed font-normal">
                      Runs raw analytical SQL queries directly in-memory via DuckDB-WASM at native speeds, without any server-side database latency.
                    </p>
                  </div>
                </div>
              </div>

              {/* Card 4: Python Stats (Span 4) */}
              <div className="md:col-span-4 bg-surface border border-border/80 p-6 rounded-2xl flex flex-col justify-between hover:border-text-secondary transition-all duration-300 shadow-xs relative group overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-accent/30 scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-300" />
                <div className="space-y-4">
                  <div className="h-10 w-10 bg-background border border-border rounded-xl flex items-center justify-center text-accent">
                    <Cpu className="h-4.5 w-4.5" />
                  </div>
                  <div className="space-y-1.5">
                    <h3 className="text-sm font-bold text-foreground">Python Statistical Layer</h3>
                    <p className="text-xs text-muted leading-relaxed font-normal">
                      Evaluate robust statistics seamlessly. Spawn linear trend forecasts, find statistical outliers using IQR, and examine Pearson correlations.
                    </p>
                  </div>
                </div>
              </div>

              {/* Card 5: PDF Export & Privacy (Span 4) */}
              <div className="md:col-span-4 bg-surface border border-border/80 p-6 rounded-2xl flex flex-col justify-between hover:border-text-secondary transition-all duration-300 shadow-xs relative group overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-accent/30 scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-300" />
                <div className="space-y-4">
                  <div className="h-10 w-10 bg-background border border-border rounded-xl flex items-center justify-center text-accent">
                    <Lock className="h-4.5 w-4.5" />
                  </div>
                  <div className="space-y-1.5">
                    <h3 className="text-sm font-bold text-foreground">Local PDF Export & Privacy</h3>
                    <p className="text-xs text-muted leading-relaxed font-normal">
                      Compile dynamic layouts to PDF. Rest easy knowing raw spreadsheet data is parsed local-only and never synced to external databases.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* 4. "HOW IT WORKS" SECTION — 4 animated steps */}
          <section id="how-it-works" className="scroll-mt-24 space-y-12">
            <div className="text-center space-y-2">
              <span className="text-[10px] uppercase font-extrabold text-accent tracking-widest block font-mono">Product Roadmap</span>
              <h2 className="font-sans text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
                Seamless Four-Step Workflow
              </h2>
              <p className="text-xs sm:text-sm text-muted max-w-xs mx-auto leading-relaxed">
                A simple, friction-free pipeline from raw data to production-ready exports.
              </p>
            </div>

            <div ref={stepsContainerRef} className="relative max-w-4xl mx-auto px-4 py-8">
              {/* Connecting Line */}
              {!reducedMotion && (
                <div className="absolute left-1/2 top-4 bottom-4 w-[2px] bg-border -translate-x-1/2 hidden md:block">
                  <div
                    className="absolute top-0 left-0 right-0 bg-accent transition-all duration-300"
                    style={{ height: `${scrollProgress * 100}%` }}
                  />
                </div>
              )}

              <div className="space-y-16">
                {/* Step 1 */}
                <div className="flex flex-col md:flex-row items-center justify-between gap-8 md:gap-16">
                  <div className="w-full md:w-1/2 md:text-right space-y-2 order-2 md:order-1">
                    <span className="text-[10px] font-mono text-accent font-bold">01. DROP OR BROWSE</span>
                    <h3 className="text-sm font-bold text-foreground">Secure Client-Side Upload</h3>
                    <p className="text-xs text-muted leading-relaxed font-normal">
                      Select any local CSV or Excel document. Parsed entirely within your browser memory utilizing high-fidelity parsing helpers. No backend records are generated.
                    </p>
                  </div>
                  <div className="w-12 h-12 rounded-full border-2 border-border bg-background flex items-center justify-center text-accent font-extrabold text-xs z-10 order-1 md:order-2 shrink-0 shadow-sm">
                    1
                  </div>
                  <div className="w-full md:w-1/2 order-3" />
                </div>

                {/* Step 2 */}
                <div className="flex flex-col md:flex-row items-center justify-between gap-8 md:gap-16">
                  <div className="w-full md:w-1/2 order-3 md:order-1" />
                  <div className="w-12 h-12 rounded-full border-2 border-border bg-background flex items-center justify-center text-accent font-extrabold text-xs z-10 order-1 md:order-2 shrink-0 shadow-sm">
                    2
                  </div>
                  <div className="w-full md:w-1/2 text-left space-y-2 order-2 shrink-0">
                    <span className="text-[10px] font-mono text-accent font-bold">02. AUTO ANALYSIS</span>
                    <h3 className="text-sm font-bold text-foreground">Instant Layout Compilation</h3>
                    <p className="text-xs text-muted leading-relaxed font-normal">
                      View responsive dashboards tracking KPI aggregations, timelines, categorizations, and detailed statistical insights built automatically on upload.
                    </p>
                  </div>
                </div>

                {/* Step 3 */}
                <div className="flex flex-col md:flex-row items-center justify-between gap-8 md:gap-16">
                  <div className="w-full md:w-1/2 md:text-right space-y-2 order-2 md:order-1">
                    <span className="text-[10px] font-mono text-accent font-bold">03. ASK CO-PILOT</span>
                    <h3 className="text-sm font-bold text-foreground">Conversational AI Chat</h3>
                    <p className="text-xs text-muted leading-relaxed font-normal">
                      Ask business questions directly. The co-pilot writes safe SQL, queries your in-memory browser database, and delivers graphical and text-based explanations instantly.
                    </p>
                  </div>
                  <div className="w-12 h-12 rounded-full border-2 border-border bg-background flex items-center justify-center text-accent font-extrabold text-xs z-10 order-1 md:order-2 shrink-0 shadow-sm">
                    3
                  </div>
                  <div className="w-full md:w-1/2 order-3" />
                </div>

                {/* Step 4 */}
                <div className="flex flex-col md:flex-row items-center justify-between gap-8 md:gap-16">
                  <div className="w-full md:w-1/2 order-3 md:order-1" />
                  <div className="w-12 h-12 rounded-full border-2 border-border bg-background flex items-center justify-center text-accent font-extrabold text-xs z-10 order-1 md:order-2 shrink-0 shadow-sm">
                    4
                  </div>
                  <div className="w-full md:w-1/2 text-left space-y-2 order-2 shrink-0">
                    <span className="text-[10px] font-mono text-accent font-bold">04. PERSIST & EXPORT</span>
                    <h3 className="text-sm font-bold text-foreground">High-Fidelity PDF Export</h3>
                    <p className="text-xs text-muted leading-relaxed font-normal">
                      Generate professional-grade PDF reports of your customized dashboard configurations. Save definitions securely for instant reloading via reactivation codes.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* 5. LIVE AI SHOWCASE SECTION */}
          <section id="ai-showcase" className="scroll-mt-24 space-y-12 max-w-4xl mx-auto px-4">
            <div className="text-center space-y-2">
              <span className="text-[10px] uppercase font-extrabold text-accent tracking-widest block font-mono">Live Simulation</span>
              <h2 className="font-sans text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
                Conversational SQL Co-Pilot in Action
              </h2>
              <p className="text-xs sm:text-sm text-muted max-w-sm mx-auto leading-relaxed">
                Watch how natural language is translated to physical SQL queries executed instantly.
              </p>
            </div>

            {/* Showcase terminal container */}
            <div ref={liveShowcaseRef} className="bg-[#141210] border border-border rounded-2xl overflow-hidden shadow-xl flex flex-col min-h-[380px] text-emerald-400 font-mono text-[11px] sm:text-xs">
              {/* Chrome header */}
              <div className="px-4 py-2.5 bg-surface-subtle border-b border-border flex items-center justify-between select-none">
                <div className="flex items-center space-x-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-border" />
                  <span className="w-2.5 h-2.5 rounded-full bg-border" />
                  <span className="w-2.5 h-2.5 rounded-full bg-border" />
                </div>
                <span className="text-[10px] text-muted uppercase font-bold tracking-widest">ai-analyst-session.sh</span>
                <div className="w-12" />
              </div>

              {/* Console log */}
              <div className="flex-1 p-6 space-y-6 flex flex-col justify-between">
                <div className="space-y-4">
                  {/* Prompt */}
                  <div className="flex items-start space-x-2">
                    <span className="text-[#38bdf8] font-bold shrink-0">$ ask_copilot</span>
                    <span className="text-white border-r-2 border-white pr-1 animate-pulse">
                      {typedQuestion || <span className="text-muted/40 italic">Listening for trigger...</span>}
                    </span>
                  </div>

                  {/* Loader */}
                  {showShowcaseLoader && (
                    <div className="text-[#38bdf8]/70 flex items-center space-x-2 animate-pulse">
                      <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                      <span>Gemini-2.5-flash translating to DuckDB Analytical SQL...</span>
                    </div>
                  )}

                  {/* Chart response comparing regions */}
                  {showShowcaseChart && (
                    <div className="space-y-4 animate-fade-in">
                      <div className="bg-[#1e1c1a] p-3.5 rounded-xl border border-[#38bdf8]/10 text-white leading-normal whitespace-pre overflow-x-auto text-[10px]">
                        {`SELECT region, (SUM(revenue_current) - SUM(revenue_last)) / SUM(revenue_last) * 100 AS growth_rate\nFROM dataset\nGROUP BY 1 ORDER BY 2 DESC;`}
                      </div>

                      <div className="h-44 w-full select-none text-white bg-[#1e1c1a]/40 p-4 rounded-xl border border-border/40">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={SHOWCASE_REGIONS_DATA} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#2a2826" vertical={false} />
                            <XAxis
                              dataKey="region"
                              stroke="#a8a29e"
                              tickLine={false}
                              axisLine={false}
                              dy={8}
                            />
                            <YAxis
                              stroke="#a8a29e"
                              tickLine={false}
                              axisLine={false}
                              width={35}
                              tickFormatter={(v) => `${v}%`}
                            />
                            <Bar
                              dataKey="growth"
                              name="Revenue Growth Rate"
                              fill="var(--accent)"
                              radius={[2, 2, 0, 0]}
                            />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  )}
                </div>

                {/* Explanation text appearing below it */}
                {showShowcaseExpl && (
                  <div className="text-white border-l-2 border-emerald-500 pl-3.5 animate-fade-in leading-relaxed text-xs">
                    The <strong className="text-emerald-400">West region</strong> led with 18% quarter-over-quarter growth, driven largely by a spike in enterprise account signups in March.
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* 6. ANIMATED STATISTICS COUNTERS */}
          <section ref={statsRef} className="scroll-mt-24 max-w-4xl mx-auto px-4">
            <div className="bg-surface border border-border rounded-2xl p-8 sm:p-10 shadow-xs relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-accent/5 to-transparent pointer-events-none" />
              <div className="grid grid-cols-2 md:grid-cols-4 gap-8 justify-center relative z-10">
                <AnimatedCounter value={3} label="Stat models" trigger={isStatsInView} />
                <AnimatedCounter value={100} label="% client-side processing" trigger={isStatsInView} />
                <AnimatedCounter value={2} label="File formats supported" trigger={isStatsInView} />
                <AnimatedCounter value={1} label="AI analyst, unlimited Qs" trigger={isStatsInView} />
              </div>
            </div>
          </section>

          {/* 7. SOCIAL PROOF — "Built With" Technology Badges */}
          <section id="built-with" className="scroll-mt-24 space-y-12">
            <div className="text-center space-y-2">
              <span className="text-[10px] uppercase font-extrabold text-accent tracking-widest block font-mono">Under the Hood</span>
              <h2 className="font-sans text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
                Architected with Real-World Engines
              </h2>
              <p className="text-xs sm:text-sm text-muted max-w-sm mx-auto leading-relaxed">
                A verified technical stack ensuring speed, persistence, and safe generative intelligence.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto px-4">
              <TechBadge icon={Cpu} name="Next.js App Router" desc="Provides fast serverless page layout rendering, light/dark hydration, and seamless Next.js 15 client-side path transitions." />
              <TechBadge icon={Type} name="TypeScript Core" desc="Enforces compilation-level type checking for schema parser functions, type alignments, and database interaction boundaries." />
              <TechBadge icon={Bot} name="Gemini API Engine" desc="Translates conversational prompts server-side via official @google/generative-ai and gemini-2.5-flash with automated recovery." />
              <TechBadge icon={Database} name="Supabase Secure Sync" desc="Handles safe dashboard schema definitions and chat histories utilizing anonymous session locks and RLS rules." />
              <TechBadge icon={Zap} name="DuckDB-WASM Engine" desc="Launches high-performance columnar DuckDB directly inside browser memory to execute analytics without delays." />
              <TechBadge icon={Server} name="Vercel serverless layer" desc="Executes severe statistical tasks (IQR outlier scanning, Trend Forecasts) instantly using modern serverless API endpoints." />
            </div>
          </section>

          {/* 8. "PRICING" SECTION — Free & Open Centered Panel */}
          <section id="pricing" className="scroll-mt-24 max-w-2xl mx-auto px-4">
            <div className="bg-surface border border-accent/20 rounded-2xl p-8 sm:p-10 shadow-md text-center space-y-6 relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-full h-1 bg-accent scale-x-0 group-hover:scale-x-100 transition-transform origin-center duration-500" />
              <div className="absolute top-4 right-4 text-accent/15 select-none font-extrabold text-6xl font-mono">FREE</div>

              <div className="space-y-2">
                <span className="text-[10px] uppercase font-extrabold text-accent tracking-widest block font-mono">Pricing Commitment</span>
                <h3 className="font-sans text-xl sm:text-2xl font-extrabold text-foreground tracking-tight">
                  Free & Open-Source BI
                </h3>
                <p className="text-xs text-muted max-w-md mx-auto leading-relaxed font-normal">
                  No subscriptions. No account creations. No tracking cookies. InsightLoop is entirely free to run on any computer.
                </p>
              </div>

              <div className="border-t border-b border-border/60 py-5 space-y-3.5 max-w-xs mx-auto text-left text-xs text-muted font-normal">
                <div className="flex items-center space-x-2.5">
                  <CheckCircle className="h-4 w-4 text-accent" />
                  <span>100% Client-Side Data Integrity</span>
                </div>
                <div className="flex items-center space-x-2.5">
                  <CheckCircle className="h-4 w-4 text-accent" />
                  <span>Interactive SQL console & AI Chat</span>
                </div>
                <div className="flex items-center space-x-2.5">
                  <CheckCircle className="h-4 w-4 text-accent" />
                  <span>High-Fidelity PDF Exporting</span>
                </div>
              </div>

              <div>
                <button
                  onClick={() => handleScrollToSection("upload-zone")}
                  className="flex items-center justify-center space-x-1.5 px-6 py-3 bg-accent text-white font-semibold rounded-xl text-xs transition-all mx-auto shadow-md shadow-accent/15 focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
                >
                  <span>Get started now</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </section>

          {/* 9. FINAL CTA SECTION */}
          <section className="bg-surface border border-border rounded-2xl p-10 sm:p-14 text-center space-y-6 max-w-4xl mx-auto px-4 relative overflow-hidden shadow-xs">
            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-accent/5 pointer-events-none" />

            <div className="max-w-2xl mx-auto space-y-4 relative z-10">
              <h2 className="font-sans text-2xl sm:text-3xl md:text-4xl font-extrabold text-foreground tracking-tight">
                Ready to explore your spreadsheets?
              </h2>
              <p className="text-xs sm:text-sm text-muted leading-relaxed font-normal">
                No credit cards. No deployment setups. Drop in your local data files and immediately start conversing with an intelligence engine on your terms.
              </p>
            </div>

            <div className="pt-2 relative z-10">
              <button
                onClick={() => handleScrollToSection("upload-zone")}
                className="flex items-center justify-center space-x-1.5 px-6 py-3 bg-accent hover:opacity-90 text-white font-semibold rounded-xl text-sm transition-all mx-auto shadow-lg shadow-accent/15 focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
              >
                <span>Upload your document</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </section>

        </div>
      )}

      {/* Active Workspace Header Bar (when file is successfully parsed) */}
      {parsedData && (
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-6 pt-6">
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
            className="flex items-center space-x-1.5 px-4 py-2 bg-surface hover:bg-surface-subtle text-rose-500 border border-border rounded-lg text-xs transition-all font-semibold focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
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
                  <Terminal className="h-4.5 w-4.5" />
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
        <div className="flex-1 flex flex-col items-center justify-center space-y-3 py-20">
          <RefreshCw className="h-6 w-6 text-accent animate-spin" />
          <span className="text-xs text-muted font-semibold">Initializing workspace co-pilot...</span>
        </div>
      }
    >
      <HomeContent />
    </Suspense>
  );
}
