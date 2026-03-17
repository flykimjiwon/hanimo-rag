import { useState, useEffect, useCallback } from 'react'
import { api } from '../api'

interface Collection { id: string; name: string; description: string; document_count: number; created_at: string }
interface Doc { id: string; original_name: string; status: string; chunk_count: number }

export default function Collections() {
  const [collections, setCollections] = useState<Collection[]>([])
  const [allDocs, setAllDocs] = useState<Doc[]>([])
  const [selected, setSelected] = useState<string | null>(null)
  const [collDocs, setCollDocs] = useState<Doc[]>([])
  const [newName, setNewName] = useState('')
  const [newDesc, setNewDesc] = useState('')

  const load = useCallback(() => {
    api.getCollections().then(d => setCollections(d.collections || []))
    api.getDocuments().then(d => setAllDocs(d.documents || []))
  }, [])

  useEffect(() => { load() }, [load])

  useEffect(() => {
    if (selected) {
      api.getCollection(selected).then(d => setCollDocs(d.documents || []))
    } else {
      setCollDocs([])
    }
  }, [selected])

  const onCreate = async () => {
    if (!newName.trim()) return
    await api.createCollection(newName, newDesc)
    setNewName(''); setNewDesc(''); load()
  }

  const onDelete = async (id: string) => {
    if (!confirm('Delete this collection?')) return
    await api.deleteCollection(id)
    if (selected === id) setSelected(null)
    load()
  }

  const onAddDoc = async (docId: string) => {
    if (!selected) return
    await api.addDocsToCollection(selected, [docId])
    api.getCollection(selected).then(d => setCollDocs(d.documents || []))
    load()
  }

  const onRemoveDoc = async (docId: string) => {
    if (!selected) return
    await api.removeDocsFromCollection(selected, [docId])
    api.getCollection(selected).then(d => setCollDocs(d.documents || []))
    load()
  }

  const collDocIds = new Set(collDocs.map(d => d.id))
  const availableDocs = allDocs.filter(d => !collDocIds.has(d.id))

  return (
    <div>
      <h2 className="text-2xl font-semibold text-gray-900 mb-6">Collections</h2>

      <div className="flex gap-6">
        {/* Left: Collection list */}
        <div className="w-72 space-y-3">
          <div className="border rounded-md p-3 space-y-2">
            <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="Collection name" className="w-full px-2 py-1 border rounded text-sm" />
            <input value={newDesc} onChange={e => setNewDesc(e.target.value)} placeholder="Description" className="w-full px-2 py-1 border rounded text-sm" />
            <button onClick={onCreate} className="w-full px-3 py-1.5 bg-gray-900 text-white rounded text-sm hover:bg-gray-700">Create</button>
          </div>

          {collections.map(c => (
            <div key={c.id} onClick={() => setSelected(c.id)}
              className={`border rounded-md p-3 cursor-pointer transition-colors ${selected === c.id ? 'border-blue-500 bg-blue-50' : 'hover:bg-gray-50'}`}>
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-medium text-sm text-gray-900">{c.name}</p>
                  {c.description && <p className="text-xs text-gray-500 mt-0.5">{c.description}</p>}
                </div>
                <button onClick={e => { e.stopPropagation(); onDelete(c.id) }} className="text-xs text-red-400 hover:text-red-600">x</button>
              </div>
              <p className="text-xs text-gray-400 mt-1">{c.document_count} docs</p>
            </div>
          ))}
          {collections.length === 0 && <p className="text-sm text-gray-400 text-center py-4">No collections yet</p>}
        </div>

        {/* Right: Document assignment */}
        <div className="flex-1">
          {selected ? (
            <div className="space-y-4">
              <h3 className="font-medium text-gray-900">Documents in collection</h3>
              {collDocs.length === 0 ? (
                <p className="text-sm text-gray-400 py-4">No documents assigned. Add from the list below.</p>
              ) : (
                <div className="space-y-1">
                  {collDocs.map(d => (
                    <div key={d.id} className="flex items-center justify-between border rounded px-3 py-2 text-sm">
                      <span className="text-gray-700">{d.original_name}</span>
                      <button onClick={() => onRemoveDoc(d.id)} className="text-xs text-red-500 hover:text-red-700">Remove</button>
                    </div>
                  ))}
                </div>
              )}

              <h3 className="font-medium text-gray-900 mt-6">Available documents</h3>
              {availableDocs.length === 0 ? (
                <p className="text-sm text-gray-400">All documents are in this collection.</p>
              ) : (
                <div className="space-y-1">
                  {availableDocs.map(d => (
                    <div key={d.id} className="flex items-center justify-between border rounded px-3 py-2 text-sm hover:bg-gray-50">
                      <span className="text-gray-600">{d.original_name}</span>
                      <button onClick={() => onAddDoc(d.id)} className="text-xs text-blue-600 hover:text-blue-800">+ Add</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-16 text-gray-400">Select a collection to manage its documents</div>
          )}
        </div>
      </div>
    </div>
  )
}
