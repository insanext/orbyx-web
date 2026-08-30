'use client'
import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { apiFetch } from '@/lib/api'
import FaqAccordion from './FaqAccordion'

const BACKEND_URL = 'https://orbyx-backend.onrender.com'

const CATEGORIES = [
  { value: 'agenda_reservas', label: 'Agenda y reservas' },
  { value: 'pagina_publica', label: 'Página pública de reservas' },
  { value: 'disponibilidad_horarios', label: 'Disponibilidad y horarios' },
  { value: 'staff', label: 'Staff' },
  { value: 'servicios', label: 'Servicios' },
  { value: 'sucursales', label: 'Sucursales' },
  { value: 'clientes', label: 'Clientes' },
  { value: 'campanas', label: 'Campañas (email / WhatsApp)' },
  { value: 'facturacion_planes', label: 'Facturación y planes' },
  { value: 'mi_cuenta', label: 'Mi cuenta' },
  { value: 'equipo_permisos', label: 'Equipo y permisos' },
  { value: 'calendario_google', label: 'Calendario (Google Calendar)' },
  { value: 'error_tecnico', label: 'Error técnico / la página no funciona' },
  { value: 'sugerencia', label: 'Sugerencia o idea' },
  { value: 'otro', label: 'Otro' },
]

const PRIORITY_BADGE: Record<string, { label: string; color: string }> = {
  normal: { label: 'Estándar', color: 'bg-blue-900/30 text-blue-300/70 border-blue-900/30' },
  media: { label: 'Prioridad media', color: 'bg-purple-500/10 text-purple-300 border-purple-500/20' },
  alta: { label: 'Prioridad alta', color: 'bg-amber-500/10 text-amber-300 border-amber-500/20' },
  maxima: { label: 'Prioridad máxima', color: 'bg-pink-500/10 text-pink-300 border-pink-500/20' },
}

const STATUS_LABEL: Record<string, { label: string; color: string; bg: string }> = {
  open: { label: 'Abierto', color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20' },
  answered: { label: 'Respondido', color: 'text-green-400', bg: 'bg-green-500/10 border-green-500/20' },
  waiting_confirmation: { label: 'Esperando tu confirmación', color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20' },
  closed: { label: 'Cerrado', color: 'text-gray-400', bg: 'bg-gray-500/10 border-gray-500/20' },
  reopened: { label: 'Reabierto', color: 'text-pink-400', bg: 'bg-pink-500/10 border-pink-500/20' },
}

export default function SoportePage() {
  const params = useParams()
  const slug = params?.slug as string
  const [tenantId, setTenantId] = useState('')
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [tickets, setTickets] = useState<any[]>([])
  const [view, setView] = useState<'faq' | 'list' | 'new' | 'detail'>('faq')
  const [selectedTicket, setSelectedTicket] = useState<any>(null)
  const [messages, setMessages] = useState<any[]>([])
  // El bucket ticket-attachments es privado: lo guardado en attachments (una
  // URL publica vieja, o un path) nunca se usa directo como src/href — se
  // resuelve a un signed URL de corta duracion via el backend y se cachea
  // acá por el valor original, para no repetir el pedido en cada render.
  // Nombre distinto de la variable local `attachmentUrls` que ya existe en
  // handleCreateTicket/handleReply (esa es el array recién subido, esto es
  // el mapa valor-guardado -> signed url).
  const [signedAttachmentUrls, setSignedAttachmentUrls] = useState<Record<string, string>>({})

  const [subject, setSubject] = useState('')
  const [category, setCategory] = useState('agenda_reservas')
  const [description, setDescription] = useState('')
  const [files, setFiles] = useState<File[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [submitMsg, setSubmitMsg] = useState('')

  const [replyText, setReplyText] = useState('')
  const [replyFiles, setReplyFiles] = useState<File[]>([])
  const [sendingReply, setSendingReply] = useState(false)
  const [confirmingResolution, setConfirmingResolution] = useState(false)

  const inp = "w-full rounded-xl border px-3 py-2 text-sm outline-none transition-colors"

  useEffect(() => {
    const init = async () => {
      try {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        setCurrentUser(user)
        const res = await apiFetch(`${BACKEND_URL}/public/business/${slug}`)
        const biz = await res.json()
        const tid = biz?.business?.id
        if (tid) {
          setTenantId(tid)
          loadTickets(tid)
        }
      } catch (e) {
        console.error('Error inicializando soporte:', e)
      }
    }
    init()
  }, [slug])

  const loadTickets = async (tid: string) => {
    const res = await apiFetch(`${BACKEND_URL}/support/tickets?tenant_id=${tid}`)
    const data = await res.json()
    setTickets(Array.isArray(data) ? data : [])
  }

  const handleFileSelect = (
    e: React.ChangeEvent<HTMLInputElement>,
    setter: (f: File[]) => void,
    current: File[]
  ) => {
    const selected = Array.from(e.target.files ?? [])
    if (current.length + selected.length > 1) {
      alert('Solo puedes subir 1 captura por ticket.')
      return
    }
    const tooLarge = selected.find(f => f.size > 1024 * 1024)
    if (tooLarge) {
      alert(`La imagen "${tooLarge.name}" pesa más de 1MB. Comprime la imagen o usa una más liviana.`)
      e.target.value = ''
      return
    }
    setter([...current, ...selected])
    e.target.value = ''
  }

  const uploadFiles = async (filesToUpload: File[]) => {
    const urls: string[] = []
    for (const file of filesToUpload) {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('tenant_id', tenantId)
      const res = await apiFetch(`${BACKEND_URL}/upload/ticket-attachment`, { method: 'POST', body: formData })
      const data = await res.json()
      if (data.url) urls.push(data.url)
    }
    return urls
  }

  // Pide al backend un signed URL por cada adjunto todavía no resuelto
  // (evita repetir el pedido si ya está en cache) y los agrega al mapa.
  const resolveAttachmentUrls = async (ticketId: string, values: string[]) => {
    const pending = Array.from(new Set(values.filter(v => v && !signedAttachmentUrls[v])))
    if (pending.length === 0) return
    const resolved = await Promise.all(
      pending.map(async (value) => {
        try {
          const res = await apiFetch(
            `${BACKEND_URL}/support/tickets/${ticketId}/attachment-url?tenant_id=${tenantId}&attachment=${encodeURIComponent(value)}`
          )
          const data = await res.json()
          return [value, res.ok ? data.url : null] as const
        } catch {
          return [value, null] as const
        }
      })
    )
    setSignedAttachmentUrls(prev => {
      const next = { ...prev }
      for (const [value, url] of resolved) {
        if (url) next[value] = url
      }
      return next
    })
  }

  const handleCreateTicket = async () => {
    if (!subject.trim() || !description.trim()) {
      setSubmitMsg('Completa el asunto y la descripción.')
      return
    }
    setSubmitting(true)
    setSubmitMsg('')
    try {
      const attachmentUrls = files.length > 0 ? await uploadFiles(files) : []
      const payload = {
        tenant_id: tenantId,
        created_by: currentUser?.id,
        subject,
        category,
        description,
        attachments: attachmentUrls,
      }
      const res = await apiFetch(`${BACKEND_URL}/support/tickets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setSubject('')
      setDescription('')
      setFiles([])
      setCategory('agenda_reservas')
      setView('list')
      loadTickets(tenantId)
    } catch (e: any) {
      setSubmitMsg('Error: ' + e.message)
    } finally {
      setSubmitting(false)
    }
  }

  const openTicket = async (ticket: any) => {
    setSelectedTicket(ticket)
    setView('detail')
    setMessages([])
    const res = await apiFetch(`${BACKEND_URL}/support/tickets/${ticket.id}/messages?tenant_id=${tenantId}`)
    const data = await res.json()
    const msgs = Array.isArray(data) ? data : []
    setMessages(msgs)
    const allAttachments = [
      ...(ticket.attachments ?? []),
      ...msgs.flatMap((m: any) => m.attachments ?? []),
    ]
    if (allAttachments.length > 0) {
      resolveAttachmentUrls(ticket.id, allAttachments)
    }
    if (ticket.has_unread_for_customer) {
      await apiFetch(`${BACKEND_URL}/support/tickets/${ticket.id}/mark-read`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tenant_id: tenantId }),
      })
      loadTickets(tenantId)
    }
  }

  const handleReply = async () => {
    if (!replyText.trim()) return
    setSendingReply(true)
    try {
      const attachmentUrls = replyFiles.length > 0 ? await uploadFiles(replyFiles) : []
      const res = await apiFetch(`${BACKEND_URL}/support/tickets/${selectedTicket.id}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenant_id: tenantId,
          sender_id: currentUser?.id,
          message: replyText,
          attachments: attachmentUrls,
        }),
      })
      const data = await res.json()
      if (res.ok) {
        setMessages(prev => [...prev, data])
        if (attachmentUrls.length > 0) {
          resolveAttachmentUrls(selectedTicket.id, attachmentUrls)
        }
        setReplyText('')
        setReplyFiles([])
        loadTickets(tenantId)
      }
    } catch (e) {
      console.error('Error enviando respuesta:', e)
    } finally {
      setSendingReply(false)
    }
  }

  const handleConfirmResolution = async (confirmed: boolean) => {
    setConfirmingResolution(true)
    try {
      const res = await apiFetch(`${BACKEND_URL}/support/tickets/${selectedTicket.id}/confirm-resolution`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tenant_id: tenantId, confirmed }),
      })
      const data = await res.json()
      if (res.ok) {
        setSelectedTicket((prev: any) => ({ ...prev, status: data.status }))
        loadTickets(tenantId)
      }
    } catch (e) {
      console.error('Error confirmando resolución:', e)
    } finally {
      setConfirmingResolution(false)
    }
  }

  const canReply = selectedTicket && !['closed'].includes(selectedTicket.status)

  return (
    <div className="p-6 max-w-2xl mx-auto">

      {/* TABS */}
      {(view === 'faq' || view === 'list') && (
        <div className="flex items-center gap-1 mb-6 border-b" style={{ borderColor: "var(--border-color)" }}>
          <button
            onClick={() => setView('faq')}
            className="px-4 py-2.5 text-sm font-medium border-b-2 -mb-px rounded-t-lg cursor-pointer transition-colors hover:bg-[var(--bg-soft)]"
            style={view === 'faq'
              ? { borderColor: '#3b82f6', color: '#60a5fa' }
              : { borderColor: 'transparent', color: "var(--text-muted)" }}
          >
            Preguntas frecuentes
          </button>
          <button
            onClick={() => setView('list')}
            className="px-4 py-2.5 text-sm font-medium border-b-2 -mb-px rounded-t-lg cursor-pointer transition-colors hover:bg-[var(--bg-soft)]"
            style={view === 'list'
              ? { borderColor: '#3b82f6', color: '#60a5fa' }
              : { borderColor: 'transparent', color: "var(--text-muted)" }}
          >
            Mis tickets
          </button>
        </div>
      )}

      {/* PREGUNTAS FRECUENTES */}
      {view === 'faq' && <FaqAccordion />}

      {/* LISTA DE TICKETS */}
      {view === 'list' && (
        <>
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-lg font-semibold" style={{ color: "var(--text-main)" }}>Soporte</h2>
              <p className="text-sm" style={{ color: "var(--text-muted)" }}>Crea un ticket y te contactaremos lo antes posible.</p>
            </div>
            <button
              onClick={() => setView('new')}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 active:scale-95 text-white text-sm font-medium transition-all flex items-center gap-2"
            >
              <i className="ti ti-plus" style={{ fontSize: 14 }} aria-hidden="true" />
              Nuevo ticket
            </button>
          </div>

          {tickets.length === 0 ? (
            <div className="rounded-2xl border p-8 text-center" style={{ background: "var(--bg-card)", borderColor: "var(--border-color)" }}>
              <i className="ti ti-headset mb-2 block" style={{ fontSize: 28, color: "var(--text-muted)", opacity: 0.4 }} aria-hidden="true" />
              <p className="text-sm" style={{ color: "var(--text-muted)" }}>No tienes tickets creados aún.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {tickets.map(t => {
                const badge = PRIORITY_BADGE[t.priority] ?? PRIORITY_BADGE.normal
                const status = STATUS_LABEL[t.status] ?? STATUS_LABEL.open
                return (
                  <button
                    key={t.id}
                    onClick={() => openTicket(t)}
                    className="w-full text-left rounded-2xl border p-4 transition-colors relative hover:opacity-90"
                    style={{ background: "var(--bg-card)", borderColor: "var(--border-color)" }}
                  >
                    {t.has_unread_for_customer && (
                      <span className="absolute top-3 right-3 w-2.5 h-2.5 bg-red-500 rounded-full" />
                    )}
                    <div className="flex items-center justify-between mb-1 pr-4">
                      <p className="text-sm font-medium" style={{ color: "var(--text-main)" }}>{t.subject}</p>
                      <span className={`text-xs px-2 py-0.5 rounded-full border ${badge.color}`}>{badge.label}</span>
                    </div>
                    <div className="flex items-center gap-3 text-xs">
                      <span className={status.color}>{status.label}</span>
                      <span style={{ color: "var(--text-muted)", opacity: 0.5 }}>
                        {new Date(t.created_at).toLocaleDateString('es-CL', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </>
      )}

      {/* FORMULARIO NUEVO TICKET */}
      {view === 'new' && (
        <>
          <button
            onClick={() => setView('list')}
            className="text-sm text-blue-400 hover:text-blue-300 mb-4 flex items-center gap-1"
          >
            <i className="ti ti-arrow-left" style={{ fontSize: 14 }} aria-hidden="true" /> Volver
          </button>
          <h2 className="text-lg font-semibold mb-1" style={{ color: "var(--text-main)" }}>Nuevo ticket</h2>
          <p className="text-sm mb-5" style={{ color: "var(--text-muted)" }}>Describe tu problema y te contactaremos lo antes posible.</p>

          <div className="rounded-2xl border p-5 space-y-4" style={{ background: "var(--bg-card)", borderColor: "var(--border-color)" }}>
            <div>
              <label className="text-xs mb-1 flex items-center justify-between" style={{ color: "var(--text-muted)" }}>
                <span>Asunto</span>
                <span style={{ opacity: 0.5 }}>{subject.length}/80</span>
              </label>
              <input
                value={subject}
                onChange={e => setSubject(e.target.value.slice(0, 80))}
                maxLength={80}
                placeholder="Resume tu problema en pocas palabras"
                className={inp}
              />
            </div>

            <div>
              <label className="text-xs mb-1 block" style={{ color: "var(--text-muted)" }}>Categoría</label>
              <select
                value={category}
                onChange={e => setCategory(e.target.value)}
                className={inp}
              >
                {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>

            <div>
              <label className="text-xs mb-1 block" style={{ color: "var(--text-muted)" }}>Descripción</label>
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                rows={5}
                placeholder="Cuéntanos qué pasó con el mayor detalle posible"
                className={inp + " resize-none"}
              />
            </div>

            <div>
              <label className="text-xs mb-1 block" style={{ color: "var(--text-muted)" }}>Captura de pantalla (máximo 1, hasta 1MB)</label>
              <input
                id="ticket-file-input"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={e => handleFileSelect(e, setFiles, files)}
                disabled={files.length >= 1}
                className="hidden"
              />
              <label
                htmlFor="ticket-file-input"
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-medium cursor-pointer transition-all active:scale-95 ${
                  files.length >= 1 ? 'opacity-40 cursor-not-allowed' : 'hover:opacity-80'
                }`}
                style={{ borderColor: "var(--border-color)", color: "var(--text-muted)" }}
              >
                <i className="ti ti-upload" style={{ fontSize: 14 }} aria-hidden="true" />
                Subir captura
              </label>
              {files.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {files.map((f, i) => (
                    <span key={i} className="text-xs rounded-lg border px-2 py-1 flex items-center gap-1" style={{ background: "var(--bg-soft)", borderColor: "var(--border-color)", color: "var(--text-main)" }}>
                      <i className="ti ti-photo" style={{ fontSize: 12 }} aria-hidden="true" />
                      {f.name}
                      <button onClick={() => setFiles(files.filter((_, idx) => idx !== i))} className="hover:text-red-400 transition-colors ml-1 font-bold leading-none">
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {submitMsg && <p className="text-xs text-red-400">{submitMsg}</p>}

            <button
              onClick={handleCreateTicket}
              disabled={submitting}
              className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 active:scale-95 text-white text-sm font-medium transition-all disabled:opacity-50 disabled:hover:bg-blue-600"
            >
              {submitting ? 'Enviando...' : 'Crear ticket'}
            </button>
          </div>
        </>
      )}

      {/* DETALLE DE TICKET */}
      {view === 'detail' && selectedTicket && (
        <>
          <button
            onClick={() => setView('list')}
            className="text-sm text-blue-400 hover:text-blue-300 mb-4 flex items-center gap-1"
          >
            <i className="ti ti-arrow-left" style={{ fontSize: 14 }} aria-hidden="true" /> Volver a mis tickets
          </button>

          <div className="rounded-2xl border p-5 mb-4" style={{ background: "var(--bg-card)", borderColor: "var(--border-color)" }}>
            <div className="flex items-start justify-between gap-3 mb-1">
              <h2 className="text-base font-semibold" style={{ color: "var(--text-main)" }}>{selectedTicket.subject}</h2>
              {(() => {
                const s = STATUS_LABEL[selectedTicket.status] ?? STATUS_LABEL.open
                return (
                  <span className={`shrink-0 text-xs px-2 py-0.5 rounded-full border ${s.bg} ${s.color}`}>
                    {s.label}
                  </span>
                )
              })()}
            </div>
            <p className="text-xs mb-3" style={{ color: "var(--text-muted)", opacity: 0.6 }}>
              {CATEGORIES.find(c => c.value === selectedTicket.category)?.label} ·{' '}
              {new Date(selectedTicket.created_at).toLocaleDateString('es-CL')}
            </p>
            <p className="text-sm" style={{ color: "var(--text-main)", opacity: 0.85 }}>{selectedTicket.description}</p>
            {selectedTicket.attachments?.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {selectedTicket.attachments.map((url: string, i: number) => {
                  const signedUrl = signedAttachmentUrls[url]
                  if (!signedUrl) return null
                  return (
                    <a key={i} href={signedUrl} target="_blank" rel="noopener noreferrer">
                      <img src={signedUrl} alt="" className="w-20 h-20 object-cover rounded-lg border" style={{ borderColor: "var(--border-color)" }} />
                    </a>
                  )
                })}
              </div>
            )}
          </div>

          {/* Banner de confirmación de resolución */}
          {selectedTicket.status === 'waiting_confirmation' && (
            <div className="bg-amber-500/10 border border-amber-500/25 rounded-2xl p-4 mb-4">
              <p className="text-sm font-medium mb-1" style={{ color: "var(--text-main)" }}>¿Se resolvió tu problema?</p>
              <p className="text-xs text-amber-300/70 mb-3">Marcamos este ticket como resuelto. Confírmanos si quedó solucionado.</p>
              <div className="flex gap-2">
                <button
                  onClick={() => handleConfirmResolution(true)}
                  disabled={confirmingResolution}
                  className="flex-1 py-2 rounded-xl bg-green-600/20 hover:bg-green-600/30 active:scale-95 border border-green-600/30 text-green-400 text-sm font-medium transition-all disabled:opacity-50"
                >
                  Sí, se resolvió
                </button>
                <button
                  onClick={() => handleConfirmResolution(false)}
                  disabled={confirmingResolution}
                  className="flex-1 py-2 rounded-xl bg-red-600/20 hover:bg-red-600/30 active:scale-95 border border-red-600/30 text-red-400 text-sm font-medium transition-all disabled:opacity-50"
                >
                  No, sigue el problema
                </button>
              </div>
            </div>
          )}

          {/* Hilo de mensajes */}
          {messages.length > 0 && (
            <div className="space-y-3 mb-4">
              {messages.map(m => (
                <div
                  key={m.id}
                  className={`p-3 rounded-xl max-w-[85%] border ${
                    m.sender_type === 'support'
                      ? 'bg-blue-600/20 border-blue-600/30'
                      : 'ml-auto'
                  }`}
                  style={m.sender_type !== 'support' ? { background: "var(--bg-soft)", borderColor: "var(--border-color)" } : undefined}
                >
                  <p className="text-xs mb-1" style={{ color: "var(--text-muted)", opacity: 0.6 }}>{m.sender_type === 'support' ? 'Soporte Orbyx' : 'Tú'}</p>
                  <p className="text-sm" style={{ color: "var(--text-main)" }}>{m.message}</p>
                  {m.attachments?.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {m.attachments.map((url: string, i: number) => {
                        const signedUrl = signedAttachmentUrls[url]
                        if (!signedUrl) return null
                        return (
                          <a key={i} href={signedUrl} target="_blank" rel="noopener noreferrer">
                            <img src={signedUrl} alt="" className="w-16 h-16 object-cover rounded-lg border" style={{ borderColor: "var(--border-color)" }} />
                          </a>
                        )
                      })}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Formulario de respuesta */}
          {canReply && (
            <div className="rounded-2xl border p-4" style={{ background: "var(--bg-card)", borderColor: "var(--border-color)" }}>
              <textarea
                value={replyText}
                onChange={e => setReplyText(e.target.value)}
                rows={3}
                placeholder="Escribe tu respuesta..."
                className={inp + " resize-none mb-3"}
              />
              <div className="flex items-center justify-between gap-3">
                <div>
                  <input
                    id="reply-file-input"
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={e => handleFileSelect(e, setReplyFiles, replyFiles)}
                    disabled={replyFiles.length >= 1}
                    className="hidden"
                  />
                  <label
                    htmlFor="reply-file-input"
                    className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-medium cursor-pointer transition-all active:scale-95 ${
                      replyFiles.length >= 1 ? 'opacity-40 cursor-not-allowed' : 'hover:opacity-80'
                    }`}
                    style={{ borderColor: "var(--border-color)", color: "var(--text-muted)" }}
                  >
                    <i className="ti ti-upload" style={{ fontSize: 12 }} aria-hidden="true" />
                    {replyFiles.length > 0 ? '1/1' : 'Imagen'}
                  </label>
                </div>
                <button
                  onClick={handleReply}
                  disabled={sendingReply || !replyText.trim()}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 active:scale-95 text-white text-sm font-medium transition-all disabled:opacity-50 disabled:hover:bg-blue-600"
                >
                  {sendingReply ? 'Enviando...' : 'Responder'}
                </button>
              </div>
              {replyFiles.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {replyFiles.map((f, i) => (
                    <span key={i} className="text-xs rounded-lg border px-2 py-1 flex items-center gap-1" style={{ background: "var(--bg-soft)", borderColor: "var(--border-color)", color: "var(--text-main)" }}>
                      <i className="ti ti-photo" style={{ fontSize: 12 }} aria-hidden="true" />
                      {f.name}
                      <button onClick={() => setReplyFiles(replyFiles.filter((_, idx) => idx !== i))} className="hover:text-red-400 transition-colors ml-1 font-bold leading-none">
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}
