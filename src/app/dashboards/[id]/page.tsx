"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  TrendingUp,
  BarChart3,
  Hash,
  AlertCircle,
  ArrowLeft,
  UploadCloud,
  CheckCircle2,
  Lock,
  Globe,
  Share2,
  RefreshCw
} from "lucide-react";
import { getOrCreateSessionId } from "@/utils/session";
import { supabase } from "@/utils/supabaseClient";
import { formatRelativeDate } from "@/utils/formatter";
import { useDuckDB } from "@/context/DuckDBContext";
import Dashboard, { WidgetConfig } from "@/components/Dashboard";
import ChatPanel, { ChatMessage } from "@/components/ChatPanel";
import { ParsedResult, ColumnSchema } from "@/utils/parser";
import Link from "next/link";

interface DashboardDetail {
  id: string;
  session_id: string;
  title: string | null;
  layout_config: WidgetConfig[];
  dataset_summary: {
    totalRows: number;
    schema: ColumnSchema[];
  } | ColumnSchema[];
  created_at: string;
}

export default function DashboardDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const { datasetLoaded, runQuery } = useDuckDB();

  // Dashboard Row & Chat History state
  const [dashboard, setDashboard] = useState<DashboardDetail | null>(null);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Ownership & Reactivation State
  const [isOwner, setIsOwner] = useState(false);
  const [isReactivated, setIsReactivated] = useState(false);
  const [reactivatedParsedData, setReactivatedParsedData] = useState<ParsedResult | null>(null);
  const [shareCopied, setShareCopied] = useState(false);

  useEffect(() => {
    if (!id) return;

    const loadDashboardData = async () => {
      setLoading(true);
      setError(null);
      try {
        const browserSessionId = getOrCreateSessionId();

        // 1. Fetch Dashboard Row
        const { data: dashData, error: dashErr } = await supabase
          .from("dashboards")
          .select("*")
          .eq("id", id)
          .single();

        if (dashErr) {
          throw new Error(dashErr.message);
        }

        if (!dashData) {
          throw new Error("Dashboard not found.");
        }

        const resolvedDashboard: DashboardDetail = {
          ...dashData,
          layout_config: Array.isArray(dashData.layout_config) ? dashData.layout_config : [],
        };

        setDashboard(resolvedDashboard);

        // Determine ownership
        const ownerStatus = resolvedDashboard.session_id === browserSessionId;
        setIsOwner(ownerStatus);

        // 2. Fetch Chat History
        const { data: chatData, error: chatErr } = await supabase
          .from("chat_history")
          .select("*")
          .eq("dashboard_id", id)
          .order("created_at", { ascending: true });

        if (chatErr) {
          console.error("Error fetching chat history:", chatErr);
        } else {
          const mappedMessages: ChatMessage[] = (chatData || []).map((msg: unknown) => {
            const m = msg as { id: string; role: string; content: string };
            return {
              id: m.id,
              role: m.role as "user" | "assistant",
              content: m.content,
              synced: true,
            };
          });
          setChatHistory(mappedMessages);
        }

        // 3. Check Reactivation status
        // If DuckDB is active and sessionStorage contains reactivation payload for this dashboard ID
        const storedPayloadStr = sessionStorage.getItem(`insightloop_reactivated_parsed_data_${id}`);
        if (datasetLoaded && storedPayloadStr) {
          try {
            const parsedPayload = JSON.parse(storedPayloadStr) as ParsedResult;
            setReactivatedParsedData(parsedPayload);
            setIsReactivated(true);
          } catch (payloadErr) {
            console.error("Failed to parse reactivated parsed data from storage:", payloadErr);
            setIsReactivated(false);
          }
        } else {
          setIsReactivated(false);
        }

      } catch (err: unknown) {
        console.error("Error loading dashboard details:", err);
        setError((err as Error)?.message || "Failed to retrieve dashboard details.");
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, [id, datasetLoaded]);

  const handleCopyLink = () => {
    if (typeof window === "undefined") return;
    navigator.clipboard.writeText(window.location.href);
    setShareCopied(true);
    setTimeout(() => setShareCopied(false), 3000);
  };

  const handleReuploadRedirect = () => {
    router.push(`/?reactivate=${id}`);
  };

  // Helper to extract schema and rows stats with compatibility check
  const getStats = (summary: unknown) => {
    if (!summary) {
      return { columnsCount: 0, rowsCount: 0, schemaList: [] as ColumnSchema[] };
    }

    if (typeof summary === "object" && !Array.isArray(summary) && "schema" in summary) {
      const summaryObj = summary as { totalRows?: number; schema?: unknown[] };
      const schemaList = Array.isArray(summaryObj.schema) ? (summaryObj.schema as ColumnSchema[]) : [];
      const totalRows = typeof summaryObj.totalRows === "number" ? summaryObj.totalRows : 0;
      return { columnsCount: schemaList.length, rowsCount: totalRows, schemaList };
    }

    if (Array.isArray(summary)) {
      const schemaList = summary as ColumnSchema[];
      const columnsCount = schemaList.length;
      let rowsCount = 0;
      schemaList.forEach((col) => {
        if (col && typeof col.totalCount === "number" && col.totalCount > rowsCount) {
          rowsCount = col.totalCount;
        }
      });
      return { columnsCount, rowsCount, schemaList };
    }

    return { columnsCount: 0, rowsCount: 0, schemaList: [] as ColumnSchema[] };
  };

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center space-y-4 py-20">
        <RefreshCw className="h-8 w-8 text-accent animate-spin" />
        <span className="text-sm text-gray-400 font-medium">Loading dashboard and security states...</span>
      </div>
    );
  }

  if (error || !dashboard) {
    return (
      <div className="flex-1 w-full max-w-2xl mx-auto px-4 py-20 text-center space-y-6">
        <div className="h-14 w-14 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-500 flex items-center justify-center mx-auto">
          <AlertCircle className="h-7 w-7" />
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-bold text-white">Dashboard Unavailable</h2>
          <p className="text-sm text-gray-400 max-w-md mx-auto leading-relaxed">
            {error || "The requested dashboard does not exist or has been deleted."}
          </p>
        </div>
        <div className="pt-2">
          <Link
            href="/dashboards"
            className="inline-flex items-center space-x-2 px-5 py-2.5 bg-gray-900 hover:bg-gray-800 text-white rounded-lg text-xs font-bold transition border border-gray-800"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to My Dashboards</span>
          </Link>
        </div>
      </div>
    );
  }

  const { columnsCount, rowsCount, schemaList } = getStats(dashboard.dataset_summary);

  return (
    <div className="flex-1 w-full max-w-7xl mx-auto px-4 py-8 space-y-8">
      {/* Navigation & Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-800 pb-6">
        <div className="space-y-2">
          <Link
            href="/dashboards"
            className="inline-flex items-center space-x-1.5 text-xs font-semibold text-gray-400 hover:text-white transition group"
          >
            <ArrowLeft className="h-3.5 w-3.5 group-hover:-translate-x-0.5 transition-transform" />
            <span>Back to Saved Dashboards</span>
          </Link>

          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-extrabold tracking-tight text-white">
              {dashboard.title || "Untitled Dashboard"}
            </h1>
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-gray-900 border border-gray-800 text-[10px] font-semibold tracking-wide uppercase">
              {isOwner ? (
                <>
                  <Lock className="h-3 w-3 text-blue-400" />
                  <span className="text-blue-400">Owner View</span>
                </>
              ) : (
                <>
                  <Globe className="h-3 w-3 text-amber-400" />
                  <span className="text-amber-400">Shared/Guest Mode</span>
                </>
              )}
            </div>
          </div>

          <p className="text-xs text-gray-500 font-medium">
            Originally created {formatRelativeDate(dashboard.created_at)} • {columnsCount} columns, {rowsCount.toLocaleString()} rows
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleCopyLink}
            className="flex items-center space-x-2 px-4 py-2 bg-gray-900 hover:bg-gray-800 text-gray-300 hover:text-white border border-gray-850 rounded-lg text-xs font-bold transition"
          >
            {shareCopied ? (
              <>
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                <span className="text-emerald-400">Link Copied!</span>
              </>
            ) : (
              <>
                <Share2 className="h-4 w-4" />
                <span>Share Dashboard</span>
              </>
            )}
          </button>

          {!isReactivated && (
            <button
              onClick={handleReuploadRedirect}
              className="flex items-center space-x-2 px-4 py-2 bg-accent hover:bg-blue-600 text-white rounded-lg text-xs font-bold transition shadow-lg shadow-accent/15"
            >
              <UploadCloud className="h-4 w-4" />
              <span>Re-upload File to Reactivate</span>
            </button>
          )}
        </div>
      </div>

      {/* REACTIVATION STATUS BANNER */}
      {!isReactivated && (
        <div className="bg-amber-950/20 border border-amber-900/30 p-5 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 animate-fade-in">
          <div className="flex items-start space-x-3.5 pr-4">
            <div className="h-10 w-10 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-center justify-center text-amber-400 flex-shrink-0">
              <Lock className="h-5 w-5" />
            </div>
            <div className="space-y-1">
              <h4 className="text-sm font-bold text-white">This dashboard&apos;s data isn&apos;t stored for privacy.</h4>
              <p className="text-xs text-gray-400 leading-relaxed">
                In line with our absolute client-side privacy design, the raw spreadsheet data is never persisted on our servers. To reactivate live chart rendering and analytical AI chatting, simply re-upload the original file.
              </p>
            </div>
          </div>

          <button
            onClick={handleReuploadRedirect}
            className="w-full md:w-auto flex-shrink-0 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-black font-bold rounded-lg text-xs transition"
          >
            Re-upload original file
          </button>
        </div>
      )}

      {/* LIVE vs READ-ONLY DASHBOARD WORKSPACE */}
      {isReactivated && reactivatedParsedData ? (
        <div className="space-y-8 animate-fade-in">
          {/* Active Live Indicator */}
          <div className="bg-emerald-950/25 border border-emerald-900/30 p-4 rounded-xl flex items-center space-x-3 text-emerald-400">
            <CheckCircle2 className="h-5 w-5 flex-shrink-0" />
            <span className="text-xs font-bold leading-none">
              Dashboard fully reactivated with live database! Widgets are running real-time DuckDB queries against &apos;{reactivatedParsedData.fileName}&apos;.
            </span>
          </div>

          {/* Interactive Live Dashboard */}
          <div className="space-y-4">
            <Dashboard
              parsedData={reactivatedParsedData}
              datasetLoaded={true}
              runQuery={runQuery}
              dashboardId={isOwner ? id : null} // Guest mode resets id so updates trigger copy-creation
              setDashboardId={(newId) => {
                // If a guest edits/saves, they get a new dashboard ID returned from clone action
                if (newId && newId !== id) {
                  router.push(`/dashboards/${newId}`);
                }
              }}
            />
          </div>

          {/* Live AI Copilot Chat */}
          <div className="pt-4 border-t border-gray-800/60">
            <ChatPanel
              datasetLoaded={true}
              schema={reactivatedParsedData.schema}
              runQuery={runQuery}
              dashboardId={isOwner ? id : null} // Owner syncs, Guest is local-only
              initialMessages={chatHistory}
              isReadOnly={!isOwner}
            />
          </div>
        </div>
      ) : (
        /* READ-ONLY STATICS WORKSPACE */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Widgets Layout Description */}
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center space-x-2">
              <LayoutDashboard className="h-4.5 w-4.5 text-accent" />
              <span className="text-sm font-bold text-white uppercase tracking-wider">Saved Layout Configuration</span>
            </div>

            {dashboard.layout_config.length === 0 ? (
              <div className="text-center py-12 bg-[#111827] border border-gray-850 rounded-xl text-gray-500 italic text-xs">
                No custom widgets configured for this layout.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {dashboard.layout_config.map((widget) => {
                  const isKpi = widget.type === "kpi";
                  const cardColSpan = isKpi ? "col-span-1" : "col-span-1 sm:col-span-2";

                  return (
                    <div
                      key={widget.id}
                      className={`${cardColSpan} bg-[#111827]/60 border border-gray-850 p-5 rounded-xl flex flex-col justify-between h-44 relative`}
                    >
                      <div className="flex items-center justify-between border-b border-gray-850 pb-2.5">
                        <div className="flex items-center space-x-2 text-gray-400">
                          {widget.type === "line" && <TrendingUp className="h-4 w-4 text-[#3b82f6]/60" />}
                          {widget.type === "bar" && <BarChart3 className="h-4 w-4 text-[#10b981]/60" />}
                          {widget.type === "kpi" && <Hash className="h-4 w-4 text-blue-400/60" />}
                          <span className="text-xs font-bold text-gray-300 truncate max-w-[150px]" title={widget.title}>
                            {widget.title}
                          </span>
                        </div>
                        <span className="text-[9px] bg-gray-950 px-1.5 py-0.5 border border-gray-850 rounded text-gray-500 uppercase tracking-wider font-bold">
                          {widget.type}
                        </span>
                      </div>

                      <div className="flex-1 flex flex-col justify-center items-center text-center p-3 text-gray-500 text-xs italic">
                        Awaiting original spreadsheet upload to load dataset...
                      </div>

                      <div className="border-t border-gray-850/40 pt-2 text-[10px] text-gray-500 font-mono overflow-x-auto whitespace-nowrap scrollbar-none">
                        SQL: {widget.sql.slice(0, 50)}...
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Historical Chat Panel */}
          <div className="space-y-6">
            <div className="flex items-center space-x-2">
              <Share2 className="h-4.5 w-4.5 text-accent" />
              <span className="text-sm font-bold text-white uppercase tracking-wider">Historical Conversations</span>
            </div>

            <ChatPanel
              datasetLoaded={false}
              schema={schemaList}
              runQuery={async () => ({ error: "Data is not reactivated yet." })}
              dashboardId={null}
              initialMessages={chatHistory}
              isReadOnly={true}
            />
          </div>
        </div>
      )}
    </div>
  );
}
