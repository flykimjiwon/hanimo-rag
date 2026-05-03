import { useState, useEffect } from 'react'
import { Search as SearchIcon, Loader } from 'lucide-react'
import { api } from '../api'
import { useI18n } from '../i18n'

interface Result { chunk_id: string; content: string; score: number; match_type: string; file_name: string }
interface Coll { id: string; name: string; document_count: number }

export default function Search() {
  const { t } = useI18n()
  const [q, setQ] = useState(''); const [mode, setMode] = useState('hybrid'); const [topK, setTopK] = useState(10)
  const [collId, setCollId] = useState(''); const [colls, setColls] = useState<Coll[]>([])
  const [results, setResults] = useState<Result[]>([]); const [loading, setLoading] = useState(false); const [ms, setMs] = useState(0)
  useEffect(() => { api.getCollections().then(d => setColls(d.collections || [])).catch(() => {}) }, [])
  const search = async () => { if (!q.trim()) return; setLoading(true); const t0 = Date.now(); try { const d = await api.search(q, mode, topK, collId || undefined); setResults(d.results || []); setMs(Date.now() - t0) } finally { setLoading(false) } }
  const sel = "px-4 py-3 rounded-2xl text-sm bg-white dark:bg-[#18181B] border border-slate-200 dark:border-[#3F3F46] text-slate-700 dark:text-[#FAFAFA] focus:ring-2 focus:ring-blue-500 outline-none"
  const modes = [{ v: 'hybrid', l: 'Hybrid' }, { v: 'vector', l: 'Vector' }, { v: 'fts', l: 'FTS' }, { v: 'graph', l: 'Graph' }]

  return (
    <div className="max-w-4xl mx-auto">
      <h2 data-heading className="text-2xl font-bold text-slate-900 dark:text-[#FAFAFA] mb-6">{t('search.title')}</h2>
      <div className="bg-white dark:bg-[#18181B] rounded-3xl border border-slate-200/60 dark:border-[#27272A] p-6 mb-6 shadow-sm">
        <div className="flex gap-3 mb-4">
          <input value={q} onChange={e => setQ(e.target.value)} onKeyDown={e => e.key === 'Enter' && search()} placeholder={t('search.placeholder')}
            className="flex-1 px-5 py-4 rounded-2xl text-sm bg-slate-50 dark:bg-[#27272A] border border-slate-200 dark:border-[#3F3F46] text-slate-900 dark:text-[#FAFAFA] focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all" />
          <button onClick={search} disabled={loading}
            className="px-8 py-4 bg-blue-600 text-white rounded-2xl text-sm hover:bg-blue-500 disabled:opacity-50 font-bold transition-all shadow-sm flex items-center gap-2">
            {loading ? <Loader size={16} className="animate-spin" /> : <SearchIcon size={16} />}
            {t('search.button')}
          </button>
        </div>
        <div className="flex gap-2 flex-wrap items-center">
          <div className="flex bg-slate-100 dark:bg-[#27272A] rounded-2xl p-1">{modes.map(m => (
            <button key={m.v} onClick={() => setMode(m.v)}
              className={`px-4 py-1.5 rounded-xl text-xs font-semibold transition-all ${mode === m.v ? 'bg-white dark:bg-[#3F3F46] text-slate-900 dark:text-[#FAFAFA] shadow-sm' : 'text-slate-500 dark:text-[#A1A1AA]'}`}>
              {m.l}
            </button>
          ))}</div>
          <select value={collId} onChange={e => setCollId(e.target.value)} className={sel}>
            <option value="">{t('search.all')}</option>
            {colls.map(c => <option key={c.id} value={c.id}>{c.name} ({c.document_count})</option>)}
          </select>
          <div className="flex items-center gap-2 text-xs text-slate-400 dark:text-[#A1A1AA] ml-auto">
            <span className="font-semibold">Top-K: {topK}</span>
            <input type="range" min={1} max={20} value={topK} onChange={e => setTopK(+e.target.value)} className="accent-blue-500 w-20" />
          </div>
        </div>
      </div>
      {results.length > 0 && <p className="text-xs text-slate-400 dark:text-[#A1A1AA] mb-4 font-medium">{results.length}{t('search.results')}{ms}ms</p>}
      <div className="space-y-3">
        {results.map((r, i) => (
          <div key={r.chunk_id || i} className="bg-white dark:bg-[#18181B] rounded-2xl border border-slate-200/60 dark:border-[#27272A] p-6 hover:shadow-md transition-all">
            <div className="flex items-center gap-2 mb-3">
              <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400">{r.match_type}</span>
              <span className="text-xs text-slate-400 dark:text-[#A1A1AA]">{r.file_name?.split('/').pop()}</span>
              <div className="flex-1" />
              <span className="text-sm font-bold text-blue-600 dark:text-blue-400 tabular-nums">{(r.score * 100).toFixed(1)}%</span>
            </div>
            <p className="text-sm text-slate-700 dark:text-[#FAFAFA]/80 leading-relaxed">{r.content}</p>
          </div>
        ))}
        {results.length === 0 && !loading && q && (
          <div className="text-center py-16">
            <SearchIcon size={48} className="mx-auto mb-4 text-slate-300 dark:text-[#3F3F46]" />
            <p className="text-slate-400 dark:text-[#A1A1AA]">{t('search.no_results')}</p>
          </div>
        )}
        {!q && results.length === 0 && (
          <div className="text-center py-16">
            <SearchIcon size={48} className="mx-auto mb-4 text-slate-300 dark:text-[#3F3F46]" />
            <p className="text-slate-400 dark:text-[#A1A1AA]">{t('search.placeholder')}</p>
          </div>
        )}
      </div>
    </div>
  )
}
