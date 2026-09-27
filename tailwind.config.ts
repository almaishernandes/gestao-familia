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
        // Paleta "Money 2005 Classic" do Agilis-Web (verde-petróleo + dourado)
        sage: {
          50: "#e6f0ee",
          100: "#c3ddd6",
          200: "#9fc9bf",
          400: "#00796b",
          500: "#00695c",
          600: "#004d40",
          700: "#003d33",
        },
        terracotta: {
          50: "#fff8e1",
          100: "#ffecb3",
          200: "#ffe082",
          400: "#fdd835",
          500: "#fbc02d",
          600: "#f9a825",
          700: "#f57f17",
        },
        // Cor semântica de erro/exclusão (antigo valor do terracotta, agora
        // liberado para virar o dourado decorativo acima).
        danger: {
          50: "#fdf1ec",
          100: "#fbdccb",
          200: "#f6c1a3",
          400: "#e28b6d",
          500: "#d76f4b",
          600: "#b8583a",
          700: "#94452c",
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
