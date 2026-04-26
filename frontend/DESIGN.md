# Frontend design intent

Read this in Claude Design alongside `CLAUDE.md` (repo root) before generating
prototypes. It describes **what each screen needs to do**, not how to style
it — the visual language is yours to define on the canvas.

## Audiences (already discussed in CLAUDE.md, recap)

- **Operator audience** (clinic ops manager, EU shop owner, SaaS founder):
  uploads a real policy, expects a serious-looking report.
- **Reviewer audience** (hiring manager, OSS visitor, prospective customer):
  arrives via the live demo URL, has 30 seconds, wants to see the AI agent
  do something visible.

## Token sources

Single source of truth: `frontend/lib/design-tokens.ts`. Do not introduce
loose hex values in components. Whatever Claude Design produces should land
in this file (or extend it) so the rest of the app stays consistent.

## Screen-by-screen intent

### 1. Home / `/`

Two-pane layout today (story on the left, upload on the right). The story
side currently undersells the product — it should communicate:

- **Headline** (one sentence): catch compliance gaps before regulators do.
- **Sub** (one sentence): four frameworks, AI agent that shows its work,
  re-scan to track progress.
- **The four-layer pipeline diagram**: parse → rules → AI agent → score.
  Inline, scannable.
- **Demo button** (only visible when `/api/config` returns
  `demo_mode: true`): "View live demo" → `/scans`. This is what reviewers
  click first.
- **Upload form** (right side): drag-drop, framework toggles, optional
  policy name. Already wired.

What to leave alone: the framework toggle UX (`/api/regulations` drives the
options), the `policy_name` input.

### 2. Scan result / `/scan/[id]`

This is the highest-value screen — it's what a reviewer screenshots.

Hierarchy from top to bottom:

1. **Filename + policy name + scan timestamp.**
2. **Risk score block**: gauge + severity counts (critical/high/medium/low).
   Currently a conic-gradient ring. The number should land hard — this is
   the "hero shot".
3. **Executive summary** (one paragraph from the agent).
4. **Agent transcript panel** — the AI showcase. Collapsed by default
   today; consider opening for the first scan a visitor lands on. Each turn
   shows: assistant text, thinking trace (when `USE_THINKING=true`), tool
   call (color-coded), tool result. Header summary: iterations, tool
   calls, input/output tokens, cache-hit rate.
5. **Version picker** ("Compare with previous version") — only renders if
   the scan has siblings sharing its `policy_name`.
6. **Findings**, grouped by framework, sorted with failed first then by
   severity. Each `FindingCard` shows: severity pill, framework + rule_id,
   AI badge if `source: "claude"`, status pill (Missing / Violation /
   Weak / Contradiction / Present), evidence quote, remediation,
   regulatory citation.

What to leave alone: `Finding` shape, transcript step shape (`{ iteration,
kind, content }`), severity color mapping (low=green / moderate=amber /
high=orange / critical=red).

### 3. Agent transcript / inline panel

The single most interesting thing on the site. It should *feel* like an
agent transcript, not a logfile dump.

- Color-code tool calls by type:
  - `search_regulation_index`, `get_rule_details` → violet (rules lookup)
  - `search_document`, `read_document_excerpt` → blue (document analysis)
  - `report_finding` → emerald (output)
  - `finalize` → amber (terminal)
- Each tool result is collapsed to a one-line preview by default; click
  reveals full JSON.
- Show a thin connector line between turns to imply the loop.
- Header cluster: turn count · tool-call count · input/output tokens ·
  cache-hit % (only when > 0).
- Optional motion (degrade gracefully without): when first rendered, fade
  steps in sequentially — this is what makes it feel like an agent.

### 4. Compare / `/compare/[after]/[before]`

Side-by-side diff of two scans of the same policy. Sections in this order:

1. **Header**: "compare scan #N (date) → scan #M (date)" + delta pill.
2. **Risk score row**: "100 → 9.0 (-91.0)" with a green/red delta tint.
3. **Counts row**: 4 cards — Closed, Opened, Regressed, Still failing.
4. **Sections** (only render non-empty): Opened, Regressed, Closed,
   Improved, Still failing. Each entry shows before/after side-by-side
   evidence boxes — like a code-review diff but with regulation findings.

What to leave alone: the change classification (`closed | opened |
regressed | improved | still_failing | still_passing`), the API shape from
`compareScans()`.

### 5. Scan history / `/scans`

A simple table today. Make the empty state intentional ("Run your first
scan" with a clear path back to `/`). When `demo_mode`, the page is
populated on first visit — make sure the seeded rows look real.

### 6. Empty / loading states

- `/scans` empty: friendly copy + button to home.
- `/scan/[id]` 404: brief, link back.
- Mid-scan loading on the upload form: the "Analyzing…" spinner sits next
  to the submit button. The agent loop can take 5–15 seconds with
  `USE_CLAUDE=true` — communicate progress, don't go silent.

## Responsive

- Desktop is the primary surface (data-dense).
- At `< 768px`, the two-pane home stacks. Upload form moves above the
  story.
- Risk gauge and severity-count grid go single-column.
- Transcript steps remain readable; tool-result `<pre>` blocks scroll
  horizontally inside their card.

## Accessibility floor

- All interactive controls keyboard-reachable (no `div onClick`).
- Color is never the only signal — severity pills carry text.
- Risk-label colors should pass AA against their backgrounds (today: green
  16a34a / amber ca8a04 / orange ea580c / red dc2626 — the amber is
  borderline, audit it).
- Transcript content is text-selectable.

## Out of scope for Claude Design

- Backend API contracts (locked).
- Rule YAMLs (locked).
- Agent loop logic (locked).
- The token *names* in `design-tokens.ts` (values are open; names should
  stay so components don't churn).

## Deliverable shape (what comes back to Claude Code)

A handoff bundle that:

1. Replaces values in `frontend/lib/design-tokens.ts`.
2. Updates the six screen components and the seven `components/*.tsx`
   files (props/contracts unchanged).
3. Adds any new assets to `frontend/public/`.
4. Builds clean (`./run.sh test` stays green).
