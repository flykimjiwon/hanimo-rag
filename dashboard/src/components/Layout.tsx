import { NavLink, Outlet } from 'react-router-dom'
import { useI18n } from '../i18n'
import { useTheme } from '../theme'

type TKey = Parameters<ReturnType<typeof useI18n>['t']>[0]
const nav: { to: string; k: TKey; icon: string }[] = [
  { to: '/documents', k: 'nav.documents', icon: '\u{1F4C4}' },
  { to: '/collections', k: 'nav.collections', icon: '\u{1F4DA}' },
  { to: '/search', k: 'nav.search', icon: '\u{1F50D}' },
  { to: '/graph', k: 'nav.graph', icon: '\u{1F578}\uFE0F' },
  { to: '/settings', k: 'nav.settings', icon: '\u2699\uFE0F' },
]

export default function Layout() {
  const { locale, setLocale, t } = useI18n()
  const { theme, toggle } = useTheme()
  return (
    <div className="flex h-screen bg-slate-100 dark:bg-zinc-950 transition-colors">
      <aside className="w-64 m-3 mr-0 bg-white dark:bg-zinc-900 rounded-3xl flex flex-col shadow-sm border border-slate-200/60 dark:border-zinc-800">
        <div className="px-6 pt-6 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white text-sm font-bold">M</div>
            <div><h1 className="text-[15px] font-bold text-slate-900 dark:text-white tracking-tight">ModolRAG</h1>
            <p className="text-[10px] text-slate-400 dark:text-zinc-500 tracking-wide">RAG Engine Builder</p></div>
          </div>
        </div>
        <nav className="flex-1 px-3 space-y-1">
          {nav.map(n => (<NavLink key={n.to} to={n.to} className={({ isActive }) =>
            `flex items-center gap-3 px-4 py-3 rounded-2xl text-[13px] font-medium transition-all ${isActive ? 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 shadow-sm' : 'text-slate-500 dark:text-zinc-400 hover:bg-slate-50 dark:hover:bg-zinc-800 hover:text-slate-900 dark:hover:text-white'}`}>
            <span className="text-lg">{n.icon}</span><span>{t(n.k)}</span>
          </NavLink>))}
        </nav>
        <div className="px-3 pb-2"><div className="border-t border-slate-100 dark:border-zinc-800 pt-3 space-y-1">
          <a href="/docs" target="_blank" rel="noopener noreferrer" className="block px-4 py-2 rounded-2xl text-[12px] text-slate-400 dark:text-zinc-500 hover:bg-slate-50 dark:hover:bg-zinc-800 transition-all">Swagger UI</a>
          <a href="/redoc" target="_blank" rel="noopener noreferrer" className="block px-4 py-2 rounded-2xl text-[12px] text-slate-400 dark:text-zinc-500 hover:bg-slate-50 dark:hover:bg-zinc-800 transition-all">ReDoc</a>
        </div></div>
        <div className="px-4 pb-5"><div className="flex gap-2">
          <button onClick={() => setLocale(locale === 'ko' ? 'en' : 'ko')} className="flex-1 text-[11px] py-2 rounded-xl bg-slate-100 dark:bg-zinc-800 text-slate-500 dark:text-zinc-400 hover:bg-slate-200 dark:hover:bg-zinc-700 transition-all font-semibold">{locale === 'ko' ? 'EN' : 'KO'}</button>
          <button onClick={toggle} className="flex-1 text-[11px] py-2 rounded-xl bg-slate-100 dark:bg-zinc-800 text-slate-500 dark:text-zinc-400 hover:bg-slate-200 dark:hover:bg-zinc-700 transition-all">{theme === 'light' ? '\u{1F319}' : '\u2600\uFE0F'}</button>
        </div></div>
      </aside>
      <main className="flex-1 overflow-y-auto p-6"><Outlet /></main>
    </div>
  )
}
