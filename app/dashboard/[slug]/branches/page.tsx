"use client";

import { CSSProperties, useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Copy, Pencil, Plus, RefreshCw, Store } from "lucide-react";
import { Panel } from "../../../../components/dashboard/panel";

const BACKEND_URL = "https://orbyx-backend.onrender.com";

type BusinessResponse = {
  business: {
    id: string;
    name: string;
    slug: string;
    address?: string | null;
    plan_slug?: string | null;
  };
};

type BranchItem = {
  id: string;
  tenant_id?: string;
  name: string;
  slug?: string | null;
  address?: string | null;
  phone?: string | null;
  whatsapp?: string | null;
  email?: string | null;
  description?: string | null;
  city?: string | null;
  commune?: string | null;
  map_url?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  instagram_url?: string | null;
  facebook_url?: string | null;
  tiktok_url?: string | null;
  website_url?: string | null;
  use_global_socials?: boolean;
  use_global_contact?: boolean;
  use_global_hours?: boolean;
  use_global_special_dates?: boolean;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
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
  label?: string;
  is_closed: boolean;
  start_time?: string | null;
  end_time?: string | null;
};

type BranchesResponse = {
  total?: number;
  branches?: BranchItem[];
};

type NoticeTone =
  | "info"
  | "success"
  | "warning"
  | "limit"
  | "danger"
  | "neutral";

const PLAN_LABELS: Record<string, string> = {
  starter: "Starter",
  pro: "Pro",
  premium: "Premium",
  vip: "VIP",
  platinum: "Platinum",
};

const PLAN_CAPS: Record<string, { max_branches: number }> = {
  starter: { max_branches: 1 },
  pro: { max_branches: 1 },
  premium: { max_branches: 2 },
  vip: { max_branches: 3 },
  platinum: { max_branches: 10 },
};

const NEXT_PLAN_BY_CURRENT: Record<string, string | null> = {
  starter: "premium",
  pro: "premium",
  premium: "vip",
  vip: "platinum",
  platinum: null,
};

const days: Record<number, string> = {
  0: "Domingo",
  1: "Lunes",
  2: "Martes",
  3: "Miércoles",
  4: "Jueves",
  5: "Viernes",
  6: "Sábado",
};

const displayOrder = [1, 2, 3, 4, 5, 6, 0];

function getDefaultHours(): BusinessHour[] {
  return displayOrder.map((day) => ({
    day_of_week: day,
    enabled: day >= 1 && day <= 5,
    start_time: "09:00",
    end_time: "18:00",
  }));
}

function normalizeTimeInput(value: string) {
  return value.replace(/[^\d:]/g, "").slice(0, 5);
}

function normalizeSpecialTime(value?: string | null) {
  if (!value) return "";
  return String(value).slice(0, 5);
}

function formatDateDisplay(dateString?: string | null) {
  if (!dateString) return "";
  const [year, month, day] = String(dateString).slice(0, 10).split("-");
  if (!year || !month || !day) return String(dateString);
  return `${day}-${month}-${year}`;
}

function normalizeHoursRows(rows?: BusinessHour[]) {
  const grouped: Record<number, BusinessHour[]> = {};

  for (const item of rows || []) {
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
    if (grouped[day]?.length) {
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

  return result;
}

function summarizeHours(rows: BusinessHour[]) {
  const enabledRows = rows.filter((row) => row.enabled);
  if (!enabledRows.length) return "Sin bloques activos";

  return displayOrder
    .map((day) => {
      const blocks = enabledRows.filter((row) => row.day_of_week === day);
      if (!blocks.length) return "";
      return `${days[day]} ${blocks
        .map((block) => `${block.start_time}-${block.end_time}`)
        .join(", ")}`;
    })
    .filter(Boolean)
    .join(" · ");
}

function normalizePlanSlug(planSlug?: string | null) {
  const normalized = String(planSlug || "starter").toLowerCase();
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
    { border: string; background: string; text: string }
  > = {
    info: {
      border: "rgba(34,197,94,0.34)",
      background:
        "linear-gradient(135deg, rgba(34,197,94,0.12), rgba(34,197,94,0.05))",
      text: "var(--text-main)",
    },
    success: {
      border: "rgba(16,185,129,0.34)",
      background:
        "linear-gradient(135deg, rgba(16,185,129,0.12), rgba(16,185,129,0.05))",
      text: "var(--text-main)",
    },
    warning: {
      border: "rgba(245,158,11,0.34)",
      background:
        "linear-gradient(135deg, rgba(245,158,11,0.12), rgba(245,158,11,0.05))",
      text: "var(--text-main)",
    },
    limit: {
      border: "rgba(249,115,22,0.34)",
      background:
        "linear-gradient(135deg, rgba(249,115,22,0.12), rgba(249,115,22,0.05))",
      text: "var(--text-main)",
    },
    danger: {
      border: "rgba(244,63,94,0.34)",
      background:
        "linear-gradient(135deg, rgba(244,63,94,0.12), rgba(244,63,94,0.05))",
      text: "var(--text-main)",
    },
    neutral: {
      border: "var(--border-color)",
      background: "var(--bg-soft)",
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

function MapPreview({ address }: { address: string }) {
  const cleanAddress = address.trim();

  if (!cleanAddress) {
    return (
      <div
        className="flex min-h-[160px] items-center justify-center rounded-xl border border-dashed px-4 text-center text-sm"
        style={{
          borderColor: "var(--border-color)",
          background: "var(--bg-card)",
          color: "var(--text-muted)",
        }}
      >
        Ingresa una dirección para previsualizar el mapa.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border" style={{ borderColor: "var(--border-color)" }}>
      <iframe
        title="Mapa de la sucursal"
        src={`https://maps.google.com/maps?q=${encodeURIComponent(cleanAddress)}&output=embed`}
        className="h-[190px] w-full"
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
      />
    </div>
  );
}

export default function BranchesPage() {
  const params = useParams();
  const slug =
    ((params as { slug?: string })?.slug as string) ||
    ((params as { Slug?: string })?.Slug as string) ||
    "";

  const [tenantId, setTenantId] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [globalAddress, setGlobalAddress] = useState("");
  const [plan, setPlan] = useState("pro");

  const [branches, setBranches] = useState<BranchItem[]>([]);
  const [selectedBranchesToKeep, setSelectedBranchesToKeep] = useState<string[]>(
    []
  );

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [saveError, setSaveError] = useState("");
  const [saveOk, setSaveOk] = useState("");
  const [copiedId, setCopiedId] = useState("");
  const [editingBranchId, setEditingBranchId] = useState("");
  const [editForm, setEditForm] = useState({
    name: "",
    slug: "",
    address: "",
    phone: "",
    whatsapp: "",
    email: "",
    description: "",
    city: "",
    commune: "",
    map_url: "",
    latitude: "",
    longitude: "",
    instagram_url: "",
    facebook_url: "",
    tiktok_url: "",
    website_url: "",
    use_global_contact: true,
    use_global_socials: true,
    use_global_hours: true,
    use_global_special_dates: true,
  });
  const [globalHours, setGlobalHours] = useState<BusinessHour[]>([]);
  const [branchHours, setBranchHours] = useState<BusinessHour[]>(getDefaultHours());
  const [globalSpecialDates, setGlobalSpecialDates] = useState<SpecialDate[]>([]);
  const [branchSpecialDates, setBranchSpecialDates] = useState<SpecialDate[]>([]);
  const [scheduleLoading, setScheduleLoading] = useState(false);
  const [specialDateDraft, setSpecialDateDraft] = useState({
    date: "",
    label: "",
    is_closed: true,
    start_time: "09:00",
    end_time: "18:00",
  });

  const [form, setForm] = useState({
    name: "",
  });

  const branchStorageKey = useMemo(() => {
    return slug ? `orbyx_active_branch_${slug}` : "";
  }, [slug]);

  async function loadBranches(currentTenantId: string) {
    const response = await fetch(
      `${BACKEND_URL}/branches?tenant_id=${currentTenantId}`
    );
    const data: BranchesResponse | { error?: string } = await response.json();

    if (!response.ok) {
      throw new Error(
        "error" in data && data.error
          ? data.error
          : "No se pudieron cargar las sucursales"
      );
    }

    const rows: BranchItem[] =
      "branches" in data && Array.isArray(data.branches) ? data.branches : [];

    setBranches(rows);
    return rows;
  }

  async function loadHours(currentTenantId: string, branchId?: string | null) {
    const url = branchId
      ? `${BACKEND_URL}/business-hours?tenant_id=${currentTenantId}&branch_id=${branchId}`
      : `${BACKEND_URL}/business-hours?tenant_id=${currentTenantId}&scope=global`;
    const response = await fetch(url);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data?.error || "No se pudieron cargar los horarios");
    }

    return normalizeHoursRows(Array.isArray(data?.hours) ? data.hours : []);
  }

  async function loadSpecialDates(currentTenantId: string, branchId?: string | null) {
    const url = branchId
      ? `${BACKEND_URL}/business-special-dates?tenant_id=${currentTenantId}&branch_id=${branchId}`
      : `${BACKEND_URL}/business-special-dates?tenant_id=${currentTenantId}&scope=global`;
    const response = await fetch(url);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data?.error || "No se pudieron cargar las fechas especiales");
    }

    return Array.isArray(data?.special_dates)
      ? data.special_dates.map((item: SpecialDate) => ({
          id: item.id,
          date: item.date || "",
          label: item.label || "",
          is_closed: Boolean(item.is_closed),
          start_time: normalizeSpecialTime(item.start_time),
          end_time: normalizeSpecialTime(item.end_time),
        }))
      : [];
  }

  async function loadBranchScheduleData(branchId: string) {
    if (!tenantId) return;

    try {
      setScheduleLoading(true);
      const [nextGlobalHours, nextBranchHours, nextGlobalDates, nextBranchDates] =
        await Promise.all([
          loadHours(tenantId, null),
          loadHours(tenantId, branchId),
          loadSpecialDates(tenantId, null),
          loadSpecialDates(tenantId, branchId),
        ]);

      setGlobalHours(nextGlobalHours);
      setBranchHours(nextBranchHours);
      setGlobalSpecialDates(nextGlobalDates);
      setBranchSpecialDates(nextBranchDates);
    } catch (error: unknown) {
      setSaveError(
        error instanceof Error
          ? error.message
          : "No se pudo cargar la configuración de horarios"
      );
    } finally {
      setScheduleLoading(false);
    }
  }

  async function saveBranchHours(branchId: string) {
    const grouped: Record<
      number,
      {
        day_of_week: number;
        enabled: boolean;
        blocks: { start_time: string; end_time: string }[];
      }
    > = {};

    for (const item of branchHours) {
      if (!grouped[item.day_of_week]) {
        grouped[item.day_of_week] = {
          day_of_week: item.day_of_week,
          enabled: item.enabled,
          blocks: [],
        };
      }

      if (item.enabled && item.start_time && item.end_time) {
        grouped[item.day_of_week].blocks.push({
          start_time: item.start_time,
          end_time: item.end_time,
        });
      }
    }

    const response = await fetch(`${BACKEND_URL}/business-hours`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        tenant_id: tenantId,
        branch_id: branchId,
        hours: Object.values(grouped),
      }),
    });
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data?.error || "No se pudo guardar el horario local");
    }
  }

  function updateBranchHour(index: number, field: "start_time" | "end_time", value: string) {
    setBranchHours((prev) =>
      prev.map((item, itemIndex) =>
        itemIndex === index ? { ...item, [field]: value } : item
      )
    );
  }

  function setBranchDayEnabled(day: number, enabled: boolean) {
    setBranchHours((prev) =>
      prev.map((item) =>
        item.day_of_week === day ? { ...item, enabled } : item
      )
    );
  }

  async function addBranchSpecialDate(branchId: string) {
    try {
      setSaving(true);
      setSaveError("");
      setSaveOk("");

      if (!specialDateDraft.date) {
        throw new Error("Debes seleccionar una fecha especial");
      }

      const response = await fetch(`${BACKEND_URL}/business-special-dates`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenant_id: tenantId,
          branch_id: branchId,
          date: specialDateDraft.date,
          label: specialDateDraft.label,
          is_closed: specialDateDraft.is_closed,
          start_time: specialDateDraft.is_closed ? null : specialDateDraft.start_time,
          end_time: specialDateDraft.is_closed ? null : specialDateDraft.end_time,
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || "No se pudo guardar la fecha especial");
      }

      setBranchSpecialDates(await loadSpecialDates(tenantId, branchId));
      setSpecialDateDraft({
        date: "",
        label: "",
        is_closed: true,
        start_time: "09:00",
        end_time: "18:00",
      });
      setSaveOk("Fecha especial de sucursal guardada.");
    } catch (error: unknown) {
      setSaveError(
        error instanceof Error ? error.message : "No se pudo guardar la fecha"
      );
    } finally {
      setSaving(false);
    }
  }

  async function removeBranchSpecialDate(id?: string) {
    if (!id) return;

    try {
      setSaving(true);
      setSaveError("");
      setSaveOk("");

      const response = await fetch(`${BACKEND_URL}/business-special-dates/${id}`, {
        method: "DELETE",
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || "No se pudo eliminar la fecha especial");
      }

      setBranchSpecialDates((prev) => prev.filter((item) => item.id !== id));
      setSaveOk("Fecha especial eliminada.");
    } catch (error: unknown) {
      setSaveError(
        error instanceof Error ? error.message : "No se pudo eliminar la fecha"
      );
    } finally {
      setSaving(false);
    }
  }

  function syncStoredActiveBranch(rows: BranchItem[]) {
    if (typeof window === "undefined" || !branchStorageKey) return;

    const activeBranches = rows.filter((branch) => branch.is_active !== false);
    const storedBranchId = localStorage.getItem(branchStorageKey) || "";
    const storedIsActive = activeBranches.some(
      (branch) => branch.id === storedBranchId
    );

    if (storedIsActive) return;

    const nextBranchId = activeBranches[0]?.id || "";

    if (nextBranchId) {
      localStorage.setItem(branchStorageKey, nextBranchId);
    } else {
      localStorage.removeItem(branchStorageKey);
    }

    window.dispatchEvent(
      new CustomEvent("orbyx-branch-changed", {
        detail: {
          slug,
          branchId: nextBranchId,
        },
      })
    );
  }

  async function loadAll() {
    try {
      setLoading(true);
      setLoadError("");

      const businessRes = await fetch(`${BACKEND_URL}/public/business/${slug}`);
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

      const currentTenantId = businessData.business.id;

      setTenantId(currentTenantId);
      setBusinessName(businessData.business.name || slug);
      setGlobalAddress(businessData.business.address || "");
      setPlan(normalizePlanSlug(businessData.business.plan_slug));

      await loadBranches(currentTenantId);
    } catch (error: unknown) {
      setLoadError(
        error instanceof Error ? error.message : "No se pudo cargar la página"
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!slug) return;
    loadAll();
  }, [slug]);

  const activeBranchesCount = useMemo(() => {
    return branches.filter((branch) => branch.is_active !== false).length;
  }, [branches]);

  const inactiveBranchesCount = useMemo(() => {
    return branches.filter((branch) => branch.is_active === false).length;
  }, [branches]);

  const caps = PLAN_CAPS[plan] || PLAN_CAPS.pro;
  const maxBranches = caps.max_branches;

  const reachedLimit = activeBranchesCount >= maxBranches;
  const excessBranches = Math.max(0, activeBranchesCount - maxBranches);
  const hasExcess = excessBranches > 0;

  useEffect(() => {
    if (!hasExcess) {
      setSelectedBranchesToKeep([]);
      return;
    }

    const activeBranches = branches.filter((branch) => branch.is_active !== false);
    const allowedIds = activeBranches.slice(0, maxBranches).map((b) => b.id);
    setSelectedBranchesToKeep(allowedIds);
  }, [hasExcess, branches, maxBranches]);

  async function handleCreateBranch() {
    try {
      setSaving(true);
      setSaveError("");
      setSaveOk("");

      if (!tenantId) {
        throw new Error("No se encontró el negocio");
      }

      if (!form.name.trim()) {
        throw new Error("Debes ingresar el nombre de la sucursal");
      }

      if (reachedLimit || hasExcess) {
        throw new Error("Ya alcanzaste el límite de sucursales de tu plan");
      }

      const response = await fetch(`${BACKEND_URL}/branches`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          tenant_id: tenantId,
          name: form.name.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || "No se pudo crear la sucursal");
      }

      setForm({ name: "" });
      setSaveOk("Sucursal creada correctamente.");
      const rows = await loadBranches(tenantId);
      syncStoredActiveBranch(rows);
    } catch (error: unknown) {
      setSaveError(
        error instanceof Error ? error.message : "No se pudo crear la sucursal"
      );
    } finally {
      setSaving(false);
    }
  }

  function beginEditBranch(branch: BranchItem) {
    setEditingBranchId(branch.id);
    setEditForm({
      name: branch.name || "",
      slug: branch.slug || "",
      address: branch.address || "",
      phone: branch.phone || "",
      whatsapp: branch.whatsapp || "",
      email: branch.email || "",
      description: branch.description || "",
      city: branch.city || "",
      commune: branch.commune || "",
      map_url: branch.map_url || "",
      latitude: branch.latitude === null || branch.latitude === undefined ? "" : String(branch.latitude),
      longitude: branch.longitude === null || branch.longitude === undefined ? "" : String(branch.longitude),
      instagram_url: branch.instagram_url || "",
      facebook_url: branch.facebook_url || "",
      tiktok_url: branch.tiktok_url || "",
      website_url: branch.website_url || "",
      use_global_contact: branch.use_global_contact !== false,
      use_global_socials: branch.use_global_socials !== false,
      use_global_hours: branch.use_global_hours !== false,
      use_global_special_dates: branch.use_global_special_dates !== false,
    });
    setBranchHours(getDefaultHours());
    setBranchSpecialDates([]);
    setSpecialDateDraft({
      date: "",
      label: "",
      is_closed: true,
      start_time: "09:00",
      end_time: "18:00",
    });
    setSaveError("");
    setSaveOk("");
    loadBranchScheduleData(branch.id);
  }

  function cancelEditBranch() {
    setEditingBranchId("");
    setEditForm({
      name: "",
      slug: "",
      address: "",
      phone: "",
      whatsapp: "",
      email: "",
      description: "",
      city: "",
      commune: "",
      map_url: "",
      latitude: "",
      longitude: "",
      instagram_url: "",
      facebook_url: "",
      tiktok_url: "",
      website_url: "",
      use_global_contact: true,
      use_global_socials: true,
      use_global_hours: true,
      use_global_special_dates: true,
    });
    setBranchHours(getDefaultHours());
    setBranchSpecialDates([]);
  }

  async function handleUpdateBranch(branchId: string) {
    try {
      setSaving(true);
      setSaveError("");
      setSaveOk("");

      if (!tenantId) {
        throw new Error("No se encontro el negocio");
      }

      if (!editForm.use_global_contact && !editForm.address.trim()) {
        throw new Error("La dirección local es obligatoria cuando la sucursal usa contacto propio");
      }

      const response = await fetch(`${BACKEND_URL}/branches/${branchId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          tenant_id: tenantId,
          name: editForm.name,
          slug: editForm.slug,
          address: editForm.use_global_contact ? "" : editForm.address,
          phone: editForm.use_global_contact ? "" : editForm.phone,
          whatsapp: editForm.use_global_contact ? "" : editForm.whatsapp,
          email: editForm.use_global_contact ? "" : editForm.email,
          description: editForm.description,
          city: editForm.city,
          commune: editForm.commune,
          map_url: "",
          latitude: "",
          longitude: "",
          instagram_url: editForm.use_global_socials ? "" : editForm.instagram_url,
          facebook_url: editForm.use_global_socials ? "" : editForm.facebook_url,
          tiktok_url: editForm.use_global_socials ? "" : editForm.tiktok_url,
          website_url: editForm.use_global_socials ? "" : editForm.website_url,
          use_global_contact: editForm.use_global_contact,
          use_global_socials: editForm.use_global_socials,
          use_global_hours: editForm.use_global_hours,
          use_global_special_dates: editForm.use_global_special_dates,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || "No se pudo actualizar la sucursal");
      }

      if (!editForm.use_global_hours) {
        await saveBranchHours(branchId);
      }

      cancelEditBranch();
      const rows = await loadBranches(tenantId);
      syncStoredActiveBranch(rows);
      setSaveOk("Sucursal actualizada correctamente.");
    } catch (error: unknown) {
      setSaveError(
        error instanceof Error
          ? error.message
          : "No se pudo actualizar la sucursal"
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleBranchActive(branch: BranchItem) {
    try {
      setSaving(true);
      setSaveError("");
      setSaveOk("");

      if (!tenantId) {
        throw new Error("No se encontro el negocio");
      }

      const nextActive = branch.is_active === false;

      if (nextActive && reachedLimit) {
        throw new Error("Ya alcanzaste el limite de sucursales de tu plan");
      }

      const response = await fetch(`${BACKEND_URL}/branches/${branch.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          tenant_id: tenantId,
          is_active: nextActive,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || "No se pudo actualizar la sucursal");
      }

      const rows = await loadBranches(tenantId);
      syncStoredActiveBranch(rows);
      setSaveOk(
        nextActive
          ? "Sucursal activada correctamente."
          : "Sucursal desactivada correctamente."
      );
    } catch (error: unknown) {
      setSaveError(
        error instanceof Error
          ? error.message
          : "No se pudo actualizar la sucursal"
      );
    } finally {
      setSaving(false);
    }
  }

  function toggleBranchSelection(branchId: string) {
    setSelectedBranchesToKeep((prev) =>
      prev.includes(branchId)
        ? prev.filter((id) => id !== branchId)
        : [...prev, branchId]
    );
  }

  async function applyBranchesAdjustment() {
    try {
      const toDeactivate = branches.filter(
        (branch) =>
          branch.is_active !== false && !selectedBranchesToKeep.includes(branch.id)
      );

      if (toDeactivate.length === 0) {
        alert("No hay sucursales para desactivar.");
        return;
      }

      const confirmed = window.confirm(
        `Se desactivarán ${toDeactivate.length} sucursal${
          toDeactivate.length === 1 ? "" : "es"
        }. ¿Continuar?`
      );

      if (!confirmed) return;

      setSaving(true);
      setSaveError("");
      setSaveOk("");

      for (const branch of toDeactivate) {
        const response = await fetch(`${BACKEND_URL}/branches/${branch.id}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            tenant_id: tenantId,
            is_active: false,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data?.error || `No se pudo desactivar la sucursal ${branch.name}`
          );
        }
      }

      const rows = await loadBranches(tenantId);
      syncStoredActiveBranch(rows);
      setSaveOk("Ajuste aplicado correctamente.");
    } catch (error: unknown) {
      setSaveError(
        error instanceof Error ? error.message : "No se pudo aplicar el ajuste"
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleCopyId(branchId: string) {
    try {
      await navigator.clipboard.writeText(branchId);
      setCopiedId(branchId);
      setTimeout(() => setCopiedId(""), 1600);
    } catch {
      setCopiedId("");
    }
  }

  const planLabel = PLAN_LABELS[plan] || "Pro";
  const nextPlan = NEXT_PLAN_BY_CURRENT[plan] || null;
  const nextPlanLabel = nextPlan ? PLAN_LABELS[nextPlan] || nextPlan : null;

  return (
    <div className="space-y-6 pb-6">
      <section
        className="relative overflow-hidden rounded-2xl border px-5 py-4 shadow-[0_18px_46px_-28px_rgba(37,99,235,0.55),0_0_34px_-24px_rgba(56,189,248,0.48)]"
        style={{
          borderColor: "rgba(37,99,235,0.42)",
          background:
            "linear-gradient(135deg, rgba(37,99,235,0.18), rgba(14,165,233,0.08) 35%, var(--bg-card) 85%)",
        }}
      >
        <div className="pointer-events-none absolute inset-x-8 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(37,99,235,0.42),rgba(34,211,238,0.35),transparent)]" />
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex max-w-3xl items-center gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-blue-300/70 bg-[linear-gradient(135deg,rgb(37_99_235),rgb(14_165_233)_48%,rgb(79_70_229))] text-white shadow-[0_18px_32px_-16px_rgba(37,99,235,0.95),0_0_26px_-12px_rgba(56,189,248,0.85)]">
              <Store className="h-5 w-5" />
            </div>
            <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-blue-600">Sucursales</p>

            <h1
              className="mt-0.5 text-xl font-semibold tracking-tight"
              style={{ color: "var(--text-main)" }}
            >
              Sucursales del negocio
            </h1>

            <p
              className="mt-0.5 max-w-2xl text-sm leading-5"
              style={{ color: "var(--text-muted)" }}
            >
              {loading
                ? "Cargando información del negocio..."
                : `Gestiona las sucursales de ${businessName}.`}
            </p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <div
              className="rounded-2xl border px-4 py-3"
              style={{
                borderColor: "rgba(139,92,246,0.24)",
                background: "rgba(255,255,255,0.08)",
              }}
            >
              <p
                className="text-[11px] font-semibold uppercase tracking-[0.16em]"
                style={{ color: "var(--text-muted)" }}
              >
                Total sucursales
              </p>
              <p
                className="mt-2 text-sm font-semibold"
                style={{ color: "var(--text-main)" }}
              >
                {loading ? "..." : branches.length}
              </p>
            </div>

            <div
              className="rounded-2xl border px-4 py-3"
              style={{
                borderColor: "rgba(139,92,246,0.24)",
                background: "rgba(255,255,255,0.08)",
              }}
            >
              <p
                className="text-[11px] font-semibold uppercase tracking-[0.16em]"
                style={{ color: "var(--text-muted)" }}
              >
                Activas
              </p>
              <p
                className="mt-2 text-sm font-semibold"
                style={{ color: "var(--text-main)" }}
              >
                {loading ? "..." : activeBranchesCount}
              </p>
            </div>

            <div
              className="rounded-2xl border px-4 py-3"
              style={{
                borderColor: "rgba(139,92,246,0.24)",
                background: "rgba(255,255,255,0.08)",
              }}
            >
              <p
                className="text-[11px] font-semibold uppercase tracking-[0.16em]"
                style={{ color: "var(--text-muted)" }}
              >
                Inactivas
              </p>
              <p
                className="mt-2 text-sm font-semibold"
                style={{ color: "var(--text-main)" }}
              >
                {loading ? "..." : inactiveBranchesCount}
              </p>
            </div>

            <div
              className="rounded-2xl border px-4 py-3"
              style={{
                borderColor: "rgba(139,92,246,0.24)",
                background: "rgba(255,255,255,0.08)",
              }}
            >
              <p
                className="text-[11px] font-semibold uppercase tracking-[0.16em]"
                style={{ color: "var(--text-muted)" }}
              >
                Plan actual
              </p>
              <p
                className="mt-2 text-sm font-semibold"
                style={{ color: "var(--text-main)" }}
              >
                {loading ? "..." : `${planLabel} · ${activeBranchesCount}/${maxBranches}`}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <Link
            href={`/dashboard/${slug}/agenda`}
            className="inline-flex h-10 items-center justify-center rounded-xl border px-4 text-sm font-medium transition"
            style={{
              borderColor: "var(--border-color)",
              background: "var(--bg-card)",
              color: "var(--text-main)",
            }}
          >
            Ver agenda
          </Link>

          <button
            type="button"
            onClick={() => {
              if (!tenantId) return;
              loadBranches(tenantId)
                .then(syncStoredActiveBranch)
                .catch((error: unknown) => {
                  setLoadError(
                    error instanceof Error
                      ? error.message
                      : "No se pudieron recargar las sucursales"
                  );
                });
            }}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold text-white transition"
            style={{
              background:
                "linear-gradient(135deg, rgb(139 92 246), rgb(99 102 241))",
            }}
          >
            <RefreshCw className="h-4 w-4" />
            Recargar
          </button>
        </div>
      </section>

      {loadError ? <Notice tone="danger" title={loadError} /> : null}
      {saveError ? <Notice tone="danger" title={saveError} /> : null}
      {saveOk ? <Notice tone="success" title={saveOk} /> : null}

      {hasExcess ? (
        <Notice
          tone="limit"
          title="Estás sobre el límite de sucursales de tu plan."
          description={`Debes desactivar ${excessBranches} sucursal${
            excessBranches === 1 ? "" : "es"
          } antes del próximo ciclo.`}
        >
          <div className="text-xs" style={{ color: "var(--text-muted)" }}>
            Seleccionadas: {selectedBranchesToKeep.length} / {maxBranches}
          </div>

          <button
            type="button"
            onClick={applyBranchesAdjustment}
            disabled={saving}
            className="mt-3 inline-flex h-11 items-center justify-center rounded-xl px-4 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-60"
            style={{
              background:
                "linear-gradient(135deg, rgb(249 115 22), rgb(251 146 60))",
            }}
          >
            {saving ? "Aplicando ajuste..." : "Aplicar ajuste al plan"}
          </button>
        </Notice>
      ) : null}

      <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <Panel className="bg-[linear-gradient(180deg,rgba(37,99,235,0.08),transparent_35%)]">
          <div
            className="mb-5 flex flex-col gap-4 border-b pb-4 sm:flex-row sm:items-center sm:justify-between"
            style={{ borderColor: "var(--border-color)" }}
          >
            <div className="flex min-w-0 items-start gap-3">
              <div
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border"
                style={{
                  borderColor: "rgba(139,92,246,0.35)",
                  background:
                    "linear-gradient(135deg, rgba(139,92,246,0.22), rgba(59,130,246,0.10))",
                  color: "rgb(167 139 250)",
                }}
              >
                <Store className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <h3
                  className="text-base font-semibold tracking-tight"
                  style={{ color: "var(--text-main)" }}
                >
                  Sucursales
                </h3>
                <p
                  className="mt-1 text-sm leading-6"
                  style={{ color: "var(--text-muted)" }}
                >
                  Administra las sucursales registradas en el negocio.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => document.getElementById("new-branch-name")?.focus()}
              disabled={saving || loading || reachedLimit || hasExcess}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl px-5 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-60"
              style={{
                background:
                  reachedLimit || hasExcess
                    ? "linear-gradient(135deg, rgba(100,116,139,0.9), rgba(71,85,105,0.9))"
                    : "linear-gradient(135deg, rgb(139 92 246), rgb(59 130 246))",
              }}
            >
              <Plus className="h-4 w-4" />
              Nueva sucursal
            </button>
          </div>
          {loading ? (
            <div
              className="rounded-2xl border border-dashed px-4 py-8 text-sm"
              style={{
                borderColor: "var(--border-color)",
                background: "var(--bg-soft)",
                color: "var(--text-muted)",
              }}
            >
              Cargando sucursales...
            </div>
          ) : branches.length === 0 ? (
            <div
              className="rounded-2xl border border-dashed px-4 py-8 text-sm"
              style={{
                borderColor: "var(--border-color)",
                background: "var(--bg-soft)",
                color: "var(--text-muted)",
              }}
            >
              Aún no tienes sucursales creadas. Puedes seguir operando normal,
              pero si quieres probar multi-sucursal, crea la primera aquí.
            </div>
          ) : (
            <div
              className="overflow-hidden rounded-2xl border"
              style={{ borderColor: "var(--border-color)" }}
            >
              <div
                className="hidden grid-cols-[1.35fr_0.65fr_0.85fr_0.95fr_0.6fr] border-b px-4 py-3 text-xs font-semibold md:grid"
                style={{
                  borderColor: "var(--border-color)",
                  color: "var(--text-muted)",
                }}
              >
                <span>Sucursal</span>
                <span>Estado</span>
                <span>Creada</span>
                <span>Última actualización</span>
                <span>Editar</span>
              </div>
              {branches.map((branch) => {
                const isActive = branch.is_active !== false;
                const isMarkedToKeep = selectedBranchesToKeep.includes(branch.id);
                const isEditing = editingBranchId === branch.id;
                const isMainBranch = branches[0]?.id === branch.id;

                return (
                  <div
                    key={branch.id}
                    className="grid gap-4 border-b p-4 transition last:border-b-0 md:grid-cols-[1.35fr_0.65fr_0.85fr_0.95fr_0.6fr] md:items-center"
                    style={{
                      borderColor: "var(--border-color)",
                      background: isEditing
                        ? "linear-gradient(135deg, rgba(139,92,246,0.10), var(--bg-card))"
                        : "linear-gradient(135deg, rgba(37,99,235,0.04), var(--bg-card))",
                    }}
                  >
                    {hasExcess && isActive ? (
                      <label
                        className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium md:col-span-5"
                        style={{
                          borderColor: isMarkedToKeep
                            ? "rgba(16,185,129,0.34)"
                            : "rgba(244,63,94,0.34)",
                          background: isMarkedToKeep
                            ? "rgba(16,185,129,0.10)"
                            : "rgba(244,63,94,0.10)",
                          color: "var(--text-main)",
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={isMarkedToKeep}
                          onChange={() => toggleBranchSelection(branch.id)}
                          className="h-4 w-4 rounded"
                        />
                        Mantener activa
                      </label>
                    ) : null}

                    <div className="min-w-0">
                      <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.16em] md:hidden" style={{ color: "var(--text-muted)" }}>
                        Sucursal
                      </p>
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl" style={{ background: "linear-gradient(135deg, rgba(139,92,246,0.24), rgba(59,130,246,0.12))", color: "rgb(167 139 250)" }}>
                          <Store className="h-4 w-4" />
                        </div>
                        <div className="min-w-0">
                          {isEditing ? (
                            <input
                              type="text"
                              value={editForm.name}
                              onChange={(e) => setEditForm((prev) => ({ ...prev, name: e.target.value }))}
                              className="h-10 w-full rounded-xl border px-3 text-sm outline-none transition"
                              style={{ borderColor: "var(--border-color)", background: "var(--bg-card)", color: "var(--text-main)" }}
                            />
                          ) : (
                            <p className="truncate text-sm font-semibold" style={{ color: "var(--text-main)" }}>
                              {branch.name}
                            </p>
                          )}
                          {isMainBranch ? (
                            <span className="mt-1 inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-semibold" style={{ background: "rgba(139,92,246,0.18)", color: "rgb(196 181 253)" }}>
                              Sucursal principal
                            </span>
                          ) : null}
                        </div>
                      </div>
                    </div>

                    <div>
                      <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.16em] md:hidden" style={{ color: "var(--text-muted)" }}>
                        Estado
                      </p>
                      <span className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold" style={{ borderColor: isActive ? (hasExcess ? "rgba(249,115,22,0.34)" : "rgba(16,185,129,0.28)") : "rgba(148,163,184,0.22)", background: isActive ? (hasExcess ? "rgba(249,115,22,0.12)" : "rgba(16,185,129,0.12)") : "rgba(148,163,184,0.12)", color: isActive ? (hasExcess ? "rgb(251 146 60)" : "rgb(52 211 153)") : "var(--text-muted)" }}>
                        <span className="h-1.5 w-1.5 rounded-full bg-current" />
                        {isActive ? (hasExcess ? "Exceso" : "Activa") : "Inactiva"}
                      </span>
                    </div>

                    <div>
                      <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.16em] md:hidden" style={{ color: "var(--text-muted)" }}>
                        Creada
                      </p>
                      <p className="text-sm" style={{ color: "var(--text-main)" }}>
                        {formatBranchDate(branch.created_at)}
                      </p>
                    </div>

                    <div>
                      <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.16em] md:hidden" style={{ color: "var(--text-muted)" }}>
                        Última actualización
                      </p>
                      <p className="text-sm" style={{ color: "var(--text-main)" }}>
                        {formatBranchDate(branch.updated_at || branch.created_at)}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2 md:justify-end">
                      <p className="w-full text-[11px] font-semibold uppercase tracking-[0.16em] md:hidden" style={{ color: "var(--text-muted)" }}>
                        Editar
                      </p>
                      {isEditing ? (
                        <>
                          <button type="button" onClick={() => handleUpdateBranch(branch.id)} disabled={saving} className="inline-flex h-10 items-center justify-center rounded-2xl px-4 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-60" style={{ background: "linear-gradient(135deg, rgb(37 99 235), rgb(99 102 241))" }}>
                            Guardar
                          </button>
                          <button type="button" onClick={cancelEditBranch} disabled={saving} className="inline-flex h-10 items-center justify-center rounded-2xl border px-4 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-60" style={{ borderColor: "var(--border-color)", background: "var(--bg-card)", color: "var(--text-main)" }}>
                            Cancelar
                          </button>
                          <button type="button" onClick={() => handleToggleBranchActive(branch)} disabled={saving || (branch.is_active === false && reachedLimit)} className="inline-flex h-10 items-center justify-center rounded-2xl border px-4 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-60" style={{ borderColor: isActive ? "rgba(244,63,94,0.34)" : "rgba(16,185,129,0.34)", background: "var(--bg-card)", color: isActive ? "rgb(244 63 94)" : "rgb(16 185 129)" }}>
                            {isActive ? "Desactivar" : "Activar"}
                          </button>
                        </>
                      ) : (
                        <button type="button" onClick={() => beginEditBranch(branch)} disabled={saving} className="inline-flex h-10 items-center justify-center gap-2 rounded-2xl border px-4 text-sm font-medium transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60" style={{ borderColor: "var(--border-color)", background: "var(--bg-card)", color: "var(--text-main)" }}>
                          <Pencil className="h-4 w-4" />
                          Editar
                        </button>
                      )}
                    </div>

                    {isEditing ? (
                      <div className="space-y-4 rounded-2xl border p-4 md:col-span-5" style={{ borderColor: "var(--border-color)", background: "var(--bg-soft)" }}>
                        <div className="grid gap-3 md:grid-cols-2">
                          <div>
                            <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em]" style={{ color: "var(--text-muted)" }}>
                              Slug
                            </label>
                            <input
                              type="text"
                              value={editForm.slug}
                              onChange={(e) => setEditForm((prev) => ({ ...prev, slug: e.target.value }))}
                              className="h-10 w-full rounded-xl border px-3 text-sm outline-none transition"
                              style={{ borderColor: "var(--border-color)", background: "var(--bg-card)", color: "var(--text-main)" }}
                            />
                          </div>

                          <div>
                            <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em]" style={{ color: "var(--text-muted)" }}>
                              Dirección
                            </label>
                            <input
                              type="text"
                              value={editForm.use_global_contact ? globalAddress : editForm.address}
                              disabled={editForm.use_global_contact}
                              required={!editForm.use_global_contact}
                              onChange={(e) => setEditForm((prev) => ({ ...prev, address: e.target.value }))}
                              placeholder={
                                editForm.use_global_contact
                                  ? "Usando dirección global del negocio"
                                  : "Dirección local de la sucursal"
                              }
                              className="h-10 w-full rounded-xl border px-3 text-sm outline-none transition disabled:cursor-not-allowed disabled:opacity-60"
                              style={{ borderColor: "var(--border-color)", background: "var(--bg-card)", color: "var(--text-main)" }}
                            />
                          </div>

                          <div>
                            <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em]" style={{ color: "var(--text-muted)" }}>
                              Comuna
                            </label>
                            <input
                              type="text"
                              value={editForm.commune}
                              onChange={(e) => setEditForm((prev) => ({ ...prev, commune: e.target.value }))}
                              className="h-10 w-full rounded-xl border px-3 text-sm outline-none transition"
                              style={{ borderColor: "var(--border-color)", background: "var(--bg-card)", color: "var(--text-main)" }}
                            />
                          </div>

                          <div>
                            <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em]" style={{ color: "var(--text-muted)" }}>
                              Ciudad
                            </label>
                            <input
                              type="text"
                              value={editForm.city}
                              onChange={(e) => setEditForm((prev) => ({ ...prev, city: e.target.value }))}
                              className="h-10 w-full rounded-xl border px-3 text-sm outline-none transition"
                              style={{ borderColor: "var(--border-color)", background: "var(--bg-card)", color: "var(--text-main)" }}
                            />
                          </div>
                        </div>

                        <label className="flex items-center justify-between gap-3 rounded-xl border px-3 py-2 text-sm font-medium" style={{ borderColor: "var(--border-color)", color: "var(--text-main)" }}>
                          Usar contacto global
                          <input
                            type="checkbox"
                            checked={editForm.use_global_contact}
                            onChange={(e) => setEditForm((prev) => ({ ...prev, use_global_contact: e.target.checked }))}
                            className="h-4 w-4"
                          />
                        </label>

                        <MapPreview
                          address={
                            editForm.use_global_contact ? globalAddress : editForm.address
                          }
                        />

                        <div className="grid gap-3 md:grid-cols-3">
                          <input
                            type="text"
                            value={editForm.phone}
                            disabled={editForm.use_global_contact}
                            onChange={(e) => setEditForm((prev) => ({ ...prev, phone: e.target.value }))}
                            placeholder="Teléfono local"
                            className="h-10 w-full rounded-xl border px-3 text-sm outline-none transition disabled:cursor-not-allowed disabled:opacity-50"
                            style={{ borderColor: "var(--border-color)", background: "var(--bg-card)", color: "var(--text-main)" }}
                          />
                          <input
                            type="text"
                            value={editForm.whatsapp}
                            disabled={editForm.use_global_contact}
                            onChange={(e) => setEditForm((prev) => ({ ...prev, whatsapp: e.target.value }))}
                            placeholder="WhatsApp local"
                            className="h-10 w-full rounded-xl border px-3 text-sm outline-none transition disabled:cursor-not-allowed disabled:opacity-50"
                            style={{ borderColor: "var(--border-color)", background: "var(--bg-card)", color: "var(--text-main)" }}
                          />
                          <input
                            type="email"
                            value={editForm.email}
                            disabled={editForm.use_global_contact}
                            onChange={(e) => setEditForm((prev) => ({ ...prev, email: e.target.value }))}
                            placeholder="Correo local"
                            className="h-10 w-full rounded-xl border px-3 text-sm outline-none transition disabled:cursor-not-allowed disabled:opacity-50"
                            style={{ borderColor: "var(--border-color)", background: "var(--bg-card)", color: "var(--text-main)" }}
                          />
                        </div>

                        <textarea
                          value={editForm.description}
                          onChange={(e) => setEditForm((prev) => ({ ...prev, description: e.target.value }))}
                          placeholder="Descripción local de la sucursal"
                          className="min-h-[92px] w-full rounded-xl border px-3 py-3 text-sm outline-none transition"
                          style={{ borderColor: "var(--border-color)", background: "var(--bg-card)", color: "var(--text-main)" }}
                        />

                        <label className="flex items-center justify-between gap-3 rounded-xl border px-3 py-2 text-sm font-medium" style={{ borderColor: "var(--border-color)", color: "var(--text-main)" }}>
                          Usar redes globales
                          <input
                            type="checkbox"
                            checked={editForm.use_global_socials}
                            onChange={(e) => setEditForm((prev) => ({ ...prev, use_global_socials: e.target.checked }))}
                            className="h-4 w-4"
                          />
                        </label>

                        <div className="grid gap-3 md:grid-cols-4">
                          <input
                            type="text"
                            value={editForm.instagram_url}
                            disabled={editForm.use_global_socials}
                            onChange={(e) => setEditForm((prev) => ({ ...prev, instagram_url: e.target.value }))}
                            placeholder="Instagram"
                            className="h-10 w-full rounded-xl border px-3 text-sm outline-none transition disabled:cursor-not-allowed disabled:opacity-50"
                            style={{ borderColor: "var(--border-color)", background: "var(--bg-card)", color: "var(--text-main)" }}
                          />
                          <input
                            type="text"
                            value={editForm.facebook_url}
                            disabled={editForm.use_global_socials}
                            onChange={(e) => setEditForm((prev) => ({ ...prev, facebook_url: e.target.value }))}
                            placeholder="Facebook"
                            className="h-10 w-full rounded-xl border px-3 text-sm outline-none transition disabled:cursor-not-allowed disabled:opacity-50"
                            style={{ borderColor: "var(--border-color)", background: "var(--bg-card)", color: "var(--text-main)" }}
                          />
                          <input
                            type="text"
                            value={editForm.tiktok_url}
                            disabled={editForm.use_global_socials}
                            onChange={(e) => setEditForm((prev) => ({ ...prev, tiktok_url: e.target.value }))}
                            placeholder="TikTok"
                            className="h-10 w-full rounded-xl border px-3 text-sm outline-none transition disabled:cursor-not-allowed disabled:opacity-50"
                            style={{ borderColor: "var(--border-color)", background: "var(--bg-card)", color: "var(--text-main)" }}
                          />
                          <input
                            type="text"
                            value={editForm.website_url}
                            disabled={editForm.use_global_socials}
                            onChange={(e) => setEditForm((prev) => ({ ...prev, website_url: e.target.value }))}
                            placeholder="Web"
                            className="h-10 w-full rounded-xl border px-3 text-sm outline-none transition disabled:cursor-not-allowed disabled:opacity-50"
                            style={{ borderColor: "var(--border-color)", background: "var(--bg-card)", color: "var(--text-main)" }}
                          />
                        </div>

                        <div className="space-y-4 rounded-2xl border p-4" style={{ borderColor: "var(--border-color)", background: "var(--bg-card)" }}>
                          <div>
                            <p className="text-sm font-semibold" style={{ color: "var(--text-main)" }}>
                              Horario de la sucursal
                            </p>
                            <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
                              Define si esta sucursal hereda el horario global o usa bloques propios.
                            </p>
                          </div>

                          <label className="flex items-center justify-between gap-3 rounded-xl border px-3 py-2 text-sm font-medium" style={{ borderColor: "var(--border-color)", color: "var(--text-main)" }}>
                            Usar horario global del negocio
                            <input
                              type="checkbox"
                              checked={editForm.use_global_hours}
                              onChange={(e) => setEditForm((prev) => ({ ...prev, use_global_hours: e.target.checked }))}
                              className="h-4 w-4"
                            />
                          </label>

                          {editForm.use_global_hours ? (
                            <div className="rounded-xl border px-3 py-3 text-sm" style={{ borderColor: "var(--border-color)", background: "var(--bg-soft)", color: "var(--text-muted)" }}>
                              <p className="font-medium" style={{ color: "var(--text-main)" }}>
                                Esta sucursal usa el horario global configurado en Negocio.
                              </p>
                              <p className="mt-1">{scheduleLoading ? "Cargando horario global..." : summarizeHours(globalHours)}</p>
                            </div>
                          ) : (
                            <div className="space-y-3">
                              {displayOrder.map((day) => {
                                const dayBlocks = branchHours.filter((item) => item.day_of_week === day);
                                const enabled = dayBlocks.some((item) => item.enabled);

                                return (
                                  <div key={day} className="grid gap-3 rounded-xl border p-3 sm:grid-cols-[130px_minmax(0,1fr)]" style={{ borderColor: "var(--border-color)", background: "var(--bg-soft)" }}>
                                    <div className="flex items-center justify-between gap-3 sm:flex-col sm:items-start">
                                      <div>
                                        <p className="text-sm font-semibold" style={{ color: "var(--text-main)" }}>{days[day]}</p>
                                        <p className="text-xs" style={{ color: "var(--text-muted)" }}>{enabled ? `${dayBlocks.length} bloque${dayBlocks.length === 1 ? "" : "s"}` : "Cerrado"}</p>
                                      </div>
                                      <label className="inline-flex items-center gap-2 text-xs" style={{ color: "var(--text-main)" }}>
                                        <input
                                          type="checkbox"
                                          checked={enabled}
                                          onChange={(e) => setBranchDayEnabled(day, e.target.checked)}
                                          className="h-4 w-4"
                                        />
                                        Activo
                                      </label>
                                    </div>

                                    <div className="space-y-2">
                                      {enabled ? (
                                        dayBlocks.map((block) => {
                                          const realIndex = branchHours.findIndex(
                                            (item) =>
                                              item.day_of_week === day &&
                                              item.start_time === block.start_time &&
                                              item.end_time === block.end_time
                                          );

                                          return (
                                            <div key={`${day}-${realIndex}`} className="flex flex-wrap items-center gap-2">
                                              <input
                                                type="text"
                                                value={block.start_time}
                                                onChange={(e) => updateBranchHour(realIndex, "start_time", normalizeTimeInput(e.target.value))}
                                                className="h-10 w-[120px] rounded-xl border px-3 text-sm"
                                                style={{ borderColor: "var(--border-color)", background: "var(--bg-card)", color: "var(--text-main)" }}
                                              />
                                              <span style={{ color: "var(--text-muted)" }}>-</span>
                                              <input
                                                type="text"
                                                value={block.end_time}
                                                onChange={(e) => updateBranchHour(realIndex, "end_time", normalizeTimeInput(e.target.value))}
                                                className="h-10 w-[120px] rounded-xl border px-3 text-sm"
                                                style={{ borderColor: "var(--border-color)", background: "var(--bg-card)", color: "var(--text-main)" }}
                                              />
                                              <button
                                                type="button"
                                                onClick={() => setBranchHours((prev) => prev.filter((_, index) => index !== realIndex))}
                                                className="h-9 rounded-xl border px-3 text-xs font-semibold text-rose-400"
                                                style={{ borderColor: "rgba(244,63,94,0.34)", background: "rgba(244,63,94,0.08)" }}
                                              >
                                                Eliminar
                                              </button>
                                            </div>
                                          );
                                        })
                                      ) : (
                                        <p className="text-sm" style={{ color: "var(--text-muted)" }}>No disponible</p>
                                      )}

                                      <button
                                        type="button"
                                        onClick={() =>
                                          setBranchHours((prev) => [
                                            ...prev,
                                            {
                                              day_of_week: day,
                                              enabled: true,
                                              start_time: "09:00",
                                              end_time: "18:00",
                                            },
                                          ])
                                        }
                                        className="rounded-xl border px-3 py-2 text-xs font-medium"
                                        style={{ borderColor: "rgba(37,99,235,0.24)", background: "rgba(37,99,235,0.06)", color: "var(--text-main)" }}
                                      >
                                        + Agregar bloque
                                      </button>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>

                        <div className="space-y-4 rounded-2xl border p-4" style={{ borderColor: "var(--border-color)", background: "var(--bg-card)" }}>
                          <div>
                            <p className="text-sm font-semibold" style={{ color: "var(--text-main)" }}>
                              Fechas especiales de la sucursal
                            </p>
                            <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
                              Define cierres o horarios especiales que aplican solo a esta sucursal.
                            </p>
                          </div>

                          <label className="flex items-center justify-between gap-3 rounded-xl border px-3 py-2 text-sm font-medium" style={{ borderColor: "var(--border-color)", color: "var(--text-main)" }}>
                            Usar fechas especiales globales
                            <input
                              type="checkbox"
                              checked={editForm.use_global_special_dates}
                              onChange={(e) => setEditForm((prev) => ({ ...prev, use_global_special_dates: e.target.checked }))}
                              className="h-4 w-4"
                            />
                          </label>

                          {editForm.use_global_special_dates ? (
                            <div className="rounded-xl border px-3 py-3 text-sm" style={{ borderColor: "var(--border-color)", background: "var(--bg-soft)", color: "var(--text-muted)" }}>
                              <p className="font-medium" style={{ color: "var(--text-main)" }}>
                                Esta sucursal usa las fechas especiales globales del negocio.
                              </p>
                              <div className="mt-2 space-y-1">
                                {scheduleLoading ? (
                                  <p>Cargando fechas globales...</p>
                                ) : globalSpecialDates.length ? (
                                  globalSpecialDates.slice(0, 5).map((item) => (
                                    <p key={item.id || item.date}>
                                      {formatDateDisplay(item.date)} · {item.label || "Sin etiqueta"} · {item.is_closed ? "Cerrado todo el día" : `${normalizeSpecialTime(item.start_time)}-${normalizeSpecialTime(item.end_time)}`}
                                    </p>
                                  ))
                                ) : (
                                  <p>Sin fechas especiales globales.</p>
                                )}
                              </div>
                            </div>
                          ) : (
                            <div className="space-y-3">
                              <div className="grid gap-2 md:grid-cols-[150px_minmax(0,1fr)_150px_120px_120px_auto] md:items-end">
                                <input
                                  type="date"
                                  value={specialDateDraft.date}
                                  onChange={(e) => setSpecialDateDraft((prev) => ({ ...prev, date: e.target.value }))}
                                  className="h-10 rounded-xl border px-3 text-sm"
                                  style={{ borderColor: "var(--border-color)", background: "var(--bg-card)", color: "var(--text-main)" }}
                                />
                                <input
                                  type="text"
                                  value={specialDateDraft.label}
                                  onChange={(e) => setSpecialDateDraft((prev) => ({ ...prev, label: e.target.value }))}
                                  placeholder="Motivo"
                                  className="h-10 rounded-xl border px-3 text-sm"
                                  style={{ borderColor: "var(--border-color)", background: "var(--bg-card)", color: "var(--text-main)" }}
                                />
                                <select
                                  value={specialDateDraft.is_closed ? "closed" : "partial"}
                                  onChange={(e) => setSpecialDateDraft((prev) => ({ ...prev, is_closed: e.target.value === "closed" }))}
                                  className="h-10 rounded-xl border px-3 text-sm"
                                  style={{ borderColor: "var(--border-color)", background: "var(--bg-card)", color: "var(--text-main)" }}
                                >
                                  <option value="closed">Todo el día</option>
                                  <option value="partial">Horario especial</option>
                                </select>
                                {!specialDateDraft.is_closed ? (
                                  <>
                                    <input
                                      type="text"
                                      value={specialDateDraft.start_time}
                                      onChange={(e) => setSpecialDateDraft((prev) => ({ ...prev, start_time: normalizeTimeInput(e.target.value) }))}
                                      className="h-10 rounded-xl border px-3 text-sm"
                                      style={{ borderColor: "var(--border-color)", background: "var(--bg-card)", color: "var(--text-main)" }}
                                    />
                                    <input
                                      type="text"
                                      value={specialDateDraft.end_time}
                                      onChange={(e) => setSpecialDateDraft((prev) => ({ ...prev, end_time: normalizeTimeInput(e.target.value) }))}
                                      className="h-10 rounded-xl border px-3 text-sm"
                                      style={{ borderColor: "var(--border-color)", background: "var(--bg-card)", color: "var(--text-main)" }}
                                    />
                                  </>
                                ) : (
                                  <div className="hidden md:block" />
                                )}
                                <button
                                  type="button"
                                  onClick={() => addBranchSpecialDate(branch.id)}
                                  disabled={saving}
                                  className="h-10 rounded-xl px-3 text-sm font-semibold text-white disabled:opacity-60"
                                  style={{ background: "linear-gradient(135deg, rgb(37 99 235), rgb(99 102 241))" }}
                                >
                                  Agregar
                                </button>
                              </div>

                              <div className="space-y-2">
                                {branchSpecialDates.length ? (
                                  branchSpecialDates.map((item) => (
                                    <div key={item.id || item.date} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border px-3 py-2 text-sm" style={{ borderColor: "var(--border-color)", background: "var(--bg-soft)", color: "var(--text-main)" }}>
                                      <span>
                                        {formatDateDisplay(item.date)} · {item.label || "Sin etiqueta"} · {item.is_closed ? "Cerrado todo el día" : `${normalizeSpecialTime(item.start_time)}-${normalizeSpecialTime(item.end_time)}`}
                                      </span>
                                      <button
                                        type="button"
                                        onClick={() => removeBranchSpecialDate(item.id)}
                                        className="rounded-xl border px-3 py-1 text-xs font-semibold text-rose-400"
                                        style={{ borderColor: "rgba(244,63,94,0.34)", background: "rgba(244,63,94,0.08)" }}
                                      >
                                        Eliminar
                                      </button>
                                    </div>
                                  ))
                                ) : (
                                  <p className="rounded-xl border border-dashed px-3 py-3 text-sm" style={{ borderColor: "var(--border-color)", color: "var(--text-muted)" }}>
                                    Sin fechas especiales locales.
                                  </p>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    ) : null}
                  </div>
                );
              })}
              {branches.map((branch) => {
                const isActive = branch.is_active !== false;
                const isMarkedToKeep = selectedBranchesToKeep.includes(branch.id);
                const isEditing = editingBranchId === branch.id;

                return (
                  <div
                    key={`legacy-${branch.id}`}
                    className="hidden"
                    style={{
                      borderColor: "var(--border-color)",
                      background:
                        isEditing
                          ? "linear-gradient(135deg, rgba(139,92,246,0.10), var(--bg-card))"
                          : "linear-gradient(135deg, rgba(37,99,235,0.04), var(--bg-card))",
                    }}
                  >
                    {hasExcess && isActive ? (
                      <label
                        className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium md:col-span-5"
                        style={{
                          borderColor: isMarkedToKeep
                            ? "rgba(16,185,129,0.34)"
                            : "rgba(244,63,94,0.34)",
                          background: isMarkedToKeep
                            ? "rgba(16,185,129,0.10)"
                            : "rgba(244,63,94,0.10)",
                          color: "var(--text-main)",
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={isMarkedToKeep}
                          onChange={() => toggleBranchSelection(branch.id)}
                          className="h-4 w-4 rounded"
                        />
                        Mantener activa
                      </label>
                    ) : null}

                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          {isEditing ? (
                            <div className="grid w-full gap-3 sm:grid-cols-2">
                              <div>
                                <label
                                  className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em]"
                                  style={{ color: "var(--text-muted)" }}
                                >
                                  Nombre
                                </label>
                                <input
                                  type="text"
                                  value={editForm.name}
                                  onChange={(e) =>
                                    setEditForm((prev) => ({
                                      ...prev,
                                      name: e.target.value,
                                    }))
                                  }
                                  className="h-11 w-full rounded-2xl border px-4 text-sm outline-none transition"
                                  style={{
                                    borderColor: "var(--border-color)",
                                    background: "var(--bg-card)",
                                    color: "var(--text-main)",
                                  }}
                                />
                              </div>

                              <div>
                                <label
                                  className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em]"
                                  style={{ color: "var(--text-muted)" }}
                                >
                                  Slug
                                </label>
                                <input
                                  type="text"
                                  value={editForm.slug}
                                  onChange={(e) =>
                                    setEditForm((prev) => ({
                                      ...prev,
                                      slug: e.target.value,
                                    }))
                                  }
                                  className="h-11 w-full rounded-2xl border px-4 text-sm outline-none transition"
                                  style={{
                                    borderColor: "var(--border-color)",
                                    background: "var(--bg-card)",
                                    color: "var(--text-main)",
                                  }}
                                />
                              </div>
                            </div>
                          ) : (
                            <h3
                              className="text-lg font-semibold tracking-tight"
                              style={{ color: "var(--text-main)" }}
                            >
                              {branch.name}
                            </h3>
                          )}

                          <span
                            className="rounded-full px-3 py-1 text-xs font-semibold"
                            style={{
                              background: isActive
                                ? hasExcess
                                  ? "rgba(249,115,22,0.14)"
                                  : "rgba(16,185,129,0.14)"
                                : "rgba(148,163,184,0.16)",
                              color: isActive
                                ? hasExcess
                                  ? "rgb(249 115 22)"
                                  : "rgb(16 185 129)"
                                : "var(--text-muted)",
                            }}
                          >
                            {isActive
                              ? hasExcess
                                ? "Exceso"
                                : "Activa"
                              : "Inactiva"}
                          </span>
                        </div>

                        <p
                          className="mt-2 text-sm"
                          style={{ color: "var(--text-muted)" }}
                        >
                          Usa esta sucursal en servicios, agenda y reservas públicas
                          cuando tengas multi-sucursal activo.
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {isEditing ? (
                          <>
                            <button
                              type="button"
                              onClick={() => handleUpdateBranch(branch.id)}
                              disabled={saving}
                              className="inline-flex h-10 items-center justify-center rounded-2xl px-4 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-60"
                              style={{
                                background:
                                  "linear-gradient(135deg, rgb(37 99 235), rgb(99 102 241))",
                              }}
                            >
                              Guardar
                            </button>

                            <button
                              type="button"
                              onClick={cancelEditBranch}
                              disabled={saving}
                              className="inline-flex h-10 items-center justify-center rounded-2xl border px-4 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-60"
                              style={{
                                borderColor: "var(--border-color)",
                                background: "var(--bg-card)",
                                color: "var(--text-main)",
                              }}
                            >
                              Cancelar
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              type="button"
                              onClick={() => beginEditBranch(branch)}
                              disabled={saving}
                              className="inline-flex h-10 items-center justify-center rounded-2xl border px-4 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-60"
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
                              onClick={() => handleToggleBranchActive(branch)}
                              disabled={saving || (branch.is_active === false && reachedLimit)}
                              className="inline-flex h-10 items-center justify-center rounded-2xl border px-4 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-60"
                              style={{
                                borderColor: isActive
                                  ? "rgba(244,63,94,0.34)"
                                  : "rgba(16,185,129,0.34)",
                                background: "var(--bg-card)",
                                color: isActive
                                  ? "rgb(244 63 94)"
                                  : "rgb(16 185 129)",
                              }}
                            >
                              {isActive ? "Desactivar" : "Activar"}
                            </button>
                          </>
                        )}

                        <Link
                          href={`/dashboard/${slug}/services`}
                          className="inline-flex h-10 items-center justify-center rounded-2xl border px-4 text-sm font-medium transition"
                          style={{
                            borderColor: "var(--border-color)",
                            background: "var(--bg-card)",
                            color: "var(--text-main)",
                          }}
                        >
                          Ver servicios
                        </Link>

                        <Link
                          href={`/dashboard/${slug}/agenda`}
                          className="inline-flex h-10 items-center justify-center rounded-2xl border px-4 text-sm font-medium transition"
                          style={{
                            borderColor: "var(--border-color)",
                            background: "var(--bg-card)",
                            color: "var(--text-main)",
                          }}
                        >
                          Ver agenda
                        </Link>
                      </div>
                    </div>

                    <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-4">
                      <div
                        className="rounded-2xl border px-4 py-3"
                        style={{
                          borderColor: "var(--border-color)",
                          background: "var(--bg-soft)",
                        }}
                      >
                        <p
                          className="text-xs font-semibold uppercase tracking-[0.16em]"
                          style={{ color: "var(--text-muted)" }}
                        >
                          ID
                        </p>
                        <p
                          className="mt-2 break-all text-sm font-semibold"
                          style={{ color: "var(--text-main)" }}
                        >
                          {branch.id}
                        </p>
                      </div>

                      <div
                        className="rounded-2xl border px-4 py-3"
                        style={{
                          borderColor: "var(--border-color)",
                          background: "var(--bg-soft)",
                        }}
                      >
                        <p
                          className="text-xs font-semibold uppercase tracking-[0.16em]"
                          style={{ color: "var(--text-muted)" }}
                        >
                          Slug
                        </p>
                        <p
                          className="mt-2 break-all text-sm font-semibold"
                          style={{ color: "var(--text-main)" }}
                        >
                          {branch.slug || "No disponible"}
                        </p>
                      </div>

                      <div
                        className="rounded-2xl border px-4 py-3"
                        style={{
                          borderColor: "var(--border-color)",
                          background: "var(--bg-soft)",
                        }}
                      >
                        <p
                          className="text-xs font-semibold uppercase tracking-[0.16em]"
                          style={{ color: "var(--text-muted)" }}
                        >
                          Creación
                        </p>
                        <p
                          className="mt-2 text-sm font-semibold"
                          style={{ color: "var(--text-main)" }}
                        >
                          {branch.created_at
                            ? new Date(branch.created_at).toLocaleDateString("es-CL")
                            : "No disponible"}
                        </p>
                      </div>

                      <div
                        className="rounded-2xl border px-4 py-3"
                        style={{
                          borderColor: "var(--border-color)",
                          background: "var(--bg-soft)",
                        }}
                      >
                        <p
                          className="text-xs font-semibold uppercase tracking-[0.16em]"
                          style={{ color: "var(--text-muted)" }}
                        >
                          Acciones
                        </p>

                        <button
                          type="button"
                          onClick={() => handleCopyId(branch.id)}
                          className="mt-2 inline-flex h-10 items-center justify-center rounded-2xl border px-4 text-sm font-medium transition"
                          style={{
                            borderColor: "var(--border-color)",
                            background: "var(--bg-card)",
                            color: "var(--text-main)",
                          }}
                        >
                          {copiedId === branch.id ? "ID copiado" : "Copiar ID"}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
              <div
                className="px-4 py-3 text-sm"
                style={{ color: "var(--text-muted)" }}
              >
                Mostrando {branches.length} de {branches.length} sucursales
              </div>
            </div>
          )}
        </Panel>

        <Panel
          title="Crear nueva sucursal"
          description="Agrega una sucursal para operar varias ubicaciones desde la misma cuenta."
          className="bg-[linear-gradient(180deg,rgba(139,92,246,0.08),transparent_40%)]"
        >
          <div className="space-y-5">
            <div
              className="rounded-2xl border p-4"
              style={{
                borderColor: "var(--border-color)",
                background:
                  "linear-gradient(135deg, rgba(139,92,246,0.10), var(--bg-soft))",
              }}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p
                    className="text-xs font-semibold uppercase tracking-[0.18em]"
                    style={{ color: "var(--text-muted)" }}
                  >
                    Plan actual
                  </p>
                  <h3
                    className="mt-2 text-xl font-semibold"
                    style={{ color: "var(--text-main)" }}
                  >
                    {planLabel}
                  </h3>
                  <p
                    className="mt-2 text-sm"
                    style={{ color: "var(--text-muted)" }}
                  >
                    Estás usando {activeBranchesCount} de {maxBranches} sucursales
                    disponibles.
                  </p>
                </div>

                <div
                  className="rounded-2xl border px-3 py-2 text-right"
                  style={{
                    borderColor: "var(--border-color)",
                    background: "var(--bg-card)",
                  }}
                >
                  <p
                    className="text-[11px] font-semibold uppercase tracking-[0.18em]"
                    style={{ color: "var(--text-muted)" }}
                  >
                    Estado
                  </p>
                  <p
                    className="mt-1 text-sm font-semibold"
                    style={{ color: "var(--text-main)" }}
                  >
                    {hasExcess
                      ? "Exceso"
                      : reachedLimit
                      ? "Límite alcanzado"
                      : "Disponible"}
                  </p>
                </div>
              </div>
            </div>

            {reachedLimit && !hasExcess ? (
              <Notice
                tone="limit"
                title="Llegaste al límite de sucursales de tu plan."
                description={`Tu plan ${planLabel} permite ${maxBranches} sucursal${
                  maxBranches === 1 ? "" : "es"
                } activa${maxBranches === 1 ? "" : "s"}.`}
              >
                <div className="space-y-2 text-sm" style={{ color: "var(--text-main)" }}>
                  <div>✔ Más sucursales por cuenta</div>
                  <div>✔ Mejor control por ubicación</div>
                  <div>✔ Escala tu operación sin mezclar agendas</div>
                </div>

                {nextPlanLabel ? (
                  <div className="mt-4">
                    <Link
                      href={`/planes?current_plan=${plan}&from=branches&slug=${slug}&tenant_id=${tenantId}`}
                      className="inline-flex h-11 w-full items-center justify-center rounded-2xl px-5 text-sm font-semibold text-white transition"
                      style={{
                        background:
                          "linear-gradient(135deg, rgb(139 92 246), rgb(59 130 246))",
                      }}
                    >
                      Subir a {nextPlanLabel}
                    </Link>
                  </div>
                ) : null}
              </Notice>
            ) : !hasExcess ? (
              <Notice
                tone="success"
                title="Todavía puedes crear más sucursales."
                description="Agrega una nueva ubicación y separa agenda, servicios y reservas públicas."
              />
            ) : null}

            <div>
              <label
                className="mb-2 block text-sm font-medium"
                style={{ color: "var(--text-main)" }}
              >
                Nombre de la sucursal
              </label>
              <input
                id="new-branch-name"
                type="text"
                value={form.name}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, name: e.target.value }))
                }
                placeholder="Ej: Sucursal Centro"
                disabled={saving || loading || reachedLimit || hasExcess}
                className="h-11 w-full rounded-2xl border px-4 text-sm outline-none transition disabled:cursor-not-allowed disabled:opacity-60"
                style={{
                  borderColor: "var(--border-color)",
                  background: "var(--bg-card)",
                  color: "var(--text-main)",
                }}
              />
            </div>

            <Notice
              tone="info"
              title="Qué desbloquea"
              description="Cada sucursal te ayuda a separar mejor tu operación."
            >
              <div className="space-y-2 text-sm" style={{ color: "var(--text-main)" }}>
                <div>✔ Agenda separada por sucursal</div>
                <div>✔ Servicios independientes por ubicación</div>
                <div>✔ Staff organizado según la sucursal</div>
                <div>✔ Reservas públicas diferenciadas</div>
              </div>
            </Notice>

            <button
              type="button"
              onClick={handleCreateBranch}
              disabled={saving || loading || reachedLimit || hasExcess}
              className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-2xl px-5 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-60"
              style={{
                background:
                  reachedLimit || hasExcess
                    ? "linear-gradient(135deg, rgba(100,116,139,0.9), rgba(71,85,105,0.9))"
                    : "linear-gradient(135deg, rgb(139 92 246), rgb(59 130 246))",
              }}
            >
              {!hasExcess && !reachedLimit && !saving ? (
                <Plus className="h-4 w-4" />
              ) : null}
              {hasExcess
                ? "Primero ajusta tus sucursales"
                : reachedLimit
                ? "Límite de sucursales alcanzado"
                : saving
                ? "Creando..."
                : "Crear sucursal"}
            </button>
          </div>
        </Panel>
      </section>

      <div
        className="flex flex-col gap-3 rounded-3xl border px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
        style={{
          borderColor: "var(--border-color)",
          background: "var(--bg-card)",
        }}
      >
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>
          La ID de tu negocio es{" "}
          <span className="font-semibold" style={{ color: "var(--text-main)" }}>
            {tenantId || "cargando..."}
          </span>
          . Compártela con soporte si necesitas ayuda.
        </p>
        <button
          type="button"
          onClick={() => handleCopyId(tenantId)}
          disabled={!tenantId}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-2xl border px-4 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-60"
          style={{
            borderColor: "var(--border-color)",
            background: "var(--bg-card)",
            color: "var(--text-main)",
          }}
        >
          <Copy className="h-4 w-4" />
          {copiedId === tenantId ? "ID copiada" : "Copiar ID"}
        </button>
      </div>
    </div>
  );
}

function formatBranchDate(dateString?: string | null) {
  if (!dateString) return "No disponible";

  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return "No disponible";

  return date.toLocaleDateString("es-CL", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
