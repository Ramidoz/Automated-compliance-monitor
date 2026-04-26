/**
 * Resolved feed — chronological log of actions the agent finished
 * autonomously, tagged by kind (verified / closed / maintenance / skipped).
 */

import type { ResolvedItem, ResolvedKind } from "@/lib/dashboard-mock";
import {
  IconCheckCircle,
  IconShieldCheck,
  IconSkip,
  IconWrench,
} from "@/components/icons";

const KIND_LABELS: Record<ResolvedKind, string> = {
  verified: "verified",
  closed: "closed",
  maintenance: "maintenance",
  skipped: "skipped",
};

const KIND_ICONS: Record<ResolvedKind, JSX.Element> = {
  verified: <IconShieldCheck />,
  closed: <IconCheckCircle />,
  maintenance: <IconWrench />,
  skipped: <IconSkip />,
};

export function ResolvedFeed({ resolved }: { resolved: ResolvedItem[] }) {
  return (
    <div className="card resolved-card">
      <div className="resolved-list">
        {resolved.map((r) => (
          <div key={r.id} className="resolved-item">
            <span className={`r-kind r-${r.kind}`}>
              {KIND_ICONS[r.kind]} {KIND_LABELS[r.kind]}
            </span>
            <span className="r-text">{r.text}</span>
            <span className="r-when">{r.when}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
