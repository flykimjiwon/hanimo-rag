// @ts-nocheck
import React from 'react';
import { BRAND, THEME } from './theme';
import type { ThemeTokens } from './theme';
import { useI18n } from './i18n';

// ── Theme context ─────────────────────────────────────────────────────────────
export const ThemeCtx = React.createContext<ThemeTokens>(THEME.honey);
export const useTheme = () => React.useContext(ThemeCtx);

// ── Mock data (UI demo — TODO: replace with real API hooks) ───────────────────
export const MOCK_DOCS = [
  { id: 'd1', name: 'Refund Policy.pdf', type: 'pdf', size: '124 KB', chunks: 18, status: 'ready', date: '2 days ago' },
  { id: 'd2', name: 'API Reference.md', type: 'md', size: '42 KB', chunks: 9, status: 'ready', date: '2 days ago' },
  { id: 'd3', name: 'Onboarding Guide.docx', type: 'docx', size: '230 KB', chunks: 24, status: 'ready', date: '5 days ago' },
  { id: 'd4', name: 'Pricing 2026.xlsx', type: 'xlsx', size: '88 KB', chunks: 12, status: 'ready', date: '1 week ago' },
  { id: 'd5', name: 'Architecture.pdf', type: 'pdf', size: '1.2 MB', chunks: 56, status: 'processing', date: 'just now' },
  { id: 'd6', name: 'FAQ.md', type: 'md', size: '18 KB', chunks: 6, status: 'ready', date: '2 weeks ago' },
];

export const MOCK_COLLECTIONS = [
  { id: 'c1', name: 'Support', docs: ['d1', 'd6', 'd3'], desc: 'Customer-facing FAQ, refunds, onboarding.' },
  { id: 'c2', name: 'Engineering', docs: ['d2', 'd5'], desc: 'API reference and architecture docs.' },
  { id: 'c3', name: 'Sales', docs: ['d4'], desc: 'Pricing sheets and deal collateral.' },
];

export const MOCK_APPS = [
  { id: 'app_8f3a', name: 'Support Bot', description: 'Customer support assistant', collection: 'c1', model: 'gpt-4o-mini', prompt: 'You are a helpful support assistant.', mode: 'hybrid', topK: 5, temperature: 0.3, requests: 1284, p50: 412 },
  { id: 'app_2c1d', name: 'Docs Search', description: 'Internal engineering Q&A', collection: 'c2', model: 'llama3.1', prompt: 'Answer technical questions precisely.', mode: 'hybrid', topK: 8, temperature: 0.1, requests: 542, p50: 380 },
];

export const APP_PRESETS = [
  { id: 'blank', titleKey: 'cm_preset_blank', descKey: 'cm_preset_blank_d', prompt: 'You are a helpful assistant.', mode: 'hybrid', topK: 5, temperature: 0.3, model: 'gpt-4o-mini' },
  { id: 'support', titleKey: 'cm_preset_support_t', descKey: 'cm_preset_support_d', prompt: 'You are a friendly customer support agent. Be concise. Always cite sources.', mode: 'hybrid', topK: 5, temperature: 0.2, model: 'gpt-4o-mini' },
  { id: 'wiki', titleKey: 'cm_preset_wiki_t', descKey: 'cm_preset_wiki_d', prompt: 'You answer engineering questions thoroughly with code examples.', mode: 'hybrid', topK: 8, temperature: 0.1, model: 'llama3.1' },
  { id: 'code', titleKey: 'cm_preset_code_t', descKey: 'cm_preset_code_d', prompt: 'Find code snippets matching the query. Include filename + line range.', mode: 'fts', topK: 10, temperature: 0, model: 'gpt-4o-mini' },
  { id: 'research', titleKey: 'cm_preset_research_t', descKey: 'cm_preset_research_d', prompt: 'Summarize relevant passages with inline citations like [1][2].', mode: 'hybrid', topK: 12, temperature: 0.4, model: 'gpt-4o' },
];

// ── Icons ─────────────────────────────────────────────────────────────────────
const Icon = ({ d, size = 16 }: { d: React.ReactNode; size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">{d}</svg>
);

export const I: Record<string, React.ReactNode> = {
  apps: <Icon d={<><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></>}/>,
  doc: <Icon d={<><path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><path d="M14 3v6h6"/></>}/>,
  search: <Icon d={<><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></>}/>,
  settings: <Icon d={<><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33h0a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51h0a1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82v0a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></>}/>,
  guide: <Icon d={<><circle cx="12" cy="12" r="9"/><path d="M12 8v4M12 16h.01"/></>}/>,
  plus: <Icon d={<><path d="M12 5v14M5 12h14"/></>}/>,
  copy: <Icon d={<><rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h10"/></>}/>,
  check: <Icon d={<path d="m5 12 4 4 10-10"/>}/>,
  send: <Icon d={<><path d="M22 2 11 13"/><path d="M22 2 15 22l-4-9-9-4z"/></>}/>,
  upload: <Icon d={<><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="M17 8 12 3 7 8"/><path d="M12 3v12"/></>}/>,
  trash: <Icon d={<><path d="M3 6h18"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><path d="M6 6v14a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V6"/></>}/>,
  arrow: <Icon d={<path d="m9 18 6-6-6-6"/>}/>,
  more: <Icon d={<><circle cx="5" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/></>}/>,
  globe: <Icon d={<><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/></>}/>,
  bolt: <Icon d={<path d="M13 2 3 14h7l-1 8 10-12h-7z"/>}/>,
  database: <Icon d={<><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5v6c0 1.66 4 3 9 3s9-1.34 9-3V5"/><path d="M3 11v6c0 1.66 4 3 9 3s9-1.34 9-3v-6"/></>}/>,
  close: <Icon d={<><path d="M18 6 6 18M6 6l12 12"/></>}/>,
  sun: <Icon d={<><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/></>}/>,
  moon: <Icon d={<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>}/>,
  layers: <Icon d={<><path d="m12 2 9 5-9 5-9-5z"/><path d="m3 12 9 5 9-5"/><path d="m3 17 9 5 9-5"/></>}/>,
  shield: <Icon d={<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>}/>,
  hex: <Icon d={<path d="M12 2 21 7v10l-9 5-9-5V7z"/>}/>,
  drop: <Icon d={<path d="M12 2.5s7 7.5 7 12.5a7 7 0 1 1-14 0c0-5 7-12.5 7-12.5z"/>}/>,
  paw: <Icon d={<><circle cx="6" cy="10" r="2"/><circle cx="10" cy="6" r="2"/><circle cx="14" cy="6" r="2"/><circle cx="18" cy="10" r="2"/><path d="M8 16c0-2.5 2-4 4-4s4 1.5 4 4-1.5 4-4 4-4-1.5-4-4z"/></>}/>,
};

// ── File color helper ─────────────────────────────────────────────────────────
export const fileColor = (type: string, themeName: string) => {
  const isDark = themeName === 'dark';
  const m: Record<string, any> = isDark ? {
    pdf: { bg: '#2A0A0A', fg: '#F87171' }, md: { bg: '#0C1F3D', fg: '#60A5FA' },
    docx: { bg: '#0F1A3D', fg: '#818CF8' }, xlsx: { bg: '#052E16', fg: '#4ADE80' },
    txt: { bg: '#1F1F1F', fg: '#A3A3A3' },
  } : (themeName === 'honey' ? {
    pdf: { bg: '#FEF2F2', fg: '#B91C1C' }, md: { bg: BRAND.honey50, fg: BRAND.honey600 },
    docx: { bg: '#EFF6FF', fg: '#1D4ED8' }, xlsx: { bg: '#F0FDF4', fg: '#15803D' },
    txt: { bg: BRAND.modol100, fg: BRAND.charcoal },
  } : {
    pdf: { bg: '#FEF2F2', fg: '#DC2626' }, md: { bg: '#F0F9FF', fg: '#0284C7' },
    docx: { bg: '#EFF6FF', fg: '#2563EB' }, xlsx: { bg: '#F0FDF4', fg: '#16A34A' },
    txt: { bg: '#F8FAFC', fg: '#475569' },
  });
  return m[type] || m.txt;
};

// ── Shared UI components ──────────────────────────────────────────────────────
export const Btn = ({ children, variant = 'primary', size = 'md', ...p }: any) => {
  const t = useTheme();
  const sz: Record<string, string> = { sm: 'h-7 px-2.5 text-[12px]', md: 'h-9 px-3.5 text-[13px]' };
  const styles: Record<string, React.CSSProperties> = {
    primary: { background: t.accent, color: t.accentText },
    secondary: { background: t.surface, color: t.text, border: `1px solid ${t.border}` },
    ghost: { background: 'transparent', color: t.textMuted },
    danger: { background: t.surface, color: t.danger, border: `1px solid ${t.border}` },
  };
  return (
    <button {...p} style={{ ...styles[variant], ...(p.style || {}) }}
      className={`inline-flex items-center justify-center gap-1.5 rounded-md font-medium transition-all disabled:opacity-50 disabled:pointer-events-none hover:opacity-90 ${sz[size] ?? sz.md} ${p.className || ''}`}>
      {children}
    </button>
  );
};

export const Input = (p: any) => {
  const t = useTheme();
  return (
    <input {...p} style={{ background: t.surface, border: `1px solid ${t.border}`, color: t.text, ...(p.style || {}) }}
      className={`h-9 w-full px-3 text-[13px] rounded-md placeholder:opacity-50 focus:outline-none transition-all ${p.className || ''}`}/>
  );
};

export const Textarea = (p: any) => {
  const t = useTheme();
  return (
    <textarea {...p} style={{ background: t.surface, border: `1px solid ${t.border}`, color: t.text }}
      className={`w-full px-3 py-2 text-[13px] rounded-md placeholder:opacity-50 focus:outline-none resize-none font-mono ${p.className || ''}`}/>
  );
};

export const Select = (p: any) => {
  const t = useTheme();
  return (
    <select {...p} style={{ background: t.surface, border: `1px solid ${t.border}`, color: t.text, ...(p.style || {}) }}
      className={`h-9 w-full px-3 text-[13px] rounded-md focus:outline-none ${p.className || ''}`}>
      {p.children}
    </select>
  );
};

export const Tag = ({ children, color = 'neutral' }: { children: React.ReactNode; color?: string }) => {
  const t = useTheme();
  const c: Record<string, { bg: string; fg: string }> = {
    neutral: { bg: t.chipBg, fg: t.chipText },
    green: { bg: t.successBg, fg: t.success },
    blue: { bg: t.blueBg, fg: t.blue },
    amber: { bg: t.amberBg, fg: t.amber },
    purple: { bg: t.purpleBg, fg: t.purple },
  };
  const col = c[color] ?? c.neutral;
  return (
    <span style={{ background: col.bg, color: col.fg }}
      className="inline-flex items-center gap-1 px-2 h-5 rounded text-[11px] font-medium">
      {children}
    </span>
  );
};

export const StatusDot = ({ status }: { status: string }) => {
  const t = useTheme();
  const c: Record<string, string> = { ready: t.success, processing: t.amber, error: t.danger };
  const color = c[status] ?? t.textFaint;
  return (
    <span className="relative flex w-1.5 h-1.5">
      {status === 'processing' && (
        <span className="absolute inline-flex w-full h-full rounded-full opacity-75 animate-ping" style={{ background: color }}/>
      )}
      <span className="relative inline-flex w-1.5 h-1.5 rounded-full" style={{ background: color }}/>
    </span>
  );
};

export const CopyBtn = ({ text, label }: { text: string; label?: string }) => {
  const t = useTheme();
  const { t: tr } = useI18n();
  const [copied, setCopied] = React.useState(false);
  return (
    <button
      onClick={() => { navigator.clipboard?.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 1500); }}
      style={{ color: t.textMuted }}
      className="inline-flex items-center gap-1.5 h-7 px-2 rounded-md text-[12px] font-medium hover:opacity-70 transition-opacity">
      {copied ? I.check : I.copy}{copied ? tr('copied') : (label || tr('copy'))}
    </button>
  );
};

export const Card = ({ children, className = '', style = {}, ...p }: any) => {
  const t = useTheme();
  return (
    <div {...p} style={{ background: t.surface, border: `1px solid ${t.border}`, ...style }}
      className={`rounded-lg ${className}`}>
      {children}
    </div>
  );
};

export const Empty = ({ icon, title, desc, action }: { icon: React.ReactNode; title: string; desc: string; action?: React.ReactNode }) => {
  const t = useTheme();
  return (
    <div style={{ border: `1px dashed ${t.border}` }} className="rounded-lg py-16 px-6 flex flex-col items-center justify-center text-center">
      <div style={{ background: t.chipBg, color: t.textMuted }} className="w-12 h-12 rounded-full flex items-center justify-center mb-4">{icon}</div>
      <div style={{ color: t.text }} className="text-[14px] font-semibold mb-1">{title}</div>
      <div style={{ color: t.textDim }} className="text-[12.5px] max-w-[380px] mb-4">{desc}</div>
      {action}
    </div>
  );
};

// Re-export BRAND and THEME for convenience
export { BRAND, THEME };
