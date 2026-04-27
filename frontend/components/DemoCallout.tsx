"use client";

import { useEffect, useState } from "react";
import { getConfig } from "@/lib/api";

/**
 * Header pulse-pill rendered when the backend reports demo_mode: true.
 * Confirms to visitors that the data they see is seeded — separate from
 * the in-page CTAs.
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
    <span className="demo-tag" title="Backend is running in DEMO_MODE — data is seeded.">
      <span className="pulse" aria-hidden />
      Demo mode
    </span>
  );
}
