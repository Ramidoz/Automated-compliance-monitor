/**
 * /upload — manual scan path. The dashboard at / runs continuously;
 * this page is for one-off uploads. Restyled to match the cartoon design.
 */

import Link from "next/link";
import { UploadForm } from "@/components/UploadForm";

export default function UploadPage() {
  return (
    <div className="upload-grid">
      {/* LEFT — story */}
      <section>
        <span className="eyebrow">Manual scan</span>
        <div className="upload-hero">
          <h1>
            Got a fresh policy? <em>Drop it here.</em>
          </h1>
          <p>
            Upload a privacy policy, BAA, or security write-up. We score it
            against HIPAA, GDPR, PCI-DSS, and SOC 2, surface vague language,
            and suggest specific fixes with the regulatory citation attached.
          </p>
        </div>

        <div style={{ marginTop: 24 }}>
          <span className="eyebrow">Pipeline</span>
          <div className="pipeline">
            <div className="pipeline-cell parse">
              <span className="dot" />
              <div className="num">01</div>
              <div className="ttl">Parse</div>
              <div className="desc">PDF, DOCX, or TXT — sectioned and indexed.</div>
            </div>
            <div className="pipeline-cell rules">
              <span className="dot" />
              <div className="num">02</div>
              <div className="ttl">Rules</div>
              <div className="desc">40+ deterministic checks per framework.</div>
            </div>
            <div className="pipeline-cell agent">
              <span className="dot" />
              <div className="num">03</div>
              <div className="ttl">AI agent</div>
              <div className="desc">Claude Sonnet 4.6 reasons over the doc.</div>
            </div>
            <div className="pipeline-cell score">
              <span className="dot" />
              <div className="num">04</div>
              <div className="ttl">Score</div>
              <div className="desc">Severity-weighted 0–100 with remediations.</div>
            </div>
          </div>
        </div>

        <div className="bullet-list">
          <div className="bullet">
            <span className="bdot" style={{ background: "var(--accent-ai-300)" }} />
            <span>
              <strong>The agent shows its work.</strong> Every tool call —
              <code> search_document</code>, <code>search_regulation_index</code>,
              <code> report_finding</code> — appears in the transcript so reviewers
              can audit the reasoning.
            </span>
          </div>
          <div className="bullet">
            <span className="bdot" style={{ background: "var(--accent-cache-500)" }} />
            <span>
              <strong>Re-scan to track progress.</strong> Same policy, month over
              month — closed, opened, regressed findings side-by-side.
            </span>
          </div>
          <div className="bullet">
            <span className="bdot" style={{ background: "var(--c-ink-soft)" }} />
            <span>
              <strong>~90% input-token discount</strong> on cache hits. Most
              re-runs cost cents, not dollars.
            </span>
          </div>
        </div>

        <div style={{ marginTop: 24 }}>
          <Link href="/scans" className="btn-ghost">
            View scan history →
          </Link>
        </div>
      </section>

      {/* RIGHT — upload card */}
      <div className="card card-pad-lg">
        <UploadForm />
      </div>
    </div>
  );
}
