// @ts-nocheck
import React from 'react';
import { useTheme, BRAND, I, CopyBtn, Card, Tag } from '../lib';
import { useI18n } from '../i18n';
import { Topbar } from '../chrome';

export default function GuidePage() {
  const t = useTheme();
  const { t: tr } = useI18n();
  return (
    <div className="flex flex-col h-full">
      <Topbar title={tr('guide_title')} subtitle={tr('guide_subtitle')}/>
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-[820px] mx-auto px-6 py-8 space-y-6">
          <div>
            <div style={{ color: t.textDim }} className="text-[11px] font-semibold uppercase tracking-[0.12em] mb-3">{tr('guide_concept_kicker')}</div>
            <h1 style={{ color: t.text }} className="text-[28px] font-semibold leading-tight tracking-tight mb-3">
              {tr('guide_hero_l1')}<br/>{tr('guide_hero_l2')}
            </h1>
            <p style={{ color: t.textDim }} className="text-[14px] leading-relaxed max-w-[600px]">{tr('guide_hero_desc')}</p>
          </div>

          <Card className="overflow-hidden" style={{ background: `linear-gradient(135deg, ${t.brandBg} 0%, ${t.surface} 60%)`, borderColor: t.brandBorder }}>
            <div className="p-5 flex items-start gap-4">
              <div style={{ background: t.brand, color: t.brandText, boxShadow: `0 8px 24px -8px ${BRAND.honey400}66` }} className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2 21 7v10l-9 5-9-5V7z"/></svg>
              </div>
              <div className="flex-1 min-w-0">
                <div style={{ color: t.brand }} className="text-[10.5px] font-semibold uppercase tracking-[0.14em] mb-1">{tr('guide_brand_kicker')}</div>
                <div style={{ color: t.text }} className="text-[14.5px] font-semibold mb-1.5">{tr('guide_brand_t')}</div>
                <div style={{ color: t.textDim }} className="text-[12.5px] leading-relaxed max-w-[560px]">{tr('guide_brand_d')}</div>
              </div>
              <div className="flex flex-col gap-1 shrink-0">
                {[BRAND.honey200, BRAND.honey400, BRAND.honey600, BRAND.charcoal].map(c => (
                  <div key={c} style={{ background: c, border: `1px solid ${t.borderSoft}` }} className="w-6 h-6 rounded"/>
                ))}
              </div>
            </div>
          </Card>

          <Card className="p-5">
            <div style={{ color: t.text }} className="text-[13px] font-semibold mb-3">{tr('guide_why')}</div>
            <div className="grid grid-cols-3 gap-4">
              {[['guide_why1_t', 'guide_why1_d'], ['guide_why2_t', 'guide_why2_d'], ['guide_why3_t', 'guide_why3_d']].map(([tk, dk]) => (
                <div key={tk}>
                  <div style={{ color: t.text }} className="text-[12.5px] font-semibold mb-1">{tr(tk)}</div>
                  <div style={{ color: t.textDim }} className="text-[11.5px] leading-relaxed">{tr(dk)}</div>
                </div>
              ))}
            </div>
          </Card>

          <div>
            <div style={{ color: t.text }} className="text-[15px] font-semibold mb-3">{tr('guide_flow')}</div>
            <div className="space-y-2">
              {[['01', 'guide_flow1_t', 'guide_flow1_d'], ['02', 'guide_flow2_t', 'guide_flow2_d'], ['03', 'guide_flow3_t', 'guide_flow3_d'], ['04', 'guide_flow4_t', 'guide_flow4_d']].map(([n, tk, dk]) => (
                <div key={n} style={{ background: t.surface, border: `1px solid ${t.border}` }} className="rounded-lg p-4 flex items-start gap-4 hover:opacity-90">
                  <div style={{ color: t.textFaint }} className="text-[13px] font-mono pt-0.5">{n}</div>
                  <div className="flex-1">
                    <div style={{ color: t.text }} className="text-[13.5px] font-semibold">{tr(tk)}</div>
                    <div style={{ color: t.textDim }} className="text-[12px] mt-0.5">{tr(dk)}</div>
                  </div>
                  <div style={{ color: t.textFaint }} className="pt-1">{I.arrow}</div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <div style={{ color: t.text }} className="text-[15px] font-semibold mb-3">{tr('guide_quickstart')}</div>
            <Card className="overflow-hidden">
              <div style={{ borderBottom: `1px solid ${t.borderSoft}` }} className="px-4 py-2.5 flex items-center justify-between">
                <span style={{ color: t.textDim }} className="text-[11.5px] font-mono">terminal</span>
                <CopyBtn text={`pip install hanimo-rag\nhanimo-rag serve --db postgresql://localhost:5439/hanimo`}/>
              </div>
              <pre style={{ background: t.codeBg, color: t.codeText }} className="px-4 py-3 text-[12.5px] font-mono leading-relaxed overflow-x-auto">{`$ pip install hanimo-rag
$ hanimo-rag serve --db postgresql://localhost:5439/hanimo
  → Dashboard:  http://localhost:8009/dashboard
  → API:        http://localhost:8009/api`}</pre>
            </Card>
          </div>

          <div>
            <div style={{ color: t.text }} className="text-[15px] font-semibold mb-3">{tr('guide_search_modes')}</div>
            <Card>
              <div style={{ borderBottom: `1px solid ${t.borderSoft}` }} className="grid grid-cols-12 gap-3 px-4 py-2 text-[10.5px] font-semibold uppercase tracking-wider">
                <div className="col-span-2" style={{ color: t.textDim }}>{tr('guide_col_mode')}</div>
                <div className="col-span-4" style={{ color: t.textDim }}>{tr('guide_col_how')}</div>
                <div className="col-span-6" style={{ color: t.textDim }}>{tr('guide_col_best')}</div>
              </div>
              {[['hybrid', 'guide_mode_hybrid_h', 'guide_mode_hybrid_b'], ['vector', 'guide_mode_vector_h', 'guide_mode_vector_b'], ['fts', 'guide_mode_fts_h', 'guide_mode_fts_b'], ['graph', 'guide_mode_graph_h', 'guide_mode_graph_b']].map(([m, hk, bk]) => (
                <div key={m} style={{ borderTop: `1px solid ${t.borderSoft}` }} className="grid grid-cols-12 gap-3 px-4 py-3 items-center">
                  <div className="col-span-2"><Tag color="blue">{m}</Tag></div>
                  <div className="col-span-4" style={{ color: t.textMuted }}><span className="text-[12px] font-mono">{tr(hk)}</span></div>
                  <div className="col-span-6" style={{ color: t.textDim }}><span className="text-[12px]">{tr(bk)}</span></div>
                </div>
              ))}
            </Card>
          </div>

          <div>
            <div style={{ color: t.text }} className="text-[15px] font-semibold mb-3">{tr('guide_arch')}</div>
            <Card className="overflow-hidden">
              <pre style={{ background: t.codeBg, color: t.codeText }} className="px-4 py-3 text-[11.5px] font-mono leading-[1.7] overflow-x-auto">{`Document → Parser → Chunker → Embedder → PostgreSQL
  (6 types)  (pypdf,    (recursive)  (Ollama /    ├─ pgvector
              docx,                   OpenAI)     ├─ tsvector
              xlsx…)                              └─ Graph CTE
                                                     ↓
   Query → Embed → [Vector + FTS + Graph] → RRF → Results`}</pre>
            </Card>
          </div>

          <div style={{ color: t.textFaint }} className="text-[11px] text-center pt-4 pb-2">{tr('guide_footer')}</div>
        </div>
      </div>
    </div>
  );
}
