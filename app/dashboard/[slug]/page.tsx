"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { PageHeader } from "@/components/dashboard/page-header";
import { Panel } from "@/components/dashboard/panel";
import { StatCard } from "@/components/dashboard/stat-card";

type BusinessResponse = {
  business: {
    id: string;
    name: string;
    slug: string;
  };
  calendar_id: string;
  google_connected?: boolean;
};

export default function DashboardPage() {
  const params = useParams();
  const searchParams = useSearchParams();

  const slug =
    ((params as any)?.slug as string) || ((params as any)?.Slug as string);

  const googleConnectedFromUrl = searchParams.get("google_connected") === "1";

  const [calendarId, setCalendarId] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [googleConnected, setGoogleConnected] = useState(false);
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
        setGoogleConnected(
          Boolean(data.google_connected) || googleConnectedFromUrl
        );
      } catch (error: any) {
        setLoadError(error?.message || "No se pudo cargar el dashboard");
      } finally {
        setLoading(false);
      }
    }

    if (slug) {
      loadBusiness();
    }
  }, [slug, googleConnectedFromUrl]);

  function handleConnectGoogle() {
    if (!calendarId) return;

    window.location.href = `https://orbyx-backend.onrender.com/auth?calendar_id=${calendarId}`;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Resumen"
        title={loading ? "Cargando negocio..." : businessName || "Panel principal"}
        description="Administra tu negocio, revisa el estado de tu agenda y accede a la página pública de reservas."
        actions={
          <div className="flex flex-wrap gap-3">
            <a
              href={publicUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-11 items-center justify-center rounded-2xl border border-slate-200 bg-white px-5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              Ver página pública
            </a>

            {!googleConnected ? (
              <button
                onClick={handleConnectGoogle}
                disabled={loading || !calendarId}
                className="inline-flex h-11 items-center justify-center rounded-2xl bg-slate-900 px-5 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Conectar Google Calendar
              </button>
            ) : null}
          </div>
        }
      />

      {googleConnectedFromUrl ? (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 shadow-sm">
          Google Calendar conectado correctamente. Tu agenda ya puede recibir
          reservas.
        </div>
      ) : null}

      {loadError ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 shadow-sm">
          {loadError}
        </div>
      ) : null}

      {!googleConnected && !loadError ? (
        <div className="rounded-2xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-800 shadow-sm">
          Si Google muestra un aviso de seguridad, presiona Configuración
          avanzada → Ir a Orbyx para continuar.
        </div>
      ) : null}

      <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <StatCard
          label="Negocio"
          value={loading ? "Cargando..." : businessName || slug || "-"}
          helper="Nombre visible de tu negocio."
        />
        <StatCard
          label="Google Calendar"
          value={
            loading ? "Cargando..." : googleConnected ? "Conectado" : "Pendiente"
          }
          helper={
            googleConnected
              ? "Tu agenda ya puede sincronizar reservas."
              : "Aún falta conectar tu calendario."
          }
        />
        <StatCard
          label="Página pública"
          value={slug ? "Activa" : "-"}
          helper="Tus clientes podrán reservar desde tu enlace."
        />
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <Panel
          title="Estado general"
          description="Resumen principal de la configuración actual de tu negocio."
          className="xl:col-span-2"
        >
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                Negocio
              </p>
              <p className="mt-2 text-base font-semibold text-slate-900">
                {loading ? "Cargando..." : businessName || slug}
              </p>
              <p className="mt-1 text-sm text-slate-500">
                Identificador público: {slug || "-"}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                Estado de integración
              </p>
              <p
                className={`mt-2 text-base font-semibold ${
                  googleConnected ? "text-emerald-600" : "text-amber-600"
                }`}
              >
                {loading
                  ? "Cargando..."
                  : googleConnected
                  ? "Google Calendar conectado"
                  : "Google Calendar no conectado"}
              </p>
              <p className="mt-1 text-sm text-slate-500">
                {googleConnected
                  ? "La agenda está lista para operar con reservas."
                  : "Conéctalo para sincronizar disponibilidad y reservas."}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:col-span-2">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                URL pública
              </p>
              <p className="mt-2 break-all text-sm font-medium text-slate-900">
                {publicUrl}
              </p>
              <p className="mt-1 text-sm text-slate-500">
                Este es el enlace donde tus clientes podrán reservar.
              </p>
            </div>
          </div>
        </Panel>

        <Panel
          title="Acciones rápidas"
          description="Atajos útiles para administrar tu negocio."
        >
          <div className="space-y-3">
            <a
              href={publicUrl}
              target="_blank"
              rel="noreferrer"
              className="block rounded-2xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              Abrir página pública
            </a>

            {!googleConnected ? (
              <button
                onClick={handleConnectGoogle}
                disabled={loading || !calendarId}
                className="block w-full rounded-2xl bg-slate-900 px-4 py-3 text-left text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Conectar Google Calendar
              </button>
            ) : (
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
                Google Calendar ya está conectado.
              </div>
            )}
          </div>
        </Panel>
      </section>
    </div>
  );
}