/**
 * /scans — history table grouped by policy.
 *
 * Composition mirrors the design (scans.jsx):
 *   - hero row: count + policy count + "New scan" button
 *   - portfolio metric strip
 *   - per-policy trend cards (sparkline + delta-since-v1)
 *   - main table with mini-gauge + risk pill + frameworks + finding count
 *   - intentional empty state when zero scans
 */

import Link from "next/link";
import { listScans, type ScanListItem } from "@/lib/api";

export const dynamic = "force-dynamic";

const FW_NAMES: Record<string, string> = {
  HIPAA: "HIPAA",
  GDPR: "GDPR",
  PCI_DSS: "PCI-DSS",
  SOC2: "SOC 2",
};

const RISK_COLOR: Record<string, string> = {
  low: "var(--risk-low)",
  moderate: "var(--risk-moderate)",
  high: "var(--risk-high)",
  critical: "var(--risk-critical)",
  unknown: "var(--surface-400)",
};

function MiniGauge({ score, label }: { score: number; label: string }) {
  const color = RISK_COLOR[label] ?? RISK_COLOR.unknown;
  return (
    <div
      className="gauge-mini"
      style={
        {
          ["--mini-c" as any]: color,
          ["--mini-p" as any]: Math.round(score),
          position: "relative",
        } as React.CSSProperties
      }
    >
      <span className="num">{Math.round(score)}</span>
    </div>
  );
}

export default async function ScansPage() {
  let scans: ScanListItem[] = [];
  try {
    scans = await listScans();
  } catch {
    scans = [];
  }

  const policies: Record<string, ScanListItem[]> = {};
  scans.forEach((s) => {
    const key = s.policy_name || s.filename;
    (policies[key] ??= []).push(s);
  });
  Object.values(policies).forEach((arr) =>
    arr.sort(
      (a, b) =>
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
    ),
  );
  const policyCount = Object.keys(policies).length;
  const totalFindings = scans.reduce((n, s) => n + s.finding_count, 0);
  const avgScore = scans.length
    ? Math.round(scans.reduce((n, s) => n + s.risk_score, 0) / scans.length)
    : 0;
  const lastScan = scans[0];

  return (
    <div className="section-gap">
      <div className="page-action-row">
        <div>
          <span className="eyebrow">Scan history</span>
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
            {scans.length} {scans.length === 1 ? "scan" : "scans"} ·{" "}
            {policyCount} {policyCount === 1 ? "policy" : "policies"}
          </h1>
          <p
            style={{
              marginTop: 4,
              fontFamily: "var(--font-fredoka), system-ui, sans-serif",
              fontSize: 13.5,
              color: "var(--c-ink-soft)",
            }}
          >
            Re-runs are grouped by policy. Click any row to open the report.
          </p>
        </div>
        <Link href="/upload" className="btn">
          + New scan
        </Link>
      </div>

      {scans.length > 0 && (
        <>
          <div className="metric-strip">
            <div className="metric-cell">
              <div className="lab">Total scans</div>
              <div className="val">{scans.length}</div>
              <div className="sub">across {policyCount} policies</div>
            </div>
            <div className="metric-cell">
              <div className="lab">Average risk</div>
              <div className="val">{avgScore}</div>
              <div className="sub">/ 100 risk score</div>
            </div>
            <div className="metric-cell">
              <div className="lab">Findings</div>
              <div className="val">{totalFindings}</div>
              <div className="sub">across all scans</div>
            </div>
            <div className="metric-cell cache">
              <div className="lab">Last scan</div>
              <div className="val">
                {lastScan
                  ? new Date(lastScan.created_at).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })
                  : "—"}
              </div>
              <div className="sub">{lastScan?.policy_name || lastScan?.filename}</div>
            </div>
            <div className="metric-cell tokens">
              <div className="lab">Best trend</div>
              <div className="val">
                {(() => {
                  let best = 0;
                  for (const arr of Object.values(policies)) {
                    if (arr.length < 2) continue;
                    const d = arr[arr.length - 1].risk_score - arr[0].risk_score;
                    if (d < best) best = d;
                  }
                  return `${best > 0 ? "+" : ""}${Math.round(best)}`;
                })()}
              </div>
              <div className="sub">vs. first scan</div>
            </div>
          </div>

          {policyCount > 0 && (
            <div>
              <span className="eyebrow">Policies tracked</span>
              <div
                style={{
                  marginTop: 10,
                  display: "grid",
                  gridTemplateColumns: `repeat(${Math.min(policyCount, 3)}, 1fr)`,
                  gap: 12,
                }}
              >
                {Object.entries(policies).map(([name, arr]) => {
                  const latest = arr[arr.length - 1];
                  const first = arr[0];
                  const delta =
                    arr.length > 1 ? latest.risk_score - first.risk_score : 0;
                  const max = Math.max(...arr.map((s) => s.risk_score), 100);
                  return (
                    <Link
                      key={name}
                      href={`/scan/${latest.id}`}
                      className="card"
                      style={{ display: "block", padding: 16 }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "flex-start",
                          gap: 12,
                        }}
                      >
                        <div style={{ minWidth: 0 }}>
                          <div
                            style={{
                              fontFamily: "var(--font-fredoka), system-ui, sans-serif",
                              fontWeight: 600,
                              color: "var(--c-ink)",
                              fontSize: 14,
                              whiteSpace: "nowrap",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                            }}
                          >
                            {name}
                          </div>
                          <div
                            style={{
                              fontFamily: "var(--font-fredoka), system-ui, sans-serif",
                              fontSize: 12,
                              color: "var(--c-ink-soft)",
                              marginTop: 2,
                            }}
                          >
                            {arr.length} scan{arr.length === 1 ? "" : "s"} ·{" "}
                            {latest.frameworks.join(" · ")}
                          </div>
                        </div>
                        <div className="sparkline" style={{ flexShrink: 0 }}>
                          {arr.map((s, i) => (
                            <div
                              key={s.id}
                              className={`bar ${s.risk_label}`}
                              style={{
                                height: `${Math.max(8, (s.risk_score / max) * 32)}px`,
                                opacity: i === arr.length - 1 ? 1 : 0.6,
                              }}
                            />
                          ))}
                        </div>
                      </div>
                      <div
                        style={{
                          marginTop: 12,
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "baseline",
                        }}
                      >
                        <div>
                          <span
                            style={{
                              fontFamily: "var(--font-fredoka), system-ui, sans-serif",
                              fontSize: 22,
                              fontWeight: 700,
                              color: "var(--c-ink)",
                            }}
                          >
                            {Math.round(latest.risk_score)}
                          </span>
                          <span
                            style={{
                              fontSize: 11,
                              color: "var(--c-ink-soft)",
                              marginLeft: 6,
                              fontFamily: "var(--font-fredoka), system-ui, sans-serif",
                            }}
                          >
                            current
                          </span>
                        </div>
                        {arr.length > 1 && (
                          <span
                            style={{
                              fontFamily: "ui-monospace, monospace",
                              fontSize: 12,
                              color:
                                delta < 0
                                  ? "var(--accent-cache-700)"
                                  : "var(--risk-high)",
                            }}
                          >
                            {delta > 0 ? "+" : ""}
                            {Math.round(delta)} since v1
                          </span>
                        )}
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}

      {scans.length === 0 ? (
        <div className="dashed-empty">
          <div style={{ fontSize: 28, marginBottom: 8 }}>+</div>
          <div
            style={{
              fontFamily: "var(--font-fredoka), system-ui, sans-serif",
              fontWeight: 600,
              color: "var(--c-ink)",
              fontSize: 16,
            }}
          >
            No scans yet.
          </div>
          <p style={{ marginTop: 4 }}>Run your first scan.</p>
          <Link href="/upload" className="btn" style={{ marginTop: 18 }}>
            Upload a policy
          </Link>
        </div>
      ) : (
        <div className="table-wrap">
          <table className="scans">
            <thead>
              <tr>
                <th style={{ width: 80 }}>Score</th>
                <th>Document</th>
                <th>Frameworks</th>
                <th>Findings</th>
                <th style={{ textAlign: "right" }}>Scanned</th>
              </tr>
            </thead>
            <tbody>
              {scans.map((s) => (
                <ScanRow key={s.id} scan={s} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function ScanRow({ scan }: { scan: ScanListItem }) {
  return (
    <tr>
      <td>
        <Link
          href={`/scan/${scan.id}`}
          style={{
            display: "flex",
            gap: 10,
            alignItems: "center",
            color: "inherit",
            textDecoration: "none",
          }}
        >
          <MiniGauge score={scan.risk_score} label={scan.risk_label} />
          <span className={`pill pill-${scan.risk_label}`}>{scan.risk_label}</span>
        </Link>
      </td>
      <td className="doc">
        <Link
          href={`/scan/${scan.id}`}
          style={{ color: "inherit", textDecoration: "none" }}
        >
          {scan.policy_name || scan.filename}
          <span className="file">{scan.filename}</span>
        </Link>
      </td>
      <td>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {scan.frameworks.map((f) => (
            <span key={f} className="fw-tag-mini">
              {FW_NAMES[f] ?? f}
            </span>
          ))}
        </div>
      </td>
      <td>
        <span
          style={{
            fontFamily: "ui-monospace, monospace",
            color: "var(--c-ink)",
            fontWeight: 600,
          }}
        >
          {scan.finding_count}
        </span>
      </td>
      <td className="when" style={{ textAlign: "right" }}>
        {new Date(scan.created_at).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        })}
      </td>
    </tr>
  );
}
