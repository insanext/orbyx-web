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
}: {
  iso2: string;
  onIso2Change: (iso2: string) => void;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  required?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);

  const country = getCountry(iso2);

  useEffect(() => {
    if (open) {
      setSearch("");
      setTimeout(() => searchInputRef.current?.focus(), 0);
    }
  }, [open]);

  const filtered = COUNTRIES.filter((c) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return c.name.toLowerCase().includes(q) || c.dialCode.includes(q);
  });

  return (
    <div style={{ position: "relative" }}>
      <div style={{ display: "flex", gap: 8 }}>
        <button
          type="button"
          disabled={disabled}
          onClick={() => setOpen((v) => !v)}
          style={{
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
          }}
        >
          <span style={{ fontSize: 18, lineHeight: 1 }}>{flagEmoji(country.iso2)}</span>
          <span>+{country.dialCode}</span>
          <span style={{ fontSize: 10, opacity: 0.6 }}>▾</span>
        </button>

        <input
          type="tel"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          required={required}
          placeholder={country.iso2 === "CL" ? "9 1234 5678" : "Número de teléfono"}
          autoComplete="tel-national"
          style={{
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
          }}
        />
      </div>

      {open ? (
        <>
          <div
            onClick={() => setOpen(false)}
            style={{ position: "fixed", inset: 0, zIndex: 40 }}
          />
          <div
            style={{
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
            }}
          >
            <div style={{ padding: 10, borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
              <input
                ref={searchInputRef}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar país"
                style={{
                  width: "100%",
                  padding: "8px 10px",
                  background: "#1e293b",
                  border: "1px solid rgba(255,255,255,0.15)",
                  borderRadius: 8,
                  color: "#f1f5f9",
                  fontSize: 13,
                  outline: "none",
                  boxSizing: "border-box",
                }}
              />
            </div>
            <div style={{ overflowY: "auto" }}>
              {filtered.length === 0 ? (
                <p style={{ padding: 14, fontSize: 13, color: "#64748b" }}>Sin resultados.</p>
              ) : (
                filtered.map((c) => (
                  <button
                    key={c.iso2}
                    type="button"
                    onClick={() => {
                      onIso2Change(c.iso2);
                      setOpen(false);
                    }}
                    style={{
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
                    }}
                  >
                    <span style={{ fontSize: 16 }}>{flagEmoji(c.iso2)}</span>
                    <span style={{ flex: 1 }}>{c.name}</span>
                    <span style={{ color: "#64748b" }}>+{c.dialCode}</span>
                    {c.iso2 === country.iso2 ? (
                      <span style={{ color: "#8b5cf6" }}>✓</span>
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
