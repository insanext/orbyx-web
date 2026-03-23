"use client";

import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";

type StaffItem = {
  id: string;
  name: string;
  role?: string | null;
  color?: string | null;
  is_active?: boolean;
};

type ServiceItem = {
  id: string;
  name: string;
  description?: string | null;
  duration_minutes?: number | null;
  price?: number | null;
  active?: boolean;
};

type BusinessItem = {
  id?: string;
  name?: string;
  slug?: string;
  description?: string | null;
  address?: string | null;
  phone?: string | null;
  instagram_url?: string | null;
  brand_color?: string | null;
  logo_url?: string | null;
  calendar_id?: string | null;
};

type SlotItem = {
  slot_start: string;
};

export default function Page() {
  const params = useParams();
  const slug =
    ((params as any)?.slug as string) || ((params as any)?.Slug as string);

  const [business, setBusiness] = useState<BusinessItem | null>(null);
  const [calendarId, setCalendarId] = useState("");
  const [branches, setBranches] = useState<any[]>([]);
const [selectedBranchId, setSelectedBranchId] = useState("");

const [services, setServices] = useState<ServiceItem[]>([]);
  const [selectedService, setSelectedService] = useState<ServiceItem | null>(
    null
  );

  const [staffOptions, setStaffOptions] = useState<StaffItem[]>([]);
  const [selectedStaffId, setSelectedStaffId] = useState("");

  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [weekDates, setWeekDates] = useState<Date[]>([]);
  const [weekSlots, setWeekSlots] = useState<Record<string, SlotItem[]>>({});
  const [selectedSlot, setSelectedSlot] = useState<SlotItem | null>(null);

  const [showForm, setShowForm] = useState(false);

  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("+569");
  const [customerEmail, setCustomerEmail] = useState("");

  const [loadingBooking, setLoadingBooking] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [bookingError, setBookingError] = useState("");
  const [loadingStaff, setLoadingStaff] = useState(false);
  const [loadingSlots, setLoadingSlots] = useState(false);

  const formRef = useRef<HTMLDivElement | null>(null);

  function formatDate(date: Date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }

function formatHour(dateString: string) {
  return new Date(dateString).toLocaleTimeString("es-CL", {
    timeZone: "America/Santiago",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

  function addMinutes(dateString: string, minutes: number) {
    const d = new Date(dateString);
    d.setMinutes(d.getMinutes() + minutes);
    return d.toISOString();
  }

  function formatSlotRange(slotStart: string) {
    const duration = Number(selectedService?.duration_minutes || 0);
    if (!duration) return formatHour(slotStart);

    const end = addMinutes(slotStart, duration);
    return `${formatHour(slotStart)} - ${formatHour(end)}`;
  }

  function formatSelectedDate(dateString: string) {
    const d = new Date(dateString);
    return d.toLocaleDateString("es-CL", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  }

  function formatPrice(price?: number | null) {
    return new Intl.NumberFormat("es-CL", {
      style: "currency",
      currency: "CLP",
      maximumFractionDigits: 0,
    }).format(price || 0);
  }

  function formatInstagramLabel(value?: string) {
    if (!value) return "";
    const clean = String(value).trim();

    if (clean.startsWith("http")) {
      const parts = clean.replace(/\/+$/, "").split("/");
      const last = parts[parts.length - 1];
      return last ? `@${last.replace("@", "")}` : "Instagram";
    }

    return clean.startsWith("@") ? clean : `@${clean}`;
  }

  function normalizeInstagramUrl(value?: string) {
    if (!value) return "";
    const clean = String(value).trim();

    if (clean.startsWith("http")) return clean;

    const username = clean.replace("@", "");
    return `https://instagram.com/${username}`;
  }

  function getWeekDates(baseDate: Date) {
    const dates: Date[] = [];
    const day = baseDate.getDay();
    const diff = baseDate.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(baseDate);
    monday.setHours(0, 0, 0, 0);
    monday.setDate(diff);

    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      d.setHours(0, 0, 0, 0);
      dates.push(d);
    }

    return dates;
  }

  function getSelectedStaff() {
    return staffOptions.find((item) => item.id === selectedStaffId) || null;
  }

  
async function loadServiceStaff(serviceId: string) {
  if (!slug || !serviceId || !selectedBranchId) {
    setStaffOptions([]);
    setSelectedStaffId("");
    return;
  }

  try {
    setLoadingStaff(true);

    const query = new URLSearchParams({
      branch_id: selectedBranchId,
    });

    const res = await fetch(
      `/api/public-staff/${slug}/${serviceId}?${query.toString()}`
    );
    const data = await res.json();

    if (!res.ok) {
      setStaffOptions([]);
      setSelectedStaffId("");
      return;
    }

    const rows = Array.isArray(data.staff) ? data.staff : [];
    setStaffOptions(rows);

    if (rows.length === 1) {
      setSelectedStaffId(rows[0].id);
    } else {
      setSelectedStaffId("");
    }
  } catch {
    setStaffOptions([]);
    setSelectedStaffId("");
  } finally {
    setLoadingStaff(false);
  }
}

  async function handleBooking() {
    if (!selectedSlot || !selectedService || !business) return;

    setBookingError("");

    const cleanName = customerName.trim();
    const cleanPhone = customerPhone.trim();
    const cleanEmail = customerEmail.trim();

    if (!cleanName || !cleanPhone || !cleanEmail) {
      setBookingError("Completa nombre, teléfono y email.");
      return;
    }

    if (cleanName.length < 3) {
      setBookingError("Ingresa un nombre válido.");
      return;
    }

    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail);
    if (!emailOk) {
      setBookingError("Ingresa un correo válido.");
      return;
    }

    if (cleanPhone.replace(/\D/g, "").length < 8) {
      setBookingError("Ingresa un teléfono válido.");
      return;
    }

    if (!calendarId) {
      setBookingError("No se encontró el calendario del negocio.");
      return;
    }

    setLoadingBooking(true);

    try {
      const res = await fetch("/api/appointments/slot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
body: JSON.stringify({
  calendar_id: calendarId,
  branch_id: selectedBranchId,
  service_id: selectedService.id,
  staff_id: selectedStaffId || null,
          date: formatDate(new Date(selectedSlot.slot_start)),
          slot_start: selectedSlot.slot_start,
          customer_name: cleanName,
          customer_phone: cleanPhone,
          customer_email: cleanEmail,
          source: "public_page",
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setBookingError(data.error || "No se pudo crear la reserva.");
        return;
      }

      setBookingSuccess(true);
      setShowForm(false);
      setSelectedSlot(null);
      setWeekSlots({});
    } catch {
      setBookingError("Ocurrió un error al crear la reserva.");
    } finally {
      setLoadingBooking(false);
    }
  }

  useEffect(() => {
  if (!slug) return;

  fetch(`/api/public-services/${slug}`)
    .then((res) => res.json())
    .then((data) => {
      setBusiness(data.business || null);
      setCalendarId(data.calendar_id || data.business?.calendar_id || "");

      const branchesData = Array.isArray(data.branches) ? data.branches : [];
      setBranches(branchesData);

      // auto seleccionar si hay solo una
      if (branchesData.length === 1) {
        setSelectedBranchId(branchesData[0].id);
      }

      setServices([]);
    });
}, [slug]);

useEffect(() => {
  if (!slug || !selectedBranchId) {
    setServices([]);
    return;
  }

  fetch(`/api/public-services/${slug}?branch_id=${selectedBranchId}`)
    .then((res) => res.json())
    .then((data) => {
      setServices(Array.isArray(data.services) ? data.services : []);
    });
}, [slug, selectedBranchId]);

  useEffect(() => {
    const week = getWeekDates(selectedDate);
    setWeekDates(week);
  }, [selectedDate]);

  useEffect(() => {
    if (!selectedService?.id) {
      setStaffOptions([]);
      setSelectedStaffId("");
      return;
    }

    setWeekSlots({});
    setSelectedSlot(null);
    setShowForm(false);
    setBookingSuccess(false);
    setBookingError("");

    loadServiceStaff(selectedService.id);
  }, [slug, selectedService?.id, selectedBranchId]);

  useEffect(() => {
    const serviceId = selectedService?.id;

if (!slug || !serviceId || !selectedBranchId || weekDates.length === 0) return;

    let cancelled = false;

    async function loadWeek() {
      try {
        setLoadingSlots(true);

        const requests = weekDates.map(async (day) => {
          const dateStr = formatDate(day);
const query = new URLSearchParams({
  date: dateStr,
  branch_id: selectedBranchId,
});

if (selectedStaffId) {
  query.set("staff_id", selectedStaffId);
}          

          const res = await fetch(
            `/api/public-slots/${slug}/${serviceId}?${query.toString()}`
          );

          const data = await res.json();

          return {
            date: dateStr,
            slots: Array.isArray(data.slots) ? data.slots : [],
          };
        });

        const responses = await Promise.all(requests);

        if (cancelled) return;

        const result: Record<string, SlotItem[]> = {};
        responses.forEach((r) => {
          result[r.date] = r.slots;
        });

        setWeekSlots(result);
      } catch {
        if (!cancelled) {
          setWeekSlots({});
        }
      } finally {
        if (!cancelled) {
          setLoadingSlots(false);
        }
      }
    }

    loadWeek();

    return () => {
      cancelled = true;
    };
  }, [slug, selectedService?.id, selectedBranchId, selectedStaffId, weekDates]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div
        className="relative overflow-hidden text-white"
        style={{ background: business?.brand_color || "#2563eb" }}
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.18),transparent_28%)]" />

        <div className="relative mx-auto max-w-7xl px-5 py-8 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-start gap-4">
              {business?.logo_url ? (
                <img
                  src={business.logo_url}
                  alt={business?.name || "Logo negocio"}
                  className="h-16 w-16 rounded-2xl bg-white object-contain p-2 shadow-sm"
                />
              ) : (
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/15 text-2xl font-semibold">
                  {business?.name?.slice(0, 1)?.toUpperCase() || "O"}
                </div>
              )}

              <div>
                <p className="text-xs font-medium uppercase tracking-[0.18em] text-white/80">
                  Reserva online
                </p>
                <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">
                  {business?.name || "Cargando negocio..."}
                </h1>

                {business?.description ? (
                  <p className="mt-2 max-w-2xl text-sm text-white/85">
                    {business.description}
                  </p>
                ) : (
                  <p className="mt-2 max-w-2xl text-sm text-white/85">
                    Agenda tu cita de forma simple, rápida y profesional.
                  </p>
                )}

                <div className="mt-4 flex flex-wrap gap-2 text-xs sm:text-sm">
                  {business?.address ? (
                    <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1.5">
                      📍 {business.address}
                    </span>
                  ) : null}

                  {business?.phone ? (
                    <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1.5">
                      📞 {business.phone}
                    </span>
                  ) : null}

                  {business?.instagram_url ? (
                    <a
                      href={normalizeInstagramUrl(business.instagram_url)}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-full border border-white/20 bg-white/10 px-3 py-1.5 transition hover:bg-white/20"
                    >
                      📷 {formatInstagramLabel(business.instagram_url)}
                    </a>
                  ) : null}
                </div>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-white/20 bg-white/10 px-4 py-3 backdrop-blur">
                <p className="text-xs text-white/75">Reserva</p>
                <p className="mt-1 text-sm font-semibold">En pocos pasos</p>
              </div>

              <div className="rounded-2xl border border-white/20 bg-white/10 px-4 py-3 backdrop-blur">
                <p className="text-xs text-white/75">Confirmación</p>
                <p className="mt-1 text-sm font-semibold">Rápida y clara</p>
              </div>

              <div className="rounded-2xl border border-white/20 bg-white/10 px-4 py-3 backdrop-blur">
                <p className="text-xs text-white/75">Atención</p>
                <p className="mt-1 text-sm font-semibold">Profesional</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-5 py-8 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[360px_1fr]">
    <aside className="space-y-5">
  <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
    <div className="mb-4">
      <h2 className="text-lg font-semibold">Elige sucursal</h2>
      <p className="mt-1 text-sm text-slate-500">
        Selecciona la sucursal donde quieres agendar.
      </p>
    </div>

    <select
      value={selectedBranchId}
      onChange={(e) => {
        setSelectedBranchId(e.target.value);

        setSelectedService(null);
        setSelectedStaffId("");
        setStaffOptions([]);
        setSelectedSlot(null);
        setShowForm(false);
        setWeekSlots({});
        setBookingSuccess(false);
        setBookingError("");
      }}
      className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-sky-500 focus:ring-4 focus:ring-sky-100"
    >
      <option value="">Selecciona una sucursal</option>

      {branches.map((b) => (
        <option key={b.id} value={b.id}>
          {b.name}
        </option>
      ))}
    </select>
  </div>

  <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
    <div className="mb-4">
      <h2 className="text-lg font-semibold">Elige tu servicio</h2>
      <p className="mt-1 text-sm text-slate-500">
        Escoge el servicio que quieres reservar.
      </p>
    </div>

    <select
      disabled={!selectedBranchId}
      value={selectedService?.id || ""}      

                onChange={(e) => {
                  const service =
                    services.find((s) => s.id === e.target.value) || null;

                  setSelectedService(service);
                  setSelectedSlot(null);
                  setShowForm(false);
                  setBookingSuccess(false);
                  setBookingError("");
                  setWeekSlots({});
                  setStaffOptions([]);
                  setSelectedStaffId("");
                }}
                className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-sky-500 focus:ring-4 focus:ring-sky-100"
              >
                <option value="">Selecciona un servicio</option>

                {services.map((service) => (
                  <option key={service.id} value={service.id}>
                    {service.name} · {service.duration_minutes || 0} min ·{" "}
                    {formatPrice(service.price)}
                  </option>
                ))}
              </select>

              {selectedService ? (
                <div className="mt-4 rounded-2xl border border-sky-100 bg-sky-50 p-4">
                  <p className="text-sm font-semibold text-slate-800">
                    {selectedService.name}
                  </p>

                  {selectedService?.description ? (
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      {selectedService.description}
                    </p>
                  ) : null}

                  <div className="mt-3 grid gap-2 text-sm text-slate-600">
                    <p>
                      Duración:{" "}
                      <span className="font-medium">
                        {selectedService.duration_minutes || 0} min
                      </span>
                    </p>
                    <p>
                      Precio:{" "}
                      <span className="font-medium">
                        {formatPrice(selectedService.price)}
                      </span>
                    </p>
                  </div>
                </div>
              ) : null}
            </div>

            {selectedService ? (
              <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="mb-4">
                  <h2 className="text-lg font-semibold">Elige profesional</h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Puedes reservar con un profesional específico o dejarlo
                    automático.
                  </p>
                </div>

                {loadingStaff ? (
                  <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-sm text-slate-500">
                    Cargando staff...
                  </div>
                ) : staffOptions.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-sm text-slate-500">
                    Este servicio aún no tiene staff asignado. Se mostrará
                    disponibilidad general.
                  </div>
                ) : (
                  <div className="space-y-3">
                    <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
                      <input
                        type="radio"
                        name="staff"
                        checked={selectedStaffId === ""}
                        onChange={() => {
                          setSelectedStaffId("");
                          setWeekSlots({});
                          setSelectedSlot(null);
                          setShowForm(false);
                          setBookingSuccess(false);
                          setBookingError("");
                        }}
                        className="h-4 w-4 border-slate-300"
                      />
                      Cualquiera disponible
                    </label>

                    {staffOptions.map((item) => (
                      <label
                        key={item.id}
                        className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700"
                      >
                        <input
                          type="radio"
                          name="staff"
                          checked={selectedStaffId === item.id}
                          onChange={() => {
                            setSelectedStaffId(item.id);
                            setWeekSlots({});
                            setSelectedSlot(null);
                            setShowForm(false);
                            setBookingSuccess(false);
                            setBookingError("");
                          }}
                          className="h-4 w-4 border-slate-300"
                        />
                        <span className="flex items-center gap-2">
                          <span
                            className="h-3 w-3 rounded-full"
                            style={{ backgroundColor: item.color || "#0f172a" }}
                          />
                          <span>
                            {item.name}
                            {item.role ? ` · ${item.role}` : ""}
                          </span>
                        </span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            ) : null}

            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-4">
                <h2 className="text-lg font-semibold">Selecciona la fecha</h2>
                <p className="mt-1 text-sm text-slate-500">
                  Elige el día que prefieras para ver los horarios disponibles.
                </p>
              </div>

              <div className="calendar-wrap">
                <Calendar
                  minDate={new Date()}
                  onChange={(value: any) => {
                    const picked = Array.isArray(value) ? value[0] : value;
                    if (!picked) return;

                    setSelectedDate(new Date(picked));
                    setWeekSlots({});
                    setSelectedSlot(null);
                    setShowForm(false);
                    setBookingSuccess(false);
                    setBookingError("");
                  }}
                  value={selectedDate}
                />
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="text-base font-semibold">¿Cómo funciona?</h3>
              <div className="mt-3 space-y-3 text-sm text-slate-600">
                <p>1. Elige un servicio.</p>
                <p>2. Opcionalmente elige profesional.</p>
                <p>3. Selecciona una fecha y horario.</p>
                <p>4. Completa tus datos y confirma.</p>
              </div>
            </div>
          </aside>

          <section className="space-y-5">
            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <h2 className="text-xl font-semibold">Horarios disponibles</h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Selecciona una hora para continuar con tu reserva.
                  </p>
                </div>

                {selectedService ? (
                  <div className="rounded-2xl bg-slate-100 px-4 py-2 text-sm text-slate-700">
                    Servicio:{" "}
                    <span className="font-medium">{selectedService.name}</span>
                  </div>
                ) : null}
              </div>

              {!selectedService ? (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-5 py-10 text-center text-sm text-slate-500">
                  Selecciona un servicio para ver las horas disponibles.
                </div>
              ) : loadingSlots ? (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-5 py-10 text-center text-sm text-slate-500">
                  Cargando horarios...
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-7">
                  {weekDates.map((day) => {
                    const dateStr = formatDate(day);
                    const slots = weekSlots[dateStr] || [];

                    return (
                      <div
                        key={dateStr}
                        className="rounded-2xl border border-slate-200 bg-slate-50 p-3"
                      >
                        <div className="mb-3 border-b border-slate-200 pb-3">
                          <div className="text-sm font-semibold capitalize text-slate-800">
                            {day.toLocaleDateString("es-CL", {
                              weekday: "short",
                            })}
                          </div>

                          <div className="text-xs text-slate-500">
                            {day.toLocaleDateString("es-CL", {
                              day: "2-digit",
                              month: "2-digit",
                            })}
                          </div>
                        </div>

                        <div className="space-y-1">
                          {slots.length === 0 ? (
                            <div className="rounded-xl bg-white px-3 py-3 text-center text-xs text-slate-400">
                              Sin horarios
                            </div>
                          ) : (
                            slots.map((slot: SlotItem, i: number) => (
                              <button
                                key={i}
                                onClick={() => {
                                  setSelectedSlot(slot);
                                  setShowForm(true);
                                  setBookingSuccess(false);
                                  setBookingError("");

                                  setTimeout(() => {
                                    formRef.current?.scrollIntoView({
                                      behavior: "smooth",
                                      block: "start",
                                    });
                                  }, 100);
                                }}
                                className={`w-full rounded-lg border px-2 py-2 text-xs font-medium transition ${
                                  selectedSlot?.slot_start === slot.slot_start
                                    ? "border-green-500 bg-green-500 text-white shadow-sm"
                                    : "border-slate-200 bg-white text-slate-700 hover:border-sky-300 hover:bg-sky-50"
                                }`}
                              >
                                {formatSlotRange(slot.slot_start)}
                              </button>
                            ))
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {showForm && selectedSlot && (
              <div
                ref={formRef}
                className="max-w-2xl rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
              >
                <div className="mb-5 rounded-2xl border border-sky-100 bg-sky-50 p-4">
                  <p className="text-sm font-semibold text-sky-800">
                    Hora seleccionada
                  </p>

                  <div className="mt-3 grid gap-2 text-sm text-slate-700 sm:grid-cols-2">
                    <p>
                      <span className="font-medium">Servicio:</span>{" "}
                      {selectedService?.name}
                    </p>
                    <p>
                      <span className="font-medium">Profesional:</span>{" "}
                      {getSelectedStaff()?.name || "Cualquiera disponible"}
                    </p>
                    <p>
                      <span className="font-medium">Fecha:</span>{" "}
                      {formatSelectedDate(selectedSlot.slot_start)}
                    </p>
                    <p>
                      <span className="font-medium">Hora:</span>{" "}
                      {formatSlotRange(selectedSlot.slot_start)}
                    </p>
                  </div>
                </div>

                <div className="mb-4">
                  <h3 className="text-lg font-semibold">Completa tus datos</h3>
                  <p className="mt-1 text-sm text-slate-500">
                    Ingresa tu información para confirmar la reserva.
                  </p>
                </div>

                <div className="space-y-4">
                  <input
                    type="text"
                    placeholder="Nombre y apellido"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none transition focus:border-sky-500 focus:ring-4 focus:ring-sky-100"
                  />

                  <input
                    type="tel"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none transition focus:border-sky-500 focus:ring-4 focus:ring-sky-100"
                  />

                  <input
                    type="email"
                    placeholder="Email"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none transition focus:border-sky-500 focus:ring-4 focus:ring-sky-100"
                  />

                  {bookingError ? (
                    bookingError.toLowerCase().includes("reserva") ? (
                      <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-4 text-sm text-amber-800">
                        <p className="font-semibold">
                          Ya tienes una reserva activa
                        </p>

                        <p className="mt-1">
                          Encontramos una reserva futura con este correo.
                        </p>

                        <p className="mt-1">
                          Si deseas cambiar el horario, primero debes cancelar tu
                          reserva actual.
                        </p>
                      </div>
                    ) : (
                      <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                        {bookingError}
                      </div>
                    )
                  ) : null}

                  <button
                    onClick={handleBooking}
                    disabled={loadingBooking}
                    className="w-full rounded-2xl py-3 font-medium text-white transition disabled:cursor-not-allowed disabled:opacity-70"
                    style={{
                      background: business?.brand_color || "#2563eb",
                    }}
                  >
                    {loadingBooking ? "Reservando..." : "Confirmar reserva"}
                  </button>
                </div>
              </div>
            )}

            {bookingSuccess && (
              <div className="max-w-2xl rounded-3xl border border-green-200 bg-green-50 p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-green-700">
                  Reserva confirmada
                </h3>

                <p className="mt-2 text-sm text-green-700">
                  Tu reserva fue creada correctamente.
                </p>

                <p className="mt-1 text-sm text-green-700">
                  Te enviamos un correo con los detalles de tu cita.
                </p>
              </div>
            )}
          </section>
        </div>
      </div>

      <style jsx global>{`
        .calendar-wrap .react-calendar {
          width: 100%;
          border: 0;
          font-family: inherit;
          background: transparent;
        }

        .calendar-wrap .react-calendar__navigation {
          margin-bottom: 12px;
        }

        .calendar-wrap .react-calendar__navigation button {
          min-width: 40px;
          background: transparent;
          border-radius: 12px;
          color: #0f172a;
          font-weight: 600;
        }

        .calendar-wrap .react-calendar__navigation button:enabled:hover,
        .calendar-wrap .react-calendar__navigation button:enabled:focus {
          background: #e2e8f0;
        }

        .calendar-wrap .react-calendar__month-view__weekdays {
          text-transform: uppercase;
          font-size: 11px;
          font-weight: 700;
          color: #64748b;
          margin-bottom: 8px;
        }

        .calendar-wrap .react-calendar__month-view__weekdays__weekday {
          padding: 8px 0;
          text-align: center;
        }

        .calendar-wrap .react-calendar__month-view__weekdays__weekday abbr {
          text-decoration: none;
        }

        .calendar-wrap .react-calendar__tile {
          border-radius: 14px;
          padding: 12px 6px;
          background: transparent;
          color: #0f172a;
        }

        .calendar-wrap .react-calendar__tile:enabled:hover,
        .calendar-wrap .react-calendar__tile:enabled:focus {
          background: #e2e8f0;
        }

        .calendar-wrap .react-calendar__tile--now {
          background: #dbeafe;
          color: #0f172a;
        }

        .calendar-wrap .react-calendar__tile--active {
          background: #0f172a !important;
          color: white !important;
        }
      `}</style>
    </div>
  );
}