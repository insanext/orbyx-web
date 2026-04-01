"use client";

import { useEffect, useMemo, useRef, useState } from "react";
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
type ImageFitType = "cover" | "contain";

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

type AudienceRecipientSource = "segment" | "manual";

type AudienceRecipient = {
  id: string;
  source: AudienceRecipientSource;
  included: boolean;
  name: string;
  email: string | null;
  phone: string | null;
  segment?: CustomerSegment;
  last_visit_at?: string | null;
  total_visits?: number;
};

type ManualRecipientForm = {
  name: string;
  email: string;
  phone: string;
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

function escapeHtml(value: string) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function normalizeEditorHtml(html?: string | null) {
  if (!html) return "";

  let value = String(html);

  value = value.replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "");
  value = value.replace(/<style[\s\S]*?>[\s\S]*?<\/style>/gi, "");
  value = value.replace(/\son\w+="[^"]*"/gi, "");
  value = value.replace(/\son\w+='[^']*'/gi, "");
  value = value.replace(/javascript:/gi, "");

  return value.trim();
}

function editorHtmlToPlainText(html?: string | null) {
  if (!html) return "";
  return String(html)
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<\/div>/gi, "\n")
    .replace(/<\/li>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function plainTextToHtml(value?: string | null) {
  const safe = escapeHtml(String(value || "").trim());
  if (!safe) return "";
  return safe
    .split(/\n{2,}/)
    .map((paragraph) => `<p>${paragraph.replace(/\n/g, "<br />")}</p>`)
    .join("");
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

function buildRecipientId(source: AudienceRecipientSource, rawId: string) {
  return `${source}:${rawId}`;
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

function buildEmailPreviewHtml({
  businessName,
  subject,
  brandColor,
  heroImageUrl,
  heroImageHeight,
  heroImagePositionY,
  heroImageFit,
  messageHtml,
  footerHtml,
  ctaText,
  ctaUrl,
  showCta,
}: {
  businessName: string;
  subject: string;
  brandColor: string;
  heroImageUrl: string;
  heroImageHeight: number;
  heroImagePositionY: number;
  heroImageFit: ImageFitType;
  messageHtml: string;
  footerHtml: string;
  ctaText: string;
  ctaUrl: string;
  showCta: boolean;
}) {
  const safeBusinessName = escapeHtml(businessName || "Orbyx");
  const safeSubject = escapeHtml(subject || "Campaña");
  const safeBrandColor = String(brandColor || "#0f766e").trim();
  const safeHeroImageUrl = String(heroImageUrl || "").trim();
  const safeCtaText = escapeHtml(ctaText || "Agendar visita");
  const safeCtaUrl = String(ctaUrl || "").trim();

  const normalizedMessageHtml =
    normalizeEditorHtml(messageHtml) || `<p>${escapeHtml("Sin contenido")}</p>`;

  const normalizedFooterHtml =
    normalizeEditorHtml(footerHtml) ||
    `<p>${escapeHtml("Este correo fue enviado por Orbyx.")}</p>`;

  const heroBlock = safeHeroImageUrl
    ? `
      <tr>
        <td style="background:#e2e8f0;">
          <img
            src="${safeHeroImageUrl}"
            alt="Banner campaña"
            style="
              display:block;
              width:100%;
              height:${heroImageHeight}px;
              object-fit:${heroImageFit};
              object-position:center ${heroImagePositionY}%;
              border:0;
              background:#e2e8f0;
            "
          />
        </td>
      </tr>
    `
    : "";

  const ctaBlock =
    showCta && safeCtaUrl
      ? `
        <div style="margin-top:28px;">
          <a
            href="${safeCtaUrl}"
            target="_blank"
            rel="noreferrer"
            style="
              display:inline-block;
              padding:14px 22px;
              border-radius:16px;
              background:${safeBrandColor};
              color:#ffffff;
              font-size:14px;
              font-weight:700;
              text-decoration:none;
            "
          >
            ${safeCtaText}
          </a>
        </div>
      `
      : "";

  return `
    <div style="margin:0;padding:0;background:#f8fafc;font-family:Arial,Helvetica,sans-serif;color:#0f172a;">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f8fafc;padding:32px 16px;">
        <tr>
          <td align="center">
            <table
              role="presentation"
              width="100%"
              cellspacing="0"
              cellpadding="0"
              style="
                max-width:680px;
                background:#ffffff;
                border:1px solid #e2e8f0;
                border-radius:28px;
                overflow:hidden;
              "
            >
              <tr>
                <td
                  style="
                    padding:32px 32px 24px 32px;
                    background:${safeBrandColor};
                    color:#ffffff;
                  "
                >
                  <div style="font-size:11px;letter-spacing:0.22em;text-transform:uppercase;opacity:0.78;font-weight:700;">
                    ${safeBusinessName}
                  </div>

                  <h1 style="margin:12px 0 0 0;font-size:28px;line-height:1.2;font-weight:700;">
                    ${safeSubject}
                  </h1>
                </td>
              </tr>

              ${heroBlock}

              <tr>
                <td style="padding:32px;">
                  <div
                    style="
                      border:1px solid #e2e8f0;
                      border-radius:20px;
                      background:#f8fafc;
                      padding:24px;
                      font-size:16px;
                      line-height:1.8;
                      color:#334155;
                    "
                  >
                    <div style="font-weight:700;color:#0f172a;">
                      Hola,
                    </div>

                    <div style="margin-top:14px;">
                      ${normalizedMessageHtml}
                    </div>

                    ${ctaBlock}
                  </div>

                  <div
                    style="
                      margin-top:24px;
                      padding-top:20px;
                      border-top:1px solid #e2e8f0;
                      font-size:13px;
                      line-height:1.7;
                      color:#64748b;
                    "
                  >
                    ${normalizedFooterHtml}
                  </div>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </div>
  `;
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
  className="rounded-2xl border p-3"
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
        className="mt-1 text-lg font-semibold"
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

function RichTextEditor({
  label,
  value,
  onChange,
  placeholder,
  minHeight = 180,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  minHeight?: number;
}) {
  const editorRef = useRef<HTMLDivElement | null>(null);
  const [currentFontSize, setCurrentFontSize] = useState("3");
  const [currentFontName, setCurrentFontName] = useState("Arial");
  const colorInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!editorRef.current) return;
    if (editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value || "";
    }
  }, [value]);

  function focusEditor() {
    editorRef.current?.focus();
  }

  function syncHtml() {
    onChange(normalizeEditorHtml(editorRef.current?.innerHTML || ""));
  }

  function runCommand(command: string, commandValue?: string) {
    focusEditor();
    document.execCommand(command, false, commandValue);
    syncHtml();
  }

  function handleInput() {
    syncHtml();
  }

  function handleLink() {
    const url = window.prompt("Ingresa la URL del enlace", "https://");
    if (!url) return;
    runCommand("createLink", url);
  }

  function applyFormatBlock(value: "p" | "h1" | "h2") {
    if (value === "p") {
      runCommand("formatBlock", "<p>");
      return;
    }

    if (value === "h1") {
      runCommand("formatBlock", "<h1>");
      return;
    }

    runCommand("formatBlock", "<h2>");
  }

  function applyFontSize(size: string) {
    setCurrentFontSize(size);
    runCommand("fontSize", size);
  }

  function applyFontName(font: string) {
    setCurrentFontName(font);
    runCommand("fontName", font);
  }

  function ToolbarButton({
    onClick,
    children,
    title,
    className = "",
  }: {
    onClick: () => void;
    children: React.ReactNode;
    title: string;
    className?: string;
  }) {
    return (
      <button
        type="button"
        title={title}
        onClick={onClick}
        className={`inline-flex h-10 min-w-[40px] items-center justify-center rounded-xl border px-3 text-sm font-semibold transition ${className}`}
        style={{
          borderColor: "var(--border-color)",
          background: "var(--bg-card)",
          color: "var(--text-main)",
        }}
      >
        {children}
      </button>
    );
  }

  return (
    <div>
      <label
        className="mb-2 block text-sm font-medium"
        style={{ color: "var(--text-main)" }}
      >
        {label}
      </label>

      <div
        className="overflow-hidden rounded-[22px] border"
        style={{
          borderColor: "var(--border-color)",
          background: "var(--bg-card)",
        }}
      >
        <div
          className="flex flex-wrap items-center gap-2 border-b p-3"
          style={{
            borderColor: "var(--border-color)",
            background: "var(--bg-soft)",
          }}
        >
          <select
            value="p"
            onChange={(e) => applyFormatBlock(e.target.value as "p" | "h1" | "h2")}
            className="h-10 rounded-xl border px-3 text-sm outline-none"
            style={{
              borderColor: "var(--border-color)",
              background: "var(--bg-card)",
              color: "var(--text-main)",
            }}
          >
            <option value="p">Normal</option>
            <option value="h1">Título grande</option>
            <option value="h2">Subtítulo</option>
          </select>

          <select
            value={currentFontName}
            onChange={(e) => applyFontName(e.target.value)}
            className="h-10 rounded-xl border px-3 text-sm outline-none"
            style={{
              borderColor: "var(--border-color)",
              background: "var(--bg-card)",
              color: "var(--text-main)",
            }}
          >
            <option value="Arial">Arial</option>
            <option value="Verdana">Verdana</option>
            <option value="Georgia">Georgia</option>
            <option value="Tahoma">Tahoma</option>
            <option value="Times New Roman">Times New Roman</option>
          </select>

          <select
            value={currentFontSize}
            onChange={(e) => applyFontSize(e.target.value)}
            className="h-10 rounded-xl border px-3 text-sm outline-none"
            style={{
              borderColor: "var(--border-color)",
              background: "var(--bg-card)",
              color: "var(--text-main)",
            }}
          >
            <option value="2">Pequeña</option>
            <option value="3">Normal</option>
            <option value="4">Mediana</option>
            <option value="5">Grande</option>
          </select>

          <ToolbarButton title="Negrita" onClick={() => runCommand("bold")}>
            <span className="font-bold">B</span>
          </ToolbarButton>

          <ToolbarButton title="Cursiva" onClick={() => runCommand("italic")}>
            <span className="italic">I</span>
          </ToolbarButton>

          <ToolbarButton title="Subrayado" onClick={() => runCommand("underline")}>
            <span className="underline">U</span>
          </ToolbarButton>

          <ToolbarButton
            title="Lista con viñetas"
            onClick={() => runCommand("insertUnorderedList")}
          >
            • Lista
          </ToolbarButton>

          <ToolbarButton title="Alinear izquierda" onClick={() => runCommand("justifyLeft")}>
            ⬅
          </ToolbarButton>

          <ToolbarButton title="Centrar" onClick={() => runCommand("justifyCenter")}>
            ↔
          </ToolbarButton>

          <ToolbarButton title="Alinear derecha" onClick={() => runCommand("justifyRight")}>
            ➡
          </ToolbarButton>

          <ToolbarButton title="Insertar enlace" onClick={handleLink}>
            Link
          </ToolbarButton>

          <div
            className="flex h-10 items-center gap-2 rounded-xl border px-3"
            style={{
              borderColor: "var(--border-color)",
              background: "var(--bg-card)",
              color: "var(--text-main)",
            }}
          >
            <span className="text-xs font-semibold">Color</span>

            <button
              type="button"
              onClick={() => colorInputRef.current?.click()}
              className="h-6 w-6 rounded-full border"
              style={{
                borderColor: "rgba(255,255,255,0.16)",
                background: "linear-gradient(135deg, #ef4444, #f59e0b, #10b981, #3b82f6, #8b5cf6)",
              }}
              title="Elegir color"
            />

            <input
              ref={colorInputRef}
              type="color"
              defaultValue="#0f766e"
              onChange={(e) => runCommand("foreColor", e.target.value)}
              className="sr-only"
            />
          </div>

          <ToolbarButton title="Limpiar formato" onClick={() => runCommand("removeFormat")}>
            Limpiar
          </ToolbarButton>
        </div>

        <div
          ref={editorRef}
          contentEditable
          suppressContentEditableWarning
          onInput={handleInput}
          data-placeholder={placeholder || ""}
          className="rich-editor px-4 py-4 text-sm outline-none"
          style={{
            minHeight,
            color: "var(--text-main)",
          }}
        />
      </div>

      <style jsx>{`
        .rich-editor:empty:before {
          content: attr(data-placeholder);
          color: var(--text-muted);
        }
        .rich-editor h1 {
          font-size: 1.9rem;
          font-weight: 700;
          line-height: 1.2;
          margin: 0.7rem 0;
        }
        .rich-editor h2 {
          font-size: 1.35rem;
          font-weight: 700;
          line-height: 1.28;
          margin: 0.6rem 0;
        }
        .rich-editor p {
          margin: 0.55rem 0;
        }
        .rich-editor ul {
          margin: 0.6rem 0 0.6rem 1.25rem;
          list-style: disc;
        }
        .rich-editor a {
          color: #2563eb;
          text-decoration: underline;
        }
        .rich-editor font[size="2"] {
          font-size: 0.9rem;
        }
        .rich-editor font[size="3"] {
          font-size: 1rem;
        }
        .rich-editor font[size="4"] {
          font-size: 1.125rem;
        }
        .rich-editor font[size="5"] {
          font-size: 1.35rem;
        }
      `}</style>
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
  const [messageHtml, setMessageHtml] = useState(
    plainTextToHtml(
      "Hola {{nombre}}, queremos invitarte a volver. Tenemos horas disponibles y nos encantaría atenderte nuevamente."
    )
  );

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [audienceSearch, setAudienceSearch] = useState("");
  const [manualRecipientForm, setManualRecipientForm] = useState<ManualRecipientForm>({
    name: "",
    email: "",
    phone: "",
  });
  const [manualRecipients, setManualRecipients] = useState<AudienceRecipient[]>([]);
  const [excludedRecipientIds, setExcludedRecipientIds] = useState<string[]>([]);
  const [loadingAudience, setLoadingAudience] = useState(true);
  const [sending, setSending] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [error, setError] = useState("");
  const [resultMessage, setResultMessage] = useState("");
  const [sendSummary, setSendSummary] = useState<SendEmailResponse | null>(null);
  const [toast, setToast] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const [history, setHistory] = useState<CampaignHistoryItem[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [historyError, setHistoryError] = useState("");

const [selectedCampaign, setSelectedCampaign] = useState<CampaignHistoryItem | null>(null);
const [campaignLogs, setCampaignLogs] = useState<any[]>([]);
const [loadingLogs, setLoadingLogs] = useState(false);
const [logsError, setLogsError] = useState("");

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
  const [heroImageHeight, setHeroImageHeight] = useState(260);
  const [heroImagePositionY, setHeroImagePositionY] = useState(50);
  const [heroImageFit, setHeroImageFit] = useState<ImageFitType>("cover");
  const [ctaText, setCtaText] = useState("Agendar visita");
  const [ctaUrl, setCtaUrl] = useState("");
  const [showCta, setShowCta] = useState(true);
  const [footerNote, setFooterNote] = useState(
    "Te esperamos para ayudarte a mantener tu agenda más activa."
  );
  const [footerHtml, setFooterHtml] = useState(
    plainTextToHtml("Te esperamos para ayudarte a mantener tu agenda más activa.")
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
      setFooterHtml(plainTextToHtml("Gracias por seguir confiando en nosotros."));
    }

    if (emailPreset === "promo") {
      setBrandColor("#0f766e");
      setShowCta(true);
      setCtaText("Agendar visita");
      setFooterNote("Te esperamos para ayudarte a mantener tu agenda más activa.");
      setFooterHtml(
        plainTextToHtml("Te esperamos para ayudarte a mantener tu agenda más activa.")
      );
    }

    if (emailPreset === "reminder") {
      setBrandColor("#1d4ed8");
      setShowCta(true);
      setCtaText("Ver horas disponibles");
      setFooterNote("Recuerda que tenemos agenda disponible para ti.");
      setFooterHtml(plainTextToHtml("Recuerda que tenemos agenda disponible para ti."));
    }
  }, [emailPreset]);

  useEffect(() => {
    setMessage(editorHtmlToPlainText(messageHtml));
  }, [messageHtml]);

  useEffect(() => {
    setFooterNote(editorHtmlToPlainText(footerHtml));
  }, [footerHtml]);

  useEffect(() => {
    if (!toast) return;

    const timer = window.setTimeout(() => {
      setToast(null);
    }, 3500);

    return () => window.clearTimeout(timer);
  }, [toast]);

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
console.log("slug", slug);
console.log("segment", segment);
console.log("channel", channel);
console.log("customers api", data.customers);
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
      setSelectedCampaign(null);
      setCampaignLogs([]);
      setLogsError("");
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

async function loadCampaignLogs(campaignId: string) {
  try {
    setLoadingLogs(true);
    setLogsError("");

    const res = await fetch(`${BACKEND_URL}/campaigns/logs/${campaignId}`);
    const data = await res.json();

    if (!res.ok) {
      throw new Error(data?.error || "No se pudieron cargar los logs");
    }

    setCampaignLogs(Array.isArray(data.logs) ? data.logs : []);
  } catch (err: unknown) {
    setLogsError(err instanceof Error ? err.message : "Error cargando logs");
    setCampaignLogs([]);
  } finally {
    setLoadingLogs(false);
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

      const images = Array.isArray(data.images) ? data.images : [];

      setCampaignImages(images);
      setImagesLimitInfo({
        current:
          Number(
            data?.limits?.current_count ??
              data?.limits?.current ??
              images.length ??
              0
          ) || 0,
        max:
          Number(
            data?.limits?.max_images ??
              data?.limits?.max ??
              planImageLimit
          ) || planImageLimit,
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

      const res = await fetch(
        `${BACKEND_URL}/campaign-images/${imageId}?slug=${encodeURIComponent(slug)}`,
        {
          method: "DELETE",
        }
      );

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

  function resetManualRecipientForm() {
    setManualRecipientForm({
      name: "",
      email: "",
      phone: "",
    });
  }

  function toggleRecipientIncluded(recipientId: string) {
    setExcludedRecipientIds((prev) =>
      prev.includes(recipientId)
        ? prev.filter((id) => id !== recipientId)
        : [...prev, recipientId]
    );
  }

  function removeManualRecipient(recipientId: string) {
    setManualRecipients((prev) => prev.filter((item) => item.id !== recipientId));
    setExcludedRecipientIds((prev) => prev.filter((id) => id !== recipientId));
  }

  function handleAddManualRecipient() {
    const trimmedName = manualRecipientForm.name.trim();

    if (!trimmedName) {
      setError("Debes ingresar el nombre del destinatario manual.");
      return;
    }

    if (channel === "email") {
      const email = normalizeEmail(manualRecipientForm.email);

      if (!isValidEmail(email)) {
        setError("Debes ingresar un correo válido.");
        return;
      }

      const duplicateInManual = manualRecipients.some(
        (item) => normalizeEmail(item.email || "") === email
      );

      const duplicateInCustomers = customers.some(
        (item) => normalizeEmail(item.email || "") === email
      );

      if (duplicateInManual || duplicateInCustomers) {
        setError("Ese correo ya está agregado en la audiencia.");
        return;
      }

      setManualRecipients((prev) => [
        {
          id: buildRecipientId("manual", `email:${email}`),
          source: "manual",
          included: true,
          name: trimmedName,
          email,
          phone: null,
        },
        ...prev,
      ]);

      setError("");
      resetManualRecipientForm();
      return;
    }

    const phone = normalizePhone(manualRecipientForm.phone);

    if (!isValidPhone(phone)) {
      setError("Debes ingresar un teléfono válido.");
      return;
    }

    const duplicateInManual = manualRecipients.some(
      (item) => normalizePhone(item.phone || "") === phone
    );

    const duplicateInCustomers = customers.some(
      (item) => normalizePhone(item.phone || "") === phone
    );

    if (duplicateInManual || duplicateInCustomers) {
      setError("Ese teléfono ya está agregado en la audiencia.");
      return;
    }

    setManualRecipients((prev) => [
      {
        id: buildRecipientId("manual", `phone:${phone}`),
        source: "manual",
        included: true,
        name: trimmedName,
        email: null,
        phone,
      },
      ...prev,
    ]);

    setError("");
    resetManualRecipientForm();
  }

  useEffect(() => {
    if (slug) {
      loadCampaignHistory(slug);
      loadCampaignImages(slug);
    }
  }, [slug]);

const segmentRecipients = useMemo<AudienceRecipient[]>(() => {
  return customers.map((customer) => ({
    id: buildRecipientId("segment", customer.id),
    source: "segment",
    included: !excludedRecipientIds.includes(buildRecipientId("segment", customer.id)),
    name: customer.name || "Sin nombre",
    email: customer.email,
    phone: customer.phone,
    segment: customer.segment,
    last_visit_at: customer.last_visit_at,
    total_visits: customer.total_visits,
  }));
}, [customers, excludedRecipientIds]);

const hasContactsForChannel = useMemo(() => {
  return segmentRecipients.some((item) =>
    channel === "email" ? !!item.email : !!item.phone
  );
}, [segmentRecipients, channel]);

const allAudienceRecipients = useMemo<AudienceRecipient[]>(() => {
  const manualForChannel = manualRecipients.filter((item) =>
    channel === "email" ? !!item.email : !!item.phone
  );

  const segmentForChannel = segmentRecipients.filter((item) => {
  if (channel === "email") return !!item.email;

  // whatsapp
  return !!item.phone;
});

  const merged = [...manualForChannel, ...segmentForChannel].map((item) => ({
    ...item,
    included: !excludedRecipientIds.includes(item.id),
  }));

  return merged;
}, [manualRecipients, segmentRecipients, channel, excludedRecipientIds]);

useEffect(() => {
  console.log("🔥 customers state:", customers);
  console.log("🔥 segmentRecipients:", segmentRecipients);
  console.log("🔥 allAudienceRecipients:", allAudienceRecipients);
}, [customers, segmentRecipients, allAudienceRecipients]);

  const audienceSearchNormalized = audienceSearch.trim().toLowerCase();

  const filteredAudienceRecipients = useMemo(() => {
    if (!audienceSearchNormalized) return allAudienceRecipients;

    return allAudienceRecipients.filter((item) => {
      const searchable = [
        item.name || "",
        item.email || "",
        item.phone || "",
        item.segment || "",
        item.source || "",
      ]
        .join(" ")
        .toLowerCase();

      return searchable.includes(audienceSearchNormalized);
    });
  }, [allAudienceRecipients, audienceSearchNormalized]);

  const includedAudienceRecipients = useMemo(() => {
    return allAudienceRecipients.filter((item) => item.included);
  }, [allAudienceRecipients]);

  const limitedIncludedRecipients = useMemo(() => {
    return includedAudienceRecipients.slice(0, Number(sendLimit || 50));
  }, [includedAudienceRecipients, sendLimit]);

  const audienceStats = useMemo(() => {
    const rawWithEmail = customers.filter((c) => !!c.email).length;
    const rawWithWhatsapp = customers.filter((c) => !!c.phone).length;

    const totalVisible = allAudienceRecipients.length;
    const included = includedAudienceRecipients.length;
    const excluded = Math.max(totalVisible - included, 0);
    const manual = manualRecipients.filter((item) =>
      channel === "email" ? !!item.email : !!item.phone
    ).length;

    return {
      totalVisible,
      included,
      excluded,
      manual,
      withEmail:
        channel === "email"
          ? totalVisible
          : rawWithEmail + manualRecipients.filter((item) => !!item.email).length,
      withWhatsapp:
        channel === "whatsapp"
          ? totalVisible
          : rawWithWhatsapp + manualRecipients.filter((item) => !!item.phone).length,
      availableForChannel: included,
    };
  }, [customers, allAudienceRecipients, includedAudienceRecipients, manualRecipients, channel]);

  const limitedAudienceCount = useMemo(() => {
    return Math.min(Number(sendLimit || 50), includedAudienceRecipients.length || 0);
  }, [sendLimit, includedAudienceRecipients]);

  const previewRecipients = useMemo(() => {
    return filteredAudienceRecipients.slice(0, 50);
  }, [filteredAudienceRecipients]);

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

  const previewHtml = useMemo(() => {
    return buildEmailPreviewHtml({
      businessName,
      subject: emailPreviewTitle,
      brandColor,
      heroImageUrl,
      heroImageHeight,
      heroImagePositionY,
      heroImageFit,
      messageHtml,
      footerHtml,
      ctaText,
      ctaUrl,
      showCta,
    });
  }, [
    businessName,
    emailPreviewTitle,
    brandColor,
    heroImageUrl,
    heroImageHeight,
    heroImagePositionY,
    heroImageFit,
    messageHtml,
    footerHtml,
    ctaText,
    ctaUrl,
    showCta,
  ]);

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
    setError("WhatsApp aún no tiene envío real habilitado.");
    return;
  }

  if (!subject.trim()) {
    setError("⚠️ Debes ingresar un asunto antes de enviar.");
    return;
  }

  if (!editorHtmlToPlainText(messageHtml).trim()) {
    setError("⚠️ Debes escribir un mensaje antes de enviar.");
    return;
  }

  if (!hasContactsForChannel) {
    setError(
      channel === "email"
        ? "⚠️ No hay clientes con email en este segmento."
        : "⚠️ No hay clientes con teléfono en este segmento."
    );
    return;
  }

  if (limitedIncludedRecipients.length <= 0) {
    setError("⚠️ No hay destinatarios incluidos para enviar.");
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

      const finalRecipients = limitedIncludedRecipients.map((item) => ({
        id: item.id,
        source: item.source,
        name: item.name,
        email: item.email,
        phone: item.phone,
      }));

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
          message: editorHtmlToPlainText(messageHtml).trim(),
          message_html: normalizeEditorHtml(messageHtml),
          limit: Number(sendLimit),
          sort,
          brand_color: brandColor,
          hero_image_url: heroImageUrl.trim(),
          hero_image_height: heroImageHeight,
          hero_image_position_y: heroImagePositionY,
          hero_image_fit: heroImageFit,
          cta_text: ctaText.trim(),
          cta_url: ctaUrl.trim(),
          show_cta: showCta,
          footer_note: editorHtmlToPlainText(footerHtml).trim(),
          footer_note_html: normalizeEditorHtml(footerHtml),
          final_recipients: finalRecipients,
          excluded_recipient_ids: excludedRecipientIds,
          manual_recipients: manualRecipients.map((item) => ({
            id: item.id,
            name: item.name,
            email: item.email,
            phone: item.phone,
          })),
        }),
      });

      const data: SendEmailResponse = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "No se pudo enviar la campaña");
      }

setResultMessage(
  `Campaña enviada. Correos enviados: ${data.sent || 0}. Fallidos: ${
    data.failed || 0
  }.`
);

setToast({
  type: "success",
  message: `Campaña enviada correctamente. Enviados: ${data.sent || 0}. Fallidos: ${
    data.failed || 0
  }.`,
});

      if (slug) {
        await loadCampaignHistory(slug);
      }
    } catch (err: unknown) {
  const message =
    err instanceof Error ? err.message : "Error enviando campaña";

  setError(message);
  setToast({
    type: "error",
    message,
  });
} finally {
      setSending(false);
    }
  }

  return (
    <div className="space-y-8">
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

      {toast ? (
        <div className="fixed right-5 top-5 z-[80] w-full max-w-md">
          <div
            className="rounded-2xl border px-4 py-4 shadow-2xl backdrop-blur"
            style={{
              borderColor:
                toast.type === "success"
                  ? "rgba(16,185,129,0.30)"
                  : "rgba(244,63,94,0.30)",
              background:
                toast.type === "success"
                  ? "rgba(16,185,129,0.14)"
                  : "rgba(244,63,94,0.14)",
              color:
                toast.type === "success"
                  ? "rgb(16 185 129)"
                  : "rgb(244 63 94)",
            }}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold">
                  {toast.type === "success" ? "Envío realizado" : "No se pudo enviar"}
                </p>
                <p className="mt-1 text-sm leading-6">{toast.message}</p>
              </div>

              <button
                type="button"
                onClick={() => setToast(null)}
                className="inline-flex h-8 w-8 items-center justify-center rounded-xl border text-sm font-semibold transition"
                style={{
                  borderColor: "rgba(255,255,255,0.12)",
                  background: "rgba(15,23,42,0.16)",
                  color: "inherit",
                }}
              >
                ×
              </button>
            </div>
          </div>
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
              ? "Destinatarios incluidos con correo."
              : "Destinatarios incluidos con teléfono."
          }
        />
        <SectionStat
          label="Se enviarán"
          value={loadingAudience ? "..." : String(limitedAudienceCount)}
          helper="Tope real según curación manual y límite."
        />
      </section>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_520px] 2xl:grid-cols-[minmax(0,1fr)_960px]">
        <div className="space-y-6">
          <Panel
            title="Configuración de campaña"
            description="Define canal, segmento, nivel de inactividad, prioridad y cantidad."
            className="bg-[linear-gradient(180deg,rgba(37,99,235,0.08),transparent_35%)]"
          >
            <div className="space-y-8">
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
                {segment === "inactive" && (
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
)}

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
                    Tu plan{" "}
                    <span style={{ color: "var(--text-main)", fontWeight: 700 }}>
                      {PLAN_LABELS[plan]}
                    </span>{" "}
                    permite hasta{" "}
                    <span style={{ color: "var(--text-main)", fontWeight: 700 }}>
                      {planLimit}
                    </span>{" "}
                    contactos por campaña.
                  </p>
                  <p>
                    El sistema intentará enviar hasta{" "}
                    <span style={{ color: "var(--text-main)", fontWeight: 700 }}>
                      {sendLimit}
                    </span>{" "}
                    destinatarios, ordenados por{" "}
                    <span style={{ color: "var(--text-main)", fontWeight: 700 }}>
                      {selectedSortLabel}
                    </span>
                    .
                  </p>
                  <p>
                    Con la audiencia curada actual, el alcance real sería de{" "}
                    <span style={{ color: "var(--text-main)", fontWeight: 700 }}>
                      {limitedAudienceCount}
                    </span>{" "}
                    contactos por este canal.
                  </p>
                </div>
              </div>
            </div>
          </Panel>

          {channel === "email" ? (
            <Panel
              title="Email"
              description="Contenido real del correo con rich text."
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

                <RichTextEditor
                  label="Mensaje"
                  value={messageHtml}
                  onChange={setMessageHtml}
                  placeholder="Escribe el contenido principal del correo..."
                  minHeight={220}
                />

                <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                  Puedes usar <strong>{"{{nombre}}"}</strong>, negrita, cursiva,
                  subrayado, títulos, listas, alineación, links y color de texto.
                </p>
              </div>
            </Panel>
          ) : (
            <Panel
              title="WhatsApp"
              description="Base visual lista para la futura sección propia de WhatsApp."
              className="bg-[linear-gradient(180deg,rgba(16,185,129,0.06),transparent_35%)]"
            >
              <div
                className="rounded-2xl border p-5"
                style={{
                  borderColor: "var(--border-color)",
                  background:
                    "linear-gradient(135deg, rgba(16,185,129,0.10), var(--bg-soft))",
                }}
              >
                <p
                  className="text-sm font-semibold"
                  style={{ color: "var(--text-main)" }}
                >
                  Sección WhatsApp en preparación
                </p>
                <p
                  className="mt-2 text-sm leading-6"
                  style={{ color: "var(--text-muted)" }}
                >
                  Aquí después irá el mensaje propio de WhatsApp, variables,
                  estilo conversacional y lógica específica del canal. Mientras
                  tanto, ya queda separada de Email.
                </p>
              </div>
            </Panel>
          )}

          {channel === "email" ? (
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
                            if (slug) loadCampaignImages(slug);
                          }}
                          className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl px-5 text-sm font-semibold transition"
                          style={{
                            background: "rgba(245, 158, 11, 0.14)",
                            border: "1px solid rgba(245, 158, 11, 0.38)",
                            color: "rgb(180 83 9)",
                            boxShadow: "0 10px 24px rgba(245,158,11,0.10)",
                          }}
                        >
                          <span style={{ fontSize: 15 }}>📁</span>
                          <span>Biblioteca de imágenes</span>
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

                      <p
                        className="text-xs leading-6"
                        style={{ color: "var(--text-muted)" }}
                      >
                        Puedes usar una URL externa como fallback o elegir una
                        imagen guardada en tu biblioteca. Límite actual:{" "}
                        <strong style={{ color: "var(--text-main)" }}>
                          {imagesLimitInfo.current}/{imagesLimitInfo.max}
                        </strong>
                        .
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  <div>
                    <label
                      className="mb-2 block text-sm font-medium"
                      style={{ color: "var(--text-main)" }}
                    >
                      Altura imagen
                    </label>
                    <input
                      type="range"
                      min={160}
                      max={420}
                      step={10}
                      value={heroImageHeight}
                      onChange={(e) => setHeroImageHeight(Number(e.target.value))}
                      className="w-full"
                    />
                    <p
                      className="mt-2 text-xs"
                      style={{ color: "var(--text-muted)" }}
                    >
                      {heroImageHeight}px
                    </p>
                  </div>

                  <div>
                    <label
                      className="mb-2 block text-sm font-medium"
                      style={{ color: "var(--text-main)" }}
                    >
                      Posición vertical
                    </label>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      step={1}
                      value={heroImagePositionY}
                      onChange={(e) =>
                        setHeroImagePositionY(Number(e.target.value))
                      }
                      className="w-full"
                    />
                    <p
                      className="mt-2 text-xs"
                      style={{ color: "var(--text-muted)" }}
                    >
                      {heroImagePositionY}%
                    </p>
                  </div>

                  <div>
                    <label
                      className="mb-2 block text-sm font-medium"
                      style={{ color: "var(--text-main)" }}
                    >
                      Enfoque
                    </label>
                    <select
                      value={heroImageFit}
                      onChange={(e) =>
                        setHeroImageFit(e.target.value as ImageFitType)
                      }
                      className={selectClass}
                      style={{
                        borderColor: "var(--border-color)",
                        background: "var(--bg-card)",
                        color: "var(--text-main)",
                      }}
                    >
                      <option value="cover">Cover</option>
                      <option value="contain">Contain</option>
                    </select>
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

                <RichTextEditor
                  label="Footer / nota final"
                  value={footerHtml}
                  onChange={setFooterHtml}
                  placeholder="Escribe el footer del correo..."
                  minHeight={160}
                />
              </div>
            </Panel>
          ) : null}

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
                <p
                  className="mt-1 text-sm leading-6"
                  style={{ color: "var(--text-muted)" }}
                >
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
  disabled={
  sending ||
  loadingAudience ||
  !hasContactsForChannel ||
  limitedIncludedRecipients.length === 0
}
  className={`${primaryButtonClass} min-w-[220px] font-semibold shadow-lg flex items-center justify-center gap-2`}
  style={{
    background: sending
      ? "linear-gradient(135deg, rgb(100 116 139), rgb(71 85 105))"
      : "linear-gradient(135deg, rgb(37 99 235), rgb(14 165 233))",
    boxShadow: sending
      ? "none"
      : "0 18px 40px rgba(37,99,235,0.28)",
    cursor: sending ? "not-allowed" : "pointer",
  }}
>
  {sending ? (
    <>
      <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
      Enviando...
    </>
  ) : (
    <>Enviar campaña</>
  )}
</button>

{!hasContactsForChannel && !loadingAudience ? (
  <p className="mt-2 text-xs" style={{ color: "rgb(245 158 11)" }}>
    No hay destinatarios válidos para este canal.
  </p>
) : null}
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

        <div className="space-y-6 self-start xl:sticky xl:top-20">
          <Panel
            title="Preview de audiencia"
            description="Curación final de destinatarios antes de enviar."
            className="bg-[linear-gradient(180deg,rgba(14,165,233,0.06),transparent_40%)]"
          >
            <div className="space-y-4">

  {!hasContactsForChannel && !loadingAudience && (
    <div
      className="rounded-2xl border px-4 py-3 text-sm"
      style={{
        borderColor: "rgba(245,158,11,0.28)",
        background: "rgba(245,158,11,0.10)",
        color: "rgb(245 158 11)",
      }}
    >
      {channel === "email"
        ? "No tienes clientes con email para este segmento."
        : "No tienes clientes con teléfono para este segmento."}
    </div>
  )}

  <div className="grid gap-4 md:grid-cols-4 xl:grid-cols-2 2xl:grid-cols-4">
                <SectionStat
                  label="Total"
                  value={loadingAudience ? "..." : String(audienceStats.totalVisible)}
                  helper="Destinatarios visibles en este canal."
                />
                <SectionStat
                  label="Incluidos"
                  value={loadingAudience ? "..." : String(audienceStats.included)}
                  helper="Entran a la lista final."
                />
                <SectionStat
                  label="Excluidos"
                  value={loadingAudience ? "..." : String(audienceStats.excluded)}
                  helper="Quitados manualmente."
                />
                <SectionStat
                  label="Manuales"
                  value={loadingAudience ? "..." : String(audienceStats.manual)}
                  helper="Agregados fuera del segmento."
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
                <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                  <div>
                    <p
                      className="text-sm font-semibold"
                      style={{ color: "var(--text-main)" }}
                    >
                      Resumen actual
                    </p>
                    <p
                      className="mt-2 text-sm leading-6"
                      style={{ color: "var(--text-muted)" }}
                    >
                      Canal:{" "}
                      <strong style={{ color: "var(--text-main)" }}>
                        {selectedChannelLabel}
                      </strong>
                      {" · "}Segmento:{" "}
                      <strong style={{ color: "var(--text-main)" }}>
                        {selectedSegmentLabel}
                      </strong>
                      {" · "}Prioridad:{" "}
                      <strong style={{ color: "var(--text-main)" }}>
                        {selectedSortLabel}
                      </strong>
                    </p>
                    <p
                      className="mt-2 text-sm leading-6"
                      style={{ color: "var(--text-muted)" }}
                    >
                      Final incluidos:{" "}
                      <strong style={{ color: "var(--text-main)" }}>
                        {audienceStats.included}
                      </strong>
                      {" · "}Tope a procesar:{" "}
                      <strong style={{ color: "var(--text-main)" }}>
                        {limitedAudienceCount}
                      </strong>
                    </p>
                  </div>

                  <div className="w-full max-w-sm">
                    <input
                      type="text"
                      value={audienceSearch}
                      onChange={(e) => setAudienceSearch(e.target.value)}
                      placeholder={
                        channel === "email"
                          ? "Buscar por nombre o correo..."
                          : "Buscar por nombre o teléfono..."
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
                  Agregar destinatario manual
                </p>

                <div className="mt-4 grid gap-3 md:grid-cols-3">
                  <input
                    type="text"
                    value={manualRecipientForm.name}
                    onChange={(e) =>
                      setManualRecipientForm((prev) => ({
                        ...prev,
                        name: e.target.value,
                      }))
                    }
                    placeholder="Nombre"
                    className={inputClass}
                    style={{
                      borderColor: "var(--border-color)",
                      background: "var(--bg-soft)",
                      color: "var(--text-main)",
                    }}
                  />

                  {channel === "email" ? (
                    <input
                      type="email"
                      value={manualRecipientForm.email}
                      onChange={(e) =>
                        setManualRecipientForm((prev) => ({
                          ...prev,
                          email: e.target.value,
                        }))
                      }
                      placeholder="correo@ejemplo.com"
                      className={inputClass}
                      style={{
                        borderColor: "var(--border-color)",
                        background: "var(--bg-soft)",
                        color: "var(--text-main)",
                      }}
                    />
                  ) : (
                    <input
                      type="text"
                      value={manualRecipientForm.phone}
                      onChange={(e) =>
                        setManualRecipientForm((prev) => ({
                          ...prev,
                          phone: e.target.value,
                        }))
                      }
                      placeholder="+56912345678"
                      className={inputClass}
                      style={{
                        borderColor: "var(--border-color)",
                        background: "var(--bg-soft)",
                        color: "var(--text-main)",
                      }}
                    />
                  )}

                  <button
                    type="button"
                    onClick={handleAddManualRecipient}
                    className={primaryButtonClass}
                    style={{
                      background:
                        "linear-gradient(135deg, rgb(37 99 235), rgb(14 165 233))",
                    }}
                  >
                    Agregar
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
                  className="flex flex-wrap items-center justify-between gap-3 border-b px-4 py-3"
                  style={{ borderColor: "var(--border-color)" }}
                >
                  <p
                    className="text-sm font-semibold"
                    style={{ color: "var(--text-main)" }}
                  >
                    Lista editable de destinatarios
                  </p>

                  <div className="flex flex-wrap gap-2 text-xs">
                    <span
                      className="rounded-full border px-3 py-1 font-semibold"
                      style={{
                        borderColor: "var(--border-color)",
                        background: "var(--bg-soft)",
                        color: "var(--text-main)",
                      }}
                    >
                      Incluidos: {audienceStats.included}
                    </span>
                    <span
                      className="rounded-full border px-3 py-1 font-semibold"
                      style={{
                        borderColor: "var(--border-color)",
                        background: "var(--bg-soft)",
                        color: "var(--text-main)",
                      }}
                    >
                      Total: {audienceStats.totalVisible}
                    </span>
                  </div>
                </div>

                <div
  className="divide-y overflow-y-auto"
  style={{
    borderColor: "var(--border-color)",
    maxHeight: "420px",
  }}
>
                  {loadingAudience ? (
                    Array.from({ length: 6 }).map((_, index) => (
                      <div key={index} className="px-4 py-4">
                        <div
                          className="h-4 w-32 animate-pulse rounded"
                          style={{ background: "var(--bg-soft)" }}
                        />
                        <div
                          className="mt-2 h-4 w-56 animate-pulse rounded"
                          style={{ background: "var(--bg-soft)" }}
                        />
                      </div>
                    ))
                  ) : previewRecipients.length === 0 ? (
                    <div
                      className="px-4 py-10 text-sm"
                      style={{ color: "var(--text-muted)" }}
                    >
                      No hay destinatarios para este canal con la búsqueda actual.
                    </div>
                  ) : (
                    previewRecipients.map((recipient) => {
                      const segmentMeta = getCustomerSegmentMeta(recipient.segment);
                      const isManual = recipient.source === "manual";

                      return (
                        <div key={recipient.id} className="px-4 py-4">
                          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <p
                                  className="font-semibold"
                                  style={{ color: "var(--text-main)" }}
                                >
                                  {recipient.name || "Sin nombre"}
                                </p>

                                <span
                                  className="inline-flex rounded-full border px-3 py-1 text-[11px] font-semibold"
                                  style={{
                                    background: isManual
                                      ? "rgba(245,158,11,0.12)"
                                      : "rgba(37,99,235,0.10)",
                                    borderColor: isManual
                                      ? "rgba(245,158,11,0.28)"
                                      : "rgba(37,99,235,0.22)",
                                    color: isManual ? "rgb(180 83 9)" : "rgb(37 99 235)",
                                  }}
                                >
                                  {isManual ? "Manual" : "Segmento"}
                                </span>

                                {recipient.segment ? (
                                  <span
                                    className="inline-flex rounded-full border px-3 py-1 text-[11px] font-semibold"
                                    style={{
                                      background: segmentMeta.bg,
                                      borderColor: segmentMeta.border,
                                      color: segmentMeta.color,
                                    }}
                                  >
                                    {segmentMeta.label}
                                  </span>
                                ) : null}
                              </div>

                              <p
                                className="mt-1 text-sm"
                                style={{ color: "var(--text-muted)" }}
                              >
                                {channel === "email"
                                  ? recipient.email || "Sin email"
                                  : recipient.phone || "Sin teléfono"}
                              </p>

                              {!isManual ? (
                                <p
                                  className="mt-1 text-xs"
                                  style={{ color: "var(--text-muted)" }}
                                >
                                  Última visita: {formatLastVisit(recipient.last_visit_at)}
                                  {" · "}Visitas: {recipient.total_visits || 0}
                                </p>
                              ) : null}
                            </div>

                            <div className="flex flex-wrap gap-2">
                              <button
                                type="button"
                                onClick={() => toggleRecipientIncluded(recipient.id)}
                                className="inline-flex h-10 items-center justify-center rounded-xl px-4 text-xs font-semibold transition"
                                style={{
                                  background: recipient.included
                                    ? "rgba(16,185,129,0.14)"
                                    : "rgba(244,63,94,0.12)",
                                  border: recipient.included
                                    ? "1px solid rgba(16,185,129,0.28)"
                                    : "1px solid rgba(244,63,94,0.28)",
                                  color: recipient.included
                                    ? "rgb(16 185 129)"
                                    : "rgb(244 63 94)",
                                }}
                              >
                                {recipient.included ? "Incluido" : "Excluido"}
                              </button>

                              {isManual ? (
                                <button
                                  type="button"
                                  onClick={() => removeManualRecipient(recipient.id)}
                                  className="inline-flex h-10 items-center justify-center rounded-xl px-4 text-xs font-semibold transition"
                                  style={{
                                    background: "rgba(244,63,94,0.08)",
                                    border: "1px solid rgba(244,63,94,0.22)",
                                    color: "rgb(244 63 94)",
                                  }}
                                >
                                  Quitar de lista
                                </button>
                              ) : null}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          </Panel>

          {channel === "email" ? (
            <Panel
              title="Preview del correo"
              description="Render HTML real del email."
              className="bg-[linear-gradient(180deg,rgba(37,99,235,0.06),transparent_35%)]"
            >
              <div
  className="rounded-[28px] border p-4 mt-2"
  style={{
    borderColor: "rgba(148,163,184,0.25)",
    background: "linear-gradient(180deg, #e2e8f0, #f8fafc)",
  }}
>
                <div
                  className="overflow-hidden rounded-[24px] border bg-white shadow-xl"
                  style={{ borderColor: "var(--border-color)" }}
                >
                  <iframe
  title="Preview email"
  srcDoc={previewHtml}
  className="w-full"
  style={{
    height: "780px",
    border: "0",
    background: "#ffffff",
  }}
/>
                </div>
              </div>
            </Panel>
          ) : (
            <Panel
              title="Preview de WhatsApp"
              description="Base futura del canal WhatsApp."
              className="bg-[linear-gradient(180deg,rgba(16,185,129,0.06),transparent_35%)]"
            >
              <div
                className="rounded-[28px] border p-5"
                style={{
                  borderColor: "var(--border-color)",
                  background:
                    "linear-gradient(135deg, rgba(16,185,129,0.10), var(--bg-soft))",
                }}
              >
                <p
                  className="text-sm font-semibold"
                  style={{ color: "var(--text-main)" }}
                >
                  Aquí después irá el preview real de WhatsApp
                </p>
                <p
                  className="mt-2 text-sm leading-6"
                  style={{ color: "var(--text-muted)" }}
                >
                  Burbuja de mensaje, variables, CTA conversacional, estado de
                  plantilla y lógica específica del canal.
                </p>
              </div>
            </Panel>
          )}
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
                <div
  className="space-y-4 p-4 overflow-y-auto"
  style={{
    maxHeight: "420px",
  }}
>
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
    onClick={() => {
      setSelectedCampaign(item);
      loadCampaignLogs(item.id);
    }}
    className="cursor-pointer rounded-2xl border p-4 shadow-sm transition"
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

{selectedCampaign && (
  <Panel
    title={`Logs de campaña: ${selectedCampaign.campaign_name || "Sin nombre"}`}
    description="Detalle por cliente: enviados, fallidos y estado."
    className="bg-[linear-gradient(180deg,rgba(37,99,235,0.05),transparent_35%)]"
  >
    {logsError ? (
      <div
        className="rounded-2xl border px-4 py-3 text-sm"
        style={{
          borderColor: "rgba(244,63,94,0.28)",
          background: "rgba(244,63,94,0.10)",
          color: "rgb(251 113 133)",
        }}
      >
        {logsError}
      </div>
    ) : loadingLogs ? (
      <div className="text-sm" style={{ color: "var(--text-muted)" }}>
        Cargando logs...
      </div>
    ) : campaignLogs.length === 0 ? (
      <div className="text-sm" style={{ color: "var(--text-muted)" }}>
        No hay logs para esta campaña.
      </div>
    ) : (
      <div
        className="space-y-3 overflow-y-auto"
        style={{ maxHeight: "420px" }}
      >
        {campaignLogs.map((log, idx) => (
          <div
            key={idx}
            className="rounded-xl border p-3 flex justify-between items-center"
            style={{
              borderColor: "var(--border-color)",
              background: "var(--bg-card)",
            }}
          >
            <div>
              <p style={{ color: "var(--text-main)", fontWeight: 600 }}>
                {log.name || "Sin nombre"}
              </p>
              <p style={{ color: "var(--text-muted)", fontSize: 13 }}>
                {log.email || log.phone || "Sin contacto"}
              </p>
            </div>

            <span
              className="text-xs font-semibold px-3 py-1 rounded-full"
              style={{
                background:
                  log.status === "sent"
                    ? "rgba(16,185,129,0.14)"
                    : "rgba(244,63,94,0.14)",
                color:
                  log.status === "sent"
                    ? "rgb(16 185 129)"
                    : "rgb(244 63 94)",
              }}
            >
              {log.status === "sent" ? "Enviado" : "Fallido"}
            </span>
          </div>
        ))}
      </div>
    )}
  </Panel>
)}
      </section>



      {imageLibraryOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center px-4 py-6"
          style={{ background: "rgba(2, 6, 23, 0.78)" }}
        >
          <div
            className="flex max-h-[88vh] w-full max-w-5xl flex-col overflow-hidden rounded-[30px] border shadow-2xl"
            style={{
              borderColor: "rgba(59,130,246,0.22)",
              background:
                "linear-gradient(135deg, rgba(15,23,42,0.96), rgba(2,6,23,0.98))",
            }}
          >
            <div
              className="flex flex-wrap items-start justify-between gap-4 border-b px-6 py-5"
              style={{ borderColor: "rgba(148,163,184,0.14)" }}
            >
              <div>
                <p
                  className="text-xs font-medium uppercase tracking-[0.18em]"
                  style={{ color: "rgba(148,163,184,0.9)" }}
                >
                  Biblioteca SaaS
                </p>
                <h3 className="mt-2 text-2xl font-semibold text-white">
                  Imágenes de campañas
                </h3>
                <p
                  className="mt-2 text-sm leading-6"
                  style={{ color: "rgba(203,213,225,0.82)" }}
                >
                  Guarda imágenes reutilizables o usa una URL externa.
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => slug && loadCampaignImages(slug)}
                  className="inline-flex h-11 items-center justify-center rounded-2xl px-5 text-sm font-semibold transition"
                  style={{
                    background: "rgba(15,23,42,0.9)",
                    border: "1px solid rgba(148,163,184,0.24)",
                    color: "#e2e8f0",
                  }}
                >
                  Recargar
                </button>

                <button
                  onClick={() => setImageLibraryOpen(false)}
                  className="inline-flex h-11 items-center justify-center rounded-2xl px-5 text-sm font-semibold transition"
                  style={{
                    background: "rgba(15,23,42,0.9)",
                    border: "1px solid rgba(148,163,184,0.24)",
                    color: "#e2e8f0",
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
                    borderColor: "rgba(148,163,184,0.16)",
                    background: "rgba(15,23,42,0.9)",
                  }}
                >
                  <p className="text-sm font-semibold text-white">Subir imagen</p>

                  <label
                    className="mt-3 inline-flex h-11 cursor-pointer items-center justify-center rounded-2xl px-4 text-sm font-semibold transition"
                    style={{
                      background: imageUploading
                        ? "rgba(71,85,105,0.5)"
                        : "linear-gradient(135deg, rgb(37 99 235), rgb(14 165 233))",
                      color: "#ffffff",
                      boxShadow: imageUploading
                        ? "none"
                        : "0 12px 30px rgba(37,99,235,0.24)",
                    }}
                  >
                    {imageUploading ? "Subiendo..." : "Elegir imagen"}
                    <input
                      type="file"
                      accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          handleUploadCampaignImage(file);
                          e.currentTarget.value = "";
                        }
                      }}
                    />
                  </label>

                  <p
                    className="mt-3 text-xs leading-6"
                    style={{ color: "rgba(203,213,225,0.78)" }}
                  >
                    Formatos permitidos: JPG, PNG, WEBP. Máximo 2 MB.
                  </p>

                  <p
                    className="mt-2 text-xs font-semibold"
                    style={{ color: "rgba(148,163,184,0.95)" }}
                  >
                    {imagesLimitInfo.current}/{imagesLimitInfo.max}
                  </p>
                </div>

                {imageLibraryError ? (
                  <div
                    className="rounded-2xl border px-4 py-3 text-sm"
                    style={{
                      borderColor: "rgba(244,63,94,0.26)",
                      background: "rgba(127,29,29,0.26)",
                      color: "rgb(253 164 175)",
                    }}
                  >
                    {imageLibraryError}
                  </div>
                ) : null}

                {imageLibraryMessage ? (
                  <div
                    className="rounded-2xl border px-4 py-3 text-sm"
                    style={{
                      borderColor: "rgba(16,185,129,0.24)",
                      background: "rgba(6,78,59,0.22)",
                      color: "rgb(110 231 183)",
                    }}
                  >
                    {imageLibraryMessage}
                  </div>
                ) : null}
              </div>

              <div
                className="rounded-[26px] border p-5"
                style={{
                  borderColor: "rgba(148,163,184,0.14)",
                  background: "#000000",
                }}
              >
                <div className="mb-4 flex items-center justify-between">
                  <h4 className="text-base font-semibold text-white">Biblioteca</h4>
                  <p
                    className="text-xs"
                    style={{ color: "rgba(148,163,184,0.88)" }}
                  >
                    Fondo oscuro para resaltar mejor las imágenes
                  </p>
                </div>

                {imagesLoading ? (
                  <div className="text-sm text-slate-400">Cargando...</div>
                ) : campaignImages.length === 0 ? (
                  <div className="text-sm text-slate-500">No hay imágenes</div>
                ) : (
                  <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
                    {campaignImages.map((image) => (
                      <div
                        key={image.id}
                        className="group rounded-2xl border p-2"
                        style={{
                          borderColor: "rgba(148,163,184,0.12)",
                          background: "rgba(15,23,42,0.72)",
                        }}
                      >
                        <div className="relative overflow-hidden rounded-xl">
                          <img
                            src={image.public_url || ""}
                            alt={getImageDisplayName(image)}
                            className="h-36 w-full object-cover transition duration-300 group-hover:scale-[1.03]"
                          />

                          <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/65 opacity-0 transition group-hover:opacity-100">
                            <button
                              onClick={() => {
                                setHeroImageUrl(image.public_url || "");
                                setImageLibraryOpen(false);
                              }}
                              className="inline-flex h-9 items-center justify-center rounded-xl px-3 text-xs font-semibold text-white"
                              style={{
                                background:
                                  "linear-gradient(135deg, rgb(37 99 235), rgb(14 165 233))",
                              }}
                            >
                              Usar
                            </button>

                            <button
                              onClick={() => handleDeleteCampaignImage(image.id)}
                              disabled={imageDeletingId === image.id}
                              className="inline-flex h-9 items-center justify-center rounded-xl px-3 text-xs font-semibold text-white disabled:opacity-60"
                              style={{
                                background:
                                  "linear-gradient(135deg, rgb(220 38 38), rgb(244 63 94))",
                              }}
                            >
                              {imageDeletingId === image.id ? "..." : "Eliminar"}
                            </button>
                          </div>
                        </div>

                        <div className="mt-3 text-xs text-slate-300">
                          <p className="truncate font-medium">
                            {getImageDisplayName(image)}
                          </p>
                          <p className="mt-1 text-slate-400">
                            {formatBytes(image.size_bytes)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : null}

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
              correos de tu audiencia curada manualmente del segmento{" "}
              <span style={{ color: "var(--text-main)", fontWeight: 700 }}>
                {selectedSegmentLabel}
              </span>
              .
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
  disabled={sending}
  className={`${primaryButtonClass} font-semibold flex items-center justify-center gap-2`}
  style={{
    background: sending
      ? "linear-gradient(135deg, rgb(100 116 139), rgb(71 85 105))"
      : "linear-gradient(135deg, rgb(37 99 235), rgb(14 165 233))",
    boxShadow: sending
      ? "none"
      : "0 18px 40px rgba(37,99,235,0.28)",
    cursor: sending ? "not-allowed" : "pointer",
  }}
>
  {sending ? (
    <>
      <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
      Enviando...
    </>
  ) : (
    <>Sí, enviar campaña</>
  )}
</button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}