import type { Config } from "tailwindcss";

const config: Config = {
  content: [],
  theme: {
    extend: {
      fontFamily: {
        sans: ["League Spartan", "sans-serif"],
      },
      colors: {
        transparent: "transparent",
        cream: "#FAF9F6",
        green: {
          50: "#f0fdf4",
          100: "#dcfce7",
          300: "#86efac",
          500: "#22c55e",
          700: "#006747",
          900: "#004D35",
        },
        black: "#1a1a1a",
        grey: {
          50: "#9ca3af",
          75: "#6b7280",
          100: "#e5e7eb",
          200: "#f3f4f6",
          300: "#d1d5db",
        },
        yellow: "#D4A017",
        gold: "#C8A951",
        white: "#ffffff",
        scorecard: {
          bg: "#FAF9F6",
          line: "#d4d4d4",
          header: "#006747",
        },
      },
    },
  },
  plugins: [
    require("@tailwindcss/typography"),
    require("@tailwindcss/forms"),
  ],
};

export default config;
