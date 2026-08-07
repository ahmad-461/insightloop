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
    <div className="flex-1 flex flex-col items-center justify-center min-h-[70vh] px-6 text-center space-y-5 bg-background font-sans select-none">
      <div className="h-10 w-10 rounded-lg bg-surface border border-border text-rose-500 flex items-center justify-center mx-auto">
        <AlertCircle className="h-5 w-5" />
      </div>

      <div className="space-y-1.5 max-w-sm">
        <h1 className="font-sans text-xl font-bold tracking-tight text-foreground uppercase">
          Something went wrong
        </h1>
        <p className="text-xs text-muted leading-relaxed font-normal">
          An unexpected error occurred in the application. Don&apos;t worry, your loaded spreadsheet data is secure.
        </p>
        {error.message && (
          <div className="mt-2 bg-surface border border-border p-2.5 rounded-lg text-xs font-mono text-rose-500 select-text break-all">
            {error.message}
          </div>
        )}
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-center gap-2 pt-2">
        <button
          onClick={() => reset()}
          className="inline-flex items-center justify-center space-x-1 px-4 py-2 bg-accent hover:opacity-90 text-white font-medium rounded-lg text-xs transition focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          <span>Try Re-rendering</span>
        </button>

        <Link
          href="/"
          className="inline-flex items-center justify-center space-x-1 px-4 py-2 bg-surface hover:bg-surface-subtle text-foreground border border-border rounded-lg text-xs font-medium transition focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
        >
          <Home className="h-3.5 w-3.5 text-muted" />
          <span>Go Back Home</span>
        </Link>
      </div>
    </div>
  );
}
