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
    "IA por WhatsApp",
    "Menos trabajo manual",
    "Más reservas",
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
    <main className="min-h-screen bg-[#08111f] text-white">
      {/* HERO */}
      <section className="relative overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: "url('/hero-orbyx-bg.png')" }}
        />

        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(8,17,31,0.96)_0%,rgba(8,17,31,0.92)_30%,rgba(8,17,31,0.72)_55%,rgba(8,17,31,0.52)_100%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(59,130,246,0.22),transparent_32%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_75%_25%,rgba(99,102,241,0.18),transparent_30%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(8,17,31,0.15)_0%,rgba(8,17,31,0.42)_72%,#08111f_100%)]" />

        <div className="relative mx-auto max-w-[1600px] px-5 py-20 lg:px-8 lg:py-28">
          <div className="grid items-center gap-12 lg:grid-cols-[1.08fr_0.92fr]">
            {/* IZQUIERDA */}
            <div className="max-w-3xl">
              <div className="flex flex-wrap items-center gap-3">
                <img src="/orbyx-logo-dark.png" alt="Orbyx" className="h-10" />
                <span className="rounded-full border border-sky-400/20 bg-sky-400/10 px-4 py-2 text-sm text-sky-300 backdrop-blur-sm">
                  IA + automatización inteligente
                </span>
              </div>

              <motion.h1
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="mt-8 max-w-4xl text-5xl font-semibold leading-[1.05] tracking-[-0.03em] sm:text-6xl xl:text-7xl"
              >
                Automatiza tus reservas con IA
                <br />
                <span className="bg-gradient-to-r from-sky-300 via-blue-400 to-violet-400 bg-clip-text text-transparent">
                  y mantén tu agenda más activa
                </span>
              </motion.h1>

              <p className="mt-7 max-w-2xl text-lg leading-8 text-slate-300 sm:text-xl">
                Deja de coordinar reservas por WhatsApp manualmente. Orbyx
                responde, propone horarios y agenda automáticamente.
                <br className="hidden sm:block" />
                Además, mantiene tu agenda activa con recordatorios y
                recuperación de clientes.
              </p>

              <div className="mt-7 flex flex-wrap gap-3">
                {chips.map((c) => (
                  <span
                    key={c}
                    className="rounded-full border border-white/10 bg-white/8 px-4 py-2 text-sm text-slate-100 backdrop-blur-sm"
                  >
                    {c}
                  </span>
                ))}
              </div>

              {/* FEATURES */}
              <div className="mt-10 grid max-w-3xl grid-cols-2 gap-4 sm:grid-cols-3">
                {features.map((f, i) => {
                  const Icon = f.icon;
                  return (
                    <motion.div
                      key={f.title}
                      initial={{ opacity: 0, y: 18 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.08 }}
                      whileHover={{ y: -4, scale: 1.02 }}
                      className="rounded-2xl border border-white/10 bg-white/8 p-4 text-center shadow-[0_10px_30px_rgba(0,0,0,0.18)] backdrop-blur-md"
                    >
                      <Icon className="mx-auto mb-2 h-5 w-5 text-blue-400" />
                      <p className="text-sm text-slate-100">{f.title}</p>
                    </motion.div>
                  );
                })}
              </div>

              {/* CTA */}
              <div className="mt-10 flex flex-wrap items-center gap-6">
                <Link
                  href="/planes"
                  className="relative inline-flex items-center justify-center rounded-2xl bg-gradient-to-r from-blue-500 to-violet-500 px-8 py-4 text-base font-semibold text-white shadow-[0_12px_40px_rgba(59,130,246,0.35)] transition hover:scale-[1.03]"
                >
                  <span className="relative z-10">Ver planes</span>
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-blue-500 to-violet-500 opacity-40 blur-xl" />
                </Link>

                <div>
                  <div className="flex text-yellow-400">
                    <Star className="h-4 w-4 fill-current" />
                    <Star className="h-4 w-4 fill-current" />
                    <Star className="h-4 w-4 fill-current" />
                    <Star className="h-4 w-4 fill-current" />
                    <Star className="h-4 w-4 fill-current" />
                  </div>
                  <p className="mt-1 text-xs text-slate-300">
                    +8.000 negocios nos prefieren
                  </p>
                </div>
              </div>

              <p className="mt-4 text-sm text-slate-300/90">
                Empieza hoy y automatiza tus reservas en minutos
              </p>
            </div>

            {/* FORM */}
            <div className="lg:pl-8">
              <div className="rounded-[28px] border border-white/10 bg-[rgba(10,18,32,0.72)] p-8 shadow-[0_20px_80px_rgba(0,0,0,0.35)] backdrop-blur-xl">
                <div className="inline-block rounded-full bg-blue-500/15 px-3 py-1 text-sm text-blue-300">
                  Prueba gratis 7 días
                </div>

                <h2 className="mt-4 text-2xl font-semibold sm:text-3xl">
                  Crea tu cuenta en Orbyx
                </h2>

                <form className="mt-6 space-y-3">
                  <select className="h-12 w-full rounded-xl border border-white/10 bg-white/5 px-3 text-white outline-none transition focus:border-blue-400/40">
                    <option className="text-black">Tipo de negocio</option>
                    {businessTypes.map((b) => (
                      <option key={b} className="text-black">
                        {b}
                      </option>
                    ))}
                  </select>

                  <select className="h-12 w-full rounded-xl border border-white/10 bg-white/5 px-3 text-white outline-none transition focus:border-blue-400/40">
                    <option className="text-black">Profesionales</option>
                    {teamSizes.map((t) => (
                      <option key={t} className="text-black">
                        {t}
                      </option>
                    ))}
                  </select>

                  <input
                    placeholder="Nombre"
                    className="h-12 w-full rounded-xl border border-white/10 bg-white/5 px-3 text-white placeholder:text-slate-400 outline-none transition focus:border-blue-400/40"
                  />
                  <input
                    placeholder="Email"
                    className="h-12 w-full rounded-xl border border-white/10 bg-white/5 px-3 text-white placeholder:text-slate-400 outline-none transition focus:border-blue-400/40"
                  />
                  <input
                    placeholder="Teléfono"
                    className="h-12 w-full rounded-xl border border-white/10 bg-white/5 px-3 text-white placeholder:text-slate-400 outline-none transition focus:border-blue-400/40"
                  />

                  <button className="h-12 w-full rounded-xl bg-gradient-to-r from-blue-500 to-violet-500 font-semibold text-white shadow-[0_10px_35px_rgba(59,130,246,0.28)] transition hover:scale-[1.01]">
                    Crear mi agenda
                  </button>
                </form>

                <p className="mt-4 text-center text-xs text-slate-400">
                  Empieza en 30 segundos • Sin tarjeta de crédito
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SEGUNDA SECCIÓN */}
      <section className="relative py-20">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(59,130,246,0.08),transparent_35%)]" />

        <div className="relative mx-auto max-w-[1600px] px-5 lg:px-8">
          <div className="mx-auto max-w-5xl text-center">
            <h2 className="text-3xl font-semibold sm:text-4xl">
              Más que agenda, crecimiento real
            </h2>

            <p className="mx-auto mt-4 max-w-2xl text-slate-400">
              Orbyx no solo agenda citas. Automatiza la comunicación con tus
              clientes, optimiza tu tiempo y te ayuda a mantener tu agenda
              siempre activa sin esfuerzo.
            </p>

            <div className="mt-10 grid gap-6 sm:grid-cols-2">
              {benefits.map((b) => (
                <div
                  key={b.title}
                  className="rounded-2xl border border-white/10 bg-white/5 p-6 text-left"
                >
                  <div className="mb-2 flex items-center gap-3">
                    <CheckCircle2 className="text-emerald-400" />
                    <h3 className="font-semibold">{b.title}</h3>
                  </div>
                  <p className="text-sm leading-6 text-slate-400">{b.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}