"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, ShieldOff, X } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { BACKEND_URL } from "@/lib/backend-url";
import type { BlockedContact } from "@/lib/blocked-contacts";

// Lista simple de contactos bloqueados para la reserva pública, con opción de
// desbloquear. Los colores vienen de las variables --cust-* de la página
// Clientes (se renderiza dentro de ella).

function formatBlockedDate(value: string) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("es-CL", { day: "2-digit", month: "short", year: "numeric" });
}

export default function BlockedContactsModal({
  slug,
  onClose,
}: {
  slug: string;
  onClose: () => void;
}) {
  const [items, setItems] = useState<BlockedContact[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await apiFetch(`${BACKEND_URL}/blocked-contacts/${encodeURIComponent(slug)}`);
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "No pudimos cargar los contactos bloqueados.");
      setItems(Array.isArray(data?.blocked) ? data.blocked : []);
    } catch (e: any) {
      setError(e?.message || "No pudimos cargar los contactos bloqueados.");
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleUnblock(item: BlockedContact) {
    const name = item.contact_name || item.email || item.phone || "este contacto";
    if (!window.confirm(`¿Desbloquear a ${name}? Podrá volver a reservar desde tu página pública.`)) return;
    setBusyId(item.id);
    setError("");
    try {
      const res = await apiFetch(
        `${BACKEND_URL}/blocked-contacts/${encodeURIComponent(slug)}/${item.id}`,
        { method: "DELETE" }
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "No pudimos desbloquear al contacto.");
      setItems((prev) => prev.filter((i) => i.id !== item.id));
    } catch (e: any) {
      setError(e?.message || "No pudimos desbloquear al contacto.");
    } finally {
      setBusyId("");
    }
  }

  return (
    <div
      className="fixed inset-0 z-[96] flex items-end justify-center sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-label="Contactos bloqueados"
    >
      <button
        type="button"
        aria-label="Cerrar"
        className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
        onClick={onClose}
      />

      <div
        className="relative flex max-h-[85vh] w-full flex-col overflow-hidden border sm:max-w-xl"
        style={{
          background: "var(--cust-card-bg)",
          borderColor: "var(--cust-border)",
          borderRadius: 8,
          color: "var(--cust-ink)",
        }}
      >
        <div
          className="flex items-start justify-between gap-3 border-b px-4 py-3 sm:px-5"
          style={{ borderColor: "var(--cust-border)" }}
        >
          <div className="min-w-0">
            <h2 className="text-base font-semibold">Contactos bloqueados</h2>
            <p className="mt-0.5 text-xs" style={{ color: "var(--cust-muted)" }}>
              No pueden reservar desde tu página pública. Tú sí puedes agendarles desde la Agenda.
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

        <div className="flex-1 space-y-2 overflow-y-auto px-4 py-4 sm:px-5">
          {error ? (
            <p className="text-xs" style={{ color: "#dc2626" }}>
              {error}
            </p>
          ) : null}

          {loading ? (
            <div className="flex items-center gap-2 py-6 text-sm" style={{ color: "var(--cust-muted)" }}>
              <Loader2 className="h-4 w-4 animate-spin" />
              Cargando...
            </div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-8 text-center">
              <ShieldOff className="h-6 w-6" style={{ color: "var(--cust-muted)" }} />
              <p className="text-sm" style={{ color: "var(--cust-muted)" }}>
                No tienes contactos bloqueados.
              </p>
            </div>
          ) : (
            items.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between gap-3 border px-3 py-2.5"
                style={{ borderColor: "var(--cust-border)", borderRadius: 6 }}
              >
                <div className="min-w-0">
                  <p className="break-words text-sm font-semibold">
                    {item.contact_name || "Sin nombre"}
                  </p>
                  <p className="break-words text-xs" style={{ color: "var(--cust-muted)" }}>
                    {[item.phone, item.email].filter(Boolean).join(" · ")}
                  </p>
                  <p className="text-[11px]" style={{ color: "var(--cust-muted)" }}>
                    Bloqueado el {formatBlockedDate(item.created_at)}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleUnblock(item)}
                  disabled={busyId === item.id}
                  className="shrink-0 rounded border px-3 py-1.5 text-xs font-semibold transition hover:opacity-80 disabled:opacity-60"
                  style={{ borderColor: "var(--cust-border)", color: "var(--cust-ink)" }}
                >
                  {busyId === item.id ? "Desbloqueando..." : "Desbloquear"}
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
