import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { getCurrentDayInfo } from '@/lib/utils'
import type { Store, ChkEmployee, ChkList, TaskWithCheck } from '@/lib/types'
import StoreStep from '@/components/fill/StoreStep'
import EmployeeStep from '@/components/fill/EmployeeStep'
import ListStep from '@/components/fill/ListStep'
import FillStep from '@/components/fill/FillStep'
import DoneStep from '@/components/fill/DoneStep'

type Step = 'store' | 'employee' | 'list' | 'fill' | 'done'

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

    // Load WhatsApp number
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

    // First try to load day-specific tasks
    supabase
      .from('chk_tasks')
      .select('*')
      .eq('list_id', list.id)
      .eq('day_of_week', dayOfWeek)
      .eq('active', true)
      .order('sort_order')
      .then(async ({ data: dayTasks }) => {
        if (dayTasks && dayTasks.length > 0) {
          setTasks(dayTasks.map(t => ({ ...t, checked: false })))
        } else {
          // Fall back to default (no day_of_week)
          const { data: defaultTasks } = await supabase
            .from('chk_tasks')
            .select('*')
            .eq('list_id', list.id)
            .is('day_of_week', null)
            .eq('active', true)
            .order('sort_order')
          setTasks((defaultTasks ?? []).map(t => ({ ...t, checked: false })))
        }
        setLoadingTasks(false)
      })
  }, [list])

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

      setStep('done')
    } catch (err) {
      console.error('Erro ao enviar checklist:', err)
      alert('Erro ao enviar. Tente novamente.')
    } finally {
      setSubmitting(false)
    }
  }

  function reset() {
    setStep('store')
    setStore(null)
    setEmployee(null)
    setList(null)
    setTasks([])
    setComment('')
  }

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
        onSelect={l => { setList(l); setStep('fill') }}
        onBack={() => setStep('employee')}
      />
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
