"use client";

import { CSSProperties, useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { Panel } from "../../../../components/dashboard/panel";

type BusinessResponse = {
  business: {
    id: string;
    name: string;
    slug: string;
    plan_slug?: string | null;
  };
  calendar_id: string;
  google_connected?: boolean;
};

type BranchItem = {
  id: string;
  tenant_id?: string;
  name: string;
  is_active?: boolean;
};

type StaffItem = {
  id: string;
  tenant_id: string;
  branch_id?: string | null;
  name: string;
  role?: string | null;
  email?: string | null;
  phone?: string | null;
  color?: string | null;
photo_url?: string | null;
  is_active: boolean;
  sort_order: number;
  use_business_hours?: boolean;
  created_at?: string;
  updated_at?: string;
};

type StaffHourItem = {
  day_of_week: number;
  block_order: number;
  enabled: boolean;
  start_time: string | null;
  end_time: string | null;
};

type StaffSpecialDateItem = {
  id?: string;
  tenant_id?: string;
  staff_id?: string;
  date: string;
  label?: string | null;
  is_closed: boolean;
  start_time: string | null;
  end_time: string | null;
};

type StaffSpecialDateGroup = {
  key: string;
  items: StaffSpecialDateItem[];
  first: StaffSpecialDateItem;
  startDate: string;
  endDate: string;
  isRange: boolean;
};

type SpecialRangeForm = {
  enabled: boolean;
  type:
    | "Vacaciones"
    | "Permiso"
    | "Licencia médica"
    | "Capacitación"
    | "Reunión interna"
    | "Turno administrativo"
    | "Bloqueo operacional"
    | "Día libre"
    | "Feriado"
    | "Otro";
  date_from: string;
  date_to: string;
  label: string;
};

type ServiceItem = {
  id: string;
  tenant_id: string;
  name: string;
  duration_minutes?: number | null;
  price?: number | null;
  active?: boolean;
};

type CalendarConnectionItem = {
  id: string;
  provider: string;
  account_email?: string | null;
  staff_id?: string | null;
  branch_id?: string | null;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
};

type NoticeTone =
  | "info"
  | "success"
  | "warning"
  | "limit"
  | "danger"
  | "neutral";

const BACKEND_URL = "https://orbyx-backend.onrender.com";

const days = [
  { value: 0, label: "Domingo" },
  { value: 1, label: "Lunes" },
  { value: 2, label: "Martes" },
  { value: 3, label: "Miércoles" },
  { value: 4, label: "Jueves" },
  { value: 5, label: "Viernes" },
  { value: 6, label: "Sábado" },
];

const staffScheduleDays = [
  ...days.filter((day) => day.value !== 0),
  days.find((day) => day.value === 0)!,
];

const defaultHours: StaffHourItem[] = days.map((day) => ({
  day_of_week: day.value,
  block_order: 1,
  enabled: false,
  start_time: "09:00",
  end_time: "18:00",
}));

const emptyForm = {
  name: "",
  role: "",
  email: "",
  phone: "",
  is_active: true,
  sort_order: 0,
  use_business_hours: true,
};

const emptySpecialDateForm: StaffSpecialDateItem = {
  date: "",
  label: "",
  is_closed: true,
  start_time: "09:00",
  end_time: "18:00",
};

const emptySpecialRangeForm: SpecialRangeForm = {
  enabled: false,
  type: "Vacaciones",
  date_from: "",
  date_to: "",
  label: "",
};

function isValidHHmm(value?: string | null) {
  if (!value) return false;
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
}

function normalizeTimeValue(value?: string | null) {
  if (!value) return "";
  const normalized = String(value).trim();
  return /^\d{2}:\d{2}:\d{2}$/.test(normalized)
    ? normalized.slice(0, 5)
    : normalized;
}

function formatDateDisplay(dateString?: string | null) {
  if (!dateString) return "";
  const [year, month, day] = String(dateString).slice(0, 10).split("-");
  if (!year || !month || !day) return String(dateString);
  return `${day}-${month}-${year}`;
}

function parseDateDisplay(dateString?: string | null) {
  const value = String(dateString || "").trim();
  if (!/^\d{2}-\d{2}-\d{4}$/.test(value)) return "";
  const [day, month, year] = value.split("-");
  return `${year}-${month}-${day}`;
}

function isValidDisplayDate(dateString?: string | null) {
  const value = String(dateString || "").trim();
  const isoDate = parseDateDisplay(value);
  if (!isoDate) return false;

  const [year, month, day] = isoDate.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));

  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

function getDateRangeDays(from: string, to: string) {
  const result: string[] = [];
  const current = new Date(`${from}T12:00:00`);
  const end = new Date(`${to}T12:00:00`);

  while (current <= end) {
    result.push(current.toISOString().slice(0, 10));
    current.setDate(current.getDate() + 1);
  }

  return result;
}

function getNextDateIso(dateString: string) {
  const date = new Date(`${dateString}T12:00:00`);
  date.setDate(date.getDate() + 1);
  return date.toISOString().slice(0, 10);
}

function getSpecialDateGroupConfigKey(item: StaffSpecialDateItem) {
  return [
    item.label || "",
    item.is_closed ? "closed" : "partial",
    normalizeTimeValue(item.start_time),
    normalizeTimeValue(item.end_time),
  ].join("|");
}

function groupStaffSpecialDates(items: StaffSpecialDateItem[]) {
  const sorted = [...items]
    .filter((item) => item.date)
    .sort((a, b) => String(a.date).localeCompare(String(b.date)));

  const groups: StaffSpecialDateGroup[] = [];

  for (const item of sorted) {
    const configKey = getSpecialDateGroupConfigKey(item);
    const previous = groups[groups.length - 1];
    const isConsecutive =
      previous &&
      previous.key === configKey &&
      getNextDateIso(previous.endDate) === item.date;

    if (isConsecutive) {
      previous.items.push(item);
      previous.endDate = item.date;
      previous.isRange = previous.startDate !== previous.endDate;
      continue;
    }

    groups.push({
      key: configKey,
      items: [item],
      first: item,
      startDate: item.date,
      endDate: item.date,
      isRange: false,
    });
  }

  return groups;
}

function normalizePlanSlug(planSlug?: string | null) {
  const normalized = String(planSlug || "pro").toLowerCase();
  if (normalized === "starter") return "pro";
  if (["pro", "premium", "vip", "platinum"].includes(normalized)) {
    return normalized;
  }
  return "pro";
}

function getNoticeStyles(tone: NoticeTone): {
  wrapper: CSSProperties;
  title: CSSProperties;
  description: CSSProperties;
} {
  const tones: Record<
    NoticeTone,
    { border: string; background: string; accent: string; text: string }
  > = {
    info: {
      border: "rgba(34,197,94,0.34)",
      background:
        "linear-gradient(135deg, rgba(34,197,94,0.12), rgba(34,197,94,0.05))",
      accent: "rgb(34 197 94)",
      text: "var(--text-main)",
    },
    success: {
      border: "rgba(16,185,129,0.34)",
      background:
        "linear-gradient(135deg, rgba(16,185,129,0.12), rgba(16,185,129,0.05))",
      accent: "rgb(16 185 129)",
      text: "var(--text-main)",
    },
    warning: {
      border: "rgba(245,158,11,0.34)",
      background:
        "linear-gradient(135deg, rgba(245,158,11,0.12), rgba(245,158,11,0.05))",
      accent: "rgb(245 158 11)",
      text: "var(--text-main)",
    },
    limit: {
      border: "rgba(249,115,22,0.34)",
      background:
        "linear-gradient(135deg, rgba(249,115,22,0.12), rgba(249,115,22,0.05))",
      accent: "rgb(249 115 22)",
      text: "var(--text-main)",
    },
    danger: {
      border: "rgba(244,63,94,0.34)",
      background:
        "linear-gradient(135deg, rgba(244,63,94,0.12), rgba(244,63,94,0.05))",
      accent: "rgb(244 63 94)",
      text: "var(--text-main)",
    },
    neutral: {
      border: "var(--border-color)",
      background: "var(--bg-soft)",
      accent: "var(--text-main)",
      text: "var(--text-main)",
    },
  };

  const current = tones[tone];

  return {
    wrapper: {
      borderColor: current.border,
      background: current.background,
      boxShadow: `inset 0 1px 0 rgba(255,255,255,0.04), 0 0 0 1px ${current.border}`,
    },
    title: {
      color: current.text,
    },
    description: {
      color: "var(--text-muted)",
    },
  };
}

function Notice({
  tone,
  title,
  description,
  children,
}: {
  tone: NoticeTone;
  title: string;
  description?: string;
  children?: React.ReactNode;
}) {
  const styles = getNoticeStyles(tone);

  return (
    <div className="rounded-2xl border px-4 py-4 shadow-sm" style={styles.wrapper}>
      <p className="text-sm font-semibold" style={styles.title}>
        {title}
      </p>

      {description ? (
        <p className="mt-1 text-sm leading-6" style={styles.description}>
          {description}
        </p>
      ) : null}

      {children ? <div className="mt-3">{children}</div> : null}
    </div>
  );
}

export default function StaffPage() {
  const params = useParams();
  const slug =
    ((params as { slug?: string })?.slug as string) ||
    ((params as { Slug?: string })?.Slug as string) ||
    "";

  const [tenantId, setTenantId] = useState("");
  const [calendarId, setCalendarId] = useState("");
  const [branches, setBranches] = useState<BranchItem[]>([]);
  const [selectedBranchId, setSelectedBranchId] = useState("");
  const [loadingBranches, setLoadingBranches] = useState(false);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [saveError, setSaveError] = useState("");
  const [saveOk, setSaveOk] = useState("");

  const [staff, setStaff] = useState<StaffItem[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [activeFormSection, setActiveFormSection] = useState<"datos" | "horarios">("datos");

  const [form, setForm] = useState(emptyForm);
const [photoUrl, setPhotoUrl] = useState("");
  const [staffHours, setStaffHours] = useState<StaffHourItem[]>(defaultHours);
  const [staffSpecialDates, setStaffSpecialDates] = useState<
    StaffSpecialDateItem[]
  >([]);
  const [specialDateForm, setSpecialDateForm] =
    useState<StaffSpecialDateItem>(emptySpecialDateForm);
  const [specialRangeForm, setSpecialRangeForm] =
    useState<SpecialRangeForm>(emptySpecialRangeForm);
  const [specialDateDisplay, setSpecialDateDisplay] = useState("");
  const [specialRangeDateFromDisplay, setSpecialRangeDateFromDisplay] =
    useState("");
  const [specialRangeDateToDisplay, setSpecialRangeDateToDisplay] =
    useState("");
  const [specialDateFormOpen, setSpecialDateFormOpen] = useState(false);
  const [specialDateSaving, setSpecialDateSaving] = useState(false);
  const [specialDateError, setSpecialDateError] = useState("");
  const [editingSpecialDateId, setEditingSpecialDateId] = useState<
    string | null
  >(null);

  const [services, setServices] = useState<ServiceItem[]>([]);
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([]);
  const [staffCalendarConnection, setStaffCalendarConnection] =
    useState<CalendarConnectionItem | null>(null);
  const [staffCalendarConnections, setStaffCalendarConnections] = useState<
    CalendarConnectionItem[]
  >([]);
  const [loadingStaffCalendarConnection, setLoadingStaffCalendarConnection] =
    useState(false);
  const [calendarModalStaff, setCalendarModalStaff] =
    useState<StaffItem | null>(null);

  const [plan, setPlan] = useState("pro");
  const [selectedStaffToKeep, setSelectedStaffToKeep] = useState<string[]>([]);

  const branchStorageKey = useMemo(() => {
    return slug ? `orbyx_active_branch_${slug}` : "";
  }, [slug]);

  const activeCount = useMemo(
    () => staff.filter((item) => item.is_active).length,
    [staff]
  );

  const usingBusinessHoursCount = useMemo(
    () => staff.filter((item) => item.use_business_hours).length,
    [staff]
  );

  const selectedBranchName =
    branches.find((branch) => branch.id === selectedBranchId)?.name || "";

  const activeGoogleConnectionsByStaff = useMemo(() => {
    const map = new Map<string, CalendarConnectionItem>();

    staffCalendarConnections.forEach((connection) => {
      if (
        connection.provider === "google" &&
        connection.is_active &&
        connection.staff_id
      ) {
        map.set(connection.staff_id, connection);
      }
    });

    return map;
  }, [staffCalendarConnections]);

  const groupedStaffSpecialDates = useMemo(
    () => groupStaffSpecialDates(staffSpecialDates),
    [staffSpecialDates]
  );

  const planCaps: Record<string, { max_staff: number }> = {
    pro: { max_staff: 2 },
    premium: { max_staff: 5 },
    vip: { max_staff: 10 },
    platinum: { max_staff: 20 },
  };

  const caps = planCaps[plan] || planCaps.pro;
  const reachedLimit = activeCount >= caps.max_staff;
  const excessStaff = Math.max(0, activeCount - caps.max_staff);
  const hasExcess = excessStaff > 0;

  const inputClass =
    "h-11 w-full rounded-2xl border px-4 text-sm outline-none transition";
  const primaryButtonClass =
  "orbyx-staff-energy inline-flex h-11 items-center justify-center rounded-2xl border px-5 text-sm font-medium text-white transition disabled:cursor-not-allowed disabled:opacity-60";

const secondaryButtonClass =
  "orbyx-staff-energy inline-flex h-11 items-center justify-center rounded-2xl border px-5 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-60";

const specialInputClass =
  "h-10 w-full rounded-xl border px-3 text-xs outline-none transition";
const specialPrimaryButtonClass =
  "orbyx-staff-energy inline-flex h-10 w-full items-center justify-center rounded-xl border px-4 text-xs font-medium text-white transition disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto";
const specialSecondaryButtonClass =
  "orbyx-staff-energy inline-flex h-10 w-full items-center justify-center rounded-xl border px-4 text-xs font-medium transition disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto";

const calendarPickerClass =
  "absolute inset-y-0 right-0 h-10 w-10 cursor-pointer opacity-0";

async function uploadStaffImage(file: File, staffId: string) {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("staff_id", staffId);

  const res = await fetch("/api/upload-staff-photo", {
    method: "POST",
    body: formData,
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data?.error || "Error subiendo imagen");
  }

  return data.public_url;
}
  function readStoredBranchId() {
    if (typeof window === "undefined" || !branchStorageKey) return "";
    return localStorage.getItem(branchStorageKey) || "";
  }

  useEffect(() => {
    if (hasExcess) {
      const activeStaff = staff.filter((s) => s.is_active);
      const allowed = activeStaff.slice(0, caps.max_staff).map((s) => s.id);
      setSelectedStaffToKeep(allowed);
    } else {
      setSelectedStaffToKeep([]);
    }
  }, [hasExcess, staff, caps.max_staff]);

  useEffect(() => {
    async function loadPage() {
      try {
        setLoading(true);
        setLoadError("");

        const res = await fetch(`${BACKEND_URL}/public/business/${slug}`);
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
        setCalendarId(data.calendar_id || "");
        setPlan(normalizePlanSlug(data.business.plan_slug));
        await loadBranches(data.business.id);
      } catch (error: unknown) {
        setLoadError(
          error instanceof Error
            ? error.message
            : "No se pudo cargar el módulo staff"
        );
      } finally {
        setLoading(false);
      }
    }

    if (slug) {
      loadPage();
    }
  }, [slug]);

  useEffect(() => {
    if (!tenantId) return;

    if (!selectedBranchId) {
      setStaff([]);
      setServices([]);
      resetForm();
      return;
    }

    async function loadData() {
      try {
        setLoadError("");
        await Promise.all([
          loadStaff(tenantId),
          loadServices(tenantId),
          loadStaffCalendarConnections(tenantId),
        ]);
      } catch (error: unknown) {
        setLoadError(
          error instanceof Error
            ? error.message
            : "No se pudo cargar staff o servicios"
        );
      }
    }

    loadData();
  }, [tenantId, selectedBranchId]);

  useEffect(() => {
    function handleBranchChanged(event: Event) {
      const customEvent = event as CustomEvent<{
        slug?: string;
        branchId?: string;
      }>;
      const eventSlug = customEvent.detail?.slug;
      const branchId = customEvent.detail?.branchId || "";

      if (eventSlug !== slug) return;

      setSelectedBranchId(branchId);
      resetForm();
    }

    function handleStorage(event: StorageEvent) {
      if (event.key !== branchStorageKey) return;

      const nextBranchId = event.newValue || "";
      setSelectedBranchId(nextBranchId);
      resetForm();
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
    if (!tenantId || !editingId) {
      setStaffCalendarConnection(null);
      return;
    }

    loadStaffCalendarConnection(tenantId, editingId);
  }, [tenantId, editingId]);

  async function loadStaff(id: string) {
    if (!selectedBranchId) {
      setStaff([]);
      return;
    }

    const res = await fetch(
      `${BACKEND_URL}/staff?tenant_id=${id}&branch_id=${selectedBranchId}`
    );
    const data = await res.json();

    if (!res.ok) {
      throw new Error(data?.error || "No se pudo cargar el staff");
    }

    setStaff(Array.isArray(data.staff) ? data.staff : []);
  }

  async function loadStaffCalendarConnection(id: string, staffId: string) {
    try {
      setLoadingStaffCalendarConnection(true);

      const res = await fetch(
        `${BACKEND_URL}/calendar-connections?tenant_id=${id}&staff_id=${staffId}`
      );
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "No se pudo cargar calendario del staff");
      }

      const connections = Array.isArray(data?.connections)
        ? data.connections
        : [];
      const googleConnection =
        connections.find(
          (item: CalendarConnectionItem) =>
            item.provider === "google" && item.is_active
        ) || null;

      setStaffCalendarConnection(googleConnection);
    } catch (error) {
      console.error("Error cargando conexión calendario staff", error);
      setStaffCalendarConnection(null);
    } finally {
      setLoadingStaffCalendarConnection(false);
    }
  }

  async function loadStaffCalendarConnections(id: string) {
    try {
      const res = await fetch(
        `${BACKEND_URL}/calendar-connections?tenant_id=${id}`
      );
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "No se pudieron cargar calendarios");
      }

      setStaffCalendarConnections(
        Array.isArray(data?.connections) ? data.connections : []
      );
    } catch (error) {
      console.error("Error cargando conexiones calendario", error);
      setStaffCalendarConnections([]);
    }
  }

  function connectStaffGoogleCalendar(staffId = editingId || "") {
    if (!tenantId || !selectedBranchId || !staffId || !calendarId) return;

    const params = new URLSearchParams({
      tenant_id: tenantId,
      branch_id: selectedBranchId,
      staff_id: staffId,
      scope_level: "staff",
      calendar_id: calendarId,
    });

    window.location.href = `${BACKEND_URL}/auth?${params.toString()}`;
  }


async function loadStaffHours(id: string, staffId: string) {
  const res = await fetch(
    `${BACKEND_URL}/staff-hours?tenant_id=${id}&staff_id=${staffId}`
  );

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data?.error || "No se pudo cargar staff_hours");
  }

  const rows = Array.isArray(data?.hours) ? data.hours : [];

  const merged = days.flatMap((day) => {
    const foundRows = rows
      .filter(
        (row: { day_of_week: number }) =>
          Number(row.day_of_week) === Number(day.value)
      )
      .sort(
        (a: { block_order?: number }, b: { block_order?: number }) =>
          Number(a.block_order || 1) - Number(b.block_order || 1)
      );

    if (foundRows.length === 0) {
      return [
        {
          day_of_week: day.value,
          block_order: 1,
          enabled: false,
          start_time: "09:00",
          end_time: "18:00",
        },
      ];
    }

    return foundRows.map(
      (
        row: {
          enabled?: boolean;
          start_time?: string | null;
          end_time?: string | null;
          block_order?: number;
        },
        index: number
      ) => ({
        day_of_week: day.value,
        block_order: Number(row.block_order || index + 1),
        enabled: Boolean(row.enabled),
        start_time: normalizeTimeValue(row.start_time) || "09:00",
        end_time: normalizeTimeValue(row.end_time) || "18:00",
      })
    );
  });

  setStaffHours(merged);
}


  async function loadStaffSpecialDates(id: string, staffId: string) {
    const res = await fetch(
      `${BACKEND_URL}/staff-special-dates?tenant_id=${id}&staff_id=${staffId}`
    );

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data?.error || "No se pudo cargar staff_special_dates");
    }

    setStaffSpecialDates(
      Array.isArray(data?.special_dates) ? data.special_dates : []
    );
  }

  async function loadServices(id: string) {
    if (!selectedBranchId) {
      setServices([]);
      return;
    }

    const res = await fetch(
      `${BACKEND_URL}/services?tenant_id=${id}&branch_id=${selectedBranchId}&active=true`
    );
    const data = await res.json();

    if (!res.ok) {
      throw new Error(data?.error || "No se pudo cargar los servicios");
    }

    setServices(Array.isArray(data?.services) ? data.services : []);
  }

  async function loadBranches(currentTenantId: string) {
    try {
      setLoadingBranches(true);

      const res = await fetch(
        `${BACKEND_URL}/branches?tenant_id=${currentTenantId}`
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "Error cargando sucursales");
      }

      const rows: BranchItem[] = Array.isArray(data.branches)
        ? data.branches
        : [];
      const activeRows = rows.filter((branch) => branch.is_active !== false);
      setBranches(activeRows);

      if (activeRows.length === 0) {
        setSelectedBranchId("");
        if (typeof window !== "undefined" && branchStorageKey) {
          localStorage.removeItem(branchStorageKey);
        }
        return;
      }

      const storedBranchId = readStoredBranchId();
      const storedExists = activeRows.some(
        (branch: BranchItem) => branch.id === storedBranchId
      );

      if (storedExists) {
        setSelectedBranchId(storedBranchId);
        return;
      }

      const fallbackBranchId = activeRows[0].id;
      setSelectedBranchId(fallbackBranchId);

      if (typeof window !== "undefined" && branchStorageKey) {
        localStorage.setItem(branchStorageKey, fallbackBranchId);
      }
    } catch (err) {
      console.error("Error cargando branches", err);
      setBranches([]);
      setSelectedBranchId("");
    } finally {
      setLoadingBranches(false);
    }
  }

  async function loadStaffServices(id: string, staffId: string) {
    const params = new URLSearchParams({
      tenant_id: id,
      staff_id: staffId,
    });

    if (selectedBranchId) {
      params.set("branch_id", selectedBranchId);
    }

    const res = await fetch(`${BACKEND_URL}/staff-services?${params}`);

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data?.error || "No se pudo cargar staff_services");
    }

    const rows = Array.isArray(data?.staff_services) ? data.staff_services : [];

    setSelectedServiceIds(
      rows
        .map((item: { service_id?: string }) => item.service_id)
        .filter((value: unknown): value is string => typeof value === "string")
    );
  }

  async function saveStaffServices(staffId: string) {
    const payload = {
      tenant_id: tenantId,
      branch_id: selectedBranchId,
      staff_id: staffId,
      service_ids: selectedServiceIds,
    };

    const res = await fetch(`${BACKEND_URL}/staff-services`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data?.error || "No se pudo guardar staff_services");
    }
  }

  function toggleService(serviceId: string) {
    setSelectedServiceIds((prev) =>
      prev.includes(serviceId)
        ? prev.filter((id) => id !== serviceId)
        : [...prev, serviceId]
    );
  }

  function resetSpecialDateForm() {
    setSpecialDateForm(emptySpecialDateForm);
    setSpecialRangeForm(emptySpecialRangeForm);
    setSpecialDateDisplay("");
    setSpecialRangeDateFromDisplay("");
    setSpecialRangeDateToDisplay("");
    setSpecialDateError("");
    setEditingSpecialDateId(null);
    setSpecialDateFormOpen(false);
  }

  function openSpecialDateForm() {
    setSpecialDateForm(emptySpecialDateForm);
    setSpecialRangeForm(emptySpecialRangeForm);
    setSpecialDateDisplay("");
    setSpecialRangeDateFromDisplay("");
    setSpecialRangeDateToDisplay("");
    setSpecialDateError("");
    setEditingSpecialDateId(null);
    setSpecialDateFormOpen(true);
  }

  function toggleStaffSelection(staffId: string) {
    setSelectedStaffToKeep((prev) =>
      prev.includes(staffId)
        ? prev.filter((id) => id !== staffId)
        : [...prev, staffId]
    );
  }

  async function applyStaffAdjustment() {
    try {
      const toDeactivate = staff.filter(
        (s) => s.is_active && !selectedStaffToKeep.includes(s.id)
      );

      if (toDeactivate.length === 0) {
        alert("No hay profesionales para desactivar");
        return;
      }

      const confirmAction = confirm(
        `Se desactivarán ${toDeactivate.length} profesionales. ¿Continuar?`
      );

      if (!confirmAction) return;

      for (const staffItem of toDeactivate) {
        const res = await fetch(`${BACKEND_URL}/staff/${staffItem.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            tenant_id: staffItem.tenant_id,
            branch_id: staffItem.branch_id || selectedBranchId,
            name: staffItem.name,
            role: staffItem.role || "",
            email: staffItem.email || "",
            phone: staffItem.phone || "",
            is_active: false,
            sort_order: Number(staffItem.sort_order || 0),
            use_business_hours:
              staffItem.use_business_hours === undefined
                ? true
                : Boolean(staffItem.use_business_hours),
          }),

        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data?.error || `Error desactivando ${staffItem.name}`);
        }
      }

      await loadStaff(tenantId);
      alert("Ajuste aplicado correctamente");
    } catch (error) {
      console.error(error);
      alert("Error al aplicar ajuste");
    }
  }

  function resetForm() {
    setForm(emptyForm);
    setEditingId(null);
    setFormOpen(false);
    setActiveFormSection("datos");
setPhotoUrl("");
    setStaffHours(defaultHours);
    setStaffSpecialDates([]);
    setSelectedServiceIds([]);
    resetSpecialDateForm();
    setSaveError("");
    setSaveOk("");
  }

  async function startEdit(item: StaffItem) {
    try {
      setLoading(true);
      setEditingId(item.id);
      setFormOpen(true);
      setActiveFormSection("datos");
      setForm({
        name: item.name || "",
        role: item.role || "",
        email: item.email || "",
        phone: item.phone || "",
        is_active: Boolean(item.is_active),
        sort_order: Number(item.sort_order || 0),
        use_business_hours:
          item.use_business_hours === undefined
            ? true
            : Boolean(item.use_business_hours),
      });
setPhotoUrl(item.photo_url || "");
      setSaveError("");
      setSaveOk("");
      resetSpecialDateForm();

      await Promise.all([
        loadStaffHours(item.tenant_id, item.id),
        loadStaffSpecialDates(item.tenant_id, item.id),
        loadStaffServices(item.tenant_id, item.id),
      ]);
    } catch (error: unknown) {
      setSaveError(
        error instanceof Error
          ? error.message
          : "No se pudo cargar la configuración del staff"
      );
    } finally {
      setLoading(false);
    }
  }


function updateHour(
  dayOfWeek: number,
  blockOrder: number,
  field: "enabled" | "start_time" | "end_time",
  value: boolean | string
) {
  setStaffHours((prev) =>
    prev.map((item) =>
      item.day_of_week === dayOfWeek && item.block_order === blockOrder
        ? { ...item, [field]: value }
        : item
    )
  );
}

function getStaffHourDayError(dayOfWeek: number) {
  const blocks = staffHours.filter(
    (item) => item.day_of_week === dayOfWeek && item.enabled
  );

  for (const block of blocks) {
    if (!block.start_time || !block.end_time) {
      return "Usa formato HH:mm válido. Ejemplo: 09:30";
    }

    if (!isValidHHmm(block.start_time) || !isValidHHmm(block.end_time)) {
      return "Usa formato HH:mm válido. Ejemplo: 09:30";
    }

    if (block.start_time >= block.end_time) {
      return "La hora fin debe ser mayor a la hora inicio.";
    }
  }

  return "";
}

function getStaffSpecialDateTimeError() {
  if (specialDateForm.is_closed) return "";

  const startTime = String(specialDateForm.start_time || "").trim();
  const endTime = String(specialDateForm.end_time || "").trim();

  if (!isValidHHmm(startTime) || !isValidHHmm(endTime)) {
    return "Formato inválido. Usa HH:mm entre 00:00 y 23:59.";
  }

  if (startTime >= endTime) {
    return "La hora inicio debe ser menor que la hora fin.";
  }

  return "";
}

function getStaffSpecialDateLabel() {
  return [specialRangeForm.type, (specialDateForm.label || "").trim()]
    .filter(Boolean)
    .join(" - ");
}

function getStaffSpecialDateDisplayError() {
  if (specialRangeForm.enabled && !editingSpecialDateId) {
    if (
      specialRangeDateFromDisplay &&
      !isValidDisplayDate(specialRangeDateFromDisplay)
    ) {
      return "Usa formato dd-mm-yyyy válido.";
    }

    if (
      specialRangeDateToDisplay &&
      !isValidDisplayDate(specialRangeDateToDisplay)
    ) {
      return "Usa formato dd-mm-yyyy válido.";
    }

    const dateFrom = parseDateDisplay(specialRangeDateFromDisplay);
    const dateTo = parseDateDisplay(specialRangeDateToDisplay);

    if (dateFrom && dateTo && dateTo < dateFrom) {
      return "Hasta no puede ser menor que Desde.";
    }

    return "";
  }

  if (specialDateDisplay && !isValidDisplayDate(specialDateDisplay)) {
    return "Usa formato dd-mm-yyyy válido.";
  }

  return "";
}


async function saveStaffHours(staffId: string) {
  const payload = {
    tenant_id: tenantId,
    staff_id: staffId,
    hours: staffHours.map((item) => ({
      day_of_week: item.day_of_week,
      block_order: item.block_order,
      enabled: item.enabled,
      start_time: item.enabled ? item.start_time || null : null,
      end_time: item.enabled ? item.end_time || null : null,
    })),
  };

  const res = await fetch(`${BACKEND_URL}/staff-hours`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data?.error || "No se pudo guardar staff_hours");
  }
}


function validateStaffHours() {
  const enabledBlocks = staffHours.filter((item) => item.enabled);

  for (const item of enabledBlocks) {
    const dayLabel =
      days.find((day) => day.value === item.day_of_week)?.label || "Día";

    if (!item.start_time || !item.end_time) {
      throw new Error(`Debes ingresar hora de inicio y fin en ${dayLabel}`);
    }

    if (!isValidHHmm(item.start_time) || !isValidHHmm(item.end_time)) {
      throw new Error(
        `Usa formato HH:mm válido en ${dayLabel}. Ejemplo: 09:30`
      );
    }

    if (item.start_time >= item.end_time) {
      throw new Error(
        `La hora fin debe ser mayor a la hora inicio en ${dayLabel}`
      );
    }
  }

  for (const item of enabledBlocks) {
    if (!item.start_time || !item.end_time) {
      throw new Error("Cada bloque activo debe tener hora de inicio y fin");
    }

    if (item.start_time >= item.end_time) {
      const dayLabel =
        days.find((day) => day.value === item.day_of_week)?.label || "Día";

      throw new Error(
        `La hora fin debe ser mayor a la hora inicio en ${dayLabel}`
      );
    }
  }

  for (const day of days) {
    const blocks = enabledBlocks
      .filter((item) => item.day_of_week === day.value)
      .sort((a, b) => String(a.start_time).localeCompare(String(b.start_time)));

    for (let i = 1; i < blocks.length; i++) {
      const previous = blocks[i - 1];
      const current = blocks[i];

      if ((current.start_time || "") < (previous.end_time || "")) {
        throw new Error(
          `Hay bloques superpuestos en ${day.label}. Revisa los horarios.`
        );
      }
    }
  }
}




  function validateSpecialDate() {
    if (specialRangeForm.enabled && !editingSpecialDateId) {
      const dateFrom = parseDateDisplay(specialRangeDateFromDisplay);
      const dateTo = parseDateDisplay(specialRangeDateToDisplay);

      if (!specialRangeDateFromDisplay || !specialRangeDateToDisplay) {
        throw new Error("Debes ingresar fecha desde y fecha hasta");
      }

      if (!isValidDisplayDate(specialRangeDateFromDisplay) || !isValidDisplayDate(specialRangeDateToDisplay)) {
        throw new Error("Usa formato dd-mm-yyyy válido.");
      }

      if (dateFrom > dateTo) {
        throw new Error("La fecha hasta debe ser igual o posterior a fecha desde");
      }
    } else if (!specialDateDisplay) {
      throw new Error("Debes ingresar una fecha");
    } else if (!isValidDisplayDate(specialDateDisplay)) {
      throw new Error("Usa formato dd-mm-yyyy válido.");
    }

    if (!specialDateForm.is_closed) {
      const timeError = getStaffSpecialDateTimeError();

      if (timeError) {
        throw new Error(timeError);
      }

    }

    const duplicated = staffSpecialDates.find((item) => {
      const selectedDate = parseDateDisplay(specialDateDisplay);
      if (!item.date || item.date !== selectedDate) return false;

      if (editingSpecialDateId) {
        return item.id !== editingSpecialDateId;
      }

      return true;
    });

    if (duplicated) {
      throw new Error("Ya existe una excepción para esa fecha en este staff");
    }
  }

  async function handleSave() {
    try {
      setSaving(true);
      setSaveError("");
      setSaveOk("");

      if (!tenantId) {
        throw new Error("tenant_id no disponible");
      }

      if (!selectedBranchId) {
        throw new Error("Debes seleccionar una sucursal activa");
      }

      if (!form.name.trim()) {
        throw new Error("Debes ingresar el nombre del staff");
      }

      if (selectedServiceIds.length === 0) {
        throw new Error("Debes asignar al menos un servicio al staff");
      }

      if (!form.use_business_hours) {
        validateStaffHours();
      }

      const payload = {
        tenant_id: tenantId,
        branch_id: selectedBranchId,
        name: form.name.trim(),
        role: form.role.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        is_active: form.is_active,
        sort_order: Number(form.sort_order || 0),
        use_business_hours: form.use_business_hours,
        photo_url: photoUrl || null,
      };

      const url = editingId
        ? `${BACKEND_URL}/staff/${editingId}`
        : `${BACKEND_URL}/staff`;

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

      const savedStaffId = data?.staff?.id || editingId;

      if (!savedStaffId) {
        throw new Error("No se pudo obtener el id del staff guardado");
      }

      if (!form.use_business_hours) {
        await saveStaffHours(savedStaffId);
      }

      await saveStaffServices(savedStaffId);
      await loadStaff(tenantId);
      resetForm();
      setSaveOk(
        editingId
          ? "Staff actualizado correctamente."
          : "Staff creado correctamente."
      );
    } catch (error: unknown) {
      setSaveError(
        error instanceof Error
          ? error.message
          : "No se pudo guardar el staff"
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    const ok = window.confirm("¿Seguro que quieres eliminar este staff?");
    if (!ok) return;

    try {
      const res = await fetch(`${BACKEND_URL}/staff/${id}`, {
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
    } catch (error: unknown) {
      alert(
        error instanceof Error ? error.message : "No se pudo eliminar el staff"
      );
    }
  }

  async function handleToggleStaffActive(item: StaffItem) {
    const nextActive = !item.is_active;
    const ok = window.confirm(
      nextActive
        ? `¿Quieres activar a ${item.name}?`
        : `¿Quieres desactivar a ${item.name}?`
    );
    if (!ok) return;

    try {
      setSaveError("");
      setSaveOk("");

      const res = await fetch(`${BACKEND_URL}/staff/${item.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          tenant_id: item.tenant_id || tenantId,
          branch_id: item.branch_id || selectedBranchId,
          name: item.name,
          role: item.role || "",
          email: item.email || "",
          phone: item.phone || "",
          is_active: nextActive,
          sort_order: Number(item.sort_order || 0),
          use_business_hours:
            item.use_business_hours === undefined
              ? true
              : Boolean(item.use_business_hours),
          photo_url: item.photo_url || null,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "No se pudo actualizar el staff");
      }

      await loadStaff(tenantId);
      setSaveOk(nextActive ? "Staff activado correctamente." : "Staff desactivado correctamente.");
    } catch (error: unknown) {
      setSaveError(
        error instanceof Error
          ? error.message
          : "No se pudo actualizar el estado del staff"
      );
    }
  }

  function handleEditSpecialDate(item: StaffSpecialDateItem) {
    setEditingSpecialDateId(item.id || null);
    setSpecialDateForm({
      id: item.id,
      tenant_id: item.tenant_id,
      staff_id: item.staff_id,
      date: item.date || "",
      label: item.label || "",
      is_closed: Boolean(item.is_closed),
      start_time: normalizeTimeValue(item.start_time) || "09:00",
      end_time: normalizeTimeValue(item.end_time) || "18:00",
    });
    setSpecialDateDisplay(formatDateDisplay(item.date));
    setSpecialRangeDateFromDisplay("");
    setSpecialRangeDateToDisplay("");
    setSpecialDateFormOpen(true);
    setSaveError("");
    setSpecialDateError("");
    setSaveOk("");
  }

  async function handleSaveSpecialDate() {
    try {
      if (!tenantId) {
        throw new Error("tenant_id no disponible");
      }

      if (!editingId) {
        throw new Error(
          "Primero debes guardar el staff antes de administrar excepciones"
        );
      }

      validateSpecialDate();

      setSpecialDateSaving(true);
      setSaveError("");
      setSpecialDateError("");
      setSaveOk("");

      if (specialRangeForm.enabled && !editingSpecialDateId) {
        const dateFrom = parseDateDisplay(specialRangeDateFromDisplay);
        const dateTo = parseDateDisplay(specialRangeDateToDisplay);
        const rangeDays = getDateRangeDays(
          dateFrom,
          dateTo
        );
        const label = [
          specialRangeForm.type,
          (specialDateForm.label || "").trim(),
        ]
          .filter(Boolean)
          .join(" - ");

        const duplicated = staffSpecialDates.find((item) =>
          rangeDays.includes(item.date)
        );

        if (duplicated) {
          throw new Error(
            `Ya existe una excepción para ${duplicated.date} en este staff`
          );
        }

        for (const date of rangeDays) {
          const res = await fetch(`${BACKEND_URL}/staff-special-dates`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              tenant_id: tenantId,
              branch_id: selectedBranchId,
              staff_id: editingId,
              date,
              label,
              is_closed: specialDateForm.is_closed,
              start_time: specialDateForm.is_closed
                ? null
                : specialDateForm.start_time || null,
              end_time: specialDateForm.is_closed
                ? null
                : specialDateForm.end_time || null,
            }),
          });
          const data = await res.json();

          if (!res.ok) {
            throw new Error(data?.error || "No se pudo crear el rango");
          }
        }

        await loadStaffSpecialDates(tenantId, editingId);
        resetSpecialDateForm();
        setSaveOk(`Rango de ${rangeDays.length} días creado correctamente.`);
        return;
      }

      const payload = {
        tenant_id: tenantId,
        branch_id: selectedBranchId,
        staff_id: editingId,
        date: parseDateDisplay(specialDateDisplay),
        label: getStaffSpecialDateLabel() || null,
        is_closed: specialDateForm.is_closed,
        start_time: specialDateForm.is_closed
          ? null
          : specialDateForm.start_time || null,
        end_time: specialDateForm.is_closed
          ? null
          : specialDateForm.end_time || null,
      };

      const isEditing = Boolean(editingSpecialDateId);

      const url = isEditing
        ? `${BACKEND_URL}/staff-special-dates/${editingSpecialDateId}`
        : `${BACKEND_URL}/staff-special-dates`;

      const method = isEditing ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(
          data?.error ||
            (isEditing
              ? "No se pudo actualizar la excepción"
              : "No se pudo crear la excepción")
        );
      }

      await loadStaffSpecialDates(tenantId, editingId);
      resetSpecialDateForm();
      setSaveOk(
        isEditing
          ? "Excepción del staff actualizada correctamente."
          : "Excepción del staff creada correctamente."
      );
    } catch (error: unknown) {
      setSpecialDateError(
        error instanceof Error
          ? error.message
          : "No se pudo guardar la excepción"
      );
    } finally {
      setSpecialDateSaving(false);
    }
  }

  async function handleDeleteSpecialDate(id: string) {
    const ok = window.confirm("¿Seguro que quieres eliminar esta excepción?");
    if (!ok) return;

    try {
      setSaveError("");
      setSaveOk("");

      const res = await fetch(`${BACKEND_URL}/staff-special-dates/${id}`, {
        method: "DELETE",
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "No se pudo eliminar la excepción");
      }

      if (tenantId && editingId) {
        await loadStaffSpecialDates(tenantId, editingId);
      }

      if (editingSpecialDateId === id) {
        resetSpecialDateForm();
      }

      setSaveOk("Excepción eliminada correctamente.");
    } catch (error: unknown) {
      setSaveError(
        error instanceof Error
          ? error.message
          : "No se pudo eliminar la excepción"
      );
    }
  }
  async function handleDeleteSpecialDateGroup(group: StaffSpecialDateGroup) {
    const ids = group.items.map((item) => item.id).filter(Boolean) as string[];
    if (ids.length === 0) return;

    const ok = window.confirm(
      group.isRange
        ? "¿Seguro que quieres eliminar este rango de excepciones?"
        : "¿Seguro que quieres eliminar esta excepción?"
    );
    if (!ok) return;

    try {
      setSaveError("");
      setSaveOk("");

      for (const id of ids) {
        const res = await fetch(`${BACKEND_URL}/staff-special-dates/${id}`, {
          method: "DELETE",
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data?.error || "No se pudo eliminar la excepción");
        }
      }

      if (tenantId && editingId) {
        await loadStaffSpecialDates(tenantId, editingId);
      }

      if (editingSpecialDateId && ids.includes(editingSpecialDateId)) {
        resetSpecialDateForm();
      }

      setSaveOk(
        group.isRange
          ? "Rango de excepciones eliminado correctamente."
          : "Excepción eliminada correctamente."
      );
    } catch (error: unknown) {
      setSaveError(
        error instanceof Error
          ? error.message
          : "No se pudo eliminar la excepción"
      );
    }
  }

  return (
    <div className="space-y-6 [overflow-x:clip] pb-6">
      <style>{`
        .orbyx-staff-energy {
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

        .orbyx-staff-energy::after {
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

        .orbyx-staff-energy:not(:disabled):hover {
          border-color: rgba(96, 165, 250, 0.68) !important;
          box-shadow:
            0 0 0 1px rgba(59, 130, 246, 0.16),
            0 12px 30px rgba(37, 99, 235, 0.16),
            0 0 24px rgba(14, 165, 233, 0.16) !important;
          filter: saturate(1.08);
          transform: translateY(-1px);
        }

        .orbyx-staff-energy:not(:disabled):hover::after {
          opacity: 1;
          transform: scale(1);
        }

        .orbyx-staff-energy:not(:disabled):active {
          animation: orbyx-staff-energy-pulse 260ms ease-out;
          box-shadow:
            0 0 0 1px rgba(147, 197, 253, 0.36),
            0 0 22px rgba(37, 99, 235, 0.28),
            0 8px 22px rgba(37, 99, 235, 0.16) !important;
          transform: translateY(0) scale(0.98);
        }

        .orbyx-staff-energy-active {
          border-color: rgba(96, 165, 250, 0.72) !important;
          background: linear-gradient(135deg, rgba(37, 99, 235, 0.16), rgba(14, 165, 233, 0.08)) !important;
          box-shadow:
            inset 0 0 0 1px rgba(147, 197, 253, 0.28),
            0 12px 30px rgba(37, 99, 235, 0.16),
            0 0 20px rgba(14, 165, 233, 0.14) !important;
        }

        @keyframes orbyx-staff-energy-pulse {
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
  className="overflow-hidden rounded-[24px] border p-4 shadow-sm"
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
              Equipo
            </p>

            <h1
  className="text-2xl font-semibold tracking-tight sm:text-3xl"
              style={{ color: "var(--text-main)" }}
            >
              Staff
            </h1>

            <p
              className="mt-3 max-w-2xl text-sm leading-6 sm:text-[15px]"
              style={{ color: "var(--text-muted)" }}
            >
              {selectedBranchName
                ? `Administra el staff de la sucursal ${selectedBranchName}, sus servicios, horarios y días/horarios excepcionales.`
                : "Administra las personas que atienden en tu negocio, sus servicios, horarios y días/horarios excepcionales."}
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
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
                Total staff
              </p>
              <p
                className="mt-2 text-sm font-semibold"
                style={{ color: "var(--text-main)" }}
              >
                {loading ? "..." : staff.length}
              </p>
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
                Activos
              </p>
              <p
                className="mt-2 text-sm font-semibold"
                style={{ color: "var(--text-main)" }}
              >
                {loading ? "..." : activeCount}
              </p>
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
                Usan horario negocio
              </p>
              <p
                className="mt-2 text-sm font-semibold"
                style={{ color: "var(--text-main)" }}
              >
                {loading ? "..." : usingBusinessHoursCount}
              </p>
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
                Límite del plan
              </p>
              <p
                className="mt-2 text-sm font-semibold"
                style={{ color: "var(--text-main)" }}
              >
                {loading ? "..." : `${activeCount}/${caps.max_staff}`}
              </p>
            </div>
          </div>
        </div>
      </section>

      {loadingBranches && !selectedBranchId ? (
        <div className="rounded-2xl border border-slate-300/60 bg-slate-500/10 px-4 py-3 text-sm shadow-sm">
          <span style={{ color: "var(--text-muted)" }}>
            Cargando sucursal activa...
          </span>
        </div>
      ) : null}

      {!loadingBranches && !selectedBranchId ? (
        <Notice
          tone="warning"
          title="Debes seleccionar una sucursal activa."
          description="Selecciona una sucursal en el sidebar para administrar el staff."
        />
      ) : null}

      {loadError ? (
        <Notice tone="danger" title={loadError} />
      ) : null}

      {saveOk ? (
        <Notice tone="success" title={saveOk} />
      ) : null}

      {saveError && !(formOpen || editingId) ? (
        <Notice tone="danger" title={saveError} />
      ) : null}

      <section className="space-y-6">
        {formOpen || editingId ? (
        <Panel className="min-w-0 bg-[linear-gradient(180deg,rgba(37,99,235,0.08),transparent_35%)]">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-semibold tracking-tight" style={{ color: "var(--text-main)" }}>
                {editingId ? "Editar integrante" : "Crear nuevo integrante"}
              </h3>
            </div>
            <button
              type="button"
              onClick={resetForm}
              className={secondaryButtonClass}
              style={{
                borderColor: "var(--border-color)",
                background: "var(--bg-soft)",
                color: "var(--text-main)",
              }}
            >
              Volver al equipo
            </button>
          </div>

          {!selectedBranchId ? (
            <div
              className="rounded-2xl border border-dashed px-4 py-8 text-sm"
              style={{
                borderColor: "var(--border-color)",
                background: "var(--bg-soft)",
                color: "var(--text-muted)",
              }}
            >
              Selecciona una sucursal activa en el sidebar para gestionar staff.
            </div>
          ) : loading ? (
            <div
              className="rounded-2xl border border-dashed px-4 py-8 text-sm"
              style={{
                borderColor: "var(--border-color)",
                background: "var(--bg-soft)",
                color: "var(--text-muted)",
              }}
            >
              Cargando...
            </div>
          ) : (






            <div className="space-y-5">
              <div className="-mx-1 overflow-x-auto px-1" aria-label="Secciones de staff">
                <div
                  className="flex min-w-max gap-2 rounded-2xl border p-1.5"
                  style={{
                    borderColor: "var(--border-color)",
                    background: "var(--bg-soft)",
                  }}
                >
                  {[
                    { id: "datos" as const, title: "Datos básicos" },
                    { id: "horarios" as const, title: "Horarios" },
                  ].map((section) => {
                    const active = activeFormSection === section.id;

                    return (
                      <button
                        key={section.id}
                        type="button"
                        onClick={() => setActiveFormSection(section.id)}
                        className={`orbyx-staff-energy inline-flex h-11 cursor-pointer items-center justify-center rounded-xl border px-4 text-sm font-semibold transition hover:border-blue-400/50 focus:outline-none focus:ring-2 focus:ring-blue-400/60 ${
                          active ? "orbyx-staff-energy-active" : ""
                        }`}
                        style={{
                          borderColor: active ? "rgba(37,99,235,0.55)" : "transparent",
                          background: active ? "rgba(37,99,235,0.14)" : "transparent",
                          color: active ? "var(--text-main)" : "var(--text-muted)",
                        }}
                        aria-current={active ? "page" : undefined}
                      >
                        {section.title}
                      </button>
                    );
                  })}
                </div>
              </div>

              {activeFormSection === "datos" ? (
                <>

  <div
    className="rounded-2xl border p-4"
    style={{
      borderColor: "var(--border-color)",
      background: "var(--bg-card)",
    }}
  >
    <p
      className="mb-3 text-sm font-semibold"
      style={{ color: "var(--text-main)" }}
    >
      Foto del profesional
    </p>

    <div className="flex items-center gap-4">
      <div className="h-24 w-24 overflow-hidden rounded-2xl border bg-slate-200">
        {photoUrl ? (
          <img src={photoUrl} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-xl text-slate-400">
            👤
          </div>
        )}
      </div>

      <div className="flex items-center gap-3">
        <label className="orbyx-staff-energy cursor-pointer rounded-xl border px-3 py-2 text-sm">
          Subir foto
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (!file) return;

              try {
                if (editingId) {
                  const url = await uploadStaffImage(file, editingId);
                  setPhotoUrl(url);
                } else {
                  const localUrl = URL.createObjectURL(file);
                  setPhotoUrl(localUrl);
                }
              } catch (err: any) {
                alert(err.message);
              }
            }}
          />
        </label>

        {photoUrl ? (
          <button
            type="button"
            onClick={() => setPhotoUrl("")}
            className="orbyx-staff-energy rounded-xl border px-3 py-2 text-sm"
            style={{
              borderColor: "rgba(244,63,94,0.28)",
              background: "rgba(244,63,94,0.08)",
              color: "#be123c",
            }}
          >
            Quitar foto
          </button>
        ) : null}
      </div>
    </div>
  </div>
              <div>
                <label
                  className="mb-2 block text-sm font-medium"
                  style={{ color: "var(--text-main)" }}
                >
                  Nombre



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
                  placeholder="Ej: Eduardo"
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label
                    className="mb-2 block text-sm font-medium"
                    style={{ color: "var(--text-main)" }}
                  >
                    Rol
                  </label>
                  <input
                    type="text"
                    value={form.role}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, role: e.target.value }))
                    }
                    className={inputClass}
                    style={{
                      borderColor: "var(--border-color)",
                      background: "var(--bg-card)",
                      color: "var(--text-main)",
                    }}
                    placeholder="Ej: Barbero"
                  />
                </div>

                <div>
                  <label
                    className="mb-2 block text-sm font-medium"
                    style={{ color: "var(--text-main)" }}
                  >
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
                    className={inputClass}
                    style={{
                      borderColor: "var(--border-color)",
                      background: "var(--bg-card)",
                      color: "var(--text-main)",
                    }}
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label
                    className="mb-2 block text-sm font-medium"
                    style={{ color: "var(--text-main)" }}
                  >
                    Correo
                  </label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, email: e.target.value }))
                    }
                    className={inputClass}
                    style={{
                      borderColor: "var(--border-color)",
                      background: "var(--bg-card)",
                      color: "var(--text-main)",
                    }}
                    placeholder="Ej: eduardo@negocio.cl"
                  />
                </div>

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
                    className={inputClass}
                    style={{
                      borderColor: "var(--border-color)",
                      background: "var(--bg-card)",
                      color: "var(--text-main)",
                    }}
                    placeholder="Ej: +56 9 1234 5678"
                  />
                </div>
              </div>

              <div
                className="w-full max-w-3xl rounded-2xl border p-4"
                style={{
                  borderColor: "var(--border-color)",
                  background: "var(--bg-card)",
                }}
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold" style={{ color: "var(--text-main)" }}>
                      Estado del staff
                    </p>
                    <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
                      Define si este profesional aparece disponible para operar.
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span
                      className="text-sm font-medium"
                      style={{
                        color: form.is_active
                          ? "rgb(16 185 129)"
                          : "var(--text-muted)",
                      }}
                    >
                      {form.is_active ? "Activo" : "Inactivo"}
                    </span>
                    <button
                      type="button"
                      aria-pressed={form.is_active}
                      aria-label="Cambiar estado del staff"
                      onClick={() =>
                        setForm((prev) => ({
                          ...prev,
                          is_active: !prev.is_active,
                        }))
                      }
                      className="inline-flex h-8 w-14 shrink-0 items-center rounded-full border p-1 transition"
                      style={{
                        borderColor: form.is_active
                          ? "rgba(124,58,237,0.34)"
                          : "rgba(148,163,184,0.34)",
                        background: form.is_active
                          ? "linear-gradient(135deg, rgb(124 58 237), rgb(99 102 241))"
                          : "rgba(148,163,184,0.18)",
                      }}
                    >
                      <span
                        className={`h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${
                          form.is_active ? "translate-x-6" : "translate-x-0"
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </div>


              <div
  className="rounded-2xl border p-4"
                style={{
                  borderColor: "var(--border-color)",
                  background: "var(--bg-card)",
                }}
              >
                <div className="mb-4">
                  <p
                    className="text-sm font-semibold"
                    style={{ color: "var(--text-main)" }}
                  >
                    Servicios que atiende
                  </p>
                  <p
                    className="mt-1 text-sm"
                    style={{ color: "var(--text-muted)" }}
                  >
                    Selecciona qué servicios puede realizar este profesional.
                  </p>
                </div>

                {services.length === 0 ? (
                  <div
                    className="rounded-2xl border border-dashed px-4 py-6 text-sm"
                    style={{
                      borderColor: "var(--border-color)",
                      background: "var(--bg-soft)",
                      color: "var(--text-muted)",
                    }}
                  >
                    No hay servicios activos disponibles para asignar.
                  </div>
                ) : (
                  <div className="grid gap-3 md:grid-cols-2">
                    {services.map((service) => {
                      const checked = selectedServiceIds.includes(service.id);

                      return (
                        <label
                          key={service.id}
                          className={`orbyx-staff-energy flex cursor-pointer items-start gap-3 rounded-2xl border px-4 py-3 transition ${
                            checked ? "orbyx-staff-energy-active" : ""
                          }`}
                          style={{
                            borderColor: checked
                              ? "rgba(37,99,235,0.45)"
                              : "var(--border-color)",
                            background: checked
                              ? "linear-gradient(135deg, rgba(37,99,235,0.10), var(--bg-soft))"
                              : "var(--bg-card)",
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleService(service.id)}
                            className="mt-0.5 h-4 w-4 rounded"
                          />

                          <div className="min-w-0 flex-1">
                            <p
                              className="text-sm font-medium"
                              style={{ color: "var(--text-main)" }}
                            >
                              {service.name}
                            </p>
                            <p
                              className="mt-1 text-xs"
                              style={{ color: "var(--text-muted)" }}
                            >
                              Duración: {service.duration_minutes ?? 0} min
                              {service.price != null
                                ? ` · $${Number(service.price).toLocaleString(
                                    "es-CL"
                                  )}`
                                : ""}
                            </p>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>
                </>
              ) : null}

              {activeFormSection === "horarios" ? (
                <>
              <div
                className="rounded-2xl border p-4"
                style={{
                  borderColor: "var(--border-color)",
                  background:
                    "linear-gradient(135deg, rgba(37,99,235,0.06), var(--bg-soft))",
                }}
              >
                <div>
                  <style>{`
                    .orbyx-staff-schedule-option {
                      cursor: pointer;
                    }
                  `}</style>
                  <p className="text-sm font-semibold" style={{ color: "var(--text-main)" }}>
                    Horarios
                  </p>
                  <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
                    Define si este profesional hereda la disponibilidad general o tendrá un horario propio.
                  </p>
                </div>

                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  {[
                    {
                      value: true,
                      title: "Usar horario del negocio",
                      description: "Este staff heredará los horarios generales del negocio.",
                    },
                    {
                      value: false,
                      title: "Usar horario propio del staff",
                      description: "Define una disponibilidad personalizada para este profesional.",
                    },
                  ].map((option) => {
                    const selected = form.use_business_hours === option.value;

                    return (
                      <button
                        key={option.title}
                        type="button"
                        onClick={() =>
                          setForm((prev) => ({
                            ...prev,
                            use_business_hours: option.value,
                          }))
                        }
                        className={`orbyx-staff-energy orbyx-staff-schedule-option rounded-2xl border p-4 text-left ${
                          selected ? "orbyx-staff-energy-active" : ""
                        }`}
                        style={{
                          borderColor: selected
                            ? "rgba(37,99,235,0.58)"
                            : "var(--border-color)",
                          background: selected
                            ? "linear-gradient(135deg, rgba(37,99,235,0.16), var(--bg-card))"
                            : "var(--bg-card)",
                          color: "var(--text-main)",
                          boxShadow: selected
                            ? "0 0 0 1px rgba(147,197,253,0.18), 0 16px 32px -24px rgba(37,99,235,0.9)"
                            : "none",
                        }}
                      >
                        <span className="text-sm font-semibold">{option.title}</span>
                        <span className="mt-1 block text-xs leading-5" style={{ color: "var(--text-muted)" }}>
                          {option.description}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>




{form.use_business_hours ? (
  <Notice
    tone="info"
    title="Este staff usará el horario general del negocio."
    description="El editor de horarios propios queda oculto para evitar configuraciones duplicadas."
  />
) : (
  <div
    className="rounded-2xl border p-4"
    style={{
      borderColor: "var(--border-color)",
      background: "var(--bg-card)",
    }}
  >
    <div className="mb-4">
      <p className="text-sm font-semibold" style={{ color: "var(--text-main)" }}>
        Horario propio del staff
      </p>
      <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
        Configura el horario semanal propio de este profesional.
      </p>
    </div>

    <div className="space-y-3">
      {staffScheduleDays.map((day) => {
        const dayBlocks = staffHours
          .filter((item) => item.day_of_week === day.value)
          .sort((a, b) => a.block_order - b.block_order);
        const enabled = dayBlocks.some((block) => block.enabled);
        const dayError = getStaffHourDayError(day.value);

        return (
          <div
            key={day.value}
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
                  {day.label}
                </p>
                <p
                  className="mt-0.5 text-xs"
                  style={{ color: "var(--text-muted)" }}
                >
                  {enabled
                    ? `${dayBlocks.filter((block) => block.enabled).length} bloque${
                        dayBlocks.filter((block) => block.enabled).length === 1 ? "" : "s"
                      }`
                    : "Cerrado"}
                </p>
              </div>

              <label
                className={`orbyx-staff-energy inline-flex h-9 items-center gap-2 rounded-xl border px-3 text-xs font-medium ${
                  enabled ? "orbyx-staff-energy-active" : ""
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
                    const nextEnabled = e.target.checked;
                    setStaffHours((prev) =>
                      prev.map((item) =>
                        item.day_of_week === day.value
                          ? { ...item, enabled: nextEnabled }
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
                dayBlocks
                  .filter((block) => block.enabled)
                  .map((block) => (
                    <div
                      key={block.block_order}
                      className="flex w-fit max-w-full flex-wrap items-center gap-2 rounded-2xl border px-2 py-2"
                      style={{
                        borderColor: "var(--border-color)",
                        background: "var(--bg-soft)",
                      }}
                    >
                      <input
                        type="text"
                        inputMode="numeric"
                        placeholder="HH:mm"
                        value={normalizeTimeValue(block.start_time) || "09:00"}
                        onChange={(e) =>
                          updateHour(
                            day.value,
                            block.block_order,
                            "start_time",
                            e.target.value
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
                        inputMode="numeric"
                        placeholder="HH:mm"
                        value={normalizeTimeValue(block.end_time) || "18:00"}
                        onChange={(e) =>
                          updateHour(
                            day.value,
                            block.block_order,
                            "end_time",
                            e.target.value
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
                          setStaffHours((prev) =>
                            prev.filter(
                              (item) =>
                                !(
                                  item.day_of_week === day.value &&
                                  item.block_order === block.block_order
                                )
                            )
                          );
                        }}
                        className="orbyx-staff-energy inline-flex h-8 w-8 items-center justify-center rounded-lg border border-rose-300/50 bg-rose-500/10 p-0 text-sm font-semibold leading-none text-rose-400 transition hover:border-rose-300/70 hover:bg-rose-500/15 hover:shadow-[0_0_18px_rgba(244,63,94,0.16)]"
                        aria-label={`Eliminar bloque de ${day.label}`}
                      >
                        x
                      </button>
                    </div>
                  ))
              )}

              <button
                type="button"
                onClick={() => {
                  setStaffHours((prev) => {
                    const blocks = prev.filter((item) => item.day_of_week === day.value);
                    const nextOrder =
                      blocks.length > 0
                        ? Math.max(...blocks.map((b) => b.block_order)) + 1
                        : 1;

                    return [
                      ...prev,
                      {
                        day_of_week: day.value,
                        block_order: nextOrder,
                        enabled: true,
                        start_time: "09:00",
                        end_time: "13:00",
                      },
                    ];
                  });
                }}
                className="orbyx-staff-energy inline-flex h-8 w-fit items-center justify-center rounded-xl border px-3 text-xs font-medium text-blue-500 transition"
                style={{
                  borderColor: "rgba(37,99,235,0.24)",
                  background: "rgba(37,99,235,0.06)",
                }}
              >
                + Agregar bloque
              </button>

              {dayError ? (
                <p className="text-xs font-semibold text-rose-500">
                  {dayError}
                </p>
              ) : null}
            </div>
          </div>
        );
      })}
    </div>

    {!editingId ? (
      <div className="mt-4">
        <Notice
          tone="warning"
          title="Puedes dejar estos horarios listos ahora."
          description="Al crear el staff, se guardarán automáticamente."
        />
      </div>
    ) : null}
  </div>
)}



              <div
                className="rounded-2xl border p-4"
                style={{
                  borderColor: "var(--border-color)",
                  background: "var(--bg-card)",
                }}
              >
                <div className="mb-4">
                  <p
                    className="text-sm font-semibold"
                    style={{ color: "var(--text-main)" }}
                  >
                    Días/horarios excepcionales del staff
                  </p>
                  <p
                    className="mt-1 text-sm"
                    style={{ color: "var(--text-muted)" }}
                  >
                    Configura días libres o horarios especiales para este
                    profesional.
                  </p>
                </div>

                {!editingId ? (
                  <Notice
                    tone="warning"
                    title="Primero crea o guarda el staff."
                    description="Después podrás administrar sus días/horarios excepcionales."
                  />
                ) : (
                  <div className="space-y-4">
                    {!specialDateFormOpen ? (
                      <div className="space-y-2">
                        <button
                          type="button"
                          onClick={openSpecialDateForm}
                          className={specialPrimaryButtonClass}
                          style={{
                            background:
                              "linear-gradient(135deg, rgb(37 99 235), rgb(14 165 233))",
                          }}
                        >
                          Agregar fecha especial
                        </button>
                        <p
                          className="text-xs"
                          style={{ color: "var(--text-muted)" }}
                        >
                          Agrega una fecha o rango que quieras bloquear o ajustar para desactivar bloques de agenda.
                        </p>
                      </div>
                    ) : null}

                    {specialDateFormOpen ? (
                    <div
                      className="rounded-2xl border p-3"
                      style={{
                        borderColor: "var(--border-color)",
                        background: "var(--bg-soft)",
                      }}
                    >
                      <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-[150px_180px_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1.1fr)] xl:items-end">
                        {!editingSpecialDateId ? (
                          <div className="space-y-1">
                            <label
                              className="block text-[10px] font-semibold uppercase tracking-wide"
                              style={{ color: "var(--text-muted)" }}
                            >
                              Tipo de fecha
                            </label>
                            <select
                              value={specialRangeForm.enabled ? "range" : "single"}
                              onChange={(e) =>
                                setSpecialRangeForm((prev) => ({
                                  ...prev,
                                  enabled: e.target.value === "range",
                                }))
                              }
                              className={specialInputClass}
                              style={{
                                borderColor: "var(--border-color)",
                                background: "var(--bg-card)",
                                color: "var(--text-main)",
                              }}
                            >
                              <option value="single">Un día</option>
                              <option value="range">Rango de fechas</option>
                            </select>
                          </div>
                        ) : null}

                        <div className="space-y-1">
                          <label
                            className="block text-[10px] font-semibold uppercase tracking-wide"
                            style={{ color: "var(--text-muted)" }}
                          >
                            Motivo
                          </label>
                          <select
                            value={specialRangeForm.type}
                            onChange={(e) =>
                              setSpecialRangeForm((prev) => ({
                                ...prev,
                                type: e.target.value as SpecialRangeForm["type"],
                              }))
                            }
                            className={specialInputClass}
                            style={{
                              borderColor: "var(--border-color)",
                              background: "var(--bg-card)",
                              color: "var(--text-main)",
                            }}
                          >
                            <option value="Vacaciones">Vacaciones</option>
                            <option value="Permiso">Permiso</option>
                            <option value="Licencia médica">Licencia médica</option>
                            <option value="Capacitación">Capacitación</option>
                            <option value="Reunión interna">Reunión interna</option>
                            <option value="Turno administrativo">Turno administrativo</option>
                            <option value="Bloqueo operacional">Bloqueo operacional</option>
                            <option value="Día libre">Día libre</option>
                            <option value="Feriado">Feriado</option>
                            <option value="Otro">Otro</option>
                          </select>
                        </div>

                        {specialRangeForm.enabled && !editingSpecialDateId ? (
                          <>
                            <div className="space-y-1">
                              <label
                                className="block text-[10px] font-semibold uppercase tracking-wide"
                                style={{ color: "var(--text-muted)" }}
                              >
                                Desde
                              </label>
                              <div className="relative">
                                <input
                                  type="text"
                                  inputMode="numeric"
                                  placeholder="dd-mm-yyyy"
                                  value={specialRangeDateFromDisplay}
                                  aria-invalid={
                                    Boolean(specialRangeDateFromDisplay) &&
                                    !isValidDisplayDate(specialRangeDateFromDisplay)
                                  }
                                  onChange={(e) => {
                                    const value = e.target.value;
                                    setSpecialRangeDateFromDisplay(value);
                                    setSpecialRangeForm((prev) => ({
                                      ...prev,
                                      date_from: isValidDisplayDate(value)
                                        ? parseDateDisplay(value)
                                        : "",
                                    }));
                                  }}
                                  className={`${specialInputClass} pr-10`}
                                  style={{
                                    borderColor:
                                      specialRangeDateFromDisplay &&
                                      !isValidDisplayDate(specialRangeDateFromDisplay)
                                        ? "rgba(244,63,94,0.62)"
                                        : "var(--border-color)",
                                    background: "var(--bg-card)",
                                    color: "var(--text-main)",
                                  }}
                                />
                                <span
                                  className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs"
                                  style={{ color: "var(--text-muted)" }}
                                  aria-hidden="true"
                                >
                                  ▦
                                </span>
                                <input
                                  type="date"
                                  value={specialRangeForm.date_from || ""}
                                  onChange={(e) => {
                                    const value = e.target.value;
                                    setSpecialRangeForm((prev) => ({
                                      ...prev,
                                      date_from: value,
                                    }));
                                    setSpecialRangeDateFromDisplay(
                                      formatDateDisplay(value)
                                    );
                                  }}
                                  className={calendarPickerClass}
                                  aria-label="Seleccionar fecha desde"
                                />
                              </div>
                            </div>

                            <div className="space-y-1">
                              <label
                                className="block text-[10px] font-semibold uppercase tracking-wide"
                                style={{ color: "var(--text-muted)" }}
                              >
                                Hasta
                              </label>
                              <div className="relative">
                                <input
                                  type="text"
                                  inputMode="numeric"
                                  placeholder="dd-mm-yyyy"
                                  value={specialRangeDateToDisplay}
                                  aria-invalid={
                                    Boolean(specialRangeDateToDisplay) &&
                                    !isValidDisplayDate(specialRangeDateToDisplay)
                                  }
                                  onChange={(e) => {
                                    const value = e.target.value;
                                    setSpecialRangeDateToDisplay(value);
                                    setSpecialRangeForm((prev) => ({
                                      ...prev,
                                      date_to: isValidDisplayDate(value)
                                        ? parseDateDisplay(value)
                                        : "",
                                    }));
                                  }}
                                  className={`${specialInputClass} pr-10`}
                                  style={{
                                    borderColor:
                                      specialRangeDateToDisplay &&
                                      !isValidDisplayDate(specialRangeDateToDisplay)
                                        ? "rgba(244,63,94,0.62)"
                                        : "var(--border-color)",
                                    background: "var(--bg-card)",
                                    color: "var(--text-main)",
                                  }}
                                />
                                <span
                                  className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs"
                                  style={{ color: "var(--text-muted)" }}
                                  aria-hidden="true"
                                >
                                  ▦
                                </span>
                                <input
                                  type="date"
                                  value={specialRangeForm.date_to || ""}
                                  onChange={(e) => {
                                    const value = e.target.value;
                                    setSpecialRangeForm((prev) => ({
                                      ...prev,
                                      date_to: value,
                                    }));
                                    setSpecialRangeDateToDisplay(
                                      formatDateDisplay(value)
                                    );
                                  }}
                                  className={calendarPickerClass}
                                  aria-label="Seleccionar fecha hasta"
                                />
                              </div>
                            </div>
                          </>
                        ) : (
                          <div className="space-y-1">
                            <label
                              className="block text-[10px] font-semibold uppercase tracking-wide"
                              style={{ color: "var(--text-muted)" }}
                            >
                              Fecha
                            </label>
                            <div className="relative">
                              <input
                                type="text"
                                inputMode="numeric"
                                placeholder="dd-mm-yyyy"
                                value={specialDateDisplay}
                                aria-invalid={
                                  Boolean(specialDateDisplay) &&
                                  !isValidDisplayDate(specialDateDisplay)
                                }
                                onChange={(e) => {
                                  const value = e.target.value;
                                  setSpecialDateDisplay(value);
                                  setSpecialDateForm((prev) => ({
                                    ...prev,
                                    date: isValidDisplayDate(value)
                                      ? parseDateDisplay(value)
                                      : "",
                                  }));
                                }}
                                className={`${specialInputClass} pr-10`}
                                style={{
                                  borderColor:
                                    specialDateDisplay &&
                                    !isValidDisplayDate(specialDateDisplay)
                                      ? "rgba(244,63,94,0.62)"
                                      : "var(--border-color)",
                                  background: "var(--bg-card)",
                                  color: "var(--text-main)",
                                }}
                              />
                              <span
                                className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs"
                                style={{ color: "var(--text-muted)" }}
                                aria-hidden="true"
                              >
                                ▦
                              </span>
                              <input
                                type="date"
                                value={specialDateForm.date || ""}
                                onChange={(e) => {
                                  const value = e.target.value;
                                  setSpecialDateForm((prev) => ({
                                    ...prev,
                                    date: value,
                                  }));
                                  setSpecialDateDisplay(formatDateDisplay(value));
                                }}
                                className={calendarPickerClass}
                                aria-label="Seleccionar fecha"
                              />
                            </div>
                          </div>
                        )}

                        <div className="space-y-1">
                          <label
                            className="block text-[10px] font-semibold uppercase tracking-wide"
                            style={{ color: "var(--text-muted)" }}
                          >
                            Etiqueta
                          </label>
                          <input
                            type="text"
                            value={specialDateForm.label || ""}
                            onChange={(e) =>
                              setSpecialDateForm((prev) => ({
                                ...prev,
                                label: e.target.value,
                              }))
                            }
                            placeholder="Etiqueta opcional"
                            className={specialInputClass}
                            style={{
                              borderColor: "var(--border-color)",
                              background: "var(--bg-card)",
                              color: "var(--text-main)",
                            }}
                          />
                        </div>

                      </div>

                      {getStaffSpecialDateDisplayError() ? (
                        <p className="mt-2 text-xs font-semibold text-rose-500">
                          {getStaffSpecialDateDisplayError()}
                        </p>
                      ) : null}

                      <div className="mt-3 grid gap-2 md:grid-cols-2 lg:grid-cols-[170px_130px_130px_auto_auto] lg:items-end">
                        <div className="space-y-1">
                          <label
                            className="block text-[10px] font-semibold uppercase tracking-wide"
                            style={{ color: "var(--text-muted)" }}
                          >
                            Tipo de cobertura
                          </label>
                          <select
                            value={specialDateForm.is_closed ? "all_day" : "time_range"}
                            onChange={(e) =>
                              setSpecialDateForm((prev) => ({
                                ...prev,
                                is_closed: e.target.value === "all_day",
                              }))
                            }
                            className={specialInputClass}
                            style={{
                              borderColor: "var(--border-color)",
                              background: "var(--bg-card)",
                              color: "var(--text-main)",
                            }}
                          >
                            <option value="all_day">Todo el día</option>
                            <option value="time_range">Rango de horario</option>
                          </select>
                        </div>

                        {!specialDateForm.is_closed ? (
                          <>
                            <div className="space-y-1">
                              <label
                                className="block text-[10px] font-semibold uppercase tracking-wide"
                                style={{ color: "var(--text-muted)" }}
                              >
                                Desde
                              </label>
                              <input
                                type="text"
                                inputMode="numeric"
                                placeholder="HH:mm"
                                value={normalizeTimeValue(specialDateForm.start_time) || "09:00"}
                                aria-invalid={!isValidHHmm(specialDateForm.start_time)}
                                onChange={(e) =>
                                  setSpecialDateForm((prev) => ({
                                    ...prev,
                                    start_time: e.target.value,
                                  }))
                                }
                                className={specialInputClass}
                                style={{
                                  borderColor: !isValidHHmm(specialDateForm.start_time)
                                    ? "rgba(244,63,94,0.62)"
                                    : "var(--border-color)",
                                  background: "var(--bg-card)",
                                  color: "var(--text-main)",
                                }}
                              />
                            </div>

                            <div className="space-y-1">
                              <label
                                className="block text-[10px] font-semibold uppercase tracking-wide"
                                style={{ color: "var(--text-muted)" }}
                              >
                                Hasta
                              </label>
                              <input
                                type="text"
                                inputMode="numeric"
                                placeholder="HH:mm"
                                value={normalizeTimeValue(specialDateForm.end_time) || "18:00"}
                                aria-invalid={!isValidHHmm(specialDateForm.end_time)}
                                onChange={(e) =>
                                  setSpecialDateForm((prev) => ({
                                    ...prev,
                                    end_time: e.target.value,
                                  }))
                                }
                                className={specialInputClass}
                                style={{
                                  borderColor: !isValidHHmm(specialDateForm.end_time)
                                    ? "rgba(244,63,94,0.62)"
                                    : "var(--border-color)",
                                  background: "var(--bg-card)",
                                  color: "var(--text-main)",
                                }}
                              />
                            </div>
                          </>
                        ) : null}

                        <div
                          className={`flex items-end lg:justify-end ${
                            specialDateForm.is_closed ? "lg:col-start-4" : ""
                          }`}
                        >
                          <button
                            type="button"
                            onClick={handleSaveSpecialDate}
                            disabled={
                              specialDateSaving ||
                              Boolean(getStaffSpecialDateDisplayError()) ||
                              Boolean(getStaffSpecialDateTimeError())
                            }
                            className={specialPrimaryButtonClass}
                            style={{
                              background:
                                "linear-gradient(135deg, rgb(37 99 235), rgb(14 165 233))",
                            }}
                          >
                            {specialDateSaving
                              ? editingSpecialDateId
                                ? "Guardando..."
                                : "Agregando..."
                              : editingSpecialDateId
                              ? "Guardar"
                              : "Agregar"}
                          </button>
                        </div>

                        <div className="flex items-end lg:justify-start">
                          <button
                            type="button"
                            onClick={resetSpecialDateForm}
                            disabled={specialDateSaving}
                            className={specialSecondaryButtonClass}
                            style={{
                              borderColor: "var(--border-color)",
                              background: "var(--bg-card)",
                              color: "var(--text-main)",
                            }}
                          >
                            Cancelar
                          </button>
                        </div>
                      </div>

                      {!specialDateForm.is_closed ? (
                        getStaffSpecialDateTimeError() ? (
                          <p className="mt-2 text-xs font-semibold text-rose-500">
                            {getStaffSpecialDateTimeError()}
                          </p>
                        ) : (
                          <p
                            className="mt-2 text-xs font-medium"
                            style={{ color: "var(--text-muted)" }}
                          >
                            Formato 24 hrs. Ejemplo: 09:30
                          </p>
                        )
                      ) : null}
                    </div>
                    ) : null}

                    {specialDateError ? (
                      <p className="text-xs font-semibold text-rose-500">
                        {specialDateError}
                      </p>
                    ) : null}

                    {editingSpecialDateId ? (
                      <Notice
                        tone="warning"
                        title="Estás editando una excepción existente."
                        description="Guarda los cambios o presiona cancelar."
                      />
                    ) : null}

                    <div
                      className="space-y-3 rounded-2xl border p-4"
                      style={{
                        borderColor: "var(--border-color)",
                        background: "var(--bg-card)",
                      }}
                    >
                      <div>
                        <h4
                          className="text-sm font-semibold"
                          style={{ color: "var(--text-main)" }}
                        >
                          Historial de excepciones
                        </h4>
                        <p
                          className="mt-1 text-xs"
                          style={{ color: "var(--text-muted)" }}
                        >
                          Días libres u horarios especiales configurados para este profesional.
                        </p>
                      </div>

                      {groupedStaffSpecialDates.length === 0 ? (
                        <div
                          className="rounded-2xl border border-dashed px-4 py-6 text-sm"
                          style={{
                            borderColor: "var(--border-color)",
                            background: "var(--bg-soft)",
                            color: "var(--text-muted)",
                          }}
                        >
                          Este staff aún no tiene excepciones configuradas.
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {groupedStaffSpecialDates.map((group) => {
                            const item = group.first;
                            const dateLabel = group.isRange
                              ? `${formatDateDisplay(group.startDate)} al ${formatDateDisplay(group.endDate)}`
                              : formatDateDisplay(group.startDate);
                            const timeLabel = item.is_closed
                              ? "Cerrado todo el día"
                              : `${normalizeTimeValue(item.start_time) || "--:--"} a ${
                                  normalizeTimeValue(item.end_time) || "--:--"
                                }`;

                            return (
                            <div
                              key={`${group.key}-${group.startDate}-${group.endDate}`}
                              className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border p-3"
                              style={{
                                borderColor: "var(--border-color)",
                                background:
                                  "linear-gradient(135deg, rgba(37,99,235,0.06), var(--bg-soft))",
                              }}
                            >
                              <div className="min-w-0 flex-1">
                                <p
                                  className="text-sm font-medium"
                                  style={{ color: "var(--text-main)" }}
                                >
                                  {dateLabel}
                                </p>
                                <p
                                  className="mt-1 text-sm"
                                  style={{ color: "var(--text-muted)" }}
                                >
                                  {item.label || "Sin etiqueta"} · {timeLabel}
                                </p>
                                {group.isRange ? (
                                  <p
                                    className="mt-1 text-xs"
                                    style={{ color: "var(--text-muted)" }}
                                  >
                                    Editar abre la primera fecha del rango.
                                  </p>
                                ) : null}
                              </div>

                              <div className="flex flex-wrap gap-2">
                                <button
                                  type="button"
                                  onClick={() => handleEditSpecialDate(item)}
                                  className={secondaryButtonClass}
                                  style={{
                                    borderColor: "var(--border-color)",
                                    background: "var(--bg-card)",
                                    color: "var(--text-main)",
                                  }}
                                >
                                  Editar
                                </button>

                                <button
                                  type="button"
                                  onClick={() =>
                                    handleDeleteSpecialDateGroup(group)
                                  }
                                  className="orbyx-staff-energy inline-flex h-11 items-center justify-center rounded-2xl border border-rose-300/60 bg-rose-500/10 px-5 text-sm font-medium text-rose-300 transition hover:bg-rose-500/15"
                                >
                                  Eliminar
                                </button>
                              </div>
                            </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
                </>
              ) : null}

              {saveError ? (
                <Notice tone="danger" title={saveError} />
              ) : null}

              {saveOk ? (
                <Notice tone="success" title={saveOk} />
              ) : null}

              <div className="space-y-3 pt-2">
                {!editingId && reachedLimit ? (
  <Notice
    tone="limit"
    title="Has alcanzado el límite de staff de tu plan."
    description={`Tu plan ${plan} permite ${caps.max_staff} profesional${
      caps.max_staff === 1 ? "" : "es"
    } activos. Para crear otro, debes mejorar el plan o desactivar uno existente.`}
  >
    <div className="mt-1">
      <a
        href={`/planes?current_plan=${plan}&tenant_id=${tenantId}&slug=${slug}&from=staff`}
        className="orbyx-staff-energy inline-flex h-11 items-center justify-center rounded-xl border px-4 text-sm font-semibold text-white transition"
        style={{
          background:
            "linear-gradient(135deg, rgb(249 115 22), rgb(251 146 60))",
        }}
      >
        Mejorar plan
      </a>
    </div>
  </Notice>
) : null}

                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={handleSave}
                    disabled={saving || (!editingId && (reachedLimit || hasExcess))}
                    className={primaryButtonClass}
                    style={{
                      background:
                        "linear-gradient(135deg, rgb(37 99 235), rgb(14 165 233))",
                    }}
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
                    className={secondaryButtonClass}
                    style={{
                      borderColor: "var(--border-color)",
                      background: "var(--bg-soft)",
                      color: "var(--text-main)",
                    }}
                  >
                    Limpiar
                  </button>
                </div>
              </div>
            </div>
          )}
        </Panel>
        ) : null}

        {!(formOpen || editingId) ? (
        <Panel
          className="order-1 bg-[linear-gradient(180deg,rgba(14,165,233,0.06),transparent_40%)]"
        >
          <div
            className="mb-6 flex flex-col gap-4 border-b pb-5 sm:flex-row sm:items-center sm:justify-between"
            style={{ borderColor: "var(--border-color)" }}
          >
            <div>
              <h3
                className="text-lg font-semibold tracking-tight"
                style={{ color: "var(--text-main)" }}
              >
                Equipo actual
              </h3>
              <p
                className="mt-1 text-sm leading-6"
                style={{ color: "var(--text-muted)" }}
              >
                Visualiza, edita o elimina integrantes del staff.
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                resetForm();
                setFormOpen(true);
              }}
              disabled={!selectedBranchId || loading || (!editingId && (reachedLimit || hasExcess))}
              className={primaryButtonClass}
              style={{
                background:
                  "linear-gradient(135deg, rgb(37 99 235), rgb(14 165 233))",
              }}
            >
              Crear nuevo staff
            </button>
          </div>

          {!selectedBranchId ? (
            <div
              className="rounded-2xl border border-dashed px-4 py-8 text-sm"
              style={{
                borderColor: "var(--border-color)",
                background: "var(--bg-soft)",
                color: "var(--text-muted)",
              }}
            >
              Selecciona una sucursal activa en el sidebar para ver el staff.
            </div>
          ) : loading ? (
            <div
              className="rounded-2xl border border-dashed px-4 py-8 text-sm"
              style={{
                borderColor: "var(--border-color)",
                background: "var(--bg-soft)",
                color: "var(--text-muted)",
              }}
            >
              Cargando staff...
            </div>
          ) : staff.length === 0 ? (
            <div
              className="rounded-2xl border border-dashed px-4 py-8 text-sm"
              style={{
                borderColor: "var(--border-color)",
                background: "var(--bg-soft)",
                color: "var(--text-muted)",
              }}
            >
              Aún no has creado staff.
            </div>
                    ) : (
            <div className="grid min-w-0 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
              {staff.map((item, index) => {
                const isSelected = editingId === item.id;
                const calendarConnection = activeGoogleConnectionsByStaff.get(
                  item.id
                );
                const opensPreviewLeft = index % 3 === 2 || index % 4 === 3;
                const initials = String(item.name || "?")
                  .trim()
                  .split(/\s+/)
                  .slice(0, 2)
                  .map((part) => part.charAt(0).toUpperCase())
                  .join("");

                return (
                  <div
                    key={item.id}
                    className="relative flex min-h-[360px] min-w-0 flex-col gap-4 overflow-visible rounded-3xl border p-4 text-center transition hover:z-30 hover:border-blue-400/40"
                    style={{
                      borderColor: isSelected
                        ? "rgba(37,99,235,0.45)"
                        : "var(--border-color)",
                      background: isSelected
                        ? "rgba(37,99,235,0.08)"
                        : "var(--bg-card)",
                    }}
                  >
                    <div className="flex items-center justify-start">
                      <span
                        className="rounded-full px-2.5 py-1 text-[11px] font-semibold"
                        style={{
                          background: item.is_active
                            ? "rgba(16,185,129,0.14)"
                            : "rgba(148,163,184,0.16)",
                          color: item.is_active
                            ? "rgb(16 185 129)"
                            : "var(--text-muted)",
                        }}
                      >
                        {item.is_active ? "Activo" : "Inactivo"}
                      </span>
                    </div>

                    <div className="flex min-w-0 flex-col gap-3">


<div className="group relative">
  {/* FOTO PEQUEÑA */}
  <div className="mx-auto h-24 w-24 overflow-hidden rounded-full border bg-slate-200 shadow-sm">
    {item.photo_url ? (
      <img
        src={item.photo_url}
        className="h-full w-full object-cover"
      />
    ) : (
      <div className="flex h-full w-full items-center justify-center text-xl font-semibold text-slate-500">
        👤
      </div>
    )}
  </div>

  {/* HOVER CARD */}
  <div
    className={`pointer-events-none absolute top-full z-[9999] mt-4 hidden opacity-0 transition-all duration-200 lg:block lg:group-hover:opacity-100 ${
      opensPreviewLeft ? "right-0" : "left-0"
    }`}
  >
    <div
      className="w-[min(360px,calc(100vw-2rem))] overflow-hidden rounded-3xl border shadow-2xl"
      style={{
        borderColor: "var(--border-color)",
        background: "var(--bg-card)",
      }}
    >
      <div className="flex flex-col items-center gap-3">
        <div className="h-[280px] overflow-hidden bg-slate-200">
          {item.photo_url ? (
            <img
              src={item.photo_url}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-4xl font-semibold text-slate-400">
              👤
            </div>
          )}
        </div>

        <p
          className="text-base font-semibold text-center"
          style={{ color: "var(--text-main)" }}
        >
          {item.name}
        </p>

       </div>
    </div>
  </div>
</div>

                      <div className="min-w-0">
                        <p
                          className="truncate text-base font-semibold"
                          style={{ color: "var(--text-main)" }}
                        >
                          {item.name}
                        </p>

                        <p
                          className="truncate text-xs"
                          style={{ color: "var(--text-muted)" }}
                        >
                          {item.role || "Sin rol"}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      <span
                        className="hidden rounded-full px-2 py-0.5 text-[10px] font-semibold"
                        style={{
                          background: item.is_active
                            ? "rgba(16,185,129,0.14)"
                            : "rgba(148,163,184,0.16)",
                          color: item.is_active
                            ? "rgb(16 185 129)"
                            : "var(--text-muted)",
                        }}
                      >
                        {item.is_active ? "Activo" : "Inactivo"}
                      </span>

                      <button
                        type="button"
                        onClick={() => startEdit(item)}
                        className="orbyx-staff-energy inline-flex h-9 items-center justify-center rounded-xl border px-3 text-xs font-medium transition disabled:cursor-not-allowed disabled:opacity-60"
                        style={{
                          borderColor: "var(--border-color)",
                          background: "var(--bg-card)",
                          color: "var(--text-main)",
                        }}
                      >
                        Editar
                      </button>

                      <button
                        type="button"
                        onClick={() => handleToggleStaffActive(item)}
                        className="orbyx-staff-energy inline-flex h-9 items-center justify-center rounded-xl border px-3 text-xs font-medium transition disabled:cursor-not-allowed disabled:opacity-60"
                        style={{
                          borderColor: item.is_active
                            ? "rgba(245,158,11,0.34)"
                            : "rgba(16,185,129,0.34)",
                          background: item.is_active
                            ? "rgba(245,158,11,0.10)"
                            : "rgba(16,185,129,0.10)",
                          color: item.is_active ? "rgb(245 158 11)" : "rgb(16 185 129)",
                        }}
                      >
                        {item.is_active ? "Desactivar" : "Activar"}
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDelete(item.id)}
                        className="orbyx-staff-energy inline-flex h-9 items-center justify-center rounded-xl border border-rose-300/60 bg-rose-500/10 px-3 text-xs font-medium text-rose-300 transition hover:bg-rose-500/15"
                      >
                        Eliminar
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => setCalendarModalStaff(item)}
                      className={`orbyx-staff-energy flex w-full items-center justify-between gap-3 rounded-2xl border px-3 py-3 text-left transition ${
                        calendarConnection ? "orbyx-staff-energy-active" : ""
                      }`}
                      style={{
                        borderColor: calendarConnection
                          ? "rgba(16,185,129,0.34)"
                          : "rgba(244,63,94,0.34)",
                        background: calendarConnection
                          ? "rgba(16,185,129,0.10)"
                          : "linear-gradient(135deg, rgba(244,63,94,0.14), rgba(244,63,94,0.05))",
                        boxShadow: calendarConnection
                          ? "0 18px 40px -32px rgba(16,185,129,0.8)"
                          : "0 18px 40px -30px rgba(244,63,94,0.85)",
                      }}
                    >
                      <span className="flex min-w-0 items-center gap-3">
                        <span
                          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl"
                          style={{
                            background: calendarConnection
                              ? "rgba(16,185,129,0.16)"
                              : "rgba(244,63,94,0.16)",
                            color: calendarConnection
                              ? "rgb(16 185 129)"
                              : "rgb(244 63 94)",
                          }}
                        >
                          📅
                        </span>
                        <span className="min-w-0">
                          <span
                            className="block text-sm font-semibold"
                            style={{ color: "var(--text-main)" }}
                          >
                            {calendarConnection
                              ? "Calendario conectado"
                              : "Conectar calendario"}
                          </span>
                          <span
                            className="mt-0.5 block truncate text-xs"
                            style={{ color: "var(--text-muted)" }}
                          >
                            {calendarConnection
                              ? `Google Calendar${
                                  calendarConnection.account_email
                                    ? ` · ${calendarConnection.account_email}`
                                    : ""
                                }`
                              : `Sincroniza las reservas de ${item.name} con su calendario.`}
                          </span>
                        </span>
                      </span>
                      <span
                        className="shrink-0 text-lg font-semibold"
                        style={{
                          color: calendarConnection
                            ? "rgb(16 185 129)"
                            : "rgb(244 63 94)",
                        }}
                      >
                        {calendarConnection ? "✓" : "›"}
                      </span>
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {selectedBranchId && staff.length > 0 ? (
            <div
              className="mt-4 rounded-2xl border px-4 py-3 text-sm"
              style={{
                borderColor: "var(--border-color)",
                background: "var(--bg-soft)",
                color: "var(--text-muted)",
              }}
            >
              Cada profesional puede conectar su calendario para sincronizar automáticamente sus reservas.
            </div>
          ) : null}
        </Panel>
        ) : null}

        {calendarModalStaff ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
            <button
              type="button"
              className="absolute inset-0 bg-slate-950/55 backdrop-blur-sm"
              aria-label="Cerrar"
              onClick={() => setCalendarModalStaff(null)}
            />

            <div
              className="relative z-10 w-full max-w-lg rounded-3xl border p-5 shadow-2xl"
              style={{
                borderColor: "var(--border-color)",
                background: "var(--bg-card)",
              }}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3
                    className="text-lg font-semibold"
                    style={{ color: "var(--text-main)" }}
                  >
                    Conectar calendario
                  </h3>
                  <p
                    className="mt-1 text-sm"
                    style={{ color: "var(--text-muted)" }}
                  >
                    Elige la plataforma que prefieras.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setCalendarModalStaff(null)}
                  className="orbyx-staff-energy flex h-10 w-10 items-center justify-center rounded-2xl border text-lg"
                  style={{
                    borderColor: "var(--border-color)",
                    background: "var(--bg-soft)",
                    color: "var(--text-main)",
                  }}
                >
                  ×
                </button>
              </div>

              <div className="mt-5 space-y-3">
                <button
                  type="button"
                  onClick={() => connectStaffGoogleCalendar(calendarModalStaff.id)}
                  disabled={!tenantId || !selectedBranchId || !calendarModalStaff.id || !calendarId}
                  className="orbyx-staff-energy flex w-full items-center justify-between gap-4 rounded-2xl border px-4 py-4 text-left transition disabled:cursor-not-allowed disabled:opacity-60"
                  style={{
                    borderColor: "rgba(37,99,235,0.34)",
                    background:
                      "linear-gradient(135deg, rgba(37,99,235,0.12), var(--bg-soft))",
                    color: "var(--text-main)",
                  }}
                >
                  <span className="flex items-center gap-3">
                    <span
                      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border text-base font-bold"
                      style={{
                        borderColor: "rgba(37,99,235,0.25)",
                        background:
                          "linear-gradient(135deg, rgba(66,133,244,0.18), rgba(52,168,83,0.12))",
                        color: "rgb(37 99 235)",
                      }}
                    >
                      G
                    </span>
                    <span>
                      <span className="block text-sm font-semibold">
                        Google Calendar
                      </span>
                      <span
                        className="mt-1 block text-xs"
                        style={{ color: "var(--text-muted)" }}
                      >
                        Disponible
                      </span>
                    </span>
                  </span>
                  <span className="text-lg">›</span>
                </button>

                {[
                  {
                    label: "Microsoft 365 / Outlook",
                    icon: "M",
                    accent: "rgb(37 99 235)",
                  },
                  {
                    label: "Apple Calendar",
                    icon: "A",
                    accent: "var(--text-main)",
                  },
                ].map((option) => (
                  <button
                    key={option.label}
                    type="button"
                    disabled
                    className="flex w-full cursor-not-allowed items-center justify-between gap-4 rounded-2xl border px-4 py-4 text-left opacity-65"
                    style={{
                      borderColor: "var(--border-color)",
                      background: "var(--bg-soft)",
                      color: "var(--text-main)",
                    }}
                  >
                    <span className="flex items-center gap-3">
                      <span
                        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border text-base font-bold"
                        style={{
                          borderColor: "var(--border-color)",
                          background: "var(--bg-card)",
                          color: option.accent,
                        }}
                      >
                        {option.icon}
                      </span>
                      <span>
                        <span className="block text-sm font-semibold">
                          {option.label}
                        </span>
                      <span
                        className="mt-1 block text-xs"
                        style={{ color: "var(--text-muted)" }}
                      >
                        Próximamente
                      </span>
                      </span>
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : null}

      </section>
    </div>
  );
}
