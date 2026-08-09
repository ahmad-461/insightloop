import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { DuckDBProvider } from "@/context/DuckDBContext";
import { CommandPaletteProvider } from "@/context/CommandPaletteContext";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import PageTransition from "@/components/PageTransition";
import CommandPalette from "@/components/CommandPalette";
import { ScrollProgressBar } from "@/components/PremiumEffects";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  weight: ["400", "500", "600", "700"],
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
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
      className={`${inter.variable} ${jetbrainsMono.variable}`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="bg-background text-foreground font-sans antialiased min-h-screen flex flex-col selection:bg-accent/20 relative">
        {/* Premium Paper Finish Overlay */}
        <div className="noise-overlay" />

        {/* Scroll Progress Bar at very top */}
        <ScrollProgressBar />


        <DuckDBProvider>
          <CommandPaletteProvider>
            {/* New Premium Navigation Header */}
            <Header />

            {/* Page Content with Smooth Motion Transition */}
            <main className="flex-1 flex flex-col relative z-10">
              <PageTransition>
                {children}
              </PageTransition>
            </main>

            {/* New Premium Footer */}
            <Footer />

            {/* Command Palette Overlay */}
            <CommandPalette />
          </CommandPaletteProvider>
        </DuckDBProvider>
      </body>
    </html>
  );
}
