// @ts-nocheck
import React from 'react';
import { useTheme, I, Btn, Card, Tag, Input, Select } from '../lib';
import { useI18n } from '../i18n';
import { Topbar } from '../chrome';

export default function PlaygroundPage({ collections }: any) {
  const t = useTheme();
  const { t: tr } = useI18n();
  const [q, setQ] = React.useState('');
  const [mode, setMode] = React.useState('hybrid');
  const [view, setView] = React.useState('single');
  const [results, setResults] = React.useState<any[]>([]);
  const [compared, setCompared] = React.useState<any>(null);

  const baseResults = [
    { score: 0.91, file: 'Refund Policy.pdf', chunk: 'Refunds are processed within 5 business days. Once approved, the amount is credited back to the original payment method...' },
    { score: 0.84, file: 'FAQ.md', chunk: 'For refund requests, contact support@hanimo.dev. International transfers may take an additional 3 days depending on the bank.' },
    { score: 0.78, file: 'Onboarding Guide.docx', chunk: 'After cancellation, your account remains active until the end of the billing period.' },
    { score: 0.72, file: 'Pricing 2026.xlsx', chunk: 'Annual plans are pro-rated for the unused months when refunded.' },
  ];

  // TODO: wire to apiSearch(q, { mode, topK: 5 })
  const search = () => {
    if (!q.trim()) return;
    setResults(baseResults.map(r => ({ ...r, match: mode })));
  };

  // TODO: wire to parallel apiSearch calls for each mode
  const compareAll = () => {
    if (!q.trim()) return;
    const modes = ['hybrid', 'vector', 'fts', 'graph'];
    const out: Record<string, any[]> = {};
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
              <Input value={q} onChange={(e: any) => setQ(e.target.value)}
                onKeyDown={(e: any) => e.key === 'Enter' && (view === 'single' ? search() : compareAll())}
                placeholder={tr('pg_placeholder')}/>
              <Btn onClick={() => view === 'single' ? search() : compareAll()}>{I.search}{tr('pg_search')}</Btn>
            </div>
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div style={{ background: t.chipBg }} className="flex rounded-md p-0.5">
                  {[['single', tr('pg_single')], ['compare', tr('pg_compare_t')]].map(([id, label]: any) => (
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
                {collections.map((c: any) => <option key={c.id}>{c.name}</option>)}
              </Select>
            </div>
            {view === 'compare' && (
              <div style={{ color: t.textDim }} className="text-[11.5px] mt-3">{tr('pg_compare_d')}</div>
            )}
          </Card>

          {view === 'single' ? (
            results.length > 0 ? (
              <div className="space-y-2">
                {results.map((r: any, i: number) => (
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
                      {compared[m].map((r: any, i: number) => (
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
