"use client";

import { useParams } from "next/navigation";

export default function DashboardPage() {
  const params = useParams();
  const slug =
    ((params as any)?.slug as string) || ((params as any)?.Slug as string);

  const publicUrl = `https://orbyx.cl/${slug}`;

  return (
    <div className="min-h-screen bg-slate-50 px-6 py-10">
      <div className="mx-auto max-w-3xl rounded-2xl bg-white p-8 shadow-sm border border-slate-200">
        
        <h1 className="text-2xl font-semibold text-slate-800 mb-2">
          Panel de tu negocio
        </h1>

        <p className="text-slate-500 mb-8">
          Tu negocio ya está configurado. Solo falta conectar tu Google Calendar
          para comenzar a recibir reservas.
        </p>

        <div className="space-y-4">

          <div className="rounded-xl border border-slate-200 p-4">
            <p className="text-sm text-slate-500">Negocio</p>
            <p className="font-medium text-slate-800">{slug}</p>
          </div>

          <div className="rounded-xl border border-slate-200 p-4">
            <p className="text-sm text-slate-500">Estado Google Calendar</p>
            <p className="font-medium text-amber-600">
              No conectado
            </p>
          </div>

          <div className="flex gap-3 pt-4">

            <a
              href={publicUrl}
              target="_blank"
              className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
            >
              Ver página pública
            </a>

            <button
              className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700"
              onClick={() =>
                alert(
                  "Aquí conectaremos Google Calendar en el siguiente paso."
                )
              }
            >
              Conectar Google Calendar
            </button>

          </div>

        </div>
      </div>
    </div>
  );
}