import Link from "next/link";
import { notFound } from "next/navigation";
import { FindingCard } from "@/components/FindingCard";
import { RiskGauge } from "@/components/RiskGauge";
import { getScan, type Finding } from "@/lib/api";

export const dynamic = "force-dynamic";

const SEVERITY_ORDER: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };

function groupByFramework(findings: Finding[]): Record<string, Finding[]> {
  const out: Record<string, Finding[]> = {};
  for (const f of findings) (out[f.framework] ??= []).push(f);
  for (const list of Object.values(out)) {
    list.sort((a, b) => {
      const fail = (s: string) => (["missing", "violation", "weak", "contradiction"].includes(s) ? 0 : 1);
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

  return (
    <div className="space-y-8">
      <div>
        <Link href="/scans" className="text-xs text-ink-400 hover:text-ink-900">
          ← all scans
        </Link>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-ink-900">{scan.filename}</h1>
        <p className="mt-1 text-xs text-ink-400">
          Scanned {new Date(scan.created_at).toLocaleString()} · {scan.frameworks.join(", ")}
        </p>
      </div>

      <section className="grid gap-6 rounded-2xl border border-ink-200 bg-white p-6 shadow-sm md:grid-cols-[auto_1fr]">
        <RiskGauge score={scan.risk_score} label={scan.risk_label} />
        <div className="grid grid-cols-2 gap-3 self-center sm:grid-cols-4">
          {(["critical", "high", "medium", "low"] as const).map((sev) => (
            <div key={sev} className="rounded-lg border border-ink-100 bg-ink-50 p-3">
              <div className="text-2xl font-semibold text-ink-900">{counts[sev]}</div>
              <div className="text-[10px] uppercase tracking-wider text-ink-400">{sev}</div>
            </div>
          ))}
        </div>
      </section>

      {scan.summary && (
        <section className="rounded-xl border border-ink-200 bg-white p-5 shadow-sm">
          <div className="mb-1 text-[10px] font-medium uppercase tracking-wider text-ink-400">
            Executive summary
          </div>
          <p className="text-sm text-ink-800">{scan.summary}</p>
        </section>
      )}

      {Object.entries(grouped).map(([framework, findings]) => {
        const fwFailed = findings.filter((f) => ["missing", "violation", "weak", "contradiction"].includes(f.status));
        return (
          <section key={framework} className="space-y-3">
            <div className="flex items-baseline justify-between">
              <h2 className="text-lg font-semibold text-ink-900">{framework}</h2>
              <span className="text-xs text-ink-400">
                {fwFailed.length} of {findings.length} requirements need attention
              </span>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              {findings.map((f) => (
                <FindingCard key={`${f.framework}-${f.rule_id}`} finding={f} />
              ))}
            </div>
          </section>
        );
      })}

      {scan.document_excerpt && (
        <section className="rounded-xl border border-ink-200 bg-white p-5 shadow-sm">
          <details>
            <summary className="cursor-pointer text-[10px] font-medium uppercase tracking-wider text-ink-400">
              Document excerpt (first 4000 chars)
            </summary>
            <pre className="mt-3 max-h-96 overflow-auto whitespace-pre-wrap rounded bg-ink-50 p-3 text-xs text-ink-600">
              {scan.document_excerpt}
            </pre>
          </details>
        </section>
      )}
    </div>
  );
}
