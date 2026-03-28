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
    plan_slug?: string | null;
  };
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

type BranchesResponse = {
  total?: number;
  branches?: BranchItem[];
};

const PLAN_LABELS: Record<string, string> = {
  starter: "Starter",
  pro: "Pro",
  premium: "Premium",
  vip: "VIP",
  platinum: "Platinum",
};

const PLAN_CAPS: Record<string, { max_branches: number }> = {
  starter: { max_branches: 1 },
  pro: { max_branches: 1 },
  premium: { max_branches: 2 },
  vip: { max_branches: 3 },
  platinum: { max_branches: 10 },
};

const NEXT_PLAN_BY_CURRENT: Record<string, string | null> = {
  starter: "premium",
  pro: "premium",
  premium: "vip",
  vip: "platinum",
  platinum: null,
};

export default function BranchesPage() {
  const params = useParams();
  const slug =
    ((params as { slug?: string })?.slug as string) ||
    ((params as { Slug?: string })?.Slug as string) ||
    "";

  const [tenantId, setTenantId] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [plan, setPlan] = useState("starter");

  const [branches, setBranches] = useState<BranchItem[]>([]);
  const [selectedBranchesToKeep, setSelectedBranchesToKeep] = useState<string[]>(
    []
  );

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
    const data: BranchesResponse | { error?: string } = await response.json();

    if (!response.ok) {
      throw new Error(
        "error" in data && data.error
          ? data.error
          : "No se pudieron cargar las sucursales"
      );
    }

    const rows: BranchItem[] =
      "branches" in data && Array.isArray(data.branches) ? data.branches : [];

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
      setPlan((businessData.business.plan_slug || "starter").toLowerCase());

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

  const activeBranchesCount = useMemo(() => {
    return branches.filter((branch) => branch.is_active !== false).length;
  }, [branches]);

  const inactiveBranchesCount = useMemo(() => {
    return branches.filter((branch) => branch.is_active === false).length;
  }, [branches]);

  const caps = PLAN_CAPS[plan] || PLAN_CAPS.starter;
  const maxBranches = caps.max_branches;

  const reachedLimit = activeBranchesCount >= maxBranches;
  const excessBranches = Math.max(0, activeBranchesCount - maxBranches);
  const hasExcess = excessBranches > 0;

  useEffect(() => {
    if (!hasExcess) {
      setSelectedBranchesToKeep([]);
      return;
    }

    const activeBranches = branches.filter((branch) => branch.is_active !== false);
    const allowedIds = activeBranches.slice(0, maxBranches).map((b) => b.id);
    setSelectedBranchesToKeep(allowedIds);
  }, [hasExcess, branches, maxBranches]);

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

      if (reachedLimit || hasExcess) {
        throw new Error("Ya alcanzaste el límite de sucursales de tu plan");
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

  function toggleBranchSelection(branchId: string) {
    setSelectedBranchesToKeep((prev) =>
      prev.includes(branchId)
        ? prev.filter((id) => id !== branchId)
        : [...prev, branchId]
    );
  }

  async function applyBranchesAdjustment() {
    try {
      const toDeactivate = branches.filter(
        (branch) =>
          branch.is_active !== false && !selectedBranchesToKeep.includes(branch.id)
      );

      if (toDeactivate.length === 0) {
        alert("No hay sucursales para desactivar.");
        return;
      }

      const confirmed = window.confirm(
        `Se desactivarán ${toDeactivate.length} sucursal${
          toDeactivate.length === 1 ? "" : "es"
        }. ¿Continuar?`
      );

      if (!confirmed) return;

      setSaving(true);
      setSaveError("");
      setSaveOk("");

      for (const branch of toDeactivate) {
        const response = await fetch(`${BACKEND_URL}/branches/${branch.id}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            tenant_id: tenantId,
            is_active: false,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data?.error || `No se pudo desactivar la sucursal ${branch.name}`
          );
        }
      }

      await loadBranches(tenantId);
      setSaveOk("Ajuste aplicado correctamente.");
    } catch (error: unknown) {
      setSaveError(
        error instanceof Error ? error.message : "No se pudo aplicar el ajuste"
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

  const planLabel = PLAN_LABELS[plan] || "Starter";
  const nextPlan = NEXT_PLAN_BY_CURRENT[plan] || null;
  const nextPlanLabel = nextPlan ? PLAN_LABELS[nextPlan] || nextPlan : null;

  return (
    <div className="space-y-6 rounded-[28px] bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.10),_transparent_28%),radial-gradient(circle_at_top_right,_rgba(139,92,246,0.12),_transparent_30%),linear-gradient(180deg,_#0f172a_0%,_#111827_42%,_#0b1120_100%)] p-4 sm:p-6">
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
              className="inline-flex h-11 items-center justify-center rounded-2xl border border-white/15 bg-white/10 px-5 text-sm font-medium text-white backdrop-blur-sm transition hover:bg-white/15"
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
              className="inline-flex h-11 items-center justify-center rounded-2xl bg-white px-5 text-sm font-semibold text-slate-900 transition hover:bg-slate-100"
            >
              Recargar
            </button>
          </div>
        }
      />

      {loadError ? (
        <div className="rounded-2xl border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-100 shadow-sm backdrop-blur-sm">
          {loadError}
        </div>
      ) : null}

      {saveError ? (
        <div className="rounded-2xl border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-100 shadow-sm backdrop-blur-sm">
          {saveError}
        </div>
      ) : null}

      {saveOk ? (
        <div className="rounded-2xl border border-emerald-400/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100 shadow-sm backdrop-blur-sm">
          {saveOk}
        </div>
      ) : null}

      <section className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <div className="[&>div]:border-white/10 [&>div]:bg-white/10 [&>div]:text-white [&>div]:shadow-xl [&>div]:backdrop-blur-md [&_p]:text-slate-300 [&_span]:text-slate-300">
          <StatCard
            label="Total sucursales"
            value={loading ? "..." : String(branches.length)}
            helper="Cantidad de sucursales registradas."
          />
        </div>

        <div className="[&>div]:border-white/10 [&>div]:bg-white/10 [&>div]:text-white [&>div]:shadow-xl [&>div]:backdrop-blur-md [&_p]:text-slate-300 [&_span]:text-slate-300">
          <StatCard
            label="Activas"
            value={loading ? "..." : String(activeBranchesCount)}
            helper="Sucursales disponibles actualmente."
          />
        </div>

        <div className="[&>div]:border-white/10 [&>div]:bg-white/10 [&>div]:text-white [&>div]:shadow-xl [&>div]:backdrop-blur-md [&_p]:text-slate-300 [&_span]:text-slate-300">
          <StatCard
            label="Inactivas"
            value={loading ? "..." : String(inactiveBranchesCount)}
            helper="Sucursales desactivadas."
          />
        </div>

        <div className="[&>div]:border-white/10 [&>div]:bg-white/10 [&>div]:text-white [&>div]:shadow-xl [&>div]:backdrop-blur-md [&_p]:text-slate-300 [&_span]:text-slate-300">
          <StatCard
            label="Plan actual"
            value={loading ? "..." : planLabel}
            helper={
              loading
                ? "Cargando..."
                : hasExcess
                ? `Exceso: ${activeBranchesCount}/${maxBranches}`
                : `Uso: ${activeBranchesCount}/${maxBranches} sucursales`
            }
          />
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="[&>div]:border-white/10 [&>div]:bg-white/10 [&>div]:text-white [&>div]:shadow-[0_20px_60px_rgba(15,23,42,0.35)] [&>div]:backdrop-blur-xl">
          <Panel
            title="Sucursales actuales"
            description="Estas son las sucursales registradas en el negocio."
          >
            {loading ? (
              <div className="rounded-2xl border border-dashed border-white/15 bg-white/5 px-4 py-8 text-sm text-slate-300">
                Cargando sucursales...
              </div>
            ) : branches.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-white/15 bg-white/5 px-4 py-8 text-sm text-slate-300">
                Aún no tienes sucursales creadas. Puedes seguir operando normal,
                pero si quieres probar multi-sucursal, crea la primera aquí.
              </div>
            ) : (
              <div className="space-y-4">
                {branches.map((branch) => {
                  const isActive = branch.is_active !== false;
                  const isMarkedToKeep = selectedBranchesToKeep.includes(branch.id);

                  return (
                    <div
                      key={branch.id}
                      className="rounded-3xl border border-white/10 bg-white/90 p-5 shadow-[0_18px_50px_rgba(15,23,42,0.12)]"
                    >
                      {hasExcess && isActive ? (
                        <label className="mb-4 inline-flex items-center gap-2 rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-xs font-medium text-rose-700">
                          <input
                            type="checkbox"
                            checked={isMarkedToKeep}
                            onChange={() => toggleBranchSelection(branch.id)}
                            className="h-4 w-4 rounded border-slate-300"
                          />
                          Mantener activa
                        </label>
                      ) : null}

                      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-lg font-semibold tracking-tight text-slate-900">
                              {branch.name}
                            </h3>

                            <span
                              className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                isActive
                                  ? hasExcess
                                    ? "bg-rose-100 text-rose-700"
                                    : "bg-emerald-50 text-emerald-700"
                                  : "bg-slate-100 text-slate-600"
                              }`}
                            >
                              {isActive
                                ? hasExcess
                                  ? "Exceso"
                                  : "Activa"
                                : "Inactiva"}
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
                  );
                })}
              </div>
            )}
          </Panel>
        </div>

        <div className="[&>div]:border-white/10 [&>div]:bg-white/10 [&>div]:text-white [&>div]:shadow-[0_20px_60px_rgba(15,23,42,0.35)] [&>div]:backdrop-blur-xl">
          <Panel
            title="Crear nueva sucursal"
            description="Agrega una sucursal para operar varias ubicaciones desde la misma cuenta."
          >
            <div className="space-y-5">
              <div className="rounded-[24px] border border-white/10 bg-gradient-to-br from-white/10 via-white/5 to-transparent p-4 shadow-[0_10px_35px_rgba(15,23,42,0.22)]">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-200/80">
                      Plan actual
                    </p>
                    <h3 className="mt-2 text-xl font-semibold text-white">
                      {planLabel}
                    </h3>
                    <p className="mt-2 text-sm text-slate-300">
                      Estás usando {activeBranchesCount} de {maxBranches} sucursales
                      disponibles.
                    </p>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-white/10 px-3 py-2 text-right backdrop-blur-sm">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-300">
                      Estado
                    </p>
                    <p className="mt-1 text-sm font-semibold text-white">
                      {hasExcess
                        ? "Exceso"
                        : reachedLimit
                        ? "Límite alcanzado"
                        : "Disponible"}
                    </p>
                  </div>
                </div>

                {hasExcess && (
                  <div className="mt-4 rounded-xl border border-rose-300/25 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
                    Estás sobre el límite del plan. Debes desactivar{" "}
                    <span className="font-semibold">{excessBranches}</span>{" "}
                    sucursal{excessBranches === 1 ? "" : "es"} antes del próximo
                    ciclo.

                    <div className="mt-2 text-xs text-rose-50/90">
                      Seleccionadas: {selectedBranchesToKeep.length} /{" "}
                      {maxBranches}
                    </div>

                    <button
                      type="button"
                      onClick={applyBranchesAdjustment}
                      disabled={saving}
                      className="mt-3 w-full rounded-xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {saving
                        ? "Aplicando ajuste..."
                        : "Aplicar ajuste al plan"}
                    </button>
                  </div>
                )}
              </div>

              {reachedLimit && !hasExcess ? (
                <div className="relative overflow-hidden rounded-[26px] border border-fuchsia-400/20 bg-[linear-gradient(135deg,rgba(124,58,237,0.22),rgba(59,130,246,0.18))] p-5 shadow-[0_20px_60px_rgba(76,29,149,0.24)]">
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.18),transparent_35%)]" />

                  <div className="relative">
                    <div className="inline-flex rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-sky-100 backdrop-blur-sm">
                      Upgrade recomendado
                    </div>

                    <h3 className="mt-4 text-xl font-semibold text-white">
                      Desbloquea más sucursales para seguir creciendo
                    </h3>

                    <p className="mt-2 text-sm leading-6 text-slate-200">
                      Ya llegaste al límite de tu plan actual. Sube a{" "}
                      <span className="font-semibold text-white">
                        {nextPlanLabel || "un plan superior"}
                      </span>{" "}
                      para agregar más sucursales y seguir separando tu operación
                      por ubicación.
                    </p>

                    <div className="mt-4 space-y-2 text-sm text-slate-100">
                      <div className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 backdrop-blur-sm">
                        ✔ Más sucursales por cuenta
                      </div>
                      <div className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 backdrop-blur-sm">
                        ✔ Mejor control por ubicación
                      </div>
                      <div className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 backdrop-blur-sm">
                        ✔ Escala tu operación sin mezclar agendas
                      </div>
                    </div>

                    <div className="mt-5">
                      <Link
                        href={`/planes?current_plan=${plan}&from=branches&slug=${slug}&tenant_id=${tenantId}`}
                        className="group inline-flex h-11 w-full items-center justify-center rounded-2xl bg-gradient-to-r from-violet-500 via-fuchsia-500 to-sky-500 px-5 text-sm font-semibold text-white shadow-[0_12px_35px_rgba(99,102,241,0.35)] transition duration-200 hover:scale-[1.01] hover:shadow-[0_18px_45px_rgba(99,102,241,0.42)]"
                      >
                        <span className="transition group-hover:translate-x-[1px]">
                          Subir a {nextPlanLabel || "un plan superior"}
                        </span>
                      </Link>
                    </div>
                  </div>
                </div>
              ) : !hasExcess ? (
                <div className="rounded-2xl border border-emerald-400/20 bg-emerald-500/10 p-4 backdrop-blur-sm">
                  <p className="text-sm font-medium text-emerald-100">
                    Todavía puedes crear más sucursales en tu plan actual.
                  </p>
                  <p className="mt-1 text-sm text-emerald-50/80">
                    Agrega una nueva ubicación y separa agenda, servicios y
                    reservas públicas.
                  </p>
                </div>
              ) : null}

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-200">
                  Nombre de la sucursal
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, name: e.target.value }))
                  }
                  placeholder="Ej: Sucursal Centro"
                  disabled={saving || loading || reachedLimit || hasExcess}
                  className="h-11 w-full rounded-2xl border border-white/10 bg-white/10 px-4 text-sm text-white outline-none transition placeholder:text-slate-400 focus:border-sky-400/40 focus:ring-4 focus:ring-sky-400/10 disabled:cursor-not-allowed disabled:opacity-60"
                />
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
                <p className="text-sm font-medium text-white">Qué desbloquea</p>
                <div className="mt-3 space-y-2 text-sm text-slate-300">
                  <div className="rounded-xl border border-white/8 bg-white/5 px-3 py-2">
                    ✔ Agenda separada por sucursal
                  </div>
                  <div className="rounded-xl border border-white/8 bg-white/5 px-3 py-2">
                    ✔ Servicios independientes por ubicación
                  </div>
                  <div className="rounded-xl border border-white/8 bg-white/5 px-3 py-2">
                    ✔ Staff organizado según la sucursal
                  </div>
                  <div className="rounded-xl border border-white/8 bg-white/5 px-3 py-2">
                    ✔ Reservas públicas diferenciadas
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={handleCreateBranch}
                disabled={saving || loading || reachedLimit || hasExcess}
                className={`inline-flex h-11 w-full items-center justify-center rounded-2xl px-5 text-sm font-semibold text-white transition ${
                  reachedLimit || hasExcess
                    ? "cursor-not-allowed bg-slate-600/70 opacity-70"
                    : "bg-gradient-to-r from-violet-500 via-fuchsia-500 to-sky-500 shadow-[0_12px_35px_rgba(99,102,241,0.28)] hover:scale-[1.01] hover:shadow-[0_18px_45px_rgba(99,102,241,0.34)]"
                }`}
              >
                {hasExcess
                  ? "Primero ajusta tus sucursales"
                  : reachedLimit
                  ? "Límite de sucursales alcanzado"
                  : saving
                  ? "Creando..."
                  : "Crear sucursal"}
              </button>
            </div>
          </Panel>
        </div>
      </section>
    </div>
  );
}