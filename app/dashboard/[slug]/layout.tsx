"use client";

import Link from "next/link";
import { useParams } from "next/navigation";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const params = useParams();
  const slug =
    ((params as any)?.slug as string) || ((params as any)?.Slug as string);

  return (
    <div className="flex min-h-screen bg-slate-50">
      
      {/* SIDEBAR */}
      <aside className="w-64 border-r border-slate-200 bg-white p-6">
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-slate-800">Orbyx</h2>
          <p className="text-sm text-slate-500">Panel de negocio</p>
        </div>

        <nav className="space-y-2">

          <Link
            href={`/dashboard/${slug}`}
            className="block rounded-lg px-3 py-2 text-sm text-slate-700 hover:bg-slate-100"
          >
            Panel
          </Link>

          <Link
            href={`/dashboard/${slug}/services`}
            className="block rounded-lg px-3 py-2 text-sm text-slate-700 hover:bg-slate-100"
          >
            Servicios
          </Link>

          <Link
            href={`/dashboard/${slug}/business`}
            className="block rounded-lg px-3 py-2 text-sm text-slate-700 hover:bg-slate-100"
          >
            Datos del negocio
          </Link>

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

      {/* CONTENIDO */}
      <main className="flex-1 p-10">{children}</main>
    </div>
  );
}