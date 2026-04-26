/**
 * Cartoon hero — top of the agent dashboard. Mascot on the left, friendly
 * greeting + headline naming the live job in the middle, three pastel
 * "hero stat" cards on the right.
 */

import type { ReactNode } from "react";
import type { AgentMock, LiveJob } from "@/lib/dashboard-mock";
import { Mascot } from "./Mascot";

function HeroStat({
  tone,
  label,
  sub,
  num,
  icon,
}: {
  tone: "lavender" | "butter" | "sage" | "peach";
  label: string;
  sub?: string;
  num: number | string;
  icon: ReactNode;
}) {
  return (
    <div className={`hero-stat ${tone}`}>
      <div className="icon">{icon}</div>
      <div className="label">
        <strong>{label}</strong>
        {sub}
      </div>
      <div className="num">{num}</div>
    </div>
  );
}

const ICON_PROPS = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2.2,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

const ICON_ALERT = (
  <svg {...ICON_PROPS}>
    <path d="M12 9v4M12 17h.01M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" />
  </svg>
);
const ICON_RUNNING = (
  <svg {...ICON_PROPS}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3 2" />
  </svg>
);
const ICON_DONE = (
  <svg {...ICON_PROPS} strokeWidth={2.4}>
    <path d="M5 12l5 5 9-11" />
  </svg>
);

export function CartoonHero({
  agent,
  today,
  liveJob,
}: {
  agent: AgentMock["agent"];
  today: AgentMock["today"];
  liveJob: LiveJob;
}) {
  const hour = new Date().getHours();
  const greeting =
    hour < 5
      ? "Working through the night"
      : hour < 12
        ? "Good morning"
        : hour < 17
          ? "Good afternoon"
          : hour < 21
            ? "Good evening"
            : "Working late";

  // Headline: pull the policy name's lead segment for emphasis.
  const headlinePolicy = liveJob.title.match(/Re-scanning ([^—]+?)(?:\s+against|$)/)?.[1] ??
    "your latest policy";

  return (
    <div className="cartoon-hero">
      <Mascot />
      <div className="hero-copy">
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
          <span className="duty-chip">
            <span className="duty-dot" />
            On duty
          </span>
          <span style={{ fontSize: 12, color: "var(--c-ink-soft)", fontWeight: 500 }}>
            {greeting} — I&rsquo;ve been working for {agent.uptime_hours}h
          </span>
        </div>
        <h1>
          I&rsquo;m on it. Looking at <em>{headlinePolicy}</em> right now.
        </h1>
        <p>
          {today.findings_act_now} thing{today.findings_act_now === 1 ? "" : "s"} need your call ·{" "}
          {today.tasks_completed} handled today · {today.tasks_queued} more lined up. Tap a card
          below to see what I found and tell me what to do.
        </p>
      </div>
      <div className="hero-stats">
        <HeroStat
          tone="peach"
          label={`${today.findings_act_now} need your call`}
          num={today.findings_act_now}
          icon={ICON_ALERT}
        />
        <HeroStat
          tone="lavender"
          label={`${today.tasks_running} jobs running`}
          sub={`${today.tasks_queued} queued up`}
          num={today.tasks_running}
          icon={ICON_RUNNING}
        />
        <HeroStat
          tone="sage"
          label={`${today.tasks_completed} handled`}
          sub="since midnight"
          num={today.tasks_completed}
          icon={ICON_DONE}
        />
      </div>
    </div>
  );
}
