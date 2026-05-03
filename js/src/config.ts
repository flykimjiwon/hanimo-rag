/**
 * hanimo-rag v2 — Configuration Parser
 */

import type { Config, ResolvedConfig } from './types.js'

const DEFAULTS: ResolvedConfig = {
  provider: 'ollama',
  model: 'qwen2.5:7b',
  storePath: './hanimo-rag_data',
  storeType: 'json',
  ollamaBaseUrl: 'http://localhost:11434',
  openaiApiKey: '',
  openaiBaseUrl: 'https://api.openai.com',
  temperature: 0.1,
  maxTokens: 2048,
}

/**
 * Parse model string into provider + model name.
 * Formats:
 *   "qwen2.5:7b"          -> { provider: "ollama", model: "qwen2.5:7b" }
 *   "openai:gpt-4o-mini"  -> { provider: "openai", model: "gpt-4o-mini" }
 *   "ollama:llama3:8b"    -> { provider: "ollama", model: "llama3:8b" }
 */
function parseModelString(modelStr: string): { provider: 'ollama' | 'openai'; model: string } {
  if (modelStr.startsWith('openai:')) {
    return { provider: 'openai', model: modelStr.slice('openai:'.length) }
  }
  if (modelStr.startsWith('ollama:')) {
    return { provider: 'ollama', model: modelStr.slice('ollama:'.length) }
  }
  // Default: treat as Ollama model name
  return { provider: 'ollama', model: modelStr }
}

export function resolveConfig(config?: Config): ResolvedConfig {
  const modelStr = config?.model ?? process.env['HANIMO_RAG_MODEL'] ?? DEFAULTS.model
  const { provider, model } = parseModelString(modelStr)

  return {
    provider,
    model,
    storePath: config?.storePath ?? process.env['HANIMO_RAG_STORE_PATH'] ?? DEFAULTS.storePath,
    storeType: config?.storeType ?? (process.env['HANIMO_RAG_STORE_TYPE'] as 'json' | 'sqlite' | undefined) ?? DEFAULTS.storeType,
    ollamaBaseUrl: config?.ollamaBaseUrl ?? process.env['OLLAMA_BASE_URL'] ?? DEFAULTS.ollamaBaseUrl,
    openaiApiKey: config?.openaiApiKey ?? process.env['OPENAI_API_KEY'] ?? DEFAULTS.openaiApiKey,
    openaiBaseUrl: config?.openaiBaseUrl ?? process.env['OPENAI_BASE_URL'] ?? DEFAULTS.openaiBaseUrl,
    temperature: config?.temperature ?? DEFAULTS.temperature,
    maxTokens: config?.maxTokens ?? DEFAULTS.maxTokens,
  }
}
