import { useState, useMemo } from 'react'
import { ChevronLeft, Send } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { ChkEmployee, FrmForm, FrmSection, ItemWithValue, Store } from '@/lib/types'

type Filter = 'all' | 'pending' | 'done'

export interface SectionWithItems {
  section: FrmSection
  items: ItemWithValue[]
}

interface FormFillStepProps {
  store: Store
  employee: ChkEmployee
  form: FrmForm
  sections: SectionWithItems[]
  submitting: boolean
  comment: string
  onCommentChange: (value: string) => void
  onQuantityChange: (itemId: string, value: number | null) => void
  onComprarToggle: (itemId: string) => void
  onSubmit: (comment: string) => void
  onBack: () => void
}

export default function FormFillStep({
  store,
  employee,
  form,
  sections,
  submitting,
  comment,
  onCommentChange,
  onQuantityChange,
  onComprarToggle,
  onSubmit,
  onBack,
}: FormFillStepProps) {
  const [filter, setFilter] = useState<Filter>('all')

  const allItems = useMemo(() => sections.flatMap(s => s.items), [sections])
  const filledCount = allItems.filter(i => i.quantity !== null).length
  const itemCount = allItems.length
  const percent = itemCount > 0 ? Math.round((filledCount / itemCount) * 100) : 0

  const filteredSections = useMemo(() => {
    if (filter === 'all') return sections
    return sections
      .map(s => ({
        section: s.section,
        items: s.items.filter(i => (filter === 'done' ? i.quantity !== null : i.quantity === null)),
      }))
      .filter(s => s.items.length > 0)
  }, [sections, filter])

  const pendingCount = itemCount - filledCount
  const allFilled = filledCount === itemCount && itemCount > 0

  return (
    <div className="min-h-screen bg-bg flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-10 px-5 py-3 bg-bg/90 backdrop-blur-md border-b border-rule-soft">
        <div className="max-w-sm mx-auto">
          <div className="flex items-center gap-3 mb-2">
            <button
              onClick={onBack}
              className="w-8 h-8 rounded-md flex items-center justify-center text-ink-muted hover:text-ink hover:bg-bg-hover transition-colors"
              aria-label="Voltar"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="min-w-0 flex-1">
              <p className="text-xs text-ink-muted uppercase tracking-wider truncate">
                Loja {store.name} · {employee.name}
              </p>
              <p className="text-sm font-medium text-ink">{form.name}</p>
            </div>
            <span className="text-xs text-ink-muted flex-shrink-0">
              {filledCount}/{itemCount}
            </span>
          </div>

          <div className="w-full h-1.5 rounded-full bg-rule-soft overflow-hidden">
            <div
              className="h-full rounded-full bg-ink transition-all duration-300"
              style={{ width: `${percent}%` }}
            />
          </div>
        </div>
      </header>

      <div className="flex-1 px-5 py-4">
        <div className="max-w-sm mx-auto">
          {/* Filter bar */}
          <div className="inline-flex items-center p-0.5 rounded-pill border border-rule-soft bg-bg-card mb-5">
            {(['all', 'pending', 'done'] as Filter[]).map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={cn(
                  'px-3 py-1.5 rounded-md text-xs font-medium transition-colors',
                  filter === f ? 'bg-ink text-bg' : 'text-ink-muted hover:text-ink'
                )}
              >
                {f === 'all' ? 'Todos' : f === 'pending' ? 'Pendentes' : 'Respondidos'}
                {f === 'pending' && pendingCount > 0 && (
                  <span className="ml-1 text-[0.65rem]">({pendingCount})</span>
                )}
              </button>
            ))}
          </div>

          {/* Sections */}
          <div className="mb-6 space-y-6">
            {filteredSections.length === 0 ? (
              <p className="text-sm text-ink-muted py-4 text-center">
                {filter === 'pending' ? 'Nenhum item pendente.' : 'Nenhum item respondido ainda.'}
              </p>
            ) : (
              filteredSections.map(({ section, items }) => (
                <div key={section.id}>
                  <p className="text-[0.74rem] font-semibold uppercase tracking-widest text-ink-soft mb-2 pb-1.5 border-b border-rule">
                    {section.name}
                  </p>
                  <div className="space-y-1.5">
                    {items.map(item => (
                      <ItemRow
                        key={item.id}
                        item={item}
                        onQuantityChange={v => onQuantityChange(item.id, v)}
                        onComprarToggle={() => onComprarToggle(item.id)}
                      />
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Observations */}
          <div className="mb-6">
            <label className="block text-[0.74rem] font-semibold uppercase tracking-widest text-ink-soft mb-2 pb-1.5 border-b border-rule">
              Observações
            </label>
            <textarea
              data-sync-key="comment"
              value={comment}
              onChange={e => onCommentChange(e.target.value)}
              placeholder="Algo a reportar? (opcional)"
              rows={3}
              className="
                w-full bg-transparent resize-none
                border-0 border-b border-rule-soft focus:border-ink
                py-1.5 text-ink text-sm placeholder:text-ink-muted
                outline-none transition-colors
              "
            />
          </div>

          {/* Submit button */}
          <button
            onClick={() => onSubmit(comment)}
            disabled={submitting}
            className={cn(
              'w-full h-12 rounded-pill',
              'flex items-center justify-center gap-2',
              'text-sm font-medium uppercase tracking-wider',
              'transition-colors',
              'focus-visible:outline-2 focus-visible:outline-ink focus-visible:outline-offset-2',
              allFilled
                ? 'bg-ink text-bg hover:bg-ink-soft'
                : 'border border-ink text-ink hover:bg-bg-hover',
              submitting && 'opacity-50 cursor-not-allowed'
            )}
          >
            <Send className="w-4 h-4" />
            {submitting ? 'Enviando…' : allFilled ? 'Enviar formulário' : `Enviar (${filledCount}/${itemCount})`}
          </button>
        </div>
      </div>
    </div>
  )
}

function ItemRow({
  item,
  onQuantityChange,
  onComprarToggle,
}: {
  item: ItemWithValue
  onQuantityChange: (value: number | null) => void
  onComprarToggle: () => void
}) {
  const filled = item.quantity !== null

  return (
    <div
      className={cn(
        'flex items-center gap-2 py-2.5 px-3',
        'rounded-lg border transition-colors',
        filled ? 'bg-bg-card border-rule-soft' : 'bg-bg border-rule-soft'
      )}
    >
      <span className="flex-1 min-w-0 text-ink text-sm">{item.name}</span>

      <input
        type="number"
        inputMode="decimal"
        min={0}
        data-sync-key={item.id}
        value={item.quantity ?? ''}
        onChange={e => {
          const raw = e.target.value
          onQuantityChange(raw === '' ? null : Number(raw))
        }}
        placeholder="qtd"
        className="
          w-14 flex-shrink-0 bg-transparent text-right
          border-0 border-b border-rule-soft focus:border-ink
          py-1 text-ink text-sm placeholder:text-ink-muted
          outline-none transition-colors
          [appearance:textfield]
        "
      />

      <button
        onClick={onComprarToggle}
        className="flex items-center gap-1.5 flex-shrink-0 pl-1"
        aria-pressed={item.comprar}
      >
        <span
          className={cn(
            'w-4 h-4 rounded-sm border-[1.5px] flex-shrink-0',
            'flex items-center justify-center transition-colors',
            item.comprar ? 'bg-ink border-ink' : 'border-rule'
          )}
          aria-hidden
        >
          {item.comprar && (
            <svg width="9" height="7" viewBox="0 0 9 7" fill="none">
              <path d="M1 3.5L3.5 6L8 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-bg" />
            </svg>
          )}
        </span>
        <span className="text-[0.65rem] uppercase tracking-wider text-ink-muted">Comprar</span>
      </button>
    </div>
  )
}
