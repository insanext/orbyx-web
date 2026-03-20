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

  return (
    <main className="min-h-screen bg-[#0b0f1a] text-white">
      {/* HERO */}
      <section className="relative">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(99,102,241,0.25),transparent_40%)]" />

        <div className="relative mx-auto max-w-7xl px-5 py-16 lg:px-8">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            
            {/* IZQUIERDA */}
            <div>
              <div className="inline-flex items-center gap-3">
                <img src="/orbyx-logo-dark.png" className="h-10" />

                <div className="rounded-full bg-white/10 px-4 py-2 text-sm text-sky-400">
                  IA + automatización inteligente
                </div>
              </div>

              <motion.h1
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-8 text-5xl font-semibold leading-tight"
              >
                Automatiza tus reservas
                <br />
                <span className="text-blue-400">y llena tu agenda</span>
              </motion.h1>

              <p className="mt-6 text-lg text-slate-300 max-w-xl">
                Orbyx responde por WhatsApp, agenda automáticamente y reactiva
                clientes sin que tengas que hacer seguimiento manual.
              </p>

              <div className="mt-6 flex flex-wrap gap-3">
                {chips.map((c) => (
                  <span
                    key={c}
                    className="rounded-full bg-white/10 px-4 py-2 text-sm"
                  >
                    {c}
                  </span>
                ))}
              </div>

              <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-3">
                {features.map((f) => {
                  const Icon = f.icon;
                  return (
                    <div
                      key={f.title}
                      className="rounded-xl bg-white/5 p-4 text-center border border-white/10"
                    >
                      <Icon className="mx-auto mb-2 h-5 w-5 text-blue-400" />
                      <p className="text-sm">{f.title}</p>
                    </div>
                  );
                })}
              </div>

              <div className="mt-8 flex items-center gap-4">
                <Link
                  href="/planes"
                  className="px-8 py-4 rounded-xl bg-gradient-to-r from-blue-500 to-purple-500 font-semibold text-white shadow-lg hover:scale-105 transition"
                >
                  Ver planes
                </Link>

                <div className="flex items-center gap-1 text-yellow-400">
                  <Star className="h-4 w-4 fill-current" />
                  <Star className="h-4 w-4 fill-current" />
                  <Star className="h-4 w-4 fill-current" />
                  <Star className="h-4 w-4 fill-current" />
                  <Star className="h-4 w-4 fill-current" />
                </div>
              </div>
            </div>

            {/* DERECHA FORM */}
            <div className="rounded-2xl bg-[#111827] p-8 border border-white/10 shadow-xl">
              <div className="inline-block rounded-full bg-blue-500/20 px-3 py-1 text-sm text-blue-400">
                Prueba gratis 7 días
              </div>

              <h2 className="mt-4 text-2xl font-semibold">
                Crea tu cuenta en Orbyx
              </h2>

              <form className="mt-6 space-y-3">
                <input
                  placeholder="Nombre"
                  className="w-full h-12 rounded-lg bg-white/5 border border-white/10 px-3"
                />

                <input
                  placeholder="Email"
                  className="w-full h-12 rounded-lg bg-white/5 border border-white/10 px-3"
                />

                <input
                  placeholder="Teléfono"
                  className="w-full h-12 rounded-lg bg-white/5 border border-white/10 px-3"
                />

                <button className="w-full h-12 rounded-lg bg-gradient-to-r from-blue-500 to-purple-500 font-semibold hover:scale-[1.02] transition">
                  Crear mi agenda
                </button>
              </form>

              <p className="mt-4 text-xs text-slate-400 text-center">
                Sin tarjeta de crédito
              </p>
            </div>

          </div>
        </div>
      </section>
    </main>
  );
}