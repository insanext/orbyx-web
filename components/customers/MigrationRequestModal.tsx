"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { CheckCircle2, Clock3, FileSpreadsheet, Loader2, Trash2, Upload, X } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { BACKEND_URL } from "@/lib/backend-url";

// Migración de datos (una sola vez por negocio): el negocio sube lo que
// exportó de su sistema anterior y el equipo de Orbyx lo carga por él.
// El servidor no abre los archivos; solo los guarda y avisa al equipo.
// Colores: variables --cust-* de la página Clientes (se renderiza dentro).

type MigrationRequest = {
  id: string;
  status: "pending" | "in_progress" | "done";
  notes: string;
  files: { name: string; size: number }[];
  created_at: string;
  completed_at: string | null;
};

const MAX_FILES = 5;
const MAX_BYTES = 10 * 1024 * 1024;
const ACCEPT = ".xlsx,.xls,.csv";

const STATUS_INFO: Record<MigrationRequest["status"], { label: string; text: string; color: string }> = {
  pending: {
    label: "Recibida",
    text: "Recibimos tus archivos. Nuestro equipo comenzará a cargarlos muy pronto.",
    color: "#d97706",
  },
  in_progress: {
    label: "En proceso",
    text: "Estamos cargando tus clientes y reservas. Te avisaremos cuando esté lista.",
    color: "#2563eb",
  },
  done: {
    label: "Lista",
    text: "Tu migración está lista: tus clientes y reservas ya están en Orbyx.",
    color: "#059669",
  },
};

function formatSize(bytes: number) {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

function formatDate(value: string | null) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("es-CL", { day: "numeric", month: "long", year: "numeric" });
}

export default function MigrationRequestModal({ slug, onClose }: { slug: string; onClose: () => void }) {
  const endpoint = `${BACKEND_URL}/customers/migration-request/${encodeURIComponent(slug)}`;
  const [loading, setLoading] = useState(true);
  const [available, setAvailable] = useState(true);
  const [request, setRequest] = useState<MigrationRequest | null>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [notes, setNotes] = useState("");
  const [confirmOnce, setConfirmOnce] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await apiFetch(endpoint);
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "No pudimos revisar el estado de tu migración.");
      setAvailable(data?.available !== false);
      setRequest(data?.request || null);
    } catch (e) {
      setError((e instanceof Error && e.message) || "No pudimos revisar el estado de tu migración.");
    } finally {
      setLoading(false);
    }
  }, [endpoint]);

  useEffect(() => {
    load();
  }, [load]);

  function addFiles(list: FileList | null) {
    if (!list) return;
    setError("");
    const next = [...files];
    for (const f of Array.from(list)) {
      const ext = f.name.toLowerCase().split(".").pop() || "";
      if (!["xlsx", "xls", "csv"].includes(ext)) {
        setError(`"${f.name}" no es un Excel ni un CSV.`);
        continue;
      }
      if (f.size > MAX_BYTES) {
        setError(`"${f.name}" pesa más de 10 MB.`);
        continue;
      }
      if (next.some((x) => x.name === f.name && x.size === f.size)) continue;
      if (next.length >= MAX_FILES) {
        setError(`Puedes subir hasta ${MAX_FILES} archivos.`);
        break;
      }
      next.push(f);
    }
    setFiles(next);
    if (inputRef.current) inputRef.current.value = "";
  }

  async function handleSend() {
    if (files.length === 0 || !confirmOnce) return;
    setSending(true);
    setError("");
    try {
      const fd = new FormData();
      files.forEach((f) => fd.append("files", f));
      if (notes.trim()) fd.append("notes", notes.trim());
      const res = await apiFetch(endpoint, { method: "POST", body: fd });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "No pudimos enviar tus archivos. Inténtalo de nuevo.");
      setRequest(data?.request || null);
      setFiles([]);
    } catch (e) {
      setError((e instanceof Error && e.message) || "No pudimos enviar tus archivos. Inténtalo de nuevo.");
    } finally {
      setSending(false);
    }
  }

  const status = request ? STATUS_INFO[request.status] || STATUS_INFO.pending : null;

  return (
    <div
      className="fixed inset-0 z-[96] flex items-end justify-center sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-label="Migrar mis datos"
    >
      <button
        type="button"
        aria-label="Cerrar"
        className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
        onClick={onClose}
      />

      <div
        className="relative flex max-h-[90vh] w-full flex-col overflow-hidden border sm:max-w-xl"
        style={{ background: "var(--cust-card-bg)", borderColor: "var(--cust-border)", borderRadius: 8, color: "var(--cust-ink)" }}
      >
        <div
          className="flex items-start justify-between gap-3 border-b px-4 py-3 sm:px-5"
          style={{ borderColor: "var(--cust-border)" }}
        >
          <div className="min-w-0">
            <h2 className="text-base font-semibold">Migrar mis datos</h2>
            <p className="mt-0.5 text-xs" style={{ color: "var(--cust-muted)" }}>
              Sube tu base de datos y nuestro equipo carga tus clientes y reservas por ti.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded"
            style={{ color: "var(--cust-muted)" }}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto px-4 py-4 sm:px-5">
          {loading ? (
            <div className="flex items-center gap-2 py-6 text-sm" style={{ color: "var(--cust-muted)" }}>
              <Loader2 className="h-4 w-4 animate-spin" />
              Cargando...
            </div>
          ) : !available ? (
            <p className="py-6 text-sm" style={{ color: "var(--cust-muted)" }}>
              La migración de datos aún no está disponible. Inténtalo más tarde.
            </p>
          ) : request && status ? (
            <div className="space-y-4">
              <div className="flex items-start gap-3 border px-3 py-3" style={{ borderColor: "var(--cust-border)", borderRadius: 6 }}>
                {request.status === "done" ? (
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" style={{ color: status.color }} />
                ) : (
                  <Clock3 className="mt-0.5 h-5 w-5 shrink-0" style={{ color: status.color }} />
                )}
                <div className="min-w-0">
                  <p className="text-sm font-semibold">
                    Estado:{" "}
                    <span style={{ color: status.color }}>{status.label}</span>
                  </p>
                  <p className="mt-0.5 text-xs" style={{ color: "var(--cust-muted)" }}>
                    {status.text}
                  </p>
                  <p className="mt-1 text-[11px]" style={{ color: "var(--cust-muted)" }}>
                    Enviada el {formatDate(request.created_at)}
                    {request.completed_at ? ` · Lista el ${formatDate(request.completed_at)}` : ""}
                  </p>
                </div>
              </div>

              <div>
                <p className="mb-1.5 text-xs font-semibold">Archivos enviados</p>
                <ul className="space-y-1">
                  {request.files.map((f, i) => (
                    <li key={`${f.name}-${i}`} className="flex items-center gap-2 text-xs" style={{ color: "var(--cust-muted)" }}>
                      <FileSpreadsheet className="h-3.5 w-3.5 shrink-0" />
                      <span className="min-w-0 truncate">{f.name}</span>
                      <span className="shrink-0">· {formatSize(f.size)}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <p className="text-[11px]" style={{ color: "var(--cust-muted)" }}>
                La migración se envía una sola vez. Si necesitas corregir algo, escríbenos desde Soporte.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-1.5 text-xs" style={{ color: "var(--cust-muted)" }}>
                <p>
                  Exporta desde tu sistema anterior <strong style={{ color: "var(--cust-ink)" }}>todo lo que tengas</strong>:
                  tus clientes y tus reservas, tanto las pasadas como las futuras.
                </p>
                <p>
                  Formatos: Excel (.xlsx o .xls) o CSV. Hasta {MAX_FILES} archivos de 10 MB cada uno.
                </p>
              </div>

              <input
                ref={inputRef}
                type="file"
                accept={ACCEPT}
                multiple
                className="hidden"
                onChange={(e) => addFiles(e.target.files)}
              />
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                disabled={files.length >= MAX_FILES}
                className="flex w-full flex-col items-center gap-1.5 border border-dashed px-4 py-6 text-center transition hover:opacity-80 disabled:opacity-50"
                style={{ borderColor: "var(--cust-border)", borderRadius: 6 }}
              >
                <Upload className="h-5 w-5" style={{ color: "var(--cust-blue-solid)" }} />
                <span className="text-sm font-semibold">Elegir archivos</span>
                <span className="text-[11px]" style={{ color: "var(--cust-muted)" }}>
                  {files.length}/{MAX_FILES} archivos
                </span>
              </button>

              {files.length > 0 ? (
                <ul className="space-y-1.5">
                  {files.map((f, i) => (
                    <li
                      key={`${f.name}-${f.size}`}
                      className="flex items-center gap-2 border px-2.5 py-1.5 text-xs"
                      style={{ borderColor: "var(--cust-border)", borderRadius: 6 }}
                    >
                      <FileSpreadsheet className="h-3.5 w-3.5 shrink-0" style={{ color: "var(--cust-blue-solid)" }} />
                      <span className="min-w-0 flex-1 truncate">{f.name}</span>
                      <span className="shrink-0" style={{ color: "var(--cust-muted)" }}>
                        {formatSize(f.size)}
                      </span>
                      <button
                        type="button"
                        onClick={() => setFiles((prev) => prev.filter((_, k) => k !== i))}
                        aria-label={`Quitar ${f.name}`}
                        className="flex h-6 w-6 shrink-0 items-center justify-center rounded"
                        style={{ color: "var(--cust-muted)" }}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </li>
                  ))}
                </ul>
              ) : null}

              <div>
                <label htmlFor="migration-notes" className="mb-1 block text-xs font-semibold">
                  Comentarios (opcional)
                </label>
                <textarea
                  id="migration-notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value.slice(0, 2000))}
                  rows={3}
                  placeholder="Ej: las reservas futuras empiezan el lunes; el archivo 2 tiene los clientes."
                  className="w-full resize-none border px-3 py-2 text-sm outline-none"
                  style={{ borderColor: "var(--cust-border)", background: "var(--cust-card-bg)", color: "var(--cust-ink)", borderRadius: 6 }}
                />
              </div>

              <label className="flex cursor-pointer items-start gap-2 text-xs">
                <input
                  type="checkbox"
                  checked={confirmOnce}
                  onChange={(e) => setConfirmOnce(e.target.checked)}
                  className="mt-0.5 h-4 w-4 shrink-0"
                />
                <span>
                  Entiendo que la migración se envía <strong>una sola vez</strong> y que incluí todos mis archivos.
                </span>
              </label>
            </div>
          )}

          {error ? (
            <p className="text-xs" style={{ color: "#dc2626" }}>
              {error}
            </p>
          ) : null}
        </div>

        {!loading && available && !request ? (
          <div className="flex justify-end gap-2 border-t px-4 py-3 sm:px-5" style={{ borderColor: "var(--cust-border)" }}>
            <button
              type="button"
              onClick={onClose}
              className="rounded border px-3.5 py-2 text-xs font-semibold"
              style={{ borderColor: "var(--cust-border)", color: "var(--cust-ink)" }}
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSend}
              disabled={sending || files.length === 0 || !confirmOnce}
              className="inline-flex items-center gap-1.5 rounded px-3.5 py-2 text-xs font-semibold text-white disabled:opacity-50"
              style={{ background: "var(--cust-blue-solid)" }}
            >
              {sending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
              {sending ? "Enviando..." : "Enviar migración"}
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
