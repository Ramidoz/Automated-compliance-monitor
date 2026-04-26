from __future__ import annotations

from .rules import SEVERITY_WEIGHT, Finding


def score(findings: list[Finding]) -> tuple[float, str]:
    """Return (risk_score in 0..100, label).

    Risk score = clamp(100 * weighted_failed / weighted_total, 0, 100).
    A failed finding is one with status in {missing, violation}.
    Forbidden-PII findings (status=violation) carry 1.5x weight.
    """
    if not findings:
        return 0.0, "unknown"

    weighted_total = 0.0
    weighted_failed = 0.0
    for f in findings:
        w = SEVERITY_WEIGHT.get(f.severity, 1.0)
        if f.status == "violation":
            w *= 1.5
        weighted_total += w
        if f.status in {"missing", "violation"}:
            weighted_failed += w

    if weighted_total == 0:
        return 0.0, "unknown"

    raw = 100.0 * weighted_failed / weighted_total
    raw = max(0.0, min(100.0, raw))
    return round(raw, 1), _label(raw)


def _label(score: float) -> str:
    if score < 15:
        return "low"
    if score < 35:
        return "moderate"
    if score < 60:
        return "high"
    return "critical"
