// @ts-nocheck
import React from 'react';
import { useTheme, I, Btn, Card, Empty, fileColor } from '../lib';
import { useI18n } from '../i18n';
import { Topbar } from '../chrome';

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

export function CollectionDetail({ collection, docs, apps, onBack, themeName }: any) {
  const t = useTheme();
  const { t: tr } = useI18n();
  const cDocs = docs.filter((d: any) => collection.docs.includes(d.id));
  const cApps = apps.filter((a: any) => a.collection === collection.id);
  const chunks = cDocs.reduce((a: number, d: any) => a + d.chunks, 0);
  return (
    <div className="flex flex-col h-full">
      <Topbar
        leading={<button onClick={onBack} style={{ color: t.textMuted }} className="w-7 h-7 rounded-md flex items-center justify-center hover:opacity-70"><span className="rotate-180">{I.arrow}</span></button>}
        title={collection.name}
        subtitle={collection.desc}
        action={<Btn variant="secondary" size="sm">{I.more}</Btn>}
      />
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-[1100px] mx-auto px-6 py-6 space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <InfoCard label={tr('docs_title')} value={cDocs.length} sub={`${cDocs.filter((d: any) => d.status === 'ready').length} ready`} icon={I.doc}/>
            <InfoCard label={tr('coll_total_chunks')} value={chunks} sub={`avg ${cDocs.length ? Math.round(chunks / cDocs.length) : 0} per doc`} icon={I.database}/>
            <InfoCard label={tr('apps_title')} value={cApps.length} sub={`${cApps.reduce((a: number, x: any) => a + x.requests, 0).toLocaleString()} reqs total`} icon={I.bolt}/>
          </div>

          <Card className="overflow-hidden">
            <div style={{ borderBottom: `1px solid ${t.borderSoft}` }} className="px-5 py-3 flex items-center justify-between">
              <div style={{ color: t.text }} className="text-[13px] font-semibold">{tr('coll_apps_using')}</div>
              <span style={{ color: t.textFaint }} className="text-[11.5px] font-mono">{cApps.length}</span>
            </div>
            {cApps.length === 0 ? (
              <div style={{ color: t.textDim }} className="px-5 py-10 text-center text-[12.5px]">{tr('coll_no_apps')}</div>
            ) : cApps.map((a: any, i: number) => (
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
            {cDocs.map((d: any, i: number) => {
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

export function CollectionsPage({ collections, docs, apps, onOpen, onCreate }: any) {
  const t = useTheme();
  const { t: tr } = useI18n();
  return (
    <div className="flex flex-col h-full">
      <Topbar
        title={tr('coll_title')}
        subtitle={tr('coll_subtitle')}
        action={<Btn onClick={onCreate}>{I.plus}{tr('coll_new')}</Btn>}
      />
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-[1100px] mx-auto px-6 py-6">
          {collections.length === 0 ? (
            <Empty icon={I.layers} title={tr('coll_empty_t')} desc={tr('coll_empty_d')}
              action={<Btn onClick={onCreate}>{I.plus}{tr('coll_new')}</Btn>}/>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {collections.map((c: any) => {
                const cDocs = docs.filter((d: any) => c.docs.includes(d.id));
                const cApps = apps.filter((a: any) => a.collection === c.id);
                const chunks = cDocs.reduce((a: number, d: any) => a + d.chunks, 0);
                return (
                  <div key={c.id} onClick={() => onOpen(c.id)}
                    style={{ background: t.surface, border: `1px solid ${t.border}` }}
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

export default CollectionsPage;
