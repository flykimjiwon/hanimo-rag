import { useState, useEffect, useCallback } from 'react'
import { Blocks, X, Send, Copy, Check, Loader, Save } from 'lucide-react'
import { api } from '../api'
import { useI18n } from '../i18n'

interface App { id: string; name: string; description: string; system_prompt: string; llm_model: string; temperature: number; top_k: number; search_mode: string; collection_id: string | null; is_active: boolean; document_count?: number }
interface Coll { id: string; name: string; document_count: number }
interface ChatMsg { role: 'user' | 'assistant'; content: string; sources?: { file_name: string; content: string }[] }

export default function Apps() {
  const { t } = useI18n()
  const [apps, setApps] = useState<App[]>([]); const [sel, setSel] = useState<string | null>(null); const [selApp, setSelApp] = useState<App | null>(null)
  const [name, setName] = useState(''); const [desc, setDesc] = useState(''); const [prompt, setPrompt] = useState(''); const [model, setModel] = useState('llama3')
  const [cfg, setCfg] = useState({ system_prompt: '', llm_model: '', temperature: 0.7, top_k: 5, search_mode: 'hybrid', collection_id: '' })
  const [saved, setSaved] = useState(false); const [colls, setColls] = useState<Coll[]>([])
  const [chatInput, setChatInput] = useState(''); const [chatMsgs, setChatMsgs] = useState<ChatMsg[]>([]); const [chatLoading, setChatLoading] = useState(false)
  const [copied, setCopied] = useState(false)

  const load = useCallback(() => { api.getApps().then(d => setApps(d.apps || [])).catch(() => {}); api.getCollections().then(d => setColls(d.collections || [])).catch(() => {}) }, [])
  useEffect(() => { load() }, [load])
  useEffect(() => {
    if (sel) {
      api.getApp(sel).then(d => {
        const a = d.app || d
        setSelApp(a)
        setCfg({ system_prompt: a.system_prompt || '', llm_model: a.llm_model || 'llama3', temperature: a.temperature ?? 0.7, top_k: a.top_k ?? 5, search_mode: a.search_mode || 'hybrid', collection_id: a.collection_id || '' })
        setChatMsgs([])
      }).catch(() => {})
    } else { setSelApp(null) }
  }, [sel])

  const createApp = async () => {
    if (!name.trim()) return
    await api.createApp({ name, description: desc, system_prompt: prompt, llm_model: model || 'llama3' })
    setName(''); setDesc(''); setPrompt(''); setModel('llama3'); load()
  }
  const saveConfig = async () => {
    if (!sel) return
    await api.updateApp(sel, { ...cfg, collection_id: cfg.collection_id || null })
    setSaved(true); setTimeout(() => setSaved(false), 2000); load()
  }
  const sendChat = async () => {
    if (!chatInput.trim() || !sel) return
    const msg = chatInput; setChatInput('')
    setChatMsgs(prev => [...prev, { role: 'user', content: msg }]); setChatLoading(true)
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' }
      const key = localStorage.getItem('hanimo-rag-api-key')
      if (key) headers['X-API-Key'] = key
      const res = await fetch(`/api/apps/${sel}/chat`, { method: 'POST', headers, body: JSON.stringify({ message: msg }) })
      if (!res.ok) throw new Error(`${res.status}`)
      const ct = res.headers.get('content-type') || ''
      if (ct.includes('text/event-stream')) {
        const reader = res.body?.getReader(); const decoder = new TextDecoder()
        let full = ''; let sources: ChatMsg['sources'] = []
        setChatMsgs(prev => [...prev, { role: 'assistant', content: '' }])
        if (reader) {
          let buf = ''
          while (true) {
            const { done, value } = await reader.read(); if (done) break
            buf += decoder.decode(value, { stream: true })
            const parts = buf.split('\n\n'); buf = parts.pop() || ''
            for (const part of parts) { for (const line of part.split('\n')) { if (line.startsWith('data: ')) { try { const d = JSON.parse(line.slice(6)); if (d.token) full += d.token; if (d.sources) sources = d.sources } catch { full += line.slice(6) } } } }
            setChatMsgs(prev => { const u = [...prev]; u[u.length - 1] = { role: 'assistant', content: full, sources }; return u })
          }
        }
      } else {
        const d = await res.json()
        setChatMsgs(prev => [...prev, { role: 'assistant', content: d.answer || d.response || '', sources: d.sources }])
      }
    } catch (e) {
      setChatMsgs(prev => [...prev, { role: 'assistant', content: `Error: ${(e as Error).message}` }])
    } finally { setChatLoading(false) }
  }
  const copyEndpoint = () => {
    const url = `${window.location.origin}/api/apps/${sel}/chat`
    navigator.clipboard.writeText(`curl -X POST ${url} \\\n  -H "Content-Type: application/json" \\\n  -H "X-API-Key: YOUR_KEY" \\\n  -d '{"message": "Hello"}'`)
    setCopied(true); setTimeout(() => setCopied(false), 2000)
  }

  const inp = "w-full px-4 py-3 rounded-2xl text-sm bg-slate-50 dark:bg-[#27272A] border border-slate-200 dark:border-[#3F3F46] text-slate-900 dark:text-[#FAFAFA] focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
  const modes = [{ v: 'hybrid', l: 'Hybrid' }, { v: 'vector', l: 'Vector' }, { v: 'fts', l: 'FTS' }, { v: 'graph', l: 'Graph' }]

  return (
    <div className="max-w-5xl mx-auto">
      <h2 data-heading className="text-2xl font-bold text-slate-900 dark:text-[#FAFAFA] mb-6">{t('apps.title')}</h2>
      <div className="flex gap-6">
        {/* Left panel */}
        <div className="w-80 space-y-4">
          <div className="bg-white dark:bg-[#18181B] rounded-2xl border border-slate-200/60 dark:border-[#27272A] p-5 space-y-3">
            <input value={name} onChange={e => setName(e.target.value)} placeholder={t('apps.name')} className={inp} />
            <input value={desc} onChange={e => setDesc(e.target.value)} placeholder={t('apps.desc')} className={inp} />
            <textarea value={prompt} onChange={e => setPrompt(e.target.value)} placeholder={t('apps.prompt')} rows={3} className={inp + ' resize-none'} />
            <input value={model} onChange={e => setModel(e.target.value)} placeholder={t('apps.model')} className={inp} />
            <button onClick={createApp}
              className="w-full py-3 bg-blue-600 text-white rounded-2xl text-sm hover:bg-blue-500 font-semibold transition-all shadow-sm">{t('apps.create')}</button>
          </div>
          {apps.map(a => (
            <div key={a.id} onClick={() => setSel(a.id)}
              className={`bg-white dark:bg-[#18181B] rounded-2xl border p-5 cursor-pointer transition-all ${sel === a.id ? 'border-blue-400 dark:border-blue-500 shadow-md shadow-blue-100 dark:shadow-blue-950/30' : 'border-slate-200/60 dark:border-[#27272A] hover:border-slate-300'}`}>
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-bold text-sm text-slate-900 dark:text-[#FAFAFA]">{a.name}</p>
                  {a.description && <p className="text-xs text-slate-400 dark:text-[#A1A1AA] mt-0.5">{a.description}</p>}
                </div>
                <button onClick={e => { e.stopPropagation(); if (confirm(t('apps.confirm'))) { api.deleteApp(a.id); if (sel === a.id) setSel(null); load() } }}
                  className="w-7 h-7 rounded-full flex items-center justify-center text-slate-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-950/20 transition-all">
                  <X size={14} />
                </button>
              </div>
              <div className="mt-3 flex gap-2">
                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold ${a.is_active !== false ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400' : 'bg-slate-100 dark:bg-[#27272A] text-slate-400 dark:text-[#A1A1AA]'}`}>
                  {a.is_active !== false ? t('apps.active') : 'Inactive'}
                </span>
                {a.document_count !== undefined && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400">
                    {a.document_count} docs
                  </span>
                )}
              </div>
            </div>
          ))}
          {apps.length === 0 && (
            <div className="text-center py-10">
              <Blocks size={40} className="mx-auto mb-2 text-slate-300 dark:text-[#3F3F46]" />
              <p className="text-sm text-slate-400 dark:text-[#A1A1AA]">{t('apps.empty')}</p>
            </div>
          )}
        </div>

        {/* Right panel */}
        <div className="flex-1">
          {sel && selApp ? (
            <div className="space-y-6">
              {/* Config card */}
              <div className="bg-white dark:bg-[#18181B] rounded-2xl border border-slate-200/60 dark:border-[#27272A] p-6">
                <h3 data-heading className="font-bold text-slate-900 dark:text-[#FAFAFA] mb-4">{selApp.name}</h3>
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-semibold text-slate-500 dark:text-[#A1A1AA] mb-1.5 block">{t('apps.prompt')}</label>
                    <textarea value={cfg.system_prompt} onChange={e => setCfg({ ...cfg, system_prompt: e.target.value })} rows={3} className={inp + ' resize-none'} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-semibold text-slate-500 dark:text-[#A1A1AA] mb-1.5 block">{t('apps.model')}</label>
                      <input value={cfg.llm_model} onChange={e => setCfg({ ...cfg, llm_model: e.target.value })} className={inp} />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-500 dark:text-[#A1A1AA] mb-1.5 block">Search Mode</label>
                      <div className="flex bg-slate-100 dark:bg-[#27272A] rounded-2xl p-1">
                        {modes.map(m => (
                          <button key={m.v} onClick={() => setCfg({ ...cfg, search_mode: m.v })}
                            className={`flex-1 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${cfg.search_mode === m.v ? 'bg-white dark:bg-[#3F3F46] text-slate-900 dark:text-[#FAFAFA] shadow-sm' : 'text-slate-500 dark:text-[#A1A1AA]'}`}>
                            {m.l}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-semibold text-slate-500 dark:text-[#A1A1AA] mb-1.5 block">
                        Temperature: <span className="text-blue-600 dark:text-blue-400">{cfg.temperature}</span>
                      </label>
                      <input type="range" min={0} max={2} step={0.1} value={cfg.temperature} onChange={e => setCfg({ ...cfg, temperature: +e.target.value })} className="w-full accent-blue-500" />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-500 dark:text-[#A1A1AA] mb-1.5 block">
                        Top-K: <span className="text-blue-600 dark:text-blue-400">{cfg.top_k}</span>
                      </label>
                      <input type="range" min={1} max={20} value={cfg.top_k} onChange={e => setCfg({ ...cfg, top_k: +e.target.value })} className="w-full accent-blue-500" />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-500 dark:text-[#A1A1AA] mb-1.5 block">Collection</label>
                    <select value={cfg.collection_id} onChange={e => setCfg({ ...cfg, collection_id: e.target.value })}
                      className="w-full px-4 py-3 rounded-2xl text-sm bg-slate-50 dark:bg-[#27272A] border border-slate-200 dark:border-[#3F3F46] text-slate-700 dark:text-[#FAFAFA] focus:ring-2 focus:ring-blue-500 outline-none">
                      <option value="">All Documents</option>
                      {colls.map(c => <option key={c.id} value={c.id}>{c.name} ({c.document_count})</option>)}
                    </select>
                  </div>
                  <button onClick={saveConfig}
                    className="px-6 py-3 bg-blue-600 text-white rounded-2xl text-sm hover:bg-blue-500 font-semibold transition-all shadow-sm flex items-center gap-2">
                    {saved ? <><Check size={14} /> {t('apps.saved')}</> : <><Save size={14} /> {t('apps.save')}</>}
                  </button>
                </div>
              </div>

              {/* API Endpoint card */}
              <div className="bg-white dark:bg-[#18181B] rounded-2xl border border-slate-200/60 dark:border-[#27272A] p-6">
                <h3 data-heading className="font-bold text-slate-900 dark:text-[#FAFAFA] mb-4">{t('apps.endpoint')}</h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1 rounded-lg text-[11px] font-bold bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400">POST</span>
                    <code className="text-sm text-slate-700 dark:text-[#FAFAFA] font-mono">/api/apps/{sel}/chat</code>
                  </div>
                  <pre className="bg-slate-50 dark:bg-[#27272A] rounded-xl p-4 text-xs text-slate-600 dark:text-[#A1A1AA] overflow-x-auto font-mono leading-relaxed">{`curl -X POST ${window.location.origin}/api/apps/${sel}/chat \\
  -H "Content-Type: application/json" \\
  -H "X-API-Key: YOUR_KEY" \\
  -d '{"message": "Hello"}'`}</pre>
                  <button onClick={copyEndpoint}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-slate-500 dark:text-[#A1A1AA] bg-slate-100 dark:bg-[#27272A] hover:bg-slate-200 dark:hover:bg-[#3F3F46] transition-all">
                    {copied ? <><Check size={12} /> {t('apps.copy')}</> : <><Copy size={12} /> Copy</>}
                  </button>
                </div>
              </div>

              {/* Test Chat card */}
              <div className="bg-white dark:bg-[#18181B] rounded-2xl border border-slate-200/60 dark:border-[#27272A] p-6">
                <h3 data-heading className="font-bold text-slate-900 dark:text-[#FAFAFA] mb-4">{t('apps.test')}</h3>
                <div className="space-y-3">
                  {chatMsgs.length > 0 && (
                    <div className="max-h-80 overflow-y-auto space-y-3">
                      {chatMsgs.map((m, i) => (
                        <div key={i} className={`rounded-xl px-4 py-3 text-sm ${m.role === 'user' ? 'bg-blue-50 dark:bg-blue-950/30 text-blue-800 dark:text-blue-300 ml-12' : 'bg-slate-50 dark:bg-[#27272A] text-slate-700 dark:text-[#FAFAFA]/80 mr-12'}`}>
                          <p className="leading-relaxed whitespace-pre-wrap">{m.content}</p>
                          {m.sources && m.sources.length > 0 && (
                            <div className="mt-2 pt-2 border-t border-slate-200 dark:border-[#3F3F46]">
                              <p className="text-[10px] font-semibold text-slate-400 dark:text-[#A1A1AA] mb-1">Sources</p>
                              {m.sources.map((s, j) => (
                                <p key={j} className="text-[11px] text-slate-400 dark:text-[#A1A1AA]">{s.file_name}</p>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                      {chatLoading && (
                        <div className="bg-slate-50 dark:bg-[#27272A] rounded-xl px-4 py-3 mr-12">
                          <Loader size={14} className="animate-spin text-slate-400" />
                        </div>
                      )}
                    </div>
                  )}
                  <div className="flex gap-2">
                    <input value={chatInput} onChange={e => setChatInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && sendChat()}
                      placeholder="Type a message..." className={'flex-1 ' + inp} />
                    <button onClick={sendChat} disabled={chatLoading}
                      className="px-5 py-3 bg-blue-600 text-white rounded-2xl text-sm hover:bg-blue-500 disabled:opacity-50 font-semibold transition-all shadow-sm">
                      <Send size={16} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <Blocks size={48} className="mx-auto mb-4 text-slate-300 dark:text-[#3F3F46]" />
                <p className="text-slate-400 dark:text-[#A1A1AA]">{t('apps.select')}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
