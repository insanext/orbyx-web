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
      className="mb-6 flex flex-col gap-4 rounded-3xl p-6 sm:flex-row sm:items-center sm:justify-between"
      style={{
        background: "var(--bg-card)",
        border: "1px solid var(--border-color)",
      }}
    >
      <div>
        {eyebrow ? (
          <p
            className="mb-2 text-xs font-semibold uppercase tracking-[0.18em]"
            style={{ color: "var(--text-muted)" }}
          >
            {eyebrow}
          </p>
        ) : null}

        <h1
          className="text-2xl font-semibold tracking-tight"
          style={{ color: "var(--text-main)" }}
        >
          {title}
        </h1>

        {description ? (
          <p
            className="mt-2 max-w-2xl text-sm leading-6"
            style={{ color: "var(--text-muted)" }}
          >
            {description}
          </p>
        ) : null}
      </div>

      {actions ? <div className="shrink-0">{actions}</div> : null}
    </div>
  );
}