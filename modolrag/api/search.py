"""Search endpoints."""
from __future__ import annotations
from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field
from modolrag.api.auth import require_api_key

router = APIRouter(prefix="/api", tags=["search"])


class SearchRequest(BaseModel):
    query: str = Field(..., description="Search query text", min_length=1)
    top_k: int = Field(10, ge=1, le=50, description="Number of results to return")
    mode: str = Field("hybrid", description="Search mode: vector, fts, graph, hybrid")
    namespace: str = Field("default", description="Graph namespace for graph-enhanced search")

    model_config = {"json_schema_extra": {"example": {"query": "How does authentication work?", "top_k": 5, "mode": "hybrid"}}}


class SearchResultItem(BaseModel):
    chunk_id: str
    document_id: str
    content: str
    score: float = Field(..., description="Relevance score (RRF score for hybrid, similarity for vector, rank for FTS)")
    match_type: str = Field(..., description="Source: vector, fts, graph, or hybrid")
    file_name: str


class SearchResponse(BaseModel):
    results: list[SearchResultItem]
    query: str
    mode: str
    count: int


@router.post("/search", response_model=SearchResponse, summary="Hybrid search")
async def search(req: SearchRequest, _: str = Depends(require_api_key)):
    """Execute search across your documents.
    
    **Modes:**
    - `hybrid` (default) — Vector + FTS + Graph combined with RRF fusion. Best quality.
    - `vector` — Semantic similarity search only (pgvector cosine distance)
    - `fts` — Keyword matching only (PostgreSQL tsvector with BM25-like ranking)
    - `graph` — Knowledge graph traversal only (entity similarity → 2-hop BFS expansion)
    """
    from modolrag.core.embedder import get_embedder
    from modolrag.core.hybrid_search import hybrid_search

    embedder = get_embedder()
    query_embedding = await embedder.embed(req.query)

    results = await hybrid_search(
        query_text=req.query,
        query_embedding=query_embedding,
        top_k=req.top_k,
        mode=req.mode,
        namespace=req.namespace,
    )

    return {
        "results": [
            {
                "chunk_id": r.chunk_id,
                "document_id": r.document_id,
                "content": r.content,
                "score": r.score,
                "match_type": r.match_type,
                "file_name": r.file_name,
            }
            for r in results
        ],
        "query": req.query,
        "mode": req.mode,
        "count": len(results),
    }
