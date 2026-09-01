'use client'
import { useCallback, useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { getPlanLabel } from '@/lib/plans'

const BACKEND_URL = 'https://orbyx-backend.onrender.com'

type TenantDetail = {
  ok: boolean
  tenant: {
    id: string
    name: string
    slug: string
    business_category: string
    business_category_label: string
    business_subtype: string | null
    phone: string | null
    email: string | null
    whatsapp: string | null
    address: string | null
    created_at: string
  }
  plan: {
    plan_slug: string
    status: 'active' | 'trial' | 'expired_or_canceled'
    amount: number
    subscription_status: string
    periodicidad: string | null
    trial_ends_at: string | null
    billing_cycle_start: string | null
    billing_cycle_end: string | null
    scheduled_plan_slug: string | null
    scheduled_change_at: string | null
    pending_change_type: string | null
  }
  addons: Array<{
    addon_key: string
    name: string
    quantity: number
    balance: number
    renewal_mode: string
    last_charged_at: string | null
    approx_next_renewal_at: string | null
  }>
  branches: Array<{
    id: string
    name: string
    slug: string
    address: string | null
    city: string | null
    commune: string | null
    phone: string | null
    is_active: boolean
  }>
  owners: Array<{
    user_id: string
    email: string | null
    name: string | null
    phone: string | null
  }>
  plan_change_history: {
    entries: unknown[]
    note: string
  }
  error?: string
}

type AdminNote = {
  id: string
  admin_email: string | null
  note: string
  created_at: string
}

type AdminTicket = {
  id: string
  subject: string
  status: string
  priority: string
  category: string
  created_at: string
}

const TICKET_STATUS_LABEL: Record<string, string> = {
  open: 'Abierto',
  answered: 'Respondido',
  waiting_confirmation: 'Esperando confirmación',
  reopened: 'Reabierto',
  closed: 'Cerrado',
}

const TICKET_OPEN_STATUSES = ['open', 'answered', 'waiting_confirmation', 'reopened']

const STATUS_LABEL: Record<string, string> = {
  active: 'Activo',
  trial: 'En prueba',
  expired_or_canceled: 'Vencido/cancelado',
}

function formatCLP(value: number) {
  return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(value)
}

function formatDate(value?: string | null) {
  if (!value) return 'Sin fecha'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Sin fecha'
  return new Intl.DateTimeFormat('es-CL', { dateStyle: 'medium', timeStyle: 'short' }).format(date)
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-blue-900/25 p-4" style={{ background: '#0f1729' }}>
      <h2 className="text-sm font-semibold text-white mb-3">{title}</h2>
      {children}
    </div>
  )
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs text-blue-300/50">{label}</p>
      <p className="text-sm text-white mt-0.5">{value ?? '—'}</p>
    </div>
  )
}

export default function AdminTenantDetailPage() {
  const router = useRouter()
  const params = useParams()
  const id = params?.id as string

  const [data, setData] = useState<TenantDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [confirmText, setConfirmText] = useState('')
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState('')
  const [showFinalDeleteModal, setShowFinalDeleteModal] = useState(false)
  const [finalConfirmText, setFinalConfirmText] = useState('')

  const [notes, setNotes] = useState<AdminNote[]>([])
  const [notesLoading, setNotesLoading] = useState(true)
  const [newNote, setNewNote] = useState('')
  const [savingNote, setSavingNote] = useState(false)
  const [noteError, setNoteError] = useState('')

  const [tickets, setTickets] = useState<AdminTicket[]>([])
  const [ticketsLoading, setTicketsLoading] = useState(true)
  const [showAllTickets, setShowAllTickets] = useState(false)

  const [viewSessionLoading, setViewSessionLoading] = useState(false)
  const [viewSessionError, setViewSessionError] = useState('')

  const [resendingWelcome, setResendingWelcome] = useState(false)
  const [sendingReset, setSendingReset] = useState(false)
  const [emailActionMessage, setEmailActionMessage] = useState('')

  const getToken = useCallback(async () => {
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()
    return session?.access_token
  }, [])

  const authFetch = useCallback(async (path: string, init?: RequestInit) => {
    const token = await getToken()
    if (!token) return null
    return fetch(`${BACKEND_URL}${path}`, {
      ...init,
      headers: { ...(init?.headers || {}), Authorization: `Bearer ${token}` },
    })
  }, [getToken])

  const handleDeleteTenant = useCallback(async () => {
    if (!data) return
    setDeleting(true)
    setDeleteError('')
    try {
      const res = await authFetch(`/admin/tenants/${id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirm_slug: confirmText }),
      })
      const json = res ? await res.json() : null
      if (!res || !res.ok || !json?.ok) {
        throw new Error(json?.error || 'Error borrando el tenant')
      }
      router.push('/admin/tenants')
    } catch (e) {
      setDeleteError(e instanceof Error ? e.message : 'Error borrando el tenant')
      setDeleting(false)
    }
  }, [authFetch, confirmText, data, id, router])

  const loadTenant = useCallback(async () => {
    if (!id) return
    setLoading(true)
    setError('')
    try {
      const res = await authFetch(`/admin/tenants/${id}`)
      const json = res ? await res.json() : null
      if (!res || !res.ok || !json?.ok) {
        throw new Error(json?.error || 'Error cargando tenant')
      }
      setData(json)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error cargando tenant')
      setData(null)
    } finally {
      setLoading(false)
    }
  }, [authFetch, id])

  const loadNotes = useCallback(async () => {
    if (!id) return
    setNotesLoading(true)
    try {
      const res = await authFetch(`/admin/tenants/${id}/notes`)
      const json = res ? await res.json() : null
      setNotes(json?.ok ? json.notes : [])
    } catch (e) {
      console.error('Error cargando notas:', e)
    } finally {
      setNotesLoading(false)
    }
  }, [authFetch, id])

  const handleAddNote = useCallback(async () => {
    if (!newNote.trim()) return
    setSavingNote(true)
    setNoteError('')
    try {
      const res = await authFetch(`/admin/tenants/${id}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ note: newNote.trim() }),
      })
      const json = res ? await res.json() : null
      if (!res || !res.ok || !json?.ok) {
        throw new Error(json?.error || 'Error agregando la nota')
      }
      setNotes((prev) => [json.note, ...prev])
      setNewNote('')
    } catch (e) {
      setNoteError(e instanceof Error ? e.message : 'Error agregando la nota')
    } finally {
      setSavingNote(false)
    }
  }, [authFetch, id, newNote])

  const handleViewAsTenant = useCallback(async () => {
    if (!data) return
    const confirmed = window.confirm(
      `Vas a ver el dashboard de "${data.tenant.name}" con la sesión real de su dueño.\n\n` +
      'Esto reemplazará tu sesión de administrador en este navegador: para volver al panel admin ' +
      'vas a tener que iniciar sesión de nuevo (con MFA).\n\n¿Continuar?'
    )
    if (!confirmed) return

    setViewSessionLoading(true)
    setViewSessionError('')
    try {
      const res = await authFetch(`/admin/tenants/${id}/view-session`, { method: 'POST' })
      const json = res ? await res.json() : null
      if (!res || !res.ok || !json?.ok) {
        throw new Error(json?.error || 'Error generando la sesión de vista')
      }
      const hash = `access_token=${encodeURIComponent(json.access_token)}&refresh_token=${encodeURIComponent(json.refresh_token)}&slug=${encodeURIComponent(json.slug)}`
      window.location.href = `/admin/view-tenant#${hash}`
    } catch (e) {
      setViewSessionError(e instanceof Error ? e.message : 'Error generando la sesión de vista')
      setViewSessionLoading(false)
    }
  }, [authFetch, data, id])

  const handleResendWelcomeEmail = useCallback(async () => {
    setResendingWelcome(true)
    setEmailActionMessage('')
    try {
      const res = await authFetch(`/admin/tenants/${id}/resend-welcome-email`, { method: 'POST' })
      const json = res ? await res.json() : null
      if (!res || !res.ok || !json?.ok) {
        throw new Error(json?.error || 'Error reenviando el email de bienvenida')
      }
      setEmailActionMessage(`Email de bienvenida reenviado a ${json.owner_email}.`)
    } catch (e) {
      setEmailActionMessage(e instanceof Error ? e.message : 'Error reenviando el email de bienvenida')
    } finally {
      setResendingWelcome(false)
    }
  }, [authFetch, id])

  const handleSendPasswordReset = useCallback(async () => {
    setSendingReset(true)
    setEmailActionMessage('')
    try {
      const res = await authFetch(`/admin/tenants/${id}/send-password-reset`, { method: 'POST' })
      const json = res ? await res.json() : null
      if (!res || !res.ok || !json?.ok) {
        throw new Error(json?.error || 'Error enviando el reset de contraseña')
      }
      setEmailActionMessage(`Link de reset de contraseña enviado a ${json.owner_email}.`)
    } catch (e) {
      setEmailActionMessage(e instanceof Error ? e.message : 'Error enviando el reset de contraseña')
    } finally {
      setSendingReset(false)
    }
  }, [authFetch, id])

  const loadTickets = useCallback(async () => {
    if (!id) return
    setTicketsLoading(true)
    try {
      const res = await authFetch(`/admin/tickets?tenant_id=${id}`)
      const json = res ? await res.json() : null
      setTickets(Array.isArray(json) ? json : [])
    } catch (e) {
      console.error('Error cargando tickets:', e)
    } finally {
      setTicketsLoading(false)
    }
  }, [authFetch, id])

  useEffect(() => { loadTenant() }, [loadTenant])
  useEffect(() => { loadNotes() }, [loadNotes])
  useEffect(() => { loadTickets() }, [loadTickets])

  if (loading) {
    return <div className="p-6"><p className="text-sm text-blue-300/50">Cargando...</p></div>
  }

  if (error || !data) {
    return (
      <div className="p-6 space-y-4">
        <button onClick={() => router.push('/admin/tenants')} className="text-sm text-blue-300/60 hover:text-blue-200">
          ← Volver al directorio
        </button>
        <div className="rounded-2xl border border-rose-900/40 p-4" style={{ background: 'rgba(244,63,94,0.08)' }}>
          <p className="text-sm text-rose-300">{error || 'No se pudo cargar el tenant'}</p>
        </div>
      </div>
    )
  }

  const { tenant, plan, addons, branches, owners, plan_change_history } = data

  return (
    <div className="p-6 space-y-6">
      <button onClick={() => router.push('/admin/tenants')} className="text-sm text-blue-300/60 hover:text-blue-200">
        ← Volver al directorio
      </button>

      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-lg font-semibold text-white mb-1">{tenant.name}</h1>
          <p className="text-sm text-blue-300/50">
            {tenant.slug} · {tenant.business_category_label} · {STATUS_LABEL[plan.status] || plan.status}
          </p>
        </div>
        <div className="shrink-0 flex flex-col items-end gap-1.5">
          <div className="flex items-center gap-2">
            <button
              onClick={handleViewAsTenant}
              disabled={viewSessionLoading}
              className="text-sm font-medium text-blue-300 border border-blue-900/40 rounded-lg px-3 py-1.5 hover:bg-blue-900/10 transition-colors disabled:opacity-50"
            >
              {viewSessionLoading ? 'Generando sesión...' : 'Ver dashboard de este tenant'}
            </button>
            <button
              onClick={() => { setDeleteError(''); setConfirmText(''); setShowDeleteModal(true) }}
              className="text-sm font-medium text-rose-300 border border-rose-900/40 rounded-lg px-3 py-1.5 hover:bg-rose-900/10 transition-colors"
            >
              Eliminar tenant
            </button>
          </div>
          {viewSessionError ? <p className="text-xs text-rose-300">{viewSessionError}</p> : null}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Section title="Datos de contacto">
          {owners.length === 0 ? (
            <p className="text-sm text-blue-300/40">No se encontró un usuario con rol "owner" activo para este tenant.</p>
          ) : (
            <div className="space-y-3">
              {owners.map((owner) => (
                <div key={owner.user_id} className="grid grid-cols-3 gap-3">
                  <Field label="Email" value={owner.email} />
                  <Field label="Nombre" value={<span className="text-blue-300/40 italic">No disponible — no se guarda hoy</span>} />
                  <Field
                    label="Teléfono"
                    value={
                      owner.phone || (
                        <span className="text-blue-300/40 italic">
                          No disponible — se registró antes de pedirse este dato
                        </span>
                      )
                    }
                  />
                </div>
              ))}
            </div>
          )}
          <p className="mt-3 text-xs text-blue-300/40">
            Nombre del administrador no está modelado en ningún lugar hoy (solo email vía la cuenta de login). El teléfono sí se pide y guarda desde el registro de negocios nuevos — tenants anteriores a ese cambio quedan sin este dato.
          </p>
          {owners.length > 0 ? (
            <div className="mt-3 pt-3 border-t border-blue-900/15 flex flex-wrap gap-2 items-center">
              <button
                onClick={handleResendWelcomeEmail}
                disabled={resendingWelcome}
                className="text-xs font-medium text-blue-300 border border-blue-900/40 rounded-lg px-2.5 py-1 hover:bg-blue-900/10 transition-colors disabled:opacity-50"
              >
                {resendingWelcome ? 'Enviando...' : 'Reenviar email de bienvenida'}
              </button>
              <button
                onClick={handleSendPasswordReset}
                disabled={sendingReset}
                className="text-xs font-medium text-blue-300 border border-blue-900/40 rounded-lg px-2.5 py-1 hover:bg-blue-900/10 transition-colors disabled:opacity-50"
              >
                {sendingReset ? 'Enviando...' : 'Enviar reset de contraseña'}
              </button>
            </div>
          ) : null}
          {emailActionMessage ? <p className="mt-2 text-xs text-blue-300/60">{emailActionMessage}</p> : null}
        </Section>

        <Section title="Identificación">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Slug" value={tenant.slug} />
            <Field label="ID interno" value={<span className="text-xs break-all">{tenant.id}</span>} />
            <Field label="Tipo de negocio" value={tenant.business_category_label} />
            <Field label="Subtipo" value={tenant.business_subtype} />
            <Field label="Teléfono del negocio" value={tenant.phone} />
            <Field label="Email del negocio" value={tenant.email} />
            <Field label="Fecha de registro" value={formatDate(tenant.created_at)} />
          </div>
        </Section>

        <Section title="Plan y facturación">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Plan actual" value={getPlanLabel(plan.plan_slug)} />
            <Field label="Monto" value={formatCLP(plan.amount)} />
            <Field label="Estado suscripción (Flow)" value={plan.subscription_status} />
            <Field label="Periodicidad" value={plan.periodicidad} />
            <Field label="Fin de prueba" value={formatDate(plan.trial_ends_at)} />
            <Field label="Ciclo de facturación termina" value={formatDate(plan.billing_cycle_end)} />
            {plan.scheduled_plan_slug ? (
              <Field
                label="Cambio programado"
                value={`${plan.pending_change_type === 'downgrade' ? 'Downgrade' : 'Cambio'} a ${getPlanLabel(plan.scheduled_plan_slug)} el ${formatDate(plan.scheduled_change_at)}`}
              />
            ) : null}
          </div>
        </Section>

        <Section title="Sucursales">
          {branches.length === 0 ? (
            <p className="text-sm text-blue-300/40">Sin sucursales.</p>
          ) : (
            <div className="space-y-2">
              {branches.map((b) => (
                <div key={b.id} className="flex items-center justify-between border-b border-blue-900/10 last:border-0 pb-2 last:pb-0">
                  <div>
                    <p className="text-sm text-white">{b.name}</p>
                    <p className="text-xs text-blue-300/40">{[b.commune, b.city].filter(Boolean).join(', ') || b.address || 'Sin dirección'}</p>
                  </div>
                  <span
                    className="text-[11px] font-semibold px-2 py-0.5 rounded-full"
                    style={{
                      background: b.is_active ? 'rgba(16,185,129,0.12)' : 'rgba(148,163,184,0.12)',
                      color: b.is_active ? 'rgb(16 185 129)' : 'rgb(148 163 184)',
                    }}
                  >
                    {b.is_active ? 'Activa' : 'Inactiva'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </Section>
      </div>

      <Section title="Add-ons activos">
        {addons.length === 0 ? (
          <p className="text-sm text-blue-300/40">Sin add-ons activos.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-blue-300/50 border-b border-blue-900/25">
                  <th className="py-2 pr-4 font-medium">Add-on</th>
                  <th className="py-2 pr-4 font-medium">Cantidad</th>
                  <th className="py-2 pr-4 font-medium">Saldo</th>
                  <th className="py-2 pr-4 font-medium">Renovación</th>
                  <th className="py-2 pr-4 font-medium">Último cobro</th>
                  <th className="py-2 pr-4 font-medium">Próxima renovación (aprox.)</th>
                </tr>
              </thead>
              <tbody>
                {addons.map((a) => (
                  <tr key={a.addon_key} className="border-b border-blue-900/10 last:border-0">
                    <td className="py-2 pr-4 text-white">{a.name}</td>
                    <td className="py-2 pr-4 text-blue-100">{a.quantity}</td>
                    <td className="py-2 pr-4 text-blue-100">{a.balance}</td>
                    <td className="py-2 pr-4 text-blue-100">{a.renewal_mode}</td>
                    <td className="py-2 pr-4 text-blue-300/60">{formatDate(a.last_charged_at)}</td>
                    <td className="py-2 pr-4 text-blue-300/60">
                      {a.approx_next_renewal_at ? formatDate(a.approx_next_renewal_at) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Section>

      <Section title="Tickets de soporte">
        {ticketsLoading ? (
          <p className="text-sm text-blue-300/40">Cargando tickets...</p>
        ) : tickets.length === 0 ? (
          <p className="text-sm text-blue-300/40">Sin tickets de soporte.</p>
        ) : (
          (() => {
            const openTickets = tickets.filter((t) => TICKET_OPEN_STATUSES.includes(t.status) && t.status !== 'closed')
            const visible = showAllTickets ? tickets : openTickets
            return (
              <div className="space-y-2">
                {visible.length === 0 ? (
                  <p className="text-sm text-blue-300/40">Sin tickets abiertos/pendientes.</p>
                ) : (
                  visible.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => router.push(`/admin/tickets/${t.id}`)}
                      className="w-full text-left rounded-lg border border-blue-900/20 hover:border-blue-700/40 px-3 py-2 transition-colors"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm text-white">{t.subject}</p>
                        <span className="text-xs text-blue-300/50 shrink-0">{TICKET_STATUS_LABEL[t.status] || t.status}</span>
                      </div>
                      <p className="text-xs text-blue-300/40 mt-0.5">{t.category} · {formatDate(t.created_at)}</p>
                    </button>
                  ))
                )}
                {!showAllTickets && tickets.length > openTickets.length ? (
                  <button
                    onClick={() => setShowAllTickets(true)}
                    className="text-xs text-blue-300/60 hover:text-blue-200 pt-1"
                  >
                    Ver todos ({tickets.length}) →
                  </button>
                ) : null}
              </div>
            )
          })()
        )}
      </Section>

      <Section title="Historial de cambios de plan">
        {plan_change_history.entries.length === 0 ? (
          <p className="text-sm text-blue-300/40">{plan_change_history.note}</p>
        ) : null}
      </Section>

      <Section title="Notas internas (solo Super Admin)">
        <div className="space-y-2 mb-4">
          <textarea
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            placeholder="Agregar una nota interna sobre este tenant..."
            rows={3}
            className="w-full bg-[#0a0f1e] border border-blue-900/30 rounded-lg px-3 py-2 text-sm text-white placeholder:text-blue-300/30 focus:outline-none focus:border-blue-500/50 resize-none"
          />
          {noteError ? <p className="text-sm text-rose-300">{noteError}</p> : null}
          <div className="flex justify-end">
            <button
              onClick={handleAddNote}
              disabled={!newNote.trim() || savingNote}
              className="text-sm font-medium text-white bg-blue-600 rounded-lg px-3 py-1.5 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-blue-500 transition-colors"
            >
              {savingNote ? 'Guardando...' : 'Agregar nota'}
            </button>
          </div>
        </div>
        {notesLoading ? (
          <p className="text-sm text-blue-300/40">Cargando notas...</p>
        ) : notes.length === 0 ? (
          <p className="text-sm text-blue-300/40">Sin notas registradas.</p>
        ) : (
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {notes.map((n) => (
              <div key={n.id} className="border-b border-blue-900/10 last:border-0 pb-2 last:pb-0">
                <p className="text-sm text-white whitespace-pre-wrap">{n.note}</p>
                <p className="text-xs text-blue-300/40 mt-0.5">{n.admin_email || 'admin'} · {formatDate(n.created_at)}</p>
              </div>
            ))}
          </div>
        )}
      </Section>

      {showDeleteModal ? (
        <div className="fixed inset-0 z-[90] flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.6)' }}>
          <div
            className="w-full max-w-md rounded-2xl border border-rose-900/40 p-5"
            style={{ background: '#0f1729' }}
          >
            <h2 className="text-base font-semibold text-white mb-2">Eliminar tenant "{tenant.name}"</h2>
            <p className="text-sm text-blue-300/60 mb-3">
              Esta acción es <strong className="text-rose-300">irreversible</strong>. Se borrarán permanentemente:
            </p>
            <ul className="text-sm text-blue-100 list-disc list-inside space-y-0.5 mb-4">
              <li>Reservas, clientes, pacientes y fichas clínicas</li>
              <li>Servicios, staff, horarios y sucursales</li>
              <li>Campañas, add-ons, suscripción y uso mensual</li>
              <li>Tickets de soporte, invitaciones y aceptaciones legales</li>
              <li>Archivos (logo, comprobantes de depósito, fotos de staff, imágenes de campañas)</li>
              <li>El usuario de acceso del dueño, si no pertenece a otro negocio</li>
            </ul>
            <p className="text-sm text-blue-300/60 mb-2">
              Para confirmar, escribe el slug exacto <strong className="text-white">{tenant.slug}</strong>:
            </p>
            <input
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder={tenant.slug}
              className="w-full bg-[#0a0f1e] border border-blue-900/30 rounded-lg px-3 py-1.5 text-sm text-white placeholder:text-blue-300/30 focus:outline-none focus:border-rose-500/50 mb-3"
              autoFocus
            />
            {deleteError ? <p className="text-sm text-rose-300 mb-3">{deleteError}</p> : null}
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowDeleteModal(false)}
                disabled={deleting}
                className="text-sm text-blue-300/60 hover:text-blue-200 px-3 py-1.5 disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={() => { setFinalConfirmText(''); setShowFinalDeleteModal(true) }}
                disabled={confirmText !== tenant.slug || deleting}
                className="text-sm font-semibold text-white bg-rose-600 rounded-lg px-3 py-1.5 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-rose-500 transition-colors"
              >
                Continuar
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {showFinalDeleteModal ? (
        <div className="fixed inset-0 z-[95] flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.75)' }}>
          <div
            className="w-full max-w-md rounded-2xl border-2 border-rose-500 p-6"
            style={{ background: '#1a0a0e' }}
          >
            <h2 className="text-xl font-bold text-rose-300 mb-3">
              ¿Estás seguro que quieres eliminar el tenant "{tenant.name}"? Esta acción es irreversible.
            </h2>
            <p className="text-sm text-blue-300/60 mb-2">
              Para confirmar, escribe <strong className="text-rose-300">BORRAR</strong>:
            </p>
            <input
              value={finalConfirmText}
              onChange={(e) => setFinalConfirmText(e.target.value)}
              placeholder="BORRAR"
              className="w-full bg-[#0a0f1e] border border-rose-900/50 rounded-lg px-3 py-1.5 text-sm text-white placeholder:text-blue-300/30 focus:outline-none focus:border-rose-500 mb-3"
              autoFocus
            />
            {deleteError ? <p className="text-sm text-rose-300 mb-3">{deleteError}</p> : null}
            <div className="flex justify-end gap-2">
              <button
                onClick={() => { setShowFinalDeleteModal(false); setShowDeleteModal(false) }}
                disabled={deleting}
                className="text-sm text-blue-300/60 hover:text-blue-200 px-3 py-1.5 disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleDeleteTenant}
                disabled={finalConfirmText !== 'BORRAR' || deleting}
                className="text-sm font-semibold text-white bg-rose-600 rounded-lg px-3 py-1.5 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-rose-500 transition-colors"
              >
                {deleting ? 'Eliminando...' : 'Eliminar definitivamente'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
