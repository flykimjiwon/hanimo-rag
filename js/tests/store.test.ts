/**
 * hanimo-rag v2 — JSON Store Tests
 */

import * as fs from 'node:fs'
import * as path from 'node:path'
import * as os from 'node:os'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { JsonStore } from '../src/store/json-store.js'
import type { IndexedChunk } from '../src/types.js'

function makeChunk(overrides: Partial<IndexedChunk> = {}): IndexedChunk {
  return {
    id: overrides.id ?? crypto.randomUUID(),
    source: overrides.source ?? '/test/file.md',
    content: overrides.content ?? 'Test content about TypeScript and Node.js',
    topics: overrides.topics ?? ['typescript', 'nodejs'],
    entities: overrides.entities ?? ['Node.js', 'TypeScript'],
    questions: overrides.questions ?? ['What is TypeScript?'],
    category: overrides.category ?? 'technical',
    summary: overrides.summary ?? 'A test chunk about TypeScript.',
    indexedAt: overrides.indexedAt ?? new Date().toISOString(),
  }
}

describe('JsonStore', () => {
  let tmpDir: string
  let store: JsonStore

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'hanimo-rag-test-'))
    store = new JsonStore(tmpDir)
  })

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true })
  })

  it('saves and retrieves chunks', () => {
    const chunks = [makeChunk(), makeChunk({ topics: ['react', 'frontend'] })]
    const saved = store.saveChunks(chunks)
    expect(saved).toBe(2)

    const stats = store.getStats()
    expect(stats.totalChunks).toBe(2)
  })

  it('looks up chunks by keyword match', () => {
    store.saveChunks([
      makeChunk({ topics: ['typescript', 'types'], entities: ['TypeScript'] }),
      makeChunk({ topics: ['python', 'django'], entities: ['Django'] }),
      makeChunk({ topics: ['typescript', 'react'], entities: ['React'] }),
    ])

    const results = store.lookup(['typescript'])
    expect(results.length).toBeGreaterThanOrEqual(2)
    // TypeScript chunks should rank higher
    expect(results[0]?.topics).toContain('typescript')
  })

  it('filters by category', () => {
    store.saveChunks([
      makeChunk({ category: 'technical', topics: ['api'] }),
      makeChunk({ category: 'tutorial', topics: ['api'] }),
    ])

    const technical = store.lookup(['api'], 'technical')
    expect(technical.length).toBe(1)
    expect(technical[0]?.category).toBe('technical')
  })

  it('respects limit parameter', () => {
    const chunks = Array.from({ length: 10 }, (_, i) =>
      makeChunk({ topics: ['common-topic'], id: `chunk-${i}` }),
    )
    store.saveChunks(chunks)

    const results = store.lookup(['common-topic'], undefined, 3)
    expect(results.length).toBe(3)
  })

  it('returns empty array for no matches', () => {
    store.saveChunks([makeChunk({ topics: ['rust'] })])
    const results = store.lookup(['python'])
    expect(results.length).toBe(0)
  })

  it('returns empty for empty keys', () => {
    store.saveChunks([makeChunk()])
    const results = store.lookup([])
    expect(results.length).toBe(0)
  })

  it('gets all keys', () => {
    store.saveChunks([
      makeChunk({ topics: ['typescript'], entities: ['Node.js'], questions: ['What is TS?'] }),
      makeChunk({ topics: ['python'], entities: ['Django'] }),
    ])

    const keys = store.getAllKeys()
    expect(keys.has('typescript')).toBe(true)
    expect(keys.has('python')).toBe(true)
    expect(keys.has('node.js')).toBe(true)
    expect(keys.has('django')).toBe(true)
    expect(keys.has('what is ts?')).toBe(true)
  })

  it('deletes by source', () => {
    store.saveChunks([
      makeChunk({ source: '/a.md' }),
      makeChunk({ source: '/a.md' }),
      makeChunk({ source: '/b.md' }),
    ])

    expect(store.getStats().totalChunks).toBe(3)

    const deleted = store.deleteBySource('/a.md')
    expect(deleted).toBe(2)
    expect(store.getStats().totalChunks).toBe(1)
  })

  it('persists data to disk', () => {
    store.saveChunks([makeChunk()])

    // Create a new store pointing to the same directory
    const store2 = new JsonStore(tmpDir)
    expect(store2.getStats().totalChunks).toBe(1)
  })

  it('reports correct stats', () => {
    store.saveChunks([
      makeChunk({ source: '/a.md', topics: ['api', 'rest'] }),
      makeChunk({ source: '/a.md', topics: ['api', 'graphql'] }),
      makeChunk({ source: '/b.md', topics: ['database', 'sql'] }),
    ])

    const stats = store.getStats()
    expect(stats.totalChunks).toBe(3)
    expect(stats.totalSources).toBe(2)
    expect(stats.topTopics).toContain('api')
  })

  it('handles duplicate chunk ids by overwriting', () => {
    const id = 'fixed-id'
    store.saveChunks([makeChunk({ id, content: 'version 1' })])
    store.saveChunks([makeChunk({ id, content: 'version 2' })])

    // Should still have only 1 chunk (overwritten)
    expect(store.getStats().totalChunks).toBe(1)
  })

  it('handles content-based partial matching in lookup', () => {
    store.saveChunks([
      makeChunk({
        topics: ['general'],
        content: 'This document explains how middleware works in Express.js applications.',
      }),
    ])

    const results = store.lookup(['middleware'])
    expect(results.length).toBe(1)
  })
})
