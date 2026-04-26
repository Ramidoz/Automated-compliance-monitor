"""Agent loop tests with a fake Anthropic client.

We mock ``anthropic.Anthropic`` so the loop runs deterministically without an
API key. This proves the orchestration: tools dispatch, results feed back into
messages, and ``finalize`` ends the loop.
"""

from __future__ import annotations

import os
from dataclasses import dataclass, field
from typing import Any

import pytest

os.environ["USE_CLAUDE"] = "true"
os.environ["ANTHROPIC_API_KEY"] = "test-key"

from app.config import get_settings  # noqa: E402
from app.core import agent as agent_mod  # noqa: E402
from app.core.rules import Finding, load_frameworks  # noqa: E402

# Reset cached settings so the test env vars take effect.
get_settings.cache_clear()  # type: ignore[attr-defined]


# ---------------------------------------------------------------------------
# Fakes
# ---------------------------------------------------------------------------

@dataclass
class _FakeBlock:
    type: str
    text: str = ""
    id: str = ""
    name: str = ""
    input: dict = field(default_factory=dict)
    thinking: str = ""


@dataclass
class _FakeUsage:
    input_tokens: int = 100
    output_tokens: int = 50
    cache_read_input_tokens: int = 0


@dataclass
class _FakeResponse:
    content: list[_FakeBlock]
    stop_reason: str = "end_turn"
    usage: _FakeUsage = field(default_factory=_FakeUsage)


class _FakeMessages:
    def __init__(self, scripted_responses: list[_FakeResponse]):
        self._scripted = scripted_responses
        self.calls: list[dict] = []

    def create(self, **kwargs):
        self.calls.append(kwargs)
        if not self._scripted:
            raise AssertionError("Agent made more API calls than scripted")
        return self._scripted.pop(0)


class _FakeClient:
    def __init__(self, scripted: list[_FakeResponse]):
        self.messages = _FakeMessages(scripted)


# ---------------------------------------------------------------------------
# Tests
# ---------------------------------------------------------------------------

@pytest.fixture
def specs():
    return list(load_frameworks().values())


def test_agent_runs_full_loop(monkeypatch, specs):
    """Two-turn loop: model calls a tool, gets the result, then finalizes."""

    scripted = [
        _FakeResponse(
            content=[
                _FakeBlock(type="text", text="Let me search the document for breach notification."),
                _FakeBlock(
                    type="tool_use",
                    id="tu_1",
                    name="search_document",
                    input={"query": "breach"},
                ),
            ],
            stop_reason="tool_use",
        ),
        _FakeResponse(
            content=[
                _FakeBlock(
                    type="tool_use",
                    id="tu_2",
                    name="report_finding",
                    input={
                        "framework": "GDPR",
                        "rule_id": "AI-GDPR-001",
                        "title": "Vague breach response timeline",
                        "severity": "high",
                        "status": "weak",
                        "evidence": "We will notify affected individuals as soon as practicable.",
                        "remediation": "Commit to notifying the supervisory authority within 72 hours.",
                        "citation": "GDPR Art. 33",
                    },
                ),
                _FakeBlock(
                    type="tool_use",
                    id="tu_3",
                    name="finalize",
                    input={"summary": "One semantic gap found around breach timing."},
                ),
            ],
            stop_reason="tool_use",
        ),
    ]
    fake_client = _FakeClient(scripted)
    monkeypatch.setattr(agent_mod.anthropic, "Anthropic", lambda **_: fake_client)

    rule_findings: list[Finding] = []
    report = agent_mod.run_agent(
        "We will notify affected individuals as soon as practicable.",
        specs,
        rule_findings,
    )

    assert report.iterations == 2
    assert report.summary.startswith("One semantic gap")
    assert len(report.findings) == 1
    f = report.findings[0]
    assert f.framework == "GDPR"
    assert f.source == "claude"
    assert f.severity == "high"

    # Transcript should include text + tool_use + tool_result steps.
    kinds = [s.kind for s in report.transcript]
    assert "text" in kinds
    assert "tool_use" in kinds
    assert "tool_result" in kinds


def test_agent_caps_iterations(monkeypatch, specs):
    """If the model never finalizes, the loop stops at MAX_ITERATIONS."""

    looping = _FakeResponse(
        content=[
            _FakeBlock(
                type="tool_use",
                id="tu_loop",
                name="search_document",
                input={"query": "x"},
            )
        ],
        stop_reason="tool_use",
    )
    # Provide enough copies to exhaust the cap; deepcopy not needed because
    # FakeMessages.create pops a fresh object each call.
    scripted = [
        _FakeResponse(content=[_FakeBlock(**looping.content[0].__dict__)])
        for _ in range(agent_mod.MAX_ITERATIONS + 2)
    ]
    fake_client = _FakeClient(scripted)
    monkeypatch.setattr(agent_mod.anthropic, "Anthropic", lambda **_: fake_client)

    report = agent_mod.run_agent("doc", specs, [])
    assert report.iterations == agent_mod.MAX_ITERATIONS
    assert report.findings == []


def test_agent_disabled_when_use_claude_false(monkeypatch, specs):
    monkeypatch.setenv("USE_CLAUDE", "false")
    get_settings.cache_clear()  # type: ignore[attr-defined]

    report = agent_mod.run_agent("doc", specs, [])
    assert report.findings == []
    assert "disabled" in report.summary.lower()


def test_search_document_tool_returns_match():
    from app.core.agent_tools import ToolContext, _search_document

    ctx = ToolContext(document="Hello world. The policy says we encrypt at rest.", specs={})
    out = _search_document(ctx, "encrypt")
    assert len(out["matches"]) == 1
    assert "encrypt at rest" in out["matches"][0]["context"]


def test_report_finding_accumulates():
    from app.core.agent_tools import ToolContext, _report_finding

    ctx = ToolContext(document="", specs={})
    _report_finding(
        ctx,
        framework="HIPAA",
        rule_id="AI-HIPAA-001",
        title="t",
        severity="medium",
        status="weak",
        evidence="ev",
        remediation="r",
    )
    assert len(ctx.accumulated) == 1
    assert ctx.accumulated[0].source == "claude"
