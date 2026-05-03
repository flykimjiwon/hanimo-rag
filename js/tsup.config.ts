import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.ts', 'src/cli.ts', 'src/server.ts'],
  format: ['esm', 'cjs'],
  dts: true,
  clean: true,
  splitting: true,
  sourcemap: true,
  external: ['better-sqlite3'],
  banner: ({ format }) => {
    if (format === 'esm') {
      return {
        js: '// hanimo-rag v2 — Agentic LiteRAG Engine',
      }
    }
    return {}
  },
})
