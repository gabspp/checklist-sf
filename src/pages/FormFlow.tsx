import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { generateId } from '@/lib/utils'
import type { ChkEmployee, FrmForm, ItemWithValue, Store } from '@/lib/types'
import FormSelectStep from '@/components/fill/FormSelectStep'
import FormFillStep, { type SectionWithItems } from '@/components/fill/FormFillStep'
import FormDoneStep from '@/components/fill/FormDoneStep'

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

  const [sections, setSections] = useState<SectionWithItems[]>([])
  const [loadingSections, setLoadingSections] = useState(false)

  const [submitting, setSubmitting] = useState(false)
  const [comment, setComment] = useState('')
  const [submittedAt, setSubmittedAt] = useState<Date>(new Date())

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

  function handleQuantityChange(itemId: string, value: number | null) {
    setSections(prev =>
      prev.map(s => ({
        ...s,
        items: s.items.map(i => (i.id === itemId ? { ...i, quantity: value } : i)),
      }))
    )
  }

  function handleComprarToggle(itemId: string) {
    setSections(prev =>
      prev.map(s => ({
        ...s,
        items: s.items.map(i => (i.id === itemId ? { ...i, comprar: !i.comprar } : i)),
      }))
    )
  }

  async function handleSubmit(obs: string) {
    if (!form) return
    setSubmitting(true)
    setComment(obs)

    const now = new Date()
    setSubmittedAt(now)

    const allItems = sections.flatMap(s => s.items)
    const filledCount = allItems.filter(i => i.quantity !== null).length
    const itemCount = allItems.length

    try {
      const submissionId = generateId()

      const { error } = await supabase
        .from('frm_submissions')
        .insert({
          id: submissionId,
          store_id: store.id,
          form_id: form.id,
          form_name: form.name,
          employee_id: employee.id,
          employee_name: employee.name,
          comment: obs.trim() || null,
          item_count: itemCount,
          filled_count: filledCount,
        })

      if (error) throw error

      await supabase.from('frm_submission_items').insert(
        sections.flatMap(s =>
          s.items.map(i => ({
            submission_id: submissionId,
            section_name: s.section.name,
            item_name: i.name,
            quantity: i.quantity,
            comprar: i.comprar,
          }))
        )
      )

      const toBuy = allItems.filter(i => i.comprar).map(i => i.name)
      const mensagem = `📋 *Formulário Finalizado*\n\n*Loja:* ${store.name}\n*Funcionário:* ${employee.name}\n*Formulário:* ${form.name}\n*Respondidos:* ${filledCount}/${itemCount}\n*Comprar:* ${toBuy.length > 0 ? toBuy.join(', ') : 'Nada'}\n*Comentários:* ${obs || 'Nenhum'}`

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
            Funcionário: employee.name,
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
    return (
      <FormFillStep
        store={store}
        employee={employee}
        form={form}
        sections={loadingSections ? [] : sections}
        submitting={submitting}
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
        employee={employee}
        form={form}
        items={sections.flatMap(s => s.items)}
        comment={comment}
        submittedAt={submittedAt}
        whatsappNumber={whatsappNumber}
        onNewForm={onFinish}
      />
    )
  }

  return null
}
