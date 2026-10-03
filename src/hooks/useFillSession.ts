import { useEffect, useRef, useState } from 'react'
import type { RealtimeChannel } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { generateId, localDateISO } from '@/lib/utils'
import type { ChkEmployee, FillKind, FillSession, FillSessionItem } from '@/lib/types'

export interface ItemState {
  quantity: number | null
  flag: boolean
}

export type SessionStatus = 'idle' | 'checking' | 'prompt' | 'joining' | 'ready' | 'closed' | 'error'

export interface ExistingSession {
  id: string
  startedByName: string
  startedAt: string
  lastActivityAt: string | null
  participantNames: string[]
}

interface UseFillSessionArgs {
  kind: FillKind
  refId: string | null
  storeId: string | null
  employee: ChkEmployee | null
}

const DEBOUNCE_MS = 300
const RETRY_MS = 3000
const COMMENT_KEY = 'comment'
const UNIQUE_VIOLATION = '23505'

export function joinNames(names: string[]): string {
  if (names.length <= 1) return names[0] ?? ''
  return `${names.slice(0, -1).join(', ')} e ${names[names.length - 1]}`
}

// Sessão compartilhada de preenchimento: uma por lista/formulário + loja.
// Cada item é uma linha no banco; mudanças são salvas com debounce e chegam
// às outras telas pelo Realtime.
export function useFillSession({ kind, refId, storeId, employee }: UseFillSessionArgs) {
  const [status, setStatus] = useState<SessionStatus>('idle')
  const [existing, setExisting] = useState<ExistingSession | null>(null)
  const [items, setItems] = useState<Record<string, ItemState>>({})
  const [comment, setCommentState] = useState('')
  const [participantNames, setParticipantNames] = useState<string[]>([])
  const [participantIds, setParticipantIds] = useState<string[]>([])
  const [onlineNames, setOnlineNames] = useState<string[]>([])
  const [closedReason, setClosedReason] = useState<'submitted' | 'discarded' | 'expired' | null>(null)
  const [syncError, setSyncError] = useState(false)

  const employeeRef = useRef(employee)
  employeeRef.current = employee
  const sessionIdRef = useRef<string | null>(null)
  const itemsRef = useRef<Record<string, ItemState>>({})
  const commentRef = useRef('')
  const sentCommentsRef = useRef<Set<string>>(new Set())
  const channelRef = useRef<RealtimeChannel | null>(null)
  const timersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map())
  const pendingRemoteRef = useRef<Map<string, unknown>>(new Map())
  const submittedByMeRef = useRef(false)

  function commitItems(next: Record<string, ItemState>) {
    itemsRef.current = next
    setItems(next)
  }

  function commitComment(text: string) {
    commentRef.current = text
    setCommentState(text)
  }

  function resetLocal() {
    commitItems({})
    commitComment('')
    sentCommentsRef.current = new Set()
    pendingRemoteRef.current.clear()
    submittedByMeRef.current = false
    setParticipantNames([])
    setParticipantIds([])
    setOnlineNames([])
    setExisting(null)
    setClosedReason(null)
    setSyncError(false)
  }

  // ── Escrita (local primeiro, banco depois, com debounce) ──────────────────

  async function persist(key: string, sessionId: string): Promise<boolean> {
    const me = employeeRef.current
    if (!me) return true
    const now = new Date().toISOString()

    if (key === COMMENT_KEY) {
      const text = commentRef.current
      sentCommentsRef.current.add(text)
      const { error } = await supabase
        .from('fill_sessions')
        .update({ comment: text, updated_at: now })
        .eq('id', sessionId)
      return !error
    }

    const value = itemsRef.current[key]
    if (!value) return true
    const { error } = await supabase
      .from('fill_session_items')
      .upsert(
        {
          session_id: sessionId,
          item_id: key,
          quantity: value.quantity,
          flag: value.flag,
          updated_by: me.id,
          updated_at: now,
        },
        { onConflict: 'session_id,item_id' }
      )
    return !error
  }

  async function flush(key: string) {
    const sessionId = sessionIdRef.current
    if (!sessionId) return
    const ok = await persist(key, sessionId)
    if (ok) {
      setSyncError(false)
    } else {
      setSyncError(true)
      if (!timersRef.current.has(key)) {
        timersRef.current.set(key, setTimeout(() => {
          timersRef.current.delete(key)
          void flush(key)
        }, RETRY_MS))
      }
    }
  }

  function scheduleWrite(key: string) {
    const prev = timersRef.current.get(key)
    if (prev) clearTimeout(prev)
    timersRef.current.set(key, setTimeout(() => {
      timersRef.current.delete(key)
      void flush(key)
    }, DEBOUNCE_MS))
  }

  function flushNow(key: string) {
    const timer = timersRef.current.get(key)
    if (timer) clearTimeout(timer)
    timersRef.current.delete(key)
    void flush(key)
  }

  function setItem(itemId: string, patch: Partial<ItemState>) {
    const current = itemsRef.current[itemId] ?? { quantity: null, flag: false }
    commitItems({ ...itemsRef.current, [itemId]: { ...current, ...patch } })
    scheduleWrite(itemId)
  }

  function setComment(text: string) {
    commitComment(text)
    scheduleWrite(COMMENT_KEY)
  }

  // ── Recebimento (Realtime) ────────────────────────────────────────────────

  function applyValue(key: string, value: unknown) {
    if (key === COMMENT_KEY) commitComment(value as string)
    else commitItems({ ...itemsRef.current, [key]: value as ItemState })
  }

  // Não sobrescreve o campo que a pessoa está digitando: guarda e aplica no blur
  function applyRemote(key: string, value: unknown) {
    const el = document.activeElement as HTMLElement | null
    if (el?.dataset?.syncKey === key) {
      pendingRemoteRef.current.set(key, value)
      return
    }
    applyValue(key, value)
  }

  function onItemChange(row: Partial<FillSessionItem>) {
    if (!row.item_id) return
    // eco da minha própria escrita: o estado local já tem esse valor
    if (row.updated_by && row.updated_by === employeeRef.current?.id) return
    applyRemote(row.item_id, {
      quantity: row.quantity == null ? null : Number(row.quantity),
      flag: !!row.flag,
    })
  }

  function onSessionChange(row: FillSession) {
    if (row.id !== sessionIdRef.current) return
    if (row.status !== 'open' && !submittedByMeRef.current) {
      setClosedReason(
        row.status === 'submitted' ? 'submitted'
          : row.status === 'expired' ? 'expired'
          : 'discarded'
      )
      setStatus('closed')
      return
    }
    if (row.comment !== undefined && !sentCommentsRef.current.has(row.comment)) {
      applyRemote(COMMENT_KEY, row.comment)
    }
  }

  useEffect(() => {
    function onFocusOut(e: FocusEvent) {
      const key = (e.target as HTMLElement | null)?.dataset?.syncKey
      if (!key) return
      if (timersRef.current.has(key)) {
        // a pessoa mexeu nesse campo: o valor local vence e é salvo agora
        flushNow(key)
        pendingRemoteRef.current.delete(key)
        return
      }
      if (pendingRemoteRef.current.has(key)) {
        const value = pendingRemoteRef.current.get(key)
        pendingRemoteRef.current.delete(key)
        applyValue(key, value)
      }
    }
    document.addEventListener('focusout', onFocusOut)
    return () => document.removeEventListener('focusout', onFocusOut)
  }, [])

  // ── Canal Realtime ────────────────────────────────────────────────────────

  async function loadItems(sessionId: string) {
    const { data } = await supabase.from('fill_session_items').select('*').eq('session_id', sessionId)
    const next: Record<string, ItemState> = {}
    for (const row of (data ?? []) as FillSessionItem[]) {
      next[row.item_id] = { quantity: row.quantity == null ? null : Number(row.quantity), flag: row.flag }
    }
    // preserva o que ainda não foi salvo neste aparelho
    for (const key of timersRef.current.keys()) {
      if (key !== COMMENT_KEY && itemsRef.current[key]) next[key] = itemsRef.current[key]
    }
    commitItems(next)
  }

  async function loadParticipants(sessionId: string) {
    const { data } = await supabase
      .from('fill_session_participants')
      .select('employee_id, employee_name')
      .eq('session_id', sessionId)
      .order('joined_at')
    setParticipantNames((data ?? []).map(p => p.employee_name))
    setParticipantIds((data ?? []).map(p => p.employee_id))
  }

  async function loadComment(sessionId: string) {
    const { data } = await supabase.from('fill_sessions').select('comment').eq('id', sessionId).single()
    if (data && !timersRef.current.has(COMMENT_KEY)) commitComment(data.comment)
  }

  function readOnline(channel: RealtimeChannel): string[] {
    const state = channel.presenceState() as unknown as Record<string, { name?: string }[]>
    const names = new Set<string>()
    for (const metas of Object.values(state)) {
      for (const meta of metas) {
        if (meta.name) names.add(meta.name)
      }
    }
    return [...names]
  }

  // 'watch' só observa (tela de aviso); 'join' também publica presença e carrega os dados
  function subscribe(sessionId: string, mode: 'watch' | 'join') {
    const channel = supabase.channel(`fill-session:${sessionId}`, {
      config: { presence: { key: generateId() } },
    })
    channelRef.current = channel

    channel
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'fill_session_items', filter: `session_id=eq.${sessionId}` },
        payload => onItemChange(payload.new as Partial<FillSessionItem>)
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'fill_session_participants', filter: `session_id=eq.${sessionId}` },
        () => { void loadParticipants(sessionId) }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'fill_sessions', filter: `id=eq.${sessionId}` },
        payload => onSessionChange(payload.new as FillSession)
      )
      .on('presence', { event: 'sync' }, () => setOnlineNames(readOnline(channel)))
      .subscribe(async state => {
        if (state !== 'SUBSCRIBED' || channelRef.current !== channel) return
        setOnlineNames(readOnline(channel))
        if (mode === 'watch') return

        const me = employeeRef.current
        if (me) await channel.track({ name: me.name })
        await Promise.all([loadItems(sessionId), loadParticipants(sessionId), loadComment(sessionId)])
        // a cada reconexão recarrega tudo, e não volta a 'ready' se a sessão já foi fechada
        setStatus(s => (s === 'closed' ? s : 'ready'))
      })
  }

  function teardown() {
    for (const key of Array.from(timersRef.current.keys())) flushNow(key)
    const channel = channelRef.current
    channelRef.current = null
    if (channel) void supabase.removeChannel(channel)
  }

  // ── Entrar, criar e descartar sessão ──────────────────────────────────────

  async function loadExisting(row: FillSession): Promise<ExistingSession> {
    const [{ data: parts }, { data: last }] = await Promise.all([
      supabase.from('fill_session_participants').select('employee_name').eq('session_id', row.id).order('joined_at'),
      supabase.from('fill_session_items').select('updated_at').eq('session_id', row.id).order('updated_at', { ascending: false }).limit(1),
    ])
    return {
      id: row.id,
      startedByName: row.started_by_name,
      startedAt: row.started_at,
      lastActivityAt: last?.[0]?.updated_at ?? null,
      participantNames: (parts ?? []).map(p => p.employee_name),
    }
  }

  async function enterSession(sessionId: string) {
    teardown()
    sessionIdRef.current = sessionId
    submittedByMeRef.current = false
    setClosedReason(null)

    const me = employeeRef.current
    if (me) {
      // antes de assinar, para que o carregamento inicial já inclua essa pessoa
      await supabase
        .from('fill_session_participants')
        .upsert(
          { session_id: sessionId, employee_id: me.id, employee_name: me.name },
          { onConflict: 'session_id,employee_id' }
        )
    }
    subscribe(sessionId, 'join')
  }

  async function startSession(isCancelled: () => boolean) {
    const me = employeeRef.current
    if (!me || !refId || !storeId) return

    setStatus('joining')
    const today = localDateISO()

    // sessões de dias anteriores que ficaram abertas passam a expiradas
    await supabase
      .from('fill_sessions')
      .update({ status: 'expired', updated_at: new Date().toISOString() })
      .eq('kind', kind)
      .eq('ref_id', refId)
      .eq('store_id', storeId)
      .eq('status', 'open')
      .lt('day', today)

    const newId = generateId()
    const { error } = await supabase.from('fill_sessions').insert({
      id: newId,
      kind,
      ref_id: refId,
      store_id: storeId,
      day: today,
      started_by_name: me.name,
    })

    let sessionId = newId
    if (error) {
      if (error.code !== UNIQUE_VIOLATION) throw error
      // outra pessoa abriu a mesma lista no mesmo instante: entra na sessão dela
      const { data } = await supabase
        .from('fill_sessions')
        .select('*')
        .eq('kind', kind)
        .eq('ref_id', refId)
        .eq('store_id', storeId)
        .eq('status', 'open')
        .eq('day', today)
        .single()
      if (!data) throw error
      sessionId = data.id
    }

    if (isCancelled()) return
    await enterSession(sessionId)
  }

  // ── Ciclo de vida: checa sessão aberta quando a lista/formulário é escolhida ──

  useEffect(() => {
    if (!refId || !storeId || !employeeRef.current) {
      teardown()
      sessionIdRef.current = null
      resetLocal()
      setStatus('idle')
      return
    }

    let cancelled = false
    resetLocal()
    setStatus('checking')

    void (async () => {
      try {
        const { data: found } = await supabase
          .from('fill_sessions')
          .select('*')
          .eq('kind', kind)
          .eq('ref_id', refId)
          .eq('store_id', storeId)
          .eq('status', 'open')
          .eq('day', localDateISO())
          .maybeSingle()
        if (cancelled) return

        if (found) {
          const info = await loadExisting(found as FillSession)
          if (cancelled) return
          setExisting(info)
          sessionIdRef.current = found.id
          subscribe(found.id, 'watch')
          setStatus('prompt')
        } else {
          await startSession(() => cancelled)
        }
      } catch (err) {
        console.error('Erro ao abrir sessão de preenchimento:', err)
        if (!cancelled) setStatus('error')
      }
    })()

    return () => {
      cancelled = true
      teardown()
      sessionIdRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kind, refId, storeId, employee?.id])

  // ── Ações expostas para as telas ──────────────────────────────────────────

  async function continueExisting() {
    if (!existing) return
    setStatus('joining')
    await enterSession(existing.id)
  }

  async function startFresh() {
    if (!existing) return
    setStatus('joining')
    await supabase
      .from('fill_sessions')
      .update({ status: 'discarded', updated_at: new Date().toISOString() })
      .eq('id', existing.id)
    await startSession(() => false)
  }

  async function markSubmitted() {
    submittedByMeRef.current = true
    for (const key of Array.from(timersRef.current.keys())) flushNow(key)
    const sessionId = sessionIdRef.current
    if (!sessionId) return
    await supabase
      .from('fill_sessions')
      .update({ status: 'submitted', comment: commentRef.current, updated_at: new Date().toISOString() })
      .eq('id', sessionId)
  }

  const participantLabel = joinNames(participantNames)

  return {
    status,
    existing,
    items,
    comment,
    setComment,
    setItem,
    participantNames,
    participantLabel,
    submitterId: participantIds[0] ?? employee?.id ?? null,
    onlineNames,
    closedReason,
    syncError,
    continueExisting,
    startFresh,
    markSubmitted,
  }
}
