"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

const BACKEND_URL = "https://orbyx-backend.onrender.com";

type Appointment = {
  id: string;
  branch_id?: string | null;
  service_id?: string | null;
  staff_id?: string | null;
  start_at: string;
  end_at: string;
  customer_name: string;
  customer_phone: string | null;
  customer_email: string | null;
  service_name_snapshot: string | null;
  service_is_group?: boolean | null;
  service_capacity?: number | null;
  status: string;
};

type GroupFilter = "all" | "pending" | "completed" | "no_show" | "rescheduled";

function safeDecode(value: string) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function formatDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatLongDate(value?: string) {
  if (!value) return "Horario por confirmar";

  return new Intl.DateTimeFormat("es-CL", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(new Date(value));
}

function formatHour(value?: string) {
  if (!value) return "--:--";

  return new Intl.DateTimeFormat("es-CL", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(value));
}

function getStatusLabel(status: string) {
  switch (status) {
    case "completed":
      return "Asisti&oacute;";
    case "no_show":
      return "No asisti&oacute;";
    case "rescheduled":
      return "Reagend&oacute;";
    case "canceled":
      return "Cancelada";
    case "booked":
      return "Pendiente";
    default:
      return status || "Pendiente";
  }
}

function getStatusClass(status: string) {
  switch (status) {
    case "completed":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case "no_show":
      return "border-amber-200 bg-amber-50 text-amber-800";
    case "rescheduled":
      return "border-violet-200 bg-violet-50 text-violet-700";
    case "canceled":
      return "border-slate-200 bg-slate-100 text-slate-600";
    default:
      return "border-sky-200 bg-sky-50 text-sky-700";
  }
}

function getAttendeeCardClass(status: string) {
  switch (status) {
    case "completed":
      return "border-emerald-200 bg-emerald-50/80";
    case "no_show":
      return "border-amber-200 bg-amber-50/80";
    case "rescheduled":
      return "border-violet-200 bg-violet-50/80";
    case "canceled":
      return "border-slate-200 bg-slate-100/80";
    default:
      return "border-sky-200 bg-sky-50/80";
  }
}

function getAppointmentGroupKey(appt: Appointment) {
  return [
    new Date(appt.start_at).toISOString(),
    appt.service_id || "no_service",
    appt.staff_id || "no_staff",
    appt.branch_id || "no_branch",
  ].join("|");
}

function getGroupState(attendees: Appointment[]) {
  const active = attendees.filter((appt) => appt.status !== "canceled");
  const reviewed = active.filter((appt) =>
    ["completed", "no_show", "rescheduled"].includes(appt.status)
  );

  if (attendees.length > 0 && attendees.every((appt) => appt.status === "canceled")) {
    return { label: "Cancelada", className: "border-slate-200 bg-slate-100 text-slate-600" };
  }

  if (active.length > 0 && reviewed.length === active.length) {
    return { label: "Cerrada", className: "border-emerald-200 bg-emerald-50 text-emerald-700" };
  }

  if (reviewed.length > 0) {
    return { label: "Cierre parcial", className: "border-amber-200 bg-amber-50 text-amber-800" };
  }

  return { label: "Programada", className: "border-sky-200 bg-sky-50 text-sky-700" };
}

export default function GroupBookingPage() {
  const params = useParams();
  const slug =
    ((params as { slug?: string })?.slug as string) ||
    ((params as { Slug?: string })?.Slug as string) ||
    "";
  const encodedGroupKey =
    ((params as { groupKey?: string })?.groupKey as string) || "";
  const groupKey = safeDecode(encodedGroupKey);
  const [startAt, , staffId, branchId] = groupKey.split("|");

  const [attendees, setAttendees] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<GroupFilter>("all");
  const [savingId, setSavingId] = useState("");

  async function loadGroupAppointments() {
    if (!slug || !startAt || !branchId || branchId === "no_branch") {
      setLoading(false);
      setAttendees([]);
      return;
    }

    try {
      setLoading(true);
      setError("");

      const dayKey = formatDateKey(new Date(startAt));
      const query = new URLSearchParams({
        from: dayKey,
        to: dayKey,
        branch_id: branchId,
      });

      if (staffId && staffId !== "no_staff") {
        query.set("staff_id", staffId);
      }

      const response = await fetch(
        `${BACKEND_URL}/appointments/by-range/${slug}?${query.toString()}`
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || "No se pudo cargar el grupo");
      }

      const rows: Appointment[] = Array.isArray(data.appointments)
        ? data.appointments
        : [];
      const groupRows = rows
        .filter((appt) => appt.service_is_group === true)
        .filter((appt) => getAppointmentGroupKey(appt) === groupKey)
        .sort((a, b) =>
          String(a.customer_name || "").localeCompare(
            String(b.customer_name || ""),
            "es"
          )
        );

      setAttendees(groupRows);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo cargar el grupo");
      setAttendees([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadGroupAppointments();
  }, [slug, groupKey]);

  async function updateStatus(
    appointmentId: string,
    status: "completed" | "no_show" | "rescheduled"
  ) {
    try {
      setSavingId(appointmentId);

      const response = await fetch(`${BACKEND_URL}/appointments/${appointmentId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || "No se pudo actualizar la asistencia");
      }

      setAttendees((current) =>
        current.map((appt) =>
          appt.id === appointmentId ? { ...appt, status } : appt
        )
      );
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "No se pudo actualizar la asistencia"
      );
    } finally {
      setSavingId("");
    }
  }

  const filteredAttendees = useMemo(() => {
    const normalizedSearch = searchQuery.trim().toLowerCase();

    return attendees.filter((attendee) => {
      const matchesSearch =
        !normalizedSearch ||
        [
          attendee.customer_name,
          attendee.customer_email || "",
          attendee.customer_phone || "",
        ]
          .join(" ")
          .toLowerCase()
          .includes(normalizedSearch);

      const matchesFilter =
        activeFilter === "all" ||
        (activeFilter === "pending" && attendee.status === "booked") ||
        (activeFilter === "completed" && attendee.status === "completed") ||
        (activeFilter === "no_show" && attendee.status === "no_show") ||
        (activeFilter === "rescheduled" && attendee.status === "rescheduled");

      return matchesSearch && matchesFilter;
    });
  }, [attendees, searchQuery, activeFilter]);

  const firstAttendee = attendees[0];
  const activeCount = attendees.filter((attendee) => attendee.status !== "canceled").length;
  const capacity =
    Number(firstAttendee?.service_capacity || 0) || activeCount || attendees.length;
  const groupState = getGroupState(attendees);
  const serviceName = firstAttendee?.service_name_snapshot || "Reserva grupal";
  const professionalName = firstAttendee?.staff_id
    ? "Profesional asignado"
    : "Profesional por confirmar";

  const filters: { key: GroupFilter; label: string }[] = [
    { key: "all", label: "Todos" },
    { key: "pending", label: "Pendientes" },
    { key: "completed", label: "Asisti&oacute;" },
    { key: "no_show", label: "No asisti&oacute;" },
    { key: "rescheduled", label: "Reagend&oacute;" },
  ];

  return (
    <main className="min-h-screen px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-5">
        <Link
          href={`/dashboard/${encodeURIComponent(slug)}/agenda`}
          className="inline-flex h-10 items-center justify-center rounded-xl border px-4 text-sm font-semibold transition hover:shadow-sm"
          style={{
            borderColor: "var(--border-color)",
            background: "var(--bg-card)",
            color: "var(--text-main)",
          }}
        >
          &larr; Volver a Agenda
        </Link>

        <header
          className="rounded-2xl border p-5"
          style={{
            borderColor: "var(--border-color)",
            background: "var(--bg-card)",
          }}
        >
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-[0.14em]" style={{ color: "var(--text-muted)" }}>
                Lista completa de inscritos
              </p>
              <h1 className="mt-2 text-2xl font-semibold" style={{ color: "var(--text-main)" }}>
                {serviceName}
              </h1>
              <div className="mt-3 grid gap-1 text-sm" style={{ color: "var(--text-muted)" }}>
                <p>{formatLongDate(startAt)}</p>
                <p>
                  {formatHour(startAt)} - {formatHour(firstAttendee?.end_at)}
                </p>
                <p>{professionalName}</p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${groupState.className}`}>
                {groupState.label}
              </span>
              <span
                className="rounded-full border px-3 py-1 text-xs font-semibold"
                style={{
                  borderColor: "var(--border-color)",
                  color: "var(--text-muted)",
                }}
              >
                {activeCount}/{capacity} inscritos
              </span>
            </div>
          </div>
        </header>

        <section
          className="rounded-2xl border p-4"
          style={{
            borderColor: "var(--border-color)",
            background: "var(--bg-card)",
          }}
        >
          <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
            <input
              type="search"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Buscar por nombre, email o telefono"
              className="h-11 w-full rounded-xl border px-3 text-sm outline-none transition focus:ring-2 focus:ring-sky-200"
              style={{
                borderColor: "var(--border-color)",
                background: "var(--bg-soft)",
                color: "var(--text-main)",
              }}
            />

            <div className="flex flex-wrap gap-2">
              {filters.map((filter) => (
                <button
                  key={filter.key}
                  type="button"
                  onClick={() => setActiveFilter(filter.key)}
                  className={`h-9 rounded-xl border px-3 text-xs font-semibold transition ${
                    activeFilter === filter.key
                      ? "border-slate-900 bg-slate-900 text-white"
                      : "hover:shadow-sm"
                  }`}
                  style={
                    activeFilter === filter.key
                      ? undefined
                      : {
                          borderColor: "var(--border-color)",
                          background: "var(--bg-soft)",
                          color: "var(--text-muted)",
                        }
                  }
                  dangerouslySetInnerHTML={{ __html: filter.label }}
                />
              ))}
            </div>
          </div>
        </section>

        {error ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm font-medium text-rose-700">
            {error}
          </div>
        ) : null}

        <section className="max-h-[62vh] space-y-2 overflow-y-auto pr-1">
          {loading ? (
            <div
              className="rounded-2xl border p-5 text-sm"
              style={{
                borderColor: "var(--border-color)",
                background: "var(--bg-card)",
                color: "var(--text-muted)",
              }}
            >
              Cargando inscritos...
            </div>
          ) : filteredAttendees.length === 0 ? (
            <div
              className="rounded-2xl border p-5 text-sm"
              style={{
                borderColor: "var(--border-color)",
                background: "var(--bg-card)",
                color: "var(--text-muted)",
              }}
            >
              No hay inscritos para mostrar con estos filtros.
            </div>
          ) : (
            filteredAttendees.map((attendee) => {
              const isCompleted = attendee.status === "completed";
              const isNoShow = attendee.status === "no_show";
              const isRescheduled = attendee.status === "rescheduled";
              const isCanceled = attendee.status === "canceled";
              const isSaving = savingId === attendee.id;

              return (
                <article
                  key={attendee.id}
                  className={`rounded-2xl border p-4 transition ${getAttendeeCardClass(
                    attendee.status
                  )}`}
                >
                  <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="truncate text-sm font-semibold" style={{ color: "var(--text-main)" }}>
                          {attendee.customer_name}
                        </h2>
                        <span className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${getStatusClass(attendee.status)}`}>
                          <span dangerouslySetInnerHTML={{ __html: getStatusLabel(attendee.status) }} />
                        </span>
                      </div>
                      <div className="mt-1 grid gap-0.5 text-xs" style={{ color: "var(--text-muted)" }}>
                        <p className="truncate">{attendee.customer_email || "Email no disponible"}</p>
                        <p className="truncate">{attendee.customer_phone || "Telefono no disponible"}</p>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => updateStatus(attendee.id, "completed")}
                        disabled={isCanceled || isSaving || isCompleted}
                        className="inline-flex h-9 items-center justify-center rounded-xl bg-emerald-600 px-3 text-xs font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        Asisti&oacute;
                      </button>
                      <button
                        type="button"
                        onClick={() => updateStatus(attendee.id, "no_show")}
                        disabled={isCanceled || isSaving || isNoShow}
                        className="inline-flex h-9 items-center justify-center rounded-xl bg-amber-500 px-3 text-xs font-semibold text-white transition hover:bg-amber-600 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        No asisti&oacute;
                      </button>
                      <button
                        type="button"
                        onClick={() => updateStatus(attendee.id, "rescheduled")}
                        disabled={isCanceled || isSaving || isRescheduled}
                        className="inline-flex h-9 items-center justify-center rounded-xl border px-3 text-xs font-semibold disabled:cursor-not-allowed disabled:opacity-60"
                        style={{
                          borderColor: "var(--border-color)",
                          background: "var(--bg-soft)",
                          color: "var(--text-muted)",
                        }}
                      >
                        Reagend&oacute;
                      </button>
                    </div>
                  </div>
                </article>
              );
            })
          )}
        </section>
      </div>
    </main>
  );
}
