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
  };
  calendar_id: string;
  google_connected?: boolean;
  plan_slug?: string | null;
};

type Service = {
  id: string;
  name: string;
  description?: string | null;
  duration_minutes: number;
  price: number | null;
  active: boolean;
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

type StaffServiceRow = {
  id: string;
  tenant_id: string;
  staff_id: string;
  service_id: string;
};

export default function ServicesPage() {
  const params = useParams();
  const slug =
    ((params as any)?.slug as string) || ((params as any)?.Slug as string);

  const [tenantId, setTenantId] = useState("");
const [branches, setBranches] = useState<any[]>([]);
const [selectedBranchId, setSelectedBranchId] = useState("");
const [loadingBranches, setLoadingBranches] = useState(false);
  const [businessName, setBusinessName] = useState("");
  const [plan, setPlan] = useState("starter");
  const [services, setServices] = useState<Service[]>([]);
  const [staff, setStaff] = useState<StaffItem[]>([]);
  const [staffServices, setStaffServices] = useState<StaffServiceRow[]>([]);
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
  });

  const [editForm, setEditForm] = useState({
    name: "",
    description: "",
    duration_minutes: "30",
    price: "",
    active: true,
    staff_ids: [] as string[],
  });

  const publicUrl = useMemo(() => `https://orbyx.cl/${slug}`, [slug]);

  const planCaps: Record<string, { max_services: number }> = {
    starter: { max_services: 3 },
    pro: { max_services: 10 },
    premium: { max_services: 30 },
    vip: { max_services: 999 },
  };

  const caps = planCaps[plan] || planCaps.starter;
  const maxServices = caps.max_services;
  const servicesLimitReached = services.length >= maxServices;
  const servicesRemainingCount = Math.max(0, maxServices - services.length);

  const activeServicesCount = services.filter((service) => service.active).length;
  const servicesWithDescriptionCount = services.filter(
    (service) => String(service.description || "").trim() !== ""
  ).length;

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

async function loadBranches(currentTenantId: string) {
  try {
    setLoadingBranches(true);

    const response = await fetch(
      `https://orbyx-backend.onrender.com/branches?tenant_id=${currentTenantId}`
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data?.error || "No se pudieron cargar las sucursales");
    }

    const rows = Array.isArray(data?.branches) ? data.branches : [];
    setBranches(rows);

    if (rows.length === 1) {
      setSelectedBranchId(rows[0].id);
    }
  } catch (error) {
    console.error("Error cargando sucursales", error);
    setBranches([]);
  } finally {
    setLoadingBranches(false);
  }
}

  async function loadAll() {
    try {
      setLoading(true);
      setLoadError("");

      const businessRes = await fetch(
        `https://orbyx-backend.onrender.com/public/business/${slug}`
      );
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
setPlan((businessData.plan_slug || "starter").toLowerCase());

await loadBranches(currentTenantId);

return;

      const servicesData: { services?: Service[]; error?: string } =
        await servicesRes.json();
      const staffData: { staff?: StaffItem[]; error?: string } =
        await staffRes.json();
      const staffServicesData: {
        staff_services?: StaffServiceRow[];
        error?: string;
      } = await staffServicesRes.json();

      if (!servicesRes.ok) {
        throw new Error(
          servicesData.error || "No se pudieron cargar los servicios"
        );
      }

      if (!staffRes.ok) {
        throw new Error(staffData.error || "No se pudo cargar el staff");
      }

      if (!staffServicesRes.ok) {
        throw new Error(
          staffServicesData.error || "No se pudieron cargar las relaciones staff-servicio"
        );
      }

      setServices(servicesData.services || []);
      setStaff(staffData.staff || []);
      setStaffServices(staffServicesData.staff_services || []);
    } catch (error: any) {
      setLoadError(error?.message || "No se pudo cargar la página");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (slug) {
      loadAll();
    }
  }, [slug]);


useEffect(() => {
  async function loadBranchData() {
    try {
      if (!tenantId || !selectedBranchId) {
        setServices([]);
        setStaff([]);
        setStaffServices([]);
        return;
      }

      setLoading(true);
      setLoadError("");

      const [servicesRes, staffRes, staffServicesRes] = await Promise.all([
        fetch(
          `https://orbyx-backend.onrender.com/services?tenant_id=${tenantId}&branch_id=${selectedBranchId}`
        ),
        fetch(
          `https://orbyx-backend.onrender.com/staff?tenant_id=${tenantId}&branch_id=${selectedBranchId}&active=true`
        ),
        fetch(
          `https://orbyx-backend.onrender.com/staff-services?tenant_id=${tenantId}`
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
        Array.isArray(staffServicesData?.staff_services)
          ? staffServicesData.staff_services
          : []
      );
    } catch (error: any) {
      setLoadError(
        error?.message || "No se pudieron cargar los datos de la sucursal"
      );
      setServices([]);
      setStaff([]);
      setStaffServices([]);
    } finally {
      setLoading(false);
    }
  }

  loadBranchData();
}, [tenantId, selectedBranchId]);

  async function saveServiceStaffRelations(serviceId: string, selectedStaffIds: string[]) {
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

      const response = await fetch(
        "https://orbyx-backend.onrender.com/staff-services",
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            tenant_id: tenantId,
            staff_id: staffId,
            service_ids: uniqueServiceIds,
          }),
        }
      );

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
  throw new Error("Debes seleccionar una sucursal");
}

if (servicesLimitReached) {
  throw new Error("Límite de servicios alcanzado");
}

if (!form.name.trim()) {
  throw new Error("Debes ingresar el nombre del servicio");
}

if (!form.duration_minutes.trim()) {
  throw new Error("Debes ingresar la duración");
}

      const response = await fetch(
        "https://orbyx-backend.onrender.com/services",
        {
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
}),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || "No se pudo crear el servicio");
      }

      const createdServiceId = data?.service?.id;

      if (!createdServiceId) {
        throw new Error("Servicio creado sin id válido");
      }

      await saveServiceStaffRelations(createdServiceId, form.staff_ids);

      setForm({
        name: "",
        description: "",
        duration_minutes: "30",
        price: "",
        staff_ids: [],
      });

if (tenantId && selectedBranchId) {
  const [servicesRes, staffRes, staffServicesRes] = await Promise.all([
    fetch(
      `https://orbyx-backend.onrender.com/services?tenant_id=${tenantId}&branch_id=${selectedBranchId}`
    ),
    fetch(
      `https://orbyx-backend.onrender.com/staff?tenant_id=${tenantId}&branch_id=${selectedBranchId}&active=true`
    ),
    fetch(
      `https://orbyx-backend.onrender.com/staff-services?tenant_id=${tenantId}`
    ),
  ]);

  const servicesData = await servicesRes.json();
  const staffData = await staffRes.json();
  const staffServicesData = await staffServicesRes.json();

  setServices(Array.isArray(servicesData?.services) ? servicesData.services : []);
  setStaff(Array.isArray(staffData?.staff) ? staffData.staff : []);
  setStaffServices(
    Array.isArray(staffServicesData?.staff_services)
      ? staffServicesData.staff_services
      : []
  );
}

setSaveOk("Servicio creado correctamente.");
    } catch (error: any) {
      setSaveError(error?.message || "No se pudo crear el servicio");
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
      throw new Error("Debes seleccionar una sucursal");
    }

    if (!editForm.name.trim()) {
      throw new Error("Debes ingresar el nombre del servicio");
    }

    if (!editForm.duration_minutes.trim()) {
      throw new Error("Debes ingresar la duración");
    }

    const response = await fetch(
      `https://orbyx-backend.onrender.com/services/${serviceId}`,
      {
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
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data?.error || "No se pudo actualizar el servicio");
    }

    await saveServiceStaffRelations(serviceId, editForm.staff_ids);

    if (tenantId && selectedBranchId) {
      const [servicesRes, staffRes, staffServicesRes] = await Promise.all([
        fetch(
          `https://orbyx-backend.onrender.com/services?tenant_id=${tenantId}&branch_id=${selectedBranchId}`
        ),
        fetch(
          `https://orbyx-backend.onrender.com/staff?tenant_id=${tenantId}&branch_id=${selectedBranchId}&active=true`
        ),
        fetch(
          `https://orbyx-backend.onrender.com/staff-services?tenant_id=${tenantId}`
        ),
      ]);

      const servicesData = await servicesRes.json();
      const staffData = await staffRes.json();
      const staffServicesData = await staffServicesRes.json();

      setServices(
        Array.isArray(servicesData?.services) ? servicesData.services : []
      );
      setStaff(Array.isArray(staffData?.staff) ? staffData.staff : []);
      setStaffServices(
        Array.isArray(staffServicesData?.staff_services)
          ? staffServicesData.staff_services
          : []
      );
    }

    setSaveOk("Servicio actualizado correctamente.");
    setEditingId(null);
  } catch (error: any) {
    setSaveError(error?.message || "No se pudo actualizar el servicio");
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

    const response = await fetch(
      `https://orbyx-backend.onrender.com/services/${serviceId}`,
      {
        method: "DELETE",
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data?.error || "No se pudo eliminar el servicio");
    }

    setSaveOk("Servicio eliminado correctamente.");

    if (editingId === serviceId) {
      setEditingId(null);
    }

    if (tenantId && selectedBranchId) {
      const [servicesRes, staffRes, staffServicesRes] = await Promise.all([
        fetch(
          `https://orbyx-backend.onrender.com/services?tenant_id=${tenantId}&branch_id=${selectedBranchId}`
        ),
        fetch(
          `https://orbyx-backend.onrender.com/staff?tenant_id=${tenantId}&branch_id=${selectedBranchId}&active=true`
        ),
        fetch(
          `https://orbyx-backend.onrender.com/staff-services?tenant_id=${tenantId}`
        ),
      ]);

      const servicesData = await servicesRes.json();
      const staffData = await staffRes.json();
      const staffServicesData = await staffServicesRes.json();

      setServices(
        Array.isArray(servicesData?.services) ? servicesData.services : []
      );
      setStaff(Array.isArray(staffData?.staff) ? staffData.staff : []);
      setStaffServices(
        Array.isArray(staffServicesData?.staff_services)
          ? staffServicesData.staff_services
          : []
      );
    }
  } catch (error: any) {
    setSaveError(error?.message || "No se pudo eliminar el servicio");
  } finally {
    setSaving(false);
  }
}

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Servicios"
        title={loading ? "Cargando servicios..." : "Servicios del negocio"}
        description={`Gestiona los servicios que tus clientes podrán reservar en ${loading ? "tu negocio" : businessName}.`}
        actions={
          <div className="flex flex-wrap gap-3">
            <Link
              href={publicUrl}
              target="_blank"
              className="inline-flex h-11 items-center justify-center rounded-2xl border border-slate-200 bg-white px-5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              Ver página pública
            </Link>
          </div>
        }
      />

<Panel
  title="Sucursal"
  description="Selecciona la sucursal que estás gestionando."
>
  {loadingBranches ? (
    <div className="text-sm text-slate-500">Cargando sucursales...</div>
  ) : branches.length === 0 ? (
    <div className="text-sm text-slate-500">
      No hay sucursales creadas.
    </div>
  ) : (
    <select
      value={selectedBranchId}
      onChange={(e) => {
        setSelectedBranchId(e.target.value);
        setEditingId(null);
        setForm({
          name: "",
          description: "",
          duration_minutes: "30",
          price: "",
          staff_ids: [],
        });
        setSaveError("");
        setSaveOk("");
      }}
      className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm"
    >
      <option value="">Selecciona una sucursal</option>

      {branches.map((b) => (
        <option key={b.id} value={b.id}>
          {b.name}
        </option>
      ))}
    </select>
  )}
</Panel>
      {loadError ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 shadow-sm">
          {loadError}
        </div>
      ) : null}

      {saveError ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 shadow-sm">
          {saveError}
        </div>
      ) : null}

      {saveOk ? (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 shadow-sm">
          {saveOk}
        </div>
      ) : null}


      <section className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <StatCard
          label="Total servicios"
          value={loading ? "..." : String(services.length)}
          helper="Cantidad total registrada en el negocio."
        />
        <StatCard
          label="Activos"
          value={loading ? "..." : String(activeServicesCount)}
          helper="Servicios disponibles actualmente para reserva."
        />
        <StatCard
          label="Con descripción"
          value={loading ? "..." : String(servicesWithDescriptionCount)}
          helper="Servicios con detalle útil para clientes e IA."
        />
        <StatCard
          label="Límite del plan"
          value={loading ? "..." : `${services.length}/${maxServices}`}
          helper={
            loading
              ? "Cargando plan..."
              : servicesLimitReached
              ? "Llegaste al límite de servicios de tu plan."
              : `Te quedan ${servicesRemainingCount} servicios disponibles.`
          }
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.3fr_0.7fr]">
        <Panel
          title="Servicios actuales"
          description="Edita, activa o elimina los servicios de tu negocio."
        >
          {loading ? (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-sm text-slate-500">
              Cargando servicios...
            </div>
          ) : services.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-sm text-slate-500">
              Aún no tienes servicios creados.
            </div>
          ) : (
            <div className="space-y-4">
              {services.map((service) => {
                const assignedStaffNames = getStaffNamesForService(service.id);

                return (
                  <div
                    key={service.id}
                    className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md"
                  >
                    {editingId === service.id ? (
                      <div className="space-y-5">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <p className="text-base font-semibold text-slate-900">
                              Editar servicio
                            </p>
                            <p className="mt-1 text-sm text-slate-500">
                              Actualiza nombre, descripción, duración, precio, estado y staff.
                            </p>
                          </div>

                          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                            Modo edición
                          </span>
                        </div>

                        <div className="grid gap-4 md:grid-cols-2">
                          <div className="md:col-span-2">
                            <label className="mb-2 block text-sm font-medium text-slate-700">
                              Nombre del servicio
                            </label>
                            <input
                              type="text"
                              value={editForm.name}
                              onChange={(e) =>
                                setEditForm((prev) => ({
                                  ...prev,
                                  name: e.target.value,
                                }))
                              }
                              className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-4 focus:ring-slate-200/60"
                            />
                          </div>

                          <div className="md:col-span-2">
                            <label className="mb-2 block text-sm font-medium text-slate-700">
                              Descripción del servicio
                            </label>
                            <textarea
                              value={editForm.description}
                              onChange={(e) =>
                                setEditForm((prev) => ({
                                  ...prev,
                                  description: e.target.value,
                                }))
                              }
                              placeholder="Ej: Incluye lavado, corte personalizado y peinado final."
                              className="min-h-[110px] w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-4 focus:ring-slate-200/60"
                            />
                          </div>

                          <div>
                            <label className="mb-2 block text-sm font-medium text-slate-700">
                              Duración (minutos)
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
                              className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-200/60"
                            />
                          </div>

                          <div>
                            <label className="mb-2 block text-sm font-medium text-slate-700">
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
                              className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-200/60"
                            />
                          </div>
                        </div>

                        <div className="space-y-3">
                          <div>
                            <p className="text-sm font-medium text-slate-700">
                              Staff que puede realizar este servicio
                            </p>
                            <p className="mt-1 text-sm text-slate-500">
                              Selecciona las personas del equipo que pueden atender este servicio.
                            </p>
                          </div>

                          {staff.length === 0 ? (
                            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-4 text-sm text-slate-500">
                              Aún no tienes staff activo. Primero crea staff en el módulo Staff.
                            </div>
                          ) : (
                            <div className="grid gap-3 sm:grid-cols-2">
                              {staff.map((staffItem) => (
                                <label
                                  key={staffItem.id}
                                  className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700"
                                >
                                  <input
                                    type="checkbox"
                                    checked={editForm.staff_ids.includes(staffItem.id)}
                                    onChange={() => toggleEditStaff(staffItem.id)}
                                    className="h-4 w-4 rounded border-slate-300"
                                  />
                                  <span className="flex items-center gap-2">
                                    <span
                                      className="h-3 w-3 rounded-full"
                                      style={{
                                        backgroundColor: staffItem.color || "#0f172a",
                                      }}
                                    />
                                    <span>
                                      {staffItem.name}
                                      {staffItem.role ? ` · ${staffItem.role}` : ""}
                                    </span>
                                  </span>
                                </label>
                              ))}
                            </div>
                          )}
                        </div>

                        <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
                          <input
                            type="checkbox"
                            checked={editForm.active}
                            onChange={(e) =>
                              setEditForm((prev) => ({
                                ...prev,
                                active: e.target.checked,
                              }))
                            }
                            className="h-4 w-4 rounded border-slate-300"
                          />
                          Servicio activo
                        </label>

                        <div className="flex flex-wrap gap-3">
                          <button
                            type="button"
                            onClick={() => handleSaveEdit(service.id)}
                            disabled={saving}
                            className="inline-flex h-11 items-center justify-center rounded-2xl bg-slate-900 px-5 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {saving ? "Guardando..." : "Guardar cambios"}
                          </button>

                          <button
                            type="button"
                            onClick={cancelEditing}
                            disabled={saving}
                            className="inline-flex h-11 items-center justify-center rounded-2xl border border-slate-200 bg-white px-5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                          >
                            Cancelar
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-5">
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <h3 className="text-lg font-semibold tracking-tight text-slate-900">
                                {service.name}
                              </h3>

                              <span
                                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                  service.active
                                    ? "bg-emerald-50 text-emerald-700"
                                    : "bg-slate-100 text-slate-600"
                                }`}
                              >
                                {service.active ? "Activo" : "Inactivo"}
                              </span>
                            </div>

                            <p className="mt-2 text-sm text-slate-500">
                              {service.description?.trim()
                                ? service.description
                                : "Agrega una descripción para explicar qué incluye este servicio."}
                            </p>
                          </div>

                          <div className="flex flex-wrap gap-2">
                            <button
                              type="button"
                              onClick={() => startEditing(service)}
                              className="inline-flex h-10 items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                            >
                              Editar
                            </button>

                            <button
                              type="button"
                              onClick={() => handleDeleteService(service.id)}
                              disabled={saving}
                              className="inline-flex h-10 items-center justify-center rounded-2xl border border-rose-200 bg-rose-50 px-4 text-sm font-medium text-rose-700 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              Eliminar
                            </button>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                              Duración
                            </p>
                            <p className="mt-2 text-sm font-semibold text-slate-900">
                              {service.duration_minutes} min
                            </p>
                          </div>

                          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                              Precio
                            </p>
                            <p className="mt-2 text-sm font-semibold text-slate-900">
                              {formatPrice(service.price)}
                            </p>
                          </div>

                          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                              Estado
                            </p>
                            <p
                              className={`mt-2 text-sm font-semibold ${
                                service.active
                                  ? "text-emerald-600"
                                  : "text-slate-600"
                              }`}
                            >
                              {service.active ? "Disponible" : "Oculto"}
                            </p>
                          </div>
                        </div>

                        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                            Staff asignado
                          </p>
                          <p className="mt-2 text-sm font-semibold text-slate-900">
                            {assignedStaffNames.length > 0
                              ? assignedStaffNames.join(", ")
                              : "Sin staff asignado"}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </Panel>

        <Panel
          title="Crear nuevo servicio"
          description="Agrega un nuevo servicio para ofrecer más opciones de reserva."
        >
          <div className="space-y-5">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm font-medium text-slate-700">
                Plan actual: <span className="capitalize">{plan}</span>
              </p>
              <p className="mt-1 text-sm text-slate-500">
                Has creado {services.length} de {maxServices} servicios disponibles en tu plan.
              </p>
            </div>

            {servicesLimitReached ? (
              <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 shadow-sm">
                Límite de servicios alcanzado
              </div>
            ) : null}

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Nombre del servicio
              </label>
              <input
                type="text"
                value={form.name}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, name: e.target.value }))
                }
                placeholder="Ej: Corte premium"
                disabled={servicesLimitReached}
                className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-4 focus:ring-slate-200/60 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Descripción del servicio
              </label>
              <textarea
                value={form.description}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, description: e.target.value }))
                }
                placeholder="Ej: Incluye lavado, corte personalizado y peinado final."
                disabled={servicesLimitReached}
                className="min-h-[110px] w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-4 focus:ring-slate-200/60 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Duración (minutos)
              </label>
              <input
                type="number"
                min="1"
                value={form.duration_minutes}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    duration_minutes: e.target.value,
                  }))
                }
                disabled={servicesLimitReached}
                className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-200/60 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Precio <span className="text-slate-400">(opcional)</span>
              </label>
              <input
                type="number"
                min="0"
                value={form.price}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, price: e.target.value }))
                }
                placeholder="Ej: 10000"
                disabled={servicesLimitReached}
                className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-4 focus:ring-slate-200/60 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
              />
            </div>

            <div className="space-y-3">
              <div>
                <p className="text-sm font-medium text-slate-700">
                  Staff que puede realizar este servicio
                </p>
                <p className="mt-1 text-sm text-slate-500">
                  Selecciona las personas del equipo que podrán atender este servicio.
                </p>
              </div>

              {staff.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-4 text-sm text-slate-500">
                  Aún no tienes staff activo. Primero crea staff en el módulo Staff.
                </div>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2">
                  {staff.map((staffItem) => (
                    <label
                      key={staffItem.id}
                      className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700"
                    >
                      <input
                        type="checkbox"
                        checked={form.staff_ids.includes(staffItem.id)}
                        onChange={() => toggleCreateStaff(staffItem.id)}
                        disabled={servicesLimitReached}
                        className="h-4 w-4 rounded border-slate-300"
                      />
                      <span className="flex items-center gap-2">
                        <span
                          className="h-3 w-3 rounded-full"
                          style={{
                            backgroundColor: staffItem.color || "#0f172a",
                          }}
                        />
                        <span>
                          {staffItem.name}
                          {staffItem.role ? ` · ${staffItem.role}` : ""}
                        </span>
                      </span>
                    </label>
                  ))}
                </div>
              )}
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm font-medium text-slate-700">Consejo</p>
              <p className="mt-1 text-sm text-slate-500">
                Describe qué incluye el servicio para que tus clientes entiendan mejor
                lo que están reservando y para que la IA pueda responder dudas.
              </p>
            </div>

            <button
              type="button"
              onClick={handleCreateService}
              disabled={saving || loading || servicesLimitReached}
              className="inline-flex h-11 w-full items-center justify-center rounded-2xl bg-slate-900 px-5 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? "Guardando..." : "Crear servicio"}
            </button>
          </div>
        </Panel>
      </section>
    </div>
  );
}