"use client";

import { motion } from "framer-motion";

export default function OrbyxLandingPage() {
  const businessTypes = [
    "Barbería",
    "Peluquería",
    "Centro de estética",
    "Clínica",
    "Consulta médica",
    "Kinesiología / Fisioterapia",
    "Spa",
    "Salón de belleza",
    "Entrenamiento / Fitness",
    "Otro",
  ];

  const teamSizes = ["1", "2 a 3", "4 a 10", "11 a 20", "20+"];

  const benefits = [
    "IA que agenda por WhatsApp",
    "Menos coordinación manual",
    "Más movimiento en tu agenda",
  ];

  const featureCards = [
    { title: "Reserva confirmada", text: "11:00 AM" },
    { title: "+24", text: "reservas esta semana" },
    { title: "Seguimiento inteligente", text: "clientes reactivados" },
  ];

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.22),transparent_28%),radial-gradient(circle_at_top_right,rgba(217,70,239,0.14),transparent_24%),radial-gradient(circle_at_bottom,rgba(249,115,22,0.12),transparent_22%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(15,23,42,0.74),rgba(2,6,23,0.97))]" />

        <div className="relative mx-auto max-w-7xl px-6 py-12 lg:px-8 lg:py-16">
          <div className="grid items-center gap-10 lg:grid-cols-[1.05fr_0.95fr]">
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

              <div className="mt-8 flex flex-wrap gap-3">
                {benefits.map((item) => (
                  <span
                    key={item}
                    className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-200"
                  >
                    {item}
                  </span>
                ))}
              </div>

              <div className="mt-10 hidden max-w-2xl gap-4 md:grid md:grid-cols-3">
                {featureCards.map((card) => (
                  <div
                    key={card.title}
                    className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur"
                  >
                    <p className="text-sm text-slate-300">{card.title}</p>
                    <p className="mt-2 text-lg font-semibold text-white">{card.text}</p>
                  </div>
                ))}
              </div>
            </div>

            <motion.div
              initial={{ opacity: 0, scale: 0.98, y: 14 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.12 }}
              className="relative"
            >
              <div className="absolute -left-10 top-10 hidden xl:block">
                <div className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 backdrop-blur">
                  <p className="text-sm font-medium text-white">Reserva confirmada</p>
                  <p className="mt-1 text-slate-300">11:00 AM</p>
                </div>
              </div>

              <div className="absolute -left-2 bottom-24 hidden xl:block">
                <div className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 backdrop-blur">
                  <p className="text-2xl font-semibold text-white">+24</p>
                  <p className="text-sm text-slate-300">reservas esta semana</p>
                </div>
              </div>

              <div className="overflow-hidden rounded-[30px] border border-white/10 bg-white/5 shadow-[0_20px_70px_rgba(0,0,0,0.28)] backdrop-blur">
                <img
                  src="/hero-orbyx-pro.png"
                  alt="Orbyx hero visual"
                  className="h-auto w-full object-cover"
                />
              </div>

              <div className="absolute inset-0 -z-10 rounded-full bg-gradient-to-tr from-sky-400 via-fuchsia-400 to-orange-400 opacity-30 blur-3xl" />
            </motion.div>
          </div>
        </div>
      </section>

      <section className="relative z-10 -mt-4 px-6 pb-10 lg:-mt-8 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr]">
            <div />

            <div className="rounded-[32px] border border-white/10 bg-white/95 p-6 text-slate-900 shadow-[0_24px_70px_rgba(0,0,0,0.28)] backdrop-blur sm:p-8">
              <h2 className="text-3xl font-semibold tracking-tight text-indigo-700">
                Empieza gratis por 7 días
              </h2>
              <p className="mt-3 text-lg text-slate-600">
                Sin tarjeta. Configura tu agenda en minutos.
              </p>

              <form className="mt-6 space-y-4">
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    ¿Qué tipo de negocio tienes?
                  </label>
                  <select className="h-14 w-full rounded-2xl border border-slate-300 bg-white px-4 text-base outline-none transition focus:border-sky-500">
                    <option value="">Selecciona una opción</option>
                    {businessTypes.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    ¿Cuántos profesionales atienden en tu negocio?
                  </label>
                  <select className="h-14 w-full rounded-2xl border border-slate-300 bg-white px-4 text-base outline-none transition focus:border-sky-500">
                    <option value="">Selecciona una opción</option>
                    {teamSizes.map((size) => (
                      <option key={size} value={size}>
                        {size}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Nombre completo
                  </label>
                  <input
                    type="text"
                    placeholder="Ingresa tu nombre"
                    className="h-14 w-full rounded-2xl border border-slate-300 bg-white px-4 text-base outline-none transition focus:border-sky-500"
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">
                      Correo electrónico
                    </label>
                    <input
                      type="email"
                      placeholder="tucorreo@ejemplo.com"
                      className="h-14 w-full rounded-2xl border border-slate-300 bg-white px-4 text-base outline-none transition focus:border-sky-500"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">
                      Teléfono
                    </label>
                    <input
                      type="tel"
                      placeholder="+56 9..."
                      className="h-14 w-full rounded-2xl border border-slate-300 bg-white px-4 text-base outline-none transition focus:border-sky-500"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="inline-flex min-h-[58px] w-full items-center justify-center rounded-2xl bg-gradient-to-r from-sky-600 to-indigo-600 px-6 text-lg font-semibold text-white shadow-[0_14px_36px_rgba(59,130,246,0.28)] transition hover:-translate-y-0.5 hover:from-sky-500 hover:to-indigo-500"
                >
                  Crear mi agenda →
                </button>
              </form>

              <p className="mt-4 text-center text-sm leading-6 text-slate-500">
                Empieza gratis. Después del período de prueba puedes pasar a un plan de pago.
              </p>

              <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm font-medium text-slate-800">
                  Consejo
                </p>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Orbyx sigue siendo un producto general. El tipo de negocio nos ayuda a
                  sugerir servicios y personalizar textos iniciales, sin obligarte a usar
                  una versión distinta del sistema.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}