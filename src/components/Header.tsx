"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Menu, X, ArrowUpRight, Sun, Moon } from "lucide-react";

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark">("dark");

  // Sync theme state on mount
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

  // Check prefers-reduced-motion
  useEffect(() => {
    if (typeof window === "undefined") return;
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mediaQuery.matches);
    const listener = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mediaQuery.addEventListener("change", listener);
    return () => mediaQuery.removeEventListener("change", listener);
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

  // Custom geometric connected node graph SVG icon
  const NodeGraphIcon = ({ sizeClass = "h-4 w-4" }: { sizeClass?: string }) => (
    <svg
      viewBox="0 0 24 24"
      className={`${sizeClass}`}
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
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
        className="opacity-40"
      />
      <circle cx="4" cy="18" r="2.5" fill="var(--bg)" stroke="currentColor" strokeWidth="2.5" />
      <circle cx="11" cy="6" r="2.5" fill="var(--bg)" stroke="currentColor" strokeWidth="2.5" />
      <circle cx="20" cy="12" r="2.5" fill="var(--bg)" stroke="currentColor" strokeWidth="2.5" />
    </svg>
  );

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b border-border bg-background py-4">
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
          {/* Logo / Wordmark */}
          <Link
            href="/"
            className="flex items-center space-x-2.5 hover:opacity-90 transition group focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none rounded-lg p-1"
          >
            <div className="p-1.5 rounded-lg border border-border text-accent bg-surface transition-colors duration-200">
              <NodeGraphIcon />
            </div>
            <span className="font-sans font-bold text-base tracking-tight text-foreground">
              InsightLoop
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-6 text-xs font-medium">
            <Link
              href="/"
              className={`py-1 transition-colors focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none rounded px-1 ${
                isActive("/") ? "text-foreground" : "text-muted hover:text-foreground"
              }`}
            >
              Home
            </Link>

            <Link
              href="/dashboards"
              className={`py-1 transition-colors focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none rounded px-1 ${
                isActive("/dashboards") ? "text-foreground" : "text-muted hover:text-foreground"
              }`}
            >
              Dashboards
            </Link>

            <Link
              href="/#how-it-works"
              onClick={(e) => handleNavClick(e, "how-it-works")}
              className="text-muted hover:text-foreground transition-colors py-1 px-1 focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none rounded"
            >
              About
            </Link>
          </nav>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center space-x-3.5">
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-1.5 text-muted hover:text-foreground transition-colors focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none rounded-lg border border-border bg-surface"
              aria-label="Toggle Theme"
            >
              {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>

            {/* CTA */}
            <button
              onClick={handleCtaClick}
              className="flex items-center space-x-1 px-3.5 py-1.5 bg-accent hover:opacity-90 active:scale-95 text-white font-medium rounded-lg text-xs transition-all focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
            >
              <span>Upload Data</span>
              <ArrowUpRight className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Mobile Actions */}
          <div className="flex md:hidden items-center space-x-2">
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-1.5 text-muted hover:text-foreground transition-colors focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none rounded-lg border border-border bg-surface"
              aria-label="Toggle Theme"
            >
              {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>

            {/* Menu */}
            <button
              onClick={() => setIsDrawerOpen(true)}
              className="p-1.5 text-muted hover:text-foreground transition focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none rounded-lg border border-border bg-surface"
              aria-label="Open menu"
            >
              <Menu className="h-4 w-4" />
            </button>
          </div>
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
          className="absolute inset-0 bg-background/60"
        />

        {/* Drawer container */}
        <div
          className={`absolute top-0 right-0 bottom-0 w-4/5 max-w-sm bg-surface border-l border-border p-6 flex flex-col justify-between shadow-lg transition-transform duration-300 ease-in-out ${
            isDrawerOpen ? "translate-x-0" : "translate-x-full"
          }`}
          style={{
            transitionDuration: reducedMotion ? "0ms" : "300ms",
          }}
        >
          {/* Drawer Header */}
          <div className="flex items-center justify-between border-b border-border pb-4">
            <div className="flex items-center space-x-2.5">
              <div className="p-1 rounded-lg border border-border text-accent bg-background">
                <NodeGraphIcon />
              </div>
              <span className="font-sans font-bold text-base text-foreground">
                InsightLoop
              </span>
            </div>
            <button
              onClick={() => setIsDrawerOpen(false)}
              className="p-1.5 text-muted hover:text-foreground transition focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none rounded-lg border border-border bg-surface"
              aria-label="Close menu"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Drawer Links */}
          <nav className="flex-1 flex flex-col space-y-3 pt-8 text-xs font-medium">
            <Link
              href="/"
              onClick={() => setIsDrawerOpen(false)}
              className={`flex items-center justify-between p-2.5 rounded-lg transition ${
                isActive("/")
                  ? "bg-surface-subtle text-foreground border border-border"
                  : "text-muted hover:text-foreground border border-transparent hover:bg-surface-subtle/45"
              }`}
            >
              <span>Home</span>
            </Link>

            <Link
              href="/dashboards"
              onClick={() => setIsDrawerOpen(false)}
              className={`flex items-center justify-between p-2.5 rounded-lg transition ${
                isActive("/dashboards")
                  ? "bg-surface-subtle text-foreground border border-border"
                  : "text-muted hover:text-foreground border border-transparent hover:bg-surface-subtle/45"
              }`}
            >
              <span>Dashboards</span>
            </Link>

            <Link
              href="/#how-it-works"
              onClick={(e) => handleNavClick(e, "how-it-works")}
              className="flex items-center justify-between p-2.5 rounded-lg text-muted hover:text-foreground transition border border-transparent hover:bg-surface-subtle/45"
            >
              <span>About</span>
            </Link>
          </nav>

          {/* Drawer Footer CTA */}
          <div className="border-t border-border pt-5 space-y-4">
            <button
              onClick={handleCtaClick}
              className="w-full flex items-center justify-center space-x-1.5 py-2.5 bg-accent hover:opacity-90 text-white font-medium rounded-lg text-xs transition-all focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
            >
              <span>Upload Data</span>
              <ArrowUpRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
