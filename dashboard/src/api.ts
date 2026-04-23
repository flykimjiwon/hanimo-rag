const API_BASE = '/api'

function getApiKey(): string {
  return localStorage.getItem('hanimo-rag-api-key') || ''
}

async function apiFetch(path: string, options: RequestInit = {}) {
  const headers = new Headers(options.headers)
  const key = getApiKey()
  if (key) headers.set('X-API-Key', key)
  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json')
  }
  const res = await fetch(`${API_BASE}${path}`, { ...options, headers })
  if (!res.ok) throw new Error(`API Error: ${res.status}`)
  return res.json()
}

export const api = {
  getDocuments: () => apiFetch('/documents'),
  uploadDocument: (file: File) => {
    const form = new FormData()
    form.append('file', file)
    const headers: Record<string, string> = {}
    const key = getApiKey()
    if (key) headers['X-API-Key'] = key
    return fetch(`${API_BASE}/ingest`, { method: 'POST', headers, body: form }).then(r => r.json())
  },
  deleteDocument: (id: string) => apiFetch(`/documents/${id}`, { method: 'DELETE' }),
  search: (query: string, mode: string, topK: number, collectionId?: string) =>
    apiFetch('/search', { method: 'POST', body: JSON.stringify({ query, mode, top_k: topK, collection_id: collectionId || null }) }),
  getGraph: (ns = 'default') => apiFetch(`/graph?namespace=${ns}`),
  getSettings: () => apiFetch('/settings'),
  updateSettings: (data: Record<string, unknown>) =>
    apiFetch('/settings', { method: 'PUT', body: JSON.stringify(data) }),

  getCollections: () => apiFetch('/collections'),
  getCollection: (id: string) => apiFetch(`/collections/${id}`),
  createCollection: (name: string, description = '') =>
    apiFetch('/collections', { method: 'POST', body: JSON.stringify({ name, description }) }),
  deleteCollection: (id: string) => apiFetch(`/collections/${id}`, { method: 'DELETE' }),
  addDocsToCollection: (collId: string, docIds: string[]) =>
    apiFetch(`/collections/${collId}/documents`, { method: 'POST', body: JSON.stringify({ document_ids: docIds }) }),
  removeDocsFromCollection: (collId: string, docIds: string[]) =>
    apiFetch(`/collections/${collId}/documents`, { method: 'DELETE', body: JSON.stringify({ document_ids: docIds }) }),

  getApps: () => apiFetch('/apps'),
  getApp: (id: string) => apiFetch(`/apps/${id}`),
  createApp: (data: Record<string, unknown>) => apiFetch('/apps', { method: 'POST', body: JSON.stringify(data) }),
  updateApp: (id: string, data: Record<string, unknown>) => apiFetch(`/apps/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteApp: (id: string) => apiFetch(`/apps/${id}`, { method: 'DELETE' }),
}
