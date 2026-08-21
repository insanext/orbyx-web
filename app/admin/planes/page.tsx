'use client'
import { useCallback, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

const BACKEND_URL = 'https://orbyx-backend.onrender.com'

type PlanConfig = {
  plan_slug: string
  price_monthly: number
  price_semestral_discount_pct: number
  price_annual_discount_pct: number
  trial_days: number
  staff_limit: number
  services_limit: number
  branches_limit: number
  email_campaign_limit: number
  max_wa_confirmacion: number
  max_group_capacity: number
  max_campanas_wa: number
  is_active: boolean
}

type AddonConfig = {
  addon_key: string
  name: string
  description: string | null
  price: number
  promo_price: number | null
  promo_active: boolean
  promo_starts_at: string | null
  promo_ends_at: string | null
  pack2_price: number | null
  pack3_price: number | null
  pack_size: number
  min_plan: string
  available_for: string[]
  resets_monthly: boolean
  accumulates: boolean
  is_active: boolean
}

const ALL_PLANS = ['pro', 'premium', 'vip', 'platinum']

const PLAN_LABEL: Record<string, string> = {
  pro: 'Pro',
  premium: 'Premium',
  vip: 'VIP',
  platinum: 'Platinum',
}

function NumberField({
  label,
  value,
  onChange,
}: {
  label: string
  value: number
  onChange: (value: number) => void
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-xs text-blue-300/50">{label}</span>
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="bg-[#0a0f1e] border border-blue-900/30 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-blue-500/50"
      />
    </label>
  )
}

function ToggleField({
  label,
  checked,
  onChange,
}: {
  label: string
  checked: boolean
  onChange: (value: boolean) => void
}) {
  return (
    <label className="flex items-center gap-2 text-sm text-blue-200 cursor-pointer">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="w-4 h-4 accent-blue-500"
      />
      {label}
    </label>
  )
}

export default function AdminPlanesPage() {
  const [plans, setPlans] = useState<PlanConfig[]>([])
  const [addons, setAddons] = useState<AddonConfig[]>([])
  const [loading, setLoading] = useState(true)
  const [planStatus, setPlanStatus] = useState<Record<string, string>>({})
  const [addonStatus, setAddonStatus] = useState<Record<string, string>>({})
  const [planSaving, setPlanSaving] = useState<Record<string, boolean>>({})
  const [addonSaving, setAddonSaving] = useState<Record<string, boolean>>({})

  const getToken = useCallback(async () => {
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()
    return session?.access_token
  }, [])

  const authFetch = useCallback(async (path: string, opts: RequestInit = {}) => {
    const token = await getToken()
    if (!token) return null
    return fetch(`${BACKEND_URL}${path}`, {
      ...opts,
      headers: { ...(opts.headers as any), Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    })
  }, [getToken])

  const loadAll = useCallback(async () => {
    setLoading(true)
    try {
      const [plansRes, addonsRes] = await Promise.all([
        authFetch('/admin/plans'),
        authFetch('/admin/addons'),
      ])
      const plansData = plansRes ? await plansRes.json() : []
      const addonsData = addonsRes ? await addonsRes.json() : []
      setPlans(Array.isArray(plansData) ? plansData : [])
      setAddons(Array.isArray(addonsData) ? addonsData : [])
    } catch (e) {
      console.error('Error cargando planes/addons:', e)
    } finally {
      setLoading(false)
    }
  }, [authFetch])

  useEffect(() => { loadAll() }, [loadAll])

  function updatePlanField(slug: string, field: keyof PlanConfig, value: any) {
    setPlans((prev) => prev.map((p) => (p.plan_slug === slug ? { ...p, [field]: value } : p)))
  }

  function updateAddonField(key: string, field: keyof AddonConfig, value: any) {
    setAddons((prev) => prev.map((a) => (a.addon_key === key ? { ...a, [field]: value } : a)))
  }

  function toggleAddonAvailableFor(key: string, plan: string) {
    setAddons((prev) =>
      prev.map((a) => {
        if (a.addon_key !== key) return a
        const has = a.available_for.includes(plan)
        return {
          ...a,
          available_for: has ? a.available_for.filter((p) => p !== plan) : [...a.available_for, plan],
        }
      })
    )
  }

  async function savePlan(plan: PlanConfig) {
    setPlanSaving((s) => ({ ...s, [plan.plan_slug]: true }))
    setPlanStatus((s) => ({ ...s, [plan.plan_slug]: '' }))
    try {
      const res = await authFetch(`/admin/plans/${plan.plan_slug}`, {
        method: 'PATCH',
        body: JSON.stringify({
          price_monthly: plan.price_monthly,
          price_semestral_discount_pct: plan.price_semestral_discount_pct,
          price_annual_discount_pct: plan.price_annual_discount_pct,
          trial_days: plan.trial_days,
          staff_limit: plan.staff_limit,
          services_limit: plan.services_limit,
          branches_limit: plan.branches_limit,
          email_campaign_limit: plan.email_campaign_limit,
          max_wa_confirmacion: plan.max_wa_confirmacion,
          max_group_capacity: plan.max_group_capacity,
          max_campanas_wa: plan.max_campanas_wa,
          is_active: plan.is_active,
        }),
      })
      if (!res || !res.ok) throw new Error('Error guardando')
      setPlanStatus((s) => ({ ...s, [plan.plan_slug]: 'Guardado ✓' }))
    } catch (e) {
      setPlanStatus((s) => ({ ...s, [plan.plan_slug]: 'Error al guardar' }))
    } finally {
      setPlanSaving((s) => ({ ...s, [plan.plan_slug]: false }))
    }
  }

  async function saveAddon(addon: AddonConfig) {
    setAddonSaving((s) => ({ ...s, [addon.addon_key]: true }))
    setAddonStatus((s) => ({ ...s, [addon.addon_key]: '' }))
    try {
      const res = await authFetch(`/admin/addons/${addon.addon_key}`, {
        method: 'PATCH',
        body: JSON.stringify({
          name: addon.name,
          description: addon.description,
          price: addon.price,
          promo_price: addon.promo_price,
          promo_active: addon.promo_active,
          promo_starts_at: addon.promo_starts_at,
          promo_ends_at: addon.promo_ends_at,
          pack2_price: addon.pack2_price,
          pack3_price: addon.pack3_price,
          pack_size: addon.pack_size,
          min_plan: addon.min_plan,
          available_for: addon.available_for,
          resets_monthly: addon.resets_monthly,
          accumulates: addon.accumulates,
          is_active: addon.is_active,
        }),
      })
      if (!res || !res.ok) throw new Error('Error guardando')
      setAddonStatus((s) => ({ ...s, [addon.addon_key]: 'Guardado ✓' }))
    } catch (e) {
      setAddonStatus((s) => ({ ...s, [addon.addon_key]: 'Error al guardar' }))
    } finally {
      setAddonSaving((s) => ({ ...s, [addon.addon_key]: false }))
    }
  }

  if (loading) {
    return <div className="p-6"><p className="text-sm text-blue-300/50">Cargando...</p></div>
  }

  return (
    <div className="p-6 space-y-10">
      <div>
        <h1 className="text-lg font-semibold text-white mb-1">Planes</h1>
        <p className="text-sm text-blue-300/50 mb-6">
          Cambiar precio/trial_days aquí no afecta todavía lo que se cobra realmente en Flow
          ni la página pública de /planes — ver nota de alcance.
        </p>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {ALL_PLANS.map((slug) => {
            const plan = plans.find((p) => p.plan_slug === slug)
            if (!plan) return null
            return (
              <div key={slug} className="rounded-2xl border border-blue-900/25 p-4" style={{ background: '#0f1729' }}>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-sm font-semibold text-white">{PLAN_LABEL[slug] ?? slug}</h2>
                  <ToggleField
                    label="Activo"
                    checked={plan.is_active}
                    onChange={(v) => updatePlanField(slug, 'is_active', v)}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <NumberField label="Precio mensual" value={plan.price_monthly} onChange={(v) => updatePlanField(slug, 'price_monthly', v)} />
                  <NumberField label="Trial (días)" value={plan.trial_days} onChange={(v) => updatePlanField(slug, 'trial_days', v)} />
                  <NumberField label="Descuento semestral %" value={plan.price_semestral_discount_pct} onChange={(v) => updatePlanField(slug, 'price_semestral_discount_pct', v)} />
                  <NumberField label="Descuento anual %" value={plan.price_annual_discount_pct} onChange={(v) => updatePlanField(slug, 'price_annual_discount_pct', v)} />
                  <NumberField label="Staff" value={plan.staff_limit} onChange={(v) => updatePlanField(slug, 'staff_limit', v)} />
                  <NumberField label="Servicios" value={plan.services_limit} onChange={(v) => updatePlanField(slug, 'services_limit', v)} />
                  <NumberField label="Sucursales" value={plan.branches_limit} onChange={(v) => updatePlanField(slug, 'branches_limit', v)} />
                  <NumberField label="Emails campaña" value={plan.email_campaign_limit} onChange={(v) => updatePlanField(slug, 'email_campaign_limit', v)} />
                  <NumberField label="WA confirmación" value={plan.max_wa_confirmacion} onChange={(v) => updatePlanField(slug, 'max_wa_confirmacion', v)} />
                  <NumberField label="Campañas WA" value={plan.max_campanas_wa} onChange={(v) => updatePlanField(slug, 'max_campanas_wa', v)} />
                  <NumberField label="Cupos grupales" value={plan.max_group_capacity} onChange={(v) => updatePlanField(slug, 'max_group_capacity', v)} />
                </div>
                <div className="flex items-center gap-3 mt-4">
                  <button
                    onClick={() => savePlan(plan)}
                    disabled={planSaving[slug]}
                    className="px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium transition-colors disabled:opacity-50"
                  >
                    {planSaving[slug] ? 'Guardando...' : 'Guardar'}
                  </button>
                  {planStatus[slug] && <span className="text-xs text-blue-300/60">{planStatus[slug]}</span>}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <div>
        <h1 className="text-lg font-semibold text-white mb-1">Add-ons</h1>
        <p className="text-sm text-blue-300/50 mb-6">
          El precio promo se guarda aquí pero todavía no se aplica automáticamente al cobro real
          — ver nota de alcance.
        </p>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {addons.map((addon) => (
            <div key={addon.addon_key} className="rounded-2xl border border-blue-900/25 p-4" style={{ background: '#0f1729' }}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold text-white">{addon.name}</h2>
                <ToggleField
                  label="Activo"
                  checked={addon.is_active}
                  onChange={(v) => updateAddonField(addon.addon_key, 'is_active', v)}
                />
              </div>

              <label className="flex flex-col gap-1 mb-3">
                <span className="text-xs text-blue-300/50">Descripción</span>
                <input
                  type="text"
                  value={addon.description ?? ''}
                  onChange={(e) => updateAddonField(addon.addon_key, 'description', e.target.value)}
                  className="bg-[#0a0f1e] border border-blue-900/30 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-blue-500/50"
                />
              </label>

              <div className="grid grid-cols-2 gap-3 mb-3">
                <NumberField label="Precio" value={addon.price} onChange={(v) => updateAddonField(addon.addon_key, 'price', v)} />
                <NumberField label="Cantidad por unidad" value={addon.pack_size} onChange={(v) => updateAddonField(addon.addon_key, 'pack_size', v)} />
                <NumberField label="Precio pack x2" value={addon.pack2_price ?? addon.price} onChange={(v) => updateAddonField(addon.addon_key, 'pack2_price', v)} />
                <NumberField label="Precio pack x3" value={addon.pack3_price ?? addon.price} onChange={(v) => updateAddonField(addon.addon_key, 'pack3_price', v)} />
              </div>

              <label className="flex flex-col gap-1 mb-3">
                <span className="text-xs text-blue-300/50">Plan mínimo requerido</span>
                <select
                  value={addon.min_plan}
                  onChange={(e) => updateAddonField(addon.addon_key, 'min_plan', e.target.value)}
                  className="bg-[#0a0f1e] border border-blue-900/30 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-blue-500/50"
                >
                  {ALL_PLANS.map((p) => (
                    <option key={p} value={p}>{PLAN_LABEL[p]}</option>
                  ))}
                </select>
              </label>

              <div className="mb-3">
                <span className="text-xs text-blue-300/50 block mb-1.5">Disponible para planes</span>
                <div className="flex flex-wrap gap-3">
                  {ALL_PLANS.map((p) => (
                    <ToggleField
                      key={p}
                      label={PLAN_LABEL[p]}
                      checked={addon.available_for.includes(p)}
                      onChange={() => toggleAddonAvailableFor(addon.addon_key, p)}
                    />
                  ))}
                </div>
              </div>

              <div className="flex flex-wrap gap-4 mb-4">
                <ToggleField
                  label="Se resetea cada mes"
                  checked={addon.resets_monthly}
                  onChange={(v) => updateAddonField(addon.addon_key, 'resets_monthly', v)}
                />
                <ToggleField
                  label="Se acumula"
                  checked={addon.accumulates}
                  onChange={(v) => updateAddonField(addon.addon_key, 'accumulates', v)}
                />
              </div>

              <div className="rounded-xl border border-blue-900/20 p-3 mb-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-medium text-blue-300/70">Promoción</span>
                  <ToggleField
                    label="Activa"
                    checked={addon.promo_active}
                    onChange={(v) => updateAddonField(addon.addon_key, 'promo_active', v)}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <NumberField
                    label="Precio promo"
                    value={addon.promo_price ?? 0}
                    onChange={(v) => updateAddonField(addon.addon_key, 'promo_price', v)}
                  />
                  <div />
                  <label className="flex flex-col gap-1">
                    <span className="text-xs text-blue-300/50">Desde</span>
                    <input
                      type="date"
                      value={addon.promo_starts_at ? addon.promo_starts_at.slice(0, 10) : ''}
                      onChange={(e) => updateAddonField(addon.addon_key, 'promo_starts_at', e.target.value || null)}
                      className="bg-[#0a0f1e] border border-blue-900/30 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-blue-500/50"
                    />
                  </label>
                  <label className="flex flex-col gap-1">
                    <span className="text-xs text-blue-300/50">Hasta</span>
                    <input
                      type="date"
                      value={addon.promo_ends_at ? addon.promo_ends_at.slice(0, 10) : ''}
                      onChange={(e) => updateAddonField(addon.addon_key, 'promo_ends_at', e.target.value || null)}
                      className="bg-[#0a0f1e] border border-blue-900/30 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-blue-500/50"
                    />
                  </label>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => saveAddon(addon)}
                  disabled={addonSaving[addon.addon_key]}
                  className="px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium transition-colors disabled:opacity-50"
                >
                  {addonSaving[addon.addon_key] ? 'Guardando...' : 'Guardar'}
                </button>
                {addonStatus[addon.addon_key] && (
                  <span className="text-xs text-blue-300/60">{addonStatus[addon.addon_key]}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
