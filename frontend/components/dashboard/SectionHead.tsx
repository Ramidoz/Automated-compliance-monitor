/**
 * Section header — chunky icon bubble + Fredoka heading with squiggle
 * underline + plain-English explainer + optional badge.
 *
 * Used above each major card on the dashboard so a first-time visitor
 * can read a section title at a glance and know what they're looking at.
 */

import type { ReactNode } from "react";

export type SectionTone = "lavender" | "butter" | "sage" | "peach" | "rose" | "sky";

export function SectionHead({
  tone,
  icon,
  title,
  badge,
  sub,
  squiggle = true,
}: {
  tone: SectionTone;
  icon: ReactNode;
  title: string;
  badge?: ReactNode;
  sub?: string;
  squiggle?: boolean;
}) {
  return (
    <div className="sec-head">
      <div className={`bubble ${tone}`}>{icon}</div>
      <div className="text">
        <h2>
          {squiggle ? <span className="squiggle">{title}</span> : title}
          {badge != null && <span className="badge">{badge}</span>}
        </h2>
        {sub && <p>{sub}</p>}
      </div>
    </div>
  );
}
