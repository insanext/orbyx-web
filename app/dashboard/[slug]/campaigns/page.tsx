"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { PageHeader } from "../../../../components/dashboard/page-header";
import { Panel } from "../../../../components/dashboard/panel";

const BACKEND_URL = "https://orbyx-backend.onrender.com";

type CustomerSegment = "new" | "recurrent" | "frequent" | "inactive";
type CampaignChannel = "email" | "whatsapp";
type CampaignSort = "oldest" | "recent" | "most_visits" | "least_visits";
type PlanSlug = "pro" | "premium" | "vip" | "platinum" | "starter";
type HistoryPeriod = "all" | "7d" | "30d" | "this_month" | "custom";
type HistoryPerformance = "all" | "excellent" | "good" | "warning" | "failed";

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

type EmailVisualPreset = "minimal" | "promo" | "reminder";

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
    description: "Campañas y recuperación por WhatsApp.",
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

function getCustomerSegmentStyles(segment?: string) {
  if (segment === "frequent") {
    return {
      label: "Frecuente",
      className:
        "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
    };
  }
  if (segment === "recurrent") {
    return {
      label: "Recurrente",
      className:
        "bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300",
    };
  }
  if (segment === "inactive") {
    return {
      label: "Inactivo",
      className:
        "bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300",
    };
  }
  return {
    label: "Nuevo",
    className:
      "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
  };
}

function getChannelStyles(channel?: string) {
  if (channel === "whatsapp") {
    return {
      label: "WhatsApp",
      className:
        "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
    };
  }
  return {
    label: "Email",
    className:
      "bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300",
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

function getPerformanceStyles(rate: number, failedCount: number) {
  const bucket = getPerformanceBucket(rate, failedCount);

  if (bucket === "excellent") {
    return {
      label: "Excelente",
      className:
        "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
    };
  }
  if (bucket === "good") {
    return {
      label: "Bueno",
      className:
        "bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300",
    };
  }
  if (bucket === "warning") {
    return {
      label: "Regular",
      className:
        "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
    };
  }
  return {
    label: "Fallido",
    className:
      "bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300",
  };
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

function StatCard({
  title,
  value,
  description,
}: {
  title: string;
  value: string;
  description: string;
}) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900/70">
      <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
        {title}
      </p>
      <p className="mt-2 text-3xl font-semibold text-slate-900 dark:text-white">
        {value}
      </p>
      <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-400">
        {description}
      </p>
    </div>
  );
}

function ClassicSection({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900/70">
      <div className="mb-4 rounded-2xl border border-sky-200 bg-sky-50 px-4 py-4 dark:border-sky-900/40 dark:bg-sky-950/30">
        <p className="text-base font-semibold text-slate-900 dark:text-white">
          {title}
        </p>
        {description ? (
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            {description}
          </p>
        ) : null}
      </div>
      {children}
    </div>
  );
}

function ChannelButton({
  active,
  label,
  description,
  onClick,
}: {
  active: boolean;
  label: string;
  description: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-3xl border p-4 text-left transition ${
        active
          ? "border-slate-900 bg-slate-900 text-white dark:border-white dark:bg-white dark:text-slate-900"
          : "border-slate-200 bg-white text-slate-900 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:hover:bg-slate-800"
      }`}
    >
      <p className="text-sm font-semibold">{label}</p>
      <p
        className={`mt-1 text-sm ${
          active
            ? "text-white/80 dark:text-slate-900/70"
            : "text-slate-500 dark:text-slate-400"
        }`}
      >
        {description}
      </p>
    </button>
  );
}

function SegmentButton({
  active,
  label,
  description,
  onClick,
}: {
  active: boolean;
  label: string;
  description: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-3xl border p-4 text-left transition ${
        active
          ? "border-slate-900 bg-slate-900 text-white dark:border-white dark:bg-white dark:text-slate-900"
          : "border-slate-200 bg-white text-slate-900 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:hover:bg-slate-800"
      }`}
    >
      <p className="text-sm font-semibold">{label}</p>
      <p
        className={`mt-1 text-sm ${
          active
            ? "text-white/80 dark:text-slate-900/70"
            : "text-slate-500 dark:text-slate-400"
        }`}
      >
        {description}
      </p>
    </button>
  );
}

function FilterChip({
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
      className={`rounded-full px-3 py-2 text-xs font-semibold transition ${
        active
          ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900"
          : "bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
      }`}
    >
      {label}
    </button>
  );
}

function PresetButton({
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
      className={`rounded-2xl px-4 py-2 text-sm font-semibold transition ${
        active
          ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900"
          : "bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
      }`}
    >
      {label}
    </button>
  );
}

function HistorySkeleton() {
  return (
    <div className="divide-y divide-slate-200 dark:divide-slate-700">
      {Array.from({ length: 4 }).map((_, index) => (
        <div key={index} className="px-4 py-4">
          <div className="h-4 w-40 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
          <div className="mt-3 h-4 w-56 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
          <div className="mt-2 h-4 w-72 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
        </div>
      ))}
    </div>
  );
}

export default function CampaignsPage() {
  const params = useParams();
  const slug =
    ((params as any)?.slug as string) || ((params as any)?.Slug as string);

  const [plan, setPlan] = useState<PlanSlug>("starter");
  const [channel, setChannel] = useState<CampaignChannel>("email");
  const [segment, setSegment] = useState<CustomerSegment>("inactive");
  const [inactiveDays, setInactiveDays] = useState("60");
  const [sendLimit, setSendLimit] = useState("50");
  const [sort, setSort] = useState<CampaignSort>("oldest");
  const [campaignName, setCampaignName] = useState("");
  const [subject, setSubject] = useState("Te extrañamos en Orbyx");
  const [message, setMessage] = useState(
    "Hola {{nombre}}, queremos invitarte a volver. Tenemos horas disponibles esta semana y nos encantaría atenderte nuevamente."
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
    "Te esperamos para ayudarte a mantener tu agenda al día."
  );

  const planLimit = PLAN_EMAIL_LIMITS[plan];
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
      setHeroImageUrl("");
      setShowCta(true);
      setCtaText("Reservar hora");
      setFooterNote("Gracias por seguir confiando en nosotros.");
    }
    if (emailPreset === "promo") {
      setBrandColor("#0f766e");
      setShowCta(true);
      setCtaText("Agendar visita");
      setFooterNote("Te esperamos para ayudarte a mantener tu agenda al día.");
    }
    if (emailPreset === "reminder") {
      setBrandColor("#1d4ed8");
      setHeroImageUrl("");
      setShowCta(true);
      setCtaText("Ver horas disponibles");
      setFooterNote("Recuerda que tenemos agenda disponible para ti.");
    }
  }, [emailPreset]);

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
    } catch (err: any) {
      setHistoryError(err?.message || "Error cargando historial");
      setHistory([]);
    } finally {
      setLoadingHistory(false);
    }
  }

  useEffect(() => {
    async function loadBusinessPlan() {
      try {
        const res = await fetch(`${BACKEND_URL}/public/business/${slug}`);
        const data: BusinessResponse | { error?: string } = await res.json();

        if (res.ok && "business" in data) {
          const normalizedPlan = normalizePlan(data.business.plan_slug);
          setPlan(normalizedPlan);
        }
      } catch (_) {}
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
      } catch (err: any) {
        setError(err?.message || "Error cargando audiencia");
        setCustomers([]);
      } finally {
        setLoadingAudience(false);
      }
    }

    if (slug) {
      loadAudience();
    }
  }, [slug, segment, inactiveDays]);

  useEffect(() => {
    if (slug) {
      loadCampaignHistory(slug);
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
      setError("WhatsApp todavía no está conectado. Primero activaremos Email.");
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
          campaign_name: campaignName.trim() || null,
          segment,
          inactive_days: Number(inactiveDays),
          subject: subject.trim(),
          message: message.trim(),
          limit: Number(sendLimit),
          sort,
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
    } catch (err: any) {
      setError(err?.message || "Error enviando campaña");
    } finally {
      setSending(false);
    }
  }

  const emailPreviewTitle =
    campaignName.trim() || subject.trim() || "Campaña de Orbyx";

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Campañas"
        title="Campañas y recuperación"
        description="Prepara campañas por email y WhatsApp usando la segmentación real de clientes."
      />

      {error ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-300">
          {error}
        </div>
      ) : null}

      {resultMessage ? (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300">
          {resultMessage}
        </div>
      ) : null}

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-4">
        <StatCard
          title="Plan actual"
          value={PLAN_LABELS[plan]}
          description={`Límite por campaña email: ${planLimit} destinatarios.`}
        />
        <StatCard
          title="Canal"
          value={selectedChannelLabel}
          description="Canal seleccionado para esta campaña."
        />
        <StatCard
          title="Segmento"
          value={selectedSegmentLabel}
          description="Grupo de clientes elegido para esta acción."
        />
        <StatCard
          title="Listos para enviar"
          value={loadingAudience ? "..." : String(audienceStats.availableForChannel)}
          description={
            channel === "email"
              ? "Clientes con email disponible."
              : "Clientes con teléfono disponible."
          }
        />
      </section>

      <div className="grid grid-cols-1 gap-6 2xl:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-6">
          <ClassicSection
            title="Configuración de campaña"
            description="Aquí defines a quién se le enviará la campaña."
          >
            <div className="space-y-5">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-[240px_1fr]">
                <div className="space-y-3">
                  <label className="block text-xs font-medium uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                    Canal
                  </label>
                  <div className="grid grid-cols-1 gap-3">
                    {CHANNEL_OPTIONS.map((item) => (
                      <ChannelButton
                        key={item.key}
                        active={channel === item.key}
                        label={item.label}
                        description={item.description}
                        onClick={() => setChannel(item.key)}
                      />
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="block text-xs font-medium uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                    Segmento
                  </label>
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    {SEGMENT_OPTIONS.map((item) => (
                      <SegmentButton
                        key={item.key}
                        active={segment === item.key}
                        label={item.label}
                        description={item.description}
                        onClick={() => setSegment(item.key)}
                      />
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-[220px_1fr]">
                <div className="space-y-3">
                  <label className="block text-xs font-medium uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                    Inactivos en
                  </label>
                  <select
                    value={inactiveDays}
                    onChange={(e) => setInactiveDays(e.target.value)}
                    className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-slate-400 dark:border-slate-600 dark:bg-slate-950 dark:text-white dark:focus:border-slate-500"
                  >
                    <option value="30">30 días</option>
                    <option value="60">60 días</option>
                    <option value="90">90 días</option>
                    <option value="120">120 días</option>
                  </select>
                </div>

                <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-950/60">
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">
                    Nota de segmentación
                  </p>
                  <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-400">
                    El valor de inactividad impacta sobre el segmento inactivos.
                    Para nuevos, recurrentes y frecuentes, el cálculo depende del
                    total de visitas del cliente.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-3">
                  <label className="block text-xs font-medium uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                    Cantidad a enviar
                  </label>
                  <select
                    value={sendLimit}
                    onChange={(e) => setSendLimit(e.target.value)}
                    className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-slate-400 dark:border-slate-600 dark:bg-slate-950 dark:text-white dark:focus:border-slate-500"
                  >
                    {availableLimitOptions.map((option) => (
                      <option key={option} value={option}>
                        {option} destinatarios
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-3">
                  <label className="block text-xs font-medium uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                    Prioridad de envío
                  </label>
                  <select
                    value={sort}
                    onChange={(e) => setSort(e.target.value as CampaignSort)}
                    className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-slate-400 dark:border-slate-600 dark:bg-slate-950 dark:text-white dark:focus:border-slate-500"
                  >
                    {SORT_OPTIONS.map((option) => (
                      <option key={option.key} value={option.key}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-950/60">
                <p className="text-sm font-semibold text-slate-900 dark:text-white">
                  Regla actual del envío
                </p>
                <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-400">
                  Tu plan <span className="font-semibold">{PLAN_LABELS[plan]}</span>{" "}
                  permite hasta <span className="font-semibold">{planLimit}</span>{" "}
                  correos por campaña.
                </p>
                <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-400">
                  Se intentará enviar hasta <span className="font-semibold">{sendLimit}</span>{" "}
                  correos, ordenados por <span className="font-semibold">{selectedSortLabel}</span>.
                </p>
                <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-400">
                  Con la audiencia actual, el sistema podría enviar hasta{" "}
                  <span className="font-semibold">{limitedAudienceCount}</span>{" "}
                  correos reales por este canal.
                </p>
              </div>
            </div>
          </ClassicSection>

          <ClassicSection
            title="Correo"
            description="Aquí defines el contenido y el estilo del email."
          >
            <div className="space-y-6">
              <div className="space-y-5">
                <div className="space-y-3">
                  <label className="block text-xs font-medium uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                    Nombre interno
                  </label>
                  <input
                    type="text"
                    value={campaignName}
                    onChange={(e) => setCampaignName(e.target.value)}
                    placeholder="Ej: Recuperación clientes 60 días"
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-400 dark:border-slate-600 dark:bg-slate-950 dark:text-white dark:focus:border-slate-500"
                  />
                </div>

                <div className="space-y-3">
                  <label className="block text-xs font-medium uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                    Asunto
                  </label>
                  <input
                    type="text"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="Asunto del correo"
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-400 dark:border-slate-600 dark:bg-slate-950 dark:text-white dark:focus:border-slate-500"
                  />
                </div>

                <div className="space-y-3">
                  <label className="block text-xs font-medium uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                    Mensaje
                  </label>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    rows={7}
                    placeholder="Escribe el mensaje base de la campaña..."
                    className="w-full rounded-3xl border border-slate-200 bg-white px-4 py-4 text-sm text-slate-900 outline-none transition focus:border-slate-400 dark:border-slate-600 dark:bg-slate-950 dark:text-white dark:focus:border-slate-500"
                  />
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Puedes usar textos como <span className="font-semibold">{"{{nombre}}"}</span> para personalización futura.
                  </p>
                </div>
              </div>

              <div className="border-t border-slate-200 pt-5 dark:border-slate-700">
                <div className="space-y-5">
                  <div className="space-y-3">
                    <label className="block text-xs font-medium uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                      Plantilla visual
                    </label>
                    <div className="flex flex-wrap gap-2">
                      <PresetButton
                        active={emailPreset === "minimal"}
                        label="Minimal"
                        onClick={() => setEmailPreset("minimal")}
                      />
                      <PresetButton
                        active={emailPreset === "promo"}
                        label="Promo"
                        onClick={() => setEmailPreset("promo")}
                      />
                      <PresetButton
                        active={emailPreset === "reminder"}
                        label="Recordatorio"
                        onClick={() => setEmailPreset("reminder")}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div className="space-y-3">
                      <label className="block text-xs font-medium uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                        Color principal
                      </label>
                      <div className="flex items-center gap-3">
                        <input
                          type="color"
                          value={brandColor}
                          onChange={(e) => setBrandColor(e.target.value)}
                          className="h-11 w-16 rounded-xl border border-slate-200 bg-white p-1 dark:border-slate-700 dark:bg-slate-950"
                        />
                        <input
                          type="text"
                          value={brandColor}
                          onChange={(e) => setBrandColor(e.target.value)}
                          className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-slate-400 dark:border-slate-600 dark:bg-slate-950 dark:text-white dark:focus:border-slate-500"
                        />
                      </div>
                    </div>

                    <div className="space-y-3">
                      <label className="block text-xs font-medium uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                        Imagen/banner URL
                      </label>
                      <input
                        type="text"
                        value={heroImageUrl}
                        onChange={(e) => setHeroImageUrl(e.target.value)}
                        placeholder="https://..."
                        className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-slate-400 dark:border-slate-600 dark:bg-slate-950 dark:text-white dark:focus:border-slate-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div className="space-y-3">
                      <label className="block text-xs font-medium uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                        Texto botón CTA
                      </label>
                      <input
                        type="text"
                        value={ctaText}
                        onChange={(e) => setCtaText(e.target.value)}
                        placeholder="Reservar ahora"
                        className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-slate-400 dark:border-slate-600 dark:bg-slate-950 dark:text-white dark:focus:border-slate-500"
                      />
                    </div>

                    <div className="space-y-3">
                      <label className="block text-xs font-medium uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                        URL botón CTA
                      </label>
                      <input
                        type="text"
                        value={ctaUrl}
                        onChange={(e) => setCtaUrl(e.target.value)}
                        placeholder="https://www.orbyx.cl/tu-negocio"
                        className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-slate-400 dark:border-slate-600 dark:bg-slate-950 dark:text-white dark:focus:border-slate-500"
                      />
                    </div>
                  </div>

                  <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 dark:border-slate-700 dark:bg-slate-950/60 dark:text-slate-300">
                    <input
                      type="checkbox"
                      checked={showCta}
                      onChange={(e) => setShowCta(e.target.checked)}
                      className="h-4 w-4"
                    />
                    Mostrar botón CTA en el correo
                  </label>

                  <div className="space-y-3">
                    <label className="block text-xs font-medium uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                      Nota inferior
                    </label>
                    <textarea
                      value={footerNote}
                      onChange={(e) => setFooterNote(e.target.value)}
                      rows={3}
                      className="w-full rounded-3xl border border-slate-200 bg-white px-4 py-4 text-sm text-slate-900 outline-none transition focus:border-slate-400 dark:border-slate-600 dark:bg-slate-950 dark:text-white dark:focus:border-slate-500"
                    />
                  </div>
                </div>
              </div>
            </div>
          </ClassicSection>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={handleOpenConfirm}
              disabled={sending || loadingAudience}
              className="inline-flex h-11 items-center justify-center rounded-2xl bg-slate-900 px-5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
            >
              {sending ? "Enviando..." : "Enviar campaña"}
            </button>

            <div className="text-sm text-slate-500 dark:text-slate-400">
              Se intentarán enviar hasta {limitedAudienceCount} correos reales con la configuración actual.
            </div>
          </div>

          {sendSummary ? (
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-950/60">
              <p className="text-sm font-semibold text-slate-900 dark:text-white">
                Resultado del envío
              </p>
              <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-5">
                <div className="rounded-2xl border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-900/70">
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                    Audiencia
                  </p>
                  <p className="mt-1 text-lg font-semibold text-slate-900 dark:text-white">
                    {sendSummary.audience_total || 0}
                  </p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-900/70">
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                    Límite aplicado
                  </p>
                  <p className="mt-1 text-lg font-semibold text-slate-900 dark:text-white">
                    {sendSummary.applied_limit || 0}
                  </p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-900/70">
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                    Con email
                  </p>
                  <p className="mt-1 text-lg font-semibold text-slate-900 dark:text-white">
                    {sendSummary.recipients_with_email || 0}
                  </p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-900/70">
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                    Enviados
                  </p>
                  <p className="mt-1 text-lg font-semibold text-emerald-600 dark:text-emerald-300">
                    {sendSummary.sent || 0}
                  </p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-900/70">
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                    Fallidos
                  </p>
                  <p className="mt-1 text-lg font-semibold text-rose-600 dark:text-rose-300">
                    {sendSummary.failed || 0}
                  </p>
                </div>
              </div>
            </div>
          ) : null}
        </div>

        <div className="space-y-6">
          <ClassicSection
            title="Preview de audiencia"
            description="A quiénes impactaría esta campaña según canal y segmento."
          >
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3 xl:grid-cols-1 2xl:grid-cols-3">
                <StatCard
                  title="Con email"
                  value={loadingAudience ? "..." : String(audienceStats.withEmail)}
                  description="Clientes alcanzables por correo."
                />
                <StatCard
                  title="Con WhatsApp"
                  value={loadingAudience ? "..." : String(audienceStats.withWhatsapp)}
                  description="Clientes alcanzables por teléfono."
                />
                <StatCard
                  title="Se enviarán"
                  value={loadingAudience ? "..." : String(limitedAudienceCount)}
                  description="Cantidad máxima según filtro y límite elegido."
                />
              </div>

              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-950/60">
                <p className="text-sm font-semibold text-slate-900 dark:text-white">
                  Resumen actual
                </p>
                <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-400">
                  Canal: <span className="font-semibold">{selectedChannelLabel}</span>
                  {" · "}Segmento: <span className="font-semibold">{selectedSegmentLabel}</span>
                  {" · "}Inactividad: <span className="font-semibold">{inactiveDays} días</span>
                </p>
                <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-400">
                  Prioridad: <span className="font-semibold">{selectedSortLabel}</span>
                  {" · "}Límite: <span className="font-semibold">{sendLimit}</span>
                </p>
              </div>

              <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900/70">
                <div className="border-b border-slate-200 px-4 py-3 dark:border-slate-700">
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">
                    Muestra de destinatarios
                  </p>
                </div>

                <div className="divide-y divide-slate-200 dark:divide-slate-700">
                  {loadingAudience ? (
                    Array.from({ length: 5 }).map((_, index) => (
                      <div key={index} className="px-4 py-4">
                        <div className="h-4 w-32 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
                        <div className="mt-2 h-4 w-44 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
                      </div>
                    ))
                  ) : previewRecipients.length === 0 ? (
                    <div className="px-4 py-10 text-sm text-slate-600 dark:text-slate-400">
                      No hay clientes disponibles para este canal con la segmentación actual.
                    </div>
                  ) : (
                    previewRecipients.map((customer) => {
                      const segmentStyle = getCustomerSegmentStyles(customer.segment);

                      return (
                        <div
                          key={customer.id}
                          className="px-4 py-4 text-sm text-slate-700 dark:text-slate-300"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="font-semibold text-slate-900 dark:text-white">
                                {customer.name || "Sin nombre"}
                              </p>
                              <p className="mt-1 text-slate-600 dark:text-slate-400">
                                {channel === "email"
                                  ? customer.email || "Sin email"
                                  : customer.phone || "Sin teléfono"}
                              </p>
                              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                Última visita: {formatLastVisit(customer.last_visit_at)}
                              </p>
                            </div>

                            <span
                              className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${segmentStyle.className}`}
                            >
                              {segmentStyle.label}
                            </span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          </ClassicSection>

          <ClassicSection
            title="Preview del correo"
            description="Vista previa del email antes del envío."
          >
            <div className="rounded-[28px] border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-950/60">
              <div className="mx-auto max-w-[680px] overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
                <div
                  className="px-6 py-6 text-white"
                  style={{ backgroundColor: brandColor }}
                >
                  <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-white/75">
                    Campaña Orbyx
                  </p>
                  <h3 className="mt-2 text-2xl font-bold">{emailPreviewTitle}</h3>
                  <p className="mt-2 text-sm text-white/85">{subject || "Sin asunto"}</p>
                </div>

                {heroImageUrl ? (
                  <div className="border-b border-slate-200 bg-slate-100 dark:border-slate-700 dark:bg-slate-800">
                    <img
                      src={heroImageUrl}
                      alt="Banner campaña"
                      className="h-52 w-full object-cover"
                    />
                  </div>
                ) : null}

                <div className="px-6 py-6">
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm leading-7 text-slate-700 dark:border-slate-700 dark:bg-slate-950/60 dark:text-slate-300">
                    <p className="font-semibold text-slate-900 dark:text-white">
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
                          style={{ backgroundColor: brandColor }}
                        >
                          {ctaText || "Reservar ahora"}
                        </a>
                      </div>
                    ) : null}
                  </div>

                  <div className="mt-5 border-t border-slate-200 pt-4 text-xs leading-6 text-slate-500 dark:border-slate-700 dark:text-slate-400">
                    {footerNote}
                  </div>
                </div>
              </div>
            </div>
          </ClassicSection>
        </div>
      </div>

      <section className="space-y-6">
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-4">
          <StatCard
            title="Campañas filtradas"
            value={loadingHistory ? "..." : String(historyStats.total)}
            description="Resultado según filtros activos."
          />
          <StatCard
            title="Correos enviados"
            value={loadingHistory ? "..." : String(historyStats.totalSent)}
            description="Suma total de enviados en la vista actual."
          />
          <StatCard
            title="Tasa promedio"
            value={loadingHistory ? "..." : `${historyStats.avgSuccess}%`}
            description="Éxito promedio según límite aplicado."
          />
          <StatCard
            title="Último envío"
            value={
              loadingHistory
                ? "..."
                : historyStats.latest
                ? formatDate(historyStats.latest.created_at)
                : "Sin envíos"
            }
            description="Registro más reciente dentro del filtro."
          />
        </div>

        <Panel
          title="Historial de campañas"
          description="Ahora con filtros por canal, segmento, fecha, búsqueda y rendimiento."
        >
          {historyError ? (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-300">
              {historyError}
            </div>
          ) : null}

          <div className="space-y-4">
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-950/60">
              <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                <div className="space-y-3">
                  <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                    Período
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <FilterChip
                      active={historyPeriod === "all"}
                      label="Todo"
                      onClick={() => setHistoryPeriod("all")}
                    />
                    <FilterChip
                      active={historyPeriod === "7d"}
                      label="7 días"
                      onClick={() => setHistoryPeriod("7d")}
                    />
                    <FilterChip
                      active={historyPeriod === "30d"}
                      label="30 días"
                      onClick={() => setHistoryPeriod("30d")}
                    />
                    <FilterChip
                      active={historyPeriod === "this_month"}
                      label="Este mes"
                      onClick={() => setHistoryPeriod("this_month")}
                    />
                    <FilterChip
                      active={historyPeriod === "custom"}
                      label="Personalizado"
                      onClick={() => setHistoryPeriod("custom")}
                    />
                  </div>

                  {historyPeriod === "custom" ? (
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                      <div className="space-y-2">
                        <label className="text-xs font-medium text-slate-500 dark:text-slate-400">
                          Desde
                        </label>
                        <input
                          type="date"
                          value={customFrom}
                          onChange={(e) => setCustomFrom(e.target.value)}
                          className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-slate-400 dark:border-slate-600 dark:bg-slate-950 dark:text-white dark:focus:border-slate-500"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-medium text-slate-500 dark:text-slate-400">
                          Hasta
                        </label>
                        <input
                          type="date"
                          value={customTo}
                          onChange={(e) => setCustomTo(e.target.value)}
                          className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-slate-400 dark:border-slate-600 dark:bg-slate-950 dark:text-white dark:focus:border-slate-500"
                        />
                      </div>
                    </div>
                  ) : null}
                </div>

                <div className="space-y-3">
                  <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                    Búsqueda
                  </p>
                  <input
                    type="text"
                    value={historySearch}
                    onChange={(e) => setHistorySearch(e.target.value)}
                    placeholder="Buscar por nombre, asunto, mensaje, plan..."
                    className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-slate-400 dark:border-slate-600 dark:bg-slate-950 dark:text-white dark:focus:border-slate-500"
                  />
                </div>
              </div>

              <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <label className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                    Canal
                  </label>
                  <select
                    value={historyChannel}
                    onChange={(e) =>
                      setHistoryChannel(e.target.value as "all" | CampaignChannel)
                    }
                    className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-slate-400 dark:border-slate-600 dark:bg-slate-950 dark:text-white dark:focus:border-slate-500"
                  >
                    <option value="all">Todos</option>
                    <option value="email">Email</option>
                    <option value="whatsapp">WhatsApp</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                    Segmento
                  </label>
                  <select
                    value={historySegment}
                    onChange={(e) =>
                      setHistorySegment(e.target.value as "all" | CustomerSegment)
                    }
                    className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-slate-400 dark:border-slate-600 dark:bg-slate-950 dark:text-white dark:focus:border-slate-500"
                  >
                    <option value="all">Todos</option>
                    <option value="new">Nuevos</option>
                    <option value="recurrent">Recurrentes</option>
                    <option value="frequent">Frecuentes</option>
                    <option value="inactive">Inactivos</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                    Rendimiento
                  </label>
                  <select
                    value={historyPerformance}
                    onChange={(e) =>
                      setHistoryPerformance(e.target.value as HistoryPerformance)
                    }
                    className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-slate-400 dark:border-slate-600 dark:bg-slate-950 dark:text-white dark:focus:border-slate-500"
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
                  className="inline-flex h-10 items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  Limpiar filtros
                </button>

                <button
                  type="button"
                  onClick={() => slug && loadCampaignHistory(slug)}
                  className="inline-flex h-10 items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  Recargar historial
                </button>
              </div>
            </div>

            <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900/70">
              <div className="border-b border-slate-200 px-4 py-3 dark:border-slate-700">
                <p className="text-sm font-semibold text-slate-900 dark:text-white">
                  Últimas campañas
                </p>
              </div>

              {loadingHistory ? (
                <HistorySkeleton />
              ) : filteredHistory.length === 0 ? (
                <div className="px-4 py-10 text-sm text-slate-600 dark:text-slate-400">
                  No hay campañas que coincidan con los filtros actuales.
                </div>
              ) : (
                <div className="divide-y divide-slate-200 dark:divide-slate-700">
                  {filteredHistory.map((item) => {
                    const channelStyle = getChannelStyles(item.channel);
                    const segmentStyle = getCustomerSegmentStyles(item.segment);
                    const successRate = getSuccessRate(item);
                    const performanceStyle = getPerformanceStyles(
                      successRate,
                      item.failed_count
                    );

                    return (
                      <div key={item.id} className="px-4 py-5">
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="truncate text-base font-semibold text-slate-900 dark:text-white">
                                {item.campaign_name?.trim() || "Campaña sin nombre"}
                              </p>

                              <span
                                className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${channelStyle.className}`}
                              >
                                {channelStyle.label}
                              </span>

                              <span
                                className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${segmentStyle.className}`}
                              >
                                {getSegmentLabel(item.segment)}
                              </span>

                              <span
                                className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${performanceStyle.className}`}
                              >
                                {performanceStyle.label}
                              </span>
                            </div>

                            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                              {formatDate(item.created_at)}
                            </p>

                            {item.subject ? (
                              <p className="mt-3 text-sm font-medium text-slate-900 dark:text-white">
                                Asunto: {item.subject}
                              </p>
                            ) : null}

                            {item.message ? (
                              <p className="mt-2 line-clamp-3 whitespace-pre-line text-sm leading-6 text-slate-600 dark:text-slate-400">
                                {item.message}
                              </p>
                            ) : null}

                            <div className="mt-4 flex flex-wrap gap-2 text-xs">
                              <span className="rounded-full bg-slate-100 px-3 py-1 font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                                Plan: {getPlanLabel(item.plan_slug)}
                              </span>
                              <span className="rounded-full bg-slate-100 px-3 py-1 font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                                Orden: {getSortLabel(item.sort)}
                              </span>
                              <span className="rounded-full bg-slate-100 px-3 py-1 font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                                Inactividad: {item.inactive_days} días
                              </span>
                              <span className="rounded-full bg-slate-100 px-3 py-1 font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                                Plan límite: {item.plan_limit}
                              </span>
                              <span className="rounded-full bg-slate-100 px-3 py-1 font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                                Pedido: {item.requested_limit}
                              </span>
                            </div>
                          </div>

                          <div className="grid min-w-full grid-cols-2 gap-3 sm:grid-cols-3 lg:min-w-[420px]">
                            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800/70">
                              <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                                Audiencia
                              </p>
                              <p className="mt-1 text-lg font-semibold text-slate-900 dark:text-white">
                                {item.audience_total}
                              </p>
                            </div>

                            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800/70">
                              <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                                Aplicado
                              </p>
                              <p className="mt-1 text-lg font-semibold text-slate-900 dark:text-white">
                                {item.applied_limit}
                              </p>
                            </div>

                            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800/70">
                              <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                                Con contacto
                              </p>
                              <p className="mt-1 text-lg font-semibold text-slate-900 dark:text-white">
                                {item.recipients_with_contact}
                              </p>
                            </div>

                            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800/70">
                              <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                                Enviados
                              </p>
                              <p className="mt-1 text-lg font-semibold text-emerald-600 dark:text-emerald-300">
                                {item.sent_count}
                              </p>
                            </div>

                            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800/70">
                              <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                                Fallidos
                              </p>
                              <p className="mt-1 text-lg font-semibold text-rose-600 dark:text-rose-300">
                                {item.failed_count}
                              </p>
                            </div>

                            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800/70">
                              <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                                Éxito
                              </p>
                              <p className="mt-1 text-lg font-semibold text-slate-900 dark:text-white">
                                {successRate}%
                              </p>
                            </div>
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

      {confirmOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 px-4">
          <div className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-700 dark:bg-slate-900">
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
              Confirmar envío
            </p>
            <h3 className="mt-2 text-2xl font-semibold text-slate-900 dark:text-white">
              ¿Estás seguro?
            </h3>
            <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-400">
              Enviarás hasta <span className="font-semibold">{limitedAudienceCount}</span>{" "}
              correos en simultáneo usando el segmento{" "}
              <span className="font-semibold">{selectedSegmentLabel}</span>.
            </p>
            <p className="mt-2 text-sm leading-7 text-slate-600 dark:text-slate-400">
              Asunto: <span className="font-semibold">{subject || "Sin asunto"}</span>
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => setConfirmOpen(false)}
                className="inline-flex h-11 items-center justify-center rounded-2xl border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={handleSendCampaignConfirmed}
                className="inline-flex h-11 items-center justify-center rounded-2xl bg-slate-900 px-5 text-sm font-semibold text-white transition hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
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