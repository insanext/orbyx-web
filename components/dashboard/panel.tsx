import clsx from "clsx";

type PanelProps = {
  title?: string;
  description?: string;
  headerAction?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
};

export function Panel({
  title,
  description,
  headerAction,
  children,
  className,
}: PanelProps) {
  return (
    <section
      className={clsx("rounded-3xl p-5 shadow-sm sm:p-6", className)}
      style={{
        background: "var(--bg-card)",
        border: "1px solid var(--border-color)",
      }}
    >
      {title || description ? (
        <div
          className="mb-5 flex flex-wrap items-start justify-between gap-3 border-b pb-4"
          style={{
            borderColor: "var(--border-color)",
          }}
        >
          <div>
            {title ? (
              <h3
                className="text-base font-semibold tracking-tight"
                style={{ color: "var(--text-main)" }}
              >
                {title}
              </h3>
            ) : null}

            {description ? (
              <p
                className="mt-1 text-sm leading-6"
                style={{ color: "var(--text-muted)" }}
              >
                {description}
              </p>
            ) : null}
          </div>

          {headerAction ? (
            <div className="flex shrink-0 flex-wrap gap-2">{headerAction}</div>
          ) : null}
        </div>
      ) : null}

      {children}
    </section>
  );
}