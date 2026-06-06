"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";
import { Search, UsersRound } from "lucide-react";
import { PageHeader } from "../../../../components/dashboard/page-header";

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

function Stat({ title, value, accent }: { title: string; value: number; accent?: string }) {
  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-[var(--bg-card)] px-4 py-3.5">
      <p className="text-xs text-slate-500 dark:text-slate-400">{title}</p>
      <p className="mt-1 text-2xl font-bold text-[var(--text-main)]">{value}</p>
      {accent && <div className={`mt-2 h-0.5 w-8 rounded-full ${accent} opacity-60`} />}
    </div>
  );
}

function SegmentBadge({ segment }: { segment?: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    frequent: { label: "Frecuente", cls: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400" },
    recurrent: { label: "Recurrente", cls: "bg-sky-50 text-sky-700 dark:bg-sky-950/60 dark:text-sky-400" },
    inactive: { label: "Inactivo", cls: "bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400" },
    new: { label: "Nuevo", cls: "bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400" },
  };
  const { label, cls } = map[segment ?? "new"] ?? map.new;
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${cls}`}>
      {label}
    </span>
  );
}

export default function CustomersPage() {
  const params = useParams();
  const router = useRouter();
  const slug = (params as any)?.slug;

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [businessCategory, setBusinessCategory] = useState("");
  const isVeterinaria = businessCategory === "veterinaria" || businessCategory === "vet";
  const isClinica = businessCategory === "clinica";
  const [selectedBranchId, setSelectedBranchId] = useState("");

  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [segment, setSegment] = useState<any>("all");
  const [inactiveDays, setInactiveDays] = useState("60");

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

  return (
    <div className="space-y-8">

      <PageHeader
        eyebrow={isVeterinaria ? "Tutores y mascotas" : "Clientes"}
        title="Base de clientes"
        icon={<UsersRound className="h-5 w-5" />}
        description={
          selectedBranchId
            ? "Clientes con actividad en la sucursal seleccionada."
            : "Gestiona clientes, filtra y analiza su comportamiento."
        }
      />

      {/* STATS */}
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-5">
        <Stat title="Total"       value={summary.total}       accent="bg-slate-400"   />
        <Stat title="Nuevos"      value={summary.nuevos}      accent="bg-amber-400"   />
        <Stat title="Recurrentes" value={summary.recurrentes} accent="bg-sky-400"     />
        <Stat title="Frecuentes"  value={summary.frecuentes}  accent="bg-emerald-400" />
        <Stat title="Inactivos"   value={summary.inactivos}   accent="bg-rose-400"    />
      </div>

      {/* FILTROS */}
      <section className="rounded-xl border border-slate-200 dark:border-slate-700 bg-[var(--bg-card)] p-4 space-y-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-sm font-semibold text-[var(--text-main)]">Filtros</h2>
          {(isVeterinaria || isClinica) ? (
            <button
              type="button"
              onClick={() => router.push(`/dashboard/${slug}/customers/new`)}
              className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-emerald-700 shrink-0"
            >
              <span className="text-base leading-none">＋</span>
              Crear ficha paciente
            </button>
          ) : null}
        </div>

        <div className="grid gap-3 xl:grid-cols-[1.2fr_1fr_220px]">

          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Buscar cliente..."
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-[var(--bg-soft)] text-[var(--text-main)] placeholder:text-slate-400 pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300 dark:focus:ring-slate-600 transition"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            {SEGMENT_OPTIONS.map((o) => {
              const active = segment === o.key;
              return (
                <button
                  key={o.key}
                  onClick={() => setSegment(o.key)}
                  className={`px-3 py-1.5 rounded-lg text-sm border font-medium transition ${
                    active
                      ? "bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 border-slate-900 dark:border-slate-100"
                      : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                  }`}
                >
                  {o.label}
                </button>
              );
            })}
          </div>

          <select
            value={inactiveDays}
            onChange={(e) => setInactiveDays(e.target.value)}
            className="rounded-xl border border-slate-200 dark:border-slate-700 bg-[var(--bg-soft)] text-[var(--text-main)] px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300 dark:focus:ring-slate-600 transition"
          >
            <option value="30">Inactivos: 30 días</option>
            <option value="60">Inactivos: 60 días</option>
            <option value="90">Inactivos: 90 días</option>
            <option value="120">Inactivos: 120 días</option>
          </select>

        </div>

        <p className="text-xs text-slate-500">
          Viendo: <b className="text-[var(--text-main)] font-semibold">{activeSegmentLabel}</b>
          {search && <> · <span className="italic">{search}</span></>}
        </p>
      </section>

      {/* LISTADO */}
      <section>
        <h2 className="text-sm font-semibold text-[var(--text-main)] mb-3">
          {isVeterinaria ? "Listado de tutores" : "Listado de clientes"}
          {customers.length > 0 && (
            <span className="ml-2 text-xs font-normal text-slate-500">
              {customers.length} resultado{customers.length !== 1 ? "s" : ""}
            </span>
          )}
        </h2>

        {/* Estado vacío */}
        {customers.length === 0 && (
          <div className="flex flex-col items-center justify-center rounded-xl border border-slate-200 dark:border-slate-700 bg-[var(--bg-card)] py-16 text-center">
            <div className="rounded-full bg-slate-100 dark:bg-slate-800 p-4 mb-4">
              <UsersRound className="h-7 w-7 text-slate-400" />
            </div>
            <p className="text-sm font-semibold text-[var(--text-main)]">
              {search ? "Sin resultados" : "Sin clientes aún"}
            </p>
            <p className="mt-1 text-xs text-slate-500 max-w-xs">
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
                className="rounded-xl border border-slate-200 dark:border-slate-700 bg-[var(--bg-card)] p-4 shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="break-words text-sm font-semibold text-[var(--text-main)]">
                      {c.name}
                    </h3>
                    {isVeterinaria && Array.isArray(c.pets) && c.pets.length > 0 && (
                      <p className="mt-0.5 break-words text-xs text-emerald-600 dark:text-emerald-400">
                        {c.pets.map((p) => p.name).join(", ")}
                      </p>
                    )}
                  </div>
                  <SegmentBadge segment={c.segment} />
                </div>

                <div className="mt-3 space-y-3">
                  <div>
                    <p className="text-xs text-slate-500">Contacto</p>
                    <p className="mt-0.5 break-words text-xs text-slate-700 dark:text-slate-200">
                      {c.email || c.phone || "Sin contacto"}
                    </p>
                    {c.email && c.phone && (
                      <p className="break-words text-xs text-slate-500">{c.phone}</p>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-lg bg-slate-50 dark:bg-slate-800/60 px-3 py-2">
                      <p className="text-xs text-slate-500">Visitas</p>
                      <p className="mt-0.5 text-sm font-semibold text-[var(--text-main)]">{c.total_visits}</p>
                    </div>
                    <div className="rounded-lg bg-slate-50 dark:bg-slate-800/60 px-3 py-2">
                      <p className="text-xs text-slate-500">Última visita</p>
                      <p className="mt-0.5 text-xs font-medium text-slate-700 dark:text-slate-300">
                        {formatDate(c.last_visit_at)}
                      </p>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => router.push(`/dashboard/${slug}/customers/${c.id}`)}
                  className="mt-4 w-full rounded-xl border border-slate-200 dark:border-slate-700 px-4 py-2 text-sm font-medium transition hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  Ver detalle →
                </button>
              </article>
            ))}
          </div>
        )}

        {/* Tabla desktop */}
        {customers.length > 0 && (
          <div className="hidden rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden md:block">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Cliente</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Contacto</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Visitas</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Segmento</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Última visita</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 bg-[var(--bg-card)]">
                {customers.map((c) => (
                  <tr
                    key={c.id}
                    onClick={() => router.push(`/dashboard/${slug}/customers/${c.id}`)}
                    className="cursor-pointer transition hover:bg-slate-50 dark:hover:bg-slate-800/50"
                  >
                    <td className="px-4 py-3.5 font-medium text-[var(--text-main)]">
                      {c.name}
                      {isVeterinaria && Array.isArray(c.pets) && c.pets.length > 0 && (
                        <div className="text-xs font-normal text-emerald-600 dark:text-emerald-400">
                          {c.pets.map((p) => p.name).join(", ")}
                        </div>
                      )}
                    </td>

                    <td className="px-4 py-3.5">
                      <span className="block text-xs text-slate-600 dark:text-slate-300">{c.email || "—"}</span>
                      <span className="block text-xs text-slate-400">{c.phone || "—"}</span>
                    </td>

                    <td className="px-4 py-3.5 font-semibold text-[var(--text-main)]">
                      {c.total_visits}
                    </td>

                    <td className="px-4 py-3.5">
                      <SegmentBadge segment={c.segment} />
                    </td>

                    <td className="px-4 py-3.5 text-xs text-slate-500">
                      {formatDate(c.last_visit_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

    </div>
  );
}
