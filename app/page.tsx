"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Sparkles,
  BadgeCheck,
  CircleDollarSign,
} from "lucide-react";

export default function OrbyxLandingPage() {
  const heroChips = [
    "WhatsApp + automatización",
    "IA entrenada según tu negocio",
    "Prueba gratis por 7 días",
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
    <main className="min-h-screen bg-[#060816] text-white">
      {/* HERO */}
      <section className="relative overflow-hidden bg-[#060816]">
        {/* Fondo general */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(5,10,28,0.96)_0%,rgba(7,13,33,0.92)_28%,rgba(9,15,36,0.72)_52%,rgba(9,15,36,0.35)_72%,rgba(9,15,36,0.15)_100%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_18%,rgba(59,130,246,0.16),transparent_24%),radial-gradient(circle_at_82%_16%,rgba(168,85,247,0.18),transparent_28%)]" />
        </div>

        <div className="relative mx-auto max-w-[1680px] px-6 pb-16 pt-16 lg:px-10 lg:pb-20 lg:pt-20">
          <div className="grid items-center gap-10 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] xl:gap-6">
            {/* TEXTO */}
            <div className="relative z-20 max-w-[680px]">
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
                className="mt-8 text-5xl font-semibold leading-[0.98] sm:text-6xl xl:text-[74px]"
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
                className="mt-8 max-w-[620px] text-lg leading-8 text-slate-200"
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
                    className="rounded-full border border-white/8 bg-white/8 px-4 py-2 text-sm text-slate-100 backdrop-blur-sm"
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
                  className="inline-flex items-center justify-center rounded-xl bg-emerald-500 px-6 py-3 font-medium text-white transition hover:bg-emerald-400"
                >
                  Probar gratis
                </Link>

                <Link
                  href="/planes"
                  className="inline-flex items-center justify-center rounded-xl border border-white/30 bg-transparent px-6 py-3 font-medium text-white transition hover:bg-white/5"
                >
                  Ver planes
                </Link>
              </motion.div>
            </div>

            {/* VISUAL DERECHO */}
            <motion.div
              initial={{ opacity: 0, x: 18 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.08 }}
              className="relative hidden lg:block"
            >
              <div className="relative h-[620px] xl:h-[670px]">
                {/* Glow suave detrás */}
                <div className="absolute right-[2%] top-[8%] z-0 h-[78%] w-[78%] rounded-full bg-fuchsia-500/10 blur-3xl" />

                {/* Imagen principal */}
                <div className="absolute inset-y-0 right-[-8%] z-10 flex items-center xl:right-[-10%]">
                  <Image
                    src="/images/hero-orbyx-final.png"
                    alt="Hero Orbyx"
                    width={1792}
                    height={1024}
                    priority
                    className="h-auto w-[980px] max-w-none xl:w-[1120px]"
                  />
                </div>

                {/* Fade para que se funda con el lado izquierdo */}
                <div className="pointer-events-none absolute inset-y-0 left-0 z-20 w-[34%] bg-[linear-gradient(90deg,#060816_0%,rgba(6,8,22,0.94)_42%,rgba(6,8,22,0.72)_68%,rgba(6,8,22,0)_100%)]" />

                {/* Fade inferior muy suave */}
                <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 h-24 bg-[linear-gradient(180deg,rgba(6,8,22,0)_0%,rgba(6,8,22,0.58)_100%)]" />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* RESULTADOS */}
      <section className="py-20">
        <div className="mx-auto max-w-[1300px] px-6">
          <div className="grid gap-6 md:grid-cols-3">
            {resultCards.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.title}
                  className="rounded-2xl border border-white/6 bg-white/[0.04] p-6"
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