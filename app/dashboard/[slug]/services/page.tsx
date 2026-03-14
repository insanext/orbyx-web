"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

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
  const [loadError, setLoadError] = useState("");
  const [saveError, setSaveError] = useState("");
  const [saveOk, setSaveOk] = useState("");

  const [form, setForm] = useState({
    name: "",
    duration_minutes: "30",
    price: "",
  });

  const publicUrl = useMemo(() => `https://orbyx.cl/${slug}`, [slug]);

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

      const response = await fetch("https://orbyx-backend.onrender.com/services", {
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
      });

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

  return (
    <div className="space-y-8">
      <div>
        <p className="text-sm text-slate-500">Dashboard / Servicios</p>
        <h1 className="mt-1 text-3xl font-semibold text-slate-900">
          Servicios de {loading ? "tu negocio" : businessName}
        </h1>
        <p className="mt-2 text-slate-600">
          Aquí puedes revisar y crear los servicios que tus clientes podrán reservar.
        </p>
      </div>

      {loadError ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {loadError}
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">
              Servicios actuales
            </h2>

            <Link
              href={publicUrl}
              target="_blank"
              className="text-sm font-medium text-sky-700 hover:underline"
            >
              Ver página pública
            </Link>
          </div>

          {loading ? (
            <p className="text-sm text-slate-500">Cargando servicios...</p>
          ) : services.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-sm text-slate-500">
              Aún no tienes servicios creados.
            </div>
          ) : (
            <div className="space-y-3">
              {services.map((service) => (
                <div
                  key={service.id}
                  className="rounded-xl border border-slate-200 bg-slate-50 p-4"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-medium text-slate-900">{service.name}</p>
                      <p className="mt-1 text-sm text-slate-600">
                        {service.duration_minutes} min
                        {typeof service.price === "number" && service.price > 0
                          ? ` · $${service.price}`
                          : " · Sin precio"}
                      </p>
                    </div>

                    <span
                      className={`rounded-full px-3 py-1 text-xs font-medium ${
                        service.active
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-slate-200 text-slate-600"
                      }`}
                    >
                      {service.active ? "Activo" : "Inactivo"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">
            Crear nuevo servicio
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            Agrega un nuevo servicio para ofrecer más opciones de reserva.
          </p>

          <div className="mt-5 space-y-4">
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
                className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-slate-900 outline-none transition focus:border-sky-500 focus:ring-4 focus:ring-sky-100"
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
                className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-slate-900 outline-none transition focus:border-sky-500 focus:ring-4 focus:ring-sky-100"
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
                className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-slate-900 outline-none transition focus:border-sky-500 focus:ring-4 focus:ring-sky-100"
              />
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

            <button
              type="button"
              onClick={handleCreateService}
              disabled={saving || loading}
              className="w-full rounded-2xl bg-slate-900 px-5 py-3 text-sm font-medium text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? "Guardando..." : "Crear servicio"}
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}