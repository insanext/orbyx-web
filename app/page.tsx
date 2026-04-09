"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";

export default function OrbyxLandingPage() {
  const navItems = [
    { label: "Inicio", href: "/" },
    { label: "Funcionalidades", href: "#funcionalidades" },
    { label: "Soluciones", href: "#soluciones" },
    { label: "Ver planes", href: "/planes" },
  ];

  return (
    <main className="min-h-screen bg-[#050816] text-white">
      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          <Image
            src="/images/hero-orbyx-final.png"
            alt="Hero"
            fill
            priority
            className="object-cover object-right"
          />
        </div>

        <div className="absolute inset-0 bg-gradient-to-r from-[#050816] via-[#050816]/90 to-transparent" />

        <div className="relative z-20 mx-auto max-w-[1400px] px-6 pt-6">
          <header className="grid grid-cols-[auto_1fr_auto] items-center gap-6">
            <Link href="/" className="text-2xl font-semibold">
              Orbyx
            </Link>

            <nav className="hidden lg:flex items-center justify-center gap-10">
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
                className="rounded-full border border-white/20 bg-white/10 px-5 py-2 text-sm font-semibold backdrop-blur-md transition hover:bg-white/15"
              >
                Iniciar sesión
              </Link>
            </div>
          </header>
        </div>

        <div className="relative z-20 mx-auto max-w-[1400px] px-6 py-20">
          <div className="flex min-h-[700px] items-center">
            <div className="max-w-[650px]">
              <motion.div
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm backdrop-blur-md"
              >
                <Sparkles className="h-4 w-4" />
                Automatiza todo por WhatsApp
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.08 }}
                className="mt-8 text-[60px] font-semibold leading-[1] tracking-[-0.03em]"
              >
                Orbyx trabaja por ti:
                <br />
                responde, agenda y
                <br />
                recupera clientes
                <br />
                <span className="bg-gradient-to-r from-blue-300 via-purple-300 to-pink-300 bg-clip-text text-transparent">
                  automáticamente
                </span>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.14 }}
                className="mt-6 max-w-[620px] text-lg leading-8 text-slate-300"
              >
                Automatiza respuestas, agenda y seguimiento sin esfuerzo.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="mt-8 flex flex-wrap gap-4"
              >
                <Link
                  href="/register"
                  className="rounded-2xl bg-gradient-to-r from-emerald-400 to-emerald-600 px-6 py-3 font-semibold text-white shadow-[0_12px_30px_rgba(16,185,129,0.28)] transition hover:scale-105"
                >
                  Probar gratis
                </Link>

                <Link
                  href="/planes"
                  className="rounded-2xl border border-white/30 bg-white/10 px-6 py-3 font-semibold backdrop-blur-md transition hover:bg-white/15"
                >
                  Ver planes
                </Link>
              </motion.div>
            </div>

            <div className="relative hidden h-[560px] flex-1 lg:block">
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
                className="absolute right-10 top-8 flex gap-4"
              >
                <div className="rounded-2xl border border-white/15 bg-white/10 px-5 py-4 backdrop-blur-md">
                  <div className="text-3xl font-semibold leading-none">+24</div>
                  <div className="mt-1 text-sm text-white/80">
                    agendamientos
                    <br />
                    esta semana
                  </div>
                </div>

                <div className="rounded-2xl border border-white/15 bg-white/10 px-5 py-4 backdrop-blur-md">
                  <div className="text-3xl font-semibold leading-none">+21</div>
                  <div className="mt-1 text-sm text-white/80">
                    clientes confirmaron
                    <br />
                    su asistencia
                  </div>
                </div>

                <div className="rounded-2xl border border-white/15 bg-white/10 px-5 py-4 backdrop-blur-md">
                  <div className="text-3xl font-semibold leading-none">+22</div>
                  <div className="mt-1 text-sm text-white/80">
                    volvieron a agendar
                    <br />
                    automáticamente
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 20, y: 10 }}
                animate={{ opacity: 1, x: 0, y: 0 }}
                transition={{ delay: 0.4 }}
                className="absolute right-32 top-40 max-w-[290px] rounded-2xl bg-emerald-500/90 px-4 py-3 text-sm text-[#06210f] shadow-xl backdrop-blur-md"
              >
                ¿Tienen horas disponibles mañana?
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 20, y: 10 }}
                animate={{ opacity: 1, x: 0, y: 0 }}
                transition={{ delay: 0.7 }}
                className="absolute right-52 top-56 max-w-[320px] rounded-2xl border border-white/10 bg-[#171b3a]/85 px-4 py-3 text-sm text-white shadow-xl backdrop-blur-md"
              >
                Sí, tengo disponibilidad. Te muestro 10:00 y 11:00.
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 20, y: 10 }}
                animate={{ opacity: 1, x: 0, y: 0 }}
                transition={{ delay: 1 }}
                className="absolute right-20 top-[330px] max-w-[260px] rounded-2xl bg-emerald-500/90 px-4 py-3 text-sm text-[#06210f] shadow-xl backdrop-blur-md"
              >
                El de las 11:00, por favor.
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 20, y: 10 }}
                animate={{ opacity: 1, x: 0, y: 0 }}
                transition={{ delay: 1.3 }}
                className="absolute right-44 top-[420px] max-w-[280px] rounded-2xl border border-white/10 bg-[#171b3a]/85 px-4 py-3 text-sm text-white shadow-xl backdrop-blur-md"
              >
                Listo ✅ Tu cita quedó confirmada.
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      <section id="funcionalidades" className="relative bg-[#050816] py-20">
        <div className="mx-auto max-w-[1300px] px-6">
          <div className="grid gap-6 md:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-6 backdrop-blur-sm">
              <h3 className="font-semibold">Más reservas</h3>
              <p className="mt-2 text-sm text-slate-300">
                Más respuestas a tiempo y menos clientes perdidos.
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-6 backdrop-blur-sm">
              <h3 className="font-semibold">Menos inasistencias</h3>
              <p className="mt-2 text-sm text-slate-300">
                Confirmaciones y recordatorios automáticos antes de cada cita.
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-6 backdrop-blur-sm">
              <h3 className="font-semibold">Menos carga manual</h3>
              <p className="mt-2 text-sm text-slate-300">
                Agenda, seguimiento y atención desde un mismo sistema.
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}