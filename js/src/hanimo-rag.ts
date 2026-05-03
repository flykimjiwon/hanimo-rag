/**
 * hanimo-rag v2 — Main Class
 *
 * Agentic LiteRAG engine that uses a small LLM for both indexing and search.
 * No vector DB, no embedding model — just LLM + JSON index.
 */

import * as fs from 'node:fs'
import * as path from 'node:path'
import { resolveConfig } from './config.js'
import { AgenticSearch } from './core/agent.js'
import { Indexer } from './core/indexer.js'
import { createLlm, type LLMBase } from './llm/index.js'
import { discoverFiles, parseFile } from './parsers/index.js'
import { createStore, type StoreBase } from './store/index.js'
import type {
  AskOptions,
  ChunkOptions,
  Config,
  IndexResult,
  SearchOptions,
  SearchResult,
  StoreStats,
} from './types.js'

export class HanimoRAG {
  private llm: LLMBase
  private store: StoreBase
  private indexer: Indexer
  private searchEngine: AgenticSearch

  constructor(config?: Config) {
    const resolved = resolveConfig(config)
    this.llm = createLlm(resolved)
    this.store = createStore(resolved)
    this.indexer = new Indexer(this.llm, this.store)
    this.searchEngine = new AgenticSearch(this.llm, this.store)
  }

  /**
   * Index a file or directory.
   *
   * @param inputPath - Path to a file or directory
   * @param options - Chunk size and overlap settings
   * @returns Index result with counts
   */
  async index(
    inputPath: string,
    options?: ChunkOptions,
  ): Promise<IndexResult> {
    const resolvedPath = path.resolve(inputPath)

    const stat = await fs.promises.stat(resolvedPath)

    if (stat.isFile()) {
      const doc = await parseFile(resolvedPath)
      return this.indexer.indexMultiple(
        [{ source: resolvedPath, doc }],
        options,
      )
    }

    if (stat.isDirectory()) {
      const files = await discoverFiles(resolvedPath)

      if (files.length === 0) {
        return { indexed: 0, files: [] }
      }

      const documents: Array<{ source: string; doc: Awaited<ReturnType<typeof parseFile>> }> = []

      for (const filePath of files) {
        try {
          const doc = await parseFile(filePath)
          documents.push({ source: filePath, doc })
        } catch (err) {
          const message = err instanceof Error ? err.message : String(err)
          console.warn(`Skipping ${filePath}: ${message}`)
        }
      }

      return this.indexer.indexMultiple(documents, options)
    }

    throw new Error(`Path is neither a file nor directory: ${resolvedPath}`)
  }

  /**
   * Search indexed documents using agentic multi-round retrieval.
   *
   * @param query - Natural language search query
   * @param options - topK and maxRounds settings
   * @returns Ranked search results
   */
  async search(
    query: string,
    options?: SearchOptions,
  ): Promise<SearchResult[]> {
    return this.searchEngine.search(query, options)
  }

  /**
   * Ask a question and get an answer grounded in indexed documents.
   *
   * @param question - Natural language question
   * @param options - topK setting for context retrieval
   * @returns Generated answer based on retrieved context
   */
  async ask(
    question: string,
    options?: AskOptions,
  ): Promise<string> {
    return this.searchEngine.ask(question, options)
  }

  /**
   * Get statistics about the index.
   */
  stats(): StoreStats {
    return this.store.getStats()
  }

  /**
   * Delete all chunks from a specific source file.
   *
   * @param source - Source file path to remove from index
   * @returns Number of chunks deleted
   */
  deleteSource(source: string): number {
    return this.store.deleteBySource(source)
  }
}
