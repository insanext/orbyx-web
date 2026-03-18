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
    email?: string | null;
    whatsapp?: string | null;
    instagram_url?: string | null;
    facebook_url?: string | null;
    description?: string | null;
    min_booking_notice_minutes?: number | null;
    max_booking_days_ahead?: number | null;
  };
  calendar_id: string;
  google_connected?: boolean;
};

type BusinessHour = {
  day_of_week: number;
  enabled: boolean;
  start_time: string;
  end_time: string;
};

type SpecialDate = {
  id?: string;
  date: string;
  label: string;
  is_closed: boolean;
  start_time: string;
  end_time: string;
};

const days = [
  "Domingo",
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado",
];

const displayOrder = [1, 2, 3, 4, 5, 6, 0];

export default function BusinessPage() {
  const params = useParams();
  const slug =
    ((params as any)?.slug as string) || ((params as any)?.Slug as string);

  const [tenantId, setTenantId] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingHours, setSavingHours] = useState(false);

  const [loadError, setLoadError] = useState("");
  const [saveError, setSaveError] = useState("");
  const [saveOk, setSaveOk] = useState("");

  const [googleConnected, setGoogleConnected] = useState(false);
  const [businessHours, setBusinessHours] = useState<BusinessHour[]>([]);
  const [specialDates, setSpecialDates] = useState<SpecialDate[]>([]);
  const [savingSpecialDates, setSavingSpecialDates] = useState(false);

  const [form, setForm] = useState({
    name: "",
    phone: "",
    address: "",
    email: "",
    whatsapp: "",
    instagram_url: "",
    facebook_url: "",
    description: "",
    min_booking_notice_minutes: 0,
    max_booking_days_ahead: 60,
  });

  const publicUrl = useMemo(() => `https://orbyx.cl/${slug}`, [slug]);

  const profileCompleted = [
    form.name,
    form.phone,
    form.address,
    form.email,
    form.whatsapp,
    form.instagram_url,
    form.facebook_url,
    form.description,
  ].filter((value) => String(value || "").trim() !== "").length;

  const profilePercent = Math.round((profileCompleted / 8) * 100);

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
          email: data.business.email || "",
          whatsapp: data.business.whatsapp || "",
          instagram_url: data.business.instagram_url || "",
          facebook_url: data.business.facebook_url || "",
          description: data.business.description || "",
          min_booking_notice_minutes: Number(
            data.business.min_booking_notice_minutes || 0
          ),
          max_booking_days_ahead: Number(
            data.business.max_booking_days_ahead || 60
          ),
        });

        await loadBusinessHours(data.business.id);
        await loadSpecialDates(data.business.id);
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

  function getDefaultHours(): BusinessHour[] {
    return [
      {
        day_of_week: 0,
        enabled: false,
        start_time: "09:00",
        end_time: "18:00",
      },
      {
        day_of_week: 1,
        enabled: true,
        start_time: "09:00",
        end_time: "18:00",
      },
      {
        day_of_week: 2,
        enabled: true,
        start_time: "09:00",
        end_time: "18:00",
      },
      {
        day_of_week: 3,
        enabled: true,
        start_time: "09:00",
        end_time: "18:00",
      },
      {
        day_of_week: 4,
        enabled: true,
        start_time: "09:00",
        end_time: "18:00",
      },
      {
        day_of_week: 5,
        enabled: true,
        start_time: "09:00",
        end_time: "18:00",
      },
      {
        day_of_week: 6,
        enabled: false,
        start_time: "09:00",
        end_time: "18:00",
      },
    ];
  }

  async function loadBusinessHours(id: string) {
    try {
      const res = await fetch(
        `https://orbyx-backend.onrender.com/business-hours?tenant_id=${id}`
      );

      const data = await res.json();

      if (res.ok) {
        if (data.hours?.length) {
          const normalized = getDefaultHours().map((fallback) => {
            const existing = data.hours.find(
              (item: any) => item.day_of_week === fallback.day_of_week
            );

            return {
              day_of_week: fallback.day_of_week,
              enabled: existing?.enabled ?? fallback.enabled,
              start_time: String(
                existing?.start_time || fallback.start_time
              ).slice(0, 5),
              end_time: String(existing?.end_time || fallback.end_time).slice(
                0,
                5
              ),
            };
          });

          setBusinessHours(normalized);
        } else {
          setBusinessHours(getDefaultHours());
        }
      }
    } catch (err) {
      console.error("Error cargando horarios", err);
      setBusinessHours(getDefaultHours());
    }
  }

  async function loadSpecialDates(id: string) {
    try {
      const res = await fetch(
        `https://orbyx-backend.onrender.com/business-special-dates?tenant_id=${id}`
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "Error cargando fechas especiales");
      }

      const normalized = Array.isArray(data.special_dates)
        ? data.special_dates.map((item: any) => ({
            id: item.id,
            date: item.date || "",
            label: item.label || "",
            is_closed: Boolean(item.is_closed),
            start_time: String(item.start_time || "").slice(0, 5),
            end_time: String(item.end_time || "").slice(0, 5),
          }))
        : [];

      setSpecialDates(normalized);
    } catch (err) {
      console.error("Error cargando fechas especiales", err);
      setSpecialDates([]);
    }
  }

  function addSpecialDate() {
    setSpecialDates((prev) => [
      ...prev,
      {
        date: "",
        label: "",
        is_closed: true,
        start_time: "",
        end_time: "",
      },
    ]);
  }

  function updateSpecialDate(
    index: number,
    field: keyof SpecialDate,
    value: any
  ) {
    setSpecialDates((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item))
    );
  }

  function removeSpecialDate(index: number) {
    setSpecialDates((prev) => prev.filter((_, i) => i !== index));
  }

  async function saveSpecialDates() {
    try {
      setSavingSpecialDates(true);

      const existingItems = specialDates.filter((item) => item.id);
      const newItems = specialDates.filter((item) => !item.id);

      for (const item of existingItems) {
        const res = await fetch(
          `https://orbyx-backend.onrender.com/business-special-dates/${item.id}`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              date: item.date,
              label: item.label,
              is_closed: item.is_closed,
              start_time: item.is_closed
                ? item.start_time || null
                : item.start_time,
              end_time: item.is_closed ? item.end_time || null : item.end_time,
            }),
          }
        );

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data?.error || "Error actualizando fecha especial");
        }
      }

      for (const item of newItems) {
        const res = await fetch(
          "https://orbyx-backend.onrender.com/business-special-dates",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              tenant_id: tenantId,
              date: item.date,
              label: item.label,
              is_closed: item.is_closed,
              start_time: item.is_closed
                ? item.start_time || null
                : item.start_time,
              end_time: item.is_closed ? item.end_time || null : item.end_time,
            }),
          }
        );

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data?.error || "Error creando fecha especial");
        }
      }

      await loadSpecialDates(tenantId);
      alert("Fechas especiales guardadas correctamente");
    } catch (err: any) {
      alert(err.message || "No se pudieron guardar las fechas especiales");
    } finally {
      setSavingSpecialDates(false);
    }
  }

  async function saveBusinessHours() {
    try {
      setSavingHours(true);

      const cleanedHours = businessHours.map((hour) => ({
        day_of_week: hour.day_of_week,
        enabled: hour.enabled,
        start_time: hour.start_time,
        end_time: hour.end_time,
      }));

      const res = await fetch(
        "https://orbyx-backend.onrender.com/business-hours",
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            tenant_id: tenantId,
            hours: cleanedHours,
          }),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "Error guardando horarios");
      }

      alert("Horarios guardados correctamente");
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSavingHours(false);
    }
  }

  async function handleSave() {
    try {
      setSaving(true);
      setSaveError("");
      setSaveOk("");

      const res = await fetch(
        `https://orbyx-backend.onrender.com/tenants/${tenantId}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(form),
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

  function updateHour(dayOfWeek: number, field: keyof BusinessHour, value: any) {
    setBusinessHours((prev) =>
      prev.map((item) =>
        item.day_of_week === dayOfWeek ? { ...item, [field]: value } : item
      )
    );
  }

  function normalizeTimeInput(value: string) {
    const cleaned = value.replace(/[^\d:]/g, "").slice(0, 5);

    if (cleaned.length <= 2) {
      return cleaned;
    }

    if (cleaned.includes(":")) {
      const [h, m] = cleaned.split(":");
      return `${h.slice(0, 2)}:${(m || "").slice(0, 2)}`;
    }

    return `${cleaned.slice(0, 2)}:${cleaned.slice(2, 4)}`;
  }

  function isValidTime(value: string) {
    return /^([01]\d|2[0-3]):([0-5]\d)$/.test(value);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Negocio"
        title="Datos del negocio"
        description="Actualiza la información principal, redes y canales de contacto de tu negocio."
      />

      {loadError ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 shadow-sm">
          {loadError}
        </div>
      ) : null}

      <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <StatCard
          label="Perfil completado"
          value={loading ? "..." : `${profilePercent}%`}
        />
        <StatCard
          label="Google Calendar"
          value={
            loading ? "..." : googleConnected ? "Conectado" : "Pendiente"
          }
        />
        <StatCard
          label="Página pública"
          value={loading ? "..." : slug ? "Activa" : "-"}
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <Panel
          title="Información principal"
          description="Edita los datos que verán tus clientes y que también podrá usar la IA."
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

              <div className="grid gap-4 md:grid-cols-2">
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
                    WhatsApp
                  </label>
                  <input
                    type="text"
                    value={form.whatsapp}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, whatsapp: e.target.value }))
                    }
                    placeholder="Ej: +56 9 1234 5678"
                    className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-4 focus:ring-slate-200/60"
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Correo de contacto
                </label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, email: e.target.value }))
                  }
                  placeholder="Ej: contacto@tunegocio.cl"
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

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Instagram
                  </label>
                  <input
                    type="text"
                    value={form.instagram_url}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        instagram_url: e.target.value,
                      }))
                    }
                    placeholder="Ej: https://instagram.com/tu_negocio"
                    className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-4 focus:ring-slate-200/60"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Facebook
                  </label>
                  <input
                    type="text"
                    value={form.facebook_url}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        facebook_url: e.target.value,
                      }))
                    }
                    placeholder="Ej: https://facebook.com/tu_negocio"
                    className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-4 focus:ring-slate-200/60"
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Descripción del negocio
                </label>
                <textarea
                  value={form.description}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  placeholder="Describe tu negocio, especialidad, estilo de atención y lo que te diferencia."
                  className="min-h-[120px] w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-4 focus:ring-slate-200/60"
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

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Tiempo mínimo antes de reservar
                </label>

                <select
                  value={form.min_booking_notice_minutes}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      min_booking_notice_minutes: Number(e.target.value),
                    }))
                  }
                  className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-200/60"
                >
                  <option value={0}>Sin restricción</option>
                  <option value={15}>15 minutos</option>
                  <option value={30}>30 minutos</option>
                  <option value={60}>1 hora</option>
                  <option value={120}>2 horas</option>
                </select>

                <p className="mt-2 text-xs text-slate-500">
                  Evita reservas inmediatas. Ej: si eliges 1 hora, los clientes
                  solo podrán reservar con al menos 60 minutos de anticipación.
                </p>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Máximo días hacia adelante
                </label>

                <select
                  value={form.max_booking_days_ahead}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      max_booking_days_ahead: Number(e.target.value),
                    }))
                  }
                  className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-200/60"
                >
                  <option value={7}>7 días</option>
                  <option value={14}>14 días</option>
                  <option value={30}>30 días</option>
                  <option value={60}>60 días</option>
                  <option value={90}>90 días</option>
                </select>

                <p className="mt-2 text-xs text-slate-500">
                  Limita cuántos días hacia el futuro pueden agendar los
                  clientes.
                </p>
              </div>

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
          description="Resumen visual del perfil actual de tu negocio."
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
                Contacto
              </p>
              <p className="mt-2 text-sm font-semibold text-slate-900">
                {loading
                  ? "Cargando..."
                  : form.phone || form.whatsapp || "No definido"}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                Correo
              </p>
              <p className="mt-2 break-all text-sm font-semibold text-slate-900">
                {loading ? "Cargando..." : form.email || "No definido"}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                Redes sociales
              </p>
              <p className="mt-2 text-sm font-semibold text-slate-900">
                {loading
                  ? "Cargando..."
                  : form.instagram_url || form.facebook_url
                  ? "Configuradas"
                  : "No configuradas"}
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

      <Panel
        title="Horarios de atención"
        description="Define cuándo tu negocio está disponible para recibir reservas."
      >
        <div className="rounded-2xl border border-slate-200 overflow-hidden">
          <div className="grid grid-cols-[160px_90px_1fr_40px_1fr] gap-3 border-b border-slate-200 bg-slate-50 px-4 py-3 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
            <div>Día</div>
            <div>Activo</div>
            <div>Inicio</div>
            <div></div>
            <div>Fin</div>
          </div>

          <div className="divide-y divide-slate-200">
            {displayOrder.map((dayIndex) => {
              const h =
                businessHours.find((d) => d.day_of_week === dayIndex) || {
                  day_of_week: dayIndex,
                  enabled: false,
                  start_time: "09:00",
                  end_time: "18:00",
                };

              const startValid = isValidTime(h.start_time);
              const endValid = isValidTime(h.end_time);

              return (
                <div
                  key={dayIndex}
                  className="grid grid-cols-[160px_90px_1fr_40px_1fr] items-center gap-3 px-4 py-3"
                >
                  <div className="text-sm font-medium text-slate-900">
                    {days[dayIndex]}
                  </div>

                  <div>
                    <input
                      type="checkbox"
                      checked={h.enabled}
                      onChange={(e) =>
                        updateHour(dayIndex, "enabled", e.target.checked)
                      }
                    />
                  </div>

                  <div>
                    <input
                      type="text"
                      inputMode="numeric"
                      placeholder="09:00"
                      value={h.start_time}
                      onChange={(e) =>
                        updateHour(
                          dayIndex,
                          "start_time",
                          normalizeTimeInput(e.target.value)
                        )
                      }
                      disabled={!h.enabled}
                      className={`h-11 w-full rounded-2xl border bg-white px-4 text-sm text-slate-900 outline-none transition ${
                        !h.enabled
                          ? "border-slate-200 opacity-60"
                          : startValid
                          ? "border-slate-200 focus:border-slate-400 focus:ring-4 focus:ring-slate-200/60"
                          : "border-rose-300 focus:border-rose-400 focus:ring-4 focus:ring-rose-100"
                      }`}
                    />
                  </div>

                  <div className="text-center text-slate-400">—</div>

                  <div>
                    <input
                      type="text"
                      inputMode="numeric"
                      placeholder="18:00"
                      value={h.end_time}
                      onChange={(e) =>
                        updateHour(
                          dayIndex,
                          "end_time",
                          normalizeTimeInput(e.target.value)
                        )
                      }
                      disabled={!h.enabled}
                      className={`h-11 w-full rounded-2xl border bg-white px-4 text-sm text-slate-900 outline-none transition ${
                        !h.enabled
                          ? "border-slate-200 opacity-60"
                          : endValid
                          ? "border-slate-200 focus:border-slate-400 focus:ring-4 focus:ring-slate-200/60"
                          : "border-rose-300 focus:border-rose-400 focus:ring-4 focus:ring-rose-100"
                      }`}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-3">
          <button
            onClick={saveBusinessHours}
            disabled={savingHours}
            className="rounded-2xl bg-slate-900 px-5 py-3 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {savingHours ? "Guardando..." : "Guardar horarios"}
          </button>
        </div>
      </Panel>

      <Panel
        title="Fechas especiales"
        description="Configura feriados, vísperas, vacaciones, cierres y horarios especiales por fecha."
      >
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-slate-900">
                Excepciones del calendario
              </p>
              <p className="text-sm text-slate-500">
                Ejemplos: 18 septiembre cerrado, 24 diciembre 09:00 a 13:00.
              </p>
            </div>

            <button
              type="button"
              onClick={addSpecialDate}
              className="inline-flex h-11 items-center justify-center rounded-2xl border border-slate-300 bg-white px-5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              Agregar fecha especial
            </button>
          </div>

          {specialDates.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-sm text-slate-500">
              Aún no has agregado fechas especiales.
            </div>
          ) : (
            <div className="space-y-4">
              {specialDates.map((item, index) => (
                <div
                  key={item.id || `new-${index}`}
                  className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
                >
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-5">
                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-700">
                        Fecha
                      </label>
                      <input
                        type="date"
                        value={item.date}
                        onChange={(e) =>
                          updateSpecialDate(index, "date", e.target.value)
                        }
                        className="h-11 w-full rounded-2xl border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-slate-400"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="mb-2 block text-sm font-medium text-slate-700">
                        Motivo o etiqueta
                      </label>
                      <input
                        type="text"
                        placeholder="Ej: Feriado, Navidad, Vacaciones"
                        value={item.label}
                        onChange={(e) =>
                          updateSpecialDate(index, "label", e.target.value)
                        }
                        className="h-11 w-full rounded-2xl border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-slate-400"
                      />
                    </div>

                    <div className="flex items-end">
                      <label className="flex h-11 w-full items-center gap-3 rounded-2xl border border-slate-300 bg-slate-50 px-4 text-sm text-slate-700">
                        <input
                          type="checkbox"
                          checked={item.is_closed}
                          onChange={(e) =>
                            updateSpecialDate(
                              index,
                              "is_closed",
                              e.target.checked
                            )
                          }
                          className="h-4 w-4 rounded border-slate-300"
                        />
                        Cerrado todo el día
                      </label>
                    </div>

                    <div className="flex items-end">
                      <button
                        type="button"
                        onClick={() => removeSpecialDate(index)}
                        className="inline-flex h-11 w-full items-center justify-center rounded-2xl border border-rose-200 bg-rose-50 px-4 text-sm font-medium text-rose-700 transition hover:bg-rose-100"
                      >
                        Quitar
                      </button>
                    </div>
                  </div>

                  {!item.is_closed ? (
                    <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                      <div>
                        <label className="mb-2 block text-sm font-medium text-slate-700">
                          Hora inicio
                        </label>
                        <input
                          type="time"
                          value={item.start_time}
                          onChange={(e) =>
                            updateSpecialDate(
                              index,
                              "start_time",
                              e.target.value
                            )
                          }
                          className="h-11 w-full rounded-2xl border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-slate-400"
                        />
                      </div>

                      <div>
                        <label className="mb-2 block text-sm font-medium text-slate-700">
                          Hora fin
                        </label>
                        <input
                          type="time"
                          value={item.end_time}
                          onChange={(e) =>
                            updateSpecialDate(index, "end_time", e.target.value)
                          }
                          className="h-11 w-full rounded-2xl border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-slate-400"
                        />
                      </div>
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          )}

          <div className="flex flex-wrap gap-3 pt-2">
            <button
              type="button"
              onClick={saveSpecialDates}
              disabled={savingSpecialDates}
              className="inline-flex h-11 items-center justify-center rounded-2xl bg-slate-900 px-5 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {savingSpecialDates ? "Guardando..." : "Guardar fechas especiales"}
            </button>
          </div>
        </div>
      </Panel>
    </div>
  );
}