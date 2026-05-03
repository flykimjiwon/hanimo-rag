#!/usr/bin/env node
/**
 * hanimo-rag v2 — CLI
 *
 * Usage:
 *   hanimo-rag index ./docs [--model qwen2.5:7b] [--store ./data] [--chunk-size 1000]
 *   hanimo-rag search "how to use middleware" [--model qwen2.5:7b] [--top-k 5]
 *   hanimo-rag ask "what is FastAPI?" [--model qwen2.5:7b]
 *   hanimo-rag status [--store ./data]
 *   hanimo-rag serve [--port 8080]
 *   hanimo-rag delete <source-path>
 */

import type { Config } from './types.js'

interface ParsedArgs {
  command: string
  positional: string[]
  flags: Record<string, string>
}

function parseArgs(argv: string[]): ParsedArgs {
  const args = argv.slice(2) // skip node and script path
  const command = args[0] ?? 'help'
  const positional: string[] = []
  const flags: Record<string, string> = {}

  let i = 1
  while (i < args.length) {
    const arg = args[i]
    if (!arg) { i++; continue }

    if (arg.startsWith('--')) {
      const key = arg.slice(2)
      const next = args[i + 1]
      if (next && !next.startsWith('--')) {
        flags[key] = next
        i += 2
      } else {
        flags[key] = 'true'
        i++
      }
    } else {
      positional.push(arg)
      i++
    }
  }

  return { command, positional, flags }
}

function buildConfig(flags: Record<string, string>): Config {
  const config: Config = {}

  if (flags['model']) config.model = flags['model']
  if (flags['store']) config.storePath = flags['store']
  if (flags['ollama-url']) config.ollamaBaseUrl = flags['ollama-url']
  if (flags['openai-key']) config.openaiApiKey = flags['openai-key']
  if (flags['openai-url']) config.openaiBaseUrl = flags['openai-url']
  if (flags['temperature']) config.temperature = parseFloat(flags['temperature'])
  if (flags['store-type'] === 'sqlite') config.storeType = 'sqlite'

  return config
}

function printHelp(): void {
  const help = `
hanimo-rag v2 — Agentic LiteRAG Engine

USAGE:
  hanimo-rag <command> [arguments] [options]

COMMANDS:
  index <path>          Index a file or directory
  search <query>        Search indexed documents
  ask <question>        Ask a question (RAG)
  status                Show index statistics
  serve                 Start HTTP API server
  delete <source>       Delete chunks from a source
  help                  Show this help message

OPTIONS:
  --model <name>        LLM model (default: qwen2.5:7b, or openai:gpt-4o-mini)
  --store <path>        Store directory (default: ./hanimo-rag_data)
  --store-type <type>   Store type: json or sqlite (default: json)
  --ollama-url <url>    Ollama base URL (default: http://localhost:11434)
  --openai-key <key>    OpenAI API key
  --openai-url <url>    OpenAI-compatible base URL
  --temperature <n>     LLM temperature (default: 0.1)
  --chunk-size <n>      Chunk size in characters (default: 1000)
  --chunk-overlap <n>   Chunk overlap in characters (default: 200)
  --top-k <n>           Number of results (default: 5)
  --max-rounds <n>      Max search rounds (default: 3)
  --port <n>            Server port (default: 3737)

EXAMPLES:
  hanimo-rag index ./docs --model qwen2.5:7b
  hanimo-rag search "authentication flow" --top-k 10
  hanimo-rag ask "How does the middleware work?"
  hanimo-rag serve --port 8080
`.trim()

  console.log(help)
}

async function main(): Promise<void> {
  const { command, positional, flags } = parseArgs(process.argv)

  if (command === 'help' || flags['help']) {
    printHelp()
    return
  }

  // Lazy import to avoid loading everything for help
  const { HanimoRAG } = await import('./hanimo-rag.js')
  const config = buildConfig(flags)

  switch (command) {
    case 'index': {
      const inputPath = positional[0]
      if (!inputPath) {
        console.error('Error: Please provide a path to index.')
        console.error('Usage: hanimo-rag index <path>')
        process.exit(1)
      }

      console.log(`Indexing: ${inputPath}`)
      const rag = new HanimoRAG(config)
      const chunkSize = flags['chunk-size'] ? parseInt(flags['chunk-size'], 10) : undefined
      const chunkOverlap = flags['chunk-overlap'] ? parseInt(flags['chunk-overlap'], 10) : undefined

      const result = await rag.index(inputPath, { chunkSize, chunkOverlap })

      console.log(`\nIndexed ${result.indexed} chunks from ${result.files.length} files:`)
      for (const f of result.files) {
        console.log(`  ${f.file} -> ${f.chunks} chunks`)
      }
      break
    }

    case 'search': {
      const query = positional[0]
      if (!query) {
        console.error('Error: Please provide a search query.')
        console.error('Usage: hanimo-rag search "<query>"')
        process.exit(1)
      }

      const rag = new HanimoRAG(config)
      const topK = flags['top-k'] ? parseInt(flags['top-k'], 10) : undefined
      const maxRounds = flags['max-rounds'] ? parseInt(flags['max-rounds'], 10) : undefined

      console.log(`Searching: "${query}"\n`)
      const results = await rag.search(query, { topK, maxRounds })

      if (results.length === 0) {
        console.log('No results found.')
      } else {
        for (const [i, r] of results.entries()) {
          console.log(`--- Result ${i + 1} (score: ${r.score.toFixed(2)}) ---`)
          console.log(`Source: ${r.source}`)
          console.log(`Summary: ${r.summary}`)
          console.log(`Matched: ${r.matchedKeys.join(', ')}`)
          console.log(`Content: ${r.content.slice(0, 200)}${r.content.length > 200 ? '...' : ''}`)
          console.log()
        }
      }
      break
    }

    case 'ask': {
      const question = positional[0]
      if (!question) {
        console.error('Error: Please provide a question.')
        console.error('Usage: hanimo-rag ask "<question>"')
        process.exit(1)
      }

      const rag = new HanimoRAG(config)
      const topK = flags['top-k'] ? parseInt(flags['top-k'], 10) : undefined

      console.log(`Question: "${question}"\n`)
      const answer = await rag.ask(question, { topK })
      console.log(`Answer:\n${answer}`)
      break
    }

    case 'status': {
      const rag = new HanimoRAG(config)
      const stats = rag.stats()

      console.log('hanimo-rag Index Status:')
      console.log(`  Total chunks: ${stats.totalChunks}`)
      console.log(`  Total sources: ${stats.totalSources}`)
      console.log(`  Top topics: ${stats.topTopics.join(', ') || '(none)'}`)
      break
    }

    case 'delete': {
      const source = positional[0]
      if (!source) {
        console.error('Error: Please provide a source path to delete.')
        console.error('Usage: hanimo-rag delete <source-path>')
        process.exit(1)
      }

      const rag = new HanimoRAG(config)
      const deleted = rag.deleteSource(source)
      console.log(`Deleted ${deleted} chunks from source: ${source}`)
      break
    }

    case 'serve': {
      const port = flags['port'] ? parseInt(flags['port'], 10) : 3737
      const { startServer } = await import('./server.js')
      await startServer(config, port)
      break
    }

    default: {
      console.error(`Unknown command: ${command}`)
      printHelp()
      process.exit(1)
    }
  }
}

main().catch((err: unknown) => {
  const message = err instanceof Error ? err.message : String(err)
  console.error(`Error: ${message}`)
  process.exit(1)
})
