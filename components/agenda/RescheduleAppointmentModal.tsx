"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, ChevronLeft, ChevronRight, X } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { BACKEND_URL } from "@/lib/backend-url";
import { DateInputDMY } from "@/components/ui/date-input-dmy";
import Select from "@/components/ui/Select";

// Modal "Cambiar fecha/hora" del detalle de una cita (Agenda). Mueve la MISMA
// cita (PATCH /appointments/:id/reschedule): conserva depósito, extras, notas
// e historial, y avisa por correo a la clienta. Los horarios libres salen de
// GET /dashboard/reschedule-slots y el aviso de una hora escrita a mano de
// GET /dashboard/reschedule-check (ambos del panel, no del endpoint público).

export type RescheduleAppointment = {
  id: string;
  start_at: string;
  end_at: string;
  staff_id?: string | null;
  customer_name: string;
  customer_email?: string | null;
  service_name_snapshot?: string | null;
};

type StaffOption = { id: string; name: string };

type Slot = { slot_start: string; slot_end?: string };

type CheckState = {
  key: string;
  status: "loading" | "done";
  error?: string;
  outOfHours?: boolean;
  reason?: string | null;
};

const OUT_OF_HOURS_REASON_LABEL: Record<string, string> = {
  antes_apertura: "Es antes de la hora de apertura.",
  despues_cierre: "Termina después de la hora de cierre.",
  dia_cerrado: "Ese día está cerrado.",
  bloqueo: "Cae sobre un horario bloqueado.",
};

const TZ = "America/Santiago";

function santiagoDateKey(value: string | Date) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(value));
}

function santiagoTime(value: string | Date) {
  return new Date(value).toLocaleTimeString("es-CL", {
    timeZone: TZ,
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  });
}

function longDate(dateKey: string) {
  const text = new Date(`${dateKey}T12:00:00`).toLocaleDateString("es-CL", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function shiftDateKey(dateKey: string, days: number) {
  const d = new Date(`${dateKey}T12:00:00`);
  d.setDate(d.getDate() + days);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

const inputStyle = {
  borderColor: "var(--border-color)",
  background: "var(--bg-soft)",
  color: "var(--text-main)",
} as const;

export default function RescheduleAppointmentModal({
  appointment,
  staffList,
  onClose,
  onRescheduled,
}: {
  appointment: RescheduleAppointment;
  staffList: StaffOption[];
  onClose: () => void;
  // Se llama apenas el cambio queda guardado (la Agenda refresca su estado);
  // el modal sigue abierto mostrando el resultado hasta que se cierre.
  onRescheduled: (updated: unknown) => void;
}) {
  const todayKey = santiagoDateKey(new Date());
  const [date, setDate] = useState(() => {
    const original = santiagoDateKey(appointment.start_at);
    return original < todayKey ? todayKey : original;
  });
  const [staffId, setStaffId] = useState(appointment.staff_id || "");
  const [serviceStaffIds, setServiceStaffIds] = useState<string[] | null>(null);

  const [slots, setSlots] = useState<Slot[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [slotsError, setSlotsError] = useState("");

  // time = hora elegida (HH:MM); manualOpen = modo "Otra hora".
  const [time, setTime] = useState("");
  const [manualOpen, setManualOpen] = useState(false);
  const [manualTime, setManualTime] = useState("");
  const [manualError, setManualError] = useState("");

  const [check, setCheck] = useState<CheckState | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [confirmOutOfHours, setConfirmOutOfHours] = useState<string | null | undefined>(undefined);
  const [result, setResult] = useState<{
    startAt: string;
    emailStatus: string;
  } | null>(null);

  const staffOptions = useMemo(
    () =>
      serviceStaffIds
        ? staffList.filter((staff) => serviceStaffIds.includes(staff.id))
        : staffList.filter((staff) => staff.id === appointment.staff_id),
    [serviceStaffIds, staffList, appointment.staff_id]
  );

  // Horarios libres del día para ese profesional (la propia cita no cuenta
  // como ocupada).
  useEffect(() => {
    let cancelled = false;
    setSlotsLoading(true);
    setSlotsError("");
    (async () => {
      try {
        const q = new URLSearchParams({ appointment_id: appointment.id, date });
        if (staffId) q.set("staff_id", staffId);
        const res = await apiFetch(`${BACKEND_URL}/dashboard/reschedule-slots?${q.toString()}`, {
          cache: "no-store",
        });
        const data = await res.json().catch(() => null);
        if (cancelled) return;
        if (!res.ok) {
          setSlots([]);
          setSlotsError(data?.error || "No se pudieron cargar los horarios.");
          return;
        }
        setSlots(Array.isArray(data?.slots) ? data.slots : []);
        if (Array.isArray(data?.service_staff_ids)) setServiceStaffIds(data.service_staff_ids);
      } catch {
        if (!cancelled) {
          setSlots([]);
          setSlotsError("No se pudieron cargar los horarios.");
        }
      } finally {
        if (!cancelled) setSlotsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [appointment.id, date, staffId]);

  // Cambiar el día o el profesional descarta la hora ya elegida.
  useEffect(() => {
    setTime("");
    setManualTime("");
    setManualError("");
    setManualOpen(false);
    setCheck(null);
    setError("");
  }, [date, staffId]);

  // Aviso inmediato (cruce con otra cita / fuera de horario / hora pasada).
  useEffect(() => {
    if (!time) {
      setCheck(null);
      return;
    }
    const key = `${date}|${staffId}|${time}`;
    setCheck({ key, status: "loading" });
    let cancelled = false;
    const timer = window.setTimeout(async () => {
      try {
        const q = new URLSearchParams({ appointment_id: appointment.id, date, time });
        if (staffId) q.set("staff_id", staffId);
        const res = await apiFetch(`${BACKEND_URL}/dashboard/reschedule-check?${q.toString()}`, {
          cache: "no-store",
        });
        const data = await res.json().catch(() => null);
        if (cancelled) return;
        if (!res.ok) {
          setCheck({ key, status: "done", error: data?.error || "No se pudo revisar ese horario." });
          return;
        }
        setCheck({
          key,
          status: "done",
          outOfHours: Boolean(data?.out_of_hours),
          reason: data?.out_of_hours_reason ?? null,
        });
      } catch {
        // Si la revisión falla no se bloquea: el servidor valida igual al guardar.
        if (!cancelled) setCheck({ key, status: "done" });
      }
    }, 300);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [appointment.id, date, staffId, time]);

  // Campo de hora enmascarado 24 h (mismo criterio que "Otra hora" de la
  // reserva manual): el <input type="time"> nativo muestra AM/PM según el
  // navegador. Solo se acepta HH:MM válida y de 5 en 5 minutos.
  function handleManualChange(rawValue: string) {
    let digits = rawValue.replace(/\D/g, "").slice(0, 4);
    if (
      rawValue.length < manualTime.length &&
      manualTime.includes(":") &&
      !rawValue.includes(":") &&
      digits.length >= 3
    ) {
      digits = digits.slice(0, 1) + digits.slice(2);
    }
    const text = digits.length > 2 ? `${digits.slice(0, 2)}:${digits.slice(2)}` : digits;
    setManualTime(text);

    let valid = "";
    let errorText = "";
    if (digits.length === 4) {
      const hours = Number(digits.slice(0, 2));
      const minutes = Number(digits.slice(2));
      if (hours > 23 || minutes > 59) errorText = "Hora no válida";
      else if (minutes % 5 !== 0) errorText = "Usa minutos de 5 en 5 (ej. 19:10 o 19:15)";
      else valid = text;
    }
    setManualError(errorText);
    setTime(valid);
  }

  async function submit(forceOutOfHours: boolean) {
    if (saving || !time) return;
    setSaving(true);
    setError("");
    try {
      const res = await apiFetch(`${BACKEND_URL}/appointments/${appointment.id}/reschedule`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date,
          time,
          ...(staffId ? { staff_id: staffId } : {}),
          ...(forceOutOfHours ? { forzar_fuera_horario: true } : {}),
        }),
      });
      const data = await res.json().catch(() => null);

      if (res.status === 409 && data?.requires_confirmation) {
        setConfirmOutOfHours(data?.out_of_hours_reason ?? null);
        return;
      }
      if (!res.ok) {
        setError(data?.error || "No se pudo reagendar la cita.");
        return;
      }

      setConfirmOutOfHours(undefined);
      const emailState = String(data?.notifications?.email || "");
      setResult({
        startAt: data?.appointment?.start_at || "",
        emailStatus: emailState,
      });
      onRescheduled(data?.appointment);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo reagendar la cita.");
    } finally {
      setSaving(false);
    }
  }

  const checkCurrent = check && time && check.key === `${date}|${staffId}|${time}` ? check : null;
  const blockingError = checkCurrent?.status === "done" ? checkCurrent.error : undefined;
  const canSubmit = Boolean(time) && !saving && !slotsLoading && !blockingError && checkCurrent?.status === "done";

  const emailMessage = (() => {
    if (!result) return "";
    if (result.emailStatus === "sent") return "Le avisamos a la clienta por correo.";
    if (result.emailStatus === "skipped_no_email") return "La clienta no tiene correo: no se envió aviso.";
    if (result.emailStatus === "skipped_demo") return "Negocio de demostración: no se envían avisos.";
    return "No pudimos enviar el correo de aviso. Avísale a la clienta por otro medio.";
  })();

  return (
    <div className="fixed inset-0 z-[90] flex items-end justify-center bg-slate-950/50 px-0 sm:items-center sm:px-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Cambiar fecha y hora de la cita"
        className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-t-3xl border p-5 shadow-2xl sm:rounded-3xl"
        style={{ borderColor: "var(--border-color)", background: "var(--bg-card)" }}
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="text-lg font-semibold" style={{ color: "var(--text-main)" }}>
              {result ? "Cita reagendada" : "Cambiar fecha/hora"}
            </h3>
            <p className="mt-1 truncate text-sm" style={{ color: "var(--text-muted)" }}>
              {appointment.customer_name}
              {appointment.service_name_snapshot ? ` · ${appointment.service_name_snapshot}` : ""}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border transition hover:shadow-sm"
            style={inputStyle}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {result ? (
          <div className="space-y-3">
            <div
              className="rounded-xl border p-3 text-sm"
              style={{ borderColor: "var(--border-color)", background: "var(--bg-soft)", color: "var(--text-main)" }}
            >
              <p className="flex items-center gap-2 font-semibold">
                <Check className="h-4 w-4 text-emerald-500" />
                Nueva hora: {result.startAt ? `${longDate(santiagoDateKey(result.startAt))} · ${santiagoTime(result.startAt)}` : ""}
              </p>
              <p className="mt-1 text-xs" style={{ color: "var(--text-muted)" }}>
                Antes: {longDate(santiagoDateKey(appointment.start_at))} · {santiagoTime(appointment.start_at)}
              </p>
              <p className="mt-2 text-xs" style={{ color: "var(--text-muted)" }}>
                {emailMessage}
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-10 w-full items-center justify-center rounded-xl px-4 text-sm font-semibold text-white transition hover:brightness-110"
              style={{ background: "var(--accent-solid, #2563eb)", color: "#ffffff" }}
            >
              Listo
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div
              className="rounded-xl border px-3 py-2 text-xs"
              style={{ borderColor: "var(--border-color)", background: "var(--bg-soft)", color: "var(--text-muted)" }}
            >
              Hora actual: <strong style={{ color: "var(--text-main)" }}>{longDate(santiagoDateKey(appointment.start_at))} · {santiagoTime(appointment.start_at)}</strong>
            </div>

            {staffOptions.length > 1 || !staffId ? (
              <div>
                <label
                  className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.16em]"
                  style={{ color: "var(--text-muted)" }}
                >
                  Profesional
                </label>
                <Select
                  value={staffId}
                  onChange={(e) => setStaffId(e.target.value)}
                  className="h-10 w-full rounded-xl border px-3 text-sm outline-none transition"
                  style={inputStyle}
                >
                  {!staffId ? <option value="">Elige un profesional</option> : null}
                  {staffOptions.map((staff) => (
                    <option key={staff.id} value={staff.id}>
                      {staff.name}
                    </option>
                  ))}
                </Select>
              </div>
            ) : null}

            <div>
              <label
                className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.16em]"
                style={{ color: "var(--text-muted)" }}
              >
                Nuevo día
              </label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  aria-label="Día anterior"
                  disabled={date <= todayKey}
                  onClick={() => setDate((prev) => shiftDateKey(prev, -1))}
                  className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border transition disabled:cursor-not-allowed disabled:opacity-50"
                  style={inputStyle}
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <DateInputDMY
                  value={date}
                  min={todayKey}
                  onChange={(e) => {
                    if (e.target.value && e.target.value >= todayKey) setDate(e.target.value);
                  }}
                  className="h-10 min-w-0 flex-1 rounded-xl border px-3 text-sm outline-none"
                  style={inputStyle}
                />
                <button
                  type="button"
                  aria-label="Día siguiente"
                  onClick={() => setDate((prev) => shiftDateKey(prev, 1))}
                  className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border transition"
                  style={inputStyle}
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
              <p className="mt-1 text-xs" style={{ color: "var(--text-muted)" }}>
                {longDate(date)}
              </p>
            </div>

            <div>
              <label
                className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.16em]"
                style={{ color: "var(--text-muted)" }}
              >
                Nueva hora
              </label>
              {slotsLoading ? (
                <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                  Cargando horarios...
                </p>
              ) : slotsError ? (
                <p role="alert" className="text-sm font-medium text-rose-500">
                  {slotsError}
                </p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {slots.map((slot) => {
                    const label = santiagoTime(slot.slot_start);
                    const selected = !manualOpen && time === label;
                    return (
                      <button
                        key={slot.slot_start}
                        type="button"
                        aria-pressed={selected}
                        onClick={() => {
                          setManualOpen(false);
                          setManualTime("");
                          setManualError("");
                          setTime(label);
                        }}
                        className="inline-flex h-9 items-center justify-center rounded-xl border px-3 text-sm font-semibold transition"
                        style={
                          selected
                            ? { borderColor: "var(--accent-solid, #4f46e5)", background: "var(--accent-solid, #4f46e5)", color: "#fff" }
                            : inputStyle
                        }
                      >
                        {label}
                      </button>
                    );
                  })}
                  <button
                    type="button"
                    aria-pressed={manualOpen}
                    onClick={() => {
                      setManualOpen(true);
                      setTime("");
                    }}
                    className="inline-flex h-9 items-center justify-center rounded-xl border px-3 text-sm font-semibold transition"
                    style={
                      manualOpen && time
                        ? { borderColor: "var(--accent-solid, #4f46e5)", background: "var(--accent-solid, #4f46e5)", color: "#fff" }
                        : inputStyle
                    }
                  >
                    {manualOpen && time ? time : "Otra hora"}
                  </button>
                  {slots.length === 0 ? (
                    <p className="w-full text-xs" style={{ color: "var(--text-muted)" }}>
                      No hay horarios libres este día. Prueba otro día o usa «Otra hora».
                    </p>
                  ) : null}
                </div>
              )}

              {manualOpen ? (
                <div className="mt-3">
                  <input
                    type="text"
                    inputMode="numeric"
                    autoComplete="off"
                    placeholder="HH:MM"
                    maxLength={5}
                    value={manualTime}
                    onChange={(e) => handleManualChange(e.target.value)}
                    aria-label="Hora manual (24 h, de 5 en 5 minutos)"
                    className="h-10 w-40 rounded-xl border px-3 text-sm outline-none transition"
                    style={inputStyle}
                  />
                  {manualError ? (
                    <p role="alert" className="mt-1 text-xs font-medium text-rose-500">
                      {manualError}
                    </p>
                  ) : null}
                  <p className="mt-1 text-xs" style={{ color: "var(--text-muted)" }}>
                    Formato 24 h, de 5 en 5 minutos (ej. 19:15).
                  </p>
                </div>
              ) : null}
            </div>

            {checkCurrent?.status === "loading" ? (
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                Revisando horario...
              </p>
            ) : null}
            {blockingError ? (
              <p role="alert" className="rounded-xl border border-rose-300 bg-rose-50 px-3 py-2 text-xs font-medium text-rose-700">
                {blockingError}
              </p>
            ) : null}
            {checkCurrent?.status === "done" && checkCurrent.outOfHours && !blockingError ? (
              <p className="rounded-xl border border-amber-300 bg-amber-50 px-3 py-2 text-xs font-medium text-amber-800">
                Esta hora queda fuera de tu horario de atención.
                {checkCurrent.reason ? ` ${OUT_OF_HOURS_REASON_LABEL[checkCurrent.reason] || ""}` : ""} Te pediremos
                confirmar.
              </p>
            ) : null}

            {error ? (
              <p role="alert" className="rounded-xl border border-rose-300 bg-rose-50 px-3 py-2 text-xs font-medium text-rose-700">
                {error}
              </p>
            ) : null}

            <p className="text-xs" style={{ color: "var(--text-muted)" }}>
              Es la misma cita: se mantienen depósito, extras y notas.{" "}
              {appointment.customer_email
                ? "Le avisaremos a la clienta por correo."
                : "La clienta no tiene correo: no recibirá aviso."}
            </p>

            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={onClose}
                className="inline-flex h-10 items-center justify-center rounded-xl border px-4 text-sm font-semibold transition hover:shadow-sm"
                style={inputStyle}
              >
                Volver
              </button>
              <button
                type="button"
                onClick={() => submit(false)}
                disabled={!canSubmit}
                className="inline-flex h-10 items-center justify-center rounded-xl px-4 text-sm font-semibold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
                style={{ background: "var(--accent-solid, #2563eb)", color: "#ffffff" }}
              >
                {saving ? "Reagendando..." : "Reagendar"}
              </button>
            </div>
          </div>
        )}
      </div>

      {confirmOutOfHours !== undefined ? (
        <div className="fixed inset-0 z-[95] flex items-center justify-center bg-slate-950/50 px-4">
          <div
            className="w-full max-w-md rounded-3xl border p-5 shadow-2xl"
            style={{ borderColor: "var(--border-color)", background: "var(--bg-card)" }}
          >
            <h3 className="text-lg font-semibold" style={{ color: "var(--text-main)" }}>
              Fuera de tu horario de atención
            </h3>
            <p className="mt-2 text-sm leading-6" style={{ color: "var(--text-muted)" }}>
              {confirmOutOfHours ? OUT_OF_HOURS_REASON_LABEL[confirmOutOfHours] || "" : ""} ¿Quieres reagendar la
              cita a esa hora igual?
            </p>
            <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setConfirmOutOfHours(undefined)}
                className="inline-flex h-10 items-center justify-center rounded-xl border px-4 text-sm font-semibold transition hover:shadow-sm"
                style={inputStyle}
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  setConfirmOutOfHours(undefined);
                  void submit(true);
                }}
                disabled={saving}
                className="inline-flex h-10 items-center justify-center rounded-xl px-4 text-sm font-semibold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
                style={{ background: "var(--accent-solid, #2563eb)", color: "#ffffff" }}
              >
                Reagendar igual
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
