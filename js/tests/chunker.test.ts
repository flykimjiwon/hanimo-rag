/**
 * hanimo-rag v2 — Chunker Tests
 */

import { describe, expect, it } from 'vitest'
import { chunkText } from '../src/core/chunker.js'

describe('chunkText', () => {
  it('returns empty array for empty text', () => {
    expect(chunkText('')).toEqual([])
    expect(chunkText('   ')).toEqual([])
  })

  it('returns single chunk for short text', () => {
    const text = 'Hello, this is a short text.'
    const chunks = chunkText(text, { chunkSize: 1000, chunkOverlap: 100 })
    expect(chunks).toEqual([text])
  })

  it('splits long text into multiple chunks', () => {
    const paragraph = 'This is a paragraph of text. '.repeat(50)
    const chunks = chunkText(paragraph, { chunkSize: 200, chunkOverlap: 50 })
    expect(chunks.length).toBeGreaterThan(1)
  })

  it('respects chunk size limit approximately', () => {
    const text = 'Word '.repeat(500) // ~2500 chars
    const chunks = chunkText(text, { chunkSize: 300, chunkOverlap: 50 })

    for (const chunk of chunks) {
      // Allow some flexibility due to overlap
      expect(chunk.length).toBeLessThan(600)
    }
  })

  it('splits on paragraph boundaries first', () => {
    const text = 'Paragraph one content here.\n\nParagraph two content here.\n\nParagraph three content here.'
    const chunks = chunkText(text, { chunkSize: 40, chunkOverlap: 0 })
    expect(chunks.length).toBeGreaterThanOrEqual(2)
  })

  it('preserves content across all chunks', () => {
    const words = Array.from({ length: 100 }, (_, i) => `word${i}`)
    const text = words.join(' ')
    const chunks = chunkText(text, { chunkSize: 100, chunkOverlap: 20 })

    // Every word from original text should appear in at least one chunk
    const allChunkText = chunks.join(' ')
    for (const word of words) {
      expect(allChunkText).toContain(word)
    }
  })

  it('handles text with only newlines as separators', () => {
    const lines = Array.from({ length: 20 }, (_, i) => `Line number ${i} with some content`)
    const text = lines.join('\n')
    const chunks = chunkText(text, { chunkSize: 200, chunkOverlap: 30 })
    expect(chunks.length).toBeGreaterThan(1)
  })

  it('handles text with no natural separators', () => {
    const text = 'a'.repeat(500)
    const chunks = chunkText(text, { chunkSize: 100, chunkOverlap: 20 })
    expect(chunks.length).toBeGreaterThan(1)
  })

  it('handles unicode text', () => {
    const text = '한국어 텍스트입니다. '.repeat(50)
    const chunks = chunkText(text, { chunkSize: 100, chunkOverlap: 20 })
    expect(chunks.length).toBeGreaterThan(1)
  })

  it('trims whitespace from chunks', () => {
    const text = '  First paragraph.  \n\n  Second paragraph.  \n\n  Third paragraph.  '
    const chunks = chunkText(text, { chunkSize: 30, chunkOverlap: 0 })

    for (const chunk of chunks) {
      expect(chunk).toBe(chunk.trim())
    }
  })

  it('applies overlap between chunks', () => {
    const sentences = Array.from({ length: 10 }, (_, i) => `Sentence ${i} has content.`)
    const text = sentences.join(' ')
    const chunksNoOverlap = chunkText(text, { chunkSize: 100, chunkOverlap: 0 })
    const chunksWithOverlap = chunkText(text, { chunkSize: 100, chunkOverlap: 30 })

    // With overlap, chunks should have more total combined length
    const totalNoOverlap = chunksNoOverlap.reduce((sum, c) => sum + c.length, 0)
    const totalWithOverlap = chunksWithOverlap.reduce((sum, c) => sum + c.length, 0)
    expect(totalWithOverlap).toBeGreaterThanOrEqual(totalNoOverlap)
  })
})
