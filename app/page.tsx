"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  CalendarDays,
  Rocket,
  Users,
  BellRing,
  Star,
  Sparkles,
  CheckCircle2,
} from "lucide-react";

export default function OrbyxLandingPage() {
  const features = [
    { icon: CalendarDays, title: "Agenda y citas" },
    { icon: Rocket, title: "Reservas automáticas" },
    { icon: Users, title: "Clientes e historial" },
    { icon: BellRing, title: "Recordatorios automáticos" },
    { icon: Sparkles, title: "Recupera clientes" },
  ];

  const chips = [
    "IA que agenda por WhatsApp",
    "Menos trabajo manual",
    "Más movimiento en tu agenda",
  ];

  const businessTypes = [
    "Barbería",
    "Peluquería",
    "Centro de estética",
    "Clínica",
    "Spa",
    "Otro",
  ];

  const teamSizes = ["1", "2-3", "4-10", "10+"];

  const benefits = [
    {
      title: "Confirmaciones automáticas",
      desc: "Tus clientes reciben confirmación inmediata sin que tengas que responder manualmente.",
    },
    {
      title: "Recordatorios por WhatsApp",
      desc: "Reduce ausencias con recordatorios automáticos antes de cada cita.",
    },
    {
      title: "Recuperación de clientes",
      desc: "Orbyx detecta clientes inactivos y los vuelve a activar automáticamente.",
    },
    {
      title: "Agenda clara y ordenada",
      desc: "Visualiza todo tu negocio en un solo lugar, sin desorden ni confusión.",
    },
  ];

  return (
    <main className="min-h-screen bg-[#f7f8fc] text-slate-900">
      {/* HERO SUPERIOR LIMPIO */}
      <section className="relative overflow-hidden bg-[#f7f8fc]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_18%,rgba(59,130,246,0.08),transparent_24%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_85%_12%,rgba(99,102,241,0.07),transparent_22%)]" />

        <div className="relative mx-auto max-w-[1600px] px-6 pb-20 pt-16 lg:px-10 lg:pb-24 lg:pt-20">
          <div className="grid items-center gap-14 lg:grid-cols-[minmax(0,1.08fr)_520px]">
            {/* IZQUIERDA */}
            <div className="max-w-3xl">
              <div className="flex flex-wrap items-center gap-3">
                <img
                  src="/orbyx-logo-dark.png"
                  alt="Orbyx"
                  className="h-11 w-auto rounded-xl bg-white p-1.5 shadow-sm"
                />
                <span className="rounded-full border border-blue-200 bg-white px-4 py-2 text-sm text-blue-700 shadow-sm">
                  Agendamiento con IA + seguimiento inteligente
                </span>
              </div>

              <motion.h1
                initial={{ opacity: 0, y: 22 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.55 }}
                className="mt-8 max-w-3xl text-5xl font-semibold leading-[1.02] tracking-[-0.04em] text-slate-950 sm:text-6xl xl:text-7xl"
              >
                Automatiza tus
                <br />
                reservas con IA
                <br />
                <span className="bg-gradient-to-r from-sky-500 to-blue-700 bg-clip-text text-transparent">
                  y mantén tu agenda
                </span>
                <br />
                <span className="bg-gradient-to-r from-sky-500 to-blue-700 bg-clip-text text-transparent">
                  más activa
                </span>
              </motion.h1>

              <p className="mt-8 max-w-2xl text-lg leading-9 text-slate-700 sm:text-[22px] sm:leading-10">
                Deja de coordinar reservas por WhatsApp manualmente. Orbyx
                responde, propone horarios y agenda automáticamente.
                <br />
                <br />
                Además, ayuda a mantener tu agenda activa con recordatorios y
                recuperación de clientes.
              </p>

              <div className="mt-8 flex max-w-md flex-col gap-3">
                {chips.map((chip, index) => (
                  <motion.div
                    key={chip}
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.08 }}
                    className={
                      index === 0
                        ? "inline-flex w-fit rounded-full bg-gradient-to-r from-blue-600 to-violet-500 px-6 py-3 text-base font-medium text-white shadow-[0_12px_28px_rgba(59,130,246,0.22)]"
                        : "inline-flex w-fit rounded-full border border-slate-200 bg-white px-6 py-3 text-base font-medium text-slate-700 shadow-sm"
                    }
                  >
                    {chip}
                  </motion.div>
                ))}
              </div>

              <div className="mt-10 grid max-w-3xl grid-cols-2 gap-4 sm:grid-cols-3">
                {features.map((feature, index) => {
                  const Icon = feature.icon;

                  return (
                    <motion.div
                      key={feature.title}
                      initial={{ opacity: 0, y: 14 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.07 }}
                      whileHover={{ y: -3 }}
                      className="rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_10px_30px_rgba(15,23,42,0.06)]"
                    >
                      <Icon className="mb-3 h-5 w-5 text-blue-600" />
                      <p className="text-sm font-medium text-slate-700">
                        {feature.title}
                      </p>
                    </motion.div>
                  );
                })}
              </div>

              <div className="mt-10 flex flex-wrap items-center gap-6">
                <Link
                  href="/planes"
                  className="inline-flex items-center justify-center rounded-2xl bg-gradient-to-r from-blue-600 to-violet-500 px-8 py-4 text-base font-semibold text-white shadow-[0_16px_36px_rgba(59,130,246,0.24)] transition hover:scale-[1.02]"
                >
                  Ver planes
                </Link>

                <div>
                  <div className="flex text-amber-400">
                    <Star className="h-4 w-4 fill-current" />
                    <Star className="h-4 w-4 fill-current" />
                    <Star className="h-4 w-4 fill-current" />
                    <Star className="h-4 w-4 fill-current" />
                    <Star className="h-4 w-4 fill-current" />
                  </div>
                  <p className="mt-1 text-sm text-slate-600">
                    +8.000 negocios nos prefieren
                  </p>
                </div>
              </div>

              <p className="mt-4 text-sm text-slate-500">
                Empieza hoy y automatiza tus reservas en minutos
              </p>
            </div>

            {/* DERECHA */}
            <div className="lg:justify-self-end">
              <div className="w-full rounded-[34px] border border-white bg-white p-8 shadow-[0_30px_80px_rgba(15,23,42,0.12)] lg:w-[520px]">
                <h2 className="text-4xl font-semibold tracking-[-0.03em] text-indigo-700">
                  Empieza gratis por 7 días
                </h2>

                <p className="mt-3 text-base leading-7 text-slate-600">
                  Sin tarjeta. Configura tu agenda en minutos.
                </p>

                <form className="mt-6 space-y-3">
                  <select className="h-14 w-full rounded-2xl border border-slate-200 bg-white px-4 text-base text-slate-700 outline-none transition focus:border-blue-400">
                    <option>¿Qué tipo de negocio tienes?</option>
                    {businessTypes.map((item) => (
                      <option key={item}>{item}</option>
                    ))}
                  </select>

                  <select className="h-14 w-full rounded-2xl border border-slate-200 bg-white px-4 text-base text-slate-700 outline-none transition focus:border-blue-400">
                    <option>¿Cuántos profesionales?</option>
                    {teamSizes.map((item) => (
                      <option key={item}>{item}</option>
                    ))}
                  </select>

                  <input
                    placeholder="Nombre completo"
                    className="h-14 w-full rounded-2xl border border-slate-200 bg-white px-4 text-base text-slate-700 placeholder:text-slate-400 outline-none transition focus:border-blue-400"
                  />
                  <input
                    placeholder="Correo electrónico"
                    className="h-14 w-full rounded-2xl border border-slate-200 bg-white px-4 text-base text-slate-700 placeholder:text-slate-400 outline-none transition focus:border-blue-400"
                  />
                  <input
                    placeholder="Teléfono"
                    className="h-14 w-full rounded-2xl border border-slate-200 bg-white px-4 text-base text-slate-700 placeholder:text-slate-400 outline-none transition focus:border-blue-400"
                  />

                  <button className="mt-2 h-14 w-full rounded-2xl bg-gradient-to-r from-blue-600 to-violet-500 text-lg font-semibold text-white shadow-[0_16px_36px_rgba(59,130,246,0.22)] transition hover:scale-[1.01]">
                    Crear mi agenda →
                  </button>
                </form>

                <p className="mt-5 text-center text-sm leading-6 text-slate-500">
                  Empieza gratis. Luego del periodo de prueba puedes pasarte a
                  un plan de pago.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECCIÓN VISUAL ABAJO CON LA MUCHACHA */}
      <section className="relative overflow-hidden py-24">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: "url('/hero-light.png')",
            backgroundRepeat: "no-repeat",
            backgroundSize: "cover",
            backgroundPosition: "center center",
          }}
        />

        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(247,248,252,0.96)_0%,rgba(247,248,252,0.94)_16%,rgba(247,248,252,0.88)_32%,rgba(247,248,252,0.66)_52%,rgba(247,248,252,0.28)_74%,rgba(247,248,252,0.12)_100%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(247,248,252,0.12)_0%,rgba(247,248,252,0.06)_70%,#f7f8fc_100%)]" />

        <div className="relative mx-auto max-w-[1600px] px-6 lg:px-10">
          <div className="grid min-h-[760px] items-center gap-12 lg:grid-cols-[0.9fr_1.1fr]">
            <div className="max-w-2xl">
              <div className="inline-flex rounded-full border border-blue-200 bg-white/85 px-4 py-2 text-sm font-medium text-blue-700 shadow-sm backdrop-blur-sm">
                Más que agenda, crecimiento real
              </div>

              <h2 className="mt-6 text-4xl font-semibold tracking-[-0.03em] text-slate-900 sm:text-5xl">
                Menos coordinación manual.
                <br />
                Más reservas, seguimiento y orden.
              </h2>

              <p className="mt-6 text-xl leading-9 text-slate-700">
                Orbyx automatiza la comunicación con tus clientes, propone
                horarios, envía recordatorios y te ayuda a recuperar clientes
                inactivos sin que tengas que hacer seguimiento manual todos los
                días.
              </p>

              <div className="mt-10 grid gap-5 sm:grid-cols-2">
                {benefits.map((benefit) => (
                  <div
                    key={benefit.title}
                    className="rounded-[26px] border border-white/70 bg-white/82 p-6 shadow-[0_12px_34px_rgba(15,23,42,0.06)] backdrop-blur-sm"
                  >
                    <div className="mb-3 flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-100">
                        <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                      </div>
                      <h3 className="text-lg font-semibold text-slate-800">
                        {benefit.title}
                      </h3>
                    </div>
                    <p className="text-base leading-7 text-slate-600">
                      {benefit.desc}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div />
          </div>
        </div>
      </section>
    </main>
  );
}