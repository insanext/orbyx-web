"use client";

import Link from "next/link";
import { usePathname, useParams } from "next/navigation";
import {
  CalendarDays,
  LayoutDashboard,
  Briefcase,
  Scissors,
  Users,
  ChevronRight,
} from "lucide-react";
import clsx from "clsx";

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

  function isItemActive(fullHref: string) {
    if (fullHref === `/dashboard/${slug}`) {
      return pathname === fullHref;
    }

    return pathname === fullHref || pathname.startsWith(`${fullHref}/`);
  }

  return (
    <div className="min-h-screen bg-slate-100/70">
      <div className="flex min-h-screen">
        {/* Sidebar */}
        <aside className="hidden w-72 border-r border-slate-200 bg-white xl:block">
          <div className="flex h-full flex-col">
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
                  Administra tu agenda, staff, servicios y datos del negocio.
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
            <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
              {children}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}