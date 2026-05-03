/**
 * hanimo-rag v2 — Agentic LiteRAG Engine
 *
 * LLM-native retrieval with zero vector infrastructure.
 * Uses a small LLM (<10B params) as both indexer and search engine.
 *
 * @example
 * ```typescript
 * import { HanimoRAG } from 'hanimo-rag'
 *
 * const rag = new HanimoRAG({ model: 'qwen2.5:7b' })
 * await rag.index('./docs')
 * const results = await rag.search('how to configure middleware')
 * const answer = await rag.ask('What is the authentication flow?')
 * ```
 */

export { HanimoRAG } from './hanimo-rag.js'
export type {
  AskOptions,
  ChunkOptions,
  Config,
  IndexedChunk,
  IndexResult,
  ParsedDocument,
  SearchOptions,
  SearchResult,
  StoreStats,
} from './types.js'
