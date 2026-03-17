import { useState, useEffect, useCallback } from 'react'
import { api } from '../api'
import { useI18n } from '../i18n'
interface Doc { id: string; original_name: string; mime_type: string; status: string; chunk_count: number; created_at: string }
const sty: Record<string, { bg: string; tx: string; lb: string }> = {
  uploaded: { bg: 'bg-slate-100 dark:bg-zinc-800', tx: 'text-slate-500 dark:text-zinc-400', lb: 'Uploaded' },
  processing: { bg: 'bg-amber-50 dark:bg-amber-950/20', tx: 'text-amber-600 dark:text-amber-400', lb: 'Processing' },
  vectorizing: { bg: 'bg-blue-50 dark:bg-blue-950/20', tx: 'text-blue-600 dark:text-blue-400', lb: 'Vectorizing' },
  vectorized: { bg: 'bg-emerald-50 dark:bg-emerald-950/20', tx: 'text-emerald-600 dark:text-emerald-400', lb: 'Ready' },
  error: { bg: 'bg-red-50 dark:bg-red-950/20', tx: 'text-red-600 dark:text-red-400', lb: 'Error' },
}
const ti: Record<string, string> = { pdf: '\u{1F4D5}', word: '\u{1F4D8}', excel: '\u{1F4D7}', powerpoint: '\u{1F4D9}', markdown: '\u{1F4DD}', text: '\u{1F4C3}' }
export default function Documents() {
  const { t } = useI18n()
  const [docs, setDocs] = useState<Doc[]>([])
  const [uploading, setUploading] = useState(false)
  const [drag, setDrag] = useState(false)
  const load = useCallback(() => { api.getDocuments().then(d => setDocs(d.documents || [])).catch(() => {}) }, [])
  useEffect(() => { load(); const i = setInterval(load, 5000); return () => clearInterval(i) }, [load])
  const upload = async (file: File) => { setUploading(true); try { await api.uploadDocument(file); load() } finally { setUploading(false) } }
  const onFile = (e: React.ChangeEvent<HTMLInputElement>) => { const f = e.target.files?.[0]; if (f) upload(f); e.target.value = '' }
  const onDrop = (e: React.DragEvent) => { e.preventDefault(); setDrag(false); const f = e.dataTransfer.files[0]; if (f) upload(f) }
  const onDel = async (id: string) => { if (!confirm(t('docs.confirm'))) return; await api.deleteDocument(id); load() }
  return (<div className="max-w-5xl mx-auto">
    <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">{t('docs.title')}</h2>
    <div onDragOver={e => { e.preventDefault(); setDrag(true) }} onDragLeave={() => setDrag(false)} onDrop={onDrop}
      className={`relative border-2 border-dashed rounded-3xl p-10 text-center mb-8 transition-all cursor-pointer ${drag ? 'border-indigo-400 bg-indigo-50/50 dark:bg-indigo-950/20' : 'border-slate-200 dark:border-zinc-700 hover:border-slate-300 dark:hover:border-zinc-600'}`}>
      <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={onFile} disabled={uploading} />
      <div className="text-4xl mb-3">{uploading ? '\u23F3' : '\u{1F4E4}'}</div>
      <p className="text-sm font-medium text-slate-700 dark:text-zinc-300">{uploading ? t('docs.uploading') : t('docs.upload')}</p>
      <p className="text-xs text-slate-400 dark:text-zinc-500 mt-1">PDF, Word, Excel, PowerPoint, Markdown, Text</p>
    </div>
    {docs.length === 0 ? <div className="text-center py-16"><p className="text-5xl mb-4">{'\u{1F4C2}'}</p><p className="text-slate-400 dark:text-zinc-500">{t('docs.empty')}</p></div> :
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">{docs.map(d => {
      const s = sty[d.status] || sty.uploaded; const cat = d.mime_type?.split('/').pop() || 'text'
      const icon = ti[Object.keys(ti).find(k => cat.includes(k)) || 'text'] || '\u{1F4C3}'
      return (<div key={d.id} className="bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200/60 dark:border-zinc-800 p-5 hover:shadow-md dark:hover:border-zinc-700 transition-all group">
        <div className="flex items-start justify-between mb-3"><span className="text-3xl">{icon}</span>
          <button onClick={() => onDel(d.id)} className="opacity-0 group-hover:opacity-100 text-xs text-red-400 hover:text-red-500 transition-all px-2 py-1 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/20">{t('docs.delete')}</button></div>
        <p className="font-semibold text-sm text-slate-900 dark:text-white truncate mb-1">{d.original_name}</p>
        <p className="text-xs text-slate-400 dark:text-zinc-500 mb-3">{cat} · {d.chunk_count} {t('docs.chunks')}</p>
        <span className={`inline-block px-3 py-1 rounded-full text-[11px] font-semibold ${s.bg} ${s.tx}`}>{s.lb}</span>
      </div>)})}</div>}
  </div>)
}
