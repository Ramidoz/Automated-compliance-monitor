/**
 * Inline SVG icon set ported from the Claude Design handoff (icons.jsx).
 *
 * 16px default, 1.5 stroke weight, currentColor strokes, round caps/joins.
 * Each icon accepts an optional `size` prop. All icons are aria-hidden;
 * wrap in a labelled element if they're the only content.
 */

import * as React from "react";

interface IconProps extends React.SVGAttributes<SVGElement> {
  size?: number;
}

function Svg({ size = 16, children, style, ...rest }: IconProps & { children: React.ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ flexShrink: 0, display: "inline-block", verticalAlign: "-2px", ...style }}
      aria-hidden
      {...rest}
    >
      {children}
    </svg>
  );
}

/* Generic / system */
export const IconChip = (p: IconProps) => (
  <Svg {...p}>
    <rect x="3.5" y="3.5" width="9" height="9" rx="1.5" />
    <path d="M6 1.5v2M10 1.5v2M6 12.5v2M10 12.5v2M1.5 6h2M1.5 10h2M12.5 6h2M12.5 10h2" />
    <circle cx="8" cy="8" r="1.6" />
  </Svg>
);
export const IconBolt = (p: IconProps) => (
  <Svg {...p}>
    <path d="M8.5 1.5 3.5 9h3l-1 5.5L11 7H8l.5-5.5z" />
  </Svg>
);
export const IconClock = (p: IconProps) => (
  <Svg {...p}>
    <circle cx="8" cy="8" r="6" />
    <path d="M8 4.5V8l2.5 1.5" />
  </Svg>
);
export const IconCheck = (p: IconProps) => (
  <Svg {...p}>
    <path d="M3 8.5 6.5 12 13 4.5" />
  </Svg>
);
export const IconCheckCircle = (p: IconProps) => (
  <Svg {...p}>
    <circle cx="8" cy="8" r="6" />
    <path d="M5.5 8 7.5 10 11 6" />
  </Svg>
);
export const IconX = (p: IconProps) => (
  <Svg {...p}>
    <path d="M4 4l8 8M12 4l-8 8" />
  </Svg>
);
export const IconArrowRight = (p: IconProps) => (
  <Svg {...p}>
    <path d="M3 8h10M9 4l4 4-4 4" />
  </Svg>
);
export const IconPlus = (p: IconProps) => (
  <Svg {...p}>
    <path d="M8 3v10M3 8h10" />
  </Svg>
);
export const IconPause = (p: IconProps) => (
  <Svg {...p}>
    <rect x="4.5" y="3" width="2" height="10" rx="0.5" />
    <rect x="9.5" y="3" width="2" height="10" rx="0.5" />
  </Svg>
);
export const IconPlay = (p: IconProps) => (
  <Svg {...p}>
    <path d="M5 3.5v9l7-4.5z" />
  </Svg>
);
export const IconCompass = (p: IconProps) => (
  <Svg {...p}>
    <circle cx="8" cy="8" r="6" />
    <path d="m10.5 5.5-3 1.4-1.4 3.6 3-1.4z" />
  </Svg>
);
export const IconAlert = (p: IconProps) => (
  <Svg {...p}>
    <path d="M8 2 1.5 13.5h13L8 2z" />
    <path d="M8 6.5v3.5M8 12v.01" />
  </Svg>
);
export const IconTicket = (p: IconProps) => (
  <Svg {...p}>
    <path d="M2 6V4.5h12V6a1.5 1.5 0 0 0 0 3v2.5H2V9a1.5 1.5 0 0 0 0-3z" />
    <path d="M6 5v6" strokeDasharray="1 1.5" />
  </Svg>
);
export const IconQueue = (p: IconProps) => (
  <Svg {...p}>
    <path d="M2 4h12M2 8h12M2 12h8" />
  </Svg>
);

/* Domain / sources */
export const IconDoc = (p: IconProps) => (
  <Svg {...p}>
    <path d="M4 1.5h5l3 3v10H4z" />
    <path d="M9 1.5V5h3M6 8h4M6 10.5h4M6 6h2" />
  </Svg>
);
export const IconScales = (p: IconProps) => (
  <Svg {...p}>
    <path d="M8 2v12M4 14h8M3 5h10M5 5l-2 4a2 2 0 0 0 4 0zM11 5l-2 4a2 2 0 0 0 4 0z" />
  </Svg>
);
export const IconPencil = (p: IconProps) => (
  <Svg {...p}>
    <path d="m2.5 13.5 2.5-.5L13 5l-2-2-8 8z" />
    <path d="m9 4 2 2" />
  </Svg>
);
export const IconSearch = (p: IconProps) => (
  <Svg {...p}>
    <circle cx="7" cy="7" r="4.5" />
    <path d="m13.5 13.5-3-3" />
  </Svg>
);
export const IconBroadcast = (p: IconProps) => (
  <Svg {...p}>
    <path d="M3.5 5.5a4 4 0 0 0 0 5M12.5 5.5a4 4 0 0 1 0 5M5.5 7a2 2 0 0 0 0 2M10.5 7a2 2 0 0 1 0 2" />
    <circle cx="8" cy="8" r="0.8" />
    <path d="M8 9v5" />
  </Svg>
);
export const IconCalendar = (p: IconProps) => (
  <Svg {...p}>
    <rect x="2" y="3.5" width="12" height="11" rx="1.5" />
    <path d="M2 6.5h12M5 2v3M11 2v3" />
  </Svg>
);
export const IconPaperclip = (p: IconProps) => (
  <Svg {...p}>
    <path d="M11 5 6 10a1.5 1.5 0 0 0 2 2l5-5a3 3 0 0 0-4-4l-5 5a4.5 4.5 0 0 0 6 6l4-4" />
  </Svg>
);

/* Resolved kinds */
export const IconShieldCheck = (p: IconProps) => (
  <Svg {...p}>
    <path d="M8 1.5 2.5 4v4.5c0 3 2.5 5 5.5 6 3-1 5.5-3 5.5-6V4z" />
    <path d="M5.5 8 7.5 10 11 6.5" />
  </Svg>
);
export const IconWrench = (p: IconProps) => (
  <Svg {...p}>
    <path d="M11.5 2.5a3 3 0 0 0-3 4l-6 6 1.5 1.5 6-6a3 3 0 0 0 4-3z" />
  </Svg>
);
export const IconSkip = (p: IconProps) => (
  <Svg {...p}>
    <path d="M3.5 4v8l5-4zM10.5 4v8" />
  </Svg>
);

/* Section-head icons (24px, sit inside a colored bubble) */
export const SectionIcon = ({
  kind,
  size = 24,
}: {
  kind: "live" | "queue" | "triage" | "resolved" | "portfolio" | "watchers";
  size?: number;
}) => {
  const common = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2.2,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
  };
  switch (kind) {
    case "live":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="3" fill="currentColor" />
          <circle cx="12" cy="12" r="8" />
        </svg>
      );
    case "queue":
      return (
        <svg {...common}>
          <rect x="3" y="6" width="18" height="3" rx="1.5" />
          <rect x="3" y="11" width="14" height="3" rx="1.5" />
          <rect x="3" y="16" width="10" height="3" rx="1.5" />
        </svg>
      );
    case "triage":
      return (
        <svg {...common}>
          <path d="M4 5h16l-2 8H6L4 5Z" />
          <path d="M4 5L3 3" />
          <circle cx="9" cy="19" r="1.5" fill="currentColor" />
          <circle cx="17" cy="19" r="1.5" fill="currentColor" />
        </svg>
      );
    case "resolved":
      return (
        <svg {...common}>
          <path d="M5 12l5 5 9-11" />
        </svg>
      );
    case "portfolio":
      return (
        <svg {...common}>
          <rect x="3" y="5" width="18" height="14" rx="2.5" />
          <path d="M3 9h18" />
          <path d="M8 13h3" />
        </svg>
      );
    case "watchers":
      return (
        <svg {...common}>
          <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
          <circle cx="12" cy="12" r="3" />
        </svg>
      );
  }
};
