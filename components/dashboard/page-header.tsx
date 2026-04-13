type PageHeaderProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: React.ReactNode;
};

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: PageHeaderProps) {
  return (
    <div
      className="relative mb-4 flex flex-col gap-3 overflow-hidden rounded-2xl px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
      style={{
        background: "var(--bg-card)",
        border: "1px solid var(--border-color)",
      }}
    >
      {/* ✨ ESTELA DE LUZ */}
      <div
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          background:
            "linear-gradient(120deg, transparent 20%, rgba(59,130,246,0.15) 40%, rgba(14,165,233,0.25) 50%, transparent 70%)",
          backgroundSize: "200% 100%",
          animation: "orbyxShimmer 6s linear infinite",
        }}
      />

      {/* CONTENIDO */}
      <div className="relative z-10">
        {eyebrow ? (
          <p
            className="mb-1 text-[11px] font-semibold uppercase tracking-[0.18em]"
            style={{ color: "var(--text-muted)" }}
          >
            {eyebrow}
          </p>
        ) : null}

        <h1
          className="text-xl font-semibold tracking-tight"
          style={{
            background:
              "linear-gradient(90deg, #2563eb, #38bdf8, #6366f1)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          {title}
        </h1>

        {description ? (
          <p
            className="mt-1 max-w-2xl text-sm leading-5"
            style={{ color: "var(--text-muted)" }}
          >
            {description}
          </p>
        ) : null}
      </div>

      {actions ? <div className="relative z-10 shrink-0">{actions}</div> : null}

      {/* 🔥 ANIMACIÓN GLOBAL */}
      <style jsx>{`
        @keyframes orbyxShimmer {
          0% {
            background-position: 200% 0;
          }
          100% {
            background-position: -200% 0;
          }
        }
      `}</style>
    </div>
  );
}