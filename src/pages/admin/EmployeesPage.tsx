import { useState, useEffect } from 'react'
import { Plus, ChevronUp, ChevronDown, Check, X } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { cn } from '@/lib/utils'
import Stage, { SectionHead } from '@/components/layout/Stage'
import Topbar from '@/components/layout/Topbar'
import type { Store, ChkEmployee } from '@/lib/types'

export default function EmployeesPage() {
  const [stores, setStores] = useState<Store[]>([])
  const [employees, setEmployees] = useState<ChkEmployee[]>([])
  const [selectedStore, setSelectedStore] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [newName, setNewName] = useState('')
  const [adding, setAdding] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')

  useEffect(() => {
    supabase.from('stores').select('id, name').order('name').then(({ data }) => {
      const list = data ?? []
      setStores(list)
      if (list.length > 0) setSelectedStore(list[0].id)
    })
  }, [])

  useEffect(() => {
    if (!selectedStore) return
    setLoading(true)
    supabase
      .from('chk_employees')
      .select('*')
      .eq('store_id', selectedStore)
      .order('sort_order')
      .then(({ data }) => {
        setEmployees(data ?? [])
        setLoading(false)
      })
  }, [selectedStore])

  async function addEmployee() {
    if (!newName.trim() || !selectedStore) return
    setAdding(true)
    const maxOrder = employees.length > 0 ? Math.max(...employees.map(e => e.sort_order)) + 1 : 0
    const { data } = await supabase
      .from('chk_employees')
      .insert({ store_id: selectedStore, name: newName.trim(), sort_order: maxOrder })
      .select()
      .single()
    if (data) setEmployees(prev => [...prev, data])
    setNewName('')
    setAdding(false)
  }

  async function toggleActive(emp: ChkEmployee) {
    await supabase.from('chk_employees').update({ active: !emp.active }).eq('id', emp.id)
    setEmployees(prev => prev.map(e => e.id === emp.id ? { ...e, active: !e.active } : e))
  }

  async function saveEdit(id: string) {
    if (!editName.trim()) return
    await supabase.from('chk_employees').update({ name: editName.trim() }).eq('id', id)
    setEmployees(prev => prev.map(e => e.id === id ? { ...e, name: editName.trim() } : e))
    setEditingId(null)
  }

  async function moveEmployee(index: number, direction: 'up' | 'down') {
    const newEmps = [...employees]
    const swapIndex = direction === 'up' ? index - 1 : index + 1
    if (swapIndex < 0 || swapIndex >= newEmps.length) return
    ;[newEmps[index], newEmps[swapIndex]] = [newEmps[swapIndex], newEmps[index]]
    const updates = newEmps.map((e, i) => ({ id: e.id, sort_order: i }))
    setEmployees(newEmps.map((e, i) => ({ ...e, sort_order: i })))
    for (const u of updates) {
      await supabase.from('chk_employees').update({ sort_order: u.sort_order }).eq('id', u.id)
    }
  }

  const storeName = stores.find(s => s.id === selectedStore)?.name ?? ''

  return (
    <div className="flex flex-col h-full">
      <Topbar breadcrumbs={[{ label: 'Colaboradores' }]} />

      <Stage>
        {/* Store selector */}
        <div className="flex gap-1 mb-8 p-1 rounded-pill border border-rule-soft bg-bg-card w-fit">
          {stores.map(s => (
            <button
              key={s.id}
              onClick={() => setSelectedStore(s.id)}
              className={cn(
                'px-4 py-1.5 rounded-md text-sm font-medium transition-colors',
                selectedStore === s.id ? 'bg-ink text-bg' : 'text-ink-muted hover:text-ink'
              )}
            >
              Loja {s.name}
            </button>
          ))}
        </div>

        {/* Add form */}
        <div className="mb-6 p-3.5 bg-bg-card border border-rule-soft rounded-lg">
          <SectionHead title={`Adicionar colaborador — Loja ${storeName}`} />
          <div className="flex gap-2 mt-2">
            <input
              type="text"
              value={newName}
              onChange={e => setNewName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addEmployee()}
              placeholder="Nome do colaborador"
              className="
                flex-1 bg-transparent
                border-0 border-b border-rule-soft focus:border-ink
                py-1.5 text-ink placeholder:text-ink-muted text-sm
                outline-none transition-colors
              "
            />
            <button
              onClick={addEmployee}
              disabled={adding || !newName.trim()}
              className="
                w-8 h-8 rounded-md flex items-center justify-center
                bg-ink text-bg hover:bg-ink-soft
                disabled:opacity-40 disabled:cursor-not-allowed
                transition-colors flex-shrink-0
              "
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Employee list */}
        <div>
          <SectionHead title="Lista" count={`${employees.filter(e => e.active).length} ativos`} />
          {loading ? (
            <div className="space-y-2 mt-3">
              {[1, 2, 3].map(i => <div key={i} className="h-11 rounded-lg bg-bg-soft animate-pulse" />)}
            </div>
          ) : employees.length === 0 ? (
            <p className="text-sm text-ink-muted py-4">Nenhum colaborador ainda.</p>
          ) : (
            <ul className="mt-1">
              {employees.map((emp, i) => (
                <li
                  key={emp.id}
                  className="flex items-center gap-2 py-2 border-b border-rule-soft last:border-0"
                >
                  {/* Reorder */}
                  <div className="flex flex-col">
                    <button
                      onClick={() => moveEmployee(i, 'up')}
                      disabled={i === 0}
                      className="w-5 h-4 flex items-center justify-center text-ink-muted hover:text-ink disabled:opacity-20 transition-colors"
                    >
                      <ChevronUp className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => moveEmployee(i, 'down')}
                      disabled={i === employees.length - 1}
                      className="w-5 h-4 flex items-center justify-center text-ink-muted hover:text-ink disabled:opacity-20 transition-colors"
                    >
                      <ChevronDown className="w-3 h-3" />
                    </button>
                  </div>

                  {/* Name / edit */}
                  {editingId === emp.id ? (
                    <input
                      autoFocus
                      value={editName}
                      onChange={e => setEditName(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter') saveEdit(emp.id)
                        if (e.key === 'Escape') setEditingId(null)
                      }}
                      className="
                        flex-1 bg-transparent
                        border-0 border-b border-ink
                        py-0.5 text-ink text-sm
                        outline-none
                      "
                    />
                  ) : (
                    <button
                      onClick={() => { setEditingId(emp.id); setEditName(emp.name) }}
                      className={cn(
                        'flex-1 text-sm text-left transition-colors',
                        emp.active ? 'text-ink' : 'text-ink-muted line-through'
                      )}
                    >
                      {emp.name}
                    </button>
                  )}

                  {/* Save edit */}
                  {editingId === emp.id && (
                    <>
                      <button onClick={() => saveEdit(emp.id)} className="w-7 h-7 rounded-md flex items-center justify-center text-ink hover:bg-bg-hover transition-colors">
                        <Check className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => setEditingId(null)} className="w-7 h-7 rounded-md flex items-center justify-center text-ink-muted hover:bg-bg-hover transition-colors">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </>
                  )}

                  {/* Active toggle */}
                  {editingId !== emp.id && (
                    <button
                      onClick={() => toggleActive(emp)}
                      className={cn(
                        'text-xs px-2 py-0.5 rounded-md border transition-colors',
                        emp.active
                          ? 'border-rule-soft text-ink-muted hover:border-rule hover:text-ink'
                          : 'border-brand-rosa/30 text-brand-rosa hover:border-brand-rosa'
                      )}
                    >
                      {emp.active ? 'ativo' : 'inativo'}
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </Stage>
    </div>
  )
}
