"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { PageHeader } from "../../../components/dashboard/page-header";
import { Panel } from "../../../components/dashboard/panel";
import { StatCard } from "../../../components/dashboard/stat-card";

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

  const todayKey = formatDateYYYYMMDD(new Date());
  const appointmentsToday = appointmentsByDay[todayKey] || [];

  const nextAppointment = useMemo(() => {
    const now = Date.now();

    return appointments
      .filter((appt) => new Date(appt.start_at).getTime() >= now)
      .sort(
        (a, b) =>
          new Date(a.start_at).getTime() - new Date(b.start_at).getTime()
      )[0];
  }, [appointments]);

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
    <div className="space-y-6">
      <PageHeader
        eyebrow="Agenda"
        title="Agenda semanal"
        description="Revisa tus reservas por semana y haz clic en una cita para ver sus detalles."
        actions={
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={goPrevWeek}
              className="inline-flex h-11 items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              ← Semana anterior
            </button>

            <div className="inline-flex h-11 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-medium text-slate-700">
              {formatRangeTitle(weekStart, weekEnd)}
            </div>

            <button
              type="button"
              onClick={goNextWeek}
              className="inline-flex h-11 items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              Semana siguiente →
            </button>

            <button
              type="button"
              onClick={goToday}
              className="inline-flex h-11 items-center justify-center rounded-2xl bg-slate-900 px-4 text-sm font-medium text-white transition hover:bg-slate-800"
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
              className="h-11 rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-700 outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-200/60"
            />
          </div>
        }
      />

      {error ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 shadow-sm">
          {error}
        </div>
      ) : null}

      <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <StatCard
          label="Reservas hoy"
          value={loading ? "..." : String(appointmentsToday.length)}
          helper="Citas registradas para el día actual."
        />
        <StatCard
          label="Próxima reserva"
          value={loading ? "..." : nextAppointment ? formatHour(nextAppointment.start_at) : "--"}
          helper={
            loading
              ? "Cargando próxima cita."
              : nextAppointment
              ? nextAppointment.customer_name
              : "No hay próximas reservas."
          }
        />
        <StatCard
          label="Reservas semana"
          value={loading ? "..." : String(appointments.length)}
          helper="Total de reservas visibles en esta semana."
        />
      </section>

      <div className="grid gap-6 xl:grid-cols-[1.35fr_0.65fr]">
        <Panel
          title="Calendario semanal"
          description="Vista semanal de reservas y disponibilidad del negocio."
        >
          {loading ? (
            <p className="px-2 py-4 text-sm text-slate-500">Cargando agenda...</p>
          ) : (
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-7">
              {weekDays.map((day) => {
                const dayKey = formatDateYYYYMMDD(day);
                const dayAppointments = appointmentsByDay[dayKey] || [];
                const isToday = dayKey === todayKey;

                return (
                  <div
                    key={dayKey}
                    className="rounded-2xl border border-slate-200 bg-slate-50 p-3"
                  >
                    <div className="mb-3 border-b border-slate-200 pb-3">
                      <div className="flex items-center justify-between gap-2">
                        <div className="text-sm font-semibold capitalize text-slate-800">
                          {day.toLocaleDateString("es-CL", {
                            weekday: "long",
                          })}
                        </div>

                        {isToday ? (
                          <span className="rounded-full bg-slate-900 px-2.5 py-1 text-[11px] font-semibold text-white">
                            Hoy
                          </span>
                        ) : null}
                      </div>

                      <div className="mt-1 text-xs text-slate-500">
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
                            className={`w-full rounded-2xl border p-3 text-left transition ${
                              selectedAppointment?.id === appt.id
                                ? "border-slate-900 bg-slate-900 text-white shadow-sm"
                                : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
                            }`}
                          >
                            <div
                              className={`text-xs font-semibold ${
                                selectedAppointment?.id === appt.id
                                  ? "text-slate-200"
                                  : "text-slate-600"
                              }`}
                            >
                              {formatHour(appt.start_at)} - {formatHour(appt.end_at)}
                            </div>

                            <p
                              className={`mt-1 text-sm font-semibold ${
                                selectedAppointment?.id === appt.id
                                  ? "text-white"
                                  : "text-slate-900"
                              }`}
                            >
                              {appt.customer_name}
                            </p>

                            <p
                              className={`mt-1 text-xs ${
                                selectedAppointment?.id === appt.id
                                  ? "text-slate-300"
                                  : "text-slate-500"
                              }`}
                            >
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
        </Panel>

        <Panel
          title="Detalle de reserva"
          description="Información del cliente y de la cita seleccionada."
        >
          {!selectedAppointment ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-sm text-slate-500">
              Haz clic en una reserva para ver los datos del cliente.
            </div>
          ) : (
            <div className="space-y-4">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm font-semibold text-slate-900">
                  {selectedAppointment.service_name_snapshot || "Reserva"}
                </p>
                <p className="mt-1 text-sm capitalize text-slate-600">
                  {formatLongDate(selectedAppointment.start_at)}
                </p>
                <p className="mt-1 text-sm text-slate-600">
                  {formatHour(selectedAppointment.start_at)} -{" "}
                  {formatHour(selectedAppointment.end_at)}
                </p>
              </div>

              <div className="space-y-3">
                <div className="rounded-2xl border border-slate-200 bg-white p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                    Cliente
                  </p>
                  <p className="mt-2 text-sm font-semibold text-slate-900">
                    {selectedAppointment.customer_name}
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                    Teléfono
                  </p>
                  <p className="mt-2 text-sm font-semibold text-slate-900">
                    {selectedAppointment.customer_phone || "No disponible"}
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                    Email
                  </p>
                  <p className="mt-2 break-all text-sm font-semibold text-slate-900">
                    {selectedAppointment.customer_email || "No disponible"}
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                    Estado
                  </p>
                  <p className="mt-2 text-sm font-semibold text-emerald-600">
                    {selectedAppointment.status || "Reservado"}
                  </p>
                </div>
              </div>
            </div>
          )}
        </Panel>
      </div>
    </div>
  );
}