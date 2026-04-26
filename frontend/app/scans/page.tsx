import Link from "next/link";
import { listScans, type ScanListItem } from "@/lib/api";

export const dynamic = "force-dynamic";

const labelColor: Record<string, string> = {
  low: "bg-risk-low/10 text-risk-low border-risk-low/30",
  moderate: "bg-risk-moderate/10 text-risk-moderate border-risk-moderate/30",
  high: "bg-risk-high/10 text-risk-high border-risk-high/30",
  critical: "bg-risk-critical/10 text-risk-critical border-risk-critical/30",
};

export default async function ScansPage() {
  let scans: ScanListItem[] = [];
  try {
    scans = await listScans();
  } catch {
    scans = [];
  }
  return (
    <div className="space-y-6">
      <div className="flex items-baseline justify-between">
        <h1 className="text-2xl font-semibold tracking-tight text-ink-900">Scan history</h1>
        <Link href="/" className="text-sm text-ink-600 hover:text-ink-900">
          + New scan
        </Link>
      </div>

      {scans.length === 0 ? (
        <div className="rounded-xl border border-dashed border-ink-200 bg-white p-12 text-center text-sm text-ink-400">
          No scans yet. <Link className="text-ink-900 underline" href="/">Run your first scan.</Link>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-ink-200 bg-white shadow-sm">
          <table className="min-w-full divide-y divide-ink-100 text-sm">
            <thead className="bg-ink-50 text-left text-[10px] uppercase tracking-wider text-ink-400">
              <tr>
                <th className="px-4 py-3">When</th>
                <th className="px-4 py-3">Document</th>
                <th className="px-4 py-3">Frameworks</th>
                <th className="px-4 py-3">Risk</th>
                <th className="px-4 py-3 text-right">Findings</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-100">
              {scans.map((s) => (
                <tr key={s.id} className="hover:bg-ink-50">
                  <td className="px-4 py-3 text-xs text-ink-600">
                    <Link href={`/scan/${s.id}`} className="block">
                      {new Date(s.created_at).toLocaleString()}
                    </Link>
                  </td>
                  <td className="px-4 py-3 font-medium text-ink-900">
                    <Link href={`/scan/${s.id}`}>{s.filename}</Link>
                  </td>
                  <td className="px-4 py-3 text-xs text-ink-600">{s.frameworks.join(", ")}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center gap-2 rounded-full border px-2 py-0.5 text-[11px] font-medium capitalize ${
                        labelColor[s.risk_label] ?? "bg-ink-100 text-ink-600 border-ink-200"
                      }`}
                    >
                      {s.risk_label} · {s.risk_score.toFixed(0)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right text-ink-600">{s.finding_count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
