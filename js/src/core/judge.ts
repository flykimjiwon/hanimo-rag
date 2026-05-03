/**
 * hanimo-rag v2 — Relevance Judge
 *
 * Uses the LLM to batch-judge whether retrieved chunks are actually
 * relevant to the user's query and assign relevance scores.
 */

import type { LLMBase } from '../llm/base.js'
import type { IndexedChunk, JudgeResult } from '../types.js'

const JUDGE_SYSTEM = `You are a relevance judge. Given a user query and a list of text chunks, rate each chunk's relevance to the query.

Return a JSON array of objects, one per chunk, each with:
- "id": the chunk id (string)
- "relevant": true if the chunk helps answer the query, false otherwise
- "score": relevance score from 0.0 to 1.0 (1.0 = perfectly relevant)

Be strict: only mark chunks as relevant if they genuinely contain information that helps answer the query.`

export class RelevanceJudge {
  private llm: LLMBase

  constructor(llm: LLMBase) {
    this.llm = llm
  }

  /**
   * Judge relevance of chunks against a query.
   * Processes in batches to avoid hitting token limits.
   */
  async judge(
    query: string,
    chunks: IndexedChunk[],
    batchSize: number = 5,
  ): Promise<JudgeResult[]> {
    if (chunks.length === 0) {
      return []
    }

    const results: JudgeResult[] = []

    // Process in batches
    for (let i = 0; i < chunks.length; i += batchSize) {
      const batch = chunks.slice(i, i + batchSize)
      const batchResults = await this.judgeBatch(query, batch)
      results.push(...batchResults)
    }

    return results
  }

  private async judgeBatch(query: string, chunks: IndexedChunk[]): Promise<JudgeResult[]> {
    const chunkDescriptions = chunks
      .map((c, idx) => {
        const preview = c.content.length > 300 ? c.content.slice(0, 297) + '...' : c.content
        return `[Chunk ${idx + 1}] ID: ${c.id}\nSource: ${c.source}\nSummary: ${c.summary}\nContent: ${preview}`
      })
      .join('\n\n')

    const prompt = `Query: "${query}"

Chunks to evaluate:

${chunkDescriptions}

Judge each chunk's relevance to the query. Return a JSON array.`

    try {
      const raw = await this.llm.generateJson<JudgeResult[]>(prompt, JUDGE_SYSTEM)

      if (!Array.isArray(raw)) {
        return this.fallbackJudge(chunks)
      }

      // Validate and normalize results
      return chunks.map((chunk) => {
        const found = raw.find((r) => r.id === chunk.id)
        if (found && typeof found.relevant === 'boolean' && typeof found.score === 'number') {
          return {
            id: chunk.id,
            relevant: found.relevant,
            score: Math.max(0, Math.min(1, found.score)),
          }
        }
        // If LLM didn't return this chunk's result, give it a neutral score
        return { id: chunk.id, relevant: false, score: 0.3 }
      })
    } catch {
      return this.fallbackJudge(chunks)
    }
  }

  /**
   * Fallback: give all chunks a neutral relevance score.
   * Better to return something than nothing.
   */
  private fallbackJudge(chunks: IndexedChunk[]): JudgeResult[] {
    return chunks.map((c) => ({
      id: c.id,
      relevant: true,
      score: 0.5,
    }))
  }
}
