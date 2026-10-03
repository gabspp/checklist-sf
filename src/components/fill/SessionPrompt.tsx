import { ChevronLeft } from 'lucide-react'
import type { ExistingSession } from '@/hooks/useFillSession'
import { joinNames } from '@/hooks/useFillSession'
import Topbar from '@/components/layout/Topbar'
import Stage from '@/components/layout/Stage'

function formatWhen(iso: string): string {
  const d = new Date(iso)
  const time = d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  const sameDay = d.toDateString() === new Date().toDateString()
  if (sameDay) return time
  return `${d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })} às ${time}`
}

interface SessionPromptProps {
  noun: 'lista' | 'contagem'
  existing: ExistingSession
  onlineNames: string[]
  meName: string
  busy: boolean
  breadcrumbs: { label: string; onClick?: () => void }[]
  onContinue: () => void
  onStartFresh: () => void
}

// Aviso ao abrir uma lista/formulário que outra pessoa já começou
export function SessionPrompt({
  noun,
  existing,
  onlineNames,
  meName,
  busy,
  breadcrumbs,
  onContinue,
  onStartFresh,
}: SessionPromptProps) {
  const others = onlineNames.filter(n => n !== meName)
  const participants = existing.participantNames
  const title = noun === 'lista' ? 'Lista em andamento' : 'Contagem em andamento'

  return (
    <div className="flex flex-col h-full">
      <Topbar breadcrumbs={breadcrumbs} />
      <Stage>
        <div className="py-6">
          <p className="text-[0.74rem] font-semibold uppercase tracking-widest text-ink-soft mb-5">
            {title}
          </p>

          <p className="text-base text-ink mb-1">
            <span className="font-medium">{existing.startedByName}</span> começou às {formatWhen(existing.startedAt)}.
          </p>

          {participants.length > 1 && (
            <p className="text-sm text-ink-soft mb-1">
              Participam: {joinNames(participants)}.
            </p>
          )}

          {others.length > 0 ? (
            <p className="text-sm text-ink-soft mb-1">
              Agora: {joinNames(others)} {others.length === 1 ? 'está' : 'estão'} aqui.
            </p>
          ) : existing.lastActivityAt ? (
            <p className="text-sm text-ink-muted mb-1">
              Última alteração às {formatWhen(existing.lastActivityAt)}.
            </p>
          ) : null}

          <p className="text-sm text-ink-muted mb-8">Deseja continuar?</p>

          <div className="flex flex-col gap-3 max-w-xs">
            <button
              onClick={onContinue}
              disabled={busy}
              className="h-12 rounded-lg bg-ink text-bg text-sm font-medium hover:bg-ink-soft transition-colors disabled:opacity-50"
            >
              Continuar
            </button>
            <button
              onClick={onStartFresh}
              disabled={busy}
              className="h-12 rounded-lg border border-rule-soft text-ink-soft text-sm hover:bg-bg-soft transition-colors disabled:opacity-50"
            >
              Começar do zero
            </button>
            <p className="text-xs text-ink-muted">
              Começar do zero descarta o que já foi marcado até agora.
            </p>
          </div>
        </div>
      </Stage>
    </div>
  )
}

interface SessionClosedProps {
  noun: 'lista' | 'contagem'
  reason: 'submitted' | 'discarded' | 'expired'
  breadcrumbs: { label: string; onClick?: () => void }[]
  onBack: () => void
}

// Mostrado quando a sessão foi enviada, reiniciada ou expirou enquanto esta tela estava aberta
export function SessionClosed({ noun, reason, breadcrumbs, onBack }: SessionClosedProps) {
  const message = reason === 'submitted'
    ? `Essa ${noun} já foi enviada por outra pessoa.`
    : reason === 'expired'
      ? `Essa ${noun} expirou no fim do dia. Volte e comece uma nova.`
      : `Essa ${noun} foi reiniciada por outra pessoa.`

  return (
    <div className="flex flex-col h-full">
      <Topbar breadcrumbs={breadcrumbs} />
      <Stage>
        <div className="py-6">
          <p className="text-base text-ink mb-8">{message}</p>
          <button
            onClick={onBack}
            className="h-12 px-6 rounded-lg border border-rule-soft text-ink-soft text-sm hover:bg-bg-soft transition-colors flex items-center gap-2"
          >
            <ChevronLeft className="w-4 h-4" />
            Voltar
          </button>
        </div>
      </Stage>
    </div>
  )
}
