"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

type Appointment = {
  id: string;
  start_at: string;
  end_at: string;
  customer_name: string;
  service_name_snapshot: string | null;
};

export default function AgendaPage() {
  const params = useParams();
  const slug =
    ((params as any)?.slug as string) || ((params as any)?.Slug as string);

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const today = new Date().toISOString().split("T")[0];

  async function loadAppointments() {
    try {
      setLoading(true);
      setError("");

      const res = await fetch(
        `https://orbyx-backend.onrender.com/appointments/by-day/${slug}/${today}`
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "No se pudo cargar la agenda");
      }

      setAppointments(data.appointments || []);
    } catch (err: any) {
      setError(err?.message || "Error cargando agenda");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (slug) {
      loadAppointments();
    }
  }, [slug]);

  function formatTime(date: string) {
    return new Date(date).toLocaleTimeString("es-CL", {
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  return (
    <div className="space-y-8">
      <div>
        <p className="text-sm text-slate-500">Dashboard / Agenda</p>
        <h1 className="mt-1 text-3xl font-semibold text-slate-900">
          Agenda del día
        </h1>
        <p className="mt-2 text-slate-600">
          Aquí puedes revisar las reservas activas de hoy para tu negocio.
        </p>
      </div>

      {error ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      ) : null}

      {loading ? (
        <p className="text-sm text-slate-500">Cargando agenda...</p>
      ) : appointments.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-sm text-slate-500">
          No hay reservas para hoy.
        </div>
      ) : (
        <div className="space-y-3">
          {appointments.map((appt) => (
            <div
              key={appt.id}
              className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
            >
              <div className="flex items-center gap-4">
                <div className="text-sm font-medium text-slate-700">
                  {formatTime(appt.start_at)}
                </div>

                <div>
                  <p className="font-medium text-slate-900">
                    {appt.customer_name}
                  </p>
                  <p className="text-sm text-slate-600">
                    {appt.service_name_snapshot || "Reserva"}
                  </p>
                </div>
              </div>

              <span className="rounded-full bg-sky-100 px-3 py-1 text-xs font-medium text-sky-700">
                Reservado
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}