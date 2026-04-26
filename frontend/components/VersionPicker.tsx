"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { listVersions, type ScanListItem } from "@/lib/api";

export function VersionPicker({ scanId }: { scanId: number }) {
  const router = useRouter();
  const [versions, setVersions] = useState<ScanListItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listVersions(scanId)
      .then(setVersions)
      .catch(() => setVersions([]))
      .finally(() => setLoading(false));
  }, [scanId]);

  if (loading) return null;
  if (versions.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-ink-200 bg-white p-3 text-xs text-ink-400">
        No prior versions of this policy yet. Upload another scan with the same policy name to compare.
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-ink-200 bg-white p-4">
      <div className="mb-2 text-[10px] font-medium uppercase tracking-wider text-ink-400">
        Compare with previous version
      </div>
      <div className="flex flex-wrap gap-2">
        {versions.map((v) => (
          <button
            key={v.id}
            type="button"
            onClick={() => router.push(`/compare/${scanId}/${v.id}`)}
            className="rounded-md border border-ink-200 bg-white px-3 py-1.5 text-xs text-ink-800 transition hover:border-ink-900 hover:bg-ink-50"
          >
            <span className="font-medium">{v.filename}</span>
            <span className="ml-2 text-ink-400">
              {new Date(v.created_at).toLocaleDateString()} · risk {v.risk_score.toFixed(0)}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
