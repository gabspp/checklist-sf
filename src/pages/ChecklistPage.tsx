import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { getCurrentDayInfo } from '@/lib/utils'
import type { Store, ChkEmployee, ChkList, TaskWithCheck } from '@/lib/types'
import StoreStep from '@/components/fill/StoreStep'
import EmployeeStep from '@/components/fill/EmployeeStep'
import ListStep from '@/components/fill/ListStep'
import FillStep from '@/components/fill/FillStep'
import DoneStep from '@/components/fill/DoneStep'
import Topbar from '@/components/layout/Topbar'
import Stage from '@/components/layout/Stage'

type Step = 'store' | 'employee' | 'list' | 'resume' | 'fill' | 'done'

export default function ChecklistPage() {
  const [step, setStep] = useState<Step>('store')

  // Selections
  const [store, setStore] = useState<Store | null>(null)
  const [employee, setEmployee] = useState<ChkEmployee | null>(null)
  const [list, setList] = useState<ChkList | null>(null)

  // Data
  const [stores, setStores] = useState<Store[]>([])
  const [employees, setEmployees] = useState<ChkEmployee[]>([])
  const [lists, setLists] = useState<ChkList[]>([])
  const [tasks, setTasks] = useState<TaskWithCheck[]>([])
  const [whatsappNumber, setWhatsappNumber] = useState('5511999999999')

  // Draft / resume
  const draftIdRef = useRef<string | null>(null)
  const pendingResumeRef = useRef<string[] | null>(null)
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [resumeInfo, setResumeInfo] = useState<{
    employeeName: string
    startedAt: string
    checkedIds: string[]
  } | null>(null)

  // UI state
  const [loadingStores, setLoadingStores] = useState(true)
  const [loadingEmployees, setLoadingEmployees] = useState(false)
  const [loadingLists, setLoadingLists] = useState(false)
  const [loadingTasks, setLoadingTasks] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [comment, setComment] = useState('')
  const [submittedAt, setSubmittedAt] = useState<Date>(new Date())

  // Load stores on mount
  useEffect(() => {
    async function fetchStores() {
      setLoadingStores(true)
      const { data } = await supabase.from('stores').select('id, name').order('name')
      setStores(data ?? [])
      setLoadingStores(false)
    }
    fetchStores()

    supabase.from('chk_settings').select('value').eq('key', 'whatsapp_number').single().then(({ data }) => {
      if (data) setWhatsappNumber(data.value)
    })
  }, [])

  // Load employees when store selected
  useEffect(() => {
    if (!store) return
    setLoadingEmployees(true)
    supabase
      .from('chk_employees')
      .select('*')
      .eq('store_id', store.id)
      .eq('active', true)
      .order('sort_order')
      .then(({ data }) => {
        setEmployees(data ?? [])
        setLoadingEmployees(false)
      })
  }, [store])

  // Load lists when store selected
  useEffect(() => {
    if (!store) return
    setLoadingLists(true)
    supabase
      .from('chk_lists')
      .select('*')
      .eq('store_id', store.id)
      .eq('active', true)
      .order('sort_order')
      .then(({ data }) => {
        setLists(data ?? [])
        setLoadingLists(false)
      })
  }, [store])

  // Load tasks when list selected
  useEffect(() => {
    if (!list) return
    setLoadingTasks(true)

    const { dayOfWeek } = getCurrentDayInfo()

    supabase
      .from('chk_tasks')
      .select('*')
      .eq('list_id', list.id)
      .eq('day_of_week', dayOfWeek)
      .eq('active', true)
      .order('sort_order')
      .then(async ({ data: dayTasks }) => {
        let loaded: TaskWithCheck[]
        if (dayTasks && dayTasks.length > 0) {
          loaded = dayTasks.map(t => ({ ...t, checked: false }))
        } else {
          const { data: defaultTasks } = await supabase
            .from('chk_tasks')
            .select('*')
            .eq('list_id', list.id)
            .is('day_of_week', null)
            .eq('active', true)
            .order('sort_order')
          loaded = (defaultTasks ?? []).map(t => ({ ...t, checked: false }))
        }

        // Apply pending resume if user already confirmed before tasks loaded
        const pending = pendingResumeRef.current
        if (pending) {
          loaded = loaded.map(t => ({ ...t, checked: pending.includes(t.id) }))
          pendingResumeRef.current = null
        }

        setTasks(loaded)
        setLoadingTasks(false)
      })
  }, [list])

  // Save draft (debounced) whenever tasks change during fill
  const saveDraft = useCallback(async (checkedIds: string[]) => {
    if (!list || !store || !employee) return
    try {
      if (draftIdRef.current) {
        await supabase
          .from('chk_drafts')
          .update({ checked_ids: checkedIds, employee_name: employee.name })
          .eq('id', draftIdRef.current)
      } else {
        const { data } = await supabase
          .from('chk_drafts')
          .upsert(
            { store_id: store.id, list_id: list.id, employee_name: employee.name, checked_ids: checkedIds },
            { onConflict: 'list_id,store_id' }
          )
          .select('id')
          .single()
        if (data) draftIdRef.current = data.id
      }
    } catch { /* silent — draft is not critical */ }
  }, [list, store, employee])

  useEffect(() => {
    if (step !== 'fill' || tasks.length === 0) return
    const ids = tasks.filter(t => t.checked).map(t => t.id)
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    saveTimerRef.current = setTimeout(() => saveDraft(ids), 600)
    return () => { if (saveTimerRef.current) clearTimeout(saveTimerRef.current) }
  }, [tasks, step, saveDraft])

  // Handle list selection — check for existing draft first
  async function handleListSelect(l: ChkList) {
    setList(l)
    try {
      const { data } = await supabase
        .from('chk_drafts')
        .select('*')
        .eq('list_id', l.id)
        .eq('store_id', store!.id)
        .maybeSingle()

      if (data && data.checked_ids?.length > 0) {
        draftIdRef.current = data.id
        setResumeInfo({
          employeeName: data.employee_name,
          startedAt: data.started_at,
          checkedIds: data.checked_ids,
        })
        setStep('resume')
        return
      }
    } catch { /* proceed normally if draft check fails */ }
    setStep('fill')
  }

  function continueFromDraft() {
    if (resumeInfo) {
      const ids = resumeInfo.checkedIds
      if (tasks.length > 0) {
        setTasks(prev => prev.map(t => ({ ...t, checked: ids.includes(t.id) })))
      } else {
        // Tasks still loading — will be applied when they arrive
        pendingResumeRef.current = ids
      }
    }
    setResumeInfo(null)
    setStep('fill')
  }

  async function startFresh() {
    if (draftIdRef.current) {
      supabase.from('chk_drafts').delete().eq('id', draftIdRef.current)
      draftIdRef.current = null
    }
    setResumeInfo(null)
    setStep('fill')
  }

  const handleToggle = useCallback((taskId: string) => {
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, checked: !t.checked } : t))
  }, [])

  async function handleSubmit(obs: string) {
    if (!store || !employee || !list) return
    setSubmitting(true)
    setComment(obs)

    const now = new Date()
    setSubmittedAt(now)

    const doneCount = tasks.filter(t => t.checked).length
    const totalCount = tasks.length

    try {
      const submissionId = crypto.randomUUID()

      const { error } = await supabase
        .from('chk_submissions')
        .insert({
          id: submissionId,
          store_id: store.id,
          list_id: list.id,
          list_name: list.name,
          employee_id: employee.id,
          employee_name: employee.name,
          comment: obs.trim() || null,
          total_count: totalCount,
          done_count: doneCount,
        })

      if (error) throw error

      await supabase.from('chk_submission_items').insert(
        tasks.map(t => ({
          submission_id: submissionId,
          text: t.text,
          done: t.checked,
        }))
      )

      // Delete draft on successful submit
      if (draftIdRef.current) {
        supabase.from('chk_drafts').delete().eq('id', draftIdRef.current)
        draftIdRef.current = null
      }

      setStep('done')
    } catch (err) {
      console.error('Erro ao enviar checklist:', err)
      alert('Erro ao enviar. Tente novamente.')
    } finally {
      setSubmitting(false)
    }
  }

  function reset() {
    draftIdRef.current = null
    pendingResumeRef.current = null
    setResumeInfo(null)
    setStep('store')
    setStore(null)
    setEmployee(null)
    setList(null)
    setTasks([])
    setComment('')
  }

  // ── Steps ──────────────────────────────────────────────────────────────────

  if (step === 'store') {
    return (
      <StoreStep
        stores={stores}
        loading={loadingStores}
        onSelect={s => { setStore(s); setStep('employee') }}
      />
    )
  }

  if (step === 'employee' && store) {
    return (
      <EmployeeStep
        store={store}
        employees={employees}
        loading={loadingEmployees}
        onSelect={e => { setEmployee(e); setStep('list') }}
        onBack={() => setStep('store')}
      />
    )
  }

  if (step === 'list' && store && employee) {
    return (
      <ListStep
        store={store}
        employee={employee}
        lists={lists}
        loading={loadingLists}
        onSelect={handleListSelect}
        onBack={() => setStep('employee')}
      />
    )
  }

  if (step === 'resume' && store && employee && list && resumeInfo) {
    const time = new Date(resumeInfo.startedAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    const count = resumeInfo.checkedIds.length

    return (
      <div className="flex flex-col h-full">
        <Topbar
          breadcrumbs={[
            { label: `Loja ${store.name}`, onClick: () => setStep('store') },
            { label: employee.name, onClick: () => setStep('employee') },
            { label: list.name, onClick: () => setStep('list') },
          ]}
        />
        <Stage>
          <div className="py-6">
            <p className="text-[0.74rem] font-semibold uppercase tracking-widest text-ink-soft mb-5">
              Lista em andamento
            </p>
            <p className="text-base text-ink mb-1">
              <span className="font-medium">{resumeInfo.employeeName}</span> começou essa lista às {time} e não terminou.
            </p>
            <p className="text-sm text-ink-muted mb-8">
              {count} {count === 1 ? 'item marcado' : 'itens marcados'} até agora.
            </p>
            <div className="flex flex-col gap-3 max-w-xs">
              <button
                onClick={continueFromDraft}
                className="h-12 rounded-lg bg-ink text-bg text-sm font-medium hover:bg-ink-soft transition-colors"
              >
                Continuar de onde parou
              </button>
              <button
                onClick={startFresh}
                className="h-12 rounded-lg border border-rule-soft text-ink-soft text-sm hover:bg-bg-soft transition-colors"
              >
                Começar do zero
              </button>
            </div>
          </div>
        </Stage>
      </div>
    )
  }

  if (step === 'fill' && store && employee && list) {
    return (
      <FillStep
        store={store}
        employee={employee}
        list={list}
        tasks={loadingTasks ? [] : tasks}
        submitting={submitting}
        onToggle={handleToggle}
        onSubmit={handleSubmit}
        onBack={() => setStep('list')}
      />
    )
  }

  if (step === 'done' && store && employee && list) {
    return (
      <DoneStep
        store={store}
        employee={employee}
        list={list}
        tasks={tasks}
        comment={comment}
        submittedAt={submittedAt}
        whatsappNumber={whatsappNumber}
        onNewChecklist={reset}
      />
    )
  }

  return null
}
