// ---------- Documents (with upload progress) ----------
function DocumentsPage({ docs, collections, themeName, uploading, onStartUpload }) {
  const t = useTheme();
  const { t: tr } = useI18n();
  const [selected, setSelected] = React.useState(new Set());
  const [filter, setFilter] = React.useState('all');
  const filtered = docs.filter(d => filter === 'all' || d.status === filter);
  const toggle = id => setSelected(s => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const totalChunks = docs.reduce((a, d) => a + d.chunks, 0);
  return (
    <div className="flex flex-col h-full">
      <Topbar title={tr('docs_title')} subtitle={tr('docs_subtitle', docs.length, totalChunks)}
        action={<Btn onClick={onStartUpload}>{I.upload}{tr('upload')}</Btn>}/>
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-[1100px] mx-auto px-6 py-6 space-y-4">
          {docs.length === 0 && uploading.length === 0 ? (
            <Empty icon={I.doc} title={tr('docs_empty_t')} desc={tr('docs_empty_d')}
              action={<Btn onClick={onStartUpload}>{I.upload}{tr('upload')}</Btn>}/>
          ) : (
            <>
              <div onClick={onStartUpload} style={{ border: `1px dashed ${t.border}`, color: t.textDim }}
                className="rounded-lg hover:opacity-80 p-6 text-center cursor-pointer transition-opacity">
                <div style={{ background: t.chipBg, color: t.textMuted }} className="w-9 h-9 rounded-full flex items-center justify-center mx-auto mb-2">{I.upload}</div>
                <div style={{ color: t.text }} className="text-[13px] font-medium">{tr('docs_dropzone_t')}</div>
                <div style={{ color: t.textFaint }} className="text-[11.5px] mt-0.5">{tr('docs_dropzone_d')}</div>
              </div>

              {uploading.length > 0 && (
                <Card className="overflow-hidden">
                  {uploading.map((u, i) => (
                    <UploadRow key={u.id} item={u} first={i === 0}/>
                  ))}
                </Card>
              )}

              <div className="flex items-center justify-between">
                <div style={{ background: t.chipBg }} className="flex rounded-md p-0.5">
                  {[['all', tr('docs_filter_all'), docs.length], ['ready', tr('docs_filter_ready'), docs.filter(d => d.status === 'ready').length], ['processing', tr('docs_filter_processing'), docs.filter(d => d.status === 'processing').length]].map(([id, label, n]) => (
                    <button key={id} onClick={() => setFilter(id)} style={{ background: filter === id ? t.surface : 'transparent', color: filter === id ? t.text : t.textDim, boxShadow: filter === id ? '0 1px 2px rgba(0,0,0,0.05)' : 'none' }}
                      className="h-7 px-3 rounded text-[12px] font-medium flex items-center gap-1.5">{label}<span style={{ color: t.textFaint }} className="font-mono">{n}</span></button>
                  ))}
                </div>
                {selected.size > 0 && (<div className="flex items-center gap-2"><span style={{ color: t.textDim }} className="text-[12px]">{tr('docs_selected', selected.size)}</span><Btn variant="secondary" size="sm">{tr('docs_add_to_coll')}</Btn><Btn variant="danger" size="sm">{I.trash}{tr('docs_delete')}</Btn></div>)}
              </div>

              <Card className="overflow-hidden">
                <div style={{ borderBottom: `1px solid ${t.borderSoft}`, color: t.textDim }} className="px-4 py-2 grid grid-cols-12 gap-4 text-[10.5px] font-semibold uppercase tracking-wider">
                  <div className="col-span-6 flex items-center gap-3">
                    <input type="checkbox" checked={selected.size === filtered.length && filtered.length > 0} onChange={e => setSelected(e.target.checked ? new Set(filtered.map(d => d.id)) : new Set())}/>
                    {tr('docs_col_name')}
                  </div>
                  <div className="col-span-2">{tr('docs_col_status')}</div><div className="col-span-1">{tr('docs_col_chunks')}</div><div className="col-span-2">{tr('docs_col_size')}</div><div className="col-span-1">{tr('docs_col_added')}</div>
                </div>
                {filtered.map(d => {
                  const c = fileColor(d.type, themeName);
                  return (
                    <div key={d.id} style={{ borderTop: `1px solid ${t.borderSoft}` }} className="px-4 py-3 grid grid-cols-12 gap-4 items-center hover:opacity-90">
                      <div className="col-span-6 flex items-center gap-3 min-w-0">
                        <input type="checkbox" checked={selected.has(d.id)} onChange={() => toggle(d.id)}/>
                        <div style={{ background: c.bg, color: c.fg }} className="w-7 h-7 rounded shrink-0 flex items-center justify-center text-[10px] font-bold uppercase">{d.type}</div>
                        <span style={{ color: t.text }} className="text-[13px] font-medium truncate">{d.name}</span>
                      </div>
                      <div className="col-span-2 flex items-center gap-2 text-[12px]" style={{ color: t.textMuted }}><StatusDot status={d.status}/><span className="capitalize">{d.status}</span></div>
                      <div className="col-span-1 text-[12px] font-mono" style={{ color: t.textMuted }}>{d.chunks}</div>
                      <div className="col-span-2 text-[12px] font-mono" style={{ color: t.textDim }}>{d.size}</div>
                      <div className="col-span-1 text-[11.5px]" style={{ color: t.textFaint }}>{d.date}</div>
                    </div>
                  );
                })}
              </Card>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function UploadRow({ item, first }) {
  const t = useTheme();
  const { t: tr } = useI18n();
  const stages = [
    { id: 'parsing', key: 'up_parsing' },
    { id: 'chunking', key: 'up_chunking' },
    { id: 'embedding', key: 'up_embedding' },
    { id: 'indexed', key: 'up_indexed' },
  ];
  const idx = stages.findIndex(s => s.id === item.stage);
  const c = fileColor(item.type, t.name);
  return (
    <div style={{ borderTop: first ? 'none' : `1px solid ${t.borderSoft}` }} className="px-4 py-3">
      <div className="flex items-center gap-3 mb-2">
        <div style={{ background: c.bg, color: c.fg }} className="w-7 h-7 rounded shrink-0 flex items-center justify-center text-[10px] font-bold uppercase">{item.type}</div>
        <span style={{ color: t.text }} className="text-[13px] font-medium flex-1 truncate">{item.name}</span>
        <span style={{ color: t.textDim }} className="text-[11.5px] font-mono">{tr(stages[idx].key)}…</span>
      </div>
      <div className="flex items-center gap-1.5">
        {stages.map((s, i) => {
          const done = i < idx;
          const active = i === idx;
          return (
            <div key={s.id} className="flex-1 flex items-center gap-1.5">
              <div style={{ background: done ? t.success : (active ? t.accent : t.borderSoft) }} className="flex-1 h-1 rounded-full relative overflow-hidden">
                {active && <div style={{ background: t.accentText, opacity: 0.4 }} className="absolute inset-y-0 left-0 w-1/3 animate-pulse"/>}
              </div>
            </div>
          );
        })}
      </div>
      <div className="flex items-center justify-between mt-1.5">
        {stages.map((s, i) => (
          <span key={s.id} style={{ color: i <= idx ? t.textMuted : t.textFaint }} className="text-[10px] font-mono">{tr(s.key)}</span>
        ))}
      </div>
    </div>
  );
}

// ---------- Collections page ----------
function CollectionsPage({ collections, docs, apps, onOpen, onCreate }) {
  const t = useTheme();
  const { t: tr } = useI18n();
  return (
    <div className="flex flex-col h-full">
      <Topbar title={tr('coll_title')} subtitle={tr('coll_subtitle')}
        action={<Btn onClick={onCreate}>{I.plus}{tr('coll_new')}</Btn>}/>
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-[1100px] mx-auto px-6 py-6">
          {collections.length === 0 ? (
            <Empty icon={I.layers} title={tr('coll_empty_t')} desc={tr('coll_empty_d')}
              action={<Btn onClick={onCreate}>{I.plus}{tr('coll_new')}</Btn>}/>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {collections.map(c => {
                const cDocs = docs.filter(d => c.docs.includes(d.id));
                const cApps = apps.filter(a => a.collection === c.id);
                const chunks = cDocs.reduce((a, d) => a + d.chunks, 0);
                return (
                  <div key={c.id} onClick={() => onOpen(c.id)} style={{ background: t.surface, border: `1px solid ${t.border}` }}
                    className="rounded-lg p-4 cursor-pointer hover:opacity-95">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div style={{ background: t.purpleBg, color: t.purple }} className="w-8 h-8 rounded-md flex items-center justify-center">{I.layers}</div>
                        <div className="min-w-0">
                          <div style={{ color: t.text }} className="text-[13.5px] font-semibold truncate">{c.name}</div>
                          <div style={{ color: t.textDim }} className="text-[11.5px] truncate">{c.desc}</div>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 text-[11.5px] mt-3" style={{ color: t.textDim }}>
                      <span className="font-mono">{tr('coll_n_docs', cDocs.length)}</span>
                      <span style={{ color: t.border }}>·</span>
                      <span className="font-mono">{chunks} chunks</span>
                      <span style={{ color: t.border }}>·</span>
                      <span className="font-mono">{tr('coll_n_apps', cApps.length)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function CollectionDetail({ collection, docs, apps, onBack, themeName }) {
  const t = useTheme();
  const { t: tr } = useI18n();
  const cDocs = docs.filter(d => collection.docs.includes(d.id));
  const cApps = apps.filter(a => a.collection === collection.id);
  const chunks = cDocs.reduce((a, d) => a + d.chunks, 0);
  return (
    <div className="flex flex-col h-full">
      <Topbar
        leading={<button onClick={onBack} style={{ color: t.textMuted }} className="w-7 h-7 rounded-md flex items-center justify-center hover:opacity-70"><span className="rotate-180">{I.arrow}</span></button>}
        title={collection.name}
        subtitle={collection.desc}
        action={<Btn variant="secondary" size="sm">{I.more}</Btn>}/>
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-[1100px] mx-auto px-6 py-6 space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <InfoCard label={tr('docs_title')} value={cDocs.length} sub={`${cDocs.filter(d => d.status === 'ready').length} ready`} icon={I.doc}/>
            <InfoCard label={tr('coll_total_chunks')} value={chunks} sub={`avg ${cDocs.length ? Math.round(chunks / cDocs.length) : 0} per doc`} icon={I.database}/>
            <InfoCard label={tr('apps_title')} value={cApps.length} sub={`${cApps.reduce((a, x) => a + x.requests, 0).toLocaleString()} reqs total`} icon={I.bolt}/>
          </div>

          <Card className="overflow-hidden">
            <div style={{ borderBottom: `1px solid ${t.borderSoft}` }} className="px-5 py-3 flex items-center justify-between">
              <div style={{ color: t.text }} className="text-[13px] font-semibold">{tr('coll_apps_using')}</div>
              <span style={{ color: t.textFaint }} className="text-[11.5px] font-mono">{cApps.length}</span>
            </div>
            {cApps.length === 0 ? (
              <div style={{ color: t.textDim }} className="px-5 py-10 text-center text-[12.5px]">{tr('coll_no_apps')}</div>
            ) : cApps.map((a, i) => (
              <div key={a.id} style={{ borderTop: i === 0 ? 'none' : `1px solid ${t.borderSoft}` }} className="px-5 py-3 flex items-center gap-3">
                <div style={{ background: t.brand, color: t.brandText }} className="w-7 h-7 rounded-md flex items-center justify-center shrink-0">{I.hex}</div>
                <div className="flex-1 min-w-0">
                  <div style={{ color: t.text }} className="text-[12.5px] font-medium">{a.name}</div>
                  <code style={{ color: t.textFaint }} className="text-[11px] font-mono">{a.id}</code>
                </div>
                <span style={{ color: t.textDim }} className="text-[11.5px] font-mono">{a.requests.toLocaleString()} req</span>
                <span style={{ color: t.textFaint }}>{I.arrow}</span>
              </div>
            ))}
          </Card>

          <Card className="overflow-hidden">
            <div style={{ borderBottom: `1px solid ${t.borderSoft}` }} className="px-5 py-3 flex items-center justify-between">
              <div style={{ color: t.text }} className="text-[13px] font-semibold">{tr('coll_docs_in')}</div>
              <Btn variant="secondary" size="sm">{I.plus}Add</Btn>
            </div>
            {cDocs.map((d, i) => {
              const c = fileColor(d.type, themeName);
              return (
                <div key={d.id} style={{ borderTop: i === 0 ? 'none' : `1px solid ${t.borderSoft}` }} className="px-5 py-3 flex items-center gap-3">
                  <div style={{ background: c.bg, color: c.fg }} className="w-7 h-7 rounded shrink-0 flex items-center justify-center text-[10px] font-bold uppercase">{d.type}</div>
                  <span style={{ color: t.text }} className="text-[12.5px] font-medium flex-1 truncate">{d.name}</span>
                  <span style={{ color: t.textDim }} className="text-[11.5px] font-mono">{d.chunks} chunks</span>
                  <span style={{ color: t.textFaint }} className="text-[11px] font-mono">{d.size}</span>
                </div>
              );
            })}
          </Card>
        </div>
      </div>
    </div>
  );
}

// ---------- Playground (with mode comparison) ----------
function PlaygroundPage({ collections }) {
  const t = useTheme();
  const { t: tr } = useI18n();
  const [q, setQ] = React.useState('');
  const [mode, setMode] = React.useState('hybrid');
  const [view, setView] = React.useState('single'); // single | compare
  const [results, setResults] = React.useState([]);
  const [compared, setCompared] = React.useState(null);

  const baseResults = [
    { score: 0.91, file: 'Refund Policy.pdf', chunk: 'Refunds are processed within 5 business days. Once approved, the amount is credited back to the original payment method...' },
    { score: 0.84, file: 'FAQ.md', chunk: 'For refund requests, contact support@hanimo.dev. International transfers may take an additional 3 days depending on the bank.' },
    { score: 0.78, file: 'Onboarding Guide.docx', chunk: 'After cancellation, your account remains active until the end of the billing period.' },
    { score: 0.72, file: 'Pricing 2026.xlsx', chunk: 'Annual plans are pro-rated for the unused months when refunded.' },
  ];

  const search = () => {
    if (!q.trim()) return;
    setResults(baseResults.map(r => ({ ...r, match: mode })));
  };
  const compareAll = () => {
    if (!q.trim()) return;
    const modes = ['hybrid', 'vector', 'fts', 'graph'];
    const out = {};
    modes.forEach((m, mi) => {
      out[m] = baseResults.map((r, i) => ({ ...r, score: Math.max(0.4, r.score - mi * 0.04 - i * 0.02 + (Math.random() * 0.05)), match: m })).slice(0, 3);
    });
    setCompared(out);
  };

  return (
    <div className="flex flex-col h-full">
      <Topbar title={tr('pg_title')} subtitle={tr('pg_subtitle')}/>
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-[1200px] mx-auto px-6 py-6 space-y-4">
          <Card className="p-4">
            <div className="flex gap-2 mb-3">
              <Input value={q} onChange={e => setQ(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && (view === 'single' ? search() : compareAll())}
                placeholder={tr('pg_placeholder')}/>
              <Btn onClick={() => view === 'single' ? search() : compareAll()}>{I.search}{tr('pg_search')}</Btn>
            </div>
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div style={{ background: t.chipBg }} className="flex rounded-md p-0.5">
                  {[['single', tr('pg_single')], ['compare', tr('pg_compare_t')]].map(([id, label]) => (
                    <button key={id} onClick={() => setView(id)}
                      style={{ background: view === id ? t.surface : 'transparent', color: view === id ? t.text : t.textDim, boxShadow: view === id ? '0 1px 2px rgba(0,0,0,0.05)' : 'none' }}
                      className="h-6 px-2.5 rounded text-[11.5px] font-medium">{label}</button>
                  ))}
                </div>
                {view === 'single' && (
                  <div style={{ background: t.chipBg }} className="flex rounded-md p-0.5">
                    {['hybrid', 'vector', 'fts', 'graph'].map(m => (
                      <button key={m} onClick={() => setMode(m)}
                        style={{ background: mode === m ? t.surface : 'transparent', color: mode === m ? t.text : t.textDim, boxShadow: mode === m ? '0 1px 2px rgba(0,0,0,0.05)' : 'none' }}
                        className="h-6 px-2.5 rounded text-[11.5px] font-medium capitalize">{m}</button>
                    ))}
                  </div>
                )}
              </div>
              <Select className="!h-7 !w-auto !px-2 !text-[12px]">
                <option>{tr('info_all_docs')}</option>
                {collections.map(c => <option key={c.id}>{c.name}</option>)}
              </Select>
            </div>
            {view === 'compare' && (
              <div style={{ color: t.textDim }} className="text-[11.5px] mt-3">{tr('pg_compare_d')}</div>
            )}
          </Card>

          {view === 'single' ? (
            results.length > 0 ? (
              <div className="space-y-2">
                {results.map((r, i) => (
                  <Card key={i} className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span style={{ color: t.text }} className="text-[11.5px] font-medium">{r.file}</span>
                      <Tag>{r.match}</Tag>
                      <span className="flex-1"/>
                      <span style={{ color: t.textMuted }} className="text-[11.5px] font-mono">{Math.round(r.score * 100)}%</span>
                    </div>
                    <p style={{ color: t.textMuted }} className="text-[13px] leading-relaxed">{r.chunk}</p>
                  </Card>
                ))}
              </div>
            ) : (
              <div style={{ color: t.textFaint }} className="text-center py-16">
                <div className="w-10 h-10 mx-auto mb-2" style={{ color: t.border }}>{I.search}</div>
                <div className="text-[12.5px]">{tr('pg_empty')}</div>
              </div>
            )
          ) : (
            compared ? (
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-3">
                {['hybrid', 'vector', 'fts', 'graph'].map(m => (
                  <Card key={m} className="overflow-hidden flex flex-col">
                    <div style={{ borderBottom: `1px solid ${t.borderSoft}` }} className="px-4 py-2.5 flex items-center justify-between">
                      <Tag color="blue">{m}</Tag>
                      <span style={{ color: t.textFaint }} className="text-[11px] font-mono">top {compared[m].length}</span>
                    </div>
                    <div className="flex-1">
                      {compared[m].map((r, i) => (
                        <div key={i} style={{ borderTop: i === 0 ? 'none' : `1px solid ${t.borderSoft}` }} className="px-4 py-3">
                          <div className="flex items-center gap-2 mb-1">
                            <span style={{ color: t.text }} className="text-[11.5px] font-medium truncate flex-1">{r.file}</span>
                            <span style={{ color: t.textMuted }} className="text-[11px] font-mono">{Math.round(r.score * 100)}%</span>
                          </div>
                          <p style={{ color: t.textDim }} className="text-[11.5px] leading-relaxed line-clamp-3">{r.chunk}</p>
                        </div>
                      ))}
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <div style={{ color: t.textFaint }} className="text-center py-16">
                <div className="w-10 h-10 mx-auto mb-2" style={{ color: t.border }}>{I.layers}</div>
                <div className="text-[12.5px]">{tr('pg_compare_d')}</div>
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
}

// ---------- Settings (expanded) ----------
function SettingsPage() {
  const t = useTheme();
  const { t: tr } = useI18n();
  const [section, setSection] = React.useState('general');
  const sections = [
    ['general', tr('s_general')],
    ['brand', tr('s_brand')],
    ['embedding', tr('s_embedding')],
    ['keys', tr('s_keys')],
    ['team', tr('s_team')],
    ['usage', tr('s_usage')],
    ['danger', tr('s_danger')],
  ];

  return (
    <div className="flex flex-col h-full">
      <Topbar title={tr('settings_title')}/>
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-[960px] mx-auto px-6 py-6 grid grid-cols-12 gap-6">
          <nav className="col-span-3">
            <div className="sticky top-0 space-y-0.5">
              {sections.map(([id, label]) => (
                <button key={id} onClick={() => setSection(id)}
                  style={{ background: section === id ? t.chipBg : 'transparent', color: section === id ? t.text : t.textMuted }}
                  className="w-full text-left h-8 px-2.5 rounded-md text-[12.5px] font-medium hover:opacity-80">{label}</button>
              ))}
            </div>
          </nav>
          <div className="col-span-9 space-y-4">
            {section === 'general' && <GeneralSection/>}
            {section === 'brand' && <BrandSection/>}
            {section === 'embedding' && <EmbeddingSection/>}
            {section === 'keys' && <KeysSection/>}
            {section === 'team' && <TeamSection/>}
            {section === 'usage' && <UsageSection/>}
            {section === 'danger' && <DangerSection/>}
          </div>
        </div>
      </div>
    </div>
  );
}

function SettingsBlock({ title, desc, children }) {
  const t = useTheme();
  return (
    <Card className="p-5">
      <div style={{ color: t.text }} className="text-[13px] font-semibold">{title}</div>
      <div style={{ color: t.textDim }} className="text-[11.5px] mb-4">{desc}</div>
      {children}
    </Card>
  );
}

function Field({ label, children }) {
  const t = useTheme();
  return <label className="block"><div style={{ color: t.textMuted }} className="text-[11.5px] font-medium mb-1">{label}</div>{children}</label>;
}

function GeneralSection() {
  const { t: tr } = useI18n();
  return (
    <SettingsBlock title={tr('s_general')} desc={tr('s_general_d')}>
      <div className="grid grid-cols-2 gap-3">
        <Field label={tr('s_workspace')}><Input defaultValue="My workspace"/></Field>
        <Field label={tr('s_default_model')}><Select defaultValue="gpt-4o-mini"><option>gpt-4o-mini</option><option>gpt-4o</option><option>llama3.1</option></Select></Field>
      </div>
    </SettingsBlock>
  );
}

function BrandSection() {
  const t = useTheme();
  const { t: tr } = useI18n();
  const swatches = [
    { name: 'Honey 50',  v: BRAND.honey50 },
    { name: 'Honey 100', v: BRAND.honey100 },
    { name: 'Honey 200', v: BRAND.honey200 },
    { name: 'Honey 300', v: BRAND.honey300 },
    { name: 'Honey 400', v: BRAND.honey400, primary: true },
    { name: 'Honey 500', v: BRAND.honey500 },
    { name: 'Honey 600', v: BRAND.honey600 },
    { name: 'Honey 700', v: BRAND.honey700 },
    { name: 'Modol 50',  v: BRAND.modol50 },
    { name: 'Modol 100', v: BRAND.modol100 },
    { name: 'Modol 200', v: BRAND.modol200 },
    { name: 'Charcoal',  v: BRAND.charcoal },
  ];
  return (
    <>
      <Card className="p-5 overflow-hidden">
        <div className="flex items-start gap-4">
          <div style={{ background: t.brand, color: t.brandText, boxShadow: `0 8px 24px -8px ${BRAND.honey400}88` }} className="w-14 h-14 rounded-xl flex items-center justify-center shrink-0">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2 21 7v10l-9 5-9-5V7z"/></svg>
          </div>
          <div className="flex-1">
            <div style={{ color: t.text }} className="text-[15px] font-semibold">{tr('s_brand_story')}</div>
            <div style={{ color: t.textDim }} className="text-[12.5px] leading-relaxed mt-1.5 max-w-[560px]">{tr('s_brand_story_text')}</div>
          </div>
        </div>
      </Card>

      <SettingsBlock title={tr('s_brand_palette')} desc={tr('s_brand_d')}>
        <div className="grid grid-cols-4 gap-2">
          {swatches.map(s => (
            <div key={s.name} style={{ border: `1px solid ${t.borderSoft}` }} className="rounded-md overflow-hidden">
              <div style={{ background: s.v }} className="h-14 relative">
                {s.primary && <span style={{ background: 'rgba(0,0,0,0.12)', color: '#fff' }} className="absolute top-1.5 right-1.5 text-[9px] font-bold tracking-wider px-1.5 py-0.5 rounded">PRIMARY</span>}
              </div>
              <div className="px-2 py-1.5">
                <div style={{ color: t.text }} className="text-[11px] font-medium leading-tight">{s.name}</div>
                <code style={{ color: t.textFaint }} className="text-[10px] font-mono">{s.v}</code>
              </div>
            </div>
          ))}
        </div>
      </SettingsBlock>

      <SettingsBlock title={tr('s_brand_modes')} desc="Three product-wide themes. Honey is the brand-forward default.">
        <div className="grid grid-cols-3 gap-3">
          {[
            { id: 'light', bg: '#FAFAFA', surface: '#FFFFFF', accent: BRAND.honey400, text: '#0A0A0A' },
            { id: 'dark',  bg: '#0A0A0A', surface: '#111111', accent: BRAND.honey300, text: '#FAFAFA' },
            { id: 'honey', bg: BRAND.modol50, surface: '#FFFFFF', accent: BRAND.honey400, text: BRAND.charcoal },
          ].map(m => (
            <div key={m.id} style={{ background: m.bg, border: `1px solid ${t.border}` }} className="rounded-md p-3">
              <div style={{ background: m.surface, border: `1px solid ${m.id === 'dark' ? '#262626' : (m.id === 'honey' ? BRAND.modol200 : '#E5E5E5')}` }} className="rounded-md p-2.5 mb-2 flex items-center gap-2">
                <div style={{ background: m.accent }} className="w-5 h-5 rounded">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="#fff"><path d="M12 2 21 7v10l-9 5-9-5V7z"/></svg>
                </div>
                <div style={{ background: m.text, opacity: 0.8 }} className="h-1.5 rounded-full flex-1"/>
              </div>
              <div className="flex items-center justify-between">
                <span style={{ color: m.text, opacity: 0.85 }} className="text-[11.5px] font-semibold capitalize">{m.id}</span>
                <span style={{ background: m.accent, color: m.id === 'dark' ? '#0A0A0A' : '#fff' }} className="text-[9px] font-bold tracking-wider px-1.5 py-0.5 rounded">{m.id === 'honey' ? 'DEFAULT' : 'OK'}</span>
              </div>
            </div>
          ))}
        </div>
      </SettingsBlock>
    </>
  );
}

function EmbeddingSection() {
  const { t: tr } = useI18n();
  return (
    <>
      <SettingsBlock title={tr('s_embedding')} desc={tr('s_embedding_d')}>
        <div className="grid grid-cols-2 gap-3">
          <Field label={tr('s_provider')}><Select defaultValue="Ollama"><option>Ollama</option><option>OpenAI</option></Select></Field>
          <Field label={tr('s_model')}><Input defaultValue="nomic-embed-text"/></Field>
        </div>
      </SettingsBlock>
      <SettingsBlock title={tr('s_chunking')} desc={tr('s_chunking_d')}>
        <div className="grid grid-cols-2 gap-3">
          <Field label={tr('s_chunk_size')}><Input defaultValue="512"/></Field>
          <Field label={tr('s_overlap')}><Input defaultValue="51"/></Field>
        </div>
      </SettingsBlock>
    </>
  );
}

function KeysSection() {
  const t = useTheme();
  const { t: tr } = useI18n();
  return (
    <SettingsBlock title={tr('s_keys')} desc={tr('s_keys_d')}>
      <div style={{ border: `1px solid ${t.border}` }} className="rounded-md">
        {[{ name: 'Default key', key: 'hnm_sk_live_8af3c2e91b', created: 'Jan 12, 2026' }, { name: 'Slack bot', key: 'hnm_sk_live_4d2e1a87cf', created: 'Mar 03, 2026' }, { name: 'Production', key: 'hnm_sk_live_a91d34b2f1', created: 'Apr 18, 2026' }].map((k, i) => (
          <div key={k.key} style={{ borderTop: i === 0 ? 'none' : `1px solid ${t.borderSoft}` }} className="px-4 py-3 flex items-center gap-3">
            <div className="flex-1 min-w-0"><div style={{ color: t.text }} className="text-[12.5px] font-medium">{k.name}</div><code style={{ color: t.textFaint }} className="text-[11px] font-mono">{k.key.slice(0, 14)}…</code></div>
            <span style={{ color: t.textFaint }} className="text-[11px]">{k.created}</span>
            <Btn variant="ghost" size="sm">{tr('s_revoke')}</Btn>
          </div>
        ))}
      </div>
      <Btn variant="secondary" size="sm" className="mt-3">{I.plus}{tr('s_new_key')}</Btn>
    </SettingsBlock>
  );
}

function TeamSection() {
  const t = useTheme();
  const { t: tr } = useI18n();
  const members = [
    { name: 'Yumi Park', email: 'yumi@hanimo.dev', role: 'owner', initials: 'YP' },
    { name: 'Daniel Choi', email: 'daniel@hanimo.dev', role: 'admin', initials: 'DC' },
    { name: 'Mara Singh', email: 'mara@hanimo.dev', role: 'member', initials: 'MS' },
    { name: 'Theo Watson', email: 'theo@hanimo.dev', role: 'member', initials: 'TW' },
  ];
  const roleLabel = { owner: tr('s_role_owner'), admin: tr('s_role_admin'), member: tr('s_role_member') };
  return (
    <SettingsBlock title={tr('s_team')} desc={tr('s_team_d')}>
      <div style={{ border: `1px solid ${t.border}` }} className="rounded-md">
        {members.map((m, i) => (
          <div key={m.email} style={{ borderTop: i === 0 ? 'none' : `1px solid ${t.borderSoft}` }} className="px-4 py-3 flex items-center gap-3">
            <div style={{ background: t.chipBg, color: t.textMuted }} className="w-7 h-7 rounded-full flex items-center justify-center text-[10.5px] font-semibold">{m.initials}</div>
            <div className="flex-1 min-w-0">
              <div style={{ color: t.text }} className="text-[12.5px] font-medium">{m.name}</div>
              <div style={{ color: t.textFaint }} className="text-[11px]">{m.email}</div>
            </div>
            <Tag color={m.role === 'owner' ? 'purple' : (m.role === 'admin' ? 'blue' : 'neutral')}>{roleLabel[m.role]}</Tag>
            {m.role !== 'owner' && <Btn variant="ghost" size="sm">{I.more}</Btn>}
          </div>
        ))}
      </div>
      <Btn variant="secondary" size="sm" className="mt-3">{I.plus}{tr('s_invite')}</Btn>
    </SettingsBlock>
  );
}

function UsageSection() {
  const t = useTheme();
  const { t: tr } = useI18n();
  const days = Array.from({ length: 30 }, (_, i) => 40 + Math.round(Math.sin(i * 0.4) * 20 + Math.random() * 30));
  const max = Math.max(...days);
  return (
    <>
      <SettingsBlock title={tr('s_usage')} desc={tr('s_usage_d')}>
        <div className="grid grid-cols-3 gap-3 mb-5">
          <div>
            <div style={{ color: t.textDim }} className="text-[11px] font-semibold uppercase tracking-wider mb-1">{tr('s_usage_requests')}</div>
            <div style={{ color: t.text }} className="text-[20px] font-semibold">{days.reduce((a, b) => a + b, 0).toLocaleString()}</div>
            <div style={{ color: t.success }} className="text-[11px] font-mono">+12% vs last month</div>
          </div>
          <div>
            <div style={{ color: t.textDim }} className="text-[11px] font-semibold uppercase tracking-wider mb-1">{tr('s_usage_chunks')}</div>
            <div style={{ color: t.text }} className="text-[20px] font-semibold">125</div>
            <div style={{ color: t.textFaint }} className="text-[11px] font-mono">across 6 docs</div>
          </div>
          <div>
            <div style={{ color: t.textDim }} className="text-[11px] font-semibold uppercase tracking-wider mb-1">{tr('s_usage_storage')}</div>
            <div style={{ color: t.text }} className="text-[20px] font-semibold">1.7 MB</div>
            <div style={{ color: t.textFaint }} className="text-[11px] font-mono">of unlimited</div>
          </div>
        </div>
        <div className="flex items-end gap-1 h-24">
          {days.map((v, i) => (
            <div key={i} style={{ background: t.accent, height: `${(v / max) * 100}%`, opacity: 0.3 + (v / max) * 0.7 }} className="flex-1 rounded-sm"/>
          ))}
        </div>
        <div className="flex justify-between mt-1.5">
          <span style={{ color: t.textFaint }} className="text-[10px] font-mono">−30d</span>
          <span style={{ color: t.textFaint }} className="text-[10px] font-mono">today</span>
        </div>
      </SettingsBlock>
    </>
  );
}

function DangerSection() {
  const t = useTheme();
  const { t: tr } = useI18n();
  return (
    <Card className="p-5" style={{ borderColor: t.danger + '40' }}>
      <div style={{ color: t.danger }} className="text-[13px] font-semibold">{tr('s_danger')}</div>
      <div style={{ color: t.textDim }} className="text-[11.5px] mb-4">{tr('s_danger_d')}</div>
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div>
            <div style={{ color: t.text }} className="text-[12.5px] font-medium">{tr('s_export')}</div>
            <div style={{ color: t.textFaint }} className="text-[11px]">Download all documents, chunks, and configs as JSON.</div>
          </div>
          <Btn variant="secondary" size="sm">{tr('s_export')}</Btn>
        </div>
        <div style={{ borderTop: `1px solid ${t.borderSoft}` }} className="pt-3 flex items-center justify-between">
          <div>
            <div style={{ color: t.text }} className="text-[12.5px] font-medium">{tr('s_delete_ws')}</div>
            <div style={{ color: t.textFaint }} className="text-[11px]">Permanently delete this workspace and all data.</div>
          </div>
          <Btn variant="danger" size="sm">{I.trash}{tr('s_delete_ws')}</Btn>
        </div>
      </div>
    </Card>
  );
}

Object.assign(window, { DocumentsPage, UploadRow, CollectionsPage, CollectionDetail, PlaygroundPage, SettingsPage, BrandSection });
