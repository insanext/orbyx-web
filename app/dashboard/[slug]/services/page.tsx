"use client";

import { CSSProperties, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Panel } from "../../../../components/dashboard/panel";

type BusinessResponse = {
  business: {
    id: string;
    name: string;
    slug: string;
    plan_slug?: string | null;
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

export default function ServicesPage() {
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

const [form, setForm] = useState({
  name: "",
  description: "",
  duration_minutes: "30",
  price: "",
  staff_ids: [] as string[],
  is_group: false,
  capacity: "1",
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
});

  const publicUrl = useMemo(() => `https://orbyx.cl/${slug}`, [slug]);

  const branchStorageKey = useMemo(() => {
    return slug ? `orbyx_active_branch_${slug}` : "";
  }, [slug]);

  const planCaps: Record<string, { max_services: number }> = {
    pro: { max_services: 10 },
    premium: { max_services: 25 },
    vip: { max_services: 50 },
    platinum: { max_services: 100 },
  };

  const caps = planCaps[plan] || planCaps.pro;
  const maxServices = caps.max_services;

  const servicesLimitReached = services.length >= maxServices;
  const servicesRemainingCount = Math.max(0, maxServices - services.length);

  const activeServicesCount = services.filter((service) => service.active).length;
  const servicesWithDescriptionCount = services.filter(
    (service) => String(service.description || "").trim() !== ""
  ).length;

  const excessServices = Math.max(0, activeServicesCount - maxServices);
  const hasExcess = excessServices > 0;

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
    const [servicesRes, staffRes, staffServicesRes] = await Promise.all([
      fetch(
        `${BACKEND_URL}/services?tenant_id=${currentTenantId}&branch_id=${currentBranchId}`
      ),
      fetch(
        `${BACKEND_URL}/staff?tenant_id=${currentTenantId}&branch_id=${currentBranchId}&active=true`
      ),
      fetch(`${BACKEND_URL}/staff-services?tenant_id=${currentTenantId}`),
    ]);

    const servicesData: { services?: Service[]; error?: string } =
      await servicesRes.json();
    const staffData: { staff?: StaffItem[]; error?: string } =
      await staffRes.json();
    const staffServicesData: {
      staff_services?: StaffServiceItem[];
      error?: string;
    } = await staffServicesRes.json();

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
        const response = await fetch(`${BACKEND_URL}/services/${service.id}`, {
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

      const response = await fetch(
        `${BACKEND_URL}/branches?tenant_id=${currentTenantId}`
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || "No se pudieron cargar las sucursales");
      }

      const rows: BranchItem[] = Array.isArray(data?.branches) ? data.branches : [];
      setBranches(rows);

      if (rows.length === 0) {
        setSelectedBranchId("");
        return;
      }

      const storedBranchId = readStoredBranchId();
      const storedExists = rows.some(
        (branch: BranchItem) => branch.id === storedBranchId
      );

      if (storedExists) {
        setSelectedBranchId(storedBranchId);
        return;
      }

      const fallbackBranchId = rows[0].id;
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
setBusinessName(businessData.business.name || slug || "");
setGoogleConnected(Boolean(businessData.google_connected));
setPlan(normalizePlanSlug(businessData.business.plan_slug));

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

      const response = await fetch(`${BACKEND_URL}/staff-services`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          tenant_id: tenantId,
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

      if (servicesLimitReached || hasExcess) {
        throw new Error("No puedes crear más servicios con tu plan actual");
      }

      if (!form.name.trim()) {
        throw new Error("Debes ingresar el nombre del servicio");
      }

      if (!form.duration_minutes.trim()) {
        throw new Error("Debes ingresar la duración");
      }

      const response = await fetch(`${BACKEND_URL}/services`, {
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

  is_group: form.is_group,
  capacity: Number(form.capacity || 1),
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

      const response = await fetch(`${BACKEND_URL}/services/${serviceId}`, {
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
  is_group: editForm.is_group,
  capacity: Number(editForm.capacity || 1),
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

      const confirmed = window.confirm(
        "¿Seguro que deseas eliminar este servicio?"
      );

      if (!confirmed) return;

      setSaving(true);

      const response = await fetch(`${BACKEND_URL}/services/${serviceId}`, {
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
      <section
        className="overflow-hidden rounded-[24px] border p-4 shadow-sm"
        style={{
          borderColor: "rgba(59,130,246,0.25)",
          background:
            "linear-gradient(135deg, rgba(37,99,235,0.18), rgba(14,165,233,0.08) 35%, var(--bg-card) 85%)",
        }}
      >
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-3xl">
            <p
              className="mb-2 text-xs font-semibold uppercase tracking-[0.22em]"
              style={{ color: "var(--text-muted)" }}
            >
              Servicios
            </p>

            <h1
  className="text-2xl font-semibold tracking-tight sm:text-3xl"
              style={{ color: "var(--text-main)" }}
            >
              Servicios del negocio
            </h1>

            <p
              className="mt-3 max-w-2xl text-sm leading-6 sm:text-[15px]"
              style={{ color: "var(--text-muted)" }}
            >
              {selectedBranchName
                ? `Gestiona los servicios de la sucursal ${selectedBranchName}.`
                : `Gestiona los servicios que tus clientes podrán reservar en ${
                    loading ? "tu negocio" : businessName
                  }.`}
            </p>

            <div className="mt-4">
              <Link
                href={publicUrl}
                target="_blank"
                className="inline-flex h-10 items-center justify-center rounded-xl border px-4 text-sm font-medium transition"
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

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <div
              className="rounded-xl border px-3 py-2"

              style={{
                borderColor: "rgba(59,130,246,0.24)",
                background: "rgba(255,255,255,0.08)",
              }}
            >
              <p
                className="text-[11px] font-semibold uppercase tracking-[0.16em]"
                style={{ color: "var(--text-muted)" }}
              >
                Total servicios
              </p>
              <p
                className="mt-2 text-sm font-semibold"
                style={{ color: "var(--text-main)" }}
              >
                {loading ? "..." : services.length}
              </p>
            </div>

            <div
              className="rounded-xl border px-3 py-2"
              style={{
                borderColor: "rgba(59,130,246,0.24)",
                background: "rgba(255,255,255,0.08)",
              }}
            >
              <p
                className="text-[11px] font-semibold uppercase tracking-[0.16em]"
                style={{ color: "var(--text-muted)" }}
              >
                Activos
              </p>
              <p
                className="mt-2 text-sm font-semibold"
                style={{ color: "var(--text-main)" }}
              >
                {loading ? "..." : activeServicesCount}
              </p>
            </div>

            <div
              className="rounded-2xl border px-3 py-2"
              style={{
                borderColor: "rgba(59,130,246,0.24)",
                background: "rgba(255,255,255,0.08)",
              }}
            >
              <p
                className="text-[11px] font-semibold uppercase tracking-[0.16em]"
                style={{ color: "var(--text-muted)" }}
              >
                Con descripción
              </p>
              <p
                className="mt-2 text-sm font-semibold"
                style={{ color: "var(--text-main)" }}
              >
                {loading ? "..." : servicesWithDescriptionCount}
              </p>
            </div>

            <div
              className="rounded-2xl border px-3 py-2"
              style={{
                borderColor: "rgba(59,130,246,0.24)",
                background: "rgba(255,255,255,0.08)",
              }}
            >
              <p
                className="text-[11px] font-semibold uppercase tracking-[0.16em]"
                style={{ color: "var(--text-muted)" }}
              >
                Límite del plan
              </p>
              <p
                className="mt-2 text-sm font-semibold"
                style={{ color: "var(--text-main)" }}
              >
                {loading ? "..." : `${activeServicesCount}/${maxServices}`}
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

{!loading && !googleConnected ? (
  <Notice
    tone="danger"
    title="Google Calendar no está conectado"
    description="Conecta Google Calendar para evitar problemas de sincronización y asegurar que las reservas se gestionen correctamente."
  />
) : null}

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
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
              Servicios actuales
            </h3>

            {!selectedBranchId ? (
              <div className="text-sm text-slate-500">
                Selecciona una sucursal para ver servicios.
              </div>
            ) : loading ? (
              <div className="text-sm text-slate-500">
                Cargando servicios...
              </div>
            ) : services.length === 0 ? (
              <div className="text-sm text-slate-500">
                No tienes servicios aún.
              </div>
            ) : (
              <div className="space-y-4">
                {services.map((service) => {
                  const assignedStaffNames = getStaffNamesForService(service.id);

                  return (
                    <div
                      key={service.id}
                      className="rounded-2xl border p-4"
                      style={{
                        borderColor:
                          editingId === service.id
                            ? "rgba(37,99,235,0.35)"
                            : "var(--border-color)",
                        background:
                          editingId === service.id
                            ? "linear-gradient(135deg, rgba(37,99,235,0.10), rgba(14,165,233,0.05), var(--bg-soft))"
                            : "var(--bg-soft)",
                      }}
                    >
                      {editingId === service.id ? (
                        <div className="space-y-4">
                          <div className="flex items-center justify-between gap-3">
                            <div>
                              <p
                                className="font-semibold"
                                style={{ color: "var(--text-main)" }}
                              >
                                Editando servicio
                              </p>
                              <p
                                className="text-sm"
                                style={{ color: "var(--text-muted)" }}
                              >
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
                              setEditForm((prev) => ({
                                ...prev,
                                description: e.target.value,
                              }))
                            }
                            placeholder="Descripción"
                            className="w-full rounded-xl border px-4 py-2 text-sm placeholder:text-slate-400 dark:placeholder:text-slate-500"
                            style={{
                              borderColor: "var(--border-color)",
                              background: "var(--bg-card)",
                              color: "var(--text-main)",
                            }}
                          />

                          <div className="grid gap-3 md:grid-cols-2">
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
                              <label
                                className="text-xs font-medium"
                                style={{ color: "var(--text-muted)" }}
                              >
                                Precio
                              </label>
                              <input
                                type="number"
                                min="0"
                                value={editForm.price}
                                onChange={(e) =>
                                  setEditForm((prev) => ({
                                    ...prev,
                                    price: e.target.value,
                                  }))
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

                          <div className="space-y-2">
                            <label className="flex items-center gap-2 text-sm font-medium">
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

                            {editForm.is_group && (
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
                            )}
                          </div>

                          <div className="flex flex-wrap gap-3">
                            <button
                              type="button"
                              onClick={() => handleSaveEdit(service.id)}
                              disabled={saving}
                              className="inline-flex h-10 items-center justify-center rounded-xl px-4 text-sm font-medium text-white transition disabled:opacity-60"
                              style={{
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
                              className="inline-flex h-10 items-center justify-center rounded-xl border px-4 text-sm font-medium transition disabled:opacity-60"
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
                      ) : (
                        <>
                          <div className="flex items-start justify-between">
                            <div>
                              <p
                                className="font-semibold"
                                style={{ color: "var(--text-main)" }}
                              >
                                {service.name}
                              </p>
                              <p
                                className="text-sm"
                                style={{ color: "var(--text-muted)" }}
                              >
                                {service.description || "Sin descripción"}
                              </p>
                            </div>

                            <button
                              type="button"
                              onClick={() => startEditing(service)}
                              className="inline-flex h-9 cursor-pointer items-center justify-center rounded-xl border px-4 text-sm font-semibold transition hover:opacity-90"
                              style={{
                                borderColor: "rgba(37,99,235,0.28)",
                                background:
                                  "linear-gradient(135deg, rgba(37,99,235,0.14), rgba(14,165,233,0.10))",
                                color: "rgb(37 99 235)",
                                boxShadow: "0 6px 18px rgba(37,99,235,0.10)",
                              }}
                              aria-label={`Editar servicio ${service.name}`}
                            >
                              Editar servicio
                            </button>
                          </div>

                          <div
                            className="mt-3 text-xs"
                            style={{ color: "var(--text-muted)" }}
                          >
                            {service.duration_minutes} min · {formatPrice(service.price)}
                          </div>

                          <div
                            className="mt-2 text-xs"
                            style={{ color: "var(--text-muted)" }}
                          >
                            {assignedStaffNames.length > 0
                              ? assignedStaffNames.join(", ")
                              : "Sin staff"}
                          </div>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
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

<div className="space-y-2">
  <label className="flex items-center gap-2 text-sm font-medium">
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


              <button
                type="button"
                onClick={handleCreateService}
                disabled={saving || loading || servicesLimitReached || hasExcess}
                className="w-full rounded-xl py-3 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-60"
                style={{
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
    </div>
  );
}