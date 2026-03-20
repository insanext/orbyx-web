"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  CalendarDays,
  Rocket,
  Users,
  BellRing,
  MessageCircle,
  Plus,
  CheckCircle2,
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
    { icon: BellRing, title: "Recordatorios automáticos" },
  ];

  const chips = [
    "IA que agenda por WhatsApp",
    "Menos coordinación manual",
    "Más movimiento en tu agenda",
  ];

  return (
    <main className="min-h-screen bg-[#f4eff5] text-slate-900">
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(135deg,#f8f4f7_0%,#f3eef4_36%,#eee8f1_70%,#ebe6ef_100%)]" />

        <div
          className="absolute inset-0 bg-cover bg-no-repeat opacity-[0.95]"
          style={{
            backgroundImage: "url('/hero-orbyx-bg.png')",
            backgroundPosition: "72% center",
          }}
        />

        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(248,244,247,0.96)_0%,rgba(248,244,247,0.90)_18%,rgba(248,244,247,0.62)_40%,rgba(248,244,247,0.22)_62%,rgba(248,244,247,0.06)_100%)]" />

        <div className="relative mx-auto max-w-7xl px-5 py-8 lg:px-8 lg:py-14">
          <div className="grid items-center gap-16 lg:grid-cols-[1.05fr_0.95fr]">
            <div className="relative z-10 pt-2">
              <div className="inline-flex items-center gap-3">
                <div className="rounded-2xl border border-white/70 bg-white/90 px-3 py-2 shadow-[0_10px_30px_rgba(15,23,42,0.08)] backdrop-blur">
                  <img
                    src="/orbyx-logo-dark.png"
                    alt="Orbyx"
                    className="h-11 w-auto object-contain"
                  />
                </div>

                <div className="rounded-full border border-sky-200/70 bg-white/80 px-4 py-2 text-sm font-medium text-sky-700 shadow-sm backdrop-blur">
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
                <span className="bg-gradient-to-r from-cyan-600 via-sky-500 to-indigo-500 bg-clip-text text-transparent">
                  y mantén tu agenda
                </span>
                <br />
                <span className="bg-gradient-to-r from-cyan-600 via-sky-500 to-indigo-500 bg-clip-text text-transparent">
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
                    className="rounded-full border border-white/80 bg-white/82 px-4 py-2 text-sm font-medium text-slate-700 shadow-[0_8px_24px_rgba(15,23,42,0.05)] backdrop-blur"
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
                      className="rounded-[24px] border border-white/80 bg-white/75 p-4 text-center shadow-[0_12px_32px_rgba(15,23,42,0.06)] backdrop-blur"
                    >
                      <div className="mx-auto mb-3 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#eff6ff_0%,#f5f3ff_100%)] text-slate-700 ring-1 ring-slate-100">
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

            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.08 }}
              className="relative z-10 lg:pt-8"
            >
              <div className="pointer-events-none absolute right-[380px] top-[100px] hidden xl:block">
                <div className="rounded-full border border-white/70 bg-white/85 px-5 py-3 shadow-[0_16px_42px_rgba(15,23,42,0.10)] backdrop-blur-xl">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                      <MessageCircle className="h-5 w-5 fill-current" />
                    </div>
                    <p className="text-sm font-medium text-slate-700">
                      IA respondió por WhatsApp
                    </p>
                  </div>
                </div>
              </div>

              <div className="pointer-events-none absolute right-[335px] top-[170px] hidden xl:block">
                <div className="rounded-full border border-white/70 bg-white/85 px-5 py-3 shadow-[0_16px_42px_rgba(15,23,42,0.10)] backdrop-blur-xl">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-50 text-emerald-500">
                      <Plus className="h-5 w-5 stroke-[2.8]" />
                    </div>
                    <p className="text-sm text-slate-700">
                      <span className="mr-1 text-3xl font-semibold leading-none text-slate-900">
                        24
                      </span>
                      reservas esta semana
                    </p>
                  </div>
                </div>
              </div>

              <div className="relative ml-auto max-w-[440px] overflow-hidden rounded-[36px] border border-white/20 bg-[rgba(20,25,45,0.70)] p-6 text-white shadow-[0_30px_80px_rgba(15,23,42,0.24)] backdrop-blur-2xl sm:p-8">
                <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(99,102,241,0.20)_0%,rgba(20,25,45,0.10)_36%,rgba(20,25,45,0.02)_100%)]" />
                <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-fuchsia-500/20 blur-3xl" />
                <div className="absolute -left-10 bottom-10 h-28 w-28 rounded-full bg-sky-400/20 blur-3xl" />

                <div className="relative">
                  <div className="inline-flex items-center rounded-full border border-white/15 bg-white/10 px-3 py-1 text-sm font-semibold text-fuchsia-100">
                    Comienza hoy
                  </div>

                  <h2 className="mt-4 text-3xl font-semibold tracking-tight sm:text-[42px] sm:leading-[1.05]">
                    Haz despegar
                    <br />
                    tu agenda
                  </h2>

                  <p className="mt-4 text-[15px] leading-7 text-slate-200">
                    Crea tu espacio en Orbyx y empieza a ordenar reservas,
                    recordatorios y seguimiento desde un solo lugar.
                  </p>

                  <div className="mt-5 space-y-2">
                    {[
                      "Configuración simple",
                      "Prueba inicial sin tarjeta",
                      "Sirve para distintos negocios",
                    ].map((item) => (
                      <div key={item} className="flex items-center gap-2 text-sm text-slate-200">
                        <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>

                  <form className="mt-7 space-y-4">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <select className="h-14 w-full rounded-2xl border border-white/10 bg-white/10 px-4 text-base text-white outline-none transition placeholder:text-slate-300 focus:border-sky-300 focus:ring-4 focus:ring-sky-400/20">
                        <option className="text-slate-900" value="">
                          Tipo de negocio
                        </option>
                        {businessTypes.map((type) => (
                          <option className="text-slate-900" key={type} value={type}>
                            {type}
                          </option>
                        ))}
                      </select>

                      <select className="h-14 w-full rounded-2xl border border-white/10 bg-white/10 px-4 text-base text-white outline-none transition focus:border-sky-300 focus:ring-4 focus:ring-sky-400/20">
                        <option className="text-slate-900" value="">
                          Profesionales
                        </option>
                        {teamSizes.map((size) => (
                          <option className="text-slate-900" key={size} value={size}>
                            {size}
                          </option>
                        ))}
                      </select>
                    </div>

                    <input
                      type="text"
                      placeholder="Nombre y apellido"
                      className="h-14 w-full rounded-2xl border border-white/10 bg-white/10 px-4 text-base text-white outline-none placeholder:text-slate-300 transition focus:border-sky-300 focus:ring-4 focus:ring-sky-400/20"
                    />

                    <div className="grid gap-4 sm:grid-cols-2">
                      <input
                        type="email"
                        placeholder="Email"
                        className="h-14 w-full rounded-2xl border border-white/10 bg-white/10 px-4 text-base text-white outline-none placeholder:text-slate-300 transition focus:border-sky-300 focus:ring-4 focus:ring-sky-400/20"
                      />
                      <input
                        type="tel"
                        placeholder="Teléfono"
                        className="h-14 w-full rounded-2xl border border-white/10 bg-white/10 px-4 text-base text-white outline-none placeholder:text-slate-300 transition focus:border-sky-300 focus:ring-4 focus:ring-sky-400/20"
                      />
                    </div>

                    <Link
                      href="/planes"
                      className="inline-flex h-14 w-full items-center justify-center rounded-full bg-[linear-gradient(135deg,#fb7185_0%,#ec4899_45%,#8b5cf6_100%)] px-6 text-lg font-semibold text-white shadow-[0_18px_42px_rgba(217,70,239,0.28)] transition hover:-translate-y-0.5 hover:brightness-105"
                    >
                      Ver planes y empezar
                    </Link>

                    <button
                      type="submit"
                      className="inline-flex h-14 w-full items-center justify-center rounded-full border border-white/15 bg-white/10 px-6 text-lg font-semibold text-white transition hover:bg-white/16"
                    >
                      Crear mi agenda
                    </button>
                  </form>

                  <p className="mt-5 text-center text-sm leading-6 text-slate-300">
                    Empieza con una prueba inicial y luego elige el plan que más
                    se ajuste a tu negocio.
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>
    </main>
  );
}