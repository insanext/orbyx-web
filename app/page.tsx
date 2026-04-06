"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { Sparkles, BadgeCheck, CircleDollarSign } from "lucide-react";

export default function OrbyxLandingPage() {
  const heroChips = [
    "WhatsApp + automatización",
    "IA entrenada según tu negocio",
    "Prueba gratis por 7 días",
  ];

  const navItems = [
    { label: "Inicio", href: "/" },
    { label: "Funcionalidades", href: "#funcionalidades" },
    { label: "Soluciones", href: "#soluciones" },
    { label: "Ver planes", href: "/planes" },
  ];

  const resultCards = [
    {
      icon: CircleDollarSign,
      title: "Más ingresos",
      desc: "Más reservas, más seguimiento y menos horas perdidas.",
    },
    {
      icon: BadgeCheck,
      title: "Menos inasistencias",
      desc: "Confirmaciones y recordatorios automáticos antes de cada cita.",
    },
    {
      icon: Sparkles,
      title: "Menos estrés operativo",
      desc: "Tu negocio responde, agenda y hace seguimiento con menos carga manual.",
    },
  ];

  return (
    <main className="min-h-screen bg-[#050816] text-white">
      <section className="relative overflow-hidden bg-[#050816]">
        <div className="absolute inset-0">
          <Image
            src="/images/hero-orbyx-final.png"
            alt="Hero Orbyx"
            fill
            priority
            className="object-cover object-center"
          />
        </div>

        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(5,8,22,0.96)_0%,rgba(5,8,22,0.90)_24%,rgba(5,8,22,0.58)_38%,rgba(5,8,22,0.18)_50%,rgba(5,8,22,0.02)_65%,rgba(5,8,22,0)_76%)]" />

        <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_18%,rgba(59,130,246,0.12),transparent_24%),radial-gradient(circle_at_82%_16%,rgba(168,85,247,0.12),transparent_28%)]" />

        <div className="absolute inset-x-0 bottom-0 h-32 bg-[linear-gradient(180deg,rgba(5,8,22,0)_0%,rgba(5,8,22,0.50)_55%,#050816_100%)]" />

        <div className="relative mx-auto max-w-[1680px] px-6 pt-6 lg:px-10 lg:pt-8">
          <header className="flex items-center justify-between gap-6">
            <Link
              href="/"
              className="text-2xl font-semibold tracking-[-0.03em] text-white transition hover:opacity-90"
            >
              Orbyx
            </Link>

            <nav className="hidden items-center gap-6 lg:flex lg:-ml-24">
              {navItems.map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  className="text-sm font-semibold text-white/90 transition duration-200 hover:text-white"
                >
                  {item.label}
                </Link>
              ))}

              <Link
                href="/login"
                className="rounded-full border border-white/20 bg-white/10 px-5 py-2.5 text-sm font-semibold text-white backdrop-blur-md transition duration-200 hover:border-white/40 hover:bg-white/20"
              >
                Iniciar sesión
              </Link>
            </nav>
          </header>
        </div>

        <div className="relative mx-auto max-w-[1680px] px-6 pb-16 pt-10 lg:px-10 lg:pb-24 lg:pt-16">
          <div className="flex min-h-[680px] items-center lg:min-h-[760px]">
            <div className="relative z-20 max-w-[760px]">
              <motion.div
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/8 px-4 py-2 text-sm text-blue-100 backdrop-blur-sm"
              >
                <Sparkles className="h-4 w-4" />
                Automatiza reservas, atención y seguimiento por WhatsApp
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 }}
                className="mt-8 text-[58px] font-semibold leading-[0.95] tracking-[-0.03em] xl:text-[72px]"
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
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="mt-8 max-w-[640px] text-lg leading-8 text-slate-200"
              >
                Deja de perder clientes por no responder a tiempo o por
                inasistencias. Orbyx automatiza la atención por WhatsApp.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="mt-8 flex flex-wrap gap-3"
              >
                {heroChips.map((chip) => (
                  <span
                    key={chip}
                    className="rounded-full border border-white/8 bg-white/8 px-4 py-2 text-sm text-slate-100 backdrop-blur-sm transition duration-200 hover:border-white/15 hover:bg-white/10"
                  >
                    {chip}
                  </span>
                ))}
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="mt-10 flex flex-wrap gap-4"
              >
                <Link
                  href="/register"
                  className="group inline-flex items-center justify-center rounded-2xl bg-gradient-to-r from-emerald-400 via-emerald-500 to-emerald-600 px-7 py-3.5 font-semibold text-white shadow-[0_10px_30px_rgba(16,185,129,0.22)] transition duration-200 hover:-translate-y-0.5 hover:scale-[1.02] hover:from-emerald-400 hover:via-emerald-500 hover:to-emerald-700"
                >
                  <span className="transition duration-200 group-hover:tracking-[0.01em]">
                    Probar gratis
                  </span>
                </Link>

                <Link
                  href="/planes"
                  className="group inline-flex items-center justify-center rounded-2xl border border-white/30 bg-gradient-to-r from-white/10 via-white/5 to-white/10 px-7 py-3.5 font-semibold text-white backdrop-blur-md shadow-[0_10px_30px_rgba(0,0,0,0.25)] transition duration-200 hover:-translate-y-0.5 hover:scale-[1.03] hover:border-white/60 hover:from-white/20 hover:to-white/10"
                >
                  Ver planes
                </Link>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      <section id="funcionalidades" className="relative py-20">
        <div className="absolute inset-x-0 top-0 h-20 bg-[linear-gradient(180deg,rgba(9,13,34,0.35)_0%,rgba(5,8,22,0)_100%)]" />

        <div className="mx-auto max-w-[1300px] px-6">
          <div className="grid gap-6 md:grid-cols-3">
            {resultCards.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.title}
                  className="rounded-2xl border border-white/6 bg-white/[0.04] p-6 transition duration-200 hover:-translate-y-1 hover:border-white/12 hover:bg-white/[0.06]"
                >
                  <Icon className="mb-3 h-5 w-5 text-white" />
                  <h3 className="font-semibold">{item.title}</h3>
                  <p className="mt-2 text-sm text-slate-300">{item.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </main>
  );
}