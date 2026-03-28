"use client";

import { CSSProperties, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Panel } from "../../../../components/dashboard/panel";

const BACKEND_URL = "https://orbyx-backend.onrender.com";

type BusinessResponse = {
  business: {
    id: string;
    name: string;
    slug: string;
    plan_slug?: string | null;
    billing_cycle_start?: string | null;
    billing_cycle_end?: string | null;
    scheduled_plan_slug?: string | null;
    scheduled_change_at?: string | null;
    pending_change_type?: string | null;
  };
  calendar_id?: string;
};

type BranchItem = {
  id: string;
  tenant_id?: string;
  name: string;
  is_active?: boolean;
  created_at?: string;
};

type StaffItem = {
  id: string;
  tenant_id: string;
  branch_id?: string | null;
  name: string;
  role?: string | null;
  email?: string | null;
  phone?: string | null;
  color?: string | null;
  is_active: boolean;
  sort_order: number;
};

type ServiceItem = {
  id: string;
  tenant_id?: string;
  branch_id?: string | null;
  name: string;
  description?: string | null;
  duration_minutes?: number;
  price?: number | null;
  active: boolean;
};

type NoticeTone =
  | "info"
  | "success"
  | "warning"
  | "limit"
  | "danger"
  | "neutral";

const PLAN_LABELS: Record<string, string> = {
  pro: "Pro",
  premium: "Premium",
  vip: "VIP",
  platinum: "Platinum",
};

const PLAN_CAPS: Record<
  string,
  { max_staff: number; max_services: number; max_branches: number }
> = {
  pro: { max_staff: 2, max_services: 10, max_branches: 1 },
  premium: { max_staff: 5, max_services: 25, max_branches: 2 },
  vip: { max_staff: 10, max_services: 50, max_branches: 3 },
  platinum: { max_staff: 20, max_services: 100, max_branches: 10 },
};

function normalizePlanSlug(planSlug?: string | null) {
  const normalized = String(planSlug || "pro").toLowerCase();

  if (normalized === "starter") return "pro";
  if (normalized in PLAN_CAPS) return normalized;

  return "pro";
}

function formatDate(dateString?: string | null) {
  if (!dateString) return "—";

  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleDateString("es-CL", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function formatRemainingDays(endDate?: string | null) {
  if (!endDate) return "—";

  const end = new Date(endDate);
  if (Number.isNaN(end.getTime())) return "—";

  const now = new Date();
  const diffMs = end.getTime() - now.getTime();
  const diffDays = Math.max(0, diffMs / (1000 * 60 * 60 * 24));

  return `${Math.ceil(diffDays)} días`;
}

function getRemainingDaysNumber(endDate?: string | null) {
  if (!endDate) return null;

  const end = new Date(endDate);
  if (Number.isNaN(end.getTime())) return null;

  const now = new Date();
  const diffMs = end.getTime() - now.getTime();
  const diffDays = Math.max(0, diffMs / (1000 * 60 * 60 * 24));

  return Math.ceil(diffDays);
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

export default function BillingPage() {
  const params = useParams();
  const slug =
    ((params as { slug?: string })?.slug as string) ||
    ((params as { Slug?: string })?.Slug as string) ||
    "";

  const [tenantId, setTenantId] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [plan, setPlan] = useState("pro");
  const [billingCycleEnd, setBillingCycleEnd] = useState<string | null>(null);
  const [scheduledPlanSlug, setScheduledPlanSlug] = useState<string | null>(null);
  const [scheduledChangeAt, setScheduledChangeAt] = useState<string | null>(null);
  const [pendingChangeType, setPendingChangeType] = useState<string | null>(null);

  const [branches, setBranches] = useState<BranchItem[]>([]);
  const [staff, setStaff] = useState<StaffItem[]>([]);
  const [services, setServices] = useState<ServiceItem[]>([]);

  const [selectedStaffToKeep, setSelectedStaffToKeep] = useState<string[]>([]);
  const [selectedServicesToKeep, setSelectedServicesToKeep] = useState<string[]>(
    []
  );
  const [selectedBranchesToKeep, setSelectedBranchesToKeep] = useState<string[]>(
    []
  );

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [saveError, setSaveError] = useState("");
  const [saveOk, setSaveOk] = useState("");

  const caps = PLAN_CAPS[plan] || PLAN_CAPS.pro;

  const activeBranches = useMemo(
    () => branches.filter((branch) => branch.is_active !== false),
    [branches]
  );

  const activeStaff = useMemo(
    () => staff.filter((item) => item.is_active),
    [staff]
  );

  const activeServices = useMemo(
    () => services.filter((item) => item.active),
    [services]
  );

  const excessBranches = Math.max(0, activeBranches.length - caps.max_branches);
  const excessStaff = Math.max(0, activeStaff.length - caps.max_staff);
  const excessServices = Math.max(0, activeServices.length - caps.max_services);

  const hasBranchExcess = excessBranches > 0;
  const hasStaffExcess = excessStaff > 0;
  const hasServicesExcess = excessServices > 0;

  const hasAnyExcess = hasBranchExcess || hasStaffExcess || hasServicesExcess;

  useEffect(() => {
    if (!hasBranchExcess) {
      setSelectedBranchesToKeep([]);
      return;
    }

    const allowed = activeBranches.slice(0, caps.max_branches).map((b) => b.id);
    setSelectedBranchesToKeep(allowed);
  }, [hasBranchExcess, activeBranches, caps.max_branches]);

  useEffect(() => {
    if (!hasStaffExcess) {
      setSelectedStaffToKeep([]);
      return;
    }

    const allowed = activeStaff.slice(0, caps.max_staff).map((s) => s.id);
    setSelectedStaffToKeep(allowed);
  }, [hasStaffExcess, activeStaff, caps.max_staff]);

  useEffect(() => {
    if (!hasServicesExcess) {
      setSelectedServicesToKeep([]);
      return;
    }

    const allowed = activeServices.slice(0, caps.max_services).map((s) => s.id);
    setSelectedServicesToKeep(allowed);
  }, [hasServicesExcess, activeServices, caps.max_services]);

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
      const currentPlan = normalizePlanSlug(businessData.business.plan_slug);
      const nextScheduledPlan = businessData.business.scheduled_plan_slug
        ? normalizePlanSlug(businessData.business.scheduled_plan_slug)
        : null;

      setTenantId(currentTenantId);
      setBusinessName(businessData.business.name || slug);
      setPlan(currentPlan);
      setBillingCycleEnd(businessData.business.billing_cycle_end || null);
      setScheduledPlanSlug(nextScheduledPlan);
      setScheduledChangeAt(businessData.business.scheduled_change_at || null);
      setPendingChangeType(businessData.business.pending_change_type || null);

      const branchesRes = await fetch(
        `${BACKEND_URL}/branches?tenant_id=${currentTenantId}`
      );
      const branchesData = await branchesRes.json();

      if (!branchesRes.ok) {
        throw new Error(
          branchesData?.error || "No se pudieron cargar las sucursales"
        );
      }

      const branchRows: BranchItem[] = Array.isArray(branchesData?.branches)
        ? branchesData.branches
        : [];

      setBranches(branchRows);

      const activeBranchRows = branchRows.filter(
        (branch) => branch.is_active !== false
      );

      const perBranchResponses = await Promise.all(
        activeBranchRows.map(async (branch) => {
          const [staffRes, servicesRes] = await Promise.all([
            fetch(
              `${BACKEND_URL}/staff?tenant_id=${currentTenantId}&branch_id=${branch.id}`
            ),
            fetch(
              `${BACKEND_URL}/services?tenant_id=${currentTenantId}&branch_id=${branch.id}`
            ),
          ]);

          const staffData = await staffRes.json();
          const servicesData = await servicesRes.json();

          if (!staffRes.ok) {
            throw new Error(
              staffData?.error ||
                `No se pudo cargar el staff de la sucursal ${branch.name}`
            );
          }

          if (!servicesRes.ok) {
            throw new Error(
              servicesData?.error ||
                `No se pudieron cargar los servicios de la sucursal ${branch.name}`
            );
          }

          const branchStaff: StaffItem[] = Array.isArray(staffData?.staff)
            ? staffData.staff
            : [];

          const branchServices: ServiceItem[] = Array.isArray(servicesData?.services)
            ? servicesData.services
            : [];

          return {
            staff: branchStaff.map((item) => ({
              ...item,
              branch_id: branch.id,
            })),
            services: branchServices.map((item) => ({
              ...item,
              branch_id: branch.id,
            })),
          };
        })
      );

      const allStaff = perBranchResponses.flatMap((item) => item.staff);
      const allServices = perBranchResponses.flatMap((item) => item.services);

      setStaff(allStaff);
      setServices(allServices);
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

  function toggleBranchSelection(branchId: string) {
    setSelectedBranchesToKeep((prev) =>
      prev.includes(branchId)
        ? prev.filter((id) => id !== branchId)
        : [...prev, branchId]
    );
  }

  function toggleStaffSelection(staffId: string) {
    setSelectedStaffToKeep((prev) =>
      prev.includes(staffId)
        ? prev.filter((id) => id !== staffId)
        : [...prev, staffId]
    );
  }

  function toggleServiceSelection(serviceId: string) {
    setSelectedServicesToKeep((prev) =>
      prev.includes(serviceId)
        ? prev.filter((id) => id !== serviceId)
        : [...prev, serviceId]
    );
  }

  async function applyFullAdjustment() {
    try {
      setSaving(true);
      setSaveError("");
      setSaveOk("");

      const branchesToDeactivate = hasBranchExcess
        ? activeBranches.filter(
            (branch) => !selectedBranchesToKeep.includes(branch.id)
          )
        : [];

      const staffToDeactivate = hasStaffExcess
        ? activeStaff.filter((item) => !selectedStaffToKeep.includes(item.id))
        : [];

      const servicesToDeactivate = hasServicesExcess
        ? activeServices.filter(
            (item) => !selectedServicesToKeep.includes(item.id)
          )
        : [];

      if (
        branchesToDeactivate.length === 0 &&
        staffToDeactivate.length === 0 &&
        servicesToDeactivate.length === 0
      ) {
        throw new Error("No hay elementos para ajustar");
      }

      const confirmed = window.confirm(
        `Se aplicará este ajuste:\n` +
          `- Sucursales a desactivar: ${branchesToDeactivate.length}\n` +
          `- Staff a desactivar: ${staffToDeactivate.length}\n` +
          `- Servicios a desactivar: ${servicesToDeactivate.length}\n\n` +
          `¿Continuar?`
      );

      if (!confirmed) return;

      for (const branch of branchesToDeactivate) {
        const response = await fetch(`${BACKEND_URL}/branches/${branch.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
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

      for (const item of staffToDeactivate) {
        const response = await fetch(`${BACKEND_URL}/staff/${item.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            tenant_id: tenantId,
            branch_id: item.branch_id,
            is_active: false,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data?.error || `No se pudo desactivar el staff ${item.name}`
          );
        }
      }

      for (const item of servicesToDeactivate) {
        const response = await fetch(`${BACKEND_URL}/services/${item.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            tenant_id: tenantId,
            branch_id: item.branch_id,
            active: false,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data?.error || `No se pudo desactivar el servicio ${item.name}`
          );
        }
      }

      setSaveOk("Ajuste aplicado correctamente.");
      await loadAll();
    } catch (error: unknown) {
      setSaveError(
        error instanceof Error ? error.message : "No se pudo aplicar el ajuste"
      );
    } finally {
      setSaving(false);
    }
  }

  const planLabel = PLAN_LABELS[plan] || "Pro";
  const scheduledPlanLabel = scheduledPlanSlug
    ? PLAN_LABELS[scheduledPlanSlug] || scheduledPlanSlug
    : null;

  const remainingDaysNumber = getRemainingDaysNumber(
    scheduledChangeAt || billingCycleEnd
  );

  const isUrgentAdjustment =
    hasAnyExcess &&
    pendingChangeType === "downgrade" &&
    remainingDaysNumber !== null &&
    remainingDaysNumber <= 2;

  return (
    <div className="space-y-6 pb-6">
      <section
        className="overflow-hidden rounded-[30px] border p-6 shadow-sm"
        style={{
          borderColor: "rgba(34,197,94,0.25)",
          background:
            "linear-gradient(135deg, rgba(34,197,94,0.12), rgba(16,185,129,0.06) 35%, var(--bg-card) 85%)",
        }}
      >
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <p
              className="mb-2 text-xs font-semibold uppercase tracking-[0.22em]"
              style={{ color: "var(--text-muted)" }}
            >
              Billing
            </p>

            <h1
              className="text-3xl font-semibold tracking-tight sm:text-4xl"
              style={{ color: "var(--text-main)" }}
            >
              Ajustar plan
            </h1>

            <p
              className="mt-3 max-w-2xl text-sm leading-6 sm:text-[15px]"
              style={{ color: "var(--text-muted)" }}
            >
              {loading
                ? "Cargando información del negocio..."
                : `Gestiona el plan y los límites de ${businessName}.`}
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <div
              className="rounded-2xl border px-4 py-3"
              style={{
                borderColor: "rgba(34,197,94,0.22)",
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
                {loading ? "..." : planLabel}
              </p>
            </div>

            <div
              className="rounded-2xl border px-4 py-3"
              style={{
                borderColor: "rgba(34,197,94,0.22)",
                background: "rgba(255,255,255,0.08)",
              }}
            >
              <p
                className="text-[11px] font-semibold uppercase tracking-[0.16em]"
                style={{ color: "var(--text-muted)" }}
              >
                Próxima renovación
              </p>
              <p
                className="mt-2 text-sm font-semibold"
                style={{ color: "var(--text-main)" }}
              >
                {loading ? "..." : formatDate(billingCycleEnd)}
              </p>
            </div>

            <div
              className="rounded-2xl border px-4 py-3"
              style={{
                borderColor: "rgba(34,197,94,0.22)",
                background: "rgba(255,255,255,0.08)",
              }}
            >
              <p
                className="text-[11px] font-semibold uppercase tracking-[0.16em]"
                style={{ color: "var(--text-muted)" }}
              >
                Cambio programado
              </p>
              <p
                className="mt-2 text-sm font-semibold"
                style={{ color: "var(--text-main)" }}
              >
                {loading ? "..." : scheduledPlanLabel || "Sin cambio"}
              </p>
            </div>

            <div
              className="rounded-2xl border px-4 py-3"
              style={{
                borderColor: "rgba(34,197,94,0.22)",
                background: "rgba(255,255,255,0.08)",
              }}
            >
              <p
                className="text-[11px] font-semibold uppercase tracking-[0.16em]"
                style={{ color: "var(--text-muted)" }}
              >
                Problemas detectados
              </p>
              <p
                className="mt-2 text-sm font-semibold"
                style={{ color: "var(--text-main)" }}
              >
                {loading ? "..." : hasAnyExcess ? "Sí" : "No"}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <Link
            href={`/planes?current_plan=${plan}&from=billing&slug=${slug}&tenant_id=${tenantId}`}
            className="inline-flex h-10 items-center justify-center rounded-xl border px-4 text-sm font-medium transition"
            style={{
              borderColor: "var(--border-color)",
              background: "var(--bg-card)",
              color: "var(--text-main)",
            }}
          >
            Ver planes
          </Link>

          <button
            type="button"
            onClick={() => loadAll()}
            className="inline-flex h-10 items-center justify-center rounded-xl px-4 text-sm font-semibold text-white transition"
            style={{
              background:
                "linear-gradient(135deg, rgb(34 197 94), rgb(16 185 129))",
            }}
          >
            Recargar
          </button>
        </div>
      </section>

      {loadError ? <Notice tone="danger" title={loadError} /> : null}
      {saveError ? <Notice tone="danger" title={saveError} /> : null}
      {saveOk ? <Notice tone="success" title={saveOk} /> : null}

      {hasAnyExcess ? (
        <Notice
          tone={isUrgentAdjustment ? "danger" : "limit"}
          title="Tu negocio está sobre el límite del plan."
          description="Selecciona qué elementos quieres conservar. Los no seleccionados serán desactivados automáticamente."
        >
          <div className="space-y-1 text-sm" style={{ color: "var(--text-main)" }}>
            {hasBranchExcess ? <div>• Sucursales en exceso: {excessBranches}</div> : null}
            {hasStaffExcess ? <div>• Staff en exceso: {excessStaff}</div> : null}
            {hasServicesExcess ? <div>• Servicios en exceso: {excessServices}</div> : null}
          </div>

          <div className="mt-4">
            <Notice
              tone={isUrgentAdjustment ? "danger" : "warning"}
              title={
                isUrgentAdjustment
                  ? `Te quedan ${remainingDaysNumber} días para ajustar.`
                  : "Ajusta estos elementos antes del próximo cambio."
              }
              description={
                isUrgentAdjustment
                  ? "Si no lo haces a tiempo, el sistema deberá aplicar el downgrade con bloqueo automático de excedentes."
                  : `Ajusta antes del ${formatDate(
                      scheduledChangeAt || billingCycleEnd
                    )} para que el downgrade se aplique sin problemas.`
              }
            />
          </div>

          <button
            type="button"
            onClick={applyFullAdjustment}
            disabled={saving}
            className="mt-4 inline-flex h-11 items-center justify-center rounded-2xl px-5 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-60"
            style={{
              background: isUrgentAdjustment
                ? "linear-gradient(135deg, rgb(244 63 94), rgb(225 29 72))"
                : "linear-gradient(135deg, rgb(249 115 22), rgb(251 146 60))",
            }}
          >
            {saving ? "Aplicando ajuste..." : "Aplicar ajuste completo"}
          </button>
        </Notice>
      ) : (
        <Notice
          tone="success"
          title="Todo está dentro del límite de tu plan actual."
          description="No necesitas hacer ajustes por ahora."
        />
      )}

      <section className="grid gap-6 xl:grid-cols-3">
        <Panel
          title="Sucursales"
          description={`Selecciona las sucursales que deseas mantener activas (${activeBranches.length} / ${caps.max_branches})`}
          className="bg-[linear-gradient(180deg,rgba(37,99,235,0.08),transparent_35%)]"
        >
          {activeBranches.length === 0 ? (
            <div
              className="rounded-2xl border border-dashed px-4 py-6 text-sm"
              style={{
                borderColor: "var(--border-color)",
                background: "var(--bg-soft)",
                color: "var(--text-muted)",
              }}
            >
              No hay sucursales activas.
            </div>
          ) : (
            <div className="space-y-3">
              {activeBranches.map((branch) => (
                <label
                  key={branch.id}
                  className="flex items-center gap-3 rounded-2xl border px-4 py-3 text-sm"
                  style={{
                    borderColor: hasBranchExcess
                      ? selectedBranchesToKeep.includes(branch.id)
                        ? "rgba(16,185,129,0.34)"
                        : "rgba(244,63,94,0.34)"
                      : "var(--border-color)",
                    background: hasBranchExcess
                      ? selectedBranchesToKeep.includes(branch.id)
                        ? "rgba(16,185,129,0.10)"
                        : "rgba(244,63,94,0.10)"
                      : "var(--bg-soft)",
                    color: "var(--text-main)",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={
                      !hasBranchExcess || selectedBranchesToKeep.includes(branch.id)
                    }
                    onChange={() => toggleBranchSelection(branch.id)}
                    disabled={!hasBranchExcess}
                    className="h-4 w-4 rounded"
                  />
                  <span className="font-semibold">{branch.name}</span>
                </label>
              ))}
            </div>
          )}
        </Panel>

        <Panel
          title="Profesionales"
          description={`Selecciona los profesionales que deseas mantener activos (${activeStaff.length} / ${caps.max_staff})`}
          className="bg-[linear-gradient(180deg,rgba(14,165,233,0.06),transparent_40%)]"
        >
          {activeStaff.length === 0 ? (
            <div
              className="rounded-2xl border border-dashed px-4 py-6 text-sm"
              style={{
                borderColor: "var(--border-color)",
                background: "var(--bg-soft)",
                color: "var(--text-muted)",
              }}
            >
              No hay staff activo.
            </div>
          ) : (
            <div className="space-y-3">
              {activeStaff.map((item) => (
                <label
                  key={item.id}
                  className="flex items-center gap-3 rounded-2xl border px-4 py-3 text-sm"
                  style={{
                    borderColor: hasStaffExcess
                      ? selectedStaffToKeep.includes(item.id)
                        ? "rgba(16,185,129,0.34)"
                        : "rgba(244,63,94,0.34)"
                      : "var(--border-color)",
                    background: hasStaffExcess
                      ? selectedStaffToKeep.includes(item.id)
                        ? "rgba(16,185,129,0.10)"
                        : "rgba(244,63,94,0.10)"
                      : "var(--bg-soft)",
                    color: "var(--text-main)",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={
                      !hasStaffExcess || selectedStaffToKeep.includes(item.id)
                    }
                    onChange={() => toggleStaffSelection(item.id)}
                    disabled={!hasStaffExcess}
                    className="h-4 w-4 rounded"
                  />
                  <span className="font-medium">
                    {item.name}
                    {item.role ? ` · ${item.role}` : ""}
                  </span>
                </label>
              ))}
            </div>
          )}
        </Panel>

        <Panel
          title="Servicios"
          description={`Selecciona los servicios que deseas mantener activos (${activeServices.length} / ${caps.max_services})`}
          className="bg-[linear-gradient(180deg,rgba(34,197,94,0.06),transparent_40%)]"
        >
          {activeServices.length === 0 ? (
            <div
              className="rounded-2xl border border-dashed px-4 py-6 text-sm"
              style={{
                borderColor: "var(--border-color)",
                background: "var(--bg-soft)",
                color: "var(--text-muted)",
              }}
            >
              No hay servicios activos.
            </div>
          ) : (
            <div className="space-y-3">
              {activeServices.map((item) => (
                <label
                  key={item.id}
                  className="flex items-center gap-3 rounded-2xl border px-4 py-3 text-sm"
                  style={{
                    borderColor: hasServicesExcess
                      ? selectedServicesToKeep.includes(item.id)
                        ? "rgba(16,185,129,0.34)"
                        : "rgba(244,63,94,0.34)"
                      : "var(--border-color)",
                    background: hasServicesExcess
                      ? selectedServicesToKeep.includes(item.id)
                        ? "rgba(16,185,129,0.10)"
                        : "rgba(244,63,94,0.10)"
                      : "var(--bg-soft)",
                    color: "var(--text-main)",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={
                      !hasServicesExcess ||
                      selectedServicesToKeep.includes(item.id)
                    }
                    onChange={() => toggleServiceSelection(item.id)}
                    disabled={!hasServicesExcess}
                    className="h-4 w-4 rounded"
                  />
                  <span className="font-medium">{item.name}</span>
                </label>
              ))}
            </div>
          )}
        </Panel>
      </section>
    </div>
  );
}