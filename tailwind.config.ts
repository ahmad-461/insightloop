import type { Config } from "tailwindcss";

export default {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Core hex palette for dark theme (never using oklch, lab, color-mix, etc.)
        background: "#0f172a",
        surface: "#111827",
        accent: "#3b82f6",
        foreground: "#f8fafc", // fallback foreground / text color
      },
    },
  },
  plugins: [],
} satisfies Config;
