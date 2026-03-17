import { useState, useEffect } from 'react'
import { Check } from 'lucide-react'
import { api } from '../api'
import { useI18n } from '../i18n'

export default function Settings() {
  const { t } = useI18n()
  const [s, setS] = useState<Record<string, any>>({}); const [key, setKey] = useState(localStorage.getItem('modolrag-api-key') || ''); const [ok, setOk] = useState(false)
  useEffect(() => { api.getSettings().then(setS).catch(() => {}) }, [])
  const save = async () => {
    await api.updateSettings({ chunk_size: s.chunk_size, chunk_overlap: s.chunk_overlap, embedding_model: s.embedding_model, similarity_top_k: s.similarity_top_k, similarity_threshold: s.similarity_threshold })
    localStorage.setItem('modolrag-api-key', key); setOk(true); setTimeout(() => setOk(false), 2000)
  }
  const up = (k: string, v: any) => setS(p => ({ ...p, [k]: v }))
  const ic = "w-full px-4 py-3 rounded-2xl text-sm bg-slate-50 dark:bg-[#27272A] border border-slate-200 dark:border-[#3F3F46] text-slate-900 dark:text-[#FAFAFA] focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"

  return (
    <div className="max-w-lg mx-auto">
      <h2 data-heading className="text-2xl font-bold text-slate-900 dark:text-[#FAFAFA] mb-6">{t('settings.title')}</h2>
      <div className="bg-white dark:bg-[#18181B] rounded-3xl border border-slate-200/60 dark:border-[#27272A] p-8 shadow-sm space-y-6">
        <F l={t('settings.api_key')} h={t('settings.api_hint')}><input type="password" value={key} onChange={e => setKey(e.target.value)} className={ic} /></F>
        <F l={t('settings.chunk_size')}><input type="number" value={s.chunk_size || 512} onChange={e => up('chunk_size', +e.target.value)} className={ic} min={128} max={4096} /></F>
        <F l={t('settings.chunk_overlap')}><input type="number" value={s.chunk_overlap || 51} onChange={e => up('chunk_overlap', +e.target.value)} className={ic} min={0} max={512} /></F>
        <F l={t('settings.model')}><input value={s.embedding_model || 'nomic-embed-text'} onChange={e => up('embedding_model', e.target.value)} className={ic} /></F>
        <F l={`${t('settings.top_k')}: ${s.similarity_top_k || 5}`}><input type="range" min={1} max={50} value={s.similarity_top_k || 5} onChange={e => up('similarity_top_k', +e.target.value)} className="w-full accent-blue-500 h-2 rounded-full" /></F>
        <F l={`${t('settings.threshold')}: ${s.similarity_threshold || 0.7}`}><input type="range" min={0} max={1} step={0.05} value={s.similarity_threshold || 0.7} onChange={e => up('similarity_threshold', +e.target.value)} className="w-full accent-blue-500 h-2 rounded-full" /></F>
        <div className="flex items-center gap-3 pt-2">
          <button onClick={save} className="px-8 py-3 bg-blue-600 text-white rounded-2xl text-sm hover:bg-blue-500 font-bold transition-all shadow-sm">{t('settings.save')}</button>
          {ok && <span className="flex items-center gap-1 text-sm text-emerald-500 font-bold"><Check size={16} /> {t('settings.saved')}</span>}
        </div>
      </div>
    </div>
  )
}

function F({ l, h, children }: { l: string; h?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-semibold text-slate-700 dark:text-[#FAFAFA]/80 mb-2">{l}</label>
      {h && <p className="text-[11px] text-slate-400 dark:text-[#A1A1AA] mb-2">{h}</p>}
      {children}
    </div>
  )
}
