/**
 * Risk gauge — the headline visual on /scan/[id].
 * Conic-gradient ring whose color matches the risk label, with the
 * numeric score inside.
 */

const COLORS: Record<string, string> = {
  low: "var(--risk-low)",
  moderate: "var(--risk-moderate)",
  high: "var(--risk-high)",
  critical: "var(--risk-critical)",
  unknown: "var(--surface-400)",
};

export function RiskGauge({
  score,
  label,
  size = 160,
}: {
  score: number;
  label: string;
  size?: number;
}) {
  const clamped = Math.max(0, Math.min(100, score));
  const color = COLORS[label] ?? COLORS.unknown;
  return (
    <div
      className="gauge"
      style={{
        width: size,
        height: size,
        background: `conic-gradient(${color} ${clamped}%, var(--surface-100) 0)`,
        transition: "background 800ms cubic-bezier(0.3,0,0,1)",
      }}
    >
      <div
        className="gauge-inner"
        style={{ inset: size * 0.07 }}
      >
        <div className="gauge-num" style={{ fontSize: size * 0.27 }}>
          {Math.round(clamped)}
        </div>
        <div className="gauge-label">/ 100 risk</div>
      </div>
    </div>
  );
}
