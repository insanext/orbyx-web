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
      className={clsx(
        "rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6",
        className
      )}
    >
      {title || description ? (
        <div className="mb-5">
          {title ? (
            <h3 className="text-base font-semibold tracking-tight text-slate-900">
              {title}
            </h3>
          ) : null}
          {description ? (
            <p className="mt-1 text-sm leading-6 text-slate-500">{description}</p>
          ) : null}
        </div>
      ) : null}

      {children}
    </section>
  );
}