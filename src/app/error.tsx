"use client";

import React, { useEffect } from "react";
import { AlertCircle, RefreshCw, Home } from "lucide-react";
import Link from "next/link";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Application error boundary triggered:", error);
  }, [error]);

  return (
    <div className="flex-1 flex flex-col items-center justify-center min-h-[70vh] px-4 text-center space-y-6 bg-background font-sans select-none">
      <div className="h-16 w-16 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-500 flex items-center justify-center mx-auto shadow-glow-secondary animate-pulse">
        <AlertCircle className="h-8 w-8" />
      </div>

      <div className="space-y-2 max-w-md">
        <h1 className="font-display text-2xl sm:text-3xl font-extrabold tracking-tight text-white uppercase">
          Something went wrong
        </h1>
        <p className="text-sm text-muted leading-relaxed font-semibold">
          An unexpected error occurred in the application. Don&apos;t worry, your loaded spreadsheet data is secure.
        </p>
        {error.message && (
          <div className="mt-3 bg-surface border border-surface-light p-3 rounded-xl text-xs font-mono text-rose-400 select-text break-all">
            {error.message}
          </div>
        )}
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-center gap-3 w-full max-w-xs">
        <button
          onClick={() => reset()}
          className="w-full flex items-center justify-center space-x-2 px-5 py-3 bg-accent hover:bg-accent-light text-white font-extrabold rounded-xl text-xs transition shadow-glow-accent hover:shadow-glow-secondary focus-visible:ring-2 focus-visible:ring-secondary focus-visible:outline-none"
        >
          <RefreshCw className="h-4 w-4" />
          <span>Try Re-rendering</span>
        </button>

        <Link
          href="/"
          className="w-full flex items-center justify-center space-x-2 px-5 py-3 bg-surface-light/35 hover:bg-surface-light/70 text-white font-bold border border-surface-light/50 rounded-xl text-xs transition focus-visible:ring-2 focus-visible:ring-secondary focus-visible:outline-none"
        >
          <Home className="h-4 w-4 text-muted" />
          <span>Go Back Home</span>
        </Link>
      </div>
    </div>
  );
}
