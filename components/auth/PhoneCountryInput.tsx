"use client";

import { useEffect, useRef, useState } from "react";
import { COUNTRIES, flagEmoji, getCountry } from "./countries";

export function PhoneCountryInput({
  iso2,
  onIso2Change,
  value,
  onChange,
  disabled,
  required,
  variant = "dark",
  allowedCountries,
}: {
  iso2: string;
  onIso2Change: (iso2: string) => void;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  required?: boolean;
  // "dark": estilo original (signup, checkout-premium). "light": estilo
  // claro para calzar con el formulario público de reserva ([slug]/page.tsx),
  // que usa fondo blanco/indigo en vez del tema oscuro del onboarding.
  variant?: "dark" | "light";
  // Lista opcional de códigos ISO2 a mostrar/seleccionar (ej. ["CL"]). Si se
  // omite, se comporta igual que antes (todos los países) — signup y
  // checkout-premium no la pasan y siguen sin restricción.
  allowedCountries?: string[];
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);
  const isLight = variant === "light";

  const country = getCountry(iso2);

  const availableCountries =
    allowedCountries && allowedCountries.length > 0
      ? COUNTRIES.filter((c) => allowedCountries.includes(c.iso2))
      : COUNTRIES;

  // Cuando solo hay un país disponible (ej. reserva pública restringida a
  // Chile) no tiene sentido abrir un buscador de países sin nada que elegir.
  const isFixedCountry = availableCountries.length === 1;

  useEffect(() => {
    if (open) {
      setSearch("");
      setTimeout(() => searchInputRef.current?.focus(), 0);
    }
  }, [open]);

  const filtered = availableCountries.filter((c) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return c.name.toLowerCase().includes(q) || c.dialCode.includes(q);
  });

  return (
    <div style={{ position: "relative" }}>
      <div className={isLight ? "flex gap-2" : undefined} style={isLight ? undefined : { display: "flex", gap: 8 }}>
        {isFixedCountry ? (
          <div
            className={
              isLight
                ? "flex h-11 flex-shrink-0 items-center gap-1.5 rounded-none border border-indigo-100 bg-white px-3 text-sm text-slate-700 md:h-12 md:px-3.5"
                : undefined
            }
            style={
              isLight
                ? undefined
                : {
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "12px 10px",
                    background: "#1e293b",
                    border: "1px solid rgba(255,255,255,0.15)",
                    borderRadius: 10,
                    color: "#f1f5f9",
                    fontSize: 14,
                    flexShrink: 0,
                  }
            }
          >
            <span style={{ fontSize: 18, lineHeight: 1 }}>{flagEmoji(country.iso2)}</span>
            <span>+{country.dialCode}</span>
          </div>
        ) : (
          <button
            type="button"
            disabled={disabled}
            onClick={() => setOpen((v) => !v)}
            className={
              isLight
                ? "flex h-11 flex-shrink-0 items-center gap-1.5 rounded-none border border-indigo-100 bg-white px-3 text-sm text-slate-700 outline-none transition focus:border-indigo-400 md:h-12 md:px-3.5"
                : undefined
            }
            style={
              isLight
                ? { cursor: disabled ? "not-allowed" : "pointer" }
                : {
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "12px 10px",
                    background: "#1e293b",
                    border: "1px solid rgba(255,255,255,0.15)",
                    borderRadius: 10,
                    color: "#f1f5f9",
                    fontSize: 14,
                    cursor: disabled ? "not-allowed" : "pointer",
                    flexShrink: 0,
                  }
            }
          >
            <span style={{ fontSize: 18, lineHeight: 1 }}>{flagEmoji(country.iso2)}</span>
            <span>+{country.dialCode}</span>
            <span style={{ fontSize: 10, opacity: 0.6 }}>▾</span>
          </button>
        )}

        <input
          type="tel"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          required={required}
          placeholder={country.iso2 === "CL" ? "9 1234 5678" : "Número de teléfono"}
          autoComplete="tel-national"
          className={
            isLight
              ? "h-11 min-w-0 flex-1 rounded-none border border-indigo-100 bg-white px-3.5 text-sm text-slate-900 outline-none transition focus:border-indigo-400 md:h-12 md:px-4"
              : undefined
          }
          style={
            isLight
              ? undefined
              : {
                  flex: 1,
                  minWidth: 0,
                  padding: "12px 14px",
                  background: "#1e293b",
                  border: "1px solid rgba(255,255,255,0.15)",
                  borderRadius: 10,
                  color: "#f1f5f9",
                  fontSize: 14,
                  outline: "none",
                  boxSizing: "border-box",
                }
          }
        />
      </div>

      {open ? (
        <>
          <div
            onClick={() => setOpen(false)}
            style={{ position: "fixed", inset: 0, zIndex: 40 }}
          />
          <div
            className={
              isLight
                ? "absolute left-0 top-[calc(100%+6px)] z-50 flex max-h-80 w-[300px] max-w-[90vw] flex-col overflow-hidden rounded-none border border-slate-200 bg-white shadow-[0_28px_90px_-38px_rgba(15,23,42,0.55)]"
                : undefined
            }
            style={
              isLight
                ? undefined
                : {
                    position: "absolute",
                    top: "calc(100% + 6px)",
                    left: 0,
                    width: 300,
                    maxWidth: "90vw",
                    maxHeight: 320,
                    background: "#0f172a",
                    border: "1px solid rgba(255,255,255,0.15)",
                    borderRadius: 12,
                    boxShadow: "0 20px 40px rgba(0,0,0,0.45)",
                    zIndex: 50,
                    display: "flex",
                    flexDirection: "column",
                    overflow: "hidden",
                  }
            }
          >
            <div
              className={isLight ? "border-b border-slate-100 p-2.5" : undefined}
              style={isLight ? undefined : { padding: 10, borderBottom: "1px solid rgba(255,255,255,0.08)" }}
            >
              <input
                ref={searchInputRef}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar país"
                className={
                  isLight
                    ? "w-full rounded-none border border-indigo-100 bg-white px-2.5 py-2 text-[13px] text-slate-900 outline-none transition focus:border-indigo-400"
                    : undefined
                }
                style={
                  isLight
                    ? undefined
                    : {
                        width: "100%",
                        padding: "8px 10px",
                        background: "#1e293b",
                        border: "1px solid rgba(255,255,255,0.15)",
                        borderRadius: 8,
                        color: "#f1f5f9",
                        fontSize: 13,
                        outline: "none",
                        boxSizing: "border-box",
                      }
                }
              />
            </div>
            <div style={{ overflowY: "auto" }}>
              {filtered.length === 0 ? (
                <p
                  className={isLight ? "p-3.5 text-[13px] text-slate-400" : undefined}
                  style={isLight ? undefined : { padding: 14, fontSize: 13, color: "#64748b" }}
                >
                  Sin resultados.
                </p>
              ) : (
                filtered.map((c) => (
                  <button
                    key={c.iso2}
                    type="button"
                    onClick={() => {
                      onIso2Change(c.iso2);
                      setOpen(false);
                    }}
                    className={
                      isLight
                        ? `flex w-full items-center gap-2.5 px-3.5 py-2 text-left text-[13.5px] text-slate-700 ${
                            c.iso2 === country.iso2 ? "bg-indigo-50" : "bg-transparent"
                          }`
                        : undefined
                    }
                    style={
                      isLight
                        ? undefined
                        : {
                            display: "flex",
                            alignItems: "center",
                            gap: 10,
                            width: "100%",
                            padding: "9px 14px",
                            background: c.iso2 === country.iso2 ? "rgba(139,92,246,0.15)" : "transparent",
                            border: "none",
                            color: "#e2e8f0",
                            fontSize: 13.5,
                            textAlign: "left",
                            cursor: "pointer",
                          }
                    }
                  >
                    <span style={{ fontSize: 16 }}>{flagEmoji(c.iso2)}</span>
                    <span style={{ flex: 1 }}>{c.name}</span>
                    <span className={isLight ? "text-slate-400" : undefined} style={isLight ? undefined : { color: "#64748b" }}>
                      +{c.dialCode}
                    </span>
                    {c.iso2 === country.iso2 ? (
                      <span className={isLight ? "text-indigo-500" : undefined} style={isLight ? undefined : { color: "#8b5cf6" }}>
                        ✓
                      </span>
                    ) : null}
                  </button>
                ))
              )}
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
