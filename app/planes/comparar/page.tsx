"use client";

import Link from "next/link";
import {
  Crown,
  Gem,
  Mail,
  Sparkles,
  ArrowLeft,
  Building2,
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
};

const plans: Plan[] = [
  {
    key: "pro",
    name: "Pro",
    priceLabel: "$24.990",
    subtitle: "Empieza a ordenar tu negocio",
    icon: "mail",
    accentClass: "text-sky-300",
    borderClass: "border-sky-400/25",
    softBgClass: "bg-sky-500/10",
  },
  {
    key: "premium",
    name: "Premium",
    priceLabel: "$44.990",
    subtitle: "Más control y mejor comunicación",
    icon: "sparkles",
    accentClass: "text-violet-300",
    borderClass: "border-violet-400/25",
    softBgClass: "bg-violet-500/10",
  },
  {
    key: "vip",
    name: "VIP",
    priceLabel: "$79.990",
    subtitle: "WhatsApp y mejor contacto",
    icon: "crown",
    accentClass: "text-amber-300",
    borderClass: "border-amber-400/25",
    softBgClass: "bg-amber-500/10",
  },
  {
    key: "platinum",
    name: "Platinum",
    priceLabel: "$229.990",
    subtitle: "IA trabajando por tu negocio",
    icon: "gem",
    accentClass: "text-emerald-300",
    borderClass: "border-emerald-400/25",
    softBgClass: "bg-emerald-500/10",
  },
];

const comparisonRows = [
  {
    label: "Sucursales incluidas",
    values: {
      pro: "1",
      premium: "2",
      vip: "3",
      platinum: "10",
    },
  },
  {
    label: "Profesionales incluidos",
    values: {
      pro: "2",
      premium: "5",
      vip: "10",
      platinum: "20",
    },
  },
  {
    label: "Servicios incluidos",
    values: {
      pro: "10",
      premium: "25",
      vip: "50",
      platinum: "100",
    },
  },
  {
    label: "Profesional extra",
    values: {
      pro: "+5 servicios",
      premium: "+5 servicios",
      vip: "+5 servicios",
      platinum: "+5 servicios",
    },
  },
  {
    label: "Emails automáticos",
    values: {
      pro: "Básicos",
      premium: "Avanzados",
      vip: "Avanzados",
      platinum: "Avanzados",
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
    label: "Encuestas por email",
    values: {
      pro: "—",
      premium: "—",
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
    label: "IA asistida",
    values: {
      pro: "—",
      premium: "—",
      vip: "—",
      platinum: "200 / mes",
    },
  },
] as const;

function PlanIcon({ type }: { type: Plan["icon"] }) {
  if (type === "mail") return <Mail className="h-5 w-5" />;
  if (type === "sparkles") return <Sparkles className="h-5 w-5" />;
  if (type === "crown") return <Crown className="h-5 w-5" />;
  return <Gem className="h-5 w-5" />;
}

export default function CompararPlanesPage() {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(99,102,241,0.18),_transparent_22%),radial-gradient(circle_at_left,_rgba(14,165,233,0.12),_transparent_28%),linear-gradient(180deg,_#0b1120_0%,_#0f172a_40%,_#111827_100%)] text-white">
      <section className="mx-auto max-w-7xl px-4 py-8 lg:px-8">
        <div className="rounded-[34px] border border-white/10 bg-white/6 p-6 shadow-[0_30px_90px_rgba(15,23,42,0.34)] backdrop-blur-xl lg:p-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <span className="inline-flex rounded-full border border-indigo-400/20 bg-indigo-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-indigo-200">
                Comparador Orbyx
              </span>
              <h1 className="mt-4 text-3xl font-semibold tracking-tight text-white lg:text-5xl">
                Cuadro comparativo de planes
              </h1>
              <p className="mt-3 max-w-2xl text-base leading-7 text-slate-300">
                Revisa rápido qué incluye cada plan y cómo escala tu operación.
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
                className={`rounded-3xl border ${plan.borderClass} ${plan.softBgClass} p-5`}
              >
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
                <p className="mt-1 text-sm text-slate-400">mes + iva</p>
              </div>
            ))}
          </div>

          <div className="mt-8 overflow-hidden rounded-[28px] border border-white/10 bg-white/5">
            <div className="overflow-x-auto">
              <table className="min-w-[920px] w-full border-collapse">
                <thead>
                  <tr className="bg-white/5">
                    <th className="px-4 py-4 text-left text-sm font-semibold text-slate-200">
                      Característica
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
                        {row.label}
                      </td>
                      {plans.map((plan) => (
                        <td
                          key={`${row.label}-${plan.key}`}
                          className="border-t border-white/10 px-4 py-4 text-center text-sm text-slate-300"
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

          <div className="mt-8 rounded-[24px] border border-white/10 bg-white/5 p-4">
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
        </div>
      </section>
    </main>
  );
}