"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { PageHeader } from "../../../../components/dashboard/page-header";
import { Panel } from "../../../../components/dashboard/panel";

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
  is_inactive?: boolean;
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
  filters?: {
    q?: string;
    segment?: string | null;
    inactive_days?: number;
  };
  error?: string;
};

const SEGMENT_OPTIONS: Array<{
  key: "all" | CustomerSegment;
  label: string;
}> = [
  { key: "all", label: "Todos" },
  { key: "new", label: "Nuevos" },
  { key: "recurrent", label: "Recurrentes" },
  { key: "frequent", label: "Frecuentes" },
  { key: "inactive", label: "Inactivos" },
];

function formatDate(value?: string | null) {
  if (!value) return "Sin visitas";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Sin visitas";
  }

  return new Intl.DateTimeFormat("es-CL", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function getCustomerSegmentStyles(segment?: string) {
  if (segment === "frequent") {
    return {
      label: "Frecuente",
      className:
        "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
    };
  }

  if (segment === "recurrent") {
    return {
      label: "Recurrente",
      className:
        "bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300",
    };
  }

  if (segment === "inactive") {
    return {
      label: "Inactivo",
      className:
        "bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300",
    };
  }

  return {
    label: "Nuevo",
    className:
      "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
  };
}

function CustomerStatCard({
  title,
  value,
  description,
}: {
  title: string;
  value: string;
  description: string;
}) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900/70">
      <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
        {title}
      </p>
      <p className="mt-2 text-3xl font-semibold text-slate-900 dark:text-white">
        {value}
      </p>
      <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-400">
        {description}
      </p>
    </div>
  );
}

export default function CustomersPage() {
  const params = useParams();
  const router = useRouter();
  const slug =
    ((params as any)?.slug as string) || ((params as any)?.Slug as string);

  const [customers, setCustomers] = useState<Customer[]>([]);
const [businessCategory, setBusinessCategory] = useState("");
const isVeterinaria = businessCategory === "veterinaria";
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [segment, setSegment] = useState<"all" | CustomerSegment>("all");
  const [inactiveDays, setInactiveDays] = useState("60");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [summary, setSummary] = useState({
    total: 0,
    nuevos: 0,
    recurrentes: 0,
    frecuentes: 0,
    inactivos: 0,
  });

  useEffect(() => {
    const timeout = setTimeout(() => {
      setSearch(searchInput.trim());
    }, 300);

    return () => clearTimeout(timeout);
  }, [searchInput]);

  useEffect(() => {
    async function loadCustomers() {
      try {
        setLoading(true);
        setError("");
const businessRes = await fetch(`${BACKEND_URL}/public/business/${slug}`);
const businessData = await businessRes.json();

setBusinessCategory(
  String(businessData?.business?.business_category || "")
);

        const params = new URLSearchParams();

        if (search) {
          params.set("q", search);
        }

        if (segment !== "all") {
          params.set("segment", segment);
        }

        params.set("inactive_days", inactiveDays);

        const queryString = params.toString();
        const url = queryString
          ? `${BACKEND_URL}/customers/${slug}?${queryString}`
          : `${BACKEND_URL}/customers/${slug}`;

        const res = await fetch(url);
        const data: CustomersResponse = await res.json();

        if (!res.ok) {
          throw new Error(data?.error || "No se pudieron cargar los clientes");
        }

const baseCustomers = Array.isArray(data.customers) ? data.customers : [];

setCustomers(baseCustomers);
        setSummary({
          total: Number(data.summary?.total || 0),
          nuevos: Number(data.summary?.nuevos || 0),
          recurrentes: Number(data.summary?.recurrentes || 0),
          frecuentes: Number(data.summary?.frecuentes || 0),
          inactivos: Number(data.summary?.inactivos || 0),
        });
      } catch (err: any) {
        setError(err?.message || "Error cargando clientes");
        setCustomers([]);
        setSummary({
          total: 0,
          nuevos: 0,
          recurrentes: 0,
          frecuentes: 0,
          inactivos: 0,
        });
      } finally {
        setLoading(false);
      }
    }

    if (slug) {
      loadCustomers();
    }
  }, [slug, search, segment, inactiveDays]);

  const activeSegmentLabel = useMemo(() => {
    return (
      SEGMENT_OPTIONS.find((item) => item.key === segment)?.label || "Todos"
    );
  }, [segment]);

  return (
    <div className="space-y-6">
      <PageHeader
  eyebrow={isVeterinaria ? "Tutores y mascotas" : "Clientes"}
  title="Base de clientes"
  description={
    isVeterinaria
      ? "Visualiza tutores, mascotas, visitas y deja preparada la base para seguimiento veterinario y campañas."
      : "Gestiona segmentos, detecta inactivos y prepara la base para campañas por email y WhatsApp."
  }
/>

      {error ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-300">
          {error}
        </div>
      ) : null}

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-5">
        <CustomerStatCard
          title="Total"
          value={loading ? "..." : String(summary.total)}
          description="Clientes visibles en tu base."
        />
        <CustomerStatCard
          title="Nuevos"
          value={loading ? "..." : String(summary.nuevos)}
          description="1 visita o primera captación."
        />
        <CustomerStatCard
          title="Recurrentes"
          value={loading ? "..." : String(summary.recurrentes)}
          description="Ya han vuelto más de una vez."
        />
        <CustomerStatCard
          title="Frecuentes"
          value={loading ? "..." : String(summary.frecuentes)}
          description="Clientes con alta recurrencia."
        />
        <CustomerStatCard
          title="Inactivos"
          value={loading ? "..." : String(summary.inactivos)}
          description={`Sin actividad en ${inactiveDays} días.`}
        />
      </section>

    <Panel
  title="Base de clientes"
  description="Gestión de clientes, filtros y listado en un solo lugar."
>
  <div className="space-y-8">

    {/* 🔹 FILTROS */}
    <div>

      <p className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-4">
        Filtros de clientes
      </p>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.2fr_1fr_220px]">

        {/* Buscar */}
        <div>
          <label className="mb-2 block text-xs font-medium uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
            Buscar cliente
          </label>
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Buscar por nombre, email o teléfono"
            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-slate-500 dark:border-slate-600 dark:bg-slate-900 dark:text-white"
          />
        </div>

        {/* Segmento */}
        <div>
          <label className="mb-2 block text-xs font-medium uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
            Segmento
          </label>

          <div className="flex flex-wrap gap-2">
            {SEGMENT_OPTIONS.map((option) => {
              const active = segment === option.key;

              return (
                <button
                  key={option.key}
                  type="button"
                  onClick={() => setSegment(option.key)}
                  className="rounded-xl px-4 py-2 text-sm font-medium transition"
                  style={{
                    background: active ? "#0f172a" : "transparent",
                    color: active ? "#fff" : "var(--text-main)",
                    border: "1px solid var(--border-color)",
                  }}
                >
                  {option.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Inactivos */}
        <div>
          <label className="mb-2 block text-xs font-medium uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
            Inactivos en
          </label>

          <select
            value={inactiveDays}
            onChange={(e) => setInactiveDays(e.target.value)}
            className="h-11 w-full rounded-xl border border-slate-300 bg-white px-4 text-sm text-slate-900 outline-none focus:border-slate-500 dark:border-slate-600 dark:bg-slate-900 dark:text-white"
          >
            <option value="30">30 días</option>
            <option value="60">60 días</option>
            <option value="90">90 días</option>
            <option value="120">120 días</option>
          </select>
        </div>

      </div>

      {/* Estado */}
      <div className="mt-4 text-sm text-slate-600 dark:text-slate-400">
        Viendo: <span className="font-semibold">{activeSegmentLabel}</span>
        {search && (
          <>
            {" "}· búsqueda: <span className="font-semibold">{search}</span>
          </>
        )}
      </div>

    </div>

    {/* 🔸 SEPARADOR REAL */}
    <div className="h-px bg-slate-200 dark:bg-slate-700" />

    {/* 🔹 LISTADO */}
    <div>

      <p className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-4">
        {isVeterinaria ? "Listado de tutores" : "Listado de clientes"}
      </p>

      <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700">

        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">

            <thead className="bg-slate-50 dark:bg-slate-800">
              <tr>
                <th className="px-5 py-3 text-left text-xs text-slate-500">Cliente</th>
                <th className="px-5 py-3 text-left text-xs text-slate-500">Contacto</th>
                <th className="px-5 py-3 text-left text-xs text-slate-500">Visitas</th>
                <th className="px-5 py-3 text-left text-xs text-slate-500">Segmento</th>
                <th className="px-5 py-3 text-left text-xs text-slate-500">Última visita</th>
              </tr>
            </thead>

            <tbody>
              {customers.map((customer) => {
                const segmentStyle = getCustomerSegmentStyles(customer.segment);

                return (
                  <tr
                    key={customer.id}
                    onClick={() =>
                      router.push(`/dashboard/${slug}/customers/${customer.id}`)
                    }
                    className="cursor-pointer border-t border-slate-200 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800/50"
                  >
                    <td className="px-5 py-4">
                      <p className="font-medium text-slate-900 dark:text-white">
                        {customer.name || "Sin nombre"}
                      </p>

                      {isVeterinaria && Array.isArray(customer.pets) && customer.pets.length > 0 && (
                        <div className="mt-1 flex flex-wrap gap-1">
                          {customer.pets.map((pet) => (
                            <span
                              key={pet.id}
                              className="text-xs text-emerald-600 dark:text-emerald-400"
                            >
                              {pet.name}
                            </span>
                          ))}
                        </div>
                      )}

                      <p className="text-xs text-slate-400">
                        ID: {customer.id.slice(0, 6)}
                      </p>
                    </td>

                    <td className="px-5 py-4 text-slate-600 dark:text-slate-400">
                      {customer.email || "Sin email"} <br />
                      {customer.phone || "Sin teléfono"}
                    </td>

                    <td className="px-5 py-4 font-semibold">
                      {customer.total_visits || 0}
                    </td>

                    <td className="px-5 py-4">
                      <span className={`text-xs font-semibold ${segmentStyle.className}`}>
                        {segmentStyle.label}
                      </span>
                    </td>

                    <td className="px-5 py-4 text-slate-600 dark:text-slate-400">
                      {formatDate(customer.last_visit_at)}
                    </td>
                  </tr>
                );
              })}
            </tbody>

          </table>
        </div>

      </div>

    </div>

  </div>
</Panel>
    </div>
  );
}