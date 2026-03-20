"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  CalendarDays,
  Rocket,
  Users,
  BellRing,
  Star,
  MessageCircle,
  Plus,
} from "lucide-react";

export default function OrbyxLandingPage() {
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

  const quickFeatures = [
    { icon: CalendarDays, title: "Agenda y citas" },
    { icon: Rocket, title: "Reservas y seguimiento" },
    { icon: Users, title: "Clientes e historial" },
    { icon: BellRing, title: "Confirmaciones y recordatorios" },
  ];

  const chips = [
    "IA que agenda por WhatsApp",
    "Menos coordinación manual",
    "Más movimiento en tu agenda",
  ];

  return (
    <main className="min-h-screen bg-[#f6f1f4] text-slate-900">
      <section className="relative overflow-hidden">
        {/* Fondo base */}
        <div className="absolute inset-0 bg-[linear-gradient(135deg,#f8f4f6_0%,#f3eef3_38%,#eee8f0_72%,#ebe6ef_100%)]" />

        {/* Imagen */}
        <div
          className="absolute inset-0 bg-cover bg-no-repeat opacity-[0.95]"
          style={{
            backgroundImage: "url('/hero-orbyx-bg.png')",
            backgroundPosition: "70% center",
          }}
        />

        {/* Velo para lectura */}
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(248,244,246,0.95)_0%,rgba(248,244,246,0.90)_18%,rgba(248,244,246,0.62)_40%,rgba(248,244,246,0.24)_62%,rgba(248,244,246,0.06)_100%)]" />

        {/* Glow suave */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_18%,rgba(56,189,248,0.08),transparent_22%),radial-gradient(circle_at_78%_16%,rgba(168,85,247,0.08),transparent_18%),radial-gradient(circle_at_78%_74%,rgba(251,113,133,0.08),transparent_20%)]" />

        <div className="relative mx-auto max-w-7xl px-5 py-8 lg:px-8 lg:py-12">
          <div className="grid items-center gap-16 lg:grid-cols-[1fr_1fr]">
            {/* IZQUIERDA */}
            <div className="relative z-10 pt-2">
              <div className="inline-flex items-center gap-3">
                <div className="rounded-2xl border border-white/70 bg-white/85 px-3 py-2 shadow-[0_10px_30px_rgba(15,23,42,0.08)] backdrop-blur">
                  <img
                    src="/orbyx-logo-dark.png"
                    alt="Orbyx"
                    className="h-11 w-auto object-contain"
                  />
                </div>

                <div className="rounded-full border border-sky-200/70 bg-white/78 px-4 py-2 text-sm font-medium text-sky-700 shadow-sm backdrop-blur">
                  Agendamiento con IA + seguimiento inteligente
                </div>
              </div>

              <motion.h1
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45 }}
                className="mt-8 max-w-3xl text-4xl font-semibold leading-tight tracking-tight text-slate-900 sm:text-5xl lg:text-[64px]"
              >
                Automatiza tus
                <br />
                reservas con IA
                <br />
                <span className="bg-gradient-to-r from-sky-600 via-cyan-500 to-blue-500 bg-clip-text text-transparent">
                  y mantén tu agenda
                </span>
                <br />
                <span className="bg-gradient-to-r from-sky-600 via-cyan-500 to-blue-500 bg-clip-text text-transparent">
                  más activa
                </span>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, delay: 0.06 }}
                className="mt-7 max-w-2xl text-[17px] leading-8 text-slate-700"
              >
                Deja de coordinar reservas por WhatsApp manualmente.
                <br />
                Orbyx responde, propone horarios y agenda automáticamente por tu
                negocio. Además, te ayuda a mantener tu agenda activa con
                seguimiento inteligente, recordatorios y recuperación de
                clientes.
              </motion.p>

              <div className="mt-8 flex flex-wrap gap-3">
                {chips.map((item) => (
                  <span
                    key={item}
                    className="rounded-full border border-white/80 bg-white/78 px-4 py-2 text-sm font-medium text-slate-700 shadow-[0_8px_24px_rgba(15,23,42,0.05)] backdrop-blur"
                  >
                    {item}
                  </span>
                ))}
              </div>

              <div className="mt-10 grid max-w-2xl gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {quickFeatures.map((item) => {
                  const Icon = item.icon;
                  return (
                    <div
                      key={item.title}
                      className="rounded-[24px] border border-white/75 bg-white/72 p-4 text-center shadow-[0_12px_32px_rgba(15,23,42,0.06)] backdrop-blur"
                    >
                      <div className="mx-auto mb-3 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#eff6ff_0%,#fdf2f8_100%)] text-slate-700 ring-1 ring-slate-100">
                        <Icon className="h-7 w-7" />
                      </div>
                      <p className="text-base font-semibold leading-6 text-slate-800">
                        {item.title}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* DERECHA */}
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.08 }}
              className="relative z-10 lg:pt-6"
            >
              {/* BADGES */}
              <div className="pointer-events-none absolute right-[410px] top-[110px] hidden xl:block">
                <div className="rounded-full border border-white/80 bg-white/82 px-5 py-3 shadow-[0_18px_50px_rgba(15,23,42,0.10)] backdrop-blur-xl">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                      <MessageCircle className="h-5 w-5 fill-current" />
                    </div>
                    <p className="text-[15px] font-medium text-slate-700">
                      IA respondió por WhatsApp
                    </p>
                  </div>
                </div>
              </div>

              <div className="pointer-events-none absolute right-[360px] top-[182px] hidden xl:block">
                <div className="rounded-full border border-white/80 bg-white/82 px-5 py-3 shadow-[0_18px_50px_rgba(15,23,42,0.10)] backdrop-blur-xl">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-50 text-emerald-500">
                      <Plus className="h-5 w-5 stroke-[2.8]" />
                    </div>
                    <p className="text-[15px] text-slate-700">
                      <span className="mr-1 text-3xl font-semibold leading-none text-slate-800">
                        24
                      </span>
                      reservas esta semana
                    </p>
                  </div>
                </div>
              </div>

              {/* CARD */}
              <div className="relative ml-auto mr-4 mt-10 max-w-[430px] overflow-hidden rounded-[34px] border border-white/70 bg-white/78 p-6 shadow-[0_28px_80px_rgba(15,23,42,0.12)] backdrop-blur-xl sm:p-8 lg:mr-0 lg:mt-16">
                <div className="absolute inset-x-0 top-0 h-28 bg-[linear-gradient(180deg,rgba(139,92,246,0.08),rgba(255,255,255,0))]" />
                <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-fuchsia-100/40 blur-3xl" />
                <div className="absolute -left-10 bottom-10 h-28 w-28 rounded-full bg-sky-100/40 blur-3xl" />

                <div className="relative">
                  <div className="inline-flex items-center rounded-full bg-violet-50 px-3 py-1 text-sm font-semibold text-violet-700 ring-1 ring-violet-100">
                    Prueba guiada
                  </div>

                  <h2 className="mt-4 text-3xl font-semibold tracking-tight text-slate-900 sm:text-[44px] sm:leading-[1.03]">
                    Empieza gratis por 7 días
                  </h2>

                  <p className="mt-4 text-lg leading-7 text-slate-600">
                    Configura tu agenda en minutos y empieza con una experiencia
                    más clara, moderna y profesional.
                  </p>

                  <form className="mt-7 space-y-4">
                    <select className="h-14 w-full rounded-2xl border border-slate-200 bg-white/95 px-4 text-base text-slate-700 outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100">
                      <option value="">¿Qué tipo de negocio tienes?</option>
                      {businessTypes.map((type) => (
                        <option key={type} value={type}>
                          {type}
                        </option>
                      ))}
                    </select>

                    <select className="h-14 w-full rounded-2xl border border-slate-200 bg-white/95 px-4 text-base text-slate-700 outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100">
                      <option value="">
                        ¿Cuántos profesionales atienden en tu negocio?
                      </option>
                      {teamSizes.map((size) => (
                        <option key={size} value={size}>
                          {size}
                        </option>
                      ))}
                    </select>

                    <input
                      type="text"
                      placeholder="Ingresa tu nombre y apellido"
                      className="h-14 w-full rounded-2xl border border-slate-200 bg-white/95 px-4 text-base text-slate-700 outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
                    />

                    <input
                      type="email"
                      placeholder="Ingresa tu email"
                      className="h-14 w-full rounded-2xl border border-slate-200 bg-white/95 px-4 text-base text-slate-700 outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
                    />

                    <input
                      type="tel"
                      placeholder="Teléfono"
                      className="h-14 w-full rounded-2xl border border-slate-200 bg-white/95 px-4 text-base text-slate-700 outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
                    />

                    <button
                      type="submit"
                      className="inline-flex h-14 w-full items-center justify-center rounded-full bg-[linear-gradient(135deg,#2563eb_0%,#4f46e5_55%,#7c3aed_100%)] px-6 text-lg font-semibold text-white shadow-[0_18px_40px_rgba(79,70,229,0.28)] transition hover:-translate-y-0.5 hover:brightness-105"
                    >
                      Crear mi agenda
                    </button>

                    <Link
                      href="/planes"
                      className="inline-flex h-14 w-full items-center justify-center rounded-full border border-fuchsia-200 bg-[linear-gradient(135deg,#fff7ed_0%,#ffffff_32%,#fdf2f8_100%)] px-6 text-lg font-semibold text-fuchsia-700 shadow-[0_0_0_1px_rgba(244,114,182,0.10),0_16px_38px_rgba(236,72,153,0.16)] transition hover:-translate-y-0.5 hover:border-fuchsia-300 hover:shadow-[0_0_0_1px_rgba(244,114,182,0.18),0_22px_46px_rgba(236,72,153,0.22)]"
                    >
                      Ver planes y empezar
                    </Link>
                  </form>

                  <p className="mt-5 text-center text-sm leading-6 text-slate-500">
                    Empieza gratis. Luego del período de prueba puedes pasar a
                    un plan de pago.
                  </p>

                  <div className="mt-7 text-center">
                    <div className="inline-flex items-center gap-1 text-rose-500">
                      <Star className="h-5 w-5 fill-current" />
                      <Star className="h-5 w-5 fill-current" />
                      <Star className="h-5 w-5 fill-current" />
                      <Star className="h-5 w-5 fill-current" />
                      <Star className="h-5 w-5 fill-current" />
                    </div>

                    <p className="mt-2 text-2xl font-medium text-slate-600">
                      +8.000 negocios nos recomiendan
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>
    </main>
  );
}