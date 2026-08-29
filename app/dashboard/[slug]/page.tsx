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

// ---- Presets de rango de fechas (filtro global) ----
const RANGE_PRESETS = [
  { key: "today", label: "Hoy" },
  { key: "7d", label: "7 días" },
  { key: "30d", label: "30 días" },
  { key: "this_month", label: "Este mes" },
  { key: "last_month", label: "Mes anterior" },
  { key: "custom", label: "Personalizado" },
] as const;
type RangePresetKey = (typeof RANGE_PRESETS)[number]["key"];

// ---- Presets de corte de inactividad (filtro propio del ranking de clientes) ----
const INACTIVE_PRESETS = [
  { key: "30", label: "30 días", days: 30 },
  { key: "60", label: "60 días", days: 60 },
  { key: "90", label: "90 días", days: 90 },
  { key: "custom", label: "Personalizado" },
] as const;
type InactivePresetKey = (typeof INACTIVE_PRESETS)[number]["key"];

const CUSTOMER_LIMIT_OPTIONS = [3, 5, 10] as const;

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

// Formato chileno día-mes-año en TODO el módulo (reemplaza cualquier
// formato ISO/slash) — hecho con split de string, no Date+toLocaleDateString,
// para no arriesgar un corrimiento de día por zona horaria al parsear
// "YYYY-MM-DD" como medianoche UTC y mostrarlo en hora local del navegador.
function formatDateCL(value: string | null | undefined) {
  if (!value) return "—";
  const datePart = value.length >= 10 ? value.slice(0, 10) : value;
  const [y, m, d] = datePart.split("-");
  if (!y || !m || !d) return "—";
  return `${d}-${m}-${y}`;
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

// ---- Export CSV — un botón por SECCIÓN (no por panel), cliente-side, sin
// endpoint nuevo. Un solo archivo con varios bloques de tabla separados por
// una línea en blanco y un título — Excel abre .csv nativo, no hace falta
// una librería de hojas de cálculo para esto. ----
type CsvTable = { title: string; columns: { key: string; label: string }[]; rows: Record<string, unknown>[] };

function downloadMultiTableCsv(filename: string, tables: CsvTable[]) {
  const escape = (v: unknown) => {
    const s = v === null || v === undefined ? "" : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const blocks = tables.map((t) => {
    if (t.rows.length === 0) return `${t.title}\r\n(sin datos en el período seleccionado)`;
    const header = t.columns.map((c) => escape(c.label)).join(",");
    const body = t.rows.map((row) => t.columns.map((c) => escape(row[c.key])).join(",")).join("\r\n");
    return `${t.title}\r\n${header}\r\n${body}`;
  });
  const csv = "﻿" + blocks.join("\r\n\r\n");
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

function SectionExportButton({ tables, filename }: { tables: CsvTable[]; filename: string }) {
  const hasData = tables.some((t) => t.rows.length > 0);
  return (
    <button
      type="button"
      onClick={() => downloadMultiTableCsv(filename, tables)}
      disabled={!hasData}
      className="inline-flex h-7 items-center gap-1.5 border px-2.5 text-[11px] font-semibold uppercase tracking-[0.06em] transition disabled:cursor-not-allowed disabled:opacity-40"
      style={{ borderColor: "var(--border-color)", background: "var(--bg-soft)", color: "var(--text-main)", borderRadius: 3 }}
    >
      <Download size={12} />
      Exportar sección (CSV)
    </button>
  );
}

// ---- Bloques visuales "ejecutivos": esquinas rectas (radio mínimo), tipografía
// numérica compacta — deliberadamente distintos del resto del dashboard (Panel/
// MetricCard usan rounded-3xl), ver dirección de diseño pedida para este módulo.
function StatCard({ label, value, hint, tone = "default" }: { label: string; value: string; hint?: string; tone?: "default" | "warning" | "danger" }) {
  return (
    <div className="border p-2.5" style={{ borderColor: "var(--border-color)", background: "var(--bg-card)", borderRadius: 3 }}>
      <p className="text-[10px] font-semibold uppercase tracking-[0.12em]" style={{ color: "var(--text-muted)" }}>
        {label}
      </p>
      <p className="mt-1 text-lg font-bold leading-none tabular-nums" style={{ color: toneColor(tone) }}>
        {value}
      </p>
      {hint ? (
        <p className="mt-1 text-[10.5px] leading-tight" style={{ color: "var(--text-muted)" }}>
          {hint}
        </p>
      ) : null}
    </div>
  );
}

function SectionHeader({ title, description, action }: { title: string; description?: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-2 border-b-2 pb-2 pt-2" style={{ borderColor: "var(--text-main)" }}>
      <div>
        <h2 className="text-[15px] font-bold uppercase tracking-[0.06em]" style={{ color: "var(--text-main)" }}>
          {title}
        </h2>
        {description ? (
          <p className="mt-0.5 text-xs" style={{ color: "var(--text-muted)" }}>
            {description}
          </p>
        ) : null}
      </div>
      {action}
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
      <div className="flex flex-wrap items-center justify-between gap-2 border-b px-4 py-2.5" style={{ borderColor: "var(--border-color)" }}>
        <div className="flex items-center gap-2">
          <h3 className="text-[12.5px] font-bold uppercase tracking-[0.08em]" style={{ color: "var(--text-main)" }}>
            {title}
          </h3>
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

function LockedBlock({ requiredPlanLabel, description }: { requiredPlanLabel: string; description: string }) {
  return (
    <div className="border border-dashed p-4" style={{ borderColor: "var(--border-color)", background: "var(--bg-soft)", borderRadius: 3 }}>
      <div className="flex items-center gap-2">
        <Lock size={13} style={{ color: "var(--text-muted)" }} />
        <span
          className="inline-flex h-5 items-center px-2 text-[10px] font-bold uppercase tracking-[0.08em]"
          style={{ background: "rgba(37,99,235,0.12)", color: "#2563eb", borderRadius: 3 }}
        >
          Desde {requiredPlanLabel}
        </span>
      </div>
      <p className="mt-1.5 text-xs" style={{ color: "var(--text-muted)" }}>
        {description}
      </p>
    </div>
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

// Ranking de clientes: altura fija con scroll interno (no empuja el resto del
// panel hacia abajo), click expande inline (acordeón) con teléfono/email.
function CustomerRankingList({
  items,
  limit,
  expandedId,
  onToggle,
  mode,
  emptyText,
}: {
  items: CustomerRow[];
  limit: number;
  expandedId: string | null;
  onToggle: (id: string) => void;
  mode: "active" | "inactive";
  emptyText: string;
}) {
  const visible = items.slice(0, limit);
  if (visible.length === 0) return <EmptyState text={emptyText} />;
  const max = Math.max(...visible.map((i) => i.total_visits), 1);

  return (
    <div className="max-h-72 overflow-y-auto pr-1">
      <div className="divide-y" style={{ borderColor: "var(--border-color)" }}>
        {visible.map((item, idx) => {
          const isOpen = expandedId === item.id;
          return (
            <div key={item.id}>
              <button
                type="button"
                onClick={() => onToggle(item.id)}
                className="flex w-full items-start gap-3 py-2 text-left first:pt-0"
              >
                <span className="w-5 shrink-0 pt-0.5 text-right text-xs font-semibold" style={{ color: "var(--text-muted)" }}>
                  {idx + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate text-sm font-medium" style={{ color: "var(--text-main)" }}>
                      {item.name || "Cliente"}
                    </span>
                    <span className="shrink-0 text-sm font-bold tabular-nums" style={{ color: "var(--text-main)" }}>
                      {mode === "active" ? `${item.total_visits} visitas` : formatDateCL(item.last_visit_at)}
                    </span>
                  </div>
                  {mode === "active" ? (
                    <>
                      <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>
                        {item.segment === "frequent" ? "Frecuente" : "Recurrente"}
                      </p>
                      <div className="mt-1 h-1 w-full" style={{ background: "var(--bg-soft)" }}>
                        <div className="h-1" style={{ width: `${Math.max((item.total_visits / max) * 100, 3)}%`, background: "#2563eb" }} />
                      </div>
                    </>
                  ) : null}
                </div>
              </button>
              {isOpen ? (
                <div className="mb-2 ml-8 border-l-2 pl-3 text-xs" style={{ borderColor: "var(--border-color)", color: "var(--text-muted)" }}>
                  <p>Teléfono: {item.phone || "—"}</p>
                  <p>Email: {item.email || "—"}</p>
                  {mode === "inactive" ? <p>Total visitas históricas: {item.total_visits}</p> : null}
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
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

// Barra de cupo + desglose de composición: cuánto queda del cupo del plan
// (resetea cada mes) vs. cuánto queda de saldo por add-ons (acumulable).
function UsageBar({ label, usage }: { label: string; usage: UsageInfo }) {
  const pct = usage.limit > 0 ? Math.min(100, (usage.used / usage.limit) * 100) : 0;
  const tone = rateTone(pct, 75, 95);
  const planRemaining = Math.max(0, usage.base - usage.used);

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

      <div className="mt-2.5 grid grid-cols-2 gap-2 border-t pt-2" style={{ borderColor: "var(--border-color)" }}>
        <div>
          <p className="text-[9.5px] font-semibold uppercase tracking-[0.08em]" style={{ color: "var(--text-muted)" }}>
            Cupo del plan
          </p>
          <p className="text-sm font-bold tabular-nums" style={{ color: "var(--text-main)" }}>
            {planRemaining} / {usage.base}
            <span className="ml-1 text-[10px] font-normal" style={{ color: "var(--text-muted)" }}>
              restante, resetea cada mes
            </span>
          </p>
        </div>
        <div>
          <p className="text-[9.5px] font-semibold uppercase tracking-[0.08em]" style={{ color: "var(--text-muted)" }}>
            Saldo add-ons
          </p>
          <p className="text-sm font-bold tabular-nums" style={{ color: "var(--text-main)" }}>
            {usage.addon}
            <span className="ml-1 text-[10px] font-normal" style={{ color: "var(--text-muted)" }}>
              acumulable
            </span>
          </p>
        </div>
      </div>
    </div>
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

  const [inactivePreset, setInactivePreset] = useState<InactivePresetKey>("60");
  const [customInactiveDays, setCustomInactiveDays] = useState("60");
  const [customerLimit, setCustomerLimit] = useState<number>(5);
  const [expandedCustomerId, setExpandedCustomerId] = useState<string | null>(null);

  const range = useMemo(() => computeRange(rangePreset, customFrom, customTo), [rangePreset, customFrom, customTo]);

  const inactiveDays = useMemo(() => {
    if (inactivePreset === "custom") {
      const n = Number(customInactiveDays);
      return Number.isFinite(n) && n > 0 ? Math.round(n) : 60;
    }
    return Number(inactivePreset);
  }, [inactivePreset, customInactiveDays]);

  useEffect(() => {
    if (!slug) return;

    async function loadStats() {
      try {
        setLoading(true);
        setError("");

        const url = new URL(`${BACKEND_URL}/stats/${slug}`);
        url.searchParams.set("from", range.from);
        url.searchParams.set("to", range.to);
        url.searchParams.set("inactive_days", String(inactiveDays));
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
  }, [slug, range.from, range.to, branchFilter, inactiveDays]);

  const plan = data?.plan_slug || "starter";
  const businessUnlocked = isPlanAtLeast(plan, "business");
  const premiumUnlocked = isPlanAtLeast(plan, "premium");
  const multiBranch = (data?.branches?.length || 0) > 1;

  function toggleCustomer(id: string) {
    setExpandedCustomerId((prev) => (prev === id ? null : id));
  }

  // ---- Tablas para exportación CSV (una por sección) ----
  const operacionTables: CsvTable[] = useMemo(() => {
    if (!data) return [];
    return [
      {
        title: "Reservas por estado",
        columns: [
          { key: "estado", label: "Estado" },
          { key: "total", label: "Total" },
        ],
        rows: Object.entries(data.basic.appointments.by_status).map(([estado, total]) => ({ estado, total })),
      },
      {
        title: "Clientes más activos / recurrentes",
        columns: [
          { key: "name", label: "Nombre" },
          { key: "phone", label: "Teléfono" },
          { key: "email", label: "Email" },
          { key: "total_visits", label: "Visitas" },
          { key: "last_visit_at", label: "Última visita" },
        ],
        rows: data.basic.customer_ranking.active.map((c) => ({ ...c, last_visit_at: formatDateCL(c.last_visit_at) })),
      },
      {
        title: "Clientes inactivos",
        columns: [
          { key: "name", label: "Nombre" },
          { key: "phone", label: "Teléfono" },
          { key: "email", label: "Email" },
          { key: "last_visit_at", label: "Última visita" },
        ],
        rows: data.basic.customer_ranking.inactive.map((c) => ({ ...c, last_visit_at: formatDateCL(c.last_visit_at) })),
      },
      {
        title: "Servicios más reservados",
        columns: [
          { key: "name", label: "Servicio" },
          { key: "total", label: "Reservas" },
        ],
        rows: data.basic.top_services,
      },
      {
        title: "Ocupación por día y hora",
        columns: [
          { key: "weekday", label: "Día" },
          { key: "hour", label: "Hora" },
          { key: "count", label: "Reservas" },
        ],
        rows: (data.premium?.occupancy_heatmap || []).map((c) => ({ weekday: WEEKDAY_LABEL[c.weekday] || c.weekday, hour: c.hour, count: c.count })),
      },
    ];
  }, [data]);

  const ingresosTables: CsvTable[] = useMemo(() => {
    if (!data?.premium) return [];
    const p = data.premium;
    return [
      {
        title: "Ingresos estimados por servicio",
        columns: [
          { key: "name", label: "Servicio" },
          { key: "total", label: "Estimado (CLP)" },
        ],
        rows: p.revenue_estimated.by_service,
      },
      {
        title: "Ingresos estimados por profesional",
        columns: [
          { key: "name", label: "Profesional" },
          { key: "total", label: "Estimado (CLP)" },
        ],
        rows: p.revenue_estimated.by_staff,
      },
      {
        title: "Ingresos estimados por sucursal",
        columns: [
          { key: "name", label: "Sucursal" },
          { key: "total", label: "Estimado (CLP)" },
        ],
        rows: p.revenue_estimated.by_branch,
      },
      {
        title: "Desempeño por profesional",
        columns: [
          { key: "name", label: "Profesional" },
          { key: "total", label: "Reservas" },
          { key: "completed", label: "Completadas" },
          { key: "no_show_rate", label: "Tasa no-show (%)" },
          { key: "cancellation_rate", label: "Tasa cancelación (%)" },
        ],
        rows: p.staff_performance,
      },
      {
        title: "Actividad por sucursal",
        columns: [
          { key: "name", label: "Sucursal" },
          { key: "total_appointments", label: "Reservas" },
          { key: "active_customers", label: "Clientes activos" },
        ],
        rows: p.branch_activity,
      },
      {
        title: "Cupos ocupados en reservas grupales",
        columns: [
          { key: "name", label: "Servicio" },
          { key: "sessions", label: "Sesiones" },
          { key: "capacity_per_session", label: "Cupo por sesión" },
          { key: "total_booked", label: "Cupos ocupados" },
          { key: "occupancy_rate", label: "Ocupación (%)" },
        ],
        rows: p.group_capacity,
      },
    ];
  }, [data]);

  const marketingTables: CsvTable[] = useMemo(() => {
    if (!data) return [];
    const cupoRows: Record<string, unknown>[] = [{ recurso: "WhatsApp confirmación + recordatorio", ...data.basic.wa_confirmacion_usage }];
    if (data.business) {
      cupoRows.push({ recurso: "Campañas WhatsApp", ...data.business.campanas_wa_usage });
      cupoRows.push({ recurso: "Campañas Email", ...data.business.emails_campana_usage });
    }
    const tables: CsvTable[] = [
      {
        title: "Cupos mensuales",
        columns: [
          { key: "recurso", label: "Recurso" },
          { key: "used", label: "Usado" },
          { key: "limit", label: "Límite total" },
          { key: "base", label: "Cupo del plan" },
          { key: "addon", label: "Saldo add-ons" },
          { key: "remaining", label: "Restante" },
        ],
        rows: cupoRows,
      },
      {
        title: "Add-ons activos",
        columns: [
          { key: "name", label: "Add-on" },
          { key: "quantity", label: "Cantidad" },
          { key: "balance", label: "Saldo" },
          { key: "billing_cycle", label: "Ciclo" },
        ],
        rows: data.basic.addons,
      },
    ];
    if (data.business) {
      tables.push({
        title: "Historial de campañas",
        columns: [
          { key: "campaign_name", label: "Campaña" },
          { key: "channel", label: "Canal" },
          { key: "sent_count", label: "Enviados" },
          { key: "failed_count", label: "Fallidos" },
          { key: "skipped_count", label: "Omitidos" },
          { key: "created_at", label: "Fecha" },
        ],
        rows: data.business.campaign_history.rows.map((r) => ({ ...r, created_at: formatDateCL(r.created_at) })),
      });
    }
    if (data.premium) {
      tables.push({
        title: "Entrega WhatsApp Marketing",
        columns: [
          { key: "total", label: "Total" },
          { key: "delivered", label: "Entregados" },
          { key: "read", label: "Leídos" },
          { key: "failed", label: "Fallidos" },
          { key: "undelivered", label: "No entregados" },
          { key: "delivery_rate", label: "Tasa de entrega (%)" },
        ],
        rows: [data.premium.whatsapp_marketing_delivery],
      });
    }
    return tables;
  }, [data]);

  return (
    <div className="space-y-4">
      <PageHeader
        eyebrow="Análisis"
        title="Indicadores"
        description={`Panel de control del negocio · ${formatDateCL(range.from)} al ${formatDateCL(range.to)}`}
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
          {/* ===== SECCIÓN 1: OPERACIÓN ===== */}
          <SectionHeader
            title="Operación"
            description="Reservas, clientes, servicios y ocupación"
            action={premiumUnlocked ? <SectionExportButton tables={operacionTables} filename="operacion.csv" /> : undefined}
          />

          <section className="grid grid-cols-3 gap-2.5 lg:grid-cols-6">
            <StatCard label="Reservas totales" value={String(data.basic.appointments.total)} />
            <StatCard label="Completadas" value={String(data.basic.appointments.by_status.completed)} />
            <StatCard label="Canceladas" value={String(data.basic.appointments.by_status.canceled)} tone={rateTone(data.basic.appointments.cancellation_rate, 15, 30)} />
            <StatCard label="No-show" value={String(data.basic.appointments.by_status.no_show)} tone={rateTone(data.basic.appointments.no_show_rate, 10, 25)} />
            <StatCard label="Tasa no-show" value={formatPct(data.basic.appointments.no_show_rate)} tone={rateTone(data.basic.appointments.no_show_rate, 10, 25)} />
            <StatCard label="Tasa cancelación" value={formatPct(data.basic.appointments.cancellation_rate)} tone={rateTone(data.basic.appointments.cancellation_rate, 15, 30)} />
          </section>

          <StatPanel title="Clientes">
            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
              <StatCard label="Clientes totales" value={String(data.basic.customers.total)} />
              <StatCard label="Nuevos en el período" value={String(data.basic.customers.new_in_period)} />
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-4 border-t pt-3" style={{ borderColor: "var(--border-color)" }}>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-semibold" style={{ color: "var(--text-muted)" }}>
                  Inactividad:
                </span>
                <div className="flex items-center border" style={{ borderColor: "var(--border-color)", borderRadius: 3, overflow: "hidden" }}>
                  {INACTIVE_PRESETS.map((p) => (
                    <button
                      key={p.key}
                      type="button"
                      onClick={() => setInactivePreset(p.key)}
                      className="h-7 px-2 text-[11px] font-medium"
                      style={{
                        background: inactivePreset === p.key ? "#2563eb" : "var(--bg-card)",
                        color: inactivePreset === p.key ? "#fff" : "var(--text-main)",
                        borderRight: p.key !== "custom" ? "1px solid var(--border-color)" : "none",
                      }}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
                {inactivePreset === "custom" ? (
                  <input
                    type="number"
                    min={1}
                    max={365}
                    value={customInactiveDays}
                    onChange={(e) => setCustomInactiveDays(e.target.value)}
                    className="h-7 w-16 border px-2 text-[11px] outline-none"
                    style={{ borderColor: "var(--border-color)", background: "var(--bg-card)", color: "var(--text-main)", borderRadius: 3 }}
                  />
                ) : null}
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[11px] font-semibold" style={{ color: "var(--text-muted)" }}>
                  Mostrar:
                </span>
                <div className="flex items-center border" style={{ borderColor: "var(--border-color)", borderRadius: 3, overflow: "hidden" }}>
                  {CUSTOMER_LIMIT_OPTIONS.map((n, idx) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setCustomerLimit(n)}
                      className="h-7 px-2.5 text-[11px] font-medium"
                      style={{
                        background: customerLimit === n ? "#2563eb" : "var(--bg-card)",
                        color: customerLimit === n ? "#fff" : "var(--text-main)",
                        borderRight: idx !== CUSTOMER_LIMIT_OPTIONS.length - 1 ? "1px solid var(--border-color)" : "none",
                      }}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-6 lg:grid-cols-2">
              <div>
                <h4 className="mb-2 text-xs font-bold uppercase tracking-[0.08em]" style={{ color: "var(--text-main)" }}>
                  Más activos / recurrentes
                </h4>
                <CustomerRankingList
                  items={data.basic.customer_ranking.active}
                  limit={customerLimit}
                  expandedId={expandedCustomerId}
                  onToggle={toggleCustomer}
                  mode="active"
                  emptyText="Sin clientes activos en este segmento."
                />
              </div>

              <div>
                <h4 className="mb-2 text-xs font-bold uppercase tracking-[0.08em]" style={{ color: "var(--text-main)" }}>
                  Inactivos (+{inactiveDays} días sin visita)
                </h4>
                <CustomerRankingList
                  items={data.basic.customer_ranking.inactive}
                  limit={customerLimit}
                  expandedId={expandedCustomerId}
                  onToggle={toggleCustomer}
                  mode="inactive"
                  emptyText="Sin clientes inactivos."
                />
              </div>
            </div>
          </StatPanel>

          <StatPanel title="Servicios más reservados">
            <RankingList
              items={data.basic.top_services.map((s) => ({ id: s.service_id, name: s.name, value: s.total }))}
              formatValue={(n) => `${n} reservas`}
              emptyText="Sin reservas en el período seleccionado."
            />
          </StatPanel>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <div className="lg:col-span-2">
              {premiumUnlocked && data.premium ? (
                <StatPanel title="Ocupación por día y hora">
                  <OccupancyHeatmap cells={data.premium.occupancy_heatmap} />
                </StatPanel>
              ) : (
                <LockedBlock requiredPlanLabel="Premium" description="Heatmap de horarios más pedidos por día y hora." />
              )}
            </div>
            {premiumUnlocked && data.premium ? (
              <StatCard
                label="Anticipación promedio de reserva"
                value={data.premium.avg_lead_time_hours === null ? "—" : `${data.premium.avg_lead_time_hours}h`}
                hint="Tiempo entre creación y hora de la cita"
              />
            ) : (
              <LockedBlock requiredPlanLabel="Premium" description="Anticipación promedio de reserva." />
            )}
          </div>

          {data.is_vet_mode && data.basic.vet ? (
            <StatPanel title="Mascotas">
              <div className="grid grid-cols-2 gap-2.5">
                <StatCard label="Mascotas registradas" value={String(data.basic.vet.pets_count)} />
                <StatCard label="Controles pendientes" value={String(data.basic.vet.pending_followups)} />
              </div>
            </StatPanel>
          ) : null}

          {/* ===== SECCIÓN 2: INGRESOS Y DESEMPEÑO ===== */}
          <SectionHeader
            title="Ingresos y desempeño"
            description="Ingresos estimados, desempeño por profesional y por sucursal"
            action={premiumUnlocked ? <SectionExportButton tables={ingresosTables} filename="ingresos_y_desempeno.csv" /> : undefined}
          />

          {premiumUnlocked && data.premium ? (
            <>
              <StatPanel title="Ingresos estimados" badge={<EstimatedBadge />} description={data.premium.revenue_estimated.note}>
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                  <div>
                    <h4 className="mb-2 text-xs font-bold uppercase tracking-[0.08em]" style={{ color: "var(--text-main)" }}>
                      Por servicio
                    </h4>
                    <RankingList
                      items={data.premium.revenue_estimated.by_service.map((r) => ({ id: r.service_id || r.name, name: r.name, value: r.total }))}
                      formatValue={formatCLP}
                      emptyText="Sin datos en el período."
                    />
                  </div>
                  <div>
                    <h4 className="mb-2 text-xs font-bold uppercase tracking-[0.08em]" style={{ color: "var(--text-main)" }}>
                      Por profesional
                    </h4>
                    <RankingList
                      items={data.premium.revenue_estimated.by_staff.map((r) => ({ id: r.staff_id || r.name, name: r.name, value: r.total }))}
                      formatValue={formatCLP}
                      emptyText="Sin datos en el período."
                    />
                  </div>
                  {multiBranch ? (
                    <div>
                      <h4 className="mb-2 text-xs font-bold uppercase tracking-[0.08em]" style={{ color: "var(--text-main)" }}>
                        Por sucursal
                      </h4>
                      <RankingList
                        items={data.premium.revenue_estimated.by_branch.map((r) => ({ id: r.branch_id || r.name, name: r.name, value: r.total }))}
                        formatValue={formatCLP}
                        emptyText="Sin datos en el período."
                      />
                    </div>
                  ) : null}
                </div>
              </StatPanel>

              <StatPanel title="Desempeño por profesional">
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
                <StatPanel title="Desempeño por sucursal">
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
                <StatPanel title="Cupos ocupados en reservas grupales">
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
          ) : (
            <LockedBlock
              requiredPlanLabel="Premium"
              description="Ingresos estimados por servicio/profesional/sucursal, desempeño por profesional y por sucursal, y cupos ocupados en reservas grupales."
            />
          )}

          {/* ===== SECCIÓN 3: MARKETING Y SUSCRIPCIÓN ===== */}
          <SectionHeader
            title="Marketing y suscripción"
            description="Cupos, campañas y add-ons"
            action={premiumUnlocked ? <SectionExportButton tables={marketingTables} filename="marketing_y_suscripcion.csv" /> : undefined}
          />

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <StatPanel title="Cupo WhatsApp confirmación + recordatorio">
              <UsageBar label="Mensajes usados este mes" usage={data.basic.wa_confirmacion_usage} />
            </StatPanel>

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
          </div>

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
                              {formatDateCL(c.created_at)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </StatPanel>
            </>
          ) : (
            <LockedBlock requiredPlanLabel="Business" description="Cupos de campañas WhatsApp/Email e historial de campañas enviadas." />
          )}

          {premiumUnlocked && data.premium ? (
            <StatPanel title="Entrega WhatsApp Marketing" badge={<RealDataBadge />}>
              <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
                <StatCard label="Entregados" value={String(data.premium.whatsapp_marketing_delivery.delivered + data.premium.whatsapp_marketing_delivery.read)} />
                <StatCard label="Fallidos" value={String(data.premium.whatsapp_marketing_delivery.failed + data.premium.whatsapp_marketing_delivery.undelivered)} />
                <StatCard label="Total enviados" value={String(data.premium.whatsapp_marketing_delivery.total)} />
                <StatCard label="Tasa de entrega" value={formatPct(data.premium.whatsapp_marketing_delivery.delivery_rate)} />
              </div>
            </StatPanel>
          ) : (
            <LockedBlock requiredPlanLabel="Premium" description="Tasa de entrega real de WhatsApp Marketing por destinatario." />
          )}
        </>
      ) : null}
    </div>
  );
}
