// Fuente única de colores por estado de reserva/actividad para el calendario.
// Cualquier componente que pinte un estado de reserva debe importar esto
// en vez de declarar colores sueltos.
//
// IMPORTANTE: los colores se aplican via clases CSS generadas en
// STATUS_STYLESHEET (ver abajo), NO via clases Tailwind arbitrary-value
// construidas dinámicamente (ej. `border-[${algo}]`). Tailwind escanea el
// texto fuente en build time: si el valor entre corchetes es una expresión
// JS interpolada, el string completo nunca aparece literal en el archivo y
// Tailwind no genera ningún CSS para esa clase (aunque el className final
// en el DOM se vea "correcto" en el navegador). Por eso las tarjetas se
// veían sin color: las clases existían en el DOM pero no había regla CSS
// que las respaldara.

export type AppointmentStatusKey =
  | "confirmed"
  | "booked"
  | "no_show"
  | "rescheduled"
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
  no_show: { rgb: "107,114,128", hex: "#6B7280", onDark: "#F3F4F6", label: "No asistió" },
  rescheduled: { rgb: "139,92,246", hex: "#8B5CF6", onDark: "#F5F3FF", label: "Reagendado" },
  canceled: { rgb: "239,68,68", hex: "#EF4444", onDark: "#FEF2F2", label: "Cancelado" },
  // Estado adicional (no viene en la tabla original de 7): cierre de asistencia
  // pendiente. Usa rosa para no chocar con "Cancelado" (rojo).
  pending_close: { rgb: "236,72,153", hex: "#EC4899", onDark: "#FDF2F8", label: "Falta cierre" },
  // Actividad grupal usa un morado/índigo distinto del de "Reagendado" para
  // que ambos se puedan diferenciar cuando aparecen cerca en el calendario.
  group_activity: { rgb: "99,102,241", hex: "#6366F1", onDark: "#EEF2FF", label: "Actividad grupal" },
};

const CARD_BORDER_ALPHA_OVERRIDE: Partial<Record<AppointmentStatusKey, number>> = {
  canceled: 0.6,
  no_show: 0.6,
};

function darkRgb(rgb: string): string {
  const [r, g, b] = rgb.split(",").map(Number);
  return `${Math.round(r * 0.45)},${Math.round(g * 0.45)},${Math.round(b * 0.45)}`;
}

/**
 * Hoja de estilos con una clase por estado, generada una sola vez a partir
 * de APPOINTMENT_STATUS_COLORS. Se inyecta con <style>{STATUS_STYLESHEET}</style>
 * en el componente de agenda. Usa nombres de clase fijos (no arbitrary-value
 * de Tailwind) para que el navegador los aplique siempre, sin depender del
 * escaneo estático de Tailwind.
 */
export const STATUS_STYLESHEET = Object.entries(APPOINTMENT_STATUS_COLORS)
  .map(([key, color]) => {
    const borderAlpha = CARD_BORDER_ALPHA_OVERRIDE[key as AppointmentStatusKey] ?? 0.8;
    return `
.orbyx-status-card-${key} {
  border-color: rgba(${color.rgb},${borderAlpha});
  background: linear-gradient(135deg, rgba(${darkRgb(color.rgb)},0.90), rgba(${color.rgb},0.56));
  box-shadow: 0 0 18px -10px rgba(${color.rgb},0.85);
}
.orbyx-status-card-${key}:hover {
  border-color: rgba(${color.rgb},0.95);
  box-shadow: 0 0 24px -9px rgba(${color.rgb},0.95);
}
.orbyx-status-badge-${key} {
  border-color: rgba(${color.rgb},0.3);
  background: rgba(${color.rgb},0.1);
  color: ${color.hex};
}
.orbyx-status-icon-${key} {
  color: rgba(${color.rgb},0.9);
}`;
  })
  .join("\n");

export function statusRgba(key: AppointmentStatusKey, alpha: number): string {
  return `rgba(${APPOINTMENT_STATUS_COLORS[key].rgb},${alpha})`;
}

/** Sombra de brillo (glow), usada inline (ej. puntos de leyenda). */
export function statusGlow(key: AppointmentStatusKey, alpha = 0.85): string {
  return `0 0 18px -10px ${statusRgba(key, alpha)}`;
}
