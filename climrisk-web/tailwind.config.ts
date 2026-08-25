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
        obsidian: {
          950: "#0A0B0E",
          900: "#0F1013",
          800: "#14151A",
          700: "#1E1F26",
          600: "#2A2B33",
          500: "#3F3F46",
        },
        gold: {
          400: "#E2C158",
          300: "#D4AF37",
          200: "#C5A059",
          100: "#EAD9A0",
        },
        risk: {
          low:      "#10B981",
          moderate: "#84cc16",
          elevated: "#f59e0b",
          high:     "#EF4444",
          critical: "#dc2626",
        },
        terminal: "#10B981",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["'JetBrains Mono'", "monospace"],
      },
      transitionTimingFunction: {
        institutional: "cubic-bezier(0.22, 1, 0.36, 1)",
      },
      animation: {
        "fade-up":     "fadeUp 0.6s cubic-bezier(0.22, 1, 0.36, 1) forwards",
        "fade-in":     "fadeIn 0.5s cubic-bezier(0.22, 1, 0.36, 1) forwards",
        "pulse-gold":  "pulseGold 2s ease-in-out infinite",
        "pulse-mono":  "pulseMono 1.4s ease-in-out infinite",
        "ticker":      "ticker 40s linear infinite",
        "blink":       "blink 1.2s step-end infinite",
      },
      keyframes: {
        fadeUp: {
          "0%":   { opacity: "0", transform: "translateY(16px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        fadeIn: {
          "0%":   { opacity: "0" },
          "100%": { opacity: "1" },
        },
        pulseGold: {
          "0%, 100%": { boxShadow: "0 0 0 0 rgba(212,175,55,0)" },
          "50%":      { boxShadow: "0 0 0 8px rgba(212,175,55,0.12)" },
        },
        pulseMono: {
          "0%, 100%": { opacity: "0.35" },
          "50%":      { opacity: "1" },
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
        "gold-glow": "0 0 32px rgba(212,175,55,0.16)",
        "panel":     "0 1px 0 rgba(255,255,255,0.05) inset, 0 24px 64px rgba(0,0,0,0.6)",
      },
      backgroundImage: {
        "grid-dark": `linear-gradient(rgba(212,175,55,0.035) 1px, transparent 1px),
                      linear-gradient(90deg, rgba(212,175,55,0.035) 1px, transparent 1px)`,
      },
      backgroundSize: {
        "grid": "40px 40px",
      },
    },
  },
  plugins: [],
};
export default config;
