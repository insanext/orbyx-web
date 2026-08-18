"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
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

// Precio de la próxima unidad tal como lo calcula el backend en
// triggerLowBalanceRecharge()/POST billing/addons/activate (server.js):
// currentQty >= 2 → price_pack3, currentQty >= 1 → price_pack2, si no
// unitPrice. A diferencia de nextPackPrice() de arriba (que trata
// currentCount === 2 como price_pack2), esto debe calzar exacto con lo que
// se cobra de verdad porque se usa en el texto de consentimiento legal.
function lowBalanceRechargeNextPrice(config: ExtraConfig, currentQty: number): number {
  if (currentQty >= 2) return config.price_pack3;
  if (currentQty >= 1) return config.price_pack2;
  return config.unitPrice;
}

function formatCLP(value: number) {
  return `$${value.toLocaleString("es-CL")}`;
}

// Refleja server.js:applyIva() — si cambia IVA_RATE en backend, actualizar
// aquí también. Solo para PREVIEW visual (modal / total en vivo); el monto
// que realmente se cobra siempre lo calcula el backend, nunca este.
const IVA_RATE = 0.19;
function applyIva(netAmount: number): number {
  return Math.round(netAmount * (1 + IVA_RATE));
}

type RenewalMode = "manual" | "automatico";

type AddonBaselineEntry = {
  quantity: number;
  unit_price: number | null;
  renewal_mode: RenewalMode;
  low_balance_recharge_enabled: boolean;
  low_balance_recharge_consented_at: string | null;
};

// Umbral de mensajes restantes que dispara la recarga automática — debe
// calzar con LOW_BALANCE_RECHARGE_THRESHOLD en server.js (solo para
// mostrarlo en el texto de consentimiento; el backend es quien realmente
// decide cuándo cobrar).
const LOW_BALANCE_RECHARGE_THRESHOLD = 10;

// Solo wa_confirmacion soporta recarga automática por saldo bajo por ahora.
const LOW_BALANCE_RECHARGE_ADDON_KEY: ExtraKey = "wa_confirmacion";

type AddonChangeResult = {
  key: ExtraKey;
  label: string;
  ok: boolean;
  timedOut?: boolean;
  error?: string;
};

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

  const [renewalModeUpdating, setRenewalModeUpdating] = useState<ExtraKey | null>(null);

  const [lowBalanceRechargeUpdating, setLowBalanceRechargeUpdating] = useState<ExtraKey | null>(
    null
  );
  const [lowBalanceConsentModalOpen, setLowBalanceConsentModalOpen] = useState(false);
  const [lowBalanceConsentChecked, setLowBalanceConsentChecked] = useState(false);

  // Cada refreshAddons() toma un ticket incremental al iniciar. Si al
  // terminar el ticket capturado ya no es el ultimo (se disparo un
  // refresh mas nuevo mientras este esperaba la respuesta), este refresh
  // quedo obsoleto y se descarta sin tocar ningun estado — evita que un
  // refresh lento (cola de un cobro anterior) pise una seleccion local
  // mas reciente del usuario.
  const refreshTokenRef = useRef(0);

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

    const requestToken = ++refreshTokenRef.current;

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

      // Un refresh mas nuevo ya se disparo mientras este esperaba: estos
      // datos son viejos, no se aplican.
      if (requestToken !== refreshTokenRef.current) return;

      const availability: Record<string, boolean> = {};
      (data?.addons || []).forEach((addon: { key?: string; available?: boolean }) => {
        if (addon?.key) availability[addon.key] = addon.available !== false;
      });

      const counts: Record<string, number> = {};
      const baseline: Partial<Record<ExtraKey, AddonBaselineEntry>> = {};
      (data?.active_addons || []).forEach(
        (row: {
          addon_key?: string;
          quantity?: number;
          unit_price?: number | null;
          renewal_mode?: string | null;
          low_balance_recharge_enabled?: boolean | null;
          low_balance_recharge_consented_at?: string | null;
        }) => {
          if (!row?.addon_key) return;
          const qty = Number(row.quantity) || 0;
          counts[row.addon_key] = qty;
          baseline[row.addon_key as ExtraKey] = {
            quantity: qty,
            unit_price: row.unit_price != null ? Number(row.unit_price) : null,
            renewal_mode: row.renewal_mode === "automatico" ? "automatico" : "manual",
            low_balance_recharge_enabled: row.low_balance_recharge_enabled === true,
            low_balance_recharge_consented_at: row.low_balance_recharge_consented_at ?? null,
          };
        }
      );

      setServerAddonAvailability(availability);
      setAddonBaseline(baseline);
      setStaffExtras(counts.staff || 0);
      setSucursalExtras(counts.sucursal || 0);
      setWaConfirmacionExtras(counts.wa_confirmacion || 0);
      setCampanaWaExtras(counts.campanas_wa || 0);
      setIaWaExtras(counts.ia_wa || 0);
      setEmailsCampanaExtras(counts.emails_campana || 0);
      setGroupCapacityExtras(counts.group_capacity || 0);
    } catch (error: unknown) {
      if (requestToken !== refreshTokenRef.current) return;
      setAddonError(
        error instanceof Error ? error.message : "No se pudieron cargar los add-ons"
      );
    } finally {
      if (requestToken === refreshTokenRef.current) {
        setAddonsLoading(false);
      }
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

  // No pasa por el modal de confirmación: no cobra nada, solo cambia un
  // flag. El cobro real de la renovación automática ocurre en el cron
  // mensual del backend.
  async function handleToggleRenewalMode(key: ExtraKey) {
    const currentMode = addonBaseline[key]?.renewal_mode || "manual";
    const nextMode: RenewalMode = currentMode === "automatico" ? "manual" : "automatico";

    setRenewalModeUpdating(key);
    setAddonError("");

    try {
      const res = await apiFetch(`${BACKEND_URL}/billing/addons/renewal-mode`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tenant_id: tenantId, addon_key: key, renewal_mode: nextMode }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "No se pudo cambiar el modo de renovación");
      }

      setAddonBaseline((prev) => {
        const entry = prev[key];
        if (!entry) return prev;
        return { ...prev, [key]: { ...entry, renewal_mode: data.renewal_mode } };
      });
    } catch (error: unknown) {
      setAddonError(
        error instanceof Error ? error.message : "No se pudo cambiar el modo de renovación"
      );
    } finally {
      setRenewalModeUpdating(null);
    }
  }

  // Llama al PATCH real. consentAccepted solo se manda cuando enabled=true
  // (activando) — el backend lo exige siempre que la fila esté
  // deshabilitada antes del request, así que en la práctica se envía en
  // cada activación, no solo la primera vez histórica.
  async function patchLowBalanceRecharge(
    key: ExtraKey,
    enabled: boolean,
    consentAccepted: boolean
  ) {
    setLowBalanceRechargeUpdating(key);
    setAddonError("");

    try {
      const res = await apiFetch(`${BACKEND_URL}/billing/addons/low-balance-recharge`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenant_id: tenantId,
          addon_key: key,
          enabled,
          ...(enabled && consentAccepted ? { consent_accepted: true } : {}),
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "No se pudo actualizar la recarga automática");
      }

      setAddonBaseline((prev) => {
        const entry = prev[key];
        if (!entry) return prev;
        return {
          ...prev,
          [key]: {
            ...entry,
            low_balance_recharge_enabled: Boolean(data.low_balance_recharge_enabled),
            low_balance_recharge_consented_at: data.low_balance_recharge_consented_at ?? null,
          },
        };
      });
    } catch (error: unknown) {
      setAddonError(
        error instanceof Error ? error.message : "No se pudo actualizar la recarga automática"
      );
    } finally {
      setLowBalanceRechargeUpdating(null);
    }
  }

  // Desactivar: confirm() simple, sin checkbox de consentimiento de nuevo.
  // Activar: siempre pasa por el modal de consentimiento (handleConfirmLowBalanceConsent).
  function handleToggleLowBalanceRecharge(key: ExtraKey) {
    const currentlyEnabled = addonBaseline[key]?.low_balance_recharge_enabled || false;

    if (currentlyEnabled) {
      if (
        !window.confirm(
          "¿Desactivar la recarga automática cuando bajen tus mensajes de WhatsApp disponibles?"
        )
      ) {
        return;
      }
      patchLowBalanceRecharge(key, false, false);
      return;
    }

    setLowBalanceConsentChecked(false);
    setLowBalanceConsentModalOpen(true);
  }

  function handleConfirmLowBalanceConsent() {
    if (!lowBalanceConsentChecked) return;
    setLowBalanceConsentModalOpen(false);
    patchLowBalanceRecharge(LOW_BALANCE_RECHARGE_ADDON_KEY, true, true);
  }

  // "Activo" = tiene una fila real en el servidor (baseline > 0), no solo
  // seleccionado localmente con +/-. Antes esto filtraba por extraValue()
  // (estado local), así que un add-on recien seleccionado pero sin
  // confirmar/cobrar aparecia acá con el toggle de renovación automática
  // visible — un toggle que el backend rechaza porque la fila todavía no
  // existe. El count/amount sigue mostrando el valor LOCAL (para
  // previsualizar el cambio pendiente en un add-on ya activo), solo el
  // filtro de pertenencia a esta lista cambió a usar el baseline.
  const extraItems = useMemo(() => {
    return ADDON_KEYS.filter(
      (key) => extraSupported(key) && (addonBaseline[key]?.quantity || 0) > 0
    ).map((key) => ({
      key,
      count: extraValue(key),
      amount: tieredAddonCost(extraConfig[key], extraValue(key)),
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    serverAddonAvailability,
    addonBaseline,
    staffExtras,
    sucursalExtras,
    waConfirmacionExtras,
    campanaWaExtras,
    iaWaExtras,
    emailsCampanaExtras,
    groupCapacityExtras,
  ]);

  // Seleccionado con +/- pero todavía sin fila real en el servidor
  // (baseline 0, local > 0): se muestra como pendiente de confirmar, sin
  // el toggle de renovación automática.
  const pendingNewItems = useMemo(() => {
    return ADDON_KEYS.filter(
      (key) =>
        extraSupported(key) && (addonBaseline[key]?.quantity || 0) === 0 && extraValue(key) > 0
    ).map((key) => ({
      key,
      count: extraValue(key),
      amount: tieredAddonCost(extraConfig[key], extraValue(key)),
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    serverAddonAvailability,
    addonBaseline,
    staffExtras,
    sucursalExtras,
    waConfirmacionExtras,
    campanaWaExtras,
    iaWaExtras,
    emailsCampanaExtras,
    groupCapacityExtras,
  ]);

  const addableAddons = ADDON_KEYS.filter(
    (key) => extraSupported(key) && (addonBaseline[key]?.quantity || 0) === 0 && extraValue(key) === 0
  );
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
  // Suma de cada linea YA con IVA aplicada individualmente (no
  // applyIva(addonChargeTotal)) — el backend cobra cada add-on con una
  // llamada a Flow separada, cada una redondeada por su cuenta, así que
  // sumar los montos ya redondeados es lo que realmente coincide con el
  // total que se termina cobrando.
  const addonChargeTotalWithIva = addonPendingChanges.reduce(
    (sum, change) => sum + applyIva(change.chargeAmount),
    0
  );

  // Timeout por llamada de cobro: si el backend/Flow no responde en este
  // plazo, no asumimos exito ni fallo — se marca como "incierto" y se le
  // pide al usuario verificar en Historial de pagos antes de reintentar.
  const ADDON_CHARGE_TIMEOUT_MS = 30000;

  // Solo aca se toca el backend para add-ons: se llama uno por uno y se
  // reporta individualmente que salio bien, que no, o que quedo incierto
  // por timeout.
  async function handleConfirmAddonCharge() {
    if (!tenantId || addonPendingChanges.length === 0) return;

    setAddonSubmitting(true);
    setAddonError("");
    setAddonChangeResults([]);

    const results: AddonChangeResult[] = [];

    for (const change of addonPendingChanges) {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), ADDON_CHARGE_TIMEOUT_MS);

      try {
        const url = change.isNew
          ? `${BACKEND_URL}/billing/addons/activate`
          : `${BACKEND_URL}/billing/addons/quantity`;
        const body = change.isNew
          ? {
              tenant_id: tenantId,
              addon_key: change.key,
              quantity: change.newQty,
              billing_cycle: "mensual",
            }
          : { tenant_id: tenantId, addon_key: change.key, quantity: change.newQty };

        const res = await apiFetch(url, {
          method: change.isNew ? "POST" : "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
          signal: controller.signal,
        });
        const data = await res.json();

        if (!res.ok) {
          if (change.isNew && res.status === 403 && data?.upgrade_required) {
            throw new Error("Este add-on requiere un plan superior");
          }
          throw new Error(
            data?.error ||
              (change.isNew ? "No se pudo activar el add-on" : "No se pudo actualizar el add-on")
          );
        }

        results.push({ key: change.key, label: change.label, ok: true });
      } catch (error: unknown) {
        if (error instanceof DOMException && error.name === "AbortError") {
          results.push({
            key: change.key,
            label: change.label,
            ok: false,
            timedOut: true,
            error:
              "La operación está tardando más de lo normal. Verifica en Historial de pagos si se aplicó, o intenta de nuevo.",
          });
        } else {
          results.push({
            key: change.key,
            label: change.label,
            ok: false,
            error: error instanceof Error ? error.message : "Error desconocido",
          });
        }
      } finally {
        clearTimeout(timeoutId);
      }
    }

    setAddonChangeResults(results);
    setAddonSubmitting(false);

    // Refresca siempre, haya habido fallos parciales o no: el estado local
    // debe reflejar lo que realmente quedó persistido en el servidor. Los
    // resultados que se acaban de mostrar (setAddonChangeResults arriba)
    // ya NO se tocan dentro de refreshAddons — solo el usuario los limpia
    // al cerrar el modal explícitamente.
    await refreshAddons();

    if (!results.some((result) => !result.ok)) {
      setAddonConfirmModalOpen(false);
    }
  }

  // pending=true: seleccionado con +/- pero sin fila real en el servidor
  // todavía — sin toggle de renovación automática (no tiene sentido, el
  // backend rechazaría el PATCH porque el add-on no existe de verdad).
  function renderAddonCard(
    item: { key: ExtraKey; count: number; amount: number },
    { pending }: { pending: boolean }
  ) {
    const config = extraConfig[item.key];
    const renewalMode = addonBaseline[item.key]?.renewal_mode || "manual";
    const isAutomatico = renewalMode === "automatico";
    const isLowBalanceRechargeSupported = item.key === LOW_BALANCE_RECHARGE_ADDON_KEY;
    const isLowBalanceRechargeEnabled =
      addonBaseline[item.key]?.low_balance_recharge_enabled || false;

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
                  {pending ? (
                    <span
                      className="ml-2 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide"
                      style={{ background: "rgba(245,158,11,0.15)", color: "rgb(245 158 11)" }}
                    >
                      Pendiente de confirmar
                    </span>
                  ) : null}
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

            {!pending ? (
              <div
                className="mt-3 flex items-center justify-between gap-3 border-t pt-3"
                style={{ borderColor: "var(--border-color)" }}
              >
                <div>
                  <p className="text-xs font-medium" style={{ color: "var(--text-main)" }}>
                    Cobro automático mensual
                  </p>
                  {isAutomatico ? (
                    <p className="mt-0.5 text-xs" style={{ color: "var(--text-muted)" }}>
                      Se renovará automáticamente cada mes.
                    </p>
                  ) : null}
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={isAutomatico}
                  aria-label="Cobro automático mensual"
                  onClick={() => handleToggleRenewalMode(item.key)}
                  disabled={renewalModeUpdating === item.key}
                  className="relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition disabled:cursor-not-allowed disabled:opacity-60"
                  style={{
                    background: isAutomatico ? "rgb(37 99 235)" : "var(--border-color)",
                  }}
                >
                  <span
                    className="inline-block h-4 w-4 transform rounded-full bg-white transition"
                    style={{ transform: isAutomatico ? "translateX(22px)" : "translateX(4px)" }}
                  />
                </button>
              </div>
            ) : null}

            {!pending && isLowBalanceRechargeSupported ? (
              <div
                className="mt-3 flex items-center justify-between gap-3 border-t pt-3"
                style={{ borderColor: "var(--border-color)" }}
              >
                <div className="min-w-0 pr-2">
                  <p className="text-xs font-medium" style={{ color: "var(--text-main)" }}>
                    Recarga automática por saldo bajo
                  </p>
                  <p className="mt-0.5 text-xs" style={{ color: "var(--text-muted)" }}>
                    {isLowBalanceRechargeEnabled
                      ? `Se cobrará y agregará un pack cuando queden menos de ${LOW_BALANCE_RECHARGE_THRESHOLD} mensajes.`
                      : `Activa para recargar sola cuando queden menos de ${LOW_BALANCE_RECHARGE_THRESHOLD} mensajes.`}
                  </p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={isLowBalanceRechargeEnabled}
                  aria-label="Recarga automática por saldo bajo"
                  onClick={() => handleToggleLowBalanceRecharge(item.key)}
                  disabled={lowBalanceRechargeUpdating === item.key}
                  className="relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition disabled:cursor-not-allowed disabled:opacity-60"
                  style={{
                    background: isLowBalanceRechargeEnabled
                      ? "rgb(37 99 235)"
                      : "var(--border-color)",
                  }}
                >
                  <span
                    className="inline-block h-4 w-4 transform rounded-full bg-white transition"
                    style={{
                      transform: isLowBalanceRechargeEnabled
                        ? "translateX(22px)"
                        : "translateX(4px)",
                    }}
                  />
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    );
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
            {extraItems.length === 0 && pendingNewItems.length === 0 ? (
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
                {extraItems.map((item) => renderAddonCard(item, { pending: false }))}
                {pendingNewItems.map((item) => renderAddonCard(item, { pending: true }))}
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
                              {formatCLP(config.unitPrice)} + IVA (pago único)
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
                <span className="font-bold">{formatCLP(addonChargeTotalWithIva)} (IVA incluido)</span>
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
                    : addonChangeResults.some((result) => result.timedOut)
                    ? "Algunos add-ons quedaron con estado incierto (la respuesta tardó demasiado). Revisa Historial de pagos antes de reintentar."
                    : "Algunos add-ons no se pudieron aplicar. Los que fallaron no se cobraron."}
                </p>

                <ul className="mt-4 space-y-2">
                  {addonChangeResults.map((result) => {
                    const statusColor = result.timedOut
                      ? "rgb(245 158 11)"
                      : result.ok
                      ? "rgb(16 185 129)"
                      : "rgb(244 63 94)";
                    return (
                      <li
                        key={result.key}
                        className="rounded-lg border px-3 py-2 text-sm"
                        style={{ borderColor: "var(--border-color)", background: "var(--bg-soft)" }}
                      >
                        <span style={{ color: statusColor }}>
                          {result.timedOut ? "?" : result.ok ? "✓" : "✗"}
                        </span>{" "}
                        <span style={{ color: "var(--text-main)" }}>{result.label}</span>
                        {!result.ok && result.error ? (
                          <p className="mt-1 text-xs" style={{ color: statusColor }}>
                            {result.error}
                          </p>
                        ) : null}
                      </li>
                    );
                  })}
                </ul>

                <div className="mt-5 flex justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      setAddonChangeResults([]);
                      setAddonConfirmModalOpen(false);
                    }}
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
                        {change.chargeAmount > 0 ? formatCLP(applyIva(change.chargeAmount)) : "Sin costo"}
                      </span>
                    </li>
                  ))}
                </ul>

                <div
                  className="mt-4 flex items-center justify-between border-t pt-3"
                  style={{ borderColor: "var(--border-color)" }}
                >
                  <span className="text-sm font-semibold" style={{ color: "var(--text-main)" }}>
                    Total a cobrar hoy (IVA incluido)
                  </span>
                  <span className="text-lg font-bold" style={{ color: "var(--text-main)" }}>
                    {formatCLP(addonChargeTotalWithIva)}
                  </span>
                </div>

                <p className="mt-3 text-xs leading-5" style={{ color: "rgb(245 158 11)" }}>
                  Se cobrará {formatCLP(addonChargeTotalWithIva)} ahora mismo a tu tarjeta registrada.
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

      {lowBalanceConsentModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0"
            style={{ background: "rgba(0,0,0,0.6)" }}
            onClick={() =>
              lowBalanceRechargeUpdating ? null : setLowBalanceConsentModalOpen(false)
            }
          />
          <div
            className="relative z-10 mx-4 w-full max-w-md rounded-2xl border p-6 shadow-2xl"
            style={{ background: "var(--bg-card)", borderColor: "var(--border-color)" }}
          >
            <h3 className="text-lg font-semibold" style={{ color: "var(--text-main)" }}>
              Activar recarga automática
            </h3>
            <p className="mt-2 text-sm leading-6" style={{ color: "var(--text-muted)" }}>
              Cada vez que tus mensajes de WhatsApp disponibles bajen de{" "}
              {LOW_BALANCE_RECHARGE_THRESHOLD}, se cobrará automáticamente un pack de 50 mensajes
              adicionales a tu tarjeta registrada, sin que tengas que hacerlo manualmente.
            </p>

            <label
              className="mt-4 flex cursor-pointer items-start gap-3 rounded-xl border px-3 py-3"
              style={{ borderColor: "var(--border-color)", background: "var(--bg-soft)" }}
            >
              <input
                type="checkbox"
                checked={lowBalanceConsentChecked}
                onChange={(e) => setLowBalanceConsentChecked(e.target.checked)}
                className="mt-0.5 h-4 w-4 shrink-0"
              />
              <span className="text-xs leading-5" style={{ color: "var(--text-main)" }}>
                Autorizo a que se me cobre automáticamente{" "}
                {formatCLP(
                  lowBalanceRechargeNextPrice(
                    extraConfig[LOW_BALANCE_RECHARGE_ADDON_KEY],
                    addonBaseline[LOW_BALANCE_RECHARGE_ADDON_KEY]?.quantity || 0
                  )
                )}{" "}
                + IVA a mi tarjeta registrada cada vez que mis mensajes de WhatsApp disponibles
                bajen de {LOW_BALANCE_RECHARGE_THRESHOLD}, agregando 50 mensajes adicionales de
                inmediato. Puedo desactivar esta opción cuando quiera.
              </span>
            </label>

            <div className="mt-5 flex gap-3">
              <button
                type="button"
                onClick={() => setLowBalanceConsentModalOpen(false)}
                disabled={lowBalanceRechargeUpdating === LOW_BALANCE_RECHARGE_ADDON_KEY}
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
                disabled={
                  !lowBalanceConsentChecked ||
                  lowBalanceRechargeUpdating === LOW_BALANCE_RECHARGE_ADDON_KEY
                }
                onClick={handleConfirmLowBalanceConsent}
                className="flex-1 inline-flex h-10 items-center justify-center rounded-xl text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-60"
                style={{ background: "linear-gradient(135deg, rgb(37 99 235), rgb(14 165 233))" }}
              >
                {lowBalanceRechargeUpdating === LOW_BALANCE_RECHARGE_ADDON_KEY
                  ? "Activando..."
                  : "Activar"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
