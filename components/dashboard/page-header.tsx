type PageHeaderProps = {
  eyebrow?: string;
  title: string;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  icon?: React.ReactNode;
  className?: string;
  children?: React.ReactNode;
};

// Encabezado estándar de panel del dashboard (estandarización 2026-09-29):
// réplica exacta del hero de "Mi Negocio" (business/page.tsx) — tarjeta de
// esquinas rectas (`rounded`), borde azul suave, degradado que se funde con
// --bg-card (funciona igual en modo claro y oscuro), icono en caja cuadrada
// y eyebrow/título/descripción. Lo usan Campañas, Servicios, Staff,
// Mi suscripción e Indicadores. Agenda, Clientes y Reseñas tienen su propio
// hero page-local ("encabezado cuadrado") y NO usan este componente.
export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
  icon,
  className,
  children,
}: PageHeaderProps) {
  return (
    <section
      className={`relative overflow-hidden rounded border px-4 py-2.5 shadow-[0_18px_46px_-28px_rgba(37,99,235,0.55),0_0_34px_-24px_rgba(56,189,248,0.48)] ${className || ""}`}
      style={{
        borderColor: "rgba(59,130,246,0.25)",
        background:
          "linear-gradient(135deg, rgba(37,99,235,0.18), rgba(14,165,233,0.08) 35%, var(--bg-card) 85%)",
      }}
    >
      <div className="pointer-events-none absolute inset-x-8 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(37,99,235,0.42),rgba(34,211,238,0.35),transparent)]" />
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex min-w-0 max-w-3xl items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded border border-blue-300/70 bg-[linear-gradient(135deg,rgb(37_99_235),rgb(14_165_233)_48%,rgb(79_70_229))] text-white shadow-[0_18px_32px_-16px_rgba(37,99,235,0.95),0_0_26px_-12px_rgba(56,189,248,0.85)]">
            {icon || <span className="text-xs font-bold">O</span>}
          </div>
          <div className="min-w-0">
            {eyebrow ? (
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-blue-600">{eyebrow}</p>
            ) : null}
            <h1 className="mt-0.5 text-lg font-semibold" style={{ color: "var(--text-main)" }}>
              {title}
            </h1>
            {description ? (
              <p className="mt-0.5 text-sm leading-5">
                {description}
              </p>
            ) : null}
          </div>
        </div>

        {actions ? <div className="relative z-10 min-w-0 shrink-0">{actions}</div> : null}
      </div>

      {children}
    </section>
  );
}
