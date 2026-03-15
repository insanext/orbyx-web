"use client";

import Link from "next/link";
import { useParams, usePathname } from "next/navigation";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const params = useParams();
  const pathname = usePathname();

  const slug =
    ((params as any)?.slug as string) || ((params as any)?.Slug as string);

  const links = [
    {
      href: `/dashboard/${slug}`,
      label: "Panel",
    },
    {
      href: `/dashboard/${slug}/agenda`,
      label: "Agenda",
    },
    {
      href: `/dashboard/${slug}/services`,
      label: "Servicios",
    },
    {
      href: `/dashboard/${slug}/business`,
      label: "Datos del negocio",
    },
  ];

  return (
    <div className="flex min-h-screen bg-slate-50">
      <aside className="w-64 border-r border-slate-200 bg-white p-6">
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-slate-800">Orbyx</h2>
          <p className="text-sm text-slate-500">Panel de negocio</p>
        </div>

        <nav className="space-y-2">
          {links.map((link) => {
            const isActive = pathname === link.href;

            return (
              <Link
                key={link.href}
                href={link.href}
                className={`block rounded-lg px-3 py-2 text-sm transition ${
                  isActive
                    ? "bg-slate-900 text-white"
                    : "text-slate-700 hover:bg-slate-100"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="mt-10 border-t pt-6">
          <Link
            href={`https://orbyx.cl/${slug}`}
            target="_blank"
            className="text-sm text-slate-600 hover:underline"
          >
            Ver página pública
          </Link>
        </div>
      </aside>

      <main className="flex-1 p-10">{children}</main>
    </div>
  );
}