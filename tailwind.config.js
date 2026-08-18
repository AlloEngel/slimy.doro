/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        cream: { DEFAULT: "#F9F5F1", soft: "#F2ECE4" },
        terracotta: { DEFAULT: "#E08E79", dim: "#C97A65", bright: "#EFA48F" },
        slate: { text: "#4E596F", deep: "#333B4D" },
        slime: {
          900: "#2F3E63",
          700: "#3E6FA6",
          500: "#5B93C7",
          300: "#7FC0D6",
          100: "#B9E4DE",
          50: "#EFF3EC",
        },
        contrast: { light: "#FFFFFF", dark: "#1E1E1E" },
      },
      fontFamily: {
        // Cross-platform pixel-style font — no local install needed,
        // loaded via Google Fonts in index.html.
        display: ["'Pixelify Sans'", "system-ui", "sans-serif"],
        mono: ["'JetBrains Mono'", "'IBM Plex Mono'", "ui-monospace", "monospace"],
        body: ["'Nunito Sans'", "system-ui", "sans-serif"],
      },
      borderRadius: { cozy: "20px" },
      keyframes: {
        "float-up": {
          "0%": { transform: "translateY(0)", opacity: "0" },
          "15%": { opacity: "1" },
          "100%": { transform: "translateY(-22px)", opacity: "0" },
        },
        "pop-in": {
          "0%": { transform: "scale(0.6)", opacity: "0" },
          "60%": { transform: "scale(1.08)", opacity: "1" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
        "slide-in": {
          "0%": { transform: "translateX(-100%)" },
          "100%": { transform: "translateX(0)" },
        },
      },
      animation: {
        "float-up": "float-up 1.4s ease-out forwards",
        "pop-in": "pop-in 0.35s cubic-bezier(0.34, 1.56, 0.64, 1) forwards",
        "slide-in": "slide-in 0.28s ease-out forwards",
      },
    },
  },
  plugins: [],
};