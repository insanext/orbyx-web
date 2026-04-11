"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { Panel } from "../../../../components/dashboard/panel";

type BookingField = {
  key: string;
  label: string;
  enabled: boolean;
  required: boolean;
};

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
    ((params as { slug?: string })?.slug as string) ||
    ((params as { Slug?: string })?.Slug as string) ||
    "";

  const [tenantId, setTenantId] = useState("");
const [branchId, setBranchId] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingHours, setSavingHours] = useState(false);
  const [savingFields, setSavingFields] = useState(false);
  const [savingSpecialDates, setSavingSpecialDates] = useState(false);

  const [loadError, setLoadError] = useState("");
  const [saveError, setSaveError] = useState("");
  const [saveOk, setSaveOk] = useState("");

  const [googleConnected, setGoogleConnected] = useState(false);
  const [businessHours, setBusinessHours] = useState<BusinessHour[]>([]);
  const [specialDates, setSpecialDates] = useState<SpecialDate[]>([]);
  const [bookingFields, setBookingFields] = useState<BookingField[]>([]);

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

  const surfaceClass = "rounded-2xl border px-4 py-3 shadow-sm";
  const softCardClass = "rounded-2xl border p-4";
  const inputClass =
    "h-11 w-full rounded-2xl border px-4 text-sm outline-none transition";
  const textareaClass =
    "min-h-[120px] w-full rounded-2xl border px-4 py-3 text-sm outline-none transition";
  const selectClass =
    "h-11 w-full rounded-2xl border px-4 text-sm outline-none transition";
  const primaryButtonClass =
    "inline-flex h-11 items-center justify-center rounded-2xl px-5 text-sm font-medium text-white transition disabled:cursor-not-allowed disabled:opacity-60";
  const secondaryButtonClass =
    "inline-flex h-11 items-center justify-center rounded-2xl border px-5 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-60";

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
const branchesRes = await fetch(
  `https://orbyx-backend.onrender.com/branches?tenant_id=${data.business.id}`
);

const branchesData = await branchesRes.json();

if (!branchesRes.ok) {
  throw new Error(branchesData?.error || "No se pudieron cargar las sucursales");
}

const firstBranchId =
  Array.isArray(branchesData.branches) && branchesData.branches.length > 0
    ? String(branchesData.branches[0].id)
    : "";

if (!firstBranchId) {
  throw new Error("No se encontró una sucursal activa");
}

setBranchId(firstBranchId);
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

        await loadBusinessHours(data.business.id, firstBranchId);
await loadSpecialDates(data.business.id, firstBranchId);
        await loadBookingFields();
      } catch (error: unknown) {
        setLoadError(
          error instanceof Error
            ? error.message
            : "No se pudo cargar el negocio"
        );
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

  async function loadBookingFields() {
    try {
      const res = await fetch(
        `https://orbyx-backend.onrender.com/booking-fields/${slug}`
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "Error cargando campos de reserva");
      }

      setBookingFields(
        Array.isArray(data.booking_fields_config)
          ? data.booking_fields_config
          : []
      );
    } catch (err) {
      console.error("Error cargando booking fields", err);
      setBookingFields([]);
    }
  }

  async function loadBusinessHours(id: string, currentBranchId: string) {
    try {
      const res = await fetch(
  `https://orbyx-backend.onrender.com/business-hours?tenant_id=${id}&branch_id=${currentBranchId}`
      );

      const data = await res.json();

      if (res.ok) {
        if (data.hours?.length) {
          const normalized = getDefaultHours().map((fallback) => {
            const existing = data.hours.find(
              (item: { day_of_week: number }) =>
                item.day_of_week === fallback.day_of_week
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

  async function loadSpecialDates(id: string, currentBranchId: string) {
    try {
      const res = await fetch(
  `https://orbyx-backend.onrender.com/business-special-dates?tenant_id=${id}&branch_id=${currentBranchId}`
);
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "Error cargando fechas especiales");
      }

      const normalized = Array.isArray(data.special_dates)
        ? data.special_dates.map(
            (item: {
              id?: string;
              date?: string;
              label?: string;
              is_closed?: boolean;
              start_time?: string;
              end_time?: string;
            }) => ({
              id: item.id,
              date: item.date || "",
              label: item.label || "",
              is_closed: Boolean(item.is_closed),
              start_time: String(item.start_time || "").slice(0, 5),
              end_time: String(item.end_time || "").slice(0, 5),
            })
          )
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
    value: string | boolean
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
  tenant_id: tenantId,
  branch_id: branchId,
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

      await loadSpecialDates(tenantId, branchId);
      alert("Fechas especiales guardadas correctamente");
    } catch (err: unknown) {
      alert(
        err instanceof Error
          ? err.message
          : "No se pudieron guardar las fechas especiales"
      );
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
  branch_id: branchId,
  hours: cleanedHours,
}),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "Error guardando horarios");
      }

      alert("Horarios guardados correctamente");
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Error guardando horarios");
    } finally {
      setSavingHours(false);
    }
  }

  async function saveBookingFields() {
    try {
      setSavingFields(true);

      const res = await fetch(
        `https://orbyx-backend.onrender.com/booking-fields/${slug}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            booking_fields_config: bookingFields,
          }),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "Error guardando campos");
      }

      alert("Campos guardados correctamente");
    } catch (err: unknown) {
      alert(
        err instanceof Error
          ? err.message
          : "No se pudieron guardar los campos"
      );
    } finally {
      setSavingFields(false);
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
    } catch (error: unknown) {
      setSaveError(
        error instanceof Error
          ? error.message
          : "No se pudo guardar la información"
      );
    } finally {
      setSaving(false);
    }
  }

  function updateHour(
    dayOfWeek: number,
    field: keyof BusinessHour,
    value: string | boolean | number
  ) {
    setBusinessHours((prev) =>
      prev.map((item) =>
        item.day_of_week === dayOfWeek ? { ...item, [field]: value } : item
      )
    );
  }

  function updateBookingField(
    index: number,
    field: keyof BookingField,
    value: boolean
  ) {
    setBookingFields((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item))
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

async function copyPublicUrl() {
  try {
    await navigator.clipboard.writeText(publicUrl);
    alert("URL copiada");
  } catch {
    alert("No se pudo copiar la URL");
  }
}

  return (
    <div className="space-y-6">
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
        Negocio
      </p>

      <h1
        className="text-3xl font-semibold tracking-tight sm:text-4xl"
        style={{ color: "var(--text-main)" }}
      >
        Datos del negocio
      </h1>

      <p
        className="mt-3 max-w-2xl text-sm leading-6 sm:text-[15px]"
        style={{ color: "var(--text-muted)" }}
      >
        Actualiza la información principal, horarios, fechas especiales y
        campos que pedirás al cliente al reservar.
      </p>
    </div>

    <div
      className="grid gap-3 sm:grid-cols-2"
      style={{ color: "var(--text-main)" }}
    >
      <div
        className="rounded-2xl border px-4 py-3"
        style={{
          borderColor: "rgba(59,130,246,0.24)",
          background: "rgba(255,255,255,0.08)",
        }}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p
              className="text-[11px] font-semibold uppercase tracking-[0.16em]"
              style={{ color: "var(--text-muted)" }}
            >
              URL pública
            </p>

            <p className="mt-2 break-all text-sm font-semibold">{publicUrl}</p>
          </div>

          <button
            type="button"
            onClick={copyPublicUrl}
            className="inline-flex h-9 shrink-0 items-center justify-center rounded-xl px-3 text-xs font-semibold transition"
            style={{
              background:
                "linear-gradient(135deg, rgb(37 99 235), rgb(14 165 233))",
              color: "#ffffff",
            }}
          >
            Copiar
          </button>
        </div>
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
          Google Calendar
        </p>
        <p className="mt-2 text-sm font-semibold">
          {loading
            ? "Cargando..."
            : googleConnected
            ? "Conectado"
            : "Pendiente"}
        </p>
      </div>
    </div>
  </div>
</section>
      {loadError ? (
        <div className="rounded-2xl border border-rose-300/60 bg-rose-500/10 px-4 py-3 text-sm text-rose-300 shadow-sm">
          {loadError}
        </div>
      ) : null}

      <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <Panel
          title="Información principal"
          description="Edita los datos que verán tus clientes y que también podrá usar la IA."
          className="bg-[linear-gradient(180deg,rgba(37,99,235,0.08),transparent_35%)]"
        >
          {loading ? (
            <div
              className="rounded-2xl border border-dashed px-4 py-8 text-sm"
              style={{
                borderColor: "var(--border-color)",
                background: "var(--bg-soft)",
                color: "var(--text-muted)",
              }}
            >
              Cargando datos...
            </div>
          ) : (
            <div className="space-y-5">
              <div>
                <label
                  className="mb-2 block text-sm font-medium"
                  style={{ color: "var(--text-main)" }}
                >
                  Nombre del negocio
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
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
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
                    placeholder="Ej: +56 9 1234 5678"
                    className={inputClass}
                    style={{
                      borderColor: "var(--border-color)",
                      background: "var(--bg-card)",
                      color: "var(--text-main)",
                    }}
                  />
                </div>

                <div>
                  <label
                    className="mb-2 block text-sm font-medium"
                    style={{ color: "var(--text-main)" }}
                  >
                    WhatsApp
                  </label>
                  <input
                    type="text"
                    value={form.whatsapp}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, whatsapp: e.target.value }))
                    }
                    placeholder="Ej: +56 9 1234 5678"
                    className={inputClass}
                    style={{
                      borderColor: "var(--border-color)",
                      background: "var(--bg-card)",
                      color: "var(--text-main)",
                    }}
                  />
                </div>
              </div>

              <div>
                <label
                  className="mb-2 block text-sm font-medium"
                  style={{ color: "var(--text-main)" }}
                >
                  Correo de contacto
                </label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, email: e.target.value }))
                  }
                  placeholder="Ej: contacto@tunegocio.cl"
                  className={inputClass}
                  style={{
                    borderColor: "var(--border-color)",
                    background: "var(--bg-card)",
                    color: "var(--text-main)",
                  }}
                />
              </div>

              <div>
                <label
                  className="mb-2 block text-sm font-medium"
                  style={{ color: "var(--text-main)" }}
                >
                  Dirección
                </label>
                <input
                  type="text"
                  value={form.address}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, address: e.target.value }))
                  }
                  placeholder="Ej: Avenida Principal 123, Concepción"
                  className={inputClass}
                  style={{
                    borderColor: "var(--border-color)",
                    background: "var(--bg-card)",
                    color: "var(--text-main)",
                  }}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label
                    className="mb-2 block text-sm font-medium"
                    style={{ color: "var(--text-main)" }}
                  >
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
                    className={inputClass}
                    style={{
                      borderColor: "var(--border-color)",
                      background: "var(--bg-card)",
                      color: "var(--text-main)",
                    }}
                  />
                </div>

                <div>
                  <label
                    className="mb-2 block text-sm font-medium"
                    style={{ color: "var(--text-main)" }}
                  >
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
                    className={inputClass}
                    style={{
                      borderColor: "var(--border-color)",
                      background: "var(--bg-card)",
                      color: "var(--text-main)",
                    }}
                  />
                </div>
              </div>

              <div>
                <label
                  className="mb-2 block text-sm font-medium"
                  style={{ color: "var(--text-main)" }}
                >
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
                  className={textareaClass}
                  style={{
                    borderColor: "var(--border-color)",
                    background: "var(--bg-card)",
                    color: "var(--text-main)",
                  }}
                />
              </div>

              <div>
                <label
                  className="mb-2 block text-sm font-medium"
                  style={{ color: "var(--text-main)" }}
                >
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
                  className={selectClass}
                  style={{
                    borderColor: "var(--border-color)",
                    background: "var(--bg-card)",
                    color: "var(--text-main)",
                  }}
                >
                  <option value={0}>Sin restricción</option>
                  <option value={15}>15 minutos</option>
                  <option value={30}>30 minutos</option>
                  <option value={60}>1 hora</option>
                  <option value={120}>2 horas</option>
                </select>

                <p
                  className="mt-2 text-xs"
                  style={{ color: "var(--text-muted)" }}
                >
                  Evita reservas inmediatas. Ej: si eliges 1 hora, los clientes
                  solo podrán reservar con al menos 60 minutos de anticipación.
                </p>
              </div>

              <div>
                <label
                  className="mb-2 block text-sm font-medium"
                  style={{ color: "var(--text-main)" }}
                >
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
                  className={selectClass}
                  style={{
                    borderColor: "var(--border-color)",
                    background: "var(--bg-card)",
                    color: "var(--text-main)",
                  }}
                >
                  <option value={7}>7 días</option>
                  <option value={14}>14 días</option>
                  <option value={30}>30 días</option>
                  <option value={60}>60 días</option>
                  <option value={90}>90 días</option>
                </select>

                <p
                  className="mt-2 text-xs"
                  style={{ color: "var(--text-muted)" }}
                >
                  Limita cuántos días hacia el futuro pueden agendar los
                  clientes.
                </p>
              </div>

              {saveError ? (
                <div className="rounded-2xl border border-rose-300/60 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">
                  {saveError}
                </div>
              ) : null}

              {saveOk ? (
                <div className="rounded-2xl border border-emerald-300/50 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
                  {saveOk}
                </div>
              ) : null}

              <div className="flex flex-wrap gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving}
                  className={primaryButtonClass}
                  style={{
                    background:
                      "linear-gradient(135deg, rgb(37 99 235), rgb(14 165 233))",
                  }}
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
          className="bg-[linear-gradient(180deg,rgba(14,165,233,0.06),transparent_40%)]"
        >
          <div className="space-y-4">
            {[
              {
                label: "Nombre",
                value: loading ? "Cargando..." : form.name || "No definido",
              },
              {
                label: "Contacto",
                value: loading
                  ? "Cargando..."
                  : form.phone || form.whatsapp || "No definido",
              },
              {
                label: "Correo",
                value: loading ? "Cargando..." : form.email || "No definido",
              },
              {
                label: "Redes sociales",
                value: loading
                  ? "Cargando..."
                  : form.instagram_url || form.facebook_url
                  ? "Configuradas"
                  : "No configuradas",
              },
              {
                label: "URL pública",
                value: publicUrl,
              },
              {
                label: "Google Calendar",
                value: loading
                  ? "Cargando..."
                  : googleConnected
                  ? "Conectado"
                  : "Pendiente",
              },
            ].map((item) => (
              <div
                key={item.label}
                className={softCardClass}
                style={{
                  borderColor: "var(--border-color)",
                  background:
                    "linear-gradient(135deg, rgba(37,99,235,0.08), var(--bg-soft))",
                }}
              >
                <p
                  className="text-xs font-semibold uppercase tracking-[0.16em]"
                  style={{ color: "var(--text-muted)" }}
                >
                  {item.label}
                </p>
                <p
                  className="mt-2 break-all text-sm font-semibold"
                  style={{ color: "var(--text-main)" }}
                >
                  {item.value}
                </p>
              </div>
            ))}
          </div>
        </Panel>
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <Panel
          title="Campos de reserva"
          description="Define qué información solicitar al cliente al reservar."
          className="bg-[linear-gradient(180deg,rgba(37,99,235,0.06),transparent_35%)]"
        >
          <div className="space-y-4">
            {bookingFields.length === 0 ? (
              <div
                className="rounded-2xl border border-dashed px-4 py-6 text-sm"
                style={{
                  borderColor: "var(--border-color)",
                  background: "var(--bg-soft)",
                  color: "var(--text-muted)",
                }}
              >
                No hay campos configurables cargados aún.
              </div>
            ) : (
              bookingFields.map((field, index) => (
                <div
                  key={field.key}
                  className="flex items-center justify-between rounded-2xl border p-4"
                  style={{
                    borderColor: "var(--border-color)",
                    background:
                      "linear-gradient(135deg, rgba(37,99,235,0.06), var(--bg-card))",
                  }}
                >
                  <div>
                    <p
                      className="text-sm font-semibold"
                      style={{ color: "var(--text-main)" }}
                    >
                      {field.label}
                    </p>
                    <p
                      className="text-xs"
                      style={{ color: "var(--text-muted)" }}
                    >
                      {field.enabled
                        ? field.required
                          ? "Obligatorio"
                          : "Opcional"
                        : "Desactivado"}
                    </p>
                  </div>

                  <div
                    className="flex items-center gap-4 text-sm"
                    style={{ color: "var(--text-main)" }}
                  >
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={field.enabled}
                        onChange={(e) =>
                          updateBookingField(index, "enabled", e.target.checked)
                        }
                      />
                      Activo
                    </label>

                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={field.required}
                        disabled={!field.enabled}
                        onChange={(e) =>
                          updateBookingField(index, "required", e.target.checked)
                        }
                      />
                      Obligatorio
                    </label>
                  </div>
                </div>
              ))
            )}

            <button
              onClick={saveBookingFields}
              disabled={savingFields}
              className={primaryButtonClass}
              style={{
                background:
                  "linear-gradient(135deg, rgb(37 99 235), rgb(14 165 233))",
              }}
            >
              {savingFields ? "Guardando..." : "Guardar campos"}
            </button>
          </div>
        </Panel>

        <Panel
          title="Horarios de atención"
          description="Define cuándo tu negocio está disponible para recibir reservas."
          className="bg-[linear-gradient(180deg,rgba(14,165,233,0.05),transparent_35%)]"
        >
          <div
            className="overflow-hidden rounded-2xl border"
            style={{ borderColor: "var(--border-color)" }}
          >
            <div
              className="grid grid-cols-[120px_80px_1fr_30px_1fr] gap-3 border-b px-4 py-3 text-xs font-semibold uppercase tracking-[0.12em]"
              style={{
                borderColor: "var(--border-color)",
                background:
                  "linear-gradient(135deg, rgba(37,99,235,0.12), var(--bg-soft))",
                color: "var(--text-muted)",
              }}
            >
              <div>Día</div>
              <div>Activo</div>
              <div>Inicio</div>
              <div></div>
              <div>Fin</div>
            </div>

            <div
              className="divide-y"
              style={{ borderColor: "var(--border-color)" }}
            >
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
                    className="grid grid-cols-[120px_80px_1fr_30px_1fr] items-center gap-3 px-4 py-3"
                    style={{ background: "var(--bg-card)" }}
                  >
                    <div
                      className="text-sm font-medium"
                      style={{ color: "var(--text-main)" }}
                    >
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
                        className="h-11 w-full rounded-2xl border px-4 text-sm outline-none transition"
                        style={{
                          borderColor: !h.enabled
                            ? "var(--border-color)"
                            : startValid
                            ? "var(--border-color)"
                            : "rgb(253 164 175)",
                          background: "var(--bg-soft)",
                          color: "var(--text-main)",
                          opacity: !h.enabled ? 0.6 : 1,
                        }}
                      />
                    </div>

                    <div
                      className="text-center"
                      style={{ color: "var(--text-muted)" }}
                    >
                      —
                    </div>

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
                        className="h-11 w-full rounded-2xl border px-4 text-sm outline-none transition"
                        style={{
                          borderColor: !h.enabled
                            ? "var(--border-color)"
                            : endValid
                            ? "var(--border-color)"
                            : "rgb(253 164 175)",
                          background: "var(--bg-soft)",
                          color: "var(--text-main)",
                          opacity: !h.enabled ? 0.6 : 1,
                        }}
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
              className={primaryButtonClass}
              style={{
                background:
                  "linear-gradient(135deg, rgb(37 99 235), rgb(14 165 233))",
              }}
            >
              {savingHours ? "Guardando..." : "Guardar horarios"}
            </button>
          </div>
        </Panel>
      </section>

      <Panel
        title="Fechas especiales"
        description="Configura feriados, vísperas, vacaciones, cierres y horarios especiales por fecha."
        className="bg-[linear-gradient(180deg,rgba(37,99,235,0.05),transparent_35%)]"
      >
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p
                className="text-sm font-medium"
                style={{ color: "var(--text-main)" }}
              >
                Excepciones del calendario
              </p>
              <p
                className="text-sm"
                style={{ color: "var(--text-muted)" }}
              >
                Ejemplos: 18 septiembre cerrado, 24 diciembre 09:00 a 13:00.
              </p>
            </div>

            <button
              type="button"
              onClick={addSpecialDate}
              className={secondaryButtonClass}
              style={{
                borderColor: "var(--border-color)",
                background: "var(--bg-soft)",
                color: "var(--text-main)",
              }}
            >
              Agregar fecha especial
            </button>
          </div>

          {specialDates.length === 0 ? (
            <div
              className="rounded-2xl border border-dashed px-4 py-6 text-sm"
              style={{
                borderColor: "var(--border-color)",
                background: "var(--bg-soft)",
                color: "var(--text-muted)",
              }}
            >
              Aún no has agregado fechas especiales.
            </div>
          ) : (
            <div className="space-y-4">
              {specialDates.map((item, index) => (
                <div
                  key={item.id || `new-${index}`}
                  className="rounded-2xl border p-4 shadow-sm"
                  style={{
                    borderColor: "var(--border-color)",
                    background:
                      "linear-gradient(135deg, rgba(37,99,235,0.06), var(--bg-card))",
                  }}
                >
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-5">
                    <div>
                      <label
                        className="mb-2 block text-sm font-medium"
                        style={{ color: "var(--text-main)" }}
                      >
                        Fecha
                      </label>
                      <input
                        type="date"
                        value={item.date}
                        onChange={(e) =>
                          updateSpecialDate(index, "date", e.target.value)
                        }
                        className="h-11 w-full rounded-2xl border px-3 text-sm outline-none transition"
                        style={{
                          borderColor: "var(--border-color)",
                          background: "var(--bg-soft)",
                          color: "var(--text-main)",
                        }}
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label
                        className="mb-2 block text-sm font-medium"
                        style={{ color: "var(--text-main)" }}
                      >
                        Motivo o etiqueta
                      </label>
                      <input
                        type="text"
                        placeholder="Ej: Feriado, Navidad, Vacaciones"
                        value={item.label}
                        onChange={(e) =>
                          updateSpecialDate(index, "label", e.target.value)
                        }
                        className="h-11 w-full rounded-2xl border px-3 text-sm outline-none transition"
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
                          checked={item.is_closed}
                          onChange={(e) =>
                            updateSpecialDate(
                              index,
                              "is_closed",
                              e.target.checked
                            )
                          }
                          className="h-4 w-4 rounded"
                        />
                        Cerrado todo el día
                      </label>
                    </div>

                    <div className="flex items-end">
                      <button
                        type="button"
                        onClick={() => removeSpecialDate(index)}
                        className="inline-flex h-11 w-full items-center justify-center rounded-2xl border border-rose-300/60 bg-rose-500/10 px-4 text-sm font-medium text-rose-300 transition hover:bg-rose-500/15"
                      >
                        Quitar
                      </button>
                    </div>
                  </div>

                  {!item.is_closed ? (
                    <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                      <div>
                        <label
                          className="mb-2 block text-sm font-medium"
                          style={{ color: "var(--text-main)" }}
                        >
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
                          className="h-11 w-full rounded-2xl border px-3 text-sm outline-none transition"
                          style={{
                            borderColor: "var(--border-color)",
                            background: "var(--bg-soft)",
                            color: "var(--text-main)",
                          }}
                        />
                      </div>

                      <div>
                        <label
                          className="mb-2 block text-sm font-medium"
                          style={{ color: "var(--text-main)" }}
                        >
                          Hora fin
                        </label>
                        <input
                          type="time"
                          value={item.end_time}
                          onChange={(e) =>
                            updateSpecialDate(index, "end_time", e.target.value)
                          }
                          className="h-11 w-full rounded-2xl border px-3 text-sm outline-none transition"
                          style={{
                            borderColor: "var(--border-color)",
                            background: "var(--bg-soft)",
                            color: "var(--text-main)",
                          }}
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
              className={primaryButtonClass}
              style={{
                background:
                  "linear-gradient(135deg, rgb(37 99 235), rgb(14 165 233))",
              }}
            >
              {savingSpecialDates ? "Guardando..." : "Guardar fechas especiales"}
            </button>
          </div>
        </div>
      </Panel>
    </div>
  );
}