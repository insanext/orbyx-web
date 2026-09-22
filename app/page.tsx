"use client";

import Link from "next/link";
import { motion } from "framer-motion";
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
import { AgendaMockup } from "@/components/landing/AgendaMockup";
import { WhatsAppMockup } from "@/components/landing/WhatsAppMockup";
import { RubrosCarousel } from "@/components/landing/RubrosCarousel";

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
              <motion.h1
                initial={{ opacity: 0, y: 22 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                style={serif}
                className="text-[40px] leading-[1.05] tracking-[-0.02em] text-[var(--pub-text)] sm:text-[54px] lg:text-[66px]"
              >
                Organiza tu agenda.
                <span className="block bg-gradient-to-r from-[var(--pub-accent)] to-[#38bdf8] bg-clip-text text-transparent">
                  Haz que tus clientes vuelvan.
                </span>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 22 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1, ease: "easeOut" }}
                className="mt-6 max-w-[560px] text-base leading-8 text-[var(--pub-text-muted)] sm:text-lg"
              >
                Orbyx ordena tu día a día y te ayuda a mantener una relación
                activa con tus clientes. Gestiona tus reservas, confirma sus
                citas y vuelve a contactarlos cuando sea momento de regresar.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 22 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
                className="mt-8 flex flex-col gap-3 sm:flex-row"
              >
                <Link
                  href="/signup?plan=starter"
                  className="inline-flex h-14 items-center justify-center gap-3 rounded-xl bg-[var(--pub-accent)] px-7 text-base font-bold text-[var(--pub-accent-text)] shadow-[0_8px_28px_var(--pub-shadow-color)] transition hover:-translate-y-0.5 hover:brightness-110"
                >
                  Probar gratis {TRIAL_LABEL}
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/planes"
                  className="group relative inline-flex h-14 items-center justify-center overflow-hidden rounded-xl border-2 border-[var(--pub-accent)] px-7 text-base font-bold text-[var(--pub-accent)] shadow-[0_8px_28px_var(--pub-shadow-color)] transition hover:-translate-y-0.5 hover:bg-[var(--pub-accent-soft-bg)]"
                >
                  <span className="relative z-10">Ver planes</span>
                  <motion.span
                    aria-hidden
                    initial={{ x: "-120%" }}
                    animate={{ x: "220%" }}
                    transition={{ duration: 1.3, ease: "easeInOut", repeat: Infinity, repeatDelay: 2.4 }}
                    className="pointer-events-none absolute inset-y-0 left-0 w-1/3 -skew-x-12 bg-gradient-to-r from-transparent via-[var(--pub-accent)]/40 to-transparent"
                  />
                </Link>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 22 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3, ease: "easeOut" }}
                className="mt-8 flex flex-col gap-3 text-sm text-[var(--pub-text-muted)] sm:flex-row sm:flex-wrap"
              >
                {ctaBadges.map((badge) => (
                  <span key={badge} className="inline-flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-[var(--pub-accent)]" />
                    {badge}
                  </span>
                ))}
              </motion.div>
            </div>

            {/* Mascota de Orbyx — única protagonista del hero, sin nada superpuesto */}
            <div>
              <motion.div
                initial={{ opacity: 0, y: 24, scale: 0.94 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.7, delay: 0.15, ease: "easeOut" }}
                className="group relative mx-auto max-w-[440px] lg:mx-0 lg:ml-10 lg:max-w-[480px]"
              >
                {/* Marco: borde neón rotando en loop; en hover/press se detiene, se ilumina completo y la imagen se agranda */}
                <div className="relative overflow-hidden rounded-[28px] p-[3px]">
                  <div
                    className="absolute inset-[-75%] [animation:spin_3.5s_linear_infinite] group-hover:[animation-play-state:paused] group-active:[animation-play-state:paused]"
                    style={{
                      background:
                        "conic-gradient(from 0deg, transparent 0%, var(--pub-accent) 6%, transparent 16%, transparent 100%)",
                    }}
                  />
                  <div className="relative overflow-hidden rounded-[25px] border border-[var(--pub-border)] shadow-[0_24px_60px_var(--pub-shadow-color)]">
                    <img
                      src="/orbyx-mascota-hero.png"
                      alt="Mascota de Orbyx trabajando en su laptop"
                      className="aspect-square w-full scale-100 object-cover transition-transform duration-300 group-hover:scale-[1.04] group-active:scale-[1.04]"
                    />
                  </div>
                  <div className="pointer-events-none absolute inset-0 rounded-[28px] opacity-0 shadow-[0_0_0_2px_var(--pub-accent),0_0_46px_10px_var(--pub-accent-soft-bg)] transition-opacity duration-300 group-hover:opacity-100 group-active:opacity-100" />
                </div>
              </motion.div>

              <div className="mx-auto mt-6 grid max-w-[440px] gap-3 sm:grid-cols-2 lg:ml-10 lg:max-w-[480px]">
                {automationCards.map((card, index) => {
                  const Icon = card.icon;
                  return (
                    <motion.div
                      key={card.title}
                      initial={{ opacity: 0, y: 18, scale: 0.96 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      transition={{ duration: 0.5, delay: 0.5 + index * 0.1, ease: "easeOut" }}
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
                    </motion.div>
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
            <AgendaMockup className="flex-1" />
            <WhatsAppMockup className="lg:mt-6" />
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

      {/* ── RUBROS ── */}
      <section id="rubros" className="relative px-4 py-16 sm:px-6 lg:px-10">
        <div className="mx-auto max-w-[1360px]">
          <RubrosCarousel />
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
