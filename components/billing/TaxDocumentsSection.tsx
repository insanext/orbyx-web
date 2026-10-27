"use client";

import { useCallback, useEffect, useState } from "react";
import { FileText } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { BACKEND_URL } from "@/lib/backend-url";
import { Panel } from "@/components/dashboard/panel";
import {
  formatCLP,
  formatDateDMY,
  formatRut,
  isValidRut,
  normalizeRut,
  taxDocTypeLabel,
} from "@/lib/tax-docs";

type TaxDocument = {
  id: string;
  flow_order: string;
  tipo: string;
  estado: "pendiente" | "emitido" | "anulado";
  folio: string | null;
  fecha_pago: string;
  monto_total: number;
  concepto: string;
  puede_descargar: boolean;
  tiene_nota_credito: boolean;
};

type BillingData = {
  tipo_documento_preferido: "boleta" | "factura";
  rut_facturacion: string;
  razon_social: string;
  giro: string;
  direccion_facturacion: string;
  comuna_facturacion: string;
  email_dte: string;
};

const EMPTY_BILLING: BillingData = {
  tipo_documento_preferido: "boleta",
  rut_facturacion: "",
  razon_social: "",
  giro: "",
  direccion_facturacion: "",
  comuna_facturacion: "",
  email_dte: "",
};

const fieldStyle = {
  background: "var(--bg-soft)",
  borderColor: "var(--border-color)",
  color: "var(--text-main)",
} as const;

function Field({
  label,
  value,
  onChange,
  placeholder,
  error,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  error?: string;
  type?: string;
}) {
  return (
    <label className="block text-xs font-medium" style={{ color: "var(--text-muted)" }}>
      {label}
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="mt-1 w-full rounded-md border px-3 py-2 text-sm outline-none"
        style={{ ...fieldStyle, borderColor: error ? "#ef4444" : "var(--border-color)" }}
      />
      {error ? <span className="mt-1 block text-[11px] text-red-500">{error}</span> : null}
    </label>
  );
}

// "Datos de facturación" + "Mis pagos y documentos" (Facturación y pago →
// Historial de pagos). Los documentos los emite Orbyx a mano en el SII.
export default function TaxDocumentsSection({ tenantId }: { tenantId: string }) {
  const [billing, setBilling] = useState<BillingData>(EMPTY_BILLING);
  const [billingAvailable, setBillingAvailable] = useState(true);
  const [loadingBilling, setLoadingBilling] = useState(true);
  const [saving, setSaving] = useState(false);
  const [billingMsg, setBillingMsg] = useState<{ tone: "ok" | "error"; text: string } | null>(null);
  const [touchedSave, setTouchedSave] = useState(false);

  const [docs, setDocs] = useState<TaxDocument[]>([]);
  const [docsAvailable, setDocsAvailable] = useState(true);
  const [loadingDocs, setLoadingDocs] = useState(true);
  const [docsError, setDocsError] = useState("");
  const [downloadingKey, setDownloadingKey] = useState("");

  const loadBilling = useCallback(async () => {
    try {
      setLoadingBilling(true);
      const res = await apiFetch(`${BACKEND_URL}/billing/datos-facturacion?tenant_id=${tenantId}`);
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "No se pudieron cargar los datos de facturación");
      setBillingAvailable(data?.available !== false);
      if (data?.available !== false) {
        setBilling({
          tipo_documento_preferido: data.tipo_documento_preferido === "factura" ? "factura" : "boleta",
          rut_facturacion: data.rut_facturacion ? formatRut(data.rut_facturacion) : "",
          razon_social: data.razon_social || "",
          giro: data.giro || "",
          direccion_facturacion: data.direccion_facturacion || "",
          comuna_facturacion: data.comuna_facturacion || "",
          email_dte: data.email_dte || "",
        });
      }
    } catch (error) {
      setBillingMsg({ tone: "error", text: error instanceof Error ? error.message : "Error al cargar" });
    } finally {
      setLoadingBilling(false);
    }
  }, [tenantId]);

  const loadDocs = useCallback(async () => {
    try {
      setLoadingDocs(true);
      setDocsError("");
      const res = await apiFetch(`${BACKEND_URL}/billing/documentos-tributarios?tenant_id=${tenantId}`);
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "No se pudieron cargar tus documentos");
      setDocsAvailable(data?.available !== false);
      setDocs(Array.isArray(data?.documentos) ? data.documentos : []);
    } catch (error) {
      setDocsError(error instanceof Error ? error.message : "No se pudieron cargar tus documentos");
    } finally {
      setLoadingDocs(false);
    }
  }, [tenantId]);

  useEffect(() => {
    if (!tenantId) return;
    loadBilling();
    loadDocs();
  }, [tenantId, loadBilling, loadDocs]);

  const isFactura = billing.tipo_documento_preferido === "factura";
  const rutError =
    billing.rut_facturacion.trim() && !isValidRut(billing.rut_facturacion)
      ? "El RUT no es válido. Revisa el dígito verificador."
      : isFactura && touchedSave && !billing.rut_facturacion.trim()
        ? "Ingresa el RUT."
        : "";
  const required = (value: string) => (isFactura && touchedSave && !value.trim() ? "Campo obligatorio." : "");

  function update<K extends keyof BillingData>(key: K, value: BillingData[K]) {
    setBilling((prev) => ({ ...prev, [key]: value }));
    setBillingMsg(null);
  }

  async function saveBilling() {
    setTouchedSave(true);
    setBillingMsg(null);
    if (isFactura) {
      const complete =
        billing.rut_facturacion.trim() &&
        billing.razon_social.trim() &&
        billing.giro.trim() &&
        billing.direccion_facturacion.trim();
      if (!complete) {
        setBillingMsg({ tone: "error", text: "Para recibir factura completa RUT, razón social, giro y dirección." });
        return;
      }
    }
    if (billing.rut_facturacion.trim() && !isValidRut(billing.rut_facturacion)) {
      setBillingMsg({ tone: "error", text: "El RUT no es válido. Revisa el dígito verificador." });
      return;
    }
    try {
      setSaving(true);
      const res = await apiFetch(`${BACKEND_URL}/billing/datos-facturacion`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenant_id: tenantId,
          ...billing,
          rut_facturacion: billing.rut_facturacion.trim() ? normalizeRut(billing.rut_facturacion) : "",
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "No se pudieron guardar los datos");
      setBillingMsg({ tone: "ok", text: "Datos de facturación guardados. Se usarán en tus próximos pagos." });
      setTouchedSave(false);
    } catch (error) {
      setBillingMsg({ tone: "error", text: error instanceof Error ? error.message : "Error al guardar" });
    } finally {
      setSaving(false);
    }
  }

  async function download(doc: TaxDocument, kind: "documento" | "nota_credito") {
    if (downloadingKey) return;
    // La pestaña se abre antes del fetch para que el navegador no la bloquee.
    const win = window.open("", "_blank");
    const key = `${doc.id}:${kind}`;
    try {
      setDownloadingKey(key);
      const qs = `tenant_id=${tenantId}${kind === "nota_credito" ? "&tipo=nota_credito" : ""}`;
      const res = await apiFetch(`${BACKEND_URL}/billing/documentos-tributarios/${doc.id}/descargar?${qs}`);
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.url) throw new Error(data?.error || "No se pudo abrir el documento");
      if (win) win.location.href = data.url;
      else window.location.href = data.url;
    } catch (error) {
      win?.close();
      setDocsError(error instanceof Error ? error.message : "No se pudo abrir el documento");
    } finally {
      setDownloadingKey("");
    }
  }

  return (
    <div className="space-y-4">
      {billingAvailable ? (
        <Panel
          className="!rounded"
          title="Datos de facturación"
          description="Elige si quieres boleta o factura por tus pagos. Si pides factura, necesitamos los datos de tu empresa."
        >
          {loadingBilling ? (
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>
              Cargando...
            </p>
          ) : (
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Tipo de documento">
                {(["boleta", "factura"] as const).map((tipo) => {
                  const active = billing.tipo_documento_preferido === tipo;
                  return (
                    <button
                      key={tipo}
                      type="button"
                      role="radio"
                      aria-checked={active}
                      onClick={() => update("tipo_documento_preferido", tipo)}
                      className="rounded-md border px-4 py-2 text-sm font-semibold transition"
                      style={{
                        borderColor: active ? "var(--accent-solid)" : "var(--border-color)",
                        background: active ? "var(--accent-solid)" : "var(--bg-soft)",
                        color: active ? "#fff" : "var(--text-main)",
                      }}
                    >
                      {taxDocTypeLabel(tipo)}
                    </button>
                  );
                })}
              </div>

              {isFactura ? (
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field
                    label="RUT de la empresa"
                    value={billing.rut_facturacion}
                    onChange={(v) => update("rut_facturacion", v)}
                    placeholder="12.345.678-5"
                    error={rutError}
                  />
                  <Field
                    label="Razón social"
                    value={billing.razon_social}
                    onChange={(v) => update("razon_social", v)}
                    error={required(billing.razon_social)}
                  />
                  <Field
                    label="Giro"
                    value={billing.giro}
                    onChange={(v) => update("giro", v)}
                    error={required(billing.giro)}
                  />
                  <Field
                    label="Dirección"
                    value={billing.direccion_facturacion}
                    onChange={(v) => update("direccion_facturacion", v)}
                    error={required(billing.direccion_facturacion)}
                  />
                  <Field
                    label="Comuna"
                    value={billing.comuna_facturacion}
                    onChange={(v) => update("comuna_facturacion", v)}
                  />
                  <Field
                    label="Correo para recibir la factura (opcional)"
                    type="email"
                    value={billing.email_dte}
                    onChange={(v) => update("email_dte", v)}
                    placeholder="facturas@tuempresa.cl"
                  />
                </div>
              ) : (
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                  Recibirás una boleta por cada pago. Si necesitas factura, cámbialo arriba antes de tu próximo pago.
                </p>
              )}

              {billingMsg ? (
                <p
                  className={`text-xs font-medium ${billingMsg.tone === "ok" ? "text-emerald-500" : "text-red-500"}`}
                  role="status"
                >
                  {billingMsg.text}
                </p>
              ) : null}

              <button
                type="button"
                onClick={saveBilling}
                disabled={saving}
                className="rounded-md px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
                style={{ background: "var(--accent-solid)" }}
              >
                {saving ? "Guardando..." : "Guardar datos"}
              </button>
            </div>
          )}
        </Panel>
      ) : null}

      <Panel
        className="!rounded"
        title="Mis pagos y documentos"
        description="Cada pago de tu plan y de tus add-ons con su boleta o factura. Cuando esté lista, podrás descargarla aquí."
      >
        {loadingDocs ? (
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            Cargando...
          </p>
        ) : docsError ? (
          <p className="text-sm text-red-500">{docsError}</p>
        ) : !docsAvailable || docs.length === 0 ? (
          <div
            className="rounded-md border border-dashed px-4 py-8 text-center text-sm"
            style={{ borderColor: "var(--border-color)", background: "var(--bg-soft)", color: "var(--text-muted)" }}
          >
            Aún no tienes pagos registrados.
          </div>
        ) : (
          <ul className="space-y-2">
            {docs.map((doc) => (
              <li
                key={doc.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-md border px-4 py-3 text-sm"
                style={{ borderColor: "var(--border-color)", background: "var(--bg-soft)" }}
              >
                <div className="min-w-0 flex-1 basis-56">
                  <p className="truncate font-medium" style={{ color: "var(--text-main)" }} title={doc.concepto}>
                    {doc.concepto}
                  </p>
                  <p className="mt-0.5 text-xs" style={{ color: "var(--text-muted)" }}>
                    {formatDateDMY(doc.fecha_pago)} · {taxDocTypeLabel(doc.tipo)}
                    {doc.folio ? ` N° ${doc.folio}` : ""}
                  </p>
                </div>
                <span className="font-semibold" style={{ color: "var(--text-main)" }}>
                  {formatCLP(doc.monto_total)}
                </span>
                <div className="flex flex-wrap items-center gap-2">
                  {doc.estado === "pendiente" || !doc.puede_descargar ? (
                    <span className="rounded-full border border-amber-500/40 bg-amber-500/10 px-2.5 py-1 text-[11px] font-semibold text-amber-500">
                      En proceso
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => download(doc, "documento")}
                      disabled={Boolean(downloadingKey)}
                      className="inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-semibold transition hover:opacity-90 disabled:opacity-60"
                      style={{ borderColor: "var(--border-color)", color: "var(--text-main)", background: "var(--bg-card)" }}
                    >
                      <FileText className="h-3.5 w-3.5" aria-hidden="true" />
                      {downloadingKey === `${doc.id}:documento` ? "Abriendo..." : "Descargar"}
                    </button>
                  )}
                  {doc.estado === "anulado" ? (
                    <>
                      <span className="rounded-full border border-slate-500/40 bg-slate-500/10 px-2.5 py-1 text-[11px] font-semibold text-slate-400">
                        Anulado
                      </span>
                      {doc.tiene_nota_credito ? (
                        <button
                          type="button"
                          onClick={() => download(doc, "nota_credito")}
                          disabled={Boolean(downloadingKey)}
                          className="text-xs font-semibold underline disabled:opacity-60"
                          style={{ color: "var(--text-muted)" }}
                        >
                          Nota de crédito
                        </button>
                      ) : null}
                    </>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </div>
  );
}
