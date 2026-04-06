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

  const featureCards = [
    {
      icon: MessageCircleMore,
      title: "Responde clientes sin estar pegado al teléfono",
      desc: "Orbyx ayuda a responder consultas por WhatsApp, orientar a tus clientes y mover la conversación hacia una reserva sin depender de que tú estés disponible todo el día.",
    },
    {
      icon: BellRing,
      title: "Reduce inasistencias automáticamente",
      desc: "Envía recordatorios y confirmaciones antes de cada cita para disminuir horas perdidas y mantener una agenda mucho más ordenada.",
    },
    {
      icon: CalendarDays,
      title: "Agenda, servicios y equipo en un solo lugar",
      desc: "Centraliza reservas, horarios, servicios, staff y clientes para trabajar con más claridad y menos desorden operativo.",
    },
    {
      icon: Users,
      title: "Recupera clientes que no han vuelto",
      desc: "Activa campañas y seguimiento para volver a contactar clientes inactivos y mejorar la recurrencia de tu negocio.",
    },
    {
      icon: Wand2,
      title: "Menos trabajo repetitivo",
      desc: "Tu equipo deja de perder tiempo respondiendo lo mismo, confirmando manualmente o revisando mensajes dispersos en distintos canales.",
    },
    {
      icon: Clock3,
      title: "Tu negocio sigue funcionando incluso cuando estás ocupado",
      desc: "Mientras atiendes, estás fuera del local o simplemente no alcanzas a responder, Orbyx puede seguir apoyando la atención y captando reservas.",
    },
  ];

  const aiHighlights = [
    {
      icon: BrainCircuit,
      title: "IA entrenada según tu negocio",
      desc: "Puede apoyarse en tus servicios, horarios, reglas y forma de atención para responder con más contexto y precisión.",
    },
    {
      icon: MessagesSquare,
      title: "Conversaciones más naturales",
      desc: "No depende solo de respuestas rígidas o botones. Ayuda a sostener conversaciones más fluidas por WhatsApp.",
    },
    {
      icon: ShieldCheck,
      title: "Más útil que un bot genérico",
      desc: "Ayuda a aclarar dudas frecuentes, orientar al cliente y mover la conversación hacia una reserva real.",
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
      desc: "Funciona muy bien para gimnasios, personal trainer, yoga, pilates y negocios con reservas recurrentes o por cupos.",
      badge: "Tercer nicho",
    },
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
          <Image
            src="/images/bg-orbyx-hero.png"
            alt="Fondo hero Orbyx"
            fill
            priority
            className="object-cover object-center"
          />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(5,10,28,0.86)_0%,rgba(7,13,33,0.78)_30%,rgba(10,16,38,0.38)_60%,rgba(10,16,38,0.18)_100%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_18%,rgba(59,130,246,0.16),transparent_22%),radial-gradient(circle_at_80%_14%,rgba(168,85,247,0.18),transparent_26%)]" />
        </div>

        <div className="relative mx-auto max-w-[1700px] px-6 pb-24 pt-16 lg:px-10 lg:pb-32 lg:pt-20">
          <div className="grid items-center gap-14 lg:grid-cols-[minmax(0,0.92fr)_minmax(760px,980px)] xl:gap-4">
            <div className="max-w-4xl">
              <motion.div
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/8 px-4 py-2 text-sm font-medium text-blue-100 shadow-[0_10px_30px_rgba(0,0,0,0.18)] backdrop-blur-md"
              >
                <Sparkles className="h-4 w-4" />
                Automatiza reservas, atención y seguimiento por WhatsApp
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 22 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.55 }}
                className="mt-8 text-5xl font-semibold leading-[1.02] text-white sm:text-6xl xl:text-7xl"
              >
                Orbyx trabaja por ti:
                <br />
                responde, agenda y recupera
                <br />
                clientes automáticamente
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.62 }}
                className="mt-8 max-w-3xl text-lg leading-8 text-slate-200 sm:text-[22px]"
              >
                Deja de perder clientes por no responder a tiempo o por
                inasistencias. Orbyx automatiza la atención por WhatsApp,
                ordena tu agenda y te ayuda a mantener clientes activos.
              </motion.p>

              <div className="mt-8 flex flex-wrap gap-3">
                {heroChips.map((chip) => (
                  <span
                    key={chip}
                    className="rounded-full border border-white/10 bg-white/8 px-4 py-2 text-sm text-slate-100 shadow-[0_10px_24px_rgba(0,0,0,0.18)] backdrop-blur-md"
                  >
                    {chip}
                  </span>
                ))}
              </div>

              <div className="mt-10 flex flex-wrap items-center gap-4">
                <Link
                  href="/register"
                  className="inline-flex items-center justify-center rounded-2xl bg-emerald-500 px-7 py-4 text-base font-semibold text-white shadow-[0_18px_50px_rgba(16,185,129,0.28)] transition hover:-translate-y-0.5 hover:bg-emerald-400"
                >
                  Probar gratis 7 días
                </Link>

                <Link
                  href="/planes"
                  className="inline-flex items-center justify-center rounded-2xl border border-white/14 bg-white/8 px-7 py-4 text-base font-semibold text-white transition hover:-translate-y-0.5 hover:bg-white/12"
                >
                  Ver planes
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </div>

              <p className="mt-4 text-sm text-slate-300">
                Foco principal en veterinarias. También útil para estética,
                barbería y negocios por cupos.
              </p>
            </div>

            <motion.div
  initial={{ opacity: 0, x: 18, y: 18 }}
  animate={{ opacity: 1, x: 0, y: 0 }}
  transition={{ duration: 0.7 }}
  className="relative mx-auto hidden w-full max-w-[980px] lg:block"
>
  <div className="relative min-h-[760px]">
    <motion.div
      initial={{ opacity: 0, y: 16, rotate: -4 }}
      animate={{ opacity: 1, y: 0, rotate: -4 }}
      transition={{ duration: 0.75, delay: 0.1 }}
      className="absolute right-8 top-[70px] z-20 w-[860px] xl:right-0 xl:top-[52px] xl:w-[940px]"
    >
      <Image
        src="/images/mockup-dashboard.png"
        alt="Mockup dashboard Orbyx"
        width={1600}
        height={1100}
        className="h-auto w-full drop-shadow-[0_50px_120px_rgba(0,0,0,0.48)]"
        priority
      />
    </motion.div>

    <motion.div
      animate={{ y: [0, -8, 0] }}
      transition={{ duration: 4.2, repeat: Infinity, ease: "easeInOut" }}
      className="absolute right-2 top-[150px] z-30 w-[300px] xl:right-6 xl:top-[135px] xl:w-[330px]"
    >
      <Image
        src="/images/chat-question.png"
        alt="Pregunta por WhatsApp"
        width={1200}
        height={300}
        className="h-auto w-full drop-shadow-[0_18px_36px_rgba(0,0,0,0.30)]"
      />
    </motion.div>

    <motion.div
      animate={{ y: [0, 10, 0] }}
      transition={{ duration: 4.8, repeat: Infinity, ease: "easeInOut", delay: 0.4 }}
      className="absolute left-[10px] top-[300px] z-30 w-[370px] xl:left-[40px] xl:top-[315px] xl:w-[430px]"
    >
      <Image
        src="/images/chat-response.png"
        alt="Respuesta por WhatsApp"
        width={1400}
        height={320}
        className="h-auto w-full drop-shadow-[0_18px_36px_rgba(0,0,0,0.30)]"
      />
    </motion.div>

    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, delay: 0.2 }}
      className="absolute bottom-[10px] right-[10px] z-10 w-[340px] xl:bottom-[0px] xl:right-[18px] xl:w-[400px]"
    >
      <Image
        src="/images/persona-relajada.png"
        alt="Persona relajada usando Orbyx"
        width={1100}
        height={900}
        className="h-auto w-full drop-shadow-[0_28px_70px_rgba(0,0,0,0.38)]"
      />
    </motion.div>
  </div>
</motion.div>
          </div>

          {/* HERO MOBILE VISUAL */}
          <div className="relative mt-14 lg:hidden">
            <div className="mx-auto max-w-[650px] rounded-[32px] border border-white/10 bg-white/6 p-4 shadow-[0_25px_80px_rgba(0,0,0,0.22)] backdrop-blur-md">
              <div className="relative mx-auto flex max-w-[520px] flex-col items-center">
                <Image
                  src="/images/mockup-dashboard.png"
                  alt="Mockup dashboard Orbyx"
                  width={1200}
                  height={900}
                  className="h-auto w-full"
                  priority
                />

                <div className="-mt-4 w-[78%] self-end">
                  <Image
                    src="/images/chat-question.png"
                    alt="Pregunta por WhatsApp"
                    width={1200}
                    height={300}
                    className="h-auto w-full"
                  />
                </div>

                <div className="-mt-1 w-[90%] self-start">
                  <Image
                    src="/images/chat-response.png"
                    alt="Respuesta por WhatsApp"
                    width={1400}
                    height={320}
                    className="h-auto w-full"
                  />
                </div>

                <div className="mt-2 w-[58%] self-end">
                  <Image
                    src="/images/persona-relajada.png"
                    alt="Persona relajada usando Orbyx"
                    width={1000}
                    height={850}
                    className="h-auto w-full"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* RESULTADOS */}
      <section className="relative py-20">
        <div className="mx-auto max-w-[1300px] px-6">
          <div className="max-w-3xl">
            <div className="inline-flex rounded-full border border-white/10 bg-white/6 px-4 py-2 text-sm font-medium text-slate-200">
              Lo que realmente vendes
            </div>
            <h2 className="mt-5 text-3xl font-semibold sm:text-4xl">
              Más clientes activos, menos inasistencias y menos carga operativa
            </h2>
            <p className="mt-4 text-base leading-7 text-slate-300 sm:text-lg">
              Orbyx no es solo una agenda. Es una forma más inteligente de
              responder clientes, reducir pérdidas y mantener tu negocio
              funcionando con más orden.
            </p>
          </div>

          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {resultCards.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.title}
                  className="rounded-[28px] border border-white/10 bg-white/6 p-7 shadow-[0_20px_50px_rgba(0,0,0,0.18)] backdrop-blur-md"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10">
                    <Icon className="h-5 w-5 text-blue-200" />
                  </div>
                  <h3 className="mt-5 text-xl font-semibold text-white">
                    {item.title}
                  </h3>
                  <p className="mt-3 text-sm leading-7 text-slate-300">
                    {item.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* IA DIFERENCIADORA */}
      <section className="py-20">
        <div className="mx-auto max-w-[1300px] px-6">
          <div className="rounded-[34px] border border-white/10 bg-white/6 p-8 shadow-[0_18px_60px_rgba(0,0,0,0.18)] backdrop-blur-md lg:p-10">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 rounded-full bg-blue-500/10 px-4 py-2 text-sm font-medium text-blue-200">
                <BrainCircuit className="h-4 w-4" />
                Diferenciación real
              </div>

              <h2 className="mt-5 text-3xl font-semibold leading-tight sm:text-4xl">
                No son respuestas fijas.
                <br />
                <span className="bg-[linear-gradient(90deg,#93c5fd_0%,#c4b5fd_50%,#f9a8d4_100%)] bg-clip-text text-transparent">
                  Es una IA entrenada según tu negocio.
                </span>
              </h2>

              <p className="mt-5 max-w-3xl text-base leading-7 text-slate-300 sm:text-lg">
                Orbyx no depende solo de botones o flujos rígidos. La IA puede
                apoyarse en el contexto de tu negocio para responder con más
                precisión, sostener conversaciones más naturales y ayudar a
                convertir consultas en reservas.
              </p>
            </div>

            <div className="mt-10 grid gap-6 md:grid-cols-3">
              {aiHighlights.map((item) => {
                const Icon = item.icon;
                return (
                  <div
                    key={item.title}
                    className="rounded-[26px] border border-white/10 bg-slate-950/35 p-6"
                  >
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/8 shadow-sm">
                      <Icon className="h-5 w-5 text-blue-200" />
                    </div>
                    <h3 className="mt-4 text-lg font-semibold text-white">
                      {item.title}
                    </h3>
                    <p className="mt-2 text-sm leading-6 text-slate-300">
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
            <div className="inline-flex rounded-full border border-white/10 bg-white/6 px-4 py-2 text-sm font-medium text-slate-200">
              Lo que te ayuda a resolver
            </div>
            <h2 className="mt-5 text-3xl font-semibold sm:text-4xl">
              Más que una agenda
            </h2>
            <p className="mt-4 text-base leading-7 text-slate-300 sm:text-lg">
              Orbyx combina reservas, seguimiento, automatización y atención por
              WhatsApp para que tu negocio funcione con más orden y menos carga
              operativa.
            </p>
          </div>

          <div className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {featureCards.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.title}
                  className="rounded-[28px] border border-white/10 bg-white/6 p-7 shadow-[0_10px_30px_rgba(0,0,0,0.18)] transition hover:-translate-y-1"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-500/10">
                    <Icon className="h-5 w-5 text-blue-200" />
                  </div>
                  <h3 className="mt-5 text-xl font-semibold text-white">
                    {item.title}
                  </h3>
                  <p className="mt-3 text-sm leading-7 text-slate-300">
                    {item.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* FOCO VETERINARIO */}
      <section className="py-20">
        <div className="mx-auto max-w-[1300px] px-6">
          <div className="grid items-center gap-10 lg:grid-cols-[1.05fr_0.95fr]">
            <div>
              <div className="inline-flex rounded-full bg-blue-500/10 px-4 py-2 text-sm font-medium text-blue-200">
                Foco principal
              </div>
              <h2 className="mt-5 text-3xl font-semibold leading-tight sm:text-4xl">
                Diseñado especialmente para veterinarias
                <br />
                <span className="text-slate-400">sin dejar fuera otros nichos</span>
              </h2>
              <p className="mt-5 max-w-2xl text-base leading-7 text-slate-300 sm:text-lg">
                Lideramos con veterinarias porque es donde Orbyx puede generar
                más valor: atención por WhatsApp, agenda más ordenada,
                seguimiento y una operación más profesional. Después, abrimos
                naturalmente hacia estética, barbería y bienestar.
              </p>

              <div className="mt-8 space-y-4">
                {veterinarianPoints.map((item) => (
                  <div
                    key={item}
                    className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/6 px-4 py-3"
                  >
                    <CheckCircle2 className="mt-0.5 h-5 w-5 text-emerald-400" />
                    <span className="text-sm leading-6 text-slate-200">{item}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[32px] border border-white/10 bg-white/6 p-7 shadow-[0_18px_50px_rgba(0,0,0,0.18)] backdrop-blur-md">
              <div className="inline-flex rounded-full bg-white/8 px-3 py-1 text-xs font-semibold text-slate-200">
                Cómo posicionamos Orbyx
              </div>

              <h3 className="mt-4 text-2xl font-semibold text-white">
                Un software que se siente específico,
                <br />
                no genérico
              </h3>

              <div className="mt-6 space-y-4">
                <div className="rounded-2xl border border-blue-400/20 bg-blue-500/10 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-200">
                    Mensaje principal
                  </p>
                  <p className="mt-2 text-sm leading-6 text-slate-100">
                    “Tu negocio responde por WhatsApp, agenda y hace seguimiento automáticamente.”
                  </p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/6 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-300">
                    Nicho líder
                  </p>
                  <p className="mt-2 text-sm leading-6 text-slate-100">
                    Veterinarias y ecosistema mascota.
                  </p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/6 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-300">
                    Extensión natural
                  </p>
                  <p className="mt-2 text-sm leading-6 text-slate-100">
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
            <div className="inline-flex rounded-full border border-white/10 bg-white/6 px-4 py-2 text-sm font-medium text-slate-200">
              Nichos priorizados
            </div>
            <h2 className="mt-5 text-3xl font-semibold sm:text-4xl">
              Un foco claro, con espacio para crecer
            </h2>
            <p className="mt-4 text-base leading-7 text-slate-300 sm:text-lg">
              Orbyx no quiere ser “para todo”. Queremos posicionarlo con fuerza
              donde más valor entrega primero, y luego expandirlo a otros rubros
              que comparten la misma necesidad de atención, reservas y
              seguimiento.
            </p>
          </div>

          <div className="mt-10 grid gap-6 lg:grid-cols-3">
            {nicheCards.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.title}
                  className="rounded-[28px] border border-white/10 bg-white/6 p-7 shadow-[0_10px_30px_rgba(0,0,0,0.18)]"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-500/10">
                      <Icon className="h-5 w-5 text-blue-200" />
                    </div>
                    <span className="rounded-full bg-white/8 px-3 py-1 text-xs font-semibold text-slate-200">
                      {item.badge}
                    </span>
                  </div>

                  <h3 className="mt-5 text-xl font-semibold text-white">
                    {item.title}
                  </h3>
                  <p className="mt-3 text-sm leading-7 text-slate-300">
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
          <div className="rounded-[36px] border border-white/10 bg-[linear-gradient(180deg,rgba(17,24,39,0.96),rgba(10,14,28,0.98))] px-8 py-10 text-white shadow-[0_28px_80px_rgba(0,0,0,0.28)] lg:px-12 lg:py-14">
            <div className="max-w-3xl">
              <div className="inline-flex rounded-full bg-white/8 px-4 py-2 text-sm font-medium text-white/90">
                Empieza cuando quieras
              </div>

              <h2 className="mt-5 text-3xl font-semibold leading-tight sm:text-4xl">
                Prueba Orbyx gratis por 7 días
                <br />
                y descubre si encaja con tu negocio
              </h2>

              <p className="mt-5 max-w-2xl text-base leading-7 text-white/75 sm:text-lg">
                Crea tu cuenta, revisa cómo funciona la agenda, explora el panel
                y conoce cómo la automatización por WhatsApp puede ayudarte a
                trabajar con más orden.
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