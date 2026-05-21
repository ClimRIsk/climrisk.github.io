import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          950: "#030912",
          900: "#060f1e",
          800: "#0b1f38",
          700: "#0f2847",
          600: "#132b47",
          500: "#1a3a5c",
        },
        green: {
          900: "#0a3d29",
          800: "#0d4f3c",
          600: "#138558",
          500: "#1d9e75",
          400: "#27b889",
          300: "#3fd4a4",
          100: "#c0f5e5",
        },
        risk: {
          low:      "#22c55e",
          moderate: "#84cc16",
          elevated: "#f59e0b",
          high:     "#ef4444",
          critical: "#dc2626",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["'JetBrains Mono'", "monospace"],
      },
      animation: {
        "fade-up":     "fadeUp 0.6s ease forwards",
        "fade-in":     "fadeIn 0.5s ease forwards",
        "pulse-green": "pulseGreen 2s ease-in-out infinite",
        "ticker":      "ticker 40s linear infinite",
        "blink":       "blink 1.2s step-end infinite",
      },
      keyframes: {
        fadeUp: {
          "0%":   { opacity: "0", transform: "translateY(24px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        fadeIn: {
          "0%":   { opacity: "0" },
          "100%": { opacity: "1" },
        },
        pulseGreen: {
          "0%, 100%": { boxShadow: "0 0 0 0 rgba(29,158,117,0)" },
          "50%":      { boxShadow: "0 0 0 8px rgba(29,158,117,0.12)" },
        },
        ticker: {
          "0%":   { transform: "translateX(0)" },
          "100%": { transform: "translateX(-50%)" },
        },
        blink: {
          "0%, 100%": { opacity: "1" },
          "50%":      { opacity: "0" },
        },
      },
      boxShadow: {
        "green-glow": "0 0 32px rgba(29,158,117,0.18)",
        "panel":      "0 1px 0 rgba(255,255,255,0.06) inset, 0 24px 64px rgba(0,0,0,0.5)",
      },
      backgroundImage: {
        "grid-dark": `linear-gradient(rgba(29,158,117,0.04) 1px, transparent 1px),
                      linear-gradient(90deg, rgba(29,158,117,0.04) 1px, transparent 1px)`,
      },
      backgroundSize: {
        "grid": "40px 40px",
      },
    },
  },
  plugins: [],
};
export default config;
