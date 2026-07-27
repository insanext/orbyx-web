'use client'
import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

const BACKEND_URL = 'https://orbyx-backend.onrender.com'

const PLAN_BADGE: Record<string, { label: string; color: string }> = {
  platinum: { label: 'Platinum', color: 'bg-pink-500/15 text-pink-300 border-pink-500/25' },
  vip: { label: 'VIP', color: 'bg-amber-500/15 text-amber-300 border-amber-500/25' },
  premium: { label: 'Premium', color: 'bg-purple-500/15 text-purple-300 border-purple-500/25' },
  pro: { label: 'Pro', color: 'bg-blue-500/15 text-blue-300 border-blue-500/25' },
}

const PRIORITY_BADGE: Record<string, { label: string; color: string }> = {
  maxima: { label: 'Máxima', color: 'bg-pink-500/15 text-pink-300 border-pink-500/25' },
  alta: { label: 'Alta', color: 'bg-amber-500/15 text-amber-300 border-amber-500/25' },
  media: { label: 'Media', color: 'bg-purple-500/15 text-purple-300 border-purple-500/25' },
  normal: { label: 'Normal', color: 'bg-blue-900/30 text-blue-300/70 border-blue-900/30' },
}

const STATUS_OPTIONS = [
  { value: '', label: 'Todos' },
  { value: 'open', label: 'Abiertos' },
  { value: 'answered', label: 'Respondidos' },
  { value: 'waiting_confirmation', label: 'Esperando confirmación' },
  { value: 'reopened', label: 'Reabiertos' },
  { value: 'closed', label: 'Cerrados' },
]

const STATUS_COLOR: Record<string, string> = {
  open: 'text-blue-400',
  answered: 'text-green-400',
  waiting_confirmation: 'text-amber-400',
  closed: 'text-gray-400',
  reopened: 'text-pink-400',
}

export default function AdminTicketsPage() {
  const router = useRouter()
  const [tickets, setTickets] = useState<any[]>([])
  const [statusFilter, setStatusFilter] = useState('')
  const [loading, setLoading] = useState(true)

  const getToken = useCallback(async () => {
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()
    return session?.access_token
  }, [])

  const loadTickets = useCallback(async (status?: string) => {
    setLoading(true)
    try {
      const token = await getToken()
      if (!token) { router.push('/admin/login'); return }
      const url = status
        ? `${BACKEND_URL}/admin/tickets?status=${status}`
        : `${BACKEND_URL}/admin/tickets`
      const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } })
      if (res.status === 401 || res.status === 403) { router.push('/admin/login'); return }
      const data = await res.json()
      setTickets(Array.isArray(data) ? data : [])
    } catch (e) {
      console.error('Error cargando tickets:', e)
    } finally {
      setLoading(false)
    }
  }, [getToken, router])

  useEffect(() => { loadTickets(statusFilter || undefined) }, [statusFilter, loadTickets])

  return (
    <div className="p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-lg font-semibold text-white">Tickets de Soporte</h1>
            <p className="text-sm text-blue-300/50">{tickets.length} ticket{tickets.length !== 1 ? 's' : ''}</p>
          </div>
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="bg-[#0a0f1e] border border-blue-900/30 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500/50"
          >
            {STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>

        {loading ? (
          <p className="text-sm text-blue-300/50 text-center py-8">Cargando...</p>
        ) : tickets.length === 0 ? (
          <p className="text-sm text-blue-300/50 text-center py-8">No hay tickets.</p>
        ) : (
          <div className="space-y-2">
            {tickets.map(t => {
              const plan = PLAN_BADGE[t.tenant_plan] ?? PLAN_BADGE.pro
              const prio = PRIORITY_BADGE[t.priority] ?? PRIORITY_BADGE.normal
              const statusColor = STATUS_COLOR[t.status] ?? 'text-gray-400'
              return (
                <button
                  key={t.id}
                  onClick={() => router.push(`/admin/tickets/${t.id}`)}
                  className="w-full text-left rounded-2xl border border-blue-900/25 hover:border-blue-700/40 p-4 transition-colors relative"
                  style={{ background: '#0f1729' }}
                >
                  {t.has_unread_for_customer === false && t.status === 'open' && (
                    <span className="absolute top-3 right-3 w-2.5 h-2.5 bg-blue-500 rounded-full" />
                  )}
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className={`text-xs px-2 py-0.5 rounded-full border ${plan.color}`}>{plan.label}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full border ${prio.color}`}>{prio.label}</span>
                    <span className="text-xs text-blue-300/30 ml-auto">{t.tenant_name}</span>
                  </div>
                  <p className="text-sm font-medium text-white mb-1">{t.subject}</p>
                  <div className="flex items-center gap-3 text-xs">
                    <span className={statusColor}>{STATUS_OPTIONS.find(o => o.value === t.status)?.label ?? t.status}</span>
                    <span className="text-blue-900/40">
                      {new Date(t.created_at).toLocaleDateString('es-CL', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <span className="text-blue-900/40">{t.category}</span>
                  </div>
                </button>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
