"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";

type BusinessResponse = {
  business: {
    id: string;
    name: string;
    slug: string;
  };
  calendar_id: string;
};

export default function DashboardPage() {
  const params = useParams();
  const slug =
    ((params as any)?.slug as string) || ((params as any)?.Slug as string);

  const [calendarId, setCalendarId] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const publicUrl = useMemo(() => `https://orbyx.cl/${slug}`, [slug]);

  useEffect(() => {
    async function loadBusiness() {
      try {
        setLoading(true);
        setLoadError("");

        const res = await fetch(
          `https://orbyx-backend.onrender.com/public/business/${slug}`
        );

        const data: BusinessResponse | { error?: string } = await res.json();

        if (!res.ok) {
          throw new Error(
            "error" in data && data.error
              ? data.error
              : "No se pudo cargar el negocio"
          );
        }

        if (!("business" in data) || !data.calendar_id) {
          throw new Error("Respuesta inválida del backend");
        }

        setBusinessName(data.business.name || slug);
        setCalendarId(data.calendar_id);
      } catch (error: any) {
        setLoadError(error?.message || "No se pudo cargar el dashboard");
      } finally {
        setLoading(false);
      }
    }

    if (slug) {
      loadBusiness();
    }
  }, [slug]);

  function handleConnectGoogle() {
    if (!calendarId) return;

    window.location.href = `https://orbyx-backend.onrender.com/auth?calendar_id=${calendarId}`;
  }

  return (
    <div className="min-h-screen bg-slate-50 px-6 py-10">
      <div className="mx-auto max-w-3xl rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="mb-2 text-2xl font-semibold text-slate-800">
          Panel de tu negocio
        </h1>

        <p className="mb-8 text-slate-500">
          Tu negocio ya está configurado. Solo falta conectar tu Google Calendar
          para comenzar a recibir reservas.
        </p>

        {loadError ? (
          <div className="mb-6 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {loadError}
          </div>
        ) : null}

        <div className="space-y-4">
          <div className="rounded-xl border border-slate-200 p-4">
            <p className="text-sm text-slate-500">Negocio</p>
            <p className="font-medium text-slate-800">
              {loading ? "Cargando..." : businessName || slug}
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 p-4">
            <p className="text-sm text-slate-500">Estado Google Calendar</p>
            <p className="font-medium text-amber-600">No conectado</p>
          </div>

          <div className="pt-4 flex gap-3">
            <a
              href={publicUrl}
              target="_blank"
              className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
            >
              Ver página pública
            </a>

            <button
              onClick={handleConnectGoogle}
              disabled={loading || !calendarId}
              className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Conectar Google Calendar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}