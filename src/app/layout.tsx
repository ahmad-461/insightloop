import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { BarChart3, Database, MessageSquare } from "lucide-react";
import "./globals.css";
import { DuckDBProvider } from "@/context/DuckDBContext";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "InsightLoop — AI Business Intelligence Dashboard",
  description: "AI-powered business intelligence dashboard where you can upload CSV/Excel files and interact with an AI data analyst.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} bg-background text-foreground antialiased min-h-screen flex flex-col`}>
        <DuckDBProvider>
          {/* Simple Header */}
        <header className="border-b border-gray-800 bg-surface px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-accent/10 p-2 rounded-lg border border-accent/20">
              <BarChart3 className="h-6 w-6 text-accent" />
            </div>
            <span className="font-bold text-xl tracking-tight text-white">InsightLoop</span>
          </div>
          <nav className="flex items-center space-x-6 text-sm font-medium text-gray-400">
            <span className="flex items-center space-x-1 cursor-not-allowed hover:text-white transition">
              <Database className="h-4 w-4" />
              <span>Data Sources</span>
            </span>
            <span className="flex items-center space-x-1 cursor-not-allowed hover:text-white transition">
              <BarChart3 className="h-4 w-4" />
              <span>Dashboards</span>
            </span>
            <span className="flex items-center space-x-1 cursor-not-allowed hover:text-white transition">
              <MessageSquare className="h-4 w-4" />
              <span>AI Analyst</span>
            </span>
          </nav>
        </header>

          {/* Page Content */}
          <main className="flex-1 flex flex-col">
            {children}
          </main>
        </DuckDBProvider>
      </body>
    </html>
  );
}
