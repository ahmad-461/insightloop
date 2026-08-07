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
  X
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

  return (
    <div className="flex-1 w-full max-w-7xl mx-auto px-6 py-12 space-y-8 font-sans">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-6">
        <div>
          <h1 className="font-sans text-2xl font-bold tracking-tight text-foreground">
            My Saved Dashboards
          </h1>
          <p className="text-muted text-xs mt-1">
            Access, revisit, and manage your previously saved AI analytics layouts.
          </p>
        </div>
        <Link
          href="/"
          className="flex items-center space-x-1.5 px-4 py-2 bg-accent hover:opacity-90 text-white font-medium rounded-lg text-xs transition-all focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none self-start md:self-auto"
        >
          <Plus className="h-4 w-4" />
          <span>Upload & Create New</span>
        </Link>
      </div>

      {/* Loading Skeleton */}
      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(3)].map((_, idx) => (
            <div key={idx} className="bg-surface border border-border rounded-lg p-5 space-y-3 animate-pulse">
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

      {/* Empty State */}
      {!loading && !error && dashboards.length === 0 && (
        <div className="text-center py-16 px-6 bg-surface border border-border rounded-lg max-w-md mx-auto space-y-4 shadow-sm">
          <div className="h-10 w-10 rounded-lg bg-background border border-border flex items-center justify-center mx-auto text-muted">
            <LayoutDashboard className="h-5 w-5 text-accent" />
          </div>
          <div className="space-y-1">
            <h3 className="font-sans text-xs font-bold text-foreground uppercase tracking-wider">No saved dashboards yet</h3>
            <p className="text-xs text-muted leading-relaxed max-w-xs mx-auto">
              Start by uploading your CSV/Excel files and building visualizations. Once you are satisfied, click &quot;Save Dashboard&quot; to list them here!
            </p>
          </div>
          <div className="pt-2">
            <Link
              href="/"
              className="inline-flex items-center space-x-1.5 px-4 py-2 bg-accent hover:opacity-90 text-white font-medium rounded-lg text-xs transition-all focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
            >
              <FileSpreadsheet className="h-3.5 w-3.5" />
              <span>Get Started Now</span>
            </Link>
          </div>
        </div>
      )}

      {/* Grid of Dashboard Cards */}
      {!loading && !error && dashboards.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {dashboards.map((dash) => {
            const { columnsCount, rowsCount } = getStats(dash.dataset_summary);

            return (
              <Link
                href={`/dashboards/${dash.id}`}
                key={dash.id}
                className="group bg-surface border border-border hover:border-text-secondary rounded-lg p-5 transition-colors flex flex-col justify-between relative overflow-hidden focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="font-sans font-bold text-sm text-foreground leading-snug group-hover:text-accent transition-colors truncate max-w-[85%]" title={dash.title || "Untitled Dashboard"}>
                      {dash.title || "Untitled Dashboard"}
                    </h3>
                    <div className="text-muted group-hover:text-accent transition-colors">
                      <ExternalLink className="h-4 w-4" />
                    </div>
                  </div>

                  <p className="text-[10px] text-muted">
                    Saved {formatRelativeDate(dash.created_at)}
                  </p>

                  <div className="flex flex-wrap gap-2 pt-1">
                    <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded bg-background border border-border text-[10px] text-foreground font-sans">
                      <FileSpreadsheet className="h-3 w-3 text-accent" />
                      <span>{columnsCount} Columns</span>
                    </span>
                    <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded bg-background border border-border text-[10px] text-foreground font-sans">
                      <span>{rowsCount.toLocaleString()} Rows</span>
                    </span>
                  </div>
                </div>

                <div className="pt-4 border-t border-border mt-4 flex justify-between items-center text-xs">
                  <span className="text-[9px] text-muted/60 font-mono">ID: {dash.id.slice(0, 8)}...</span>
                  <button
                    onClick={(e) => handleDeleteClick(dash.id, e)}
                    className="flex items-center space-x-1 px-2.5 py-1 bg-surface hover:bg-surface-subtle text-rose-500 border border-border hover:border-rose-500/20 rounded-lg transition-colors focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    <span>Delete</span>
                  </button>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {/* Confirmation Modal */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 animate-fade-in">
          <div className="bg-surface border border-border rounded-lg p-5 w-full max-w-sm relative space-y-4 shadow-lg">
            <button
              onClick={() => setDeleteId(null)}
              className="absolute top-4 right-4 text-muted hover:text-foreground transition focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none rounded p-1"
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
