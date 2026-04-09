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

        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(5,8,22,0.96)_0%,rgba(5,8,22,0.92)_22%,rgba(5,8,22,0.68)_40%,rgba(5,8,22,0.24)_60%,rgba(5,8,22,0.06)_76%,rgba(5,8,22,0)_100%)]" />

        <div className="relative z-20 mx-auto max-w-[1400px] px-6 pt-6">
          <header className="grid grid-cols-[auto_1fr_auto] items-center">
            <Link href="/" className="text-2xl font-semibold">
              Orbyx
            </Link>

            <nav className="hidden lg:flex justify-center gap-10">
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

        <div className="relative z-20 mx-auto max-w-[1400px] px-6 pb-16 pt-8">
          <div className="flex min-h-[760px] items-start">
            <div className="max-w-[650px] pt-24">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm backdrop-blur">
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
                  className="rounded-xl bg-emerald-500 px-6 py-3 font-semibold transition hover:scale-105"
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
                className="absolute right-12 top-16 flex gap-4"
              >
                <div className="rounded-3xl border border-white/15 bg-white/10 px-5 py-4 backdrop-blur-md shadow-[0_12px_40px_rgba(0,0,0,0.22)]">
                  <div className="text-3xl font-semibold leading-none">+24</div>
                  <div className="mt-1 text-sm text-white/80">
                    agendamientos
                    <br />
                    esta semana
                  </div>
                </div>

                <div className="rounded-3xl border border-white/15 bg-white/10 px-5 py-4 backdrop-blur-md shadow-[0_12px_40px_rgba(0,0,0,0.22)]">
                  <div className="text-3xl font-semibold leading-none">+21</div>
                  <div className="mt-1 text-sm text-white/80">
                    clientes confirmaron
                    <br />
                    su asistencia
                  </div>
                </div>

                <div className="rounded-3xl border border-white/15 bg-white/10 px-5 py-4 backdrop-blur-md shadow-[0_12px_40px_rgba(0,0,0,0.22)]">
                  <div className="text-3xl font-semibold leading-none">+22</div>
                  <div className="mt-1 text-sm text-white/80">
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
                <div className="max-w-[290px] rounded-[22px] rounded-tr-md bg-[#25D366] px-4 py-3 text-sm text-[#06210f] shadow-[0_12px_30px_rgba(37,211,102,0.28)]">
                  <div className="mb-1 text-[11px] font-semibold text-black/55">
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
                <div className="max-w-[320px] rounded-[22px] rounded-tl-md border border-white/10 bg-[#1d2348]/90 px-4 py-3 text-sm text-white shadow-[0_12px_30px_rgba(0,0,0,0.28)] backdrop-blur-md">
                  <div className="mb-1 text-[11px] font-semibold text-emerald-300/90">
                    IA Orbyx
                  </div>
                  Sí, tengo disponibilidad. Tenemos a las 10:00 y 11:00.
                </div>
              </motion.div>

              <motion.div
                animate={{ y: [0, -8, 0], x: [0, 8, 0] }}
                transition={{ ...floatTransition, delay: 1 }}
                className="absolute right-8 top-[430px] flex justify-end"
              >
                <div className="max-w-[250px] rounded-[22px] rounded-tr-md bg-[#25D366] px-4 py-3 text-sm text-[#06210f] shadow-[0_12px_30px_rgba(37,211,102,0.28)]">
                  <div className="mb-1 text-[11px] font-semibold text-black/55">
                    Cliente
                  </div>
                  El de las 11:00, por favor.
                </div>
              </motion.div>

              <motion.div
                animate={{ y: [0, 10, 0], x: [0, -5, 0] }}
                transition={{ ...floatTransition, delay: 1.4 }}
                className="absolute right-34 top-[540px] flex justify-start"
              >
                <div className="max-w-[280px] rounded-[22px] rounded-tl-md border border-white/10 bg-[#1d2348]/90 px-4 py-3 text-sm text-white shadow-[0_12px_30px_rgba(0,0,0,0.28)] backdrop-blur-md">
                  <div className="mb-1 text-[11px] font-semibold text-emerald-300/90">
                    IA Orbyx
                  </div>
                  Listo ✅ Tu cita quedó confirmada.
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="mx-auto max-w-[1100px] px-6 text-center">
          <h2 className="text-3xl font-semibold">
            Inteligencia artificial que trabaja por tu negocio
          </h2>

          <p className="mx-auto mt-6 max-w-[700px] text-slate-300">
            Orbyx responde automáticamente a tus clientes, agenda citas y hace
            seguimiento sin intervención manual. Todo adaptado a tu negocio.
          </p>

          <div className="mt-10 grid gap-6 md:grid-cols-3">
            <div className="rounded-xl border border-white/10 bg-white/5 p-6">
              Responde clientes automáticamente
            </div>

            <div className="rounded-xl border border-white/10 bg-white/5 p-6">
              Agenda sin intervención
            </div>

            <div className="rounded-xl border border-white/10 bg-white/5 p-6">
              Recupera clientes perdidos
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}