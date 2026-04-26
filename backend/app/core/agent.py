"""Compliance auditor agent.

A multi-turn tool-using agent built on the Anthropic Messages API.

The agent receives a policy document plus a list of findings the deterministic
keyword-rules engine already produced. It then iteratively calls tools
(``search_regulation_index``, ``search_document``, ``read_document_excerpt``,
``get_rule_details``, ``report_finding``, ``finalize``) to investigate
semantic gaps that keyword rules cannot see.

Every step (assistant text, tool call, tool result) is captured into a
transcript so the UI can render the agent's reasoning.

Prompt caching is applied to the framework-rules system block: the rules are
stable across runs, so cache hits cut input tokens by ~90%.

Defaults to Sonnet 4.6 with extended thinking off; flip ``USE_THINKING=true``
in the environment for deeper analysis at higher latency.
"""

from __future__ import annotations

import logging
from dataclasses import dataclass, field
from typing import Any

import anthropic

from ..config import get_settings
from .agent_tools import ALL_TOOLS, ToolContext, dispatch
from .rules import Finding, FrameworkSpec

logger = logging.getLogger(__name__)

MAX_DOCUMENT_CHARS = 60_000
MAX_OUTPUT_TOKENS = 4_096
MAX_ITERATIONS = 8


@dataclass
class TranscriptStep:
    iteration: int
    kind: str  # "thinking" | "text" | "tool_use" | "tool_result"
    content: dict[str, Any]

    def to_dict(self) -> dict[str, Any]:
        return self.__dict__.copy()


@dataclass
class AgentReport:
    summary: str
    findings: list[Finding]
    transcript: list[TranscriptStep] = field(default_factory=list)
    iterations: int = 0
    input_tokens: int = 0
    output_tokens: int = 0
    cached_tokens: int = 0
    used_claude: bool = False
    cache_hit: bool = False
    stop_reason: str = ""


def _framework_block(spec: FrameworkSpec) -> str:
    lines = [f"## {spec.display_name} ({spec.framework})", spec.description, "", "Rules in scope:"]
    for rule in spec.rules:
        lines.append(f"- {rule['id']} [{rule['severity']}] {rule['title']} — {rule.get('citation', '')}")
    return "\n".join(lines)


def _build_system(specs: list[FrameworkSpec]) -> list[dict[str, Any]]:
    instructions = (
        "You are a senior compliance auditor agent. You investigate a policy "
        "document for SEMANTIC compliance gaps using the tools provided.\n\n"
        "WORKFLOW:\n"
        "1. Skim <rule_findings_already_detected> below — those are the keyword "
        "   gaps already caught. Do NOT re-report them.\n"
        "2. Use search_document and read_document_excerpt to inspect the policy.\n"
        "3. Use search_regulation_index and get_rule_details when you need to "
        "   recall a specific requirement.\n"
        "4. Call report_finding for each SEMANTIC gap you discover (vague "
        "   language, contradictions, missing operational detail, requirements "
        "   that are stated but not implemented).\n"
        "5. When done, call finalize with a 2-3 sentence executive summary.\n\n"
        "QUALITY BAR: Be conservative — only report findings a regulator would "
        "actually flag. Quote the document directly in evidence. Cap at 8 "
        "findings total. Stop iterating once you've covered the document."
    )
    blocks: list[dict[str, Any]] = [{"type": "text", "text": instructions}]
    for spec in specs:
        blocks.append({"type": "text", "text": _framework_block(spec)})
    if blocks:
        blocks[-1]["cache_control"] = {"type": "ephemeral"}
    return blocks


def _build_initial_user(text: str, rule_findings: list[Finding]) -> str:
    excerpt = text[:MAX_DOCUMENT_CHARS]
    truncated = "" if len(text) <= MAX_DOCUMENT_CHARS else f"\n\n[document truncated from {len(text)} to {MAX_DOCUMENT_CHARS} chars]"
    rule_lines = [
        f"- {f.framework} {f.rule_id} ({f.severity}/{f.status}): {f.title}"
        for f in rule_findings
        if f.status in {"missing", "violation"}
    ]
    rule_summary = "\n".join(rule_lines) or "(none)"
    return (
        "<rule_findings_already_detected>\n"
        f"{rule_summary}\n"
        "</rule_findings_already_detected>\n\n"
        "<policy_document>\n"
        f"{excerpt}{truncated}\n"
        "</policy_document>\n\n"
        "Begin your investigation. Use the tools, then call finalize."
    )


def _block_to_dict(block: Any) -> dict[str, Any]:
    """Anthropic SDK objects don't serialize cleanly — flatten to plain dicts."""
    out = {"type": block.type}
    if block.type == "text":
        out["text"] = block.text
    elif block.type == "thinking":
        out["thinking"] = getattr(block, "thinking", "")
    elif block.type == "tool_use":
        out["id"] = block.id
        out["name"] = block.name
        out["input"] = block.input
    return out


def run_agent(text: str, specs: list[FrameworkSpec], rule_findings: list[Finding]) -> AgentReport:
    settings = get_settings()
    if not settings.use_claude or not settings.anthropic_api_key:
        logger.info("Claude disabled or API key missing; skipping agent.")
        return AgentReport(summary="(Agent disabled — set USE_CLAUDE=true and ANTHROPIC_API_KEY to enable.)", findings=[])

    client = anthropic.Anthropic(api_key=settings.anthropic_api_key)
    ctx = ToolContext(
        document=text[:MAX_DOCUMENT_CHARS],
        specs={s.framework: s for s in specs},
        rule_findings=rule_findings,
    )

    system_blocks = _build_system(specs)
    messages: list[dict[str, Any]] = [
        {"role": "user", "content": _build_initial_user(text, rule_findings)}
    ]
    transcript: list[TranscriptStep] = []
    total_input = total_output = total_cached = 0
    stop_reason = ""

    for iteration in range(1, MAX_ITERATIONS + 1):
        request_kwargs: dict[str, Any] = {
            "model": settings.anthropic_model,
            "max_tokens": MAX_OUTPUT_TOKENS,
            "system": system_blocks,
            "tools": ALL_TOOLS,
            "messages": messages,
        }
        if settings.use_thinking:
            request_kwargs["max_tokens"] = MAX_OUTPUT_TOKENS + settings.thinking_budget_tokens
            request_kwargs["thinking"] = {
                "type": "enabled",
                "budget_tokens": settings.thinking_budget_tokens,
            }

        try:
            response = client.messages.create(**request_kwargs)
        except anthropic.APIError as e:
            logger.exception("Claude API error during agent loop")
            return AgentReport(
                summary=f"(Agent error: {e.__class__.__name__})",
                findings=ctx.accumulated,
                transcript=transcript,
                iterations=iteration - 1,
                input_tokens=total_input,
                output_tokens=total_output,
                cached_tokens=total_cached,
                used_claude=True,
                stop_reason="error",
            )

        usage = response.usage
        total_input += usage.input_tokens
        total_output += usage.output_tokens
        total_cached += getattr(usage, "cache_read_input_tokens", 0) or 0
        stop_reason = response.stop_reason or ""

        # Capture every block in the assistant turn for the UI transcript.
        for block in response.content:
            if block.type == "text" and block.text.strip():
                transcript.append(TranscriptStep(iteration, "text", {"text": block.text}))
            elif block.type == "thinking":
                transcript.append(TranscriptStep(iteration, "thinking", {"thinking": getattr(block, "thinking", "")}))
            elif block.type == "tool_use":
                transcript.append(
                    TranscriptStep(
                        iteration,
                        "tool_use",
                        {"id": block.id, "name": block.name, "input": block.input},
                    )
                )

        # Append the assistant turn to the running message history.
        messages.append({"role": "assistant", "content": [_block_to_dict(b) for b in response.content]})

        # Find tool calls; if none, the model has stopped using tools.
        tool_uses = [b for b in response.content if b.type == "tool_use"]
        if not tool_uses:
            break

        # Execute each tool call, append a single user message with all tool_results.
        tool_results: list[dict[str, Any]] = []
        for tu in tool_uses:
            result = dispatch(tu.name, ctx, tu.input)
            transcript.append(
                TranscriptStep(iteration, "tool_result", {"tool_use_id": tu.id, "name": tu.name, "result": result})
            )
            tool_results.append(
                {
                    "type": "tool_result",
                    "tool_use_id": tu.id,
                    "content": _truncate_for_wire(result),
                }
            )
        messages.append({"role": "user", "content": tool_results})

        if ctx.finalized:
            break

    return AgentReport(
        summary=ctx.summary or "(Agent did not call finalize.)",
        findings=ctx.accumulated,
        transcript=transcript,
        iterations=iteration,
        input_tokens=total_input,
        output_tokens=total_output,
        cached_tokens=total_cached,
        used_claude=True,
        cache_hit=total_cached > 0,
        stop_reason=stop_reason,
    )


def _truncate_for_wire(result: dict[str, Any]) -> str:
    """Anthropic accepts string OR list-of-blocks for tool_result content. We
    serialize to a compact JSON string and cap length so a verbose tool can't
    blow the context window."""
    import json

    s = json.dumps(result, separators=(",", ":"))
    return s[:8000]
