"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { listVersions, type ScanListItem } from "@/lib/api";

export function VersionPicker({ scanId }: { scanId: number }) {
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
      <div className="dashed-empty">
        No prior versions of this policy yet. Upload another scan with the same
        policy name to compare.
      </div>
    );
  }

  return (
    <div className="card">
      <span className="eyebrow">Compare with previous version</span>
      <div
        style={{
          marginTop: 10,
          display: "flex",
          gap: 8,
          flexWrap: "wrap",
        }}
      >
        {versions.map((v) => (
          <Link
            key={v.id}
            href={`/compare/${scanId}/${v.id}`}
            className="btn-ghost btn-xs"
            style={{ display: "inline-flex", flexDirection: "column", alignItems: "flex-start", padding: "8px 12px" }}
          >
            <span style={{ fontWeight: 600 }}>
              {v.policy_name || v.filename}
            </span>
            <span
              style={{
                fontSize: 10,
                color: "var(--c-ink-soft)",
                fontFamily: "ui-monospace, monospace",
                fontWeight: 400,
              }}
            >
              {new Date(v.created_at).toLocaleDateString()} · risk{" "}
              {Math.round(v.risk_score)}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
