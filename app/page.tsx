"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { CalendarDays, Rocket, Users, BellRing, Star } from "lucide-react";

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

  return (
    <main className="min-h-screen bg-[#f4eff5] text-slate-900">
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(135deg,#f8f4f7_0%,#f3eef4_36%,#eee8f1_70%,#ebe6ef_100%)]" />

        <div className="pointer-events-none absolute right-0 top-0 h-full w-[45%] hidden lg:block">
          <div
            className="h-full w-full bg-contain bg-no-repeat"
            style={{
              backgroundImage: "url('/hero-orbyx-composed.png')",
              backgroundPosition: "right center",
            }}
          />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,#f4eff5_0%,rgba(244,239,245,0.60)_35%,rgba(244,239,245,0.20)_60%,transparent_85%)]" />
        </div>

        <div className="relative mx-auto max-w-7xl px-5 py-10 lg:px-8 lg:py-16">
          <div className="grid items-center gap-16 lg:grid-cols-[1.1fr_0.9fr]">
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
                <span className="text-sky-500">y mantén tu agenda</span>
                <br />
                <span className="text-sky-500">más activa</span>
              </motion.h1>

              <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-700">
                Deja de coordinar reservas por WhatsApp manualmente. Orbyx
                responde, propone horarios y agenda automáticamente.
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

              <div className="mt-8 inline-flex items-center gap-2 rounded-full bg-white px-4 py-3 shadow">
                <div className="inline-flex items-center gap-1 text-amber-400">
                  <Star className="h-4 w-4 fill-current" />
                  <Star className="h-4 w-4 fill-current" />
                  <Star className="h-4 w-4 fill-current" />
                  <Star className="h-4 w-4 fill-current" />
                  <Star className="h-4 w-4 fill-current" />
                </div>
                <p className="text-sm font-medium text-slate-700">
                  +8.000 negocios nos recomiendan
                </p>
              </div>
            </div>

            <div className="relative z-10 flex justify-end">
              <div className="w-full max-w-[440px] rounded-[28px] bg-white p-6 shadow-[0_24px_70px_rgba(15,23,42,0.10)] sm:p-7">
                <h2 className="text-3xl font-semibold text-slate-900">
                  Empieza gratis
                </h2>

                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Configura tu agenda en minutos y comienza con una experiencia
                  más clara y profesional.
                </p>

                <form className="mt-6 space-y-3">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <select className="h-12 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100">
                      <option value="">Tipo de negocio</option>
                      {businessTypes.map((item) => (
                        <option key={item} value={item}>
                          {item}
                        </option>
                      ))}
                    </select>

                    <select className="h-12 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100">
                      <option value="">Profesionales</option>
                      {teamSizes.map((item) => (
                        <option key={item} value={item}>
                          {item}
                        </option>
                      ))}
                    </select>
                  </div>

                  <input
                    placeholder="Nombre y apellido"
                    className="h-12 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
                  />

                  <input
                    placeholder="Email"
                    className="h-12 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
                  />

                  <input
                    placeholder="Teléfono"
                    className="h-12 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
                  />

                  <button className="mt-2 h-12 w-full rounded-xl bg-blue-600 text-sm font-semibold text-white transition hover:bg-blue-700">
                    Crear mi agenda
                  </button>

                  <Link
                    href="/planes"
                    className="flex h-12 w-full items-center justify-center rounded-xl border border-fuchsia-200 bg-[linear-gradient(135deg,#ffffff_0%,#fdf2f8_100%)] text-sm font-semibold text-fuchsia-700 shadow-[0_0_0_1px_rgba(244,114,182,0.08),0_10px_24px_rgba(236,72,153,0.10)] transition hover:-translate-y-0.5 hover:border-fuchsia-300 hover:shadow-[0_0_0_1px_rgba(244,114,182,0.14),0_14px_30px_rgba(236,72,153,0.14)]"
                  >
                    Ver planes
                  </Link>
                </form>

                <p className="mt-4 text-center text-xs leading-6 text-slate-500">
                  Empieza gratis. Luego puedes elegir el plan ideal para tu
                  negocio.
                </p>

                <div className="mt-5 flex items-center justify-center gap-1 text-amber-400">
                  <Star className="h-4 w-4 fill-current" />
                  <Star className="h-4 w-4 fill-current" />
                  <Star className="h-4 w-4 fill-current" />
                  <Star className="h-4 w-4 fill-current" />
                  <Star className="h-4 w-4 fill-current" />
                </div>

                <p className="mt-2 text-center text-sm font-medium text-slate-600">
                  +8.000 negocios felices nos recomiendan
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}