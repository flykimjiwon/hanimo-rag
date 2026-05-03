// @ts-nocheck
import React from 'react';
import { useTheme, I, Btn, Tag, Empty } from '../lib';
import { useI18n } from '../i18n';
import { Topbar } from '../chrome';

function AppCard({ app, onOpen }: any) {
  const t = useTheme();
  const { t: tr } = useI18n();
  const url = `https://api.hanimo.dev/v1/${app.id}`;
  return (
    <div onClick={onOpen} style={{ background: t.surface, border: `1px solid ${t.border}` }} className="rounded-lg cursor-pointer p-4 hover:opacity-95 transition-opacity">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2.5">
          <div style={{ background: t.brand, color: t.brandText }} className="w-8 h-8 rounded-md flex items-center justify-center">{I.hex}</div>
          <div>
            <div style={{ color: t.text }} className="text-[13.5px] font-semibold">{app.name}</div>
            <div style={{ color: t.textDim }} className="text-[11.5px]">{app.description}</div>
          </div>
        </div>
        <Tag color="green"><span className="w-1.5 h-1.5 rounded-full" style={{ background: t.success }}/>{tr('apps_live')}</Tag>
      </div>
      <div style={{ background: t.surface2, border: `1px solid ${t.borderSoft}` }} className="rounded-md px-2.5 h-8 flex items-center gap-2 mb-3">
        <span style={{ color: t.success }} className="text-[10px] font-bold tracking-wider">POST</span>
        <code style={{ color: t.textMuted }} className="text-[12px] font-mono truncate flex-1">{url}</code>
        <span style={{ color: t.textFaint }}>{I.copy}</span>
      </div>
      <div style={{ color: t.textDim }} className="flex items-center gap-3 text-[11.5px]">
        <span className="flex items-center gap-1">{I.database}<span style={{ color: t.textMuted }} className="font-mono">{app.model}</span></span>
        <span style={{ color: t.border }}>·</span>
        <span className="font-mono">{app.requests.toLocaleString()} {tr('apps_req')}</span>
        <span style={{ color: t.border }}>·</span>
        <span className="font-mono">p50 {app.p50}ms</span>
      </div>
    </div>
  );
}

function NewAppTile({ onClick }: any) {
  const t = useTheme();
  const { t: tr } = useI18n();
  return (
    <button onClick={onClick} style={{ border: `1px dashed ${t.border}`, color: t.textDim }}
      className="rounded-lg hover:opacity-80 p-4 flex flex-col items-center justify-center gap-2 min-h-[180px] transition-opacity">
      <div style={{ background: t.chipBg }} className="w-9 h-9 rounded-full flex items-center justify-center">{I.plus}</div>
      <span className="text-[13px] font-medium">{tr('apps_create_new')}</span>
      <span style={{ color: t.textFaint }} className="text-[11.5px]">{tr('apps_create_sub')}</span>
    </button>
  );
}

export function AppsPage({ apps, onOpen, onCreate }: any) {
  const { t: tr } = useI18n();
  return (
    <div className="flex flex-col h-full">
      <Topbar title={tr('apps_title')} subtitle={tr('apps_subtitle')} action={<Btn onClick={onCreate}>{I.plus}{tr('new_app')}</Btn>}/>
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-[1100px] mx-auto px-6 py-6">
          {apps.length === 0 ? (
            <Empty icon={I.bolt} title={tr('apps_empty_t')} desc={tr('apps_empty_d')} action={<Btn onClick={onCreate}>{I.plus}{tr('new_app')}</Btn>}/>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {apps.map((a: any) => <AppCard key={a.id} app={a} onOpen={() => onOpen(a.id)}/>)}
              <NewAppTile onClick={onCreate}/>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default AppsPage;
