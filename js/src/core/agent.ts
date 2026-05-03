/**
 * hanimo-rag v2 — Agentic Search Loop
 *
 * Orchestrates the search pipeline:
 * 1. Router: query -> search keys
 * 2. Store lookup: keys -> candidate chunks
 * 3. Judge: filter by relevance
 * 4. If not enough relevant results, refine keys and loop (max 3 rounds)
 */

import type { LLMBase } from '../llm/base.js'
import type { StoreBase } from '../store/base.js'
import type { IndexedChunk, SearchResult } from '../types.js'
import { RelevanceJudge } from './judge.js'
import { QueryRouter } from './router.js'

const ANSWER_SYSTEM = `You are a helpful assistant. Answer the user's question based ONLY on the provided context.
If the context does not contain enough information, say so honestly.
Be concise and direct.`

const REFINE_SYSTEM = `You are a search refinement assistant. The initial search did not find enough relevant results.
Given the original query and the keywords that were tried, suggest different/broader keywords to try next.

Return a JSON object with:
- "keywords": array of 3-6 new search terms to try (different from the ones already tried)
- "reasoning": brief explanation of your refinement strategy`

interface RefineResult {
  keywords: string[]
  reasoning: string
}

export class AgenticSearch {
  private llm: LLMBase
  private store: StoreBase
  private router: QueryRouter
  private judge: RelevanceJudge

  constructor(llm: LLMBase, store: StoreBase) {
    this.llm = llm
    this.store = store
    this.router = new QueryRouter(llm)
    this.judge = new RelevanceJudge(llm)
  }

  /**
   * Multi-round agentic search.
   */
  async search(
    query: string,
    options: { topK?: number; maxRounds?: number } = {},
  ): Promise<SearchResult[]> {
    const topK = options.topK ?? 5
    const maxRounds = options.maxRounds ?? 3

    // Track all relevant chunks found across rounds
    const allRelevant = new Map<string, SearchResult>()
    const triedKeywords = new Set<string>()

    for (let round = 0; round < maxRounds; round++) {
      // Step 1: Get search keys
      let keywords: string[]
      let category: string

      if (round === 0) {
        const routed = await this.router.route(query)
        keywords = routed.keywords
        category = routed.category
      } else {
        // Refine keywords for subsequent rounds
        const refined = await this.refineKeywords(query, [...triedKeywords])
        keywords = refined.keywords
        category = 'any'
      }

      // Track tried keywords
      for (const k of keywords) {
        triedKeywords.add(k)
      }

      // Step 2: Lookup in store
      const lookupCategory = category === 'any' ? undefined : category
      const candidates = this.store.lookup(keywords, lookupCategory, topK * 2)

      if (candidates.length === 0) {
        continue
      }

      // Filter out already-found chunks
      const newCandidates = candidates.filter((c) => !allRelevant.has(c.id))

      if (newCandidates.length === 0) {
        // If category filter returned nothing new, try without category
        if (lookupCategory) {
          const broadCandidates = this.store.lookup(keywords, undefined, topK * 2)
          const newBroad = broadCandidates.filter((c) => !allRelevant.has(c.id))
          if (newBroad.length === 0) continue
          await this.judgeAndCollect(query, newBroad, keywords, allRelevant)
        }
        continue
      }

      // Step 3: Judge relevance
      await this.judgeAndCollect(query, newCandidates, keywords, allRelevant)

      // Early exit if we have enough relevant results
      if (allRelevant.size >= topK) {
        break
      }
    }

    // Sort by score and return top K
    return [...allRelevant.values()]
      .sort((a, b) => b.score - a.score)
      .slice(0, topK)
  }

  /**
   * Answer a question using RAG.
   */
  async ask(
    question: string,
    options: { topK?: number } = {},
  ): Promise<string> {
    const results = await this.search(question, { topK: options.topK ?? 5 })

    if (results.length === 0) {
      return 'I could not find relevant information to answer your question in the indexed documents.'
    }

    const context = results
      .map((r, i) => `[Source ${i + 1}: ${r.source}]\n${r.content}`)
      .join('\n\n---\n\n')

    const prompt = `Context:
${context}

Question: ${question}

Answer based on the context above:`

    return this.llm.generate(prompt, ANSWER_SYSTEM)
  }

  private async judgeAndCollect(
    query: string,
    candidates: IndexedChunk[],
    keywords: string[],
    allRelevant: Map<string, SearchResult>,
  ): Promise<void> {
    const judged = await this.judge.judge(query, candidates)

    for (const result of judged) {
      if (result.relevant && result.score > 0.3) {
        const chunk = candidates.find((c) => c.id === result.id)
        if (chunk) {
          // Merge score if already found (keep higher)
          const existing = allRelevant.get(chunk.id)
          if (existing && existing.score >= result.score) {
            continue
          }

          allRelevant.set(chunk.id, {
            id: chunk.id,
            source: chunk.source,
            content: chunk.content,
            score: result.score,
            matchedKeys: keywords.filter((k) =>
              [...chunk.topics, ...chunk.entities, ...chunk.questions]
                .some((ck) => ck.toLowerCase().includes(k.toLowerCase())),
            ),
            summary: chunk.summary,
          })
        }
      }
    }
  }

  private async refineKeywords(
    query: string,
    triedKeywords: string[],
  ): Promise<RefineResult> {
    const prompt = `Original query: "${query}"
Keywords already tried: ${triedKeywords.join(', ')}

Suggest different search keywords to find relevant documents. Return JSON with: keywords, reasoning.`

    try {
      const result = await this.llm.generateJson<RefineResult>(prompt, REFINE_SYSTEM)
      return {
        keywords: ensureStringArray(result.keywords).slice(0, 6),
        reasoning: typeof result.reasoning === 'string' ? result.reasoning : '',
      }
    } catch {
      // Fallback: try splitting the query differently
      const words = query.toLowerCase().split(/\s+/).filter((w) => w.length > 3)
      return {
        keywords: words.slice(0, 4),
        reasoning: 'fallback word extraction',
      }
    }
  }
}

function ensureStringArray(val: unknown): string[] {
  if (!Array.isArray(val)) return []
  return val.filter((item): item is string => typeof item === 'string')
}
