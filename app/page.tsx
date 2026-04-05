"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight,
  BellRing,
  CalendarDays,
  CheckCircle2,
  Clock3,
  MessageCircleMore,
  Rocket,
  Sparkles,
  Star,
  Users,
  Wand2,
} from "lucide-react";

export default function OrbyxLandingPage() {
  const heroChips = [
    "IA que responde por WhatsApp",
    "Menos trabajo manual",
    "Más reservas y seguimiento",
  ];

  const businessTypes = [
    "Barbería",
    "Peluquería",
    "Centro de estética",
    "Clínica",
    "Spa",
    "Otro",
  ];

  const teamSizes = ["1", "2-3", "4-10", "10+"];

  const featureCards = [
    {
      icon: MessageCircleMore,
      title: "Atención por WhatsApp con IA",
      desc: "Aunque no tengas tiempo de responder, Orbyx atiende consultas, propone horarios y deriva a reserva.",
    },
    {
      icon: CalendarDays,
      title: "Agenda más activa",
      desc: "Tus horarios disponibles se mueven mejor con recordatorios, seguimiento y recuperación de clientes.",
    },
    {
      icon: BellRing,
      title: "Recordatorios automáticos",
      desc: "Reduce ausencias con mensajes automáticos antes de cada cita, sin tener que escribir manualmente.",
    },
    {
      icon: Users,
      title: "Clientes e historial",
      desc: "Centraliza la información de tus clientes para atender mejor y tomar decisiones con más contexto.",
    },
    {
      icon: Sparkles,
      title: "Recuperación de inactivos",
      desc: "Detecta clientes que dejaron de venir y vuelve a activarlos con campañas y seguimiento.",
    },
    {
      icon: Rocket,
      title: "Menos coordinación manual",
      desc: "Tu equipo deja de perder tiempo respondiendo lo mismo todos los días por chat o llamadas.",
    },
  ];

  const whyCards = [
    {
      icon: Clock3,
      title: "Responde incluso cuando estás ocupado",
      desc: "Si estás atendiendo, en traslado o fuera del horario, la IA puede seguir respondiendo consultas frecuentes.",
    },
    {
      icon: Wand2,
      title: "Convierte conversaciones en reservas",
      desc: "No solo responde: también orienta al cliente para que avance hacia una cita o una acción concreta.",
    },
    {
      icon: BellRing,
      title: "Mantiene el contacto sin perseguir clientes",
      desc: "Recordatorios, seguimiento y reactivación ayudan a que tu agenda no dependa de escribir uno por uno.",
    },
  ];

  const includedCards = [
    "Confirmaciones automáticas",
    "Recordatorios por WhatsApp",
    "Recuperación de clientes",
    "Agenda clara y ordenada",
    "Clientes e historial",
    "Campañas y seguimiento",
  ];

  const steps = [
    {
      step: "01",
      title: "Configura tu negocio",
      desc: "Carga tus servicios, horarios y profesionales en minutos.",
    },
    {
      step: "02",
      title: "Activa tu atención",
      desc: "Empieza a centralizar reservas y comunicación desde un solo lugar.",
    },
    {
      step: "03",
      title: "Deja que Orbyx responda",
      desc: "La IA atiende consultas por WhatsApp y guía al cliente cuando tú no alcanzas.",
    },
    {
      step: "04",
      title: "Haz crecer tu agenda",
      desc: "Usa recordatorios, seguimiento y campañas para mover mejor tu negocio.",
    },
  ];

  return (
    <main className="min-h-screen bg-[#f7f8fc] text-slate-900">
      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_12%_18%,rgba(59,130,246,0.10),transparent_26%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_88%_10%,rgba(139,92,246,0.08),transparent_22%)]" />
        <div className="absolute inset-x-0 top-0 h-[520px] bg-[linear-gradient(180deg,rgba(255,255,255,0.88)_0%,rgba(247,248,252,0.84)_60%,rgba(247,248,252,0)_100%)]" />

        <div className="relative mx-auto max-w-[1600px] px-6 pb-20 pt-16 lg:px-10 lg:pb-24 lg:pt-20">
          <div className="grid items-center gap-14 lg:grid-cols-[minmax(0,1.08fr)_540px]">
            <div className="max-w-4xl">
              <div className="flex flex-wrap items-center gap-3">
                <img
                  src="/orbyx-logo-dark.png"
                  alt="Orbyx"
                  className="h-11 w-auto rounded-xl bg-white p-1.5 shadow-sm"
                />
                <span className="rounded-full border border-blue-200 bg-white px-4 py-2 text-sm text-blue-700 shadow-sm">
                  IA para WhatsApp + automatización de reservas
                </span>
              </div>

              <motion.h1
                initial={{ opacity: 0, y: 22 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.55 }}
                className="mt-8 max-w-4xl text-5xl font-semibold leading-[1.02] tracking-[-0.045em] text-slate-950 sm:text-6xl xl:text-7xl"
              >
                Tu negocio puede
                <br />
                responder por WhatsApp
                <br />
                <span className="bg-gradient-to-r from-sky-500 to-blue-700 bg-clip-text text-transparent">
                  incluso cuando tú
                </span>
                <br />
                <span className="bg-gradient-to-r from-sky-500 to-blue-700 bg-clip-text text-transparent">
                  no alcanzas a hacerlo
                </span>
              </motion.h1>

              <p className="mt-8 max-w-3xl text-lg leading-9 text-slate-700 sm:text-[22px] sm:leading-10">
                Orbyx ayuda a tu negocio a atender consultas, proponer horarios
                y mantener la agenda activa con automatización inteligente.
                <br />
                <br />
                Mientras tú trabajas, atiendes o simplemente no tienes tiempo,
                la IA puede seguir respondiendo por WhatsApp y guiando al cliente
                hacia una reserva.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                {heroChips.map((chip, index) => (
                  <motion.span
                    key={chip}
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.08 }}
                    className={
                      index === 0
                        ? "rounded-full bg-gradient-to-r from-sky-500 to-blue-600 px-5 py-3 text-sm font-medium text-white shadow-[0_12px_28px_rgba(59,130,246,0.22)]"
                        : "rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-medium text-slate-700 shadow-sm"
                    }
                  >
                    {chip}
                  </motion.span>
                ))}
              </div>

              <div className="mt-10 flex flex-wrap items-center gap-5">
                <Link
                  href="/planes"
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-sky-500 to-blue-600 px-8 py-4 text-base font-semibold text-white shadow-[0_16px_36px_rgba(59,130,246,0.24)] transition hover:scale-[1.02]"
                >
                  Ver planes
                  <ArrowRight className="h-4 w-4" />
                </Link>

                <div className="rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
                  <div className="flex text-amber-400">
                    <Star className="h-4 w-4 fill-current" />
                    <Star className="h-4 w-4 fill-current" />
                    <Star className="h-4 w-4 fill-current" />
                    <Star className="h-4 w-4 fill-current" />
                    <Star className="h-4 w-4 fill-current" />
                  </div>
                  <p className="mt-1 text-sm text-slate-600">
                    +8.000 negocios nos prefieren
                  </p>
                </div>
              </div>

              <p className="mt-4 text-sm text-slate-500">
                Empieza hoy y ordena reservas, seguimiento y comunicación desde
                un solo lugar.
              </p>
            </div>

            {/* FORM */}
            <div className="lg:justify-self-end">
              <div className="w-full rounded-[34px] border border-white bg-white p-8 shadow-[0_30px_80px_rgba(15,23,42,0.12)] lg:w-[540px]">
                <div className="inline-flex rounded-full bg-sky-50 px-4 py-2 text-sm font-medium text-sky-700">
                  Prueba gratis 7 días
                </div>

                <h2 className="mt-5 text-4xl font-semibold tracking-[-0.03em] text-slate-950">
                  Empieza en minutos
                </h2>

                <p className="mt-3 text-base leading-7 text-slate-600">
                  Configura tu agenda, organiza tu negocio y empieza a atender
                  mejor por WhatsApp.
                </p>

                <form className="mt-6 space-y-3">
                  <select className="h-14 w-full rounded-2xl border border-slate-200 bg-white px-4 text-base text-slate-700 outline-none transition focus:border-sky-400">
                    <option>¿Qué tipo de negocio tienes?</option>
                    {businessTypes.map((item) => (
                      <option key={item}>{item}</option>
                    ))}
                  </select>

                  <select className="h-14 w-full rounded-2xl border border-slate-200 bg-white px-4 text-base text-slate-700 outline-none transition focus:border-sky-400">
                    <option>¿Cuántos profesionales?</option>
                    {teamSizes.map((item) => (
                      <option key={item}>{item}</option>
                    ))}
                  </select>

                  <input
                    placeholder="Nombre completo"
                    className="h-14 w-full rounded-2xl border border-slate-200 bg-white px-4 text-base text-slate-700 placeholder:text-slate-400 outline-none transition focus:border-sky-400"
                  />
                  <input
                    placeholder="Correo electrónico"
                    className="h-14 w-full rounded-2xl border border-slate-200 bg-white px-4 text-base text-slate-700 placeholder:text-slate-400 outline-none transition focus:border-sky-400"
                  />
                  <input
                    placeholder="Teléfono"
                    className="h-14 w-full rounded-2xl border border-slate-200 bg-white px-4 text-base text-slate-700 placeholder:text-slate-400 outline-none transition focus:border-sky-400"
                  />

                  <button className="mt-2 h-14 w-full rounded-2xl bg-gradient-to-r from-sky-500 to-blue-600 text-lg font-semibold text-white shadow-[0_16px_36px_rgba(59,130,246,0.22)] transition hover:scale-[1.01]">
                    Crear mi agenda →
                  </button>
                </form>

                <div className="mt-6 rounded-[24px] border border-sky-100 bg-sky-50/70 p-5">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-full bg-white text-sky-600 shadow-sm">
                      <MessageCircleMore className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-800">
                        Tu negocio no se queda en silencio
                      </p>
                      <p className="mt-1 text-sm leading-6 text-slate-600">
                        Aunque estés atendiendo, la IA puede seguir respondiendo
                        consultas frecuentes por WhatsApp y orientar al cliente.
                      </p>
                    </div>
                  </div>
                </div>

                <p className="mt-5 text-center text-sm leading-6 text-slate-500">
                  Empieza gratis. Luego del periodo de prueba puedes pasarte a
                  un plan de pago.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* BENEFICIOS PRINCIPALES */}
      <section className="relative py-24">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(59,130,246,0.05),transparent_30%)]" />

        <div className="relative mx-auto max-w-[1600px] px-6 lg:px-10">
          <div className="mx-auto max-w-3xl text-center">
            <div className="inline-flex rounded-full border border-sky-200 bg-white px-4 py-2 text-sm font-medium text-sky-700 shadow-sm">
              Qué hace Orbyx por tu negocio
            </div>

            <h2 className="mt-6 text-4xl font-semibold tracking-[-0.03em] text-slate-950 sm:text-5xl">
              Más que una agenda:
              <br />
              atención, seguimiento y movimiento real
            </h2>

            <p className="mx-auto mt-6 max-w-3xl text-xl leading-9 text-slate-600">
              Orbyx no solo ordena citas. También ayuda a responder mejor,
              mantener contacto con tus clientes y convertir conversaciones en
              oportunidades reales para tu negocio.
            </p>
          </div>

          <div className="mt-14 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {featureCards.map((item) => {
              const Icon = item.icon;

              return (
                <div
                  key={item.title}
                  className="rounded-[28px] border border-slate-200 bg-white p-7 shadow-[0_14px_40px_rgba(15,23,42,0.06)]"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-50 text-sky-600">
                    <Icon className="h-6 w-6" />
                  </div>

                  <h3 className="mt-5 text-2xl font-semibold tracking-[-0.02em] text-slate-900">
                    {item.title}
                  </h3>

                  <p className="mt-4 text-base leading-8 text-slate-600">
                    {item.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* MENSAJE CENTRAL */}
      <section className="py-8">
        <div className="mx-auto max-w-[1600px] px-6 lg:px-10">
          <div className="rounded-[36px] border border-sky-100 bg-gradient-to-r from-sky-50 via-white to-blue-50 p-8 shadow-[0_18px_44px_rgba(15,23,42,0.05)] lg:p-12">
            <div className="grid items-center gap-8 lg:grid-cols-[1.2fr_0.8fr]">
              <div>
                <div className="inline-flex rounded-full border border-sky-200 bg-white px-4 py-2 text-sm font-medium text-sky-700">
                  Tu diferencial
                </div>

                <h2 className="mt-5 text-3xl font-semibold tracking-[-0.03em] text-slate-950 sm:text-4xl">
                  Si no alcanzas a responder, Orbyx puede seguir atendiendo por
                  WhatsApp con inteligencia artificial
                </h2>

                <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-600">
                  Eso significa menos mensajes perdidos, menos tiempo explicando
                  lo mismo y más continuidad en la atención del cliente.
                  Mientras tú trabajas, Orbyx ayuda a que la conversación no se
                  corte.
                </p>
              </div>

              <div className="rounded-[28px] border border-white bg-white p-6 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-emerald-100">
                    <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-base font-semibold text-slate-900">
                      Atención más constante
                    </p>
                    <p className="text-sm text-slate-500">
                      Incluso cuando estás ocupado
                    </p>
                  </div>
                </div>

                <div className="mt-5 space-y-3">
                  {[
                    "Responde consultas frecuentes",
                    "Ayuda a proponer horarios",
                    "Deriva al cliente hacia la reserva",
                    "Mantiene seguimiento sin hacerlo manual",
                  ].map((line) => (
                    <div
                      key={line}
                      className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700"
                    >
                      {line}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* POR QUÉ IMPORTA */}
      <section className="py-24">
        <div className="mx-auto max-w-[1600px] px-6 lg:px-10">
          <div className="mx-auto max-w-3xl text-center">
            <div className="inline-flex rounded-full border border-sky-200 bg-white px-4 py-2 text-sm font-medium text-sky-700 shadow-sm">
              Por qué esto importa
            </div>

            <h2 className="mt-6 text-4xl font-semibold tracking-[-0.03em] text-slate-950 sm:text-5xl">
              Tu negocio puede verse más ordenado,
              <br />
              más rápido y más presente
            </h2>
          </div>

          <div className="mt-14 grid gap-6 lg:grid-cols-3">
            {whyCards.map((item) => {
              const Icon = item.icon;

              return (
                <div
                  key={item.title}
                  className="rounded-[28px] border border-slate-200 bg-white p-7 shadow-[0_14px_40px_rgba(15,23,42,0.05)]"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-50 text-violet-600">
                    <Icon className="h-6 w-6" />
                  </div>

                  <h3 className="mt-5 text-2xl font-semibold tracking-[-0.02em] text-slate-900">
                    {item.title}
                  </h3>

                  <p className="mt-4 text-base leading-8 text-slate-600">
                    {item.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* INCLUIDO */}
      <section className="py-8">
        <div className="mx-auto max-w-[1600px] px-6 lg:px-10">
          <div className="rounded-[36px] border border-slate-200 bg-white p-8 shadow-[0_18px_44px_rgba(15,23,42,0.05)] lg:p-12">
            <div className="mx-auto max-w-3xl text-center">
              <div className="inline-flex rounded-full border border-blue-200 bg-sky-50 px-4 py-2 text-sm font-medium text-sky-700">
                Lo que puedes ordenar con Orbyx
              </div>

              <h2 className="mt-6 text-4xl font-semibold tracking-[-0.03em] text-slate-950 sm:text-5xl">
                Menos caos operativo.
                <br />
                Más control de tu negocio.
              </h2>

              <p className="mt-6 text-xl leading-9 text-slate-600">
                Diseñado para negocios que quieren verse más profesionales y
                dejar de depender del desorden por WhatsApp.
              </p>
            </div>

            <div className="mt-12 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {includedCards.map((item) => (
                <div
                  key={item}
                  className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 text-base font-medium text-slate-700"
                >
                  <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* PASOS */}
      <section className="py-24">
        <div className="mx-auto max-w-[1600px] px-6 lg:px-10">
          <div className="mx-auto max-w-3xl text-center">
            <div className="inline-flex rounded-full border border-sky-200 bg-white px-4 py-2 text-sm font-medium text-sky-700 shadow-sm">
              Cómo empezar
            </div>

            <h2 className="mt-6 text-4xl font-semibold tracking-[-0.03em] text-slate-950 sm:text-5xl">
              Empieza simple.
              <br />
              Escala después.
            </h2>
          </div>

          <div className="mt-14 grid gap-6 lg:grid-cols-4">
            {steps.map((item) => (
              <div
                key={item.step}
                className="rounded-[28px] border border-slate-200 bg-white p-7 shadow-[0_14px_40px_rgba(15,23,42,0.05)]"
              >
                <div className="text-sm font-semibold tracking-[0.18em] text-sky-600">
                  {item.step}
                </div>

                <h3 className="mt-4 text-2xl font-semibold tracking-[-0.02em] text-slate-900">
                  {item.title}
                </h3>

                <p className="mt-4 text-base leading-8 text-slate-600">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="pb-24 pt-8">
        <div className="mx-auto max-w-[1600px] px-6 lg:px-10">
          <div className="rounded-[40px] bg-gradient-to-r from-sky-500 to-blue-600 p-10 text-white shadow-[0_26px_70px_rgba(59,130,246,0.26)] lg:p-14">
            <div className="mx-auto max-w-4xl text-center">
              <h2 className="text-4xl font-semibold tracking-[-0.03em] sm:text-5xl">
                Haz que tu negocio responda mejor,
                <br />
                reserve mejor y se vea más profesional
              </h2>

              <p className="mx-auto mt-6 max-w-3xl text-lg leading-8 text-blue-50">
                Si hoy pierdes tiempo respondiendo mensajes, coordinando horarios
                o haciendo seguimiento manual, Orbyx puede ayudarte a ordenar
                todo eso en un solo lugar.
              </p>

              <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
                <Link
                  href="/planes"
                  className="inline-flex items-center justify-center rounded-2xl bg-white px-8 py-4 text-base font-semibold text-blue-700 shadow-sm transition hover:scale-[1.02]"
                >
                  Ver planes
                </Link>

                <div className="rounded-2xl border border-white/20 bg-white/10 px-6 py-4 text-sm text-white/90">
                  Prueba gratis por 7 días
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}