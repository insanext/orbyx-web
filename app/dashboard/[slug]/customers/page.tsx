"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";
import { Search, SlidersHorizontal, Star, UsersRound, X } from "lucide-react";
import { PageHeader } from "../../../../components/dashboard/page-header";
import { usePermissions } from "../../../../lib/permissions-context";

const BACKEND_URL = "https://orbyx-backend.onrender.com";

type CustomerSegment = "new" | "recurrent" | "frequent" | "inactive";

type Pet = {
  id: string;
  name: string;
  species_base: string;
  species_custom?: string | null;
};

type Customer = {
  id: string;
  tenant_id: string;
  name: string;
  email: string | null;
  phone: string | null;
  last_visit_at: string | null;
  total_visits: number;
  created_at: string;
  updated_at: string;
  segment?: CustomerSegment;
  pets?: Pet[];
  has_completed_visit?: boolean;
};

type CustomersResponse = {
  total: number;
  customers: Customer[];
  summary?: {
    total: number;
    nuevos: number;
    recurrentes: number;
    frecuentes: number;
    inactivos: number;
  };
};

const SEGMENT_OPTIONS = [
  { key: "all", label: "Todos" },
  { key: "new", label: "Nuevos" },
  { key: "recurrent", label: "Recurrentes" },
  { key: "frequent", label: "Frecuentes" },
  { key: "inactive", label: "Inactivos" },
];

function formatDate(value?: string | null) {
  if (!value) return "Sin visitas";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "Sin visitas";

  return new Intl.DateTimeFormat("es-CL", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(d);
}

// ---- Sistema visual "Base de clientes" — reutiliza el mismo criterio de
// Indicadores/Agenda: variables CSS scoped a la página, con un juego de
// valores para modo claro y otro para modo oscuro, reaccionando al mismo
// atributo data-theme="clasico"|"nocturno" que ya usa el toggle sol/luna del
// dashboard (lib/use-theme.ts) — mismo mecanismo, no uno nuevo. ----
type SegmentTone = "blue" | "amber" | "rose" | "emerald";

const SEGMENT_TONE: Record<SegmentTone, { solid: string; tint: string; text: string }> = {
  blue: { solid: "var(--cust-blue-solid)", tint: "var(--cust-blue-tint)", text: "var(--cust-blue-text)" },
  amber: { solid: "var(--cust-amber-solid)", tint: "var(--cust-amber-tint)", text: "var(--cust-amber-text)" },
  rose: { solid: "var(--cust-rose-solid)", tint: "var(--cust-rose-tint)", text: "var(--cust-rose-text)" },
  emerald: { solid: "var(--cust-emerald-solid)", tint: "var(--cust-emerald-tint)", text: "var(--cust-emerald-text)" },
};

// Paleta decorativa para los avatares (color distinto por cliente) — más
// variedad que los 4 tonos semánticos de los badges de segmento.
const AVATAR_PALETTE = ["blue", "cyan", "amber", "rose", "violet", "emerald"] as const;

function hashString(value: string) {
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    hash = (hash * 31 + value.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

function getInitials(name?: string | null) {
  const parts = String(name || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (parts.length === 0) return "—";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

function Avatar({ id, name }: { id: string; name: string }) {
  const color = AVATAR_PALETTE[hashString(id) % AVATAR_PALETTE.length];
  return (
    <span
      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold"
      style={{ background: `var(--cust-avatar-${color}-bg)`, color: `var(--cust-avatar-${color}-text)` }}
    >
      {getInitials(name)}
    </span>
  );
}

// Mismo criterio que customers/[id]/page.tsx: solo dígitos, sin "+", que es
// lo que espera un link wa.me.
function normalizeWhatsappNumber(value?: string | null) {
  if (!value) return "";
  return value.replace(/\D/g, "");
}

function buildReviewRequestUrl(customerPhone: string | null, businessName: string, slug: string) {
  const whatsappNumber = normalizeWhatsappNumber(customerPhone);
  if (!whatsappNumber) return "";

  const reviewUrl = `https://orbyx.cl/${slug}/opinar`;
  const message = `¡Hola! Gracias por visitarnos${
    businessName ? ` en ${businessName}` : ""
  }. ¿Nos ayudarías dejando una reseña? Aquí puedes hacerlo: ${reviewUrl}`;

  return `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;
}

function SegmentBadge({ segment }: { segment?: string }) {
  const map: Record<string, { label: string; tone: SegmentTone }> = {
    frequent: { label: "Frecuente", tone: "emerald" },
    recurrent: { label: "Recurrente", tone: "blue" },
    inactive: { label: "Inactivo", tone: "rose" },
    new: { label: "Nuevo", tone: "amber" },
  };
  const { label, tone } = map[segment ?? "new"] ?? map.new;
  const t = SEGMENT_TONE[tone];
  return (
    <span
      className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold"
      style={{ background: t.tint, color: t.text }}
    >
      {label}
    </span>
  );
}

export default function CustomersPage() {
  const { canEdit } = usePermissions();
  const canEditClientes = canEdit("clientes");
  const params = useParams();
  const router = useRouter();
  const slug = (params as { slug?: string })?.slug;

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [businessCategory, setBusinessCategory] = useState("");
  const [businessName, setBusinessName] = useState("");
  const isVeterinaria = businessCategory === "veterinaria" || businessCategory === "vet";
  const isClinica = businessCategory === "clinica";
  const [selectedBranchId, setSelectedBranchId] = useState("");

  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [segment, setSegment] = useState("all");
  const [inactiveDays, setInactiveDays] = useState("60");
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  const [summary, setSummary] = useState({
    total: 0,
    nuevos: 0,
    recurrentes: 0,
    frecuentes: 0,
    inactivos: 0,
  });

  const branchStorageKey = useMemo(() => {
    return slug ? `orbyx_active_branch_${slug}` : "";
  }, [slug]);

  function readStoredBranchId() {
    if (typeof window === "undefined" || !branchStorageKey) return "";
    return localStorage.getItem(branchStorageKey) || "";
  }

  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput.trim()), 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  useEffect(() => {
    setSelectedBranchId(readStoredBranchId());
  }, [branchStorageKey]);

  useEffect(() => {
    function handleBranchChanged(event: Event) {
      const customEvent = event as CustomEvent<{ branchId?: string }>;
      setSelectedBranchId(customEvent.detail?.branchId || readStoredBranchId());
    }

    window.addEventListener("orbyx-branch-changed", handleBranchChanged);

    return () => {
      window.removeEventListener("orbyx-branch-changed", handleBranchChanged);
    };
  }, [branchStorageKey]);

  useEffect(() => {
    async function load() {
      const business = await apiFetch(`${BACKEND_URL}/public/business/${slug}`);
      const b = await business.json();

      setBusinessCategory(b?.business?.business_category || "");
      setBusinessName(b?.business?.name || "");

      const params = new URLSearchParams();
      if (search) params.set("q", search);
      if (segment !== "all") params.set("segment", segment);
      params.set("inactive_days", inactiveDays);
      if (selectedBranchId) params.set("branch_id", selectedBranchId);

      const res = await apiFetch(
        `${BACKEND_URL}/customers/${slug}?${params.toString()}`
      );
      const data: CustomersResponse = await res.json();

      setCustomers(data.customers || []);
      setSummary(data.summary || summary);
    }

    if (slug) load();
  }, [slug, search, segment, inactiveDays, selectedBranchId]);

  const activeSegmentLabel = useMemo(() => {
    return SEGMENT_OPTIONS.find((i) => i.key === segment)?.label || "Todos";
  }, [segment]);

  const mobileActiveFilterCount = [
    searchInput.trim().length > 0,
    segment !== "all",
    inactiveDays !== "60",
  ].filter(Boolean).length;

  return (
    <div className="orbyx-customers-page space-y-6">
      <PageHeader
        eyebrow={isVeterinaria ? "Tutores y mascotas" : "Clientes"}
        title="Base de clientes"
        icon={<UsersRound className="h-4 w-4" />}
        description={
          selectedBranchId
            ? "Clientes con actividad en la sucursal seleccionada."
            : "Gestiona clientes, filtra y analiza su comportamiento."
        }
      />

      {/* FILTROS — mobile: colapsados detrás de un botón "Filtros" (mismo
          patrón que Agenda), igual que la sección completa de abajo pero
          en una hoja inferior en vez de siempre expandida. */}
      <div className="flex flex-wrap items-center gap-2 md:hidden">
        <button
          type="button"
          onClick={() => setMobileFiltersOpen(true)}
          className="relative flex h-10 items-center gap-1.5 rounded-full border px-3 text-sm font-semibold"
          style={{ borderColor: "var(--cust-border)", background: "var(--cust-card-bg)", color: "var(--cust-ink)" }}
        >
          <SlidersHorizontal className="h-4 w-4" />
          Filtros
          {mobileActiveFilterCount > 0 ? (
            <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-blue-600 px-1 text-[11px] font-bold text-white">
              {mobileActiveFilterCount}
            </span>
          ) : null}
        </button>
        {(isVeterinaria || isClinica) && canEditClientes ? (
          <button
            type="button"
            onClick={() => router.push(`/dashboard/${slug}/customers/new`)}
            className="ml-auto flex h-10 items-center gap-1.5 rounded-full px-4 text-sm font-semibold text-white transition hover:opacity-90"
            style={{ background: "var(--cust-blue-solid)" }}
          >
            <span className="text-base leading-none">＋</span>
            Crear ficha
          </button>
        ) : null}
      </div>

      {mobileFiltersOpen ? (
        <div className="fixed inset-0 z-[95] flex items-end justify-center md:hidden">
          <button
            type="button"
            aria-label="Cerrar filtros"
            className="absolute inset-0 bg-slate-950/55 backdrop-blur-sm"
            onClick={() => setMobileFiltersOpen(false)}
          />
          <div
            className="relative max-h-[85vh] w-full overflow-y-auto rounded-t-3xl border border-b-0 p-4 pb-6"
            style={{ background: "var(--cust-card-bg)", borderColor: "var(--cust-border)" }}
          >
            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm font-semibold" style={{ color: "var(--cust-ink)" }}>
                Filtros
              </p>
              <button
                type="button"
                aria-label="Cerrar"
                onClick={() => setMobileFiltersOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-full"
                style={{ color: "var(--cust-muted)" }}
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="relative mb-3">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2"
                style={{ color: "var(--cust-muted)" }}
              />
              <input
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Buscar cliente..."
                className="w-full rounded-xl border pl-9 pr-4 py-2.5 text-sm outline-none transition"
                style={{
                  borderColor: "var(--cust-border)",
                  background: "var(--cust-soft-bg)",
                  color: "var(--cust-ink)",
                }}
              />
            </div>

            <div className="mb-3 flex flex-wrap gap-1.5">
              {SEGMENT_OPTIONS.map((o) => {
                const active = segment === o.key;
                return (
                  <button
                    key={o.key}
                    onClick={() => setSegment(o.key)}
                    className="rounded-lg border px-2.5 py-1 text-xs font-medium transition"
                    style={
                      active
                        ? { background: "var(--cust-blue-solid)", borderColor: "var(--cust-blue-solid)", color: "#ffffff" }
                        : { background: "var(--cust-card-bg)", borderColor: "var(--cust-pill-border)", color: "var(--cust-ink)" }
                    }
                  >
                    {o.label}
                  </button>
                );
              })}
            </div>

            <select
              value={inactiveDays}
              onChange={(e) => setInactiveDays(e.target.value)}
              className="mb-3 w-full rounded-xl border px-3 py-2.5 text-sm outline-none transition"
              style={{ borderColor: "var(--cust-border)", background: "var(--cust-soft-bg)", color: "var(--cust-ink)" }}
            >
              <option value="30">Inactivos: 30 días</option>
              <option value="60">Inactivos: 60 días</option>
              <option value="90">Inactivos: 90 días</option>
              <option value="120">Inactivos: 120 días</option>
            </select>

            <p className="mb-4 text-xs" style={{ color: "var(--cust-muted)" }}>
              Viendo: <b style={{ color: "var(--cust-ink)" }}>{activeSegmentLabel}</b>
              {search && (
                <>
                  {" "}
                  · <span className="italic">{search}</span>
                </>
              )}
            </p>

            <button
              type="button"
              onClick={() => setMobileFiltersOpen(false)}
              className="flex h-11 w-full items-center justify-center rounded-2xl text-sm font-semibold text-white"
              style={{ background: "var(--cust-blue-solid)" }}
            >
              Ver resultados
            </button>
          </div>
        </div>
      ) : null}

      <section
        className="hidden rounded-2xl border p-4 space-y-4 md:block"
        style={{ borderColor: "var(--cust-border)", background: "var(--cust-card-bg)" }}
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-sm font-semibold" style={{ color: "var(--cust-ink)" }}>
            Filtros
          </h2>
          {(isVeterinaria || isClinica) && canEditClientes ? (
            <button
              type="button"
              onClick={() => router.push(`/dashboard/${slug}/customers/new`)}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-semibold text-white transition hover:opacity-90"
              style={{ background: "var(--cust-blue-solid)" }}
            >
              <span className="text-base leading-none">＋</span>
              Crear ficha paciente
            </button>
          ) : null}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative min-w-[200px] flex-1 basis-56">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2"
              style={{ color: "var(--cust-muted)" }}
            />
            <input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Buscar cliente..."
              className="w-full rounded-xl border pl-9 pr-4 py-2.5 text-sm outline-none transition focus:ring-2"
              style={{
                borderColor: "var(--cust-border)",
                background: "var(--cust-soft-bg)",
                color: "var(--cust-ink)",
              }}
            />
          </div>

          <div className="flex flex-wrap gap-1.5">
            {SEGMENT_OPTIONS.map((o) => {
              const active = segment === o.key;
              return (
                <button
                  key={o.key}
                  onClick={() => setSegment(o.key)}
                  className="rounded-lg border px-2.5 py-1 text-xs font-medium transition"
                  style={
                    active
                      ? { background: "var(--cust-blue-solid)", borderColor: "var(--cust-blue-solid)", color: "#ffffff" }
                      : { background: "var(--cust-card-bg)", borderColor: "var(--cust-pill-border)", color: "var(--cust-ink)" }
                  }
                >
                  {o.label}
                </button>
              );
            })}
          </div>

          <select
            value={inactiveDays}
            onChange={(e) => setInactiveDays(e.target.value)}
            className="shrink-0 rounded-xl border px-3 py-2.5 text-sm outline-none transition focus:ring-2"
            style={{ borderColor: "var(--cust-border)", background: "var(--cust-soft-bg)", color: "var(--cust-ink)" }}
          >
            <option value="30">Inactivos: 30 días</option>
            <option value="60">Inactivos: 60 días</option>
            <option value="90">Inactivos: 90 días</option>
            <option value="120">Inactivos: 120 días</option>
          </select>
        </div>

        <p className="text-xs" style={{ color: "var(--cust-muted)" }}>
          Viendo: <b style={{ color: "var(--cust-ink)" }}>{activeSegmentLabel}</b>
          {search && (
            <>
              {" "}
              · <span className="italic">{search}</span>
            </>
          )}
        </p>
      </section>

      {/* LISTADO */}
      <section>
        <h2 className="mb-3 text-sm font-semibold" style={{ color: "var(--cust-ink)" }}>
          {isVeterinaria ? "Listado de tutores" : "Listado de clientes"}
          {customers.length > 0 && (
            <span className="ml-2 text-xs font-normal" style={{ color: "var(--cust-muted)" }}>
              {customers.length} resultado{customers.length !== 1 ? "s" : ""}
            </span>
          )}
        </h2>

        {/* Estado vacío */}
        {customers.length === 0 && (
          <div
            className="flex flex-col items-center justify-center rounded-2xl border py-16 text-center"
            style={{ borderColor: "var(--cust-border)", background: "var(--cust-card-bg)" }}
          >
            <div className="mb-4 rounded-full p-4" style={{ background: "var(--cust-soft-bg)" }}>
              <UsersRound className="h-7 w-7" style={{ color: "var(--cust-muted)" }} />
            </div>
            <p className="text-sm font-semibold" style={{ color: "var(--cust-ink)" }}>
              {search ? "Sin resultados" : "Sin clientes aún"}
            </p>
            <p className="mt-1 max-w-xs text-xs" style={{ color: "var(--cust-muted)" }}>
              {search
                ? `No se encontraron clientes para "${search}".`
                : "Cuando se registren reservas, los clientes aparecerán aquí."}
            </p>
          </div>
        )}

        {/* Cards móvil */}
        {customers.length > 0 && (
          <div className="space-y-3 md:hidden">
            {customers.map((c) => (
              <article
                key={c.id}
                className="rounded-2xl border p-4 shadow-sm"
                style={{ borderColor: "var(--cust-border)", background: "var(--cust-card-bg)" }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <Avatar id={c.id} name={c.name} />
                    <div className="min-w-0">
                      <h3 className="break-words text-sm font-semibold" style={{ color: "var(--cust-ink)" }}>
                        {c.name}
                      </h3>
                      {isVeterinaria && Array.isArray(c.pets) && c.pets.length > 0 && (
                        <p className="mt-0.5 break-words text-xs" style={{ color: SEGMENT_TONE.emerald.text }}>
                          {c.pets.map((p) => p.name).join(", ")}
                        </p>
                      )}
                    </div>
                  </div>
                  <SegmentBadge segment={c.segment} />
                </div>

                <div className="mt-3">
                  <p className="text-xs" style={{ color: "var(--cust-muted)" }}>
                    Contacto
                  </p>
                  <p className="mt-0.5 break-words text-xs" style={{ color: "var(--cust-ink)" }}>
                    {c.email || c.phone || "Sin contacto"}
                  </p>
                  {c.email && c.phone && (
                    <p className="break-words text-xs" style={{ color: "var(--cust-muted)" }}>
                      {c.phone}
                    </p>
                  )}
                </div>

                {/* Visitas/Última visita se sacaron de la tarjeta — quedan
                    solo en el detalle del cliente, la tarjeta muestra lo
                    esencial (nombre + contacto). */}
                <div className="mt-4 flex gap-2">
                  <button
                    type="button"
                    onClick={() => router.push(`/dashboard/${slug}/customers/${c.id}`)}
                    className="flex-1 rounded-xl border px-4 py-2 text-sm font-medium transition"
                    style={{
                      background: "var(--cust-soft-bg)",
                      borderColor: "var(--cust-border)",
                      color: "var(--cust-ink)",
                    }}
                  >
                    Ver detalle →
                  </button>
                  {c.has_completed_visit && c.phone ? (
                    <a
                      href={buildReviewRequestUrl(c.phone, businessName, String(slug || ""))}
                      target="_blank"
                      rel="noreferrer"
                      title="Pedir reseña por WhatsApp"
                      aria-label="Pedir reseña por WhatsApp"
                      className="flex items-center justify-center rounded-xl border px-3 text-sm font-medium transition"
                      style={{
                        borderColor: "var(--cust-emerald-solid)",
                        color: "var(--cust-emerald-solid)",
                      }}
                    >
                      <Star className="h-4 w-4" />
                    </a>
                  ) : null}
                </div>
              </article>
            ))}
          </div>
        )}

        {/* Tabla desktop */}
        {customers.length > 0 && (
          <div className="hidden overflow-hidden rounded-2xl border md:block" style={{ borderColor: "var(--cust-border)" }}>
            <table className="w-full text-sm">
              <thead style={{ background: "var(--cust-table-head-bg)" }}>
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide" style={{ color: "var(--cust-table-head-text)" }}>
                    Cliente
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide" style={{ color: "var(--cust-table-head-text)" }}>
                    Contacto
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide" style={{ color: "var(--cust-table-head-text)" }}>
                    Visitas
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide" style={{ color: "var(--cust-table-head-text)" }}>
                    Segmento
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide" style={{ color: "var(--cust-table-head-text)" }}>
                    Última visita
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide" style={{ color: "var(--cust-table-head-text)" }}>
                    Acción
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y" style={{ borderColor: "var(--cust-border)", background: "var(--cust-card-bg)" }}>
                {customers.map((c) => (
                  <tr
                    key={c.id}
                    onClick={() => router.push(`/dashboard/${slug}/customers/${c.id}`)}
                    className="orbyx-customers-row cursor-pointer transition"
                  >
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-3">
                        <Avatar id={c.id} name={c.name} />
                        <div className="min-w-0">
                          <p className="font-semibold" style={{ color: "var(--cust-ink)" }}>
                            {c.name}
                          </p>
                          {isVeterinaria && Array.isArray(c.pets) && c.pets.length > 0 && (
                            <p className="text-xs font-normal" style={{ color: SEGMENT_TONE.emerald.text }}>
                              {c.pets.map((p) => p.name).join(", ")}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-3.5">
                      <span className="block text-xs" style={{ color: "var(--cust-ink)" }}>
                        {c.email || "—"}
                      </span>
                      <span className="block text-xs" style={{ color: "var(--cust-muted)" }}>
                        {c.phone || "—"}
                      </span>
                    </td>

                    <td className="px-4 py-3.5 font-bold" style={{ color: "var(--cust-blue-solid)" }}>
                      {c.total_visits}
                    </td>

                    <td className="px-4 py-3.5">
                      <SegmentBadge segment={c.segment} />
                    </td>

                    <td className="px-4 py-3.5 text-xs" style={{ color: "var(--cust-ink)" }}>
                      {formatDate(c.last_visit_at)}
                    </td>

                    <td className="px-4 py-3.5">
                      {c.has_completed_visit && c.phone ? (
                        <a
                          href={buildReviewRequestUrl(c.phone, businessName, String(slug || ""))}
                          target="_blank"
                          rel="noreferrer"
                          title="Pedir reseña por WhatsApp"
                          aria-label="Pedir reseña por WhatsApp"
                          onClick={(e) => e.stopPropagation()}
                          className="inline-flex h-9 w-9 items-center justify-center rounded-full border transition hover:opacity-80"
                          style={{
                            borderColor: "var(--cust-emerald-solid)",
                            color: "var(--cust-emerald-solid)",
                          }}
                        >
                          <Star className="h-4 w-4" />
                        </a>
                      ) : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <style jsx>{`
        .orbyx-customers-row {
          background: var(--cust-card-bg);
        }
        .orbyx-customers-row:hover {
          background: var(--cust-row-hover);
        }

        .orbyx-customers-page {
          --cust-ink: #0f172a;
          --cust-muted: #64748b;
          --cust-border: #e2e8f0;
          --cust-pill-border: #bfdbfe;
          --cust-card-bg: #ffffff;
          --cust-soft-bg: #f1f5f9;
          --cust-row-hover: #f8fafc;
          --cust-table-head-bg: #0f172a;
          --cust-table-head-text: #ffffff;

          --cust-blue-solid: #2563eb;
          --cust-blue-tint: #eff6ff;
          --cust-blue-text: #1d4ed8;
          --cust-amber-solid: #d97706;
          --cust-amber-tint: #fffbeb;
          --cust-amber-text: #b45309;
          --cust-rose-solid: #e11d48;
          --cust-rose-tint: #fff1f2;
          --cust-rose-text: #be123c;
          --cust-emerald-solid: #059669;
          --cust-emerald-tint: #ecfdf5;
          --cust-emerald-text: #047857;

          --cust-avatar-blue-bg: #dbeafe;
          --cust-avatar-blue-text: #1d4ed8;
          --cust-avatar-cyan-bg: #cffafe;
          --cust-avatar-cyan-text: #0e7490;
          --cust-avatar-amber-bg: #fef3c7;
          --cust-avatar-amber-text: #b45309;
          --cust-avatar-rose-bg: #ffe4e6;
          --cust-avatar-rose-text: #be123c;
          --cust-avatar-violet-bg: #ede9fe;
          --cust-avatar-violet-text: #6d28d9;
          --cust-avatar-emerald-bg: #d1fae5;
          --cust-avatar-emerald-text: #047857;
        }

        :global(:root[data-theme="nocturno"]) .orbyx-customers-page {
          --cust-ink: #e6ebf5;
          --cust-muted: #94a3bb;
          --cust-border: #203a61;
          --cust-pill-border: #2c5282;
          --cust-card-bg: #101b31;
          --cust-soft-bg: #0b1526;
          --cust-row-hover: #16223d;
          --cust-table-head-bg: #060b16;
          --cust-table-head-text: #f1f5f9;

          --cust-blue-solid: #3b82f6;
          --cust-blue-tint: #132a44;
          --cust-blue-text: #93c5fd;
          --cust-amber-solid: #f59e0b;
          --cust-amber-tint: #3a2a18;
          --cust-amber-text: #fcd34d;
          --cust-rose-solid: #fb7185;
          --cust-rose-tint: #3a151a;
          --cust-rose-text: #fda4af;
          --cust-emerald-solid: #22c55e;
          --cust-emerald-tint: #123329;
          --cust-emerald-text: #6ee7b7;

          --cust-avatar-blue-bg: #1e3a5f;
          --cust-avatar-blue-text: #93c5fd;
          --cust-avatar-cyan-bg: #123a42;
          --cust-avatar-cyan-text: #67e8f9;
          --cust-avatar-amber-bg: #3a2a18;
          --cust-avatar-amber-text: #fcd34d;
          --cust-avatar-rose-bg: #3a151a;
          --cust-avatar-rose-text: #fda4af;
          --cust-avatar-violet-bg: #241f3d;
          --cust-avatar-violet-text: #c4b5fd;
          --cust-avatar-emerald-bg: #123329;
          --cust-avatar-emerald-text: #6ee7b7;
        }
      `}</style>
    </div>
  );
}
