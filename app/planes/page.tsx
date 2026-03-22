"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
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
  includedStaff: number;
  includedWhatsApp: number;
  extras: ExtraKey[];
  summaryTitle: string;
  summaryIntro: string;
  features: string[];
  icon: "mail" | "sparkles" | "crown" | "gem";
  accentClass: string;
  radioClass: string;
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
    includedWhatsApp: 0,
    extras: ["staff"],
    summaryTitle: "Pro",
    summaryIntro: "Incluye:",
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
    accentClass: "text-cyan-300",
    radioClass: "border-cyan-500 text-cyan-500",
  },
  {
    key: "premium",
    name: "Premium",
    price: 44990,
    priceLabel: "$44.990",
    ivaLabel: "mes + iva",
    subtitle: "Más control, mejor comunicación con tus clientes",
    includedStaff: 5,
    includedWhatsApp: 0,
    extras: ["staff"],
    summaryTitle: "Premium",
    summaryIntro: "Además incluye:",
    features: [
      "Todo lo del plan Pro",
      "Recordatorios a clientes por email",
      "Notificaciones de cambios o cancelaciones por email",
      "Campañas y envíos masivos por email",
    ],
    icon: "sparkles",
    accentClass: "text-fuchsia-300",
    radioClass: "border-fuchsia-500 text-fuchsia-500",
  },
  {
    key: "vip",
    name: "VIP",
    price: 69990,
    priceLabel: "$69.990",
    ivaLabel: "mes + iva",
    subtitle: "Reduce ausencias y mejora tu ocupación",
    includedStaff: 10,
    includedWhatsApp: 100,
    extras: ["staff", "whatsapp"],
    summaryTitle: "VIP",
    summaryIntro: "Además incluye:",
    features: [
      "Todo lo del plan Premium",
      "Estadísticas avanzadas del negocio",
      "Personalización del negocio (logo, marca, página)",
      "Recordatorios automáticos por WhatsApp",
      "Segmentación de clientes",
    ],
    icon: "crown",
    accentClass: "text-amber-300",
    radioClass: "border-amber-500 text-amber-500",
  },
  {
    key: "platinum",
    name: "Platinum",
    price: 119990,
    priceLabel: "$119.990",
    ivaLabel: "mes + iva",
    subtitle: "Tu negocio funciona en automático",
    includedStaff: 20,
    includedWhatsApp: 100,
    extras: ["staff", "whatsapp"],
    summaryTitle: "Platinum",
    summaryIntro: "Además incluye:",
    features: [
      "Todo lo del plan VIP",
      "Automatización de reservas por chat (IA)",
      "Reactivación de clientes inactivos por WhatsApp",
      "Campañas y mensajes masivos por WhatsApp",
      "Métricas de conversaciones y conversión",
    ],
    icon: "gem",
    accentClass: "text-emerald-300",
    radioClass: "border-emerald-500 text-emerald-500",
  },
];

const extraConfig = {
  staff: {
    title: "Profesionales extra",
    description:
      "Amplía la capacidad de tu equipo agregando profesionales adicionales al plan.",
    unitPrice: 7000,
    unitLabel: "$7.000",
  },
  whatsapp: {
    title: "Recordatorios de WhatsApp",
    description:
      "Agrega bloques de 50 recordatorios automáticos por WhatsApp para tus citas.",
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
  const [selectedPlanKey, setSelectedPlanKey] = useState<PlanKey>("premium");
  const [staffExtras, setStaffExtras] = useState(0);
  const [whatsAppExtras, setWhatsAppExtras] = useState(0);
  const [showCompare, setShowCompare] = useState(false);

  const selectedPlan = plans.find((plan) => plan.key === selectedPlanKey) || plans[1];

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

  const currentStaffTotal = selectedPlan.includedStaff + staffExtras;
  const currentWhatsAppTotal = selectedPlan.includedWhatsApp + whatsAppExtras * 50;

  return (
    <main className="min-h-screen bg-[#f3f4f6] text-slate-900">
      <section className="mx-auto max-w-7xl px-4 py-8 lg:px-8">
        <div className="rounded-[30px] border border-slate-200 bg-white p-5 shadow-sm lg:p-8">
          <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_360px]">
            <div>
              <p className="text-3xl font-semibold tracking-tight text-slate-900">
                Elige tu plan Orbyx
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                Comienza con la base que necesita tu negocio y amplía tu plan con extras según tu operación.
              </p>

              <div className="mt-8 space-y-3">
                {plans.map((plan) => {
                  const isSelected = selectedPlan.key === plan.key;

                  return (
                    <button
                      key={plan.key}
                      type="button"
                      onClick={() => handleSelectPlan(plan.key)}
                      className={`w-full rounded-2xl border px-5 py-4 text-left transition ${
                        isSelected
                          ? "border-slate-900 bg-slate-50 shadow-sm"
                          : "border-slate-200 bg-white hover:border-slate-300"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-4">
                          <span
                            className={`mt-1 inline-flex h-5 w-5 items-center justify-center rounded-full border ${
                              isSelected ? plan.radioClass : "border-slate-300 text-transparent"
                            }`}
                          >
                            <span
                              className={`h-2.5 w-2.5 rounded-full ${
                                isSelected ? "bg-current" : "bg-transparent"
                              }`}
                            />
                          </span>

                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-lg font-semibold text-slate-900">
                                {plan.name}
                              </span>
                            </div>

                            <p className="mt-1 text-base text-slate-600">{plan.subtitle}</p>
                          </div>
                        </div>

                        <div className="shrink-0 text-right">
                          <div className="text-2xl font-semibold text-slate-900">
                            {plan.priceLabel}
                          </div>
                          <div className="text-sm text-slate-500">{plan.ivaLabel}</div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="mt-8">
                <button
                  type="button"
                  onClick={() => setShowCompare((prev) => !prev)}
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                >
                  {showCompare ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  {showCompare ? "Ocultar comparación de planes" : "Ver comparación de planes"}
                </button>

                {showCompare ? (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                    className="mt-4 overflow-hidden rounded-2xl border border-slate-200 bg-slate-50"
                  >
                    <div className="overflow-x-auto">
                      <table className="min-w-[900px] w-full border-collapse">
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
                              label: "WhatsApp",
                              values: {
                                pro: "—",
                                premium: "—",
                                vip: "100 / mes",
                                platinum: "100 / mes",
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
                <p className="text-lg font-semibold text-slate-900">
                  Puedes ampliar tu plan con estos adicionales
                </p>

                <div className="mt-4 space-y-4">
                  {supportsStaffExtra ? (
                    <div className="rounded-2xl border border-slate-200 bg-white p-5">
                      <div className="flex gap-4">
                        <div className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-slate-700">
                          <Users className="h-5 w-5" />
                        </div>

                        <div className="min-w-0 flex-1">
                          <p className="text-base font-semibold text-slate-900">
                            Tu plan incluye {selectedPlan.includedStaff} profesionales
                          </p>
                          <p className="mt-1 text-sm leading-6 text-slate-600">
                            Agrega profesionales extra por {extraConfig.staff.unitLabel}.
                          </p>

                          <div className="mt-5 flex items-center gap-5">
                            <button
                              type="button"
                              onClick={() => decreaseExtra("staff")}
                              className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 text-2xl text-slate-500 transition hover:bg-slate-50"
                            >
                              −
                            </button>

                            <span className="min-w-[76px] text-center text-lg font-semibold text-slate-900">
                              {staffExtras} extras
                            </span>

                            <button
                              type="button"
                              onClick={() => increaseExtra("staff")}
                              className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 text-2xl text-violet-600 transition hover:bg-slate-50"
                            >
                              +
                            </button>
                          </div>

                          <div className="mt-5 rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-700">
                            👉 Tu plan ahora cuenta con {currentStaffTotal} profesionales
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : null}

                  {supportsWhatsAppExtra ? (
                    <div className="rounded-2xl border border-slate-200 bg-white p-5">
                      <div className="flex gap-4">
                        <div className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-slate-700">
                          <MessageCircle className="h-5 w-5" />
                        </div>

                        <div className="min-w-0 flex-1">
                          <p className="text-base font-semibold text-slate-900">
                            Recordatorios de WhatsApp
                          </p>
                          <p className="mt-1 text-sm leading-6 text-slate-600">
                            Envía recordatorios automáticos de tus citas por medio de WhatsApp.
                            Agrega bloques de 50 mensajes por {extraConfig.whatsapp.unitLabel}.
                          </p>

                          <div className="mt-5 flex items-center gap-5">
                            <button
                              type="button"
                              onClick={() => decreaseExtra("whatsapp")}
                              className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 text-2xl text-slate-500 transition hover:bg-slate-50"
                            >
                              −
                            </button>

                            <span className="min-w-[76px] text-center text-lg font-semibold text-slate-900">
                              {whatsAppExtras} extras
                            </span>

                            <button
                              type="button"
                              onClick={() => increaseExtra("whatsapp")}
                              className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 text-2xl text-violet-600 transition hover:bg-slate-50"
                            >
                              +
                            </button>
                          </div>

                          <div className="mt-5 rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-700">
                            👉 Tu plan ahora cuenta con {currentWhatsAppTotal} WhatsApp
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>
            </div>

            <div className="xl:sticky xl:top-6 xl:self-start">
              <div className="rounded-[26px] bg-slate-900 p-6 text-white shadow-[0_24px_60px_rgba(15,23,42,0.28)]">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-3">
                      <span className={`inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-white/10 ${selectedPlan.accentClass}`}>
                        <PlanIcon type={selectedPlan.icon} />
                      </span>
                      <div>
                        <p className="text-2xl font-semibold">{selectedPlan.summaryTitle}</p>
                      </div>
                    </div>
                  </div>

                  <div className={`text-xl font-semibold ${selectedPlan.accentClass}`}>
                    {selectedPlan.priceLabel}
                  </div>
                </div>

                <p className="mt-5 text-sm text-slate-300">{selectedPlan.summaryIntro}</p>

                <div className="mt-4 space-y-3">
                  {selectedPlan.features.map((feature) => (
                    <div key={feature} className="flex items-start gap-3">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-white" />
                      <span className="text-sm leading-6 text-white">{feature}</span>
                    </div>
                  ))}
                </div>

                <div className="mt-8">
                  <p className="text-sm font-semibold text-white">Extras añadidos al plan</p>

                  <div className="mt-4 space-y-3">
                    {extraItems.length === 0 ? (
                      <div className="rounded-xl bg-white/5 px-4 py-3 text-sm text-slate-300">
                        Aún no has añadido extras.
                      </div>
                    ) : (
                      extraItems.map((item) => (
                        <div
                          key={item.label}
                          className="flex items-center justify-between rounded-xl bg-white/5 px-4 py-3"
                        >
                          <span className="text-sm text-white">{item.label}</span>
                          <span className="text-sm font-semibold text-white">
                            {formatCLP(item.amount)}
                          </span>
                        </div>
                      ))
                    )}

                    <div className="flex items-center justify-between rounded-xl bg-white/5 px-4 py-3">
                      <span className="text-sm text-white">Impuestos</span>
                      <span className="text-sm font-semibold text-white">{formatCLP(iva)}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-8 flex items-center justify-between border-t border-white/10 pt-5">
                  <span className={`text-2xl font-semibold ${selectedPlan.accentClass}`}>Total</span>
                  <span className={`text-2xl font-semibold ${selectedPlan.accentClass}`}>
                    {formatCLP(total)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="fixed inset-x-0 bottom-0 z-40 px-4 pb-4">
            <div className="mx-auto flex w-full max-w-xl items-center justify-between gap-4 rounded-2xl bg-slate-900 px-5 py-4 shadow-[0_20px_60px_rgba(15,23,42,0.35)]">
              <div>
                <p className="text-sm font-medium text-white">Estás a un paso de activar tu cuenta</p>
                <p className="text-xs text-slate-400">{selectedPlan.name} seleccionado</p>
              </div>

              <Link
                href={`/checkout?plan=${selectedPlan.key}`}
                className="inline-flex h-12 items-center justify-center rounded-xl bg-violet-600 px-5 text-sm font-semibold text-white transition hover:bg-violet-700"
              >
                Pagar {formatCLP(total)}
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}