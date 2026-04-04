"use client";

import Link from "next/link";
import { Suspense, useEffect, useMemo, useState, type ReactNode } from "react";
import { useSearchParams } from "next/navigation";
import {
  Check,
  Crown,
  Gem,
  Mail,
  Megaphone,
  MessageCircle,
  Sparkles,
  Users,
  Building2,
  ArrowRight,
} from "lucide-react";

type PlanKey = "pro" | "premium" | "vip" | "platinum";
type ExtraKey = "staff" | "reminders" | "campaigns";

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

const BACKEND_URL = "https://orbyx-backend.onrender.com";
const SERVICES_PER_STAFF_EXTRA = 5;

const plans: Plan[] = [
  {
    key: "pro",
    name: "Pro",
    price: 19990,
    priceLabel: "$19.990",
    ivaLabel: "mes + iva",
    subtitle: "Ordena tu negocio y empieza a reservar online",
    benefit:
      "La base para profesionalizar tu agenda, ordenar tu operación y empezar a convertir reservas con una experiencia más clara.",
    includedBranches: 1,
    includedStaff: 2,
    includedServices: 10,
    includedReminderConversations: 0,
    includedWhatsappResponseConversations: 0,
    includedAiConversations: 0,
    emailCampaignsIncluded: false,
    extras: ["staff"],
    summaryTitle: "Plan Pro",
    summaryIntro:
      "Ideal para dar el primer paso: agenda online, reservas y operación básica bien ordenada.",
    features: [
      {
        title: "Agenda online y reservas públicas",
        description:
          "Permite que tus clientes reserven fácil, sin depender de mensajes manuales para cada hora.",
      },
      {
        title: "Gestión inicial del negocio",
        description:
          "Administra servicios, profesionales, horarios y clientes desde un mismo lugar.",
      },
      {
        title: "Emails de confirmación y notificación",
        description:
          "Mantén informados a tus clientes con correos automáticos en cada movimiento importante.",
      },
    ],
    icon: "mail",
    accentClass: "text-sky-300",
    softBgClass: "bg-sky-500/10",
    borderClass: "border-sky-400/25",
    ringClass: "ring-sky-400/30",
    gradientClass: "from-sky-500/18 via-slate-900/0 to-slate-900/0",
  },
  {
    key: "premium",
    name: "Premium",
    price: 29990,
    priceLabel: "$29.990",
    ivaLabel: "mes + iva",
    subtitle: "Más control, mejor seguimiento y menos ausencias",
    benefit:
      "Para negocios que necesitan una operación más sólida, mejor comunicación y menos horas perdidas por falta de seguimiento.",
    includedBranches: 2,
    includedStaff: 5,
    includedServices: 25,
    includedReminderConversations: 0,
    includedWhatsappResponseConversations: 0,
    includedAiConversations: 0,
    emailCampaignsIncluded: false,
    extras: ["staff"],
    summaryTitle: "Plan Premium",
    summaryIntro:
      "Perfecto para ordenar mejor tu operación, reducir ausencias y dar una experiencia más profesional.",
    features: [
      {
        title: "Recordatorios automáticos por email",
        description:
          "Reduce ausencias recordando cada cita antes de que se pierda una hora valiosa.",
      },
      {
        title: "Operación más profesional",
        description:
          "Mejora el seguimiento del negocio con más capacidad para servicios, staff y sucursales.",
      },
      {
        title: "Más control para crecer",
        description:
          "Escala tu operación sin desorden, manteniendo una experiencia más consistente para tus clientes.",
      },
    ],
    icon: "sparkles",
    accentClass: "text-violet-300",
    softBgClass: "bg-violet-500/10",
    borderClass: "border-violet-400/25",
    ringClass: "ring-violet-400/30",
    gradientClass: "from-violet-500/18 via-slate-900/0 to-slate-900/0",
  },
  {
    key: "vip",
    name: "VIP",
    price: 79990,
    priceLabel: "$79.990",
    ivaLabel: "mes + iva",
    subtitle: "Activa clientes y responde más rápido por WhatsApp",
    benefit:
      "El plan ideal para reactivar clientes, reducir ausencias y atender mejor por WhatsApp sin cargar todo manualmente.",
    badge: "Más elegido",
    includedBranches: 3,
    includedStaff: 10,
    includedServices: 50,
    includedReminderConversations: 200,
    includedWhatsappResponseConversations: 200,
    includedAiConversations: 200,
    emailCampaignsIncluded: true,
    extras: ["staff", "reminders", "campaigns"],
    summaryTitle: "Plan VIP",
    summaryIntro:
      "Da un salto en activación y atención: campañas por email, recordatorios por WhatsApp e IA que responde consultas.",
    features: [
      {
        title: "Campañas por email incluidas",
        description:
          "Vuelve a hablarle a tu base de clientes para activar la agenda y mover promociones o novedades.",
        highlight: true,
      },
      {
        title: "Recordatorios por WhatsApp",
        description:
          "Reduce ausencias desde un canal mucho más directo y efectivo para tus clientes.",
      },
      {
        title: "IA que responde consultas por WhatsApp",
        description:
          "Responde preguntas frecuentes, orienta al cliente y lo deriva a tu página de reservas para que agende online.",
      },
    ],
    icon: "crown",
    accentClass: "text-amber-300",
    softBgClass: "bg-amber-500/10",
    borderClass: "border-amber-400/25",
    ringClass: "ring-amber-400/30",
    gradientClass: "from-amber-500/18 via-slate-900/0 to-slate-900/0",
  },
  {
    key: "platinum",
    name: "Platinum",
    price: 189990,
    priceLabel: "$189.990",
    ivaLabel: "mes + iva",
    subtitle: "Automatiza tu negocio y convierte más reservas",
    benefit:
      "Pensado para negocios que quieren que Orbyx responda, haga seguimiento y trabaje por su agenda incluso cuando no están disponibles.",
    badge: "IA avanzada",
    includedBranches: 10,
    includedStaff: 20,
    includedServices: 100,
    includedReminderConversations: 800,
    includedWhatsappResponseConversations: 800,
    includedAiConversations: 800,
    emailCampaignsIncluded: true,
    extras: ["staff", "reminders", "campaigns"],
    summaryTitle: "Plan Platinum",
    summaryIntro:
      "La capa premium para automatizar atención, recuperar clientes y hacer crecer tu negocio con IA avanzada.",
    features: [
      {
        title: "Automatizaciones avanzadas",
        description:
          "Recupera clientes inactivos, da seguimiento automático y trabaja mejor los no-show sin mover un dedo.",
        highlight: true,
      },
      {
        title: "IA avanzada en WhatsApp",
        description:
          "Responde, propone horarios, ayuda a concretar reservas y hace seguimiento automático de conversaciones.",
      },
      {
        title: "Encuestas inteligentes post atención",
        description:
          "Mide satisfacción por email, detecta clientes insatisfechos y convierte buenas experiencias en mejores oportunidades.",
      },
    ],
    icon: "gem",
    accentClass: "text-emerald-300",
    softBgClass: "bg-emerald-500/10",
    borderClass: "border-emerald-400/25",
    ringClass: "ring-emerald-400/30",
    gradientClass: "from-emerald-500/18 via-slate-900/0 to-slate-900/0",
  },
];

const extraConfig = {
  staff: {
    title: "Profesionales extra",
    short: "$6.000 · 1 profesional + 5 servicios",
    unitPrice: 6000,
  },
  reminders: {
    title: "Pack recordatorios WhatsApp",
    short: "$5.000 · 50 conversaciones",
    unitPrice: 5000,
  },
  campaigns: {
    title: "Campañas WhatsApp bajo consumo",
    short: "$9.000 + iva · 50 conversaciones",
    unitPrice: 9000,
  },
} as const;

function formatCLP(value: number) {
  return `$${value.toLocaleString("es-CL")}`;
}

function formatDate(dateString?: string | null) {
  if (!dateString) return "—";

  const date = new Date(dateString);

  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleDateString("es-CL", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function formatRemainingDays(value?: number | null) {
  if (value == null || Number.isNaN(Number(value))) return "—";
  return `${Math.max(0, Math.round(Number(value)))} días`;
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
  if (!planKey) return "—";
  const found = plans.find((plan) => plan.key === planKey);
  return found?.name || String(planKey);
}

function PlanIcon({ type }: { type: Plan["icon"] }) {
  if (type === "mail") return <Mail className="h-5 w-5" />;
  if (type === "sparkles") return <Sparkles className="h-5 w-5" />;
  if (type === "crown") return <Crown className="h-5 w-5" />;
  return <Gem className="h-5 w-5" />;
}

function getExtraAccent(extraKey: ExtraKey) {
  if (extraKey === "staff") {
    return {
      icon: "bg-indigo-500/15 text-indigo-200",
      control: "border-indigo-400/25 text-indigo-100 hover:bg-indigo-500/15",
      info: "border-indigo-400/20 bg-indigo-500/10 text-indigo-100",
    };
  }

  if (extraKey === "reminders") {
    return {
      icon: "bg-emerald-500/15 text-emerald-200",
      control:
        "border-emerald-400/25 text-emerald-100 hover:bg-emerald-500/15",
      info: "border-emerald-400/20 bg-emerald-500/10 text-emerald-100",
    };
  }

  return {
    icon: "bg-amber-500/15 text-amber-200",
    control: "border-amber-400/25 text-amber-100 hover:bg-amber-500/15",
    info: "border-amber-400/20 bg-amber-500/10 text-amber-100",
  };
}

function CompactExtraRow({
  title,
  shortText,
  infoText,
  value,
  onDecrease,
  onIncrease,
  icon,
  accent,
}: {
  title: string;
  shortText: string;
  infoText: string;
  value: number;
  onDecrease: () => void;
  onIncrease: () => void;
  icon: ReactNode;
  accent: {
    icon: string;
    control: string;
    info: string;
  };
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_150px] lg:items-center">
        <div className="min-w-0">
          <div className="flex items-start gap-3">
            <div
              className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ${accent.icon}`}
            >
              {icon}
            </div>

            <div className="min-w-0">
              <p className="text-sm font-semibold text-white">{title}</p>
              <p className="mt-1 text-sm text-slate-300">{shortText}</p>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-center gap-3 lg:justify-end">
          <button
            type="button"
            onClick={onDecrease}
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-xl text-slate-200 transition hover:bg-white/10"
          >
            −
          </button>

          <span className="min-w-[24px] text-center text-lg font-semibold text-white">
            {value}
          </span>

          <button
            type="button"
            onClick={onIncrease}
            className={`inline-flex h-10 w-10 items-center justify-center rounded-xl border bg-white/5 text-xl transition ${accent.control}`}
          >
            +
          </button>
        </div>
      </div>

      <div
        className={`mt-3 rounded-xl border px-3 py-2 text-sm leading-6 ${accent.info}`}
      >
        {infoText}
      </div>
    </div>
  );
}

function IncludeRow({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="flex items-center justify-between border-b border-white/8 py-2 last:border-b-0">
      <span className="text-sm text-slate-300">{label}</span>
      <span className="text-right text-sm font-semibold text-white">{value}</span>
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

  const extrasSubtotal = useMemo(() => {
    let total = 0;

    if (supportsStaffExtra) total += staffExtras * extraConfig.staff.unitPrice;
    if (supportsReminderExtra) {
      total += reminderExtras * extraConfig.reminders.unitPrice;
    }
    if (supportsCampaignExtra) {
      total += campaignExtras * extraConfig.campaigns.unitPrice;
    }

    return total;
  }, [
    campaignExtras,
    reminderExtras,
    staffExtras,
    supportsCampaignExtra,
    supportsReminderExtra,
    supportsStaffExtra,
  ]);

  const previewAmountToday = Number(preview?.amount_today || 0);
  const payTodaySubtotal = previewAmountToday + extrasSubtotal;
  const payTodayIva = Math.round(payTodaySubtotal * 0.19);
  const payTodayTotal = payTodaySubtotal + payTodayIva;

  const currentStaffTotal = selectedPlan.includedStaff + staffExtras;
  const currentServicesTotal =
    selectedPlan.includedServices + staffExtras * SERVICES_PER_STAFF_EXTRA;
  const currentReminderTotal =
    selectedPlan.includedReminderConversations + reminderExtras * 50;
  const currentCampaignTotal = campaignExtras * 50;

  const extraItems = useMemo(() => {
    const items: { label: string; amount: number }[] = [];

    if (supportsStaffExtra && staffExtras > 0) {
      items.push({
        label: `Profesional extra x${staffExtras}`,
        amount: staffExtras * extraConfig.staff.unitPrice,
      });
    }

    if (supportsReminderExtra && reminderExtras > 0) {
      items.push({
        label: `Pack recordatorios WhatsApp x${reminderExtras}`,
        amount: reminderExtras * extraConfig.reminders.unitPrice,
      });
    }

    if (supportsCampaignExtra && campaignExtras > 0) {
      items.push({
        label: `Campañas WhatsApp x${campaignExtras}`,
        amount: campaignExtras * extraConfig.campaigns.unitPrice,
      });
    }

    return items;
  }, [
    campaignExtras,
    reminderExtras,
    staffExtras,
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
      } catch (error: any) {
        setPreviewError(
          error?.message || "No se pudo calcular el cambio de plan"
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
    } catch (error: any) {
      setApplyError(error?.message || "No se pudo aplicar el cambio de plan");
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
      ? "Elegir este plan"
      : previewType === "same_plan"
      ? "Mantener este plan"
      : previewType === "downgrade"
      ? "Programar downgrade"
      : "Cambiar ahora";

  const showTenantWarning = !tenantId && Boolean(from || slug);

  const publicReferenceTotal =
    selectedPlan.price + extrasSubtotal + Math.round(extrasSubtotal * 0.19);

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(99,102,241,0.18),_transparent_22%),radial-gradient(circle_at_left,_rgba(14,165,233,0.12),_transparent_28%),linear-gradient(180deg,_#0b1120_0%,_#0f172a_40%,_#111827_100%)] text-white">
      <section className="mx-auto w-full max-w-[1600px] px-4 py-6 lg:px-8 2xl:px-10">
        <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_420px]">
          <div>
            <div className="rounded-[34px] border border-white/10 bg-white/6 p-5 shadow-[0_30px_90px_rgba(15,23,42,0.34)] backdrop-blur-xl lg:p-7">
              <div className="max-w-4xl">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="inline-flex rounded-full border border-indigo-400/20 bg-indigo-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-indigo-200">
                    Planes Orbyx
                  </span>

                  <Link
                    href="/"
                    className="text-xs font-medium text-slate-400 transition hover:text-white"
                  >
                    Volver al inicio
                  </Link>
                </div>

                <h1 className="mt-4 max-w-3xl text-3xl font-semibold tracking-tight text-white lg:text-[2.8rem] lg:leading-[1.05]">
                  Elige el plan ideal para llenar tu agenda y hacer crecer tu negocio
                </h1>

                <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-300 lg:text-base">
                  Empieza ordenando tu operación y avanza hacia recordatorios,
                  campañas, automatizaciones e IA según la etapa en la que está tu negocio.
                </p>

                {from === "staff" ? (
                  <div className="mt-5 rounded-2xl border border-amber-400/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
                    Llegaste aquí porque alcanzaste el límite de profesionales de tu
                    plan.
                  </div>
                ) : null}
              </div>

              <div className="mt-7 grid gap-4 xl:grid-cols-4">
                {plans.map((plan) => {
                  const isSelected = selectedPlan.key === plan.key;
                  const isCurrentCard =
                    hasBillingContext && initialPlan === plan.key;

                  return (
                    <button
                      key={plan.key}
                      type="button"
                      onClick={() => handleSelectPlan(plan.key)}
                      className={`relative flex min-h-[420px] flex-col rounded-3xl border px-5 py-5 text-left transition ${
                        isSelected
                          ? `scale-[1.02] bg-[linear-gradient(180deg,rgba(255,255,255,0.12),rgba(255,255,255,0.06))] ${plan.borderClass} ${plan.softBgClass} ring-1 ring-white/20 shadow-[0_18px_45px_rgba(0,0,0,0.35)]`
                          : "border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/8"
                      }`}
                    >
                      {plan.badge ? (
                        <span className="absolute right-4 top-4 rounded-full bg-white px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-slate-900">
                          {plan.badge}
                        </span>
                      ) : null}

                      {isCurrentCard ? (
                        <span className="absolute left-4 top-4 rounded-full border border-emerald-400/25 bg-emerald-500/15 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-emerald-200">
                          Plan actual
                        </span>
                      ) : null}

                      <span
                        className={`inline-flex h-11 w-11 items-center justify-center rounded-2xl ${
                          isSelected ? "bg-white/12" : "bg-white/8"
                        } ${plan.accentClass} ${isCurrentCard ? "mt-6" : ""}`}
                      >
                        <PlanIcon type={plan.icon} />
                      </span>

                      <p className="mt-4 text-xl font-semibold text-white">{plan.name}</p>

                      <p className="mt-2 text-sm leading-7 text-slate-200">
                        {plan.subtitle}
                      </p>

                      <p className="mt-4 text-sm leading-7 text-slate-400">
                        {plan.benefit}
                      </p>

                      <div className="mt-auto pt-6">
                        <div className="rounded-2xl border border-white/10 bg-black/10 px-4 py-4">
                          <p className="text-[1.95rem] font-semibold leading-none tracking-tight text-white lg:text-[2.05rem]">
                            {plan.priceLabel}
                          </p>
                          <p className="mt-2 text-sm text-slate-400">
                            {plan.ivaLabel}
                          </p>
                        </div>

                        <div className="mt-5 flex items-center gap-2 text-sm font-medium text-slate-200">
                          <ArrowRight className="h-4 w-4" />
                          Seleccionar plan
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="mt-8 rounded-[26px] border border-white/10 bg-white/6 p-5 shadow-[0_18px_60px_rgba(15,23,42,0.22)] backdrop-blur-xl">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
                  <div>
                    <p className="text-lg font-semibold text-white">
                      Adicionales y consumo
                    </p>
                    <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-300">
                      Los adicionales se habilitan según el plan. Las campañas por
                      WhatsApp funcionan bajo consumo y no vienen incluidas por defecto.
                    </p>
                    <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">
                      Los bloques mensuales incluidos y adicionales no son acumulables y
                      deben utilizarse dentro del mes.
                    </p>
                  </div>

                  <div className="flex flex-col items-end gap-2">
                    <Link
                      href="/planes/comparar"
                      className="text-sm font-semibold text-indigo-300 underline underline-offset-4 transition hover:text-white hover:drop-shadow-[0_0_6px_rgba(99,102,241,0.6)]"
                    >
                      Ver cuadro comparativo de planes
                    </Link>

                    <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                        Selección actual
                      </p>
                      <p className="mt-1 text-sm font-semibold text-white">
                        {selectedPlan.name}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-5 space-y-3">
                  {supportsStaffExtra ? (
                    <CompactExtraRow
                      title={extraConfig.staff.title}
                      shortText={extraConfig.staff.short}
                      infoText={`Tu plan ahora cuenta con ${currentStaffTotal} profesionales y ${currentServicesTotal} servicios.`}
                      value={staffExtras}
                      onDecrease={() => decreaseExtra("staff")}
                      onIncrease={() => increaseExtra("staff")}
                      accent={getExtraAccent("staff")}
                      icon={<Users className="h-5 w-5" />}
                    />
                  ) : null}

                  {supportsReminderExtra ? (
                    <CompactExtraRow
                      title={extraConfig.reminders.title}
                      shortText={extraConfig.reminders.short}
                      infoText={`Tu plan ahora cuenta con ${currentReminderTotal} conversaciones de recordatorio.`}
                      value={reminderExtras}
                      onDecrease={() => decreaseExtra("reminders")}
                      onIncrease={() => increaseExtra("reminders")}
                      accent={getExtraAccent("reminders")}
                      icon={<MessageCircle className="h-5 w-5" />}
                    />
                  ) : null}

                  {supportsCampaignExtra ? (
                    <CompactExtraRow
                      title={extraConfig.campaigns.title}
                      shortText={extraConfig.campaigns.short}
                      infoText={`Llevas ${currentCampaignTotal} conversaciones de campañas WhatsApp seleccionadas como extra. No son acumulables y deben usarse dentro del mes.`}
                      value={campaignExtras}
                      onDecrease={() => decreaseExtra("campaigns")}
                      onIncrease={() => increaseExtra("campaigns")}
                      accent={getExtraAccent("campaigns")}
                      icon={<Megaphone className="h-5 w-5" />}
                    />
                  ) : null}
                </div>
              </div>
            </div>
          </div>

          <div className="xl:sticky xl:top-6 xl:self-start">
            <div className="overflow-hidden rounded-[32px] border border-white/10 bg-white/8 shadow-[0_28px_90px_rgba(15,23,42,0.34)] backdrop-blur-xl">
              <div
                className={`border-b p-6 ${selectedPlan.borderClass} ${selectedPlan.softBgClass} bg-gradient-to-br ${selectedPlan.gradientClass}`}
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 ${selectedPlan.accentClass}`}
                  >
                    <PlanIcon type={selectedPlan.icon} />
                  </span>
                  <div>
                    <p className="text-xl font-semibold text-white">
                      {selectedPlan.summaryTitle}
                    </p>
                    <p className="text-sm text-slate-300">
                      {selectedPlan.summaryIntro}
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-6">
                {hasBillingContext && previewLoading ? (
                  <div className="mb-4 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-300">
                    Calculando cambio de plan...
                  </div>
                ) : null}

                {hasBillingContext && previewError ? (
                  <div className="mb-4 rounded-2xl border border-rose-300/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
                    {previewError}
                  </div>
                ) : null}

                {hasBillingContext && !previewLoading && !previewError && previewType ? (
                  <div
                    className={`mb-4 rounded-2xl border px-4 py-3 text-sm ${
                      previewType === "same_plan"
                        ? "border-emerald-300/20 bg-emerald-500/10 text-emerald-100"
                        : previewType === "downgrade"
                        ? "border-amber-300/20 bg-amber-500/10 text-amber-100"
                        : "border-sky-300/20 bg-sky-500/10 text-sky-100"
                    }`}
                  >
                    {preview?.message ||
                      (previewType === "downgrade"
                        ? "Este cambio quedará programado para el siguiente ciclo."
                        : previewType === "same_plan"
                        ? "Ya estás en este plan."
                        : "Este cambio se aplicará de inmediato.")}
                  </div>
                ) : null}

                <div className="space-y-3">
                  {extraItems.length === 0 ? (
                    <div className="rounded-2xl bg-white/5 px-4 py-3 text-sm text-slate-300">
                      Aún no has agregado adicionales.
                    </div>
                  ) : (
                    extraItems.map((item) => (
                      <div
                        key={item.label}
                        className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3"
                      >
                        <span className="text-sm text-slate-200">
                          {item.label}
                        </span>
                        <span className="text-sm font-semibold text-white">
                          {formatCLP(item.amount)}
                        </span>
                      </div>
                    ))
                  )}
                </div>

                {hasBillingContext ? (
                  <div className="mt-5 space-y-3 rounded-2xl border border-white/10 bg-white/5 p-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-300">Plan actual</span>
                      <span className="text-sm font-semibold text-white">
                        {planNameFromKey(initialPlan)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-300">Plan seleccionado</span>
                      <span className="text-sm font-semibold text-white">
                        {selectedPlan.name}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-300">
                        {previewType === "same_plan"
                          ? "Plan base a pagar hoy"
                          : previewType === "downgrade"
                          ? "Cambio de plan hoy"
                          : "Cambio inmediato de plan"}
                      </span>
                      <span className="text-sm font-semibold text-white">
                        {previewType === "downgrade"
                          ? "$0"
                          : formatCLP(previewAmountToday)}
                      </span>
                    </div>

                    {previewType === "upgrade" ? (
                      <>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-slate-300">
                            Días restantes del ciclo
                          </span>
                          <span className="text-sm font-semibold text-white">
                            {remainingDaysLabel}
                          </span>
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="text-sm text-slate-300">
                            Crédito proporcional plan actual
                          </span>
                          <span className="text-sm font-semibold text-emerald-300">
                            - {formatCLP(Number(preview?.credit || 0))}
                          </span>
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="text-sm text-slate-300">
                            Cargo proporcional nuevo plan
                          </span>
                          <span className="text-sm font-semibold text-white">
                            {formatCLP(Number(preview?.charge || 0))}
                          </span>
                        </div>

                        <div className="rounded-2xl border border-sky-300/15 bg-sky-500/10 px-3 py-3 text-sm text-sky-100">
                          Te quedan <span className="font-semibold">{remainingDaysLabel}</span>{" "}
                          en tu ciclo actual. El crédito y el cobro se calcularon solo
                          sobre ese período.
                        </div>
                      </>
                    ) : null}

                    {previewType === "downgrade" ? (
                      <div className="rounded-2xl border border-amber-300/15 bg-amber-500/10 px-3 py-3 text-sm text-amber-100">
                        El downgrade comenzará el{" "}
                        <span className="font-semibold">{billingEndLabel}</span>.
                        <div className="mt-1 text-xs text-amber-50/90">
                          Mantendrás tu plan actual hasta esa fecha.
                        </div>
                      </div>
                    ) : null}

                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-300">
                        Adicionales seleccionados
                      </span>
                      <span className="text-sm font-semibold text-white">
                        {extrasSubtotal > 0 ? formatCLP(extrasSubtotal) : "$0"}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-300">IVA</span>
                      <span className="text-sm font-semibold text-white">
                        {payTodaySubtotal > 0 ? formatCLP(payTodayIva) : "$0"}
                      </span>
                    </div>

                    <div className="flex items-center justify-between border-t border-white/10 pt-3">
                      <span className="text-sm font-semibold text-white">
                        Pagar hoy
                      </span>
                      <span className="text-sm font-semibold text-emerald-300">
                        {payTodaySubtotal > 0 ? formatCLP(payTodayTotal) : "$0"}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="mt-5 space-y-3 rounded-2xl border border-white/10 bg-white/5 p-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-300">Plan seleccionado</span>
                      <span className="text-sm font-semibold text-white">
                        {selectedPlan.name}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-300">Valor mensual</span>
                      <span className="text-sm font-semibold text-white">
                        {selectedPlan.priceLabel}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-300">
                        Adicionales seleccionados
                      </span>
                      <span className="text-sm font-semibold text-white">
                        {extrasSubtotal > 0 ? formatCLP(extrasSubtotal) : "$0"}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-300">IVA</span>
                      <span className="text-sm font-semibold text-white">
                        {extrasSubtotal > 0
                          ? formatCLP(Math.round(extrasSubtotal * 0.19))
                          : "$0"}
                      </span>
                    </div>

                    <div className="flex items-center justify-between border-t border-white/10 pt-3">
                      <span className="text-sm font-semibold text-white">
                        Referencia mensual
                      </span>
                      <span className="text-sm font-semibold text-emerald-300">
                        {formatCLP(publicReferenceTotal)}
                      </span>
                    </div>
                  </div>
                )}

                {applyError ? (
                  <div className="mt-4 rounded-2xl border border-rose-300/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
                    {applyError}
                  </div>
                ) : null}

                {applyOk ? (
                  <div className="mt-4 rounded-2xl border border-emerald-300/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">
                    {applyOk}
                  </div>
                ) : null}

                <div className="mt-5 space-y-3">
                  <button
                    type="button"
                    onClick={hasBillingContext ? handleApplyPlanChange : undefined}
                    disabled={hasBillingContext ? applying || previewLoading || !tenantId : true}
                    className="inline-flex h-14 w-full items-center justify-center rounded-2xl bg-gradient-to-r from-violet-600 via-indigo-600 to-sky-500 px-5 text-base font-semibold text-white shadow-[0_0_0_1px_rgba(255,255,255,0.12),0_18px_40px_rgba(79,70,229,0.38)] transition hover:scale-[1.01] hover:shadow-[0_0_0_1px_rgba(255,255,255,0.18),0_22px_50px_rgba(79,70,229,0.46)] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {applying ? "Procesando..." : ctaLabel}
                  </button>

                  {showTenantWarning ? (
                    <div className="rounded-2xl border border-amber-300/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
                      Falta <span className="font-semibold">tenant_id</span> en la URL
                      para aplicar el cambio real.
                    </div>
                  ) : null}

                  {hasBillingContext ? (
                    <p className="text-center text-xs leading-5 text-slate-400">
                      {previewType === "downgrade"
                        ? "Seguirás con tu plan actual hasta el cierre del período."
                        : previewType === "same_plan"
                        ? "Tu plan base no se cobra de nuevo. Solo se suman adicionales."
                        : "El upgrade se activa de inmediato con prorrateo del período restante."}
                    </p>
                  ) : (
                    <p className="text-center text-xs leading-5 text-slate-400">
                      Selecciona un plan para revisar lo que incluye y la referencia mensual.
                    </p>
                  )}

                  {slug ? (
                    <Link
                      href={`/dashboard/${slug}/staff`}
                      className="inline-flex h-11 w-full items-center justify-center rounded-2xl border border-white/10 bg-white/5 px-5 text-sm font-medium text-white transition hover:bg-white/10"
                    >
                      Volver al panel
                    </Link>
                  ) : null}
                </div>

                <div className="mt-5 rounded-[22px] border border-white/10 bg-white/5 p-4">
                  <p className="text-sm font-semibold text-white">
                    Qué incluye este plan
                  </p>

                  <div className="mt-4 space-y-3">
                    {selectedPlan.features.map((feature) => (
                      <div
                        key={`${selectedPlan.key}-${feature.title}`}
                        className="flex items-start gap-3"
                      >
                        <Check
                          className={`mt-1 h-4 w-4 shrink-0 ${
                            feature.highlight
                              ? "text-violet-300"
                              : selectedPlan.accentClass
                          }`}
                        />
                        <div>
                          <p
                            className={`text-sm font-semibold ${
                              feature.highlight ? "text-violet-200" : "text-white"
                            }`}
                          >
                            {feature.title}
                          </p>
                          {feature.description ? (
                            <p className="mt-1 text-sm leading-6 text-slate-300">
                              {feature.description}
                            </p>
                          ) : null}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                    <IncludeRow
                      label="Sucursales incluidas"
                      value={selectedPlan.includedBranches}
                    />
                    <IncludeRow
                      label="Profesionales incluidos"
                      value={currentStaffTotal}
                    />
                    <IncludeRow
                      label="Servicios incluidos"
                      value={currentServicesTotal}
                    />
                    <IncludeRow
                      label="Campañas por email"
                      value={
                        selectedPlan.emailCampaignsIncluded
                          ? "Incluidas"
                          : "No incluidas"
                      }
                    />
                    <IncludeRow
                      label="Recordatorios por WhatsApp"
                      value={
                        selectedPlan.includedReminderConversations > 0
                          ? "Incluidos"
                          : "No incluidos"
                      }
                    />
                    <IncludeRow
                      label="Respuestas por WhatsApp"
                      value={
                        selectedPlan.includedWhatsappResponseConversations > 0
                          ? "Incluidas"
                          : "No incluidas"
                      }
                    />
                    <IncludeRow
                      label="Campañas por WhatsApp"
                      value={
                        supportsCampaignExtra
                          ? "Disponibles como adicional"
                          : "No incluidas"
                      }
                    />
                    <IncludeRow
                      label="IA integrada en WhatsApp"
                      value={
                        selectedPlan.key === "vip"
                          ? "Incluida para responder y derivar a reserva"
                          : selectedPlan.key === "platinum"
                          ? "Incluida para responder, seguir y automatizar"
                          : "No incluida"
                      }
                    />
                  </div>
                </div>

                <div className="mt-5 rounded-[22px] border border-white/10 bg-white/5 p-4">
                  <div className="flex items-center gap-3">
                    <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-white/10 text-slate-200">
                      <Building2 className="h-5 w-5" />
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-white">
                        Multi-sucursal incluida
                      </p>
                      <p className="text-sm text-slate-300">
                        Hasta {selectedPlan.includedBranches} sucursal
                        {selectedPlan.includedBranches === 1 ? "" : "es"}.
                      </p>
                    </div>
                  </div>
                </div>

                {hasBillingContext && previewType === "downgrade" ? (
                  <div className="mt-5 rounded-[22px] border border-amber-300/20 bg-amber-500/10 p-4">
                    <p className="text-sm font-semibold text-amber-100">
                      Importante para el downgrade
                    </p>
                    <p className="mt-2 text-sm leading-6 text-amber-50/90">
                      Antes de la fecha de cambio, el panel deberá permitirte elegir
                      qué profesionales, servicios o sucursales quieres mantener activos
                      dentro del nuevo límite.
                    </p>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
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