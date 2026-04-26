from __future__ import annotations

import re
from dataclasses import dataclass

PII_PATTERNS: dict[str, re.Pattern[str]] = {
    "email": re.compile(r"\b[\w.+-]+@[\w-]+\.[\w.-]+\b"),
    "us_ssn": re.compile(r"\b(?!000|666|9\d{2})\d{3}[-\s]?(?!00)\d{2}[-\s]?(?!0000)\d{4}\b"),
    "credit_card": re.compile(r"\b(?:\d[ -]*?){13,19}\b"),
    "ipv4": re.compile(r"\b(?:\d{1,3}\.){3}\d{1,3}\b"),
    "phone_us": re.compile(r"\b(?:\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b"),
    "iban": re.compile(r"\b[A-Z]{2}\d{2}[A-Z0-9]{11,30}\b"),
    "date_of_birth": re.compile(r"\b(?:DOB|Date of Birth)[:\s-]+\d{1,4}[/-]\d{1,2}[/-]\d{1,4}\b", re.IGNORECASE),
}


@dataclass
class PIIHit:
    kind: str
    value: str
    context: str


def _luhn_ok(digits: str) -> bool:
    digits = re.sub(r"\D", "", digits)
    if not (13 <= len(digits) <= 19):
        return False
    total = 0
    parity = len(digits) % 2
    for i, d in enumerate(digits):
        n = int(d)
        if i % 2 == parity:
            n *= 2
            if n > 9:
                n -= 9
        total += n
    return total % 10 == 0


def detect_pii(text: str, max_per_kind: int = 5) -> list[PIIHit]:
    hits: list[PIIHit] = []
    for kind, pattern in PII_PATTERNS.items():
        seen: set[str] = set()
        for match in pattern.finditer(text):
            value = match.group(0)
            if kind == "credit_card" and not _luhn_ok(value):
                continue
            if value in seen:
                continue
            seen.add(value)
            start = max(0, match.start() - 40)
            end = min(len(text), match.end() + 40)
            hits.append(PIIHit(kind=kind, value=_redact(value, kind), context=text[start:end]))
            if len(seen) >= max_per_kind:
                break
    return hits


def _redact(value: str, kind: str) -> str:
    if kind == "email":
        local, _, domain = value.partition("@")
        return f"{local[:2]}***@{domain}"
    digits = re.sub(r"\D", "", value)
    if len(digits) <= 4:
        return "***"
    return "***" + digits[-4:]
