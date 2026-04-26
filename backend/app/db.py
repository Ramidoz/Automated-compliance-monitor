from datetime import datetime
from typing import AsyncIterator

from sqlalchemy import JSON, DateTime, Float, Integer, String, Text, text
from sqlalchemy.exc import OperationalError
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column

from .config import get_settings


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


_engine = create_async_engine(get_settings().database_url, future=True)
SessionLocal = async_sessionmaker(_engine, expire_on_commit=False, class_=AsyncSession)


async def init_db() -> None:
    async with _engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
        # Idempotent migration: add policy_name to pre-existing tables.
        # SQLite has no ADD COLUMN IF NOT EXISTS, so we catch the duplicate-column error.
        try:
            await conn.execute(text("ALTER TABLE scans ADD COLUMN policy_name VARCHAR(256) DEFAULT ''"))
        except OperationalError:
            pass


async def get_session() -> AsyncIterator[AsyncSession]:
    async with SessionLocal() as session:
        yield session
