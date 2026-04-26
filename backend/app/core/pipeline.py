"""Glue: parse → rules → Claude → score → persist."""

from __future__ import annotations

from dataclasses import dataclass

from . import claude_client
from .rules import Finding, evaluate_all, load_frameworks
from .scoring import score


@dataclass
class ScanResult:
    risk_score: float
    risk_label: str
    summary: str
    findings: list[Finding]
    used_claude: bool
    cache_hit: bool


def run(text: str, frameworks: list[str]) -> ScanResult:
    rule_findings, _pii = evaluate_all(text, frameworks)

    specs = load_frameworks()
    selected_specs = [specs[fw] for fw in frameworks if fw in specs]
    semantic = claude_client.analyze(text, selected_specs, rule_findings)

    all_findings = rule_findings + semantic.findings
    risk, label = score(all_findings)

    return ScanResult(
        risk_score=risk,
        risk_label=label,
        summary=semantic.summary,
        findings=all_findings,
        used_claude=bool(semantic.findings) or semantic.input_tokens > 0,
        cache_hit=semantic.used_cache,
    )
