import type { Metadata } from "next";
import { Caveat, Fredoka } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const fredoka = Fredoka({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-fredoka",
  display: "swap",
});

const caveat = Caveat({
  subsets: ["latin"],
  weight: ["500", "700"],
  variable: "--font-caveat",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Compliance Monitor",
  description:
    "Autonomous compliance agent for HIPAA, GDPR, PCI-DSS, and SOC 2.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${fredoka.variable} ${caveat.variable}`}>
      <body className="min-h-screen font-sans text-ink antialiased">
        <header className="border-b border-ink-lavender-deep/30 bg-white/70 backdrop-blur">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
            <Link
              href="/"
              className="inline-flex items-center gap-2 font-display text-lg font-semibold text-ink"
            >
              <span
                className="inline-block h-2.5 w-2.5 rounded-full bg-risk-low"
                aria-hidden
              />
              Compliance Monitor
            </Link>
            <nav className="flex items-center gap-6 font-display text-sm text-ink-soft">
              <Link href="/" className="hover:text-ink">
                Dashboard
              </Link>
              <Link href="/upload" className="hover:text-ink">
                Upload
              </Link>
              <Link href="/scans" className="hover:text-ink">
                History
              </Link>
            </nav>
          </div>
        </header>
        <main className="mx-auto max-w-7xl px-6 py-8">{children}</main>
        <footer className="mt-12 border-t border-ink-lavender-deep/30 bg-white/60">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 font-display text-xs text-ink-soft">
            <span>For demonstration only — not legal advice.</span>
            <span>Powered by Claude Sonnet 4.6 · 40+ deterministic checks</span>
          </div>
        </footer>
      </body>
    </html>
  );
}
