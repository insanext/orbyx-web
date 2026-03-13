"use client";

import { motion } from "framer-motion";

export default function OrbyxLandingPage() {
  const cards = [
    {
      title: "Tus clientes reservan solos",
      text: "Ya no necesitas coordinar cada hora por WhatsApp, llamada o mensaje.",
    },
    {
      title: "Orbyx organiza tu agenda",
      text: "Muestra horarios disponibles, bloquea espacios ocupados y evita desorden.",
    },
    {
      title: "Confirma automáticamente",
      text: "La reserva queda lista y el cliente recibe la información sin trabajo manual.",
    },
  ];

  const plans = [
    {
      name: "Starter",
      price: "$9.990",
      period: "/mes",
      desc: "Para independientes o negocios pequeños que quieren comenzar a automatizar sus reservas.",
      items: [
        "1 página de reservas",
        "Confirmaciones automáticas",
        "Cancelación con enlace seguro",
        "Horarios y servicios configurables",
      ],
      primary: false,
      badge: "Ideal para comenzar",
      cta: "Elegir Starter",
      href: "#",
    },
    {
      name: "Business",
      price: "$19.990",
      period: "/mes",
      desc: "Para negocios que quieren una imagen más profesional y una operación más ordenada.",
      items: [
        "Todo lo de Starter",
        "Recordatorios automáticos",
        "Branding del negocio",
        "Mejor experiencia comercial",
      ],
      primary: true,
      badge: "Recomendado",
      cta: "Elegir Business",
      href: "#",
    },
    {
      name: "Scale",
      price: "$39.990",
      period: "/mes",
      desc: "Para negocios que quieren crecer con más automatización, integraciones y visión de IA.",
      items: [
        "Todo lo de Business",
        "Base para WhatsApp + IA",
        "Integraciones futuras",
        "Prioridad en nuevas funciones",
      ],
      primary: false,
      badge: "Más proyección",
      cta: "Elegir Scale",
      href: "#",
    },
  ];

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <section className="relative overflow-hidden border-b border-slate-200 bg-[radial-gradient(circle_at_top,rgba(14,165,233,0.12),transparent_35%),radial-gradient(circle_at_100%_0%,rgba(59,130,246,0.10),transparent_30%),linear-gradient(to_bottom,#ffffff,#f8fafc)]">
        <div className="mx-auto max-w-7xl px-6 py-14 lg:px-8 lg:py-16">
          <div className="grid items-center gap-10 lg:grid-cols-2">
            <div>
              <div className="inline-flex rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
                <img
                  src="/orbyx-logo-dark.png"
                  alt="Orbyx Technologies"
                  className="h-10 w-auto object-contain sm:h-12"
                />
              </div>

              <div className="mt-5 inline-flex items-center rounded-full border border-sky-200 bg-sky-50 px-4 py-1.5 text-sm font-medium text-sky-700">
                Agendamiento automático impulsado por IA
              </div>

              <motion.h1
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.55 }}
                className="mt-5 max-w-3xl text-4xl font-semibold leading-tight tracking-tight sm:text-5xl lg:text-[54px]"
              >
                Automatiza el agendamiento de tu negocio con inteligencia artificial.
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.55, delay: 0.08 }}
                className="mt-5 max-w-2xl text-lg leading-8 text-slate-600"
              >
                Orbyx usa inteligencia artificial para gestionar tus reservas: tus clientes pueden agendar en línea o conversar por WhatsApp con la IA, que responde, propone horarios disponibles y agenda por ti automáticamente. El resultado: menos coordinación manual, respuestas más rápidas y una agenda siempre ordenada.
              </motion.p>

              <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                <a
                  href="/demo"
                  className="inline-flex items-center justify-center rounded-2xl bg-sky-600 px-6 py-3 text-sm font-medium text-white transition hover:bg-sky-700"
                >
                  Ver demo
                </a>
                <a
                  href="#pricing"
                  className="inline-flex items-center justify-center rounded-2xl border border-slate-300 bg-white px-6 py-3 text-sm font-medium text-slate-800 transition hover:bg-slate-100"
                >
                  Ver precios
                </a>
              </div>

              <div className="mt-7 flex flex-wrap gap-4 text-sm text-slate-600">
                <span>Menos WhatsApp</span>
                <span>•</span>
                <span>Más orden</span>
                <span>•</span>
                <span>Confirmación automática</span>
              </div>
            </div>

            <motion.div
              initial={{ opacity: 0, scale: 0.98, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.12 }}
              className="relative max-w-xl lg:ml-auto"
            >
              <div className="rounded-[28px] border border-slate-200 bg-white p-4 shadow-[0_20px_60px_rgba(15,23,42,0.10)]">
                <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-5">
                  <div className="mb-4 flex items-center justify-between">
                    <div>
                      <p className="text-sm text-slate-500">Producto estrella</p>
                      <h3 className="text-lg font-semibold sm:text-xl">Reserva automatizada con IA</h3>
                    </div>
                    <div className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-700">
                      Activo
                    </div>
                  </div>

                  <div className="grid gap-3">
                    <div className="rounded-2xl border border-slate-200 bg-white p-4">
                      <p className="text-sm text-slate-500">Qué hace Orbyx</p>
                      <p className="mt-1 font-medium text-slate-800">Muestra horarios, toma la reserva y la confirma automáticamente.</p>
                    </div>

                    <div className="grid grid-cols-3 gap-2.5">
                      {['Lun 12', 'Mar 13', 'Mié 14'].map((day) => (
                        <div key={day} className="rounded-2xl border border-slate-200 bg-white p-3 text-center text-sm font-medium text-slate-700">
                          {day}
                        </div>
                      ))}
                    </div>

                    <div className="grid grid-cols-2 gap-2.5">
                      {['09:00', '10:30', '12:00', '16:30'].map((time, i) => (
                        <motion.div
                          key={time}
                          initial={{ opacity: 0.6, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.35, delay: 0.18 + i * 0.06 }}
                          className="rounded-2xl border border-sky-200 bg-sky-50 p-3 text-center text-sm font-medium text-sky-800"
                        >
                          {time}
                        </motion.div>
                      ))}
                    </div>

                    <motion.div
                      initial={{ opacity: 0.7, scale: 0.98 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.4, delay: 0.42 }}
                      className="rounded-2xl bg-slate-900 px-4 py-3 text-center text-sm font-medium text-white"
                    >
                      Reserva confirmada automáticamente
                    </motion.div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-12 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-sky-700">Cómo funciona</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
            Una forma clara y moderna de gestionar reservas.
          </h2>
          <p className="mt-4 text-lg leading-8 text-slate-600">
            El cliente entra, reserva solo y Orbyx deja tu agenda ordenada sin que tengas que ir coordinando una por una.
          </p>
        </div>

        <div className="mt-8 grid gap-5 md:grid-cols-3">
          {cards.map((card, index) => (
            <motion.div
              key={card.title}
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: index * 0.06 }}
              className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
            >
              <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-full bg-sky-100 text-sm font-semibold text-sky-700">
                0{index + 1}
              </div>
              <h3 className="text-xl font-semibold">{card.title}</h3>
              <p className="mt-3 leading-7 text-slate-600">{card.text}</p>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="border-y border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-6 py-12 lg:px-8">
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-8">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-sky-700">Impacto real</p>
              <h3 className="mt-3 text-2xl font-semibold">Lo que resuelve Orbyx</h3>
              <div className="mt-6 space-y-3 text-slate-700">
                <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">Evita coordinar manualmente cada reserva</div>
                <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">Reduce errores y dobles agendamientos</div>
                <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">Entrega una imagen más profesional</div>
              </div>
            </div>

            <div className="rounded-3xl border border-sky-200 bg-sky-50 p-8">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-sky-700">Ideal para</p>
              <h3 className="mt-3 text-2xl font-semibold">Negocios que quieren ahorrar tiempo y vender mejor</h3>
              <p className="mt-4 leading-7 text-slate-700">
                Barberías, clínicas, consultas, profesionales independientes y cualquier negocio que hoy coordine horas por mensaje y quiera verse más moderno.
              </p>
              <div className="mt-6 inline-flex rounded-full bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm">
                Base para Google Calendar, WhatsApp e IA
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="pricing" className="mx-auto max-w-7xl px-6 py-12 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-sky-700">Precios</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
            Una oferta clara, simple y profesional.
          </h2>
          <p className="mt-4 text-lg leading-8 text-slate-600">
            Estos planes son visuales por ahora. La idea es mostrar una oferta clara, profesional y fácil de entender desde el primer vistazo.
          </p>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-3">
          {plans.map((plan) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4 }}
              className={`rounded-3xl border p-8 ${plan.primary ? "border-sky-300 bg-sky-50 shadow-md" : "border-slate-200 bg-white shadow-sm"}`}
            >
              <div className={`mb-5 rounded-t-2xl px-4 py-2 text-center text-sm font-semibold ${plan.primary ? "bg-sky-600 text-white" : "bg-slate-100 text-slate-700"}`}>
                {plan.badge}
              </div>

              <h3 className="text-2xl font-semibold">{plan.name}</h3>
              <p className="mt-3 text-slate-600">{plan.desc}</p>
              <div className="mt-6 flex items-end gap-1 text-slate-900">
                <span className="text-4xl font-semibold">{plan.price}</span>
                <span className="pb-1 text-sm text-slate-500">{plan.period}</span>
              </div>

              <div className="mt-6 space-y-3">
                {plan.items.map((item) => (
                  <div key={item} className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-700">
                    {item}
                  </div>
                ))}
              </div>

              <a
                href={plan.href}
                className={`mt-7 inline-flex w-full items-center justify-center rounded-2xl px-5 py-3 text-sm font-medium transition ${plan.primary ? "bg-sky-600 text-white hover:bg-sky-700" : "border border-slate-300 bg-white text-slate-800 hover:bg-slate-100"}`}
              >
                {plan.cta}
              </a>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="px-6 pb-14 lg:px-8">
        <div className="mx-auto max-w-6xl rounded-[32px] border border-slate-200 bg-slate-900 p-8 text-center text-white shadow-[0_20px_60px_rgba(15,23,42,0.14)] sm:p-12">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-sky-300">Comenzar</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-5xl">
            Haz que reservar sea fácil para tu cliente y simple para tu negocio.
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg leading-8 text-slate-300">
            Prueba la demo y entiende en pocos minutos cómo Orbyx automatiza reservas con IA de una forma clara y profesional.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <a
              href="/demo"
              className="inline-flex items-center justify-center rounded-2xl bg-white px-6 py-3 text-sm font-medium text-slate-900 transition hover:bg-slate-100"
            >
              Probar demo
            </a>
            <a
              href="mailto:contacto@orbyx.cl"
              className="inline-flex items-center justify-center rounded-2xl border border-white/15 bg-white/10 px-6 py-3 text-sm font-medium text-white transition hover:bg-white/15"
            >
              Hablar con ventas
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}
