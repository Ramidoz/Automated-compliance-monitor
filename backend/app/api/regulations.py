from __future__ import annotations

from fastapi import APIRouter

from ..core.rules import load_frameworks

router = APIRouter()


@router.get("/regulations")
def list_regulations():
    specs = load_frameworks()
    return [
        {
            "framework": spec.framework,
            "display_name": spec.display_name,
            "description": spec.description,
            "rule_count": len(spec.rules),
        }
        for spec in specs.values()
    ]
