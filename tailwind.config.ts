import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        copper: {
          50: "#fdf3ee",
          100: "#f8ddcd",
          200: "#eeb695",
          300: "#e28d5c",
          400: "#d06a33",
          500: "#b45309",
          600: "#8f3f0a",
          700: "#6e310c",
          800: "#4d230d",
          900: "#2e1608",
        },
      },
      fontFamily: {
        sans: [
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "Segoe UI",
          "Roboto",
          "Helvetica",
          "Arial",
          "sans-serif",
        ],
      },
    },
  },
  plugins: [],
};

export default config;
