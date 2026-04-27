/**
 * Finding card — one row in the findings list on /scan/[id].
 *
 * Severity-coded left rail (via the data-sev attribute consumed in
 * globals.css), severity pill + framework + rule_id + AI badge in the
 * head, status tag (Missing / Weak / Present / Violation), evidence
 * quote, remediation, regulatory citation.
 */

import type { Finding } from "@/lib/api";
import { SeverityPill } from "./SeverityPill";

const FW_NAMES: Record<string, string> = {
  HIPAA: "HIPAA",
  GDPR: "GDPR",
  PCI_DSS: "PCI-DSS",
  SOC2: "SOC 2",
};

const STATUS_LABELS: Record<string, string> = {
  missing: "Missing",
  present: "Present",
  violation: "Violation",
  weak: "Weak",
  contradiction: "Contradiction",
};

function StatusTag({ status }: { status: string }) {
  const failing = ["missing", "violation", "weak", "contradiction"].includes(status);
  return (
    <span className={`status-tag ${failing ? "status-fail" : "status-pass"}`}>
      {STATUS_LABELS[status] ?? status}
    </span>
  );
}

export function FindingCard({ finding }: { finding: Finding }) {
  const passing = finding.status === "present";
  return (
    <div
      className={`finding ${passing ? "pass" : ""}`}
      data-sev={finding.severity}
    >
      <div className="finding-head">
        <div>
          <div className="finding-pill-row">
            <SeverityPill severity={finding.severity} />
            <span className="finding-rule">
              {FW_NAMES[finding.framework] ?? finding.framework} · {finding.rule_id}
            </span>
            {finding.source === "claude" && <span className="ai-badge">AI</span>}
          </div>
          <div className="finding-title">{finding.title}</div>
        </div>
        <StatusTag status={finding.status} />
      </div>
      {finding.evidence && (
        <div className="finding-evidence">
          <span className="label">Evidence</span>
          <span style={{ fontStyle: "italic" }}>“{finding.evidence}”</span>
        </div>
      )}
      {!finding.evidence && finding.status === "missing" && (
        <div className="finding-evidence">
          <span className="label">Evidence</span>
          <span style={{ fontStyle: "italic" }}>
            No matching language found in the document.
          </span>
        </div>
      )}
      {finding.remediation && !passing && (
        <div className="finding-rem">
          <span className="label">Remediation</span>
          {finding.remediation}
        </div>
      )}
      {finding.citation && (
        <div className="finding-cite">{finding.citation}</div>
      )}
    </div>
  );
}
