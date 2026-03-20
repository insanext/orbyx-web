"use client";

import { motion } from "framer-motion";
import { CalendarDays, Rocket, Users, CreditCard, Star } from "lucide-react";

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

  const quickFeatures = [
    { icon: CalendarDays, title: "Agenda y citas" },
    { icon: Rocket, title: "Reservas y seguimiento" },
    { icon: Users, title: "Clientes e historial" },
    { icon: CreditCard, title: "Base para pagos online" },
  ];

  const chips = [
    "IA que agenda por WhatsApp",
    "Menos coordinación manual",
    "Más movimiento en tu agenda",
  ];

  return (
    <main className="min-h-screen bg-[#f5f3f7] text-slate-900">
      <section className="relative overflow-hidden">
        {/* Fondo base */}
        <div className="absolute inset-0 bg-[linear-gradient(90deg,#f7f4f8_0%,#f4f0f5_45%,#efe8f1_100%)]" />

        {/* Imagen de fondo de la señorita: reemplaza cuando tengas la limpia */}
        <div
          className="absolute inset-0 opacity-70 bg-center bg-cover bg-no-repeat"
          style={{
            backgroundImage: "url('/hero-woman-bg.png')",
          }}
        />

        {/* Velo para que el texto siga leyendo bien */}
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(247,244,248,0.96)_0%,rgba(247,244,248,0.88)_35%,rgba(247,244,248,0.55)_58%,rgba(247,244,248,0.28)_72%,rgba(247,244,248,0.16)_100%)]" />

        {/* Glow suave */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_62%_58%,rgba(59,130,246,0.10),transparent_18%),radial-gradient(circle_at_70%_64%,rgba(236,72,153,0.10),transparent_20%),radial-gradient(circle_at_74%_52%,rgba(249,115,22,0.10),transparent_18%)]" />

        <div className="relative mx-auto max-w-7xl px-5 py-8 lg:px-8 lg:py-10">
          <div className="grid items-start gap-10 lg:grid-cols-[1.08fr_0.92fr]">
            {/* IZQUIERDA */}
            <div className="pt-2">
              <div className="inline-flex items-center gap-3">
                <div className="rounded-2xl border border-slate-200 bg-white px-3 py-2 shadow-sm">
                  <img
                    src="/orbyx-logo-dark.png"
                    alt="Orbyx"
                    className="h-11 w-auto object-contain"
                  />
                </div>

                <div className="rounded-full border border-sky-200 bg-sky-50 px-4 py-2 text-sm font-medium text-sky-700">
                  Agendamiento con IA + seguimiento inteligente
                </div>
              </div>

              <motion.h1
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45 }}
                className="mt-8 max-w-3xl text-4xl font-semibold leading-tight tracking-tight text-slate-900 sm:text-5xl lg:text-[60px]"
              >
                Automatiza tus
                <br />
                reservas con IA
                <br />
                <span className="text-sky-500">y mantén tu agenda</span>
                <br />
                <span className="text-sky-500">más activa</span>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, delay: 0.06 }}
                className="mt-7 max-w-2xl text-[17px] leading-8 text-slate-700"
              >
                Deja de coordinar reservas por WhatsApp manualmente.
                <br />
                Orbyx responde, propone horarios y agenda automáticamente por tu
                negocio. Además, te ayuda a mantener tu agenda activa con
                seguimiento inteligente, recordatorios y recuperación de clientes.
              </motion.p>

              <div className="mt-8 flex flex-wrap gap-3">
                {chips.map((item) => (
                  <span
                    key={item}
                    className="rounded-full border border-slate-200 bg-white/85 px-4 py-2 text-sm font-medium text-slate-700 shadow-sm backdrop-blur"
                  >
                    {item}
                  </span>
                ))}
              </div>

              <div className="mt-10 grid max-w-2xl gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {quickFeatures.map((item) => {
                  const Icon = item.icon;
                  return (
                    <div
                      key={item.title}
                      className="flex flex-col items-center text-center"
                    >
                      <div className="mb-3 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-white/90 text-slate-700 shadow-sm ring-1 ring-slate-200 backdrop-blur">
                        <Icon className="h-7 w-7" />
                      </div>
                      <p className="text-lg font-medium text-slate-800">
                        {item.title}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* DERECHA */}
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.08 }}
              className="lg:pt-2"
            >
              <div className="rounded-[32px] bg-white p-6 shadow-[0_18px_60px_rgba(15,23,42,0.08)] ring-1 ring-slate-200 sm:p-8">
                <h2 className="text-center text-4xl font-semibold tracking-tight text-violet-600">
                  Empieza gratis por 7 días
                </h2>

                <p className="mt-4 text-center text-lg leading-7 text-slate-600">
                  Sin tarjeta. Configura tu agenda en minutos.
                </p>

                <form className="mt-8 space-y-4">
                  <div>
                    <select className="h-14 w-full rounded-2xl border border-slate-300 bg-white px-4 text-base text-slate-700 outline-none transition focus:border-sky-500">
                      <option value="">¿Qué tipo de negocio tienes?</option>
                      {businessTypes.map((type) => (
                        <option key={type} value={type}>
                          {type}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <select className="h-14 w-full rounded-2xl border border-slate-300 bg-white px-4 text-base text-slate-700 outline-none transition focus:border-sky-500">
                      <option value="">
                        ¿Cuántos profesionales atienden en tu negocio?
                      </option>
                      {teamSizes.map((size) => (
                        <option key={size} value={size}>
                          {size}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <input
                      type="text"
                      placeholder="Ingresa tu nombre y apellido"
                      className="h-14 w-full rounded-2xl border border-slate-300 bg-white px-4 text-base text-slate-700 outline-none transition focus:border-sky-500"
                    />
                  </div>

                  <div className="grid gap-4 sm:grid-cols-[1fr_0.9fr]">
                    <input
                      type="email"
                      placeholder="Ingresa tu email"
                      className="h-14 w-full rounded-2xl border border-slate-300 bg-white px-4 text-base text-slate-700 outline-none transition focus:border-sky-500"
                    />
                    <input
                      type="tel"
                      placeholder="Teléfono"
                      className="h-14 w-full rounded-2xl border border-slate-300 bg-white px-4 text-base text-slate-700 outline-none transition focus:border-sky-500"
                    />
                  </div>

                  <button
                    type="submit"
                    className="inline-flex h-14 w-full items-center justify-center rounded-full bg-gradient-to-r from-orange-500 to-fuchsia-500 px-6 text-lg font-semibold text-white shadow-[0_16px_36px_rgba(236,72,153,0.24)] transition hover:brightness-105"
                  >
                    Crear mi agenda →
                  </button>
                </form>

                <p className="mt-5 text-center text-sm leading-6 text-slate-500">
                  Empieza gratis. Luego del período de prueba puedes pasar a un
                  plan de pago.
                </p>

                <div className="mt-8 text-center">
                  <div className="inline-flex items-center gap-1 text-rose-500">
                    <Star className="h-5 w-5 fill-current" />
                    <Star className="h-5 w-5 fill-current" />
                    <Star className="h-5 w-5 fill-current" />
                    <Star className="h-5 w-5 fill-current" />
                    <Star className="h-5 w-5 fill-current" />
                  </div>

                  <p className="mt-2 text-2xl font-medium text-slate-600">
                    +10.000 negocios nos recomiendan
                  </p>
                </div>

                <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-sm font-medium text-slate-800">Consejo</p>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    Orbyx sigue siendo un producto general. El tipo de negocio
                    nos ayuda a sugerir servicios y personalizar textos
                    iniciales, sin obligarte a usar una versión distinta del
                    sistema.
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>
    </main>
  );
}