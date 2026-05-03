// @ts-nocheck
import React from 'react';
import { useTheme, I, Btn, Tag, Card, CopyBtn, Input, Textarea, Select } from '../lib';
import { useI18n } from '../i18n';

function InfoCard({ label, value, sub, icon }: any) {
  const t = useTheme();
  return (
    <Card className="p-4">
      <div className="flex items-center gap-2 mb-2.5">
        <div style={{ background: t.chipBg, color: t.textMuted }} className="w-6 h-6 rounded flex items-center justify-center">{icon}</div>
        <div style={{ color: t.textDim }} className="text-[11px] font-semibold uppercase tracking-wider">{label}</div>
      </div>
      <div style={{ color: t.text }} className="text-[15px] font-semibold truncate">{value}</div>
      <div style={{ color: t.textDim }} className="text-[11.5px] mt-0.5 font-mono">{sub}</div>
    </Card>
  );
}

function EndpointTab({ url, app, collection }: any) {
  const t = useTheme();
  const { t: tr } = useI18n();
  const [lang, setLang] = React.useState('curl');
  const [keyVisible, setKeyVisible] = React.useState(false);
  const [auth, setAuth] = React.useState('bearer');
  const [rate, setRate] = React.useState(60);
  const [cors, setCors] = React.useState('https://app.example.com\nhttps://*.vercel.app');
  const [streaming, setStreaming] = React.useState(true);
  const apiKey = 'hnm_sk_live_8af3c2e91b';
  const snippets: Record<string, string> = {
    curl: `curl -X POST ${url}/chat \\\n  -H "Authorization: Bearer ${keyVisible ? apiKey : '$HANIMO_API_KEY'}" \\\n  -H "Content-Type: application/json" \\\n  -d '{\n    "message": "What is the refund policy?"\n  }'`,
    python: `from hanimo import Client\n\nclient = Client(api_key="${keyVisible ? apiKey : 'HANIMO_API_KEY'}")\n\nresponse = client.apps("${app.id}").chat(\n    message="What is the refund policy?"\n)\n\nprint(response.answer)`,
    js: `import { Hanimo } from "hanimo";\n\nconst client = new Hanimo({\n  apiKey: process.env.HANIMO_API_KEY,\n});\n\nconst r = await client.apps("${app.id}").chat({\n  message: "What is the refund policy?",\n});\n\nconsole.log(r.answer);`,
    openai: `import OpenAI from "openai";\n\nconst client = new OpenAI({\n  baseURL: "${url}",\n  apiKey: process.env.HANIMO_API_KEY,\n});\n\nconst c = await client.chat.completions.create({\n  model: "${app.model}",\n  messages: [{ role: "user", content: "Hi" }],\n});`,
  };
  return (
    <div className="space-y-4">
      <Card className="overflow-hidden">
        <div style={{ borderBottom: `1px solid ${t.borderSoft}` }} className="px-5 pt-5 pb-4">
          <div style={{ color: t.textDim }} className="text-[11px] font-semibold uppercase tracking-wider mb-2">{tr('endpoint_kicker')}</div>
          <div className="flex items-center gap-2 mb-1">
            <span style={{ background: t.successBg, color: t.success }} className="px-1.5 py-0.5 rounded text-[10.5px] font-bold tracking-wider">POST</span>
            <code style={{ color: t.text }} className="text-[14px] font-mono flex-1 truncate">{url}/chat</code>
            <CopyBtn text={`${url}/chat`}/>
          </div>
          <div style={{ color: t.textDim }} className="text-[12px]">{tr('endpoint_desc')}</div>
        </div>
        <div style={{ borderBottom: `1px solid ${t.borderSoft}` }} className="px-5 py-4 flex items-center gap-3">
          <div className="flex-1 min-w-0">
            <div style={{ color: t.textDim }} className="text-[11px] font-semibold uppercase tracking-wider mb-1">{tr('api_key')}</div>
            <div className="flex items-center gap-2">
              <code style={{ color: t.text }} className="text-[12.5px] font-mono truncate">{keyVisible ? apiKey : '••••••••••••••••••••'}</code>
              <button onClick={() => setKeyVisible(v => !v)} style={{ color: t.textMuted }} className="text-[11.5px] font-medium hover:opacity-70">{keyVisible ? tr('hide') : tr('reveal')}</button>
            </div>
          </div>
          <CopyBtn text={apiKey} label={tr('copy_key')}/><Btn variant="secondary" size="sm">{tr('rotate')}</Btn>
        </div>
        <div style={{ background: t.codeBg }}>
          <div style={{ borderBottom: `1px solid ${t.codeBorder}` }} className="px-3 pt-2 flex items-center gap-1">
            {[{ id: 'curl', label: 'cURL' }, { id: 'python', label: 'Python' }, { id: 'js', label: 'Node.js' }, { id: 'openai', label: 'OpenAI SDK' }].map(l => (
              <button key={l.id} onClick={() => setLang(l.id)}
                style={{ background: lang === l.id ? '#171717' : 'transparent', color: lang === l.id ? '#fff' : '#A3A3A3' }}
                className="h-8 px-3 text-[12px] font-medium rounded-t hover:opacity-80">{l.label}</button>
            ))}
            <div className="flex-1"/>
            <button onClick={() => navigator.clipboard?.writeText(snippets[lang])}
              className="inline-flex items-center gap-1.5 h-7 px-2 mb-1 rounded text-[11.5px] font-medium text-[#A3A3A3] hover:text-white">{I.copy}{tr('copy')}</button>
          </div>
          <pre style={{ color: t.codeText }} className="px-5 py-4 text-[12.5px] leading-[1.7] font-mono overflow-x-auto">{snippets[lang]}</pre>
        </div>
      </Card>

      <div className="grid grid-cols-3 gap-3">
        <InfoCard label={tr('info_connected')} value={collection?.name || tr('info_all_docs')} sub={`${collection?.docs?.length || 0} ${tr('info_documents')}`} icon={I.database}/>
        <InfoCard label={tr('info_model')} value={app.model} sub={`${app.mode} · top ${app.topK}`} icon={I.bolt}/>
        <InfoCard label={tr('info_last24')} value={`${app.requests.toLocaleString()} ${tr('apps_req')}`} sub={`p50 ${app.p50}ms · 99.8% ok`} icon={I.globe}/>
      </div>

      <Card className="p-5">
        <div className="flex items-center gap-2 mb-1">
          <div style={{ color: t.textMuted }}>{I.shield}</div>
          <div style={{ color: t.text }} className="text-[13px] font-semibold">{tr('ep_security')}</div>
        </div>
        <div style={{ color: t.textDim }} className="text-[12px] mb-4">{tr('ep_security_d')}</div>
        <div className="space-y-4">
          <div className="grid grid-cols-12 gap-4 items-start">
            <div className="col-span-4">
              <div style={{ color: t.text }} className="text-[12.5px] font-medium">{tr('ep_auth')}</div>
              <div style={{ color: t.textDim }} className="text-[11px] mt-0.5">{tr('ep_auth_d')}</div>
            </div>
            <div className="col-span-8">
              <div style={{ background: t.chipBg }} className="flex rounded-md p-0.5 max-w-[360px]">
                {[['bearer', 'Bearer token'], ['header', 'API-Key header'], ['none', 'Public']].map(([id, label]) => (
                  <button key={id} onClick={() => setAuth(id)}
                    style={{ background: auth === id ? t.surface : 'transparent', color: auth === id ? t.text : t.textDim, boxShadow: auth === id ? '0 1px 2px rgba(0,0,0,0.05)' : 'none' }}
                    className="flex-1 h-7 rounded text-[11.5px] font-medium px-2">{label}</button>
                ))}
              </div>
            </div>
          </div>
          <div style={{ borderTop: `1px solid ${t.borderSoft}` }} className="grid grid-cols-12 gap-4 items-center pt-4">
            <div className="col-span-4">
              <div style={{ color: t.text }} className="text-[12.5px] font-medium">{tr('ep_ratelimit')}</div>
              <div style={{ color: t.textDim }} className="text-[11px] mt-0.5">{tr('ep_ratelimit_d')}</div>
            </div>
            <div className="col-span-8 flex items-center gap-3">
              <input type="range" min={10} max={600} step={10} value={rate} onChange={e => setRate(+e.target.value)} className="flex-1"/>
              <span style={{ color: t.text }} className="text-[12px] font-mono w-24 text-right">{rate} req/min</span>
            </div>
          </div>
          <div style={{ borderTop: `1px solid ${t.borderSoft}` }} className="grid grid-cols-12 gap-4 items-start pt-4">
            <div className="col-span-4">
              <div style={{ color: t.text }} className="text-[12.5px] font-medium">{tr('ep_cors')}</div>
              <div style={{ color: t.textDim }} className="text-[11px] mt-0.5">{tr('ep_cors_d')}</div>
            </div>
            <div className="col-span-8">
              <Textarea rows={3} value={cors} onChange={e => setCors(e.target.value)} className="text-[11.5px]"/>
            </div>
          </div>
          <div style={{ borderTop: `1px solid ${t.borderSoft}` }} className="grid grid-cols-12 gap-4 items-center pt-4">
            <div className="col-span-4">
              <div style={{ color: t.text }} className="text-[12.5px] font-medium">{tr('ep_streaming')}</div>
              <div style={{ color: t.textDim }} className="text-[11px] mt-0.5">{tr('ep_streaming_d')}</div>
            </div>
            <div className="col-span-8">
              <button onClick={() => setStreaming(s => !s)} style={{ background: streaming ? t.accent : t.chipBg }} className="relative w-10 h-6 rounded-full transition-colors">
                <span style={{ background: streaming ? t.accentText : t.surface, transform: `translateX(${streaming ? 16 : 2}px)` }} className="absolute top-0.5 w-5 h-5 rounded-full transition-transform shadow-sm"/>
              </button>
            </div>
          </div>
        </div>
      </Card>

      <Card className="p-5">
        <div style={{ color: t.text }} className="text-[13px] font-semibold mb-1">{tr('drop_into')}</div>
        <div style={{ color: t.textDim }} className="text-[12px] mb-4">{tr('drop_into_desc')}</div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
          {[['Slack bot', 'Slash command'], ['Discord bot', 'webhook.send'], ['Zapier', 'Webhooks by Zapier'], ['Next.js route', 'app/api/chat'], ['LangChain', 'Custom retriever'], ['Vercel AI SDK', 'streamText({})'], ['Raycast', 'AI extension'], ['cURL ping', 'Health check']].map(([n, s]) => (
            <button key={n} style={{ border: `1px solid ${t.border}` }} className="text-left rounded-md hover:opacity-80 px-3 py-2.5">
              <div style={{ color: t.text }} className="text-[12.5px] font-medium">{n}</div>
              <div style={{ color: t.textFaint }} className="text-[11px] font-mono mt-0.5">{s}</div>
            </button>
          ))}
        </div>
      </Card>
    </div>
  );
}

function ConfigureTab({ draft, setDraft, collections, onSave }: any) {
  const t = useTheme();
  const { t: tr } = useI18n();
  return (
    <Card>
      {[
        [tr('cfg_name'), tr('cfg_name_d'), <Input value={draft.name} onChange={(e: any) => setDraft({ ...draft, name: e.target.value })}/> ],
        [tr('cfg_desc'), tr('cfg_desc_d'), <Input value={draft.description} onChange={(e: any) => setDraft({ ...draft, description: e.target.value })}/>],
        [tr('cfg_documents'), tr('cfg_documents_d'), (
          <Select value={draft.collection || ''} onChange={(e: any) => setDraft({ ...draft, collection: e.target.value })}>
            <option value="">{tr('info_all_docs')}</option>
            {collections.map((c: any) => <option key={c.id} value={c.id}>{c.name} ({c.docs.length})</option>)}
          </Select>
        )],
        [tr('cfg_prompt'), tr('cfg_prompt_d'), <Textarea rows={4} value={draft.prompt} onChange={(e: any) => setDraft({ ...draft, prompt: e.target.value })}/>],
        [tr('cfg_model'), tr('cfg_model_d'), <Input value={draft.model} onChange={(e: any) => setDraft({ ...draft, model: e.target.value })}/>],
        [tr('cfg_search'), tr('cfg_search_d'), (
          <div style={{ background: t.chipBg }} className="flex rounded-md p-0.5">
            {['hybrid', 'vector', 'fts', 'graph'].map(m => (
              <button key={m} onClick={() => setDraft({ ...draft, mode: m })}
                style={{ background: draft.mode === m ? t.surface : 'transparent', color: draft.mode === m ? t.text : t.textDim, boxShadow: draft.mode === m ? '0 1px 2px rgba(0,0,0,0.05)' : 'none' }}
                className="flex-1 h-7 px-3 rounded text-[12px] font-medium capitalize">{m}</button>
            ))}
          </div>
        )],
        [tr('cfg_topk'), tr('cfg_topk_d', draft.topK), <input type="range" min={1} max={20} value={draft.topK} onChange={(e: any) => setDraft({ ...draft, topK: +e.target.value })} className="w-full"/>],
        [tr('cfg_temp'), tr('cfg_temp_d', draft.temperature), <input type="range" min={0} max={1} step={0.1} value={draft.temperature} onChange={(e: any) => setDraft({ ...draft, temperature: +e.target.value })} className="w-full"/>],
      ].map(([label, hint, control]: any, i: number) => (
        <div key={label} style={{ borderTop: i === 0 ? 'none' : `1px solid ${t.borderSoft}` }} className="px-5 py-4 grid grid-cols-12 gap-6 items-start">
          <div className="col-span-4">
            <div style={{ color: t.text }} className="text-[13px] font-medium">{label}</div>
            {hint && <div style={{ color: t.textDim }} className="text-[11.5px] mt-0.5">{hint}</div>}
          </div>
          <div className="col-span-8">{control}</div>
        </div>
      ))}
      <div style={{ borderTop: `1px solid ${t.borderSoft}` }} className="px-5 py-3 flex items-center justify-end gap-2">
        <Btn variant="ghost" size="sm">{tr('reset')}</Btn><Btn onClick={onSave} size="sm">{tr('save')}</Btn>
      </div>
    </Card>
  );
}

function TestTab({ app }: any) {
  const t = useTheme();
  const { t: tr } = useI18n();
  const [msg, setMsg] = React.useState('');
  const [history, setHistory] = React.useState([
    { role: 'user', content: 'How long does a refund take?' },
    { role: 'assistant', content: 'Refunds are processed within 5 business days. Once approved, the amount is credited back to the original payment method.', sources: [{ name: 'Refund Policy.pdf', score: 0.92 }, { name: 'FAQ.md', score: 0.81 }] },
  ]);
  const send = () => {
    if (!msg.trim()) return;
    setHistory(h => [...h, { role: 'user', content: msg }]);
    setMsg('');
    // TODO: wire to apiAsk(msg, { topK: app.topK })
    setTimeout(() => setHistory(h => [...h, { role: 'assistant', content: '(Mock response — wire your own backend.)', sources: [{ name: 'API Reference.md', score: 0.87 }] }]), 600);
  };
  return (
    <Card className="flex flex-col h-[640px]">
      <div style={{ borderBottom: `1px solid ${t.borderSoft}` }} className="px-5 py-3 flex items-center justify-between">
        <div style={{ color: t.text }} className="text-[13px] font-medium">{tr('test_title')}</div>
        <div style={{ color: t.textDim }} className="text-[11.5px] font-mono">{app.model} · top {app.topK}</div>
      </div>
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
        {history.map((m: any, i: number) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : ''}`}>
            <div style={m.role === 'user' ? { background: t.accent, color: t.accentText } : { background: t.surface2, color: t.text, border: `1px solid ${t.borderSoft}` }} className="max-w-[75%] rounded-lg px-3.5 py-2.5">
              <div className="text-[13px] leading-relaxed whitespace-pre-wrap">{m.content}</div>
              {m.sources && (
                <div style={{ borderTop: `1px solid ${m.role === 'user' ? '#3F3F46' : t.borderSoft}` }} className="mt-2.5 pt-2.5 flex flex-wrap gap-1.5">
                  {m.sources.map((s: any, j: number) => (
                    <span key={j} style={{ background: m.role === 'user' ? '#1F1F1F' : t.surface, border: `1px solid ${m.role === 'user' ? '#3F3F46' : t.border}`, color: m.role === 'user' ? t.textMuted : t.text }}
                      className="inline-flex items-center gap-1.5 h-5 px-1.5 rounded text-[10.5px]">
                      <span className="font-medium">{s.name}</span>
                      <span style={{ color: t.textFaint }} className="font-mono">·{Math.round(s.score * 100)}%</span>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
      <div style={{ borderTop: `1px solid ${t.borderSoft}` }} className="px-3 py-3 flex items-center gap-2">
        <Input value={msg} onChange={(e: any) => setMsg(e.target.value)} onKeyDown={(e: any) => e.key === 'Enter' && send()} placeholder={tr('test_placeholder')}/>
        <Btn onClick={send}>{I.send}</Btn>
      </div>
    </Card>
  );
}

function LogsTab() {
  const t = useTheme();
  const { t: tr } = useI18n();
  const [filter, setFilter] = React.useState('all');
  const allLogs = [
    { ts: '14:23:08', status: 200, ms: 412, q: 'How do I cancel my plan?', ip: '203.0.113.4' },
    { ts: '14:22:51', status: 200, ms: 388, q: 'Refund policy for annual plan', ip: '198.51.100.22' },
    { ts: '14:22:34', status: 200, ms: 502, q: 'Where can I update my billing email?', ip: '203.0.113.4' },
    { ts: '14:21:12', status: 429, ms: 12, q: 'Rate limited', ip: '198.51.100.99' },
    { ts: '14:20:55', status: 200, ms: 401, q: 'Tax invoice download', ip: '203.0.113.4' },
    { ts: '14:20:01', status: 200, ms: 376, q: 'Hello', ip: '198.51.100.22' },
    { ts: '14:19:33', status: 200, ms: 451, q: 'Can I pause my subscription?', ip: '203.0.113.4' },
    { ts: '14:18:02', status: 500, ms: 8011, q: 'Embedding timeout', ip: '203.0.113.7' },
    { ts: '14:17:41', status: 200, ms: 421, q: 'How to reset password?', ip: '198.51.100.22' },
  ];
  const logs = allLogs.filter(l => filter === 'all' || (filter === 'ok' && l.status < 300) || (filter === 'err' && l.status >= 400));
  const buckets = [380, 410, 395, 420, 445, 412, 401, 388, 432, 418, 405, 395, 410, 425, 440, 412, 388, 401, 420, 415, 412, 395, 408, 412];
  const max = Math.max(...buckets);
  const min = Math.min(...buckets);
  return (
    <div className="space-y-4">
      <Card className="p-5">
        <div className="flex items-center justify-between mb-3">
          <div>
            <div style={{ color: t.text }} className="text-[13px] font-semibold">{tr('logs_latency_24h')}</div>
            <div style={{ color: t.textDim }} className="text-[11.5px] mt-0.5">{tr('logs_p50')} {Math.round(buckets.reduce((a, b) => a + b, 0) / buckets.length)}ms · {tr('logs_p95')} {Math.round(max * 1.4)}ms · {tr('logs_p99')} {Math.round(max * 1.8)}ms</div>
          </div>
        </div>
        <div className="flex items-end gap-1 h-16">
          {buckets.map((v, i) => {
            const h = ((v - min) / (max - min || 1)) * 100;
            return <div key={i} style={{ background: t.accent, height: `${20 + h * 0.8}%`, opacity: 0.4 + (h / 100) * 0.6 }} className="flex-1 rounded-sm"/>;
          })}
        </div>
        <div className="flex justify-between mt-1.5">
          <span style={{ color: t.textFaint }} className="text-[10px] font-mono">−24h</span>
          <span style={{ color: t.textFaint }} className="text-[10px] font-mono">now</span>
        </div>
      </Card>
      <Card className="overflow-hidden">
        <div style={{ borderBottom: `1px solid ${t.borderSoft}` }} className="px-5 py-3 flex items-center justify-between">
          <div style={{ color: t.text }} className="text-[13px] font-medium">{tr('logs_title')}</div>
          <div className="flex items-center gap-2">
            <div style={{ background: t.chipBg }} className="flex rounded-md p-0.5">
              {[['all', tr('logs_filter_all')], ['ok', tr('logs_filter_ok')], ['err', tr('logs_filter_err')]].map(([id, label]) => (
                <button key={id} onClick={() => setFilter(id)}
                  style={{ background: filter === id ? t.surface : 'transparent', color: filter === id ? t.text : t.textDim, boxShadow: filter === id ? '0 1px 2px rgba(0,0,0,0.05)' : 'none' }}
                  className="h-6 px-2.5 rounded text-[11.5px] font-medium">{label}</button>
              ))}
            </div>
            <span style={{ color: t.textFaint }} className="text-[11.5px] font-mono">{tr('logs_sub')}</span>
          </div>
        </div>
        {logs.length === 0 ? (
          <div style={{ color: t.textDim }} className="px-5 py-12 text-center text-[12.5px]">{tr('logs_empty')}</div>
        ) : logs.map((l, i) => (
          <div key={i} style={{ borderTop: `1px solid ${t.borderSoft}` }} className="px-5 py-2.5 flex items-center gap-4">
            <span style={{ color: t.textFaint }} className="text-[11.5px] font-mono w-16">{l.ts}</span>
            <span style={{ background: t.successBg, color: t.success }} className="px-1.5 py-0.5 rounded text-[10px] font-bold tracking-wider w-12 text-center">POST</span>
            <span style={{ color: l.status < 300 ? t.success : (l.status < 500 ? t.amber : t.danger) }} className="text-[11.5px] font-mono w-12">{l.status}</span>
            <span style={{ color: t.text }} className="text-[12.5px] flex-1 truncate">{l.q}</span>
            <span style={{ color: t.textFaint }} className="text-[11px] font-mono w-24 text-right">{l.ip}</span>
            <span style={{ color: t.textDim }} className="text-[11.5px] font-mono w-14 text-right">{l.ms}ms</span>
          </div>
        ))}
      </Card>
    </div>
  );
}

export function AppDetail({ app, collections, onBack, onUpdate }: any) {
  const t = useTheme();
  const { t: tr } = useI18n();
  const [tab, setTab] = React.useState('endpoint');
  const [draft, setDraft] = React.useState(app);
  React.useEffect(() => setDraft(app), [app.id]);
  const url = `https://api.hanimo.dev/v1/${app.id}`;
  const collection = collections.find((c: any) => c.id === app.collection);
  return (
    <div className="flex flex-col h-full">
      <div style={{ background: t.surface, borderBottom: `1px solid ${t.border}` }} className="h-14 px-6 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <button onClick={onBack} style={{ color: t.textMuted }} className="w-7 h-7 rounded-md flex items-center justify-center hover:opacity-70"><span className="rotate-180">{I.arrow}</span></button>
          <div style={{ background: t.brand, color: t.brandText }} className="w-7 h-7 rounded-md flex items-center justify-center shrink-0">{I.hex}</div>
          <div className="min-w-0">
            <div style={{ color: t.text }} className="text-[14px] font-semibold leading-tight truncate">{app.name}</div>
            <div style={{ color: t.textDim }} className="text-[11.5px] leading-tight font-mono">{app.id}</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Tag color="green"><span className="w-1.5 h-1.5 rounded-full" style={{ background: t.success }}/>{tr('apps_live')}</Tag>
          <Btn variant="secondary" size="sm">{I.more}</Btn>
        </div>
      </div>
      <div style={{ background: t.surface, borderBottom: `1px solid ${t.border}` }} className="px-6 flex items-center gap-1 shrink-0">
        {[{ id: 'endpoint', label: tr('tab_endpoint') }, { id: 'configure', label: tr('tab_configure') }, { id: 'test', label: tr('tab_test') }, { id: 'logs', label: tr('tab_logs') }].map(x => (
          <button key={x.id} onClick={() => setTab(x.id)} style={{ color: tab === x.id ? t.text : t.textDim }}
            className="relative h-10 px-3 text-[13px] font-medium hover:opacity-80">
            {x.label}
            {tab === x.id && <span className="absolute bottom-0 left-0 right-0 h-px" style={{ background: t.accent }}/>}
          </button>
        ))}
      </div>
      <div style={{ background: t.appBg }} className="flex-1 overflow-y-auto">
        <div className="max-w-[1100px] mx-auto px-6 py-6">
          {tab === 'endpoint' && <EndpointTab url={url} app={app} collection={collection}/>}
          {tab === 'configure' && <ConfigureTab draft={draft} setDraft={setDraft} collections={collections} onSave={() => onUpdate(draft)}/>}
          {tab === 'test' && <TestTab app={app}/>}
          {tab === 'logs' && <LogsTab/>}
        </div>
      </div>
    </div>
  );
}

export default AppDetail;
