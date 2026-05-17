"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { CSSProperties, useEffect, useMemo, useState } from "react";

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

type StatusTone = {
  border: string;
  background: string;
  text: string;
  softText: string;
  solid: string;
  solidHover: string;
  shadow: string;
};

function getStatusTone(status: string): StatusTone {
  switch (status) {
    case "completed":
      return {
        border: "rgba(16,185,129,0.58)",
        background:
          "linear-gradient(135deg, rgba(16,185,129,0.22), color-mix(in srgb, var(--bg-card) 82%, rgba(16,185,129,0.16)))",
        text: "#047857",
        softText: "color-mix(in srgb, var(--text-main) 82%, #059669 18%)",
        solid: "#059669",
        solidHover: "#047857",
        shadow: "0 14px 32px -24px rgba(16,185,129,0.95)",
      };
    case "no_show":
      return {
        border: "rgba(245,158,11,0.62)",
        background:
          "linear-gradient(135deg, rgba(245,158,11,0.24), color-mix(in srgb, var(--bg-card) 82%, rgba(245,158,11,0.18)))",
        text: "#b45309",
        softText: "color-mix(in srgb, var(--text-main) 82%, #d97706 18%)",
        solid: "#d97706",
        solidHover: "#b45309",
        shadow: "0 14px 32px -24px rgba(245,158,11,0.95)",
      };
    case "rescheduled":
      return {
        border: "rgba(124,58,237,0.6)",
        background:
          "linear-gradient(135deg, rgba(124,58,237,0.22), color-mix(in srgb, var(--bg-card) 82%, rgba(59,130,246,0.16)))",
        text: "#6d28d9",
        softText: "color-mix(in srgb, var(--text-main) 82%, #7c3aed 18%)",
        solid: "#7c3aed",
        solidHover: "#6d28d9",
        shadow: "0 14px 32px -24px rgba(124,58,237,0.9)",
      };
    case "canceled":
      return {
        border: "rgba(100,116,139,0.58)",
        background:
          "linear-gradient(135deg, rgba(100,116,139,0.2), color-mix(in srgb, var(--bg-card) 84%, rgba(100,116,139,0.16)))",
        text: "#475569",
        softText: "color-mix(in srgb, var(--text-main) 78%, #64748b 22%)",
        solid: "#64748b",
        solidHover: "#475569",
        shadow: "0 14px 32px -24px rgba(100,116,139,0.8)",
      };
    default:
      return {
        border: "rgba(14,165,233,0.56)",
        background:
          "linear-gradient(135deg, rgba(14,165,233,0.18), color-mix(in srgb, var(--bg-card) 84%, rgba(37,99,235,0.14)))",
        text: "#0369a1",
        softText: "color-mix(in srgb, var(--text-main) 84%, #0284c7 16%)",
        solid: "#2563eb",
        solidHover: "#1d4ed8",
        shadow: "0 14px 32px -24px rgba(37,99,235,0.85)",
      };
  }
}

function getAttendeeCardStyle(status: string): CSSProperties {
  const tone = getStatusTone(status);

  return {
    borderColor: tone.border,
    background: tone.background,
    boxShadow: `${tone.shadow}, inset 0 1px 0 rgba(255,255,255,0.04)`,
  };
}

function getStatusBadgeStyle(status: string): CSSProperties {
  const tone = getStatusTone(status);

  return {
    borderColor: tone.border,
    background: "color-mix(in srgb, var(--bg-card) 72%, transparent)",
    color: tone.softText,
  };
}

function getStatusButtonStyle(status: string, active: boolean): CSSProperties {
  const tone = getStatusTone(status);

  if (active) {
    return {
      borderColor: tone.solid,
      background: `linear-gradient(135deg, ${tone.solid}, ${tone.solidHover})`,
      color: "white",
      boxShadow: tone.shadow,
    };
  }

  return {
    borderColor: tone.border,
    background: "color-mix(in srgb, var(--bg-card) 86%, transparent)",
    color: tone.softText,
  };
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
  const attendanceStats = {
    completed: attendees.filter((attendee) => attendee.status === "completed").length,
    noShow: attendees.filter((attendee) => attendee.status === "no_show").length,
    rescheduled: attendees.filter((attendee) => attendee.status === "rescheduled").length,
    pending: attendees.filter((attendee) => attendee.status === "booked").length,
  };
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

            <div className="flex flex-wrap gap-2 lg:justify-end">
              {[
                {
                  label: "Asistieron",
                  value: attendanceStats.completed,
                  status: "completed",
                },
                {
                  label: "No asistieron",
                  value: attendanceStats.noShow,
                  status: "no_show",
                },
                {
                  label: "Reagendaron",
                  value: attendanceStats.rescheduled,
                  status: "rescheduled",
                },
                {
                  label: "Pendientes",
                  value: attendanceStats.pending,
                  status: "booked",
                },
              ].map((stat) => (
                <span
                  key={stat.label}
                  className="inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-semibold"
                  style={getStatusBadgeStyle(stat.status)}
                >
                  <span>{stat.label}</span>
                  <span className="text-sm" style={{ color: "var(--text-main)" }}>
                    {stat.value}
                  </span>
                </span>
              ))}
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
              const attendeeTone = getStatusTone(attendee.status);

              return (
                <article
                  key={attendee.id}
                  className="rounded-2xl border p-4 transition"
                  style={getAttendeeCardStyle(attendee.status)}
                >
                  <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="truncate text-sm font-semibold" style={{ color: "var(--text-main)" }}>
                          {attendee.customer_name}
                        </h2>
                        <span
                          className="rounded-full border px-2.5 py-1 text-[11px] font-semibold"
                          style={getStatusBadgeStyle(attendee.status)}
                        >
                          <span dangerouslySetInnerHTML={{ __html: getStatusLabel(attendee.status) }} />
                        </span>
                      </div>
                      <div className="mt-1 grid gap-0.5 text-xs" style={{ color: attendeeTone.softText }}>
                        <p className="truncate">{attendee.customer_email || "Email no disponible"}</p>
                        <p className="truncate">{attendee.customer_phone || "Telefono no disponible"}</p>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => updateStatus(attendee.id, "completed")}
                        disabled={isCanceled || isSaving || isCompleted}
                        className="inline-flex h-9 items-center justify-center rounded-xl border px-3 text-xs font-semibold transition hover:shadow-sm disabled:cursor-not-allowed"
                        style={{
                          ...getStatusButtonStyle("completed", isCompleted),
                          opacity: isCanceled ? 0.55 : 1,
                        }}
                      >
                        Asisti&oacute;
                      </button>
                      <button
                        type="button"
                        onClick={() => updateStatus(attendee.id, "no_show")}
                        disabled={isCanceled || isSaving || isNoShow}
                        className="inline-flex h-9 items-center justify-center rounded-xl border px-3 text-xs font-semibold transition hover:shadow-sm disabled:cursor-not-allowed"
                        style={{
                          ...getStatusButtonStyle("no_show", isNoShow),
                          opacity: isCanceled ? 0.55 : 1,
                        }}
                      >
                        No asisti&oacute;
                      </button>
                      <button
                        type="button"
                        onClick={() => updateStatus(attendee.id, "rescheduled")}
                        disabled={isCanceled || isSaving || isRescheduled}
                        className="inline-flex h-9 items-center justify-center rounded-xl border px-3 text-xs font-semibold transition hover:shadow-sm disabled:cursor-not-allowed"
                        style={{
                          ...getStatusButtonStyle("rescheduled", isRescheduled),
                          opacity: isCanceled ? 0.55 : 1,
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
