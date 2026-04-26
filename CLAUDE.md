# Automated Compliance Monitor — context for Claude

This file is the first thing any AI agent (Claude Design, Claude Code, a future
review agent) should read before changing this repo. It captures **what this
product is, who it's for, and what to leave alone**.

## What it is

A compliance monitor for small businesses. Upload a policy document
(PDF / DOCX / TXT) and get back:

1. A severity-weighted risk score (0–100) against HIPAA, GDPR, PCI-DSS, SOC 2.
2. A punch list of specific gaps with regulatory citations and one-sentence
   remediations.
3. A multi-turn Claude agent transcript showing exactly which tools the model
   called to find semantic gaps the keyword rules can't catch.
4. A diff view comparing two scans of the same policy: closed / opened /
   regressed / improved.

## Who it's for

- **Clinic operations manager** scanning a HIPAA Notice of Privacy Practices.
- **EU-facing shop owner** verifying their privacy policy against GDPR.
- **SaaS founder** pre-flighting a SOC 2 audit prep doc.
- **Hiring manager / portfolio reviewer** clicking the live demo to see a
  real LLM agent loop with visible tool use and an eval harness.

The first three are the *product* audience; the fourth is the *deployment*
audience. The UI must serve both — no marketing fluff, but enough story on
the landing page that a 30-second visitor understands what they're seeing.

## Brand voice

- Calm, regulatory-trustworthy, data-dense.
- Sentences over bullet points where the content actually flows.
- Use the actual citation (e.g. "GDPR Art. 33", "45 CFR 164.404") rather than
  vague phrases. This is a tool that's allowed to look serious.
- Avoid: "AI-powered", "magical", "revolutionary", emoji-heavy headers,
  pastel gradients, dancing illustrations.
- Reach for: monospace where data is verbatim (rule IDs, citations, file
  names), thin separators, plenty of whitespace around the risk gauge.

## Design intent (one line)

*Denser than a marketing site, lighter than a SOC dashboard.* The viewer
should feel like they're looking at the kind of internal tool a careful
compliance team would build for itself.

## Repo map

```
backend/                FastAPI + SQLite + the Claude agent loop
  app/
    api/                scan, scans, regulations, (config)
    core/
      parser.py         PDF/DOCX/TXT → text
      pii.py            regex + Luhn
      rules.py          YAML loader, evaluator
      scoring.py        severity-weighted 0-100
      diff.py           two-scan comparison
      agent.py          multi-turn Claude agent loop with transcript
      agent_tools.py    6 tool definitions (search/read/report/finalize)
      pipeline.py       glue: parse → rules → agent → score → persist
    rules/              hipaa.yaml, gdpr.yaml, pci_dss.yaml, soc2.yaml
  evals/                cases.yaml + run.py (precision/recall/F1)
  fixtures/             clinic_policy_weak.txt, saas_policy_strong.txt
  tests/                17 deterministic tests, no API calls in CI

frontend/               Next.js 14 app router + Tailwind
  app/                  page.tsx, scan/[id], scans, compare/[a]/[b]
  components/           UploadForm, RiskGauge, FindingCard, AgentTranscript,
                        VersionPicker, SeverityPill
  lib/
    api.ts              typed fetch helpers
    design-tokens.ts    SINGLE SOURCE OF TRUTH for colors/spacing/type
  DESIGN.md             screen-by-screen UI intent (read this in Claude Design)
```

## What to leave alone

These are intentionally not "Claude design" surface area. Restyling them is
fine. Changing their behavior is not.

- **`backend/app/core/rules.py`** — the YAML rule loader and matcher. The
  eval harness pins precision/recall on this; do not rewrite without
  re-running `./run.sh eval`.
- **`backend/app/core/agent.py` + `agent_tools.py`** — the multi-turn agent
  loop is the portfolio centerpiece. Do not collapse it into a single API
  call. The transcript shape (`{ iteration, kind, content }`) is rendered
  verbatim by the frontend.
- **`backend/app/rules/*.yaml`** — 40 rules across 4 frameworks. Adding rules
  is welcome; deleting them breaks eval baselines.
- **`backend/evals/`** — labeled cases + scoring harness. CI fails the build
  if average recall drops below 1.0.
- **Public API contracts** in `backend/app/api/` — frontend types in
  `frontend/lib/api.ts` mirror them.

## What to polish

- **`frontend/app/page.tsx`** — needs a hero with story, not just bullets.
  Demo-mode should surface a "View live demo" button when there are seeded
  scans.
- **`frontend/app/scan/[id]/page.tsx`** — the gauge could land harder; the
  agent transcript panel is the most interesting thing on the page and it's
  currently collapsed by default.
- **`frontend/app/compare/[after]/[before]/page.tsx`** — counts cards work,
  but the side-by-side evidence rows could read like a code-review diff.
- **`frontend/components/AgentTranscript.tsx`** — show the agent thinking
  through tools as a transcript with motion when the data arrives.
- Empty states everywhere (`/scans` with no scans, scan detail with no
  findings) — currently terse, could feel intentional.

## Deployment topology

- **Frontend** → Vercel (`frontend/vercel.json`, root = `frontend/`).
- **Backend** → Fly.io (`backend/fly.toml`, persistent volume for SQLite).
- One-step local: `./run.sh` (Docker if available, else native venv + npm).
- Demo mode (`DEMO_MODE=true`) seeds two scans on init so the deployed
  instance lands visitors on a populated `/scans` page instead of an empty
  upload form.

## House style

- Python: stdlib + pydantic; no comments unless the *why* is non-obvious.
- TypeScript: strict mode, server components by default, `"use client"`
  only where required.
- No emojis in code or copy unless the user explicitly asks for them.
- Reach for tokens in `frontend/lib/design-tokens.ts`, not raw hex.
