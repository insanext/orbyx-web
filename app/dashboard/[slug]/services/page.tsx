"use client";

import { CSSProperties, useEffect, useMemo, useState } from "react";
import { apiFetch } from "@/lib/api";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Layers3 } from "lucide-react";
import { Panel } from "../../../../components/dashboard/panel";
import { usePermissions } from "../../../../lib/permissions-context";
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
  closestCenter,
  useDroppable,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

type BusinessResponse = {
  business: {
    id: string;
    name: string;
    slug: string;
plan_slug?: string | null;
business_category?: string | null;
  };
  calendar_id: string;
  google_connected?: boolean;
};

type Service = {
  id: string;
  name: string;
  description?: string | null;
  duration_minutes: number;
  price: number | null;
  active: boolean;
  is_group?: boolean | null;
  capacity?: number | null;
  group_id?: string | null;
  sort_order?: number;
  customer_instructions?: string | null;
};

type StaffItem = {
  id: string;
  tenant_id: string;
  name: string;
  role?: string | null;
  email?: string | null;
  phone?: string | null;
  color?: string | null;
  is_active: boolean;
  sort_order: number;
};

type StaffServiceItem = {
  id?: string;
  tenant_id?: string;
  staff_id: string;
  service_id: string;
  branch_id?: string | null;
  created_at?: string;
};

type StaffServiceRow = {
  id: string;
  tenant_id: string;
  staff_id: string;
  service_id: string;
};

type BranchItem = {
  id: string;
  tenant_id: string;
  name: string;
  is_active?: boolean;
};

type NoticeTone =
  | "info"
  | "success"
  | "warning"
  | "limit"
  | "danger"
  | "neutral";

const BACKEND_URL = "https://orbyx-backend.onrender.com";

function normalizePlanSlug(planSlug?: string | null) {
  const normalized = String(planSlug || "pro").toLowerCase();
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

function GroupDropZone({
  groupId,
  children,
}: {
  groupId: string;
  children: React.ReactNode;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: groupId,
    data: { type: "group", groupId },
  });
  return (
    <div
      ref={setNodeRef}
      className={`min-h-[40px] transition-colors ${
        isOver ? "bg-blue-500/10" : ""
      }`}
    >
      {children}
    </div>
  );
}

function SortableServiceRow({
  service,
  onEdit,
  onDelete,
  hasStaff,
  readOnly,
}: {
  service: Service;
  onEdit: (s: Service) => void;
  onDelete: (s: Service) => void;
  hasStaff?: boolean;
  readOnly?: boolean;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: service.id,
    data: { type: "service", groupId: service.group_id },
  });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.35 : 1,
  };
  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-2 px-3 py-2.5 border-b border-blue-900/10 last:border-b-0 hover:bg-blue-950/20 transition-colors group/row cursor-grab active:cursor-grabbing touch-none"
      {...attributes}
      {...listeners}
    >
      <span className="text-blue-900/40 flex-shrink-0" aria-hidden="true">
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="currentColor"
        >
          <circle cx="9" cy="6" r="1.5" />
          <circle cx="15" cy="6" r="1.5" />
          <circle cx="9" cy="12" r="1.5" />
          <circle cx="15" cy="12" r="1.5" />
          <circle cx="9" cy="18" r="1.5" />
          <circle cx="15" cy="18" r="1.5" />
        </svg>
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate" style={{ color: "var(--text-main)" }}>
          {service.name}
        </p>
        <div className="flex gap-2 flex-wrap mt-0.5">
          <span className="text-xs" style={{ color: "var(--text-muted)" }}>
            {service.duration_minutes} min
          </span>
          {service.price ? (
            <span className="text-xs" style={{ color: "var(--text-muted)" }}>
              ${Number(service.price).toLocaleString("es-CL")}
            </span>
          ) : (
            <span className="text-xs opacity-40" style={{ color: "var(--text-muted)" }}>
              Sin precio
            </span>
          )}
          {service.is_group && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-purple-500/10 text-purple-300 border border-purple-500/20">
              Grupal · cap {service.capacity}
            </span>
          )}
          {!service.active && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-gray-500/10 text-gray-400 border border-gray-500/20">
              Inactivo
            </span>
          )}
          {!hasStaff && (
            <span
              className="text-[10px] px-1.5 py-0.5"
              style={{ background: "transparent", border: "1.5px solid #d97706", color: "#d97706", borderRadius: 4 }}
            >
              ⚠ Sin profesional — no visible en tu página pública
            </span>
          )}
        </div>
      </div>
      {readOnly ? null : (
        <div className="flex gap-1.5 opacity-0 group-hover/row:opacity-100 transition-opacity flex-shrink-0">
          <button
            onClick={() => onEdit(service)}
            onPointerDown={(e) => e.stopPropagation()}
            className="text-xs px-2.5 py-1 rounded-lg border border-blue-900/30 hover:border-blue-500/40 transition-colors"
            style={{ color: "var(--text-muted)" }}
          >
            Editar
          </button>
          <button
            onClick={() => onDelete(service)}
            onPointerDown={(e) => e.stopPropagation()}
            className="text-xs px-2.5 py-1 rounded-lg border border-transparent hover:text-red-400 hover:border-red-500/30 hover:bg-red-500/5 transition-colors"
            style={{ color: "var(--text-muted)" }}
          >
            Eliminar
          </button>
        </div>
      )}
    </div>
  );
}

export default function ServicesPage() {
  const { canEdit } = usePermissions();
  const canEditServicios = canEdit("servicios");
  const params = useParams();
  const slug =
    ((params as { slug?: string })?.slug as string) ||
    ((params as { Slug?: string })?.Slug as string);

  const [tenantId, setTenantId] = useState("");
  const [branches, setBranches] = useState<BranchItem[]>([]);
  const [selectedBranchId, setSelectedBranchId] = useState("");
  const [loadingBranches, setLoadingBranches] = useState(false);

const [businessName, setBusinessName] = useState("");
const [googleConnected, setGoogleConnected] = useState(false);
const [plan, setPlan] = useState("pro");
const [businessCategory, setBusinessCategory] = useState("");
  const [services, setServices] = useState<Service[]>([]);
  const [staff, setStaff] = useState<StaffItem[]>([]);
  const [staffServices, setStaffServices] = useState<StaffServiceRow[]>([]);
  const [selectedServicesToKeep, setSelectedServicesToKeep] = useState<string[]>(
    []
  );

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loadError, setLoadError] = useState("");
  const [saveError, setSaveError] = useState("");
  const [saveOk, setSaveOk] = useState("");
  const [groups, setGroups] = useState<any[]>([]);
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(
    new Set()
  );
  const [confirmModal, setConfirmModal] = useState<{
    open: boolean;
    type: "delete-service" | "delete-group" | null;
    id: string | null;
    name: string | null;
  }>({ open: false, type: null, id: null, name: null });
  const [newGroupName, setNewGroupName] = useState("");
  const [showNewGroupInput, setShowNewGroupInput] = useState(false);
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);
  const [editingGroupName, setEditingGroupName] = useState("");
  const [activeId, setActiveId] = useState<string | null>(null);

const [form, setForm] = useState({
  name: "",
  description: "",
  duration_minutes: "30",
  price: "",
  staff_ids: [] as string[],
  is_group: false,
  capacity: "1",
  customer_instructions: "",
});

const [editForm, setEditForm] = useState({
  name: "",
  description: "",
  duration_minutes: "30",
  price: "",
  active: true,
  staff_ids: [] as string[],
  is_group: false,
  capacity: "1",
  customer_instructions: "",
});

  const publicUrl = useMemo(() => `https://orbyx.cl/${slug}`, [slug]);

  const branchStorageKey = useMemo(() => {
    return slug ? `orbyx_active_branch_${slug}` : "";
  }, [slug]);

  // Los servicios son ilimitados en todos los planes (decisión de producto,
  // vigente también tras la migración a 3 planes) — el backend real
  // (DEFAULT_PLAN_CAPS en server.js) ya devuelve max_services: 999999 para
  // los 4 planes. Antes había acá una tabla local hardcodeada (10/25/50/100)
  // desactualizada respecto a eso, que bloqueaba la creación de servicios
  // sin que existiera ese tope en el backend.
  const maxServices = Infinity;

  const servicesRemainingCount = Infinity;
const isGroupBookingBusiness = businessCategory === "group_booking";

  const activeServicesCount = services.filter((service) => service.active).length;
  const servicesWithDescriptionCount = services.filter(
    (service) => String(service.description || "").trim() !== ""
  ).length;

  const excessServices = Math.max(0, activeServicesCount - maxServices);
  const hasExcess = excessServices > 0;

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );
  const activeService = services.find((s) => s.id === activeId);

  function handleDragStart(event: DragStartEvent) {
    setActiveId(event.active.id as string);
  }

  function handleDragOver(event: DragOverEvent) {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id as string;
    const overData = (over.data as any)?.current;
    const activeData = (active.data as any)?.current;

    // Determinar grupo destino: puede ser una zona grupo (useDroppable)
    // o un servicio que pertenece a otro grupo (useSortable)
    let targetGroupId: string | null;
    if (overData?.type === "group") {
      targetGroupId = over.id === "none" ? null : (over.id as string);
    } else if (overData?.type === "service") {
      targetGroupId = overData.groupId ?? null;
    } else {
      return;
    }

    const sourceGroupId = activeData?.groupId ?? null;
    if (sourceGroupId === targetGroupId) return;

    setServices((prev) =>
      prev.map((s) =>
        s.id === activeId ? { ...s, group_id: targetGroupId } : s
      )
    );
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveId(null);
    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    setServices((prev) => {
      const activeIdx = prev.findIndex((s) => s.id === activeId);
      const overIdx = prev.findIndex((s) => s.id === overId);

      // Reordenar dentro del mismo grupo si ambos son servicios
      let reordered = prev;
      if (activeIdx !== -1 && overIdx !== -1 && activeId !== overId) {
        const sameGroup =
          prev[activeIdx].group_id === prev[overIdx].group_id;
        if (sameGroup) {
          reordered = arrayMove(prev, activeIdx, overIdx);
        }
      }

      // Persistir orden y group_id actualizado
      const order = reordered.map((s, i) => ({
        id: s.id,
        group_id: s.group_id ?? null,
        sort_order: i,
      }));
      apiFetch(`${BACKEND_URL}/services/reorder`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tenant_id: tenantId, order }),
      }).catch((e) => console.error("Error guardando orden:", e));

      return reordered;
    });
  }

  function renderServiceItem(service: Service) {
    if (editingId === service.id) {
      return (
        <div
          key={service.id}
          className="rounded-2xl border p-4 mx-3 mb-2"
          style={{
            borderColor: "rgba(37,99,235,0.35)",
            background:
              "linear-gradient(135deg, rgba(37,99,235,0.10), rgba(14,165,233,0.05), var(--bg-soft))",
          }}
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="font-semibold" style={{ color: "var(--text-main)" }}>
                  Editando servicio
                </p>
                <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                  Actualiza nombre, descripción, duración y precio.
                </p>
              </div>
            </div>
            <input
              type="text"
              value={editForm.name}
              onChange={(e) =>
                setEditForm((prev) => ({ ...prev, name: e.target.value }))
              }
              placeholder="Nombre del servicio"
              className="w-full rounded-xl border px-4 py-2 text-sm placeholder:text-slate-400 dark:placeholder:text-slate-500"
              style={{
                borderColor: "var(--border-color)",
                background: "var(--bg-card)",
                color: "var(--text-main)",
              }}
            />
            <textarea
              value={editForm.description}
              onChange={(e) =>
                setEditForm((prev) => ({ ...prev, description: e.target.value }))
              }
              placeholder="Descripción"
              className="w-full rounded-xl border px-4 py-2 text-sm placeholder:text-slate-400 dark:placeholder:text-slate-500"
              style={{
                borderColor: "var(--border-color)",
                background: "var(--bg-card)",
                color: "var(--text-main)",
              }}
            />
            <div className="space-y-1">
              <label className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>
                Instrucciones para el cliente (opcional)
              </label>
              <textarea
                value={editForm.customer_instructions}
                onChange={(e) =>
                  setEditForm((prev) => ({
                    ...prev,
                    customer_instructions: e.target.value,
                  }))
                }
                placeholder="Ej: Trae tu carnet de identidad"
                className="w-full rounded-xl border px-4 py-2 text-sm placeholder:text-slate-400 dark:placeholder:text-slate-500"
                style={{
                  borderColor: "var(--border-color)",
                  background: "var(--bg-card)",
                  color: "var(--text-main)",
                }}
              />
              <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>
                Se incluye en el email de confirmación de la reserva.
              </p>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-1">
                <label className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>
                  Duración del servicio (min)
                </label>
                <input
                  type="number"
                  min="1"
                  value={editForm.duration_minutes}
                  onChange={(e) =>
                    setEditForm((prev) => ({
                      ...prev,
                      duration_minutes: e.target.value,
                    }))
                  }
                  placeholder="Duración del servicio (min)"
                  className="w-full rounded-xl border px-4 py-2 text-sm placeholder:text-slate-400 dark:placeholder:text-slate-500"
                  style={{
                    borderColor: "var(--border-color)",
                    background: "var(--bg-card)",
                    color: "var(--text-main)",
                  }}
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>
                  Precio
                </label>
                <input
                  type="number"
                  min="0"
                  value={editForm.price}
                  onChange={(e) =>
                    setEditForm((prev) => ({ ...prev, price: e.target.value }))
                  }
                  placeholder="Precio"
                  className="w-full rounded-xl border px-4 py-2 text-sm placeholder:text-slate-400 dark:placeholder:text-slate-500"
                  style={{
                    borderColor: "var(--border-color)",
                    background: "var(--bg-card)",
                    color: "var(--text-main)",
                  }}
                />
              </div>
            </div>
            {isGroupBookingBusiness ? (
              <div className="space-y-2">
                <label
                  className={`orbyx-services-energy flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-medium ${
                    editForm.is_group ? "orbyx-services-energy-active" : ""
                  }`}
                  style={{
                    borderColor: editForm.is_group
                      ? "rgba(37,99,235,0.55)"
                      : "var(--border-color)",
                    background: editForm.is_group
                      ? "rgba(37,99,235,0.10)"
                      : "var(--bg-card)",
                    color: "var(--text-main)",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={editForm.is_group}
                    onChange={(e) =>
                      setEditForm((prev) => ({
                        ...prev,
                        is_group: e.target.checked,
                      }))
                    }
                  />
                  Servicio grupal (clases, talleres, etc.)
                </label>
                {editForm.is_group ? (
                  <div className="space-y-1">
                    <label
                      className="text-xs font-medium"
                      style={{ color: "var(--text-muted)" }}
                    >
                      Capacidad máxima
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={editForm.capacity}
                      onChange={(e) =>
                        setEditForm((prev) => ({
                          ...prev,
                          capacity: e.target.value,
                        }))
                      }
                      className="w-full rounded-xl border px-4 py-2 text-sm"
                      style={{
                        borderColor: "var(--border-color)",
                        background: "var(--bg-card)",
                        color: "var(--text-main)",
                      }}
                    />
                  </div>
                ) : null}
              </div>
            ) : null}
            {staff.length > 0 && (
              <div className="space-y-2">
                <label className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>
                  Profesionales que realizan este servicio
                </label>
                <div className="space-y-1.5">
                  {staff.map((member) => (
                    <label
                      key={member.id}
                      className="flex items-center gap-2.5 rounded-xl border px-3 py-2 text-sm cursor-pointer transition-colors"
                      style={{
                        borderColor: editForm.staff_ids.includes(member.id)
                          ? "rgba(37,99,235,0.50)"
                          : "var(--border-color)",
                        background: editForm.staff_ids.includes(member.id)
                          ? "rgba(37,99,235,0.08)"
                          : "var(--bg-card)",
                        color: "var(--text-main)",
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={editForm.staff_ids.includes(member.id)}
                        onChange={() => toggleEditStaff(member.id)}
                        className="accent-blue-500"
                      />
                      {member.name}
                    </label>
                  ))}
                </div>
                <p className="text-xs leading-5" style={{ color: "var(--text-muted)" }}>
                  Cada servicio debe tener al menos un profesional asignado para aparecer en tu página pública. Esta regla aplica también para servicios que crees en el futuro.
                </p>
              </div>
            )}
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => handleSaveEdit(service.id)}
                disabled={saving}
                className="orbyx-services-energy inline-flex h-10 items-center justify-center rounded-xl border px-4 text-sm font-medium text-white transition disabled:cursor-not-allowed disabled:opacity-60"
                style={{
                  borderColor: "rgba(147,197,253,0.36)",
                  background:
                    "linear-gradient(135deg, rgb(37 99 235), rgb(14 165 233))",
                }}
              >
                {saving ? "Guardando..." : "Guardar cambios"}
              </button>
              <button
                type="button"
                onClick={cancelEditing}
                disabled={saving}
                className="orbyx-services-energy inline-flex h-10 items-center justify-center rounded-xl border px-4 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-60"
                style={{
                  borderColor: "var(--border-color)",
                  background: "var(--bg-card)",
                  color: "var(--text-main)",
                }}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      );
    }
    return (
      <SortableServiceRow
        key={service.id}
        service={service}
        onEdit={startEditing}
        onDelete={(s) =>
          setConfirmModal({
            open: true,
            type: "delete-service",
            id: s.id,
            name: s.name,
          })
        }
        hasStaff={getSelectedStaffIdsForService(service.id).length > 0}
        readOnly={!canEditServicios}
      />
    );
  }

  const selectedBranchName =
    branches.find((branch) => branch.id === selectedBranchId)?.name || "";

  function readStoredBranchId() {
    if (typeof window === "undefined" || !branchStorageKey) return "";
    return localStorage.getItem(branchStorageKey) || "";
  }

  function normalizeStaffServices(items: StaffServiceItem[]): StaffServiceRow[] {
    return items
      .filter(
        (item) =>
          !!item &&
          typeof item.staff_id === "string" &&
          item.staff_id.trim() !== "" &&
          typeof item.service_id === "string" &&
          item.service_id.trim() !== ""
      )
      .map((item) => ({
        id: item.id || `${item.staff_id}-${item.service_id}`,
        tenant_id: item.tenant_id || "",
        staff_id: item.staff_id,
        service_id: item.service_id,
      }));
  }

  async function fetchBranchData(
    currentTenantId: string,
    currentBranchId: string
  ) {
    const [servicesRes, staffRes, staffServicesRes, groupsRes] =
      await Promise.all([
        apiFetch(
          `${BACKEND_URL}/services?tenant_id=${currentTenantId}&branch_id=${currentBranchId}`
        ),
        apiFetch(
          `${BACKEND_URL}/staff?tenant_id=${currentTenantId}&branch_id=${currentBranchId}&active=true`
        ),
        apiFetch(
          `${BACKEND_URL}/staff-services?tenant_id=${currentTenantId}&branch_id=${currentBranchId}`
        ),
        apiFetch(
          `${BACKEND_URL}/service-groups?tenant_id=${currentTenantId}&branch_id=${currentBranchId}`
        ),
      ]);

    const servicesData: { services?: Service[]; error?: string } =
      await servicesRes.json();
    const staffData: { staff?: StaffItem[]; error?: string } =
      await staffRes.json();
    const staffServicesData: {
      staff_services?: StaffServiceItem[];
      error?: string;
    } = await staffServicesRes.json();
    const groupsData = await groupsRes.json().catch(() => []);

    if (!servicesRes.ok) {
      throw new Error(
        servicesData?.error || "No se pudieron cargar los servicios"
      );
    }

    if (!staffRes.ok) {
      throw new Error(staffData?.error || "No se pudo cargar el staff");
    }

    if (!staffServicesRes.ok) {
      throw new Error(
        staffServicesData?.error ||
          "No se pudo cargar la asignación staff-servicios"
      );
    }

    setServices(
      Array.isArray(servicesData?.services) ? servicesData.services : []
    );
    setStaff(Array.isArray(staffData?.staff) ? staffData.staff : []);
    setStaffServices(
      normalizeStaffServices(
        Array.isArray(staffServicesData?.staff_services)
          ? staffServicesData.staff_services
          : []
      )
    );
    setGroups(Array.isArray(groupsData) ? groupsData : []);
  }

  function formatPrice(price: number | null) {
    if (typeof price !== "number" || price <= 0) return "Sin precio";

    return new Intl.NumberFormat("es-CL", {
      style: "currency",
      currency: "CLP",
      maximumFractionDigits: 0,
    }).format(price);
  }

  function getSelectedStaffIdsForService(serviceId: string) {
    return staffServices
      .filter((row) => row.service_id === serviceId)
      .map((row) => row.staff_id);
  }

  function getStaffNamesForService(serviceId: string) {
    const selectedIds = getSelectedStaffIdsForService(serviceId);

    if (selectedIds.length === 0) return [];

    return staff
      .filter((item) => selectedIds.includes(item.id))
      .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))
      .map((item) => item.name);
  }

  function toggleCreateStaff(staffId: string) {
    setForm((prev) => {
      const exists = prev.staff_ids.includes(staffId);

      return {
        ...prev,
        staff_ids: exists
          ? prev.staff_ids.filter((id) => id !== staffId)
          : [...prev.staff_ids, staffId],
      };
    });
  }

  function toggleEditStaff(staffId: string) {
    setEditForm((prev) => {
      const exists = prev.staff_ids.includes(staffId);

      return {
        ...prev,
        staff_ids: exists
          ? prev.staff_ids.filter((id) => id !== staffId)
          : [...prev.staff_ids, staffId],
      };
    });
  }

  function toggleServiceSelection(serviceId: string) {
    setSelectedServicesToKeep((prev) =>
      prev.includes(serviceId)
        ? prev.filter((id) => id !== serviceId)
        : [...prev, serviceId]
    );
  }

  async function applyServicesAdjustment() {
    try {
      const toDeactivate = services.filter(
        (service) => service.active && !selectedServicesToKeep.includes(service.id)
      );

      if (toDeactivate.length === 0) {
        alert("No hay servicios para desactivar.");
        return;
      }

      const confirmed = window.confirm(
        `Se desactivarán ${toDeactivate.length} servicio${
          toDeactivate.length === 1 ? "" : "s"
        }. ¿Continuar?`
      );

      if (!confirmed) return;

      setSaving(true);
      setSaveError("");
      setSaveOk("");

      for (const service of toDeactivate) {
        const response = await apiFetch(`${BACKEND_URL}/services/${service.id}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            tenant_id: tenantId,
            branch_id: selectedBranchId,
            active: false,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data?.error || `No se pudo desactivar el servicio ${service.name}`
          );
        }
      }

      if (tenantId && selectedBranchId) {
        await fetchBranchData(tenantId, selectedBranchId);
      }

      setSaveOk("Ajuste aplicado correctamente.");
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "No se pudo aplicar el ajuste";
      setSaveError(message);
    } finally {
      setSaving(false);
    }
  }

  async function loadBranches(currentTenantId: string) {
    try {
      setLoadingBranches(true);

      const response = await apiFetch(
        `${BACKEND_URL}/branches?tenant_id=${currentTenantId}`
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || "No se pudieron cargar las sucursales");
      }

      const rows: BranchItem[] = Array.isArray(data?.branches) ? data.branches : [];
      const activeRows = rows.filter((branch) => branch.is_active !== false);
      setBranches(activeRows);

      if (activeRows.length === 0) {
        setSelectedBranchId("");
        if (typeof window !== "undefined" && branchStorageKey) {
          localStorage.removeItem(branchStorageKey);
        }
        return;
      }

      const storedBranchId = readStoredBranchId();
      const storedExists = activeRows.some(
        (branch: BranchItem) => branch.id === storedBranchId
      );

      if (storedExists) {
        setSelectedBranchId(storedBranchId);
        return;
      }

      const fallbackBranchId = activeRows[0].id;
      setSelectedBranchId(fallbackBranchId);

      if (typeof window !== "undefined" && branchStorageKey) {
        localStorage.setItem(branchStorageKey, fallbackBranchId);
      }
    } catch (error) {
      console.error("Error cargando sucursales", error);
      setBranches([]);
      setSelectedBranchId("");
    } finally {
      setLoadingBranches(false);
    }
  }

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

setTenantId(currentTenantId);
setBusinessName(businessData.business.name || slug || "");
setGoogleConnected(Boolean(businessData.google_connected));
setPlan(normalizePlanSlug(businessData.business.plan_slug));
setBusinessCategory(
  String(businessData.business.business_category || "").trim().toLowerCase()
);

      await loadBranches(currentTenantId);
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "No se pudo cargar la página";
      setLoadError(message);
      setLoading(false);
    }
  }

  useEffect(() => {
    if (slug) {
      loadAll();
    }
  }, [slug]);

  useEffect(() => {
    function handleBranchChanged(event: Event) {
      const customEvent = event as CustomEvent<{
        slug?: string;
        branchId?: string;
      }>;
      const eventSlug = customEvent.detail?.slug;
      const branchId = customEvent.detail?.branchId || "";

      if (eventSlug !== slug) return;

      setSelectedBranchId(branchId);
      setEditingId(null);

setForm({
  name: "",
  description: "",
  duration_minutes: "30",
  price: "",
  staff_ids: [],
  is_group: false,
  capacity: "1",
  customer_instructions: "",
});
      setSaveError("");
      setSaveOk("");
    }

    function handleStorage(event: StorageEvent) {
      if (event.key !== branchStorageKey) return;

      const nextBranchId = event.newValue || "";
      setSelectedBranchId(nextBranchId);
      setEditingId(null);
setForm({
  name: "",
  description: "",
  duration_minutes: "30",
  price: "",
  staff_ids: [],
  is_group: false,
  capacity: "1",
  customer_instructions: "",
});
      setSaveError("");
      setSaveOk("");
    }

    window.addEventListener(
      "orbyx-branch-changed",
      handleBranchChanged as EventListener
    );
    window.addEventListener("storage", handleStorage);

    return () => {
      window.removeEventListener(
        "orbyx-branch-changed",
        handleBranchChanged as EventListener
      );
      window.removeEventListener("storage", handleStorage);
    };
  }, [slug, branchStorageKey]);

  useEffect(() => {
    async function loadBranchData() {
      try {
        if (!tenantId || !selectedBranchId) {
          setServices([]);
          setStaff([]);
          setStaffServices([]);
          setLoading(false);
          return;
        }

        setLoading(true);
        setLoadError("");

        await fetchBranchData(tenantId, selectedBranchId);
      } catch (error: unknown) {
        const message =
          error instanceof Error
            ? error.message
            : "No se pudieron cargar los datos de la sucursal";

        setLoadError(message);
        setServices([]);
        setStaff([]);
        setStaffServices([]);
      } finally {
        setLoading(false);
      }
    }

    loadBranchData();
  }, [tenantId, selectedBranchId]);

  useEffect(() => {
    if (!hasExcess) {
      setSelectedServicesToKeep([]);
      return;
    }

    const activeServices = services.filter((service) => service.active);
    const allowedIds = activeServices.slice(0, maxServices).map((s) => s.id);
    setSelectedServicesToKeep(allowedIds);
  }, [hasExcess, services, maxServices]);

  async function saveServiceStaffRelations(
    serviceId: string,
    selectedStaffIds: string[]
  ) {
    if (!tenantId) return;

    const activeStaffIds = staff
      .filter((item) => item.is_active)
      .map((item) => item.id);

    for (const staffId of activeStaffIds) {
      const serviceIdsForStaff = staffServices
        .filter((row) => row.staff_id === staffId && row.service_id !== serviceId)
        .map((row) => row.service_id);

      if (selectedStaffIds.includes(staffId)) {
        serviceIdsForStaff.push(serviceId);
      }

      const uniqueServiceIds = [...new Set(serviceIdsForStaff)];

      const response = await apiFetch(`${BACKEND_URL}/staff-services`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          tenant_id: tenantId,
          branch_id: selectedBranchId,
          staff_id: staffId,
          service_ids: uniqueServiceIds,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.error || "No se pudieron guardar las relaciones staff-servicio"
        );
      }
    }
  }

  async function handleCreateService() {
    try {
      setSaving(true);
      setSaveError("");
      setSaveOk("");

      if (!tenantId) {
        throw new Error("No se encontró el negocio");
      }

      if (!selectedBranchId) {
        throw new Error("Debes seleccionar una sucursal activa");
      }

      if (!form.name.trim()) {
        throw new Error("Debes ingresar el nombre del servicio");
      }

      if (!form.duration_minutes.trim()) {
        throw new Error("Debes ingresar la duración");
      }

      const response = await apiFetch(`${BACKEND_URL}/services`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
body: JSON.stringify({
  tenant_id: tenantId,
  branch_id: selectedBranchId,
  name: form.name.trim(),
  description: form.description.trim(),
  duration_minutes: Number(form.duration_minutes || 30),
  buffer_before_minutes: 0,
  buffer_after_minutes: 0,
  price: Number(form.price || 0),
  active: true,

is_group: isGroupBookingBusiness ? form.is_group : false,
capacity: isGroupBookingBusiness ? Number(form.capacity || 1) : 1,
customer_instructions: form.customer_instructions.trim() || null,
}),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || "No se pudo crear el servicio");
      }

      const createdServiceId = data?.service?.id;

      if (!createdServiceId) {
        throw new Error("Servicio creado sin id válido");
      }

      await saveServiceStaffRelations(createdServiceId, form.staff_ids);
      await fetchBranchData(tenantId, selectedBranchId);

setForm({
  name: "",
  description: "",
  duration_minutes: "30",
  price: "",
  staff_ids: [],
  is_group: false,
  capacity: "1",
  customer_instructions: "",
});

      setSaveOk("Servicio creado correctamente.");
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "No se pudo crear el servicio";
      setSaveError(message);
    } finally {
      setSaving(false);
    }
  }

function startEditing(service: Service) {
  setSaveError("");
  setSaveOk("");
  setEditingId(service.id);
  setEditForm({
    name: service.name || "",
    description: service.description || "",
    duration_minutes: String(service.duration_minutes || 30),
    price: service.price ? String(service.price) : "",
    active: Boolean(service.active),
    staff_ids: getSelectedStaffIdsForService(service.id),
    is_group: Boolean(service.is_group),
    capacity: String(service.capacity || 1),
    customer_instructions: service.customer_instructions || "",
  });
}

  function cancelEditing() {
    setEditingId(null);
  }

  async function handleSaveEdit(serviceId: string) {
    try {
      setSaving(true);
      setSaveError("");
      setSaveOk("");

      if (!tenantId) {
        throw new Error("No se encontró el negocio");
      }

      if (!selectedBranchId) {
        throw new Error("Debes seleccionar una sucursal activa");
      }

      if (!editForm.name.trim()) {
        throw new Error("Debes ingresar el nombre del servicio");
      }

      if (!editForm.duration_minutes.trim()) {
        throw new Error("Debes ingresar la duración");
      }

      const response = await apiFetch(`${BACKEND_URL}/services/${serviceId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
body: JSON.stringify({
  tenant_id: tenantId,
  branch_id: selectedBranchId,
  name: editForm.name.trim(),
  description: editForm.description.trim(),
  duration_minutes: Number(editForm.duration_minutes || 30),
  price: Number(editForm.price || 0),
  buffer_before_minutes: 0,
  buffer_after_minutes: 0,
  active: editForm.active,
is_group: isGroupBookingBusiness ? editForm.is_group : false,
capacity: isGroupBookingBusiness ? Number(editForm.capacity || 1) : 1,
customer_instructions: editForm.customer_instructions.trim() || null,
}),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || "No se pudo actualizar el servicio");
      }

      await saveServiceStaffRelations(serviceId, editForm.staff_ids);
      await fetchBranchData(tenantId, selectedBranchId);

      setSaveOk("Servicio actualizado correctamente.");
      setEditingId(null);
    } catch (error: unknown) {
      const message =
        error instanceof Error
          ? error.message
          : "No se pudo actualizar el servicio";
      setSaveError(message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteService(serviceId: string) {
    try {
      setSaveError("");
      setSaveOk("");

      setSaving(true);

      const response = await apiFetch(`${BACKEND_URL}/services/${serviceId}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || "No se pudo eliminar el servicio");
      }

      if (editingId === serviceId) {
        setEditingId(null);
      }

      if (tenantId && selectedBranchId) {
        await fetchBranchData(tenantId, selectedBranchId);
      }

      setSaveOk("Servicio eliminado correctamente.");
    } catch (error: unknown) {
      const message =
        error instanceof Error
          ? error.message
          : "No se pudo eliminar el servicio";
      setSaveError(message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6 pb-6">
      <style>{`
        .orbyx-services-energy {
          position: relative;
          isolation: isolate;
          overflow: hidden;
          cursor: pointer;
          transition:
            transform 180ms ease,
            border-color 180ms ease,
            box-shadow 180ms ease,
            background 180ms ease,
            filter 180ms ease;
        }

        .orbyx-services-energy::after {
          content: "";
          position: absolute;
          inset: -1px;
          z-index: -1;
          border-radius: inherit;
          background:
            radial-gradient(circle at 50% 0%, rgba(96, 165, 250, 0.28), transparent 42%),
            linear-gradient(135deg, rgba(37, 99, 235, 0.18), rgba(14, 165, 233, 0.1));
          opacity: 0;
          transform: scale(0.94);
          transition: opacity 180ms ease, transform 180ms ease;
        }

        .orbyx-services-energy:not(:disabled):hover {
          border-color: rgba(96, 165, 250, 0.68) !important;
          box-shadow:
            0 0 0 1px rgba(59, 130, 246, 0.16),
            0 12px 30px rgba(37, 99, 235, 0.16),
            0 0 24px rgba(14, 165, 233, 0.16) !important;
          filter: saturate(1.08);
          transform: translateY(-1px);
        }

        .orbyx-services-energy:not(:disabled):hover::after {
          opacity: 1;
          transform: scale(1);
        }

        .orbyx-services-energy:not(:disabled):active {
          animation: orbyx-services-energy-pulse 260ms ease-out;
          box-shadow:
            0 0 0 1px rgba(147, 197, 253, 0.36),
            0 0 22px rgba(37, 99, 235, 0.28),
            0 8px 22px rgba(37, 99, 235, 0.16) !important;
          transform: translateY(0) scale(0.98);
        }

        .orbyx-services-energy-active {
          border-color: rgba(96, 165, 250, 0.72) !important;
          background: linear-gradient(135deg, rgba(37, 99, 235, 0.16), rgba(14, 165, 233, 0.08)) !important;
          box-shadow:
            inset 0 0 0 1px rgba(147, 197, 253, 0.28),
            0 12px 30px rgba(37, 99, 235, 0.16),
            0 0 20px rgba(14, 165, 233, 0.14) !important;
        }

        @keyframes orbyx-services-energy-pulse {
          0% {
            box-shadow:
              0 0 0 0 rgba(96, 165, 250, 0.36),
              0 0 16px rgba(37, 99, 235, 0.22);
          }
          100% {
            box-shadow:
              0 0 0 10px rgba(96, 165, 250, 0),
              0 0 24px rgba(37, 99, 235, 0.12);
          }
        }

        html[data-theme="nocturno"] .orbyx-services-hero {
          border-color: rgba(56, 189, 248, 0.24) !important;
          background:
            linear-gradient(135deg, rgba(15, 23, 42, 0.94), rgba(2, 6, 23, 0.88) 54%, rgba(8, 47, 73, 0.78)) !important;
          box-shadow:
            0 24px 60px -34px rgba(14, 165, 233, 0.58),
            inset 0 1px 0 rgba(255, 255, 255, 0.06),
            inset 0 0 0 1px rgba(59, 130, 246, 0.12) !important;
        }

        html[data-theme="nocturno"] .orbyx-services-hero-kicker {
          color: rgb(125, 211, 252) !important;
        }

        html[data-theme="nocturno"] .orbyx-services-hero-stat,
        html[data-theme="nocturno"] .orbyx-services-hero-link {
          border-color: rgba(56, 189, 248, 0.18) !important;
          background: rgba(15, 23, 42, 0.66) !important;
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.05);
        }
      `}</style>

      <section
        className="orbyx-services-hero relative overflow-hidden rounded-2xl border px-5 py-4 shadow-[0_18px_46px_-28px_rgba(37,99,235,0.55),0_0_34px_-24px_rgba(56,189,248,0.48)]"
        style={{
          borderColor: "var(--agenda-hero-border, rgba(37,99,235,0.42))",
          background:
            "var(--agenda-hero-bg, linear-gradient(135deg, rgba(248,251,255,0.98), rgba(224,238,255,0.9) 48%, rgba(241,248,255,0.98)))",
        }}
      >
        <div className="pointer-events-none absolute inset-x-8 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(37,99,235,0.42),rgba(34,211,238,0.35),transparent)]" />
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex max-w-3xl items-center gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-blue-300/70 bg-[linear-gradient(135deg,rgb(37_99_235),rgb(14_165_233)_48%,rgb(79_70_229))] text-white shadow-[0_18px_32px_-16px_rgba(37,99,235,0.95),0_0_26px_-12px_rgba(56,189,248,0.85)]">
              <Layers3 className="h-5 w-5" />
            </div>
            <div className="min-w-0">
            <p className="orbyx-services-hero-kicker text-[11px] font-semibold uppercase tracking-[0.24em] text-blue-600">
              Servicios
            </p>

            <h1
  className="mt-0.5 text-xl font-semibold tracking-tight"
              style={{ color: "var(--agenda-hero-title, var(--text-main))" }}
            >
              Servicios del negocio
            </h1>

            <p
              className="mt-0.5 max-w-2xl text-sm leading-5"
              style={{ color: "var(--agenda-hero-muted, var(--text-muted))" }}
            >
              {selectedBranchName
                ? `Gestiona los servicios de la sucursal ${selectedBranchName}.`
                : `Gestiona los servicios que tus clientes podrán reservar en ${
                    loading ? "tu negocio" : businessName
                  }.`}
            </p>
            </div>

            <div className="mt-4">
              <Link
                href={publicUrl}
                target="_blank"
                className="orbyx-services-energy orbyx-services-hero-link inline-flex h-10 items-center justify-center rounded-xl border px-4 text-sm font-medium transition"
                style={{
                  borderColor: "rgba(59,130,246,0.24)",
                  background: "rgba(255,255,255,0.08)",
                  color: "var(--text-main)",
                }}
              >
                Ver página pública
              </Link>
            </div>
          </div>

          <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4 items-stretch">
            <div
              className="orbyx-services-hero-stat rounded-lg border px-3 py-2.5 flex flex-col gap-1"
              style={{
                borderColor: "rgba(59,130,246,0.20)",
                background: "rgba(255,255,255,0.06)",
              }}
            >
              <p
                className="text-[10px] font-medium uppercase tracking-[0.08em] leading-tight"
                style={{ color: "var(--text-muted)" }}
              >
                Total servicios
              </p>
              <p
                className="text-sm font-bold mt-0.5"
                style={{ color: "var(--text-main)" }}
              >
                {loading ? "..." : services.length}
              </p>
            </div>

            <div
              className="orbyx-services-hero-stat rounded-lg border px-3 py-2.5 flex flex-col gap-1"
              style={{
                borderColor: "rgba(59,130,246,0.20)",
                background: "rgba(255,255,255,0.06)",
              }}
            >
              <p
                className="text-[10px] font-medium uppercase tracking-[0.08em] leading-tight"
                style={{ color: "var(--text-muted)" }}
              >
                Activos
              </p>
              <p
                className="text-sm font-bold mt-0.5"
                style={{ color: "var(--text-main)" }}
              >
                {loading ? "..." : activeServicesCount}
              </p>
            </div>

            <div
              className="orbyx-services-hero-stat rounded-lg border px-3 py-2.5 flex flex-col gap-1"
              style={{
                borderColor: "rgba(59,130,246,0.20)",
                background: "rgba(255,255,255,0.06)",
              }}
            >
              <p
                className="text-[10px] font-medium uppercase tracking-[0.08em] leading-tight"
                style={{ color: "var(--text-muted)" }}
              >
                Con descripción
              </p>
              <p
                className="text-sm font-bold mt-0.5"
                style={{ color: "var(--text-main)" }}
              >
                {loading ? "..." : servicesWithDescriptionCount}
              </p>
            </div>

            <div
              className="orbyx-services-hero-stat rounded-lg border px-3 py-2.5 flex flex-col gap-1"
              style={{
                borderColor: "rgba(59,130,246,0.20)",
                background: "rgba(255,255,255,0.06)",
              }}
            >
              <p
                className="text-[10px] font-medium uppercase tracking-[0.08em] leading-tight"
                style={{ color: "var(--text-muted)" }}
              >
                Servicios activos
              </p>
              <p
                className="text-sm font-bold mt-0.5"
                style={{ color: "var(--text-main)" }}
              >
                {loading ? "..." : `${activeServicesCount} · Sin límite`}
              </p>
            </div>
          </div>
        </div>
      </section>

      {loadingBranches && !selectedBranchId ? (
        <div className="rounded-2xl border border-slate-300/60 bg-slate-500/10 px-4 py-3 text-sm shadow-sm">
          <span style={{ color: "var(--text-muted)" }}>
            Cargando sucursal activa...
          </span>
        </div>
      ) : null}

      {!loadingBranches && !selectedBranchId ? (
        <Notice
          tone="warning"
          title="Debes seleccionar una sucursal activa."
          description="Selecciona una sucursal en el sidebar para administrar los servicios."
        />
      ) : null}

{loadError ? <Notice tone="danger" title={loadError} /> : null}


{saveError ? <Notice tone="danger" title={saveError} /> : null}
{saveOk ? <Notice tone="success" title={saveOk} /> : null}

      <section
        className="space-y-6 rounded-3xl border p-6"
        style={{
          borderColor: "var(--border-color)",
          background: "var(--bg-card)",
        }}
      >
        <div>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
            Gestión de servicios
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Administra los servicios disponibles y crea nuevos en un solo lugar.
          </p>
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.3fr_0.7fr]">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                Servicios actuales
              </h3>
              {selectedBranchId && !loading && (
                <button
                  onClick={() => setShowNewGroupInput(true)}
                  className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-xl border border-blue-900/30 hover:border-blue-500/40 transition-colors"
                  style={{ color: "var(--text-muted)" }}
                >
                  <svg
                    width="13"
                    height="13"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    aria-hidden="true"
                  >
                    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
                    <line x1="12" y1="11" x2="12" y2="17" />
                    <line x1="9" y1="14" x2="15" y2="14" />
                  </svg>
                  Nueva categoría
                </button>
              )}
            </div>

            {showNewGroupInput && (
              <div className="flex gap-2 items-center">
                <input
                  autoFocus
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Escape") {
                      setShowNewGroupInput(false);
                      setNewGroupName("");
                    }
                  }}
                  placeholder="Nombre de la categoría..."
                  className="flex-1 border rounded-xl px-3 py-2 text-sm focus:outline-none transition-colors"
                  style={{
                    background: "var(--bg-card)",
                    borderColor: "var(--border-color)",
                    color: "var(--text-main)",
                  }}
                />
                <button
                  onClick={async () => {
                    if (!newGroupName.trim()) return;
                    const res = await apiFetch(`${BACKEND_URL}/service-groups`, {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        tenant_id: tenantId,
                        branch_id: selectedBranchId,
                        name: newGroupName.trim(),
                      }),
                    });
                    const newGroup = await res.json();
                    setGroups((prev) => [...prev, newGroup]);
                    setNewGroupName("");
                    setShowNewGroupInput(false);
                  }}
                  disabled={!newGroupName.trim()}
                  className="px-4 py-2 rounded-xl text-white text-sm font-medium transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                  style={{
                    background:
                      "linear-gradient(135deg, rgb(37 99 235), rgb(59 130 246))",
                  }}
                >
                  Crear
                </button>
                <button
                  onClick={() => {
                    setShowNewGroupInput(false);
                    setNewGroupName("");
                  }}
                  className="px-3 py-2 rounded-xl border text-sm transition-colors"
                  style={{
                    borderColor: "var(--border-color)",
                    color: "var(--text-muted)",
                  }}
                >
                  Cancelar
                </button>
              </div>
            )}

            {!selectedBranchId ? (
              <div className="text-sm text-slate-500">
                Selecciona una sucursal para ver servicios.
              </div>
            ) : loading ? (
              <div className="text-sm text-slate-500">
                Cargando servicios...
              </div>
            ) : (services.length === 0 && groups.length === 0) ? (
              <div className="text-sm text-slate-500">
                No tienes servicios aún.
              </div>
            ) : (
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragStart={handleDragStart}
                onDragOver={handleDragOver}
                onDragEnd={handleDragEnd}
              >
                {groups.map((group) => {
                  const groupServices = services.filter(
                    (s) => s.group_id === group.id
                  );
                  const isCollapsed = collapsedGroups.has(group.id);
                  return (
                    <div
                      key={group.id}
                      className="mb-3 rounded-xl border overflow-hidden"
                      style={{ borderColor: "rgba(37,99,235,0.20)" }}
                    >
                      <div
                        className="flex items-center justify-between px-3 py-2.5 cursor-pointer"
                        style={{ background: "rgba(37,99,235,0.08)" }}
                        onClick={() =>
                          setCollapsedGroups((prev) => {
                            const next = new Set(prev);
                            next.has(group.id)
                              ? next.delete(group.id)
                              : next.add(group.id);
                            return next;
                          })
                        }
                      >
                        <div className="flex items-center gap-2">
                          <svg
                            width="15"
                            height="15"
                            viewBox="0 0 24 24"
                            fill="currentColor"
                            aria-hidden="true"
                            style={{ color: "#f59e0b", flexShrink: 0 }}
                          >
                            <path d="M20 6h-8l-2-2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2z" />
                          </svg>
                          {editingGroupId === group.id ? (
                            <input
                              autoFocus
                              value={editingGroupName}
                              onChange={(e) =>
                                setEditingGroupName(e.target.value)
                              }
                              onBlur={async () => {
                                if (
                                  editingGroupName.trim() &&
                                  editingGroupName !== group.name
                                ) {
                                  await apiFetch(
                                    `${BACKEND_URL}/service-groups/${group.id}`,
                                    {
                                      method: "PATCH",
                                      headers: {
                                        "Content-Type": "application/json",
                                      },
                                      body: JSON.stringify({
                                        name: editingGroupName,
                                        tenant_id: tenantId,
                                      }),
                                    }
                                  );
                                  setGroups((prev) =>
                                    prev.map((g) =>
                                      g.id === group.id
                                        ? { ...g, name: editingGroupName }
                                        : g
                                    )
                                  );
                                }
                                setEditingGroupId(null);
                              }}
                              onKeyDown={(e) =>
                                e.key === "Enter" &&
                                (e.target as HTMLInputElement).blur()
                              }
                              onClick={(e) => e.stopPropagation()}
                              className="bg-transparent border-b text-sm font-medium outline-none px-0"
                              style={{
                                borderColor: "rgba(37,99,235,0.50)",
                                color: "var(--text-main)",
                              }}
                            />
                          ) : (
                            <span
                              className="text-sm font-medium"
                              style={{ color: "var(--text-main)" }}
                            >
                              {group.name}
                            </span>
                          )}
                          <span
                            className="text-[10px] px-1.5 py-0.5 rounded-full border"
                            style={{
                              background: "rgba(37,99,235,0.12)",
                              borderColor: "rgba(37,99,235,0.20)",
                              color: "rgba(96,165,250,0.80)",
                            }}
                          >
                            {groupServices.length}{" "}
                            {groupServices.length === 1
                              ? "servicio"
                              : "servicios"}
                          </span>
                        </div>
                        <div
                          className="flex items-center gap-1"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {canEditServicios ? (
                            <>
                          <button
                            onClick={() => {
                              setEditingGroupId(group.id);
                              setEditingGroupName(group.name);
                            }}
                            className="p-1.5 rounded-lg transition-colors"
                            style={{ color: "var(--text-muted)" }}
                            title="Renombrar"
                          >
                            <svg
                              width="13"
                              height="13"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              aria-hidden="true"
                            >
                              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                            </svg>
                          </button>
                          <button
                            onClick={() =>
                              setConfirmModal({
                                open: true,
                                type: "delete-group",
                                id: group.id,
                                name: group.name,
                              })
                            }
                            className="p-1.5 rounded-lg transition-colors hover:text-red-400"
                            style={{ color: "var(--text-muted)" }}
                            title="Eliminar grupo"
                          >
                            <svg
                              width="13"
                              height="13"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              aria-hidden="true"
                            >
                              <polyline points="3 6 5 6 21 6" />
                              <path d="M19 6l-1 14H6L5 6" />
                              <path d="M10 11v6M14 11v6" />
                              <path d="M9 6V4h6v2" />
                            </svg>
                          </button>
                            </>
                          ) : null}
                          <svg
                            className={`transition-transform ${
                              isCollapsed ? "" : "rotate-180"
                            }`}
                            width="14"
                            height="14"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            style={{ color: "var(--text-muted)" }}
                            aria-hidden="true"
                          >
                            <polyline points="6 9 12 15 18 9" />
                          </svg>
                        </div>
                      </div>
                      {!isCollapsed && (
                        <SortableContext
                          items={groupServices.map((s) => s.id)}
                          strategy={verticalListSortingStrategy}
                        >
                          <GroupDropZone groupId={group.id}>
                            {groupServices.length === 0 ? (
                              <div
                                className="px-3 py-5 text-center text-xs border-b"
                                style={{
                                  color: "var(--text-muted)",
                                  borderColor: "var(--border-color)",
                                }}
                              >
                                Arrastra servicios aquí
                              </div>
                            ) : (
                              groupServices.map((service) =>
                                renderServiceItem(service)
                              )
                            )}
                          </GroupDropZone>
                        </SortableContext>
                      )}
                    </div>
                  );
                })}
                {(() => {
                  const ungrouped = services.filter((s) => !s.group_id);
                  const isCollapsed = collapsedGroups.has("none");
                  return (
                    <div
                      className="mb-3 rounded-xl border border-dashed overflow-hidden"
                      style={{ borderColor: "var(--border-color)" }}
                    >
                      <div
                        className="flex items-center justify-between px-3 py-2.5 cursor-pointer"
                        onClick={() =>
                          setCollapsedGroups((prev) => {
                            const next = new Set(prev);
                            next.has("none")
                              ? next.delete("none")
                              : next.add("none");
                            return next;
                          })
                        }
                      >
                        <div className="flex items-center gap-2">
                          <svg
                            width="15"
                            height="15"
                            viewBox="0 0 24 24"
                            fill="currentColor"
                            aria-hidden="true"
                            style={{ color: "#64748b", flexShrink: 0 }}
                          >
                            <path d="M20 6h-8l-2-2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2z" />
                          </svg>
                          <span
                            className="text-sm"
                            style={{ color: "var(--text-muted)" }}
                          >
                            Sin categoría
                          </span>
                          <span
                            className="text-[10px] px-1.5 py-0.5 rounded-full border"
                            style={{
                              background: "rgba(0,0,0,0.10)",
                              borderColor: "var(--border-color)",
                              color: "var(--text-muted)",
                            }}
                          >
                            {ungrouped.length}{" "}
                            {ungrouped.length === 1 ? "servicio" : "servicios"}
                          </span>
                        </div>
                        <svg
                          className={`transition-transform ${
                            isCollapsed ? "" : "rotate-180"
                          }`}
                          width="14"
                          height="14"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          style={{ color: "var(--text-muted)" }}
                          aria-hidden="true"
                        >
                          <polyline points="6 9 12 15 18 9" />
                        </svg>
                      </div>
                      {!isCollapsed && (
                        <SortableContext
                          items={ungrouped.map((s) => s.id)}
                          strategy={verticalListSortingStrategy}
                        >
                          <GroupDropZone groupId="none">
                            {ungrouped.length === 0 ? (
                              <div
                                className="px-3 py-5 text-center text-xs"
                                style={{ color: "var(--text-muted)" }}
                              >
                                Arrastra servicios aquí
                              </div>
                            ) : (
                              ungrouped.map((service) =>
                                renderServiceItem(service)
                              )
                            )}
                          </GroupDropZone>
                        </SortableContext>
                      )}
                    </div>
                  );
                })()}
                <DragOverlay>
                  {activeService ? (
                    <div
                      className="flex items-center gap-2 px-3 py-2.5 rounded-xl border border-blue-500/40 shadow-lg"
                      style={{ background: "var(--bg-card)" }}
                    >
                      <p
                        className="text-sm font-medium"
                        style={{ color: "var(--text-main)" }}
                      >
                        {activeService.name}
                      </p>
                      <p
                        className="text-xs"
                        style={{ color: "var(--text-muted)" }}
                      >
                        · {activeService.duration_minutes} min
                      </p>
                    </div>
                  ) : null}
                </DragOverlay>
              </DndContext>
            )}
          </div>
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
              Crear servicio
            </h3>

            <div className="space-y-4">
              <input
                placeholder="Nombre del servicio"
                value={form.name}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, name: e.target.value }))
                }
                className="w-full rounded-xl border px-4 py-2 text-sm placeholder:text-slate-400 dark:placeholder:text-slate-500"
                style={{
                  borderColor: "var(--border-color)",
                  background: "var(--bg-card)",
                  color: "var(--text-main)",
                }}
              />

              <textarea
                placeholder="Descripción"
                value={form.description}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, description: e.target.value }))
                }
                className="w-full rounded-xl border px-4 py-2 text-sm placeholder:text-slate-400 dark:placeholder:text-slate-500"
                style={{
                  borderColor: "var(--border-color)",
                  background: "var(--bg-card)",
                  color: "var(--text-main)",
                }}
              />

              <div className="space-y-1">
                <label
                  className="text-xs font-medium"
                  style={{ color: "var(--text-muted)" }}
                >
                  Instrucciones para el cliente (opcional)
                </label>
                <textarea
                  placeholder="Ej: Trae tu carnet de identidad"
                  value={form.customer_instructions}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      customer_instructions: e.target.value,
                    }))
                  }
                  className="w-full rounded-xl border px-4 py-2 text-sm placeholder:text-slate-400 dark:placeholder:text-slate-500"
                  style={{
                    borderColor: "var(--border-color)",
                    background: "var(--bg-card)",
                    color: "var(--text-main)",
                  }}
                />
                <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>
                  Se incluye en el email de confirmación de la reserva.
                </p>
              </div>

              <div className="space-y-1">
                <label
                  className="text-xs font-medium"
                  style={{ color: "var(--text-muted)" }}
                >
                  Duración del servicio (min)
                </label>
                <input
                  type="number"
                  min="1"
                  placeholder="Duración del servicio (min)"
                  value={form.duration_minutes}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      duration_minutes: e.target.value,
                    }))
                  }
                  className="w-full rounded-xl border px-4 py-2 text-sm placeholder:text-slate-400 dark:placeholder:text-slate-500"
                  style={{
                    borderColor: "var(--border-color)",
                    background: "var(--bg-card)",
                    color: "var(--text-main)",
                  }}
                />
              </div>

              <div className="space-y-1">
                <label
                  className="text-xs font-medium"
                  style={{ color: "var(--text-muted)" }}
                >
                  Precio
                </label>
                <input
                  type="number"
                  placeholder="Precio"
                  value={form.price}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, price: e.target.value }))
                  }
                  className="w-full rounded-xl border px-4 py-2 text-sm placeholder:text-slate-400 dark:placeholder:text-slate-500"
                  style={{
                    borderColor: "var(--border-color)",
                    background: "var(--bg-card)",
                    color: "var(--text-main)",
                  }}
                />
              </div>




{isGroupBookingBusiness ? (
  <div className="space-y-2">
    <label
      className={`orbyx-services-energy flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-medium ${
        form.is_group ? "orbyx-services-energy-active" : ""
      }`}
      style={{
        borderColor: form.is_group
          ? "rgba(37,99,235,0.55)"
          : "var(--border-color)",
        background: form.is_group ? "rgba(37,99,235,0.10)" : "var(--bg-card)",
        color: "var(--text-main)",
      }}
    >
      <input
        type="checkbox"
        checked={form.is_group}
        onChange={(e) =>
          setForm((prev) => ({
            ...prev,
            is_group: e.target.checked,
          }))
        }
      />
      Servicio grupal (clases, talleres, etc.)
    </label>

    {form.is_group && (
      <div className="space-y-1">
        <label
          className="text-xs font-medium"
          style={{ color: "var(--text-muted)" }}
        >
          Capacidad máxima
        </label>
        <input
          type="number"
          min="1"
          value={form.capacity}
          onChange={(e) =>
            setForm((prev) => ({
              ...prev,
              capacity: e.target.value,
            }))
          }
          className="w-full rounded-xl border px-4 py-2 text-sm"
          style={{
            borderColor: "var(--border-color)",
            background: "var(--bg-card)",
            color: "var(--text-main)",
          }}
        />
      </div>
    )}
  </div>
) : null}


              {staff.length > 0 && (
                <div className="space-y-2">
                  <label className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>
                    Profesionales que realizan este servicio
                  </label>
                  <div className="space-y-1.5">
                    {staff.map((member) => (
                      <label
                        key={member.id}
                        className="flex items-center gap-2.5 rounded-xl border px-3 py-2 text-sm cursor-pointer transition-colors"
                        style={{
                          borderColor: form.staff_ids.includes(member.id)
                            ? "rgba(37,99,235,0.50)"
                            : "var(--border-color)",
                          background: form.staff_ids.includes(member.id)
                            ? "rgba(37,99,235,0.08)"
                            : "var(--bg-card)",
                          color: "var(--text-main)",
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={form.staff_ids.includes(member.id)}
                          onChange={() => toggleCreateStaff(member.id)}
                          className="accent-blue-500"
                        />
                        {member.name}
                      </label>
                    ))}
                  </div>
                  <p className="text-xs leading-5" style={{ color: "var(--text-muted)" }}>
                    Cada servicio debe tener al menos un profesional asignado para aparecer en tu página pública. Esta regla aplica también para servicios que crees en el futuro.
                  </p>
                </div>
              )}

              <button
                type="button"
                onClick={handleCreateService}
                disabled={saving || loading || !canEditServicios}
                className="orbyx-services-energy w-full rounded-xl border py-3 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-60"
                style={{
                  borderColor: "rgba(147,197,253,0.36)",
                  background:
                    "linear-gradient(135deg, rgb(37 99 235), rgb(59 130 246), rgb(14 165 233))",
                  boxShadow: "0 14px 30px rgba(37,99,235,0.28)",
                }}
              >
                {saving ? "Guardando..." : "Crear servicio"}
              </button>
            </div>
          </div>
        </div>
      </section>

      {confirmModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() =>
              setConfirmModal({ open: false, type: null, id: null, name: null })
            }
          />
          <div className="relative z-10 bg-[#0f1729] border border-blue-900/40 rounded-2xl p-6 w-full max-w-sm mx-4 shadow-2xl shadow-blue-950/50">
            <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 bg-red-500/10 border border-red-500/30">
              <svg
                className="w-6 h-6 text-red-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6l-1 14H6L5 6" />
                <path d="M10 11v6M14 11v6" />
                <path d="M9 6V4h6v2" />
              </svg>
            </div>
            <h3 className="text-white font-semibold text-center text-lg mb-1">
              {confirmModal.type === "delete-service"
                ? "Eliminar servicio"
                : "Eliminar categoría"}
            </h3>
            <p className="text-gray-400 text-sm text-center mb-6">
              {confirmModal.type === "delete-service" ? (
                <>
                  ¿Confirmas eliminar{" "}
                  <span className="text-white font-medium">
                    &quot;{confirmModal.name}&quot;
                  </span>
                  ? Los turnos ya agendados no se verán afectados.
                </>
              ) : (
                <>
                  ¿Confirmas eliminar la categoría{" "}
                  <span className="text-white font-medium">
                    &quot;{confirmModal.name}&quot;
                  </span>
                  ? Los servicios quedarán sin categoría.
                </>
              )}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() =>
                  setConfirmModal({
                    open: false,
                    type: null,
                    id: null,
                    name: null,
                  })
                }
                className="flex-1 py-2.5 rounded-xl border border-blue-900/40 text-gray-400 hover:text-white hover:border-blue-700/60 text-sm font-medium transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={async () => {
                  if (confirmModal.type === "delete-service" && confirmModal.id) {
                    await handleDeleteService(confirmModal.id);
                  } else if (confirmModal.id) {
                    await apiFetch(
                      `${BACKEND_URL}/service-groups/${confirmModal.id}?tenant_id=${tenantId}`,
                      { method: "DELETE" }
                    );
                    setGroups((prev) =>
                      prev.filter((g) => g.id !== confirmModal.id)
                    );
                    setServices((prev) =>
                      prev.map((s) =>
                        s.group_id === confirmModal.id
                          ? { ...s, group_id: null }
                          : s
                      )
                    );
                  }
                  setConfirmModal({
                    open: false,
                    type: null,
                    id: null,
                    name: null,
                  });
                }}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30 hover:border-red-500/50 transition-colors"
              >
                Sí, eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
