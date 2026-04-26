/**
 * Dashboard mock data — mirrors the shape of `window.AGENT` from the Claude
 * Design prototype's `dashboard-data.jsx`.
 *
 * The autonomous-agent control room needs a long-running agent service plus
 * source watchers, neither of which exist in this repo today (the existing
 * backend implements per-scan, on-demand agent runs). Keeping this data
 * mocked is intentional — a faithful UI port without backend churn.
 */

export type AgentStatus = "running" | "paused" | "error";
export type Severity = "critical" | "high" | "medium" | "low";
export type Priority = "high" | "normal" | "low";
export type TriggerKind = "regulator_update" | "scheduled" | "doc_change";
export type OriginKind =
  | "regulator_update"
  | "doc_change"
  | "expanded_coverage"
  | "scheduled";
export type ResolvedKind = "verified" | "closed" | "maintenance" | "skipped";
export type AgentState =
  | "scanning"
  | "queued"
  | "watching"
  | "up_to_date"
  | "needs_attention";
export type WatcherKind = "regulator" | "doc" | "schedule";
export type StreamKind = "thinking" | "tool_use" | "tool_result";

export interface StreamStep {
  t: number;
  kind: StreamKind;
  text?: string;
  name?: string;
  args?: string;
  summary?: string;
}

export interface LiveJob {
  id: string;
  title: string;
  why: string;
  trigger: { type: TriggerKind; source: string; when: string };
  iteration: number;
  iteration_total_estimate: number;
  progress_pct: number;
  stream: StreamStep[];
}

export interface QueueItem {
  id: string;
  priority: Priority;
  title: string;
  reason: string;
  eta: string;
  trigger: TriggerKind;
}

export interface InboxItem {
  id: string;
  surfaced: string;
  act: "later" | "ignore" | "act_now" | null;
  severity: Severity;
  framework: "HIPAA" | "GDPR" | "PCI_DSS" | "SOC2";
  policy: string;
  section: string;
  title: string;
  summary: string;
  origin: OriginKind;
  origin_label: string;
  attached: string[];
}

export interface ResolvedItem {
  id: string;
  when: string;
  text: string;
  kind: ResolvedKind;
}

export interface Policy {
  id: string;
  name: string;
  short: string;
  frameworks: string[];
  risk_score: number;
  risk_label: "low" | "moderate" | "high" | "critical";
  open_findings: number;
  critical: number;
  high: number;
  last_scan: string;
  next_check: string;
  trend: number[];
  agent_state: AgentState;
  latest_scan_id: number;
}

export interface Watcher {
  id: string;
  source: string;
  last_event: string;
  kind: WatcherKind;
  status: "active" | "scheduled";
  recent_change: boolean;
}

export interface AgentMock {
  agent: {
    name: string;
    model: string;
    status: AgentStatus;
    uptime_hours: number;
    autonomy_level: "supervised" | "autonomous";
  };
  today: {
    tasks_completed: number;
    tasks_running: number;
    tasks_queued: number;
    findings_surfaced: number;
    findings_act_now: number;
    tickets_drafted: number;
    cache_hit_pct: number;
  };
  live_job: LiveJob;
  queue: QueueItem[];
  inbox: InboxItem[];
  resolved: ResolvedItem[];
  policies: Policy[];
  watchers: Watcher[];
  hourly_activity: number[];
}

export const AGENT: AgentMock = {
  agent: {
    name: "Compliance Monitor",
    model: "claude-sonnet-4.6",
    status: "running",
    uptime_hours: 312,
    autonomy_level: "supervised",
  },
  today: {
    tasks_completed: 47,
    tasks_running: 3,
    tasks_queued: 12,
    findings_surfaced: 18,
    findings_act_now: 4,
    tickets_drafted: 6,
    cache_hit_pct: 87,
  },
  live_job: {
    id: "job_2849",
    title: "Re-scanning Westside Clinic NPP against new HHS guidance",
    why: "HHS published updated breach-notification guidance 14 minutes ago. 2 of your monitored policies cite the prior version.",
    trigger: {
      type: "regulator_update",
      source: "HHS.gov · OCR Bulletin",
      when: "14m ago",
    },
    iteration: 4,
    iteration_total_estimate: 7,
    progress_pct: 58,
    stream: [
      {
        t: 0,
        kind: "thinking",
        text: "HHS bulletin 2026-04 affects §164.404 timing. Pulling current policy + diff against the cited version.",
      },
      { t: 2, kind: "tool_use", name: "fetch_regulator_doc", args: "HHS-OCR-2026-04" },
      {
        t: 4,
        kind: "tool_result",
        name: "fetch_regulator_doc",
        summary:
          "Retrieved 14-page bulletin. Material change: notification window tightened from 60d to 45d for breaches >500 individuals.",
      },
      { t: 6, kind: "tool_use", name: "search_policy", args: "breach notification timing" },
      {
        t: 8,
        kind: "tool_result",
        name: "search_policy",
        summary: 'Match in §7.2: "…within 60 days of discovery…" — now stale.',
      },
      {
        t: 11,
        kind: "thinking",
        text: "Confirmed gap. Drafting redline + checking other monitored policies for the same clause.",
      },
      { t: 13, kind: "tool_use", name: "draft_redline", args: "§7.2" },
      {
        t: 16,
        kind: "tool_result",
        name: "draft_redline",
        summary: "Redline ready: 2 lines changed, citation footnoted to OCR-2026-04.",
      },
      {
        t: 19,
        kind: "tool_use",
        name: "scan_portfolio_for_clause",
        args: "60-day breach notification",
      },
      {
        t: 22,
        kind: "tool_result",
        name: "scan_portfolio_for_clause",
        summary: "1 other policy affected: Linnea SaaS — Master Security §11.4.",
      },
      {
        t: 26,
        kind: "thinking",
        text: "Two policies need the same fix. Will surface both with a single regulator-driven finding linked across them.",
      },
    ],
  },
  queue: [
    {
      id: "q1",
      priority: "high",
      title: "Re-scan Linnea SaaS Master Security",
      reason: "Same HHS clause flagged in §11.4",
      eta: "~1 min",
      trigger: "regulator_update",
    },
    {
      id: "q2",
      priority: "high",
      title: "Cross-reference BAA terms with vendor list",
      reason: "Quarterly BAA review window opened today",
      eta: "~3 min",
      trigger: "scheduled",
    },
    {
      id: "q3",
      priority: "normal",
      title: "Diff Atelier Marais privacy v3 → v4",
      reason: "User edited the policy in Notion 22 minutes ago",
      eta: "~2 min",
      trigger: "doc_change",
    },
    {
      id: "q4",
      priority: "normal",
      title: "Check PCI-DSS rule index for v4.0.1 deltas",
      reason: "PCI Council published advisory 2026-04-21",
      eta: "~4 min",
      trigger: "regulator_update",
    },
    {
      id: "q5",
      priority: "low",
      title: "Weekly portfolio sweep · 3 SOC 2 policies",
      reason: "Friday 9am sweep window",
      eta: "~12 min",
      trigger: "scheduled",
    },
  ],
  inbox: [
    {
      id: "f1",
      surfaced: "8m ago",
      act: null,
      severity: "critical",
      framework: "HIPAA",
      policy: "Westside Clinic — NPP",
      section: "§7.2",
      title: "Breach notification window now exceeds HHS guidance",
      summary:
        "Policy states 60 days; HHS-OCR-2026-04 (eff. immediately) requires 45 days for breaches >500 individuals.",
      origin: "regulator_update",
      origin_label: "Triggered by HHS bulletin · 14m ago",
      attached: ["redline draft", "Linear ticket draft"],
    },
    {
      id: "f2",
      surfaced: "23m ago",
      act: null,
      severity: "high",
      framework: "GDPR",
      policy: "Atelier Marais — EU Shop Privacy",
      section: "§4 (DSAR)",
      title: "DSAR workflow still missing identity verification step",
      summary:
        "Carried over from v3 scan. User edited §4 in Notion this morning but the verification step wasn't added.",
      origin: "doc_change",
      origin_label: "Re-checked after Notion edit · 22m ago",
      attached: ["redline draft"],
    },
    {
      id: "f3",
      surfaced: "1h ago",
      act: null,
      severity: "high",
      framework: "PCI_DSS",
      policy: "Westside Clinic — NPP",
      section: "§9.4",
      title: "Quarterly ASV scan cadence undefined",
      summary:
        "Found while expanding PCI rule coverage. Policy mentions 'periodic scans' without committing to a quarterly cadence.",
      origin: "expanded_coverage",
      origin_label: "Surfaced during routine sweep · 1h ago",
      attached: ["suggested clause"],
    },
    {
      id: "f4",
      surfaced: "2h ago",
      act: null,
      severity: "medium",
      framework: "SOC2",
      policy: "Linnea SaaS — Master Security",
      section: "§3.1",
      title: "Access review cadence drifted from quarterly to ad-hoc",
      summary:
        "Diff vs. v1: 'reviewed quarterly' was relaxed to 'reviewed regularly.' SOC 2 CC6.3 expects a defined cadence.",
      origin: "doc_change",
      origin_label: "Detected on policy diff · 2h 4m ago",
      attached: ["redline draft", "auditor note"],
    },
    {
      id: "f5",
      surfaced: "yesterday",
      act: "later",
      severity: "low",
      framework: "HIPAA",
      policy: "Westside Clinic — NPP",
      section: "Appendix B",
      title: "Vendor list footer date is 11 months stale",
      summary:
        "Cosmetic. Vendor list referenced in BAA appendix says 'Updated May 2025'. Suggest annual refresh.",
      origin: "scheduled",
      origin_label: "Routine sweep · yesterday",
      attached: [],
    },
  ],
  resolved: [
    {
      id: "r1",
      when: "12m ago",
      text: "Auto-confirmed PCI-DSS §11.3 still passing on Linnea SaaS — no clause change since last scan.",
      kind: "verified",
    },
    {
      id: "r2",
      when: "34m ago",
      text: "Refreshed cached embeddings for HIPAA rule index after OCR bulletin.",
      kind: "maintenance",
    },
    {
      id: "r3",
      when: "1h ago",
      text: "Closed finding #f-2871: encryption-at-rest clause added in policy v3.1, now passing.",
      kind: "closed",
    },
    {
      id: "r4",
      when: "2h ago",
      text: "Detected duplicate vendor entry across two policies; merged citations.",
      kind: "maintenance",
    },
    {
      id: "r5",
      when: "3h ago",
      text: "Skipped re-scan of Atelier Marais — content hash unchanged since last full scan.",
      kind: "skipped",
    },
  ],
  policies: [
    {
      id: "p1",
      name: "Westside Clinic — NPP",
      short: "NPP",
      frameworks: ["HIPAA", "GDPR", "PCI_DSS", "SOC2"],
      risk_score: 34,
      risk_label: "moderate",
      open_findings: 11,
      critical: 1,
      high: 4,
      last_scan: "2h ago",
      next_check: "in 12 min",
      trend: [87, 82, 71, 58, 51, 42, 34],
      agent_state: "scanning",
      latest_scan_id: 1,
    },
    {
      id: "p2",
      name: "Linnea SaaS — Master Security",
      short: "Linnea",
      frameworks: ["SOC2", "GDPR"],
      risk_score: 12,
      risk_label: "low",
      open_findings: 4,
      critical: 0,
      high: 1,
      last_scan: "5h ago",
      next_check: "queued",
      trend: [38, 32, 28, 22, 18, 14, 12],
      agent_state: "queued",
      latest_scan_id: 2,
    },
    {
      id: "p3",
      name: "Atelier Marais — EU Shop Privacy",
      short: "Atelier",
      frameworks: ["GDPR", "PCI_DSS"],
      risk_score: 41,
      risk_label: "moderate",
      open_findings: 9,
      critical: 0,
      high: 3,
      last_scan: "22m ago",
      next_check: "watching",
      trend: [62, 58, 51, 49, 45, 42, 41],
      agent_state: "needs_attention",
      latest_scan_id: 1,
    },
    {
      id: "p4",
      name: "Vendor BAA — Northstar Imaging",
      short: "BAA Northstar",
      frameworks: ["HIPAA"],
      risk_score: 19,
      risk_label: "low",
      open_findings: 2,
      critical: 0,
      high: 0,
      last_scan: "yesterday",
      next_check: "weekly sweep",
      trend: [34, 30, 27, 24, 22, 20, 19],
      agent_state: "up_to_date",
      latest_scan_id: 2,
    },
    {
      id: "p5",
      name: "DPA Template — EU Vendors",
      short: "DPA",
      frameworks: ["GDPR"],
      risk_score: 8,
      risk_label: "low",
      open_findings: 1,
      critical: 0,
      high: 0,
      last_scan: "3 days ago",
      next_check: "monthly",
      trend: [22, 18, 16, 14, 12, 10, 8],
      agent_state: "up_to_date",
      latest_scan_id: 2,
    },
    {
      id: "p6",
      name: "Incident Response Plan",
      short: "IRP",
      frameworks: ["SOC2", "HIPAA"],
      risk_score: 27,
      risk_label: "moderate",
      open_findings: 5,
      critical: 0,
      high: 2,
      last_scan: "6h ago",
      next_check: "watching",
      trend: [44, 41, 38, 34, 31, 29, 27],
      agent_state: "watching",
      latest_scan_id: 2,
    },
  ],
  watchers: [
    {
      id: "w1",
      source: "HHS · OCR Bulletins",
      last_event: "14m ago",
      kind: "regulator",
      status: "active",
      recent_change: true,
    },
    {
      id: "w2",
      source: "PCI Security Council",
      last_event: "2d ago",
      kind: "regulator",
      status: "active",
      recent_change: false,
    },
    {
      id: "w3",
      source: "EU EDPB Guidelines",
      last_event: "8d ago",
      kind: "regulator",
      status: "active",
      recent_change: false,
    },
    {
      id: "w4",
      source: "Notion · /Compliance",
      last_event: "22m ago",
      kind: "doc",
      status: "active",
      recent_change: true,
    },
    {
      id: "w5",
      source: "Google Drive · /Policies",
      last_event: "yesterday",
      kind: "doc",
      status: "active",
      recent_change: false,
    },
    {
      id: "w6",
      source: "Schedule · Friday 9am sweep",
      last_event: "in 18h",
      kind: "schedule",
      status: "scheduled",
      recent_change: false,
    },
  ],
  hourly_activity: [0, 0, 1, 0, 0, 1, 0, 1, 2, 3, 2, 4, 1, 2, 3, 5, 2, 1, 0, 2, 1, 3, 2, 4],
};
