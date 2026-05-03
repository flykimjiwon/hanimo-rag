// @ts-nocheck
import React from 'react';
import { useTheme, I, Btn, Card, Input, Select, BRAND } from '../lib';
import { useI18n } from '../i18n';
import { Topbar } from '../chrome';

function SettingsBlock({ title, desc, children }: any) {
  const t = useTheme();
  return (
    <Card className="p-5">
      <div style={{ color: t.text }} className="text-[13px] font-semibold">{title}</div>
      <div style={{ color: t.textDim }} className="text-[11.5px] mb-4">{desc}</div>
      {children}
    </Card>
  );
}

function Field({ label, children }: any) {
  const t = useTheme();
  return (
    <label className="block">
      <div style={{ color: t.textMuted }} className="text-[11.5px] font-medium mb-1">{label}</div>
      {children}
    </label>
  );
}

function GeneralSection() {
  const { t: tr } = useI18n();
  return (
    <SettingsBlock title={tr('s_general')} desc={tr('s_general_d')}>
      <div className="grid grid-cols-2 gap-3">
        <Field label={tr('s_workspace')}><Input defaultValue="My workspace"/></Field>
        <Field label={tr('s_default_model')}>
          <Select defaultValue="gpt-4o-mini">
            <option>gpt-4o-mini</option><option>gpt-4o</option><option>llama3.1</option>
          </Select>
        </Field>
      </div>
    </SettingsBlock>
  );
}

function BrandSection() {
  const t = useTheme();
  const { t: tr } = useI18n();
  const swatches = [
    { name: 'Honey 50',  v: BRAND.honey50 }, { name: 'Honey 100', v: BRAND.honey100 },
    { name: 'Honey 200', v: BRAND.honey200 }, { name: 'Honey 300', v: BRAND.honey300 },
    { name: 'Honey 400', v: BRAND.honey400, primary: true }, { name: 'Honey 500', v: BRAND.honey500 },
    { name: 'Honey 600', v: BRAND.honey600 }, { name: 'Honey 700', v: BRAND.honey700 },
    { name: 'Modol 50',  v: BRAND.modol50 }, { name: 'Modol 100', v: BRAND.modol100 },
    { name: 'Modol 200', v: BRAND.modol200 }, { name: 'Charcoal',  v: BRAND.charcoal },
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
          {swatches.map((s: any) => (
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
  const keys = [
    { name: 'Default key', key: 'hnm_sk_live_8af3c2e91b', created: 'Jan 12, 2026' },
    { name: 'Slack bot', key: 'hnm_sk_live_4d2e1a87cf', created: 'Mar 03, 2026' },
    { name: 'Production', key: 'hnm_sk_live_a91d34b2f1', created: 'Apr 18, 2026' },
  ];
  return (
    <SettingsBlock title={tr('s_keys')} desc={tr('s_keys_d')}>
      <div style={{ border: `1px solid ${t.border}` }} className="rounded-md">
        {keys.map((k, i) => (
          <div key={k.key} style={{ borderTop: i === 0 ? 'none' : `1px solid ${t.borderSoft}` }} className="px-4 py-3 flex items-center gap-3">
            <div className="flex-1 min-w-0">
              <div style={{ color: t.text }} className="text-[12.5px] font-medium">{k.name}</div>
              <code style={{ color: t.textFaint }} className="text-[11px] font-mono">{k.key.slice(0, 14)}…</code>
            </div>
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
  const roleLabel: Record<string, string> = { owner: tr('s_role_owner'), admin: tr('s_role_admin'), member: tr('s_role_member') };
  const roleColor: Record<string, string> = { owner: 'purple', admin: 'blue', member: 'neutral' };
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
            <span style={{ background: roleColor[m.role] === 'purple' ? t.purpleBg : (roleColor[m.role] === 'blue' ? t.blueBg : t.chipBg), color: roleColor[m.role] === 'purple' ? t.purple : (roleColor[m.role] === 'blue' ? t.blue : t.chipText) }} className="inline-flex items-center gap-1 px-2 h-5 rounded text-[11px] font-medium">{roleLabel[m.role]}</span>
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

export default function SettingsPage() {
  const t = useTheme();
  const { t: tr } = useI18n();
  const [section, setSection] = React.useState('general');
  const sections = [
    ['general', tr('s_general')], ['brand', tr('s_brand')], ['embedding', tr('s_embedding')],
    ['keys', tr('s_keys')], ['team', tr('s_team')], ['usage', tr('s_usage')], ['danger', tr('s_danger')],
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
            {section === 'general'   && <GeneralSection/>}
            {section === 'brand'     && <BrandSection/>}
            {section === 'embedding' && <EmbeddingSection/>}
            {section === 'keys'      && <KeysSection/>}
            {section === 'team'      && <TeamSection/>}
            {section === 'usage'     && <UsageSection/>}
            {section === 'danger'    && <DangerSection/>}
          </div>
        </div>
      </div>
    </div>
  );
}
