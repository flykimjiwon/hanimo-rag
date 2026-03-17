import { useState, useEffect, useCallback } from 'react'
import { Plus, X, FolderOpen, ArrowRight } from 'lucide-react'
import { api } from '../api'
import { useI18n } from '../i18n'

interface Coll { id: string; name: string; description: string; document_count: number }
interface Doc { id: string; original_name: string }

export default function Collections() {
  const { t } = useI18n()
  const [colls, setColls] = useState<Coll[]>([]); const [allDocs, setAllDocs] = useState<Doc[]>([])
  const [sel, setSel] = useState<string | null>(null); const [cDocs, setCDocs] = useState<Doc[]>([])
  const [name, setName] = useState(''); const [desc, setDesc] = useState('')
  const load = useCallback(() => { api.getCollections().then(d => setColls(d.collections || [])); api.getDocuments().then(d => setAllDocs(d.documents || [])) }, [])
  useEffect(() => { load() }, [load])
  useEffect(() => { if (sel) api.getCollection(sel).then(d => setCDocs(d.documents || [])); else setCDocs([]) }, [sel])
  const ids = new Set(cDocs.map(d => d.id)); const avail = allDocs.filter(d => !ids.has(d.id))
  const inp = "w-full px-4 py-3 rounded-2xl text-sm bg-slate-50 dark:bg-[#27272A] border border-slate-200 dark:border-[#3F3F46] text-slate-900 dark:text-[#FAFAFA] focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"

  return (
    <div className="max-w-5xl mx-auto">
      <h2 data-heading className="text-2xl font-bold text-slate-900 dark:text-[#FAFAFA] mb-6">{t('coll.title')}</h2>
      <div className="flex gap-6">
        <div className="w-80 space-y-4">
          <div className="bg-white dark:bg-[#18181B] rounded-2xl border border-slate-200/60 dark:border-[#27272A] p-5 space-y-3">
            <input value={name} onChange={e => setName(e.target.value)} placeholder={t('coll.name')} className={inp} />
            <input value={desc} onChange={e => setDesc(e.target.value)} placeholder={t('coll.desc')} className={inp} />
            <button onClick={async () => { if (!name.trim()) return; await api.createCollection(name, desc); setName(''); setDesc(''); load() }}
              className="w-full py-3 bg-blue-600 text-white rounded-2xl text-sm hover:bg-blue-500 font-semibold transition-all shadow-sm">{t('coll.create')}</button>
          </div>
          {colls.map(c => (
            <div key={c.id} onClick={() => setSel(c.id)}
              className={`bg-white dark:bg-[#18181B] rounded-2xl border p-5 cursor-pointer transition-all ${sel === c.id ? 'border-blue-400 dark:border-blue-500 shadow-md shadow-blue-100 dark:shadow-blue-950/30' : 'border-slate-200/60 dark:border-[#27272A] hover:border-slate-300'}`}>
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-bold text-sm text-slate-900 dark:text-[#FAFAFA]">{c.name}</p>
                  {c.description && <p className="text-xs text-slate-400 dark:text-[#A1A1AA] mt-0.5">{c.description}</p>}
                </div>
                <button onClick={e => { e.stopPropagation(); if (confirm(t('coll.confirm'))) { api.deleteCollection(c.id); if (sel === c.id) setSel(null); load() } }}
                  className="w-7 h-7 rounded-full flex items-center justify-center text-slate-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-950/20 transition-all">
                  <X size={14} />
                </button>
              </div>
              <div className="mt-3">
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400">
                  {c.document_count}{t('coll.docs')}
                </span>
              </div>
            </div>
          ))}
          {colls.length === 0 && (
            <div className="text-center py-10">
              <FolderOpen size={40} className="mx-auto mb-2 text-slate-300 dark:text-[#3F3F46]" />
              <p className="text-sm text-slate-400 dark:text-[#A1A1AA]">{t('coll.empty')}</p>
            </div>
          )}
        </div>

        <div className="flex-1">
          {sel ? (
            <div className="space-y-6">
              <div className="bg-white dark:bg-[#18181B] rounded-2xl border border-slate-200/60 dark:border-[#27272A] p-6">
                <h3 data-heading className="font-bold text-slate-900 dark:text-[#FAFAFA] mb-4">{t('coll.in')}</h3>
                {cDocs.length === 0 ? <p className="text-sm text-slate-400 dark:text-[#A1A1AA] py-4">{t('coll.no_docs')}</p> :
                  <div className="space-y-2">{cDocs.map(d => (
                    <div key={d.id} className="flex items-center justify-between bg-slate-50 dark:bg-[#27272A] rounded-xl px-4 py-3">
                      <span className="text-sm text-slate-700 dark:text-[#FAFAFA] font-medium">{d.original_name}</span>
                      <button onClick={async () => { await api.removeDocsFromCollection(sel, [d.id]); api.getCollection(sel).then(d2 => setCDocs(d2.documents || [])); load() }}
                        className="text-xs text-red-500 font-semibold px-3 py-1 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/20 transition-all">{t('coll.remove')}</button>
                    </div>
                  ))}</div>}
              </div>
              <div className="bg-white dark:bg-[#18181B] rounded-2xl border border-slate-200/60 dark:border-[#27272A] p-6">
                <h3 data-heading className="font-bold text-slate-900 dark:text-[#FAFAFA] mb-4">{t('coll.available')}</h3>
                {avail.length === 0 ? <p className="text-sm text-slate-400 dark:text-[#A1A1AA]">{t('coll.all_in')}</p> :
                  <div className="space-y-2">{avail.map(d => (
                    <div key={d.id} className="flex items-center justify-between bg-slate-50 dark:bg-[#27272A] rounded-xl px-4 py-3 hover:bg-blue-50 dark:hover:bg-blue-950/10 transition-all">
                      <span className="text-sm text-slate-500 dark:text-[#A1A1AA]">{d.original_name}</span>
                      <button onClick={async () => { await api.addDocsToCollection(sel, [d.id]); api.getCollection(sel).then(d2 => setCDocs(d2.documents || [])); load() }}
                        className="flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 font-semibold px-3 py-1 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-950/30 transition-all">
                        <Plus size={12} /> {t('coll.add')}
                      </button>
                    </div>
                  ))}</div>}
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <ArrowRight size={48} className="mx-auto mb-4 text-slate-300 dark:text-[#3F3F46]" />
                <p className="text-slate-400 dark:text-[#A1A1AA]">{t('coll.select')}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
