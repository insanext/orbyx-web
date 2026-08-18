"use client";

// Modal de consentimiento genérico para cualquier toggle de cobro
// automático de add-ons (renovación mensual, recarga por saldo bajo).
// Parametrizado por título/descripción/texto — quien lo usa arma el texto
// exacto (con montos y cantidades ya interpolados) y lo manda tal cual al
// backend como text_shown, para que el registro en
// addon_auto_charge_consents sea idéntico a lo que el tenant realmente vio.
export function AutoChargeConsentModal({
  open,
  title,
  description,
  consentText,
  checked,
  onCheckedChange,
  onCancel,
  onConfirm,
  confirming,
  confirmLabel = "Activar",
}: {
  open: boolean;
  title: string;
  description: string;
  consentText: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  onCancel: () => void;
  onConfirm: () => void;
  confirming: boolean;
  confirmLabel?: string;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0"
        style={{ background: "rgba(0,0,0,0.6)" }}
        onClick={() => (confirming ? null : onCancel())}
      />
      <div
        className="relative z-10 mx-4 w-full max-w-md rounded-2xl border p-6 shadow-2xl"
        style={{ background: "var(--bg-card)", borderColor: "var(--border-color)" }}
      >
        <h3 className="text-lg font-semibold" style={{ color: "var(--text-main)" }}>
          {title}
        </h3>
        <p className="mt-2 text-sm leading-6" style={{ color: "var(--text-muted)" }}>
          {description}
        </p>

        <label
          className="mt-4 flex cursor-pointer items-start gap-3 rounded-xl border px-3 py-3"
          style={{ borderColor: "var(--border-color)", background: "var(--bg-soft)" }}
        >
          <input
            type="checkbox"
            checked={checked}
            onChange={(e) => onCheckedChange(e.target.checked)}
            className="mt-0.5 h-4 w-4 shrink-0"
          />
          <span className="text-xs leading-5" style={{ color: "var(--text-main)" }}>
            {consentText}
          </span>
        </label>

        <div className="mt-5 flex gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={confirming}
            className="flex-1 inline-flex h-10 items-center justify-center rounded-xl border text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-60"
            style={{
              borderColor: "var(--border-color)",
              background: "var(--bg-soft)",
              color: "var(--text-main)",
            }}
          >
            Cancelar
          </button>
          <button
            type="button"
            disabled={!checked || confirming}
            onClick={onConfirm}
            className="flex-1 inline-flex h-10 items-center justify-center rounded-xl text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-60"
            style={{ background: "linear-gradient(135deg, rgb(37 99 235), rgb(14 165 233))" }}
          >
            {confirming ? "Activando..." : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
