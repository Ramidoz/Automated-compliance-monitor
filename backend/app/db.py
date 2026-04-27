import logging
from datetime import datetime
from pathlib import Path
from typing import AsyncIterator

from sqlalchemy import JSON, DateTime, Float, Integer, String, Text, func, select, text
from sqlalchemy.exc import OperationalError
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column

from .config import get_settings

logger = logging.getLogger(__name__)


class Base(DeclarativeBase):
    pass


class Scan(Base):
    __tablename__ = "scans"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, index=True)
    filename: Mapped[str] = mapped_column(String(512))
    policy_name: Mapped[str] = mapped_column(String(256), default="", index=True)
    frameworks: Mapped[list] = mapped_column(JSON)
    risk_score: Mapped[float] = mapped_column(Float)
    risk_label: Mapped[str] = mapped_column(String(32))
    summary: Mapped[str] = mapped_column(Text, default="")
    findings: Mapped[list] = mapped_column(JSON)
    document_excerpt: Mapped[str] = mapped_column(Text, default="")
    agent_transcript: Mapped[list] = mapped_column(JSON, default=list)
    agent_iterations: Mapped[int] = mapped_column(Integer, default=0)
    input_tokens: Mapped[int] = mapped_column(Integer, default=0)
    output_tokens: Mapped[int] = mapped_column(Integer, default=0)
    cached_tokens: Mapped[int] = mapped_column(Integer, default=0)


_engine = create_async_engine(get_settings().sqlalchemy_database_url, future=True)
SessionLocal = async_sessionmaker(_engine, expire_on_commit=False, class_=AsyncSession)


_MIGRATIONS = [
    # SQLite has no ADD COLUMN IF NOT EXISTS, so we catch the duplicate-column
    # OperationalError. This keeps existing demo databases usable across upgrades.
    "ALTER TABLE scans ADD COLUMN policy_name VARCHAR(256) DEFAULT ''",
    "ALTER TABLE scans ADD COLUMN agent_transcript JSON DEFAULT '[]'",
    "ALTER TABLE scans ADD COLUMN agent_iterations INTEGER DEFAULT 0",
    "ALTER TABLE scans ADD COLUMN input_tokens INTEGER DEFAULT 0",
    "ALTER TABLE scans ADD COLUMN output_tokens INTEGER DEFAULT 0",
    "ALTER TABLE scans ADD COLUMN cached_tokens INTEGER DEFAULT 0",
]


async def init_db() -> None:
    async with _engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
        if not get_settings().sqlalchemy_database_url.startswith("sqlite"):
            return
        for stmt in _MIGRATIONS:
            try:
                await conn.execute(text(stmt))
            except OperationalError:
                pass


async def get_session() -> AsyncIterator[AsyncSession]:
    async with SessionLocal() as session:
        yield session


_DEMO_FIXTURES = [
    ("clinic_policy_weak.txt", "Demo Policy"),
    ("saas_policy_strong.txt", "Demo Policy"),
]


async def seed_demo_data() -> None:
    """Idempotent demo seed. When DEMO_MODE=true, on first boot:
    parse each fixture, run the pipeline (rules + agent if enabled),
    and persist a Scan row. Skips if the table already has rows so
    repeated boots don't duplicate data.
    """
    # Lazy imports break a circular dependency: pipeline imports rules
    # which doesn't depend on db, but the agent imports config which
    # imports settings which is also imported here at module load.
    from .core.parser import extract_text
    from .core.pipeline import run as run_pipeline

    fixtures_dir = Path(__file__).resolve().parent.parent / "fixtures"
    if not fixtures_dir.exists():
        logger.warning("seed: fixtures directory not found at %s", fixtures_dir)
        return

    async with SessionLocal() as session:
        existing = (await session.execute(select(func.count(Scan.id)))).scalar_one()
        if existing > 0:
            logger.info("seed: %d scans already present, skipping", existing)
            return

        for filename, policy_name in _DEMO_FIXTURES:
            path = fixtures_dir / filename
            if not path.exists():
                logger.warning("seed: fixture %s missing", filename)
                continue
            doc_text = extract_text(filename, path.read_bytes())
            result = run_pipeline(doc_text, ["HIPAA", "GDPR", "PCI_DSS", "SOC2"])
            session.add(
                Scan(
                    filename=filename,
                    policy_name=policy_name,
                    frameworks=["HIPAA", "GDPR", "PCI_DSS", "SOC2"],
                    risk_score=result.risk_score,
                    risk_label=result.risk_label,
                    summary=result.summary,
                    findings=[f.to_dict() for f in result.findings],
                    document_excerpt=doc_text[:4000],
                    agent_transcript=result.transcript,
                    agent_iterations=result.iterations,
                    input_tokens=result.input_tokens,
                    output_tokens=result.output_tokens,
                    cached_tokens=result.cached_tokens,
                )
            )
        await session.commit()
        logger.info("seed: inserted %d demo scans", len(_DEMO_FIXTURES))
