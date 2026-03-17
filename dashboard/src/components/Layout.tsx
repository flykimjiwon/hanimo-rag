import { NavLink, Outlet } from 'react-router-dom'
import { FileText, FolderOpen, Search, Blocks, GitFork, Settings, ExternalLink, Moon, Sun, Languages } from 'lucide-react'
import { useI18n } from '../i18n'
import { useTheme } from '../theme'

type TKey = Parameters<ReturnType<typeof useI18n>['t']>[0]
const nav: { to: string; k: TKey; Icon: React.FC<{ size?: number; className?: string }> }[] = [
  { to: '/documents', k: 'nav.documents', Icon: FileText },
  { to: '/collections', k: 'nav.collections', Icon: FolderOpen },
  { to: '/search', k: 'nav.search', Icon: Search },
  { to: '/apps', k: 'nav.apps', Icon: Blocks },
  { to: '/graph', k: 'nav.graph', Icon: GitFork },
  { to: '/settings', k: 'nav.settings', Icon: Settings },
]

export default function Layout() {
  const { locale, setLocale, t } = useI18n()
  const { theme, toggle } = useTheme()
  return (
    <div className="flex h-screen bg-[#F8FAFC] dark:bg-[#09090B] transition-colors">
      <aside className="w-64 m-3 mr-0 bg-white dark:bg-[#18181B] rounded-3xl flex flex-col shadow-sm border border-slate-200/60 dark:border-[#27272A]">
        <div className="px-6 pt-6 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white text-sm font-bold">M</div>
            <div>
              <h1 data-heading className="text-[15px] font-bold text-slate-900 dark:text-[#FAFAFA] tracking-tight">ModolRAG</h1>
              <p className="text-[10px] text-slate-400 dark:text-[#A1A1AA] tracking-wide">RAG Engine Builder</p>
            </div>
          </div>
        </div>
        <nav className="flex-1 px-3 space-y-1">
          {nav.map(n => (
            <NavLink key={n.to} to={n.to} className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-2xl text-[13px] font-medium transition-all ${isActive
                ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 shadow-sm'
                : 'text-slate-500 dark:text-[#A1A1AA] hover:bg-slate-50 dark:hover:bg-[#27272A] hover:text-slate-900 dark:hover:text-white'}`}>
              <n.Icon size={18} />
              <span>{t(n.k)}</span>
            </NavLink>
          ))}
        </nav>
        <div className="px-3 pb-2">
          <div className="border-t border-slate-100 dark:border-[#27272A] pt-3 space-y-1">
            <a href="/docs" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-4 py-2 rounded-2xl text-[12px] text-slate-400 dark:text-[#A1A1AA] hover:bg-slate-50 dark:hover:bg-[#27272A] transition-all">
              <ExternalLink size={12} /> Swagger UI
            </a>
            <a href="/redoc" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-4 py-2 rounded-2xl text-[12px] text-slate-400 dark:text-[#A1A1AA] hover:bg-slate-50 dark:hover:bg-[#27272A] transition-all">
              <ExternalLink size={12} /> ReDoc
            </a>
          </div>
        </div>
        <div className="px-4 pb-5">
          <div className="flex gap-2">
            <button onClick={() => setLocale(locale === 'ko' ? 'en' : 'ko')} className="flex-1 flex items-center justify-center gap-1.5 text-[11px] py-2 rounded-xl bg-slate-100 dark:bg-[#27272A] text-slate-500 dark:text-[#A1A1AA] hover:bg-slate-200 dark:hover:bg-[#3F3F46] transition-all font-semibold">
              <Languages size={12} />{locale === 'ko' ? 'EN' : 'KO'}
            </button>
            <button onClick={toggle} className="flex-1 flex items-center justify-center gap-1.5 text-[11px] py-2 rounded-xl bg-slate-100 dark:bg-[#27272A] text-slate-500 dark:text-[#A1A1AA] hover:bg-slate-200 dark:hover:bg-[#3F3F46] transition-all">
              {theme === 'light' ? <Moon size={12} /> : <Sun size={12} />}
              {theme === 'light' ? 'Dark' : 'Light'}
            </button>
          </div>
        </div>
      </aside>
      <main className="flex-1 overflow-y-auto p-6"><Outlet /></main>
    </div>
  )
}
