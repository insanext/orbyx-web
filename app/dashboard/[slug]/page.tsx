"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { PageHeader } from "../../../components/dashboard/page-header";
import { Panel } from "../../../components/dashboard/panel";

type BusinessResponse = {
  business: {
    id: string;
    name: string;
    slug: string;
    plan_slug?: string;
  };
};

type MetricsResponse = {
  ok?: boolean;
  metrics?: {
    reservas_hoy: number;
    reservas_semana: number;
    proximas_reservas: number;
    atendidas: number;
    canceladas: number;
    no_show: number;
  };
  error?: string;
};

const BACKEND_URL = "https://orbyx-backend.onrender.com";

type PlanSlug = "pro" | "premium" | "vip" | "platinum" | "starter";

const PLAN_LABELS: Record<PlanSlug, string> = {
  starter: "Pro",
  pro: "Pro",
  premium: "Premium",
  vip: "VIP",
  platinum: "Platinum",
};

const PLAN_ORDER: Record<PlanSlug, number> = {
  starter: 1,
  pro: 1,
  premium: 2,
  vip: 3,
  platinum: 4,
};

function normalizePlan(plan?: string): PlanSlug {
  const value = (plan || "").toLowerCase();

  if (value === "premium") return "premium";
  if (value === "vip") return "vip";
  if (value === "platinum") return "platinum";
  if (value === "pro") return "pro";

  return "starter";
}

function isPlanAtLeast(currentPlan: PlanSlug, requiredPlan: PlanSlug) {
  return PLAN_ORDER[currentPlan] >= PLAN_ORDER[requiredPlan];
}

function formatMetricValue(value: number, loading: boolean) {
  if (loading) return "...";
  return String(value ?? 0);
}

type MetricCardProps = {
  title: string;
  value: string;
  description: string;
  tone?: "default" | "success" | "warning" | "locked";
};

function MetricCard({
  title,
  value,
  description,
  tone = "default",
}: MetricCardProps) {
  const wrapperStyle =
    tone === "success"
      ? {
          borderColor: "rgba(16,185,129,0.24)",
          background:
            "linear-gradient(180deg, rgba(16,185,129,0.10), var(--bg-card))",
        }
      : tone === "warning"
      ? {
          borderColor: "rgba(245,158,11,0.24)",
          background:
            "linear-gradient(180deg, rgba(245,158,11,0.10), var(--bg-card))",
        }
      : tone === "locked"
      ? {
          borderColor: "var(--border-color)",
          background: "var(--bg-soft)",
        }
      : {
          borderColor: "var(--border-color)",
          background:
            "linear-gradient(180deg, rgba(37,99,235,0.05), var(--bg-card))",
        };

  const titleStyle =
    tone === "success"
      ? { color: "#059669" }
      : tone === "warning"
      ? { color: "#d97706" }
      : { color: "var(--text-muted)" };

  const valueStyle =
    tone === "success"
      ? { color: "#059669" }
      : tone === "warning"
      ? { color: "#d97706" }
      : { color: "var(--text-main)" };

  return (
    <div
      className="rounded-3xl border p-5 shadow-sm transition-all hover:-translate-y-[1px] hover:shadow-md"
      style={wrapperStyle}
    >
      <div className="space-y-2">
        <p
          className="text-xs font-medium uppercase tracking-[0.18em]"
          style={titleStyle}
        >
          {title}
        </p>
        <p className="text-3xl font-semibold" style={valueStyle}>
          {value}
        </p>
        <p className="text-sm leading-6" style={{ color: "var(--text-muted)" }}>
          {description}
        </p>
      </div>
    </div>
  );
}

type FeatureBlockProps = {
  title: string;
  description: string;
  requiredPlan: PlanSlug;
  currentPlan: PlanSlug;
};

function FeatureBlock({
  title,
  description,
  requiredPlan,
  currentPlan,
}: FeatureBlockProps) {
  const unlocked = isPlanAtLeast(currentPlan, requiredPlan);

  return (
    <div
      className="rounded-3xl border p-5"
      style={{
        borderColor: unlocked
          ? "var(--border-color)"
          : "rgba(245,158,11,0.24)",
        background: unlocked
          ? "var(--bg-card)"
          : "linear-gradient(180deg, rgba(245,158,11,0.08), var(--bg-card))",
      }}
    >
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h3
            className="text-base font-semibold"
            style={{ color: "var(--text-main)" }}
          >
            {title}
          </h3>
          <p
            className="mt-1 text-sm leading-6"
            style={{ color: "var(--text-muted)" }}
          >
            {description}
          </p>
        </div>

        <span
          className="rounded-full px-3 py-1 text-xs font-semibold whitespace-nowrap"
          style={{
            background: unlocked
              ? "rgba(16,185,129,0.12)"
              : "rgba(245,158,11,0.14)",
            color: unlocked ? "#059669" : "#b45309",
          }}
        >
          {unlocked ? "Disponible" : `Desde ${PLAN_LABELS[requiredPlan]}`}
        </span>
      </div>

      <div
        className="rounded-2xl border p-4 text-sm"
        style={{
          borderColor: "var(--border-color)",
          background: "var(--bg-soft)",
          color: "var(--text-muted)",
        }}
      >
        {unlocked ? (
          <p>
            Este bloque ya queda habilitado visualmente para conectar métricas
            reales del negocio cuando terminemos la integración correspondiente.
          </p>
        ) : (
          <p>
            Este espacio servirá para mostrar resultados avanzados y además
            funcionará como gatillo de upgrade dentro del panel.
          </p>
        )}
      </div>
    </div>
  );
}

function SectionTitle({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div
      className="rounded-2xl border px-4 py-4"
      style={{
        borderColor: "var(--border-color)",
        background: "var(--bg-soft)",
      }}
    >
      <h2
        className="text-base font-semibold"
        style={{ color: "var(--text-main)" }}
      >
        {title}
      </h2>
      <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
        {description}
      </p>
    </div>
  );
}

function SimpleBarChart({
  values,
  labels,
}: {
  values: number[];
  labels: string[];
}) {
  const max = Math.max(...values, 1);

  return (
    <div
      className="rounded-2xl border p-5"
      style={{
        borderColor: "var(--border-color)",
        background: "var(--bg-soft)",
      }}
    >
      <div className="mb-4">
        <h3
          className="text-sm font-semibold"
          style={{ color: "var(--text-main)" }}
        >
          Reservas últimos días
        </h3>
        <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
          Vista visual simple del comportamiento reciente.
        </p>
      </div>

      <div className="flex h-44 items-end gap-3">
        {values.map((value, index) => {
          const height = Math.max((value / max) * 100, value > 0 ? 14 : 8);

          return (
            <div key={labels[index]} className="flex flex-1 flex-col items-center">
              <div className="flex h-36 items-end">
                <div
                  className="w-full min-w-[22px] rounded-t-xl"
                  style={{
                    height: `${height}%`,
                    background:
                      "linear-gradient(180deg, rgb(37 99 235), rgb(56 189 248))",
                    boxShadow: "0 8px 24px -12px rgba(37,99,235,0.55)",
                  }}
                  title={`${labels[index]}: ${value}`}
                />
              </div>

              <span
                className="mt-3 text-[11px] font-medium"
                style={{ color: "var(--text-muted)" }}
              >
                {labels[index]}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function DashboardHomePage() {
  const params = useParams();

  const slug =
    ((params as any)?.slug as string) || ((params as any)?.Slug as string);

  const [businessName, setBusinessName] = useState("");
  const [plan, setPlan] = useState<PlanSlug>("starter");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [metrics, setMetrics] = useState({
    reservas_hoy: 0,
    reservas_semana: 0,
    proximas_reservas: 0,
    atendidas: 0,
    canceladas: 0,
    no_show: 0,
  });

  const [rangeType, setRangeType] = useState("Semana");
  const [rangeMonth, setRangeMonth] = useState("Abril 2026");

  useEffect(() => {
    async function loadDashboard() {
      try {
        setLoading(true);
        setError("");

        const [businessRes, metricsRes] = await Promise.all([
          fetch(`${BACKEND_URL}/public/business/${slug}`),
          fetch(`${BACKEND_URL}/dashboard/metrics/${slug}`),
        ]);

        const businessData: BusinessResponse | { error?: string } =
          await businessRes.json();

        const metricsData: MetricsResponse = await metricsRes.json();

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

        setBusinessName(businessData.business.name || "");
        setPlan(normalizePlan(businessData.business.plan_slug));

        if (metricsRes.ok && metricsData?.metrics) {
          setMetrics({
            reservas_hoy: Number(metricsData.metrics.reservas_hoy || 0),
            reservas_semana: Number(metricsData.metrics.reservas_semana || 0),
            proximas_reservas: Number(
              metricsData.metrics.proximas_reservas || 0
            ),
            atendidas: Number(metricsData.metrics.atendidas || 0),
            canceladas: Number(metricsData.metrics.canceladas || 0),
            no_show: Number(metricsData.metrics.no_show || 0),
          });
        } else {
          setMetrics({
            reservas_hoy: 0,
            reservas_semana: 0,
            proximas_reservas: 0,
            atendidas: 0,
            canceladas: 0,
            no_show: 0,
          });
        }
      } catch (err: any) {
        setError(err?.message || "Error cargando dashboard");
      } finally {
        setLoading(false);
      }
    }

    if (slug) {
      loadDashboard();
    }
  }, [slug]);

  const planLabel = useMemo(() => PLAN_LABELS[plan], [plan]);

  const chartValues = useMemo(() => {
    const hoy = metrics.reservas_hoy || 0;
    const semana = metrics.reservas_semana || 0;
    const atendidas = metrics.atendidas || 0;
    const canceladas = metrics.canceladas || 0;
    const noShow = metrics.no_show || 0;
    const proximas = metrics.proximas_reservas || 0;

    if (loading) return [0, 0, 0, 0, 0, 0, 0];

    return [
      Math.max(hoy, 1),
      Math.max(Math.round(semana / 5), 1),
      Math.max(Math.round(atendidas / 2), 1),
      Math.max(proximas, 1),
      Math.max(canceladas, 1),
      Math.max(noShow, 1),
      Math.max(Math.round((semana + atendidas) / 4), 1),
    ];
  }, [metrics, loading]);

  const chartLabels = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Dashboard"
        title={loading ? "Cargando..." : businessName || "Mi negocio"}
        description="Vista general de rendimiento, operación y crecimiento del negocio."
        actions={
          <div className="flex flex-wrap gap-2">
            <select
              value={rangeType}
              onChange={(e) => setRangeType(e.target.value)}
              className="h-10 rounded-xl border px-3 text-sm outline-none"
              style={{
                borderColor: "var(--border-color)",
                background: "var(--bg-card)",
                color: "var(--text-main)",
              }}
            >
              <option>Hoy</option>
              <option>Semana</option>
              <option>Mes</option>
            </select>

            <select
              value={rangeMonth}
              onChange={(e) => setRangeMonth(e.target.value)}
              className="h-10 rounded-xl border px-3 text-sm outline-none"
              style={{
                borderColor: "var(--border-color)",
                background: "var(--bg-card)",
                color: "var(--text-main)",
              }}
            >
              <option>Abril 2026</option>
              <option>Marzo 2026</option>
              <option>Febrero 2026</option>
            </select>
          </div>
        }
      />

      {error ? (
        <div
          className="rounded-2xl border px-4 py-3 text-sm"
          style={{
            borderColor: "rgba(244,63,94,0.28)",
            background: "rgba(244,63,94,0.08)",
            color: "#be123c",
          }}
        >
          {error}
        </div>
      ) : null}

      <section className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <MetricCard
          title="Hoy"
          value={formatMetricValue(metrics.reservas_hoy, loading)}
          description="Reservas del día"
        />
        <MetricCard
          title="Semana"
          value={formatMetricValue(metrics.reservas_semana, loading)}
          description="Actividad semanal"
        />
        <MetricCard
          title="Próximas"
          value={formatMetricValue(metrics.proximas_reservas, loading)}
          description="Carga inmediata"
        />
        <MetricCard
          title="Plan"
          value={loading ? "..." : planLabel}
          description="Plan activo"
          tone="success"
        />
      </section>

      <section
        className="rounded-3xl border p-6 space-y-6 shadow-sm"
        style={{
          borderColor: "var(--border-color)",
          background: "var(--bg-card)",
        }}
      >
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h2
              className="text-lg font-semibold"
              style={{ color: "var(--text-main)" }}
            >
              Dashboard del negocio
            </h2>
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>
              Vista general operativa y base para decisiones.
            </p>
          </div>

          <div
            className="inline-flex rounded-2xl border px-3 py-2 text-xs font-medium"
            style={{
              borderColor: "var(--border-color)",
              background: "var(--bg-soft)",
              color: "var(--text-muted)",
            }}
          >
            Filtro activo: {rangeType} · {rangeMonth}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 xl:grid-cols-3">
          <MetricCard
            title="Atendidas"
            value={formatMetricValue(metrics.atendidas, loading)}
            description="Citas completadas"
            tone="success"
          />
          <MetricCard
            title="Canceladas"
            value={formatMetricValue(metrics.canceladas, loading)}
            description="Cancelaciones"
            tone="warning"
          />
          <MetricCard
            title="No show"
            value={formatMetricValue(metrics.no_show, loading)}
            description="Ausencias"
            tone="warning"
          />
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.3fr_0.7fr]">
          <div className="space-y-4">
            <SimpleBarChart values={chartValues} labels={chartLabels} />

            <div
              className="rounded-2xl border p-5"
              style={{
                borderColor: "var(--border-color)",
                background: "var(--bg-soft)",
              }}
            >
              <h3
                className="text-sm font-semibold"
                style={{ color: "var(--text-main)" }}
              >
                Prioridad actual
              </h3>
              <p className="mt-2 text-sm" style={{ color: "var(--text-muted)" }}>
                Conectar métricas reales desde agenda y comenzar análisis de
                comportamiento por período.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div
              className="rounded-2xl border p-5"
              style={{
                borderColor: "var(--border-color)",
                background: "var(--bg-soft)",
              }}
            >
              <h3
                className="text-sm font-semibold"
                style={{ color: "var(--text-main)" }}
              >
                Siguiente paso
              </h3>
              <p className="mt-2 text-sm" style={{ color: "var(--text-muted)" }}>
                Integrar campañas y medir impacto en reservas.
              </p>
            </div>

            <div
              className="rounded-2xl border p-5"
              style={{
                borderColor: "var(--border-color)",
                background: "var(--bg-soft)",
              }}
            >
              <h3
                className="text-sm font-semibold"
                style={{ color: "var(--text-main)" }}
              >
                Visión Orbyx
              </h3>
              <p className="mt-2 text-sm" style={{ color: "var(--text-muted)" }}>
                No es agenda. Es automatización + seguimiento + recuperación.
              </p>
            </div>
          </div>
        </div>
      </section>

      <Panel
        title="Bloques avanzados por plan"
        description="Estos espacios quedan listos para activarse visualmente según el plan."
      >
        <div className="space-y-4">
          <SectionTitle
            title="Bloques avanzados por plan"
            description="Estos espacios quedan listos para activarse visualmente según el plan."
          />

          <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
            <FeatureBlock
              title="Comparación semanal"
              description="Evolución de reservas respecto a la semana anterior y tendencia general del negocio."
              requiredPlan="premium"
              currentPlan={plan}
            />
            <FeatureBlock
              title="Campañas y canales"
              description="Reservas generadas por web, email y WhatsApp para medir impacto comercial."
              requiredPlan="vip"
              currentPlan={plan}
            />
            <FeatureBlock
              title="IA y recuperación"
              description="Clientes reactivados, conversaciones asistidas y conversión atribuida a automatización."
              requiredPlan="platinum"
              currentPlan={plan}
            />
          </div>
        </div>
      </Panel>

      <Panel
        title="Qué sigue después"
        description="Ruta recomendada para no mezclar módulos."
      >
        <div className="space-y-4">
          <SectionTitle
            title="Qué sigue después"
            description="Ruta recomendada para no mezclar módulos."
          />

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div
              className="rounded-3xl border p-5"
              style={{
                borderColor: "var(--border-color)",
                background: "var(--bg-soft)",
              }}
            >
              <p
                className="text-xs font-medium uppercase tracking-[0.18em]"
                style={{ color: "var(--text-muted)" }}
              >
                01
              </p>
              <h3
                className="mt-2 text-base font-semibold"
                style={{ color: "var(--text-main)" }}
              >
                Conectar agenda
              </h3>
              <p className="mt-2 text-sm leading-6" style={{ color: "var(--text-muted)" }}>
                Primero aterrizamos métricas reales del negocio desde appointments.
              </p>
            </div>

            <div
              className="rounded-3xl border p-5"
              style={{
                borderColor: "var(--border-color)",
                background: "var(--bg-soft)",
              }}
            >
              <p
                className="text-xs font-medium uppercase tracking-[0.18em]"
                style={{ color: "var(--text-muted)" }}
              >
                02
              </p>
              <h3
                className="mt-2 text-base font-semibold"
                style={{ color: "var(--text-main)" }}
              >
                Crear campañas
              </h3>
              <p className="mt-2 text-sm leading-6" style={{ color: "var(--text-muted)" }}>
                Luego construimos una página separada para campañas por email y
                WhatsApp.
              </p>
            </div>

            <div
              className="rounded-3xl border p-5"
              style={{
                borderColor: "var(--border-color)",
                background: "var(--bg-soft)",
              }}
            >
              <p
                className="text-xs font-medium uppercase tracking-[0.18em]"
                style={{ color: "var(--text-muted)" }}
              >
                03
              </p>
              <h3
                className="mt-2 text-base font-semibold"
                style={{ color: "var(--text-main)" }}
              >
                Activar IA
              </h3>
              <p className="mt-2 text-sm leading-6" style={{ color: "var(--text-muted)" }}>
                La IA después entra como capa premium, no como mezcla dentro del
                dashboard.
              </p>
            </div>
          </div>
        </div>
      </Panel>
    </div>
  );
}