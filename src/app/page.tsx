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
  Sparkles,
  MessageSquare,
  Compass,
  Cpu
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
import { supabase } from "@/utils/supabaseClient";
import Link from "next/link";

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB

// Scroll-Reveal Animated Card Component using IntersectionObserver
function ScrollRevealCard({ children, index, reducedMotion }: { children: React.ReactNode; index: number; reducedMotion: boolean }) {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (reducedMotion) {
      setIsVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(entry.target);
        }
      },
      {
        threshold: 0.15,
        rootMargin: "0px 0px -50px 0px",
      }
    );

    const currentRef = ref.current;
    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, [reducedMotion]);

  return (
    <div
      ref={ref}
      style={{
        transitionDelay: reducedMotion ? "0ms" : `${index * 150}ms`,
      }}
      className={`transition-all duration-700 ease-out ${
        isVisible
          ? "opacity-100 translate-y-0"
          : "opacity-0 translate-y-8"
      }`}
    >
      {children}
    </div>
  );
}

function MiniDashboardPreview({ reducedMotion }: { reducedMotion: boolean }) {
  const [count, setCount] = useState(0);
  const [chatStep, setChatStep] = useState(0);

  // KPI counter logic
  useEffect(() => {
    if (reducedMotion) {
      setCount(48250);
      return;
    }
    const duration = 1500;
    const start = 0;
    const end = 48250;
    const stepTime = 25;
    const totalSteps = duration / stepTime;
    const increment = end / totalSteps;
    let current = start;

    const timer = setInterval(() => {
      current += increment;
      if (current >= end) {
        setCount(end);
        clearInterval(timer);
      } else {
        setCount(Math.floor(current));
      }
    }, stepTime);

    return () => clearInterval(timer);
  }, [reducedMotion]);

  // Chat conversation sequence loop
  useEffect(() => {
    if (reducedMotion) {
      setChatStep(3); // immediately show complete conversation
      return;
    }
    const interval = setInterval(() => {
      setChatStep((prev) => (prev + 1) % 4);
    }, 4000);
    return () => clearInterval(interval);
  }, [reducedMotion]);

  return (
    <div className="relative w-full max-w-lg bg-surface border border-border rounded-xl overflow-hidden select-none shadow-sm">
      {/* OS Titlebar */}
      <div className="flex items-center justify-between px-4 py-3 bg-surface-subtle border-b border-border">
        <div className="flex items-center space-x-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-border" />
          <div className="w-2.5 h-2.5 rounded-full bg-border" />
          <div className="w-2.5 h-2.5 rounded-full bg-border" />
        </div>
        <span className="text-[10px] font-sans font-medium tracking-wider text-muted uppercase">
          InsightLoop AI Sandbox
        </span>
        <div className="w-10" />
      </div>

      <div className="p-4 space-y-4">
        {/* KPI Row */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-background border border-border p-3 rounded-lg">
            <span className="text-[9px] uppercase font-bold text-muted block tracking-wider">Active Deals</span>
            <span className="text-base font-bold text-foreground mt-1 block">142</span>
          </div>
          <div className="bg-background border border-border p-3 rounded-lg">
            <span className="text-[9px] uppercase font-bold text-muted block tracking-wider">Total Sales</span>
            <span className="text-base font-bold text-accent mt-1 block font-mono">
              ${count.toLocaleString()}
            </span>
          </div>
        </div>

        {/* SVG Drawing Chart */}
        <div className="bg-background border border-border p-3 rounded-lg h-36 flex flex-col justify-between">
          <span className="text-[9px] uppercase font-bold text-muted block tracking-wider">Revenue Trend</span>
          <div className="relative flex-1 flex items-end justify-center w-full mt-2">
            <svg viewBox="0 0 400 100" className="w-full h-full">
              {/* Grid Lines */}
              <line x1="0" y1="20" x2="400" y2="20" stroke="var(--border)" strokeWidth="1" strokeDasharray="3 3" />
              <line x1="0" y1="50" x2="400" y2="50" stroke="var(--border)" strokeWidth="1" strokeDasharray="3 3" />
              <line x1="0" y1="80" x2="400" y2="80" stroke="var(--border)" strokeWidth="1" strokeDasharray="3 3" />

              {/* Minimal Line Path */}
              <path
                d="M 10 90 Q 60 20 110 70 T 210 30 T 310 80 T 390 10"
                fill="none"
                stroke="var(--accent)"
                strokeWidth="1.5"
                strokeLinecap="round"
                className={reducedMotion ? "" : "animate-draw-path"}
                style={{
                  strokeDasharray: 400,
                  strokeDashoffset: reducedMotion ? 0 : 400,
                }}
              />

              {/* Data points */}
              <circle cx="110" cy="70" r="3" fill="var(--accent)" />
              <circle cx="210" cy="30" r="3" fill="var(--accent)" />
              <circle cx="390" cy="10" r="3" fill="var(--success)" />
            </svg>
          </div>
        </div>

        {/* Animated Conversation State */}
        <div className="bg-surface-subtle border border-border rounded-lg p-3 min-h-[76px] flex flex-col justify-center space-y-2">
          {/* User question */}
          {chatStep >= 1 && (
            <div className="flex items-start space-x-2 animate-fade-in">
              <div className="w-5 h-5 rounded bg-surface border border-border text-foreground flex items-center justify-center text-[9px] font-medium shrink-0">
                U
              </div>
              <p className="text-[10px] text-foreground leading-relaxed bg-surface border border-border px-2.5 py-1 rounded-lg font-medium">
                What was our top category by sales?
              </p>
            </div>
          )}

          {/* AI Thinking */}
          {chatStep === 2 && (
            <div className="flex items-center space-x-2 text-muted pl-1">
              <span className="text-[9px] font-bold uppercase tracking-wider">AI is thinking...</span>
              <div className="flex space-x-1">
                <span className="w-1 h-1 bg-muted rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                <span className="w-1 h-1 bg-muted rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                <span className="w-1 h-1 bg-muted rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            </div>
          )}

          {/* AI Response */}
          {chatStep === 3 && (
            <div className="flex items-start space-x-2 animate-fade-in">
              <div className="w-5 h-5 rounded bg-accent text-white flex items-center justify-center text-[9px] font-medium shrink-0">
                AI
              </div>
              <p className="text-[10px] text-muted leading-relaxed bg-surface border border-border px-2.5 py-1 rounded-lg">
                <span className="font-semibold text-foreground">Electronics</span> was the top category, generating <span className="text-success font-semibold">$24,850</span> in sales.
              </p>
            </div>
          )}

          {chatStep === 0 && (
            <div className="text-center py-2 text-[10px] text-muted font-medium italic">
              Ask questions to your AI Data Analyst...
            </div>
          )}
        </div>
      </div>
    </div>
  );
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

  // Shared Dashboard ID state for Phase 7 Chat History Persistence
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
      // Clear query params to prevent scrolling on reload
      router.replace("/");

      setTimeout(() => {
        const el = document.getElementById(scrollParam);
        if (el) {
          el.scrollIntoView({ behavior: reducedMotion ? "auto" : "smooth" });
        }
      }, 300);
    }
  }, [scrollParam, router, reducedMotion]);

  // Smooth scroll down to file upload container
  const scrollToUpload = () => {
    document.getElementById("upload-zone")?.scrollIntoView({ behavior: "smooth" });
  };

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

    // Resolve schema array
    let savedSchema: ColumnSchema[] = [];
    if (typeof savedSummary === "object" && !Array.isArray(savedSummary) && "schema" in savedSummary) {
      savedSchema = Array.isArray((savedSummary as { schema: unknown }).schema) ? ((savedSummary as { schema: ColumnSchema[] }).schema) : [];
    } else if (Array.isArray(savedSummary)) {
      savedSchema = savedSummary as ColumnSchema[];
    } else {
      return false;
    }

    if (savedSchema.length === 0) return false;

    // Compatibility rule: same type, or text/category compatible, or number/currency compatible
    const isCompatible = (t1: string, t2: string) => {
      if (t1 === t2) return true;
      if ((t1 === "text" || t1 === "category") && (t2 === "text" || t2 === "category")) return true;
      if ((t1 === "number" || t1 === "currency") && (t2 === "number" || t2 === "currency")) return true;
      return false;
    };

    // All columns from savedSchema must exist in uploadedSchema (match by sqlSafeName) with compatible types
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

        // Reactivation schema matching check
        if (reactivateId && targetDashboard) {
          const matches = matchSchemas(targetDashboard.dataset_summary, result.schema);
          if (matches) {
            // Align column currentTypes to match saved dashboard overrides exactly
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

            // Sync database right away
            setSyncStatus({ loading: true, error: null });
            const loadRes = await loadDataset(alignedResult);
            if (!loadRes.success) {
              throw new Error(loadRes.error || "Failed to load reactivated database.");
            }
            setSyncStatus({ loading: false, error: null });

            // Store stripped result in sessionStorage for page revisit retrieval
            const strippedResult = {
              ...alignedResult,
              rawRows: [], // omit raw rows to save storage space
            };
            sessionStorage.setItem(`insightloop_reactivated_parsed_data_${reactivateId}`, JSON.stringify(strippedResult));

            // Clean up query param from URL and redirect
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
    <div className="flex-1 w-full max-w-7xl mx-auto px-6 py-12 space-y-12">
      {/* Inject custom CSS keyframe animations */}
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
        <div className="bg-surface border border-border p-5 rounded-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 max-w-3xl mx-auto animate-fade-in shadow-sm">
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
            className="text-xs text-muted hover:text-foreground transition font-medium underline shrink-0 focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none rounded"
          >
            Cancel Reactivation
          </button>
        </div>
      )}

      {/* REACTIVATION WARNING */}
      {reactivateWarning && (
        <div className="bg-warning/10 border border-warning/30 p-4 rounded-lg flex items-start space-x-3 max-w-3xl mx-auto animate-fade-in text-warning">
          <XCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="text-xs font-bold text-foreground">Schema Mismatch Detected</p>
            <p className="text-xs text-muted leading-relaxed">{reactivateWarning}</p>
          </div>
        </div>
      )}

      {/* Main Upload Area (when no file is successfully parsed) */}
      {!parsedData && (
        <div className="space-y-16 py-4">
          {/* Beautiful Hero section */}
          <section className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Hero Left Content */}
            <div className="lg:col-span-7 space-y-6 text-left">
              <div className="inline-flex items-center space-x-2 px-2.5 py-1 bg-surface border border-border rounded-lg">
                <Sparkles className="h-3.5 w-3.5 text-accent" />
                <span className="text-[10px] font-medium text-foreground uppercase tracking-wider">
                  Next-Gen Business Intelligence
                </span>
              </div>

              <h1 className="font-sans text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-foreground leading-none">
                Your data, <span className="text-accent">explained in plain English</span>
              </h1>

              <p className="text-sm sm:text-base text-muted leading-relaxed max-w-xl font-normal">
                Upload a spreadsheet and get instant dashboards, deeper statistical insights, and an AI analyst you can ask anything — all running securely in your browser.
              </p>

              <div className="pt-4 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <button
                  onClick={scrollToUpload}
                  className="flex items-center justify-center space-x-1.5 px-5 py-2.5 bg-accent hover:opacity-90 active:scale-95 text-white font-medium rounded-lg text-xs transition-all focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
                >
                  <span>Launch Workspace & Upload</span>
                  <ChevronDown className="h-3.5 w-3.5 mt-0.5" />
                </button>
                <Link
                  href="/dashboards"
                  className="flex items-center justify-center space-x-1.5 px-5 py-2.5 bg-surface hover:bg-surface-subtle text-foreground font-medium border border-border rounded-lg text-xs transition-all focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
                >
                  <span>View Saved Dashboards</span>
                </Link>
              </div>
            </div>

            {/* Hero Right Preview Animation */}
            <div className="lg:col-span-5 flex justify-center">
              <MiniDashboardPreview reducedMotion={reducedMotion} />
            </div>
          </section>

          {/* "How It Works" Section */}
          <section id="how-it-works" className="pt-16 border-t border-border scroll-mt-24 space-y-10">
            <div className="text-center space-y-2">
              <span className="text-[9px] uppercase font-bold text-accent tracking-widest block">Core Workflow</span>
              <h2 className="font-sans text-xl sm:text-2xl font-bold text-foreground tracking-tight">
                How InsightLoop Works
              </h2>
              <p className="text-xs text-muted max-w-sm mx-auto leading-relaxed">
                Unlock advanced analytics and query datasets natively in your browser in under 10 seconds.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Step 1: Upload */}
              <ScrollRevealCard index={0} reducedMotion={reducedMotion}>
                <div className="bg-surface border border-border p-6 rounded-lg h-full flex flex-col space-y-4 hover:border-text-secondary transition duration-200 relative group overflow-hidden shadow-sm">
                  <div className="absolute top-4 right-4 text-3xl font-sans font-extrabold text-border opacity-20 select-none">
                    01
                  </div>
                  <div className="h-10 w-10 bg-background border border-border rounded-lg flex items-center justify-center text-accent">
                    <Upload className="h-4.5 w-4.5" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-sm font-bold text-foreground">1. Secure Upload</h3>
                    <p className="text-xs text-muted leading-relaxed font-normal">
                      Drop in any CSV or Excel file. Your dataset is parsed entirely client-side and remains strictly private in your browser.
                    </p>
                  </div>
                </div>
              </ScrollRevealCard>

              {/* Step 2: Analyze */}
              <ScrollRevealCard index={1} reducedMotion={reducedMotion}>
                <div className="bg-surface border border-border p-6 rounded-lg h-full flex flex-col space-y-4 hover:border-text-secondary transition duration-200 relative group overflow-hidden shadow-sm">
                  <div className="absolute top-4 right-4 text-3xl font-sans font-extrabold text-border opacity-20 select-none">
                    02
                  </div>
                  <div className="h-10 w-10 bg-background border border-border rounded-lg flex items-center justify-center text-accent">
                    <Compass className="h-4.5 w-4.5" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-sm font-bold text-foreground">2. Instant Analysis</h3>
                    <p className="text-xs text-muted leading-relaxed font-normal">
                      Generate responsive dashboards, execute raw browser-based SQL, and run advanced serverless statistical trend forecasting.
                    </p>
                  </div>
                </div>
              </ScrollRevealCard>

              {/* Step 3: Ask */}
              <ScrollRevealCard index={2} reducedMotion={reducedMotion}>
                <div className="bg-surface border border-border p-6 rounded-lg h-full flex flex-col space-y-4 hover:border-text-secondary transition duration-200 relative group overflow-hidden shadow-sm">
                  <div className="absolute top-4 right-4 text-3xl font-sans font-extrabold text-border opacity-20 select-none">
                    03
                  </div>
                  <div className="h-10 w-10 bg-background border border-border rounded-lg flex items-center justify-center text-accent">
                    <MessageSquare className="h-4.5 w-4.5" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-sm font-bold text-foreground">3. Conversational AI</h3>
                    <p className="text-xs text-muted leading-relaxed font-normal">
                      Chat with a smart AI analyst that translates plain English instructions into raw SQL queries and executes them in real-time.
                    </p>
                  </div>
                </div>
              </ScrollRevealCard>
            </div>
          </section>

          {/* Subtle trust stack bar */}
          <section className="flex flex-col items-center justify-center space-y-2 pt-6 select-none border-t border-border">
            <span className="text-[9px] uppercase font-bold text-muted tracking-widest flex items-center gap-1.5">
              <Cpu className="h-3 w-3 text-accent" />
              <span>Technical Engine Stack</span>
            </span>
            <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-muted">
              <span className="flex items-center gap-1.5 hover:text-foreground transition duration-200">
                <span className="w-1.5 h-1.5 rounded-full bg-accent" />
                <span>Gemini AI</span>
              </span>
              <span className="text-border hidden sm:inline">|</span>
              <span className="flex items-center gap-1.5 hover:text-foreground transition duration-200">
                <span className="w-1.5 h-1.5 rounded-full bg-accent" />
                <span>DuckDB-WASM</span>
              </span>
              <span className="text-border hidden sm:inline">|</span>
              <span className="flex items-center gap-1.5 hover:text-foreground transition duration-200">
                <span className="w-1.5 h-1.5 rounded-full bg-accent" />
                <span>Supabase Secure Sync</span>
              </span>
            </div>
          </section>

          {/* Upload Zone Section */}
          <div id="upload-zone" className="max-w-4xl mx-auto space-y-6 pt-16 border-t border-border scroll-mt-24">
            <div className="text-center space-y-2">
              <h2 className="font-sans text-xl font-bold text-foreground tracking-tight">
                Upload your data
              </h2>
              <p className="text-xs text-muted max-w-sm mx-auto leading-relaxed">
                CSV or Excel files are parsed securely in memory. Your raw rows never leave your computer.
              </p>
            </div>

            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={triggerFileBrowser}
              className={`border border-dashed rounded-lg p-10 text-center cursor-pointer transition-all duration-200 flex flex-col items-center justify-center space-y-4 focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none ${
                isDragging
                  ? "border-accent bg-surface-subtle scale-[0.99]"
                  : "border-border hover:border-text-secondary bg-surface hover:bg-surface-subtle"
              }`}
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  triggerFileBrowser();
                }
              }}
            >
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileInputChange}
                accept=".csv,.xlsx,.xls"
                className="hidden"
              />

              <div className="h-12 w-12 rounded-lg bg-surface border border-border flex items-center justify-center text-accent">
                <Upload className="h-5 w-5" />
              </div>

              <div className="space-y-1">
                <p className="text-sm font-bold text-foreground">Drag & drop your spreadsheet here</p>
                <p className="text-xs text-muted">
                  or <span className="text-accent hover:underline font-medium transition-colors">browse your files</span>
                </p>
              </div>

              <p className="text-[10px] text-muted/60 font-semibold uppercase tracking-wider">
                Accepts .CSV, .XLSX, or .XLS • Max 5MB
              </p>
            </div>

            {/* Loader */}
            {isPending && (
              <div className="flex items-center justify-center space-x-2.5 p-4 bg-surface border border-border rounded-lg">
                <RefreshCw className="h-4 w-4 text-accent animate-spin" />
                <span className="text-xs text-muted font-semibold">Parsing and analyzing dataset columns...</span>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="flex items-start space-x-2.5 p-4 bg-rose-500/10 border border-rose-500/20 rounded-lg animate-fade-in">
                <AlertCircle className="h-4 w-4 text-rose-500 mt-0.5 flex-shrink-0" />
                <div className="space-y-1">
                  <p className="text-xs font-bold text-rose-600">Unable to Parse File</p>
                  <p className="text-xs text-muted leading-relaxed">{error}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Active Workspace Header Bar */}
      {parsedData && (
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-6">
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
            className="flex items-center space-x-1.5 px-3.5 py-1.5 bg-surface hover:bg-surface-subtle text-rose-500 border border-border rounded-lg text-xs transition-all font-medium focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
          >
            <Trash2 className="h-3.5 w-3.5" />
            <span>Clear / Upload New</span>
          </button>
        </div>
      )}

      {/* Parsed Output / Preview Panel */}
      {parsedData && (
        <div className="space-y-6 animate-fade-in">
          {/* File summary bar */}
          <div className="bg-surface border border-border p-4 rounded-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center space-x-3">
              <div className="h-10 w-10 rounded-lg bg-surface border border-border flex items-center justify-center flex-shrink-0">
                <FileSpreadsheet className="h-5 w-5 text-success" />
              </div>
              <div>
                <h3 className="font-sans font-semibold text-foreground text-sm leading-tight truncate max-w-md">
                  {parsedData.fileName}
                </h3>
                <p className="text-[10px] text-muted mt-1">
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
          <div className="bg-surface border border-border rounded-lg overflow-hidden flex flex-col">
            <button
              onClick={() => setIsPreviewCollapsed(!isPreviewCollapsed)}
              className="px-5 py-3.5 border-b border-border flex items-center justify-between hover:bg-surface-subtle transition-all text-left w-full outline-none focus-visible:bg-surface-subtle"
            >
              <div className="flex items-center space-x-2">
                <TableProperties className="h-4 w-4 text-accent" />
                <span className="font-sans text-xs font-bold text-foreground uppercase tracking-wider">Data Preview (First 20 Rows)</span>
                {isPreviewCollapsed && (
                  <span className="text-[9px] bg-background border border-border text-muted font-medium px-1.5 py-0.5 rounded ml-2">
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
                            {/* Interactive schema header */}
                            <div className="flex flex-col space-y-2.5">
                              {/* Type dropdown override */}
                              <div className="flex items-center justify-between">
                                <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded bg-background border border-border text-[9px] font-bold uppercase text-muted">
                                  {getTypeIcon(col.currentType)}
                                  <span>{col.currentType}</span>
                                </span>

                                <select
                                  value={col.currentType}
                                  onChange={(e) => handleTypeOverride(col.columnName, e.target.value as ColumnType)}
                                  className="text-[9px] bg-background border border-border hover:border-text-secondary text-muted hover:text-foreground rounded px-1.5 py-0.5 font-medium outline-none cursor-pointer focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
                                >
                                  <option value="text">📝 text</option>
                                  <option value="number">🔢 number</option>
                                  <option value="currency">💰 currency</option>
                                  <option value="date">📅 date</option>
                                  <option value="category">🏷️ category</option>
                                </select>
                              </div>

                              {/* Original Display Name */}
                              <span className="text-xs font-bold text-foreground tracking-wide block truncate" title={col.displayName}>
                                {col.displayName}
                              </span>

                              {/* Stats metadata */}
                              <div className="flex flex-col space-y-1 text-[9px] text-muted border-t border-border/60 pt-2 font-normal">
                                <div className="flex justify-between">
                                  <span>Detected:</span>
                                  <span className="text-foreground">{getTypeLabel(col.detectedType)}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span>Uniqueness:</span>
                                  <span className="text-foreground">
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
                                  <span className="text-foreground font-medium">{displayCell}</span>
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

                <div className="px-5 py-3 border-t border-border bg-background/30 flex justify-between items-center text-[10px] text-muted font-medium">
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
                <h2 className="font-sans text-sm font-bold text-foreground uppercase tracking-wider">Interactive Analytics Dashboard</h2>
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
          <div className="bg-surface border border-border rounded-lg overflow-hidden flex flex-col">
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
                      <span className="text-[9px] bg-background border border-border text-muted font-medium px-1.5 py-0.5 rounded">
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
                  <div className="flex items-center space-x-1.5 bg-background border border-border px-2.5 py-1 rounded-lg text-[10px] font-medium self-start sm:self-auto">
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
                    className="flex items-center justify-center space-x-1.5 px-4 py-2 bg-accent hover:opacity-90 disabled:opacity-40 text-white font-medium rounded-lg text-xs transition-colors disabled:cursor-not-allowed focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
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
                      <span className="text-[10px] text-success font-medium bg-success/10 px-2 py-0.5 border border-success/20 rounded-lg">
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
