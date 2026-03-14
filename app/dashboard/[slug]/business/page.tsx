"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

type BusinessResponse = {
  business: {
    id: string;
    name: string;
    slug: string;
    phone?: string | null;
    address?: string | null;
  };
  calendar_id: string;
  google_connected?: boolean;
};

export default function BusinessPage() {
  const params = useParams();
  const slug =
    ((params as any)?.slug as string) || ((params as any)?.Slug as string);

  const [tenantId, setTenantId] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [saveError, setSaveError] = useState("");
  const [saveOk, setSaveOk] = useState("");

  const [form, setForm] = useState({
    name: "",
    phone: "",
    address: "",
  });

  useEffect(() => {
    async function loadBusiness() {
      try {
        setLoading(true);
        setLoadError("");

        const res = await fetch(
          `https://orbyx-backend.onrender.com/public/business/${slug}`
        );

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
        setForm({
          name: data.business.name || "",
          phone: data.business.phone || "",
          address: data.business.address || "",
        });
      } catch (error: any) {
        setLoadError(error?.message || "No se pudo cargar el negocio");
      } finally {
        setLoading(false);
      }
    }

    if (slug) {
      loadBusiness();
    }
  }, [slug]);

  async function handleSave() {
    try {
      setSaving(true);
      setSaveError("");
      setSaveOk("");

      if (!tenantId) {
        throw new Error("No se encontró el negocio");
      }

      if (!form.name.trim()) {
        throw new Error("Debes ingresar el nombre del negocio");
      }

      const res = await fetch(
        `https://orbyx-backend.onrender.com/tenants/${tenantId}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: form.name.trim(),
            phone: form.phone.trim(),
            address: form.address.trim(),
          }),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "No se pudo guardar");
      }

      setSaveOk("Datos del negocio actualizados correctamente.");
    } catch (error: any) {
      setSaveError(error?.message || "No se pudo guardar la información");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <p className="text-sm text-slate-500">Dashboard / Datos del negocio</p>
        <h1 className="mt-1 text-3xl font-semibold text-slate-900">
          Datos del negocio
        </h1>
        <p className="mt-2 text-slate-600">
          Aquí puedes actualizar la información principal de tu negocio.
        </p>
      </div>

      {loadError ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {loadError}
        </div>
      ) : null}

      <section className="max-w-2xl rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        {loading ? (
          <p className="text-sm text-slate-500">Cargando datos...</p>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Nombre del negocio
              </label>
              <input
                type="text"
                value={form.name}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, name: e.target.value }))
                }
                className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-slate-900 outline-none transition focus:border-sky-500 focus:ring-4 focus:ring-sky-100"
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
                className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-slate-900 outline-none transition focus:border-sky-500 focus:ring-4 focus:ring-sky-100"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Dirección
              </label>
              <input
                type="text"
                value={form.address}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, address: e.target.value }))
                }
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
              onClick={handleSave}
              disabled={saving}
              className="rounded-2xl bg-slate-900 px-5 py-3 text-sm font-medium text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? "Guardando..." : "Guardar cambios"}
            </button>
          </div>
        )}
      </section>
    </div>
  );
}