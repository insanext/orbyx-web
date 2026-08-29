type PageHeaderProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: React.ReactNode;
  icon?: React.ReactNode;
};

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
  icon,
}: PageHeaderProps) {
  return (
    <div
      className="orbyx-page-header relative mb-4 flex flex-col gap-3 overflow-hidden rounded-2xl border px-4 py-2.5 shadow-[0_18px_46px_-28px_rgba(37,99,235,0.55),0_0_34px_-24px_rgba(56,189,248,0.48)] sm:flex-row sm:items-center sm:justify-between"
      style={{
        background: "var(--page-hero-bg)",
        borderColor: "var(--page-hero-border)",
      }}
    >
      <div
        className="pointer-events-none absolute inset-x-8 top-0 h-px"
        style={{
          background:
            "linear-gradient(90deg, transparent, rgba(37,99,235,0.42), rgba(34,211,238,0.35), transparent)",
        }}
      />

      <div className="relative z-10 flex min-w-0 items-center gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-blue-300/70 bg-[linear-gradient(135deg,rgb(37_99_235),rgb(14_165_233)_48%,rgb(79_70_229))] text-white shadow-[0_18px_32px_-16px_rgba(37,99,235,0.95),0_0_26px_-12px_rgba(56,189,248,0.85)]">
          {icon || <span className="text-xs font-bold">O</span>}
        </div>

        <div className="min-w-0">
          {eyebrow ? (
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em]" style={{ color: "var(--page-hero-eyebrow)" }}>
              {eyebrow}
            </p>
          ) : null}

          <h1 className="mt-0.5 text-lg font-semibold tracking-tight" style={{ color: "var(--page-hero-title)" }}>
            {title}
          </h1>

          {description ? (
            <p className="mt-0.5 max-w-2xl text-sm leading-5" style={{ color: "var(--page-hero-muted)" }}>
              {description}
            </p>
          ) : null}
        </div>
      </div>

      {actions ? <div className="relative z-10 shrink-0">{actions}</div> : null}

      <style jsx>{`
        .orbyx-page-header {
          --page-hero-bg: linear-gradient(135deg, rgba(248,251,255,0.98), rgba(224,238,255,0.9) 48%, rgba(241,248,255,0.98));
          --page-hero-border: rgba(37,99,235,0.42);
          --page-hero-eyebrow: #2563eb;
          --page-hero-title: #0f172a;
          --page-hero-muted: #334155;
        }

        :global(:root[data-theme="nocturno"]) .orbyx-page-header {
          --page-hero-bg: linear-gradient(135deg, rgba(15,23,42,0.96), rgba(12,32,66,0.92) 50%, rgba(17,24,39,0.96));
          --page-hero-border: rgba(56,189,248,0.28);
          --page-hero-eyebrow: #38bdf8;
          --page-hero-title: #f8fafc;
          --page-hero-muted: #cbd5e1;
        }
      `}</style>
    </div>
  );
}
