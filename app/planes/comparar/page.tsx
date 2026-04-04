"use client";

import Link from "next/link";
import {
  Crown,
  Gem,
  Mail,
  Sparkles,
  ArrowLeft,
  Building2,
  Info,
  Check,
} from "lucide-react";

type PlanKey = "pro" | "premium" | "vip" | "platinum";

type Plan = {
  key: PlanKey;
  name: string;
  priceLabel: string;
  subtitle: string;
  icon: "mail" | "sparkles" | "crown" | "gem";
  accentClass: string;
  borderClass: string;
  softBgClass: string;
  badge?: string;
};

type ComparisonRow = {
  label: string;
  values: Record<PlanKey, string>;
  info?: string;
  highlight?: boolean;
};

const plans: Plan[] = [
  {
    key: "pro",
    name: "Pro",
    priceLabel: "$19.990",
    subtitle: "Ordena tu negocio y empieza a reservar online",
    icon: "mail",
    accentClass: "text-sky-300",
    borderClass: "border-sky-400/25",
    softBgClass: "bg-sky-500/10",
  },
  {
    key: "premium",
    name: "Premium",
    priceLabel: "$29.990",
    subtitle: "Más control, mejor seguimiento y menos ausencias",
    icon: "sparkles",
    accentClass: "text-violet-300",
    borderClass: "border-violet-400/25",
    softBgClass: "bg-violet-500/10",
  },
  {
    key: "vip",
    name: "VIP",
    priceLabel: "$79.990",
    subtitle: "Activa clientes y responde más rápido por WhatsApp",
    icon: "crown",
    accentClass: "text-amber-300",
    borderClass: "border-amber-400/25",
    softBgClass: "bg-amber-500/10",
    badge: "Más elegido",
  },
  {
    key: "platinum",
    name: "Platinum",
    priceLabel: "$189.990",
    subtitle: "Automatiza tu negocio y convierte más reservas",
    icon: "gem",
    accentClass: "text-emerald-300",
    borderClass: "border-emerald-400/25",
    softBgClass: "bg-emerald-500/10",
    badge: "IA avanzada",
  },
];

const comparisonRows: ComparisonRow[] = [
  {
    label: "Sucursales incluidas",
    values: {
      pro: "1",
      premium: "2",
      vip: "3",
      platinum: "10",
    },
    info: "Cantidad máxima de sucursales que puedes operar dentro de la misma cuenta.",
  },
  {
    label: "Profesionales incluidos",
    values: {
      pro: "2",
      premium: "5",
      vip: "10",
      platinum: "20",
    },
    info: "Cantidad base de profesionales o staff que puedes registrar en el plan.",
  },
  {
    label: "Servicios incluidos",
    values: {
      pro: "10",
      premium: "25",
      vip: "50",
      platinum: "100",
    },
    info: "Cantidad base de servicios activos que puedes configurar en tu cuenta.",
  },
  {
    label: "Profesional extra",
    values: {
      pro: "+5 servicios",
      premium: "+5 servicios",
      vip: "+5 servicios",
      platinum: "+5 servicios",
    },
    info: "Cada profesional extra agrega también capacidad adicional de servicios.",
  },
  {
    label: "Página pública de reservas",
    values: {
      pro: "Sí",
      premium: "Sí",
      vip: "Sí",
      platinum: "Sí",
    },
    info: "Página donde tus clientes pueden reservar online según horarios y disponibilidad.",
  },
  {
    label: "Agenda online",
    values: {
      pro: "Sí",
      premium: "Sí",
      vip: "Sí",
      platinum: "Sí",
    },
    info: "Agenda centralizada para gestionar reservas, cambios, estados y disponibilidad.",
  },
  {
    label: "Gestión de clientes",
    values: {
      pro: "Sí",
      premium: "Sí",
      vip: "Sí",
      platinum: "Sí",
    },
    info: "Registro y seguimiento operativo de clientes dentro del sistema.",
  },
  {
    label: "Emails de confirmación y notificación",
    values: {
      pro: "Sí",
      premium: "Sí",
      vip: "Sí",
      platinum: "Sí",
    },
    info: "Correos automáticos que acompañan el flujo de reserva y comunicación básica con el cliente.",
  },
  {
    label: "Recordatorios por email",
    values: {
      pro: "—",
      premium: "Sí",
      vip: "Sí",
      platinum: "Sí",
    },
    info: "Correos automáticos enviados antes de la cita para reducir ausencias.",
  },
  {
    label: "Campañas por email",
    values: {
      pro: "—",
      premium: "—",
      vip: "Incluidas",
      platinum: "Incluidas",
    },
    info: "Mensajes masivos por correo para activar, recuperar o promocionar a tu base de clientes.",
    highlight: true,
  },
  {
    label: "Recordatorios por WhatsApp",
    values: {
      pro: "—",
      premium: "—",
      vip: "200 / mes",
      platinum: "800 / mes",
    },
    info: "Capacidad mensual incluida para reducir ausencias desde un canal mucho más directo.",
    highlight: true,
  },
  {
    label: "Respuestas por WhatsApp",
    values: {
      pro: "—",
      premium: "—",
      vip: "200 / mes",
      platinum: "800 / mes",
    },
    info: "Capacidad mensual incluida para mantener conversaciones activas con tus clientes.",
  },
  {
    label: "IA integrada en WhatsApp",
    values: {
      pro: "—",
      premium: "—",
      vip: "Responde y deriva a reserva",
      platinum: "Responde, sigue y automatiza",
    },
    info: "En VIP la IA responde consultas y deriva a tu página de reservas. En Platinum además hace seguimiento y automatiza mejor la atención.",
    highlight: true,
  },
  {
    label: "Campañas por WhatsApp",
    values: {
      pro: "—",
      premium: "—",
      vip: "Disponible como adicional",
      platinum: "Disponible como adicional",
    },
    info: "No vienen incluidas. Valor: $9.000 + iva por bloque. No acumulables y uso dentro del mes.",
  },
  {
    label: "Automatizaciones avanzadas",
    values: {
      pro: "—",
      premium: "—",
      vip: "—",
      platinum: "Sí",
    },
    info: "Acciones automáticas como reactivación de clientes, recuperación de no-show y seguimiento sin intervención manual.",
    highlight: true,
  },
  {
    label: "Encuestas post atención por email",
    values: {
      pro: "—",
      premium: "—",
      vip: "—",
      platinum: "Sí",
    },
    info: "Encuestas automáticas para medir satisfacción, detectar problemas y mejorar la experiencia del cliente.",
  },
  {
    label: "Estadísticas básicas",
    values: {
      pro: "Sí",
      premium: "Sí",
      vip: "Sí",
      platinum: "Sí",
    },
    info: "Vista inicial del comportamiento del negocio, reservas y operación general.",
  },
  {
    label: "Visión más avanzada del negocio",
    values: {
      pro: "—",
      premium: "—",
      vip: "Sí",
      platinum: "Sí",
    },
    info: "Mayor visibilidad para seguir mejor la operación, activar clientes y tomar decisiones con más contexto.",
  },
] as const;

function PlanIcon({ type }: { type: Plan["icon"] }) {
  if (type === "mail") return <Mail className="h-5 w-5" />;
  if (type === "sparkles") return <Sparkles className="h-5 w-5" />;
  if (type === "crown") return <Crown className="h-5 w-5" />;
  return <Gem className="h-5 w-5" />;
}

function InfoDot({ text }: { text: string }) {
  return (
    <span className="group relative ml-2 inline-flex align-middle">
      <span className="inline-flex h-5 w-5 cursor-help items-center justify-center rounded-full border border-white/15 bg-white/8 text-slate-300 transition hover:bg-white/12 hover:text-white">
        <Info className="h-3 w-3" />
      </span>

      <span className="pointer-events-none absolute left-full top-1/2 z-20 ml-3 hidden w-72 -translate-y-1/2 rounded-2xl border border-white/10 bg-slate-950/95 px-3 py-2 text-xs font-normal leading-5 text-slate-200 shadow-[0_20px_50px_rgba(0,0,0,0.45)] group-hover:block">
        {text}
      </span>
    </span>
  );
}

function CellValue({
  value,
  highlight = false,
}: {
  value: string;
  highlight?: boolean;
}) {
  const positive =
    value === "Sí" ||
    value === "Incluidas" ||
    value === "Incluidos" ||
    value === "Disponible como adicional";

  if (value === "—") {
    return <span className="text-slate-500">—</span>;
  }

  if (positive && !highlight) {
    return (
      <span className="inline-flex items-center justify-center gap-1 text-slate-100">
        <Check className="h-4 w-4 text-emerald-300" />
        {value}
      </span>
    );
  }

  return (
    <span className={highlight ? "font-semibold text-white" : "text-slate-200"}>
      {value}
    </span>
  );
}

export default function CompararPlanesPage() {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(99,102,241,0.18),_transparent_22%),radial-gradient(circle_at_left,_rgba(14,165,233,0.12),_transparent_28%),linear-gradient(180deg,_#0b1120_0%,_#0f172a_40%,_#111827_100%)] text-white">
      <section className="mx-auto w-full max-w-[1600px] px-4 py-8 lg:px-8 2xl:px-10">
        <div className="rounded-[34px] border border-white/10 bg-white/6 p-6 shadow-[0_30px_90px_rgba(15,23,42,0.34)] backdrop-blur-xl lg:p-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="max-w-4xl">
              <span className="inline-flex rounded-full border border-indigo-400/20 bg-indigo-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-indigo-200">
                Comparador Orbyx
              </span>

              <h1 className="mt-4 text-3xl font-semibold tracking-tight text-white lg:text-5xl xl:text-[3.2rem] xl:leading-[1.05]">
                Compara qué tan lejos puede llevarte cada plan
              </h1>

              <p className="mt-3 max-w-3xl text-base leading-7 text-slate-300 lg:text-lg">
                Desde ordenar tu agenda hasta automatizar atención, recuperar clientes y convertir más reservas.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                href="/planes#planes"
                className="inline-flex h-11 items-center justify-center rounded-2xl border border-white/10 bg-white/5 px-5 text-sm font-medium text-white transition hover:bg-white/10"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Volver a planes
              </Link>

              <Link
                href="/"
                className="inline-flex h-11 items-center justify-center rounded-2xl bg-white px-5 text-sm font-semibold text-slate-900 transition hover:bg-slate-100"
              >
                Volver al inicio
              </Link>
            </div>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {plans.map((plan) => (
              <div
                key={plan.key}
                className={`relative rounded-3xl border ${plan.borderClass} ${plan.softBgClass} p-5`}
              >
                {plan.badge ? (
                  <span className="absolute right-4 top-4 rounded-full bg-white px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-slate-900">
                    {plan.badge}
                  </span>
                ) : null}

                <span
                  className={`inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10 ${plan.accentClass}`}
                >
                  <PlanIcon type={plan.icon} />
                </span>

                <p className="mt-4 text-lg font-semibold text-white">{plan.name}</p>
                <p className="mt-1 text-sm leading-6 text-slate-300">
                  {plan.subtitle}
                </p>
                <p className="mt-5 text-3xl font-semibold text-white">
                  {plan.priceLabel}
                </p>
                <p className="mt-1 text-sm text-slate-400">+ iva / mes</p>
              </div>
            ))}
          </div>

          <div className="mt-8 overflow-hidden rounded-[28px] border border-white/10 bg-white/5">
            <div className="overflow-x-auto">
              <table className="min-w-[1180px] w-full border-collapse">
                <thead>
                  <tr className="bg-white/5">
                    <th className="px-4 py-4 text-left text-sm font-semibold text-slate-200">
                      Qué incluye cada plan
                    </th>
                    {plans.map((plan) => (
                      <th
                        key={plan.key}
                        className="px-4 py-4 text-center text-sm font-semibold text-slate-200"
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
                      className={index % 2 === 0 ? "bg-white/0" : "bg-white/[0.03]"}
                    >
                      <td className="border-t border-white/10 px-4 py-4 text-sm font-medium text-white">
                        <div className="flex items-center">
                          <span className={row.highlight ? "text-white font-semibold" : ""}>
                            {row.label}
                          </span>
                          {row.info ? <InfoDot text={row.info} /> : null}
                        </div>
                      </td>

                      {plans.map((plan) => (
                        <td
                          key={`${row.label}-${plan.key}`}
                          className="border-t border-white/10 px-4 py-4 text-center text-sm text-slate-300"
                        >
                          <CellValue
                            value={row.values[plan.key]}
                            highlight={Boolean(row.highlight)}
                          />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="mt-8 grid gap-4 xl:grid-cols-2">
            <div className="rounded-[24px] border border-white/10 bg-white/5 p-4">
              <div className="flex items-center gap-3">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-white/10 text-slate-200">
                  <Building2 className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-sm font-semibold text-white">
                    Multi-sucursal por plan
                  </p>
                  <p className="text-sm text-slate-300">
                    Pro: 1 · Premium: 2 · VIP: 3 · Platinum: 10
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-[24px] border border-amber-300/15 bg-amber-500/10 p-4">
              <p className="text-sm font-semibold text-amber-100">
                Importante sobre campañas y bloques
              </p>
              <p className="mt-2 text-sm leading-6 text-amber-50/90">
                Las campañas por WhatsApp se contratan como adicional.
                Su valor es <span className="font-semibold">$9.000 + iva</span> por bloque.
                Los bloques mensuales incluidos y adicionales no son acumulables y deben usarse dentro del mes.
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}