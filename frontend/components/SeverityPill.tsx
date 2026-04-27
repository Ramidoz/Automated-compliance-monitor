export function SeverityPill({ severity }: { severity: string }) {
  const cls = `pill pill-${severity}`;
  return <span className={cls}>{severity}</span>;
}
