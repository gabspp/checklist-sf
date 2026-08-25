import { useState, useEffect } from 'react'
import confetti from 'canvas-confetti'
import { Check, MessageCircle, Copy, FileText } from 'lucide-react'
import { cn, getFormShareText, openWhatsApp, copyToClipboard } from '@/lib/utils'
import type { ChkEmployee, FrmForm, Store, ItemWithValue } from '@/lib/types'

interface FormDoneStepProps {
  store: Store
  employee: ChkEmployee
  form: FrmForm
  items: ItemWithValue[]
  comment: string
  submittedAt: Date
  whatsappNumber: string
  onNewForm: () => void
}

export default function FormDoneStep({
  store,
  employee,
  form,
  items,
  comment,
  submittedAt,
  whatsappNumber,
  onNewForm,
}: FormDoneStepProps) {
  const [copied, setCopied] = useState(false)

  const filledCount = items.filter(i => i.quantity !== null).length
  const itemCount = items.length
  const toBuyItems = items.filter(i => i.comprar).map(i => i.name)

  const dayOfWeek = submittedAt.toLocaleDateString('pt-BR', { weekday: 'long' }).toLowerCase()
  const date = submittedAt.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
  const time = submittedAt.toTimeString().substring(0, 5)

  const shareText = getFormShareText({
    storeName: store.name,
    formName: form.name,
    employeeName: employee.name,
    date,
    time,
    dayOfWeek,
    filledCount,
    itemCount,
    toBuyItems,
    comment,
  })

  async function handleCopy() {
    const ok = await copyToClipboard(shareText)
    if (ok) {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  function handleWhatsApp() {
    openWhatsApp(whatsappNumber, shareText)
  }

  const allFilled = filledCount === itemCount

  useEffect(() => {
    confetti({
      particleCount: allFilled ? 150 : 60,
      spread: allFilled ? 80 : 50,
      origin: { y: 0.6 },
      disableForReducedMotion: true
    })
  }, [allFilled])

  return (
    <div className="min-h-screen bg-bg flex flex-col">
      <div className="flex-1 flex flex-col items-center justify-start px-5 py-12">
        <div className="w-full max-w-sm">
          {/* Status icon */}
          <div className="flex justify-center mb-6">
            <div className={cn(
              'w-14 h-14 rounded-lg flex items-center justify-center',
              allFilled ? 'bg-ink' : 'bg-bg-card border border-rule'
            )}>
              <Check className={cn('w-7 h-7', allFilled ? 'text-bg' : 'text-ink')} />
            </div>
          </div>

          {/* Summary */}
          <div className="text-center mb-6 pb-6 border-b border-rule-soft">
            <h1 className="font-serif text-xl text-ink mb-1">
              Formulário enviado
            </h1>
            <p className="text-sm text-ink-soft">
              {form.name} · Loja {store.name} · {employee.name}
            </p>
            <p className="text-xs text-ink-muted mt-1">
              {date} às {time}
            </p>
          </div>

          {/* Score */}
          <div className="mb-6 p-3.5 bg-bg-card border border-rule-soft rounded-lg">
            <div className="flex items-baseline justify-between">
              <span className="text-[0.74rem] font-semibold uppercase tracking-widest text-ink-soft">
                Itens respondidos
              </span>
              <span className="text-sm font-medium text-ink">
                {filledCount} / {itemCount}
              </span>
            </div>
            <div className="mt-2 w-full h-1.5 rounded-full bg-rule-soft overflow-hidden">
              <div
                className="h-full rounded-full bg-ink"
                style={{ width: `${itemCount > 0 ? (filledCount / itemCount) * 100 : 0}%` }}
              />
            </div>
          </div>

          {/* To-buy items */}
          {toBuyItems.length > 0 && (
            <div className="mb-6 p-3.5 bg-bg-card border border-rule-soft rounded-lg">
              <p className="text-[0.74rem] font-semibold uppercase tracking-widest text-ink-soft mb-2">
                Comprar
              </p>
              <ul className="space-y-1">
                {toBuyItems.map((item, i) => (
                  <li key={i} className="text-sm text-ink-soft flex items-baseline gap-2">
                    <span className="text-ink-muted shrink-0">·</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Actions */}
          <div className="space-y-3">
            <div className="p-3 bg-bg-card border border-rule-soft rounded-lg text-center flex flex-col items-center justify-center gap-1">
               <span className="text-sm font-medium text-ink">Finalizado com sucesso</span>
               <span className="text-xs text-ink-muted">A notificação automática foi disparada.</span>
            </div>

            <button
              onClick={onNewForm}
              className="
                w-full h-12 rounded-pill
                flex items-center justify-center gap-2
                bg-ink text-bg
                text-sm font-medium uppercase tracking-wider
                hover:bg-ink-soft transition-colors
                focus-visible:outline-2 focus-visible:outline-ink focus-visible:outline-offset-2
              "
            >
              <FileText className="w-4 h-4" />
              Novo formulário
            </button>

            <div className="flex gap-2">
              <button
                onClick={handleWhatsApp}
                className="
                  flex-1 h-10 rounded-pill
                  flex items-center justify-center gap-1.5
                  border border-rule-soft text-ink-soft
                  text-[10px] font-medium uppercase tracking-wider
                  hover:bg-bg-hover transition-colors
                "
              >
                <MessageCircle className="w-3 h-3" />
                WhatsApp (Manual)
              </button>

              <button
                onClick={handleCopy}
                className="
                  flex-1 h-10 rounded-pill
                  flex items-center justify-center gap-1.5
                  border border-rule-soft text-ink-soft
                  text-[10px] font-medium uppercase tracking-wider
                  hover:bg-bg-hover transition-colors
                "
              >
                <Copy className="w-3 h-3" />
                {copied ? 'Copiado!' : 'Copiar texto'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
