import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "Compliance Monitor",
  description: "Automated compliance gap analysis for HIPAA, GDPR, PCI-DSS, and SOC 2.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen font-sans antialiased">
        <header className="border-b border-ink-200 bg-white">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
            <Link href="/" className="flex items-center gap-2 text-lg font-semibold tracking-tight">
              <span className="inline-block h-2.5 w-2.5 rounded-full bg-risk-low" />
              Compliance Monitor
            </Link>
            <nav className="flex items-center gap-6 text-sm text-ink-600">
              <Link href="/" className="hover:text-ink-900">New scan</Link>
              <Link href="/scans" className="hover:text-ink-900">History</Link>
            </nav>
          </div>
        </header>
        <main className="mx-auto max-w-6xl px-6 py-10">{children}</main>
        <footer className="mt-16 border-t border-ink-200 bg-white">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4 text-xs text-ink-400">
            <span>For demonstration only — not legal advice.</span>
            <span>Powered by Claude Sonnet 4.6</span>
          </div>
        </footer>
      </body>
    </html>
  );
}
