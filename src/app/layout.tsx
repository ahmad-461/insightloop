import type { Metadata } from "next";
import { Space_Grotesk, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { DuckDBProvider } from "@/context/DuckDBContext";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

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
          {/* New Polished Sticky Navigation Header */}
          <Header />

          {/* Page Content */}
          <main className="flex-1 flex flex-col">
            {children}
          </main>

          {/* New Polished Professional Footer */}
          <Footer />
        </DuckDBProvider>
      </body>
    </html>
  );
}
