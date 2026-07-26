"use client";

import {
  Award,
  Bot,
  Building2,
  Feather,
  Headset,
  Link2,
  PawPrint,
  RefreshCcw,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Target,
  Eye,
  Zap,
} from "lucide-react";
import { PublicThemeProvider } from "@/lib/public-theme";
import { PublicHeader } from "@/components/public/PublicHeader";
import { PublicFooter } from "@/components/public/PublicFooter";

const serif = { fontFamily: "var(--font-dm-serif), Georgia, serif" };

export default function NosotrosPage() {
  return (
    <PublicThemeProvider>
      <NosotrosContent />
    </PublicThemeProvider>
  );
}

function NosotrosContent() {
  const valores = [
    { icon: Sparkles, title: "Innovación con propósito", desc: "Creamos tecnología para resolver problemas reales." },
    { icon: ShieldCheck, title: "Confianza", desc: "Construimos relaciones transparentes y protegemos la información de nuestros clientes." },
    { icon: Feather, title: "Simplicidad", desc: "La mejor tecnología es aquella que cualquiera puede utilizar." },
    { icon: RefreshCcw, title: "Evolución constante", desc: "Aprendemos, mejoramos y evolucionamos junto con la inteligencia artificial." },
    { icon: Target, title: "Orientación al cliente", desc: "Cada solución nace desde las necesidades reales de nuestros clientes." },
    { icon: Award, title: "Excelencia", desc: "Buscamos calidad, estabilidad y precisión en todo lo que desarrollamos." },
  ];

  const porQueOrbyx = [
    { icon: SlidersHorizontal, title: "Soluciones personalizadas" },
    { icon: Zap, title: "Implementación rápida" },
    { icon: Bot, title: "Tecnología basada en Inteligencia Artificial" },
    { icon: Link2, title: "Integración con múltiples plataformas" },
    { icon: Building2, title: "Escalabilidad para empresas de cualquier tamaño" },
    { icon: Headset, title: "Soporte cercano y confiable" },
  ];

  return (
    <main
      style={{ fontFamily: "var(--font-dm-sans), system-ui, sans-serif" }}
      className="min-h-screen overflow-hidden bg-[var(--pub-bg)] text-[var(--pub-text)]"
    >
      {/* ── HEADER ── */}
      <div className="mx-auto max-w-[1480px] px-4 pt-5 sm:px-6 lg:px-10">
        <PublicHeader />
      </div>

      {/* ── HERO: fondo completo con overlay ── */}
      <section className="relative mt-8">
        <div className="relative min-h-[420px] w-full overflow-hidden sm:min-h-[480px] lg:min-h-[560px]">
          <img
            src="/orbyx-nosotros-hero.png"
            alt="Oficina de Orbyx"
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/55 via-black/60 to-black/75" />
          <div className="relative z-10 flex min-h-[420px] items-center justify-center px-4 py-16 text-center sm:min-h-[480px] lg:min-h-[560px]">
            <div className="max-w-2xl">
              <h1
                style={serif}
                className="text-[36px] leading-[1.08] tracking-[-0.02em] text-white sm:text-[48px] lg:text-[58px]"
              >
                Sobre Orbyx
              </h1>
              <p className="mt-5 text-base leading-8 text-white/85 sm:text-lg">
                Transformamos procesos mediante Inteligencia Artificial para
                ayudar a las empresas a trabajar de forma más eficiente,
                rápida y segura.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── QUIÉNES SOMOS ── */}
      <section className="relative px-4 py-16 sm:px-6 lg:px-10">
        <div className="mx-auto grid max-w-[1360px] gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
          <div>
            <div className="inline-flex items-center rounded-full border border-[var(--pub-border)] bg-[var(--pub-bg-soft)] px-3 py-2 text-xs font-medium text-[var(--pub-text-muted)]">
              ¿Quiénes somos?
            </div>
            <h2
              style={serif}
              className="mt-5 text-3xl leading-tight tracking-[-0.02em] text-[var(--pub-text)] sm:text-4xl lg:text-[44px]"
            >
              Tecnología con propósito, hecha para las personas.
            </h2>

            <div className="mt-6 space-y-4 text-base leading-8 text-[var(--pub-text-muted)]">
              <p>
                Orbyx nace con un propósito simple: ayudar a las empresas a
                dejar atrás las tareas repetitivas mediante soluciones de
                automatización e inteligencia artificial.
              </p>
              <p>
                Creemos que la tecnología debe ser accesible, útil y capaz de
                generar un impacto real en la productividad de cualquier
                organización.
              </p>
              <p className="font-semibold text-[var(--pub-text)]">No buscamos reemplazar a las personas.</p>
              <p className="font-semibold text-[var(--pub-text)]">Buscamos potenciar su trabajo.</p>
            </div>
          </div>

          {/* Tarjeta glassmorphism con frase destacada */}
          <div className="relative">
            <div className="absolute -inset-4 -z-10 rounded-[32px] bg-[var(--pub-accent-soft-bg)] blur-2xl" />
            <div className="rounded-[28px] border border-[var(--pub-border)] bg-[var(--pub-bg-elevated)]/60 p-8 shadow-[0_24px_60px_var(--pub-shadow-color)] backdrop-blur-xl sm:p-10">
              <Sparkles className="h-8 w-8 text-[var(--pub-accent)]" />
              <p
                style={serif}
                className="mt-6 text-2xl leading-[1.3] tracking-[-0.01em] text-[var(--pub-text)] sm:text-[28px]"
              >
                "No buscamos reemplazar a las personas. Buscamos potenciar su
                trabajo."
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── MISIÓN Y VISIÓN ── */}
      <section className="relative px-4 py-16 sm:px-6 lg:px-10">
        <div className="mx-auto max-w-[1360px]">
          <div className="grid gap-6 sm:grid-cols-2">
            <div className="rounded-[22px] border border-[var(--pub-border)] bg-[var(--pub-bg-elevated)] p-7 shadow-sm sm:p-8">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--pub-accent-soft-bg)] text-[var(--pub-accent)]">
                <Target className="h-5 w-5" />
              </div>
              <h3 style={serif} className="mt-5 text-2xl tracking-[-0.01em] text-[var(--pub-text)]">
                Misión
              </h3>
              <p className="mt-3 text-sm leading-7 text-[var(--pub-text-muted)]">
                Desarrollar soluciones de automatización e inteligencia
                artificial que simplifiquen procesos, optimicen recursos y
                mejoren la productividad de las empresas mediante
                herramientas confiables, accesibles y fáciles de implementar.
              </p>
            </div>

            <div className="rounded-[22px] border border-[var(--pub-border)] bg-[var(--pub-bg-elevated)] p-7 shadow-sm sm:p-8">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--pub-accent-soft-bg)] text-[var(--pub-accent)]">
                <Eye className="h-5 w-5" />
              </div>
              <h3 style={serif} className="mt-5 text-2xl tracking-[-0.01em] text-[var(--pub-text)]">
                Visión
              </h3>
              <p className="mt-3 text-sm leading-7 text-[var(--pub-text-muted)]">
                Posicionarnos como una empresa competitiva en automatización
                inteligente, reconocida por desarrollar soluciones
                innovadoras, confiables y accesibles que impulsen la
                transformación digital de las organizaciones.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── NUESTROS VALORES ── */}
      <section className="relative px-4 py-16 sm:px-6 lg:px-10">
        <div className="mx-auto max-w-[1360px]">
          <div className="mx-auto max-w-2xl text-center">
            <div className="mx-auto inline-flex rounded-full border border-[var(--pub-border)] bg-[var(--pub-bg-soft)] px-3 py-2 text-xs font-medium text-[var(--pub-text-muted)]">
              Lo que nos define
            </div>
            <h2
              style={serif}
              className="mt-4 text-3xl tracking-[-0.02em] text-[var(--pub-text)] sm:text-4xl"
            >
              Nuestros valores
            </h2>
          </div>

          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {valores.map((valor) => {
              const Icon = valor.icon;
              return (
                <div
                  key={valor.title}
                  className="rounded-2xl border border-[var(--pub-border)] bg-[var(--pub-bg-elevated)] p-6 text-center shadow-sm"
                >
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--pub-accent-soft-bg)] text-[var(--pub-accent)]">
                    <Icon className="h-6 w-6" />
                  </div>
                  <p className="mt-4 text-base font-bold text-[var(--pub-text)]">{valor.title}</p>
                  <p className="mt-2 text-sm leading-6 text-[var(--pub-text-muted)]">{valor.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── POR QUÉ ORBYX ── */}
      <section className="relative px-4 py-16 sm:px-6 lg:px-10">
        <div className="mx-auto max-w-[1360px] rounded-[24px] border border-[var(--pub-border)] bg-[var(--pub-bg-elevated)] p-6 shadow-sm sm:p-10">
          <div className="mx-auto max-w-2xl text-center">
            <h2
              style={serif}
              className="text-3xl tracking-[-0.02em] text-[var(--pub-text)] sm:text-4xl"
            >
              ¿Por qué Orbyx?
            </h2>
          </div>

          <div className="mx-auto mt-10 grid max-w-[900px] gap-x-10 gap-y-6 sm:grid-cols-2">
            {porQueOrbyx.map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.title} className="flex items-center gap-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-[var(--pub-accent-soft-bg)] text-[var(--pub-accent)]">
                    <Icon className="h-5 w-5" />
                  </div>
                  <p className="text-sm font-semibold text-[var(--pub-text)]">{item.title}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── ORBIT ── */}
      <section className="relative px-4 pb-16 pt-2 sm:px-6 lg:px-10">
        <div className="mx-auto grid max-w-[1360px] gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:items-center">
          {/* Placeholder de imagen — aún no se genera la imagen de Orbit */}
          <div className="mx-auto flex aspect-square w-full max-w-[380px] items-center justify-center rounded-[28px] border border-dashed border-[var(--pub-border)] bg-[var(--pub-bg-soft)]">
            <div className="flex flex-col items-center gap-3 text-[var(--pub-text-faint)]">
              <PawPrint className="h-10 w-10" />
              <p className="text-xs font-medium">Imagen de Orbit próximamente</p>
            </div>
          </div>

          <div>
            <h2
              style={serif}
              className="text-3xl leading-tight tracking-[-0.02em] text-[var(--pub-text)] sm:text-4xl lg:text-[44px]"
            >
              Conoce a Orbit 🐩
            </h2>
            <p className="mt-6 max-w-[560px] text-base leading-8 text-[var(--pub-text-muted)]">
              Orbit es el compañero y embajador de Orbyx. Representa la
              cercanía, la curiosidad y el compromiso con el que
              desarrollamos cada solución. Su misión es hacer que la
              inteligencia artificial sea más humana, accesible y cercana
              para todos nuestros clientes.
            </p>
          </div>
        </div>
      </section>

      <PublicFooter />
    </main>
  );
}
