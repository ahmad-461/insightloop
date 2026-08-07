"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { BarChart3, Mail, Globe, ArrowUpRight } from "lucide-react";

export default function Footer() {
  const [reducedMotion, setReducedMotion] = useState(false);

  // Check prefers-reduced-motion
  useEffect(() => {
    if (typeof window === "undefined") return;
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mediaQuery.matches);
    const listener = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mediaQuery.addEventListener("change", listener);
    return () => mediaQuery.removeEventListener("change", listener);
  }, []);

  const handleScrollToWorks = (e: React.MouseEvent<HTMLAnchorElement>) => {
    // Only smooth scroll if on homepage
    if (window.location.pathname === "/") {
      e.preventDefault();
      const el = document.getElementById("how-it-works");
      if (el) {
        el.scrollIntoView({ behavior: reducedMotion ? "auto" : "smooth" });
      }
    }
  };

  const techBadges = [
    { name: "Next.js", color: "bg-white" },
    { name: "TypeScript", color: "bg-blue-400" },
    { name: "Gemini API", color: "bg-purple-400" },
    { name: "Supabase", color: "bg-emerald-400" },
    { name: "DuckDB-WASM", color: "bg-amber-400" },
  ];

  return (
    <footer className="w-full border-t border-surface-light bg-background/60 backdrop-blur-md text-muted pt-16 pb-8 px-6 select-none">
      <div className="max-w-7xl mx-auto space-y-12">
        {/* Three Column Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10">
          {/* Column 1: Logo & Tagline */}
          <div className="md:col-span-5 space-y-4">
            <Link
              href="/"
              className="inline-flex items-center space-x-3 hover:opacity-90 transition group focus-visible:ring-2 focus-visible:ring-secondary focus-visible:outline-none rounded-lg p-1"
            >
              <div className="bg-accent/10 p-2 rounded-xl border border-accent/20 group-hover:border-secondary-light/40 transition-all duration-300 shadow-glow-accent group-hover:shadow-glow-secondary">
                <BarChart3 className="h-5.5 w-5.5 text-accent-light" />
              </div>
              <span className="font-display font-extrabold text-xl tracking-tight text-white">
                InsightLoop
              </span>
            </Link>
            <p className="text-sm font-semibold max-w-sm leading-relaxed text-muted">
              Secure, AI-powered business intelligence directly in your browser. Upload spreadsheets, run local DuckDB analytics, and converse with an AI co-pilot instantly.
            </p>
          </div>

          {/* Column 2: Quick Links */}
          <div className="md:col-span-3 space-y-4">
            <h4 className="text-xs uppercase font-extrabold tracking-wider text-white">Quick Links</h4>
            <nav className="flex flex-col space-y-2.5 text-sm font-semibold">
              <Link
                href="/"
                className="hover:text-white transition-colors focus-visible:ring-2 focus-visible:ring-secondary focus-visible:outline-none rounded self-start py-0.5"
              >
                Home
              </Link>
              <Link
                href="/dashboards"
                className="hover:text-white transition-colors focus-visible:ring-2 focus-visible:ring-secondary focus-visible:outline-none rounded self-start py-0.5"
              >
                My Dashboards
              </Link>
              <Link
                href="/#how-it-works"
                onClick={handleScrollToWorks}
                className="hover:text-white transition-colors focus-visible:ring-2 focus-visible:ring-secondary focus-visible:outline-none rounded self-start py-0.5"
              >
                About
              </Link>
              <a
                href="https://github.com/ahmad-461/insightloop"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center space-x-1 hover:text-white transition-colors focus-visible:ring-2 focus-visible:ring-secondary focus-visible:outline-none rounded self-start py-0.5"
              >
                <span>GitHub Repo</span>
                <ArrowUpRight className="h-3 w-3" />
              </a>
            </nav>
          </div>

          {/* Column 3: Tech Badges */}
          <div className="md:col-span-4 space-y-4">
            <h4 className="text-xs uppercase font-extrabold tracking-wider text-white">Built With</h4>
            <div className="flex flex-wrap gap-2.5">
              {techBadges.map((tech) => (
                <div
                  key={tech.name}
                  className="flex items-center space-x-2 px-3 py-1.5 bg-surface border border-surface-light hover:border-muted/20 transition rounded-xl text-xs font-bold text-white shadow-glow-accent"
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${tech.color}`} />
                  <span>{tech.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom Bar separator */}
        <div className="border-t border-surface-light/60 pt-8 flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Portfolio & Built details */}
          <div className="flex flex-col sm:flex-row items-center sm:space-x-2.5 text-xs text-muted font-bold text-center sm:text-left">
            <span>Built by</span>
            <a
              href="https://ahmad-khan-build-ship-iterate-xi.vercel.app"
              target="_blank"
              rel="noopener noreferrer"
              className="text-secondary hover:text-secondary-light hover:underline transition-colors font-extrabold focus-visible:ring-2 focus-visible:ring-secondary focus-visible:outline-none rounded px-1 py-0.5"
            >
              Ahmad Khan
            </a>
            <span className="hidden sm:inline text-muted/40">·</span>
            <span>All rights reserved.</span>
          </div>

          {/* Social Links & Copyright */}
          <div className="flex items-center space-x-4">
            {/* GitHub */}
            <a
              href="https://github.com/ahmad-461"
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 bg-surface hover:bg-surface-light border border-surface-light text-muted hover:text-white rounded-xl transition focus-visible:ring-2 focus-visible:ring-secondary focus-visible:outline-none"
              title="GitHub Profile"
            >
              {/* Fallback svg icon for Github to prevent Lucide-react export issues */}
              <svg className="h-4.5 w-4.5 fill-current" viewBox="0 0 24 24">
                <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482C19.138 20.193 22 16.44 22 12.017 22 6.484 17.522 2 12 2z" />
              </svg>
            </a>

            {/* Portfolio Link */}
            <a
              href="https://ahmad-khan-build-ship-iterate-xi.vercel.app"
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 bg-surface hover:bg-surface-light border border-surface-light text-muted hover:text-white rounded-xl transition focus-visible:ring-2 focus-visible:ring-secondary focus-visible:outline-none"
              title="Portfolio Website"
            >
              <Globe className="h-4.5 w-4.5" />
            </a>

            {/* Email mailto */}
            <a
              href="mailto:contact@example.com"
              className="p-2 bg-surface hover:bg-surface-light border border-surface-light text-muted hover:text-white rounded-xl transition focus-visible:ring-2 focus-visible:ring-secondary focus-visible:outline-none"
              title="Email Ahmad Khan"
            >
              <Mail className="h-4.5 w-4.5" />
            </a>

            <div className="text-[11px] text-muted/50 font-semibold pl-2 border-l border-surface-light/60">
              © {new Date().getFullYear()} InsightLoop
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
