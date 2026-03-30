"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { Panel } from "../../../../components/dashboard/panel";

const BACKEND_URL = "https://orbyx-backend.onrender.com";

type CustomerSegment = "new" | "recurrent" | "frequent" | "inactive";
type CampaignChannel = "email" | "whatsapp";
type CampaignSort = "oldest" | "recent" | "most_visits" | "least_visits";
type PlanSlug = "pro" | "premium" | "vip" | "platinum" | "starter";
type HistoryPeriod = "all" | "7d" | "30d" | "this_month" | "custom";
type HistoryPerformance = "all" | "excellent" | "good" | "warning" | "failed";
type EmailVisualPreset = "minimal" | "promo" | "reminder";
type CampaignImageItem = {
  id: string;
  tenant_id: string;
  file_name: string | null;
  file_path: string;
  public_url: string | null;
  mime_type: string | null;
  size_bytes: number | null;
  file_ext?: string | null;
  created_at: string;
};

type BusinessResponse = {
  business: {
    id: string;
    name: string;
    slug: string;
    plan_slug?: string;
  };
};

type Customer = {
  id: string;
  tenant_id: string;
  name: string;
  email: string | null;
  phone: string | null;
  last_visit_at: string | null;
  total_visits: number;
  created_at: string;
  updated_at: string;
  segment?: CustomerSegment;
  is_inactive?: boolean;
};

type CustomersResponse = {
  total: number;
  customers: Customer[];
  summary?: {
    total: number;
    nuevos: number;
    recurrentes: number;
    frecuentes: number;
    inactivos: number;
  };
  filters?: {
    q?: string;
    segment?: string | null;
    inactive_days?: number;
  };
  error?: string;
};

type SendEmailResponse = {
  ok?: boolean;
  campaign_name?: string | null;
  channel?: string;
  slug?: string;
  plan?: string;
  plan_limit?: number;
  requested_limit?: number;
  applied_limit?: number;
  sort?: string;
  segment?: string;
  inactive_days?: number;
  audience_total?: number;
  recipients_with_email?: number;
  sent?: number;
  failed?: number;
  errors?: Array<{
    customer_id: string;
    email: string;
    error: string;
  }>;
  error?: string;
};

type CampaignHistoryItem = {
  id: string;
  tenant_id: string;
  campaign_name: string | null;
  channel: CampaignChannel;
  segment: CustomerSegment;
  inactive_days: number;
  subject: string | null;
  message: string | null;
  sort: CampaignSort;
  plan_slug: string | null;
  plan_limit: number;
  requested_limit: number;
  applied_limit: number;
  audience_total: number;
  recipients_with_contact: number;
  sent_count: number;
  failed_count: number;
  created_at: string;
};

type CampaignHistoryResponse = {
  total: number;
  campaigns: CampaignHistoryItem[];
  error?: string;
};

const PLAN_LABELS: Record<PlanSlug, string> = {
  starter: "Pro",
  pro: "Pro",
  premium: "Premium",
  vip: "VIP",
  platinum: "Platinum",
};

const PLAN_EMAIL_LIMITS: Record<PlanSlug, number> = {
  starter: 50,
  pro: 50,
  premium: 150,
  vip: 400,
  platinum: 1000,
};

const PLAN_IMAGE_LIMITS: Record<PlanSlug, number> = {
  starter: 7,
  pro: 7,
  premium: 15,
  vip: 30,
  platinum: 100,
};

const SEGMENT_OPTIONS: Array<{
  key: CustomerSegment;
  label: string;
  description: string;
}> = [
  {
    key: "new",
    label: "Nuevos",
    description: "Clientes recientes o de primera visita.",
  },
  {
    key: "recurrent",
    label: "Recurrentes",
    description: "Clientes que ya volvieron más de una vez.",
  },
  {
    key: "frequent",
    label: "Frecuentes",
    description: "Clientes con alta recurrencia.",
  },
  {
    key: "inactive",
    label: "Inactivos",
    description: "Clientes sin actividad en una ventana de días.",
  },
];

const CHANNEL_OPTIONS: Array<{
  key: CampaignChannel;
  label: string;
  description: string;
}> = [
  {
    key: "email",
    label: "Email",
    description: "Campañas por correo electrónico.",
  },
  {
    key: "whatsapp",
    label: "WhatsApp",
    description: "Base lista para campañas y recuperación futura.",
  },
];

const SORT_OPTIONS: Array<{
  key: CampaignSort;
  label: string;
  description: string;
}> = [
  {
    key: "oldest",
    label: "Más antiguos",
    description: "Prioriza clientes con visita más antigua.",
  },
  {
    key: "recent",
    label: "Más recientes",
    description: "Prioriza clientes con visita más reciente.",
  },
  {
    key: "most_visits",
    label: "Más visitas",
    description: "Prioriza clientes más frecuentes.",
  },
  {
    key: "least_visits",
    label: "Menos visitas",
    description: "Prioriza clientes menos recurrentes.",
  },
];

const INACTIVE_OPTIONS = [
  { value: "30", label: "30 días" },
  { value: "60", label: "60 días" },
  { value: "90", label: "90 días" },
  { value: "120", label: "120+ días" },
];

function normalizePlan(plan?: string): PlanSlug {
  const value = (plan || "").toLowerCase();
  if (value === "premium") return "premium";
  if (value === "vip") return "vip";
  if (value === "platinum") return "platinum";
  if (value === "pro") return "pro";
  return "starter";
}

function formatDate(value?: string | null) {
  if (!value) return "Sin fecha";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Sin fecha";
  return new Intl.DateTimeFormat("es-CL", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function formatLastVisit(value?: string | null) {
  if (!value) return "Sin visitas";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Sin visitas";
  return new Intl.DateTimeFormat("es-CL", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function formatBytes(value?: number | null) {
  const size = Number(value || 0);
  if (!size) return "0 KB";
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / (1024 * 1024)).toFixed(2)} MB`;
}

function getImageDisplayName(image: CampaignImageItem) {
  return image.file_name || "Imagen";
}

function getCustomerSegmentMeta(segment?: string) {
  if (segment === "frequent") {
    return {
      label: "Frecuente",
      bg: "rgba(16,185,129,0.14)",
      border: "rgba(16,185,129,0.28)",
      color: "rgb(16 185 129)",
    };
  }

  if (segment === "recurrent") {
    return {
      label: "Recurrente",
      bg: "rgba(14,165,233,0.14)",
      border: "rgba(14,165,233,0.28)",
      color: "rgb(14 165 233)",
    };
  }

  if (segment === "inactive") {
    return {
      label: "Inactivo",
      bg: "rgba(244,63,94,0.14)",
      border: "rgba(244,63,94,0.28)",
      color: "rgb(244 63 94)",
    };
  }

  return {
    label: "Nuevo",
    bg: "rgba(245,158,11,0.14)",
    border: "rgba(245,158,11,0.28)",
    color: "rgb(245 158 11)",
  };
}

function getChannelMeta(channel?: string) {
  if (channel === "whatsapp") {
    return {
      label: "WhatsApp",
      bg: "rgba(16,185,129,0.14)",
      border: "rgba(16,185,129,0.28)",
      color: "rgb(16 185 129)",
    };
  }

  return {
    label: "Email",
    bg: "rgba(139,92,246,0.14)",
    border: "rgba(139,92,246,0.28)",
    color: "rgb(139 92 246)",
  };
}

function getPerformanceBucket(
  rate: number,
  failedCount: number
): HistoryPerformance {
  if (rate === 0 && failedCount > 0) return "failed";
  if (rate >= 90) return "excellent";
  if (rate >= 70) return "good";
  if (rate > 0) return "warning";
  return "failed";
}

function getPerformanceMeta(rate: number, failedCount: number) {
  const bucket = getPerformanceBucket(rate, failedCount);

  if (bucket === "excellent") {
    return {
      label: "Excelente",
      bg: "rgba(16,185,129,0.14)",
      border: "rgba(16,185,129,0.28)",
      color: "rgb(16 185 129)",
    };
  }

  if (bucket === "good") {
    return {
      label: "Bueno",
      bg: "rgba(14,165,233,0.14)",
      border: "rgba(14,165,233,0.28)",
      color: "rgb(14 165 233)",
    };
  }

  if (bucket === "warning") {
    return {
      label: "Regular",
      bg: "rgba(245,158,11,0.14)",
      border: "rgba(245,158,11,0.28)",
      color: "rgb(245 158 11)",
    };
  }

  return {
    label: "Fallido",
    bg: "rgba(244,63,94,0.14)",
    border: "rgba(244,63,94,0.28)",
    color: "rgb(244 63 94)",
  };
}

function getSortLabel(sort?: string) {
  return SORT_OPTIONS.find((item) => item.key === sort)?.label || "Sin orden";
}

function getSegmentLabel(segment?: string) {
  return SEGMENT_OPTIONS.find((item) => item.key === segment)?.label || "Segmento";
}

function getPlanLabel(plan?: string | null) {
  return PLAN_LABELS[normalizePlan(plan || "starter")];
}

function getSuccessRate(item: CampaignHistoryItem) {
  const base = Number(item.applied_limit || 0);
  if (base <= 0) return 0;
  return Math.round((Number(item.sent_count || 0) / base) * 100);
}

function isDateWithinPeriod(
  dateValue: string,
  period: HistoryPeriod,
  customFrom: string,
  customTo: string
) {
  const itemDate = new Date(dateValue);
  if (Number.isNaN(itemDate.getTime())) return false;

  const now = new Date();

  if (period === "all") return true;

  if (period === "7d") {
    const min = new Date(now);
    min.setDate(now.getDate() - 7);
    return itemDate.getTime() >= min.getTime();
  }

  if (period === "30d") {
    const min = new Date(now);
    min.setDate(now.getDate() - 30);
    return itemDate.getTime() >= min.getTime();
  }

  if (period === "this_month") {
    return (
      itemDate.getFullYear() === now.getFullYear() &&
      itemDate.getMonth() === now.getMonth()
    );
  }

  if (period === "custom") {
    const from = customFrom ? new Date(`${customFrom}T00:00:00`) : null;
    const to = customTo ? new Date(`${customTo}T23:59:59`) : null;

    if (from && !Number.isNaN(from.getTime()) && itemDate.getTime() < from.getTime()) {
      return false;
    }

    if (to && !Number.isNaN(to.getTime()) && itemDate.getTime() > to.getTime()) {
      return false;
    }

    return true;
  }

  return true;
}

function SectionStat({
  label,
  value,
  helper,
}: {
  label: string;
  value: string;
  helper: string;
}) {
  return (
    <div
      className="rounded-2xl border p-4"
      style={{
        borderColor: "var(--border-color)",
        background:
          "linear-gradient(135deg, rgba(37,99,235,0.08), var(--bg-soft))",
      }}
    >
      <p
        className="text-[11px] font-semibold uppercase tracking-[0.16em]"
        style={{ color: "var(--text-muted)" }}
      >
        {label}
      </p>
      <p
        className="mt-2 text-2xl font-semibold"
        style={{ color: "var(--text-main)" }}
      >
        {value}
      </p>
      <p className="mt-2 text-sm leading-6" style={{ color: "var(--text-muted)" }}>
        {helper}
      </p>
    </div>
  );
}

function SelectableRow({
  active,
  title,
  description,
  onClick,
}: {
  active: boolean;
  title: string;
  description: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-start gap-3 px-1 py-2 text-left transition"
      style={{
        background: "transparent",
      }}
    >
      <span
        className="mt-1 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full border"
        style={{
          borderColor: active ? "rgb(37 99 235)" : "var(--border-color)",
          background: active ? "rgba(37,99,235,0.08)" : "transparent",
        }}
      >
        <span
          className="h-2.5 w-2.5 rounded-full"
          style={{
            background: active ? "rgb(37 99 235)" : "transparent",
          }}
        />
      </span>

      <span className="min-w-0 flex-1">
        <span
          className="block text-sm font-semibold"
          style={{ color: "var(--text-main)" }}
        >
          {title}
        </span>
        <span
          className="mt-1 block text-sm leading-6"
          style={{ color: "var(--text-muted)" }}
        >
          {description}
        </span>
      </span>
    </button>
  );
}
function SoftChip({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-full px-3 py-2 text-xs font-semibold transition"
      style={{
        background: active
          ? "linear-gradient(135deg, rgb(37 99 235), rgb(14 165 233))"
          : "var(--bg-soft)",
        color: active ? "#ffffff" : "var(--text-main)",
        border: active ? "1px solid rgba(37,99,235,0.34)" : "1px solid var(--border-color)",
      }}
    >
      {label}
    </button>
  );
}

function HistorySkeleton() {
  return (
    <div className="space-y-4 p-4">
      {Array.from({ length: 4 }).map((_, index) => (
        <div
          key={index}
          className="rounded-2xl border p-4"
          style={{
            borderColor: "var(--border-color)",
            background: "var(--bg-card)",
          }}
        >
          <div
            className="h-4 w-40 animate-pulse rounded"
            style={{ background: "var(--bg-soft)" }}
          />
          <div
            className="mt-3 h-4 w-56 animate-pulse rounded"
            style={{ background: "var(--bg-soft)" }}
          />
          <div
            className="mt-2 h-4 w-72 animate-pulse rounded"
            style={{ background: "var(--bg-soft)" }}
          />
        </div>
      ))}
    </div>
  );
}

export default function CampaignsPage() {
  const params = useParams();
  const slug =
    ((params as { slug?: string })?.slug as string) ||
    ((params as { Slug?: string })?.Slug as string) ||
    "";

  const [businessName, setBusinessName] = useState("Orbyx");
  const [plan, setPlan] = useState<PlanSlug>("starter");
  const [channel, setChannel] = useState<CampaignChannel>("email");
  const [segment, setSegment] = useState<CustomerSegment>("inactive");
  const [inactiveDays, setInactiveDays] = useState("120");
  const [sendLimit, setSendLimit] = useState("50");
  const [sort, setSort] = useState<CampaignSort>("oldest");
  const [campaignName, setCampaignName] = useState("");
  const [subject, setSubject] = useState("Te extrañamos en nuestro negocio");
  const [message, setMessage] = useState(
    "Hola {{nombre}}, queremos invitarte a volver. Tenemos horas disponibles y nos encantaría atenderte nuevamente."
  );

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loadingAudience, setLoadingAudience] = useState(true);
  const [sending, setSending] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [error, setError] = useState("");
  const [resultMessage, setResultMessage] = useState("");
  const [sendSummary, setSendSummary] = useState<SendEmailResponse | null>(null);

  const [history, setHistory] = useState<CampaignHistoryItem[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [historyError, setHistoryError] = useState("");

  const [historyPeriod, setHistoryPeriod] = useState<HistoryPeriod>("30d");
  const [historyChannel, setHistoryChannel] = useState<"all" | CampaignChannel>("all");
  const [historySegment, setHistorySegment] = useState<"all" | CustomerSegment>("all");
  const [historyPerformance, setHistoryPerformance] =
    useState<HistoryPerformance>("all");
  const [historySearch, setHistorySearch] = useState("");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");

  const [emailPreset, setEmailPreset] = useState<EmailVisualPreset>("promo");
  const [brandColor, setBrandColor] = useState("#0f766e");
  const [heroImageUrl, setHeroImageUrl] = useState("");
  const [ctaText, setCtaText] = useState("Agendar visita");
  const [ctaUrl, setCtaUrl] = useState("");
  const [showCta, setShowCta] = useState(true);
  const [footerNote, setFooterNote] = useState(
    "Te esperamos para ayudarte a mantener tu agenda más activa."
  );
  const [campaignImages, setCampaignImages] = useState<CampaignImageItem[]>([]);
  const [imagesLoading, setImagesLoading] = useState(false);
  const [imageUploading, setImageUploading] = useState(false);
  const [imageDeletingId, setImageDeletingId] = useState<string | null>(null);
  const [imageLibraryOpen, setImageLibraryOpen] = useState(false);
  const [imageLibraryError, setImageLibraryError] = useState("");
  const [imageLibraryMessage, setImageLibraryMessage] = useState("");
  const [imagesLimitInfo, setImagesLimitInfo] = useState({ current: 0, max: 7 });

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

  const planLimit = PLAN_EMAIL_LIMITS[plan];
  const planImageLimit = PLAN_IMAGE_LIMITS[plan];

  const availableLimitOptions = ["10", "25", "50", "100", "150", "400", "1000"]
    .map(Number)
    .filter((value) => value <= planLimit)
    .map(String);

  useEffect(() => {
    if (slug) {
      setCtaUrl(`https://www.orbyx.cl/${slug}`);
    }
  }, [slug]);

  useEffect(() => {
    if (emailPreset === "minimal") {
      setBrandColor("#0f172a");
      setShowCta(true);
      setCtaText("Reservar hora");
      setFooterNote("Gracias por seguir confiando en nosotros.");
    }

    if (emailPreset === "promo") {
      setBrandColor("#0f766e");
      setShowCta(true);
      setCtaText("Agendar visita");
      setFooterNote("Te esperamos para ayudarte a mantener tu agenda más activa.");
    }

    if (emailPreset === "reminder") {
      setBrandColor("#1d4ed8");
      setShowCta(true);
      setCtaText("Ver horas disponibles");
      setFooterNote("Recuerda que tenemos agenda disponible para ti.");
    }
  }, [emailPreset]);

  useEffect(() => {
    async function loadBusinessPlan() {
      try {
        const res = await fetch(`${BACKEND_URL}/public/business/${slug}`);
        const data: BusinessResponse | { error?: string } = await res.json();

        if (res.ok && "business" in data) {
          const normalizedPlan = normalizePlan(data.business.plan_slug);
          setPlan(normalizedPlan);
          setBusinessName(data.business.name || "Orbyx");
        }
      } catch {
        //
      }
    }

    if (slug) {
      loadBusinessPlan();
    }
  }, [slug]);

  useEffect(() => {
    if (!availableLimitOptions.includes(sendLimit)) {
      setSendLimit(String(planLimit));
    }
  }, [sendLimit, availableLimitOptions, planLimit]);

  useEffect(() => {
    async function loadAudience() {
      try {
        setLoadingAudience(true);
        setError("");
        setResultMessage("");
        setSendSummary(null);

        const params = new URLSearchParams();
        params.set("segment", segment);
        params.set("inactive_days", inactiveDays);

        const res = await fetch(
          `${BACKEND_URL}/customers/${slug}?${params.toString()}`
        );

        const data: CustomersResponse = await res.json();

        if (!res.ok) {
          throw new Error(data?.error || "No se pudo cargar la audiencia");
        }

        setCustomers(Array.isArray(data.customers) ? data.customers : []);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Error cargando audiencia");
        setCustomers([]);
      } finally {
        setLoadingAudience(false);
      }
    }

    if (slug) {
      loadAudience();
    }
  }, [slug, segment, inactiveDays]);

  async function loadCampaignHistory(currentSlug: string) {
    try {
      setLoadingHistory(true);
      setHistoryError("");

      const res = await fetch(`${BACKEND_URL}/campaigns/history/${currentSlug}`);
      const data: CampaignHistoryResponse = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "No se pudo cargar el historial");
      }

      setHistory(Array.isArray(data.campaigns) ? data.campaigns : []);
    } catch (err: unknown) {
      setHistoryError(err instanceof Error ? err.message : "Error cargando historial");
      setHistory([]);
    } finally {
      setLoadingHistory(false);
    }
  }

  async function loadCampaignImages(currentSlug: string, keepMessage = false) {
    try {
      setImagesLoading(true);
      setImageLibraryError("");
      if (!keepMessage) {
        setImageLibraryMessage("");
      }

      const res = await fetch(`${BACKEND_URL}/campaign-images/${currentSlug}`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "No se pudo cargar la biblioteca");
      }

      setCampaignImages(Array.isArray(data.images) ? data.images : []);
      setImagesLimitInfo({
        current: Number(data?.limits?.current_count || 0),
        max: Number(data?.limits?.max_images || planImageLimit),
      });
    } catch (err: unknown) {
      setImageLibraryError(err instanceof Error ? err.message : "Error cargando imágenes");
      setCampaignImages([]);
    } finally {
      setImagesLoading(false);
    }
  }

  async function handleUploadCampaignImage(file: File) {
    try {
      setImageLibraryError("");
      setImageLibraryMessage("");

      const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
      const fileExtension = file.name.split(".").pop()?.toLowerCase() || "";
      const allowedExtensions = ["jpg", "jpeg", "png", "webp"];

      if (!allowedTypes.includes(file.type) || !allowedExtensions.includes(fileExtension)) {
        throw new Error("Solo puedes subir archivos jpg, jpeg, png o webp");
      }

      if (file.size > 2 * 1024 * 1024) {
        throw new Error("La imagen supera el máximo permitido de 2 MB");
      }

      if (imagesLimitInfo.current >= imagesLimitInfo.max) {
        throw new Error(`Llegaste al límite de imágenes de tu plan (${imagesLimitInfo.max})`);
      }

      const formData = new FormData();
      formData.append("slug", slug);
      formData.append("file", file);

      setImageUploading(true);

      const res = await fetch(`${BACKEND_URL}/upload/campaign-image`, {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "No se pudo subir la imagen");
      }

      setImageLibraryMessage("Imagen subida correctamente.");

      if (data?.image?.public_url) {
        setHeroImageUrl(data.image.public_url);
      }

      await loadCampaignImages(slug, true);
    } catch (err: unknown) {
      setImageLibraryError(err instanceof Error ? err.message : "Error subiendo imagen");
    } finally {
      setImageUploading(false);
    }
  }

  async function handleDeleteCampaignImage(imageId: string) {
    try {
      setImageDeletingId(imageId);
      setImageLibraryError("");
      setImageLibraryMessage("");

      const res = await fetch(`${BACKEND_URL}/campaign-images/${imageId}?slug=${encodeURIComponent(slug)}`, {
        method: "DELETE",
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "No se pudo eliminar la imagen");
      }

      const removed = campaignImages.find((item) => item.id === imageId);

      if (removed?.public_url && heroImageUrl === removed.public_url) {
        setHeroImageUrl("");
      }

      setImageLibraryMessage("Imagen eliminada correctamente.");
      await loadCampaignImages(slug, true);
    } catch (err: unknown) {
      setImageLibraryError(err instanceof Error ? err.message : "Error eliminando imagen");
    } finally {
      setImageDeletingId(null);
    }
  }

  useEffect(() => {
    if (slug) {
      loadCampaignHistory(slug);
      loadCampaignImages(slug);
    }
  }, [slug]);

  const audienceStats = useMemo(() => {
    const total = customers.length;
    const withEmail = customers.filter((c) => !!c.email).length;
    const withWhatsapp = customers.filter((c) => !!c.phone).length;
    const availableForChannel = channel === "email" ? withEmail : withWhatsapp;

    return {
      total,
      withEmail,
      withWhatsapp,
      availableForChannel,
    };
  }, [customers, channel]);

  const limitedAudienceCount = useMemo(() => {
    return Math.min(Number(sendLimit || 50), audienceStats.availableForChannel || 0);
  }, [sendLimit, audienceStats.availableForChannel]);

  const previewRecipients = useMemo(() => {
    const filtered =
      channel === "email"
        ? customers.filter((customer) => !!customer.email)
        : customers.filter((customer) => !!customer.phone);

    return filtered.slice(0, 6);
  }, [customers, channel]);

  const filteredHistory = useMemo(() => {
    return history.filter((item) => {
      const successRate = getSuccessRate(item);
      const performanceBucket = getPerformanceBucket(successRate, item.failed_count);
      const search = historySearch.trim().toLowerCase();

      const matchesPeriod = isDateWithinPeriod(
        item.created_at,
        historyPeriod,
        customFrom,
        customTo
      );

      const matchesChannel =
        historyChannel === "all" || item.channel === historyChannel;

      const matchesSegment =
        historySegment === "all" || item.segment === historySegment;

      const matchesPerformance =
        historyPerformance === "all" || performanceBucket === historyPerformance;

      const searchableText = [
        item.campaign_name || "",
        item.subject || "",
        item.message || "",
        item.channel || "",
        item.segment || "",
        item.sort || "",
        item.plan_slug || "",
      ]
        .join(" ")
        .toLowerCase();

      const matchesSearch = !search || searchableText.includes(search);

      return (
        matchesPeriod &&
        matchesChannel &&
        matchesSegment &&
        matchesPerformance &&
        matchesSearch
      );
    });
  }, [
    history,
    historyPeriod,
    customFrom,
    customTo,
    historyChannel,
    historySegment,
    historyPerformance,
    historySearch,
  ]);

  const historyStats = useMemo(() => {
    const total = filteredHistory.length;
    const totalSent = filteredHistory.reduce(
      (acc, item) => acc + Number(item.sent_count || 0),
      0
    );
    const totalApplied = filteredHistory.reduce(
      (acc, item) => acc + Number(item.applied_limit || 0),
      0
    );
    const avgSuccess =
      totalApplied > 0 ? Math.round((totalSent / totalApplied) * 100) : 0;

    const latest = filteredHistory[0] || null;

    return {
      total,
      totalSent,
      avgSuccess,
      latest,
    };
  }, [filteredHistory]);

  const selectedSegmentLabel =
    SEGMENT_OPTIONS.find((item) => item.key === segment)?.label || "Segmento";

  const selectedChannelLabel =
    CHANNEL_OPTIONS.find((item) => item.key === channel)?.label || "Canal";

  const selectedSortLabel =
    SORT_OPTIONS.find((item) => item.key === sort)?.label || "Más antiguos";

  const emailPreviewTitle =
    campaignName.trim() || subject.trim() || "Campaña de Orbyx";

  function resetHistoryFilters() {
    setHistoryPeriod("30d");
    setHistoryChannel("all");
    setHistorySegment("all");
    setHistoryPerformance("all");
    setHistorySearch("");
    setCustomFrom("");
    setCustomTo("");
  }

  function handleOpenConfirm() {
    setError("");
    setResultMessage("");
    setSendSummary(null);

    if (channel !== "email") {
      setError("WhatsApp quedará listo visualmente, pero el envío real sigue pendiente.");
      return;
    }

    if (!subject.trim()) {
      setError("Debes ingresar un asunto.");
      return;
    }

    if (!message.trim()) {
      setError("Debes ingresar un mensaje.");
      return;
    }

    if (limitedAudienceCount <= 0) {
      setError("No hay correos disponibles para enviar con esta segmentación.");
      return;
    }

    setConfirmOpen(true);
  }

  async function handleSendCampaignConfirmed() {
    try {
      setSending(true);
      setConfirmOpen(false);
      setError("");
      setResultMessage("");
      setSendSummary(null);

      const res = await fetch(`${BACKEND_URL}/campaigns/send-email`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          slug,
          channel,
          campaign_name: campaignName.trim() || null,
          segment,
          inactive_days: Number(inactiveDays),
          subject: subject.trim(),
          message: message.trim(),
          limit: Number(sendLimit),
          sort,
          brand_color: brandColor,
          hero_image_url: heroImageUrl.trim(),
          cta_text: ctaText.trim(),
          cta_url: ctaUrl.trim(),
          show_cta: showCta,
          footer_note: footerNote.trim(),
        }),
      });

      const data: SendEmailResponse = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "No se pudo enviar la campaña");
      }

      setSendSummary(data);
      setResultMessage(
        `Campaña enviada. Correos enviados: ${data.sent || 0}. Fallidos: ${
          data.failed || 0
        }.`
      );

      if (slug) {
        await loadCampaignHistory(slug);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error enviando campaña");
    } finally {
      setSending(false);
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
              Campañas
            </p>

            <h1
              className="text-3xl font-semibold tracking-tight sm:text-4xl"
              style={{ color: "var(--text-main)" }}
            >
              Campañas y recuperación
            </h1>

            <p
              className="mt-3 max-w-2xl text-sm leading-6 sm:text-[15px]"
              style={{ color: "var(--text-muted)" }}
            >
              Prepara campañas por email, organiza tu audiencia real y deja lista
              la base para recuperación automática y WhatsApp.
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
              <p
                className="text-[11px] font-semibold uppercase tracking-[0.16em]"
                style={{ color: "var(--text-muted)" }}
              >
                Plan actual
              </p>
              <p className="mt-2 text-sm font-semibold">{PLAN_LABELS[plan]}</p>
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
                Límite por campaña
              </p>
              <p className="mt-2 text-sm font-semibold">{planLimit} contactos</p>
            </div>
          </div>
        </div>
      </section>

      {error ? (
        <div
          className="rounded-2xl border px-4 py-3 text-sm shadow-sm"
          style={{
            borderColor: "rgba(244,63,94,0.28)",
            background: "rgba(244,63,94,0.10)",
            color: "rgb(251 113 133)",
          }}
        >
          {error}
        </div>
      ) : null}

      {resultMessage ? (
        <div
          className="rounded-2xl border px-4 py-3 text-sm shadow-sm"
          style={{
            borderColor: "rgba(16,185,129,0.28)",
            background: "rgba(16,185,129,0.10)",
            color: "rgb(52 211 153)",
          }}
        >
          {resultMessage}
        </div>
      ) : null}

      <section className="grid gap-4 xl:grid-cols-4">
        <SectionStat
          label="Canal"
          value={selectedChannelLabel}
          helper="Canal elegido para esta campaña."
        />
        <SectionStat
          label="Segmento"
          value={selectedSegmentLabel}
          helper="Grupo de clientes elegido."
        />
        <SectionStat
          label="Listos para enviar"
          value={loadingAudience ? "..." : String(audienceStats.availableForChannel)}
          helper={
            channel === "email"
              ? "Clientes con correo disponible."
              : "Clientes con teléfono disponible."
          }
        />
        <SectionStat
          label="Se enviarán"
          value={loadingAudience ? "..." : String(limitedAudienceCount)}
          helper="Tope real según filtro, canal y límite."
        />
      </section>

      <div className="grid gap-6 2xl:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-6">
          <Panel
            title="Configuración de campaña"
            description="Define canal, segmento, nivel de inactividad, prioridad y cantidad."
            className="bg-[linear-gradient(180deg,rgba(37,99,235,0.08),transparent_35%)]"
          >
            <div className="space-y-6">
              <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
                <div>
                  <label
                    className="mb-3 block text-sm font-medium"
                    style={{ color: "var(--text-main)" }}
                  >
                    Canal
                  </label>

                  <div className="space-y-3">
                    {CHANNEL_OPTIONS.map((item) => (
                      <SelectableRow
                        key={item.key}
                        active={channel === item.key}
                        title={item.label}
                        description={item.description}
                        onClick={() => setChannel(item.key)}
                      />
                    ))}
                  </div>
                </div>

                <div>
                  <label
                    className="mb-3 block text-sm font-medium"
                    style={{ color: "var(--text-main)" }}
                  >
                    Segmento
                  </label>

                 <div className="space-y-2">
  {SEGMENT_OPTIONS.map((item) => (
                      <SelectableRow
                        key={item.key}
                        active={segment === item.key}
                        title={item.label}
                        description={item.description}
                        onClick={() => setSegment(item.key)}
                      />
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div>
                  <label
                    className="mb-2 block text-sm font-medium"
                    style={{ color: "var(--text-main)" }}
                  >
                    Inactivos en
                  </label>

                  <select
                    value={inactiveDays}
                    onChange={(e) => setInactiveDays(e.target.value)}
                    className={selectClass}
                    style={{
                      borderColor: "var(--border-color)",
                      background: "var(--bg-card)",
                      color: "var(--text-main)",
                    }}
                  >
                    {INACTIVE_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    className="mb-2 block text-sm font-medium"
                    style={{ color: "var(--text-main)" }}
                  >
                    Cantidad a enviar
                  </label>

                  <select
                    value={sendLimit}
                    onChange={(e) => setSendLimit(e.target.value)}
                    className={selectClass}
                    style={{
                      borderColor: "var(--border-color)",
                      background: "var(--bg-card)",
                      color: "var(--text-main)",
                    }}
                  >
                    {availableLimitOptions.map((option) => (
                      <option key={option} value={option}>
                        {option} destinatarios
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    className="mb-2 block text-sm font-medium"
                    style={{ color: "var(--text-main)" }}
                  >
                    Prioridad de envío
                  </label>

                  <select
                    value={sort}
                    onChange={(e) => setSort(e.target.value as CampaignSort)}
                    className={selectClass}
                    style={{
                      borderColor: "var(--border-color)",
                      background: "var(--bg-card)",
                      color: "var(--text-main)",
                    }}
                  >
                    {SORT_OPTIONS.map((option) => (
                      <option key={option.key} value={option.key}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div
                className="rounded-2xl border p-4"
                style={{
                  borderColor: "var(--border-color)",
                  background:
                    "linear-gradient(135deg, rgba(37,99,235,0.08), var(--bg-soft))",
                }}
              >
                <p
                  className="text-sm font-semibold"
                  style={{ color: "var(--text-main)" }}
                >
                  Regla actual del envío
                </p>

                <div
                  className="mt-3 space-y-2 text-sm leading-6"
                  style={{ color: "var(--text-muted)" }}
                >
                  <p>
                    Tu plan <span style={{ color: "var(--text-main)", fontWeight: 700 }}>{PLAN_LABELS[plan]}</span> permite hasta{" "}
                    <span style={{ color: "var(--text-main)", fontWeight: 700 }}>{planLimit}</span> contactos por campaña.
                  </p>
                  <p>
                    El sistema intentará enviar hasta{" "}
                    <span style={{ color: "var(--text-main)", fontWeight: 700 }}>{sendLimit}</span> contactos,
                    ordenados por{" "}
                    <span style={{ color: "var(--text-main)", fontWeight: 700 }}>{selectedSortLabel}</span>.
                  </p>
                  <p>
                    Con la audiencia actual, el alcance real sería de{" "}
                    <span style={{ color: "var(--text-main)", fontWeight: 700 }}>{limitedAudienceCount}</span>{" "}
                    contactos por este canal.
                  </p>
                </div>
              </div>
            </div>
          </Panel>

          <Panel
            title="Email"
            description="Separa el contenido del mensaje del estilo visual para que quede más profesional."
            className="bg-[linear-gradient(180deg,rgba(14,165,233,0.05),transparent_35%)]"
          >
            <div className="space-y-5">
              <div>
                <label
                  className="mb-2 block text-sm font-medium"
                  style={{ color: "var(--text-main)" }}
                >
                  Nombre interno de campaña
                </label>
                <input
                  type="text"
                  value={campaignName}
                  onChange={(e) => setCampaignName(e.target.value)}
                  placeholder="Ej: Reactivación 120+ días"
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
                  Asunto
                </label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Ej: Te extrañamos, vuelve cuando quieras"
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
                  Mensaje
                </label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Escribe el contenido principal del correo..."
                  className={textareaClass}
                  style={{
                    borderColor: "var(--border-color)",
                    background: "var(--bg-card)",
                    color: "var(--text-main)",
                  }}
                />
                <p className="mt-2 text-xs" style={{ color: "var(--text-muted)" }}>
                  Puedes dejar preparado el placeholder <strong>{"{{nombre}}"}</strong> para personalización futura.
                </p>
              </div>
            </div>
          </Panel>

          <Panel
            title="Estilo del email"
            description="Branding visual, CTA, banner y nota final."
            className="bg-[linear-gradient(180deg,rgba(37,99,235,0.05),transparent_35%)]"
          >
            <div className="space-y-5">
              <div>
                <label
                  className="mb-3 block text-sm font-medium"
                  style={{ color: "var(--text-main)" }}
                >
                  Plantilla visual
                </label>

                <div className="flex flex-wrap gap-2">
                  <SoftChip
                    active={emailPreset === "minimal"}
                    label="Minimal"
                    onClick={() => setEmailPreset("minimal")}
                  />
                  <SoftChip
                    active={emailPreset === "promo"}
                    label="Promo"
                    onClick={() => setEmailPreset("promo")}
                  />
                  <SoftChip
                    active={emailPreset === "reminder"}
                    label="Recordatorio"
                    onClick={() => setEmailPreset("reminder")}
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label
                    className="mb-2 block text-sm font-medium"
                    style={{ color: "var(--text-main)" }}
                  >
                    Color principal
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={brandColor}
                      onChange={(e) => setBrandColor(e.target.value)}
                      className="h-11 w-16 rounded-xl border p-1"
                      style={{
                        borderColor: "var(--border-color)",
                        background: "var(--bg-card)",
                      }}
                    />
                    <input
                      type="text"
                      value={brandColor}
                      onChange={(e) => setBrandColor(e.target.value)}
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
                    Imagen principal
                  </label>

                  <div className="space-y-3">
                    <div className="flex flex-wrap gap-3">
                      <button
                        type="button"
                        onClick={() => {
                          setImageLibraryOpen(true);
                          if (slug) {
                            loadCampaignImages(slug);
                          }
                        }}
                        className={secondaryButtonClass}
                        style={{
                          borderColor: "var(--border-color)",
                          background: "var(--bg-card)",
                          color: "var(--text-main)",
                        }}
                      >
                        Biblioteca de imágenes
                      </button>

                      {heroImageUrl ? (
                        <button
                          type="button"
                          onClick={() => setHeroImageUrl("")}
                          className={secondaryButtonClass}
                          style={{
                            borderColor: "rgba(244,63,94,0.28)",
                            background: "rgba(244,63,94,0.08)",
                            color: "rgb(244 63 94)",
                          }}
                        >
                          Quitar imagen
                        </button>
                      ) : null}
                    </div>

                    <input
                      type="text"
                      value={heroImageUrl}
                      onChange={(e) => setHeroImageUrl(e.target.value)}
                      placeholder="https://... o selecciona una imagen guardada"
                      className={inputClass}
                      style={{
                        borderColor: "var(--border-color)",
                        background: "var(--bg-card)",
                        color: "var(--text-main)",
                      }}
                    />

                    <p className="text-xs leading-6" style={{ color: "var(--text-muted)" }}>
                      Puedes usar una URL externa como fallback o elegir una imagen guardada en tu biblioteca.
                      Límite actual: <strong style={{ color: "var(--text-main)" }}>{imagesLimitInfo.current}/{imagesLimitInfo.max}</strong>.
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label
                    className="mb-2 block text-sm font-medium"
                    style={{ color: "var(--text-main)" }}
                  >
                    Texto CTA
                  </label>
                  <input
                    type="text"
                    value={ctaText}
                    onChange={(e) => setCtaText(e.target.value)}
                    placeholder="Ej: Agendar visita"
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
                    URL CTA
                  </label>
                  <input
                    type="text"
                    value={ctaUrl}
                    onChange={(e) => setCtaUrl(e.target.value)}
                    placeholder={`https://www.orbyx.cl/${slug}`}
                    className={inputClass}
                    style={{
                      borderColor: "var(--border-color)",
                      background: "var(--bg-card)",
                      color: "var(--text-main)",
                    }}
                  />
                </div>
              </div>

              <label
                className="flex items-center gap-3 rounded-2xl border px-4 py-3 text-sm"
                style={{
                  borderColor: "var(--border-color)",
                  background: "var(--bg-soft)",
                  color: "var(--text-main)",
                }}
              >
                <input
                  type="checkbox"
                  checked={showCta}
                  onChange={(e) => setShowCta(e.target.checked)}
                  className="h-4 w-4"
                />
                Mostrar botón CTA en el correo
              </label>

              <div>
                <label
                  className="mb-2 block text-sm font-medium"
                  style={{ color: "var(--text-main)" }}
                >
                  Footer / nota final
                </label>
                <textarea
                  value={footerNote}
                  onChange={(e) => setFooterNote(e.target.value)}
                  className={textareaClass}
                  style={{
                    borderColor: "var(--border-color)",
                    background: "var(--bg-card)",
                    color: "var(--text-main)",
                  }}
                />
              </div>
            </div>
          </Panel>

          <div
            className="rounded-[26px] border p-4 shadow-sm"
            style={{
              borderColor: "rgba(37,99,235,0.26)",
              background:
                "linear-gradient(135deg, rgba(37,99,235,0.14), rgba(14,165,233,0.10), var(--bg-card))",
            }}
          >
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p
                  className="text-sm font-semibold"
                  style={{ color: "var(--text-main)" }}
                >
                  Acción crítica
                </p>
                <p className="mt-1 text-sm leading-6" style={{ color: "var(--text-muted)" }}>
                  Esta campaña intentará impactar hasta{" "}
                  <span style={{ color: "var(--text-main)", fontWeight: 700 }}>
                    {limitedAudienceCount}
                  </span>{" "}
                  contactos reales con la configuración actual.
                </p>
              </div>

              <button
                type="button"
                onClick={handleOpenConfirm}
                disabled={sending || loadingAudience}
                className={`${primaryButtonClass} min-w-[220px] font-semibold shadow-lg`}
                style={{
                  background:
                    "linear-gradient(135deg, rgb(37 99 235), rgb(14 165 233))",
                  boxShadow: "0 18px 40px rgba(37,99,235,0.28)",
                }}
              >
                {sending ? "Enviando campaña..." : "Enviar campaña"}
              </button>
            </div>
          </div>

          {sendSummary ? (
            <Panel
              title="Resultado del envío"
              description="Resumen del último envío realizado."
              className="bg-[linear-gradient(180deg,rgba(16,185,129,0.05),transparent_35%)]"
            >
              <div className="grid gap-4 md:grid-cols-5">
                <SectionStat
                  label="Audiencia"
                  value={String(sendSummary.audience_total || 0)}
                  helper="Clientes encontrados."
                />
                <SectionStat
                  label="Límite aplicado"
                  value={String(sendSummary.applied_limit || 0)}
                  helper="Tope real procesado."
                />
                <SectionStat
                  label="Con email"
                  value={String(sendSummary.recipients_with_email || 0)}
                  helper="Correos válidos encontrados."
                />
                <SectionStat
                  label="Enviados"
                  value={String(sendSummary.sent || 0)}
                  helper="Envíos exitosos."
                />
                <SectionStat
                  label="Fallidos"
                  value={String(sendSummary.failed || 0)}
                  helper="Correos que fallaron."
                />
              </div>
            </Panel>
          ) : null}
        </div>

        <div className="space-y-6">
          <Panel
            title="Preview de audiencia"
            description="A quiénes impactaría esta campaña según el canal activo."
            className="bg-[linear-gradient(180deg,rgba(14,165,233,0.06),transparent_40%)]"
          >
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-1 2xl:grid-cols-3">
                <SectionStat
                  label="Con email"
                  value={loadingAudience ? "..." : String(audienceStats.withEmail)}
                  helper="Clientes alcanzables por correo."
                />
                <SectionStat
                  label="Con WhatsApp"
                  value={loadingAudience ? "..." : String(audienceStats.withWhatsapp)}
                  helper="Clientes alcanzables por teléfono."
                />
                <SectionStat
                  label="Se enviarán"
                  value={loadingAudience ? "..." : String(limitedAudienceCount)}
                  helper="Máximo alcanzable según filtros."
                />
              </div>

              <div
                className="rounded-2xl border p-4"
                style={{
                  borderColor: "var(--border-color)",
                  background:
                    "linear-gradient(135deg, rgba(37,99,235,0.08), var(--bg-soft))",
                }}
              >
                <p
                  className="text-sm font-semibold"
                  style={{ color: "var(--text-main)" }}
                >
                  Resumen actual
                </p>
                <p className="mt-2 text-sm leading-6" style={{ color: "var(--text-muted)" }}>
                  Canal: <strong style={{ color: "var(--text-main)" }}>{selectedChannelLabel}</strong>
                  {" · "}Segmento:{" "}
                  <strong style={{ color: "var(--text-main)" }}>{selectedSegmentLabel}</strong>
                  {" · "}Inactividad:{" "}
                  <strong style={{ color: "var(--text-main)" }}>
                    {INACTIVE_OPTIONS.find((item) => item.value === inactiveDays)?.label || `${inactiveDays} días`}
                  </strong>
                </p>
                <p className="mt-2 text-sm leading-6" style={{ color: "var(--text-muted)" }}>
                  Prioridad: <strong style={{ color: "var(--text-main)" }}>{selectedSortLabel}</strong>
                  {" · "}Límite: <strong style={{ color: "var(--text-main)" }}>{sendLimit}</strong>
                </p>
              </div>

              <div
                className="overflow-hidden rounded-2xl border"
                style={{
                  borderColor: "var(--border-color)",
                  background: "var(--bg-card)",
                }}
              >
                <div
                  className="border-b px-4 py-3"
                  style={{ borderColor: "var(--border-color)" }}
                >
                  <p
                    className="text-sm font-semibold"
                    style={{ color: "var(--text-main)" }}
                  >
                    Muestra de destinatarios
                  </p>
                </div>

                <div className="divide-y" style={{ borderColor: "var(--border-color)" }}>
                  {loadingAudience ? (
                    Array.from({ length: 5 }).map((_, index) => (
                      <div key={index} className="px-4 py-4">
                        <div
                          className="h-4 w-32 animate-pulse rounded"
                          style={{ background: "var(--bg-soft)" }}
                        />
                        <div
                          className="mt-2 h-4 w-44 animate-pulse rounded"
                          style={{ background: "var(--bg-soft)" }}
                        />
                      </div>
                    ))
                  ) : previewRecipients.length === 0 ? (
                    <div
                      className="px-4 py-10 text-sm"
                      style={{ color: "var(--text-muted)" }}
                    >
                      No hay clientes disponibles para este canal con la segmentación actual.
                    </div>
                  ) : (
                    previewRecipients.map((customer) => {
                      const segmentMeta = getCustomerSegmentMeta(customer.segment);

                      return (
                        <div key={customer.id} className="px-4 py-4">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0 flex-1">
                              <p
                                className="font-semibold"
                                style={{ color: "var(--text-main)" }}
                              >
                                {customer.name || "Sin nombre"}
                              </p>
                              <p
                                className="mt-1 text-sm"
                                style={{ color: "var(--text-muted)" }}
                              >
                                {channel === "email"
                                  ? customer.email || "Sin email"
                                  : customer.phone || "Sin teléfono"}
                              </p>
                              <p
                                className="mt-1 text-xs"
                                style={{ color: "var(--text-muted)" }}
                              >
                                Última visita: {formatLastVisit(customer.last_visit_at)}
                              </p>
                            </div>

                            <span
                              className="inline-flex rounded-full border px-3 py-1 text-xs font-semibold"
                              style={{
                                background: segmentMeta.bg,
                                borderColor: segmentMeta.border,
                                color: segmentMeta.color,
                              }}
                            >
                              {segmentMeta.label}
                            </span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          </Panel>

          <Panel
            title="Preview del correo"
            description="Vista previa más cercana a una pieza de marketing real."
            className="bg-[linear-gradient(180deg,rgba(37,99,235,0.06),transparent_35%)]"
          >
            <div
              className="rounded-[28px] border p-4"
              style={{
                borderColor: "var(--border-color)",
                background: "var(--bg-soft)",
              }}
            >
              <div
                className="mx-auto max-w-[680px] overflow-hidden rounded-[28px] border shadow-sm"
                style={{
                  borderColor: "var(--border-color)",
                  background: "#ffffff",
                }}
              >
                <div
                  className="px-6 py-6 text-white"
                  style={{
                    background:
                      `linear-gradient(135deg, ${brandColor}, ${brandColor}DD)`,
                  }}
                >
                  <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-white/75">
                    {businessName}
                  </p>
                  <h3 className="mt-2 text-2xl font-bold">{emailPreviewTitle}</h3>
                  <p className="mt-2 text-sm text-white/85">{subject || "Sin asunto"}</p>
                </div>

                {heroImageUrl ? (
                  <div style={{ background: "#F3F4F6" }}>
                    <img
                      src={heroImageUrl}
                      alt="Banner campaña"
                      className="h-52 w-full object-cover"
                    />
                  </div>
                ) : null}

                <div className="px-6 py-6">
                  <div
                    className="rounded-2xl border p-5 text-sm leading-7"
                    style={{
                      borderColor: "#E5E7EB",
                      background: "#F8FAFC",
                      color: "#334155",
                    }}
                  >
                    <p className="font-semibold" style={{ color: "#0F172A" }}>
                      Hola {"{{nombre}}"},
                    </p>

                    <p className="mt-3 whitespace-pre-line">
                      {message || "Sin contenido"}
                    </p>

                    {showCta ? (
                      <div className="mt-5">
                        <a
                          href={ctaUrl || "#"}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex rounded-2xl px-5 py-3 text-sm font-semibold text-white"
                          style={{
                            background:
                              `linear-gradient(135deg, ${brandColor}, ${brandColor}DD)`,
                          }}
                        >
                          {ctaText || "Reservar ahora"}
                        </a>
                      </div>
                    ) : null}
                  </div>

                  <div
                    className="mt-5 border-t pt-4 text-xs leading-6"
                    style={{
                      borderColor: "#E5E7EB",
                      color: "#64748B",
                    }}
                  >
                    {footerNote}
                  </div>
                </div>
              </div>
            </div>
          </Panel>
        </div>
      </div>

      <section className="space-y-6">
        <div className="grid gap-4 xl:grid-cols-4">
          <SectionStat
            label="Campañas filtradas"
            value={loadingHistory ? "..." : String(historyStats.total)}
            helper="Resultado según filtros activos."
          />
          <SectionStat
            label="Correos enviados"
            value={loadingHistory ? "..." : String(historyStats.totalSent)}
            helper="Suma total en la vista actual."
          />
          <SectionStat
            label="Tasa promedio"
            value={loadingHistory ? "..." : `${historyStats.avgSuccess}%`}
            helper="Éxito promedio según límite aplicado."
          />
          <SectionStat
            label="Último envío"
            value={
              loadingHistory
                ? "..."
                : historyStats.latest
                ? formatDate(historyStats.latest.created_at)
                : "Sin envíos"
            }
            helper="Registro más reciente del filtro."
          />
        </div>

        <Panel
          title="Historial de campañas"
          description="Filtros por canal, segmento, fecha, búsqueda y rendimiento."
          className="bg-[linear-gradient(180deg,rgba(37,99,235,0.05),transparent_35%)]"
        >
          {historyError ? (
            <div
              className="rounded-2xl border px-4 py-3 text-sm"
              style={{
                borderColor: "rgba(244,63,94,0.28)",
                background: "rgba(244,63,94,0.10)",
                color: "rgb(251 113 133)",
              }}
            >
              {historyError}
            </div>
          ) : null}

          <div className="space-y-4">
            <div
              className="rounded-2xl border p-4"
              style={{
                borderColor: "var(--border-color)",
                background:
                  "linear-gradient(135deg, rgba(37,99,235,0.08), var(--bg-soft))",
              }}
            >
              <div className="grid gap-4 xl:grid-cols-2">
                <div className="space-y-3">
                  <p
                    className="text-xs font-medium uppercase tracking-[0.18em]"
                    style={{ color: "var(--text-muted)" }}
                  >
                    Período
                  </p>

                  <div className="flex flex-wrap gap-2">
                    <SoftChip
                      active={historyPeriod === "all"}
                      label="Todo"
                      onClick={() => setHistoryPeriod("all")}
                    />
                    <SoftChip
                      active={historyPeriod === "7d"}
                      label="7 días"
                      onClick={() => setHistoryPeriod("7d")}
                    />
                    <SoftChip
                      active={historyPeriod === "30d"}
                      label="30 días"
                      onClick={() => setHistoryPeriod("30d")}
                    />
                    <SoftChip
                      active={historyPeriod === "this_month"}
                      label="Este mes"
                      onClick={() => setHistoryPeriod("this_month")}
                    />
                    <SoftChip
                      active={historyPeriod === "custom"}
                      label="Personalizado"
                      onClick={() => setHistoryPeriod("custom")}
                    />
                  </div>

                  {historyPeriod === "custom" ? (
                    <div className="space-y-2">
                      <div>
                        <label
                          className="mb-2 block text-sm font-medium"
                          style={{ color: "var(--text-main)" }}
                        >
                          Desde
                        </label>
                        <input
                          type="date"
                          value={customFrom}
                          onChange={(e) => setCustomFrom(e.target.value)}
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
                          Hasta
                        </label>
                        <input
                          type="date"
                          value={customTo}
                          onChange={(e) => setCustomTo(e.target.value)}
                          className={inputClass}
                          style={{
                            borderColor: "var(--border-color)",
                            background: "var(--bg-card)",
                            color: "var(--text-main)",
                          }}
                        />
                      </div>
                    </div>
                  ) : null}
                </div>

                <div className="space-y-3">
                  <label
                    className="block text-xs font-medium uppercase tracking-[0.18em]"
                    style={{ color: "var(--text-muted)" }}
                  >
                    Búsqueda
                  </label>

                  <input
                    type="text"
                    value={historySearch}
                    onChange={(e) => setHistorySearch(e.target.value)}
                    placeholder="Buscar por nombre, asunto, mensaje, plan..."
                    className={inputClass}
                    style={{
                      borderColor: "var(--border-color)",
                      background: "var(--bg-card)",
                      color: "var(--text-main)",
                    }}
                  />
                </div>
              </div>

              <div className="mt-4 grid gap-4 md:grid-cols-3">
                <div>
                  <label
                    className="mb-2 block text-sm font-medium"
                    style={{ color: "var(--text-main)" }}
                  >
                    Canal
                  </label>
                  <select
                    value={historyChannel}
                    onChange={(e) =>
                      setHistoryChannel(e.target.value as "all" | CampaignChannel)
                    }
                    className={selectClass}
                    style={{
                      borderColor: "var(--border-color)",
                      background: "var(--bg-card)",
                      color: "var(--text-main)",
                    }}
                  >
                    <option value="all">Todos</option>
                    <option value="email">Email</option>
                    <option value="whatsapp">WhatsApp</option>
                  </select>
                </div>

                <div>
                  <label
                    className="mb-2 block text-sm font-medium"
                    style={{ color: "var(--text-main)" }}
                  >
                    Segmento
                  </label>
                  <select
                    value={historySegment}
                    onChange={(e) =>
                      setHistorySegment(e.target.value as "all" | CustomerSegment)
                    }
                    className={selectClass}
                    style={{
                      borderColor: "var(--border-color)",
                      background: "var(--bg-card)",
                      color: "var(--text-main)",
                    }}
                  >
                    <option value="all">Todos</option>
                    <option value="new">Nuevos</option>
                    <option value="recurrent">Recurrentes</option>
                    <option value="frequent">Frecuentes</option>
                    <option value="inactive">Inactivos</option>
                  </select>
                </div>

                <div>
                  <label
                    className="mb-2 block text-sm font-medium"
                    style={{ color: "var(--text-main)" }}
                  >
                    Rendimiento
                  </label>
                  <select
                    value={historyPerformance}
                    onChange={(e) =>
                      setHistoryPerformance(e.target.value as HistoryPerformance)
                    }
                    className={selectClass}
                    style={{
                      borderColor: "var(--border-color)",
                      background: "var(--bg-card)",
                      color: "var(--text-main)",
                    }}
                  >
                    <option value="all">Todos</option>
                    <option value="excellent">Excelente</option>
                    <option value="good">Bueno</option>
                    <option value="warning">Regular</option>
                    <option value="failed">Fallido</option>
                  </select>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={resetHistoryFilters}
                  className={secondaryButtonClass}
                  style={{
                    borderColor: "var(--border-color)",
                    background: "var(--bg-card)",
                    color: "var(--text-main)",
                  }}
                >
                  Limpiar filtros
                </button>

                <button
                  type="button"
                  onClick={() => slug && loadCampaignHistory(slug)}
                  className={secondaryButtonClass}
                  style={{
                    borderColor: "var(--border-color)",
                    background: "var(--bg-card)",
                    color: "var(--text-main)",
                  }}
                >
                  Recargar historial
                </button>
              </div>
            </div>

            <div
              className="overflow-hidden rounded-2xl border"
              style={{
                borderColor: "var(--border-color)",
                background: "var(--bg-card)",
              }}
            >
              <div
                className="border-b px-4 py-3"
                style={{ borderColor: "var(--border-color)" }}
              >
                <p
                  className="text-sm font-semibold"
                  style={{ color: "var(--text-main)" }}
                >
                  Últimas campañas
                </p>
              </div>

              {loadingHistory ? (
                <HistorySkeleton />
              ) : filteredHistory.length === 0 ? (
                <div
                  className="px-4 py-10 text-sm"
                  style={{ color: "var(--text-muted)" }}
                >
                  No hay campañas que coincidan con los filtros actuales.
                </div>
              ) : (
                <div className="space-y-4 p-4">
                  {filteredHistory.map((item) => {
                    const channelMeta = getChannelMeta(item.channel);
                    const segmentMeta = getCustomerSegmentMeta(item.segment);
                    const successRate = getSuccessRate(item);
                    const performanceMeta = getPerformanceMeta(
                      successRate,
                      item.failed_count
                    );

                    return (
                      <div
                        key={item.id}
                        className="rounded-2xl border p-4 shadow-sm"
                        style={{
                          borderColor: "var(--border-color)",
                          background:
                            "linear-gradient(135deg, rgba(37,99,235,0.04), var(--bg-card))",
                        }}
                      >
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <p
                                className="truncate text-base font-semibold"
                                style={{ color: "var(--text-main)" }}
                              >
                                {item.campaign_name?.trim() || "Campaña sin nombre"}
                              </p>

                              <span
                                className="inline-flex rounded-full border px-3 py-1 text-xs font-semibold"
                                style={{
                                  background: channelMeta.bg,
                                  borderColor: channelMeta.border,
                                  color: channelMeta.color,
                                }}
                              >
                                {channelMeta.label}
                              </span>

                              <span
                                className="inline-flex rounded-full border px-3 py-1 text-xs font-semibold"
                                style={{
                                  background: segmentMeta.bg,
                                  borderColor: segmentMeta.border,
                                  color: segmentMeta.color,
                                }}
                              >
                                {getSegmentLabel(item.segment)}
                              </span>

                              <span
                                className="inline-flex rounded-full border px-3 py-1 text-xs font-semibold"
                                style={{
                                  background: performanceMeta.bg,
                                  borderColor: performanceMeta.border,
                                  color: performanceMeta.color,
                                }}
                              >
                                {performanceMeta.label}
                              </span>
                            </div>

                            <p
                              className="mt-2 text-sm"
                              style={{ color: "var(--text-muted)" }}
                            >
                              {formatDate(item.created_at)}
                            </p>

                            {item.subject ? (
                              <p
                                className="mt-3 text-sm font-medium"
                                style={{ color: "var(--text-main)" }}
                              >
                                Asunto: {item.subject}
                              </p>
                            ) : null}

                            {item.message ? (
                              <p
                                className="mt-2 line-clamp-3 whitespace-pre-line text-sm leading-6"
                                style={{ color: "var(--text-muted)" }}
                              >
                                {item.message}
                              </p>
                            ) : null}

                            <div className="mt-4 flex flex-wrap gap-2 text-xs">
                              {[
                                `Plan: ${getPlanLabel(item.plan_slug)}`,
                                `Orden: ${getSortLabel(item.sort)}`,
                                `Inactividad: ${item.inactive_days} días`,
                                `Plan límite: ${item.plan_limit}`,
                                `Pedido: ${item.requested_limit}`,
                              ].map((label) => (
                                <span
                                  key={label}
                                  className="rounded-full border px-3 py-1 font-medium"
                                  style={{
                                    borderColor: "var(--border-color)",
                                    background: "var(--bg-soft)",
                                    color: "var(--text-main)",
                                  }}
                                >
                                  {label}
                                </span>
                              ))}
                            </div>
                          </div>

                          <div className="grid min-w-full grid-cols-2 gap-3 sm:grid-cols-3 lg:min-w-[420px]">
                            <SectionStat
                              label="Audiencia"
                              value={String(item.audience_total)}
                              helper="Total encontrado."
                            />
                            <SectionStat
                              label="Aplicado"
                              value={String(item.applied_limit)}
                              helper="Límite usado."
                            />
                            <SectionStat
                              label="Con contacto"
                              value={String(item.recipients_with_contact)}
                              helper="Contactos válidos."
                            />
                            <SectionStat
                              label="Enviados"
                              value={String(item.sent_count)}
                              helper="Envíos exitosos."
                            />
                            <SectionStat
                              label="Fallidos"
                              value={String(item.failed_count)}
                              helper="Intentos fallidos."
                            />
                            <SectionStat
                              label="Éxito"
                              value={`${successRate}%`}
                              helper="Tasa de éxito."
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </Panel>
      </section>

      {imageLibraryOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center px-4 py-6"
          style={{ background: "rgba(2, 6, 23, 0.72)" }}
        >
          <div
            className="flex max-h-[88vh] w-full max-w-5xl flex-col overflow-hidden rounded-[30px] border shadow-2xl"
            style={{
              borderColor: "rgba(59,130,246,0.25)",
              background:
                "linear-gradient(135deg, rgba(37,99,235,0.12), rgba(14,165,233,0.04), var(--bg-card))",
            }}
          >
            <div
              className="flex flex-wrap items-start justify-between gap-4 border-b px-6 py-5"
              style={{ borderColor: "var(--border-color)" }}
            >
              <div>
                <p
                  className="text-xs font-medium uppercase tracking-[0.18em]"
                  style={{ color: "var(--text-muted)" }}
                >
                  Biblioteca SaaS
                </p>
                <h3
                  className="mt-2 text-2xl font-semibold"
                  style={{ color: "var(--text-main)" }}
                >
                  Imágenes de campañas
                </h3>
                <p className="mt-2 text-sm leading-6" style={{ color: "var(--text-muted)" }}>
                  Guarda imágenes reutilizables, selecciónalas para el hero del correo o usa una URL externa cuando quieras.
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => slug && loadCampaignImages(slug)}
                  className={secondaryButtonClass}
                  style={{
                    borderColor: "var(--border-color)",
                    background: "var(--bg-card)",
                    color: "var(--text-main)",
                  }}
                >
                  Recargar
                </button>
                <button
                  type="button"
                  onClick={() => setImageLibraryOpen(false)}
                  className={secondaryButtonClass}
                  style={{
                    borderColor: "var(--border-color)",
                    background: "var(--bg-card)",
                    color: "var(--text-main)",
                  }}
                >
                  Cerrar
                </button>
              </div>
            </div>

            <div className="grid gap-6 overflow-y-auto p-6 xl:grid-cols-[340px_1fr]">
              <div className="space-y-4">
                <div
                  className="rounded-[26px] border p-4"
                  style={{
                    borderColor: "var(--border-color)",
                    background: "var(--bg-soft)",
                  }}
                >
                  <p className="text-sm font-semibold" style={{ color: "var(--text-main)" }}>
                    Subir nueva imagen
                  </p>
                  <p className="mt-2 text-sm leading-6" style={{ color: "var(--text-muted)" }}>
                    Formatos permitidos: jpg, jpeg, png y webp. Peso máximo: 2 MB.
                  </p>

                  <div
                    className="mt-4 rounded-2xl border border-dashed p-4"
                    style={{ borderColor: "var(--border-color)", background: "var(--bg-card)" }}
                  >
                    <input
                      type="file"
                      accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          handleUploadCampaignImage(file);
                          e.currentTarget.value = "";
                        }
                      }}
                      className="block w-full text-sm"
                      style={{ color: "var(--text-main)" }}
                    />

                    <p className="mt-3 text-xs leading-6" style={{ color: "var(--text-muted)" }}>
                      Cupo usado: <strong style={{ color: "var(--text-main)" }}>{imagesLimitInfo.current}/{imagesLimitInfo.max}</strong> imágenes.
                    </p>
                    {imageUploading ? (
                      <p className="mt-2 text-xs leading-6" style={{ color: "var(--text-main)" }}>
                        Subiendo imagen...
                      </p>
                    ) : null}
                  </div>
                </div>

                {imageLibraryError ? (
                  <div
                    className="rounded-2xl border px-4 py-3 text-sm"
                    style={{
                      borderColor: "rgba(244,63,94,0.28)",
                      background: "rgba(244,63,94,0.10)",
                      color: "rgb(251 113 133)",
                    }}
                  >
                    {imageLibraryError}
                  </div>
                ) : null}

                {imageLibraryMessage ? (
                  <div
                    className="rounded-2xl border px-4 py-3 text-sm"
                    style={{
                      borderColor: "rgba(16,185,129,0.28)",
                      background: "rgba(16,185,129,0.10)",
                      color: "rgb(52 211 153)",
                    }}
                  >
                    {imageLibraryMessage}
                  </div>
                ) : null}

                <SectionStat
                  label="Imágenes guardadas"
                  value={`${imagesLimitInfo.current}/${imagesLimitInfo.max}`}
                  helper="Límite actual según tu plan."
                />

                <SectionStat
                  label="Imagen activa"
                  value={heroImageUrl ? "Seleccionada" : "Sin imagen"}
                  helper="La imagen activa se usará como hero del correo."
                />
              </div>

              <div>
                <div
  className="rounded-[26px] border p-5"
  style={{
    borderColor: "var(--border-color)",
    background: "#0B0F1A",
  }}
>
  <div className="flex items-center justify-between mb-4">
    <h4 className="text-sm font-semibold text-white">
      Biblioteca de imágenes
    </h4>

    <span className="text-xs text-gray-400">
      {imagesLimitInfo.current}/{imagesLimitInfo.max} imágenes
    </span>
  </div>

  {imagesLoading ? (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: 6 }).map((_, index) => (
        <div
          key={index}
          className="h-40 animate-pulse rounded-xl"
          style={{ background: "#111827" }}
        />
      ))}
    </div>
  ) : campaignImages.length === 0 ? (
    <div className="text-center py-10 text-sm text-gray-500">
      No tienes imágenes aún
    </div>
  ) : (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {campaignImages.map((image) => {
        const isActive =
          heroImageUrl && heroImageUrl === image.public_url;

        return (
          <div
            key={image.id}
            className="relative group rounded-xl overflow-hidden border"
            style={{
              borderColor: isActive
                ? "rgba(37,99,235,0.5)"
                : "#1F2937",
              background: "#111827",
            }}
          >
            <img
              src={image.public_url || ""}
              className="w-full h-40 object-cover"
            />

            {/* overlay */}
            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition flex flex-col items-center justify-center gap-2">
              
              <button
                onClick={() => {
                  setHeroImageUrl(image.public_url || "");
                  setImageLibraryMessage("Imagen seleccionada");
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-3 py-1 rounded-lg"
              >
                Usar
              </button>

              <button
                onClick={() => handleDeleteCampaignImage(image.id)}
                className="bg-red-600 hover:bg-red-700 text-white text-xs px-3 py-1 rounded-lg"
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

      {confirmOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center px-4"
          style={{ background: "rgba(2, 6, 23, 0.65)" }}
        >
          <div
            className="w-full max-w-lg rounded-[28px] border p-6 shadow-2xl"
            style={{
              borderColor: "rgba(59,130,246,0.25)",
              background:
                "linear-gradient(135deg, rgba(37,99,235,0.12), rgba(14,165,233,0.06), var(--bg-card))",
            }}
          >
            <p
              className="text-xs font-medium uppercase tracking-[0.18em]"
              style={{ color: "var(--text-muted)" }}
            >
              Confirmar envío
            </p>

            <h3
              className="mt-2 text-2xl font-semibold"
              style={{ color: "var(--text-main)" }}
            >
              ¿Enviar campaña ahora?
            </h3>

            <p
              className="mt-3 text-sm leading-7"
              style={{ color: "var(--text-muted)" }}
            >
              Estás a punto de enviar hasta{" "}
              <span style={{ color: "var(--text-main)", fontWeight: 700 }}>
                {limitedAudienceCount}
              </span>{" "}
              correos del segmento{" "}
              <span style={{ color: "var(--text-main)", fontWeight: 700 }}>
                {selectedSegmentLabel}
              </span>.
            </p>

            <p
              className="mt-2 text-sm leading-7"
              style={{ color: "var(--text-muted)" }}
            >
              Asunto:{" "}
              <span style={{ color: "var(--text-main)", fontWeight: 700 }}>
                {subject || "Sin asunto"}
              </span>
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => setConfirmOpen(false)}
                className={secondaryButtonClass}
                style={{
                  borderColor: "var(--border-color)",
                  background: "var(--bg-card)",
                  color: "var(--text-main)",
                }}
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={handleSendCampaignConfirmed}
                className={`${primaryButtonClass} font-semibold`}
                style={{
                  background:
                    "linear-gradient(135deg, rgb(37 99 235), rgb(14 165 233))",
                  boxShadow: "0 18px 40px rgba(37,99,235,0.28)",
                }}
              >
                Sí, enviar campaña
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}