# hanimo-webui Integration Guide

This guide explains how to connect hanimo-webui (Next.js AI chat platform) with hanimo-rag (RAG engine).

## Architecture

```
hanimo-webui (Next.js)              hanimo-rag (FastAPI)
┌─────────────────┐            ┌──────────────────┐
│ Chat UI         │            │ POST /api/ingest  │
│ Admin Panel     │──HTTP──→   │ POST /api/search  │
│ /v1/embeddings  │            │ GET  /api/graph   │
│ /v1/rerank      │            │ GET  /dashboard   │
└─────────────────┘            └──────────────────┘
        │                              │
        └──────── Same PostgreSQL ─────┘
          (hanimo-webui tables + hanimo-rag_ tables)
```

## Setup

### 1. Environment Variables (hanimo-webui side)

Add to hanimo-webui's `.env.local`:

```env
HANIMO_RAG_URL=http://localhost:8000
HANIMO_RAG_API_KEY=your-shared-api-key
```

### 2. Start hanimo-rag

```bash
# Same database as hanimo-webui
hanimo-rag serve --db $POSTGRES_URI

# Or with Docker (separate container, same network)
docker compose up -d
```

### 3. Configure hanimo-rag

```env
HANIMO_RAG_POSTGRES_URI=postgresql://user:pass@localhost:5432/hanimo-webui
HANIMO_RAG_API_KEYS=your-shared-api-key
HANIMO_RAG_EMBEDDING_PROVIDER=ollama
HANIMO_RAG_EMBEDDING_MODEL=nomic-embed-text
```

## Integration Pattern

### RAG-enhanced Chat Completion

In hanimo-webui's completions API handler, add RAG context before sending to LLM:

```javascript
// In hanimo-webui: app/api/v1/chat/completions/route.js
async function enhanceWithRAG(userMessage) {
  const response = await fetch(`${process.env.HANIMO_RAG_URL}/api/search`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': process.env.HANIMO_RAG_API_KEY,
    },
    body: JSON.stringify({
      query: userMessage,
      top_k: 5,
      mode: 'hybrid',
    }),
  });
  
  const { results } = await response.json();
  
  if (results.length === 0) return null;
  
  return results.map(r => r.content).join('\n\n---\n\n');
}
```

### Document Upload from hanimo-webui Admin

```javascript
async function uploadToRAG(file) {
  const formData = new FormData();
  formData.append('file', file);
  
  const response = await fetch(`${process.env.HANIMO_RAG_URL}/api/ingest`, {
    method: 'POST',
    headers: { 'X-API-Key': process.env.HANIMO_RAG_API_KEY },
    body: formData,
  });
  
  return response.json(); // { document_id, status }
}
```

## Docker Network Configuration

When running both services in Docker:

```yaml
# docker-compose.yml (hanimo-webui + hanimo-rag)
services:
  hanimo-webui:
    image: hanimo-webui:latest
    environment:
      HANIMO_RAG_URL: http://hanimo-rag:8000
      HANIMO_RAG_API_KEY: shared-key
    depends_on:
      - hanimo-rag

  hanimo-rag:
    build: ./hanimo-rag
    environment:
      HANIMO_RAG_POSTGRES_URI: postgresql://user:pass@postgres:5432/hanimo-webui
      HANIMO_RAG_API_KEYS: shared-key

  postgres:
    image: pgvector/pgvector:pg15
    # Shared by both services
```

## Reusing hanimo-webui's Embedding Endpoint

hanimo-rag can use hanimo-webui's existing `/v1/embeddings` endpoint instead of calling Ollama/OpenAI directly:

```env
# Point hanimo-rag's Ollama URL to hanimo-webui's API
HANIMO_RAG_OLLAMA_BASE_URL=http://hanimo-webui:3000/v1
```

This reuses hanimo-webui's model server routing and load balancing.

## Migration from Existing RAG Tables

If hanimo-webui already has `rag_documents`, `rag_models`, `rag_settings` tables:

1. **Phase 1 — Coexistence**: hanimo-rag uses `hanimo-rag_*` tables alongside existing `rag_*` tables. No migration needed.
2. **Phase 2 — Migration**: Use `hanimo-rag migrate --from-hanimo-webui` to transfer documents. Re-embedding is required (vector format differs).
3. **Phase 3 — Native**: hanimo-webui calls hanimo-rag API directly for all RAG operations.

## Troubleshooting

| Issue | Cause | Solution |
|---|---|---|
| Connection refused | hanimo-rag not running | Check `curl http://localhost:8000/health` |
| 401 Unauthorized | API key mismatch | Ensure same key in both `HANIMO_RAG_API_KEY` and `HANIMO_RAG_API_KEYS` |
| Empty search results | No documents ingested | Upload documents via `/api/ingest` first |
| Slow embedding | Ollama model not loaded | First request loads model; subsequent calls are fast |
| Timeout on large files | Default timeout too low | Increase `HANIMO_RAG_CHUNK_SIZE` or process smaller files |
