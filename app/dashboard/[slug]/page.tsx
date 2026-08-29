"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import {
  BarChart3,
  Lock,
  Download,
  TrendingUp,
  Calendar,
  CheckCircle2,
  XCircle,
  UserX,
  Percent,
  Users,
  UserPlus,
  User,
  Star,
  Clock,
  PawPrint,
  ClipboardList,
  ShoppingBag,
  Megaphone,
  Mail,
  Puzzle,
  PackageOpen,
  Sparkles,
  Send,
  Inbox,
  Building2,
  type LucideIcon,
} from "lucide-react";
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

// Umbral heurístico para colorear alertas en bloques que no tienen un color
// fijo de categoría propio (ej. ocupación de cupos grupales) — no es un
// benchmark de industria, solo un corte razonable para llamar la atención.
function rateTone(rate: number, warnAt: number, dangerAt: number): "default" | "warning" | "danger" {
  if (rate >= dangerAt) return "danger";
  if (rate >= warnAt) return "warning";
  return "default";
}

function toneTextColor(tone: "default" | "warning" | "danger") {
  if (tone === "danger") return TONE.red.solid;
  if (tone === "warning") return TONE.amber.solid;
  return INK;
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

// ============================================================================
// Sistema visual "ejecutivo" del módulo Indicadores — paleta y esquinas rectas
// fijas, reproduciendo las referencias de diseño acordadas: fondo blanco/
// lavanda pálido, acento de color sólido por categoría, esquinas rectas en
// todos los paneles/tarjetas/botones/inputs. Las únicas formas circulares son
// indicadores de estado puntuales (puntos de color, marcadores de gráfico) —
// nunca esquinas de tarjetas/paneles/botones.
//
// Los valores son variables CSS (var(--ind-...)), NO hex fijos: se definen en
// el bloque <style jsx> del componente, con un juego de valores para modo
// claro y otro para modo oscuro, reaccionando al MISMO atributo
// data-theme="clasico"|"nocturno" que ya usa el toggle sol/luna del dashboard
// (ver lib/use-theme.ts) — mismo mecanismo que PageHeader y Agenda, no uno
// nuevo. Al ser variables CSS heredadas, el cambio de tema se aplica en vivo
// sin volver a renderizar estos componentes.
// ============================================================================
type Tone = "indigo" | "green" | "red" | "gray" | "blue" | "violet" | "amber";

const TONE: Record<Tone, { solid: string; tint: string; text: string }> = {
  indigo: { solid: "var(--ind-indigo-solid)", tint: "var(--ind-indigo-tint)", text: "var(--ind-indigo-text)" },
  green: { solid: "var(--ind-green-solid)", tint: "var(--ind-green-tint)", text: "var(--ind-green-text)" },
  red: { solid: "var(--ind-red-solid)", tint: "var(--ind-red-tint)", text: "var(--ind-red-text)" },
  gray: { solid: "var(--ind-gray-solid)", tint: "var(--ind-gray-tint)", text: "var(--ind-gray-text)" },
  blue: { solid: "var(--ind-blue-solid)", tint: "var(--ind-blue-tint)", text: "var(--ind-blue-text)" },
  violet: { solid: "var(--ind-violet-solid)", tint: "var(--ind-violet-tint)", text: "var(--ind-violet-text)" },
  amber: { solid: "var(--ind-amber-solid)", tint: "var(--ind-amber-tint)", text: "var(--ind-amber-text)" },
};

const INK = "var(--ind-ink)";
const MUTED = "var(--ind-muted)";
const SHELL_BORDER = "var(--ind-shell-border)";
const PANEL_BORDER = "var(--ind-panel-border)";
const TRACK_BG = "var(--ind-track-bg)";
const PANEL_BG = "var(--ind-panel-bg)";
const SHELL_HEADER_BG = "var(--ind-shell-header-bg)";
const TABLE_HEAD_BG = "var(--ind-table-head-bg)";

function WhatsAppGlyph({ size = 18 }: { size?: number; strokeWidth?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.966-.273-.099-.471-.148-.67.15-.198.297-.768.966-.94 1.164-.173.198-.347.223-.644.074-.297-.149-1.255-.463-2.39-1.475-.883-.787-1.48-1.759-1.653-2.056-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.5-.669-.51l-.57-.01c-.198 0-.52.074-.793.372-.273.297-1.04 1.016-1.04 2.479s1.065 2.875 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.71.306 1.263.489 1.694.625.712.227 1.36.195 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.174-1.413-.075-.124-.273-.198-.57-.347z" />
      <path d="M20.52 3.449A11.94 11.94 0 0 0 12.043 0C5.495 0 .161 5.334.161 11.882c0 2.094.547 4.139 1.587 5.945L0 24l6.356-1.667a11.86 11.86 0 0 0 5.687 1.448h.005c6.548 0 11.882-5.334 11.882-11.882a11.8 11.8 0 0 0-3.41-8.45zm-8.477 18.32h-.004a9.86 9.86 0 0 1-5.026-1.378l-.361-.214-3.772.99 1.007-3.676-.235-.377a9.86 9.86 0 0 1-1.52-5.232c.003-5.44 4.43-9.867 9.875-9.867 2.637 0 5.114 1.027 6.978 2.893a9.82 9.82 0 0 1 2.889 6.983c-.003 5.443-4.43 9.878-9.87 9.878z" />
    </svg>
  );
}

type IconLike = LucideIcon | ((props: { size?: number; strokeWidth?: number }) => React.ReactElement);

function IconBox({
  icon: Icon,
  tone,
  variant = "tint",
  size = 32,
  iconSize,
}: {
  icon: IconLike;
  tone: Tone;
  variant?: "tint" | "solid";
  size?: number;
  iconSize?: number;
}) {
  const t = TONE[tone];
  const IconComp = Icon as LucideIcon;
  return (
    <div
      className="flex shrink-0 items-center justify-center"
      style={{ width: size, height: size, background: variant === "solid" ? t.solid : t.tint, color: variant === "solid" ? "#ffffff" : t.solid }}
    >
      <IconComp size={iconSize ?? Math.round(size * 0.55)} strokeWidth={2.25} />
    </div>
  );
}

function SectionExportButton({ tables, filename }: { tables: CsvTable[]; filename: string }) {
  const hasData = tables.some((t) => t.rows.length > 0);
  return (
    <button
      type="button"
      onClick={() => downloadMultiTableCsv(filename, tables)}
      disabled={!hasData}
      className="inline-flex h-9 items-center gap-2 border px-3.5 text-[11px] font-extrabold uppercase tracking-[0.06em] transition disabled:cursor-not-allowed disabled:opacity-40"
      style={{ borderColor: TONE.indigo.solid, color: TONE.indigo.solid, background: PANEL_BG }}
    >
      <Download size={14} />
      Exportar sección (CSV)
    </button>
  );
}

function SectionShell({
  icon,
  iconVariant = "tint",
  tone,
  title,
  subtitle,
  action,
  children,
}: {
  icon: LucideIcon;
  iconVariant?: "tint" | "solid";
  tone: Tone;
  title: string;
  subtitle: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section style={{ border: `1px solid ${SHELL_BORDER}`, borderTop: `3px solid ${TONE[tone].solid}`, background: PANEL_BG }}>
      <div
        className="flex flex-wrap items-center justify-between gap-3 border-b px-4 py-2.5"
        style={{ borderColor: SHELL_BORDER, background: SHELL_HEADER_BG }}
      >
        <div className="flex items-center gap-3">
          <IconBox icon={icon} tone={tone} variant={iconVariant} size={36} iconSize={17} />
          <div>
            <h2 className="text-sm font-extrabold uppercase tracking-[0.04em]" style={{ color: INK }}>
              {title}
            </h2>
            <p className="text-[11px]" style={{ color: MUTED }}>
              {subtitle}
            </p>
          </div>
        </div>
        {action}
      </div>
      <div className="space-y-4 p-4 sm:p-5">{children}</div>
    </section>
  );
}

function SubHeading({ icon: Icon, children }: { icon?: LucideIcon; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2">
      {Icon ? <Icon size={16} style={{ color: TONE.indigo.solid }} /> : null}
      <h3 className="text-sm font-extrabold uppercase tracking-[0.04em]" style={{ color: INK }}>
        {children}
      </h3>
    </div>
  );
}

function Panel({
  icon,
  iconVariant = "tint",
  tone = "indigo",
  title,
  badge,
  action,
  meta,
  tint,
  children,
}: {
  icon?: IconLike;
  iconVariant?: "tint" | "solid";
  tone?: Tone;
  title?: string;
  badge?: React.ReactNode;
  action?: React.ReactNode;
  meta?: React.ReactNode;
  tint?: Tone;
  children?: React.ReactNode;
}) {
  return (
    <section style={{ border: `1px solid ${PANEL_BORDER}`, background: tint ? TONE[tint].tint : PANEL_BG }}>
      <div className="flex flex-wrap items-center justify-between gap-2 border-b px-4 py-3" style={{ borderColor: PANEL_BORDER }}>
        <div className="flex items-center gap-2.5">
          {icon ? <IconBox icon={icon} tone={tone} variant={iconVariant} size={28} /> : null}
          {title ? (
            <h3 className="text-[12.5px] font-extrabold uppercase tracking-[0.05em]" style={{ color: INK }}>
              {title}
            </h3>
          ) : null}
          {badge}
        </div>
        {action}
      </div>
      {meta ? (
        <div className="border-b px-4 py-2.5" style={{ borderColor: PANEL_BORDER }}>
          {meta}
        </div>
      ) : null}
      {children ? <div className="p-4">{children}</div> : null}
    </section>
  );
}

function Kpi({
  icon,
  label,
  value,
  tone,
  valueColor,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  tone: Tone;
  valueColor?: string;
}) {
  return (
    <div className="p-3" style={{ background: TONE[tone].tint, border: `1px solid ${PANEL_BORDER}`, borderTop: `3px solid ${TONE[tone].solid}` }}>
      <div className="flex items-center gap-2.5">
        <IconBox icon={icon} tone={tone} variant="solid" size={30} />
        <p className="truncate text-[10px] font-bold uppercase leading-tight tracking-[0.06em]" style={{ color: MUTED }}>
          {label}
        </p>
      </div>
      <p className="mt-2.5 text-2xl font-extrabold leading-none tabular-nums" style={{ color: valueColor || INK }}>
        {value}
      </p>
    </div>
  );
}

function EstimatedBadge() {
  return (
    <span
      className="inline-flex h-5 items-center px-2 text-[10px] font-extrabold uppercase tracking-[0.08em] text-white"
      style={{ background: TONE.violet.solid }}
      title="Calculado con el precio actual del servicio — puede no calzar con el histórico si hubo cambios de precio."
    >
      Estimado
    </span>
  );
}

function RealDataBadge() {
  return (
    <span
      className="inline-flex h-5 items-center px-2 text-[10px] font-extrabold uppercase tracking-[0.08em]"
      style={{ background: TONE.green.tint, color: TONE.green.text }}
    >
      Dato real
    </span>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <p className="py-6 text-center text-sm" style={{ color: MUTED }}>
      {text}
    </p>
  );
}

function LockedBlock({ requiredPlanLabel, description }: { requiredPlanLabel: string; description: string }) {
  return (
    <div className="flex items-start gap-3 border border-dashed p-4" style={{ borderColor: PANEL_BORDER, background: PANEL_BG }}>
      <IconBox icon={Lock} tone="blue" variant="tint" size={36} iconSize={16} />
      <div>
        <span
          className="inline-flex h-5 items-center px-2 text-[10px] font-extrabold uppercase tracking-[0.08em] text-white"
          style={{ background: TONE.blue.solid }}
        >
          Desde {requiredPlanLabel}
        </span>
        <p className="mt-1.5 text-xs" style={{ color: MUTED }}>
          {description}
        </p>
      </div>
    </div>
  );
}

// Lista numerada de "Servicios más reservados" — badge cuadrado indigo,
// barra de progreso ancha con degradado indigo→violeta.
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
    <div className="space-y-3.5">
      {items.map((item, idx) => (
        <div key={item.id}>
          <div className="flex items-center gap-3">
            <span
              className="flex h-6 w-6 shrink-0 items-center justify-center text-[11px] font-extrabold text-white"
              style={{ background: TONE.indigo.solid }}
            >
              {String(idx + 1).padStart(2, "0")}
            </span>
            <span className="min-w-0 flex-1 truncate text-sm font-bold" style={{ color: INK }}>
              {item.name}
            </span>
            <span className="shrink-0 text-sm font-bold tabular-nums" style={{ color: INK }}>
              {formatValue ? formatValue(item.value) : item.value}
            </span>
          </div>
          <div className="ml-9 mt-1.5 h-1.5" style={{ background: TRACK_BG }}>
            <div
              className="h-1.5"
              style={{ width: `${Math.max((item.value / max) * 100, 4)}%`, background: `linear-gradient(90deg, ${TONE.indigo.solid}, ${TONE.violet.solid})` }}
            />
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
  const badgeTone: Tone = mode === "active" ? "indigo" : "red";

  return (
    <div className="max-h-80 space-y-1.5 overflow-y-auto pr-1">
      {visible.map((item, idx) => {
        const isOpen = expandedId === item.id;
        return (
          <div key={item.id}>
            <button
              type="button"
              onClick={() => onToggle(item.id)}
              className="flex w-full items-start gap-3 p-2.5 text-left"
              style={{ background: mode === "inactive" ? TONE.red.tint : "transparent" }}
            >
              <span
                className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center text-[11px] font-extrabold text-white"
                style={{ background: TONE[badgeTone].solid }}
              >
                {String(idx + 1).padStart(2, "0")}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate text-sm font-bold" style={{ color: INK }}>
                    {item.name || "Cliente"}
                  </span>
                  <span className="shrink-0 text-sm font-bold tabular-nums" style={{ color: INK }}>
                    {mode === "active" ? `${item.total_visits} visita${item.total_visits === 1 ? "" : "s"}` : "—"}
                  </span>
                </div>
                {mode === "active" ? (
                  <>
                    <p className="text-[11px] font-bold" style={{ color: TONE.indigo.solid }}>
                      {item.segment === "frequent" ? "Frecuente" : "Recurrente"}
                    </p>
                    <div className="mt-1.5 h-1 w-full" style={{ background: TRACK_BG }}>
                      <div className="h-1" style={{ width: `${Math.max((item.total_visits / max) * 100, 4)}%`, background: TONE.indigo.solid }} />
                    </div>
                  </>
                ) : null}
              </div>
            </button>
            {isOpen ? (
              <div className="ml-9 border-l-2 px-3 py-1.5 text-xs" style={{ borderColor: PANEL_BORDER, color: MUTED }}>
                <p>Teléfono: {item.phone || "—"}</p>
                <p>Email: {item.email || "—"}</p>
                {mode === "inactive" ? <p>Última visita: {formatDateCL(item.last_visit_at)}</p> : null}
                {mode === "inactive" ? <p>Total visitas históricas: {item.total_visits}</p> : null}
              </div>
            ) : null}
          </div>
        );
      })}
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
  const legendSteps = [0.12, 0.28, 0.44, 0.6, 0.76, 0.92];

  return (
    <div>
      <div className="overflow-x-auto">
        <table className="border-collapse text-[11px]">
          <thead>
            <tr>
              <th className="w-10" />
              {hourRange.map((h) => (
                <th key={h} className="px-1 pb-1.5 text-center font-bold" style={{ color: MUTED }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {WEEKDAY_ORDER.map((wd) => (
              <tr key={wd}>
                <td className="pr-2 text-right font-bold" style={{ color: MUTED }}>
                  {WEEKDAY_LABEL[wd]}
                </td>
                {hourRange.map((h) => {
                  const count = cellMap.get(`${wd}-${h}`) || 0;
                  const intensity = count / max;
                  return (
                    <td key={h} className="p-[1.5px]">
                      <div
                        title={`${WEEKDAY_LABEL[wd]} ${h}:00 — ${count} reserva${count === 1 ? "" : "s"}`}
                        style={{
                          height: 22,
                          width: 38,
                          background: count === 0 ? TRACK_BG : `rgba(79,70,229,${0.15 + intensity * 0.75})`,
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

      <div className="mt-3 flex items-center justify-center gap-2 text-[11px] font-medium" style={{ color: MUTED }}>
        <span>Baja ocupación</span>
        <div className="flex h-2.5 w-24 overflow-hidden">
          {legendSteps.map((op, i) => (
            <div key={i} className="h-full flex-1" style={{ background: `rgba(79,70,229,${op})` }} />
          ))}
        </div>
        <span>Alta ocupación</span>
      </div>
    </div>
  );
}

// Tarjeta destacada de anticipación promedio — ícono + número grande, con un
// detalle decorativo sutil (ondas) en la esquina inferior derecha.
function LeadTimeCard({ hours }: { hours: number | null }) {
  return (
    <div className="relative flex h-full flex-col overflow-hidden p-5" style={{ border: `1px solid ${PANEL_BORDER}`, background: PANEL_BG }}>
      <svg className="pointer-events-none absolute bottom-0 right-0 h-28 w-40" viewBox="0 0 160 112" fill="none">
        {/* Trazos traslúcidos (no hex opacos) para que el detalle decorativo
            se vea bien tanto sobre la tarjeta clara como sobre la oscura. */}
        <path d="M0 92 Q40 62 80 92 T170 92" stroke="rgba(124,58,237,0.12)" strokeWidth="10" />
        <path d="M10 108 Q55 82 100 108 T190 108" stroke="rgba(124,58,237,0.07)" strokeWidth="10" />
      </svg>
      <div className="relative z-10 flex items-center gap-3">
        <IconBox icon={Clock} tone="violet" variant="tint" size={40} iconSize={19} />
        <p className="text-[11px] font-extrabold uppercase tracking-[0.06em]" style={{ color: INK }}>
          Anticipación promedio de reserva
        </p>
      </div>
      <p className="relative z-10 mt-4 text-4xl font-extrabold tabular-nums" style={{ color: INK }}>
        {hours === null ? "—" : `${hours}h`}
      </p>
      <p className="relative z-10 mt-1.5 text-xs" style={{ color: MUTED }}>
        Tiempo entre creación y hora de la cita
      </p>
    </div>
  );
}

// Gráfico de barras simple (marcador circular en la punta + línea base
// punteada) usado para "Por servicio" / "Por profesional" / "Por sucursal" en
// Ingresos estimados. Sin datos: muestra una silueta decorativa desvanecida.
function MiniBarChart({
  items,
  tone,
  valueFormatter,
}: {
  items: { id: string; name: string; value: number }[];
  tone: Tone;
  valueFormatter: (n: number) => string;
}) {
  const hasData = items.length > 0;
  const source = hasData ? items.slice(0, 8) : [42, 24, 60, 84].map((v, i) => ({ id: String(i), name: "", value: v }));
  const max = Math.max(...source.map((i) => i.value), 1);

  return (
    <div className="flex flex-col items-center px-3 pb-2 pt-6">
      <div className="flex h-28 items-end gap-4" style={{ opacity: hasData ? 1 : 0.35 }}>
        {source.map((item) => {
          const h = Math.max((item.value / max) * 100, 6);
          return (
            <div
              key={item.id}
              className="flex h-full flex-col items-center justify-end gap-1.5"
              title={hasData ? `${item.name}: ${valueFormatter(item.value)}` : undefined}
            >
              <span className="h-2 w-2 border-2" style={{ borderRadius: 9999, borderColor: TONE[tone].solid, background: "#ffffff" }} />
              <div style={{ height: `${h}%`, width: 18, background: TONE[tone].solid }} />
            </div>
          );
        })}
      </div>
      <div className="mt-2 w-full border-t border-dashed" style={{ borderColor: TONE[tone].solid, opacity: 0.4 }} />
      {!hasData ? (
        <p className="mt-4 pb-2 text-sm" style={{ color: MUTED }}>
          Sin datos en el período.
        </p>
      ) : null}
    </div>
  );
}

function getInitials(name?: string | null) {
  const parts = String(name || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (parts.length === 0) return "—";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

// Barra de cupo + desglose de composición: cuánto queda del cupo del plan
// (resetea cada mes) vs. cuánto queda de saldo por add-ons (acumulable). El
// color es fijo por tipo de recurso (verde WhatsApp, azul Email), no cambia
// según el porcentaje usado.
function UsageBar({ label, usage, tone }: { label: string; usage: UsageInfo; tone: Tone }) {
  const pct = usage.limit > 0 ? Math.min(100, (usage.used / usage.limit) * 100) : 0;
  const planRemaining = Math.max(0, usage.base - usage.used);
  const t = TONE[tone];

  return (
    <div>
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-semibold" style={{ color: INK }}>
          {label}
        </span>
        <span className="text-xs font-bold tabular-nums" style={{ color: INK }}>
          {usage.used} / {usage.limit}
        </span>
      </div>
      <div className="mt-2 h-2.5 w-full" style={{ background: TRACK_BG }}>
        <div className="h-2.5" style={{ width: `${pct}%`, background: t.solid }} />
      </div>

      <div className="mt-3 grid grid-cols-2 gap-3 border-t pt-3" style={{ borderColor: PANEL_BORDER }}>
        <div>
          <p className="text-[9.5px] font-bold uppercase tracking-[0.08em]" style={{ color: MUTED }}>
            Cupo del plan
          </p>
          <p className="text-sm font-extrabold tabular-nums" style={{ color: t.solid }}>
            {planRemaining} / {usage.base}
            <span className="ml-1.5 text-[10px] font-normal" style={{ color: MUTED }}>
              restante, resetea cada mes
            </span>
          </p>
        </div>
        <div>
          <p className="text-[9.5px] font-bold uppercase tracking-[0.08em]" style={{ color: MUTED }}>
            Saldo add-ons
          </p>
          <p className="text-sm font-extrabold tabular-nums" style={{ color: INK }}>
            {usage.addon}
            <span className="ml-1.5 text-[10px] font-normal" style={{ color: MUTED }}>
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
    <div className="orbyx-indicadores-page space-y-4">
      <PageHeader
        eyebrow="Análisis"
        title="Indicadores"
        description={`Panel de control del negocio · ${formatDateCL(range.from)} al ${formatDateCL(range.to)}`}
        icon={<BarChart3 className="h-4 w-4" />}
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
        <div className="border px-4 py-3 text-sm" style={{ borderColor: "rgba(244,63,94,0.28)", background: "rgba(244,63,94,0.08)", color: "#be123c" }}>
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
          <SectionShell
            icon={TrendingUp}
            tone="indigo"
            title="Operación"
            subtitle="Reservas, clientes y ocupación"
            action={premiumUnlocked ? <SectionExportButton tables={operacionTables} filename="operacion.csv" /> : undefined}
          >
            <div className="grid grid-cols-3 gap-2.5 lg:grid-cols-6">
              <Kpi icon={Calendar} tone="indigo" label="Reservas totales" value={String(data.basic.appointments.total)} />
              <Kpi icon={CheckCircle2} tone="green" label="Completadas" value={String(data.basic.appointments.by_status.completed)} valueColor={TONE.green.solid} />
              <Kpi icon={XCircle} tone="red" label="Canceladas" value={String(data.basic.appointments.by_status.canceled)} valueColor={TONE.red.solid} />
              <Kpi icon={UserX} tone="gray" label="No-show" value={String(data.basic.appointments.by_status.no_show)} />
              <Kpi icon={Percent} tone="blue" label="Tasa no-show" value={formatPct(data.basic.appointments.no_show_rate)} />
              <Kpi icon={Percent} tone="red" label="Tasa cancelación" value={formatPct(data.basic.appointments.cancellation_rate)} valueColor={TONE.red.solid} />
            </div>

            <SubHeading>Clientes</SubHeading>
            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
              <Kpi icon={Users} tone="indigo" label="Clientes totales" value={String(data.basic.customers.total)} />
              <Kpi icon={UserPlus} tone="indigo" label="Nuevos en el período" value={String(data.basic.customers.new_in_period)} />
            </div>

            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-semibold" style={{ color: MUTED }}>
                  Inactividad:
                </span>
                <div className="flex items-center border" style={{ borderColor: PANEL_BORDER }}>
                  {INACTIVE_PRESETS.map((p, idx) => (
                    <button
                      key={p.key}
                      type="button"
                      onClick={() => setInactivePreset(p.key)}
                      className="h-7 px-2.5 text-[11px] font-bold"
                      style={{
                        background: inactivePreset === p.key ? TONE.indigo.solid : PANEL_BG,
                        color: inactivePreset === p.key ? "#fff" : INK,
                        borderRight: idx !== INACTIVE_PRESETS.length - 1 ? `1px solid ${PANEL_BORDER}` : "none",
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
                    style={{ borderColor: PANEL_BORDER, color: INK }}
                  />
                ) : null}
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[11px] font-semibold" style={{ color: MUTED }}>
                  Mostrar:
                </span>
                <div className="flex items-center border" style={{ borderColor: PANEL_BORDER }}>
                  {CUSTOMER_LIMIT_OPTIONS.map((n, idx) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setCustomerLimit(n)}
                      className="h-7 px-3 text-[11px] font-bold"
                      style={{
                        background: customerLimit === n ? TONE.indigo.solid : PANEL_BG,
                        color: customerLimit === n ? "#fff" : INK,
                        borderRight: idx !== CUSTOMER_LIMIT_OPTIONS.length - 1 ? `1px solid ${PANEL_BORDER}` : "none",
                      }}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <Panel icon={TrendingUp} title="Más activos / recurrentes">
                <CustomerRankingList
                  items={data.basic.customer_ranking.active}
                  limit={customerLimit}
                  expandedId={expandedCustomerId}
                  onToggle={toggleCustomer}
                  mode="active"
                  emptyText="Sin clientes activos en este segmento."
                />
              </Panel>

              <Panel icon={User} title={`Inactivos (+${inactiveDays} días sin visita)`}>
                <CustomerRankingList
                  items={data.basic.customer_ranking.inactive}
                  limit={customerLimit}
                  expandedId={expandedCustomerId}
                  onToggle={toggleCustomer}
                  mode="inactive"
                  emptyText="Sin clientes inactivos."
                />
              </Panel>
            </div>

            <Panel icon={Star} title="Servicios más reservados">
              <RankingList
                items={data.basic.top_services.map((s) => ({ id: s.service_id, name: s.name, value: s.total }))}
                formatValue={(n) => `${n} reservas`}
                emptyText="Sin reservas en el período seleccionado."
              />
            </Panel>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
              <div className="lg:col-span-2">
                {premiumUnlocked && data.premium ? (
                  <Panel icon={Calendar} title="Ocupación por día y hora">
                    <OccupancyHeatmap cells={data.premium.occupancy_heatmap} />
                  </Panel>
                ) : (
                  <LockedBlock requiredPlanLabel="Premium" description="Heatmap de horarios más pedidos por día y hora." />
                )}
              </div>
              {premiumUnlocked && data.premium ? (
                <LeadTimeCard hours={data.premium.avg_lead_time_hours} />
              ) : (
                <LockedBlock requiredPlanLabel="Premium" description="Anticipación promedio de reserva." />
              )}
            </div>

            {data.is_vet_mode && data.basic.vet ? (
              <>
                <SubHeading icon={PawPrint}>Mascotas</SubHeading>
                <div className="grid grid-cols-2 gap-2.5">
                  <Kpi icon={PawPrint} tone="indigo" label="Mascotas registradas" value={String(data.basic.vet.pets_count)} />
                  <Kpi icon={ClipboardList} tone="indigo" label="Controles pendientes" value={String(data.basic.vet.pending_followups)} />
                </div>
              </>
            ) : null}
          </SectionShell>

          {/* ===== SECCIÓN 2: INGRESOS Y DESEMPEÑO ===== */}
          <SectionShell
            icon={TrendingUp}
            tone="indigo"
            title="Ingresos y desempeño"
            subtitle="Ingresos estimados, desempeño por profesional y por sucursal"
            action={premiumUnlocked ? <SectionExportButton tables={ingresosTables} filename="ingresos_y_desempeno.csv" /> : undefined}
          >
            {premiumUnlocked && data.premium ? (
              <>
                <Panel badge={<EstimatedBadge />} />

                <div className={`grid grid-cols-1 gap-4 ${multiBranch ? "lg:grid-cols-3" : "lg:grid-cols-2"}`}>
                  <Panel icon={ShoppingBag} iconVariant="solid" tone="violet" tint="violet" title="Por servicio">
                    <MiniBarChart
                      items={data.premium.revenue_estimated.by_service.map((r) => ({ id: r.service_id || r.name, name: r.name, value: r.total }))}
                      tone="violet"
                      valueFormatter={formatCLP}
                    />
                  </Panel>
                  <Panel icon={User} iconVariant="solid" tone="green" tint="green" title="Por profesional">
                    <MiniBarChart
                      items={data.premium.revenue_estimated.by_staff.map((r) => ({ id: r.staff_id || r.name, name: r.name, value: r.total }))}
                      tone="green"
                      valueFormatter={formatCLP}
                    />
                  </Panel>
                  {multiBranch ? (
                    <Panel icon={Building2} iconVariant="solid" tone="blue" tint="blue" title="Por sucursal">
                      <MiniBarChart
                        items={data.premium.revenue_estimated.by_branch.map((r) => ({ id: r.branch_id || r.name, name: r.name, value: r.total }))}
                        tone="blue"
                        valueFormatter={formatCLP}
                      />
                    </Panel>
                  ) : null}
                </div>

                <Panel icon={BarChart3} title="Desempeño por profesional">
                  {data.premium.staff_performance.length === 0 ? (
                    <EmptyState text="Sin reservas asignadas a profesionales en el período." />
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr style={{ background: TABLE_HEAD_BG }}>
                            <th className="px-3 py-2.5 font-bold" style={{ color: INK }}>
                              Profesional
                            </th>
                            <th className="px-3 py-2.5 text-right font-bold" style={{ color: INK }}>
                              <span className="inline-flex items-center gap-1.5">
                                <Calendar size={13} style={{ color: TONE.blue.solid }} />
                                Reservas
                              </span>
                            </th>
                            <th className="px-3 py-2.5 text-right font-bold" style={{ color: INK }}>
                              <span className="inline-flex items-center gap-1.5">
                                <User size={13} style={{ color: TONE.green.solid }} />
                                Tasa no-show
                              </span>
                            </th>
                            <th className="px-3 py-2.5 text-right font-bold" style={{ color: INK }}>
                              <span className="inline-flex items-center gap-1.5">
                                <XCircle size={13} style={{ color: TONE.red.solid }} />
                                Tasa cancelación
                              </span>
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y" style={{ borderColor: PANEL_BORDER }}>
                          {data.premium.staff_performance.map((s) => (
                            <tr key={s.staff_id}>
                              <td className="px-3 py-2.5">
                                <div className="flex items-center gap-2.5">
                                  <span
                                    className="flex h-7 w-7 shrink-0 items-center justify-center text-[11px] font-extrabold"
                                    style={{ background: TONE.indigo.tint, color: TONE.indigo.solid }}
                                  >
                                    {getInitials(s.name)}
                                  </span>
                                  <span className="font-bold" style={{ color: INK }}>
                                    {s.name}
                                  </span>
                                </div>
                              </td>
                              <td className="px-3 py-2.5 text-right font-extrabold tabular-nums" style={{ color: TONE.blue.solid }}>
                                {s.total}
                              </td>
                              <td className="px-3 py-2.5 text-right font-extrabold tabular-nums" style={{ color: TONE.green.solid }}>
                                {formatPct(s.no_show_rate)}
                              </td>
                              <td className="px-3 py-2.5 text-right font-extrabold tabular-nums" style={{ color: TONE.red.solid }}>
                                {formatPct(s.cancellation_rate)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </Panel>

                {multiBranch ? (
                  <Panel icon={Building2} title="Desempeño por sucursal">
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                      {data.premium.branch_activity.map((b) => (
                        <div key={b.branch_id} className="p-3" style={{ border: `1px solid ${PANEL_BORDER}`, background: TONE.blue.tint }}>
                          <p className="truncate text-sm font-bold" style={{ color: INK }}>
                            {b.name}
                          </p>
                          <p className="mt-1 text-lg font-extrabold tabular-nums" style={{ color: INK }}>
                            {b.total_appointments}{" "}
                            <span className="text-xs font-normal" style={{ color: MUTED }}>
                              reservas
                            </span>
                          </p>
                          <p className="text-xs" style={{ color: MUTED }}>
                            {b.active_customers} clientes activos
                          </p>
                        </div>
                      ))}
                    </div>
                  </Panel>
                ) : null}

                {data.premium.group_capacity.length > 0 ? (
                  <Panel icon={ClipboardList} title="Cupos ocupados en reservas grupales">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr style={{ background: TABLE_HEAD_BG }}>
                            <th className="px-3 py-2.5 font-bold" style={{ color: INK }}>
                              Servicio
                            </th>
                            <th className="px-3 py-2.5 text-right font-bold" style={{ color: INK }}>
                              Sesiones
                            </th>
                            <th className="px-3 py-2.5 text-right font-bold" style={{ color: INK }}>
                              Cupo/sesión
                            </th>
                            <th className="px-3 py-2.5 text-right font-bold" style={{ color: INK }}>
                              Ocupados
                            </th>
                            <th className="px-3 py-2.5 text-right font-bold" style={{ color: INK }}>
                              % Ocupación
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y" style={{ borderColor: PANEL_BORDER }}>
                          {data.premium.group_capacity.map((g) => (
                            <tr key={g.service_id}>
                              <td className="px-3 py-2.5 font-bold" style={{ color: INK }}>
                                {g.name}
                              </td>
                              <td className="px-3 py-2.5 text-right tabular-nums" style={{ color: INK }}>
                                {g.sessions}
                              </td>
                              <td className="px-3 py-2.5 text-right tabular-nums" style={{ color: INK }}>
                                {g.capacity_per_session}
                              </td>
                              <td className="px-3 py-2.5 text-right tabular-nums" style={{ color: INK }}>
                                {g.total_booked}
                              </td>
                              <td className="px-3 py-2.5 text-right font-extrabold tabular-nums" style={{ color: toneTextColor(rateTone(100 - g.occupancy_rate, 40, 70)) }}>
                                {formatPct(g.occupancy_rate)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </Panel>
                ) : null}
              </>
            ) : (
              <LockedBlock
                requiredPlanLabel="Premium"
                description="Ingresos estimados por servicio/profesional/sucursal, desempeño por profesional y por sucursal, y cupos ocupados en reservas grupales."
              />
            )}
          </SectionShell>

          {/* ===== SECCIÓN 3: MARKETING Y SUSCRIPCIÓN ===== */}
          <SectionShell
            icon={Megaphone}
            iconVariant="solid"
            tone="violet"
            title="Marketing y suscripción"
            subtitle="Cupos, campañas y add-ons"
            action={premiumUnlocked ? <SectionExportButton tables={marketingTables} filename="marketing_y_suscripcion.csv" /> : undefined}
          >
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <Panel icon={WhatsAppGlyph} iconVariant="solid" tone="green" title="Cupo WhatsApp confirmación + recordatorio">
                <UsageBar label="Mensajes usados este mes" usage={data.basic.wa_confirmacion_usage} tone="green" />
              </Panel>

              <Panel icon={Puzzle} iconVariant="solid" tone="violet" title="Add-ons activos">
                {data.basic.addons.length === 0 ? (
                  <div className="flex flex-col items-center justify-center gap-3 py-6">
                    <div className="relative flex h-16 w-16 items-center justify-center" style={{ background: TONE.violet.tint, color: TONE.violet.solid }}>
                      <PackageOpen size={30} strokeWidth={1.8} />
                      <Sparkles size={14} className="absolute -right-1.5 -top-1.5" />
                      <Sparkles size={10} className="absolute -bottom-1 -left-1.5" />
                    </div>
                    <p className="text-sm" style={{ color: MUTED }}>
                      No tienes add-ons activos.
                    </p>
                  </div>
                ) : (
                  <div className="divide-y" style={{ borderColor: PANEL_BORDER }}>
                    {data.basic.addons.map((a) => (
                      <div key={a.addon_key} className="flex items-center justify-between gap-2 py-2">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-bold" style={{ color: INK }}>
                            {a.name}
                          </p>
                          <p className="text-[11px]" style={{ color: MUTED }}>
                            {a.quantity} unidad{a.quantity === 1 ? "" : "es"} · {a.billing_cycle}
                          </p>
                        </div>
                        <span className="shrink-0 text-sm font-extrabold tabular-nums" style={{ color: INK }}>
                          Saldo: {a.balance}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </Panel>
            </div>

            {businessUnlocked && data.business ? (
              <>
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                  <Panel icon={WhatsAppGlyph} iconVariant="solid" tone="green" title="Cupo campañas WhatsApp">
                    <UsageBar label="Mensajes usados este mes" usage={data.business.campanas_wa_usage} tone="green" />
                  </Panel>
                  <Panel icon={Mail} iconVariant="solid" tone="blue" title="Cupo campañas Email">
                    <UsageBar label="Emails usados este mes" usage={data.business.emails_campana_usage} tone="blue" />
                  </Panel>
                </div>

                <Panel
                  icon={Calendar}
                  iconVariant="solid"
                  tone="violet"
                  title="Historial de campañas"
                  meta={
                    <div className="flex flex-wrap items-center gap-4 text-xs font-semibold" style={{ color: INK }}>
                      <span>
                        Enviados: <b className="tabular-nums">{data.business.campaign_history.totals.sent}</b>
                      </span>
                      <span className="flex items-center gap-1.5">
                        <span className="h-2 w-2" style={{ borderRadius: 9999, background: TONE.red.solid }} />
                        Fallidos: <b className="tabular-nums">{data.business.campaign_history.totals.failed}</b>
                      </span>
                      <span className="flex items-center gap-1.5">
                        <span className="h-2 w-2" style={{ borderRadius: 9999, background: TONE.amber.solid }} />
                        Omitidos: <b className="tabular-nums">{data.business.campaign_history.totals.skipped}</b>
                      </span>
                    </div>
                  }
                >
                  {data.business.campaign_history.rows.length === 0 ? (
                    <div className="flex flex-col items-center justify-center gap-2 border border-dashed py-8" style={{ borderColor: PANEL_BORDER }}>
                      <Inbox size={26} style={{ color: "#c4b5fd" }} />
                      <p className="text-sm" style={{ color: MUTED }}>
                        Sin campañas enviadas en el período seleccionado.
                      </p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr style={{ background: TABLE_HEAD_BG }}>
                            <th className="px-3 py-2.5 font-bold" style={{ color: INK }}>
                              Campaña
                            </th>
                            <th className="px-3 py-2.5 font-bold" style={{ color: INK }}>
                              Canal
                            </th>
                            <th className="px-3 py-2.5 text-right font-bold" style={{ color: INK }}>
                              Enviados
                            </th>
                            <th className="px-3 py-2.5 text-right font-bold" style={{ color: INK }}>
                              Fallidos
                            </th>
                            <th className="px-3 py-2.5 text-right font-bold" style={{ color: INK }}>
                              Omitidos
                            </th>
                            <th className="px-3 py-2.5 text-right font-bold" style={{ color: INK }}>
                              Fecha
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y" style={{ borderColor: PANEL_BORDER }}>
                          {data.business.campaign_history.rows.map((c) => (
                            <tr key={c.id}>
                              <td className="px-3 py-2.5 font-bold" style={{ color: INK }}>
                                {c.campaign_name || "Sin nombre"}
                              </td>
                              <td className="px-3 py-2.5 capitalize" style={{ color: INK }}>
                                {c.channel}
                              </td>
                              <td className="px-3 py-2.5 text-right tabular-nums" style={{ color: INK }}>
                                {c.sent_count}
                              </td>
                              <td className="px-3 py-2.5 text-right tabular-nums" style={{ color: INK }}>
                                {c.failed_count}
                              </td>
                              <td className="px-3 py-2.5 text-right tabular-nums" style={{ color: INK }}>
                                {c.skipped_count}
                              </td>
                              <td className="px-3 py-2.5 text-right" style={{ color: MUTED }}>
                                {formatDateCL(c.created_at)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </Panel>
              </>
            ) : (
              <LockedBlock requiredPlanLabel="Business" description="Cupos de campañas WhatsApp/Email e historial de campañas enviadas." />
            )}

            {premiumUnlocked && data.premium ? (
              <Panel icon={WhatsAppGlyph} iconVariant="solid" tone="green" title="Entrega WhatsApp Marketing" badge={<RealDataBadge />}>
                <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
                  <Kpi
                    icon={Send}
                    tone="green"
                    label="Entregados"
                    value={String(data.premium.whatsapp_marketing_delivery.delivered + data.premium.whatsapp_marketing_delivery.read)}
                  />
                  <Kpi
                    icon={XCircle}
                    tone="red"
                    label="Fallidos"
                    value={String(data.premium.whatsapp_marketing_delivery.failed + data.premium.whatsapp_marketing_delivery.undelivered)}
                  />
                  <Kpi icon={Mail} tone="blue" label="Total enviados" value={String(data.premium.whatsapp_marketing_delivery.total)} />
                  <Kpi icon={Clock} tone="amber" label="Tasa de entrega" value={formatPct(data.premium.whatsapp_marketing_delivery.delivery_rate)} />
                </div>
              </Panel>
            ) : (
              <LockedBlock requiredPlanLabel="Premium" description="Tasa de entrega real de WhatsApp Marketing por destinatario." />
            )}
          </SectionShell>
        </>
      ) : null}

      <style jsx>{`
        .orbyx-indicadores-page {
          --ind-ink: #0f172a;
          --ind-muted: #64748b;
          --ind-shell-border: #e2e0f3;
          --ind-panel-border: #e7e5f1;
          --ind-track-bg: #eef0f4;
          --ind-panel-bg: #ffffff;
          --ind-shell-header-bg: linear-gradient(180deg, #ffffff, #faf9ff);
          --ind-table-head-bg: #f5f4fc;
          --ind-indigo-solid: #4f46e5;
          --ind-indigo-tint: #eef0ff;
          --ind-indigo-text: #3730a3;
          --ind-green-solid: #16a34a;
          --ind-green-tint: #eafbf1;
          --ind-green-text: #15803d;
          --ind-red-solid: #dc2626;
          --ind-red-tint: #fdf0f1;
          --ind-red-text: #b91c1c;
          --ind-gray-solid: #64748b;
          --ind-gray-tint: #f3f4f6;
          --ind-gray-text: #475569;
          --ind-blue-solid: #2563eb;
          --ind-blue-tint: #edf3ff;
          --ind-blue-text: #1d4ed8;
          --ind-violet-solid: #7c3aed;
          --ind-violet-tint: #f4f0ff;
          --ind-violet-text: #6d28d9;
          --ind-amber-solid: #d97706;
          --ind-amber-tint: #fff6e8;
          --ind-amber-text: #b45309;
        }

        :global(:root[data-theme="nocturno"]) .orbyx-indicadores-page {
          --ind-ink: #e6ebf5;
          --ind-muted: #94a3bb;
          --ind-shell-border: #203a61;
          --ind-panel-border: #203a61;
          --ind-track-bg: #16223d;
          --ind-panel-bg: #101b31;
          --ind-shell-header-bg: linear-gradient(180deg, #101b31, #0b1526);
          --ind-table-head-bg: #16223d;
          --ind-indigo-solid: #6366f1;
          --ind-indigo-tint: #1e1b3a;
          --ind-indigo-text: #a5b4fc;
          --ind-green-solid: #22c55e;
          --ind-green-tint: #123329;
          --ind-green-text: #6ee7b7;
          --ind-red-solid: #ef4444;
          --ind-red-tint: #3a151a;
          --ind-red-text: #fca5a5;
          --ind-gray-solid: #94a3b8;
          --ind-gray-tint: #1e2530;
          --ind-gray-text: #cbd5e1;
          --ind-blue-solid: #3b82f6;
          --ind-blue-tint: #132a44;
          --ind-blue-text: #93c5fd;
          --ind-violet-solid: #8b5cf6;
          --ind-violet-tint: #241f3d;
          --ind-violet-text: #c4b5fd;
          --ind-amber-solid: #f59e0b;
          --ind-amber-tint: #3a2a18;
          --ind-amber-text: #fcd34d;
        }
      `}</style>
    </div>
  );
}
