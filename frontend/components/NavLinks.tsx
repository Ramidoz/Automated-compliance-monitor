"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/", label: "Dashboard" },
  { href: "/upload", label: "Upload" },
  { href: "/scans", label: "History" },
];

export function NavLinks() {
  const pathname = usePathname();

  // The active route logic mirrors the design's app-header behavior:
  // /scan/[id] and /compare/* are part of the History flow.
  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    if (href === "/scans") {
      return (
        pathname === "/scans" ||
        pathname.startsWith("/scan/") ||
        pathname.startsWith("/compare/")
      );
    }
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  return (
    <nav className="nav-links">
      {LINKS.map((l) => (
        <Link
          key={l.href}
          href={l.href}
          className={isActive(l.href) ? "active" : ""}
        >
          {l.label}
        </Link>
      ))}
    </nav>
  );
}
