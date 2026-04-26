"""Eval harness for the rules engine.

For each labeled case in cases.yaml, runs the rules engine and computes:

- precision = TP / (TP + FP)
- recall    = TP / (TP + FN)
- F1        = 2 * P * R / (P + R)

A "positive" is a rule_id reported as failing (missing/violation). The
``expected_failing`` set in each case is ground truth.

By default the agent loop is skipped (USE_CLAUDE=false) so the harness runs
deterministically in CI without an API key. Pass ``--with-agent`` and a valid
``ANTHROPIC_API_KEY`` to also evaluate the semantic findings produced by the
agent.

Usage:
    python -m evals.run                # human-readable table
    python -m evals.run --json         # machine-readable
    python -m evals.run --case <name>  # run a single case

Exit code is 0 if every case meets ``min_recall`` (default 1.0 — all expected
failures must be detected), else 1. CI uses this to gate merges on regression
in detection coverage.
"""

from __future__ import annotations

import argparse
import json
import os
import sys
from pathlib import Path
from typing import Any

import yaml

CASES_PATH = Path(__file__).resolve().parent / "cases.yaml"


def _import_pipeline():
    # Ensure config picks up flag changes before importing settings consumers.
    from app.core.pipeline import run as run_pipeline  # noqa: WPS433

    return run_pipeline


def _failing_ids(findings: list[dict]) -> set[str]:
    return {
        f["rule_id"]
        for f in findings
        if f.get("status") in {"missing", "violation"}
    }


def _evaluate_case(case: dict, run_pipeline) -> dict[str, Any]:
    expected = set(case["expected_failing"])
    result = run_pipeline(case["text"], case.get("frameworks", ["HIPAA", "GDPR", "PCI_DSS", "SOC2"]))
    findings = [f.to_dict() for f in result.findings]
    actual = _failing_ids(findings)

    tp = expected & actual
    fp = actual - expected
    fn = expected - actual

    precision = len(tp) / (len(tp) + len(fp)) if (tp or fp) else 1.0
    recall = len(tp) / (len(tp) + len(fn)) if (tp or fn) else 1.0
    f1 = 2 * precision * recall / (precision + recall) if (precision + recall) else 0.0

    return {
        "name": case["name"],
        "frameworks": case.get("frameworks", []),
        "expected": sorted(expected),
        "true_positives": sorted(tp),
        "false_positives": sorted(fp),
        "false_negatives": sorted(fn),
        "precision": round(precision, 3),
        "recall": round(recall, 3),
        "f1": round(f1, 3),
        "risk_score": result.risk_score,
        "risk_label": result.risk_label,
    }


def _print_table(results: list[dict[str, Any]]) -> None:
    print(f"{'case':<28} {'P':>6} {'R':>6} {'F1':>6}  fp/fn")
    print("-" * 70)
    for r in results:
        fpfn = ""
        if r["false_positives"]:
            fpfn += " FP=" + ",".join(r["false_positives"][:3])
        if r["false_negatives"]:
            fpfn += " FN=" + ",".join(r["false_negatives"][:3])
        print(
            f"{r['name']:<28} "
            f"{r['precision']:>6.2f} {r['recall']:>6.2f} {r['f1']:>6.2f} "
            f"{fpfn}"
        )
    print("-" * 70)
    n = len(results)
    avg_p = sum(r["precision"] for r in results) / n
    avg_r = sum(r["recall"] for r in results) / n
    avg_f = sum(r["f1"] for r in results) / n
    print(f"{'AVERAGE':<28} {avg_p:>6.2f} {avg_r:>6.2f} {avg_f:>6.2f}")


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="Run the eval harness")
    parser.add_argument("--json", action="store_true", help="emit JSON instead of a table")
    parser.add_argument("--case", help="run a single case by name")
    parser.add_argument("--with-agent", action="store_true", help="enable the Claude agent (requires ANTHROPIC_API_KEY)")
    parser.add_argument("--min-recall", type=float, default=1.0, help="minimum average recall to consider the run passing")
    args = parser.parse_args(argv)

    if not args.with_agent:
        os.environ["USE_CLAUDE"] = "false"
    # Reset cached settings AFTER toggling the env var.
    from app.config import get_settings

    get_settings.cache_clear()  # type: ignore[attr-defined]

    run_pipeline = _import_pipeline()

    cases = yaml.safe_load(CASES_PATH.read_text())["cases"]
    if args.case:
        cases = [c for c in cases if c["name"] == args.case]
        if not cases:
            print(f"No case named {args.case!r}", file=sys.stderr)
            return 2

    results = [_evaluate_case(c, run_pipeline) for c in cases]

    if args.json:
        print(json.dumps({"results": results}, indent=2))
    else:
        _print_table(results)

    avg_recall = sum(r["recall"] for r in results) / len(results)
    if avg_recall < args.min_recall:
        print(f"\nAverage recall {avg_recall:.2f} < threshold {args.min_recall:.2f}", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
