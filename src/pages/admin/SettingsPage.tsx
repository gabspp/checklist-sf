import { useState, useEffect } from 'react'
import { Check } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import Stage, { SectionHead } from '@/components/layout/Stage'
import Topbar from '@/components/layout/Topbar'

export default function SettingsPage() {
  const [whatsapp, setWhatsapp] = useState('')
  const [telegramToken, setTelegramToken] = useState('')
  const [telegramChatId, setTelegramChatId] = useState('')
  const [notificationEmail, setNotificationEmail] = useState('')
  
  const [saved, setSaved] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.from('chk_settings').select('key, value').then(({ data }) => {
      if (data) {
        const getVal = (k: string) => data.find(d => d.key === k)?.value || ''
        setWhatsapp(getVal('whatsapp_number'))
        setTelegramToken(getVal('telegram_token'))
        setTelegramChatId(getVal('telegram_chat_id'))
        setNotificationEmail(getVal('notification_email'))
      }
      setLoading(false)
    })
  }, [])

  async function save() {
    setLoading(true)
    await supabase.from('chk_settings').upsert([
      { key: 'whatsapp_number', value: whatsapp.replace(/\D/g, '') },
      { key: 'telegram_token', value: telegramToken.trim() },
      { key: 'telegram_chat_id', value: telegramChatId.trim() },
      { key: 'notification_email', value: notificationEmail.trim() }
    ])
    setLoading(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="flex flex-col h-full">
      <Topbar breadcrumbs={[{ label: 'Configurações' }]} />

      <Stage>
        <h1 className="font-serif text-xl text-ink mb-6">Configurações e Integrações</h1>

        <div className="flex flex-col gap-6 max-w-md">
          {/* WhatsApp (Antigo / Manual) */}
          <div className="p-3.5 bg-bg-card border border-rule-soft rounded-lg">
            <SectionHead title="WhatsApp (Botão Manual)" />
            <p className="text-xs text-ink-muted mb-3">
              Número com código do país, sem espaços ou sinais. Usado no envio manual (opcional).
            </p>
            <input
              type="text"
              value={whatsapp}
              onChange={e => setWhatsapp(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && save()}
              placeholder="5511912345678"
              disabled={loading}
              className="w-full bg-transparent border-0 border-b border-rule-soft focus:border-ink py-1.5 text-ink placeholder:text-ink-muted text-sm outline-none transition-colors disabled:opacity-50"
            />
          </div>

          {/* E-mail Automático */}
          <div className="p-3.5 bg-bg-card border border-rule-soft rounded-lg">
            <SectionHead title="E-mail de Notificação" />
            <p className="text-xs text-ink-muted mb-3">
              E-mail que receberá a notificação automática (via FormSubmit).
            </p>
            <input
              type="email"
              value={notificationEmail}
              onChange={e => setNotificationEmail(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && save()}
              placeholder="seu@email.com"
              disabled={loading}
              className="w-full bg-transparent border-0 border-b border-rule-soft focus:border-ink py-1.5 text-ink placeholder:text-ink-muted text-sm outline-none transition-colors disabled:opacity-50"
            />
          </div>

          {/* Telegram Automático */}
          <div className="p-3.5 bg-bg-card border border-rule-soft rounded-lg">
            <SectionHead title="Telegram Bot" />
            <p className="text-xs text-ink-muted mb-3">
              Insira o Token do seu Bot e o seu Chat ID para receber avisos pelo Telegram.
            </p>
            <div className="flex flex-col gap-3">
              <input
                type="text"
                value={telegramToken}
                onChange={e => setTelegramToken(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && save()}
                placeholder="Bot Token (ex: 12345:ABCdef...)"
                disabled={loading}
                className="w-full bg-transparent border-0 border-b border-rule-soft focus:border-ink py-1.5 text-ink placeholder:text-ink-muted text-sm outline-none transition-colors disabled:opacity-50"
              />
              <input
                type="text"
                value={telegramChatId}
                onChange={e => setTelegramChatId(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && save()}
                placeholder="Chat ID (ex: 12345678)"
                disabled={loading}
                className="w-full bg-transparent border-0 border-b border-rule-soft focus:border-ink py-1.5 text-ink placeholder:text-ink-muted text-sm outline-none transition-colors disabled:opacity-50"
              />
            </div>
          </div>

          <button
            onClick={save}
            disabled={loading}
            className="
              w-full h-10 rounded-pill
              bg-ink text-bg text-xs font-medium uppercase tracking-wider
              hover:bg-ink-soft transition-colors
              disabled:opacity-40 disabled:cursor-not-allowed
              flex items-center justify-center gap-2
            "
          >
            {saved ? <><Check className="w-4 h-4" /> Salvo com sucesso</> : 'Salvar Configurações'}
          </button>
        </div>
      </Stage>
    </div>
  )
}
