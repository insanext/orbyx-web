'use client'
import { useCallback, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { getPlanLabel } from '@/lib/plans'

const BACKEND_URL = 'https://orbyx-backend.onrender.com'

type EstadisticasResponse = {
  ok: boolean
  tenants: {
    active: number
    trial: number
    expired_or_canceled: number
    total: number
  }
  revenue: {
    total_mrr: number
    by_plan: Record<string, number>
    currency: string
    note: string
  }
  visits: {
    total: number
  }
  flow_mode: 'sandbox' | 'live'
  error?: string
}

function formatCLP(value: number) {
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    maximumFractionDigits: 0,
  }).format(value)
}

function StatTile({
  label,
  value,
  helper,
}: {
  label: string
  value: string
  helper?: string
}) {
  return (
    <div
      className="rounded-2xl border border-blue-900/25 p-4"
      style={{ background: '#0f1729' }}
    >
      <p className="text-xs text-blue-300/50">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-white">{value}</p>
      {helper ? <p className="mt-1 text-xs text-blue-300/40">{helper}</p> : null}
    </div>
  )
}

export default function AdminEstadisticasPage() {
  const [stats, setStats] = useState<EstadisticasResponse | null>(null)
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
    return fetch(`${BACKEND_URL}${path}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
  }, [getToken])

  const loadStats = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = await authFetch('/admin/estadisticas')
      const data = res ? await res.json() : null
      if (!res || !res.ok || !data?.ok) {
        throw new Error(data?.error || 'Error cargando estadísticas')
      }
      setStats(data)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error cargando estadísticas')
      setStats(null)
    } finally {
      setLoading(false)
    }
  }, [authFetch])

  useEffect(() => { loadStats() }, [loadStats])

  if (loading) {
    return <div className="p-6"><p className="text-sm text-blue-300/50">Cargando...</p></div>
  }

  return (
    <div className="p-6 space-y-10">
      <div>
        <h1 className="text-lg font-semibold text-white mb-1">Estadísticas del negocio</h1>
        <p className="text-sm text-blue-300/50 mb-6">
          Vista general de tenants, ingresos recurrentes y tráfico a la página pública.
        </p>

        {error ? (
          <div className="rounded-2xl border border-rose-900/40 p-4 mb-6" style={{ background: 'rgba(244,63,94,0.08)' }}>
            <p className="text-sm text-rose-300">{error}</p>
            <button
              onClick={loadStats}
              className="mt-2 text-xs text-rose-200 underline"
            >
              Reintentar
            </button>
          </div>
        ) : null}

        {stats ? (
          <div className="space-y-8">
            <div>
              <h2 className="text-sm font-semibold text-white mb-3">Tenants por estado</h2>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <StatTile label="Activos" value={String(stats.tenants.active)} />
                <StatTile label="En prueba" value={String(stats.tenants.trial)} />
                <StatTile label="Vencidos / cancelados" value={String(stats.tenants.expired_or_canceled)} />
                <StatTile label="Total tenants" value={String(stats.tenants.total)} />
              </div>
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-3 mb-3">
                <h2 className="text-sm font-semibold text-white">Ingresos</h2>
                {stats.flow_mode === 'sandbox' ? (
                  <span
                    className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold"
                    style={{
                      borderColor: 'rgba(245,158,11,0.35)',
                      background: 'rgba(245,158,11,0.12)',
                      color: 'rgb(245 158 11)',
                    }}
                  >
                    Datos de prueba — Flow en modo sandbox
                  </span>
                ) : null}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                <StatTile
                  label="Ingresos por plan (no incluye add-ons)"
                  value={formatCLP(stats.revenue.total_mrr)}
                  helper="MRR actual, neto sin IVA. Solo tenants con suscripción activa."
                />
              </div>

              {Object.keys(stats.revenue.by_plan).length > 0 ? (
                <div
                  className="rounded-2xl border border-blue-900/25 overflow-hidden mb-4"
                  style={{ background: '#0f1729' }}
                >
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-xs text-blue-300/50 border-b border-blue-900/25">
                        <th className="px-4 py-2 font-medium">Plan</th>
                        <th className="px-4 py-2 font-medium text-right">Ingresos por plan</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(stats.revenue.by_plan).map(([plan, amount]) => (
                        <tr key={plan} className="border-b border-blue-900/10 last:border-0">
                          <td className="px-4 py-2 text-blue-100">{getPlanLabel(plan)}</td>
                          <td className="px-4 py-2 text-right text-white">{formatCLP(amount)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : null}

              <p className="text-xs text-blue-300/40">{stats.revenue.note}</p>
            </div>

            <div>
              <h2 className="text-sm font-semibold text-white mb-3">Visitas</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <StatTile
                  label="Visitas totales a la página pública"
                  value={String(stats.visits.total)}
                  helper="Contador simple acumulado (no es un dashboard de analytics — sin desglose por fecha, sesión o dispositivo)."
                />
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  )
}
