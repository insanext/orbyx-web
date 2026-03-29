"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { PageHeader } from "../../../../components/dashboard/page-header";
import { Panel } from "../../../../components/dashboard/panel";

const BACKEND_URL = "https://orbyx-backend.onrender.com";

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
};

type CustomersResponse = {
  total: number;
  customers: Customer[];
  error?: string;
};

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

function getCustomerSegment(totalVisits: number) {
  if (totalVisits >= 5) {
    return {
      label: "Frecuente",
      className:
        "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
    };
  }

  if (totalVisits >= 2) {
    return {
      label: "Recurrente",
      className:
        "bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300",
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
  const slug =
    ((params as any)?.slug as string) || ((params as any)?.Slug as string);

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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

        const url = search
          ? `${BACKEND_URL}/customers/${slug}?q=${encodeURIComponent(search)}`
          : `${BACKEND_URL}/customers/${slug}`;

        const res = await fetch(url);
        const data: CustomersResponse = await res.json();

        if (!res.ok) {
          throw new Error(data?.error || "No se pudieron cargar los clientes");
        }

        setCustomers(Array.isArray(data.customers) ? data.customers : []);
      } catch (err: any) {
        setError(err?.message || "Error cargando clientes");
        setCustomers([]);
      } finally {
        setLoading(false);
      }
    }

    if (slug) {
      loadCustomers();
    }
  }, [slug, search]);

  const stats = useMemo(() => {
    const total = customers.length;
    const frecuentes = customers.filter((c) => Number(c.total_visits || 0) >= 5).length;
    const recurrentes = customers.filter((c) => {
      const visits = Number(c.total_visits || 0);
      return visits >= 2 && visits < 5;
    }).length;
    const nuevos = customers.filter((c) => Number(c.total_visits || 0) <= 1).length;

    return {
      total,
      frecuentes,
      recurrentes,
      nuevos,
    };
  }, [customers]);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Clientes"
        title="Base de clientes"
        description="Gestiona los clientes del negocio y prepara la base para campañas, recuperación y seguimiento."
      />

      {error ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-300">
          {error}
        </div>
      ) : null}

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-4">
        <CustomerStatCard
          title="Clientes visibles"
          value={loading ? "..." : String(stats.total)}
          description="Clientes encontrados en la base actual del negocio."
        />
        <CustomerStatCard
          title="Nuevos"
          value={loading ? "..." : String(stats.nuevos)}
          description="Clientes con 1 visita o menos."
        />
        <CustomerStatCard
          title="Recurrentes"
          value={loading ? "..." : String(stats.recurrentes)}
          description="Clientes que ya han vuelto más de una vez."
        />
        <CustomerStatCard
          title="Frecuentes"
          value={loading ? "..." : String(stats.frecuentes)}
          description="Clientes con alta recurrencia, ideales para fidelización."
        />
      </section>

      <Panel
        title="Listado de clientes"
        description="Esta base servirá después para campañas por email, WhatsApp y recuperación."
      >
        <div className="space-y-4">
          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/70">
            <label className="mb-2 block text-xs font-medium uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
              Buscar cliente
            </label>
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Buscar por nombre, email o teléfono"
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-400 dark:border-slate-600 dark:bg-slate-900 dark:text-white dark:focus:border-slate-500"
            />
          </div>

          <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900/70">
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-slate-50 dark:bg-slate-800/80">
                  <tr>
                    <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                      Cliente
                    </th>
                    <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                      Contacto
                    </th>
                    <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                      Visitas
                    </th>
                    <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                      Segmento
                    </th>
                    <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                      Última visita
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {loading ? (
                    Array.from({ length: 6 }).map((_, index) => (
                      <tr
                        key={index}
                        className="border-t border-slate-200 dark:border-slate-700"
                      >
                        <td className="px-5 py-4">
                          <div className="h-4 w-32 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
                        </td>
                        <td className="px-5 py-4">
                          <div className="h-4 w-40 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
                        </td>
                        <td className="px-5 py-4">
                          <div className="h-4 w-16 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
                        </td>
                        <td className="px-5 py-4">
                          <div className="h-6 w-24 animate-pulse rounded-full bg-slate-200 dark:bg-slate-700" />
                        </td>
                        <td className="px-5 py-4">
                          <div className="h-4 w-36 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
                        </td>
                      </tr>
                    ))
                  ) : customers.length === 0 ? (
                    <tr>
                      <td
                        colSpan={5}
                        className="px-5 py-12 text-center text-sm text-slate-600 dark:text-slate-400"
                      >
                        No hay clientes aún o no hubo resultados para tu búsqueda.
                      </td>
                    </tr>
                  ) : (
                    customers.map((customer) => {
                      const segment = getCustomerSegment(
                        Number(customer.total_visits || 0)
                      );

                      return (
                        <tr
                          key={customer.id}
                          className="border-t border-slate-200 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800/50"
                        >
                          <td className="px-5 py-4 align-top">
                            <div>
                              <p className="font-medium text-slate-900 dark:text-white">
                                {customer.name || "Sin nombre"}
                              </p>
                              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                ID cliente: {customer.id.slice(0, 8)}
                              </p>
                            </div>
                          </td>

                          <td className="px-5 py-4 align-top">
                            <div className="space-y-1 text-sm text-slate-600 dark:text-slate-400">
                              <p>{customer.email || "Sin email"}</p>
                              <p>{customer.phone || "Sin teléfono"}</p>
                            </div>
                          </td>

                          <td className="px-5 py-4 align-top">
                            <span className="text-sm font-semibold text-slate-900 dark:text-white">
                              {Number(customer.total_visits || 0)}
                            </span>
                          </td>

                          <td className="px-5 py-4 align-top">
                            <span
                              className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${segment.className}`}
                            >
                              {segment.label}
                            </span>
                          </td>

                          <td className="px-5 py-4 align-top text-sm text-slate-600 dark:text-slate-400">
                            {formatDate(customer.last_visit_at)}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </Panel>
    </div>
  );
}