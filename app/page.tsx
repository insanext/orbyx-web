"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  CalendarDays,
  Rocket,
  Users,
  BellRing,
  Star,
  CheckCircle2,
  Sparkles,
  MessageSquareText,
} from "lucide-react";

export default function OrbyxLandingPage() {
  const quickFeatures = [
    { icon: CalendarDays, title: "Agenda y citas" },
    { icon: Rocket, title: "Reservas y seguimiento" },
    { icon: Users, title: "Clientes e historial" },
    { icon: BellRing, title: "Recordatorios automáticos" },
    { icon: Sparkles, title: "Clientes inactivos" },
  ];

  const chips = [
    "IA que agenda por WhatsApp",
    "Menos coordinación manual",
    "Más movimiento en tu agenda",
  ];

  const businessTypes = [
    "Barbería",
    "Peluquería",
    "Centro de estética",
    "Clínica",
    "Consulta médica",
    "Kinesiología / Fisioterapia",
    "Spa",
    "Salón de belleza",
    "Entrenamiento / Fitness",
    "Otro",
  ];

  const teamSizes = ["1", "2 a 3", "4 a 10", "11 a 20", "20+"];

  const setupSteps = [
    "Configura tu negocio y horarios",
    "Carga tus servicios y profesionales",
    "Empieza a recibir reservas con IA",
  ];

  const sideBenefits = [
    "Confirmaciones automáticas",
    "Recordatorios por WhatsApp",
    "Reactivación de clientes inactivos",
    "Vista clara de agenda y seguimiento",
  ];

  return (
    <main className="min-h-screen bg-[#f4eff5] text-slate-900">
      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(135deg,#f8f4f7_0%,#f3eef4_36%,#eee8f1_70%,#ebe6ef_100%)]" />

        <div className="relative mx-auto max-w-7xl px-5 py-8 lg:px-8 lg:py-12">
          <div className="grid items-center gap-10 lg:grid-cols-[1.02fr_0.98fr]">
            <div className="relative z-10">
              <div className="inline-flex items-center gap-3">
                <div className="rounded-2xl bg-white px-3 py-2 shadow">
                  <img
                    src="/orbyx-logo-dark.png"
                    alt="Orbyx"
                    className="h-10"
                  />
                </div>

                <div className="rounded-full bg-white px-4 py-2 text-sm font-medium text-sky-600 shadow">
                  Agendamiento con IA + seguimiento inteligente
                </div>
              </div>

              <motion.h1
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-8 text-4xl font-semibold leading-tight sm:text-5xl lg:text-[60px]"
              >
                Automatiza tus
                <br />
                reservas con IA
                <br />
                <span className="text-sky-500">y mantén tu agenda</span>
                <br />
                <span className="text-sky-500">más activa</span>
              </motion.h1>

              <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-700">
                Deja de coordinar reservas por WhatsApp manualmente. Orbyx
                responde, propone horarios y agenda automáticamente por tu
                negocio. Además, te ayuda a mantener tu agenda activa con
                seguimiento inteligente, recordatorios y recuperación de
                clientes.
              </p>

              <div className="mt-6 flex flex-wrap gap-3">
                {chips.map((item) => (
                  <span
                    key={item}
                    className="rounded-full bg-white px-4 py-2 text-sm shadow"
                  >
                    {item}
                  </span>
                ))}
              </div>

              <div className="mt-10 grid max-w-3xl gap-4 sm:grid-cols-2 lg:grid-cols-5">
                {quickFeatures.map((item) => {
                  const Icon = item.icon;
                  return (
                    <div
                      key={item.title}
                      className="rounded-2xl bg-white p-4 text-center shadow"
                    >
                      <Icon className="mx-auto mb-2 h-6 w-6" />
                      <p className="text-sm font-medium leading-5">
                        {item.title}
                      </p>
                    </div>
                  );
                })}
              </div>

              <div className="mt-8 inline-flex items-center gap-2 rounded-full bg-white px-4 py-3 shadow">
                <div className="inline-flex items-center gap-1 text-amber-400">
                  <Star className="h-4 w-4 fill-current" />
                  <Star className="h-4 w-4 fill-current" />
                  <Star className="h-4 w-4 fill-current" />
                  <Star className="h-4 w-4 fill-current" />
                  <Star className="h-4 w-4 fill-current" />
                </div>
                <p className="text-sm font-medium text-slate-700">
                  +8.000 negocios nos recomiendan
                </p>
              </div>
            </div>

            <div className="relative z-10 flex items-center justify-center lg:justify-end">
              <img
                src="/hero-orbyx-composed.png"
                alt="Vista principal Orbyx"
                className="w-full max-w-[720px] rounded-[28px] object-contain"
              />
            </div>
          </div>
        </div>
      </section>

      {/* SECCIÓN INFERIOR */}
      <section className="relative pb-16 pt-6">
        <div className="mx-auto max-w-7xl px-5 lg:px-8">
          <div className="grid gap-6 lg:grid-cols-[1.02fr_0.98fr]">
            {/* FORMULARIO */}
            <div className="rounded-[30px] border border-white/10 bg-[linear-gradient(180deg,#18284f_0%,#223a76_36%,#1c2254_100%)] p-6 text-white shadow-[0_30px_80px_rgba(15,23,42,0.22)] sm:p-7">
              <div className="inline-flex items-center rounded-full border border-white/15 bg-white/10 px-3 py-1 text-sm font-semibold text-sky-100">
                Empieza gratis
              </div>

              <h2 className="mt-4 text-3xl font-semibold text-white">
                Configura tu agenda
              </h2>

              <p className="mt-2 text-sm leading-6 text-slate-200">
                Crea tu espacio en Orbyx y comienza con una experiencia más
                clara, profesional y simple de configurar.
              </p>

              <form className="mt-6 space-y-3">
                <div className="grid gap-3 sm:grid-cols-2">
                  <select className="h-12 w-full rounded-xl border border-white/10 bg-white/10 px-3 text-sm text-white outline-none transition focus:border-sky-300 focus:ring-4 focus:ring-sky-400/20">
                    <option className="text-slate-900" value="">
                      Tipo de negocio
                    </option>
                    {businessTypes.map((item) => (
                      <option className="text-slate-900" key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>

                  <select className="h-12 w-full rounded-xl border border-white/10 bg-white/10 px-3 text-sm text-white outline-none transition focus:border-sky-300 focus:ring-4 focus:ring-sky-400/20">
                    <option className="text-slate-900" value="">
                      Profesionales
                    </option>
                    {teamSizes.map((item) => (
                      <option className="text-slate-900" key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                </div>

                <input
                  placeholder="Nombre y apellido"
                  className="h-12 w-full rounded-xl border border-white/10 bg-white/10 px-3 text-sm text-white outline-none placeholder:text-slate-300 transition focus:border-sky-300 focus:ring-4 focus:ring-sky-400/20"
                />

                <input
                  placeholder="Email"
                  className="h-12 w-full rounded-xl border border-white/10 bg-white/10 px-3 text-sm text-white outline-none placeholder:text-slate-300 transition focus:border-sky-300 focus:ring-4 focus:ring-sky-400/20"
                />

                <input
                  placeholder="Teléfono"
                  className="h-12 w-full rounded-xl border border-white/10 bg-white/10 px-3 text-sm text-white outline-none placeholder:text-slate-300 transition focus:border-sky-300 focus:ring-4 focus:ring-sky-400/20"
                />

                <button className="mt-2 h-12 w-full rounded-xl bg-[linear-gradient(135deg,#2563eb_0%,#3b82f6_100%)] text-sm font-semibold text-white shadow-[0_12px_30px_rgba(37,99,235,0.35)] transition hover:brightness-110">
                  Crear mi agenda
                </button>
              </form>

              <p className="mt-4 text-center text-xs leading-6 text-slate-300">
                Empieza gratis. Luego puedes elegir el plan ideal para tu
                negocio.
              </p>
            </div>

            {/* CONTENIDO LATERAL */}
            <div className="grid gap-6">
              <div className="rounded-[30px] bg-white p-6 shadow-[0_24px_70px_rgba(15,23,42,0.08)]">
                <div className="inline-flex items-center gap-2 rounded-full bg-sky-50 px-3 py-1 text-sm font-semibold text-sky-700">
                  <MessageSquareText className="h-4 w-4" />
                  Qué ganas con Orbyx
                </div>

                <h3 className="mt-4 text-2xl font-semibold text-slate-900">
                  Más que agenda, movimiento real en tu negocio
                </h3>

                <div className="mt-5 space-y-3">
                  {sideBenefits.map((item) => (
                    <div key={item} className="flex items-start gap-3">
                      <CheckCircle2 className="mt-0.5 h-5 w-5 text-emerald-500" />
                      <p className="text-slate-700">{item}</p>
                    </div>
                  ))}
                </div>

                <Link
                  href="/planes"
                  className="mt-6 flex h-12 w-full items-center justify-center rounded-xl border border-fuchsia-200 bg-[linear-gradient(135deg,#ffffff_0%,#fdf2f8_100%)] text-sm font-semibold text-fuchsia-700 shadow-[0_0_0_1px_rgba(244,114,182,0.08),0_10px_24px_rgba(236,72,153,0.10)] transition hover:-translate-y-0.5 hover:border-fuchsia-300 hover:shadow-[0_0_0_1px_rgba(244,114,182,0.14),0_14px_30px_rgba(236,72,153,0.14)]"
                >
                  Ver planes
                </Link>
              </div>

              <div className="rounded-[30px] bg-white p-6 shadow-[0_24px_70px_rgba(15,23,42,0.08)]">
                <h3 className="text-xl font-semibold text-slate-900">
                  Configuración en 3 pasos
                </h3>

                <div className="mt-5 space-y-4">
                  {setupSteps.map((item, index) => (
                    <div key={item} className="flex items-start gap-4">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-900 text-sm font-semibold text-white">
                        {index + 1}
                      </div>
                      <p className="pt-1 text-slate-700">{item}</p>
                    </div>
                  ))}
                </div>

                <div className="mt-6 inline-flex items-center gap-2 rounded-full bg-slate-50 px-4 py-3">
                  <div className="inline-flex items-center gap-1 text-amber-400">
                    <Star className="h-4 w-4 fill-current" />
                    <Star className="h-4 w-4 fill-current" />
                    <Star className="h-4 w-4 fill-current" />
                    <Star className="h-4 w-4 fill-current" />
                    <Star className="h-4 w-4 fill-current" />
                  </div>
                  <p className="text-sm font-medium text-slate-700">
                    +8.000 negocios felices nos recomiendan
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