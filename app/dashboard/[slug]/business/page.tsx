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

type SubtypeBookingField = {
  key: string;
  label: string;
  enabled: boolean;
  required: boolean;
  type: "text" | "textarea" | "select";
  options?: string[];
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
    business_category?: string | null;
    business_subtype?: string | null;
    business_subtype_config?: Record<string, unknown> | null;
    min_booking_notice_minutes?: number | null;
    max_booking_days_ahead?: number | null;
  };
  calendar_id: string;
slot_minutes?: number | null;
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

type BranchItem = {
  id: string;
  name: string;
  is_active?: boolean;
};

type BusinessSectionId = "general" | "reservas" | "horarios" | "fechas";

const genericBusinessSubtypes = [
  {
    value: "",
    label: "Sin subtipo",
    description: "Experiencia genérica base.",
  },
  {
    value: "belleza_estetica",
    label: "Belleza y estética",
    description: "Peluquerías, barberías, uñas, estética y similares.",
  },
  {
    value: "salud_bienestar",
    label: "Salud y bienestar",
    description: "Terapias, bienestar, consultas no veterinarias.",
  },
  {
    value: "taller_automotriz",
    label: "Taller automotriz",
    description: "Talleres, mantenciones y servicios para vehículos.",
  },
  {
    value: "servicios_tecnicos",
    label: "Servicios técnicos",
    description: "Reparaciones, soporte técnico y visitas técnicas.",
  },
  {
    value: "profesionales_cita",
    label: "Profesionales con cita",
    description: "Consultores, asesores y atención profesional.",
  },
  {
    value: "educacion_individual",
    label: "Educación individual",
    description: "Clases uno a uno, tutorías y sesiones individuales.",
  },
  {
    value: "servicios_creativos",
    label: "Servicios creativos",
    description: "Fotografía, diseño, producción y servicios creativos.",
  },
];

const tallerAutomotrizBookingFields: SubtypeBookingField[] = [
  {
    key: "unit_type",
    label: "Tipo de vehículo/equipo",
    enabled: true,
    required: false,
    type: "select",
    options: ["Auto", "Moto", "Camión", "Maquinaria", "Bus"],
  },
  {
    key: "brand",
    label: "Marca",
    enabled: true,
    required: false,
    type: "text",
    options: [],
  },
  { key: "model", label: "Modelo", enabled: true, required: false, type: "text", options: [] },
  { key: "year", label: "Año", enabled: false, required: false, type: "text", options: [] },
  {
    key: "unit_identifier",
    label: "Patente / Identificador",
    enabled: false,
    required: false,
    type: "text",
    options: [],
  },
  {
    key: "usage_value",
    label: "Kilometraje / Horas de uso",
    enabled: false,
    required: false,
    type: "text",
    options: [],
  },
  {
    key: "visit_reason",
    label: "Motivo de la visita",
    enabled: true,
    required: false,
    type: "textarea",
    options: [],
  },
  {
    key: "observations",
    label: "Observaciones",
    enabled: false,
    required: false,
    type: "textarea",
    options: [],
  },
];

function normalizeSubtypeBookingFields(
  fields?: unknown
): SubtypeBookingField[] {
  const savedFields = Array.isArray(fields) ? fields : [];

  return tallerAutomotrizBookingFields.map((baseField) => {
    const savedField = savedFields.find((item) => {
      if (!item || typeof item !== "object") return false;
      return (item as { key?: unknown }).key === baseField.key;
    }) as Partial<SubtypeBookingField> | undefined;
    const savedType =
      savedField?.type === "select" ||
      savedField?.type === "textarea" ||
      savedField?.type === "text"
        ? savedField.type
        : baseField.type;
    const savedOptions = Array.isArray(savedField?.options)
      ? savedField.options
          .map((option) => String(option || "").trim())
          .filter(Boolean)
      : baseField.options || [];
    const savedLabel =
      typeof savedField?.label === "string" && savedField.label.trim()
        ? savedField.label.trim()
        : "";

    return {
      ...baseField,
      label:
        savedLabel && savedLabel !== "Tipo de unidad/equipo"
          ? savedLabel
          : baseField.label,
      enabled:
        typeof savedField?.enabled === "boolean"
          ? savedField.enabled
          : baseField.enabled,
      required:
        typeof savedField?.required === "boolean"
          ? savedField.required
          : baseField.required,
      type: savedType,
      options: savedType === "select" ? savedOptions : [],
    };
  });
}

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
  const [selectedBranchId, setSelectedBranchId] = useState("");
const [calendarId, setCalendarId] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingHours, setSavingHours] = useState(false);
const [savingSlotMinutes, setSavingSlotMinutes] = useState(false);
const [slotMinutesOk, setSlotMinutesOk] = useState("");
const [slotMinutesError, setSlotMinutesError] = useState("");
  const [savingFields, setSavingFields] = useState(false);
  const [savingSpecialDates, setSavingSpecialDates] = useState(false);

  const [loadError, setLoadError] = useState("");
  const [saveError, setSaveError] = useState("");
  const [saveOk, setSaveOk] = useState("");
  const [hoursError, setHoursError] = useState("");
  const [hoursOk, setHoursOk] = useState("");
  const [specialDatesError, setSpecialDatesError] = useState("");
  const [specialDatesOk, setSpecialDatesOk] = useState("");

  const [googleConnected, setGoogleConnected] = useState(false);
  const [businessHours, setBusinessHours] = useState<BusinessHour[]>([]);
  const [specialDates, setSpecialDates] = useState<SpecialDate[]>([]);
  const [bookingFields, setBookingFields] = useState<BookingField[]>([]);
  const [businessSubtypeConfig, setBusinessSubtypeConfig] = useState<{
    booking_fields: SubtypeBookingField[];
  }>({ booking_fields: [] });
  const [subtypeOptionDrafts, setSubtypeOptionDrafts] = useState<
    Record<string, string>
  >({});
  const [businessCategory, setBusinessCategory] = useState("");
const [slotMinutes, setSlotMinutes] = useState(30);
const [customSlotMinutes, setCustomSlotMinutes] = useState(30);
const [slotMinutesMode, setSlotMinutesMode] = useState<"preset" | "custom">("preset");
const [minNoticeMode, setMinNoticeMode] = useState<"preset" | "custom">("preset");
const [maxDaysMode, setMaxDaysMode] = useState<"preset" | "custom">("preset");

  const [form, setForm] = useState({
    name: "",
    phone: "",
    address: "",
    email: "",
    whatsapp: "",
    instagram_url: "",
    facebook_url: "",
    description: "",
    business_subtype: "",
    min_booking_notice_minutes: 0,
    max_booking_days_ahead: 60,
  });

  const publicUrl = useMemo(() => `https://orbyx.cl/${slug}`, [slug]);
  const branchStorageKey = useMemo(() => {
    return slug ? `orbyx_active_branch_${slug}` : "";
  }, [slug]);
  const [activeSection, setActiveSection] = useState<BusinessSectionId>("general");

  const businessSectionTabs: Array<{
    id: BusinessSectionId;
    label: string;
  }> = [
    { id: "general", label: "General" },
    { id: "reservas", label: "Campos" },
    { id: "horarios", label: "Horarios" },
    { id: "fechas", label: "Fechas especiales" },
  ];

  const softCardClass = "rounded-2xl border p-4";
  const inputClass =
    "h-11 w-full rounded-2xl border px-4 text-sm outline-none transition";
  const textareaClass =
    "min-h-[120px] w-full rounded-2xl border px-4 py-3 text-sm outline-none transition";
  const selectClass =
    "h-11 w-full rounded-2xl border px-4 text-sm outline-none transition";
  const primaryButtonClass =
    "orbyx-business-energy inline-flex h-11 w-full items-center justify-center rounded-2xl border px-5 text-sm font-medium text-white transition disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto";
  const secondaryButtonClass =
    "orbyx-business-energy inline-flex h-11 w-full items-center justify-center rounded-2xl border px-5 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto";

  function readStoredBranchId() {
    if (typeof window === "undefined" || !branchStorageKey) return "";
    return localStorage.getItem(branchStorageKey) || "";
  }

  function persistSelectedBranchId(branchId: string) {
    setSelectedBranchId(branchId);

    if (typeof window !== "undefined" && branchStorageKey) {
      if (branchId) {
        localStorage.setItem(branchStorageKey, branchId);
      } else {
        localStorage.removeItem(branchStorageKey);
      }
    }
  }

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
	setCalendarId(data.calendar_id);

        const branchesRes = await fetch(
          `https://orbyx-backend.onrender.com/branches?tenant_id=${data.business.id}`
        );

        const branchesData = await branchesRes.json();

        if (!branchesRes.ok) {
          throw new Error(
            branchesData?.error || "No se pudieron cargar las sucursales"
          );
        }

        const activeBranches: BranchItem[] = Array.isArray(branchesData.branches)
          ? branchesData.branches.filter(
              (branch: BranchItem) => branch.is_active !== false
            )
          : [];

        const storedBranchId = readStoredBranchId();
        const storedBranchExists = activeBranches.some(
          (branch) => branch.id === storedBranchId
        );
        const activeBranchId = storedBranchExists
          ? storedBranchId
          : activeBranches[0]?.id || "";

        if (!activeBranchId) {
          throw new Error("No se encontró una sucursal activa");
        }

        persistSelectedBranchId(activeBranchId);
        setGoogleConnected(Boolean(data.google_connected));
        const normalizedCategory = String(
          data.business.business_category || "generic"
        )
          .trim()
          .toLowerCase();
        setBusinessCategory(normalizedCategory);
setSlotMinutes(Number(data.slot_minutes || 30));
setCustomSlotMinutes(Number(data.slot_minutes || 30));
        const normalizedSubtype =
          normalizedCategory === "generic"
            ? data.business.business_subtype || ""
            : "";
        const rawSubtypeConfig = data.business.business_subtype_config as
          | { booking_fields?: unknown }
          | null
          | undefined;

        setBusinessSubtypeConfig({
          booking_fields:
            normalizedSubtype === "taller_automotriz"
              ? normalizeSubtypeBookingFields(rawSubtypeConfig?.booking_fields)
              : [],
        });

        setForm({
          name: data.business.name || "",
          phone: data.business.phone || "",
          address: data.business.address || "",
          email: data.business.email || "",
          whatsapp: data.business.whatsapp || "",
          instagram_url: data.business.instagram_url || "",
          facebook_url: data.business.facebook_url || "",
          description: data.business.description || "",
          business_subtype: normalizedSubtype,
          min_booking_notice_minutes: Number(
            data.business.min_booking_notice_minutes || 0
          ),
          max_booking_days_ahead: Number(
            data.business.max_booking_days_ahead || 60
          ),
        });

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

  useEffect(() => {
    function handleBranchChanged(event: Event) {
      const customEvent = event as CustomEvent<{
        slug?: string;
        branchId?: string;
      }>;

      if (customEvent.detail?.slug !== slug) return;

      setSelectedBranchId(customEvent.detail?.branchId || "");
      setHoursError("");
      setHoursOk("");
      setSpecialDatesError("");
      setSpecialDatesOk("");
    }

    function handleStorage(event: StorageEvent) {
      if (event.key !== branchStorageKey) return;

      setSelectedBranchId(event.newValue || "");
      setHoursError("");
      setHoursOk("");
      setSpecialDatesError("");
      setSpecialDatesOk("");
    }

    window.addEventListener(
      "orbyx-branch-changed",
      handleBranchChanged as EventListener
    );
    window.addEventListener("storage", handleStorage);

    return () => {
      window.removeEventListener(
        "orbyx-branch-changed",
        handleBranchChanged as EventListener
      );
      window.removeEventListener("storage", handleStorage);
    };
  }, [slug, branchStorageKey]);

  useEffect(() => {
    if (!tenantId || !selectedBranchId) return;

    loadBusinessHours(tenantId, selectedBranchId);
    loadSpecialDates(tenantId, selectedBranchId);
  }, [tenantId, selectedBranchId]);

  function getDefaultHours(): BusinessHour[] {
    return [
      { day_of_week: 0, enabled: false, start_time: "09:00", end_time: "18:00" },
      { day_of_week: 1, enabled: true, start_time: "09:00", end_time: "18:00" },
      { day_of_week: 2, enabled: true, start_time: "09:00", end_time: "18:00" },
      { day_of_week: 3, enabled: true, start_time: "09:00", end_time: "18:00" },
      { day_of_week: 4, enabled: true, start_time: "09:00", end_time: "18:00" },
      { day_of_week: 5, enabled: true, start_time: "09:00", end_time: "18:00" },
      { day_of_week: 6, enabled: false, start_time: "09:00", end_time: "18:00" },
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
          const grouped: Record<number, BusinessHour[]> = {};

for (const item of data.hours) {
  const day = Number(item.day_of_week);

  if (!grouped[day]) grouped[day] = [];

  grouped[day].push({
    day_of_week: day,
    enabled: Boolean(item.enabled),
    start_time: String(item.start_time || "").slice(0, 5),
    end_time: String(item.end_time || "").slice(0, 5),
  });
}

const result: BusinessHour[] = [];

for (const day of displayOrder) {
  if (grouped[day] && grouped[day].length > 0) {
    result.push(...grouped[day]);
  } else {
    result.push({
      day_of_week: day,
      enabled: false,
      start_time: "09:00",
      end_time: "18:00",
    });
  }
}

setBusinessHours(result);
              

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

async function removeSpecialDate(index: number) {
  const item = specialDates[index];

  if (!item) return;

  const confirmed = window.confirm(
    "¿Seguro que quieres quitar esta fecha especial?"
  );

  if (!confirmed) return;

  try {
    setSavingSpecialDates(true);
    setSpecialDatesError("");
    setSpecialDatesOk("");

    if (item.id) {
      const res = await fetch(
        `https://orbyx-backend.onrender.com/business-special-dates/${item.id}`,
        {
          method: "DELETE",
        }
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "Error eliminando fecha especial");
      }
    }

    setSpecialDates((prev) => prev.filter((_, i) => i !== index));
    setSpecialDatesOk("Fecha especial eliminada correctamente");
  } catch (err: unknown) {
    setSpecialDatesError(
      err instanceof Error
        ? err.message
        : "No se pudo eliminar la fecha especial"
    );
  } finally {
    setSavingSpecialDates(false);
  }
}

  async function saveSpecialDates() {
    try {
      setSavingSpecialDates(true);
      setSpecialDatesError("");
      setSpecialDatesOk("");

      if (!selectedBranchId) {
        throw new Error("No hay sucursal activa seleccionada");
      }

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
              branch_id: selectedBranchId,
              date: item.date,
              label: item.label,
              is_closed: item.is_closed,
              start_time: item.is_closed ? item.start_time || null : item.start_time,
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
              branch_id: selectedBranchId,
              date: item.date,
              label: item.label,
              is_closed: item.is_closed,
              start_time: item.is_closed ? item.start_time || null : item.start_time,
              end_time: item.is_closed ? item.end_time || null : item.end_time,
            }),
          }
        );

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data?.error || "Error creando fecha especial");
        }
      }

      await loadSpecialDates(tenantId, selectedBranchId);
      setSpecialDatesOk("Fechas especiales guardadas correctamente");
    } catch (err: unknown) {
      setSpecialDatesError(
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
      setHoursError("");
      setHoursOk("");

if (!selectedBranchId) {
  throw new Error("No hay sucursal activa seleccionada");
}

const grouped: Record<
  number,
  {
    day_of_week: number;
    enabled: boolean;
    blocks: { start_time: string; end_time: string }[];
  }
> = {};

for (const h of businessHours) {
  if (!grouped[h.day_of_week]) {
    grouped[h.day_of_week] = {
      day_of_week: h.day_of_week,
      enabled: h.enabled,
      blocks: [],
    };
  }

  if (h.enabled && h.start_time && h.end_time) {
    grouped[h.day_of_week].blocks.push({
      start_time: h.start_time,
      end_time: h.end_time,
    });
  }
}

const cleanedHours = Object.values(grouped);

      const res = await fetch(
        "https://orbyx-backend.onrender.com/business-hours",
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            tenant_id: tenantId,
            branch_id: selectedBranchId,
            hours: cleanedHours,
          }),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "Error guardando horarios");
      }

      setHoursOk("Horarios guardados correctamente");
    } catch (err: unknown) {
      setHoursError(
        err instanceof Error ? err.message : "Error guardando horarios"
      );
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

      if (businessCategory === "generic") {
        const tenantRes = await fetch(
          `https://orbyx-backend.onrender.com/tenants/${tenantId}`,
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              ...form,
              business_subtype_config:
                form.business_subtype === "taller_automotriz"
                  ? businessSubtypeConfig
                  : {},
            }),
          }
        );

        const tenantData = await tenantRes.json();

        if (!tenantRes.ok) {
          throw new Error(
            tenantData?.error || "Error guardando campos del tipo de negocio"
          );
        }
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

async function saveSlotMinutes() {
  try {
    setSavingSlotMinutes(true);
    setSlotMinutesOk("");
    setSlotMinutesError("");

    const value = Number(slotMinutes || 30);

    const res = await fetch(
      `https://orbyx-backend.onrender.com/calendars/${calendarId}/slot-minutes`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slot_minutes: value,
        }),
      }
    );

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data?.error || "No se pudo guardar el intervalo");
    }

    setSlotMinutesOk("Intervalo guardado correctamente.");
  } catch (err: unknown) {
    setSlotMinutesError(
      err instanceof Error ? err.message : "No se pudo guardar el intervalo"
    );
  } finally {
    setSavingSlotMinutes(false);
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
          body: JSON.stringify({
            ...form,
            business_subtype_config:
              businessCategory === "generic" &&
              form.business_subtype === "taller_automotriz"
                ? businessSubtypeConfig
                : {},
          }),
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

function updateHourByIndex(
  index: number,
  field: keyof BusinessHour,
  value: string | boolean | number
) {
  setBusinessHours((prev) =>
    prev.map((item, i) =>
      i === index ? { ...item, [field]: value } : item
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

  function updateSubtypeBookingField(
    index: number,
    field: keyof Pick<
      SubtypeBookingField,
      "label" | "enabled" | "required" | "type" | "options"
    >,
    value: string | boolean | string[]
  ) {
    setBusinessSubtypeConfig((prev) => ({
      booking_fields: prev.booking_fields.map((item, i) => {
        if (i !== index) return item;

        const nextItem = {
          ...item,
          [field]: value,
        };

        if (field === "enabled" && value === false) {
          nextItem.required = false;
        }

        if (field === "type" && value !== "select") {
          nextItem.options = [];
        }

        return nextItem;
      }),
    }));
  }

  function addSubtypeFieldOption(index: number, fieldKey: string) {
    const option = String(subtypeOptionDrafts[fieldKey] || "").trim();
    if (!option) return;

    setBusinessSubtypeConfig((prev) => ({
      booking_fields: prev.booking_fields.map((item, i) => {
        if (i !== index) return item;

        const currentOptions = item.options || [];
        const exists = currentOptions.some(
          (current) => current.toLowerCase() === option.toLowerCase()
        );

        return {
          ...item,
          options: exists ? currentOptions : [...currentOptions, option],
        };
      }),
    }));

    setSubtypeOptionDrafts((prev) => ({
      ...prev,
      [fieldKey]: "",
    }));
  }

  function removeSubtypeFieldOption(index: number, optionToRemove: string) {
    setBusinessSubtypeConfig((prev) => ({
      booking_fields: prev.booking_fields.map((item, i) =>
        i === index
          ? {
              ...item,
              options: (item.options || []).filter(
                (option) => option !== optionToRemove
              ),
            }
          : item
      ),
    }));
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
    <div className="space-y-4 pb-6">
      <style>{`
        .orbyx-business-energy {
          position: relative;
          isolation: isolate;
          overflow: hidden;
          cursor: pointer;
          border-color: rgba(147, 197, 253, 0.28);
          transition:
            transform 180ms ease,
            border-color 180ms ease,
            box-shadow 180ms ease,
            background 180ms ease,
            filter 180ms ease;
        }

        .orbyx-business-energy::after {
          content: "";
          position: absolute;
          inset: -1px;
          z-index: -1;
          border-radius: inherit;
          background:
            radial-gradient(circle at 50% 0%, rgba(96, 165, 250, 0.28), transparent 42%),
            linear-gradient(135deg, rgba(37, 99, 235, 0.18), rgba(14, 165, 233, 0.1));
          opacity: 0;
          transform: scale(0.94);
          transition: opacity 180ms ease, transform 180ms ease;
        }

        .orbyx-business-energy:not(:disabled):hover {
          border-color: rgba(96, 165, 250, 0.68) !important;
          box-shadow:
            0 0 0 1px rgba(59, 130, 246, 0.16),
            0 12px 30px rgba(37, 99, 235, 0.16),
            0 0 24px rgba(14, 165, 233, 0.16) !important;
          filter: saturate(1.08);
          transform: translateY(-1px);
        }

        .orbyx-business-energy:not(:disabled):hover::after {
          opacity: 1;
          transform: scale(1);
        }

        .orbyx-business-energy:not(:disabled):active {
          animation: orbyx-business-energy-pulse 260ms ease-out;
          box-shadow:
            0 0 0 1px rgba(147, 197, 253, 0.36),
            0 0 22px rgba(37, 99, 235, 0.28),
            0 8px 22px rgba(37, 99, 235, 0.16) !important;
          transform: translateY(0) scale(0.98);
        }

        .orbyx-business-energy-active {
          border-color: rgba(96, 165, 250, 0.72) !important;
          background: linear-gradient(135deg, rgba(37, 99, 235, 0.16), rgba(14, 165, 233, 0.08)) !important;
          box-shadow:
            inset 0 0 0 1px rgba(147, 197, 253, 0.28),
            0 12px 30px rgba(37, 99, 235, 0.16),
            0 0 20px rgba(14, 165, 233, 0.14) !important;
        }

        @keyframes orbyx-business-energy-pulse {
          0% {
            box-shadow:
              0 0 0 0 rgba(96, 165, 250, 0.36),
              0 0 16px rgba(37, 99, 235, 0.22);
          }
          100% {
            box-shadow:
              0 0 0 10px rgba(96, 165, 250, 0),
              0 0 24px rgba(37, 99, 235, 0.12);
          }
        }
      `}</style>

      <section
        className="overflow-hidden rounded-2xl border p-4 shadow-sm sm:p-5"
        style={{
          borderColor: "rgba(59,130,246,0.25)",
          background:
            "linear-gradient(135deg, rgba(37,99,235,0.18), rgba(14,165,233,0.08) 35%, var(--bg-card) 85%)",
        }}
      >
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="max-w-3xl">


<h1 className="text-xl font-semibold">
  Configura tu negocio aquí
</h1>


            <p className="mt-1 text-sm leading-6">
              Administra la configuración global, reservas, horarios por sucursal y excepciones del calendario.
            </p>
          </div>

          <div
            className="grid gap-3 sm:grid-cols-2"
            style={{ color: "var(--text-main)" }}
          >
            <div
              className="rounded-2xl border px-3 py-2.5"
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

                  <p className="mt-1 break-all text-xs font-semibold sm:text-sm">{publicUrl}</p>
                </div>

                <button
                  type="button"
                  onClick={copyPublicUrl}
                  className="orbyx-business-energy inline-flex h-9 shrink-0 items-center justify-center rounded-xl border px-3 text-xs font-semibold transition"
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
              className="rounded-2xl border px-3 py-2.5"
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
              <p className="mt-1 text-sm font-semibold">
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

      <nav
        className="-mx-1 overflow-x-auto px-1"
        aria-label="Secciones de configuración de negocio"
      >
        <div
          className="flex min-w-max gap-2 rounded-[20px] border p-1.5 shadow-sm backdrop-blur"
          style={{
            borderColor: "var(--border-color)",
            background: "var(--bg-card)",
          }}
        >
          {businessSectionTabs.map((item) => {
            const active = activeSection === item.id;

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveSection(item.id)}
                aria-current={active ? "page" : undefined}
                className={`orbyx-business-energy cursor-pointer whitespace-nowrap rounded-2xl border px-5 py-3 text-sm font-semibold transition-all duration-200 hover:border-blue-400/40 hover:bg-[rgba(37,99,235,0.08)] focus:outline-none focus:ring-2 focus:ring-blue-500/30 ${
                  active ? "orbyx-business-energy-active" : ""
                }`}
                style={{
                  borderColor: active ? "rgba(37,99,235,0.36)" : "transparent",
                  background: active
                    ? "linear-gradient(135deg, rgba(37,99,235,0.14), rgba(14,165,233,0.07))"
                    : "transparent",
                  color: active ? "var(--text-main)" : "var(--text-muted)",
                  boxShadow: active
                    ? "inset 0 0 0 1px rgba(37,99,235,0.22)"
                    : "none",
                }}
              >
                {item.label}
              </button>
            );
          })}
        </div>
      </nav>




















{activeSection === "general" ? (
<section className="space-y-3">
  <div>
    <p className="text-xs font-semibold uppercase tracking-[0.16em]" style={{ color: "var(--text-muted)" }}>
      1. Configuración global
    </p>
    <h2 className="mt-1 text-lg font-semibold" style={{ color: "var(--text-main)" }}>
      Datos del negocio
    </h2>
  </div>

<div className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
  
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

        {false ? (
          <div
            className="rounded-2xl border p-4"
            style={{
              borderColor: "var(--border-color)",
              background: "var(--bg-soft)",
            }}
          >
            <div className="max-w-2xl">
              <div>
                <label
                  className="mb-2 block text-sm font-medium"
                  style={{ color: "var(--text-main)" }}
                >
                  Tipo de negocio
                </label>
                <select
                  value={form.business_subtype}
                  onChange={(e) => {
                    const nextSubtype = e.target.value;

                    setForm((prev) => ({
                      ...prev,
                      business_subtype: nextSubtype,
                    }));

                    setBusinessSubtypeConfig({
                      booking_fields:
                        nextSubtype === "taller_automotriz"
                          ? normalizeSubtypeBookingFields(
                              businessSubtypeConfig.booking_fields
                            )
                          : [],
                    });
                  }}
                  className={selectClass}
                  style={{
                    borderColor: "var(--border-color)",
                    background: "var(--bg-card)",
                    color: "var(--text-main)",
                  }}
                >
                  <option value="">Selecciona tipo de negocio</option>
                  {genericBusinessSubtypes
                    .filter((item) => item.value)
                    .map((item) => (
                    <option key={item.value || "none"} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </select>
                <p
                  className="mt-2 text-xs leading-5"
                  style={{ color: "var(--text-muted)" }}
                >
                  {
                    genericBusinessSubtypes.find(
                      (item) => item.value === form.business_subtype
                    )?.description
                  }
                </p>
              </div>

              {false ? (
                <div className="lg:col-span-2">
                  <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
                    <div>
                  <p
                    className="text-sm font-semibold"
                    style={{ color: "var(--text-main)" }}
                  >
                    Campos para unidad/equipo
                  </p>
                  <p
                    className="text-xs"
                    style={{ color: "var(--text-muted)" }}
                  >
                    Se muestran en la reserva publica. Puedes usar texto libre, texto largo o select con opciones.
                  </p>

                  <div className="mt-3 space-y-2">
                    {businessSubtypeConfig.booking_fields.map((field, index) => (
                      <div
                        key={field.key}
                        className="grid gap-2 rounded-2xl border p-3 md:grid-cols-[1fr_150px_auto_auto]"
                        style={{
                          borderColor: "var(--border-color)",
                          background: "var(--bg-card)",
                        }}
                      >
                        <input
                          type="text"
                          value={field.label}
                          onChange={(e) =>
                            updateSubtypeBookingField(
                              index,
                              "label",
                              e.target.value
                            )
                          }
                          className="h-10 rounded-xl border px-3 text-sm outline-none transition"
                          style={{
                            borderColor: "var(--border-color)",
                            background: "var(--bg-soft)",
                            color: "var(--text-main)",
                          }}
                        />

                        <select
                          value={field.type}
                          onChange={(e) =>
                            updateSubtypeBookingField(
                              index,
                              "type",
                              e.target.value
                            )
                          }
                          className="h-10 rounded-xl border px-3 text-sm outline-none transition"
                          style={{
                            borderColor: "var(--border-color)",
                            background: "var(--bg-soft)",
                            color: "var(--text-main)",
                          }}
                        >
                          <option value="text">Texto</option>
                          <option value="select">Select</option>
                          <option value="textarea">Texto largo</option>
                        </select>

                        <label
                          className={`orbyx-business-energy flex h-10 items-center gap-2 rounded-xl border px-3 text-xs font-medium ${
                            field.enabled ? "orbyx-business-energy-active" : ""
                          }`}
                          style={{
                            borderColor: "var(--border-color)",
                            color: "var(--text-main)",
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={field.enabled}
                            onChange={(e) =>
                              updateSubtypeBookingField(
                                index,
                                "enabled",
                                e.target.checked
                              )
                            }
                          />
                          Visible
                        </label>

                        <label
                          className={`orbyx-business-energy flex h-10 items-center gap-2 rounded-xl border px-3 text-xs font-medium ${
                            field.required ? "orbyx-business-energy-active" : ""
                          }`}
                          style={{
                            borderColor: "var(--border-color)",
                            color: "var(--text-main)",
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={field.required}
                            disabled={!field.enabled}
                            onChange={(e) =>
                              updateSubtypeBookingField(
                                index,
                                "required",
                                e.target.checked
                              )
                            }
                          />
                          Obligatorio
                        </label>

                        {field.type === "select" ? (
                          <div className="md:col-span-4">
                            <label
                              className="mb-1 block text-xs font-medium"
                              style={{ color: "var(--text-muted)" }}
                            >
                              Opciones del select, una por línea
                            </label>
                            <p
                              className="mb-2 text-xs"
                              style={{ color: "var(--text-muted)" }}
                            >
                              Escribe una opción y agrégala a la lista. Ejemplo: Auto, Moto, Camión.
                            </p>

                            {(field.options || []).length > 0 ? (
                              <div className="mb-3 flex flex-wrap gap-2">
                                {(field.options || []).map((option) => (
                                  <span
                                    key={option}
                                    className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs"
                                    style={{
                                      borderColor: "var(--border-color)",
                                      background: "var(--bg-soft)",
                                      color: "var(--text-main)",
                                    }}
                                  >
                                    {option}
                                    <button
                                      type="button"
                                      onClick={() =>
                                        removeSubtypeFieldOption(index, option)
                                      }
                                      className="orbyx-business-energy inline-flex h-6 w-6 items-center justify-center rounded-full border border-rose-300/40 text-xs font-semibold text-rose-400 transition hover:text-rose-300"
                                      aria-label={`Eliminar ${option}`}
                                    >
                                      x
                                    </button>
                                  </span>
                                ))}
                              </div>
                            ) : null}

                            <div className="flex flex-col gap-2 sm:flex-row">
                              <input
                                type="text"
                                value={subtypeOptionDrafts[field.key] || ""}
                                onChange={(e) =>
                                  setSubtypeOptionDrafts((prev) => ({
                                    ...prev,
                                    [field.key]: e.target.value,
                                  }))
                                }
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") {
                                    e.preventDefault();
                                    addSubtypeFieldOption(index, field.key);
                                  }
                                }}
                                placeholder={
                                  field.key === "unit_type"
                                    ? "Ej: Auto"
                                    : "Ej: Toyota"
                                }
                                className="h-10 w-full rounded-xl border px-3 text-sm outline-none transition"
                                style={{
                                  borderColor: "var(--border-color)",
                                  background: "var(--bg-soft)",
                                  color: "var(--text-main)",
                                }}
                              />
                              <button
                                type="button"
                                onClick={() =>
                                  addSubtypeFieldOption(index, field.key)
                                }
                                className="orbyx-business-energy h-10 rounded-xl border px-4 text-sm font-medium transition hover:opacity-80"
                                style={{
                                  borderColor: "var(--border-color)",
                                  background: "var(--bg-card)",
                                  color: "var(--text-main)",
                                }}
                              >
                                Agregar
                              </button>
                            </div>

                            {(field.options || []).length === 0 ? (
                              <p
                                className="mt-1 text-xs"
                                style={{ color: "var(--text-muted)" }}
                              >
                                Si no hay opciones, en la reserva publica se mostrara como texto libre.
                              </p>
                            ) : null}
                          </div>
                        ) : null}
                      </div>
                    ))}
                  </div>
                    </div>

                    <div
                      className="rounded-2xl border p-4"
                      style={{
                        borderColor: "var(--border-color)",
                        background: "var(--bg-card)",
                      }}
                    >
                      <p
                        className="text-sm font-semibold"
                        style={{ color: "var(--text-main)" }}
                      >
                        Así verá este formulario tu cliente
                      </p>
                      <p
                        className="mt-1 text-xs"
                        style={{ color: "var(--text-muted)" }}
                      >
                        Vista previa de los campos visibles para la reserva pública.
                      </p>

                      <div className="mt-4 space-y-3">
                        {businessSubtypeConfig.booking_fields.filter((field) => field.enabled).length === 0 ? (
                          <div
                            className="rounded-2xl border border-dashed px-4 py-5 text-sm"
                            style={{
                              borderColor: "var(--border-color)",
                              color: "var(--text-muted)",
                            }}
                          >
                            No hay campos visibles para mostrar.
                          </div>
                        ) : null}

                        {businessSubtypeConfig.booking_fields
                          .filter((field) => field.enabled)
                          .map((field) => {
                            const label = `${field.label}${field.required ? " *" : ""}`;

                            if (field.type === "select" && (field.options || []).length > 0) {
                              return (
                                <div key={field.key}>
                                  <label
                                    className="mb-1 block text-xs font-medium"
                                    style={{ color: "var(--text-muted)" }}
                                  >
                                    {label}
                                    {field.required ? " · Obligatorio" : ""}
                                  </label>
                                  <select
                                    disabled
                                    className="h-10 w-full rounded-xl border px-3 text-sm"
                                    style={{
                                      borderColor: "var(--border-color)",
                                      background: "var(--bg-soft)",
                                      color: "var(--text-main)",
                                    }}
                                  >
                                    <option>{field.label}</option>
                                    {(field.options || []).map((option) => (
                                      <option key={option}>{option}</option>
                                    ))}
                                  </select>
                                </div>
                              );
                            }

                            if (field.type === "textarea") {
                              return (
                                <div key={field.key}>
                                  <label
                                    className="mb-1 block text-xs font-medium"
                                    style={{ color: "var(--text-muted)" }}
                                  >
                                    {label}
                                    {field.required ? " · Obligatorio" : ""}
                                  </label>
                                  <textarea
                                    disabled
                                    placeholder={field.label}
                                    className="min-h-[82px] w-full rounded-xl border px-3 py-2 text-sm"
                                    style={{
                                      borderColor: "var(--border-color)",
                                      background: "var(--bg-soft)",
                                      color: "var(--text-main)",
                                    }}
                                  />
                                </div>
                              );
                            }

                            return (
                              <div key={field.key}>
                                <label
                                  className="mb-1 block text-xs font-medium"
                                  style={{ color: "var(--text-muted)" }}
                                >
                                  {label}
                                  {field.required ? " · Obligatorio" : ""}
                                </label>
                                <input
                                  disabled
                                  placeholder={field.label}
                                  className="h-10 w-full rounded-xl border px-3 text-sm"
                                  style={{
                                    borderColor: "var(--border-color)",
                                    background: "var(--bg-soft)",
                                    color: "var(--text-main)",
                                  }}
                                />
                              </div>
                            );
                          })}
                      </div>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        ) : null}

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

  <div className="space-y-4">
    {businessCategory === "generic" ? (
      <Panel
        title="Tipo de negocio"
        description="Define la familia del negocio para preparar configuraciones específicas."
        className="bg-[linear-gradient(180deg,rgba(37,99,235,0.05),transparent_35%)]"
      >
        <div>
          <label
            className="mb-2 block text-sm font-medium"
            style={{ color: "var(--text-main)" }}
          >
            Tipo de negocio
          </label>
          <select
            value={form.business_subtype}
            onChange={(e) => {
              const nextSubtype = e.target.value;

              setForm((prev) => ({
                ...prev,
                business_subtype: nextSubtype,
              }));

              setBusinessSubtypeConfig({
                booking_fields:
                  nextSubtype === "taller_automotriz"
                    ? normalizeSubtypeBookingFields(
                        businessSubtypeConfig.booking_fields
                      )
                    : [],
              });
            }}
            className={selectClass}
            style={{
              borderColor: "var(--border-color)",
              background: "var(--bg-card)",
              color: "var(--text-main)",
            }}
          >
            <option value="">Selecciona tipo de negocio</option>
            {genericBusinessSubtypes
              .filter((item) => item.value)
              .map((item) => (
                <option key={item.value || "none"} value={item.value}>
                  {item.label}
                </option>
              ))}
          </select>
          <p
            className="mt-2 text-xs leading-5"
            style={{ color: "var(--text-muted)" }}
          >
            {
              genericBusinessSubtypes.find(
                (item) => item.value === form.business_subtype
              )?.description
            }
          </p>
        </div>
      </Panel>
    ) : null}

    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-2">
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
          label: "Redes",
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
          value: loading ? "Cargando..." : googleConnected ? "Conectado" : "Pendiente",
        },
      ].map((item) => (
        <div
          key={item.label}
          className="rounded-2xl border px-4 py-3"
          style={{
            borderColor: "var(--border-color)",
            background:
              "linear-gradient(135deg, rgba(37,99,235,0.06), var(--bg-card))",
          }}
        >
          <p
            className="text-[10px] font-semibold uppercase tracking-[0.16em]"
            style={{ color: "var(--text-muted)" }}
          >
            {item.label}
          </p>

          <p
            className="mt-1 truncate text-sm font-semibold"
            style={{ color: "var(--text-main)" }}
            title={item.value}
          >
            {item.value}
          </p>
        </div>
      ))}
    </div>

</div>
</div>
</section>
) : null}

{activeSection === "reservas" ? (
<section className="space-y-3">
  <div>
    <p className="text-xs font-semibold uppercase tracking-[0.16em]" style={{ color: "var(--text-muted)" }}>
      2. Campos
    </p>
    <h2 className="mt-1 text-lg font-semibold" style={{ color: "var(--text-main)" }}>
      Formulario de reserva pública
    </h2>
  </div>

  <div className="grid gap-4 xl:grid-cols-[0.85fr_1.15fr]">
    <div className="grid gap-4 xl:col-span-2 xl:grid-cols-[1.15fr_0.85fr]">
      {form.business_subtype === "taller_automotriz" ? (
        <Panel
          title="Campos de unidad/equipo"
          description="Configura los datos adicionales que completará el cliente en la reserva pública."
          className="bg-[linear-gradient(180deg,rgba(37,99,235,0.05),transparent_35%)]"
        >
          <div className="space-y-3">
            {businessSubtypeConfig.booking_fields.map((field, index) => (
              <div
                key={field.key}
                className="grid gap-2 rounded-2xl border p-3 md:grid-cols-[1fr_150px_auto_auto]"
                style={{
                  borderColor: "var(--border-color)",
                  background: "var(--bg-card)",
                }}
              >
                <input
                  type="text"
                  value={field.label}
                  onChange={(e) =>
                    updateSubtypeBookingField(index, "label", e.target.value)
                  }
                  className="h-10 rounded-xl border px-3 text-sm outline-none transition"
                  style={{
                    borderColor: "var(--border-color)",
                    background: "var(--bg-soft)",
                    color: "var(--text-main)",
                  }}
                />

                <select
                  value={field.type}
                  onChange={(e) =>
                    updateSubtypeBookingField(index, "type", e.target.value)
                  }
                  className="h-10 rounded-xl border px-3 text-sm outline-none transition"
                  style={{
                    borderColor: "var(--border-color)",
                    background: "var(--bg-soft)",
                    color: "var(--text-main)",
                  }}
                >
                  <option value="text">Texto</option>
                  <option value="select">Select</option>
                  <option value="textarea">Texto largo</option>
                </select>

                <label
                  className={`orbyx-business-energy flex h-10 items-center gap-2 rounded-xl border px-3 text-xs font-medium ${
                    field.enabled ? "orbyx-business-energy-active" : ""
                  }`}
                  style={{
                    borderColor: "var(--border-color)",
                    color: "var(--text-main)",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={field.enabled}
                    onChange={(e) =>
                      updateSubtypeBookingField(index, "enabled", e.target.checked)
                    }
                  />
                  Visible
                </label>

                <label
                  className={`orbyx-business-energy flex h-10 items-center gap-2 rounded-xl border px-3 text-xs font-medium ${
                    field.required ? "orbyx-business-energy-active" : ""
                  }`}
                  style={{
                    borderColor: "var(--border-color)",
                    color: "var(--text-main)",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={field.required}
                    disabled={!field.enabled}
                    onChange={(e) =>
                      updateSubtypeBookingField(index, "required", e.target.checked)
                    }
                  />
                  Obligatorio
                </label>

                {field.type === "select" ? (
                  <div className="md:col-span-4">
                    <label
                      className="mb-1 block text-xs font-medium"
                      style={{ color: "var(--text-muted)" }}
                    >
                      Opciones del select
                    </label>
                    <p
                      className="mb-2 text-xs"
                      style={{ color: "var(--text-muted)" }}
                    >
                      Cada opción agregada será una opción para el cliente. Ejemplo: Auto, Moto, Camión.
                    </p>

                    {(field.options || []).length > 0 ? (
                      <div className="mb-3 flex flex-wrap gap-2">
                        {(field.options || []).map((option) => (
                          <span
                            key={option}
                            className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs"
                            style={{
                              borderColor: "var(--border-color)",
                              background: "var(--bg-soft)",
                              color: "var(--text-main)",
                            }}
                          >
                            {option}
                            <button
                              type="button"
                              onClick={() => removeSubtypeFieldOption(index, option)}
                              className="orbyx-business-energy inline-flex h-6 w-6 items-center justify-center rounded-full border border-rose-300/40 text-xs font-semibold text-rose-400 transition hover:text-rose-300"
                              aria-label={`Eliminar ${option}`}
                            >
                              x
                            </button>
                          </span>
                        ))}
                      </div>
                    ) : null}

                    <div className="flex flex-col gap-2 sm:flex-row">
                      <input
                        type="text"
                        value={subtypeOptionDrafts[field.key] || ""}
                        onChange={(e) =>
                          setSubtypeOptionDrafts((prev) => ({
                            ...prev,
                            [field.key]: e.target.value,
                          }))
                        }
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            addSubtypeFieldOption(index, field.key);
                          }
                        }}
                        placeholder={
                          field.key === "unit_type" ? "Ej: Auto" : "Ej: Toyota"
                        }
                        className="h-10 w-full rounded-xl border px-3 text-sm outline-none transition"
                        style={{
                          borderColor: "var(--border-color)",
                          background: "var(--bg-soft)",
                          color: "var(--text-main)",
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => addSubtypeFieldOption(index, field.key)}
                        className="orbyx-business-energy h-10 rounded-xl border px-4 text-sm font-medium transition hover:opacity-80"
                        style={{
                          borderColor: "var(--border-color)",
                          background: "var(--bg-card)",
                          color: "var(--text-main)",
                        }}
                      >
                        Agregar
                      </button>
                    </div>

                    {(field.options || []).length === 0 ? (
                      <p
                        className="mt-1 text-xs"
                        style={{ color: "var(--text-muted)" }}
                      >
                        Si no hay opciones, en la reserva pública se mostrará como texto libre.
                      </p>
                    ) : null}
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        </Panel>
      ) : null}

      <Panel
        title="Vista previa del formulario público"
        description="Así se verán los campos configurados cuando el cliente reserve."
        className={`bg-[linear-gradient(180deg,rgba(37,99,235,0.05),transparent_35%)] ${
          form.business_subtype === "taller_automotriz" ? "" : "xl:col-span-2"
        }`}
      >
        <div
          className="space-y-3 rounded-2xl border border-dashed p-3"
          style={{
            borderColor: "rgba(37,99,235,0.35)",
            background: "rgba(37,99,235,0.04)",
          }}
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span
              className="rounded-full border px-3 py-1 text-xs font-semibold"
              style={{
                borderColor: "rgba(37,99,235,0.35)",
                background: "rgba(37,99,235,0.08)",
                color: "var(--text-main)",
              }}
            >
              Vista previa
            </span>
            <span className="text-xs" style={{ color: "var(--text-muted)" }}>
              Así lo verá el cliente
            </span>
          </div>

          <div
            className="rounded-2xl border p-4"
            style={{
              borderColor: "var(--border-color)",
              background: "var(--bg-card)",
            }}
          >
            <p
              className="text-sm font-semibold"
              style={{ color: "var(--text-main)" }}
            >
              Completa tus datos
            </p>
            <div className="mt-3 space-y-3">
              {["Nombre y apellido", "Teléfono", "Email"].map((label) => (
                <div key={label}>
                  <label
                    className="mb-1 block text-xs font-medium"
                    style={{ color: "var(--text-muted)" }}
                  >
                    {label} *
                  </label>
                  <input
                    disabled
                    placeholder={label}
                    className="h-10 w-full cursor-not-allowed rounded-xl border px-3 text-sm opacity-80"
                    style={{
                      borderColor: "var(--border-color)",
                      background: "var(--bg-soft)",
                      color: "var(--text-main)",
                    }}
                  />
                </div>
              ))}
            </div>
          </div>

          {bookingFields.filter((field) => field.enabled).map((field) => (
            <div key={field.key}>
              <label className="mb-1 block text-xs font-medium" style={{ color: "var(--text-muted)" }}>
                {field.label}{field.required ? " *" : ""}
              </label>
              <input
                disabled
                placeholder={field.label}
                className="h-10 w-full cursor-not-allowed rounded-xl border px-3 text-sm opacity-80"
                style={{ borderColor: "var(--border-color)", background: "var(--bg-soft)", color: "var(--text-main)" }}
              />
            </div>
          ))}

          {form.business_subtype === "taller_automotriz"
            ? businessSubtypeConfig.booking_fields.filter((field) => field.enabled).map((field) => {
                const label = `${field.label}${field.required ? " *" : ""}`;

                if (field.type === "select" && (field.options || []).length > 0) {
                  return (
                    <div key={field.key}>
                      <label className="mb-1 block text-xs font-medium" style={{ color: "var(--text-muted)" }}>
                        {label}
                      </label>
                      <select
                        defaultValue=""
                        className="h-10 w-full rounded-xl border px-3 text-sm"
                        style={{ borderColor: "var(--border-color)", background: "var(--bg-soft)", color: "var(--text-main)" }}
                      >
                        <option value="">{field.label}</option>
                        {(field.options || []).map((option) => (
                          <option key={option} value={option}>{option}</option>
                        ))}
                      </select>
                    </div>
                  );
                }

                if (field.type === "textarea") {
                  return (
                    <div key={field.key}>
                      <label className="mb-1 block text-xs font-medium" style={{ color: "var(--text-muted)" }}>
                        {label}
                      </label>
                      <textarea
                        disabled
                        placeholder={field.label}
                        className="min-h-[82px] w-full cursor-not-allowed rounded-xl border px-3 py-2 text-sm opacity-80"
                        style={{ borderColor: "var(--border-color)", background: "var(--bg-soft)", color: "var(--text-main)" }}
                      />
                    </div>
                  );
                }

                return (
                  <div key={field.key}>
                    <label className="mb-1 block text-xs font-medium" style={{ color: "var(--text-muted)" }}>
                      {label}
                    </label>
                    <input
                      disabled
                      placeholder={field.label}
                      className="h-10 w-full cursor-not-allowed rounded-xl border px-3 text-sm opacity-80"
                      style={{ borderColor: "var(--border-color)", background: "var(--bg-soft)", color: "var(--text-main)" }}
                    />
                  </div>
                );
              })
            : null}

        </div>
      </Panel>
    </div>

    <div className="xl:col-span-2">
    <Panel
      title="Campos de reserva"
      description="Define qué información solicitar al cliente al reservar."
      className="flex flex-col bg-[linear-gradient(180deg,rgba(37,99,235,0.06),transparent_35%)]"
    >
      <div className="flex flex-col">
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
                className="flex items-center justify-between gap-4 rounded-2xl border p-4"
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
                  <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                    {field.enabled
                      ? field.required
                        ? "Obligatorio"
                        : "Opcional"
                      : "Desactivado"}
                  </p>
                </div>

                <div
                  className="flex flex-col gap-2 text-sm sm:flex-row sm:items-center sm:gap-4"
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
        </div>

        <div className="pt-4">
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
      </div>
    </Panel>
    </div>



  </div>
</section>
) : null}

{activeSection === "horarios" ? (
<section className="space-y-3">
  <div>
    <p className="text-xs font-semibold uppercase tracking-[0.16em]" style={{ color: "var(--text-muted)" }}>
      3. Horarios por sucursal
    </p>
    <h2 className="mt-1 text-lg font-semibold" style={{ color: "var(--text-main)" }}>
      Disponibilidad semanal
    </h2>
  </div>

  <div className="grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
    <Panel
      title="Reglas de reserva"
      description="Define anticipación mínima y ventana máxima para reservar."
      className="bg-[linear-gradient(180deg,rgba(37,99,235,0.05),transparent_35%)]"
    >
      <div className="space-y-5">
        <div>
          <label className="mb-2 block text-sm font-medium" style={{ color: "var(--text-main)" }}>
            Tiempo mínimo antes de reservar
          </label>
          <select
            value={minNoticeMode === "custom" ? "custom" : form.min_booking_notice_minutes}
            onChange={(e) => {
              const val = e.target.value;
              if (val === "custom") {
                setMinNoticeMode("custom");
                setForm((prev) => ({
                  ...prev,
                  min_booking_notice_minutes: prev.min_booking_notice_minutes || 180,
                }));
                return;
              }
              setMinNoticeMode("preset");
              setForm((prev) => ({ ...prev, min_booking_notice_minutes: Number(val) }));
            }}
            className={selectClass}
            style={{ borderColor: "var(--border-color)", background: "var(--bg-card)", color: "var(--text-main)" }}
          >
            <option value={0}>Sin restricción</option>
            <option value={15}>15 minutos</option>
            <option value={30}>30 minutos</option>
            <option value={60}>1 hora</option>
            <option value={120}>2 horas</option>
            <option value="custom">Personalizado</option>
          </select>
          {minNoticeMode === "custom" ? (
            <div className="mt-3 flex items-center gap-2">
              <input
                type="number"
                min={0}
                step={5}
                value={form.min_booking_notice_minutes}
                onChange={(e) => setForm((prev) => ({ ...prev, min_booking_notice_minutes: Number(e.target.value) }))}
                placeholder="Ej: 180"
                className="h-11 w-full rounded-2xl border px-4 text-sm sm:w-28"
                style={{ borderColor: "var(--border-color)", background: "var(--bg-card)", color: "var(--text-main)" }}
              />
              <span className="text-sm" style={{ color: "var(--text-muted)" }}>minutos</span>
            </div>
          ) : null}
          <p className="mt-2 text-xs" style={{ color: "var(--text-muted)" }}>
            Evita reservas inmediatas. Ej: si eliges 1 hora, los clientes solo podrán reservar con al menos 60 minutos de anticipación.
          </p>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium" style={{ color: "var(--text-main)" }}>
            Máximo días hacia adelante
          </label>
          <select
            value={maxDaysMode === "custom" ? "custom" : form.max_booking_days_ahead}
            onChange={(e) => {
              const val = e.target.value;
              if (val === "custom") {
                setMaxDaysMode("custom");
                setForm((prev) => ({
                  ...prev,
                  max_booking_days_ahead: prev.max_booking_days_ahead || 120,
                }));
                return;
              }
              setMaxDaysMode("preset");
              setForm((prev) => ({ ...prev, max_booking_days_ahead: Number(val) }));
            }}
            className={selectClass}
            style={{ borderColor: "var(--border-color)", background: "var(--bg-card)", color: "var(--text-main)" }}
          >
            <option value={7}>7 días</option>
            <option value={14}>14 días</option>
            <option value={30}>30 días</option>
            <option value={60}>60 días</option>
            <option value={90}>90 días</option>
            <option value="custom">Personalizado</option>
          </select>
          {maxDaysMode === "custom" ? (
            <div className="mt-3 flex items-center gap-2">
              <input
                type="number"
                min={1}
                step={1}
                value={form.max_booking_days_ahead}
                onChange={(e) => setForm((prev) => ({ ...prev, max_booking_days_ahead: Number(e.target.value) }))}
                placeholder="Ej: 120"
                className="h-11 w-full rounded-2xl border px-4 text-sm sm:w-28"
                style={{ borderColor: "var(--border-color)", background: "var(--bg-card)", color: "var(--text-main)" }}
              />
              <span className="text-sm" style={{ color: "var(--text-muted)" }}>días</span>
            </div>
          ) : null}
          <p className="mt-2 text-xs" style={{ color: "var(--text-muted)" }}>
            Limita cuántos días hacia el futuro pueden agendar los clientes.
          </p>
        </div>
      </div>
    </Panel>

    <Panel
      title="Intervalo de horarios"
      description="Define cada cuántos minutos se mostrarán los horarios a tus clientes."
      className="bg-[linear-gradient(180deg,rgba(37,99,235,0.05),transparent_35%)]"
    >
      <div className="space-y-5">
        <div className="flex flex-wrap gap-2">
          {[15, 30, 45, 60].map((val) => (
            <button
              key={val}
              type="button"
              onClick={() => {
                setSlotMinutesMode("preset");
                setSlotMinutes(val);
              }}
              className={`orbyx-business-energy px-4 py-2 rounded-xl border text-sm font-medium transition ${
                slotMinutesMode === "preset" && slotMinutes === val
                  ? "orbyx-business-energy-active bg-indigo-600 text-white border-indigo-600"
                  : "border-slate-300 bg-white text-slate-700 hover:border-indigo-300"
              }`}
            >
              {val} min
            </button>
          ))}
          <button
            type="button"
              onClick={() => {
                setSlotMinutesMode("custom");
                setSlotMinutes(customSlotMinutes);
              }}
            className={`orbyx-business-energy px-4 py-2 rounded-xl border text-sm font-medium transition ${
              slotMinutesMode === "custom"
                ? "orbyx-business-energy-active bg-indigo-600 text-white border-indigo-600"
                : "border-slate-300 bg-white text-slate-700 hover:border-indigo-300"
            }`}
          >
            Personalizado
          </button>
        </div>
        {slotMinutesMode === "custom" ? (
          <div className="flex items-center gap-2">
            <input
              type="number"
              min={5}
              step={5}
              value={customSlotMinutes}
              onChange={(e) => {
                const val = Number(e.target.value);
                setCustomSlotMinutes(val);
                setSlotMinutes(val);
              }}
              className="h-11 w-full rounded-xl border px-3 text-sm sm:w-28"
              style={{ borderColor: "var(--border-color)", background: "var(--bg-card)", color: "var(--text-main)" }}
            />
            <span className="text-sm" style={{ color: "var(--text-muted)" }}>minutos</span>
          </div>
        ) : null}
        <div className="rounded-2xl border p-4" style={{ borderColor: "var(--border-color)", background: "var(--bg-soft)" }}>
          <p className="mb-3 text-xs" style={{ color: "var(--text-muted)" }}>Vista previa de horarios</p>
          <div className="flex flex-wrap gap-2">
            {Array.from({ length: 8 }).map((_, i) => {
              const base = 9 * 60;
              const minutes = base + i * slotMinutes;
              const hour = Math.floor(minutes / 60);
              const min = minutes % 60;
              const label = `${String(hour).padStart(2, "0")}:${String(min).padStart(2, "0")}`;
              return (
                <div key={i} className="rounded-xl border px-3 py-2 text-xs" style={{ borderColor: "var(--border-color)", background: "var(--bg-card)", color: "var(--text-main)" }}>
                  {label}
                </div>
              );
            })}
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={saveSlotMinutes}
            disabled={savingSlotMinutes || !calendarId}
            className={primaryButtonClass}
            style={{ background: "linear-gradient(135deg, rgb(37 99 235), rgb(14 165 233))" }}
          >
            {savingSlotMinutes ? "Guardando..." : "Guardar intervalo"}
          </button>
          {slotMinutesOk ? <span className="text-sm text-emerald-400">{slotMinutesOk}</span> : null}
          {slotMinutesError ? <span className="text-sm text-rose-400">{slotMinutesError}</span> : null}
        </div>
      </div>
    </Panel>
  </div>

  <Panel
    title="Horarios de atención"
    description="Define cuándo tu negocio está disponible para recibir reservas en la sucursal activa."
    className="bg-[linear-gradient(180deg,rgba(14,165,233,0.05),transparent_35%)]"
  >
    <div className="space-y-3">
      {displayOrder.map((dayIndex) => {
  const dayBlocks = businessHours.filter(
    (d) => d.day_of_week === dayIndex
  );

  const enabled = dayBlocks.some((b) => b.enabled);

            return (
              <div
                key={dayIndex}
                className="grid gap-3 rounded-2xl border p-3 sm:grid-cols-[150px_minmax(0,1fr)] sm:items-start"
                style={{
                  borderColor: enabled
                    ? "rgba(37,99,235,0.22)"
                    : "var(--border-color)",
                  background: enabled
                    ? "linear-gradient(135deg, rgba(37,99,235,0.05), var(--bg-card))"
                    : "var(--bg-card)",
                }}
              >
                <div className="flex items-center justify-between gap-3 sm:flex-col sm:items-start">
                  <div>
                    <p
                      className="text-sm font-semibold"
                      style={{ color: "var(--text-main)" }}
                    >
                      {days[dayIndex]}
                    </p>
                    <p
                      className="mt-0.5 text-xs"
                      style={{ color: "var(--text-muted)" }}
                    >
                      {enabled ? `${dayBlocks.length} bloque${dayBlocks.length === 1 ? "" : "s"}` : "Cerrado"}
                    </p>
                  </div>

                  <label
                    className={`orbyx-business-energy inline-flex h-9 items-center gap-2 rounded-xl border px-3 text-xs font-medium ${
                      enabled ? "orbyx-business-energy-active" : ""
                    }`}
                    style={{
                      borderColor: enabled
                        ? "rgba(37,99,235,0.48)"
                        : "var(--border-color)",
                      background: enabled
                        ? "rgba(37,99,235,0.10)"
                        : "var(--bg-soft)",
                      color: enabled ? "var(--text-main)" : "var(--text-muted)",
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={enabled}
                      onChange={(e) => {
                        const newValue = e.target.checked;

                        setBusinessHours((prev) =>
                          prev.map((item) =>
                            item.day_of_week === dayIndex
                              ? { ...item, enabled: newValue }
                              : item
                          )
                        );
                      }}
                      className="h-4 w-4 rounded"
                    />
                    Activo
                  </label>
                </div>

                <div className="flex min-w-0 flex-col gap-2">
                  {!enabled ? (
                    <span
                      className="inline-flex h-9 w-fit items-center rounded-full border px-3 text-xs font-semibold"
                      style={{
                        borderColor: "var(--border-color)",
                        background: "var(--bg-soft)",
                        color: "var(--text-muted)",
                      }}
                    >
                      No disponible
                    </span>
                  ) : (
                    dayBlocks.map((block, i) => (
                      <div
                        key={i}
                        className="flex w-fit max-w-full flex-wrap items-center gap-2 rounded-2xl border px-2 py-2"
                        style={{
                          borderColor: "var(--border-color)",
                          background: "var(--bg-soft)",
                        }}
                      >
                        <input
                          type="text"
                          value={block.start_time}
                          onChange={(e) =>
updateHourByIndex(
  businessHours.findIndex(
    (x) =>
      x.day_of_week === dayIndex &&
      x.start_time === block.start_time &&
      x.end_time === block.end_time
  ),
  "start_time",
            normalizeTimeInput(e.target.value)
          )
        }
                          className="h-10 w-[150px] rounded-xl border px-3 text-sm outline-none transition sm:w-[160px]"
                          style={{
                            borderColor: "var(--border-color)",
                            background: "var(--bg-card)",
                            color: "var(--text-main)",
                          }}
                        />

                        <span
                          className="text-sm"
                          style={{ color: "var(--text-muted)" }}
                        >
                          -
                        </span>

                        <input
                          type="text"
                          value={block.end_time}

onChange={(e) =>
  updateHourByIndex(
    businessHours.findIndex(
      (x) =>
        x.day_of_week === dayIndex &&
        x.start_time === block.start_time &&
        x.end_time === block.end_time
    ),
    "end_time",
    normalizeTimeInput(e.target.value)
  )
}

                          className="h-10 w-[150px] rounded-xl border px-3 text-sm outline-none transition sm:w-[160px]"
                          style={{
                            borderColor: "var(--border-color)",
                            background: "var(--bg-card)",
                            color: "var(--text-main)",
                          }}
                        />

                        <button
                          type="button"
onClick={() => {
  const realIndex = businessHours.findIndex(
    (x, idx) =>
      idx ===
      businessHours.findIndex(
        (y) =>
          y.day_of_week === dayIndex &&
          y.start_time === block.start_time &&
          y.end_time === block.end_time
      )
  );

  setBusinessHours((prev) =>
    prev.filter((_, idx) => idx !== realIndex)
  );
}}

                          className="orbyx-business-energy inline-flex h-8 w-8 items-center justify-center rounded-lg border border-rose-300/50 bg-rose-500/10 p-0 text-sm font-semibold leading-none text-rose-400 transition hover:border-rose-300/70 hover:bg-rose-500/15 hover:shadow-[0_0_18px_rgba(244,63,94,0.16)]"
                          aria-label={`Eliminar bloque de ${days[dayIndex]}`}
                        >
                          x
                        </button>
                      </div>
                    ))
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      setBusinessHours((prev) => [
                        ...prev,
                        {
                          day_of_week: dayIndex,
                          enabled: true,
                          start_time: "09:00",
                          end_time: "18:00",
                        },
                      ]);
                    }}
                    className="orbyx-business-energy inline-flex h-8 w-fit items-center justify-center rounded-xl border px-3 text-xs font-medium text-blue-500 transition"
                    style={{
                      borderColor: "rgba(37,99,235,0.24)",
                      background: "rgba(37,99,235,0.06)",
                    }}
                  >
                    + Agregar bloque
                  </button>
                </div>
              </div>
            );
          })}
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

    {hoursError ? (
      <div className="mt-4 rounded-2xl border border-rose-300/60 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">
        {hoursError}
      </div>
    ) : null}

    {hoursOk ? (
      <div className="mt-4 rounded-2xl border border-emerald-300/50 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
        {hoursOk}
      </div>
    ) : null}
  </Panel>

</section>
) : null}

{activeSection === "fechas" ? (
<section className="space-y-3">
  <div>
    <p className="text-xs font-semibold uppercase tracking-[0.16em]" style={{ color: "var(--text-muted)" }}>
      4. Fechas especiales
    </p>
    <h2 className="mt-1 text-lg font-semibold" style={{ color: "var(--text-main)" }}>
      Excepciones del calendario
    </h2>
  </div>

  <Panel
    title="Fechas especiales"
    description="Configura feriados, vísperas, vacaciones, cierres y horarios especiales por fecha."
    className="bg-[linear-gradient(180deg,rgba(37,99,235,0.05),transparent_35%)]"
  >
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium" style={{ color: "var(--text-main)" }}>
            Excepciones del calendario
          </p>
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
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
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
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

        <div>
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
              </div>

              <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                <label
                  className={`orbyx-business-energy flex h-11 w-full items-center gap-3 rounded-2xl border px-4 text-sm ${
                    item.is_closed ? "orbyx-business-energy-active" : ""
                  }`}
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
                      updateSpecialDate(index, "is_closed", e.target.checked)
                    }
                    className="h-4 w-4 rounded"
                  />
                  Cerrado todo el día
                </label>

                <button
                  type="button"
                  onClick={() => removeSpecialDate(index)}
                  className="orbyx-business-energy inline-flex h-11 w-full items-center justify-center rounded-2xl border border-rose-300/60 bg-rose-500/10 px-4 text-sm font-medium text-rose-300 transition hover:bg-rose-500/15"
                >
                  Quitar
                </button>
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
                        updateSpecialDate(index, "start_time", e.target.value)
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

      {specialDatesError ? (
        <div className="rounded-2xl border border-rose-300/60 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">
          {specialDatesError}
        </div>
      ) : null}

      {specialDatesOk ? (
        <div className="rounded-2xl border border-emerald-300/50 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
          {specialDatesOk}
        </div>
      ) : null}
    </div>
  </Panel>
</section>
) : null}

    </div>
  );
}
