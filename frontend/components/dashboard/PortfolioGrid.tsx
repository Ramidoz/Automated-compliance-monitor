"use client";

/**
 * Portfolio grid — 2-up tiles of monitored policies. Each tile shows
 * the policy short name, agent state, sparkline trend, current risk
 * score, framework list, and open/critical/high counts. Click to expand
 * a row of actions (Open scan / Re-scan / Pause).
 */

import { useState } from "react";
import Link from "next/link";
import type { Policy } from "@/lib/dashboard-mock";

const STATE_LABELS: Record<Policy["agent_state"], string> = {
  scanning: "Scanning",
  queued: "Queued",
  watching: "Watching",
  up_to_date: "Up to date",
  needs_attention: "Needs you",
};

function PolicyTile({
  p,
  selected,
  onClick,
}: {
  p: Policy;
  selected: boolean;
  onClick: () => void;
}) {
  const max = Math.max(...p.trend);
  return (
    <div
      className={`policy-tile state-${p.agent_state}`}
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick();
        }
      }}
    >
      <div className="pt-top">
        <div className="pt-name">
          <span className={`risk-dot risk-${p.risk_label}`} />
          {p.short}
        </div>
        <span className={`pt-state state-${p.agent_state}`}>
          {STATE_LABELS[p.agent_state]}
        </span>
      </div>
      <div className="pt-fullname">{p.name}</div>
      <div className="pt-spark">
        <div className="sparkline">
          {p.trend.map((v, i) => (
            <div
              key={i}
              className={`bar ${i === p.trend.length - 1 ? p.risk_label : ""}`}
              style={{
                height: `${Math.max(4, (v / max) * 28)}px`,
                opacity: i === p.trend.length - 1 ? 1 : 0.45,
              }}
            />
          ))}
        </div>
        <div className="pt-score">
          <span className="num">{p.risk_score}</span>
          <span className="lbl">/100</span>
        </div>
      </div>
      <div className="pt-bottom">
        <div className="pt-meta">
          <span className="pt-fws">{p.frameworks.join(" · ")}</span>
        </div>
        <div className="pt-meta">
          <span>{p.open_findings} open</span>
          {p.critical > 0 && <span className="pt-crit">· {p.critical} crit</span>}
          {p.high > 0 && <span className="pt-high">· {p.high} high</span>}
        </div>
        <div className="pt-foot">
          <span>last {p.last_scan}</span>
          <span>{p.next_check}</span>
        </div>
      </div>
      {selected && (
        <div
          className="pt-bottom"
          onClick={(e) => e.stopPropagation()}
          style={{ display: "flex", flexDirection: "row", flexWrap: "wrap", gap: 6 }}
        >
          <Link
            className="btn-ghost btn-xs"
            href={`/scan/${p.latest_scan_id}`}
          >
            Open scan →
          </Link>
          <button type="button" className="btn-ghost btn-xs">
            Re-scan now
          </button>
          <button type="button" className="btn-ghost btn-xs">
            Pause monitoring
          </button>
        </div>
      )}
    </div>
  );
}

export function PortfolioGrid({ policies }: { policies: Policy[] }) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  return (
    <div className="card portfolio-card">
      <div className="portfolio-grid">
        {policies.map((p) => (
          <PolicyTile
            key={p.id}
            p={p}
            selected={selectedId === p.id}
            onClick={() =>
              setSelectedId((cur) => (cur === p.id ? null : p.id))
            }
          />
        ))}
      </div>
    </div>
  );
}
