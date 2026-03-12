export default function OrbyxLandingPage() {
  const features = [
    {
      title: "Reserva automatizada con IA",
      description:
        "Orbyx ayuda a que un cliente pueda reservar sin depender de mensajes manuales, coordinaciones lentas o seguimiento uno a uno.",
    },
    {
      title: "Menos trabajo operativo",
      description:
        "La plataforma organiza disponibilidad, confirma reservas, envía recordatorios y reduce fricción en la agenda diaria.",
    },
    {
      title: "Imagen profesional para vender mejor",
      description:
        "Tu negocio muestra una experiencia moderna, ordenada y confiable desde la primera interacción con el cliente.",
    },
  ];

  const benefits = [
    "Página de reservas personalizada para tu negocio",
    "Confirmaciones automáticas por correo",
    "Recordatorios automáticos 24 horas antes",
    "Cancelación simple con enlace seguro",
    "Base para integraciones con Google Calendar y WhatsApp",
    "Capa de automatización e inteligencia artificial como diferenciador",
  ];

  const steps = [
    {
      step: "01",
      title: "Configura tus horarios",
      description:
        "Defines tus servicios, duración, disponibilidad y reglas básicas de atención en pocos pasos",
    },
    {
      step: "02",
      title: "Comparte tu link",
      description:
        "Tus clientes entran a tu página y reservan solos sin tener que escribirte para coordinar cada hora",
    },
    {
      step: "03",
      title: "Orbyx hace el resto",
      description:
        "El sistema confirma, recuerda y organiza tu agenda para que tu operación sea más automática y ordenada",
    },
  ];

  const pricing = [
    {
      name: "Demo",
      price: "Gratis",
      description: "Para evaluar la experiencia Orbyx y visualizar su aplicación en tu negocio.",
      items: [
        "Página pública de reservas",
        "Servicios y horarios",
        "Confirmaciones por correo",
        "Cancelación con enlace seguro",
      ],
      cta: "Probar demo",
      highlight: false,
    },
    {
      name: "Business",
      price: "Próximamente",
      description: "Para negocios que buscan una agenda moderna con base de automatización e IA.",
      items: [
        "Todo lo del plan Demo",
        "Recordatorios automáticos",
        "Branding del negocio",
        "Integraciones y automatizaciones",
      ],
      cta: "Comenzar gratis",
      highlight: true,
    },
  ];

  const LogoMain = () => (
    <div className="flex items-center">
      <div className="rounded-3xl border border-white/10 bg-white px-5 py-4 shadow-2xl shadow-cyan-500/10">
        <img
          src="/orbyx-logo-dark.png"
          alt="Orbyx Technologies"
          className="h-14 w-auto object-contain sm:h-16"
        />
      </div>
    </div>
  );

  const LogoAlt = () => (
    <div className="flex items-center">
      <div className="rounded-3xl border border-cyan-400/20 bg-zinc-900 px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-full border border-cyan-400/30 bg-cyan-400/10">
            <svg viewBox="0 0 64 64" className="h-7 w-7" fill="none">
              <ellipse cx="32" cy="32" rx="22" ry="11" stroke="currentColor" strokeWidth="4" className="text-cyan-300" transform="rotate(-28 32 32)" />
              <ellipse cx="32" cy="32" rx="22" ry="11" stroke="currentColor" strokeWidth="4" className="text-white" transform="rotate(28 32 32)" />
            </svg>
          </div>
          <div>
            <div className="text-lg font-semibold tracking-[0.18em] text-white">ORBYX</div>
            <div className="text-[11px] uppercase tracking-[0.28em] text-cyan-300">AI AUTOMATION</div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      <section className="relative overflow-hidden border-b border-white/10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(59,130,246,0.18),transparent_35%),radial-gradient(circle_at_80%_20%,rgba(168,85,247,0.14),transparent_25%)]" />
        <div className="relative mx-auto max-w-7xl px-6 py-20 lg:px-8 lg:py-28">
          <div className="grid items-center gap-14 lg:grid-cols-2">
            <div>
              <LogoMain />

              <div className="mb-5 mt-6 inline-flex items-center rounded-full border border-cyan-400/30 bg-cyan-400/10 px-4 py-1.5 text-sm text-cyan-200">
                Orbyx • Automatización de reservas con inteligencia artificial
              </div>

              <h1 className="max-w-4xl text-4xl font-semibold leading-tight tracking-tight sm:text-5xl lg:text-6xl">
                Automatiza las reservas de tu negocio con IA y deja de coordinar horas manualmente.
              </h1>

              <p className="mt-6 max-w-3xl text-lg leading-8 text-zinc-300">
                En simple: Orbyx permite que tus clientes reserven solos, mientras el sistema ordena horarios, confirma citas, envía recordatorios y prepara una base real para automatizaciones inteligentes.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <a
                  href="/demo"
                  className="inline-flex items-center justify-center rounded-2xl bg-white px-6 py-3 text-sm font-medium text-zinc-950 transition hover:opacity-90"
                >
                  Ver demo
                </a>
                <a
                  href="#pricing"
                  className="inline-flex items-center justify-center rounded-2xl border border-white/15 bg-white/5 px-6 py-3 text-sm font-medium text-white transition hover:bg-white/10"
                >
                  Ver precios
                </a>
              </div>

              <div className="mt-8 flex flex-wrap gap-6 text-sm text-zinc-400">
                <span>Clientes reservan solos</span>
                <span>•</span>
                <span>Menos coordinación manual</span>
                <span>•</span>
                <span>Base para WhatsApp + IA</span>
              </div>

              <div className="mt-8 grid max-w-3xl gap-4 md:grid-cols-3">
                <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
                  <p className="text-xs font-medium uppercase tracking-[0.22em] text-cyan-300">
                    1. El cliente entra
                  </p>
                  <p className="mt-3 text-sm leading-6 text-zinc-300">
                    Ve tus servicios y selecciona el horario disponible que más le acomoda.
                  </p>
                </div>
                <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
                  <p className="text-xs font-medium uppercase tracking-[0.22em] text-cyan-300">
                    2. Orbyx automatiza
                  </p>
                  <p className="mt-3 text-sm leading-6 text-zinc-300">
                    La plataforma confirma la reserva, bloquea el espacio y envía la información necesaria.
                  </p>
                </div>
                <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
                  <p className="text-xs font-medium uppercase tracking-[0.22em] text-cyan-300">
                    3. Tú operas mejor
                  </p>
                  <p className="mt-3 text-sm leading-6 text-zinc-300">
                    Menos mensajes, menos errores y una agenda lista para crecer con IA.
                  </p>
                </div>
              </div>
            </div>

            <div className="relative">
              <div className="rounded-[28px] border border-white/10 bg-white/5 p-3 shadow-2xl shadow-cyan-500/10 backdrop-blur">
                <div className="rounded-[24px] border border-white/10 bg-zinc-900 p-5">
                  <div className="mb-4 flex items-center justify-between">
                    <div>
                      <p className="text-sm text-zinc-400">Producto estrella</p>
                      <h3 className="text-xl font-semibold">Reserva automatizada con IA</h3>
                    </div>
                    <div className="rounded-full bg-emerald-400/15 px-3 py-1 text-xs text-emerald-300">
                      Disponible
                    </div>
                  </div>

                  <div className="grid gap-4">
                    <div className="rounded-2xl border border-white/10 bg-zinc-950 p-4">
                      <p className="text-sm text-zinc-400">Qué hace Orbyx</p>
                      <p className="mt-1 font-medium">Toma reservas, ordena disponibilidad y automatiza confirmaciones</p>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      {['Lun 12', 'Mar 13', 'Mié 14'].map((day) => (
                        <div
                          key={day}
                          className="rounded-2xl border border-white/10 bg-white/5 p-3 text-center text-sm"
                        >
                          {day}
                        </div>
                      ))}
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      {['09:00', '10:30', '12:00', '16:30'].map((time) => (
                        <div
                          key={time}
                          className="rounded-2xl border border-cyan-400/20 bg-cyan-400/10 p-3 text-center text-sm text-cyan-100"
                        >
                          {time}
                        </div>
                      ))}
                    </div>

                    <div className="rounded-2xl bg-white px-4 py-3 text-center text-sm font-medium text-zinc-950">
                      Reserva confirmada automáticamente
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-20 lg:px-8">
        <div className="max-w-3xl">
          <p className="mb-3 text-sm font-medium uppercase tracking-[0.2em] text-cyan-300">
            Propuesta de valor
          </p>
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-cyan-300">
            El problema
          </p>
          <h2 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">
            Muchas empresas todavía agendan por WhatsApp, llamadas o mensajes, perdiendo tiempo en algo que ya se puede automatizar.
          </h2>
          <p className="mt-4 text-lg text-zinc-300">
            Eso genera atrasos, errores, dobles reservas y dependencia manual. Orbyx lo resuelve con una reserva automatizada con IA, explicada de forma simple y pensada para operar mejor.
          </p>
        </div>

        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-lg shadow-black/20"
            >
              <h3 className="text-xl font-semibold">{feature.title}</h3>
              <p className="mt-3 leading-7 text-zinc-300">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="border-y border-white/10 bg-white/[0.03]">
        <div className="mx-auto max-w-7xl px-6 py-20 lg:px-8">
          <div className="max-w-3xl">
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-cyan-300">
              Cómo funciona
            </p>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">
              Cómo funciona, explicado simple.
            </h2>
          </div>

          <div className="mt-10 grid gap-6 lg:grid-cols-3">
            {steps.map((item) => (
              <div key={item.step} className="rounded-3xl border border-white/10 bg-zinc-900 p-6">
                <div className="text-sm font-semibold text-cyan-300">{item.step}</div>
                <h3 className="mt-3 text-2xl font-semibold">{item.title}</h3>
                <p className="mt-3 leading-7 text-zinc-300">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-20 lg:px-8">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-cyan-300">
              Demo interactiva
            </p>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">
              Muestra una experiencia que deja claro, con manzanitas, cómo funciona la automatización de reservas con IA.
            </h2>
            <p className="mt-4 text-lg text-zinc-300">
              La demo ayuda a explicar el producto estrella: el cliente reserva, Orbyx organiza la agenda y el negocio gana tiempo gracias a la automatización.
            </p>
            <a
              href="/demo"
              className="mt-8 inline-flex rounded-2xl border border-white/15 bg-white/5 px-6 py-3 text-sm font-medium text-white transition hover:bg-white/10"
            >
              Ir a la demo
            </a>
          </div>

          <div className="rounded-[28px] border border-white/10 bg-gradient-to-br from-cyan-500/10 to-fuchsia-500/10 p-6">
            <div className="rounded-[24px] border border-white/10 bg-zinc-950 p-6">
              <div className="space-y-4">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="text-sm text-zinc-400">Cliente elige</p>
                  <p className="mt-1 font-medium">Servicio + fecha + horario</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="text-sm text-zinc-400">Orbyx automatiza</p>
                  <p className="mt-1 font-medium">Confirma la cita, ordena la agenda y reduce trabajo manual</p>
                </div>
                <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/10 p-4">
                  <p className="text-sm text-emerald-200">Resultado</p>
                  <p className="mt-1 font-medium text-emerald-50">Más tiempo para atender y menos tiempo coordinando reservas</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-white/10 bg-white/[0.03]">
        <div className="mx-auto max-w-7xl px-6 py-20 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-2">
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.2em] text-cyan-300">
                Beneficios
              </p>
              <h2 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">
                Diseñado para negocios que quieren automatizar reservas sin complicar su operación.
              </h2>
            </div>

            <div className="grid gap-4">
              {benefits.map((item) => (
                <div
                  key={item}
                  className="rounded-2xl border border-white/10 bg-zinc-900 px-5 py-4 text-zinc-200"
                >
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-20 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-8">
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-cyan-300">
              Integraciones
            </p>
            <h3 className="mt-4 text-2xl font-semibold">Conectado con lo importante</h3>
            <div className="mt-6 space-y-4 text-zinc-300">
              <div className="rounded-2xl border border-white/10 bg-zinc-900 p-4">
                <span className="font-medium text-white">Google Calendar</span>
                <p className="mt-2">Base ideal para sincronizar agenda y centralizar disponibilidad.</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-zinc-900 p-4">
                <span className="font-medium text-white">WhatsApp + IA</span>
                <p className="mt-2">Próximamente para confirmaciones, recordatorios, respuestas y automatizaciones conversacionales.</p>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-cyan-400/20 bg-cyan-400/10 p-8">
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-cyan-100">
              Posicionamiento
            </p>
            <h3 className="mt-4 text-2xl font-semibold text-white">
              Orbyx se posiciona como automatización de reservas con IA para negocios.
            </h3>
            <p className="mt-4 leading-7 text-cyan-50/90">
              Ideal para consultas, barberías, clínicas, servicios profesionales y negocios que quieren dejar atrás la coordinación manual para pasar a una experiencia más automática e inteligente.
            </p>
          </div>
        </div>
      </section>

      <section id="pricing" className="border-t border-white/10">
        <div className="mx-auto max-w-7xl px-6 py-20 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-cyan-300">
              Precios
            </p>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">
              Empieza con una demo clara y evoluciona hacia una solución business.
            </h2>
          </div>

          <div className="mt-12 grid gap-6 lg:grid-cols-2">
            {pricing.map((plan) => (
              <div
                key={plan.name}
                className={`rounded-3xl border p-8 ${
                  plan.highlight
                    ? 'border-cyan-400/30 bg-cyan-400/10 shadow-xl shadow-cyan-500/10'
                    : 'border-white/10 bg-white/5'
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-2xl font-semibold">{plan.name}</h3>
                    <p className="mt-2 text-zinc-300">{plan.description}</p>
                  </div>
                  {plan.highlight ? (
                    <span className="rounded-full bg-white px-3 py-1 text-xs font-medium text-zinc-950">
                      Recomendado
                    </span>
                  ) : null}
                </div>

                <div className="mt-8 text-4xl font-semibold">{plan.price}</div>

                <div className="mt-8 space-y-3">
                  {plan.items.map((item) => (
                    <div key={item} className="rounded-2xl border border-white/10 bg-zinc-900/60 px-4 py-3 text-zinc-200">
                      {item}
                    </div>
                  ))}
                </div>

                <a
                  href={plan.name === 'Demo' ? '/demo' : '#'}
                  className={`mt-8 inline-flex w-full items-center justify-center rounded-2xl px-5 py-3 text-sm font-medium transition ${
                    plan.highlight
                      ? 'bg-white text-zinc-950 hover:opacity-90'
                      : 'border border-white/15 bg-white/5 text-white hover:bg-white/10'
                  }`}
                >
                  {plan.cta}
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-20 lg:px-8">
        <div className="rounded-[32px] border border-white/10 bg-gradient-to-r from-cyan-500/15 via-sky-500/10 to-fuchsia-500/15 p-8 text-center sm:p-12">
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-cyan-200">
            Comenzar gratis
          </p>
          <h2 className="mt-4 text-3xl font-semibold tracking-tight sm:text-5xl">
            Haz que tus reservas funcionen de forma más automática e inteligente desde hoy.
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-zinc-200">
            Prueba la demo y entiende en minutos cómo Orbyx automatiza reservas con IA para que tu negocio ahorre tiempo y opere mejor.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <a
              href="/demo"
              className="inline-flex items-center justify-center rounded-2xl bg-white px-6 py-3 text-sm font-medium text-zinc-950 transition hover:opacity-90"
            >
              Probar demo
            </a>
            <a
              href="mailto:contacto@orbyx.cl"
              className="inline-flex items-center justify-center rounded-2xl border border-white/15 bg-white/5 px-6 py-3 text-sm font-medium text-white transition hover:bg-white/10"
            >
              Hablar con ventas
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}
