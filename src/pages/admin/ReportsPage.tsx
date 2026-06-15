import { useState, useEffect, useCallback } from 'react'
import { ChevronDown, X } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { formatDateBR, cn } from '@/lib/utils'
import Stage, { SectionHead } from '@/components/layout/Stage'
import Topbar from '@/components/layout/Topbar'
import type { ChkSubmission, ChkSubmissionItem, Store } from '@/lib/types'

interface SubmissionRow extends ChkSubmission {
  store_name?: string
  items?: ChkSubmissionItem[]
}

export default function ReportsPage() {
  const [submissions, setSubmissions] = useState<SubmissionRow[]>([])
  const [stores, setStores] = useState<Store[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [expandedItems, setExpandedItems] = useState<ChkSubmissionItem[]>([])
  const [loadingItems, setLoadingItems] = useState(false)

  // Filters
  const [filterStore, setFilterStore] = useState('')
  const [filterList, setFilterList] = useState('')
  const [filterEmployee, setFilterEmployee] = useState('')
  const [filterFrom, setFilterFrom] = useState('')
  const [filterTo, setFilterTo] = useState('')

  // Summary stats
  const totalCount = submissions.length
  const incompleteCount = submissions.filter(s => s.done_count < s.total_count).length
  const completionRate = totalCount > 0
    ? Math.round(submissions.reduce((acc, s) => acc + (s.total_count > 0 ? s.done_count / s.total_count : 1), 0) / totalCount * 100)
    : 0

  useEffect(() => {
    supabase.from('stores').select('id, name').order('name').then(({ data }) => {
      setStores(data ?? [])
    })
  }, [])

  const fetchSubmissions = useCallback(async () => {
    setLoading(true)
    let query = supabase
      .from('chk_submissions')
      .select('*')
      .order('submitted_at', { ascending: false })
      .limit(200)

    if (filterStore) query = query.eq('store_id', filterStore)
    if (filterList) query = query.ilike('list_name', `%${filterList}%`)
    if (filterEmployee) query = query.ilike('employee_name', `%${filterEmployee}%`)
    if (filterFrom) query = query.gte('submitted_at', filterFrom)
    if (filterTo) query = query.lte('submitted_at', filterTo + 'T23:59:59')

    const { data } = await query
    const rows = data ?? []

    // Attach store names
    const storeMap = Object.fromEntries(stores.map(s => [s.id, s.name]))
    setSubmissions(rows.map(r => ({ ...r, store_name: storeMap[r.store_id] ?? r.store_id })))
    setLoading(false)
  }, [filterStore, filterList, filterEmployee, filterFrom, filterTo, stores])

  useEffect(() => {
    if (stores.length > 0) fetchSubmissions()
  }, [fetchSubmissions, stores])

  async function expandSubmission(id: string) {
    if (expandedId === id) { setExpandedId(null); return }
    setExpandedId(id)
    setLoadingItems(true)
    const { data } = await supabase
      .from('chk_submission_items')
      .select('*')
      .eq('submission_id', id)
      .order('id')
    setExpandedItems(data ?? [])
    setLoadingItems(false)
  }

  function clearFilters() {
    setFilterStore('')
    setFilterList('')
    setFilterEmployee('')
    setFilterFrom('')
    setFilterTo('')
  }

  const hasFilters = filterStore || filterList || filterEmployee || filterFrom || filterTo

  return (
    <div className="flex flex-col h-full">
      <Topbar breadcrumbs={[{ label: 'Relatórios' }]} />

      <div className="max-w-[960px] mx-auto px-5 pt-8 pb-16 w-full">
        {/* Summary */}
        <div className="grid grid-cols-3 gap-3 mb-8">
          {[
            { label: 'Submissões', value: totalCount },
            { label: 'Incompletas', value: incompleteCount },
            { label: '% Conclusão', value: `${completionRate}%` },
          ].map(stat => (
            <div key={stat.label} className="p-3.5 bg-bg-card border border-rule-soft rounded-lg">
              <p className="text-[0.74rem] font-semibold uppercase tracking-widest text-ink-soft mb-1">
                {stat.label}
              </p>
              <p className="text-xl font-serif text-ink">{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="mb-6 p-3.5 bg-bg-card border border-rule-soft rounded-lg">
          <div className="flex items-center justify-between mb-3">
            <SectionHead title="Filtros" />
            {hasFilters && (
              <button onClick={clearFilters} className="text-xs text-ink-muted hover:text-ink transition-colors flex items-center gap-1">
                <X className="w-3 h-3" /> Limpar
              </button>
            )}
          </div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-3">
            <div>
              <label className="text-[0.7rem] uppercase tracking-wider text-ink-muted block mb-1">Loja</label>
              <select
                value={filterStore}
                onChange={e => setFilterStore(e.target.value)}
                className="w-full bg-transparent border-0 border-b border-rule-soft focus:border-ink py-1 text-ink text-sm outline-none transition-colors"
              >
                <option value="">Todas</option>
                {stores.map(s => <option key={s.id} value={s.id}>Loja {s.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[0.7rem] uppercase tracking-wider text-ink-muted block mb-1">Lista</label>
              <input
                type="text"
                value={filterList}
                onChange={e => setFilterList(e.target.value)}
                placeholder="Abertura…"
                className="w-full bg-transparent border-0 border-b border-rule-soft focus:border-ink py-1 text-ink text-sm placeholder:text-ink-muted outline-none transition-colors"
              />
            </div>
            <div>
              <label className="text-[0.7rem] uppercase tracking-wider text-ink-muted block mb-1">Colaborador</label>
              <input
                type="text"
                value={filterEmployee}
                onChange={e => setFilterEmployee(e.target.value)}
                placeholder="Maria…"
                className="w-full bg-transparent border-0 border-b border-rule-soft focus:border-ink py-1 text-ink text-sm placeholder:text-ink-muted outline-none transition-colors"
              />
            </div>
            <div>
              <label className="text-[0.7rem] uppercase tracking-wider text-ink-muted block mb-1">De</label>
              <input
                type="date"
                value={filterFrom}
                onChange={e => setFilterFrom(e.target.value)}
                className="w-full bg-transparent border-0 border-b border-rule-soft focus:border-ink py-1 text-ink text-sm outline-none transition-colors"
              />
            </div>
            <div>
              <label className="text-[0.7rem] uppercase tracking-wider text-ink-muted block mb-1">Até</label>
              <input
                type="date"
                value={filterTo}
                onChange={e => setFilterTo(e.target.value)}
                className="w-full bg-transparent border-0 border-b border-rule-soft focus:border-ink py-1 text-ink text-sm outline-none transition-colors"
              />
            </div>
          </div>
        </div>

        {/* Table */}
        <div>
          <SectionHead title="Submissões" count={submissions.length} />
          {loading ? (
            <div className="space-y-2 mt-3">
              {[1, 2, 3, 4, 5].map(i => <div key={i} className="h-10 rounded-md bg-bg-soft animate-pulse" />)}
            </div>
          ) : submissions.length === 0 ? (
            <p className="text-sm text-ink-muted py-4">Nenhuma submissão encontrada.</p>
          ) : (
            <div className="mt-1">
              {submissions.map(sub => {
                const isComplete = sub.done_count >= sub.total_count
                const isExpanded = expandedId === sub.id
                return (
                  <div key={sub.id} className="border-b border-rule-soft last:border-0">
                    <button
                      onClick={() => expandSubmission(sub.id)}
                      className="w-full flex items-center gap-3 py-2.5 text-left hover:bg-bg-hover transition-colors rounded-md px-1 -mx-1"
                    >
                      {/* Completion indicator */}
                      <span className={cn(
                        'w-1.5 h-1.5 rounded-full flex-shrink-0 mt-0.5',
                        isComplete ? 'bg-ink-muted' : 'bg-brand-rosa'
                      )} />

                      <div className="flex-1 min-w-0">
                        <div className="flex items-baseline gap-2 flex-wrap">
                          <span className="text-sm font-medium text-ink">{sub.list_name}</span>
                          <span className="text-xs text-ink-muted">
                            Loja {sub.store_name} · {sub.employee_name}
                          </span>
                        </div>
                        <div className="text-xs text-ink-muted">
                          {formatDateBR(sub.submitted_at)}
                        </div>
                      </div>

                      <span className={cn(
                        'text-xs font-medium flex-shrink-0',
                        isComplete ? 'text-ink-muted' : 'text-brand-rosa'
                      )}>
                        {sub.done_count}/{sub.total_count}
                      </span>

                      <ChevronDown className={cn(
                        'w-4 h-4 text-ink-muted flex-shrink-0 transition-transform',
                        isExpanded && 'rotate-180'
                      )} />
                    </button>

                    {/* Expanded detail — só pendentes + observação */}
                    {isExpanded && (
                      <div className="pl-4 pb-4">
                        {loadingItems ? (
                          <div className="h-8 bg-bg-soft rounded animate-pulse" />
                        ) : (
                          <>
                            {sub.comment && (
                              <p className="text-xs text-ink-muted mb-2 italic">"{sub.comment}"</p>
                            )}
                            {expandedItems.filter(i => !i.done).length === 0 ? (
                              <p className="text-xs text-ink-muted">Tudo concluído.</p>
                            ) : (
                              <ul className="space-y-0.5">
                                {expandedItems.filter(i => !i.done).map(item => (
                                  <li key={item.id} className="flex items-baseline gap-1.5 text-xs text-brand-rosa">
                                    <span>·</span>
                                    <span>{item.text}</span>
                                  </li>
                                ))}
                              </ul>
                            )}
                          </>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
