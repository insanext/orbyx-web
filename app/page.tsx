"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  CalendarDays,
  Rocket,
  Users,
  BellRing,
} from "lucide-react";

export default function OrbyxLandingPage() {
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

        {/* FONDO SUAVE */}
        <div className="absolute inset-0 bg-[linear-gradient(135deg,#f8f4f7_0%,#f3eef4_36%,#eee8f1_70%,#ebe6ef_100%)]" />

        {/* 👇 IMAGEN CONTROLADA (ESTA ES LA CLAVE) */}
        <div className="pointer-events-none absolute right-0 top-0 h-full w-[45%] hidden lg:block">
          <div
            className="h-full w-full bg-contain bg-no-repeat"
            style={{
              backgroundImage: "url('/hero-orbyx-composed.png')",
              backgroundPosition: "right center",
            }}
          />

          {/* Degradado para mezclar */}
          <div className="absolute inset-0 bg-[linear-gradient(90deg,#f4eff5_0%,rgba(244,239,245,0.6)_35%,rgba(244,239,245,0.2)_60%,transparent_85%)]" />
        </div>

        <div className="relative mx-auto max-w-7xl px-5 py-10 lg:px-8 lg:py-16">
          <div className="grid items-center gap-16 lg:grid-cols-[1.1fr_0.9fr]">

            {/* IZQUIERDA */}
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
                <span className="text-sky-500">
                  y mantén tu agenda
                </span>
                <br />
                <span className="text-sky-500">
                  más activa
                </span>
              </motion.h1>

              <p className="mt-6 max-w-2xl text-lg text-slate-700">
                Deja de coordinar reservas por WhatsApp manualmente.
                Orbyx responde, propone horarios y agenda automáticamente.
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

              <div className="mt-10 grid max-w-2xl gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {quickFeatures.map((item) => {
                  const Icon = item.icon;
                  return (
                    <div
                      key={item.title}
                      className="rounded-2xl bg-white p-4 text-center shadow"
                    >
                      <Icon className="mx-auto mb-2 h-6 w-6" />
                      <p className="text-sm font-medium">{item.title}</p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* DERECHA */}
            <div className="relative z-10 flex justify-end">

              <div className="w-full max-w-[420px] rounded-3xl bg-white p-6 shadow-xl">

                <h2 className="text-2xl font-semibold">
                  Empieza gratis
                </h2>

                <p className="mt-2 text-sm text-slate-600">
                  Configura tu agenda en minutos
                </p>

                <form className="mt-6 space-y-3">

                  <input
                    placeholder="Nombre y apellido"
                    className="h-12 w-full rounded-xl border px-3"
                  />

                  <input
                    placeholder="Email"
                    className="h-12 w-full rounded-xl border px-3"
                  />

                  <input
                    placeholder="Teléfono"
                    className="h-12 w-full rounded-xl border px-3"
                  />

                  <button
                    className="mt-2 h-12 w-full rounded-xl bg-blue-600 text-white font-semibold"
                  >
                    Crear mi agenda
                  </button>

                  {/* BOTÓN DESTACADO */}
                  <Link
                    href="/planes"
                    className="flex h-12 w-full items-center justify-center rounded-xl bg-gradient-to-r from-pink-500 to-purple-500 text-white font-semibold"
                  >
                    Ver planes
                  </Link>

                </form>
              </div>

            </div>

          </div>
        </div>
      </section>
    </main>
  );
}