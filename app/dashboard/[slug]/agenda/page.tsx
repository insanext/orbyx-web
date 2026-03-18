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

      setAppointments(data.appointments || []);
    } catch (err: any) {
      setError("Error cargando agenda");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (slug) loadAppointments();
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

    return result;
  }, [appointments, weekDays]);

  function getCardClass(appt: Appointment, selected: boolean) {
    if (selected) return "border-slate-900 bg-slate-900 text-white";

    if (appt.status === "completed")
      return "border-emerald-400 bg-emerald-100";

    if (appt.status === "no_show")
      return "border-amber-400 bg-amber-100";

    if (appt.status === "canceled")
      return "border-slate-300 bg-slate-200 opacity-70";

    return "border-slate-200 bg-white";
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Agenda semanal" />

      <Panel>
        {loading ? (
          <p>Cargando...</p>
        ) : (
          <div className="grid grid-cols-7 gap-3">
            {weekDays.map((day) => {
              const key = formatDateYYYYMMDD(day);
              const dayAppointments = appointmentsByDay[key] || [];
              const slots = generateDaySlots(day);

              return (
                <div key={key} className="bg-slate-50 p-3 rounded-2xl">
                  <div className="mb-3 text-sm font-semibold">
                    {day.toLocaleDateString("es-CL", {
                      weekday: "short",
                    })}
                  </div>

                  <div className="space-y-2">
                    {slots.map((slot) => {
                      const appt = dayAppointments.find(
                        (a) =>
                          new Date(a.start_at).getTime() ===
                          new Date(slot).getTime()
                      );

                      if (!appt) {
                        return (
                          <div
                            key={slot}
                            className="text-xs text-slate-400 text-center border border-dashed p-2 rounded-xl"
                          >
                            Libre
                          </div>
                        );
                      }

                      return (
                        <button
                          key={appt.id}
                          onClick={() => setSelectedAppointment(appt)}
                          className={`w-full p-3 rounded-xl border text-left ${getCardClass(
                            appt,
                            selectedAppointment?.id === appt.id
                          )}`}
                        >
                          <div className="text-xs">
                            {formatHour(appt.start_at)}
                          </div>

                          <div className="text-sm font-semibold">
                            {appt.customer_name}
                          </div>
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
    </div>
  );
}