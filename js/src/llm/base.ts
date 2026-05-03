/**
 * hanimo-rag v2 — Abstract LLM Interface
 */

export abstract class LLMBase {
  abstract generate(prompt: string, system?: string): Promise<string>

  /**
   * Generate a response and parse it as JSON.
   * Retries once on JSON parse failure with an explicit "return valid JSON" nudge.
   */
  async generateJson<T = Record<string, unknown>>(prompt: string, system?: string): Promise<T> {
    const jsonSystem = (system ? system + '\n\n' : '') +
      'IMPORTANT: You MUST respond with valid JSON only. No markdown, no code fences, no extra text.'

    for (let attempt = 0; attempt < 2; attempt++) {
      const raw = await this.generate(
        attempt === 0
          ? prompt
          : prompt + '\n\nYour previous response was not valid JSON. Please respond with ONLY valid JSON.',
        jsonSystem,
      )

      const parsed = tryParseJson<T>(raw)
      if (parsed !== null) {
        return parsed
      }
    }

    throw new Error(`Failed to parse LLM response as JSON after 2 attempts`)
  }
}

/**
 * Attempt to extract and parse JSON from a potentially messy LLM response.
 * Handles responses wrapped in markdown code fences.
 */
function tryParseJson<T>(raw: string): T | null {
  // Try direct parse first
  const trimmed = raw.trim()
  try {
    return JSON.parse(trimmed) as T
  } catch {
    // Continue to extraction attempts
  }

  // Try extracting from code fences: ```json ... ``` or ``` ... ```
  const fenceMatch = trimmed.match(/```(?:json)?\s*\n?([\s\S]*?)\n?\s*```/)
  if (fenceMatch?.[1]) {
    try {
      return JSON.parse(fenceMatch[1].trim()) as T
    } catch {
      // Continue
    }
  }

  // Try finding first { ... } or [ ... ] block
  const braceStart = trimmed.indexOf('{')
  const bracketStart = trimmed.indexOf('[')

  if (braceStart === -1 && bracketStart === -1) {
    return null
  }

  const start = braceStart === -1 ? bracketStart
    : bracketStart === -1 ? braceStart
    : Math.min(braceStart, bracketStart)

  const isObject = trimmed[start] === '{'
  const endChar = isObject ? '}' : ']'

  // Find the matching closing bracket/brace
  let depth = 0
  for (let i = start; i < trimmed.length; i++) {
    const ch = trimmed[i]
    if (ch === '{' || ch === '[') depth++
    else if (ch === '}' || ch === ']') {
      depth--
      if (depth === 0 && ch === endChar) {
        try {
          return JSON.parse(trimmed.slice(start, i + 1)) as T
        } catch {
          return null
        }
      }
    }
  }

  return null
}
