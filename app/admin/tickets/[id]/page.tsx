'use client'
import { useState, useEffect, useCallback, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

const BACKEND_URL = 'https://orbyx-backend.onrender.com'

const CATEGORIES: Record<string, string> = {
  agenda_reservas: 'Agenda y reservas',
  pagina_publica: 'Página pública',
  disponibilidad_horarios: 'Disponibilidad',
  staff: 'Staff',
  servicios: 'Servicios',
  sucursales: 'Sucursales',
  clientes: 'Clientes',
  campanas: 'Campañas',
  facturacion_planes: 'Facturación',
  mi_cuenta: 'Mi cuenta',
  equipo_permisos: 'Equipo',
  calendario_google: 'Google Calendar',
  error_tecnico: 'Error técnico',
  sugerencia: 'Sugerencia',
  otro: 'Otro',
}

const STATUS_LABEL: Record<string, { label: string; color: string }> = {
  open: { label: 'Abierto', color: 'text-blue-400' },
  answered: { label: 'Respondido', color: 'text-green-400' },
  waiting_confirmation: { label: 'Esperando confirmación', color: 'text-amber-400' },
  closed: { label: 'Cerrado', color: 'text-gray-400' },
  reopened: { label: 'Reabierto', color: 'text-pink-400' },
}

const PLAN_BADGE: Record<string, { label: string; color: string }> = {
  platinum: { label: 'Platinum', color: 'bg-pink-500/15 text-pink-300 border-pink-500/25' },
  vip: { label: 'VIP', color: 'bg-amber-500/15 text-amber-300 border-amber-500/25' },
  premium: { label: 'Premium', color: 'bg-purple-500/15 text-purple-300 border-purple-500/25' },
  pro: { label: 'Pro', color: 'bg-blue-500/15 text-blue-300 border-blue-500/25' },
}

export default function AdminTicketDetailPage() {
  const params = useParams()
  const router = useRouter()
  const ticketId = params?.id as string
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const [ticket, setTicket] = useState<any>(null)
  const [messages, setMessages] = useState<any[]>([])
  const [replyText, setReplyText] = useState('')
  const [sending, setSending] = useState(false)
  const [resolving, setResolving] = useState(false)
  const [loading, setLoading] = useState(true)

  const getToken = useCallback(async () => {
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()
    return session?.access_token
  }, [])

  const authFetch = useCallback(async (url: string, opts: RequestInit = {}) => {
    const token = await getToken()
    if (!token) { router.push('/admin/login'); return null }
    const res = await fetch(url, {
      ...opts,
      headers: { ...opts.headers as any, Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    })
    if (res.status === 401 || res.status === 403) { router.push('/admin/login'); return null }
    return res
  }, [getToken, router])

  const loadTicket = useCallback(async () => {
    const res = await authFetch(`${BACKEND_URL}/admin/tickets`)
    if (!res) return
    const all = await res.json()
    const t = Array.isArray(all) ? all.find((x: any) => x.id === ticketId) : null
    if (!t) { router.push('/admin/tickets'); return }
    setTicket(t)
  }, [authFetch, ticketId, router])

  const loadMessages = useCallback(async () => {
    const res = await authFetch(`${BACKEND_URL}/admin/tickets/${ticketId}/messages`)
    if (!res) return
    const data = await res.json()
    setMessages(Array.isArray(data) ? data : [])
  }, [authFetch, ticketId])

  useEffect(() => {
    const init = async () => {
      setLoading(true)
      await loadTicket()
      await loadMessages()
      setLoading(false)
    }
    init()
  }, [loadTicket, loadMessages])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleReply = async () => {
    if (!replyText.trim()) return
    setSending(true)
    try {
      const res = await authFetch(`${BACKEND_URL}/admin/tickets/${ticketId}/messages`, {
        method: 'POST',
        body: JSON.stringify({ message: replyText }),
      })
      if (res?.ok) {
        setReplyText('')
        await loadMessages()
        await loadTicket()
      }
    } catch (e) {
      console.error('Error enviando respuesta:', e)
    } finally {
      setSending(false)
    }
  }

  const handleResolve = async () => {
    setResolving(true)
    try {
      const res = await authFetch(`${BACKEND_URL}/admin/tickets/${ticketId}/resolve`, {
        method: 'PATCH',
        body: JSON.stringify({}),
      })
      if (res?.ok) await loadTicket()
    } catch (e) {
      console.error('Error resolviendo ticket:', e)
    } finally {
      setResolving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#060a14' }}>
        <p className="text-sm text-blue-300/50">Cargando ticket...</p>
      </div>
    )
  }

  if (!ticket) return null

  const plan = PLAN_BADGE[ticket.tenant_plan] ?? PLAN_BADGE.pro
  const status = STATUS_LABEL[ticket.status] ?? STATUS_LABEL.open

  return (
    <div className="min-h-screen p-6" style={{ background: '#060a14' }}>
      <div className="max-w-3xl mx-auto">
        <button
          onClick={() => router.push('/admin/tickets')}
          className="text-sm text-blue-400 hover:text-blue-300 mb-4 flex items-center gap-1"
        >
          ← Volver a tickets
        </button>

        {/* Header del ticket */}
        <div className="rounded-2xl border border-blue-900/25 p-5 mb-4" style={{ background: '#0f1729' }}>
          <div className="flex items-start justify-between gap-3 mb-2">
            <h2 className="text-base font-semibold text-white">{ticket.subject}</h2>
            <span className={`shrink-0 text-xs px-2 py-0.5 rounded-full border ${status.color} border-current/20`}>
              {status.label}
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <span className={`text-xs px-2 py-0.5 rounded-full border ${plan.color}`}>{plan.label}</span>
            <span className="text-xs text-blue-300/40">{ticket.tenant_name}</span>
            <span className="text-xs text-blue-300/40">·</span>
            <span className="text-xs text-blue-300/40">{CATEGORIES[ticket.category] ?? ticket.category}</span>
            <span className="text-xs text-blue-300/40">·</span>
            <span className="text-xs text-blue-300/40">
              {new Date(ticket.created_at).toLocaleDateString('es-CL', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
          <p className="text-sm text-blue-100/80 mb-3">{ticket.description}</p>
          {ticket.attachments?.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {ticket.attachments.map((url: string, i: number) => (
                <a key={i} href={url} target="_blank" rel="noopener noreferrer">
                  <img src={url} alt="" className="w-24 h-24 object-cover rounded-lg border border-blue-900/30" />
                </a>
              ))}
            </div>
          )}
        </div>

        {/* Acciones */}
        {!['closed', 'waiting_confirmation'].includes(ticket.status) && (
          <div className="mb-4">
            <button
              onClick={handleResolve}
              disabled={resolving}
              className="px-4 py-2 rounded-xl bg-amber-600/20 hover:bg-amber-600/30 border border-amber-600/30 text-amber-400 text-sm font-medium transition-all active:scale-95 disabled:opacity-50"
            >
              {resolving ? 'Marcando...' : 'Marcar como resuelto'}
            </button>
          </div>
        )}

        {ticket.status === 'waiting_confirmation' && (
          <div className="bg-amber-500/10 border border-amber-500/25 rounded-2xl p-3 mb-4">
            <p className="text-sm text-amber-300">Esperando confirmación del cliente</p>
          </div>
        )}

        {/* Mensajes */}
        <div className="space-y-3 mb-4">
          {messages.map(m => (
            <div
              key={m.id}
              className={`p-3 rounded-xl max-w-[85%] border ${
                m.sender_type === 'support'
                  ? 'bg-blue-600/20 border-blue-600/30 ml-auto'
                  : 'border-blue-900/25'
              }`}
              style={m.sender_type !== 'support' ? { background: '#0f1729' } : undefined}
            >
              <p className="text-xs text-blue-300/40 mb-1">
                {m.sender_type === 'support' ? 'Tú (Soporte)' : 'Cliente'}
                <span className="ml-2">
                  {new Date(m.created_at).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </p>
              <p className="text-sm text-white">{m.message}</p>
              {m.attachments?.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {m.attachments.map((url: string, i: number) => (
                    <a key={i} href={url} target="_blank" rel="noopener noreferrer">
                      <img src={url} alt="" className="w-16 h-16 object-cover rounded-lg border border-blue-900/30" />
                    </a>
                  ))}
                </div>
              )}
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Responder */}
        {ticket.status !== 'closed' && (
          <div className="rounded-2xl border border-blue-900/25 p-4" style={{ background: '#0f1729' }}>
            <textarea
              value={replyText}
              onChange={e => setReplyText(e.target.value)}
              rows={3}
              placeholder="Escribe tu respuesta como soporte..."
              className="w-full bg-[#0a0f1e] border border-blue-900/30 rounded-xl px-3 py-2 text-sm text-white resize-none focus:outline-none focus:border-blue-500/50 transition-colors mb-3"
            />
            <div className="flex justify-end">
              <button
                onClick={handleReply}
                disabled={sending || !replyText.trim()}
                className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 active:scale-95 text-white text-sm font-medium transition-all disabled:opacity-50"
              >
                {sending ? 'Enviando...' : 'Enviar como Soporte'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
