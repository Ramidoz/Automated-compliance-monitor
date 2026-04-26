"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getConfig } from "@/lib/api";

/**
 * Renders a "View live demo" CTA on the home page when the backend reports
 * demo_mode: true. Mounts as a client component so it can hit /api/config at
 * runtime without forcing the home page out of the static cache.
 */
export function DemoCallout() {
  const [demoMode, setDemoMode] = useState<boolean | null>(null);

  useEffect(() => {
    let cancelled = false;
    getConfig()
      .then((cfg) => {
        if (!cancelled) setDemoMode(cfg.demo_mode);
      })
      .catch(() => {
        if (!cancelled) setDemoMode(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (!demoMode) return null;

  return (
    <Link
      href="/scans"
      className="inline-flex items-center gap-2 rounded-md border border-ink-900 bg-ink-900 px-4 py-2 text-sm font-medium text-white transition-colors duration-base hover:bg-ink-800"
    >
      View live demo
      <span aria-hidden className="text-white/80">→</span>
    </Link>
  );
}
