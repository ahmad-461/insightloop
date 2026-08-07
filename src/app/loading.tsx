"use client";

import React from "react";
import { RefreshCw, Home } from "lucide-react";
import Link from "next/link";

export default function Loading() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center min-h-[70vh] space-y-6 px-4 bg-background font-sans select-none text-center">
      <div className="relative flex items-center justify-center">
        <div className="absolute w-12 h-12 rounded-full border border-secondary/20 animate-ping" />
        <RefreshCw className="h-8 w-8 text-secondary animate-spin" />
      </div>

      <div className="space-y-1">
        <span className="text-sm text-white font-extrabold tracking-wider uppercase">Initializing Workspace</span>
        <p className="text-xs text-muted font-semibold">Preparing in-browser database engine and AI co-pilot views...</p>
      </div>

      <div className="pt-2 w-full max-w-xs">
        <Link
          href="/"
          className="flex items-center justify-center space-x-2 px-5 py-3 bg-surface-light/35 hover:bg-surface-light/70 text-white font-bold border border-surface-light/50 rounded-xl text-xs transition focus-visible:ring-2 focus-visible:ring-secondary focus-visible:outline-none mx-auto w-44"
        >
          <Home className="h-4 w-4 text-muted" />
          <span>Go Back Home</span>
        </Link>
      </div>
    </div>
  );
}
