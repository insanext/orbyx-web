"use client";

import Link from "next/link";
import {
  ArrowLeft,
  Building2,
  Info,
  Check,
  MessageCircle,
} from "lucide-react";
import { plans, TRIAL_LABEL, type PlanKey } from "@/lib/plans";

type ComparisonRow = {
  label: string;
  values: Record<PlanKey, string>;
  info?: string;
  highlight?: boolean;
};

// Contenido que no varía con el número real de un plan (siempre "Sí" en
// los 3, o texto de posicionamiento sin número que sincronizar) — vive
// acá porque no tiene un campo equivalente en lib/plans.ts. Los valores
// que SÍ dependen de un número real (precio, sucursales, profesionales,
// campañas email, WhatsApp, capacidad grupal) se arman abajo desde
// `plans` (lib/plans.ts) para no volver a duplicarlos.
const SUPPORT_LABEL: Record<PlanKey, string> = {
  starter: "Email",
  business: "Email + chat",
  premium: "Prioritario",
};

function planCard(key: PlanKey) {
  const plan = plans.find((p) => p.key === key)!;
  return {
    key,
    name: plan.name,
    priceLabel: `$${plan.price.toLocaleString("es-CL")}`,
    subtitle: plan.subtitle,
    icon: plan.icon,
    accentClass: plan.accentClass,
    borderClass: plan.borderClass,
    softBgClass: plan.softBgClass,
    badge: plan.badge,
  };
}

const planCards = plans.map((p) => planCard(p.key));

function byPlan(pick: (key: PlanKey) => string): Record<PlanKey, string> {
  return {
    starter: pick("starter"),
    business: pick("business"),
    premium: pick("premium"),
  };
}

const comparisonRows: ComparisonRow[] = [
  {
    label: "Sucursales incluidas",
    values: byPlan((key) => String(plans.find((p) => p.key === key)!.includedBranches)),
    info: "Cantidad máxima de sucursales que puedes operar dentro de la misma cuenta.",
  },
  {
    label: "Profesionales incluidos",
    values: byPlan((key) => String(plans.find((p) => p.key === key)!.includedStaff)),
    info: "Cantidad base de profesionales o staff que puedes registrar en el plan.",
  },
  {
    label: "Servicios incluidos",
    values: byPlan(() => "∞"),
    info: "Los servicios son ilimitados en todos los planes.",
  },
  {
    label: "Página pública de reservas",
    values: byPlan(() => "Sí"),
    info: "Página donde tus clientes pueden reservar online según horarios y disponibilidad.",
  },
  {
    label: "Agenda online",
    values: byPlan(() => "Sí"),
    info: "Agenda centralizada para gestionar reservas, cambios, estados y disponibilidad.",
  },
  {
    label: "Registro de clientes",
    values: byPlan(() => "Sí"),
    info: "Historial y datos básicos de cada cliente dentro del sistema.",
  },
  {
    label: "Seguimiento y reactivación de clientes",
    values: { starter: "—", business: "—", premium: "Sí" },
    info: "Segmenta tu cartera (nuevo, recurrente, frecuente, inactivo) para identificar quiénes dejaron de venir y a quién conviene recontactar — conectado con las campañas de WhatsApp y email, también exclusivas de Premium.",
    highlight: true,
  },
  {
    label: "Emails de confirmación y notificación",
    values: byPlan(() => "Sí"),
    info: "Correos automáticos que acompañan el flujo de reserva y comunicación básica con el cliente.",
  },
  {
    label: "Campañas por email",
    values: byPlan((key) => {
      const n = plans.find((p) => p.key === key)!.includedEmailCampaigns;
      return n > 0 ? `${n.toLocaleString("es-CL")} / mes` : "—";
    }),
    info: "Mensajes masivos por correo para activar, recuperar o promocionar a tu base de clientes.",
    highlight: true,
  },
  {
    label: "WhatsApp confirmación+recordatorio",
    values: byPlan((key) => {
      const n = plans.find((p) => p.key === key)!.includedWaConfirmacion;
      return key === "starter" ? `${n} msgs / mes *` : `${n} msgs / mes`;
    }),
    info: `Mensajes WhatsApp incluidos para confirmaciones y recordatorios automáticos. Ampliable con add-on (packs de 50, desde $2.990). * En Starter: disponible al activar plan pagado, no disponible durante el trial de ${TRIAL_LABEL}.`,
    highlight: true,
  },
  {
    label: "Campañas WhatsApp",
    values: byPlan((key) => {
      const n = plans.find((p) => p.key === key)!.includedCampanasWa;
      return n > 0 ? `${n} msgs / mes incluidos` : "—";
    }),
    info: "Mensajes masivos de marketing por WhatsApp. Solo Premium las incluye de base; disponible como add-on desde Business.",
    highlight: true,
  },
  {
    label: "Capacidad grupal máxima",
    values: byPlan((key) => `${plans.find((p) => p.key === key)!.includedGroupCapacity} personas`),
    info: "Capacidad máxima de personas por slot grupal incluida en el plan. Ampliable con add-on (packs de 25 cupos).",
  },
  {
    label: "Google Calendar",
    values: byPlan(() => "Sí"),
    info: "Sincronización bidireccional con Google Calendar para todos los profesionales.",
  },
  {
    label: "Soporte",
    values: SUPPORT_LABEL,
    info: "Nivel de soporte incluido en el plan.",
  },
  {
    label: `Trial ${TRIAL_LABEL}`,
    values: { starter: "Sí", business: "—", premium: "—" },
    info: `El plan Starter incluye ${TRIAL_LABEL} de prueba gratuita. Los demás planes no incluyen trial.`,
  },
  {
    label: "Estadísticas básicas",
    values: byPlan(() => "Sí"),
    info: "Vista inicial del comportamiento del negocio, reservas y operación general.",
  },
  {
    label: "Visión más avanzada del negocio",
    values: { starter: "—", business: "—", premium: "Sí" },
    info: "Mayor visibilidad para seguir mejor la operación, activar clientes y tomar decisiones con más contexto.",
  },
];

function InfoDot({ text }: { text: string }) {
  return (
    <span className="group relative ml-1.5 inline-flex align-middle">
      <button
        type="button"
        aria-label="Más información"
        className="inline-flex h-4 w-4 cursor-help items-center justify-center rounded-full border border-white/15 bg-white/8 text-slate-300 transition hover:bg-white/12 hover:text-white focus:bg-white/12 focus:text-white focus:outline-none"
      >
        <Info className="h-2.5 w-2.5" />
      </button>

      <span className="pointer-events-none absolute left-0 top-full z-20 mt-2 hidden w-56 rounded-xl border border-white/10 bg-slate-950/95 px-3 py-2 text-[11px] font-normal leading-4 text-slate-200 shadow-[0_20px_50px_rgba(0,0,0,0.45)] group-focus-within:block group-hover:block sm:left-full sm:top-1/2 sm:ml-3 sm:mt-0 sm:w-72 sm:-translate-y-1/2 sm:text-xs sm:leading-5">
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
  const positive = value === "Sí" || value === "Incluidas" || value === "Incluidos";

  if (value === "—") {
    return <span className="text-slate-600">—</span>;
  }

  if (positive) {
    return (
      <span className="inline-flex items-center justify-center gap-1 text-slate-100">
        <span
          className={`inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full ${
            highlight ? "bg-cyan-400/25" : "bg-emerald-400/15"
          }`}
        >
          <Check className={`h-3 w-3 ${highlight ? "text-cyan-200" : "text-emerald-300"}`} />
        </span>
        <span className="hidden sm:inline">{value}</span>
      </span>
    );
  }

  return (
    <span className={highlight ? "font-semibold text-cyan-200" : "text-slate-300"}>
      {value}
    </span>
  );
}

export default function CompararPlanesPage() {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_20%_0%,rgba(34,211,238,0.16),transparent_32%),radial-gradient(circle_at_85%_18%,rgba(14,165,233,0.10),transparent_30%),linear-gradient(180deg,#020814_0%,#050f1e_45%,#020814_100%)] text-white">
      <section className="mx-auto w-full max-w-[1100px] px-3 py-5 sm:px-4 lg:px-6 lg:py-8">
        <div className="rounded-2xl border border-white/10 bg-white/6 p-3 shadow-[0_30px_90px_rgba(15,23,42,0.34)] backdrop-blur-xl sm:p-5 lg:p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="max-w-2xl">
              <h1 className="text-xl font-semibold leading-tight tracking-tight text-white sm:text-2xl lg:text-3xl">
                Compara qué tan lejos puede llevarte{" "}
                <span className="text-[#24e0d0]">cada plan</span>
              </h1>

              <p className="mt-2 text-sm leading-6 text-slate-300">
                Desde ordenar tu agenda hasta automatizar campañas y recuperar clientes.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <Link
                href="/planes#planes"
                className="inline-flex h-9 items-center justify-center rounded-xl border border-white/10 bg-white/5 px-3 text-xs font-medium text-white transition hover:bg-white/10 sm:text-sm"
              >
                <ArrowLeft className="mr-1.5 h-3.5 w-3.5" />
                Volver a planes
              </Link>

              <Link
                href="/"
                className="inline-flex h-9 items-center justify-center rounded-xl bg-white px-3 text-xs font-semibold text-slate-900 transition hover:bg-slate-100 sm:text-sm"
              >
                Volver al inicio
              </Link>
            </div>
          </div>

          {/* Tarjetas de plan: solo desde md; en móvil el precio va en el
              encabezado de la tabla para no duplicar y ahorrar scroll. */}
          <div className="mt-5 hidden gap-3 md:grid md:grid-cols-3">
            {planCards.map((plan) => {
              const isFeatured = plan.key === "business";
              return (
                <div
                  key={plan.key}
                  className={
                    isFeatured
                      ? "relative border border-cyan-300/50 bg-cyan-400/10 p-3 shadow-[0_0_0_1px_rgba(34,211,238,0.18),0_20px_54px_-24px_rgba(34,211,238,0.5)]"
                      : `relative border ${plan.borderClass} ${plan.softBgClass} p-3`
                  }
                >
                  {plan.badge ? (
                    <span
                      className={
                        isFeatured
                          ? "absolute right-3 top-3 rounded-full bg-[#21d6c5] px-2 py-0.5 text-[9px] font-black uppercase tracking-wide text-slate-950 shadow-[0_8px_20px_rgba(34,211,238,0.35)]"
                          : "absolute right-3 top-3 rounded-full bg-white px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-slate-900"
                      }
                    >
                      {plan.badge}
                    </span>
                  ) : null}

                  <p className="text-base font-semibold text-white">{plan.name}</p>
                  <p className="mt-0.5 text-xs leading-5 text-slate-300">{plan.subtitle}</p>
                  <p
                    className={
                      isFeatured
                        ? "mt-2 text-2xl font-semibold text-cyan-200"
                        : "mt-2 text-2xl font-semibold text-white"
                    }
                  >
                    {plan.priceLabel}
                    <span className="ml-1 text-xs font-normal text-slate-400">+ iva / mes</span>
                  </p>
                </div>
              );
            })}
          </div>

          <div className="mt-5 border border-white/10 bg-white/5">
            <table className="w-full table-fixed border-collapse">
              <colgroup>
                <col className="w-[34%] sm:w-[31%]" />
                <col />
                <col />
                <col />
              </colgroup>
              <thead>
                <tr className="bg-gradient-to-r from-cyan-400/8 via-white/5 to-white/5">
                  <th className="px-2 py-2.5 text-left text-[11px] font-semibold text-slate-200 sm:px-3 sm:text-xs">
                    Qué incluye cada plan
                  </th>
                  {planCards.map((plan) => {
                    const isFeatured = plan.key === "business";
                    return (
                      <th
                        key={plan.key}
                        className={`px-1 py-2.5 text-center text-xs font-semibold sm:px-3 sm:text-sm ${
                          isFeatured
                            ? "border-x border-cyan-300/25 bg-cyan-400/10 text-cyan-100"
                            : "text-slate-200"
                        }`}
                      >
                        <div className="flex flex-col items-center gap-0.5">
                          {plan.name}
                          <span className="text-[10px] font-normal text-slate-400 md:hidden">
                            {plan.priceLabel}
                          </span>
                          {isFeatured ? (
                            <span className="rounded-full bg-[#21d6c5] px-1 py-0.5 text-[7px] font-black uppercase tracking-wide text-slate-950 sm:text-[9px]">
                              Recomendado
                            </span>
                          ) : null}
                        </div>
                      </th>
                    );
                  })}
                </tr>
              </thead>

              <tbody>
                {comparisonRows.map((row, index) => (
                  <tr
                    key={row.label}
                    className={index % 2 === 0 ? "bg-slate-900/30" : "bg-cyan-400/[0.055]"}
                  >
                    <td
                      className={`border-t border-white/10 px-2 py-2 text-[11px] font-medium leading-4 text-white [overflow-wrap:anywhere] sm:px-3 sm:py-2.5 sm:text-xs ${
                        row.highlight ? "border-l-2 border-l-cyan-400/50" : ""
                      }`}
                    >
                      <span className={row.highlight ? "font-semibold text-cyan-100" : ""}>
                        {row.label}
                      </span>
                      {row.info ? <InfoDot text={row.info} /> : null}
                    </td>

                    {planCards.map((plan) => {
                      const isFeatured = plan.key === "business";
                      return (
                        <td
                          key={`${row.label}-${plan.key}`}
                          className={`border-t border-white/10 px-1 py-2 text-center text-[11px] leading-4 text-slate-300 sm:px-3 sm:py-2.5 sm:text-xs ${
                            isFeatured ? "border-x border-cyan-300/15 bg-cyan-400/[0.04]" : ""
                          }`}
                        >
                          <CellValue
                            value={row.values[plan.key]}
                            highlight={Boolean(row.highlight)}
                          />
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-2">
            <div className="rounded-xl border border-cyan-300/15 bg-cyan-400/[0.06] p-3">
              <div className="flex items-center gap-2.5">
                <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-cyan-400/15 text-cyan-200">
                  <Building2 className="h-4 w-4" />
                </span>
                <p className="text-sm font-semibold text-white">Multi-sucursal por plan</p>
              </div>
              <div className="mt-2.5 flex flex-wrap gap-2">
                {[
                  { name: "Starter", n: 1 },
                  { name: "Business", n: 2 },
                  { name: "Premium", n: 3 },
                ].map((item) => (
                  <span
                    key={item.name}
                    className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 text-xs font-medium text-slate-200"
                  >
                    {item.name}
                    <span className="font-bold text-cyan-200">{item.n}</span>
                  </span>
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-amber-300/25 bg-amber-500/10 p-3">
              <div className="flex items-center gap-2.5">
                <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-amber-400/20 text-amber-200">
                  <MessageCircle className="h-4 w-4" />
                </span>
                <p className="text-sm font-semibold text-amber-100">
                  Ojo con los mensajes WhatsApp
                </p>
              </div>
              <ul className="mt-2.5 space-y-1 text-xs leading-5 text-amber-50/90">
                <li>• No se acumulan entre períodos: se renuevan cada mes.</li>
                <li>
                  • Campañas WhatsApp vienen incluidas solo en{" "}
                  <span className="font-semibold text-amber-100">Premium</span>; como
                  add-on están desde Business (no en Starter).
                </li>
                <li>
                  • En Starter, confirmación+recordatorio se activa al pagar el plan
                  — no aplica durante el trial de {TRIAL_LABEL}.
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
