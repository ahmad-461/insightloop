"use client";

import React, { useState, useEffect } from "react";
import {
  LayoutDashboard,
  FileSpreadsheet,
  Trash2,
  ExternalLink,
  Plus,
  RefreshCw,
  AlertCircle,
  X,
  TrendingUp,
  BarChart3,
  Hash,
  Database,
  Clock,
  ArrowUpDown
} from "lucide-react";
import { getOrCreateSessionId } from "@/utils/session";
import { supabase } from "@/utils/supabaseClient";
import { formatRelativeDate } from "@/utils/formatter";
import Link from "next/link";

interface DashboardRow {
  id: string;
  session_id: string;
  title: string | null;
  layout_config: unknown;
  dataset_summary: unknown;
  created_at: string;
}

export default function MyDashboardsPage() {
  const [dashboards, setDashboards] = useState<DashboardRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<"recent" | "name">("recent");

  // Deletion state
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchDashboards = async () => {
    setLoading(true);
    setError(null);
    try {
      const sessionId = getOrCreateSessionId();
      if (!sessionId) {
        setDashboards([]);
        setLoading(false);
        return;
      }

      const { data, error: sbError } = await supabase
        .from("dashboards")
        .select("*")
        .eq("session_id", sessionId)
        .order("created_at", { ascending: false });

      if (sbError) {
        throw new Error(sbError.message);
      }

      setDashboards(data || []);
    } catch (err: unknown) {
      console.error("Error loading dashboards:", err);
      setError((err as Error)?.message || "Failed to load saved dashboards.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboards();
  }, []);

  const handleDeleteClick = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setDeleteId(id);
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      const { error: sbError } = await supabase
        .from("dashboards")
        .delete()
        .eq("id", deleteId);

      if (sbError) {
        throw new Error(sbError.message);
      }

      setDashboards((prev) => prev.filter((d) => d.id !== deleteId));
      setDeleteId(null);
    } catch (err: unknown) {
      console.error("Error deleting dashboard:", err);
      alert((err as Error)?.message || "Failed to delete the dashboard.");
    } finally {
      setDeleting(false);
    }
  };

  const getStats = (summary: unknown) => {
    if (!summary) {
      return { columnsCount: 0, rowsCount: 0 };
    }

    if (typeof summary === "object" && !Array.isArray(summary) && "schema" in summary) {
      const summaryObj = summary as { totalRows?: number; schema?: unknown[] };
      const schemaLen = Array.isArray(summaryObj.schema) ? summaryObj.schema.length : 0;
      const totalRows = typeof summaryObj.totalRows === "number" ? summaryObj.totalRows : 0;
      return { columnsCount: schemaLen, rowsCount: totalRows };
    }

    if (Array.isArray(summary)) {
      const columnsCount = summary.length;
      let rowsCount = 0;
      summary.forEach((col: unknown) => {
        const colObj = col as { totalCount?: number };
        if (colObj && typeof colObj.totalCount === "number" && colObj.totalCount > rowsCount) {
          rowsCount = colObj.totalCount;
        }
      });
      return { columnsCount, rowsCount };
    }

    return { columnsCount: 0, rowsCount: 0 };
  };

  // Sort dashboards based on state
  const sortedDashboards = [...dashboards].sort((a, b) => {
    if (sortBy === "recent") {
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    } else {
      const titleA = (a.title || "Untitled Dashboard").toLowerCase();
      const titleB = (b.title || "Untitled Dashboard").toLowerCase();
      return titleA.localeCompare(titleB);
    }
  });

  const renderWidgetPreview = (layoutConfig: unknown) => {
    const widgets = Array.isArray(layoutConfig)
      ? (layoutConfig as { type: "kpi" | "line" | "bar"; title?: string }[])
      : [];

    if (widgets.length === 0) {
      return (
        <div className="h-10 w-full rounded-lg bg-surface-subtle/30 border border-border/40 flex items-center justify-center px-3 select-none">
          <span className="text-[10px] text-muted/60 italic font-medium">No custom widgets</span>
        </div>
      );
    }

    return (
      <div className="h-10 w-full rounded-lg bg-surface-subtle/30 border border-border/40 flex items-center justify-between px-3 select-none">
        <div className="flex items-center gap-1.5 overflow-hidden">
          {widgets.slice(0, 4).map((w, i) => (
            <div
              key={i}
              title={`${w.title || "Widget"} (${w.type.toUpperCase()})`}
              className="flex items-center justify-center h-6 w-6 rounded bg-background border border-border/80 text-foreground shadow-sm"
            >
              {w.type === "line" && <TrendingUp className="h-3 w-3 text-accent" />}
              {w.type === "bar" && <BarChart3 className="h-3 w-3 text-indigo-500 dark:text-indigo-400" />}
              {w.type === "kpi" && <Hash className="h-3 w-3 text-emerald-500 dark:text-emerald-400" />}
            </div>
          ))}
          {widgets.length > 4 && (
            <span className="text-[10px] text-muted font-bold pl-0.5">+{widgets.length - 4}</span>
          )}
        </div>
        <span className="text-[9px] uppercase tracking-wider font-extrabold text-muted/60">
          {widgets.length} {widgets.length === 1 ? "Widget" : "Widgets"}
        </span>
      </div>
    );
  };

  return (
    <div className="flex-1 w-full flex flex-col font-sans">
      {/* Redesigned Premium Header Band */}
      <div className="w-full bg-surface-subtle/20 border-b border-border py-8 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 rounded-lg border border-border text-accent bg-surface shadow-sm">
                <LayoutDashboard className="h-5 w-5" />
              </div>
              <h1 className="font-sans text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                My Saved Dashboards
              </h1>
            </div>
            <p className="text-muted text-xs leading-relaxed max-w-xl font-normal">
              Access, revisit, and manage your previously saved AI analytics layouts. All your raw spreadsheet data remains completely secure and local.
            </p>
            {!loading && !error && dashboards.length > 0 && (
              <div className="flex items-center gap-2 pt-1.5">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-surface border border-border rounded-full text-[10px] text-foreground font-sans font-medium">
                  <span className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse" />
                  <span className="font-bold">{dashboards.length}</span>
                  <span className="text-muted">{dashboards.length === 1 ? "Dashboard" : "Dashboards"} Saved</span>
                </span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="flex items-center space-x-1.5 px-4 py-2 bg-accent hover:opacity-90 text-white font-semibold rounded-lg text-xs transition-all focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none shadow-sm"
            >
              <Plus className="h-4 w-4" />
              <span>Upload & Create New</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="w-full max-w-7xl mx-auto px-6 py-10 space-y-8 flex-1">
        {/* Loading Skeleton */}
        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(3)].map((_, idx) => (
              <div key={idx} className="bg-surface border border-border rounded-xl p-5 space-y-3 animate-pulse">
                <div className="h-4 bg-surface-subtle rounded w-2/3"></div>
                <div className="h-3 bg-surface-subtle rounded w-1/2"></div>
                <div className="pt-3 border-t border-border flex justify-between">
                  <div className="h-3 bg-surface-subtle rounded w-1/4"></div>
                  <div className="h-3 bg-surface-subtle rounded w-1/4"></div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Error state */}
        {!loading && error && (
          <div className="flex items-start space-x-2.5 p-4 bg-rose-500/10 border border-rose-500/20 rounded-lg">
            <AlertCircle className="h-4 w-4 text-rose-500 mt-0.5 flex-shrink-0" />
            <div className="space-y-1">
              <p className="text-xs font-bold text-rose-600">Failed to Load Saved Dashboards</p>
              <p className="text-xs text-muted leading-relaxed font-mono">{error}</p>
            </div>
          </div>
        )}

        {/* Empty State Redesign */}
        {!loading && !error && dashboards.length === 0 && (
          <div className="max-w-md mx-auto my-12 animate-fade-in">
            <div className="bg-surface border border-border/80 rounded-xl p-8 text-center space-y-5 shadow-sm hover:shadow-md hover:border-accent/20 transition-all duration-300">
              <div className="h-12 w-12 rounded-xl bg-surface-subtle/50 border border-border flex items-center justify-center mx-auto text-accent shadow-sm">
                <LayoutDashboard className="h-5.5 w-5.5" />
              </div>

              <div className="space-y-2">
                <h3 className="font-sans text-sm font-bold text-foreground uppercase tracking-wider">
                  No Saved Dashboards Yet
                </h3>
                <p className="text-xs text-muted leading-relaxed max-w-xs mx-auto font-normal">
                  Build and save visualizations from your spreadsheets. Click &quot;Save Dashboard&quot; to store them securely and access them from this directory.
                </p>
              </div>

              {/* Simulated abstract preview lines to match card style */}
              <div className="h-12 w-full rounded-lg bg-surface-subtle/20 border border-border/40 flex items-center justify-between px-3.5 select-none max-w-xs mx-auto">
                <div className="flex items-center gap-1.5">
                  <div className="h-5 w-5 rounded bg-background border border-border flex items-center justify-center">
                    <TrendingUp className="h-2.5 w-2.5 text-accent/40" />
                  </div>
                  <div className="h-5 w-5 rounded bg-background border border-border flex items-center justify-center">
                    <BarChart3 className="h-2.5 w-2.5 text-indigo-500/30" />
                  </div>
                  <div className="h-5 w-5 rounded bg-background border border-border flex items-center justify-center">
                    <Hash className="h-2.5 w-2.5 text-emerald-500/30" />
                  </div>
                </div>
                <div className="h-2 w-16 bg-muted/20 rounded-full" />
              </div>

              <div className="pt-2">
                <Link
                  href="/"
                  className="inline-flex items-center space-x-1.5 px-5 py-2.5 bg-accent hover:opacity-90 text-white font-semibold rounded-lg text-xs transition-all focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none shadow-sm shadow-accent/10"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Upload Data & Create Dashboard</span>
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Saved Dashboards Grid & Controls */}
        {!loading && !error && dashboards.length > 0 && (
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-border/60 pb-3">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-muted/80">
                Directory Layouts ({dashboards.length})
              </span>
              <div className="flex items-center space-x-2">
                <div className="flex items-center space-x-1.5 bg-surface border border-border rounded-lg px-2 py-1">
                  <ArrowUpDown className="h-3 w-3 text-muted" />
                  <label htmlFor="sort-select" className="text-[10px] text-muted font-bold uppercase tracking-wider">Sort:</label>
                  <select
                    id="sort-select"
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as "recent" | "name")}
                    className="bg-transparent border-none text-[11px] text-foreground font-semibold transition focus:outline-none cursor-pointer pr-1"
                  >
                    <option value="recent">Recent</option>
                    <option value="name">Name</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {sortedDashboards.map((dash) => {
                const { columnsCount, rowsCount } = getStats(dash.dataset_summary);

                return (
                  <Link
                    href={`/dashboards/${dash.id}`}
                    key={dash.id}
                    className="group bg-surface border border-border hover:border-accent/40 rounded-xl p-5 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 flex flex-col justify-between relative overflow-hidden focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
                  >
                    <div className="space-y-4">
                      {/* Title & External Link Button */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1 truncate flex-1">
                          <h3 className="font-sans font-bold text-sm text-foreground leading-snug group-hover:text-accent transition-colors truncate" title={dash.title || "Untitled Dashboard"}>
                            {dash.title || "Untitled Dashboard"}
                          </h3>
                          <div className="flex items-center space-x-1 text-[10px] text-muted">
                            <Clock className="h-3 w-3 text-muted/60" />
                            <span>Saved {formatRelativeDate(dash.created_at)}</span>
                          </div>
                        </div>
                        <div className="p-1.5 rounded-lg border border-border bg-surface text-muted group-hover:text-accent group-hover:border-accent/30 group-hover:bg-accent/5 transition-all duration-300 flex-shrink-0">
                          <ExternalLink className="h-3.5 w-3.5" />
                        </div>
                      </div>

                      {/* Visual Preview Element */}
                      {renderWidgetPreview(dash.layout_config)}

                      {/* Metadata badges */}
                      <div className="grid grid-cols-2 gap-2 pt-1">
                        <div
                          title={`${columnsCount} columns detected in spreadsheet schema`}
                          className="inline-flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg bg-background border border-border/80 text-[10px] text-foreground font-medium shadow-sm"
                        >
                          <FileSpreadsheet className="h-3.5 w-3.5 text-accent" />
                          <span>{columnsCount} Columns</span>
                        </div>
                        <div
                          title={`${rowsCount.toLocaleString()} raw data rows processed`}
                          className="inline-flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg bg-background border border-border/80 text-[10px] text-foreground font-medium shadow-sm"
                        >
                          <Database className="h-3.5 w-3.5 text-indigo-500 dark:text-indigo-400" />
                          <span>{rowsCount.toLocaleString()} Rows</span>
                        </div>
                      </div>
                    </div>

                    {/* Card Footer actions */}
                    <div className="pt-3.5 border-t border-border mt-5 flex justify-between items-center text-xs">
                      {/* Dashboard ID visible only on hover */}
                      <div className="transition-all duration-300 opacity-0 group-hover:opacity-100 flex items-center space-x-1 text-[9px] text-muted/60 font-mono">
                        <span className="uppercase font-bold tracking-wider text-[8px] text-muted/40 mr-0.5">ID:</span>
                        <span title={dash.id} className="select-all">{dash.id.slice(0, 8)}...</span>
                      </div>

                      <button
                        onClick={(e) => handleDeleteClick(dash.id, e)}
                        className="flex items-center space-x-1 px-2.5 py-1 bg-surface hover:bg-rose-500/10 text-rose-500 hover:text-rose-600 border border-border hover:border-rose-500/20 rounded-lg transition-colors focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        <span>Delete</span>
                      </button>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Confirmation Modal */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 animate-fade-in">
          <div className="bg-surface border border-border rounded-xl p-5 w-full max-w-sm relative space-y-4 shadow-lg">
            <button
              onClick={() => setDeleteId(null)}
              className="absolute top-4 right-4 text-muted hover:text-foreground transition focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none rounded-lg p-1"
            >
              <X className="h-4 w-4" />
            </button>
            <div className="text-center py-2 space-y-3">
              <div className="h-10 w-10 bg-rose-500/10 border border-rose-500/20 text-rose-500 rounded-full flex items-center justify-center mx-auto">
                <Trash2 className="h-5 w-5" />
              </div>
              <div className="space-y-1">
                <h3 className="font-sans text-xs font-bold text-foreground uppercase tracking-wider">Delete Saved Dashboard?</h3>
                <p className="text-xs text-muted leading-relaxed">
                  Are you absolutely sure you want to delete this dashboard? This action cannot be undone, and all associated chat history will be permanently deleted.
                </p>
              </div>
            </div>

            <div className="flex gap-2.5 pt-2">
              <button
                disabled={deleting}
                onClick={() => setDeleteId(null)}
                className="flex-1 py-1.5 bg-background hover:bg-surface-subtle border border-border text-muted hover:text-foreground rounded-lg text-xs font-medium transition-colors focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
              >
                Cancel
              </button>
              <button
                disabled={deleting}
                onClick={confirmDelete}
                className="flex-1 py-1.5 bg-rose-500 hover:opacity-90 disabled:opacity-40 text-white rounded-lg text-xs font-semibold transition-all flex items-center justify-center space-x-1 focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
              >
                {deleting ? (
                  <>
                    <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <span>Yes, Delete</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
