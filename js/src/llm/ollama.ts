/**
 * hanimo-rag v2 — Ollama LLM Implementation
 */

import { LLMBase } from './base.js'

interface OllamaChatResponse {
  message: {
    role: string
    content: string
  }
}

export class OllamaLLM extends LLMBase {
  private baseUrl: string
  private model: string
  private temperature: number
  private maxTokens: number

  constructor(options: {
    baseUrl: string
    model: string
    temperature: number
    maxTokens: number
  }) {
    super()
    this.baseUrl = options.baseUrl.replace(/\/$/, '')
    this.model = options.model
    this.temperature = options.temperature
    this.maxTokens = options.maxTokens
  }

  async generate(prompt: string, system?: string): Promise<string> {
    const messages: Array<{ role: string; content: string }> = []

    if (system) {
      messages.push({ role: 'system', content: system })
    }
    messages.push({ role: 'user', content: prompt })

    const url = `${this.baseUrl}/api/chat`

    let response: Response
    try {
      response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: this.model,
          messages,
          stream: false,
          options: {
            temperature: this.temperature,
            num_predict: this.maxTokens,
          },
        }),
      })
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      throw new Error(
        `Failed to connect to Ollama at ${this.baseUrl}. Is Ollama running? Error: ${message}`,
      )
    }

    if (!response.ok) {
      const body = await response.text().catch(() => 'unknown error')
      throw new Error(
        `Ollama API error (${response.status}): ${body}`,
      )
    }

    const data = (await response.json()) as OllamaChatResponse
    return data.message.content
  }
}
