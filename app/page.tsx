"use client";

import { motion } from "framer-motion";

export default function OrbyxLandingPage() {
  const cards = [
    {
      title: "Tus clientes reservan solos",
      text: "Ya no necesitas coordinar cada hora por WhatsApp, llamada o mensaje.",
    },
    {
      title: "Orbyx responde por ti",
      text: "La IA conversa con el cliente, propone horarios y agenda automáticamente.",
    },
    {
      title: "Confirmación automática",
      text: "La reserva queda lista y el cliente recibe todo sin trabajo manual.",
    },
  ];

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">

      {/* HERO */}
      <section className="relative overflow-hidden border-b border-slate-200 bg-gradient-to-b from-white to-slate-50">
        <div className="mx-auto max-w-7xl px-6 py-16 lg:grid lg:grid-cols-2 lg:gap-12 lg:px-8">

          {/* TEXTO */}
          <div>
            <div className="inline-flex rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
              <img
                src="/orbyx-logo-dark.png"
                alt="Orbyx"
                className="h-10"
              />
            </div>

            <div className="mt-6 inline-flex rounded-full border border-sky-200 bg-sky-50 px-4 py-1.5 text-sm font-medium text-sky-700">
              Automatización con IA + WhatsApp
            </div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6 text-4xl font-semibold leading-tight sm:text-5xl"
            >
              Tu equipo atiende. <br />
              <span className="text-sky-600">
                Orbyx agenda por WhatsApp.
              </span>
            </motion.h1>

            <p className="mt-6 text-lg text-slate-600">
              Tus empleados se enfocan en atender, no en coordinar mensajes.
              Orbyx responde, propone horarios y agenda automáticamente por tu negocio.
            </p>

            <div className="mt-8 flex gap-3">
              <a
                href="/demo"
                className="rounded-2xl bg-sky-600 px-6 py-3 text-white hover:bg-sky-700"
              >
                Ver demo
              </a>

              <a
                href="/planes"
                className="rounded-2xl border border-slate-300 px-6 py-3 hover:bg-slate-100"
              >
                Ver planes
              </a>
            </div>

            <div className="mt-6 text-sm text-slate-500">
              Menos WhatsApp • Más reservas • Más orden
            </div>
          </div>

          {/* MOCKUP WHATSAPP */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-10 lg:mt-0"
          >
            <div className="rounded-3xl border bg-white p-5 shadow-xl">
              <div className="space-y-3">

                <div className="rounded-2xl bg-slate-100 p-3 text-sm">
                  Hola, quiero hora mañana
                </div>

                <div className="rounded-2xl bg-sky-600 p-3 text-sm text-white">
                  Perfecto 👌 Tengo disponible 11:30 o 12:00 ¿cuál prefieres?
                </div>

                <div className="rounded-2xl bg-slate-100 p-3 text-sm">
                  11:30
                </div>

                <div className="rounded-2xl bg-sky-600 p-3 text-sm text-white">
                  Listo 🙌 tu hora quedó agendada para mañana a las 11:30
                </div>

                <div className="rounded-2xl bg-green-100 p-3 text-center text-sm font-medium text-green-700">
                  Reserva confirmada automáticamente
                </div>

              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* COMO FUNCIONA */}
      <section className="mx-auto max-w-7xl px-6 py-14 lg:px-8">
        <div className="text-center">
          <h2 className="text-3xl font-semibold">
            Automatiza tus reservas en 3 pasos
          </h2>
        </div>

        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {cards.map((card) => (
            <div key={card.title} className="rounded-3xl border bg-white p-6 shadow-sm">
              <h3 className="text-xl font-semibold">{card.title}</h3>
              <p className="mt-3 text-slate-600">{card.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* IMPACTO */}
      <section className="bg-white border-y">
        <div className="mx-auto max-w-7xl px-6 py-14 lg:px-8">
          <div className="grid gap-6 lg:grid-cols-2">

            <div className="rounded-3xl border bg-slate-50 p-8">
              <h3 className="text-2xl font-semibold">
                Lo que dejas de hacer
              </h3>

              <div className="mt-6 space-y-3">
                <div className="rounded-xl bg-white p-3 border">
                  Responder WhatsApp todo el día
                </div>
                <div className="rounded-xl bg-white p-3 border">
                  Coordinar horarios manualmente
                </div>
                <div className="rounded-xl bg-white p-3 border">
                  Perder tiempo en ida y vuelta
                </div>
              </div>
            </div>

            <div className="rounded-3xl border bg-sky-50 p-8">
              <h3 className="text-2xl font-semibold">
                Lo que ganas con Orbyx
              </h3>

              <div className="mt-6 space-y-3">
                <div className="rounded-xl bg-white p-3 border">
                  Agenda ordenada automáticamente
                </div>
                <div className="rounded-xl bg-white p-3 border">
                  Más reservas sin esfuerzo
                </div>
                <div className="rounded-xl bg-white p-3 border font-medium text-sky-700">
                  Tus empleados se enfocan en atender, no en coordinar mensajes
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="px-6 py-16">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="text-3xl font-semibold">
            Deja de coordinar reservas manualmente
          </h2>

          <p className="mt-4 text-slate-600">
            Orbyx automatiza tu agenda y transforma WhatsApp en tu canal de reservas.
          </p>

          <div className="mt-8 flex justify-center gap-3">
            <a
              href="/demo"
              className="rounded-2xl bg-sky-600 px-6 py-3 text-white hover:bg-sky-700"
            >
              Ver demo
            </a>

            <a
              href="/planes"
              className="rounded-2xl border px-6 py-3 hover:bg-slate-100"
            >
              Ver planes
            </a>
          </div>
        </div>
      </section>

    </main>
  );
}