# hanimo-rag v2

**Agentic LiteRAG — LLM-native retrieval with zero vector infrastructure**

[![License: Apache 2.0](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](LICENSE)
[![Python 3.10+](https://img.shields.io/badge/python-3.10+-blue.svg)](https://www.python.org/downloads/)
[![Node 18+](https://img.shields.io/badge/node-18+-green.svg)](https://nodejs.org/)

> 🍯 **벡터 DB는 끝났다. LLM이 답이다.**
> 임베딩 모델 0개, 벡터 DB 0개, Docker 없음. JSON 파일 하나로 시작하는 차세대 RAG 엔진.
>
> No vector DB. No embeddings. No infrastructure.
> Just an LLM and your documents. That's it.

---

## What is LiteRAG?

Traditional RAG needs: **Embedding Model + Vector DB (pgvector/Pinecone) + PostgreSQL + Docker + Reranker + LLM**

hanimo-rag v2 needs: **LLM** (that's it)

Instead of encoding documents into opaque float vectors, a small LLM (&lt;10B params) reads each chunk and generates **human-readable key-value tags** — topics, entities, questions, categories. Search uses another LLM call to route queries to the right keys, then judges relevance. An agentic loop expands keywords when results are insufficient.

```
Traditional:  Query → Embed → Vector Search → Rerank → LLM → Answer
hanimo-rag v2:  Query → LLM Router → Key Lookup → LLM Judge → Answer
```

---

## Install

### Python

```bash
pip install hanimo-rag
```

### Node.js / Next.js

```bash
npm install hanimo-rag
```

---

## Quick Start

### Python

```python
from hanimo_rag import HanimoRAG

rag = HanimoRAG("qwen2.5:7b")

# Index (run overnight, batch-friendly)
await rag.index("./docs")

# Search (real-time, ~350ms)
results = await rag.search("How to add CORS middleware?")

# Ask (search + generate)
answer = await rag.ask("What is the default chunk size?")
```

### TypeScript / Next.js

```typescript
import { HanimoRAG } from 'hanimo-rag'

const rag = new HanimoRAG({ model: 'qwen2.5:7b' })

await rag.index('./docs')
const results = await rag.search('How to add CORS middleware?')
const answer = await rag.ask('What is the default chunk size?')
```

### CLI

```bash
hanimo-rag index ./my-docs --model qwen2.5:7b
hanimo-rag search "CORS middleware setup"
hanimo-rag ask "How do I configure logging?"
hanimo-rag status
```

---

## How It Works

### 1. Indexing (Batch, Offline)

```
Document → Parse → Chunk → LLM Extract Keys → JSON/SQLite Store
```

The LLM reads each chunk and outputs structured metadata:

```json
{
  "topics": ["fastapi", "cors", "middleware"],
  "entities": ["FastAPI", "CORSMiddleware", "Starlette"],
  "questions": ["How to enable CORS in FastAPI?"],
  "category": "tutorial",
  "summary": "CORS middleware configuration for FastAPI"
}
```

### 2. Search (Real-time, Agentic)

```
Query → LLM Router (extract keys) → Key Lookup (O(1)) → LLM Judge (relevant?) → Results
         ↑                                                        |
         └── expand keys if not enough results ←──────────────────┘
```

Up to 3 rounds of self-correcting search. The LLM suggests alternative keywords each round.

---

## Why Not Vectors?

| | Vector RAG | hanimo-rag v2 |
|---|---|---|
| **Infrastructure** | PostgreSQL + pgvector + Docker | JSON file |
| **Dependencies** | Embedding model + LLM | LLM only |
| **Index readability** | Opaque floats | Human-readable JSON |
| **Debuggability** | "Why this result?" → unknown | "Matched topics: [fastapi, cors]" |
| **Editability** | Cannot edit vectors | Open JSON, add a topic |
| **Index size** | 768-dim floats per chunk | ~200 bytes of tags per chunk |
| **Search latency** | ~450ms (embed + search + rerank) | ~350ms (route + lookup + judge) |
| **Min environment** | Docker + PostgreSQL | Python or Node.js |

---

## Recommended Models

| Model | Params | VRAM | Best For |
|-------|--------|------|----------|
| **Qwen2.5-7B** | 7B | ~5GB | Indexing (best JSON output) |
| Phi-3.5-mini | 3.8B | ~2.5GB | Routing & Judging (fast) |
| Gemma 2 9B | 9B | ~6GB | Complex queries |
| Llama 3.1 8B | 8B | ~5GB | All-rounder |
| Qwen2.5-3B | 3B | ~2GB | Edge / Raspberry Pi |

```bash
ollama pull qwen2.5:7b  # Recommended default
```

---

## Runs Everywhere

- MacBook / PC (Ollama)
- Raspberry Pi 5 (Ollama + 3B model)
- AWS t3.micro (OpenAI API + JSON store)
- Air-gap server (llama.cpp, offline)
- Colab / Kaggle notebook
- Next.js on Vercel (serverless)

If you have an LLM endpoint, you have a RAG engine.

---

## Project Structure

```
hanimo-rag/
├── python/          # pip install hanimo-rag
│   ├── hanimo-rag/
│   │   ├── core/    # indexer, router, judge, agent
│   │   ├── llm/     # ollama, openai-compat
│   │   ├── store/   # json, sqlite
│   │   └── parsers/ # text, markdown, pdf
│   └── pyproject.toml
├── js/              # npm install hanimo-rag
│   ├── src/
│   │   ├── core/    # indexer, router, judge, agent
│   │   ├── llm/     # ollama, openai-compat
│   │   ├── store/   # json, sqlite
│   │   └── parsers/ # text, markdown
│   └── package.json
└── docs/
    └── index.html   # Documentation
```

---

## License

MIT
