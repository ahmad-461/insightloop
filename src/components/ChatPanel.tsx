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

  // Centralized Sync effect
  useEffect(() => {
    if (!dashboardId || isSyncingHistory || isReadOnly) return;

    const unsynced = messages.filter((m) => !m.synced && !failedSyncIds.includes(m.id));
    if (unsynced.length === 0) return;

    const doSync = async () => {
      setIsSyncingHistory(true);
      const syncedIds: string[] = [];
      const newFailedIds: string[] = [];

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

  // Helper to determine if results can be charted
  const detectChartableData = (rows: Record<string, unknown>[]): ChatMessage["chartData"] | undefined => {
    if (!rows || rows.length < 2 || rows.length > 50) return undefined;
    const keys = Object.keys(rows[0]);
    if (keys.length !== 2) return undefined;

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

    if (numKey && catKey) {
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

    setMessages((prev) => [
      ...prev,
      { id: userMsgId, role: "user", content: userQuestion, synced: false },
    ]);

    let generatedSql = "";
    let queryResults: Record<string, unknown>[] | { error: string } | null = null;
    let finalExplanation = "";

    try {
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

      queryResults = await runQuery(generatedSql);

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

      if (!queryResults || "error" in queryResults) {
        throw new Error("I couldn't answer that question about your data — try rephrasing it.");
      }

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

      const chartData = detectChartableData(queryResults);

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

  const renderSyncIndicator = () => {
    if (messages.length === 0) return null;

    if (isReadOnly) {
      return (
        <div
          className="flex items-center space-x-1 px-2 py-1 bg-background border border-border rounded-lg text-[9px] font-bold text-warning"
          title="Shared View — Conversation is local-only"
        >
          <CloudOff className="h-3 w-3" />
          <span className="hidden sm:inline">Guest Mode (Local-Only)</span>
        </div>
      );
    }

    if (isSyncingHistory) {
      return (
        <div
          className="flex items-center space-x-1 px-2 py-1 bg-background border border-border rounded-lg text-[9px] font-bold text-accent animate-pulse"
          title="Syncing conversation to cloud..."
        >
          <RefreshCw className="h-3 w-3 animate-spin text-accent" />
          <span className="hidden sm:inline">Syncing...</span>
        </div>
      );
    }

    const hasUnsynced = !dashboardId || messages.some((m) => !m.synced && !failedSyncIds.includes(m.id));

    if (hasUnsynced) {
      return (
        <div
          className="flex items-center space-x-1 px-2 py-1 bg-background border border-border rounded-lg text-[9px] font-bold text-muted"
          title="Local-only (saves with dashboard)"
        >
          <CloudOff className="h-3 w-3 text-muted" />
          <span className="hidden sm:inline">Local-only</span>
        </div>
      );
    }

    return (
      <div
        className="flex items-center space-x-1 px-2 py-1 bg-background border border-border rounded-lg text-[9px] font-bold text-success"
        title="Synced to cloud"
      >
        <Cloud className="h-3 w-3 text-success" />
        <span className="hidden sm:inline">Synced</span>
      </div>
    );
  };

  return (
    <div className="bg-surface border border-border rounded-lg overflow-hidden flex flex-col shadow-sm font-sans">
      {/* Header bar */}
      <div className="px-5 py-3 border-b border-border flex items-center justify-between bg-surface/50">
        <div className="flex items-center space-x-2.5 pr-4 truncate">
          <div className="p-1 rounded-lg border border-border text-accent bg-surface flex-shrink-0">
            <Sparkles className="h-4 w-4" />
          </div>
          <div className="truncate">
            <h3 className="font-sans text-xs font-bold text-foreground uppercase tracking-wider">AI Text-to-SQL Co-Pilot</h3>
            <p className="text-[10px] text-muted font-normal truncate">Ask questions about your loaded spreadsheet using conversational language.</p>
          </div>
        </div>

        <div className="flex items-center space-x-1.5 flex-shrink-0">
          {renderSyncIndicator()}
          {messages.length > 0 && (
            <button
              onClick={handleClearChat}
              className="flex items-center space-x-1 px-2.5 py-1 bg-background hover:bg-surface-subtle text-muted hover:text-foreground border border-border rounded-lg text-xs font-medium transition-colors focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>Clear Session</span>
            </button>
          )}
          {/* Help Button */}
          <button
            onClick={() => setShowHelp(!showHelp)}
            className={`p-1 border rounded-lg transition-colors focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none ${
              showHelp
                ? "bg-surface-subtle border-border text-foreground"
                : "bg-background hover:bg-surface-subtle border-border text-muted hover:text-foreground"
            }`}
            title="How the AI Co-Pilot works"
          >
            <HelpCircle className="h-4 w-4" />
          </button>
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1 bg-background hover:bg-surface-subtle border border-border text-muted hover:text-foreground rounded-lg transition-colors focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
          >
            {isCollapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {!isCollapsed && (
        <div className="flex flex-col h-[480px]">
          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-background/5 select-text">
            {/* Collapsible Help Info */}
            {showHelp && (
              <div className="bg-surface border border-border p-4 rounded-lg space-y-2 animate-fade-in relative shadow-sm mb-4">
                <button
                  onClick={() => setShowHelp(false)}
                  className="absolute top-3 right-3 text-muted hover:text-foreground transition rounded p-0.5"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
                <div className="flex items-center space-x-1.5 text-accent font-bold">
                  <Sparkles className="h-4 w-4" />
                  <span className="font-sans text-[10px] uppercase tracking-wider">AI Co-Pilot Privacy & Security</span>
                </div>
                <p className="text-[10px] text-muted leading-relaxed font-normal">
                  This interface allows you to query your data using natural language. Here is how your privacy and analysis are structured:
                </p>
                <ol className="list-decimal pl-4 text-[10px] text-muted space-y-1 font-normal">
                  <li><strong className="text-foreground font-medium">No Raw Data Upload:</strong> Only your column names and metadata types are shared with the Gemini 2.5 API to translate queries. Your spreadsheet rows stay safe in your browser.</li>
                  <li><strong className="text-foreground font-medium">Local DuckDB WASM:</strong> Generated SQL runs directly inside your browser on the compiled DuckDB engine for extreme performance.</li>
                  <li><strong className="text-foreground font-medium">SaaS Visuals:</strong> Interactive summaries and charts are rendered using pure client-side charts without transmitting raw statistics.</li>
                </ol>
              </div>
            )}
            {!datasetLoaded ? (
              <div className="flex flex-col items-center justify-center h-full text-center space-y-2">
                <AlertCircle className="h-6 w-6 text-muted/30" />
                <p className="text-xs text-muted max-w-sm">
                  Please upload a spreadsheet first to activate the AI Co-Pilot query console.
                </p>
              </div>
            ) : messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center space-y-3">
                <Bot className="h-8 w-8 text-accent animate-pulse" />
                <div className="space-y-1">
                  <p className="font-sans text-xs font-bold text-foreground uppercase tracking-wider">Ask anything about your data!</p>
                  <p className="text-[10px] text-muted max-w-xs mx-auto">
                    Try asking &quot;what is our total sales value?&quot; or &quot;which product category is most active?&quot;
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-5">
                {messages.map((msg) => {
                  const isAi = msg.role === "assistant";
                  const isExpanded = expandedSqlIds[msg.id];

                  return (
                    <div
                      key={msg.id}
                      className={`flex items-start gap-3 ${isAi ? "" : "flex-row-reverse"}`}
                    >
                      {/* Avatar */}
                      <div
                        className={`h-7 w-7 rounded-lg flex items-center justify-center flex-shrink-0 border ${
                          isAi
                            ? "bg-surface border-border text-accent"
                            : "bg-accent border-transparent text-white"
                        }`}
                      >
                        {isAi ? <Bot className="h-4 w-4" /> : <User className="h-4 w-4" />}
                      </div>

                      {/* Content bubble */}
                      <div className="flex flex-col space-y-1.5 max-w-[85%]">
                        <div
                          className={`rounded-lg px-3.5 py-2.5 text-xs leading-relaxed ${
                            isAi
                              ? "bg-surface border border-border text-foreground"
                              : "bg-accent text-white font-medium"
                          }`}
                        >
                          <p className="whitespace-pre-wrap">{msg.content}</p>

                          {/* Render Inline Suggested Chart */}
                          {isAi && msg.chartData && (
                            <div className="mt-3 pt-2.5 border-t border-border space-y-2">
                              <div className="flex items-center space-x-1.5 text-accent font-bold text-[9px] uppercase tracking-wide">
                                <ChartBar className="h-3 w-3" />
                                <span>Suggested Visualization</span>
                              </div>
                              <div className="h-40 w-full text-[9px] bg-background border border-border p-2 rounded-lg">
                                <ResponsiveContainer width="100%" height="100%">
                                  <BarChart data={msg.chartData.data}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                                    <XAxis
                                      dataKey={msg.chartData.xAxisKey}
                                      stroke="var(--text-secondary)"
                                      tickLine={false}
                                      tickFormatter={(v) => (String(v).length > 10 ? `${String(v).slice(0, 8)}...` : String(v))}
                                    />
                                    <YAxis
                                      stroke="var(--text-secondary)"
                                      tickLine={false}
                                      width={80}
                                      tickFormatter={(v) => formatNumber(v, "number")}
                                    />
                                    <Tooltip
                                      contentStyle={{ backgroundColor: "var(--surface)", borderColor: "var(--border)", borderRadius: "6px" }}
                                      itemStyle={{ color: "var(--text-primary)" }}
                                    />
                                    <Bar dataKey={msg.chartData.yAxisKey} fill="var(--accent)" radius={[2, 2, 0, 0]} />
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
                              className="flex items-center space-x-1 text-[9px] text-muted hover:text-foreground font-bold uppercase tracking-wider transition-colors outline-none focus-visible:ring-2 focus-visible:ring-accent rounded"
                            >
                              <span>{isExpanded ? "Hide query" : "Show query"}</span>
                              <ChevronDown className={`h-3 w-3 transform transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                            </button>

                            {isExpanded && (
                              <div className="mt-1 bg-background border border-border rounded-lg p-2.5 max-w-full overflow-x-auto text-[10px] font-mono text-accent leading-relaxed whitespace-pre-wrap select-all">
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
              <div className="flex items-start gap-3">
                <div className="h-7 w-7 rounded-lg bg-surface border border-border text-accent flex items-center justify-center flex-shrink-0 animate-pulse">
                  <Bot className="h-4 w-4" />
                </div>
                <div className="bg-surface border border-border rounded-lg px-3 py-2 flex items-center space-x-1.5 text-xs text-muted font-medium">
                  <RefreshCw className="h-3 w-3 animate-spin text-accent" />
                  <span>AI Co-Pilot is writing SQL and analyzing results...</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Form Action Input Area */}
          <div className="p-3 border-t border-border bg-surface/50">
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
                  className="w-full h-10 pl-3 pr-12 pt-2.5 bg-background border border-border hover:border-text-secondary focus:border-accent rounded-lg text-xs text-foreground placeholder-muted/30 outline-none transition-all resize-none disabled:opacity-40 disabled:cursor-not-allowed focus:ring-2 focus:ring-accent/15"
                />
                <div className="absolute right-3.5 top-3 flex items-center space-x-1 text-[8px] font-bold text-muted/50 uppercase tracking-wider">
                  <span>Enter</span>
                  <CornerDownLeft className="h-2.5 w-2.5" />
                </div>
              </div>

              <button
                type="submit"
                disabled={!inputValue.trim() || !datasetLoaded || isLoading}
                className="flex items-center justify-center h-10 w-10 bg-accent hover:opacity-90 disabled:opacity-40 text-white rounded-lg transition-colors disabled:cursor-not-allowed flex-shrink-0 focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
              >
                <Send className="h-3.5 w-3.5" />
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
