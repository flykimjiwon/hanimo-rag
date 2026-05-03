"""Optional FastAPI server for HanimoRAG.

Install with: pip install hanimo_rag[server]
"""
from __future__ import annotations

from typing import Optional

try:
    from fastapi import FastAPI, HTTPException, UploadFile
    from pydantic import BaseModel
except ImportError as exc:
    raise ImportError(
        "FastAPI server requires fastapi and pydantic. "
        "Install with: pip install hanimo_rag[server]"
    ) from exc


class IndexRequest(BaseModel):
    path: str
    chunk_size: int = 512
    chunk_overlap: int = 50


class IndexTextRequest(BaseModel):
    text: str
    source: str = "manual"
    chunk_size: int = 512
    chunk_overlap: int = 50


class SearchRequest(BaseModel):
    query: str
    top_k: int = 5
    max_rounds: int = 3


class AskRequest(BaseModel):
    question: str
    top_k: int = 5


class DeleteRequest(BaseModel):
    source: str


def create_app(
    model: str = "qwen2.5:7b",
    store_path: str = "./hanimo_rag_data",
    store_type: str = "json",
    **llm_kwargs: object,
) -> FastAPI:
    """Create a FastAPI app with HanimoRAG endpoints."""
    from hanimo_rag import HanimoRAG

    app = FastAPI(
        title="HanimoRAG",
        description="Agentic LiteRAG — LLM-native retrieval API",
        version="2.0.0",
    )

    rag = HanimoRAG(model=model, store_path=store_path, store_type=store_type, **llm_kwargs)

    @app.post("/index")
    async def index_path(req: IndexRequest) -> dict:
        """Index a file or directory."""
        try:
            result = await rag.index(
                req.path,
                chunk_size=req.chunk_size,
                chunk_overlap=req.chunk_overlap,
            )
            return result
        except FileNotFoundError as exc:
            raise HTTPException(status_code=404, detail=str(exc)) from exc

    @app.post("/index/text")
    async def index_text(req: IndexTextRequest) -> dict:
        """Index raw text."""
        result = await rag.indexer.index_text(
            req.text,
            source=req.source,
            chunk_size=req.chunk_size,
            chunk_overlap=req.chunk_overlap,
        )
        return result

    @app.post("/search")
    async def search(req: SearchRequest) -> dict:
        """Agentic search."""
        results = await rag.search(
            req.query,
            top_k=req.top_k,
            max_rounds=req.max_rounds,
        )
        return {"results": results, "count": len(results)}

    @app.post("/ask")
    async def ask(req: AskRequest) -> dict:
        """RAG question answering."""
        answer = await rag.ask(req.question, top_k=req.top_k)
        return {"answer": answer}

    @app.get("/stats")
    async def stats() -> dict:
        """Index statistics."""
        return rag.store.get_stats()

    @app.delete("/source")
    async def delete_source(req: DeleteRequest) -> dict:
        """Delete all chunks from a source."""
        deleted = rag.store.delete_by_source(req.source)
        return {"deleted": deleted, "source": req.source}

    return app
