import type { Config } from "tailwindcss";

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        slate: {
          50: "#f4f6f8",
          100: "#e6ebf0",
          500: "#5c7285",
          600: "#475a6b",
          700: "#374654",
          900: "#1e2833",
        },
        sage: {
          50: "#f2f6ee",
          100: "#e1ebd6",
          400: "#93b06a",
          500: "#79975a",
          600: "#5f7a45",
        },
        terracotta: {
          50: "#fdf1ec",
          400: "#e28b6d",
          500: "#d76f4b",
          600: "#b8583a",
        },
        rose: {
          50: "#fdf1f4",
          400: "#e0729a",
          500: "#d1527f",
          600: "#b03d67",
        },
        sky: {
          50: "#eef6fb",
          400: "#5fa8d3",
          500: "#3d8fc0",
          600: "#2d739e",
        },
        amber: {
          50: "#fdf6e8",
          400: "#dba53f",
          500: "#c98f28",
          600: "#a5731d",
        },
        violet: {
          50: "#f3f0fb",
          400: "#9179c9",
          500: "#7a5cb8",
          600: "#61449a",
        },
      },
      borderRadius: {
        xl2: "1.25rem",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        display: ["Fraunces", "Georgia", "serif"],
      },
    },
  },
  plugins: [],
} satisfies Config;
