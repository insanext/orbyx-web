"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";

type Appointment = {
  id: string;
  start_at: string;
  end_at: string;
  customer_name: string;
  customer_phone: string | null;
  customer_email: string | null;
  service_name_snapshot: string | null;
  status: string;
};

export default function AgendaPage() {
  const params = useParams();
  const slug =
    ((params as any)?.slug as string) || ((params as any)?.Slug as string);

  const [weekBaseDate, setWeekBaseDate] = useState(new Date());
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedAppointment, setSelectedAppointment] =
    useState<Appointment | null>(null);

  function startOfWeek(date: Date) {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    d.setDate(diff);
    d.setHours(0, 0, 0, 0);
    return d;
  }

  function addDays(date: Date, days: number) {
    const d = new Date(date);
    d.setDate(d.getDate() + days);
    return d;
  }

  function formatDateYYYYMMDD(date: Date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }

  function formatHour(dateString: string) {
    return new Date(dateString).toLocaleTimeString("es-CL", {
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  function formatLongDate(dateString: string) {
    return new Date(dateString).toLocaleDateString("es-CL", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  }

  function formatRangeTitle(start: Date, end: Date) {
    const startText = start.toLocaleDateString("es-CL", {
      day: "numeric",
      month: "long",
    });

    const endText = end.toLocaleDateString("es-CL", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });

    return `${startText} – ${endText}`;
  }

  const weekStart = useMemo(() => startOfWeek(weekBaseDate), [weekBaseDate]);
  const weekDays = useMemo(
    () => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)),
    [weekStart]
  );
  const weekEnd = weekDays[6];

  async function loadAppointments() {
    try {
      setLoading(true);
      setError("");

      const from = formatDateYYYYMMDD(weekStart);
      const to = formatDateYYYYMMDD(weekEnd);

      const res = await fetch(
        `https://orbyx-backend.onrender.com/appointments/by-range/${slug}?from=${from}&to=${to}`
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
  }, [slug, weekStart.getTime()]);

  const appointmentsByDay = useMemo(() => {
    const result: Record<string, Appointment[]> = {};

    for (const day of weekDays) {
      result[formatDateYYYYMMDD(day)] = [];
    }

    for (const appt of appointments) {
      const key = formatDateYYYYMMDD(new Date(appt.start_at));
      if (!result[key]) result[key] = [];
      result[key].push(appt);
    }

    for (const key of Object.keys(result)) {
      result[key].sort(
        (a, b) =>
          new Date(a.start_at).getTime() - new Date(b.start_at).getTime()
      );
    }

    return result;
  }, [appointments, weekDays]);

  function goPrevWeek() {
    setWeekBaseDate((prev) => addDays(prev, -7));
    setSelectedAppointment(null);
  }

  function goNextWeek() {
    setWeekBaseDate((prev) => addDays(prev, 7));
    setSelectedAppointment(null);
  }

  function goToday() {
    setWeekBaseDate(new Date());
    setSelectedAppointment(null);
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <p className="text-sm text-slate-500">Dashboard / Agenda</p>
          <h1 className="mt-1 text-3xl font-semibold text-slate-900">
            Agenda semanal
          </h1>
          <p className="mt-2 text-slate-600">
            Revisa tus reservas por semana y haz clic en una cita para ver sus
            detalles.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <button
            type="button"
            onClick={goPrevWeek}
            className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            ← Semana anterior
          </button>

          <div className="rounded-xl bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700">
            {formatRangeTitle(weekStart, weekEnd)}
          </div>

          <button
            type="button"
            onClick={goNextWeek}
            className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Semana siguiente →
          </button>

          <button
            type="button"
            onClick={goToday}
            className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700"
          >
            Hoy
          </button>

          <input
            type="date"
            value={formatDateYYYYMMDD(weekBaseDate)}
            onChange={(e) => {
              if (!e.target.value) return;
              setWeekBaseDate(new Date(`${e.target.value}T12:00:00`));
              setSelectedAppointment(null);
            }}
            className="rounded-xl border border-slate-300 px-4 py-2 text-sm text-slate-700 outline-none focus:border-sky-500 focus:ring-4 focus:ring-sky-100"
          />
        </div>
      </div>

      {error ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[1.35fr_0.65fr]">
        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          {loading ? (
            <p className="px-2 py-4 text-sm text-slate-500">Cargando agenda...</p>
          ) : (
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-7">
              {weekDays.map((day) => {
                const dayKey = formatDateYYYYMMDD(day);
                const dayAppointments = appointmentsByDay[dayKey] || [];

                return (
                  <div
                    key={dayKey}
                    className="rounded-2xl border border-slate-200 bg-slate-50 p-3"
                  >
                    <div className="mb-3 border-b border-slate-200 pb-3">
                      <div className="text-sm font-semibold capitalize text-slate-800">
                        {day.toLocaleDateString("es-CL", {
                          weekday: "long",
                        })}
                      </div>
                      <div className="text-xs text-slate-500">
                        {day.toLocaleDateString("es-CL", {
                          day: "2-digit",
                          month: "2-digit",
                        })}
                      </div>
                    </div>

                    <div className="space-y-2">
                      {dayAppointments.length === 0 ? (
                        <div className="rounded-xl border border-dashed border-slate-300 bg-white px-3 py-4 text-center text-xs text-slate-400">
                          Sin reservas
                        </div>
                      ) : (
                        dayAppointments.map((appt) => (
                          <button
                            key={appt.id}
                            type="button"
                            onClick={() => setSelectedAppointment(appt)}
                            className={`w-full rounded-xl border p-3 text-left transition ${
                              selectedAppointment?.id === appt.id
                                ? "border-sky-500 bg-sky-50"
                                : "border-slate-200 bg-white hover:border-sky-300 hover:bg-sky-50"
                            }`}
                          >
                            <div className="text-xs font-semibold text-sky-700">
                              {formatHour(appt.start_at)} - {formatHour(appt.end_at)}
                            </div>

                            <p className="mt-1 text-sm font-medium text-slate-900">
                              {appt.customer_name}
                            </p>

                            <p className="mt-1 text-xs text-slate-600">
                              {appt.service_name_snapshot || "Reserva"}
                            </p>
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        <aside className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">
            Detalle de reserva
          </h2>

          {!selectedAppointment ? (
            <div className="mt-4 rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-sm text-slate-500">
              Haz clic en una reserva para ver los datos del cliente.
            </div>
          ) : (
            <div className="mt-5 space-y-4">
              <div className="rounded-2xl border border-sky-100 bg-sky-50 p-4">
                <p className="text-sm font-semibold text-sky-800">
                  {selectedAppointment.service_name_snapshot || "Reserva"}
                </p>
                <p className="mt-1 text-sm text-slate-700">
                  {formatLongDate(selectedAppointment.start_at)}
                </p>
                <p className="mt-1 text-sm text-slate-700">
                  {formatHour(selectedAppointment.start_at)} -{" "}
                  {formatHour(selectedAppointment.end_at)}
                </p>
              </div>

              <div className="space-y-3 text-sm">
                <div>
                  <p className="text-slate-500">Cliente</p>
                  <p className="font-medium text-slate-900">
                    {selectedAppointment.customer_name}
                  </p>
                </div>

                <div>
                  <p className="text-slate-500">Teléfono</p>
                  <p className="font-medium text-slate-900">
                    {selectedAppointment.customer_phone || "No disponible"}
                  </p>
                </div>

                <div>
                  <p className="text-slate-500">Email</p>
                  <p className="font-medium text-slate-900 break-all">
                    {selectedAppointment.customer_email || "No disponible"}
                  </p>
                </div>

                <div>
                  <p className="text-slate-500">Estado</p>
                  <p className="font-medium text-emerald-700">Reservado</p>
                </div>
              </div>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}