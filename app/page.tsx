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
    <main className="min-h-screen bg-[#0b0f1a] text-white">
      {/* HERO */}
      <section className="relative">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(99,102,241,0.25),transparent_40%)]" />

        <div className="relative mx-auto max-w-7xl px-5 py-16 lg:px-8">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            
            {/* IZQUIERDA */}
            <div>
              <div className="flex items-center gap-3">
                <img src="/orbyx-logo-dark.png" className="h-10" />
                <span className="bg-white/10 px-4 py-2 rounded-full text-sm text-sky-400">
                  IA + automatización inteligente
                </span>
              </div>

              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="mt-8 text-5xl font-semibold leading-tight"
              >
                Automatiza tus reservas con IA
                <br />
                <span className="text-blue-400">
                  y mantén tu agenda más activa
                </span>
              </motion.h1>

              <p className="mt-6 text-lg text-slate-300 max-w-xl">
                Deja de coordinar reservas por WhatsApp manualmente. Orbyx responde,
                propone horarios y agenda automáticamente.
                <br />
                Además, mantiene tu agenda activa con recordatorios y recuperación de clientes.
              </p>

              <div className="mt-6 flex flex-wrap gap-3">
                {chips.map((c) => (
                  <span key={c} className="bg-white/10 px-4 py-2 rounded-full text-sm">
                    {c}
                  </span>
                ))}
              </div>

              {/* FEATURES */}
              <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-3">
                {features.map((f, i) => {
                  const Icon = f.icon;
                  return (
                    <motion.div
                      key={f.title}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.08 }}
                      whileHover={{ y: -4, scale: 1.02 }}
                      className="rounded-xl bg-white/5 p-4 text-center border border-white/10"
                    >
                      <Icon className="mx-auto mb-2 h-5 w-5 text-blue-400" />
                      <p className="text-sm">{f.title}</p>
                    </motion.div>
                  );
                })}
              </div>

              {/* CTA */}
              <div className="mt-8 flex items-center gap-6">
                <Link
                  href="/planes"
                  className="relative px-8 py-4 rounded-xl font-semibold text-white bg-gradient-to-r from-blue-500 to-purple-500 shadow-lg hover:scale-105 transition"
                >
                  <span className="relative z-10">Ver planes</span>
                  <div className="absolute inset-0 rounded-xl blur-xl opacity-40 bg-gradient-to-r from-blue-500 to-purple-500" />
                </Link>

                <div>
                  <div className="flex text-yellow-400">
                    <Star className="h-4 w-4 fill-current" />
                    <Star className="h-4 w-4 fill-current" />
                    <Star className="h-4 w-4 fill-current" />
                    <Star className="h-4 w-4 fill-current" />
                    <Star className="h-4 w-4 fill-current" />
                  </div>
                  <p className="text-xs text-slate-400">
                    +8.000 negocios nos prefieren
                  </p>
                </div>
              </div>

              <p className="text-sm text-slate-400 mt-3">
                Empieza hoy y automatiza tus reservas en minutos
              </p>
            </div>

            {/* FORM */}
            <div className="rounded-2xl bg-[#111827] p-8 border border-white/10 shadow-xl">
              <div className="bg-blue-500/20 px-3 py-1 rounded-full text-sm text-blue-400 inline-block">
                Prueba gratis 7 días
              </div>

              <h2 className="mt-4 text-2xl font-semibold">
                Crea tu cuenta en Orbyx
              </h2>

              <form className="mt-6 space-y-3">
                <select className="w-full h-12 rounded-lg bg-white/5 border border-white/10 px-3">
                  <option>Tipo de negocio</option>
                  {businessTypes.map((b) => (
                    <option key={b}>{b}</option>
                  ))}
                </select>

                <select className="w-full h-12 rounded-lg bg-white/5 border border-white/10 px-3">
                  <option>Profesionales</option>
                  {teamSizes.map((t) => (
                    <option key={t}>{t}</option>
                  ))}
                </select>

                <input placeholder="Nombre" className="w-full h-12 rounded-lg bg-white/5 border border-white/10 px-3" />
                <input placeholder="Email" className="w-full h-12 rounded-lg bg-white/5 border border-white/10 px-3" />
                <input placeholder="Teléfono" className="w-full h-12 rounded-lg bg-white/5 border border-white/10 px-3" />

                <button className="w-full h-12 rounded-lg bg-gradient-to-r from-blue-500 to-purple-500 font-semibold hover:scale-[1.02] transition">
                  Crear mi agenda
                </button>
              </form>

              <p className="mt-4 text-xs text-slate-400 text-center">
                Empieza en 30 segundos • Sin tarjeta de crédito
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* SEGUNDA SECCIÓN */}
      <section className="py-16">
        <div className="max-w-5xl mx-auto px-5 text-center">
          <h2 className="text-3xl font-semibold">
            Más que agenda, crecimiento real
          </h2>

          <p className="mt-4 text-slate-400 max-w-2xl mx-auto">
            Orbyx no solo agenda citas. Automatiza la comunicación con tus clientes,
            optimiza tu tiempo y te ayuda a mantener tu agenda siempre activa sin esfuerzo.
          </p>

          <div className="mt-10 grid gap-6 sm:grid-cols-2">
            {benefits.map((b) => (
              <div
                key={b.title}
                className="text-left bg-white/5 border border-white/10 rounded-xl p-5"
              >
                <div className="flex items-center gap-3 mb-2">
                  <CheckCircle2 className="text-emerald-400" />
                  <h3 className="font-semibold">{b.title}</h3>
                </div>
                <p className="text-sm text-slate-400">{b.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}