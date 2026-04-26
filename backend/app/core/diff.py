"""Compare two scans of the same policy and classify each finding's change."""

from __future__ import annotations

from dataclasses import dataclass
from typing import Any

from .rules import SEVERITY_WEIGHT

FAILING_STATUSES = {"missing", "violation", "weak", "contradiction"}
PASSING_STATUSES = {"present"}


def _is_failing(finding: dict[str, Any]) -> bool:
    return finding.get("status") in FAILING_STATUSES


def _key(finding: dict[str, Any]) -> tuple[str, str]:
    return (finding.get("framework", ""), finding.get("rule_id", ""))


def _severity_rank(sev: str) -> int:
    """Higher = worse. Used to detect regressions/improvements."""
    order = {"low": 1, "medium": 2, "high": 3, "critical": 4}
    return order.get(sev, 0)


@dataclass
class DiffEntry:
    framework: str
    rule_id: str
    title: str
    change: str  # closed | opened | regressed | improved | still_failing | still_passing
    before: dict[str, Any] | None
    after: dict[str, Any] | None

    def to_dict(self) -> dict[str, Any]:
        return self.__dict__.copy()


def diff(before_findings: list[dict], after_findings: list[dict]) -> dict[str, Any]:
    by_key_before = {_key(f): f for f in before_findings}
    by_key_after = {_key(f): f for f in after_findings}
    all_keys = set(by_key_before) | set(by_key_after)

    entries: list[DiffEntry] = []
    for key in sorted(all_keys):
        b = by_key_before.get(key)
        a = by_key_after.get(key)

        # Rule existed only in one side (e.g. AI-discovered semantic finding
        # that didn't reappear, or a new framework was added between scans).
        if b is None and a is not None:
            change = "opened" if _is_failing(a) else "still_passing"
        elif a is None and b is not None:
            change = "closed" if _is_failing(b) else "still_passing"
        else:
            assert a is not None and b is not None
            b_fail = _is_failing(b)
            a_fail = _is_failing(a)
            if b_fail and not a_fail:
                change = "closed"
            elif not b_fail and a_fail:
                change = "opened"
            elif b_fail and a_fail:
                br, ar = _severity_rank(b["severity"]), _severity_rank(a["severity"])
                if ar > br:
                    change = "regressed"
                elif ar < br:
                    change = "improved"
                else:
                    change = "still_failing"
            else:
                change = "still_passing"

        ref = a or b
        entries.append(
            DiffEntry(
                framework=ref["framework"],
                rule_id=ref["rule_id"],
                title=ref["title"],
                change=change,
                before=b,
                after=a,
            )
        )

    counts = {
        c: sum(1 for e in entries if e.change == c)
        for c in ("closed", "opened", "regressed", "improved", "still_failing", "still_passing")
    }
    return {"entries": [e.to_dict() for e in entries], "counts": counts}
