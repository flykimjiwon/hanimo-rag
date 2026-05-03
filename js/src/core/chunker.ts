/**
 * hanimo-rag v2 — Recursive Text Chunker
 *
 * Splits text into overlapping chunks using a hierarchy of separators,
 * similar to LangChain's RecursiveCharacterTextSplitter.
 */

const DEFAULT_SEPARATORS = [
  '\n\n\n',   // triple newline (section breaks)
  '\n\n',     // paragraph breaks
  '\n',       // line breaks
  '. ',       // sentence breaks
  '? ',       // question breaks
  '! ',       // exclamation breaks
  '; ',       // semicolon breaks
  ', ',       // comma breaks
  ' ',        // word breaks
]

export interface ChunkerOptions {
  chunkSize: number
  chunkOverlap: number
  separators?: string[]
}

export function chunkText(
  text: string,
  options: ChunkerOptions = { chunkSize: 1000, chunkOverlap: 200 },
): string[] {
  const { chunkSize, chunkOverlap, separators = DEFAULT_SEPARATORS } = options

  if (!text || text.trim().length === 0) {
    return []
  }

  if (text.length <= chunkSize) {
    return [text.trim()]
  }

  return recursiveSplit(text, chunkSize, chunkOverlap, separators)
}

function recursiveSplit(
  text: string,
  chunkSize: number,
  chunkOverlap: number,
  separators: string[],
): string[] {
  const chunks: string[] = []

  // Find the best separator for this text
  let bestSep = ''
  for (const sep of separators) {
    if (text.includes(sep)) {
      bestSep = sep
      break
    }
  }

  // If no separator found, split by character position
  if (!bestSep) {
    return splitBySize(text, chunkSize, chunkOverlap)
  }

  const parts = text.split(bestSep)
  let currentChunk = ''

  for (const part of parts) {
    const candidate = currentChunk
      ? currentChunk + bestSep + part
      : part

    if (candidate.length <= chunkSize) {
      currentChunk = candidate
    } else {
      // Current chunk is full
      if (currentChunk) {
        const trimmed = currentChunk.trim()
        if (trimmed.length > 0) {
          chunks.push(trimmed)
        }
      }

      // If this single part exceeds chunk size, recurse with next separator level
      if (part.length > chunkSize) {
        const remainingSeps = separators.slice(separators.indexOf(bestSep) + 1)
        if (remainingSeps.length > 0) {
          const subChunks = recursiveSplit(part, chunkSize, chunkOverlap, remainingSeps)
          chunks.push(...subChunks)
        } else {
          chunks.push(...splitBySize(part, chunkSize, chunkOverlap))
        }
        currentChunk = ''
      } else {
        currentChunk = part
      }
    }
  }

  // Don't forget the last chunk
  if (currentChunk.trim().length > 0) {
    chunks.push(currentChunk.trim())
  }

  // Apply overlap: merge small trailing/leading content between chunks
  return applyOverlap(chunks, chunkOverlap)
}

function splitBySize(text: string, chunkSize: number, chunkOverlap: number): string[] {
  const chunks: string[] = []
  let start = 0

  while (start < text.length) {
    const end = Math.min(start + chunkSize, text.length)
    const chunk = text.slice(start, end).trim()
    if (chunk.length > 0) {
      chunks.push(chunk)
    }
    start = end - chunkOverlap
    if (start >= text.length || end === text.length) break
  }

  return chunks
}

function applyOverlap(chunks: string[], overlap: number): string[] {
  if (chunks.length <= 1 || overlap <= 0) {
    return chunks
  }

  const result: string[] = []

  for (let i = 0; i < chunks.length; i++) {
    let chunk = chunks[i] ?? ''

    if (i > 0) {
      // Prepend overlap from previous chunk
      const prev = chunks[i - 1] ?? ''
      if (prev.length > overlap) {
        const overlapText = prev.slice(-overlap)
        // Only prepend if it doesn't make the chunk too large
        if (chunk.length + overlapText.length <= chunk.length * 2) {
          chunk = overlapText + ' ' + chunk
        }
      }
    }

    result.push(chunk.trim())
  }

  return result
}
