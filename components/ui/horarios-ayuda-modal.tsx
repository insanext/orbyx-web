"use client";

import { useEffect, useState } from "react";
import { Building2, CalendarDays, ChevronDown, MapPin, UserCheck, X } from "lucide-react";

type Capa = "negocio" | "sucursal" | "staff" | "especial";

type CapaColor = {
  border: string;
  bg: string;
  chipBg: string;
  chipText: string;
};

type CapaInfo = {
  id: Capa;
  numero: number;
  nombre: string;
  icon: typeof Building2;
  color: CapaColor;
  titulo: string;
  descripcion: string;
  ejemplo: string;
};

const CAPAS: CapaInfo[] = [
  {
    id: "negocio",
    numero: 1,
    nombre: "Negocio",
    icon: Building2,
    color: {
      border: "rgba(37,99,235,0.5)",
      bg: "rgba(37,99,235,0.06)",
      chipBg: "rgba(37,99,235,0.12)",
      chipText: "rgb(37,99,235)",
    },
    titulo: "Horario del negocio",
    descripcion:
      "Es la base: define la disponibilidad general para todas las sucursales que no tengan un horario propio.",
    ejemplo:
      "Si el negocio abre de lunes a viernes de 9:00 a 18:00, ninguna sucursal ni profesional puede ofrecer horas fuera de ese rango, salvo que tenga su propio horario habilitado.",
  },
  {
    id: "sucursal",
    numero: 2,
    nombre: "Sucursal",
    icon: MapPin,
    color: {
      border: "rgba(16,185,129,0.5)",
      bg: "rgba(16,185,129,0.06)",
      chipBg: "rgba(16,185,129,0.14)",
      chipText: "rgb(5,150,105)",
    },
    titulo: "Horario de la sucursal",
    descripcion:
      "Cada sucursal puede usar el horario global del negocio o definir uno propio, siempre dentro de lo que el negocio permite.",
    ejemplo:
      "Una sucursal puede cerrar los sábados aunque el negocio esté abierto ese día, pero no puede abrir domingo si el negocio no lo permite.",
  },
  {
    id: "staff",
    numero: 3,
    nombre: "Staff",
    icon: UserCheck,
    color: {
      border: "rgba(245,158,11,0.5)",
      bg: "rgba(245,158,11,0.07)",
      chipBg: "rgba(245,158,11,0.16)",
      chipText: "rgb(180,120,10)",
    },
    titulo: "Horario del profesional",
    descripcion:
      "Cada profesional puede heredar el horario efectivo de la sucursal o tener uno propio, dentro de ese mismo margen.",
    ejemplo:
      "Si la sucursal atiende hasta las 20:00, un profesional puede trabajar solo hasta las 17:00, pero no puede ofrecer horas después de las 20:00.",
  },
  {
    id: "especial",
    numero: 4,
    nombre: "Días especiales",
    icon: CalendarDays,
    color: {
      border: "rgba(244,63,94,0.5)",
      bg: "rgba(244,63,94,0.06)",
      chipBg: "rgba(244,63,94,0.12)",
      chipText: "rgb(225,29,72)",
    },
    titulo: "Días y horarios excepcionales",
    descripcion:
      "Feriados, cierres puntuales o jornadas especiales a nivel de negocio, sucursal o staff. Aplican para un día concreto por sobre las capas anteriores.",
    ejemplo:
      "Un profesional que normalmente atiende puede marcar un día libre puntual, o el negocio puede cerrar un feriado aunque el horario semanal diga que está abierto.",
  },
];

type HorariosAyudaModalProps = {
  open: boolean;
  onClose: () => void;
  capaActiva: Capa | null;
};

export function HorariosAyudaModal({ open, onClose, capaActiva }: HorariosAyudaModalProps) {
  const [expandedId, setExpandedId] = useState<Capa | null>(capaActiva);

  useEffect(() => {
    if (open) {
      setExpandedId(capaActiva);
    }
  }, [open, capaActiva]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <button
        type="button"
        className="absolute inset-0 bg-slate-950/55 backdrop-blur-sm"
        aria-label="Cerrar"
        onClick={onClose}
      />

      <div
        className="relative z-10 max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-3xl border p-5 shadow-2xl sm:p-6"
        style={{
          borderColor: "var(--border-color)",
          background: "var(--bg-card)",
        }}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold" style={{ color: "var(--text-main)" }}>
              ¿Cómo funcionan los horarios?
            </h3>
            <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
              Orbyx calcula la disponibilidad en capas. Cada capa puede restringir lo que dice la anterior.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border"
            style={{
              borderColor: "var(--border-color)",
              background: "var(--bg-soft)",
              color: "var(--text-main)",
            }}
          >
            <X size={18} />
          </button>
        </div>

        <div className="mt-5 space-y-0">
          {CAPAS.map((capa, idx) => {
            const isActive = capaActiva === capa.id;
            const dimmed = capaActiva !== null && !isActive;
            const isExpanded = expandedId === capa.id;
            const Icon = capa.icon;
            const isLast = idx === CAPAS.length - 1;
            const dividerLabel = idx === CAPAS.length - 2 ? "puede sobreescribir todo" : "restringe";

            return (
              <div key={capa.id}>
                <div
                  className="rounded-2xl border p-4 transition-opacity"
                  style={{
                    borderColor: isActive ? capa.color.border : "var(--border-color)",
                    borderWidth: isActive ? 2 : 1,
                    background: isActive ? capa.color.bg : "var(--bg-soft)",
                    opacity: dimmed ? 0.4 : 1,
                  }}
                >
                  <div className="flex items-start gap-3">
                    <span
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
                      style={{ background: capa.color.chipBg, color: capa.color.chipText }}
                    >
                      <Icon size={18} />
                    </span>

                    <div className="min-w-0 flex-1">
                      <span
                        className="inline-block rounded-full px-2 py-0.5 text-[11px] font-semibold"
                        style={{ background: capa.color.chipBg, color: capa.color.chipText }}
                      >
                        Capa {capa.numero} · {capa.nombre}
                      </span>

                      <p className="mt-1.5 text-sm font-semibold" style={{ color: "var(--text-main)" }}>
                        {capa.titulo}
                      </p>
                      <p className="mt-1 text-sm leading-5" style={{ color: "var(--text-muted)" }}>
                        {capa.descripcion}
                      </p>

                      <button
                        type="button"
                        onClick={() => setExpandedId(isExpanded ? null : capa.id)}
                        className="mt-2 inline-flex items-center gap-1 text-xs font-medium"
                        style={{ color: capa.color.chipText }}
                      >
                        <ChevronDown
                          size={14}
                          style={{
                            transform: isExpanded ? "rotate(180deg)" : "none",
                            transition: "transform 0.15s",
                          }}
                        />
                        {isExpanded ? "Ocultar ejemplo" : "Ver ejemplo"}
                      </button>

                      {isExpanded ? (
                        <p
                          className="mt-2 rounded-xl border px-3 py-2 text-xs leading-5"
                          style={{
                            borderColor: "var(--border-color)",
                            background: "var(--bg-card)",
                            color: "var(--text-muted)",
                          }}
                        >
                          {capa.ejemplo}
                        </p>
                      ) : null}
                    </div>
                  </div>
                </div>

                {!isLast ? (
                  <div className="flex items-center justify-center py-1.5">
                    <span
                      className="text-[10px] font-semibold uppercase tracking-[0.14em]"
                      style={{ color: "var(--text-muted)" }}
                    >
                      {dividerLabel}
                    </span>
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>

        <div
          className="mt-5 rounded-2xl border px-4 py-3 text-sm leading-5"
          style={{
            borderColor: "var(--border-color)",
            background: "var(--bg-soft)",
            color: "var(--text-muted)",
          }}
        >
          El cliente solo ve un horario disponible cuando todas las capas coinciden. Si cualquiera dice
          &quot;no disponible&quot;, ese slot no aparece.
        </div>
      </div>
    </div>
  );
}
