"use client";

import Link from "next/link";
import { useMemo, useState, type ReactNode } from "react";
import {
  Bot,
  Check,
  Crown,
  Gem,
  Mail,
  Megaphone,
  MessageCircle,
  Sparkles,
  Users,
  Building2,
} from "lucide-react";

type PlanKey = "pro" | "premium" | "vip" | "platinum";
type ExtraKey = "staff" | "reminders" | "campaigns" | "ai";

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
  badge?: string;
  includedBranches: number;
  includedStaff: number;
  includedServices: number;
  includedReminderConversations: number;
  includedCampaignConversations: number;
  includedAiConversations: number;
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

const SERVICES_PER_STAFF_EXTRA = 5;

const plans: Plan[] = [
  {
    key: "pro",
    name: "Pro",
    price: 24990,
    priceLabel: "$24.990",
    ivaLabel: "mes + iva",
    subtitle: "Empieza a ordenar tu negocio",
    includedBranches: 1,
    includedStaff: 2,
    includedServices: 10,
    includedReminderConversations: 0,
    includedCampaignConversations: 0,
    includedAiConversations: 0,
    extras: ["staff"],
    summaryTitle: "Plan Pro",
    summaryIntro: "La base ideal para comenzar a profesionalizar tu agenda.",
    features: [
      {
        title: "Todo lo esencial para comenzar",
        description:
          "Agenda online, página pública de reservas, gestión de citas, servicios, profesionales y clientes.",
      },
      {
        title: "Emails automatizados básicos",
        description:
          "Confirmación de citas por email para mantener informado al cliente.",
      },
      {
        title: "Control operativo inicial",
        description:
          "Configuración de horarios y disponibilidad para ordenar mejor tu agenda.",
      },
      {
        title: "Visibilidad del negocio",
        description:
          "Estadísticas básicas para entender tu operación desde el inicio.",
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
    price: 44990,
    priceLabel: "$44.990",
    ivaLabel: "mes + iva",
    subtitle: "Más control y mejor comunicación con tus clientes",
    includedBranches: 2,
    includedStaff: 5,
    includedServices: 25,
    includedReminderConversations: 0,
    includedCampaignConversations: 0,
    includedAiConversations: 0,
    extras: ["staff"],
    summaryTitle: "Plan Premium",
    summaryIntro: "Para negocios que necesitan mejor seguimiento y comunicación.",
    features: [
      {
        title: "Todo lo del plan Pro",
        description:
          "Mantienes toda la base operativa de agenda y clientes del plan inicial.",
      },
      {
        title: "Recordatorios por email",
        description:
          "Envía recordatorios automáticos para reducir ausencias y mejorar asistencia.",
      },
      {
        title: "Notificaciones automáticas",
        description:
          "Informa cambios o cancelaciones de forma más profesional y automática.",
      },
      {
        title: "Campañas por email",
        description:
          "Comunícate masivamente con tus clientes a través de promociones y mensajes directos.",
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
    subtitle: "Reduce ausencias y mantén un mejor contacto con tus clientes",
    badge: "Más elegido",
    includedBranches: 3,
    includedStaff: 10,
    includedServices: 50,
    includedReminderConversations: 200,
    includedCampaignConversations: 0,
    includedAiConversations: 0,
    extras: ["staff", "reminders", "campaigns"],
    summaryTitle: "Plan VIP",
    summaryIntro:
      "Incorpora WhatsApp a tu operación sin entrar todavía en automatización con IA.",
    features: [
      {
        title: "Todo lo del plan Premium",
        description:
          "Mantienes la base de agenda, clientes y comunicación por email.",
      },
      {
        title: "Más control del negocio",
        description:
          "Accede a estadísticas avanzadas y una personalización más sólida de tu marca.",
      },
      {
        title: "Recordatorios por WhatsApp",
        description:
          "Incluye recordatorios automáticos para reducir no-show y mejorar ocupación.",
      },
      {
        title: "Encuestas automáticas por email",
        description:
          "Envía encuestas de satisfacción después de cada atención para mejorar la experiencia de tus clientes.",
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
    price: 229990,
    priceLabel: "$229.990",
    ivaLabel: "mes + iva",
    subtitle: "La IA trabaja por tu negocio incluso cuando no estás disponible",
    badge: "IA incluida",
    includedBranches: 10,
    includedStaff: 20,
    includedServices: 100,
    includedReminderConversations: 400,
    includedCampaignConversations: 50,
    includedAiConversations: 200,
    extras: ["staff", "reminders", "campaigns", "ai"],
    summaryTitle: "Plan Platinum",
    summaryIntro:
      "Una operación premium con WhatsApp e inteligencia artificial trabajando para generar más reservas.",
    features: [
      {
        title: "Todo lo del plan VIP",
        description:
          "Mantienes toda la capacidad operativa, el control y la comunicación del plan superior.",
      },
      {
        title: "Atención automática por WhatsApp con IA",
        description:
          "La IA responde consultas y ayuda a cerrar reservas automáticamente.",
        highlight: true,
      },
      {
        title: "Encuestas + análisis inteligente",
        description:
          "Envía encuestas automáticas por email y prepárate para análisis inteligente del feedback en una siguiente etapa.",
      },
      {
        title: "Métricas de conversaciones y conversión",
        description:
          "Mide cuántas conversaciones llegan, cuántas reservan y qué tan bien convierte tu automatización.",
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
    description:
      "Suma más capacidad a tu operación agregando profesionales adicionales. Cada profesional extra incluye 5 servicios adicionales.",
    unitPrice: 6000,
    unitLabel: "$6.000",
    unitSizeLabel: "1 profesional + 5 servicios",
  },
  reminders: {
    title: "Recordatorios por WhatsApp",
    description:
      "Agrega bloques de 50 conversaciones para recordatorios automáticos de citas.",
    unitPrice: 5000,
    unitLabel: "$5.000",
    unitSizeLabel: "50 conversaciones",
  },
  campaigns: {
    title: "Campañas por WhatsApp",
    description:
      "Agrega bloques de 50 conversaciones para campañas y reactivación de clientes inactivos.",
    unitPrice: 8000,
    unitLabel: "$8.000",
    unitSizeLabel: "50 conversaciones",
  },
  ai: {
    title: "Conversaciones asistidas por IA",
    description:
      "Agrega bloques de 50 conversaciones para atención automática, respuesta de consultas y cierre de reservas por WhatsApp.",
    unitPrice: 30000,
    unitLabel: "$30.000",
    unitSizeLabel: "50 conversaciones",
  },
} as const;

function formatCLP(value: number) {
  return `$${value.toLocaleString("es-CL")}`;
}

function PlanIcon({ type }: { type: Plan["icon"] }) {
  if (type === "mail") return <Mail className="h-5 w-5" />;
  if (type === "sparkles") return <Sparkles className="h-5 w-5" />;
  if (type === "crown") return <Crown className="h-5 w-5" />;
  return <Gem className="h-5 w-5" />;
}

function ExtraBadge({
  title,
  description,
  unitLabel,
  unitSizeLabel,
  infoText,
  value,
  onDecrease,
  onIncrease,
  icon,
  accent,
}: {
  title: string;
  description: string;
  unitLabel: string;
  unitSizeLabel: string;
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
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div className="min-w-0 flex-1">
          <div
            className={`inline-flex h-11 w-11 items-center justify-center rounded-2xl ${accent.icon}`}
          >
            {icon}
          </div>

          <p className="mt-3 text-base font-semibold text-white">{title}</p>
          <p className="mt-1 text-sm leading-6 text-slate-300">{description}</p>
        </div>

        <div className="w-full xl:w-[310px]">
          <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
              Valor
            </p>
            <p className="mt-1 text-base font-semibold text-white">
              {unitLabel} · {unitSizeLabel}
            </p>
          </div>

          <div className="mt-4 flex items-center justify-center gap-4">
            <button
              type="button"
              onClick={onDecrease}
              className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-2xl text-slate-200 transition hover:bg-white/10"
            >
              −
            </button>

            <span className="min-w-[28px] text-center text-xl font-semibold text-white">
              {value}
            </span>

            <button
              type="button"
              onClick={onIncrease}
              className={`inline-flex h-11 w-11 items-center justify-center rounded-xl border bg-white/5 text-2xl transition ${accent.control}`}
            >
              +
            </button>
          </div>

          <div
            className={`mt-4 rounded-2xl border px-4 py-3 text-sm leading-6 ${accent.info}`}
          >
            {infoText}
          </div>
        </div>
      </div>
    </div>
  );
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

  if (extraKey === "campaigns") {
    return {
      icon: "bg-amber-500/15 text-amber-200",
      control: "border-amber-400/25 text-amber-100 hover:bg-amber-500/15",
      info: "border-amber-400/20 bg-amber-500/10 text-amber-100",
    };
  }

  return {
    icon: "bg-violet-500/15 text-violet-200",
    control: "border-violet-400/25 text-violet-100 hover:bg-violet-500/15",
    info: "border-violet-400/20 bg-violet-500/10 text-violet-100",
  };
}

export default function PlanesPage() {
  const [selectedPlanKey, setSelectedPlanKey] = useState<PlanKey>("vip");
  const [staffExtras, setStaffExtras] = useState(0);
  const [reminderExtras, setReminderExtras] = useState(0);
  const [campaignExtras, setCampaignExtras] = useState(0);
  const [aiExtras, setAiExtras] = useState(0);

  const selectedPlan =
    plans.find((plan) => plan.key === selectedPlanKey) || plans[2];

  const supportsStaffExtra = selectedPlan.extras.includes("staff");
  const supportsReminderExtra = selectedPlan.extras.includes("reminders");
  const supportsCampaignExtra = selectedPlan.extras.includes("campaigns");
  const supportsAiExtra = selectedPlan.extras.includes("ai");

  const subtotal = useMemo(() => {
    let total = selectedPlan.price;

    if (supportsStaffExtra) total += staffExtras * extraConfig.staff.unitPrice;
    if (supportsReminderExtra) {
      total += reminderExtras * extraConfig.reminders.unitPrice;
    }
    if (supportsCampaignExtra) {
      total += campaignExtras * extraConfig.campaigns.unitPrice;
    }
    if (supportsAiExtra) total += aiExtras * extraConfig.ai.unitPrice;

    return total;
  }, [
    aiExtras,
    campaignExtras,
    reminderExtras,
    selectedPlan.price,
    staffExtras,
    supportsAiExtra,
    supportsCampaignExtra,
    supportsReminderExtra,
    supportsStaffExtra,
  ]);

  const iva = Math.round(subtotal * 0.19);
  const total = subtotal + iva;

  const currentStaffTotal = selectedPlan.includedStaff + staffExtras;
  const currentServicesTotal =
    selectedPlan.includedServices + staffExtras * SERVICES_PER_STAFF_EXTRA;
  const currentReminderTotal =
    selectedPlan.includedReminderConversations + reminderExtras * 50;
  const currentCampaignTotal =
    selectedPlan.includedCampaignConversations + campaignExtras * 50;
  const currentAiTotal = selectedPlan.includedAiConversations + aiExtras * 50;

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
        label: `Recordatorios WhatsApp x${reminderExtras}`,
        amount: reminderExtras * extraConfig.reminders.unitPrice,
      });
    }

    if (supportsCampaignExtra && campaignExtras > 0) {
      items.push({
        label: `Campañas WhatsApp x${campaignExtras}`,
        amount: campaignExtras * extraConfig.campaigns.unitPrice,
      });
    }

    if (supportsAiExtra && aiExtras > 0) {
      items.push({
        label: `Conversaciones IA x${aiExtras}`,
        amount: aiExtras * extraConfig.ai.unitPrice,
      });
    }

    return items;
  }, [
    aiExtras,
    campaignExtras,
    reminderExtras,
    staffExtras,
    supportsAiExtra,
    supportsCampaignExtra,
    supportsReminderExtra,
    supportsStaffExtra,
  ]);

  function handleSelectPlan(planKey: PlanKey) {
    setSelectedPlanKey(planKey);
    setStaffExtras(0);
    setReminderExtras(0);
    setCampaignExtras(0);
    setAiExtras(0);
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
    if (extraKey === "ai" && supportsAiExtra) {
      setAiExtras((prev) => prev + 1);
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
    if (extraKey === "ai" && supportsAiExtra) {
      setAiExtras((prev) => Math.max(0, prev - 1));
    }
  }

  const comparisonRows = [
    {
      label: "Sucursales incluidas",
      values: {
        pro: "1",
        premium: "2",
        vip: "3",
        platinum: "10",
      },
    },
    {
      label: "Profesionales incluidos",
      values: {
        pro: "2",
        premium: "5",
        vip: "10",
        platinum: "20",
      },
    },
    {
      label: "Servicios incluidos",
      values: {
        pro: "10",
        premium: "25",
        vip: "50",
        platinum: "100",
      },
    },
    {
      label: "Beneficio por profesional extra",
      values: {
        pro: "+5 servicios",
        premium: "+5 servicios",
        vip: "+5 servicios",
        platinum: "+5 servicios",
      },
    },
    {
      label: "Emails automatizados",
      values: {
        pro: "Confirmación",
        premium: "Completo",
        vip: "Completo",
        platinum: "Completo",
      },
    },
    {
      label: "Campañas por email",
      values: {
        pro: "—",
        premium: "Sí",
        vip: "Sí",
        platinum: "Sí",
      },
    },
    {
      label: "Encuestas por email",
      values: {
        pro: "—",
        premium: "—",
        vip: "Sí",
        platinum: "Sí + análisis futuro",
      },
    },
    {
      label: "WhatsApp recordatorios",
      values: {
        pro: "—",
        premium: "—",
        vip: "200 / mes",
        platinum: "400 / mes",
      },
    },
    {
      label: "WhatsApp campañas",
      values: {
        pro: "—",
        premium: "—",
        vip: "Extra",
        platinum: "50 / mes",
      },
    },
    {
      label: "Conversaciones asistidas por IA",
      values: {
        pro: "—",
        premium: "—",
        vip: "—",
        platinum: "200 / mes",
      },
    },
  ] as const;

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(99,102,241,0.18),_transparent_22%),radial-gradient(circle_at_left,_rgba(14,165,233,0.12),_transparent_28%),linear-gradient(180deg,_#0b1120_0%,_#0f172a_40%,_#111827_100%)] text-white">
      <section className="mx-auto max-w-7xl px-4 py-8 lg:px-8">
        <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_410px]">
          <div>
            <div className="rounded-[34px] border border-white/10 bg-white/6 p-6 shadow-[0_30px_90px_rgba(15,23,42,0.34)] backdrop-blur-xl lg:p-8">
              <div className="max-w-3xl">
                <span className="inline-flex rounded-full border border-indigo-400/20 bg-indigo-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-indigo-200">
                  Precios Orbyx
                </span>

                <h1 className="mt-4 text-3xl font-semibold tracking-tight text-white lg:text-5xl">
                  Escala tu agenda con un plan hecho para crecer contigo
                </h1>

                <p className="mt-4 max-w-2xl text-base leading-7 text-slate-300">
                  Comienza con la base que necesita tu negocio y suma capacidad,
                  campañas o automatización cuando tu operación lo pida.
                </p>
              </div>

              <div className="mt-8 grid gap-4 xl:grid-cols-4">
                {plans.map((plan) => {
                  const isSelected = selectedPlan.key === plan.key;

                  return (
                    <button
                      key={plan.key}
                      type="button"
                      onClick={() => handleSelectPlan(plan.key)}
                      className={`relative flex min-h-[264px] flex-col rounded-3xl border px-4 py-5 text-left transition ${
                        isSelected
                          ? `bg-[linear-gradient(180deg,rgba(255,255,255,0.12),rgba(255,255,255,0.06))] ${plan.borderClass} ring-1 ${plan.ringClass} shadow-[0_18px_50px_rgba(15,23,42,0.28)]`
                          : "border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/8"
                      }`}
                    >
                      {plan.badge ? (
                        <span className="absolute right-4 top-4 rounded-full bg-white px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-slate-900">
                          {plan.badge}
                        </span>
                      ) : null}

                      <span
                        className={`inline-flex h-11 w-11 items-center justify-center rounded-2xl ${
                          isSelected ? "bg-white/12" : "bg-white/8"
                        } ${plan.accentClass}`}
                      >
                        <PlanIcon type={plan.icon} />
                      </span>

                      <p className="mt-4 text-lg font-semibold text-white">
                        {plan.name}
                      </p>

                      <p className="mt-1 text-sm leading-6 text-slate-300">
                        {plan.subtitle}
                      </p>

                      <div className="mt-auto pt-6">
                        <p className="text-[2rem] font-semibold leading-none tracking-tight text-white lg:text-[2.35rem]">
                          {plan.priceLabel}
                        </p>
                        <p className="mt-2 text-sm text-slate-400">
                          {plan.ivaLabel}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="mt-10 rounded-[28px] border border-white/10 bg-white/6 p-5 shadow-[0_18px_60px_rgba(15,23,42,0.22)] backdrop-blur-xl lg:p-6">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
                  <div>
                    <p className="text-xl font-semibold text-white">
                      Adicionales disponibles
                    </p>
                    <p className="mt-2 text-sm leading-6 text-slate-300">
                      Los adicionales se van desbloqueando según el plan que
                      selecciones. Todo queda en una sola tarjeta para ocupar
                      menos espacio y verse más limpio.
                    </p>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                      Plan actual
                    </p>
                    <p className="mt-1 text-sm font-semibold text-white">
                      {selectedPlan.name}
                    </p>
                  </div>
                </div>

                <div className="mt-6 space-y-4">
                  {supportsStaffExtra ? (
                    <ExtraBadge
                      title={extraConfig.staff.title}
                      description={extraConfig.staff.description}
                      unitLabel={extraConfig.staff.unitLabel}
                      unitSizeLabel={extraConfig.staff.unitSizeLabel}
                      infoText={`Tu plan ahora cuenta con ${currentStaffTotal} profesionales y ${currentServicesTotal} servicios.`}
                      value={staffExtras}
                      onDecrease={() => decreaseExtra("staff")}
                      onIncrease={() => increaseExtra("staff")}
                      accent={getExtraAccent("staff")}
                      icon={<Users className="h-5 w-5" />}
                    />
                  ) : null}

                  {supportsReminderExtra ? (
                    <ExtraBadge
                      title={extraConfig.reminders.title}
                      description={extraConfig.reminders.description}
                      unitLabel={extraConfig.reminders.unitLabel}
                      unitSizeLabel={extraConfig.reminders.unitSizeLabel}
                      infoText={`Tu plan ahora cuenta con ${currentReminderTotal} conversaciones de recordatorio.`}
                      value={reminderExtras}
                      onDecrease={() => decreaseExtra("reminders")}
                      onIncrease={() => increaseExtra("reminders")}
                      accent={getExtraAccent("reminders")}
                      icon={<MessageCircle className="h-5 w-5" />}
                    />
                  ) : null}

                  {supportsCampaignExtra ? (
                    <ExtraBadge
                      title={extraConfig.campaigns.title}
                      description={extraConfig.campaigns.description}
                      unitLabel={extraConfig.campaigns.unitLabel}
                      unitSizeLabel={extraConfig.campaigns.unitSizeLabel}
                      infoText={`Tu plan ahora cuenta con ${currentCampaignTotal} conversaciones de campañas.`}
                      value={campaignExtras}
                      onDecrease={() => decreaseExtra("campaigns")}
                      onIncrease={() => increaseExtra("campaigns")}
                      accent={getExtraAccent("campaigns")}
                      icon={<Megaphone className="h-5 w-5" />}
                    />
                  ) : null}

                  {supportsAiExtra ? (
                    <ExtraBadge
                      title={extraConfig.ai.title}
                      description={extraConfig.ai.description}
                      unitLabel={extraConfig.ai.unitLabel}
                      unitSizeLabel={extraConfig.ai.unitSizeLabel}
                      infoText={`Tu plan ahora cuenta con ${currentAiTotal} conversaciones asistidas por IA.`}
                      value={aiExtras}
                      onDecrease={() => decreaseExtra("ai")}
                      onIncrease={() => increaseExtra("ai")}
                      accent={getExtraAccent("ai")}
                      icon={<Bot className="h-5 w-5" />}
                    />
                  ) : null}
                </div>
              </div>

              <div className="mt-10 overflow-hidden rounded-[28px] border border-white/10 bg-white/6 shadow-[0_20px_60px_rgba(15,23,42,0.22)] backdrop-blur-xl">
                <div className="border-b border-white/10 px-6 py-5">
                  <p className="text-xl font-semibold text-white">
                    Comparación de planes
                  </p>
                  <p className="mt-1 text-sm text-slate-300">
                    Visualiza rápido qué cambia a medida que subes de plan.
                  </p>
                </div>

                <div className="overflow-x-auto">
                  <table className="min-w-[940px] w-full border-collapse">
                    <thead>
                      <tr className="bg-white/5">
                        <th className="px-4 py-3 text-left text-sm font-semibold text-slate-200">
                          Característica
                        </th>
                        {plans.map((plan) => (
                          <th
                            key={plan.key}
                            className="px-4 py-3 text-center text-sm font-semibold text-slate-200"
                          >
                            {plan.name}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {comparisonRows.map((row, index) => (
                        <tr
                          key={row.label}
                          className={
                            index % 2 === 0 ? "bg-white/0" : "bg-white/[0.03]"
                          }
                        >
                          <td className="border-t border-white/10 px-4 py-3 text-sm font-medium text-slate-100">
                            {row.label}
                          </td>
                          {plans.map((plan) => (
                            <td
                              key={`${row.label}-${plan.key}`}
                              className="border-t border-white/10 px-4 py-3 text-center text-sm text-slate-300"
                            >
                              {row.values[plan.key]}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
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

                <div className="mt-6 space-y-3 rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-300">Plan base</span>
                    <span className="text-sm font-semibold text-white">
                      {selectedPlan.priceLabel}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-300">IVA</span>
                    <span className="text-sm font-semibold text-white">
                      {formatCLP(iva)}
                    </span>
                  </div>

                  <div className="border-t border-white/10 pt-3">
                    <div className="flex items-center justify-between">
                      <span className="text-base font-semibold text-white">
                        Total mensual
                      </span>
                      <span
                        className={`text-[2rem] font-semibold leading-none ${selectedPlan.accentClass}`}
                      >
                        {formatCLP(total)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-6 space-y-3">
                  <Link
                    href={`/checkout?plan=${selectedPlan.key}`}
                    className="inline-flex h-14 w-full items-center justify-center rounded-2xl bg-gradient-to-r from-violet-600 via-indigo-600 to-sky-500 px-5 text-base font-semibold text-white shadow-[0_0_0_1px_rgba(255,255,255,0.12),0_18px_40px_rgba(79,70,229,0.38)] transition hover:scale-[1.01] hover:shadow-[0_0_0_1px_rgba(255,255,255,0.18),0_22px_50px_rgba(79,70,229,0.46)]"
                  >
                    Continuar con {selectedPlan.name}
                  </Link>

                  <p className="text-center text-xs leading-5 text-slate-400">
                    Puedes empezar con tu plan base y ampliar capacidad en
                    cualquier momento.
                  </p>
                </div>

                <div className="mt-6 rounded-[24px] border border-white/10 bg-white/5 p-4">
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
                              feature.highlight
                                ? "text-violet-200"
                                : "text-white"
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
                </div>

                <div className="mt-6 grid gap-3">
                  <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                    <p className="text-[11px] uppercase tracking-[0.14em] text-slate-400">
                      Sucursales incluidas
                    </p>
                    <p className="mt-1 text-xl font-semibold text-white">
                      {selectedPlan.includedBranches}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                    <p className="text-[11px] uppercase tracking-[0.14em] text-slate-400">
                      Profesionales incluidos
                    </p>
                    <p className="mt-1 text-xl font-semibold text-white">
                      {currentStaffTotal}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                    <p className="text-[11px] uppercase tracking-[0.14em] text-slate-400">
                      Servicios incluidos
                    </p>
                    <p className="mt-1 text-xl font-semibold text-white">
                      {currentServicesTotal}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                    <p className="text-[11px] uppercase tracking-[0.14em] text-slate-400">
                      WhatsApp recordatorios
                    </p>
                    <p className="mt-1 text-xl font-semibold text-white">
                      {currentReminderTotal > 0
                        ? `${currentReminderTotal} conversaciones`
                        : "No incluido"}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                    <p className="text-[11px] uppercase tracking-[0.14em] text-slate-400">
                      Campañas por WhatsApp
                    </p>
                    <p className="mt-1 text-xl font-semibold text-white">
                      {currentCampaignTotal > 0
                        ? `${currentCampaignTotal} conversaciones`
                        : "No incluido"}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                    <p className="text-[11px] uppercase tracking-[0.14em] text-slate-400">
                      IA asistida
                    </p>
                    <p className="mt-1 text-xl font-semibold text-white">
                      {currentAiTotal > 0
                        ? `${currentAiTotal} conversaciones`
                        : "No incluida"}
                    </p>
                  </div>
                </div>

                <div className="mt-6 rounded-[24px] border border-white/10 bg-white/5 p-4">
                  <div className="flex items-center gap-3">
                    <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-white/10 text-slate-200">
                      <Building2 className="h-5 w-5" />
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-white">
                        Multi-sucursal incluida
                      </p>
                      <p className="text-sm text-slate-300">
                        Este plan permite operar hasta {selectedPlan.includedBranches}{" "}
                        sucursal{selectedPlan.includedBranches === 1 ? "" : "es"}.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}