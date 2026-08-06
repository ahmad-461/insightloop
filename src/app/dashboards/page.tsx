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
  dataset_summary: unknown; // ColumnSchema[] or { totalRows: number; schema: ColumnSchema[] }
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

  // Helper to parse columns and rows count with backwards-compatibility support
  const getStats = (summary: unknown) => {
    if (!summary) {
      return { columnsCount: 0, rowsCount: 0 };
    }

    // New format: { totalRows: number, schema: ColumnSchema[] }
    if (typeof summary === "object" && !Array.isArray(summary) && "schema" in summary) {
      const summaryObj = summary as { totalRows?: number; schema?: unknown[] };
      const schemaLen = Array.isArray(summaryObj.schema) ? summaryObj.schema.length : 0;
      const totalRows = typeof summaryObj.totalRows === "number" ? summaryObj.totalRows : 0;
      return { columnsCount: schemaLen, rowsCount: totalRows };
    }

    // Old format: ColumnSchema[]
    if (Array.isArray(summary)) {
      const columnsCount = summary.length;
      // Fallback: estimate rowsCount as max totalCount
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
    <div className="flex-1 w-full max-w-7xl mx-auto px-4 py-8 space-y-8 font-sans">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-surface-light pb-6">
        <div>
          <h1 className="font-display text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white via-foreground to-muted bg-clip-text text-transparent">
            My Saved Dashboards
          </h1>
          <p className="text-muted text-sm mt-1 font-semibold">
            Access, revisit, and manage your previously saved AI analytics layouts.
          </p>
        </div>
        <Link
          href="/"
          className="flex items-center space-x-2 px-5 py-2.5 bg-accent hover:bg-accent-light text-white font-extrabold rounded-xl text-sm transition-all duration-300 focus-visible:ring-2 focus-visible:ring-secondary focus-visible:outline-none shadow-glow-accent hover:shadow-glow-secondary self-start md:self-auto"
        >
          <Plus className="h-4 w-4" />
          <span>Upload & Create New</span>
        </Link>
      </div>

      {/* Loading Skeleton */}
      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(3)].map((_, idx) => (
            <div key={idx} className="bg-surface border border-surface-light rounded-2xl p-6 space-y-4 animate-pulse">
              <div className="h-5 bg-surface-light rounded-lg w-2/3"></div>
              <div className="h-4 bg-surface-light rounded-lg w-1/2"></div>
              <div className="pt-4 border-t border-surface-light/40 flex justify-between">
                <div className="h-4 bg-surface-light rounded-lg w-1/4"></div>
                <div className="h-4 bg-surface-light rounded-lg w-1/4"></div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Error state */}
      {!loading && error && (
        <div className="flex items-start space-x-3 p-5 bg-rose-950/20 border border-rose-900/30 rounded-2xl">
          <AlertCircle className="h-5 w-5 text-rose-500 mt-0.5 flex-shrink-0" />
          <div className="space-y-1">
            <p className="text-sm font-bold text-rose-400">Failed to Load Saved Dashboards</p>
            <p className="text-xs text-muted leading-relaxed font-mono font-medium">{error}</p>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && dashboards.length === 0 && (
        <div className="text-center py-20 px-6 bg-surface border border-surface-light rounded-2xl max-w-xl mx-auto space-y-5 shadow-glow-accent">
          <div className="h-14 w-14 rounded-2xl bg-surface-light/40 border border-surface-light flex items-center justify-center mx-auto text-muted shadow-inner">
            <LayoutDashboard className="h-7 w-7 text-accent-light" />
          </div>
          <div className="space-y-2">
            <h3 className="font-display text-lg font-bold text-white uppercase tracking-wider">No saved dashboards yet</h3>
            <p className="text-sm text-muted max-w-md mx-auto leading-relaxed font-semibold">
              Start by uploading your CSV/Excel files and building visualizations. Once you are satisfied, click &quot;Save Dashboard&quot; to list them here!
            </p>
          </div>
          <div className="pt-2">
            <Link
              href="/"
              className="inline-flex items-center space-x-2 px-5.5 py-3 bg-accent hover:bg-accent-light text-white font-extrabold rounded-xl text-sm transition-all duration-300 shadow-glow-accent hover:shadow-glow-secondary focus-visible:ring-2 focus-visible:ring-secondary focus-visible:outline-none"
            >
              <FileSpreadsheet className="h-4 w-4" />
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
                className="group bg-surface border border-surface-light hover:border-accent-light/40 rounded-2xl p-6 transition-all duration-300 flex flex-col justify-between shadow-xl relative overflow-hidden hover:shadow-glow-accent focus-visible:ring-2 focus-visible:ring-secondary focus-visible:outline-none"
              >
                <div className="space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="font-display font-extrabold text-lg text-white leading-snug group-hover:text-accent-light transition-colors truncate max-w-[85%]" title={dash.title || "Untitled Dashboard"}>
                      {dash.title || "Untitled Dashboard"}
                    </h3>
                    <div className="text-muted group-hover:text-accent-light transition-colors">
                      <ExternalLink className="h-4.5 w-4.5" />
                    </div>
                  </div>

                  <p className="text-xs text-muted font-bold">
                    Saved {formatRelativeDate(dash.created_at)}
                  </p>

                  <div className="flex flex-wrap gap-2 pt-2">
                    <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-lg bg-background border border-surface-light text-xs font-bold text-foreground font-sans">
                      <FileSpreadsheet className="h-3.5 w-3.5 text-success" />
                      <span>{columnsCount} Columns</span>
                    </span>
                    <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-lg bg-background border border-surface-light text-xs font-bold text-foreground font-sans">
                      <span>{rowsCount.toLocaleString()} Rows</span>
                    </span>
                  </div>
                </div>

                <div className="pt-6 border-t border-surface-light/60 mt-6 flex justify-between items-center text-xs">
                  <span className="text-[10px] text-muted/60 font-mono select-all">ID: {dash.id.slice(0, 8)}...</span>
                  <button
                    onClick={(e) => handleDeleteClick(dash.id, e)}
                    className="flex items-center space-x-1 px-3 py-1.5 bg-rose-950/20 hover:bg-rose-900/40 text-rose-400 border border-rose-900/30 hover:border-rose-900/50 rounded-xl font-bold transition-all duration-300 focus-visible:ring-2 focus-visible:ring-secondary focus-visible:outline-none"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 animate-fade-in backdrop-blur-sm">
          <div className="bg-surface border border-surface-light rounded-2xl p-6 w-full max-sm:max-w-sm max-w-md shadow-2xl space-y-5 animate-scale-up relative">
            <button
              onClick={() => setDeleteId(null)}
              className="absolute top-4 right-4 text-muted hover:text-white transition focus-visible:ring-2 focus-visible:ring-secondary focus-visible:outline-none rounded p-1"
            >
              <X className="h-4 w-4" />
            </button>
            <div className="text-center py-2 space-y-4">
              <div className="h-12 w-12 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-full flex items-center justify-center mx-auto shadow-glow-secondary animate-pulse">
                <Trash2 className="h-6 w-6" />
              </div>
              <div className="space-y-1">
                <h3 className="font-display text-base font-extrabold text-white">Delete Saved Dashboard?</h3>
                <p className="text-xs text-muted px-2 leading-relaxed font-semibold">
                  Are you absolutely sure you want to delete this dashboard? This action cannot be undone, and all associated chat history will be permanently deleted.
                </p>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                disabled={deleting}
                onClick={() => setDeleteId(null)}
                className="flex-1 py-2.5 bg-background hover:bg-surface-light border border-surface-light text-muted hover:text-white rounded-xl text-xs font-bold transition-all duration-300 focus-visible:ring-2 focus-visible:ring-secondary focus-visible:outline-none"
              >
                Cancel
              </button>
              <button
                disabled={deleting}
                onClick={confirmDelete}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-500 disabled:bg-surface-light text-white rounded-xl text-xs font-extrabold transition-all duration-300 flex items-center justify-center space-x-1.5 focus-visible:ring-2 focus-visible:ring-secondary focus-visible:outline-none shadow-glow-accent"
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
