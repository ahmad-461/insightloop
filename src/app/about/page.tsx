import React from "react";
import { Info, HelpCircle, Cpu, ShieldCheck, CodeXml, Award } from "lucide-react";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "About the Builder & Platform | InsightLoop",
  description: "Learn about the local-first architecture of InsightLoop, engineered by developer Ahmad Khan using DuckDB-WASM, Google Gemini, and Supabase.",
  authors: [{ name: "Ahmad Khan" }],
  publisher: "Ahmad Khan",
  alternates: {
    canonical: "https://insightloop.vercel.app/about",
  },
};

function GithubIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/>
    </svg>
  );
}

export default function AboutPage() {
  const personSchema = {
    "@context": "https://schema.org",
    "@type": "Person",
    "name": "Ahmad Khan",
    "jobTitle": "Computer Science Student & Full Stack Software Developer",
    "url": "https://github.com/ahmad-461",
    "sameAs": [
      "https://github.com/ahmad-461",
      "https://github.com/ahmad-461/insightloop"
    ]
  };

  return (
    <div className="flex-1 w-full max-w-4xl mx-auto px-6 py-12 space-y-12 animate-fade-in relative z-10">
      {/* JSON-LD Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(personSchema) }}
      />

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

      {/* About the Builder (Genuine EEAT section) */}
      <section className="bg-surface border border-border rounded-2xl p-6 sm:p-8 space-y-6 shadow-sm">
        <h2 className="text-base font-bold text-foreground flex items-center space-x-2">
          <Award className="h-4 w-4 text-accent" />
          <span>About the Builder</span>
        </h2>
        <div className="text-xs sm:text-sm text-muted leading-relaxed space-y-4 font-normal">
          <p>
            InsightLoop was designed, engineered, and optimized single-handedly by <strong>Ahmad Khan</strong>, an aspiring Computer Science student and software engineer deeply focused on secure data processing, local-first web applications, and generative AI compilation pipelines.
          </p>
          <p>
            Developed as a high-fidelity portfolio and engineering project, InsightLoop serves to demonstrate key architecture solutions:
          </p>
          <ul className="list-disc list-inside space-y-2 pl-2">
            <li>
              <strong>Client-Side SQL Processing:</strong> Integrating DuckDB-WASM lazily to execute analytics queries at close to native speeds directly in the browser sandboxed environment.
            </li>
            <li>
              <strong>AI Text-to-SQL Self-Healing Pipeline:</strong> Engineering robust query interfaces using the official Google Gemini 2.5 Flash SDK, complete with a client-side self-correction and retry mechanism when SQL errors are compiled.
            </li>
            <li>
              <strong>Serverless Statistical Computations:</strong> Linking serverless Python endpoints to execute secure Outlier Detection, Regression Forecasting, and Correlation matrices without keeping or saving user records.
            </li>
          </ul>

          <div className="pt-4 flex flex-wrap gap-4 items-center border-t border-border/60">
            <a
              href="https://github.com/ahmad-461"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center space-x-2 px-4 py-2 bg-background hover:bg-surface-subtle border border-border rounded-lg text-xs font-semibold text-foreground transition focus-visible:ring-2 focus-visible:ring-accent"
            >
              <GithubIcon className="h-4 w-4 text-muted" />
              <span>Ahmad&apos;s GitHub Profile</span>
            </a>
            <a
              href="https://github.com/ahmad-461/insightloop"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center space-x-2 px-4 py-2 bg-background hover:bg-surface-subtle border border-border rounded-lg text-xs font-semibold text-foreground transition focus-visible:ring-2 focus-visible:ring-accent"
            >
              <CodeXml className="h-4 w-4 text-muted" />
              <span>InsightLoop Source Code</span>
            </a>
          </div>
        </div>
      </section>

      {/* Privacy & Data Handling Section */}
      <section className="bg-surface border border-border rounded-2xl p-6 sm:p-8 space-y-4 shadow-sm">
        <h2 className="text-base font-bold text-foreground flex items-center space-x-2">
          <ShieldCheck className="h-4 w-4 text-accent" />
          <span>Privacy & Data Handling Commitment</span>
        </h2>
        <div className="text-xs sm:text-sm text-muted leading-relaxed space-y-4 font-normal">
          <p>
            Trustworthiness is our core foundational architecture. We guarantee the following data privacy policies, validated directly by our open-source codebase:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <div className="p-4 bg-background border border-border rounded-xl space-y-1.5">
              <h4 className="text-xs font-bold text-foreground">In-Memory Execution Only</h4>
              <p className="text-[11px] text-muted">
                Your uploaded CSV and Excel data is processed strictly inside your temporary browser tab memory. It is never uploaded, persisted, or written to any remote cloud disk.
              </p>
            </div>
            <div className="p-4 bg-background border border-border rounded-xl space-y-1.5">
              <h4 className="text-xs font-bold text-foreground">Metadata-Only AI Inferences</h4>
              <p className="text-[11px] text-muted">
                When querying the AI Co-Pilot, we only transmit column names and data types (schema) to the serverless Gemini endpoint. Raw spreadsheet rows are never sent to the AI model.
              </p>
            </div>
            <div className="p-4 bg-background border border-border rounded-xl space-y-1.5">
              <h4 className="text-xs font-bold text-foreground">Layout-Only Persistence</h4>
              <p className="text-[11px] text-muted">
                When saving a dashboard layout, only your customized widget configurations, SQL statements, and column display schemas are saved to Supabase. Raw dataset cells are never synchronized.
              </p>
            </div>
            <div className="p-4 bg-background border border-border rounded-xl space-y-1.5">
              <h4 className="text-xs font-bold text-foreground">No Subscriptions or Tracking</h4>
              <p className="text-[11px] text-muted">
                We do not track you, sell advertising, or require any registration. Access is anonymous and managed using a highly secure client-side cookie rotation.
              </p>
            </div>
          </div>
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
