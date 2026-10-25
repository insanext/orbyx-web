"use client";

// Extras de la sucursal (panel Servicios). Un extra es un agregado opcional
// que el cliente suma a un servicio al reservar (ej. "Lavado +$2.000
// +15 min"). En el mismo formulario del extra se eligen los servicios que lo
// ofrecen. Backend: /service-extras (server.js).

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

export type ExtraLink = { service_id: string; extra_id: string };

export type ExtraServiceOption = {
  id: string;
  name: string;
  is_group?: boolean | null;
  active?: boolean;
};

type Draft = {
  name: string;
  price: string;
  duration_minutes: string;
  service_ids: string[];
};

const inputStyle = {
  borderColor: "var(--border-color)",
  background: "var(--bg-card)",
  color: "var(--text-main)",
};

const primaryButton =
  "inline-flex h-10 items-center justify-center rounded-md px-4 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-60";
const primaryStyle = { background: "linear-gradient(135deg, rgb(37 99 235), rgb(14 165 233))" };
const secondaryButton =
  "inline-flex h-10 items-center justify-center rounded-md border px-4 text-sm font-medium transition hover:border-blue-500/50 disabled:opacity-60";

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

// Botón tipo "chip" para elegir servicios/extras.
function Chip({
  selected,
  onClick,
  children,
  muted,
}: {
  selected: boolean;
  onClick: () => void;
  children: React.ReactNode;
  muted?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className="rounded-full border px-3 py-1.5 text-xs font-medium transition"
      style={{
        borderColor: selected ? "rgba(37,99,235,0.70)" : "var(--border-color)",
        background: selected ? "rgba(37,99,235,0.16)" : "transparent",
        color: selected ? "var(--text-main)" : "var(--text-muted)",
        opacity: muted ? 0.6 : 1,
      }}
    >
      {selected ? "✓ " : ""}
      {children}
    </button>
  );
}

function ExtraForm({
  title,
  draft,
  setDraft,
  services,
  saving,
  onSubmit,
  onCancel,
  footer,
}: {
  title: string;
  draft: Draft;
  setDraft: (d: Draft) => void;
  services: ExtraServiceOption[];
  saving: boolean;
  onSubmit: () => void;
  onCancel: () => void;
  footer?: React.ReactNode;
}) {
  const minutes = Number(draft.duration_minutes || 0);
  const oddMinutes = minutes > 0 && minutes % 15 !== 0;
  const allSelected = services.length > 0 && services.every((s) => draft.service_ids.includes(s.id));

  function toggleService(id: string) {
    setDraft({
      ...draft,
      service_ids: draft.service_ids.includes(id)
        ? draft.service_ids.filter((x) => x !== id)
        : [...draft.service_ids, id],
    });
  }

  return (
    <div className="space-y-4 rounded-md p-4" style={{ background: "var(--bg-soft)" }}>
      <p className="text-sm font-semibold" style={{ color: "var(--text-main)" }}>
        {title}
      </p>

      <input
        autoFocus
        placeholder="Nombre (ej. Lavado)"
        value={draft.name}
        maxLength={80}
        onChange={(e) => setDraft({ ...draft, name: e.target.value })}
        className="w-full rounded-md border px-3 py-2.5 text-sm placeholder:text-slate-400"
        style={inputStyle}
      />

      <div className="grid grid-cols-2 gap-3">
        <label className="space-y-1">
          <span className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>
            Precio
          </span>
          <input
            type="number"
            min="0"
            inputMode="numeric"
            placeholder="2000"
            value={draft.price}
            onChange={(e) => setDraft({ ...draft, price: e.target.value })}
            className="w-full rounded-md border px-3 py-2.5 text-sm placeholder:text-slate-400"
            style={inputStyle}
          />
        </label>
        <label className="space-y-1">
          <span className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>
            Minutos extra
          </span>
          <input
            type="number"
            min="0"
            max="240"
            step="5"
            inputMode="numeric"
            value={draft.duration_minutes}
            onChange={(e) => setDraft({ ...draft, duration_minutes: e.target.value })}
            className="w-full rounded-md border px-3 py-2.5 text-sm"
            style={inputStyle}
          />
        </label>
      </div>
      <p className="-mt-2 text-xs" style={{ color: oddMinutes ? "#d97706" : "var(--text-muted)" }}>
        {oddMinutes ? "Usa múltiplos de 15 para no dejar huecos en la agenda." : "Lo que alarga la cita. 0 si solo suma precio."}
      </p>

      <div className="space-y-2">
        <span className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>
          Se ofrece en
        </span>
        {services.length === 0 ? (
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>
            Primero crea un servicio.
          </p>
        ) : (
          <div className="flex flex-wrap gap-2">
            <Chip
              selected={allSelected}
              onClick={() =>
                setDraft({ ...draft, service_ids: allSelected ? [] : services.map((s) => s.id) })
              }
            >
              Todos
            </Chip>
            {services.map((s) => (
              <Chip
                key={s.id}
                selected={draft.service_ids.includes(s.id)}
                onClick={() => toggleService(s.id)}
                muted={s.active === false}
              >
                {s.name}
              </Chip>
            ))}
          </div>
        )}
      </div>

      <div className="flex gap-2">
        <button type="button" onClick={onSubmit} disabled={saving} className={`${primaryButton} flex-1`} style={primaryStyle}>
          {saving ? "Guardando..." : "Guardar"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={saving}
          className={secondaryButton}
          style={{ borderColor: "var(--border-color)", color: "var(--text-main)" }}
        >
          Cancelar
        </button>
      </div>

      {footer}
    </div>
  );
}

export default function ServiceExtrasManager({
  tenantId,
  branchId,
  extras,
  links,
  services,
  canEdit,
  onChanged,
}: {
  tenantId: string;
  branchId: string;
  extras: ServiceExtra[];
  links: ExtraLink[];
  services: ExtraServiceOption[];
  canEdit: boolean;
  onChanged: () => Promise<void> | void;
}) {
  // null = cerrado, "new" = creando, id = editando ese extra.
  const [openId, setOpenId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Draft>({ name: "", price: "", duration_minutes: "0", service_ids: [] });
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Los servicios grupales no admiten extras.
  const eligibleServices = services.filter((s) => !s.is_group);

  function servicesOf(extraId: string) {
    return links.filter((l) => l.extra_id === extraId).map((l) => l.service_id);
  }

  function openNew() {
    setError("");
    setConfirmDelete(false);
    setDraft({ name: "", price: "", duration_minutes: "0", service_ids: [] });
    setOpenId("new");
  }

  function openEdit(extra: ServiceExtra) {
    setError("");
    setConfirmDelete(false);
    setDraft({
      name: extra.name,
      price: String(extra.price ?? ""),
      duration_minutes: String(extra.duration_minutes ?? 0),
      service_ids: servicesOf(extra.id),
    });
    setOpenId(extra.id);
  }

  function close() {
    setOpenId(null);
    setError("");
    setConfirmDelete(false);
  }

  async function call(url: string, method: string, body?: object) {
    const res = await apiFetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      ...(body ? { body: JSON.stringify({ tenant_id: tenantId, ...body }) } : {}),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data?.error || "No se pudo guardar");
    return data;
  }

  async function save() {
    if (!draft.name.trim()) return setError("Ingresa el nombre del extra");
    const price = Number(draft.price || 0);
    if (!Number.isFinite(price) || price < 0) return setError("El precio no es válido");
    const minutes = Number(draft.duration_minutes || 0);
    if (!Number.isInteger(minutes) || minutes < 0 || minutes > 240) {
      return setError("Los minutos deben ser un número entero entre 0 y 240");
    }

    try {
      setSaving(true);
      setError("");
      const fields = { name: draft.name.trim(), price: Math.round(price), duration_minutes: minutes };
      let extraId = openId;
      if (openId === "new") {
        const data = await call(`${BACKEND_URL}/service-extras`, "POST", { branch_id: branchId, ...fields });
        extraId = data?.extra?.id;
      } else {
        await call(`${BACKEND_URL}/service-extras/${openId}`, "PATCH", fields);
      }
      const current = openId === "new" ? [] : servicesOf(openId as string);
      const changed =
        current.length !== draft.service_ids.length || draft.service_ids.some((id) => !current.includes(id));
      if (extraId && changed) {
        await call(`${BACKEND_URL}/service-extras/${extraId}/services`, "PUT", { service_ids: draft.service_ids });
      }
      close();
      await onChanged();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "No se pudo guardar el extra");
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(extra: ServiceExtra) {
    try {
      setSaving(true);
      setError("");
      await call(`${BACKEND_URL}/service-extras/${extra.id}`, "PATCH", { active: !extra.active });
      close();
      await onChanged();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "No se pudo actualizar el extra");
    } finally {
      setSaving(false);
    }
  }

  async function remove(extra: ServiceExtra) {
    try {
      setSaving(true);
      setError("");
      const res = await apiFetch(`${BACKEND_URL}/service-extras/${extra.id}?tenant_id=${tenantId}`, { method: "DELETE" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "No se pudo eliminar el extra");
      close();
      await onChanged();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "No se pudo eliminar el extra");
    } finally {
      setSaving(false);
    }
  }

  const errorBox = error ? (
    <p className="rounded-md bg-red-500/10 px-3 py-2 text-xs text-red-400">{error}</p>
  ) : null;

  return (
    <div className="space-y-3 border-t pt-5" style={{ borderColor: "var(--border-color)" }}>
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-sm font-semibold" style={{ color: "var(--text-main)" }}>
            Extras
          </h3>
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>
            El cliente los suma al reservar.
          </p>
        </div>
        {canEdit && openId !== "new" && (
          <button type="button" onClick={openNew} className={`${primaryButton} shrink-0`} style={primaryStyle}>
            + Nuevo extra
          </button>
        )}
      </div>

      {openId === "new" && (
        <>
          {errorBox}
          <ExtraForm
            title="Nuevo extra"
            draft={draft}
            setDraft={setDraft}
            services={eligibleServices}
            saving={saving}
            onSubmit={save}
            onCancel={close}
          />
        </>
      )}

      {extras.length === 0 && openId !== "new" ? (
        <p className="py-2 text-xs" style={{ color: "var(--text-muted)" }}>
          Aún no tienes extras. Ej.: lavado, diseño, mascarilla.
        </p>
      ) : null}

      <div className="divide-y" style={{ borderColor: "var(--border-color)" }}>
        {extras.map((extra) => {
          const count = servicesOf(extra.id).length;
          if (openId === extra.id) {
            return (
              <div key={extra.id} className="space-y-2 py-3">
                {errorBox}
                <ExtraForm
                  title="Editar extra"
                  draft={draft}
                  setDraft={setDraft}
                  services={eligibleServices}
                  saving={saving}
                  onSubmit={save}
                  onCancel={close}
                  footer={
                    <div
                      className="flex flex-wrap items-center gap-x-5 gap-y-2 border-t pt-3 text-sm"
                      style={{ borderColor: "var(--border-color)" }}
                    >
                      {confirmDelete ? (
                        <>
                          <span style={{ color: "var(--text-muted)" }}>¿Eliminar este extra?</span>
                          <button type="button" onClick={() => remove(extra)} disabled={saving} className="font-semibold text-red-400">
                            Sí, eliminar
                          </button>
                          <button type="button" onClick={() => setConfirmDelete(false)} style={{ color: "var(--text-muted)" }}>
                            No
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            type="button"
                            onClick={() => toggleActive(extra)}
                            disabled={saving}
                            className="font-medium"
                            style={{ color: "var(--text-main)" }}
                          >
                            {extra.active ? "Pausar" : "Activar"}
                          </button>
                          <button type="button" onClick={() => setConfirmDelete(true)} className="font-medium text-red-400">
                            Eliminar
                          </button>
                        </>
                      )}
                    </div>
                  }
                />
              </div>
            );
          }
          return (
            <div key={extra.id} className="flex items-center gap-3 py-3" style={{ borderColor: "var(--border-color)" }}>
              <div className="min-w-0 flex-1">
                <p className="break-words text-sm font-medium" style={{ color: "var(--text-main)" }}>
                  {extra.name}
                  {!extra.active ? (
                    <span className="ml-2 rounded px-1.5 py-0.5 text-[10px] font-medium text-amber-500 bg-amber-500/10">
                      Pausado
                    </span>
                  ) : null}
                </p>
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                  {formatExtraPrice(extra.price)} · {formatExtraMinutes(extra.duration_minutes)} ·{" "}
                  {count ? `${count} servicio${count === 1 ? "" : "s"}` : "sin servicios"}
                </p>
              </div>
              {canEdit && (
                <button
                  type="button"
                  onClick={() => openEdit(extra)}
                  className={`${secondaryButton} shrink-0`}
                  style={{ borderColor: "var(--border-color)", color: "var(--text-main)" }}
                >
                  Editar
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Elegir extras desde el formulario de un servicio (crear/editar).
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
      <span className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>
        Extras (opcional)
      </span>
      {extras.length === 0 ? (
        <p className="text-xs" style={{ color: "var(--text-muted)" }}>
          Créalos en la sección Extras.
        </p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {extras.map((extra) => (
            <Chip
              key={extra.id}
              selected={selectedIds.includes(extra.id)}
              onClick={() => onToggle(extra.id)}
              muted={!extra.active}
            >
              {extra.name} {formatExtraPrice(extra.price)}
            </Chip>
          ))}
        </div>
      )}
    </div>
  );
}
