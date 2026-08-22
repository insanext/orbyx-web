"use client";

import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  Bell,
  CalendarCheck2,
  CalendarDays,
  CheckCircle2,
  LayoutDashboard,
  Megaphone,
  Power,
  RefreshCcw,
  Send,
  Users,
  Zap,
} from "lucide-react";
import { TRIAL_LABEL } from "@/lib/plans";
import { PublicThemeProvider } from "@/lib/public-theme";
import { PublicHeader } from "@/components/public/PublicHeader";
import { PublicFooter } from "@/components/public/PublicFooter";

const serif = { fontFamily: "var(--font-dm-serif), Georgia, serif" };

export default function OrbyxLandingPage() {
  return (
    <PublicThemeProvider>
      <LandingContent />
    </PublicThemeProvider>
  );
}

function LandingContent() {
  const benefitItems = [
    { icon: Power, title: "Reservas 24/7", desc: "Sin perder clientes" },
    { icon: Zap, title: "Menos trabajo manual", desc: "Más tiempo para ti" },
    { icon: CheckCircle2, title: "Más reservas confirmadas", desc: "Menos ausencias" },
    { icon: Send, title: "Campañas masivas", desc: "Vende más" },
    { icon: LayoutDashboard, title: "Todo en un solo lugar", desc: "Fácil y completo" },
  ];

  const automationCards = [
    { icon: CalendarCheck2, title: "Agenda organizada", desc: "Horarios, servicios, staff y reservas bajo control." },
    { icon: RefreshCcw, title: "Clientes que vuelven", desc: "Mantén el contacto y vuelve a activar a quienes dejaron de venir." },
  ];

  const platformBenefits = [
    { icon: CalendarDays, title: "Agenda que se organiza sola", desc: "Horarios, staff y servicios sincronizados sin esfuerzo." },
    { icon: CalendarCheck2, title: "Reservas online", desc: "Tus clientes reservan desde tu web o WhatsApp, a cualquier hora." },
    { icon: Megaphone, title: "Campañas que recuperan clientes", desc: "Envía promociones y reactiva clientes que dejaron de venir." },
    { icon: BarChart3, title: "Decisiones con datos reales", desc: "Métricas claras de reservas, ausencias y crecimiento." },
    { icon: Users, title: "Multi staff y sucursales", desc: "Ideal para equipos y negocios en crecimiento." },
  ];

  const steps = [
    { icon: CalendarDays, title: "El cliente reserva", desc: "desde tu web, a cualquier hora" },
    { icon: CalendarCheck2, title: "Tu agenda se organiza", desc: "horarios, staff y sucursales al día" },
    { icon: Bell, title: "Confirma y recuerda", desc: "por WhatsApp y email, sin ausencias" },
    { icon: LayoutDashboard, title: "Ves todo en un solo lugar", desc: "reservas, clientes y métricas" },
    { icon: RefreshCcw, title: "Vuelves a contactarlos", desc: "con campañas cuando dejan de venir" },
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
      className="min-h-screen overflow-hidden bg-[var(--pub-bg)] text-[var(--pub-text)]"
    >
      {/* ── HERO ── */}
      <section className="relative">
        <div className="relative mx-auto max-w-[1480px] px-4 pb-10 pt-5 sm:px-6 lg:px-10">
          <PublicHeader />

          <div className="grid gap-10 pb-8 pt-14 lg:grid-cols-[0.92fr_1.08fr] lg:items-center lg:gap-12 lg:pb-14 lg:pt-20">
            <div className="max-w-[660px]">
              <h1
                style={serif}
                className="text-[40px] leading-[1.05] tracking-[-0.02em] text-[var(--pub-text)] sm:text-[54px] lg:text-[66px]"
              >
                Organiza tu agenda.
                <span className="block">Haz que tus clientes vuelvan.</span>
              </h1>

              <p className="mt-6 max-w-[560px] text-base leading-8 text-[var(--pub-text-muted)] sm:text-lg">
                Orbyx ordena tu día a día y te ayuda a mantener una relación
                activa con tus clientes. Gestiona tus reservas, confirma sus
                citas y vuelve a contactarlos cuando sea momento de regresar.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/signup?plan=starter"
                  className="inline-flex h-14 items-center justify-center gap-3 rounded-xl bg-[var(--pub-accent)] px-7 text-base font-bold text-[var(--pub-accent-text)] shadow-[0_8px_28px_var(--pub-shadow-color)] transition hover:-translate-y-0.5 hover:brightness-110"
                >
                  Probar gratis {TRIAL_LABEL}
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/planes"
                  className="inline-flex h-14 items-center justify-center rounded-xl border border-[var(--pub-border)] px-7 text-base font-semibold text-[var(--pub-text)] transition hover:border-[var(--pub-accent-soft-border)] hover:bg-[var(--pub-bg-soft)]"
                >
                  Ver planes
                </Link>
              </div>

              <div className="mt-8 flex flex-col gap-3 text-sm text-[var(--pub-text-muted)] sm:flex-row sm:flex-wrap">
                {ctaBadges.map((badge) => (
                  <span key={badge} className="inline-flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-[var(--pub-accent)]" />
                    {badge}
                  </span>
                ))}
              </div>
            </div>

            {/* Mascota de Orbyx — única protagonista del hero, sin nada superpuesto */}
            <div>
              <div className="mx-auto max-w-[440px] overflow-hidden rounded-[28px] border border-[var(--pub-border)] shadow-[0_24px_60px_var(--pub-shadow-color)] lg:mx-0 lg:ml-10 lg:max-w-[480px]">
                <img
                  src="/orbyx-mascota-hero.png"
                  alt="Mascota de Orbyx trabajando en su laptop"
                  className="aspect-square w-full object-cover"
                />
              </div>

              <div className="mx-auto mt-6 grid max-w-[440px] gap-3 sm:grid-cols-2 lg:ml-10 lg:max-w-[480px]">
                {automationCards.map((card) => {
                  const Icon = card.icon;
                  return (
                    <div
                      key={card.title}
                      className="rounded-xl border border-[var(--pub-border)] bg-[var(--pub-bg-elevated)] p-4 shadow-sm"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[var(--pub-accent-soft-bg)] text-[var(--pub-accent)]">
                          <Icon className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-[var(--pub-text)]">{card.title}</p>
                          <p className="mt-0.5 text-xs leading-5 text-[var(--pub-text-muted)]">{card.desc}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Benefit bar */}
          <div className="rounded-2xl border border-[var(--pub-border)] bg-[var(--pub-bg-elevated)] p-3 shadow-sm">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
              {benefitItems.map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.title} className="flex items-center gap-3 rounded-xl px-3 py-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[var(--pub-bg-soft)] text-[var(--pub-text)]">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-[var(--pub-text)]">{item.title}</p>
                      <p className="mt-0.5 text-xs text-[var(--pub-text-faint)]">{item.desc}</p>
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
        <div className="relative mx-auto grid max-w-[1360px] gap-10 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
          {/* Mockups: agenda (laptop) + WhatsApp, lado a lado */}
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start">
            {/* Laptop frame with JSX agenda mockup */}
            <div className="relative flex-1">
              <div className="overflow-hidden rounded-2xl border border-[var(--pub-border)] bg-[var(--pub-bg-elevated)] shadow-[0_16px_40px_var(--pub-shadow-color)]">
                {/* Browser chrome */}
                <div className="flex items-center gap-3 border-b border-[var(--pub-border-soft)] bg-[var(--pub-bg)] px-4 py-2.5">
                  <div className="flex gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-full bg-[var(--pub-border)]" />
                    <span className="h-2.5 w-2.5 rounded-full bg-[var(--pub-border)]" />
                    <span className="h-2.5 w-2.5 rounded-full bg-[var(--pub-border)]" />
                  </div>
                  <div className="mx-auto rounded-md bg-[var(--pub-bg-soft)] px-4 py-1 text-[10px] text-[var(--pub-text-faint)]">
                    orbyx.cl/dashboard/mi-negocio/agenda
                  </div>
                </div>

                {/* Agenda content */}
                <div className="h-[400px] overflow-hidden sm:h-[420px] lg:h-[440px]">
                  {/* Staff header */}
                  <div
                    className="grid border-b border-[var(--pub-border-soft)]"
                    style={{ gridTemplateColumns: "48px repeat(3, 1fr)" }}
                  >
                    <div className="flex items-center justify-center border-r border-[var(--pub-border-soft)] px-2 py-2.5 text-[10px] font-medium text-[var(--pub-text-faint)]">
                      Hora
                    </div>
                    {agendaStaff.map((staff) => (
                      <div
                        key={staff.name}
                        className="flex items-center gap-2 border-r border-[var(--pub-border-soft)] px-2 py-2.5 last:border-r-0"
                      >
                        <img
                          src={staff.photo}
                          alt={staff.name}
                          className="h-8 w-8 shrink-0 rounded-full border border-[var(--pub-border)] object-cover"
                        />
                        <div className="min-w-0">
                          <p className="truncate text-[11px] font-semibold leading-tight text-[var(--pub-text)]">{staff.name}</p>
                          <p className="truncate text-[9px] text-[var(--pub-text-faint)]">{staff.role}</p>
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
                    <div className="relative border-r border-[var(--pub-border-soft)]" style={{ height: 450 }}>
                      {agendaHours.map((hour, i) => (
                        <div
                          key={hour}
                          className="absolute left-0 right-0 border-t border-[var(--pub-border-soft)] px-1.5 pt-1 text-[10px] text-[var(--pub-text-faint)]"
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
                        className="relative border-r border-[var(--pub-border-soft)] last:border-r-0"
                        style={{ height: 450 }}
                      >
                        {/* Hour grid lines */}
                        {[90, 180, 270, 360].map((y) => (
                          <div
                            key={y}
                            className="absolute left-0 right-0 border-t border-[var(--pub-border-soft)]"
                            style={{ top: y }}
                          />
                        ))}
                        {/* Half-hour lines */}
                        {[45, 135, 225, 315, 405].map((y) => (
                          <div
                            key={y}
                            className="absolute left-0 right-0 border-t border-dashed border-[var(--pub-border-soft)]"
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
              <div className="mx-auto h-[6px] w-[45%] rounded-b-lg bg-[var(--pub-border)]" />
            </div>

            {/* WhatsApp mockup — campaña de reactivación, con forma de smartphone */}
            <div className="mx-auto w-full max-w-[240px] shrink-0 rounded-[38px] border border-[var(--pub-border)] bg-[#1a1a1a] p-3 shadow-[0_20px_50px_var(--pub-shadow-color)]">
              <div className="mb-2 flex justify-center">
                <div className="h-1.5 w-14 rounded-full bg-[#3a3a3a]" />
              </div>

              <div className="rounded-[20px] border border-[#333] bg-[#efe7dc] p-2.5 text-slate-950">
                <div className="mb-2.5 flex items-center justify-between rounded-t-[12px] bg-[#1a1a1a] px-2.5 py-2.5 text-white">
                  <div className="flex items-center gap-2">
                    <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-white">
                      <img src="/orbyx-mark.png" alt="Orbyx" className="h-6 w-6 object-contain" />
                    </div>
                    <div>
                      <p className="text-xs font-bold">Orbyx</p>
                      <p className="text-[10px] text-[#888]">Campaña automática</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-2 px-1 pb-1 text-xs">
                  <div className="mx-auto max-w-[92%] rounded-full bg-black/5 px-2.5 py-1 text-center text-[9px] font-medium text-slate-500">
                    Clientes sin reservar hace 30 días
                  </div>
                  <div className="max-w-[92%] rounded-xl rounded-tl-sm bg-white px-2.5 py-1.5 shadow-sm">
                    <p>
                      Hola Camila 👋 Hace 1 mes de tu última visita. Como
                      cliente preferente, tienes 15% OFF en tu próxima
                      reserva. Agenda nuevamente →
                    </p>
                    <p className="mt-1 text-right text-[9px] text-slate-400">10:02 a.m.</p>
                  </div>
                </div>
              </div>

              <div className="mt-2 flex justify-center">
                <div className="h-1 w-20 rounded-full bg-[#3a3a3a]" />
              </div>
            </div>
          </div>

          {/* Platform benefits */}
          <div className="lg:pl-8">
            <h2
              style={serif}
              className="text-3xl leading-tight tracking-[-0.02em] text-[var(--pub-text)] sm:text-4xl lg:text-[44px]"
            >
              Todo lo que tu negocio necesita, en una sola plataforma.
            </h2>

            <div className="mt-8 space-y-5">
              {platformBenefits.map((benefit) => {
                const Icon = benefit.icon;
                return (
                  <div key={benefit.title} className="flex gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[var(--pub-accent-soft-bg)] text-[var(--pub-accent)]">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-bold text-[var(--pub-text)]">{benefit.title}</p>
                      <p className="mt-1 text-sm leading-6 text-[var(--pub-text-muted)]">{benefit.desc}</p>
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
        <div className="mx-auto max-w-[1360px]">
          <div className="mx-auto max-w-2xl text-center">
            <h2
              style={serif}
              className="text-3xl tracking-[-0.02em] text-[var(--pub-text)] sm:text-4xl"
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
                    <div className="absolute left-[calc(50%+48px)] top-8 hidden h-px w-[calc(100%-96px)] bg-[var(--pub-border)] lg:block" />
                  )}
                  <div className="flex flex-col items-center text-center">
                    <div className="flex items-baseline gap-2">
                      <span
                        style={serif}
                        className="text-[40px] leading-none text-[var(--pub-text)]/[0.12]"
                      >
                        {index + 1}
                      </span>
                      <Icon className="h-6 w-6 text-[var(--pub-accent)]" />
                    </div>
                    <div className="mt-3">
                      <p className="text-sm font-bold text-[var(--pub-text)]">{step.title}</p>
                      <p className="mt-1 text-sm leading-5 text-[var(--pub-text-muted)]">{step.desc}</p>
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
        <div className="relative mx-auto max-w-[1360px] overflow-hidden rounded-[26px] border border-[var(--pub-border)] bg-[var(--pub-bg-elevated)] p-6 shadow-sm sm:p-9 lg:p-12">
          <div className="relative grid gap-8 lg:grid-cols-[1fr_0.72fr] lg:items-center">
            <div>
              <h2
                style={serif}
                className="text-3xl leading-tight tracking-[-0.02em] text-[var(--pub-text)] sm:text-4xl"
              >
                Empieza gratis.
                <span className="block">Automatiza tu negocio hoy.</span>
              </h2>

              <div className="mt-6 flex flex-col gap-3 text-sm text-[var(--pub-text-muted)] sm:flex-row sm:flex-wrap">
                {ctaBadges.map((badge) => (
                  <span key={badge} className="inline-flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-[var(--pub-accent)]" />
                    {badge}
                  </span>
                ))}
              </div>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/signup?plan=starter"
                  className="inline-flex h-14 items-center justify-center gap-3 rounded-xl bg-[var(--pub-accent)] px-8 text-base font-bold text-[var(--pub-accent-text)] shadow-[0_8px_28px_var(--pub-shadow-color)] transition hover:-translate-y-0.5 hover:brightness-110"
                >
                  Probar gratis {TRIAL_LABEL}
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/planes"
                  className="inline-flex h-14 items-center justify-center rounded-xl border border-[var(--pub-border)] px-8 text-base font-semibold text-[var(--pub-text)] transition hover:border-[var(--pub-accent-soft-border)] hover:bg-[var(--pub-bg-soft)]"
                >
                  Ver planes
                </Link>
              </div>
            </div>

            <div className="relative rounded-[22px] border border-[var(--pub-border)] bg-[var(--pub-bg)] p-5">
              <div className="flex -space-x-3">
                {["CM", "VR", "AG", "MS", "OT"].map((initial) => (
                  <div
                    key={initial}
                    className="flex h-11 w-11 items-center justify-center rounded-full border-2 border-[var(--pub-bg-elevated)] bg-[var(--pub-border)] text-xs font-bold text-[var(--pub-text-muted)]"
                  >
                    {initial}
                  </div>
                ))}
              </div>
              <div className="mt-5 flex text-[var(--pub-accent)]">
                {Array.from({ length: 5 }).map((_, index) => (
                  <span key={index}>★</span>
                ))}
              </div>
              <p
                style={serif}
                className="mt-3 max-w-[300px] text-xl leading-8 text-[var(--pub-text)]"
              >
                Únete a los negocios que ya organizan su agenda y hacen crecer su cartera de clientes con Orbyx.
              </p>
              <p className="mt-2 text-sm leading-6 text-[var(--pub-text-muted)]">
                Veterinarias, clases, talleres y servicios profesionales que ordenan su día a día y hacen que sus clientes vuelvan.
              </p>
            </div>
          </div>
        </div>
      </section>

      <PublicFooter />
    </main>
  );
}
