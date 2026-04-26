"""Glue: parse → rules → agent → score → persist."""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any

from . import agent as agent_mod
from .rules import Finding, evaluate_all, load_frameworks
from .scoring import score


@dataclass
class ScanResult:
    risk_score: float
    risk_label: str
    summary: str
    findings: list[Finding]
    transcript: list[dict[str, Any]] = field(default_factory=list)
    used_claude: bool = False
    cache_hit: bool = False
    iterations: int = 0
    input_tokens: int = 0
    output_tokens: int = 0
    cached_tokens: int = 0


def run(text: str, frameworks: list[str]) -> ScanResult:
    rule_findings, _pii = evaluate_all(text, frameworks)

    specs = load_frameworks()
    selected_specs = [specs[fw] for fw in frameworks if fw in specs]
    report = agent_mod.run_agent(text, selected_specs, rule_findings)

    all_findings = rule_findings + report.findings
    risk, label = score(all_findings)

    return ScanResult(
        risk_score=risk,
        risk_label=label,
        summary=report.summary,
        findings=all_findings,
        transcript=[step.to_dict() for step in report.transcript],
        used_claude=report.used_claude,
        cache_hit=report.cache_hit,
        iterations=report.iterations,
        input_tokens=report.input_tokens,
        output_tokens=report.output_tokens,
        cached_tokens=report.cached_tokens,
    )
