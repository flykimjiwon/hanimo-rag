// @ts-nocheck
import React from 'react';
import { I18nProvider } from './i18n';
import { ThemeCtx, THEME, MOCK_APPS, MOCK_DOCS, MOCK_COLLECTIONS, APP_PRESETS, I, Btn, Input } from './lib';
import { useTheme } from './lib';
import { useI18n } from './i18n';
import { Sidebar } from './chrome';
import GuidePage from './pages/guide';
import { AppsPage } from './pages/apps';
import { AppDetail } from './pages/app-detail';
import DocumentsPage from './pages/documents';
import { CollectionsPage, CollectionDetail } from './pages/collections';
import PlaygroundPage from './pages/playground';
import SettingsPage from './pages/settings';

// ── Create App Modal ──────────────────────────────────────────────────────────
function CreateAppModal({ open, onClose, onCreate, collections }: any) {
  const t = useTheme();
  const { t: tr } = useI18n();
  const [step, setStep] = React.useState(0);
  const [preset, setPreset] = React.useState('blank');
  const [name, setName] = React.useState('');
  const [coll, setColl] = React.useState('');
  React.useEffect(() => { if (open) { setStep(0); setName(''); setColl(''); setPreset('blank'); } }, [open]);
  if (!open) return null;
  const id = 'app_' + Math.random().toString(16).slice(2, 6);
  const url = `https://api.hanimo.dev/v1/${id}`;
  const presetData = APP_PRESETS.find((p: any) => p.id === preset);
  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-6" onClick={onClose}>
      <div onClick={(e: any) => e.stopPropagation()} style={{ background: t.surface, border: `1px solid ${t.border}` }} className="rounded-lg w-full max-w-[560px] shadow-xl overflow-hidden">
        <div style={{ borderBottom: `1px solid ${t.borderSoft}` }} className="px-5 py-4 flex items-center justify-between">
          <div>
            <div style={{ color: t.text }} className="text-[14px] font-semibold">{tr('new_app')}</div>
            <div style={{ color: t.textDim }} className="text-[11.5px]">{tr('cm_step', step + 1, 4)}</div>
          </div>
          <button onClick={onClose} style={{ color: t.textMuted }} className="w-7 h-7 rounded-md flex items-center justify-center hover:opacity-70">{I.close}</button>
        </div>
        <div className="px-5 pt-4 flex gap-1.5">
          {[0, 1, 2, 3].map(i => <div key={i} style={{ background: i <= step ? t.accent : t.borderSoft }} className="flex-1 h-1 rounded-full"/>)}
        </div>
        <div className="px-5 py-5 min-h-[300px]">
          {step === 0 && (
            <div>
              <div style={{ color: t.text }} className="text-[13px] font-semibold mb-1">{tr('cm_preset_t')}</div>
              <div style={{ color: t.textDim }} className="text-[11.5px] mb-3">{tr('cm_preset_d')}</div>
              <div className="grid grid-cols-1 gap-2">
                {APP_PRESETS.map((p: any) => (
                  <button key={p.id} onClick={() => setPreset(p.id)}
                    style={{ background: preset === p.id ? t.surface2 : 'transparent', border: `1px solid ${preset === p.id ? t.accent : t.border}` }}
                    className="text-left rounded-md px-3 py-2.5 hover:opacity-90 flex items-center gap-3">
                    <div style={{ background: preset === p.id ? t.accent : t.chipBg, color: preset === p.id ? t.accentText : t.textMuted }} className="w-7 h-7 rounded-md flex items-center justify-center shrink-0">{p.id === 'blank' ? I.plus : I.bolt}</div>
                    <div className="flex-1 min-w-0">
                      <div style={{ color: t.text }} className="text-[12.5px] font-medium">{tr(p.titleKey)}</div>
                      <div style={{ color: t.textFaint }} className="text-[11px]">{tr(p.descKey)}</div>
                    </div>
                    <span style={{ color: t.textFaint }} className="text-[10px] font-mono">{p.mode} · top {p.topK}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
          {step === 1 && (
            <div>
              <div style={{ color: t.text }} className="text-[13px] font-semibold mb-1">{tr('cm_q1_t')}</div>
              <div style={{ color: t.textDim }} className="text-[11.5px] mb-3">{tr('cm_q1_d')}</div>
              <Input autoFocus value={name} onChange={(e: any) => setName(e.target.value)} placeholder={tr('cm_q1_ph')}/>
            </div>
          )}
          {step === 2 && (
            <div>
              <div style={{ color: t.text }} className="text-[13px] font-semibold mb-1">{tr('cm_q2_t')}</div>
              <div style={{ color: t.textDim }} className="text-[11.5px] mb-3">{tr('cm_q2_d')}</div>
              {[{ id: '', name: tr('info_all_docs'), docs: { length: 6 } }, ...collections].map((c: any) => (
                <button key={c.id || 'all'} onClick={() => setColl(c.id)}
                  style={{ background: coll === c.id ? t.surface2 : 'transparent', border: `1px solid ${coll === c.id ? t.accent : t.border}` }}
                  className="w-full text-left rounded-md px-3 py-2.5 hover:opacity-90 mb-2">
                  <div style={{ color: t.text }} className="text-[13px] font-medium">{c.name}</div>
                  <div style={{ color: t.textFaint }} className="text-[11px] font-mono">{c.docs.length} {tr('cm_q2_files')}</div>
                </button>
              ))}
            </div>
          )}
          {step === 3 && (
            <div>
              <div style={{ color: t.text }} className="text-[13px] font-semibold mb-1">{tr('cm_q3_t')}</div>
              <div style={{ color: t.textDim }} className="text-[11.5px] mb-3">{tr('cm_q3_d')}</div>
              <div style={{ background: t.surface2, border: `1px solid ${t.borderSoft}` }} className="rounded-md px-3 py-2.5 flex items-center gap-2 mb-2">
                <span style={{ background: t.successBg, color: t.success }} className="px-1.5 py-0.5 rounded text-[10px] font-bold tracking-wider">POST</span>
                <code style={{ color: t.text }} className="text-[12px] font-mono truncate flex-1">{url}/chat</code>
              </div>
              <pre style={{ background: t.codeBg, color: t.codeText }} className="rounded-md px-3 py-2.5 text-[11.5px] font-mono leading-relaxed overflow-x-auto">{`curl -X POST ${url}/chat \\\n  -H "Authorization: Bearer $KEY" \\\n  -d '{"message":"hello"}'`}</pre>
            </div>
          )}
        </div>
        <div style={{ borderTop: `1px solid ${t.borderSoft}` }} className="px-5 py-3 flex items-center justify-between">
          <Btn variant="ghost" size="sm" onClick={() => step > 0 ? setStep(step - 1) : onClose()}>{step > 0 ? tr('back') : tr('cancel')}</Btn>
          {step < 3 ? (
            <Btn size="sm" onClick={() => setStep(step + 1)} disabled={step === 1 && !name.trim()}>{tr('continue')} {I.arrow}</Btn>
          ) : (
            <Btn size="sm" onClick={() => {
              onCreate({
                id, name, collection: coll,
                model: presetData?.model, prompt: presetData?.prompt,
                mode: presetData?.mode, topK: presetData?.topK, temperature: presetData?.temperature,
                requests: 0, p50: 0, description: tr(presetData?.titleKey),
              });
              onClose();
            }}>{tr('cm_create')}</Btn>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Root App ──────────────────────────────────────────────────────────────────
function App() {
  const [active, setActive] = React.useState('guide');
  const [themeName, setThemeName] = React.useState(() => {
    const saved = localStorage.getItem('hanimo-theme');
    if (saved && THEME[saved]) return saved;
    return 'honey';
  });
  // TODO: replace MOCK_* with real API hooks (apiGetApps / apiGetDocuments / apiGetCollections)
  const [apps, setApps] = React.useState(MOCK_APPS);
  const [docs, setDocs] = React.useState(MOCK_DOCS);
  const [collections] = React.useState(MOCK_COLLECTIONS);
  const [openAppId, setOpenAppId] = React.useState<string | null>(null);
  const [openCollId, setOpenCollId] = React.useState<string | null>(null);
  const [createOpen, setCreateOpen] = React.useState(false);
  const [uploading, setUploading] = React.useState<any[]>([]);

  React.useEffect(() => { localStorage.setItem('hanimo-theme', themeName); }, [themeName]);
  React.useEffect(() => {
    if (active !== 'apps') setOpenAppId(null);
    if (active !== 'collections') setOpenCollId(null);
  }, [active]);

  // Simulate upload pipeline (TODO: replace with real apiIngest call)
  const startUpload = () => {
    const id = 'up_' + Math.random().toString(16).slice(2, 6);
    const sample = { id, name: 'New Upload.pdf', type: 'pdf', stage: 'parsing' };
    setUploading(u => [...u, sample]);
    const stages = ['parsing', 'chunking', 'embedding', 'indexed'];
    let i = 0;
    const tick = () => {
      i++;
      if (i >= stages.length) {
        setUploading(u => u.filter((x: any) => x.id !== id));
        setDocs(d => [{ id: 'd' + Math.random().toString(16).slice(2, 6), name: sample.name, type: 'pdf', size: '420 KB', chunks: 22, status: 'ready', date: 'just now' }, ...d]);
        return;
      }
      setUploading(u => u.map((x: any) => x.id === id ? { ...x, stage: stages[i] } : x));
      setTimeout(tick, 1200);
    };
    setTimeout(tick, 1200);
  };

  const theme = THEME[themeName] || THEME.honey;
  const openApp = apps.find((a: any) => a.id === openAppId);
  const openColl = collections.find((c: any) => c.id === openCollId);
  const counts: Record<string, number> = { apps: apps.length, documents: docs.length, collections: collections.length };

  return (
    <ThemeCtx.Provider value={theme}>
      <div style={{ background: theme.appBg, color: theme.text, fontFamily: '"Inter", system-ui, sans-serif' }} className="h-screen flex">
        <Sidebar active={active} onChange={setActive} theme={themeName} onThemeChange={setThemeName} counts={counts}/>
        <main className="flex-1 flex flex-col min-w-0" style={{ background: theme.appBg }}>
          {active === 'guide' && <GuidePage/>}
          {active === 'apps' && (openApp
            ? <AppDetail app={openApp} collections={collections} onBack={() => setOpenAppId(null)} onUpdate={(u: any) => setApps((a: any) => a.map((x: any) => x.id === u.id ? u : x))}/>
            : <AppsPage apps={apps} onOpen={setOpenAppId} onCreate={() => setCreateOpen(true)}/>
          )}
          {active === 'documents' && <DocumentsPage docs={docs} collections={collections} themeName={themeName} uploading={uploading} onStartUpload={startUpload}/>}
          {active === 'collections' && (openColl
            ? <CollectionDetail collection={openColl} docs={docs} apps={apps} onBack={() => setOpenCollId(null)} themeName={themeName}/>
            : <CollectionsPage collections={collections} docs={docs} apps={apps} onOpen={setOpenCollId} onCreate={() => {}}/>
          )}
          {active === 'playground' && <PlaygroundPage collections={collections}/>}
          {active === 'settings' && <SettingsPage/>}
        </main>
        <CreateAppModal open={createOpen} onClose={() => setCreateOpen(false)} onCreate={(a: any) => setApps((p: any) => [a, ...p])} collections={collections}/>
      </div>
    </ThemeCtx.Provider>
  );
}

export default function Root() {
  return (
    <I18nProvider>
      <App/>
    </I18nProvider>
  );
}
