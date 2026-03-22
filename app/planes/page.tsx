"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Bot,
  Check,
  Crown,
  Gem,
  Mail,
  MessageCircle,
  Megaphone,
  Sparkles,
  Users,
} from "lucide-react";

type PlanKey = "pro" | "premium" | "vip" | "platinum";
type ExtraKey = "staff" | "reminders" | "campaigns" | "ai";

type Plan = {
  key: PlanKey;
  name: string;
  price: number;
  priceLabel: string;
  ivaLabel: string;
  subtitle: string;
  badge?: string;
  includedStaff: number;
  includedReminderConversations: number;
  includedCampaignConversations: number;
  includedAiConversations: number;
  extras: ExtraKey[];
  summaryTitle: string;
  summaryIntro: string;
  features: string[];
  icon: "mail" | "sparkles" | "crown" | "gem";
  accentClass: string;
  softBgClass: string;
  borderClass: string;
};

const plans: Plan[] = [
  {
    key: "pro",
    name: "Pro",
    price: 24990,
    priceLabel: "$24.990",
    ivaLabel: "mes + iva",
    subtitle: "Empieza a ordenar tu negocio",
    includedStaff: 2,
    includedReminderConversations: 0,
    includedCampaignConversations: 0,
    includedAiConversations: 0,
    extras: ["staff"],
    summaryTitle: "Plan Pro",
    summaryIntro: "La base ideal para comenzar a profesionalizar tu agenda.",
    features: [
      "Agenda online de citas",
      "Página pública de reservas",
      "Gestión de servicios y profesionales",
      "Configuración de horarios y disponibilidad",
      "Gestión completa de citas",
      "Gestión de clientes (CRM básico)",
      "Estadísticas básicas del negocio",
      "Confirmación de citas por email",
    ],
    icon: "mail",
    accentClass: "text-sky-700",
    softBgClass: "bg-sky-50",
    borderClass: "border-sky-200",
  },
  {
    key: "premium",
    name: "Premium",
    price: 44990,
    priceLabel: "$44.990",
    ivaLabel: "mes + iva",
    subtitle: "Más control y mejor comunicación con tus clientes",
    includedStaff: 5,
    includedReminderConversations: 0,
    includedCampaignConversations: 0,
    includedAiConversations: 0,
    extras: ["staff"],
    summaryTitle: "Plan Premium",
    summaryIntro: "Para negocios que necesitan mejor seguimiento y comunicación.",
    features: [
      "Todo lo del plan Pro",
      "Recordatorios a clientes por email",
      "Notificaciones de cambios o cancelaciones por email",
      "Campañas y envíos masivos por email",
    ],
    icon: "sparkles",
    accentClass: "text-violet-700",
    softBgClass: "bg-violet-50",
    borderClass: "border-violet-200",
  },
  {
    key: "vip",
    name: "VIP",
    price: 79990,
    priceLabel: "$79.990",
    ivaLabel: "mes + iva",
    subtitle: "Reduce ausencias y mantén un mejor contacto con tus clientes",
    badge: "Más elegido",
    includedStaff: 10,
    includedReminderConversations: 200,
    includedCampaignConversations: 0,
    includedAiConversations: 0,
    extras: ["staff", "reminders", "campaigns"],
    summaryTitle: "Plan VIP",
    summaryIntro:
      "Incorpora WhatsApp a tu operación sin entrar todavía en automatización con IA.",
    features: [
      "Todo lo del plan Premium",
      "Estadísticas avanzadas del negocio",
      "Personalización del negocio (logo, marca, página)",
      "Recordatorios automáticos por WhatsApp",
      "Segmentación de clientes",
      "Hasta 200 conversaciones de recordatorio por WhatsApp al mes",
    ],
    icon: "crown",
    accentClass: "text-amber-700",
    softBgClass: "bg-amber-50",
    borderClass: "border-amber-200",
  },
  {
    key: "platinum",
    name: "Platinum",
    price: 229990,
    priceLabel: "$229.990",
    ivaLabel: "mes + iva",
    subtitle: "La IA trabaja por tu negocio incluso cuando no estás disponible",
    badge: "IA incluida",
    includedStaff: 20,
    includedReminderConversations: 400,
    includedCampaignConversations: 50,
    includedAiConversations: 200,
    extras: ["staff", "reminders", "campaigns", "ai"],
    summaryTitle: "Plan Platinum",
    summaryIntro:
      "Una operación premium con WhatsApp e inteligencia artificial trabajando para generar más reservas.",
    features: [
      "Todo lo del plan VIP",
      "Atención automática por WhatsApp con IA",
      "La IA responde consultas y ayuda a cerrar reservas",
      "Reactivación de clientes inactivos por WhatsApp",
      "Campañas y mensajes masivos por WhatsApp",
      "Métricas de conversaciones y conversión",
      "Hasta 400 conversaciones de recordatorio por WhatsApp al mes",
      "Hasta 50 conversaciones de campañas por WhatsApp al mes",
      "Hasta 200 conversaciones asistidas por IA al mes",
    ],
    icon: "gem",
    accentClass: "text-emerald-700",
    softBgClass: "bg-emerald-50",
    borderClass: "border-emerald-200",
  },
];

const extraConfig = {
  staff: {
    title: "Profesionales extra",
    description:
      "Suma más capacidad a tu operación agregando profesionales adicionales a tu plan.",
    unitPrice: 6000,
    unitLabel: "$6.000",
    unitSizeLabel: "1 profesional",
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
      "Agrega bloques de 50 conversaciones para reactivación de clientes inactivos y campañas con ofertas.",
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

export default function PlanesPage() {
  const [selectedPlanKey, setSelectedPlanKey] = useState<PlanKey>("vip");
  const [staffExtras, setStaffExtras] = useState(0);
  const [reminderExtras, setReminderExtras] = useState(0);
  const [campaignExtras, setCampaignExtras] = useState(0);
  const [aiExtras, setAiExtras] = useState(0);

  const selectedPlan = plans.find((plan) => plan.key === selectedPlanKey) || plans[2];

  const supportsStaffExtra = selectedPlan.extras.includes("staff");
  const supportsReminderExtra = selectedPlan.extras.includes("reminders");
  const supportsCampaignExtra = selectedPlan.extras.includes("campaigns");
  const supportsAiExtra = selectedPlan.extras.includes("ai");

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

  const subtotal = useMemo(() => {
    let total = selectedPlan.price;

    if (supportsStaffExtra) {
      total += staffExtras * extraConfig.staff.unitPrice;
    }

    if (supportsReminderExtra) {
      total += reminderExtras * extraConfig.reminders.unitPrice;
    }

    if (supportsCampaignExtra) {
      total += campaignExtras * extraConfig.campaigns.unitPrice;
    }

    if (supportsAiExtra) {
      total += aiExtras * extraConfig.ai.unitPrice;
    }

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
  const currentReminderTotal =
    selectedPlan.includedReminderConversations + reminderExtras * 50;
  const currentCampaignTotal =
    selectedPlan.includedCampaignConversations + campaignExtras * 50;
  const currentAiTotal = selectedPlan.includedAiConversations + aiExtras * 50;

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
      label: "Profesionales máximos",
      values: {
        pro: "2",
        premium: "5",
        vip: "10",
        platinum: "20",
      },
    },
    {
      label: "Servicios máximos",
      values: {
        pro: "6",
        premium: "15",
        vip: "30",
        platinum: "60",
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
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,#ffffff_0%,#f8fafc_52%,#eef2ff_100%)] text-slate-900">
      <section className="mx-auto max-w-7xl px-4 py-8 lg:px-8">
        <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_410px]">
          <div>
            <div className="rounded-[32px] border border-slate-200 bg-white/95 p-6 shadow-[0_20px_70px_rgba(15,23,42,0.06)] backdrop-blur lg:p-8">
              <div className="max-w-3xl">
                <span className="inline-flex rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-indigo-700">
                  Precios Orbyx
                </span>
                <h1 className="mt-4 text-3xl font-semibold tracking-tight text-slate-900 lg:text-5xl">
                  Escala tu agenda con un plan hecho para crecer contigo
                </h1>
                <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600">
                  Comienza con la base de agenda que necesita tu negocio y añade más
                  capacidad, campañas o automatización cuando tu operación lo pida.
                </p>
              </div>

              <div className="mt-8 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                {plans.map((plan) => {
                  const isSelected = selectedPlan.key === plan.key;

                  return (
                    <button
                      key={plan.key}
                      type="button"
                      onClick={() => handleSelectPlan(plan.key)}
                      className={`relative rounded-3xl border px-4 py-5 text-left transition ${
                        isSelected
                          ? `${plan.borderClass} ${plan.softBgClass} shadow-sm`
                          : "border-slate-200 bg-white hover:border-slate-300"
                      }`}
                    >
                      {plan.badge ? (
                        <span className="absolute right-4 top-4 rounded-full bg-slate-900 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-white">
                          {plan.badge}
                        </span>
                      ) : null}

                      <span
                        className={`inline-flex h-11 w-11 items-center justify-center rounded-2xl ${
                          isSelected ? "bg-white" : "bg-slate-100"
                        } ${plan.accentClass}`}
                      >
                        <PlanIcon type={plan.icon} />
                      </span>

                      <p className="mt-4 text-lg font-semibold text-slate-900">{plan.name}</p>
                      <p className="mt-1 text-sm leading-6 text-slate-600">
                        {plan.subtitle}
                      </p>

                      <div className="mt-5">
                        <p className="text-[2rem] font-semibold leading-none tracking-tight text-slate-900 lg:text-[2.25rem]">
                          {plan.priceLabel}
                        </p>
                        <p className="mt-2 text-sm text-slate-500">{plan.ivaLabel}</p>
                      </div>
                    </button>
                  );
                })}
              </div>

              <motion.div
                key={selectedPlan.key}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className={`mt-8 rounded-[28px] border p-6 lg:p-7 ${selectedPlan.borderClass} ${selectedPlan.softBgClass}`}
              >
                <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
                  <div>
                    <div className="flex items-center gap-3">
                      <span
                        className={`inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-white ${selectedPlan.accentClass}`}
                      >
                        <PlanIcon type={selectedPlan.icon} />
                      </span>
                      <div>
                        <div className="flex items-center gap-2">
                          <h2 className="text-2xl font-semibold text-slate-900">
                            {selectedPlan.name}
                          </h2>
                          {selectedPlan.badge ? (
                            <span className="rounded-full bg-slate-900 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-white">
                              {selectedPlan.badge}
                            </span>
                          ) : null}
                        </div>
                        <p className="text-sm text-slate-500">{selectedPlan.ivaLabel}</p>
                      </div>
                    </div>

                    <p className="mt-5 text-lg font-medium text-slate-800">
                      {selectedPlan.subtitle}
                    </p>

                    <div className="mt-6 grid gap-3 sm:grid-cols-2">
                      {selectedPlan.features.map((feature) => (
                        <div
                          key={feature}
                          className="flex items-start gap-3 rounded-2xl border border-white/80 bg-white/85 px-4 py-3"
                        >
                          <Check
                            className={`mt-0.5 h-4 w-4 shrink-0 ${selectedPlan.accentClass}`}
                          />
                          <span className="text-sm leading-6 text-slate-700">
                            {feature}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-3xl border border-white/80 bg-white p-5">
                    <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
                      Resumen del plan
                    </p>

                    <div className="mt-4 space-y-4">
                      <div className="rounded-2xl bg-slate-50 px-4 py-3">
                        <p className="text-xs uppercase tracking-wide text-slate-500">
                          Profesionales incluidos
                        </p>
                        <p className="mt-1 text-xl font-semibold text-slate-900">
                          {selectedPlan.includedStaff}
                        </p>
                      </div>

                      <div className="rounded-2xl bg-slate-50 px-4 py-3">
                        <p className="text-xs uppercase tracking-wide text-slate-500">
                          WhatsApp recordatorios
                        </p>
                        <p className="mt-1 text-xl font-semibold text-slate-900">
                          {selectedPlan.includedReminderConversations > 0
                            ? `${selectedPlan.includedReminderConversations} conv.`
                            : "No incluido"}
                        </p>
                      </div>

                      <div className="rounded-2xl bg-slate-50 px-4 py-3">
                        <p className="text-xs uppercase tracking-wide text-slate-500">
                          WhatsApp campañas
                        </p>
                        <p className="mt-1 text-xl font-semibold text-slate-900">
                          {selectedPlan.includedCampaignConversations > 0
                            ? `${selectedPlan.includedCampaignConversations} conv.`
                            : "No incluido"}
                        </p>
                      </div>

                      <div className="rounded-2xl bg-slate-50 px-4 py-3">
                        <p className="text-xs uppercase tracking-wide text-slate-500">
                          IA asistida
                        </p>
                        <p className="mt-1 text-xl font-semibold text-slate-900">
                          {selectedPlan.includedAiConversations > 0
                            ? `${selectedPlan.includedAiConversations} conv.`
                            : "No incluida"}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>

              <div className="mt-10 overflow-hidden rounded-[28px] border border-slate-200 bg-white">
                <div className="border-b border-slate-200 px-6 py-5">
                  <p className="text-xl font-semibold text-slate-900">
                    Comparación de planes
                  </p>
                  <p className="mt-1 text-sm text-slate-600">
                    Visualiza rápido qué cambia a medida que subes de plan.
                  </p>
                </div>

                <div className="overflow-x-auto">
                  <table className="min-w-[940px] w-full border-collapse">
                    <thead>
                      <tr className="bg-slate-50">
                        <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">
                          Característica
                        </th>
                        {plans.map((plan) => (
                          <th
                            key={plan.key}
                            className="px-4 py-3 text-center text-sm font-semibold text-slate-700"
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
                          className={index % 2 === 0 ? "bg-white" : "bg-slate-50"}
                        >
                          <td className="border-t border-slate-200 px-4 py-3 text-sm font-medium text-slate-800">
                            {row.label}
                          </td>
                          {plans.map((plan) => (
                            <td
                              key={`${row.label}-${plan.key}`}
                              className="border-t border-slate-200 px-4 py-3 text-center text-sm text-slate-700"
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

              <div className="mt-10">
                <p className="text-xl font-semibold text-slate-900">
                  Adicionales disponibles
                </p>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Amplía tu plan sin cambiarlo completo. Suma capacidad cuando tu negocio lo necesite.
                </p>

                <div className="mt-5 grid gap-4 lg:grid-cols-2 2xl:grid-cols-4">
                  {supportsStaffExtra ? (
                    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                      <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-700">
                        <Users className="h-5 w-5" />
                      </div>

                      <p className="mt-4 text-base font-semibold text-slate-900">
                        {extraConfig.staff.title}
                      </p>
                      <p className="mt-2 text-sm leading-6 text-slate-600">
                        {extraConfig.staff.description}
                      </p>

                      <div className="mt-4 rounded-2xl bg-slate-50 px-4 py-3">
                        <p className="text-xs uppercase tracking-wide text-slate-500">
                          Valor
                        </p>
                        <p className="mt-1 text-base font-semibold text-slate-900">
                          {extraConfig.staff.unitLabel} · {extraConfig.staff.unitSizeLabel}
                        </p>
                      </div>

                      <div className="mt-4 flex items-center gap-4">
                        <button
                          type="button"
                          onClick={() => decreaseExtra("staff")}
                          className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 text-2xl text-slate-500 transition hover:bg-slate-50"
                        >
                          −
                        </button>

                        <span className="min-w-[70px] text-center text-lg font-semibold text-slate-900">
                          {staffExtras}
                        </span>

                        <button
                          type="button"
                          onClick={() => increaseExtra("staff")}
                          className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 text-2xl text-indigo-700 transition hover:bg-slate-50"
                        >
                          +
                        </button>
                      </div>

                      <div className="mt-4 rounded-2xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-700">
                        Tu plan ahora cuenta con {currentStaffTotal} profesionales.
                      </div>
                    </div>
                  ) : null}

                  {supportsReminderExtra ? (
                    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                      <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
                        <MessageCircle className="h-5 w-5" />
                      </div>

                      <p className="mt-4 text-base font-semibold text-slate-900">
                        {extraConfig.reminders.title}
                      </p>
                      <p className="mt-2 text-sm leading-6 text-slate-600">
                        {extraConfig.reminders.description}
                      </p>

                      <div className="mt-4 rounded-2xl bg-slate-50 px-4 py-3">
                        <p className="text-xs uppercase tracking-wide text-slate-500">
                          Valor
                        </p>
                        <p className="mt-1 text-base font-semibold text-slate-900">
                          {extraConfig.reminders.unitLabel} · {extraConfig.reminders.unitSizeLabel}
                        </p>
                      </div>

                      <div className="mt-4 flex items-center gap-4">
                        <button
                          type="button"
                          onClick={() => decreaseExtra("reminders")}
                          className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 text-2xl text-slate-500 transition hover:bg-slate-50"
                        >
                          −
                        </button>

                        <span className="min-w-[70px] text-center text-lg font-semibold text-slate-900">
                          {reminderExtras}
                        </span>

                        <button
                          type="button"
                          onClick={() => increaseExtra("reminders")}
                          className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 text-2xl text-emerald-700 transition hover:bg-slate-50"
                        >
                          +
                        </button>
                      </div>

                      <div className="mt-4 rounded-2xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-700">
                        Tu plan ahora cuenta con {currentReminderTotal} conversaciones de recordatorio.
                      </div>
                    </div>
                  ) : null}

                  {supportsCampaignExtra ? (
                    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                      <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 text-amber-700">
                        <Megaphone className="h-5 w-5" />
                      </div>

                      <p className="mt-4 text-base font-semibold text-slate-900">
                        {extraConfig.campaigns.title}
                      </p>
                      <p className="mt-2 text-sm leading-6 text-slate-600">
                        {extraConfig.campaigns.description}
                      </p>

                      <div className="mt-4 rounded-2xl bg-slate-50 px-4 py-3">
                        <p className="text-xs uppercase tracking-wide text-slate-500">
                          Valor
                        </p>
                        <p className="mt-1 text-base font-semibold text-slate-900">
                          {extraConfig.campaigns.unitLabel} · {extraConfig.campaigns.unitSizeLabel}
                        </p>
                      </div>

                      <div className="mt-4 flex items-center gap-4">
                        <button
                          type="button"
                          onClick={() => decreaseExtra("campaigns")}
                          className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 text-2xl text-slate-500 transition hover:bg-slate-50"
                        >
                          −
                        </button>

                        <span className="min-w-[70px] text-center text-lg font-semibold text-slate-900">
                          {campaignExtras}
                        </span>

                        <button
                          type="button"
                          onClick={() => increaseExtra("campaigns")}
                          className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 text-2xl text-amber-700 transition hover:bg-slate-50"
                        >
                          +
                        </button>
                      </div>

                      <div className="mt-4 rounded-2xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-700">
                        Tu plan ahora cuenta con {currentCampaignTotal} conversaciones de campañas.
                      </div>
                    </div>
                  ) : null}

                  {supportsAiExtra ? (
                    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                      <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-50 text-violet-700">
                        <Bot className="h-5 w-5" />
                      </div>

                      <p className="mt-4 text-base font-semibold text-slate-900">
                        {extraConfig.ai.title}
                      </p>
                      <p className="mt-2 text-sm leading-6 text-slate-600">
                        {extraConfig.ai.description}
                      </p>

                      <div className="mt-4 rounded-2xl bg-slate-50 px-4 py-3">
                        <p className="text-xs uppercase tracking-wide text-slate-500">
                          Valor
                        </p>
                        <p className="mt-1 text-base font-semibold text-slate-900">
                          {extraConfig.ai.unitLabel} · {extraConfig.ai.unitSizeLabel}
                        </p>
                      </div>

                      <div className="mt-4 flex items-center gap-4">
                        <button
                          type="button"
                          onClick={() => decreaseExtra("ai")}
                          className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 text-2xl text-slate-500 transition hover:bg-slate-50"
                        >
                          −
                        </button>

                        <span className="min-w-[70px] text-center text-lg font-semibold text-slate-900">
                          {aiExtras}
                        </span>

                        <button
                          type="button"
                          onClick={() => increaseExtra("ai")}
                          className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 text-2xl text-violet-700 transition hover:bg-slate-50"
                        >
                          +
                        </button>
                      </div>

                      <div className="mt-4 rounded-2xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-700">
                        Tu plan ahora cuenta con {currentAiTotal} conversaciones asistidas por IA.
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          </div>

          <div className="xl:sticky xl:top-6 xl:self-start">
            <div className="overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-[0_24px_80px_rgba(15,23,42,0.1)]">
              <div className={`border-b p-6 ${selectedPlan.borderClass} ${selectedPlan.softBgClass}`}>
                <div className="flex items-center gap-3">
                  <span
                    className={`inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-white ${selectedPlan.accentClass}`}
                  >
                    <PlanIcon type={selectedPlan.icon} />
                  </span>
                  <div>
                    <p className="text-xl font-semibold text-slate-900">
                      {selectedPlan.summaryTitle}
                    </p>
                    <p className="text-sm text-slate-600">{selectedPlan.summaryIntro}</p>
                  </div>
                </div>

                {selectedPlan.key === "platinum" ? (
                  <div className="mt-5 flex items-start gap-3 rounded-2xl border border-violet-200 bg-white px-4 py-4">
                    <Bot className="mt-0.5 h-5 w-5 shrink-0 text-violet-700" />
                    <div>
                      <p className="text-sm font-semibold text-slate-900">
                        Atención automática por WhatsApp con IA
                      </p>
                      <p className="mt-1 text-sm leading-6 text-slate-600">
                        La IA responde consultas y ayuda a cerrar reservas automáticamente.
                      </p>
                    </div>
                  </div>
                ) : null}
              </div>

              <div className="p-6">
                <div className="space-y-3">
                  {extraItems.length === 0 ? (
                    <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-500">
                      Aún no has agregado adicionales.
                    </div>
                  ) : (
                    extraItems.map((item) => (
                      <div
                        key={item.label}
                        className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3"
                      >
                        <span className="text-sm text-slate-700">{item.label}</span>
                        <span className="text-sm font-semibold text-slate-900">
                          {formatCLP(item.amount)}
                        </span>
                      </div>
                    ))
                  )}
                </div>

                <div className="mt-6 space-y-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600">Plan base</span>
                    <span className="text-sm font-semibold text-slate-900">
                      {selectedPlan.priceLabel}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600">IVA</span>
                    <span className="text-sm font-semibold text-slate-900">
                      {formatCLP(iva)}
                    </span>
                  </div>

                  <div className="border-t border-slate-200 pt-3">
                    <div className="flex items-center justify-between">
                      <span className="text-base font-semibold text-slate-900">
                        Total mensual
                      </span>
                      <span className={`text-[2rem] font-semibold leading-none ${selectedPlan.accentClass}`}>
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

                  <p className="text-center text-xs leading-5 text-slate-500">
                    Puedes empezar con tu plan base y ampliar capacidad en cualquier momento.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}