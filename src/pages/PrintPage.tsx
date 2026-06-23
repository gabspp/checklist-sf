import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import type { ChkList, ChkTask, Store } from '@/lib/types'

export default function PrintPage() {
  const { listId } = useParams<{ listId: string }>()
  const [list, setList] = useState<ChkList | null>(null)
  const [tasks, setTasks] = useState<ChkTask[]>([])
  const [store, setStore] = useState<Store | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!listId) return
    Promise.all([
      supabase.from('chk_lists').select('*').eq('id', listId).single(),
      supabase.from('chk_tasks').select('*').eq('list_id', listId).is('day_of_week', null).eq('active', true).order('sort_order'),
    ]).then(async ([{ data: listData }, { data: tasksData }]) => {
      if (listData) {
        setList(listData)
        const { data: storeData } = await supabase.from('stores').select('id, name').eq('id', listData.store_id).single()
        setStore(storeData)
      }
      // Impressão usa só as tarefas de toda semana (sem dia específico — é um template genérico)
      setTasks(tasksData ?? [])
      setLoading(false)
    })
  }, [listId])

  useEffect(() => {
    if (!loading && list) {
      setTimeout(() => window.print(), 300)
    }
  }, [loading, list])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <p className="text-gray-500 text-sm">Preparando para imprimir…</p>
      </div>
    )
  }

  if (!list) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <p className="text-gray-500 text-sm">Lista não encontrada.</p>
      </div>
    )
  }

  // Split tasks into two columns
  const half = Math.ceil(tasks.length / 2)
  const col1 = tasks.slice(0, half)
  const col2 = tasks.slice(half)

  return (
    <>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }

        @media print {
          @page { size: A4 portrait; margin: 14mm 16mm; }
          body { margin: 0; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .no-print { display: none !important; }
        }

        body {
          font-family: "DM Sans", system-ui, sans-serif;
          background: white;
          color: #1a1a1a;
          font-size: 13px;
        }

        .page {
          max-width: 760px;
          margin: 0 auto;
          padding: 24px 28px 20px;
        }

        /* Header */
        .header {
          border-bottom: 2px solid #72381C;
          padding-bottom: 10px;
          margin-bottom: 14px;
        }
        .header-eyebrow {
          font-size: 9px;
          font-weight: 700;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: #A88560;
          margin-bottom: 3px;
        }
        .header-title {
          font-family: "Newsreader", Georgia, serif;
          font-size: 28px;
          font-weight: 500;
          line-height: 1;
          color: #72381C;
        }

        /* Fields row */
        .fields {
          display: grid;
          grid-template-columns: 2fr 1fr 1fr;
          gap: 16px;
          margin-bottom: 16px;
        }
        .field-label {
          font-size: 8px;
          font-weight: 700;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: #A88560;
          margin-bottom: 4px;
        }
        .field-line {
          border-bottom: 1.5px solid #999;
          height: 22px;
        }

        /* Task section heading */
        .tasks-heading {
          font-size: 8px;
          font-weight: 700;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: #A88560;
          border-bottom: 1px solid #ccc;
          padding-bottom: 5px;
          margin-bottom: 6px;
        }

        /* Two-column task grid */
        .tasks-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 0 32px;
        }

        .task-col {
          display: flex;
          flex-direction: column;
        }

        /* Task row */
        .task-row {
          display: flex;
          align-items: flex-start;
          gap: 6px;
          padding: 6px 0;
          border-bottom: 1px dashed #ddd;
        }
        .task-row:last-child {
          border-bottom: none;
        }

        .task-num {
          font-size: 10px;
          color: #A88560;
          width: 20px;
          text-align: right;
          flex-shrink: 0;
          line-height: 1.4;
          padding-top: 1px;
        }

        .task-checkbox {
          width: 15px;
          height: 15px;
          border: 1.5px solid #888;
          border-radius: 2px;
          flex-shrink: 0;
          margin-top: 1px;
        }

        .task-text {
          font-size: 12px;
          color: #1a1a1a;
          line-height: 1.3;
          flex: 1;
          word-break: break-word;
        }

        /* Footer */
        .footer {
          margin-top: 14px;
          padding-top: 8px;
          border-top: 1px solid #ddd;
          text-align: right;
        }
        .footer-text {
          font-size: 8px;
          color: #bbb;
          letter-spacing: 0.06em;
        }

        /* Print button */
        .print-btn {
          position: fixed;
          top: 16px;
          right: 16px;
          padding: 8px 18px;
          background: #72381C;
          color: white;
          font-size: 13px;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-family: inherit;
        }
        .print-btn:hover { background: #8C4820; }
      `}</style>

      <button className="print-btn no-print" onClick={() => window.print()}>
        Imprimir
      </button>

      <div className="page">
        {/* Header */}
        <div className="header">
          <p className="header-eyebrow">
            Santo Favo{store ? ` — Loja ${store.name}` : ''}
          </p>
          <h1 className="header-title">{list.name}</h1>
        </div>

        {/* Signature / date fields */}
        <div className="fields">
          <div>
            <p className="field-label">Funcionário</p>
            <div className="field-line" />
          </div>
          <div>
            <p className="field-label">Data</p>
            <div className="field-line" />
          </div>
          <div>
            <p className="field-label">Assinatura</p>
            <div className="field-line" />
          </div>
        </div>

        {/* Tasks */}
        <p className="tasks-heading">Tarefas — {tasks.length} itens</p>

        <div className="tasks-grid">
          <div className="task-col">
            {col1.map((task, i) => (
              <div key={task.id} className="task-row">
                <span className="task-num">{i + 1}</span>
                <span className="task-checkbox" />
                <span className="task-text">{task.text}</span>
              </div>
            ))}
          </div>

          <div className="task-col">
            {col2.map((task, i) => (
              <div key={task.id} className="task-row">
                <span className="task-num">{half + i + 1}</span>
                <span className="task-checkbox" />
                <span className="task-text">{task.text}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="footer">
          <p className="footer-text">Santo Favo OS · Checklists</p>
        </div>
      </div>
    </>
  )
}
