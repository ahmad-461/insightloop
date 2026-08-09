"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight, ChevronLeft, X, Sparkles } from "lucide-react";

interface TourStep {
  targetId: string;
  title: string;
  content: string;
}

const TOUR_STEPS: TourStep[] = [
  {
    targetId: "active-workspace",
    title: "Welcome to your Workspace 🚀",
    content: "This is your secure client-side analytical workspace. Here you can preview raw spreadsheet columns, override data types, and manage dashboard statistics locally."
  },
  {
    targetId: "focused-chart-card",
    title: "Focus Mode Visualization 📈",
    content: "Dive deep into one specific visual metric at a time. Each chart adapts dynamically to your active theme and displays automatically caching AI annotations directly underneath."
  },
  {
    targetId: "filmstrip-navigation",
    title: "Filmstrip Navigation 🎞️",
    content: "Seamlessly slide, preview, and switch between other auto-generated dimensions and metric breakdowns using this compact thumbnail bar."
  },
  {
    targetId: "desktop-chat-panel",
    title: "AI Co-Pilot Assistant 💬",
    content: "Type natural questions about your spreadsheet. The AI analyst translates English into secure DuckDB SQL queries, runs them locally, and plots dual-column results instantly."
  },
  {
    targetId: "advanced-insights-panel",
    title: "Python Statistical Layer 🧠",
    content: "Trigger serverless Python computations to analyze deep data structures. Conduct linear regression forecasting, IQR outlier boundary scanning, and correlation matrices."
  },
  {
    targetId: "dashboard-toolbar",
    title: "Save, Export & Presenter Mode 💾",
    content: "Ready to share or report? Go full-screen with Presenter Mode, export multi-page corporate PDF reports, or sync your layout configurations securely to Supabase."
  }
];

export default function ProductTour() {
  const [isActive, setIsActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [spotlightRect, setSpotlightRect] = useState<{ top: number; left: number; width: number; height: number } | null>(null);

  useEffect(() => {
    // Check if first visit
    const hasVisited = localStorage.getItem("insightloop-tour-completed");
    if (!hasVisited) {
      // Small timeout to let DuckDB and charts initialize first
      const timer = setTimeout(() => {
        setIsActive(true);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  // Listen to manual restart triggers
  useEffect(() => {
    const handleRestartTour = () => {
      setCurrentStep(0);
      setIsActive(true);
    };

    window.addEventListener("insightloop-restart-tour", handleRestartTour);
    return () => window.removeEventListener("insightloop-restart-tour", handleRestartTour);
  }, []);

  // Compute bounding rect of active element
  useEffect(() => {
    if (!isActive) return;

    const updateSpotlight = () => {
      const step = TOUR_STEPS[currentStep];
      let targetId = step.targetId;

      // Fallback for mobile chat panel if desktop chat is hidden/unavailable
      if (targetId === "desktop-chat-panel") {
        const desktopEl = document.getElementById("desktop-chat-panel");
        if (!desktopEl || window.innerWidth < 1024) {
          targetId = "mobile-chat-panel";
        }
      }

      const element = document.getElementById(targetId);
      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "center" });
        setTimeout(() => {
          const rect = element.getBoundingClientRect();
          setSpotlightRect({
            top: rect.top + window.scrollY,
            left: rect.left + window.scrollX,
            width: rect.width,
            height: rect.height
          });
        }, 300); // Wait for scroll animation to settle
      } else {
        setSpotlightRect(null);
      }
    };

    updateSpotlight();
    window.addEventListener("resize", updateSpotlight);
    window.addEventListener("scroll", updateSpotlight);

    return () => {
      window.removeEventListener("resize", updateSpotlight);
      window.removeEventListener("scroll", updateSpotlight);
    };
  }, [isActive, currentStep]);

  const handleNext = () => {
    if (currentStep < TOUR_STEPS.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleComplete = () => {
    setIsActive(false);
    localStorage.setItem("insightloop-tour-completed", "true");
  };

  if (!isActive) return null;

  const currentStepData = TOUR_STEPS[currentStep];

  return (
    <div className="fixed inset-0 z-[9999] pointer-events-none select-none">
      {/* Background shadow with spotlight cutout */}
      <svg className="absolute inset-0 w-full h-full pointer-events-auto">
        <defs>
          <mask id="spotlight-mask">
            <rect width="100%" height="100%" fill="white" />
            {spotlightRect && (
              <rect
                x={spotlightRect.left - 8}
                y={spotlightRect.top - 8}
                width={spotlightRect.width + 16}
                height={spotlightRect.height + 16}
                rx={12}
                ry={12}
                fill="black"
              />
            )}
          </mask>
        </defs>
        <rect
          width="100%"
          height="100%"
          fill="rgba(15, 23, 42, 0.7)"
          mask="url(#spotlight-mask)"
        />
      </svg>

      {/* Popover Card */}
      <AnimatePresence mode="wait">
        {spotlightRect && (
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.25 }}
            style={{
              position: "absolute",
              top: spotlightRect.top + spotlightRect.height + 24 > document.documentElement.scrollHeight - 300
                ? spotlightRect.top - 240
                : spotlightRect.top + spotlightRect.height + 16,
              left: Math.max(16, Math.min(window.innerWidth - 366, spotlightRect.left + (spotlightRect.width / 2) - 175)),
              width: "350px",
            }}
            className="bg-surface border border-border rounded-2xl p-5 shadow-2xl pointer-events-auto z-[10000] space-y-4"
          >
            {/* Popover Header */}
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-1.5 text-accent font-bold">
                <Sparkles className="h-4 w-4 text-accent animate-pulse" />
                <span className="text-[10px] font-mono uppercase tracking-widest">Workspace Tour</span>
              </div>
              <button
                onClick={handleComplete}
                className="text-muted hover:text-foreground transition rounded p-0.5"
                aria-label="Skip Tour"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Content */}
            <div className="space-y-1.5">
              <h4 className="font-sans font-bold text-sm text-foreground leading-tight">
                {currentStepData.title}
              </h4>
              <p className="text-xs text-muted leading-relaxed font-normal">
                {currentStepData.content}
              </p>
            </div>

            {/* Footer Navigation controls */}
            <div className="flex items-center justify-between pt-2 border-t border-border/60">
              <span className="text-[10px] font-mono text-muted font-bold uppercase tracking-wider">
                Step {currentStep + 1} of {TOUR_STEPS.length}
              </span>

              <div className="flex items-center space-x-1.5">
                <button
                  onClick={handlePrev}
                  disabled={currentStep === 0}
                  className="p-1.5 bg-background border border-border hover:bg-surface-subtle disabled:opacity-30 disabled:cursor-not-allowed rounded-lg text-muted hover:text-foreground transition-colors"
                  aria-label="Previous Step"
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={handleNext}
                  className="flex items-center space-x-1 px-3 py-1.5 bg-accent text-white hover:opacity-90 rounded-lg text-xs font-bold transition-all shadow-md shadow-accent/15"
                  aria-label={currentStep === TOUR_STEPS.length - 1 ? "Finish Tour" : "Next Step"}
                >
                  <span>{currentStep === TOUR_STEPS.length - 1 ? "Finish" : "Next"}</span>
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
