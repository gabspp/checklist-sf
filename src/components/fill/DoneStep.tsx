import { useState } from 'react'
import { Check, MessageCircle, Copy, ClipboardList } from 'lucide-react'
import { cn, getShareText, openWhatsApp, copyToClipboard } from '@/lib/utils'
import type { ChkEmployee, ChkList, Store, TaskWithCheck } from '@/lib/types'

interface DoneStepProps {
  store: Store
  employee: ChkEmployee
  list: ChkList
  tasks: TaskWithCheck[]
  comment: string
  submittedAt: Date
  whatsappNumber: string
  onNewChecklist: () => void
}

export default function DoneStep({
  store,
  employee,
  list,
  tasks,
  comment,
  submittedAt,
  whatsappNumber,
  onNewChecklist,
}: DoneStepProps) {
  const [copied, setCopied] = useState(false)

  const doneCount = tasks.filter(t => t.checked).length
  const totalCount = tasks.length
  const pendingItems = tasks.filter(t => !t.checked).map(t => t.text)

  const dayOfWeek = submittedAt.toLocaleDateString('pt-BR', { weekday: 'long' }).toLowerCase()
  const date = submittedAt.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
  const time = submittedAt.toTimeString().substring(0, 5)

  const shareText = getShareText({
    storeName: store.name,
    listName: list.name,
    employeeName: employee.name,
    date,
    time,
    dayOfWeek,
    doneCount,
    totalCount,
    pendingItems,
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

  const allDone = doneCount === totalCount

  return (
    <div className="min-h-screen bg-bg flex flex-col">
      <div className="flex-1 flex flex-col items-center justify-start px-5 py-12">
        <div className="w-full max-w-sm">
          {/* Status icon */}
          <div className="flex justify-center mb-6">
            <div className={cn(
              'w-14 h-14 rounded-lg flex items-center justify-center',
              allDone ? 'bg-ink' : 'bg-bg-card border border-rule'
            )}>
              <Check className={cn('w-7 h-7', allDone ? 'text-bg' : 'text-ink')} />
            </div>
          </div>

          {/* Summary */}
          <div className="text-center mb-6 pb-6 border-b border-rule-soft">
            <h1 className="font-serif text-xl text-ink mb-1">
              Checklist enviado
            </h1>
            <p className="text-sm text-ink-soft">
              {list.name} · Loja {store.name} · {employee.name}
            </p>
            <p className="text-xs text-ink-muted mt-1">
              {date} às {time}
            </p>
          </div>

          {/* Score */}
          <div className="mb-6 p-3.5 bg-bg-card border border-rule-soft rounded-lg">
            <div className="flex items-baseline justify-between">
              <span className="text-[0.74rem] font-semibold uppercase tracking-widest text-ink-soft">
                Itens concluídos
              </span>
              <span className="text-sm font-medium text-ink">
                {doneCount} / {totalCount}
              </span>
            </div>
            <div className="mt-2 w-full h-1.5 rounded-full bg-rule-soft overflow-hidden">
              <div
                className="h-full rounded-full bg-ink"
                style={{ width: `${totalCount > 0 ? (doneCount / totalCount) * 100 : 0}%` }}
              />
            </div>
          </div>

          {/* Pending items (if any) */}
          {pendingItems.length > 0 && (
            <div className="mb-6 p-3.5 bg-bg-card border border-rule-soft rounded-lg">
              <p className="text-[0.74rem] font-semibold uppercase tracking-widest text-ink-soft mb-2">
                Pendentes
              </p>
              <ul className="space-y-1">
                {pendingItems.map((item, i) => (
                  <li key={i} className="text-sm text-ink-soft flex items-baseline gap-2">
                    <span className="text-ink-muted shrink-0">·</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Actions */}
          <div className="space-y-2">
            <button
              onClick={handleWhatsApp}
              className="
                w-full h-12 rounded-pill
                flex items-center justify-center gap-2
                bg-ink text-bg
                text-sm font-medium uppercase tracking-wider
                hover:bg-ink-soft transition-colors
                focus-visible:outline-2 focus-visible:outline-ink focus-visible:outline-offset-2
              "
            >
              <MessageCircle className="w-4 h-4" />
              Enviar no WhatsApp
            </button>

            <button
              onClick={handleCopy}
              className="
                w-full h-12 rounded-pill
                flex items-center justify-center gap-2
                border border-ink text-ink
                text-sm font-medium uppercase tracking-wider
                hover:bg-bg-hover transition-colors
                focus-visible:outline-2 focus-visible:outline-ink focus-visible:outline-offset-2
              "
            >
              <Copy className="w-4 h-4" />
              {copied ? 'Copiado!' : 'Copiar texto'}
            </button>

            <button
              onClick={onNewChecklist}
              className="
                w-full h-10
                flex items-center justify-center gap-2
                text-ink-muted
                text-xs uppercase tracking-wider
                hover:text-ink transition-colors
                focus-visible:outline-2 focus-visible:outline-ink focus-visible:outline-offset-2 rounded-md
              "
            >
              <ClipboardList className="w-3.5 h-3.5" />
              Novo checklist
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
