"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { UsersRound } from "lucide-react";
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

function getSegment(segment?: string) {
  if (segment === "frequent") return "text-emerald-600";
  if (segment === "recurrent") return "text-sky-600";
  if (segment === "inactive") return "text-rose-600";
  return "text-amber-600";
}

function Stat({ title, value }: any) {
  return (
    <div className="rounded-xl border border-slate-200 px-4 py-3 dark:border-slate-700">
      <p className="text-xs text-slate-500">{title}</p>
      <p className="text-lg font-semibold">{value}</p>
    </div>
  );
}

export default function CustomersPage() {
  const params = useParams();
  const router = useRouter();
  const slug = (params as any)?.slug;

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [businessCategory, setBusinessCategory] = useState("");
  const isVeterinaria = businessCategory === "veterinaria";
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
      const business = await fetch(`${BACKEND_URL}/public/business/${slug}`);
      const b = await business.json();

      setBusinessCategory(b?.business?.business_category || "");

      const params = new URLSearchParams();
      if (search) params.set("q", search);
      if (segment !== "all") params.set("segment", segment);
      params.set("inactive_days", inactiveDays);
      if (selectedBranchId) params.set("branch_id", selectedBranchId);

      const res = await fetch(
        `${BACKEND_URL}/customers/${slug}?${params.toString()}`
      );
      const data: CustomersResponse = await res.json();

      setCustomers(data.customers || []);
      setSummary(data.summary || summary);
    }

    if (slug) load();
  }, [slug, search, segment, inactiveDays, selectedBranchId]);

  const activeSegmentLabel = useMemo(() => {
    return (
      SEGMENT_OPTIONS.find((i) => i.key === segment)?.label || "Todos"
    );
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
        <Stat title="Total" value={summary.total} />
        <Stat title="Nuevos" value={summary.nuevos} />
        <Stat title="Recurrentes" value={summary.recurrentes} />
        <Stat title="Frecuentes" value={summary.frecuentes} />
        <Stat title="Inactivos" value={summary.inactivos} />
      </div>

      {/* FILTROS */}
      <section>
        <h2 className="text-base font-semibold mb-3">
          Filtros de clientes
        </h2>

        <div className="grid gap-3 xl:grid-cols-[1.2fr_1fr_220px]">

          <input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Buscar cliente..."
            className="rounded-xl border px-4 py-2"
          />

          <div className="flex flex-wrap gap-2">
            {SEGMENT_OPTIONS.map((o) => {
              const active = segment === o.key;
              return (
                <button
                  key={o.key}
                  onClick={() => setSegment(o.key)}
                  className="px-3 py-2 rounded-xl text-sm border"
                  style={{
                    background: active ? "#0f172a" : "transparent",
                    color: active ? "#fff" : "inherit",
                  }}
                >
                  {o.label}
                </button>
              );
            })}
          </div>

          <select
            value={inactiveDays}
            onChange={(e) => setInactiveDays(e.target.value)}
            className="rounded-xl border px-3 py-2"
          >
            <option value="30">30 días</option>
            <option value="60">60 días</option>
            <option value="90">90 días</option>
            <option value="120">120 días</option>
          </select>

        </div>

        <p className="text-sm text-slate-500 mt-2">
          Viendo: <b>{activeSegmentLabel}</b>
          {search && <> · {search}</>}
        </p>
      </section>

      {/* LISTADO */}
      <section>
        <h2 className="text-base font-semibold mb-3">
          {isVeterinaria ? "Listado de tutores" : "Listado de clientes"}
        </h2>

        <div className="space-y-3 md:hidden">
          {customers.map((c) => (
            <article
              key={c.id}
              className="rounded-xl border border-slate-200 p-4 shadow-sm dark:border-slate-700"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="break-words text-sm font-semibold">
                    {c.name}
                  </h3>

                  {isVeterinaria &&
                    Array.isArray(c.pets) &&
                    c.pets.length > 0 && (
                      <p className="mt-1 break-words text-xs text-emerald-600">
                        {c.pets.map((p) => p.name).join(", ")}
                      </p>
                    )}
                </div>

                <span className={`shrink-0 text-xs font-medium ${getSegment(c.segment)}`}>
                  {c.segment || "new"}
                </span>
              </div>

              <div className="mt-4 space-y-3 text-sm">
                <div>
                  <p className="text-xs text-slate-500">Contacto</p>
                  <p className="mt-1 break-words text-slate-700 dark:text-slate-200">
                    {c.email || c.phone || "Sin contacto"}
                  </p>
                  {c.email && c.phone ? (
                    <p className="mt-1 break-words text-slate-500">{c.phone}</p>
                  ) : null}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-xl bg-slate-50 px-3 py-2 dark:bg-slate-800">
                    <p className="text-xs text-slate-500">Visitas</p>
                    <p className="mt-1 font-semibold">{c.total_visits}</p>
                  </div>

                  <div className="rounded-xl bg-slate-50 px-3 py-2 dark:bg-slate-800">
                    <p className="text-xs text-slate-500">Última visita</p>
                    <p className="mt-1 text-xs font-medium text-slate-700 dark:text-slate-200">
                      {formatDate(c.last_visit_at)}
                    </p>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => router.push(`/dashboard/${slug}/customers/${c.id}`)}
                className="mt-4 w-full rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium transition hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800"
              >
                Ver detalle
              </button>
            </article>
          ))}
        </div>

        <div className="hidden border rounded-xl overflow-hidden md:block">

          <table className="w-full text-sm">

            <thead className="bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200">
              <tr>
    <th className="px-4 py-2 text-left text-xs font-semibold">Cliente</th>
    <th className="px-4 py-2 text-left text-xs font-semibold">Contacto</th>
    <th className="px-4 py-2 text-left text-xs font-semibold">Visitas</th>
    <th className="px-4 py-2 text-left text-xs font-semibold">Segmento</th>
    <th className="px-4 py-2 text-left text-xs font-semibold">Última</th>
              </tr>
            </thead>

            <tbody>
              {customers.map((c) => (
                <tr
                  key={c.id}
                  onClick={() =>
                    router.push(`/dashboard/${slug}/customers/${c.id}`)
                  }
                  className="border-t cursor-pointer hover:bg-slate-50"
                >
                  <td className="px-4 py-3">
                    {c.name}

                    {isVeterinaria &&
                      Array.isArray(c.pets) &&
                      c.pets.length > 0 && (
                        <div className="text-xs text-emerald-600">
                          {c.pets.map((p) => p.name).join(", ")}
                        </div>
                      )}
                  </td>

                  <td className="px-4 py-3 text-slate-500">
                    {c.email}<br />{c.phone}
                  </td>

                  <td className="px-4 py-3 font-semibold">
                    {c.total_visits}
                  </td>

                  <td className="px-4 py-3">
                    <span className={getSegment(c.segment)}>
                      {c.segment}
                    </span>
                  </td>

                  <td className="px-4 py-3 text-slate-500">
                    {formatDate(c.last_visit_at)}
                  </td>
                </tr>
              ))}
            </tbody>

          </table>

        </div>
      </section>

    </div>
  );
}
