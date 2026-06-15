import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'

export default function AdminLoginPage() {
  const navigate = useNavigate()
  const { session, loading, signIn } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!loading && session) {
      navigate('/admin/reports', { replace: true })
    }
  }, [session, loading, navigate])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    const err = await signIn(email, password)
    if (err) {
      setError('Email ou senha incorretos.')
    }
    setSubmitting(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <span className="text-sm text-ink-muted">Carregando…</span>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-bg flex flex-col items-center justify-center px-5">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="font-serif text-2xl text-ink mb-1">Santo Favo</h1>
          <p className="text-sm text-ink-muted">Área administrativa</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[0.74rem] font-semibold uppercase tracking-widest text-ink-soft mb-2">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              autoComplete="email"
              className="
                w-full bg-transparent
                border-0 border-b border-rule-soft focus:border-ink
                py-1.5 text-ink placeholder:text-ink-muted text-sm
                outline-none transition-colors
              "
            />
          </div>

          <div>
            <label className="block text-[0.74rem] font-semibold uppercase tracking-widest text-ink-soft mb-2">
              Senha
            </label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              className="
                w-full bg-transparent
                border-0 border-b border-rule-soft focus:border-ink
                py-1.5 text-ink placeholder:text-ink-muted text-sm
                outline-none transition-colors
              "
            />
          </div>

          {error && (
            <p className="text-sm text-brand-rosa">{error}</p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="
              w-full h-11 mt-2 rounded-pill
              bg-ink text-bg
              text-xs font-medium uppercase tracking-wider
              hover:bg-ink-soft transition-colors
              disabled:opacity-50 disabled:cursor-not-allowed
              focus-visible:outline-2 focus-visible:outline-ink focus-visible:outline-offset-2
            "
          >
            {submitting ? 'Entrando…' : 'Entrar'}
          </button>
        </form>

        <div className="mt-8 text-center">
          <a
            href="/"
            className="text-xs text-ink-muted hover:text-ink transition-colors"
          >
            ← Voltar para os checklists
          </a>
        </div>
      </div>
    </div>
  )
}
