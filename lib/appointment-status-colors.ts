// Fuente única de colores por estado de reserva/actividad para el calendario.
// Cualquier componente que pinte un estado de reserva debe importar esto
// en vez de declarar colores sueltos.

export type AppointmentStatusKey =
  | "confirmed"
  | "booked"
  | "pending"
  | "no_show"
  | "rescheduled"
  | "in_progress"
  | "canceled"
  | "pending_close"
  | "group_activity";

export interface AppointmentStatusColor {
  /** "R,G,B" para usar dentro de rgba(...) */
  rgb: string;
  /** Hex sólido, para texto o bordes sólidos */
  hex: string;
  /** Color de texto legible sobre el hex (fondos oscuros de tarjeta) */
  onDark: string;
  label: string;
}

export const APPOINTMENT_STATUS_COLORS: Record<
  AppointmentStatusKey,
  AppointmentStatusColor
> = {
  confirmed: { rgb: "16,185,129", hex: "#10B981", onDark: "#ECFDF5", label: "Confirmado / Asistió" },
  booked: { rgb: "59,130,246", hex: "#3B82F6", onDark: "#EFF6FF", label: "Agendado" },
  pending: { rgb: "245,158,11", hex: "#F59E0B", onDark: "#FFFBEB", label: "Pendiente" },
  no_show: { rgb: "107,114,128", hex: "#6B7280", onDark: "#F3F4F6", label: "No-show" },
  rescheduled: { rgb: "139,92,246", hex: "#8B5CF6", onDark: "#F5F3FF", label: "Reagendado" },
  in_progress: { rgb: "6,182,212", hex: "#06B6D4", onDark: "#ECFEFF", label: "En curso" },
  canceled: { rgb: "239,68,68", hex: "#EF4444", onDark: "#FEF2F2", label: "Cancelado" },
  // Estado adicional (no viene en la tabla original de 7): cierre de asistencia
  // pendiente. Usa rosa para no chocar con "Cancelado" (rojo).
  pending_close: { rgb: "236,72,153", hex: "#EC4899", onDark: "#FDF2F8", label: "Falta cierre" },
  // Actividad grupal usa un morado/índigo distinto del de "Reagendado" para
  // que ambos se puedan diferenciar cuando aparecen cerca en el calendario.
  group_activity: { rgb: "99,102,241", hex: "#6366F1", onDark: "#EEF2FF", label: "Actividad grupal" },
};

export function statusRgba(key: AppointmentStatusKey, alpha: number): string {
  return `rgba(${APPOINTMENT_STATUS_COLORS[key].rgb},${alpha})`;
}

/** Gradiente diagonal oscuro→vivo para tarjetas, derivado de un único rgb fuente. */
export function statusCardGradient(key: AppointmentStatusKey): string {
  const [r, g, b] = APPOINTMENT_STATUS_COLORS[key].rgb.split(",").map(Number);
  const dark = `${Math.round(r * 0.45)},${Math.round(g * 0.45)},${Math.round(
    b * 0.45
  )}`;
  return `linear-gradient(135deg,rgba(${dark},0.90),${statusRgba(key, 0.56)})`;
}

/** Sombra de brillo (glow) usada en tarjetas y puntos de leyenda. */
export function statusGlow(key: AppointmentStatusKey, alpha = 0.85): string {
  return `0 0 18px -10px ${statusRgba(key, alpha)}`;
}
