import { useState, useEffect } from 'react'
import { Plus, ChevronUp, ChevronDown, Trash2, Check, X } from 'lucide-react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { cn } from '@/lib/utils'
import Stage, { SectionHead } from '@/components/layout/Stage'
import Topbar from '@/components/layout/Topbar'
import type { ChkList, ChkTask } from '@/lib/types'

const DAYS = [
  { key: null, label: 'Toda semana' },
  { key: 'segunda-feira', label: 'Segunda' },
  { key: 'terça-feira', label: 'Terça' },
  { key: 'quarta-feira', label: 'Quarta' },
  { key: 'quinta-feira', label: 'Quinta' },
  { key: 'sexta-feira', label: 'Sexta' },
  { key: 'sábado', label: 'Sábado' },
  { key: 'domingo', label: 'Domingo' },
]

export default function TasksPage() {
  const { listId } = useParams<{ listId: string }>()
  const navigate = useNavigate()
  const [list, setList] = useState<ChkList | null>(null)
  const [tasks, setTasks] = useState<ChkTask[]>([])
  const [selectedDay, setSelectedDay] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [newText, setNewText] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editText, setEditText] = useState('')

  useEffect(() => {
    if (!listId) return
    supabase.from('chk_lists').select('*').eq('id', listId).single().then(({ data }) => {
      setList(data)
    })
    loadTasks()
  }, [listId])

  async function loadTasks() {
    if (!listId) return
    setLoading(true)
    const { data } = await supabase
      .from('chk_tasks')
      .select('*')
      .eq('list_id', listId)
      .order('sort_order')
    setTasks(data ?? [])
    setLoading(false)
  }

  const filteredTasks = tasks.filter(t =>
    selectedDay === null ? t.day_of_week === null : t.day_of_week === selectedDay
  )

  async function addTask() {
    if (!newText.trim() || !listId) return
    const sameDayTasks = tasks.filter(t => t.day_of_week === selectedDay)
    const maxOrder = sameDayTasks.length > 0 ? Math.max(...sameDayTasks.map(t => t.sort_order)) + 1 : 0
    const { data } = await supabase
      .from('chk_tasks')
      .insert({ list_id: listId, text: newText.trim(), sort_order: maxOrder, day_of_week: selectedDay })
      .select()
      .single()
    if (data) setTasks(prev => [...prev, data])
    setNewText('')
  }

  async function saveEdit(id: string) {
    if (!editText.trim()) return
    await supabase.from('chk_tasks').update({ text: editText.trim() }).eq('id', id)
    setTasks(prev => prev.map(t => t.id === id ? { ...t, text: editText.trim() } : t))
    setEditingId(null)
  }

  async function deleteTask(id: string) {
    if (!confirm('Remover esta tarefa?')) return
    await supabase.from('chk_tasks').delete().eq('id', id)
    setTasks(prev => prev.filter(t => t.id !== id))
  }

  async function moveTask(index: number, direction: 'up' | 'down') {
    const swapIndex = direction === 'up' ? index - 1 : index + 1
    if (swapIndex < 0 || swapIndex >= filteredTasks.length) return

    const newFiltered = [...filteredTasks]
    ;[newFiltered[index], newFiltered[swapIndex]] = [newFiltered[swapIndex], newFiltered[index]]

    const updates = newFiltered.map((t, i) => ({ id: t.id, sort_order: i }))
    const orderMap = new Map(updates.map(u => [u.id, u.sort_order]))

    setTasks(prev =>
      [...prev.map(t => orderMap.has(t.id) ? { ...t, sort_order: orderMap.get(t.id)! } : t)]
        .sort((a, b) => a.sort_order - b.sort_order)
    )

    for (const u of updates) {
      await supabase.from('chk_tasks').update({ sort_order: u.sort_order }).eq('id', u.id)
    }
  }

  const storeBreadcrumb = list?.store_id ? '' : ''

  return (
    <div className="flex flex-col h-full">
      <Topbar
        breadcrumbs={[
          { label: 'Listas', onClick: () => navigate('/admin/lists') },
          { label: list?.name ?? '…' },
        ]}
      />

      <Stage>
        {/* Day-of-week tabs */}
        <div className="flex gap-1 flex-wrap mb-6 p-1 rounded-lg border border-rule-soft bg-bg-card w-fit">
          {DAYS.map(day => {
            const count = tasks.filter(t => t.day_of_week === day.key).length
            const active = selectedDay === day.key
            return (
              <button
                key={String(day.key)}
                onClick={() => setSelectedDay(day.key)}
                className={cn(
                  'px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors',
                  active ? 'bg-ink text-bg' : 'text-ink-muted hover:text-ink'
                )}
              >
                {day.label}
                {count > 0 && <span className="ml-1 opacity-60">({count})</span>}
              </button>
            )
          })}
        </div>

        {/* Add task form */}
        <div className="mb-6 p-3.5 bg-bg-card border border-rule-soft rounded-lg">
          <SectionHead
            title={`Adicionar — ${DAYS.find(d => d.key === selectedDay)?.label ?? 'Toda semana'}`}
          />
          <div className="flex gap-2 mt-2">
            <input
              type="text"
              value={newText}
              onChange={e => setNewText(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addTask()}
              placeholder="Descrição da tarefa"
              className="
                flex-1 bg-transparent
                border-0 border-b border-rule-soft focus:border-ink
                py-1.5 text-ink placeholder:text-ink-muted text-sm
                outline-none transition-colors
              "
            />
            <button
              onClick={addTask}
              disabled={!newText.trim()}
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

        {/* Task list */}
        <div>
          <SectionHead title="Tarefas" count={filteredTasks.length} />
          {loading ? (
            <div className="space-y-2 mt-3">
              {[1, 2, 3, 4].map(i => <div key={i} className="h-10 rounded-md bg-bg-soft animate-pulse" />)}
            </div>
          ) : filteredTasks.length === 0 ? (
            <p className="text-sm text-ink-muted py-4">
              Nenhuma tarefa para este dia. Adicione acima.
            </p>
          ) : (
            <ul className="mt-1">
              {filteredTasks.map((task, i) => (
                <li key={task.id} className="flex items-center gap-2 py-2 border-b border-rule-soft last:border-0">
                  {/* Reorder */}
                  <div className="flex flex-col">
                    <button onClick={() => moveTask(i, 'up')} disabled={i === 0} className="w-5 h-4 flex items-center justify-center text-ink-muted hover:text-ink disabled:opacity-20 transition-colors">
                      <ChevronUp className="w-3 h-3" />
                    </button>
                    <button onClick={() => moveTask(i, 'down')} disabled={i === filteredTasks.length - 1} className="w-5 h-4 flex items-center justify-center text-ink-muted hover:text-ink disabled:opacity-20 transition-colors">
                      <ChevronDown className="w-3 h-3" />
                    </button>
                  </div>

                  {/* Text / edit */}
                  {editingId === task.id ? (
                    <input
                      autoFocus
                      value={editText}
                      onChange={e => setEditText(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter') saveEdit(task.id)
                        if (e.key === 'Escape') setEditingId(null)
                      }}
                      className="flex-1 bg-transparent border-0 border-b border-ink py-0.5 text-ink text-sm outline-none"
                    />
                  ) : (
                    <button
                      onClick={() => { setEditingId(task.id); setEditText(task.text) }}
                      className={cn(
                        'flex-1 text-sm text-left transition-colors hover:text-ink-soft',
                        task.active ? 'text-ink' : 'text-ink-muted line-through'
                      )}
                    >
                      {task.text}
                    </button>
                  )}

                  {editingId === task.id ? (
                    <>
                      <button onClick={() => saveEdit(task.id)} className="w-7 h-7 rounded-md flex items-center justify-center text-ink hover:bg-bg-hover transition-colors">
                        <Check className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => setEditingId(null)} className="w-7 h-7 rounded-md flex items-center justify-center text-ink-muted hover:bg-bg-hover transition-colors">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => deleteTask(task.id)}
                      className="w-7 h-7 rounded-md flex items-center justify-center text-ink-muted hover:text-brand-rosa hover:bg-bg-hover transition-colors"
                      title="Remover"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
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
