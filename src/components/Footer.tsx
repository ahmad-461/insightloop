"use client";

import React from "react";
import Link from "next/link";
import { Mail, ArrowUp } from "lucide-react";

export default function Footer() {
  const scrollToTop = () => {
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  return (
    <footer className="w-full border-t border-border bg-gradient-to-b from-background to-surface/40 text-muted py-14 px-6 select-none relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-radial from-accent/5 via-transparent to-transparent pointer-events-none opacity-40" />
      <div className="max-w-7xl mx-auto space-y-12 relative z-10">

        {/* Genuine editorial style 2-column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-start">

          {/* Left Column: Brand Logo, Description, Tagline, Credit */}
          <div className="lg:col-span-7 space-y-5">
            <Link
              href="/"
              className="inline-flex items-center space-x-2.5 hover:opacity-90 transition group focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none rounded-lg p-1"
            >
              <div className="p-1.5 rounded-lg border border-border text-accent bg-surface transition-colors duration-200">
                <svg
                  viewBox="0 0 24 24"
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="4" y1="18" x2="11" y2="6" stroke="currentColor" strokeWidth="1.5" />
                  <line x1="11" y1="6" x2="20" y2="12" stroke="currentColor" strokeWidth="1.5" />
                  <line
                    x1="4"
                    y1="18"
                    x2="20"
                    y2="12"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeDasharray="3 2"
                    className="opacity-40"
                  />
                  <circle cx="4" cy="18" r="2.5" fill="var(--bg)" stroke="currentColor" strokeWidth="2.5" />
                  <circle cx="11" cy="6" r="2.5" fill="var(--bg)" stroke="currentColor" strokeWidth="2.5" />
                  <circle cx="20" cy="12" r="2.5" fill="var(--bg)" stroke="currentColor" strokeWidth="2.5" />
                </svg>
              </div>
              <span className="font-sans font-bold text-base tracking-tight text-foreground">
                InsightLoop
              </span>
            </Link>

            <p className="text-xs font-normal max-w-md leading-relaxed text-muted">
              Secure, AI-powered business intelligence directly in your browser. Upload spreadsheets, run local DuckDB analytics, and converse with an AI co-pilot instantly.
            </p>

            <div className="pt-2 text-xs font-semibold text-foreground/80 flex flex-col gap-1.5">
              <span className="text-[10px] uppercase font-extrabold text-muted/60 tracking-wider">
                Platform Authority
              </span>
              <p className="text-xs text-muted font-normal max-w-sm">
                Ahmad Khan. Professional product design & engineering. Built with a commitment to raw data privacy.
              </p>
            </div>
          </div>

          {/* Right Column: Compact organized quick links */}
          <div className="lg:col-span-5 grid grid-cols-2 gap-8 lg:gap-12">

            <div className="space-y-3">
              <h4 className="text-[10px] uppercase font-extrabold tracking-wider text-foreground">
                Product Quick Links
              </h4>
              <nav className="flex flex-col space-y-2.5 text-xs font-semibold">
                <Link
                  href="/"
                  className="text-muted hover:text-foreground transition-colors focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none rounded self-start"
                >
                  Home
                </Link>
                <Link
                  href="/dashboards"
                  className="text-muted hover:text-foreground transition-colors focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none rounded self-start"
                >
                  Dashboards
                </Link>
                <Link
                  href="/#how-it-works"
                  className="text-muted hover:text-foreground transition-colors focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none rounded self-start"
                >
                  How It Works
                </Link>
                <Link
                  href="/#upload-zone"
                  className="text-muted hover:text-foreground transition-colors focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none rounded self-start"
                >
                  Upload Data
                </Link>
              </nav>
            </div>

            <div className="space-y-3">
              <h4 className="text-[10px] uppercase font-extrabold tracking-wider text-foreground">
                Inquiries
              </h4>
              <div className="text-xs">
                <p className="text-muted leading-relaxed font-normal mb-2">
                  Have questions, custom requirements or enterprise feedback?
                </p>
                <a
                  href="mailto:ahmad.khan@example.com?subject=Inquiry%20about%20InsightLoop"
                  className="text-accent hover:underline font-semibold focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none rounded truncate block"
                >
                  ahmad.khan@example.com
                </a>
              </div>
            </div>

          </div>
        </div>

        {/* Elegant Bottom Divider */}
        <div className="border-t border-border/80 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-[10px] text-muted leading-relaxed text-center sm:text-left">
            <p>Designed and built entirely client-side. All data rows remain local unless explicitly synced.</p>
          </div>

          <div className="flex items-center space-x-4">

            {/* Keeping only Mail and Back-to-Top button */}
            <a
              href="mailto:ahmad.khan@example.com?subject=Inquiry%20about%20InsightLoop"
              className="p-1.5 text-muted hover:text-foreground hover:bg-surface border border-transparent hover:border-border rounded-lg transition-colors focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
              title="Email Ahmad Khan"
            >
              <Mail className="h-3.5 w-3.5" />
            </a>

            <button
              onClick={scrollToTop}
              className="p-1.5 text-muted hover:text-foreground hover:bg-surface border border-transparent hover:border-border rounded-lg transition-colors focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none flex items-center justify-center"
              title="Back to Top"
            >
              <ArrowUp className="h-3.5 w-3.5" />
            </button>

            <div className="text-[10px] text-muted/50 font-semibold pl-3 border-l border-border">
              © {new Date().getFullYear()} InsightLoop. All rights reserved.
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
