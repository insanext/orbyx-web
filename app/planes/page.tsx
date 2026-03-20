"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Check, Sparkles, ArrowRight, Clock3, MessageCircle, BarChart3, Crown } from "lucide-react";

type Plan = {
  name: string;
  price: string;
  period: string;
  description: string;
  badge?: string;
  highlight?: boolean;
  cta: string;
  href: string;
  comingSoon?: boolean;
  items: string[];
};

const plans: Plan[] = [
  {
    name: "Starter",
    price: "$9.990",
    period: "/mes",
    description:
      "Para independientes o negocios pequeños que quieren comenzar a ordenar su agenda.",
    badge: "Para comenzar",
    cta: "Comenzar con Starter",
    href: "/signup?plan=starter",
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
    name: "Pro",
    price: "$19.990",
    period: "/mes",
    description:
      "Para negocios que ya tienen flujo constante y necesitan más orden, recordatorios y control.",
    badge: "Más elegido",
    highlight: true,
    cta: "Elegir Pro",
    href: "/signup?plan=pro",
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
    name: "Premium",
    price: "$39.990",
    period: "/mes",
    description:
      "Para negocios que quieren automatizar más, mejorar la experiencia y empezar a apoyarse en IA.",
    badge: "Más automatización",
    cta: "Elegir Premium",
    href: "/signup?plan=premium",
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
    name: "VIP",
    price: "$59.990",
    period: "/mes",
    description:
      "Para negocios que quieren usar automatización avanzada para vender más y depender menos de coordinación manual.",
    badge: "Más crecimiento",
    cta: "Elegir VIP",
    href: "/signup?plan=vip",
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
    name: "VIP+",
    price: "Próximamente",
    period: "",
    description:
      "Un plan más personalizado para negocios que quieren acompañamiento más cercano, campañas y automatización avanzada.",
    badge: "Próximamente",
    cta: "Muy pronto",
    href: "#",
    comingSoon: true,
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

function FeatureIcon({ planName }: { planName: string }) {
  if (planName === "Starter") return <Clock3 className="h-5 w-5" />;
  if (planName === "Pro") return <MessageCircle className="h-5 w-5" />;
  if (planName === "Premium") return <BarChart3 className="h-5 w-5" />;
  return <Crown className="h-5 w-5" />;
}

export default function PlanesPage() {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <section className="relative overflow-hidden border-b border-slate-200 bg-[radial-gradient(circle_at_top,rgba(14,165,233,0.12),transparent_35%),radial-gradient(circle_at_100%_0%,rgba(59,130,246,0.10),transparent_30%),linear-gradient(to_bottom,#ffffff,#f8fafc)]">
        <div className="mx-auto max-w-7xl px-6 py-14 lg:px-8 lg:py-16">
          <div className="mx-auto max-w-4xl text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-sky-50 px-4 py-1.5 text-sm font-medium text-sky-700">
              <Sparkles className="h-4 w-4" />
              Planes Orbyx
            </div>

            <motion.h1
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45 }}
              className="mt-5 text-4xl font-semibold leading-tight tracking-tight sm:text-5xl lg:text-6xl"
            >
              Elige el plan ideal para ordenar, automatizar y hacer crecer tu agenda.
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.06 }}
              className="mx-auto mt-5 max-w-3xl text-lg leading-8 text-slate-600"
            >
              Orbyx no solo te ayuda a gestionar reservas. También te ayuda a
              responder más rápido, reducir horas vacías y dar una imagen más
              profesional a tu negocio.
            </motion.p>

            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link
                href="#planes"
                className="inline-flex h-12 items-center justify-center rounded-2xl bg-sky-600 px-6 text-sm font-medium text-white transition hover:bg-sky-700"
              >
                Ver planes
              </Link>

              <Link
                href="/"
                className="inline-flex h-12 items-center justify-center rounded-2xl border border-slate-300 bg-white px-6 text-sm font-medium text-slate-800 transition hover:bg-slate-100"
              >
                Volver al inicio
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section id="planes" className="mx-auto max-w-7xl px-6 py-12 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-sky-700">
            Una oferta clara
          </p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
            Un solo producto, distintos niveles de crecimiento
          </h2>
          <p className="mt-4 text-lg leading-8 text-slate-600">
            Todos los planes usan el mismo panel. A medida que creces, desbloqueas
            más capacidad y más automatización.
          </p>
        </div>

        <div className="mt-10 grid gap-6 xl:grid-cols-5">
          {plans.map((plan, index) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.35, delay: index * 0.05 }}
              className={`rounded-3xl border p-7 ${
                plan.highlight
                  ? "border-sky-300 bg-sky-50 shadow-md"
                  : "border-slate-200 bg-white shadow-sm"
              } ${plan.comingSoon ? "opacity-95" : ""}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div
                    className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                      plan.highlight
                        ? "bg-sky-600 text-white"
                        : plan.comingSoon
                        ? "bg-amber-100 text-amber-800"
                        : "bg-slate-100 text-slate-700"
                    }`}
                  >
                    {plan.badge}
                  </div>

                  <div className="mt-4 flex items-center gap-2">
                    <div
                      className={`inline-flex h-10 w-10 items-center justify-center rounded-2xl ${
                        plan.highlight
                          ? "bg-sky-600 text-white"
                          : "bg-slate-100 text-slate-700"
                      }`}
                    >
                      <FeatureIcon planName={plan.name} />
                    </div>
                    <h3 className="text-2xl font-semibold">{plan.name}</h3>
                  </div>
                </div>
              </div>

              <p className="mt-4 min-h-[88px] text-sm leading-6 text-slate-600">
                {plan.description}
              </p>

              <div className="mt-6 flex items-end gap-1">
                <span className="text-4xl font-semibold tracking-tight">
                  {plan.price}
                </span>
                {plan.period ? (
                  <span className="pb-1 text-sm text-slate-500">{plan.period}</span>
                ) : null}
              </div>

              <div className="mt-6 space-y-3">
                {plan.items.map((item) => (
                  <div key={item} className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                    <span className="text-sm text-slate-700">{item}</span>
                  </div>
                ))}
              </div>

              {plan.comingSoon ? (
                <button
                  type="button"
                  disabled
                  className="mt-7 inline-flex h-12 w-full cursor-not-allowed items-center justify-center rounded-2xl border border-slate-200 bg-slate-100 px-5 text-sm font-medium text-slate-500"
                >
                  Próximamente
                </button>
              ) : (
                <Link
                  href={plan.href}
                  className={`mt-7 inline-flex h-12 w-full items-center justify-center rounded-2xl px-5 text-sm font-medium transition ${
                    plan.highlight
                      ? "bg-sky-600 text-white hover:bg-sky-700"
                      : "border border-slate-300 bg-white text-slate-800 hover:bg-slate-100"
                  }`}
                >
                  {plan.cta}
                </Link>
              )}
            </motion.div>
          ))}
        </div>
      </section>

      <section className="border-y border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-6 py-12 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-sky-700">
              Comparativa rápida
            </p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
              Qué cambia a medida que subes de plan
            </h2>
            <p className="mt-4 text-lg leading-8 text-slate-600">
              Más capacidad, más automatización y más herramientas para crecer.
            </p>
          </div>

          <div className="mt-8 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-5 py-4 font-semibold text-slate-900">Característica</th>
                    <th className="px-5 py-4 font-semibold text-slate-900">Starter</th>
                    <th className="px-5 py-4 font-semibold text-slate-900">Pro</th>
                    <th className="px-5 py-4 font-semibold text-slate-900">Premium</th>
                    <th className="px-5 py-4 font-semibold text-slate-900">VIP</th>
                    <th className="px-5 py-4 font-semibold text-slate-900">VIP+</th>
                  </tr>
                </thead>
                <tbody>
                  {comparisonRows.map((row, index) => (
                    <tr
                      key={row.label}
                      className={index % 2 === 0 ? "bg-white" : "bg-slate-50/60"}
                    >
                      <td className="px-5 py-4 font-medium text-slate-800">{row.label}</td>
                      {row.values.map((value, valueIndex) => (
                        <td key={`${row.label}-${valueIndex}`} className="px-5 py-4 text-slate-600">
                          {value}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-12 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-[30px] border border-slate-200 bg-white p-8 shadow-sm">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-sky-700">
              En qué se diferencia Orbyx
            </p>
            <h3 className="mt-3 text-2xl font-semibold tracking-tight">
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
                  className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3"
                >
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                  <span className="text-sm text-slate-700">{item}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[30px] border border-sky-200 bg-sky-50 p-8 shadow-sm">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-sky-700">
              Próximo nivel
            </p>
            <h3 className="mt-3 text-2xl font-semibold tracking-tight">
              El objetivo es que cada upgrade tenga sentido
            </h3>
            <p className="mt-4 leading-7 text-slate-700">
              Todos los negocios empiezan con lo esencial. A medida que crecen,
              necesitan más profesionales, más servicios, más control y más
              automatización. Por eso Orbyx mantiene el mismo panel y desbloquea
              más capacidades según el plan.
            </p>

            <div className="mt-6 rounded-3xl border border-sky-200 bg-white p-5">
              <p className="text-sm font-semibold text-slate-900">
                ¿Subes o bajas de plan después?
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                No se pierden tus datos. Solo se ajustan límites y funciones
                disponibles según el plan activo.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="px-6 pb-14 lg:px-8">
        <div className="mx-auto max-w-6xl rounded-[32px] border border-slate-200 bg-slate-900 p-8 text-center text-white shadow-[0_20px_60px_rgba(15,23,42,0.14)] sm:p-12">
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
              href="/signup?plan=pro"
              className="inline-flex h-12 items-center justify-center rounded-2xl bg-sky-500 px-6 text-sm font-medium text-white transition hover:bg-sky-400"
            >
              Empezar ahora
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>

            <Link
              href="/"
              className="inline-flex h-12 items-center justify-center rounded-2xl border border-slate-600 bg-transparent px-6 text-sm font-medium text-white transition hover:bg-slate-800"
            >
              Ver inicio
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}