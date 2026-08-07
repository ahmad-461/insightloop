import type { Metadata } from "next";
import { Space_Grotesk, Plus_Jakarta_Sans } from "next/font/google";
import { BarChart3, Database, MessageSquare } from "lucide-react";
import Link from "next/link";
import "./globals.css";
import { DuckDBProvider } from "@/context/DuckDBContext";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
  weight: ["300", "400", "500", "600", "700"],
});

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-plus-jakarta-sans",
  weight: ["300", "400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://insightloop.vercel.app"),
  title: "InsightLoop — AI Business Intelligence Dashboard",
  description: "AI-powered business intelligence dashboard where you can upload CSV/Excel files and interact with an AI data analyst.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`dark ${spaceGrotesk.variable} ${plusJakartaSans.variable}`}>
      <body className="bg-background text-foreground font-sans antialiased min-h-screen flex flex-col selection:bg-secondary/30 selection:text-white">
        <DuckDBProvider>
          {/* Glassmorphic Header */}
          <header className="sticky top-0 z-50 border-b border-surface-light/50 bg-background/80 backdrop-blur-md px-6 py-4 flex items-center justify-between transition-all">
            <Link
              href="/"
              className="flex items-center space-x-3 hover:opacity-90 transition group focus-visible:ring-2 focus-visible:ring-secondary focus-visible:outline-none rounded-lg p-1"
            >
              <div className="bg-accent/10 p-2 rounded-xl border border-accent/20 group-hover:border-secondary-light/40 transition-all duration-300 shadow-glow-accent group-hover:shadow-glow-secondary">
                <BarChart3 className="h-6 w-6 text-accent-light" />
              </div>
              <span className="font-display font-extrabold text-xl tracking-tight text-white bg-gradient-to-r from-white via-foreground to-secondary bg-clip-text">
                InsightLoop
              </span>
            </Link>

            <nav className="flex items-center space-x-6 text-sm font-semibold text-muted">
              <span className="flex items-center space-x-1.5 cursor-not-allowed hover:text-white transition py-1">
                <Database className="h-4 w-4 text-muted/80" />
                <span>Data Sources</span>
              </span>
              <Link
                href="/dashboards"
                className="flex items-center space-x-1.5 hover:text-white transition py-1 px-2 rounded-md hover:bg-surface-light/30 focus-visible:ring-2 focus-visible:ring-secondary focus-visible:outline-none"
              >
                <BarChart3 className="h-4 w-4 text-accent-light" />
                <span>Dashboards</span>
              </Link>
              <span className="flex items-center space-x-1.5 cursor-not-allowed hover:text-white transition py-1">
                <MessageSquare className="h-4 w-4 text-muted/80" />
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
