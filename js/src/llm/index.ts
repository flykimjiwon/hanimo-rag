/**
 * hanimo-rag v2 — LLM Factory
 */

import type { ResolvedConfig } from '../types.js'
import type { LLMBase } from './base.js'
import { OllamaLLM } from './ollama.js'
import { OpenAICompatLLM } from './openai-compat.js'

export { LLMBase } from './base.js'

export function createLlm(config: ResolvedConfig): LLMBase {
  if (config.provider === 'openai') {
    if (!config.openaiApiKey) {
      throw new Error(
        'OpenAI API key is required. Set config.openaiApiKey or OPENAI_API_KEY env var.',
      )
    }
    return new OpenAICompatLLM({
      baseUrl: config.openaiBaseUrl,
      model: config.model,
      apiKey: config.openaiApiKey,
      temperature: config.temperature,
      maxTokens: config.maxTokens,
    })
  }

  return new OllamaLLM({
    baseUrl: config.ollamaBaseUrl,
    model: config.model,
    temperature: config.temperature,
    maxTokens: config.maxTokens,
  })
}
