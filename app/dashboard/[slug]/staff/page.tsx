"use client";

import { CSSProperties, useEffect, useMemo, useState } from "react";
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

type BranchItem = {
  id: string;
  tenant_id?: string;
  name: string;
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
  use_business_hours?: boolean;
  created_at?: string;
  updated_at?: string;
};

type StaffHourItem = {
  day_of_week: number;
  enabled: boolean;
  start_time: string | null;
  end_time: string | null;
};

type StaffSpecialDateItem = {
  id?: string;
  tenant_id?: string;
  staff_id?: string;
  date: string;
  label?: string | null;
  is_closed: boolean;
  start_time: string | null;
  end_time: string | null;
};

type ServiceItem = {
  id: string;
  tenant_id: string;
  name: string;
  duration_minutes?: number | null;
  price?: number | null;
  active?: boolean;
};

type NoticeTone =
  | "info"
  | "success"
  | "warning"
  | "limit"
  | "danger"
  | "neutral";

const BACKEND_URL = "https://orbyx-backend.onrender.com";

const days = [
  { value: 0, label: "Domingo" },
  { value: 1, label: "Lunes" },
  { value: 2, label: "Martes" },
  { value: 3, label: "Miércoles" },
  { value: 4, label: "Jueves" },
  { value: 5, label: "Viernes" },
  { value: 6, label: "Sábado" },
];

const defaultHours: StaffHourItem[] = days.map((day) => ({
  day_of_week: day.value,
  enabled: false,
  start_time: "09:00",
  end_time: "18:00",
}));

const emptyForm = {
  name: "",
  role: "",
  email: "",
  phone: "",
  color: "#0f172a",
  is_active: true,
  sort_order: 0,
  use_business_hours: true,
};

const emptySpecialDateForm: StaffSpecialDateItem = {
  date: "",
  label: "",
  is_closed: true,
  start_time: "09:00",
  end_time: "18:00",
};

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
    { border: string; background: string; accent: string; text: string }
  > = {
    info: {
      border: "rgba(34,197,94,0.34)",
      background:
        "linear-gradient(135deg, rgba(34,197,94,0.12), rgba(34,197,94,0.05))",
      accent: "rgb(34 197 94)",
      text: "var(--text-main)",
    },
    success: {
      border: "rgba(16,185,129,0.34)",
      background:
        "linear-gradient(135deg, rgba(16,185,129,0.12), rgba(16,185,129,0.05))",
      accent: "rgb(16 185 129)",
      text: "var(--text-main)",
    },
    warning: {
      border: "rgba(245,158,11,0.34)",
      background:
        "linear-gradient(135deg, rgba(245,158,11,0.12), rgba(245,158,11,0.05))",
      accent: "rgb(245 158 11)",
      text: "var(--text-main)",
    },
    limit: {
      border: "rgba(249,115,22,0.34)",
      background:
        "linear-gradient(135deg, rgba(249,115,22,0.12), rgba(249,115,22,0.05))",
      accent: "rgb(249 115 22)",
      text: "var(--text-main)",
    },
    danger: {
      border: "rgba(244,63,94,0.34)",
      background:
        "linear-gradient(135deg, rgba(244,63,94,0.12), rgba(244,63,94,0.05))",
      accent: "rgb(244 63 94)",
      text: "var(--text-main)",
    },
    neutral: {
      border: "var(--border-color)",
      background: "var(--bg-soft)",
      accent: "var(--text-main)",
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

export default function StaffPage() {
  const params = useParams();
  const slug =
    ((params as { slug?: string })?.slug as string) ||
    ((params as { Slug?: string })?.Slug as string) ||
    "";

  const [tenantId, setTenantId] = useState("");
  const [branches, setBranches] = useState<BranchItem[]>([]);
  const [selectedBranchId, setSelectedBranchId] = useState("");
  const [loadingBranches, setLoadingBranches] = useState(false);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [saveError, setSaveError] = useState("");
  const [saveOk, setSaveOk] = useState("");

  const [staff, setStaff] = useState<StaffItem[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [form, setForm] = useState(emptyForm);
  const [staffHours, setStaffHours] = useState<StaffHourItem[]>(defaultHours);
  const [staffSpecialDates, setStaffSpecialDates] = useState<
    StaffSpecialDateItem[]
  >([]);
  const [specialDateForm, setSpecialDateForm] =
    useState<StaffSpecialDateItem>(emptySpecialDateForm);
  const [specialDateSaving, setSpecialDateSaving] = useState(false);
  const [editingSpecialDateId, setEditingSpecialDateId] = useState<
    string | null
  >(null);

  const [services, setServices] = useState<ServiceItem[]>([]);
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([]);

  const [plan, setPlan] = useState("pro");
  const [selectedStaffToKeep, setSelectedStaffToKeep] = useState<string[]>([]);

  const branchStorageKey = useMemo(() => {
    return slug ? `orbyx_active_branch_${slug}` : "";
  }, [slug]);

  const activeCount = useMemo(
    () => staff.filter((item) => item.is_active).length,
    [staff]
  );

  const usingBusinessHoursCount = useMemo(
    () => staff.filter((item) => item.use_business_hours).length,
    [staff]
  );

  const selectedBranchName =
    branches.find((branch) => branch.id === selectedBranchId)?.name || "";

  const planCaps: Record<string, { max_staff: number }> = {
    pro: { max_staff: 2 },
    premium: { max_staff: 5 },
    vip: { max_staff: 10 },
    platinum: { max_staff: 20 },
  };

  const caps = planCaps[plan] || planCaps.pro;
  const reachedLimit = activeCount >= caps.max_staff;
  const excessStaff = Math.max(0, activeCount - caps.max_staff);
  const hasExcess = excessStaff > 0;

  const inputClass =
    "h-11 w-full rounded-2xl border px-4 text-sm outline-none transition";
  const primaryButtonClass =
    "inline-flex h-11 items-center justify-center rounded-2xl px-5 text-sm font-medium text-white transition disabled:cursor-not-allowed disabled:opacity-60";
  const secondaryButtonClass =
    "inline-flex h-11 items-center justify-center rounded-2xl border px-5 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-60";

  function readStoredBranchId() {
    if (typeof window === "undefined" || !branchStorageKey) return "";
    return localStorage.getItem(branchStorageKey) || "";
  }

  useEffect(() => {
    if (hasExcess) {
      const activeStaff = staff.filter((s) => s.is_active);
      const allowed = activeStaff.slice(0, caps.max_staff).map((s) => s.id);
      setSelectedStaffToKeep(allowed);
    } else {
      setSelectedStaffToKeep([]);
    }
  }, [hasExcess, staff, caps.max_staff]);

  useEffect(() => {
    async function loadPage() {
      try {
        setLoading(true);
        setLoadError("");

        const res = await fetch(`${BACKEND_URL}/public/business/${slug}`);
        const data: BusinessResponse | { error?: string } = await res.json();

        if (!res.ok) {
          throw new Error(
            "error" in data && data.error
              ? data.error
              : "No se pudo cargar el negocio"
          );
        }

        if (!("business" in data)) {
          throw new Error("Respuesta inválida del backend");
        }

        setTenantId(data.business.id);
        setPlan(normalizePlanSlug(data.business.plan_slug));
        await loadBranches(data.business.id);
      } catch (error: unknown) {
        setLoadError(
          error instanceof Error
            ? error.message
            : "No se pudo cargar el módulo staff"
        );
      } finally {
        setLoading(false);
      }
    }

    if (slug) {
      loadPage();
    }
  }, [slug]);

  useEffect(() => {
    if (!tenantId) return;

    if (!selectedBranchId) {
      setStaff([]);
      setServices([]);
      resetForm();
      return;
    }

    async function loadData() {
      try {
        setLoadError("");
        await Promise.all([loadStaff(tenantId), loadServices(tenantId)]);
      } catch (error: unknown) {
        setLoadError(
          error instanceof Error
            ? error.message
            : "No se pudo cargar staff o servicios"
        );
      }
    }

    loadData();
  }, [tenantId, selectedBranchId]);

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
      resetForm();
    }

    function handleStorage(event: StorageEvent) {
      if (event.key !== branchStorageKey) return;

      const nextBranchId = event.newValue || "";
      setSelectedBranchId(nextBranchId);
      resetForm();
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

  async function loadStaff(id: string) {
    if (!selectedBranchId) {
      setStaff([]);
      return;
    }

    const res = await fetch(
      `${BACKEND_URL}/staff?tenant_id=${id}&branch_id=${selectedBranchId}`
    );
    const data = await res.json();

    if (!res.ok) {
      throw new Error(data?.error || "No se pudo cargar el staff");
    }

    setStaff(Array.isArray(data.staff) ? data.staff : []);
  }

  async function loadStaffHours(id: string, staffId: string) {
    const res = await fetch(
      `${BACKEND_URL}/staff-hours?tenant_id=${id}&staff_id=${staffId}`
    );

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data?.error || "No se pudo cargar staff_hours");
    }

    const rows = Array.isArray(data?.hours) ? data.hours : [];

    const merged = days.map((day) => {
      const found = rows.find(
        (row: { day_of_week: number }) =>
          Number(row.day_of_week) === Number(day.value)
      );

      return {
        day_of_week: day.value,
        enabled: found ? Boolean(found.enabled) : false,
        start_time: found?.start_time || "09:00",
        end_time: found?.end_time || "18:00",
      };
    });

    setStaffHours(merged);
  }

  async function loadStaffSpecialDates(id: string, staffId: string) {
    const res = await fetch(
      `${BACKEND_URL}/staff-special-dates?tenant_id=${id}&staff_id=${staffId}`
    );

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data?.error || "No se pudo cargar staff_special_dates");
    }

    setStaffSpecialDates(
      Array.isArray(data?.special_dates) ? data.special_dates : []
    );
  }

  async function loadServices(id: string) {
    if (!selectedBranchId) {
      setServices([]);
      return;
    }

    const res = await fetch(
      `${BACKEND_URL}/services?tenant_id=${id}&branch_id=${selectedBranchId}&active=true`
    );
    const data = await res.json();

    if (!res.ok) {
      throw new Error(data?.error || "No se pudo cargar los servicios");
    }

    setServices(Array.isArray(data?.services) ? data.services : []);
  }

  async function loadBranches(currentTenantId: string) {
    try {
      setLoadingBranches(true);

      const res = await fetch(
        `${BACKEND_URL}/branches?tenant_id=${currentTenantId}`
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "Error cargando sucursales");
      }

      const rows: BranchItem[] = Array.isArray(data.branches)
        ? data.branches
        : [];
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
    } catch (err) {
      console.error("Error cargando branches", err);
      setBranches([]);
      setSelectedBranchId("");
    } finally {
      setLoadingBranches(false);
    }
  }

  async function loadStaffServices(id: string, staffId: string) {
    const res = await fetch(
      `${BACKEND_URL}/staff-services?tenant_id=${id}&staff_id=${staffId}`
    );

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data?.error || "No se pudo cargar staff_services");
    }

    const rows = Array.isArray(data?.staff_services) ? data.staff_services : [];

    setSelectedServiceIds(
      rows
        .map((item: { service_id?: string }) => item.service_id)
        .filter((value: unknown): value is string => typeof value === "string")
    );
  }

  async function saveStaffServices(staffId: string) {
    const payload = {
      tenant_id: tenantId,
      staff_id: staffId,
      service_ids: selectedServiceIds,
    };

    const res = await fetch(`${BACKEND_URL}/staff-services`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data?.error || "No se pudo guardar staff_services");
    }
  }

  function toggleService(serviceId: string) {
    setSelectedServiceIds((prev) =>
      prev.includes(serviceId)
        ? prev.filter((id) => id !== serviceId)
        : [...prev, serviceId]
    );
  }

  function resetSpecialDateForm() {
    setSpecialDateForm(emptySpecialDateForm);
    setEditingSpecialDateId(null);
  }

  function toggleStaffSelection(staffId: string) {
    setSelectedStaffToKeep((prev) =>
      prev.includes(staffId)
        ? prev.filter((id) => id !== staffId)
        : [...prev, staffId]
    );
  }

  async function applyStaffAdjustment() {
    try {
      const toDeactivate = staff.filter(
        (s) => s.is_active && !selectedStaffToKeep.includes(s.id)
      );

      if (toDeactivate.length === 0) {
        alert("No hay profesionales para desactivar");
        return;
      }

      const confirmAction = confirm(
        `Se desactivarán ${toDeactivate.length} profesionales. ¿Continuar?`
      );

      if (!confirmAction) return;

      for (const staffItem of toDeactivate) {
        const res = await fetch(`${BACKEND_URL}/staff/${staffItem.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            tenant_id: staffItem.tenant_id,
            branch_id: staffItem.branch_id || selectedBranchId,
            name: staffItem.name,
            role: staffItem.role || "",
            email: staffItem.email || "",
            phone: staffItem.phone || "",
            color: staffItem.color || "#0f172a",
            is_active: false,
            sort_order: Number(staffItem.sort_order || 0),
            use_business_hours:
              staffItem.use_business_hours === undefined
                ? true
                : Boolean(staffItem.use_business_hours),
          }),
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data?.error || `Error desactivando ${staffItem.name}`);
        }
      }

      await loadStaff(tenantId);
      alert("Ajuste aplicado correctamente");
    } catch (error) {
      console.error(error);
      alert("Error al aplicar ajuste");
    }
  }

  function resetForm() {
    setForm(emptyForm);
    setEditingId(null);
    setStaffHours(defaultHours);
    setStaffSpecialDates([]);
    setSelectedServiceIds([]);
    resetSpecialDateForm();
    setSaveError("");
    setSaveOk("");
  }

  async function startEdit(item: StaffItem) {
    try {
      setLoading(true);
      setEditingId(item.id);
      setForm({
        name: item.name || "",
        role: item.role || "",
        email: item.email || "",
        phone: item.phone || "",
        color: item.color || "#0f172a",
        is_active: Boolean(item.is_active),
        sort_order: Number(item.sort_order || 0),
        use_business_hours:
          item.use_business_hours === undefined
            ? true
            : Boolean(item.use_business_hours),
      });
      setSaveError("");
      setSaveOk("");
      resetSpecialDateForm();

      await Promise.all([
        loadStaffHours(item.tenant_id, item.id),
        loadStaffSpecialDates(item.tenant_id, item.id),
        loadStaffServices(item.tenant_id, item.id),
      ]);
    } catch (error: unknown) {
      setSaveError(
        error instanceof Error
          ? error.message
          : "No se pudo cargar la configuración del staff"
      );
    } finally {
      setLoading(false);
    }
  }

  function updateHour(
    dayOfWeek: number,
    field: "enabled" | "start_time" | "end_time",
    value: boolean | string
  ) {
    setStaffHours((prev) =>
      prev.map((item) =>
        item.day_of_week === dayOfWeek ? { ...item, [field]: value } : item
      )
    );
  }

  async function saveStaffHours(staffId: string) {
    const payload = {
      tenant_id: tenantId,
      staff_id: staffId,
      hours: staffHours.map((item) => ({
        day_of_week: item.day_of_week,
        enabled: item.enabled,
        start_time: item.enabled ? item.start_time || null : null,
        end_time: item.enabled ? item.end_time || null : null,
      })),
    };

    const res = await fetch(`${BACKEND_URL}/staff-hours`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data?.error || "No se pudo guardar staff_hours");
    }
  }

  function validateStaffHours() {
    for (const item of staffHours) {
      if (!item.enabled) continue;

      if (!item.start_time || !item.end_time) {
        throw new Error("Cada día activo debe tener hora de inicio y fin");
      }

      if (item.start_time >= item.end_time) {
        const dayLabel =
          days.find((day) => day.value === item.day_of_week)?.label || "Día";
        throw new Error(
          `La hora fin debe ser mayor a la hora inicio en ${dayLabel}`
        );
      }
    }
  }

  function validateSpecialDate() {
    if (!specialDateForm.date) {
      throw new Error("Debes ingresar una fecha");
    }

    if (!specialDateForm.is_closed) {
      if (!specialDateForm.start_time || !specialDateForm.end_time) {
        throw new Error("Debes ingresar hora inicio y fin");
      }

      if (specialDateForm.start_time >= specialDateForm.end_time) {
        throw new Error("La hora fin debe ser mayor a la hora inicio");
      }
    }

    const duplicated = staffSpecialDates.find((item) => {
      if (!item.date || item.date !== specialDateForm.date) return false;

      if (editingSpecialDateId) {
        return item.id !== editingSpecialDateId;
      }

      return true;
    });

    if (duplicated) {
      throw new Error("Ya existe una excepción para esa fecha en este staff");
    }
  }

  async function handleSave() {
    try {
      setSaving(true);
      setSaveError("");
      setSaveOk("");

      if (!tenantId) {
        throw new Error("tenant_id no disponible");
      }

      if (!selectedBranchId) {
        throw new Error("Debes seleccionar una sucursal activa");
      }

      if (!form.name.trim()) {
        throw new Error("Debes ingresar el nombre del staff");
      }

      if (selectedServiceIds.length === 0) {
        throw new Error("Debes asignar al menos un servicio al staff");
      }

      if (!form.use_business_hours) {
        validateStaffHours();
      }

      const payload = {
        tenant_id: tenantId,
        branch_id: selectedBranchId,
        name: form.name.trim(),
        role: form.role.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        color: form.color,
        is_active: form.is_active,
        sort_order: Number(form.sort_order || 0),
        use_business_hours: form.use_business_hours,
      };

      const url = editingId
        ? `${BACKEND_URL}/staff/${editingId}`
        : `${BACKEND_URL}/staff`;

      const method = editingId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "No se pudo guardar");
      }

      const savedStaffId = data?.staff?.id || editingId;

      if (!savedStaffId) {
        throw new Error("No se pudo obtener el id del staff guardado");
      }

      if (!form.use_business_hours) {
        await saveStaffHours(savedStaffId);
      }

      await saveStaffServices(savedStaffId);
      await loadStaff(tenantId);
      resetForm();
      setSaveOk(
        editingId
          ? "Staff actualizado correctamente."
          : "Staff creado correctamente."
      );
    } catch (error: unknown) {
      setSaveError(
        error instanceof Error
          ? error.message
          : "No se pudo guardar el staff"
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    const ok = window.confirm("¿Seguro que quieres eliminar este staff?");
    if (!ok) return;

    try {
      const res = await fetch(`${BACKEND_URL}/staff/${id}`, {
        method: "DELETE",
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "No se pudo eliminar");
      }

      await loadStaff(tenantId);

      if (editingId === id) {
        resetForm();
      }
    } catch (error: unknown) {
      alert(
        error instanceof Error ? error.message : "No se pudo eliminar el staff"
      );
    }
  }

  function handleEditSpecialDate(item: StaffSpecialDateItem) {
    setEditingSpecialDateId(item.id || null);
    setSpecialDateForm({
      id: item.id,
      tenant_id: item.tenant_id,
      staff_id: item.staff_id,
      date: item.date || "",
      label: item.label || "",
      is_closed: Boolean(item.is_closed),
      start_time: item.start_time || "09:00",
      end_time: item.end_time || "18:00",
    });
    setSaveError("");
    setSaveOk("");
  }

  async function handleSaveSpecialDate() {
    try {
      if (!tenantId) {
        throw new Error("tenant_id no disponible");
      }

      if (!editingId) {
        throw new Error(
          "Primero debes guardar el staff antes de administrar excepciones"
        );
      }

      validateSpecialDate();

      setSpecialDateSaving(true);
      setSaveError("");
      setSaveOk("");

      const payload = {
        tenant_id: tenantId,
        branch_id: selectedBranchId,
        staff_id: editingId,
        date: specialDateForm.date,
        label: (specialDateForm.label || "").trim() || null,
        is_closed: specialDateForm.is_closed,
        start_time: specialDateForm.is_closed
          ? null
          : specialDateForm.start_time || null,
        end_time: specialDateForm.is_closed
          ? null
          : specialDateForm.end_time || null,
      };

      const isEditing = Boolean(editingSpecialDateId);

      const url = isEditing
        ? `${BACKEND_URL}/staff-special-dates/${editingSpecialDateId}`
        : `${BACKEND_URL}/staff-special-dates`;

      const method = isEditing ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(
          data?.error ||
            (isEditing
              ? "No se pudo actualizar la excepción"
              : "No se pudo crear la excepción")
        );
      }

      await loadStaffSpecialDates(tenantId, editingId);
      resetSpecialDateForm();
      setSaveOk(
        isEditing
          ? "Excepción del staff actualizada correctamente."
          : "Excepción del staff creada correctamente."
      );
    } catch (error: unknown) {
      setSaveError(
        error instanceof Error
          ? error.message
          : "No se pudo guardar la excepción"
      );
    } finally {
      setSpecialDateSaving(false);
    }
  }

  async function handleDeleteSpecialDate(id: string) {
    const ok = window.confirm("¿Seguro que quieres eliminar esta excepción?");
    if (!ok) return;

    try {
      setSaveError("");
      setSaveOk("");

      const res = await fetch(`${BACKEND_URL}/staff-special-dates/${id}`, {
        method: "DELETE",
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "No se pudo eliminar la excepción");
      }

      if (tenantId && editingId) {
        await loadStaffSpecialDates(tenantId, editingId);
      }

      if (editingSpecialDateId === id) {
        resetSpecialDateForm();
      }

      setSaveOk("Excepción eliminada correctamente.");
    } catch (error: unknown) {
      setSaveError(
        error instanceof Error
          ? error.message
          : "No se pudo eliminar la excepción"
      );
    }
  }

  return (
    <div className="space-y-6 pb-6">
      <section
        className="overflow-hidden rounded-[30px] border p-6 shadow-sm"
        style={{
          borderColor: "rgba(59,130,246,0.25)",
          background:
            "linear-gradient(135deg, rgba(37,99,235,0.18), rgba(14,165,233,0.08) 35%, var(--bg-card) 85%)",
        }}
      >
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <p
              className="mb-2 text-xs font-semibold uppercase tracking-[0.22em]"
              style={{ color: "var(--text-muted)" }}
            >
              Equipo
            </p>

            <h1
              className="text-3xl font-semibold tracking-tight sm:text-4xl"
              style={{ color: "var(--text-main)" }}
            >
              Staff
            </h1>

            <p
              className="mt-3 max-w-2xl text-sm leading-6 sm:text-[15px]"
              style={{ color: "var(--text-muted)" }}
            >
              {selectedBranchName
                ? `Administra el staff de la sucursal ${selectedBranchName}, sus servicios, horarios y excepciones.`
                : "Administra las personas que atienden en tu negocio, sus servicios, horarios y excepciones."}
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <div
              className="rounded-2xl border px-4 py-3"
              style={{
                borderColor: "rgba(59,130,246,0.24)",
                background: "rgba(255,255,255,0.08)",
              }}
            >
              <p
                className="text-[11px] font-semibold uppercase tracking-[0.16em]"
                style={{ color: "var(--text-muted)" }}
              >
                Total staff
              </p>
              <p
                className="mt-2 text-sm font-semibold"
                style={{ color: "var(--text-main)" }}
              >
                {loading ? "..." : staff.length}
              </p>
            </div>

            <div
              className="rounded-2xl border px-4 py-3"
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
                {loading ? "..." : activeCount}
              </p>
            </div>

            <div
              className="rounded-2xl border px-4 py-3"
              style={{
                borderColor: "rgba(59,130,246,0.24)",
                background: "rgba(255,255,255,0.08)",
              }}
            >
              <p
                className="text-[11px] font-semibold uppercase tracking-[0.16em]"
                style={{ color: "var(--text-muted)" }}
              >
                Usan horario negocio
              </p>
              <p
                className="mt-2 text-sm font-semibold"
                style={{ color: "var(--text-main)" }}
              >
                {loading ? "..." : usingBusinessHoursCount}
              </p>
            </div>

            <div
              className="rounded-2xl border px-4 py-3"
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
                {loading ? "..." : `${activeCount}/${caps.max_staff}`}
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
          description="Selecciona una sucursal en el sidebar para administrar el staff."
        />
      ) : null}

      {loadError ? (
        <Notice tone="danger" title={loadError} />
      ) : null}

      <section className="grid gap-6 xl:grid-cols-[1.18fr_0.82fr]">
        <Panel
          title={editingId ? "Editar staff" : "Nuevo staff"}
          description="Agrega personas del equipo y deja su información base lista."
          className="bg-[linear-gradient(180deg,rgba(37,99,235,0.08),transparent_35%)]"
        >
          {!selectedBranchId ? (
            <div
              className="rounded-2xl border border-dashed px-4 py-8 text-sm"
              style={{
                borderColor: "var(--border-color)",
                background: "var(--bg-soft)",
                color: "var(--text-muted)",
              }}
            >
              Selecciona una sucursal activa en el sidebar para gestionar staff.
            </div>
          ) : loading ? (
            <div
              className="rounded-2xl border border-dashed px-4 py-8 text-sm"
              style={{
                borderColor: "var(--border-color)",
                background: "var(--bg-soft)",
                color: "var(--text-muted)",
              }}
            >
              Cargando...
            </div>
          ) : (
            <div className="space-y-5">
              <div
                className="rounded-2xl border p-4"
                style={{
                  borderColor: "var(--border-color)",
                  background:
                    "linear-gradient(135deg, rgba(37,99,235,0.08), var(--bg-soft))",
                }}
              >
                <p
                  className="text-sm font-medium"
                  style={{ color: "var(--text-main)" }}
                >
                  Plan actual: <span className="capitalize">{plan}</span>
                </p>

                <p
                  className="mt-1 text-sm"
                  style={{ color: "var(--text-muted)" }}
                >
                  Has creado {activeCount} de {caps.max_staff} staff disponibles
                  en tu plan.
                </p>

                {hasExcess ? (
                  <div className="mt-4">
                    <Notice
                      tone="limit"
                      title={`Estás sobre el límite del plan.`}
                      description={`Debes desactivar ${excessStaff} profesional${
                        excessStaff === 1 ? "" : "es"
                      } antes del próximo ciclo.`}
                    >
                      <div
                        className="text-xs"
                        style={{ color: "var(--text-muted)" }}
                      >
                        Seleccionados: {selectedStaffToKeep.length} /{" "}
                        {caps.max_staff}
                      </div>

                      <button
                        onClick={applyStaffAdjustment}
                        className="mt-3 w-full rounded-xl px-4 py-2 text-sm font-semibold text-white transition"
                        style={{
                          background:
                            "linear-gradient(135deg, rgb(249 115 22), rgb(251 146 60))",
                        }}
                      >
                        Aplicar ajuste al plan
                      </button>
                    </Notice>
                  </div>
                ) : null}
              </div>

              <div>
                <label
                  className="mb-2 block text-sm font-medium"
                  style={{ color: "var(--text-main)" }}
                >
                  Nombre
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, name: e.target.value }))
                  }
                  className={inputClass}
                  style={{
                    borderColor: "var(--border-color)",
                    background: "var(--bg-card)",
                    color: "var(--text-main)",
                  }}
                  placeholder="Ej: Eduardo"
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label
                    className="mb-2 block text-sm font-medium"
                    style={{ color: "var(--text-main)" }}
                  >
                    Rol
                  </label>
                  <input
                    type="text"
                    value={form.role}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, role: e.target.value }))
                    }
                    className={inputClass}
                    style={{
                      borderColor: "var(--border-color)",
                      background: "var(--bg-card)",
                      color: "var(--text-main)",
                    }}
                    placeholder="Ej: Barbero"
                  />
                </div>

                <div>
                  <label
                    className="mb-2 block text-sm font-medium"
                    style={{ color: "var(--text-main)" }}
                  >
                    Orden
                  </label>
                  <input
                    type="number"
                    value={form.sort_order}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        sort_order: Number(e.target.value || 0),
                      }))
                    }
                    className={inputClass}
                    style={{
                      borderColor: "var(--border-color)",
                      background: "var(--bg-card)",
                      color: "var(--text-main)",
                    }}
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label
                    className="mb-2 block text-sm font-medium"
                    style={{ color: "var(--text-main)" }}
                  >
                    Correo
                  </label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, email: e.target.value }))
                    }
                    className={inputClass}
                    style={{
                      borderColor: "var(--border-color)",
                      background: "var(--bg-card)",
                      color: "var(--text-main)",
                    }}
                    placeholder="Ej: eduardo@negocio.cl"
                  />
                </div>

                <div>
                  <label
                    className="mb-2 block text-sm font-medium"
                    style={{ color: "var(--text-main)" }}
                  >
                    Teléfono
                  </label>
                  <input
                    type="text"
                    value={form.phone}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, phone: e.target.value }))
                    }
                    className={inputClass}
                    style={{
                      borderColor: "var(--border-color)",
                      background: "var(--bg-card)",
                      color: "var(--text-main)",
                    }}
                    placeholder="Ej: +56 9 1234 5678"
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label
                    className="mb-2 block text-sm font-medium"
                    style={{ color: "var(--text-main)" }}
                  >
                    Color
                  </label>
                  <input
                    type="color"
                    value={form.color}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, color: e.target.value }))
                    }
                    className="h-11 w-full rounded-2xl border px-2"
                    style={{
                      borderColor: "var(--border-color)",
                      background: "var(--bg-card)",
                    }}
                  />
                </div>

                <div className="flex items-end">
                  <label
                    className="flex h-11 w-full items-center gap-3 rounded-2xl border px-4 text-sm"
                    style={{
                      borderColor: "var(--border-color)",
                      background: "var(--bg-soft)",
                      color: "var(--text-main)",
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={form.is_active}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          is_active: e.target.checked,
                        }))
                      }
                      className="h-4 w-4 rounded"
                    />
                    Staff activo
                  </label>
                </div>
              </div>

              <div
                className="rounded-2xl border p-4"
                style={{
                  borderColor: "var(--border-color)",
                  background:
                    "linear-gradient(135deg, rgba(37,99,235,0.06), var(--bg-soft))",
                }}
              >
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p
                      className="text-sm font-semibold"
                      style={{ color: "var(--text-main)" }}
                    >
                      Usar horario del negocio
                    </p>
                    <p
                      className="mt-1 text-sm"
                      style={{ color: "var(--text-muted)" }}
                    >
                      Si está activo, este profesional heredará los horarios del
                      negocio.
                    </p>
                  </div>

                  <label
                    className="inline-flex items-center gap-3 rounded-full border px-4 py-2 text-sm font-medium"
                    style={{
                      borderColor: "var(--border-color)",
                      background: "var(--bg-card)",
                      color: "var(--text-main)",
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={form.use_business_hours}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          use_business_hours: e.target.checked,
                        }))
                      }
                      className="h-4 w-4 rounded"
                    />
                    {form.use_business_hours ? "Activo" : "Desactivado"}
                  </label>
                </div>
              </div>

              {form.use_business_hours ? (
                <Notice
                  tone="info"
                  title="Este staff usará el horario general del negocio."
                  description="El editor de horarios propios queda oculto para evitar configuraciones duplicadas."
                />
              ) : (
                <div
                  className="rounded-2xl border p-4"
                  style={{
                    borderColor: "var(--border-color)",
                    background: "var(--bg-card)",
                  }}
                >
                  <div className="mb-4">
                    <p
                      className="text-sm font-semibold"
                      style={{ color: "var(--text-main)" }}
                    >
                      Horarios del staff
                    </p>
                    <p
                      className="mt-1 text-sm"
                      style={{ color: "var(--text-muted)" }}
                    >
                      Configura el horario semanal propio de este profesional.
                    </p>
                  </div>

                  <div className="space-y-3">
                    <div
                      className="hidden gap-3 px-3 md:grid md:grid-cols-[1.2fr_0.8fr_1fr_1fr]"
                      style={{ color: "var(--text-muted)" }}
                    >
                      <div></div>
                      <div></div>
                      <div className="text-xs font-semibold uppercase tracking-wide">
                        Inicio
                      </div>
                      <div className="text-xs font-semibold uppercase tracking-wide">
                        Fin
                      </div>
                    </div>

                    {days.map((day) => {
                      const hour =
                        staffHours.find(
                          (item) => item.day_of_week === day.value
                        ) ||
                        defaultHours.find(
                          (item) => item.day_of_week === day.value
                        )!;

                      return (
                        <div
                          key={day.value}
                          className="rounded-2xl border p-3"
                          style={{
                            borderColor: "var(--border-color)",
                            background: "var(--bg-soft)",
                          }}
                        >
                          <div className="grid gap-3 md:grid-cols-[1.2fr_0.8fr_1fr_1fr] md:items-center">
                            <div>
                              <p
                                className="text-sm font-medium"
                                style={{ color: "var(--text-main)" }}
                              >
                                {day.label}
                              </p>
                            </div>

                            <label
                              className="inline-flex items-center gap-2 text-sm"
                              style={{ color: "var(--text-main)" }}
                            >
                              <input
                                type="checkbox"
                                checked={hour.enabled}
                                onChange={(e) =>
                                  updateHour(
                                    day.value,
                                    "enabled",
                                    e.target.checked
                                  )
                                }
                                className="h-4 w-4 rounded"
                              />
                              Activo
                            </label>

                            <div>
                              <input
                                type="time"
                                value={hour.start_time || "09:00"}
                                disabled={!hour.enabled}
                                onChange={(e) =>
                                  updateHour(
                                    day.value,
                                    "start_time",
                                    e.target.value
                                  )
                                }
                                className={inputClass}
                                style={{
                                  borderColor: "var(--border-color)",
                                  background: "var(--bg-card)",
                                  color: "var(--text-main)",
                                  opacity: !hour.enabled ? 0.6 : 1,
                                }}
                              />
                            </div>

                            <div>
                              <input
                                type="time"
                                value={hour.end_time || "18:00"}
                                disabled={!hour.enabled}
                                onChange={(e) =>
                                  updateHour(day.value, "end_time", e.target.value)
                                }
                                className={inputClass}
                                style={{
                                  borderColor: "var(--border-color)",
                                  background: "var(--bg-card)",
                                  color: "var(--text-main)",
                                  opacity: !hour.enabled ? 0.6 : 1,
                                }}
                              />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {!editingId ? (
                    <div className="mt-4">
                      <Notice
                        tone="warning"
                        title="Puedes dejar estos horarios listos ahora."
                        description="Al crear el staff, se guardarán automáticamente."
                      />
                    </div>
                  ) : null}
                </div>
              )}

              <div
                className="rounded-2xl border p-4"
                style={{
                  borderColor: "var(--border-color)",
                  background: "var(--bg-card)",
                }}
              >
                <div className="mb-4">
                  <p
                    className="text-sm font-semibold"
                    style={{ color: "var(--text-main)" }}
                  >
                    Servicios que atiende
                  </p>
                  <p
                    className="mt-1 text-sm"
                    style={{ color: "var(--text-muted)" }}
                  >
                    Selecciona qué servicios puede realizar este profesional.
                  </p>
                </div>

                {services.length === 0 ? (
                  <div
                    className="rounded-2xl border border-dashed px-4 py-6 text-sm"
                    style={{
                      borderColor: "var(--border-color)",
                      background: "var(--bg-soft)",
                      color: "var(--text-muted)",
                    }}
                  >
                    No hay servicios activos disponibles para asignar.
                  </div>
                ) : (
                  <div className="grid gap-3 md:grid-cols-2">
                    {services.map((service) => {
                      const checked = selectedServiceIds.includes(service.id);

                      return (
                        <label
                          key={service.id}
                          className="flex cursor-pointer items-start gap-3 rounded-2xl border px-4 py-3 transition"
                          style={{
                            borderColor: checked
                              ? "rgba(37,99,235,0.45)"
                              : "var(--border-color)",
                            background: checked
                              ? "linear-gradient(135deg, rgba(37,99,235,0.10), var(--bg-soft))"
                              : "var(--bg-card)",
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleService(service.id)}
                            className="mt-0.5 h-4 w-4 rounded"
                          />

                          <div className="min-w-0 flex-1">
                            <p
                              className="text-sm font-medium"
                              style={{ color: "var(--text-main)" }}
                            >
                              {service.name}
                            </p>
                            <p
                              className="mt-1 text-xs"
                              style={{ color: "var(--text-muted)" }}
                            >
                              Duración: {service.duration_minutes ?? 0} min
                              {service.price != null
                                ? ` · $${Number(service.price).toLocaleString(
                                    "es-CL"
                                  )}`
                                : ""}
                            </p>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>

              <div
                className="rounded-2xl border p-4"
                style={{
                  borderColor: "var(--border-color)",
                  background: "var(--bg-card)",
                }}
              >
                <div className="mb-4">
                  <p
                    className="text-sm font-semibold"
                    style={{ color: "var(--text-main)" }}
                  >
                    Excepciones del staff
                  </p>
                  <p
                    className="mt-1 text-sm"
                    style={{ color: "var(--text-muted)" }}
                  >
                    Configura días libres o horarios especiales para este
                    profesional.
                  </p>
                </div>

                {!editingId ? (
                  <Notice
                    tone="warning"
                    title="Primero crea o guarda el staff."
                    description="Después podrás administrar sus excepciones."
                  />
                ) : (
                  <div className="space-y-4">
                    <div className="grid gap-3 md:grid-cols-[1fr_1.5fr_0.9fr_1fr_1fr_auto_auto]">
                      <div>
                        <label
                          className="mb-2 block text-xs font-semibold uppercase tracking-wide"
                          style={{ color: "var(--text-muted)" }}
                        >
                          Fecha
                        </label>
                        <input
                          type="date"
                          value={specialDateForm.date}
                          onChange={(e) =>
                            setSpecialDateForm((prev) => ({
                              ...prev,
                              date: e.target.value,
                            }))
                          }
                          className={inputClass}
                          style={{
                            borderColor: "var(--border-color)",
                            background: "var(--bg-soft)",
                            color: "var(--text-main)",
                          }}
                        />
                      </div>

                      <div>
                        <label
                          className="mb-2 block text-xs font-semibold uppercase tracking-wide"
                          style={{ color: "var(--text-muted)" }}
                        >
                          Etiqueta
                        </label>
                        <input
                          type="text"
                          value={specialDateForm.label || ""}
                          onChange={(e) =>
                            setSpecialDateForm((prev) => ({
                              ...prev,
                              label: e.target.value,
                            }))
                          }
                          placeholder="Ej: Vacaciones"
                          className={inputClass}
                          style={{
                            borderColor: "var(--border-color)",
                            background: "var(--bg-soft)",
                            color: "var(--text-main)",
                          }}
                        />
                      </div>

                      <div className="flex items-end">
                        <label
                          className="flex h-11 w-full items-center gap-3 rounded-2xl border px-4 text-sm"
                          style={{
                            borderColor: "var(--border-color)",
                            background: "var(--bg-soft)",
                            color: "var(--text-main)",
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={specialDateForm.is_closed}
                            onChange={(e) =>
                              setSpecialDateForm((prev) => ({
                                ...prev,
                                is_closed: e.target.checked,
                              }))
                            }
                            className="h-4 w-4 rounded"
                          />
                          Cerrado
                        </label>
                      </div>

                      <div>
                        <label
                          className="mb-2 block text-xs font-semibold uppercase tracking-wide"
                          style={{ color: "var(--text-muted)" }}
                        >
                          Inicio
                        </label>
                        <input
                          type="time"
                          value={specialDateForm.start_time || "09:00"}
                          disabled={specialDateForm.is_closed}
                          onChange={(e) =>
                            setSpecialDateForm((prev) => ({
                              ...prev,
                              start_time: e.target.value,
                            }))
                          }
                          className={inputClass}
                          style={{
                            borderColor: "var(--border-color)",
                            background: "var(--bg-soft)",
                            color: "var(--text-main)",
                            opacity: specialDateForm.is_closed ? 0.6 : 1,
                          }}
                        />
                      </div>

                      <div>
                        <label
                          className="mb-2 block text-xs font-semibold uppercase tracking-wide"
                          style={{ color: "var(--text-muted)" }}
                        >
                          Fin
                        </label>
                        <input
                          type="time"
                          value={specialDateForm.end_time || "18:00"}
                          disabled={specialDateForm.is_closed}
                          onChange={(e) =>
                            setSpecialDateForm((prev) => ({
                              ...prev,
                              end_time: e.target.value,
                            }))
                          }
                          className={inputClass}
                          style={{
                            borderColor: "var(--border-color)",
                            background: "var(--bg-soft)",
                            color: "var(--text-main)",
                            opacity: specialDateForm.is_closed ? 0.6 : 1,
                          }}
                        />
                      </div>

                      <div className="flex items-end">
                        <button
                          type="button"
                          onClick={handleSaveSpecialDate}
                          disabled={specialDateSaving}
                          className={primaryButtonClass}
                          style={{
                            background:
                              "linear-gradient(135deg, rgb(37 99 235), rgb(14 165 233))",
                          }}
                        >
                          {specialDateSaving
                            ? editingSpecialDateId
                              ? "Guardando..."
                              : "Agregando..."
                            : editingSpecialDateId
                            ? "Guardar"
                            : "Agregar"}
                        </button>
                      </div>

                      <div className="flex items-end">
                        <button
                          type="button"
                          onClick={resetSpecialDateForm}
                          disabled={specialDateSaving}
                          className={secondaryButtonClass}
                          style={{
                            borderColor: "var(--border-color)",
                            background: "var(--bg-soft)",
                            color: "var(--text-main)",
                          }}
                        >
                          Cancelar
                        </button>
                      </div>
                    </div>

                    {editingSpecialDateId ? (
                      <Notice
                        tone="warning"
                        title="Estás editando una excepción existente."
                        description="Guarda los cambios o presiona cancelar."
                      />
                    ) : null}

                    {staffSpecialDates.length === 0 ? (
                      <div
                        className="rounded-2xl border border-dashed px-4 py-6 text-sm"
                        style={{
                          borderColor: "var(--border-color)",
                          background: "var(--bg-soft)",
                          color: "var(--text-muted)",
                        }}
                      >
                        Este staff aún no tiene excepciones configuradas.
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {staffSpecialDates.map((item) => (
                          <div
                            key={item.id}
                            className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border p-3"
                            style={{
                              borderColor: "var(--border-color)",
                              background:
                                "linear-gradient(135deg, rgba(37,99,235,0.06), var(--bg-soft))",
                            }}
                          >
                            <div className="min-w-0 flex-1">
                              <p
                                className="text-sm font-medium"
                                style={{ color: "var(--text-main)" }}
                              >
                                {item.date}
                              </p>
                              <p
                                className="mt-1 text-sm"
                                style={{ color: "var(--text-muted)" }}
                              >
                                {item.label || "Sin etiqueta"} ·{" "}
                                {item.is_closed
                                  ? "Cerrado todo el día"
                                  : `${item.start_time || "--:--"} a ${
                                      item.end_time || "--:--"
                                    }`}
                              </p>
                            </div>

                            <div className="flex flex-wrap gap-2">
                              <button
                                type="button"
                                onClick={() => handleEditSpecialDate(item)}
                                className={secondaryButtonClass}
                                style={{
                                  borderColor: "var(--border-color)",
                                  background: "var(--bg-card)",
                                  color: "var(--text-main)",
                                }}
                              >
                                Editar
                              </button>

                              <button
                                type="button"
                                onClick={() =>
                                  item.id && handleDeleteSpecialDate(item.id)
                                }
                                className="inline-flex h-11 items-center justify-center rounded-2xl border border-rose-300/60 bg-rose-500/10 px-5 text-sm font-medium text-rose-300 transition hover:bg-rose-500/15"
                              >
                                Eliminar
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {saveError ? (
                <Notice tone="danger" title={saveError} />
              ) : null}

              {saveOk ? (
                <Notice tone="success" title={saveOk} />
              ) : null}

              <div className="space-y-3 pt-2">
                {!editingId && reachedLimit ? (
  <Notice
    tone="limit"
    title="Has alcanzado el límite de staff de tu plan."
    description={`Tu plan ${plan} permite ${caps.max_staff} profesional${
      caps.max_staff === 1 ? "" : "es"
    } activos. Para crear otro, debes mejorar el plan o desactivar uno existente.`}
  >
    <div className="mt-1">
      <a
        href={`/planes?current_plan=${plan}&tenant_id=${tenantId}&slug=${slug}&from=staff`}
        className="inline-flex h-11 items-center justify-center rounded-xl px-4 text-sm font-semibold text-white transition"
        style={{
          background:
            "linear-gradient(135deg, rgb(249 115 22), rgb(251 146 60))",
        }}
      >
        Mejorar plan
      </a>
    </div>
  </Notice>
) : null}

                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={handleSave}
                    disabled={saving || (!editingId && (reachedLimit || hasExcess))}
                    className={primaryButtonClass}
                    style={{
                      background:
                        "linear-gradient(135deg, rgb(37 99 235), rgb(14 165 233))",
                    }}
                  >
                    {saving
                      ? "Guardando..."
                      : editingId
                      ? "Guardar cambios"
                      : "Crear staff"}
                  </button>

                  <button
                    type="button"
                    onClick={resetForm}
                    className={secondaryButtonClass}
                    style={{
                      borderColor: "var(--border-color)",
                      background: "var(--bg-soft)",
                      color: "var(--text-main)",
                    }}
                  >
                    Limpiar
                  </button>
                </div>
              </div>
            </div>
          )}
        </Panel>

        <Panel
          title="Equipo actual"
          description="Visualiza, edita o elimina integrantes del staff."
          className="bg-[linear-gradient(180deg,rgba(14,165,233,0.06),transparent_40%)]"
        >
          {!selectedBranchId ? (
            <div
              className="rounded-2xl border border-dashed px-4 py-8 text-sm"
              style={{
                borderColor: "var(--border-color)",
                background: "var(--bg-soft)",
                color: "var(--text-muted)",
              }}
            >
              Selecciona una sucursal activa en el sidebar para ver el staff.
            </div>
          ) : loading ? (
            <div
              className="rounded-2xl border border-dashed px-4 py-8 text-sm"
              style={{
                borderColor: "var(--border-color)",
                background: "var(--bg-soft)",
                color: "var(--text-muted)",
              }}
            >
              Cargando staff...
            </div>
          ) : staff.length === 0 ? (
            <div
              className="rounded-2xl border border-dashed px-4 py-8 text-sm"
              style={{
                borderColor: "var(--border-color)",
                background: "var(--bg-soft)",
                color: "var(--text-muted)",
              }}
            >
              Aún no has creado staff.
            </div>
          ) : (
            <div className="space-y-3">
              {staff.map((item) => {
                const isSelected = editingId === item.id;

                return (
                  <div
                    key={item.id}
                    className="rounded-[24px] border p-4 transition"
                    style={{
                      borderColor: isSelected
                        ? "rgba(37,99,235,0.45)"
                        : "var(--border-color)",
                      background: isSelected
                        ? "linear-gradient(135deg, rgba(37,99,235,0.22), rgba(14,165,233,0.12), var(--bg-card))"
                        : "linear-gradient(135deg, rgba(37,99,235,0.06), var(--bg-card))",
                      color: "var(--text-main)",
                    }}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-3">
                          <span
                            className="h-3.5 w-3.5 rounded-full"
                            style={{ backgroundColor: item.color || "#0f172a" }}
                          />

                          <p
                            className="text-base font-semibold"
                            style={{ color: "var(--text-main)" }}
                          >
                            {item.name}
                          </p>

                          <span
                            className="rounded-full px-2.5 py-1 text-[11px] font-semibold"
                            style={{
                              background: item.is_active
                                ? hasExcess
                                  ? "rgba(249,115,22,0.14)"
                                  : "rgba(16,185,129,0.14)"
                                : "rgba(148,163,184,0.16)",
                              color: item.is_active
                                ? hasExcess
                                  ? "rgb(249 115 22)"
                                  : "rgb(16 185 129)"
                                : "var(--text-muted)",
                            }}
                          >
                            {item.is_active
                              ? hasExcess
                                ? "Exceso"
                                : "Activo"
                              : "Inactivo"}
                          </span>

                          {isSelected ? (
                            <span
                              className="rounded-full px-2.5 py-1 text-[11px] font-semibold"
                              style={{
                                background: "rgba(37,99,235,0.14)",
                                color: "rgb(96 165 250)",
                              }}
                            >
                              Editando
                            </span>
                          ) : null}
                        </div>

                        {hasExcess && item.is_active ? (
                          <div className="mt-3">
                            <label
                              className="flex items-center gap-2 text-xs"
                              style={{ color: "var(--text-muted)" }}
                            >
                              <input
                                type="checkbox"
                                checked={selectedStaffToKeep.includes(item.id)}
                                onChange={() => toggleStaffSelection(item.id)}
                              />
                              Mantener activo
                            </label>
                          </div>
                        ) : null}

                        <div className="mt-4 grid gap-3 sm:grid-cols-2">
                          {[
                            { label: "Rol", value: item.role || "No definido" },
                            {
                              label: "Orden",
                              value: String(item.sort_order ?? 0),
                            },
                            {
                              label: "Correo",
                              value: item.email || "No definido",
                            },
                            {
                              label: "Teléfono",
                              value: item.phone || "No definido",
                            },
                            {
                              label: "Horario",
                              value: item.use_business_hours
                                ? "Usa horario del negocio"
                                : "Horario propio",
                              wide: true,
                            },
                          ].map((block) => (
                            <div
                              key={`${item.id}-${block.label}`}
                              className={`rounded-2xl border px-3 py-2.5 ${
                                block.wide ? "sm:col-span-2" : ""
                              }`}
                              style={{
                                borderColor: "var(--border-color)",
                                background: "var(--bg-soft)",
                              }}
                            >
                              <p
                                className="text-[11px] font-semibold uppercase tracking-[0.14em]"
                                style={{ color: "var(--text-muted)" }}
                              >
                                {block.label}
                              </p>
                              <p
                                className="mt-1 break-all text-sm"
                                style={{ color: "var(--text-main)" }}
                              >
                                {block.value}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => startEdit(item)}
                          className={secondaryButtonClass}
                          style={{
                            borderColor: "var(--border-color)",
                            background: "var(--bg-card)",
                            color: "var(--text-main)",
                          }}
                        >
                          Editar
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDelete(item.id)}
                          className="inline-flex h-11 items-center justify-center rounded-2xl border border-rose-300/60 bg-rose-500/10 px-5 text-sm font-medium text-rose-300 transition hover:bg-rose-500/15"
                        >
                          Eliminar
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Panel>
      </section>
    </div>
  );
}