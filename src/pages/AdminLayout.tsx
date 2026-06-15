import { useEffect } from 'react'
import { Outlet, useNavigate, useLocation, Link } from 'react-router-dom'
import { Users, ClipboardList, BarChart2, Settings, LogOut, Store } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { cn } from '@/lib/utils'

const navItems = [
  { to: '/admin/reports', icon: BarChart2, label: 'Relatórios' },
  { to: '/admin/lists', icon: ClipboardList, label: 'Listas' },
  { to: '/admin/employees', icon: Users, label: 'Colaboradores' },
  { to: '/admin/settings', icon: Settings, label: 'Configurações' },
]

export default function AdminLayout() {
  const navigate = useNavigate()
  const location = useLocation()
  const { session, loading, signOut } = useAuth()

  useEffect(() => {
    if (!loading && !session) {
      navigate('/admin/login', { replace: true })
    }
  }, [session, loading, navigate])

  if (loading) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <span className="text-sm text-ink-muted">Carregando…</span>
      </div>
    )
  }

  if (!session) return null

  return (
    <div className="min-h-screen bg-bg flex flex-col">
      {/* Topbar */}
      <header className="sticky top-0 z-50 px-5 py-3 bg-bg/90 backdrop-blur-md border-b border-rule-soft">
        <div className="max-w-[1040px] mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Store className="w-4 h-4 text-ink-muted" />
            <span className="text-sm font-medium text-ink">Santo Favo — Admin</span>
          </div>

          <div className="flex items-center gap-1">
            <Link
              to="/"
              className="px-3 h-8 rounded-md flex items-center text-xs text-ink-muted hover:text-ink hover:bg-bg-hover transition-colors"
            >
              Checklists
            </Link>
            <button
              onClick={signOut}
              className="w-8 h-8 rounded-md flex items-center justify-center text-ink-muted hover:text-ink hover:bg-bg-hover transition-colors"
              aria-label="Sair"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      <div className="flex-1 flex">
        {/* Sidebar nav */}
        <nav className="w-44 flex-shrink-0 border-r border-rule-soft pt-6 px-3">
          <ul className="space-y-0.5">
            {navItems.map(item => {
              const active = location.pathname.startsWith(item.to)
              return (
                <li key={item.to}>
                  <Link
                    to={item.to}
                    className={cn(
                      'flex items-center gap-2.5 px-3 py-2 rounded-md',
                      'text-sm transition-colors',
                      active
                        ? 'bg-bg-soft text-ink font-medium'
                        : 'text-ink-soft hover:text-ink hover:bg-bg-hover'
                    )}
                  >
                    <item.icon className="w-4 h-4 flex-shrink-0" />
                    {item.label}
                  </Link>
                </li>
              )
            })}
          </ul>
        </nav>

        {/* Page content */}
        <div className="flex-1 min-w-0">
          <Outlet />
        </div>
      </div>
    </div>
  )
}
