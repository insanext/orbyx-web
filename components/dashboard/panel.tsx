import clsx from "clsx";

type PanelProps = {
  title?: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
};

export function Panel({
  title,
  description,
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
        <div className="mb-5">
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
      ) : null}

      {children}
    </section>
  );
}