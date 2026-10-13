// Categorías de cliente — SOLO presentación (etiquetas, textos, orden).
//
// La clasificación (qué categoría tiene cada cliente, desde cuándo, cuántas
// visitas asistidas, etc.) la calcula ÚNICAMENTE el backend
// (server.js → getCustomerCategoryMap). El frontend nunca recalcula nada:
// recibe `category`, `category_label`, `category_reason`, `attended_visits`,
// `last_visit_at` y `days_since_last_visit` ya listos en cada cliente.

export type CustomerCategory = "prospect" | "new" | "active" | "at_risk" | "inactive";

export type CustomerCategoryThresholds = {
  recent_days: number;
  at_risk_days: number;
};

export type CustomerCategoryOption = {
  key: CustomerCategory;
  // Plural, para filtros y listados ("Nuevos").
  label: string;
  // Singular, para el badge de un cliente ("Nuevo").
  singular: string;
};

export const CUSTOMER_CATEGORY_OPTIONS: CustomerCategoryOption[] = [
  { key: "prospect", label: "Prospectos", singular: "Prospecto" },
  { key: "new", label: "Nuevos", singular: "Nuevo" },
  { key: "active", label: "Activos", singular: "Activo" },
  { key: "at_risk", label: "En riesgo", singular: "En riesgo" },
  { key: "inactive", label: "Inactivos", singular: "Inactivo" },
];

export function isCustomerCategory(value: unknown): value is CustomerCategory {
  return CUSTOMER_CATEGORY_OPTIONS.some((o) => o.key === value);
}

export function getCustomerCategorySingular(category?: string | null): string {
  return CUSTOMER_CATEGORY_OPTIONS.find((o) => o.key === category)?.singular || "Sin categoría";
}

// Texto corto que explica la categoría. Los números salen de los umbrales que
// informa el backend; si todavía no llegaron, se usa una frase sin números.
export function describeCustomerCategory(
  category: CustomerCategory,
  thresholds?: CustomerCategoryThresholds | null
): string {
  const recent = thresholds?.recent_days;
  const atRisk = thresholds?.at_risk_days;

  switch (category) {
    case "prospect":
      return "Todavía no ha asistido a ninguna cita: la canceló, no llegó o la tiene pendiente.";
    case "new":
      return recent
        ? `Vino 1 vez y fue hace ${recent} días o menos.`
        : "Vino 1 vez, hace poco.";
    case "active":
      return recent
        ? `Vino 2 veces o más y la última fue hace ${recent} días o menos.`
        : "Vino 2 veces o más y volvió hace poco.";
    case "at_risk":
      return recent && atRisk
        ? `Su última visita fue hace entre ${recent + 1} y ${atRisk} días.`
        : "Hace un tiempo que no viene.";
    case "inactive":
      return atRisk
        ? `Su última visita fue hace más de ${atRisk} días.`
        : "Hace mucho que no viene.";
    default:
      return "";
  }
}

// Opciones del filtro "días sin venir" (mínimo de días desde la última visita
// asistida). "" = sin filtro. Los prospectos nunca calzan con este filtro.
export const DAYS_WITHOUT_VISIT_OPTIONS: Array<{ value: string; label: string }> = [
  { value: "", label: "Cualquiera" },
  { value: "30", label: "30 días o más" },
  { value: "60", label: "60 días o más" },
  { value: "90", label: "90 días o más" },
  { value: "120", label: "120 días o más" },
  { value: "180", label: "180 días o más" },
];
