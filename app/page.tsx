"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  CalendarDays,
  Rocket,
  Users,
  BellRing,
  Star,
  CheckCircle2,
  Sparkles,
  MessageSquareText,
} from "lucide-react";

export default function OrbyxLandingPage() {
  const quickFeatures = [
    { icon: CalendarDays, title: "Agenda y citas" },
    { icon: Rocket, title: "Reservas y seguimiento" },
    { icon: Users, title: "Clientes e historial" },
    { icon: BellRing, title: "Recordatorios automáticos" },
    { icon: Sparkles, title: "Recupera clientes inactivos" },
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

  const sideBenefits = [
    "Confirmaciones automáticas",
    "Recordatorios por WhatsApp",
    "Reactivación de clientes inactivos",
    "Vista clara de agenda y seguimiento",
  ];

  return (
    <main className="min-h-screen bg-[#f4eff5] text-slate-900">
      <section className="relative overflow-hidden bg-[#f4eff5]">
        <div className="absolute inset-0 bg-[linear-gradient(135deg,#f8f4f7_0%,#f3eef4_38%,#efe9f2_68%,#ebe6ef_100%)]" />

        <div className="absolute right-[-8%] top-[6%] hidden h-[760px] w-[760px] rounded-full bg-[radial-gradient(circle,rgba(200,160,255,0.20)_0%,rgba(200,160,255,0.10)_28%,rgba(255,255,255,0)_72%)] blur-2xl lg:block" />

        <div className="absolute inset-y-0 right-0 hidden w-[56%] lg:block">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_35%_42%,rgba(255,255,255,0.62)_0%,rgba(255,255,255,0.18)_30%,rgba(255,255,255,0)_62%)]" />
          <img
            src="/hero-orbyx-composed.png"
            alt="Vista principal Orbyx"
            className="absolute right-[-2%] top-1/2 w-[980px] max-w-none -translate-y-1/2 object-contain"
          />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(244,239,245,0.97)_0%,rgba(244,239,245,0.84)_18%,rgba(244,239,245,0.22)_44%,rgba(244,239,245,0)_67%)]" />
        </div>

        <div className="relative mx-auto max-w-7xl px-5 pb-12 pt-8 lg:px-8 lg:pb-16 lg:pt-10">
          <div className="grid items-center gap-10 lg:grid-cols-[0.92fr_1.08fr]">
            <div className="relative z-10 max-w-[660px]">
              <div className="inline-flex items-center gap-3">
                <div className="rounded-2xl bg-white px-3 py-2 shadow-[0_8px_24px_rgba(15,23,42,0.08)]">
                  <img
                    src="/orbyx-logo-dark.png"
                    alt="Orbyx"
                    className="h-10"
                  />
                </div>

                <div className="rounded-full bg-white px-4 py-2 text-sm font-medium text-sky-600 shadow-[0_8px_24px_rgba(15,23,42,0.06)]">
                  Agendamiento con IA + seguimiento inteligente
                </div>
              </div>

              <motion.h1
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="mt-8 text-[48px] font-semibold leading-[1.02] tracking-[-0.03em] text-slate-900 sm:text-[58px] lg:text-[66px]"
              >
                Automatiza tus
                <br />
                reservas con IA
                <br />
                <span className="text-sky-500">y mantén tu agenda</span>
                <br />
                <span className="text-sky-500">más activa</span>
              </motion.h1>

              <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600">
                Deja de coordinar reservas por WhatsApp manualmente. Orbyx
                responde, propone horarios y agenda automáticamente. Además, te
                ayuda a mantener tu agenda activa con seguimiento inteligente,
                recordatorios y recuperación de clientes.
              </p>

              <div className="mt-6 flex flex-wrap gap-3">
                {chips.map((item) => (
                  <span
                    key={item}
                    className="rounded-full bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-[0_8px_24px_rgba(15,23,42,0.05)]"
                  >
                    {item}
                  </span>
                ))}
              </div>

              <div className="mt-10 grid max-w-5xl gap-4 sm:grid-cols-2 lg:grid-cols-5">
                {quickFeatures.map((item) => {
                  const Icon = item.icon;
                  return (
                    <div
                      key={item.title}
                      className="rounded-[22px] bg-white px-4 py-5 text-center shadow-[0_12px_28px_rgba(15,23,42,0.06)]"
                    >
                      <Icon className="mx-auto mb-3 h-6 w-6 text-slate-700" />
                      <p className="text-sm font-medium leading-5 text-slate-800">
                        {item.title}
                      </p>
                    </div>
                  );
                })}
              </div>

              <div className="mt-8 inline-flex items-center gap-2 rounded-full bg-white px-4 py-3 shadow-[0_10px_24px_rgba(15,23,42,0.06)]">
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

            <div className="relative z-10 lg:min-h-[760px]">
              <div className="flex justify-center pt-6 lg:hidden">
                <img
                  src="/hero-orbyx-composed.png"
                  alt="Vista principal Orbyx"
                  className="w-full max-w-[720px] object-contain"
                />
              </div>

              <div className="absolute left-[5%] top-[18%] hidden rounded-full bg-white/75 px-6 py-4 text-slate-700 shadow-[0_16px_40px_rgba(255,255,255,0.35)] backdrop-blur md:flex lg:left-[2%]">
                <div className="flex items-center gap-3 text-[18px] font-medium">
                  <span className="text-3xl text-emerald-500">✓</span>
                  IA agendó nueva reserva
                </div>
              </div>

              <div className="absolute left-[3%] top-[31%] hidden rounded-[999px] bg-white/82 px-8 py-5 text-slate-800 shadow-[0_16px_40px_rgba(255,255,255,0.32)] backdrop-blur md:block lg:left-[0%]">
                <div className="flex items-start gap-3">
                  <span className="text-[52px] leading-none text-emerald-500">
                    +
                  </span>
                  <div className="leading-tight">
                    <div className="text-[42px] font-semibold">24 reservas</div>
                    <div className="text-[18px] text-slate-600">
                      esta semana
                    </div>
                  </div>
                </div>
              </div>

              <div className="absolute bottom-[4%] right-[8%] hidden lg:block">
                <Link
                  href="/planes"
                  className="flex h-16 min-w-[360px] items-center justify-center rounded-[22px] bg-[linear-gradient(135deg,#172554_0%,#312e81_38%,#7c3aed_72%,#ec4899_100%)] px-12 text-[18px] font-semibold text-white shadow-[0_18px_40px_rgba(76,29,149,0.35)] transition hover:scale-[1.02]"
                >
                  Ver planes
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="relative pb-16 pt-2">
        <div className="mx-auto max-w-7xl px-5 lg:px-8">
          <div className="grid gap-6 lg:grid-cols-[1.02fr_0.98fr]">
            <div className="rounded-[30px] border border-white/10 bg-[linear-gradient(180deg,#18284f_0%,#223a76_36%,#1c2254_100%)] p-6 text-white shadow-[0_30px_80px_rgba(15,23,42,0.22)] sm:p-7">
              <div className="inline-flex items-center rounded-full border border-white/15 bg-white/10 px-3 py-1 text-sm font-semibold text-sky-100">
                Empieza gratis por 7 días
              </div>

              <h2 className="mt-4 text-3xl font-semibold text-white">
                Configura tu agenda
              </h2>

              <p className="mt-2 text-sm leading-6 text-slate-200">
                Crea tu espacio en Orbyx y comienza con una experiencia clara,
                profesional y simple de configurar.
              </p>

              <form className="mt-6 space-y-3">
                <div className="grid gap-3 sm:grid-cols-2">
                  <select className="h-12 w-full rounded-xl border border-white/10 bg-white/10 px-3 text-sm text-white outline-none transition focus:border-sky-300 focus:ring-4 focus:ring-sky-400/20">
                    <option className="text-slate-900" value="">
                      Tipo de negocio
                    </option>
                    {businessTypes.map((item) => (
                      <option className="text-slate-900" key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>

                  <select className="h-12 w-full rounded-xl border border-white/10 bg-white/10 px-3 text-sm text-white outline-none transition focus:border-sky-300 focus:ring-4 focus:ring-sky-400/20">
                    <option className="text-slate-900" value="">
                      Profesionales
                    </option>
                    {teamSizes.map((item) => (
                      <option className="text-slate-900" key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                </div>

                <input
                  placeholder="Nombre y apellido"
                  className="h-12 w-full rounded-xl border border-white/10 bg-white/10 px-3 text-sm text-white outline-none placeholder:text-slate-300 transition focus:border-sky-300 focus:ring-4 focus:ring-sky-400/20"
                />

                <input
                  placeholder="Email"
                  className="h-12 w-full rounded-xl border border-white/10 bg-white/10 px-3 text-sm text-white outline-none placeholder:text-slate-300 transition focus:border-sky-300 focus:ring-4 focus:ring-sky-400/20"
                />

                <input
                  placeholder="Teléfono"
                  className="h-12 w-full rounded-xl border border-white/10 bg-white/10 px-3 text-sm text-white outline-none placeholder:text-slate-300 transition focus:border-sky-300 focus:ring-4 focus:ring-sky-400/20"
                />

                <button className="mt-2 h-12 w-full rounded-xl bg-[linear-gradient(135deg,#2563eb_0%,#3b82f6_100%)] text-sm font-semibold text-white shadow-[0_12px_30px_rgba(37,99,235,0.35)] transition hover:brightness-110">
                  Crear mi agenda
                </button>
              </form>

              <p className="mt-4 text-center text-xs leading-6 text-slate-300">
                Empieza gratis por 7 días. Luego elige el plan ideal para tu
                negocio.
              </p>
            </div>

            <div className="rounded-[30px] bg-white p-6 shadow-[0_24px_70px_rgba(15,23,42,0.08)]">
              <div className="inline-flex items-center gap-2 rounded-full bg-sky-50 px-3 py-1 text-sm font-semibold text-sky-700">
                <MessageSquareText className="h-4 w-4" />
                Qué ganas con Orbyx
              </div>

              <h3 className="mt-4 text-2xl font-semibold text-slate-900">
                Más que agenda, movimiento real en tu negocio
              </h3>

              <div className="mt-5 space-y-3">
                {sideBenefits.map((item) => (
                  <div key={item} className="flex items-start gap-3">
                    <CheckCircle2 className="mt-0.5 h-5 w-5 text-emerald-500" />
                    <p className="text-slate-700">{item}</p>
                  </div>
                ))}
              </div>

              <Link
                href="/planes"
                className="mt-6 flex h-12 w-full items-center justify-center rounded-xl border border-fuchsia-200 bg-[linear-gradient(135deg,#ffffff_0%,#fdf2f8_100%)] text-sm font-semibold text-fuchsia-700 shadow-[0_0_0_1px_rgba(244,114,182,0.08),0_10px_24px_rgba(236,72,153,0.10)] transition hover:-translate-y-0.5 hover:border-fuchsia-300 hover:shadow-[0_0_0_1px_rgba(244,114,182,0.14),0_14px_30px_rgba(236,72,153,0.14)]"
              >
                Ver planes
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}