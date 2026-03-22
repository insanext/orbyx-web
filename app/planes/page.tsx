"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Bot,
  Check,
  ChevronDown,
  ChevronUp,
  Crown,
  Gem,
  Mail,
  MessageCircle,
  Sparkles,
  Users,
} from "lucide-react";

type PlanKey = "pro" | "premium" | "vip" | "platinum";
type ExtraKey = "staff" | "whatsapp";

type Plan = {
  key: PlanKey;
  name: string;
  price: number;
  priceLabel: string;
  ivaLabel: string;
  subtitle: string;
  badge?: string;
  includedStaff: number;
  includedWhatsAppConversations: number;
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
    includedWhatsAppConversations: 0,
    extras: ["staff"],
    summaryTitle: "Plan Pro",
    summaryIntro: "Ideal para comenzar con una operación más ordenada.",
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
    accentClass: "text-cyan-600",
    softBgClass: "bg-cyan-50",
    borderClass: "border-cyan-200",
  },
  {
    key: "premium",
    name: "Premium",
    price: 44990,
    priceLabel: "$44.990",
    ivaLabel: "mes + iva",
    subtitle: "Más control y mejor comunicación con tus clientes",
    includedStaff: 5,
    includedWhatsAppConversations: 0,
    extras: ["staff"],
    summaryTitle: "Plan Premium",
    summaryIntro: "Pensado para negocios que ya necesitan más comunicación y seguimiento.",
    features: [
      "Todo lo del plan Pro",
      "Recordatorios a clientes por email",
      "Notificaciones de cambios o cancelaciones por email",
      "Campañas y envíos masivos por email",
    ],
    icon: "sparkles",
    accentClass: "text-fuchsia-600",
    softBgClass: "bg-fuchsia-50",
    borderClass: "border-fuchsia-200",
  },
  {
    key: "vip",
    name: "VIP",
    price: 79990,
    priceLabel: "$79.990",
    ivaLabel: "mes + iva",
    subtitle: "Reduce ausencias y mantén el contacto con tus clientes",
    badge: "Más elegido",
    includedStaff: 10,
    includedWhatsAppConversations: 200,
    extras: ["staff", "whatsapp"],
    summaryTitle: "Plan VIP",
    summaryIntro: "Diseñado para negocios que ya necesitan comunicación activa por WhatsApp.",
    features: [
      "Todo lo del plan Premium",
      "Estadísticas avanzadas del negocio",
      "Personalización del negocio (logo, marca, página)",
      "Recordatorios automáticos por WhatsApp",
      "Segmentación de clientes",
      "Hasta 200 conversaciones de WhatsApp al mes",
    ],
    icon: "crown",
    accentClass: "text-amber-600",
    softBgClass: "bg-amber-50",
    borderClass: "border-amber-200",
  },
  {
    key: "platinum",
    name: "Platinum",
    price: 159990,
    priceLabel: "$159.990",
    ivaLabel: "mes + iva",
    subtitle: "La IA trabaja por tu negocio incluso cuando no estás disponible",
    badge: "Automatización IA",
    includedStaff: 20,
    includedWhatsAppConversations: 400,
    extras: ["staff", "whatsapp"],
    summaryTitle: "Plan Platinum",
    summaryIntro: "Tu operación escala con WhatsApp e inteligencia artificial trabajando por ti.",
    features: [
      "Todo lo del plan VIP",
      "Automatización de reservas por WhatsApp con IA",
      "Respuestas automáticas a clientes",
      "Reactivación de clientes inactivos por WhatsApp",
      "Campañas y mensajes masivos por WhatsApp",
      "Métricas de conversaciones y conversión",
      "Hasta 400 conversaciones de WhatsApp al mes",
    ],
    icon: "gem",
    accentClass: "text-emerald-600",
    softBgClass: "bg-emerald-50",
    borderClass: "border-emerald-200",
  },
];

const extraConfig = {
  staff: {
    title: "Profesionales extra",
    description:
      "Amplía tu equipo agregando profesionales adicionales a tu plan actual.",
    unitPrice: 5000,
    unitLabel: "$5.000",
  },
  whatsapp: {
    title: "Conversaciones extra de WhatsApp",
    description:
      "Agrega bloques de 50 conversaciones adicionales de WhatsApp para seguir automatizando recordatorios y contacto con clientes.",
    unitPrice: 5000,
    unitLabel: "$5.000",
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
  const [whatsAppExtras, setWhatsAppExtras] = useState(0);
  const [showCompare, setShowCompare] = useState(false);

  const selectedPlan = plans.find((plan) => plan.key === selectedPlanKey) || plans[2];

  const supportsStaffExtra = selectedPlan.extras.includes("staff");
  const supportsWhatsAppExtra = selectedPlan.extras.includes("whatsapp");

  const extraItems = useMemo(() => {
    const items: { label: string; amount: number }[] = [];

    if (supportsStaffExtra && staffExtras > 0) {
      items.push({
        label: `Profesional extra x${staffExtras}`,
        amount: staffExtras * extraConfig.staff.unitPrice,
      });
    }

    if (supportsWhatsAppExtra && whatsAppExtras > 0) {
      items.push({
        label: `WhatsApp extra x${whatsAppExtras}`,
        amount: whatsAppExtras * extraConfig.whatsapp.unitPrice,
      });
    }

    return items;
  }, [staffExtras, supportsStaffExtra, supportsWhatsAppExtra, whatsAppExtras]);

  const subtotal = useMemo(() => {
    let total = selectedPlan.price;

    if (supportsStaffExtra) {
      total += staffExtras * extraConfig.staff.unitPrice;
    }

    if (supportsWhatsAppExtra) {
      total += whatsAppExtras * extraConfig.whatsapp.unitPrice;
    }

    return total;
  }, [selectedPlan.price, staffExtras, supportsStaffExtra, supportsWhatsAppExtra, whatsAppExtras]);

  const iva = Math.round(subtotal * 0.19);
  const total = subtotal + iva;

  const currentStaffTotal = selectedPlan.includedStaff + staffExtras;
  const currentWhatsAppTotal =
    selectedPlan.includedWhatsAppConversations + whatsAppExtras * 50;

  function handleSelectPlan(planKey: PlanKey) {
    setSelectedPlanKey(planKey);
    setStaffExtras(0);
    setWhatsAppExtras(0);
  }

  function increaseExtra(extraKey: ExtraKey) {
    if (extraKey === "staff" && supportsStaffExtra) {
      setStaffExtras((prev) => prev + 1);
    }

    if (extraKey === "whatsapp" && supportsWhatsAppExtra) {
      setWhatsAppExtras((prev) => prev + 1);
    }
  }

  function decreaseExtra(extraKey: ExtraKey) {
    if (extraKey === "staff" && supportsStaffExtra) {
      setStaffExtras((prev) => Math.max(0, prev - 1));
    }

    if (extraKey === "whatsapp" && supportsWhatsAppExtra) {
      setWhatsAppExtras((prev) => Math.max(0, prev - 1));
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <section className="mx-auto max-w-7xl px-4 py-8 lg:px-8">
        <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_380px]">
          <div>
            <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm lg:p-8">
              <div className="max-w-3xl">
                <span className="inline-flex rounded-full border border-violet-200 bg-violet-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-violet-700">
                  Planes Orbyx
                </span>
                <h1 className="mt-4 text-3xl font-semibold tracking-tight text-slate-900 lg:text-5xl">
                  Escoge el plan que mejor se adapta a tu negocio
                </h1>
                <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600">
                  Comienza con la agenda que necesitas hoy y suma extras a medida que
                  tu operación crece.
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
                      className={`relative rounded-2xl border p-4 text-left transition ${
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

                      <div
                        className={`inline-flex h-10 w-10 items-center justify-center rounded-2xl ${
                          isSelected ? "bg-white" : "bg-slate-100"
                        } ${plan.accentClass}`}
                      >
                        <PlanIcon type={plan.icon} />
                      </div>

                      <div className="mt-4">
                        <p className="text-lg font-semibold text-slate-900">{plan.name}</p>
                        <p className="mt-1 text-sm leading-6 text-slate-600">{plan.subtitle}</p>
                      </div>

                      <div className="mt-5">
                        <p className="text-2xl font-semibold text-slate-900">{plan.priceLabel}</p>
                        <p className="text-sm text-slate-500">{plan.ivaLabel}</p>
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
                <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
                  <div className="max-w-2xl">
                    <div className="flex items-center gap-3">
                      <span className={`inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-white ${selectedPlan.accentClass}`}>
                        <PlanIcon type={selectedPlan.icon} />
                      </span>
                      <div>
                        <h2 className="text-2xl font-semibold text-slate-900">
                          {selectedPlan.name}
                        </h2>
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
                          className="flex items-start gap-3 rounded-2xl border border-white/70 bg-white/80 px-4 py-3"
                        >
                          <Check className={`mt-0.5 h-4 w-4 shrink-0 ${selectedPlan.accentClass}`} />
                          <span className="text-sm leading-6 text-slate-700">{feature}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="w-full rounded-2xl border border-white/70 bg-white p-5 lg:max-w-xs">
                    <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
                      Incluye
                    </p>

                    <div className="mt-4 space-y-4">
                      <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3">
                        <span className="text-sm font-medium text-slate-600">Profesionales</span>
                        <span className="text-base font-semibold text-slate-900">
                          {selectedPlan.includedStaff}
                        </span>
                      </div>

                      <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3">
                        <span className="text-sm font-medium text-slate-600">Servicios</span>
                        <span className="text-base font-semibold text-slate-900">
                          {selectedPlan.key === "pro"
                            ? "6"
                            : selectedPlan.key === "premium"
                            ? "15"
                            : selectedPlan.key === "vip"
                            ? "30"
                            : "60"}
                        </span>
                      </div>

                      <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3">
                        <span className="text-sm font-medium text-slate-600">WhatsApp</span>
                        <span className="text-base font-semibold text-slate-900">
                          {selectedPlan.includedWhatsAppConversations > 0
                            ? `${selectedPlan.includedWhatsAppConversations} conv.`
                            : "No incluido"}
                        </span>
                      </div>

                      <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3">
                        <span className="text-sm font-medium text-slate-600">IA</span>
                        <span className="text-base font-semibold text-slate-900">
                          {selectedPlan.key === "platinum" ? "Incluida" : "No incluida"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>

              <div className="mt-8">
                <button
                  type="button"
                  onClick={() => setShowCompare((prev) => !prev)}
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                >
                  {showCompare ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                  {showCompare ? "Ocultar comparación" : "Ver comparación completa"}
                </button>

                {showCompare ? (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                    className="mt-4 overflow-hidden rounded-2xl border border-slate-200 bg-white"
                  >
                    <div className="overflow-x-auto">
                      <table className="min-w-[920px] w-full border-collapse">
                        <thead>
                          <tr className="bg-slate-100">
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
                          {[
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
                              label: "Conversaciones de WhatsApp",
                              values: {
                                pro: "—",
                                premium: "—",
                                vip: "200 / mes",
                                platinum: "400 / mes",
                              },
                            },
                            {
                              label: "Automatización con IA",
                              values: {
                                pro: "—",
                                premium: "—",
                                vip: "—",
                                platinum: "Sí",
                              },
                            },
                            {
                              label: "Reactivación automática",
                              values: {
                                pro: "—",
                                premium: "—",
                                vip: "—",
                                platinum: "Sí",
                              },
                            },
                          ].map((row, index) => (
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
                  </motion.div>
                ) : null}
              </div>

              <div className="mt-10">
                <p className="text-xl font-semibold text-slate-900">
                  Personaliza tu plan con adicionales
                </p>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Ajusta tu plan según la capacidad real de tu negocio, sin cambiar de
                  plan antes de tiempo.
                </p>

                <div className="mt-5 grid gap-4 lg:grid-cols-2">
                  {supportsStaffExtra ? (
                    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                      <div className="flex items-start gap-4">
                        <div className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-violet-50 text-violet-700">
                          <Users className="h-5 w-5" />
                        </div>

                        <div className="min-w-0 flex-1">
                          <p className="text-base font-semibold text-slate-900">
                            {extraConfig.staff.title}
                          </p>
                          <p className="mt-1 text-sm leading-6 text-slate-600">
                            {extraConfig.staff.description}
                          </p>

                          <div className="mt-4 flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3">
                            <span className="text-sm text-slate-600">Valor por unidad</span>
                            <span className="text-sm font-semibold text-slate-900">
                              {extraConfig.staff.unitLabel}
                            </span>
                          </div>

                          <div className="mt-4 flex items-center gap-4">
                            <button
                              type="button"
                              onClick={() => decreaseExtra("staff")}
                              className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 text-2xl text-slate-500 transition hover:bg-slate-50"
                            >
                              −
                            </button>

                            <span className="min-w-[80px] text-center text-lg font-semibold text-slate-900">
                              {staffExtras}
                            </span>

                            <button
                              type="button"
                              onClick={() => increaseExtra("staff")}
                              className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 text-2xl text-violet-600 transition hover:bg-slate-50"
                            >
                              +
                            </button>
                          </div>

                          <div className="mt-4 rounded-2xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-700">
                            Tu plan ahora cuenta con {currentStaffTotal} profesionales.
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : null}

                  {supportsWhatsAppExtra ? (
                    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                      <div className="flex items-start gap-4">
                        <div className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
                          <MessageCircle className="h-5 w-5" />
                        </div>

                        <div className="min-w-0 flex-1">
                          <p className="text-base font-semibold text-slate-900">
                            {extraConfig.whatsapp.title}
                          </p>
                          <p className="mt-1 text-sm leading-6 text-slate-600">
                            {extraConfig.whatsapp.description}
                          </p>

                          <div className="mt-4 flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3">
                            <span className="text-sm text-slate-600">Bloque adicional</span>
                            <span className="text-sm font-semibold text-slate-900">
                              50 conversaciones · {extraConfig.whatsapp.unitLabel}
                            </span>
                          </div>

                          <div className="mt-4 flex items-center gap-4">
                            <button
                              type="button"
                              onClick={() => decreaseExtra("whatsapp")}
                              className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 text-2xl text-slate-500 transition hover:bg-slate-50"
                            >
                              −
                            </button>

                            <span className="min-w-[80px] text-center text-lg font-semibold text-slate-900">
                              {whatsAppExtras}
                            </span>

                            <button
                              type="button"
                              onClick={() => increaseExtra("whatsapp")}
                              className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 text-2xl text-violet-600 transition hover:bg-slate-50"
                            >
                              +
                            </button>
                          </div>

                          <div className="mt-4 rounded-2xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-700">
                            Tu plan ahora cuenta con {currentWhatsAppTotal} conversaciones de WhatsApp.
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          </div>

          <div className="xl:sticky xl:top-6 xl:self-start">
            <div className="overflow-hidden rounded-[30px] border border-slate-200 bg-white shadow-sm">
              <div className={`border-b p-6 ${selectedPlan.borderClass} ${selectedPlan.softBgClass}`}>
                <div className="flex items-center gap-3">
                  <span className={`inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-white ${selectedPlan.accentClass}`}>
                    <PlanIcon type={selectedPlan.icon} />
                  </span>
                  <div>
                    <p className="text-xl font-semibold text-slate-900">{selectedPlan.summaryTitle}</p>
                    <p className="text-sm text-slate-600">{selectedPlan.summaryIntro}</p>
                  </div>
                </div>

                {selectedPlan.key === "platinum" ? (
                  <div className="mt-5 flex items-start gap-3 rounded-2xl border border-emerald-200 bg-white px-4 py-4">
                    <Bot className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
                    <div>
                      <p className="text-sm font-semibold text-slate-900">
                        IA trabajando para tu negocio
                      </p>
                      <p className="mt-1 text-sm leading-6 text-slate-600">
                        La IA responde, agenda y recupera clientes automáticamente por ti.
                      </p>
                    </div>
                  </div>
                ) : null}
              </div>

              <div className="p-6">
                <div className="space-y-3">
                  {extraItems.length === 0 ? (
                    <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-500">
                      Aún no has agregado extras.
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
                      <span className="text-base font-semibold text-slate-900">Total mensual</span>
                      <span className={`text-2xl font-semibold ${selectedPlan.accentClass}`}>
                        {formatCLP(total)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-6 space-y-3">
                  <Link
                    href={`/checkout?plan=${selectedPlan.key}`}
                    className="inline-flex h-12 w-full items-center justify-center rounded-2xl bg-slate-900 px-5 text-sm font-semibold text-white transition hover:bg-slate-800"
                  >
                    Continuar con {selectedPlan.name}
                  </Link>

                  <p className="text-center text-xs leading-5 text-slate-500">
                    Puedes partir con tu plan base y ajustar extras en cualquier momento.
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