/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        // RPG/fantasy slime palette — same token names as before,
        // new values, so existing className usage repaints for free.
        cream: {
          DEFAULT: "#F1F5F9", // near-white, used as light text on accent buttons
          soft: "#1F2530",    // dark soft surface
        },
        terracotta: {
          DEFAULT: "#38EF7D", // neon slime green — primary accent
          dim: "#16A34A",
          bright: "#6EE7B7",
        },
        slate: {
          text: "#94A3B8", // muted light gray for secondary text on dark bg
          deep: "#F1F5F9", // near-white for headings/primary text
        },
        slime: {
          900: "#0B1420",
          700: "#16A34A",
          500: "#38EF7D",
          300: "#6EE7B7",
          100: "#B9F5D8",
          50: "#E6FBF0",
        },
        contrast: { light: "#FFFFFF", dark: "#1E1E1E" },
      },
      fontFamily: {
        display: ["'Pixelify Sans'", "system-ui", "sans-serif"],
        mono: ["'JetBrains Mono'", "'IBM Plex Mono'", "ui-monospace", "monospace"],
        // Body/base font is now Pixelify Sans globally, per requirement #4.
        body: ["'Pixelify Sans'", "cursive", "sans-serif"],
        sans: ["'Pixelify Sans'", "cursive", "sans-serif"],
      },
      borderRadius: { cozy: "18px" },
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