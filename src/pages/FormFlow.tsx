import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { generateId } from '@/lib/utils'
import { useFillSession } from '@/hooks/useFillSession'
import type { ChkEmployee, FrmForm, ItemWithValue, Store } from '@/lib/types'
import FormSelectStep from '@/components/fill/FormSelectStep'
import FormFillStep, { type SectionWithItems } from '@/components/fill/FormFillStep'
import FormDoneStep from '@/components/fill/FormDoneStep'
import { SessionPrompt, SessionClosed } from '@/components/fill/SessionPrompt'
import Topbar from '@/components/layout/Topbar'
import Stage from '@/components/layout/Stage'

type Step = 'select' | 'fill' | 'done'

interface FormFlowProps {
  store: Store
  employee: ChkEmployee
  whatsappNumber: string
  telegramToken: string
  telegramChatId: string
  notificationEmail: string
  onBack: () => void
  onFinish: () => void
}

export default function FormFlow({
  store,
  employee,
  whatsappNumber,
  telegramToken,
  telegramChatId,
  notificationEmail,
  onBack,
  onFinish,
}: FormFlowProps) {
  const [step, setStep] = useState<Step>('select')

  const [forms, setForms] = useState<FrmForm[]>([])
  const [loadingForms, setLoadingForms] = useState(true)
  const [form, setForm] = useState<FrmForm | null>(null)

  // estrutura do formulário (seções e itens) — as respostas vêm da sessão
  const [sections, setSections] = useState<SectionWithItems[]>([])
  const [loadingSections, setLoadingSections] = useState(false)

  const [submitting, setSubmitting] = useState(false)
  const [submittedComment, setSubmittedComment] = useState('')
  const [submittedAt, setSubmittedAt] = useState<Date>(new Date())

  const session = useFillSession({
    kind: 'form',
    refId: step === 'fill' || step === 'done' ? form?.id ?? null : null,
    storeId: store.id,
    employee,
  })

  useEffect(() => {
    setLoadingForms(true)
    supabase
      .from('frm_forms')
      .select('*')
      .eq('store_id', store.id)
      .eq('active', true)
      .order('sort_order')
      .then(({ data }) => {
        setForms(data ?? [])
        setLoadingForms(false)
      })
  }, [store])

  async function handleFormSelect(f: FrmForm) {
    setForm(f)
    setLoadingSections(true)
    setStep('fill')

    const { data: sectionRows } = await supabase
      .from('frm_sections')
      .select('*')
      .eq('form_id', f.id)
      .eq('active', true)
      .order('sort_order')

    const { data: itemRows } = await supabase
      .from('frm_items')
      .select('*')
      .in('section_id', (sectionRows ?? []).map(s => s.id))
      .eq('active', true)
      .order('sort_order')

    const grouped: SectionWithItems[] = (sectionRows ?? []).map(section => ({
      section,
      items: (itemRows ?? [])
        .filter(i => i.section_id === section.id)
        .map((i): ItemWithValue => ({ ...i, quantity: null, comprar: false })),
    }))

    setSections(grouped)
    setLoadingSections(false)
  }

  // estrutura + respostas atuais da sessão compartilhada
  const sectionsView: SectionWithItems[] = sections.map(s => ({
    section: s.section,
    items: s.items.map(i => ({
      ...i,
      quantity: session.items[i.id]?.quantity ?? null,
      comprar: session.items[i.id]?.flag ?? false,
    })),
  }))

  function handleQuantityChange(itemId: string, value: number | null) {
    session.setItem(itemId, { quantity: value })
  }

  function handleComprarToggle(itemId: string) {
    session.setItem(itemId, { flag: !(session.items[itemId]?.flag ?? false) })
  }

  async function handleSubmit(obs: string) {
    if (!form) return
    setSubmitting(true)
    setSubmittedComment(obs)

    const now = new Date()
    setSubmittedAt(now)

    const allItems = sectionsView.flatMap(s => s.items)
    const filledCount = allItems.filter(i => i.quantity !== null).length
    const itemCount = allItems.length
    const employeeLabel = session.participantLabel || employee.name

    try {
      const submissionId = generateId()

      const { error } = await supabase
        .from('frm_submissions')
        .insert({
          id: submissionId,
          store_id: store.id,
          form_id: form.id,
          form_name: form.name,
          employee_id: session.submitterId ?? employee.id,
          employee_name: employeeLabel,
          comment: obs.trim() || null,
          item_count: itemCount,
          filled_count: filledCount,
        })

      if (error) throw error

      const { error: itemsError } = await supabase.from('frm_submission_items').insert(
        sectionsView.flatMap(s =>
          s.items.map(i => ({
            submission_id: submissionId,
            section_name: s.section.name,
            item_name: i.name,
            quantity: i.quantity,
            comprar: i.comprar,
          }))
        )
      )
      if (itemsError) throw itemsError

      // fecha a sessão para as outras telas só depois que o envio foi salvo
      await session.markSubmitted()

      const toBuy = allItems.filter(i => i.comprar).map(i => i.name)
      const mensagem = `📋 *Formulário Finalizado*\n\n*Loja:* ${store.name}\n*Funcionário:* ${employeeLabel}\n*Formulário:* ${form.name}\n*Respondidos:* ${filledCount}/${itemCount}\n*Comprar:* ${toBuy.length > 0 ? toBuy.join(', ') : 'Nada'}\n*Comentários:* ${obs || 'Nenhum'}`

      if (telegramToken && telegramChatId) {
        fetch(`https://api.telegram.org/bot${telegramToken}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ chat_id: telegramChatId, text: mensagem, parse_mode: 'Markdown' })
        }).catch(err => console.error('Erro Telegram', err))
      }

      if (notificationEmail) {
        fetch(`https://formsubmit.co/ajax/${notificationEmail}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
          body: JSON.stringify({
            _subject: `Formulário Finalizado - ${store.name}`,
            Loja: store.name,
            Funcionário: employeeLabel,
            Formulário: form.name,
            Respondidos: `${filledCount}/${itemCount}`,
            Comprar: toBuy.length > 0 ? toBuy.join(', ') : 'Nada',
            Comentários: obs || 'Nenhum'
          })
        }).catch(err => console.error('Erro Email', err))
      }

      setStep('done')
    } catch (err) {
      console.error('Erro ao enviar formulário:', err)
      alert('Erro ao enviar. Tente novamente.')
    } finally {
      setSubmitting(false)
    }
  }

  const breadcrumbs = [
    { label: `Loja ${store.name}`, onClick: onBack },
    { label: employee.name, onClick: () => setStep('select') },
    { label: form?.name ?? '' },
  ]

  if (step === 'select') {
    return (
      <FormSelectStep
        store={store}
        employee={employee}
        forms={forms}
        loading={loadingForms}
        onSelect={handleFormSelect}
        onBack={onBack}
      />
    )
  }

  if (step === 'fill' && form) {
    if (session.status === 'prompt' && session.existing) {
      return (
        <SessionPrompt
          noun="contagem"
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
          noun="contagem"
          reason={session.closedReason}
          breadcrumbs={breadcrumbs}
          onBack={onFinish}
        />
      )
    }

    if (session.status === 'error') {
      return (
        <div className="flex flex-col h-full">
          <Topbar breadcrumbs={breadcrumbs} />
          <Stage>
            <p className="text-sm text-ink-muted py-8">Não foi possível abrir essa contagem. Verifique a conexão e tente de novo.</p>
          </Stage>
        </div>
      )
    }

    if (session.status !== 'ready' || loadingSections) {
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
      <FormFillStep
        store={store}
        employee={employee}
        form={form}
        sections={sectionsView}
        submitting={submitting}
        comment={session.comment}
        onCommentChange={session.setComment}
        onQuantityChange={handleQuantityChange}
        onComprarToggle={handleComprarToggle}
        onSubmit={handleSubmit}
        onBack={() => setStep('select')}
      />
    )
  }

  if (step === 'done' && form) {
    return (
      <FormDoneStep
        store={store}
        employee={{ ...employee, name: session.participantLabel || employee.name }}
        form={form}
        items={sectionsView.flatMap(s => s.items)}
        comment={submittedComment}
        submittedAt={submittedAt}
        whatsappNumber={whatsappNumber}
        onNewForm={onFinish}
      />
    )
  }

  return null
}
