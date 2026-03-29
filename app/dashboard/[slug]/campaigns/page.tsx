"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { PageHeader } from "../../../../components/dashboard/page-header";
import { Panel } from "../../../../components/dashboard/panel";

const BACKEND_URL = "https://orbyx-backend.onrender.com";

type CustomerSegment = "new" | "recurrent" | "frequent" | "inactive";
type CampaignChannel = "email" | "whatsapp";

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

function formatDate(value?: string | null) {
  if (!value) return "Sin visitas";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Sin visitas";
  }

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
      className="rounded-3xl border p-4 text-left transition"
      style={{
        background: active ? "var(--text-main)" : "var(--bg-card)",
        color: active ? "var(--bg-card)" : "var(--text-main)",
        borderColor: "var(--border-color)",
      }}
    >
      <p className="text-sm font-semibold">{label}</p>
      <p
        className="mt-1 text-sm"
        style={{
          color: active ? "rgba(255,255,255,0.82)" : "var(--text-muted)",
        }}
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
      className="rounded-3xl border p-4 text-left transition"
      style={{
        background: active ? "var(--text-main)" : "var(--bg-card)",
        color: active ? "var(--bg-card)" : "var(--text-main)",
        borderColor: "var(--border-color)",
      }}
    >
      <p className="text-sm font-semibold">{label}</p>
      <p
        className="mt-1 text-sm"
        style={{
          color: active ? "rgba(255,255,255,0.82)" : "var(--text-muted)",
        }}
      >
        {description}
      </p>
    </button>
  );
}

export default function CampaignsPage() {
  const params = useParams();
  const slug =
    ((params as any)?.slug as string) || ((params as any)?.Slug as string);

  const [channel, setChannel] = useState<CampaignChannel>("email");
  const [segment, setSegment] = useState<CustomerSegment>("inactive");
  const [inactiveDays, setInactiveDays] = useState("60");
  const [campaignName, setCampaignName] = useState("");
  const [subject, setSubject] = useState("Te extrañamos en Orbyx");
  const [message, setMessage] = useState(
    "Hola {{nombre}}, queremos invitarte a volver. Tenemos horas disponibles esta semana y nos encantaría atenderte nuevamente."
  );
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loadingAudience, setLoadingAudience] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [resultMessage, setResultMessage] = useState("");
  const [sendSummary, setSendSummary] = useState<SendEmailResponse | null>(null);

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

  const audienceStats = useMemo(() => {
    const total = customers.length;
    const withEmail = customers.filter((c) => !!c.email).length;
    const withWhatsapp = customers.filter((c) => !!c.phone).length;

    const availableForChannel =
      channel === "email" ? withEmail : withWhatsapp;

    return {
      total,
      withEmail,
      withWhatsapp,
      availableForChannel,
    };
  }, [customers, channel]);

  const previewRecipients = useMemo(() => {
    const filtered =
      channel === "email"
        ? customers.filter((customer) => !!customer.email)
        : customers.filter((customer) => !!customer.phone);

    return filtered.slice(0, 6);
  }, [customers, channel]);

  const selectedSegmentLabel =
    SEGMENT_OPTIONS.find((item) => item.key === segment)?.label || "Segmento";

  const selectedChannelLabel =
    CHANNEL_OPTIONS.find((item) => item.key === channel)?.label || "Canal";

  async function handleSendCampaign() {
    try {
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

      setSending(true);

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
        }),
      });

      const data: SendEmailResponse = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "No se pudo enviar la campaña");
      }

      setSendSummary(data);
      setResultMessage(
        `Campaña enviada. Correos enviados: ${data.sent || 0}. Fallidos: ${data.failed || 0}.`
      );
    } catch (err: any) {
      setError(err?.message || "Error enviando campaña");
    } finally {
      setSending(false);
    }
  }

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
          title="Audiencia total"
          value={loadingAudience ? "..." : String(audienceStats.total)}
          description="Clientes encontrados dentro del segmento actual."
        />
        <StatCard
          title="Listos para enviar"
          value={
            loadingAudience ? "..." : String(audienceStats.availableForChannel)
          }
          description={
            channel === "email"
              ? "Clientes con email disponible."
              : "Clientes con teléfono disponible."
          }
        />
      </section>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <Panel
          title="Configuración de campaña"
          description="Selecciona canal, segmento y define el mensaje base."
        >
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
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-400 dark:border-slate-600 dark:bg-slate-900 dark:text-white dark:focus:border-slate-500"
              />
            </div>

            <div className="space-y-3">
              <label className="block text-xs font-medium uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                Canal
              </label>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
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

            <div className="grid grid-cols-1 gap-4 md:grid-cols-[240px_1fr]">
              <div className="space-y-3">
                <label className="block text-xs font-medium uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                  Inactivos en
                </label>
                <select
                  value={inactiveDays}
                  onChange={(e) => setInactiveDays(e.target.value)}
                  className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-slate-400 dark:border-slate-600 dark:bg-slate-900 dark:text-white dark:focus:border-slate-500"
                >
                  <option value="30">30 días</option>
                  <option value="60">60 días</option>
                  <option value="90">90 días</option>
                  <option value="120">120 días</option>
                </select>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/70">
                <p className="text-sm font-semibold text-slate-900 dark:text-white">
                  Nota de segmentación
                </p>
                <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-400">
                  El valor de inactividad impacta sobre el segmento{" "}
                  <span className="font-semibold">Inactivos</span>. Para nuevos,
                  recurrentes y frecuentes, el cálculo depende del total de
                  visitas del cliente.
                </p>
              </div>
            </div>

            {channel === "email" ? (
              <div className="space-y-3">
                <label className="block text-xs font-medium uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                  Asunto
                </label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Asunto del correo"
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-400 dark:border-slate-600 dark:bg-slate-900 dark:text-white dark:focus:border-slate-500"
                />
              </div>
            ) : null}

            <div className="space-y-3">
              <label className="block text-xs font-medium uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                Mensaje
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={8}
                placeholder="Escribe el mensaje base de la campaña..."
                className="w-full rounded-3xl border border-slate-200 bg-white px-4 py-4 text-sm text-slate-900 outline-none transition focus:border-slate-400 dark:border-slate-600 dark:bg-slate-900 dark:text-white dark:focus:border-slate-500"
              />
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Puedes usar textos como{" "}
                <span className="font-semibold">{"{{nombre}}"}</span> para
                personalización futura.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={handleSendCampaign}
                disabled={sending || loadingAudience}
                className="inline-flex h-11 items-center justify-center rounded-2xl px-5 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-60"
                style={{
                  background: "var(--text-main)",
                }}
              >
                {sending ? "Enviando..." : "Enviar campaña"}
              </button>

              <div className="text-sm text-slate-500 dark:text-slate-400">
                {channel === "email"
                  ? "Se enviará a clientes con email disponible."
                  : "WhatsApp se conectará en el siguiente paso."}
              </div>
            </div>

            {sendSummary ? (
              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/70">
                <p className="text-sm font-semibold text-slate-900 dark:text-white">
                  Resultado del envío
                </p>
                <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-4">
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
        </Panel>

        <div className="space-y-6">
          <Panel
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
                  value={
                    loadingAudience ? "..." : String(audienceStats.withWhatsapp)
                  }
                  description="Clientes alcanzables por teléfono."
                />
                <StatCard
                  title="Canal activo"
                  value={
                    loadingAudience
                      ? "..."
                      : String(audienceStats.availableForChannel)
                  }
                  description="Clientes listos para este envío."
                />
              </div>

              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/70">
                <p className="text-sm font-semibold text-slate-900 dark:text-white">
                  Resumen actual
                </p>
                <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-400">
                  Canal: <span className="font-semibold">{selectedChannelLabel}</span>
                  {" · "}
                  Segmento:{" "}
                  <span className="font-semibold">{selectedSegmentLabel}</span>
                  {" · "}
                  Inactividad:{" "}
                  <span className="font-semibold">{inactiveDays} días</span>
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
                      No hay clientes disponibles para este canal con la
                      segmentación actual.
                    </div>
                  ) : (
                    previewRecipients.map((customer) => {
                      const segmentStyle = getCustomerSegmentStyles(
                        customer.segment
                      );

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
                                Última visita: {formatDate(customer.last_visit_at)}
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
          </Panel>

          <Panel
            title="Preview del mensaje"
            description="Cómo se vería la campaña base."
          >
            <div className="rounded-3xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900/70">
              {channel === "email" ? (
                <>
                  <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                    Asunto
                  </p>
                  <p className="mt-2 text-base font-semibold text-slate-900 dark:text-white">
                    {subject || "Sin asunto"}
                  </p>
                </>
              ) : (
                <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                  Mensaje WhatsApp
                </p>
              )}

              <div className="mt-4 rounded-3xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/70">
                <p className="whitespace-pre-line text-sm leading-7 text-slate-700 dark:text-slate-300">
                  {message || "Sin contenido"}
                </p>
              </div>
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
}