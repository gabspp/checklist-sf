import { useState, useEffect } from 'react'
import { Check } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import Stage, { SectionHead } from '@/components/layout/Stage'
import Topbar from '@/components/layout/Topbar'

export default function SettingsPage() {
  const [whatsapp, setWhatsapp] = useState('')
  const [saved, setSaved] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.from('chk_settings').select('value').eq('key', 'whatsapp_number').single().then(({ data }) => {
      if (data) setWhatsapp(data.value)
      setLoading(false)
    })
  }, [])

  async function save() {
    await supabase
      .from('chk_settings')
      .upsert({ key: 'whatsapp_number', value: whatsapp.replace(/\D/g, '') })
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="flex flex-col h-full">
      <Topbar breadcrumbs={[{ label: 'Configurações' }]} />

      <Stage>
        <h1 className="font-serif text-xl text-ink mb-6">Configurações</h1>

        <div className="p-3.5 bg-bg-card border border-rule-soft rounded-lg max-w-md">
          <SectionHead title="WhatsApp do dono" />
          <p className="text-xs text-ink-muted mb-3">
            Número com código do país, sem espaços ou sinais. Ex: 5511912345678
          </p>

          <div className="flex gap-2">
            <input
              type="text"
              value={whatsapp}
              onChange={e => setWhatsapp(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && save()}
              placeholder="5511912345678"
              disabled={loading}
              className="
                flex-1 bg-transparent
                border-0 border-b border-rule-soft focus:border-ink
                py-1.5 text-ink placeholder:text-ink-muted text-sm
                outline-none transition-colors
                disabled:opacity-50
              "
            />
            <button
              onClick={save}
              disabled={loading}
              className="
                px-4 h-9 rounded-pill
                bg-ink text-bg text-xs font-medium uppercase tracking-wider
                hover:bg-ink-soft transition-colors
                disabled:opacity-40 disabled:cursor-not-allowed
                flex items-center gap-1.5
              "
            >
              {saved ? <><Check className="w-3.5 h-3.5" /> Salvo</> : 'Salvar'}
            </button>
          </div>
        </div>
      </Stage>
    </div>
  )
}
