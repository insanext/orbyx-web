"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { Sparkles, Bot, MessageCircleMore, CalendarCheck2, RefreshCcw } from "lucide-react";

export default function OrbyxLandingPage() {
  const navItems = [
    { label: "Inicio", href: "/" },
    { label: "Funcionalidades", href: "#funcionalidades" },
    { label: "Soluciones", href: "#soluciones" },
    { label: "Ver planes", href: "/planes" },
  ];

  const floatTransition = {
    duration: 4,
    repeat: Infinity,
    repeatType: "mirror" as const,
    ease: "easeInOut" as const,
  };

  return (
    <main className="min-h-screen bg-[#050816] text-white">
      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          <Image
            src="/images/hero-orbyx-final.png"
            alt="Hero"
            fill
            priority
            className="object-cover object-right-top"
          />
        </div>

        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(5,8,22,0.96)_0%,rgba(5,8,22,0.92)_22%,rgba(5,8,22,0.70)_42%,rgba(5,8,22,0.25)_62%,rgba(5,8,22,0.05)_78%,rgba(5,8,22,0)_100%)]" />

        <div className="absolute inset-x-0 bottom-0 h-40 bg-[linear-gradient(180deg,rgba(5,8,22,0)_0%,rgba(5,8,22,0.35)_45%,rgba(5,8,22,0.78)_75%,#050816_100%)]" />

        <div className="absolute inset-0 bg-[radial-gradient(circle_at_72%_18%,rgba(255,94,247,0.16),transparent_25%),radial-gradient(circle_at_78%_52%,rgba(34,211,238,0.08),transparent_22%),radial-gradient(circle_at_20%_70%,rgba(59,130,246,0.08),transparent_22%)]" />

        <div className="relative z-20 mx-auto max-w-[1400px] px-6 pt-6">
          <header className="grid grid-cols-[auto_1fr_auto] items-center">
            <Link href="/" className="text-2xl font-semibold">
              Orbyx
            </Link>

            <nav className="hidden justify-center gap-10 lg:flex">
              {navItems.map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  className="font-semibold text-white/90 transition hover:text-white"
                >
                  {item.label}
                </Link>
              ))}
            </nav>

            <div className="flex justify-end">
              <Link
                href="/login"
                className="rounded-full border border-white/20 bg-white/10 px-5 py-2 text-sm font-semibold backdrop-blur-md transition hover:border-white/40 hover:bg-white/15"
              >
                Iniciar sesión
              </Link>
            </div>
          </header>
        </div>

        <div className="relative z-20 mx-auto max-w-[1400px] px-6 pb-20 pt-8">
          <div className="flex min-h-[760px] items-start">
            <div className="max-w-[650px] pt-24">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-4 py-2 text-sm backdrop-blur">
                <Sparkles className="h-4 w-4" />
                Automatiza todo por WhatsApp
              </div>

              <h1 className="mt-8 text-[60px] font-semibold leading-[1] tracking-[-0.03em]">
                Orbyx trabaja por ti:
                <br />
                responde, agenda y
                <br />
                recupera clientes
                <br />
                <span className="bg-gradient-to-r from-blue-300 via-purple-300 to-pink-300 bg-clip-text text-transparent">
                  automáticamente
                </span>
              </h1>

              <p className="mt-6 max-w-[620px] text-lg text-slate-300">
                Automatiza respuestas, agenda y seguimiento sin esfuerzo.
              </p>

              <div className="mt-8 flex gap-4">
                <Link
                  href="/register"
                  className="rounded-xl bg-gradient-to-r from-emerald-400 via-emerald-500 to-emerald-600 px-6 py-3 font-semibold text-white shadow-[0_14px_34px_rgba(16,185,129,0.32)] transition hover:scale-105"
                >
                  Probar gratis
                </Link>

                <Link
                  href="/planes"
                  className="rounded-xl border border-white/30 bg-white/10 px-6 py-3 font-semibold transition hover:bg-white/15"
                >
                  Ver planes
                </Link>
              </div>
            </div>

            <div className="relative hidden h-[700px] flex-1 lg:block">
              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ ...floatTransition, delay: 0 }}
                className="absolute right-8 top-14 flex gap-4"
              >
                <div className="rounded-[28px] border border-emerald-300/25 bg-[linear-gradient(180deg,rgba(255,255,255,0.24)_0%,rgba(255,255,255,0.09)_100%)] px-5 py-4 backdrop-blur-xl shadow-[0_18px_50px_rgba(34,197,94,0.18)] ring-1 ring-white/10">
                  <div className="bg-gradient-to-r from-emerald-300 via-lime-300 to-emerald-400 bg-clip-text text-4xl font-bold leading-none text-transparent drop-shadow-[0_0_18px_rgba(74,222,128,0.55)]">
                    +24
                  </div>
                  <div className="mt-2 text-sm text-white/90">
                    agendamientos
                    <br />
                    esta semana
                  </div>
                </div>

                <div className="rounded-[28px] border border-emerald-300/25 bg-[linear-gradient(180deg,rgba(255,255,255,0.24)_0%,rgba(255,255,255,0.09)_100%)] px-5 py-4 backdrop-blur-xl shadow-[0_18px_50px_rgba(34,197,94,0.18)] ring-1 ring-white/10">
                  <div className="bg-gradient-to-r from-emerald-300 via-lime-300 to-emerald-400 bg-clip-text text-4xl font-bold leading-none text-transparent drop-shadow-[0_0_18px_rgba(74,222,128,0.55)]">
                    +21
                  </div>
                  <div className="mt-2 text-sm text-white/90">
                    clientes confirmaron
                    <br />
                    su asistencia
                  </div>
                </div>

                <div className="rounded-[28px] border border-emerald-300/25 bg-[linear-gradient(180deg,rgba(255,255,255,0.24)_0%,rgba(255,255,255,0.09)_100%)] px-5 py-4 backdrop-blur-xl shadow-[0_18px_50px_rgba(34,197,94,0.18)] ring-1 ring-white/10">
                  <div className="bg-gradient-to-r from-emerald-300 via-lime-300 to-emerald-400 bg-clip-text text-4xl font-bold leading-none text-transparent drop-shadow-[0_0_18px_rgba(74,222,128,0.55)]">
                    +22
                  </div>
                  <div className="mt-2 text-sm text-white/90">
                    volvieron a agendar
                    <br />
                    automáticamente
                  </div>
                </div>
              </motion.div>

              <motion.div
                animate={{ y: [0, -12, 0], x: [0, 6, 0] }}
                transition={{ ...floatTransition, delay: 0.2 }}
                className="absolute right-24 top-44 flex justify-end"
              >
                <div className="max-w-[300px] rounded-[22px] rounded-tr-md border border-emerald-200/20 bg-gradient-to-r from-[#20d665] to-[#38ef7d] px-4 py-3 text-sm text-[#06210f] shadow-[0_16px_40px_rgba(37,211,102,0.34)] ring-1 ring-emerald-100/20">
                  <div className="mb-1 text-[11px] font-semibold text-black/60">
                    Cliente
                  </div>
                  ¿Tienen horas disponibles mañana?
                </div>
              </motion.div>

              <motion.div
                animate={{ y: [0, 10, 0], x: [0, -6, 0] }}
                transition={{ ...floatTransition, delay: 0.6 }}
                className="absolute right-44 top-[295px] flex justify-start"
              >
                <div className="max-w-[340px] rounded-[22px] rounded-tl-md border border-cyan-300/10 bg-[linear-gradient(180deg,rgba(37,46,96,0.95)_0%,rgba(26,33,72,0.96)_100%)] px-4 py-3 text-sm text-white shadow-[0_18px_42px_rgba(46,81,255,0.22)] ring-1 ring-cyan-200/10 backdrop-blur-xl">
                  <div className="mb-1 text-[11px] font-semibold text-emerald-300">
                    IA Orbyx
                  </div>
                  Sí, tengo disponibilidad. Tenemos a las 10:00 y 11:00.
                </div>
              </motion.div>

              <motion.div
                animate={{ y: [0, -8, 0], x: [0, 8, 0] }}
                transition={{ ...floatTransition, delay: 1 }}
                className="absolute right-4 top-[430px] flex justify-end"
              >
                <div className="max-w-[250px] rounded-[22px] rounded-tr-md border border-emerald-200/20 bg-gradient-to-r from-[#20d665] to-[#38ef7d] px-4 py-3 text-sm text-[#06210f] shadow-[0_16px_40px_rgba(37,211,102,0.34)] ring-1 ring-emerald-100/20">
                  <div className="mb-1 text-[11px] font-semibold text-black/60">
                    Cliente
                  </div>
                  El de las 11:00, por favor.
                </div>
              </motion.div>

              <motion.div
                animate={{ y: [0, 10, 0], x: [0, -5, 0] }}
                transition={{ ...floatTransition, delay: 1.4 }}
                className="absolute right-40 top-[552px] flex justify-start"
              >
                <div className="max-w-[300px] rounded-[22px] rounded-tl-md border border-cyan-300/10 bg-[linear-gradient(180deg,rgba(37,46,96,0.95)_0%,rgba(26,33,72,0.96)_100%)] px-4 py-3 text-sm text-white shadow-[0_18px_42px_rgba(46,81,255,0.22)] ring-1 ring-cyan-200/10 backdrop-blur-xl">
                  <div className="mb-1 text-[11px] font-semibold text-emerald-300">
                    IA Orbyx
                  </div>
                  Listo ✅ Tu cita quedó confirmada.
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden bg-[#050816] py-24">
        <div className="absolute inset-x-0 top-0 h-24 bg-[linear-gradient(180deg,rgba(213,102,255,0.10)_0%,rgba(5,8,22,0)_100%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_20%,rgba(168,85,247,0.12),transparent_28%),radial-gradient(circle_at_20%_80%,rgba(34,211,238,0.08),transparent_24%),radial-gradient(circle_at_80%_70%,rgba(16,185,129,0.08),transparent_24%)]" />

        <div className="relative mx-auto max-w-[1200px] px-6">
          <div className="mx-auto max-w-[900px] text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-200 backdrop-blur-md">
              <Bot className="h-4 w-4 text-emerald-300" />
              IA aplicada a reservas y atención
            </div>

            <h2 className="mt-6 text-4xl font-semibold tracking-[-0.03em]">
              Inteligencia artificial que trabaja por tu negocio
            </h2>

            <p className="mx-auto mt-5 max-w-[760px] text-lg leading-8 text-slate-300">
              Orbyx responde automáticamente a tus clientes, agenda citas y hace
              seguimiento sin intervención manual. Todo adaptado a tu negocio,
              para que vendas más y operes con menos carga.
            </p>
          </div>

          <div className="mt-14 grid gap-6 md:grid-cols-3">
            <div className="group rounded-[26px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.08)_0%,rgba(255,255,255,0.03)_100%)] p-7 shadow-[0_18px_50px_rgba(0,0,0,0.18)] backdrop-blur-xl transition hover:-translate-y-1 hover:border-emerald-300/25 hover:shadow-[0_20px_55px_rgba(16,185,129,0.10)]">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/15 ring-1 ring-emerald-300/15">
                <MessageCircleMore className="h-6 w-6 text-emerald-300" />
              </div>
              <h3 className="mt-5 text-xl font-semibold">
                Responde clientes automáticamente
              </h3>
              <p className="mt-3 text-sm leading-7 text-slate-300">
                Atiende consultas frecuentes por WhatsApp y entrega respuestas
                rápidas sin depender de que alguien esté conectado todo el día.
              </p>
            </div>

            <div className="group rounded-[26px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.08)_0%,rgba(255,255,255,0.03)_100%)] p-7 shadow-[0_18px_50px_rgba(0,0,0,0.18)] backdrop-blur-xl transition hover:-translate-y-1 hover:border-cyan-300/25 hover:shadow-[0_20px_55px_rgba(34,211,238,0.10)]">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-500/15 ring-1 ring-cyan-300/15">
                <CalendarCheck2 className="h-6 w-6 text-cyan-300" />
              </div>
              <h3 className="mt-5 text-xl font-semibold">
                Agenda sin intervención
              </h3>
              <p className="mt-3 text-sm leading-7 text-slate-300">
                Muestra disponibilidad, confirma horarios y reduce el trabajo
                manual de tu equipo en la coordinación diaria.
              </p>
            </div>

            <div className="group rounded-[26px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.08)_0%,rgba(255,255,255,0.03)_100%)] p-7 shadow-[0_18px_50px_rgba(0,0,0,0.18)] backdrop-blur-xl transition hover:-translate-y-1 hover:border-fuchsia-300/25 hover:shadow-[0_20px_55px_rgba(217,70,239,0.10)]">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-fuchsia-500/15 ring-1 ring-fuchsia-300/15">
                <RefreshCcw className="h-6 w-6 text-fuchsia-300" />
              </div>
              <h3 className="mt-5 text-xl font-semibold">
                Recupera clientes perdidos
              </h3>
              <p className="mt-3 text-sm leading-7 text-slate-300">
                Vuelve a contactar clientes que no asistieron o dejaron de
                reservar, con seguimiento automático y oportuno.
              </p>
            </div>
          </div>

          <div className="mt-14 rounded-[32px] border border-white/10 bg-[linear-gradient(135deg,rgba(16,185,129,0.10)_0%,rgba(59,130,246,0.08)_45%,rgba(168,85,247,0.10)_100%)] p-8 shadow-[0_22px_60px_rgba(0,0,0,0.18)] backdrop-blur-xl">
            <div className="grid items-center gap-8 md:grid-cols-[1.1fr_0.9fr]">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.24em] text-emerald-300/90">
                  Más que una agenda
                </p>
                <h3 className="mt-3 text-3xl font-semibold tracking-[-0.03em]">
                  Orbyx responde, agenda y hace seguimiento por ti
                </h3>
                <p className="mt-4 max-w-[620px] text-slate-300 leading-8">
                  No solo ordenas tu calendario. También automatizas conversaciones,
                  confirmaciones y recuperación de clientes con una experiencia
                  moderna, rápida y profesional.
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-3 md:grid-cols-1">
                <div className="rounded-2xl border border-white/10 bg-white/5 px-5 py-4 text-sm text-slate-100">
                  WhatsApp con atención automatizada
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 px-5 py-4 text-sm text-slate-100">
                  Confirmaciones y recordatorios automáticos
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 px-5 py-4 text-sm text-slate-100">
                  Seguimiento inteligente para reactivar clientes
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}