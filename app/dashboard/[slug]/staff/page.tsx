"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { PageHeader } from "../../../../components/dashboard/page-header";
import { Panel } from "../../../../components/dashboard/panel";
import { StatCard } from "../../../../components/dashboard/stat-card";

type BusinessResponse = {
  business: {
    id: string;
    name: string;
    slug: string;
    plan_slug?: string;
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

export default function StaffPage() {
  const params = useParams();
  const slug =
    ((params as any)?.slug as string) || ((params as any)?.Slug as string);

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

  const [plan, setPlan] = useState("starter");

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
    starter: { max_staff: 2 },
  };

  const caps = planCaps[plan] || planCaps.starter;
  const reachedLimit = activeCount >= caps.max_staff;

  function readStoredBranchId() {
    if (typeof window === "undefined" || !branchStorageKey) return "";
    return localStorage.getItem(branchStorageKey) || "";
  }

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
        setPlan((data.business as any).plan_slug || "starter");

        await loadBranches(data.business.id);
      } catch (error: any) {
        setLoadError(error?.message || "No se pudo cargar el módulo staff");
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
      } catch (error: any) {
        setLoadError(error?.message || "No se pudo cargar staff o servicios");
      }
    }

    loadData();
  }, [tenantId, selectedBranchId]);

  useEffect(() => {
    function handleBranchChanged(event: Event) {
      const customEvent = event as CustomEvent<{ slug?: string; branchId?: string }>;
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

    setStaff(data.staff || []);
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
        (row: any) => Number(row.day_of_week) === Number(day.value)
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

      const rows: BranchItem[] = Array.isArray(data.branches) ? data.branches : [];
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
        .map((item: any) => item.service_id)
        .filter((value: any) => typeof value === "string")
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
    } catch (error: any) {
      setSaveError(
        error?.message || "No se pudo cargar la configuración del staff"
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
    } catch (error: any) {
      setSaveError(error?.message || "No se pudo guardar el staff");
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
    } catch (error: any) {
      alert(error?.message || "No se pudo eliminar el staff");
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
    } catch (error: any) {
      setSaveError(error?.message || "No se pudo guardar la excepción");
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
    } catch (error: any) {
      setSaveError(error?.message || "No se pudo eliminar la excepción");
    }
  }

  return (
    <div className="space-y-6 pb-6">
      <PageHeader
        eyebrow="Equipo"
        title="Staff"
        description={
          selectedBranchName
            ? `Administra el staff de la sucursal: ${selectedBranchName}.`
            : "Administra las personas que atienden en tu negocio."
        }
      />

      {loadingBranches ? (
        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500 shadow-sm">
          Cargando sucursal activa...
        </div>
      ) : !selectedBranchId ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 shadow-sm">
          Debes seleccionar una sucursal activa en el sidebar para administrar el staff.
        </div>
      ) : (
        <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600 shadow-sm">
          Sucursal activa:{" "}
          <span className="font-semibold text-slate-900">
            {selectedBranchName || selectedBranchId}
          </span>
        </div>
      )}

      {loadError ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 shadow-sm">
          {loadError}
        </div>
      ) : null}

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-[24px] border border-slate-200 bg-white p-1 shadow-sm">
          <StatCard
            label="Total staff"
            value={loading ? "..." : String(staff.length)}
          />
        </div>

        <div className="rounded-[24px] border border-slate-200 bg-white p-1 shadow-sm">
          <StatCard
            label="Activos"
            value={loading ? "..." : String(activeCount)}
          />
        </div>

        <div className="rounded-[24px] border border-slate-200 bg-white p-1 shadow-sm">
          <StatCard
            label="Usan horario negocio"
            value={loading ? "..." : String(usingBusinessHoursCount)}
          />
        </div>

        <div className="rounded-[24px] border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-1 shadow-sm">
          <StatCard
            label="Límite del plan"
            value={loading ? "..." : `${activeCount}/${caps.max_staff}`}
            helper={
              loading
                ? "Cargando plan..."
                : reachedLimit
                ? "Llegaste al límite de staff de tu plan."
                : `Puedes agregar ${Math.max(0, caps.max_staff - activeCount)} más.`
            }
          />
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.18fr_0.82fr]">
        <Panel
          title={editingId ? "Editar staff" : "Nuevo staff"}
          description="Agrega personas del equipo y deja su información base lista."
        >
          {!selectedBranchId ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-sm text-slate-500">
              Selecciona una sucursal activa en el sidebar para gestionar staff.
            </div>
          ) : loading ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-sm text-slate-500">
              Cargando...
            </div>
          ) : (
<div className="space-y-5">
  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
    <p className="text-sm font-medium text-slate-700">
      Plan actual: <span className="capitalize">{plan}</span>
    </p>
    <p className="mt-1 text-sm text-slate-500">
      Has creado {activeCount} de {caps.max_staff} staff disponibles en tu plan.
    </p>
  </div>

  <div>
    <label className="mb-2 block text-sm font-medium text-slate-700">
      Nombre
    </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, name: e.target.value }))
                  }
                  className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-200/60"
                  placeholder="Ej: Eduardo"
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Rol
                  </label>
                  <input
                    type="text"
                    value={form.role}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, role: e.target.value }))
                    }
                    className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-200/60"
                    placeholder="Ej: Barbero"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
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
                    className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-200/60"
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Correo
                  </label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, email: e.target.value }))
                    }
                    className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-200/60"
                    placeholder="Ej: eduardo@negocio.cl"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Teléfono
                  </label>
                  <input
                    type="text"
                    value={form.phone}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, phone: e.target.value }))
                    }
                    className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-200/60"
                    placeholder="Ej: +56 9 1234 5678"
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Color
                  </label>
                  <input
                    type="color"
                    value={form.color}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, color: e.target.value }))
                    }
                    className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-2"
                  />
                </div>

                <div className="flex items-end">
                  <label className="flex h-11 w-full items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-700">
                    <input
                      type="checkbox"
                      checked={form.is_active}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          is_active: e.target.checked,
                        }))
                      }
                      className="h-4 w-4 rounded border-slate-300"
                    />
                    Staff activo
                  </label>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">
                      Usar horario del negocio
                    </p>
                    <p className="mt-1 text-sm text-slate-600">
                      Si está activo, este profesional heredará los horarios del
                      negocio.
                    </p>
                  </div>

                  <label className="inline-flex items-center gap-3 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700">
                    <input
                      type="checkbox"
                      checked={form.use_business_hours}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          use_business_hours: e.target.checked,
                        }))
                      }
                      className="h-4 w-4 rounded border-slate-300"
                    />
                    {form.use_business_hours ? "Activo" : "Desactivado"}
                  </label>
                </div>
              </div>

              {form.use_business_hours ? (
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-4">
                  <p className="text-sm font-medium text-emerald-800">
                    Este staff usará el horario general del negocio.
                  </p>
                  <p className="mt-1 text-sm text-emerald-700">
                    El editor de horarios propios queda oculto para evitar
                    configuraciones duplicadas.
                  </p>
                </div>
              ) : (
                <div className="rounded-2xl border border-slate-200 bg-white p-4">
                  <div className="mb-4">
                    <p className="text-sm font-semibold text-slate-900">
                      Horarios del staff
                    </p>
                    <p className="mt-1 text-sm text-slate-600">
                      Configura el horario semanal propio de este profesional.
                    </p>
                  </div>

                  <div className="space-y-3">
                    <div className="hidden gap-3 px-3 md:grid md:grid-cols-[1.2fr_0.8fr_1fr_1fr]">
                      <div></div>
                      <div></div>
                      <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Inicio
                      </div>
                      <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
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
                          className="rounded-2xl border border-slate-200 bg-slate-50 p-3"
                        >
                          <div className="grid gap-3 md:grid-cols-[1.2fr_0.8fr_1fr_1fr] md:items-center">
                            <div>
                              <p className="text-sm font-medium text-slate-900">
                                {day.label}
                              </p>
                            </div>

                            <label className="inline-flex items-center gap-2 text-sm text-slate-700">
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
                                className="h-4 w-4 rounded border-slate-300"
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
                                className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
                              />
                            </div>

                            <div>
                              <input
                                type="time"
                                value={hour.end_time || "18:00"}
                                disabled={!hour.enabled}
                                onChange={(e) =>
                                  updateHour(
                                    day.value,
                                    "end_time",
                                    e.target.value
                                  )
                                }
                                className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
                              />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {!editingId ? (
                    <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                      Puedes dejar estos horarios listos ahora. Al crear el
                      staff, se guardarán automáticamente.
                    </div>
                  ) : null}
                </div>
              )}

              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <div className="mb-4">
                  <p className="text-sm font-semibold text-slate-900">
                    Servicios que atiende
                  </p>
                  <p className="mt-1 text-sm text-slate-600">
                    Selecciona qué servicios puede realizar este profesional.
                  </p>
                </div>

                {services.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-sm text-slate-500">
                    No hay servicios activos disponibles para asignar.
                  </div>
                ) : (
                  <div className="grid gap-3 md:grid-cols-2">
                    {services.map((service) => {
                      const checked = selectedServiceIds.includes(service.id);

                      return (
                        <label
                          key={service.id}
                          className={`flex cursor-pointer items-start gap-3 rounded-2xl border px-4 py-3 transition ${
                            checked
                              ? "border-slate-900 bg-slate-50"
                              : "border-slate-200 bg-white hover:bg-slate-50"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleService(service.id)}
                            className="mt-0.5 h-4 w-4 rounded border-slate-300"
                          />

                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-slate-900">
                              {service.name}
                            </p>
                            <p className="mt-1 text-xs text-slate-500">
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

              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <div className="mb-4">
                  <p className="text-sm font-semibold text-slate-900">
                    Excepciones del staff
                  </p>
                  <p className="mt-1 text-sm text-slate-600">
                    Configura días libres o horarios especiales para este
                    profesional.
                  </p>
                </div>

                {!editingId ? (
                  <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                    Primero crea o guarda el staff para poder administrar sus
                    excepciones.
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="grid gap-3 md:grid-cols-[1fr_1.5fr_0.9fr_1fr_1fr_auto_auto]">
                      <div>
                        <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">
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
                          className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-200/60"
                        />
                      </div>

                      <div>
                        <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">
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
                          className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-200/60"
                        />
                      </div>

                      <div className="flex items-end">
                        <label className="flex h-11 w-full items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-700">
                          <input
                            type="checkbox"
                            checked={specialDateForm.is_closed}
                            onChange={(e) =>
                              setSpecialDateForm((prev) => ({
                                ...prev,
                                is_closed: e.target.checked,
                              }))
                            }
                            className="h-4 w-4 rounded border-slate-300"
                          />
                          Cerrado
                        </label>
                      </div>

                      <div>
                        <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">
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
                          className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
                        />
                      </div>

                      <div>
                        <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">
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
                          className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
                        />
                      </div>

                      <div className="flex items-end">
                        <button
                          type="button"
                          onClick={handleSaveSpecialDate}
                          disabled={specialDateSaving}
                          className="inline-flex h-11 items-center justify-center rounded-2xl bg-slate-900 px-5 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
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
                          className="inline-flex h-11 items-center justify-center rounded-2xl border border-slate-300 bg-white px-5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          Cancelar
                        </button>
                      </div>
                    </div>

                    {editingSpecialDateId ? (
                      <div className="rounded-2xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-700">
                        Estás editando una excepción existente. Guarda los
                        cambios o presiona cancelar.
                      </div>
                    ) : null}

                    {staffSpecialDates.length === 0 ? (
                      <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-sm text-slate-500">
                        Este staff aún no tiene excepciones configuradas.
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {staffSpecialDates.map((item) => (
                          <div
                            key={item.id}
                            className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-3"
                          >
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-medium text-slate-900">
                                {item.date}
                              </p>
                              <p className="mt-1 text-sm text-slate-600">
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
                                className="inline-flex h-10 items-center justify-center rounded-2xl border border-slate-300 bg-white px-4 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                              >
                                Editar
                              </button>

                              <button
                                type="button"
                                onClick={() =>
                                  item.id && handleDeleteSpecialDate(item.id)
                                }
                                className="inline-flex h-10 items-center justify-center rounded-2xl border border-rose-200 bg-rose-50 px-4 text-sm font-medium text-rose-700 transition hover:bg-rose-100"
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
                <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                  {saveError}
                </div>
              ) : null}

              {saveOk ? (
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                  {saveOk}
                </div>
              ) : null}

              <div className="space-y-3 pt-2">
                {!editingId && reachedLimit ? (
  <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-4 text-sm text-amber-800">
    <p className="font-semibold">
      Llegaste al límite de profesionales de tu plan
    </p>
    <p className="mt-1">
      Ya usaste {activeCount} de {caps.max_staff} profesionales disponibles.
    </p>
    <p className="mt-1">
      Agrega más profesionales o mejora tu plan para seguir creciendo.
    </p>

    <Link
      href={`/planes?current_plan=${plan}&from=staff&slug=${slug}`}
      className="mt-3 inline-flex h-10 items-center justify-center rounded-xl bg-slate-900 px-4 text-sm font-medium text-white transition hover:bg-slate-800"
    >
      Mejora tu plan
    </Link>
  </div>
) : null}

                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={handleSave}
                    disabled={saving || (!editingId && reachedLimit)}
                    className="inline-flex h-11 items-center justify-center rounded-2xl bg-slate-900 px-5 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
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
                    className="inline-flex h-11 items-center justify-center rounded-2xl border border-slate-300 bg-white px-5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
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
        >
          {!selectedBranchId ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-sm text-slate-500">
              Selecciona una sucursal activa en el sidebar para ver el staff.
            </div>
          ) : loading ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-sm text-slate-500">
              Cargando staff...
            </div>
          ) : staff.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-sm text-slate-500">
              Aún no has creado staff.
            </div>
          ) : (
            <div className="space-y-3">
              {staff.map((item) => {
                const isSelected = editingId === item.id;

                return (
                  <div
                    key={item.id}
                    className={`rounded-[24px] border p-4 transition ${
                      isSelected
                        ? "border-slate-900 bg-slate-900 text-white shadow-lg"
                        : "border-slate-200 bg-gradient-to-br from-white to-slate-50 shadow-sm"
                    }`}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-3">
                          <span
                            className={`h-3.5 w-3.5 rounded-full ring-4 ${
                              isSelected ? "ring-white/10" : "ring-slate-100"
                            }`}
                            style={{ backgroundColor: item.color || "#0f172a" }}
                          />

                          <p
                            className={`text-base font-semibold ${
                              isSelected ? "text-white" : "text-slate-900"
                            }`}
                          >
                            {item.name}
                          </p>

                          <span
                            className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                              item.is_active
                                ? isSelected
                                  ? "bg-emerald-400/15 text-emerald-200"
                                  : "bg-emerald-100 text-emerald-700"
                                : isSelected
                                ? "bg-white/10 text-slate-200"
                                : "bg-slate-100 text-slate-600"
                            }`}
                          >
                            {item.is_active ? "Activo" : "Inactivo"}
                          </span>

                          {isSelected ? (
                            <span className="rounded-full bg-white/10 px-2.5 py-1 text-[11px] font-semibold text-white">
                              Editando
                            </span>
                          ) : null}
                        </div>

                        <div className="mt-4 grid gap-3 sm:grid-cols-2">
                          <div
                            className={`rounded-2xl border px-3 py-2.5 ${
                              isSelected
                                ? "border-white/10 bg-white/5"
                                : "border-slate-200 bg-white"
                            }`}
                          >
                            <p
                              className={`text-[11px] font-semibold uppercase tracking-[0.14em] ${
                                isSelected ? "text-slate-300" : "text-slate-400"
                              }`}
                            >
                              Rol
                            </p>
                            <p
                              className={`mt-1 text-sm ${
                                isSelected ? "text-white" : "text-slate-700"
                              }`}
                            >
                              {item.role || "No definido"}
                            </p>
                          </div>

                          <div
                            className={`rounded-2xl border px-3 py-2.5 ${
                              isSelected
                                ? "border-white/10 bg-white/5"
                                : "border-slate-200 bg-white"
                            }`}
                          >
                            <p
                              className={`text-[11px] font-semibold uppercase tracking-[0.14em] ${
                                isSelected ? "text-slate-300" : "text-slate-400"
                              }`}
                            >
                              Orden
                            </p>
                            <p
                              className={`mt-1 text-sm ${
                                isSelected ? "text-white" : "text-slate-700"
                              }`}
                            >
                              {item.sort_order ?? 0}
                            </p>
                          </div>

                          <div
                            className={`rounded-2xl border px-3 py-2.5 ${
                              isSelected
                                ? "border-white/10 bg-white/5"
                                : "border-slate-200 bg-white"
                            }`}
                          >
                            <p
                              className={`text-[11px] font-semibold uppercase tracking-[0.14em] ${
                                isSelected ? "text-slate-300" : "text-slate-400"
                              }`}
                            >
                              Correo
                            </p>
                            <p
                              className={`mt-1 break-all text-sm ${
                                isSelected ? "text-white" : "text-slate-700"
                              }`}
                            >
                              {item.email || "No definido"}
                            </p>
                          </div>

                          <div
                            className={`rounded-2xl border px-3 py-2.5 ${
                              isSelected
                                ? "border-white/10 bg-white/5"
                                : "border-slate-200 bg-white"
                            }`}
                          >
                            <p
                              className={`text-[11px] font-semibold uppercase tracking-[0.14em] ${
                                isSelected ? "text-slate-300" : "text-slate-400"
                              }`}
                            >
                              Teléfono
                            </p>
                            <p
                              className={`mt-1 text-sm ${
                                isSelected ? "text-white" : "text-slate-700"
                              }`}
                            >
                              {item.phone || "No definido"}
                            </p>
                          </div>

                          <div
                            className={`sm:col-span-2 rounded-2xl border px-3 py-2.5 ${
                              isSelected
                                ? "border-white/10 bg-white/5"
                                : "border-slate-200 bg-white"
                            }`}
                          >
                            <p
                              className={`text-[11px] font-semibold uppercase tracking-[0.14em] ${
                                isSelected ? "text-slate-300" : "text-slate-400"
                              }`}
                            >
                              Horario
                            </p>
                            <p
                              className={`mt-1 text-sm ${
                                isSelected ? "text-white" : "text-slate-700"
                              }`}
                            >
                              {item.use_business_hours
                                ? "Usa horario del negocio"
                                : "Horario propio"}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => startEdit(item)}
                          className={`inline-flex h-10 items-center justify-center rounded-2xl px-4 text-sm font-medium transition ${
                            isSelected
                              ? "border border-white/15 bg-white/10 text-white hover:bg-white/15"
                              : "border border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
                          }`}
                        >
                          Editar
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDelete(item.id)}
                          className={`inline-flex h-10 items-center justify-center rounded-2xl px-4 text-sm font-medium transition ${
                            isSelected
                              ? "border border-rose-300/20 bg-rose-400/10 text-rose-100 hover:bg-rose-400/15"
                              : "border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100"
                          }`}
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