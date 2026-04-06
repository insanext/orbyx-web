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

      {/* HERO */}
      <section className="relative overflow-hidden bg-[#050816]">

        {/* FONDO */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(5,8,22,0.98)_0%,rgba(5,9,24,0.94)_25%,rgba(7,10,28,0.65)_48%,rgba(7,10,28,0.25)_70%,rgba(7,10,28,0.08)_100%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_18%,rgba(59,130,246,0.12),transparent_24%),radial-gradient(circle_at_82%_16%,rgba(168,85,247,0.12),transparent_28%)]" />
        </div>

        <div className="relative mx-auto max-w-[1680px] px-6 pb-16 pt-16 lg:px-10 lg:pb-20 lg:pt-20">

          <div className="grid items-center gap-6 lg:grid-cols-[minmax(700px,0.95fr)_minmax(900px,1.05fr)]">

            {/* TEXTO */}
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
                  className="rounded-xl bg-emerald-500 px-6 py-3 font-medium text-white hover:bg-emerald-400"
                >
                  Probar gratis
                </Link>

                <Link
                  href="/planes"
                  className="rounded-xl border border-white/30 px-6 py-3 font-medium text-white hover:bg-white/5"
                >
                  Ver planes
                </Link>
              </motion.div>
            </div>

            {/* IMAGEN */}
            <motion.div
              initial={{ opacity: 0, x: 18 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.08 }}
              className="relative hidden lg:block"
            >
              <div className="relative h-[640px] xl:h-[700px]">

                {/* GLOW */}
                <div className="absolute right-[5%] top-[10%] z-0 h-[70%] w-[70%] rounded-full bg-fuchsia-500/10 blur-3xl" />

                {/* IMAGEN PRINCIPAL (CLAVE) */}
                <div className="absolute inset-y-0 right-[-6%] z-10 flex items-center">
                  <Image
                    src="/images/hero-orbyx-final.png"
                    alt="Hero Orbyx"
                    width={1942}
                    height={1027}
                    priority
                    className="w-[1150px] max-w-none xl:w-[1250px]"
                  />
                </div>

                {/* FADE IZQUIERDO SUAVE */}
                <div className="pointer-events-none absolute inset-y-0 left-0 z-20 w-[20%] bg-[linear-gradient(90deg,#050816_0%,rgba(5,8,22,0.85)_45%,rgba(5,8,22,0.35)_75%,transparent_100%)]" />

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