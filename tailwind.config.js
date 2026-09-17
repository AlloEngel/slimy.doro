/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        // Blue slime palette — keeps existing token names
        // so existing className usage continues to work.
        cream: {
          DEFAULT: "#F1F5F9",
          soft: "#253A5E",
        },

        terracotta: {
          DEFAULT: "#73BED3",
          dim: "#4F8FBA",
          bright: "#A4DDDB",
        },

        slate: {
          text: "#94A3B8",
          deep: "#F1F5F9",
        },

        slime: {
          900: "#172038",
          700: "#3C5E8B",
          500: "#73BED3",
          300: "#A4DDDB",
          100: "#A4DDDB",
          50: "#E7F7F7",
        },

        contrast: {
          light: "#FFFFFF",
          dark: "#172038",
        },
      },

      fontFamily: {
        display: ["'Pixelify Sans'", "system-ui", "sans-serif"],
        mono: ["'JetBrains Mono'", "'IBM Plex Mono'", "ui-monospace", "monospace"],
        body: ["'Pixelify Sans'", "cursive", "sans-serif"],
        sans: ["'Pixelify Sans'", "cursive", "sans-serif"],
      },

      borderRadius: {
        cozy: "18px",
      },

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