'use client'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Check, Copy, Download, FileUp, Loader2, RefreshCw, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { BACKEND_URL } from '@/lib/backend-url'
import Select from '@/components/ui/Select'
import { formatCLP, formatDateDMY, formatRut, taxDocTypeLabel, todayISO } from '@/lib/tax-docs'

// Boletas y facturas por cada pago de Flow. Cada pago confirmado crea un
// documento 'pendiente'; aquí se emite en el SII a mano, se sube el PDF y la
// fila pasa a 'emitido'.

type AdminDoc = {
  id: string
  tenant_id: string | null
  flow_order: string
  origen: string
  tipo: 'boleta' | 'factura'
  estado: 'pendiente' | 'emitido' | 'anulado'
  folio: string | null
  fecha_emision: string | null
  fecha_pago: string
  monto_total: number
  monto_neto: number
  monto_iva: number
  concepto: string
  datos_receptor: {
    rut?: string | null
    razon_social?: string | null
    giro?: string | null
    direccion?: string | null
    comuna?: string | null
    email?: string | null
  } | null
  nota_credito_folio: string | null
  motivo_anulacion: string | null
  tiene_pdf: boolean
  tiene_nota_credito: boolean
  tenant_name: string | null
  tenant_slug: string | null
}

type Summary = {
  available: boolean
  mes: string
  pendientes: number
  atrasados: number
  emitidos_mes: number
  totales_mes: { total: number; neto: number; iva: number }
}

const PAGE_SIZE = 25

const ESTADO_OPTIONS = [
  { value: '', label: 'Todos los estados' },
  { value: 'pendiente', label: 'Pendientes' },
  { value: 'emitido', label: 'Emitidos' },
  { value: 'anulado', label: 'Anulados' },
]
const TIPO_OPTIONS = [
  { value: '', label: 'Boleta y factura' },
  { value: 'boleta', label: 'Boletas' },
  { value: 'factura', label: 'Facturas' },
]

const ESTADO_BADGE: Record<string, string> = {
  pendiente: 'bg-red-500/15 text-red-300 border-red-500/40',
  emitido: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40',
  anulado: 'bg-slate-500/15 text-slate-300 border-slate-500/40',
}
const ESTADO_LABEL: Record<string, string> = { pendiente: 'Pendiente', emitido: 'Emitido', anulado: 'Anulado' }

function currentMonth() {
  return todayISO().slice(0, 7)
}

function CopyRow({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false)
  if (!value) return null
  return (
    <div className="flex items-center gap-2 rounded-xl border border-blue-900/30 bg-[#0a0f1e] px-3 py-2">
      <div className="min-w-0 flex-1">
        <p className="text-[10px] uppercase tracking-wide text-blue-300/50">{label}</p>
        <p className="truncate text-sm text-white" title={value}>{value}</p>
      </div>
      <button
        type="button"
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(value)
            setCopied(true)
            window.setTimeout(() => setCopied(false), 1500)
          } catch {
            // Sin permiso de portapapeles: el valor queda visible para copiarlo a mano.
          }
        }}
        className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-blue-700/40 px-2 py-1 text-[11px] font-semibold text-blue-200 hover:bg-blue-900/30"
      >
        {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
        {copied ? 'Copiado' : 'Copiar'}
      </button>
    </div>
  )
}

function PdfDropzone({ file, onFile, label }: { file: File | null; onFile: (f: File | null) => void; label: string }) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)
  function accept(f: File | undefined) {
    if (f) onFile(f)
  }
  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => { e.preventDefault(); setDragging(false); accept(e.dataTransfer.files?.[0]) }}
      onClick={() => inputRef.current?.click()}
      className={`flex cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border border-dashed px-4 py-5 text-center text-xs ${
        dragging ? 'border-blue-400 bg-blue-500/10' : 'border-blue-900/50 bg-[#0a0f1e]'
      }`}
    >
      <FileUp className="h-5 w-5 text-blue-300/60" />
      {file ? (
        <span className="text-white">{file.name} · {(file.size / 1024).toFixed(0)} KB</span>
      ) : (
        <span className="text-blue-300/60">{label}: arrastra el PDF aquí o haz clic para seleccionarlo (máx. 5 MB)</span>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="application/pdf,.pdf"
        className="hidden"
        onChange={(e) => accept(e.target.files?.[0])}
      />
    </div>
  )
}

export default function AdminTaxDocumentsPage() {
  const router = useRouter()
  const [ready, setReady] = useState(false)
  const [estado, setEstado] = useState('')
  const [tipo, setTipo] = useState('')
  const [mes, setMes] = useState(currentMonth())
  const [allMonths, setAllMonths] = useState(true)
  const [q, setQ] = useState('')
  const [qDebounced, setQDebounced] = useState('')
  const [page, setPage] = useState(1)

  const [docs, setDocs] = useState<AdminDoc[]>([])
  const [total, setTotal] = useState(0)
  const [available, setAvailable] = useState(true)
  const [summary, setSummary] = useState<Summary | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  const [uploadDoc, setUploadDoc] = useState<AdminDoc | null>(null)
  const [voidDoc, setVoidDoc] = useState<AdminDoc | null>(null)
  const [syncing, setSyncing] = useState(false)
  const [exporting, setExporting] = useState(false)

  const authFetch = useCallback(async (url: string, init?: RequestInit) => {
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()
    const token = session?.access_token
    if (!token) { router.push('/admin/login'); throw new Error('Sin sesión') }
    const res = await fetch(url, { ...init, headers: { ...(init?.headers || {}), Authorization: `Bearer ${token}` } })
    if (res.status === 401 || res.status === 403) { router.push('/admin/login'); throw new Error('Sin acceso') }
    return res
  }, [router])

  // Filtros iniciales desde la URL (?estado=pendiente, ?q=slug-del-negocio).
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const e = params.get('estado')
    if (e && ESTADO_OPTIONS.some((o) => o.value === e)) setEstado(e)
    const initialQ = params.get('q')
    if (initialQ) { setQ(initialQ); setQDebounced(initialQ) }
    setReady(true)
  }, [])

  useEffect(() => {
    const t = window.setTimeout(() => { setQDebounced(q.trim()); setPage(1) }, 350)
    return () => window.clearTimeout(t)
  }, [q])

  const notifyMenu = () => window.dispatchEvent(new Event('orbyx-admin-docs-changed'))

  const loadSummary = useCallback(async () => {
    try {
      const res = await authFetch(`${BACKEND_URL}/admin/documentos-tributarios/resumen?mes=${mes}`)
      const data = await res.json().catch(() => ({}))
      if (res.ok) setSummary(data)
    } catch {
      // El resumen es un extra: la lista funciona sin él.
    }
  }, [authFetch, mes])

  const loadDocs = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const params = new URLSearchParams({ page: String(page), page_size: String(PAGE_SIZE) })
      if (estado) params.set('estado', estado)
      if (tipo) params.set('tipo', tipo)
      if (!allMonths) params.set('mes', mes)
      if (qDebounced) params.set('q', qDebounced)
      const res = await authFetch(`${BACKEND_URL}/admin/documentos-tributarios?${params.toString()}`)
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data?.error || 'No se pudieron cargar los documentos')
      setAvailable(data?.available !== false)
      setDocs(Array.isArray(data?.documentos) ? data.documentos : [])
      setTotal(Number(data?.total) || 0)
    } catch (e) {
      setError((e instanceof Error && e.message) || 'No se pudieron cargar los documentos')
    } finally {
      setLoading(false)
    }
  }, [authFetch, page, estado, tipo, mes, allMonths, qDebounced])

  useEffect(() => { if (ready) loadDocs() }, [ready, loadDocs])
  useEffect(() => { if (ready) loadSummary() }, [ready, loadSummary])

  function afterChange(updated: AdminDoc) {
    // La fila se actualiza en el lugar (sin recargar la página).
    setDocs((prev) => prev.map((d) => (d.id === updated.id ? { ...d, ...updated } : d)))
    loadSummary()
    notifyMenu()
  }

  async function openPdf(doc: AdminDoc, kind: 'documento' | 'nota_credito' = 'documento') {
    const win = window.open('', '_blank')
    try {
      const res = await authFetch(`${BACKEND_URL}/admin/documentos-tributarios/${doc.id}/pdf${kind === 'nota_credito' ? '?tipo=nota_credito' : ''}`)
      const data = await res.json().catch(() => ({}))
      if (!res.ok || !data?.url) throw new Error(data?.error || 'No se pudo abrir el PDF')
      if (win) win.location.href = data.url
      else window.location.href = data.url
    } catch (e) {
      win?.close()
      setError((e instanceof Error && e.message) || 'No se pudo abrir el PDF')
    }
  }

  async function exportCsv() {
    setExporting(true)
    setError('')
    try {
      const res = await authFetch(`${BACKEND_URL}/admin/documentos-tributarios/exportar?mes=${mes}`)
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data?.error || 'No se pudo exportar')
      }
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `documentos-tributarios-${mes}.csv`
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
    } catch (e) {
      setError((e instanceof Error && e.message) || 'No se pudo exportar')
    } finally {
      setExporting(false)
    }
  }

  async function syncWithFlow() {
    if (!window.confirm('Se revisarán los pagos de todos los negocios en Flow y se crearán los documentos que falten. ¿Continuar?')) return
    setSyncing(true)
    setError('')
    setNotice('')
    try {
      const res = await authFetch(`${BACKEND_URL}/admin/documentos-tributarios/sincronizar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: '{}',
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data?.error || 'No se pudo sincronizar')
      setNotice(`Revisados ${data.negocios_revisados} negocios · ${data.pagos_encontrados} pagos en Flow · ${data.documentos_creados} documentos nuevos.`)
      await loadDocs()
      loadSummary()
      notifyMenu()
    } catch (e) {
      setError((e instanceof Error && e.message) || 'No se pudo sincronizar')
    } finally {
      setSyncing(false)
    }
  }

  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE))

  return (
    <div className="p-6">
      <div className="mx-auto max-w-6xl">
        <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-lg font-semibold text-white">Documentos tributarios</h1>
            <p className="text-sm text-blue-300/50">Boleta o factura por cada pago de Flow. Emítelas en el SII y sube el PDF aquí.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={syncWithFlow}
              disabled={syncing}
              className="inline-flex items-center gap-1.5 rounded-xl border border-blue-700/40 px-3 py-2 text-xs font-semibold text-blue-200 hover:bg-blue-900/30 disabled:opacity-50"
              title="Trae de Flow los pagos que aún no tienen documento (histórico o avisos perdidos)"
            >
              {syncing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
              Sincronizar con Flow
            </button>
            <button
              type="button"
              onClick={exportCsv}
              disabled={exporting}
              className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-3 py-2 text-xs font-semibold text-white hover:bg-blue-500 disabled:opacity-50"
            >
              {exporting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
              Exportar CSV del mes
            </button>
          </div>
        </div>

        <div className="mb-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-blue-900/25 p-4" style={{ background: '#0f1729' }}>
            <p className="text-xs text-blue-300/50">Pendientes</p>
            <p className={`mt-1 text-2xl font-semibold ${summary && summary.pendientes > 0 ? 'text-red-400' : 'text-white'}`}>{summary?.pendientes ?? '—'}</p>
          </div>
          <div className={`rounded-2xl border p-4 ${summary && summary.atrasados > 0 ? 'border-red-500 bg-red-600/20' : 'border-blue-900/25'}`} style={summary && summary.atrasados > 0 ? undefined : { background: '#0f1729' }}>
            <p className={`text-xs ${summary && summary.atrasados > 0 ? 'text-red-200' : 'text-blue-300/50'}`}>Atrasados (pagados antes de hoy)</p>
            <p className={`mt-1 text-2xl font-semibold ${summary && summary.atrasados > 0 ? 'text-red-300' : 'text-white'}`}>{summary?.atrasados ?? '—'}</p>
          </div>
          <div className="rounded-2xl border border-blue-900/25 p-4" style={{ background: '#0f1729' }}>
            <p className="text-xs text-blue-300/50">Emitidos del mes</p>
            <p className="mt-1 text-2xl font-semibold text-emerald-400">{summary?.emitidos_mes ?? '—'}</p>
          </div>
          <div className="rounded-2xl border border-blue-900/25 p-4" style={{ background: '#0f1729' }}>
            <p className="text-xs text-blue-300/50">Total del mes (sin anulados)</p>
            <p className="mt-1 text-2xl font-semibold text-white">{summary ? formatCLP(summary.totales_mes.total) : '—'}</p>
            {summary ? (
              <p className="mt-0.5 text-[11px] text-blue-300/50">
                Neto {formatCLP(summary.totales_mes.neto)} · IVA {formatCLP(summary.totales_mes.iva)}
              </p>
            ) : null}
          </div>
        </div>

        <div className="mb-4 flex flex-wrap items-center gap-2">
          <Select
            value={estado}
            onChange={(e) => { setEstado(e.target.value); setPage(1) }}
            className="bg-[#0a0f1e] border border-blue-900/30 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500/50"
          >
            {ESTADO_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </Select>
          <Select
            value={tipo}
            onChange={(e) => { setTipo(e.target.value); setPage(1) }}
            className="bg-[#0a0f1e] border border-blue-900/30 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500/50"
          >
            {TIPO_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </Select>
          <input
            type="month"
            value={mes}
            onChange={(e) => { if (e.target.value) { setMes(e.target.value); setAllMonths(false); setPage(1) } }}
            className="bg-[#0a0f1e] border border-blue-900/30 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500/50"
            aria-label="Mes del pago"
          />
          {!allMonths ? (
            <button type="button" onClick={() => { setAllMonths(true); setPage(1) }} className="text-xs text-blue-300 underline">
              Ver todos los meses
            </button>
          ) : null}
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar negocio, folio, orden Flow..."
            className="min-w-[200px] flex-1 bg-[#0a0f1e] border border-blue-900/30 rounded-xl px-3 py-2 text-xs text-white placeholder:text-blue-300/30 focus:outline-none focus:border-blue-500/50"
          />
        </div>

        {error ? <p className="mb-3 text-sm text-red-400">{error}</p> : null}
        {notice ? <p className="mb-3 text-sm text-emerald-300">{notice}</p> : null}

        {loading ? (
          <p className="py-8 text-center text-sm text-blue-300/50">Cargando...</p>
        ) : !available ? (
          <p className="py-8 text-center text-sm text-amber-300/80">Falta correr la migración de documentos tributarios en Supabase.</p>
        ) : docs.length === 0 ? (
          <p className="py-8 text-center text-sm text-blue-300/50">No hay documentos con estos filtros.</p>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-blue-900/25" style={{ background: '#0f1729' }}>
            <table className="w-full min-w-[900px] text-left text-xs">
              <thead className="text-blue-300/50">
                <tr className="border-b border-blue-900/25">
                  <th className="px-3 py-2.5 font-medium">Fecha pago</th>
                  <th className="px-3 py-2.5 font-medium">Negocio</th>
                  <th className="px-3 py-2.5 font-medium">Concepto</th>
                  <th className="px-3 py-2.5 font-medium">Tipo</th>
                  <th className="px-3 py-2.5 text-right font-medium">Neto</th>
                  <th className="px-3 py-2.5 text-right font-medium">IVA</th>
                  <th className="px-3 py-2.5 text-right font-medium">Total</th>
                  <th className="px-3 py-2.5 font-medium">Estado</th>
                  <th className="px-3 py-2.5 font-medium">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {docs.map((d) => (
                  <tr key={d.id} className="border-b border-blue-900/15 last:border-0 text-blue-100/90 align-top">
                    <td className="whitespace-nowrap px-3 py-2.5">{formatDateDMY(d.fecha_pago)}</td>
                    <td className="px-3 py-2.5">
                      {d.tenant_id ? (
                        <a href={`/admin/tenants/${d.tenant_id}`} className="font-semibold text-white hover:text-blue-300">{d.tenant_name || 'Negocio'}</a>
                      ) : (
                        <span className="text-blue-300/50">Negocio eliminado</span>
                      )}
                    </td>
                    <td className="max-w-[260px] px-3 py-2.5">
                      <span title={d.concepto}>{d.concepto}</span>
                      {d.folio ? <span className="block text-blue-300/50">Folio {d.folio}</span> : null}
                    </td>
                    <td className="px-3 py-2.5">
                      <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${d.tipo === 'factura' ? 'border-violet-500/40 bg-violet-500/15 text-violet-300' : 'border-sky-500/40 bg-sky-500/15 text-sky-300'}`}>
                        {taxDocTypeLabel(d.tipo)}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-3 py-2.5 text-right">{formatCLP(d.monto_neto)}</td>
                    <td className="whitespace-nowrap px-3 py-2.5 text-right">{formatCLP(d.monto_iva)}</td>
                    <td className="whitespace-nowrap px-3 py-2.5 text-right font-semibold text-white">{formatCLP(d.monto_total)}</td>
                    <td className="px-3 py-2.5">
                      <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${ESTADO_BADGE[d.estado]}`}>{ESTADO_LABEL[d.estado]}</span>
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="flex flex-wrap gap-1.5">
                        {d.estado === 'pendiente' ? (
                          <button type="button" onClick={() => setUploadDoc(d)} className="rounded-lg bg-red-600 px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-red-500">
                            Subir documento
                          </button>
                        ) : null}
                        {d.estado !== 'pendiente' && d.tiene_pdf ? (
                          <button type="button" onClick={() => openPdf(d)} className="rounded-lg border border-blue-700/40 px-2.5 py-1 text-[11px] font-semibold text-blue-200 hover:bg-blue-900/30">
                            Ver PDF
                          </button>
                        ) : null}
                        {d.estado === 'emitido' ? (
                          <>
                            <button type="button" onClick={() => setUploadDoc(d)} className="rounded-lg border border-blue-700/40 px-2.5 py-1 text-[11px] font-semibold text-blue-200 hover:bg-blue-900/30">
                              Reemplazar
                            </button>
                            <button type="button" onClick={() => setVoidDoc(d)} className="rounded-lg border border-red-500/40 px-2.5 py-1 text-[11px] font-semibold text-red-300 hover:bg-red-500/10">
                              Anular con nota de crédito
                            </button>
                          </>
                        ) : null}
                        {d.estado === 'anulado' && d.tiene_nota_credito ? (
                          <button type="button" onClick={() => openPdf(d, 'nota_credito')} className="rounded-lg border border-blue-700/40 px-2.5 py-1 text-[11px] font-semibold text-blue-200 hover:bg-blue-900/30">
                            Ver nota de crédito
                          </button>
                        ) : null}
                      </div>
                      {d.estado === 'anulado' && d.motivo_anulacion ? (
                        <p className="mt-1 max-w-[220px] text-[10px] text-blue-300/50">NC {d.nota_credito_folio}: {d.motivo_anulacion}</p>
                      ) : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {pageCount > 1 ? (
          <div className="mt-3 flex items-center justify-between text-xs text-blue-300/60">
            <span>{total} documentos</span>
            <div className="flex items-center gap-2">
              <button type="button" disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="rounded-lg border border-blue-900/40 px-3 py-1.5 disabled:opacity-40">Anterior</button>
              <span>Página {page} de {pageCount}</span>
              <button type="button" disabled={page >= pageCount} onClick={() => setPage((p) => p + 1)} className="rounded-lg border border-blue-900/40 px-3 py-1.5 disabled:opacity-40">Siguiente</button>
            </div>
          </div>
        ) : null}
      </div>

      {uploadDoc ? (
        <UploadModal
          doc={uploadDoc}
          authFetch={authFetch}
          onClose={() => setUploadDoc(null)}
          onDone={(updated) => { afterChange(updated); setUploadDoc(null) }}
        />
      ) : null}
      {voidDoc ? (
        <VoidModal
          doc={voidDoc}
          authFetch={authFetch}
          onClose={() => setVoidDoc(null)}
          onDone={(updated) => { afterChange(updated); setVoidDoc(null) }}
        />
      ) : null}
    </div>
  )
}

type AuthFetch = (url: string, init?: RequestInit) => Promise<Response>

function ModalShell({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <div
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-blue-900/40 p-5"
        style={{ background: '#0b1220' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-white">{title}</h3>
          <button type="button" onClick={onClose} className="text-blue-300/50 hover:text-blue-200" aria-label="Cerrar">
            <X size={16} />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}

const inputCls = 'w-full rounded-xl border border-blue-900/40 bg-[#060a14] px-3 py-2 text-sm text-white outline-none focus:border-blue-500/60'

function UploadModal({ doc, authFetch, onClose, onDone }: { doc: AdminDoc; authFetch: AuthFetch; onClose: () => void; onDone: (d: AdminDoc) => void }) {
  const replacing = doc.estado === 'emitido'
  const [folio, setFolio] = useState(replacing ? doc.folio || '' : '')
  const [fecha, setFecha] = useState(replacing ? doc.fecha_emision || todayISO() : todayISO())
  const [file, setFile] = useState<File | null>(null)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const r = doc.datos_receptor

  async function submit() {
    setErr('')
    if (!file) return setErr('Adjunta el PDF.')
    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) return setErr('El archivo debe ser un PDF.')
    if (file.size > 5 * 1024 * 1024) return setErr('El PDF supera los 5 MB.')
    if (!folio.trim()) return setErr('El folio es obligatorio.')
    setBusy(true)
    try {
      const form = new FormData()
      form.append('file', file)
      form.append('folio', folio.trim())
      form.append('fecha_emision', fecha)
      const res = await authFetch(`${BACKEND_URL}/admin/documentos-tributarios/${doc.id}/documento`, { method: 'POST', body: form })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data?.error || 'No se pudo subir el documento')
      onDone(data.documento)
    } catch (e) {
      setErr((e instanceof Error && e.message) || 'No se pudo subir el documento')
    } finally {
      setBusy(false)
    }
  }

  return (
    <ModalShell title={replacing ? `Reemplazar ${taxDocTypeLabel(doc.tipo).toLowerCase()}` : `Subir ${taxDocTypeLabel(doc.tipo).toLowerCase()}`} onClose={onClose}>
      <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-blue-300/60">Datos para emitir en el SII</p>
      <div className="mb-4 space-y-1.5">
        <CopyRow label="Tipo de documento" value={taxDocTypeLabel(doc.tipo)} />
        <CopyRow label="Monto total (IVA incluido)" value={String(doc.monto_total)} />
        <CopyRow label="Concepto sugerido" value={doc.concepto} />
        {doc.tipo === 'factura' ? (
          r ? (
            <>
              <CopyRow label="RUT" value={r.rut ? formatRut(r.rut) : ''} />
              <CopyRow label="Razón social" value={r.razon_social || ''} />
              <CopyRow label="Giro" value={r.giro || ''} />
              <CopyRow label="Dirección" value={r.direccion || ''} />
              <CopyRow label="Comuna" value={r.comuna || ''} />
            </>
          ) : (
            <p className="rounded-xl border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs text-amber-200">
              Este negocio pidió factura pero no dejó sus datos de facturación.
            </p>
          )
        ) : null}
        <p className="px-1 text-[11px] text-blue-300/50">Neto {formatCLP(doc.monto_neto)} + IVA {formatCLP(doc.monto_iva)} · {doc.tenant_name || 'Negocio'}</p>
      </div>

      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-[11px] font-medium text-blue-300/60">Folio</label>
            <input value={folio} onChange={(e) => setFolio(e.target.value)} className={inputCls} placeholder="N° del documento" />
          </div>
          <div>
            <label className="mb-1 block text-[11px] font-medium text-blue-300/60">Fecha de emisión</label>
            <input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} className={inputCls} />
          </div>
        </div>
        <PdfDropzone file={file} onFile={setFile} label="PDF del documento" />
        {err ? <p className="text-xs text-red-400">{err}</p> : null}
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className="rounded-xl border border-blue-900/40 px-4 py-2 text-xs text-blue-200 hover:bg-blue-900/20">Cancelar</button>
          <button type="button" onClick={submit} disabled={busy} className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-500 disabled:opacity-50">
            {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
            Confirmar
          </button>
        </div>
      </div>
    </ModalShell>
  )
}

function VoidModal({ doc, authFetch, onClose, onDone }: { doc: AdminDoc; authFetch: AuthFetch; onClose: () => void; onDone: (d: AdminDoc) => void }) {
  const [folio, setFolio] = useState('')
  const [motivo, setMotivo] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')

  async function submit() {
    setErr('')
    if (!file) return setErr('Adjunta el PDF de la nota de crédito.')
    if (file.size > 5 * 1024 * 1024) return setErr('El PDF supera los 5 MB.')
    if (!folio.trim()) return setErr('El folio de la nota de crédito es obligatorio.')
    if (!motivo.trim()) return setErr('Indica el motivo de la anulación.')
    setBusy(true)
    try {
      const form = new FormData()
      form.append('file', file)
      form.append('nota_credito_folio', folio.trim())
      form.append('motivo', motivo.trim())
      const res = await authFetch(`${BACKEND_URL}/admin/documentos-tributarios/${doc.id}/anular`, { method: 'POST', body: form })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data?.error || 'No se pudo anular el documento')
      onDone(data.documento)
    } catch (e) {
      setErr((e instanceof Error && e.message) || 'No se pudo anular el documento')
    } finally {
      setBusy(false)
    }
  }

  return (
    <ModalShell title={`Anular ${taxDocTypeLabel(doc.tipo).toLowerCase()} ${doc.folio ? `N° ${doc.folio}` : ''}`} onClose={onClose}>
      <p className="mb-3 text-xs text-blue-300/60">
        Emite primero la nota de crédito en el SII. Al anular, el documento deja de sumar en los totales del mes.
      </p>
      <div className="space-y-3">
        <div>
          <label className="mb-1 block text-[11px] font-medium text-blue-300/60">Folio de la nota de crédito</label>
          <input value={folio} onChange={(e) => setFolio(e.target.value)} className={inputCls} />
        </div>
        <div>
          <label className="mb-1 block text-[11px] font-medium text-blue-300/60">Motivo</label>
          <textarea value={motivo} onChange={(e) => setMotivo(e.target.value)} rows={2} className={`${inputCls} resize-none`} />
        </div>
        <PdfDropzone file={file} onFile={setFile} label="PDF de la nota de crédito" />
        {err ? <p className="text-xs text-red-400">{err}</p> : null}
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className="rounded-xl border border-blue-900/40 px-4 py-2 text-xs text-blue-200 hover:bg-blue-900/20">Cancelar</button>
          <button type="button" onClick={submit} disabled={busy} className="inline-flex items-center gap-1.5 rounded-xl bg-red-600 px-4 py-2 text-xs font-semibold text-white hover:bg-red-500 disabled:opacity-50">
            {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
            Anular documento
          </button>
        </div>
      </div>
    </ModalShell>
  )
}
