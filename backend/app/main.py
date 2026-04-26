from __future__ import annotations

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .api import regulations, scan, scans
from .config import get_settings
from .db import init_db


@asynccontextmanager
async def lifespan(_: FastAPI):
    await init_db()
    yield


app = FastAPI(
    title="Automated Compliance Monitor",
    version="0.1.0",
    description="Scan policy documents for HIPAA, GDPR, PCI-DSS, and SOC 2 gaps.",
    lifespan=lifespan,
)

settings = get_settings()
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(scan.router, prefix="/api", tags=["scan"])
app.include_router(scans.router, prefix="/api", tags=["scans"])
app.include_router(regulations.router, prefix="/api", tags=["regulations"])


@app.get("/api/health")
def health():
    return {"status": "ok"}
