/**
 * Live job card — what the agent is doing right now.
 * Header with live-pulse + Pause/Steer, then title, trigger pill, why
 * blurb, progress bar, and the last 7 entries from the agent's
 * streaming transcript with kind-tagged rows.
 */

import type { LiveJob } from "@/lib/dashboard-mock";
import { IconArrowRight, IconBroadcast, IconChip } from "@/components/icons";

export function LiveJobCard({ job }: { job: LiveJob }) {
  // Render the latest 7 stream events. The "current" treatment is applied
  // to the most recent entry — that's the step the agent is on.
  const recent = job.stream.slice(-7);

  return (
    <div className="card live-job-card">
      <div className="live-job-head">
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span className="live-pulse" />
          <span className="eyebrow">Working now</span>
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          <button type="button" className="btn-ghost btn-xs">
            Pause
          </button>
          <button type="button" className="btn-ghost btn-xs">
            Steer
          </button>
        </div>
      </div>

      <h3 className="live-job-title">{job.title}</h3>

      <div className="live-job-why">
        <span className="trigger-pill">
          <IconBroadcast /> {job.trigger.source}
        </span>
        <span className="when">{job.trigger.when}</span>
        <p>{job.why}</p>
      </div>

      <div className="live-job-progress">
        <div className="track">
          <div className="fill" style={{ width: `${job.progress_pct}%` }} />
        </div>
        <div className="meta">
          iteration {job.iteration}/{job.iteration_total_estimate} · est.{" "}
          {Math.max(0, 50 - job.progress_pct / 2)}s left
        </div>
      </div>

      <div className="live-stream">
        {recent.map((s, i) => {
          const isLast = i === recent.length - 1;
          const KindIcon = s.kind === "thinking" ? IconChip : IconArrowRight;
          const kindLabel =
            s.kind === "thinking" ? "thinking" : s.name ?? s.kind;
          return (
            <div
              key={`${s.t}-${i}`}
              className={`live-step ${s.kind}${isLast ? " current" : ""}`}
              style={{ animationDelay: `${i * 30}ms` }}
            >
              <span className="kind-tag">
                <KindIcon /> {kindLabel}
              </span>
              <span className="text">{s.text || s.summary || s.args}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
