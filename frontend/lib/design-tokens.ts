/**
 * Design tokens — single source of truth for the visual system.
 *
 * Read by `tailwind.config.ts` to populate the theme. When Claude Design
 * exports a handoff bundle with refreshed tokens, replace the values in
 * this file and the rest of the system updates automatically.
 *
 * Naming follows a 3-tier convention:
 *   - `colors.brand.*`   — product / accent colors
 *   - `colors.surface.*` — backgrounds and chrome (neutral scale)
 *   - `colors.risk.*`    — semantic colors tied to compliance severity
 *
 * Do NOT hand-write hex values in components. Reach for a token.
 */

export const tokens = {
  colors: {
    surface: {
      50: "#f7f7f8",   // page background
      100: "#eeeef0",  // card surface lift
      200: "#d6d7db",  // borders, dividers
      400: "#8b8d96",  // muted text, icons
      600: "#4b4e58",  // body text
      800: "#1f2128",  // primary buttons, headings
      900: "#0f1014",  // strongest ink, hero text
    },
    risk: {
      low: "#16a34a",       // green — passing posture
      moderate: "#ca8a04",  // amber — minor refinements
      high: "#ea580c",      // orange — significant exposure
      critical: "#dc2626",  // red — immediate action
    },
    accent: {
      ai: "#7c3aed",        // violet — flags AI-generated findings
      cache: "#10b981",     // teal — prompt-cache hit indicators
    },
  },

  radius: {
    sm: "0.25rem",
    md: "0.5rem",
    lg: "0.75rem",
    xl: "1rem",
    "2xl": "1.25rem",
    full: "9999px",
  },

  spacing: {
    // Tight 4px grid; layouts compose from these.
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
        "ui-sans-serif",
        "system-ui",
        "-apple-system",
        "Segoe UI",
        "Roboto",
        "sans-serif",
      ],
      mono: ["ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
    },
    fontSize: {
      // Compact data-dense scale; favor smaller defaults than typical
      // marketing sites.
      "2xs": "0.6875rem",   // 11px — pills, footnotes
      xs: "0.75rem",        // 12px — labels, captions
      sm: "0.875rem",       // 14px — body default
      base: "1rem",         // 16px — secondary body
      lg: "1.125rem",       // 18px — section headings
      xl: "1.5rem",         // 24px — page titles
      "2xl": "1.875rem",    // 30px — risk score numerals
      "3xl": "2.25rem",     // 36px — hero
    },
    letterSpacing: {
      wider: "0.04em",
      widest: "0.1em",      // uppercase labels
    },
  },

  motion: {
    // Reach for these from CSS transition-* utilities. Anything slower than
    // 200ms feels sluggish on a data-dense screen; anything faster than
    // 100ms feels jittery.
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
