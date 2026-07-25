"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { apiFetch } from "@/lib/api";
import type { ExtraKey } from "@/lib/plans";
import { Bot, Mail, Megaphone, MessageCircle, Minus, Store, Users, UsersRound } from "lucide-react";
import { Panel } from "../dashboard/panel";

const BACKEND_URL = "https://orbyx-backend.onrender.com";

type ExtraConfig = {
  title: string;
  unitPrice: number;
  price_pack2: number;
  price_pack3: number;
  unitLabel: string;
  usageLabel: string;
  tooltip: string;
  icon: ReactNode;
  iconClass: string;
};

// Mismo catalogo y precios que orbyx-web/app/planes/page.tsx (duplicado a
// proposito: esa pagina solo lo usa para una simulacion de precio sin
// cobro real cuando no hay tenant_id; este componente es el unico lugar
// que efectivamente cobra add-ons).
const extraConfig: Record<ExtraKey, ExtraConfig> = {
  wa_confirmacion: {
    title: "WhatsApp confirmación+recordatorio",
    unitPrice: 2990,
    price_pack2: 2691,
    price_pack3: 2542,
    unitLabel: "pack",
    usageLabel: "50 msgs WhatsApp adicionales / mes",
    tooltip: "Envía automáticamente un WhatsApp al cliente cuando agenda y otro como recordatorio antes de su cita. 50 mensajes adicionales por pack.",
    icon: <MessageCircle className="h-5 w-5" />,
    iconClass: "bg-emerald-500/15 text-emerald-500",
  },
  campanas_wa: {
    title: "Campañas WhatsApp",
    unitPrice: 6990,
    price_pack2: 6291,
    price_pack3: 5942,
    unitLabel: "pack",
    usageLabel: "50 msgs campaña marketing / mes",
    tooltip: "Envía mensajes masivos de marketing a tus clientes por WhatsApp. 50 mensajes por pack.",
    icon: <Megaphone className="h-5 w-5" />,
    iconClass: "bg-amber-500/15 text-amber-500",
  },
  ia_wa: {
    title: "IA WhatsApp",
    unitPrice: 14990,
    price_pack2: 13491,
    price_pack3: 12742,
    unitLabel: "pack",
    usageLabel: "500 conversaciones IA adicionales / mes",
    tooltip: "Un agente de IA responde automáticamente por WhatsApp, agenda citas y resuelve consultas sin intervención manual. 500 conversaciones por pack.",
    icon: <Bot className="h-5 w-5" />,
    iconClass: "bg-fuchsia-500/15 text-fuchsia-500",
  },
  emails_campana: {
    title: "Pack emails campaña",
    unitPrice: 1990,
    price_pack2: 1990,
    price_pack3: 1990,
    unitLabel: "pack",
    usageLabel: "2.000 correos campaña adicionales / mes",
    tooltip: "Correos de marketing adicionales para campañas a tus clientes. 2.000 correos por pack.",
    icon: <Mail className="h-5 w-5" />,
    iconClass: "bg-sky-500/15 text-sky-500",
  },
  staff: {
    title: "+ 1 Profesional",
    unitPrice: 5990,
    price_pack2: 5990,
    price_pack3: 5990,
    unitLabel: "profesional",
    usageLabel: "1 staff adicional sobre el límite del plan",
    tooltip: "Agrega un profesional adicional sobre el límite de tu plan. Cada profesional tiene su propia agenda y disponibilidad.",
    icon: <Users className="h-5 w-5" />,
    iconClass: "bg-violet-500/15 text-violet-500",
  },
  sucursal: {
    title: "+ 1 Sucursal",
    unitPrice: 9990,
    price_pack2: 9990,
    price_pack3: 9990,
    unitLabel: "sucursal",
    usageLabel: "1 sucursal adicional sobre el límite del plan",
    tooltip: "Agrega una sucursal adicional sobre el límite de tu plan.",
    icon: <Store className="h-5 w-5" />,
    iconClass: "bg-blue-500/15 text-blue-500",
  },
  group_capacity: {
    title: "+ Cupos grupales",
    unitPrice: 4900,
    price_pack2: 4900,
    price_pack3: 4900,
    unitLabel: "pack",
    usageLabel: "25 cupos adicionales por slot grupal",
    tooltip: "Aumenta la capacidad máxima de tus clases o eventos grupales en 25 cupos por slot adicional.",
    icon: <UsersRound className="h-5 w-5" />,
    iconClass: "bg-teal-500/15 text-teal-500",
  },
};

const ADDON_KEYS: ExtraKey[] = [
  "wa_confirmacion",
  "campanas_wa",
  "ia_wa",
  "emails_campana",
  "staff",
  "sucursal",
  "group_capacity",
];

// Precio escalonado: pack1=precio normal, pack2=−10%, pack3+=−15%
function tieredAddonCost(config: ExtraConfig, count: number): number {
  if (count <= 0) return 0;
  if (count === 1) return config.unitPrice;
  if (count === 2) return config.unitPrice + config.price_pack2;
  return config.unitPrice + config.price_pack2 + (count - 2) * config.price_pack3;
}

function nextPackPrice(config: ExtraConfig, currentCount: number): number {
  if (currentCount <= 0) return config.unitPrice;
  if (currentCount <= 2) return config.price_pack2;
  return config.price_pack3;
}

function formatCLP(value: number) {
  return `$${value.toLocaleString("es-CL")}`;
}

type AddonBaselineEntry = { quantity: number; unit_price: number | null };

type AddonChangeResult = { key: ExtraKey; label: string; ok: boolean; error?: string };

export function AddonManager({ tenantId }: { tenantId: string }) {
  const [serverAddonAvailability, setServerAddonAvailability] = useState<Record<
    string,
    boolean
  > | null>(null);
  const [addonsLoading, setAddonsLoading] = useState(true);
  const [addonError, setAddonError] = useState("");

  const [staffExtras, setStaffExtras] = useState(0);
  const [sucursalExtras, setSucursalExtras] = useState(0);
  const [waConfirmacionExtras, setWaConfirmacionExtras] = useState(0);
  const [campanaWaExtras, setCampanaWaExtras] = useState(0);
  const [iaWaExtras, setIaWaExtras] = useState(0);
  const [emailsCampanaExtras, setEmailsCampanaExtras] = useState(0);
  const [groupCapacityExtras, setGroupCapacityExtras] = useState(0);

  // Snapshot de lo que el tenant tiene realmente activo (quantity +
  // unit_price por addon), tal como vino del backend en el ultimo
  // refreshAddons(). Los botones +/- solo tocan el estado local de arriba
  // — se compara contra este baseline para saber que cambio y cuanto cobrar.
  const [addonBaseline, setAddonBaseline] = useState<
    Partial<Record<ExtraKey, AddonBaselineEntry>>
  >({});

  const [addonConfirmModalOpen, setAddonConfirmModalOpen] = useState(false);
  const [addonSubmitting, setAddonSubmitting] = useState(false);
  const [addonChangeResults, setAddonChangeResults] = useState<AddonChangeResult[]>([]);

  function setExtraCount(key: ExtraKey, value: number) {
    if (key === "staff") setStaffExtras(value);
    else if (key === "sucursal") setSucursalExtras(value);
    else if (key === "wa_confirmacion") setWaConfirmacionExtras(value);
    else if (key === "campanas_wa") setCampanaWaExtras(value);
    else if (key === "ia_wa") setIaWaExtras(value);
    else if (key === "emails_campana") setEmailsCampanaExtras(value);
    else setGroupCapacityExtras(value);
  }

  function extraValue(key: ExtraKey) {
    if (key === "staff") return staffExtras;
    if (key === "sucursal") return sucursalExtras;
    if (key === "wa_confirmacion") return waConfirmacionExtras;
    if (key === "campanas_wa") return campanaWaExtras;
    if (key === "ia_wa") return iaWaExtras;
    if (key === "emails_campana") return emailsCampanaExtras;
    return groupCapacityExtras;
  }

  // A diferencia de /planes (que ademas filtra por un plan "candidato" que
  // el usuario esta comparando), aca el plan del tenant es el real y fijo:
  // la disponibilidad depende solo de lo que devolvio el backend.
  function extraSupported(key: ExtraKey) {
    return serverAddonAvailability ? serverAddonAvailability[key] !== false : false;
  }

  async function refreshAddons() {
    if (!tenantId) return;

    try {
      setAddonsLoading(true);
      setAddonError("");

      const res = await apiFetch(
        `${BACKEND_URL}/billing/addons?tenant_id=${encodeURIComponent(tenantId)}`
      );
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "No se pudieron cargar los add-ons");
      }

      const availability: Record<string, boolean> = {};
      (data?.addons || []).forEach((addon: { key?: string; available?: boolean }) => {
        if (addon?.key) availability[addon.key] = addon.available !== false;
      });

      const counts: Record<string, number> = {};
      const baseline: Partial<Record<ExtraKey, AddonBaselineEntry>> = {};
      (data?.active_addons || []).forEach(
        (row: { addon_key?: string; quantity?: number; unit_price?: number | null }) => {
          if (!row?.addon_key) return;
          const qty = Number(row.quantity) || 0;
          counts[row.addon_key] = qty;
          baseline[row.addon_key as ExtraKey] = {
            quantity: qty,
            unit_price: row.unit_price != null ? Number(row.unit_price) : null,
          };
        }
      );

      setServerAddonAvailability(availability);
      setAddonBaseline(baseline);
      setAddonChangeResults([]);
      setStaffExtras(counts.staff || 0);
      setSucursalExtras(counts.sucursal || 0);
      setWaConfirmacionExtras(counts.wa_confirmacion || 0);
      setCampanaWaExtras(counts.campanas_wa || 0);
      setIaWaExtras(counts.ia_wa || 0);
      setEmailsCampanaExtras(counts.emails_campana || 0);
      setGroupCapacityExtras(counts.group_capacity || 0);
    } catch (error: unknown) {
      setAddonError(
        error instanceof Error ? error.message : "No se pudieron cargar los add-ons"
      );
    } finally {
      setAddonsLoading(false);
    }
  }

  useEffect(() => {
    if (!tenantId) return;
    refreshAddons();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenantId]);

  // Los botones +/- SOLO tocan estado local — nunca cobran ni tocan el
  // backend. El cobro real solo ocurre al confirmar en el modal.
  function increaseExtra(key: ExtraKey) {
    if (!extraSupported(key) || addonSubmitting) return;
    setExtraCount(key, extraValue(key) + 1);
  }

  function decreaseExtra(key: ExtraKey) {
    if (addonSubmitting) return;
    const current = extraValue(key);
    if (current === 0) return;
    setExtraCount(key, current - 1);
  }

  const extraItems = useMemo(() => {
    return ADDON_KEYS.filter((key) => extraSupported(key) && extraValue(key) > 0).map((key) => ({
      key,
      count: extraValue(key),
      amount: tieredAddonCost(extraConfig[key], extraValue(key)),
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    serverAddonAvailability,
    staffExtras,
    sucursalExtras,
    waConfirmacionExtras,
    campanaWaExtras,
    iaWaExtras,
    emailsCampanaExtras,
    groupCapacityExtras,
  ]);

  const addableAddons = ADDON_KEYS.filter((key) => extraSupported(key) && extraValue(key) === 0);
  const anyAddonAvailable = ADDON_KEYS.some((key) => extraSupported(key));

  // Compara el estado local (lo que el usuario dejó con +/-) contra el
  // baseline real del tenant para saber que hay que persistir/cobrar al
  // confirmar, y cuanto se cobrará hoy — replica exactamente la logica de
  // precio del backend: add-on nuevo (baseline 0) = precio base x
  // cantidad; add-on ya activo que sube = su unit_price guardado x el
  // incremento; el que baja no cobra.
  const addonPendingChanges = useMemo(() => {
    const changes: {
      key: ExtraKey;
      label: string;
      baselineQty: number;
      newQty: number;
      isNew: boolean;
      chargeAmount: number;
    }[] = [];

    ADDON_KEYS.forEach((key) => {
      const baselineQty = addonBaseline[key]?.quantity || 0;
      const newQty = extraValue(key);

      if (newQty === baselineQty) return;

      const isNew = baselineQty === 0;
      const config = extraConfig[key];

      let chargeAmount = 0;
      if (newQty > baselineQty) {
        const increment = newQty - baselineQty;
        const unitPrice = isNew
          ? config.unitPrice
          : addonBaseline[key]?.unit_price ?? config.unitPrice;
        chargeAmount = unitPrice * increment;
      }

      changes.push({ key, label: config.title, baselineQty, newQty, isNew, chargeAmount });
    });

    return changes;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    addonBaseline,
    staffExtras,
    sucursalExtras,
    waConfirmacionExtras,
    campanaWaExtras,
    iaWaExtras,
    emailsCampanaExtras,
    groupCapacityExtras,
  ]);

  const hasPendingAddonChanges = addonPendingChanges.length > 0;
  const addonChargeTotal = addonPendingChanges.reduce(
    (sum, change) => sum + change.chargeAmount,
    0
  );

  // Solo aca se toca el backend para add-ons: se llama uno por uno y se
  // reporta individualmente que salio bien y que no, sin asumir nada.
  async function handleConfirmAddonCharge() {
    if (!tenantId || addonPendingChanges.length === 0) return;

    setAddonSubmitting(true);
    setAddonError("");
    setAddonChangeResults([]);

    const results: AddonChangeResult[] = [];

    for (const change of addonPendingChanges) {
      try {
        if (change.isNew) {
          const res = await apiFetch(`${BACKEND_URL}/billing/addons/activate`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              tenant_id: tenantId,
              addon_key: change.key,
              quantity: change.newQty,
              billing_cycle: "mensual",
            }),
          });
          const data = await res.json();

          if (!res.ok) {
            if (res.status === 403 && data?.upgrade_required) {
              throw new Error("Este add-on requiere un plan superior");
            }
            throw new Error(data?.error || "No se pudo activar el add-on");
          }
        } else {
          const res = await apiFetch(`${BACKEND_URL}/billing/addons/quantity`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              tenant_id: tenantId,
              addon_key: change.key,
              quantity: change.newQty,
            }),
          });
          const data = await res.json();

          if (!res.ok) {
            throw new Error(data?.error || "No se pudo actualizar el add-on");
          }
        }

        results.push({ key: change.key, label: change.label, ok: true });
      } catch (error: unknown) {
        results.push({
          key: change.key,
          label: change.label,
          ok: false,
          error: error instanceof Error ? error.message : "Error desconocido",
        });
      }
    }

    setAddonChangeResults(results);
    setAddonSubmitting(false);

    // Refresca siempre, haya habido fallos parciales o no: el estado local
    // debe reflejar lo que realmente quedó persistido en el servidor.
    await refreshAddons();

    if (!results.some((result) => !result.ok)) {
      setAddonConfirmModalOpen(false);
    }
  }

  return (
    <div className="space-y-4">
      <Panel
        title="Add-ons"
        description="Agrega capacidad extra a tu plan. Los cambios se cobran de inmediato a tu tarjeta registrada al confirmar."
      >
        {addonError ? (
          <div
            className="mb-3 rounded-2xl border px-4 py-3 text-sm"
            style={{
              borderColor: "rgba(244,63,94,0.34)",
              background: "rgba(244,63,94,0.08)",
              color: "var(--text-main)",
            }}
          >
            {addonError}
          </div>
        ) : null}

        {addonsLoading ? (
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            Cargando...
          </p>
        ) : !anyAddonAvailable ? (
          <div
            className="rounded-2xl border border-dashed px-4 py-6 text-sm"
            style={{
              borderColor: "var(--border-color)",
              background: "var(--bg-soft)",
              color: "var(--text-muted)",
            }}
          >
            Tu plan actual no admite add-ons. Sube de plan desde "Ver planes" para desbloquearlos.
          </div>
        ) : (
          <>
            {extraItems.length === 0 ? (
              <div
                className="rounded-2xl border border-dashed px-4 py-6 text-sm"
                style={{
                  borderColor: "var(--border-color)",
                  background: "var(--bg-soft)",
                  color: "var(--text-muted)",
                }}
              >
                Aún no tienes add-ons activos.
              </div>
            ) : (
              <div className="space-y-3">
                {extraItems.map((item) => {
                  const config = extraConfig[item.key];
                  return (
                    <div
                      key={item.key}
                      className="rounded-2xl border px-4 py-3"
                      style={{ borderColor: "var(--border-color)", background: "var(--bg-soft)" }}
                    >
                      <div className="flex items-start gap-3">
                        <span
                          className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${config.iconClass}`}
                        >
                          {config.icon}
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="text-sm font-semibold" style={{ color: "var(--text-main)" }}>
                                {config.title}
                              </p>
                              <p className="mt-1 text-xs" style={{ color: "var(--text-muted)" }}>
                                {item.count} {config.unitLabel}
                                {item.count === 1 ? "" : "s"} · {config.usageLabel}
                              </p>
                            </div>
                            <div className="shrink-0 text-right">
                              <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                                {item.count >= 2
                                  ? `${formatCLP(nextPackPrice(config, item.count))} + IVA`
                                  : `${formatCLP(config.unitPrice)} + IVA`}
                              </p>
                              <p className="text-sm font-semibold" style={{ color: "var(--text-main)" }}>
                                {formatCLP(item.amount)}
                              </p>
                            </div>
                          </div>

                          <div className="mt-3 flex items-center justify-end">
                            <div
                              className="flex items-center rounded-lg border"
                              style={{ borderColor: "var(--border-color)" }}
                            >
                              <button
                                type="button"
                                onClick={() => decreaseExtra(item.key)}
                                disabled={addonSubmitting}
                                className="inline-flex h-9 w-9 items-center justify-center transition disabled:cursor-not-allowed disabled:opacity-40"
                                style={{ color: "var(--text-main)" }}
                                aria-label={`Quitar ${config.title}`}
                              >
                                <Minus className="h-4 w-4" />
                              </button>
                              <span
                                className="min-w-8 text-center text-sm font-semibold"
                                style={{ color: "var(--text-main)" }}
                              >
                                {item.count}
                              </span>
                              <button
                                type="button"
                                onClick={() => increaseExtra(item.key)}
                                disabled={addonSubmitting}
                                className="inline-flex h-9 w-9 items-center justify-center transition disabled:cursor-not-allowed disabled:opacity-40"
                                style={{ color: "var(--text-main)" }}
                                aria-label={`Agregar ${config.title}`}
                              >
                                +
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {addableAddons.length > 0 ? (
              <div className="mt-4">
                <p
                  className="mb-2 text-xs font-semibold uppercase tracking-[0.16em]"
                  style={{ color: "var(--text-muted)" }}
                >
                  Agregar add-ons
                </p>
                <div className="grid gap-2">
                  {addableAddons.map((key) => {
                    const config = extraConfig[key];
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => increaseExtra(key)}
                        disabled={addonSubmitting}
                        title={config.tooltip}
                        className="flex w-full items-center justify-between gap-3 rounded-lg border px-3 py-2 text-left transition disabled:cursor-not-allowed disabled:opacity-40"
                        style={{ borderColor: "var(--border-color)", background: "var(--bg-soft)" }}
                      >
                        <span className="flex items-center gap-2">
                          <span
                            className={`inline-flex h-8 w-8 items-center justify-center rounded-lg ${config.iconClass}`}
                          >
                            {config.icon}
                          </span>
                          <span>
                            <span className="block text-xs font-semibold" style={{ color: "var(--text-main)" }}>
                              {config.title}
                            </span>
                            <span className="block text-xs" style={{ color: "var(--text-muted)" }}>
                              {formatCLP(config.unitPrice)} /mes + IVA
                            </span>
                          </span>
                        </span>
                        <span className="text-lg leading-none" style={{ color: "var(--text-main)" }}>
                          +
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : null}

            {hasPendingAddonChanges ? (
              <div
                className="mt-4 flex items-center justify-between text-sm"
                style={{ color: "var(--text-main)" }}
              >
                <span className="font-semibold">Total a cobrar hoy</span>
                <span className="font-bold">{formatCLP(addonChargeTotal)} + IVA</span>
              </div>
            ) : null}

            {hasPendingAddonChanges ? (
              <button
                type="button"
                onClick={() => {
                  setAddonChangeResults([]);
                  setAddonConfirmModalOpen(true);
                }}
                disabled={addonSubmitting}
                className="mt-4 inline-flex h-11 w-full items-center justify-center rounded-xl px-5 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-60"
                style={{ background: "linear-gradient(135deg, rgb(37 99 235), rgb(14 165 233))" }}
              >
                Confirmar y cobrar add-ons
              </button>
            ) : null}
          </>
        )}
      </Panel>

      {addonConfirmModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0"
            style={{ background: "rgba(0,0,0,0.6)" }}
            onClick={() => (addonSubmitting ? null : setAddonConfirmModalOpen(false))}
          />
          <div
            className="relative z-10 mx-4 w-full max-w-md rounded-2xl border p-6 shadow-2xl"
            style={{ background: "var(--bg-card)", borderColor: "var(--border-color)" }}
          >
            {addonChangeResults.length > 0 ? (
              <>
                <h3 className="text-lg font-semibold" style={{ color: "var(--text-main)" }}>
                  Resultado del cobro de add-ons
                </h3>
                <p className="mt-2 text-sm leading-6" style={{ color: "var(--text-muted)" }}>
                  {addonChangeResults.every((result) => result.ok)
                    ? "Todos los add-ons se aplicaron y cobraron correctamente."
                    : "Algunos add-ons no se pudieron aplicar. Los que fallaron no se cobraron."}
                </p>

                <ul className="mt-4 space-y-2">
                  {addonChangeResults.map((result) => (
                    <li
                      key={result.key}
                      className="rounded-lg border px-3 py-2 text-sm"
                      style={{ borderColor: "var(--border-color)", background: "var(--bg-soft)" }}
                    >
                      <span style={{ color: result.ok ? "rgb(16 185 129)" : "rgb(244 63 94)" }}>
                        {result.ok ? "✓" : "✗"}
                      </span>{" "}
                      <span style={{ color: "var(--text-main)" }}>{result.label}</span>
                      {!result.ok && result.error ? (
                        <p className="mt-1 text-xs" style={{ color: "rgb(244 63 94)" }}>
                          {result.error}
                        </p>
                      ) : null}
                    </li>
                  ))}
                </ul>

                <div className="mt-5 flex justify-end">
                  <button
                    type="button"
                    onClick={() => setAddonConfirmModalOpen(false)}
                    className="inline-flex h-10 items-center justify-center rounded-xl border px-5 text-sm font-medium transition"
                    style={{
                      borderColor: "var(--border-color)",
                      background: "var(--bg-soft)",
                      color: "var(--text-main)",
                    }}
                  >
                    Cerrar
                  </button>
                </div>
              </>
            ) : (
              <>
                <h3 className="text-lg font-semibold" style={{ color: "var(--text-main)" }}>
                  Confirmar cobro de add-ons
                </h3>
                <p className="mt-2 text-sm leading-6" style={{ color: "var(--text-muted)" }}>
                  Estos cambios se aplicarán y cobrarán de inmediato a tu tarjeta registrada.
                </p>

                <ul className="mt-4 space-y-2">
                  {addonPendingChanges.map((change) => (
                    <li
                      key={change.key}
                      className="flex items-center justify-between gap-3 rounded-lg border px-3 py-2 text-sm"
                      style={{ borderColor: "var(--border-color)", background: "var(--bg-soft)" }}
                    >
                      <span style={{ color: "var(--text-main)" }}>
                        {change.label}{" "}
                        <span style={{ color: "var(--text-muted)" }}>
                          ({change.baselineQty} → {change.newQty})
                        </span>
                      </span>
                      <span
                        className="font-semibold"
                        style={{ color: change.chargeAmount > 0 ? "var(--text-main)" : "var(--text-muted)" }}
                      >
                        {change.chargeAmount > 0 ? formatCLP(change.chargeAmount) : "Sin costo"}
                      </span>
                    </li>
                  ))}
                </ul>

                <div
                  className="mt-4 flex items-center justify-between border-t pt-3"
                  style={{ borderColor: "var(--border-color)" }}
                >
                  <span className="text-sm font-semibold" style={{ color: "var(--text-main)" }}>
                    Total a cobrar hoy
                  </span>
                  <span className="text-lg font-bold" style={{ color: "var(--text-main)" }}>
                    {formatCLP(addonChargeTotal)}
                  </span>
                </div>

                <p className="mt-3 text-xs leading-5" style={{ color: "rgb(245 158 11)" }}>
                  Se cobrará {formatCLP(addonChargeTotal)} ahora mismo a tu tarjeta registrada.
                </p>

                <div className="mt-5 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setAddonConfirmModalOpen(false)}
                    disabled={addonSubmitting}
                    className="flex-1 inline-flex h-10 items-center justify-center rounded-xl border text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-60"
                    style={{
                      borderColor: "var(--border-color)",
                      background: "var(--bg-soft)",
                      color: "var(--text-main)",
                    }}
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    disabled={addonSubmitting}
                    onClick={handleConfirmAddonCharge}
                    className="flex-1 inline-flex h-10 items-center justify-center rounded-xl text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-60"
                    style={{ background: "linear-gradient(135deg, rgb(37 99 235), rgb(14 165 233))" }}
                  >
                    {addonSubmitting ? "Cobrando..." : "Confirmar cobro"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
