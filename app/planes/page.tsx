"use client";

import Link from "next/link";
import { Suspense, useEffect, useMemo, useState, type ReactNode } from "react";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import {
  ArrowRight,
  BarChart3,
  CalendarDays,
  Check,
  Crown,
  Gem,
  Lock,
  Mail,
  Megaphone,
  MessageCircle,
  Minus,
  ShieldCheck,
  Sparkles,
  Store,
  Users,
  Zap,
} from "lucide-react";

type PlanKey = "pro" | "premium" | "vip" | "platinum";
type ExtraKey = "staff" | "reminders" | "campaigns" | "branches";

type FeatureItem = {
  title: string;
  description?: string;
  highlight?: boolean;
};

type Plan = {
  key: PlanKey;
  name: string;
  price: number;
  priceLabel: string;
  ivaLabel: string;
  subtitle: string;
  benefit: string;
  badge?: string;
  includedBranches: number;
  includedStaff: number;
  includedServices: number;
  includedReminderConversations: number;
  includedWhatsappResponseConversations: number;
  includedAiConversations: number;
  emailCampaignsIncluded: boolean;
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
  unitLabel: string;
  icon: ReactNode;
  glow: string;
  iconClass: string;
};

const BACKEND_URL = "https://orbyx-backend.onrender.com";

const plans: Plan[] = [
  {
    key: "pro",
    name: "Pro",
    price: 19990,
    priceLabel: "$19.990",
    ivaLabel: "/mes + IVA",
    subtitle: "Pequeno negocio con agenda profesional",
    benefit:
      "Agenda online, reservas y una base clara para ordenar la operacion diaria.",
    includedBranches: 1,
    includedStaff: 2,
    includedServices: 10,
    includedReminderConversations: 0,
    includedWhatsappResponseConversations: 0,
    includedAiConversations: 0,
    emailCampaignsIncluded: false,
    extras: ["staff", "branches"],
    summaryTitle: "Plan Pro",
    summaryIntro:
      "Para comenzar con reservas online, confirmaciones y control operativo.",
    features: [
      { title: "Agenda y reservas online" },
      { title: "Confirmaciones automaticas" },
      { title: "IA de WhatsApp basica" },
      { title: "2 profesionales incluidos" },
      { title: "1 sucursal incluida" },
      { title: "Soporte por chat" },
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
    priceLabel: "$29.990",
    ivaLabel: "/mes + IVA",
    subtitle: "Mas automatizacion para crecer con orden",
    benefit:
      "Mas capacidad, seguimiento y campanas por email para negocios en crecimiento.",
    includedBranches: 2,
    includedStaff: 5,
    includedServices: 25,
    includedReminderConversations: 0,
    includedWhatsappResponseConversations: 0,
    includedAiConversations: 0,
    emailCampaignsIncluded: true,
    extras: ["staff", "branches"],
    summaryTitle: "Plan Premium",
    summaryIntro:
      "Mayor control comercial, mas profesionales y seguimiento mas consistente.",
    features: [
      { title: "Todo lo de Pro" },
      { title: "5 profesionales incluidos" },
      { title: "Campanas por email" },
      { title: "Recordatorios por email" },
      { title: "2 sucursales incluidas" },
      { title: "Soporte prioritario" },
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
    price: 79990,
    priceLabel: "$79.990",
    ivaLabel: "/mes + IVA",
    subtitle: "WhatsApp real, IA y recuperacion de clientes",
    benefit:
      "Automatiza, recupera y responde mas rapido por WhatsApp con una experiencia seria.",
    badge: "Mas elegido",
    includedBranches: 3,
    includedStaff: 10,
    includedServices: 50,
    includedReminderConversations: 200,
    includedWhatsappResponseConversations: 200,
    includedAiConversations: 200,
    emailCampaignsIncluded: true,
    extras: ["staff", "reminders", "campaigns", "branches"],
    summaryTitle: "Plan VIP",
    summaryIntro:
      "Para activar clientes, responder por WhatsApp y convertir conversaciones en reservas.",
    features: [
      { title: "Todo lo de Premium" },
      { title: "10 profesionales incluidos" },
      { title: "Campanas por WhatsApp" },
      { title: "Recordatorios WhatsApp 200 conversaciones / mes" },
      { title: "IA responde y deriva a reserva", highlight: true },
      { title: "3 sucursales incluidas" },
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
    price: 189990,
    priceLabel: "$189.990",
    ivaLabel: "/mes + IVA",
    subtitle: "IA avanzada, multi sucursal y SLA premium",
    benefit:
      "Para negocios que quieren escalar sin limites visuales y operar con IA avanzada.",
    badge: "IA avanzada",
    includedBranches: 10,
    includedStaff: 20,
    includedServices: 100,
    includedReminderConversations: 800,
    includedWhatsappResponseConversations: 800,
    includedAiConversations: 800,
    emailCampaignsIncluded: true,
    extras: ["staff", "reminders", "campaigns", "branches"],
    summaryTitle: "Plan Platinum",
    summaryIntro:
      "Automatizaciones avanzadas, onboarding premium, SLA y seguimiento inteligente.",
    features: [
      { title: "Todo lo de VIP" },
      { title: "20 profesionales incluidos" },
      { title: "Recordatorios WhatsApp 800 conversaciones / mes" },
      { title: "IA responde, sigue y automatiza", highlight: true },
      { title: "10 sucursales incluidas" },
      { title: "Automatizaciones avanzadas" },
      { title: "Onboarding personalizado" },
      { title: "SLA y soporte premium" },
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
  staff: {
    title: "+ Profesionales",
    short: "Agrega mas miembros a tu equipo.",
    detail: "por profesional",
    unitPrice: 6000,
    unitLabel: "profesional",
    icon: <Users className="h-5 w-5" />,
    glow: "from-violet-500/20 to-violet-500/5",
    iconClass: "bg-violet-500/18 text-violet-200",
  },
  reminders: {
    title: "Pack recordatorios WhatsApp",
    short: "Envia recordatorios automaticos.",
    detail: "por 50 conversaciones",
    unitPrice: 5000,
    unitLabel: "pack",
    icon: <MessageCircle className="h-5 w-5" />,
    glow: "from-emerald-500/20 to-emerald-500/5",
    iconClass: "bg-emerald-500/18 text-emerald-200",
  },
  campaigns: {
    title: "Campanas WhatsApp",
    short: "Envia promociones y recupera clientes.",
    detail: "por 50 conversaciones",
    unitPrice: 9000,
    unitLabel: "pack",
    icon: <Megaphone className="h-5 w-5" />,
    glow: "from-amber-500/20 to-amber-500/5",
    iconClass: "bg-amber-500/18 text-amber-200",
  },
  branches: {
    title: "+ Sucursales",
    short: "Gestiona mas sedes desde tu cuenta.",
    detail: "por sucursal",
    unitPrice: 15000,
    unitLabel: "sucursal",
    icon: <Store className="h-5 w-5" />,
    glow: "from-blue-500/20 to-blue-500/5",
    iconClass: "bg-blue-500/18 text-blue-200",
  },
};

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

  const hasBillingContext = Boolean(tenantId && currentPlanParam);

  const initialPlan = useMemo<PlanKey | null>(() => {
    if (!hasBillingContext) return null;
    return normalizePlanFromUrl(currentPlanParam);
  }, [hasBillingContext, currentPlanParam]);

  const [selectedPlanKey, setSelectedPlanKey] = useState<PlanKey>(
    hasBillingContext && initialPlan ? initialPlan : "vip"
  );

  const [staffExtras, setStaffExtras] = useState(0);
  const [reminderExtras, setReminderExtras] = useState(0);
  const [campaignExtras, setCampaignExtras] = useState(0);
  const [branchExtras, setBranchExtras] = useState(0);

  const [preview, setPreview] = useState<BillingPreviewResponse | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState("");
  const [applying, setApplying] = useState(false);
  const [applyError, setApplyError] = useState("");
  const [applyOk, setApplyOk] = useState("");

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
  const supportsReminderExtra = selectedPlan.extras.includes("reminders");
  const supportsCampaignExtra = selectedPlan.extras.includes("campaigns");
  const supportsBranchExtra = selectedPlan.extras.includes("branches");

  const extrasSubtotal = useMemo(() => {
    let total = 0;

    if (supportsStaffExtra) total += staffExtras * extraConfig.staff.unitPrice;
    if (supportsReminderExtra) {
      total += reminderExtras * extraConfig.reminders.unitPrice;
    }
    if (supportsCampaignExtra) {
      total += campaignExtras * extraConfig.campaigns.unitPrice;
    }
    if (supportsBranchExtra) {
      total += branchExtras * extraConfig.branches.unitPrice;
    }

    return total;
  }, [
    branchExtras,
    campaignExtras,
    reminderExtras,
    staffExtras,
    supportsBranchExtra,
    supportsCampaignExtra,
    supportsReminderExtra,
    supportsStaffExtra,
  ]);

  const previewAmountToday = Number(preview?.amount_today || 0);
  const payTodaySubtotal = previewAmountToday + extrasSubtotal;
  const payTodayIva = Math.round(payTodaySubtotal * 0.19);
  const payTodayTotal = payTodaySubtotal + payTodayIva;

  const currentStaffTotal = selectedPlan.includedStaff + staffExtras;
  const currentReminderTotal =
    selectedPlan.includedReminderConversations + reminderExtras * 50;
  const currentCampaignTotal = campaignExtras * 50;
  const currentBranchTotal = selectedPlan.includedBranches + branchExtras;

  const extraItems = useMemo(() => {
    const items: { key: ExtraKey; label: string; amount: number; count: number }[] = [];

    if (supportsStaffExtra && staffExtras > 0) {
      items.push({
        key: "staff",
        label: `+ Profesionales x${staffExtras}`,
        amount: staffExtras * extraConfig.staff.unitPrice,
        count: staffExtras,
      });
    }

    if (supportsReminderExtra && reminderExtras > 0) {
      items.push({
        key: "reminders",
        label: `Pack recordatorios WhatsApp x${reminderExtras}`,
        amount: reminderExtras * extraConfig.reminders.unitPrice,
        count: reminderExtras,
      });
    }

    if (supportsCampaignExtra && campaignExtras > 0) {
      items.push({
        key: "campaigns",
        label: `Campanas WhatsApp x${campaignExtras}`,
        amount: campaignExtras * extraConfig.campaigns.unitPrice,
        count: campaignExtras,
      });
    }

    if (supportsBranchExtra && branchExtras > 0) {
      items.push({
        key: "branches",
        label: `+ Sucursales x${branchExtras}`,
        amount: branchExtras * extraConfig.branches.unitPrice,
        count: branchExtras,
      });
    }

    return items;
  }, [
    branchExtras,
    campaignExtras,
    reminderExtras,
    staffExtras,
    supportsBranchExtra,
    supportsCampaignExtra,
    supportsReminderExtra,
    supportsStaffExtra,
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

        const res = await fetch(url);
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

  function handleSelectPlan(planKey: PlanKey) {
    setSelectedPlanKey(planKey);
    setStaffExtras(0);
    setReminderExtras(0);
    setCampaignExtras(0);
    setBranchExtras(0);
    setApplyError("");
    setApplyOk("");
  }

  function increaseExtra(extraKey: ExtraKey) {
    if (extraKey === "staff" && supportsStaffExtra) {
      setStaffExtras((prev) => prev + 1);
    }
    if (extraKey === "reminders" && supportsReminderExtra) {
      setReminderExtras((prev) => prev + 1);
    }
    if (extraKey === "campaigns" && supportsCampaignExtra) {
      setCampaignExtras((prev) => prev + 1);
    }
    if (extraKey === "branches" && supportsBranchExtra) {
      setBranchExtras((prev) => prev + 1);
    }
  }

  function decreaseExtra(extraKey: ExtraKey) {
    if (extraKey === "staff" && supportsStaffExtra) {
      setStaffExtras((prev) => Math.max(0, prev - 1));
    }
    if (extraKey === "reminders" && supportsReminderExtra) {
      setReminderExtras((prev) => Math.max(0, prev - 1));
    }
    if (extraKey === "campaigns" && supportsCampaignExtra) {
      setCampaignExtras((prev) => Math.max(0, prev - 1));
    }
    if (extraKey === "branches" && supportsBranchExtra) {
      setBranchExtras((prev) => Math.max(0, prev - 1));
    }
  }

  async function handleApplyPlanChange() {
    try {
      setApplying(true);
      setApplyError("");
      setApplyOk("");

      if (!tenantId) {
        throw new Error("Falta tenant_id para aplicar el cambio de plan");
      }

      const res = await fetch(`${BACKEND_URL}/billing/change-plan`, {
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
      ? "Comenzar ahora"
      : previewType === "same_plan"
      ? "Mantener este plan"
      : previewType === "downgrade"
      ? "Programar downgrade"
      : "Cambiar ahora";

  const showTenantWarning = !tenantId && Boolean(from || slug);

  const publicPlanIva = Math.round(selectedPlan.price * 0.19);
  const publicExtrasIva = Math.round(extrasSubtotal * 0.19);
  const publicReferenceTotal =
    selectedPlan.price + publicPlanIva + extrasSubtotal + publicExtrasIva;

  const summaryBaseLabel =
    hasBillingContext && previewType === "upgrade"
      ? "Cambio inmediato de plan"
      : hasBillingContext && previewType === "downgrade"
      ? "Cambio de plan hoy"
      : "Plan base";

  const summaryBaseAmount = hasBillingContext
    ? previewType === "downgrade"
      ? "$0"
      : formatCLP(previewAmountToday)
    : selectedPlan.priceLabel;

  const summarySubtotal = hasBillingContext
    ? payTodaySubtotal
    : selectedPlan.price + extrasSubtotal;
  const summaryIva = hasBillingContext ? payTodayIva : Math.round(summarySubtotal * 0.19);
  const summaryTotal = hasBillingContext ? payTodayTotal : publicReferenceTotal;

  const availableAddons: ExtraKey[] = ["staff", "reminders", "campaigns", "branches"];

  function extraValue(extraKey: ExtraKey) {
    if (extraKey === "staff") return staffExtras;
    if (extraKey === "reminders") return reminderExtras;
    if (extraKey === "campaigns") return campaignExtras;
    return branchExtras;
  }

  function extraSupported(extraKey: ExtraKey) {
    return selectedPlan.extras.includes(extraKey);
  }

  return (
    <main className="min-h-screen overflow-hidden bg-[#020814] text-white">
      <style jsx>{`
        @keyframes orbyx-orbit {
          0% {
            transform: translateX(-8%) scaleX(0.92);
            opacity: 0.45;
          }
          50% {
            transform: translateX(8%) scaleX(1.03);
            opacity: 0.9;
          }
          100% {
            transform: translateX(-8%) scaleX(0.92);
            opacity: 0.45;
          }
        }

        @keyframes orbyx-electric {
          0%,
          100% {
            opacity: 0.2;
            transform: translateY(0);
          }
          45% {
            opacity: 0.75;
            transform: translateY(-2px);
          }
          70% {
            opacity: 0.38;
          }
        }

        .selected-plan-electric::before,
        .selected-plan-electric::after {
          content: "";
          position: absolute;
          inset: 0;
          border-radius: 22px;
          pointer-events: none;
          background:
            linear-gradient(105deg, transparent 10%, rgba(34, 211, 238, 0.42) 16%, transparent 23%),
            linear-gradient(255deg, transparent 62%, rgba(45, 212, 191, 0.28) 69%, transparent 76%);
          mask-image: linear-gradient(#000, #000);
          animation: orbyx-electric 2.8s ease-in-out infinite;
        }

        .selected-plan-electric::after {
          animation-delay: 1.15s;
          opacity: 0.45;
          filter: blur(2px);
        }

        .selected-plan-orbit {
          animation: orbyx-orbit 3.8s ease-in-out infinite;
        }
      `}</style>

      <div className="pointer-events-none fixed inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(34,211,238,0.18),transparent_28%),radial-gradient(circle_at_78%_14%,rgba(168,85,247,0.15),transparent_24%),linear-gradient(180deg,#020814_0%,#030b18_48%,#020814_100%)]" />
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-300/50 to-transparent" />
      </div>

      <section className="relative mx-auto w-full max-w-[1840px] px-4 pb-8 pt-4 sm:px-6 lg:px-8">
        <header className="flex items-center justify-between gap-4 border-b border-white/8 pb-4">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-full border border-cyan-300/35 bg-cyan-300/10 text-cyan-300 shadow-[0_0_24px_rgba(34,211,238,0.22)]">
              <Sparkles className="h-4 w-4" />
            </span>
            <span className="text-xl font-bold tracking-tight">Orbyx</span>
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
              className="hidden h-10 items-center justify-center rounded-lg border border-white/15 px-4 text-sm font-semibold text-white transition hover:border-white/35 hover:bg-white/8 sm:inline-flex"
            >
              Iniciar sesion
            </Link>
            <Link
              href="/register"
              className="inline-flex h-10 items-center justify-center rounded-lg bg-[#21d6c5] px-4 text-sm font-bold text-slate-950 shadow-[0_14px_38px_rgba(34,211,238,0.2)] transition hover:bg-[#45eadb]"
            >
              Probar gratis
            </Link>
          </div>
        </header>

        <div className="grid gap-7 pt-7 xl:grid-cols-[minmax(0,1fr)_430px]">
          <div className="min-w-0">
            <div className="mx-auto max-w-4xl text-center">
              <div className="inline-flex items-center gap-2 rounded-full border border-cyan-300/15 bg-cyan-300/8 px-4 py-1.5 text-xs font-semibold text-cyan-200 shadow-[0_0_34px_rgba(34,211,238,0.12)]">
                <Sparkles className="h-3.5 w-3.5" />
                Planes simples, sin complicaciones
                <Sparkles className="h-3.5 w-3.5" />
              </div>

              <h1 className="mt-4 text-4xl font-semibold tracking-tight text-white sm:text-5xl lg:text-[3.35rem] lg:leading-[1.02]">
                Elige el plan ideal para hacer{" "}
                <span className="text-[#24e0d0]">crecer tu negocio</span>
              </h1>

              <p className="mx-auto mt-3 max-w-2xl text-base leading-7 text-slate-300">
                La IA atiende clientes. Orbyx organiza el negocio con agenda,
                campanas, WhatsApp y automatizacion.
              </p>

              <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
                <div className="inline-flex rounded-full border border-white/10 bg-white/6 p-1 text-sm font-semibold text-slate-300">
                  <span className="rounded-full bg-cyan-400/12 px-8 py-2 text-cyan-200">
                    Mensual
                  </span>
                  <span className="px-8 py-2">Anual</span>
                  <span className="rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-2 text-cyan-200">
                    -20%
                  </span>
                </div>
                <span className="text-sm font-semibold text-cyan-300">
                  Ahorra 2 meses con anual
                </span>
              </div>

              {from === "staff" ? (
                <div className="mx-auto mt-5 max-w-xl rounded-2xl border border-amber-300/20 bg-amber-400/10 px-4 py-3 text-sm text-amber-100">
                  Llegaste aqui porque alcanzaste el limite de profesionales de tu plan.
                </div>
              ) : null}
            </div>

            <div id="planes" className="mt-8 grid gap-4 md:grid-cols-2 2xl:grid-cols-4">
              {plans.map((plan) => {
                const isSelected = selectedPlan.key === plan.key;
                const isCurrentCard = hasBillingContext && initialPlan === plan.key;

                return (
                  <motion.button
                    key={plan.key}
                    type="button"
                    onClick={() => handleSelectPlan(plan.key)}
                    whileHover={{ y: isSelected ? -8 : -4 }}
                    animate={{ y: isSelected ? -8 : 0, scale: isSelected ? 1.018 : 1 }}
                    transition={{ type: "spring", stiffness: 260, damping: 24 }}
                    className={`relative isolate flex min-h-[430px] overflow-hidden rounded-[22px] border px-6 py-6 text-left transition ${
                      isSelected
                        ? `selected-plan-electric ${plan.borderClass} bg-[linear-gradient(180deg,rgba(11,35,45,0.96),rgba(3,13,25,0.98))] shadow-[0_0_0_1px_rgba(34,211,238,0.16),0_22px_70px_rgba(34,211,238,0.18)]`
                        : "border-white/12 bg-white/[0.035] shadow-[0_18px_50px_rgba(0,0,0,0.18)] hover:border-white/25 hover:bg-white/[0.055]"
                    }`}
                  >
                    <div className={`absolute inset-0 -z-10 bg-gradient-to-b ${plan.gradientClass} opacity-${isSelected ? "100" : "40"}`} />
                    <div className="absolute inset-x-5 top-0 -z-10 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />

                    {isSelected ? (
                      <>
                        <div className="pointer-events-none absolute inset-x-7 bottom-1 h-8 rounded-[100%] border border-cyan-300/45 bg-cyan-300/10 blur-[0.2px] selected-plan-orbit shadow-[0_0_32px_rgba(34,211,238,0.5)]" />
                        <div className="pointer-events-none absolute inset-x-10 bottom-4 h-px bg-gradient-to-r from-transparent via-cyan-200/80 to-transparent" />
                      </>
                    ) : null}

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
                        className={`inline-flex h-14 w-14 items-center justify-center rounded-full border ${
                          isSelected
                            ? "border-cyan-300/25 bg-cyan-300/14 text-cyan-200 shadow-[0_0_28px_rgba(34,211,238,0.28)]"
                            : "border-white/10 bg-white/7"
                        } ${plan.accentClass} ${isCurrentCard ? "mt-8" : ""}`}
                      >
                        <PlanIcon type={plan.icon} />
                      </span>

                      <p className="mt-5 text-2xl font-semibold text-white">{plan.name}</p>
                      <p className="mt-2 min-h-[52px] text-sm leading-6 text-slate-300">
                        {plan.subtitle}
                      </p>

                      <div className="mt-4 flex items-end gap-1">
                        <span className="text-[2rem] font-semibold leading-none tracking-tight text-white">
                          {plan.priceLabel}
                        </span>
                        <span className="pb-1 text-sm text-slate-400">{plan.ivaLabel}</span>
                      </div>

                      <div
                        className={`mt-5 inline-flex h-11 items-center justify-center rounded-lg border px-4 text-sm font-bold transition ${
                          isSelected
                            ? "border-cyan-300/20 bg-[#21d6c5] text-slate-950 shadow-[0_14px_34px_rgba(34,211,238,0.2)]"
                            : "border-white/15 bg-white/[0.035] text-white"
                        }`}
                      >
                        Elegir plan
                      </div>

                      <div className="mt-5 space-y-3 pb-3">
                        {plan.features.map((feature) => (
                          <div key={`${plan.key}-${feature.title}`} className="flex items-start gap-3">
                            <Check
                              className={`mt-0.5 h-4 w-4 shrink-0 ${
                                feature.highlight ? "text-cyan-300" : plan.accentClass
                              }`}
                            />
                            <span
                              className={`text-sm leading-5 ${
                                feature.highlight ? "font-semibold text-cyan-100" : "text-slate-300"
                              }`}
                            >
                              {feature.title}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </motion.button>
                );
              })}
            </div>

            <section className="mt-7 rounded-[18px] border border-white/12 bg-white/[0.035] p-4 shadow-[0_20px_70px_rgba(0,0,0,0.22)] backdrop-blur-xl sm:p-5">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-white">
                    Potencia tu plan con <span className="text-[#24e0d0]">add-ons</span>
                  </h2>
                  <p className="mt-1 text-sm leading-6 text-slate-300">
                    Contrata solo lo que necesitas. Escala cuando quieras.
                  </p>
                </div>

                <div className="flex flex-col gap-2 sm:flex-row">
                  <Link
                    href="/planes/comparar"
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-white/15 bg-white/[0.04] px-4 text-sm font-semibold text-white transition hover:border-cyan-300/35 hover:bg-cyan-300/8"
                  >
                    <BarChart3 className="h-4 w-4" />
                    Comparar planes
                  </Link>
                  <button
                    type="button"
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-white/15 bg-white/[0.04] px-4 text-sm font-semibold text-white transition hover:border-cyan-300/35 hover:bg-cyan-300/8"
                  >
                    <Megaphone className="h-4 w-4" />
                    Ver todos los add-ons
                    <ArrowRight className="h-4 w-4 text-cyan-300" />
                  </button>
                </div>
              </div>

              <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                {availableAddons.map((extraKey) => {
                  const config = extraConfig[extraKey];
                  const value = extraValue(extraKey);
                  const supported = extraSupported(extraKey);

                  return (
                    <div
                      key={extraKey}
                      className={`relative overflow-hidden rounded-xl border p-4 transition ${
                        supported
                          ? "border-white/12 bg-white/[0.04] hover:border-cyan-300/25"
                          : "border-white/8 bg-white/[0.025] opacity-55"
                      }`}
                    >
                      <div className={`absolute inset-0 -z-10 bg-gradient-to-br ${config.glow}`} />
                      <div className="flex min-h-[92px] items-start gap-3">
                        <span
                          className={`inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${config.iconClass}`}
                        >
                          {config.icon}
                        </span>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-white">{config.title}</p>
                          <p className="mt-1 text-sm leading-5 text-slate-300">{config.short}</p>
                        </div>
                      </div>

                      <div className="mt-4 flex items-end justify-between gap-3">
                        <div>
                          <p className="text-2xl font-semibold text-white">
                            {formatCLP(config.unitPrice)}
                            <span className="text-sm font-normal text-slate-400"> /mes</span>
                          </p>
                          <p className="mt-1 text-xs text-slate-400">{config.detail}</p>
                        </div>

                        <div className="flex items-center rounded-lg border border-white/12 bg-black/20">
                          <button
                            type="button"
                            onClick={() => decreaseExtra(extraKey)}
                            disabled={!supported || value <= 0}
                            className="inline-flex h-9 w-9 items-center justify-center text-slate-200 transition hover:bg-white/8 disabled:cursor-not-allowed disabled:opacity-35"
                            aria-label={`Quitar ${config.title}`}
                          >
                            <Minus className="h-4 w-4" />
                          </button>
                          <span className="min-w-8 text-center text-sm font-semibold text-white">
                            {value}
                          </span>
                          <button
                            type="button"
                            onClick={() => increaseExtra(extraKey)}
                            disabled={!supported}
                            className="inline-flex h-9 w-9 items-center justify-center text-slate-200 transition hover:bg-white/8 disabled:cursor-not-allowed disabled:opacity-35"
                            aria-label={`Agregar ${config.title}`}
                          >
                            +
                          </button>
                        </div>
                      </div>

                      {!supported ? (
                        <p className="mt-3 rounded-lg border border-white/8 bg-black/20 px-3 py-2 text-xs text-slate-400">
                          Disponible en planes superiores.
                        </p>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            </section>

            <div className="mt-5 grid gap-3 rounded-[16px] border border-white/10 bg-white/[0.035] p-4 text-sm text-slate-300 md:grid-cols-2 xl:grid-cols-4">
              {[
                ["7 dias gratis", "Prueba sin riesgos.", CalendarDays],
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

          <aside className="xl:sticky xl:top-5 xl:self-start">
            <div className="overflow-hidden rounded-[18px] border border-white/12 bg-[#06101d]/90 shadow-[0_24px_90px_rgba(0,0,0,0.32)] backdrop-blur-xl">
              <div className="border-b border-white/10 p-5">
                <div className="flex items-center gap-3">
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-300/10 text-cyan-300">
                    <Sparkles className="h-4 w-4" />
                  </span>
                  <h2 className="text-lg font-semibold text-white">Tu seleccion</h2>
                </div>

                <div className="mt-4 rounded-xl border border-white/10 bg-white/[0.035] p-4">
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

              <div className="p-5">
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
                  <SummaryLine label={summaryBaseLabel} value={summaryBaseAmount} />
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
                  </div>
                ) : null}

                {previewType === "downgrade" ? (
                  <div className="mt-4 rounded-xl border border-amber-300/15 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
                    El downgrade comenzara el{" "}
                    <span className="font-semibold">{billingEndLabel}</span>. Mantendras
                    tu plan actual hasta esa fecha.
                  </div>
                ) : null}

                <div className="mt-5">
                  <div className="mb-3 flex items-center justify-between">
                    <span className="text-sm font-semibold text-white">
                      Add-ons seleccionados
                    </span>
                    <span className="rounded-full bg-violet-500/25 px-3 py-1 text-xs font-bold text-violet-100">
                      {extraItems.length}
                    </span>
                  </div>

                  {extraItems.length === 0 ? (
                    <div className="rounded-xl border border-white/8 bg-white/[0.035] px-4 py-3 text-sm text-slate-400">
                      Aun no has agregado adicionales.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {extraItems.map((item) => (
                        <div
                          key={item.label}
                          className="rounded-xl border border-white/8 bg-white/[0.035] px-4 py-3"
                        >
                          <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-3">
                              <span className={`inline-flex h-8 w-8 items-center justify-center rounded-lg ${extraConfig[item.key].iconClass}`}>
                                {extraConfig[item.key].icon}
                              </span>
                              <div>
                                <p className="text-sm font-semibold text-white">{item.label}</p>
                                <p className="text-xs text-slate-400">
                                  {item.count} {extraConfig[item.key].unitLabel}
                                  {item.count === 1 ? "" : "es"}
                                </p>
                              </div>
                            </div>
                            <span className="text-sm font-semibold text-white">
                              {formatCLP(item.amount)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="mt-5 space-y-3 border-t border-white/10 pt-5">
                  <SummaryLine label="Subtotal" value={formatCLP(summarySubtotal)} />
                  <SummaryLine label="IVA (19%)" value={formatCLP(summaryIva)} />
                  <SummaryLine label="Total mensual" value={formatCLP(summaryTotal)} strong />
                </div>

                <div className="mt-5 rounded-xl border border-white/10 bg-white/[0.035] p-4">
                  <div className="flex items-start gap-3">
                    <Zap className="mt-0.5 h-5 w-5 shrink-0 text-amber-300" />
                    <p className="text-sm leading-6 text-slate-300">
                      {hasBillingContext
                        ? previewType === "downgrade"
                          ? "Seguiras con tu plan actual hasta el cierre del periodo."
                          : previewType === "same_plan"
                          ? "Tu plan base no se cobra de nuevo. Solo se suman adicionales visuales."
                          : "Cobro inmediato con prorrateo por los dias restantes del ciclo actual."
                        : "Referencia mensual con IVA. La contratacion final puede ajustarse al cerrar el pago."}
                    </p>
                  </div>
                </div>

                {applyError ? (
                  <div className="mt-4 rounded-xl border border-rose-300/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
                    {applyError}
                  </div>
                ) : null}

                {applyOk ? (
                  <div className="mt-4 rounded-xl border border-emerald-300/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">
                    {applyOk}
                  </div>
                ) : null}

                <div className="mt-5 space-y-3">
                  {hasBillingContext ? (
                    <button
                      type="button"
                      onClick={handleApplyPlanChange}
                      disabled={applying || previewLoading || !tenantId}
                      className="inline-flex h-14 w-full items-center justify-center rounded-lg bg-[#21d6c5] px-5 text-base font-black text-slate-950 shadow-[0_18px_45px_rgba(34,211,238,0.2)] transition hover:bg-[#45eadb] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {applying ? "Procesando..." : ctaLabel}
                    </button>
                  ) : (
                    <Link
                      href="/"
                      className="inline-flex h-14 w-full items-center justify-center rounded-lg bg-[#21d6c5] px-5 text-base font-black text-slate-950 shadow-[0_18px_45px_rgba(34,211,238,0.2)] transition hover:bg-[#45eadb]"
                    >
                      {ctaLabel}
                    </Link>
                  )}

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

                <div className="mt-5 rounded-xl border border-white/10 bg-white/[0.035] p-4">
                  <p className="text-sm font-semibold text-white">Que incluye este plan</p>
                  <div className="mt-4 space-y-3">
                    {selectedPlan.features.slice(0, 6).map((feature) => (
                      <div
                        key={`${selectedPlan.key}-summary-${feature.title}`}
                        className="flex items-start gap-3"
                      >
                        <Check
                          className={`mt-0.5 h-4 w-4 shrink-0 ${
                            feature.highlight ? "text-cyan-300" : selectedPlan.accentClass
                          }`}
                        />
                        <span className="text-sm leading-5 text-slate-300">{feature.title}</span>
                      </div>
                    ))}
                  </div>

                  <div className="mt-4 space-y-2 rounded-xl border border-white/8 bg-black/20 px-4 py-3">
                    <SummaryLine label="Sucursales incluidas" value={String(currentBranchTotal)} />
                    <SummaryLine label="Profesionales incluidos" value={String(currentStaffTotal)} />
                    <SummaryLine
                      label="Campanas por email"
                      value={selectedPlan.emailCampaignsIncluded ? "Incluidas" : "No incluidas"}
                    />
                    <SummaryLine
                      label="Recordatorios WhatsApp"
                      value={
                        currentReminderTotal > 0 ? `${currentReminderTotal} / mes` : "No incluidos"
                      }
                    />
                    <SummaryLine
                      label="Respuestas WhatsApp"
                      value={
                        selectedPlan.includedWhatsappResponseConversations > 0
                          ? `${selectedPlan.includedWhatsappResponseConversations} / mes`
                          : "No incluidas"
                      }
                    />
                    <SummaryLine
                      label="Campanas WhatsApp"
                      value={
                        currentCampaignTotal > 0
                          ? `${currentCampaignTotal} conversaciones`
                          : supportsCampaignExtra
                          ? "Disponible como adicional"
                          : "No incluidas"
                      }
                    />
                  </div>
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
          </aside>
        </div>
      </section>
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
