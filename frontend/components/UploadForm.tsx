"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { listRegulations, uploadScan, type Regulation } from "@/lib/api";

const DEFAULT_FRAMEWORKS = ["HIPAA", "GDPR", "PCI_DSS", "SOC2"];

const FW_DESCRIPTIONS: Record<string, string> = {
  HIPAA: "Privacy + Security rules for PHI",
  GDPR: "EU data subject rights + breach notice",
  PCI_DSS: "Cardholder data handling",
  SOC2: "Trust Services Criteria",
};

export function UploadForm() {
  const router = useRouter();
  const [regs, setRegs] = useState<Regulation[]>([]);
  const [selected, setSelected] = useState<string[]>(DEFAULT_FRAMEWORKS);
  const [file, setFile] = useState<File | null>(null);
  const [policyName, setPolicyName] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [drag, setDrag] = useState(false);

  useEffect(() => {
    listRegulations()
      .then(setRegs)
      .catch(() => {
        /* silent — fall back to defaults */
      });
  }, []);

  const toggle = (fw: string) =>
    setSelected((cur) =>
      cur.includes(fw) ? cur.filter((x) => x !== fw) : [...cur, fw],
    );

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) {
      setErr("Pick a policy document first (PDF, DOCX, or TXT).");
      return;
    }
    if (selected.length === 0) {
      setErr("Select at least one framework.");
      return;
    }
    setBusy(true);
    setErr(null);
    try {
      const result = await uploadScan(file, selected, policyName);
      router.push(`/scan/${result.id}`);
    } catch (e: any) {
      setErr(e?.message ?? "Scan failed.");
    } finally {
      setBusy(false);
    }
  }

  const frameworks =
    regs.length > 0
      ? regs
      : DEFAULT_FRAMEWORKS.map((f) => ({
          framework: f,
          display_name: f,
          description: FW_DESCRIPTIONS[f] ?? "",
          rule_count: 0,
        }));

  return (
    <form onSubmit={submit} className="upload-side">
      <label
        onDragOver={(e) => {
          e.preventDefault();
          setDrag(true);
        }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDrag(false);
          const f = e.dataTransfer.files?.[0];
          if (f) setFile(f);
        }}
        className={`dropzone ${drag ? "drag" : ""}`}
      >
        <input
          type="file"
          accept=".pdf,.docx,.txt,.md"
          className="sr-only"
          style={{ position: "absolute", width: 1, height: 1, opacity: 0, pointerEvents: "none" }}
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
        />
        <span className="dropzone-icon" aria-hidden>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 3v5h5M14 3H6a2 2 0 00-2 2v14a2 2 0 002 2h12a2 2 0 002-2V8l-6-5zM12 18v-6m-3 3l3-3 3 3" />
          </svg>
        </span>
        {file ? (
          <>
            <div className="ttl">{file.name}</div>
            <div className="sub">{(file.size / 1024).toFixed(1)} KB · click to change</div>
          </>
        ) : (
          <>
            <div className="ttl">Drop a policy document</div>
            <div className="sub">PDF, DOCX, or TXT · max 5 MB</div>
          </>
        )}
      </label>

      <div className="flex flex-col gap-2">
        <span className="eyebrow">Frameworks</span>
        <div className="fw-grid">
          {frameworks.map((f) => {
            const on = selected.includes(f.framework);
            return (
              <button
                key={f.framework}
                type="button"
                onClick={() => toggle(f.framework)}
                className={`fw-toggle ${on ? "on" : ""}`}
              >
                <span className="fw-checkbox" aria-hidden />
                <span>
                  <span className="fw-name">{f.display_name}</span>
                  {f.description && <span className="fw-desc">{f.description}</span>}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <span className="eyebrow">
          Policy name{" "}
          <span style={{ textTransform: "none", letterSpacing: 0, color: "var(--c-ink-soft)", fontWeight: 400 }}>
            (optional — groups re-scans for diffing)
          </span>
        </span>
        <input
          className="input"
          placeholder="e.g. Westside Clinic — NPP"
          value={policyName}
          onChange={(e) => setPolicyName(e.target.value)}
        />
      </div>

      {err && (
        <div
          style={{
            background: "var(--tint-rose)",
            border: "1.5px solid var(--tint-rose-deep)",
            color: "#8a3a3a",
            borderRadius: 12,
            padding: "10px 14px",
            fontFamily: "var(--font-fredoka), system-ui, sans-serif",
            fontSize: 13,
          }}
        >
          {err}
        </div>
      )}

      <div className="flex items-center justify-between">
        <span style={{ fontFamily: "var(--font-fredoka), system-ui, sans-serif", fontSize: 12, color: "var(--c-ink-soft)" }}>
          Typical scan: <span style={{ fontFamily: "ui-monospace, monospace", color: "var(--c-ink)" }}>5–15 s</span>
        </span>
        <button type="submit" className="btn" disabled={busy}>
          {busy ? "Analyzing…" : "Run scan →"}
        </button>
      </div>
    </form>
  );
}
