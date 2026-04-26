from __future__ import annotations

from pathlib import Path

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from sqlalchemy.ext.asyncio import AsyncSession

from ..core.parser import UnsupportedFileType, extract_text
from ..core.pipeline import run as run_pipeline
from ..core.rules import load_frameworks
from ..db import Scan, get_session

router = APIRouter()

MAX_UPLOAD_BYTES = 5 * 1024 * 1024


def _derive_policy_name(filename: str | None, override: str) -> str:
    if override.strip():
        return override.strip()[:256]
    if not filename:
        return "Untitled"
    return Path(filename).stem[:256] or "Untitled"


@router.post("/scan")
async def scan(
    file: UploadFile = File(...),
    frameworks: str = Form("HIPAA,GDPR,PCI_DSS,SOC2"),
    policy_name: str = Form(""),
    session: AsyncSession = Depends(get_session),
):
    data = await file.read()
    if len(data) > MAX_UPLOAD_BYTES:
        raise HTTPException(413, f"File exceeds {MAX_UPLOAD_BYTES // (1024 * 1024)}MB limit")
    if not data:
        raise HTTPException(400, "Empty file")

    try:
        text = extract_text(file.filename or "upload.txt", data)
    except UnsupportedFileType as e:
        raise HTTPException(415, str(e))

    if not text.strip():
        raise HTTPException(422, "Could not extract any text from the document")

    selected = [fw.strip() for fw in frameworks.split(",") if fw.strip()]
    available = load_frameworks()
    invalid = [fw for fw in selected if fw not in available]
    if invalid:
        raise HTTPException(400, f"Unknown framework(s): {invalid}. Available: {list(available)}")
    if not selected:
        raise HTTPException(400, "At least one framework must be selected")

    result = run_pipeline(text, selected)
    findings_payload = [f.to_dict() for f in result.findings]

    scan_row = Scan(
        filename=file.filename or "upload",
        policy_name=_derive_policy_name(file.filename, policy_name),
        frameworks=selected,
        risk_score=result.risk_score,
        risk_label=result.risk_label,
        summary=result.summary,
        findings=findings_payload,
        document_excerpt=text[:4000],
    )
    session.add(scan_row)
    await session.commit()
    await session.refresh(scan_row)

    return {
        "id": scan_row.id,
        "created_at": scan_row.created_at.isoformat(),
        "filename": scan_row.filename,
        "policy_name": scan_row.policy_name,
        "frameworks": scan_row.frameworks,
        "risk_score": result.risk_score,
        "risk_label": result.risk_label,
        "summary": result.summary,
        "findings": findings_payload,
        "used_claude": result.used_claude,
        "cache_hit": result.cache_hit,
        "document_excerpt": scan_row.document_excerpt,
    }
