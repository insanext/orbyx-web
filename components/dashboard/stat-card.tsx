type StatCardProps = {
  label: string;
  value: string;
  helper?: string;
};

export function StatCard({ label, value, helper }: StatCardProps) {
  return (
    <div
      className="rounded-3xl p-5 shadow-sm"
      style={{
        background: "var(--bg-card)",
        border: "1px solid var(--border-color)",
      }}
    >
      <p
        className="text-sm font-medium"
        style={{ color: "var(--text-muted)" }}
      >
        {label}
      </p>

      <p
        className="mt-3 text-3xl font-semibold tracking-tight"
        style={{ color: "var(--text-main)" }}
      >
        {value}
      </p>

      {helper ? (
        <p
          className="mt-2 text-sm leading-6"
          style={{ color: "var(--text-muted)" }}
        >
          {helper}
        </p>
      ) : null}
    </div>
  );
}