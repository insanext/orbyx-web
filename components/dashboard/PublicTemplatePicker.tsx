"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Check, ExternalLink, Loader2, Monitor, Smartphone } from "lucide-react";
import { BACKEND_URL } from "@/lib/backend-url";
import { apiFetch } from "@/lib/api";
import { PUBLIC_TEMPLATES, getPublicTemplate, isKnownPublicTemplate } from "@/lib/public-templates";

// "Diseño de tu página" (Mi Negocio).
// - Tocar una plantilla la muestra al tiro en la vista previa: es la página
//   pública REAL del negocio (/{slug}?embed=1) dentro de un iframe del mismo
//   origen; la plantilla se le manda por postMessage, sin recargar.
// - "Usar este diseño" la guarda (PATCH /tenants/:id/public-template, endpoint
//   aislado: no pasa por el formulario "Guardar cambios" del negocio).

const PREVIEW_HEIGHT = 640;
const DEVICE_WIDTH = { desktop: 1280, mobile: 390 } as const;
type Device = keyof typeof DEVICE_WIDTH;
const TEMPLATE_GROUPS = [
  { key: "suave", label: "Suaves · cambia el color de marca" },
  { key: "llamativo", label: "Llamativos · cambia toda la página" },
] as const;

export default function PublicTemplatePicker({
  tenantId,
  slug,
  canEdit,
}: {
  tenantId: string;
  slug: string;
  canEdit: boolean;
}) {
  const [saved, setSaved] = useState("clasica");
  const [preview, setPreview] = useState("clasica");
  const [available, setAvailable] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");
  const [device, setDevice] = useState<Device>("desktop");
  const [iframeSrc, setIframeSrc] = useState("");
  const [frameLoading, setFrameLoading] = useState(true);
  const [boxWidth, setBoxWidth] = useState(0);

  const iframeRef = useRef<HTMLIFrameElement>(null);
  const boxRef = useRef<HTMLDivElement>(null);
  const previewRef = useRef(preview);
  useEffect(() => {
    previewRef.current = preview;
  }, [preview]);

  const pageHref = `/${encodeURIComponent(slug)}`;

  useEffect(() => {
    if (!tenantId) return;
    let cancelled = false;
    (async () => {
      let current = "clasica";
      try {
        setLoading(true);
        const res = await apiFetch(`${BACKEND_URL}/tenants/${tenantId}/public-template`);
        const data = await res.json().catch(() => ({}));
        if (cancelled) return;
        if (!res.ok) throw new Error(data?.error || "No se pudo cargar el diseño de tu página");
        setAvailable(data.available !== false);
        if (isKnownPublicTemplate(data.public_template)) current = data.public_template;
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "No se pudo cargar el diseño de tu página");
      } finally {
        if (!cancelled) {
          setSaved(current);
          setPreview(current);
          // El iframe se arma una sola vez; después se cambia la plantilla por mensaje.
          setIframeSrc(`${pageHref}?embed=1&template=${encodeURIComponent(current)}`);
          setLoading(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [tenantId, pageHref]);

  // Ancho disponible para escalar la vista previa.
  useEffect(() => {
    const el = boxRef.current;
    if (!el) return;
    const update = () => setBoxWidth(el.clientWidth);
    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // En pantallas chicas parte en "Celular".
  useEffect(() => {
    if (typeof window !== "undefined" && window.innerWidth < 768) setDevice("mobile");
  }, []);

  const sendPreview = useCallback((id: string) => {
    try {
      iframeRef.current?.contentWindow?.postMessage(
        { type: "orbyx-template-preview", template: id },
        window.location.origin
      );
    } catch {
      // iframe aún no listo: se reenvía cuando avise "ready"
    }
  }, []);

  // La página embebida avisa cuando ya escucha: se le manda la plantilla actual.
  useEffect(() => {
    function onMessage(event: MessageEvent) {
      if (event.origin !== window.location.origin) return;
      if (event.source !== iframeRef.current?.contentWindow) return;
      if ((event.data as { type?: string } | null)?.type === "orbyx-template-preview-ready") {
        sendPreview(previewRef.current);
      }
    }
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [sendPreview]);

  function showTemplate(id: string) {
    setPreview(id);
    setOk("");
    setError("");
    sendPreview(id);
  }

  async function saveTemplate() {
    if (!canEdit || !available || saving || preview === saved) return;
    setSaving(true);
    setError("");
    setOk("");
    try {
      const res = await apiFetch(`${BACKEND_URL}/tenants/${tenantId}/public-template`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ public_template: preview }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "No se pudo guardar el diseño");
      setSaved(preview);
      setOk(`Listo, tu página ya usa el diseño ${getPublicTemplate(preview).name}.`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo guardar el diseño");
    } finally {
      setSaving(false);
    }
  }

  const deviceWidth = DEVICE_WIDTH[device];
  const scale = boxWidth > 0 ? Math.min(1, (boxWidth - 2) / deviceWidth) : 1;
  const frameWidth = deviceWidth;
  const frameHeight = Math.round(PREVIEW_HEIGHT / scale);
  const previewTemplate = getPublicTemplate(preview);
  const isDirty = preview !== saved;

  return (
    <section className="space-y-3">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold" style={{ color: "var(--text-main)" }}>
            Diseño de tu página
          </h2>
          <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
            Toca un diseño para verlo en tu página real. Cambia solo los colores y el estilo, no cómo funcionan las reservas.
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

      <div className="grid gap-4 lg:grid-cols-[280px_minmax(0,1fr)] lg:items-start">
        {/* Lista de diseños */}
        <div
          role="radiogroup"
          aria-label="Diseño de tu página"
          className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:max-h-[700px] lg:grid-cols-1 lg:overflow-y-auto lg:pr-1"
        >
          {TEMPLATE_GROUPS.flatMap((group) => [
            <p
              key={`group-${group.key}`}
              className="col-span-full mt-1 text-[11px] font-semibold uppercase tracking-wide first:mt-0"
              style={{ color: "var(--text-muted)" }}
            >
              {group.label}
            </p>,
            ...PUBLIC_TEMPLATES.filter((t) => (t.group || "suave") === group.key).map((template) => {
            const isPreview = template.id === preview;
            const isSaved = template.id === saved;
            return (
              <button
                key={template.id}
                type="button"
                role="radio"
                aria-checked={isPreview}
                disabled={loading}
                onClick={() => showTemplate(template.id)}
                className="flex flex-col gap-2 border p-2.5 text-left transition disabled:opacity-60"
                style={{
                  borderColor: isPreview ? "var(--accent-solid)" : "var(--border-color)",
                  background: "var(--bg-card)",
                  boxShadow: isPreview ? "0 0 0 1px var(--accent-solid)" : undefined,
                }}
              >
                <div
                  className="flex h-10 items-center gap-1.5 rounded-md border px-2"
                  style={{ background: template.swatch[0], borderColor: "rgba(0,0,0,0.08)" }}
                  aria-hidden="true"
                >
                  <span className="h-5 w-10 rounded-sm" style={{ background: template.swatch[1] }} />
                  <span className="h-1.5 w-8 rounded-sm" style={{ background: template.swatch[2] }} />
                  <span className="h-1.5 w-4 rounded-sm opacity-50" style={{ background: template.swatch[2] }} />
                </div>
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold" style={{ color: "var(--text-main)" }}>
                      {template.name}
                    </p>
                    <p className="mt-0.5 text-[11px] leading-snug" style={{ color: "var(--text-muted)" }}>
                      {template.description}
                    </p>
                  </div>
                  {isSaved ? (
                    <span
                      className="flex h-5 shrink-0 items-center gap-0.5 rounded-full px-1.5 text-[10px] font-semibold text-white"
                      style={{ background: "var(--accent-solid)" }}
                      title="Diseño actual de tu página"
                    >
                      <Check className="h-3 w-3" aria-hidden="true" />
                      Actual
                    </span>
                  ) : null}
                </div>
              </button>
            );
          }),
          ])}
        </div>

        {/* Vista previa en vivo */}
        <div className="min-w-0 space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>
              Vista previa: <strong style={{ color: "var(--text-main)" }}>{previewTemplate.name}</strong>
              {isDirty ? " (sin guardar)" : ""}
            </p>
            <div className="flex items-center gap-2">
              <div className="flex overflow-hidden rounded-md border" style={{ borderColor: "var(--border-color)" }}>
                {(["desktop", "mobile"] as Device[]).map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setDevice(d)}
                    aria-pressed={device === d}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium"
                    style={{
                      background: device === d ? "var(--accent-solid)" : "var(--bg-card)",
                      color: device === d ? "#fff" : "var(--text-main)",
                    }}
                  >
                    {d === "desktop" ? <Monitor className="h-3.5 w-3.5" /> : <Smartphone className="h-3.5 w-3.5" />}
                    {d === "desktop" ? "Computador" : "Celular"}
                  </button>
                ))}
              </div>
              {canEdit ? (
                <button
                  type="button"
                  onClick={saveTemplate}
                  disabled={!isDirty || saving || !available || loading}
                  className="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold text-white transition disabled:opacity-50"
                  style={{ background: "var(--accent-solid)" }}
                >
                  {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                  {isDirty ? "Usar este diseño" : "Diseño en uso"}
                </button>
              ) : null}
            </div>
          </div>
          {!canEdit ? (
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>
              Puedes mirar los diseños, pero solo el dueño o un administrador puede cambiarlo.
            </p>
          ) : null}

          <div
            ref={boxRef}
            className="relative overflow-hidden border"
            style={{ height: PREVIEW_HEIGHT, borderColor: "var(--border-color)", background: "#e5e7eb" }}
          >
            {iframeSrc ? (
              <div
                className="absolute top-0"
                style={{
                  width: frameWidth,
                  height: frameHeight,
                  left: `calc(50% - ${(frameWidth * scale) / 2}px)`,
                  transform: `scale(${scale})`,
                  transformOrigin: "top left",
                }}
              >
                <iframe
                  ref={iframeRef}
                  src={iframeSrc}
                  title="Vista previa de tu página"
                  onLoad={() => {
                    setFrameLoading(false);
                    sendPreview(previewRef.current);
                  }}
                  className="h-full w-full border-0 bg-white"
                  style={{ boxShadow: device === "mobile" ? "0 0 0 1px rgba(0,0,0,0.12)" : undefined }}
                />
              </div>
            ) : null}
            {loading || frameLoading ? (
              <div
                className="absolute inset-0 flex items-center justify-center gap-2 text-sm"
                style={{ background: "var(--bg-card)", color: "var(--text-muted)" }}
              >
                <Loader2 className="h-4 w-4 animate-spin" />
                Cargando tu página...
              </div>
            ) : null}
          </div>
          <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>
            Es tu página real: puedes navegarla dentro del recuadro. Los cambios de diseño no se ven para tus clientes hasta que toques &quot;Usar este diseño&quot;.
          </p>
        </div>
      </div>
    </section>
  );
}
