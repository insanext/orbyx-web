"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { BarChart3, Lock, Download } from "lucide-react";
import { PageHeader } from "../../../components/dashboard/page-header";
import { apiFetch } from "@/lib/api";
import { isPlanAtLeast } from "@/lib/plans";

const BACKEND_URL = "https://orbyx-backend.onrender.com";

// ---- Tipos — deben calzar con la respuesta de GET /stats/:slug (server.js) ----
type ByStatus = { booked: number; completed: number; canceled: number; no_show: number; rescheduled: number };
type CustomerRow = { id: string; name: string | null; email: string | null; phone: string | null; total_visits: number; last_visit_at: string | null; segment: string };
type ServiceRow = { service_id: string; name: string; total: number };
type AddonRow = { addon_key: string; name: string; quantity: number; balance: number; billing_cycle: string };
type UsageInfo = { allowed: boolean; limit: number; base: number; addon: number; used: number; remaining: number };
type CampaignRow = { id: string; campaign_name: string | null; channel: string; sent_count: number; failed_count: number; skipped_count: number; created_at: string };
type HeatCell = { weekday: string; hour: number; count: number };
type RevenueRow = { service_id?: string; staff_id?: string; branch_id?: string; name: string; total: number };
type StaffPerfRow = { staff_id: string; name: string; total: number; completed: number; no_show: number; canceled: number; no_show_rate: number; cancellation_rate: number };
type BranchActivityRow = { branch_id: string; name: string; total_appointments: number; active_customers: number };
type GroupCapacityRow = { service_id: string; name: string; sessions: number; capacity_per_session: number; total_booked: number; occupancy_rate: number };
type WaDelivery = { total: number; delivered: number; read: number; failed: number; undelivered: number; other: number; delivery_rate: number };

type StatsResponse = {
  ok?: boolean;
  plan_slug: string;
  plan_level: number;
  is_vet_mode: boolean;
  branches: { id: string; name: string }[];
  filters: { from: string; to: string; branch_id: string | null };
  basic: {
    appointments: { total: number; by_status: ByStatus; no_show_rate: number; cancellation_rate: number };
    customers: { total: number; new_in_period: number };
    customer_ranking: { active: CustomerRow[]; inactive: CustomerRow[]; inactive_days_threshold: number };
    top_services: ServiceRow[];
    addons: AddonRow[];
    wa_confirmacion_usage: UsageInfo;
    vet: { pets_count: number; pending_followups: number } | null;
  };
  business: {
    campanas_wa_usage: UsageInfo;
    emails_campana_usage: UsageInfo;
    campaign_history: { rows: CampaignRow[]; totals: { sent: number; failed: number; skipped: number } };
  } | null;
  premium: {
    occupancy_heatmap: HeatCell[];
    avg_lead_time_hours: number | null;
    revenue_estimated: { note: string; by_service: RevenueRow[]; by_staff: RevenueRow[]; by_branch: RevenueRow[] };
    staff_performance: StaffPerfRow[];
    branch_activity: BranchActivityRow[];
    group_capacity: GroupCapacityRow[];
    whatsapp_marketing_delivery: WaDelivery;
  } | null;
  error?: string;
};

// ---- Presets de rango de fechas ----
const RANGE_PRESETS = [
  { key: "today", label: "Hoy" },
  { key: "7d", label: "7 días" },
  { key: "30d", label: "30 días" },
  { key: "this_month", label: "Este mes" },
  { key: "last_month", label: "Mes anterior" },
  { key: "custom", label: "Personalizado" },
] as const;
type RangePresetKey = (typeof RANGE_PRESETS)[number]["key"];

function toKey(d: Date) {
  return d.toISOString().slice(0, 10);
}

function computeRange(preset: RangePresetKey, customFrom: string, customTo: string) {
  const today = new Date();
  const startOfMonth = (d: Date) => new Date(d.getFullYear(), d.getMonth(), 1);
  const endOfMonth = (d: Date) => new Date(d.getFullYear(), d.getMonth() + 1, 0);

  switch (preset) {
    case "today":
      return { from: toKey(today), to: toKey(today) };
    case "7d": {
      const f = new Date(today);
      f.setDate(f.getDate() - 6);
      return { from: toKey(f), to: toKey(today) };
    }
    case "30d": {
      const f = new Date(today);
      f.setDate(f.getDate() - 29);
      return { from: toKey(f), to: toKey(today) };
    }
    case "last_month": {
      const lm = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      return { from: toKey(startOfMonth(lm)), to: toKey(endOfMonth(lm)) };
    }
    case "custom":
      return { from: customFrom || toKey(startOfMonth(today)), to: customTo || toKey(today) };
    case "this_month":
    default:
      return { from: toKey(startOfMonth(today)), to: toKey(today) };
  }
}

function formatCLP(value: number) {
  return `$${Math.round(value).toLocaleString("es-CL")}`;
}

function formatPct(value: number) {
  return `${value.toLocaleString("es-CL", { maximumFractionDigits: 1 })}%`;
}

function formatDateShort(iso: string | null) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("es-CL", { day: "2-digit", month: "2-digit", year: "numeric" });
  } catch {
    return "—";
  }
}

// Umbral heurístico para colorear alertas (no es un benchmark de industria,
// solo un corte razonable para llamar la atención del dueño del negocio).
function rateTone(rate: number, warnAt: number, dangerAt: number): "default" | "warning" | "danger" {
  if (rate >= dangerAt) return "danger";
  if (rate >= warnAt) return "warning";
  return "default";
}

function toneColor(tone: "default" | "warning" | "danger") {
  if (tone === "danger") return "#dc2626";
  if (tone === "warning") return "#d97706";
  return "var(--text-main)";
}

// ---- Export CSV — cliente-side, sin endpoint nuevo. Excel abre .csv nativo. ----
function downloadCsv(filename: string, rows: Record<string, unknown>[], columns: { key: string; label: string }[]) {
  if (!rows.length) return;
  const escape = (v: unknown) => {
    const s = v === null || v === undefined ? "" : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const lines = [
    columns.map((c) => escape(c.label)).join(","),
    ...rows.map((row) => columns.map((c) => escape(row[c.key])).join(",")),
  ];
  const csv = "﻿" + lines.join("\r\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function ExportButton({ rows, columns, filename }: { rows: Record<string, unknown>[]; columns: { key: string; label: string }[]; filename: string }) {
  return (
    <button
      type="button"
      onClick={() => downloadCsv(filename, rows, columns)}
      disabled={rows.length === 0}
      className="inline-flex h-7 items-center gap-1.5 border px-2.5 text-[11px] font-semibold uppercase tracking-[0.06em] transition disabled:cursor-not-allowed disabled:opacity-40"
      style={{ borderColor: "var(--border-color)", background: "var(--bg-soft)", color: "var(--text-main)", borderRadius: 3 }}
    >
      <Download size={12} />
      CSV
    </button>
  );
}

// ---- Bloques visuales "ejecutivos": esquinas rectas (radio mínimo), tipografía
// numérica grande — deliberadamente distintos del resto del dashboard (Panel/
// MetricCard usan rounded-3xl), ver dirección de diseño pedida para este módulo.
function StatCard({ label, value, hint, tone = "default" }: { label: string; value: string; hint?: string; tone?: "default" | "warning" | "danger" }) {
  return (
    <div className="border p-4" style={{ borderColor: "var(--border-color)", background: "var(--bg-card)", borderRadius: 3 }}>
      <p className="text-[10.5px] font-semibold uppercase tracking-[0.14em]" style={{ color: "var(--text-muted)" }}>
        {label}
      </p>
      <p className="mt-1.5 text-[26px] font-bold leading-none tabular-nums" style={{ color: toneColor(tone) }}>
        {value}
      </p>
      {hint ? (
        <p className="mt-1.5 text-[11px] leading-4" style={{ color: "var(--text-muted)" }}>
          {hint}
        </p>
      ) : null}
    </div>
  );
}

function StatPanel({
  title,
  description,
  badge,
  actions,
  children,
}: {
  title: string;
  description?: string;
  badge?: React.ReactNode;
  actions?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="border" style={{ borderColor: "var(--border-color)", background: "var(--bg-card)", borderRadius: 3 }}>
      <div className="flex flex-wrap items-center justify-between gap-2 border-b px-4 py-3" style={{ borderColor: "var(--border-color)" }}>
        <div className="flex items-center gap-2">
          <h2 className="text-[13px] font-bold uppercase tracking-[0.08em]" style={{ color: "var(--text-main)" }}>
            {title}
          </h2>
          {badge}
        </div>
        {actions}
      </div>
      {description ? (
        <p className="border-b px-4 py-2 text-xs" style={{ borderColor: "var(--border-color)", color: "var(--text-muted)" }}>
          {description}
        </p>
      ) : null}
      <div className="p-4">{children}</div>
    </section>
  );
}

function EstimatedBadge() {
  return (
    <span
      className="inline-flex h-5 items-center px-2 text-[10px] font-bold uppercase tracking-[0.08em]"
      style={{ background: "rgba(217,119,6,0.14)", color: "#b45309", borderRadius: 3 }}
      title="Calculado con el precio actual del servicio — puede no calzar con el histórico si hubo cambios de precio."
    >
      Estimado
    </span>
  );
}

function RealDataBadge() {
  return (
    <span
      className="inline-flex h-5 items-center px-2 text-[10px] font-bold uppercase tracking-[0.08em]"
      style={{ background: "rgba(5,150,105,0.14)", color: "#059669", borderRadius: 3 }}
    >
      Dato real
    </span>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <p className="py-6 text-center text-sm" style={{ color: "var(--text-muted)" }}>
      {text}
    </p>
  );
}

function RankingList({
  items,
  formatValue,
  emptyText,
}: {
  items: { id: string; name: string; value: number; sub?: string }[];
  formatValue?: (n: number) => string;
  emptyText: string;
}) {
  if (items.length === 0) return <EmptyState text={emptyText} />;
  const max = Math.max(...items.map((i) => i.value), 1);
  return (
    <div className="divide-y" style={{ borderColor: "var(--border-color)" }}>
      {items.map((item, idx) => (
        <div key={item.id} className="flex items-start gap-3 py-2 first:pt-0 last:pb-0">
          <span className="w-5 shrink-0 pt-0.5 text-right text-xs font-semibold" style={{ color: "var(--text-muted)" }}>
            {idx + 1}
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-2">
              <span className="truncate text-sm font-medium" style={{ color: "var(--text-main)" }}>
                {item.name}
              </span>
              <span className="shrink-0 text-sm font-bold tabular-nums" style={{ color: "var(--text-main)" }}>
                {formatValue ? formatValue(item.value) : item.value}
              </span>
            </div>
            {item.sub ? (
              <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>
                {item.sub}
              </p>
            ) : null}
            <div className="mt-1 h-1 w-full" style={{ background: "var(--bg-soft)" }}>
              <div className="h-1" style={{ width: `${Math.max((item.value / max) * 100, 3)}%`, background: "#2563eb" }} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

const WEEKDAY_ORDER = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const WEEKDAY_LABEL: Record<string, string> = { Mon: "Lun", Tue: "Mar", Wed: "Mié", Thu: "Jue", Fri: "Vie", Sat: "Sáb", Sun: "Dom" };

function OccupancyHeatmap({ cells }: { cells: HeatCell[] }) {
  if (cells.length === 0) return <EmptyState text="Sin reservas en el período seleccionado." />;

  const max = Math.max(...cells.map((c) => c.count), 1);
  const hours = cells.map((c) => c.hour);
  const minHour = Math.max(0, Math.min(...hours) - 1);
  const maxHour = Math.min(23, Math.max(...hours) + 1);
  const hourRange = Array.from({ length: maxHour - minHour + 1 }, (_, i) => minHour + i);
  const cellMap = new Map(cells.map((c) => [`${c.weekday}-${c.hour}`, c.count]));

  return (
    <div className="overflow-x-auto">
      <table className="border-collapse text-[11px]">
        <thead>
          <tr>
            <th className="w-9" />
            {hourRange.map((h) => (
              <th key={h} className="px-0.5 pb-1 text-center font-medium" style={{ color: "var(--text-muted)" }}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {WEEKDAY_ORDER.map((wd) => (
            <tr key={wd}>
              <td className="pr-2 text-right font-semibold" style={{ color: "var(--text-muted)" }}>
                {WEEKDAY_LABEL[wd]}
              </td>
              {hourRange.map((h) => {
                const count = cellMap.get(`${wd}-${h}`) || 0;
                const intensity = count / max;
                return (
                  <td key={h} className="p-[1px]">
                    <div
                      title={`${WEEKDAY_LABEL[wd]} ${h}:00 — ${count} reserva${count === 1 ? "" : "s"}`}
                      className="h-5 w-5"
                      style={{
                        background: count === 0 ? "var(--bg-soft)" : `rgba(37,99,235,${0.18 + intensity * 0.72})`,
                        border: "1px solid var(--border-color)",
                      }}
                    />
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function UsageBar({ label, usage, hint }: { label: string; usage: UsageInfo; hint?: string }) {
  const pct = usage.limit > 0 ? Math.min(100, (usage.used / usage.limit) * 100) : 0;
  const tone = rateTone(pct, 75, 95);
  return (
    <div>
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-semibold" style={{ color: "var(--text-main)" }}>
          {label}
        </span>
        <span className="text-xs font-bold tabular-nums" style={{ color: toneColor(tone) }}>
          {usage.used} / {usage.limit}
        </span>
      </div>
      <div className="mt-1.5 h-2 w-full" style={{ background: "var(--bg-soft)" }}>
        <div className="h-2" style={{ width: `${pct}%`, background: tone === "danger" ? "#dc2626" : tone === "warning" ? "#d97706" : "#2563eb" }} />
      </div>
      <p className="mt-1 text-[11px]" style={{ color: "var(--text-muted)" }}>
        {hint || `Restante: ${usage.remaining} (${usage.base} del plan + ${usage.addon} de add-ons)`}
      </p>
    </div>
  );
}

function UpsellTeaser({ requiredPlanLabel, description }: { requiredPlanLabel: string; description: string }) {
  return (
    <section className="border border-dashed p-5" style={{ borderColor: "var(--border-color)", background: "var(--bg-soft)", borderRadius: 3 }}>
      <div className="flex items-center gap-2">
        <Lock size={14} style={{ color: "var(--text-muted)" }} />
        <span
          className="inline-flex h-5 items-center px-2 text-[10px] font-bold uppercase tracking-[0.08em]"
          style={{ background: "rgba(37,99,235,0.12)", color: "#2563eb", borderRadius: 3 }}
        >
          Desde {requiredPlanLabel}
        </span>
      </div>
      <p className="mt-2 text-sm" style={{ color: "var(--text-muted)" }}>
        {description}
      </p>
    </section>
  );
}

export default function DashboardHomePage() {
  const params = useParams();
  const slug = ((params as { slug?: string })?.slug as string) || ((params as { Slug?: string })?.Slug as string) || "";

  const [data, setData] = useState<StatsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [rangePreset, setRangePreset] = useState<RangePresetKey>("this_month");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [branchFilter, setBranchFilter] = useState("");

  const range = useMemo(() => computeRange(rangePreset, customFrom, customTo), [rangePreset, customFrom, customTo]);

  useEffect(() => {
    if (!slug) return;

    async function loadStats() {
      try {
        setLoading(true);
        setError("");

        const url = new URL(`${BACKEND_URL}/stats/${slug}`);
        url.searchParams.set("from", range.from);
        url.searchParams.set("to", range.to);
        if (branchFilter) url.searchParams.set("branch_id", branchFilter);

        const res = await apiFetch(url.toString());
        const json: StatsResponse = await res.json();

        if (!res.ok) {
          throw new Error(json?.error || "No se pudieron cargar las estadísticas");
        }

        setData(json);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Error cargando estadísticas");
      } finally {
        setLoading(false);
      }
    }

    loadStats();
  }, [slug, range.from, range.to, branchFilter]);

  const plan = data?.plan_slug || "starter";
  const businessUnlocked = isPlanAtLeast(plan, "business");
  const premiumUnlocked = isPlanAtLeast(plan, "premium");
  const multiBranch = (data?.branches?.length || 0) > 1;

  return (
    <div className="space-y-4">
      <PageHeader
        eyebrow="Análisis"
        title="Indicadores"
        description="Panel de control del negocio: reservas, clientes, servicios e ingresos estimados."
        icon={<BarChart3 className="h-5 w-5" />}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            {multiBranch ? (
              <select
                value={branchFilter}
                onChange={(e) => setBranchFilter(e.target.value)}
                className="h-9 border px-2.5 text-xs outline-none"
                style={{ borderColor: "var(--border-color)", background: "var(--bg-card)", color: "var(--text-main)", borderRadius: 3 }}
              >
                <option value="">Todas las sucursales</option>
                {(data?.branches || []).map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            ) : null}

            <div className="flex items-center border" style={{ borderColor: "var(--border-color)", borderRadius: 3, overflow: "hidden" }}>
              {RANGE_PRESETS.map((preset) => (
                <button
                  key={preset.key}
                  type="button"
                  onClick={() => setRangePreset(preset.key)}
                  className="h-9 px-2.5 text-xs font-medium transition"
                  style={{
                    background: rangePreset === preset.key ? "#2563eb" : "var(--bg-card)",
                    color: rangePreset === preset.key ? "#fff" : "var(--text-main)",
                    borderRight: preset.key !== "custom" ? "1px solid var(--border-color)" : "none",
                  }}
                >
                  {preset.label}
                </button>
              ))}
            </div>

            {rangePreset === "custom" ? (
              <div className="flex items-center gap-1.5">
                <input
                  type="date"
                  value={customFrom}
                  onChange={(e) => setCustomFrom(e.target.value)}
                  className="h-9 border px-2 text-xs outline-none"
                  style={{ borderColor: "var(--border-color)", background: "var(--bg-card)", color: "var(--text-main)", borderRadius: 3 }}
                />
                <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                  a
                </span>
                <input
                  type="date"
                  value={customTo}
                  onChange={(e) => setCustomTo(e.target.value)}
                  className="h-9 border px-2 text-xs outline-none"
                  style={{ borderColor: "var(--border-color)", background: "var(--bg-card)", color: "var(--text-main)", borderRadius: 3 }}
                />
              </div>
            ) : null}
          </div>
        }
      />

      {error ? (
        <div className="border px-4 py-3 text-sm" style={{ borderColor: "rgba(244,63,94,0.28)", background: "rgba(244,63,94,0.08)", color: "#be123c", borderRadius: 3 }}>
          {error}
        </div>
      ) : null}

      {loading && !data ? (
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>
          Cargando estadísticas...
        </p>
      ) : null}

      {data ? (
        <>
          {/* ===== STARTER (básicas — siempre visibles) ===== */}
          <section className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-6">
            <StatCard label="Reservas totales" value={String(data.basic.appointments.total)} hint={`${range.from} a ${range.to}`} />
            <StatCard label="Completadas" value={String(data.basic.appointments.by_status.completed)} />
            <StatCard label="Canceladas" value={String(data.basic.appointments.by_status.canceled)} tone={rateTone(data.basic.appointments.cancellation_rate, 15, 30)} />
            <StatCard label="No-show" value={String(data.basic.appointments.by_status.no_show)} tone={rateTone(data.basic.appointments.no_show_rate, 10, 25)} />
            <StatCard
              label="Tasa de no-show"
              value={formatPct(data.basic.appointments.no_show_rate)}
              tone={rateTone(data.basic.appointments.no_show_rate, 10, 25)}
              hint="Sobre citas completadas + no-show + canceladas"
            />
            <StatCard
              label="Tasa de cancelación"
              value={formatPct(data.basic.appointments.cancellation_rate)}
              tone={rateTone(data.basic.appointments.cancellation_rate, 15, 30)}
              hint="Sobre citas completadas + no-show + canceladas"
            />
          </section>

          <StatPanel title="Clientes">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <StatCard label="Clientes totales" value={String(data.basic.customers.total)} />
              <StatCard label="Nuevos en el período" value={String(data.basic.customers.new_in_period)} />
            </div>

            <div className="mt-4 grid grid-cols-1 gap-6 lg:grid-cols-2">
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-[0.08em]" style={{ color: "var(--text-main)" }}>
                    Más activos / recurrentes
                  </h3>
                  {premiumUnlocked ? (
                    <ExportButton
                      rows={data.basic.customer_ranking.active}
                      filename="clientes_activos.csv"
                      columns={[
                        { key: "name", label: "Nombre" },
                        { key: "phone", label: "Teléfono" },
                        { key: "email", label: "Email" },
                        { key: "total_visits", label: "Visitas" },
                        { key: "last_visit_at", label: "Última visita" },
                      ]}
                    />
                  ) : null}
                </div>
                <RankingList
                  items={data.basic.customer_ranking.active.map((c) => ({
                    id: c.id,
                    name: c.name || "Cliente",
                    value: c.total_visits,
                    sub: c.segment === "frequent" ? "Frecuente" : "Recurrente",
                  }))}
                  formatValue={(n) => `${n} visitas`}
                  emptyText="Sin clientes activos en este segmento."
                />
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-[0.08em]" style={{ color: "var(--text-main)" }}>
                    Inactivos (+{data.basic.customer_ranking.inactive_days_threshold} días sin visita)
                  </h3>
                  {premiumUnlocked ? (
                    <ExportButton
                      rows={data.basic.customer_ranking.inactive}
                      filename="clientes_inactivos.csv"
                      columns={[
                        { key: "name", label: "Nombre" },
                        { key: "phone", label: "Teléfono" },
                        { key: "email", label: "Email" },
                        { key: "last_visit_at", label: "Última visita" },
                      ]}
                    />
                  ) : null}
                </div>
                <div className="divide-y" style={{ borderColor: "var(--border-color)" }}>
                  {data.basic.customer_ranking.inactive.length === 0 ? (
                    <EmptyState text="Sin clientes inactivos." />
                  ) : (
                    data.basic.customer_ranking.inactive.map((c) => (
                      <div key={c.id} className="flex items-center justify-between gap-2 py-2">
                        <span className="truncate text-sm font-medium" style={{ color: "var(--text-main)" }}>
                          {c.name || "Cliente"}
                        </span>
                        <span className="shrink-0 text-xs" style={{ color: "var(--text-muted)" }}>
                          {formatDateShort(c.last_visit_at)}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </StatPanel>

          <StatPanel
            title="Servicios más reservados"
            actions={
              premiumUnlocked ? (
                <ExportButton
                  rows={data.basic.top_services}
                  filename="servicios_mas_reservados.csv"
                  columns={[
                    { key: "name", label: "Servicio" },
                    { key: "total", label: "Reservas" },
                  ]}
                />
              ) : undefined
            }
          >
            <RankingList
              items={data.basic.top_services.map((s) => ({ id: s.service_id, name: s.name, value: s.total }))}
              formatValue={(n) => `${n} reservas`}
              emptyText="Sin reservas en el período seleccionado."
            />
          </StatPanel>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <StatPanel title="Add-ons activos">
              {data.basic.addons.length === 0 ? (
                <EmptyState text="No tienes add-ons activos." />
              ) : (
                <div className="divide-y" style={{ borderColor: "var(--border-color)" }}>
                  {data.basic.addons.map((a) => (
                    <div key={a.addon_key} className="flex items-center justify-between gap-2 py-2">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium" style={{ color: "var(--text-main)" }}>
                          {a.name}
                        </p>
                        <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>
                          {a.quantity} unidad{a.quantity === 1 ? "" : "es"} · {a.billing_cycle}
                        </p>
                      </div>
                      <span className="shrink-0 text-sm font-bold tabular-nums" style={{ color: "var(--text-main)" }}>
                        Saldo: {a.balance}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </StatPanel>

            <StatPanel title="Cupo WhatsApp confirmación + recordatorio">
              <UsageBar label="Mensajes usados este mes" usage={data.basic.wa_confirmacion_usage} />
            </StatPanel>
          </div>

          {data.is_vet_mode && data.basic.vet ? (
            <StatPanel title="Mascotas">
              <div className="grid grid-cols-2 gap-3">
                <StatCard label="Mascotas registradas" value={String(data.basic.vet.pets_count)} />
                <StatCard label="Controles pendientes" value={String(data.basic.vet.pending_followups)} />
              </div>
            </StatPanel>
          ) : null}

          {/* ===== BUSINESS ===== */}
          {businessUnlocked && data.business ? (
            <>
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                <StatPanel title="Cupo campañas WhatsApp">
                  <UsageBar label="Mensajes usados este mes" usage={data.business.campanas_wa_usage} />
                </StatPanel>
                <StatPanel title="Cupo campañas Email">
                  <UsageBar label="Emails usados este mes" usage={data.business.emails_campana_usage} />
                </StatPanel>
              </div>

              <StatPanel
                title="Historial de campañas"
                description={`Enviados: ${data.business.campaign_history.totals.sent} · Fallidos: ${data.business.campaign_history.totals.failed} · Omitidos: ${data.business.campaign_history.totals.skipped}`}
                actions={
                  premiumUnlocked ? (
                    <ExportButton
                      rows={data.business.campaign_history.rows}
                      filename="historial_campanas.csv"
                      columns={[
                        { key: "campaign_name", label: "Campaña" },
                        { key: "channel", label: "Canal" },
                        { key: "sent_count", label: "Enviados" },
                        { key: "failed_count", label: "Fallidos" },
                        { key: "skipped_count", label: "Omitidos" },
                        { key: "created_at", label: "Fecha" },
                      ]}
                    />
                  ) : undefined
                }
              >
                {data.business.campaign_history.rows.length === 0 ? (
                  <EmptyState text="Sin campañas enviadas en el período seleccionado." />
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr style={{ color: "var(--text-muted)" }}>
                          <th className="pb-2 font-semibold">Campaña</th>
                          <th className="pb-2 font-semibold">Canal</th>
                          <th className="pb-2 text-right font-semibold">Enviados</th>
                          <th className="pb-2 text-right font-semibold">Fallidos</th>
                          <th className="pb-2 text-right font-semibold">Omitidos</th>
                          <th className="pb-2 text-right font-semibold">Fecha</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y" style={{ borderColor: "var(--border-color)" }}>
                        {data.business.campaign_history.rows.map((c) => (
                          <tr key={c.id}>
                            <td className="py-1.5 font-medium" style={{ color: "var(--text-main)" }}>
                              {c.campaign_name || "Sin nombre"}
                            </td>
                            <td className="py-1.5 capitalize" style={{ color: "var(--text-main)" }}>
                              {c.channel}
                            </td>
                            <td className="py-1.5 text-right tabular-nums" style={{ color: "var(--text-main)" }}>
                              {c.sent_count}
                            </td>
                            <td className="py-1.5 text-right tabular-nums" style={{ color: "var(--text-main)" }}>
                              {c.failed_count}
                            </td>
                            <td className="py-1.5 text-right tabular-nums" style={{ color: "var(--text-main)" }}>
                              {c.skipped_count}
                            </td>
                            <td className="py-1.5 text-right" style={{ color: "var(--text-muted)" }}>
                              {formatDateShort(c.created_at)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </StatPanel>
            </>
          ) : !businessUnlocked ? (
            <UpsellTeaser
              requiredPlanLabel="Business"
              description="Cupos de campañas WhatsApp/Email e historial de campañas enviadas."
            />
          ) : null}

          {/* ===== PREMIUM ===== */}
          {premiumUnlocked && data.premium ? (
            <>
              <StatPanel title="Ocupación por día y hora">
                <OccupancyHeatmap cells={data.premium.occupancy_heatmap} />
              </StatPanel>

              <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                <StatCard
                  label="Anticipación promedio de reserva"
                  value={data.premium.avg_lead_time_hours === null ? "—" : `${data.premium.avg_lead_time_hours}h`}
                  hint="Tiempo entre creación y hora de la cita"
                />
                <div className="lg:col-span-2">
                  <StatPanel title="Entrega WhatsApp Marketing" badge={<RealDataBadge />}>
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                      <StatCard label="Entregados" value={String(data.premium.whatsapp_marketing_delivery.delivered + data.premium.whatsapp_marketing_delivery.read)} />
                      <StatCard label="Fallidos" value={String(data.premium.whatsapp_marketing_delivery.failed + data.premium.whatsapp_marketing_delivery.undelivered)} />
                      <StatCard label="Total enviados" value={String(data.premium.whatsapp_marketing_delivery.total)} />
                      <StatCard label="Tasa de entrega" value={formatPct(data.premium.whatsapp_marketing_delivery.delivery_rate)} />
                    </div>
                  </StatPanel>
                </div>
              </div>

              <StatPanel title="Ingresos estimados" badge={<EstimatedBadge />} description={data.premium.revenue_estimated.note}>
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                  <div>
                    <div className="mb-2 flex items-center justify-between">
                      <h3 className="text-xs font-bold uppercase tracking-[0.08em]" style={{ color: "var(--text-main)" }}>
                        Por servicio
                      </h3>
                      <ExportButton
                        rows={data.premium.revenue_estimated.by_service}
                        filename="ingresos_estimados_por_servicio.csv"
                        columns={[
                          { key: "name", label: "Servicio" },
                          { key: "total", label: "Estimado (CLP)" },
                        ]}
                      />
                    </div>
                    <RankingList
                      items={data.premium.revenue_estimated.by_service.map((r) => ({ id: r.service_id || r.name, name: r.name, value: r.total }))}
                      formatValue={formatCLP}
                      emptyText="Sin datos en el período."
                    />
                  </div>
                  <div>
                    <div className="mb-2 flex items-center justify-between">
                      <h3 className="text-xs font-bold uppercase tracking-[0.08em]" style={{ color: "var(--text-main)" }}>
                        Por profesional
                      </h3>
                      <ExportButton
                        rows={data.premium.revenue_estimated.by_staff}
                        filename="ingresos_estimados_por_profesional.csv"
                        columns={[
                          { key: "name", label: "Profesional" },
                          { key: "total", label: "Estimado (CLP)" },
                        ]}
                      />
                    </div>
                    <RankingList
                      items={data.premium.revenue_estimated.by_staff.map((r) => ({ id: r.staff_id || r.name, name: r.name, value: r.total }))}
                      formatValue={formatCLP}
                      emptyText="Sin datos en el período."
                    />
                  </div>
                  {multiBranch ? (
                    <div>
                      <div className="mb-2 flex items-center justify-between">
                        <h3 className="text-xs font-bold uppercase tracking-[0.08em]" style={{ color: "var(--text-main)" }}>
                          Por sucursal
                        </h3>
                        <ExportButton
                          rows={data.premium.revenue_estimated.by_branch}
                          filename="ingresos_estimados_por_sucursal.csv"
                          columns={[
                            { key: "name", label: "Sucursal" },
                            { key: "total", label: "Estimado (CLP)" },
                          ]}
                        />
                      </div>
                      <RankingList
                        items={data.premium.revenue_estimated.by_branch.map((r) => ({ id: r.branch_id || r.name, name: r.name, value: r.total }))}
                        formatValue={formatCLP}
                        emptyText="Sin datos en el período."
                      />
                    </div>
                  ) : null}
                </div>
              </StatPanel>

              <StatPanel
                title="Desempeño por profesional"
                actions={
                  <ExportButton
                    rows={data.premium.staff_performance}
                    filename="desempeno_profesionales.csv"
                    columns={[
                      { key: "name", label: "Profesional" },
                      { key: "total", label: "Reservas" },
                      { key: "completed", label: "Completadas" },
                      { key: "no_show_rate", label: "Tasa no-show (%)" },
                      { key: "cancellation_rate", label: "Tasa cancelación (%)" },
                    ]}
                  />
                }
              >
                {data.premium.staff_performance.length === 0 ? (
                  <EmptyState text="Sin reservas asignadas a profesionales en el período." />
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr style={{ color: "var(--text-muted)" }}>
                          <th className="pb-2 font-semibold">Profesional</th>
                          <th className="pb-2 text-right font-semibold">Reservas</th>
                          <th className="pb-2 text-right font-semibold">Tasa no-show</th>
                          <th className="pb-2 text-right font-semibold">Tasa cancelación</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y" style={{ borderColor: "var(--border-color)" }}>
                        {data.premium.staff_performance.map((s) => (
                          <tr key={s.staff_id}>
                            <td className="py-1.5 font-medium" style={{ color: "var(--text-main)" }}>
                              {s.name}
                            </td>
                            <td className="py-1.5 text-right tabular-nums" style={{ color: "var(--text-main)" }}>
                              {s.total}
                            </td>
                            <td className="py-1.5 text-right tabular-nums" style={{ color: toneColor(rateTone(s.no_show_rate, 10, 25)) }}>
                              {formatPct(s.no_show_rate)}
                            </td>
                            <td className="py-1.5 text-right tabular-nums" style={{ color: toneColor(rateTone(s.cancellation_rate, 15, 30)) }}>
                              {formatPct(s.cancellation_rate)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </StatPanel>

              {multiBranch ? (
                <StatPanel
                  title="Actividad por sucursal"
                  actions={
                    <ExportButton
                      rows={data.premium.branch_activity}
                      filename="actividad_por_sucursal.csv"
                      columns={[
                        { key: "name", label: "Sucursal" },
                        { key: "total_appointments", label: "Reservas" },
                        { key: "active_customers", label: "Clientes activos" },
                      ]}
                    />
                  }
                >
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {data.premium.branch_activity.map((b) => (
                      <div key={b.branch_id} className="border p-3" style={{ borderColor: "var(--border-color)", borderRadius: 3 }}>
                        <p className="truncate text-sm font-semibold" style={{ color: "var(--text-main)" }}>
                          {b.name}
                        </p>
                        <p className="mt-1 text-lg font-bold tabular-nums" style={{ color: "var(--text-main)" }}>
                          {b.total_appointments} <span className="text-xs font-normal" style={{ color: "var(--text-muted)" }}>reservas</span>
                        </p>
                        <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                          {b.active_customers} clientes activos
                        </p>
                      </div>
                    ))}
                  </div>
                </StatPanel>
              ) : null}

              {data.premium.group_capacity.length > 0 ? (
                <StatPanel
                  title="Cupos ocupados en reservas grupales"
                  actions={
                    <ExportButton
                      rows={data.premium.group_capacity}
                      filename="cupos_grupales.csv"
                      columns={[
                        { key: "name", label: "Servicio" },
                        { key: "sessions", label: "Sesiones" },
                        { key: "capacity_per_session", label: "Cupo por sesión" },
                        { key: "total_booked", label: "Cupos ocupados" },
                        { key: "occupancy_rate", label: "Ocupación (%)" },
                      ]}
                    />
                  }
                >
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr style={{ color: "var(--text-muted)" }}>
                          <th className="pb-2 font-semibold">Servicio</th>
                          <th className="pb-2 text-right font-semibold">Sesiones</th>
                          <th className="pb-2 text-right font-semibold">Cupo/sesión</th>
                          <th className="pb-2 text-right font-semibold">Ocupados</th>
                          <th className="pb-2 text-right font-semibold">% Ocupación</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y" style={{ borderColor: "var(--border-color)" }}>
                        {data.premium.group_capacity.map((g) => (
                          <tr key={g.service_id}>
                            <td className="py-1.5 font-medium" style={{ color: "var(--text-main)" }}>
                              {g.name}
                            </td>
                            <td className="py-1.5 text-right tabular-nums" style={{ color: "var(--text-main)" }}>
                              {g.sessions}
                            </td>
                            <td className="py-1.5 text-right tabular-nums" style={{ color: "var(--text-main)" }}>
                              {g.capacity_per_session}
                            </td>
                            <td className="py-1.5 text-right tabular-nums" style={{ color: "var(--text-main)" }}>
                              {g.total_booked}
                            </td>
                            <td className="py-1.5 text-right tabular-nums" style={{ color: toneColor(rateTone(100 - g.occupancy_rate, 40, 70)) }}>
                              {formatPct(g.occupancy_rate)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </StatPanel>
              ) : null}
            </>
          ) : !premiumUnlocked ? (
            <UpsellTeaser
              requiredPlanLabel="Premium"
              description="Ocupación por día/hora, ingresos estimados, desempeño por profesional y sucursal, entrega real de campañas WhatsApp, y exportación a CSV."
            />
          ) : null}
        </>
      ) : null}
    </div>
  );
}
