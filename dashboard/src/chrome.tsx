// @ts-nocheck
import React from 'react';
import { useTheme } from './lib';
import { useI18n } from './i18n';
import { I } from './lib';

const NAV = [
  { id: 'guide', key: 'nav_guide', icon: I.guide },
  { id: 'apps', key: 'nav_apps', icon: I.apps },
  { id: 'documents', key: 'nav_documents', icon: I.doc },
  { id: 'collections', key: 'nav_collections', icon: I.layers },
  { id: 'playground', key: 'nav_playground', icon: I.search },
  { id: 'settings', key: 'nav_settings', icon: I.settings },
];

export function Sidebar({ active, onChange, theme: themeName, onThemeChange, counts }: {
  active: string;
  onChange: (id: string) => void;
  theme: string;
  onThemeChange: (id: string) => void;
  counts: Record<string, number>;
}) {
  const t = useTheme();
  const { lang, setLang, t: tr } = useI18n();
  const themes = [
    { id: 'light', icon: I.sun, label: tr('light_mode') },
    { id: 'dark', icon: I.moon, label: tr('dark_mode') },
    { id: 'honey', icon: I.hex, label: tr('honey_mode') },
  ];
  return (
    <aside style={{ background: t.sidebarBg, borderRight: `1px solid ${t.border}` }} className="w-[220px] shrink-0 flex flex-col">
      <div style={{ borderBottom: `1px solid ${t.border}` }} className="h-14 px-4 flex items-center gap-2">
        <div
          style={{
            background: t.brand, color: t.brandText,
            boxShadow: themeName === 'honey' ? `0 1px 0 rgba(0,0,0,0.04), 0 0 0 1px ${t.brandBorder}` : 'none',
          }}
          className="w-6 h-6 rounded-md flex items-center justify-center">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2 21 7v10l-9 5-9-5V7z"/></svg>
        </div>
        <div className="flex-1 min-w-0">
          <div style={{ color: t.text }} className="text-[13px] font-semibold leading-tight">hanimo</div>
          <div style={{ color: t.textFaint }} className="text-[10.5px] leading-tight font-mono">rag · v0.4.2</div>
        </div>
      </div>
      <nav className="flex-1 px-2 py-3">
        {NAV.map(n => {
          const isActive = active === n.id;
          const badge = counts[n.id];
          return (
            <button key={n.id} onClick={() => onChange(n.id)}
              style={{ background: isActive ? t.chipBg : 'transparent', color: isActive ? t.text : t.textMuted }}
              className="w-full h-8 px-2 rounded-md flex items-center gap-2.5 text-[13px] font-medium hover:opacity-80 transition-all mb-0.5">
              <span className="w-4 h-4 flex items-center justify-center">{n.icon}</span>
              <span className="flex-1 text-left">{tr(n.key)}</span>
              {badge != null && <span style={{ color: t.textFaint }} className="text-[11px] font-mono">{badge}</span>}
            </button>
          );
        })}
      </nav>
      <div style={{ borderTop: `1px solid ${t.border}` }} className="p-3 space-y-2">
        <div style={{ background: t.surface2, border: `1px solid ${t.border}` }} className="flex rounded-md p-0.5" role="group" aria-label={tr('theme_label')}>
          {themes.map(th => (
            <button key={th.id} onClick={() => onThemeChange(th.id)}
              title={th.label}
              style={{
                background: themeName === th.id ? t.surface : 'transparent',
                color: themeName === th.id ? (th.id === 'honey' ? t.brand : t.text) : t.textDim,
                boxShadow: themeName === th.id ? '0 1px 2px rgba(0,0,0,0.05)' : 'none',
              }}
              className="flex-1 h-7 rounded flex items-center justify-center hover:opacity-80">
              {th.icon}
            </button>
          ))}
        </div>
        <div style={{ background: t.surface2, border: `1px solid ${t.border}` }} className="flex rounded-md p-0.5">
          {[['en', 'EN'], ['ko', '한']].map(([code, label]) => (
            <button key={code} onClick={() => setLang(code)}
              style={{
                background: lang === code ? t.surface : 'transparent',
                color: lang === code ? t.text : t.textDim,
                boxShadow: lang === code ? '0 1px 2px rgba(0,0,0,0.05)' : 'none',
              }}
              className="flex-1 h-6 rounded text-[11px] font-medium">
              {label}
            </button>
          ))}
        </div>
        <div style={{ background: t.surface2, border: `1px solid ${t.borderSoft}` }} className="rounded-md p-2.5 flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full" style={{ background: t.success }}/>
          <div className="flex-1 min-w-0">
            <div style={{ color: t.text }} className="text-[12px] font-medium">{tr('server_running')}</div>
            <div style={{ color: t.textFaint }} className="text-[10.5px] font-mono truncate">localhost:8009</div>
          </div>
        </div>
      </div>
    </aside>
  );
}

export function Topbar({ title, subtitle, action, leading }: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  leading?: React.ReactNode;
}) {
  const t = useTheme();
  return (
    <div style={{ background: t.surface, borderBottom: `1px solid ${t.border}` }} className="h-14 px-6 flex items-center justify-between shrink-0">
      <div className="flex items-center gap-3 min-w-0">
        {leading}
        <div className="min-w-0">
          <div style={{ color: t.text }} className="text-[14px] font-semibold leading-tight truncate">{title}</div>
          {subtitle && <div style={{ color: t.textDim }} className="text-[12px] leading-tight mt-0.5 truncate">{subtitle}</div>}
        </div>
      </div>
      {action}
    </div>
  );
}
