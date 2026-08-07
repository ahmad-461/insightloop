"use client";

import React from "react";
import { RefreshCw, Home } from "lucide-react";
import Link from "next/link";

export default function Loading() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center min-h-[70vh] space-y-5 px-6 bg-background font-sans select-none text-center">
      <div className="flex items-center justify-center">
        <RefreshCw className="h-6 w-6 text-accent animate-spin" />
      </div>

      <div className="space-y-1">
        <h2 className="text-xs text-foreground font-bold tracking-wider uppercase">Initializing Workspace</h2>
        <p className="text-xs text-muted">Preparing in-browser database engine and AI co-pilot views...</p>
      </div>

      <div className="pt-2">
        <Link
          href="/"
          className="inline-flex items-center justify-center space-x-1.5 px-4 py-2 bg-surface hover:bg-surface-subtle text-foreground border border-border rounded-lg text-xs font-medium transition focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
        >
          <Home className="h-3.5 w-3.5 text-muted" />
          <span>Go Back Home</span>
        </Link>
      </div>
    </div>
  );
}
