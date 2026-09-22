"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, ArrowRight } from "lucide-react";

type Rubro = {
  name: string;
  phrase: string;
  image: string;
};

const RUBROS: Rubro[] = [
  {
    name: "Centros de estética",
    phrase: "Realza la belleza de tus clientes.",
    image: "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=500&h=640&fit=crop&q=80",
  },
  {
    name: "Veterinarias",
    phrase: "Cuida a sus mascotas, ellos confían en ti.",
    image: "https://images.unsplash.com/photo-1628009368231-7bb7cfcb0def?w=500&h=640&fit=crop&q=80",
  },
  {
    name: "Peluquerías y barberías",
    phrase: "Cortes y estilo, cita a cita.",
    image: "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=500&h=640&fit=crop&q=80",
  },
  {
    name: "Talleres mecánicos",
    phrase: "Organiza tus trabajos y citas.",
    image: "https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=500&h=640&fit=crop&q=80",
  },
  {
    name: "Profesionales",
    phrase: "Agenda tus asesorías sin fricción.",
    image: "https://images.unsplash.com/photo-1521791136064-7986c2920216?w=500&h=640&fit=crop&q=80",
  },
  {
    name: "Spa y masajes",
    phrase: "Relájalos y que vuelvan seguido.",
    image: "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=500&h=640&fit=crop&q=80",
  },
  {
    name: "Manicure y uñas",
    phrase: "Cada diseño, agendado a tiempo.",
    image: "https://images.unsplash.com/photo-1604654894610-df63bc536371?w=500&h=640&fit=crop&q=80",
  },
  {
    name: "Clases grupales",
    phrase: "Cupos y horarios siempre claros.",
    image: "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=500&h=640&fit=crop&q=80",
  },
  {
    name: "Academias y cursos",
    phrase: "Inscripciones y clases bajo control.",
    image: "https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=500&h=640&fit=crop&q=80",
  },
];

const TOTAL = RUBROS.length;
const AUTOPLAY_MS = 3800;
const SWIPE_THRESHOLD = 40;

// Distancia circular con signo más corta entre `index` y `active` (ej. con 9
// tarjetas, va de -4 a 4), para que el carrusel siempre gire por el lado más
// cercano.
function circularOffset(index: number, active: number, total: number) {
  let diff = index - active;
  diff = ((diff % total) + total) % total;
  if (diff > total / 2) diff -= total;
  return diff;
}

export function RubrosCarousel() {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const touchStartX = useRef<number | null>(null);

  useEffect(() => {
    if (paused) return;
    const id = setInterval(() => {
      setActive((a) => (a + 1) % TOTAL);
    }, AUTOPLAY_MS);
    return () => clearInterval(id);
  }, [active, paused]);

  function goTo(index: number) {
    setActive(((index % TOTAL) + TOTAL) % TOTAL);
  }

  function handleTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0].clientX;
  }

  function handleTouchEnd(e: React.TouchEvent) {
    if (touchStartX.current === null) return;
    const delta = e.changedTouches[0].clientX - touchStartX.current;
    if (delta > SWIPE_THRESHOLD) goTo(active - 1);
    else if (delta < -SWIPE_THRESHOLD) goTo(active + 1);
    touchStartX.current = null;
  }

  return (
    <div>
      <div className="mx-auto max-w-2xl text-center">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--pub-accent)]">
          Para todo tipo de negocios
        </p>
        <h2
          style={{ fontFamily: "var(--font-dm-serif), Georgia, serif" }}
          className="mt-3 text-3xl tracking-[-0.02em] text-[var(--pub-text)] sm:text-4xl"
        >
          Una plataforma, múltiples rubros.
        </h2>
        <p className="mt-4 text-sm leading-6 text-[var(--pub-text-muted)] sm:text-base">
          Orbyx se adapta a tu rubro. Desde clínicas veterinarias hasta
          centros de estética, talleres y profesionales — todo lo que
          necesitas para gestionar tus reservas y mantener a tus clientes
          siempre cerca.
        </p>
      </div>

      <div
        className="relative mt-10 select-none [--gap:132px] sm:[--gap:168px] lg:[--gap:216px]"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <div className="relative mx-auto h-[340px] max-w-full sm:h-[380px] lg:h-[420px]">
          {RUBROS.map((rubro, index) => {
            const offset = circularOffset(index, active, TOTAL);
            const dist = Math.abs(offset);
            const isActive = offset === 0;

            const scale = dist === 0 ? 1 : dist === 1 ? 0.82 : dist === 2 ? 0.66 : 0.52;
            const opacity = dist === 0 ? 1 : dist === 1 ? 0.88 : dist === 2 ? 0.5 : dist === 3 ? 0.15 : 0;
            const zIndex = 50 - dist * 10;

            return (
              <div
                key={rubro.name}
                aria-hidden={!isActive}
                className="absolute left-1/2 top-1/2 w-[210px] transition-[transform,opacity] duration-[800ms] ease-[cubic-bezier(0.22,1,0.36,1)] sm:w-[250px] lg:w-[288px]"
                style={{
                  zIndex,
                  opacity,
                  pointerEvents: dist > 3 ? "none" : "auto",
                  transform: `translate(-50%, -50%) translateX(calc(${offset} * var(--gap))) scale(${scale})`,
                }}
              >
                <div
                  className={`group relative aspect-[3/4] overflow-hidden rounded-[22px] border bg-[var(--pub-bg-elevated)] transition-colors duration-500 ${
                    isActive
                      ? "border-[var(--pub-accent)] shadow-[0_20px_55px_var(--pub-shadow-color),0_0_0_1px_var(--pub-accent-soft-border),0_0_40px_-8px_var(--pub-accent)]"
                      : "border-[var(--pub-border)] shadow-[0_12px_30px_var(--pub-shadow-color)]"
                  }`}
                >
                  <img
                    src={rubro.image}
                    alt={rubro.name}
                    className="absolute inset-0 h-full w-full object-cover"
                    draggable={false}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-black/5" />

                  <div className="absolute inset-x-0 bottom-0 p-4">
                    <p
                      className={`font-bold leading-tight text-white transition-all duration-500 ${
                        isActive ? "text-base sm:text-lg" : "text-[13px] sm:text-sm"
                      }`}
                    >
                      {rubro.name}
                    </p>
                    <p
                      className={`mt-1 text-white/75 transition-opacity duration-500 ${
                        isActive ? "text-xs opacity-100 sm:text-[13px]" : "text-[11px] opacity-0"
                      }`}
                    >
                      {rubro.phrase}
                    </p>
                  </div>

                  {isActive && (
                    <span className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-[var(--pub-accent)] text-[var(--pub-accent-text)] shadow-[0_6px_16px_var(--pub-shadow-color)]">
                      <ArrowRight className="h-4 w-4" />
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Flechas */}
        <button
          type="button"
          aria-label="Rubro anterior"
          onClick={() => goTo(active - 1)}
          className="absolute left-0 top-1/2 z-[60] hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-[var(--pub-border)] bg-[var(--pub-bg-elevated)] text-[var(--pub-text)] shadow-sm transition hover:border-[var(--pub-accent-soft-border)] hover:text-[var(--pub-accent)] sm:flex lg:left-4"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <button
          type="button"
          aria-label="Siguiente rubro"
          onClick={() => goTo(active + 1)}
          className="absolute right-0 top-1/2 z-[60] hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-[var(--pub-border)] bg-[var(--pub-bg-elevated)] text-[var(--pub-text)] shadow-sm transition hover:border-[var(--pub-accent-soft-border)] hover:text-[var(--pub-accent)] sm:flex lg:right-4"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      {/* Indicadores */}
      <div className="mt-6 flex items-center justify-center gap-2">
        {RUBROS.map((rubro, index) => (
          <button
            key={rubro.name}
            type="button"
            aria-label={`Ir a ${rubro.name}`}
            onClick={() => goTo(index)}
            className={`h-1.5 rounded-full transition-all duration-500 ${
              index === active ? "w-6 bg-[var(--pub-accent)]" : "w-1.5 bg-[var(--pub-border)]"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
