import React from "react";
import { History, GitCommit, ChevronRight } from "lucide-react";

export const metadata = {
  title: "Changelog | InsightLoop",
  description: "Explore the chronological progress of InsightLoop, tracking iterations, new feature releases, and core performance milestones.",
};

const changelogEntries = [
  {
    version: "v1.6",
    title: "AI Demo Playground & Product Tour",
    date: "Current Release",
    bullets: [
      "Added an interactive AI playground so visitors can try the analyst directly with rich preloaded datasets.",
      "Integrated step-by-step contextual feature highlighting for instant onboarding guidance.",
      "Optimized query responsiveness with pre-warmed backend model connection routing."
    ]
  },
  {
    version: "v1.5",
    title: "Command Palette & AI Chart Explanations",
    date: "Winter 2025",
    bullets: [
      "Introduced global Cmd+K searchable control launcher for instant workspace exploration.",
      "Added inline AI translation guides explaining chart visual behaviors in friendly natural language.",
      "Optimized dark/light theme switching with custom inline hydration scripts to prevent visual flashing."
    ]
  },
  {
    version: "v1.4",
    title: "Premium Enterprise Redesign",
    date: "Late 2024",
    bullets: [
      "Migrated to a refined corporate-grade typography hierarchy using Inter exclusively.",
      "Polished layouts with professional premium gradients and high-fidelity mock dashboards.",
      "Improved focus state rendering and keyboard navigability across all widgets."
    ]
  },
  {
    version: "v1.3",
    title: "Layout Persistence & Local PDF Export",
    date: "Autumn 2024",
    bullets: [
      "Added persistent workspace configurations to Supabase, preserving custom column arrangements safely.",
      "Designed dynamic client-side multi-page PDF generation supporting direct local reports.",
      "Implemented unique dashboard reactivation links using secure client-side spreadsheet matching."
    ]
  },
  {
    version: "v1.2",
    title: "Advanced Python Statistical Engine",
    date: "Summer 2024",
    bullets: [
      "Built a secure backend statistical computation layer for deep analytics.",
      "Introduced automated linear regression forecasting, correlation matrices, and IQR outlier detection.",
      "Enabled in-browser CSV and Excel multi-format spreadsheet parsing helpers."
    ]
  },
  {
    version: "v1.1",
    title: "Conversational AI Chat Analyst",
    date: "Mid 2024",
    bullets: [
      "Integrated Gemini 2.5 API as a local conversational analyst executing natural English queries.",
      "Built automatic, self-correcting query correction retries on SQL schema compilation errors.",
      "Developed client-side chart generation displaying result sets instantly inside conversational layouts."
    ]
  },
  {
    version: "v1.0",
    title: "Core Platform Launch",
    date: "Spring 2024",
    bullets: [
      "Launched secure in-memory data processing directly inside local browser sandboxes.",
      "Configured in-browser DuckDB-WASM engine executing analytical queries at native speeds.",
      "Established strict privacy guidelines ensuring raw user data is never transferred or persisted."
    ]
  }
];

export default function ChangelogPage() {
  return (
    <div className="flex-1 w-full max-w-4xl mx-auto px-6 py-12 space-y-12 animate-fade-in relative z-10">
      {/* Page Header */}
      <div className="space-y-4 text-center max-w-2xl mx-auto">
        <div className="inline-flex items-center space-x-2 bg-accent/10 border border-accent/20 px-3.5 py-1.5 rounded-full text-[10px] font-bold text-accent uppercase tracking-widest">
          <History className="h-3.5 w-3.5" />
          <span>Product Changelog</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-sans font-extrabold tracking-tight text-foreground">
          Iterative Product Development
        </h1>
        <p className="text-xs sm:text-sm text-muted leading-relaxed">
          Follow our journey as we refine and expand the capabilities of browser-based business intelligence, prioritizing data privacy and performance.
        </p>
      </div>

      {/* Changelog Timeline */}
      <div className="relative border-l border-border ml-2 md:ml-6 pl-6 md:pl-10 space-y-12">
        {changelogEntries.map((entry, idx) => (
          <div key={idx} className="relative group">
            {/* Dot Node indicator */}
            <div className="absolute -left-[31px] md:-left-[47px] top-1.5 bg-background border border-border group-hover:border-accent group-hover:text-accent rounded-full p-1.5 transition-colors duration-200 z-10">
              <GitCommit className="h-3.5 w-3.5 text-muted group-hover:text-accent" />
            </div>

            {/* Entry Content Card */}
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                <span className="text-xs font-mono font-bold text-accent px-2.5 py-0.5 rounded bg-accent/10 border border-accent/20">
                  {entry.version}
                </span>
                <span className="text-[10px] uppercase tracking-wider font-extrabold text-muted">
                  {entry.date}
                </span>
              </div>

              <h2 className="text-lg font-sans font-bold text-foreground">
                {entry.title}
              </h2>

              <ul className="space-y-2.5 pt-1">
                {entry.bullets.map((bullet, bulletIdx) => (
                  <li key={bulletIdx} className="flex items-start text-xs sm:text-sm text-muted leading-relaxed font-normal">
                    <ChevronRight className="h-4 w-4 text-accent shrink-0 mt-0.5 mr-1.5" />
                    <span>{bullet}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
