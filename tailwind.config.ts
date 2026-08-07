import type { Config } from "tailwindcss";

export default {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-inter)", "sans-serif"],
        display: ["var(--font-inter)", "sans-serif"],
      },
      colors: {
        background: "var(--bg)",
        surface: "var(--surface)",
        "surface-subtle": "var(--surface-subtle)",
        "surface-hover": "var(--surface-hover)",
        border: "var(--border)",
        foreground: "var(--text-primary)",
        muted: "var(--text-secondary)",
        accent: "var(--accent)",
        success: "var(--success)",
        warning: "var(--warning)",

        // Aliases to seamlessly support old styling classes with the new premium design values:
        "surface-light": "var(--surface-subtle)",
        "accent-light": "var(--accent)",
        secondary: "var(--accent)",
        "secondary-light": "var(--accent)",
      },
      boxShadow: {
        // Soft low-opacity shadow matching the premium minimal design (no glows/heavy gradients)
        "sm": "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
        "md": "0 4px 6px -1px rgba(0, 0, 0, 0.03), 0 2px 4px -1px rgba(0, 0, 0, 0.02)",
        "lg": "0 10px 15px -3px rgba(0, 0, 0, 0.03), 0 4px 6px -2px rgba(0, 0, 0, 0.02)",
      }
    },
  },
  plugins: [],
} satisfies Config;
