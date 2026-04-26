# Automated Compliance Monitor

Upload a policy document. A multi-turn **AI agent** (Claude Sonnet 4.6) plus a
deterministic rules engine score it against **HIPAA**, **GDPR**, **PCI-DSS**,
and **SOC 2**, flag specific gaps with regulatory citations, suggest fixes,
and let you re-scan over time to watch findings open and close.

> **For data scientists / ML engineers**: this repo is a portfolio-grade
> demonstration of **(1)** building a Claude tool-using agent loop, **(2)**
> evaluating LLM output with a labeled eval harness, and **(3)** shipping it
> as a deployable open-source product.

[![CI](https://github.com/Ramidoz/automated-compliance-monitor/actions/workflows/ci.yml/badge.svg)](https://github.com/Ramidoz/automated-compliance-monitor/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

---

## One step

```bash
git clone https://github.com/Ramidoz/automated-compliance-monitor && cd automated-compliance-monitor
./run.sh
```

That's it. The launcher uses `docker compose` if available, otherwise falls
back to a native Python venv + `npm`. Defaults to `USE_CLAUDE=false` so it
runs out-of-the-box without an API key (rules engine + PII scanner only).

To enable the AI agent:

```bash
export ANTHROPIC_API_KEY=sk-ant-... USE_CLAUDE=true
./run.sh
```

Then open <http://localhost:3000>.

Other one-liners:

```bash
./run.sh test    # backend pytest + frontend type-check + production build
./run.sh eval    # run the eval harness against labeled cases
./run.sh demo    # headless: scan both fixtures, write demo/results/*.json
./run.sh stop    # stop docker compose / native processes
```

---

## What the AI agent actually does

The Claude integration is **not** a single API call. It's a tool-using agent
loop that you can watch step-by-step in the UI:

```
┌────────────────────────────────────────────────────────────────────┐
│  Turn 1 → search_document("breach")                                │
│           ← 3 matches, including "as soon as practicable"          │
│  Turn 2 → search_regulation_index("GDPR", "breach 72 hours")       │
│           ← GDPR-006: Breach Notification Timeline (72 hours)      │
│  Turn 2 → get_rule_details("GDPR", "GDPR-006")                     │
│           ← citation, remediation, required keywords               │
│  Turn 3 → report_finding("GDPR", "AI-GDPR-001", "Vague…", …)       │
│  Turn 3 → finalize("Posture is weak on breach response timing.")   │
└────────────────────────────────────────────────────────────────────┘
```

**Tools available to the agent** (`backend/app/core/agent_tools.py`):

| Tool | Purpose |
|---|---|
| `search_regulation_index` | Fuzzy-search loaded rules by title/citation/keyword |
| `get_rule_details`        | Full rule metadata incl. remediation |
| `search_document`         | Locate a phrase in the policy with surrounding context |
| `read_document_excerpt`   | Slice the policy by character offset |
| `report_finding`          | Record a semantic gap (accumulates) |
| `finalize`                | End the loop with an executive summary |

**The transcript is persisted with each scan** and rendered in a collapsible
panel showing every assistant turn, tool call (color-coded), tool result, and
token / cache-hit metrics. This is the artifact that makes the agent visible
to a reviewer instead of buried in a pipeline.

**Implementation notes:**

- Multi-turn loop (max 8 iterations) with full tool-result feedback.
- **Prompt caching** on the framework-rules system block (1h ephemeral
  breakpoint) → ~90% input-token discount on repeat scans.
- **Extended thinking** is opt-in via `USE_THINKING=true` — off by default to
  keep demo latency low.
- Every turn captured into a `TranscriptStep` list (`thinking | text |
  tool_use | tool_result`) and persisted as JSON on the `Scan` row.
- Agent disabled cleanly when `USE_CLAUDE=false` — pipeline still produces
  full keyword findings + risk score (offline-safe for CI / portfolio demos).

---

## Eval harness

```bash
./run.sh eval
```

```
case                              P      R     F1  fp/fn
----------------------------------------------------------------------
hipaa_full_pass                1.00   1.00   1.00
hipaa_missing_baa              1.00   1.00   1.00
hipaa_pii_leak                 1.00   1.00   1.00
gdpr_full_pass                 1.00   1.00   1.00
gdpr_vague_consent             1.00   1.00   1.00
pci_pan_unprotected            1.00   1.00   1.00
soc2_no_change_management      1.00   1.00   1.00
empty_doc                      1.00   1.00   1.00
----------------------------------------------------------------------
AVERAGE                        1.00   1.00   1.00
```

Eight labeled mini-policies in `backend/evals/cases.yaml`, each with the
exhaustive set of `rule_id`s that should fail. The harness computes
**precision**, **recall**, and **F1** per case and on average. CI fails the
build if `--min-recall` (default 1.0) drops — so a regression in detection
coverage is caught before merge.

Building the harness surfaced two real precision bugs that would otherwise
look like model errors:

1. The keyword matcher used strict `\b...\b` boundaries, missing plurals
   (`audit log` vs `audit logs`). Fix: allow `(?:s|es|ing|ed)?` on the final
   word.
2. The `retention_period` rule didn't accept the bare phrase `data retention
   period`. Fix: expand the keyword list.

Both fixes were driven by data, not vibes — that's the whole point of the
eval.

To eval the agent's semantic findings (requires API key):

```bash
ANTHROPIC_API_KEY=sk-ant-... ./run.sh eval -- --with-agent
```

---

## How it scores

```
            ┌──────────────┐    ┌───────────────────────┐    ┌─────────────────┐
PDF/DOCX -> │ Text extract │ -> │ 40+ deterministic     │ -> │ Risk score      │
            │ (pypdf,docx) │    │ keyword/struct rules  │    │ (severity-      │
            │              │    │ + PII regex/Luhn      │    │  weighted 0-100)│
            └──────────────┘    └──────────┬────────────┘    └─────────────────┘
                                           │
                                           ▼
                                ┌───────────────────────┐
                                │ Claude Sonnet 4.6     │
                                │ multi-turn agent loop │
                                │ (6 tools, transcript) │
                                └───────────────────────┘
```

| Layer | What it catches |
|---|---|
| **Rules engine** | Required clauses (e.g. "Notice of Privacy Practices", "72 hours", "BAA"), numeric obligations (60-day breach notice, quarterly scans, MFA on CDE), with citations |
| **PII scanner** | Emails, US SSNs, credit-card numbers (Luhn-validated), IBANs, phones, IPs, DOBs that should never appear in a policy doc |
| **Claude agent** | Vague language, missing operational detail, contradictions — gaps that keyword rules can't see, with full tool-call transcript |
| **Risk scoring** | Severity-weighted (`critical=25, high=12, medium=6, low=2`); PII violations carry 1.5× weight |

Demo delta on the bundled fixtures (offline, agent disabled):

```
clinic_policy_weak.txt    risk=100.0  label=critical   42 failed of 42
saas_policy_strong.txt    risk= 19.4  label=moderate    8 failed of 41
```

---

## Diff over time

Scans share a `policy_name` (auto-derived from the filename, or set on
upload). Re-scan a document and see what changed:

- **closed** — was failing, now passing
- **opened** — was passing, now failing (regression)
- **regressed** — still failing, severity got worse
- **improved** — still failing, severity got better
- **still_failing** — failing in both
- **still_passing** — passing in both

The compare page shows side-by-side evidence per finding, the risk-score
delta, and tinted count cards.

---

## Configuration

`backend/.env`:

| Var | Default | Notes |
|---|---|---|
| `ANTHROPIC_API_KEY` | — | Required for the agent loop |
| `ANTHROPIC_MODEL` | `claude-sonnet-4-6` | Sonnet 4.6 — strong on this task without Opus pricing |
| `USE_CLAUDE` | `true` | Set `false` for offline runs (rules + PII only) |
| `USE_THINKING` | `false` | Set `true` for extended thinking (higher latency / cost) |
| `THINKING_BUDGET_TOKENS` | `2000` | Only used when `USE_THINKING=true` |
| `DATABASE_URL` | `sqlite+aiosqlite:///./compliance.db` | Swap for Postgres in prod |
| `ALLOW_ORIGINS` | `http://localhost:3000` | Comma-separated CORS allow-list |

---

## API

| Method | Path | Purpose |
|---|---|---|
| `POST` | `/api/scan` | multipart: `file`, `frameworks` (CSV), optional `policy_name` |
| `GET`  | `/api/scans` | last 50 scans; `?policy_name=...` filters by policy |
| `GET`  | `/api/scans/{id}` | full detail incl. `agent_transcript` and token metrics |
| `GET`  | `/api/scans/{id}/versions` | other scans of the same policy |
| `GET`  | `/api/scans/{id}/compare/{other_id}` | classified diff |
| `GET`  | `/api/regulations` | available frameworks + rule counts |
| `GET`  | `/api/health` | liveness |

---

## Deploy

Recommended split: **Vercel** for the frontend, **Fly.io** for the backend
(SQLite + persistent volume).

### Backend → Fly.io

```bash
cd backend
fly launch --no-deploy --copy-config
fly volumes create compliance_data --region iad --size 1
fly secrets set ANTHROPIC_API_KEY=sk-ant-... ALLOW_ORIGINS=https://your-frontend.vercel.app
fly deploy
```

### Frontend → Vercel

1. Import the repo, set the **root directory** to `frontend/`.
2. Set `NEXT_PUBLIC_API_BASE` to your Fly URL (e.g. `https://your-app.fly.dev/api`).
3. Deploy.

---

## Project layout

```
backend/
  app/
    main.py               FastAPI + CORS + DB init
    api/                  scan, scans, regulations
    core/
      parser.py           PDF/DOCX/TXT → text
      pii.py              regex + Luhn
      rules.py            YAML loader, evaluator
      scoring.py          severity-weighted 0-100
      diff.py             two-scan comparison
      agent.py            multi-turn agent loop, transcript capture
      agent_tools.py      6 tool definitions + dispatch
      pipeline.py         glue
    rules/                hipaa.yaml, gdpr.yaml, pci_dss.yaml, soc2.yaml
  evals/
    cases.yaml            8 labeled mini-policies
    run.py                P/R/F1 harness, JSON output, CI-gated
  fixtures/               clinic_policy_weak.txt, saas_policy_strong.txt
  tests/                  17 tests covering rules, scoring, diff, agent loop
  Dockerfile, fly.toml

frontend/
  app/
    page.tsx                          upload + frameworks + policy_name
    scan/[id]/page.tsx                risk gauge + findings + AgentTranscript
    scans/page.tsx                    history
    compare/[after]/[before]/         side-by-side diff
  components/
    UploadForm.tsx, RiskGauge.tsx, FindingCard.tsx, SeverityPill.tsx
    VersionPicker.tsx                 prior-versions widget
    AgentTranscript.tsx               turn-by-turn agent panel
  Dockerfile, vercel.json

docker-compose.yml
run.sh                                one-step launcher
scripts/demo.sh                       reproducible offline demo
.github/workflows/ci.yml              pytest + frontend build + eval gate
```

---

## Adding a regulation

Drop a YAML file in `backend/app/rules/` matching the existing shape.
`load_frameworks()` discovers it at runtime — no code changes, no rebuild.

```yaml
framework: ISO27001
display_name: ISO/IEC 27001
description: Information security management system requirements.
rules:
  - id: ISO-001
    title: Information security policy approved by management
    severity: high
    requires_any: ["approved by management", "management approval"]
    citation: ISO 27001 A.5.1
    remediation: State that the ISP is reviewed and approved by management at least annually.
forbidden_in_doc: []
```

---

## What it isn't

- **Not legal advice.** A tool for triage, not a substitute for counsel.
- **Not a replacement for an audit.** Useful for catching obvious gaps and
  tracking improvement over time.
- **Not OCR-ed.** Scanned PDFs without a text layer extract no text. Add
  Tesseract or AWS Textract if your inputs are scans.

## License

MIT — see [LICENSE](LICENSE).

Contributions welcome — see [CONTRIBUTING.md](CONTRIBUTING.md).
