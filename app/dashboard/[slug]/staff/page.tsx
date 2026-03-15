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
  };
  calendar_id: string;
  google_connected?: boolean;
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
  created_at?: string;
  updated_at?: string;
};

const emptyForm = {
  name: "",
  role: "",
  email: "",
  phone: "",
  color: "#0f172a",
  is_active: true,
  sort_order: 0,
};

export default function StaffPage() {
  const params = useParams();
  const slug =
    ((params as any)?.slug as string) || ((params as any)?.Slug as string);

  const [tenantId, setTenantId] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [saveError, setSaveError] = useState("");
  const [saveOk, setSaveOk] = useState("");

  const [staff, setStaff] = useState<StaffItem[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: "",
    role: "",
    email: "",
    phone: "",
    color: "#0f172a",
    is_active: true,
    sort_order: 0,
  });

  const activeCount = useMemo(
    () => staff.filter((item) => item.is_active).length,
    [staff]
  );

  useEffect(() => {
    async function loadPage() {
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
        await loadStaff(data.business.id);
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

  async function loadStaff(id: string) {
    const res = await fetch(
      `https://orbyx-backend.onrender.com/staff?tenant_id=${id}`
    );

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data?.error || "No se pudo cargar el staff");
    }

    setStaff(data.staff || []);
  }

  function resetForm() {
    setForm(emptyForm);
    setEditingId(null);
    setSaveError("");
    setSaveOk("");
  }

  function startEdit(item: StaffItem) {
    setEditingId(item.id);
    setForm({
      name: item.name || "",
      role: item.role || "",
      email: item.email || "",
      phone: item.phone || "",
      color: item.color || "#0f172a",
      is_active: Boolean(item.is_active),
      sort_order: Number(item.sort_order || 0),
    });
    setSaveError("");
    setSaveOk("");
  }

  async function handleSave() {
    try {
      setSaving(true);
      setSaveError("");
      setSaveOk("");

      if (!tenantId) {
        throw new Error("tenant_id no disponible");
      }

      const payload = {
        tenant_id: tenantId,
        name: form.name,
        role: form.role,
        email: form.email,
        phone: form.phone,
        color: form.color,
        is_active: form.is_active,
        sort_order: Number(form.sort_order || 0),
      };

      const url = editingId
        ? `https://orbyx-backend.onrender.com/staff/${editingId}`
        : `https://orbyx-backend.onrender.com/staff`;

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

      await loadStaff(tenantId);
      setSaveOk(editingId ? "Staff actualizado correctamente." : "Staff creado correctamente.");
      resetForm();
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
      const res = await fetch(`https://orbyx-backend.onrender.com/staff/${id}`, {
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

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Equipo"
        title="Staff"
        description="Administra las personas que atienden en tu negocio."
      />

      {loadError ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 shadow-sm">
          {loadError}
        </div>
      ) : null}

      <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <StatCard label="Total staff" value={loading ? "..." : String(staff.length)} />
        <StatCard label="Activos" value={loading ? "..." : String(activeCount)} />
        <StatCard
          label="Módulo"
          value={loading ? "..." : "Configurado"}
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <Panel
          title={editingId ? "Editar staff" : "Nuevo staff"}
          description="Agrega personas del equipo y deja su información base lista."
        >
          {loading ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-sm text-slate-500">
              Cargando...
            </div>
          ) : (
            <div className="space-y-5">
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
          )}
        </Panel>

        <Panel
          title="Equipo actual"
          description="Visualiza, edita o elimina integrantes del staff."
        >
          {loading ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-sm text-slate-500">
              Cargando staff...
            </div>
          ) : staff.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-sm text-slate-500">
              Aún no has creado staff.
            </div>
          ) : (
            <div className="space-y-4">
              {staff.map((item) => (
                <div
                  key={item.id}
                  className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
                >
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-3">
                        <span
                          className="h-3 w-3 rounded-full"
                          style={{ backgroundColor: item.color || "#0f172a" }}
                        />
                        <p className="text-base font-semibold text-slate-900">
                          {item.name}
                        </p>
                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                            item.is_active
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {item.is_active ? "Activo" : "Inactivo"}
                        </span>
                      </div>

                      <div className="mt-3 space-y-1 text-sm text-slate-600">
                        <p>Rol: {item.role || "No definido"}</p>
                        <p>Correo: {item.email || "No definido"}</p>
                        <p>Teléfono: {item.phone || "No definido"}</p>
                        <p>Orden: {item.sort_order ?? 0}</p>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => startEdit(item)}
                        className="inline-flex h-10 items-center justify-center rounded-2xl border border-slate-300 bg-white px-4 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                      >
                        Editar
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDelete(item.id)}
                        className="inline-flex h-10 items-center justify-center rounded-2xl border border-rose-200 bg-rose-50 px-4 text-sm font-medium text-rose-700 transition hover:bg-rose-100"
                      >
                        Eliminar
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Panel>
      </section>
    </div>
  );
}