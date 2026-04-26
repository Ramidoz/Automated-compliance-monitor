from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from ..db import Scan, get_session

router = APIRouter()


@router.get("/scans")
async def list_scans(session: AsyncSession = Depends(get_session)):
    rows = (
        await session.execute(select(Scan).order_by(Scan.created_at.desc()).limit(50))
    ).scalars().all()
    return [
        {
            "id": r.id,
            "created_at": r.created_at.isoformat(),
            "filename": r.filename,
            "frameworks": r.frameworks,
            "risk_score": r.risk_score,
            "risk_label": r.risk_label,
            "finding_count": len(r.findings or []),
        }
        for r in rows
    ]


@router.get("/scans/{scan_id}")
async def get_scan(scan_id: int, session: AsyncSession = Depends(get_session)):
    row = (await session.execute(select(Scan).where(Scan.id == scan_id))).scalar_one_or_none()
    if row is None:
        raise HTTPException(404, "Scan not found")
    return {
        "id": row.id,
        "created_at": row.created_at.isoformat(),
        "filename": row.filename,
        "frameworks": row.frameworks,
        "risk_score": row.risk_score,
        "risk_label": row.risk_label,
        "summary": row.summary,
        "findings": row.findings,
        "document_excerpt": row.document_excerpt,
    }
