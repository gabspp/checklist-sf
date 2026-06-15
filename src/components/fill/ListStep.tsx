import { ChevronLeft, ClipboardList } from 'lucide-react'
import type { ChkList, ChkEmployee, Store } from '@/lib/types'

interface ListStepProps {
  store: Store
  employee: ChkEmployee
  lists: ChkList[]
  loading: boolean
  onSelect: (list: ChkList) => void
  onBack: () => void
}

export default function ListStep({ store, employee, lists, loading, onSelect, onBack }: ListStepProps) {
  return (
    <div className="min-h-screen bg-bg flex flex-col">
      <header className="sticky top-0 z-10 px-5 py-3 bg-bg/90 backdrop-blur-md border-b border-rule-soft">
        <div className="max-w-sm mx-auto flex items-center gap-3">
          <button
            onClick={onBack}
            className="w-8 h-8 rounded-md flex items-center justify-center text-ink-muted hover:text-ink hover:bg-bg-hover transition-colors"
            aria-label="Voltar"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <div className="min-w-0">
            <p className="text-xs text-ink-muted uppercase tracking-wider">
              Loja {store.name} · {employee.name}
            </p>
            <p className="text-sm font-medium text-ink">Qual checklist?</p>
          </div>
        </div>
      </header>

      <div className="flex-1 px-5 py-6">
        <div className="max-w-sm mx-auto space-y-2">
          {loading ? (
            <div className="space-y-2">
              {[1, 2].map(i => (
                <div key={i} className="h-16 rounded-lg bg-bg-soft animate-pulse" />
              ))}
            </div>
          ) : lists.length === 0 ? (
            <p className="text-sm text-ink-muted text-center py-8">
              Nenhuma lista ativa nesta loja.
            </p>
          ) : (
            lists.map(list => (
              <button
                key={list.id}
                onClick={() => onSelect(list)}
                className="
                  w-full h-16 px-4
                  flex items-center gap-3
                  bg-bg-card border border-rule-soft rounded-lg
                  text-ink font-medium text-base text-left
                  hover:bg-bg-hover hover:border-rule
                  transition-colors
                  focus-visible:outline-2 focus-visible:outline-ink focus-visible:outline-offset-2
                "
              >
                <ClipboardList className="w-4 h-4 text-ink-muted flex-shrink-0" />
                <span>{list.name}</span>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
