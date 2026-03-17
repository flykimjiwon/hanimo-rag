"""Admin and settings endpoints."""
from __future__ import annotations
from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field
from modolrag.api.auth import require_api_key
from modolrag.db import fetchrow, execute

router = APIRouter(tags=["admin"])


@router.get("/health", summary="Health check")
async def health():
    """Health check endpoint. No authentication required.
    
    Returns server status, version, and links to documentation.
    """
    from modolrag import __version__
    return {
        "status": "ok",
        "version": __version__,
        "docs": "/docs",
        "redoc": "/redoc",
        "dashboard": "/dashboard",
    }


class SettingsUpdate(BaseModel):
    chunk_size: int | None = Field(None, ge=128, le=4096, description="Text chunk size in characters")
    chunk_overlap: int | None = Field(None, ge=0, le=512, description="Overlap between consecutive chunks")
    embedding_model: str | None = Field(None, description="Embedding model name (e.g. nomic-embed-text)")
    embedding_dimensions: int | None = Field(None, description="Embedding vector dimensions")
    similarity_top_k: int | None = Field(None, ge=1, le=50, description="Default number of search results")
    similarity_threshold: float | None = Field(None, ge=0.0, le=1.0, description="Minimum similarity score to return")

    model_config = {"json_schema_extra": {"example": {"chunk_size": 512, "similarity_top_k": 10}}}


@router.get("/api/settings", summary="Get settings")
async def get_settings(_: str = Depends(require_api_key)):
    """Get current RAG engine settings including chunking, embedding, and search configuration."""
    row = await fetchrow("SELECT * FROM modolrag_settings LIMIT 1")
    return dict(row) if row else {}


@router.put("/api/settings", summary="Update settings")
async def update_settings(settings: SettingsUpdate, _: str = Depends(require_api_key)):
    """Update RAG engine settings. Only provided fields are updated; omitted fields remain unchanged."""
    updates = {k: v for k, v in settings.model_dump().items() if v is not None}
    if not updates:
        return {"updated": False}

    set_clauses = ", ".join(f"{k} = ${i+1}" for i, k in enumerate(updates.keys()))
    values = list(updates.values())

    await execute(
        f"UPDATE modolrag_settings SET {set_clauses}, updated_at = now()",
        *values
    )
    return {"updated": True, "fields": list(updates.keys())}
