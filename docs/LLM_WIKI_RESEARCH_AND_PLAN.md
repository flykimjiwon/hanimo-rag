# hanimo-rag × LLM Wiki — 조사 리포트 & 고도화 플랜

> **작성일**: 2026-04-10
> **목적**: Karpathy의 LLM Wiki 패턴과 RAG 대안 지형도를 정리하고, hanimo-rag의 차세대 포지셔닝/고도화 방향을 제안
> **상태**: 조사 & 계획 문서 (구현 착수 전)

---

## 📑 목차

1. [배경: 왜 지금 이 조사인가](#1-배경)
2. [LLM Wiki 패턴 (Karpathy)](#2-llm-wiki-패턴-karpathy)
3. [RAG 대안 지형도 (2026)](#3-rag-대안-지형도-2026)
4. [hanimo-rag 현 위치와 전략적 질문](#4-hanimo-rag-현-위치와-전략적-질문)
5. [고도화 플랜: Wiki 레이어 얹기](#5-고도화-플랜-wiki-레이어-얹기)
6. [아키텍처 상세 설계](#6-아키텍처-상세-설계)
7. [로드맵 & 단계별 작업](#7-로드맵--단계별-작업)
8. [차별화 포인트 & 리스크](#8-차별화-포인트--리스크)
9. [참고 자료](#9-참고-자료)

---

## 1. 배경

### 문제의식
- **hanimo-rag는 "Library" 포지션**(대량 문서 검색)에 최적화되어 있음
- 하지만 2026년 상반기 기준 RAG 생태계가 빠르게 바뀌고 있음:
  - Long-context LLM (1M~10M 토큰) 보편화
  - **CAG** (Cache-Augmented Generation) 등장 — RAG보다 40배 빠름
  - **LLM Wiki** (Karpathy 패턴) — "쿼리마다 retrieve" 대신 "한 번 컴파일"
- 그냥 "더 좋은 RAG"로 경쟁하면 대형 벤더(OpenAI Assistants, Anthropic Files API, Vercel AI SDK) 상대로 불리
- **차별화 지점**을 찾아야 함

### 조사 대상
1. Karpathy LLM Wiki 패턴 (2026-04 핫이슈)
2. CAG 및 기타 RAG 대안
3. 하이브리드 아키텍처 (Tiered Memory)
4. hanimo-rag가 취할 수 있는 포지션

---

## 2. LLM Wiki 패턴 (Karpathy)

### 2.1 핵심 아이디어

> **"벡터 DB 쿼리하지 말고, LLM이 직접 유지관리하는 markdown wiki를 만들어라"**

Andrej Karpathy가 2026년 4월에 gist로 공개한 패턴. 바이럴되어 "Bye Bye RAG"라는 밈까지 나옴.

### 2.2 동작 방식

```
┌─────────────────────────────────────────────────────────────┐
│                    전통적 RAG                                │
│  Query → Embed → Vector Search → Retrieve Chunks → LLM      │
│  (쿼리 시점에 지식을 "조립")                                  │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                    LLM Wiki 패턴                             │
│  Ingest → LLM이 읽고 → Wiki 엔티티 페이지 생성/업데이트       │
│  Query → Wiki 파일 읽기 (grep/파일명/간단한 검색) → LLM      │
│  (수집 시점에 지식을 "컴파일")                                │
└─────────────────────────────────────────────────────────────┘
```

### 2.3 구조

```
wiki/
├── index.md                 # 최상위 인덱스 (엔티티 목록)
├── topics/
│   ├── postgres-pgvector.md # 주제별 요약
│   └── ...
├── entities/
│   ├── karpathy.md          # 사람/조직/개념 페이지
│   ├── rag.md               # entity 간 상호 링크
│   └── ...
└── sources/
    ├── source-001.md        # 원본 스니펫 참조
    └── ...
```

### 2.4 LLM이 수행하는 "컴파일" 단계

새 문서가 들어오면 에이전트가:
1. **Read**: 원본 문서 파싱
2. **Extract**: 엔티티, 사실, 관계 추출
3. **Merge**: 기존 wiki 페이지와 **병합** (중복 제거, 업데이트)
4. **Cross-link**: wikilinks `[[entity]]` 자동 생성
5. **Summarize**: topic 요약 페이지 revise
6. **Version**: git commit (또는 DB 버전)

### 2.5 장단점

| 장점 | 단점 |
|------|------|
| 쿼리 시점 latency 최소 (그냥 파일 읽기) | 수집 시점 LLM 비용 상승 |
| 지식이 "정제"되어 hallucination 감소 | 스케일링 어려움 (LLM이 수동 관리) |
| Human-readable (markdown) | 멀티유저/동시성 난해 |
| git 버전 관리 자연스러움 | 엔티티 병합 충돌 가능 |
| 개인 "2nd brain" 용으로 최적 | 자주 변하는 데이터 부적합 |

### 2.6 기존 구현체

| 프로젝트 | 특징 | 링크 |
|----------|------|------|
| **Karpathy gist** | 패턴 정의 원본 | https://gist.github.com/karpathy/442a6bf555914893e9891c11519de94f |
| **Pratiyush/llm-wiki** | Claude Code/Codex/Cursor 세션 기반 자동 wiki | https://github.com/Pratiyush/llm-wiki |
| **Obsidian + Claude** | Obsidian vault를 Claude가 유지 | a2a-mcp 블로그 가이드 |
| **Louis Wang blog** | self-improving KB 구현 | louiswang524.github.io |

모두 **파일 기반(markdown + git)** → PostgreSQL 기반은 **아직 없음** 🎯

---

## 3. RAG 대안 지형도 (2026)

### 3.1 Cache-Augmented Generation (CAG)

**논문**: "Don't Do RAG: When Cache-Augmented Generation is All You Need for Knowledge Tasks" (arXiv 2412.15605, ACM Web Conference 2025)

**핵심**:
- 전체 지식베이스를 LLM long-context에 **미리 로드**
- KV 캐시로 런타임 파라미터 저장 → 쿼리마다 재계산 없음
- Retrieval 단계 **완전 제거**

**성능**:
- RAG 대비 **40배 빠른 generation**
- 연산 비용 **70% 감소**
- Retrieval 에러 **0**

**제약**:
- 지식이 **context window 안에 들어와야 함** (<500k tokens 권장)
- 자주 변하는 데이터 부적합 (캐시 무효화 비용)

### 3.2 RAG vs CAG vs LLM Wiki — 비교

| 항목 | RAG | CAG | LLM Wiki |
|------|-----|-----|----------|
| **지식 조립 시점** | 쿼리 시점 | 모델 로드 시점 | 수집 시점 |
| **데이터 크기** | 수백만+ | <500k tokens | 수백~수만 페이지 |
| **업데이트 빈도** | 실시간 OK | 느림 (재캐시) | 중간 (재컴파일) |
| **쿼리 latency** | 중 (embed+search) | 최저 (캐시) | 최저 (파일 읽기) |
| **수집 비용** | 낮음 (embed만) | 낮음 (없음) | **높음** (LLM 정제) |
| **정확도** | 중 (retrieve 의존) | 높음 | **매우 높음** (정제됨) |
| **할루시네이션** | 높음 | 낮음 | 낮음 |
| **적합 용도** | Library (대량/변화) | Golden Knowledge | 2nd Brain, 문서화 |

### 3.3 Tiered Memory 아키텍처 (2026 표준화 중)

```
┌─────────────────────────────────────────────┐
│  L1: CAG / LLM Wiki  (Golden Knowledge)    │
│  - 핵심 아이덴티티, 제품 문서, FAQ          │
│  - <500k tokens, 안정적                     │
│  - 쿼리 latency 최저                        │
└─────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────┐
│  L2: RAG (Long-tail Library)                │
│  - 사용자별 데이터, 로그, 자주 바뀜         │
│  - 수백만+ 문서                             │
│  - 벡터 DB + FTS                            │
└─────────────────────────────────────────────┘
```

고성능 프로덕션 시스템은 이 두 계층을 **오케스트레이션**하는 방향으로 감.

---

## 4. hanimo-rag 현 위치와 전략적 질문

### 4.1 현재 hanimo-rag의 강점

- ✅ **PostgreSQL 네이티브** (별도 인프라 불필요)
- ✅ **하이브리드 검색**: vector + FTS + graph (RRF fusion)
- ✅ **지식 그래프 기본 탑재** (`hanimo-rag_graph_nodes`, `hanimo-rag_graph_edges`)
- ✅ **엔티티 추출 파이프라인** (`core/extractor.py`)
- ✅ **컬렉션**으로 문서 그룹화
- ✅ **Apps** — 커스텀 LLM 엔드포인트

### 4.2 약점 / 공백

- ❌ 쿼리 시점 retrieve만 지원 → CAG/Wiki 스타일 없음
- ❌ 지식이 "청크" 단위에서 멈춤 → "정제된 엔티티 페이지" 없음
- ❌ Wikilink `[[...]]` 추출은 있지만 **wiki 문서로 합성**은 안 함
- ❌ 그래프 노드가 텍스트 없이 entity만 저장 (summary 없음)

### 4.3 전략적 질문

1. **hanimo-rag의 타겟 유저는?**
   - A. 문서 검색 API가 필요한 개발자 → RAG 유지
   - B. 지식 정리/2nd brain 사용자 → Wiki 피봇
   - C. 둘 다 → **Tiered Memory**로 포지셔닝

2. **경쟁 지형은?**
   - RAG: LlamaIndex, Haystack, Vercel AI SDK 등 포화
   - LLM Wiki: 전부 **파일 기반** (Obsidian, Notion, git)
   - **PostgreSQL 기반 LLM Wiki**는 **아직 공백**

3. **어떤 차별화가 방어 가능한가?**
   - "PostgreSQL + 지식 그래프 + LLM Wiki" → 이 조합은 유니크
   - 그래프 노드가 곧 wiki 엔티티 페이지 = 네이티브 통합
   - SQL로 wiki 쿼리 가능 → 분석/리포팅 친화적

### 4.4 결론: "notRAG"로 버리지 말고, Wiki 레이어 **얹기**

hanimo-rag를 버리고 새로 만들기보다는:
- **기존 RAG 파이프라인 = L2 (Library)**
- **신규 Wiki 레이어 = L1 (Golden Knowledge)**
- 두 레이어를 **같은 PostgreSQL 안에서** 운영
- 이미 있는 그래프/엔티티 추출을 **재사용**

이것이 기존 투자 자산을 살리면서 2026 트렌드에 올라타는 길.

---

## 5. 고도화 플랜: Wiki 레이어 얹기

### 5.1 컨셉 한 줄

> **"RAG 엔진 위에 LLM이 유지하는 PostgreSQL 네이티브 Wiki 레이어"**

### 5.2 상위 목표

| # | 목표 |
|---|------|
| G1 | 문서 ingest 시 **자동 wiki 엔티티 페이지 생성/업데이트** |
| G2 | 기존 `graph_nodes`에 **풍부한 markdown content 칼럼** 추가 |
| G3 | **Wiki 쿼리 API** — 전체 wiki를 LLM에 주입(CAG 스타일) 또는 top-k |
| G4 | **Wikilink 자동 연결** — 이미 추출 중인 `[[...]]`를 엔티티로 resolve |
| G5 | **버저닝** — wiki 페이지 변경 이력 (diff, rollback) |
| G6 | **대시보드 UI** — wiki 브라우저 (read-only + edit suggest) |

### 5.3 비전 사용자 시나리오

```
유저: hanimo-rag 대시보드에 PDF 3개, Markdown 10개, 웹 클립 20개 업로드
    ↓
[기존] 파싱 → 청킹 → 임베딩 → pgvector 저장 (L2)
    ↓ (신규)
[Wiki Compiler]
  - 엔티티 추출 (기존 extractor 재사용)
  - 각 엔티티에 대해:
      * 기존 wiki 페이지 있으면 → LLM이 merge+revise
      * 없으면 → LLM이 새 엔티티 페이지 생성
  - Topic 페이지 갱신 (관련 엔티티 요약)
  - Wikilink 리졸브 → graph_edges 동기화
  - 버전 기록 (wiki_revisions 테이블)
    ↓
유저 쿼리: "RAG의 대안들 알려줘"
    ↓
[하이브리드 응답]
  L1 (Wiki): entities/rag.md, topics/rag-alternatives.md → LLM context
  L2 (RAG): 필요시 원본 문서에서 보조 청크 retrieve
  → LLM 생성 (출처 표시: wiki entity + 원본 문서)
```

---

## 6. 아키텍처 상세 설계

### 6.1 DB 스키마 확장

```sql
-- 기존 테이블 확장
ALTER TABLE hanimo-rag_graph_nodes
    ADD COLUMN wiki_content TEXT,           -- markdown 본문
    ADD COLUMN wiki_summary TEXT,           -- 1-2줄 요약
    ADD COLUMN wiki_updated_at TIMESTAMPTZ,
    ADD COLUMN wiki_source_chunk_ids UUID[], -- 근거 청크 추적
    ADD COLUMN wiki_version INT DEFAULT 1;

-- 신규 테이블
CREATE TABLE hanimo-rag_wiki_topics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug TEXT UNIQUE NOT NULL,              -- 'rag-alternatives'
    title TEXT NOT NULL,
    content TEXT NOT NULL,                  -- markdown
    entity_ids UUID[],                      -- 포함된 엔티티
    embedding halfvec(768),
    version INT DEFAULT 1,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE hanimo-rag_wiki_revisions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    target_type TEXT NOT NULL,              -- 'node' | 'topic'
    target_id UUID NOT NULL,
    version INT NOT NULL,
    content_before TEXT,
    content_after TEXT,
    changed_by TEXT,                        -- 'llm:claude-3' | 'user:jiwon'
    change_reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE hanimo-rag_wiki_links (          -- wikilink 해석 결과
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_id UUID NOT NULL,                -- 링크 걸린 페이지
    target_entity_id UUID,                  -- 링크 대상 (엔티티)
    link_text TEXT NOT NULL,                -- [[...]] 안의 텍스트
    resolved BOOLEAN DEFAULT false
);

CREATE INDEX idx_wiki_topics_embedding ON hanimo-rag_wiki_topics
    USING hnsw (embedding halfvec_cosine_ops);
CREATE INDEX idx_wiki_revisions_target ON hanimo-rag_wiki_revisions (target_type, target_id);
```

### 6.2 모듈 구조 (신규)

```
hanimo-rag/
├── wiki/                              # 🆕 Wiki 레이어
│   ├── __init__.py
│   ├── compiler.py                    # LLM 기반 wiki 컴파일러
│   │   ├── compile_entity()           # 엔티티 페이지 생성/병합
│   │   ├── compile_topic()            # 주제 페이지 요약
│   │   └── resolve_wikilinks()
│   ├── store.py                       # wiki CRUD (SQL)
│   ├── merger.py                      # 기존 페이지 + 새 내용 merge
│   ├── versioning.py                  # revision 관리
│   └── cag.py                         # wiki 전체를 LLM context로 주입
└── api/
    └── wiki.py                        # 🆕 Wiki API 라우터
```

### 6.3 API 엔드포인트 (신규)

| Method | Path | 설명 |
|--------|------|------|
| `POST` | `/api/wiki/compile` | 특정 문서/컬렉션에 대해 wiki 재컴파일 트리거 |
| `GET` | `/api/wiki/entities` | 엔티티 페이지 목록 (페이지네이션) |
| `GET` | `/api/wiki/entities/{slug}` | 엔티티 markdown + 메타 |
| `GET` | `/api/wiki/topics` | 주제 페이지 목록 |
| `GET` | `/api/wiki/topics/{slug}` | 주제 markdown |
| `POST` | `/api/wiki/query` | 하이브리드 쿼리 (L1 wiki + L2 RAG) |
| `GET` | `/api/wiki/revisions/{entity_id}` | 변경 이력 |
| `POST` | `/api/wiki/revisions/{id}/rollback` | 롤백 |
| `GET` | `/api/wiki/export` | 전체 wiki → markdown zip 다운로드 |

### 6.4 파이프라인 통합

```
기존 pipeline.ingest_document():
  parse → chunk → embed → store (chunks)
                      → extract entities
                      → store (graph nodes/edges)

확장:
  parse → chunk → embed → store (chunks)
                      → extract entities
                      → store (graph nodes/edges)
                      → 🆕 wiki.compile_entities(new_entities, chunks)
                           - 각 엔티티마다 기존 wiki_content 조회
                           - LLM 호출: "기존 내용 + 새 청크로 merged markdown 생성"
                           - revision 기록
                           - wiki_content 업데이트
                      → 🆕 wiki.compile_topics(affected_topics)
                           - 영향받은 topic 페이지 재요약
```

### 6.5 Wiki 쿼리 모드

```python
# POST /api/wiki/query
{
  "query": "RAG의 대안들 알려줘",
  "mode": "cag",        # cag | topk | hybrid
  "max_entities": 20,   # topk 모드일 때
  "include_rag": true   # L2 RAG 결과도 포함할지
}
```

| 모드 | 동작 |
|------|------|
| `cag` | **전체 wiki를 LLM context에 주입** (caches가 지원하면 KV cache 활용) |
| `topk` | 쿼리 임베딩으로 wiki 페이지 top-k 리트리브 |
| `hybrid` | topk wiki + RAG 청크 합쳐서 LLM에 전달 |

---

## 7. 로드맵 & 단계별 작업

### Phase 1: MVP (1-2 스프린트)

- [ ] DB 마이그레이션 — `graph_nodes` 칼럼 추가, 신규 3테이블
- [ ] `hanimo-rag/wiki/compiler.py` — 엔티티 페이지 생성 (머지 없이 overwrite)
- [ ] `hanimo-rag/wiki/store.py` — CRUD
- [ ] `POST /api/wiki/compile` — 수동 트리거만
- [ ] `GET /api/wiki/entities/{slug}` — 조회
- [ ] 테스트: compiler 단위 테스트 (LLM mock)

### Phase 2: Auto-compile & Merge (1-2 스프린트)

- [ ] `pipeline.py`에 wiki compile 훅 추가 (ingest 직후)
- [ ] `merger.py` — 기존 내용 + 새 청크를 LLM이 머지 (프롬프트 엔지니어링 핵심)
- [ ] Wikilink 리졸버
- [ ] Topic 페이지 자동 요약
- [ ] `wiki_revisions` 기록
- [ ] 백필 스크립트 (기존 문서 전부 wiki로 재컴파일)

### Phase 3: Query & CAG (1 스프린트)

- [ ] `POST /api/wiki/query` — topk 모드 먼저
- [ ] CAG 모드: 전체 wiki markdown 조립 → long-context LLM 호출
- [ ] Hybrid 모드: wiki + RAG 청크 fusion
- [ ] Cite: 응답에 wiki entity + 원본 문서 출처 표시

### Phase 4: UI & 버저닝 (1 스프린트)

- [ ] 대시보드에 Wiki 페이지 추가 (React)
- [ ] 엔티티/주제 브라우저 (검색, 필터)
- [ ] Revision diff viewer
- [ ] Rollback UI
- [ ] Export (markdown zip)

### Phase 5: 고도화 (ongoing)

- [ ] 사용자 수동 편집 + LLM 제안 workflow
- [ ] 엔티티 별칭/머지 도구 (동명이인 처리)
- [ ] 멀티 테넌트 namespace
- [ ] KV cache 최적화 (Anthropic prompt caching 활용)
- [ ] 시각화: wiki 그래프 뷰 (react-force-graph 재활용)

---

## 8. 차별화 포인트 & 리스크

### 8.1 차별화 포인트

| 측면 | 경쟁 (Obsidian + Claude, llm-wiki 등) | hanimo-rag + Wiki |
|------|-------|-----------------|
| 저장소 | 파일 + git | **PostgreSQL** (단일 백엔드) |
| 검색 | grep/파일명 | **SQL + 벡터 + FTS + 그래프** |
| 멀티유저 | 약함 | **네이티브 지원** |
| 분석/리포팅 | 어려움 | **SQL 쿼리로 가능** |
| API 통합 | 수동 | **REST API 기본 제공** |
| 그래프 | 수동 링크 | **자동 엔티티 그래프** |
| 버저닝 | git | DB revision (rollback API) |
| 하이브리드 RAG | 별도 구성 | **L1+L2 네이티브** |

### 8.2 리스크

| 리스크 | 완화책 |
|--------|--------|
| **LLM 비용 폭증** (수집 시점) | - 배치 처리, 델타만 재컴파일 <br>- 저렴한 모델(Haiku)로 1차 merge, 큰 모델은 검증만 |
| **Merge 품질** (엔티티 페이지 오염) | - revision + rollback <br>- 유저 승인 모드 (review before apply) |
| **엔티티 중복/동명이인** | - graph_nodes namespace <br>- 임베딩 유사도 기반 머지 제안 |
| **스키마 락인** | - 마이그레이션 스크립트 명확화 <br>- wiki → markdown export 항상 가능 |
| **경쟁자 (OpenAI, Anthropic)의 유사 기능 출시** | - PostgreSQL 네이티브 + 오픈소스 유지 <br>- 온프레미스 친화 강조 |
| **LLM 호출 latency (ingest 느려짐)** | - 비동기 큐 (현재도 백그라운드 처리) <br>- 우선순위 큐 (신규 문서 먼저) |

### 8.3 의사결정 포인트

다음 질문에 답이 모이면 착수:

1. **타겟**: 개인용 2nd brain vs 팀 지식베이스 vs API 플랫폼?
2. **LLM 비용**: 월 얼마까지 감당 가능? (수집 시점 비용 산정)
3. **MVP 범위**: Phase 1만? Phase 3까지?
4. **기존 RAG 영향**: L2 그대로 유지 vs wiki 우선으로 리팩토링?
5. **오픈소스 vs SaaS**: 어느 방향?

---

## 9. 참고 자료

### Karpathy LLM Wiki
- [원본 gist (Karpathy)](https://gist.github.com/karpathy/442a6bf555914893e9891c11519de94f)
- [Medium: "Bye Bye RAG" by Mehul Gupta](https://medium.com/data-science-in-your-pocket/andrej-karpathys-llm-wiki-bye-bye-rag-ee27730251f7)
- [Analytics Vidhya: LLM Wiki Revolution](https://www.analyticsvidhya.com/blog/2026/04/llm-wiki-by-andrej-karpathy/)
- [Obsidian + Karpathy LLM Wiki Guide (a2a-mcp)](https://a2a-mcp.org/blog/andrej-karpathy-llm-knowledge-bases-obsidian-wiki)
- [Louis Wang — Self-Improving Knowledge Base](https://louiswang524.github.io/blog/llm-knowledge-base/)
- [MindStudio: Andrej Karpathy LLM Wiki Guide](https://www.mindstudio.ai/blog/andrej-karpathy-llm-wiki-knowledge-base-claude-code)

### 구현체
- [Pratiyush/llm-wiki (GitHub)](https://github.com/Pratiyush/llm-wiki)
- [Codersera: Karpathy LLM Second Brain](https://ghost.codersera.com/blog/karpathy-llm-knowledge-base-second-brain/)

### CAG (Cache-Augmented Generation)
- [arXiv 2412.15605: "Don't Do RAG"](https://arxiv.org/abs/2412.15605)
- [arXiv HTML version](https://arxiv.org/html/2412.15605v1)
- [ACM Web Conference 2025 proceeding](https://dl.acm.org/doi/10.1145/3701716.3715490)
- [hhhuang/CAG (GitHub)](https://github.com/hhhuang/CAG)
- [ProjectPro: Is CAG a good RAG alternative?](https://www.projectpro.io/article/cache-augmented-generation/1118)
- [DataNorth: CAG performance-driven alternative](https://datanorth.ai/blog/cache-augmented-generation-cag-a-performance-driven-alternative-to-rag)

### RAG vs CAG 비교
- [Medium: RAG vs CAG Architect's Guide (Frank Coyle)](https://medium.com/@coyle_41098/rag-vs-cag-the-architects-guide-to-llm-memory-47b4b77eaaed)
- [Medium: CAG vs RAG (Hamza Ennaffati)](https://medium.com/@hamzaennaffati98/cache-augmented-generation-cag-vs-retrieval-augmented-generation-rag-7b668e3a973b)
- [StartupWired: RAG vs CAG key differences](https://startupwired.com/2026/03/21/rag-vs-cag-key-differences-in-ai-systems-explained/)
- [Medium: CAG Faster Simpler Alternative (Sahin Ahmed)](https://medium.com/@sahin.samia/cache-augmented-generation-a-faster-simpler-alternative-to-rag-for-ai-2d102af395b2)

---

## 📌 다음 액션 (제안)

이 문서를 검토한 후 결정할 것:

1. **Go / No-Go** — Wiki 레이어 프로젝트 착수 여부
2. **Phase 선택** — MVP는 어디까지?
3. **브랜치 전략** — `feature/wiki-layer` 브랜치 생성?
4. **디자인 검증** — `oh-my-claudecode:architect`에게 아키텍처 리뷰 요청?
5. **프로토타입** — compiler.py + 엔티티 1개로 PoC 먼저?

---

> **이 문서는 조사 & 계획 단계입니다. 구현 착수 전 의사결정 문서로 활용하세요.**
