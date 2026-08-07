import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { DuckDBProvider } from "@/context/DuckDBContext";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "InsightLoop — AI Business Intelligence Dashboard",
  description: "AI-powered business intelligence dashboard where you can upload CSV/Excel files and interact with an AI data analyst.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Head script to prevent flash of wrong theme
  const themeScript = `
    (function() {
      try {
        var storedTheme = localStorage.getItem('insightloop-theme');
        var systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        if (storedTheme === 'dark' || (!storedTheme && systemPrefersDark)) {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      } catch (e) {
        console.error('Theme injection error:', e);
      }
    })();
  `;

  return (
    <html
      lang="en"
      className={`${inter.variable}`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="bg-background text-foreground font-sans antialiased min-h-screen flex flex-col selection:bg-accent/20">
        <DuckDBProvider>
          {/* New Premium Navigation Header */}
          <Header />

          {/* Page Content */}
          <main className="flex-1 flex flex-col">
            {children}
          </main>

          {/* New Premium Footer */}
          <Footer />
        </DuckDBProvider>
      </body>
    </html>
  );
}
