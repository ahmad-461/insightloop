"use client";

import React, { useState, useEffect } from "react";
import { Terminal } from "lucide-react";

interface BootSequenceProps {
  onBootComplete: () => void;
}

const BOOT_LINES = [
  "[BOOT] Initializing InsightLoop OS v1.18.0...",
  "[OK] Loading client-side DuckDB-WASM engine...",
  "[OK] Establishing Supabase secure channel...",
  "[OK] Connecting Vercel serverless stats core...",
  "[READY] InsightLoop Terminal environment is ready.",
];

export default function BootSequence({ onBootComplete }: BootSequenceProps) {
  const [lines, setLines] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [reducedMotion, setReducedMotion] = useState(false);

  // Detect prefers-reduced-motion
  useEffect(() => {
    if (typeof window === "undefined") return;
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mediaQuery.matches);
    if (mediaQuery.matches) {
      onBootComplete();
    }
  }, [onBootComplete]);

  // Handle sequential typing / appearing of terminal text
  useEffect(() => {
    if (reducedMotion) return;

    if (currentIndex < BOOT_LINES.length) {
      const delay = currentIndex === 0 ? 200 : 350;
      const timer = setTimeout(() => {
        setLines((prev) => [...prev, BOOT_LINES[currentIndex]]);
        setCurrentIndex((prev) => prev + 1);
      }, delay);
      return () => clearTimeout(timer);
    } else {
      // Small pause before fading into desktop
      const finishTimer = setTimeout(() => {
        onBootComplete();
      }, 500);
      return () => clearTimeout(finishTimer);
    }
  }, [currentIndex, reducedMotion, onBootComplete]);

  const handleSkip = () => {
    onBootComplete();
  };

  if (reducedMotion) return null;

  return (
    <div className="fixed inset-0 z-[9999] bg-[#0c0a09] flex flex-col justify-between p-6 md:p-12 font-mono text-xs select-none">
      <div className="space-y-4 max-w-3xl">
        <div className="flex items-center space-x-2 text-accent">
          <Terminal className="h-5 w-5 animate-pulse" />
          <span className="font-bold tracking-wide">INSIGHTLOOP SYSTEM BOOT</span>
        </div>

        <div className="space-y-2 pt-6 text-emerald-400 font-bold tracking-wider leading-relaxed">
          {lines.map((line, idx) => (
            <div key={idx} className="flex items-center space-x-2">
              <span className="text-[#38bdf8]">&gt;</span>
              <span>{line}</span>
            </div>
          ))}
          {currentIndex < BOOT_LINES.length && (
            <div className="flex items-center space-x-2">
              <span className="text-[#38bdf8]">&gt;</span>
              <span className="w-1.5 h-4 bg-emerald-400 animate-pulse" />
            </div>
          )}
        </div>
      </div>

      <div className="flex justify-between items-center text-[10px] text-muted border-t border-border/10 pt-4">
        <span>Press any key or click skip to initialize terminal immediately</span>
        <button
          onClick={handleSkip}
          className="px-3 py-1.5 border border-border/40 hover:border-accent text-foreground hover:text-accent font-bold transition rounded uppercase tracking-wider"
        >
          Skip Boot (Esc)
        </button>
      </div>
    </div>
  );
}
