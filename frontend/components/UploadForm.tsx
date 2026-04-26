"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { listRegulations, uploadScan, type Regulation } from "@/lib/api";

const DEFAULT_FRAMEWORKS = ["HIPAA", "GDPR", "PCI_DSS", "SOC2"];

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
    listRegulations().then(setRegs).catch(() => {});
  }, []);

  const toggle = (fw: string) =>
    setSelected((cur) => (cur.includes(fw) ? cur.filter((x) => x !== fw) : [...cur, fw]));

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

  return (
    <form onSubmit={submit} className="space-y-6">
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
        className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed bg-white px-6 py-12 text-center transition ${
          drag ? "border-ink-900 bg-ink-50" : "border-ink-200 hover:border-ink-400"
        }`}
      >
        <input
          type="file"
          accept=".pdf,.docx,.txt,.md"
          className="hidden"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
        />
        {file ? (
          <>
            <div className="text-sm font-medium text-ink-900">{file.name}</div>
            <div className="mt-1 text-xs text-ink-400">{(file.size / 1024).toFixed(1)} KB · click to change</div>
          </>
        ) : (
          <>
            <div className="text-base font-medium text-ink-900">Drop a policy document</div>
            <div className="mt-1 text-xs text-ink-400">or click to browse · PDF, DOCX, TXT · max 5 MB</div>
          </>
        )}
      </label>

      <div>
        <label className="mb-2 block text-sm font-medium text-ink-900">
          Policy name <span className="font-normal text-ink-400">(optional — groups versions for diffing)</span>
        </label>
        <input
          type="text"
          value={policyName}
          onChange={(e) => setPolicyName(e.target.value)}
          placeholder="e.g. Acme Corp Privacy Policy"
          className="w-full rounded-md border border-ink-200 bg-white px-3 py-2 text-sm text-ink-900 placeholder:text-ink-400 focus:border-ink-900 focus:outline-none"
        />
      </div>

      <div>
        <div className="mb-2 text-sm font-medium text-ink-900">Frameworks</div>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {(regs.length ? regs : DEFAULT_FRAMEWORKS.map((f) => ({ framework: f, display_name: f, description: "", rule_count: 0 }))).map(
            (r) => {
              const on = selected.includes(r.framework);
              return (
                <button
                  key={r.framework}
                  type="button"
                  onClick={() => toggle(r.framework)}
                  className={`flex items-start gap-3 rounded-lg border p-3 text-left text-sm transition ${
                    on ? "border-ink-900 bg-ink-900 text-white" : "border-ink-200 bg-white hover:border-ink-400"
                  }`}
                >
                  <span
                    className={`mt-0.5 inline-flex h-4 w-4 shrink-0 items-center justify-center rounded border ${
                      on ? "border-white bg-white" : "border-ink-200"
                    }`}
                  >
                    {on && <span className="h-2 w-2 rounded-sm bg-ink-900" />}
                  </span>
                  <span>
                    <span className="font-medium">{r.display_name}</span>
                    {r.description && (
                      <span className={`mt-0.5 block text-xs ${on ? "text-white/70" : "text-ink-400"}`}>
                        {r.description}
                      </span>
                    )}
                  </span>
                </button>
              );
            },
          )}
        </div>
      </div>

      {err && <div className="rounded-md border border-risk-critical/30 bg-risk-critical/5 p-3 text-sm text-risk-critical">{err}</div>}

      <button
        type="submit"
        disabled={busy}
        className="inline-flex items-center justify-center rounded-md bg-ink-900 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-ink-800 disabled:opacity-50"
      >
        {busy ? "Analyzing…" : "Run compliance scan"}
      </button>
    </form>
  );
}
