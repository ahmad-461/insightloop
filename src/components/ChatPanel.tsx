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
  ChartBar
} from "lucide-react";
import { ColumnSchema } from "@/utils/parser";
import { formatNumber } from "@/utils/formatter";
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
}

interface ChatPanelProps {
  datasetLoaded: boolean;
  schema: ColumnSchema[];
  runQuery: (sql: string) => Promise<Record<string, unknown>[] | { error: string }>;
}

export default function ChatPanel({ datasetLoaded, schema, runQuery }: ChatPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [expandedSqlIds, setExpandedSqlIds] = useState<Record<string, boolean>>({});

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto scroll to latest message when loading or messages list changes
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  // Expand / collapse SQL query display
  const toggleSql = (id: string) => {
    setExpandedSqlIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Clear Chat history
  const handleClearChat = () => {
    setMessages([]);
    setExpandedSqlIds({});
  };

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
      { id: userMsgId, role: "user", content: userQuestion },
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
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-[#111827] border border-gray-800 rounded-xl overflow-hidden flex flex-col shadow-xl">
      {/* Header bar */}
      <div className="px-6 py-4 border-b border-gray-800 flex items-center justify-between bg-surface/50">
        <div className="flex items-center space-x-2.5">
          <div className="bg-blue-500/15 p-1.5 rounded-lg border border-blue-500/20">
            <Sparkles className="h-4 w-4 text-accent" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">AI Text-to-SQL Co-Pilot</h3>
            <p className="text-[10px] text-gray-400 font-medium">Ask questions about your loaded spreadsheet using conversational language.</p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {messages.length > 0 && (
            <button
              onClick={handleClearChat}
              className="flex items-center space-x-1.5 px-2.5 py-1.5 bg-gray-950 hover:bg-gray-900 text-gray-400 hover:text-white border border-gray-850 hover:border-gray-800 rounded-lg text-xs font-bold transition"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>Clear Session</span>
            </button>
          )}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1.5 bg-gray-950 hover:bg-gray-900 border border-gray-850 text-gray-400 hover:text-white rounded-lg transition"
          >
            {isCollapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {!isCollapsed && (
        <div className="flex flex-col h-[500px]">
          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-background/20 select-text">
            {!datasetLoaded ? (
              <div className="flex flex-col items-center justify-center h-full text-center space-y-3">
                <AlertCircle className="h-8 w-8 text-gray-600" />
                <p className="text-xs text-gray-400 max-w-sm">
                  Please upload a spreadsheet first to activate the AI Co-Pilot query console.
                </p>
              </div>
            ) : messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center space-y-3">
                <Bot className="h-10 w-10 text-accent/80" />
                <div className="space-y-1">
                  <p className="text-xs font-bold text-white">Ask anything about your data!</p>
                  <p className="text-[11px] text-gray-400 max-w-xs">
                    Try asking &quot;what is the total revenue?&quot; or &quot;which category is most popular?&quot;
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
                        className={`h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0 border ${
                          isAi
                            ? "bg-blue-950/45 border-blue-900/30 text-accent"
                            : "bg-emerald-950/45 border-emerald-900/30 text-emerald-400"
                        }`}
                      >
                        {isAi ? <Bot className="h-4.5 w-4.5" /> : <User className="h-4.5 w-4.5" />}
                      </div>

                      {/* Content bubble */}
                      <div className="flex flex-col space-y-2 max-w-[85%]">
                        <div
                          className={`rounded-2xl px-4 py-3 text-xs leading-relaxed ${
                            isAi
                              ? "bg-surface border border-gray-800 text-gray-100"
                              : "bg-accent text-white font-medium"
                          }`}
                        >
                          <p className="whitespace-pre-wrap">{msg.content}</p>

                          {/* Render Inline Recharts Chart if available */}
                          {isAi && msg.chartData && (
                            <div className="mt-4 pt-3.5 border-t border-gray-800/80 space-y-2">
                              <div className="flex items-center space-x-1.5 text-blue-400 font-bold text-[10px] uppercase tracking-wide">
                                <ChartBar className="h-3.5 w-3.5" />
                                <span>Suggested Visualization</span>
                              </div>
                              <div className="h-44 w-full text-[9px] bg-background/50 border border-gray-850 p-2.5 rounded-lg">
                                <ResponsiveContainer width="100%" height="100%">
                                  <BarChart data={msg.chartData.data}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
                                    <XAxis
                                      dataKey={msg.chartData.xAxisKey}
                                      stroke="#6b7280"
                                      tickLine={false}
                                      tickFormatter={(v) => (String(v).length > 10 ? `${String(v).slice(0, 8)}...` : String(v))}
                                    />
                                    <YAxis
                                      stroke="#6b7280"
                                      tickLine={false}
                                      width={60}
                                      tickFormatter={(v) => formatNumber(v, "number")}
                                    />
                                    <Tooltip
                                      contentStyle={{ backgroundColor: "#111827", borderColor: "#374151" }}
                                      itemStyle={{ color: "#f3f4f6" }}
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
                              className="flex items-center space-x-1 text-[10px] text-gray-500 hover:text-white font-bold uppercase tracking-wider transition outline-none"
                            >
                              <span>{isExpanded ? "Hide query" : "Show query"}</span>
                              <ChevronDown className={`h-3.5 w-3.5 transform transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                            </button>

                            {isExpanded && (
                              <div className="mt-1.5 bg-gray-950 border border-gray-850 rounded-lg p-3 max-w-full overflow-x-auto text-[11px] font-mono text-blue-400 leading-relaxed whitespace-pre-wrap select-all">
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
                <div className="h-8 w-8 rounded-lg bg-blue-950/45 border border-blue-900/30 text-accent flex items-center justify-center flex-shrink-0 animate-pulse">
                  <Bot className="h-4.5 w-4.5" />
                </div>
                <div className="bg-surface border border-gray-800 rounded-2xl px-4 py-3 flex items-center space-x-2 text-xs text-gray-400 font-bold shadow-md">
                  <RefreshCw className="h-3.5 w-3.5 animate-spin text-accent" />
                  <span>AI Co-Pilot is writing SQL and analyzing results...</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Form Action Input Area */}
          <div className="p-4 border-t border-gray-800 bg-surface/50">
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
                  className="w-full h-11 pl-4 pr-12 pt-3 bg-gray-950 border border-gray-850 hover:border-gray-800 focus:border-accent rounded-xl text-xs text-gray-100 placeholder-gray-600 outline-none transition focus:ring-1 focus:ring-accent/20 resize-none disabled:opacity-40 disabled:cursor-not-allowed"
                />
                <div className="absolute right-3.5 top-3.5 flex items-center space-x-1 text-[9px] font-bold text-gray-600 uppercase tracking-wide">
                  <span>Enter</span>
                  <CornerDownLeft className="h-3 w-3" />
                </div>
              </div>

              <button
                type="submit"
                disabled={!inputValue.trim() || !datasetLoaded || isLoading}
                className="flex items-center justify-center h-11 w-11 bg-accent hover:bg-blue-600 disabled:bg-gray-800 text-white rounded-xl transition disabled:cursor-not-allowed flex-shrink-0 shadow-lg shadow-accent/15"
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
