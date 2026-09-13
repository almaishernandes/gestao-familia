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
      },
      borderRadius: {
        xl2: "1.25rem",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
} satisfies Config;
