"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  CalendarDays,
  Rocket,
  Users,
  CreditCard,
  Star,
  CheckCircle2,
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
    { icon: CreditCard, title: "Base para pagos online" },
  ];

  const chips = [
    "IA que agenda por WhatsApp",
    "Menos coordinación manual",
    "Más movimiento en tu agenda",
  ];

  return (
    <main className="min-h-screen bg-[#f7f4f8] text-slate-900">
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(135deg,#f8f5f9_0%,#f4f1f7_35%,#efeaf4_68%,#ece8f2_100%)]" />

        <div
          className="absolute inset-0 bg-cover bg-no-repeat opacity-[0.9]"
          style={{
            backgroundImage: "url('/hero-orbyx-bg.png')",
            backgroundPosition: "68% center",
          }}
        />

        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(248,245,249,0.95)_0%,rgba(248,245,249,0.90)_20%,rgba(248,245,249,0.64)_40%,rgba(248,245,249,0.22)_63%,rgba(248,245,249,0.08)_100%)]" />

        <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_20%,rgba(56,189,248,0.10),transparent_22%),radial-gradient(circle_at_78%_18%,rgba(129,140,248,0.08),transparent_20%),radial-gradient(circle_at_78%_75%,rgba(236,72,153,0.06),transparent_22%)]" />

        <div className="relative mx-auto max-w-7xl px-5 py-8 lg:px-8 lg:py-12">
          <div className="grid items-center gap-12 lg:grid-cols-[1.05fr_0.95fr]">
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

                <div className="rounded-full border border-sky-200/70 bg-white/70 px-4 py-2 text-sm font-medium text-sky-700 shadow-sm backdrop-blur">
                  Agendamiento con IA + seguimiento inteligente
                </div>
              </div>

              <motion.h1
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45 }}
                className="mt-8 max-w-3xl text-4xl font-semibold leading-tight tracking-tight text-slate-900 sm:text-5xl lg:text-[60px]"
              >
                Automatiza tus
                <br />
                reservas con IA
                <br />
                <span className="bg-gradient-to-r from-sky-600 via-cyan-500 to-indigo-500 bg-clip-text text-transparent">
                  y mantén tu agenda
                </span>
                <br />
                <span className="bg-gradient-to-r from-sky-600 via-cyan-500 to-indigo-500 bg-clip-text text-transparent">
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

              <div className="mt-10 grid max-w-2xl gap-5 sm:grid-cols-2 lg:grid-cols-4">
                {quickFeatures.map((item) => {
                  const Icon = item.icon;
                  return (
                    <div
                      key={item.title}
                      className="rounded-3xl border border-white/70 bg-white/65 p-4 text-center shadow-[0_12px_32px_rgba(15,23,42,0.06)] backdrop-blur"
                    >
                      <div className="mx-auto mb-3 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-50 to-indigo-50 text-sky-700 ring-1 ring-sky-100">
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
              className="relative z-10 lg:pt-4"
            >
              {/* SOLO 2 BADGES */}
              <div className="pointer-events-none absolute left-2 top-10 hidden xl:block">
                <div className="rounded-2xl border border-white/80 bg-white/80 px-5 py-3 shadow-[0_18px_50px_rgba(15,23,42,0.10)] backdrop-blur-xl">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                      <MessageCircle className="h-5 w-5 fill-current" />
                    </div>
                    <p className="text-[15px] font-medium text-slate-700">
                      IA respondió por WhatsApp
                    </p>
                  </div>
                </div>
              </div>

              <div className="pointer-events-none absolute left-12 top-30 hidden xl:block">
                <div className="rounded-2xl border border-white/80 bg-white/80 px-5 py-3 shadow-[0_18px_50px_rgba(15,23,42,0.10)] backdrop-blur-xl">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-50 text-emerald-500">
                      <Plus className="h-6 w-6 stroke-[2.8]" />
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

              {/* FORMULARIO */}
              <div className="relative ml-auto max-w-[470px] overflow-hidden rounded-[34px] border border-white/70 bg-white/72 p-5 shadow-[0_24px_70px_rgba(15,23,42,0.10)] backdrop-blur-xl sm:p-7">
                <div className="absolute inset-x-0 top-0 h-32 bg-[linear-gradient(180deg,rgba(99,102,241,0.08),rgba(255,255,255,0))]" />

                <div className="relative">
                  <div className="inline-flex items-center rounded-full bg-violet-50 px-3 py-1 text-sm font-semibold text-violet-700 ring-1 ring-violet-100">
                    Prueba guiada
                  </div>

                  <h2 className="mt-4 max-w-md text-3xl font-semibold tracking-tight text-slate-900 sm:text-[38px]">
                    Empieza gratis por 7 días
                  </h2>

                  <p className="mt-3 max-w-md text-base leading-7 text-slate-600">
                    Configura tu agenda en minutos y empieza con una experiencia
                    más clara, moderna y profesional.
                  </p>

                  <div className="mt-5 grid gap-2">
                    {[
                      "Configuración simple en minutos",
                      "Sin tarjeta durante la prueba",
                      "Funciona para distintos tipos de negocio",
                    ].map((item) => (
                      <div
                        key={item}
                        className="flex items-center gap-2 text-sm text-slate-600"
                      >
                        <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>

                  <form className="mt-7 space-y-4">
                    <input
                      type="text"
                      placeholder="Ingresa tu nombre y apellido"
                      className="h-14 w-full rounded-2xl border border-slate-200 bg-white/90 px-4 text-base text-slate-700 outline-none transition focus:border-sky-500 focus:ring-4 focus:ring-sky-100"
                    />

                    <div className="grid gap-4 sm:grid-cols-2">
                      <input
                        type="email"
                        placeholder="Ingresa tu email"
                        className="h-14 w-full rounded-2xl border border-slate-200 bg-white/90 px-4 text-base text-slate-700 outline-none transition focus:border-sky-500 focus:ring-4 focus:ring-sky-100"
                      />
                      <input
                        type="tel"
                        placeholder="Teléfono"
                        className="h-14 w-full rounded-2xl border border-slate-200 bg-white/90 px-4 text-base text-slate-700 outline-none transition focus:border-sky-500 focus:ring-4 focus:ring-sky-100"
                      />
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <select className="h-14 w-full rounded-2xl border border-slate-200 bg-white/90 px-4 text-base text-slate-700 outline-none transition focus:border-sky-500 focus:ring-4 focus:ring-sky-100">
                        <option value="">Tipo de negocio</option>
                        {businessTypes.map((type) => (
                          <option key={type} value={type}>
                            {type}
                          </option>
                        ))}
                      </select>

                      <select className="h-14 w-full rounded-2xl border border-slate-200 bg-white/90 px-4 text-base text-slate-700 outline-none transition focus:border-sky-500 focus:ring-4 focus:ring-sky-100">
                        <option value="">Profesionales</option>
                        {teamSizes.map((size) => (
                          <option key={size} value={size}>
                            {size}
                          </option>
                        ))}
                      </select>
                    </div>

                    <button
                      type="submit"
                      className="inline-flex h-14 w-full items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#2563eb_0%,#4f46e5_55%,#7c3aed_100%)] px-6 text-lg font-semibold text-white shadow-[0_18px_40px_rgba(79,70,229,0.28)] transition hover:-translate-y-0.5 hover:brightness-105"
                    >
                      Crear mi agenda
                    </button>

                    <Link
                      href="/planes"
                      className="inline-flex h-14 w-full items-center justify-center rounded-2xl border border-fuchsia-200 bg-[linear-gradient(135deg,#ffffff_0%,#f8fafc_35%,#fdf2f8_100%)] px-6 text-lg font-semibold text-fuchsia-700 shadow-[0_0_0_1px_rgba(244,114,182,0.10),0_12px_30px_rgba(236,72,153,0.12)] transition hover:-translate-y-0.5 hover:border-fuchsia-300 hover:shadow-[0_0_0_1px_rgba(244,114,182,0.18),0_18px_40px_rgba(236,72,153,0.18)]"
                    >
                      Ver planes y empezar
                    </Link>
                  </form>

                  <p className="mt-5 text-center text-sm leading-6 text-slate-500">
                    Empieza gratis. Luego del período de prueba puedes pasar a
                    un plan de pago.
                  </p>

                  <div className="mt-6 text-center">
                    <div className="inline-flex items-center gap-1 text-rose-500">
                      <Star className="h-5 w-5 fill-current" />
                      <Star className="h-5 w-5 fill-current" />
                      <Star className="h-5 w-5 fill-current" />
                      <Star className="h-5 w-5 fill-current" />
                      <Star className="h-5 w-5 fill-current" />
                    </div>

                    <p className="mt-2 text-2xl font-medium text-slate-600">
                      +10.000 negocios nos recomiendan
                    </p>
                  </div>

                  <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50/85 p-4">
                    <p className="text-sm font-medium text-slate-800">
                      Nota sobre el tipo de negocio
                    </p>
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      Orbyx sigue siendo un producto general. Este dato nos
                      ayuda a sugerir una configuración inicial más útil, pero
                      no te obliga a usar una versión distinta del sistema.
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