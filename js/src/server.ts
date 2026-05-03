/**
 * hanimo-rag v2 — HTTP API Server
 *
 * Simple JSON API using Node.js built-in http module.
 * No express or other HTTP framework needed.
 *
 * Endpoints:
 *   POST /index   - Index a file or directory
 *   POST /search  - Search indexed documents
 *   POST /ask     - Ask a question (RAG)
 *   GET  /stats   - Get index statistics
 *   DELETE /source - Delete chunks from a source
 */

import * as http from 'node:http'
import { HanimoRAG } from './hanimo-rag.js'
import type { Config } from './types.js'

export { HanimoRAG } from './hanimo-rag.js'
export type { Config } from './types.js'

interface JsonBody {
  [key: string]: unknown
}

function readBody(req: http.IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = []
    req.on('data', (chunk: Buffer) => chunks.push(chunk))
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf-8')))
    req.on('error', reject)
  })
}

function sendJson(res: http.ServerResponse, status: number, data: unknown): void {
  const body = JSON.stringify(data, null, 2)
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  })
  res.end(body)
}

function sendError(res: http.ServerResponse, status: number, message: string): void {
  sendJson(res, status, { error: message })
}

async function parseJsonBody(req: http.IncomingMessage): Promise<JsonBody> {
  const raw = await readBody(req)
  if (!raw.trim()) return {}
  try {
    return JSON.parse(raw) as JsonBody
  } catch {
    throw new Error('Invalid JSON in request body')
  }
}

export function createServer(config?: Config): http.Server {
  const rag = new HanimoRAG(config)

  const server = http.createServer(async (req, res) => {
    const url = req.url ?? '/'
    const method = req.method ?? 'GET'

    // CORS preflight
    if (method === 'OPTIONS') {
      res.writeHead(204, {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      })
      res.end()
      return
    }

    try {
      // POST /index
      if (url === '/index' && method === 'POST') {
        const body = await parseJsonBody(req)
        const inputPath = body['path']
        if (typeof inputPath !== 'string') {
          sendError(res, 400, 'Missing "path" field in request body')
          return
        }
        const chunkSize = typeof body['chunkSize'] === 'number' ? body['chunkSize'] : undefined
        const chunkOverlap = typeof body['chunkOverlap'] === 'number' ? body['chunkOverlap'] : undefined

        const result = await rag.index(inputPath, { chunkSize, chunkOverlap })
        sendJson(res, 200, result)
        return
      }

      // POST /search
      if (url === '/search' && method === 'POST') {
        const body = await parseJsonBody(req)
        const query = body['query']
        if (typeof query !== 'string') {
          sendError(res, 400, 'Missing "query" field in request body')
          return
        }
        const topK = typeof body['topK'] === 'number' ? body['topK'] : undefined
        const maxRounds = typeof body['maxRounds'] === 'number' ? body['maxRounds'] : undefined

        const results = await rag.search(query, { topK, maxRounds })
        sendJson(res, 200, { results })
        return
      }

      // POST /ask
      if (url === '/ask' && method === 'POST') {
        const body = await parseJsonBody(req)
        const question = body['question']
        if (typeof question !== 'string') {
          sendError(res, 400, 'Missing "question" field in request body')
          return
        }
        const topK = typeof body['topK'] === 'number' ? body['topK'] : undefined

        const answer = await rag.ask(question, { topK })
        sendJson(res, 200, { answer })
        return
      }

      // GET /stats
      if (url === '/stats' && method === 'GET') {
        const stats = rag.stats()
        sendJson(res, 200, stats)
        return
      }

      // DELETE /source
      if (url === '/source' && method === 'DELETE') {
        const body = await parseJsonBody(req)
        const source = body['source']
        if (typeof source !== 'string') {
          sendError(res, 400, 'Missing "source" field in request body')
          return
        }

        const deleted = rag.deleteSource(source)
        sendJson(res, 200, { deleted })
        return
      }

      // Health check
      if (url === '/health' && method === 'GET') {
        sendJson(res, 200, { status: 'ok', version: '2.0.0' })
        return
      }

      sendError(res, 404, `Not found: ${method} ${url}`)
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      console.error(`Server error: ${message}`)
      sendError(res, 500, message)
    }
  })

  return server
}

export async function startServer(config?: Config, port: number = 3737): Promise<http.Server> {
  const server = createServer(config)

  return new Promise((resolve) => {
    server.listen(port, () => {
      console.log(`hanimo-rag server running on http://localhost:${port}`)
      console.log(`
Endpoints:
  POST /index    - Index files    { "path": "./docs" }
  POST /search   - Search         { "query": "..." }
  POST /ask      - Ask question   { "question": "..." }
  GET  /stats    - Index stats
  DELETE /source - Delete source  { "source": "..." }
  GET  /health   - Health check
`)
      resolve(server)
    })
  })
}
