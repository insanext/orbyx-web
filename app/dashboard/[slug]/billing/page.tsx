"use client";

import { CSSProperties, Suspense, useEffect, useMemo, useState } from "react";
import { apiFetch } from "@/lib/api";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { CreditCard } from "lucide-react";
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

type BillingTabId = "suscripcion" | "historial" | "ajustes";

const PLAN_LABELS: Record<string, string> = {
  pro: "Pro",
  premium: "Premium",
  vip: "VIP",
  platinum: "Platinum",
};

const SUBSCRIPTION_STATUS_LABELS: Record<string, string> = {
  pending: "Pendiente de confirmación",
  card_registered: "Tarjeta registrada",
  active: "Activa",
  canceled: "Cancelada",
  error: "Hubo un problema, contáctanos",
};

type SubscriptionCard = {
  brand: string;
  last4: string;
};

type SubscriptionStatusResponse =
  | { has_subscription: false }
  | {
      has_subscription: true;
      status: string;
      plan_id: string;
      periodicidad: string;
      monto: number | null;
      card: SubscriptionCard | null;
      flow_subscription_id: string | null;
    };

type PaymentHistoryCharge = {
  date: string | null;
  amount: number | null;
  status: string;
  flowOrder: string | number | null;
  subject: string | null;
};

function compareChargeDateDesc(a: PaymentHistoryCharge, b: PaymentHistoryCharge) {
  const aTime = a.date ? new Date(a.date).getTime() : 0;
  const bTime = b.date ? new Date(b.date).getTime() : 0;
  return bTime - aTime;
}

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

function formatCLP(value: number) {
  return `$${value.toLocaleString("es-CL")}`;
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

function ChargeList({
  charges,
  emptyMessage,
}: {
  charges: PaymentHistoryCharge[];
  emptyMessage: string;
}) {
  if (charges.length === 0) {
    return (
      <div
        className="rounded-2xl border border-dashed px-4 py-8 text-center text-sm"
        style={{
          borderColor: "var(--border-color)",
          background: "var(--bg-soft)",
          color: "var(--text-muted)",
        }}
      >
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {charges.map((charge, index) => (
        <div
          key={charge.flowOrder ?? index}
          className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border px-4 py-3 text-sm"
          style={{
            borderColor: "var(--border-color)",
            background: "var(--bg-soft)",
            color: "var(--text-main)",
          }}
        >
          <span>{formatDate(charge.date)}</span>
          <span className="font-semibold">
            {charge.amount != null ? formatCLP(charge.amount) : "—"}
          </span>
          <span style={{ color: "var(--text-muted)" }}>{charge.status}</span>
        </div>
      ))}
    </div>
  );
}

function BillingPageInner() {
  const params = useParams();
  const searchParams = useSearchParams();
  const cardStatusParam = searchParams.get("card_status");
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

      const businessRes = await apiFetch(`${BACKEND_URL}/public/business/${slug}`);
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

      const branchesRes = await apiFetch(
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
            apiFetch(
              `${BACKEND_URL}/staff?tenant_id=${currentTenantId}&branch_id=${branch.id}`
            ),
            apiFetch(
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

  const [subscriptionStatus, setSubscriptionStatus] =
    useState<SubscriptionStatusResponse | null>(null);
  const [loadingSubscription, setLoadingSubscription] = useState(true);
  const [subscriptionError, setSubscriptionError] = useState("");

  const [changingCard, setChangingCard] = useState(false);
  const [cardActionError, setCardActionError] = useState("");

  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [canceling, setCanceling] = useState(false);
  const [cancelError, setCancelError] = useState("");

  const [activeTab, setActiveTab] = useState<BillingTabId>("suscripcion");

  const billingTabs: Array<{ id: BillingTabId; label: string }> = [
    { id: "suscripcion", label: "Suscripción" },
    { id: "historial", label: "Historial de pagos" },
    { id: "ajustes", label: "Ajustes por límite de plan" },
  ];

  async function loadSubscriptionStatus(currentTenantId: string) {
    try {
      setLoadingSubscription(true);
      setSubscriptionError("");

      const res = await apiFetch(
        `${BACKEND_URL}/billing/flow/subscription-status?tenant_id=${currentTenantId}`
      );
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "No se pudo cargar el estado de la suscripción");
      }

      setSubscriptionStatus(data);
    } catch (error: unknown) {
      setSubscriptionError(
        error instanceof Error
          ? error.message
          : "No se pudo cargar el estado de la suscripción"
      );
    } finally {
      setLoadingSubscription(false);
    }
  }

  useEffect(() => {
    if (!tenantId) return;
    loadSubscriptionStatus(tenantId);
  }, [tenantId]);

  const [paymentHistory, setPaymentHistory] = useState<PaymentHistoryCharge[]>([]);
  const [loadingPaymentHistory, setLoadingPaymentHistory] = useState(true);
  const [paymentHistoryError, setPaymentHistoryError] = useState("");

  async function loadPaymentHistory(currentTenantId: string) {
    try {
      setLoadingPaymentHistory(true);
      setPaymentHistoryError("");

      const res = await apiFetch(
        `${BACKEND_URL}/billing/flow/payment-history?tenant_id=${currentTenantId}`
      );
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "No se pudo cargar el historial de pagos");
      }

      setPaymentHistory(Array.isArray(data?.charges) ? data.charges : []);
    } catch (error: unknown) {
      setPaymentHistoryError(
        error instanceof Error ? error.message : "No se pudo cargar el historial de pagos"
      );
    } finally {
      setLoadingPaymentHistory(false);
    }
  }

  useEffect(() => {
    if (!tenantId) return;
    loadPaymentHistory(tenantId);
  }, [tenantId]);

  const subscriptionCharges = useMemo(
    () =>
      paymentHistory
        .filter((charge) => !charge.subject || !charge.subject.startsWith("Add-on:"))
        .sort(compareChargeDateDesc),
    [paymentHistory]
  );

  const addonCharges = useMemo(
    () =>
      paymentHistory
        .filter((charge) => charge.subject && charge.subject.startsWith("Add-on:"))
        .sort(compareChargeDateDesc),
    [paymentHistory]
  );

  async function handleChangeCard() {
    try {
      setChangingCard(true);
      setCardActionError("");

      const res = await apiFetch(`${BACKEND_URL}/billing/flow/register-card`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tenant_id: tenantId }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "No se pudo iniciar el cambio de tarjeta");
      }

      window.location.href = data.url + "?token=" + data.token;
    } catch (error: unknown) {
      setCardActionError(
        error instanceof Error ? error.message : "No se pudo iniciar el cambio de tarjeta"
      );
      setChangingCard(false);
    }
  }

  async function handleCancelSubscription() {
    try {
      setCanceling(true);
      setCancelError("");

      const res = await apiFetch(`${BACKEND_URL}/billing/flow/cancel-subscription`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tenant_id: tenantId }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "No se pudo cancelar la suscripción");
      }

      setCancelModalOpen(false);
      await loadSubscriptionStatus(tenantId);
    } catch (error: unknown) {
      setCancelError(
        error instanceof Error ? error.message : "No se pudo cancelar la suscripción"
      );
    } finally {
      setCanceling(false);
    }
  }

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
        const response = await apiFetch(`${BACKEND_URL}/branches/${branch.id}`, {
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
        const response = await apiFetch(`${BACKEND_URL}/staff/${item.id}`, {
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
        const response = await apiFetch(`${BACKEND_URL}/services/${item.id}`, {
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
    <div className="space-y-4 pb-6">
      <section
        className="relative overflow-hidden rounded-2xl border px-5 py-4 shadow-[0_18px_46px_-28px_rgba(37,99,235,0.55),0_0_34px_-24px_rgba(56,189,248,0.48)]"
        style={{
          borderColor: "rgba(37,99,235,0.42)",
          background:
            "linear-gradient(135deg, rgba(37,99,235,0.18), rgba(14,165,233,0.08) 35%, var(--bg-card) 85%)",
        }}
      >
        <div className="pointer-events-none absolute inset-x-8 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(37,99,235,0.42),rgba(34,211,238,0.35),transparent)]" />
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex max-w-3xl items-center gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-blue-300/70 bg-[linear-gradient(135deg,rgb(37_99_235),rgb(14_165_233)_48%,rgb(79_70_229))] text-white shadow-[0_18px_32px_-16px_rgba(37,99,235,0.95),0_0_26px_-12px_rgba(56,189,248,0.85)]">
              <CreditCard className="h-5 w-5" />
            </div>
            <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-blue-600">Billing</p>

            <h1
              className="mt-0.5 text-xl font-semibold tracking-tight"
              style={{ color: "var(--text-main)" }}
            >
              Facturación y pago
            </h1>

            <p
              className="mt-0.5 max-w-2xl text-sm leading-5"
              style={{ color: "var(--text-muted)" }}
            >
              {loading
                ? "Cargando información del negocio..."
                : `Gestiona el plan y los límites de ${businessName}.`}
            </p>
            </div>
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

      <nav
        className="-mx-1 overflow-x-auto px-1"
        aria-label="Secciones de facturación y pago"
      >
        <div
          className="flex min-w-max gap-2 rounded-[20px] border p-1.5 shadow-sm backdrop-blur"
          style={{
            borderColor: "var(--border-color)",
            background: "var(--bg-card)",
          }}
        >
          {billingTabs.map((item) => {
            const active = activeTab === item.id;

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveTab(item.id)}
                aria-current={active ? "page" : undefined}
                className="cursor-pointer whitespace-nowrap rounded-2xl border px-5 py-3 text-sm font-semibold transition-all duration-200 hover:border-blue-400/40 hover:bg-[rgba(37,99,235,0.08)] focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                style={{
                  borderColor: active ? "rgba(37,99,235,0.36)" : "transparent",
                  background: active
                    ? "linear-gradient(135deg, rgba(37,99,235,0.14), rgba(14,165,233,0.07))"
                    : "transparent",
                  color: active ? "var(--text-main)" : "var(--text-muted)",
                  boxShadow: active
                    ? "inset 0 0 0 1px rgba(37,99,235,0.22)"
                    : "none",
                }}
              >
                {item.label}
              </button>
            );
          })}
        </div>
      </nav>

      {activeTab === "suscripcion" ? (
      <section className="space-y-4">
        <div>
          <p
            className="text-xs font-semibold uppercase tracking-[0.16em]"
            style={{ color: "var(--text-muted)" }}
          >
            Suscripción
          </p>
          <h2
            className="mt-1 text-lg font-semibold"
            style={{ color: "var(--text-main)" }}
          >
            Pago y suscripción
          </h2>
        </div>

        {cardStatusParam === "ok" ? (
          <Notice tone="success" title="Tarjeta actualizada correctamente." />
        ) : null}
        {cardStatusParam === "error" ? (
          <Notice
            tone="danger"
            title="No pudimos actualizar tu tarjeta."
            description="Intenta nuevamente o escríbenos a soporte@orbyx.cl."
          />
        ) : null}

        <Panel
        title="Mi suscripción"
        description="Plan, ciclo de cobro y estado de tu suscripción con Cargo Automático."
      >
        {loadingSubscription ? (
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            Cargando...
          </p>
        ) : subscriptionError ? (
          <Notice tone="danger" title={subscriptionError} />
        ) : !subscriptionStatus?.has_subscription ? (
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            Aún no tienes un medio de pago automático configurado.
          </p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <p className="text-xs uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>
                Plan
              </p>
              <p className="mt-1 text-sm font-semibold" style={{ color: "var(--text-main)" }}>
                {PLAN_LABELS[subscriptionStatus.plan_id] || subscriptionStatus.plan_id}
              </p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>
                Periodicidad
              </p>
              <p className="mt-1 text-sm font-semibold capitalize" style={{ color: "var(--text-main)" }}>
                {subscriptionStatus.periodicidad}
              </p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>
                Monto
              </p>
              <p className="mt-1 text-sm font-semibold" style={{ color: "var(--text-main)" }}>
                {subscriptionStatus.monto != null ? formatCLP(subscriptionStatus.monto) : "—"}
              </p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>
                Estado
              </p>
              <p className="mt-1 text-sm font-semibold" style={{ color: "var(--text-main)" }}>
                {SUBSCRIPTION_STATUS_LABELS[subscriptionStatus.status] || subscriptionStatus.status}
              </p>
            </div>
          </div>
        )}
      </Panel>

      {subscriptionStatus?.has_subscription && subscriptionStatus.card ? (
        <Panel
          title="Mi tarjeta"
          description="Tarjeta usada para el Cargo Automático de tu suscripción."
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm font-semibold" style={{ color: "var(--text-main)" }}>
              {subscriptionStatus.card.brand} •••• {subscriptionStatus.card.last4}
            </p>
            <button
              type="button"
              onClick={handleChangeCard}
              disabled={changingCard}
              className="inline-flex h-10 items-center justify-center rounded-xl border px-4 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-60"
              style={{
                borderColor: "var(--border-color)",
                background: "var(--bg-card)",
                color: "var(--text-main)",
              }}
            >
              {changingCard ? "Redirigiendo..." : "Cambiar tarjeta"}
            </button>
          </div>
          {cardActionError ? (
            <p className="mt-2 text-xs" style={{ color: "rgb(248 113 113)" }}>
              {cardActionError}
            </p>
          ) : null}
        </Panel>
      ) : null}

      {subscriptionStatus?.has_subscription &&
      (subscriptionStatus.status === "active" ||
        subscriptionStatus.status === "card_registered") ? (
        <Panel
          title="Cancelar suscripción"
          description="Deja de renovar tu plan automáticamente."
        >
          <button
            type="button"
            onClick={() => {
              setCancelError("");
              setCancelModalOpen(true);
            }}
            className="inline-flex h-10 items-center justify-center rounded-xl px-4 text-sm font-semibold text-white transition"
            style={{
              background: "linear-gradient(135deg, rgb(244 63 94), rgb(225 29 72))",
            }}
          >
            Cancelar suscripción
          </button>
        </Panel>
      ) : null}
      </section>
      ) : null}

      {activeTab === "historial" ? (
      <section className="space-y-4">
        <div>
          <p
            className="text-xs font-semibold uppercase tracking-[0.16em]"
            style={{ color: "var(--text-muted)" }}
          >
            Historial
          </p>
          <h2
            className="mt-1 text-lg font-semibold"
            style={{ color: "var(--text-main)" }}
          >
            Historial de pagos
          </h2>
        </div>

        <Panel
          title="Cargos de tu suscripción"
          description="Cada cobro automático de Cargo Automático quedará listado aquí."
        >
          {loadingPaymentHistory ? (
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>
              Cargando...
            </p>
          ) : paymentHistoryError ? (
            <Notice tone="danger" title={paymentHistoryError} />
          ) : (
            <ChargeList
              charges={subscriptionCharges}
              emptyMessage="Aún no tienes pagos registrados."
            />
          )}
        </Panel>

        <Panel
          title="Cargos de add-ons"
          description="Cada cobro de un add-on contratado quedará listado aquí."
        >
          {loadingPaymentHistory ? (
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>
              Cargando...
            </p>
          ) : paymentHistoryError ? (
            <Notice tone="danger" title={paymentHistoryError} />
          ) : (
            <ChargeList
              charges={addonCharges}
              emptyMessage="Aún no tienes add-ons activos."
            />
          )}
        </Panel>
      </section>
      ) : null}

      {activeTab === "ajustes" ? (
      <section className="space-y-4">
        <div>
          <p
            className="text-xs font-semibold uppercase tracking-[0.16em]"
            style={{ color: "var(--text-muted)" }}
          >
            Uso del plan
          </p>
          <h2
            className="mt-1 text-lg font-semibold"
            style={{ color: "var(--text-main)" }}
          >
            Ajustes por límite de plan
          </h2>
        </div>

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
      </section>
      ) : null}

      {cancelModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0"
            style={{ background: "rgba(0,0,0,0.6)" }}
            onClick={() => (canceling ? null : setCancelModalOpen(false))}
          />
          <div
            className="relative z-10 mx-4 w-full max-w-sm rounded-2xl border p-6 shadow-2xl"
            style={{ background: "var(--bg-card)", borderColor: "var(--border-color)" }}
          >
            <h3
              className="text-center text-lg font-semibold"
              style={{ color: "var(--text-main)" }}
            >
              Cancelar suscripción
            </h3>
            <p
              className="mt-2 text-center text-sm leading-6"
              style={{ color: "var(--text-muted)" }}
            >
              Al cancelar, tu suscripción dejará de renovarse automáticamente.
              Podrás seguir usando tu plan hasta el final del ciclo actual
              {billingCycleEnd ? ` (${formatDate(billingCycleEnd)})` : ""}.
            </p>

            {cancelError ? (
              <p className="mt-3 text-center text-xs" style={{ color: "rgb(248 113 113)" }}>
                {cancelError}
              </p>
            ) : null}

            <div className="mt-5 flex gap-3">
              <button
                type="button"
                onClick={() => setCancelModalOpen(false)}
                disabled={canceling}
                className="flex-1 inline-flex h-10 items-center justify-center rounded-xl border text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-60"
                style={{
                  borderColor: "var(--border-color)",
                  background: "var(--bg-soft)",
                  color: "var(--text-main)",
                }}
              >
                Volver
              </button>
              <button
                type="button"
                onClick={handleCancelSubscription}
                disabled={canceling}
                className="flex-1 inline-flex h-10 items-center justify-center rounded-xl text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-60"
                style={{
                  background: "linear-gradient(135deg, rgb(244 63 94), rgb(225 29 72))",
                }}
              >
                {canceling ? "Cancelando..." : "Sí, cancelar"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default function BillingPage() {
  return (
    <Suspense fallback={<div className="p-6" style={{ color: "var(--text-muted)" }}>Cargando...</div>}>
      <BillingPageInner />
    </Suspense>
  );
}
