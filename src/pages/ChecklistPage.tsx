import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { getCurrentDayInfo, generateId } from '@/lib/utils'
import { useFillSession } from '@/hooks/useFillSession'
import type { Store, ChkEmployee, ChkList, TaskWithCheck } from '@/lib/types'
import StoreStep from '@/components/fill/StoreStep'
import EmployeeStep from '@/components/fill/EmployeeStep'
import TypeStep from '@/components/fill/TypeStep'
import ListStep from '@/components/fill/ListStep'
import FillStep from '@/components/fill/FillStep'
import DoneStep from '@/components/fill/DoneStep'
import { SessionPrompt, SessionClosed } from '@/components/fill/SessionPrompt'
import Topbar from '@/components/layout/Topbar'
import Stage from '@/components/layout/Stage'
import FormFlow from '@/pages/FormFlow'

type Step = 'store' | 'employee' | 'type' | 'list' | 'fill' | 'done' | 'form'

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
  const [telegramToken, setTelegramToken] = useState('')
  const [telegramChatId, setTelegramChatId] = useState('')
  const [notificationEmail, setNotificationEmail] = useState('')

  // Sessão compartilhada: as marcações vêm dela, não do estado local
  const session = useFillSession({
    kind: 'checklist',
    refId: step === 'fill' || step === 'done' ? list?.id ?? null : null,
    storeId: store?.id ?? null,
    employee,
  })

  // UI state
  const [loadingStores, setLoadingStores] = useState(true)
  const [loadingEmployees, setLoadingEmployees] = useState(false)
  const [loadingLists, setLoadingLists] = useState(false)
  const [loadingTasks, setLoadingTasks] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submittedComment, setSubmittedComment] = useState('')
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

    supabase.from('chk_settings').select('key, value').then(({ data }) => {
      if (data) {
        const getVal = (k: string) => data.find(d => d.key === k)?.value || ''
        const zap = getVal('whatsapp_number')
        if (zap) setWhatsappNumber(zap)
        setTelegramToken(getVal('telegram_token'))
        setTelegramChatId(getVal('telegram_chat_id'))
        setNotificationEmail(getVal('notification_email'))
      }
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

  // Load tasks when list selected — sempre carrega "toda semana" + tarefas do dia (aditivo)
  useEffect(() => {
    if (!list) return
    setLoadingTasks(true)

    const { dayOfWeek } = getCurrentDayInfo()

    async function loadTasks() {
      const [{ data: defaultTasks }, { data: dayTasks }] = await Promise.all([
        supabase
          .from('chk_tasks')
          .select('*')
          .eq('list_id', list!.id)
          .is('day_of_week', null)
          .eq('active', true)
          .order('sort_order'),
        supabase
          .from('chk_tasks')
          .select('*')
          .eq('list_id', list!.id)
          .eq('day_of_week', dayOfWeek)
          .eq('active', true)
          .order('sort_order'),
      ])

      // Tarefas padrão primeiro, depois as específicas do dia
      const loaded: TaskWithCheck[] = [
        ...(defaultTasks ?? []),
        ...(dayTasks ?? []),
      ].map(t => ({ ...t, checked: false }))

      setTasks(loaded)
      setLoadingTasks(false)
    }

    loadTasks()
  }, [list])

  // Tarefas com o estado de marcação vindo da sessão compartilhada
  const tasksView: TaskWithCheck[] = tasks.map(t => ({
    ...t,
    checked: session.items[t.id]?.flag ?? false,
  }))

  function handleListSelect(l: ChkList) {
    setList(l)
    setStep('fill')
  }

  function handleToggle(taskId: string) {
    session.setItem(taskId, { flag: !(session.items[taskId]?.flag ?? false) })
  }

  async function handleSubmit(obs: string) {
    if (!store || !employee || !list) return
    setSubmitting(true)
    setSubmittedComment(obs)

    const now = new Date()
    setSubmittedAt(now)

    const doneCount = tasksView.filter(t => t.checked).length
    const totalCount = tasksView.length
    const employeeLabel = session.participantLabel || employee.name

    try {
      const submissionId = generateId()

      const { error } = await supabase
        .from('chk_submissions')
        .insert({
          id: submissionId,
          store_id: store.id,
          list_id: list.id,
          list_name: list.name,
          employee_id: session.submitterId ?? employee.id,
          employee_name: employeeLabel,
          comment: obs.trim() || null,
          total_count: totalCount,
          done_count: doneCount,
        })

      if (error) throw error

      const { error: itemsError } = await supabase.from('chk_submission_items').insert(
        tasksView.map(t => ({
          submission_id: submissionId,
          text: t.text,
          done: t.checked,
        }))
      )
      if (itemsError) throw itemsError

      // fecha a sessão para as outras telas só depois que o envio foi salvo
      await session.markSubmitted()

      // --- Notificações ---
      const mensagem = `✅ *Checklist Finalizado*\n\n*Loja:* ${store.name}\n*Funcionário:* ${employeeLabel}\n*Lista:* ${list.name}\n*Concluídos:* ${doneCount}/${totalCount}\n*Comentários:* ${obs || 'Nenhum'}`

      // Enviar Telegram
      if (telegramToken && telegramChatId) {
        fetch(`https://api.telegram.org/bot${telegramToken}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ chat_id: telegramChatId, text: mensagem, parse_mode: 'Markdown' })
        }).catch(err => console.error('Erro Telegram', err))
      }

      // Enviar E-mail (FormSubmit)
      if (notificationEmail) {
        fetch(`https://formsubmit.co/ajax/${notificationEmail}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
          body: JSON.stringify({
            _subject: `Checklist Finalizado - ${store.name}`,
            Loja: store.name,
            Funcionário: employeeLabel,
            Lista: list.name,
            Concluídos: `${doneCount}/${totalCount}`,
            Comentários: obs || 'Nenhum'
          })
        }).catch(err => console.error('Erro Email', err))
      }
      // --------------------

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
    setSubmittedComment('')
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
        onSelect={e => { setEmployee(e); setStep('type') }}
        onBack={() => setStep('store')}
      />
    )
  }

  if (step === 'type' && store && employee) {
    return (
      <TypeStep
        store={store}
        employee={employee}
        onSelect={type => setStep(type === 'checklist' ? 'list' : 'form')}
        onBack={() => setStep('employee')}
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
        onBack={() => setStep('type')}
      />
    )
  }

  if (step === 'form' && store && employee) {
    return (
      <FormFlow
        store={store}
        employee={employee}
        whatsappNumber={whatsappNumber}
        telegramToken={telegramToken}
        telegramChatId={telegramChatId}
        notificationEmail={notificationEmail}
        onBack={() => setStep('type')}
        onFinish={reset}
      />
    )
  }

  if (step === 'fill' && store && employee && list) {
    const breadcrumbs = [
      { label: `Loja ${store.name}`, onClick: () => setStep('store') },
      { label: employee.name, onClick: () => setStep('employee') },
      { label: list.name, onClick: () => setStep('list') },
    ]

    if (session.status === 'prompt' && session.existing) {
      return (
        <SessionPrompt
          noun="lista"
          existing={session.existing}
          onlineNames={session.onlineNames}
          meName={employee.name}
          busy={false}
          breadcrumbs={breadcrumbs}
          onContinue={() => { void session.continueExisting() }}
          onStartFresh={() => { void session.startFresh() }}
        />
      )
    }

    if (session.status === 'closed' && session.closedReason) {
      return (
        <SessionClosed
          noun="lista"
          reason={session.closedReason}
          breadcrumbs={breadcrumbs}
          onBack={reset}
        />
      )
    }

    if (session.status === 'error') {
      return (
        <div className="flex flex-col h-full">
          <Topbar breadcrumbs={breadcrumbs} />
          <Stage>
            <p className="text-sm text-ink-muted py-8">Não foi possível abrir essa lista. Verifique a conexão e tente de novo.</p>
          </Stage>
        </div>
      )
    }

    if (session.status !== 'ready' || loadingTasks) {
      return (
        <div className="flex flex-col h-full">
          <Topbar breadcrumbs={breadcrumbs} />
          <Stage>
            <div className="space-y-2 py-8">
              {[1, 2, 3].map(i => <div key={i} className="h-12 rounded-lg bg-bg-soft animate-pulse" />)}
            </div>
          </Stage>
        </div>
      )
    }

    return (
      <FillStep
        store={store}
        employee={employee}
        list={list}
        tasks={tasksView}
        submitting={submitting}
        comment={session.comment}
        onCommentChange={session.setComment}
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
        employee={{ ...employee, name: session.participantLabel || employee.name }}
        list={list}
        tasks={tasksView}
        comment={submittedComment}
        submittedAt={submittedAt}
        whatsappNumber={whatsappNumber}
        onNewChecklist={reset}
      />
    )
  }

  return null
}
