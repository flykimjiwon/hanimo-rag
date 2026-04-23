from __future__ import annotations

import json
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field

from hanimo_rag.api.auth import require_api_key
from hanimo_rag.db import execute, fetch, fetchrow

router = APIRouter(prefix="/api", tags=["apps"])


class AppCreate(BaseModel):
    name: str = Field(..., min_length=1)
    description: str = ""
    system_prompt: str = "You are a helpful assistant. Answer based on the provided context."
    llm_model: str = "llama3"
    temperature: float = 0.1
    max_tokens: int = 2048
    top_k: int = 5
    search_mode: str = "hybrid"
    collection_id: str | None = None
    document_ids: list[str] = Field(default_factory=list)


class AppUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    system_prompt: str | None = None
    llm_model: str | None = None
    temperature: float | None = None
    max_tokens: int | None = None
    top_k: int | None = None
    search_mode: str | None = None
    collection_id: str | None = None
    document_ids: list[str] | None = None
    is_active: bool | None = None


class ChatRequest(BaseModel):
    query: str = Field(..., min_length=1)
    stream: bool = True


@router.post("/apps", summary="Create an app")
async def create_app(req: AppCreate, _: str = Depends(require_api_key)):
    row = await fetchrow(
        """INSERT INTO hanimo_rag_apps (name, description, system_prompt, llm_model, temperature, max_tokens, top_k, search_mode, collection_id, document_ids)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9::uuid, $10::uuid[])
           RETURNING id, name, created_at""",
        req.name,
        req.description,
        req.system_prompt,
        req.llm_model,
        req.temperature,
        req.max_tokens,
        req.top_k,
        req.search_mode,
        req.collection_id,
        req.document_ids or [],
    )
    return {"id": str(row["id"]), "name": row["name"], "created_at": str(row["created_at"])}


@router.get("/apps", summary="List all apps")
async def list_apps(_: str = Depends(require_api_key)):
    rows = await fetch(
        "SELECT id, name, description, llm_model, is_active, created_at FROM hanimo_rag_apps ORDER BY created_at DESC"
    )
    return {
        "apps": [
            {
                "id": str(r["id"]),
                "name": r["name"],
                "description": r["description"],
                "llm_model": r["llm_model"],
                "is_active": r["is_active"],
                "created_at": str(r["created_at"]),
            }
            for r in rows
        ]
    }


@router.get("/apps/{app_id}", summary="Get app details")
async def get_app(app_id: str, _: str = Depends(require_api_key)):
    row = await fetchrow("SELECT * FROM hanimo_rag_apps WHERE id = $1::uuid", app_id)
    if not row:
        raise HTTPException(404, "App not found")
    return {k: (str(v) if isinstance(v, UUID) else v) for k, v in dict(row).items()}


@router.put("/apps/{app_id}", summary="Update app")
async def update_app(app_id: str, req: AppUpdate, _: str = Depends(require_api_key)):
    fields = {k: v for k, v in req.model_dump().items() if v is not None}
    if not fields:
        raise HTTPException(400, "No fields to update")

    sets = []
    vals = []
    for i, (k, v) in enumerate(fields.items(), 1):
        if k == "collection_id":
            sets.append(f"{k} = ${i}::uuid")
        elif k == "document_ids":
            sets.append(f"{k} = ${i}::uuid[]")
        else:
            sets.append(f"{k} = ${i}")
        vals.append(v)
    vals.append(app_id)
    await execute(
        f"UPDATE hanimo_rag_apps SET {', '.join(sets)}, updated_at = now() WHERE id = ${len(vals)}::uuid", *vals
    )
    return {"status": "updated"}


@router.delete("/apps/{app_id}", summary="Delete app")
async def delete_app(app_id: str, _: str = Depends(require_api_key)):
    await execute("DELETE FROM hanimo_rag_apps WHERE id = $1::uuid", app_id)
    return {"status": "deleted"}


@router.post("/apps/{app_id}/chat", summary="Chat with an app")
async def chat_app(app_id: str, req: ChatRequest, _: str = Depends(require_api_key)):
    row = await fetchrow("SELECT * FROM hanimo_rag_apps WHERE id = $1::uuid", app_id)
    if not row:
        raise HTTPException(404, "App not found")

    app = dict(row)

    from hanimo_rag.core.embedder import get_embedder
    from hanimo_rag.core.hybrid_search import hybrid_search
    from hanimo_rag.core.llm import get_llm

    embedder = get_embedder()
    query_embedding = await embedder.embed(req.query)

    doc_ids: list[str] | None = None
    if app.get("collection_id"):
        rows = await fetch(
            "SELECT document_id FROM hanimo_rag_collection_documents WHERE collection_id = $1::uuid",
            str(app["collection_id"]),
        )
        doc_ids = [str(r["document_id"]) for r in rows]
    elif app.get("document_ids"):
        doc_ids = [str(d) for d in app["document_ids"] if d]

    results = await hybrid_search(
        query_text=req.query,
        query_embedding=query_embedding,
        top_k=app.get("top_k", 5),
        mode=app.get("search_mode", "hybrid"),
        document_ids=doc_ids,
    )

    context_parts = []
    sources = []
    for i, r in enumerate(results, 1):
        context_parts.append(f"[{i}] ({r.file_name or 'unknown'}) {r.content}")
        sources.append({"index": i, "file_name": r.file_name, "content": r.content[:200], "score": r.score})
    context = "\n\n".join(context_parts)

    llm = get_llm(
        provider=app.get("llm_model", "").split("/")[0] if "/" in app.get("llm_model", "") else None,
        model=app.get("llm_model", "llama3"),
        temperature=app.get("temperature", 0.1),
        max_tokens=app.get("max_tokens", 2048),
    )
    prompt = f"Context:\n{context}\n\nQuestion: {req.query}" if context else f"Question: {req.query}"
    system = app.get("system_prompt", "You are a helpful assistant.")

    if req.stream:

        async def event_stream():
            try:
                async for token in llm.generate_stream(prompt, system=system):
                    yield f"data: {json.dumps({'token': token, 'done': False})}\n\n"
            except Exception as e:
                yield f"data: {json.dumps({'token': f'[Error: {e}]', 'done': False})}\n\n"
            yield f"data: {json.dumps({'token': '', 'done': True, 'sources': sources})}\n\n"

        return StreamingResponse(event_stream(), media_type="text/event-stream")

    answer = await llm.generate(prompt, system=system)
    return {"answer": answer, "sources": sources, "query": req.query}
