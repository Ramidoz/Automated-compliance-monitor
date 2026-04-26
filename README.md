# Automated Compliance Monitor

Upload a policy document. Get back a risk-weighted score and a punch list of
specific gaps against **HIPAA**, **GDPR**, **PCI-DSS**, and **SOC 2** —
each with the regulatory citation and a one-sentence remediation.

Built for small businesses (clinics, EU-facing shops, SaaS startups) that need
to spot compliance exposure before regulators or auditors do.

---

## What it does

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
                                │ semantic gap analysis │
                                │ (prompt-cached rules) │
                                └───────────────────────┘
```

| Layer | What it catches |
|---|---|
| **Rules engine** | Required clauses (e.g. "Notice of Privacy Practices", "72 hours", "BAA"), numeric obligations (60-day breach notice, quarterly scans, MFA on CDE), citations |
| **PII scanner** | Emails, US SSNs, credit-card numbers (Luhn-validated), IBANs, phones, IPs, DOBs that should never appear in a policy doc |
| **Claude semantic pass** | Vague language, missing operational detail, contradictions — gaps that keyword rules can't see. Returns strict JSON via tool-call. |
| **Risk scoring** | Severity-weighted (`critical=25, high=12, medium=6, low=2`); PII violations carry 1.5× weight |

Demo delta on the bundled fixtures (Claude disabled for reproducibility):

```
clinic_policy_weak.txt    risk=100.0  label=critical   42 failed of 42
saas_policy_strong.txt    risk= 19.4  label=moderate    8 failed of 41
```

---

## Quickstart

### 1. Backend

```bash
cd backend
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env       # paste your ANTHROPIC_API_KEY (or set USE_CLAUDE=false)
uvicorn app.main:app --reload --port 8000
```

The first request creates `compliance.db` (SQLite). Hit `http://localhost:8000/api/health`.

### 2. Frontend

```bash
cd frontend
npm install
npm run dev                # http://localhost:3000
```

Drop a PDF/DOCX/TXT on the home page. The dashboard shows the risk gauge,
severity counts, per-framework findings, and the document excerpt.

### 3. Try the bundled fixtures

```bash
curl -F 'frameworks=HIPAA,GDPR,PCI_DSS,SOC2' \
     -F 'file=@backend/fixtures/clinic_policy_weak.txt' \
     http://localhost:8000/api/scan | jq '.risk_score, .risk_label'
```

---

## Configuration

`backend/.env`:

| Var | Default | Notes |
|---|---|---|
| `ANTHROPIC_API_KEY` | — | Required if `USE_CLAUDE=true` |
| `ANTHROPIC_MODEL` | `claude-sonnet-4-6` | Sonnet 4.6 is the recommended default — strong on this task without Opus pricing |
| `USE_CLAUDE` | `true` | Set `false` for offline/CI runs (rules + PII only) |
| `USE_THINKING` | `false` | Set `true` to enable extended thinking for deeper semantic analysis (higher latency/cost) |
| `THINKING_BUDGET_TOKENS` | `2000` | Only used when `USE_THINKING=true` |
| `DATABASE_URL` | `sqlite+aiosqlite:///./compliance.db` | Swap for Postgres in prod |
| `ALLOW_ORIGINS` | `http://localhost:3000` | Comma-separated CORS allow-list |

### Why Sonnet 4.6, not Opus?

Compliance gap-spotting is a moderate-difficulty NLP task. Sonnet 4.6 nails it
without thinking enabled, which keeps the demo snappy and the per-scan cost low.
Prompt caching on the framework-rules system block (1h TTL) takes ~90% off input
tokens for repeat scans — so a clinic running 50 scans/month pays for the rules
once.

Flip `USE_THINKING=true` if you want the model to deliberate harder; it's
implemented and tested, just off by default.

---

## API

| Method | Path | Purpose |
|---|---|---|
| `POST` | `/api/scan` | multipart upload (`file` + `frameworks` CSV); returns full `ScanResponse` |
| `GET`  | `/api/scans` | last 50 scans (summary rows) |
| `GET`  | `/api/scans/{id}` | full scan detail |
| `GET`  | `/api/regulations` | available frameworks + rule counts |
| `GET`  | `/api/health` | liveness |

---

## Project layout

```
backend/
  app/
    main.py              FastAPI app + CORS + DB init
    config.py            pydantic-settings
    db.py                SQLAlchemy async, single Scan table
    api/
      scan.py            POST /scan
      scans.py           GET /scans, /scans/{id}
      regulations.py     GET /regulations
    core/
      parser.py          PDF/DOCX/TXT → text
      pii.py             regex + Luhn
      rules.py           load YAML, evaluate (requires_any / requires_all)
      scoring.py         severity-weighted 0-100
      claude_client.py   Sonnet 4.6, prompt cache, structured tool output
      pipeline.py        glue
    rules/
      hipaa.yaml         10 rules + PHI-leak guard
      gdpr.yaml          10 rules + PII-leak guard
      pci_dss.yaml       10 rules + PAN-leak guard
      soc2.yaml          10 rules
  fixtures/
    clinic_policy_weak.txt   demo: should score ~100 (critical)
    saas_policy_strong.txt   demo: should score ~20 (moderate)
  tests/
    test_pipeline.py     5 deterministic tests, no API calls

frontend/
  app/
    page.tsx             upload + frameworks
    scan/[id]/page.tsx   risk gauge + grouped findings
    scans/page.tsx       history table
  components/
    UploadForm.tsx       drag-and-drop, framework toggles
    RiskGauge.tsx        conic-gradient ring
    FindingCard.tsx
    SeverityPill.tsx
  lib/api.ts             typed fetch helpers
```

---

## Adding a new regulation

Drop a YAML file in `backend/app/rules/` following this shape:

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

No code change needed — `load_frameworks()` discovers files at runtime and the
frontend picks up the new option from `/api/regulations`.

---

## Testing

```bash
cd backend && .venv/bin/python -m pytest tests/ -q
```

5 tests, ~0.2s, no network. Claude is force-disabled in tests for determinism.

---

## What it isn't

- **Not legal advice.** This is a tool for triage, not a substitute for counsel.
- **Not a replacement for an audit.** Useful for catching obvious gaps before
  a real auditor arrives — and for tracking improvement over time.
- **Not OCR-ed.** Scanned PDFs without a text layer extract no text. Add
  Tesseract or AWS Textract if your inputs are scans.
