import { ChevronLeft } from 'lucide-react'
import { cn } from '@/lib/utils'

interface BreadcrumbItem {
  label: string
  onClick?: () => void
}

interface TopbarProps {
  breadcrumbs?: BreadcrumbItem[]
  actions?: React.ReactNode
  className?: string
}

export default function Topbar({ breadcrumbs = [], actions, className }: TopbarProps) {
  return (
    <header
      className={cn(
        'sticky top-0 z-50 px-5 py-3',
        'bg-bg/90 backdrop-blur-md border-b border-rule-soft',
        className
      )}
    >
      <div className="max-w-[1040px] mx-auto flex items-center justify-between gap-4">
        <nav className="flex items-center gap-1 min-w-0">
          {breadcrumbs.map((crumb, i) => (
            <span key={i} className="flex items-center gap-1 min-w-0">
              {i > 0 && (
                <ChevronLeft className="w-3 h-3 text-ink-muted flex-shrink-0 rotate-180" />
              )}
              {crumb.onClick ? (
                <button
                  onClick={crumb.onClick}
                  className="text-sm text-ink-muted hover:text-ink transition-colors truncate focus-visible:outline-2 focus-visible:outline-ink focus-visible:outline-offset-2 rounded"
                >
                  {crumb.label}
                </button>
              ) : (
                <span className="text-sm text-ink font-medium truncate">{crumb.label}</span>
              )}
            </span>
          ))}
        </nav>
        {actions && <div className="flex items-center gap-2 flex-shrink-0">{actions}</div>}
      </div>
    </header>
  )
}

interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode
}

export function IconButton({ children, className, ...props }: IconButtonProps) {
  return (
    <button
      className={cn(
        'w-[34px] h-[34px] rounded-md',
        'inline-flex items-center justify-center',
        'text-ink-soft hover:text-ink hover:bg-bg-hover',
        'transition-colors',
        'focus-visible:outline-2 focus-visible:outline-ink focus-visible:outline-offset-2',
        className
      )}
      {...props}
    >
      {children}
    </button>
  )
}
