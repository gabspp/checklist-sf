import { useState, useEffect } from 'react'
import { Plus, ChevronUp, ChevronDown, Trash2, Check, X } from 'lucide-react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { cn } from '@/lib/utils'
import Stage, { SectionHead } from '@/components/layout/Stage'
import Topbar from '@/components/layout/Topbar'
import type { FrmForm, FrmSection, FrmItem } from '@/lib/types'

export default function FormFieldsPage() {
  const { formId } = useParams<{ formId: string }>()
  const navigate = useNavigate()
  const [form, setForm] = useState<FrmForm | null>(null)
  const [storeName, setStoreName] = useState('')
  const [sections, setSections] = useState<FrmSection[]>([])
  const [items, setItems] = useState<FrmItem[]>([])
  const [loading, setLoading] = useState(true)

  const [newSectionName, setNewSectionName] = useState('')
  const [editingSectionId, setEditingSectionId] = useState<string | null>(null)
  const [editSectionName, setEditSectionName] = useState('')

  const [newItemText, setNewItemText] = useState<Record<string, string>>({})
  const [editingItemId, setEditingItemId] = useState<string | null>(null)
  const [editItemText, setEditItemText] = useState('')

  useEffect(() => {
    if (!formId) return
    supabase.from('frm_forms').select('*').eq('id', formId).single().then(async ({ data }) => {
      setForm(data)
      if (data) {
        const { data: storeData } = await supabase.from('stores').select('name').eq('id', data.store_id).single()
        setStoreName(storeData?.name ?? '')
      }
    })
    loadFields()
  }, [formId])

  async function loadFields() {
    if (!formId) return
    setLoading(true)
    const { data: sectionRows } = await supabase
      .from('frm_sections')
      .select('*')
      .eq('form_id', formId)
      .order('sort_order')

    const { data: itemRows } = await supabase
      .from('frm_items')
      .select('*')
      .in('section_id', (sectionRows ?? []).map(s => s.id))
      .order('sort_order')

    setSections(sectionRows ?? [])
    setItems(itemRows ?? [])
    setLoading(false)
  }

  async function addSection() {
    if (!newSectionName.trim() || !formId) return
    const maxOrder = sections.length > 0 ? Math.max(...sections.map(s => s.sort_order)) + 1 : 0
    const { data } = await supabase
      .from('frm_sections')
      .insert({ form_id: formId, name: newSectionName.trim(), sort_order: maxOrder })
      .select()
      .single()
    if (data) setSections(prev => [...prev, data])
    setNewSectionName('')
  }

  async function saveEditSection(id: string) {
    if (!editSectionName.trim()) return
    await supabase.from('frm_sections').update({ name: editSectionName.trim() }).eq('id', id)
    setSections(prev => prev.map(s => s.id === id ? { ...s, name: editSectionName.trim() } : s))
    setEditingSectionId(null)
  }

  async function deleteSection(id: string) {
    if (!confirm('Remover esta seção e todos os itens dentro dela?')) return
    await supabase.from('frm_sections').delete().eq('id', id)
    setSections(prev => prev.filter(s => s.id !== id))
    setItems(prev => prev.filter(i => i.section_id !== id))
  }

  async function moveSection(index: number, direction: 'up' | 'down') {
    const newSections = [...sections]
    const swapIndex = direction === 'up' ? index - 1 : index + 1
    if (swapIndex < 0 || swapIndex >= newSections.length) return
    ;[newSections[index], newSections[swapIndex]] = [newSections[swapIndex], newSections[index]]
    setSections(newSections.map((s, i) => ({ ...s, sort_order: i })))
    for (let i = 0; i < newSections.length; i++) {
      await supabase.from('frm_sections').update({ sort_order: i }).eq('id', newSections[i].id)
    }
  }

  async function addItem(sectionId: string) {
    const text = newItemText[sectionId]?.trim()
    if (!text) return
    const sectionItems = items.filter(i => i.section_id === sectionId)
    const maxOrder = sectionItems.length > 0 ? Math.max(...sectionItems.map(i => i.sort_order)) + 1 : 0
    const { data } = await supabase
      .from('frm_items')
      .insert({ section_id: sectionId, name: text, sort_order: maxOrder })
      .select()
      .single()
    if (data) setItems(prev => [...prev, data])
    setNewItemText(prev => ({ ...prev, [sectionId]: '' }))
  }

  async function saveEditItem(id: string) {
    if (!editItemText.trim()) return
    await supabase.from('frm_items').update({ name: editItemText.trim() }).eq('id', id)
    setItems(prev => prev.map(i => i.id === id ? { ...i, name: editItemText.trim() } : i))
    setEditingItemId(null)
  }

  async function deleteItem(id: string) {
    if (!confirm('Remover este item?')) return
    await supabase.from('frm_items').delete().eq('id', id)
    setItems(prev => prev.filter(i => i.id !== id))
  }

  async function moveItem(sectionId: string, index: number, direction: 'up' | 'down') {
    const sectionItems = items.filter(i => i.section_id === sectionId)
    const swapIndex = direction === 'up' ? index - 1 : index + 1
    if (swapIndex < 0 || swapIndex >= sectionItems.length) return

    const newSectionItems = [...sectionItems]
    ;[newSectionItems[index], newSectionItems[swapIndex]] = [newSectionItems[swapIndex], newSectionItems[index]]

    const updates = newSectionItems.map((it, i) => ({ id: it.id, sort_order: i }))
    const orderMap = new Map(updates.map(u => [u.id, u.sort_order]))

    setItems(prev =>
      prev.map(i => orderMap.has(i.id) ? { ...i, sort_order: orderMap.get(i.id)! } : i)
    )

    for (const u of updates) {
      await supabase.from('frm_items').update({ sort_order: u.sort_order }).eq('id', u.id)
    }
  }

  return (
    <div className="flex flex-col h-full">
      <Topbar
        breadcrumbs={[
          { label: 'Formulários', onClick: () => navigate('/admin/forms') },
          { label: form ? `${form.name} · Loja ${storeName}` : '…' },
        ]}
      />

      <Stage>
        {/* Add section form */}
        <div className="mb-6 p-3.5 bg-bg-card border border-rule-soft rounded-lg">
          <SectionHead title="Adicionar seção" />
          <div className="flex gap-2 mt-2">
            <input
              type="text"
              value={newSectionName}
              onChange={e => setNewSectionName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addSection()}
              placeholder="Ex: Produtos de Limpeza"
              className="
                flex-1 bg-transparent
                border-0 border-b border-rule-soft focus:border-ink
                py-1.5 text-ink placeholder:text-ink-muted text-sm
                outline-none transition-colors
              "
            />
            <button
              onClick={addSection}
              disabled={!newSectionName.trim()}
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

        {/* Sections */}
        {loading ? (
          <div className="space-y-2">
            {[1, 2, 3].map(i => <div key={i} className="h-11 rounded-lg bg-bg-soft animate-pulse" />)}
          </div>
        ) : sections.length === 0 ? (
          <p className="text-sm text-ink-muted py-4">Nenhuma seção ainda. Adicione acima.</p>
        ) : (
          <div className="space-y-8">
            {sections.map((section, si) => {
              const sectionItems = items.filter(i => i.section_id === section.id)
              return (
                <div key={section.id}>
                  {/* Section header */}
                  <div className="flex items-center gap-2 mb-2 pb-1.5 border-b border-rule">
                    <div className="flex flex-col">
                      <button onClick={() => moveSection(si, 'up')} disabled={si === 0} className="w-5 h-4 flex items-center justify-center text-ink-muted hover:text-ink disabled:opacity-20 transition-colors">
                        <ChevronUp className="w-3 h-3" />
                      </button>
                      <button onClick={() => moveSection(si, 'down')} disabled={si === sections.length - 1} className="w-5 h-4 flex items-center justify-center text-ink-muted hover:text-ink disabled:opacity-20 transition-colors">
                        <ChevronDown className="w-3 h-3" />
                      </button>
                    </div>

                    {editingSectionId === section.id ? (
                      <input
                        autoFocus
                        value={editSectionName}
                        onChange={e => setEditSectionName(e.target.value)}
                        onKeyDown={e => {
                          if (e.key === 'Enter') saveEditSection(section.id)
                          if (e.key === 'Escape') setEditingSectionId(null)
                        }}
                        className="flex-1 bg-transparent border-0 border-b border-ink py-0.5 text-ink text-sm font-semibold uppercase tracking-widest outline-none"
                      />
                    ) : (
                      <h3 className="flex-1 font-sans font-semibold text-[0.74rem] uppercase tracking-widest text-ink-soft">
                        {section.name}
                      </h3>
                    )}

                    <span className="text-xs text-ink-muted">{sectionItems.length}</span>

                    {editingSectionId === section.id ? (
                      <>
                        <button onClick={() => saveEditSection(section.id)} className="w-7 h-7 rounded-md flex items-center justify-center text-ink hover:bg-bg-hover transition-colors">
                          <Check className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => setEditingSectionId(null)} className="w-7 h-7 rounded-md flex items-center justify-center text-ink-muted hover:bg-bg-hover transition-colors">
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => { setEditingSectionId(section.id); setEditSectionName(section.name) }}
                          className="w-7 h-7 rounded-md flex items-center justify-center text-ink-muted hover:text-ink hover:bg-bg-hover transition-colors"
                          title="Renomear seção"
                        >
                          ✎
                        </button>
                        <button
                          onClick={() => deleteSection(section.id)}
                          className="w-7 h-7 rounded-md flex items-center justify-center text-ink-muted hover:text-brand-rosa hover:bg-bg-hover transition-colors"
                          title="Remover seção"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </>
                    )}
                  </div>

                  {/* Items */}
                  <ul>
                    {sectionItems.map((item, ii) => (
                      <li key={item.id} className="flex items-center gap-2 py-2 border-b border-rule-soft last:border-0">
                        <div className="flex flex-col">
                          <button onClick={() => moveItem(section.id, ii, 'up')} disabled={ii === 0} className="w-5 h-4 flex items-center justify-center text-ink-muted hover:text-ink disabled:opacity-20 transition-colors">
                            <ChevronUp className="w-3 h-3" />
                          </button>
                          <button onClick={() => moveItem(section.id, ii, 'down')} disabled={ii === sectionItems.length - 1} className="w-5 h-4 flex items-center justify-center text-ink-muted hover:text-ink disabled:opacity-20 transition-colors">
                            <ChevronDown className="w-3 h-3" />
                          </button>
                        </div>

                        {editingItemId === item.id ? (
                          <input
                            autoFocus
                            value={editItemText}
                            onChange={e => setEditItemText(e.target.value)}
                            onKeyDown={e => {
                              if (e.key === 'Enter') saveEditItem(item.id)
                              if (e.key === 'Escape') setEditingItemId(null)
                            }}
                            className="flex-1 bg-transparent border-0 border-b border-ink py-0.5 text-ink text-sm outline-none"
                          />
                        ) : (
                          <button
                            onClick={() => { setEditingItemId(item.id); setEditItemText(item.name) }}
                            className={cn(
                              'flex-1 text-sm text-left transition-colors hover:text-ink-soft',
                              item.active ? 'text-ink' : 'text-ink-muted line-through'
                            )}
                          >
                            {item.name}
                          </button>
                        )}

                        {editingItemId === item.id ? (
                          <>
                            <button onClick={() => saveEditItem(item.id)} className="w-7 h-7 rounded-md flex items-center justify-center text-ink hover:bg-bg-hover transition-colors">
                              <Check className="w-3.5 h-3.5" />
                            </button>
                            <button onClick={() => setEditingItemId(null)} className="w-7 h-7 rounded-md flex items-center justify-center text-ink-muted hover:bg-bg-hover transition-colors">
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => deleteItem(item.id)}
                            className="w-7 h-7 rounded-md flex items-center justify-center text-ink-muted hover:text-brand-rosa hover:bg-bg-hover transition-colors"
                            title="Remover"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </li>
                    ))}
                  </ul>

                  {/* Add item */}
                  <div className="flex gap-2 mt-2">
                    <input
                      type="text"
                      value={newItemText[section.id] ?? ''}
                      onChange={e => setNewItemText(prev => ({ ...prev, [section.id]: e.target.value }))}
                      onKeyDown={e => e.key === 'Enter' && addItem(section.id)}
                      placeholder="Adicionar item…"
                      className="
                        flex-1 bg-transparent
                        border-0 border-b border-rule-soft focus:border-ink
                        py-1.5 text-ink placeholder:text-ink-muted text-sm
                        outline-none transition-colors
                      "
                    />
                    <button
                      onClick={() => addItem(section.id)}
                      disabled={!newItemText[section.id]?.trim()}
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
              )
            })}
          </div>
        )}
      </Stage>
    </div>
  )
}
