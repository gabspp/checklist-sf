import { Store } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import type { Store as StoreType } from '@/lib/types'

interface StoreStepProps {
  stores: StoreType[]
  loading: boolean
  onSelect: (store: StoreType) => void
}

export default function StoreStep({ stores, loading, onSelect }: StoreStepProps) {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-bg flex flex-col">
      <div className="flex-1 flex flex-col items-center justify-center px-5 py-12">
        <div className="w-full max-w-sm">
          {/* Header */}
          <div className="mb-8 text-center">
            <h1 className="font-serif text-2xl text-ink mb-1">Santo Favo</h1>
            <p className="text-sm text-ink-muted">Checklists</p>
          </div>

          {/* Store buttons */}
          <div className="space-y-3">
            {loading ? (
              <div className="space-y-3">
                {[1, 2].map(i => (
                  <div key={i} className="h-16 rounded-lg bg-bg-soft animate-pulse" />
                ))}
              </div>
            ) : (
              stores.map(store => (
                <button
                  key={store.id}
                  onClick={() => onSelect(store)}
                  className="
                    w-full h-16 px-5
                    flex items-center gap-3
                    bg-bg-card border border-rule-soft rounded-lg
                    text-ink font-medium text-base
                    hover:bg-bg-hover hover:border-rule
                    transition-colors
                    focus-visible:outline-2 focus-visible:outline-ink focus-visible:outline-offset-2
                  "
                >
                  <Store className="w-4 h-4 text-ink-muted flex-shrink-0" />
                  <span>Loja {store.name}</span>
                </button>
              ))
            )}
          </div>

          {/* Admin link */}
          <div className="mt-10 text-center">
            <button
              onClick={() => navigate('/admin')}
              className="text-xs text-ink-muted hover:text-ink transition-colors"
            >
              Área administrativa
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
