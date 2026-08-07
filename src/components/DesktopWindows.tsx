"use client";

import React, { useState, useEffect } from "react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Upload, RefreshCw, AlertCircle } from "lucide-react";

interface DesktopWindowsProps {
  isDragging: boolean;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;
  onBrowseClick: () => void;
  isPending: boolean;
  error: string | null;
}

// Sample Data for Real AreaChart View
const SAMPLE_CHART_DATA = [
  { quarter: "Q1", revenue: 12500 },
  { quarter: "Q2", revenue: 18400 },
  { quarter: "Q3", revenue: 26100 },
  { quarter: "Q4", revenue: 42300 },
];

export default function DesktopWindows({
  isDragging,
  onDragOver,
  onDragLeave,
  onDrop,
  onBrowseClick,
  isPending,
  error,
}: DesktopWindowsProps) {
  const [chatStep, setChatStep] = useState(0);

  // Scripted Chat Q&A sequence Loop
  useEffect(() => {
    const timer = setInterval(() => {
      setChatStep((prev) => (prev + 1) % 4);
    }, 4500);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="w-full relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-6 pt-16">

      {/* WINDOW 1: upload.sh (Dropzone Command Prompter) */}
      <div className="lg:col-span-5 flex flex-col h-[320px] bg-surface border border-border rounded-lg overflow-hidden shadow-md">
        {/* Window Chrome Titlebar */}
        <div className="px-3 py-2 bg-surface-subtle border-b border-border flex items-center justify-between font-mono select-none">
          <div className="flex items-center space-x-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-border" />
            <span className="w-2.5 h-2.5 rounded-full bg-border" />
            <span className="w-2.5 h-2.5 rounded-full bg-border" />
          </div>
          <span className="text-[10px] text-muted uppercase font-bold tracking-wider">upload.sh</span>
          <div className="w-10" />
        </div>

        {/* Window Content */}
        <div
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
          onClick={onBrowseClick}
          className={`flex-1 flex flex-col items-center justify-center p-6 text-center cursor-pointer transition-all duration-300 font-mono ${
            isDragging
              ? "bg-accent/10 border-2 border-dashed border-accent scale-[0.98]"
              : "hover:bg-surface-subtle/50"
          }`}
        >
          <div className="h-10 w-10 bg-background border border-border rounded-lg flex items-center justify-center text-accent shadow-sm mb-4">
            <Upload className="h-4.5 w-4.5" />
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-center space-x-1.5 text-xs text-foreground font-bold">
              <span className="text-accent">&gt;</span>
              <span>drag &amp; drop file here</span>
            </div>
            <p className="text-[10px] text-muted">
              or <span className="text-accent underline font-semibold">browse your system</span>
            </p>
          </div>

          <p className="text-[9px] text-muted/60 mt-6 uppercase tracking-wider font-semibold">
            CSV / XLSX / XLS • Max 5MB
          </p>

          {isPending && (
            <div className="mt-4 flex items-center space-x-2 text-[10px] text-accent">
              <RefreshCw className="h-3.5 w-3.5 animate-spin" />
              <span>Parsing columns...</span>
            </div>
          )}

          {error && (
            <div className="mt-4 flex items-start space-x-2 text-left p-2.5 bg-rose-500/10 border border-rose-500/20 rounded-lg text-[9px] text-rose-500 max-w-xs">
              <AlertCircle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}
        </div>
      </div>

      {/* WINDOW 2: dashboard.preview (Real AreaChart) */}
      <div className="lg:col-span-4 flex flex-col h-[320px] bg-surface border border-border rounded-lg overflow-hidden shadow-md">
        {/* Window Chrome Titlebar */}
        <div className="px-3 py-2 bg-surface-subtle border-b border-border flex items-center justify-between font-mono select-none">
          <div className="flex items-center space-x-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-border" />
            <span className="w-2.5 h-2.5 rounded-full bg-border" />
            <span className="w-2.5 h-2.5 rounded-full bg-border" />
          </div>
          <span className="text-[10px] text-muted uppercase font-bold tracking-wider">dashboard.preview</span>
          <div className="w-10" />
        </div>

        {/* Window Content */}
        <div className="flex-1 p-4 flex flex-col justify-between select-none">
          <div>
            <span className="text-[9px] font-mono uppercase font-bold text-muted block tracking-wider">Quarterly Revenue Trend</span>
            <span className="text-sm font-bold text-foreground mt-0.5 block">$42,300.00 YTD</span>
          </div>

          <div className="h-36 w-full text-[9px] font-mono mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={SAMPLE_CHART_DATA} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis
                  dataKey="quarter"
                  stroke="var(--text-secondary)"
                  tickLine={false}
                  axisLine={false}
                  dy={6}
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
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
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
                  fill="url(#colorRevenue)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="text-[9px] font-mono text-muted/70 text-right mt-2">
            Static dataset snapshot
          </div>
        </div>
      </div>

      {/* WINDOW 3: ai-analyst.chat (Pre-scripted conversation log) */}
      <div className="lg:col-span-3 flex flex-col h-[320px] bg-[#141210] border border-border rounded-lg overflow-hidden shadow-md font-mono text-[10px]">
        {/* Window Chrome Titlebar */}
        <div className="px-3 py-2 bg-surface-subtle border-b border-border flex items-center justify-between select-none">
          <div className="flex items-center space-x-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-border" />
            <span className="w-2.5 h-2.5 rounded-full bg-border" />
            <span className="w-2.5 h-2.5 rounded-full bg-border" />
          </div>
          <span className="text-[10px] text-muted uppercase font-bold tracking-wider">ai-analyst.chat</span>
          <div className="w-10" />
        </div>

        {/* Window Content */}
        <div className="flex-1 p-4 flex flex-col justify-between overflow-y-auto leading-relaxed text-emerald-400">
          <div className="space-y-3">
            {/* Command prompt initial */}
            <div className="flex items-start space-x-1">
              <span className="text-[#38bdf8] shrink-0">$</span>
              <span>ask: which region has the highest sales revenue?</span>
            </div>

            {/* Step 1: generating */}
            {chatStep >= 1 && (
              <div className="text-[#38bdf8]/70 flex items-center space-x-1.5">
                <RefreshCw className="h-3 w-3 animate-spin" />
                <span>translating to analytical SQL query...</span>
              </div>
            )}

            {/* Step 2: Query output */}
            {chatStep >= 2 && (
              <div className="bg-[#1e1c1a] p-2 rounded text-white border border-[#38bdf8]/10 text-[9px] font-mono leading-normal whitespace-pre">
                {`SELECT region, SUM(sales) as revenue\nFROM dataset\nGROUP BY 1 ORDER BY 2 DESC LIMIT 1;`}
              </div>
            )}

            {/* Step 3: Explanation output */}
            {chatStep >= 3 && (
              <div className="text-white border-l-2 border-emerald-500 pl-2">
                The <strong className="text-emerald-400">North America</strong> region generated the highest sales revenue at <strong className="text-[#00ff66]">$248,500</strong>.
              </div>
            )}
          </div>

          <div className="text-[8px] text-emerald-500/40 text-right mt-4">
            Pre-scripted feature preview
          </div>
        </div>
      </div>

    </div>
  );
}
