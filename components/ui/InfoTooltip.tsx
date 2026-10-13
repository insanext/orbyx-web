"use client";

import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Info } from "lucide-react";

// Tooltip reutilizable (Clientes, Campañas, ...).
//
// - Escritorio: aparece al pasar el mouse (solo mouse, no por toques) y al
//   enfocar con el teclado (Tab). Escape lo cierra.
// - Celular / pantallas sin "hover": aparece un ícono "i" pequeño junto al
//   elemento; al tocarlo se muestra la descripción y se cierra al tocar en
//   otra parte, al hacer scroll o a los 5 segundos.
// - Se dibuja en un portal con position:fixed, pegado al elemento y recortado
//   a los bordes de la pantalla: nunca queda cortado por un contenedor con
//   scroll ni tapa los botones (pointer-events: none).
// - El texto también queda disponible para lectores de pantalla.

const GAP = 8;
const EDGE = 8;
const TOUCH_AUTOCLOSE_MS = 5000;

// ¿La última interacción fue con teclado? (para no dejar el tooltip pegado
// cuando un elemento recibe foco por un clic con el mouse).
let keyboardModality = false;
let listenersReady = false;
function ensureModalityListeners() {
  if (listenersReady || typeof document === "undefined") return;
  listenersReady = true;
  document.addEventListener("keydown", () => (keyboardModality = true), true);
  document.addEventListener("pointerdown", () => (keyboardModality = false), true);
}

type Props = {
  text: string;
  children: React.ReactNode;
  // Clases del contenedor (por defecto inline-flex).
  className?: string;
  // Muestra el ícono "i" en pantallas táctiles (por defecto sí).
  touchIcon?: boolean;
};

export default function InfoTooltip({ text, children, className = "", touchIcon = true }: Props) {
  const id = useId();
  const wrapRef = useRef<HTMLSpanElement | null>(null);
  const tipRef = useRef<HTMLDivElement | null>(null);
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
  const autoCloseRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    ensureModalityListeners();
  }, []);

  // Posición: debajo del elemento; si no cabe, arriba. Siempre dentro de la pantalla.
  useLayoutEffect(() => {
    if (!open) return;
    const anchor = wrapRef.current;
    const tip = tipRef.current;
    if (!anchor || !tip) return;

    const rect = anchor.getBoundingClientRect();
    const w = tip.offsetWidth;
    const h = tip.offsetHeight;
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    let left = rect.left + rect.width / 2 - w / 2;
    left = Math.max(EDGE, Math.min(left, vw - w - EDGE));

    let top = rect.bottom + GAP;
    if (top + h > vh - EDGE && rect.top - h - GAP >= EDGE) {
      top = rect.top - h - GAP;
    }
    top = Math.max(EDGE, Math.min(top, vh - h - EDGE));

    setPos({ top, left });
  }, [open, text]);

  // Cerrar con Escape, al tocar fuera, al hacer scroll o al cambiar el tamaño.
  useEffect(() => {
    if (!open) return;

    function close() {
      setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") close();
    }
    function onPointerDown(e: PointerEvent) {
      const target = e.target as Node | null;
      if (target && wrapRef.current?.contains(target)) return;
      close();
    }

    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onPointerDown, true);
    window.addEventListener("scroll", close, true);
    window.addEventListener("resize", close);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onPointerDown, true);
      window.removeEventListener("scroll", close, true);
      window.removeEventListener("resize", close);
    };
  }, [open]);

  useEffect(() => {
    return () => {
      if (autoCloseRef.current) clearTimeout(autoCloseRef.current);
    };
  }, []);

  function toggleFromTouch() {
    if (autoCloseRef.current) clearTimeout(autoCloseRef.current);
    setOpen((prev) => {
      const next = !prev;
      if (next) {
        autoCloseRef.current = setTimeout(() => setOpen(false), TOUCH_AUTOCLOSE_MS);
      }
      return next;
    });
  }

  return (
    <span
      ref={wrapRef}
      className={`relative inline-flex items-center gap-0.5 ${className}`}
      aria-describedby={open ? id : undefined}
      onPointerEnter={(e) => {
        // Solo mouse real en pantallas con hover (en táctiles manda el ícono "i").
        if (e.pointerType === "mouse" && window.matchMedia("(hover: hover)").matches) setOpen(true);
      }}
      onPointerLeave={(e) => {
        if (e.pointerType === "mouse") setOpen(false);
      }}
      onFocus={() => {
        if (keyboardModality) setOpen(true);
      }}
      onBlur={(e) => {
        if (!wrapRef.current?.contains(e.relatedTarget as Node | null)) setOpen(false);
      }}
    >
      {children}

      {/* Descripción para lectores de pantalla (el tooltip visual no se lee solo). */}
      <span className="sr-only">{text}</span>

      {touchIcon ? (
        <button
          type="button"
          aria-label="Ver descripción"
          aria-expanded={open}
          onClick={(e) => {
            e.stopPropagation();
            toggleFromTouch();
          }}
          className="hidden h-6 w-6 shrink-0 cursor-pointer items-center justify-center rounded-full text-slate-500 transition-colors hover:bg-slate-500/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 [@media(hover:none)]:inline-flex"
        >
          <Info className="h-3.5 w-3.5" aria-hidden="true" />
        </button>
      ) : null}

      {open && typeof document !== "undefined"
        ? createPortal(
            <div
              ref={tipRef}
              id={id}
              role="tooltip"
              className="pointer-events-none fixed z-[130] rounded-md bg-slate-900 px-3 py-2 text-xs font-medium leading-snug text-white shadow-lg ring-1 ring-white/10"
              style={{
                top: pos?.top ?? 0,
                left: pos?.left ?? 0,
                width: "max-content",
                maxWidth: "min(280px, calc(100vw - 16px))",
                visibility: pos ? "visible" : "hidden",
              }}
            >
              {text}
            </div>,
            document.body
          )
        : null}
    </span>
  );
}
