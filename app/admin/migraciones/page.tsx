'use client'
import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Download, FileSpreadsheet, Loader2, Trash2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { BACKEND_URL } from '@/lib/backend-url'
import Select from '@/components/ui/Select'

// Migraciones de datos que suben los negocios (una por negocio). El equipo
// descarga los archivos, los carga a mano y va cambiando el estado, que el
// negocio ve en Clientes → "Migrar mis datos".

type MigrationRow = {
  id: string
  tenant_id: string | null
  tenant_name: string | null
  tenant_slug: string | null
  status: 'pending' | 'in_progress' | 'done'
  notes: string | null
  files: { index: number; name: string; size: number }[]
  created_by_email: string | null
  admin_notes: string | null
  created_at: string
  completed_at: string | null
}

const STATUS_OPTIONS = [
  { value: 'pending', label: 'Recibida (pendiente)' },
  { value: 'in_progress', label: 'En proceso' },
  { value: 'done', label: 'Lista' },
]

const STATUS_BADGE: Record<string, string> = {
  pending: 'bg-red-500/15 text-red-300 border-red-500/30',
  in_progress: 'bg-blue-500/15 text-blue-300 border-blue-500/30',
  done: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
}

function formatSize(bytes: number) {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  return `${Math.max(1, Math.round(bytes / 1024))} KB`
}

function formatDateTime(value: string | null) {
  if (!value) return ''
  return new Date(value).toLocaleString('es-CL', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

export default function AdminMigrationsPage() {
  const router = useRouter()
  const [rows, setRows] = useState<MigrationRow[]>([])
  const [available, setAvailable] = useState(true)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [busyId, setBusyId] = useState('')
  const [notesDraft, setNotesDraft] = useState<Record<string, string>>({})

  const authFetch = useCallback(async (url: string, init?: RequestInit) => {
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()
    const token = session?.access_token
    if (!token) { router.push('/admin/login'); throw new Error('Sin sesión') }
    const res = await fetch(url, {
      ...init,
      headers: { ...(init?.headers || {}), Authorization: `Bearer ${token}` },
    })
    if (res.status === 401 || res.status === 403) { router.push('/admin/login'); throw new Error('Sin acceso') }
    return res
  }, [router])

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = await authFetch(`${BACKEND_URL}/admin/migration-requests`)
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data?.error || 'No se pudieron cargar las migraciones')
      setAvailable(data?.available !== false)
      const list: MigrationRow[] = Array.isArray(data?.requests) ? data.requests : []
      setRows(list)
      setNotesDraft(Object.fromEntries(list.map((r) => [r.id, r.admin_notes || ''])))
    } catch (e) {
      setError((e instanceof Error && e.message) || 'No se pudieron cargar las migraciones')
    } finally {
      setLoading(false)
    }
  }, [authFetch])

  useEffect(() => { load() }, [load])

  function notifyMenu() {
    window.dispatchEvent(new Event('orbyx-admin-migrations-changed'))
  }

  async function updateRequest(id: string, body: Record<string, unknown>) {
    setBusyId(id)
    setError('')
    try {
      const res = await authFetch(`${BACKEND_URL}/admin/migration-requests/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data?.error || 'No se pudo actualizar')
      setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...data.request } : r)))
      notifyMenu()
    } catch (e) {
      setError((e instanceof Error && e.message) || 'No se pudo actualizar')
    } finally {
      setBusyId('')
    }
  }

  async function downloadFile(id: string, index: number) {
    // La ventana se abre antes del fetch para que el navegador no la bloquee.
    const win = window.open('', '_blank')
    try {
      const res = await authFetch(`${BACKEND_URL}/admin/migration-requests/${id}/files/${index}`)
      const data = await res.json().catch(() => ({}))
      if (!res.ok || !data?.url) throw new Error(data?.error || 'No se pudo descargar')
      if (win) win.location.href = data.url
      else window.location.href = data.url
    } catch (e) {
      win?.close()
      setError((e instanceof Error && e.message) || 'No se pudo descargar')
    }
  }

  async function deleteRequest(row: MigrationRow) {
    const ok = window.confirm(
      `¿Eliminar la migración de ${row.tenant_name || 'este negocio'}? Se borran los archivos y el negocio podrá volver a subir su migración.`
    )
    if (!ok) return
    setBusyId(row.id)
    setError('')
    try {
      const res = await authFetch(`${BACKEND_URL}/admin/migration-requests/${row.id}`, { method: 'DELETE' })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data?.error || 'No se pudo eliminar')
      setRows((prev) => prev.filter((r) => r.id !== row.id))
      notifyMenu()
    } catch (e) {
      setError((e instanceof Error && e.message) || 'No se pudo eliminar')
    } finally {
      setBusyId('')
    }
  }

  const pendingCount = rows.filter((r) => r.status !== 'done').length

  return (
    <div className="p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-lg font-semibold text-white">Migraciones de datos</h1>
          <p className="text-sm text-blue-300/50">
            {pendingCount > 0
              ? `${pendingCount} por procesar · hazlas cuanto antes, el negocio está esperando.`
              : 'No hay migraciones pendientes.'}
          </p>
        </div>

        {error ? <p className="mb-4 text-sm text-red-400">{error}</p> : null}

        {loading ? (
          <p className="text-sm text-blue-300/50 text-center py-8">Cargando...</p>
        ) : !available ? (
          <p className="text-sm text-amber-300/80 text-center py-8">
            Falta correr la migración 2026-10-26-migration-requests.sql en Supabase.
          </p>
        ) : rows.length === 0 ? (
          <p className="text-sm text-blue-300/50 text-center py-8">Ningún negocio ha subido su migración todavía.</p>
        ) : (
          <div className="space-y-3">
            {rows.map((row) => {
              const busy = busyId === row.id
              const draft = notesDraft[row.id] ?? ''
              return (
                <div
                  key={row.id}
                  className={`rounded-2xl border p-4 ${row.status === 'pending' ? 'border-red-500/40' : 'border-blue-900/25'}`}
                  style={{ background: '#0f1729' }}
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`text-xs px-2 py-0.5 rounded-full border ${STATUS_BADGE[row.status] || STATUS_BADGE.pending}`}>
                          {STATUS_OPTIONS.find((o) => o.value === row.status)?.label || row.status}
                        </span>
                        {row.tenant_id ? (
                          <a href={`/admin/tenants/${row.tenant_id}`} className="text-sm font-semibold text-white hover:text-blue-300">
                            {row.tenant_name || 'Negocio'}
                          </a>
                        ) : (
                          <span className="text-sm font-semibold text-white">Negocio eliminado</span>
                        )}
                        {row.tenant_slug ? <span className="text-xs text-blue-300/40">/{row.tenant_slug}</span> : null}
                      </div>
                      <p className="mt-1 text-xs text-blue-300/50">
                        Subida el {formatDateTime(row.created_at)}
                        {row.created_by_email ? ` · por ${row.created_by_email}` : ''}
                        {row.completed_at ? ` · lista el ${formatDateTime(row.completed_at)}` : ''}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Select
                        value={row.status}
                        disabled={busy}
                        onChange={(e) => updateRequest(row.id, { status: e.target.value })}
                        className="bg-[#0a0f1e] border border-blue-900/30 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500/50"
                      >
                        {STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                      </Select>
                      <button
                        type="button"
                        onClick={() => deleteRequest(row)}
                        disabled={busy}
                        title="Eliminar (el negocio podrá volver a subir)"
                        className="flex h-8 w-8 items-center justify-center rounded-xl border border-red-500/30 text-red-300 hover:bg-red-500/10 disabled:opacity-50"
                      >
                        {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                      </button>
                    </div>
                  </div>

                  {row.notes ? (
                    <div className="mt-3 rounded-xl border border-blue-900/25 px-3 py-2 text-xs text-blue-100/80 whitespace-pre-wrap">
                      <span className="text-blue-300/50">Nota del negocio: </span>
                      {row.notes}
                    </div>
                  ) : null}

                  <ul className="mt-3 space-y-1.5">
                    {row.files.map((f) => (
                      <li key={f.index} className="flex items-center gap-2 text-xs text-blue-100/80">
                        <FileSpreadsheet className="h-3.5 w-3.5 shrink-0 text-blue-300/60" />
                        <span className="min-w-0 flex-1 truncate">{f.name}</span>
                        <span className="shrink-0 text-blue-300/40">{formatSize(f.size)}</span>
                        <button
                          type="button"
                          onClick={() => downloadFile(row.id, f.index)}
                          className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-blue-700/40 px-2 py-1 text-[11px] font-semibold text-blue-200 hover:bg-blue-900/30"
                        >
                          <Download className="h-3 w-3" />
                          Descargar
                        </button>
                      </li>
                    ))}
                  </ul>

                  <div className="mt-3">
                    <label className="block text-[11px] font-medium text-blue-300/50 mb-1">Notas internas (el negocio no las ve)</label>
                    <textarea
                      value={draft}
                      onChange={(e) => setNotesDraft((prev) => ({ ...prev, [row.id]: e.target.value }))}
                      rows={2}
                      className="w-full resize-none rounded-xl border border-blue-900/30 bg-[#0a0f1e] px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500/50"
                    />
                    {draft !== (row.admin_notes || '') ? (
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => updateRequest(row.id, { admin_notes: draft })}
                        className="mt-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-[11px] font-semibold text-white hover:bg-blue-500 disabled:opacity-50"
                      >
                        Guardar nota
                      </button>
                    ) : null}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
