import { useState, useEffect } from 'react'
import { Plus, ChevronUp, ChevronDown, Printer, Check, X, Copy } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { cn } from '@/lib/utils'
import Stage, { SectionHead } from '@/components/layout/Stage'
import Topbar from '@/components/layout/Topbar'
import type { Store, FrmForm } from '@/lib/types'

export default function FormsPage() {
  const navigate = useNavigate()
  const [stores, setStores] = useState<Store[]>([])
  const [forms, setForms] = useState<FrmForm[]>([])
  const [selectedStore, setSelectedStore] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [newName, setNewName] = useState('')
  const [adding, setAdding] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [duplicatingId, setDuplicatingId] = useState<string | null>(null)
  const [targetStoreId, setTargetStoreId] = useState<string>('')

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
      .from('frm_forms')
      .select('*')
      .eq('store_id', selectedStore)
      .order('sort_order')
      .then(({ data }) => {
        setForms(data ?? [])
        setLoading(false)
      })
  }, [selectedStore])

  async function addForm() {
    if (!newName.trim() || !selectedStore) return
    setAdding(true)
    const maxOrder = forms.length > 0 ? Math.max(...forms.map(f => f.sort_order)) + 1 : 0
    const { data } = await supabase
      .from('frm_forms')
      .insert({ store_id: selectedStore, name: newName.trim(), sort_order: maxOrder })
      .select()
      .single()
    if (data) setForms(prev => [...prev, data])
    setNewName('')
    setAdding(false)
  }

  async function saveEdit(id: string) {
    if (!editName.trim()) return
    await supabase.from('frm_forms').update({ name: editName.trim() }).eq('id', id)
    setForms(prev => prev.map(f => f.id === id ? { ...f, name: editName.trim() } : f))
    setEditingId(null)
  }

  async function toggleActive(form: FrmForm) {
    await supabase.from('frm_forms').update({ active: !form.active }).eq('id', form.id)
    setForms(prev => prev.map(f => f.id === form.id ? { ...f, active: !f.active } : f))
  }

  async function moveForm(index: number, direction: 'up' | 'down') {
    const newForms = [...forms]
    const swapIndex = direction === 'up' ? index - 1 : index + 1
    if (swapIndex < 0 || swapIndex >= newForms.length) return
    ;[newForms[index], newForms[swapIndex]] = [newForms[swapIndex], newForms[index]]
    setForms(newForms.map((f, i) => ({ ...f, sort_order: i })))
    for (let i = 0; i < newForms.length; i++) {
      await supabase.from('frm_forms').update({ sort_order: i }).eq('id', newForms[i].id)
    }
  }

  async function duplicateForm(form: FrmForm, toStoreId: string) {
    const { data: newForm } = await supabase
      .from('frm_forms')
      .insert({ store_id: toStoreId, name: form.name, sort_order: 999 })
      .select()
      .single()

    if (!newForm) return

    const { data: sectionRows } = await supabase
      .from('frm_sections')
      .select('*')
      .eq('form_id', form.id)
      .order('sort_order')

    for (const section of sectionRows ?? []) {
      const { data: newSection } = await supabase
        .from('frm_sections')
        .insert({ form_id: newForm.id, name: section.name, active: section.active, sort_order: section.sort_order })
        .select()
        .single()

      if (!newSection) continue

      const { data: itemRows } = await supabase
        .from('frm_items')
        .select('*')
        .eq('section_id', section.id)
        .order('sort_order')

      if (itemRows && itemRows.length > 0) {
        await supabase.from('frm_items').insert(
          itemRows.map(i => ({
            section_id: newSection.id,
            name: i.name,
            active: i.active,
            sort_order: i.sort_order,
          }))
        )
      }
    }

    setDuplicatingId(null)

    if (toStoreId === selectedStore) {
      setForms(prev => [...prev, newForm])
    }
  }

  const storeName = stores.find(s => s.id === selectedStore)?.name ?? ''
  const otherStores = stores.filter(s => s.id !== selectedStore)

  return (
    <div className="flex flex-col h-full">
      <Topbar breadcrumbs={[{ label: 'Formulários' }]} />

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
          <SectionHead title={`Adicionar formulário — Loja ${storeName}`} />
          <div className="flex gap-2 mt-2">
            <input
              type="text"
              value={newName}
              onChange={e => setNewName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addForm()}
              placeholder="Ex: Estoque Produtos de Limpeza"
              className="
                flex-1 bg-transparent
                border-0 border-b border-rule-soft focus:border-ink
                py-1.5 text-ink placeholder:text-ink-muted text-sm
                outline-none transition-colors
              "
            />
            <button
              onClick={addForm}
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

        {/* Forms */}
        <div>
          <SectionHead title="Formulários" count={`${forms.filter(f => f.active).length} ativos`} />
          {loading ? (
            <div className="space-y-2 mt-3">
              {[1, 2].map(i => <div key={i} className="h-11 rounded-lg bg-bg-soft animate-pulse" />)}
            </div>
          ) : forms.length === 0 ? (
            <p className="text-sm text-ink-muted py-4">Nenhum formulário ainda.</p>
          ) : (
            <ul className="mt-1">
              {forms.map((form, i) => (
                <li key={form.id} className="border-b border-rule-soft last:border-0">
                  <div className="flex items-center gap-2 py-2">
                    {/* Reorder */}
                    <div className="flex flex-col">
                      <button onClick={() => moveForm(i, 'up')} disabled={i === 0} className="w-5 h-4 flex items-center justify-center text-ink-muted hover:text-ink disabled:opacity-20 transition-colors">
                        <ChevronUp className="w-3 h-3" />
                      </button>
                      <button onClick={() => moveForm(i, 'down')} disabled={i === forms.length - 1} className="w-5 h-4 flex items-center justify-center text-ink-muted hover:text-ink disabled:opacity-20 transition-colors">
                        <ChevronDown className="w-3 h-3" />
                      </button>
                    </div>

                    {/* Name */}
                    {editingId === form.id ? (
                      <input
                        autoFocus
                        value={editName}
                        onChange={e => setEditName(e.target.value)}
                        onKeyDown={e => {
                          if (e.key === 'Enter') saveEdit(form.id)
                          if (e.key === 'Escape') setEditingId(null)
                        }}
                        className="flex-1 bg-transparent border-0 border-b border-ink py-0.5 text-ink text-sm outline-none"
                      />
                    ) : (
                      <button
                        onClick={() => navigate(`/admin/forms/${form.id}`)}
                        className={cn(
                          'flex-1 text-sm text-left transition-colors hover:text-ink-soft',
                          form.active ? 'text-ink' : 'text-ink-muted line-through'
                        )}
                      >
                        {form.name}
                      </button>
                    )}

                    {editingId === form.id ? (
                      <>
                        <button onClick={() => saveEdit(form.id)} className="w-7 h-7 rounded-md flex items-center justify-center text-ink hover:bg-bg-hover transition-colors">
                          <Check className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => setEditingId(null)} className="w-7 h-7 rounded-md flex items-center justify-center text-ink-muted hover:bg-bg-hover transition-colors">
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </>
                    ) : (
                      <>
                        {/* Edit name */}
                        <button
                          onClick={() => { setEditingId(form.id); setEditName(form.name) }}
                          className="w-7 h-7 rounded-md flex items-center justify-center text-ink-muted hover:text-ink hover:bg-bg-hover transition-colors"
                          title="Renomear"
                        >
                          ✎
                        </button>

                        {/* Duplicate */}
                        {otherStores.length > 0 && (
                          <button
                            onClick={() => { setDuplicatingId(form.id); setTargetStoreId(otherStores[0].id) }}
                            className="w-7 h-7 rounded-md flex items-center justify-center text-ink-muted hover:text-ink hover:bg-bg-hover transition-colors"
                            title="Duplicar para outra loja"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                        )}

                        {/* Print */}
                        <button
                          onClick={() => window.open(`/forms/${form.id}/print`, '_blank')}
                          className="w-7 h-7 rounded-md flex items-center justify-center text-ink-muted hover:text-ink hover:bg-bg-hover transition-colors"
                          title="Imprimir"
                        >
                          <Printer className="w-3.5 h-3.5" />
                        </button>

                        {/* Active toggle */}
                        <button
                          onClick={() => toggleActive(form)}
                          className={cn(
                            'text-xs px-2 py-0.5 rounded-md border transition-colors',
                            form.active
                              ? 'border-rule-soft text-ink-muted hover:border-rule hover:text-ink'
                              : 'border-brand-rosa/30 text-brand-rosa hover:border-brand-rosa'
                          )}
                        >
                          {form.active ? 'ativo' : 'inativo'}
                        </button>
                      </>
                    )}
                  </div>

                  {/* Duplicate panel */}
                  {duplicatingId === form.id && (
                    <div className="flex items-center gap-3 pb-3 pl-7">
                      <span className="text-xs text-ink-muted">Duplicar para:</span>
                      <select
                        value={targetStoreId}
                        onChange={e => setTargetStoreId(e.target.value)}
                        className="text-xs bg-bg-card border border-rule-soft rounded-md px-2 py-1 text-ink outline-none"
                      >
                        {otherStores.map(s => (
                          <option key={s.id} value={s.id}>Loja {s.name}</option>
                        ))}
                      </select>
                      <button
                        onClick={() => duplicateForm(form, targetStoreId)}
                        className="text-xs px-3 py-1 rounded-md bg-ink text-bg hover:bg-ink-soft transition-colors"
                      >
                        Duplicar
                      </button>
                      <button
                        onClick={() => setDuplicatingId(null)}
                        className="text-xs text-ink-muted hover:text-ink transition-colors"
                      >
                        Cancelar
                      </button>
                    </div>
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
