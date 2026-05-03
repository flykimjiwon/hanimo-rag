/**
 * hanimo-rag v2 — Type Definitions
 */

export interface Config {
  /** Model identifier: "qwen2.5:7b" for Ollama, "openai:gpt-4o-mini" for OpenAI-compatible */
  model?: string
  /** Directory path for storing index data. Default: "./hanimo-rag_data" */
  storePath?: string
  /** Storage backend type. Default: "json" */
  storeType?: 'json' | 'sqlite'
  /** Ollama API base URL. Default: "http://localhost:11434" */
  ollamaBaseUrl?: string
  /** OpenAI API key (required for openai provider) */
  openaiApiKey?: string
  /** OpenAI-compatible API base URL. Default: "https://api.openai.com" */
  openaiBaseUrl?: string
  /** LLM temperature. Default: 0.1 */
  temperature?: number
  /** Max tokens for LLM response. Default: 2048 */
  maxTokens?: number
}

export interface IndexedChunk {
  id: string
  source: string
  content: string
  topics: string[]
  entities: string[]
  questions: string[]
  category: string
  summary: string
  indexedAt: string
}

export interface SearchResult {
  id: string
  source: string
  content: string
  score: number
  matchedKeys: string[]
  summary: string
}

export interface IndexResult {
  indexed: number
  files: Array<{ file: string; chunks: number }>
}

export interface ParsedDocument {
  text: string
  metadata: Record<string, unknown>
  pages: string[]
}

export interface ResolvedConfig {
  provider: 'ollama' | 'openai'
  model: string
  storePath: string
  storeType: 'json' | 'sqlite'
  ollamaBaseUrl: string
  openaiApiKey: string
  openaiBaseUrl: string
  temperature: number
  maxTokens: number
}

export interface ChunkOptions {
  chunkSize?: number
  chunkOverlap?: number
}

export interface SearchOptions {
  topK?: number
  maxRounds?: number
}

export interface AskOptions {
  topK?: number
}

export interface StoreStats {
  totalChunks: number
  totalSources: number
  topTopics: string[]
}

export interface ExtractedKeys {
  topics: string[]
  entities: string[]
  questions: string[]
  category: string
  summary: string
}

export interface JudgeResult {
  id: string
  relevant: boolean
  score: number
}
