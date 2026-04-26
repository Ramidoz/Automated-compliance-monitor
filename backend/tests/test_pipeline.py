"""End-to-end smoke tests for the rules + scoring pipeline.

Claude analysis is disabled here (USE_CLAUDE=false) so tests are deterministic
and offline. We assert that the weak fixture flags many gaps and the strong
fixture passes the rules engine cleanly.
"""

from __future__ import annotations

import os
from pathlib import Path

os.environ.setdefault("USE_CLAUDE", "false")

from app.core.parser import extract_text
from app.core.pii import detect_pii
from app.core.rules import evaluate_all
from app.core.scoring import score

FIXTURES = Path(__file__).resolve().parent.parent / "fixtures"
ALL_FRAMEWORKS = ["HIPAA", "GDPR", "PCI_DSS", "SOC2"]


def _load(name: str) -> str:
    return extract_text(name, (FIXTURES / name).read_bytes())


def test_weak_clinic_policy_scores_high_risk():
    text = _load("clinic_policy_weak.txt")
    findings, _ = evaluate_all(text, ALL_FRAMEWORKS)
    risk, label = score(findings)
    assert risk >= 60, f"weak policy expected >=60 risk, got {risk}"
    assert label in {"high", "critical"}
    failed = [f for f in findings if f.status in {"missing", "violation"}]
    assert len(failed) >= 25, f"weak policy should flag many gaps, got {len(failed)}"


def test_strong_saas_policy_scores_low_risk():
    text = _load("saas_policy_strong.txt")
    findings, _ = evaluate_all(text, ALL_FRAMEWORKS)
    risk, label = score(findings)
    assert risk <= 20, f"strong policy expected <=20 risk, got {risk}"
    assert label in {"low", "moderate"}


def test_pii_detection_finds_ssn_in_weak_policy():
    text = _load("clinic_policy_weak.txt")
    hits = detect_pii(text)
    kinds = {h.kind for h in hits}
    assert "us_ssn" in kinds, "should detect the sample SSN"
    assert "email" in kinds


def test_pii_violation_promotes_finding():
    text = _load("clinic_policy_weak.txt")
    findings, _ = evaluate_all(text, ["HIPAA"])
    pii_violations = [f for f in findings if f.status == "violation"]
    assert pii_violations, "PHI in document should produce a violation finding"
    assert any(f.severity == "critical" for f in pii_violations)


def test_score_label_thresholds():
    from app.core.rules import Finding

    assert score([])[1] == "unknown"
    one_low_present = [Finding("HIPAA", "X", "t", "low", "present")]
    assert score(one_low_present) == (0.0, "low")
    one_high_missing = [Finding("HIPAA", "X", "t", "high", "missing")]
    assert score(one_high_missing) == (100.0, "critical")
