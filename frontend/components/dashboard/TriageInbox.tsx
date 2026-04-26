"use client";

/**
 * Triage inbox — findings the agent surfaced that need a human verdict.
 *
 * Each item carries a severity-coded left rail, sev/origin/framework
 * stickers, the finding's title + policy + summary + origin blurb, any
 * attached drafts, and four action buttons (Act now / Later / Ignore /
 * Open scan). Verdict state is local — clicking a button replaces the
 * action row with a "Sorted to <verdict>" + Undo control.
 */

import { useState } from "react";
import Link from "next/link";
import type { InboxItem, OriginKind } from "@/lib/dashboard-mock";
import {
  IconArrowRight,
  IconBolt,
  IconCalendar,
  IconClock,
  IconPaperclip,
  IconPencil,
  IconScales,
  IconSearch,
  IconX,
} from "@/components/icons";

type Verdict = "act_now" | "later" | "ignore" | null;

const ORIGIN_LABELS: Record<OriginKind, string> = {
  regulator_update: "REG UPDATE",
  doc_change: "POLICY EDIT",
  expanded_coverage: "DEEP SCAN",
  scheduled: "SWEEP",
};

const ORIGIN_ICONS: Record<OriginKind, JSX.Element> = {
  regulator_update: <IconScales />,
  doc_change: <IconPencil />,
  expanded_coverage: <IconSearch />,
  scheduled: <IconCalendar />,
};

const SEV_ORDER: Record<InboxItem["severity"], number> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
};

export function TriageInbox({ inbox }: { inbox: InboxItem[] }) {
  const [verdicts, setVerdicts] = useState<Record<string, Verdict>>(() =>
    Object.fromEntries(inbox.map((f) => [f.id, f.act])),
  );

  const sorted = [...inbox].sort(
    (a, b) => SEV_ORDER[a.severity] - SEV_ORDER[b.severity],
  );
  const open = sorted.filter((f) => !verdicts[f.id]);

  const setVerdict = (id: string, v: Verdict) =>
    setVerdicts((p) => ({ ...p, [id]: v }));

  return (
    <div className="card triage-card">
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 14,
          gap: 12,
        }}
      >
        <div className="eyebrow">{open.length} open</div>
        <div style={{ display: "flex", gap: 4 }}>
          <button type="button" className="filter-tab on">
            All
          </button>
          <button type="button" className="filter-tab">
            Critical
          </button>
          <button type="button" className="filter-tab">
            From regs
          </button>
        </div>
      </div>

      <div className="triage-list">
        {sorted.map((f) => {
          const verdict = verdicts[f.id];
          return (
            <div
              key={f.id}
              className={`triage-item sev-${f.severity}${verdict ? " actioned" : ""}`}
            >
              <div className="ti-rail" />
              <div className="ti-top">
                <div className="ti-left">
                  <span className={`sev-badge sev-${f.severity}`}>
                    {f.severity}
                  </span>
                  <span className="origin-tag">
                    {ORIGIN_ICONS[f.origin]} {ORIGIN_LABELS[f.origin]}
                  </span>
                  <span className="fw-tag-mini">
                    {f.framework.replace("_", "-")}
                  </span>
                  <span className="ti-section">{f.section}</span>
                </div>
                <span className="ti-when">{f.surfaced}</span>
              </div>
              <h4 className="ti-h">{f.title}</h4>
              <p className="ti-policy">
                on <strong>{f.policy}</strong>
              </p>
              <p className="ti-summary">{f.summary}</p>
              <p className="ti-origin-blurb">↳ {f.origin_label}</p>

              {f.attached.length > 0 && (
                <div className="ti-attached">
                  {f.attached.map((a) => (
                    <span key={a} className="attach-pill">
                      <IconPaperclip /> {a}
                    </span>
                  ))}
                </div>
              )}

              <div className="ti-actions">
                {verdict ? (
                  <span className="verdict-set">
                    Sorted to <strong>{verdict.replace("_", " ")}</strong>
                    <button
                      type="button"
                      className="undo"
                      onClick={() => setVerdict(f.id, null)}
                    >
                      Undo
                    </button>
                  </span>
                ) : (
                  <>
                    <button
                      type="button"
                      className="action-btn act-now"
                      onClick={() => setVerdict(f.id, "act_now")}
                    >
                      <IconBolt /> Act now
                    </button>
                    <button
                      type="button"
                      className="action-btn later"
                      onClick={() => setVerdict(f.id, "later")}
                    >
                      <IconClock /> Later
                    </button>
                    <button
                      type="button"
                      className="action-btn ignore"
                      onClick={() => setVerdict(f.id, "ignore")}
                    >
                      <IconX /> Ignore
                    </button>
                    <Link className="action-btn open-link" href={`/scan/1`}>
                      Open scan <IconArrowRight />
                    </Link>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
