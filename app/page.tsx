"use client";

import { motion } from "framer-motion";

export default function OrbyxLandingPage() {
  const pillars = [
    {
      title: "Agendamiento con IA",
      text: "Orbyx responde WhatsApp, propone horarios y agenda automáticamente por tu negocio.",
    },
    {
      title: "Agenda más activa",
      text: "Seguimiento inteligente, recordatorios y recuperación de clientes para mantener más movimiento en tu agenda.",
    },
  ];

  const steps = [
    {
      title: "Tu cliente escribe por WhatsApp",
      text: "La conversación comienza como cualquier mensaje normal.",
    },
    {
      title: "La IA propone horarios",
      text: "Orbyx pregunta si prefiere mañana o tarde, revisa disponibilidad y ofrece opciones reales.",
    },
    {
      title: "La reserva queda confirmada",
      text: "El cliente recibe confirmación y tu agenda se actualiza sin coordinación manual.",
    },
  ];

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.22),transparent_28%),radial-gradient(circle_at_top_right,rgba(217,70,239,0.14),transparent_24%),radial-gradient(circle_at_bottom,rgba(249,115,22,0.12),transparent_22%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(15,23,42,0.74),rgba(2,6,23,0.97))]" />

        <div className="relative mx-auto max-w-7xl px-6 py-14 lg:px-8 lg:py-20">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div>
              <div className="inline-flex rounded-2xl border border-white/10 bg-white/10 px-4 py-3 shadow-sm backdrop-blur">
                <img
                  src="/orbyx-logo-dark.png"
                  alt="Orbyx"
                  className="h-10 w-auto object-contain sm:h-12"
                />
              </div>

              <div className="mt-6 inline-flex items-center rounded-full border border-sky-300/20 bg-sky-400/10 px-4 py-1.5 text-sm font-medium text-sky-200">
                Agendamiento con IA + seguimiento inteligente
              </div>

              <motion.h1
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="mt-6 max-w-3xl text-4xl font-semibold leading-tight tracking-tight text-white sm:text-5xl lg:text-[56px]"
              >
                Automatiza tus reservas con IA
                <br />
                <span className="text-sky-400">y mantén tu agenda más activa</span>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.08 }}
                className="mt-6 max-w-2xl text-lg leading-8 text-slate-300"
              >
                Deja de coordinar reservas por WhatsApp manualmente.
                <br />
                Orbyx responde, propone horarios y agenda automáticamente por tu negocio.
                Además, te ayuda a mantener tu agenda activa con seguimiento inteligente,
                recordatorios y recuperación de clientes.
              </motion.p>

              <div className="mt-8 flex flex-col gap-4 sm:flex-row">
                <a
                  href="/demo"
                  className="inline-flex min-h-[52px] items-center justify-center rounded-2xl bg-sky-500 px-7 text-base font-semibold text-white shadow-[0_12px_30px_rgba(14,165,233,0.28)] transition hover:-translate-y-0.5 hover:bg-sky-400"
                >
                  Ver en acción
                </a>
                <a
                  href="/planes"
                  className="inline-flex min-h-[52px] items-center justify-center rounded-2xl border border-white/15 bg-white/10 px-7 text-base font-semibold text-white shadow-[0_12px_30px_rgba(15,23,42,0.18)] transition hover:-translate-y-0.5 hover:bg-white/15"
                >
                  Ver planes
                </a>
              </div>

              <div className="mt-7 flex flex-wrap gap-3 text-sm text-slate-300">
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5">
                  IA que agenda por WhatsApp
                </span>
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5">
                  Menos coordinación manual
                </span>
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5">
                  Más movimiento en tu agenda
                </span>
              </div>
            </div>

            <motion.div
              initial={{ opacity: 0, scale: 0.98, y: 14 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.12 }}
              className="lg:ml-auto"
            >
              <div className="overflow-hidden rounded-[30px] border border-white/10 bg-white/5 p-4 shadow-[0_20px_70px_rgba(0,0,0,0.28)] backdrop-blur">
                <div className="rounded-[26px] border border-white/10 bg-slate-900/80 p-4">
                  <div className="mb-4 flex items-center justify-between">
                    <div>
                      <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                        Conversación con IA
                      </p>
                      <h3 className="mt-1 text-lg font-semibold text-white">
                        Reserva por WhatsApp
                      </h3>
                    </div>
                    <div className="rounded-full bg-emerald-400/15 px-3 py-1 text-xs font-medium text-emerald-300">
                      Activo
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="ml-auto max-w-[85%] rounded-2xl rounded-br-md bg-emerald-500 px-4 py-3 text-sm text-white shadow-sm">
                      Hola, quiero una hora
                    </div>

                    <div className="max-w-[88%] rounded-2xl rounded-bl-md bg-slate-800 px-4 py-3 text-sm text-slate-100 shadow-sm">
                      Claro. ¿Prefieres horarios en la mañana o en la tarde?
                    </div>

                    <div className="ml-auto max-w-[70%] rounded-2xl rounded-br-md bg-emerald-500 px-4 py-3 text-sm text-white shadow-sm">
                      En la mañana
                    </div>

                    <div className="max-w-[88%] rounded-2xl rounded-bl-md bg-slate-800 px-4 py-3 text-sm text-slate-100 shadow-sm">
                      Muy bien. Tengo disponible a las 8:30 y a las 10:00 hrs.
                    </div>

                    <div className="ml-auto max-w-[70%] rounded-2xl rounded-br-md bg-emerald-500 px-4 py-3 text-sm text-white shadow-sm">
                      Quiero a las 10:00 hrs
                    </div>

                    <div className="max-w-[88%] rounded-2xl rounded-bl-md bg-sky-500 px-4 py-3 text-sm font-medium text-white shadow-sm">
                      Agendado. Te llegará un correo de confirmación con los detalles.
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-12 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-2">
          {pillars.map((item, index) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: index * 0.06 }}
              className="rounded-[28px] border border-white/10 bg-white/5 p-8 shadow-[0_16px_50px_rgba(0,0,0,0.18)]"
            >
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-sky-300">
                Pilar {index + 1}
              </p>
              <h2 className="mt-3 text-2xl font-semibold text-white sm:text-3xl">
                {item.title}
              </h2>
              <p className="mt-4 text-base leading-7 text-slate-300">
                {item.text}
              </p>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="border-y border-white/10 bg-white/5">
        <div className="mx-auto max-w-7xl px-6 py-12 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-sky-300">
              Cómo funciona
            </p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
              WhatsApp deja de ser carga y se transforma en una reserva
            </h2>
            <p className="mt-4 text-lg leading-8 text-slate-300">
              Orbyx toma la conversación, propone opciones reales y confirma la hora sin hacerte perder tiempo coordinando mensajes.
            </p>
          </div>

          <div className="mt-8 grid gap-5 md:grid-cols-3">
            {steps.map((card, index) => (
              <motion.div
                key={card.title}
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: index * 0.06 }}
                className="rounded-3xl border border-white/10 bg-slate-900/70 p-6"
              >
                <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-full bg-sky-400/15 text-sm font-semibold text-sky-300">
                  0{index + 1}
                </div>
                <h3 className="text-xl font-semibold text-white">{card.title}</h3>
                <p className="mt-3 leading-7 text-slate-300">{card.text}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-12 lg:px-8">
        <div className="grid items-center gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-[30px] border border-cyan-400/20 bg-gradient-to-br from-cyan-500/10 to-sky-500/10 p-8 shadow-[0_18px_50px_rgba(0,0,0,0.2)]">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-cyan-300">
              Impacto real
            </p>
            <h3 className="mt-3 text-2xl font-semibold tracking-tight text-white">
              Menos tiempo respondiendo. Más tiempo atendiendo.
            </h3>

            <div className="mt-6 space-y-3">
              {[
                "Responde reservas sin depender de coordinación manual por WhatsApp.",
                "Reduce ida y vuelta innecesaria al ofrecer horarios automáticamente.",
                "Mantén la agenda más activa con seguimiento inteligente de clientes.",
                "Recupera clientes con recordatorios y automatizaciones.",
              ].map((item) => (
                <div
                  key={item}
                  className="rounded-2xl border border-cyan-400/15 bg-white/5 px-4 py-3 text-sm text-slate-200"
                >
                  {item}
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[30px] border border-white/10 bg-white/5 p-8 text-center shadow-[0_18px_50px_rgba(0,0,0,0.2)]">
            <img
              src="/orbyx-logo-dark.png"
              alt="Orbyx"
              className="mx-auto h-24 w-auto object-contain sm:h-28"
            />
            <h3 className="mt-6 text-2xl font-semibold text-white">
              IA para agendar y apoyar el crecimiento de tu negocio
            </h3>
            <p className="mt-4 leading-7 text-slate-300">
              Orbyx no solo automatiza reservas. También te ayuda a mantener más movimiento en tu agenda con seguimiento inteligente y recuperación de clientes.
            </p>
          </div>
        </div>
      </section>

      <section className="px-6 pb-14 lg:px-8">
        <div className="mx-auto max-w-6xl rounded-[32px] border border-white/10 bg-slate-900 p-8 text-center text-white shadow-[0_20px_60px_rgba(0,0,0,0.2)] sm:p-12">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-sky-300">
            Comenzar
          </p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-5xl">
            Automatiza reservas con IA y mantén tu agenda con más movimiento
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg leading-8 text-slate-300">
            Descubre cómo Orbyx puede responder por tu negocio, agendar automáticamente y ayudarte a recuperar clientes.
          </p>
          <div className="mt-8 flex justify-center">
            <a
              href="/planes"
              className="inline-flex min-h-[52px] items-center justify-center rounded-2xl bg-sky-500 px-7 text-base font-semibold text-white shadow-[0_12px_30px_rgba(14,165,233,0.28)] transition hover:-translate-y-0.5 hover:bg-sky-400"
            >
              Ver planes
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}