import { useState, useEffect, useCallback } from 'react'
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
  const inp = "w-full px-4 py-3 rounded-2xl text-sm bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
  return (<div className="max-w-5xl mx-auto">
    <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">{t('coll.title')}</h2>
    <div className="flex gap-6">
      <div className="w-80 space-y-4">
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200/60 dark:border-zinc-800 p-5 space-y-3">
          <input value={name} onChange={e => setName(e.target.value)} placeholder={t('coll.name')} className={inp} />
          <input value={desc} onChange={e => setDesc(e.target.value)} placeholder={t('coll.desc')} className={inp} />
          <button onClick={async () => { if (!name.trim()) return; await api.createCollection(name, desc); setName(''); setDesc(''); load() }}
            className="w-full py-3 bg-indigo-600 text-white rounded-2xl text-sm hover:bg-indigo-500 font-semibold transition-all shadow-sm">{t('coll.create')}</button>
        </div>
        {colls.map(c => (<div key={c.id} onClick={() => setSel(c.id)}
          className={`bg-white dark:bg-zinc-900 rounded-2xl border p-5 cursor-pointer transition-all ${sel === c.id ? 'border-indigo-400 dark:border-indigo-500 shadow-md shadow-indigo-100 dark:shadow-indigo-950/30' : 'border-slate-200/60 dark:border-zinc-800 hover:border-slate-300'}`}>
          <div className="flex justify-between items-center"><div><p className="font-bold text-sm text-slate-900 dark:text-white">{c.name}</p>
            {c.description && <p className="text-xs text-slate-400 dark:text-zinc-500 mt-0.5">{c.description}</p>}</div>
            <button onClick={e => { e.stopPropagation(); if (confirm(t('coll.confirm'))) { api.deleteCollection(c.id); if (sel === c.id) setSel(null); load() } }}
              className="w-7 h-7 rounded-full flex items-center justify-center text-xs text-slate-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-950/20 transition-all">{'\u2715'}</button></div>
          <div className="mt-3"><span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400">{c.document_count}{t('coll.docs')}</span></div>
        </div>))}
        {colls.length === 0 && <div className="text-center py-10"><p className="text-4xl mb-2">{'\u{1F4DA}'}</p><p className="text-sm text-slate-400 dark:text-zinc-500">{t('coll.empty')}</p></div>}
      </div>
      <div className="flex-1">{sel ? (<div className="space-y-6">
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200/60 dark:border-zinc-800 p-6">
          <h3 className="font-bold text-slate-900 dark:text-white mb-4">{t('coll.in')}</h3>
          {cDocs.length === 0 ? <p className="text-sm text-slate-400 dark:text-zinc-500 py-4">{t('coll.no_docs')}</p> :
            <div className="space-y-2">{cDocs.map(d => (<div key={d.id} className="flex items-center justify-between bg-slate-50 dark:bg-zinc-800 rounded-xl px-4 py-3">
              <span className="text-sm text-slate-700 dark:text-zinc-300 font-medium">{d.original_name}</span>
              <button onClick={async () => { await api.removeDocsFromCollection(sel, [d.id]); api.getCollection(sel).then(d2 => setCDocs(d2.documents || [])); load() }}
                className="text-xs text-red-500 font-semibold px-3 py-1 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/20 transition-all">{t('coll.remove')}</button></div>))}</div>}
        </div>
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200/60 dark:border-zinc-800 p-6">
          <h3 className="font-bold text-slate-900 dark:text-white mb-4">{t('coll.available')}</h3>
          {avail.length === 0 ? <p className="text-sm text-slate-400 dark:text-zinc-500">{t('coll.all_in')}</p> :
            <div className="space-y-2">{avail.map(d => (<div key={d.id} className="flex items-center justify-between bg-slate-50 dark:bg-zinc-800 rounded-xl px-4 py-3 hover:bg-indigo-50 dark:hover:bg-indigo-950/10 transition-all">
              <span className="text-sm text-slate-500 dark:text-zinc-400">{d.original_name}</span>
              <button onClick={async () => { await api.addDocsToCollection(sel, [d.id]); api.getCollection(sel).then(d2 => setCDocs(d2.documents || [])); load() }}
                className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold px-3 py-1 rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-950/30 transition-all">+ {t('coll.add')}</button></div>))}</div>}
        </div>
      </div>) : <div className="flex items-center justify-center h-full"><div className="text-center"><p className="text-5xl mb-4">{'\u{1F449}'}</p><p className="text-slate-400 dark:text-zinc-500">{t('coll.select')}</p></div></div>}</div>
    </div>
  </div>)
}
