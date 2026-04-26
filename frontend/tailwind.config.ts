import type { Config } from "tailwindcss";

export default {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: {
          50: "#f7f7f8",
          100: "#eeeef0",
          200: "#d6d7db",
          400: "#8b8d96",
          600: "#4b4e58",
          800: "#1f2128",
          900: "#0f1014",
        },
        risk: {
          low: "#16a34a",
          moderate: "#ca8a04",
          high: "#ea580c",
          critical: "#dc2626",
        },
      },
      fontFamily: {
        sans: ["ui-sans-serif", "system-ui", "-apple-system", "Segoe UI", "Roboto", "sans-serif"],
      },
    },
  },
  plugins: [],
} satisfies Config;
