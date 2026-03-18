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

type FilterValue =
  | "all"
  | "pending_close"
  | "booked"
  | "completed"
  | "no_show";

const BACKEND_URL = "https://orbyx-api.onrender.com";
const SLOT_MINUTES = 30;
const DAY_START_HOUR = 8;
const DAY_END_HOUR = 21;
const SLOT_HEIGHT = 44;

const weekDaysShort = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
const filterLabels: Record<FilterValue, string> = {
  all: "Todas",
  pending_close: "Pendientes",
  booked: "Agendadas",
  completed: "Atendidas",
  no_show: "No asistió",
};

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

function formatDayHeader(date: Date) {
  return date.toLocaleDateString("es-CL", {
    weekday: "long",
    day: "2-digit",
    month: "2-digit",
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

function getAppointmentStartDate(appt: AppointmentItem) {
  const start = normalizeAppointmentStart(appt);
  if (!start) return null;

  const d = new Date(start);
  if (Number.isNaN(d.getTime())) return null;

  return d;
}

function getAppointmentEndDate(appt: AppointmentItem) {
  const end = normalizeAppointmentEnd(appt);
  if (!end) return null;

  const d = new Date(end);
  if (Number.isNaN(d.getTime())) return null;

  return d;
}

function isPastPendingClosure(appt: AppointmentItem) {
  const startDate = getAppointmentStartDate(appt);
  if (!startDate) return false;

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

function getStatusBadgeClasses(appt: AppointmentItem) {
  const visualStatus = getVisualStatus(appt);

  switch (visualStatus) {
    case "booked":
      return "bg-blue-50 text-blue-700 ring-blue-200";
    case "completed":
      return "bg-emerald-50 text-emerald-700 ring-emerald-200";
    case "no_show":
      return "bg-rose-50 text-rose-700 ring-rose-200";
    case "pending_close":
      return "bg-amber-100 text-amber-900 ring-amber-300";
    default:
      return "bg-slate-100 text-slate-700 ring-slate-200";
  }
}

function getAppointmentCardClasses(appt: AppointmentItem, isSelected: boolean) {
  const visualStatus = getVisualStatus(appt);

  if (visualStatus === "pending_close") {
    return isSelected
      ? "border-2 border-amber-400 bg-amber-50 text-amber-950 shadow-md"
      : "border-2 border-amber-300 bg-amber-50 text-amber-950 shadow-sm hover:border-amber-400";
  }

  if (visualStatus === "completed") {
    return isSelected
      ? "border-2 border-emerald-400 bg-emerald-50 text-emerald-950 shadow-md"
      : "border border-emerald-200 bg-emerald-50/80 text-emerald-950 shadow-sm hover:border-emerald-300";
  }

  if (visualStatus === "no_show") {
    return isSelected
      ? "border-2 border-rose-400 bg-rose-50 text-rose-950 shadow-md"
      : "border border-rose-200 bg-rose-50/80 text-rose-950 shadow-sm hover:border-rose-300";
  }

  return isSelected
    ? "border-2 border-blue-400 bg-blue-50 text-slate-950 shadow-md"
    : "border border-blue-200 bg-blue-50/80 text-slate-950 shadow-sm hover:border-blue-300";
}

function compareAppointments(a: AppointmentItem, b: AppointmentItem) {
  const aPending = isPastPendingClosure(a);
  const bPending = isPastPendingClosure(b);

  if (aPending && !bPending) return -1;
  if (!aPending && bPending) return 1;

  const aStart = getAppointmentStartDate(a)?.getTime() ?? 0;
  const bStart = getAppointmentStartDate(b)?.getTime() ?? 0;

  return aStart - bStart;
}

function matchesFilter(appt: AppointmentItem, filter: FilterValue) {
  if (filter === "all") return true;
  if (filter === "pending_close") return isPastPendingClosure(appt);
  if (filter === "booked") return appt.status === "booked" && !isPastPendingClosure(appt);
  if (filter === "completed") return appt.status === "completed";
  if (filter === "no_show") return appt.status === "no_show";
  return true;
}

function getFilterButtonClasses(active: boolean) {
  return active
    ? "rounded-full bg-slate-900 px-3 py-2 text-xs font-semibold text-white shadow-sm"
    : "rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-100";
}

function pad2(value: number) {
  return String(value).padStart(2, "0");
}

function buildTimeSlots() {
  const slots: string[] = [];

  for (let hour = DAY_START_HOUR; hour < DAY_END_HOUR; hour++) {
    slots.push(`${pad2(hour)}:00`);
    slots.push(`${pad2(hour)}:30`);
  }

  return slots;
}

function timeStringToMinutes(value: string) {
  const [h, m] = value.split(":").map(Number);
  return h * 60 + m;
}

function getMinutesSinceStartOfDay(date: Date) {
  return date.getHours() * 60 + date.getMinutes();
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function getAppointmentLayout(appt: AppointmentItem) {
  const startDate = getAppointmentStartDate(appt);
  const endDate = getAppointmentEndDate(appt);

  if (!startDate || !endDate) return null;

  const dayStartMinutes = DAY_START_HOUR * 60;
  const dayEndMinutes = DAY_END_HOUR * 60;

  const startMinutes = getMinutesSinceStartOfDay(startDate);
  const endMinutesRaw = getMinutesSinceStartOfDay(endDate);
  const endMinutes = endMinutesRaw <= startMinutes ? startMinutes + 30 : endMinutesRaw;

  const visibleStart = clamp(startMinutes, dayStartMinutes, dayEndMinutes);
  const visibleEnd = clamp(endMinutes, dayStartMinutes, dayEndMinutes);

  if (visibleEnd <= visibleStart) return null;

  const top = ((visibleStart - dayStartMinutes) / SLOT_MINUTES) * SLOT_HEIGHT;
  const height = Math.max(
    ((visibleEnd - visibleStart) / SLOT_MINUTES) * SLOT_HEIGHT - 4,
    SLOT_HEIGHT - 6
  );

  return { top, height };
}

async function fetchAppointmentsWithFallbacks(calendarId: string, from: string, to: string) {
  const urls = [
    `${BACKEND_URL}/appointments?calendar_id=${encodeURIComponent(calendarId)}&from=${from}&to=${to}`,
    `${BACKEND_URL}/appointments?calendar_id=${encodeURIComponent(calendarId)}&date_from=${from}&date_to=${to}`,
    `${BACKEND_URL}/appointments/calendar?calendar_id=${encodeURIComponent(calendarId)}&from=${from}&to=${to}`,
    `${BACKEND_URL}/appointments/calendar?calendar_id=${encodeURIComponent(calendarId)}&date_from=${from}&date_to=${to}`,
  ];

  let lastError = "No se pudo cargar la agenda";

  for (const url of urls) {
    try {
      const res = await fetch(url);
      const data = await res.json();

      if (!res.ok) {
        lastError = data?.error || `Error ${res.status}`;
        continue;
      }

      const rows = Array.isArray(data) ? data : data.appointments || data.data || [];
      return rows as AppointmentItem[];
    } catch (err: any) {
      lastError = err?.message || "Failed to fetch";
    }
  }

  throw new Error(lastError);
}

export default function Page() {
  const params = useParams();
  const slug =
    ((params as any)?.slug as string) || ((params as any)?.Slug as string);

  const [business, setBusiness] = useState<BusinessResponse["business"] | null>(null);
  const [calendarId, setCalendarId] = useState("");
  const [appointments, setAppointments] = useState<AppointmentItem[]>([]);
  const [selectedAppointment, setSelectedAppointment] = useState<AppointmentItem | null>(null);
  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(startOfWeek(new Date()));
  const [activeFilter, setActiveFilter] = useState<FilterValue>("all");
  const [loading, setLoading] = useState(true);
  const [loadingAppointments, setLoadingAppointments] = useState(false);
  const [statusSaving, setStatusSaving] = useState(false);
  const [error, setError] = useState("");

  const weekDates = useMemo(() => {
    return Array.from({ length: 7 }).map((_, i) => addDays(currentWeekStart, i));
  }, [currentWeekStart]);

  const timeSlots = useMemo(() => buildTimeSlots(), []);

  async function loadBusiness() {
    if (!slug) return;

    try {
      setLoading(true);

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

      const rows = await fetchAppointmentsWithFallbacks(calendarId, from, to);
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

      const res = await fetch(`${BACKEND_URL}/appointments/${appointmentId}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: newStatus,
        }),
      });

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

  const filteredAppointments = useMemo(() => {
    return appointments.filter((appt) => matchesFilter(appt, activeFilter));
  }, [appointments, activeFilter]);

  const appointmentsByDay = useMemo(() => {
    const map: Record<string, AppointmentItem[]> = {};

    for (const day of weekDates) {
      map[toYmd(day)] = [];
    }

    for (const appt of filteredAppointments) {
      const startDate = getAppointmentStartDate(appt);
      if (!startDate) continue;

      const key = toYmd(startDate);
      if (!map[key]) map[key] = [];
      map[key].push(appt);
    }

    for (const key of Object.keys(map)) {
      map[key].sort(compareAppointments);
    }

    return map;
  }, [filteredAppointments, weekDates]);

  const pendingCloseAppointments = useMemo(() => {
    return appointments.filter(isPastPendingClosure).sort(compareAppointments);
  }, [appointments]);

  const counts = useMemo(() => {
    return {
      all: appointments.length,
      pending_close: appointments.filter(isPastPendingClosure).length,
      booked: appointments.filter(
        (appt) => appt.status === "booked" && !isPastPendingClosure(appt)
      ).length,
      completed: appointments.filter((appt) => appt.status === "completed").length,
      no_show: appointments.filter((appt) => appt.status === "no_show").length,
    };
  }, [appointments]);

  const visibleCount = filteredAppointments.length;
  const pendingCloseCount = counts.pending_close;
  const gridHeight = timeSlots.length * SLOT_HEIGHT;

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
      <div className="mx-auto max-w-[1600px]">
        <div className="mb-6 flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <p className="text-sm font-medium text-slate-500">Agenda</p>
            <h1 className="text-3xl font-semibold text-slate-900">
              {business?.name || "Negocio"}
            </h1>
            <p className="mt-1 text-sm text-slate-500">Vista semanal de citas</p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 shadow-sm">
              <p className="text-xs uppercase tracking-wide text-amber-700">
                Pendientes de cierre
              </p>
              <p className="mt-1 text-2xl font-semibold text-amber-900">
                {pendingCloseCount}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentWeekStart((prev) => addDays(prev, -7))}
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
                onClick={() => setCurrentWeekStart((prev) => addDays(prev, 7))}
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

        <div className="mb-6 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-900">Filtros</p>
              <p className="mt-1 text-sm text-slate-500">
                Mostrando {visibleCount} cita{visibleCount === 1 ? "" : "s"} en la vista actual
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              {(Object.keys(filterLabels) as FilterValue[]).map((filter) => (
                <button
                  key={filter}
                  onClick={() => setActiveFilter(filter)}
                  className={getFilterButtonClasses(activeFilter === filter)}
                >
                  {filterLabels[filter]} (
                  {filter === "all"
                    ? counts.all
                    : filter === "pending_close"
                    ? counts.pending_close
                    : filter === "booked"
                    ? counts.booked
                    : filter === "completed"
                    ? counts.completed
                    : counts.no_show}
                  )
                </button>
              ))}
            </div>
          </div>
        </div>

        {pendingCloseCount > 0 &&
        activeFilter !== "completed" &&
        activeFilter !== "no_show" ? (
          <div className="mb-6 rounded-3xl border border-amber-200 bg-amber-50 p-4 shadow-sm">
            <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
              <div>
                <p className="text-sm font-semibold text-amber-900">
                  Tienes citas pendientes de cierre
                </p>
                <p className="mt-1 text-sm text-amber-800">
                  Estas citas ya pasaron y siguen como agendadas. Debes marcarlas como atendidas o como no asistió.
                </p>
              </div>

              <div className="rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-amber-900 shadow-sm ring-1 ring-amber-200">
                {pendingCloseCount} pendiente{pendingCloseCount === 1 ? "" : "s"}
              </div>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-3 xl:grid-cols-2">
              {pendingCloseAppointments.slice(0, 4).map((appt) => {
                const start = normalizeAppointmentStart(appt);
                const end = normalizeAppointmentEnd(appt);

                return (
                  <button
                    key={appt.id}
                    onClick={() => {
                      setActiveFilter("pending_close");
                      setSelectedAppointment(appt);
                    }}
                    className="rounded-2xl border border-amber-200 bg-white p-3 text-left shadow-sm transition hover:border-amber-300 hover:shadow"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">
                          {appt.customer_name || "Sin nombre"}
                        </p>
                        <p className="text-xs text-slate-500">
                          {appt.service_name || "Servicio"}
                        </p>
                      </div>

                      <span className="rounded-full bg-amber-100 px-2.5 py-1 text-[11px] font-semibold text-amber-900 ring-1 ring-amber-300">
                        Pendiente de cierre
                      </span>
                    </div>

                    <div className="mt-2 space-y-1 text-xs text-slate-600">
                      <p>
                        {formatHour(start)} - {formatHour(end)}
                      </p>
                      {appt.staff_name ? <p>Staff: {appt.staff_name}</p> : null}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ) : null}

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.8fr_0.8fr]">
          <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="mb-4 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">
                  Semana {toYmd(weekDates[0])} al {toYmd(weekDates[6])}
                </h2>
                <p className="text-sm text-slate-500">
                  Filtro activo:{" "}
                  <span className="font-medium text-slate-700">
                    {filterLabels[activeFilter]}
                  </span>
                </p>
              </div>

              {loadingAppointments ? (
                <span className="text-sm text-slate-500">Actualizando...</span>
              ) : null}
            </div>

            <div className="overflow-x-auto">
              <div className="min-w-[1100px]">
                <div
                  className="grid"
                  style={{
                    gridTemplateColumns: "80px repeat(7, minmax(140px, 1fr))",
                  }}
                >
                  <div className="sticky left-0 z-20 border-b border-slate-200 bg-white" />

                  {weekDates.map((day) => {
                    const key = toYmd(day);
                    const dayAppointments = appointmentsByDay[key] || [];
                    const dayPendingCount = dayAppointments.filter(isPastPendingClosure).length;

                    return (
                      <div
                        key={key}
                        className={`border-b border-l border-slate-200 px-3 py-3 ${
                          dayPendingCount > 0 ? "bg-amber-50/70" : "bg-slate-50/70"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="text-sm font-semibold capitalize text-slate-900">
                              {formatDayHeader(day)}
                            </p>
                            <p className="text-xs text-slate-500">
                              {weekDaysShort[day.getDay()]}
                            </p>
                          </div>

                          {dayPendingCount > 0 ? (
                            <span className="rounded-full bg-amber-100 px-2 py-1 text-[10px] font-semibold text-amber-900 ring-1 ring-amber-300">
                              {dayPendingCount}
                            </span>
                          ) : null}
                        </div>
                      </div>
                    );
                  })}

                  <div className="relative border-r border-slate-200 bg-white">
                    {timeSlots.map((slot) => (
                      <div
                        key={slot}
                        className="flex items-start justify-end border-b border-slate-200 px-2 pt-1 text-xs font-medium text-slate-500"
                        style={{ height: SLOT_HEIGHT }}
                      >
                        {slot}
                      </div>
                    ))}
                  </div>

                  {weekDates.map((day) => {
                    const key = toYmd(day);
                    const dayAppointments = appointmentsByDay[key] || [];

                    return (
                      <div
                        key={key}
                        className={`relative border-l border-slate-200 ${
                          dayAppointments.some(isPastPendingClosure)
                            ? "bg-amber-50/30"
                            : "bg-white"
                        }`}
                        style={{ height: gridHeight }}
                      >
                        {timeSlots.map((slot) => (
                          <div
                            key={`${key}-${slot}`}
                            className="border-b border-slate-200"
                            style={{ height: SLOT_HEIGHT }}
                          />
                        ))}

                        {dayAppointments.map((appt) => {
                          const layout = getAppointmentLayout(appt);
                          if (!layout) return null;

                          const isSelected = selectedAppointment?.id === appt.id;

                          return (
                            <button
                              key={appt.id}
                              onClick={() => setSelectedAppointment(appt)}
                              className={`absolute left-1 right-1 overflow-hidden rounded-xl p-2 text-left transition ${getAppointmentCardClasses(
                                appt,
                                !!isSelected
                              )}`}
                              style={{
                                top: layout.top + 2,
                                height: layout.height,
                                zIndex: isSelected ? 20 : 10,
                              }}
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div className="min-w-0">
                                  <p className="truncate text-xs font-semibold">
                                    {appt.customer_name || "Sin nombre"}
                                  </p>
                                  <p className="truncate text-[11px] opacity-80">
                                    {appt.service_name || "Servicio"}
                                  </p>
                                </div>

                                <span
                                  className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1 ${getStatusBadgeClasses(
                                    appt
                                  )}`}
                                >
                                  {getStatusLabel(appt)}
                                </span>
                              </div>

                              <div className="mt-1 space-y-0.5 text-[11px] opacity-90">
                                <p>
                                  {formatHour(normalizeAppointmentStart(appt))} -{" "}
                                  {formatHour(normalizeAppointmentEnd(appt))}
                                </p>
                                {appt.staff_name ? <p>{appt.staff_name}</p> : null}
                                {appt.customer_phone ? <p>{appt.customer_phone}</p> : null}
                              </div>

                              {isPastPendingClosure(appt) ? (
                                <div className="mt-1 rounded-lg border border-amber-300 bg-white/80 px-2 py-1 text-[10px] font-semibold text-amber-900">
                                  Requiere cierre
                                </div>
                              ) : null}
                            </button>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            {!selectedAppointment ? (
              <div className="flex h-full min-h-[420px] items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center text-sm text-slate-500">
                Selecciona una cita para ver su detalle.
              </div>
            ) : (
              <div className="space-y-5">
                <div>
                  <p className="text-sm font-medium text-slate-500">Detalle de cita</p>
                  <h2 className="mt-1 text-xl font-semibold text-slate-900">
                    {selectedAppointment.customer_name || "Sin nombre"}
                  </h2>
                </div>

                <div className="flex flex-wrap gap-2">
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ring-1 ${getStatusBadgeClasses(
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
                    <p className="mt-1 font-medium capitalize text-slate-900">
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