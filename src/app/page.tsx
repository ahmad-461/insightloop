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
  ArrowRight,
  Zap,
  HelpCircle,
  Sparkles
} from "lucide-react";
import ProductTour from "@/components/ProductTour";
import { motion, useInView, AnimatePresence } from "framer-motion";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line
} from "recharts";
import {
  parseCSV,
  parseExcel,
  castValue,
  ColumnType,
  ParsedResult,
  ColumnSchema,
  parseRawData
} from "../utils/parser";
import { useDuckDB } from "@/context/DuckDBContext";
import Dashboard from "@/components/Dashboard";
import { supabase } from "@/utils/supabaseClient";
import {
  AuroraBackground,
  FloatingAIIcons
} from "@/components/PremiumEffects";

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB


// Sample Data for Real AreaChart View inside Hero
const HERO_CHART_DATA = [
  { quarter: "Q1", revenue: 12500 },
  { quarter: "Q2", revenue: 18400 },
  { quarter: "Q3", revenue: 26100 },
  { quarter: "Q4", revenue: 42300 },
];

const ROTATING_QUESTIONS = [
  "Which region grew fastest last quarter?",
  "What's driving the drop in March?",
  "Show me outliers in customer spend"
];

const REGIONAL_SALES_DATA = [
  { month: "Jan", North: 4500, South: 3200, East: 4100, West: 5000 },
  { month: "Feb", North: 4800, South: 3500, East: 4300, West: 5500 },
  { month: "Mar", North: 4200, South: 3000, East: 3900, West: 4800 },
  { month: "Apr", North: 5100, South: 3800, East: 4600, West: 6200 },
  { month: "May", North: 5600, South: 4100, East: 4900, West: 7100 },
  { month: "Jun", North: 6200, South: 4500, East: 5300, West: 8400 },
];

// Continuous narrative aggregations
const REGIONAL_TOTALS = [
  { region: "North", revenue: 30400 },
  { region: "South", revenue: 22100 },
  { region: "East", revenue: 26100 },
  { region: "West", revenue: 37000 },
];

const REGIONAL_GROWTH = [
  { region: "North", growth: 37 },
  { region: "South", growth: 40 },
  { East: 29 },
  { region: "West", growth: 68 },
];

const WEST_TREND_DATA = [
  { month: "Jan", actual: 5000, trend: 5000 },
  { month: "Feb", actual: 5500, trend: 5600 },
  { month: "Mar", actual: 4800, trend: 6200 },
  { month: "Apr", actual: 6200, trend: 6800 },
  { month: "May", actual: 7100, trend: 7400 },
  { month: "Jun", actual: 8400, trend: 8000 },
  { month: "Jul", trend: 8600, forecast: 9500 },
  { month: "Aug", trend: 9200, forecast: 10600 },
];

// Custom typewriter component for the placeholder
function TypewriterPlaceholder({ reducedMotion }: { reducedMotion: boolean }) {
  const [text, setText] = useState("");
  const [index, setIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (reducedMotion) {
      setText(ROTATING_QUESTIONS[0]);
      return;
    }

    let timer: NodeJS.Timeout;
    const currentFullText = ROTATING_QUESTIONS[index];

    if (isDeleting) {
      timer = setTimeout(() => {
        setText((prev) => prev.slice(0, -1));
      }, 30);
    } else {
      timer = setTimeout(() => {
        setText((prev) => currentFullText.slice(0, prev.length + 1));
      }, 60);
    }

    if (!isDeleting && text === currentFullText) {
      timer = setTimeout(() => {
        setIsDeleting(true);
      }, 2000);
    } else if (isDeleting && text === "") {
      setIsDeleting(false);
      setIndex((prev) => (prev + 1) % ROTATING_QUESTIONS.length);
    }

    return () => clearTimeout(timer);
  }, [text, isDeleting, index, reducedMotion]);

  return <span>{text}</span>;
}

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



// Scrollytelling helper stage components
function ScrollytellingStage1() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!isInView) return;
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 5;
      });
    }, 50);
    return () => clearInterval(interval);
  }, [isInView]);

  return (
    <div ref={ref} className="bg-surface border border-border p-6 rounded-2xl shadow-sm flex flex-col items-center justify-center min-h-[220px]">
      <motion.div
        animate={isInView ? { scale: [0.9, 1.05, 1] } : {}}
        transition={{ duration: 0.5 }}
        className="h-14 w-14 bg-accent/10 border border-accent/20 rounded-2xl flex items-center justify-center text-accent mb-4 shadow-sm"
      >
        <FileSpreadsheet className="h-7 w-7" />
      </motion.div>
      <h4 className="font-sans font-bold text-sm text-foreground mb-1">regional_sales.csv</h4>
      <p className="text-xs text-muted mb-3 font-mono">Size: 4.8 KB • 5 columns x 6 rows</p>

      <div className="w-48 bg-background h-2.5 rounded-full overflow-hidden border border-border relative">
        <div className="bg-accent h-full transition-all duration-100" style={{ width: `${progress}%` }} />
      </div>
      <span className="text-[10px] font-bold text-accent mt-2 font-mono">{progress}% parsed</span>
    </div>
  );
}

function ScrollytellingStage2() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <div ref={ref} className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
      <div className="bg-surface border border-border p-4 rounded-2xl shadow-sm h-64 flex flex-col justify-between">
        <div>
          <span className="text-[9px] font-mono uppercase font-bold text-muted block tracking-wider">Revenue Trend Over Time</span>
          <span className="text-xs font-bold text-foreground mt-0.5 block">YTD Monthly Trend</span>
        </div>
        <div className="h-36 w-full text-[8px] mt-2">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={REGIONAL_SALES_DATA}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="month" stroke="var(--text-secondary)" tickLine={false} axisLine={false} />
              <YAxis stroke="var(--text-secondary)" tickLine={false} axisLine={false} width={25} />
              <Tooltip />
              <Line type="monotone" dataKey="West" stroke="var(--accent)" strokeWidth={2} dot={isInView} />
              <Line type="monotone" dataKey="North" stroke="#818cf8" strokeWidth={1.5} dot={isInView} />
              <Line type="monotone" dataKey="East" stroke="#f43f5e" strokeWidth={1.5} dot={isInView} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-surface border border-border p-4 rounded-2xl shadow-sm h-64 flex flex-col justify-between">
        <div>
          <span className="text-[9px] font-mono uppercase font-bold text-muted block tracking-wider">Total Sales by Region</span>
          <span className="text-xs font-bold text-foreground mt-0.5 block">YTD Cumulative Breakdown</span>
        </div>
        <div className="h-36 w-full text-[8px] mt-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={REGIONAL_TOTALS}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="region" stroke="var(--text-secondary)" tickLine={false} axisLine={false} />
              <YAxis stroke="var(--text-secondary)" tickLine={false} axisLine={false} width={25} />
              <Tooltip />
              <Bar dataKey="revenue" fill="var(--accent)" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

function ScrollytellingStage3() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const typedQuestion = useTypingAnimation("Which region grew fastest this quarter?", isInView);
  const [showAnswer, setShowAnswer] = useState(false);

  useEffect(() => {
    if (isInView && typedQuestion.length === "Which region grew fastest this quarter?".length) {
      const timer = setTimeout(() => {
        setShowAnswer(true);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [isInView, typedQuestion]);

  return (
    <div ref={ref} className="bg-surface border border-border rounded-2xl overflow-hidden shadow-sm flex flex-col p-5 space-y-4 w-full min-h-[300px] select-none">
      {/* User Prompt Bubble */}
      <div className="flex items-start gap-2.5 flex-row-reverse">
        <div className="h-6 w-6 rounded-full bg-accent text-white flex items-center justify-center text-[10px] font-bold shrink-0 shadow-sm">
          U
        </div>
        <div className="bg-accent text-white rounded-2xl rounded-tr-none px-4 py-2.5 text-xs font-medium max-w-[85%] shadow-sm">
          {typedQuestion}
          {typedQuestion.length < "Which region grew fastest this quarter?".length && (
            <span className="border-r-2 border-white ml-0.5 animate-pulse" />
          )}
        </div>
      </div>

      {/* AI Bot Response Bubble */}
      {showAnswer && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="flex items-start gap-2.5"
        >
          <div className="h-6 w-6 rounded-full bg-surface border border-border text-accent flex items-center justify-center text-[10px] font-bold shrink-0 shadow-sm">
            AI
          </div>
          <div className="bg-background border border-border rounded-2xl rounded-tl-none p-4 space-y-4 flex-1 max-w-[85%] shadow-xs animate-fade-in">
            {/* Visual Recharts inside the Bot bubble */}
            <div className="h-32 w-full text-[8px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={REGIONAL_GROWTH}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis dataKey="region" stroke="var(--text-secondary)" tickLine={false} axisLine={false} />
                  <YAxis stroke="var(--text-secondary)" tickLine={false} axisLine={false} width={25} tickFormatter={(v) => `${v}%`} />
                  <Bar dataKey="growth" fill="var(--accent)" radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <p className="text-xs text-foreground font-normal leading-relaxed border-l-2 border-accent pl-3 italic">
              &quot;The West region led with 68% growth, outpacing all other regions this quarter.&quot;
            </p>
          </div>
        </motion.div>
      )}
    </div>
  );
}

function ScrollytellingStage4() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <div ref={ref} className="bg-surface border border-border p-5 rounded-2xl shadow-sm h-[260px] flex flex-col justify-between w-full">
      <div>
        <span className="text-[9px] font-mono uppercase font-bold text-accent block tracking-wider">Advanced Python Forecast</span>
        <h4 className="text-xs font-bold text-foreground mt-0.5">West Region Trend & Projections</h4>
      </div>
      <div className="h-32 w-full text-[8px] mt-2">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={WEST_TREND_DATA}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
            <XAxis dataKey="month" stroke="var(--text-secondary)" tickLine={false} axisLine={false} />
            <YAxis stroke="var(--text-secondary)" tickLine={false} axisLine={false} width={25} />
            <Tooltip />
            <Line type="monotone" dataKey="actual" name="Actual Sales" stroke="var(--accent)" strokeWidth={2} dot={isInView ? { r: 2 } : false} />
            <Line type="monotone" dataKey="forecast" name="Forecast" stroke="var(--accent)" strokeDasharray="3 3" strokeWidth={1.5} dot={isInView ? { r: 3, stroke: "var(--accent)", fill: "var(--bg)", strokeWidth: 1.5 } : false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <p className="text-[9px] text-muted leading-normal font-normal">
        * Based on serverless Python linear fit. Projected sales for July: <strong className="text-accent">$9,500</strong>, Aug: <strong className="text-accent">$10,600</strong>.
      </p>
    </div>
  );
}

function ScrollytellingStage5() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const [exported, setExported] = useState(false);

  useEffect(() => {
    if (isInView) {
      const timer = setTimeout(() => {
        setExported(true);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [isInView]);

  return (
    <div ref={ref} className="bg-surface border border-border p-6 rounded-2xl shadow-sm flex flex-col items-center justify-center min-h-[220px] w-full">
      <AnimatePresence mode="wait">
        {!exported ? (
          <motion.div
            key="exporting"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center space-y-3"
          >
            <RefreshCw className="h-8 w-8 text-accent animate-spin" />
            <span className="text-xs font-semibold text-foreground">Assembling high-fidelity PDF report...</span>
          </motion.div>
        ) : (
          <motion.div
            key="complete"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center space-y-3"
          >
            <div className="h-10 w-10 rounded-full bg-success/15 border border-success/30 text-success flex items-center justify-center">
              <CheckCircle className="h-5 w-5" />
            </div>
            <span className="text-xs font-bold text-foreground">regional_sales_report.pdf</span>
            <span className="text-[10px] text-muted font-mono bg-background px-2 py-0.5 rounded border border-border">Download complete</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function HomeContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const reactivateId = searchParams ? searchParams.get("reactivate") : null;
  const scrollParam = searchParams ? searchParams.get("scroll") : null;

  const [parsedData, setParsedData] = useState<ParsedResult | null>(null);
  const [originalParsedData, setOriginalParsedData] = useState<ParsedResult | null>(null);
  const [isPlayground, setIsPlayground] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [heroInputFocused, setHeroInputFocused] = useState(false);
  const [heroInputValue, setHeroInputValue] = useState("");
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

  // AI Demo Playground Raw Rows & Loader
  const PLAYGROUND_RAW_ROWS = [
    ["Date", "Region", "Category", "Revenue", "Customer_Feedback"],
    ["2024-01-15", "West", "Software", 15000, "Excellent software solution. The user interface is incredibly fast and clean, and our productivity has soared by 35%!"],
    ["2024-01-20", "North", "Hardware", 8200, "Hardware components are functional, but the setup manual was confusing and delivery was slightly delayed."],
    ["2024-02-10", "West", "Services", 12500, "Strategic migration services were outstanding. Highly professional consulting team delivered exceptional architecture on time!"],
    ["2024-02-18", "East", "Software", 19400, "Outstanding software product. It is super stable, easy to deploy across departments, and has transformed our analytics!"],
    ["2024-03-05", "South", "Consulting", 9500, "Average consulting engagement. Strategic insights were helpful, but some deliverables lacked deep actionable metrics."],
    ["2024-03-12", "West", "Software", 26100, "We love the local-first architecture! Data privacy is fully preserved, and the charts load instantly in milliseconds."],
    ["2024-04-02", "East", "Hardware", 14200, "Solid hardware upgrades. System throughput is improved, though power consumption is slightly higher than expected."],
    ["2024-04-15", "North", "Services", 16500, "The technical support team was incredibly fast, responsive, and resolved our custom API integration issues in minutes!"],
    ["2024-05-01", "West", "Software", 34000, "A premier enterprise experience. This application is beautiful, accessible, and provides deep mathematical insights."],
    ["2024-05-18", "South", "Hardware", 7100, "Poor delivery experience. The shipment box arrived damaged, and customer support was slow to send replacements."],
    ["2024-06-05", "East", "Services", 22000, "Impressive cloud onboarding. The strategic advisors helped us migrate smoothly without any operational downtime."],
    ["2024-06-20", "West", "Consulting", 42300, "Superb advisory services! Ahmad Khan and his team redesigned our core pipeline, delivering unbelievable strategic ROI."],
    ["2024-07-01", "North", "Software", 11000, "Good value software suite. Easy to use, but missing some deep customizable settings for PDF layout exports."],
    ["2024-07-15", "South", "Services", 13400, "Helpful customer success advisors. Very patient and detailed explanations, though response lag was noticeable during peak hours."],
    ["2024-08-01", "East", "Software", 28000, "Absolutely amazing local performance. Parsing and loading huge files is seamless, and SQL queries execute instantly!"]
  ];

  const loadPlaygroundData = () => {
    setError(null);
    setReactivateWarning(null);
    setQueryResults(null);
    setQueryError(null);
    const parsed = parseRawData(PLAYGROUND_RAW_ROWS, "regional_sales_sample.csv", 4800);
    setParsedData(parsed);
    setIsPlayground(true);
    // Scroll automatically to active workspace
    setTimeout(() => {
      const el = document.getElementById("active-workspace");
      if (el) el.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  // Handle URL query parameters for scrolling or actions on mount
  useEffect(() => {
    const actionParam = searchParams ? searchParams.get("action") : null;

    if (scrollParam || actionParam) {
      router.replace("/");

      setTimeout(() => {
        if (scrollParam) {
          const el = document.getElementById(scrollParam);
          if (el) {
            el.scrollIntoView({ behavior: reducedMotion ? "auto" : "smooth" });
          }
        } else if (actionParam) {
          if (actionParam === "ask-ai") {
            const chatInput = document.querySelector("textarea[placeholder*='Ask a question']") as HTMLTextAreaElement;
            if (chatInput) {
              const el = document.getElementById("chat-panel") || chatInput;
              el.scrollIntoView({ behavior: "smooth" });
              chatInput.focus();
            }
          } else if (actionParam === "debug-sql") {
            setIsConsoleCollapsed(false);
            setTimeout(() => {
              const el = document.getElementById("query-console");
              if (el) {
                el.scrollIntoView({ behavior: "smooth" });
                (el as HTMLElement).focus();
              }
            }, 100);
          } else if (actionParam === "advanced-insights") {
            const el = document.getElementById("advanced-insights-section");
            if (el) el.scrollIntoView({ behavior: "smooth" });
          }
        }
      }, 300);
    }
  }, [scrollParam, searchParams, router, reducedMotion]);

  // Listen to Command Palette direct events for homepage
  useEffect(() => {
    const handleFocusChat = () => {
      const chatInput = document.querySelector("textarea[placeholder*='Ask a question']") as HTMLTextAreaElement;
      if (chatInput) {
        const el = document.getElementById("chat-panel") || chatInput;
        el.scrollIntoView({ behavior: "smooth" });
        chatInput.focus();
      }
    };

    const handleOpenSql = () => {
      setIsConsoleCollapsed(false);
      setTimeout(() => {
        const el = document.getElementById("query-console");
        if (el) {
          el.scrollIntoView({ behavior: "smooth" });
          (el as HTMLElement).focus();
        }
      }, 100);
    };

    const handleOpenInsights = () => {
      const el = document.getElementById("advanced-insights-section");
      if (el) el.scrollIntoView({ behavior: "smooth" });
    };

    window.addEventListener("insightloop-focus-chat", handleFocusChat);
    window.addEventListener("insightloop-open-sql", handleOpenSql);
    window.addEventListener("insightloop-open-insights", handleOpenInsights);

    return () => {
      window.removeEventListener("insightloop-focus-chat", handleFocusChat);
      window.removeEventListener("insightloop-open-sql", handleOpenSql);
      window.removeEventListener("insightloop-open-insights", handleOpenInsights);
    };
  }, []);

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

        setOriginalParsedData(null);
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
    setOriginalParsedData(null);
    setIsPlayground(false);
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


  const softwareSchema = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "InsightLoop",
    "description": "Secure, browser-first AI Business Intelligence Dashboard. Upload CSV or Excel files, run local DuckDB-WASM SQL queries, and chat with an AI co-pilot with absolute data privacy.",
    "applicationCategory": "BusinessApplication",
    "operatingSystem": "Web",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "USD"
    },
    "featureList": [
      "Secure Client-Side Spreadsheet Parsing & Storage (PapaParse & SheetJS)",
      "In-Browser DuckDB-WASM Database Engine",
      "Conversational AI Text-to-SQL Co-Pilot (Google Gemini 2.5 Flash)",
      "Advanced Statistical Analysis Layer (Trend Forecasting, Outlier Detection, Correlation Analysis)",
      "High-Fidelity Local PDF Report Generation (jsPDF & html2canvas)",
      "Persistent Layout Syncing with Supabase"
    ]
  };

  return (
    <div className="flex-1 w-full max-w-7xl mx-auto px-6 py-6 space-y-12 relative z-10">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareSchema) }}
      />
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
        <div className="space-y-32 py-8 relative">

          {/* 1. HERO — Question First */}
          <section className="relative pt-12 pb-16 overflow-hidden flex flex-col items-center">
            {/* Background elements */}
            <div className="absolute inset-0 z-0">
              <AuroraBackground />
              <FloatingAIIcons />
            </div>

            <div className="max-w-4xl text-center space-y-8 relative z-10 mb-16 px-4">
              <motion.div
                initial={reducedMotion ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                className="inline-flex items-center space-x-2 bg-accent/10 border border-accent/20 px-3.5 py-1.5 rounded-full text-[10px] font-bold text-accent uppercase tracking-widest"
              >
                <Zap className="h-3 w-3 fill-accent text-accent" />
                <span>Zero-Upload Browser Business Intelligence</span>
              </motion.div>

              <motion.h1
                initial={reducedMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
                className="text-4xl sm:text-5xl md:text-6xl font-sans font-extrabold tracking-tight text-foreground leading-[1.1]"
              >
                Ask your database anything.<br />Get answers instantly.
              </motion.h1>

              {/* REAL feeling, functional input centerpiece */}
              <motion.div
                initial={reducedMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="relative max-w-2xl mx-auto w-full group"
              >
                <div className="relative">
                  <input
                    type="text"
                    value={heroInputValue}
                    onChange={(e) => setHeroInputValue(e.target.value)}
                    onFocus={() => {
                      setHeroInputFocused(true);
                      setTimeout(() => {
                        handleScrollToSection("upload-zone");
                      }, 1800);
                    }}
                    onBlur={() => setHeroInputFocused(false)}
                    placeholder=""
                    className="w-full bg-surface border border-border hover:border-text-secondary/60 focus:border-accent rounded-2xl py-4 pl-5 pr-12 text-sm text-foreground outline-none transition-all focus:ring-2 focus:ring-accent/10 placeholder-muted/30"
                  />
                  {heroInputValue === "" && (
                    <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none text-muted select-none text-sm font-medium">
                      <span className="text-accent font-bold mr-1">&gt;</span>
                      <TypewriterPlaceholder reducedMotion={reducedMotion} />
                      <span className="border-r-2 border-accent ml-0.5 animate-pulse h-4" />
                    </div>
                  )}
                  <button
                    onClick={() => {
                      setHeroInputFocused(true);
                      handleScrollToSection("upload-zone");
                    }}
                    className="absolute right-3 top-2.5 h-9 w-9 bg-accent text-white rounded-xl flex items-center justify-center hover:opacity-90 transition-all shadow-md shadow-accent/15"
                  >
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>

                {/* Smooth dropdown/inline warning alert under input */}
                <AnimatePresence>
                  {heroInputFocused && (
                    <motion.div
                      initial={{ opacity: 0, y: -6, height: 0 }}
                      animate={{ opacity: 1, y: 0, height: "auto" }}
                      exit={{ opacity: 0, y: -6, height: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden mt-3 text-left"
                    >
                      <div className="bg-accent/10 border border-accent/20 p-3 rounded-xl flex items-center space-x-2 text-accent">
                        <AlertCircle className="h-4 w-4 shrink-0" />
                        <span className="text-xs font-semibold">Upload your data first below, then ask anything. Page scrolling...</span>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>

              <motion.p
                initial={reducedMotion ? { opacity: 1 } : { opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.35 }}
                className="text-xs text-muted max-w-md mx-auto"
              >
                An AI-powered local business intelligence sandbox.
              </motion.p>
            </div>

            {/* Split Visual Layout Beneath centerpiece */}
            <div className="w-full max-w-4xl px-4 z-10 grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
              {/* LEFT Pane: Mock Question */}
              <div className="bg-surface/80 border border-border rounded-2xl p-6 flex flex-col justify-between shadow-lg h-60">
                <div className="space-y-3">
                  <span className="text-[10px] font-mono text-accent uppercase font-bold tracking-widest block">Core Mechanism — Ask</span>
                  <div className="flex items-start space-x-2">
                    <span className="text-accent font-bold font-mono mt-0.5">&gt;</span>
                    <span className="text-sm font-extrabold text-foreground leading-normal">
                      What drove Q3 growth?
                    </span>
                  </div>
                </div>
                <div className="border-t border-border/60 pt-3 flex items-center justify-between text-[10px] text-muted font-mono font-bold">
                  <span>INPUT CHANNEL</span>
                  <span>MOCK USER PROMPT</span>
                </div>
              </div>

              {/* RIGHT Pane: Corresponding Output */}
              <div className="bg-surface/80 border border-border rounded-2xl p-6 flex flex-col justify-between shadow-lg h-60 overflow-hidden">
                <div className="h-32 w-full text-[9px] select-none">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={HERO_CHART_DATA} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                      <XAxis dataKey="quarter" stroke="var(--text-secondary)" tickLine={false} axisLine={false} />
                      <YAxis stroke="var(--text-secondary)" tickLine={false} axisLine={false} width={30} />
                      <Bar dataKey="revenue" fill="var(--accent)" radius={[2, 2, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="border-t border-border/60 pt-3 space-y-1.5">
                  <span className="text-[9px] font-mono text-success uppercase font-bold tracking-widest block">OUTPUT RESPONSE — AI Co-pilot</span>
                  <p className="text-[11px] text-foreground font-normal leading-normal">
                    Q3 revenue grew 18% quarter-over-quarter, led by a strong rebound in enterprise accounts.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* 2. SCROLLYTELLING NARRATIVE */}
          <section className="max-w-4xl mx-auto px-4 space-y-24">
            <div className="text-center space-y-3 max-w-xl mx-auto">
              <span className="text-[10px] uppercase font-extrabold text-accent tracking-widest block">SaaS Narrative</span>
              <h2 className="font-sans text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
                How InsightLoop works
              </h2>
              <p className="text-xs sm:text-sm text-muted leading-relaxed">
                Follow one sample Regional Sales Performance dataset continuously across its entire workflow journey in real-time.
              </p>
            </div>

            {/* Timeline Stages */}
            <div className="space-y-32 relative">
              {/* Connected center line */}
              <div className="absolute left-1/2 top-4 bottom-4 w-[2px] bg-border -translate-x-1/2 hidden md:block" />

              {/* Stage 1 */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
                <div className="md:col-span-5 md:text-right space-y-2 order-2 md:order-1">
                  <span className="text-[10px] font-mono text-accent font-bold">STAGE 01</span>
                  <h3 className="text-base font-extrabold text-foreground tracking-tight">A spreadsheet arrives</h3>
                  <p className="text-xs text-muted leading-relaxed font-normal">
                    Drop in any CSV or Excel file. Your browser parses spreadsheet schemas, columns, and data types entirely locally in browser memory.
                  </p>
                </div>
                <div className="md:col-span-2 flex justify-center z-10 order-1 md:order-2">
                  <div className="w-10 h-10 rounded-full border-2 border-border bg-background flex items-center justify-center text-accent font-bold text-xs shadow-sm">
                    1
                  </div>
                </div>
                <div className="md:col-span-5 order-3">
                  <ScrollytellingStage1 />
                </div>
              </div>

              {/* Stage 2 */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
                <div className="md:col-span-5 order-3 md:order-1">
                  <ScrollytellingStage2 />
                </div>
                <div className="md:col-span-2 flex justify-center z-10 order-1 md:order-2">
                  <div className="w-10 h-10 rounded-full border-2 border-border bg-background flex items-center justify-center text-accent font-bold text-xs shadow-sm">
                    2
                  </div>
                </div>
                <div className="md:col-span-5 text-left space-y-2 order-2">
                  <span className="text-[10px] font-mono text-accent font-bold">STAGE 02</span>
                  <h3 className="text-base font-extrabold text-foreground tracking-tight">Instantly organized</h3>
                  <p className="text-xs text-muted leading-relaxed font-normal">
                    InsightLoop automatically builds gorgeous responsive charts, timelines, aggregates, and categories depending on your file&apos;s data shape.
                  </p>
                </div>
              </div>

              {/* Stage 3 */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
                <div className="md:col-span-5 md:text-right space-y-2 order-2 md:order-1">
                  <span className="text-[10px] font-mono text-accent font-bold">STAGE 03</span>
                  <h3 className="text-base font-extrabold text-foreground tracking-tight">Ask it anything</h3>
                  <p className="text-xs text-muted leading-relaxed font-normal">
                    Ask natural questions. The AI Co-pilot writes compliant DuckDB SQL queries, runs them against the browser sandbox, and draws focused results.
                  </p>
                </div>
                <div className="md:col-span-2 flex justify-center z-10 order-1 md:order-2">
                  <div className="w-10 h-10 rounded-full border-2 border-border bg-background flex items-center justify-center text-accent font-bold text-xs shadow-sm">
                    3
                  </div>
                </div>
                <div className="md:col-span-5 order-3">
                  <ScrollytellingStage3 />
                </div>
              </div>

              {/* Stage 4 */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
                <div className="md:col-span-5 order-3 md:order-1">
                  <ScrollytellingStage4 />
                </div>
                <div className="md:col-span-2 flex justify-center z-10 order-1 md:order-2">
                  <div className="w-10 h-10 rounded-full border-2 border-border bg-background flex items-center justify-center text-accent font-bold text-xs shadow-sm">
                    4
                  </div>
                </div>
                <div className="md:col-span-5 text-left space-y-2 order-2">
                  <span className="text-[10px] font-mono text-accent font-bold">STAGE 04</span>
                  <h3 className="text-base font-extrabold text-foreground tracking-tight">Deeper patterns surface</h3>
                  <p className="text-xs text-muted leading-relaxed font-normal">
                    Trigger serverless Python statistics on the fly. Explore linear trend forecasting, IQR outlier models, and correlation matrices in one click.
                  </p>
                </div>
              </div>

              {/* Stage 5 */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
                <div className="md:col-span-5 md:text-right space-y-2 order-2 md:order-1">
                  <span className="text-[10px] font-mono text-accent font-bold">STAGE 05</span>
                  <h3 className="text-base font-extrabold text-foreground tracking-tight">Take it with you</h3>
                  <p className="text-xs text-muted leading-relaxed font-normal">
                    Export high-fidelity, printable multi-page PDF reports. Save layout templates securely for instant recreation later.
                  </p>
                </div>
                <div className="md:col-span-2 flex justify-center z-10 order-1 md:order-2">
                  <div className="w-10 h-10 rounded-full border-2 border-border bg-background flex items-center justify-center text-accent font-bold text-xs shadow-sm">
                    5
                  </div>
                </div>
                <div className="md:col-span-5 order-3">
                  <ScrollytellingStage5 />
                </div>
              </div>

              {/* Stage 6 - Climax / Real Upload Zone */}
              <div id="upload-zone" className="scroll-mt-24 pt-16 border-t border-border/40">
                <div className="text-center space-y-3 mb-8 max-w-xl mx-auto">
                  <span className="text-[10px] uppercase font-extrabold text-accent tracking-widest block">STAGE 06</span>
                  <h2 className="font-sans text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
                    Now try it with your own data
                  </h2>
                  <p className="text-xs sm:text-sm text-muted leading-relaxed">
                    InsightLoop runs 100% locally. No data rows leave your machine. Secure, immediate local analytics sandbox.
                  </p>
                </div>

                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={triggerFileBrowser}
                  className={`w-full min-h-[240px] bg-surface/50 hover:bg-surface border rounded-2xl flex flex-col items-center justify-center p-8 text-center cursor-pointer transition-all duration-300 ease-out relative overflow-hidden group ${
                    isDragging
                      ? "bg-accent/10 border-accent scale-[0.98] shadow-lg shadow-accent/10"
                      : "border-border shadow-sm hover:shadow-md hover:border-accent/30"
                  }`}
                >
                  <div className="absolute top-0 left-0 w-full h-1 bg-accent/40 scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-300" />

                  <div className="h-14 w-14 bg-accent/10 border border-accent/20 rounded-2xl flex items-center justify-center text-accent shadow-sm mb-5 group-hover:scale-110 group-hover:bg-accent/15 group-hover:border-accent/30 transition-all duration-300 ease-out">
                    <Upload className="h-5 w-5" />
                  </div>

                  <div className="space-y-1.5 font-sans">
                    <div className="flex items-center justify-center space-x-1.5 text-sm sm:text-base font-semibold tracking-tight text-foreground">
                      <span>Drag & drop CSV or Excel spreadsheet here</span>
                    </div>
                    <p className="text-xs sm:text-sm text-muted">
                      or <span className="text-accent font-semibold underline underline-offset-4 decoration-accent/30 hover:decoration-accent transition-all">browse your system directory</span>
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center justify-center gap-2 mt-6">
                    <span className="px-2.5 py-1 text-[10px] font-bold tracking-wider rounded-full border border-border bg-surface-subtle/50 text-muted/80 shadow-2xs font-mono">CSV</span>
                    <span className="px-2.5 py-1 text-[10px] font-bold tracking-wider rounded-full border border-border bg-surface-subtle/50 text-muted/80 shadow-2xs font-mono">XLSX</span>
                    <span className="px-2.5 py-1 text-[10px] font-bold tracking-wider rounded-full border border-border bg-surface-subtle/50 text-muted/80 shadow-2xs font-mono">XLS</span>
                    <span className="px-2.5 py-1 text-[10px] font-bold tracking-wider rounded-full border border-accent/20 bg-accent/5 text-accent shadow-2xs font-mono">MAX 5MB</span>
                  </div>

                  <div className="mt-6 pt-4 border-t border-border/50 w-full">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        loadPlaygroundData();
                      }}
                      className="inline-flex items-center space-x-1.5 px-4 py-2 bg-accent/10 border border-accent/20 hover:border-accent/40 rounded-xl text-xs text-accent font-bold transition-all hover:bg-accent/15"
                      title="Launch the Sandbox Playground with Sample Regional Sales Data"
                    >
                      <Sparkles className="h-3.5 w-3.5 text-accent animate-pulse" />
                      <span>Or, launch the Interactive AI Demo Playground with sample data</span>
                    </button>
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
              </div>

            </div>
          </section>

          {/* Pricing commitments & badges section */}
          <section id="commitments" className="scroll-mt-24 max-w-2xl mx-auto px-4 pt-12">
            <div className="bg-slate-50/80 dark:bg-slate-900/30 border border-accent/20 dark:border-accent/30 rounded-2xl p-8 sm:p-10 shadow-xl shadow-accent/5 hover:shadow-accent/10 hover:border-accent/40 transition-all text-center space-y-6 relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-full h-1 bg-accent scale-x-0 group-hover:scale-x-100 transition-transform origin-center duration-500" />

              <div className="absolute inset-0 flex items-center justify-center select-none pointer-events-none z-0 overflow-hidden">
                <span className="text-accent opacity-[0.05] dark:opacity-[0.06] font-bold text-xl sm:text-3xl max-w-md uppercase tracking-wide text-center px-4 leading-tight font-sans">
                  No cost. No lock-in. Your data never leaves your browser.
                </span>
              </div>

              <div className="space-y-2 relative z-10">
                <span className="text-[10px] uppercase font-extrabold text-accent tracking-widest block font-mono">PLATFORM COMMITMENT</span>
                <h3 className="font-sans text-xl sm:text-2xl font-extrabold text-foreground tracking-tight">
                  Free & Open-Source BI
                </h3>
                <p className="text-xs text-muted max-w-md mx-auto leading-relaxed font-normal">
                  No subscriptions. No account creations. No tracking cookies. InsightLoop is entirely free to run on any computer.
                </p>
              </div>

              <div className="border-t border-b border-border/60 py-5 space-y-3.5 max-w-xs mx-auto text-left text-xs text-muted font-normal relative z-10">
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

              <div className="relative z-10">
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

        </div>
      )}      {/* Active Workspace Header Bar (when file is successfully parsed) */}
      {parsedData && (
        <div id="active-workspace" className="scroll-mt-24 space-y-6">
          {/* Playground Banner */}
          {isPlayground && (
            <div className="bg-accent/10 border border-accent/20 p-4 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm animate-fade-in">
              <div className="flex items-center space-x-2.5">
                <Sparkles className="h-4 w-4 text-accent animate-pulse flex-shrink-0" />
                <span className="text-xs text-foreground font-medium">
                  You are currently exploring the <strong>AI Demo Playground</strong> with sample regional sales data.
                </span>
              </div>
              <button
                onClick={handleClear}
                className="text-xs bg-accent hover:opacity-90 text-white font-semibold px-3 py-1.5 rounded-lg transition-all"
              >
                Upload Your Own File
              </button>
            </div>
          )}

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-6 pt-6">
            <div>
              <div className="flex items-center space-x-3">
                <h1 className="text-2xl font-sans font-bold tracking-tight text-foreground">
                  Interactive Workspace
                </h1>
                <button
                  onClick={() => window.dispatchEvent(new CustomEvent("insightloop-restart-tour"))}
                  className="p-1 border border-border bg-surface hover:bg-surface-subtle text-muted hover:text-foreground rounded-lg transition-colors focus-visible:ring-2 focus-visible:ring-accent"
                  title="Restart Guided Product Onboarding Tour"
                  aria-label="Restart Guided Product Tour"
                >
                  <HelpCircle className="h-4 w-4 text-accent" />
                </button>
              </div>
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

            <ProductTour />

            <Dashboard
              parsedData={parsedData}
              datasetLoaded={datasetLoaded}
              runQuery={runQuery}
              onDashboardLoaded={handleDashboardLoaded}
              dashboardId={dashboardId}
              setDashboardId={setDashboardId}
              originalParsedData={originalParsedData}
              onOriginalParsedDataChange={setOriginalParsedData}
              onParsedDataChange={setParsedData}
              isPlayground={isPlayground}
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
