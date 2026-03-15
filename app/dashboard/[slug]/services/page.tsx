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
};

type Service = {
  id: string;
  name: string;
  duration_minutes: number;
  price: number | null;
  active: boolean;
};

export default function ServicesPage() {
  const params = useParams();
  const slug =
    ((params as any)?.slug as string) || ((params as any)?.Slug as string);

  const [tenantId, setTenantId] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loadError, setLoadError] = useState("");
  const [saveError, setSaveError] = useState("");
  const [saveOk, setSaveOk] = useState("");

  const [form, setForm] = useState({
    name: "",
    duration_minutes: "30",
    price: "",
  });

  const [editForm, setEditForm] = useState({
    name: "",
    duration_minutes: "30",
    price: "",
    active: true,
  });

  const publicUrl = useMemo(() => `https://orbyx.cl/${slug}`, [slug]);

  const activeServicesCount = services.filter((service) => service.active).length;
  const inactiveServicesCount = services.filter((service) => !service.active).length;

  function formatPrice(price: number | null) {
    if (typeof price !== "number" || price <= 0) return "Sin precio";

    return new Intl.NumberFormat("es-CL", {
      style: "currency",
      currency: "CLP",
      maximumFractionDigits: 0,
    }).format(price);
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

      setTenantId(businessData.business.id);
      setBusinessName(businessData.business.name || slug);

      const servicesRes = await fetch(
        `https://orbyx-backend.onrender.com/services?tenant_id=${businessData.business.id}`
      );
      const servicesData: { services?: Service[]; error?: string } =
        await servicesRes.json();

      if (!servicesRes.ok) {
        throw new Error(
          servicesData.error || "No se pudieron cargar los servicios"
        );
      }

      setServices(servicesData.services || []);
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

  async function handleCreateService() {
    try {
      setSaving(true);
      setSaveError("");
      setSaveOk("");

      if (!tenantId) {
        throw new Error("No se encontró el negocio");
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
            name: form.name.trim(),
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

      setForm({
        name: "",
        duration_minutes: "30",
        price: "",
      });

      setSaveOk("Servicio creado correctamente.");
      await loadAll();
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
      duration_minutes: String(service.duration_minutes || 30),
      price: service.price ? String(service.price) : "",
      active: Boolean(service.active),
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
            name: editForm.name.trim(),
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

      setSaveOk("Servicio actualizado correctamente.");
      setEditingId(null);
      await loadAll();
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

      await loadAll();
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

      <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
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
          label="Inactivos"
          value={loading ? "..." : String(inactiveServicesCount)}
          helper="Servicios ocultos o pausados temporalmente."
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
              {services.map((service) => (
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
                            Actualiza nombre, duración, precio y estado.
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
                            Servicio disponible para agendamiento público.
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
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </Panel>

        <Panel
          title="Crear nuevo servicio"
          description="Agrega un nuevo servicio para ofrecer más opciones de reserva."
        >
          <div className="space-y-5">
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
                className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-4 focus:ring-slate-200/60"
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
                className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-200/60"
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
                className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-4 focus:ring-slate-200/60"
              />
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm font-medium text-slate-700">
                Consejo
              </p>
              <p className="mt-1 text-sm text-slate-500">
                Mantén nombres claros y cortos para que tus clientes entiendan
                rápido qué están reservando.
              </p>
            </div>

            <button
              type="button"
              onClick={handleCreateService}
              disabled={saving || loading}
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