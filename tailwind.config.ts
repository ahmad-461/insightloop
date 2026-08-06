import type { Config } from "tailwindcss";

export default {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-plus-jakarta-sans)", "sans-serif"],
        display: ["var(--font-space-grotesk)", "sans-serif"],
      },
      colors: {
        // Core hex palette for dark theme (never using oklch, lab, color-mix, etc.)
        background: "#080d1a",
        surface: "#0f172a",
        "surface-light": "#121b2e",
        accent: "#2563eb",
        "accent-light": "#3b82f6",
        secondary: "#06b6d4",
        "secondary-light": "#0ea5e9",
        success: "#10b981",
        warning: "#eab308",
        foreground: "#f8fafc",
        muted: "#94a3b8",
      },
      boxShadow: {
        // Subtle cyber-glow shadows for professional glassmorphic surfaces
        "glow-accent": "0 0 15px -3px rgba(37, 99, 235, 0.25)",
        "glow-secondary": "0 0 15px -3px rgba(6, 182, 212, 0.25)",
      }
    },
  },
  plugins: [],
} satisfies Config;
