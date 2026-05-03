# hanimo-rag — Project Guide

## Overview

hanimo-rag is **Agentic LiteRAG** — an LLM-native retrieval engine with **zero vector infrastructure**. No vector DB. No embeddings. No Docker. JSON file is all you need.

- **Version**: 2.0.0 (released 2026-05-03)
- **License**: Apache 2.0
- **Python**: 3.10+
- **Node**: 18+
- **Stack**: Python (`pip install hanimo-rag`) + JS/TS (`npm install hanimo-rag`) — first-class dual SDK

> v1 (PostgreSQL + pgvector hybrid RAG) is permanently archived in branch `archive/v1-postgres-hybrid-rag`. Do not propose vector DB / embedding model additions — that violates v2 design philosophy.

## How LiteRAG Works

```
INDEX:  Document → Chunk → LLM extracts JSON keys → JSON store
                  keys: { topics[], entities[], questions[], category, summary }

SEARCH: Query → LLM Router (extract keywords + category)
              → Key lookup O(1) in store
              → LLM Judge (relevance 0-1)
              → If insufficient: LLM refines keywords, retry (max 3 rounds)
```

Latency ~350ms. Index size ~200B JSON per chunk (vs 768d float vectors).

## Architecture

```
hanimo-rag/
├── hanimo_rag/             # Python package (pip install hanimo-rag)
│   ├── __init__.py         # exports HanimoRAG class
│   ├── core/               # indexer, router, judge, agent, chunker
│   ├── llm/                # base, ollama, openai_compat
│   ├── store/              # base, json_store, sqlite_store
│   ├── parsers/            # base, markdown, pdf, text
│   ├── server.py           # optional FastAPI server
│   ├── cli.py              # `hanimo-rag` CLI
│   ├── config.py           # Config dataclass
│   └── types.py            # shared types
│
├── js/                     # npm package (npm install hanimo-rag)
│   └── src/                # mirror of Python: core, llm, store, parsers, server, cli
│       ├── hanimo-rag.ts   # HanimoRAG class
│       ├── index.ts        # main export
│       └── types.ts
│
├── tests/                  # pytest (Python) — 27 tests: chunker(11) + store(16)
├── js/tests/               # vitest (JS) — 23 tests: chunker + store
│
├── dashboard/              # React 19 + Vite + Tailwind v4 SPA (clood디자인 jsx 기준)
│   ├── src/
│   │   ├── App.tsx, main.tsx, theme.ts, i18n.tsx, lib.tsx, chrome.tsx, api.ts
│   │   └── pages/{guide,apps,app-detail,documents,collections,playground,settings}.tsx
│   └── index.html
│
├── docs/                   # ARCHITECTURE.md, SCHEMA.md, DESIGN_ANALYSIS.md, design-01~05.html, landing.html
├── hanimo_rag_클로드디자인/  # Original jsx design assets (reference)
└── pyproject.toml, README.md, LICENSE (Apache 2.0), CLAUDE.md, .gitignore
```

## Recommended Models

| Model | Params | VRAM | Best For |
|-------|--------|------|----------|
| **Qwen2.5-7B** | 7B | 5GB | Indexing (best JSON output) — current default |
| Phi-3.5-mini | 3.8B | 2.5GB | Routing/Judging (fast queries) |
| Gemma 2 9B | 9B | 6GB | Complex queries / Korean |
| Llama 3.1 8B | 8B | 5GB | All-rounder |
| Qwen2.5-3B | 3B | 2GB | Edge / Raspberry Pi |

## Development

### Quick Setup

```bash
# Python
python3 -m venv .venv
.venv/bin/pip install -e ".[dev]"

# JS
cd js && npm install && npm run build && cd ..

# Dashboard
cd dashboard && npm install && npm run build && cd ..

# Run (Python server, optional)
.venv/bin/hanimo-rag serve --port 3737
```

Requires Ollama (or any OpenAI-compatible LLM endpoint). No PostgreSQL, no Docker required.

### Tests

```bash
.venv/bin/pytest tests/                  # Python — 27 tests
cd js && npx vitest run && cd ..         # JS — 23 tests
cd dashboard && npm run build && cd ..   # Dashboard build verify
```

### Lint

```bash
.venv/bin/ruff check hanimo_rag/
.venv/bin/ruff format hanimo_rag/
```

### CLI Examples

```bash
hanimo-rag index ./docs --model qwen2.5:7b
hanimo-rag search "CORS middleware setup"
hanimo-rag ask "How do I configure logging?"
hanimo-rag status
hanimo-rag delete ./docs/old.md
hanimo-rag serve --port 3737
```

### Environment Variables

```bash
OPENAI_API_KEY=...                       # OpenAI / OpenAI-compatible endpoints
OLLAMA_BASE_URL=http://localhost:11434   # Ollama base URL (default)
VITE_API_BASE=http://localhost:3737      # dashboard → backend (build time)
```

## API (when running `hanimo-rag serve`)

FastAPI server (`hanimo_rag/server.py`) and JS Express equivalent (`js/src/server.ts`):

| Endpoint | Purpose |
|---|---|
| `POST /api/ingest` | Index a document/folder |
| `GET/DELETE /api/documents/...` | Document CRUD |
| `POST /api/search` | Keyword routing + judge search |
| `POST /api/generate` | RAG answer (search + LLM) |
| `GET/PUT /api/settings` | Config |
| `GET /health` | Health |
| CRUD `/api/collections`, `/api/apps` | Collection / App builder support |

Dashboard (`dashboard/`) consumes these via `dashboard/src/api.ts`.

## Conventions

- **Dual SDK rule**: any change to Python core must have JS equivalent (and vice versa). They are mirrors.
- **No vector / embedding additions** — violates v2 design (see commit `8f91aaf`)
- **License**: Apache 2.0. All deps must be MIT/BSD/Apache compatible.
- **Branding**: Honey amber (`#F59E0B` / `#FBBF24` / `#FCD34D`). No external CDN fonts/scripts (commit `e0ce6b6` policy).
- **Folder names with non-ASCII (`hanimo_rag_클로드디자인/`)** are intentional design source folders — keep as-is.

## Project History (key commits)

- `5594fa2` — dashboard 폰트 self-host + MOCK→실 v2 API 연결
- `48eacea` — dashboard 클로드디자인 jsx → production-ready TSX
- `3ced4da` — `docs/landing.html` (기존 RAG 비교 마케팅 페이지)
- `8f91aaf` — **v2 LiteRAG 피봇 (BREAKING)** — vector DB 통째 폐기
- `7d538ff` — 디자인 자산 commit + .omc gitignore
- `archive/v1-postgres-hybrid-rag` — v1 (pgvector hybrid RAG) 영구 보존
- Tag `v2.0.0` — release marker

## Known TODOs

- Dashboard: 실 백엔드 응답 shape 통합 검증 (DocumentsPage/CollectionsPage onDelete 사용)
- landing.html: YouTube 비교 데모 영상 embed 자리 비워둠
- Korean README 별도 (`README.ko.md`) — 영문 README는 v2 컨셉만 담음
- gemma2:2b/9b 한국어 인덱싱 품질 실측 후 default 검토
