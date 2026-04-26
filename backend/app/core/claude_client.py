"""Claude API integration for semantic compliance gap analysis.

Default: Sonnet 4.6, no extended thinking, prompt caching on the framework
requirement blocks. Thinking is opt-in via USE_THINKING=true for deeper analysis
at the cost of latency.

- Prompt caching cuts ~90% of input tokens on repeat scans (rules are stable).
- A single ``report_findings`` tool forces structured JSON output.
"""

from __future__ import annotations

import logging
from dataclasses import dataclass
from typing import Any

import anthropic

from ..config import get_settings
from .rules import Finding, FrameworkSpec

logger = logging.getLogger(__name__)

MAX_DOCUMENT_CHARS = 60_000
MAX_OUTPUT_TOKENS = 4_096


REPORT_TOOL = {
    "name": "report_findings",
    "description": "Report semantic compliance gaps that are not captured by simple keyword rules.",
    "input_schema": {
        "type": "object",
        "properties": {
            "summary": {
                "type": "string",
                "description": "2-3 sentence executive summary of the document's overall posture across the requested frameworks.",
            },
            "findings": {
                "type": "array",
                "description": "Per-framework semantic findings. Use these to flag weak, ambiguous, or contradictory clauses that keyword rules cannot detect.",
                "items": {
                    "type": "object",
                    "properties": {
                        "framework": {"type": "string", "enum": ["HIPAA", "GDPR", "PCI_DSS", "SOC2"]},
                        "title": {"type": "string", "description": "Short title of the gap, e.g. 'Vague consent withdrawal mechanism'."},
                        "severity": {"type": "string", "enum": ["critical", "high", "medium", "low"]},
                        "status": {"type": "string", "enum": ["weak", "missing", "contradiction", "violation"]},
                        "evidence": {"type": "string", "description": "Direct quote (<=240 chars) from the document or 'not addressed'."},
                        "remediation": {"type": "string", "description": "Concrete one-sentence fix."},
                        "citation": {"type": "string", "description": "Specific clause/article cited, e.g. 'GDPR Art. 7(3)'."},
                    },
                    "required": ["framework", "title", "severity", "status", "evidence", "remediation"],
                },
            },
        },
        "required": ["summary", "findings"],
    },
}


@dataclass
class SemanticReport:
    summary: str
    findings: list[Finding]
    used_cache: bool = False
    input_tokens: int = 0
    output_tokens: int = 0
    cached_tokens: int = 0


def _framework_block(spec: FrameworkSpec) -> str:
    lines = [f"## {spec.display_name} ({spec.framework})", spec.description, "", "Key requirements:"]
    for rule in spec.rules:
        lines.append(f"- [{rule['id']} | {rule['severity']}] {rule['title']} — {rule.get('citation', '')}")
        if rule.get("remediation"):
            lines.append(f"    Why it matters: {rule['remediation']}")
    return "\n".join(lines)


def _build_system_blocks(specs: list[FrameworkSpec]) -> list[dict[str, Any]]:
    instructions = (
        "You are a senior compliance auditor reviewing a policy document on behalf of a small business. "
        "Your job is to find SEMANTIC gaps — weak, ambiguous, or contradictory clauses, vague commitments, "
        "missing operational detail, and obligations that are stated but not actually implemented in text. "
        "A separate keyword-rules engine has already checked for the presence of required phrases; "
        "DO NOT re-report findings that boil down to 'the phrase X is missing'. "
        "Focus on substance: would a regulator accept this clause as adequate?\n\n"
        "Always call the report_findings tool exactly once with your complete analysis. "
        "Be specific in evidence quotes. Limit to the most important 3-8 semantic findings per framework."
    )
    blocks: list[dict[str, Any]] = [{"type": "text", "text": instructions}]
    for spec in specs:
        blocks.append({"type": "text", "text": _framework_block(spec)})
    if blocks:
        blocks[-1]["cache_control"] = {"type": "ephemeral"}
    return blocks


def _build_user_text(text: str, rule_findings: list[Finding]) -> str:
    excerpt = text[:MAX_DOCUMENT_CHARS]
    truncated_note = "" if len(text) <= MAX_DOCUMENT_CHARS else f"\n\n[document truncated from {len(text)} to {MAX_DOCUMENT_CHARS} chars]"
    rule_summary_lines = []
    for f in rule_findings:
        if f.status in {"missing", "violation"}:
            rule_summary_lines.append(f"- {f.framework} {f.rule_id} ({f.severity}/{f.status}): {f.title}")
    rule_summary = "\n".join(rule_summary_lines) or "(none)"
    return (
        "<rule_findings_already_detected>\n"
        f"{rule_summary}\n"
        "</rule_findings_already_detected>\n\n"
        "<policy_document>\n"
        f"{excerpt}{truncated_note}\n"
        "</policy_document>\n\n"
        "Now analyze. Call report_findings with semantic gaps that go BEYOND the keyword findings above."
    )


def analyze(text: str, specs: list[FrameworkSpec], rule_findings: list[Finding]) -> SemanticReport:
    settings = get_settings()
    if not settings.use_claude or not settings.anthropic_api_key:
        logger.info("Claude analysis disabled or API key missing; returning empty semantic report.")
        return SemanticReport(summary="(Semantic analysis disabled.)", findings=[])

    client = anthropic.Anthropic(api_key=settings.anthropic_api_key)
    system_blocks = _build_system_blocks(specs)
    user_text = _build_user_text(text, rule_findings)

    request_kwargs: dict[str, Any] = {
        "model": settings.anthropic_model,
        "max_tokens": MAX_OUTPUT_TOKENS,
        "system": system_blocks,
        "tools": [REPORT_TOOL],
        "tool_choice": {"type": "tool", "name": "report_findings"},
        "messages": [{"role": "user", "content": user_text}],
    }
    if settings.use_thinking:
        request_kwargs["max_tokens"] = MAX_OUTPUT_TOKENS + settings.thinking_budget_tokens
        request_kwargs["thinking"] = {
            "type": "enabled",
            "budget_tokens": settings.thinking_budget_tokens,
        }
        request_kwargs.pop("tool_choice", None)

    try:
        response = client.messages.create(**request_kwargs)
    except anthropic.APIError as e:
        logger.exception("Claude API error: %s", e)
        return SemanticReport(summary=f"(Semantic analysis unavailable: {e.__class__.__name__})", findings=[])

    payload: dict[str, Any] | None = None
    for block in response.content:
        if block.type == "tool_use" and block.name == "report_findings":
            payload = block.input  # type: ignore[assignment]
            break
    if payload is None:
        return SemanticReport(summary="(Claude returned no structured output.)", findings=[])

    findings: list[Finding] = []
    for item in payload.get("findings", []):
        try:
            findings.append(
                Finding(
                    framework=item["framework"],
                    rule_id=f"AI-{item['framework']}-{len(findings) + 1:03d}",
                    title=item["title"],
                    severity=item.get("severity", "medium"),
                    status=item.get("status", "weak"),
                    citation=item.get("citation", ""),
                    remediation=item.get("remediation", ""),
                    evidence=item.get("evidence", "")[:400],
                    source="claude",
                )
            )
        except KeyError:
            continue

    usage = response.usage
    cached = getattr(usage, "cache_read_input_tokens", 0) or 0
    return SemanticReport(
        summary=payload.get("summary", ""),
        findings=findings,
        used_cache=cached > 0,
        input_tokens=usage.input_tokens,
        output_tokens=usage.output_tokens,
        cached_tokens=cached,
    )
