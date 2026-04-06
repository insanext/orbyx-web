"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight,
  BellRing,
  CalendarDays,
  CheckCircle2,
  Clock3,
  HeartHandshake,
  MessageCircleMore,
  Scissors,
  Sparkles,
  Stethoscope,
  Users,
  Wand2,
  BrainCircuit,
  ShieldCheck,
  MessagesSquare,
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
      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(5,10,28,0.88)_0%,rgba(7,13,33,0.82)_32%,rgba(10,16,38,0.45)_62%,rgba(10,16,38,0.25)_100%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_18%,rgba(59,130,246,0.16),transparent_22%),radial-gradient(circle_at_80%_14%,rgba(168,85,247,0.20),transparent_26%)]" />
        </div>

        <div className="relative mx-auto max-w-[1680px] px-6 pb-16 pt-16 lg:px-10 lg:pb-18 lg:pt-20">
          <div className="grid items-center gap-14 lg:grid-cols-[minmax(0,1.02fr)_minmax(520px,760px)] xl:gap-8">

            {/* TEXTO */}
            <div className="max-w-4xl">
              <motion.div
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/8 px-4 py-2 text-sm text-blue-100"
              >
                <Sparkles className="h-4 w-4" />
                Automatiza reservas, atención y seguimiento por WhatsApp
              </motion.div>

              <motion.h1 className="mt-8 text-5xl font-semibold leading-[1.02] sm:text-6xl xl:text-7xl">
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

              <p className="mt-8 max-w-3xl text-lg text-slate-200">
                Deja de perder clientes por no responder a tiempo o por
                inasistencias. Orbyx automatiza la atención por WhatsApp.
              </p>

              <div className="mt-8 flex gap-3 flex-wrap">
                {heroChips.map((chip) => (
                  <span key={chip} className="rounded-full bg-white/10 px-4 py-2 text-sm">
                    {chip}
                  </span>
                ))}
              </div>

              <div className="mt-10 flex gap-4">
                <Link href="/register" className="bg-emerald-500 px-6 py-3 rounded-xl">
                  Probar gratis
                </Link>
                <Link href="/planes" className="border px-6 py-3 rounded-xl">
                  Ver planes
                </Link>
              </div>
            </div>

            {/* VISUAL DERECHO (IMAGEN FINAL ÚNICA) */}
            <motion.div className="relative hidden lg:block">
              <div className="relative min-h-[700px]">
                <div className="absolute right-[-120px] top-[0px] z-20 w-[1100px] xl:right-[-180px] xl:w-[1300px]">
                  <Image
                    src="/images/hero-orbyx-final.png"
                    alt="Hero Orbyx"
                    width={1792}
                    height={1024}
                    className="w-full h-auto"
                    priority
                  />
                </div>
              </div>
            </motion.div>

          </div>
        </div>
      </section>

      {/* RESULTADOS */}
      <section className="py-20">
        <div className="mx-auto max-w-[1300px] px-6">
          <div className="grid md:grid-cols-3 gap-6">
            {resultCards.map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.title} className="p-6 bg-white/5 rounded-xl">
                  <Icon className="mb-3" />
                  <h3 className="font-semibold">{item.title}</h3>
                  <p className="text-sm text-slate-300">{item.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

    </main>
  );
}