/**
 * Queue card — what the agent will work on next, in order.
 * Each row carries a numbered badge, title, priority pill, trigger tag,
 * reason, and ETA.
 */

import type { QueueItem, TriggerKind } from "@/lib/dashboard-mock";
import { IconCalendar, IconPencil, IconScales } from "@/components/icons";

const TRIGGER_LABELS: Record<TriggerKind, string> = {
  regulator_update: "regulator",
  scheduled: "schedule",
  doc_change: "policy edit",
};

const TRIGGER_ICONS: Record<TriggerKind, JSX.Element> = {
  regulator_update: <IconScales />,
  scheduled: <IconCalendar />,
  doc_change: <IconPencil />,
};

export function QueueCard({ queue }: { queue: QueueItem[] }) {
  return (
    <div className="card queue-card">
      <div className="queue-list">
        {queue.map((q, idx) => (
          <div key={q.id} className="queue-item">
            <div className="qi-num">{idx + 1}</div>
            <div>
              <div className="qi-top">
                <span className="qi-title">{q.title}</span>
                <span className={`prio-pill ${q.priority}`}>{q.priority}</span>
              </div>
              <div className="qi-meta">
                <span className="trigger-tag">
                  {TRIGGER_ICONS[q.trigger]} {TRIGGER_LABELS[q.trigger]}
                </span>
                <span className="dot-sep">·</span>
                <span>{q.reason}</span>
                <span className="qi-eta">{q.eta}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
