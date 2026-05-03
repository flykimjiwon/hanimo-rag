/**
 * hanimo-rag v2 — Query Router
 *
 * Uses the LLM to parse a natural language query into search keys
 * that can be looked up in the index store.
 */

import type { LLMBase } from '../llm/base.js'

const ROUTER_SYSTEM = `You are a search query analyzer. Given a user question, extract search keywords that would help find relevant documents.

Return a JSON object with:
- "keywords": array of 3-8 search terms (single words or short phrases, lowercase)
- "category": suggested category filter, one of: "technical", "business", "tutorial", "reference", "narrative", "data", "any"
- "intent": brief description of what the user is looking for (one sentence)`

interface RouterResult {
  keywords: string[]
  category: string
  intent: string
}

export class QueryRouter {
  private llm: LLMBase

  constructor(llm: LLMBase) {
    this.llm = llm
  }

  async route(query: string): Promise<RouterResult> {
    const prompt = `Analyze this search query and extract keywords for document retrieval:

Query: "${query}"

Return JSON with: keywords, category, intent.`

    try {
      const result = await this.llm.generateJson<RouterResult>(prompt, ROUTER_SYSTEM)
      return {
        keywords: ensureStringArray(result.keywords).slice(0, 10),
        category: typeof result.category === 'string' ? result.category : 'any',
        intent: typeof result.intent === 'string' ? result.intent : query,
      }
    } catch {
      // Fallback: simple keyword extraction from the query
      return this.fallbackRoute(query)
    }
  }

  private fallbackRoute(query: string): RouterResult {
    // Remove common stop words and extract keywords
    const stopWords = new Set([
      'a', 'an', 'the', 'is', 'are', 'was', 'were', 'be', 'been',
      'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will',
      'would', 'could', 'should', 'may', 'might', 'can', 'shall',
      'to', 'of', 'in', 'for', 'on', 'with', 'at', 'by', 'from',
      'as', 'into', 'through', 'during', 'before', 'after', 'above',
      'below', 'between', 'out', 'off', 'over', 'under', 'again',
      'further', 'then', 'once', 'what', 'how', 'why', 'when',
      'where', 'who', 'which', 'this', 'that', 'these', 'those',
      'and', 'but', 'or', 'nor', 'not', 'so', 'yet', 'both',
      'each', 'few', 'more', 'most', 'other', 'some', 'such',
      'no', 'only', 'own', 'same', 'than', 'too', 'very',
      'just', 'about', 'also', 'it', 'its', 'me', 'my', 'i',
    ])

    const keywords = query
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, ' ')
      .split(/\s+/)
      .filter((w) => w.length > 2 && !stopWords.has(w))

    return {
      keywords: [...new Set(keywords)].slice(0, 8),
      category: 'any',
      intent: query,
    }
  }
}

function ensureStringArray(val: unknown): string[] {
  if (!Array.isArray(val)) return []
  return val.filter((item): item is string => typeof item === 'string')
}
