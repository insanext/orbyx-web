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
  Info,
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
  selectedBorder: string;
  buttonClass: string;
};

type FeatureRow = {
  label: string;
  help: string;
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
    href: "/checkout?plan=starter",
    cta: "Elegir Starter",
    icon: "starter",
    headerGradient: "from-cyan-500 via-sky-500 to-blue-600",
    selectedBg: "bg-cyan-50/90",
    selectedBorder: "border-cyan-300/70",
    buttonClass: "bg-cyan-600 hover:bg-cyan-700",
  },
  {
    key: "pro",
    name: "Pro",
    price: "$19.990",
    iva: "+ IVA / mes",
    description:
      "Para negocios con más movimiento que necesitan recordatorios, orden y control diario.",
    badge: "Más elegido",
    href: "/checkout?plan=pro",
    cta: "Elegir Pro",
    icon: "pro",
    headerGradient: "from-blue-500 via-indigo-500 to-violet-600",
    selectedBg: "bg-blue-50/88",
    selectedBorder: "border-blue-300/70",
    buttonClass: "bg-blue-600 hover:bg-blue-700",
  },
  {
    key: "premium",
    name: "Premium",
    price: "$34.990",
    iva: "+ IVA / mes",
    description:
      "Para negocios que quieren automatizar la atención y permitir que la IA también agende.",
    badge: "Más automatización",
    href: "/checkout?plan=premium",
    cta: "Elegir Premium",
    icon: "premium",
    headerGradient: "from-fuchsia-500 via-purple-500 to-indigo-600",
    selectedBg: "bg-fuchsia-50/86",
    selectedBorder: "border-fuchsia-300/70",
    buttonClass: "bg-fuchsia-600 hover:bg-fuchsia-700",
  },
  {
    key: "vip",
    name: "VIP",
    price: "$54.990",
    iva: "+ IVA / mes",
    description:
      "Para negocios que quieren usar IA para llenar horas vacías, recuperar clientes y crecer.",
    badge: "Más crecimiento",
    href: "/checkout?plan=vip",
    cta: "Elegir VIP",
    icon: "vip",
    headerGradient: "from-amber-400 via-orange-500 to-rose-500",
    selectedBg: "bg-orange-50/86",
    selectedBorder: "border-orange-300/70",
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
    selectedBg: "bg-slate-100/88",
    selectedBorder: "border-slate-300/70",
    buttonClass: "bg-slate-600 hover:bg-slate-700",
  },
];

const featureRows: FeatureRow[] = [
  {
    label: "Precio mensual",
    help: "Valor mensual del plan antes de aplicar IVA.",
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
    label: "Profesionales activos",
    help: "Cantidad de miembros de tu equipo que pueden atender y gestionar reservas dentro del sistema al mismo tiempo.",
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
    help: "Cantidad de servicios que puedes ofrecer en tu página de reservas, como corte, masaje, evaluación o consulta.",
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
    help: "Página donde tus clientes pueden entrar y reservar horarios disponibles de tu negocio de forma online y manual.",
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
    help: "El cliente recibe un correo automático con el detalle de su reserva y puede confirmar, revisar o cancelar según el flujo configurado.",
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
    help: "Permite que el cliente cancele su cita desde un enlace o flujo definido, evitando mensajes manuales y desorden.",
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
    help: "Sincroniza la disponibilidad y eventos del negocio con Google Calendar para evitar cruces y mejorar el control.",
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
    help: "Botón o enlace que puedes usar en Instagram, WhatsApp, Facebook u otras redes para que el cliente llegue directo a reservar.",
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
    help: "Envío automático de recordatorios al cliente antes de su cita para reducir ausencias y olvidos.",
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
    help: "Mensajes automáticos por WhatsApp para recordar citas y mejorar la asistencia del cliente.",
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
    help: "Vista interna donde administras agenda, reservas, estados, horarios y operación diaria del negocio.",
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
    help: "Métricas para entender reservas, no show, servicios más usados y comportamiento general de la agenda.",
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
    help: "Ficha del cliente con historial de reservas, visitas anteriores y seguimiento para entender mejor su relación con el negocio.",
    values: {
      starter: false,
      pro: false,
      premium: true,
      vip: true,
      platinum: true,
    },
  },
  {
    label: "IA que responde y agenda automáticamente",
    help: "La IA puede conversar con el cliente y registrar reservas automáticamente, sin intervención manual del negocio.",
    values: {
      starter: false,
      pro: false,
      premium: true,
      vip: true,
      platinum: true,
    },
  },
  {
    label: "IA para llenar horas vacías y aumentar reservas",
    help: "Funciones inteligentes para detectar espacios sin uso y ayudarte a convertirlos en reservas, recuperando clientes o empujando promociones.",
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
    help: "Permite adaptar colores, imagen y estilo de la página de reservas para que se vea más alineada con tu marca.",
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
    help: "Atención más rápida para resolver dudas, incidencias o configuraciones importantes del negocio.",
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
    help: "Si se libera una hora, puedes avisar automáticamente a clientes interesados para llenar ese espacio más rápido.",
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
    help: "Detecta patrones de retorno y ayuda a contactar al cliente justo cuando probablemente necesite una nueva cita.",
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
    help: "Permite enviar mensajes o campañas a clientes que hace tiempo no reservan, para intentar traerlos de vuelta.",
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
    help: "La IA puede recomendar ofertas o acciones según horarios vacíos, servicios menos vendidos o momentos de baja demanda.",
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
    help: "Posibilidad de usar una dirección más personalizada para tu página de reservas, reforzando imagen y marca.",
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
    help: "Acompañamiento inicial para ayudarte a dejar tu cuenta, servicios y agenda mejor configurados desde el comienzo.",
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
    help: "Trabajo más consultivo para pensar cómo atraer más clientes, mejorar campañas y aumentar reservas de forma más estratégica.",
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
    help: "Nivel más alto de personalización, configuración y acompañamiento para necesidades más complejas o negocios que quieren algo más a medida.",
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

function FeatureLabel({
  label,
  help,
}: {
  label: string;
  help: string;
}) {
  return (
    <div className="group relative inline-flex items-center gap-2">
      <span>{label}</span>
      <span className="relative inline-flex">
        <button
          type="button"
          className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-white/15 bg-white/5 text-slate-300 transition hover:bg-white/10 hover:text-white"
          aria-label={`Más información sobre ${label}`}
        >
          <Info className="h-3.5 w-3.5" />
        </button>

        <span className="pointer-events-none absolute left-7 top-1/2 z-30 hidden w-80 -translate-y-1/2 rounded-xl border border-white/10 bg-slate-900 px-3 py-2 text-xs font-normal leading-5 text-slate-200 shadow-2xl group-hover:block">
          {help}
        </span>
      </span>
    </div>
  );
}

export default function PlanesPage() {
  const [selectedPlan, setSelectedPlan] = useState<PlanKey>("pro");

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.22),transparent_28%),radial-gradient(circle_at_top_right,rgba(217,70,239,0.18),transparent_25%),radial-gradient(circle_at_bottom,rgba(249,115,22,0.16),transparent_25%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(15,23,42,0.65),rgba(2,6,23,0.96))]" />

        <div className="relative mx-auto max-w-7xl px-6 py-14 lg:px-8 lg:py-18">
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
              Compara planes y elige el que mejor se adapte a tu negocio
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
        <div className="mb-5 flex justify-center">
          <div className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-300">
            Haz click en cualquier parte de una columna para destacarla y comparar mejor
          </div>
        </div>

        <div className="overflow-hidden rounded-[32px] border border-white/10 bg-white/5 shadow-[0_18px_50px_rgba(0,0,0,0.22)] backdrop-blur-sm">
          <div className="overflow-x-auto">
            <table className="min-w-[1140px] w-full border-collapse text-left">
              <thead>
                <tr className="bg-white/8">
                  <th className="sticky left-0 z-20 min-w-[320px] border-b border-white/10 bg-slate-950/95 px-5 py-5 text-base font-semibold text-white backdrop-blur">
                    Características
                  </th>

                  {plans.map((plan) => {
                    const isSelected = selectedPlan === plan.key;

                    return (
                      <th
                        key={plan.key}
                        onClick={() => setSelectedPlan(plan.key)}
                        className={`cursor-pointer border-b border-l border-white/10 align-top transition-all duration-200 ${
                          isSelected
                            ? `min-w-[215px] ${plan.selectedBg} ${plan.selectedBorder} border-x shadow-[inset_0_0_0_1px_rgba(15,23,42,0.05)]`
                            : "min-w-[185px] bg-transparent hover:bg-white/[0.04]"
                        }`}
                      >
                        <div className="block w-full p-4 text-left transition-transform duration-200 hover:-translate-y-1">
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
                              <div className="min-w-0">
                                <div
                                  className={`text-2xl font-semibold ${
                                    isSelected ? "text-slate-900" : "text-white"
                                  }`}
                                >
                                  {plan.name}
                                </div>
                                {isSelected ? (
                                  <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-600">
                                    Seleccionado
                                  </div>
                                ) : null}
                              </div>
                            </div>

                            <div
                              className={`mt-4 text-3xl font-bold leading-tight ${
                                isSelected ? "text-slate-900" : "text-white"
                              } ${plan.comingSoon ? "text-[2rem]" : ""}`}
                            >
                              {plan.price}
                            </div>
                            <div
                              className={`mt-1 text-xs font-medium ${
                                isSelected ? "text-slate-600" : "text-slate-300"
                              }`}
                            >
                              {plan.iva}
                            </div>

                            <p
                              className={`mt-4 min-h-[112px] text-sm leading-6 ${
                                isSelected ? "text-slate-700" : "text-slate-300"
                              }`}
                            >
                              {plan.description}
                            </p>
                          </div>
                        </div>
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
                      <FeatureLabel label={row.label} help={row.help} />
                    </td>

                    {plans.map((plan) => {
                      const isSelected = selectedPlan === plan.key;

                      return (
                        <td
                          key={`${row.label}-${plan.key}`}
                          onClick={() => setSelectedPlan(plan.key)}
                          className={`cursor-pointer border-b border-l border-white/10 px-4 py-4 text-center transition-all duration-200 ${
                            isSelected ? `${plan.selectedBg} ${plan.selectedBorder}` : "hover:bg-white/[0.03]"
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
                        onClick={() => setSelectedPlan(plan.key)}
                        className={`cursor-pointer border-t border-l border-white/10 px-4 py-5 text-center transition-all duration-200 ${
                          isSelected ? `${plan.selectedBg} ${plan.selectedBorder}` : "hover:bg-white/[0.03]"
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
                            className={`inline-flex h-11 w-full items-center justify-center rounded-2xl px-4 text-sm font-semibold text-white shadow-lg transition hover:scale-[1.01] ${plan.buttonClass}`}
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

      <section className="mx-auto max-w-7xl px-6 py-2 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-[30px] border border-cyan-400/20 bg-gradient-to-br from-cyan-500/10 to-sky-500/10 p-8 shadow-[0_18px_50px_rgba(0,0,0,0.2)]">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-cyan-300">
              En qué se diferencia Orbyx
            </p>
            <h3 className="mt-3 text-2xl font-semibold tracking-tight text-white">
              No solo agendas: te ayudamos a gestionar y crecer
            </h3>

            <div className="mt-6 space-y-3">
              {[
                "Tus clientes pueden reservar sin tanto ida y vuelta.",
                "Tu negocio se ve más profesional desde el primer contacto.",
                "La automatización reduce olvidos, ausencias y desorden.",
                "En planes más altos, la IA ayuda a agendar y luego a llenar horas vacías.",
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
              Cada upgrade desbloquea una etapa distinta del negocio
            </h3>
            <p className="mt-4 leading-7 text-slate-300">
              Starter te ayuda a ordenar. Pro te ayuda a operar mejor. Premium automatiza atención con IA. VIP usa IA para llenar agenda y aumentar reservas. Platinum apunta a una capa más consultiva y estratégica.
            </p>

            <div className="mt-6 rounded-3xl border border-white/10 bg-white/5 p-5">
              <p className="text-sm font-semibold text-white">
                ¿Subes o bajas de plan después?
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-300">
                No se pierden tus datos. Solo se ajustan límites y funciones disponibles según el plan activo.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="pb-14 pt-10">
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