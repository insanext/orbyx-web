"use client";

export function TermsAcceptanceCheckbox({
  checked,
  onChange,
  disabled,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <label
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: 10,
        fontSize: 12.5,
        lineHeight: 1.5,
        color: "#94a3b8",
        cursor: disabled ? "not-allowed" : "pointer",
      }}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        disabled={disabled}
        required
        style={{ marginTop: 2, width: 16, height: 16, flexShrink: 0, accentColor: "#2563eb" }}
      />
      <span>
        Acepto los{" "}
        <a
          href="/terminos"
          target="_blank"
          rel="noopener"
          style={{ color: "#60a5fa", textDecoration: "underline" }}
        >
          Términos de Servicio
        </a>
        , que incluyen el Acuerdo de Tratamiento de Datos, y declaro haber leído la{" "}
        <a
          href="/privacidad"
          target="_blank"
          rel="noopener"
          style={{ color: "#60a5fa", textDecoration: "underline" }}
        >
          Política de Privacidad
        </a>
        .
      </span>
    </label>
  );
}
