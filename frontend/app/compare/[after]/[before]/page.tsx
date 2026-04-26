import Link from "next/link";
import { notFound } from "next/navigation";
import { SeverityPill } from "@/components/SeverityPill";
import { compareScans, type DiffChange, type DiffEntry } from "@/lib/api";

export const dynamic = "force-dynamic";

const CHANGE_META: Record<DiffChange, { label: string; color: string; tone: "good" | "bad" | "neutral" }> = {
  closed: { label: "Closed", color: "text-risk-low border-risk-low/30 bg-risk-low/10", tone: "good" },
  improved: { label: "Improved", color: "text-risk-low border-risk-low/30 bg-risk-low/10", tone: "good" },
  opened: { label: "Opened", color: "text-risk-critical border-risk-critical/30 bg-risk-critical/10", tone: "bad" },
  regressed: { label: "Regressed", color: "text-risk-high border-risk-high/30 bg-risk-high/10", tone: "bad" },
  still_failing: { label: "Still failing", color: "text-risk-moderate border-risk-moderate/30 bg-risk-moderate/10", tone: "neutral" },
  still_passing: { label: "Still passing", color: "text-ink-400 border-ink-200 bg-ink-50", tone: "neutral" },
};

const SECTION_ORDER: DiffChange[] = ["opened", "regressed", "closed", "improved", "still_failing"];

function ChangeBadge({ change }: { change: DiffChange }) {
  const m = CHANGE_META[change];
  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider ${m.color}`}>
      {m.label}
    </span>
  );
}

function EntryRow({ entry }: { entry: DiffEntry }) {
  const before = entry.before;
  const after = entry.after;
  return (
    <div className="rounded-lg border border-ink-200 bg-white p-4">
      <div className="flex items-center gap-2">
        <ChangeBadge change={entry.change} />
        <span className="text-[10px] font-medium uppercase tracking-wider text-ink-400">
          {entry.framework} · {entry.rule_id}
        </span>
      </div>
      <h3 className="mt-1.5 text-sm font-semibold text-ink-900">{entry.title}</h3>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <div className="rounded border border-ink-100 bg-ink-50 p-3">
          <div className="mb-1 text-[10px] font-medium uppercase tracking-wider text-ink-400">Before</div>
          {before ? (
            <>
              <div className="flex items-center gap-2">
                <SeverityPill severity={before.severity} />
                <span className="text-xs text-ink-600">{before.status}</span>
              </div>
              {before.evidence && <p className="mt-2 line-clamp-3 text-xs text-ink-600">{before.evidence}</p>}
            </>
          ) : (
            <span className="text-xs text-ink-400">— not present in earlier scan —</span>
          )}
        </div>
        <div className="rounded border border-ink-100 bg-white p-3">
          <div className="mb-1 text-[10px] font-medium uppercase tracking-wider text-ink-400">After</div>
          {after ? (
            <>
              <div className="flex items-center gap-2">
                <SeverityPill severity={after.severity} />
                <span className="text-xs text-ink-600">{after.status}</span>
              </div>
              {after.evidence && <p className="mt-2 line-clamp-3 text-xs text-ink-600">{after.evidence}</p>}
            </>
          ) : (
            <span className="text-xs text-ink-400">— not present in later scan —</span>
          )}
        </div>
      </div>
      {after?.remediation && entry.change !== "closed" && entry.change !== "improved" && (
        <p className="mt-3 text-xs text-ink-600">
          <span className="text-ink-400">Remediation: </span>
          {after.remediation}
        </p>
      )}
    </div>
  );
}

export default async function ComparePage({
  params,
}: {
  params: { after: string; before: string };
}) {
  let diff;
  try {
    diff = await compareScans(params.after, params.before);
  } catch {
    notFound();
  }

  const grouped: Record<DiffChange, DiffEntry[]> = {
    opened: [],
    regressed: [],
    closed: [],
    improved: [],
    still_failing: [],
    still_passing: [],
  };
  for (const e of diff.entries) grouped[e.change].push(e);

  const delta = diff.risk_score_delta;
  const deltaColor = delta < 0 ? "text-risk-low" : delta > 0 ? "text-risk-critical" : "text-ink-600";

  return (
    <div className="space-y-8">
      <div>
        <Link href={`/scan/${diff.after.id}`} className="text-xs text-ink-400 hover:text-ink-900">
          ← back to scan
        </Link>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-ink-900">
          {diff.after.policy_name || diff.after.filename}
        </h1>
        <p className="mt-1 text-xs text-ink-400">
          Comparing scan #{diff.before.id} ({new Date(diff.before.created_at).toLocaleDateString()}) → scan #
          {diff.after.id} ({new Date(diff.after.created_at).toLocaleDateString()})
        </p>
      </div>

      <section className="grid gap-4 rounded-2xl border border-ink-200 bg-white p-6 shadow-sm sm:grid-cols-3">
        <div>
          <div className="text-[10px] font-medium uppercase tracking-wider text-ink-400">Risk score</div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-semibold text-ink-900">{diff.before.risk_score.toFixed(0)}</span>
            <span className="text-ink-400">→</span>
            <span className="text-2xl font-semibold text-ink-900">{diff.after.risk_score.toFixed(0)}</span>
            <span className={`text-sm font-medium ${deltaColor}`}>
              ({delta > 0 ? "+" : ""}
              {delta.toFixed(1)})
            </span>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:col-span-2">
          {(["closed", "opened", "regressed", "still_failing"] as DiffChange[]).map((c) => (
            <div key={c} className={`rounded-lg border p-3 ${CHANGE_META[c].color}`}>
              <div className="text-2xl font-semibold">{diff.counts[c]}</div>
              <div className="text-[10px] uppercase tracking-wider opacity-80">{CHANGE_META[c].label}</div>
            </div>
          ))}
        </div>
      </section>

      {SECTION_ORDER.map((change) => {
        const entries = grouped[change];
        if (entries.length === 0) return null;
        return (
          <section key={change} className="space-y-3">
            <div className="flex items-baseline justify-between">
              <h2 className="text-lg font-semibold text-ink-900">{CHANGE_META[change].label}</h2>
              <span className="text-xs text-ink-400">{entries.length} item{entries.length === 1 ? "" : "s"}</span>
            </div>
            <div className="grid gap-3">
              {entries.map((e) => (
                <EntryRow key={`${e.framework}-${e.rule_id}`} entry={e} />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
