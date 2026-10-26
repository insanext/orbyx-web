"use client";

// Panel admin: cobros de Flow del negocio y sus boletas. El Super Admin sube
// el PDF y marca qué cobros cubre (uno o varios: plan + add-on del mismo día
// van en una sola boleta). El negocio lo ve en Mi suscripción → Historial.
import { useCallback, useEffect, useMemo, useState } from "react";

type Charge = {
  date: string | null;
  amount: number | null;
  status: string;
  flowOrder: string | number | null;
  subject: string | null;
};

type BillingDoc = {
  id: string;
  doc_type: string;
  folio: string | null;
  issued_at: string | null;
  total: number | null;
  flow_orders: string[];
  file_name: string | null;
  uploaded_by_email: string | null;
  created_at: string;
};

type AuthFetch = (path: string, init?: RequestInit) => Promise<Response | null>;

const clp = (value: number | null | undefined) =>
  value == null ? "—" : `$${Number(value).toLocaleString("es-CL")}`;

const shortDate = (value: string | null) => {
  if (!value) return "—";
  const date = new Date(value.length === 10 ? `${value}T12:00:00` : value);
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleDateString("es-CL", { day: "2-digit", month: "2-digit", year: "numeric" });
};

const orderOf = (charge: Charge) => (charge.flowOrder != null ? String(charge.flowOrder) : "");
const kindOf = (charge: Charge) => (charge.subject && charge.subject.startsWith("Add-on") ? "Add-on" : "Plan");
const docLabel = (doc: BillingDoc) =>
  `${doc.doc_type === "factura" ? "Factura" : "Boleta"}${doc.folio ? ` N° ${doc.folio}` : ""}`;

export default function TenantBillingDocuments({
  tenantId,
  authFetch,
}: {
  tenantId: string;
  authFetch: AuthFetch;
}) {
  const [loading, setLoading] = useState(true);
  const [available, setAvailable] = useState(true);
  const [charges, setCharges] = useState<Charge[]>([]);
  const [documents, setDocuments] = useState<BillingDoc[]>([]);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [file, setFile] = useState<File | null>(null);
  const [folio, setFolio] = useState("");
  const [issuedAt, setIssuedAt] = useState("");
  const [docType, setDocType] = useState<"boleta" | "factura">("boleta");
  const [totalOverride, setTotalOverride] = useState("");
  const [saving, setSaving] = useState(false);
  const [fileInputKey, setFileInputKey] = useState(0);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await authFetch(`/admin/tenants/${tenantId}/billing-documents`);
      const json = res ? await res.json() : null;
      if (!res || !res.ok) throw new Error(json?.error || "No se pudieron cargar los cobros");
      setAvailable(json.available !== false);
      setCharges(Array.isArray(json.charges) ? json.charges : []);
      setDocuments(Array.isArray(json.documents) ? json.documents : []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudieron cargar los cobros");
    } finally {
      setLoading(false);
    }
  }, [authFetch, tenantId]);

  useEffect(() => {
    load();
  }, [load]);

  const docByOrder = useMemo(() => {
    const map = new Map<string, BillingDoc>();
    for (const doc of documents) for (const order of doc.flow_orders || []) map.set(String(order), doc);
    return map;
  }, [documents]);

  const sortedCharges = useMemo(
    () => [...charges].sort((a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime()),
    [charges]
  );

  const selectedTotal = sortedCharges
    .filter((charge) => selected.has(orderOf(charge)))
    .reduce((sum, charge) => sum + (charge.amount || 0), 0);

  function toggle(order: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(order)) next.delete(order);
      else next.add(order);
      return next;
    });
  }

  async function upload() {
    setError("");
    setMessage("");
    if (selected.size === 0) return setError("Marca al menos un cobro que cubra la boleta.");
    if (!file) return setError("Adjunta el PDF de la boleta.");
    if (file.size > 5 * 1024 * 1024) return setError("El PDF supera los 5 MB.");

    const form = new FormData();
    form.append("file", file);
    form.append("flow_orders", JSON.stringify(Array.from(selected)));
    form.append("doc_type", docType);
    if (folio.trim()) form.append("folio", folio.trim());
    if (issuedAt) form.append("issued_at", issuedAt);
    form.append("total", String(totalOverride.trim() ? Number(totalOverride) : selectedTotal));

    setSaving(true);
    try {
      const res = await authFetch(`/admin/tenants/${tenantId}/billing-documents`, { method: "POST", body: form });
      const json = res ? await res.json() : null;
      if (!res || !res.ok) throw new Error(json?.error || "No se pudo subir la boleta");
      setMessage("Boleta subida. El negocio ya la ve en su historial de pagos.");
      setSelected(new Set());
      setFile(null);
      setFolio("");
      setIssuedAt("");
      setTotalOverride("");
      setFileInputKey((k) => k + 1);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo subir la boleta");
    } finally {
      setSaving(false);
    }
  }

  async function download(doc: BillingDoc) {
    const win = window.open("", "_blank");
    try {
      const res = await authFetch(`/admin/billing-documents/${doc.id}/download`);
      const json = res ? await res.json() : null;
      if (!res || !res.ok || !json?.url) throw new Error(json?.error || "No se pudo abrir el PDF");
      if (win) win.location.href = json.url;
    } catch (e) {
      win?.close();
      setError(e instanceof Error ? e.message : "No se pudo abrir el PDF");
    }
  }

  async function remove(doc: BillingDoc) {
    if (!window.confirm(`¿Eliminar ${docLabel(doc)}? Los cobros que cubre volverán a mostrarse "en proceso" al negocio.`)) return;
    setError("");
    try {
      const res = await authFetch(`/admin/billing-documents/${doc.id}`, { method: "DELETE" });
      const json = res ? await res.json() : null;
      if (!res || !res.ok) throw new Error(json?.error || "No se pudo eliminar");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo eliminar");
    }
  }

  if (loading) return <p className="text-sm text-blue-300/40">Cargando cobros...</p>;

  return (
    <div className="space-y-4">
      {!available ? (
        <p className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-200">
          Falta correr la migración <code>2026-10-26-billing-documents.sql</code> en Supabase para poder subir boletas.
        </p>
      ) : null}
      {error ? <p className="text-sm text-rose-300">{error}</p> : null}
      {message ? <p className="text-sm text-emerald-300">{message}</p> : null}

      {sortedCharges.length === 0 ? (
        <p className="text-sm text-blue-300/40">Este negocio no tiene cobros en Flow (o no tiene tarjeta inscrita).</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-blue-900/25">
          <table className="w-full min-w-[620px] text-sm">
            <thead>
              <tr className="text-left text-xs text-blue-300/50">
                <th className="w-8 px-3 py-2" />
                <th className="px-3 py-2">Fecha</th>
                <th className="px-3 py-2">Cobro</th>
                <th className="px-3 py-2 text-right">Monto</th>
                <th className="px-3 py-2">Estado</th>
                <th className="px-3 py-2">Boleta</th>
              </tr>
            </thead>
            <tbody>
              {sortedCharges.map((charge, index) => {
                const order = orderOf(charge);
                const doc = order ? docByOrder.get(order) : undefined;
                const paid = charge.status === "Pagado";
                const selectable = Boolean(order) && paid && !doc && available;
                return (
                  <tr key={order || index} className="border-t border-blue-900/20">
                    <td className="px-3 py-2">
                      <input
                        type="checkbox"
                        aria-label="Incluir en la boleta"
                        disabled={!selectable}
                        checked={selected.has(order)}
                        onChange={() => toggle(order)}
                        className="h-4 w-4 accent-blue-500 disabled:opacity-30"
                      />
                    </td>
                    <td className="px-3 py-2 text-white">{shortDate(charge.date)}</td>
                    <td className="px-3 py-2 text-white">
                      <span className="mr-2 rounded border border-blue-900/40 px-1.5 py-px text-[10px] text-blue-200">
                        {kindOf(charge)}
                      </span>
                      <span className="text-blue-100/80">{charge.subject || "Cobro"}</span>
                      {order ? <span className="ml-2 text-xs text-blue-300/40">#{order}</span> : null}
                    </td>
                    <td className="px-3 py-2 text-right text-white">{clp(charge.amount)}</td>
                    <td className="px-3 py-2 text-blue-100/80">{charge.status}</td>
                    <td className="px-3 py-2">
                      {doc ? (
                        <span className="text-emerald-300">{docLabel(doc)}</span>
                      ) : paid ? (
                        <span className="text-amber-300">En proceso</span>
                      ) : (
                        <span className="text-blue-300/40">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {available && sortedCharges.length > 0 ? (
        <div className="space-y-3 rounded-lg border border-blue-900/25 p-3" style={{ background: "#0a0f1e" }}>
          <p className="text-sm font-semibold text-white">
            Subir boleta {selected.size > 0 ? `(${selected.size} cobro${selected.size === 1 ? "" : "s"} · ${clp(selectedTotal)})` : ""}
          </p>
          <p className="text-xs text-blue-300/50">
            Marca arriba los cobros que cubre. Si el plan y un add-on se cobraron juntos, márcalos a ambos: una sola boleta.
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="flex gap-2">
              {(["boleta", "factura"] as const).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setDocType(type)}
                  className={`flex-1 rounded-lg border px-3 py-1.5 text-sm font-medium transition ${
                    docType === type
                      ? "border-blue-500 bg-blue-600 text-white"
                      : "border-blue-900/40 text-blue-200 hover:border-blue-700"
                  }`}
                >
                  {type === "boleta" ? "Boleta" : "Factura"}
                </button>
              ))}
            </div>
            <input
              value={folio}
              onChange={(e) => setFolio(e.target.value)}
              placeholder="N° de folio (opcional)"
              className="rounded-lg border border-blue-900/30 bg-[#0f1729] px-3 py-1.5 text-sm text-white placeholder:text-blue-300/30 focus:border-blue-500/50 focus:outline-none"
            />
            <label className="text-xs text-blue-300/60">
              Fecha de emisión
              <input
                type="date"
                value={issuedAt}
                onChange={(e) => setIssuedAt(e.target.value)}
                className="mt-1 block w-full rounded-lg border border-blue-900/30 bg-[#0f1729] px-3 py-1.5 text-sm text-white focus:border-blue-500/50 focus:outline-none"
              />
            </label>
            <label className="text-xs text-blue-300/60">
              Total de la boleta (CLP)
              <input
                inputMode="numeric"
                value={totalOverride}
                onChange={(e) => setTotalOverride(e.target.value.replace(/[^\d]/g, ""))}
                placeholder={selectedTotal ? String(selectedTotal) : "Suma de los cobros marcados"}
                className="mt-1 block w-full rounded-lg border border-blue-900/30 bg-[#0f1729] px-3 py-1.5 text-sm text-white placeholder:text-blue-300/30 focus:border-blue-500/50 focus:outline-none"
              />
            </label>
          </div>
          <input
            key={fileInputKey}
            type="file"
            accept="application/pdf"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            className="block w-full text-sm text-blue-100 file:mr-3 file:rounded-lg file:border-0 file:bg-blue-600 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-white hover:file:bg-blue-500"
          />
          <div className="flex justify-end">
            <button
              type="button"
              onClick={upload}
              disabled={saving || selected.size === 0 || !file}
              className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {saving ? "Subiendo..." : "Subir boleta"}
            </button>
          </div>
        </div>
      ) : null}

      {documents.length > 0 ? (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-blue-300/60">Boletas subidas</p>
          {documents.map((doc) => (
            <div
              key={doc.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-blue-900/20 px-3 py-2"
            >
              <div>
                <p className="text-sm text-white">
                  {docLabel(doc)} · {clp(doc.total)}
                </p>
                <p className="text-xs text-blue-300/40">
                  Emitida {shortDate(doc.issued_at)} · cubre {doc.flow_orders.length} cobro
                  {doc.flow_orders.length === 1 ? "" : "s"} · subida por {doc.uploaded_by_email || "admin"} el{" "}
                  {shortDate(doc.created_at)}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => download(doc)}
                  className="rounded-lg border border-blue-900/40 px-2.5 py-1 text-xs text-blue-200 hover:border-blue-600"
                >
                  Ver PDF
                </button>
                <button
                  type="button"
                  onClick={() => remove(doc)}
                  className="rounded-lg border border-rose-900/40 px-2.5 py-1 text-xs text-rose-300 hover:border-rose-600"
                >
                  Eliminar
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
