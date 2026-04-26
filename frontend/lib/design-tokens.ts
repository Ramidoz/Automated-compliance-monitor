/**
 * Design tokens — single source of truth for the visual system.
 *
 * Mirrors `tokens.css` from the Claude Design handoff:
 * Apple-grade cool grey surface, pastel risk colors, dull lavender / mint
 * accents, plus the cartoon overlay's friendly pastels and ink purple.
 *
 * Component code reads these via Tailwind utility classes (see tailwind.config.ts).
 */

export const tokens = {
  colors: {
    surface: {
      50: "#fbfbfd",
      100: "#f5f5f7",
      200: "#e5e5ea",
      300: "#c7c7cc",
      400: "#86868b",
      500: "#6e6e73",
      600: "#515154",
      700: "#3a3a3c",
      800: "#2c2c2e",
      900: "#1d1d1f",
    },
    risk: {
      low: "#6cc28a",
      moderate: "#e6c674",
      high: "#f0a575",
      critical: "#e88a8a",
    },
    accent: {
      ai: "#9b86c9",
      "ai-50": "#ede9fe",
      "ai-100": "#d8ccf5",
      "ai-300": "#b8a5e3",
      "ai-500": "#9b86c9",
      "ai-700": "#6e5ba0",
      cache: "#7ab592",
      "cache-50": "#e6f4ec",
      "cache-100": "#c7e6d3",
      "cache-300": "#9cd0b1",
      "cache-500": "#7ab592",
      "cache-700": "#4f8a6a",
    },
    tool: {
      "rules-bg": "#faf5ff",
      "rules-fg": "#6b21a8",
      "doc-bg": "#eff6ff",
      "doc-fg": "#1d4ed8",
      "output-bg": "#ecfdf5",
      "output-fg": "#047857",
      "terminal-bg": "#fffbeb",
      "terminal-fg": "#b45309",
    },
    // Cartoon overlay
    cartoon: {
      ink: "#2a1f55",
      "ink-soft": "#5b517f",
      "lavender-tint": "#efeaff",
      "lavender-deep": "#c8b6f5",
      "butter-tint": "#fff4d4",
      "butter-deep": "#f0c462",
      "sage-tint": "#e3f3df",
      "sage-deep": "#84c08a",
      "peach-tint": "#ffe5d4",
      "peach-deep": "#f0a575",
      "rose-tint": "#ffdedf",
      "rose-deep": "#e88a8a",
      "sky-tint": "#d8edff",
      "sky-deep": "#5fa9e0",
    },
  },

  radius: {
    sm: "0.25rem",
    md: "0.5rem",
    lg: "0.75rem",
    xl: "1rem",
    "2xl": "1.25rem",
    chunky: "1.375rem",
    full: "9999px",
  },

  spacing: {
    "0.5": "0.125rem",
    1: "0.25rem",
    2: "0.5rem",
    3: "0.75rem",
    4: "1rem",
    5: "1.25rem",
    6: "1.5rem",
    8: "2rem",
    10: "2.5rem",
    12: "3rem",
    16: "4rem",
  },

  typography: {
    fontFamily: {
      sans: [
        "var(--font-fredoka)",
        "ui-sans-serif",
        "system-ui",
        "-apple-system",
        "Segoe UI",
        "Roboto",
        "sans-serif",
      ],
      display: ["var(--font-fredoka)", "ui-rounded", "system-ui", "sans-serif"],
      script: ["var(--font-caveat)", "Comic Sans MS", "cursive"],
      mono: ["ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
    },
    fontSize: {
      "2xs": "0.6875rem",
      xs: "0.75rem",
      sm: "0.875rem",
      base: "1rem",
      lg: "1.125rem",
      xl: "1.5rem",
      "2xl": "1.875rem",
      "3xl": "2.25rem",
    },
    letterSpacing: {
      tight: "-0.01em",
      wider: "0.04em",
      widest: "0.1em",
    },
  },

  motion: {
    durations: {
      fast: "120ms",
      base: "180ms",
      slow: "260ms",
    },
    easings: {
      standard: "cubic-bezier(0.2, 0, 0, 1)",
      emphasized: "cubic-bezier(0.3, 0, 0, 1)",
    },
  },
};

export type Tokens = typeof tokens;
