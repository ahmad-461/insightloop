"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Menu, X, ArrowUpRight, Sun, Moon, Search } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { MagneticButton } from "./PremiumEffects";
import { useCommandPalette } from "@/context/CommandPaletteContext";

export default function Header() {
  const { togglePalette } = useCommandPalette();
  const pathname = usePathname();
  const router = useRouter();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark">("dark");
  const [isScrolled, setIsScrolled] = useState(false);

  // Sync scroll state to trigger glassmorphism nav
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 15);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Sync theme state on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const isDark = document.documentElement.classList.contains("dark");
      setTheme(isDark ? "dark" : "light");
    }
  }, [pathname]);

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
    } else {
      // If we are on another page, let default link action navigate to "/#target-id" or similar
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
      {/* Scroll-Reactive Header Navigation */}
      <header
        className={`sticky top-0 z-50 w-full transition-all duration-300 ${
          isScrolled
            ? "bg-background/70 dark:bg-background/60 backdrop-blur-md shadow-sm border-b border-border/50 py-3"
            : "bg-transparent border-b border-transparent py-5"
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
          {/* Logo / Wordmark with Hover Animation */}
          <Link
            href="/"
            className="flex items-center space-x-2.5 transition group focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none rounded-lg p-1"
          >
            <motion.div
              whileHover={{ scale: 1.06, rotate: 5 }}
              whileTap={{ scale: 0.95 }}
              className="p-1.5 rounded-lg border border-border text-accent bg-surface transition-colors duration-200 shadow-sm"
            >
              <NodeGraphIcon />
            </motion.div>
            <span className="font-sans font-bold text-base tracking-tight text-foreground transition-all duration-300 group-hover:text-accent">
              InsightLoop
            </span>
          </Link>

          {/* Center Navigation Links with expanding underline */}
          <nav className="hidden md:flex items-center space-x-2 text-xs font-semibold">
            {/* Home link */}
            <Link
              href="/"
              className={`relative py-1.5 px-3.5 transition-colors focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none rounded-md group ${
                isActive("/") ? "text-foreground" : "text-muted hover:text-foreground"
              }`}
            >
              <span>Home</span>
              <span className={`absolute bottom-0 left-1/2 -translate-x-1/2 h-[2px] bg-accent transition-all duration-300 ease-out group-hover:w-3/4 ${isActive("/") ? "w-3/4" : "w-0"}`} />
            </Link>

            {/* Dashboards link */}
            <Link
              href="/dashboards"
              className={`relative py-1.5 px-3.5 transition-colors focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none rounded-md group ${
                isActive("/dashboards") ? "text-foreground" : "text-muted hover:text-foreground"
              }`}
            >
              <span>Dashboards</span>
              <span className={`absolute bottom-0 left-1/2 -translate-x-1/2 h-[2px] bg-accent transition-all duration-300 ease-out group-hover:w-3/4 ${isActive("/dashboards") ? "w-3/4" : "w-0"}`} />
            </Link>

            {/* About link */}
            <Link
              href="/#how-it-works"
              onClick={(e) => handleNavClick(e, "how-it-works")}
              className="relative py-1.5 px-3.5 text-muted hover:text-foreground transition-colors focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none rounded-md group"
            >
              <span>About</span>
              <span className="absolute bottom-0 left-1/2 -translate-x-1/2 h-[2px] bg-accent transition-all duration-300 ease-out group-hover:w-3/4 w-0" />
            </Link>

            {/* Pricing / Open link */}
            <Link
              href="/#pricing"
              onClick={(e) => handleNavClick(e, "pricing")}
              className="relative py-1.5 px-3.5 text-muted hover:text-foreground transition-colors focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none rounded-md group"
            >
              <span>Free & Open</span>
              <span className="absolute bottom-0 left-1/2 -translate-x-1/2 h-[2px] bg-accent transition-all duration-300 ease-out group-hover:w-3/4 w-0" />
            </Link>
          </nav>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center space-x-3.5">
            {/* Command Palette Toggle */}
            <motion.button
              onClick={togglePalette}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="hidden md:inline-flex items-center space-x-1.5 px-3 py-2 text-muted hover:text-foreground transition-colors focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none rounded-lg border border-border bg-surface shadow-sm text-xs font-semibold"
              aria-label="Open Command Palette"
            >
              <Search className="h-3.5 w-3.5 text-muted" />
              <span>Search</span>
              <span className="text-[10px] bg-background border border-border rounded px-1.5 py-0.5 text-muted font-bold font-mono">
                ⌘K
              </span>
            </motion.button>

            {/* Premium Theme Toggle with hover rotation */}
            <motion.button
              onClick={toggleTheme}
              whileHover={{ scale: 1.05, rotate: 8 }}
              whileTap={{ scale: 0.95 }}
              className="p-2 text-muted hover:text-foreground transition-colors focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none rounded-lg border border-border bg-surface shadow-sm"
              aria-label="Toggle Theme"
            >
              {theme === "dark" ? <Sun className="h-4 w-4 text-amber-500" /> : <Moon className="h-4 w-4 text-slate-700" />}
            </motion.button>

            {/* Magnetic CTA button */}
            <MagneticButton
              onClick={handleCtaClick}
              className="flex items-center space-x-1.5 px-4 py-2 bg-accent text-white font-semibold rounded-lg text-xs transition-all shadow-md shadow-accent/15 focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
            >
              <span>Upload Data</span>
              <ArrowUpRight className="h-3.5 w-3.5" />
            </MagneticButton>
          </div>

          {/* Mobile Actions */}
          <div className="flex md:hidden items-center space-x-2">
            {/* Theme Toggle */}
            <motion.button
              onClick={toggleTheme}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="p-1.5 text-muted hover:text-foreground transition-colors focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none rounded-lg border border-border bg-surface shadow-sm"
              aria-label="Toggle Theme"
            >
              {theme === "dark" ? <Sun className="h-4 w-4 text-amber-500" /> : <Moon className="h-4 w-4" />}
            </motion.button>

            {/* Menu */}
            <button
              onClick={() => setIsDrawerOpen(true)}
              className="p-1.5 text-muted hover:text-foreground transition focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none rounded-lg border border-border bg-surface shadow-sm"
              aria-label="Open menu"
            >
              <Menu className="h-4 w-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Drawer (Smooth Slide-in Overlay) */}
      <AnimatePresence>
        {isDrawerOpen && (
          <div className="fixed inset-0 z-50 md:hidden">
            {/* Backdrop overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsDrawerOpen(false)}
              className="absolute inset-0 bg-background/60 backdrop-blur-sm"
            />

            {/* Drawer container with spring transition */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={reducedMotion ? { duration: 0 } : { type: "spring", damping: 25, stiffness: 200 }}
              className="absolute top-0 right-0 bottom-0 w-4/5 max-w-sm bg-surface border-l border-border p-6 flex flex-col justify-between shadow-2xl z-10"
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
              <nav className="flex-1 flex flex-col space-y-3 pt-8 text-xs font-semibold">
                <Link
                  href="/"
                  onClick={() => setIsDrawerOpen(false)}
                  className={`flex items-center justify-between p-2.5 rounded-lg transition ${
                    isActive("/")
                      ? "bg-surface-subtle text-foreground border border-border"
                      : "text-muted hover:text-foreground border border-transparent hover:bg-surface-subtle/40"
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
                      : "text-muted hover:text-foreground border border-transparent hover:bg-surface-subtle/40"
                  }`}
                >
                  <span>Dashboards</span>
                </Link>

                <Link
                  href="/#how-it-works"
                  onClick={(e) => handleNavClick(e, "how-it-works")}
                  className="flex items-center justify-between p-2.5 rounded-lg text-muted hover:text-foreground transition border border-transparent hover:bg-surface-subtle/40"
                >
                  <span>About</span>
                </Link>

                <Link
                  href="/#pricing"
                  onClick={(e) => handleNavClick(e, "pricing")}
                  className="flex items-center justify-between p-2.5 rounded-lg text-muted hover:text-foreground transition border border-transparent hover:bg-surface-subtle/40"
                >
                  <span>Free & Open</span>
                </Link>
              </nav>

              {/* Drawer Footer CTA */}
              <div className="border-t border-border pt-5 space-y-4">
                <button
                  onClick={handleCtaClick}
                  className="w-full flex items-center justify-center space-x-1.5 py-2.5 bg-accent hover:opacity-90 text-white font-semibold rounded-lg text-xs transition-all shadow-md focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
                >
                  <span>Upload Data</span>
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
