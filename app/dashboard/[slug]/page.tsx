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
  const toneClasses =
    tone === "success"
      ? "border-emerald-200 bg-emerald-50 dark:border-emerald-500/20 dark:bg-emerald-500/10"
      : tone === "warning"
      ? "border-amber-200 bg-amber-50 dark:border-amber-500/20 dark:bg-amber-500/10"
      : tone === "locked"
      ? "border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800/70"
      : "border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900/70";

  const titleClasses =
    tone === "success"
      ? "text-emerald-700 dark:text-emerald-300"
      : tone === "warning"
      ? "text-amber-700 dark:text-amber-300"
      : "text-slate-500 dark:text-slate-400";

  const valueClasses =
    tone === "success"
      ? "text-emerald-700 dark:text-emerald-300"
      : tone === "warning"
      ? "text-amber-700 dark:text-amber-300"
      : "text-slate-900 dark:text-white";

  return (
    <div
      className={`rounded-3xl border p-5 shadow-sm transition-all ${toneClasses}`}
    >
      <div className="space-y-2">
        <p
          className={`text-xs font-medium uppercase tracking-[0.18em] ${titleClasses}`}
        >
          {title}
        </p>
        <p className={`text-3xl font-semibold ${valueClasses}`}>{value}</p>
        <p className="text-sm leading-6 text-slate-600 dark:text-slate-400">
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
      className={`rounded-3xl border p-5 ${
        unlocked
          ? "border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900/70"
          : "border-amber-200 bg-amber-50/70 dark:border-amber-500/20 dark:bg-amber-500/10"
      }`}
    >
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-slate-900 dark:text-white">
            {title}
          </h3>
          <p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-400">
            {description}
          </p>
        </div>

        <span
          className={`rounded-full px-3 py-1 text-xs font-semibold whitespace-nowrap ${
            unlocked
              ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300"
              : "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300"
          }`}
        >
          {unlocked ? "Disponible" : `Desde ${PLAN_LABELS[requiredPlan]}`}
        </span>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700 dark:border-slate-700 dark:bg-slate-800/80 dark:text-slate-300">
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
    <div className="rounded-3xl border border-sky-200 bg-sky-50 px-4 py-4 dark:border-sky-500/20 dark:bg-sky-500/10">
      <h2 className="text-base font-semibold text-slate-900 dark:text-white">
        {title}
      </h2>
      <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
        {description}
      </p>
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

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Dashboard"
        title={loading ? "Cargando..." : businessName || "Mi negocio"}
        description="Vista general de rendimiento, operación y crecimiento del negocio."
      />

      {error ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-300">
          {error}
        </div>
      ) : null}

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-4">
        <MetricCard
          title="Plan actual"
          value={loading ? "..." : planLabel}
          description="La visibilidad de métricas avanzadas depende del plan activo."
          tone="success"
        />
        <MetricCard
          title="Estado del panel"
          value={loading ? "..." : "Activo"}
          description="Tu panel administrativo está operativo y listo para seguir creciendo."
        />
        <MetricCard
          title="Módulos base"
          value={loading ? "..." : "5"}
          description="Agenda, staff, servicios, sucursales y facturación ya están integrados visualmente."
        />
        <MetricCard
          title="Próximo enfoque"
          value={loading ? "..." : "Métricas"}
          description="El resumen fue reemplazado por una base de dashboard pensada como producto SaaS real."
          tone="warning"
        />
      </section>

      <Panel
        title="Resumen ejecutivo"
        description="Base del nuevo dashboard del negocio."
      >
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          <MetricCard
            title="Reservas de hoy"
            value={formatMetricValue(metrics.reservas_hoy, loading)}
            description="Aquí mostraremos las reservas creadas para el día actual."
          />
          <MetricCard
            title="Reservas de la semana"
            value={formatMetricValue(metrics.reservas_semana, loading)}
            description="Bloque pensado para medir el movimiento semanal del negocio."
          />
          <MetricCard
            title="Próximas reservas"
            value={formatMetricValue(metrics.proximas_reservas, loading)}
            description="Servirá para mostrar actividad inmediata y carga operativa."
          />
          <MetricCard
            title="Atendidas"
            value={formatMetricValue(metrics.atendidas, loading)}
            description="Contador de citas completadas para seguimiento operacional."
          />
          <MetricCard
            title="Canceladas"
            value={formatMetricValue(metrics.canceladas, loading)}
            description="Métrica clave para detectar fricción o pérdida de agenda."
          />
          <MetricCard
            title="No show"
            value={formatMetricValue(metrics.no_show, loading)}
            description="Indicador importante para control de ausencias y optimización."
          />
        </div>
      </Panel>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.3fr_0.7fr]">
        <Panel
          title="Prioridades del dashboard"
          description="Orden recomendado para seguir construyendo esta página."
        >
          <div className="space-y-4">
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5 dark:border-slate-700 dark:bg-slate-800/70">
              <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                Fase 1 · Operación
              </h3>
              <p className="mt-3 text-sm leading-6 text-slate-700 dark:text-slate-300">
                Conectar reservas de hoy, semana, atendidas, canceladas, no show
                y próximas reservas desde agenda.
              </p>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5 dark:border-slate-700 dark:bg-slate-800/70">
              <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                Fase 2 · Rendimiento
              </h3>
              <p className="mt-3 text-sm leading-6 text-slate-700 dark:text-slate-300">
                Agregar comparación semanal, horas más demandadas, rendimiento
                por profesional y comportamiento por sucursal.
              </p>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5 dark:border-slate-700 dark:bg-slate-800/70">
              <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                Fase 3 · Marketing y automatización
              </h3>
              <p className="mt-3 text-sm leading-6 text-slate-700 dark:text-slate-300">
                Incorporar impacto de campañas por email, campañas por WhatsApp,
                recuperación de clientes y más adelante resultados de IA.
              </p>
            </div>
          </div>
        </Panel>

        <Panel
          title="Visión del producto"
          description="Cómo debe crecer este panel."
        >
          <div className="space-y-3 text-sm leading-6 text-slate-700 dark:text-slate-300">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/70">
              Dashboard = métricas y decisiones del negocio.
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/70">
              Campañas = administración de envíos por email y WhatsApp.
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/70">
              WhatsApp = bandeja, automatizaciones e IA más adelante.
            </div>
          </div>
        </Panel>
      </div>

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
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5 dark:border-slate-700 dark:bg-slate-800/70">
              <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                01
              </p>
              <h3 className="mt-2 text-base font-semibold text-slate-900 dark:text-white">
                Conectar agenda
              </h3>
              <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-400">
                Primero aterrizamos métricas reales del negocio desde appointments.
              </p>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5 dark:border-slate-700 dark:bg-slate-800/70">
              <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                02
              </p>
              <h3 className="mt-2 text-base font-semibold text-slate-900 dark:text-white">
                Crear campañas
              </h3>
              <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-400">
                Luego construimos una página separada para campañas por email y
                WhatsApp.
              </p>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5 dark:border-slate-700 dark:bg-slate-800/70">
              <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                03
              </p>
              <h3 className="mt-2 text-base font-semibold text-slate-900 dark:text-white">
                Activar IA
              </h3>
              <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-400">
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