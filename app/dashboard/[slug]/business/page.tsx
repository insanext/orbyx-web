"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { PageHeader } from "../../../../components/dashboard/page-header";
import { Panel } from "../../../../components/dashboard/panel";
import { StatCard } from "../../../../components/dashboard/stat-card";

/* ===============================
   🆕 TYPES NUEVOS
================================ */
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

export default function BusinessPage() {
  const params = useParams();
  const slug =
    ((params as any)?.slug as string) || ((params as any)?.Slug as string);

  const [tenantId, setTenantId] = useState("");

  const [bookingFields, setBookingFields] = useState<BookingField[]>([]);
  const [savingFields, setSavingFields] = useState(false);

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

  useEffect(() => {
    async function loadAll() {
      const res = await fetch(
        `https://orbyx-backend.onrender.com/public/business/${slug}`
      );

      const data: BusinessResponse = await res.json();

      setTenantId(data.business.id);

      setForm({
        name: data.business.name || "",
        phone: data.business.phone || "",
        address: data.business.address || "",
        email: data.business.email || "",
        whatsapp: data.business.whatsapp || "",
        instagram_url: data.business.instagram_url || "",
        facebook_url: data.business.facebook_url || "",
        description: data.business.description || "",
        min_booking_notice_minutes:
          data.business.min_booking_notice_minutes || 0,
        max_booking_days_ahead:
          data.business.max_booking_days_ahead || 60,
      });

      /* 🔹 cargar booking fields */
      const resFields = await fetch(
        `https://orbyx-backend.onrender.com/booking-fields/${slug}`
      );

      const dataFields = await resFields.json();

      setBookingFields(dataFields.booking_fields_config || []);
    }

    if (slug) loadAll();
  }, [slug]);

  function updateField(index: number, field: keyof BookingField, value: any) {
    setBookingFields((prev) =>
      prev.map((item, i) =>
        i === index ? { ...item, [field]: value } : item
      )
    );
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

      if (!res.ok) throw new Error("Error guardando");

      alert("Campos guardados correctamente");
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSavingFields(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Negocio"
        title="Datos del negocio"
        description="Configuración general"
      />

      <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <StatCard label="Página pública" value="Activa" />
        <StatCard label="Campos activos" value={`${bookingFields.filter(f => f.enabled).length}`} />
        <StatCard label="URL" value={publicUrl} />
      </section>

      {/* ===============================
         🆕 CAMPOS DE RESERVA
      ============================== */}
      <Panel
        title="Campos de reserva"
        description="Define qué datos pedir al cliente al reservar."
      >
        <div className="space-y-4">
          {bookingFields.map((field, index) => (
            <div
              key={field.key}
              className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-4"
            >
              <div>
                <p className="text-sm font-semibold text-slate-900">
                  {field.label}
                </p>
                <p className="text-xs text-slate-500">
                  {field.enabled
                    ? field.required
                      ? "Obligatorio"
                      : "Opcional"
                    : "Desactivado"}
                </p>
              </div>

              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={field.enabled}
                    onChange={(e) =>
                      updateField(index, "enabled", e.target.checked)
                    }
                  />
                  Activo
                </label>

                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={field.required}
                    disabled={!field.enabled}
                    onChange={(e) =>
                      updateField(index, "required", e.target.checked)
                    }
                  />
                  Obligatorio
                </label>
              </div>
            </div>
          ))}

          <button
            onClick={saveBookingFields}
            disabled={savingFields}
            className="rounded-2xl bg-slate-900 px-5 py-3 text-sm text-white"
          >
            {savingFields ? "Guardando..." : "Guardar campos"}
          </button>
        </div>
      </Panel>

      {/* ===============================
         INFO NEGOCIO (BÁSICO)
      ============================== */}
      <Panel title="Información principal">
        <div className="space-y-4">
          <input
            value={form.name}
            onChange={(e) =>
              setForm((p) => ({ ...p, name: e.target.value }))
            }
            className="h-11 w-full border px-3"
            placeholder="Nombre"
          />

          <input
            value={form.phone}
            onChange={(e) =>
              setForm((p) => ({ ...p, phone: e.target.value }))
            }
            className="h-11 w-full border px-3"
            placeholder="Teléfono"
          />

          <input
            value={form.email}
            onChange={(e) =>
              setForm((p) => ({ ...p, email: e.target.value }))
            }
            className="h-11 w-full border px-3"
            placeholder="Email"
          />
        </div>
      </Panel>
    </div>
  );
}