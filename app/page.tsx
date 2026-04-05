"use client";

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
} from "lucide-react";

export default function OrbyxLandingPage() {
  const heroChips = [
    "WhatsApp + automatización",
    "IA entrenada según tu negocio",
    "Prueba gratis por 7 días",
  ];

  const featureCards = [
    {
      icon: MessageCircleMore,
      title: "Atención por WhatsApp con más contexto",
      desc: "Orbyx ayuda a responder consultas, orientar clientes y llevar conversaciones hacia una reserva sin depender de que estés disponible todo el día.",
    },
    {
      icon: BellRing,
      title: "Recordatorios automáticos",
      desc: "Reduce ausencias con mensajes antes de cada cita y mantén a tus clientes informados sin escribir uno por uno.",
    },
    {
      icon: CalendarDays,
      title: "Agenda más ordenada",
      desc: "Centraliza reservas, horarios, servicios, staff y clientes en un solo lugar para trabajar con más claridad.",
    },
    {
      icon: Users,
      title: "Recuperación de clientes",
      desc: "Vuelve a contactar clientes inactivos con campañas y seguimiento para aumentar la recurrencia.",
    },
    {
      icon: Wand2,
      title: "Menos trabajo repetitivo",
      desc: "Tu equipo deja de perder tiempo respondiendo lo mismo, confirmando manualmente o revisando mensajes dispersos.",
    },
    {
      icon: Clock3,
      title: "Tu negocio sigue activo fuera de horario",
      desc: "Aunque estés atendiendo, ocupado o fuera del local, Orbyx puede seguir apoyando la atención y captando reservas.",
    },
  ];

  const aiHighlights = [
    {
      icon: BrainCircuit,
      title: "Entrenada según tu negocio",
      desc: "La IA se apoya en tus servicios, horarios, reglas y forma de atención para responder con más precisión.",
    },
    {
      icon: MessagesSquare,
      title: "Conversaciones más naturales",
      desc: "No depende solo de botones o respuestas rígidas. Puede sostener conversaciones más fluidas por WhatsApp.",
    },
    {
      icon: ShieldCheck,
      title: "Más útil que un bot genérico",
      desc: "Ayuda a responder dudas frecuentes, orientar al cliente y mover la conversación hacia una reserva.",
    },
  ];

  const veterinarianPoints = [
    "Consultas, controles, vacunas y peluquería en un solo flujo.",
    "Recordatorios automáticos para reducir ausencias.",
    "Seguimiento a clientes que no volvieron.",
    "Más orden para agenda, servicios, staff y clientes.",
    "Atención más profesional por WhatsApp.",
    "Menos carga operativa para recepción o mostrador.",
  ];

  const nicheCards = [
    {
      icon: Stethoscope,
      title: "Veterinarias y ecosistema mascota",
      desc: "Nuestro foco principal. Ideal para clínicas veterinarias, vacunatorios, peluquerías caninas y centros de exámenes.",
      badge: "Nicho principal",
    },
    {
      icon: Scissors,
      title: "Estética y barbería",
      desc: "Perfecto para uñas, pestañas, spa, peluquerías y barberías donde la agenda y el seguimiento son clave.",
      badge: "Expansión natural",
    },
    {
      icon: HeartHandshake,
      title: "Fitness y bienestar",
      desc: "Funciona muy bien para gimnasios, personal trainer, yoga, pilates y negocios con reservas recurrentes.",
      badge: "Tercer nicho",
    },
  ];

  const trialItems = [
    "Crea tu cuenta y pruébalo sin pagar.",
    "Explora agenda, servicios, staff y automatizaciones.",
    "Evalúa si encaja con tu negocio antes de contratar.",
  ];

  return (
    <main className="min-h-screen bg-[#f7f8fc] text-slate-900">
      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(37,99,235,0.14),transparent_28%),radial-gradient(circle_at_84%_18%,rgba(14,165,233,0.10),transparent_24%),linear-gradient(180deg,#f8fbff_0%,#f7f8fc_52%,#ffffff_100%)]" />
        <div className="relative mx-auto max-w-[1600px] px-6 pb-20 pt-16 lg:px-10 lg:pb-24 lg:pt-20">
          <div className="grid items-center gap-14 lg:grid-cols-[minmax(0,1.08fr)_430px]">
            <div className="max-w-4xl">
              <motion.div
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-white/90 px-4 py-2 text-sm font-medium text-blue-700 shadow-sm backdrop-blur"
              >
                <Sparkles className="h-4 w-4" />
                Automatiza reservas, atención y seguimiento por WhatsApp
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 22 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.55 }}
                className="mt-8 text-5xl font-semibold leading-tight sm:text-6xl xl:text-7xl"
              >
                Tu negocio responde por WhatsApp,
                <br />
                agenda y hace seguimiento
                <br />
                <span className="text-blue-600">
                  con una IA entrenada según tu negocio
                </span>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.62 }}
                className="mt-8 max-w-3xl text-lg leading-8 text-slate-700 sm:text-[22px]"
              >
                Orbyx está diseñado especialmente para veterinarias, y también funciona
                muy bien para estética, barberías y centros de bienestar. Centraliza
                reservas, reduce ausencias y mejora la atención con automatización real.
              </motion.p>

              <div className="mt-8 flex flex-wrap gap-3">
                {heroChips.map((chip) => (
                  <span
                    key={chip}
                    className="rounded-full border border-slate-200 bg-white/90 px-4 py-2 text-sm text-slate-700 shadow-sm"
                  >
                    {chip}
                  </span>
                ))}
              </div>

              <div className="mt-10 flex flex-wrap items-center gap-4">
                <Link
                  href="/planes"
                  className="inline-flex items-center justify-center rounded-2xl bg-blue-600 px-7 py-4 text-base font-semibold text-white shadow-[0_16px_40px_rgba(37,99,235,0.22)] transition hover:-translate-y-0.5 hover:bg-blue-700"
                >
                  Ver planes
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>

                <Link
                  href="/register"
                  className="inline-flex items-center justify-center rounded-2xl border border-slate-300 bg-white px-7 py-4 text-base font-semibold text-slate-800 transition hover:-translate-y-0.5 hover:border-slate-400 hover:bg-slate-50"
                >
                  Probar gratis 7 días
                </Link>
              </div>

              <p className="mt-4 text-sm text-slate-500">
                Foco principal en veterinarias. También útil para estética, barbería y fitness.
              </p>
            </div>

            <motion.div
              initial={{ opacity: 0, x: 18, y: 18 }}
              animate={{ opacity: 1, x: 0, y: 0 }}
              transition={{ duration: 0.65 }}
              className="relative"
            >
              <div className="rounded-[32px] border border-blue-100 bg-white/95 p-7 shadow-[0_25px_80px_rgba(15,23,42,0.10)] backdrop-blur">
                <div className="inline-flex rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                  Prueba gratis
                </div>

                <h3 className="mt-4 text-2xl font-semibold text-slate-900">
                  Empieza con 7 días gratis
                </h3>

                <p className="mt-3 text-sm leading-6 text-slate-600">
                  Crea tu cuenta, explora la plataforma y revisa si encaja con tu negocio
                  antes de contratar un plan.
                </p>

                <div className="mt-6 space-y-3">
                  {trialItems.map((item) => (
                    <div key={item} className="flex items-start gap-3 rounded-2xl bg-slate-50 px-4 py-3">
                      <CheckCircle2 className="mt-0.5 h-5 w-5 text-green-600" />
                      <span className="text-sm text-slate-700">{item}</span>
                    </div>
                  ))}
                </div>

                <Link
                  href="/register"
                  className="mt-6 inline-flex w-full items-center justify-center rounded-2xl bg-slate-900 px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-slate-800"
                >
                  Crear cuenta
                </Link>

                <p className="mt-3 text-center text-xs text-slate-500">
                  Sin compromiso para comenzar.
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* IA DIFERENCIADORA */}
      <section className="py-20">
        <div className="mx-auto max-w-[1300px] px-6">
          <div className="rounded-[34px] border border-slate-200 bg-white p-8 shadow-[0_18px_60px_rgba(15,23,42,0.06)] lg:p-10">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700">
                <BrainCircuit className="h-4 w-4" />
                Diferenciación real
              </div>

              <h2 className="mt-5 text-3xl font-semibold leading-tight sm:text-4xl">
                No son respuestas automáticas fijas.
                <br />
                <span className="text-blue-600">
                  Es una IA entrenada para tu negocio.
                </span>
              </h2>

              <p className="mt-5 max-w-3xl text-base leading-7 text-slate-600 sm:text-lg">
                Orbyx no depende solo de botones o flujos rígidos. La IA puede apoyarse
                en el contexto de tu negocio para responder con más precisión, sostener
                conversaciones más naturales y ayudar a convertir consultas en reservas.
              </p>
            </div>

            <div className="mt-10 grid gap-6 md:grid-cols-3">
              {aiHighlights.map((item) => {
                const Icon = item.icon;
                return (
                  <div
                    key={item.title}
                    className="rounded-[26px] border border-slate-200 bg-slate-50 p-6"
                  >
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white shadow-sm">
                      <Icon className="h-5 w-5 text-blue-600" />
                    </div>
                    <h3 className="mt-4 text-lg font-semibold text-slate-900">
                      {item.title}
                    </h3>
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      {item.desc}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* BENEFICIOS */}
      <section className="py-20">
        <div className="mx-auto max-w-[1300px] px-6">
          <div className="max-w-3xl">
            <div className="inline-flex rounded-full bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700">
              Lo que te ayuda a resolver
            </div>
            <h2 className="mt-5 text-3xl font-semibold sm:text-4xl">
              Más que una agenda
            </h2>
            <p className="mt-4 text-base leading-7 text-slate-600 sm:text-lg">
              Orbyx combina reservas, seguimiento, automatización y atención por WhatsApp
              para que tu negocio funcione con más orden y menos carga operativa.
            </p>
          </div>

          <div className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {featureCards.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.title}
                  className="rounded-[28px] border border-slate-200 bg-white p-7 shadow-[0_10px_30px_rgba(15,23,42,0.04)] transition hover:-translate-y-1"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50">
                    <Icon className="h-5 w-5 text-blue-600" />
                  </div>
                  <h3 className="mt-5 text-xl font-semibold text-slate-900">
                    {item.title}
                  </h3>
                  <p className="mt-3 text-sm leading-7 text-slate-600">
                    {item.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* FOCO VETERINARIO SIN CERRAR */}
      <section className="py-20">
        <div className="mx-auto max-w-[1300px] px-6">
          <div className="grid items-center gap-10 lg:grid-cols-[1.05fr_0.95fr]">
            <div>
              <div className="inline-flex rounded-full bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700">
                Foco principal
              </div>
              <h2 className="mt-5 text-3xl font-semibold leading-tight sm:text-4xl">
                Diseñado especialmente para veterinarias
                <br />
                <span className="text-slate-500">sin dejar fuera otros nichos</span>
              </h2>
              <p className="mt-5 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">
                Lideramos con veterinarias porque es donde Orbyx puede generar más valor:
                atención por WhatsApp, agenda más ordenada, seguimiento y una operación
                más profesional. Después, abrimos naturalmente hacia estética, barbería y bienestar.
              </p>

              <div className="mt-8 space-y-4">
                {veterinarianPoints.map((item) => (
                  <div
                    key={item}
                    className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3"
                  >
                    <CheckCircle2 className="mt-0.5 h-5 w-5 text-green-600" />
                    <span className="text-sm leading-6 text-slate-700">{item}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[32px] border border-slate-200 bg-white p-7 shadow-[0_18px_50px_rgba(15,23,42,0.06)]">
              <div className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                Cómo posicionamos Orbyx
              </div>

              <h3 className="mt-4 text-2xl font-semibold text-slate-900">
                Un software que se siente específico,
                <br />
                no genérico
              </h3>

              <div className="mt-6 space-y-4">
                <div className="rounded-2xl border border-blue-100 bg-blue-50/60 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-700">
                    Mensaje principal
                  </p>
                  <p className="mt-2 text-sm leading-6 text-slate-700">
                    “Tu negocio responde por WhatsApp, agenda y hace seguimiento automáticamente.”
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-600">
                    Nicho líder
                  </p>
                  <p className="mt-2 text-sm leading-6 text-slate-700">
                    Veterinarias y ecosistema mascota.
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-600">
                    Extensión natural
                  </p>
                  <p className="mt-2 text-sm leading-6 text-slate-700">
                    Estética, barbería, fitness y bienestar.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* NICHOS */}
      <section className="py-20">
        <div className="mx-auto max-w-[1300px] px-6">
          <div className="max-w-3xl">
            <div className="inline-flex rounded-full bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700">
              Nichos priorizados
            </div>
            <h2 className="mt-5 text-3xl font-semibold sm:text-4xl">
              Un foco claro, con espacio para crecer
            </h2>
            <p className="mt-4 text-base leading-7 text-slate-600 sm:text-lg">
              Orbyx no quiere ser “para todo”. Queremos posicionarlo con fuerza donde
              más valor entrega primero, y luego expandirlo a otros rubros que comparten
              la misma necesidad de atención, reservas y seguimiento.
            </p>
          </div>

          <div className="mt-10 grid gap-6 lg:grid-cols-3">
            {nicheCards.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.title}
                  className="rounded-[28px] border border-slate-200 bg-white p-7 shadow-[0_10px_30px_rgba(15,23,42,0.04)]"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50">
                      <Icon className="h-5 w-5 text-blue-600" />
                    </div>
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                      {item.badge}
                    </span>
                  </div>

                  <h3 className="mt-5 text-xl font-semibold text-slate-900">
                    {item.title}
                  </h3>
                  <p className="mt-3 text-sm leading-7 text-slate-600">
                    {item.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="pb-24 pt-10">
        <div className="mx-auto max-w-[1300px] px-6">
          <div className="rounded-[36px] border border-slate-200 bg-slate-900 px-8 py-10 text-white shadow-[0_28px_80px_rgba(15,23,42,0.22)] lg:px-12 lg:py-14">
            <div className="max-w-3xl">
              <div className="inline-flex rounded-full bg-white/10 px-4 py-2 text-sm font-medium text-white/90">
                Empieza cuando quieras
              </div>

              <h2 className="mt-5 text-3xl font-semibold leading-tight sm:text-4xl">
                Prueba Orbyx gratis por 7 días
                <br />
                y descubre si encaja con tu negocio
              </h2>

              <p className="mt-5 max-w-2xl text-base leading-7 text-white/75 sm:text-lg">
                Crea tu cuenta, revisa cómo funciona la agenda, explora el panel y conoce
                cómo la automatización por WhatsApp puede ayudarte a trabajar con más orden.
              </p>
            </div>

            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Link
                href="/register"
                className="inline-flex items-center justify-center rounded-2xl bg-white px-7 py-4 text-base font-semibold text-slate-900 transition hover:-translate-y-0.5"
              >
                Crear cuenta gratis
              </Link>

              <Link
                href="/planes"
                className="inline-flex items-center justify-center rounded-2xl border border-white/20 bg-white/5 px-7 py-4 text-base font-semibold text-white transition hover:bg-white/10"
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