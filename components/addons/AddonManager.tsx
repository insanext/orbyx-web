"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { apiFetch } from "@/lib/api";
import type { ExtraKey } from "@/lib/plans";
import { Mail, Megaphone, MessageCircle, Minus, Store, Users, UsersRound } from "lucide-react";
import { Panel } from "../dashboard/panel";
import { AutoChargeConsentModal, type ConsentPriceBreakdown } from "./AutoChargeConsentModal";

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
  emails_campana: {
    title: "Pack emails campaña",
    unitPrice: 1990,
    price_pack2: 1791,
    price_pack3: 1692,
    unitLabel: "pack",
    usageLabel: "500 correos campaña adicionales / mes",
    tooltip: "Correos de marketing adicionales para campañas a tus clientes. 500 correos por pack.",
    icon: <Mail className="h-5 w-5" />,
    iconClass: "bg-sky-500/15 text-sky-500",
  },
  staff: {
    title: "+ 1 Profesional",
    unitPrice: 4990,
    price_pack2: 4491,
    price_pack3: 4242,
    unitLabel: "profesional",
    usageLabel: "1 staff adicional sobre el límite del plan",
    tooltip: "Agrega un profesional adicional sobre el límite de tu plan. Cada profesional tiene su propia agenda y disponibilidad.",
    icon: <Users className="h-5 w-5" />,
    iconClass: "bg-violet-500/15 text-violet-500",
  },
  sucursal: {
    title: "+ 1 Sucursal",
    unitPrice: 9990,
    price_pack2: 8991,
    price_pack3: 8492,
    unitLabel: "sucursal",
    usageLabel: "1 sucursal adicional sobre el límite del plan",
    tooltip: "Agrega una sucursal adicional sobre el límite de tu plan.",
    icon: <Store className="h-5 w-5" />,
    iconClass: "bg-blue-500/15 text-blue-500",
  },
  group_capacity: {
    title: "+ Cupos grupales",
    // unitPrice era 4900 acá pero 4990 en server.js/tabla real (desfase
    // preexistente, detectado 2026-08-28 al sincronizar los tramos de
    // descuento) — corregido para que calce con lo que de verdad se cobra.
    unitPrice: 4990,
    price_pack2: 4491,
    price_pack3: 4242,
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

// Precio de UNA unidad específica por su índice 0-based entre todas las que
// el tenant llegue a tener (0=primera, 1=segunda, 2+=tercera en adelante) —
// misma fórmula que addonUnitTierPrice en server.js (activate, quantity,
// triggerLowBalanceRecharge). Esto debe calzar exacto con lo que el
// backend cobra de verdad, porque se usa tanto para el total a cobrar como
// para el texto de consentimiento legal de la recarga automática.
function addonUnitTierPrice(config: ExtraConfig, unitIndex: number): number {
  if (unitIndex >= 2) return config.price_pack3;
  if (unitIndex >= 1) return config.price_pack2;
  return config.unitPrice;
}

// Suma el precio real de cada unidad nueva en su tier correspondiente al
// agregar `addCount` unidades a un addon que ya tiene `currentQty` activas
// — reemplaza el cálculo anterior (unit_price de la última compra × todo
// el incremento), que subcobraba compras de más de 1 unidad de una vez
// (bug reportado 2026-08-18).
function tieredAddonChargeAmount(config: ExtraConfig, currentQty: number, addCount: number): number {
  let total = 0;
  for (let i = 0; i < addCount; i++) {
    total += addonUnitTierPrice(config, currentQty + i);
  }
  return total;
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

type AmountLineBreakdown = {
  fullNet: string;
  discount: string | null;
  iva: string;
  total: string;
};

// Desglose "Valor Neto / Descuento / IVA / Total" para mostrar montos de
// add-ons en toda la UI (tarjeta activa, líneas del modal de compra, total
// del modal). fullListNet = lo que costaría sin ningún descuento por
// cantidad (unidades × precio de lista); actualNet = lo que REALMENTE se
// cobra hoy — el mismo cálculo que usa el backend para cobrar de verdad
// (tieredAddonCost/tieredAddonChargeAmount, descuento marginal por tramo,
// no un % plano sobre el total — ver hallazgo reportado sobre el punto 2).
// "Descuento" es la diferencia entre ambos, y se omite si no hay ninguno
// (hoy: staff/sucursal/group_capacity/campanas_wa/emails_campana, que no
// tienen tramos de descuento configurados en el catálogo).
function buildAmountLineBreakdown(fullListNet: number, actualNet: number): AmountLineBreakdown {
  const roundedFullNet = Math.round(fullListNet);
  const roundedActualNet = Math.round(actualNet);
  const discountAmount = Math.max(0, roundedFullNet - roundedActualNet);
  const iva = Math.round(roundedActualNet * IVA_RATE);
  return {
    fullNet: formatCLP(roundedFullNet),
    discount: discountAmount > 0 ? `-${formatCLP(discountAmount)}` : null,
    iva: formatCLP(iva),
    total: formatCLP(roundedActualNet + iva),
  };
}

function AmountBreakdownRows({
  breakdown,
  totalLabel,
}: {
  breakdown: AmountLineBreakdown;
  totalLabel: string;
}) {
  return (
    <div className="space-y-0.5 text-xs">
      <div className="flex items-center justify-between gap-4">
        <span style={{ color: "var(--text-muted)" }}>Valor Neto</span>
        <span style={{ color: "var(--text-main)" }}>{breakdown.fullNet}</span>
      </div>
      {breakdown.discount ? (
        <div className="flex items-center justify-between gap-4">
          <span style={{ color: "rgb(16 185 129)" }}>Descuento</span>
          <span style={{ color: "rgb(16 185 129)" }}>{breakdown.discount}</span>
        </div>
      ) : null}
      <div className="flex items-center justify-between gap-4">
        <span style={{ color: "var(--text-muted)" }}>IVA</span>
        <span style={{ color: "var(--text-main)" }}>{breakdown.iva}</span>
      </div>
      <div
        className="flex items-center justify-between gap-4 border-t pt-0.5"
        style={{ borderColor: "var(--border-color)" }}
      >
        <span className="font-semibold" style={{ color: "var(--text-main)" }}>
          {totalLabel}
        </span>
        <span className="font-semibold" style={{ color: "var(--text-main)" }}>
          {breakdown.total}
        </span>
      </div>
    </div>
  );
}

type RenewalMode = "manual" | "automatico" | "pago_unico";

type AddonBaselineEntry = {
  quantity: number;
  unit_price: number | null;
  renewal_mode: RenewalMode;
  low_balance_recharge_enabled: boolean;
  low_balance_recharge_consented_at: string | null;
  // Solo pago único: fecha en que vence (tenant_addons.expires_at).
  expires_at: string | null;
};

// Umbral de mensajes restantes que dispara la recarga automática — debe
// calzar con LOW_BALANCE_RECHARGE_THRESHOLD en server.js (solo para
// mostrarlo en el texto de consentimiento; el backend es quien realmente
// decide cuándo cobrar).
const LOW_BALANCE_RECHARGE_THRESHOLD = 10;

// Solo wa_confirmacion soporta recarga automática por saldo bajo por ahora.
const LOW_BALANCE_RECHARGE_ADDON_KEY: ExtraKey = "wa_confirmacion";

type AddonChangeResult = {
  // string, no ExtraKey: las filas de activación de cobro automático
  // encadenadas tras una compra usan una key sintética ("${addonKey}_renewal")
  // para no colisionar con la fila de la compra misma en la lista de
  // resultados — ver handleConfirmAddonCharge.
  key: string;
  label: string;
  ok: boolean;
  timedOut?: boolean;
  error?: string;
  // "payment_method_required" (402): sin tarjeta inscrita.
  code?: string;
};

// dd-mm-aaaa, mismo formato que el resto del dashboard.
function formatDMYDate(date: Date): string {
  const d = String(date.getDate()).padStart(2, "0");
  const m = String(date.getMonth() + 1).padStart(2, "0");
  return `${d}-${m}-${date.getFullYear()}`;
}

const ONE_TIME_ADDON_DAYS = 30;

// Packs de mensajes (resets_monthly en el catálogo del backend): comprados
// con pago único NO vencen — el saldo se usa hasta agotarse y se cobra solo
// lo que se agrega. La capacidad (profesionales, sucursales, cupos
// grupales) sí vence a los 30 días y se paga por la cantidad total.
const MESSAGE_PACK_KEYS: ExtraKey[] = ["wa_confirmacion", "campanas_wa", "emails_campana"];
function isMessagePack(key: ExtraKey): boolean {
  return MESSAGE_PACK_KEYS.includes(key);
}
// Mensajes por pack — mismo pack_size que ADDON_CATALOG en server.js.
const MESSAGE_PACK_SIZE: Partial<Record<ExtraKey, number>> = {
  wa_confirmacion: 50,
  campanas_wa: 50,
  emails_campana: 500,
};

export function AddonManager({
  tenantId,
  onRequestCardRegistration,
}: {
  tenantId: string;
  // La inscripción de tarjeta vive en la pestaña "Suscripción" de
  // Facturación y pago: la página la abre y lleva a #billing-flow-action.
  onRequestCardRegistration?: () => void;
}) {
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

  // Pago único (Flow /payment/create) — alternativa al cobro con tarjeta.
  // hasPaymentMethod viene de GET /billing/addons (null = desconocido).
  const [hasPaymentMethod, setHasPaymentMethod] = useState<boolean | null>(null);
  // Compra individual por pago único (un add-on por vez, nunca mezclado con
  // el carrito de cobro con tarjeta). buyQty: capacidad = unidades TOTALES;
  // packs de mensajes = packs a AGREGAR.
  const [buyModal, setBuyModal] = useState<{ key: ExtraKey } | null>(null);
  const [buyQty, setBuyQty] = useState(1);
  const [oneTimeSubmitting, setOneTimeSubmitting] = useState(false);
  const [oneTimeError, setOneTimeError] = useState("");
  // Resultado al volver de Flow (?addon_payment=ok|pending|failed|review).
  const [addonPaymentNotice, setAddonPaymentNotice] = useState<
    "ok" | "pending" | "failed" | "review" | null
  >(null);

  const [renewalModeUpdating, setRenewalModeUpdating] = useState<ExtraKey | null>(null);

  const [lowBalanceRechargeUpdating, setLowBalanceRechargeUpdating] = useState<ExtraKey | null>(
    null
  );

  // Modal de consentimiento genérico, reutilizado por los dos toggles de
  // cobro automático (renovación mensual y recarga por saldo bajo) — ver
  // AutoChargeConsentModal. "flow" decide qué texto/handler usar.
  const [consentModal, setConsentModal] = useState<
    { key: ExtraKey; flow: "renewal_mode" | "low_balance_recharge" } | null
  >(null);
  const [consentChecked, setConsentChecked] = useState(false);
  // Packs de mensajes: cantidad a renovar elegida en el modal "Activar
  // cobro automático mensual". Parte en la cantidad actual (no reduce nada
  // sin pedirlo), pero se puede cambiar: los packs comprados sueltos no
  // obligan a renovar esa misma cantidad para siempre.
  const [renewalConsentQty, setRenewalConsentQty] = useState(1);

  // Los add-ons de Orbyx son intencionalmente solo de cobro mensual
  // recurrente vía Flow (decisión de producto cerrada) -- no existe un pago
  // único real, así que toda compra/aumento de cantidad deja el add-on en
  // renewal_mode "automatico" de inmediato (ver purchaseAutoPayEligible +
  // handleConfirmAddonCharge), sin pedirle al tenant un opt-in aparte. El
  // texto de consentimiento sigue mostrándose igual en el modal (ver más
  // abajo), ahora informativo en vez de un checkbox.

  // Checkbox inline "dejar en cobro automático por saldo bajo" por línea,
  // dentro del modal de compra — se resetea cada vez que se abre el modal
  // (ver onClick de "Confirmar y cobrar add-ons"). A diferencia del cobro
  // mensual de arriba, esta SÍ sigue siendo opt-in: es una recarga aparte
  // por consumo bajo, no la renovación del propio add-on comprado — solo
  // aplica a wa_confirmacion en la práctica (ver purchaseLowBalanceEligible).
  const [purchaseLowBalanceOptIn, setPurchaseLowBalanceOptIn] = useState<
    Partial<Record<ExtraKey, boolean>>
  >({});

  // Cada refreshAddons() toma un ticket incremental al iniciar. Si al
  // terminar el ticket capturado ya no es el ultimo (se disparo un
  // refresh mas nuevo mientras este esperaba la respuesta), este refresh
  // quedo obsoleto y se descarta sin tocar ningun estado — evita que un
  // refresh lento (cola de un cobro anterior) pise una seleccion local
  // mas reciente del usuario.
  const refreshTokenRef = useRef(0);

  // Vuelta desde el checkout de Flow: muestra el resultado y limpia el
  // parámetro de la URL. Si quedó "pending" (Flow aún no confirmó), vuelve
  // a leer los add-ons unos segundos después.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const value = params.get("addon_payment");
    if (!value) return;
    if (value === "ok" || value === "pending" || value === "failed" || value === "review") {
      setAddonPaymentNotice(value);
    }
    params.delete("addon_payment");
    const query = params.toString();
    window.history.replaceState(
      null,
      "",
      `${window.location.pathname}${query ? `?${query}` : ""}${window.location.hash}`
    );
    if (value === "pending") {
      const timer = setTimeout(() => {
        refreshAddons();
      }, 6000);
      return () => clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function setExtraCount(key: ExtraKey, value: number) {
    if (key === "staff") setStaffExtras(value);
    else if (key === "sucursal") setSucursalExtras(value);
    else if (key === "wa_confirmacion") setWaConfirmacionExtras(value);
    else if (key === "campanas_wa") setCampanaWaExtras(value);
    else if (key === "emails_campana") setEmailsCampanaExtras(value);
    else setGroupCapacityExtras(value);
  }

  function extraValue(key: ExtraKey) {
    if (key === "staff") return staffExtras;
    if (key === "sucursal") return sucursalExtras;
    if (key === "wa_confirmacion") return waConfirmacionExtras;
    if (key === "campanas_wa") return campanaWaExtras;
    if (key === "emails_campana") return emailsCampanaExtras;
    return groupCapacityExtras;
  }

  // A diferencia de /planes (que ademas filtra por un plan "candidato" que
  // el usuario esta comparando), aca el plan del tenant es el real y fijo:
  // la disponibilidad depende solo de lo que devolvio el backend.
  function extraSupported(key: ExtraKey) {
    return serverAddonAvailability ? serverAddonAvailability[key] !== false : false;
  }

  // true si el selector +/- de este addon tiene un cambio de cantidad
  // local todavía sin confirmar (sin pasar por "Confirmar y cobrar
  // add-ons") — usado para bloquear el toggle de renovación automática,
  // porque su texto de consentimiento y su cobro real siempre usan la
  // cantidad YA confirmada en el servidor (addonBaseline), nunca la local
  // pendiente. Mostrar un monto de consentimiento que no coincide con la
  // cantidad real comprometida sería un respaldo legal inválido.
  function hasUnconfirmedQuantityChange(key: ExtraKey) {
    return extraValue(key) !== (addonBaseline[key]?.quantity || 0);
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
          expires_at?: string | null;
        }) => {
          if (!row?.addon_key) return;
          const qty = Number(row.quantity) || 0;
          counts[row.addon_key] = qty;
          baseline[row.addon_key as ExtraKey] = {
            quantity: qty,
            unit_price: row.unit_price != null ? Number(row.unit_price) : null,
            renewal_mode:
              row.renewal_mode === "automatico"
                ? "automatico"
                : row.renewal_mode === "pago_unico"
                ? "pago_unico"
                : "manual",
            low_balance_recharge_enabled: row.low_balance_recharge_enabled === true,
            low_balance_recharge_consented_at: row.low_balance_recharge_consented_at ?? null,
            expires_at: row.expires_at ?? null,
          };
        }
      );

      setServerAddonAvailability(availability);
      setHasPaymentMethod(
        typeof data?.has_payment_method === "boolean" ? data.has_payment_method : null
      );
      setAddonBaseline(baseline);
      setStaffExtras(counts.staff || 0);
      setSucursalExtras(counts.sucursal || 0);
      setWaConfirmacionExtras(counts.wa_confirmacion || 0);
      setCampanaWaExtras(counts.campanas_wa || 0);
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

  // Texto exacto mostrado junto al consentimiento de "Cobro automático
  // mensual" (como info fija en el modal de compra, o en el checkbox del
  // toggle standalone) — se manda tal cual al backend como text_shown, para
  // que el registro en addon_auto_charge_consents coincida con lo que el
  // tenant realmente vio (monto/cantidad ya interpolados en el momento del
  // click, no un template server-side).
  function buildRenewalConsentTextRaw(
    config: ExtraConfig,
    quantity: number,
    unitPrice: number
  ): string {
    const monto = unitPrice * quantity;
    const isPlural = quantity !== 1;
    const unidadPlural = isPlural ? "unidades" : "unidad";
    const activaPlural = isPlural ? "activas" : "activa";
    return `Se te cobrará automáticamente ${formatCLP(monto)} + IVA cada ~30 días mientras este add-on esté activo, para mantener tus ${quantity} ${unidadPlural} de ${config.title} ${activaPlural}. Este cobro no se prorratea: la renovación de este addon se calcula desde la fecha de tu último pago de este addon en particular, no desde la fecha de tu plan. Puedes desactivar esta renovación cuando quieras desde "Mi suscripción" → Add-ons.`;
  }

  // Cantidad y precio unitario de la renovación a autorizar. Packs: la
  // cantidad elegida en el modal, al precio del tramo de su última unidad
  // (mismo cálculo que hace el backend al guardar). Capacidad: la cantidad
  // real activa, sin cambios (su quantity ES la capacidad del negocio).
  function renewalTerms(key: ExtraKey): { quantity: number; unitPrice: number } {
    const config = extraConfig[key];
    if (isMessagePack(key)) {
      const quantity = Math.max(1, renewalConsentQty);
      return { quantity, unitPrice: addonUnitTierPrice(config, quantity - 1) };
    }
    return {
      quantity: addonBaseline[key]?.quantity || 0,
      unitPrice: addonBaseline[key]?.unit_price ?? config.unitPrice,
    };
  }

  function buildRenewalConsentText(key: ExtraKey): string {
    const { quantity, unitPrice } = renewalTerms(key);
    return buildRenewalConsentTextRaw(extraConfig[key], quantity, unitPrice);
  }

  // Mismo texto legal, pero para el checkbox inline del modal de compra:
  // usa la cantidad/precio PROYECTADOS tras la compra (change.newQty, tier
  // de su última unidad), no el addonBaseline actual (todavía viejo en ese
  // momento) — así el monto que el tenant ve y acepta ya es el que
  // realmente quedará vigente apenas se confirme el cobro.
  function buildRenewalConsentTextForPurchase(key: ExtraKey, quantity: number, unitPrice: number): string {
    return buildRenewalConsentTextRaw(extraConfig[key], quantity, unitPrice);
  }

  // Mismo criterio que buildRenewalConsentText — precio dinámico real
  // (addonUnitTierPrice), texto armado en el frontend y mandado tal cual
  // como text_shown.
  function buildLowBalanceConsentTextForQuantity(quantity: number): string {
    const config = extraConfig[LOW_BALANCE_RECHARGE_ADDON_KEY];
    const monto = addonUnitTierPrice(config, quantity);
    return `Autorizo a que se me cobre automáticamente ${formatCLP(monto)} + IVA a mi tarjeta registrada cada vez que mis mensajes de WhatsApp disponibles bajen de ${LOW_BALANCE_RECHARGE_THRESHOLD}, agregando 50 mensajes adicionales de inmediato. Puedo desactivar esta opción cuando quiera.`;
  }

  function buildLowBalanceConsentText(): string {
    return buildLowBalanceConsentTextForQuantity(
      addonBaseline[LOW_BALANCE_RECHARGE_ADDON_KEY]?.quantity || 0
    );
  }

  // Desglose de precio para los modales de consentimiento (monto neto, IVA
  // en pesos, total, y % de descuento vs el precio de la 1ª unidad si
  // referenceUnitPrice queda por debajo de baseUnitPrice — calculado en
  // vivo desde los precios reales del catálogo, nunca un % fijo hardcodeado).
  function computePriceBreakdown(
    netAmount: number,
    referenceUnitPrice: number,
    baseUnitPrice: number
  ): ConsentPriceBreakdown {
    const total = applyIva(netAmount);
    const iva = total - netAmount;
    const discountPercent =
      referenceUnitPrice < baseUnitPrice
        ? Math.round((1 - referenceUnitPrice / baseUnitPrice) * 100)
        : null;
    return {
      net: formatCLP(netAmount),
      iva: formatCLP(iva),
      total: formatCLP(total),
      discountPercent: discountPercent !== null ? `${discountPercent}%` : null,
    };
  }

  function buildRenewalPriceBreakdown(key: ExtraKey): ConsentPriceBreakdown {
    const config = extraConfig[key];
    const { quantity, unitPrice } = renewalTerms(key);
    return computePriceBreakdown(unitPrice * quantity, unitPrice, config.unitPrice);
  }

  function buildLowBalancePriceBreakdown(): ConsentPriceBreakdown {
    const config = extraConfig[LOW_BALANCE_RECHARGE_ADDON_KEY];
    const quantity = addonBaseline[LOW_BALANCE_RECHARGE_ADDON_KEY]?.quantity || 0;
    const unitPrice = addonUnitTierPrice(config, quantity);
    return computePriceBreakdown(unitPrice, unitPrice, config.unitPrice);
  }

  // Llama al PATCH real. consentAccepted+textShown solo se mandan cuando
  // nextMode="automatico" y viene de una activación real (el backend exige
  // ambos siempre que la fila no estuviera ya en automatico).
  async function patchRenewalMode(
    key: ExtraKey,
    nextMode: RenewalMode,
    consentAccepted: boolean
  ) {
    setRenewalModeUpdating(key);
    setAddonError("");

    try {
      const res = await apiFetch(`${BACKEND_URL}/billing/addons/renewal-mode`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenant_id: tenantId,
          addon_key: key,
          renewal_mode: nextMode,
          ...(consentAccepted
            ? {
                consent_accepted: true,
                text_shown: buildRenewalConsentText(key),
                // Packs: cantidad a renovar elegida en el modal.
                ...(isMessagePack(key) ? { renewal_quantity: renewalTerms(key).quantity } : {}),
              }
            : {}),
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "No se pudo cambiar el modo de renovación");
      }

      setAddonBaseline((prev) => {
        const entry = prev[key];
        if (!entry) return prev;
        return {
          ...prev,
          [key]: {
            ...entry,
            renewal_mode: data.renewal_mode,
            ...(typeof data.quantity === "number" ? { quantity: data.quantity } : {}),
            ...(typeof data.unit_price === "number" ? { unit_price: data.unit_price } : {}),
          },
        };
      });
      // Packs: la cantidad a renovar pudo cambiar en el modal — relee para
      // que el contador local quede igual al servidor.
      if (consentAccepted && isMessagePack(key)) {
        await refreshAddons();
      }
    } catch (error: unknown) {
      setAddonError(
        error instanceof Error ? error.message : "No se pudo cambiar el modo de renovación"
      );
    } finally {
      setRenewalModeUpdating(null);
    }
  }

  // Desactivar: directo, sin modal (mismo comportamiento que siempre tuvo).
  // Activar: pasa por el modal de consentimiento genérico
  // (ver handleConfirmConsentModal) — el backend ahora lo exige.
  function handleToggleRenewalMode(key: ExtraKey) {
    const currentMode = addonBaseline[key]?.renewal_mode || "manual";

    if (currentMode === "automatico") {
      patchRenewalMode(key, "manual", false);
      return;
    }

    // El texto/monto de consentimiento siempre usa la cantidad confirmada
    // en el servidor — si hay un +/- local sin confirmar, bloquea en vez
    // de mostrar un número que no coincidiría con lo que realmente se
    // cobraría (ver hasUnconfirmedQuantityChange).
    if (hasUnconfirmedQuantityChange(key)) {
      setAddonError(
        "Tienes un cambio de cantidad sin confirmar en este add-on. Confírmalo con \"Confirmar y cobrar add-ons\" antes de activar el cobro automático."
      );
      return;
    }

    setConsentChecked(false);
    setRenewalConsentQty(Math.max(1, addonBaseline[key]?.quantity || 1));
    setConsentModal({ key, flow: "renewal_mode" });
  }

  // Llama al PATCH real. consentAccepted+textShown solo se mandan cuando
  // enabled=true (activando) — el backend lo exige siempre que la fila
  // esté deshabilitada antes del request, así que en la práctica se manda
  // en cada activación, no solo la primera vez histórica.
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
          ...(enabled && consentAccepted
            ? { consent_accepted: true, text_shown: buildLowBalanceConsentText() }
            : {}),
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
  // Activar: siempre pasa por el modal de consentimiento genérico.
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

    setConsentChecked(false);
    setConsentModal({ key, flow: "low_balance_recharge" });
  }

  // Confirmación del modal genérico — decide a qué PATCH llamar según el
  // flow con el que se abrió.
  function handleConfirmConsentModal() {
    if (!consentModal || !consentChecked) return;
    const { key, flow } = consentModal;
    setConsentModal(null);
    if (flow === "renewal_mode") {
      patchRenewalMode(key, "automatico", true);
    } else {
      patchLowBalanceRecharge(key, true, true);
    }
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
  // precio del backend: cada unidad nueva se cobra en su propio tier
  // (tieredAddonChargeAmount), sumando 1ª+2ª+3ª... unidad nueva según
  // corresponda, en vez de aplicar un solo tier a todo el incremento (bug
  // reportado 2026-08-18, corregido también en POST billing/addons/activate
  // y PATCH billing/addons/quantity en server.js).
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
        chargeAmount = tieredAddonChargeAmount(config, baselineQty, increment);
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

  // Desglose Valor Neto/Descuento/IVA/Total para el footer del modal de
  // compra — suma cada componente YA redondeado por línea (no re-deriva
  // desde los totales netos agregados), para que coincida exacto con
  // addonChargeTotalWithIva de arriba (cada add-on se cobra con su propia
  // llamada a Flow, redondeada por separado).
  const addonAmountBreakdownTotal: AmountLineBreakdown = useMemo(() => {
    let fullNet = 0;
    let net = 0;
    let iva = 0;
    addonPendingChanges.forEach((change) => {
      if (change.chargeAmount <= 0) return;
      const config = extraConfig[change.key];
      fullNet += (change.newQty - change.baselineQty) * config.unitPrice;
      net += change.chargeAmount;
      iva += applyIva(change.chargeAmount) - change.chargeAmount;
    });
    const discountAmount = Math.max(0, fullNet - net);
    return {
      fullNet: formatCLP(fullNet),
      discount: discountAmount > 0 ? `-${formatCLP(discountAmount)}` : null,
      iva: formatCLP(iva),
      total: formatCLP(net + iva),
    };
  }, [addonPendingChanges]);

  // ---- Pago único (compra individual) ----
  // El carrito (+/- y "Confirmar y cobrar add-ons") es solo para add-ons
  // cobrados con tarjeta. Los add-ons sin cobro automático (sin tarjeta
  // inscrita, o ya en pago_unico) se compran de a uno con su propio botón y
  // modal: nunca se mezcla una reducción con una compra en el mismo pago.
  // Reglas (2026-09-28), mismas que POST /billing/addons/checkout:
  // - Capacidad: se paga la cantidad TOTAL (tramos desde la 1ª unidad) y
  //   vence a los 30 días del pago (una nueva compra reinicia el plazo).
  // - Packs de mensajes: se cobran solo los packs agregados, se suman al
  //   saldo y no vencen.
  const oneTimeExpiryLabel = formatDMYDate(
    new Date(Date.now() + ONE_TIME_ADDON_DAYS * 24 * 60 * 60 * 1000)
  );

  // true si este add-on se compra/renueva por pago único (botón propio) en
  // vez del carrito con tarjeta.
  function usesOneTimePurchase(key: ExtraKey): boolean {
    const row = addonBaseline[key];
    if (row?.renewal_mode === "pago_unico") return true;
    return !row && hasPaymentMethod === false;
  }

  function computeOneTimePurchase(key: ExtraKey, qtyInput: number) {
    const config = extraConfig[key];
    const currentQty = addonBaseline[key]?.quantity || 0;
    const isPack = isMessagePack(key);
    const added = isPack ? Math.max(1, qtyInput) : 0;
    const totalQty = isPack ? currentQty + added : Math.max(currentQty, 1, qtyInput);
    const net = isPack
      ? tieredAddonChargeAmount(config, currentQty, added)
      : tieredAddonChargeAmount(config, 0, totalQty);
    const fullNet = (isPack ? added : totalQty) * config.unitPrice;
    const discountAmount = Math.max(0, fullNet - net);
    const total = applyIva(net);
    const breakdown: AmountLineBreakdown = {
      fullNet: formatCLP(fullNet),
      discount: discountAmount > 0 ? `-${formatCLP(discountAmount)}` : null,
      iva: formatCLP(total - net),
      total: formatCLP(total),
    };
    return { config, currentQty, isPack, added, totalQty, net, total, breakdown };
  }

  function openBuyModal(key: ExtraKey) {
    const currentQty = addonBaseline[key]?.quantity || 0;
    // Capacidad: parte en la cantidad actual (renovar igual) o 1 si es nuevo.
    // Packs: parte en 1 pack a agregar.
    setBuyQty(isMessagePack(key) ? 1 : Math.max(1, currentQty));
    setOneTimeError("");
    setBuyModal({ key });
  }

  async function handleOneTimeCheckout() {
    if (!tenantId || !buyModal) return;
    const purchase = computeOneTimePurchase(buyModal.key, buyQty);
    setOneTimeSubmitting(true);
    setOneTimeError("");
    try {
      const res = await apiFetch(`${BACKEND_URL}/billing/addons/checkout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenant_id: tenantId,
          // Un solo add-on por pago. quantity = cantidad total resultante
          // (el backend cobra lo agregado para packs y el total para capacidad).
          items: [{ addon_key: buyModal.key, quantity: purchase.totalQty }],
        }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.checkout_url) {
        throw new Error(data?.error || "No se pudo iniciar el pago en Flow.");
      }
      // Checkout de Flow; al terminar vuelve a esta página con ?addon_payment=
      window.location.href = data.checkout_url;
    } catch (error: unknown) {
      setOneTimeError(error instanceof Error ? error.message : "No se pudo iniciar el pago en Flow.");
      setOneTimeSubmitting(false);
    }
  }

  // Inscripción de tarjeta: mismo flujo que ya existe en esta página
  // (sección #billing-flow-action de Facturación y pago).
  function goToCardRegistration() {
    setAddonConfirmModalOpen(false);
    setAddonChangeResults([]);
    setBuyModal(null);
    if (onRequestCardRegistration) {
      onRequestCardRegistration();
      return;
    }
    document.getElementById("billing-flow-action")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  // true si esta línea del modal de compra debe activar renewal_mode
  // "automatico" al confirmarse: implica un cobro real hoy (compra nueva o
  // aumento de cantidad, nunca una baja) y el addon todavía no está en
  // "automatico" — si ya lo está, no hay nada que activar de nuevo (el
  // toggle fuera del modal sigue siendo el lugar para desactivarlo).
  function purchaseAutoPayEligible(change: { key: ExtraKey; chargeAmount: number }): boolean {
    return (
      change.chargeAmount > 0 &&
      (addonBaseline[change.key]?.renewal_mode || "manual") !== "automatico"
    );
  }

  // Igual criterio, pero para el checkbox de recarga automática por saldo
  // bajo — restringido a wa_confirmacion (único add-on que la soporta hoy,
  // ver LOW_BALANCE_RECHARGE_ADDON_KEY), y no se ofrece si ya está activada.
  function purchaseLowBalanceEligible(change: { key: ExtraKey; chargeAmount: number }): boolean {
    return (
      change.key === LOW_BALANCE_RECHARGE_ADDON_KEY &&
      change.chargeAmount > 0 &&
      !(addonBaseline[change.key]?.low_balance_recharge_enabled || false)
    );
  }

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
          if (data?.code === "payment_method_required") {
            setHasPaymentMethod(false);
            const paymentError = new Error(
              data?.error || "No tienes un medio de pago inscrito."
            ) as Error & { code?: string };
            paymentError.code = "payment_method_required";
            throw paymentError;
          }
          throw new Error(
            data?.error ||
              (change.isNew ? "No se pudo activar el add-on" : "No se pudo actualizar el add-on")
          );
        }

        results.push({ key: change.key, label: change.label, ok: true });

        // Encadena la activación de cobro automático mensual siempre que
        // aplique (fix 2026-09-05: antes dependía de un checkbox opt-in que
        // quedaba sin marcar por defecto, y el add-on recién comprado
        // quedaba con el toggle "Cobro automático mensual" apagado -- los
        // add-ons de Orbyx son solo de cobro recurrente por decisión de
        // producto, no tiene sentido que la compra deje esto en "manual"
        // esperando una acción aparte). Mismo endpoint/consentimiento que el
        // toggle de fuera del modal, solo que acá se dispara automáticamente
        // justo después de la compra. Un fallo acá NO revierte ni oculta que
        // la compra sí se hizo — solo se reporta aparte, y el tenant puede
        // activar el toggle a mano si esto falla.
        if (purchaseAutoPayEligible(change)) {
          try {
            const config = extraConfig[change.key];
            const projectedUnitPrice = addonUnitTierPrice(config, change.newQty - 1);

            const renewalRes = await apiFetch(`${BACKEND_URL}/billing/addons/renewal-mode`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                tenant_id: tenantId,
                addon_key: change.key,
                renewal_mode: "automatico",
                consent_accepted: true,
                text_shown: buildRenewalConsentTextForPurchase(
                  change.key,
                  change.newQty,
                  projectedUnitPrice
                ),
              }),
            });
            const renewalData = await renewalRes.json();

            if (!renewalRes.ok) {
              results.push({
                key: `${change.key}_renewal`,
                label: `${change.label} — cobro automático mensual`,
                ok: false,
                error:
                  renewalData?.error ||
                  "El add-on se compró, pero no se pudo activar el cobro automático. Actívalo manualmente con el interruptor.",
              });
            }
          } catch {
            results.push({
              key: `${change.key}_renewal`,
              label: `${change.label} — cobro automático mensual`,
              ok: false,
              error:
                "El add-on se compró, pero no se pudo activar el cobro automático. Actívalo manualmente con el interruptor.",
            });
          }
        }

        // Mismo patrón que el bloque de arriba, pero para el checkbox de
        // recarga automática por saldo bajo — mismo endpoint/consentimiento
        // que el toggle "Recarga automática por saldo bajo" de fuera del
        // modal (PATCH /billing/addons/low-balance-recharge).
        if (purchaseLowBalanceOptIn[change.key] && purchaseLowBalanceEligible(change)) {
          try {
            const lowBalanceRes = await apiFetch(
              `${BACKEND_URL}/billing/addons/low-balance-recharge`,
              {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  tenant_id: tenantId,
                  addon_key: change.key,
                  enabled: true,
                  consent_accepted: true,
                  text_shown: buildLowBalanceConsentTextForQuantity(change.newQty),
                }),
              }
            );
            const lowBalanceData = await lowBalanceRes.json();

            if (!lowBalanceRes.ok) {
              results.push({
                key: `${change.key}_lowbalance`,
                label: `${change.label} — recarga automática por saldo bajo`,
                ok: false,
                error:
                  lowBalanceData?.error ||
                  "El add-on se compró, pero no se pudo activar la recarga automática por saldo bajo. Actívala manualmente con el interruptor.",
              });
            }
          } catch {
            results.push({
              key: `${change.key}_lowbalance`,
              label: `${change.label} — recarga automática por saldo bajo`,
              ok: false,
              error:
                "El add-on se compró, pero no se pudo activar la recarga automática por saldo bajo. Actívala manualmente con el interruptor.",
            });
          }
        }
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
            code: (error as { code?: string })?.code,
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
    const isOneTimeRow = renewalMode === "pago_unico";
    const oneTimeExpiresAt = addonBaseline[item.key]?.expires_at;
    const oneTimeExpiry = oneTimeExpiresAt ? formatDMYDate(new Date(oneTimeExpiresAt)) : null;
    const isLowBalanceRechargeSupported = item.key === LOW_BALANCE_RECHARGE_ADDON_KEY;
    const isLowBalanceRechargeEnabled =
      addonBaseline[item.key]?.low_balance_recharge_enabled || false;

    return (
      <div
        key={item.key}
        className="rounded-md border px-4 py-3"
        style={{ borderColor: "var(--border-color)", background: "var(--bg-soft)" }}
      >
        <div className="flex items-start gap-3">
          <span
            className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md ${config.iconClass}`}
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
                      className="ml-2 rounded px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide"
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
                <AmountBreakdownRows
                  breakdown={buildAmountLineBreakdown(item.count * config.unitPrice, item.amount)}
                  totalLabel="Total mensual"
                />
              </div>
            </div>

            {usesOneTimePurchase(item.key) ? (
              <div className="mt-3 flex items-center justify-end">
                <button
                  type="button"
                  onClick={() => openBuyModal(item.key)}
                  className="inline-flex h-9 items-center justify-center rounded-md px-3 text-xs font-semibold text-white transition"
                  style={{ background: "linear-gradient(135deg, rgb(37 99 235), rgb(14 165 233))" }}
                >
                  {isMessagePack(item.key) ? "Comprar más packs" : "Renovar o ampliar"}
                </button>
              </div>
            ) : hasPaymentMethod === false ? (
              <p className="mt-3 text-right text-xs" style={{ color: "var(--text-muted)" }}>
                Para cambiar la cantidad, inscribe una tarjeta.
              </p>
            ) : (
            <div className="mt-3 flex items-center justify-end">
              <div
                className="flex items-center rounded-md border"
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
            )}

            {!pending ? (
              <div
                className="mt-3 flex items-center justify-between gap-3 border-t pt-3"
                style={{ borderColor: "var(--border-color)" }}
              >
                <div className="min-w-0 pr-2">
                  <p className="text-xs font-medium" style={{ color: "var(--text-main)" }}>
                    Cobro automático mensual
                  </p>
                  <p
                    className="mt-0.5 text-xs"
                    style={{
                      color:
                        !isAutomatico && hasUnconfirmedQuantityChange(item.key)
                          ? "rgb(245 158 11)"
                          : "var(--text-muted)",
                    }}
                  >
                    {isOneTimeRow && !hasUnconfirmedQuantityChange(item.key)
                      ? `Pago único${
                          oneTimeExpiry ? ` · vence el ${oneTimeExpiry}` : isMessagePack(item.key) ? " · saldo sin vencimiento" : ""
                        }. ${
                          hasPaymentMethod === false
                            ? "Inscribe una tarjeta para pasar a cobro automático."
                            : "Actívalo para renovar automáticamente con tu tarjeta."
                        }`
                      : !isAutomatico && hasUnconfirmedQuantityChange(item.key)
                      ? "Confirma tu cambio de cantidad pendiente antes de activar el cobro automático."
                      : isAutomatico
                      ? "Se renovará automáticamente cada mes."
                      : "Actívalo para renovar automáticamente — no se cobra nada al activar esta opción, solo en cada renovación."}
                  </p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={isAutomatico}
                  aria-label="Cobro automático mensual"
                  onClick={() => handleToggleRenewalMode(item.key)}
                  disabled={
                    renewalModeUpdating === item.key ||
                    (!isAutomatico && hasUnconfirmedQuantityChange(item.key)) ||
                    (isOneTimeRow && hasPaymentMethod === false)
                  }
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
        className="!rounded"
        title="Add-ons"
        description={
          hasPaymentMethod === false
            ? "Agrega capacidad extra a tu plan. Sin tarjeta inscrita, puedes pagarlos una sola vez con Flow."
            : "Agrega capacidad extra a tu plan. Los cambios se cobran de inmediato a tu tarjeta registrada al confirmar."
        }
      >
        {addonPaymentNotice ? (
          <div
            className="mb-3 flex items-start justify-between gap-3 rounded-md border px-4 py-3 text-sm"
            style={{
              borderColor:
                addonPaymentNotice === "ok"
                  ? "rgba(16,185,129,0.4)"
                  : addonPaymentNotice === "pending"
                  ? "rgba(245,158,11,0.4)"
                  : "rgba(244,63,94,0.34)",
              background:
                addonPaymentNotice === "ok"
                  ? "rgba(16,185,129,0.08)"
                  : addonPaymentNotice === "pending"
                  ? "rgba(245,158,11,0.08)"
                  : "rgba(244,63,94,0.08)",
              color: "var(--text-main)",
            }}
          >
            <span>
              {addonPaymentNotice === "ok"
                ? "Pago recibido: tus add-ons ya están activos."
                : addonPaymentNotice === "pending"
                ? "Flow todavía está confirmando tu pago. Tus add-ons se activarán en unos minutos."
                : addonPaymentNotice === "review"
                ? "Recibimos tu pago, pero hubo un problema al activar tus add-ons. Escríbenos a soporte@orbyx.cl y lo resolvemos."
                : "El pago no se completó y no se hizo ningún cobro. Puedes intentarlo de nuevo."}
            </span>
            <button
              type="button"
              onClick={() => setAddonPaymentNotice(null)}
              className="shrink-0 text-xs font-semibold"
              style={{ color: "var(--text-muted)" }}
            >
              Cerrar
            </button>
          </div>
        ) : null}

        {addonError ? (
          <div
            className="mb-3 rounded-md border px-4 py-3 text-sm"
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
            className="rounded-md border border-dashed px-4 py-6 text-sm"
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
                className="rounded-md border border-dashed px-4 py-6 text-sm"
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
                        onClick={() =>
                          usesOneTimePurchase(key) ? openBuyModal(key) : increaseExtra(key)
                        }
                        disabled={addonSubmitting}
                        title={config.tooltip}
                        className="flex w-full items-center justify-between gap-3 rounded-md border px-3 py-2 text-left transition disabled:cursor-not-allowed disabled:opacity-40"
                        style={{ borderColor: "var(--border-color)", background: "var(--bg-soft)" }}
                      >
                        <span className="flex items-center gap-2">
                          <span
                            className={`inline-flex h-8 w-8 items-center justify-center rounded-md ${config.iconClass}`}
                          >
                            {config.icon}
                          </span>
                          <span>
                            <span className="block text-xs font-semibold" style={{ color: "var(--text-main)" }}>
                              {config.title}
                            </span>
                            <span className="block text-xs" style={{ color: "var(--text-muted)" }}>
                              {usesOneTimePurchase(key)
                                ? `${formatCLP(config.unitPrice)} + IVA · pago único${
                                    isMessagePack(key) ? " (no vence)" : " (30 días)"
                                  }`
                                : `${formatCLP(config.unitPrice)} + IVA /mes`}
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
              <p className="mt-1 text-xs" style={{ color: "var(--text-muted)" }}>
                El cobro es por el monto completo al confirmar, sin prorrateo por días del mes.
              </p>
            ) : null}

            {hasPendingAddonChanges ? (
              <button
                type="button"
                onClick={() => {
                  setAddonChangeResults([]);
                  setPurchaseLowBalanceOptIn({});
                  setOneTimeError("");
                  setAddonConfirmModalOpen(true);
                }}
                disabled={addonSubmitting}
                className="mt-4 inline-flex h-11 w-full items-center justify-center rounded-md px-5 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-60"
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
            className="relative z-10 mx-4 w-full max-w-md rounded border p-6 shadow-2xl"
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
                        className="rounded-md border px-3 py-2 text-sm"
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

                {addonChangeResults.some((result) => result.code === "payment_method_required") ? (
                  <div
                    className="mt-3 rounded-md border px-3 py-2 text-xs leading-5"
                    style={{
                      borderColor: "rgba(244,63,94,0.34)",
                      background: "rgba(244,63,94,0.06)",
                      color: "var(--text-main)",
                    }}
                  >
                    No pudimos cobrar porque no tienes un medio de pago inscrito.{" "}
                    <button
                      type="button"
                      onClick={goToCardRegistration}
                      className="font-semibold underline"
                    >
                      Inscribir tarjeta
                    </button>{" "}
                    o vuelve a elegir los add-ons y usa &ldquo;Pagar una vez con Flow&rdquo;.
                  </div>
                ) : null}

                <div className="mt-5 flex justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      setAddonChangeResults([]);
                      setAddonConfirmModalOpen(false);
                    }}
                    className="inline-flex h-10 items-center justify-center rounded-md border px-5 text-sm font-medium transition"
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
                {(() => {
                  const linkStyle = { color: "rgb(37 99 235)" };
                  const detailsBox = (text: string) => (
                    <details className="mt-1">
                      <summary className="cursor-pointer text-xs font-semibold" style={linkStyle}>
                        Ver autorización completa
                      </summary>
                      <p
                        className="mt-1 rounded-md border px-2 py-1.5 text-xs leading-5"
                        style={{ borderColor: "var(--border-color)", background: "var(--bg-card)", color: "var(--text-muted)" }}
                      >
                        {text}
                      </p>
                    </details>
                  );
                  // Carrito: solo cobro a la tarjeta inscrita (la compra por pago
                  // único es individual, ver el modal "buyModal").
                  // ---- Estado 1: cobro a la tarjeta inscrita (como antes) ----
                  return (
                    <>
                <h3 className="text-lg font-semibold" style={{ color: "var(--text-main)" }}>
                  Confirmar cobro de add-ons
                </h3>
                <p className="mt-2 text-sm leading-6" style={{ color: "var(--text-muted)" }}>
                  Estos cambios se aplicarán y cobrarán de inmediato a tu tarjeta registrada.
                </p>

                <ul className="mt-4 space-y-2">
                  {addonPendingChanges.map((change) => {
                    const projectedUnitPrice = addonUnitTierPrice(extraConfig[change.key], change.newQty - 1);
                    return (
                    <li
                      key={change.key}
                      className="rounded-md border px-3 py-2 text-sm"
                      style={{ borderColor: "var(--border-color)", background: "var(--bg-soft)" }}
                    >
                      <div className="flex items-center justify-between gap-3">
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
                      </div>

                      {purchaseAutoPayEligible(change) ? (
                        <div
                          className="mt-2 border-t pt-2 text-xs leading-5"
                          style={{ borderColor: "var(--border-color)", color: "var(--text-muted)" }}
                        >
                          <span className="font-semibold" style={{ color: "var(--text-main)" }}>
                            Renovación automática:
                          </span>{" "}
                          {formatCLP(projectedUnitPrice * change.newQty)} + IVA cada ~30 días · cancelable cuando
                          quieras
                          {detailsBox(
                            buildRenewalConsentTextForPurchase(change.key, change.newQty, projectedUnitPrice)
                          )}
                        </div>
                      ) : null}

                      {purchaseLowBalanceEligible(change) ? (
                        <div className="mt-2 border-t pt-2" style={{ borderColor: "var(--border-color)" }}>
                          <label className="flex cursor-pointer items-start gap-2">
                            <input
                              type="checkbox"
                              checked={purchaseLowBalanceOptIn[change.key] || false}
                              onChange={(e) =>
                                setPurchaseLowBalanceOptIn((prev) => ({
                                  ...prev,
                                  [change.key]: e.target.checked,
                                }))
                              }
                              disabled={addonSubmitting}
                              className="mt-0.5 h-4 w-4 shrink-0"
                            />
                            <span className="text-xs leading-5" style={{ color: "var(--text-muted)" }}>
                              <span className="font-semibold" style={{ color: "var(--text-main)" }}>
                                Recarga automática por saldo bajo
                              </span>{" "}
                              (opcional): {formatCLP(addonUnitTierPrice(extraConfig[change.key], change.newQty))} +
                              IVA cuando te queden menos de {LOW_BALANCE_RECHARGE_THRESHOLD} mensajes
                            </span>
                          </label>
                          <div className="pl-6">
                            {detailsBox(buildLowBalanceConsentTextForQuantity(change.newQty))}
                          </div>
                        </div>
                      ) : null}
                    </li>
                    );
                  })}
                </ul>

                <div
                  className="mt-4 border-t pt-3"
                  style={{ borderColor: "var(--border-color)" }}
                >
                  <AmountBreakdownRows
                    breakdown={addonAmountBreakdownTotal}
                    totalLabel="Total a cobrar hoy"
                  />
                </div>

                <p className="mt-3 text-xs leading-5" style={{ color: "rgb(245 158 11)" }}>
                  Se cobrará {formatCLP(addonChargeTotalWithIva)} ahora mismo a tu tarjeta registrada.
                </p>
                {addonPendingChanges.some((change) => purchaseAutoPayEligible(change)) ? (
                  <p className="mt-1 text-xs leading-5" style={{ color: "var(--text-muted)" }}>
                    Al confirmar autorizas el cobro de hoy y las renovaciones descritas arriba.
                  </p>
                ) : null}

                <div className="mt-5 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setAddonConfirmModalOpen(false)}
                    disabled={addonSubmitting}
                    className="flex-1 inline-flex h-10 items-center justify-center rounded-md border text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-60"
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
                    className="flex-1 inline-flex h-10 items-center justify-center rounded-md text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-60"
                    style={{ background: "linear-gradient(135deg, rgb(37 99 235), rgb(14 165 233))" }}
                  >
                    {addonSubmitting ? "Cobrando..." : "Confirmar cobro"}
                  </button>
                </div>
                    </>
                  );
                })()}
              </>
            )}
          </div>
        </div>
      ) : null}

      {buyModal ? (() => {
        const purchase = computeOneTimePurchase(buyModal.key, buyQty);
        const { config, currentQty, isPack, added, totalQty } = purchase;
        const minQty = isPack ? 1 : Math.max(1, currentQty);
        const maxQty = isPack ? Math.max(1, 50 - currentQty) : 50;
        const stepperValue = isPack ? added : totalQty;
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div
              className="absolute inset-0"
              style={{ background: "rgba(0,0,0,0.6)" }}
              onClick={() => (oneTimeSubmitting ? null : setBuyModal(null))}
            />
            <div
              className="relative z-10 mx-4 w-full max-w-md rounded border p-6 shadow-2xl"
              style={{ background: "var(--bg-card)", borderColor: "var(--border-color)" }}
            >
              <span
                className="inline-block rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide"
                style={{ background: "rgba(14,165,233,0.14)", color: "rgb(3 105 161)" }}
              >
                Pago único
              </span>
              <h3 className="mt-2 text-lg font-semibold" style={{ color: "var(--text-main)" }}>
                {isPack ? `Comprar ${config.title}` : `Contratar ${config.title}`}
              </h3>
              <p className="mt-2 text-sm leading-6" style={{ color: "var(--text-muted)" }}>
                {isPack
                  ? "Pagas ahora con Flow. Los mensajes se suman a tu saldo y no vencen: se usan hasta agotarse. No se renueva solo."
                  : `Pagas ahora con Flow. Queda activo por 30 días (hasta el ${oneTimeExpiryLabel}) y no se renueva solo.`}
              </p>

              <div
                className="mt-4 flex items-center justify-between gap-3 rounded-md border px-3 py-2.5"
                style={{ borderColor: "var(--border-color)", background: "var(--bg-soft)" }}
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium" style={{ color: "var(--text-main)" }}>
                    {isPack ? "Packs a comprar" : "Unidades"}
                  </p>
                  <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                    {isPack
                      ? `${added} pack${added === 1 ? "" : "s"} · ${added * (MESSAGE_PACK_SIZE[buyModal.key] || 0)} mensajes${
                          currentQty > 0 ? " · se suman a tu saldo actual" : ""
                        }`
                      : currentQty > 0
                      ? `Tienes ${currentQty}. Pagas el total y el plazo vuelve a contar 30 días.`
                      : "Cantidad a contratar"}
                  </p>
                </div>
                <div className="flex items-center rounded-md border" style={{ borderColor: "var(--border-color)" }}>
                  <button
                    type="button"
                    onClick={() => setBuyQty((prev) => Math.max(minQty, (isPack ? prev : Math.max(prev, minQty)) - 1))}
                    disabled={oneTimeSubmitting || stepperValue <= minQty}
                    className="inline-flex h-9 w-9 items-center justify-center transition disabled:cursor-not-allowed disabled:opacity-40"
                    style={{ color: "var(--text-main)" }}
                    aria-label="Menos"
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <span className="min-w-8 text-center text-sm font-semibold" style={{ color: "var(--text-main)" }}>
                    {stepperValue}
                  </span>
                  <button
                    type="button"
                    onClick={() => setBuyQty((prev) => Math.min(maxQty, (isPack ? prev : Math.max(prev, minQty)) + 1))}
                    disabled={oneTimeSubmitting || stepperValue >= maxQty}
                    className="inline-flex h-9 w-9 items-center justify-center transition disabled:cursor-not-allowed disabled:opacity-40"
                    style={{ color: "var(--text-main)" }}
                    aria-label="Más"
                  >
                    +
                  </button>
                </div>
              </div>

              <div className="mt-4 border-t pt-3" style={{ borderColor: "var(--border-color)" }}>
                <AmountBreakdownRows breakdown={purchase.breakdown} totalLabel="Total a pagar" />
              </div>

              {!isPack ? (
                <p className="mt-3 text-xs leading-5" style={{ color: "var(--text-muted)" }}>
                  Te avisaremos por correo antes del vencimiento para que puedas renovar.
                </p>
              ) : null}

              {oneTimeError ? (
                <p className="mt-3 text-xs leading-5" style={{ color: "rgb(244 63 94)" }}>
                  {oneTimeError}
                </p>
              ) : null}

              <div className="mt-5 flex gap-3">
                <button
                  type="button"
                  onClick={() => setBuyModal(null)}
                  disabled={oneTimeSubmitting}
                  className="flex-1 inline-flex h-10 items-center justify-center rounded-md border text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-60"
                  style={{ borderColor: "var(--border-color)", background: "var(--bg-soft)", color: "var(--text-main)" }}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleOneTimeCheckout}
                  disabled={oneTimeSubmitting}
                  className="flex-1 inline-flex h-10 items-center justify-center rounded-md text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-60"
                  style={{ background: "linear-gradient(135deg, rgb(37 99 235), rgb(14 165 233))" }}
                >
                  {oneTimeSubmitting ? "Abriendo Flow..." : `Pagar ${formatCLP(purchase.total)} con Flow`}
                </button>
              </div>

              {hasPaymentMethod === false ? (
                <p className="mt-3 text-center text-sm">
                  <button
                    type="button"
                    onClick={goToCardRegistration}
                    disabled={oneTimeSubmitting}
                    className="font-semibold"
                    style={{ color: "rgb(37 99 235)" }}
                  >
                    Prefiero inscribir una tarjeta (cobro automático)
                  </button>
                </p>
              ) : null}
            </div>
          </div>
        );
      })() : null}

      {consentModal ? (
        <AutoChargeConsentModal
          open
          title={
            consentModal.flow === "renewal_mode"
              ? "Activar cobro automático mensual"
              : "Activar recarga automática"
          }
          description={
            consentModal.flow === "renewal_mode"
              ? "Cada ~30 días se cobrará automáticamente a tu tarjeta registrada para mantener activas tus unidades de este addon, sin que tengas que renovarlo manualmente."
              : `Cada vez que tus mensajes de WhatsApp disponibles bajen de ${LOW_BALANCE_RECHARGE_THRESHOLD}, se cobrará automáticamente un pack de 50 mensajes adicionales a tu tarjeta registrada, sin que tengas que hacerlo manualmente.`
          }
          consentText={
            consentModal.flow === "renewal_mode"
              ? buildRenewalConsentText(consentModal.key)
              : buildLowBalanceConsentText()
          }
          priceBreakdown={
            consentModal.flow === "renewal_mode"
              ? buildRenewalPriceBreakdown(consentModal.key)
              : buildLowBalancePriceBreakdown()
          }
          checked={consentChecked}
          onCheckedChange={setConsentChecked}
          onCancel={() => setConsentModal(null)}
          onConfirm={handleConfirmConsentModal}
          quantitySelector={
            consentModal.flow === "renewal_mode" && isMessagePack(consentModal.key)
              ? {
                  value: renewalConsentQty,
                  min: 1,
                  max: 50,
                  label: "Packs a renovar cada mes",
                  hint: `${renewalConsentQty * (MESSAGE_PACK_SIZE[consentModal.key] || 0)} mensajes por mes · tu saldo actual no cambia`,
                  onChange: (value) => {
                    setRenewalConsentQty(value);
                    // Cambió el monto: hay que volver a aceptar.
                    setConsentChecked(false);
                  },
                }
              : undefined
          }
          confirming={
            consentModal.flow === "renewal_mode"
              ? renewalModeUpdating === consentModal.key
              : lowBalanceRechargeUpdating === consentModal.key
          }
        />
      ) : null}
    </div>
  );
}
