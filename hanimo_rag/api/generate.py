from __future__ import annotations

import json

from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field

from hanimo_rag.api.auth import require_api_key

router = APIRouter(prefix="/api", tags=["generate"])


class GenerateRequest(BaseModel):
    query: str = Field(..., min_length=1)
    mode: str = Field("hybrid")
    top_k: int = Field(5, ge=1, le=50)
    collection_id: str | None = None
    stream: bool = Field(True)
    use_hyde: bool = Field(False)


class GenerateResponse(BaseModel):
    answer: str
    sources: list[dict]
    query: str


SYSTEM_PROMPT = (
    "You are hanimo_rag assistant. Answer the user's question based ONLY on the provided context. "
    "If the context does not contain enough information to answer, clearly state that. "
    "Cite source filenames when referencing specific information. Be concise and accurate."
)


def _build_context(results) -> tuple[str, list[dict]]:
    parts = []
    sources = []
    for i, r in enumerate(results, 1):
        parts.append(f"[{i}] ({r.file_name or 'unknown'}) {r.content}")
        sources.append(
            {
                "index": i,
                "file_name": r.file_name,
                "content": r.content[:200],
                "score": r.score,
                "match_type": r.match_type,
            }
        )
    return "\n\n".join(parts), sources


async def _retrieve(query: str, mode: str, top_k: int, collection_id: str | None, use_hyde: bool):
    from hanimo_rag.core.embedder import get_embedder
    from hanimo_rag.core.hybrid_search import hybrid_search

    embedder = get_embedder()
    embed_text = query

    if use_hyde:
        from hanimo_rag.core.llm import get_llm
        from hanimo_rag.core.hyde import hyde_transform

        llm = get_llm()
        embed_text = await hyde_transform(query, llm)

    query_embedding = await embedder.embed(embed_text)

    doc_ids: list[str] | None = None
    if collection_id:
        from hanimo_rag.db import fetch as db_fetch

        rows = await db_fetch(
            "SELECT document_id FROM hanimo_rag_collection_documents WHERE collection_id = $1::uuid", collection_id
        )
        doc_ids = [str(r["document_id"]) for r in rows]
        if not doc_ids:
            return [], []

    results = await hybrid_search(
        query_text=query, query_embedding=query_embedding, top_k=top_k, mode=mode, document_ids=doc_ids
    )
    context, sources = _build_context(results)
    return context, sources


@router.post("/generate", summary="RAG generation with optional streaming")
async def generate(req: GenerateRequest, _: str = Depends(require_api_key)):
    context, sources = await _retrieve(req.query, req.mode, req.top_k, req.collection_id, req.use_hyde)

    from hanimo_rag.core.llm import get_llm

    llm = get_llm()

    prompt = (
        f"Context:\n{context}\n\nQuestion: {req.query}"
        if context
        else f"Question: {req.query}\n\n(No relevant context found.)"
    )

    if req.stream:

        async def event_stream():
            try:
                async for token in llm.generate_stream(prompt, system=SYSTEM_PROMPT):
                    yield f"data: {json.dumps({'token': token, 'done': False})}\n\n"
            except Exception as e:
                yield f"data: {json.dumps({'token': f'[Error: {e}]', 'done': False})}\n\n"
            yield f"data: {json.dumps({'token': '', 'done': True, 'sources': sources})}\n\n"

        return StreamingResponse(event_stream(), media_type="text/event-stream")

    answer = await llm.generate(prompt, system=SYSTEM_PROMPT)
    return {"answer": answer, "sources": sources, "query": req.query}
