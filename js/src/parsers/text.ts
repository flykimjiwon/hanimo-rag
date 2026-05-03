/**
 * hanimo-rag v2 — Text File Parser
 */

import * as fs from 'node:fs'
import type { ParsedDocument } from '../types.js'

export async function parseTextFile(filePath: string): Promise<ParsedDocument> {
  const content = await fs.promises.readFile(filePath, 'utf-8')

  return {
    text: content,
    metadata: {
      format: 'text',
      size: Buffer.byteLength(content, 'utf-8'),
    },
    pages: [content],
  }
}
