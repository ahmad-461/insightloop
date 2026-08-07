"use client";

import React from "react";
import { AlertCircle, Home } from "lucide-react";
import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center min-h-[70vh] px-6 text-center space-y-5 bg-background font-sans select-none">
      <div className="h-10 w-10 rounded-lg bg-surface border border-border text-accent flex items-center justify-center mx-auto">
        <AlertCircle className="h-5 w-5" />
      </div>

      <div className="space-y-1.5 max-w-sm">
        <h1 className="font-sans text-xl font-bold tracking-tight text-foreground uppercase">
          404 — Page Not Found
        </h1>
        <p className="text-xs text-muted leading-relaxed font-normal">
          Oops! The page you are looking for does not exist, has been moved, or is temporarily unavailable.
        </p>
      </div>

      <div className="pt-2">
        <Link
          href="/"
          className="inline-flex items-center justify-center space-x-1.5 px-4 py-2 bg-accent hover:opacity-90 text-white font-medium rounded-lg text-xs transition focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
        >
          <Home className="h-3.5 w-3.5" />
          <span>Go Back Home</span>
        </Link>
      </div>
    </div>
  );
}
