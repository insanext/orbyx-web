"use client";

import Link from "next/link";
import { useState } from "react";
import { motion } from "framer-motion";
import {
  Check,
  X,
  Sparkles,
  Clock3,
  MessageCircle,
  BarChart3,
  Crown,
  Gem,
  ArrowUp,
} from "lucide-react";

type PlanKey = "starter" | "pro" | "premium" | "vip" | "platinum";

type Plan = {
  key: PlanKey;
  name: string;
  price: string;
  iva: string;
  description: string;
  badge?: string;
  href: string;
  cta: string;
  comingSoon?: boolean;
  icon: "starter" | "pro" | "premium" | "vip" | "platinum";
  headerGradient: string;
  selectedBg: string;
  selectedRing: string;
  buttonClass: string;
};

type FeatureRow = {
  label: string;
  values: Record<PlanKey, boolean | string>;
  highlight?: boolean;
};

const plans: Plan[] = [
  {
    key: "starter",
    name: "Starter",
    price: "$9.990",
    iva: "+ IVA / mes",
    description:
      "Para comenzar a ordenar tu agenda y dar una mejor imagen a tu negocio.",
    badge: "Para comenzar",
    href: "/signup?plan=starter",
    cta: "Elegir Starter",
    icon: "starter",
    headerGradient: "from-cyan-500 via-sky-500 to-blue-600",
    selectedBg: "bg-cyan-50",
    selectedRing: "ring-cyan-300",
    buttonClass: "bg-cyan-600 hover:bg-cyan-700",
  },
  {
    key: "pro",
    name: "Pro",
    price: "$19.990",
    iva: "+ IVA / mes",
    description:
      "Para negocios con más movimiento que necesitan recordatorios, orden y control.",
    badge: "Más elegido",
    href: "/signup?plan=pro",
    cta: "Elegir Pro",
    icon: "pro",
    headerGradient: "from-blue-500 via-indigo-500 to-violet-600",
    selectedBg: "bg-blue-50",
    selectedRing: "ring-blue-300",
    buttonClass: "bg-blue-600 hover:bg-blue-700",
  },
  {
    key: "premium",
    name: "Premium",
    price: "$34.990",
    iva: "+ IVA / mes",
    description:
      "Para negocios que quieren más automatización, estadísticas e IA para optimizar la agenda.",
    badge: "Más automatización",
    href: "/signup?plan=premium",
    cta: "Elegir Premium",
    icon: "premium",
    headerGradient: "from-fuchsia-500 via-purple-500 to-indigo-600",
    selectedBg: "bg-fuchsia-50",
    selectedRing: "ring-fuchsia-300",
    buttonClass: "bg-fuchsia-600 hover:bg-fuchsia-700",
  },
  {
    key: "vip",
    name: "VIP",
    price: "$54.990",
    iva: "+ IVA / mes",
    description:
      "Para negocios que quieren automatización avanzada, IA por WhatsApp y más crecimiento.",
    badge: "Más crecimiento",
    href: "/signup?plan=vip",
    cta: "Elegir VIP",
    icon: "vip",
    headerGradient: "from-amber-400 via-orange-500 to-rose-500",
    selectedBg: "bg-orange-50",
    selectedRing: "ring-orange-300",
    buttonClass: "bg-orange-600 hover:bg-orange-700",
  },
  {
    key: "platinum",
    name: "Platinum",
    price: "Próximamente",
    iva: "Plan personalizado",
    description:
      "Para negocios que quieren acompañamiento estratégico, marketing y personalización avanzada.",
    badge: "Próximamente",
    href: "#planes",
    cta: "Próximamente",
    comingSoon: true,
    icon: "platinum",
    headerGradient: "from-slate-500 via-zinc-600 to-slate-800",
    selectedBg: "bg-slate-100",
    selectedRing: "ring-slate-300",
    buttonClass: "bg-slate-600 hover:bg-slate-700",
  },
];

const featureRows: FeatureRow[] = [
  {
    label: "Precio mensual",
    highlight: true,
    values: {
      starter: "$9.990",
      pro: "$19.990",
      premium: "$34.990",
      vip: "$54.990",
      platinum: "Próximamente",
    },
  },
  {
    label: "IVA",
    values: {
      starter: "+ IVA",
      pro: "+ IVA",
      premium: "+ IVA",
      vip: "+ IVA",
      platinum: "Personalizado",
    },
  },
  {
    label: "Profesionales activos",
    values: {
      starter: "1",
      pro: "3",
      premium: "10",
      vip: "20",
      platinum: "Personalizado",
    },
  },
  {
    label: "Servicios",
    values: {
      starter: "3",
      pro: "10",
      premium: "25",
      vip: "Ampliados",
      platinum: "Personalizado",
    },
  },
  {
    label: "Página pública de reservas",
    values: {
      starter: true,
      pro: true,
      premium: true,
      vip: true,
      platinum: true,
    },
  },
  {
    label: "Confirmación automática por correo",
    values: {
      starter: true,
      pro: true,
      premium: true,
      vip: true,
      platinum: true,
    },
  },
  {
    label: "Cancelación de reservas",
    values: {
      starter: true,
      pro: true,
      premium: true,
      vip: true,
      platinum: true,
    },
  },
  {
    label: "Conexión con Google Calendar",
    values: {
      starter: true,
      pro: true,
      premium: true,
      vip: true,
      platinum: true,
    },
  },
  {
    label: "Botón “Reservar ahora” para redes",
    values: {
      starter: true,
      pro: true,
      premium: true,
      vip: true,
      platinum: true,
    },
  },
  {
    label: "Recordatorios automáticos por correo",
    values: {
      starter: false,
      pro: true,
      premium: true,
      vip: true,
      platinum: true,
    },
  },
  {
    label: "Recordatorios automáticos por WhatsApp",
    values: {
      starter: false,
      pro: true,
      premium: true,
      vip: true,
      platinum: true,
    },
  },
  {
    label: "Panel de gestión de reservas",
    values: {
      starter: "Básico",
      pro: "Completo",
      premium: "Completo",
      vip: "Completo",
      platinum: "Completo",
    },
  },
  {
    label: "Estadísticas del negocio",
    values: {
      starter: false,
      pro: "Básicas",
      premium: "Avanzadas",
      vip: "Avanzadas",
      platinum: "Avanzadas",
    },
  },
  {
    label: "Gestión de clientes (historial y visitas)",
    values: {
      starter: false,
      pro: false,
      premium: true,
      vip: true,
      platinum: true,
    },
  },
  {
    label: "IA para optimizar agenda y llenar horas vacías",
    values: {
      starter: false,
      pro: false,
      premium: true,
      vip: true,
      platinum: true,
    },
  },
  {
    label: "IA por WhatsApp que responde y agenda automáticamente",
    values: {
      starter: false,
      pro: false,
      premium: false,
      vip: true,
      platinum: true,
    },
  },
  {
    label: "Personalización visual de la página de reservas",
    values: {
      starter: false,
      pro: false,
      premium: true,
      vip: true,
      platinum: true,
    },
  },
  {
    label: "Soporte prioritario",
    values: {
      starter: false,
      pro: false,
      premium: true,
      vip: true,
      platinum: true,
    },
  },
  {
    label: "Lista de espera inteligente",
    values: {
      starter: false,
      pro: false,
      premium: false,
      vip: true,
      platinum: true,
    },
  },
  {
    label: "Avisos automáticos cuando un cliente suele volver",
    values: {
      starter: false,
      pro: false,
      premium: false,
      vip: true,
      platinum: true,
    },
  },
  {
    label: "Campañas automáticas para recuperar clientes inactivos",
    values: {
      starter: false,
      pro: false,
      premium: false,
      vip: true,
      platinum: true,
    },
  },
  {
    label: "IA que sugiere promociones para aumentar reservas",
    values: {
      starter: false,
      pro: false,
      premium: false,
      vip: true,
      platinum: true,
    },
  },
  {
    label: "Dominio propio para la página de reservas",
    values: {
      starter: false,
      pro: false,
      premium: false,
      vip: true,
      platinum: true,
    },
  },
  {
    label: "Onboarding personalizado",
    values: {
      starter: false,
      pro: false,
      premium: false,
      vip: true,
      platinum: true,
    },
  },
  {
    label: "Enfoque estratégico en marketing",
    values: {
      starter: false,
      pro: false,
      premium: false,
      vip: false,
      platinum: true,
    },
  },
  {
    label: "Automatizaciones y personalización avanzada",
    values: {
      starter: false,
      pro: false,
      premium: false,
      vip: false,
      platinum: true,
    },
  },
];

function PlanIcon({ type }: { type: Plan["icon"] }) {
  if (type === "starter") return <Clock3 className="h-5 w-5" />;
  if (type === "pro") return <MessageCircle className="h-5 w-5" />;
  if (type === "premium") return <BarChart3 className="h-5 w-5" />;
  if (type === "vip") return <Crown className="h-5 w-5" />;
  return <Gem className="h-5 w-5" />;
}

function CellValue({
  value,
  selected,
}: {
  value: boolean | string;
  selected: boolean;
}) {
  if (typeof value === "boolean") {
    return value ? (
      <div className="flex justify-center">
        <Check
          className={`h-5 w-5 ${selected ? "text-emerald-600" : "text-emerald-400"}`}
        />
      </div>
    ) : (
      <div className="flex justify-center">
        <X className={`h-5 w-5 ${selected ? "text-slate-400" : "text-slate-600"}`} />
      </div>
    );
  }

  return (
    <span className={`text-sm font-medium ${selected ? "text-slate-900" : "text-slate-200"}`}>
      {value}
    </span>
  );
}

export default function PlanesPage() {
  const [selectedPlan, setSelectedPlan] = useState<PlanKey>("pro");

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.22),transparent_28%),radial-gradient(circle_at_top_right,rgba(217,70,239,0.18),transparent_25%),radial-gradient(circle_at_bottom,rgba(249,115,22,0.16),transparent_25%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(15,23,42,0.65),rgba(2,6,23,0.96))]" />

        <div className="relative mx-auto max-w-7xl px-6 py-16 lg:px-8 lg:py-20">
          <div className="mx-auto max-w-4xl text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-1.5 text-sm font-medium text-sky-200 backdrop-blur">
              <Sparkles className="h-4 w-4" />
              Planes Orbyx
            </div>

            <motion.h1
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="mt-6 text-4xl font-semibold leading-tight tracking-tight text-white sm:text-5xl lg:text-6xl"
            >
              Compara planes y elige el que mejor se adapte a tu negocio.
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.06 }}
              className="mx-auto mt-5 max-w-3xl text-lg leading-8 text-slate-300"
            >
              Un mismo producto, distintos niveles de capacidad, automatización e inteligencia para ayudarte a gestionar y hacer crecer tu agenda.
            </motion.p>
          </div>
        </div>
      </section>

      <section id="planes" className="mx-auto max-w-7xl px-4 pb-12 lg:px-8">
        <div className="overflow-hidden rounded-[32px] border border-white/10 bg-white/5 shadow-[0_18px_50px_rgba(0,0,0,0.22)] backdrop-blur-sm">
          <div className="overflow-x-auto">
            <table className="min-w-[1100px] w-full border-collapse text-left">
              <thead>
                <tr className="bg-white/8">
                  <th className="sticky left-0 z-20 min-w-[280px] border-b border-white/10 bg-slate-950/95 px-5 py-5 text-base font-semibold text-white backdrop-blur">
                    Características
                  </th>

                  {plans.map((plan) => {
                    const isSelected = selectedPlan === plan.key;

                    return (
                      <th
                        key={plan.key}
                        className={`min-w-[180px] border-b border-l border-white/10 align-top transition ${
                          isSelected ? `${plan.selectedBg} ${plan.selectedRing} ring-2` : "bg-transparent"
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() => setSelectedPlan(plan.key)}
                          className="w-full p-4 text-left"
                        >
                          <div className={`h-2 rounded-full bg-gradient-to-r ${plan.headerGradient}`} />
                          <div className="mt-4">
                            {plan.badge ? (
                              <span
                                className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                                  isSelected
                                    ? "bg-white text-slate-900"
                                    : "bg-white/12 text-white"
                                }`}
                              >
                                {plan.badge}
                              </span>
                            ) : null}

                            <div className="mt-4 flex items-center gap-3">
                              <div
                                className={`inline-flex h-10 w-10 items-center justify-center rounded-2xl ${
                                  isSelected ? "bg-white text-slate-900" : "bg-white/10 text-white"
                                }`}
                              >
                                <PlanIcon type={plan.icon} />
                              </div>
                              <div>
                                <div className={`text-2xl font-semibold ${isSelected ? "text-slate-900" : "text-white"}`}>
                                  {plan.name}
                                </div>
                                {isSelected ? (
                                  <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-600">
                                    Seleccionado
                                  </div>
                                ) : null}
                              </div>
                            </div>

                            <div className={`mt-4 text-3xl font-bold ${isSelected ? "text-slate-900" : "text-white"}`}>
                              {plan.price}
                            </div>
                            <div className={`mt-1 text-xs font-medium ${isSelected ? "text-slate-600" : "text-slate-300"}`}>
                              {plan.iva}
                            </div>

                            <p className={`mt-4 text-sm leading-6 ${isSelected ? "text-slate-700" : "text-slate-300"}`}>
                              {plan.description}
                            </p>
                          </div>
                        </button>
                      </th>
                    );
                  })}
                </tr>
              </thead>

              <tbody>
                {featureRows.map((row, idx) => (
                  <tr
                    key={row.label}
                    className={idx % 2 === 0 ? "bg-white/[0.03]" : "bg-white/[0.06]"}
                  >
                    <td className="sticky left-0 z-10 border-b border-white/10 bg-slate-950/95 px-5 py-4 text-sm font-medium text-white backdrop-blur">
                      {row.label}
                    </td>

                    {plans.map((plan) => {
                      const isSelected = selectedPlan === plan.key;

                      return (
                        <td
                          key={`${row.label}-${plan.key}`}
                          className={`border-b border-l border-white/10 px-4 py-4 text-center transition ${
                            isSelected ? `${plan.selectedBg}` : ""
                          }`}
                        >
                          <CellValue value={row.values[plan.key]} selected={isSelected} />
                        </td>
                      );
                    })}
                  </tr>
                ))}

                <tr className="bg-white/[0.04]">
                  <td className="sticky left-0 z-10 border-t border-white/10 bg-slate-950/95 px-5 py-5 text-sm font-semibold text-white backdrop-blur">
                    Elegir plan
                  </td>

                  {plans.map((plan) => {
                    const isSelected = selectedPlan === plan.key;

                    return (
                      <td
                        key={`cta-${plan.key}`}
                        className={`border-t border-l border-white/10 px-4 py-5 text-center ${
                          isSelected ? `${plan.selectedBg}` : ""
                        }`}
                      >
                        {plan.comingSoon ? (
                          <button
                            type="button"
                            disabled
                            className="inline-flex h-11 w-full items-center justify-center rounded-2xl border border-slate-300 bg-slate-200 px-4 text-sm font-semibold text-slate-500"
                          >
                            Próximamente
                          </button>
                        ) : (
                          <Link
                            href={plan.href}
                            className={`inline-flex h-11 w-full items-center justify-center rounded-2xl px-4 text-sm font-semibold text-white transition ${plan.buttonClass}`}
                          >
                            {plan.cta}
                          </Link>
                        )}
                      </td>
                    );
                  })}
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="pb-14">
        <div className="mx-auto flex max-w-7xl justify-center px-6 lg:px-8">
          <a
            href="#planes"
            className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-medium text-white transition hover:bg-white/10"
          >
            <ArrowUp className="h-4 w-4" />
            Volver a los planes
          </a>
        </div>
      </section>
    </main>
  );
}