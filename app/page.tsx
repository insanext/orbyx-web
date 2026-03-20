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
        <div className="absolute inset-0 bg-[linear-gradient(135deg,#f8f4f6_0%,#f5f0f4_38%,#efe9f1_70%,#ece7f0_100%)]" />

        <div
          className="absolute inset-0 bg-cover bg-no-repeat opacity-[0.94]"
          style={{
            backgroundImage: "url('/hero-orbyx-bg.png')",
            backgroundPosition: "center center",
          }}
        />

        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(248,244,246,0.94)_0%,rgba(248,244,246,0.88)_20%,rgba(248,244,246,0.58)_41%,rgba(248,244,246,0.22)_62%,rgba(248,244,246,0.06)_100%)]" />

        <div className="absolute inset-0 bg-[radial-gradient(circle_at_22%_18%,rgba(56,189,248,0.08),transparent_22%),radial-gradient(circle_at_76%_18%,rgba(168,85,247,0.08),transparent_18%),radial-gradient(circle_at_78%_72%,rgba(251,113,133,0.08),transparent_20%)]" />

        <div className="relative mx-auto max-w-7xl px-5 py-8 lg:px-8 lg:py-12">
          <div className="grid items-center gap-10 lg:grid-cols-[1.06fr_0.94fr]">
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

                <div className="rounded-full border border-sky-200/70 bg-white/75 px-4 py-2 text-sm font-medium text-sky-700 shadow-sm backdrop-blur">
                  Agendamiento con IA + seguimiento inteligente
                </div>
              </div>

              <motion.h1
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45 }}
                className="mt-8 max-w-3xl text-4xl font-semibold leading-tight tracking-tight text-slate-900 sm:text-5xl lg:text-[62px]"
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
  {/* BADGES (más sutiles) */}
  <div className="pointer-events-none absolute left-6 top-16 hidden xl:block">
    <div className="rounded-full bg-white/70 px-4 py-2 text-sm text-slate-700 shadow backdrop-blur">
      🟢 IA respondió por WhatsApp
    </div>
  </div>

  <div className="pointer-events-none absolute left-16 top-32 hidden xl:block">
    <div className="rounded-full bg-white/70 px-4 py-2 text-sm text-slate-700 shadow backdrop-blur">
      <span className="font-semibold text-slate-900">+24</span> reservas esta semana
    </div>
  </div>

  {/* FORMULARIO NUEVO */}
  <div className="ml-auto max-w-[440px] rounded-[28px] border border-white/60 bg-white/80 p-6 shadow-[0_20px_60px_rgba(15,23,42,0.10)] backdrop-blur-xl">

    <h2 className="text-3xl font-semibold text-slate-900">
      Empieza gratis
    </h2>

    <p className="mt-2 text-sm text-slate-600">
      Configura tu agenda en minutos
    </p>

    <form className="mt-6 space-y-3">

      <input
        type="text"
        placeholder="Nombre y apellido"
        className="h-12 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-sky-400"
      />

      <input
        type="email"
        placeholder="Email"
        className="h-12 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-sky-400"
      />

      <input
        type="tel"
        placeholder="Teléfono"
        className="h-12 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-sky-400"
      />

      <select className="h-12 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-sky-400">
        <option>Tipo de negocio</option>
        <option>Barbería</option>
        <option>Clínica</option>
        <option>Centro estético</option>
      </select>

      <select className="h-12 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-sky-400">
        <option>Profesionales</option>
        <option>1</option>
        <option>2 a 3</option>
        <option>4+</option>
      </select>

      {/* BOTÓN PRINCIPAL NUEVO */}
      <button
        type="submit"
        className="mt-2 h-12 w-full rounded-xl bg-[#2563eb] text-sm font-semibold text-white transition hover:bg-[#1d4ed8]"
      >
        Crear mi agenda
      </button>

      {/* BOTÓN PLANES MÁS PRO */}
      <Link
        href="/planes"
        className="flex h-12 w-full items-center justify-center rounded-xl border border-slate-200 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
      >
        Ver planes
      </Link>
    </form>

    <p className="mt-4 text-xs text-slate-500 text-center">
      Sin tarjeta · Prueba gratuita
    </p>
  </div>
</motion.div>
          </div>
        </div>
      </section>
    </main>
  );
}