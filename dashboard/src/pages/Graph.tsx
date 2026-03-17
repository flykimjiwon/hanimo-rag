import { useState, useEffect, useRef, useCallback } from 'react'
import { X, GitFork } from 'lucide-react'
import { api } from '../api'
import { useI18n } from '../i18n'

interface Node { id: string; title: string; node_type: string; content?: string }
interface Edge { source_id: string; target_id: string; relation_type: string }

const C: Record<string, string> = { person: '#3b82f6', org: '#22c55e', concept: '#a855f7', location: '#f97316', event: '#ef4444', document: '#6b7280' }

export default function Graph() {
  const { t } = useI18n()
  const [nodes, setNodes] = useState<Node[]>([]); const [edges, setEdges] = useState<Edge[]>([])
  const [sel, setSel] = useState<Node | null>(null); const ref = useRef<HTMLDivElement>(null); const [FG, setFG] = useState<any>(null)
  useEffect(() => { import('react-force-graph-2d').then(m => setFG(() => m.default)) }, [])
  useEffect(() => { api.getGraph().then(d => { setNodes(d.nodes || []); setEdges(d.edges || []) }).catch(() => {}) }, [])
  const data = { nodes: nodes.map(n => ({ id: n.id, name: n.title, type: n.node_type, content: n.content })), links: edges.map(e => ({ source: e.source_id, target: e.target_id, label: e.relation_type })) }
  const click = useCallback((n: any) => setSel({ id: n.id, title: n.name, node_type: n.type, content: n.content }), [])

  return (
    <div className="max-w-5xl mx-auto">
      <h2 data-heading className="text-2xl font-bold text-slate-900 dark:text-[#FAFAFA] mb-6">{t('graph.title')}</h2>
      <div className="flex gap-4">
        <div ref={ref} className="flex-1 bg-white dark:bg-[#18181B] rounded-3xl border border-slate-200/60 dark:border-[#27272A] overflow-hidden shadow-sm" style={{ height: 520 }}>
          {FG && nodes.length > 0 ? (
            <FG graphData={data} nodeLabel="name" nodeColor={(n: any) => C[n.type] || '#6b7280'} nodeRelSize={7}
              linkLabel="label" linkDirectionalParticles={1} onNodeClick={click} backgroundColor="transparent"
              width={ref.current?.clientWidth || 600} height={520} />
          ) : (
            <div className="flex flex-col items-center justify-center h-full">
              <GitFork size={48} className="mb-4 text-slate-300 dark:text-[#3F3F46]" />
              <p className="text-sm text-slate-400 dark:text-[#A1A1AA]">{nodes.length === 0 ? t('graph.empty') : t('graph.loading')}</p>
            </div>
          )}
        </div>
        {sel && (
          <div className="w-72 bg-white dark:bg-[#18181B] rounded-3xl border border-slate-200/60 dark:border-[#27272A] p-6 shadow-sm">
            <h3 data-heading className="font-bold text-slate-900 dark:text-[#FAFAFA] text-lg mb-2">{sel.title}</h3>
            <span className="inline-block px-3 py-1 rounded-full text-[11px] font-bold"
              style={{ backgroundColor: (C[sel.node_type] || '#6b7280') + '15', color: C[sel.node_type] || '#6b7280' }}>
              {sel.node_type}
            </span>
            {sel.content && <p className="text-sm text-slate-600 dark:text-[#A1A1AA] mt-4 leading-relaxed">{sel.content}</p>}
            <button onClick={() => setSel(null)} className="mt-4 flex items-center gap-1 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-[#FAFAFA] font-medium">
              <X size={12} /> {t('graph.close')}
            </button>
          </div>
        )}
      </div>
      <div className="flex gap-4 mt-4">
        {Object.entries(C).map(([ty, co]) => (
          <span key={ty} className="flex items-center gap-2 text-xs text-slate-500 dark:text-[#A1A1AA]">
            <span className="w-3 h-3 rounded-full" style={{ backgroundColor: co }} /> {ty}
          </span>
        ))}
      </div>
    </div>
  )
}
