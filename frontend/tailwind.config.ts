import type { Config } from "tailwindcss";
import { tokens } from "./lib/design-tokens";

export default {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Backwards-compat alias: existing components use `ink-*`. Mapping it
        // onto the canonical `surface` scale keeps one source of truth in
        // design-tokens.ts.
        ink: tokens.colors.surface,
        surface: tokens.colors.surface,
        risk: tokens.colors.risk,
        accent: tokens.colors.accent,
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
    },
  },
  plugins: [],
} satisfies Config;
