"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { BarChart3, Menu, X, ArrowUpRight, Sparkles } from "lucide-react";

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
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

  // Listen to scroll to toggle solid background
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 80) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener("scroll", handleScroll);
    // Initial check
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close drawer on escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsDrawerOpen(false);
      }
    };
    if (isDrawerOpen) {
      window.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden"; // Prevent background scroll
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "unset";
    };
  }, [isDrawerOpen]);

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, targetId: string) => {
    if (pathname === "/") {
      e.preventDefault();
      const el = document.getElementById(targetId);
      if (el) {
        el.scrollIntoView({ behavior: reducedMotion ? "auto" : "smooth" });
      }
    }
    setIsDrawerOpen(false);
  };

  const handleCtaClick = () => {
    if (pathname === "/") {
      const el = document.getElementById("upload-zone");
      if (el) {
        el.scrollIntoView({ behavior: reducedMotion ? "auto" : "smooth" });
      }
    } else {
      router.push("/?scroll=upload-zone");
    }
    setIsDrawerOpen(false);
  };

  const isActive = (path: string) => {
    if (path === "/") {
      return pathname === "/";
    }
    return pathname?.startsWith(path);
  };

  return (
    <>
      <header
        className={`sticky top-0 z-50 w-full transition-all duration-500 ease-in-out ${
          isScrolled
            ? "border-b border-surface-light/50 bg-background/80 backdrop-blur-md shadow-glow-accent py-3.5"
            : "border-b border-transparent bg-transparent py-5"
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
          {/* Logo / Wordmark */}
          <Link
            href="/"
            className="flex items-center space-x-3 hover:opacity-90 transition group focus-visible:ring-2 focus-visible:ring-secondary focus-visible:outline-none rounded-lg p-1"
          >
            <div className="bg-accent/10 p-2 rounded-xl border border-accent/20 group-hover:border-secondary-light/40 transition-all duration-300 shadow-glow-accent group-hover:shadow-glow-secondary">
              <BarChart3 className="h-5.5 w-5.5 text-accent-light" />
            </div>
            <span className="font-display font-extrabold text-xl tracking-tight text-white bg-gradient-to-r from-white via-foreground to-secondary bg-clip-text">
              InsightLoop
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8 text-sm font-semibold">
            {/* Home Link */}
            <Link
              href="/"
              className={`relative py-1.5 transition-colors focus-visible:ring-2 focus-visible:ring-secondary focus-visible:outline-none rounded px-2 ${
                isActive("/") ? "text-white" : "text-muted hover:text-white"
              }`}
            >
              <span>Home</span>
              {isActive("/") && (
                <span className="absolute bottom-0 left-2 right-2 h-0.5 bg-secondary rounded-full animate-fade-in" />
              )}
            </Link>

            {/* Dashboards Link */}
            <Link
              href="/dashboards"
              className={`relative py-1.5 transition-colors focus-visible:ring-2 focus-visible:ring-secondary focus-visible:outline-none rounded px-2 ${
                isActive("/dashboards") ? "text-white" : "text-muted hover:text-white"
              }`}
            >
              <span>Dashboards</span>
              {isActive("/dashboards") && (
                <span className="absolute bottom-0 left-2 right-2 h-0.5 bg-secondary rounded-full animate-fade-in" />
              )}
            </Link>

            {/* About Link */}
            <Link
              href="/#how-it-works"
              onClick={(e) => handleNavClick(e, "how-it-works")}
              className="text-muted hover:text-white transition-colors py-1.5 px-2 focus-visible:ring-2 focus-visible:ring-secondary focus-visible:outline-none rounded"
            >
              About
            </Link>
          </nav>

          {/* Desktop CTA */}
          <div className="hidden md:block">
            <button
              onClick={handleCtaClick}
              className="flex items-center space-x-1.5 px-5 py-2.5 bg-accent hover:bg-accent-light text-white font-extrabold rounded-xl text-xs transition-all duration-300 shadow-glow-accent hover:shadow-glow-secondary focus-visible:ring-2 focus-visible:ring-secondary focus-visible:outline-none"
            >
              <span>Upload Data</span>
              <ArrowUpRight className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Mobile Hamburger Button */}
          <button
            onClick={() => setIsDrawerOpen(true)}
            className="md:hidden p-2 text-muted hover:text-white transition focus-visible:ring-2 focus-visible:ring-secondary focus-visible:outline-none rounded-lg border border-surface-light bg-surface/30"
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>
      </header>

      {/* Mobile Drawer (Slide-in Drawer) */}
      <div
        className={`fixed inset-0 z-50 md:hidden transition-opacity duration-300 ${
          isDrawerOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
      >
        {/* Backdrop overlay */}
        <div
          onClick={() => setIsDrawerOpen(false)}
          className="absolute inset-0 bg-background/80 backdrop-blur-sm"
        />

        {/* Drawer container */}
        <div
          className={`absolute top-0 right-0 bottom-0 w-4/5 max-w-sm bg-surface border-l border-surface-light p-6 flex flex-col justify-between shadow-2xl transition-transform duration-300 ease-in-out ${
            isDrawerOpen
              ? "translate-x-0"
              : "translate-x-full"
          }`}
          style={{
            transitionDuration: reducedMotion ? "0ms" : "300ms",
          }}
        >
          {/* Drawer Header */}
          <div className="flex items-center justify-between border-b border-surface-light/60 pb-5">
            <div className="flex items-center space-x-2">
              <BarChart3 className="h-5 w-5 text-accent-light" />
              <span className="font-display font-extrabold text-lg text-white">
                InsightLoop
              </span>
            </div>
            <button
              onClick={() => setIsDrawerOpen(false)}
              className="p-1.5 text-muted hover:text-white transition focus-visible:ring-2 focus-visible:ring-secondary focus-visible:outline-none rounded-lg border border-surface-light bg-surface-light/30"
              aria-label="Close menu"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Drawer Links */}
          <nav className="flex-1 flex flex-col space-y-6 pt-10 text-base font-bold">
            <Link
              href="/"
              onClick={() => setIsDrawerOpen(false)}
              className={`flex items-center justify-between p-3 rounded-xl transition ${
                isActive("/")
                  ? "bg-accent/15 border border-accent/25 text-white"
                  : "text-muted hover:text-white border border-transparent hover:bg-surface-light/35"
              }`}
            >
              <span>Home</span>
              {isActive("/") && <span className="w-1.5 h-1.5 rounded-full bg-secondary" />}
            </Link>

            <Link
              href="/dashboards"
              onClick={() => setIsDrawerOpen(false)}
              className={`flex items-center justify-between p-3 rounded-xl transition ${
                isActive("/dashboards")
                  ? "bg-accent/15 border border-accent/25 text-white"
                  : "text-muted hover:text-white border border-transparent hover:bg-surface-light/35"
              }`}
            >
              <span>Dashboards</span>
              {isActive("/dashboards") && <span className="w-1.5 h-1.5 rounded-full bg-secondary" />}
            </Link>

            <Link
              href="/#how-it-works"
              onClick={(e) => handleNavClick(e, "how-it-works")}
              className="flex items-center justify-between p-3 rounded-xl text-muted hover:text-white transition border border-transparent hover:bg-surface-light/35"
            >
              <span>About</span>
            </Link>
          </nav>

          {/* Drawer Footer CTA */}
          <div className="border-t border-surface-light/60 pt-6 space-y-4">
            <button
              onClick={handleCtaClick}
              className="w-full flex items-center justify-center space-x-2 py-3.5 bg-accent hover:bg-accent-light text-white font-extrabold rounded-xl text-sm transition-all duration-300 shadow-glow-accent"
            >
              <span>Upload Data</span>
              <ArrowUpRight className="h-4 w-4" />
            </button>

            <div className="flex items-center justify-center space-x-1.5 text-xs text-muted font-semibold">
              <Sparkles className="h-3.5 w-3.5 text-accent-light" />
              <span>Secure In-Browser Analytics</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
