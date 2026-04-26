from __future__ import annotations

from app.core.diff import diff


def _f(rule_id: str, status: str, severity: str = "high", framework: str = "HIPAA"):
    return {
        "framework": framework,
        "rule_id": rule_id,
        "title": rule_id,
        "severity": severity,
        "status": status,
    }


def test_closed_when_failing_becomes_passing():
    before = [_f("HIPAA-001", "missing")]
    after = [_f("HIPAA-001", "present")]
    out = diff(before, after)
    assert out["counts"]["closed"] == 1
    assert out["counts"]["opened"] == 0


def test_opened_when_passing_becomes_failing():
    before = [_f("HIPAA-001", "present")]
    after = [_f("HIPAA-001", "missing")]
    out = diff(before, after)
    assert out["counts"]["opened"] == 1
    assert out["counts"]["closed"] == 0


def test_regressed_when_severity_increases():
    before = [_f("HIPAA-001", "missing", "medium")]
    after = [_f("HIPAA-001", "missing", "high")]
    out = diff(before, after)
    assert out["counts"]["regressed"] == 1


def test_improved_when_severity_decreases():
    before = [_f("HIPAA-001", "missing", "high")]
    after = [_f("HIPAA-001", "missing", "medium")]
    out = diff(before, after)
    assert out["counts"]["improved"] == 1


def test_still_failing_when_unchanged():
    before = [_f("HIPAA-001", "missing", "high")]
    after = [_f("HIPAA-001", "missing", "high")]
    out = diff(before, after)
    assert out["counts"]["still_failing"] == 1


def test_ai_finding_present_only_in_one_side():
    # Claude's semantic findings can vary between scans; ensure they're
    # classified sensibly when the rule_id appears only on one side.
    before = [_f("AI-GDPR-001", "weak", "medium", "GDPR")]
    after = []
    out = diff(before, after)
    assert out["counts"]["closed"] == 1


def test_full_mix():
    before = [
        _f("R1", "missing", "high"),       # -> closed
        _f("R2", "present"),                # -> opened
        _f("R3", "missing", "high"),       # -> still_failing
        _f("R4", "missing", "medium"),     # -> regressed
        _f("R5", "missing", "high"),       # -> improved
    ]
    after = [
        _f("R1", "present"),
        _f("R2", "missing", "critical"),
        _f("R3", "missing", "high"),
        _f("R4", "missing", "high"),
        _f("R5", "missing", "low"),
    ]
    counts = diff(before, after)["counts"]
    assert counts == {
        "closed": 1,
        "opened": 1,
        "still_failing": 1,
        "regressed": 1,
        "improved": 1,
        "still_passing": 0,
    }
