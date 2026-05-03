# v1 → v2 Migration Guide

> v1 (PostgreSQL hybrid RAG) 사용자가 v2 (Agentic LiteRAG)로 옮길 때 참고.

## TL;DR

v2는 **완전 다른 아키텍처**입니다. 자동 마이그레이션 도구 없습니다. 기존 문서를 v2로 **재인덱싱**하세요. 30분~몇 시간이면 끝납니다 (LLM 호출 비용 발생).

```bash
# v2 설치
pip install hanimo-rag           # 또는: npm install hanimo-rag

# 재인덱싱
hanimo-rag index ./your-docs --model qwen2.5:7b
```

v1 코드/데이터로 돌아가려면:
```bash
git checkout archive/v1-postgres-hybrid-rag
```

---

## 왜 BREAKING change인가

v2는 v1의 **인프라 가정 자체를 폐기**합니다:

| | v1 (Hybrid RAG) | v2 (LiteRAG) |
|---|---|---|
| 인덱스 저장소 | PostgreSQL + pgvector | JSON 파일 |
| 청크 표현 | float[768] 벡터 | JSON 키 (topics/entities/questions/category/summary) |
| 검색 | ANN + FTS + Graph + RRF | LLM Router + key lookup + LLM Judge |
| 의존성 | 임베딩 모델 + LLM + DB | LLM only |
| Docker | 필요 | 불필요 |

따라서 데이터 포맷이 비호환입니다. 변환 불가, 재인덱싱 필수.

---

## 단계별 마이그레이션

### 1. v1 데이터 백업 (선택, 안전용)

v1 PostgreSQL 데이터가 필요하면 dump 하세요:
```bash
git checkout archive/v1-postgres-hybrid-rag
docker compose up -d db
pg_dump postgresql://hanimo-rag:hanimo-rag@localhost:5439/hanimo-rag > v1-backup.sql
git checkout main
```

### 2. v1 인프라 정리

```bash
# v1 PostgreSQL 컨테이너 중지/삭제 (백업했으면)
docker compose down -v

# v1 환경변수 (.env) 정리
# 삭제 대상: HANIMO_RAG_POSTGRES_URI, HANIMO_RAG_EMBEDDING_*, HANIMO_RAG_SIMILARITY_*
```

### 3. v2 설치

**Python**:
```bash
python3 -m venv .venv
.venv/bin/pip install hanimo-rag
```

**JS / Next.js**:
```bash
npm install hanimo-rag
```

### 4. 새 환경변수 (간소화됨)

v1 → v2 환경변수 매핑:

| v1 | v2 | 비고 |
|---|---|---|
| `HANIMO_RAG_POSTGRES_URI` | (삭제) | DB 안 씀 |
| `HANIMO_RAG_EMBEDDING_PROVIDER` | (삭제) | 임베딩 안 씀 |
| `HANIMO_RAG_EMBEDDING_MODEL` | (삭제) | 임베딩 안 씀 |
| `HANIMO_RAG_LLM_PROVIDER` | — | 코드 옵션으로 |
| `HANIMO_RAG_LLM_MODEL` | — | `HanimoRAG(model=...)` 또는 `--model` 플래그 |
| `HANIMO_RAG_OLLAMA_BASE_URL` | `OLLAMA_BASE_URL` | prefix 없음 |
| (없음) | `OPENAI_API_KEY` | OpenAI 호환 endpoint 시 |
| `HANIMO_RAG_API_KEYS` | (서버 코드에서 처리) | server.py 참조 |

### 5. 재인덱싱

```bash
hanimo-rag index ./docs --model qwen2.5:7b
hanimo-rag status   # 인덱싱 결과 확인
hanimo-rag search "쿼리"
hanimo-rag ask "질문?"
```

### 6. 코드 마이그레이션 (v1 → v2 API)

#### Python

```python
# v1 (제거됨)
# from hanimo_rag.core.hybrid_search import HybridSearch
# results = await search.search(query, mode="hybrid", top_k=5)

# v2
from hanimo_rag import HanimoRAG

rag = HanimoRAG("qwen2.5:7b")
await rag.index("./docs")
results = await rag.search("query", topK=5)
answer = await rag.ask("question?")
```

#### TypeScript / Next.js

```ts
// v2 (v1엔 JS SDK 자체가 없었음)
import { HanimoRAG } from 'hanimo-rag'

const rag = new HanimoRAG({ model: 'qwen2.5:7b' })
await rag.index('./docs')
const results = await rag.search('query')
const answer = await rag.ask('question?')
```

#### REST API endpoint

| v1 | v2 |
|---|---|
| `POST /api/search` (mode=hybrid/vector/fts/graph) | `POST /api/search` (mode 인자 없음) |
| `POST /api/generate` (SSE streaming) | `POST /api/generate` |
| `POST /api/ingest` | `POST /api/ingest` |
| `GET/POST /api/graph` | (없음 — graph 폐기) |

### 7. dashboard 재배포

v2 dashboard는 별도 Vite SPA. v1 dashboard와 비호환:
```bash
cd dashboard
npm install
npm run build       # → dashboard/dist/
# Vercel/Netlify/CDN 등에 배포. server.py와 분리 운영 권장.
```

---

## 자주 묻는 질문

### Q. v1으로 영구 돌아갈 수 있나?

A. 가능. `archive/v1-postgres-hybrid-rag` 브랜치 영구 보존됨. 원격에도 push되어 있어 fork 가능.

### Q. v1 인덱스를 v2로 자동 변환하는 도구는?

A. 없습니다. 표현 자체가 다름 (float vector → JSON keys). 재인덱싱이 답.

### Q. PostgreSQL을 옵션으로라도 유지할 수 없나?

A. v2의 핵심 가설은 "no infrastructure"입니다. 옵션으로 유지하면 컨셉 자체가 흐려져서 일관성을 위해 제거. PostgreSQL 백엔드가 정말 필요하면 v1 archive 브랜치를 fork해서 쓰세요.

### Q. 정확도가 떨어지지 않나요?

A. v2 README의 비교표 참고. 키워드 검색 + LLM Judge 조합이 문서 도메인에 따라 vector RAG와 비슷하거나 더 좋습니다 (debuggable, editable, no embedding drift). 단, 도메인별 실측 권장.

### Q. 한국어 인덱싱 성능은?

A. Qwen2.5 / Gemma 2가 한국어 잘합니다. 자세한 모델 추천은 [README](../README.md#recommended-models) 참고.

---

## v1 archive 브랜치 사용

```bash
git fetch origin
git checkout archive/v1-postgres-hybrid-rag
# 이 브랜치는 frozen — 새 커밋 X. fork해서 별도 레포로 유지 추천.
```

## 도움 요청

- GitHub Issues: [flykimjiwon/hanimo-rag/issues](https://github.com/flykimjiwon/hanimo-rag/issues)
- Discussion: [flykimjiwon/hanimo-rag/discussions](https://github.com/flykimjiwon/hanimo-rag/discussions)
