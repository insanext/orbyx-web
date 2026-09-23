"use client";

import { useEffect, useRef, useState } from "react";

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
    image: "/rubros/veterinarias.png",
  },
  {
    name: "Peluquerías y barberías",
    phrase: "Cortes y estilo, cita a cita.",
    image: "https://images.unsplash.com/photo-1635273051937-a0ddef9573b6?w=500&h=640&fit=crop&q=80",
  },
  {
    name: "Talleres mecánicos",
    phrase: "Organiza tus trabajos y citas.",
    image: "https://images.unsplash.com/photo-1615906655593-ad0386982a0f?w=500&h=640&fit=crop&q=80",
  },
  {
    name: "Spa y masajes",
    phrase: "Relájalos y que vuelvan seguido.",
    image: "/rubros/spa-y-masajes.png",
  },
  {
    name: "Manicure y uñas",
    phrase: "Cada diseño, agendado a tiempo.",
    image: "https://images.unsplash.com/photo-1632345031435-8727f6897d53?w=500&h=640&fit=crop&q=80",
  },
  {
    name: "Clases grupales",
    phrase: "Cupos y horarios siempre claros.",
    image: "/rubros/clases-grupales.png",
  },
  {
    name: "Academias y cursos",
    phrase: "Inscripciones y clases bajo control.",
    image: "/rubros/academias-y-cursos.png",
  },
];

const TOTAL = RUBROS.length;
const AUTOPLAY_MS = 3800;
const DEFAULT_GAP = 216;
const RESUME_DELAY_HOVER = 1500;
const RESUME_DELAY_DRAG = 2500;

// Distancia circular con signo más corta entre `index` y `position` (con 8
// tarjetas, va de -4 a 4). Funciona con `position` fraccional para que el
// drag se pueda seguir en tiempo real.
function circularOffset(index: number, position: number, total: number) {
  let diff = index - position;
  diff = ((diff % total) + total) % total;
  if (diff > total / 2) diff -= total;
  return diff;
}

function normalize(p: number, total: number) {
  return ((p % total) + total) % total;
}

export function RubrosCarousel() {
  const [position, setPosition] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [paused, setPaused] = useState(false);
  const [gap, setGap] = useState(DEFAULT_GAP);

  const trackRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ startX: number; startPosition: number } | null>(null);
  const resumeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    function measure() {
      if (!trackRef.current) return;
      const raw = getComputedStyle(trackRef.current).getPropertyValue("--gap");
      const px = parseFloat(raw);
      if (!Number.isNaN(px) && px > 0) setGap(px);
    }
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  useEffect(() => {
    if (paused || isDragging) return;
    const id = setInterval(() => {
      setPosition((p) => normalize(Math.round(p) + 1, TOTAL));
    }, AUTOPLAY_MS);
    return () => clearInterval(id);
  }, [paused, isDragging, position]);

  useEffect(() => {
    return () => {
      if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current);
    };
  }, []);

  function scheduleResume(delay: number) {
    if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current);
    resumeTimerRef.current = setTimeout(() => setPaused(false), delay);
  }

  function goTo(index: number) {
    if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current);
    setPosition(normalize(index, TOTAL));
    setPaused(true);
    scheduleResume(RESUME_DELAY_DRAG);
  }

  function handlePointerDown(e: React.PointerEvent) {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    dragRef.current = { startX: e.clientX, startPosition: position };
    setIsDragging(true);
    setPaused(true);
    if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current);
  }

  function handlePointerMove(e: React.PointerEvent) {
    if (!dragRef.current) return;
    const deltaX = e.clientX - dragRef.current.startX;
    setPosition(dragRef.current.startPosition - deltaX / gap);
  }

  function endDrag() {
    if (!dragRef.current) return;
    dragRef.current = null;
    setIsDragging(false);
    setPosition((p) => normalize(Math.round(p), TOTAL));
    scheduleResume(RESUME_DELAY_DRAG);
  }

  function handleMouseEnterTrack() {
    if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current);
    setPaused(true);
  }

  function handleMouseLeaveTrack() {
    setHoveredIndex(null);
    if (isDragging) return;
    scheduleResume(RESUME_DELAY_HOVER);
  }

  const activeIndex = Math.round(normalize(position, TOTAL)) % TOTAL;

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
        ref={trackRef}
        className={`relative mt-10 select-none [--gap:132px] sm:[--gap:168px] lg:[--gap:216px] ${
          isDragging ? "cursor-grabbing" : "cursor-grab"
        }`}
        style={{ touchAction: "pan-y" }}
        onMouseEnter={handleMouseEnterTrack}
        onMouseLeave={handleMouseLeaveTrack}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
      >
        <div className="relative mx-auto h-[340px] max-w-full sm:h-[380px] lg:h-[420px]">
          {RUBROS.map((rubro, index) => {
            const offset = circularOffset(index, position, TOTAL);
            const dist = Math.abs(offset);
            const isCentered = dist < 0.5;
            const isHovered = hoveredIndex === index && !isDragging;

            let scale = Math.max(0.5, 1 - dist * 0.17);
            let opacity = Math.max(0, 1 - dist * 0.26);
            if (isHovered && !isCentered) {
              scale = Math.min(1, scale + 0.07);
              opacity = Math.min(1, opacity + 0.25);
            }
            const zIndex = Math.round(50 - dist * 10) + (isHovered ? 5 : 0);

            return (
              <div
                key={rubro.name}
                aria-hidden={!isCentered}
                onMouseEnter={() => setHoveredIndex(index)}
                onMouseLeave={() => setHoveredIndex((h) => (h === index ? null : h))}
                className="absolute left-1/2 top-1/2 w-[210px] sm:w-[250px] lg:w-[288px]"
                style={{
                  zIndex,
                  opacity,
                  pointerEvents: dist > 3.4 ? "none" : "auto",
                  transform: `translate(-50%, -50%) translateX(${offset * gap}px) scale(${scale})`,
                  // Inline: el reset global `* { transition: background-color/border-color/color/fill/stroke }`
                  // de globals.css no está en capa (@layer) y por cascade layers le gana a
                  // cualquier utilidad de Tailwind para transform/opacity — solo un estilo
                  // inline (máxima prioridad) logra que la fila se deslice de verdad.
                  transitionProperty: isDragging ? "none" : "transform, opacity",
                  transitionDuration: isDragging ? "0ms" : "1050ms",
                  transitionTimingFunction: "cubic-bezier(0,0,0.2,1)",
                }}
              >
                <div
                  className={`group relative aspect-[3/4] overflow-hidden rounded-[22px] border bg-[var(--pub-bg-elevated)] transition-colors duration-500 ${
                    isCentered
                      ? "border-[var(--pub-accent)] shadow-[0_20px_55px_var(--pub-shadow-color),0_0_0_1px_var(--pub-accent-soft-border),0_0_40px_-8px_var(--pub-accent)]"
                      : isHovered
                        ? "border-[var(--pub-accent-soft-border)] shadow-[0_16px_38px_var(--pub-shadow-color)]"
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
                        isCentered ? "text-base sm:text-lg" : "text-[13px] sm:text-sm"
                      }`}
                    >
                      {rubro.name}
                    </p>
                    <p
                      className={`mt-1 text-white/75 transition-opacity duration-500 ${
                        isCentered ? "text-xs opacity-100 sm:text-[13px]" : "text-[11px] opacity-0"
                      }`}
                    >
                      {rubro.phrase}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
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
              index === activeIndex ? "w-6 bg-[var(--pub-accent)]" : "w-1.5 bg-[var(--pub-border)]"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
