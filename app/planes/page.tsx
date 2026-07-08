"use client";

import Link from "next/link";
import { Suspense, useEffect, useMemo, useState, type ReactNode } from "react";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { apiFetch } from "@/lib/api";
import {
  BarChart3,
  Bot,
  CalendarDays,
  Check,
  ChevronUp,
  Crown,
  Gem,
  Lock,
  Mail,
  Megaphone,
  MessageCircle,
  Minus,
  ShieldCheck,
  ShoppingCart,
  Sparkles,
  Store,
  Users,
  UsersRound,
  Zap,
} from "lucide-react";

type PlanKey = "pro" | "premium" | "vip" | "platinum";
type ExtraKey =
  | "wa_confirmacion"
  | "campanas_wa"
  | "ia_wa"
  | "emails_campana"
  | "staff"
  | "sucursal"
  | "group_capacity";
type BillingCycle = "mensual" | "semestral" | "anual";

type FeatureItem = {
  title: string;
  description?: string;
  highlight?: boolean;
  locked?: boolean;
  trialLocked?: boolean;
};

type Plan = {
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

type BillingPreviewResponse = {
  ok?: boolean;
  change_type?: "same_plan" | "upgrade" | "downgrade";
  current_plan?: string;
  new_plan?: string;
  amount_today?: number;
  credit?: number;
  charge?: number;
  days_remaining?: number;
  billing_cycle_end?: string;
  scheduled_change_at?: string;
  message?: string;
  error?: string;
};

type ExtraConfig = {
  title: string;
  short: string;
  detail: string;
  unitPrice: number;
  price_pack2: number;
  price_pack3: number;
  unitLabel: string;
  usageLabel: string;
  availableFrom: string;
  tooltip: string;
  icon: ReactNode;
  glow: string;
  iconClass: string;
};

const BACKEND_URL = "https://orbyx-backend.onrender.com";

const plans: Plan[] = [
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

const extraConfig: Record<ExtraKey, ExtraConfig> = {
  wa_confirmacion: {
    title: "WhatsApp confirmación+recordatorio",
    short: "50 msgs WhatsApp adicionales por mes.",
    detail: "por 50 mensajes",
    unitPrice: 2990,
    price_pack2: 2691,
    price_pack3: 2542,
    unitLabel: "pack",
    usageLabel: "50 msgs WhatsApp adicionales / mes",
    availableFrom: "Pro, Premium, VIP y Platinum",
    tooltip: "Envía automáticamente un WhatsApp al cliente cuando agenda y otro como recordatorio antes de su cita. 50 mensajes adicionales por pack.",
    icon: <MessageCircle className="h-5 w-5" />,
    glow: "from-emerald-500/20 to-emerald-500/5",
    iconClass: "bg-emerald-500/18 text-emerald-200",
  },
  campanas_wa: {
    title: "Campañas WhatsApp",
    short: "50 msgs campaña marketing adicionales.",
    detail: "por 50 mensajes",
    unitPrice: 6990,
    price_pack2: 6291,
    price_pack3: 5942,
    unitLabel: "pack",
    usageLabel: "50 msgs campaña marketing / mes",
    availableFrom: "VIP y Platinum",
    tooltip: "Envía mensajes masivos de marketing a tus clientes por WhatsApp. Ideal para promociones, fidelización y recuperación de clientes inactivos. 50 mensajes por pack.",
    icon: <Megaphone className="h-5 w-5" />,
    glow: "from-amber-500/20 to-amber-500/5",
    iconClass: "bg-amber-500/18 text-amber-200",
  },
  ia_wa: {
    title: "IA WhatsApp",
    short: "500 conversaciones IA adicionales.",
    detail: "por 500 conversaciones",
    unitPrice: 14990,
    price_pack2: 13491,
    price_pack3: 12742,
    unitLabel: "pack",
    usageLabel: "500 conversaciones IA adicionales / mes",
    availableFrom: "VIP y Platinum",
    tooltip: "Un agente de IA responde automáticamente por WhatsApp, agenda citas y resuelve consultas sin intervención manual. 500 conversaciones por pack.",
    icon: <Bot className="h-5 w-5" />,
    glow: "from-fuchsia-500/20 to-fuchsia-500/5",
    iconClass: "bg-fuchsia-500/18 text-fuchsia-200",
  },
  emails_campana: {
    title: "Pack emails campaña",
    short: "2.000 correos campaña adicionales.",
    detail: "por 2.000 correos",
    unitPrice: 1990,
    price_pack2: 1990,
    price_pack3: 1990,
    unitLabel: "pack",
    usageLabel: "2.000 correos campaña adicionales / mes",
    availableFrom: "Pro, Premium, VIP y Platinum",
    tooltip: "Correos de marketing adicionales para campañas a tus clientes. 2.000 correos por pack.",
    icon: <Mail className="h-5 w-5" />,
    glow: "from-sky-500/20 to-sky-500/5",
    iconClass: "bg-sky-500/18 text-sky-200",
  },
  staff: {
    title: "+ 1 Profesional",
    short: "Agrega mas miembros a tu equipo.",
    detail: "por profesional",
    unitPrice: 5990,
    price_pack2: 5990,
    price_pack3: 5990,
    unitLabel: "profesional",
    usageLabel: "1 staff adicional sobre el limite del plan",
    availableFrom: "Premium, VIP y Platinum",
    tooltip: "Agrega un profesional adicional sobre el límite de tu plan. Cada profesional tiene su propia agenda y disponibilidad.",
    icon: <Users className="h-5 w-5" />,
    glow: "from-violet-500/20 to-violet-500/5",
    iconClass: "bg-violet-500/18 text-violet-200",
  },
  sucursal: {
    title: "+ 1 Sucursal",
    short: "Gestiona mas sedes desde tu cuenta.",
    detail: "por sucursal",
    unitPrice: 9990,
    price_pack2: 9990,
    price_pack3: 9990,
    unitLabel: "sucursal",
    usageLabel: "1 sucursal adicional sobre el limite del plan",
    availableFrom: "Premium, VIP y Platinum",
    tooltip: "Agrega una sucursal adicional sobre el límite de tu plan. Gestiona múltiples locales desde una sola cuenta.",
    icon: <Store className="h-5 w-5" />,
    glow: "from-blue-500/20 to-blue-500/5",
    iconClass: "bg-blue-500/18 text-blue-200",
  },
  group_capacity: {
    title: "+ Cupos grupales",
    short: "Mas cupos por slot grupal.",
    detail: "por 25 cupos",
    unitPrice: 4900,
    price_pack2: 4900,
    price_pack3: 4900,
    unitLabel: "pack",
    usageLabel: "25 cupos adicionales por slot grupal",
    availableFrom: "Premium, VIP y Platinum",
    tooltip: "Aumenta la capacidad máxima de tus clases o eventos grupales en 25 cupos por slot adicional.",
    icon: <UsersRound className="h-5 w-5" />,
    glow: "from-teal-500/20 to-teal-500/5",
    iconClass: "bg-teal-500/18 text-teal-200",
  },
};

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

function discountBadge(config: ExtraConfig, currentCount: number): string | null {
  if (currentCount >= 3 && config.price_pack3 < config.unitPrice) return "−15%";
  if (currentCount === 2 && config.price_pack2 < config.unitPrice) return "−10%";
  return null;
}

const WA_CONFIRMACION_PACK_SIZE = 50;
const CAMPANAS_WA_PACK_SIZE = 50;
const IA_WA_PACK_SIZE = 500;
const EMAILS_CAMPANA_PACK_SIZE = 2000;
const GROUP_CAPACITY_PACK_SIZE = 25;

const billingCycleConfig: Record<
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

function cycleMonthlyPrice(monthlyPrice: number, cycle: BillingCycle) {
  return Math.round(monthlyPrice * billingCycleConfig[cycle].discount);
}

function cycleTotalPrice(monthlyPrice: number, cycle: BillingCycle) {
  const config = billingCycleConfig[cycle];
  return Math.round(monthlyPrice * config.months * config.discount);
}

function formatCLP(value: number) {
  return `$${value.toLocaleString("es-CL")}`;
}

function formatDate(dateString?: string | null) {
  if (!dateString) return "-";

  const date = new Date(dateString);

  if (Number.isNaN(date.getTime())) return "-";

  return date.toLocaleDateString("es-CL", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function formatRemainingDays(value?: number | null) {
  if (value == null || Number.isNaN(Number(value))) return "-";
  return `${Math.max(0, Math.round(Number(value)))} dias`;
}

function normalizePlanFromUrl(rawValue: string | null): PlanKey {
  const raw = String(rawValue || "vip").toLowerCase();

  if (raw === "starter") return "pro";
  if (raw === "pro") return "pro";
  if (raw === "premium") return "premium";
  if (raw === "vip") return "vip";
  if (raw === "platinum") return "platinum";

  return "vip";
}

function planNameFromKey(planKey?: string | null) {
  if (!planKey) return "-";
  const found = plans.find((plan) => plan.key === planKey);
  return found?.name || String(planKey);
}

function PlanIcon({ type }: { type: Plan["icon"] }) {
  if (type === "mail") return <Mail className="h-5 w-5" />;
  if (type === "sparkles") return <Sparkles className="h-5 w-5" />;
  if (type === "crown") return <Crown className="h-5 w-5" />;
  return <Gem className="h-5 w-5" />;
}

function SummaryLine({
  label,
  value,
  strong = false,
}: {
  label: string;
  value: string;
  strong?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span
        className={
          strong
            ? "text-sm font-semibold text-white"
            : "text-sm text-slate-300"
        }
      >
        {label}
      </span>
      <span
        className={
          strong
            ? "text-right text-xl font-semibold text-cyan-300"
            : "text-right text-sm font-semibold text-white"
        }
      >
        {value}
      </span>
    </div>
  );
}

function PlanesPageContent() {
  const searchParams = useSearchParams();

  const tenantId = searchParams.get("tenant_id") || "";
  const slug = searchParams.get("slug") || "";
  const from = searchParams.get("from") || "";
  const currentPlanParam = searchParams.get("current_plan");
  const isTrial = searchParams.get("is_trial") === "true";

  const hasBillingContext = Boolean(tenantId && currentPlanParam);

  const initialPlan = useMemo<PlanKey | null>(() => {
    if (!hasBillingContext) return null;
    return normalizePlanFromUrl(currentPlanParam);
  }, [hasBillingContext, currentPlanParam]);

  const [selectedPlanKey, setSelectedPlanKey] = useState<PlanKey>(
    hasBillingContext && initialPlan ? initialPlan : "vip"
  );

  const [staffExtras, setStaffExtras] = useState(0);
  const [sucursalExtras, setSucursalExtras] = useState(0);
  const [waConfirmacionExtras, setWaConfirmacionExtras] = useState(0);
  const [campanaWaExtras, setCampanaWaExtras] = useState(0);
  const [iaWaExtras, setIaWaExtras] = useState(0);
  const [emailsCampanaExtras, setEmailsCampanaExtras] = useState(0);
  const [groupCapacityExtras, setGroupCapacityExtras] = useState(0);

  const [billingCycle, setBillingCycle] = useState<BillingCycle>("mensual");
  const [mobileSummaryOpen, setMobileSummaryOpen] = useState(false);

  const [preview, setPreview] = useState<BillingPreviewResponse | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState("");
  const [applying, setApplying] = useState(false);
  const [applyError, setApplyError] = useState("");
  const [applyOk, setApplyOk] = useState("");

  const [downgradeModalOpen, setDowngradeModalOpen] = useState(false);
  const [downgradeChecking, setDowngradeChecking] = useState(false);
  const [downgradeBlockError, setDowngradeBlockError] = useState("");

  // Add-ons reales del backend (solo con tenant_id; la página pública usa estado local)
  const [serverAddonAvailability, setServerAddonAvailability] = useState<Record<
    string,
    boolean
  > | null>(null);
  const [addonsLoading, setAddonsLoading] = useState(false);
  const [addonBusy, setAddonBusy] = useState<ExtraKey | null>(null);
  const [addonError, setAddonError] = useState("");

  useEffect(() => {
    if (hasBillingContext && initialPlan) {
      setSelectedPlanKey(initialPlan);
    }
  }, [hasBillingContext, initialPlan]);

  const selectedPlan =
    plans.find((plan) => plan.key === selectedPlanKey) || plans[2];

  const isCurrentPlan =
    hasBillingContext && initialPlan ? selectedPlanKey === initialPlan : false;

  const supportsStaffExtra = selectedPlan.extras.includes("staff");
  const supportsSucursalExtra = selectedPlan.extras.includes("sucursal");
  const supportsWaConfirmacionExtra = selectedPlan.extras.includes("wa_confirmacion");
  const supportsCampanaWaExtra = selectedPlan.extras.includes("campanas_wa");
  const supportsIaWaExtra = selectedPlan.extras.includes("ia_wa");
  const supportsEmailsCampanaExtra = selectedPlan.extras.includes("emails_campana");
  const supportsGroupCapacityExtra = selectedPlan.extras.includes("group_capacity");

  const isProSelected = selectedPlan.key === "pro";

  const extrasSubtotal = useMemo(() => {
    let total = 0;
    if (supportsStaffExtra) total += tieredAddonCost(extraConfig.staff, staffExtras);
    if (supportsSucursalExtra) total += tieredAddonCost(extraConfig.sucursal, sucursalExtras);
    if (supportsWaConfirmacionExtra) total += tieredAddonCost(extraConfig.wa_confirmacion, waConfirmacionExtras);
    if (supportsCampanaWaExtra) total += tieredAddonCost(extraConfig.campanas_wa, campanaWaExtras);
    if (supportsIaWaExtra) total += tieredAddonCost(extraConfig.ia_wa, iaWaExtras);
    if (supportsEmailsCampanaExtra) total += tieredAddonCost(extraConfig.emails_campana, emailsCampanaExtras);
    if (supportsGroupCapacityExtra) total += tieredAddonCost(extraConfig.group_capacity, groupCapacityExtras);
    return total;
  }, [
    staffExtras,
    sucursalExtras,
    waConfirmacionExtras,
    campanaWaExtras,
    iaWaExtras,
    emailsCampanaExtras,
    groupCapacityExtras,
    supportsStaffExtra,
    supportsSucursalExtra,
    supportsWaConfirmacionExtra,
    supportsCampanaWaExtra,
    supportsIaWaExtra,
    supportsEmailsCampanaExtra,
    supportsGroupCapacityExtra,
  ]);

  const previewAmountToday = Number(preview?.amount_today || 0);
  const payTodaySubtotal = previewAmountToday + extrasSubtotal;
  const payTodayIva = Math.round(payTodaySubtotal * 0.19);
  const payTodayTotal = payTodaySubtotal + payTodayIva;

  const currentStaffTotal = selectedPlan.includedStaff + staffExtras;
  const currentBranchTotal = selectedPlan.includedBranches + sucursalExtras;
  const currentWaConfirmacionTotal =
    selectedPlan.includedWaConfirmacion + waConfirmacionExtras * WA_CONFIRMACION_PACK_SIZE;
  const currentCampanaWaTotal = campanaWaExtras * CAMPANAS_WA_PACK_SIZE;
  const currentIaWaTotal =
    selectedPlan.includedIaWa + iaWaExtras * IA_WA_PACK_SIZE;
  const currentEmailsCampanaTotal =
    selectedPlan.includedEmailCampaigns + emailsCampanaExtras * EMAILS_CAMPANA_PACK_SIZE;

  const extraItems = useMemo(() => {
    const items: { key: ExtraKey; label: string; amount: number; count: number }[] = [];

    if (supportsWaConfirmacionExtra && waConfirmacionExtras > 0) {
      items.push({ key: "wa_confirmacion", label: `WhatsApp confirmación x${waConfirmacionExtras}`, amount: tieredAddonCost(extraConfig.wa_confirmacion, waConfirmacionExtras), count: waConfirmacionExtras });
    }
    if (supportsCampanaWaExtra && campanaWaExtras > 0) {
      items.push({ key: "campanas_wa", label: `Campañas WhatsApp x${campanaWaExtras}`, amount: tieredAddonCost(extraConfig.campanas_wa, campanaWaExtras), count: campanaWaExtras });
    }
    if (supportsIaWaExtra && iaWaExtras > 0) {
      items.push({ key: "ia_wa", label: `IA WhatsApp x${iaWaExtras}`, amount: tieredAddonCost(extraConfig.ia_wa, iaWaExtras), count: iaWaExtras });
    }
    if (supportsEmailsCampanaExtra && emailsCampanaExtras > 0) {
      items.push({ key: "emails_campana", label: `Emails campaña x${emailsCampanaExtras}`, amount: tieredAddonCost(extraConfig.emails_campana, emailsCampanaExtras), count: emailsCampanaExtras });
    }
    if (supportsStaffExtra && staffExtras > 0) {
      items.push({ key: "staff", label: `+ Profesionales x${staffExtras}`, amount: tieredAddonCost(extraConfig.staff, staffExtras), count: staffExtras });
    }
    if (supportsSucursalExtra && sucursalExtras > 0) {
      items.push({ key: "sucursal", label: `+ Sucursales x${sucursalExtras}`, amount: tieredAddonCost(extraConfig.sucursal, sucursalExtras), count: sucursalExtras });
    }
    if (supportsGroupCapacityExtra && groupCapacityExtras > 0) {
      items.push({ key: "group_capacity", label: `+ Cupos grupales x${groupCapacityExtras}`, amount: tieredAddonCost(extraConfig.group_capacity, groupCapacityExtras), count: groupCapacityExtras });
    }

    return items;
  }, [
    staffExtras,
    sucursalExtras,
    waConfirmacionExtras,
    campanaWaExtras,
    iaWaExtras,
    emailsCampanaExtras,
    groupCapacityExtras,
    supportsStaffExtra,
    supportsSucursalExtra,
    supportsWaConfirmacionExtra,
    supportsCampanaWaExtra,
    supportsIaWaExtra,
    supportsEmailsCampanaExtra,
    supportsGroupCapacityExtra,
  ]);

  useEffect(() => {
    async function loadPreview() {
      if (!hasBillingContext || !initialPlan) {
        setPreview(null);
        setPreviewError("");
        setPreviewLoading(false);
        return;
      }

      try {
        setPreviewLoading(true);
        setPreviewError("");
        setPreview(null);

        const url = `${BACKEND_URL}/billing/preview-change?tenant_id=${encodeURIComponent(
          tenantId
        )}&new_plan=${encodeURIComponent(selectedPlanKey)}`;

        const res = await apiFetch(url);
        const data: BillingPreviewResponse = await res.json();

        if (!res.ok) {
          throw new Error(data?.error || "No se pudo calcular el cambio de plan");
        }

        setPreview(data);
      } catch (error: unknown) {
        setPreviewError(
          error instanceof Error
            ? error.message
            : "No se pudo calcular el cambio de plan"
        );
      } finally {
        setPreviewLoading(false);
      }
    }

    loadPreview();
  }, [hasBillingContext, initialPlan, tenantId, selectedPlanKey]);

  function setExtraCount(extraKey: ExtraKey, value: number) {
    if (extraKey === "staff") setStaffExtras(value);
    else if (extraKey === "sucursal") setSucursalExtras(value);
    else if (extraKey === "wa_confirmacion") setWaConfirmacionExtras(value);
    else if (extraKey === "campanas_wa") setCampanaWaExtras(value);
    else if (extraKey === "ia_wa") setIaWaExtras(value);
    else if (extraKey === "emails_campana") setEmailsCampanaExtras(value);
    else setGroupCapacityExtras(value);
  }

  // Carga catálogo (flags available según el plan real del tenant) y
  // add-ons activos; inicializa los contadores del panel con lo contratado.
  async function refreshAddons() {
    if (!tenantId) return;

    try {
      setAddonsLoading(true);
      setAddonError("");

      const res = await apiFetch(
        `${BACKEND_URL}/billing/addons?tenant_id=${encodeURIComponent(
          tenantId
        )}&plan=${encodeURIComponent(selectedPlanKey)}`
      );
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "No se pudieron cargar los add-ons");
      }

      const availability: Record<string, boolean> = {};
      (data?.addons || []).forEach(
        (addon: { key?: string; available?: boolean }) => {
          if (addon?.key) availability[addon.key] = addon.available !== false;
        }
      );

      const counts: Record<string, number> = {};
      (data?.active_addons || []).forEach(
        (row: { addon_key?: string; quantity?: number }) => {
          if (row?.addon_key) counts[row.addon_key] = Number(row.quantity) || 0;
        }
      );

      setServerAddonAvailability(availability);
      setStaffExtras(counts.staff || 0);
      setSucursalExtras(counts.sucursal || 0);
      setWaConfirmacionExtras(counts.wa_confirmacion || 0);
      setCampanaWaExtras(counts.campanas_wa || 0);
      setIaWaExtras(counts.ia_wa || 0);
      setEmailsCampanaExtras(counts.emails_campana || 0);
      setGroupCapacityExtras(counts.group_capacity || 0);
    } catch (error: unknown) {
      setAddonError(
        error instanceof Error
          ? error.message
          : "No se pudieron cargar los add-ons"
      );
    } finally {
      setAddonsLoading(false);
    }
  }

  useEffect(() => {
    refreshAddons();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenantId, selectedPlanKey]);

  function handleSelectPlan(planKey: PlanKey) {
    setSelectedPlanKey(planKey);
    setStaffExtras(0);
    setSucursalExtras(0);
    setWaConfirmacionExtras(0);
    setCampanaWaExtras(0);
    setIaWaExtras(0);
    setEmailsCampanaExtras(0);
    setGroupCapacityExtras(0);
    setApplyError("");
    setApplyOk("");
    setAddonError("");
    setDowngradeBlockError("");
    setDowngradeModalOpen(false);
  }

  // Con tenant_id los botones +/− contratan/cancelan contra el backend.
  // Sin tenant_id (página pública) solo actualizan estado local, como antes.
  async function increaseExtra(extraKey: ExtraKey) {
    if (!selectedPlan.extras.includes(extraKey)) return;

    if (!tenantId) {
      setExtraCount(extraKey, extraValue(extraKey) + 1);
      return;
    }

    if (addonBusy) return;

    setAddonBusy(extraKey);
    setAddonError("");

    try {
      const res = await apiFetch(`${BACKEND_URL}/billing/addons/activate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenant_id: tenantId,
          addon_key: extraKey,
          quantity: 1,
          billing_cycle: billingCycle,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        if (res.status === 403 && data?.upgrade_required) {
          throw new Error("Este add-on requiere un plan superior");
        }
        throw new Error(data?.error || "No se pudo activar el add-on");
      }

      const newQty = Number(data?.addon?.quantity) || extraValue(extraKey) + 1;
      setExtraCount(extraKey, newQty);
    } catch (error: unknown) {
      setAddonError(
        error instanceof Error ? error.message : "No se pudo activar el add-on"
      );
    } finally {
      setAddonBusy(null);
    }
  }

  async function decreaseExtra(extraKey: ExtraKey) {
    if (!selectedPlan.extras.includes(extraKey)) return;

    const current = extraValue(extraKey);
    if (current === 0) return;

    if (!tenantId) {
      setExtraCount(extraKey, current - 1);
      return;
    }

    if (addonBusy) return;

    setAddonBusy(extraKey);
    setAddonError("");

    const newQty = current - 1;

    try {
      const cancelRes = await apiFetch(`${BACKEND_URL}/billing/addons/cancel`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tenant_id: tenantId, addon_key: extraKey }),
      });
      const cancelData = await cancelRes.json();

      if (!cancelRes.ok && cancelRes.status !== 404) {
        throw new Error(cancelData?.error || "No se pudo cancelar el add-on");
      }

      if (newQty > 0) {
        // El backend no tiene decremento atómico: se cancela el addon y se
        // reactiva con la cantidad restante.
        const reactivateRes = await apiFetch(
          `${BACKEND_URL}/billing/addons/activate`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              tenant_id: tenantId,
              addon_key: extraKey,
              quantity: newQty,
              billing_cycle: billingCycle,
            }),
          }
        );
        const reactivateData = await reactivateRes.json();

        if (!reactivateRes.ok) {
          // Re-sincronizar con el backend antes de reportar el error
          await refreshAddons();
          throw new Error(
            reactivateData?.error ||
              "No se pudo actualizar la cantidad del add-on"
          );
        }
      }

      setExtraCount(extraKey, newQty);
    } catch (error: unknown) {
      setAddonError(
        error instanceof Error ? error.message : "No se pudo cancelar el add-on"
      );
    } finally {
      setAddonBusy(null);
    }
  }

  // Compara plan actual vs destino para el modal de downgrade:
  // features que se pierden y add-ons que se cancelan segun las reglas del catalogo.
  function getDowngradeDetails(current: Plan, target: Plan) {
    const featuresLost: string[] = [];

    if (target.includedStaff < current.includedStaff) {
      featuresLost.push(
        `Profesionales incluidos: ${current.includedStaff} → ${target.includedStaff}`
      );
    }
    if (target.includedBranches < current.includedBranches) {
      featuresLost.push(
        `Sucursales incluidas: ${current.includedBranches} → ${target.includedBranches}`
      );
    }
    if (target.includedEmailCampaigns < current.includedEmailCampaigns) {
      featuresLost.push(
        `Campanas email: ${current.includedEmailCampaigns.toLocaleString("es-CL")}/mes → ${target.includedEmailCampaigns.toLocaleString("es-CL")}/mes`
      );
    }
    if (
      current.includedWaConfirmacion > 0 &&
      target.includedWaConfirmacion === 0
    ) {
      featuresLost.push("WhatsApp confirmación+recordatorio: ya no incluidos");
    } else if (
      target.includedWaConfirmacion < current.includedWaConfirmacion
    ) {
      featuresLost.push(
        `WhatsApp confirmación+recordatorio: ${current.includedWaConfirmacion} → ${target.includedWaConfirmacion} msgs/mes`
      );
    }
    if (current.includedIaWa > 0 && target.includedIaWa === 0) {
      featuresLost.push("IA WhatsApp: ya no incluida");
    } else if (target.includedIaWa < current.includedIaWa) {
      featuresLost.push(
        `IA WhatsApp: ${current.includedIaWa.toLocaleString("es-CL")} → ${target.includedIaWa} conversaciones/mes`
      );
    }
    if (current.key === "platinum") {
      featuresLost.push(
        "Automatizaciones avanzadas",
        "Onboarding personalizado",
        "Soporte dedicado + SLA"
      );
    }
    if (target.key === "pro") {
      featuresLost.push(
        "Modo veterinario (fichas clinicas y mascotas)",
        "Reservas grupales (fitness, clases, talleres)"
      );
    }

    const addonsCanceled: string[] = [];
    if (target.key === "pro") {
      addonsCanceled.push(
        "Todos los add-ons activos (el plan Pro no admite add-ons)"
      );
    } else {
      current.extras.forEach((extraKey) => {
        if (!target.extras.includes(extraKey)) {
          addonsCanceled.push(extraConfig[extraKey].title);
        }
      });
    }

    return { featuresLost, addonsCanceled };
  }

  // Cuenta staff y sucursales activos del tenant para bloquear downgrades
  // que dejarian la cuenta sobre el limite del plan destino.
  async function validateDowngradeLimits(target: Plan) {
    const branchesRes = await apiFetch(
      `${BACKEND_URL}/branches?tenant_id=${encodeURIComponent(tenantId)}`
    );
    const branchesData = await branchesRes.json();

    if (!branchesRes.ok) {
      throw new Error(branchesData?.error || "No se pudo validar sucursales");
    }

    const branches: { id: string; is_active?: boolean }[] =
      branchesData?.branches || [];
    const activeBranches = branches.filter(
      (branch) => branch.is_active !== false
    );

    let activeStaff = 0;
    for (const branch of activeBranches) {
      const staffRes = await apiFetch(
        `${BACKEND_URL}/staff?tenant_id=${encodeURIComponent(
          tenantId
        )}&branch_id=${encodeURIComponent(branch.id)}&active=true`
      );
      const staffData = await staffRes.json();

      if (!staffRes.ok) {
        throw new Error(staffData?.error || "No se pudo validar profesionales");
      }

      activeStaff += Number(staffData?.total || 0);
    }

    if (activeStaff > target.includedStaff) {
      return `Tienes ${activeStaff} profesionales activos. El plan ${target.name} incluye solo ${target.includedStaff}. Desactiva profesionales antes de continuar.`;
    }

    if (activeBranches.length > target.includedBranches) {
      return `Tienes ${activeBranches.length} sucursales activas. El plan ${target.name} incluye solo ${target.includedBranches}. Desactiva sucursales antes de continuar.`;
    }

    return "";
  }

  async function handleApplyPlanChange() {
    if (previewType === "downgrade") {
      setApplyError("");
      setApplyOk("");
      setDowngradeBlockError("");
      setDowngradeChecking(true);

      try {
        const blockMessage = await validateDowngradeLimits(selectedPlan);

        if (blockMessage) {
          setDowngradeBlockError(blockMessage);
          return;
        }

        setDowngradeModalOpen(true);
      } catch (error: unknown) {
        setDowngradeBlockError(
          error instanceof Error
            ? error.message
            : "No se pudieron validar los limites del plan. Intenta de nuevo."
        );
      } finally {
        setDowngradeChecking(false);
      }

      return;
    }

    await applyPlanChange();
  }

  async function applyPlanChange() {
    try {
      setApplying(true);
      setApplyError("");
      setApplyOk("");

      if (!tenantId) {
        throw new Error("Falta tenant_id para aplicar el cambio de plan");
      }

      const res = await apiFetch(`${BACKEND_URL}/billing/change-plan`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          tenant_id: tenantId,
          new_plan: selectedPlanKey,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "No se pudo aplicar el cambio de plan");
      }

      if (data?.change_type === "upgrade") {
        setApplyOk(
          `Upgrade aplicado. Pagar hoy: ${formatCLP(Number(data?.amount_today || 0))}.`
        );
        // El plan real cambió: refrescar disponibilidad y add-ons activos
        await refreshAddons();
      } else if (data?.change_type === "downgrade") {
        const dateText = formatDate(data?.tenant?.scheduled_change_at);
        setApplyOk(`Downgrade programado correctamente para el ${dateText}.`);
      } else {
        setApplyOk("Cambio aplicado correctamente.");
      }
    } catch (error: unknown) {
      setApplyError(
        error instanceof Error
          ? error.message
          : "No se pudo aplicar el cambio de plan"
      );
    } finally {
      setApplying(false);
    }
  }

  const previewType = hasBillingContext
    ? preview?.change_type || (isCurrentPlan ? "same_plan" : "upgrade")
    : null;

  const billingEndLabel = formatDate(
    preview?.scheduled_change_at || preview?.billing_cycle_end
  );

  const remainingDaysLabel = formatRemainingDays(preview?.days_remaining);

  const ctaLabel =
    !hasBillingContext
      ? isProSelected
        ? "Probar gratis 14 dias"
        : "Comenzar ahora"
      : previewType === "same_plan"
      ? "Mantener este plan"
      : previewType === "downgrade"
      ? "Programar downgrade"
      : "Cambiar ahora";

  const publicCtaHref = isProSelected
    ? "/signup?plan=pro"
    : `/signup?plan=${selectedPlanKey}`;

  const showTenantWarning = !tenantId && Boolean(from || slug);

  // Precio mensual equivalente segun ciclo (mensual / semestral -10% / anual -15%)
  const selectedPlanMonthly = cycleMonthlyPrice(selectedPlan.price, billingCycle);
  const cycleMonths = billingCycleConfig[billingCycle].months;

  const publicPlanIva = Math.round(selectedPlanMonthly * 0.19);
  const publicExtrasIva = Math.round(extrasSubtotal * 0.19);
  const publicReferenceTotal =
    selectedPlanMonthly + publicPlanIva + extrasSubtotal + publicExtrasIva;

  const summaryBaseLabel = "Plan base";

  const summaryBaseAmount = hasBillingContext
    ? previewType === "downgrade"
      ? "$0"
      : formatCLP(previewAmountToday)
    : formatCLP(selectedPlanMonthly);

  const summarySubtotal = hasBillingContext
    ? payTodaySubtotal
    : selectedPlanMonthly + extrasSubtotal;
  const summaryIva = hasBillingContext ? payTodayIva : Math.round(summarySubtotal * 0.19);
  const summaryTotal = hasBillingContext ? payTodayTotal : publicReferenceTotal;

  // Total del ciclo completo (solo modo publico, ciclos no mensuales)
  const cycleSubtotal =
    cycleTotalPrice(selectedPlan.price, billingCycle) + extrasSubtotal * cycleMonths;
  const cycleTotalWithIva = cycleSubtotal + Math.round(cycleSubtotal * 0.19);

  const availableAddons: ExtraKey[] = ["wa_confirmacion", "campanas_wa", "ia_wa", "emails_campana", "staff", "sucursal", "group_capacity"];
  const selectedAddonsCount = extraItems.reduce((total, item) => total + item.count, 0);
  const addableAddons = availableAddons.filter(
    (extraKey) => extraSupported(extraKey) && extraValue(extraKey) === 0
  );

  function extraValue(extraKey: ExtraKey) {
    if (extraKey === "staff") return staffExtras;
    if (extraKey === "sucursal") return sucursalExtras;
    if (extraKey === "wa_confirmacion") return waConfirmacionExtras;
    if (extraKey === "campanas_wa") return campanaWaExtras;
    if (extraKey === "ia_wa") return iaWaExtras;
    if (extraKey === "emails_campana") return emailsCampanaExtras;
    return groupCapacityExtras;
  }

  function extraSupported(extraKey: ExtraKey) {
    const supportedBySelectedPlan = selectedPlan.extras.includes(extraKey);

    // WA no disponible durante trial Pro
    if (isTrial && selectedPlanKey === "pro" && extraKey === "wa_confirmacion") {
      return false;
    }

    // Con tenant_id manda además la disponibilidad real (plan vigente del tenant)
    if (tenantId && serverAddonAvailability) {
      return (
        supportedBySelectedPlan &&
        serverAddonAvailability[extraKey] !== false
      );
    }

    return supportedBySelectedPlan;
  }

  function extraUnitLabel(extraKey: ExtraKey, count: number) {
    if (extraKey === "wa_confirmacion" || extraKey === "campanas_wa" || extraKey === "ia_wa" || extraKey === "emails_campana" || extraKey === "group_capacity") {
      return count === 1 ? "pack" : "packs";
    }
    return count === 1 ? "unidad" : "unidades";
  }

  return (
    <main className="min-h-screen overflow-hidden bg-[#020814] text-white">
      <style jsx>{`
        @keyframes borderTravel {
          0% {
            left: 20px;
            top: 0;
            opacity: 0.95;
          }
          24% {
            left: calc(100% - 20px);
            top: 0;
            opacity: 1;
          }
          25% {
            left: calc(100% - 8px);
            top: 8px;
            opacity: 1;
          }
          49% {
            left: calc(100% - 8px);
            top: calc(100% - 20px);
            opacity: 0.95;
          }
          50% {
            left: calc(100% - 20px);
            top: calc(100% - 8px);
            opacity: 1;
          }
          74% {
            left: 20px;
            top: calc(100% - 8px);
            opacity: 0.95;
          }
          75% {
            left: 8px;
            top: calc(100% - 20px);
            opacity: 1;
          }
          100% {
            left: 8px;
            top: 20px;
            opacity: 0.95;
          }
        }

        @keyframes activeGlowPulse {
          0%,
          100% {
            opacity: 0.45;
          }
          50% {
            opacity: 0.85;
          }
        }

        .selected-plan-neon::before {
          content: "";
          position: absolute;
          inset: 0;
          border-radius: 22px;
          pointer-events: none;
          background:
            linear-gradient(135deg, rgba(34, 211, 238, 1), rgba(168, 85, 247, 0.98) 45%, rgba(34, 211, 238, 0.95)),
            radial-gradient(circle at 16% 0%, rgba(255,255,255,0.9), transparent 12%),
            radial-gradient(circle at 100% 92%, rgba(34,211,238,0.9), transparent 16%);
          box-shadow:
            inset 0 0 0 1px rgba(255, 255, 255, 0.18),
            0 0 18px rgba(34, 211, 238, 0.46),
            0 0 34px rgba(168, 85, 247, 0.28);
          opacity: 0.95;
          z-index: 0;
          animation: activeGlowPulse 3.4s ease-in-out infinite;
        }

        .selected-plan-neon::after {
          content: "";
          position: absolute;
          left: 20px;
          top: 0;
          width: 10px;
          height: 10px;
          border-radius: 999px;
          background: radial-gradient(circle, #ffffff 0%, #67f8ff 38%, rgba(168,85,247,0.72) 68%, transparent 72%);
          box-shadow:
            0 0 10px rgba(255,255,255,0.95),
            0 0 22px rgba(34, 211, 238, 0.95),
            0 0 36px rgba(168, 85, 247, 0.7);
          pointer-events: none;
          z-index: 3;
          transform: translate(-50%, -50%);
          animation: borderTravel 5.2s linear infinite;
        }

        .selected-plan-surface {
          position: relative;
          z-index: 2;
          border-radius: 20px;
          box-shadow:
            inset 0 0 34px rgba(34, 211, 238, 0.08),
            inset 0 0 0 1px rgba(255,255,255,0.04);
          background: linear-gradient(180deg, rgba(5, 20, 34, 0.985), rgba(3, 11, 23, 0.99));
        }
      `}</style>

      <div className="pointer-events-none fixed inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(34,211,238,0.18),transparent_28%),radial-gradient(circle_at_78%_14%,rgba(168,85,247,0.15),transparent_24%),linear-gradient(180deg,#020814_0%,#030b18_48%,#020814_100%)]" />
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-300/50 to-transparent" />
      </div>

      <section className="relative mx-auto w-full max-w-[1760px] px-3 pb-28 pt-3 sm:px-5 md:pb-6 lg:px-7">
        <header className="flex items-center justify-between gap-3 border-b border-white/8 pb-3">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-full border border-cyan-300/35 bg-cyan-300/10 text-cyan-300 shadow-[0_0_24px_rgba(34,211,238,0.22)]">
              <Sparkles className="h-4 w-4" />
            </span>
            <span className="text-lg font-bold tracking-tight sm:text-xl">Orbyx</span>
          </Link>

          <nav className="hidden items-center gap-8 text-sm font-semibold text-slate-200 lg:flex">
            <Link href="/#funciones" className="transition hover:text-white">
              Funciones
            </Link>
            <span className="border-b border-cyan-300 pb-2 text-cyan-300">
              Precios
            </span>
            <Link href="/#casos" className="transition hover:text-white">
              Casos de uso
            </Link>
          </nav>

          <div className="flex items-center gap-2">
            <Link
              href="/login"
              className="hidden h-9 items-center justify-center rounded-lg border border-white/15 px-3 text-xs font-semibold text-white transition hover:border-white/35 hover:bg-white/8 sm:inline-flex lg:px-4 lg:text-sm"
            >
              Iniciar sesion
            </Link>
            <Link
              href="/signup?plan=pro"
              className="inline-flex h-9 items-center justify-center rounded-lg bg-[#21d6c5] px-3 text-xs font-bold text-slate-950 shadow-[0_14px_38px_rgba(34,211,238,0.2)] transition hover:bg-[#45eadb] lg:px-4 lg:text-sm"
            >
              Probar gratis
            </Link>
          </div>
        </header>

        <div className="grid gap-5 pt-5 xl:grid-cols-[minmax(0,1fr)_430px] 2xl:grid-cols-[minmax(0,1fr)_470px]">
          <div className="min-w-0">
            <div className="mx-auto max-w-3xl text-center">
              <div className="inline-flex items-center gap-2 rounded-full border border-cyan-300/15 bg-cyan-300/8 px-3 py-1.5 text-[11px] font-semibold text-cyan-200 shadow-[0_0_34px_rgba(34,211,238,0.12)]">
                <Sparkles className="h-3.5 w-3.5" />
                Planes simples, sin complicaciones
                <Sparkles className="h-3.5 w-3.5" />
              </div>

              <h1 className="mt-3 text-3xl font-semibold tracking-tight text-white sm:text-4xl lg:text-[2.65rem] lg:leading-[1.04] 2xl:text-[2.95rem]">
                Elige el plan ideal para hacer{" "}
                <span className="text-[#24e0d0]">crecer tu negocio</span>
              </h1>

              <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-300 lg:text-[15px]">
                La IA atiende clientes. Orbyx organiza el negocio con agenda,
                campanas, WhatsApp y automatizacion.
              </p>

              <div className="mt-3 flex flex-wrap items-center justify-center gap-3">
                <div className="inline-flex w-full max-w-md rounded-full border border-white/10 bg-white/6 p-1 text-xs font-semibold text-slate-300 sm:w-auto">
                  {(Object.keys(billingCycleConfig) as BillingCycle[]).map((cycle) => {
                    const config = billingCycleConfig[cycle];
                    const isActive = billingCycle === cycle;

                    return (
                      <button
                        key={cycle}
                        type="button"
                        onClick={() => setBillingCycle(cycle)}
                        className={`inline-flex min-h-[44px] flex-1 items-center justify-center gap-1.5 rounded-full px-3 transition sm:flex-none sm:px-5 ${
                          isActive
                            ? "bg-cyan-400/12 text-cyan-200"
                            : "text-slate-300 hover:text-white"
                        }`}
                      >
                        {config.label}
                        {config.badge ? (
                          <span
                            className={`rounded-full border px-1.5 py-0.5 text-[10px] ${
                              isActive
                                ? "border-cyan-300/30 bg-cyan-300/10 text-cyan-200"
                                : "border-white/15 bg-white/6 text-slate-300"
                            }`}
                          >
                            {config.badge}
                          </span>
                        ) : null}
                      </button>
                    );
                  })}
                </div>
                <span className="text-xs font-semibold text-cyan-300">
                  Ahorra 15% con anual y 10% con semestral
                </span>
              </div>

              {from === "staff" ? (
                <div className="mx-auto mt-4 max-w-xl rounded-2xl border border-amber-300/20 bg-amber-400/10 px-4 py-2.5 text-sm text-amber-100">
                  Llegaste aqui porque alcanzaste el limite de profesionales de tu plan.
                </div>
              ) : null}
            </div>

            <div className="relative mt-4 md:mt-6">
            <div id="planes" className="flex snap-x snap-mandatory gap-3 overflow-x-auto pb-2 md:grid md:snap-none md:overflow-visible md:pb-0 md:grid-cols-2 2xl:grid-cols-4">
              {plans.map((plan) => {
                const isSelected = selectedPlan.key === plan.key;
                const isCurrentCard = hasBillingContext && initialPlan === plan.key;

                return (
                  <motion.button
                    key={plan.key}
                    type="button"
                    onClick={() => handleSelectPlan(plan.key)}
                    whileHover={{ y: isSelected ? -5 : -3 }}
                    animate={{ y: isSelected ? -5 : 0, scale: isSelected ? 1.01 : 1 }}
                    transition={{ type: "spring", stiffness: 260, damping: 24 }}
                    className={`relative isolate flex w-[85%] shrink-0 snap-center min-h-[320px] overflow-hidden rounded-[22px] border p-[1px] text-left transition sm:w-[360px] sm:min-h-[370px] md:w-auto md:shrink md:snap-align-none 2xl:min-h-[390px] ${
                      isSelected
                        ? `selected-plan-neon ${plan.borderClass} bg-cyan-300/25 shadow-[0_0_0_1px_rgba(34,211,238,0.42),0_0_26px_rgba(34,211,238,0.24),0_0_42px_rgba(168,85,247,0.18),0_18px_54px_rgba(34,211,238,0.16)]`
                        : "border-white/12 bg-white/[0.035] shadow-[0_18px_50px_rgba(0,0,0,0.18)] hover:border-white/25 hover:bg-white/[0.055]"
                    }`}
                  >
                    <div className={`${isSelected ? "selected-plan-surface" : "relative z-10 rounded-[21px]"} flex h-full w-full flex-col overflow-hidden px-4 py-4 sm:px-5 sm:py-5`}>
                    <div className={`absolute inset-0 -z-10 bg-gradient-to-b ${plan.gradientClass} ${isSelected ? "opacity-100" : "opacity-40"}`} />
                    <div className="absolute inset-x-5 top-0 -z-10 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />

                    {plan.badge ? (
                      <span className="absolute right-5 top-0 rounded-b-lg bg-[#22d6c8] px-5 py-2 text-[11px] font-black uppercase tracking-wide text-slate-950">
                        {plan.badge}
                      </span>
                    ) : null}

                    {isCurrentCard ? (
                      <span className="absolute left-5 top-5 rounded-full border border-emerald-300/25 bg-emerald-400/12 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-emerald-200">
                        Plan actual
                      </span>
                    ) : null}

                    <div className="flex w-full flex-col">
                      <span
                        className={`inline-flex h-12 w-12 items-center justify-center rounded-full border ${
                          isSelected
                            ? "border-cyan-300/25 bg-cyan-300/14 text-cyan-200 shadow-[0_0_28px_rgba(34,211,238,0.28)]"
                            : "border-white/10 bg-white/7"
                        } ${plan.accentClass} ${isCurrentCard ? "mt-8" : ""}`}
                      >
                        <PlanIcon type={plan.icon} />
                      </span>

                      <p className="mt-4 text-xl font-semibold text-white">{plan.name}</p>
                      <p className="mt-2 min-h-[44px] text-sm leading-6 text-slate-300">
                        {plan.subtitle}
                      </p>

                      {billingCycle !== "mensual" ? (
                        <p className="mt-3 text-sm font-semibold text-slate-500 line-through">
                          {formatCLP(plan.price * billingCycleConfig[billingCycle].months)}
                        </p>
                      ) : null}

                      <div className={`${billingCycle !== "mensual" ? "mt-1" : "mt-3"} flex items-end gap-1`}>
                        <span className="text-2xl font-semibold leading-none tracking-tight text-white sm:text-[1.75rem]">
                          {formatCLP(cycleTotalPrice(plan.price, billingCycle))}
                        </span>
                        <span className="pb-1 text-sm text-slate-400">
                          {billingCycle === "mensual" ? plan.ivaLabel : "+ IVA"}
                        </span>
                      </div>

                      <div
                        className={`mt-4 inline-flex h-10 w-full items-center justify-center rounded-lg border px-4 text-sm font-bold transition ${
                          isSelected
                            ? "border-cyan-300/20 bg-[#21d6c5] text-slate-950 shadow-[0_14px_34px_rgba(34,211,238,0.2)]"
                            : "border-white/15 bg-white/[0.035] text-white"
                        }`}
                      >
                        {isSelected
                          ? "Plan seleccionado"
                          : plan.key === "pro"
                          ? "Probar gratis 14 dias"
                          : "Comenzar ahora"}
                      </div>

                      <div className="mt-4 space-y-2.5 pb-1">
                        {plan.features.map((feature) => {
                          const isEffectiveLocked =
                            feature.locked || (feature.trialLocked && isTrial);
                          return (
                            <div key={`${plan.key}-${feature.title}`} className="flex items-start gap-3">
                              {isEffectiveLocked ? (
                                <Lock className="mt-0.5 h-4 w-4 shrink-0 text-slate-500" />
                              ) : (
                                <Check
                                  className={`mt-0.5 h-4 w-4 shrink-0 ${
                                    feature.highlight ? "text-cyan-300" : plan.accentClass
                                  }`}
                                />
                              )}
                              <span
                                className={`text-[13px] leading-5 ${
                                  isEffectiveLocked
                                    ? "text-slate-500"
                                    : feature.highlight
                                    ? "font-semibold text-cyan-100"
                                    : "text-slate-300"
                                }`}
                              >
                                {feature.title}
                                {feature.trialLocked && (
                                  <span className="mt-0.5 block text-[11px] text-slate-500">
                                    {isTrial
                                      ? "No incluido en versión de prueba"
                                      : "Se activa al pagar el plan"}
                                  </span>
                                )}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                    </div>
                  </motion.button>
                );
              })}
            </div>
            <div className="pointer-events-none absolute inset-y-0 right-0 w-10 bg-gradient-to-l from-[#020814] to-transparent md:hidden" />
            </div>

            <section className="mt-5 flex flex-col items-center gap-3">
              <p className="text-center text-sm text-slate-400">
                Potencia tu plan con add-ons desde el panel lateral →
              </p>
              <Link
                href="/planes/comparar"
                className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-white/15 bg-white/[0.04] px-4 text-sm font-semibold text-white transition hover:border-cyan-300/35 hover:bg-cyan-300/8"
              >
                <BarChart3 className="h-4 w-4" />
                Comparar planes
              </Link>
            </section>

            <div className="mt-5 grid gap-3 rounded-[16px] border border-white/10 bg-white/[0.035] p-4 text-sm text-slate-300 md:grid-cols-2 xl:grid-cols-4">
              {[
                ["Versión de prueba 14 días en Pro", "Prueba sin riesgos.", CalendarDays],
                ["Sin tarjeta de credito", "Comienza en segundos.", Lock],
                ["Cambia cuando quieras", "Upgrade, downgrade o cancela.", Zap],
                ["Siempre seguro", "Tus datos estan protegidos.", ShieldCheck],
              ].map(([title, text, Icon]) => {
                const SafeIcon = Icon as typeof CalendarDays;
                return (
                  <div key={String(title)} className="flex items-center gap-3">
                    <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-300/10 text-cyan-200">
                      <SafeIcon className="h-5 w-5" />
                    </span>
                    <div>
                      <p className="font-semibold text-white">{title as string}</p>
                      <p>{text as string}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            <p className="mt-3 text-center text-sm text-slate-500">
              Todos los planes incluyen actualizaciones constantes. Los precios no incluyen IVA.
            </p>
          </div>

          <aside className="fixed inset-x-0 bottom-0 z-40 md:static md:z-auto xl:sticky xl:top-4 xl:self-start">
            <div className="overflow-hidden rounded-t-[18px] border border-white/12 bg-[#06101d]/95 shadow-[0_-12px_60px_rgba(0,0,0,0.45)] backdrop-blur-xl md:rounded-[18px] md:bg-[#06101d]/90 md:shadow-[0_24px_90px_rgba(0,0,0,0.32)]">
              {/* Barra fija mobile: muestra plan + total y expande el resumen hacia arriba */}
              <button
                type="button"
                onClick={() => setMobileSummaryOpen((open) => !open)}
                className="flex min-h-[56px] w-full items-center justify-between gap-3 px-4 md:hidden"
                aria-expanded={mobileSummaryOpen}
              >
                <span className="flex items-center gap-2 text-sm font-semibold text-white">
                  <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-cyan-300/10 text-cyan-300">
                    <ShoppingCart className="h-4 w-4" />
                  </span>
                  Tu seleccion · {selectedPlan.name}
                </span>
                <span className="flex items-center gap-2 text-sm font-bold text-cyan-300">
                  {formatCLP(summaryTotal)}
                  <ChevronUp
                    className={`h-4 w-4 transition-transform ${
                      mobileSummaryOpen ? "rotate-180" : ""
                    }`}
                  />
                </span>
              </button>

              <div
                className={`${
                  mobileSummaryOpen
                    ? "block max-h-[75vh] overflow-y-auto"
                    : "hidden"
                } md:block md:max-h-none md:overflow-visible`}
              >
              <div className="border-b border-white/10 p-4">
                <div className="flex items-center gap-3">
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-300/10 text-cyan-300">
                    <ShoppingCart className="h-4 w-4" />
                  </span>
                  <h2 className="text-lg font-semibold text-white">Tu seleccion</h2>
                </div>

                <div className="mt-4 rounded-xl border border-white/10 bg-white/[0.035] p-3.5">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs text-slate-400">Plan seleccionado</p>
                      <p className="mt-1 text-lg font-semibold text-[#24e0d0]">
                        {selectedPlan.name}
                      </p>
                    </div>
                    <span className="text-cyan-300">
                      <PlanIcon type={selectedPlan.icon} />
                    </span>
                  </div>
                </div>
              </div>

              <div className="p-4">
                {hasBillingContext && previewLoading ? (
                  <div className="mb-4 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-300">
                    Calculando cambio de plan...
                  </div>
                ) : null}

                {hasBillingContext && previewError ? (
                  <div className="mb-4 rounded-xl border border-rose-300/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
                    {previewError}
                  </div>
                ) : null}

                {hasBillingContext && !previewLoading && !previewError && previewType ? (
                  <div
                    className={`mb-4 rounded-xl border px-4 py-3 text-sm ${
                      previewType === "same_plan"
                        ? "border-emerald-300/20 bg-emerald-500/10 text-emerald-100"
                        : previewType === "downgrade"
                        ? "border-amber-300/20 bg-amber-500/10 text-amber-100"
                        : "border-cyan-300/20 bg-cyan-500/10 text-cyan-100"
                    }`}
                  >
                    {preview?.message ||
                      (previewType === "downgrade"
                        ? "Este cambio quedara programado para el siguiente ciclo."
                        : previewType === "same_plan"
                        ? "Ya estas en este plan."
                        : "Este cambio se aplicara de inmediato.")}
                  </div>
                ) : null}

                <div className="space-y-3">
                  {hasBillingContext ? (
                    <>
                      <SummaryLine label="Plan actual" value={planNameFromKey(initialPlan)} />
                      <SummaryLine label="Plan seleccionado" value={selectedPlan.name} />
                    </>
                  ) : null}
                </div>

                {previewType === "upgrade" ? (
                  <div className="mt-4 space-y-3 rounded-xl border border-cyan-300/15 bg-cyan-400/8 p-4">
                    <SummaryLine label="Dias restantes del ciclo" value={remainingDaysLabel} />
                    <SummaryLine
                      label="Credito proporcional plan actual"
                      value={`- ${formatCLP(Number(preview?.credit || 0))}`}
                    />
                    <SummaryLine
                      label="Cargo proporcional nuevo plan"
                      value={formatCLP(Number(preview?.charge || 0))}
                    />
                    <p className="text-xs leading-5 text-cyan-100/80">
                      Los add-ons que ya esten incluidos en el nuevo plan se
                      cancelan automaticamente y su valor se descuenta del
                      prorrateo.
                    </p>
                  </div>
                ) : null}

                {previewType === "downgrade" ? (
                  <div className="mt-4 rounded-xl border border-amber-300/15 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
                    El downgrade comenzara el{" "}
                    <span className="font-semibold">{billingEndLabel}</span>. Mantendras
                    tu plan actual hasta esa fecha.
                  </div>
                ) : null}

                {isProSelected ? (
                  <div className="mt-5 rounded-xl border border-cyan-300/15 bg-cyan-400/8 px-4 py-3 text-sm text-cyan-100">
                    Sube a Premium para agregar extras a tu plan
                  </div>
                ) : (
                <div className="mt-5">
                  <div className="mb-3 flex items-center justify-between">
                    <span className="text-sm font-semibold text-white">
                      Add-ons seleccionados
                    </span>
                    <span className="rounded-full bg-violet-500/25 px-3 py-1 text-xs font-bold text-violet-100">
                      {selectedAddonsCount}
                    </span>
                  </div>

                  {addonError ? (
                    <div className="mb-3 rounded-xl border border-rose-300/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
                      {addonError}
                    </div>
                  ) : null}

                  {extraItems.length === 0 ? (
                    <div className="rounded-xl border border-white/8 bg-white/[0.035] px-4 py-3 text-sm text-slate-400">
                      {addonsLoading
                        ? "Cargando add-ons..."
                        : "Aun no has agregado adicionales."}
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      {extraItems.map((item) => (
                        <div
                          key={item.label}
                          className="group relative rounded-xl border border-white/8 bg-white/[0.035] p-3"
                        >
                          <span className="pointer-events-none absolute bottom-full left-0 z-20 mb-2 hidden w-64 rounded-2xl border border-white/10 bg-slate-950/95 px-3 py-2 text-xs leading-5 text-slate-200 shadow-[0_20px_50px_rgba(0,0,0,0.45)] group-hover:block">
                            {extraConfig[item.key].tooltip}
                          </span>
                          <div className="flex items-start gap-3">
                            <span className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${extraConfig[item.key].iconClass}`}>
                                {extraConfig[item.key].icon}
                            </span>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                  <p className="text-sm font-semibold text-white">
                                    {extraConfig[item.key].title}
                                  </p>
                                  <p className="mt-1 text-xs text-slate-400">
                                    {item.count} {extraUnitLabel(item.key, item.count)}
                                  </p>
                                  <p className="mt-0.5 text-xs text-slate-400">
                                    {extraConfig[item.key].usageLabel}
                                  </p>
                                </div>
                                <div className="shrink-0 text-right">
                                  {item.count >= 2 ? (
                                    <div className="flex items-center justify-end gap-1.5">
                                      <p className="text-xs text-slate-400">
                                        {formatCLP(nextPackPrice(extraConfig[item.key], item.count))} + IVA
                                      </p>
                                      <span className="rounded px-1 py-0.5 text-[10px] font-semibold bg-cyan-300/15 text-cyan-300">
                                        {discountBadge(extraConfig[item.key], item.count)}
                                      </span>
                                    </div>
                                  ) : (
                                    <p className="text-xs text-slate-400">
                                      {formatCLP(extraConfig[item.key].unitPrice)} + IVA
                                    </p>
                                  )}
                                  <p className="mt-2 text-xs text-slate-300">Total:</p>
                                  <p className="text-sm font-semibold text-white">
                                    {formatCLP(item.amount)}
                                  </p>
                                </div>
                              </div>

                              <div className="mt-3 flex items-center justify-end">
                                <div className="flex items-center rounded-lg border border-white/12 bg-black/25">
                                  <button
                                    type="button"
                                    onClick={() => decreaseExtra(item.key)}
                                    disabled={addonBusy !== null}
                                    className="inline-flex h-11 w-11 items-center justify-center text-slate-200 transition hover:bg-white/8 disabled:cursor-not-allowed disabled:opacity-40 md:h-8 md:w-8"
                                    aria-label={`Quitar ${extraConfig[item.key].title}`}
                                  >
                                    <Minus className="h-4 w-4" />
                                  </button>
                                  <span className="min-w-8 text-center text-sm font-semibold text-white">
                                    {addonBusy === item.key ? "…" : item.count}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => increaseExtra(item.key)}
                                    disabled={addonBusy !== null}
                                    className="inline-flex h-11 w-11 items-center justify-center text-slate-200 transition hover:bg-white/8 disabled:cursor-not-allowed disabled:opacity-40 md:h-8 md:w-8"
                                    aria-label={`Agregar ${extraConfig[item.key].title}`}
                                  >
                                    +
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {addableAddons.length > 0 ? (
                    <div className="mt-3 rounded-xl border border-white/8 bg-black/15 p-3">
                      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                        Agregar add-ons
                      </p>
                      <div className="mt-3 grid gap-2">
                        {addableAddons.map((extraKey) => {
                          const config = extraConfig[extraKey];

                          return (
                            <div key={extraKey} className="group relative">
                              <button
                                type="button"
                                onClick={() => increaseExtra(extraKey)}
                                disabled={addonBusy !== null || addonsLoading}
                                className="flex w-full items-center justify-between gap-3 rounded-lg border border-white/8 bg-white/[0.025] px-3 py-2 text-left transition hover:border-cyan-300/25 hover:bg-cyan-300/8 disabled:cursor-not-allowed disabled:opacity-40"
                              >
                                <span className="flex items-center gap-2">
                                  <span className={`inline-flex h-8 w-8 items-center justify-center rounded-lg ${config.iconClass}`}>
                                    {config.icon}
                                  </span>
                                  <span>
                                    <span className="block text-xs font-semibold text-white">
                                      {config.title}
                                    </span>
                                    <span className="block text-xs text-slate-400">
                                      {formatCLP(config.unitPrice)} /mes + IVA
                                    </span>
                                  </span>
                                </span>
                                <span className="text-lg leading-none text-cyan-300">+</span>
                              </button>
                              <span className="pointer-events-none absolute bottom-full left-0 z-20 mb-2 hidden w-64 rounded-2xl border border-white/10 bg-slate-950/95 px-3 py-2 text-xs leading-5 text-slate-200 shadow-[0_20px_50px_rgba(0,0,0,0.45)] group-hover:block">
                                {config.tooltip}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ) : null}
                </div>
                )}

                <div className="mt-5 space-y-2.5 border-t border-white/10 pt-4">
                  <SummaryLine label={summaryBaseLabel} value={summaryBaseAmount} />
                  {extraItems.map((item) => (
                    <SummaryLine
                      key={`summary-${item.label}`}
                      label={`${extraConfig[item.key].title} (${item.count})`}
                      value={formatCLP(item.amount)}
                    />
                  ))}
                  <div className="h-px bg-white/10" />
                  <SummaryLine label="Subtotal" value={formatCLP(summarySubtotal)} />
                  <SummaryLine label="IVA (19%)" value={formatCLP(summaryIva)} />
                  <SummaryLine label="Total mensual" value={formatCLP(summaryTotal)} strong />
                  {!hasBillingContext && billingCycle !== "mensual" ? (
                    <SummaryLine
                      label={`Total a facturar (${cycleMonths} meses, IVA incl.)`}
                      value={formatCLP(cycleTotalWithIva)}
                    />
                  ) : null}
                </div>

                {applyError ? (
                  <div className="mt-4 rounded-xl border border-rose-300/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
                    {applyError}
                  </div>
                ) : null}

                {downgradeBlockError ? (
                  <div className="mt-4 rounded-xl border border-rose-300/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
                    {downgradeBlockError}
                  </div>
                ) : null}

                {applyOk ? (
                  <div className="mt-4 rounded-xl border border-emerald-300/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">
                    {applyOk}
                  </div>
                ) : null}

                <div className="mt-4 space-y-3">
                  {hasBillingContext ? (
                    <button
                      type="button"
                      onClick={handleApplyPlanChange}
                      disabled={applying || previewLoading || downgradeChecking || !tenantId}
                      className="inline-flex h-12 w-full items-center justify-center rounded-lg bg-[#21d6c5] px-5 text-base font-black text-slate-950 shadow-[0_18px_45px_rgba(34,211,238,0.2)] transition hover:bg-[#45eadb] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {applying
                        ? "Procesando..."
                        : downgradeChecking
                        ? "Validando limites..."
                        : ctaLabel}
                    </button>
                  ) : (
                    <Link
                      href={publicCtaHref}
                      className="inline-flex h-12 w-full items-center justify-center rounded-lg bg-[#21d6c5] px-5 text-base font-black text-slate-950 shadow-[0_18px_45px_rgba(34,211,238,0.2)] transition hover:bg-[#45eadb]"
                    >
                      {ctaLabel}
                    </Link>
                  )}

                  <p className="flex items-center justify-center gap-2 text-center text-xs text-slate-400">
                    <Lock className="h-3.5 w-3.5 text-cyan-300" />
                    {!hasBillingContext && isProSelected
                      ? "Versión de prueba 14 días, sin tarjeta de crédito. Cancela cuando quieras."
                      : "Cancela o cambia de plan cuando quieras."}
                  </p>

                  {hasBillingContext ? (
                    <div className="rounded-xl border border-white/10 bg-white/[0.035] p-3">
                      <div className="flex items-start gap-3">
                        <Zap className="mt-0.5 h-5 w-5 shrink-0 text-amber-300" />
                        <p className="text-sm leading-5 text-slate-300">
                          El cobro se prorratea segun los dias restantes de tu ciclo actual.
                        </p>
                      </div>
                    </div>
                  ) : null}

                  {showTenantWarning ? (
                    <div className="rounded-xl border border-amber-300/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
                      Falta <span className="font-semibold">tenant_id</span> en la URL
                      para aplicar el cambio real.
                    </div>
                  ) : null}

                  {slug ? (
                    <Link
                      href={`/dashboard/${slug}/staff`}
                      className="inline-flex h-11 w-full items-center justify-center rounded-lg border border-white/10 bg-white/[0.035] px-5 text-sm font-semibold text-white transition hover:bg-white/8"
                    >
                      Volver al panel
                    </Link>
                  ) : null}
                </div>

                {hasBillingContext && previewType === "downgrade" ? (
                  <div className="mt-5 rounded-xl border border-amber-300/20 bg-amber-500/10 p-4">
                    <p className="text-sm font-semibold text-amber-100">
                      Importante para el downgrade
                    </p>
                    <p className="mt-2 text-sm leading-6 text-amber-50/90">
                      Antes de la fecha de cambio, el panel debera permitirte elegir
                      que profesionales o sucursales quieres mantener activos dentro
                      del nuevo limite.
                    </p>
                  </div>
                ) : null}
              </div>
              </div>
            </div>
          </aside>
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-4 pb-10 pt-2 text-center md:px-8">
        <p className="text-xs leading-6 text-slate-500">
          Los mensajes de WhatsApp e IA incluidos en cada plan y en los add-ons no son acumulables entre períodos. Los add-ons tienen una duración de 30 días desde la fecha de compra y se renuevan automáticamente. Los beneficios incluidos en el plan tienen la misma duración que el plan contratado. Los precios no incluyen IVA.
        </p>
      </section>

      {downgradeModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm sm:items-center sm:p-4">
          <div className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-t-2xl border border-amber-300/25 bg-[#06101d] p-5 shadow-[0_24px_90px_rgba(0,0,0,0.5)] sm:rounded-2xl">
            <h3 className="text-lg font-semibold text-white">
              Confirmar downgrade a {selectedPlan.name}
            </h3>
            <p className="mt-2 text-sm leading-6 text-slate-300">
              El cambio sera efectivo el{" "}
              <span className="font-semibold text-amber-200">{billingEndLabel}</span>.
              Mantendras tu plan actual hasta esa fecha.
            </p>

            {(() => {
              const currentPlanData = plans.find((plan) => plan.key === initialPlan);
              if (!currentPlanData) return null;

              const { featuresLost, addonsCanceled } = getDowngradeDetails(
                currentPlanData,
                selectedPlan
              );

              return (
                <>
                  {featuresLost.length > 0 ? (
                    <div className="mt-4">
                      <p className="text-sm font-semibold text-white">
                        Features que perderas
                      </p>
                      <ul className="mt-2 space-y-1.5">
                        {featuresLost.map((item) => (
                          <li
                            key={item}
                            className="flex items-start gap-2 text-sm leading-5 text-slate-300"
                          >
                            <Minus className="mt-0.5 h-4 w-4 shrink-0 text-amber-300" />
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : null}

                  {addonsCanceled.length > 0 ? (
                    <div className="mt-4">
                      <p className="text-sm font-semibold text-white">
                        Add-ons que se cancelaran
                      </p>
                      <ul className="mt-2 space-y-1.5">
                        {addonsCanceled.map((item) => (
                          <li
                            key={item}
                            className="flex items-start gap-2 text-sm leading-5 text-slate-300"
                          >
                            <Minus className="mt-0.5 h-4 w-4 shrink-0 text-rose-300" />
                            {item}
                          </li>
                        ))}
                      </ul>
                      <p className="mt-2 text-xs leading-5 text-slate-400">
                        Te notificaremos por email con el detalle de los add-ons
                        cancelados.
                      </p>
                    </div>
                  ) : null}
                </>
              );
            })()}

            <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setDowngradeModalOpen(false)}
                className="inline-flex h-11 items-center justify-center rounded-lg border border-white/15 bg-white/[0.04] px-5 text-sm font-semibold text-white transition hover:bg-white/8"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={applying}
                onClick={async () => {
                  setDowngradeModalOpen(false);
                  await applyPlanChange();
                }}
                className="inline-flex h-11 items-center justify-center rounded-lg bg-amber-400 px-5 text-sm font-black text-slate-950 transition hover:bg-amber-300 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Confirmar downgrade
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}

export default function PlanesPage() {
  return (
    <Suspense
      fallback={<div className="p-6 text-sm text-slate-500">Cargando planes...</div>}
    >
      <PlanesPageContent />
    </Suspense>
  );
}
