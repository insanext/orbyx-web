"use client";

import { useEffect, useState } from "react";
import { Check, ExternalLink } from "lucide-react";
import { BACKEND_URL } from "@/lib/backend-url";
import { apiFetch } from "@/lib/api";
import { PUBLIC_TEMPLATES, isKnownPublicTemplate } from "@/lib/public-templates";

// "Diseño de tu página" (Mi Negocio). Guarda al hacer clic, contra
// PATCH /tenants/:id/public-template (endpoint aislado: no pasa por el
// formulario "Guardar cambios" del negocio).
export default function PublicTemplatePicker({
  tenantId,
  slug,
  canEdit,
}: {
  tenantId: string;
  slug: string;
  canEdit: boolean;
}) {
  const [selected, setSelected] = useState("clasica");
  const [available, setAvailable] = useState(true);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState("");
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");

  useEffect(() => {
    if (!tenantId) return;
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const res = await apiFetch(`${BACKEND_URL}/tenants/${tenantId}/public-template`);
        const data = await res.json().catch(() => ({}));
        if (cancelled) return;
        if (!res.ok) throw new Error(data?.error || "No se pudo cargar el diseño de tu página");
        setAvailable(data.available !== false);
        setSelected(isKnownPublicTemplate(data.public_template) ? data.public_template : "clasica");
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "No se pudo cargar el diseño de tu página");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [tenantId]);

  async function choose(id: string) {
    if (!canEdit || !available || savingId || id === selected) return;
    const previous = selected;
    setSelected(id);
    setSavingId(id);
    setError("");
    setOk("");
    try {
      const res = await apiFetch(`${BACKEND_URL}/tenants/${tenantId}/public-template`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ public_template: id }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "No se pudo guardar el diseño");
      setOk("Listo, tu página ya usa este diseño.");
    } catch (e) {
      setSelected(previous);
      setError(e instanceof Error ? e.message : "No se pudo guardar el diseño");
    } finally {
      setSavingId("");
    }
  }

  const pageHref = `/${encodeURIComponent(slug)}`;

  return (
    <section className="space-y-3">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold" style={{ color: "var(--text-main)" }}>
            Diseño de tu página
          </h2>
          <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
            Elige cómo se ve la página donde tus clientes reservan. Cambia solo los colores y el estilo, no cómo funcionan las reservas.
          </p>
        </div>
        <a
          href={pageHref}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 rounded-md border px-3 py-2 text-sm font-medium transition hover:brightness-95"
          style={{ borderColor: "var(--border-color)", color: "var(--text-main)", background: "var(--bg-card)" }}
        >
          Ver mi página
          <ExternalLink className="h-4 w-4" aria-hidden="true" />
        </a>
      </div>

      {!available && !loading ? (
        <div className="rounded-md border border-amber-300/60 bg-amber-500/10 px-4 py-3 text-sm text-amber-600">
          Los diseños todavía no están habilitados en tu cuenta. Se activarán en cuanto el equipo de Orbyx termine la actualización.
        </div>
      ) : null}
      {error ? (
        <div className="rounded-md border border-rose-300/60 bg-rose-500/10 px-4 py-3 text-sm text-rose-400">{error}</div>
      ) : null}
      {ok ? (
        <div className="rounded-md border border-emerald-300/60 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-500">{ok}</div>
      ) : null}
      {!canEdit ? (
        <p className="text-xs" style={{ color: "var(--text-muted)" }}>
          Solo el dueño o un administrador puede cambiar el diseño.
        </p>
      ) : null}

      <div role="radiogroup" aria-label="Diseño de tu página" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {PUBLIC_TEMPLATES.map((template) => {
          const isSelected = template.id === selected;
          const disabled = !canEdit || !available || loading || Boolean(savingId);
          return (
            <div
              key={template.id}
              className="flex flex-col border p-3"
              style={{
                borderColor: isSelected ? "var(--accent-solid)" : "var(--border-color)",
                background: "var(--bg-card)",
                boxShadow: isSelected ? "0 0 0 1px var(--accent-solid)" : undefined,
              }}
            >
              <button
                type="button"
                role="radio"
                aria-checked={isSelected}
                disabled={disabled}
                onClick={() => choose(template.id)}
                className="flex flex-1 flex-col gap-3 text-left disabled:cursor-not-allowed disabled:opacity-70"
              >
                <div
                  className="flex h-20 items-end gap-2 rounded-md border p-2"
                  style={{ background: template.swatch[0], borderColor: "rgba(0,0,0,0.08)" }}
                  aria-hidden="true"
                >
                  <span className="h-8 w-16 rounded-sm" style={{ background: template.swatch[1] }} />
                  <span className="h-2 w-10 rounded-sm" style={{ background: template.swatch[2] }} />
                  <span className="h-2 w-6 rounded-sm opacity-50" style={{ background: template.swatch[2] }} />
                </div>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold" style={{ color: "var(--text-main)" }}>
                      {template.name}
                    </p>
                    <p className="mt-0.5 text-xs" style={{ color: "var(--text-muted)" }}>
                      {template.description}
                    </p>
                  </div>
                  {isSelected ? (
                    <span
                      className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-white"
                      style={{ background: "var(--accent-solid)" }}
                    >
                      <Check className="h-4 w-4" aria-label="Elegida" />
                    </span>
                  ) : null}
                </div>
              </button>
              <a
                href={`${pageHref}?template=${encodeURIComponent(template.id)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 inline-flex items-center gap-1 text-xs font-medium underline-offset-2 hover:underline"
                style={{ color: "var(--text-muted)" }}
              >
                Probar sin guardar
                <ExternalLink className="h-3 w-3" aria-hidden="true" />
              </a>
            </div>
          );
        })}
      </div>
    </section>
  );
}
