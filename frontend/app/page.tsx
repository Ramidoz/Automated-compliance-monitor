import { UploadForm } from "@/components/UploadForm";

export default function HomePage() {
  return (
    <div className="grid gap-12 md:grid-cols-[1fr_minmax(0,420px)]">
      <section>
        <h1 className="text-3xl font-semibold tracking-tight text-ink-900">
          Catch compliance gaps before regulators do.
        </h1>
        <p className="mt-3 max-w-prose text-base text-ink-600">
          Upload a privacy policy, BAA, or security write-up. We score it against HIPAA, GDPR,
          PCI-DSS, and SOC 2, flag missing clauses, and suggest specific fixes.
        </p>

        <ul className="mt-8 space-y-4 text-sm text-ink-600">
          <li className="flex gap-3">
            <span className="mt-1 inline-block h-2 w-2 shrink-0 rounded-full bg-risk-low" />
            <span>
              <strong className="text-ink-900">Deterministic checks</strong> — 40+ keyword and
              structural rules per framework, with cited regulatory text.
            </span>
          </li>
          <li className="flex gap-3">
            <span className="mt-1 inline-block h-2 w-2 shrink-0 rounded-full bg-risk-moderate" />
            <span>
              <strong className="text-ink-900">Semantic gap analysis</strong> — Claude Sonnet 4.6
              flags weak, vague, or contradictory clauses that keywords miss.
            </span>
          </li>
          <li className="flex gap-3">
            <span className="mt-1 inline-block h-2 w-2 shrink-0 rounded-full bg-risk-high" />
            <span>
              <strong className="text-ink-900">PII leak detection</strong> — emails, SSNs, PANs,
              and IBANs that shouldn't appear in a policy doc are surfaced as critical violations.
            </span>
          </li>
          <li className="flex gap-3">
            <span className="mt-1 inline-block h-2 w-2 shrink-0 rounded-full bg-risk-critical" />
            <span>
              <strong className="text-ink-900">Risk-weighted score</strong> — severity-weighted
              0-100 with a one-line label your CFO can act on.
            </span>
          </li>
        </ul>
      </section>

      <section className="rounded-2xl border border-ink-200 bg-white p-6 shadow-sm">
        <UploadForm />
      </section>
    </div>
  );
}
