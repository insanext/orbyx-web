"use client";

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
import { TRIAL_LABEL } from "@/lib/plans";

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
    { icon: MessageCircle, title: "Responde al instante", desc: "Tus clientes escriben, Orbyx responde" },
    { icon: CalendarCheck2, title: "Agenda automáticamente", desc: "Convierte conversaciones en reservas" },
    { icon: Bell, title: "Confirma y recuerda", desc: "Menos ausencias, más clientes felices" },
    { icon: RefreshCcw, title: "Recupera y fideliza", desc: "Campañas y seguimiento automático" },
  ];

  const platformBenefits = [
    { icon: CalendarDays, title: "Agenda que se organiza sola", desc: "Horarios, staff y servicios sincronizados sin esfuerzo." },
    { icon: CalendarCheck2, title: "Reservas online", desc: "Tus clientes reservan desde tu web o WhatsApp, a cualquier hora." },
    { icon: Megaphone, title: "Campañas que recuperan clientes", desc: "Envía promociones y reactiva clientes que dejaron de venir." },
    { icon: BarChart3, title: "Decisiones con datos reales", desc: "Métricas claras de reservas, ausencias y crecimiento." },
    { icon: Users, title: "Multi staff y sucursales", desc: "Ideal para equipos y negocios en crecimiento." },
  ];

  const steps = [
    { icon: MessageCircle, title: "El cliente escribe", desc: "por WhatsApp" },
    { icon: Bot, title: "Orbyx responde", desc: "y entiende su solicitud" },
    { icon: CalendarDays, title: "Agenda la reserva", desc: "automáticamente" },
    { icon: Bell, title: "Confirma y recuerda", desc: "y reduce ausencias" },
    { icon: TrendingUp, title: "Tú visualizas todo", desc: "y haces crecer tu negocio" },
  ];

  const ctaBadges = [`${TRIAL_LABEL} gratis`, "Sin tarjeta de crédito", "Cancelas cuando quieras"];

  const agendaStaff = [
    { name: "Camila R.", role: "Estilista", photo: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&h=80&fit=crop&crop=face" },
    { name: "Andrés M.", role: "Barbero", photo: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop&crop=face" },
    { name: "Sofía P.", role: "Estilista", photo: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=80&h=80&fit=crop&crop=face" },
  ];

  const agendaHours = ["09:00", "10:00", "11:00", "12:00", "13:00"];

  const agendaAppts = [
    { col: 0, top: 0, h: 67, time: "09:00", service: "Corte", client: "M. González", status: "booked" as const },
    { col: 0, top: 135, h: 90, time: "10:30", service: "Tinte", client: "P. Soto", status: "completed" as const },
    { col: 0, top: 315, h: 45, time: "12:30", service: "Brushing", client: "L. Díaz", status: "booked" as const },
    { col: 1, top: 45, h: 67, time: "09:30", service: "Manicure", client: "C. Rojas", status: "booked" as const },
    { col: 1, top: 180, h: 45, time: "11:00", service: "Pedicure", client: "V. Torres", status: "booked" as const },
    { col: 1, top: 360, h: 90, time: "13:00", service: "Uñas gel", client: "A. Muñoz", status: "completed" as const },
    { col: 2, top: 0, h: 90, time: "09:00", service: "Masaje", client: "R. Silva", status: "booked" as const },
    { col: 2, top: 135, h: 45, time: "10:30", service: "Facial", client: "I. Vargas", status: "completed" as const },
    { col: 2, top: 270, h: 135, time: "12:00", service: "Depilación", client: "F. Herrera", status: "booked" as const },
  ];

  return (
    <main
      style={{ fontFamily: "var(--font-dm-sans), system-ui, sans-serif" }}
      className="min-h-screen overflow-hidden bg-[#fafafa] text-[#111]"
    >
      {/* ── HERO ── */}
      <section className="relative">
        <div className="relative mx-auto max-w-[1480px] px-4 pb-10 pt-5 sm:px-6 lg:px-10">
          <header className="flex items-center justify-between gap-4">
            <Link href="/" className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#e5e5e5] bg-[#f0f0f0] text-[#333]">
                <Sparkles className="h-5 w-5" />
              </span>
              <span className="text-2xl font-bold tracking-tight text-[#111]">Orbyx</span>
            </Link>

            <nav className="hidden items-center gap-9 text-sm font-medium text-[#6b6b6b] lg:flex">
              <Link href="#funciones" className="transition hover:text-[#111]">Funciones</Link>
              <Link href="/planes" className="transition hover:text-[#111]">Planes</Link>
              <Link href="#casos" className="transition hover:text-[#111]">Casos de uso</Link>
            </nav>

            <div className="flex items-center gap-2 sm:gap-3">
              <Link
                href="/login"
                className="inline-flex h-10 items-center justify-center rounded-lg border border-[#e0e0e0] px-3 text-xs font-medium text-[#111] transition hover:border-[#bbb] hover:bg-[#f5f5f5] sm:h-12 sm:px-6 sm:text-sm"
              >
                Iniciar sesión
              </Link>
              <Link
                href="/signup?plan=pro"
                className="hidden h-10 items-center justify-center rounded-lg bg-gradient-to-br from-[#1a1a1a] to-[#333] px-5 text-sm font-bold text-white shadow-[0_0_20px_rgba(0,0,0,0.10),0_6px_16px_-4px_rgba(0,0,0,0.18)] transition hover:-translate-y-0.5 hover:from-[#2a2a2a] hover:to-[#444] hover:shadow-[0_0_28px_rgba(0,0,0,0.14),0_10px_24px_-4px_rgba(0,0,0,0.24)] sm:inline-flex sm:h-12"
              >
                Probar gratis
              </Link>
            </div>
          </header>

          <div className="grid gap-10 pb-8 pt-14 lg:grid-cols-[0.92fr_1.08fr] lg:items-center lg:gap-12 lg:pb-14 lg:pt-20">
            <div className="max-w-[660px]">
              <div className="inline-flex items-center gap-2 rounded-full border border-[#e5e5e5] bg-[#f0f0f0] px-3 py-2 text-xs font-medium text-[#333]">
                Tu negocio, funcionando 24/7
              </div>

              <h1
                style={serif}
                className="mt-8 text-[40px] leading-[1.05] tracking-[-0.02em] text-[#111] sm:text-[54px] lg:text-[66px]"
              >
                Tu agenda, ordenada.
                <span className="block">Tus reservas, en automático.</span>
              </h1>

              <p className="mt-6 max-w-[560px] text-base leading-8 text-[#6b6b6b] sm:text-lg">
                Orbyx organiza horarios, sucursales y staff con reglas que tú
                defines, y responde por WhatsApp para confirmar citas sin que
                nadie tenga que estar pendiente del chat.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/signup?plan=pro"
                  className="inline-flex h-14 items-center justify-center gap-3 rounded-xl bg-gradient-to-br from-[#1a1a1a] to-[#333] px-7 text-base font-bold text-white shadow-[0_0_25px_rgba(0,0,0,0.12),0_8px_20px_-6px_rgba(0,0,0,0.22)] transition hover:-translate-y-0.5 hover:from-[#2a2a2a] hover:to-[#444] hover:shadow-[0_0_35px_rgba(0,0,0,0.18),0_12px_28px_-6px_rgba(0,0,0,0.30)]"
                >
                  Probar gratis {TRIAL_LABEL}
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/planes"
                  className="inline-flex h-14 items-center justify-center rounded-xl border border-[#e0e0e0] px-7 text-base font-semibold text-[#111] transition hover:border-[#bbb] hover:bg-[#f5f5f5]"
                >
                  Ver planes
                </Link>
              </div>

              <div className="mt-8 flex flex-col gap-3 text-sm text-[#6b6b6b] sm:flex-row sm:flex-wrap">
                {ctaBadges.map((badge) => (
                  <span key={badge} className="inline-flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-[#333]" />
                    {badge}
                  </span>
                ))}
              </div>
            </div>

            {/* WhatsApp mockup + automation cards */}
            <div className="relative min-h-[560px] lg:min-h-[660px]">
              <div className="relative mx-auto max-w-[390px] rounded-[28px] border border-[#e5e5e5] bg-[#1a1a1a] p-3 shadow-[0_20px_50px_rgba(0,0,0,0.12)] lg:translate-x-[-34px]">
                <div className="rounded-[20px] border border-[#333] bg-[#efe7dc] p-3 text-slate-950">
                  <div className="mb-3 flex items-center justify-between rounded-t-[14px] bg-[#1a1a1a] px-3 py-3 text-white">
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#25d366] text-white">
                        <MessageCircle className="h-7 w-7" />
                      </div>
                      <div>
                        <p className="text-sm font-bold">Orbyx Asistente</p>
                        <p className="text-xs text-[#888]">en línea</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 text-[#888]">
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
                      className="rounded-xl border border-[#e5e5e5] bg-white p-4 shadow-sm"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#f0f0f0] text-[#333]">
                          <Icon className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-[#111]">{card.title}</p>
                          <p className="mt-0.5 text-xs leading-5 text-[#6b6b6b]">{card.desc}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Benefit bar */}
          <div className="rounded-2xl border border-[#e5e5e5] bg-white p-3 shadow-sm">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
              {benefitItems.map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.title} className="flex items-center gap-3 rounded-xl px-3 py-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#f0f0f0] text-[#333]">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-[#111]">{item.title}</p>
                      <p className="mt-0.5 text-xs text-[#999]">{item.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* ── FUNCIONES ── */}
      <section id="funciones" className="relative px-4 py-16 sm:px-6 lg:px-10">
        <div className="relative mx-auto grid max-w-[1360px] gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
          {/* Laptop frame with JSX agenda mockup */}
          <div className="relative">
            <div className="overflow-hidden rounded-2xl border border-[#e5e5e5] bg-white shadow-[0_16px_40px_rgba(0,0,0,0.08)]">
              {/* Browser chrome */}
              <div className="flex items-center gap-3 border-b border-[#ebebeb] bg-[#fafafa] px-4 py-2.5">
                <div className="flex gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-[#ddd]" />
                  <span className="h-2.5 w-2.5 rounded-full bg-[#ddd]" />
                  <span className="h-2.5 w-2.5 rounded-full bg-[#ddd]" />
                </div>
                <div className="mx-auto rounded-md bg-[#f0f0f0] px-4 py-1 text-[10px] text-[#999]">
                  orbyx.cl/dashboard/mi-negocio/agenda
                </div>
              </div>

              {/* Agenda content */}
              <div className="h-[400px] overflow-hidden sm:h-[420px] lg:h-[480px]">
                {/* Staff header */}
                <div
                  className="grid border-b border-[#ebebeb]"
                  style={{ gridTemplateColumns: "48px repeat(3, 1fr)" }}
                >
                  <div className="flex items-center justify-center border-r border-[#ebebeb] px-2 py-2.5 text-[10px] font-medium text-[#999]">
                    Hora
                  </div>
                  {agendaStaff.map((staff) => (
                    <div
                      key={staff.name}
                      className="flex items-center gap-2 border-r border-[#ebebeb] px-2 py-2.5 last:border-r-0"
                    >
                      <img
                        src={staff.photo}
                        alt={staff.name}
                        className="h-8 w-8 shrink-0 rounded-full border border-[#e5e5e5] object-cover"
                      />
                      <div className="min-w-0">
                        <p className="truncate text-[11px] font-semibold leading-tight text-[#111]">{staff.name}</p>
                        <p className="truncate text-[9px] text-[#999]">{staff.role}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Time grid + appointment columns */}
                <div
                  className="grid"
                  style={{ gridTemplateColumns: "48px repeat(3, 1fr)" }}
                >
                  {/* Time labels column */}
                  <div className="relative border-r border-[#ebebeb]" style={{ height: 450 }}>
                    {agendaHours.map((hour, i) => (
                      <div
                        key={hour}
                        className="absolute left-0 right-0 border-t border-[#ebebeb] px-1.5 pt-1 text-[10px] text-[#999]"
                        style={{ top: i * 90 }}
                      >
                        {hour}
                      </div>
                    ))}
                  </div>

                  {/* Staff columns */}
                  {agendaStaff.map((staff, colIndex) => (
                    <div
                      key={staff.name}
                      className="relative border-r border-[#ebebeb] last:border-r-0"
                      style={{ height: 450 }}
                    >
                      {/* Hour grid lines */}
                      {[90, 180, 270, 360].map((y) => (
                        <div
                          key={y}
                          className="absolute left-0 right-0 border-t border-[#ebebeb]"
                          style={{ top: y }}
                        />
                      ))}
                      {/* Half-hour lines */}
                      {[45, 135, 225, 315, 405].map((y) => (
                        <div
                          key={y}
                          className="absolute left-0 right-0 border-t border-dashed border-[#f5f5f5]"
                          style={{ top: y }}
                        />
                      ))}
                      {/* Appointment blocks */}
                      {agendaAppts
                        .filter((a) => a.col === colIndex)
                        .map((appt) => (
                          <div
                            key={`${appt.time}-${appt.service}`}
                            className="absolute left-1 right-1 overflow-hidden rounded-[4px] px-1.5 py-1 text-white"
                            style={{
                              top: appt.top,
                              height: appt.h,
                              background:
                                appt.status === "booked"
                                  ? "linear-gradient(135deg, rgba(30,64,175,0.90), rgba(59,130,246,0.56))"
                                  : "linear-gradient(135deg, rgba(6,95,70,0.90), rgba(16,185,129,0.56))",
                              boxShadow:
                                appt.status === "booked"
                                  ? "0 0 18px -10px rgba(96,165,250,0.85)"
                                  : "0 0 18px -10px rgba(52,211,153,0.85)",
                            }}
                          >
                            <p className="truncate text-[9px] font-semibold leading-tight">
                              {appt.client} · {appt.service}
                            </p>
                            {appt.h > 50 && (
                              <p className="mt-0.5 truncate text-[8px] text-white/70">{appt.time}</p>
                            )}
                          </div>
                        ))}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Laptop base */}
            <div className="mx-auto h-[6px] w-[45%] rounded-b-lg bg-gradient-to-b from-[#d5d5d5] to-[#e5e5e5]" />

            {/* Metrics overlay */}
            <div className="absolute -right-3 top-[55%] hidden w-[230px] -translate-y-1/2 rounded-xl border border-[#e5e5e5] bg-white p-3 shadow-[0_12px_32px_rgba(0,0,0,0.10)] md:block lg:-right-4 lg:w-[240px]">
              <div className="flex items-center gap-2">
                <div className="flex h-6 w-6 items-center justify-center rounded-md bg-[#f0f0f0] text-[#333]">
                  <Bot className="h-3.5 w-3.5" />
                </div>
                <p className="text-[13px] font-bold tracking-tight text-[#111]">
                  Hoy Orbyx <span className="text-[#6b6b6b]">automatizó</span>
                </p>
              </div>

              <div className="mt-3 rounded-lg bg-[#fafafa] px-2 pb-0.5 pt-1.5">
                <svg viewBox="0 0 190 54" className="h-10 w-full overflow-visible" aria-hidden="true">
                  <path
                    d="M4 39 C24 39 30 27 48 24 C70 20 78 37 98 33 C118 29 122 17 144 19 C162 21 168 25 186 7"
                    fill="none"
                    stroke="#333"
                    strokeWidth="3"
                    strokeLinecap="round"
                  />
                  <path
                    d="M4 39 C24 39 30 27 48 24 C70 20 78 37 98 33 C118 29 122 17 144 19 C162 21 168 25 186 7"
                    fill="none"
                    stroke="rgba(0,0,0,0.06)"
                    strokeWidth="10"
                    strokeLinecap="round"
                  />
                  <circle cx="186" cy="7" r="5" fill="#333" />
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
                      className="grid grid-cols-[32px_1fr_auto] items-center gap-2 border-b border-[#ebebeb] pb-2 last:border-b-0 last:pb-0"
                    >
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#f0f0f0] text-[#333]">
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-baseline gap-1.5 whitespace-nowrap">
                          <p className="text-lg font-bold leading-none text-[#111]">{metric.value}</p>
                          <p className="text-[9px] text-[#999]">{metric.label}</p>
                        </div>
                      </div>
                      <p className="text-[10px] font-bold text-[#333]">+{metric.delta}</p>
                    </div>
                  );
                })}
              </div>

              <div className="mt-3 flex items-center justify-between rounded-lg border border-[#ebebeb] bg-[#fafafa] px-3 py-2 text-[#333]">
                <div className="flex items-center gap-2">
                  <Zap className="h-4 w-4" />
                  <span className="text-xs font-bold">Automatización activa</span>
                </div>
                <span className="h-2 w-2 rounded-full bg-[#333]" />
              </div>
            </div>
          </div>

          {/* Platform benefits */}
          <div className="lg:pl-8">
            <div className="inline-flex items-center rounded-full border border-[#e5e5e5] bg-[#f0f0f0] px-3 py-2 text-xs font-medium text-[#333]">
              Plataforma completa
            </div>
            <h2
              style={serif}
              className="mt-5 text-3xl leading-tight tracking-[-0.02em] text-[#111] sm:text-4xl lg:text-[44px]"
            >
              Todo lo que tu negocio necesita, en una sola plataforma.
            </h2>

            <div className="mt-8 space-y-5">
              {platformBenefits.map((benefit) => {
                const Icon = benefit.icon;
                return (
                  <div key={benefit.title} className="flex gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#f0f0f0] text-[#333]">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-bold text-[#111]">{benefit.title}</p>
                      <p className="mt-1 text-sm leading-6 text-[#6b6b6b]">{benefit.desc}</p>
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
        <div className="mx-auto max-w-[1360px] rounded-[24px] border border-[#e5e5e5] bg-white p-5 shadow-sm sm:p-8">
          <div className="mx-auto max-w-2xl text-center">
            <div className="mx-auto inline-flex rounded-full border border-[#e5e5e5] bg-[#f0f0f0] px-3 py-2 text-xs font-medium text-[#333]">
              Así de simple
            </div>
            <h2
              style={serif}
              className="mt-4 text-3xl tracking-[-0.02em] text-[#111] sm:text-4xl"
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
                    <div className="absolute left-[calc(50%+48px)] top-8 hidden h-px w-[calc(100%-96px)] bg-[#e5e5e5] lg:block" />
                  )}
                  <div className="flex flex-col items-center text-center">
                    <div className="flex items-baseline gap-2">
                      <span
                        style={serif}
                        className="text-[40px] leading-none text-[#111]/[0.12]"
                      >
                        {index + 1}
                      </span>
                      <Icon className="h-6 w-6 text-[#333]" />
                    </div>
                    <div className="mt-3">
                      <p className="text-sm font-bold text-[#111]">{step.title}</p>
                      <p className="mt-1 text-sm leading-5 text-[#6b6b6b]">{step.desc}</p>
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
        <div className="relative mx-auto max-w-[1360px] overflow-hidden rounded-[26px] border border-[#e5e5e5] bg-white p-6 shadow-sm sm:p-9 lg:p-12">
          <div className="relative grid gap-8 lg:grid-cols-[1fr_0.72fr] lg:items-center">
            <div>
              <h2
                style={serif}
                className="text-3xl leading-tight tracking-[-0.02em] text-[#111] sm:text-4xl"
              >
                Empieza gratis.
                <span className="block">Automatiza tu negocio hoy.</span>
              </h2>

              <div className="mt-6 flex flex-col gap-3 text-sm text-[#6b6b6b] sm:flex-row sm:flex-wrap">
                {ctaBadges.map((badge) => (
                  <span key={badge} className="inline-flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-[#333]" />
                    {badge}
                  </span>
                ))}
              </div>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/signup?plan=pro"
                  className="inline-flex h-14 items-center justify-center gap-3 rounded-xl bg-gradient-to-br from-[#1a1a1a] to-[#333] px-8 text-base font-bold text-white shadow-[0_0_25px_rgba(0,0,0,0.12),0_8px_20px_-6px_rgba(0,0,0,0.22)] transition hover:-translate-y-0.5 hover:from-[#2a2a2a] hover:to-[#444] hover:shadow-[0_0_35px_rgba(0,0,0,0.18),0_12px_28px_-6px_rgba(0,0,0,0.30)]"
                >
                  Probar gratis {TRIAL_LABEL}
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/planes"
                  className="inline-flex h-14 items-center justify-center rounded-xl border border-[#e0e0e0] px-8 text-base font-semibold text-[#111] transition hover:border-[#bbb] hover:bg-[#f5f5f5]"
                >
                  Ver planes
                </Link>
              </div>
            </div>

            <div className="relative rounded-[22px] border border-[#e5e5e5] bg-[#fafafa] p-5">
              <div className="flex -space-x-3">
                {["CM", "VR", "AG", "MS", "OT"].map((initial) => (
                  <div
                    key={initial}
                    className="flex h-11 w-11 items-center justify-center rounded-full border-2 border-white bg-[#e5e5e5] text-xs font-bold text-[#555]"
                  >
                    {initial}
                  </div>
                ))}
              </div>
              <div className="mt-5 flex text-[#111]">
                {Array.from({ length: 5 }).map((_, index) => (
                  <span key={index}>★</span>
                ))}
              </div>
              <p
                style={serif}
                className="mt-3 max-w-[300px] text-xl leading-8 text-[#111]"
              >
                Más de 500 negocios ya confían en Orbyx.
              </p>
              <p className="mt-2 text-sm leading-6 text-[#6b6b6b]">
                Veterinarias, clases, talleres y servicios profesionales operando con menos carga manual.
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
