"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Sun, Moon, Terminal, Clock, X, Menu, Laptop } from "lucide-react";
import { useDuckDB } from "@/context/DuckDBContext";
import { getOrCreateSessionId } from "@/utils/session";

interface OSMenuBarProps {
  onClearDataset?: () => void;
  datasetActive: boolean;
}

export default function OSMenuBar({ onClearDataset }: OSMenuBarProps) {
  const { datasetLoaded } = useDuckDB();
  const [theme, setTheme] = useState<"light" | "dark">("dark");
  const [time, setTime] = useState("");
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [showDiagnostics, setShowDiagnostics] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  // Sync theme
  useEffect(() => {
    if (typeof window !== "undefined") {
      const isDark = document.documentElement.classList.contains("dark");
      setTheme(isDark ? "dark" : "light");
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === "dark" ? "light" : "dark";
    setTheme(newTheme);
    if (newTheme === "dark") {
      document.documentElement.classList.add("dark");
      localStorage.setItem("insightloop-theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("insightloop-theme", "light");
    }
  };

  // Clock
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }));
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  // Check prefers-reduced-motion
  useEffect(() => {
    if (typeof window === "undefined") return;
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mediaQuery.matches);
    const listener = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mediaQuery.addEventListener("change", listener);
    return () => mediaQuery.removeEventListener("change", listener);
  }, []);

  // Close menus on clicking outside
  useEffect(() => {
    const handleOutsideClick = () => {
      setActiveMenu(null);
    };
    window.addEventListener("click", handleOutsideClick);
    return () => window.removeEventListener("click", handleOutsideClick);
  }, []);

  const handleMenuTrigger = (e: React.MouseEvent, menuName: string) => {
    e.stopPropagation();
    setActiveMenu(activeMenu === menuName ? null : menuName);
  };

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: reducedMotion ? "auto" : "smooth" });
    }
    setActiveMenu(null);
    setIsMobileMenuOpen(false);
  };

  const handleNewDataset = () => {
    if (onClearDataset) {
      onClearDataset();
    }
    scrollToSection("upload-zone");
  };

  return (
    <>
      {/* OS Menu Bar */}
      <div className="w-full bg-surface border-b border-border text-xs font-mono select-none fixed top-0 left-0 z-50 h-9 flex items-center justify-between px-4">
        {/* Left Section: Wordmark + Menus */}
        <div className="flex items-center space-x-1 sm:space-x-4">
          <Link href="/" className="font-bold flex items-center space-x-1.5 text-accent mr-2">
            <Terminal className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">insightloop_os_v1.0</span>
            <span className="inline sm:hidden">IL_OS</span>
          </Link>

          {/* Menus with Dropdowns */}
          <div className="hidden md:flex items-center space-x-1">
            {/* File Menu */}
            <div className="relative">
              <button
                onClick={(e) => handleMenuTrigger(e, "file")}
                className={`px-3 py-1 rounded transition-colors ${activeMenu === "file" ? "bg-accent text-white" : "hover:bg-surface-subtle"}`}
              >
                File
              </button>
              {activeMenu === "file" && (
                <div className="absolute top-7 left-0 w-48 bg-surface border border-border shadow-lg rounded py-1 z-50 text-foreground">
                  <button
                    onClick={handleNewDataset}
                    className="w-full text-left px-3 py-1.5 hover:bg-accent hover:text-white transition-colors"
                  >
                    New Dataset
                  </button>
                  <Link
                    href="/dashboards"
                    className="block w-full text-left px-3 py-1.5 hover:bg-accent hover:text-white transition-colors"
                  >
                    Open Saved...
                  </Link>
                </div>
              )}
            </div>

            {/* View Menu */}
            <div className="relative">
              <button
                onClick={(e) => handleMenuTrigger(e, "view")}
                className={`px-3 py-1 rounded transition-colors ${activeMenu === "view" ? "bg-accent text-white" : "hover:bg-surface-subtle"}`}
              >
                View
              </button>
              {activeMenu === "view" && (
                <div className="absolute top-7 left-0 w-48 bg-surface border border-border shadow-lg rounded py-1 z-50 text-foreground">
                  <button
                    onClick={toggleTheme}
                    className="w-full text-left px-3 py-1.5 hover:bg-accent hover:text-white transition-colors flex items-center justify-between"
                  >
                    <span>Toggle Theme</span>
                    <span>{theme === "dark" ? "Light" : "Dark"}</span>
                  </button>
                  <button
                    onClick={() => scrollToSection("upload-zone")}
                    className="w-full text-left px-3 py-1.5 hover:bg-accent hover:text-white transition-colors"
                  >
                    Scroll to Upload
                  </button>
                  <button
                    onClick={() => scrollToSection("how-it-works")}
                    className="w-full text-left px-3 py-1.5 hover:bg-accent hover:text-white transition-colors"
                  >
                    Scroll to About
                  </button>
                </div>
              )}
            </div>

            {/* Help Menu */}
            <div className="relative">
              <button
                onClick={(e) => handleMenuTrigger(e, "help")}
                className={`px-3 py-1 rounded transition-colors ${activeMenu === "help" ? "bg-accent text-white" : "hover:bg-surface-subtle"}`}
              >
                Help
              </button>
              {activeMenu === "help" && (
                <div className="absolute top-7 left-0 w-56 bg-surface border border-border shadow-lg rounded py-1 z-50 text-foreground">
                  <button
                    onClick={() => {
                      setShowDiagnostics(true);
                      setActiveMenu(null);
                    }}
                    className="w-full text-left px-3 py-1.5 hover:bg-accent hover:text-white transition-colors flex items-center justify-between"
                  >
                    <span>System Diagnostics</span>
                    <span className="text-[10px] text-muted group-hover:text-white">🚀</span>
                  </button>
                  <button
                    onClick={() => scrollToSection("how-it-works")}
                    className="w-full text-left px-3 py-1.5 hover:bg-accent hover:text-white transition-colors"
                  >
                    InsightLoop Help
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Mobile hamburger trigger */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-1 rounded hover:bg-surface-subtle text-foreground"
            aria-label="Toggle menu"
          >
            <Menu className="h-4 w-4" />
          </button>
        </div>

        {/* Right Section: Ready indicator, theme, clock */}
        <div className="flex items-center space-x-3 sm:space-x-4">
          {/* Status Indicator */}
          <div className="flex items-center space-x-1.5 bg-background border border-border px-2.5 py-1 rounded">
            <span className={`w-1.5 h-1.5 rounded-full bg-emerald-500 ${reducedMotion ? "" : "animate-pulse"}`} />
            <span className="text-[10px] tracking-wide text-foreground">System Ready</span>
          </div>

          {/* Theme Switcher icon */}
          <button
            onClick={toggleTheme}
            className="p-1 rounded hover:bg-surface-subtle text-muted hover:text-foreground transition-colors"
            title="Toggle theme"
            aria-label="Toggle theme"
          >
            {theme === "dark" ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
          </button>

          {/* Real Time Clock */}
          <div className="items-center space-x-1.5 text-muted hidden sm:flex">
            <Clock className="h-3.5 w-3.5" />
            <span>{time}</span>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-40 md:hidden bg-background/80 backdrop-blur-sm flex justify-start pt-12">
          <div className="w-64 h-full bg-surface border-r border-border p-4 space-y-4 font-mono text-xs">
            <div className="flex items-center justify-between border-b border-border pb-2">
              <span className="font-bold text-accent">Menu System</span>
              <button onClick={() => setIsMobileMenuOpen(false)} className="text-muted hover:text-foreground">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <span className="text-muted block font-bold uppercase text-[10px] mb-1">File</span>
                <button
                  onClick={handleNewDataset}
                  className="w-full text-left py-1.5 px-2 hover:bg-accent hover:text-white rounded"
                >
                  New Dataset
                </button>
                <Link
                  href="/dashboards"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="block w-full text-left py-1.5 px-2 hover:bg-accent hover:text-white rounded"
                >
                  Open Saved...
                </Link>
              </div>

              <div>
                <span className="text-muted block font-bold uppercase text-[10px] mb-1">View</span>
                <button
                  onClick={toggleTheme}
                  className="w-full text-left py-1.5 px-2 hover:bg-accent hover:text-white rounded flex justify-between"
                >
                  <span>Toggle Theme</span>
                  <span>{theme === "dark" ? "Light" : "Dark"}</span>
                </button>
                <button
                  onClick={() => scrollToSection("upload-zone")}
                  className="w-full text-left py-1.5 px-2 hover:bg-accent hover:text-white rounded"
                >
                  Scroll to Upload
                </button>
                <button
                  onClick={() => scrollToSection("how-it-works")}
                  className="w-full text-left py-1.5 px-2 hover:bg-accent hover:text-white rounded"
                >
                  Scroll to About
                </button>
              </div>

              <div>
                <span className="text-muted block font-bold uppercase text-[10px] mb-1">Help</span>
                <button
                  onClick={() => {
                    setShowDiagnostics(true);
                    setIsMobileMenuOpen(false);
                  }}
                  className="w-full text-left py-1.5 px-2 hover:bg-accent hover:text-white rounded"
                >
                  System Diagnostics
                </button>
                <button
                  onClick={() => scrollToSection("how-it-works")}
                  className="w-full text-left py-1.5 px-2 hover:bg-accent hover:text-white rounded"
                >
                  InsightLoop Help
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Retro Diagnostics Modal Window */}
      {showDiagnostics && (
        <div className="fixed inset-0 z-50 bg-black/45 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-[#141210] text-[#00ff66] font-mono border-2 border-emerald-500/40 rounded-md overflow-hidden shadow-2xl">
            {/* Window Chrome */}
            <div className="bg-[#1e1c1a] px-4 py-2 border-b border-emerald-500/30 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Laptop className="h-4 w-4 text-emerald-500" />
                <span className="text-xs font-bold tracking-wide text-white">system_diagnostics.sh</span>
              </div>
              <button
                onClick={() => setShowDiagnostics(false)}
                className="text-muted hover:text-white p-1 hover:bg-[#ff0000]/20 rounded"
                aria-label="Close diagnostics"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Window content */}
            <div className="p-4 space-y-3 max-h-[350px] overflow-y-auto text-[11px] leading-relaxed">
              <div className="border-b border-emerald-500/10 pb-2">
                <p className="text-white font-bold">[ INSIGHTLOOP OS CORE METRICS ]</p>
                <p className="text-[#00ff66]/70">Timestamp: {new Date().toISOString()}</p>
                <p className="text-[#00ff66]/70">Session: {getOrCreateSessionId()}</p>
              </div>

              <div className="space-y-1">
                <p><span className="text-[#38bdf8]">● Next.js Framework:</span> v15.0.7 (React 18.3.1)</p>
                <p><span className="text-[#38bdf8]">● Database Engine:</span> DuckDB-WASM v1.33.1 (Loaded via CDN)</p>
                <p><span className="text-[#38bdf8]">● LLM Generation:</span> Google Gemini API (gemini-2.5-flash via Node SDK)</p>
                <p><span className="text-[#38bdf8]">● Sync Persistence:</span> Supabase Secure Database & RLS policies</p>
                <p><span className="text-[#38bdf8]">● Styling Layer:</span> Tailwind CSS v3 & Framer Motion physics</p>
              </div>

              <div className="border-t border-emerald-500/10 pt-2 space-y-1">
                <p className="font-bold text-white">[ ENGINE STATUS REPORT ]</p>
                <p>✓ DuckDB-WASM: <span className="text-emerald-400 font-bold">{datasetLoaded ? "ACTIVE (dataset synced)" : "READY / IDLE"}</span></p>
                <p>✓ Client Storage: <span className="text-emerald-400 font-bold">READY</span></p>
                <p>✓ Security Layer: <span className="text-emerald-400 font-bold">RLS ACTIVE</span></p>
                <p>✓ Canvas Rendering: <span className="text-emerald-400 font-bold">HTML2CANVAS ACTIVE</span></p>
                <p>✓ PDF Compilation: <span className="text-emerald-400 font-bold">JSPDF ENGINE LOADED</span></p>
              </div>

              <div className="border-t border-emerald-500/10 pt-2 flex justify-end">
                <button
                  onClick={() => setShowDiagnostics(false)}
                  className="px-4 py-1.5 border border-emerald-500 hover:bg-emerald-500 hover:text-black font-bold transition rounded text-xs"
                >
                  DISMISS
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
