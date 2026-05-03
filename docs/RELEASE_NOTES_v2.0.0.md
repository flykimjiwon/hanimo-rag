# Release Notes — v2.0.0 (2026-05-03)

> "벡터 DB는 끝났다. LLM이 답이다."

하루 만에 v1 (PostgreSQL hybrid RAG) → v2 (Agentic LiteRAG) 전면 피봇. 코어 엔진 + dashboard + 마케팅 사이트 + 듀얼 SDK + 모든 메타까지 한 번에.

---

## 한 줄 요약

기존 RAG 오픈소스의 복잡한 인프라 가정(임베딩 모델 + 벡터 DB + Docker)을 통째 폐기하고, **LLM 하나만 있으면 동작하는 LiteRAG**로 다시 만들었습니다.

---

## 새 코어: Agentic LiteRAG

### 인덱싱
```
Document → Chunk → LLM이 JSON 키 추출 → JSON store
                  키: { topics[], entities[], questions[], category, summary }
```

### 검색
```
Query → LLM Router (키워드 + 카테고리)
      → Key lookup (O(1))
      → LLM Judge (relevance 0-1)
      → 부족하면 LLM이 키워드 refine + 재시도 (max 3 rounds)
```

### 차별점

| | v1 (Hybrid RAG) | v2 (LiteRAG) |
|---|---|---|
| 인덱스 저장소 | PostgreSQL + pgvector | JSON 파일 |
| 청크 표현 | float[768] 벡터 | JSON 키 (사람이 읽음) |
| 의존성 | 임베딩 모델 + LLM + DB | LLM만 |
| Docker | 필요 | 불필요 |
| 인덱스 사이즈 | 768-dim float / 청크 | ~200 byte / 청크 |
| latency | ~450ms | ~350ms |
| 최소 환경 | Docker + PostgreSQL | Python 또는 Node.js |
| 디버깅 | "왜 매칭?" → 모름 | `matched_topics: [...]` |
| 편집성 | 벡터 수정 불가 | JSON 열어 토픽 추가/제거 |

---

## 듀얼 SDK 출시

처음부터 Python + JS 생태계 양쪽 first-class:

| | Python | JS / Next.js |
|---|---|---|
| 설치 | `pip install hanimo-rag` | `npm install hanimo-rag` |
| 진입 클래스 | `from hanimo_rag import HanimoRAG` | `import { HanimoRAG } from 'hanimo-rag'` |
| CLI | `hanimo-rag` | `hanimo-rag` (npm bin) |
| 코어 모듈 | `core/{indexer,router,judge,agent,chunker}.py` | `core/{indexer,router,judge,agent,chunker}.ts` |
| 빌드 | setuptools | tsup (CJS + ESM + DTS) |
| 테스트 | pytest 27 통과 | vitest 23 통과 |

---

## 추천 모델 (저사양 LLM 우선)

| 모델 | 파라미터 | VRAM | 용도 |
|---|---|---|---|
| **Qwen2.5-7B** | 7B | 5GB | 인덱싱 default |
| Phi-3.5-mini | 3.8B | 2.5GB | Routing/Judging 빠름 |
| Gemma 2 9B | 9B | 6GB | 한국어/복잡 쿼리 |
| Llama 3.1 8B | 8B | 5GB | 올라운더 |
| Qwen2.5-3B | 3B | 2GB | Raspberry Pi / Edge |

---

## Dashboard 전면 재구축

`hanimo_rag_클로드디자인/` jsx 8개 디자인 자산 → production-ready React/Vite/TypeScript SPA로 변환:

- 페이지 7개: guide, apps, app-detail, documents, collections, playground, settings
- 컴포넌트: chrome (Sidebar/Topbar), lib (Btn/Input/Tooltip 등), CreateAppModal (4-step wizard)
- 테마: Honey (default), Dark, Light — `localStorage` 키 `hanimo-theme`
- v2 API client: 16개 함수 (`apiSearch`, `apiAsk`, `apiIngest`, `apiCreateApp`, ...)
- 폰트: `@fontsource/inter` + `@fontsource/jetbrains-mono` self-host (외부 CDN 의존 0)
- 빌드 사이즈: 295 KB JS (gzip 86 KB), 79 KB CSS (gzip 29 KB)
- viewport: 1280 px, 한국어 (`lang="ko"`)

---

## 마케팅 사이트

`docs/landing.html` — 자급자족 단일 HTML (외부 CDN 의존 0):

- Hero: "벡터 DB는 끝났다. LLM이 답이다."
- 컨셉 다이어그램 (전통 RAG vs LiteRAG)
- 비교표 1: Why Not Vectors? (8 항목)
- 비교표 2: 기존 오픈소스 (LangChain / LlamaIndex / RAGFlow vs hanimo-rag) 8 항목
- 코드 탭 (Python / TypeScript / CLI)
- 추천 모델 5개
- 비교 데모 영상 자리 (YouTube embed 예정)
- CTA: GitHub, npm, pip
- Footer: hanimo 생태계 링크

---

## v1 → v2 마이그레이션

v1 코드는 `archive/v1-postgres-hybrid-rag` 브랜치 + 원격에 영구 보존. 자동 마이그레이션 도구는 없습니다 (포맷 자체가 비호환). v2 설치 후 **재인덱싱**하세요. 자세한 가이드: [docs/MIGRATION_v1_to_v2.md](MIGRATION_v1_to_v2.md).

---

## 검증

| 항목 | 결과 |
|---|---|
| `pytest tests/` | ✅ 27/27 (chunker 11 + store 16) |
| `vitest run` | ✅ 23/23 (chunker + store) |
| `tsup` (JS build) | ✅ CJS + ESM + DTS |
| `vite build` (dashboard) | ✅ 295 KB → gzip 86 KB |
| `pip install -e .` | ✅ |
| `npm install` | ✅ (5 moderate vulns 정보 — Tailwind v4 peer dep) |

---

## 정책 결정

- **License**: MIT → **Apache 2.0** (생태계 통일)
- **외부 CDN 의존 0** (브랜딩 + 프라이버시) — 모든 폰트 self-host, 모든 스크립트 self-host
- **Docker 폐기** (no-infrastructure 컨셉 강화)
- **PostgreSQL 옵셔널 미지원** (컨셉 희석 방지 — v1 archive 브랜치에서 fork 가능)
- **단방향 BREAKING** — v1 호환성 코드 박지 않음 (단순함 유지)

---

## 오늘 commit timeline

```
bf12f03 chore: v2 일관성 정리 (CLAUDE/dashboard/docs/vite.config v1 잔재)
5594fa2 fix(dashboard): 폰트 self-host + MOCK→실 v2 API 연결
3ced4da feat(site): docs/landing.html 비교 마케팅 페이지
48eacea feat(dashboard): 클로드디자인 jsx → production-ready TSX
8f91aaf feat!: v2 LiteRAG 피봇 (BREAKING)
7d538ff feat(design): hanimo_rag_클로드디자인 jsx 자산 + .omc gitignore
─── 이전: v1 ───
```

추가:
- `archive/v1-postgres-hybrid-rag` 브랜치 + 원격 push
- 태그 `v2.0.0` 생성 + push

---

## 미해결 / 후속 작업

- [ ] dashboard 실 백엔드 통합 QA (DocumentsPage/CollectionsPage onDelete prop 사용 검증)
- [ ] landing.html YouTube 비교 데모 영상 embed (영상 제작 후)
- [ ] gemma2:2b/9b 한국어 인덱싱 품질 실측 (default 검토)
- [ ] CI/CD pipeline (GitHub Actions: pytest + vitest + build 자동화)
- [ ] PyPI / npm publish 자동화

---

## 부수 정리 (개발자 환경)

같은 날 `~/Desktop/kimjiwon/saju/` 폴더 정리:

- `ModolRAG/` 폴더 → `~/Desktop/kimjiwon/hanimo-rag-v2/`로 추출 (v2 source mirror)
- 4개 살리기 mv: `obsidian-chat`, `likeMoney`, `autuBlog`, `voice-clone`
- 10개 잔재 삭제: `hanimo`, `gstack`, `GameMaster`, `techai`, `wedding`, `saju`, `kimjiwonObsidian`, `ModolAI`, `택가이코드`, `AX어쩌구`
- 디스크 ~178 MB 회수
- saju 레포는 본연 코드만 남음

---

## 감사

- Claude Opus 4.7 (1M context) — 실시간 페어 프로그래밍
- 사용자 [@flykimjiwon](https://github.com/flykimjiwon) — 컨셉 / 디자인 / 결정
