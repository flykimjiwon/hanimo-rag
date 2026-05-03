/**
 * hanimo-rag v2 — Store Factory
 */

import type { ResolvedConfig } from '../types.js'
import type { StoreBase } from './base.js'
import { JsonStore } from './json-store.js'

export { StoreBase } from './base.js'

export function createStore(config: ResolvedConfig): StoreBase {
  if (config.storeType === 'sqlite') {
    // Attempt dynamic import of better-sqlite3
    // This keeps it optional — falls back to JSON if not installed
    try {
      // For now, sqlite store is a placeholder that falls back to JSON
      // A full SQLite implementation can be added when needed
      console.warn(
        'SQLite store requested but not yet implemented. Falling back to JSON store.',
      )
      return new JsonStore(config.storePath)
    } catch {
      console.warn(
        'better-sqlite3 not installed. Falling back to JSON store. Install with: npm install better-sqlite3',
      )
      return new JsonStore(config.storePath)
    }
  }

  return new JsonStore(config.storePath)
}
