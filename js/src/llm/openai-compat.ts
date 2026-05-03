/**
 * hanimo-rag v2 — OpenAI-compatible LLM Implementation
 */

import { LLMBase } from './base.js'

interface ChatCompletionResponse {
  choices: Array<{
    message: {
      role: string
      content: string
    }
  }>
}

export class OpenAICompatLLM extends LLMBase {
  private baseUrl: string
  private model: string
  private apiKey: string
  private temperature: number
  private maxTokens: number

  constructor(options: {
    baseUrl: string
    model: string
    apiKey: string
    temperature: number
    maxTokens: number
  }) {
    super()
    this.baseUrl = options.baseUrl.replace(/\/$/, '')
    this.model = options.model
    this.apiKey = options.apiKey
    this.temperature = options.temperature
    this.maxTokens = options.maxTokens
  }

  async generate(prompt: string, system?: string): Promise<string> {
    const messages: Array<{ role: string; content: string }> = []

    if (system) {
      messages.push({ role: 'system', content: system })
    }
    messages.push({ role: 'user', content: prompt })

    const url = `${this.baseUrl}/v1/chat/completions`

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }
    if (this.apiKey) {
      headers['Authorization'] = `Bearer ${this.apiKey}`
    }

    let response: Response
    try {
      response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          model: this.model,
          messages,
          temperature: this.temperature,
          max_tokens: this.maxTokens,
        }),
      })
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      throw new Error(
        `Failed to connect to OpenAI-compatible API at ${this.baseUrl}. Error: ${message}`,
      )
    }

    if (!response.ok) {
      const body = await response.text().catch(() => 'unknown error')
      throw new Error(
        `OpenAI API error (${response.status}): ${body}`,
      )
    }

    const data = (await response.json()) as ChatCompletionResponse

    const content = data.choices[0]?.message.content
    if (!content) {
      throw new Error('OpenAI API returned empty response')
    }

    return content
  }
}
