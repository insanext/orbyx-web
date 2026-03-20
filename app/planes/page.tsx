"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowRight,
  BarChart3,
  Check,
  Clock3,
  Crown,
  MessageCircle,
  Sparkles,
  Wand2,
} from "lucide-react";

type Plan = {
  key: string;
  name: string;
  price: string;
  period: string;
  description: string;
  badge?: string;
  cta: string;
  href: string;
  comingSoon?: boolean;
  icon: "starter" | "pro" | "premium" | "vip" | "vipplus";
  gradient: string;
  softBg: string;
  ring: string;
  button: string;
  badgeClass: string;
  iconWrap: string;
  items: string[];
};

const plans: Plan[] = [
  {
    key: "starter",
    name: "Starter",
    price: "$9.990",
    period: "/mes",
    description:
      "Para independientes o negocios pequeños que quieren comenzar a ordenar su agenda.",
    badge: "Para comenzar",
    cta: "Comenzar con Starter",
    href: "/signup?plan=starter",
    icon: "starter",
    gradient: "from-cyan-500 via-sky-500 to-blue-600",
    softBg: "bg-cyan-50/80",
    ring: "ring-cyan-300",
    button: "bg-cyan-600 hover:bg-cyan-700",
    badgeClass: "bg-cyan-100 text-cyan-800 border border-cyan-200",
    iconWrap: "bg-cyan-500 text-white shadow-cyan-200",
    items: [
      "1 profesional activo",
      "Hasta 3 servicios",
      "Página de reservas online",
      "Confirmación automática por correo",
      "Cancelación de citas",
      "Botón de reserva para redes",
      "Conexión con Google Calendar",
      "Panel básico de agenda",
    ],
  },
  {
    key: "pro",
    name: "Pro",
    price: "$19.990",
    period: "/mes",
    description:
      "Para negocios que ya tienen flujo constante y necesitan más orden, recordatorios y control.",
    badge: "Más elegido",
    cta: "Elegir Pro",
    href: "/signup?plan=pro",
    icon: "pro",
    gradient: "from-blue-500 via-indigo-500 to-violet-600",
    softBg: "bg-blue-50/80",
    ring: "ring-blue-300",
    button: "bg-blue-600 hover:bg-blue-700",
    badgeClass: "bg-blue-600 text-white border border-blue-600",
    iconWrap: "bg-blue-600 text-white shadow-blue-200",
    items: [
      "Hasta 3 profesionales activos",
      "Hasta 10 servicios",
      "Todo lo de Starter",
      "Panel completo de gestión",
      "Recordatorios automáticos por correo",
      "Recordatorios por WhatsApp",
      "Estadísticas básicas",
      "Mejor experiencia para el negocio y sus clientes",
    ],
  },
  {
    key: "premium",
    name: "Premium",
    price: "$39.990",
    period: "/mes",
    description:
      "Para negocios que quieren automatizar más, mejorar la experiencia y empezar a apoyarse en IA.",
    badge: "Más automatización",
    cta: "Elegir Premium",
    href: "/signup?plan=premium",
    icon: "premium",
    gradient: "from-fuchsia-500 via-purple-500 to-indigo-600",
    softBg: "bg-fuchsia-50/80",
    ring: "ring-fuchsia-300",
    button: "bg-fuchsia-600 hover:bg-fuchsia-700",
    badgeClass: "bg-fuchsia-100 text-fuchsia-800 border border-fuchsia-200",
    iconWrap: "bg-fuchsia-600 text-white shadow-fuchsia-200",
    items: [
      "Hasta 10 profesionales activos",
      "Hasta 25 servicios",
      "Todo lo de Pro",
      "Historial y gestión de clientes",
      "Personalización de la página de reservas",
      "Estadísticas avanzadas",
      "Soporte prioritario",
      "IA que detecta horarios vacíos y sugiere cómo llenarlos",
    ],
  },
  {
    key: "vip",
    name: "VIP",
    price: "$59.990",
    period: "/mes",
    description:
      "Para negocios que quieren usar automatización avanzada para vender más y depender menos de coordinación manual.",
    badge: "Más crecimiento",
    cta: "Elegir VIP",
    href: "/signup?plan=vip",
    icon: "vip",
    gradient: "from-amber-400 via-orange-500 to-rose-500",
    softBg: "bg-orange-50/80",
    ring: "ring-orange-300",
    button: "bg-orange-600 hover:bg-orange-700",
    badgeClass: "bg-orange-100 text-orange-800 border border-orange-200",
    iconWrap: "bg-orange-500 text-white shadow-orange-200",
    items: [
      "Hasta 20 profesionales activos",
      "Servicios ampliados",
      "Todo lo de Premium",
      "IA por WhatsApp para responder y agendar",
      "Lista de espera inteligente",
      "Avisos inteligentes para reactivar clientes",
      "Sugerencias de promociones para llenar horas vacías",
      "Onboarding personalizado",
    ],
  },
  {
    key: "vipplus",
    name: "VIP+",
    price: "Próximamente",
    period: "",
    description:
      "Un plan más personalizado para negocios que quieren acompañamiento más cercano, campañas y automatización avanzada.",
    badge: "Próximamente",
    cta: "Muy pronto",
    href: "#",
    comingSoon: true,
    icon: "vipplus",
    gradient: "from-slate-500 via-zinc-600 to-slate-800",
    softBg: "bg-slate-100/90",
    ring: "ring-slate-300",
    button: "bg-slate-600 hover:bg-slate-700",
    badgeClass: "bg-slate-200 text-slate-700 border border-slate-300",
    iconWrap: "bg-slate-700 text-white shadow-slate-200",
    items: [
      "Todo lo de VIP",
      "Configuración más personalizada",
      "Automatizaciones más avanzadas",
      "Mayor acompañamiento",
      "Enfoque más consultivo y estratégico",
    ],
  },
];

const comparisonRows = [
  {
    label: "Profesionales activos",
    values: ["1", "3", "10", "20", "Próximamente"],
  },
  {
    label: "Servicios",
    values: ["3", "10", "25", "Ampliados", "Próximamente"],
  },
  {
    label: "Página de reservas online",
    values: ["Sí", "Sí", "Sí", "Sí", "Sí"],
  },
  {
    label: "Google Calendar",
    values: ["Sí", "Sí", "Sí", "Sí", "Sí"],
  },
  {
    label: "Recordatorios por correo",
    values: ["Sí", "Sí", "Sí", "Sí", "Sí"],
  },
  {
    label: "Recordatorios por WhatsApp",
    values: ["No", "Sí", "Sí", "Sí", "Sí"],
  },
  {
    label: "Estadísticas",
    values: ["Básicas", "Básicas", "Avanzadas", "Avanzadas", "Avanzadas"],
  },
  {
    label: "IA para mejorar la agenda",
    values: ["No", "No", "Sí", "Sí", "Sí"],
  },
  {
    label: "IA por WhatsApp para agendar",
    values: ["No", "No", "No", "Sí", "Sí"],
  },
  {
    label: "Lista de espera inteligente",
    values: ["No", "No", "No", "Sí", "Sí"],
  },
  {
    label: "Onboarding personalizado",
    values: ["No", "No", "No", "Sí", "Sí"],
  },
];

function PlanIcon({ type }: { type: Plan["icon"] }) {
  if (type === "starter") return <Clock3 className="h-5 w-5" />;
  if (type === "pro") return <MessageCircle className="h-5 w-5" />;
  if (type === "premium") return <BarChart3 className="h-5 w-5" />;
  if (type === "vip") return <Crown className="h-5 w-5" />;
  return <Wand2 className="h-5 w-5" />;
}

export default function PlanesPage() {
  const [selectedPlan, setSelectedPlan] = useState<string>("pro");

  const currentPlan = useMemo(
    () => plans.find((p) => p.key === selectedPlan) ?? plans[1],
    [selectedPlan]
  );

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.22),transparent_28%),radial-gradient(circle_at_top_right,rgba(217,70,239,0.18),transparent_25%),radial-gradient(circle_at_bottom,rgba(249,115,22,0.16),transparent_25%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(15,23,42,0.6),rgba(2,6,23,0.95))]" />

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
              Elige el plan ideal para ordenar, automatizar y hacer crecer tu agenda.
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.06 }}
              className="mx-auto mt-5 max-w-3xl text-lg leading-8 text-slate-300"
            >
              Orbyx no solo te ayuda a gestionar reservas. También te ayuda a responder
              más rápido, reducir horas vacías y dar una imagen más profesional a tu negocio.
            </motion.p>

            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link
                href="#planes"
                className="inline-flex h-12 items-center justify-center rounded-2xl bg-white px-6 text-sm font-medium text-slate-900 transition hover:bg-slate-100"
              >
                Ver planes
              </Link>

              <Link
                href="/"
                className="inline-flex h-12 items-center justify-center rounded-2xl border border-white/20 bg-white/10 px-6 text-sm font-medium text-white transition hover:bg-white/15"
              >
                Volver al inicio
              </Link>
            </div>

            <div className="mt-8 inline-flex rounded-2xl border border-amber-400/30 bg-amber-400/10 px-4 py-2 text-sm text-amber-100">
              Puedes mostrar tus precios con IVA incluido o como + IVA, pero te conviene ser consistente en toda la web.
            </div>
          </div>
        </div>
      </section>

      <section id="planes" className="mx-auto max-w-7xl px-6 py-12 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-sky-300">
            Una oferta clara
          </p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
            Un solo producto, distintos niveles de crecimiento
          </h2>
          <p className="mt-4 text-lg leading-8 text-slate-300">
            Todos los planes usan el mismo panel. A medida que creces, desbloqueas
            más capacidad y más automatización.
          </p>
        </div>

        <div className="mt-10 grid gap-6 xl:grid-cols-5">
          {plans.map((plan, index) => {
            const isSelected = selectedPlan === plan.key;

            return (
              <motion.div
                key={plan.key}
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.35, delay: index * 0.05 }}
                className={`group relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 shadow-[0_18px_50px_rgba(0,0,0,0.22)] backdrop-blur-sm transition-all ${
                  isSelected
                    ? `scale-[1.02] ring-2 ${plan.ring}`
                    : "hover:-translate-y-1 hover:border-white/20"
                }`}
              >
                <button
                  type="button"
                  onClick={() => setSelectedPlan(plan.key)}
                  className="absolute inset-0 z-10"
                  aria-label={`Seleccionar plan ${plan.name}`}
                />

                <div className={`h-2 w-full bg-gradient-to-r ${plan.gradient}`} />

                <div className={`relative z-20 p-7 ${isSelected ? plan.softBg : ""}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      {plan.badge ? (
                        <div
                          className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${plan.badgeClass}`}
                        >
                          {plan.badge}
                        </div>
                      ) : null}

                      <div className="mt-4 flex items-center gap-3">
                        <div
                          className={`inline-flex h-11 w-11 items-center justify-center rounded-2xl shadow-lg ${plan.iconWrap}`}
                        >
                          <PlanIcon type={plan.icon} />
                        </div>

                        <div>
                          <h3 className="text-2xl font-semibold text-slate-900">
                            {isSelected ? (
                              <span className="text-slate-900">{plan.name}</span>
                            ) : (
                              <span className="text-white">{plan.name}</span>
                            )}
                          </h3>
                          {isSelected ? (
                            <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-600">
                              Seleccionado
                            </p>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  </div>

                  <p
                    className={`mt-4 min-h-[88px] text-sm leading-6 ${
                      isSelected ? "text-slate-700" : "text-slate-300"
                    }`}
                  >
                    {plan.description}
                  </p>

                  <div className="mt-6 flex items-end gap-1">
                    <span
                      className={`text-4xl font-semibold tracking-tight ${
                        isSelected ? "text-slate-900" : "text-white"
                      }`}
                    >
                      {plan.price}
                    </span>
                    {plan.period ? (
                      <span className={`pb-1 text-sm ${isSelected ? "text-slate-600" : "text-slate-400"}`}>
                        {plan.period}
                      </span>
                    ) : null}
                  </div>

                  <div className="mt-6 space-y-3">
                    {plan.items.map((item) => (
                      <div
                        key={item}
                        className={`flex items-start gap-3 rounded-2xl border px-4 py-3 ${
                          isSelected
                            ? "border-slate-200 bg-white text-slate-800"
                            : "border-white/10 bg-white/5 text-slate-200"
                        }`}
                      >
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                        <span className="text-sm">{item}</span>
                      </div>
                    ))}
                  </div>

                  {plan.comingSoon ? (
                    <button
                      type="button"
                      disabled
                      className="mt-7 inline-flex h-12 w-full cursor-not-allowed items-center justify-center rounded-2xl border border-white/10 bg-white/10 px-5 text-sm font-medium text-slate-300"
                    >
                      Próximamente
                    </button>
                  ) : (
                    <Link
                      href={plan.href}
                      className={`relative z-20 mt-7 inline-flex h-12 w-full items-center justify-center rounded-2xl px-5 text-sm font-medium text-white transition ${plan.button}`}
                    >
                      {plan.cta}
                    </Link>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-4 lg:px-8">
        <div className="rounded-[30px] border border-white/10 bg-gradient-to-r from-sky-500/15 via-fuchsia-500/10 to-orange-500/15 p-6 backdrop-blur-sm">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-sky-300">
            Plan destacado ahora
          </p>
          <h3 className="mt-2 text-2xl font-semibold text-white">
            {currentPlan.name}
          </h3>
          <p className="mt-2 max-w-3xl text-slate-300">
            {currentPlan.description}
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-12 lg:px-8">
        <div className="overflow-hidden rounded-[30px] border border-white/10 bg-white/5 shadow-[0_18px_50px_rgba(0,0,0,0.22)] backdrop-blur-sm">
          <div className="border-b border-white/10 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 px-6 py-6">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-sky-300">
              Comparativa rápida
            </p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
              Qué cambia a medida que subes de plan
            </h2>
            <p className="mt-3 text-slate-300">
              Más capacidad, más automatización y más herramientas para crecer.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-white/10">
                <tr>
                  <th className="px-5 py-4 font-semibold text-white">Característica</th>
                  <th className="px-5 py-4 font-semibold text-cyan-200">Starter</th>
                  <th className="px-5 py-4 font-semibold text-blue-200">Pro</th>
                  <th className="px-5 py-4 font-semibold text-fuchsia-200">Premium</th>
                  <th className="px-5 py-4 font-semibold text-orange-200">VIP</th>
                  <th className="px-5 py-4 font-semibold text-slate-200">VIP+</th>
                </tr>
              </thead>
              <tbody>
                {comparisonRows.map((row, index) => (
                  <tr
                    key={row.label}
                    className={index % 2 === 0 ? "bg-white/[0.03]" : "bg-white/[0.06]"}
                  >
                    <td className="px-5 py-4 font-medium text-white">{row.label}</td>
                    {row.values.map((value, valueIndex) => (
                      <td key={`${row.label}-${valueIndex}`} className="px-5 py-4 text-slate-300">
                        {value}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-2 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-[30px] border border-cyan-400/20 bg-gradient-to-br from-cyan-500/10 to-sky-500/10 p-8 shadow-[0_18px_50px_rgba(0,0,0,0.2)]">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-cyan-300">
              En qué se diferencia Orbyx
            </p>
            <h3 className="mt-3 text-2xl font-semibold tracking-tight text-white">
              No solo agendas: te ayudamos a llenar tu agenda
            </h3>

            <div className="mt-6 space-y-3">
              {[
                "Tus clientes pueden reservar sin tanto ida y vuelta.",
                "Tu negocio se ve más profesional desde el primer contacto.",
                "La automatización reduce olvidos, ausencias y desorden.",
                "En planes más altos, la IA ayuda a detectar oportunidades y llenar horas vacías.",
              ].map((item) => (
                <div
                  key={item}
                  className="flex items-start gap-3 rounded-2xl border border-cyan-400/15 bg-white/5 px-4 py-3"
                >
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
                  <span className="text-sm text-slate-200">{item}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[30px] border border-fuchsia-400/20 bg-gradient-to-br from-fuchsia-500/10 to-orange-500/10 p-8 shadow-[0_18px_50px_rgba(0,0,0,0.2)]">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-fuchsia-300">
              Próximo nivel
            </p>
            <h3 className="mt-3 text-2xl font-semibold tracking-tight text-white">
              El objetivo es que cada upgrade tenga sentido
            </h3>
            <p className="mt-4 leading-7 text-slate-300">
              Todos los negocios empiezan con lo esencial. A medida que crecen,
              necesitan más profesionales, más servicios, más control y más
              automatización. Por eso Orbyx mantiene el mismo panel y desbloquea
              más capacidades según el plan.
            </p>

            <div className="mt-6 rounded-3xl border border-white/10 bg-white/5 p-5">
              <p className="text-sm font-semibold text-white">
                ¿Subes o bajas de plan después?
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-300">
                No se pierden tus datos. Solo se ajustan límites y funciones
                disponibles según el plan activo.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="px-6 pb-16 pt-12 lg:px-8">
        <div className="mx-auto max-w-6xl overflow-hidden rounded-[34px] border border-white/10 bg-gradient-to-r from-cyan-600 via-blue-600 to-fuchsia-600 p-[1px] shadow-[0_25px_60px_rgba(0,0,0,0.3)]">
          <div className="rounded-[33px] bg-slate-950 px-8 py-10 text-center text-white sm:p-12">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-sky-300">
              Comenzar
            </p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-5xl">
              Empieza con el plan que te haga sentido hoy
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-slate-300 sm:text-lg">
              Y cuando necesites más capacidad o más automatización, subes de plan
              dentro del mismo producto.
            </p>

            <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link
                href={`/signup?plan=${selectedPlan === "vipplus" ? "pro" : selectedPlan}`}
                className="inline-flex h-12 items-center justify-center rounded-2xl bg-white px-6 text-sm font-medium text-slate-900 transition hover:bg-slate-100"
              >
                Empezar con {selectedPlan === "vipplus" ? "Pro" : currentPlan.name}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>

              <Link
                href="/"
                className="inline-flex h-12 items-center justify-center rounded-2xl border border-white/20 bg-white/10 px-6 text-sm font-medium text-white transition hover:bg-white/15"
              >
                Ver inicio
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}