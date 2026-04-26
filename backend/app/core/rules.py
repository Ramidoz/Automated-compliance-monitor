from __future__ import annotations

import re
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any

import yaml

from .pii import PIIHit, detect_pii

RULES_DIR = Path(__file__).resolve().parent.parent / "rules"

SEVERITY_WEIGHT = {
    "critical": 25.0,
    "high": 12.0,
    "medium": 6.0,
    "low": 2.0,
}


@dataclass
class Finding:
    framework: str
    rule_id: str
    title: str
    severity: str
    status: str
    citation: str = ""
    remediation: str = ""
    evidence: str = ""
    source: str = "rules"

    def to_dict(self) -> dict[str, Any]:
        return self.__dict__.copy()


@dataclass
class FrameworkSpec:
    framework: str
    display_name: str
    description: str
    rules: list[dict]
    forbidden_in_doc: list[dict] = field(default_factory=list)


def load_frameworks() -> dict[str, FrameworkSpec]:
    specs: dict[str, FrameworkSpec] = {}
    for path in sorted(RULES_DIR.glob("*.yaml")):
        with path.open() as fh:
            data = yaml.safe_load(fh)
        spec = FrameworkSpec(
            framework=data["framework"],
            display_name=data.get("display_name", data["framework"]),
            description=data.get("description", ""),
            rules=data.get("rules", []),
            forbidden_in_doc=data.get("forbidden_in_doc", []) or [],
        )
        specs[spec.framework] = spec
    return specs


def _phrase_present(text_lower: str, phrase: str) -> str | None:
    pattern = re.compile(r"\b" + re.escape(phrase.lower()) + r"\b")
    match = pattern.search(text_lower)
    if not match:
        return None
    start = max(0, match.start() - 60)
    end = min(len(text_lower), match.end() + 60)
    return text_lower[start:end]


def _evaluate_rule(rule: dict, text: str, text_lower: str) -> Finding:
    framework = rule.get("framework", "")
    if "requires_all" in rule:
        groups = rule["requires_all"]
        evidences: list[str] = []
        for group in groups:
            options = group.get("any", [])
            hit_excerpt = None
            for phrase in options:
                excerpt = _phrase_present(text_lower, phrase)
                if excerpt:
                    hit_excerpt = excerpt
                    break
            if hit_excerpt is None:
                return Finding(
                    framework=framework,
                    rule_id=rule["id"],
                    title=rule["title"],
                    severity=rule["severity"],
                    status="missing",
                    citation=rule.get("citation", ""),
                    remediation=rule.get("remediation", ""),
                    evidence=f"None of: {', '.join(options[:5])}",
                )
            evidences.append(hit_excerpt)
        return Finding(
            framework=framework,
            rule_id=rule["id"],
            title=rule["title"],
            severity=rule["severity"],
            status="present",
            citation=rule.get("citation", ""),
            remediation="",
            evidence=" | ".join(evidences[:2]),
        )

    options = rule.get("requires_any", [])
    for phrase in options:
        excerpt = _phrase_present(text_lower, phrase)
        if excerpt:
            return Finding(
                framework=framework,
                rule_id=rule["id"],
                title=rule["title"],
                severity=rule["severity"],
                status="present",
                citation=rule.get("citation", ""),
                evidence=excerpt,
            )
    return Finding(
        framework=framework,
        rule_id=rule["id"],
        title=rule["title"],
        severity=rule["severity"],
        status="missing",
        citation=rule.get("citation", ""),
        remediation=rule.get("remediation", ""),
        evidence=f"None of: {', '.join(options[:5])}",
    )


def evaluate_framework(spec: FrameworkSpec, text: str, pii_hits: list[PIIHit]) -> list[Finding]:
    text_lower = text.lower()
    findings: list[Finding] = []

    for rule in spec.rules:
        rule_with_fw = {**rule, "framework": spec.framework}
        findings.append(_evaluate_rule(rule_with_fw, text, text_lower))

    for forbidden in spec.forbidden_in_doc:
        kinds = set(forbidden.get("pii_kinds", []))
        relevant = [h for h in pii_hits if h.kind in kinds]
        if relevant:
            sample = relevant[0]
            findings.append(
                Finding(
                    framework=spec.framework,
                    rule_id=forbidden["id"],
                    title=forbidden["title"],
                    severity=forbidden["severity"],
                    status="violation",
                    remediation=forbidden.get("remediation", ""),
                    evidence=f"{sample.kind} found ({len(relevant)}): …{sample.context.strip()}…",
                )
            )
    return findings


def evaluate_all(text: str, frameworks: list[str]) -> tuple[list[Finding], list[PIIHit]]:
    specs = load_frameworks()
    pii_hits = detect_pii(text)
    findings: list[Finding] = []
    for fw in frameworks:
        spec = specs.get(fw)
        if not spec:
            continue
        findings.extend(evaluate_framework(spec, text, pii_hits))
    return findings, pii_hits
