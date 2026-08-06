import { Activity, Shield, Sparkles, CheckCircle } from "lucide-react";

export default function Home() {
  return (
    <div className="flex-1 flex flex-col justify-center items-center px-6 py-12 max-w-5xl mx-auto w-full">
      <div className="text-center space-y-6 max-w-3xl">
        {/* Status badge */}
        <div className="inline-flex items-center space-x-2 bg-accent/10 border border-accent/20 px-3 py-1 rounded-full text-xs font-semibold text-accent">
          <Activity className="h-3 w-3 animate-pulse" />
          <span>System Active</span>
        </div>

        {/* Hero Title */}
        <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight bg-gradient-to-r from-white via-gray-200 to-gray-400 bg-clip-text text-transparent">
          InsightLoop — Phase 1 Setup
        </h1>

        {/* Tagline */}
        <p className="text-lg md:text-xl text-gray-400">
          The foundation of your AI-powered Business Intelligence dashboard has been successfully established.
        </p>
      </div>

      {/* Feature / Progress Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16 w-full">
        {/* Card 1 */}
        <div className="bg-surface border border-gray-800 rounded-xl p-6 space-y-4">
          <div className="h-10 w-10 rounded-lg bg-accent/10 flex items-center justify-center border border-accent/20">
            <Sparkles className="h-5 w-5 text-accent" />
          </div>
          <h3 className="font-semibold text-white text-lg">Next.js 15 & TS</h3>
          <p className="text-sm text-gray-400 leading-relaxed">
            Initialized with React 18.3.1 compatibility, TypeScript typing safety, and optimized compilation pathing.
          </p>
          <div className="flex items-center space-x-2 text-xs text-emerald-400 font-medium">
            <CheckCircle className="h-4 w-4" />
            <span>Ready</span>
          </div>
        </div>

        {/* Card 2 */}
        <div className="bg-surface border border-gray-800 rounded-xl p-6 space-y-4">
          <div className="h-10 w-10 rounded-lg bg-accent/10 flex items-center justify-center border border-accent/20">
            <Shield className="h-5 w-5 text-accent" />
          </div>
          <h3 className="font-semibold text-white text-lg">Supabase Foundations</h3>
          <p className="text-sm text-gray-400 leading-relaxed">
            Database schema defined with dashboards, session constraints, chat history tables, indices, and permissive RLS.
          </p>
          <div className="flex items-center space-x-2 text-xs text-emerald-400 font-medium">
            <CheckCircle className="h-4 w-4" />
            <span>Ready</span>
          </div>
        </div>

        {/* Card 3 */}
        <div className="bg-surface border border-gray-800 rounded-xl p-6 space-y-4">
          <div className="h-10 w-10 rounded-lg bg-accent/10 flex items-center justify-center border border-accent/20">
            <Activity className="h-5 w-5 text-accent" />
          </div>
          <h3 className="font-semibold text-white text-lg">Tailwind CSS v3</h3>
          <p className="text-sm text-gray-400 leading-relaxed">
            Safe hex color palette setup ensuring strict adherence to requirements and preparation for reliable export features.
          </p>
          <div className="flex items-center space-x-2 text-xs text-emerald-400 font-medium">
            <CheckCircle className="h-4 w-4" />
            <span>Ready</span>
          </div>
        </div>
      </div>

      {/* Subtle status indicator */}
      <p className="text-xs text-gray-500 mt-16 tracking-wider uppercase font-semibold">
        InsightLoop Platform • Phase 1 Completed Successfully
      </p>
    </div>
  );
}
