import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// crypto.randomUUID() só existe em contexto seguro (HTTPS ou localhost) —
// em produção (Vercel, HTTPS) e no dev local funciona normalmente, mas quebra
// ao testar pelo celular via IP puro na rede local (ex: http://192.168.x.x).
// Data local no formato YYYY-MM-DD (toISOString usaria UTC e viraria o dia cedo demais)
export function localDateISO(date: Date = new Date()): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function generateId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

const DAY_NAMES_PT = [
  'domingo',
  'segunda-feira',
  'terça-feira',
  'quarta-feira',
  'quinta-feira',
  'sexta-feira',
  'sábado',
]

export function getCurrentDayInfo() {
  const now = new Date()
  const dayOfWeek = DAY_NAMES_PT[now.getDay()]
  const date = now.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
  const time = now.toTimeString().substring(0, 5)
  return { dayOfWeek, date, time, raw: now }
}

export interface ShareTextParams {
  storeName: string
  listName: string
  employeeName: string
  date: string
  time: string
  dayOfWeek: string
  doneCount: number
  totalCount: number
  pendingItems: string[]
  comment?: string
}

export function getShareText(params: ShareTextParams): string {
  const { storeName, listName, employeeName, date, time, dayOfWeek, doneCount, totalCount, pendingItems, comment } = params

  const dayLabel = dayOfWeek.charAt(0).toUpperCase() + dayOfWeek.slice(1)
  const status = `${doneCount === totalCount ? '✅' : '⚠️'} ${doneCount} de ${totalCount} itens concluídos`

  const pendingBlock = pendingItems.length > 0
    ? `\n\n❌ *Pendentes:*\n${pendingItems.map(t => `• ${t}`).join('\n')}`
    : '\n\n✅ Tudo concluído!'

  const commentBlock = comment?.trim() ? `\n\n💬 ${comment.trim()}` : ''

  return `*Checklist ${listName} — Loja ${storeName}*\n` +
    `Funcionário: ${employeeName}\n` +
    `Data: ${date} · ${dayLabel}\n` +
    `Hora: ${time}\n\n` +
    status +
    pendingBlock +
    commentBlock
}

export interface FormShareTextParams {
  storeName: string
  formName: string
  employeeName: string
  date: string
  time: string
  dayOfWeek: string
  filledCount: number
  itemCount: number
  toBuyItems: string[]
  comment?: string
}

export function getFormShareText(params: FormShareTextParams): string {
  const { storeName, formName, employeeName, date, time, dayOfWeek, filledCount, itemCount, toBuyItems, comment } = params

  const dayLabel = dayOfWeek.charAt(0).toUpperCase() + dayOfWeek.slice(1)
  const status = `📋 ${filledCount} de ${itemCount} itens respondidos`

  const toBuyBlock = toBuyItems.length > 0
    ? `\n\n🛒 *Comprar:*\n${toBuyItems.map(t => `• ${t}`).join('\n')}`
    : '\n\n✅ Nada para comprar!'

  const commentBlock = comment?.trim() ? `\n\n💬 ${comment.trim()}` : ''

  return `*Formulário ${formName} — Loja ${storeName}*\n` +
    `Funcionário: ${employeeName}\n` +
    `Data: ${date} · ${dayLabel}\n` +
    `Hora: ${time}\n\n` +
    status +
    toBuyBlock +
    commentBlock
}

export function openWhatsApp(phoneNumber: string, text: string) {
  const encoded = encodeURIComponent(text)
  window.open(`https://wa.me/${phoneNumber}?text=${encoded}`, '_blank')
}

export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    // fallback para browsers sem Clipboard API
    const el = document.createElement('textarea')
    el.value = text
    el.style.position = 'fixed'
    el.style.opacity = '0'
    document.body.appendChild(el)
    el.select()
    const ok = document.execCommand('copy')
    document.body.removeChild(el)
    return ok
  }
}

export function formatDateBR(isoString: string): string {
  const d = new Date(isoString)
  return d.toLocaleDateString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

export function formatTimeBR(isoString: string): string {
  const d = new Date(isoString)
  return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
}
