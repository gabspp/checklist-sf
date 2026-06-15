import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getCurrentDayInfo() {
  const now = new Date()
  const dayOfWeek = now.toLocaleDateString('pt-BR', { weekday: 'long' }).toLowerCase()
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
