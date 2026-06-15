import { useState, useMemo } from 'react'
import { ChevronLeft, Send } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { ChkEmployee, ChkList, Store, TaskWithCheck } from '@/lib/types'

type Filter = 'all' | 'pending' | 'done'

interface FillStepProps {
  store: Store
  employee: ChkEmployee
  list: ChkList
  tasks: TaskWithCheck[]
  submitting: boolean
  onToggle: (taskId: string) => void
  onSubmit: (comment: string) => void
  onBack: () => void
}

export default function FillStep({
  store,
  employee,
  list,
  tasks,
  submitting,
  onToggle,
  onSubmit,
  onBack,
}: FillStepProps) {
  const [filter, setFilter] = useState<Filter>('all')
  const [comment, setComment] = useState('')

  const doneCount = tasks.filter(t => t.checked).length
  const totalCount = tasks.length
  const percent = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0

  const filtered = useMemo(() => {
    if (filter === 'pending') return tasks.filter(t => !t.checked)
    if (filter === 'done') return tasks.filter(t => t.checked)
    return tasks
  }, [tasks, filter])

  const allDone = doneCount === totalCount && totalCount > 0

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
              <p className="text-sm font-medium text-ink">{list.name}</p>
            </div>
            <span className="text-xs text-ink-muted flex-shrink-0">
              {doneCount}/{totalCount}
            </span>
          </div>

          {/* Progress bar */}
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
          <div className="inline-flex items-center p-0.5 rounded-pill border border-rule-soft bg-bg-card mb-4">
            {(['all', 'pending', 'done'] as Filter[]).map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={cn(
                  'px-3 py-1.5 rounded-md text-xs font-medium transition-colors',
                  filter === f
                    ? 'bg-ink text-bg'
                    : 'text-ink-muted hover:text-ink'
                )}
              >
                {f === 'all' ? 'Todos' : f === 'pending' ? 'Pendentes' : 'Concluídos'}
                {f === 'pending' && tasks.filter(t => !t.checked).length > 0 && (
                  <span className="ml-1 text-[0.65rem]">
                    ({tasks.filter(t => !t.checked).length})
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Task list */}
          <div className="space-y-1.5 mb-6">
            {filtered.length === 0 ? (
              <p className="text-sm text-ink-muted py-4 text-center">
                {filter === 'pending' ? 'Nenhuma tarefa pendente.' : 'Nenhuma tarefa concluída ainda.'}
              </p>
            ) : (
              filtered.map(task => (
                <TaskRow
                  key={task.id}
                  task={task}
                  onToggle={() => onToggle(task.id)}
                />
              ))
            )}
          </div>

          {/* Observations */}
          <div className="mb-6">
            <label className="block text-[0.74rem] font-semibold uppercase tracking-widest text-ink-soft mb-2 pb-1.5 border-b border-rule">
              Observações
            </label>
            <textarea
              value={comment}
              onChange={e => setComment(e.target.value)}
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
              allDone
                ? 'bg-ink text-bg hover:bg-ink-soft'
                : 'border border-ink text-ink hover:bg-bg-hover',
              submitting && 'opacity-50 cursor-not-allowed'
            )}
          >
            <Send className="w-4 h-4" />
            {submitting ? 'Enviando…' : allDone ? 'Enviar checklist' : `Enviar (${doneCount}/${totalCount})`}
          </button>
        </div>
      </div>
    </div>
  )
}

function TaskRow({ task, onToggle }: { task: TaskWithCheck; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      className={cn(
        'w-full flex items-baseline gap-2 py-3 px-3',
        'rounded-lg border transition-colors min-h-[52px]',
        'focus-visible:outline-2 focus-visible:outline-ink focus-visible:outline-offset-2',
        task.checked
          ? 'bg-bg-card border-rule-soft'
          : 'bg-bg border-rule-soft hover:bg-bg-hover hover:border-rule'
      )}
    >
      {/* Checkbox */}
      <span
        className={cn(
          'w-4 h-4 rounded-sm border-[1.5px] flex-shrink-0 self-center',
          'flex items-center justify-center transition-colors',
          task.checked
            ? 'bg-ink border-ink'
            : 'border-rule'
        )}
        aria-hidden
      >
        {task.checked && (
          <svg width="9" height="7" viewBox="0 0 9 7" fill="none">
            <path d="M1 3.5L3.5 6L8 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-bg" />
          </svg>
        )}
      </span>

      {/* Leader dot + text */}
      <span className="text-ink text-sm text-left shrink-0">{task.text}</span>
      <span
        className="flex-1 min-w-[0.5rem] border-b-[1.5px] border-dotted border-dot -translate-y-1 opacity-55"
        aria-hidden
      />

      {task.checked && (
        <span className="text-ink-muted text-xs shrink-0 self-center">✓</span>
      )}
    </button>
  )
}
