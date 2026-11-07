"use client";

import { useEffect, useRef, useState } from "react";
import { apiFetch } from "@/lib/api";
import { BACKEND_URL } from "@/lib/backend-url";
import { isValidPhoneForCountry, toE164 } from "@/components/auth/countries";

// Autocompletar clienta en el modal "Nueva reserva" de la Agenda.
//  - CustomerNameLookup: el campo Nombre actúa como buscador (2+ letras, o
//    dígitos del teléfono) y muestra hasta 8 clientas del negocio con el
//    teléfono parcialmente oculto y su última visita.
//  - DuplicateCustomerNotice: si el teléfono (o correo) escrito ya
//    pertenece a una clienta, avisa y ofrece usarla en vez de duplicarla.
// Backend: GET /customers/search/:slug y GET /customers/contact/:slug/:id.

export type PickedCustomer = {
  id: string;
  name: string;
  // Teléfono en formato nacional (sin +56), como lo espera PhoneCountryInput.
  phoneNational: string;
  email: string;
};

type SearchResult = {
  id: string;
  name: string;
  phone_masked: string | null;
  has_email: boolean;
  last_visit_at: string | null;
  last_visit_service: string | null;
};

function toNationalPhone(phone: string) {
  const digits = String(phone || "").replace(/\D/g, "");
  return digits.startsWith("56") && digits.length > 9 ? digits.slice(2) : digits;
}

async function fetchCustomerContact(slug: string, id: string): Promise<PickedCustomer | null> {
  const res = await apiFetch(
    `${BACKEND_URL}/customers/contact/${encodeURIComponent(slug)}/${encodeURIComponent(id)}`,
    { cache: "no-store" }
  );
  if (!res.ok) return null;
  const data = await res.json().catch(() => null);
  const c = data?.customer;
  if (!c?.id) return null;
  return {
    id: c.id,
    name: c.name || "",
    phoneNational: toNationalPhone(c.phone || ""),
    email: c.email || "",
  };
}

function formatLastVisit(result: SearchResult) {
  if (!result.last_visit_at) return "Sin visitas";
  const date = new Date(result.last_visit_at).toLocaleDateString("es-CL", {
    timeZone: "America/Santiago",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  return result.last_visit_service ? `Última visita: ${date} · ${result.last_visit_service}` : `Última visita: ${date}`;
}

const fieldStyle = {
  borderColor: "var(--border-color)",
  background: "var(--bg-soft)",
  color: "var(--text-main)",
} as const;

export function CustomerNameLookup({
  slug,
  value,
  onChange,
  onPick,
}: {
  slug: string;
  value: string;
  onChange: (value: string) => void;
  onPick: (customer: PickedCustomer) => void;
}) {
  const [results, setResults] = useState<SearchResult[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [picking, setPicking] = useState(false);
  const [pickError, setPickError] = useState("");
  const [activeIndex, setActiveIndex] = useState(-1);
  // Solo se busca mientras la persona escribe: al elegir una clienta (que
  // cambia `value` desde afuera) no se vuelve a abrir la lista.
  const searchEnabledRef = useRef(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const term = value.trim();
    if (!searchEnabledRef.current || !slug || term.length < 2) {
      setResults([]);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    const timer = window.setTimeout(async () => {
      try {
        const res = await apiFetch(
          `${BACKEND_URL}/customers/search/${encodeURIComponent(slug)}?q=${encodeURIComponent(term)}`,
          { cache: "no-store" }
        );
        const data = await res.json().catch(() => null);
        if (cancelled) return;
        setResults(res.ok && Array.isArray(data?.results) ? data.results : []);
        setActiveIndex(-1);
        setOpen(true);
      } catch {
        // Sin búsqueda el formulario sigue funcionando como siempre.
        if (!cancelled) setResults([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 300);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [value, slug]);

  useEffect(() => {
    if (!open) return;
    function handleOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, [open]);

  async function pick(result: SearchResult) {
    if (picking) return;
    setPicking(true);
    setPickError("");
    try {
      const contact = await fetchCustomerContact(slug, result.id);
      if (!contact) {
        setPickError("No se pudo cargar a la clienta. Intenta de nuevo.");
        return;
      }
      searchEnabledRef.current = false;
      setOpen(false);
      setResults([]);
      onPick(contact);
    } catch {
      setPickError("No se pudo cargar a la clienta. Intenta de nuevo.");
    } finally {
      setPicking(false);
    }
  }

  const showList = open && value.trim().length >= 2;

  return (
    <div ref={containerRef} className="relative">
      <input
        placeholder="Busca por nombre o teléfono, o escribe una nueva"
        autoComplete="off"
        role="combobox"
        aria-expanded={showList}
        aria-controls="customer-lookup-listbox"
        aria-autocomplete="list"
        value={value}
        onChange={(event) => {
          searchEnabledRef.current = true;
          setPickError("");
          onChange(event.target.value);
        }}
        onFocus={() => {
          if (results.length > 0) setOpen(true);
        }}
        onKeyDown={(event) => {
          if (!showList || results.length === 0) return;
          if (event.key === "ArrowDown") {
            event.preventDefault();
            setActiveIndex((prev) => (prev + 1) % results.length);
          } else if (event.key === "ArrowUp") {
            event.preventDefault();
            setActiveIndex((prev) => (prev <= 0 ? results.length - 1 : prev - 1));
          } else if (event.key === "Enter" && activeIndex >= 0) {
            event.preventDefault();
            void pick(results[activeIndex]);
          } else if (event.key === "Escape") {
            setOpen(false);
          }
        }}
        className="h-10 w-full rounded-xl border px-3 text-sm outline-none transition"
        style={fieldStyle}
      />

      {showList ? (
        <div
          id="customer-lookup-listbox"
          role="listbox"
          className="absolute left-0 right-0 z-30 mt-1 max-h-72 overflow-y-auto rounded-xl border shadow-xl"
          style={{ borderColor: "var(--border-color)", background: "var(--bg-card)" }}
        >
          {loading && results.length === 0 ? (
            <p className="px-3 py-2 text-xs" style={{ color: "var(--text-muted)" }}>
              Buscando...
            </p>
          ) : results.length === 0 ? (
            <p className="px-3 py-2 text-xs" style={{ color: "var(--text-muted)" }}>
              Sin coincidencias: se creará como clienta nueva.
            </p>
          ) : (
            results.map((result, index) => (
              <button
                key={result.id}
                type="button"
                role="option"
                aria-selected={index === activeIndex}
                // mousedown (no click) para ganarle al blur del input.
                onMouseDown={(event) => {
                  event.preventDefault();
                  void pick(result);
                }}
                onMouseEnter={() => setActiveIndex(index)}
                disabled={picking}
                className="block w-full border-b px-3 py-2 text-left last:border-b-0 disabled:opacity-60"
                style={{
                  borderColor: "var(--border-color)",
                  background: index === activeIndex ? "var(--bg-soft)" : "transparent",
                  color: "var(--text-main)",
                }}
              >
                <span className="flex items-baseline justify-between gap-2">
                  <span className="truncate text-sm font-semibold">{result.name || "Sin nombre"}</span>
                  {result.phone_masked ? (
                    <span className="shrink-0 text-xs" style={{ color: "var(--text-muted)" }}>
                      {result.phone_masked}
                    </span>
                  ) : null}
                </span>
                <span className="mt-0.5 block truncate text-xs" style={{ color: "var(--text-muted)" }}>
                  {formatLastVisit(result)}
                </span>
              </button>
            ))
          )}
        </div>
      ) : null}

      {pickError ? (
        <p role="alert" className="mt-1 text-xs font-medium text-rose-500">
          {pickError}
        </p>
      ) : null}
    </div>
  );
}

export function DuplicateCustomerNotice({
  slug,
  phone,
  email,
  pickedCustomerId,
  onUse,
}: {
  slug: string;
  // Teléfono tal cual está en el formulario (formato nacional).
  phone: string;
  email: string;
  pickedCustomerId: string | null;
  onUse: (customer: PickedCustomer) => void;
}) {
  const [match, setMatch] = useState<SearchResult | null>(null);
  const [using, setUsing] = useState(false);

  const phoneValid = Boolean(phone.trim()) && isValidPhoneForCountry("CL", phone);
  const trimmedEmail = email.trim();
  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(trimmedEmail);
  const lookupKey = `${phoneValid ? toE164("CL", phone) : ""}|${emailValid ? trimmedEmail.toLowerCase() : ""}`;

  useEffect(() => {
    if (!slug || lookupKey === "|") {
      setMatch(null);
      return;
    }
    const [phoneKey, emailKey] = lookupKey.split("|");
    let cancelled = false;
    const timer = window.setTimeout(async () => {
      try {
        const q = new URLSearchParams();
        if (phoneKey) q.set("phone", phoneKey);
        if (emailKey) q.set("email", emailKey);
        const res = await apiFetch(
          `${BACKEND_URL}/customers/search/${encodeURIComponent(slug)}?${q.toString()}`,
          { cache: "no-store" }
        );
        const data = await res.json().catch(() => null);
        if (cancelled) return;
        setMatch(res.ok && Array.isArray(data?.results) && data.results[0] ? data.results[0] : null);
      } catch {
        if (!cancelled) setMatch(null);
      }
    }, 400);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [slug, lookupKey]);

  if (!match || match.id === pickedCustomerId) return null;

  return (
    <div
      role="status"
      className="rounded-xl border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-900"
    >
      <p>
        Esta clienta ya está registrada: <strong>{match.name || "Sin nombre"}</strong>
        {match.phone_masked ? ` (${match.phone_masked})` : ""}. ¿Usar esta?
      </p>
      <button
        type="button"
        disabled={using}
        onClick={async () => {
          setUsing(true);
          try {
            const contact = await fetchCustomerContact(slug, match.id);
            if (contact) {
              onUse(contact);
              setMatch(null);
            }
          } finally {
            setUsing(false);
          }
        }}
        className="mt-2 inline-flex h-8 items-center justify-center rounded-lg border border-amber-400 bg-white px-3 text-xs font-semibold text-amber-900 transition hover:bg-amber-100 disabled:opacity-60"
      >
        {using ? "Cargando..." : "Usar esta clienta"}
      </button>
    </div>
  );
}
