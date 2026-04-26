const colors: Record<string, string> = {
  critical: "bg-risk-critical/10 text-risk-critical border-risk-critical/30",
  high: "bg-risk-high/10 text-risk-high border-risk-high/30",
  medium: "bg-risk-moderate/10 text-risk-moderate border-risk-moderate/30",
  low: "bg-risk-low/10 text-risk-low border-risk-low/30",
};

export function SeverityPill({ severity }: { severity: string }) {
  const cls = colors[severity] ?? "bg-ink-100 text-ink-600 border-ink-200";
  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider ${cls}`}>
      {severity}
    </span>
  );
}
