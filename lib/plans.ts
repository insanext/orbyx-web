// ======================================================
// Fuente única de nombres/orden de plan y datos de marketing (Sesión 3,
// 2026-08-21) — consolida las copias que antes vivían duplicadas (y
// parcialmente desincronizadas) en dashboard/[slug]/layout.tsx,
// dashboard/[slug]/page.tsx, dashboard/[slug]/branches/page.tsx,
// dashboard/[slug]/billing/page.tsx, dashboard/[slug]/campaigns/page.tsx,
// signup/page.tsx y planes/comparar/page.tsx.
// ======================================================

// PlanSlug cubre los 6 valores que puede tener realmente `tenants.plan_slug`
// hoy: los 3 planes vigentes (starter/business/premium) y los 3 planes
// legacy (pro/vip/platinum) que 3 tenants conservan a propósito por tener
// una suscripción Flow activa — sus filas en plan_config se preservaron
// (is_active:false, no borradas) y su dashboard debe seguir mostrando su
// nombre real. NUNCA aliasear un slug legacy a uno nuevo acá: eso fue
// exactamente el bug que rompía el label de esos 3 tenants antes de esta
// consolidación (varias copias tenían `starter: "Pro"` o un
// `normalizePlanSlug` local que hacía `if (x === "starter") return "pro"`).
export type PlanSlug = "starter" | "business" | "premium" | "pro" | "vip" | "platinum";

export const PLAN_LABELS: Record<PlanSlug, string> = {
  starter: "Starter",
  business: "Business",
  premium: "Premium",
  pro: "Pro",
  vip: "VIP",
  platinum: "Platinum",
};

const KNOWN_PLAN_SLUGS = new Set<string>(Object.keys(PLAN_LABELS));

export function isKnownPlanSlug(value: string | null | undefined): value is PlanSlug {
  return Boolean(value) && KNOWN_PLAN_SLUGS.has(String(value).toLowerCase());
}

// Nombre a mostrar para el plan_slug real de un tenant (nuevo o legacy).
// Fallback defensivo ante un valor totalmente desconocido: capitaliza el
// string tal cual en vez de mostrar "undefined" o romper el render.
export function getPlanLabel(planSlug: string | null | undefined): string {
  if (!planSlug) return PLAN_LABELS.starter;
  const normalized = String(planSlug).toLowerCase();
  if (isKnownPlanSlug(normalized)) return PLAN_LABELS[normalized];
  return planSlug.charAt(0).toUpperCase() + planSlug.slice(1);
}

// Precio mensual neto (sin IVA) del plan REAL de un tenant, incluye los 3
// legacy — necesario para que reactivar/re-suscribir a un plan viejo (los
// 3 tenants preservados) cobre su monto histórico correcto, no $0 (si el
// plan no se encontrara en una tabla solo-nuevos) ni el precio nuevo (si
// se aliaseara mal). Para los 3 planes vigentes coincide con plans[].price.
export const PLAN_PRICES_ALL: Record<PlanSlug, number> = {
  starter: 14990,
  business: 29990,
  premium: 54990,
  pro: 12990,
  vip: 54990,
  platinum: 149990,
};

// PlanKey: solo los 3 planes vigentes, contratables por un tenant nuevo —
// es el tipo que usan las páginas de marketing/checkout (planes, planes/
// comparar, checkout-premium). Los legacy nunca aparecen ahí: ya no se
// venden, solo se siguen mostrando en el dashboard de quien ya los tiene.
export type PlanKey = "starter" | "business" | "premium";

// Plan NUEVO equivalente más cercano a un slug legacy — solo para UX no
// crítica (selección inicial de tarjeta en /planes al venir desde
// "Ver planes" con un plan legacy, sugerencia de upgrade). Nunca se usa
// para decidir capacidades reales: eso lo hace el backend con el slug
// real preservado. pro≈starter (mismo tier de entrada); vip/platinum
// no tienen equivalente exacto entre los 3 nuevos (ambos eran tiers por
// encima del actual "premium" nuevo) así que apuntan a premium, el más
// cercano disponible.
const LEGACY_TO_NEW_PLAN: Record<"pro" | "vip" | "platinum", PlanKey> = {
  pro: "starter",
  vip: "premium",
  platinum: "premium",
};

export function closestNewPlan(planSlug: string | null | undefined): PlanKey {
  const normalized = String(planSlug || "").toLowerCase();
  if (normalized === "starter" || normalized === "business" || normalized === "premium") {
    return normalized;
  }
  if (normalized === "pro" || normalized === "vip" || normalized === "platinum") {
    return LEGACY_TO_NEW_PLAN[normalized];
  }
  return "business";
}

// Orden/nivel de plan para comparaciones de tipo "¿este tenant tiene al
// menos el plan X?" (gating de features en el dashboard) — único lugar que
// define esto en el frontend. Legacy mapeado al nivel de su equivalente
// nuevo más cercano (ver closestNewPlan) para que el gating de un tenant
// legacy se comporte igual que antes de la migración, sin tocar su label.
export const PLAN_LEVEL: Record<PlanSlug, number> = {
  starter: 1,
  business: 2,
  premium: 3,
  pro: 1,
  vip: 3,
  platinum: 3,
};

export function isPlanAtLeast(
  currentPlan: string | null | undefined,
  requiredPlan: PlanKey
): boolean {
  const current = isKnownPlanSlug(currentPlan) ? currentPlan : "starter";
  return PLAN_LEVEL[current] >= PLAN_LEVEL[requiredPlan];
}

// Sugerencia de "siguiente plan" para upsell (ej. al llegar a un límite de
// recurso). null = no hay siguiente plan que ofrecer razonablemente. Para
// vip/platinum (legacy) es null A PROPÓSITO: sugerir "premium" ahí sería
// en la práctica una REBAJA para esos 2 tenants preservados (sus
// capacidades reales superan las del premium nuevo — ver CLAUDE.md,
// tenants Sonex/Taller Camilo/Santuario Fit). Mejor no upsellear que
// upsellear hacia un plan más chico.
export const NEXT_PLAN_SUGGESTION: Record<PlanSlug, PlanKey | null> = {
  starter: "business",
  business: "premium",
  premium: null,
  pro: "business",
  vip: null,
  platinum: null,
};

export type ExtraKey =
  | "wa_confirmacion"
  | "campanas_wa"
  | "emails_campana"
  | "staff"
  | "sucursal"
  | "group_capacity";

export type BillingCycle = "mensual" | "semestral" | "anual";

// Período de prueba gratis del plan Starter (antes Pro). Única fuente de
// verdad para el texto de marketing (landing, tarjeta de precios,
// comparador de planes) — no hay enforcement de fecha de expiración
// hardcodeado acá, ese lo hace el backend (plan_config.trial_days).
export const TRIAL_DAYS = 30;
export const TRIAL_LABEL = "1 mes";

export type FeatureItem = {
  title: string;
  description?: string;
  highlight?: boolean;
  locked?: boolean;
  trialLocked?: boolean;
};

export type Plan = {
  key: PlanKey;
  name: string;
  price: number;
  ivaLabel: string;
  subtitle: string;
  benefit: string;
  badge?: string;
  includedBranches: number;
  includedStaff: number;
  includedServices: number;
  includedWaConfirmacion: number;
  includedCampanasWa: number;
  includedEmailCampaigns: number;
  includedGroupCapacity: number;
  extras: ExtraKey[];
  summaryTitle: string;
  summaryIntro: string;
  features: FeatureItem[];
  icon: "mail" | "sparkles" | "crown";
  accentClass: string;
  softBgClass: string;
  borderClass: string;
  ringClass: string;
  gradientClass: string;
};

// Valores y restricciones de add-ons por plan: fuente única, deben calzar
// con plan_config/addon_config (Sesión 2, server.js). "extras" = qué
// add-ons puede CONTRATAR ese plan (isAddonAvailableForPlan en backend):
// - wa_confirmacion, staff, sucursal, group_capacity: disponibles en los 3.
// - emails_campana: NO en starter (min_plan business).
// - campanas_wa: NO en starter (min_plan business, desde el ajuste
//   2026-08-21 que revierte la restricción "solo Premium" de la Sesión 3 —
//   Business ahora puede comprarlo como add-on aunque no lo incluya gratis
//   de fábrica, ver includedCampanasWa: 0 más abajo).
export const plans: Plan[] = [
  {
    key: "starter",
    name: "Starter",
    price: 14990,
    ivaLabel: "/mes + IVA",
    subtitle: "Pequeño negocio con agenda profesional",
    benefit:
      "Agenda online, reservas y una base clara para ordenar la operación diaria.",
    badge: `PRUEBA ${TRIAL_LABEL.toUpperCase()}`,
    includedBranches: 1,
    includedStaff: 2,
    includedServices: 999999,
    includedWaConfirmacion: 100,
    includedCampanasWa: 0,
    includedEmailCampaigns: 0,
    includedGroupCapacity: 5,
    extras: ["wa_confirmacion", "staff", "sucursal", "group_capacity"],
    summaryTitle: "Plan Starter",
    summaryIntro:
      "Para comenzar con reservas online, confirmaciones y control operativo.",
    features: [
      { title: "Agenda y reservas online" },
      { title: "Confirmaciones automáticas por email" },
      { title: "Recordatorio por email" },
      { title: "2 profesionales incluidos" },
      { title: "1 sucursal incluida" },
      { title: "Google Calendar sync" },
      { title: "Soporte por email" },
      { title: `Versión de prueba ${TRIAL_LABEL} gratis`, highlight: true },
      { title: "WhatsApp confirmación+recordatorio 100 msgs/mes", trialLocked: true },
    ],
    icon: "mail",
    accentClass: "text-violet-300",
    softBgClass: "bg-violet-500/10",
    borderClass: "border-violet-400/30",
    ringClass: "ring-violet-400/30",
    gradientClass: "from-violet-500/18 via-cyan-500/8 to-transparent",
  },
  {
    key: "business",
    name: "Business",
    price: 29990,
    ivaLabel: "/mes + IVA",
    subtitle: "Más automatización para crecer con orden",
    benefit:
      "Más capacidad, seguimiento y campañas por email para negocios en crecimiento.",
    badge: "Más elegido",
    includedBranches: 2,
    includedStaff: 5,
    includedServices: 999999,
    includedWaConfirmacion: 250,
    includedCampanasWa: 0,
    includedEmailCampaigns: 500,
    includedGroupCapacity: 10,
    extras: ["wa_confirmacion", "campanas_wa", "emails_campana", "staff", "sucursal", "group_capacity"],
    summaryTitle: "Plan Business",
    summaryIntro:
      "Mayor control comercial, más profesionales y seguimiento más consistente.",
    features: [
      { title: "Todo lo de Starter" },
      { title: "5 profesionales incluidos" },
      { title: "2 sucursales incluidas" },
      { title: "Campañas email 500/mes" },
      { title: "WhatsApp confirmación+recordatorio 250 msgs/mes", highlight: true },
      { title: "Reservas grupales hasta 10 personas/slot" },
      { title: "Modo veterinario (fichas clínicas y mascotas)" },
      { title: "Soporte email + chat" },
    ],
    icon: "sparkles",
    accentClass: "text-sky-300",
    softBgClass: "bg-sky-500/10",
    borderClass: "border-sky-400/30",
    ringClass: "ring-sky-400/30",
    gradientClass: "from-sky-500/20 via-cyan-500/10 to-transparent",
  },
  {
    key: "premium",
    name: "Premium",
    price: 54990,
    ivaLabel: "/mes + IVA",
    subtitle: "Máxima capacidad y campañas WhatsApp incluidas",
    benefit:
      "Para negocios que quieren escalar sin límites visuales y llegar a más clientes por WhatsApp.",
    badge: "Máxima capacidad",
    includedBranches: 3,
    includedStaff: 10,
    includedServices: 999999,
    includedWaConfirmacion: 400,
    includedCampanasWa: 50,
    includedEmailCampaigns: 1500,
    includedGroupCapacity: 25,
    extras: ["wa_confirmacion", "campanas_wa", "emails_campana", "staff", "sucursal", "group_capacity"],
    summaryTitle: "Plan Premium",
    summaryIntro:
      "Automatizaciones avanzadas, más profesionales y campañas WhatsApp incluidas.",
    features: [
      { title: "Todo lo de Business" },
      { title: "10 profesionales incluidos" },
      { title: "3 sucursales incluidas" },
      { title: "Campañas email 1.500/mes" },
      { title: "WhatsApp confirmación+recordatorio 400 msgs/mes", highlight: true },
      { title: "Campañas WhatsApp 50 msgs/mes incluidas", highlight: true },
      { title: "Reservas grupales hasta 25 personas/slot" },
      { title: "Estadísticas avanzadas" },
      { title: "Soporte prioritario y personalizado" },
    ],
    icon: "crown",
    accentClass: "text-cyan-200",
    softBgClass: "bg-cyan-400/10",
    borderClass: "border-cyan-300/55",
    ringClass: "ring-cyan-300/45",
    gradientClass: "from-cyan-400/24 via-teal-400/12 to-transparent",
  },
];

export const billingCycleConfig: Record<
  BillingCycle,
  { label: string; months: number; discount: number; badge?: string; note?: string }
> = {
  mensual: { label: "Mensual", months: 1, discount: 1 },
  semestral: {
    label: "Semestral",
    months: 6,
    discount: 0.9,
    badge: "-10%",
    note: "Facturado cada 6 meses",
  },
  anual: {
    label: "Anual",
    months: 12,
    discount: 0.85,
    badge: "Ahorra 15%",
    note: "Facturado anualmente",
  },
};

export function cycleTotalPrice(monthlyPrice: number, cycle: BillingCycle) {
  const config = billingCycleConfig[cycle];
  return Math.round(monthlyPrice * config.months * config.discount);
}

// Planes pagos que requieren tarjeta antes de crear el tenant (flujo
// pago-primero de /signup/*, ver PAID_SIGNUP_PLANS en server.js). Starter
// sigue el onboarding normal sin tarjeta (trial gratis).
export const PAID_PLAN_IDS: string[] = ["business", "premium"];
