import { useState, useEffect } from 'react'
import { Plus, ChevronUp, ChevronDown, Printer, Check, X, Copy } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { cn } from '@/lib/utils'
import Stage, { SectionHead } from '@/components/layout/Stage'
import Topbar from '@/components/layout/Topbar'
import type { Store, ChkList } from '@/lib/types'

export default function ListsPage() {
  const navigate = useNavigate()
  const [stores, setStores] = useState<Store[]>([])
  const [lists, setLists] = useState<ChkList[]>([])
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
      .from('chk_lists')
      .select('*')
      .eq('store_id', selectedStore)
      .order('sort_order')
      .then(({ data }) => {
        setLists(data ?? [])
        setLoading(false)
      })
  }, [selectedStore])

  async function addList() {
    if (!newName.trim() || !selectedStore) return
    setAdding(true)
    const maxOrder = lists.length > 0 ? Math.max(...lists.map(l => l.sort_order)) + 1 : 0
    const { data } = await supabase
      .from('chk_lists')
      .insert({ store_id: selectedStore, name: newName.trim(), sort_order: maxOrder })
      .select()
      .single()
    if (data) setLists(prev => [...prev, data])
    setNewName('')
    setAdding(false)
  }

  async function saveEdit(id: string) {
    if (!editName.trim()) return
    await supabase.from('chk_lists').update({ name: editName.trim() }).eq('id', id)
    setLists(prev => prev.map(l => l.id === id ? { ...l, name: editName.trim() } : l))
    setEditingId(null)
  }

  async function toggleActive(list: ChkList) {
    await supabase.from('chk_lists').update({ active: !list.active }).eq('id', list.id)
    setLists(prev => prev.map(l => l.id === list.id ? { ...l, active: !l.active } : l))
  }

  async function moveList(index: number, direction: 'up' | 'down') {
    const newLists = [...lists]
    const swapIndex = direction === 'up' ? index - 1 : index + 1
    if (swapIndex < 0 || swapIndex >= newLists.length) return
    ;[newLists[index], newLists[swapIndex]] = [newLists[swapIndex], newLists[index]]
    setLists(newLists.map((l, i) => ({ ...l, sort_order: i })))
    for (let i = 0; i < newLists.length; i++) {
      await supabase.from('chk_lists').update({ sort_order: i }).eq('id', newLists[i].id)
    }
  }

  async function duplicateList(list: ChkList, toStoreId: string) {
    // Create new list in target store
    const maxOrder = 999
    const { data: newList } = await supabase
      .from('chk_lists')
      .insert({ store_id: toStoreId, name: list.name, sort_order: maxOrder })
      .select()
      .single()

    if (!newList) return

    // Copy tasks
    const { data: tasks } = await supabase
      .from('chk_tasks')
      .select('*')
      .eq('list_id', list.id)
      .order('sort_order')

    if (tasks && tasks.length > 0) {
      await supabase.from('chk_tasks').insert(
        tasks.map(t => ({
          list_id: newList.id,
          text: t.text,
          active: t.active,
          sort_order: t.sort_order,
          day_of_week: t.day_of_week,
        }))
      )
    }

    setDuplicatingId(null)

    // If duplicating to the current store, refresh list
    if (toStoreId === selectedStore) {
      setLists(prev => [...prev, newList])
    }
  }

  const storeName = stores.find(s => s.id === selectedStore)?.name ?? ''
  const otherStores = stores.filter(s => s.id !== selectedStore)

  return (
    <div className="flex flex-col h-full">
      <Topbar breadcrumbs={[{ label: 'Listas' }]} />

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
          <SectionHead title={`Adicionar lista — Loja ${storeName}`} />
          <div className="flex gap-2 mt-2">
            <input
              type="text"
              value={newName}
              onChange={e => setNewName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addList()}
              placeholder="Ex: Abertura, Fechamento, Conferência"
              className="
                flex-1 bg-transparent
                border-0 border-b border-rule-soft focus:border-ink
                py-1.5 text-ink placeholder:text-ink-muted text-sm
                outline-none transition-colors
              "
            />
            <button
              onClick={addList}
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

        {/* Lists */}
        <div>
          <SectionHead title="Listas" count={`${lists.filter(l => l.active).length} ativas`} />
          {loading ? (
            <div className="space-y-2 mt-3">
              {[1, 2].map(i => <div key={i} className="h-11 rounded-lg bg-bg-soft animate-pulse" />)}
            </div>
          ) : lists.length === 0 ? (
            <p className="text-sm text-ink-muted py-4">Nenhuma lista ainda.</p>
          ) : (
            <ul className="mt-1">
              {lists.map((list, i) => (
                <li key={list.id} className="border-b border-rule-soft last:border-0">
                  <div className="flex items-center gap-2 py-2">
                    {/* Reorder */}
                    <div className="flex flex-col">
                      <button onClick={() => moveList(i, 'up')} disabled={i === 0} className="w-5 h-4 flex items-center justify-center text-ink-muted hover:text-ink disabled:opacity-20 transition-colors">
                        <ChevronUp className="w-3 h-3" />
                      </button>
                      <button onClick={() => moveList(i, 'down')} disabled={i === lists.length - 1} className="w-5 h-4 flex items-center justify-center text-ink-muted hover:text-ink disabled:opacity-20 transition-colors">
                        <ChevronDown className="w-3 h-3" />
                      </button>
                    </div>

                    {/* Name */}
                    {editingId === list.id ? (
                      <input
                        autoFocus
                        value={editName}
                        onChange={e => setEditName(e.target.value)}
                        onKeyDown={e => {
                          if (e.key === 'Enter') saveEdit(list.id)
                          if (e.key === 'Escape') setEditingId(null)
                        }}
                        className="flex-1 bg-transparent border-0 border-b border-ink py-0.5 text-ink text-sm outline-none"
                      />
                    ) : (
                      <button
                        onClick={() => navigate(`/admin/lists/${list.id}`)}
                        className={cn(
                          'flex-1 text-sm text-left transition-colors hover:text-ink-soft',
                          list.active ? 'text-ink' : 'text-ink-muted line-through'
                        )}
                      >
                        {list.name}
                      </button>
                    )}

                    {editingId === list.id ? (
                      <>
                        <button onClick={() => saveEdit(list.id)} className="w-7 h-7 rounded-md flex items-center justify-center text-ink hover:bg-bg-hover transition-colors">
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
                          onClick={() => { setEditingId(list.id); setEditName(list.name) }}
                          className="w-7 h-7 rounded-md flex items-center justify-center text-ink-muted hover:text-ink hover:bg-bg-hover transition-colors"
                          title="Renomear"
                        >
                          ✎
                        </button>

                        {/* Duplicate */}
                        {otherStores.length > 0 && (
                          <button
                            onClick={() => { setDuplicatingId(list.id); setTargetStoreId(otherStores[0].id) }}
                            className="w-7 h-7 rounded-md flex items-center justify-center text-ink-muted hover:text-ink hover:bg-bg-hover transition-colors"
                            title="Duplicar para outra loja"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                        )}

                        {/* Print */}
                        <button
                          onClick={() => window.open(`/lists/${list.id}/print`, '_blank')}
                          className="w-7 h-7 rounded-md flex items-center justify-center text-ink-muted hover:text-ink hover:bg-bg-hover transition-colors"
                          title="Imprimir"
                        >
                          <Printer className="w-3.5 h-3.5" />
                        </button>

                        {/* Active toggle */}
                        <button
                          onClick={() => toggleActive(list)}
                          className={cn(
                            'text-xs px-2 py-0.5 rounded-md border transition-colors',
                            list.active
                              ? 'border-rule-soft text-ink-muted hover:border-rule hover:text-ink'
                              : 'border-brand-rosa/30 text-brand-rosa hover:border-brand-rosa'
                          )}
                        >
                          {list.active ? 'ativa' : 'inativa'}
                        </button>
                      </>
                    )}
                  </div>

                  {/* Duplicate panel */}
                  {duplicatingId === list.id && (
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
                        onClick={() => duplicateList(list, targetStoreId)}
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
