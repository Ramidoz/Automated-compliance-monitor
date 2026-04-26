import type { Finding } from "@/lib/api";
import { SeverityPill } from "./SeverityPill";

const statusLabels: Record<string, string> = {
  missing: "Missing",
  present: "Present",
  violation: "Violation",
  weak: "Weak",
  contradiction: "Contradiction",
};

export function FindingCard({ finding }: { finding: Finding }) {
  const isFail = ["missing", "violation", "weak", "contradiction"].includes(finding.status);
  return (
    <div
      className={`rounded-lg border bg-white p-4 shadow-sm ${
        isFail ? "border-ink-200" : "border-ink-100 opacity-70"
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <SeverityPill severity={finding.severity} />
            <span className="text-[10px] font-medium uppercase tracking-wider text-ink-400">
              {finding.framework} · {finding.rule_id}
            </span>
            {finding.source === "claude" && (
              <span className="rounded bg-ink-900 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-white">
                AI
              </span>
            )}
          </div>
          <h3 className="mt-1.5 text-sm font-semibold text-ink-900">{finding.title}</h3>
        </div>
        <span
          className={`shrink-0 rounded px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider ${
            isFail ? "bg-ink-900 text-white" : "bg-risk-low/10 text-risk-low"
          }`}
        >
          {statusLabels[finding.status] ?? finding.status}
        </span>
      </div>

      {finding.evidence && (
        <p className="mt-3 line-clamp-3 rounded bg-ink-50 px-3 py-2 text-xs text-ink-600">
          <span className="text-ink-400">Evidence: </span>
          {finding.evidence}
        </p>
      )}
      {isFail && finding.remediation && (
        <p className="mt-2 text-xs text-ink-600">
          <span className="text-ink-400">Remediation: </span>
          {finding.remediation}
        </p>
      )}
      {finding.citation && (
        <p className="mt-2 text-[11px] text-ink-400">{finding.citation}</p>
      )}
    </div>
  );
}
