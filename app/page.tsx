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
    <main className="min-h-screen bg-[#f6f7fb] text-slate-900">
      {/* HERO */}
      <section className="relative overflow-hidden">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: "url('/hero-light.png')",
            backgroundRepeat: "no-repeat",
            backgroundSize: "cover",
            backgroundPosition: "center right",
          }}
        />

        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(246,247,251,0.98)_0%,rgba(246,247,251,0.97)_18%,rgba(246,247,251,0.93)_36%,rgba(246,247,251,0.74)_54%,rgba(246,247,251,0.34)_72%,rgba(246,247,251,0.12)_100%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_16%_20%,rgba(59,130,246,0.10),transparent_28%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(246,247,251,0.14)_0%,rgba(246,247,251,0.08)_56%,#f6f7fb_100%)]" />

        <div className="relative mx-auto max-w-[1600px] px-6 pb-20 pt-16 lg:px-10 lg:pb-24 lg:pt-20">
          <div className="grid min-h-[780px] items-center gap-12 lg:grid-cols-[minmax(0,1.05fr)_500px]">
            {/* IZQUIERDA */}
            <div className="max-w-3xl">
              <div className="flex flex-wrap items-center gap-3">
                <img
                  src="/orbyx-logo-dark.png"
                  alt="Orbyx"
                  className="h-11 w-auto rounded-xl bg-white/80 p-1.5 shadow-sm"
                />
                <span className="rounded-full border border-blue-200 bg-white/70 px-4 py-2 text-sm text-blue-700 shadow-sm backdrop-blur-sm">
                  Agendamiento con IA + seguimiento inteligente
                </span>
              </div>

              <motion.h1
                initial={{ opacity: 0, y: 22 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.55 }}
                className="mt-8 max-w-3xl text-5xl font-semibold leading-[1.02] tracking-[-0.04em] text-slate-900 sm:text-6xl xl:text-7xl"
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

              <p className="mt-8 max-w-xl text-lg leading-9 text-slate-700 sm:text-[22px] sm:leading-10">
                Deja de coordinar reservas por WhatsApp manualmente. Orbyx
                responde, propone horarios y agenda automáticamente.
                <br />
                <br />
                Además, mantiene tu agenda activa con recordatorios y
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
                        ? "inline-flex w-fit rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 px-6 py-3 text-base font-medium text-white shadow-[0_12px_28px_rgba(59,130,246,0.22)]"
                        : "inline-flex w-fit rounded-full border border-slate-200 bg-white/80 px-6 py-3 text-base font-medium text-slate-700 shadow-sm backdrop-blur-sm"
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
                      className="rounded-2xl border border-white/80 bg-white/70 p-4 shadow-[0_10px_30px_rgba(15,23,42,0.08)] backdrop-blur-sm"
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
                  className="inline-flex items-center justify-center rounded-2xl bg-gradient-to-r from-blue-600 to-violet-500 px-8 py-4 text-base font-semibold text-white shadow-[0_16px_36px_rgba(59,130,246,0.28)] transition hover:scale-[1.02]"
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
              <div className="w-full rounded-[34px] border border-white/90 bg-white/88 p-8 shadow-[0_30px_80px_rgba(15,23,42,0.14)] backdrop-blur-md lg:w-[500px]">
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

                <div className="mt-6 rounded-[24px] border border-slate-200 bg-slate-50 p-4 shadow-inner">
                  <div className="flex items-center gap-3 text-sm font-medium text-slate-700">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-teal-100 text-teal-700">
                      ✦
                    </div>
                    IA respondió en WhatsApp
                  </div>

                  <div className="mt-4 rounded-2xl bg-white p-4 text-sm leading-7 text-slate-700 shadow-sm">
                    Claro, ¿prefiere en la mañana o en la tarde?
                    <div className="mt-2 text-right text-xs text-slate-400">
                      11:24 ✓
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SEGUNDA SECCIÓN */}
      <section className="relative py-24">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(59,130,246,0.06),transparent_30%)]" />

        <div className="relative mx-auto max-w-[1600px] px-6 lg:px-10">
          <div className="mx-auto max-w-5xl text-center">
            <h2 className="text-4xl font-semibold tracking-[-0.03em] text-slate-900 sm:text-5xl">
              Más que agenda, crecimiento real
            </h2>

            <p className="mx-auto mt-5 max-w-3xl text-xl leading-9 text-slate-600">
              Orbyx no solo agenda citas. Automatiza la comunicación con tus
              clientes, optimiza tu tiempo y te ayuda a mantener tu agenda
              siempre activa sin esfuerzo.
            </p>

            <div className="mt-14 grid gap-6 sm:grid-cols-2">
              {benefits.map((benefit) => (
                <div
                  key={benefit.title}
                  className="rounded-[26px] border border-slate-200 bg-white/75 p-7 text-left shadow-[0_12px_34px_rgba(15,23,42,0.06)] backdrop-blur-sm"
                >
                  <div className="mb-3 flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-100">
                      <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                    </div>
                    <h3 className="text-xl font-semibold text-slate-800">
                      {benefit.title}
                    </h3>
                  </div>
                  <p className="text-base leading-8 text-slate-600">
                    {benefit.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}