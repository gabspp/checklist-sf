import { cn } from '@/lib/utils'

interface StageProps {
  children: React.ReactNode
  className?: string
  narrow?: boolean
}

export default function Stage({ children, className, narrow = false }: StageProps) {
  return (
    <main
      className={cn(
        'mx-auto px-5 pt-8 pb-16',
        narrow ? 'max-w-[480px]' : 'max-w-[760px]',
        className
      )}
    >
      {children}
    </main>
  )
}

interface SectionHeadProps {
  title: string
  count?: number | string
  actions?: React.ReactNode
}

export function SectionHead({ title, count, actions }: SectionHeadProps) {
  return (
    <header className="flex items-baseline justify-between gap-3 pb-1.5 mb-3 border-b border-rule">
      <h3 className="font-sans font-semibold text-[0.74rem] uppercase tracking-widest text-ink-soft">
        {title}
      </h3>
      <div className="flex items-center gap-2">
        {count !== undefined && (
          <span className="text-xs text-ink-muted">{count}</span>
        )}
        {actions}
      </div>
    </header>
  )
}
