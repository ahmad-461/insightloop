"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { BarChart3, Mail, Globe, ArrowUpRight, Sparkles, Database } from "lucide-react";

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
    {
      name: "Next.js",
      color: "text-white",
      icon: (
        <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 fill-none stroke-current" strokeWidth="1.5">
          <circle cx="12" cy="12" r="10" />
          <path d="M8 16V8l8 8" />
          <path d="M16 8v8" />
        </svg>
      ),
    },
    {
      name: "TypeScript",
      color: "text-blue-400",
      icon: (
        <svg viewBox="0 0 24 24" className="h-3.5 w-3.5">
          <rect x="3" y="3" width="18" height="18" rx="2" fill="#0f172a" stroke="currentColor" strokeWidth="1.5" />
          <text x="6" y="15" fill="currentColor" fontSize="10" fontWeight="bold" fontFamily="monospace">
            TS
          </text>
        </svg>
      ),
    },
    {
      name: "Gemini API",
      color: "text-purple-400",
      icon: <Sparkles className="h-3.5 w-3.5" />,
    },
    {
      name: "Supabase",
      color: "text-emerald-400",
      icon: <Database className="h-3.5 w-3.5" />,
    },
    {
      name: "DuckDB-WASM",
      color: "text-amber-400",
      icon: <BarChart3 className="h-3.5 w-3.5" />,
    },
  ];

  return (
    <footer className="relative w-full border-t border-surface-light bg-background/80 backdrop-blur-md text-muted pt-16 pb-8 px-6 select-none overflow-hidden">
      {/* Option C: Background grid + large decorative node connection shape */}
      <div className="absolute inset-0 pointer-events-none opacity-10">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: "radial-gradient(#121b2e 1.5px, transparent 1.5px)",
            backgroundSize: "24px 24px",
          }}
        />
      </div>

      {/* Large decorative node connector SVG (ultra-low opacity, matches brand logo theme) */}
      <svg
        className="absolute -right-24 -bottom-24 h-[450px] w-[450px] text-secondary/5 pointer-events-none select-none opacity-40"
        viewBox="0 0 100 100"
        fill="none"
        stroke="currentColor"
        strokeWidth="0.5"
      >
        <circle cx="50" cy="50" r="40" strokeDasharray="4 4" />
        <circle cx="50" cy="50" r="25" strokeDasharray="2 2" />
        <circle cx="50" cy="50" r="5" fill="currentColor" className="opacity-20" />
        <line x1="50" y1="50" x2="20" y2="20" />
        <line x1="50" y1="50" x2="80" y2="20" />
        <line x1="50" y1="50" x2="80" y2="80" />
        <line x1="50" y1="50" x2="20" y2="80" />
        <circle cx="20" cy="20" r="2.5" fill="currentColor" />
        <circle cx="80" cy="20" r="2.5" fill="currentColor" />
        <circle cx="80" cy="80" r="2.5" fill="currentColor" />
        <circle cx="20" cy="80" r="2.5" fill="currentColor" />
      </svg>

      <div className="max-w-7xl mx-auto space-y-12 relative z-10">
        {/* Asymmetric Two-Sided Layout (6 cols brand, 6 cols menus & tech) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8">
          {/* Brand/Tagline Block (Asymmetry - Left side, larger & bold visual anchor) */}
          <div className="lg:col-span-6 space-y-6">
            <Link
              href="/"
              className="inline-flex items-center space-x-3 hover:opacity-90 transition group focus-visible:ring-2 focus-visible:ring-secondary focus-visible:outline-none rounded-lg p-1"
            >
              {/* Premium geometric Node Graph brand icon */}
              <div className="bg-accent/10 p-2.5 rounded-xl border border-accent/20 group-hover:border-secondary-light/40 transition-all duration-300 shadow-glow-accent group-hover:shadow-glow-secondary">
                <svg
                  viewBox="0 0 24 24"
                  className="h-5.5 w-5.5 text-accent-light"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
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
                    className="opacity-50"
                  />
                  <circle cx="4" cy="18" r="3" fill="#080d1a" stroke="#06b6d4" strokeWidth="2" />
                  <circle cx="11" cy="6" r="3" fill="#080d1a" stroke="#3b82f6" strokeWidth="2" />
                  <circle cx="20" cy="12" r="3" fill="#080d1a" stroke="#10b981" strokeWidth="2" />
                </svg>
              </div>
              <span className="font-display font-extrabold text-2xl tracking-tight text-white bg-gradient-to-r from-white via-foreground to-secondary bg-clip-text">
                InsightLoop
              </span>
            </Link>

            <p className="text-sm font-semibold max-w-lg leading-relaxed text-muted font-sans">
              Secure, AI-powered business intelligence directly in your browser. Upload spreadsheets, run local DuckDB analytics, and converse with an AI co-pilot instantly.
            </p>

            {/* Elevated "Built by Ahmad Khan" brand credit block inside left side visual anchor */}
            <div className="pt-2">
              <span className="text-[11px] uppercase font-extrabold text-muted/60 tracking-wider block mb-2">
                Engineering & Design
              </span>
              <a
                href="https://ahmad-khan-build-ship-iterate-xi.vercel.app"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center space-x-2 px-4 py-2.5 bg-surface/60 hover:bg-surface-light border border-surface-light hover:border-secondary/40 rounded-xl transition duration-300 text-xs font-bold text-white shadow-glow-accent group focus-visible:ring-2 focus-visible:ring-secondary focus-visible:outline-none"
              >
                <span>Ahmad Khan — Portfolio</span>
                <ArrowUpRight className="h-3.5 w-3.5 text-secondary group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </a>
            </div>
          </div>

          {/* Right Side compact grid - Col 2 & Col 3 merged into structured layout */}
          <div className="lg:col-span-6 grid grid-cols-1 sm:grid-cols-2 gap-8 lg:gap-4 lg:pl-8">
            {/* Column 1: Quick Links */}
            <div className="space-y-4">
              <h4 className="text-xs uppercase font-extrabold tracking-widest text-white border-b border-surface-light pb-2">
                Navigation
              </h4>
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
                  <span>GitHub Repository</span>
                  <ArrowUpRight className="h-3 w-3 text-secondary" />
                </a>
              </nav>
            </div>

            {/* Column 2: Tech Badges with Premium Custom Icons */}
            <div className="space-y-4">
              <h4 className="text-xs uppercase font-extrabold tracking-widest text-white border-b border-surface-light pb-2">
                Built With
              </h4>
              <div className="flex flex-col space-y-2">
                {techBadges.map((tech) => (
                  <div
                    key={tech.name}
                    className="flex items-center space-x-3 px-3 py-2 bg-surface/50 border border-surface-light hover:border-secondary/30 hover:bg-surface-light/35 transition rounded-xl text-xs font-bold text-foreground shadow-sm"
                  >
                    <div className={`${tech.color} shrink-0`}>{tech.icon}</div>
                    <span className="text-muted/90">{tech.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar separator */}
        <div className="border-t border-surface-light/60 pt-8 flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Secondary Details */}
          <div className="text-xs text-muted/60 font-bold text-center md:text-left space-y-1">
            <p>Designed and built entirely client-side with full secure browser sandboxing.</p>
            <p>All data and metadata rows remain local unless explicitly synced by the user.</p>
          </div>

          {/* Social Links & Copyright */}
          <div className="flex flex-wrap items-center justify-center gap-4">
            {/* GitHub Profile */}
            <a
              href="https://github.com/ahmad-461"
              target="_blank"
              rel="noopener noreferrer"
              className="p-2.5 bg-surface hover:bg-surface-light border border-surface-light hover:border-secondary/40 text-muted hover:text-white rounded-xl transition focus-visible:ring-2 focus-visible:ring-secondary focus-visible:outline-none shadow-sm"
              title="GitHub Profile"
            >
              {/* Fallback svg icon for Github to prevent Lucide-react export issues */}
              <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24">
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482C19.138 20.193 22 16.44 22 12.017 22 6.484 17.522 2 12 2z"
                />
              </svg>
            </a>

            {/* Portfolio Website */}
            <a
              href="https://ahmad-khan-build-ship-iterate-xi.vercel.app"
              target="_blank"
              rel="noopener noreferrer"
              className="p-2.5 bg-surface hover:bg-surface-light border border-surface-light hover:border-secondary/40 text-muted hover:text-white rounded-xl transition focus-visible:ring-2 focus-visible:ring-secondary focus-visible:outline-none shadow-sm"
              title="Portfolio Website"
            >
              <Globe className="h-4 w-4" />
            </a>

            {/* Email Contact */}
            <a
              href="mailto:contact@example.com"
              className="p-2.5 bg-surface hover:bg-surface-light border border-surface-light hover:border-secondary/40 text-muted hover:text-white rounded-xl transition focus-visible:ring-2 focus-visible:ring-secondary focus-visible:outline-none shadow-sm"
              title="Email Ahmad Khan"
            >
              <Mail className="h-4 w-4" />
            </a>

            <div className="text-[11px] text-muted/50 font-semibold pl-4 border-l border-surface-light/60">
              © {new Date().getFullYear()} InsightLoop. Ahmad Khan.
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
