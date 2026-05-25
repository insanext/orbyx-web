"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Sparkles,
  Bot,
  MessageCircleMore,
  CalendarCheck2,
  RefreshCcw,
} from "lucide-react";

export default function OrbyxLandingPage() {
  const navItems = [
    { label: "Inicio", href: "/" },
    { label: "Funcionalidades", href: "#funcionalidades" },
    { label: "Soluciones", href: "#soluciones" },
    { label: "Ver planes", href: "/planes" },
  ];

  const trustBadges = [
    "Reservas 24/7",
    "Multi staff",
    "Campañas",
    "Recordatorios",
    "Calendarios opcionales",
  ];

  const platformCards = [
    {
      icon: CalendarCheck2,
      title: "Agenda y reservas",
      desc: "Disponibilidad, servicios, staff y sucursales en un flujo claro para tus clientes.",
      tone: "text-cyan-300 bg-cyan-400/10 ring-cyan-300/15",
    },
    {
      icon: MessageCircleMore,
      title: "Atención automática",
      desc: "WhatsApp e IA ayudan a responder dudas frecuentes y llevar la conversación a una reserva.",
      tone: "text-emerald-300 bg-emerald-400/10 ring-emerald-300/15",
    },
    {
      icon: RefreshCcw,
      title: "Campañas y seguimiento",
      desc: "Reactiva clientes, envía recordatorios y reduce trabajo manual desde el mismo SaaS.",
      tone: "text-fuchsia-300 bg-fuchsia-400/10 ring-fuchsia-300/15",
    },
  ];

  const nicheCards = [
    "Veterinarias",
    "Fitness / clases",
    "Talleres",
    "Servicios profesionales",
    "Group booking",
  ];

  return (
    <main className="min-h-screen w-full overflow-x-hidden bg-[#050816] text-white">
      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          <Image
            src="/images/hero-orbyx-final.png"
            alt="Interfaz visual de Orbyx"
            fill
            priority
            className="object-cover object-right-top opacity-70"
          />
        </div>

        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(5,8,22,0.98)_0%,rgba(5,8,22,0.92)_38%,rgba(5,8,22,0.62)_68%,rgba(5,8,22,0.20)_100%)]" />
        <div className="absolute inset-x-0 bottom-0 h-32 bg-[linear-gradient(180deg,rgba(5,8,22,0)_0%,#050816_100%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_76%_20%,rgba(34,211,238,0.12),transparent_26%),radial-gradient(circle_at_18%_72%,rgba(99,102,241,0.12),transparent_26%)]" />

        <div className="relative z-20 mx-auto w-full max-w-[1400px] px-4 pt-4 sm:px-6 sm:pt-5">
          <header className="flex items-center justify-between gap-3 rounded-full border border-white/10 bg-white/[0.06] px-3 py-2 backdrop-blur-xl sm:px-4">
            <Link href="/" className="text-xl font-semibold tracking-tight sm:text-2xl">
              Orbyx
            </Link>

            <nav className="hidden justify-center gap-7 lg:flex">
              {navItems.map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  className="text-sm font-semibold text-white/75 transition hover:text-white"
                >
                  {item.label}
                </Link>
              ))}
            </nav>

            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className="rounded-full border border-white/15 bg-white/5 px-3 py-2 text-xs font-semibold text-white/90 backdrop-blur-md transition hover:border-white/35 hover:bg-white/10 sm:px-4 sm:text-sm"
              >
                Iniciar sesión
              </Link>
              <Link
                href="/register"
                className="hidden rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-950 shadow-[0_12px_30px_rgba(255,255,255,0.14)] transition hover:bg-slate-100 sm:inline-flex"
              >
                Probar gratis
              </Link>
            </div>
          </header>
        </div>

        <div className="relative z-20 mx-auto w-full max-w-[1400px] px-4 pb-12 pt-9 sm:px-6 sm:pb-16 sm:pt-10 lg:pb-20">
          <div className="grid items-center gap-8 lg:min-h-[680px] lg:grid-cols-[minmax(0,0.92fr)_minmax(460px,0.9fr)] lg:gap-10">
            <div className="w-full max-w-[720px]">
              <motion.div
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45 }}
                className="inline-flex max-w-full items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-2 text-xs text-slate-100 backdrop-blur sm:px-4 sm:text-sm"
              >
                <Sparkles className="h-4 w-4 text-emerald-300" />
                SaaS de reservas con automatización e IA
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="mt-5 max-w-full text-[38px] font-semibold leading-[1.04] tracking-[-0.03em] sm:text-[52px] lg:text-[64px]"
              >
                Reservas, agenda y clientes
                <span className="block bg-gradient-to-r from-cyan-200 via-blue-200 to-emerald-200 bg-clip-text text-transparent">
                  en un solo SaaS
                </span>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.55 }}
                className="mt-4 max-w-[620px] text-base leading-7 text-slate-300 sm:text-lg"
              >
                Orbyx centraliza reservas online, staff, servicios, campañas y
                seguimiento. WhatsApp e IA son la ventaja extra para atender y
                convertir más clientes con menos trabajo manual.
              </motion.p>

              <div className="mt-6 flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
                <Link
                  href="/register"
                  className="inline-flex h-12 items-center justify-center rounded-xl bg-gradient-to-r from-emerald-400 via-emerald-500 to-emerald-600 px-6 text-sm font-semibold text-white shadow-[0_14px_34px_rgba(16,185,129,0.28)] transition hover:-translate-y-0.5 hover:shadow-[0_18px_38px_rgba(16,185,129,0.32)]"
                >
                  Probar gratis
                </Link>

                <Link
                  href="/planes"
                  className="inline-flex h-12 items-center justify-center rounded-xl border border-white/25 bg-white/10 px-6 text-sm font-semibold text-white transition hover:border-white/40 hover:bg-white/15"
                >
                  Ver planes
                </Link>
              </div>

              <div className="mt-6 grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
                {trustBadges.map((badge) => (
                  <span
                    key={badge}
                    className="rounded-full border border-white/10 bg-white/[0.07] px-3 py-2 text-center text-xs font-medium text-slate-200 backdrop-blur"
                  >
                    {badge}
                  </span>
                ))}
              </div>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.6 }}
              className="relative"
            >
              <div className="absolute -inset-4 rounded-[36px] bg-cyan-400/10 blur-3xl" />
              <div className="relative overflow-hidden rounded-[28px] border border-white/12 bg-white/[0.08] p-3 shadow-[0_30px_80px_rgba(0,0,0,0.28)] backdrop-blur-xl sm:rounded-[34px] sm:p-4">
                <div className="mb-3 flex items-center justify-between px-1 text-xs text-slate-300">
                  <span className="font-semibold text-white">Dashboard Orbyx</span>
                  <span className="rounded-full bg-emerald-400/15 px-2.5 py-1 text-emerald-200">
                    Reservas activas
                  </span>
                </div>
                <div className="overflow-hidden rounded-[22px] border border-white/10 bg-slate-950">
                  <Image
                    src="/images/mockup-dashboard.png"
                    alt="Dashboard de agenda y reservas de Orbyx"
                    width={980}
                    height={650}
                    className="h-auto w-full"
                    priority
                  />
                </div>
                <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
                  <div className="rounded-2xl border border-white/10 bg-white/[0.06] px-3 py-3">
                    <p className="font-semibold text-white">Agenda</p>
                    <p className="mt-1 text-slate-400">por staff</p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/[0.06] px-3 py-3">
                    <p className="font-semibold text-white">Reservas</p>
                    <p className="mt-1 text-slate-400">online</p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/[0.06] px-3 py-3">
                    <p className="font-semibold text-white">Campañas</p>
                    <p className="mt-1 text-slate-400">clientes</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      <section
        id="funcionalidades"
        className="relative overflow-hidden bg-[#050816] py-12 sm:py-16 lg:py-20"
      >
        <div className="absolute inset-x-0 top-0 h-24 bg-[linear-gradient(180deg,rgba(59,130,246,0.12)_0%,rgba(5,8,22,0)_100%)]" />

        <div className="relative mx-auto w-full max-w-[1200px] px-4 sm:px-6">
          <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-end">
            <div>
              <div className="inline-flex max-w-full items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs text-slate-200 backdrop-blur-md sm:px-4 sm:text-sm">
                <Bot className="h-4 w-4 text-emerald-300" />
                Plataforma completa para operar mejor
              </div>

              <h2 className="mt-4 text-3xl font-semibold tracking-[-0.03em] sm:text-4xl">
                No es solo un bot. Es tu sistema de reservas.
              </h2>
            </div>

            <p className="max-w-[680px] text-sm leading-7 text-slate-300 sm:text-base">
              Configura servicios, profesionales, horarios, reservas públicas,
              campañas y seguimiento desde un flujo diseñado para negocios que
              viven de su agenda.
            </p>
          </div>

          <div className="mt-8 grid gap-3 md:grid-cols-3 md:gap-4">
            {platformCards.map((card) => {
              const Icon = card.icon;

              return (
                <div
                  key={card.title}
                  className="rounded-[22px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.075)_0%,rgba(255,255,255,0.032)_100%)] p-4 shadow-[0_18px_44px_rgba(0,0,0,0.16)] backdrop-blur-xl sm:p-5"
                >
                  <div
                    className={`flex h-11 w-11 items-center justify-center rounded-2xl ring-1 ${card.tone}`}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="mt-4 text-lg font-semibold">{card.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-300">
                    {card.desc}
                  </p>
                </div>
              );
            })}
          </div>

          <div
            id="soluciones"
            className="mt-8 rounded-[24px] border border-white/10 bg-white/[0.045] p-4 backdrop-blur-xl sm:p-5"
          >
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-300/90">
                  Soluciones por rubro
                </p>
                <h3 className="mt-2 text-2xl font-semibold tracking-[-0.03em]">
                  Flexible para negocios con agenda, cupos y recurrencia.
                </h3>
              </div>

              <Link
                href="/planes"
                className="inline-flex h-11 items-center justify-center rounded-xl border border-white/20 bg-white/10 px-5 text-sm font-semibold text-white transition hover:border-white/35 hover:bg-white/15"
              >
                Ver planes
              </Link>
            </div>

            <div className="mt-5 grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
              {nicheCards.map((niche) => (
                <div
                  key={niche}
                  className="rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-3 text-sm font-semibold text-slate-100"
                >
                  {niche}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
