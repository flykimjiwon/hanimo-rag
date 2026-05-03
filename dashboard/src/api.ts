// hanimo-rag v2 API client
// Base URL is configurable via VITE_API_BASE env var

export const API_BASE = (import.meta.env.VITE_API_BASE as string) ?? 'http://localhost:8009'

function getApiKey(): string {
  return localStorage.getItem('hanimo-rag-api-key') || ''
}

async function apiFetch(path: string, options: RequestInit = {}) {
  const headers = new Headers(options.headers as HeadersInit)
  const key = getApiKey()
  if (key) headers.set('X-API-Key', key)
  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json')
  }
  const res = await fetch(`${API_BASE}${path}`, { ...options, headers })
  if (!res.ok) throw new Error(`API Error ${res.status}: ${await res.text()}`)
  return res.json()
}

// ── Status ──────────────────────────────────────────────────────────────────
export async function apiStatus() {
  return apiFetch('/health')
}

// ── Search ───────────────────────────────────────────────────────────────────
export async function apiSearch(
  query: string,
  opts?: { topK?: number; mode?: string; collectionId?: string }
) {
  return apiFetch('/api/search', {
    method: 'POST',
    body: JSON.stringify({
      query,
      mode: opts?.mode ?? 'hybrid',
      top_k: opts?.topK ?? 5,
      collection_id: opts?.collectionId ?? null,
    }),
  })
}

// ── RAG generate ─────────────────────────────────────────────────────────────
export async function apiAsk(
  question: string,
  opts?: { topK?: number; collectionId?: string }
) {
  return apiFetch('/api/generate', {
    method: 'POST',
    body: JSON.stringify({
      query: question,
      top_k: opts?.topK ?? 5,
      collection_id: opts?.collectionId ?? null,
    }),
  })
}

// ── Documents ─────────────────────────────────────────────────────────────────
export async function apiGetDocuments() {
  return apiFetch('/api/documents')
}

export async function apiIngest(file: File) {
  const form = new FormData()
  form.append('file', file)
  const headers: Record<string, string> = {}
  const key = getApiKey()
  if (key) headers['X-API-Key'] = key
  const res = await fetch(`${API_BASE}/api/ingest`, { method: 'POST', headers, body: form })
  if (!res.ok) throw new Error(`Ingest error ${res.status}`)
  return res.json()
}

export async function apiDeleteDocument(id: string) {
  return apiFetch(`/api/documents/${id}`, { method: 'DELETE' })
}

// ── Collections ───────────────────────────────────────────────────────────────
export async function apiGetCollections() {
  return apiFetch('/api/collections')
}

export async function apiCreateCollection(name: string, description = '') {
  return apiFetch('/api/collections', {
    method: 'POST',
    body: JSON.stringify({ name, description }),
  })
}

export async function apiDeleteCollection(id: string) {
  return apiFetch(`/api/collections/${id}`, { method: 'DELETE' })
}

export async function apiAddDocsToCollection(collId: string, docIds: string[]) {
  return apiFetch(`/api/collections/${collId}/documents`, {
    method: 'POST',
    body: JSON.stringify({ document_ids: docIds }),
  })
}

// ── Apps ──────────────────────────────────────────────────────────────────────
export async function apiGetApps() {
  return apiFetch('/api/apps')
}

export async function apiCreateApp(data: Record<string, unknown>) {
  return apiFetch('/api/apps', { method: 'POST', body: JSON.stringify(data) })
}

export async function apiUpdateApp(id: string, data: Record<string, unknown>) {
  return apiFetch(`/api/apps/${id}`, { method: 'PUT', body: JSON.stringify(data) })
}

export async function apiDeleteApp(id: string) {
  return apiFetch(`/api/apps/${id}`, { method: 'DELETE' })
}

// ── Settings ──────────────────────────────────────────────────────────────────
export async function apiGetSettings() {
  return apiFetch('/api/settings')
}

export async function apiUpdateSettings(data: Record<string, unknown>) {
  return apiFetch('/api/settings', { method: 'PUT', body: JSON.stringify(data) })
}

// TODO: wire real data hooks — replace MOCK_* constants in App.tsx
// with useEffect calls to apiGetDocuments / apiGetCollections / apiGetApps
