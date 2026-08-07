"use client";

import React from "react";
import { AlertCircle, Home } from "lucide-react";
import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center min-h-[70vh] px-4 text-center space-y-6 bg-background font-sans select-none">
      <div className="h-16 w-16 rounded-2xl bg-secondary/15 border border-secondary/20 text-secondary flex items-center justify-center mx-auto shadow-glow-secondary animate-pulse">
        <AlertCircle className="h-8 w-8" />
      </div>

      <div className="space-y-2 max-w-md">
        <h1 className="font-display text-4xl font-extrabold tracking-tight text-white uppercase">
          404 - Page Not Found
        </h1>
        <p className="text-sm text-muted leading-relaxed font-semibold">
          Oops! The page you are looking for does not exist, has been moved, or is temporarily unavailable.
        </p>
      </div>

      <div className="pt-2 w-full max-w-xs">
        <Link
          href="/"
          className="flex items-center justify-center space-x-2 px-5 py-3.5 bg-accent hover:bg-accent-light text-white font-extrabold rounded-xl text-xs transition shadow-glow-accent hover:shadow-glow-secondary focus-visible:ring-2 focus-visible:ring-secondary focus-visible:outline-none"
        >
          <Home className="h-4 w-4" />
          <span>Go Back Home</span>
        </Link>
      </div>
    </div>
  );
}
