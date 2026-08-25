import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import type { FrmForm, FrmItem, FrmSection, Store } from '@/lib/types'

interface SectionWithItems {
  section: FrmSection
  items: FrmItem[]
}

export default function FormPrintPage() {
  const { formId } = useParams<{ formId: string }>()
  const [form, setForm] = useState<FrmForm | null>(null)
  const [sections, setSections] = useState<SectionWithItems[]>([])
  const [store, setStore] = useState<Store | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!formId) return
    Promise.all([
      supabase.from('frm_forms').select('*').eq('id', formId).single(),
      supabase.from('frm_sections').select('*').eq('form_id', formId).eq('active', true).order('sort_order'),
    ]).then(async ([{ data: formData }, { data: sectionRows }]) => {
      if (formData) {
        setForm(formData)
        const { data: storeData } = await supabase.from('stores').select('id, name').eq('id', formData.store_id).single()
        setStore(storeData)
      }

      const { data: itemRows } = await supabase
        .from('frm_items')
        .select('*')
        .in('section_id', (sectionRows ?? []).map(s => s.id))
        .eq('active', true)
        .order('sort_order')

      setSections(
        (sectionRows ?? []).map(section => ({
          section,
          items: (itemRows ?? []).filter(i => i.section_id === section.id),
        }))
      )
      setLoading(false)
    })
  }, [formId])

  useEffect(() => {
    if (!loading && form) {
      setTimeout(() => window.print(), 300)
    }
  }, [loading, form])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <p className="text-gray-500 text-sm">Preparando para imprimir…</p>
      </div>
    )
  }

  if (!form) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <p className="text-gray-500 text-sm">Formulário não encontrado.</p>
      </div>
    )
  }

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

        .fields {
          display: grid;
          grid-template-columns: 2fr 1fr 1fr;
          gap: 16px;
          margin-bottom: 18px;
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

        .section {
          margin-bottom: 14px;
          break-inside: avoid;
        }
        .section-heading {
          font-size: 9px;
          font-weight: 700;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: white;
          background: #72381C;
          padding: 5px 8px;
          margin-bottom: 0;
        }

        table.items {
          width: 100%;
          border-collapse: collapse;
        }
        table.items thead th {
          font-size: 8px;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: #A88560;
          text-align: left;
          padding: 6px 8px;
          border-bottom: 1px solid #ccc;
          background: #F5EFE8;
        }
        table.items thead th.col-qty,
        table.items thead th.col-buy {
          text-align: center;
          width: 90px;
        }
        table.items tbody td {
          font-size: 12px;
          padding: 6px 8px;
          border-bottom: 1px dashed #ddd;
        }
        table.items tbody tr:last-child td {
          border-bottom: none;
        }
        .qty-line {
          border-bottom: 1.5px solid #999;
          height: 14px;
          width: 60px;
          margin: 0 auto;
        }
        .buy-box {
          width: 14px;
          height: 14px;
          border: 1.5px solid #888;
          border-radius: 2px;
          margin: 0 auto;
        }

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
        <div className="header">
          <p className="header-eyebrow">
            Santo Favo{store ? ` — Loja ${store.name}` : ''}
          </p>
          <h1 className="header-title">{form.name}</h1>
        </div>

        <div className="fields">
          <div>
            <p className="field-label">Loja</p>
            <div className="field-line" />
          </div>
          <div>
            <p className="field-label">Data</p>
            <div className="field-line" />
          </div>
          <div>
            <p className="field-label">Responsável</p>
            <div className="field-line" />
          </div>
        </div>

        {sections.map(({ section, items }) => (
          <div key={section.id} className="section">
            <p className="section-heading">{section.name}</p>
            <table className="items">
              <thead>
                <tr>
                  <th>Produto</th>
                  <th className="col-qty">Quantidade</th>
                  <th className="col-buy">Comprar</th>
                </tr>
              </thead>
              <tbody>
                {items.map(item => (
                  <tr key={item.id}>
                    <td>{item.name}</td>
                    <td><div className="qty-line" /></td>
                    <td><div className="buy-box" /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}

        <div className="footer">
          <p className="footer-text">Santo Favo OS · Formulários</p>
        </div>
      </div>
    </>
  )
}
