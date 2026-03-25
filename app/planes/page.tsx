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
        title: "Agenda online y reservas públicas",
        description:
          "Incluye la base para ordenar tu negocio y permitir reservas online.",
      },
      {
        title: "Emails automáticos básicos",
        description:
          "Confirmación de citas por email para mantener informado al cliente.",
      },
      {
        title: "Operación inicial del negocio",
        description:
          "Gestión de horarios, disponibilidad, servicios y clientes.",
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
        title: "Recordatorios por email",
        description:
          "Reduce ausencias con recordatorios automáticos antes de cada cita.",
      },
      {
        title: "Notificaciones automáticas",
        description:
          "Comunica cambios y movimientos de agenda de forma más profesional.",
      },
      {
        title: "Campañas por email",
        description:
          "Envía promociones y mensajes a tus clientes de forma masiva.",
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
        title: "Recordatorios por WhatsApp",
        description:
          "Incluye conversaciones para recordatorios automáticos por WhatsApp.",
      },
      {
        title: "Más control del negocio",
        description:
          "Accede a una operación más sólida con mejor seguimiento del negocio.",
      },
      {
        title: "Encuestas automáticas por email",
        description:
          "Solicita feedback después de la atención para mejorar la experiencia.",
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
        title: "Atención automática por WhatsApp con IA",
        description:
          "La IA responde consultas y ayuda a cerrar reservas automáticamente.",
        highlight: true,
      },
      {
        title: "Encuestas + análisis inteligente",
        description:
          "Prepárate para una operación más avanzada basada en feedback.",
      },
      {
        title: "Métricas de conversaciones y conversión",
        description:
          "Visualiza mejor cómo convierten tus automatizaciones.",
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
    description: "Suma profesionales adicionales a tu operación.",
    unitPrice: 6000,
  },
  reminders: {
    title: "Recordatorios por WhatsApp",
    short: "$5.000 · 50 conversaciones",
    description: "Agrega más conversaciones para recordatorios automáticos.",
    unitPrice: 5000,
  },
  campaigns: {
    title: "Campañas por WhatsApp",
    short: "$8.000 · 50 conversaciones",
    description: "Agrega campañas y reactivación de clientes por WhatsApp.",
    unitPrice: 8000,
  },
  ai: {
    title: "Conversaciones asistidas por IA",
    short: "$30.000 · 50 conversaciones",
    description: "Agrega más capacidad de atención automática con IA.",
    unitPrice: 30000,
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
      <span className="text-sm font-semibold text-white">{value}</span>
    </div>
  );
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
                      className={`relative flex min-h-[236px] flex-col rounded-3xl border px-4 py-5 text-left transition ${
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
                        <p className="text-[1.85rem] font-semibold leading-none tracking-tight text-white lg:text-[2.05rem]">
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

              <div className="mt-8 rounded-[26px] border border-white/10 bg-white/6 p-5 shadow-[0_18px_60px_rgba(15,23,42,0.22)] backdrop-blur-xl">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
                  <div>
                    <p className="text-lg font-semibold text-white">
                      Adicionales disponibles
                    </p>
                    <p className="mt-1 text-sm leading-6 text-slate-300">
                      Se desbloquean según el plan seleccionado.
                    </p>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                      Plan actual
                    </p>
                    <p className="mt-1 text-sm font-semibold text-white">
                      {selectedPlan.name}
                    </p>
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
                      infoText={`Tu plan ahora cuenta con ${currentCampaignTotal} conversaciones de campañas.`}
                      value={campaignExtras}
                      onDecrease={() => decreaseExtra("campaigns")}
                      onIncrease={() => increaseExtra("campaigns")}
                      accent={getExtraAccent("campaigns")}
                      icon={<Megaphone className="h-5 w-5" />}
                    />
                  ) : null}

                  {supportsAiExtra ? (
                    <CompactExtraRow
                      title={extraConfig.ai.title}
                      shortText={extraConfig.ai.short}
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

                <div className="mt-5 space-y-3 rounded-2xl border border-white/10 bg-white/5 p-4">
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
                        className={`text-[1.85rem] font-semibold leading-none ${selectedPlan.accentClass}`}
                      >
                        {formatCLP(total)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-5 space-y-3">
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
                      label="WhatsApp recordatorios"
                      value={
                        currentReminderTotal > 0
                          ? `${currentReminderTotal}`
                          : "No incluido"
                      }
                    />
                    <IncludeRow
                      label="Campañas por WhatsApp"
                      value={
                        currentCampaignTotal > 0
                          ? `${currentCampaignTotal}`
                          : "No incluido"
                      }
                    />
                    <IncludeRow
                      label="IA asistida"
                      value={
                        currentAiTotal > 0 ? `${currentAiTotal}` : "No incluida"
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
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}