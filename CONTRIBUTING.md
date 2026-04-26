# Contributing

Thanks for considering a contribution! This is a portfolio-grade
demonstration of LLM-powered compliance analysis — small, focused PRs are
welcome.

## Getting started

```bash
./run.sh                # one-step launcher (Docker if available, else local)
./run.sh test           # backend tests + frontend type-check
./run.sh eval           # run the eval harness against labeled fixtures
```

## Adding a regulation

Drop a YAML file in `backend/app/rules/` matching the shape of the existing
files. The agent and rules engine pick it up at startup — no code changes
needed.

## Adding eval cases

Append to `backend/evals/cases.yaml`. Each case is a short policy snippet
plus the set of `rule_id`s that should be flagged. Run `./run.sh eval`
to see the impact on precision / recall / F1.

## Code style

- Python: stdlib + `pydantic` types; no comments unless capturing a
  non-obvious *why*. Run `pytest` before pushing.
- TypeScript: strict mode, server components by default, `"use client"`
  only where required. Run `next build` before pushing.

## Reporting issues

Include the OS, Python/Node versions, the exact command run, and the full
error. If the issue is about a false positive/negative finding, paste the
relevant snippet of policy text (anonymized) so it can become an eval case.
