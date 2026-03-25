"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { usePathname, useParams } from "next/navigation";
import {
  CalendarDays,
  LayoutDashboard,
  Briefcase,
  Scissors,
  Users,
  GitBranch,
  ChevronRight,
} from "lucide-react";
import clsx from "clsx";

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
};

const navItems = [
  {
    label: "Resumen",
    href: "",
    icon: LayoutDashboard,
  },
  {
    label: "Agenda",
    href: "/agenda",
    icon: CalendarDays,
  },
  {
    label: "Sucursales",
    href: "/branches",
    icon: GitBranch,
  },
  {
    label: "Servicios",
    href: "/services",
    icon: Scissors,
  },
  {
    label: "Staff",
    href: "/staff",
    icon: Users,
  },
  {
    label: "Negocio",
    href: "/business",
    icon: Briefcase,
  },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const params = useParams();
  const pathname = usePathname();

  const slug =
    ((params as any)?.slug as string) || ((params as any)?.Slug as string);

  const [branches, setBranches] = useState<BranchItem[]>([]);
  const [selectedBranchId, setSelectedBranchId] = useState("");
  const [loadingBranches, setLoadingBranches] = useState(false);
  const [branchesError, setBranchesError] = useState("");

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

        setBranches(rows);

        if (rows.length === 0) {
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

        if (storedExists) {
          setSelectedBranchId(storedBranchId);
          return;
        }

        const defaultBranchId = rows[0].id;
        setSelectedBranchId(defaultBranchId);

        if (typeof window !== "undefined" && branchStorageKey) {
          localStorage.setItem(branchStorageKey, defaultBranchId);
        }

        notifyBranchChanged(defaultBranchId);
      } catch (error: any) {
        setBranches([]);
        setSelectedBranchId("");
        setBranchesError(
          error?.message || "No se pudieron cargar las sucursales"
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

  return (
    <div className="min-h-screen bg-slate-100/70">
      <div className="flex min-h-screen">
        {/* Sidebar */}
        <aside className="hidden w-72 shrink-0 border-r border-slate-200 bg-white xl:block">
          <div className="sticky top-0 flex h-screen flex-col overflow-y-auto">
            <div className="border-b border-slate-200 px-6 py-6">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-slate-900 to-slate-700 text-sm font-semibold text-white shadow-sm">
                  O
                </div>
                <div>
                  <h1 className="text-lg font-semibold tracking-tight text-slate-900">
                    Orbyx
                  </h1>
                  <p className="text-sm text-slate-500">Panel de negocio</p>
                </div>
              </div>
            </div>

            <div className="px-4 pt-5">
              {loadingBranches ? (
                <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
                  Cargando sucursales...
                </div>
              ) : branchesError ? (
                <div className="rounded-3xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
                  {branchesError}
                </div>
              ) : branches.length === 0 ? (
                <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
                  No hay sucursales creadas.
                </div>
              ) : (
                <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                  <div className="mb-2 flex items-center gap-2">
                    <GitBranch size={16} className="text-slate-500" />
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                      Sucursal activa
                    </p>
                  </div>

                  {showBranchSelector ? (
                    <select
                      value={selectedBranchId}
                      onChange={(e) => persistSelectedBranch(e.target.value)}
                      className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-700 outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-200/60"
                    >
                      {branches.map((branch) => (
                        <option key={branch.id} value={branch.id}>
                          {branch.name}
                        </option>
                      ))}
                    </select>
                  ) : hasSingleBranch ? (
                    <div className="flex h-11 items-center rounded-2xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-900">
                      {selectedBranchName || branches[0]?.name || "Sucursal"}
                    </div>
                  ) : null}

                  <p className="mt-3 text-xs text-slate-500">
                    Lo que veas en agenda, staff y servicios dependerá de esta
                    sucursal.
                  </p>
                </div>
              )}
            </div>

            <div className="px-4 py-5">
              <div className="mb-3 px-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                Navegación
              </div>

              <nav className="space-y-1.5">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const fullHref = `/dashboard/${slug}${item.href}`;
                  const active = isItemActive(fullHref);

                  return (
                    <Link
                      key={item.label}
                      href={fullHref}
                      className={clsx(
                        "group flex items-center justify-between rounded-2xl px-3.5 py-3 text-sm font-medium transition-all",
                        active
                          ? "bg-slate-900 text-white shadow-sm"
                          : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={clsx(
                            "flex h-9 w-9 items-center justify-center rounded-xl transition-all",
                            active
                              ? "bg-white/10 text-white"
                              : "bg-slate-100 text-slate-500 group-hover:bg-white"
                          )}
                        >
                          <Icon size={18} />
                        </div>
                        <span>{item.label}</span>
                      </div>

                      <ChevronRight
                        size={16}
                        className={clsx(
                          "transition-opacity",
                          active
                            ? "opacity-100"
                            : "opacity-0 group-hover:opacity-50"
                        )}
                      />
                    </Link>
                  );
                })}
              </nav>
            </div>

            <div className="mt-auto p-4">
              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                  Negocio activo
                </p>
                <p className="mt-2 truncate text-sm font-semibold text-slate-900">
                  {slug}
                </p>
                <p className="mt-1 text-sm text-slate-500">
                  Administra tu agenda, sucursales, staff, servicios y datos del
                  negocio.
                </p>
              </div>
            </div>
          </div>
        </aside>

        {/* Main */}
        <div className="flex min-w-0 flex-1 flex-col">
          {/* Topbar */}
          <header className="sticky top-0 z-20 border-b border-slate-200/80 bg-white/80 backdrop-blur">
            <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                  Dashboard
                </p>
                <h2 className="text-xl font-semibold tracking-tight text-slate-900">
                  Gestión de negocio
                </h2>
              </div>

              <div className="hidden items-center gap-3 sm:flex">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-600">
                  /dashboard/{slug}
                </div>
              </div>
            </div>
          </header>

          {/* Content */}
          <main className="flex-1">
            <div className="w-full px-4 py-6 sm:px-6 lg:px-10 xl:px-12 2xl:px-16 lg:py-8">
              {children}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}