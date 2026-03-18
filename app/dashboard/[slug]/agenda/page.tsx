"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { PageHeader } from "../../../../components/dashboard/page-header";
import { Panel } from "../../../../components/dashboard/panel";
import { StatCard } from "../../../../components/dashboard/stat-card";

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

type FilterValue =
  | "all"
  | "pending_close"
  | "booked"
  | "completed"
  | "no_show";

const BACKEND_URL = "https://orbyx-backend.onrender.com";

const filterLabels: Record<FilterValue, string> = {
  all: "Todas",
  pending_close: "Pendientes",
  booked: "Agendadas",
  completed: "Atendidas",
  no_show: "No asistió",
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
  const [activeFilter, setActiveFilter] = useState<FilterValue>("all");
  const [statusSaving, setStatusSaving] = useState(false);

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
      hour12: false,
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

  function generateDaySlots(day: Date) {
    const slots: string[] = [];

    const start = new Date(day);
    start.setHours(9, 0, 0, 0);

    const end = new Date(day);
    end.setHours(18, 0, 0, 0);

    const cursor = new Date(start);

    while (cursor < end) {
      slots.push(cursor.toISOString());
      cursor.setMinutes(cursor.getMinutes() + 30);
    }

    return slots;
  }

  function isPastPendingClosure(appt: Appointment) {
    return (
      appt.status === "booked" &&
      new Date(appt.start_at).getTime() < Date.now()
    );
  }

  function getVisualStatus(appt: Appointment) {
    if (isPastPendingClosure(appt)) return "pending_close";
    return appt.status;
  }

  function getStatusLabel(appt: Appointment) {
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
      case "canceled":
        return "Cancelada";
      default:
        return appt.status || "Sin estado";
    }
  }

  function getCalendarBadgeLabel(appt: Appointment) {
    const visualStatus = getVisualStatus(appt);

    switch (visualStatus) {
      case "booked":
        return "Agendada";
      case "completed":
        return "Atendida";
      case "no_show":
        return "No asistió";
      case "pending_close":
        return "Pendiente";
      case "canceled":
        return "Cancelada";
      default:
        return "Estado";
    }
  }

  function getStatusBadgeClass(appt: Appointment) {
    const visualStatus = getVisualStatus(appt);

    switch (visualStatus) {
      case "booked":
        return "border-blue-200 bg-blue-50 text-blue-700";
      case "completed":
        return "border-emerald-200 bg-emerald-50 text-emerald-700";
      case "no_show":
        return "border-amber-200 bg-amber-50 text-amber-800";
      case "pending_close":
        return "border-rose-200 bg-rose-50 text-rose-700";
      case "canceled":
        return "border-slate-200 bg-slate-100 text-slate-600";
      default:
        return "border-slate-200 bg-slate-100 text-slate-700";
    }
  }

  function getCardClass(appt: Appointment, selected: boolean) {
    const visualStatus = getVisualStatus(appt);

    if (selected) {
      if (visualStatus === "pending_close") {
        return "border-rose-500 bg-rose-600 text-white shadow-sm";
      }

      return "border-slate-900 bg-slate-900 text-white shadow-sm";
    }

    if (visualStatus === "pending_close") {
      return "border-rose-300 bg-rose-50 text-slate-900 hover:border-rose-400 hover:bg-rose-100";
    }

    if (visualStatus === "completed") {
      return "border-emerald-400 bg-emerald-100 text-slate-900";
    }

    if (visualStatus === "no_show") {
      return "border-amber-400 bg-amber-100 text-slate-900";
    }

    if (visualStatus === "canceled") {
      return "border-slate-300 bg-slate-200 text-slate-600 opacity-80";
    }

    return "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50 text-slate-900";
  }

  function matchesFilter(appt: Appointment, filter: FilterValue) {
    if (filter === "all") return true;
    if (filter === "pending_close") return isPastPendingClosure(appt);
    if (filter === "booked") {
      return appt.status === "booked" && !isPastPendingClosure(appt);
    }
    if (filter === "completed") return appt.status === "completed";
    if (filter === "no_show") return appt.status === "no_show";
    return true;
  }

  function getFilterButtonClasses(active: boolean) {
    return active
      ? "inline-flex h-10 items-center justify-center rounded-2xl bg-slate-900 px-4 text-sm font-medium text-white transition hover:bg-slate-800"
      : "inline-flex h-10 items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 transition hover:bg-slate-50";
  }

  const weekStart = useMemo(() => startOfWeek(weekBaseDate), [weekBaseDate]);
  const weekDays = useMemo(
    () => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)),
    [weekStart]
  );
  const weekEnd = weekDays[6];

  async function loadAppointments(options?: { preserveSelected?: boolean }) {
    try {
      setLoading(true);
      setError("");

      const from = formatDateYYYYMMDD(weekStart);
      const to = formatDateYYYYMMDD(weekEnd);

      const res = await fetch(
        `${BACKEND_URL}/appointments/by-range/${slug}?from=${from}&to=${to}`
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "No se pudo cargar la agenda");
      }

      const rows = data.appointments || [];
      setAppointments(rows);

      if (options?.preserveSelected && selectedAppointment) {
        const updatedSelected = rows.find(
          (appt: Appointment) => appt.id === selectedAppointment.id
        );
        setSelectedAppointment(updatedSelected || null);
      } else if (selectedAppointment) {
        const updatedSelected = rows.find(
          (appt: Appointment) => appt.id === selectedAppointment.id
        );
        setSelectedAppointment(updatedSelected || null);
      }
    } catch (err: any) {
      setError(err?.message || "Error cargando agenda");
    } finally {
      setLoading(false);
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
              }
            : appt
        )
      );

      setSelectedAppointment((prev) =>
        prev && prev.id === appointmentId
          ? {
              ...prev,
              status: newStatus,
            }
          : prev
      );

      await loadAppointments({ preserveSelected: true });
    } catch (err: any) {
      setError(err?.message || "Error actualizando estado");
    } finally {
      setStatusSaving(false);
    }
  }

  useEffect(() => {
    if (slug) {
      loadAppointments();
    }
  }, [slug, weekStart.getTime()]);

  const filteredAppointments = useMemo(() => {
    return appointments.filter((appt) => matchesFilter(appt, activeFilter));
  }, [appointments, activeFilter]);

  const appointmentsByDay = useMemo(() => {
    const result: Record<string, Appointment[]> = {};

    for (const day of weekDays) {
      result[formatDateYYYYMMDD(day)] = [];
    }

    for (const appt of filteredAppointments) {
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
  }, [filteredAppointments, weekDays]);

  const todayKey = formatDateYYYYMMDD(new Date());
  const appointmentsToday = appointmentsByDay[todayKey] || [];

  const nextAppointment = useMemo(() => {
    const now = Date.now();

    return appointments
      .filter(
        (appt) =>
          new Date(appt.start_at).getTime() >= now && appt.status === "booked"
      )
      .sort(
        (a, b) =>
          new Date(a.start_at).getTime() - new Date(b.start_at).getTime()
      )[0];
  }, [appointments]);

  const pendingCloseCount = useMemo(() => {
    return appointments.filter(isPastPendingClosure).length;
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

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Reservas hoy"
          value={loading ? "..." : String(appointmentsToday.length)}
          helper="Citas visibles para el día actual."
        />
        <StatCard
          label="Próxima reserva"
          value={
            loading
              ? "..."
              : nextAppointment
              ? formatHour(nextAppointment.start_at)
              : "--"
          }
          helper={
            loading
              ? "Cargando próxima cita."
              : nextAppointment
              ? nextAppointment.customer_name
              : "No hay próximas reservas."
          }
        />
        <StatCard
          label="Pendientes de cierre"
          value={loading ? "..." : String(pendingCloseCount)}
          helper="Citas pasadas que siguen agendadas."
        />
        <StatCard
          label="Reservas semana"
          value={loading ? "..." : String(appointments.length)}
          helper="Total de reservas de esta semana."
        />
      </section>

      <Panel
        title="Filtros de agenda"
        description="Filtra la semana por estado sin perder la vista de bloques."
      >
        <div className="flex flex-wrap gap-3">
          {(Object.keys(filterLabels) as FilterValue[]).map((filter) => (
            <button
              key={filter}
              type="button"
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
      </Panel>

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
                const daySlots = generateDaySlots(day);
                const dayPendingCount = dayAppointments.filter(
                  isPastPendingClosure
                ).length;

                return (
                  <div
                    key={dayKey}
                    className={`rounded-2xl border p-3 ${
                      dayPendingCount > 0
                        ? "border-rose-200 bg-rose-50/50"
                        : "border-slate-200 bg-slate-50"
                    }`}
                  >
                    <div className="mb-3 border-b border-slate-200 pb-3">
                      <div className="flex items-center justify-between gap-2">
                        <div className="text-sm font-semibold capitalize text-slate-800">
                          {day.toLocaleDateString("es-CL", {
                            weekday: "long",
                          })}
                        </div>

                        <div className="flex items-center gap-2">
                          {dayPendingCount > 0 ? (
                            <span className="rounded-full bg-rose-100 px-2.5 py-1 text-[11px] font-semibold text-rose-700">
                              {dayPendingCount}
                            </span>
                          ) : null}

                          {isToday ? (
                            <span className="rounded-full bg-slate-900 px-2.5 py-1 text-[11px] font-semibold text-white">
                              Hoy
                            </span>
                          ) : null}
                        </div>
                      </div>

                      <div className="mt-1 text-xs text-slate-500">
                        {day.toLocaleDateString("es-CL", {
                          day: "2-digit",
                          month: "2-digit",
                        })}
                      </div>
                    </div>

                    <div className="space-y-2">
                      {daySlots.map((slot, index) => {
                        const appt = dayAppointments.find(
                          (a) =>
                            new Date(a.start_at).getTime() ===
                            new Date(slot).getTime()
                        );

                        const isHourStart = index % 2 === 0;
                        const isEvenBand = Math.floor(index / 2) % 2 === 0;

                        if (!appt) {
                          return (
                            <div
                              key={slot}
                              className={`rounded-xl border px-3 py-3 text-center text-xs ${
                                isHourStart
                                  ? "border-slate-300"
                                  : "border-slate-200"
                              } ${
                                isEvenBand
                                  ? "bg-slate-100 text-slate-500"
                                  : "bg-white text-slate-400"
                              }`}
                            >
                              <span className="block font-medium">
                                {formatHour(slot)}
                              </span>
                              <span className="block">Libre</span>
                            </div>
                          );
                        }

                        const isSelected = selectedAppointment?.id === appt.id;

                        return (
                          <button
                            key={appt.id}
                            type="button"
                            onClick={() => setSelectedAppointment(appt)}
                            className={`w-full rounded-2xl border p-3 text-left transition ${getCardClass(
                              appt,
                              isSelected
                            )}`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div
                                className={`min-w-0 text-xs font-semibold ${
                                  isSelected ? "text-slate-200" : "text-slate-600"
                                }`}
                              >
                                {formatHour(appt.start_at)} -{" "}
                                {formatHour(appt.end_at)}
                              </div>

                              <span
                                className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-semibold ${
                                  isSelected
                                    ? "border-white/20 bg-white/10 text-white"
                                    : getStatusBadgeClass(appt)
                                }`}
                              >
                                {getCalendarBadgeLabel(appt)}
                              </span>
                            </div>

                            <p
                              className={`mt-1 line-clamp-1 text-sm font-semibold ${
                                isSelected ? "text-white" : "text-slate-900"
                              }`}
                            >
                              {appt.customer_name}
                            </p>

                            <p
                              className={`mt-1 line-clamp-1 text-xs ${
                                isSelected ? "text-slate-300" : "text-slate-500"
                              }`}
                            >
                              {appt.service_name_snapshot || "Reserva"}
                            </p>

                            {isPastPendingClosure(appt) ? (
                              <div
                                className={`mt-2 rounded-xl px-2 py-1 text-[10px] font-semibold ${
                                  isSelected
                                    ? "bg-white/10 text-white"
                                    : "bg-rose-100 text-rose-700"
                                }`}
                              >
                                Requiere cierre
                              </div>
                            ) : null}
                          </button>
                        );
                      })}
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
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-slate-900">
                    {selectedAppointment.service_name_snapshot || "Reserva"}
                  </p>

                  <span
                    className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${getStatusBadgeClass(
                      selectedAppointment
                    )}`}
                  >
                    {getStatusLabel(selectedAppointment)}
                  </span>
                </div>

                <p className="mt-2 text-sm capitalize text-slate-600">
                  {formatLongDate(selectedAppointment.start_at)}
                </p>
                <p className="mt-1 text-sm text-slate-600">
                  {formatHour(selectedAppointment.start_at)} -{" "}
                  {formatHour(selectedAppointment.end_at)}
                </p>
              </div>

              {isPastPendingClosure(selectedAppointment) ? (
                <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4">
                  <p className="text-sm font-semibold text-rose-800">
                    Esta cita ya terminó
                  </p>
                  <p className="mt-1 text-sm text-rose-700">
                    Debes cerrar su estado para mantener la agenda al día.
                  </p>

                  <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <button
                      type="button"
                      onClick={() =>
                        handleUpdateStatus(selectedAppointment.id, "completed")
                      }
                      disabled={statusSaving}
                      className="inline-flex h-11 items-center justify-center rounded-2xl bg-emerald-600 px-4 text-sm font-medium text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {statusSaving ? "Guardando..." : "Marcar como atendida"}
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        handleUpdateStatus(selectedAppointment.id, "no_show")
                      }
                      disabled={statusSaving}
                      className="inline-flex h-11 items-center justify-center rounded-2xl bg-amber-500 px-4 text-sm font-medium text-white transition hover:bg-amber-600 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {statusSaving ? "Guardando..." : "Marcar como no asistió"}
                    </button>
                  </div>
                </div>
              ) : null}

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
                  <p className="mt-2 text-sm font-semibold text-slate-900">
                    {getStatusLabel(selectedAppointment)}
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