"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { usePathname, useParams } from "next/navigation";
import {
  CalendarDays,
  BarChart3,
  Briefcase,
  Layers3,
  Users,
  GitBranch,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Megaphone,
  CreditCard,
  FileText,
  HelpCircle,
  Menu,
  Settings,
  Store,
  Crown,
  Bell,
  X,
} from "lucide-react";
import clsx from "clsx";
import { useTheme } from "../../../lib/use-theme";

const BACKEND_URL = "https://orbyx-backend.onrender.com";

type BusinessResponse = {
  business: {
    id: string;
    name: string;
    slug: string;
    plan_slug?: string | null;
  };
};

type BranchItem = {
  id: string;
  tenant_id?: string;
  name: string;
  is_active?: boolean;
};

const navItems = [
  {
    label: "Métricas",
    href: "",
    icon: BarChart3,
  },
  {
    label: "Agenda",
    href: "/agenda",
    icon: CalendarDays,
  },
  {
    label: "Clientes",
    href: "/customers",
    icon: Users,
  },
  {
    label: "Campañas",
    href: "/campaigns",
    icon: Megaphone,
  },
  {
    label: "Servicios",
    href: "/services",
    icon: Layers3,
    accent: true,
  },
  {
    label: "Staff",
    href: "/staff",
    icon: Users,
  },
  {
    label: "Sucursales",
    href: "/branches",
    icon: GitBranch,
  },
  {
    label: "Negocio",
    href: "/business",
    icon: Briefcase,
  },
  {
    label: "Billing",
    href: "/billing",
    icon: CreditCard,
  },
];

const navSections = [
  {
    title: "Principal",
    items: [
      { label: "Agenda", href: "/agenda", icon: CalendarDays },
      { label: "Clientes", href: "/customers", icon: Users },
      { label: "Campañas", href: "/campaigns", icon: Megaphone },
      { label: "Servicios", href: "/services", icon: Layers3 },
      { label: "Staff", href: "/staff", icon: Users },
      { label: "Sucursales", href: "/branches", icon: Store },
      { label: "Negocio", href: "/business", icon: Briefcase },
      { label: "Billing", href: "/billing", icon: CreditCard },
    ],
  },
  {
    title: "Análisis",
    items: [
      { label: "Métricas", href: "", icon: BarChart3 },
      { label: "Reportes", href: "", icon: FileText },
    ],
  },
  {
    title: "Soporte",
    items: [{ label: "Ayuda", href: "", icon: HelpCircle }],
  },
  {
    title: "Ajustes",
    items: [{ label: "Configuración", href: "/business", icon: Settings }],
  },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const params = useParams();
  const pathname = usePathname();
  const { theme, toggleTheme, mounted } = useTheme();

  const slug =
    ((params as { slug?: string })?.slug as string) ||
    ((params as { Slug?: string })?.Slug as string) ||
    "";

  const [branches, setBranches] = useState<BranchItem[]>([]);
  const [businessName, setBusinessName] = useState("");
  const [plan, setPlan] = useState("pro");
  const [selectedBranchId, setSelectedBranchId] = useState("");
  const [loadingBranches, setLoadingBranches] = useState(false);
  const [branchesError, setBranchesError] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const planLabel =
    plan === "platinum"
      ? "Platinum"
      : plan === "vip"
      ? "VIP"
      : plan === "premium"
      ? "Premium"
      : "Pro";

  const branchStorageKey = useMemo(() => {
    return slug ? `orbyx_active_branch_${slug}` : "";
  }, [slug]);

  function isItemActive(fullHref: string) {
    if (fullHref === `/dashboard/${slug}`) {
      return pathname === fullHref;
    }

    return pathname === fullHref || pathname.startsWith(`${fullHref}/`);
  }

  function notifyBranchChanged(branchId: string) {
    if (typeof window === "undefined") return;

    window.dispatchEvent(
      new CustomEvent("orbyx-branch-changed", {
        detail: {
          slug,
          branchId,
        },
      })
    );
  }

  function persistSelectedBranch(branchId: string) {
    setSelectedBranchId(branchId);

    if (typeof window !== "undefined" && branchStorageKey) {
      localStorage.setItem(branchStorageKey, branchId);
    }

    notifyBranchChanged(branchId);
  }

  useEffect(() => {
    if (!slug) return;

    async function loadBranchesForSidebar() {
      try {
        setLoadingBranches(true);
        setBranchesError("");

        const businessRes = await fetch(`${BACKEND_URL}/public/business/${slug}`);
        const businessData: BusinessResponse | { error?: string } =
          await businessRes.json();

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

        const currentTenantId = businessData.business.id;
        setBusinessName(businessData.business.name || slug);
        setPlan(String(businessData.business.plan_slug || "pro").toLowerCase());

        const branchesRes = await fetch(
          `${BACKEND_URL}/branches?tenant_id=${currentTenantId}`
        );
        const branchesData = await branchesRes.json();

        if (!branchesRes.ok) {
          throw new Error(
            branchesData?.error || "No se pudieron cargar las sucursales"
          );
        }

        const rows: BranchItem[] = Array.isArray(branchesData?.branches)
          ? branchesData.branches
          : [];
        const activeRows = rows.filter((branch) => branch.is_active !== false);

        setBranches(activeRows);

        if (activeRows.length === 0) {
          setSelectedBranchId("");
          if (typeof window !== "undefined" && branchStorageKey) {
            localStorage.removeItem(branchStorageKey);
          }
          return;
        }

        const storedBranchId =
          typeof window !== "undefined" && branchStorageKey
            ? localStorage.getItem(branchStorageKey) || ""
            : "";

        const storedExists = rows.some((branch) => branch.id === storedBranchId);
        const activeStoredExists = activeRows.some(
          (branch) => branch.id === storedBranchId
        );

        if (storedExists && activeStoredExists) {
          setSelectedBranchId(storedBranchId);
          return;
        }

        const defaultBranchId = activeRows[0].id;
        setSelectedBranchId(defaultBranchId);

        if (typeof window !== "undefined" && branchStorageKey) {
          localStorage.setItem(branchStorageKey, defaultBranchId);
        }

        notifyBranchChanged(defaultBranchId);
      } catch (error: unknown) {
        setBranches([]);
        setSelectedBranchId("");
        setBranchesError(
          error instanceof Error
            ? error.message
            : "No se pudieron cargar las sucursales"
        );
      } finally {
        setLoadingBranches(false);
      }
    }

    loadBranchesForSidebar();
  }, [slug, branchStorageKey]);

  const selectedBranchName =
    branches.find((branch) => branch.id === selectedBranchId)?.name || "";

  const showBranchSelector = branches.length > 1;
  const hasSingleBranch = branches.length === 1;

  const isNocturno = theme === "nocturno";
  const sidebarBg = isNocturno
    ? "linear-gradient(180deg, rgba(15,23,42,0.98), rgba(2,6,23,0.98))"
    : "linear-gradient(180deg, #f3f7ff, #eaf1ff 46%, #eef4ff)";
  const sidebarBorder = isNocturno
    ? "rgba(56,189,248,0.20)"
    : "rgba(59,130,246,0.18)";
  const softBg = isNocturno
    ? "rgba(15,23,42,0.72)"
    : "rgba(220,232,255,0.72)";
  const cardBg = isNocturno
    ? "rgba(15,23,42,0.78)"
    : "rgba(243,247,255,0.86)";
  const textMain = "var(--text-main)";
  const textMuted = "var(--text-muted)";
  const mainBg = isNocturno
    ? "var(--bg-main)"
    : "linear-gradient(180deg, #f8fbff, #eef4ff)";

  function BranchSelectorBlock({ compact = false }: { compact?: boolean }) {
    if (loadingBranches) {
      return (
        <div
          className={clsx("border text-sm", compact ? "rounded-2xl p-3" : "rounded-3xl p-4")}
          style={{
            background: softBg,
            borderColor: sidebarBorder,
            color: textMuted,
          }}
        >
          Cargando sucursales...
        </div>
      );
    }

    if (branchesError) {
      return (
        <div className={clsx("border border-rose-200 bg-rose-50 text-sm text-rose-700", compact ? "rounded-2xl p-3" : "rounded-3xl p-4")}>
          {branchesError}
        </div>
      );
    }

    if (branches.length === 0) {
      return (
        <div
          className={clsx("border text-sm", compact ? "rounded-2xl p-3" : "rounded-3xl p-4")}
          style={{
            background: softBg,
            borderColor: sidebarBorder,
            color: textMuted,
          }}
        >
          No hay sucursales creadas.
        </div>
      );
    }

    return (
      <div
        className={clsx("border", compact ? "rounded-2xl p-3" : "rounded-3xl p-4")}
        style={{
          background: softBg,
          borderColor: sidebarBorder,
        }}
      >
        <div className="mb-2 flex items-center gap-2">
          <GitBranch size={16} style={{ color: textMuted }} />
          <p
            className="text-xs font-semibold uppercase tracking-[0.16em]"
            style={{ color: textMuted }}
          >
            Sucursal activa
          </p>
        </div>

        {showBranchSelector ? (
          <select
            value={selectedBranchId}
            onChange={(e) => persistSelectedBranch(e.target.value)}
            className="h-11 w-full rounded-2xl border px-4 text-sm outline-none transition"
            style={{
              background: cardBg,
              borderColor: sidebarBorder,
              color: textMain,
            }}
          >
            {branches.map((branch) => (
              <option key={branch.id} value={branch.id}>
                {branch.name}
              </option>
            ))}
          </select>
        ) : hasSingleBranch ? (
          <div
            className="flex h-11 items-center rounded-2xl border px-4 text-sm font-medium"
            style={{
              background: cardBg,
              borderColor: sidebarBorder,
              color: textMain,
            }}
          >
            {selectedBranchName || branches[0]?.name || "Sucursal"}
          </div>
        ) : null}

        <p className="mt-3 text-xs" style={{ color: textMuted }}>
          Lo que veas en agenda, staff y servicios dependerÃ¡ de esta sucursal.
        </p>
      </div>
    );
  }

  function NavLinks({
    onNavigate,
    collapsed = false,
  }: {
    onNavigate?: () => void;
    collapsed?: boolean;
  }) {
    return (
      <nav className={clsx("space-y-3", collapsed && "space-y-2")}>
        {navSections.map((section) => (
          <div key={section.title}>
            {!collapsed ? (
              <div
                className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-[0.18em]"
                style={{ color: textMuted }}
              >
                {section.title}
              </div>
            ) : section.title !== "Principal" ? (
              <div
                className="mx-auto mb-2 h-px w-10"
                style={{ background: sidebarBorder }}
              />
            ) : null}

            <div className="space-y-1.5">
              {section.items.map((item) => {
                const Icon = item.icon;
                const fullHref = `/dashboard/${slug}${item.href}`;
                const active =
                  item.label === "Métricas"
                    ? isItemActive(fullHref)
                    : item.href
                    ? isItemActive(fullHref)
                    : false;

                return (
                  <Link
                    key={`${section.title}-${item.label}`}
                    href={fullHref}
                    title={collapsed ? item.label : undefined}
                    onClick={onNavigate}
                    className={clsx(
                      "group flex items-center rounded-xl border text-sm font-semibold transition-all duration-200 hover:!border-cyan-300/30 hover:!bg-blue-500/10",
                      collapsed
                        ? "h-11 w-11 justify-center p-0"
                        : "h-11 justify-between px-3",
                      active
                        ? "translate-x-0"
                        : "hover:translate-x-0.5"
                    )}
                    style={{
                      background: active
                        ? "linear-gradient(135deg, rgb(79 70 229), rgb(37 99 235) 45%, rgb(14 165 233))"
                        : "transparent",
                      borderColor: active
                        ? "rgba(103,232,249,0.58)"
                        : "rgba(59,130,246,0)",
                      color: active ? "white" : textMuted,
                      boxShadow: active
                        ? "0 0 0 1px rgba(103,232,249,0.16), 0 14px 30px -18px rgba(14,165,233,0.95), inset 0 1px 0 rgba(255,255,255,0.18)"
                        : "none",
                    }}
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <div
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-all duration-200 group-hover:text-cyan-300"
                        style={{
                          background: active
                            ? "rgba(255,255,255,0.12)"
                            : isNocturno
                            ? "rgba(15,23,42,0.36)"
                            : "rgba(220,232,255,0.62)",
                          color: active ? "white" : "currentColor",
                        }}
                      >
                        <Icon size={17} />
                      </div>
                      {!collapsed ? <span className="truncate">{item.label}</span> : null}
                    </div>

                    {!collapsed ? (
                      <ChevronRight
                        size={15}
                        className={clsx(
                          "transition-opacity",
                          active
                            ? "opacity-90"
                            : "opacity-0 group-hover:opacity-45"
                        )}
                      />
                    ) : null}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: mainBg }}>
      <style>{`
        .orbyx-sidebar-scroll {
          scrollbar-width: thin;
          scrollbar-color: #2563eb rgba(37, 99, 235, 0.1);
        }

        .orbyx-sidebar-scroll::-webkit-scrollbar {
          width: 8px;
        }

        .orbyx-sidebar-scroll::-webkit-scrollbar-track {
          margin: 14px 3px;
          border-radius: 999px;
          background: rgba(37, 99, 235, 0.08);
        }

        .orbyx-sidebar-scroll::-webkit-scrollbar-thumb {
          border: 2px solid transparent;
          border-radius: 999px;
          background:
            linear-gradient(180deg, #7c3aed 0%, #2563eb 48%, #22d3ee 100%)
            border-box;
          box-shadow: 0 0 10px rgba(34, 211, 238, 0.18);
        }

        .orbyx-sidebar-scroll::-webkit-scrollbar-thumb:hover {
          background:
            linear-gradient(180deg, #8b5cf6 0%, #1d4ed8 45%, #06b6d4 100%)
            border-box;
        }
      `}</style>
      <div className="flex min-h-screen">
        <aside
          className={clsx(
            "relative hidden shrink-0 border-r transition-[width] duration-200 xl:block",
            sidebarCollapsed ? "w-20" : "w-72"
          )}
          style={{
            background: sidebarBg,
            borderColor: sidebarBorder,
          }}
        >
          <button
            type="button"
            aria-label={sidebarCollapsed ? "Expandir sidebar" : "Colapsar sidebar"}
            onClick={() => setSidebarCollapsed((value) => !value)}
            className="absolute right-0 top-[350px] z-30 flex h-28 w-8 translate-x-full -translate-y-1/2 items-center justify-center rounded-r-xl rounded-l-none border border-l-0 transition-all duration-200 hover:shadow-[0_0_22px_-10px_rgba(34,211,238,0.95)]"
            style={{
              background: isNocturno
                ? "linear-gradient(180deg, rgba(37,99,235,0.28), rgba(14,165,233,0.14))"
                : "linear-gradient(180deg, #dbeafe, #bae6fd)",
              borderColor: "rgba(34,211,238,0.38)",
              color: isNocturno ? "#dff8ff" : "#0f3f8f",
              boxShadow: isNocturno
                ? "0 14px 34px -24px rgba(34,211,238,0.95), inset 0 1px 0 rgba(255,255,255,0.12)"
                : "0 14px 30px -22px rgba(37,99,235,0.7), inset 0 1px 0 rgba(255,255,255,0.76)",
            }}
          >
            {sidebarCollapsed ? <ChevronsRight size={18} /> : <ChevronsLeft size={18} />}
          </button>
          <div className="orbyx-sidebar-scroll sticky top-0 flex h-screen flex-col overflow-y-auto py-4 pl-3 pr-5">
            <div
              className={clsx(
                "mb-4 flex items-center rounded-2xl border p-3",
                sidebarCollapsed ? "justify-center" : "justify-start"
              )}
              style={{ borderColor: sidebarBorder }}
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[conic-gradient(from_180deg,rgb(14,165,233),rgb(79,70,229),rgb(34,211,238),rgb(14,165,233))] text-sm font-semibold text-white shadow-[0_12px_28px_-18px_rgba(14,165,233,0.9)]">
                  O
                </div>
                {!sidebarCollapsed ? (
                <div>
                  <h1
                    className="text-lg font-semibold tracking-tight"
                    style={{ color: textMain }}
                  >
                    Orbyx
                  </h1>
                  <p className="text-sm" style={{ color: textMuted }}>
                    Panel de negocio
                  </p>
                </div>
                ) : null}
              </div>
            </div>

            <div className={clsx("flex-1", sidebarCollapsed ? "px-1" : "px-1")}>
              <NavLinks collapsed={sidebarCollapsed} />
            </div>

            <div className="mt-auto space-y-3">
              {!sidebarCollapsed ? (
                <>
                  <div
                    className="rounded-2xl border px-3 py-2.5"
                    style={{ background: softBg, borderColor: sidebarBorder }}
                  >
                    <div className="flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.75)]" />
                      <div className="min-w-0">
                        <p className="text-[11px] font-medium" style={{ color: textMuted }}>
                          Sucursal activa
                        </p>
                        <p className="truncate text-sm font-semibold" style={{ color: textMain }}>
                          {selectedBranchName || branches[0]?.name || "Sin sucursal"}
                        </p>
                        <p className="truncate text-xs" style={{ color: textMuted }}>
                          Casa Matriz
                        </p>
                      </div>
                      <ChevronRight className="ml-auto shrink-0" size={16} style={{ color: textMuted }} />
                    </div>
                  </div>

                  <div
                    className="flex items-center gap-3 rounded-2xl border px-3 py-3"
                    style={{ background: cardBg, borderColor: sidebarBorder }}
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[linear-gradient(135deg,rgb(14,165,233),rgb(79,70,229))] text-xs font-bold text-white">
                      {businessName
                        ? businessName.slice(0, 2).toUpperCase()
                        : slug.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold" style={{ color: textMain }}>
                        {businessName || slug || "Usuario Orbyx"}
                      </p>
                      <p className="truncate text-xs" style={{ color: textMuted }}>
                        Administrador
                      </p>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center gap-3">
                  <div className="h-px w-10" style={{ background: sidebarBorder }} />
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl border text-emerald-400" title={selectedBranchName || "Sucursal activa"} style={{ background: softBg, borderColor: sidebarBorder }}>
                    <Store size={18} />
                  </div>
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[linear-gradient(135deg,rgb(14,165,233),rgb(79,70,229))] text-xs font-bold text-white" title={businessName || slug}>
                    {businessName
                      ? businessName.slice(0, 2).toUpperCase()
                      : slug.slice(0, 2).toUpperCase()}
                  </div>
                </div>
              )}
            </div>

            <div className="hidden">
              {loadingBranches ? (
                <div
                  className="rounded-3xl border p-4 text-sm"
                  style={{
                    background: softBg,
                    borderColor: sidebarBorder,
                    color: textMuted,
                  }}
                >
                  Cargando sucursales...
                </div>
              ) : branchesError ? (
                <div className="rounded-3xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
                  {branchesError}
                </div>
              ) : branches.length === 0 ? (
                <div
                  className="rounded-3xl border p-4 text-sm"
                  style={{
                    background: softBg,
                    borderColor: sidebarBorder,
                    color: textMuted,
                  }}
                >
                  No hay sucursales creadas.
                </div>
              ) : (
                <div
                  className="rounded-3xl border p-4"
                  style={{
                    background: softBg,
                    borderColor: sidebarBorder,
                  }}
                >
                  <div className="mb-2 flex items-center gap-2">
                    <GitBranch size={16} style={{ color: textMuted }} />
                    <p
                      className="text-xs font-semibold uppercase tracking-[0.16em]"
                      style={{ color: textMuted }}
                    >
                      Sucursal activa
                    </p>
                  </div>

                  {showBranchSelector ? (
                    <select
                      value={selectedBranchId}
                      onChange={(e) => persistSelectedBranch(e.target.value)}
                      className="h-11 w-full rounded-2xl border px-4 text-sm outline-none transition"
                      style={{
                        background: cardBg,
                        borderColor: sidebarBorder,
                        color: textMain,
                      }}
                    >
                      {branches.map((branch) => (
                        <option key={branch.id} value={branch.id}>
                          {branch.name}
                        </option>
                      ))}
                    </select>
                  ) : hasSingleBranch ? (
                    <div
                      className="flex h-11 items-center rounded-2xl border px-4 text-sm font-medium"
                      style={{
                        background: cardBg,
                        borderColor: sidebarBorder,
                        color: textMain,
                      }}
                    >
                      {selectedBranchName || branches[0]?.name || "Sucursal"}
                    </div>
                  ) : null}

                  <p className="mt-3 text-xs" style={{ color: textMuted }}>
                    Lo que veas en agenda, staff y servicios dependerá de esta
                    sucursal.
                  </p>
                </div>
              )}
            </div>

            <div className="hidden">
              <div
                className="mb-3 px-3 text-[11px] font-semibold uppercase tracking-[0.18em]"
                style={{ color: textMuted }}
              >
                Navegación
              </div>

              <nav className="space-y-1.5">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const fullHref = `/dashboard/${slug}${item.href}`;
                  const active = isItemActive(fullHref);
                  const hasAccent = Boolean(item.accent);

                  const itemBackground = active
                    ? "var(--text-main)"
                    : hasAccent
                    ? "linear-gradient(135deg, rgba(37,99,235,0.08), rgba(168,85,247,0.06))"
                    : "transparent";

                  const itemBorder = !active && hasAccent
                    ? "1px solid rgba(37,99,235,0.14)"
                    : "1px solid transparent";

                  const itemColor = active ? "var(--bg-card)" : textMuted;

                  const iconBackground = active
                    ? "rgba(255,255,255,0.14)"
                    : hasAccent
                    ? "linear-gradient(135deg, rgba(37,99,235,0.16), rgba(168,85,247,0.14))"
                    : softBg;

                  const iconColor = active
                    ? "var(--bg-card)"
                    : hasAccent
                    ? "#2563eb"
                    : textMuted;

                  const iconShadow =
                    !active && hasAccent
                      ? "0 8px 18px rgba(37,99,235,0.12)"
                      : "none";

                  return (
                    <Link
                      key={item.label}
                      href={fullHref}
                      className={clsx(
                        "group flex items-center justify-between rounded-2xl px-3.5 py-3 text-sm font-medium transition-all",
                        active ? "shadow-sm" : ""
                      )}
                      style={{
                        background: itemBackground,
                        color: itemColor,
                        border: itemBorder,
                        boxShadow:
                          !active && hasAccent
                            ? "0 8px 24px rgba(37,99,235,0.04)"
                            : "none",
                      }}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="flex h-9 w-9 items-center justify-center rounded-xl transition-all"
                          style={{
                            background: iconBackground,
                            color: iconColor,
                            boxShadow: iconShadow,
                          }}
                        >
                          <Icon size={18} />
                        </div>
                        <span>{item.label}</span>
                      </div>

                      <ChevronRight
                        size={16}
                        className={clsx(
                          "transition-opacity",
                          active ? "opacity-100" : "opacity-0 group-hover:opacity-50"
                        )}
                      />
                    </Link>
                  );
                })}
              </nav>
            </div>

            <div className="hidden">
              <div
                className="rounded-3xl border p-4"
                style={{
                  background: softBg,
                  borderColor: sidebarBorder,
                }}
              >
                <p
                  className="text-xs font-semibold uppercase tracking-[0.16em]"
                  style={{ color: textMuted }}
                >
                  Negocio activo
                </p>
                <p
                  className="mt-2 truncate text-sm font-semibold"
                  style={{ color: textMain }}
                >
                  {slug}
                </p>
                <p className="mt-1 text-sm" style={{ color: textMuted }}>
                  Administra métricas, clientes, campañas, agenda y
                  configuración del negocio.
                </p>
              </div>
            </div>
          </div>
        </aside>

        {mobileMenuOpen ? (
          <div className="fixed inset-0 z-40 xl:hidden">
            <button
              type="button"
              aria-label="Cerrar menu"
              className="absolute inset-0 bg-slate-950/55 backdrop-blur-sm"
              onClick={() => setMobileMenuOpen(false)}
            />

            <aside
              className="absolute left-0 top-0 flex h-full w-[min(88vw,340px)] flex-col border-r shadow-2xl"
              style={{
                background: sidebarBg,
                borderColor: sidebarBorder,
              }}
            >
              <div
                className="flex items-center justify-between border-b px-5 py-4"
                style={{ borderColor: sidebarBorder }}
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-slate-900 to-slate-700 text-sm font-semibold text-white shadow-sm">
                    O
                  </div>
                  <div>
                    <h2
                      className="text-base font-semibold tracking-tight"
                      style={{ color: textMain }}
                    >
                      Orbyx
                    </h2>
                    <p className="text-xs" style={{ color: textMuted }}>
                      Panel de negocio
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  aria-label="Cerrar menu"
                  onClick={() => setMobileMenuOpen(false)}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-xl border transition"
                  style={{
                    background: softBg,
                    borderColor: sidebarBorder,
                    color: textMain,
                  }}
                >
                  <X size={18} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto px-4 py-5">
                <BranchSelectorBlock compact />

                <div
                  className="mb-3 mt-5 px-3 text-[11px] font-semibold uppercase tracking-[0.18em]"
                  style={{ color: textMuted }}
                >
                  NavegaciÃ³n
                </div>

                <NavLinks onNavigate={() => setMobileMenuOpen(false)} />
              </div>

              <div className="border-t p-4" style={{ borderColor: sidebarBorder }}>
                <button
                  type="button"
                  onClick={toggleTheme}
                  className="inline-flex h-11 w-full items-center justify-center rounded-2xl border px-4 text-sm font-medium transition"
                  style={{
                    background: softBg,
                    borderColor: sidebarBorder,
                    color: textMain,
                  }}
                >
                  {mounted
                    ? theme === "clasico"
                      ? "Cambiar a Nocturno"
                      : "Cambiar a ClÃ¡sico"
                    : "Cambiar tema"}
                </button>
              </div>
            </aside>
          </div>
        ) : null}

        <div className="flex min-w-0 flex-1 flex-col">
          <header
            className="sticky top-0 z-20 border-b backdrop-blur"
            style={{
              background:
                theme === "nocturno"
                  ? "rgba(17,24,39,0.88)"
                  : "rgba(255,255,255,0.88)",
              borderColor: sidebarBorder,
            }}
          >
            <div className="mx-auto flex w-full max-w-[1600px] items-center justify-between gap-3 px-3 py-3 sm:px-5 lg:px-8 xl:px-10">
              <div className="flex min-w-0 items-center gap-3">
                <button
                  type="button"
                  aria-label="Abrir menu"
                  onClick={() => setMobileMenuOpen(true)}
                  className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border transition xl:hidden"
                  style={{
                    background: softBg,
                    borderColor: sidebarBorder,
                    color: textMain,
                  }}
                >
                  <Menu size={20} />
                </button>

                <div className="min-w-0">
                <p
                  className="text-[11px] font-semibold uppercase tracking-[0.18em] sm:text-xs"
                  style={{ color: textMuted }}
                >
                  Dashboard
                </p>
                <div className="mt-1 flex min-w-0 flex-wrap items-center gap-3">
                  <h2
                    className="truncate text-lg font-semibold tracking-tight sm:text-xl"
                    style={{ color: textMain }}
                  >
                    Gestión del negocio
                  </h2>
                  <span className="inline-flex h-8 items-center gap-2 rounded-full border px-3 text-xs font-semibold sm:text-sm" style={{ borderColor: "rgba(139,92,246,0.48)", background: "rgba(139,92,246,0.14)", color: "rgb(196 181 253)" }}>
                    <Crown size={15} />
                    Plan {planLabel}
                  </span>
                </div>
                </div>
              </div>

              <div className="hidden items-center gap-3 md:flex">
                <button
                  type="button"
                  onClick={toggleTheme}
                  className="inline-flex h-11 items-center justify-center rounded-2xl border px-4 text-sm font-medium transition"
                  style={{
                    background: softBg,
                    borderColor: sidebarBorder,
                    color: textMain,
                  }}
                >
                  {mounted
                    ? theme === "clasico"
                      ? "Cambiar a nocturno"
                      : "Cambiar a clásico"
                    : "Cambiar tema"}
                </button>

                <button
                  type="button"
                  aria-label="Notificaciones"
                  className="relative inline-flex h-11 w-11 items-center justify-center rounded-2xl border transition"
                  style={{
                    background: softBg,
                    borderColor: sidebarBorder,
                    color: textMain,
                  }}
                >
                  <Bell size={18} />
                  <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white">
                    3
                  </span>
                </button>

                <div
                  className="flex items-center gap-3 border-l pl-3"
                  style={{ borderColor: sidebarBorder }}
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[linear-gradient(135deg,rgb(37,99,235),rgb(79,70,229))] text-xs font-bold text-white">
                    {businessName
                      ? businessName.slice(0, 2).toUpperCase()
                      : slug.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold" style={{ color: textMain }}>
                      {businessName || slug || "Orbyx"}
                    </p>
                    <p className="truncate text-xs" style={{ color: textMuted }}>
                      Administrador
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </header>

          <main className="flex-1">
            <div className="mx-auto w-full max-w-[1600px] px-3 py-4 sm:px-5 sm:py-6 lg:px-8 xl:px-10 2xl:px-12">
              {children}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
