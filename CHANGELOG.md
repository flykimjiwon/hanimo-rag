# Changelog

이 프로젝트의 모든 주요 변경 사항. [Keep a Changelog](https://keepachangelog.com/) 형식, [Semantic Versioning](https://semver.org/) 준수.

## [2.0.0] — 2026-05-03

### 💥 BREAKING CHANGES

- **Vector DB 제거**: PostgreSQL + pgvector + FTS + graph hybrid RAG 통째 폐기
- **새 코어**: Agentic LiteRAG — LLM이 직접 인덱싱하고 검색 (no embeddings, no vector DB)
- **License**: MIT → **Apache 2.0**
- **패키지 구조**: `hanimo_rag/` (Python) + `js/` (npm) 듀얼 SDK
- **API 전면 재설계**: v1의 `/api/search` (mode hybrid/vector/fts/graph) → v2의 LLM Router + key lookup + LLM Judge

### Added

- Python: `from hanimo_rag import HanimoRAG` 클래스 (`pip install hanimo-rag`)
- JS/TS/Next.js: `import { HanimoRAG } from 'hanimo-rag'` (`npm install hanimo-rag`, CJS+ESM+DTS)
- 5개 코어 모듈 (Python+JS 동등): `indexer`, `router`, `judge`, `agent`, `chunker`
- 2개 store 백엔드: `JsonStore` (default), `SqliteStore`
- LLM 어댑터: Ollama, OpenAI-compatible
- Dashboard 재구축: Vite + React 19 + Tailwind v4, 클로드디자인 jsx 기준 13 TSX 파일
- 폰트 self-host: `@fontsource/inter` + `@fontsource/jetbrains-mono` (Google Fonts CDN 의존 0)
- `docs/landing.html` — 기존 RAG (LangChain/LlamaIndex/RAGFlow) 비교 마케팅 사이트
- `archive/v1-postgres-hybrid-rag` 브랜치 — v1 코드 영구 보존
- 한국어 hero 부제 + 한국어 README 별도 (`README.ko.md`)
- `docs/MIGRATION_v1_to_v2.md` — v1 사용자용 마이그레이션 가이드
- `docs/RELEASE_NOTES_v2.0.0.md` — 자세한 release notes

### Removed

- `hanimo_rag/api/`, `hanimo_rag/db/`, `hanimo_rag/core/{pipeline,embedder,extractor,hybrid_search,vector_store,fts,graph_store,hyde,llm}.py` (v1)
- PostgreSQL, pgvector, asyncpg 의존성
- 임베딩 모델 (nomic-embed-text, text-embedding-3-small 등)
- Docker compose, Dockerfile (v1 PostgreSQL 스택 의존)
- v1 docs: `SCHEMA.md`(옛), `HANIMO_WEBUI_INTEGRATION.md`, `FRONTEND_ARCHITECTURE_DECISION.md`, `LLM_WIKI_RESEARCH_AND_PLAN.md`
- v1 시기 옛 HTML 3개 → `docs/_archive/v1-legacy/` 로 격리
- `start.sh`, `stop.sh`, `install.sh`, `Makefile`, `setup.py`, `uv.lock` (v1 워크플로 의존)
- 환경변수 `HANIMO_RAG_POSTGRES_URI`, `HANIMO_RAG_EMBEDDING_*`, `HANIMO_RAG_SIMILARITY_*`

### Changed

- 환경변수 단순화: `OPENAI_API_KEY`, `OLLAMA_BASE_URL`, `VITE_API_BASE` (3개)
- README hero에 한국어 부제 추가
- `dashboard/index.html` `lang="en"` → `lang="ko"`
- `dashboard/vite.config.ts` outDir 오타 `'../hanimo-rag/static'` (하이픈) → `'dist'` (정상)
- CLAUDE.md 통째 v2 컨셉으로 재작성 (새 Claude 세션에 정확한 컨텍스트 주입)

### Verified

- Python: `pytest tests/` — **27/27 통과** (chunker 11 + store 16)
- JS: `vitest run` — **23/23 통과** (chunker + store)
- JS build: `tsup` — CJS + ESM + DTS 성공
- Dashboard build: 295 kB JS (gzip 86 kB), 79 kB CSS (gzip 29 kB)

### Migration

v1 사용자는 [docs/MIGRATION_v1_to_v2.md](docs/MIGRATION_v1_to_v2.md) 참고. v1 코드/데이터로 돌아가려면:
```bash
git checkout archive/v1-postgres-hybrid-rag
```

### Side cleanup (개발자 환경)

같은 날 `~/Desktop/kimjiwon/saju/` 폴더 정리: ModolRAG 추출 + 4개 살리기 mv + 10개 잔재 삭제 (~178 MB 회수).

---

## [0.1.0] — 2026-04 이전

v1 PostgreSQL hybrid RAG. `archive/v1-postgres-hybrid-rag` 브랜치 참조.
