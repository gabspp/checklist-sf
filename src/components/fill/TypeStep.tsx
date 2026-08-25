import { ChevronLeft, ListChecks, FileText } from 'lucide-react'
import type { ChkEmployee, Store } from '@/lib/types'

export type FillType = 'checklist' | 'form'

interface TypeStepProps {
  store: Store
  employee: ChkEmployee
  onSelect: (type: FillType) => void
  onBack: () => void
}

export default function TypeStep({ store, employee, onSelect, onBack }: TypeStepProps) {
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
            <p className="text-sm font-medium text-ink">O que você quer preencher?</p>
          </div>
        </div>
      </header>

      <div className="flex-1 px-5 py-6">
        <div className="max-w-sm mx-auto space-y-3">
          <button
            onClick={() => onSelect('checklist')}
            className="
              w-full h-20 px-5
              flex items-center gap-3
              bg-bg-card border border-rule-soft rounded-lg
              text-ink font-medium text-base text-left
              hover:bg-bg-hover hover:border-rule
              transition-colors
              focus-visible:outline-2 focus-visible:outline-ink focus-visible:outline-offset-2
            "
          >
            <ListChecks className="w-5 h-5 text-ink-muted flex-shrink-0" />
            <span>
              Checklist
              <span className="block text-xs font-normal text-ink-muted mt-0.5">
                Tarefas de abertura, fechamento etc.
              </span>
            </span>
          </button>

          <button
            onClick={() => onSelect('form')}
            className="
              w-full h-20 px-5
              flex items-center gap-3
              bg-bg-card border border-rule-soft rounded-lg
              text-ink font-medium text-base text-left
              hover:bg-bg-hover hover:border-rule
              transition-colors
              focus-visible:outline-2 focus-visible:outline-ink focus-visible:outline-offset-2
            "
          >
            <FileText className="w-5 h-5 text-ink-muted flex-shrink-0" />
            <span>
              Formulário
              <span className="block text-xs font-normal text-ink-muted mt-0.5">
                Estoque, contagens e outras respostas.
              </span>
            </span>
          </button>
        </div>
      </div>
    </div>
  )
}
