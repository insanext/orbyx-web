"use client";

import Link from "next/link";
import { apiFetch } from "@/lib/api";
import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { usePathname, useParams, useRouter } from "next/navigation";
import {
  CalendarDays,
  BarChart3,
  Briefcase,
  Layers3,
  Users,
  GitBranch,
  ChevronRight,
  ChevronUp,
  ChevronsLeft,
  ChevronsRight,
  Megaphone,
  CreditCard,
  FileText,
  HelpCircle,
  Headphones,
  LogOut,
  Menu,
  Settings,
  Store,
  Crown,
  Bell,
  X,
  Eye,
} from "lucide-react";
import clsx from "clsx";
import { useTheme } from "../../../lib/use-theme";
import { createClient } from "../../../lib/supabase/client";
import { PermissionsProvider, ROLE_LABEL, type ModulePermissions } from "../../../lib/permissions-context";
import { AccountStatusWidget, useAccountStatus } from "../../../components/billing/AccountStatusWidget";

const BACKEND_URL = "https://orbyx-backend.onrender.com";

type BusinessResponse = {
  business: {
    id: string;
    name: string;
    slug: string;
    plan_slug?: string | null;
    business_category?: string | null;
  };
};

type BranchItem = {
  id: string;
  tenant_id?: string;
  name: string;
  slug?: string | null;
  address?: string | null;
  is_active?: boolean;
};

type NotificationEvent = {
  id: string;
  type: "new_booking" | "canceled" | "comment";
  customerName: string;
  serviceName: string;
  startAt: string;
  read: boolean;
  createdAt: number;
};

function formatNotifTime(iso: string) {
  try {
    return new Date(iso).toLocaleString("es-CL", {
      timeZone: "America/Santiago",
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "";
  }
}

function getSantiagoDayKey(ts: number) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Santiago",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(ts));
}

function formatNotifGroupDate(ts: number) {
  return new Date(ts).toLocaleDateString("es-CL", {
    timeZone: "America/Santiago",
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

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
      { label: "Mi suscripción", href: "/billing", icon: CreditCard },
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
    items: [
      { label: "Soporte", href: "/soporte", icon: Headphones },
    ],
  },
];

// Módulos de la sidebar cuyo acceso depende de permissions granulares.
// Los items sin entrada acá (Métricas, Reportes, Soporte) no se restringen.
// Configuración vive en el dropdown del header, no en la sidebar.
const NAV_MODULE_MAP: Record<string, string> = {
  "/agenda": "agenda",
  "/customers": "clientes",
  "/campaigns": "campanas",
  "/services": "servicios",
  "/staff": "staff",
  "/branches": "sucursales",
  "/business": "negocio",
};


export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const params = useParams();
  const pathname = usePathname();
  const router = useRouter();

  if (pathname?.includes("/clinical-report/")) {
    return <>{children}</>;
  }
  const { theme, toggleTheme, mounted } = useTheme();

  const slug =
    ((params as { slug?: string })?.slug as string) ||
    ((params as { Slug?: string })?.Slug as string) ||
    "";

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  }

  const [branches, setBranches] = useState<BranchItem[]>([]);
  const [tenantId, setTenantId] = useState("");
  const [unreadTickets, setUnreadTickets] = useState(0);
  const [businessName, setBusinessName] = useState("");
  const [plan, setPlan] = useState("pro");
  const [selectedBranchId, setSelectedBranchId] = useState("");
  const [loadingBranches, setLoadingBranches] = useState(false);
  const [branchesError, setBranchesError] = useState("");
  const [businessCategory, setBusinessCategory] = useState("");
  const isPacientes = ["veterinaria", "vet", "clinica", "odontologia"].includes(businessCategory);
  const [memberRole, setMemberRole] = useState("");
  const [memberPermissions, setMemberPermissions] = useState<ModulePermissions | null>(null);
  const [memberLoaded, setMemberLoaded] = useState(false);
  const [currentUserLabel, setCurrentUserLabel] = useState("");
  const [currentUserEmail, setCurrentUserEmail] = useState("");
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [branchDropdownOpen, setBranchDropdownOpen] = useState(false);
  const branchDropdownRef = useRef<HTMLDivElement>(null);
  const [notifications, setNotifications] = useState<NotificationEvent[]>([]);
  const [notifPanelOpen, setNotifPanelOpen] = useState(false);
  const [toasts, setToasts] = useState<NotificationEvent[]>([]);
  const notifPanelRef = useRef<HTMLDivElement>(null);
  const unreadNotifCount = notifications.filter((n) => !n.read).length;

  const { status: accountStatus } = useAccountStatus(tenantId);
  const isBillingPage = pathname === `/dashboard/${slug}/billing` || pathname?.startsWith(`/dashboard/${slug}/billing/`);
  const isAccountBlocked = Boolean(accountStatus?.blocked) && !isBillingPage;

  useEffect(() => {
    if (!branchDropdownOpen) return;
    function handleOutsideClick(e: MouseEvent) {
      if (branchDropdownRef.current && !branchDropdownRef.current.contains(e.target as Node)) {
        setBranchDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [branchDropdownOpen]);

  useEffect(() => {
    if (!notifPanelOpen) return;
    function handleOutsideClick(e: MouseEvent) {
      if (notifPanelRef.current && !notifPanelRef.current.contains(e.target as Node)) {
        setNotifPanelOpen(false);
      }
    }
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [notifPanelOpen]);

  useEffect(() => {
    if (!userMenuOpen) return;
    function handleOutsideClick(e: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [userMenuOpen]);

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

        const businessRes = await apiFetch(`${BACKEND_URL}/public/business/${slug}`);
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
        setTenantId(currentTenantId);
        setBusinessName(businessData.business.name || slug);
        setPlan(String(businessData.business.plan_slug || "pro").toLowerCase());
        setBusinessCategory(String(businessData.business.business_category || "").trim().toLowerCase());

        const branchesRes = await apiFetch(
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

  useEffect(() => {
    if (!tenantId) return;

    async function loadOwnMembership() {
      try {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) return;

        const res = await apiFetch(`${BACKEND_URL}/members?tenant_id=${tenantId}`);
        const data = await res.json();
        if (!res.ok) return;

        setCurrentUserLabel(String(user.user_metadata?.name || user.email || ""));
        setCurrentUserEmail(String(user.email || ""));

        const own = (data.members || []).find((m: any) => m.user_id === user.id);
        if (own) {
          setMemberRole(String(own.role || ""));
          setMemberPermissions(own.permissions || null);
        }
      } catch {
        // si falla, no restringimos la sidebar (el backend igual aplica el enforcement real)
      } finally {
        setMemberLoaded(true);
      }
    }

    loadOwnMembership();
  }, [tenantId]);

  const isOwnerOrAdmin = !memberLoaded || memberRole === "owner" || memberRole === "admin";

  function getModuleAccess(href: string): boolean | "view" | "edit" {
    const moduleKey = NAV_MODULE_MAP[href];
    if (!moduleKey) return "edit";
    if (!memberPermissions) return "edit";
    const value = memberPermissions[moduleKey];
    if (value === undefined || value === null) return "edit";
    return value;
  }

  const visibleNavSections = useMemo(() => {
    return navSections
      .map((section) => ({
        ...section,
        items: section.items
          .filter((item) => {
            if (item.href === "/billing") return isOwnerOrAdmin;
            if (item.label === "Métricas" || item.label === "Reportes") return isOwnerOrAdmin;
            if (isOwnerOrAdmin) return true;
            return getModuleAccess(item.href) !== false;
          })
          .map((item) => ({
            ...item,
            readOnly: !isOwnerOrAdmin && getModuleAccess(item.href) === "view",
          })),
      }))
      .filter((section) => section.items.length > 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOwnerOrAdmin, memberPermissions]);

  useEffect(() => {
    if (!tenantId) return;
    apiFetch(`${BACKEND_URL}/support/tickets/unread-count?tenant_id=${tenantId}`)
      .then((res) => res.json())
      .then((data) => setUnreadTickets(data.count ?? 0))
      .catch(() => {});
  }, [tenantId]);

  useEffect(() => {
    if (!tenantId) return;

    const supabase = createClient();
    const channel = supabase
      .channel(`appointments-notify-${tenantId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "appointments",
          filter: `tenant_id=eq.${tenantId}`,
        },
        (payload) => {
          const row = payload.new as Record<string, any>;
          if (row.status !== "booked") return;

          const now = Date.now();
          const event: NotificationEvent = {
            id: `${row.id}-insert-${now}`,
            type: "new_booking",
            customerName: row.customer_name || "Cliente",
            serviceName: row.service_name_snapshot || "Servicio",
            startAt: row.start_at,
            read: false,
            createdAt: now,
          };

          setNotifications((prev) => [event, ...prev].slice(0, 50));
          setToasts((prev) => [...prev, event]);
          setTimeout(() => {
            setToasts((prev) => prev.filter((t) => t.id !== event.id));
          }, 15000);
          window.dispatchEvent(
            new CustomEvent("orbyx-appointment-new", { detail: row })
          );
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "appointments",
          filter: `tenant_id=eq.${tenantId}`,
        },
        (payload) => {
          const row = payload.new as Record<string, any>;
          const prevRow = payload.old as Record<string, any>;

          if (row.status === "canceled" && prevRow.status !== "canceled") {
            const now = Date.now();
            const event: NotificationEvent = {
              id: `${row.id}-canceled-${now}`,
              type: "canceled",
              customerName: row.customer_name || "Cliente",
              serviceName: row.service_name_snapshot || "Servicio",
              startAt: row.start_at,
              read: false,
              createdAt: now,
            };
            setNotifications((prev) => [event, ...prev].slice(0, 50));
            window.dispatchEvent(
              new CustomEvent("orbyx-appointment-canceled", {
                detail: { id: row.id },
              })
            );
            return;
          }

          if (prevRow.notes !== undefined && row.notes !== prevRow.notes) {
            const now = Date.now();
            const event: NotificationEvent = {
              id: `${row.id}-comment-${now}`,
              type: "comment",
              customerName: row.customer_name || "Cliente",
              serviceName: row.service_name_snapshot || "Servicio",
              startAt: row.start_at,
              read: false,
              createdAt: now,
            };
            setNotifications((prev) => [event, ...prev].slice(0, 50));
          }
        }
      )
      .subscribe((status) => console.log("[REALTIME]", status));

    return () => {
      supabase.removeChannel(channel);
    };
  }, [tenantId]);

  const groupedNotifications = useMemo(() => {
    const todayKey = getSantiagoDayKey(Date.now());
    const groups: { key: string; label: string; items: NotificationEvent[] }[] = [];

    for (const n of notifications) {
      const key = getSantiagoDayKey(n.createdAt);
      let group = groups.find((g) => g.key === key);
      if (!group) {
        group = {
          key,
          label: key === todayKey ? "Hoy" : formatNotifGroupDate(n.createdAt),
          items: [],
        };
        groups.push(group);
      }
      group.items.push(n);
    }

    return groups;
  }, [notifications]);

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
  const dropdownBg = isNocturno ? "rgb(15,23,42)" : "rgb(236,244,255)";
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
        {visibleNavSections.map((section) => (
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
                  <div key={`${section.title}-${item.label}`} className="relative">
                  {item.label === "Soporte" && unreadTickets > 0 && (
                    <span className="absolute top-1 right-2 z-10 bg-red-500 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center pointer-events-none">
                      {unreadTickets > 9 ? "9+" : unreadTickets}
                    </span>
                  )}
                  <Link
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
                      {!collapsed ? (
                        <span className="truncate flex items-center gap-1.5">
                          {item.href === "/customers" && isPacientes ? "Pacientes" : item.label}
                          {item.readOnly ? (
                            <span title="Solo lectura" style={{ display: "inline-flex", flexShrink: 0 }}>
                              <Eye size={12} style={{ opacity: 0.6 }} />
                            </span>
                          ) : null}
                        </span>
                      ) : null}
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
                  </div>
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

        @keyframes orbyxToastIn {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
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
                <img
                  src={isNocturno ? "/orbyx-mark-dark.png" : "/orbyx-mark.png"}
                  alt="Orbyx"
                  className="h-10 w-10 shrink-0"
                />
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
                  <div ref={branchDropdownRef} className="relative">
                    {/* Dropdown — abre hacia arriba */}
                    {branchDropdownOpen && branches.length > 0 ? (
                      <div
                        className="absolute bottom-[calc(100%+6px)] left-0 right-0 z-50 overflow-hidden rounded-2xl border"
                        style={{
                          background: dropdownBg,
                          borderColor: sidebarBorder,
                          border: `0.5px solid ${sidebarBorder}`,
                          boxShadow: "0 -12px 40px -8px rgba(0,0,0,0.28), 0 -4px 16px -4px rgba(0,0,0,0.18)",
                          animation: "branchDropIn 150ms ease-out forwards",
                          zIndex: 200,
                        }}
                      >
                        <div className="px-3 pt-3 pb-1">
                          <p
                            className="text-[10px] font-semibold uppercase tracking-[0.18em]"
                            style={{ color: textMuted }}
                          >
                            Cambiar sucursal
                          </p>
                        </div>
                        <div className="py-1">
                          {branches.map((branch) => {
                            const isSelected = branch.id === selectedBranchId || (!selectedBranchId && branch.id === branches[0]?.id);
                            const subtitle = branch.address || branch.slug || "";
                            return (
                              <button
                                key={branch.id}
                                type="button"
                                onClick={() => {
                                  persistSelectedBranch(branch.id);
                                  setBranchDropdownOpen(false);
                                }}
                                className="flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors duration-150"
                                style={{
                                  background: isSelected ? "rgba(37,99,235,0.10)" : "transparent",
                                  cursor: "pointer",
                                }}
                                onMouseEnter={(e) => {
                                  if (!isSelected) (e.currentTarget as HTMLElement).style.background = "rgba(148,163,184,0.08)";
                                }}
                                onMouseLeave={(e) => {
                                  (e.currentTarget as HTMLElement).style.background = isSelected ? "rgba(37,99,235,0.10)" : "transparent";
                                }}
                              >
                                <span
                                  className="h-2 w-2 shrink-0 rounded-full"
                                  style={{
                                    background: isSelected ? "rgb(52 211 153)" : "transparent",
                                    border: isSelected ? "none" : `1.5px solid ${sidebarBorder}`,
                                    boxShadow: isSelected ? "0 0 8px rgba(52,211,153,0.7)" : "none",
                                  }}
                                />
                                <div className="min-w-0 flex-1">
                                  <p
                                    className="truncate text-sm font-semibold"
                                    style={{ color: isSelected ? textMain : textMain }}
                                  >
                                    {branch.name}
                                  </p>
                                  {subtitle ? (
                                    <p className="truncate text-[11px]" style={{ color: textMuted }}>
                                      {subtitle}
                                    </p>
                                  ) : null}
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ) : null}

                    {/* Selector — botón trigger */}
                    <button
                      type="button"
                      onClick={() => setBranchDropdownOpen((prev) => !prev)}
                      className="w-full rounded-2xl border px-3 py-2.5 text-left transition-colors duration-150"
                      style={{
                        background: branchDropdownOpen ? "rgba(37,99,235,0.08)" : softBg,
                        borderColor: branchDropdownOpen ? "rgba(37,99,235,0.40)" : sidebarBorder,
                        cursor: "pointer",
                      }}
                    >
                      <div className="flex items-center gap-2">
                        <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.75)]" />
                        <div className="min-w-0 flex-1">
                          <p className="text-[11px] font-medium" style={{ color: textMuted }}>
                            Sucursal activa
                          </p>
                          <p className="truncate text-sm font-semibold" style={{ color: textMain }}>
                            {selectedBranchName || branches[0]?.name || "Sin sucursal"}
                          </p>
                          <p className="truncate text-xs" style={{ color: textMuted }}>
                            {branches.find((b) => b.id === selectedBranchId)?.address ||
                              branches.find((b) => b.id === selectedBranchId)?.slug ||
                              "Casa Matriz"}
                          </p>
                        </div>
                        {branchDropdownOpen ? (
                          <ChevronUp className="ml-auto shrink-0" size={15} style={{ color: textMuted }} />
                        ) : (
                          <ChevronRight className="ml-auto shrink-0" size={15} style={{ color: textMuted }} />
                        )}
                      </div>
                    </button>

                    <style>{`
                      @keyframes branchDropIn {
                        from { opacity: 0; transform: translateY(4px); }
                        to   { opacity: 1; transform: translateY(0); }
                      }
                    `}</style>
                  </div>

                  <button
                    type="button"
                    onClick={handleLogout}
                    className="flex h-11 w-full items-center gap-3 rounded-xl border px-3 text-sm font-semibold transition-all duration-200 hover:!border-rose-400/40 hover:!bg-rose-500/10"
                    style={{
                      background: "transparent",
                      borderColor: "rgba(59,130,246,0)",
                      color: textMuted,
                    }}
                  >
                    <div
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
                      style={{
                        background: isNocturno
                          ? "rgba(15,23,42,0.36)"
                          : "rgba(220,232,255,0.62)",
                      }}
                    >
                      <LogOut size={17} />
                    </div>
                    <span>Cerrar sesión</span>
                  </button>
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
                  <button
                    type="button"
                    onClick={handleLogout}
                    title="Cerrar sesión"
                    className="flex h-11 w-11 items-center justify-center rounded-xl border transition-all duration-200 hover:!border-rose-400/40 hover:!bg-rose-500/10"
                    style={{
                      background: softBg,
                      borderColor: sidebarBorder,
                      color: textMuted,
                    }}
                  >
                    <LogOut size={18} />
                  </button>
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
                        <span>{item.href === "/customers" && isPacientes ? "Pacientes" : item.label}</span>
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
                  <img
                    src={isNocturno ? "/orbyx-mark-dark.png" : "/orbyx-mark.png"}
                    alt="Orbyx"
                    className="h-10 w-10 shrink-0"
                  />
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
                    {businessName || slug || "Gestión del negocio"}
                  </h2>
                  <span className="inline-flex h-8 items-center gap-2 rounded-full border px-3 text-xs font-semibold sm:text-sm" style={{ borderColor: "rgba(139,92,246,0.48)", background: "rgba(139,92,246,0.14)", color: "rgb(196 181 253)" }}>
                    <Crown size={15} />
                    Plan {planLabel}
                  </span>
                  {tenantId ? (
                    <AccountStatusWidget
                      tenantId={tenantId}
                      slug={slug}
                      isNocturno={isNocturno}
                      isOwnerOrAdmin={isOwnerOrAdmin}
                    />
                  ) : null}
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

                <div ref={notifPanelRef} className="relative">
                  <button
                    type="button"
                    aria-label="Notificaciones"
                    onClick={() => {
                      setNotifPanelOpen((prev) => !prev);
                      if (!notifPanelOpen) {
                        setNotifications((prev) =>
                          prev.map((n) => ({ ...n, read: true }))
                        );
                      }
                    }}
                    className="relative inline-flex h-11 w-11 items-center justify-center rounded-2xl border transition"
                    style={{
                      background: notifPanelOpen ? "rgba(37,99,235,0.08)" : softBg,
                      borderColor: notifPanelOpen
                        ? "rgba(37,99,235,0.40)"
                        : sidebarBorder,
                      color: textMain,
                    }}
                  >
                    <Bell size={18} />
                    {unreadNotifCount > 0 ? (
                      <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white">
                        {unreadNotifCount > 9 ? "9+" : unreadNotifCount}
                      </span>
                    ) : null}
                  </button>

                  {notifPanelOpen ? (
                    <div
                      className="absolute right-0 top-[calc(100%+8px)] z-50 w-80 overflow-hidden rounded-2xl border"
                      style={{
                        background: dropdownBg,
                        borderColor: sidebarBorder,
                        boxShadow:
                          "0 12px 40px -8px rgba(0,0,0,0.28), 0 4px 16px -4px rgba(0,0,0,0.18)",
                      }}
                    >
                      <div className="px-4 pb-2 pt-3">
                        <p
                          className="text-xs font-semibold uppercase tracking-[0.16em]"
                          style={{ color: textMuted }}
                        >
                          Notificaciones
                        </p>
                      </div>
                      <div className="max-h-80 overflow-y-auto">
                        {groupedNotifications.length === 0 ? (
                          <p
                            className="px-4 pb-4 text-sm"
                            style={{ color: textMuted }}
                          >
                            Sin notificaciones por ahora.
                          </p>
                        ) : (
                          groupedNotifications.map((group) => (
                            <div key={group.key}>
                              <p
                                className="px-4 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-[0.14em]"
                                style={{ color: textMuted, background: softBg }}
                              >
                                {group.label}
                              </p>
                              {group.items.map((n) => (
                                <div
                                  key={n.id}
                                  className="border-t px-4 py-3"
                                  style={{ borderColor: sidebarBorder }}
                                >
                                  <p
                                    className="text-sm font-semibold"
                                    style={{ color: textMain }}
                                  >
                                    {n.type === "new_booking"
                                      ? "Nueva reserva"
                                      : n.type === "canceled"
                                      ? "Cita cancelada"
                                      : "Nuevo comentario en reserva"}
                                  </p>
                                  <p
                                    className="mt-0.5 text-xs"
                                    style={{ color: textMuted }}
                                  >
                                    {n.customerName} · {n.serviceName} ·{" "}
                                    {formatNotifTime(n.startAt)}
                                  </p>
                                </div>
                              ))}
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  ) : null}
                </div>

                <div ref={userMenuRef} className="relative border-l pl-3" style={{ borderColor: sidebarBorder }}>
                  <button
                    type="button"
                    onClick={() => setUserMenuOpen((prev) => !prev)}
                    className="flex items-center gap-3 rounded-2xl px-1 py-1 text-left transition"
                    style={{ background: userMenuOpen ? softBg : "transparent" }}
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[linear-gradient(135deg,rgb(37,99,235),rgb(79,70,229))] text-xs font-bold text-white">
                      {currentUserLabel
                        ? currentUserLabel.slice(0, 2).toUpperCase()
                        : slug.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold" style={{ color: textMain }}>
                        {currentUserLabel || "Usuario"}
                      </p>
                      <p className="truncate text-xs" style={{ color: textMuted }}>
                        {ROLE_LABEL[memberRole] || (memberLoaded ? memberRole : "")}
                      </p>
                    </div>
                  </button>

                  {userMenuOpen ? (
                    <div
                      className="absolute right-0 top-[calc(100%+8px)] z-50 w-64 overflow-hidden rounded-2xl border"
                      style={{
                        background: dropdownBg,
                        borderColor: sidebarBorder,
                        boxShadow:
                          "0 12px 40px -8px rgba(0,0,0,0.28), 0 4px 16px -4px rgba(0,0,0,0.18)",
                      }}
                    >
                      <div className="border-b px-4 py-3" style={{ borderColor: sidebarBorder }}>
                        <p className="truncate text-sm font-semibold" style={{ color: textMain }}>
                          {currentUserLabel || "Usuario"}
                        </p>
                        <p className="truncate text-xs" style={{ color: textMuted }}>
                          {currentUserEmail || "—"}
                        </p>
                      </div>
                      {isOwnerOrAdmin ? (
                        <Link
                          href={`/dashboard/${slug}/configuracion`}
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-2.5 px-4 py-3 text-sm font-medium transition hover:bg-black/5"
                          style={{ color: textMain }}
                        >
                          <Settings size={16} />
                          Configuración
                        </Link>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          </header>

          <main className="flex-1">
            <div className="mx-auto w-full max-w-[1600px] px-3 py-4 sm:px-5 sm:py-6 lg:px-8 xl:px-10 2xl:px-12">
              {isAccountBlocked ? (
                <div
                  className="mx-auto mt-10 max-w-lg rounded-3xl border p-8 text-center"
                  style={{ borderColor: "rgba(244,63,94,0.4)", background: "rgba(244,63,94,0.08)" }}
                >
                  <h2 className="text-lg font-semibold" style={{ color: textMain }}>
                    Tu cuenta está en modo limitado
                  </h2>
                  <p className="mt-2 text-sm" style={{ color: textMuted }}>
                    {accountStatus?.blocked_reason === "trial_expired"
                      ? "Tu trial gratuito terminó y todavía no tienes un método de pago activo. Inscribe una tarjeta para recuperar el acceso completo al panel."
                      : "Tu suscripción no tiene un cobro válido. Inscribe una tarjeta para recuperar el acceso completo al panel."}
                  </p>
                  <Link
                    href={`/dashboard/${slug}/billing`}
                    className="mt-5 inline-flex h-11 items-center justify-center rounded-2xl px-5 text-sm font-semibold text-white"
                    style={{ background: "linear-gradient(135deg, rgb(37,99,235), rgb(14,165,233))" }}
                  >
                    Ir a Suscripción
                  </Link>
                </div>
              ) : (
                <PermissionsProvider
                  value={{
                    role: memberRole,
                    permissions: memberPermissions,
                    loaded: memberLoaded,
                    isOwnerOrAdmin,
                  }}
                >
                  {children}
                </PermissionsProvider>
              )}
            </div>
          </main>
        </div>
      </div>

      {mounted && typeof window !== "undefined" && toasts.length > 0
        ? createPortal(
            <div
              style={{
                position: "fixed",
                bottom: 24,
                right: 24,
                zIndex: 9999,
                display: "flex",
                flexDirection: "column",
                gap: 8,
              }}
            >
              {toasts.map((t) => (
                <div
                  key={t.id}
                  className="relative w-80 rounded-2xl border px-4 py-3 pr-8"
                  style={{
                    background: dropdownBg,
                    borderColor: sidebarBorder,
                    boxShadow: "0 12px 30px -10px rgba(0,0,0,0.35)",
                    animation: "orbyxToastIn 200ms ease-out",
                  }}
                >
                  <button
                    type="button"
                    aria-label="Cerrar notificación"
                    onClick={() =>
                      setToasts((prev) =>
                        prev.filter((toast) => toast.id !== t.id)
                      )
                    }
                    className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full text-xs leading-none transition"
                    style={{ color: textMuted }}
                  >
                    ×
                  </button>
                  <p
                    className="text-sm font-semibold"
                    style={{ color: textMain }}
                  >
                    Nueva reserva
                  </p>
                  <p className="mt-0.5 text-xs" style={{ color: textMuted }}>
                    {t.customerName} · {t.serviceName} ·{" "}
                    {formatNotifTime(t.startAt)}
                  </p>
                </div>
              ))}
            </div>,
            document.body
          )
        : null}
    </div>
  );
}
