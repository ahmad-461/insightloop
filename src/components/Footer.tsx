"use client";

import React from "react";
import Link from "next/link";
import { Mail, Globe, ArrowUpRight } from "lucide-react";

export default function Footer() {
  return (
    <footer className="w-full border-t border-border bg-background text-muted py-12 px-6 select-none relative overflow-hidden">
      <div className="max-w-7xl mx-auto space-y-10 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* Brand/Tagline Block */}
          <div className="lg:col-span-8 space-y-4">
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

            <p className="text-xs font-normal max-w-xl leading-relaxed text-muted">
              Secure, AI-powered business intelligence directly in your browser. Upload spreadsheets, run local DuckDB analytics, and converse with an AI co-pilot instantly.
            </p>

            {/* Portfolio credit styled as clean hairline secondary button */}
            <div className="pt-2">
              <span className="text-[10px] uppercase font-bold text-muted/60 tracking-wider block mb-2">
                Engineering & Design
              </span>
              <a
                href="https://ahmad-khan-build-ship-iterate-xi.vercel.app"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-surface hover:bg-surface-subtle border border-border rounded-lg transition-colors text-xs font-semibold text-foreground group focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
              >
                <span>Ahmad Khan — Portfolio</span>
                <ArrowUpRight className="h-3.5 w-3.5 text-muted group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </a>
            </div>
          </div>

          {/* Right Side navigation links only (badges removed) */}
          <div className="lg:col-span-4 lg:pl-8 flex flex-col justify-start">
            <div className="space-y-3">
              <h4 className="text-[10px] uppercase font-bold tracking-wider text-foreground">
                Navigation
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
                  My Dashboards
                </Link>
                <a
                  href="https://github.com/ahmad-461/insightloop"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center space-x-1 text-muted hover:text-foreground transition-colors focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none rounded self-start"
                >
                  <span>GitHub Repository</span>
                  <ArrowUpRight className="h-3 w-3" />
                </a>
              </nav>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-border pt-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="text-[10px] text-muted leading-relaxed text-center md:text-left">
            <p>Designed and built entirely client-side. All data rows remain local unless synced.</p>
          </div>

          <div className="flex items-center space-x-3 text-xs">
            {/* Social Icons */}
            <a
              href="https://github.com/ahmad-461"
              target="_blank"
              rel="noopener noreferrer"
              className="p-1.5 text-muted hover:text-foreground hover:bg-surface border border-transparent hover:border-border rounded-lg transition-colors focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
              title="GitHub Profile"
            >
              <svg className="h-3.5 w-3.5 fill-current" viewBox="0 0 24 24">
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482C19.138 20.193 22 16.44 22 12.017 22 6.484 17.522 2 12 2z"
                />
              </svg>
            </a>

            <a
              href="https://ahmad-khan-build-ship-iterate-xi.vercel.app"
              target="_blank"
              rel="noopener noreferrer"
              className="p-1.5 text-muted hover:text-foreground hover:bg-surface border border-transparent hover:border-border rounded-lg transition-colors focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
              title="Portfolio Website"
            >
              <Globe className="h-3.5 w-3.5" />
            </a>

            <a
              href="mailto:contact@example.com"
              className="p-1.5 text-muted hover:text-foreground hover:bg-surface border border-transparent hover:border-border rounded-lg transition-colors focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
              title="Email Ahmad Khan"
            >
              <Mail className="h-3.5 w-3.5" />
            </a>

            <div className="text-[10px] text-muted/50 font-semibold pl-3 border-l border-border">
              © {new Date().getFullYear()} InsightLoop. Ahmad Khan.
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
