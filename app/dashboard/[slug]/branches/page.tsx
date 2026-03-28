"use client";

import { CSSProperties, useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Panel } from "../../../../components/dashboard/panel";

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

type NoticeTone =
  | "info"
  | "success"
  | "warning"
  | "limit"
  | "danger"
  | "neutral";

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

function normalizePlanSlug(planSlug?: string | null) {
  const normalized = String(planSlug || "starter").toLowerCase();
  if (normalized === "starter") return "pro";
  if (["pro", "premium", "vip", "platinum"].includes(normalized)) {
    return normalized;
  }
  return "pro";
}

function getNoticeStyles(tone: NoticeTone): {
  wrapper: CSSProperties;
  title: CSSProperties;
  description: CSSProperties;
} {
  const tones: Record<
    NoticeTone,
    { border: string; background: string; text: string }
  > = {
    info: {
      border: "rgba(34,197,94,0.34)",
      background:
        "linear-gradient(135deg, rgba(34,197,94,0.12), rgba(34,197,94,0.05))",
      text: "var(--text-main)",
    },
    success: {
      border: "rgba(16,185,129,0.34)",
      background:
        "linear-gradient(135deg, rgba(16,185,129,0.12), rgba(16,185,129,0.05))",
      text: "var(--text-main)",
    },
    warning: {
      border: "rgba(245,158,11,0.34)",
      background:
        "linear-gradient(135deg, rgba(245,158,11,0.12), rgba(245,158,11,0.05))",
      text: "var(--text-main)",
    },
    limit: {
      border: "rgba(249,115,22,0.34)",
      background:
        "linear-gradient(135deg, rgba(249,115,22,0.12), rgba(249,115,22,0.05))",
      text: "var(--text-main)",
    },
    danger: {
      border: "rgba(244,63,94,0.34)",
      background:
        "linear-gradient(135deg, rgba(244,63,94,0.12), rgba(244,63,94,0.05))",
      text: "var(--text-main)",
    },
    neutral: {
      border: "var(--border-color)",
      background: "var(--bg-soft)",
      text: "var(--text-main)",
    },
  };

  const current = tones[tone];

  return {
    wrapper: {
      borderColor: current.border,
      background: current.background,
      boxShadow: `inset 0 1px 0 rgba(255,255,255,0.04), 0 0 0 1px ${current.border}`,
    },
    title: {
      color: current.text,
    },
    description: {
      color: "var(--text-muted)",
    },
  };
}

function Notice({
  tone,
  title,
  description,
  children,
}: {
  tone: NoticeTone;
  title: string;
  description?: string;
  children?: React.ReactNode;
}) {
  const styles = getNoticeStyles(tone);

  return (
    <div className="rounded-2xl border px-4 py-4 shadow-sm" style={styles.wrapper}>
      <p className="text-sm font-semibold" style={styles.title}>
        {title}
      </p>
      {description ? (
        <p className="mt-1 text-sm leading-6" style={styles.description}>
          {description}
        </p>
      ) : null}
      {children ? <div className="mt-3">{children}</div> : null}
    </div>
  );
}

export default function BranchesPage() {
  const params = useParams();
  const slug =
    ((params as { slug?: string })?.slug as string) ||
    ((params as { Slug?: string })?.Slug as string) ||
    "";

  const [tenantId, setTenantId] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [plan, setPlan] = useState("pro");

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
      setPlan(normalizePlanSlug(businessData.business.plan_slug));

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

  const caps = PLAN_CAPS[plan] || PLAN_CAPS.pro;
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

  const planLabel = PLAN_LABELS[plan] || "Pro";
  const nextPlan = NEXT_PLAN_BY_CURRENT[plan] || null;
  const nextPlanLabel = nextPlan ? PLAN_LABELS[nextPlan] || nextPlan : null;

  return (
    <div className="space-y-6 pb-6">
      <section
        className="overflow-hidden rounded-[30px] border p-6 shadow-sm"
        style={{
          borderColor: "rgba(139,92,246,0.25)",
          background:
            "linear-gradient(135deg, rgba(139,92,246,0.14), rgba(59,130,246,0.06) 35%, var(--bg-card) 85%)",
        }}
      >
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <p
              className="mb-2 text-xs font-semibold uppercase tracking-[0.22em]"
              style={{ color: "var(--text-muted)" }}
            >
              Sucursales
            </p>

            <h1
              className="text-3xl font-semibold tracking-tight sm:text-4xl"
              style={{ color: "var(--text-main)" }}
            >
              Sucursales del negocio
            </h1>

            <p
              className="mt-3 max-w-2xl text-sm leading-6 sm:text-[15px]"
              style={{ color: "var(--text-muted)" }}
            >
              {loading
                ? "Cargando información del negocio..."
                : `Gestiona las sucursales de ${businessName}.`}
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <div
              className="rounded-2xl border px-4 py-3"
              style={{
                borderColor: "rgba(139,92,246,0.24)",
                background: "rgba(255,255,255,0.08)",
              }}
            >
              <p
                className="text-[11px] font-semibold uppercase tracking-[0.16em]"
                style={{ color: "var(--text-muted)" }}
              >
                Total sucursales
              </p>
              <p
                className="mt-2 text-sm font-semibold"
                style={{ color: "var(--text-main)" }}
              >
                {loading ? "..." : branches.length}
              </p>
            </div>

            <div
              className="rounded-2xl border px-4 py-3"
              style={{
                borderColor: "rgba(139,92,246,0.24)",
                background: "rgba(255,255,255,0.08)",
              }}
            >
              <p
                className="text-[11px] font-semibold uppercase tracking-[0.16em]"
                style={{ color: "var(--text-muted)" }}
              >
                Activas
              </p>
              <p
                className="mt-2 text-sm font-semibold"
                style={{ color: "var(--text-main)" }}
              >
                {loading ? "..." : activeBranchesCount}
              </p>
            </div>

            <div
              className="rounded-2xl border px-4 py-3"
              style={{
                borderColor: "rgba(139,92,246,0.24)",
                background: "rgba(255,255,255,0.08)",
              }}
            >
              <p
                className="text-[11px] font-semibold uppercase tracking-[0.16em]"
                style={{ color: "var(--text-muted)" }}
              >
                Inactivas
              </p>
              <p
                className="mt-2 text-sm font-semibold"
                style={{ color: "var(--text-main)" }}
              >
                {loading ? "..." : inactiveBranchesCount}
              </p>
            </div>

            <div
              className="rounded-2xl border px-4 py-3"
              style={{
                borderColor: "rgba(139,92,246,0.24)",
                background: "rgba(255,255,255,0.08)",
              }}
            >
              <p
                className="text-[11px] font-semibold uppercase tracking-[0.16em]"
                style={{ color: "var(--text-muted)" }}
              >
                Plan actual
              </p>
              <p
                className="mt-2 text-sm font-semibold"
                style={{ color: "var(--text-main)" }}
              >
                {loading ? "..." : `${planLabel} · ${activeBranchesCount}/${maxBranches}`}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <Link
            href={`/dashboard/${slug}/agenda`}
            className="inline-flex h-10 items-center justify-center rounded-xl border px-4 text-sm font-medium transition"
            style={{
              borderColor: "var(--border-color)",
              background: "var(--bg-card)",
              color: "var(--text-main)",
            }}
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
            className="inline-flex h-10 items-center justify-center rounded-xl px-4 text-sm font-semibold text-white transition"
            style={{
              background:
                "linear-gradient(135deg, rgb(139 92 246), rgb(99 102 241))",
            }}
          >
            Recargar
          </button>
        </div>
      </section>

      {loadError ? <Notice tone="danger" title={loadError} /> : null}
      {saveError ? <Notice tone="danger" title={saveError} /> : null}
      {saveOk ? <Notice tone="success" title={saveOk} /> : null}

      {hasExcess ? (
        <Notice
          tone="limit"
          title="Estás sobre el límite de sucursales de tu plan."
          description={`Debes desactivar ${excessBranches} sucursal${
            excessBranches === 1 ? "" : "es"
          } antes del próximo ciclo.`}
        >
          <div className="text-xs" style={{ color: "var(--text-muted)" }}>
            Seleccionadas: {selectedBranchesToKeep.length} / {maxBranches}
          </div>

          <button
            type="button"
            onClick={applyBranchesAdjustment}
            disabled={saving}
            className="mt-3 inline-flex h-11 items-center justify-center rounded-xl px-4 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-60"
            style={{
              background:
                "linear-gradient(135deg, rgb(249 115 22), rgb(251 146 60))",
            }}
          >
            {saving ? "Aplicando ajuste..." : "Aplicar ajuste al plan"}
          </button>
        </Notice>
      ) : null}

      <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <Panel
          title="Sucursales actuales"
          description="Estas son las sucursales registradas en el negocio."
          className="bg-[linear-gradient(180deg,rgba(37,99,235,0.08),transparent_35%)]"
        >
          {loading ? (
            <div
              className="rounded-2xl border border-dashed px-4 py-8 text-sm"
              style={{
                borderColor: "var(--border-color)",
                background: "var(--bg-soft)",
                color: "var(--text-muted)",
              }}
            >
              Cargando sucursales...
            </div>
          ) : branches.length === 0 ? (
            <div
              className="rounded-2xl border border-dashed px-4 py-8 text-sm"
              style={{
                borderColor: "var(--border-color)",
                background: "var(--bg-soft)",
                color: "var(--text-muted)",
              }}
            >
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
                    className="rounded-[24px] border p-5 transition"
                    style={{
                      borderColor: "var(--border-color)",
                      background:
                        "linear-gradient(135deg, rgba(37,99,235,0.06), var(--bg-card))",
                    }}
                  >
                    {hasExcess && isActive ? (
                      <label
                        className="mb-4 inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium"
                        style={{
                          borderColor: isMarkedToKeep
                            ? "rgba(16,185,129,0.34)"
                            : "rgba(244,63,94,0.34)",
                          background: isMarkedToKeep
                            ? "rgba(16,185,129,0.10)"
                            : "rgba(244,63,94,0.10)",
                          color: "var(--text-main)",
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={isMarkedToKeep}
                          onChange={() => toggleBranchSelection(branch.id)}
                          className="h-4 w-4 rounded"
                        />
                        Mantener activa
                      </label>
                    ) : null}

                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h3
                            className="text-lg font-semibold tracking-tight"
                            style={{ color: "var(--text-main)" }}
                          >
                            {branch.name}
                          </h3>

                          <span
                            className="rounded-full px-3 py-1 text-xs font-semibold"
                            style={{
                              background: isActive
                                ? hasExcess
                                  ? "rgba(249,115,22,0.14)"
                                  : "rgba(16,185,129,0.14)"
                                : "rgba(148,163,184,0.16)",
                              color: isActive
                                ? hasExcess
                                  ? "rgb(249 115 22)"
                                  : "rgb(16 185 129)"
                                : "var(--text-muted)",
                            }}
                          >
                            {isActive
                              ? hasExcess
                                ? "Exceso"
                                : "Activa"
                              : "Inactiva"}
                          </span>
                        </div>

                        <p
                          className="mt-2 text-sm"
                          style={{ color: "var(--text-muted)" }}
                        >
                          Usa esta sucursal en servicios, agenda y reservas públicas
                          cuando tengas multi-sucursal activo.
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <Link
                          href={`/dashboard/${slug}/services`}
                          className="inline-flex h-10 items-center justify-center rounded-2xl border px-4 text-sm font-medium transition"
                          style={{
                            borderColor: "var(--border-color)",
                            background: "var(--bg-card)",
                            color: "var(--text-main)",
                          }}
                        >
                          Ver servicios
                        </Link>

                        <Link
                          href={`/dashboard/${slug}/agenda`}
                          className="inline-flex h-10 items-center justify-center rounded-2xl border px-4 text-sm font-medium transition"
                          style={{
                            borderColor: "var(--border-color)",
                            background: "var(--bg-card)",
                            color: "var(--text-main)",
                          }}
                        >
                          Ver agenda
                        </Link>
                      </div>
                    </div>

                    <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
                      <div
                        className="rounded-2xl border px-4 py-3"
                        style={{
                          borderColor: "var(--border-color)",
                          background: "var(--bg-soft)",
                        }}
                      >
                        <p
                          className="text-xs font-semibold uppercase tracking-[0.16em]"
                          style={{ color: "var(--text-muted)" }}
                        >
                          ID
                        </p>
                        <p
                          className="mt-2 break-all text-sm font-semibold"
                          style={{ color: "var(--text-main)" }}
                        >
                          {branch.id}
                        </p>
                      </div>

                      <div
                        className="rounded-2xl border px-4 py-3"
                        style={{
                          borderColor: "var(--border-color)",
                          background: "var(--bg-soft)",
                        }}
                      >
                        <p
                          className="text-xs font-semibold uppercase tracking-[0.16em]"
                          style={{ color: "var(--text-muted)" }}
                        >
                          Creación
                        </p>
                        <p
                          className="mt-2 text-sm font-semibold"
                          style={{ color: "var(--text-main)" }}
                        >
                          {branch.created_at
                            ? new Date(branch.created_at).toLocaleDateString("es-CL")
                            : "No disponible"}
                        </p>
                      </div>

                      <div
                        className="rounded-2xl border px-4 py-3"
                        style={{
                          borderColor: "var(--border-color)",
                          background: "var(--bg-soft)",
                        }}
                      >
                        <p
                          className="text-xs font-semibold uppercase tracking-[0.16em]"
                          style={{ color: "var(--text-muted)" }}
                        >
                          Acciones
                        </p>

                        <button
                          type="button"
                          onClick={() => handleCopyId(branch.id)}
                          className="mt-2 inline-flex h-10 items-center justify-center rounded-2xl border px-4 text-sm font-medium transition"
                          style={{
                            borderColor: "var(--border-color)",
                            background: "var(--bg-card)",
                            color: "var(--text-main)",
                          }}
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

        <Panel
          title="Crear nueva sucursal"
          description="Agrega una sucursal para operar varias ubicaciones desde la misma cuenta."
          className="bg-[linear-gradient(180deg,rgba(139,92,246,0.08),transparent_40%)]"
        >
          <div className="space-y-5">
            <div
              className="rounded-2xl border p-4"
              style={{
                borderColor: "var(--border-color)",
                background:
                  "linear-gradient(135deg, rgba(139,92,246,0.10), var(--bg-soft))",
              }}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p
                    className="text-xs font-semibold uppercase tracking-[0.18em]"
                    style={{ color: "var(--text-muted)" }}
                  >
                    Plan actual
                  </p>
                  <h3
                    className="mt-2 text-xl font-semibold"
                    style={{ color: "var(--text-main)" }}
                  >
                    {planLabel}
                  </h3>
                  <p
                    className="mt-2 text-sm"
                    style={{ color: "var(--text-muted)" }}
                  >
                    Estás usando {activeBranchesCount} de {maxBranches} sucursales
                    disponibles.
                  </p>
                </div>

                <div
                  className="rounded-2xl border px-3 py-2 text-right"
                  style={{
                    borderColor: "var(--border-color)",
                    background: "var(--bg-card)",
                  }}
                >
                  <p
                    className="text-[11px] font-semibold uppercase tracking-[0.18em]"
                    style={{ color: "var(--text-muted)" }}
                  >
                    Estado
                  </p>
                  <p
                    className="mt-1 text-sm font-semibold"
                    style={{ color: "var(--text-main)" }}
                  >
                    {hasExcess
                      ? "Exceso"
                      : reachedLimit
                      ? "Límite alcanzado"
                      : "Disponible"}
                  </p>
                </div>
              </div>
            </div>

            {reachedLimit && !hasExcess ? (
              <Notice
                tone="limit"
                title="Llegaste al límite de sucursales de tu plan."
                description={`Tu plan ${planLabel} permite ${maxBranches} sucursal${
                  maxBranches === 1 ? "" : "es"
                } activa${maxBranches === 1 ? "" : "s"}.`}
              >
                <div className="space-y-2 text-sm" style={{ color: "var(--text-main)" }}>
                  <div>✔ Más sucursales por cuenta</div>
                  <div>✔ Mejor control por ubicación</div>
                  <div>✔ Escala tu operación sin mezclar agendas</div>
                </div>

                {nextPlanLabel ? (
                  <div className="mt-4">
                    <Link
                      href={`/planes?current_plan=${plan}&from=branches&slug=${slug}&tenant_id=${tenantId}`}
                      className="inline-flex h-11 w-full items-center justify-center rounded-2xl px-5 text-sm font-semibold text-white transition"
                      style={{
                        background:
                          "linear-gradient(135deg, rgb(139 92 246), rgb(59 130 246))",
                      }}
                    >
                      Subir a {nextPlanLabel}
                    </Link>
                  </div>
                ) : null}
              </Notice>
            ) : !hasExcess ? (
              <Notice
                tone="success"
                title="Todavía puedes crear más sucursales."
                description="Agrega una nueva ubicación y separa agenda, servicios y reservas públicas."
              />
            ) : null}

            <div>
              <label
                className="mb-2 block text-sm font-medium"
                style={{ color: "var(--text-main)" }}
              >
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
                className="h-11 w-full rounded-2xl border px-4 text-sm outline-none transition disabled:cursor-not-allowed disabled:opacity-60"
                style={{
                  borderColor: "var(--border-color)",
                  background: "var(--bg-card)",
                  color: "var(--text-main)",
                }}
              />
            </div>

            <Notice
              tone="info"
              title="Qué desbloquea"
              description="Cada sucursal te ayuda a separar mejor tu operación."
            >
              <div className="space-y-2 text-sm" style={{ color: "var(--text-main)" }}>
                <div>✔ Agenda separada por sucursal</div>
                <div>✔ Servicios independientes por ubicación</div>
                <div>✔ Staff organizado según la sucursal</div>
                <div>✔ Reservas públicas diferenciadas</div>
              </div>
            </Notice>

            <button
              type="button"
              onClick={handleCreateBranch}
              disabled={saving || loading || reachedLimit || hasExcess}
              className="inline-flex h-11 w-full items-center justify-center rounded-2xl px-5 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-60"
              style={{
                background:
                  reachedLimit || hasExcess
                    ? "linear-gradient(135deg, rgba(100,116,139,0.9), rgba(71,85,105,0.9))"
                    : "linear-gradient(135deg, rgb(139 92 246), rgb(59 130 246))",
              }}
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
      </section>
    </div>
  );
}