/**
 * hanimo-rag v2 — Markdown Parser with Frontmatter Support
 */

import * as fs from 'node:fs'
import type { ParsedDocument } from '../types.js'

/**
 * Parse YAML-like frontmatter from markdown content.
 * Simple parser — handles key: value pairs and basic arrays.
 */
function parseFrontmatter(content: string): { metadata: Record<string, unknown>; body: string } {
  const frontmatterMatch = content.match(/^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/)

  if (!frontmatterMatch) {
    return { metadata: {}, body: content }
  }

  const [, yamlBlock, body] = frontmatterMatch
  const metadata: Record<string, unknown> = {}

  if (yamlBlock) {
    const lines = yamlBlock.split('\n')
    let currentKey = ''

    for (const line of lines) {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith('#')) continue

      // Key: value pair
      const kvMatch = trimmed.match(/^([a-zA-Z_][\w-]*):\s*(.*)$/)
      if (kvMatch) {
        const [, key, value] = kvMatch
        if (key) {
          currentKey = key
          if (value && value.trim()) {
            // Remove quotes if present
            const cleaned = value.trim().replace(/^["'](.*)["']$/, '$1')
            metadata[currentKey] = cleaned
          } else {
            metadata[currentKey] = []
          }
        }
      } else if (trimmed.startsWith('- ') && currentKey) {
        // Array item
        const existing = metadata[currentKey]
        const item = trimmed.slice(2).trim().replace(/^["'](.*)["']$/, '$1')
        if (Array.isArray(existing)) {
          existing.push(item)
        } else {
          metadata[currentKey] = [item]
        }
      }
    }
  }

  return { metadata, body: body ?? content }
}

/**
 * Split markdown into sections by headings.
 */
function splitBySections(content: string): string[] {
  const sections: string[] = []
  const lines = content.split('\n')
  let current: string[] = []

  for (const line of lines) {
    if (line.match(/^#{1,3}\s/) && current.length > 0) {
      const section = current.join('\n').trim()
      if (section) {
        sections.push(section)
      }
      current = [line]
    } else {
      current.push(line)
    }
  }

  // Last section
  const last = current.join('\n').trim()
  if (last) {
    sections.push(last)
  }

  return sections.length > 0 ? sections : [content]
}

export async function parseMarkdownFile(filePath: string): Promise<ParsedDocument> {
  const raw = await fs.promises.readFile(filePath, 'utf-8')
  const { metadata, body } = parseFrontmatter(raw)
  const sections = splitBySections(body)

  return {
    text: body,
    metadata: {
      ...metadata,
      format: 'markdown',
    },
    pages: sections,
  }
}
