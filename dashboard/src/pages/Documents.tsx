// @ts-nocheck
import React from 'react';
import { useTheme, I, Btn, Card, Empty, StatusDot, fileColor } from '../lib';
import { useI18n } from '../i18n';
import { Topbar } from '../chrome';

function UploadRow({ item, first }: any) {
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
        <span style={{ color: t.textDim }} className="text-[11.5px] font-mono">{tr(stages[idx]?.key || stages[0].key)}…</span>
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

export default function DocumentsPage({ docs, collections, themeName, uploading, onStartUpload }: any) {
  const t = useTheme();
  const { t: tr } = useI18n();
  const [selected, setSelected] = React.useState(new Set<string>());
  const [filter, setFilter] = React.useState('all');
  const filtered = docs.filter((d: any) => filter === 'all' || d.status === filter);
  const toggle = (id: string) => setSelected(s => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const totalChunks = docs.reduce((a: number, d: any) => a + d.chunks, 0);

  return (
    <div className="flex flex-col h-full">
      <Topbar
        title={tr('docs_title')}
        subtitle={tr('docs_subtitle', docs.length, totalChunks)}
        action={<Btn onClick={onStartUpload}>{I.upload}{tr('upload')}</Btn>}
      />
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
                  {uploading.map((u: any, i: number) => (
                    <UploadRow key={u.id} item={u} first={i === 0}/>
                  ))}
                </Card>
              )}

              <div className="flex items-center justify-between">
                <div style={{ background: t.chipBg }} className="flex rounded-md p-0.5">
                  {[['all', tr('docs_filter_all'), docs.length], ['ready', tr('docs_filter_ready'), docs.filter((d: any) => d.status === 'ready').length], ['processing', tr('docs_filter_processing'), docs.filter((d: any) => d.status === 'processing').length]].map(([id, label, n]: any) => (
                    <button key={id} onClick={() => setFilter(id)}
                      style={{ background: filter === id ? t.surface : 'transparent', color: filter === id ? t.text : t.textDim, boxShadow: filter === id ? '0 1px 2px rgba(0,0,0,0.05)' : 'none' }}
                      className="h-7 px-3 rounded text-[12px] font-medium flex items-center gap-1.5">
                      {label}<span style={{ color: t.textFaint }} className="font-mono">{n}</span>
                    </button>
                  ))}
                </div>
                {selected.size > 0 && (
                  <div className="flex items-center gap-2">
                    <span style={{ color: t.textDim }} className="text-[12px]">{tr('docs_selected', selected.size)}</span>
                    <Btn variant="secondary" size="sm">{tr('docs_add_to_coll')}</Btn>
                    <Btn variant="danger" size="sm">{I.trash}{tr('docs_delete')}</Btn>
                  </div>
                )}
              </div>

              <Card className="overflow-hidden">
                <div style={{ borderBottom: `1px solid ${t.borderSoft}`, color: t.textDim }} className="px-4 py-2 grid grid-cols-12 gap-4 text-[10.5px] font-semibold uppercase tracking-wider">
                  <div className="col-span-6 flex items-center gap-3">
                    <input type="checkbox"
                      checked={selected.size === filtered.length && filtered.length > 0}
                      onChange={e => setSelected(e.target.checked ? new Set(filtered.map((d: any) => d.id)) : new Set())}/>
                    {tr('docs_col_name')}
                  </div>
                  <div className="col-span-2">{tr('docs_col_status')}</div>
                  <div className="col-span-1">{tr('docs_col_chunks')}</div>
                  <div className="col-span-2">{tr('docs_col_size')}</div>
                  <div className="col-span-1">{tr('docs_col_added')}</div>
                </div>
                {filtered.map((d: any) => {
                  const c = fileColor(d.type, themeName);
                  return (
                    <div key={d.id} style={{ borderTop: `1px solid ${t.borderSoft}` }} className="px-4 py-3 grid grid-cols-12 gap-4 items-center hover:opacity-90">
                      <div className="col-span-6 flex items-center gap-3 min-w-0">
                        <input type="checkbox" checked={selected.has(d.id)} onChange={() => toggle(d.id)}/>
                        <div style={{ background: c.bg, color: c.fg }} className="w-7 h-7 rounded shrink-0 flex items-center justify-center text-[10px] font-bold uppercase">{d.type}</div>
                        <span style={{ color: t.text }} className="text-[13px] font-medium truncate">{d.name}</span>
                      </div>
                      <div className="col-span-2 flex items-center gap-2 text-[12px]" style={{ color: t.textMuted }}>
                        <StatusDot status={d.status}/><span className="capitalize">{d.status}</span>
                      </div>
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
