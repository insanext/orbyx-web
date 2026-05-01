"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  BarChart3,
  CheckCircle2,
  Mail,
  MessageCircle,
  RefreshCw,
  Search,
  XCircle,
} from "lucide-react";

const BACKEND_URL = "https://orbyx-backend.onrender.com";

type CampaignChannel = "email" | "whatsapp";
type CustomerSegment = "new" | "recurrent" | "frequent" | "inactive";

type CampaignHistoryItem = {
  id: string;
  campaign_name: string | null;
  channel: CampaignChannel;
  segment: CustomerSegment;
  inactive_days: number;
  subject: string | null;
  message: string | null;
  sort: string | null;
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

function formatDate(value?: string | null) {
  if (!value) return "Sin fecha";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Sin fecha";

  return new Intl.DateTimeFormat("es-CL", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function getSegmentLabel(segment?: string) {
  if (segment === "new") return "Nuevos";
  if (segment === "recurrent") return "Recurrentes";
  if (segment === "frequent") return "Frecuentes";
  if (segment === "inactive") return "Inactivos";
  return "Segmento";
}

function getChannelLabel(channel?: string) {
  return channel === "whatsapp" ? "WhatsApp" : "Email";
}

function getSuccessRate(item: CampaignHistoryItem) {
  const total = Number(item.sent_count || 0) + Number(item.failed_count || 0);
  if (total <= 0) return 0;
  return Math.round((Number(item.sent_count || 0) / total) * 100);
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
  icon: React.ReactNode;
}) {
  return (
    <div
      className="rounded-[22px] border p-4 shadow-sm"
      style={{
        borderColor: "var(--border-color)",
        background: "var(--bg-card)",
      }}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>
            {title}
          </p>
          <p
            className="mt-1 text-2xl font-semibold"
            style={{ color: "var(--text-main)" }}
          >
            {value}
          </p>
          <p className="mt-1 text-xs" style={{ color: "var(--text-muted)" }}>
            {helper}
          </p>
        </div>

        <div
          className="flex h-10 w-10 items-center justify-center rounded-2xl"
          style={{
            background: "rgba(37,99,235,0.10)",
            color: "rgb(37 99 235)",
          }}
        >
          {icon}
        </div>
      </div>
    </div>
  );
}

export default function CampaignHistoryPage() {
  const router = useRouter();
  const params = useParams();
  const slug = params?.slug as string;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [campaigns, setCampaigns] = useState<CampaignHistoryItem[]>([]);
  const [search, setSearch] = useState("");
  const [channel, setChannel] = useState<"all" | CampaignChannel>("all");

  async function loadCampaigns() {
    if (!slug) return;

    try {
      setLoading(true);
      setError("");

      const res = await fetch(`${BACKEND_URL}/campaigns/history/${slug}`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "No se pudo cargar el historial");
      }

      setCampaigns(Array.isArray(data?.campaigns) ? data.campaigns : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error cargando historial");
      setCampaigns([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCampaigns();
  }, [slug]);

  const filteredCampaigns = useMemo(() => {
    const q = search.trim().toLowerCase();

    return campaigns.filter((item) => {
      const matchesChannel = channel === "all" || item.channel === channel;

      const searchable = [
        item.campaign_name || "",
        item.subject || "",
        item.message || "",
        item.channel || "",
        item.segment || "",
      ]
        .join(" ")
        .toLowerCase();

      return matchesChannel && (!q || searchable.includes(q));
    });
  }, [campaigns, search, channel]);

  const stats = useMemo(() => {
    const totalCampaigns = filteredCampaigns.length;
    const totalSent = filteredCampaigns.reduce(
      (acc, item) => acc + Number(item.sent_count || 0),
      0
    );
    const totalFailed = filteredCampaigns.reduce(
      (acc, item) => acc + Number(item.failed_count || 0),
      0
    );
    const totalProcessed = totalSent + totalFailed;
    const successRate =
      totalProcessed > 0 ? Math.round((totalSent / totalProcessed) * 100) : 0;

    return {
      totalCampaigns,
      totalSent,
      totalFailed,
      successRate,
    };
  }, [filteredCampaigns]);

  return (
    <div className="space-y-6 pb-8">
      <section
        className="relative overflow-hidden rounded-[28px] border p-5 shadow-sm"
        style={{
          borderColor: "rgba(59,130,246,0.22)",
          background:
            "linear-gradient(135deg, var(--bg-card) 0%, rgba(37,99,235,0.08) 42%, rgba(14,165,233,0.10) 72%, var(--bg-card) 100%)",
        }}
      >
        <div
          className="pointer-events-none absolute -right-16 -top-20 h-44 w-44 rounded-full blur-3xl"
          style={{ background: "rgba(37,99,235,0.18)" }}
        />

        <button
          type="button"
          onClick={() => router.push(`/dashboard/${slug}/campaigns`)}
          className="relative inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-semibold transition"
          style={{
            borderColor: "var(--border-color)",
            background: "var(--bg-card)",
            color: "var(--text-main)",
          }}
        >
          <ArrowLeft size={16} />
          Volver a campañas
        </button>

        <div className="relative mt-5">
          <h1
            className="text-xl font-semibold tracking-tight"
            style={{ color: "var(--text-main)" }}
          >
            Historial de campañas
          </h1>
          <p
            className="mt-1 max-w-xl text-sm leading-6"
            style={{ color: "var(--text-muted)" }}
          >
            Revisa campañas enviadas, resultados y rendimiento general.
          </p>
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Campañas"
          value={loading ? "..." : String(stats.totalCampaigns)}
          helper="Según filtros activos."
          icon={<BarChart3 size={20} />}
        />
        <StatCard
          title="Enviados"
          value={loading ? "..." : String(stats.totalSent)}
          helper="Procesados correctamente."
          icon={<CheckCircle2 size={20} />}
        />
        <StatCard
          title="Fallidos"
          value={loading ? "..." : String(stats.totalFailed)}
          helper="No se pudieron procesar."
          icon={<XCircle size={20} />}
        />
        <StatCard
          title="Éxito"
          value={loading ? "..." : `${stats.successRate}%`}
          helper="Tasa general de envío."
          icon={<CheckCircle2 size={20} />}
        />
      </div>

      <section
        className="rounded-[28px] border p-5 shadow-sm"
        style={{
          borderColor: "var(--border-color)",
          background: "var(--bg-card)",
        }}
      >
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2
              className="text-lg font-semibold"
              style={{ color: "var(--text-main)" }}
            >
              Campañas registradas
            </h2>
            <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
              Listado simple para revisar envíos anteriores.
            </p>
          </div>

          <button
            type="button"
            onClick={loadCampaigns}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border px-4 text-sm font-semibold transition"
            style={{
              borderColor: "var(--border-color)",
              background: "var(--bg-soft)",
              color: "var(--text-main)",
            }}
          >
            <RefreshCw size={16} />
            Recargar
          </button>
        </div>

        <div className="mt-5 grid gap-3 lg:grid-cols-[1fr_220px]">
          <div className="relative">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2"
              style={{ color: "var(--text-muted)" }}
            />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nombre, asunto o mensaje..."
              className="h-12 w-full rounded-2xl border px-10 text-sm outline-none"
              style={{
                borderColor: "var(--border-color)",
                background: "var(--bg-card)",
                color: "var(--text-main)",
              }}
            />
          </div>

          <select
            value={channel}
            onChange={(e) => setChannel(e.target.value as "all" | CampaignChannel)}
            className="h-12 w-full rounded-2xl border px-4 text-sm outline-none"
            style={{
              borderColor: "var(--border-color)",
              background: "var(--bg-card)",
              color: "var(--text-main)",
            }}
          >
            <option value="all">Todos los canales</option>
            <option value="email">Email</option>
            <option value="whatsapp">WhatsApp</option>
          </select>
        </div>

        {error ? (
          <div
            className="mt-5 rounded-2xl border px-4 py-3 text-sm"
            style={{
              borderColor: "rgba(244,63,94,0.28)",
              background: "rgba(244,63,94,0.08)",
              color: "rgb(244 63 94)",
            }}
          >
            {error}
          </div>
        ) : null}

        <div className="mt-5 space-y-3">
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, index) => (
                <div
                  key={index}
                  className="h-28 animate-pulse rounded-2xl border"
                  style={{
                    borderColor: "var(--border-color)",
                    background: "var(--bg-soft)",
                  }}
                />
              ))}
            </div>
          ) : filteredCampaigns.length === 0 ? (
            <div
              className="rounded-2xl border px-5 py-10 text-center text-sm"
              style={{
                borderColor: "var(--border-color)",
                background: "var(--bg-soft)",
                color: "var(--text-muted)",
              }}
            >
              No hay campañas que coincidan con los filtros.
            </div>
          ) : (
            filteredCampaigns.map((item) => {
              const successRate = getSuccessRate(item);
              const ChannelIcon = item.channel === "whatsapp" ? MessageCircle : Mail;

              return (
                <article
                  key={item.id}
                  className="rounded-2xl border p-5 transition hover:shadow-md"
                  style={{
                    borderColor: "var(--border-color)",
                    background:
                      "linear-gradient(135deg, rgba(37,99,235,0.035), var(--bg-card))",
                  }}
                >
                  <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <div
                          className="flex h-9 w-9 items-center justify-center rounded-xl"
                          style={{
                            background:
                              item.channel === "whatsapp"
                                ? "rgba(16,185,129,0.12)"
                                : "rgba(37,99,235,0.12)",
                            color:
                              item.channel === "whatsapp"
                                ? "rgb(16 185 129)"
                                : "rgb(37 99 235)",
                          }}
                        >
                          <ChannelIcon size={17} />
                        </div>

                        <h3
                          className="truncate text-base font-semibold"
                          style={{ color: "var(--text-main)" }}
                        >
                          {item.campaign_name?.trim() || "Campaña sin nombre"}
                        </h3>

                        <span
                          className="rounded-full border px-3 py-1 text-xs font-semibold"
                          style={{
                            borderColor: "var(--border-color)",
                            background: "var(--bg-soft)",
                            color: "var(--text-main)",
                          }}
                        >
                          {getChannelLabel(item.channel)}
                        </span>

                        <span
                          className="rounded-full border px-3 py-1 text-xs font-semibold"
                          style={{
                            borderColor: "rgba(37,99,235,0.22)",
                            background: "rgba(37,99,235,0.08)",
                            color: "rgb(37 99 235)",
                          }}
                        >
                          {getSegmentLabel(item.segment)}
                        </span>
                      </div>

                      <p className="mt-2 text-sm" style={{ color: "var(--text-muted)" }}>
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
                          className="mt-2 line-clamp-2 text-sm leading-6"
                          style={{ color: "var(--text-muted)" }}
                        >
                          {item.message}
                        </p>
                      ) : null}
                    </div>

                    <div className="grid min-w-full grid-cols-2 gap-3 sm:grid-cols-4 xl:min-w-[520px]">
                      {[
                        ["Audiencia", item.audience_total],
                        ["Aplicado", item.applied_limit],
                        ["Enviados", item.sent_count],
                        ["Fallidos", item.failed_count],
                      ].map(([label, value]) => (
                        <div
                          key={label}
                          className="rounded-2xl border px-4 py-3"
                          style={{
                            borderColor: "var(--border-color)",
                            background: "var(--bg-card)",
                          }}
                        >
                          <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                            {label}
                          </p>
                          <p
                            className="mt-1 text-xl font-semibold"
                            style={{ color: "var(--text-main)" }}
                          >
                            {String(value ?? 0)}
                          </p>
                        </div>
                      ))}

                      <div
                        className="col-span-2 rounded-2xl border px-4 py-3 sm:col-span-4"
                        style={{
                          borderColor: "var(--border-color)",
                          background: "var(--bg-soft)",
                        }}
                      >
                        <div className="flex items-center justify-between text-xs">
                          <span style={{ color: "var(--text-muted)" }}>Éxito</span>
                          <span
                            className="font-semibold"
                            style={{ color: "var(--text-main)" }}
                          >
                            {successRate}%
                          </span>
                        </div>

                        <div
                          className="mt-2 h-2 overflow-hidden rounded-full"
                          style={{ background: "rgba(148,163,184,0.22)" }}
                        >
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${successRate}%`,
                              background:
                                "linear-gradient(90deg, rgb(37 99 235), rgb(14 165 233))",
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </article>
              );
            })
          )}
        </div>
      </section>
    </div>
  );
}