"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { PageHeader } from "../../../../components/dashboard/page-header";
import { Panel } from "../../../../components/dashboard/panel";
import { StatCard } from "../../../../components/dashboard/stat-card";

const BACKEND_URL = "https://orbyx-backend.onrender.com";

type BusinessResponse = {
  business: {
    id: string;
    name: string;
    slug: string;
  };
  calendar_id?: string;
  google_connected?: boolean;
  plan_slug?: string | null;
};

type BranchItem = {
  id: string;
  tenant_id?: string;
  name: string;
  address?: string | null;
  phone?: string | null;
  is_active?: boolean;
  created_at?: string;
};

export default function BranchesPage() {
  const params = useParams();
  const slug =
    ((params as { slug?: string })?.slug as string) ||
    ((params as { Slug?: string })?.Slug as string) ||
    "";

  const [tenantId, setTenantId] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [branches, setBranches] = useState<BranchItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [saveError, setSaveError] = useState("");
  const [saveOk, setSaveOk] = useState("");
  const [copiedId, setCopiedId] = useState("");

  const [form, setForm] = useState({
    name: "",
  });

  async function loadBranches(currentTenantId: string) {
    const response = await fetch(
      `${BACKEND_URL}/branches?tenant_id=${currentTenantId}`
    );
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data?.error || "No se pudieron cargar las sucursales");
    }

    const rows: BranchItem[] = Array.isArray(data?.branches) ? data.branches : [];
    setBranches(rows);
  }

  async function loadAll() {
    try {
      setLoading(true);
      setLoadError("");

      const businessRes = await fetch(`${BACKEND_URL}/public/business/${slug}`);
      const businessData: BusinessResponse | { error?: string } =
        await businessRes.json();

      if (!businessRes.ok) {
        throw new Error(
          "error" in businessData && businessData.error
            ? businessData.error
            : "No se pudo cargar el negocio"
        );
      }

      if (!("business" in businessData)) {
        throw new Error("Respuesta inválida del backend");
      }

      const currentTenantId = businessData.business.id;

      setTenantId(currentTenantId);
      setBusinessName(businessData.business.name || slug);

      await loadBranches(currentTenantId);
    } catch (error: unknown) {
      setLoadError(
        error instanceof Error ? error.message : "No se pudo cargar la página"
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!slug) return;
    loadAll();
  }, [slug]);

  async function handleCreateBranch() {
    try {
      setSaving(true);
      setSaveError("");
      setSaveOk("");

      if (!tenantId) {
        throw new Error("No se encontró el negocio");
      }

      if (!form.name.trim()) {
        throw new Error("Debes ingresar el nombre de la sucursal");
      }

      const response = await fetch(`${BACKEND_URL}/branches`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          tenant_id: tenantId,
          name: form.name.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || "No se pudo crear la sucursal");
      }

      setForm({ name: "" });
      setSaveOk("Sucursal creada correctamente.");
      await loadBranches(tenantId);
    } catch (error: unknown) {
      setSaveError(
        error instanceof Error ? error.message : "No se pudo crear la sucursal"
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleCopyId(branchId: string) {
    try {
      await navigator.clipboard.writeText(branchId);
      setCopiedId(branchId);
      setTimeout(() => setCopiedId(""), 1600);
    } catch {
      setCopiedId("");
    }
  }

  const activeBranchesCount = useMemo(() => {
    return branches.filter((branch) => branch.is_active !== false).length;
  }, [branches]);

  const inactiveBranchesCount = useMemo(() => {
    return branches.filter((branch) => branch.is_active === false).length;
  }, [branches]);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Sucursales"
        title={loading ? "Cargando sucursales..." : "Sucursales del negocio"}
        description={`Gestiona las sucursales de ${
          loading ? "tu negocio" : businessName
        }.`}
        actions={
          <div className="flex flex-wrap gap-3">
            <Link
              href={`/dashboard/${slug}/agenda`}
              className="inline-flex h-11 items-center justify-center rounded-2xl border border-slate-200 bg-white px-5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              Ver agenda
            </Link>

            <button
              type="button"
              onClick={() => {
                if (!tenantId) return;
                loadBranches(tenantId).catch((error: unknown) => {
                  setLoadError(
                    error instanceof Error
                      ? error.message
                      : "No se pudieron recargar las sucursales"
                  );
                });
              }}
              className="inline-flex h-11 items-center justify-center rounded-2xl bg-slate-900 px-5 text-sm font-medium text-white transition hover:bg-slate-800"
            >
              Recargar
            </button>
          </div>
        }
      />

      {loadError ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 shadow-sm">
          {loadError}
        </div>
      ) : null}

      {saveError ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 shadow-sm">
          {saveError}
        </div>
      ) : null}

      {saveOk ? (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 shadow-sm">
          {saveOk}
        </div>
      ) : null}

      <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <StatCard
          label="Total sucursales"
          value={loading ? "..." : String(branches.length)}
          helper="Cantidad de sucursales registradas."
        />
        <StatCard
          label="Activas"
          value={loading ? "..." : String(activeBranchesCount)}
          helper="Sucursales disponibles actualmente."
        />
        <StatCard
          label="Inactivas"
          value={loading ? "..." : String(inactiveBranchesCount)}
          helper="Sucursales deshabilitadas."
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <Panel
          title="Sucursales actuales"
          description="Estas son las sucursales registradas en el negocio."
        >
          {loading ? (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-sm text-slate-500">
              Cargando sucursales...
            </div>
          ) : branches.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-sm text-slate-500">
              Aún no tienes sucursales creadas. Puedes seguir operando normal,
              pero si quieres probar multi-sucursal, crea la primera aquí.
            </div>
          ) : (
            <div className="space-y-4">
              {branches.map((branch) => (
                <div
                  key={branch.id}
                  className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-lg font-semibold tracking-tight text-slate-900">
                          {branch.name}
                        </h3>

                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${
                            branch.is_active === false
                              ? "bg-slate-100 text-slate-600"
                              : "bg-emerald-50 text-emerald-700"
                          }`}
                        >
                          {branch.is_active === false ? "Inactiva" : "Activa"}
                        </span>
                      </div>

                      <p className="mt-2 text-sm text-slate-500">
                        Usa esta sucursal en servicios, agenda y reservas
                        públicas cuando tengas multi-sucursal activo.
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <Link
                        href={`/dashboard/${slug}/services`}
                        className="inline-flex h-10 items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                      >
                        Ver servicios
                      </Link>

                      <Link
                        href={`/dashboard/${slug}/agenda`}
                        className="inline-flex h-10 items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                      >
                        Ver agenda
                      </Link>
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                        ID
                      </p>
                      <p className="mt-2 break-all text-sm font-semibold text-slate-900">
                        {branch.id}
                      </p>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                        Creación
                      </p>
                      <p className="mt-2 text-sm font-semibold text-slate-900">
                        {branch.created_at
                          ? new Date(branch.created_at).toLocaleDateString(
                              "es-CL"
                            )
                          : "No disponible"}
                      </p>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                        Acciones
                      </p>

                      <button
                        type="button"
                        onClick={() => handleCopyId(branch.id)}
                        className="mt-2 inline-flex h-10 items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                      >
                        {copiedId === branch.id ? "ID copiado" : "Copiar ID"}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Panel>

        <Panel
          title="Crear nueva sucursal"
          description="Agrega una sucursal para operar varias ubicaciones desde la misma cuenta."
        >
          <div className="space-y-5">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Nombre de la sucursal
              </label>
              <input
                type="text"
                value={form.name}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, name: e.target.value }))
                }
                placeholder="Ej: Sucursal Centro"
                className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-4 focus:ring-slate-200/60"
              />
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm font-medium text-slate-700">Qué desbloquea</p>
              <p className="mt-1 text-sm text-slate-500">
                Luego podrás separar servicios, agenda y reservas públicas por
                sucursal.
              </p>
            </div>

            <button
              type="button"
              onClick={handleCreateBranch}
              disabled={saving || loading}
              className="inline-flex h-11 w-full items-center justify-center rounded-2xl bg-slate-900 px-5 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? "Creando..." : "Crear sucursal"}
            </button>
          </div>
        </Panel>
      </section>
    </div>
  );
}