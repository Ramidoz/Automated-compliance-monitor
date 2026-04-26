/**
 * Watchers list — sources the agent monitors on a schedule
 * (regulators, doc stores, sweep windows). Recent-change watchers
 * carry a rose flag to make provenance scannable.
 */

import type { Watcher, WatcherKind } from "@/lib/dashboard-mock";
import { IconCalendar, IconDoc, IconScales } from "@/components/icons";

const KIND_ICONS: Record<WatcherKind, JSX.Element> = {
  regulator: <IconScales />,
  doc: <IconDoc />,
  schedule: <IconCalendar />,
};

export function WatchersList({ watchers }: { watchers: Watcher[] }) {
  return (
    <div className="card watchers-card">
      <div className="watchers-list">
        {watchers.map((w) => (
          <div
            key={w.id}
            className={`watcher-item ${w.recent_change ? "recent" : ""}`}
          >
            <span className={`w-ico kind-${w.kind}`}>{KIND_ICONS[w.kind]}</span>
            <div>
              <div className="w-source">{w.source}</div>
              <div className="w-meta">
                <span className={`w-status ${w.status}`}>● {w.status}</span>
                <span className="dot-sep">·</span>
                <span>{w.last_event}</span>
                {w.recent_change && <span className="w-flag">change detected</span>}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
