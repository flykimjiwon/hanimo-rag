/**
 * hanimo-rag v2 — Abstract Store Interface
 */

import type { IndexedChunk, StoreStats } from '../types.js'

export abstract class StoreBase {
  /** Save chunks to the store, returns count saved */
  abstract saveChunks(chunks: IndexedChunk[]): number

  /** Lookup chunks by matching keys (topics, entities, questions). Score by match count. */
  abstract lookup(keys: string[], category?: string, limit?: number): IndexedChunk[]

  /** Get all unique keys (topics + entities + questions) across the store */
  abstract getAllKeys(): Set<string>

  /** Get store statistics */
  abstract getStats(): StoreStats

  /** Delete all chunks from a given source file, returns count deleted */
  abstract deleteBySource(source: string): number
}
