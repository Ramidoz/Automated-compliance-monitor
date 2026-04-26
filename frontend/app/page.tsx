/**
 * Home page = autonomous-agent control room.
 *
 * Composition mirrors the Claude Design handoff (dashboard.jsx):
 *   - Cartoon hero on top (mascot, greeting, hero stats)
 *   - 3-column grid below
 *       LEFT:   What I'm doing right now → Lined up next
 *       CENTER: Things I need your call on → Stuff I already handled
 *       RIGHT:  Your policies → What I'm watching
 *
 * Each column section is wrapped in a SectionHead so a first-time
 * visitor can read what the section is at a glance.
 *
 * The dashboard uses MOCK data (frontend/lib/dashboard-mock.ts) — there
 * is no long-running agent service in this repo. The existing per-scan
 * agent loop on /scan/[id] is the real thing.
 */

import { CartoonHero } from "@/components/dashboard/CartoonHero";
import { LiveJobCard } from "@/components/dashboard/LiveJobCard";
import { PortfolioGrid } from "@/components/dashboard/PortfolioGrid";
import { QueueCard } from "@/components/dashboard/QueueCard";
import { ResolvedFeed } from "@/components/dashboard/ResolvedFeed";
import { SectionHead } from "@/components/dashboard/SectionHead";
import { TriageInbox } from "@/components/dashboard/TriageInbox";
import { WatchersList } from "@/components/dashboard/WatchersList";
import { SectionIcon } from "@/components/icons";
import { AGENT } from "@/lib/dashboard-mock";

export default function HomePage() {
  const A = AGENT;
  const inboxOpen = A.inbox.filter((f) => !f.act).length;

  return (
    <div className="agent-shell">
      <CartoonHero agent={A.agent} today={A.today} liveJob={A.live_job} />

      <div className="agent-grid">
        {/* LEFT */}
        <section className="agent-col-left">
          <div className="sec-block">
            <SectionHead
              tone="lavender"
              icon={<SectionIcon kind="live" />}
              title="What I'm doing right now"
              badge="LIVE"
              sub="The job in progress this very second — you can watch me think."
            />
            <LiveJobCard job={A.live_job} />
          </div>
          <div className="sec-block">
            <SectionHead
              tone="butter"
              icon={<SectionIcon kind="queue" />}
              title="Lined up next"
              sub={`${A.queue.length} more jobs in my to-do list. I'll get to them automatically.`}
            />
            <QueueCard queue={A.queue} />
          </div>
        </section>

        {/* CENTER */}
        <section className="agent-col-center">
          <div className="sec-block">
            <SectionHead
              tone="peach"
              icon={<SectionIcon kind="triage" />}
              title="Things I need your call on"
              badge={`${inboxOpen} open`}
              sub="I found these but won't act until you say yes. Tap a button to decide."
            />
            <TriageInbox inbox={A.inbox} />
          </div>
          <div className="sec-block">
            <SectionHead
              tone="sage"
              icon={<SectionIcon kind="resolved" />}
              title="Stuff I already handled"
              sub="Closed automatically — within the rules you set."
            />
            <ResolvedFeed resolved={A.resolved} />
          </div>
        </section>

        {/* RIGHT */}
        <section className="agent-col-right">
          <div className="sec-block">
            <SectionHead
              tone="lavender"
              icon={<SectionIcon kind="portfolio" />}
              title="Your policies"
              badge={`${A.policies.length}`}
              sub="Everything I'm keeping an eye on for you."
            />
            <PortfolioGrid policies={A.policies} />
          </div>
          <div className="sec-block">
            <SectionHead
              tone="sky"
              icon={<SectionIcon kind="watchers" />}
              title="What I'm watching"
              sub="Sources I check on a schedule — regulators, your docs, calendars."
            />
            <WatchersList watchers={A.watchers} />
          </div>
        </section>
      </div>
    </div>
  );
}
