"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Sparkles,
  Send,
  Trash2,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  AlertCircle,
  CornerDownLeft,
  Bot,
  User,
  ChartBar,
  Cloud,
  CloudOff,
  HelpCircle,
  X
} from "lucide-react";
import { ColumnSchema } from "@/utils/parser";
import { formatNumber } from "@/utils/formatter";
import { supabase } from "@/utils/supabaseClient";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip
} from "recharts";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  sql?: string;
  results?: Record<string, unknown>[];
  chartData?: {
    data: Record<string, unknown>[];
    xAxisKey: string;
    yAxisKey: string;
  };
  error?: string;
  synced?: boolean;
}

interface ChatPanelProps {
  datasetLoaded: boolean;
  schema: ColumnSchema[];
  runQuery: (sql: string) => Promise<Record<string, unknown>[] | { error: string }>;
  dashboardId: string | null;
  initialMessages?: ChatMessage[];
  isReadOnly?: boolean;
}

export default function ChatPanel({
  datasetLoaded,
  schema,
  runQuery,
  dashboardId,
  initialMessages = [],
  isReadOnly = false
}: ChatPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [expandedSqlIds, setExpandedSqlIds] = useState<Record<string, boolean>>({});
  const [showHelp, setShowHelp] = useState(false);

  // Update messages state when initialMessages loads
  useEffect(() => {
    if (initialMessages && initialMessages.length > 0) {
      setMessages(initialMessages);
    }
  }, [initialMessages]);

  // Phase 7: Tracking background syncing states to Supabase
  const [isSyncingHistory, setIsSyncingHistory] = useState(false);
  const [failedSyncIds, setFailedSyncIds] = useState<string[]>([]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto scroll to latest message when loading or messages list changes
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  // Expand / collapse SQL query display
  const toggleSql = (id: string) => {
    setExpandedSqlIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Clear Chat history (Local-only, per guidelines)
  const handleClearChat = () => {
    setMessages([]);
    setExpandedSqlIds({});
    setFailedSyncIds([]);
  };

  // Phase 7 Centralized Sync effect
  useEffect(() => {
    if (!dashboardId || isSyncingHistory || isReadOnly) return;

    // Find all unsynced messages that haven't failed syncing already
    const unsynced = messages.filter((m) => !m.synced && !failedSyncIds.includes(m.id));
    if (unsynced.length === 0) return;

    const doSync = async () => {
      setIsSyncingHistory(true);
      const syncedIds: string[] = [];
      const newFailedIds: string[] = [];

      // Save unsynced messages in physical/chronological order
      for (const msg of unsynced) {
        try {
          const { error } = await supabase
            .from("chat_history")
            .insert({
              dashboard_id: dashboardId,
              role: msg.role,
              content: msg.content,
            });

          if (error) {
            console.error("Failed to save chat message to Supabase:", error);
            newFailedIds.push(msg.id);
          } else {
            syncedIds.push(msg.id);
          }
        } catch (err) {
          console.error("Error saving chat message to Supabase:", err);
          newFailedIds.push(msg.id);
        }
      }

      if (syncedIds.length > 0) {
        setMessages((prev) =>
          prev.map((m) => (syncedIds.includes(m.id) ? { ...m, synced: true } : m))
        );
      }
      if (newFailedIds.length > 0) {
        setFailedSyncIds((prev) => [...prev, ...newFailedIds]);
      }
      setIsSyncingHistory(false);
    };

    doSync();
  }, [dashboardId, messages, isSyncingHistory, failedSyncIds, isReadOnly]);

  // Helper to determine if results can be charted (exactly two columns, one of which is numeric)
  const detectChartableData = (rows: Record<string, unknown>[]): ChatMessage["chartData"] | undefined => {
    if (!rows || rows.length < 2 || rows.length > 50) return undefined;
    const keys = Object.keys(rows[0]);
    if (keys.length !== 2) return undefined;

    // Find if we have at least one numeric column and one category/text/date column
    let numKey = "";
    let catKey = "";

    for (const key of keys) {
      const allNumbers = rows.every((row) => {
        const val = row[key];
        return val === null || val === undefined || typeof val === "number" || !isNaN(Number(val));
      });

      if (allNumbers) {
        numKey = key;
      } else {
        catKey = key;
      }
    }

    // If we have one category and one numeric, let's treat it as chartable!
    if (numKey && catKey) {
      // Safely convert values
      const data = rows.map((row) => ({
        [catKey]: row[catKey] === null || row[catKey] === undefined ? "null" : String(row[catKey]),
        [numKey]: row[numKey] === null || row[numKey] === undefined ? 0 : Number(row[numKey]),
      }));

      return {
        data,
        xAxisKey: catKey,
        yAxisKey: numKey,
      };
    }

    // fallback: if both are numbers, pick the first as category and second as metric
    if (numKey && !catKey && keys.length === 2) {
      const data = rows.map((row) => ({
        [keys[0]]: String(row[keys[0]]),
        [keys[1]]: Number(row[keys[1]] ?? 0),
      }));
      return {
        data,
        xAxisKey: keys[0],
        yAxisKey: keys[1],
      };
    }

    return undefined;
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputValue.trim() || !datasetLoaded || isLoading) return;

    const userQuestion = inputValue.trim();
    setInputValue("");
    setIsLoading(true);

    const userMsgId = `msg_${Date.now()}_user`;
    const aiMsgId = `msg_${Date.now()}_ai`;

    // 1. Append User Message
    setMessages((prev) => [
      ...prev,
      { id: userMsgId, role: "user", content: userQuestion, synced: false },
    ]);

    let generatedSql = "";
    let queryResults: Record<string, unknown>[] | { error: string } | null = null;
    let finalExplanation = "";

    try {
      // 2. Step 1: Request SQL from server API Route
      const askRes = await fetch("/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: userQuestion, schema }),
      });

      if (!askRes.ok) {
        const errJson = await askRes.json();
        throw new Error((errJson as { error: string }).error || "Failed to generate SQL query.");
      }

      const askData = (await askRes.json()) as { sql: string };
      generatedSql = askData.sql;

      // 3. Step 2: Run Generated Query client-side via DuckDB engine
      queryResults = await runQuery(generatedSql);

      // 4. Retry ONCE if query execution fails
      if (queryResults && "error" in queryResults) {
        const priorError = queryResults.error;
        console.warn("SQL run failed, attempting single auto-retry. Error:", priorError);

        const retryRes = await fetch("/api/ask", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            question: userQuestion,
            schema,
            previousSql: generatedSql,
            errorMsg: priorError,
          }),
        });

        if (retryRes.ok) {
          const retryData = (await retryRes.json()) as { sql: string };
          generatedSql = retryData.sql;
          queryResults = await runQuery(generatedSql);
        }
      }

      // Check if second attempt also failed or general error persists
      if (!queryResults || "error" in queryResults) {
        throw new Error("I couldn't answer that question about your data — try rephrasing it.");
      }

      // 5. Step 3: Send results and query back to get the explanation
      const explainRes = await fetch("/api/explain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: userQuestion,
          sql: generatedSql,
          results: queryResults,
        }),
      });

      if (!explainRes.ok) {
        const errJson = await explainRes.json();
        throw new Error((errJson as { error: string }).error || "Failed to explain execution results.");
      }

      const explainData = (await explainRes.json()) as { explanation: string };
      finalExplanation = explainData.explanation;

      // Detect if chart can be rendered
      const chartData = detectChartableData(queryResults);

      // Append Success message
      setMessages((prev) => [
        ...prev,
        {
          id: aiMsgId,
          role: "assistant",
          content: finalExplanation,
          sql: generatedSql,
          results: queryResults as Record<string, unknown>[],
          chartData,
          synced: false,
        },
      ]);
    } catch (err: unknown) {
      console.error("Chat message generation failed:", err);
      const errMsg = err instanceof Error ? err.message : "An unexpected error occurred while communicating with the server.";
      setMessages((prev) => [
        ...prev,
        {
          id: aiMsgId,
          role: "assistant",
          content: errMsg,
          sql: generatedSql || undefined,
          error: errMsg,
          synced: false,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  // Sync Status Indicator Helper Component
  const renderSyncIndicator = () => {
    if (messages.length === 0) return null;

    if (isReadOnly) {
      return (
        <div
          className="flex items-center space-x-1.5 px-3 py-1.5 bg-background border border-surface-light rounded-xl text-[10px] font-bold text-warning"
          title="Shared View — Conversation is local-only"
        >
          <CloudOff className="h-3.5 w-3.5 text-warning" />
          <span className="hidden sm:inline">Guest Mode (Local-Only)</span>
        </div>
      );
    }

    if (isSyncingHistory) {
      return (
        <div
          className="flex items-center space-x-1.5 px-3 py-1.5 bg-background border border-surface-light rounded-xl text-[10px] font-bold text-accent-light"
          title="Syncing conversation to cloud..."
        >
          <RefreshCw className="h-3.5 w-3.5 animate-spin text-accent-light" />
          <span className="hidden sm:inline">Syncing...</span>
        </div>
      );
    }

    const hasUnsynced = !dashboardId || messages.some((m) => !m.synced && !failedSyncIds.includes(m.id));

    if (hasUnsynced) {
      return (
        <div
          className="flex items-center space-x-1.5 px-3 py-1.5 bg-background border border-surface-light rounded-xl text-[10px] font-bold text-muted"
          title="Local-only (saves with dashboard)"
        >
          <CloudOff className="h-3.5 w-3.5 text-muted" />
          <span className="hidden sm:inline">Local-only</span>
        </div>
      );
    }

    return (
      <div
        className="flex items-center space-x-1.5 px-3 py-1.5 bg-background border border-surface-light rounded-xl text-[10px] font-bold text-success"
        title="Synced to cloud"
      >
        <Cloud className="h-3.5 w-3.5 text-success" />
        <span className="hidden sm:inline">Synced</span>
      </div>
    );
  };

  return (
    <div className="bg-surface border border-surface-light rounded-2xl overflow-hidden flex flex-col shadow-xl font-sans">
      {/* Header bar */}
      <div className="px-6 py-4 border-b border-surface-light flex items-center justify-between bg-surface/50">
        <div className="flex items-center space-x-2.5 pr-4 truncate">
          <div className="bg-accent/10 p-2 rounded-xl border border-accent/20 flex-shrink-0 shadow-glow-accent">
            <Sparkles className="h-4 w-4 text-accent-light" />
          </div>
          <div className="truncate">
            <h3 className="font-display text-sm font-extrabold text-white uppercase tracking-wider">AI Text-to-SQL Co-Pilot</h3>
            <p className="text-[10px] text-muted font-bold truncate">Ask questions about your loaded spreadsheet using conversational language.</p>
          </div>
        </div>

        <div className="flex items-center space-x-2 flex-shrink-0">
          {renderSyncIndicator()}
          {messages.length > 0 && (
            <button
              onClick={handleClearChat}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-background hover:bg-surface-light text-muted hover:text-white border border-surface-light rounded-xl text-xs font-bold transition-all duration-300 focus-visible:ring-2 focus-visible:ring-secondary focus-visible:outline-none"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>Clear Session</span>
            </button>
          )}
          {/* Help/Info Toggle Button */}
          <button
            onClick={() => setShowHelp(!showHelp)}
            className={`p-1.5 border rounded-xl transition-all duration-300 focus-visible:ring-2 focus-visible:ring-secondary focus-visible:outline-none ${
              showHelp
                ? "bg-secondary/20 border-secondary-light/40 text-white shadow-glow-secondary"
                : "bg-background hover:bg-surface-light border-surface-light text-muted hover:text-white"
            }`}
            title="How the AI Co-Pilot works"
          >
            <HelpCircle className="h-4 w-4" />
          </button>
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1.5 bg-background hover:bg-surface-light border border-surface-light text-muted hover:text-white rounded-xl transition-all duration-300 focus-visible:ring-2 focus-visible:ring-secondary focus-visible:outline-none"
          >
            {isCollapsed ? <ChevronDown className="h-4 w-4 text-white" /> : <ChevronUp className="h-4 w-4 text-white" />}
          </button>
        </div>
      </div>

      {!isCollapsed && (
        <div className="flex flex-col h-[500px]">
          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-background/10 select-text">
            {/* Collapsible Technology/Help Info Card */}
            {showHelp && (
              <div className="bg-surface-light/35 border border-surface-light p-4 rounded-xl space-y-2.5 animate-fade-in relative shadow-glow-accent mb-4">
                <button
                  onClick={() => setShowHelp(false)}
                  className="absolute top-3.5 right-3.5 text-muted hover:text-white transition rounded p-0.5"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
                <div className="flex items-center space-x-2 text-secondary-light">
                  <Sparkles className="h-4.5 w-4.5 animate-pulse" />
                  <span className="font-display text-xs font-extrabold uppercase tracking-wider">AI Co-Pilot Technology Explained</span>
                </div>
                <p className="text-[11px] text-muted leading-relaxed font-semibold">
                  This interface allows you to query your data using natural language. Here is how your privacy and analysis are structured:
                </p>
                <ol className="list-decimal pl-4 text-[10.5px] text-muted/90 space-y-1 font-semibold">
                  <li><strong className="text-white">Natural Language Translation:</strong> Your question is sent securely to <strong className="text-white">Gemini 2.5 AI</strong> along with only your dataset&apos;s schema metadata (column names and types). Your raw data rows are <strong className="text-white">never</strong> shared with any AI APIs, preserving absolute client-side privacy.</li>
                  <li><strong className="text-white">SQL Generation & Local Execution:</strong> Gemini converts your question into a single safe SQL SELECT query. This query is executed locally inside your browser using the high-performance <strong className="text-white">DuckDB-WASM</strong> database engine.</li>
                  <li><strong className="text-white">Conversational Explanation & Charts:</strong> The locally retrieved query results are summarized in clean English, and an interactive Recharts chart is dynamically rendered if the returned columns match a chartable schema.</li>
                </ol>
              </div>
            )}
            {!datasetLoaded ? (
              <div className="flex flex-col items-center justify-center h-full text-center space-y-3">
                <AlertCircle className="h-8 w-8 text-muted/30" />
                <p className="text-xs text-muted max-w-sm font-semibold leading-relaxed">
                  Please upload a spreadsheet first to activate the AI Co-Pilot query console.
                </p>
              </div>
            ) : messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
                <Bot className="h-10 w-10 text-secondary-light animate-pulse" />
                <div className="space-y-1">
                  <p className="font-display text-sm font-bold text-white uppercase tracking-wider">Ask anything about your data!</p>
                  <p className="text-xs text-muted max-w-xs mx-auto font-medium">
                    Try asking &quot;what is our total sales value?&quot; or &quot;which product category is most active?&quot;
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {messages.map((msg) => {
                  const isAi = msg.role === "assistant";
                  const isExpanded = expandedSqlIds[msg.id];

                  return (
                    <div
                      key={msg.id}
                      className={`flex items-start gap-3.5 ${isAi ? "" : "flex-row-reverse"}`}
                    >
                      {/* Avatar */}
                      <div
                        className={`h-8 w-8 rounded-xl flex items-center justify-center flex-shrink-0 border ${
                          isAi
                            ? "bg-accent/10 border-accent/20 text-accent-light shadow-glow-accent"
                            : "bg-success/10 border-success/20 text-success shadow-glow-secondary"
                        }`}
                      >
                        {isAi ? <Bot className="h-4.5 w-4.5" /> : <User className="h-4.5 w-4.5" />}
                      </div>

                      {/* Content bubble */}
                      <div className="flex flex-col space-y-2 max-w-[85%]">
                        <div
                          className={`rounded-2xl px-4 py-3 text-xs leading-relaxed ${
                            isAi
                              ? "bg-surface-light/40 border border-surface-light/60 text-foreground"
                              : "bg-accent text-white font-semibold shadow-glow-accent"
                          }`}
                        >
                          <p className="whitespace-pre-wrap">{msg.content}</p>

                          {/* Render Inline Recharts Chart if available */}
                          {isAi && msg.chartData && (
                            <div className="mt-4 pt-3.5 border-t border-surface-light space-y-2">
                              <div className="flex items-center space-x-1.5 text-secondary-light font-extrabold text-[10px] uppercase tracking-wide">
                                <ChartBar className="h-3.5 w-3.5" />
                                <span>Suggested Visualization</span>
                              </div>
                              <div className="h-44 w-full text-[9px] bg-background/50 border border-surface-light p-2.5 rounded-xl">
                                <ResponsiveContainer width="100%" height="100%">
                                  <BarChart data={msg.chartData.data}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#121b2e" vertical={false} />
                                    <XAxis
                                      dataKey={msg.chartData.xAxisKey}
                                      stroke="#94a3b8"
                                      tickLine={false}
                                      tickFormatter={(v) => (String(v).length > 10 ? `${String(v).slice(0, 8)}...` : String(v))}
                                    />
                                    <YAxis
                                      stroke="#94a3b8"
                                      tickLine={false}
                                      width={80}
                                      tickFormatter={(v) => formatNumber(v, "number")}
                                    />
                                    <Tooltip
                                      contentStyle={{ backgroundColor: "#0f172a", borderColor: "#121b2e" }}
                                      itemStyle={{ color: "#f8fafc" }}
                                    />
                                    <Bar dataKey={msg.chartData.yAxisKey} fill="#3b82f6" radius={[3, 3, 0, 0]} />
                                  </BarChart>
                                </ResponsiveContainer>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Collapsible SQL Block */}
                        {isAi && msg.sql && (
                          <div className="self-start">
                            <button
                              onClick={() => toggleSql(msg.id)}
                              className="flex items-center space-x-1 text-[10px] text-muted hover:text-white font-bold uppercase tracking-wider transition-colors outline-none focus-visible:ring-2 focus-visible:ring-secondary rounded"
                            >
                              <span>{isExpanded ? "Hide query" : "Show query"}</span>
                              <ChevronDown className={`h-3.5 w-3.5 transform transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                            </button>

                            {isExpanded && (
                              <div className="mt-1.5 bg-background border border-surface-light rounded-xl p-3.5 max-w-full overflow-x-auto text-[11px] font-mono text-secondary-light leading-relaxed whitespace-pre-wrap select-all shadow-glow-secondary">
                                {msg.sql}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Typing Indicator */}
            {isLoading && (
              <div className="flex items-start gap-3.5">
                <div className="h-8 w-8 rounded-xl bg-accent/10 border border-accent/20 text-accent-light flex items-center justify-center flex-shrink-0 animate-pulse shadow-glow-accent">
                  <Bot className="h-4.5 w-4.5" />
                </div>
                <div className="bg-surface border border-surface-light rounded-2xl px-4 py-3 flex items-center space-x-2 text-xs text-muted font-bold shadow-md">
                  <RefreshCw className="h-3.5 w-3.5 animate-spin text-secondary-light" />
                  <span>AI Co-Pilot is writing SQL and analyzing results...</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Form Action Input Area */}
          <div className="p-4 border-t border-surface-light bg-surface/50">
            <form onSubmit={handleSendMessage} className="flex gap-2">
              <div className="relative flex-1">
                <textarea
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  disabled={!datasetLoaded || isLoading}
                  placeholder={
                    datasetLoaded
                      ? "Ask a question about your data (e.g. 'what is the total value?')"
                      : "Upload a spreadsheet first to begin chatting..."
                  }
                  className="w-full h-11 pl-4 pr-12 pt-3.5 bg-background border border-surface-light hover:border-muted/30 focus:border-secondary rounded-xl text-xs text-foreground placeholder-muted/30 outline-none transition-all focus:ring-2 focus:ring-secondary/20 resize-none disabled:opacity-40 disabled:cursor-not-allowed"
                />
                <div className="absolute right-3.5 top-3.5 flex items-center space-x-1 text-[9px] font-extrabold text-muted/50 uppercase tracking-wider">
                  <span>Enter</span>
                  <CornerDownLeft className="h-3 w-3" />
                </div>
              </div>

              <button
                type="submit"
                disabled={!inputValue.trim() || !datasetLoaded || isLoading}
                className="flex items-center justify-center h-11 w-11 bg-accent hover:bg-accent-light disabled:bg-surface-light/50 text-white rounded-xl transition-all duration-300 disabled:cursor-not-allowed flex-shrink-0 shadow-glow-accent focus-visible:ring-2 focus-visible:ring-secondary focus-visible:outline-none"
              >
                <Send className="h-4 w-4" />
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
