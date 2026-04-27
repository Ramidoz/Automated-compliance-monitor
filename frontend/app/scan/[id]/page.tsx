/**
 * /scan/[id] — single-scan report.
 *
 * Composition mirrors the Claude Design handoff (scan.jsx):
 *   - back link + action buttons
 *   - filename + policy_name + scanned timestamp
 *   - hero card: gauge column + summary column with severity bars
 *   - 5-cell metric strip (findings · frameworks · citations · cache · cost)
 *   - transcript callout + AgentTranscript card
 *   - VersionPicker (compare with previous scans of the same policy)
 *   - findings grouped by framework with sticker pill filters
 *   - collapsed document excerpt
 */

import Link from "next/link";
import { notFound } from "next/navigation";
import { AgentTranscript } from "@/components/AgentTranscript";
import { FindingCard } from "@/components/FindingCard";
import { RiskGauge } from "@/components/RiskGauge";
import { VersionPicker } from "@/components/VersionPicker";
import { getScan, type Finding } from "@/lib/api";

export const dynamic = "force-dynamic";

const SEVERITY_ORDER: Record<string, number> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
};

const FW_NAMES: Record<string, string> = {
  HIPAA: "HIPAA",
  GDPR: "GDPR",
  PCI_DSS: "PCI-DSS",
  SOC2: "SOC 2",
};

const RISK_VERDICT: Record<string, string> = {
  low: "Strong posture. Minor refinements only.",
  moderate: "Several gaps. Address within the next quarter.",
  high: "Significant exposure. Prioritize fixes now.",
  critical: "Severe gaps. Immediate remediation required.",
  unknown: "Not enough signal to score.",
};

function groupByFramework(findings: Finding[]): Record<string, Finding[]> {
  const out: Record<string, Finding[]> = {};
  for (const f of findings) (out[f.framework] ??= []).push(f);
  for (const list of Object.values(out)) {
    list.sort((a, b) => {
      const fail = (s: string) =>
        ["missing", "violation", "weak", "contradiction"].includes(s) ? 0 : 1;
      return (
        fail(a.status) - fail(b.status) ||
        (SEVERITY_ORDER[a.severity] ?? 9) - (SEVERITY_ORDER[b.severity] ?? 9) ||
        a.title.localeCompare(b.title)
      );
    });
  }
  return out;
}

export default async function ScanPage({ params }: { params: { id: string } }) {
  let scan;
  try {
    scan = await getScan(params.id);
  } catch {
    notFound();
  }

  const grouped = groupByFramework(scan.findings);
  const failed = scan.findings.filter((f) =>
    ["missing", "violation", "weak", "contradiction"].includes(f.status),
  );
  const counts = {
    critical: failed.filter((f) => f.severity === "critical").length,
    high: failed.filter((f) => f.severity === "high").length,
    medium: failed.filter((f) => f.severity === "medium").length,
    low: failed.filter((f) => f.severity === "low").length,
  };
  const maxSev = Math.max(1, ...Object.values(counts));

  const cacheRate =
    (scan.input_tokens ?? 0) > 0
      ? Math.round(((scan.cached_tokens ?? 0) / (scan.input_tokens ?? 1)) * 100)
      : 0;
  const costUsd =
    (((scan.input_tokens ?? 0) - (scan.cached_tokens ?? 0)) * 3 +
      (scan.cached_tokens ?? 0) * 0.3 +
      (scan.output_tokens ?? 0) * 15) /
    1_000_000;

  return (
    <div className="section-gap">
      <div className="page-action-row">
        <Link href="/scans" className="back-link">
          ← All scans
        </Link>
        <div style={{ display: "flex", gap: 8 }}>
          <Link href="/upload" className="btn-ghost btn-xs">
            New scan
          </Link>
        </div>
      </div>

      <div>
        <div className="doc-meta-row">
          <span className="filename">{scan.filename}</span>
          {scan.policy_name && (
            <>
              <span className="sep">·</span>
              <span>{scan.policy_name}</span>
            </>
          )}
          <span className="sep">·</span>
          <span>
            Scanned{" "}
            {new Date(scan.created_at).toLocaleString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
              hour: "numeric",
              minute: "2-digit",
            })}
          </span>
        </div>
        <h1
          style={{
            marginTop: 6,
            fontFamily: "var(--font-fredoka), system-ui, sans-serif",
            fontSize: 28,
            fontWeight: 600,
            color: "var(--c-ink)",
            letterSpacing: "-0.01em",
          }}
        >
          Scan #{scan.id} —{" "}
          <span style={{ textTransform: "capitalize" }}>{scan.risk_label}</span>{" "}
          risk
        </h1>
      </div>

      <div className="card card-pad-lg" style={{ position: "relative" }}>
        <div className={`risk-band ${scan.risk_label}`} />
        <div className="scan-hero">
          <div className="gauge-col">
            <RiskGauge score={scan.risk_score} label={scan.risk_label} size={170} />
            <div className="label">{scan.risk_label} risk</div>
            <div className="verdict">
              {RISK_VERDICT[scan.risk_label] ?? RISK_VERDICT.unknown}
            </div>
          </div>
          <div className="summary-col">
            <span className="eyebrow">Executive summary</span>
            {scan.summary && <p className="summary">{scan.summary}</p>}
            <div className="severity-bars">
              {(["critical", "high", "medium", "low"] as const).map((sev) => {
                const colors = {
                  critical: "var(--risk-critical)",
                  high: "var(--risk-high)",
                  medium: "var(--risk-moderate)",
                  low: "var(--risk-low)",
                } as const;
                return (
                  <div key={sev} className="severity-bar">
                    <span className="label">{sev}</span>
                    <span className="track">
                      <i
                        style={{
                          width: `${(counts[sev] / maxSev) * 100}%`,
                          background: colors[sev],
                        }}
                      />
                    </span>
                    <span className="num">{counts[sev]}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <div className="metric-strip">
        <div className="metric-cell">
          <div className="lab">Findings</div>
          <div className="val">{scan.findings.length}</div>
          <div className="sub">
            {counts.critical + counts.high} need action
          </div>
        </div>
        <div className="metric-cell">
          <div className="lab">Frameworks</div>
          <div className="val">{scan.frameworks.length}</div>
          <div className="sub">
            {scan.frameworks.map((f) => FW_NAMES[f] ?? f).join(" · ")}
          </div>
        </div>
        <div className="metric-cell">
          <div className="lab">Failed</div>
          <div className="val">{failed.length}</div>
          <div className="sub">
            {Math.round((failed.length / Math.max(1, scan.findings.length)) * 100)}% of total
          </div>
        </div>
        <div className="metric-cell cache">
          <div className="lab">Cache hit</div>
          <div className="val">{cacheRate}%</div>
          <div className="sub">
            {(scan.cached_tokens ?? 0).toLocaleString()} tokens reused
          </div>
        </div>
        <div className="metric-cell tokens">
          <div className="lab">Cost</div>
          <div className="val">${costUsd.toFixed(3)}</div>
          <div className="sub">
            {(scan.agent_iterations ?? 0)} agent iter.
          </div>
        </div>
      </div>

      {(scan.agent_transcript?.length ?? 0) > 0 && (
        <>
          <div className="transcript-callout">
            <div className="ico">A</div>
            <div>
              <strong>
                Claude ran {scan.agent_iterations ?? 0} iterations
              </strong>{" "}
              across{" "}
              {(scan.agent_transcript ?? []).filter((s) => s.kind === "tool_use").length}{" "}
              tools — searching the policy, retrieving rule clauses, and
              synthesizing this report. Expand below for every reasoning step.
            </div>
          </div>
          <AgentTranscript scan={scan} />
        </>
      )}

      <VersionPicker scanId={scan.id} />

      <div>
        <span className="eyebrow">Findings</span>
        <h2
          style={{
            marginTop: 4,
            fontFamily: "var(--font-fredoka), system-ui, sans-serif",
            fontSize: 19,
            fontWeight: 600,
            color: "var(--c-ink)",
          }}
        >
          {scan.findings.length} findings · failed sorted first
        </h2>
      </div>

      <div className="section-gap">
        {Object.entries(grouped).map(([framework, findings]) => {
          const fwFailed = findings.filter((f) =>
            ["missing", "violation", "weak", "contradiction"].includes(f.status),
          );
          return (
            <div key={framework}>
              <div className="fw-group-header">
                <span className="name">{FW_NAMES[framework] ?? framework}</span>
                <span className="rule">
                  {fwFailed.length} of {findings.length} need attention
                </span>
                <span className="line" />
              </div>
              <div className="stack-3">
                {findings.map((f) => (
                  <FindingCard
                    key={`${f.framework}-${f.rule_id}`}
                    finding={f}
                  />
                ))}
              </div>
            </div>
          );
        })}
        {scan.findings.length === 0 && (
          <div className="dashed-empty">No findings.</div>
        )}
      </div>

      {scan.document_excerpt && (
        <div className="card">
          <details>
            <summary
              style={{
                cursor: "pointer",
                fontFamily: "var(--font-fredoka), system-ui, sans-serif",
                fontSize: 11,
                textTransform: "uppercase",
                letterSpacing: "0.1em",
                color: "var(--c-ink-soft)",
                fontWeight: 600,
              }}
            >
              Document excerpt (first 4000 chars)
            </summary>
            <pre
              style={{
                marginTop: 12,
                maxHeight: 360,
                overflow: "auto",
                whiteSpace: "pre-wrap",
                background: "var(--surface-100)",
                borderRadius: 12,
                padding: 12,
                fontFamily: "ui-monospace, monospace",
                fontSize: 11.5,
                color: "var(--c-ink)",
              }}
            >
              {scan.document_excerpt}
            </pre>
          </details>
        </div>
      )}
    </div>
  );
}
