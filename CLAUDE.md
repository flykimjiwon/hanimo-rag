# ModolRAG - Project Guide

## Overview

ModolRAG is a **PostgreSQL-native hybrid RAG engine** — vector search, full-text search, and knowledge graph all run inside a single PostgreSQL instance. No Elasticsearch, no Pinecone, no Neo4j.

- **Version**: 0.1.0 (Alpha)
- **License**: MIT
- **Python**: 3.11+
- **Framework**: FastAPI + asyncpg + pgvector

## Architecture

```
modolrag/
├── __init__.py          # ModolRAG facade class (sync/async Python SDK)
├── main.py              # FastAPI app creation, router registration
├── cli.py               # CLI: serve, init-db, ingest, search, ask, quickstart, status
├── config.py            # Pydantic settings (MODOLRAG_* env vars)
│
├── api/                 # FastAPI route handlers
│   ├── admin.py         # GET /health, GET/PUT /api/settings
│   ├── auth.py          # X-API-Key middleware
│   ├── ingest.py        # POST /api/ingest, CRUD /api/documents
│   ├── search.py        # POST /api/search (hybrid/vector/fts/graph)
│   ├── generate.py      # POST /api/generate (RAG with streaming SSE)
│   ├── collections.py   # CRUD /api/collections + document assignment
│   ├── graph.py         # GET /api/graph, GET /api/graph/node/{id}
│   ├── apps.py          # CRUD /api/apps + POST /api/apps/{id}/chat
│   └── middleware.py    # CORS, logging
│
├── core/                # RAG engine algorithms
│   ├── pipeline.py      # Ingestion: parse → chunk → embed → store → extract → graph
│   ├── chunker.py       # RecursiveChunker (+ PageChunker, SemanticChunker)
│   ├── embedder.py      # OllamaEmbedder, OpenAIEmbedder (ABC)
│   ├── extractor.py     # LLM-based entity/relationship extraction
│   ├── hybrid_search.py # RRF fusion: vector + FTS + graph (k=60, weights 0.5/0.3/0.2)
│   ├── vector_store.py  # pgvector HNSW operations
│   ├── fts.py           # PostgreSQL tsvector BM25-like ranking
│   ├── graph_store.py   # Knowledge graph node/edge queries, 2-hop BFS
│   ├── hyde.py          # HyDE (Hypothetical Document Embeddings)
│   └── llm.py           # OllamaLLM, OpenAILLM adapters
│
├── db/
│   ├── connection.py    # asyncpg pool, init_schema(), fetch/execute helpers
│   └── schema.sql       # Full PostgreSQL schema (9 tables, pgvector + pg_trgm + ltree)
│
├── parsers/             # Document format parsers (ABC pattern)
│   ├── pdf.py, docx.py, xlsx.py, pptx.py, markdown.py, text.py
│   └── base.py          # ParserBase abstract class
│
└── static/              # Built React dashboard (mounted at /dashboard)

dashboard/               # React 19 + TypeScript + Vite + Tailwind CSS (SPA)
tests/                   # pytest + pytest-asyncio (177 tests across 5 modules)
```

## Database Schema (PostgreSQL)

9 tables, all prefixed `modolrag_`:

| Table | Purpose |
|-------|---------|
| `documents` | Document metadata, processing status |
| `document_chunks` | Text chunks + embeddings (halfvec(768)) + FTS (tsvector GENERATED) |
| `graph_nodes` | Knowledge graph entities (person/org/concept/location/event) |
| `graph_edges` | Relationships between nodes |
| `communities` | Hierarchical graph clustering (ltree) |
| `settings` | System-wide RAG configuration |
| `collections` | Named document groupings |
| `collection_documents` | Junction table: documents ↔ collections |
| `apps` | Custom LLM endpoint configurations |

Key indexes: HNSW on embeddings (cosine), GIN on tsvector, GIST on ltree paths.

Extensions: `vector`, `pg_trgm`, `ltree`

## API Endpoints (25+)

All under `/api` prefix, auth via `X-API-Key` header (disabled when `MODOLRAG_API_KEYS` is empty).

| Group | Endpoints |
|-------|-----------|
| **Admin** | `GET /health`, `GET/PUT /api/settings` |
| **Documents** | `POST /api/ingest`, `GET /api/documents`, `GET/DELETE /api/documents/{id}` |
| **Search** | `POST /api/search` (modes: hybrid, vector, fts, graph) |
| **Generate** | `POST /api/generate` (RAG with SSE streaming) |
| **Collections** | CRUD + `POST/DELETE /api/collections/{id}/documents` |
| **Graph** | `GET /api/graph`, `GET /api/graph/node/{id}` |
| **Apps** | CRUD + `POST /api/apps/{id}/chat` |

Interactive docs: `/docs` (Swagger), `/redoc` (ReDoc)

## Development

### Prerequisites

- Python 3.11+, Docker, Ollama (with `nomic-embed-text` model)

### Quick Setup

```bash
# Clone and install
pip install -e ".[dev]"

# Start infrastructure
docker compose up -d db          # PostgreSQL only
ollama serve                     # If not running
ollama pull nomic-embed-text

# Initialize DB and start server
modolrag init-db --db postgresql://modolrag:modolrag@localhost:5439/modolrag
modolrag serve --port 8009 --reload --db postgresql://modolrag:modolrag@localhost:5439/modolrag
```

Or use the all-in-one script: `./start.sh`

### Running Tests

```bash
pytest                           # 177 tests (all unit, no DB required)
pytest tests/test_chunker.py     # Chunker tests only
pytest -x -v                     # Stop on first failure, verbose
```

### Linting

```bash
ruff check modolrag/             # Lint check
ruff format modolrag/            # Auto-format
```

### Docker (Full Stack)

```bash
docker compose up --build        # Build + start (PostgreSQL + ModolRAG)
docker compose down              # Stop
docker compose logs -f modolrag  # Tail logs
```

### Ports

| Service | Port |
|---------|------|
| ModolRAG API + Dashboard | 8009 |
| PostgreSQL | 5439 |
| Ollama | 11434 (host) |

### Key Environment Variables

```bash
MODOLRAG_POSTGRES_URI=postgresql://modolrag:modolrag@localhost:5439/modolrag
MODOLRAG_EMBEDDING_PROVIDER=ollama        # ollama | openai | local
MODOLRAG_EMBEDDING_MODEL=nomic-embed-text
MODOLRAG_EMBEDDING_DIMENSIONS=768
MODOLRAG_OLLAMA_BASE_URL=http://localhost:11434
MODOLRAG_LLM_PROVIDER=ollama              # ollama | openai
MODOLRAG_LLM_MODEL=llama3
MODOLRAG_CHUNK_SIZE=512
MODOLRAG_CHUNK_OVERLAP=51
MODOLRAG_SIMILARITY_TOP_K=5
MODOLRAG_SIMILARITY_THRESHOLD=0.7
MODOLRAG_API_KEYS=                        # empty = no auth
```

## Conventions

- All DB tables prefixed with `modolrag_`
- Embeddings stored as `halfvec(768)` — change dimension in schema.sql if using different model
- Async-first: all DB operations use asyncpg, all HTTP calls use httpx
- Parsers follow ABC pattern (ParserBase) with lazy imports for heavy deps
- Config via pydantic-settings with `MODOLRAG_` prefix env vars
- RRF fusion weights: vector=0.5, FTS=0.3, graph=0.2 (k=60)

## Testing

- Test framework: pytest + pytest-asyncio (asyncio_mode = "auto")
- 5 test modules: chunker, extractor, hybrid_search, api, parsers
- All tests are unit tests — no DB or external service required
- Tests mock external calls (embedding API, LLM, DB)

## Known Limitations

- `python-multipart` is listed as a dependency but may be unused directly (FastAPI uses it internally for file uploads)
- `setup.py` is minimal and redundant with pyproject.toml (kept for backward compatibility)
- No Alembic migrations — schema changes are done via schema.sql re-init
- No CI/CD pipeline configured yet
