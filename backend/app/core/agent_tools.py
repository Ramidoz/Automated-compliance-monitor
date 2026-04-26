"""Agent tool definitions and dispatch.

The agent (in ``agent.py``) uses these tools to investigate a policy document:
search the regulation index, fetch full rule details, slice the document,
search the document for keywords, and report findings.

Each tool is a pure function over a small ``ToolContext``. The Anthropic
``input_schema`` dicts are kept inline so the wire schema and the Python
implementation stay in lockstep.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any, Callable

from .rules import FrameworkSpec, Finding


@dataclass
class ToolContext:
    document: str
    specs: dict[str, FrameworkSpec]
    rule_findings: list[Finding] = field(default_factory=list)
    accumulated: list[Finding] = field(default_factory=list)
    summary: str = ""
    finalized: bool = False


# ---------------------------------------------------------------------------
# Tool: search_regulation_index
# ---------------------------------------------------------------------------

SEARCH_REGULATION_INDEX = {
    "name": "search_regulation_index",
    "description": (
        "Search the loaded regulation rules by title, citation, or keyword. "
        "Returns up to 5 matching rule_ids with their titles, severities, and "
        "citations. Use this to discover which rules are relevant before "
        "calling get_rule_details."
    ),
    "input_schema": {
        "type": "object",
        "properties": {
            "framework": {"type": "string", "enum": ["HIPAA", "GDPR", "PCI_DSS", "SOC2"]},
            "query": {"type": "string", "description": "Free-text search term."},
        },
        "required": ["framework", "query"],
    },
}


def _search_regulation_index(ctx: ToolContext, framework: str, query: str) -> dict[str, Any]:
    spec = ctx.specs.get(framework)
    if not spec:
        return {"error": f"Unknown framework: {framework}"}
    q = query.lower()
    hits = []
    for rule in spec.rules:
        haystack = " ".join(
            [
                rule.get("title", ""),
                rule.get("citation", ""),
                rule.get("remediation", ""),
                " ".join(rule.get("requires_any", [])),
            ]
        ).lower()
        if q in haystack:
            hits.append(
                {
                    "rule_id": rule["id"],
                    "title": rule["title"],
                    "severity": rule["severity"],
                    "citation": rule.get("citation", ""),
                }
            )
        if len(hits) >= 5:
            break
    return {"framework": framework, "query": query, "matches": hits}


# ---------------------------------------------------------------------------
# Tool: get_rule_details
# ---------------------------------------------------------------------------

GET_RULE_DETAILS = {
    "name": "get_rule_details",
    "description": "Fetch the full details (title, severity, citation, remediation) of a specific rule.",
    "input_schema": {
        "type": "object",
        "properties": {
            "framework": {"type": "string", "enum": ["HIPAA", "GDPR", "PCI_DSS", "SOC2"]},
            "rule_id": {"type": "string"},
        },
        "required": ["framework", "rule_id"],
    },
}


def _get_rule_details(ctx: ToolContext, framework: str, rule_id: str) -> dict[str, Any]:
    spec = ctx.specs.get(framework)
    if not spec:
        return {"error": f"Unknown framework: {framework}"}
    for rule in spec.rules:
        if rule["id"] == rule_id:
            return {
                "rule_id": rule["id"],
                "title": rule["title"],
                "severity": rule["severity"],
                "citation": rule.get("citation", ""),
                "remediation": rule.get("remediation", ""),
                "requires_any": rule.get("requires_any", []),
                "requires_all": rule.get("requires_all", []),
            }
    return {"error": f"Unknown rule_id {rule_id} in {framework}"}


# ---------------------------------------------------------------------------
# Tool: search_document
# ---------------------------------------------------------------------------

SEARCH_DOCUMENT = {
    "name": "search_document",
    "description": (
        "Case-insensitive substring search across the policy document. "
        "Returns up to 5 matches, each with a 240-char window of context. "
        "Use this to verify a clause is present and read its surrounding text."
    ),
    "input_schema": {
        "type": "object",
        "properties": {"query": {"type": "string"}},
        "required": ["query"],
    },
}


def _search_document(ctx: ToolContext, query: str) -> dict[str, Any]:
    if not query:
        return {"matches": []}
    text_lower = ctx.document.lower()
    q = query.lower()
    matches = []
    start = 0
    while len(matches) < 5:
        idx = text_lower.find(q, start)
        if idx < 0:
            break
        ctx_start = max(0, idx - 100)
        ctx_end = min(len(ctx.document), idx + len(query) + 100)
        matches.append(
            {
                "offset": idx,
                "context": ctx.document[ctx_start:ctx_end].strip(),
            }
        )
        start = idx + len(query)
    return {"query": query, "matches": matches, "total_chars": len(ctx.document)}


# ---------------------------------------------------------------------------
# Tool: read_document_excerpt
# ---------------------------------------------------------------------------

READ_DOCUMENT_EXCERPT = {
    "name": "read_document_excerpt",
    "description": "Read a slice of the document by character offset. Maximum 2000 chars per call.",
    "input_schema": {
        "type": "object",
        "properties": {
            "start": {"type": "integer", "minimum": 0},
            "length": {"type": "integer", "minimum": 1, "maximum": 2000},
        },
        "required": ["start", "length"],
    },
}


def _read_document_excerpt(ctx: ToolContext, start: int, length: int) -> dict[str, Any]:
    end = min(len(ctx.document), start + min(length, 2000))
    start = max(0, min(start, len(ctx.document)))
    return {
        "start": start,
        "end": end,
        "total_chars": len(ctx.document),
        "text": ctx.document[start:end],
    }


# ---------------------------------------------------------------------------
# Tool: report_finding
# ---------------------------------------------------------------------------

REPORT_FINDING = {
    "name": "report_finding",
    "description": (
        "Record a SEMANTIC compliance gap. Do NOT use this for findings that "
        "the keyword rules engine has already detected (those were given to "
        "you in <rule_findings_already_detected>). Focus on weak, vague, "
        "ambiguous, or contradictory clauses that keyword rules cannot see."
    ),
    "input_schema": {
        "type": "object",
        "properties": {
            "framework": {"type": "string", "enum": ["HIPAA", "GDPR", "PCI_DSS", "SOC2"]},
            "rule_id": {
                "type": "string",
                "description": "Existing rule_id (e.g. GDPR-009) or AI-{framework}-{n} for novel gaps.",
            },
            "title": {"type": "string"},
            "severity": {"type": "string", "enum": ["critical", "high", "medium", "low"]},
            "status": {
                "type": "string",
                "enum": ["weak", "missing", "contradiction", "violation"],
                "description": "weak = present but inadequate; missing = absent; contradiction = conflicts with another clause; violation = data leak or explicit non-compliance.",
            },
            "evidence": {"type": "string", "description": "Direct quote (<=240 chars) from the document or 'not addressed'."},
            "remediation": {"type": "string", "description": "Concrete one-sentence fix."},
            "citation": {"type": "string", "description": "Specific clause/article cited."},
        },
        "required": ["framework", "rule_id", "title", "severity", "status", "evidence", "remediation"],
    },
}


def _report_finding(ctx: ToolContext, **kwargs: Any) -> dict[str, Any]:
    finding = Finding(
        framework=kwargs["framework"],
        rule_id=kwargs["rule_id"],
        title=kwargs["title"],
        severity=kwargs["severity"],
        status=kwargs["status"],
        citation=kwargs.get("citation", ""),
        remediation=kwargs.get("remediation", ""),
        evidence=kwargs.get("evidence", "")[:400],
        source="claude",
    )
    ctx.accumulated.append(finding)
    return {"recorded": True, "total_recorded": len(ctx.accumulated)}


# ---------------------------------------------------------------------------
# Tool: finalize
# ---------------------------------------------------------------------------

FINALIZE = {
    "name": "finalize",
    "description": "Signal that analysis is complete. Provide a 2-3 sentence executive summary.",
    "input_schema": {
        "type": "object",
        "properties": {"summary": {"type": "string"}},
        "required": ["summary"],
    },
}


def _finalize(ctx: ToolContext, summary: str) -> dict[str, Any]:
    ctx.summary = summary
    ctx.finalized = True
    return {"acknowledged": True}


# ---------------------------------------------------------------------------
# Registry
# ---------------------------------------------------------------------------

ALL_TOOLS: list[dict[str, Any]] = [
    SEARCH_REGULATION_INDEX,
    GET_RULE_DETAILS,
    SEARCH_DOCUMENT,
    READ_DOCUMENT_EXCERPT,
    REPORT_FINDING,
    FINALIZE,
]

DISPATCH: dict[str, Callable[..., dict[str, Any]]] = {
    "search_regulation_index": _search_regulation_index,
    "get_rule_details": _get_rule_details,
    "search_document": _search_document,
    "read_document_excerpt": _read_document_excerpt,
    "report_finding": _report_finding,
    "finalize": _finalize,
}


def dispatch(name: str, ctx: ToolContext, args: dict[str, Any]) -> dict[str, Any]:
    fn = DISPATCH.get(name)
    if fn is None:
        return {"error": f"Unknown tool: {name}"}
    try:
        return fn(ctx, **args)
    except TypeError as e:
        return {"error": f"Invalid arguments for {name}: {e}"}
