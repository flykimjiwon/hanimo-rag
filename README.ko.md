# hanimo-rag v2

**Agentic LiteRAG — LLM이 직접 검색하는 차세대 RAG 엔진**

> 🍯 **벡터 DB는 끝났다. LLM이 답이다.**
> 임베딩 모델 0개, 벡터 DB 0개, Docker 없음. JSON 파일 하나로 시작.

[![License: Apache 2.0](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](LICENSE)
[![Python 3.10+](https://img.shields.io/badge/python-3.10+-blue.svg)](https://www.python.org/downloads/)
[![Node 18+](https://img.shields.io/badge/node-18+-green.svg)](https://nodejs.org/)

[English README](README.md) · [v1 → v2 마이그레이션](docs/MIGRATION_v1_to_v2.md) · [v2.0.0 Release Notes](docs/RELEASE_NOTES_v2.0.0.md)

---

## LiteRAG가 뭐야?

전통적 RAG는 **임베딩 모델 + 벡터 DB(pgvector/Pinecone) + PostgreSQL + Docker + 리랭커 + LLM** — 무겁습니다.

hanimo-rag v2는 **LLM 하나**로 끝납니다.

청크를 임베딩(opaque float)으로 만들지 않고, **작은 LLM(<10B)이 청크를 읽어 사람이 읽을 수 있는 JSON 키**(topics, entities, questions, category)를 추출합니다. 검색은 또 다른 LLM 호출로 쿼리를 키로 라우팅하고, 관련성을 판단합니다. 결과가 부족하면 키워드를 재구성해 재시도합니다 (최대 3 라운드).

```
전통 RAG:    Query → Embed → Vector Search → Rerank → LLM → Answer
hanimo-rag:  Query → LLM Router → Key Lookup → LLM Judge → Answer
```

---

## 설치

### Python

```bash
pip install hanimo-rag
```

### Node.js / Next.js

```bash
npm install hanimo-rag
```

---

## 빠른 시작

### Python

```python
from hanimo_rag import HanimoRAG

rag = HanimoRAG("qwen2.5:7b")

# 인덱싱 (밤새 돌려도 OK, 배치 친화적)
await rag.index("./docs")

# 검색 (실시간, ~350ms)
results = await rag.search("CORS 미들웨어 추가하는 법?")

# RAG 답변
answer = await rag.ask("기본 chunk 사이즈는?")
```

### TypeScript / Next.js

```ts
import { HanimoRAG } from 'hanimo-rag'

const rag = new HanimoRAG({ model: 'qwen2.5:7b' })

await rag.index('./docs')
const results = await rag.search('CORS middleware setup')
const answer  = await rag.ask('What is the default chunk size?')
```

### CLI

```bash
hanimo-rag index ./my-docs --model qwen2.5:7b
hanimo-rag search "CORS 설정 방법"
hanimo-rag ask "로깅 설정 어떻게?"
hanimo-rag status
```

---

## 동작 방식

### 1. 인덱싱 (배치, 오프라인)

```
Document → Parse → Chunk → LLM이 키 추출 → JSON/SQLite 저장
```

LLM이 각 청크를 읽고 다음과 같은 메타데이터를 출력:

```json
{
  "topics": ["fastapi", "cors", "middleware"],
  "entities": ["FastAPI", "CORSMiddleware", "Starlette"],
  "questions": ["How to enable CORS in FastAPI?"],
  "category": "tutorial",
  "summary": "FastAPI용 CORS 미들웨어 설정"
}
```

### 2. 검색 (실시간, agentic)

```
Query → LLM Router (키 추출) → Key Lookup (O(1)) → LLM Judge (관련성?) → Results
         ↑                                                  |
         └── 부족하면 키 재구성 ←──────────────────────────┘
```

최대 3 라운드 자동 재검색. LLM이 매 라운드 다른 키워드를 제안.

---

## 왜 벡터를 안 쓰는가?

| 항목 | Vector RAG | hanimo-rag v2 |
|---|---|---|
| **인프라** | PostgreSQL + pgvector + Docker | JSON 파일 |
| **의존성** | 임베딩 모델 + LLM | LLM만 |
| **인덱스 가독성** | Opaque float | 사람이 읽는 JSON |
| **디버깅** | "왜 이게 매칭됐지?" → 알 수 없음 | "matched_topics: [fastapi, cors]" |
| **편집성** | 벡터는 수정 불가 | JSON 열어 토픽 추가/제거 |
| **인덱스 사이즈** | 청크당 768-dim float | 청크당 ~200 byte 태그 |
| **검색 latency** | ~450ms (embed + search + rerank) | ~350ms (route + lookup + judge) |
| **최소 환경** | Docker + PostgreSQL | Python 또는 Node.js |

---

## 추천 모델

| 모델 | 파라미터 | VRAM | 용도 |
|------|--------|------|----------|
| **Qwen2.5-7B** | 7B | ~5GB | 인덱싱 (JSON 출력 최강) |
| Phi-3.5-mini | 3.8B | ~2.5GB | Routing & Judging (빠름) |
| Gemma 2 9B | 9B | ~6GB | 복잡 쿼리 / 한국어 |
| Llama 3.1 8B | 8B | ~5GB | 올라운더 |
| Qwen2.5-3B | 3B | ~2GB | Edge / Raspberry Pi |

```bash
ollama pull qwen2.5:7b   # 추천 default
```

---

## 어디서나 동작

- MacBook / PC (Ollama)
- Raspberry Pi 5 (Ollama + 3B 모델)
- AWS t3.micro (OpenAI API + JSON store)
- Air-gap 서버 (llama.cpp, 오프라인)
- Colab / Kaggle 노트북
- Next.js on Vercel (serverless)

LLM endpoint만 있으면 RAG 엔진이 완성됩니다.

---

## 프로젝트 구조

```
hanimo-rag/
├── hanimo_rag/         # Python 패키지 (pip install hanimo-rag)
│   ├── core/           # indexer, router, judge, agent, chunker
│   ├── llm/            # ollama, openai_compat
│   ├── store/          # json_store, sqlite_store
│   └── parsers/        # text, markdown, pdf
├── js/                 # npm 패키지 (npm install hanimo-rag)
│   └── src/            # Python과 동등 구조
├── dashboard/          # React 19 + Vite + Tailwind v4 SPA
├── docs/
│   ├── ARCHITECTURE.md, SCHEMA.md, DESIGN_ANALYSIS.md
│   ├── landing.html    # 비교 마케팅 페이지
│   ├── MIGRATION_v1_to_v2.md
│   └── RELEASE_NOTES_v2.0.0.md
└── tests/              # pytest 27 + vitest 23
```

---

## v1 사용자

v1 (PostgreSQL hybrid RAG) → v2 (LiteRAG) BREAKING change. 자세한 마이그레이션은 [docs/MIGRATION_v1_to_v2.md](docs/MIGRATION_v1_to_v2.md) 참고.

v1 코드는 `archive/v1-postgres-hybrid-rag` 브랜치에 영구 보존:

```bash
git checkout archive/v1-postgres-hybrid-rag
```

---

## License

Apache 2.0 — Made by [@flykimjiwon](https://github.com/flykimjiwon)

## hanimo 생태계

- [hanimo-code](https://github.com/flykimjiwon/hanimo-code) — Go 터미널 AI 코딩 에이전트
- [hanimo-webui](https://github.com/flykimjiwon/hanimo-webui) — Next.js 웹 AI 챗 플랫폼
- **hanimo-rag** ← 이 프로젝트
- [hanimo-community](https://github.com/flykimjiwon/hanimo-community) — 커뮤니티 + AgentRank
