import { useState, useEffect, useCallback } from 'react'
import { ChevronDown, X, Trash2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { formatDateBR, cn } from '@/lib/utils'
import Stage, { SectionHead } from '@/components/layout/Stage'
import Topbar from '@/components/layout/Topbar'
import type { ChkSubmission, ChkSubmissionItem, FrmSubmission, FrmSubmissionItem, Store } from '@/lib/types'

type ViewType = 'checklist' | 'form'

interface SubmissionRow extends ChkSubmission {
  store_name?: string
  items?: ChkSubmissionItem[]
}

interface FormSubmissionRow extends FrmSubmission {
  store_name?: string
  items?: FrmSubmissionItem[]
  toBuyCount: number
}

export default function ReportsPage() {
  const [viewType, setViewType] = useState<ViewType>('checklist')
  const [stores, setStores] = useState<Store[]>([])

  useEffect(() => {
    supabase.from('stores').select('id, name').order('name').then(({ data }) => {
      setStores(data ?? [])
    })
  }, [])

  return (
    <div className="flex flex-col h-full">
      <Topbar breadcrumbs={[{ label: 'Relatórios' }]} />

      <div className="max-w-[960px] mx-auto px-5 pt-8 pb-16 w-full">
        {/* View toggle */}
        <div className="flex gap-1 mb-8 p-1 rounded-pill border border-rule-soft bg-bg-card w-fit">
          {(['checklist', 'form'] as ViewType[]).map(v => (
            <button
              key={v}
              onClick={() => setViewType(v)}
              className={cn(
                'px-4 py-1.5 rounded-md text-sm font-medium transition-colors',
                viewType === v ? 'bg-ink text-bg' : 'text-ink-muted hover:text-ink'
              )}
            >
              {v === 'checklist' ? 'Checklists' : 'Formulários'}
            </button>
          ))}
        </div>

        {viewType === 'checklist' ? (
          <ChecklistReports stores={stores} />
        ) : (
          <FormReports stores={stores} />
        )}
      </div>
    </div>
  )
}

// ── Checklists ──────────────────────────────────────────────────────────────

function ChecklistReports({ stores }: { stores: Store[] }) {
  const [submissions, setSubmissions] = useState<SubmissionRow[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [expandedItems, setExpandedItems] = useState<ChkSubmissionItem[]>([])
  const [loadingItems, setLoadingItems] = useState(false)

  const [filterStore, setFilterStore] = useState('')
  const [filterList, setFilterList] = useState('')
  const [filterEmployee, setFilterEmployee] = useState('')
  const [filterFrom, setFilterFrom] = useState('')
  const [filterTo, setFilterTo] = useState('')

  const totalCount = submissions.length
  const incompleteCount = submissions.filter(s => s.done_count < s.total_count).length
  const completionRate = totalCount > 0
    ? Math.round(submissions.reduce((acc, s) => acc + (s.total_count > 0 ? s.done_count / s.total_count : 1), 0) / totalCount * 100)
    : 0

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

  async function deleteSubmission(id: string) {
    if (!confirm('Apagar essa submissão permanentemente?')) return
    const { error } = await supabase.from('chk_submissions').delete().eq('id', id)
    if (!error) {
      setSubmissions(prev => prev.filter(s => s.id !== id))
      if (expandedId === id) setExpandedId(null)
    }
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
    <>
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
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => expandSubmission(sub.id)}
                      className="flex-1 flex items-center gap-3 py-2.5 text-left hover:bg-bg-hover transition-colors rounded-md px-1 -mx-1 min-w-0"
                    >
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

                    <button
                      onClick={() => deleteSubmission(sub.id)}
                      className="p-1.5 rounded-md text-ink-muted hover:text-ink hover:bg-bg-soft transition-colors flex-shrink-0"
                      title="Apagar submissão"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

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
    </>
  )
}

// ── Formulários ─────────────────────────────────────────────────────────────

function FormReports({ stores }: { stores: Store[] }) {
  const [submissions, setSubmissions] = useState<FormSubmissionRow[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [expandedItems, setExpandedItems] = useState<FrmSubmissionItem[]>([])
  const [loadingItems, setLoadingItems] = useState(false)

  const [filterStore, setFilterStore] = useState('')
  const [filterForm, setFilterForm] = useState('')
  const [filterEmployee, setFilterEmployee] = useState('')
  const [filterFrom, setFilterFrom] = useState('')
  const [filterTo, setFilterTo] = useState('')

  const totalCount = submissions.length
  const withToBuyCount = submissions.filter(s => s.toBuyCount > 0).length
  const completionRate = totalCount > 0
    ? Math.round(submissions.reduce((acc, s) => acc + (s.item_count > 0 ? s.filled_count / s.item_count : 1), 0) / totalCount * 100)
    : 0

  const fetchSubmissions = useCallback(async () => {
    setLoading(true)
    let query = supabase
      .from('frm_submissions')
      .select('*')
      .order('submitted_at', { ascending: false })
      .limit(200)

    if (filterStore) query = query.eq('store_id', filterStore)
    if (filterForm) query = query.ilike('form_name', `%${filterForm}%`)
    if (filterEmployee) query = query.ilike('employee_name', `%${filterEmployee}%`)
    if (filterFrom) query = query.gte('submitted_at', filterFrom)
    if (filterTo) query = query.lte('submitted_at', filterTo + 'T23:59:59')

    const { data } = await query
    const rows = data ?? []

    const storeMap = Object.fromEntries(stores.map(s => [s.id, s.name]))
    const ids = rows.map(r => r.id)
    const toBuyCounts: Record<string, number> = {}
    if (ids.length > 0) {
      const { data: toBuyRows } = await supabase
        .from('frm_submission_items')
        .select('submission_id')
        .in('submission_id', ids)
        .eq('comprar', true)
      for (const row of toBuyRows ?? []) {
        toBuyCounts[row.submission_id] = (toBuyCounts[row.submission_id] ?? 0) + 1
      }
    }

    setSubmissions(rows.map(r => ({
      ...r,
      store_name: storeMap[r.store_id] ?? r.store_id,
      toBuyCount: toBuyCounts[r.id] ?? 0,
    })))
    setLoading(false)
  }, [filterStore, filterForm, filterEmployee, filterFrom, filterTo, stores])

  useEffect(() => {
    if (stores.length > 0) fetchSubmissions()
  }, [fetchSubmissions, stores])

  async function expandSubmission(id: string) {
    if (expandedId === id) { setExpandedId(null); return }
    setExpandedId(id)
    setLoadingItems(true)
    const { data } = await supabase
      .from('frm_submission_items')
      .select('*')
      .eq('submission_id', id)
      .order('id')
    setExpandedItems(data ?? [])
    setLoadingItems(false)
  }

  async function deleteSubmission(id: string) {
    if (!confirm('Apagar essa submissão permanentemente?')) return
    const { error } = await supabase.from('frm_submissions').delete().eq('id', id)
    if (!error) {
      setSubmissions(prev => prev.filter(s => s.id !== id))
      if (expandedId === id) setExpandedId(null)
    }
  }

  function clearFilters() {
    setFilterStore('')
    setFilterForm('')
    setFilterEmployee('')
    setFilterFrom('')
    setFilterTo('')
  }

  const hasFilters = filterStore || filterForm || filterEmployee || filterFrom || filterTo

  return (
    <>
      {/* Summary */}
      <div className="grid grid-cols-3 gap-3 mb-8">
        {[
          { label: 'Submissões', value: totalCount },
          { label: 'Com itens p/ comprar', value: withToBuyCount },
          { label: '% Preenchimento', value: `${completionRate}%` },
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
            <label className="text-[0.7rem] uppercase tracking-wider text-ink-muted block mb-1">Formulário</label>
            <input
              type="text"
              value={filterForm}
              onChange={e => setFilterForm(e.target.value)}
              placeholder="Estoque…"
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
              const hasToBuy = sub.toBuyCount > 0
              const isExpanded = expandedId === sub.id
              return (
                <div key={sub.id} className="border-b border-rule-soft last:border-0">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => expandSubmission(sub.id)}
                      className="flex-1 flex items-center gap-3 py-2.5 text-left hover:bg-bg-hover transition-colors rounded-md px-1 -mx-1 min-w-0"
                    >
                      <span className={cn(
                        'w-1.5 h-1.5 rounded-full flex-shrink-0 mt-0.5',
                        hasToBuy ? 'bg-brand-rosa' : 'bg-ink-muted'
                      )} />

                      <div className="flex-1 min-w-0">
                        <div className="flex items-baseline gap-2 flex-wrap">
                          <span className="text-sm font-medium text-ink">{sub.form_name}</span>
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
                        hasToBuy ? 'text-brand-rosa' : 'text-ink-muted'
                      )}>
                        {hasToBuy ? `${sub.toBuyCount} p/ comprar` : `${sub.filled_count}/${sub.item_count}`}
                      </span>

                      <ChevronDown className={cn(
                        'w-4 h-4 text-ink-muted flex-shrink-0 transition-transform',
                        isExpanded && 'rotate-180'
                      )} />
                    </button>

                    <button
                      onClick={() => deleteSubmission(sub.id)}
                      className="p-1.5 rounded-md text-ink-muted hover:text-ink hover:bg-bg-soft transition-colors flex-shrink-0"
                      title="Apagar submissão"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {isExpanded && (
                    <div className="pl-4 pb-4">
                      {loadingItems ? (
                        <div className="h-8 bg-bg-soft rounded animate-pulse" />
                      ) : (
                        <>
                          {sub.comment && (
                            <p className="text-xs text-ink-muted mb-2 italic">"{sub.comment}"</p>
                          )}
                          {expandedItems.filter(i => i.comprar).length === 0 ? (
                            <p className="text-xs text-ink-muted">Nada para comprar.</p>
                          ) : (
                            <ul className="space-y-0.5">
                              {expandedItems.filter(i => i.comprar).map(item => (
                                <li key={item.id} className="flex items-baseline gap-1.5 text-xs text-brand-rosa">
                                  <span>·</span>
                                  <span>{item.item_name}</span>
                                  {item.quantity !== null && (
                                    <span className="text-ink-muted">— {item.quantity}</span>
                                  )}
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
    </>
  )
}
