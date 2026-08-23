"use client";

import { CSSProperties, Suspense, useEffect, useMemo, useRef, useState } from "react";
import { apiFetch } from "@/lib/api";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { ChevronRight, CreditCard } from "lucide-react";
import { Panel } from "../../../../components/dashboard/panel";
import { AddonManager } from "../../../../components/addons/AddonManager";
import { cycleTotalPrice, getPlanLabel, PLAN_PRICES_ALL, type PlanSlug } from "@/lib/plans";

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

type BillingTabId = "suscripcion" | "addons" | "historial" | "ajustes";

const SUBSCRIPTION_STATUS_LABELS: Record<string, string> = {
  pending: "Pendiente de confirmación",
  card_registered: "Tarjeta registrada",
  trialing: "En trial — primer cobro programado al terminar",
  active: "Activa",
  canceled: "No suscrito",
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

// Mismos nombres que orbyx-web/components/addons/AddonManager.tsx
// (extraConfig[key].title) — duplicado a propósito, solo para traducir el
// addon_key crudo del campo `subject` a texto legible acá.
const ADDON_LABELS: Record<string, string> = {
  wa_confirmacion: "WhatsApp confirmación+recordatorio",
  campanas_wa: "Campañas WhatsApp",
  emails_campana: "Pack emails campaña",
  staff: "+ 1 Profesional",
  sucursal: "+ 1 Sucursal",
  group_capacity: "+ Cupos grupales",
};

// El backend genera subject = "Add-on: {addon_key} x{qty}" al activar/subir
// cantidad, o "Add-on recurrente: {addon_key} x{qty}" desde el cron de
// renovación automática mensual (server.js).
const ADDON_SUBJECT_RE = /^Add-on(?: recurrente)?:\s*([a-z_]+)\s*x(\d+)$/i;

function describeAddonChargeSubject(subject: string | null) {
  if (!subject) return "Add-on";

  const match = subject.match(ADDON_SUBJECT_RE);
  if (!match) return subject;

  const [, addonKey, qty] = match;
  const label = ADDON_LABELS[addonKey] || addonKey;
  const isRecurring = subject.startsWith("Add-on recurrente");

  return `${label} x${qty}${isRecurring ? " · renovación automática" : ""}`;
}

function describeSubscriptionChargeSubject(subject: string | null) {
  return subject && subject.trim() ? subject : "Cobro de suscripción";
}

type ChargeGroup = {
  dateKey: string;
  label: string;
  total: number;
  charges: PaymentHistoryCharge[];
};

function getChargeDateKey(dateString: string | null) {
  if (!dateString) return "sin-fecha";

  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return "sin-fecha";

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

// Agrupa cargos por día calendario (misma fecha visible con formatDate),
// preservando orden descendente. El total de cada grupo suma los montos
// de todos los cargos de ese día.
function groupChargesByDate(charges: PaymentHistoryCharge[]): ChargeGroup[] {
  const groups = new Map<string, ChargeGroup>();

  for (const charge of charges) {
    const dateKey = getChargeDateKey(charge.date);
    const existing = groups.get(dateKey);

    if (existing) {
      existing.total += charge.amount ?? 0;
      existing.charges.push(charge);
    } else {
      groups.set(dateKey, {
        dateKey,
        label: formatDate(charge.date),
        total: charge.amount ?? 0,
        charges: [charge],
      });
    }
  }

  return Array.from(groups.values()).sort((a, b) =>
    a.dateKey < b.dateKey ? 1 : a.dateKey > b.dateKey ? -1 : 0
  );
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

const CHARGE_GROUPS_PAGE_SIZE = 6;

function GroupedChargeList({
  charges,
  emptyMessage,
  describeCharge,
}: {
  charges: PaymentHistoryCharge[];
  emptyMessage: string;
  describeCharge: (charge: PaymentHistoryCharge) => string;
}) {
  const groups = useMemo(() => groupChargesByDate(charges), [charges]);
  const [expandedKeys, setExpandedKeys] = useState<Set<string>>(new Set());
  const [visibleCount, setVisibleCount] = useState(CHARGE_GROUPS_PAGE_SIZE);

  if (groups.length === 0) {
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

  const visibleGroups = groups.slice(0, visibleCount);
  const hasMore = groups.length > visibleCount;

  function toggleGroup(key: string) {
    setExpandedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  return (
    <div className="space-y-3">
      {visibleGroups.map((group) => {
        const isExpanded = expandedKeys.has(group.dateKey);

        return (
          <div
            key={group.dateKey}
            className="overflow-hidden rounded-2xl border"
            style={{ borderColor: "var(--border-color)", background: "var(--bg-soft)" }}
          >
            <button
              type="button"
              onClick={() => toggleGroup(group.dateKey)}
              className="flex w-full flex-wrap items-center justify-between gap-3 px-4 py-3 text-left text-sm transition"
              style={{ color: "var(--text-main)" }}
            >
              <span className="flex items-center gap-2">
                <ChevronRight
                  className="h-4 w-4 shrink-0 transition-transform"
                  style={{
                    color: "var(--text-muted)",
                    transform: isExpanded ? "rotate(90deg)" : "rotate(0deg)",
                  }}
                />
                <span>{group.label}</span>
                {group.charges.length > 1 ? (
                  <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                    · {group.charges.length} cargos
                  </span>
                ) : null}
              </span>
              <span className="font-semibold">{formatCLP(group.total)}</span>
            </button>

            {isExpanded ? (
              <div
                className="space-y-2 border-t px-4 py-3"
                style={{ borderColor: "var(--border-color)" }}
              >
                {group.charges.map((charge, index) => (
                  <div
                    key={charge.flowOrder ?? index}
                    className="flex flex-wrap items-center justify-between gap-3 text-xs"
                    style={{ color: "var(--text-muted)" }}
                  >
                    <span>{describeCharge(charge)}</span>
                    <span className="flex items-center gap-2">
                      <span>{charge.amount != null ? formatCLP(charge.amount) : "—"}</span>
                      <span>{charge.status}</span>
                    </span>
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        );
      })}

      {hasMore ? (
        <button
          type="button"
          onClick={() => setVisibleCount((prev) => prev + CHARGE_GROUPS_PAGE_SIZE)}
          className="w-full rounded-xl border px-4 py-2 text-center text-sm font-medium transition"
          style={{
            borderColor: "var(--border-color)",
            background: "var(--bg-soft)",
            color: "var(--text-main)",
          }}
        >
          Ver más
        </button>
      ) : null}
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
  const [plan, setPlan] = useState<PlanSlug>("starter");
  const [billingCycleEnd, setBillingCycleEnd] = useState<string | null>(null);
  const [scheduledPlanSlug, setScheduledPlanSlug] = useState<PlanSlug | null>(null);
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

  // Límites reales de staff y sucursales (base del plan + add-on activo),
  // desde GET /billing/addons — mismo endpoint que ya usa AddonManager.tsx
  // (que vive en la pestaña "Add-ons" de esta misma página, pero mantiene
  // su fetch interno/privado, sin exponer `limits` hacia afuera). null
  // mientras carga o si falló el fetch: en ese estado no se detecta
  // exceso ni se bloquea nada todavía.
  const [tenantLimits, setTenantLimits] = useState<{
    max_staff: number;
    max_branches: number;
  } | null>(null);

  // Los servicios son ilimitados en todos los planes (getPlanCapabilities
  // en el backend: max_services siempre 999999) — no depende de plan ni
  // de add-ons, así que no hace falta fetch para este valor.
  const maxServices = 999999;
  const maxStaff = tenantLimits?.max_staff ?? null;
  const maxBranches = tenantLimits?.max_branches ?? null;

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

  const excessBranches =
    maxBranches != null ? Math.max(0, activeBranches.length - maxBranches) : 0;
  const excessStaff = maxStaff != null ? Math.max(0, activeStaff.length - maxStaff) : 0;
  const excessServices = Math.max(0, activeServices.length - maxServices);

  const hasBranchExcess = excessBranches > 0;
  const hasStaffExcess = excessStaff > 0;
  const hasServicesExcess = excessServices > 0;

  const hasAnyExcess = hasBranchExcess || hasStaffExcess || hasServicesExcess;

  useEffect(() => {
    if (!hasBranchExcess || maxBranches == null) {
      setSelectedBranchesToKeep([]);
      return;
    }

    const allowed = activeBranches.slice(0, maxBranches).map((b) => b.id);
    setSelectedBranchesToKeep(allowed);
  }, [hasBranchExcess, activeBranches, maxBranches]);

  useEffect(() => {
    if (!hasStaffExcess || maxStaff == null) {
      setSelectedStaffToKeep([]);
      return;
    }

    const allowed = activeStaff.slice(0, maxStaff).map((s) => s.id);
    setSelectedStaffToKeep(allowed);
  }, [hasStaffExcess, activeStaff, maxStaff]);

  useEffect(() => {
    if (!hasServicesExcess) {
      setSelectedServicesToKeep([]);
      return;
    }

    const allowed = activeServices.slice(0, maxServices).map((s) => s.id);
    setSelectedServicesToKeep(allowed);
  }, [hasServicesExcess, activeServices]);

  // Mismo endpoint que ya consume AddonManager.tsx (montado en la pestaña
  // "Add-ons" de esta página), pero ese componente no expone su `limits`
  // hacia afuera — es un fetch propio, sin estado compartido con el resto
  // de la página. Reemplaza el PLAN_CAPS local hardcodeado que existía
  // antes (desactualizado: platinum decía 20 en vez de 25 para staff, y
  // no sumaba add-ons comprados).
  useEffect(() => {
    if (!tenantId) return;

    async function loadTenantLimits() {
      try {
        const res = await apiFetch(
          `${BACKEND_URL}/billing/addons?tenant_id=${tenantId}`
        );
        const data = await res.json();

        if (res.ok && data?.limits?.staff?.total != null && data?.limits?.sucursales?.total != null) {
          setTenantLimits({
            max_staff: Number(data.limits.staff.total),
            max_branches: Number(data.limits.sucursales.total),
          });
        }
      } catch {
        // Silencioso: si falla, los límites quedan sin cargar (no se
        // detecta exceso ni se bloquea nada) hasta un próximo intento.
      }
    }

    loadTenantLimits();
  }, [tenantId]);

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
      const currentPlan = (businessData.business.plan_slug as PlanSlug) || "starter";
      const nextScheduledPlan = businessData.business.scheduled_plan_slug
        ? (businessData.business.scheduled_plan_slug as PlanSlug)
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

  const [subscribing, setSubscribing] = useState(false);
  const [subscribeError, setSubscribeError] = useState("");
  const autoActivateTriedRef = useRef(false);

  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [canceling, setCanceling] = useState(false);
  const [cancelError, setCancelError] = useState("");

  const [deleteCardModalOpen, setDeleteCardModalOpen] = useState(false);
  const [deletingCard, setDeletingCard] = useState(false);
  const [deleteCardError, setDeleteCardError] = useState("");

  const [activeTab, setActiveTab] = useState<BillingTabId>("suscripcion");

  const billingTabs: Array<{ id: BillingTabId; label: string }> = [
    { id: "suscripcion", label: "Suscripción" },
    { id: "addons", label: "Add-ons" },
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

  // Monto neto (sin IVA) para el plan actual del tenant — PLAN_PRICES_ALL
  // (lib/plans.ts) cubre también pro/vip/platinum (legacy), a diferencia
  // del catálogo de marketing `plans` (solo starter/business/premium):
  // reactivar/re-suscribir a un plan legacy debe cobrar su monto
  // histórico real, no $0 (si no se encontrara) ni el precio de un plan
  // nuevo sin relación.
  function subscriptionMontoForCurrentPlan() {
    return cycleTotalPrice(PLAN_PRICES_ALL[plan] ?? PLAN_PRICES_ALL.starter, "mensual");
  }

  // Activa la suscripción real en Flow para una tarjeta ya registrada
  // (subscriptions.status === 'card_registered'). La usa tanto el botón
  // "Activar suscripción" (por si el auto-disparo de abajo no llegó a
  // correr) como el efecto que dispara esto solo al volver de Flow.
  async function activateSubscription() {
    try {
      setSubscribing(true);
      setSubscribeError("");

      const res = await apiFetch(`${BACKEND_URL}/billing/flow/subscribe`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenant_id: tenantId,
          plan_id: plan,
          periodicidad: "mensual",
          monto: subscriptionMontoForCurrentPlan(),
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "No se pudo activar la suscripción");
      }

      await loadSubscriptionStatus(tenantId);
    } catch (error: unknown) {
      setSubscribeError(
        error instanceof Error ? error.message : "No se pudo activar la suscripción"
      );
    } finally {
      setSubscribing(false);
    }
  }

  // Suscribirse por primera vez (o reintentar tras 'pending'/'error'):
  // create-customer es upsert sobre la fila existente del tenant, así
  // que reintentar nunca duplica ni deja un estado peor.
  async function handleSubscribe() {
    try {
      setSubscribing(true);
      setSubscribeError("");

      const createRes = await apiFetch(`${BACKEND_URL}/billing/flow/create-customer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenant_id: tenantId,
          plan_id: plan,
          monto: subscriptionMontoForCurrentPlan(),
          periodicidad: "mensual",
          // "v1": hueco preexistente, no nuevo — no hay hoy ningún checkbox
          // de consentimiento visible en el frontend antes de un cargo
          // recurrente (ni acá ni en checkout-premium). Pendiente real
          // antes del lanzamiento público, no se resuelve en este cambio.
          texto_autorizacion_version: "v1",
        }),
      });
      const createData = await createRes.json();

      if (!createRes.ok) {
        throw new Error(createData?.error || "No se pudo iniciar la suscripción");
      }

      const registerRes = await apiFetch(`${BACKEND_URL}/billing/flow/register-card`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tenant_id: tenantId }),
      });
      const registerData = await registerRes.json();

      if (!registerRes.ok) {
        throw new Error(registerData?.error || "No se pudo iniciar el registro de tarjeta");
      }

      window.location.href = registerData.url + "?token=" + registerData.token;
    } catch (error: unknown) {
      setSubscribeError(
        error instanceof Error ? error.message : "No se pudo iniciar la suscripción"
      );
      setSubscribing(false);
    }
  }

  // Reactivar una suscripción cancelada: intenta el camino corto primero
  // (subscribe directo, reusa flow_customer_id y la tarjeta que ya
  // estaba registrada en Flow). Si Flow lo rechaza -- por ejemplo si esa
  // tarjeta ya no es válida -- cae automáticamente al flujo completo de
  // siempre (handleSubscribe: create-customer + register-card).
  //
  // Antes de intentar el atajo, verifica que el customer TENGA una
  // tarjeta registrada en Flow (mismo chequeo que ya hace
  // subscription-status). Flow /subscription/create con
  // trial_period_days no exige tarjeta al crear la suscripción -- el
  // cobro se posterga, así que sin este chequeo se podía quedar
  // "suscrito" sin ninguna tarjeta detrás (ej. tras Cancelar +
  // Eliminar tarjeta).
  async function handleReactivate() {
    try {
      setSubscribing(true);
      setSubscribeError("");

      const statusRes = await apiFetch(
        `${BACKEND_URL}/billing/flow/subscription-status?tenant_id=${tenantId}`
      );
      const statusData = await statusRes.json();
      const hasCard = Boolean(statusRes.ok && statusData?.card);

      if (!hasCard) {
        await handleSubscribe();
        return;
      }

      const res = await apiFetch(`${BACKEND_URL}/billing/flow/subscribe`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenant_id: tenantId,
          plan_id: plan,
          periodicidad: "mensual",
          monto: subscriptionMontoForCurrentPlan(),
        }),
      });
      const data = await res.json();

      if (res.ok) {
        await loadSubscriptionStatus(tenantId);
        setSubscribing(false);
        return;
      }

      await handleSubscribe();
    } catch {
      await handleSubscribe();
    }
  }

  // Al volver del enrolamiento de tarjeta de Flow con card_status=ok, si
  // la suscripción quedó en 'card_registered' (tarjeta OK pero todavía
  // sin activar el cobro recurrente), dispara subscribe automáticamente
  // para no exigir un segundo clic manual. Ref en vez de solo estado
  // para no reintentarlo en cada re-render mientras subscriptionStatus
  // se sigue actualizando.
  useEffect(() => {
    if (autoActivateTriedRef.current) return;
    if (cardStatusParam !== "ok") return;
    if (!subscriptionStatus?.has_subscription) return;
    if (subscriptionStatus.status !== "card_registered") return;

    autoActivateTriedRef.current = true;
    activateSubscription();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cardStatusParam, subscriptionStatus]);

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

  // "Add-on" sin ":" a proposito: cubre tanto los cargos de activacion/
  // cambio de cantidad ("Add-on: x...") como los del cron de renovacion
  // automatica ("Add-on recurrente: x...").
  const subscriptionCharges = useMemo(
    () =>
      paymentHistory
        .filter((charge) => !charge.subject || !charge.subject.startsWith("Add-on"))
        .sort(compareChargeDateDesc),
    [paymentHistory]
  );

  const addonCharges = useMemo(
    () =>
      paymentHistory
        .filter((charge) => charge.subject && charge.subject.startsWith("Add-on"))
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

  async function handleDeleteCard() {
    try {
      setDeletingCard(true);
      setDeleteCardError("");

      const res = await apiFetch(`${BACKEND_URL}/billing/flow/unregister-card`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tenant_id: tenantId }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "No se pudo eliminar la tarjeta");
      }

      setDeleteCardModalOpen(false);
      await loadSubscriptionStatus(tenantId);
    } catch (error: unknown) {
      setDeleteCardError(
        error instanceof Error ? error.message : "No se pudo eliminar la tarjeta"
      );
    } finally {
      setDeletingCard(false);
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

  const planLabel = getPlanLabel(plan);
  const scheduledPlanLabel = scheduledPlanSlug ? getPlanLabel(scheduledPlanSlug) : null;

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
      <section id="billing-flow-action" className="space-y-4 scroll-mt-6">
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
        ) : (
          <>
            {!subscriptionStatus?.has_subscription ? (
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
                    {getPlanLabel(subscriptionStatus.plan_id)}
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

            {(() => {
              const subStatus = subscriptionStatus?.has_subscription
                ? subscriptionStatus.status
                : "none";
              const needsSubscribeAction =
                subStatus === "none" ||
                subStatus === "pending" ||
                subStatus === "error" ||
                subStatus === "card_registered" ||
                subStatus === "canceled";

              if (!needsSubscribeAction) return null;

              const label = subscribing
                ? "Procesando..."
                : subStatus === "card_registered"
                ? "Activar suscripción"
                : subStatus === "canceled"
                ? "Reactivar suscripción"
                : subStatus === "pending" || subStatus === "error"
                ? "Reintentar"
                : "Suscribirme";

              const onClick =
                subStatus === "card_registered"
                  ? activateSubscription
                  : subStatus === "canceled"
                  ? handleReactivate
                  : handleSubscribe;

              return (
                <div className="mt-4">
                  <button
                    type="button"
                    onClick={onClick}
                    disabled={subscribing}
                    className="inline-flex h-10 items-center justify-center rounded-xl px-4 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-60"
                    style={{ background: "linear-gradient(135deg, rgb(37,99,235), rgb(14,165,233))" }}
                  >
                    {label}
                  </button>
                  {subscribeError ? (
                    <p className="mt-2 text-xs" style={{ color: "rgb(248 113 113)" }}>
                      {subscribeError}
                    </p>
                  ) : null}
                </div>
              );
            })()}
          </>
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
            <div className="flex flex-wrap items-center gap-2">
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
              {!["active", "trialing", "card_registered"].includes(subscriptionStatus.status) ? (
                <button
                  type="button"
                  onClick={() => {
                    setDeleteCardError("");
                    setDeleteCardModalOpen(true);
                  }}
                  className="inline-flex h-10 items-center justify-center rounded-xl border px-4 text-sm font-medium transition"
                  style={{
                    borderColor: "rgba(244,63,94,0.4)",
                    background: "var(--bg-card)",
                    color: "rgb(244 63 94)",
                  }}
                >
                  Eliminar tarjeta
                </button>
              ) : null}
            </div>
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
        subscriptionStatus.status === "card_registered" ||
        subscriptionStatus.status === "trialing") ? (
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

      {activeTab === "addons" ? (
        <AddonManager tenantId={tenantId} />
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
            <GroupedChargeList
              charges={subscriptionCharges}
              emptyMessage="Aún no tienes pagos registrados."
              describeCharge={(charge) => describeSubscriptionChargeSubject(charge.subject)}
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
            <GroupedChargeList
              charges={addonCharges}
              emptyMessage="Aún no tienes add-ons activos."
              describeCharge={(charge) => describeAddonChargeSubject(charge.subject)}
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
          description={`Selecciona las sucursales que deseas mantener activas (${activeBranches.length} / ${maxBranches ?? "..."})`}
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
          description={`Selecciona los profesionales que deseas mantener activos (${activeStaff.length} / ${maxStaff ?? "..."})`}
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
          description={`Selecciona los servicios que deseas mantener activos (${activeServices.length} / ${maxServices})`}
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
              {subscriptionStatus?.has_subscription && subscriptionStatus.status === "trialing"
                ? "No se te cobrará nada. Tu suscripción se cancela de inmediato, antes de que termine tu trial."
                : <>
                    Al cancelar, tu suscripción dejará de renovarse automáticamente.
                    Podrás seguir usando tu plan hasta el final del ciclo actual
                    {billingCycleEnd ? ` (${formatDate(billingCycleEnd)})` : ""}.
                  </>}
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

      {deleteCardModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0"
            style={{ background: "rgba(0,0,0,0.6)" }}
            onClick={() => (deletingCard ? null : setDeleteCardModalOpen(false))}
          />
          <div
            className="relative z-10 mx-4 w-full max-w-sm rounded-2xl border p-6 shadow-2xl"
            style={{ background: "var(--bg-card)", borderColor: "var(--border-color)" }}
          >
            <h3
              className="text-center text-lg font-semibold"
              style={{ color: "var(--text-main)" }}
            >
              Eliminar tarjeta
            </h3>
            <p
              className="mt-2 text-center text-sm leading-6"
              style={{ color: "var(--text-muted)" }}
            >
              Se eliminará el registro de tu tarjeta en Flow. Podrás registrar una nueva
              más adelante si vuelves a suscribirte.
            </p>

            {deleteCardError ? (
              <p className="mt-3 text-center text-xs" style={{ color: "rgb(248 113 113)" }}>
                {deleteCardError}
              </p>
            ) : null}

            <div className="mt-5 flex gap-3">
              <button
                type="button"
                onClick={() => setDeleteCardModalOpen(false)}
                disabled={deletingCard}
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
                onClick={handleDeleteCard}
                disabled={deletingCard}
                className="flex-1 inline-flex h-10 items-center justify-center rounded-xl text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-60"
                style={{
                  background: "linear-gradient(135deg, rgb(244 63 94), rgb(225 29 72))",
                }}
              >
                {deletingCard ? "Eliminando..." : "Sí, eliminar"}
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
