"use client";

// Catálogo de extras de la sucursal (panel Servicios). Un extra es un
// agregado opcional que el cliente suma a un servicio al reservar
// (ej. "Lavado +$2.000 +15 min"). Qué servicio ofrece cada extra se elige en
// el formulario de cada servicio. Backend: /service-extras (server.js).

import { useState } from "react";
import { apiFetch } from "@/lib/api";
import { BACKEND_URL } from "@/lib/backend-url";

export type ServiceExtra = {
  id: string;
  name: string;
  description?: string | null;
  price: number;
  duration_minutes: number;
  active: boolean;
  sort_order?: number;
};

type Draft = { name: string; price: string; duration_minutes: string };

const EMPTY_DRAFT: Draft = { name: "", price: "", duration_minutes: "0" };

const inputStyle = {
  borderColor: "var(--border-color)",
  background: "var(--bg-card)",
  color: "var(--text-main)",
};

export function formatExtraPrice(price: number) {
  return `+${new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    maximumFractionDigits: 0,
  }).format(Number(price) || 0)}`;
}

export function formatExtraMinutes(minutes: number) {
  return minutes > 0 ? `+${minutes} min` : "sin tiempo extra";
}

function ExtraForm({
  draft,
  setDraft,
  onSubmit,
  onCancel,
  saving,
  submitLabel,
}: {
  draft: Draft;
  setDraft: (d: Draft) => void;
  onSubmit: () => void;
  onCancel: () => void;
  saving: boolean;
  submitLabel: string;
}) {
  const minutes = Number(draft.duration_minutes || 0);
  const oddMinutes = minutes > 0 && minutes % 15 !== 0;
  return (
    <div className="space-y-2 rounded-md border p-3" style={{ borderColor: "rgba(37,99,235,0.35)", background: "var(--bg-soft)" }}>
      <input
        autoFocus
        placeholder="Nombre del extra (ej. Lavado)"
        value={draft.name}
        maxLength={80}
        onChange={(e) => setDraft({ ...draft, name: e.target.value })}
        className="w-full rounded-md border px-3 py-2 text-sm placeholder:text-slate-400"
        style={inputStyle}
      />
      <div className="grid grid-cols-2 gap-2">
        <label className="space-y-1">
          <span className="text-[11px] font-medium" style={{ color: "var(--text-muted)" }}>
            Precio
          </span>
          <input
            type="number"
            min="0"
            inputMode="numeric"
            placeholder="2000"
            value={draft.price}
            onChange={(e) => setDraft({ ...draft, price: e.target.value })}
            className="w-full rounded-md border px-3 py-2 text-sm placeholder:text-slate-400"
            style={inputStyle}
          />
        </label>
        <label className="space-y-1">
          <span className="text-[11px] font-medium" style={{ color: "var(--text-muted)" }}>
            Minutos extra (opcional)
          </span>
          <input
            type="number"
            min="0"
            max="240"
            step="5"
            inputMode="numeric"
            value={draft.duration_minutes}
            onChange={(e) => setDraft({ ...draft, duration_minutes: e.target.value })}
            className="w-full rounded-md border px-3 py-2 text-sm"
            style={inputStyle}
          />
        </label>
      </div>
      <p className="text-[11px] leading-4" style={{ color: oddMinutes ? "#d97706" : "var(--text-muted)" }}>
        {oddMinutes
          ? "Te recomendamos múltiplos de 15 min: así no quedan huecos sueltos en la agenda."
          : "Si el extra toma tiempo, súmalo aquí: la cita durará más y bloqueará ese tiempo. Deja 0 si solo suma precio."}
      </p>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={onSubmit}
          disabled={saving}
          className="inline-flex h-9 items-center justify-center rounded-md px-3 text-sm font-medium text-white disabled:opacity-60"
          style={{ background: "linear-gradient(135deg, rgb(37 99 235), rgb(14 165 233))" }}
        >
          {saving ? "Guardando..." : submitLabel}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={saving}
          className="inline-flex h-9 items-center justify-center rounded-md border px-3 text-sm disabled:opacity-60"
          style={inputStyle}
        >
          Cancelar
        </button>
      </div>
    </div>
  );
}

export default function ServiceExtrasManager({
  tenantId,
  branchId,
  extras,
  usageByExtra,
  canEdit,
  onChanged,
}: {
  tenantId: string;
  branchId: string;
  extras: ServiceExtra[];
  usageByExtra: Record<string, number>;
  canEdit: boolean;
  onChanged: () => Promise<void> | void;
}) {
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Draft>(EMPTY_DRAFT);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function validate(d: Draft) {
    if (!d.name.trim()) return "Ingresa el nombre del extra";
    const price = Number(d.price || 0);
    if (!Number.isFinite(price) || price < 0) return "El precio no es válido";
    const minutes = Number(d.duration_minutes || 0);
    if (!Number.isInteger(minutes) || minutes < 0 || minutes > 240) {
      return "Los minutos deben ser un número entero entre 0 y 240";
    }
    return "";
  }

  async function submit(method: "POST" | "PATCH", id?: string) {
    const problem = validate(draft);
    if (problem) {
      setError(problem);
      return;
    }
    try {
      setSaving(true);
      setError("");
      const res = await apiFetch(`${BACKEND_URL}/service-extras${id ? `/${id}` : ""}`, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenant_id: tenantId,
          branch_id: branchId,
          name: draft.name.trim(),
          price: Math.round(Number(draft.price || 0)),
          duration_minutes: Number(draft.duration_minutes || 0),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "No se pudo guardar el extra");
      setCreating(false);
      setEditingId(null);
      setDraft(EMPTY_DRAFT);
      await onChanged();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "No se pudo guardar el extra");
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(extra: ServiceExtra) {
    try {
      setError("");
      const res = await apiFetch(`${BACKEND_URL}/service-extras/${extra.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tenant_id: tenantId, active: !extra.active }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "No se pudo actualizar el extra");
      await onChanged();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "No se pudo actualizar el extra");
    }
  }

  async function remove(id: string) {
    try {
      setSaving(true);
      setError("");
      const res = await apiFetch(`${BACKEND_URL}/service-extras/${id}?tenant_id=${tenantId}`, {
        method: "DELETE",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "No se pudo eliminar el extra");
      setConfirmDeleteId(null);
      await onChanged();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "No se pudo eliminar el extra");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-3 rounded-md border p-4" style={{ borderColor: "var(--border-color)", background: "var(--bg-card)" }}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold" style={{ color: "var(--text-main)" }}>
            Extras
          </h3>
          <p className="text-xs leading-5" style={{ color: "var(--text-muted)" }}>
            Agregados opcionales que tu cliente puede sumar al reservar, como un lavado o un diseño. Luego elige en cada servicio cuáles ofrece.
          </p>
        </div>
        {canEdit && !creating && (
          <button
            type="button"
            onClick={() => {
              setEditingId(null);
              setDraft(EMPTY_DRAFT);
              setError("");
              setCreating(true);
            }}
            className="shrink-0 text-xs px-3 py-1.5 rounded-md border border-blue-900/30 hover:border-blue-500/40 transition-colors"
            style={{ color: "var(--text-muted)" }}
          >
            + Nuevo extra
          </button>
        )}
      </div>

      {error ? (
        <p className="text-xs rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-red-400">{error}</p>
      ) : null}

      {creating && (
        <ExtraForm
          draft={draft}
          setDraft={setDraft}
          saving={saving}
          submitLabel="Crear extra"
          onSubmit={() => submit("POST")}
          onCancel={() => {
            setCreating(false);
            setError("");
          }}
        />
      )}

      {extras.length === 0 && !creating ? (
        <p className="text-xs" style={{ color: "var(--text-muted)" }}>
          Todavía no tienes extras en esta sucursal.
        </p>
      ) : null}

      <div className="space-y-1.5">
        {extras.map((extra) =>
          editingId === extra.id ? (
            <ExtraForm
              key={extra.id}
              draft={draft}
              setDraft={setDraft}
              saving={saving}
              submitLabel="Guardar"
              onSubmit={() => submit("PATCH", extra.id)}
              onCancel={() => {
                setEditingId(null);
                setError("");
              }}
            />
          ) : (
            <div
              key={extra.id}
              className="flex flex-wrap items-center gap-2 rounded-md border px-3 py-2"
              style={{ borderColor: "var(--border-color)", opacity: extra.active ? 1 : 0.6 }}
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium" style={{ color: "var(--text-main)" }}>
                  {extra.name}
                </p>
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                  {formatExtraPrice(extra.price)} · {formatExtraMinutes(extra.duration_minutes)} ·{" "}
                  {usageByExtra[extra.id]
                    ? `en ${usageByExtra[extra.id]} servicio${usageByExtra[extra.id] === 1 ? "" : "s"}`
                    : "sin servicios"}
                  {!extra.active ? " · pausado" : ""}
                </p>
              </div>
              {canEdit &&
                (confirmDeleteId === extra.id ? (
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                      ¿Eliminar?
                    </span>
                    <button
                      type="button"
                      onClick={() => remove(extra.id)}
                      disabled={saving}
                      className="text-xs px-2.5 py-1 rounded-md border border-red-500/40 text-red-400 hover:bg-red-500/10"
                    >
                      Sí, eliminar
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmDeleteId(null)}
                      className="text-xs px-2.5 py-1 rounded-md border border-blue-900/30"
                      style={{ color: "var(--text-muted)" }}
                    >
                      No
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-1.5">
                    <button
                      type="button"
                      onClick={() => toggleActive(extra)}
                      className="text-xs px-2.5 py-1 rounded-md border border-blue-900/30 hover:border-blue-500/40"
                      style={{ color: "var(--text-muted)" }}
                    >
                      {extra.active ? "Pausar" : "Activar"}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setCreating(false);
                        setError("");
                        setDraft({
                          name: extra.name,
                          price: String(extra.price ?? ""),
                          duration_minutes: String(extra.duration_minutes ?? 0),
                        });
                        setEditingId(extra.id);
                      }}
                      className="text-xs px-2.5 py-1 rounded-md border border-blue-900/30 hover:border-blue-500/40"
                      style={{ color: "var(--text-muted)" }}
                    >
                      Editar
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmDeleteId(extra.id)}
                      className="text-xs px-2.5 py-1 rounded-md border border-transparent hover:text-red-400 hover:border-red-500/30"
                      style={{ color: "var(--text-muted)" }}
                    >
                      Eliminar
                    </button>
                  </div>
                ))}
            </div>
          )
        )}
      </div>
    </div>
  );
}

// Lista de checkboxes "Extras de este servicio" (formularios crear/editar).
export function ServiceExtrasPicker({
  extras,
  selectedIds,
  onToggle,
}: {
  extras: ServiceExtra[];
  selectedIds: string[];
  onToggle: (id: string) => void;
}) {
  return (
    <div className="space-y-2">
      <label className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>
        Extras que ofrece este servicio (opcional)
      </label>
      {extras.length === 0 ? (
        <p className="text-xs leading-5" style={{ color: "var(--text-muted)" }}>
          Aún no tienes extras. Créalos en el recuadro &quot;Extras&quot; y luego márcalos aquí.
        </p>
      ) : (
        <div className="space-y-1.5">
          {extras.map((extra) => {
            const checked = selectedIds.includes(extra.id);
            return (
              <label
                key={extra.id}
                className="flex items-center gap-2.5 rounded-md border px-3 py-2 text-sm cursor-pointer transition-colors"
                style={{
                  borderColor: checked ? "rgba(37,99,235,0.50)" : "var(--border-color)",
                  background: checked ? "rgba(37,99,235,0.08)" : "var(--bg-card)",
                  color: "var(--text-main)",
                  opacity: extra.active ? 1 : 0.6,
                }}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => onToggle(extra.id)}
                  className="accent-blue-500"
                />
                <span className="flex-1">{extra.name}</span>
                <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                  {formatExtraPrice(extra.price)} · {formatExtraMinutes(extra.duration_minutes)}
                  {!extra.active ? " · pausado" : ""}
                </span>
              </label>
            );
          })}
        </div>
      )}
    </div>
  );
}
