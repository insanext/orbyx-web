"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
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
  const [selectedServicesToKeep, setSelectedServicesToKeep] = useState<string[]>([]);
  const [selectedBranchesToKeep, setSelectedBranchesToKeep] = useState<string[]>([]);

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
    <div className="space-y-6 rounded-[28px] bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.10),_transparent_28%),radial-gradient(circle_at_top_right,_rgba(139,92,246,0.12),_transparent_30%),linear-gradient(180deg,_#0f172a_0%,_#111827_42%,_#0b1120_100%)] p-4 sm:p-6">
      <PageHeader
        eyebrow="Billing"
        title={loading ? "Cargando ajustes..." : "Ajustar plan"}
        description={
          loading
            ? "Cargando información del negocio..."
            : `Centraliza aquí los ajustes del plan de ${businessName}.`
        }
        actions={
          <div className="flex flex-wrap gap-3">
            <Link
              href={`/planes?current_plan=${plan}&from=billing&slug=${slug}&tenant_id=${tenantId}`}
              className="inline-flex h-11 items-center justify-center rounded-2xl border border-white/15 bg-white/10 px-5 text-sm font-medium text-white backdrop-blur-sm transition hover:bg-white/15"
            >
              Ver planes
            </Link>

            <button
              type="button"
              onClick={() => loadAll()}
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
            label="Plan actual"
            value={loading ? "..." : planLabel}
            helper="Plan activo del negocio."
          />
        </div>

        <div className="[&>div]:border-white/10 [&>div]:bg-white/10 [&>div]:text-white [&>div]:shadow-xl [&>div]:backdrop-blur-md [&_p]:text-slate-300 [&_span]:text-slate-300">
          <StatCard
            label="Próxima renovación"
            value={loading ? "..." : formatDate(billingCycleEnd)}
            helper={loading ? "..." : `Te quedan ${formatRemainingDays(billingCycleEnd)}`}
          />
        </div>

        <div className="[&>div]:border-white/10 [&>div]:bg-white/10 [&>div]:text-white [&>div]:shadow-xl [&>div]:backdrop-blur-md [&_p]:text-slate-300 [&_span]:text-slate-300">
          <StatCard
            label="Cambio programado"
            value={loading ? "..." : scheduledPlanLabel || "Sin cambio"}
            helper={
              loading
                ? "..."
                : scheduledPlanLabel
                ? `${pendingChangeType || "change"} · ${formatDate(
                    scheduledChangeAt
                  )}`
                : "No hay downgrade programado"
            }
          />
        </div>

        <div className="[&>div]:border-white/10 [&>div]:bg-white/10 [&>div]:text-white [&>div]:shadow-xl [&>div]:backdrop-blur-md [&_p]:text-slate-300 [&_span]:text-slate-300">
          <StatCard
            label="Problemas detectados"
            value={loading ? "..." : hasAnyExcess ? "Sí" : "No"}
            helper={
              loading
                ? "..."
                : hasAnyExcess
                ? "Debes ajustar antes del próximo ciclo."
                : "Todo está dentro del límite del plan."
            }
          />
        </div>
      </section>

{hasAnyExcess ? (
  <div
    className={`rounded-3xl p-5 text-sm shadow-[0_20px_60px_rgba(15,23,42,0.35)] backdrop-blur-xl ${
      isUrgentAdjustment
        ? "border border-rose-400/30 bg-rose-500/12 text-rose-100"
        : "border border-amber-400/25 bg-amber-500/10 text-amber-100"
    }`}
  >
    <p className="text-base font-semibold text-white">
      Tu negocio está sobre el límite del plan
    </p>

    <p className="mt-2 text-sm text-slate-300">
      Selecciona qué elementos quieres conservar. Los no seleccionados serán desactivados automáticamente.
    </p>

    <div className="mt-3 space-y-2">
            {hasBranchExcess ? (
              <div>• Sucursales en exceso: {excessBranches}</div>
            ) : null}
            {hasStaffExcess ? (
              <div>• Staff en exceso: {excessStaff}</div>
            ) : null}
            {hasServicesExcess ? (
              <div>• Servicios en exceso: {excessServices}</div>
            ) : null}
          </div>

          <div
            className={`mt-4 rounded-2xl px-4 py-3 text-sm ${
              isUrgentAdjustment
                ? "border border-rose-300/30 bg-rose-500/12 text-rose-50"
                : "border border-amber-300/20 bg-amber-500/10 text-amber-50"
            }`}
          >
            {isUrgentAdjustment ? (
              <>
                Te quedan <span className="font-semibold">{remainingDaysNumber}</span>{" "}
                días para ajustar staff, servicios y sucursales antes del cambio
                de plan. Si no lo haces a tiempo, el sistema deberá aplicar el
                downgrade con bloqueo automático de excedentes.
              </>
            ) : (
              <>
                Ajusta estos elementos antes del{" "}
                <span className="font-semibold">
                  {formatDate(scheduledChangeAt || billingCycleEnd)}
                </span>{" "}
                para que el downgrade se aplique sin problemas.
              </>
            )}
          </div>

          <button
            type="button"
            onClick={applyFullAdjustment}
            disabled={saving}
            className={`mt-4 inline-flex h-11 items-center justify-center rounded-2xl px-5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${
              isUrgentAdjustment
                ? "bg-rose-500 text-white hover:bg-rose-400"
                : "bg-amber-500 text-slate-950 hover:bg-amber-400"
            }`}
          >
            {saving ? "Aplicando ajuste..." : "Aplicar ajuste completo"}
          </button>
        </div>
      ) : (
        <div className="rounded-3xl border border-emerald-400/20 bg-emerald-500/10 p-5 text-sm text-emerald-100 shadow-[0_20px_60px_rgba(15,23,42,0.35)] backdrop-blur-xl">
          Todo está dentro del límite de tu plan actual.
        </div>
      )}

      <section className="grid gap-6 xl:grid-cols-3">
        <div className="[&>div]:border-white/10 [&>div]:bg-white/10 [&>div]:text-white [&>div]:shadow-[0_20px_60px_rgba(15,23,42,0.35)] [&>div]:backdrop-blur-xl">
<Panel
  title="Sucursales"
  description={`Selecciona las sucursales que deseas MANTENER activas (${activeBranches.length} / ${caps.max_branches})`}
>
            {activeBranches.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-white/15 bg-white/5 px-4 py-6 text-sm text-slate-300">
                No hay sucursales activas.
              </div>
            ) : (
              <div className="space-y-3">
                {activeBranches.map((branch) => (
                  <label
                    key={branch.id}
                    className={`flex items-center gap-3 rounded-2xl border px-4 py-3 text-sm ${
  hasBranchExcess
    ? selectedBranchesToKeep.includes(branch.id)
      ? "border-emerald-500/60 bg-emerald-700/35 text-white"
      : "border-rose-600/60 bg-rose-800/35 text-white"
    : "border-white/15 bg-slate-900/40 text-white"
}`}
                  >
                    <input
                      type="checkbox"
                      checked={
                        !hasBranchExcess || selectedBranchesToKeep.includes(branch.id)
                      }
                      onChange={() => toggleBranchSelection(branch.id)}
                      disabled={!hasBranchExcess}
                      className="h-4 w-4 rounded border-slate-300"
                    />
                    <span className="font-semibold tracking-tight text-white">
  {branch.name}
</span>
                  </label>
                ))}
              </div>
            )}
          </Panel>
        </div>

        <div className="[&>div]:border-white/10 [&>div]:bg-white/10 [&>div]:text-white [&>div]:shadow-[0_20px_60px_rgba(15,23,42,0.35)] [&>div]:backdrop-blur-xl">
          <Panel
            title="Profesionales"
description={`Selecciona los profesionales que deseas MANTENER activos (${activeStaff.length} / ${caps.max_staff})`}
          >
            {activeStaff.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-white/15 bg-white/5 px-4 py-6 text-sm text-slate-300">
                No hay staff activo.
              </div>
            ) : (
              <div className="space-y-3">
                {activeStaff.map((item) => (
                  <label
                    key={item.id}
                    className={`flex items-center gap-3 rounded-2xl border px-4 py-3 text-sm ${
                      hasStaffExcess
                        ? selectedStaffToKeep.includes(item.id)
                          ? "border-emerald-300/35 bg-emerald-500/18 text-white"
                          : "border-rose-300/35 bg-rose-500/18 text-white"
                        : "border-white/15 bg-slate-900/40 text-white"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={
                        !hasStaffExcess || selectedStaffToKeep.includes(item.id)
                      }
                      onChange={() => toggleStaffSelection(item.id)}
                      disabled={!hasStaffExcess}
                      className="h-4 w-4 rounded border-slate-300"
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
        </div>

        <div className="[&>div]:border-white/10 [&>div]:bg-white/10 [&>div]:text-white [&>div]:shadow-[0_20px_60px_rgba(15,23,42,0.35)] [&>div]:backdrop-blur-xl">
          <Panel
            title="Servicios"
description={`Selecciona los servicios que deseas MANTENER activos (${activeServices.length} / ${caps.max_services})`}
          >
            {activeServices.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-white/15 bg-white/5 px-4 py-6 text-sm text-slate-300">
                No hay servicios activos.
              </div>
            ) : (
              <div className="space-y-3">
                {activeServices.map((item) => (
                  <label
                    key={item.id}
                    className={`flex items-center gap-3 rounded-2xl border px-4 py-3 text-sm ${
                      hasServicesExcess
                        ? selectedServicesToKeep.includes(item.id)
                          ? "border-emerald-300/35 bg-emerald-500/18 text-white"
                          : "border-rose-300/35 bg-rose-500/18 text-white"
                        : "border-white/15 bg-slate-900/40 text-white"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={
                        !hasServicesExcess ||
                        selectedServicesToKeep.includes(item.id)
                      }
                      onChange={() => toggleServiceSelection(item.id)}
                      disabled={!hasServicesExcess}
                      className="h-4 w-4 rounded border-slate-300"
                    />
                    <span className="font-medium">{item.name}</span>
                  </label>
                ))}
              </div>
            )}
          </Panel>
        </div>
      </section>
    </div>
  );
}