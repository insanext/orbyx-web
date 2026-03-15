"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { PageHeader } from "../../../../components/dashboard/page-header";
import { Panel } from "../../../../components/dashboard/panel";
import { StatCard } from "../../../../components/dashboard/stat-card";

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
  const [googleConnected, setGoogleConnected] = useState(false);

  const [form, setForm] = useState({
    name: "",
    phone: "",
    address: "",
  });

  const publicUrl = useMemo(() => `https://orbyx.cl/${slug}`, [slug]);

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
        setGoogleConnected(Boolean(data.google_connected));
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
    <div className="space-y-6">
      <PageHeader
        eyebrow="Negocio"
        title="Datos del negocio"
        description="Actualiza la información principal que identifica a tu negocio dentro de Orbyx."
        actions={
          <a
            href={publicUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex h-11 items-center justify-center rounded-2xl border border-slate-200 bg-white px-5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            Ver página pública
          </a>
        }
      />

      {loadError ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 shadow-sm">
          {loadError}
        </div>
      ) : null}

      <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <StatCard
          label="Nombre público"
          value={loading ? "..." : form.name || "-"}
          helper="Nombre visible para tus clientes."
        />
        <StatCard
          label="Google Calendar"
          value={
            loading ? "..." : googleConnected ? "Conectado" : "Pendiente"
          }
          helper={
            googleConnected
              ? "Tu agenda está conectada."
              : "Aún falta integrar tu calendario."
          }
        />
        <StatCard
          label="Página pública"
          value={loading ? "..." : slug ? "Activa" : "-"}
          helper="Tu enlace público ya está disponible."
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <Panel
          title="Información principal"
          description="Edita los datos base de tu negocio."
        >
          {loading ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-sm text-slate-500">
              Cargando datos...
            </div>
          ) : (
            <div className="space-y-5">
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
                  className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-200/60"
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
                  placeholder="Ej: +56 9 1234 5678"
                  className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-4 focus:ring-slate-200/60"
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
                  placeholder="Ej: Avenida Principal 123, Concepción"
                  className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-4 focus:ring-slate-200/60"
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

              <div className="flex flex-wrap gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving}
                  className="inline-flex h-11 items-center justify-center rounded-2xl bg-slate-900 px-5 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving ? "Guardando..." : "Guardar cambios"}
                </button>
              </div>
            </div>
          )}
        </Panel>

        <Panel
          title="Vista rápida"
          description="Resumen visual de la información actual del negocio."
        >
          <div className="space-y-4">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                Nombre
              </p>
              <p className="mt-2 text-sm font-semibold text-slate-900">
                {loading ? "Cargando..." : form.name || "No definido"}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                Teléfono
              </p>
              <p className="mt-2 text-sm font-semibold text-slate-900">
                {loading ? "Cargando..." : form.phone || "No definido"}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                Dirección
              </p>
              <p className="mt-2 text-sm font-semibold text-slate-900">
                {loading ? "Cargando..." : form.address || "No definida"}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                URL pública
              </p>
              <p className="mt-2 break-all text-sm font-semibold text-slate-900">
                {publicUrl}
              </p>
            </div>
          </div>
        </Panel>
      </section>
    </div>
  );
}