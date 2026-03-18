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
  google_connected?: boolean;
};

type AppointmentItem = {
  id: string;
  calendar_id?: string;
  tenant_id?: string;
  service_id?: string | null;
  service_name?: string | null;
  staff_id?: string | null;
  staff_name?: string | null;
  customer_name?: string | null;
  customer_phone?: string | null;
  customer_email?: string | null;
  date?: string | null;
  start?: string | null;
  end?: string | null;
  starts_at?: string | null;
  ends_at?: string | null;
  slot_start?: string | null;
  slot_end?: string | null;
  notes?: string | null;
  source?: string | null;
  status: "booked" | "completed" | "no_show" | string;
  created_at?: string;
  updated_at?: string;
};

const BACKEND_URL = "https://orbyx-api.onrender.com";

const weekDays = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

function toYmd(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function startOfWeek(date: Date) {
  const d = new Date(date);
  const day = d.getDay();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - day);
  return d;
}

function addDays(date: Date, days: number) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function formatDateLong(date: Date) {
  return date.toLocaleDateString("es-CL", {
    weekday: "long",
    day: "2-digit",
    month: "2-digit",
  });
}

function formatHour(dateString?: string | null) {
  if (!dateString) return "--:--";
  const d = new Date(dateString);
  if (Number.isNaN(d.getTime())) return "--:--";

  return d.toLocaleTimeString("es-CL", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

function normalizeAppointmentStart(appt: AppointmentItem) {
  if (appt.starts_at) return appt.starts_at;

  if (appt.date && appt.slot_start) {
    return `${appt.date}T${appt.slot_start}:00-03:00`;
  }

  if (appt.start) return appt.start;

  return null;
}

function normalizeAppointmentEnd(appt: AppointmentItem) {
  if (appt.ends_at) return appt.ends_at;

  if (appt.date && appt.slot_end) {
    return `${appt.date}T${appt.slot_end}:00-03:00`;
  }

  if (appt.end) return appt.end;

  return null;
}

function isPastPendingClosure(appt: AppointmentItem) {
  const start = normalizeAppointmentStart(appt);
  if (!start) return false;

  const startDate = new Date(start);
  if (Number.isNaN(startDate.getTime())) return false;

  return appt.status === "booked" && startDate.getTime() < Date.now();
}

function getVisualStatus(appt: AppointmentItem) {
  if (isPastPendingClosure(appt)) return "pending_close";
  return appt.status;
}

function getStatusLabel(appt: AppointmentItem) {
  const visualStatus = getVisualStatus(appt);

  switch (visualStatus) {
    case "booked":
      return "Agendada";
    case "completed":
      return "Atendida";
    case "no_show":
      return "No asistió";
    case "pending_close":
      return "Pendiente de cierre";
    default:
      return appt.status || "Sin estado";
  }
}

function getStatusClasses(appt: AppointmentItem) {
  const visualStatus = getVisualStatus(appt);

  switch (visualStatus) {
    case "booked":
      return "bg-blue-50 text-blue-700 ring-1 ring-blue-200";
    case "completed":
      return "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200";
    case "no_show":
      return "bg-rose-50 text-rose-700 ring-1 ring-rose-200";
    case "pending_close":
      return "bg-amber-50 text-amber-800 ring-1 ring-amber-200";
    default:
      return "bg-slate-100 text-slate-700 ring-1 ring-slate-200";
  }
}

export default function Page() {
  const params = useParams();
  const slug =
    ((params as any)?.slug as string) || ((params as any)?.Slug as string);

  const [business, setBusiness] = useState<BusinessResponse["business"] | null>(
    null
  );
  const [calendarId, setCalendarId] = useState("");
  const [appointments, setAppointments] = useState<AppointmentItem[]>([]);
  const [selectedAppointment, setSelectedAppointment] =
    useState<AppointmentItem | null>(null);
  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(
    startOfWeek(new Date())
  );
  const [loading, setLoading] = useState(true);
  const [loadingAppointments, setLoadingAppointments] = useState(false);
  const [statusSaving, setStatusSaving] = useState(false);
  const [error, setError] = useState("");

  const weekDates = useMemo(() => {
    return Array.from({ length: 7 }).map((_, i) => addDays(currentWeekStart, i));
  }, [currentWeekStart]);

  async function loadBusiness() {
    if (!slug) return;

    try {
      setLoading(true);
      setError("");

      const res = await fetch(`${BACKEND_URL}/business/public/${slug}`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "No se pudo cargar el negocio");
      }

      setBusiness(data.business);
      setCalendarId(data.calendar_id || "");
    } catch (err: any) {
      setError(err?.message || "Error cargando negocio");
    } finally {
      setLoading(false);
    }
  }

  async function loadAppointments() {
    if (!calendarId) return;

    try {
      setLoadingAppointments(true);
      setError("");

      const from = toYmd(weekDates[0]);
      const to = toYmd(weekDates[6]);

      const url = `${BACKEND_URL}/appointments?calendar_id=${encodeURIComponent(
        calendarId
      )}&from=${from}&to=${to}`;

      const res = await fetch(url);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "No se pudo cargar la agenda");
      }

      const rows = Array.isArray(data) ? data : data.appointments || [];
      setAppointments(rows);
    } catch (err: any) {
      setError(err?.message || "Error cargando agenda");
      setAppointments([]);
    } finally {
      setLoadingAppointments(false);
    }
  }

  async function handleUpdateStatus(
    appointmentId: string,
    newStatus: "completed" | "no_show"
  ) {
    try {
      setStatusSaving(true);
      setError("");

      const res = await fetch(
        `${BACKEND_URL}/appointments/${appointmentId}/status`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            status: newStatus,
          }),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "No se pudo actualizar el estado");
      }

      setAppointments((prev) =>
        prev.map((appt) =>
          appt.id === appointmentId
            ? {
                ...appt,
                status: newStatus,
                updated_at: new Date().toISOString(),
              }
            : appt
        )
      );

      setSelectedAppointment((prev) =>
        prev && prev.id === appointmentId
          ? {
              ...prev,
              status: newStatus,
              updated_at: new Date().toISOString(),
            }
          : prev
      );
    } catch (err: any) {
      setError(err?.message || "Error actualizando estado");
    } finally {
      setStatusSaving(false);
    }
  }

  useEffect(() => {
    loadBusiness();
  }, [slug]);

  useEffect(() => {
    loadAppointments();
  }, [calendarId, currentWeekStart]);

  const appointmentsByDay = useMemo(() => {
    const map: Record<string, AppointmentItem[]> = {};

    for (const day of weekDates) {
      map[toYmd(day)] = [];
    }

    for (const appt of appointments) {
      const start = normalizeAppointmentStart(appt);
      if (!start) continue;

      const d = new Date(start);
      if (Number.isNaN(d.getTime())) continue;

      const key = toYmd(d);
      if (!map[key]) map[key] = [];
      map[key].push(appt);
    }

    for (const key of Object.keys(map)) {
      map[key].sort((a, b) => {
        const aStart = new Date(normalizeAppointmentStart(a) || "").getTime();
        const bStart = new Date(normalizeAppointmentStart(b) || "").getTime();
        return aStart - bStart;
      });
    }

    return map;
  }, [appointments, weekDates]);

  const pendingCloseCount = useMemo(() => {
    return appointments.filter(isPastPendingClosure).length;
  }, [appointments]);

  if (loading) {
    return (
      <div className="p-6">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 text-slate-600">
          Cargando agenda...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-sm font-medium text-slate-500">Agenda</p>
            <h1 className="text-3xl font-semibold text-slate-900">
              {business?.name || "Negocio"}
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Vista semanal de citas
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
              <p className="text-xs uppercase tracking-wide text-slate-500">
                Pendientes de cierre
              </p>
              <p className="mt-1 text-2xl font-semibold text-amber-700">
                {pendingCloseCount}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() =>
                  setCurrentWeekStart((prev) => addDays(prev, -7))
                }
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-100"
              >
                ← Semana anterior
              </button>

              <button
                onClick={() => setCurrentWeekStart(startOfWeek(new Date()))}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-100"
              >
                Hoy
              </button>

              <button
                onClick={() =>
                  setCurrentWeekStart((prev) => addDays(prev, 7))
                }
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-100"
              >
                Semana siguiente →
              </button>
            </div>
          </div>
        </div>

        {error ? (
          <div className="mb-6 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </div>
        ) : null}

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.6fr_0.9fr]">
          <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900">
                Semana {toYmd(weekDates[0])} al {toYmd(weekDates[6])}
              </h2>

              {loadingAppointments ? (
                <span className="text-sm text-slate-500">Actualizando...</span>
              ) : null}
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 2xl:grid-cols-3">
              {weekDates.map((day) => {
                const key = toYmd(day);
                const dayAppointments = appointmentsByDay[key] || [];

                return (
                  <div
                    key={key}
                    className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                  >
                    <div className="mb-3">
                      <p className="text-sm font-semibold capitalize text-slate-900">
                        {formatDateLong(day)}
                      </p>
                      <p className="text-xs text-slate-500">{weekDays[day.getDay()]}</p>
                    </div>

                    <div className="space-y-3">
                      {dayAppointments.length === 0 ? (
                        <div className="rounded-xl border border-dashed border-slate-200 bg-white px-3 py-4 text-sm text-slate-400">
                          Sin citas
                        </div>
                      ) : (
                        dayAppointments.map((appt) => {
                          const start = normalizeAppointmentStart(appt);
                          const end = normalizeAppointmentEnd(appt);

                          return (
                            <button
                              key={appt.id}
                              onClick={() => setSelectedAppointment(appt)}
                              className="w-full rounded-2xl border border-slate-200 bg-white p-3 text-left shadow-sm transition hover:border-slate-300 hover:shadow"
                            >
                              <div className="mb-2 flex items-start justify-between gap-2">
                                <div>
                                  <p className="text-sm font-semibold text-slate-900">
                                    {appt.customer_name || "Sin nombre"}
                                  </p>
                                  <p className="text-xs text-slate-500">
                                    {appt.service_name || "Servicio"}
                                  </p>
                                </div>

                                <span
                                  className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${getStatusClasses(
                                    appt
                                  )}`}
                                >
                                  {getStatusLabel(appt)}
                                </span>
                              </div>

                              <div className="space-y-1 text-xs text-slate-600">
                                <p>
                                  {formatHour(start)} - {formatHour(end)}
                                </p>
                                {appt.staff_name ? <p>Staff: {appt.staff_name}</p> : null}
                                {appt.customer_phone ? (
                                  <p>Tel: {appt.customer_phone}</p>
                                ) : null}
                              </div>

                              {isPastPendingClosure(appt) ? (
                                <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-2.5 py-2 text-[11px] font-medium text-amber-800">
                                  Esta cita ya terminó y requiere cierre.
                                </div>
                              ) : null}
                            </button>
                          );
                        })
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            {!selectedAppointment ? (
              <div className="flex h-full min-h-[320px] items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center text-sm text-slate-500">
                Selecciona una cita para ver su detalle.
              </div>
            ) : (
              <div className="space-y-5">
                <div>
                  <p className="text-sm font-medium text-slate-500">
                    Detalle de cita
                  </p>
                  <h2 className="mt-1 text-xl font-semibold text-slate-900">
                    {selectedAppointment.customer_name || "Sin nombre"}
                  </h2>
                </div>

                <div className="flex flex-wrap gap-2">
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${getStatusClasses(
                      selectedAppointment
                    )}`}
                  >
                    {getStatusLabel(selectedAppointment)}
                  </span>
                </div>

                {isPastPendingClosure(selectedAppointment) ? (
                  <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
                    <p className="text-sm font-semibold text-amber-900">
                      Esta cita ya terminó
                    </p>
                    <p className="mt-1 text-sm text-amber-800">
                      Debes cerrar su estado para mantener la agenda al día.
                    </p>

                    <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <button
                        onClick={() =>
                          handleUpdateStatus(selectedAppointment.id, "completed")
                        }
                        disabled={statusSaving}
                        className="rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {statusSaving ? "Guardando..." : "Marcar como atendida"}
                      </button>

                      <button
                        onClick={() =>
                          handleUpdateStatus(selectedAppointment.id, "no_show")
                        }
                        disabled={statusSaving}
                        className="rounded-xl bg-rose-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {statusSaving ? "Guardando..." : "Marcar como no asistió"}
                      </button>
                    </div>
                  </div>
                ) : null}

                <div className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-slate-500">
                      Servicio
                    </p>
                    <p className="mt-1 font-medium text-slate-900">
                      {selectedAppointment.service_name || "Sin servicio"}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs uppercase tracking-wide text-slate-500">
                      Fecha y hora
                    </p>
                    <p className="mt-1 font-medium text-slate-900">
                      {normalizeAppointmentStart(selectedAppointment)
                        ? new Date(
                            normalizeAppointmentStart(selectedAppointment) as string
                          ).toLocaleDateString("es-CL", {
                            weekday: "long",
                            year: "numeric",
                            month: "2-digit",
                            day: "2-digit",
                          })
                        : "--"}
                    </p>
                    <p className="text-slate-700">
                      {formatHour(normalizeAppointmentStart(selectedAppointment))} -{" "}
                      {formatHour(normalizeAppointmentEnd(selectedAppointment))}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs uppercase tracking-wide text-slate-500">
                      Staff
                    </p>
                    <p className="mt-1 font-medium text-slate-900">
                      {selectedAppointment.staff_name || "No asignado"}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs uppercase tracking-wide text-slate-500">
                      Cliente
                    </p>
                    <p className="mt-1 font-medium text-slate-900">
                      {selectedAppointment.customer_name || "Sin nombre"}
                    </p>
                    {selectedAppointment.customer_phone ? (
                      <p>{selectedAppointment.customer_phone}</p>
                    ) : null}
                    {selectedAppointment.customer_email ? (
                      <p>{selectedAppointment.customer_email}</p>
                    ) : null}
                  </div>

                  {selectedAppointment.source ? (
                    <div>
                      <p className="text-xs uppercase tracking-wide text-slate-500">
                        Origen
                      </p>
                      <p className="mt-1 font-medium text-slate-900">
                        {selectedAppointment.source}
                      </p>
                    </div>
                  ) : null}

                  {selectedAppointment.notes ? (
                    <div>
                      <p className="text-xs uppercase tracking-wide text-slate-500">
                        Notas
                      </p>
                      <p className="mt-1 whitespace-pre-wrap text-slate-700">
                        {selectedAppointment.notes}
                      </p>
                    </div>
                  ) : null}
                </div>

                <button
                  onClick={() => setSelectedAppointment(null)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
                >
                  Cerrar detalle
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}