"use client";

const labelColors: Record<string, string> = {
  low: "text-risk-low",
  moderate: "text-risk-moderate",
  high: "text-risk-high",
  critical: "text-risk-critical",
  unknown: "text-ink-400",
};

export function RiskGauge({ score, label }: { score: number; label: string }) {
  const clamped = Math.max(0, Math.min(100, score));
  const angle = (clamped / 100) * 360;
  return (
    <div className="flex items-center gap-6">
      <div
        className="relative h-32 w-32 rounded-full"
        style={{
          background: `conic-gradient(${
            label === "low" ? "#16a34a" : label === "moderate" ? "#ca8a04" : label === "high" ? "#ea580c" : "#dc2626"
          } ${angle}deg, #eeeef0 ${angle}deg)`,
        }}
      >
        <div className="absolute inset-2 flex flex-col items-center justify-center rounded-full bg-white">
          <div className="text-3xl font-bold tracking-tight">{clamped.toFixed(0)}</div>
          <div className="text-xs uppercase tracking-wider text-ink-400">risk</div>
        </div>
      </div>
      <div>
        <div className={`text-2xl font-semibold capitalize ${labelColors[label] ?? "text-ink-900"}`}>{label}</div>
        <div className="mt-1 text-sm text-ink-600">
          {label === "low" && "Strong posture. Minor refinements only."}
          {label === "moderate" && "Several gaps. Address within the next quarter."}
          {label === "high" && "Significant exposure. Prioritize fixes now."}
          {label === "critical" && "Severe gaps. Immediate remediation required."}
          {label === "unknown" && "Not enough signal to score."}
        </div>
      </div>
    </div>
  );
}
