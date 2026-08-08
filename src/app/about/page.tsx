import React from "react";
import { Info, HelpCircle, Cpu, ShieldCheck } from "lucide-react";

export const metadata = {
  title: "About | InsightLoop",
  description: "Learn more about InsightLoop, why it was built, its technical architecture, and the secure client-side technologies powering it.",
};

export default function AboutPage() {
  return (
    <div className="flex-1 w-full max-w-4xl mx-auto px-6 py-12 space-y-12 animate-fade-in relative z-10">
      {/* Page Header */}
      <div className="space-y-4 text-center max-w-2xl mx-auto">
        <div className="inline-flex items-center space-x-2 bg-accent/10 border border-accent/20 px-3.5 py-1.5 rounded-full text-[10px] font-bold text-accent uppercase tracking-widest">
          <Info className="h-3.5 w-3.5" />
          <span>About InsightLoop</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-sans font-extrabold tracking-tight text-foreground">
          Secure, Browser-First Business Intelligence
        </h1>
        <p className="text-xs sm:text-sm text-muted leading-relaxed">
          InsightLoop was designed to solve a fundamental challenge in modern business intelligence: analyzing sensitive data quickly and visually without compromising data privacy.
        </p>
      </div>

      {/* Intro Section */}
      <section className="bg-surface border border-border rounded-2xl p-6 sm:p-8 space-y-4 shadow-sm">
        <h2 className="text-base font-bold text-foreground flex items-center space-x-2">
          <ShieldCheck className="h-4 w-4 text-accent" />
          <span>Why InsightLoop?</span>
        </h2>
        <div className="text-xs sm:text-sm text-muted leading-relaxed space-y-4 font-normal">
          <p>
            Standard BI tools require uploading spreadsheets to external cloud databases for ingestion, rendering, and reporting. For many organizations, analysts, and independent researchers, transferring sensitive records is either restricted by compliance or introduces unnecessary exposure.
          </p>
          <p>
            InsightLoop shifts the entire analytical pipeline directly to your local sandbox. By utilizing next-generation browser-based technologies, your raw spreadsheet data remains fully local in your browser memory. We sync only the layout metadata, manual column types, and chat session outlines to the cloud, ensuring raw dataset rows never leave your computer.
          </p>
        </div>
      </section>

      {/* How It Works Recap */}
      <section className="space-y-6">
        <div className="flex items-center space-x-2 border-b border-border pb-3">
          <HelpCircle className="h-4.5 w-4.5 text-accent" />
          <h2 className="text-sm font-bold text-foreground uppercase tracking-wider">How It Works</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-surface border border-border p-5 rounded-xl space-y-2">
            <span className="text-[10px] font-mono text-accent font-bold">01. Secure Parsing</span>
            <h3 className="text-xs font-bold text-foreground">Local Spreadsheet Ingestion</h3>
            <p className="text-xs text-muted leading-relaxed font-normal">
              Drag & drop CSV or Excel files. Parsed instantly in-browser with zero server-side storage.
            </p>
          </div>

          <div className="bg-surface border border-border p-5 rounded-xl space-y-2">
            <span className="text-[10px] font-mono text-accent font-bold">02. Instant Layouts</span>
            <h3 className="text-xs font-bold text-foreground">Automatic Dashboards</h3>
            <p className="text-xs text-muted leading-relaxed font-normal">
              Interactive visualizations, timelines, and metrics build themselves instantly based on your data columns.
            </p>
          </div>

          <div className="bg-surface border border-border p-5 rounded-xl space-y-2">
            <span className="text-[10px] font-mono text-accent font-bold">03. AI Co-Pilot</span>
            <h3 className="text-xs font-bold text-foreground">Conversational SQL</h3>
            <p className="text-xs text-muted leading-relaxed font-normal">
              Ask business questions in plain English. The AI generates safe SQL queries executed locally in your browser database.
            </p>
          </div>

          <div className="bg-surface border border-border p-5 rounded-xl space-y-2">
            <span className="text-[10px] font-mono text-accent font-bold">04. Export & Sync</span>
            <h3 className="text-xs font-bold text-foreground">PDF Reports & Reactivations</h3>
            <p className="text-xs text-muted leading-relaxed font-normal">
              Compile beautiful PDF reports locally, and save secure shareable configurations to revisit later.
            </p>
          </div>
        </div>
      </section>

      {/* Built With (Tech Stack) */}
      <section className="space-y-6">
        <div className="flex items-center space-x-2 border-b border-border pb-3">
          <Cpu className="h-4.5 w-4.5 text-accent" />
          <h2 className="text-sm font-bold text-foreground uppercase tracking-wider">Built With</h2>
        </div>
        <div className="bg-surface border border-border rounded-xl divide-y divide-border overflow-hidden">
          <div className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <span className="text-xs font-bold text-foreground font-mono">Next.js 15 & React 18</span>
            <span className="text-xs text-muted text-left sm:text-right font-normal">
              Powering a responsive, server-side rendered application with smooth client transitions and modern app routing.
            </span>
          </div>

          <div className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <span className="text-xs font-bold text-foreground font-mono">TypeScript</span>
            <span className="text-xs text-muted text-left sm:text-right font-normal">
              Ensuring strong type safety and robust development consistency across all components.
            </span>
          </div>

          <div className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <span className="text-xs font-bold text-foreground font-mono">Google Gemini 2.5 API</span>
            <span className="text-xs text-muted text-left sm:text-right font-normal">
              Translating natural language queries into safe, highly optimized analytical SQL on the fly.
            </span>
          </div>

          <div className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <span className="text-xs font-bold text-foreground font-mono">Supabase</span>
            <span className="text-xs text-muted text-left sm:text-right font-normal">
              Persisting non-sensitive layouts, configurations, and conversation flows safely with zero data row exposure.
            </span>
          </div>

          <div className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <span className="text-xs font-bold text-foreground font-mono">DuckDB-WASM</span>
            <span className="text-xs text-muted text-left sm:text-right font-normal">
              The high-performance, in-browser analytical database engine powering local-only SQL executions.
            </span>
          </div>

          <div className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <span className="text-xs font-bold text-foreground font-mono">Vercel</span>
            <span className="text-xs text-muted text-left sm:text-right font-normal">
              Providing low-latency hosting and hosting serverless Python endpoints for heavy statistical computations.
            </span>
          </div>
        </div>
      </section>

      {/* Credit Section */}
      <section className="text-center pt-4 border-t border-border">
        <p className="text-xs text-muted font-normal max-w-md mx-auto leading-relaxed">
          Designed, engineered, and built with high professional authority by Ahmad Khan. Built with a deep commitment to data privacy, performance, and responsive product execution.
        </p>
      </section>
    </div>
  );
}
