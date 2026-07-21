export type PlanKey = "pro" | "premium" | "vip" | "platinum";
export type ExtraKey =
  | "wa_confirmacion"
  | "campanas_wa"
  | "ia_wa"
  | "emails_campana"
  | "staff"
  | "sucursal"
  | "group_capacity";
export type BillingCycle = "mensual" | "semestral" | "anual";

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
  includedIaWa: number;
  includedEmailCampaigns: number;
  includedGroupCapacity: number;
  extras: ExtraKey[];
  summaryTitle: string;
  summaryIntro: string;
  features: FeatureItem[];
  icon: "mail" | "sparkles" | "crown" | "gem";
  accentClass: string;
  softBgClass: string;
  borderClass: string;
  ringClass: string;
  gradientClass: string;
};

export const plans: Plan[] = [
  {
    key: "pro",
    name: "Pro",
    price: 12990,
    ivaLabel: "/mes + IVA",
    subtitle: "Pequeno negocio con agenda profesional",
    benefit:
      "Agenda online, reservas y una base clara para ordenar la operacion diaria.",
    badge: "PRUEBA 14 DÍAS",
    includedBranches: 1,
    includedStaff: 2,
    includedServices: 10,
    includedWaConfirmacion: 100,
    includedIaWa: 0,
    includedEmailCampaigns: 200,
    includedGroupCapacity: 10,
    extras: ["wa_confirmacion", "campanas_wa", "emails_campana"] as ExtraKey[],
    summaryTitle: "Plan Pro",
    summaryIntro:
      "Para comenzar con reservas online, confirmaciones y control operativo.",
    features: [
      { title: "Agenda y reservas online" },
      { title: "Confirmaciones automaticas por email" },
      { title: "Recordatorio por email" },
      { title: "2 profesionales incluidos" },
      { title: "1 sucursal incluida" },
      { title: "Campanas email 200/mes" },
      { title: "Google Calendar sync" },
      { title: "Soporte por email" },
      { title: "Versión de prueba 14 días gratis", highlight: true },
      { title: "Recordatorios WhatsApp 100/mes", trialLocked: true },
    ],
    icon: "mail",
    accentClass: "text-violet-300",
    softBgClass: "bg-violet-500/10",
    borderClass: "border-violet-400/30",
    ringClass: "ring-violet-400/30",
    gradientClass: "from-violet-500/18 via-cyan-500/8 to-transparent",
  },
  {
    key: "premium",
    name: "Premium",
    price: 29990,
    ivaLabel: "/mes + IVA",
    subtitle: "Mas automatizacion para crecer con orden",
    benefit:
      "Mas capacidad, seguimiento y campanas por email para negocios en crecimiento.",
    includedBranches: 2,
    includedStaff: 5,
    includedServices: 25,
    includedWaConfirmacion: 200,
    includedIaWa: 0,
    includedEmailCampaigns: 1000,
    includedGroupCapacity: 25,
    extras: ["wa_confirmacion", "campanas_wa", "emails_campana", "staff", "sucursal", "group_capacity"] as ExtraKey[],
    summaryTitle: "Plan Premium",
    summaryIntro:
      "Mayor control comercial, mas profesionales y seguimiento mas consistente.",
    features: [
      { title: "Todo lo de Pro" },
      { title: "5 profesionales incluidos" },
      { title: "2 sucursales incluidas" },
      { title: "Campanas email 1.000/mes" },
      { title: "WhatsApp confirmación+recordatorio 200 msgs/mes", highlight: true },
      { title: "Reservas grupales hasta 25 personas/slot" },
      { title: "Modo veterinario (fichas clinicas y mascotas)" },
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
    key: "vip",
    name: "VIP",
    price: 54990,
    ivaLabel: "/mes + IVA",
    subtitle: "WhatsApp real, IA y recuperacion de clientes",
    benefit:
      "Automatiza, recupera y responde mas rapido por WhatsApp con una experiencia seria.",
    badge: "Mas elegido",
    includedBranches: 3,
    includedStaff: 10,
    includedServices: 50,
    includedWaConfirmacion: 300,
    includedIaWa: 500,
    includedEmailCampaigns: 2000,
    includedGroupCapacity: 50,
    extras: ["wa_confirmacion", "emails_campana", "campanas_wa", "ia_wa", "staff", "sucursal", "group_capacity"] as ExtraKey[],
    summaryTitle: "Plan VIP",
    summaryIntro:
      "Para activar clientes, responder por WhatsApp y convertir conversaciones en reservas.",
    features: [
      { title: "Todo lo de Premium" },
      { title: "10 profesionales incluidos" },
      { title: "3 sucursales incluidas" },
      { title: "Campanas email 2.000/mes" },
      { title: "WhatsApp confirmación+recordatorio 300 msgs/mes", highlight: true },
      { title: "IA WhatsApp 500 conversaciones/mes", highlight: true },
      { title: "Reservas grupales hasta 50 personas/slot" },
      { title: "Soporte prioritario 24/7" },
    ],
    icon: "crown",
    accentClass: "text-cyan-200",
    softBgClass: "bg-cyan-400/10",
    borderClass: "border-cyan-300/55",
    ringClass: "ring-cyan-300/45",
    gradientClass: "from-cyan-400/24 via-teal-400/12 to-transparent",
  },
  {
    key: "platinum",
    name: "Platinum",
    price: 149990,
    ivaLabel: "/mes + IVA",
    subtitle: "IA avanzada, multi sucursal y SLA premium",
    benefit:
      "Para negocios que quieren escalar sin limites visuales y operar con IA avanzada.",
    badge: "IA avanzada",
    includedBranches: 10,
    includedStaff: 25,
    includedServices: 100,
    includedWaConfirmacion: 500,
    includedIaWa: 1500,
    includedEmailCampaigns: 5000,
    includedGroupCapacity: 100,
    extras: ["wa_confirmacion", "emails_campana", "campanas_wa", "ia_wa", "staff", "sucursal", "group_capacity"] as ExtraKey[],
    summaryTitle: "Plan Platinum",
    summaryIntro:
      "Automatizaciones avanzadas, onboarding premium, SLA y seguimiento inteligente.",
    features: [
      { title: "Todo lo de VIP" },
      { title: "25 profesionales incluidos" },
      { title: "10 sucursales incluidas" },
      { title: "Campanas email 5.000/mes" },
      { title: "WhatsApp confirmación+recordatorio 500 msgs/mes", highlight: true },
      { title: "IA WhatsApp 1.500 conversaciones/mes", highlight: true },
      { title: "Reservas grupales hasta 100 personas/slot" },
      { title: "Automatizaciones avanzadas" },
      { title: "Onboarding personalizado" },
      { title: "Soporte dedicado + SLA" },
    ],
    icon: "gem",
    accentClass: "text-fuchsia-300",
    softBgClass: "bg-fuchsia-500/10",
    borderClass: "border-fuchsia-400/35",
    ringClass: "ring-fuchsia-400/30",
    gradientClass: "from-fuchsia-500/20 via-violet-500/10 to-transparent",
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
// pago-primero de /signup/*). Pro sigue el onboarding normal sin tarjeta.
export const PAID_PLAN_IDS: string[] = ["premium", "vip", "platinum"];
