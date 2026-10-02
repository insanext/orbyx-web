"use client";

import { useId } from "react";
import { CHILE_REGION_NAMES, getCommunesForRegion } from "../../lib/chile-regions";

// Selectores en cascada Región → Comuna (lista oficial de Chile, ver
// lib/chile-regions.ts). Elegir otra región vacía la comuna. Un valor
// guardado antes de existir los selectores (texto libre) que no esté en la
// lista de la región se muestra como "sin elegir" — el padre decide si lo
// exige (isValidRegionCommune) antes de guardar.
export function RegionCommuneSelect({
  region,
  commune,
  onChange,
  disabled = false,
  required = false,
  selectClassName,
  selectStyle,
  optionStyle,
  labelClassName = "mb-2 block text-sm font-medium",
  labelStyle,
  className = "grid gap-4 sm:grid-cols-2",
}: {
  region: string;
  commune: string;
  onChange: (next: { region: string; commune: string }) => void;
  disabled?: boolean;
  required?: boolean;
  selectClassName: string;
  selectStyle?: React.CSSProperties;
  // Para fondos oscuros (onboarding): el desplegable nativo no hereda el
  // fondo del <select>, hay que pintarlo en cada <option>.
  optionStyle?: React.CSSProperties;
  labelClassName?: string;
  labelStyle?: React.CSSProperties;
  className?: string;
}) {
  const uid = useId();
  const communes = getCommunesForRegion(region);
  const regionValue = CHILE_REGION_NAMES.includes(region) ? region : "";
  const communeValue = communes.includes(commune) ? commune : "";

  return (
    <div className={className}>
      <div>
        <label htmlFor={`${uid}-region`} className={labelClassName} style={labelStyle}>
          Región{required ? " *" : ""}
        </label>
        <select
          id={`${uid}-region`}
          value={regionValue}
          disabled={disabled}
          required={required}
          onChange={(e) => onChange({ region: e.target.value, commune: "" })}
          className={selectClassName}
          style={selectStyle}
        >
          <option value="" style={optionStyle}>
            Selecciona una región
          </option>
          {CHILE_REGION_NAMES.map((name) => (
            <option key={name} value={name} style={optionStyle}>
              {name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor={`${uid}-commune`} className={labelClassName} style={labelStyle}>
          Comuna{required ? " *" : ""}
        </label>
        <select
          id={`${uid}-commune`}
          value={communeValue}
          disabled={disabled || !regionValue}
          required={required}
          onChange={(e) => onChange({ region: regionValue, commune: e.target.value })}
          className={selectClassName}
          style={selectStyle}
        >
          <option value="" style={optionStyle}>
            {regionValue ? "Selecciona una comuna" : "Primero elige la región"}
          </option>
          {communes.map((name) => (
            <option key={name} value={name} style={optionStyle}>
              {name}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
