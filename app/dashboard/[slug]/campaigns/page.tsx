"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "next/navigation";
import {
  ArrowRight,
  BarChart3,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Image as ImageIcon,
  Mail,
  MessageCircle,
  Plus,
  Search,
  Send,
  Sparkles,
  Users,
} from "lucide-react";

const BACKEND_URL = "https://orbyx-backend.onrender.com";

type CustomerSegment = "new" | "recurrent" | "frequent" | "inactive";
type CampaignChannel = "email" | "whatsapp";
type CampaignSort = "oldest" | "recent" | "most_visits" | "least_visits";
type PlanSlug = "pro" | "premium" | "vip" | "platinum";

type Customer = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  segment: CustomerSegment;
  last_visit_at: string | null;
  total_visits: number;
};

type CustomersResponse = {
  customers: Customer[];
  total: number;
};

type CampaignHistoryItem = {
  id: string;
  campaign_name: string | null;
  channel: CampaignChannel;
  segment: CustomerSegment;
  inactive_days: number;
  subject: string | null;
  message: string | null;
  sort: CampaignSort;
  plan_slug: PlanSlug;
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
  campaigns: CampaignHistoryItem[];
};

type SendEmailResponse = {
  ok: boolean;
  sent: number;
  failed: number;
};

type AudienceRecipient = {
  id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  included: boolean;
  source: "segment" | "manual";
};

type ManualRecipientForm = {
  name: string;
  email: string;
  phone: string;
};

const SEGMENT_OPTIONS = [
  { key: "inactive", label: "Inactivos" },
  { key: "new", label: "Nuevos" },
  { key: "recurrent", label: "Recurrentes" },
  { key: "frequent", label: "Frecuentes" },
];

const CHANNEL_OPTIONS = [
  { key: "email", label: "Email" },
  { key: "whatsapp", label: "WhatsApp" },
];

const SORT_OPTIONS = [
  { key: "oldest", label: "Más antiguos" },
  { key: "recent", label: "Más recientes" },
];

const PLAN_EMAIL_LIMITS: Record<PlanSlug, number> = {
  pro: 50,
  premium: 150,
  vip: 400,
  platinum: 1000,
};

const PLAN_IMAGE_LIMITS: Record<PlanSlug, number> = {
  pro: 7,
  premium: 15,
  vip: 30,
  platinum: 100,
};

const INACTIVE_OPTIONS = [
  { value: "30", label: "30 días" },
  { value: "60", label: "60 días" },
  { value: "90", label: "90 días" },
  { value: "120", label: "120+ días" },
];

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

function normalizeEmail(value: string) {
  return String(value || "").trim().toLowerCase();
}

function normalizePhone(value: string) {
  return String(value || "").replace(/\s+/g, "").trim();
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizeEmail(value));
}

function isValidPhone(value: string) {
  const normalized = normalizePhone(value).replace(/[^\d+]/g, "");
  return normalized.length >= 8;
}

function buildRecipientId(source: "segment" | "manual", rawId: string) {
  return `${source}:${rawId}`;
}

function getSuccessRate(item: CampaignHistoryItem) {
  const base = Number(item.applied_limit || 0);
  if (base <= 0) return 0;
  return Math.round((Number(item.sent_count || 0) / base) * 100);
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
    bg: "rgba(59,130,246,0.14)",
    border: "rgba(59,130,246,0.28)",
    color: "rgb(37 99 235)",
  };
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

function getSortLabel(sort?: string) {
  return SORT_OPTIONS.find((item) => item.key === sort)?.label || "Sin orden";
}

function getSegmentLabel(segment?: string) {
  return SEGMENT_OPTIONS.find((item) => item.key === segment)?.label || "Segmento";
}

function getPerformanceBucket(rate: number, failedCount: number) {
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

function MetricCard({
  title,
  value,
  helper,
}: {
  title: string;
  value: string;
  helper: string;
}) {
  return (
    <div
      className="rounded-[22px] border p-5"
      style={{
        borderColor: "var(--border-color)",
        background: "var(--bg-card)",
      }}
    >
      <p className="text-sm" style={{ color: "var(--text-muted)" }}>
        {title}
      </p>

      <p
        className="mt-2 text-[32px] font-semibold tracking-tight"
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

function MiniStat({
  title,
  value,
  helper,
}: {
  title: string;
  value: string;
  helper: string;
}) {
  return (
    <div
      className="rounded-[18px] border px-4 py-3"
      style={{
        borderColor: "var(--border-color)",
        background: "var(--bg-card)",
      }}
    >
      <p className="text-xs" style={{ color: "var(--text-muted)" }}>
        {title}
      </p>

      <p
        className="mt-1 text-2xl font-semibold"
        style={{ color: "var(--text-main)" }}
      >
        {value}
      </p>

      <p className="mt-2 text-xs leading-5" style={{ color: "var(--text-muted)" }}>
        {helper}
      </p>
    </div>
  );
}

function TinyMetric({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div
      className="rounded-[18px] border px-4 py-3"
      style={{
        borderColor: "var(--border-color)",
        background: "var(--bg-card)",
      }}
    >
      <p className="text-xs" style={{ color: "var(--text-muted)" }}>
        {label}
      </p>
      <p
        className="mt-1 text-2xl font-semibold"
        style={{ color: "var(--text-main)" }}
      >
        {value}
      </p>
    </div>
  );
}

function StatCard({
  title,
  value,
  helper,
  icon,
}: {
  title: string;
  value: string;
  helper: string;
  icon?: React.ReactNode;
}) {
  return (
    <div
      className="rounded-[22px] border p-5"
      style={{
        borderColor: "var(--border-color)",
        background: "var(--bg-card)",
      }}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            {title}
          </p>
          <p
            className="mt-2 text-[32px] font-semibold tracking-tight"
            style={{ color: "var(--text-main)" }}
          >
            {value}
          </p>
          <p className="mt-2 text-sm leading-6" style={{ color: "var(--text-muted)" }}>
            {helper}
          </p>
        </div>

        {icon ? (
          <div
            className="flex h-11 w-11 items-center justify-center rounded-2xl"
            style={{
              background:
                "linear-gradient(135deg, rgba(37,99,235,0.12), rgba(14,165,233,0.12))",
              color: "rgb(37 99 235)",
            }}
          >
            {icon}
          </div>
        ) : null}
      </div>
    </div>
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
      className="rounded-full px-4 py-2 text-xs font-semibold transition"
      style={{
        background: active
          ? "linear-gradient(135deg, rgb(37 99 235), rgb(14 165 233))"
          : "var(--bg-soft)",
        color: active ? "#ffffff" : "var(--text-main)",
        border: active
          ? "1px solid rgba(37,99,235,0.34)"
          : "1px solid var(--border-color)",
      }}
    >
      {label}
    </button>
  );
}

function SectionCard({
  title,
  description,
  rightSlot,
  children,
  className = "",
}: {
  title: string;
  description?: string;
  rightSlot?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`rounded-[28px] border p-6 shadow-sm ${className}`}
      style={{
        borderColor: "var(--border-color)",
        background: "var(--bg-card)",
      }}
    >
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h2
            className="text-[28px] font-semibold tracking-tight"
            style={{ color: "var(--text-main)" }}
          >
            {title}
          </h2>
          {description ? (
            <p
              className="mt-2 max-w-2xl text-sm leading-6"
              style={{ color: "var(--text-muted)" }}
            >
              {description}
            </p>
          ) : null}
        </div>

        {rightSlot ? <div className="shrink-0">{rightSlot}</div> : null}
      </div>

      {children}
    </section>
  );
}

function HistorySkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 4 }).map((_, index) => (
        <div
          key={index}
          className="rounded-[22px] border p-4"
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

  const [plan, setPlan] = useState<PlanSlug>("pro");
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
  const [whatsappMessage, setWhatsappMessage] = useState(
    "Hola {{nombre}}, te escribimos desde {{negocio}}.\n\nAgenda aquí tu próxima hora:\n{{link_agenda}}"
  );

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loadingAudience, setLoadingAudience] = useState(true);
  const [audienceSearch, setAudienceSearch] = useState("");

  const [manualRecipientForm, setManualRecipientForm] = useState<ManualRecipientForm>({
    name: "",
    email: "",
    phone: "",
  });
  const [manualRecipients, setManualRecipients] = useState<AudienceRecipient[]>([]);
  const [excludedRecipientIds, setExcludedRecipientIds] = useState<string[]>([]);

  const [sending, setSending] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [toast, setToast] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const [error, setError] = useState("");
  const [resultMessage, setResultMessage] = useState("");
  const [sendSummary, setSendSummary] = useState<SendEmailResponse | null>(null);

  const [history, setHistory] = useState<CampaignHistoryItem[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [historyError, setHistoryError] = useState("");

  const [selectedCampaign, setSelectedCampaign] = useState<CampaignHistoryItem | null>(null);
  const [campaignLogs, setCampaignLogs] = useState<any[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [logsError, setLogsError] = useState("");

  const planLimit = PLAN_EMAIL_LIMITS[plan];
  const planImageLimit = PLAN_IMAGE_LIMITS[plan];

  const availableLimitOptions = ["10", "25", "50", "100", "150", "400", "1000"]
    .map(Number)
    .filter((value) => value <= planLimit)
    .map(String);

  const inputClass =
    "h-12 w-full rounded-2xl border px-4 text-sm outline-none transition";
  const textareaClass =
    "min-h-[140px] w-full rounded-2xl border px-4 py-3 text-sm outline-none transition";
  const selectClass =
    "h-12 w-full rounded-2xl border px-4 text-sm outline-none transition";
  const primaryButtonClass =
    "inline-flex h-12 items-center justify-center rounded-2xl px-5 text-sm font-medium text-white transition disabled:cursor-not-allowed disabled:opacity-60";
  const secondaryButtonClass =
    "inline-flex h-12 items-center justify-center rounded-2xl border px-5 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-60";
  return (
    <div className="space-y-6 p-6">

      {/* HEADER */}
      <div>
        <h1 className="text-3xl font-semibold">Campañas</h1>
        <p className="text-sm text-gray-500">
          Automatiza mensajes y recupera clientes
        </p>
      </div>

      {/* GRID */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">

        {/* LEFT */}
        <div className="space-y-6">

          {/* CONFIG */}
          <div className="border rounded-2xl p-4 space-y-4">
            <p className="font-semibold">Configuración</p>

            <select
              value={channel}
              onChange={(e) => setChannel(e.target.value as CampaignChannel)}
              className="w-full border rounded-xl p-2"
            >
              <option value="email">Email</option>
              <option value="whatsapp">WhatsApp</option>
            </select>

            <select
              value={segment}
              onChange={(e) => setSegment(e.target.value as CustomerSegment)}
              className="w-full border rounded-xl p-2"
            >
              {SEGMENT_OPTIONS.map((s) => (
                <option key={s.key} value={s.key}>
                  {s.label}
                </option>
              ))}
            </select>

            <select
              value={sendLimit}
              onChange={(e) => setSendLimit(e.target.value)}
              className="w-full border rounded-xl p-2"
            >
              {availableLimitOptions.map((o) => (
                <option key={o}>{o}</option>
              ))}
            </select>
          </div>

          {/* CONTENIDO */}
          <div className="border rounded-2xl p-4 space-y-4">
            <p className="font-semibold">Contenido</p>

            <input
              value={campaignName}
              onChange={(e) => setCampaignName(e.target.value)}
              placeholder="Nombre campaña"
              className="w-full border rounded-xl p-2"
            />

            {channel === "email" ? (
              <>
                <input
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Asunto"
                  className="w-full border rounded-xl p-2"
                />

                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full border rounded-xl p-2"
                />
              </>
            ) : (
              <textarea
                value={whatsappMessage}
                onChange={(e) => setWhatsappMessage(e.target.value)}
                className="w-full border rounded-xl p-2"
              />
            )}
          </div>

          {/* AUDIENCIA */}
          <div className="border rounded-2xl p-4 space-y-4">
            <p className="font-semibold">Audiencia</p>

            {allRecipients.map((r) => (
              <div
                key={r.id}
                className="flex justify-between items-center border p-2 rounded-xl"
              >
                <div>
                  <p className="text-sm font-medium">{r.name}</p>
                  <p className="text-xs text-gray-500">
                    {r.email || r.phone}
                  </p>
                </div>

                <button
                  onClick={() => toggleRecipientIncluded(r.id)}
                  className={`text-xs px-3 py-1 rounded-xl ${
                    r.included ? "bg-green-500 text-white" : "bg-red-500 text-white"
                  }`}
                >
                  {r.included ? "Incluido" : "Excluido"}
                </button>
              </div>
            ))}
          </div>

          {/* BOTÓN */}
          <button
            onClick={handleSendCampaignConfirmed}
            className="w-full bg-blue-600 text-white py-3 rounded-2xl"
          >
            {sending ? "Enviando..." : "Enviar campaña"}
          </button>
        </div>

        {/* PREVIEW */}
        <div className="border rounded-2xl p-4 sticky top-4 h-fit">
          <p className="font-semibold mb-3">Preview</p>

          {channel === "email" ? (
            <div className="border p-4 rounded-xl bg-white">
              <p className="font-bold">{subject || "Asunto..."}</p>
              <p className="mt-2 text-sm">{message || "Mensaje..."}</p>
            </div>
          ) : (
            <div className="bg-green-500 text-white p-4 rounded-xl max-w-xs">
              {whatsappMessage || "Mensaje..."}
            </div>
          )}
        </div>
      </div>

      {/* RESULTADO */}
      {resultMessage && (
        <div className="bg-green-100 text-green-700 p-3 rounded-xl">
          {resultMessage}
        </div>
      )}

      {error && (
        <div className="bg-red-100 text-red-700 p-3 rounded-xl">
          {error}
        </div>
      )}

      {/* TOAST */}
      {toast && (
        <div className="fixed bottom-5 right-5 bg-black text-white px-4 py-2 rounded-xl">
          {toast.message}
        </div>
      )}
    </div>
  );
}