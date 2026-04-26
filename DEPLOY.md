# Deploy

The split: **frontend on Vercel**, **backend on Fly.io**. Both are wired in
the repo — this doc is the recipe to take them live.

> Use Claude Design first if you want a polished UI ([CLAUDE.md](CLAUDE.md)
> describes the workflow). Everything below works for whatever UI you've got.

## Prerequisites

- A GitHub fork or clone of this repo connected to your Vercel + Fly accounts.
- An Anthropic API key (`sk-ant-...`) for the agent loop. Optional — the
  service runs offline with `USE_CLAUDE=false`, but the agent transcript is
  the headline feature for the deployed demo.
- The Fly CLI (`flyctl`) installed locally. Vercel can be done from the
  dashboard or via your Vercel MCP.

---

## 1. Backend → Fly.io

```bash
cd backend
fly launch --no-deploy --copy-config           # creates the app, keeps fly.toml
fly volumes create compliance_data --region iad --size 1
fly secrets set \
    ANTHROPIC_API_KEY=sk-ant-... \
    USE_CLAUDE=true \
    DEMO_MODE=true \
    ALLOW_ORIGINS=https://<your-vercel-domain>     # placeholder; fill in step 2
fly deploy
```

After deploy, note the URL: `https://<your-app>.fly.dev`. Sanity-check it:

```bash
curl https://<your-app>.fly.dev/api/health        # {"status":"ok"}
curl https://<your-app>.fly.dev/api/config        # {"demo_mode":true,...}
```

`DEMO_MODE=true` causes the first cold start to seed two scans
(clinic_policy_weak + saas_policy_strong) so visitors land on populated
screens. Subsequent boots skip the seed (idempotent — checks `count(scans)`
before inserting).

If you set `USE_CLAUDE=true`, the seed runs the full agent loop against each
fixture, which costs ~10–30s per fixture and a small number of API tokens.
That cost is one-time and gives you live agent transcripts on the demo page.

## 2. Frontend → Vercel

### Via the Vercel dashboard

1. **Import** the repo. Set **Root Directory** to `frontend/`.
2. Framework preset: **Next.js** (auto-detected via `vercel.json`).
3. Set environment variable:
   - `NEXT_PUBLIC_API_BASE` = `https://<your-fly-app>.fly.dev/api`
4. Deploy.

### Via Vercel MCP (if you have it connected in your Claude Code session)

The MCP exposes deploy tooling. The minimal interaction:

```
Use the Vercel MCP to deploy the project at frontend/ to a new project
named "compliance-monitor". Set NEXT_PUBLIC_API_BASE in the production
environment to https://<your-fly-app>.fly.dev/api.
```

The MCP handles project creation, environment vars, and the build trigger.
Verify by visiting the production URL and checking `/scans` lists the two
seeded scans.

## 3. Wire CORS

Once both URLs exist, set the backend's allow-list:

```bash
fly secrets set ALLOW_ORIGINS=https://<your-vercel-domain>
fly deploy --no-cache       # no-cache forces the new env into the running machine
```

## 4. Smoke test

```bash
# Backend reachable
curl -fs https://<fly>/api/health

# Demo data seeded
curl -fs https://<fly>/api/scans | jq 'length'        # expect 2

# Frontend serves the home page
curl -fs https://<vercel>/ -o /dev/null -w '%{http_code}\n'   # expect 200
```

Then visit `https://<vercel>/` in a browser:

- Home page should show the **View live demo** button (because
  `/api/config.demo_mode === true`).
- Clicking it lands on `/scans` with the two seeded rows.
- Opening either scan shows the risk gauge, findings, and (if
  `USE_CLAUDE=true`) the agent transcript.
- `/compare/2/1` renders the diff with a -91.0 risk delta.

## 5. Add the live URL to the README

Replace the CI badge line at the top of [README.md](README.md) with:

```markdown
[![Live demo](https://img.shields.io/badge/demo-live-success)](https://<your-vercel-domain>)
[![CI](.../ci.yml/badge.svg)](.../actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
```

Plus a screenshot of the scan-detail page in the README hero.

---

## Costs

- **Fly**: free tier covers a `shared-cpu-1x` 512MB machine that scales to
  zero between visits. Persistent volume is 1 GB free.
- **Vercel**: hobby tier covers Next.js builds + serving the demo.
- **Anthropic API**: at default settings (Sonnet 4.6, no extended thinking,
  prompt caching on the rules block) a typical scan is ~3–5k input tokens
  and ~1–2k output tokens. Re-scans of the same rules cost ~10% of that
  due to caching. The seeded demo scans run twice ever (once per cold-start
  of a fresh DB).

If you want to control spend on the demo URL, set `USE_CLAUDE=false` in Fly
secrets — visitors will see rules-engine findings only, no agent
transcript. The other features (risk gauge, compare diff, eval harness) all
still work.

## CI/CD (optional)

The repo ships with `.github/workflows/ci.yml` running pytest + eval +
frontend build on every push. To add deploy automation:

- Vercel auto-deploys on push to `main` once you import the repo (no extra
  config needed; production deploys on `main`, previews on PRs).
- For Fly, add `flyctl deploy` to a workflow gated on the `backend/` paths
  with `FLY_API_TOKEN` as a repo secret. Skipped here to keep CI tight —
  most users will only redeploy the backend a few times a year.
