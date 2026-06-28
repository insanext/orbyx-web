"use client";

import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  Bell,
  Bot,
  Building2,
  CalendarCheck2,
  CalendarDays,
  Check,
  CheckCircle2,
  Clock3,
  LayoutDashboard,
  Megaphone,
  MessageCircle,
  PlayCircle,
  Power,
  RefreshCcw,
  Send,
  Sparkles,
  TrendingUp,
  Users,
  Zap,
} from "lucide-react";

export default function OrbyxLandingPage() {
  const benefitItems = [
    { icon: Power, title: "Reservas 24/7", desc: "Sin perder clientes" },
    { icon: Zap, title: "Menos trabajo manual", desc: "Más tiempo para ti" },
    {
      icon: CheckCircle2,
      title: "Más reservas confirmadas",
      desc: "Menos ausencias",
    },
    { icon: Send, title: "Campañas masivas", desc: "Vende más" },
    {
      icon: LayoutDashboard,
      title: "Todo en un solo lugar",
      desc: "Fácil y completo",
    },
  ];

  const automationCards = [
    {
      icon: MessageCircle,
      title: "Responde al instante",
      desc: "Atiende WhatsApp 24/7 con IA",
      tone: "from-emerald-400 to-cyan-300",
    },
    {
      icon: CalendarCheck2,
      title: "Agenda automáticamente",
      desc: "Convierte conversaciones en reservas",
      tone: "from-fuchsia-500 to-violet-400",
    },
    {
      icon: Bell,
      title: "Confirma y recuerda",
      desc: "Menos ausencias, más clientes felices",
      tone: "from-blue-500 to-cyan-400",
    },
    {
      icon: RefreshCcw,
      title: "Recupera y fideliza",
      desc: "Campañas y seguimiento automático",
      tone: "from-orange-400 to-amber-300",
    },
  ];

  const platformBenefits = [
    {
      icon: CalendarDays,
      title: "Agenda inteligente",
      desc: "Organiza tu tiempo, staff y servicios fácilmente.",
      tone: "text-cyan-300 bg-cyan-400/10",
    },
    {
      icon: CalendarCheck2,
      title: "Reservas online",
      desc: "Tus clientes reservan desde tu web o WhatsApp.",
      tone: "text-orange-300 bg-orange-400/10",
    },
    {
      icon: Megaphone,
      title: "Campañas masivas",
      desc: "Envía promociones y recupera clientes inactivos.",
      tone: "text-rose-300 bg-rose-400/10",
    },
    {
      icon: BarChart3,
      title: "Reportes y métricas",
      desc: "Toma mejores decisiones con datos reales.",
      tone: "text-indigo-300 bg-indigo-400/10",
    },
    {
      icon: Users,
      title: "Multi staff y sucursales",
      desc: "Ideal para equipos y negocios en crecimiento.",
      tone: "text-yellow-300 bg-yellow-400/10",
    },
  ];

  const steps = [
    { icon: MessageCircle, title: "El cliente escribe", desc: "por WhatsApp" },
    { icon: Bot, title: "La IA responde", desc: "y entiende su solicitud" },
    { icon: CalendarDays, title: "Agenda la reserva", desc: "automáticamente" },
    { icon: Bell, title: "Confirma, recuerda", desc: "y reduce ausencias" },
    { icon: TrendingUp, title: "Tú visualizas todo", desc: "y haces crecer tu negocio" },
  ];

  const ctaBadges = ["7 días gratis", "Sin tarjeta de crédito", "Cancelas cuando quieras"];

  return (
    <main className="min-h-screen overflow-hidden bg-[#020617] text-white">
      <section className="relative">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_86%_18%,rgba(124,58,237,0.30),transparent_30%),radial-gradient(circle_at_14%_42%,rgba(8,145,178,0.20),transparent_28%),linear-gradient(180deg,#030712_0%,#020617_58%,#03111f_100%)]" />
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-300/40 to-transparent" />

        <div className="relative mx-auto max-w-[1480px] px-4 pb-10 pt-5 sm:px-6 lg:px-10">
          <header className="flex items-center justify-between gap-4">
            <Link href="/" className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-2xl border border-emerald-300/30 bg-emerald-300/10 text-emerald-300 shadow-[0_0_24px_rgba(45,212,191,0.35)]">
                <Sparkles className="h-5 w-5" />
              </span>
              <span className="text-2xl font-bold tracking-tight">Orbyx</span>
            </Link>

            <nav className="hidden items-center gap-9 text-sm font-semibold text-slate-200 lg:flex">
              <Link href="#funciones" className="transition hover:text-white">
                Funciones
              </Link>
              <Link href="/planes" className="transition hover:text-white">
                Planes
              </Link>
              <Link href="#casos" className="transition hover:text-white">
                Casos de uso
              </Link>
            </nav>

            <div className="flex items-center gap-2 sm:gap-3">
              <Link
                href="/login"
                className="inline-flex h-10 items-center justify-center rounded-lg border border-white/20 px-3 text-xs font-semibold text-white transition hover:border-white/40 hover:bg-white/10 sm:h-12 sm:px-6 sm:text-sm"
              >
                Iniciar sesión
              </Link>
              <Link
                href="/signup?plan=pro"
                className="hidden h-10 items-center justify-center rounded-lg bg-[#28e6b0] px-5 text-sm font-bold text-slate-950 shadow-[0_18px_40px_rgba(45,212,191,0.22)] transition hover:-translate-y-0.5 hover:bg-[#42f0bf] sm:inline-flex sm:h-12"
              >
                Probar gratis
              </Link>
            </div>
          </header>

          <div className="grid gap-10 pb-8 pt-12 lg:grid-cols-[0.92fr_1.08fr] lg:items-center lg:gap-12 lg:pb-14 lg:pt-16">
            <div className="max-w-[660px]">
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-300/20 bg-emerald-300/8 px-3 py-2 text-xs font-semibold text-emerald-200 shadow-[0_0_30px_rgba(45,212,191,0.12)]">
                <span className="h-2 w-2 rounded-full bg-emerald-300 shadow-[0_0_12px_rgba(45,212,191,0.9)]" />
                Tu negocio, funcionando 24/7
                <span className="h-1 w-1 rounded-full bg-emerald-300" />
              </div>

              <h1 className="mt-7 text-[42px] font-black leading-[0.98] tracking-[-0.045em] text-white sm:text-[58px] lg:text-[72px]">
                La IA responde,
                <span className="block bg-gradient-to-r from-[#40f0c2] via-[#3ee5df] to-[#9df3ff] bg-clip-text text-transparent">
                  agenda y recupera
                </span>
                clientes por ti.
              </h1>

              <p className="mt-6 max-w-[590px] text-base leading-8 text-slate-300 sm:text-lg">
                Orbyx atiende por WhatsApp, agenda reservas automáticamente,
                confirma citas y te ayuda a vender más sin que tengas que estar
                pendiente.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/signup?plan=pro"
                  className="inline-flex h-14 items-center justify-center gap-3 rounded-xl bg-[#28e6b0] px-7 text-base font-bold text-slate-950 shadow-[0_18px_45px_rgba(45,212,191,0.26)] transition hover:-translate-y-0.5 hover:bg-[#48f0bf]"
                >
                  Probar gratis 7 días
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/planes"
                  className="inline-flex h-14 items-center justify-center gap-2 rounded-xl border border-white/25 bg-white/[0.03] px-7 text-base font-bold text-white transition hover:border-white/45 hover:bg-white/[0.07]"
                >
                  Ver cómo funciona
                  <PlayCircle className="h-4 w-4" />
                </Link>
              </div>

              <div className="mt-8 flex flex-col gap-3 text-sm text-slate-300 sm:flex-row sm:flex-wrap">
                {ctaBadges.map((badge) => (
                  <span key={badge} className="inline-flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-300" />
                    {badge}
                  </span>
                ))}
              </div>
            </div>

            <div className="relative min-h-[560px] lg:min-h-[660px]">
              <div className="absolute left-1/2 top-1/2 h-[540px] w-[540px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-fuchsia-600/25 blur-[120px]" />
              <div className="absolute left-[52%] top-[48%] h-[520px] w-[520px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-500/12 blur-[100px]" />

              <div className="relative mx-auto max-w-[390px] rounded-[30px] border border-white/20 bg-slate-950/70 p-3 shadow-[0_30px_90px_rgba(0,0,0,0.45)] ring-1 ring-cyan-300/10 backdrop-blur-xl lg:translate-x-[-34px]">
                <div className="rounded-[22px] border border-white/12 bg-[#efe7dc] p-3 text-slate-950">
                  <div className="mb-3 flex items-center justify-between rounded-t-[16px] bg-[#111827] px-3 py-3 text-white">
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#25d366] text-white ring-4 ring-emerald-400/20">
                        <MessageCircle className="h-7 w-7" />
                      </div>
                      <div>
                        <p className="text-sm font-bold">Orbyx Asistente</p>
                        <p className="text-xs text-slate-400">en línea</p>
                      </div>
                      <CheckCircle2 className="h-4 w-4 text-emerald-300" />
                    </div>
                    <div className="flex items-center gap-3 text-slate-300">
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

              <div className="mt-5 grid gap-3 lg:absolute lg:right-0 lg:top-16 lg:mt-0 lg:w-[270px]">
                {automationCards.map((card, index) => {
                  const Icon = card.icon;

                  return (
                    <div
                      key={card.title}
                      className="relative rounded-2xl border border-white/12 bg-white/[0.075] p-4 shadow-[0_20px_45px_rgba(0,0,0,0.26)] backdrop-blur-xl lg:ml-0"
                    >
                      <span
                        className={`absolute -left-3 top-1/2 hidden h-3 w-3 -translate-y-1/2 rounded-full bg-gradient-to-br ${card.tone} shadow-[0_0_18px_currentColor] lg:block`}
                      />
                      {index < automationCards.length - 1 ? (
                        <span className="absolute -bottom-3 left-7 hidden h-3 w-px bg-white/15 lg:block" />
                      ) : null}
                      <div className="flex items-center gap-3">
                        <div className={`flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br ${card.tone} text-slate-950 shadow-[0_14px_28px_rgba(0,0,0,0.25)]`}>
                          <Icon className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-white">{card.title}</p>
                          <p className="mt-1 text-xs leading-5 text-slate-300">{card.desc}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="rounded-[24px] border border-white/12 bg-white/[0.065] p-3 shadow-[0_20px_60px_rgba(0,0,0,0.22)] backdrop-blur-xl lg:mx-6">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
              {benefitItems.map((item) => {
                const Icon = item.icon;

                return (
                  <div key={item.title} className="flex items-center gap-3 rounded-2xl px-3 py-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-cyan-400/10 text-cyan-300 ring-1 ring-cyan-300/10">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white">{item.title}</p>
                      <p className="mt-1 text-xs text-slate-400">{item.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      <section id="funciones" className="relative bg-[#020617] px-4 py-10 sm:px-6 lg:px-10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_16%_42%,rgba(14,165,233,0.16),transparent_32%)]" />
        <div className="relative mx-auto grid max-w-[1360px] gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
          <div className="relative">
            <div className="absolute -inset-3 rounded-[34px] bg-cyan-500/10 blur-3xl" />
            <div className="relative overflow-hidden rounded-[32px] border border-white/12 bg-white/[0.055] p-3 shadow-[0_28px_80px_rgba(0,0,0,0.35)] backdrop-blur-xl sm:p-4">
              <div className="relative h-[300px] overflow-hidden rounded-[24px] border border-white/10 bg-[#020817] sm:h-[410px] lg:h-[520px]">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_36%_45%,rgba(34,211,238,0.20),transparent_34%),radial-gradient(circle_at_78%_58%,rgba(16,185,129,0.18),transparent_30%)]" />
                <Image
                  src="/images/mockup-dashboard.png"
                  alt="Dashboard real de Orbyx con agenda y reservas"
                  width={980}
                  height={650}
                  className="absolute bottom-[2%] left-[-13%] w-[88%] max-w-none scale-[1.24] opacity-95 drop-shadow-[0_28px_45px_rgba(8,47,73,0.55)] sm:bottom-[4%] sm:left-[-12%] sm:w-[90%] lg:bottom-[6%] lg:left-[-10%] lg:w-[88%]"
                />
              </div>

              <div className="absolute right-5 top-1/2 hidden w-[228px] -translate-y-1/2 overflow-hidden rounded-[22px] border border-emerald-300/50 bg-[#061623]/90 p-3 text-white shadow-[0_0_34px_rgba(16,185,129,0.24),0_24px_60px_rgba(0,0,0,0.45)] ring-1 ring-cyan-300/20 backdrop-blur-xl sm:block md:right-7 md:w-[240px] lg:right-9 lg:w-[248px]">
                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-emerald-300/80 to-transparent" />
                <div className="absolute -right-10 -top-10 h-28 w-28 rounded-full bg-emerald-400/20 blur-3xl" />
                <div className="absolute -bottom-10 -left-10 h-28 w-28 rounded-full bg-cyan-400/15 blur-3xl" />

                <div className="relative">
                  <div className="flex items-center gap-2">
                    <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-violet-400/12 text-violet-200 ring-1 ring-violet-300/20">
                      <Bot className="h-3.5 w-3.5" />
                    </div>
                    <p className="text-[13px] font-black tracking-tight">
                      Hoy Orbyx <span className="text-emerald-300">automatizó</span>
                    </p>
                  </div>

                  <div className="mt-3 rounded-2xl bg-gradient-to-b from-emerald-300/10 to-transparent px-2 pb-0.5 pt-1.5">
                    <svg
                      viewBox="0 0 190 54"
                      className="h-10 w-full overflow-visible"
                      aria-hidden="true"
                    >
                      <path
                        d="M4 39 C24 39 30 27 48 24 C70 20 78 37 98 33 C118 29 122 17 144 19 C162 21 168 25 186 7"
                        fill="none"
                        stroke="url(#automationLine)"
                        strokeWidth="3.5"
                        strokeLinecap="round"
                      />
                      <path
                        d="M4 39 C24 39 30 27 48 24 C70 20 78 37 98 33 C118 29 122 17 144 19 C162 21 168 25 186 7"
                        fill="none"
                        stroke="rgba(16,185,129,0.28)"
                        strokeWidth="10"
                        strokeLinecap="round"
                      />
                      <circle cx="186" cy="7" r="6" fill="#22f5a7" />
                      <defs>
                        <linearGradient id="automationLine" x1="0" x2="1" y1="0" y2="0">
                          <stop stopColor="#22d3ee" />
                          <stop offset="0.55" stopColor="#22f5a7" />
                          <stop offset="1" stopColor="#86efac" />
                        </linearGradient>
                      </defs>
                    </svg>
                  </div>

                  <div className="mt-2.5 space-y-2">
                    {[
                      {
                        icon: CalendarCheck2,
                        value: "18",
                        label: "Reservas confirmadas",
                        delta: "24%",
                        tone: "bg-emerald-400/18 text-emerald-300",
                      },
                      {
                        icon: Bell,
                        value: "9",
                        label: "Recordatorios enviados",
                        delta: "18%",
                        tone: "bg-fuchsia-400/18 text-fuchsia-200",
                      },
                      {
                        icon: Users,
                        value: "4",
                        label: "Clientes recuperados",
                        delta: "30%",
                        tone: "bg-amber-400/18 text-amber-200",
                      },
                      {
                        icon: MessageCircle,
                        value: "12",
                        label: "Conversaciones atendidas",
                        delta: "20%",
                        tone: "bg-blue-400/18 text-blue-200",
                      },
                    ].map((metric) => {
                      const Icon = metric.icon;

                      return (
                        <div
                          key={metric.label}
                          className="grid grid-cols-[38px_1fr_auto] items-center gap-2.5 border-b border-white/8 pb-2 last:border-b-0 last:pb-0"
                        >
                          <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${metric.tone}`}>
                            <Icon className="h-[18px] w-[18px]" />
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-baseline gap-2 whitespace-nowrap">
                              <p className="text-xl font-black leading-none text-white">
                                {metric.value}
                              </p>
                              <p className="text-[10px] text-slate-300">
                                {metric.label}
                              </p>
                            </div>
                          </div>
                          <p className="text-[0px] font-black text-emerald-300">
                            <span className="text-[10px]">+{metric.delta}</span>
                            ↑ {metric.delta}
                          </p>
                        </div>
                      );
                    })}
                  </div>

                  <div className="mt-3 flex items-center justify-between rounded-2xl border border-emerald-300/12 bg-emerald-300/8 px-3 py-2.5 text-emerald-300">
                    <div className="flex items-center gap-2">
                      <Zap className="h-4 w-4" />
                      <span className="text-sm font-black">IA activa ahora</span>
                    </div>
                    <span className="h-2.5 w-2.5 rounded-full bg-emerald-300 shadow-[0_0_16px_rgba(45,212,191,0.95)]" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:pl-8">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-300/20 bg-emerald-300/8 px-3 py-2 text-xs font-semibold text-emerald-200">
              <span className="h-2 w-2 rounded-full bg-emerald-300" />
              Plataforma completa
            </div>
            <h2 className="mt-5 text-3xl font-black leading-tight tracking-[-0.035em] sm:text-4xl lg:text-5xl">
              Todo lo que tu negocio necesita,
              <span className="block bg-gradient-to-r from-cyan-200 to-emerald-200 bg-clip-text text-transparent">
                en una sola plataforma.
              </span>
            </h2>

            <div className="mt-8 space-y-5">
              {platformBenefits.map((benefit) => {
                const Icon = benefit.icon;

                return (
                  <div key={benefit.title} className="flex gap-4">
                    <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${benefit.tone}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-bold text-white">{benefit.title}</p>
                      <p className="mt-1 text-sm leading-6 text-slate-300">{benefit.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      <section id="casos" className="relative px-4 py-10 sm:px-6 lg:px-10">
        <div className="mx-auto max-w-[1360px] rounded-[28px] border border-white/12 bg-white/[0.045] p-5 shadow-[0_30px_90px_rgba(0,0,0,0.24)] backdrop-blur-xl sm:p-8">
          <div className="mx-auto max-w-2xl text-center">
            <div className="mx-auto inline-flex rounded-full border border-emerald-300/20 bg-emerald-300/8 px-3 py-2 text-xs font-semibold text-emerald-200">
              Así de simple
            </div>
            <h2 className="mt-4 text-3xl font-black tracking-[-0.035em] sm:text-4xl">
              La IA trabaja. Tú creces.
            </h2>
          </div>

          <div className="mt-8 grid gap-5 lg:grid-cols-5 lg:gap-3">
            {steps.map((step, index) => {
              const Icon = step.icon;

              return (
                <div key={step.title} className="relative">
                  {index < steps.length - 1 ? (
                    <div className="absolute left-[calc(50%+44px)] top-12 hidden h-px w-[calc(100%-88px)] bg-gradient-to-r from-white/45 to-white/10 lg:block">
                      <span className="absolute left-1/2 top-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white" />
                    </div>
                  ) : null}
                  <div className="flex flex-col items-center text-center">
                    <div className="flex h-20 w-20 items-center justify-center rounded-full border border-white/10 bg-gradient-to-br from-cyan-300/20 to-indigo-500/20 text-cyan-200 shadow-[0_18px_40px_rgba(0,0,0,0.25)] sm:h-24 sm:w-24">
                      <Icon className="h-9 w-9" />
                    </div>
                    <div className="mt-4 flex items-start gap-2 text-left sm:text-center">
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-emerald-300/60 text-sm font-bold text-emerald-200">
                        {index + 1}
                      </span>
                      <div>
                        <p className="text-sm font-semibold text-white">{step.title}</p>
                        <p className="mt-1 text-sm leading-5 text-slate-300">{step.desc}</p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section id="recursos" className="px-4 pb-12 pt-2 sm:px-6 lg:px-10 lg:pb-16">
        <div className="relative mx-auto max-w-[1360px] overflow-hidden rounded-[30px] border border-white/12 bg-[linear-gradient(135deg,rgba(20,184,166,0.16)_0%,rgba(30,41,59,0.82)_48%,rgba(124,58,237,0.28)_100%)] p-6 shadow-[0_30px_90px_rgba(0,0,0,0.28)] sm:p-9 lg:p-12">
          <div className="absolute right-0 top-0 h-72 w-72 rounded-full bg-fuchsia-500/20 blur-[90px]" />
          <div className="relative grid gap-8 lg:grid-cols-[1fr_0.72fr] lg:items-center">
            <div>
              <h2 className="text-3xl font-black leading-tight tracking-[-0.035em] sm:text-4xl">
                Empieza gratis.
                <span className="block bg-gradient-to-r from-cyan-200 to-emerald-200 bg-clip-text text-transparent">
                  Automatiza tu negocio hoy.
                </span>
              </h2>

              <div className="mt-6 flex flex-col gap-3 text-sm text-slate-200 sm:flex-row sm:flex-wrap">
                {ctaBadges.map((badge) => (
                  <span key={badge} className="inline-flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-300" />
                    {badge}
                  </span>
                ))}
              </div>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/signup?plan=pro"
                  className="inline-flex h-14 items-center justify-center gap-3 rounded-xl bg-[#28e6b0] px-8 text-base font-bold text-slate-950 shadow-[0_18px_45px_rgba(45,212,191,0.26)] transition hover:-translate-y-0.5 hover:bg-[#48f0bf]"
                >
                  Probar gratis 7 días
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/planes"
                  className="inline-flex h-14 items-center justify-center rounded-xl border border-white/25 bg-white/[0.03] px-8 text-base font-bold text-white transition hover:border-white/45 hover:bg-white/[0.07]"
                >
                  Ver planes
                </Link>
              </div>
            </div>

            <div className="relative rounded-[26px] border border-white/10 bg-white/[0.06] p-5 backdrop-blur-xl">
              <div className="flex -space-x-3">
                {["CM", "VR", "AG", "MS", "OT"].map((initial) => (
                  <div
                    key={initial}
                    className="flex h-11 w-11 items-center justify-center rounded-full border-2 border-[#1e1b4b] bg-gradient-to-br from-slate-100 to-cyan-100 text-xs font-black text-slate-900"
                  >
                    {initial}
                  </div>
                ))}
              </div>
              <div className="mt-5 flex text-yellow-300">
                {Array.from({ length: 5 }).map((_, index) => (
                  <span key={index}>★</span>
                ))}
              </div>
              <p className="mt-3 max-w-[300px] text-xl font-bold leading-8 text-white">
                Más de 500 negocios ya confían en Orbyx.
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-300">
                Veterinarias, clases, talleres y servicios profesionales operando con menos carga manual.
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
