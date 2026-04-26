import type { Config } from "tailwindcss";
import { tokens } from "./lib/design-tokens";

export default {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: tokens.colors.cartoon,
        surface: tokens.colors.surface,
        risk: tokens.colors.risk,
        accent: tokens.colors.accent,
        cartoon: tokens.colors.cartoon,
        tool: tokens.colors.tool,
      },
      borderRadius: tokens.radius,
      fontFamily: tokens.typography.fontFamily,
      fontSize: tokens.typography.fontSize,
      letterSpacing: tokens.typography.letterSpacing,
      transitionDuration: {
        fast: tokens.motion.durations.fast,
        base: tokens.motion.durations.base,
        slow: tokens.motion.durations.slow,
      },
      transitionTimingFunction: {
        standard: tokens.motion.easings.standard,
        emphasized: tokens.motion.easings.emphasized,
      },
      boxShadow: {
        "stick-sm": "1.5px 2px 0 var(--c-ink)",
        "stick-md": "2px 3px 0 var(--c-ink)",
        "stick-card": "0 2px 0 rgba(42,31,85,0.05), 0 8px 24px rgba(42,31,85,0.04)",
        sticker:
          "0 2px 0 rgba(42,31,85,0.10), 0 6px 14px rgba(42,31,85,0.12)",
      },
    },
  },
  plugins: [],
} satisfies Config;
