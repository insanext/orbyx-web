"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { PageHeader } from "../../../../components/dashboard/page-header";
import { Panel } from "../../../../components/dashboard/panel";

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

type BusinessResponse = {
  business: {
    id: string;
    name: string;
    slug: string;
  };
  calendar_id?: string;
  google_connected?: boolean;
  plan_slug?: string | null;
};

type BranchItem = {
  id: string;
  tenant_id?: string;
  name: string;
};

type FilterValue =
  | "active"
  | "pending_close"
  | "booked"
  | "completed"
  | "no_show"
  | "canceled";

const BACKEND_URL = "https://orbyx-backend.onrender.com";

const filterLabels: Record<FilterValue, string> = {
  active: "Activas",
  pending_close: "Pendientes",
  booked: "Agendadas",
  completed: "Atendidas",
  no_show: "No asistió",
  canceled: "Canceladas",
};

export default function AgendaPage() {
  const params = useParams();
  const slug =
    ((params as { slug?: string })?.slug as string) ||
    ((params as { Slug?: string })?.Slug as string);

  const [tenantId, setTenantId] = useState("");
  const [branches, setBranches] = useState<BranchItem[]>([]);
  const [selectedBranchId, setSelectedBranchId] = useState("");
  const [loadingBranches, setLoadingBranches] = useState(false);

  const [weekBaseDate, setWeekBaseDate] = useState(new Date());
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedAppointment, setSelectedAppointment] =
    useState<Appointment | null>(null);
  const [activeFilter, setActiveFilter] = useState<FilterValue>("active");
  const [statusSaving, setStatusSaving] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [searchResults, setSearchResults] = useState<Appointment[]>([]);

  const [isEditingReservation, setIsEditingReservation] = useState(false);
  const [editSaving, setEditSaving] = useState(false);
  const [editForm, setEditForm] = useState({
    customer_name: "",
    customer_phone: "",
    customer_email: "",
  });

  const detailRef = useRef<HTMLDivElement | null>(null);

  const branchStorageKey = useMemo(() => {
    return slug ? `orbyx_active_branch_${slug}` : "";
  }, [slug]);

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
    const text = new Date(dateString).toLocaleDateString("es-CL", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });

    return text.charAt(0).toUpperCase() + text.slice(1);
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

  function formatCompactDateTime(dateString: string) {
    return new Date(dateString).toLocaleString("es-CL", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
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

  function isPastPendingClosure(appt: Appointment) {
    return (
      appt.status === "booked" &&
      new Date(appt.start_at).getTime() < Date.now()
    );
  }

  function isCanceled(appt: Appointment) {
    return appt.status === "canceled";
  }

  function isVisibleAsActive(appt: Appointment) {
    return !isCanceled(appt);
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
        return "border-sky-200 bg-sky-50 text-sky-700";
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
        return "border-rose-500 bg-gradient-to-br from-rose-500 to-rose-600 text-white shadow-lg";
      }

      if (visualStatus === "completed") {
        return "border-emerald-500 bg-gradient-to-br from-emerald-500 to-emerald-600 text-white shadow-lg";
      }

      if (visualStatus === "no_show") {
        return "border-amber-500 bg-gradient-to-br from-amber-500 to-amber-600 text-white shadow-lg";
      }

      if (visualStatus === "canceled") {
        return "border-slate-500 bg-gradient-to-br from-slate-500 to-slate-600 text-white shadow-lg";
      }

      return "border-slate-900 bg-gradient-to-br from-slate-800 to-slate-900 text-white shadow-lg";
    }

    if (visualStatus === "pending_close") {
      return "border-rose-200 bg-rose-50 text-slate-900 hover:border-rose-300 hover:bg-rose-100";
    }

    if (visualStatus === "completed") {
      return "border-emerald-200 bg-emerald-50 text-slate-900 hover:border-emerald-300";
    }

    if (visualStatus === "no_show") {
      return "border-amber-200 bg-amber-50 text-slate-900 hover:border-amber-300";
    }

    if (visualStatus === "canceled") {
      return "border-slate-200 bg-slate-100 text-slate-600 opacity-80 hover:border-slate-300";
    }

    return "border-slate-200 bg-white text-slate-900 hover:border-sky-300 hover:bg-sky-50";
  }

  function matchesFilter(appt: Appointment, filter: FilterValue) {
    if (filter === "active") return isVisibleAsActive(appt);
    if (filter === "pending_close") return isPastPendingClosure(appt);
    if (filter === "booked") {
      return appt.status === "booked" && !isPastPendingClosure(appt);
    }
    if (filter === "completed") return appt.status === "completed";
    if (filter === "no_show") return appt.status === "no_show";
    if (filter === "canceled") return appt.status === "canceled";
    return true;
  }

  function getFilterButtonClasses(
    filter: FilterValue,
    active: boolean,
    count: number
  ) {
    if (filter === "pending_close") {
      if (active) {
        return "inline-flex h-8 items-center justify-center rounded-lg border border-rose-600 bg-rose-600 px-3 text-xs font-semibold text-white shadow-sm transition hover:bg-rose-700";
      }

      if (count > 0) {
        return "inline-flex h-8 items-center justify-center rounded-lg border border-rose-300 bg-rose-50 px-3 text-xs font-semibold text-rose-700 shadow-sm transition hover:border-rose-400 hover:bg-rose-100";
      }

      return "inline-flex h-8 items-center justify-center rounded-lg border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 transition hover:bg-slate-50";
    }

    if (filter === "canceled") {
      if (active) {
        return "inline-flex h-8 items-center justify-center rounded-lg border border-slate-700 bg-slate-700 px-3 text-xs font-semibold text-white shadow-sm transition hover:bg-slate-800";
      }

      if (count > 0) {
        return "inline-flex h-8 items-center justify-center rounded-lg border border-slate-300 bg-slate-100 px-3 text-xs font-semibold text-slate-700 shadow-sm transition hover:border-slate-400 hover:bg-slate-200";
      }

      return "inline-flex h-8 items-center justify-center rounded-lg border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 transition hover:bg-slate-50";
    }

    if (active) {
      return "inline-flex h-8 items-center justify-center rounded-lg bg-slate-900 px-3 text-xs font-medium text-white transition hover:bg-slate-800";
    }

    return "inline-flex h-8 items-center justify-center rounded-lg border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 transition hover:bg-slate-50";
  }

  function syncEditForm(appt: Appointment | null) {
    setEditForm({
      customer_name: appt?.customer_name || "",
      customer_phone: appt?.customer_phone || "",
      customer_email: appt?.customer_email || "",
    });
  }

  function handleSelectAppointment(appt: Appointment) {
    setSelectedAppointment(appt);
    setIsEditingReservation(false);
    syncEditForm(appt);

    setTimeout(() => {
      detailRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 80);
  }

  function readStoredBranchId() {
    if (typeof window === "undefined" || !branchStorageKey) return "";
    return localStorage.getItem(branchStorageKey) || "";
  }

  function applyAppointmentUpdate(updatedAppointment: Appointment) {
    setAppointments((prev) =>
      prev.map((appt) =>
        appt.id === updatedAppointment.id ? updatedAppointment : appt
      )
    );

    setSearchResults((prev) =>
      prev.map((appt) =>
        appt.id === updatedAppointment.id ? updatedAppointment : appt
      )
    );

    setSelectedAppointment((prev) =>
      prev && prev.id === updatedAppointment.id ? updatedAppointment : prev
    );
  }

  async function loadBranches(currentTenantId: string) {
    try {
      setLoadingBranches(true);

      const response = await fetch(
        `${BACKEND_URL}/branches?tenant_id=${currentTenantId}`
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || "No se pudieron cargar las sucursales");
      }

      const rows: BranchItem[] = Array.isArray(data?.branches)
        ? data.branches
        : [];

      setBranches(rows);

      if (rows.length === 0) {
        setSelectedBranchId("");
        return;
      }

      const storedBranchId = readStoredBranchId();
      const storedExists = rows.some((branch) => branch.id === storedBranchId);

      if (storedExists) {
        setSelectedBranchId(storedBranchId);
        return;
      }

      const fallbackBranchId = rows[0].id;
      setSelectedBranchId(fallbackBranchId);

      if (typeof window !== "undefined" && branchStorageKey) {
        localStorage.setItem(branchStorageKey, fallbackBranchId);
      }
    } catch (err) {
      console.error("Error cargando sucursales", err);
      setBranches([]);
      setSelectedBranchId("");
    } finally {
      setLoadingBranches(false);
    }
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

      if (!selectedBranchId) {
        setAppointments([]);
        setSelectedAppointment(null);
        return;
      }

      const from = formatDateYYYYMMDD(weekStart);
      const to = formatDateYYYYMMDD(weekEnd);

      const query = new URLSearchParams({
        from,
        to,
        branch_id: selectedBranchId,
      });

      const res = await fetch(
        `${BACKEND_URL}/appointments/by-range/${slug}?${query.toString()}`
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "No se pudo cargar la agenda");
      }

      const rows: Appointment[] = Array.isArray(data.appointments)
        ? data.appointments
        : [];

      setAppointments(rows);

      if (selectedAppointment) {
        const updatedSelected = rows.find(
          (appt) => appt.id === selectedAppointment.id
        );

        if (updatedSelected) {
          setSelectedAppointment(updatedSelected);
          if (!isEditingReservation) {
            syncEditForm(updatedSelected);
          }
        } else if (!options?.preserveSelected) {
          setSelectedAppointment(null);
        }
      }

      if (!options?.preserveSelected && rows.length === 0) {
        setSelectedAppointment(null);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error cargando agenda");
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

      if (data?.appointment) {
        applyAppointmentUpdate(data.appointment);
      }

      await loadAppointments({ preserveSelected: true });
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "Error actualizando estado"
      );
    } finally {
      setStatusSaving(false);
    }
  }

  async function handleSearchAppointments() {
    try {
      setSearchLoading(true);
      setSearchError("");

      const trimmedQuery = searchQuery.trim();

      if (trimmedQuery.length < 2) {
        setSearchResults([]);
        setSearchError("Ingresa al menos 2 caracteres para buscar.");
        return;
      }

      const res = await fetch(
        `${BACKEND_URL}/appointments/search/${slug}?q=${encodeURIComponent(
          trimmedQuery
        )}`
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "No se pudo buscar reservas");
      }

      const rows: Appointment[] = Array.isArray(data.appointments)
        ? data.appointments
        : [];

      setSearchResults(rows);

      if (rows.length === 0) {
        setSearchError("No encontramos reservas con esa búsqueda.");
      }
    } catch (err: unknown) {
      setSearchResults([]);
      setSearchError(
        err instanceof Error ? err.message : "Error buscando reservas"
      );
    } finally {
      setSearchLoading(false);
    }
  }

  async function handleSaveReservationEdit() {
    try {
      if (!selectedAppointment) return;

      setEditSaving(true);
      setError("");

      const res = await fetch(`${BACKEND_URL}/appointments/${selectedAppointment.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          customer_name: editForm.customer_name.trim(),
          customer_phone: editForm.customer_phone.trim(),
          customer_email: editForm.customer_email.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "No se pudo actualizar la reserva");
      }

      const updatedAppointment: Appointment = data.appointment;
      applyAppointmentUpdate(updatedAppointment);
      syncEditForm(updatedAppointment);
      setIsEditingReservation(false);
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "Error actualizando reserva"
      );
    } finally {
      setEditSaving(false);
    }
  }

  useEffect(() => {
    if (!slug) return;

    async function loadInitial() {
      try {
        const businessRes = await fetch(`${BACKEND_URL}/public/business/${slug}`);
        const businessData: BusinessResponse | { error?: string } =
          await businessRes.json();

        if (!businessRes.ok) {
          throw new Error(
            "error" in businessData && businessData.error
              ? businessData.error
              : "No se pudo cargar el negocio"
          );
        }

        if (!("business" in businessData)) {
          throw new Error("Respuesta inválida del backend");
        }

        const currentTenantId = businessData.business.id;
        setTenantId(currentTenantId);
        await loadBranches(currentTenantId);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "No se pudo cargar agenda");
      }
    }

    loadInitial();
  }, [slug]);

  useEffect(() => {
    if (!slug) return;
    if (!selectedBranchId) {
      setAppointments([]);
      setSelectedAppointment(null);
      setLoading(false);
      return;
    }

    loadAppointments();
  }, [slug, weekStart.getTime(), selectedBranchId]);

  useEffect(() => {
    function handleBranchChanged(event: Event) {
      const customEvent = event as CustomEvent<{ slug?: string; branchId?: string }>;
      const eventSlug = customEvent.detail?.slug;
      const branchId = customEvent.detail?.branchId || "";

      if (eventSlug !== slug) return;

      setSelectedBranchId(branchId);
      setSelectedAppointment(null);
      setIsEditingReservation(false);
    }

    function handleStorage(event: StorageEvent) {
      if (event.key !== branchStorageKey) return;

      const nextBranchId = event.newValue || "";
      setSelectedBranchId(nextBranchId);
      setSelectedAppointment(null);
      setIsEditingReservation(false);
    }

    window.addEventListener(
      "orbyx-branch-changed",
      handleBranchChanged as EventListener
    );
    window.addEventListener("storage", handleStorage);

    return () => {
      window.removeEventListener(
        "orbyx-branch-changed",
        handleBranchChanged as EventListener
      );
      window.removeEventListener("storage", handleStorage);
    };
  }, [slug, branchStorageKey]);

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

  const pendingCloseAppointments = useMemo(() => {
    return appointments
      .filter(isPastPendingClosure)
      .sort(
        (a, b) =>
          new Date(a.start_at).getTime() - new Date(b.start_at).getTime()
      );
  }, [appointments]);

  const canceledAppointments = useMemo(() => {
    return appointments
      .filter((appt) => appt.status === "canceled")
      .sort(
        (a, b) =>
          new Date(a.start_at).getTime() - new Date(b.start_at).getTime()
      );
  }, [appointments]);

  const pendingCloseCount = pendingCloseAppointments.length;
  const canceledCount = canceledAppointments.length;
  const hasPendingClose = pendingCloseCount > 0;

  const counts = useMemo(() => {
    return {
      active: appointments.filter(isVisibleAsActive).length,
      pending_close: appointments.filter(isPastPendingClosure).length,
      booked: appointments.filter(
        (appt) => appt.status === "booked" && !isPastPendingClosure(appt)
      ).length,
      completed: appointments.filter((appt) => appt.status === "completed")
        .length,
      no_show: appointments.filter((appt) => appt.status === "no_show").length,
      canceled: appointments.filter((appt) => appt.status === "canceled").length,
    };
  }, [appointments]);

  function goPrevWeek() {
    setWeekBaseDate((prev) => addDays(prev, -7));
    setSelectedAppointment(null);
    setIsEditingReservation(false);
  }

  function goNextWeek() {
    setWeekBaseDate((prev) => addDays(prev, 7));
    setSelectedAppointment(null);
    setIsEditingReservation(false);
  }

  function goToday() {
    setWeekBaseDate(new Date());
    setSelectedAppointment(null);
    setIsEditingReservation(false);
  }

  const selectedBranchName =
    branches.find((branch) => branch.id === selectedBranchId)?.name || "";

  return (
    <div className="space-y-4 bg-gradient-to-b from-slate-100 via-slate-50 to-slate-100 p-1">
      <div className="rounded-[24px] border border-slate-200 bg-white/90 p-1 shadow-sm backdrop-blur">
        <PageHeader
          eyebrow="Agenda"
          title="Agenda semanal"
          description={
            selectedBranchName
              ? `Vista filtrada por sucursal: ${selectedBranchName}`
              : "Vista enfocada en reservas activas."
          }
          actions={
            <div className="flex flex-wrap items-center justify-end gap-2">
              {hasPendingClose ? (
                <button
                  type="button"
                  onClick={() => {
                    setActiveFilter("pending_close");
                    if (pendingCloseAppointments[0]) {
                      handleSelectAppointment(pendingCloseAppointments[0]);
                    }
                  }}
                  className="inline-flex h-10 items-center justify-center rounded-xl border border-rose-600 bg-rose-600 px-3.5 text-sm font-semibold text-white shadow-sm transition hover:bg-rose-700"
                >
                  Pendientes: {pendingCloseCount}
                </button>
              ) : (
                <div className="inline-flex h-10 items-center justify-center rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 text-sm font-semibold text-emerald-700">
                  Sin pendientes
                </div>
              )}

              <div className="flex items-center rounded-2xl border border-slate-200 bg-white p-1 shadow-sm">
                <button
                  type="button"
                  onClick={goPrevWeek}
                  className="inline-flex h-10 items-center justify-center rounded-xl px-3.5 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
                >
                  ← Anterior
                </button>

                <button
                  type="button"
                  onClick={goToday}
                  className="inline-flex h-10 items-center justify-center rounded-xl bg-slate-900 px-3.5 text-sm font-medium text-white transition hover:bg-slate-800"
                >
                  Hoy
                </button>

                <button
                  type="button"
                  onClick={goNextWeek}
                  className="inline-flex h-10 items-center justify-center rounded-xl px-3.5 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
                >
                  Siguiente →
                </button>
              </div>

              <div className="inline-flex h-10 items-center justify-center rounded-xl border border-sky-100 bg-sky-50 px-3.5 text-sm font-semibold text-sky-800">
                {formatRangeTitle(weekStart, weekEnd)}
              </div>

              <input
                type="date"
                value={formatDateYYYYMMDD(weekBaseDate)}
                onChange={(e) => {
                  if (!e.target.value) return;
                  setWeekBaseDate(new Date(`${e.target.value}T12:00:00`));
                  setSelectedAppointment(null);
                  setIsEditingReservation(false);
                }}
                className="h-10 rounded-xl border border-slate-200 bg-white px-3.5 text-sm text-slate-700 outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
              />
            </div>
          }
        />
      </div>

      {hasPendingClose ? (
        <div className="rounded-2xl border border-rose-200 bg-gradient-to-r from-rose-50 to-amber-50 px-4 py-3 text-sm text-rose-800 shadow-sm">
          Tienes <span className="font-semibold">{pendingCloseCount}</span>{" "}
          cita{pendingCloseCount === 1 ? "" : "s"} pendiente
          {pendingCloseCount === 1 ? "" : "s"} de cierre.
        </div>
      ) : null}

      {error ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 shadow-sm">
          {error}
        </div>
      ) : null}

      <div className="grid gap-4 xl:grid-cols-[1.7fr_0.55fr]">
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <Panel
            title="Calendario semanal"
            description={
              activeFilter === "canceled"
                ? "Vista semanal de reservas canceladas."
                : "Vista semanal enfocada en reservas activas."
            }
          >
            {!selectedBranchId ? (
              <p className="px-2 py-4 text-sm text-slate-500">
                Selecciona una sucursal en el sidebar para ver la agenda.
              </p>
            ) : loading ? (
              <p className="px-2 py-4 text-sm text-slate-500">Cargando agenda...</p>
            ) : (
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-7">
                {weekDays.map((day) => {
                  const dayKey = formatDateYYYYMMDD(day);
                  const dayAppointments = appointmentsByDay[dayKey] || [];
                  const isToday = dayKey === todayKey;
                  const daySlots = generateDaySlots(day);
                  const dayPendingCount = appointments
                    .filter(
                      (appt) =>
                        formatDateYYYYMMDD(new Date(appt.start_at)) === dayKey
                    )
                    .filter(isPastPendingClosure).length;
                  const dayCanceledCount = appointments
                    .filter(
                      (appt) =>
                        formatDateYYYYMMDD(new Date(appt.start_at)) === dayKey
                    )
                    .filter(isCanceled).length;

                  return (
                    <div
                      key={dayKey}
                      className={`rounded-xl border p-2.5 ${
                        dayPendingCount > 0
                          ? "border-rose-200 bg-gradient-to-b from-rose-50 to-white"
                          : isToday
                          ? "border-sky-200 bg-gradient-to-b from-sky-50 to-white"
                          : "border-slate-200 bg-slate-50/70"
                      }`}
                    >
                      <div
                        className={`mb-2.5 pb-2.5 ${
                          dayPendingCount > 0
                            ? "border-b border-rose-200"
                            : isToday
                            ? "border-b border-sky-200"
                            : "border-b border-slate-200"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="text-sm font-semibold capitalize text-slate-800">
                            {day.toLocaleDateString("es-CL", {
                              weekday: "long",
                            })}
                          </div>

                          <div className="flex items-center gap-1.5">
                            {dayCanceledCount > 0 ? (
                              <span className="rounded-full bg-slate-600 px-2 py-0.5 text-[10px] font-semibold text-white">
                                {dayCanceledCount} c
                              </span>
                            ) : null}

                            {dayPendingCount > 0 ? (
                              <span className="rounded-full bg-rose-600 px-2 py-0.5 text-[10px] font-semibold text-white">
                                {dayPendingCount}
                              </span>
                            ) : null}

                            {isToday ? (
                              <span className="rounded-full bg-sky-600 px-2 py-0.5 text-[10px] font-semibold text-white">
                                Hoy
                              </span>
                            ) : null}
                          </div>
                        </div>

                        <div className="mt-1 text-[11px] text-slate-500">
                          {day.toLocaleDateString("es-CL", {
                            day: "2-digit",
                            month: "2-digit",
                          })}
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        {activeFilter === "canceled" ? (
                          dayAppointments.length === 0 ? (
                            <div className="rounded-lg border border-dashed border-slate-200 bg-white px-2 py-3 text-center text-[11px] text-slate-400">
                              Sin canceladas
                            </div>
                          ) : (
                            dayAppointments.map((appt) => {
                              const isSelected =
                                selectedAppointment?.id === appt.id;

                              return (
                                <button
                                  key={appt.id}
                                  type="button"
                                  onClick={() => handleSelectAppointment(appt)}
                                  className={`w-full rounded-xl border p-2.5 text-left transition ${getCardClass(
                                    appt,
                                    isSelected
                                  )}`}
                                >
                                  <div className="space-y-1.5">
                                    <div
                                      className={`text-[11px] font-semibold ${
                                        isSelected
                                          ? "text-slate-200"
                                          : "text-slate-600"
                                      }`}
                                    >
                                      {formatHour(appt.start_at)} -{" "}
                                      {formatHour(appt.end_at)}
                                    </div>

                                    <div>
                                      <span
                                        className={`inline-flex max-w-full rounded-full border px-2 py-0.5 text-[10px] font-semibold ${
                                          isSelected
                                            ? "border-white/20 bg-white/10 text-white"
                                            : getStatusBadgeClass(appt)
                                        }`}
                                      >
                                        {getCalendarBadgeLabel(appt)}
                                      </span>
                                    </div>

                                    <p
                                      className={`truncate text-sm font-semibold ${
                                        isSelected
                                          ? "text-white"
                                          : "text-slate-900"
                                      }`}
                                    >
                                      {appt.customer_name}
                                    </p>

                                    <p
                                      className={`truncate text-[11px] ${
                                        isSelected
                                          ? "text-slate-200"
                                          : "text-slate-500"
                                      }`}
                                    >
                                      {appt.service_name_snapshot || "Reserva"}
                                    </p>
                                  </div>
                                </button>
                              );
                            })
                          )
                        ) : (
                          daySlots.map((slot, index) => {
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
                                  className={`rounded-lg border px-2 py-2 text-center text-[11px] ${
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

                            const isSelected =
                              selectedAppointment?.id === appt.id;

                            return (
                              <button
                                key={appt.id}
                                type="button"
                                onClick={() => handleSelectAppointment(appt)}
                                className={`w-full rounded-xl border p-2.5 text-left transition ${getCardClass(
                                  appt,
                                  isSelected
                                )}`}
                              >
                                <div className="space-y-1.5">
                                  <div
                                    className={`text-[11px] font-semibold ${
                                      isSelected
                                        ? "text-slate-200"
                                        : "text-slate-600"
                                    }`}
                                  >
                                    {formatHour(appt.start_at)} -{" "}
                                    {formatHour(appt.end_at)}
                                  </div>

                                  <div>
                                    <span
                                      className={`inline-flex max-w-full rounded-full border px-2 py-0.5 text-[10px] font-semibold ${
                                        isSelected
                                          ? "border-white/20 bg-white/10 text-white"
                                          : getStatusBadgeClass(appt)
                                      }`}
                                    >
                                      {getCalendarBadgeLabel(appt)}
                                    </span>
                                  </div>

                                  <p
                                    className={`truncate text-sm font-semibold ${
                                      isSelected
                                        ? "text-white"
                                        : "text-slate-900"
                                    }`}
                                  >
                                    {appt.customer_name}
                                  </p>

                                  <p
                                    className={`truncate text-[11px] ${
                                      isSelected
                                        ? "text-slate-200"
                                        : "text-slate-500"
                                    }`}
                                  >
                                    {appt.service_name_snapshot || "Reserva"}
                                  </p>

                                  {isPastPendingClosure(appt) ? (
                                    <div
                                      className={`rounded-lg px-2 py-1 text-[10px] font-semibold ${
                                        isSelected
                                          ? "bg-white/10 text-white"
                                          : "bg-rose-100 text-rose-700"
                                      }`}
                                    >
                                      Requiere cierre
                                    </div>
                                  ) : null}
                                </div>
                              </button>
                            );
                          })
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Panel>
        </div>

        <div ref={detailRef} className="self-start xl:sticky xl:top-6">
          <div className="space-y-3">
            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
              <Panel
                title="Buscar cliente o reserva"
                description="Busca por nombre, email o teléfono."
              >
                <div className="space-y-3">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          handleSearchAppointments();
                        }
                      }}
                      placeholder="Ej: Camilo, gmail.com, +569..."
                      className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
                    />
                    <button
                      type="button"
                      onClick={handleSearchAppointments}
                      disabled={searchLoading}
                      className="inline-flex h-10 shrink-0 items-center justify-center rounded-xl bg-slate-900 px-4 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {searchLoading ? "Buscando..." : "Buscar"}
                    </button>
                  </div>

                  {searchError ? (
                    <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
                      {searchError}
                    </div>
                  ) : null}

                  {searchResults.length > 0 ? (
                    <div className="max-h-[320px] space-y-2 overflow-y-auto pr-1">
                      {searchResults.map((appt) => {
                        const isSelected = selectedAppointment?.id === appt.id;

                        return (
                          <button
                            key={appt.id}
                            type="button"
                            onClick={() => handleSelectAppointment(appt)}
                            className={`w-full rounded-xl border p-3 text-left transition ${
                              isSelected
                                ? "border-slate-900 bg-slate-900 text-white"
                                : "border-slate-200 bg-slate-50 hover:border-sky-300 hover:bg-sky-50"
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0">
                                <p
                                  className={`truncate text-sm font-semibold ${
                                    isSelected
                                      ? "text-white"
                                      : "text-slate-900"
                                  }`}
                                >
                                  {appt.customer_name}
                                </p>
                                <p
                                  className={`mt-1 truncate text-xs ${
                                    isSelected
                                      ? "text-slate-200"
                                      : "text-slate-500"
                                  }`}
                                >
                                  {appt.service_name_snapshot || "Reserva"}
                                </p>
                              </div>

                              <span
                                className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-semibold ${
                                  isSelected
                                    ? "border-white/20 bg-white/10 text-white"
                                    : getStatusBadgeClass(appt)
                                }`}
                              >
                                {getStatusLabel(appt)}
                              </span>
                            </div>

                            <p
                              className={`mt-2 text-xs ${
                                isSelected
                                  ? "text-slate-200"
                                  : "text-slate-600"
                              }`}
                            >
                              {formatCompactDateTime(appt.start_at)}
                            </p>
                          </button>
                        );
                      })}
                    </div>
                  ) : null}
                </div>
              </Panel>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
              <Panel title="Filtros" description="Estado actual de la vista.">
                <div className="flex flex-wrap gap-2">
                  {(Object.keys(filterLabels) as FilterValue[]).map((filter) => {
                    const count =
                      filter === "active"
                        ? counts.active
                        : filter === "pending_close"
                        ? counts.pending_close
                        : filter === "booked"
                        ? counts.booked
                        : filter === "completed"
                        ? counts.completed
                        : filter === "no_show"
                        ? counts.no_show
                        : counts.canceled;

                    return (
                      <button
                        key={filter}
                        type="button"
                        onClick={() => setActiveFilter(filter)}
                        className={getFilterButtonClasses(
                          filter,
                          activeFilter === filter,
                          count
                        )}
                      >
                        {filterLabels[filter]} ({count})
                      </button>
                    );
                  })}
                </div>
              </Panel>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-sm">
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                  Hoy
                </p>
                <p className="mt-1 text-lg font-semibold text-slate-900">
                  {loading ? "..." : String(appointmentsToday.length)}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  En vista actual.
                </p>
              </div>

              <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-sm">
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                  Semana
                </p>
                <p className="mt-1 text-lg font-semibold text-slate-900">
                  {loading
                    ? "..."
                    : String(
                        activeFilter === "active"
                          ? counts.active
                          : activeFilter === "pending_close"
                          ? counts.pending_close
                          : activeFilter === "booked"
                          ? counts.booked
                          : activeFilter === "completed"
                          ? counts.completed
                          : activeFilter === "no_show"
                          ? counts.no_show
                          : counts.canceled
                      )}
                </p>
                <p className="mt-1 text-xs text-slate-500">Según filtro.</p>
              </div>

              <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-sm">
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                  Pendientes
                </p>
                <p className="mt-1 text-lg font-semibold text-slate-900">
                  {loading ? "..." : String(pendingCloseCount)}
                </p>
                <p className="mt-1 text-xs text-slate-500">Por cerrar.</p>
              </div>

              <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-sm">
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                  Canceladas
                </p>
                <p className="mt-1 text-lg font-semibold text-slate-900">
                  {loading ? "..." : String(canceledCount)}
                </p>
                <p className="mt-1 text-xs text-slate-500">Esta semana.</p>
              </div>

              <div className="col-span-2 rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-sm">
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                  Próxima
                </p>
                <p className="mt-1 text-lg font-semibold text-slate-900">
                  {loading
                    ? "..."
                    : nextAppointment
                    ? formatHour(nextAppointment.start_at)
                    : "--"}
                </p>
                <p className="mt-1 truncate text-xs text-slate-500">
                  {loading
                    ? "Cargando..."
                    : nextAppointment
                    ? nextAppointment.customer_name
                    : "Sin próximas reservas."}
                </p>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
              <Panel
                title="Detalle de reserva"
                description="Cliente, horario, estado y edición."
              >
                {!selectedAppointment ? (
                  <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-5 text-sm text-slate-500">
                    Haz clic en una reserva para ver el detalle.
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="rounded-xl border border-slate-200 bg-gradient-to-br from-slate-50 to-slate-100 p-3">
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

                      <p className="mt-1.5 text-sm capitalize text-slate-600">
                        {formatLongDate(selectedAppointment.start_at)}
                      </p>
                      <p className="mt-1 text-sm text-slate-600">
                        {formatHour(selectedAppointment.start_at)} -{" "}
                        {formatHour(selectedAppointment.end_at)}
                      </p>
                    </div>

                    {isPastPendingClosure(selectedAppointment) ? (
                      <div className="rounded-xl border border-rose-200 bg-rose-50 p-3">
                        <p className="text-sm font-semibold text-rose-800">
                          Esta cita ya terminó
                        </p>
                        <p className="mt-1 text-sm text-rose-700">
                          Debes cerrar su estado para mantener la agenda al día.
                        </p>

                        <div className="mt-3 grid grid-cols-1 gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              handleUpdateStatus(
                                selectedAppointment.id,
                                "completed"
                              )
                            }
                            disabled={statusSaving}
                            className="inline-flex h-10 items-center justify-center rounded-xl bg-emerald-600 px-4 text-sm font-medium text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {statusSaving ? "Guardando..." : "Marcar atendida"}
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              handleUpdateStatus(
                                selectedAppointment.id,
                                "no_show"
                              )
                            }
                            disabled={statusSaving}
                            className="inline-flex h-10 items-center justify-center rounded-xl bg-amber-500 px-4 text-sm font-medium text-white transition hover:bg-amber-600 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {statusSaving ? "Guardando..." : "Marcar no asistió"}
                          </button>
                        </div>
                      </div>
                    ) : null}

                    <div className="rounded-xl border border-slate-200 bg-white p-3">
                      <div className="mb-3 flex items-center justify-between gap-2">
                        <p className="text-sm font-semibold text-slate-900">
                          Datos del cliente
                        </p>

                        {!isEditingReservation ? (
                          <button
                            type="button"
                            onClick={() => {
                              setIsEditingReservation(true);
                              syncEditForm(selectedAppointment);
                            }}
                            className="inline-flex h-9 items-center justify-center rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                          >
                            Editar
                          </button>
                        ) : (
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                setIsEditingReservation(false);
                                syncEditForm(selectedAppointment);
                              }}
                              className="inline-flex h-9 items-center justify-center rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                            >
                              Cancelar
                            </button>
                            <button
                              type="button"
                              onClick={handleSaveReservationEdit}
                              disabled={editSaving}
                              className="inline-flex h-9 items-center justify-center rounded-xl bg-slate-900 px-3 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              {editSaving ? "Guardando..." : "Guardar"}
                            </button>
                          </div>
                        )}
                      </div>

                      {!isEditingReservation ? (
                        <div className="space-y-2">
                          <div className="rounded-xl border border-slate-200 bg-white p-3">
                            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                              Cliente
                            </p>
                            <p className="mt-1 text-sm font-medium text-slate-900">
                              {selectedAppointment.customer_name}
                            </p>
                          </div>

                          <div className="rounded-xl border border-slate-200 bg-white p-3">
                            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                              Teléfono
                            </p>
                            <p className="mt-1 text-sm font-medium text-slate-900">
                              {selectedAppointment.customer_phone ||
                                "No disponible"}
                            </p>
                          </div>

                          <div className="rounded-xl border border-slate-200 bg-white p-3">
                            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                              Email
                            </p>
                            <p className="mt-1 break-all text-sm font-medium text-slate-900">
                              {selectedAppointment.customer_email ||
                                "No disponible"}
                            </p>
                          </div>

                          <div className="rounded-xl border border-slate-200 bg-white p-3">
                            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                              Estado
                            </p>
                            <p className="mt-1 text-sm font-medium text-slate-900">
                              {getStatusLabel(selectedAppointment)}
                            </p>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <div>
                            <label className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                              Cliente
                            </label>
                            <input
                              type="text"
                              value={editForm.customer_name}
                              onChange={(e) =>
                                setEditForm((prev) => ({
                                  ...prev,
                                  customer_name: e.target.value,
                                }))
                              }
                              className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
                            />
                          </div>

                          <div>
                            <label className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                              Teléfono
                            </label>
                            <input
                              type="text"
                              value={editForm.customer_phone}
                              onChange={(e) =>
                                setEditForm((prev) => ({
                                  ...prev,
                                  customer_phone: e.target.value,
                                }))
                              }
                              className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
                            />
                          </div>

                          <div>
                            <label className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                              Email
                            </label>
                            <input
                              type="email"
                              value={editForm.customer_email}
                              onChange={(e) =>
                                setEditForm((prev) => ({
                                  ...prev,
                                  customer_email: e.target.value,
                                }))
                              }
                              className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </Panel>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}