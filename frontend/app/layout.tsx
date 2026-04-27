import type { Metadata } from "next";
import { Caveat, Fredoka } from "next/font/google";
import Link from "next/link";
import { DemoCallout } from "@/components/DemoCallout";
import { NavLinks } from "@/components/NavLinks";
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
  title: "Compliance Monitor — autonomous compliance agent",
  description:
    "Autonomous compliance agent for HIPAA, GDPR, PCI-DSS, and SOC 2.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${fredoka.variable} ${caveat.variable}`}>
      <body>
        <header className="app-header">
          <div className="app-header-inner">
            <Link href="/" className="brand">
              <span className="brand-mark" aria-hidden />
              Compliance Monitor
            </Link>
            <NavLinks />
            <div className="nav-right">
              <DemoCallout />
              <span className="app-version">v0.5.0</span>
            </div>
          </div>
        </header>
        <main className="app-main">{children}</main>
        <footer className="app-footer">
          <div className="app-footer-inner">
            <span>For demonstration only — not legal advice.</span>
            <span>
              Powered by Claude Sonnet 4.6 · 40+ deterministic checks ·
              severity-weighted scoring
            </span>
          </div>
        </footer>
      </body>
    </html>
  );
}
