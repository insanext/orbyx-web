"use client";

import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  Bell,
  Bot,
  CalendarCheck2,
  CalendarDays,
  CheckCircle2,
  LayoutDashboard,
  Megaphone,
  MessageCircle,
  Power,
  RefreshCcw,
  Send,
  Sparkles,
  TrendingUp,
  Users,
  Zap,
} from "lucide-react";

const serif = { fontFamily: "var(--font-dm-serif), Georgia, serif" };

export default function OrbyxLandingPage() {
  const benefitItems = [
    { icon: Power, title: "Reservas 24/7", desc: "Sin perder clientes" },
    { icon: Zap, title: "Menos trabajo manual", desc: "Más tiempo para ti" },
    { icon: CheckCircle2, title: "Más reservas confirmadas", desc: "Menos ausencias" },
    { icon: Send, title: "Campañas masivas", desc: "Vende más" },
    { icon: LayoutDashboard, title: "Todo en un solo lugar", desc: "Fácil y completo" },
  ];

  const automationCards = [
    {
      icon: MessageCircle,
      title: "Responde al instante",
      desc: "Tus clientes escriben, Orbyx responde",
    },
    {
      icon: CalendarCheck2,
      title: "Agenda automáticamente",
      desc: "Convierte conversaciones en reservas",
    },
    {
      icon: Bell,
      title: "Confirma y recuerda",
      desc: "Menos ausencias, más clientes felices",
    },
    {
      icon: RefreshCcw,
      title: "Recupera y fideliza",
      desc: "Campañas y seguimiento automático",
    },
  ];

  const platformBenefits = [
    {
      icon: CalendarDays,
      title: "Agenda que se organiza sola",
      desc: "Horarios, staff y servicios sincronizados sin esfuerzo.",
    },
    {
      icon: CalendarCheck2,
      title: "Reservas online",
      desc: "Tus clientes reservan desde tu web o WhatsApp, a cualquier hora.",
    },
    {
      icon: Megaphone,
      title: "Campañas que recuperan clientes",
      desc: "Envía promociones y reactiva clientes que dejaron de venir.",
    },
    {
      icon: BarChart3,
      title: "Decisiones con datos reales",
      desc: "Métricas claras de reservas, ausencias y crecimiento.",
    },
    {
      icon: Users,
      title: "Multi staff y sucursales",
      desc: "Ideal para equipos y negocios en crecimiento.",
    },
  ];

  const steps = [
    { icon: MessageCircle, title: "El cliente escribe", desc: "por WhatsApp" },
    { icon: Bot, title: "Orbyx responde", desc: "y entiende su solicitud" },
    { icon: CalendarDays, title: "Agenda la reserva", desc: "automáticamente" },
    { icon: Bell, title: "Confirma y recuerda", desc: "y reduce ausencias" },
    { icon: TrendingUp, title: "Tú visualizas todo", desc: "y haces crecer tu negocio" },
  ];

  const ctaBadges = ["7 días gratis", "Sin tarjeta de crédito", "Cancelas cuando quieras"];

  return (
    <main
      style={{ fontFamily: "var(--font-dm-sans), system-ui, sans-serif" }}
      className="min-h-screen overflow-hidden bg-[#111318] text-[#eae6e1]"
    >
      {/* ── HERO ── */}
      <section className="relative">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_70%_0%,rgba(212,161,87,0.07),transparent_50%)]" />

        <div className="relative mx-auto max-w-[1480px] px-4 pb-10 pt-5 sm:px-6 lg:px-10">
          <header className="flex items-center justify-between gap-4">
            <Link href="/" className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#d4a157]/25 bg-[#d4a157]/10 text-[#d4a157]">
                <Sparkles className="h-5 w-5" />
              </span>
              <span className="text-2xl font-bold tracking-tight text-[#eae6e1]">Orbyx</span>
            </Link>

            <nav className="hidden items-center gap-9 text-sm font-medium text-[#8a8690] lg:flex">
              <Link href="#funciones" className="transition hover:text-[#eae6e1]">Funciones</Link>
              <Link href="/planes" className="transition hover:text-[#eae6e1]">Planes</Link>
              <Link href="#casos" className="transition hover:text-[#eae6e1]">Casos de uso</Link>
            </nav>

            <div className="flex items-center gap-2 sm:gap-3">
              <Link
                href="/login"
                className="inline-flex h-10 items-center justify-center rounded-lg border border-white/10 px-3 text-xs font-medium text-[#eae6e1] transition hover:border-white/20 hover:bg-white/5 sm:h-12 sm:px-6 sm:text-sm"
              >
                Iniciar sesión
              </Link>
              <Link
                href="/signup?plan=pro"
                className="hidden h-10 items-center justify-center rounded-lg bg-[#d4a157] px-5 text-sm font-bold text-[#111318] transition hover:-translate-y-0.5 hover:bg-[#e0b56e] sm:inline-flex sm:h-12"
              >
                Probar gratis
              </Link>
            </div>
          </header>

          <div className="grid gap-10 pb-8 pt-14 lg:grid-cols-[0.92fr_1.08fr] lg:items-center lg:gap-12 lg:pb-14 lg:pt-20">
            <div className="max-w-[660px]">
              <div className="inline-flex items-center gap-2 rounded-full border border-[#d4a157]/15 bg-[#d4a157]/5 px-3 py-2 text-xs font-medium text-[#d4a157]">
                Tu negocio, funcionando 24/7
              </div>

              <h1
                style={serif}
                className="mt-8 text-[40px] leading-[1.05] tracking-[-0.02em] text-[#eae6e1] sm:text-[54px] lg:text-[66px]"
              >
                Tu agenda, ordenada.
                <span className="block text-[#d4a157]">
                  Tus reservas, en automático.
                </span>
              </h1>

              <p className="mt-6 max-w-[560px] text-base leading-8 text-[#8a8690] sm:text-lg">
                Orbyx organiza horarios, sucursales y staff con reglas que tú
                defines, y responde por WhatsApp para confirmar citas sin que
                nadie tenga que estar pendiente del chat.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/signup?plan=pro"
                  className="inline-flex h-14 items-center justify-center gap-3 rounded-xl bg-[#d4a157] px-7 text-base font-bold text-[#111318] transition hover:-translate-y-0.5 hover:bg-[#e0b56e]"
                >
                  Probar gratis 7 días
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/planes"
                  className="inline-flex h-14 items-center justify-center rounded-xl border border-white/10 bg-white/[0.02] px-7 text-base font-semibold text-[#eae6e1] transition hover:border-white/20 hover:bg-white/[0.04]"
                >
                  Ver planes
                </Link>
              </div>

              <div className="mt-8 flex flex-col gap-3 text-sm text-[#8a8690] sm:flex-row sm:flex-wrap">
                {ctaBadges.map((badge) => (
                  <span key={badge} className="inline-flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-[#d4a157]" />
                    {badge}
                  </span>
                ))}
              </div>
            </div>

            <div className="relative min-h-[560px] lg:min-h-[660px]">
              <div className="absolute left-1/2 top-1/2 h-[460px] w-[460px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#d4a157]/[0.04] blur-[100px]" />

              <div className="relative mx-auto max-w-[390px] rounded-[28px] border border-white/[0.06] bg-[#191c22] p-3 shadow-[0_24px_64px_rgba(0,0,0,0.4)] lg:translate-x-[-34px]">
                <div className="rounded-[20px] border border-white/[0.06] bg-[#efe7dc] p-3 text-slate-950">
                  <div className="mb-3 flex items-center justify-between rounded-t-[14px] bg-[#191c22] px-3 py-3 text-[#eae6e1]">
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#25d366] text-white">
                        <MessageCircle className="h-7 w-7" />
                      </div>
                      <div>
                        <p className="text-sm font-bold">Orbyx Asistente</p>
                        <p className="text-xs text-[#8a8690]">en línea</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 text-[#8a8690]">
                      <span className="text-lg leading-none">+</span>
                      <span className="text-lg leading-none">⋮</span>
                    </div>
                  </div>

                  <div className="space-y-3 px-1 pb-1 text-sm">
                    <div className="max-w-[78%] rounded-xl rounded-tl-sm bg-white px-3 py-2 shadow-sm">
                      <p>¡Hola! 👋</p>
                      <p>¿En qué puedo ayudarte hoy?</p>
                      <p className="mt-1 text-right text-[10px] text-slate-400">11:30 a.m.</p>
                    </div>
                    <div className="ml-auto max-w-[72%] rounded-xl rounded-tr-sm bg-[#d7f8cb] px-3 py-2 shadow-sm">
                      <p>Quiero agendar hora</p>
                      <p className="mt-1 text-right text-[10px] text-slate-400">11:30 a.m.</p>
                    </div>
                    <div className="max-w-[78%] rounded-xl rounded-tl-sm bg-white px-3 py-2 shadow-sm">
                      <p>¡Perfecto! ¿Qué servicio necesitas?</p>
                      <p className="mt-1 text-right text-[10px] text-slate-400">11:30 a.m.</p>
                    </div>
                    <div className="ml-auto max-w-[74%] rounded-xl rounded-tr-sm bg-[#d7f8cb] px-3 py-2 shadow-sm">
                      <p>Consulta veterinaria</p>
                      <p className="mt-1 text-right text-[10px] text-slate-400">11:31 a.m.</p>
                    </div>
                    <div className="max-w-[88%] rounded-xl rounded-tl-sm bg-white px-3 py-2 shadow-sm">
                      <p className="mb-1">Tienes estos horarios disponibles:</p>
                      <p>📅 Hoy 16:00</p>
                      <p>📅 Mañana 10:00</p>
                      <p>📅 Mañana 16:30</p>
                      <p className="mt-1 text-right text-[10px] text-slate-400">11:31 a.m.</p>
                    </div>
                    <div className="ml-auto max-w-[72%] rounded-xl rounded-tr-sm bg-[#d7f8cb] px-3 py-2 shadow-sm">
                      <p>Mañana 10:00</p>
                      <p className="mt-1 text-right text-[10px] text-slate-400">11:31 a.m.</p>
                    </div>
                    <div className="max-w-[84%] rounded-xl rounded-tl-sm bg-white px-3 py-2 shadow-sm">
                      <p>¡Listo! ✅</p>
                      <p>Tu hora ha sido agendada. Te enviaremos un recordatorio.</p>
                      <p className="mt-1 text-right text-[10px] text-slate-400">11:30 a.m.</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-5 grid gap-3 lg:absolute lg:right-0 lg:top-16 lg:mt-0 lg:w-[260px]">
                {automationCards.map((card) => {
                  const Icon = card.icon;
                  return (
                    <div
                      key={card.title}
                      className="rounded-xl border border-white/[0.06] bg-[#191c22] p-4"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#d4a157]/10 text-[#d4a157]">
                          <Icon className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-[#eae6e1]">{card.title}</p>
                          <p className="mt-0.5 text-xs leading-5 text-[#8a8690]">{card.desc}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-white/[0.06] bg-[#191c22] p-3">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
              {benefitItems.map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.title} className="flex items-center gap-3 rounded-xl px-3 py-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#d4a157]/[0.08] text-[#d4a157]">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-[#eae6e1]">{item.title}</p>
                      <p className="mt-0.5 text-xs text-[#8a8690]">{item.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* ── FUNCIONES ── */}
      <section id="funciones" className="relative bg-[#111318] px-4 py-16 sm:px-6 lg:px-10">
        <div className="relative mx-auto grid max-w-[1360px] gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
          <div className="relative">
            <div className="relative overflow-hidden rounded-[28px] border border-white/[0.06] bg-[#191c22] p-3 shadow-[0_20px_50px_rgba(0,0,0,0.3)] sm:p-4">
              <div className="relative h-[300px] overflow-hidden rounded-[20px] border border-white/[0.06] bg-[#0e1016] sm:h-[410px] lg:h-[520px]">
                <Image
                  src="/images/mockup-dashboard.png"
                  alt="Dashboard real de Orbyx con agenda y reservas"
                  width={980}
                  height={650}
                  className="absolute bottom-[2%] left-[-13%] w-[88%] max-w-none scale-[1.24] opacity-95 sm:bottom-[4%] sm:left-[-12%] sm:w-[90%] lg:bottom-[6%] lg:left-[-10%] lg:w-[88%]"
                />
              </div>

              <div className="absolute right-5 top-1/2 hidden w-[228px] -translate-y-1/2 overflow-hidden rounded-[20px] border border-white/[0.08] bg-[#191c22]/95 p-3 text-[#eae6e1] shadow-[0_16px_40px_rgba(0,0,0,0.4)] sm:block md:right-7 md:w-[240px] lg:right-9 lg:w-[248px]">
                <div className="relative">
                  <div className="flex items-center gap-2">
                    <div className="flex h-6 w-6 items-center justify-center rounded-md bg-[#d4a157]/10 text-[#d4a157]">
                      <Bot className="h-3.5 w-3.5" />
                    </div>
                    <p className="text-[13px] font-bold tracking-tight">
                      Hoy Orbyx <span className="text-[#d4a157]">automatizó</span>
                    </p>
                  </div>

                  <div className="mt-3 rounded-xl bg-[#d4a157]/[0.06] px-2 pb-0.5 pt-1.5">
                    <svg viewBox="0 0 190 54" className="h-10 w-full overflow-visible" aria-hidden="true">
                      <path
                        d="M4 39 C24 39 30 27 48 24 C70 20 78 37 98 33 C118 29 122 17 144 19 C162 21 168 25 186 7"
                        fill="none"
                        stroke="#d4a157"
                        strokeWidth="3"
                        strokeLinecap="round"
                      />
                      <path
                        d="M4 39 C24 39 30 27 48 24 C70 20 78 37 98 33 C118 29 122 17 144 19 C162 21 168 25 186 7"
                        fill="none"
                        stroke="rgba(212,161,87,0.15)"
                        strokeWidth="10"
                        strokeLinecap="round"
                      />
                      <circle cx="186" cy="7" r="5" fill="#d4a157" />
                    </svg>
                  </div>

                  <div className="mt-2.5 space-y-2">
                    {[
                      { icon: CalendarCheck2, value: "18", label: "Reservas confirmadas", delta: "24%" },
                      { icon: Bell, value: "9", label: "Recordatorios enviados", delta: "18%" },
                      { icon: Users, value: "4", label: "Clientes recuperados", delta: "30%" },
                      { icon: MessageCircle, value: "12", label: "Conversaciones atendidas", delta: "20%" },
                    ].map((metric) => {
                      const Icon = metric.icon;
                      return (
                        <div
                          key={metric.label}
                          className="grid grid-cols-[36px_1fr_auto] items-center gap-2.5 border-b border-white/[0.06] pb-2 last:border-b-0 last:pb-0"
                        >
                          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#d4a157]/[0.08] text-[#d4a157]">
                            <Icon className="h-[18px] w-[18px]" />
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-baseline gap-2 whitespace-nowrap">
                              <p className="text-xl font-bold leading-none text-[#eae6e1]">{metric.value}</p>
                              <p className="text-[10px] text-[#8a8690]">{metric.label}</p>
                            </div>
                          </div>
                          <p className="text-[10px] font-bold text-[#d4a157]">+{metric.delta}</p>
                        </div>
                      );
                    })}
                  </div>

                  <div className="mt-3 flex items-center justify-between rounded-xl border border-[#d4a157]/10 bg-[#d4a157]/[0.06] px-3 py-2.5 text-[#d4a157]">
                    <div className="flex items-center gap-2">
                      <Zap className="h-4 w-4" />
                      <span className="text-sm font-bold">Automatización activa</span>
                    </div>
                    <span className="h-2 w-2 rounded-full bg-[#d4a157]" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:pl-8">
            <div className="inline-flex items-center rounded-full border border-[#d4a157]/15 bg-[#d4a157]/5 px-3 py-2 text-xs font-medium text-[#d4a157]">
              Plataforma completa
            </div>
            <h2
              style={serif}
              className="mt-5 text-3xl leading-tight tracking-[-0.02em] text-[#eae6e1] sm:text-4xl lg:text-[44px]"
            >
              Todo lo que tu negocio necesita,
              <span className="block text-[#d4a157]">en una sola plataforma.</span>
            </h2>

            <div className="mt-8 space-y-5">
              {platformBenefits.map((benefit) => {
                const Icon = benefit.icon;
                return (
                  <div key={benefit.title} className="flex gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#d4a157]/[0.08] text-[#d4a157]">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-bold text-[#eae6e1]">{benefit.title}</p>
                      <p className="mt-1 text-sm leading-6 text-[#8a8690]">{benefit.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* ── CASOS DE USO ── */}
      <section id="casos" className="relative px-4 py-16 sm:px-6 lg:px-10">
        <div className="mx-auto max-w-[1360px] rounded-[24px] border border-white/[0.06] bg-[#191c22] p-5 sm:p-8">
          <div className="mx-auto max-w-2xl text-center">
            <div className="mx-auto inline-flex rounded-full border border-[#d4a157]/15 bg-[#d4a157]/5 px-3 py-2 text-xs font-medium text-[#d4a157]">
              Así de simple
            </div>
            <h2
              style={serif}
              className="mt-4 text-3xl tracking-[-0.02em] text-[#eae6e1] sm:text-4xl"
            >
              Reservar debería ser así de fácil.
            </h2>
          </div>

          <div className="mt-10 grid gap-6 lg:grid-cols-5 lg:gap-4">
            {steps.map((step, index) => {
              const Icon = step.icon;
              return (
                <div key={step.title} className="relative">
                  {index < steps.length - 1 && (
                    <div className="absolute left-[calc(50%+48px)] top-8 hidden h-px w-[calc(100%-96px)] bg-white/[0.06] lg:block" />
                  )}
                  <div className="flex flex-col items-center text-center">
                    <div className="flex items-baseline gap-2">
                      <span
                        style={serif}
                        className="text-[40px] leading-none text-[#d4a157]/25"
                      >
                        {index + 1}
                      </span>
                      <Icon className="h-6 w-6 text-[#d4a157]" />
                    </div>
                    <div className="mt-3">
                      <p className="text-sm font-bold text-[#eae6e1]">{step.title}</p>
                      <p className="mt-1 text-sm leading-5 text-[#8a8690]">{step.desc}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── CTA FINAL ── */}
      <section className="px-4 pb-14 pt-2 sm:px-6 lg:px-10 lg:pb-20">
        <div className="relative mx-auto max-w-[1360px] overflow-hidden rounded-[26px] border border-white/[0.06] bg-[#191c22] p-6 shadow-[0_20px_50px_rgba(0,0,0,0.25)] sm:p-9 lg:p-12">
          <div className="absolute right-0 top-0 h-60 w-60 rounded-full bg-[#d4a157]/[0.05] blur-[80px]" />
          <div className="relative grid gap-8 lg:grid-cols-[1fr_0.72fr] lg:items-center">
            <div>
              <h2
                style={serif}
                className="text-3xl leading-tight tracking-[-0.02em] text-[#eae6e1] sm:text-4xl"
              >
                Empieza gratis.
                <span className="block text-[#d4a157]">Automatiza tu negocio hoy.</span>
              </h2>

              <div className="mt-6 flex flex-col gap-3 text-sm text-[#8a8690] sm:flex-row sm:flex-wrap">
                {ctaBadges.map((badge) => (
                  <span key={badge} className="inline-flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-[#d4a157]" />
                    {badge}
                  </span>
                ))}
              </div>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/signup?plan=pro"
                  className="inline-flex h-14 items-center justify-center gap-3 rounded-xl bg-[#d4a157] px-8 text-base font-bold text-[#111318] transition hover:-translate-y-0.5 hover:bg-[#e0b56e]"
                >
                  Probar gratis 7 días
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/planes"
                  className="inline-flex h-14 items-center justify-center rounded-xl border border-white/10 bg-white/[0.02] px-8 text-base font-semibold text-[#eae6e1] transition hover:border-white/20 hover:bg-white/[0.04]"
                >
                  Ver planes
                </Link>
              </div>
            </div>

            <div className="relative rounded-[22px] border border-white/[0.06] bg-[#111318] p-5">
              <div className="flex -space-x-3">
                {["CM", "VR", "AG", "MS", "OT"].map((initial) => (
                  <div
                    key={initial}
                    className="flex h-11 w-11 items-center justify-center rounded-full border-2 border-[#191c22] bg-[#d4a157]/15 text-xs font-bold text-[#d4a157]"
                  >
                    {initial}
                  </div>
                ))}
              </div>
              <div className="mt-5 flex text-[#d4a157]">
                {Array.from({ length: 5 }).map((_, index) => (
                  <span key={index}>★</span>
                ))}
              </div>
              <p
                style={serif}
                className="mt-3 max-w-[300px] text-xl leading-8 text-[#eae6e1]"
              >
                Más de 500 negocios ya confían en Orbyx.
              </p>
              <p className="mt-2 text-sm leading-6 text-[#8a8690]">
                Veterinarias, clases, talleres y servicios profesionales operando con menos carga manual.
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
