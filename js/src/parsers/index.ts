/**
 * hanimo-rag v2 — File Parser Factory
 */

import * as fs from 'node:fs'
import * as path from 'node:path'
import type { ParsedDocument } from '../types.js'
import { parseMarkdownFile } from './markdown.js'
import { parseTextFile } from './text.js'

const EXTENSION_MAP: Record<string, (filePath: string) => Promise<ParsedDocument>> = {
  '.txt': parseTextFile,
  '.text': parseTextFile,
  '.log': parseTextFile,
  '.csv': parseTextFile,
  '.tsv': parseTextFile,
  '.json': parseTextFile,
  '.xml': parseTextFile,
  '.html': parseTextFile,
  '.htm': parseTextFile,
  '.md': parseMarkdownFile,
  '.mdx': parseMarkdownFile,
  '.markdown': parseMarkdownFile,
  '.rst': parseTextFile,
  '.py': parseTextFile,
  '.js': parseTextFile,
  '.ts': parseTextFile,
  '.tsx': parseTextFile,
  '.jsx': parseTextFile,
  '.java': parseTextFile,
  '.go': parseTextFile,
  '.rs': parseTextFile,
  '.c': parseTextFile,
  '.cpp': parseTextFile,
  '.h': parseTextFile,
  '.yaml': parseTextFile,
  '.yml': parseTextFile,
  '.toml': parseTextFile,
  '.ini': parseTextFile,
  '.cfg': parseTextFile,
  '.conf': parseTextFile,
  '.sh': parseTextFile,
  '.bash': parseTextFile,
  '.zsh': parseTextFile,
}

/**
 * Parse a single file into a ParsedDocument.
 */
export async function parseFile(filePath: string): Promise<ParsedDocument> {
  const ext = path.extname(filePath).toLowerCase()
  const parser = EXTENSION_MAP[ext]

  if (!parser) {
    // Default to text parser for unknown extensions
    return parseTextFile(filePath)
  }

  return parser(filePath)
}

/**
 * Discover all parseable files in a directory (recursive).
 */
export async function discoverFiles(dirPath: string): Promise<string[]> {
  const files: string[] = []
  await walkDirectory(dirPath, files)
  return files.sort()
}

async function walkDirectory(dirPath: string, files: string[]): Promise<void> {
  const entries = await fs.promises.readdir(dirPath, { withFileTypes: true })

  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name)

    // Skip hidden directories and common non-content dirs
    if (entry.name.startsWith('.') || entry.name === 'node_modules' || entry.name === '__pycache__') {
      continue
    }

    if (entry.isDirectory()) {
      await walkDirectory(fullPath, files)
    } else if (entry.isFile()) {
      const ext = path.extname(entry.name).toLowerCase()
      // Only include known file types or common text files
      if (EXTENSION_MAP[ext] !== undefined || ext === '') {
        files.push(fullPath)
      }
    }
  }
}
