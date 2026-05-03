/**
 * hanimo-rag v2 — JSON File Store
 */

import * as fs from 'node:fs'
import * as path from 'node:path'
import type { IndexedChunk, StoreStats } from '../types.js'
import { StoreBase } from './base.js'

interface StoreData {
  version: number
  chunks: IndexedChunk[]
}

export class JsonStore extends StoreBase {
  private filePath: string
  private data: StoreData

  constructor(storePath: string) {
    super()
    // Ensure directory exists
    if (!fs.existsSync(storePath)) {
      fs.mkdirSync(storePath, { recursive: true })
    }
    this.filePath = path.join(storePath, 'index.json')
    this.data = this.load()
  }

  private load(): StoreData {
    if (!fs.existsSync(this.filePath)) {
      return { version: 2, chunks: [] }
    }
    try {
      const raw = fs.readFileSync(this.filePath, 'utf-8')
      const parsed = JSON.parse(raw) as StoreData
      if (!parsed.chunks || !Array.isArray(parsed.chunks)) {
        return { version: 2, chunks: [] }
      }
      return parsed
    } catch {
      return { version: 2, chunks: [] }
    }
  }

  private save(): void {
    fs.writeFileSync(this.filePath, JSON.stringify(this.data, null, 2), 'utf-8')
  }

  saveChunks(chunks: IndexedChunk[]): number {
    // Deduplicate by id — overwrite existing chunks with same id
    const existingIds = new Set(this.data.chunks.map((c) => c.id))
    const newChunks: IndexedChunk[] = []

    for (const chunk of chunks) {
      if (existingIds.has(chunk.id)) {
        // Replace existing
        const idx = this.data.chunks.findIndex((c) => c.id === chunk.id)
        if (idx !== -1) {
          this.data.chunks[idx] = chunk
        }
      } else {
        newChunks.push(chunk)
      }
    }

    this.data.chunks.push(...newChunks)
    this.save()
    return chunks.length
  }

  lookup(keys: string[], category?: string, limit: number = 10): IndexedChunk[] {
    if (keys.length === 0) {
      return []
    }

    const normalizedKeys = keys.map((k) => k.toLowerCase().trim())

    const scored: Array<{ chunk: IndexedChunk; score: number; matchedKeys: string[] }> = []

    for (const chunk of this.data.chunks) {
      // Filter by category if specified
      if (category && chunk.category.toLowerCase() !== category.toLowerCase()) {
        continue
      }

      const allChunkKeys = [
        ...chunk.topics,
        ...chunk.entities,
        ...chunk.questions,
      ].map((k) => k.toLowerCase().trim())

      let score = 0
      const matchedKeys: string[] = []

      for (const searchKey of normalizedKeys) {
        for (const chunkKey of allChunkKeys) {
          if (chunkKey.includes(searchKey) || searchKey.includes(chunkKey)) {
            score++
            matchedKeys.push(chunkKey)
            break // Count each search key at most once per chunk
          }
        }
      }

      // Also check content for partial matches (lower weight)
      const contentLower = chunk.content.toLowerCase()
      for (const searchKey of normalizedKeys) {
        if (contentLower.includes(searchKey)) {
          score += 0.5
        }
      }

      if (score > 0) {
        scored.push({ chunk, score, matchedKeys: [...new Set(matchedKeys)] })
      }
    }

    // Sort by score descending
    scored.sort((a, b) => b.score - a.score)

    return scored.slice(0, limit).map((s) => s.chunk)
  }

  getAllKeys(): Set<string> {
    const keys = new Set<string>()
    for (const chunk of this.data.chunks) {
      for (const t of chunk.topics) keys.add(t.toLowerCase())
      for (const e of chunk.entities) keys.add(e.toLowerCase())
      for (const q of chunk.questions) keys.add(q.toLowerCase())
    }
    return keys
  }

  getStats(): StoreStats {
    const sources = new Set(this.data.chunks.map((c) => c.source))

    // Count topic frequency
    const topicCounts = new Map<string, number>()
    for (const chunk of this.data.chunks) {
      for (const topic of chunk.topics) {
        const key = topic.toLowerCase()
        topicCounts.set(key, (topicCounts.get(key) ?? 0) + 1)
      }
    }

    const topTopics = [...topicCounts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([topic]) => topic)

    return {
      totalChunks: this.data.chunks.length,
      totalSources: sources.size,
      topTopics,
    }
  }

  deleteBySource(source: string): number {
    const before = this.data.chunks.length
    this.data.chunks = this.data.chunks.filter((c) => c.source !== source)
    const deleted = before - this.data.chunks.length
    if (deleted > 0) {
      this.save()
    }
    return deleted
  }
}
