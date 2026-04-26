from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from ..core.diff import diff
from ..db import Scan, get_session

router = APIRouter()


def _row_to_summary(r: Scan) -> dict:
    return {
        "id": r.id,
        "created_at": r.created_at.isoformat(),
        "filename": r.filename,
        "policy_name": r.policy_name or "",
        "frameworks": r.frameworks,
        "risk_score": r.risk_score,
        "risk_label": r.risk_label,
        "finding_count": len(r.findings or []),
    }


def _row_to_detail(r: Scan) -> dict:
    return {
        "id": r.id,
        "created_at": r.created_at.isoformat(),
        "filename": r.filename,
        "policy_name": r.policy_name or "",
        "frameworks": r.frameworks,
        "risk_score": r.risk_score,
        "risk_label": r.risk_label,
        "summary": r.summary,
        "findings": r.findings,
        "document_excerpt": r.document_excerpt,
        "agent_transcript": r.agent_transcript or [],
        "agent_iterations": r.agent_iterations or 0,
        "input_tokens": r.input_tokens or 0,
        "output_tokens": r.output_tokens or 0,
        "cached_tokens": r.cached_tokens or 0,
    }


@router.get("/scans")
async def list_scans(
    policy_name: str | None = Query(None, description="Filter by policy_name (exact match)"),
    session: AsyncSession = Depends(get_session),
):
    stmt = select(Scan).order_by(Scan.created_at.desc()).limit(50)
    if policy_name is not None:
        stmt = stmt.where(Scan.policy_name == policy_name)
    rows = (await session.execute(stmt)).scalars().all()
    return [_row_to_summary(r) for r in rows]


@router.get("/scans/{scan_id}")
async def get_scan(scan_id: int, session: AsyncSession = Depends(get_session)):
    row = (await session.execute(select(Scan).where(Scan.id == scan_id))).scalar_one_or_none()
    if row is None:
        raise HTTPException(404, "Scan not found")
    return _row_to_detail(row)


@router.get("/scans/{scan_id}/versions")
async def list_versions(scan_id: int, session: AsyncSession = Depends(get_session)):
    """Other scans of the same policy (oldest first)."""
    row = (await session.execute(select(Scan).where(Scan.id == scan_id))).scalar_one_or_none()
    if row is None:
        raise HTTPException(404, "Scan not found")
    if not row.policy_name:
        return []
    rows = (
        await session.execute(
            select(Scan)
            .where(Scan.policy_name == row.policy_name, Scan.id != scan_id)
            .order_by(Scan.created_at.asc())
        )
    ).scalars().all()
    return [_row_to_summary(r) for r in rows]


@router.get("/scans/{scan_id}/compare/{other_id}")
async def compare_scans(
    scan_id: int, other_id: int, session: AsyncSession = Depends(get_session)
):
    """Diff two scans. ``scan_id`` is the AFTER, ``other_id`` is the BEFORE."""
    if scan_id == other_id:
        raise HTTPException(400, "Cannot compare a scan to itself")
    after = (await session.execute(select(Scan).where(Scan.id == scan_id))).scalar_one_or_none()
    before = (await session.execute(select(Scan).where(Scan.id == other_id))).scalar_one_or_none()
    if after is None or before is None:
        raise HTTPException(404, "Scan not found")

    diff_result = diff(before.findings or [], after.findings or [])
    return {
        "before": _row_to_summary(before),
        "after": _row_to_summary(after),
        "risk_score_delta": round(after.risk_score - before.risk_score, 1),
        **diff_result,
    }
