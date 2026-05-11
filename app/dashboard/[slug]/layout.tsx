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
  Megaphone,
  CreditCard,
  Menu,
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
  const [selectedBranchId, setSelectedBranchId] = useState("");
  const [loadingBranches, setLoadingBranches] = useState(false);
  const [branchesError, setBranchesError] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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

  const sidebarBg = "var(--bg-card)";
  const sidebarBorder = "var(--border-color)";
  const softBg = "var(--bg-soft)";
  const cardBg = "var(--bg-card)";
  const textMain = "var(--text-main)";
  const textMuted = "var(--text-muted)";
  const mainBg = "var(--bg-main)";

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

  function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
    return (
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
              onClick={onNavigate}
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
    );
  }

  return (
    <div className="min-h-screen" style={{ background: mainBg }}>
      <div className="flex min-h-screen">
        <aside
          className="hidden w-72 shrink-0 border-r xl:block"
          style={{
            background: sidebarBg,
            borderColor: sidebarBorder,
          }}
        >
          <div className="sticky top-0 flex h-screen flex-col overflow-y-auto">
            <div
              className="border-b px-6 py-6"
              style={{ borderColor: sidebarBorder }}
            >
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-slate-900 to-slate-700 text-sm font-semibold text-white shadow-sm">
                  O
                </div>
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
              </div>
            </div>

            <div className="px-4 pt-5">
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

            <div className="px-4 py-5">
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

            <div className="mt-auto p-4">
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
                <h2
                  className="truncate text-lg font-semibold tracking-tight sm:text-xl"
                  style={{ color: textMain }}
                >
                  Gestión de negocio
                </h2>
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
                      ? "Cambiar a Nocturno"
                      : "Cambiar a Clásico"
                    : "Cambiar tema"}
                </button>

                <div
                  className="rounded-2xl border px-4 py-2 text-sm"
                  style={{
                    background: softBg,
                    borderColor: sidebarBorder,
                    color: textMuted,
                  }}
                >
                  /dashboard/{slug}
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
