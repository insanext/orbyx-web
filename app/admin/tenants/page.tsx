'use client'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { getPlanLabel } from '@/lib/plans'

const BACKEND_URL = 'https://orbyx-backend.onrender.com'

type TenantRow = {
  id: string
  name: string
  slug: string
  owner_name: string | null
  plan_slug: string
  amount: number
  addons_summary: string
  business_category: string
  business_category_label: string
  status: 'active' | 'trial' | 'expired_or_canceled'
  created_at: string
}

const STATUS_LABEL: Record<TenantRow['status'], string> = {
  active: 'Activo',
  trial: 'En prueba',
  expired_or_canceled: 'Vencido/cancelado',
}

const STATUS_STYLE: Record<TenantRow['status'], { bg: string; color: string; border: string }> = {
  active: { bg: 'rgba(16,185,129,0.12)', color: 'rgb(16 185 129)', border: 'rgba(16,185,129,0.30)' },
  trial: { bg: 'rgba(245,158,11,0.12)', color: 'rgb(245 158 11)', border: 'rgba(245,158,11,0.30)' },
  expired_or_canceled: { bg: 'rgba(244,63,94,0.12)', color: 'rgb(244 63 94)', border: 'rgba(244,63,94,0.30)' },
}

function formatCLP(value: number) {
  return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(value)
}

function StatusBadge({ status }: { status: TenantRow['status'] }) {
  const style = STATUS_STYLE[status]
  return (
    <span
      className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold"
      style={{ background: style.bg, color: style.color, borderColor: style.border }}
    >
      {STATUS_LABEL[status]}
    </span>
  )
}

export default function AdminTenantsPage() {
  const router = useRouter()
  const [tenants, setTenants] = useState<TenantRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [search, setSearch] = useState('')
  const [planFilter, setPlanFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [categoryFilter, setCategoryFilter] = useState('all')

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

  const loadTenants = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = await authFetch('/admin/tenants')
      const data = res ? await res.json() : null
      if (!res || !res.ok || !data?.ok) {
        throw new Error(data?.error || 'Error cargando tenants')
      }
      setTenants(Array.isArray(data.tenants) ? data.tenants : [])
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error cargando tenants')
      setTenants([])
    } finally {
      setLoading(false)
    }
  }, [authFetch])

  useEffect(() => { loadTenants() }, [loadTenants])

  const planOptions = useMemo(
    () => Array.from(new Set(tenants.map((t) => t.plan_slug))).sort(),
    [tenants]
  )
  const categoryOptions = useMemo(
    () => Array.from(new Set(tenants.map((t) => t.business_category))).sort(),
    [tenants]
  )

  const filteredTenants = useMemo(() => {
    const q = search.trim().toLowerCase()
    return tenants.filter((t) => {
      const matchesSearch = !q || t.name.toLowerCase().includes(q) || t.slug.toLowerCase().includes(q)
      const matchesPlan = planFilter === 'all' || t.plan_slug === planFilter
      const matchesStatus = statusFilter === 'all' || t.status === statusFilter
      const matchesCategory = categoryFilter === 'all' || t.business_category === categoryFilter
      return matchesSearch && matchesPlan && matchesStatus && matchesCategory
    })
  }, [tenants, search, planFilter, statusFilter, categoryFilter])

  const selectClass = 'bg-[#0a0f1e] border border-blue-900/30 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-blue-500/50'

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-lg font-semibold text-white mb-1">Directorio de tenants</h1>
        <p className="text-sm text-blue-300/50 mb-6">
          {loading ? 'Cargando...' : `${filteredTenants.length} de ${tenants.length} tenants`}
        </p>
      </div>

      {error ? (
        <div className="rounded-2xl border border-rose-900/40 p-4" style={{ background: 'rgba(244,63,94,0.08)' }}>
          <p className="text-sm text-rose-300">{error}</p>
          <button onClick={loadTenants} className="mt-2 text-xs text-rose-200 underline">Reintentar</button>
        </div>
      ) : null}

      <div className="flex flex-wrap gap-3">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por nombre o slug..."
          className="bg-[#0a0f1e] border border-blue-900/30 rounded-lg px-3 py-1.5 text-sm text-white placeholder:text-blue-300/30 focus:outline-none focus:border-blue-500/50 min-w-[220px]"
        />
        <select value={planFilter} onChange={(e) => setPlanFilter(e.target.value)} className={selectClass}>
          <option value="all">Todos los planes</option>
          {planOptions.map((p) => <option key={p} value={p}>{getPlanLabel(p)}</option>)}
        </select>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className={selectClass}>
          <option value="all">Todos los estados</option>
          <option value="active">Activo</option>
          <option value="trial">En prueba</option>
          <option value="expired_or_canceled">Vencido/cancelado</option>
        </select>
        <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className={selectClass}>
          <option value="all">Todos los tipos de negocio</option>
          {categoryOptions.map((c) => {
            const t = tenants.find((t) => t.business_category === c)
            return <option key={c} value={c}>{t?.business_category_label || c}</option>
          })}
        </select>
      </div>

      {!loading && (
        <div className="rounded-2xl border border-blue-900/25 overflow-hidden" style={{ background: '#0f1729' }}>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-blue-300/50 border-b border-blue-900/25">
                <th className="px-4 py-2.5 font-medium">Negocio</th>
                <th className="px-4 py-2.5 font-medium">Plan</th>
                <th className="px-4 py-2.5 font-medium text-right">Monto</th>
                <th className="px-4 py-2.5 font-medium">Add-ons activos</th>
                <th className="px-4 py-2.5 font-medium">Tipo de negocio</th>
                <th className="px-4 py-2.5 font-medium">Estado</th>
              </tr>
            </thead>
            <tbody>
              {filteredTenants.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-blue-300/40">
                    No hay tenants que coincidan con los filtros.
                  </td>
                </tr>
              ) : (
                filteredTenants.map((t) => (
                  <tr
                    key={t.id}
                    onClick={() => router.push(`/admin/tenants/${t.id}`)}
                    className="border-b border-blue-900/10 last:border-0 cursor-pointer hover:bg-blue-900/10 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <p className="text-white font-medium">{t.name}</p>
                      <p className="text-xs text-blue-300/40">{t.slug}</p>
                      {t.owner_name ? (
                        <p className="text-xs text-blue-300/40">👤 {t.owner_name}</p>
                      ) : null}
                    </td>
                    <td className="px-4 py-3 text-blue-100">{getPlanLabel(t.plan_slug)}</td>
                    <td className="px-4 py-3 text-right text-white">{formatCLP(t.amount)}</td>
                    <td className="px-4 py-3 text-blue-300/60 text-xs max-w-[220px] truncate" title={t.addons_summary}>
                      {t.addons_summary || '—'}
                    </td>
                    <td className="px-4 py-3 text-blue-100">{t.business_category_label}</td>
                    <td className="px-4 py-3"><StatusBadge status={t.status} /></td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
