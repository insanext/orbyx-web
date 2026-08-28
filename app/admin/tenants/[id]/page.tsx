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

  const getToken = useCallback(async () => {
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()
    return session?.access_token
  }, [])

  const authFetch = useCallback(async (path: string) => {
    const token = await getToken()
    if (!token) return null
    return fetch(`${BACKEND_URL}${path}`, { headers: { Authorization: `Bearer ${token}` } })
  }, [getToken])

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

  useEffect(() => { loadTenant() }, [loadTenant])

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

      <div>
        <h1 className="text-lg font-semibold text-white mb-1">{tenant.name}</h1>
        <p className="text-sm text-blue-300/50">
          {tenant.slug} · {tenant.business_category_label} · {STATUS_LABEL[plan.status] || plan.status}
        </p>
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

      <Section title="Historial de cambios de plan">
        {plan_change_history.entries.length === 0 ? (
          <p className="text-sm text-blue-300/40">{plan_change_history.note}</p>
        ) : null}
      </Section>
    </div>
  )
}
