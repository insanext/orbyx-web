"use client";

import InfoTooltip from "@/components/ui/InfoTooltip";
import {
  CUSTOMER_CATEGORY_OPTIONS,
  describeCustomerCategory,
  type CustomerCategory,
  type CustomerCategoryThresholds,
} from "@/lib/customer-categories";

// Botones de filtro por categoría de cliente (Clientes y Campañas): mismo
// componente y mismos textos en los dos lugares. Cada botón muestra su
// descripción en un tooltip; los días (60/120) vienen de los umbrales que
// informa el backend, no están escritos acá.
//
// Colores: toma las variables de la página donde se use (--cust-* en Clientes,
// --border-color / --bg-card / ... en Campañas), con valores de respaldo.
export default function CategoryFilterButtons({
  value,
  onChange,
  thresholds,
  includeAll = false,
  ariaLabel = "Filtrar por categoría de cliente",
  className = "",
}: {
  value: string;
  onChange: (key: string) => void;
  thresholds?: CustomerCategoryThresholds | null;
  // Agrega el botón "Todos" (listado de Clientes).
  includeAll?: boolean;
  ariaLabel?: string;
  className?: string;
}) {
  const options: Array<{ key: CustomerCategory | "all"; label: string }> = [
    ...(includeAll ? [{ key: "all" as const, label: "Todos" }] : []),
    ...CUSTOMER_CATEGORY_OPTIONS.map((o) => ({ key: o.key, label: o.label })),
  ];

  const cssVars = {
    "--cf-border": "var(--cust-pill-border, var(--border-color, #cbd5e1))",
    "--cf-bg": "var(--cust-card-bg, var(--bg-card, #ffffff))",
    "--cf-ink": "var(--cust-ink, var(--text-main, #0f172a))",
    "--cf-hover-bg": "var(--cust-blue-tint, var(--bg-soft, #eff6ff))",
    "--cf-accent": "var(--cust-blue-solid, #2563eb)",
  } as React.CSSProperties;

  return (
    <div role="group" aria-label={ariaLabel} className={`flex flex-wrap gap-1.5 ${className}`} style={cssVars}>
      {options.map((o) => {
        const active = value === o.key;
        return (
          <InfoTooltip key={o.key} text={describeCustomerCategory(o.key, thresholds)}>
            <button
              type="button"
              aria-pressed={active}
              data-active={active ? "true" : "false"}
              onClick={() => onChange(o.key)}
              className={[
                "cursor-pointer rounded border px-2.5 py-1 text-xs font-medium transition-colors duration-150",
                "border-[color:var(--cf-border)] bg-[color:var(--cf-bg)] text-[color:var(--cf-ink)]",
                "hover:border-[color:var(--cf-accent)] hover:bg-[color:var(--cf-hover-bg)]",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--cf-accent)] focus-visible:ring-offset-1",
                "data-[active=true]:border-[color:var(--cf-accent)] data-[active=true]:bg-[color:var(--cf-accent)] data-[active=true]:text-white",
                "data-[active=true]:hover:border-[color:var(--cf-accent)] data-[active=true]:hover:bg-[color:var(--cf-accent)] data-[active=true]:hover:brightness-90",
              ].join(" ")}
            >
              {o.label}
            </button>
          </InfoTooltip>
        );
      })}
    </div>
  );
}
