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
  };
  calendar_id: string;
  google_connected?: boolean;
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

  const [businessHours, setBusinessHours] = useState<any[]>([]);

  const [form, setForm] = useState({
    name: "",
    phone: "",
    address: "",
    email: "",
    whatsapp: "",
    instagram_url: "",
    facebook_url: "",
    description: "",
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
        });

        loadBusinessHours(data.business.id);
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

  async function loadBusinessHours(id: string) {
    try {
      const res = await fetch(
        `https://orbyx-backend.onrender.com/business-hours?tenant_id=${id}`
      );

      const data = await res.json();

      if (res.ok) {
        if (data.hours?.length) {
          setBusinessHours(data.hours);
        } else {
          const defaultHours = days.map((_, i) => ({
            day_of_week: i,
            enabled: i !== 0 && i !== 6,
            start_time: "09:00",
            end_time: "18:00",
          }));

          setBusinessHours(defaultHours);
        }
      }
    } catch (err) {
      console.error("Error cargando horarios", err);
    }
  }

  async function saveBusinessHours() {
    try {
      setSavingHours(true);

      const res = await fetch(
        "https://orbyx-backend.onrender.com/business-hours",
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            tenant_id: tenantId,
            hours: businessHours,
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

      if (!tenantId) {
        throw new Error("No se encontró el negocio");
      }

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

  function updateHour(index: number, field: string, value: any) {
    const copy = [...businessHours];
    copy[index] = { ...copy[index], [field]: value };
    setBusinessHours(copy);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Negocio"
        title="Datos del negocio"
        description="Actualiza la información principal, redes y canales de contacto de tu negocio."
      />

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

      <Panel
        title="Horarios de atención"
        description="Define cuándo tu negocio está disponible para recibir reservas."
      >
        <div className="space-y-3">
          {businessHours.map((h, i) => (
            <div
              key={i}
              className="flex items-center justify-between gap-4 border-b pb-3"
            >
              <div className="w-32 font-medium">{days[h.day_of_week]}</div>

              <input
                type="checkbox"
                checked={h.enabled}
                onChange={(e) =>
                  updateHour(i, "enabled", e.target.checked)
                }
              />

              <input
                type="time"
                value={h.start_time}
                onChange={(e) =>
                  updateHour(i, "start_time", e.target.value)
                }
                disabled={!h.enabled}
                className="border rounded-lg px-2 py-1"
              />

              <span>-</span>

              <input
                type="time"
                value={h.end_time}
                onChange={(e) =>
                  updateHour(i, "end_time", e.target.value)
                }
                disabled={!h.enabled}
                className="border rounded-lg px-2 py-1"
              />
            </div>
          ))}
        </div>

        <button
          onClick={saveBusinessHours}
          className="mt-4 rounded-xl bg-slate-900 px-4 py-2 text-white"
        >
          {savingHours ? "Guardando..." : "Guardar horarios"}
        </button>
      </Panel>
    </div>
  );
}