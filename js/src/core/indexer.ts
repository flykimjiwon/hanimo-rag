/**
 * hanimo-rag v2 — LLM-based Key Extraction Indexer
 *
 * Reads each text chunk, sends it to an LLM, and extracts structured
 * key-value tags (topics, entities, questions, category, summary).
 */

import * as crypto from 'node:crypto'
import type { LLMBase } from '../llm/base.js'
import type { StoreBase } from '../store/base.js'
import type { ExtractedKeys, IndexedChunk, IndexResult, ParsedDocument } from '../types.js'
import { chunkText } from './chunker.js'

const EXTRACTION_SYSTEM = `You are a precise document indexer. Given a text chunk, extract structured metadata for search indexing.

Return a JSON object with these exact fields:
- "topics": array of 3-8 key topics/themes (lowercase, short phrases)
- "entities": array of named entities — people, organizations, technologies, products, places (as mentioned)
- "questions": array of 2-5 questions this chunk could answer
- "category": one of: "technical", "business", "tutorial", "reference", "narrative", "data", "other"
- "summary": one-sentence summary of the chunk (max 100 words)`

function buildExtractionPrompt(content: string): string {
  return `Extract indexing metadata from this text chunk:

---
${content}
---

Respond with a JSON object containing: topics, entities, questions, category, summary.`
}

export class Indexer {
  private llm: LLMBase
  private store: StoreBase

  constructor(llm: LLMBase, store: StoreBase) {
    this.llm = llm
    this.store = store
  }

  async indexDocument(
    source: string,
    doc: ParsedDocument,
    options: { chunkSize?: number; chunkOverlap?: number } = {},
  ): Promise<{ chunks: number }> {
    const chunkSize = options.chunkSize ?? 1000
    const chunkOverlap = options.chunkOverlap ?? 200

    const textChunks = chunkText(doc.text, { chunkSize, chunkOverlap })

    if (textChunks.length === 0) {
      return { chunks: 0 }
    }

    const indexedChunks: IndexedChunk[] = []

    for (const content of textChunks) {
      // Skip very small chunks
      if (content.trim().length < 20) {
        continue
      }

      const keys = await this.extractKeys(content)

      const chunk: IndexedChunk = {
        id: crypto.randomUUID(),
        source,
        content,
        topics: keys.topics,
        entities: keys.entities,
        questions: keys.questions,
        category: keys.category,
        summary: keys.summary,
        indexedAt: new Date().toISOString(),
      }

      indexedChunks.push(chunk)
    }

    if (indexedChunks.length > 0) {
      this.store.saveChunks(indexedChunks)
    }

    return { chunks: indexedChunks.length }
  }

  async indexMultiple(
    documents: Array<{ source: string; doc: ParsedDocument }>,
    options: { chunkSize?: number; chunkOverlap?: number } = {},
  ): Promise<IndexResult> {
    const result: IndexResult = { indexed: 0, files: [] }

    for (const { source, doc } of documents) {
      const { chunks } = await this.indexDocument(source, doc, options)
      result.indexed += chunks
      result.files.push({ file: source, chunks })
    }

    return result
  }

  private async extractKeys(content: string): Promise<ExtractedKeys> {
    const prompt = buildExtractionPrompt(content)

    try {
      const extracted = await this.llm.generateJson<ExtractedKeys>(prompt, EXTRACTION_SYSTEM)
      return normalizeKeys(extracted)
    } catch {
      // Fallback: extract basic keys from content without LLM
      return fallbackExtraction(content)
    }
  }
}

function normalizeKeys(raw: Partial<ExtractedKeys>): ExtractedKeys {
  return {
    topics: ensureStringArray(raw.topics).slice(0, 10),
    entities: ensureStringArray(raw.entities).slice(0, 10),
    questions: ensureStringArray(raw.questions).slice(0, 5),
    category: typeof raw.category === 'string' ? raw.category : 'other',
    summary: typeof raw.summary === 'string' ? raw.summary : '',
  }
}

function ensureStringArray(val: unknown): string[] {
  if (!Array.isArray(val)) return []
  return val.filter((item): item is string => typeof item === 'string')
}

/**
 * Fallback key extraction when LLM fails.
 * Uses simple heuristics to extract basic metadata.
 */
function fallbackExtraction(content: string): ExtractedKeys {
  // Extract "important" words (longer words that might be topics)
  const words = content
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 4)

  // Count word frequency
  const freq = new Map<string, number>()
  for (const w of words) {
    freq.set(w, (freq.get(w) ?? 0) + 1)
  }

  const topics = [...freq.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([word]) => word)

  // Extract capitalized words as potential entities
  const entityPattern = /\b[A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+)*\b/g
  const entityMatches = content.match(entityPattern) ?? []
  const entities = [...new Set(entityMatches)].slice(0, 5)

  const firstSentence = content.split(/[.!?]/)[0]?.trim() ?? ''
  const summary = firstSentence.length > 100 ? firstSentence.slice(0, 97) + '...' : firstSentence

  return {
    topics,
    entities,
    questions: [],
    category: 'other',
    summary,
  }
}
