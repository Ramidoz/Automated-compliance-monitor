/**
 * /compare/[after]/[before] — diff between two scans of the same policy.
 *
 * Composition mirrors the design (compare.jsx):
 *   - back link + actions
 *   - eyebrow + h1 ("Scan #B → #A")
 *   - filename arrow row
 *   - score card: before → after numbers + delta pill
 *     5-cell count grid (Closed · Improved · Still failing · Regressed · Opened)
 *     stacked balance bar with legend
 *   - sections by change kind, each entry has before/after side-by-side
 */

import Link from "next/link";
import { notFound } from "next/navigation";
import { SeverityPill } from "@/components/SeverityPill";
import { compareScans, type DiffChange, type DiffEntry } from "@/lib/api";

export const dynamic = "force-dynamic";

const FW_NAMES: Record<string, string> = {
  HIPAA: "HIPAA",
  GDPR: "GDPR",
  PCI_DSS: "PCI-DSS",
  SOC2: "SOC 2",
};

const SECTION_ORDER: DiffChange[] = [
  "opened",
  "regressed",
  "closed",
  "improved",
  "still_failing",
];

const SECTION_META: Record<
  DiffChange,
  { title: string; desc: string; cls: string }
> = {
  opened: {
    title: "Opened",
    desc: "Findings introduced in the new scan.",
    cls: "opened",
  },
  regressed: {
    title: "Regressed",
    desc: "Severity got worse.",
    cls: "regressed",
  },
  improved: {
    title: "Improved",
    desc: "Severity moved in the right direction.",
    cls: "improved",
  },
  closed: {
    title: "Closed",
    desc: "Now passing.",
    cls: "closed",
  },
  still_failing: {
    title: "Still failing",
    desc: "Carried over with no material change.",
    cls: "still",
  },
  still_passing: {
    title: "Still passing",
    desc: "—",
    cls: "still",
  },
};

const STATUS_LABELS: Record<string, string> = {
  missing: "Missing",
  weak: "Weak",
  contradiction: "Contradiction",
  violation: "Violation",
  present: "Present",
};

function StatusTag({ status }: { status: string }) {
  const failing = ["missing", "violation", "weak", "contradiction"].includes(
    status,
  );
  return (
    <span className={`status-tag ${failing ? "status-fail" : "status-pass"}`}>
      {STATUS_LABELS[status] ?? status}
    </span>
  );
}

function DiffEntryRow({ entry }: { entry: DiffEntry }) {
  const meta = SECTION_META[entry.change];
  return (
    <div className="diff-entry">
      <div className="finding-head">
        <div>
          <div className="finding-pill-row">
            <span className={`change-tag ${meta.cls}`}>
              {entry.change.replace("_", " ")}
            </span>
            <span className="finding-rule">
              {FW_NAMES[entry.framework] ?? entry.framework} · {entry.rule_id}
            </span>
          </div>
          <div className="finding-title">{entry.title}</div>
        </div>
      </div>
      <div className="diff-bodies">
        <div className="diff-side">
          <div className="lab">Before</div>
          {entry.before ? (
            <>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <SeverityPill severity={entry.before.severity} />
                <StatusTag status={entry.before.status} />
              </div>
              {entry.before.evidence ? (
                <div className="ev">“{entry.before.evidence}”</div>
              ) : (
                <div
                  style={{
                    marginTop: 6,
                    fontFamily: "var(--font-fredoka), system-ui, sans-serif",
                    fontSize: 12,
                    color: "var(--c-ink-soft)",
                    fontStyle: "italic",
                  }}
                >
                  No matching language.
                </div>
              )}
            </>
          ) : (
            <div
              style={{
                fontFamily: "var(--font-fredoka), system-ui, sans-serif",
                fontSize: 12,
                color: "var(--c-ink-soft)",
                fontStyle: "italic",
              }}
            >
              Not present in earlier scan.
            </div>
          )}
        </div>
        <div className="diff-side after">
          <div className="lab">After</div>
          {entry.after ? (
            <>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <SeverityPill severity={entry.after.severity} />
                <StatusTag status={entry.after.status} />
              </div>
              {entry.after.evidence ? (
                <div className="ev">“{entry.after.evidence}”</div>
              ) : (
                <div
                  style={{
                    marginTop: 6,
                    fontFamily: "var(--font-fredoka), system-ui, sans-serif",
                    fontSize: 12,
                    color: "var(--c-ink-soft)",
                    fontStyle: "italic",
                  }}
                >
                  No matching language.
                </div>
              )}
            </>
          ) : (
            <div
              style={{
                fontFamily: "var(--font-fredoka), system-ui, sans-serif",
                fontSize: 12,
                color: "var(--c-ink-soft)",
                fontStyle: "italic",
              }}
            >
              Resolved — no longer flagged.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default async function ComparePage({
  params,
}: {
  params: { after: string; before: string };
}) {
  let diff;
  try {
    diff = await compareScans(params.after, params.before);
  } catch {
    notFound();
  }

  const grouped: Record<DiffChange, DiffEntry[]> = {
    opened: [],
    regressed: [],
    closed: [],
    improved: [],
    still_failing: [],
    still_passing: [],
  };
  for (const e of diff.entries) grouped[e.change].push(e);

  const total =
    diff.counts.closed +
    (diff.counts.improved ?? 0) +
    diff.counts.still_failing +
    diff.counts.regressed +
    diff.counts.opened;
  const segs = [
    { k: "closed" as const, n: diff.counts.closed, lab: "Closed" },
    { k: "improved" as const, n: diff.counts.improved ?? 0, lab: "Improved" },
    { k: "still" as const, n: diff.counts.still_failing, lab: "Still failing" },
    { k: "regressed" as const, n: diff.counts.regressed, lab: "Regressed" },
    { k: "opened" as const, n: diff.counts.opened, lab: "Opened" },
  ].filter((s) => s.n > 0);

  return (
    <div className="section-gap">
      <div className="page-action-row">
        <Link href={`/scan/${diff.after.id}`} className="back-link">
          ← Back to scan #{diff.after.id}
        </Link>
        <Link href="/scans" className="btn-ghost btn-xs">
          All scans
        </Link>
      </div>

      <div>
        <span className="eyebrow">Compare scans</span>
        <h1
          style={{
            marginTop: 4,
            fontFamily: "var(--font-fredoka), system-ui, sans-serif",
            fontSize: 26,
            fontWeight: 600,
            color: "var(--c-ink)",
            letterSpacing: "-0.01em",
          }}
        >
          Scan #{diff.before.id} → #{diff.after.id}
        </h1>
        <div className="doc-meta-row" style={{ marginTop: 6 }}>
          {diff.after.policy_name && <span>{diff.after.policy_name}</span>}
          {diff.after.policy_name && <span className="sep">·</span>}
          <span className="filename">{diff.before.filename}</span>
          <span className="sep">→</span>
          <span className="filename">{diff.after.filename}</span>
        </div>
      </div>

      <div className="card card-pad-lg">
        <div className="diff-summary">
          <div>
            <span className="eyebrow">Risk score</span>
            <div className="delta">
              <span className="num">{Math.round(diff.before.risk_score)}</span>
              <span className="arrow">→</span>
              <span className="num">{Math.round(diff.after.risk_score)}</span>
              <span
                className={`delta-pill ${diff.risk_score_delta < 0 ? "good" : diff.risk_score_delta > 0 ? "bad" : ""}`}
              >
                {diff.risk_score_delta > 0 ? "+" : ""}
                {diff.risk_score_delta.toFixed(1)}
              </span>
            </div>
            <div
              style={{
                marginTop: 8,
                display: "flex",
                gap: 14,
                fontFamily: "var(--font-fredoka), system-ui, sans-serif",
                fontSize: 12,
                color: "var(--c-ink-soft)",
              }}
            >
              <span>
                <span className={`risk-dot risk-${diff.before.risk_label}`} style={{ display: "inline-block" }} />{" "}
                {diff.before.risk_label}
              </span>
              <span style={{ color: "var(--surface-300)" }}>→</span>
              <span>
                <span className={`risk-dot risk-${diff.after.risk_label}`} style={{ display: "inline-block" }} />{" "}
                {diff.after.risk_label}
              </span>
            </div>
          </div>
          <div className="count-grid">
            <div className="count-cell closed">
              <div className="num">{diff.counts.closed}</div>
              <div className="lab">Closed</div>
            </div>
            <div className="count-cell improved">
              <div className="num">{diff.counts.improved ?? 0}</div>
              <div className="lab">Improved</div>
            </div>
            <div className="count-cell still">
              <div className="num">{diff.counts.still_failing}</div>
              <div className="lab">Still failing</div>
            </div>
            <div className="count-cell regressed">
              <div className="num">{diff.counts.regressed}</div>
              <div className="lab">Regressed</div>
            </div>
            <div className="count-cell opened">
              <div className="num">{diff.counts.opened}</div>
              <div className="lab">Opened</div>
            </div>
          </div>
        </div>
        {total > 0 && (
          <>
            <div className="diff-balance">
              {segs.map((s) => (
                <div
                  key={s.k}
                  className={`seg ${s.k}`}
                  style={{ flex: s.n }}
                >
                  {s.n}
                </div>
              ))}
            </div>
            <div className="diff-balance-legend">
              {segs.map((s) => (
                <span key={s.k} className={`k ${s.k}`}>
                  {s.lab}
                </span>
              ))}
            </div>
          </>
        )}
      </div>

      {SECTION_ORDER.map((change) => {
        const list = grouped[change];
        if (list.length === 0) return null;
        const meta = SECTION_META[change];
        return (
          <div key={change}>
            <div className="section-eyebrow-row">
              <div>
                <span className="eyebrow">{meta.title}</span>
                <h2
                  style={{
                    marginTop: 4,
                    fontFamily: "var(--font-fredoka), system-ui, sans-serif",
                    fontSize: 18,
                    fontWeight: 600,
                    color: "var(--c-ink)",
                  }}
                >
                  {list.length} ·{" "}
                  <span
                    style={{
                      fontWeight: 400,
                      color: "var(--c-ink-soft)",
                      fontSize: 14,
                    }}
                  >
                    {meta.desc}
                  </span>
                </h2>
              </div>
            </div>
            <div className="stack-3">
              {list.map((e, i) => (
                <DiffEntryRow key={i} entry={e} />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
