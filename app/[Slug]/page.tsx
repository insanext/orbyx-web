"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "next/navigation";
import Calendar from "react-calendar";

type Business = {
  name?: string;
  logo_url?: string;
  brand_color?: string;
  description?: string;
  phone?: string;
  address?: string;
  calendar_id?: string;
};

type Service = {
  id: string;
  name: string;
  duration_minutes: number;
  price?: number;
  location_type?: string | null;
  location_text?: string | null;
};

export default function Page() {
  const params = useParams();
  const slug =
    ((params as any)?.slug as string) || ((params as any)?.Slug as string);

  const [business, setBusiness] = useState<Business | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [selectedService, setSelectedService] = useState<Service | null>(null);

  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [weekDates, setWeekDates] = useState<Date[]>([]);
  const [weekSlots, setWeekSlots] = useState<Record<string, any[]>>({});
  const [selectedSlot, setSelectedSlot] = useState<any>(null);

  const [showForm, setShowForm] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("+569");
  const [customerEmail, setCustomerEmail] = useState("");

  const [loadingBusiness, setLoadingBusiness] = useState(true);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [loadingBooking, setLoadingBooking] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [bookingError, setBookingError] = useState("");

  const formRef = useRef<HTMLDivElement | null>(null);

  const brandColor = business?.brand_color || "#2563eb";

  const weekHasAnySlots = useMemo(() => {
    return weekDates.some((day) => {
      const dateStr = formatDate(day);
      return (weekSlots[dateStr] || []).length > 0;
    });
  }, [weekDates, weekSlots]);

  function formatDate(date: Date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }

  function formatHour(dateString: string) {
    const d = new Date(dateString);
    return d.toLocaleTimeString("es-CL", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
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

  function formatPrice(price?: number) {
    if (!price && price !== 0) return "A convenir";
    return new Intl.NumberFormat("es-CL", {
      style: "currency",
      currency: "CLP",
      maximumFractionDigits: 0,
    }).format(price);
  }

  function getWeekDates(baseDate: Date) {
    const dates: Date[] = [];
    const day = baseDate.getDay();
    const diff = baseDate.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(baseDate);
    monday.setDate(diff);

    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      dates.push(d);
    }

    return dates;
  }

  async function handleBooking() {
    if (!selectedSlot || !selectedService || !business) return;

    setBookingError("");

    if (!customerName.trim() || !customerPhone.trim() || !customerEmail.trim()) {
      setBookingError("Completa nombre, teléfono y email.");
      return;
    }

    setLoadingBooking(true);

    try {
      const res = await fetch("/api/appointments/slot", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          calendar_id: business.calendar_id,
          service_id: selectedService.id,
          date: formatDate(new Date(selectedSlot.slot_start)),
          slot_start: selectedSlot.slot_start,
          customer_name: customerName,
          customer_phone: customerPhone,
          customer_email: customerEmail,
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
      setBookingError("");
    } catch {
      setBookingError("Ocurrió un error al crear la reserva.");
    } finally {
      setLoadingBooking(false);
    }
  }

  useEffect(() => {
    if (!slug) return;

    setLoadingBusiness(true);

    fetch(`/api/public-services/${slug}`)
      .then((res) => res.json())
      .then((data) => {
        setBusiness(data.business);
        setServices(data.services || []);
      })
      .finally(() => setLoadingBusiness(false));
  }, [slug]);

  useEffect(() => {
    const week = getWeekDates(selectedDate);
    setWeekDates(week);
  }, [selectedDate]);

  useEffect(() => {
    if (!slug || !selectedService || weekDates.length === 0) return;

    async function loadWeek() {
      setLoadingSlots(true);

      try {
        const requests = weekDates.map(async (day) => {
          const dateStr = formatDate(day);

          const res = await fetch(
            `/api/public-slots/${slug}/${selectedService.id}?date=${dateStr}`
          );

          const data = await res.json();

          return {
            date: dateStr,
            slots: data.slots || [],
          };
        });

        const responses = await Promise.all(requests);

        const result: Record<string, any[]> = {};
        responses.forEach((r) => {
          result[r.date] = r.slots;
        });

        setWeekSlots(result);
      } finally {
        setLoadingSlots(false);
      }
    }

    loadWeek();
  }, [slug, selectedService, weekDates]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <section
        className="relative overflow-hidden"
        style={{
          background: `linear-gradient(135deg, ${brandColor} 0%, #0f172a 100%)`,
        }}
      >
        <div className="absolute inset-0 opacity-10">
          <div className="absolute -left-10 top-10 h-40 w-40 rounded-full bg-white blur-3xl" />
          <div className="absolute right-0 top-0 h-56 w-56 rounded-full bg-white blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-7xl px-6 py-14 lg:px-8 lg:py-20">
          <div className="grid items-center gap-10 lg:grid-cols-[1.2fr_0.8fr]">
            <div>
              <div className="mb-5 flex items-center gap-4">
                {business?.logo_url ? (
                  <img
                    src={business.logo_url}
                    alt={business?.name || "Logo"}
                    className="h-16 w-16 rounded-2xl bg-white object-contain p-2 shadow-lg"
                  />
                ) : (
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/15 text-2xl font-semibold text-white backdrop-blur">
                    {business?.name?.charAt(0)?.toUpperCase() || "O"}
                  </div>
                )}

                <div>
                  <p className="text-sm font-medium uppercase tracking-[0.18em] text-white/70">
                    Orbyx Booking
                  </p>
                  <h1 className="text-3xl font-semibold tracking-tight text-white md:text-5xl">
                    {business?.name || "Reserva tu hora"}
                  </h1>
                </div>
              </div>

              <p className="max-w-2xl text-base leading-7 text-white/85 md:text-lg">
                {business?.description ||
                  "Agenda tu hora en pocos pasos, elige tu servicio, selecciona una fecha y confirma tu reserva online."}
              </p>

              <div className="mt-6 flex flex-wrap gap-3 text-sm text-white/85">
                {business?.address && (
                  <div className="rounded-full border border-white/20 bg-white/10 px-4 py-2 backdrop-blur">
                    {business.address}
                  </div>
                )}
                {business?.phone && (
                  <div className="rounded-full border border-white/20 bg-white/10 px-4 py-2 backdrop-blur">
                    {business.phone}
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-3xl border border-white/15 bg-white/10 p-6 text-white shadow-2xl backdrop-blur-md">
              <p className="text-sm font-medium uppercase tracking-[0.18em] text-white/70">
                Reserva online
              </p>
              <h2 className="mt-3 text-2xl font-semibold">
                Rápido, claro y profesional
              </h2>
              <p className="mt-3 text-sm leading-6 text-white/80">
                Selecciona el servicio, revisa horarios disponibles y confirma tu
                reserva en línea. Recibirás un correo con los detalles y link de
                cancelación.
              </p>
            </div>
          </div>
        </div>
      </section>

      <main className="mx-auto max-w-7xl px-6 py-8 lg:px-8 lg:py-10">
        <div className="grid grid-cols-1 gap-8 xl:grid-cols-[380px_1fr]">
          <aside className="space-y-6">
            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-5">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                  Paso 1
                </p>
                <h2 className="mt-2 text-xl font-semibold text-slate-900">
                  Elige tu servicio
                </h2>
              </div>

              {loadingBusiness ? (
                <p className="text-sm text-slate-500">Cargando servicios...</p>
              ) : services.length === 0 ? (
                <p className="text-sm text-slate-500">
                  No hay servicios disponibles por ahora.
                </p>
              ) : (
                <div className="space-y-3">
                  {services.map((service) => {
                    const active = selectedService?.id === service.id;

                    return (
                      <button
                        key={service.id}
                        onClick={() => {
                          setSelectedService(service);
                          setSelectedSlot(null);
                          setShowForm(false);
                          setBookingSuccess(false);
                          setBookingError("");
                        }}
                        className={`w-full rounded-2xl border p-4 text-left transition ${
                          active
                            ? "border-slate-900 bg-slate-900 text-white shadow-md"
                            : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="font-semibold">{service.name}</p>
                            <p
                              className={`mt-1 text-sm ${
                                active ? "text-white/75" : "text-slate-500"
                              }`}
                            >
                              {service.duration_minutes} min
                            </p>
                          </div>

                          <div
                            className={`rounded-full px-3 py-1 text-xs font-semibold ${
                              active
                                ? "bg-white/15 text-white"
                                : "bg-slate-100 text-slate-700"
                            }`}
                          >
                            {formatPrice(service.price)}
                          </div>
                        </div>

                        {service.location_text && (
                          <p
                            className={`mt-3 text-sm ${
                              active ? "text-white/80" : "text-slate-600"
                            }`}
                          >
                            {service.location_type === "online"
                              ? "Online"
                              : "Presencial"}{" "}
                            · {service.location_text}
                          </p>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </section>

            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-5">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                  Paso 2
                </p>
                <h2 className="mt-2 text-xl font-semibold text-slate-900">
                  Selecciona la fecha
                </h2>
              </div>

              <Calendar
                onChange={(value: any) => {
                  const picked = Array.isArray(value) ? value[0] : value;
                  if (!picked) return;

                  setSelectedDate(new Date(picked));
                  setSelectedSlot(null);
                  setShowForm(false);
                  setBookingSuccess(false);
                  setBookingError("");
                }}
                value={selectedDate}
              />
            </section>
          </aside>

          <section className="space-y-6">
            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                    Paso 3
                  </p>
                  <h2 className="mt-2 text-2xl font-semibold text-slate-900">
                    Horarios disponibles
                  </h2>
                </div>

                {selectedService && (
                  <div className="rounded-full bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700">
                    {selectedService.name}
                  </div>
                )}
              </div>

              {!selectedService && (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-slate-500">
                  Selecciona un servicio para ver las horas disponibles.
                </div>
              )}

              {selectedService && loadingSlots && (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-slate-500">
                  Cargando horarios...
                </div>
              )}

              {selectedService && !loadingSlots && (
                <>
                  {!weekHasAnySlots ? (
                    <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-slate-500">
                      No hay horarios disponibles en esta semana.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 2xl:grid-cols-4">
                      {weekDates.map((day) => {
                        const dateStr = formatDate(day);
                        const slots = weekSlots[dateStr] || [];

                        return (
                          <div
                            key={dateStr}
                            className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4"
                          >
                            <div className="mb-4 border-b border-slate-200 pb-3">
                              <div className="text-sm font-semibold capitalize text-slate-900">
                                {day.toLocaleDateString("es-CL", {
                                  weekday: "long",
                                })}
                              </div>
                              <div className="mt-1 text-sm text-slate-500">
                                {day.toLocaleDateString("es-CL", {
                                  day: "2-digit",
                                  month: "long",
                                })}
                              </div>
                            </div>

                            <div className="flex flex-wrap gap-2">
                              {slots.length === 0 ? (
                                <div className="text-sm text-slate-400">
                                  Sin horarios
                                </div>
                              ) : (
                                slots.map((slot: any, i: number) => {
                                  const active =
                                    selectedSlot?.slot_start === slot.slot_start;

                                  return (
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
                                        }, 120);
                                      }}
                                      className={`rounded-xl border px-3 py-2 text-sm font-medium transition ${
                                        active
                                          ? "border-slate-900 bg-slate-900 text-white shadow-sm"
                                          : "border-slate-300 bg-white text-slate-700 hover:border-slate-400 hover:bg-slate-100"
                                      }`}
                                    >
                                      {formatHour(slot.slot_start)}
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
                </>
              )}
            </section>

            {selectedSlot && !bookingSuccess && (
              <section
                ref={formRef}
                className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
              >
                <div className="mb-6 grid gap-4 lg:grid-cols-[1fr_1.1fr]">
                  <div className="rounded-2xl border border-blue-100 bg-blue-50 p-5">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-700">
                      Resumen
                    </p>
                    <h3 className="mt-2 text-lg font-semibold text-slate-900">
                      Hora seleccionada
                    </h3>

                    <div className="mt-4 space-y-2 text-sm text-slate-700">
                      <p>
                        <strong>Servicio:</strong> {selectedService?.name}
                      </p>
                      <p>
                        <strong>Fecha:</strong>{" "}
                        {formatSelectedDate(selectedSlot.slot_start)}
                      </p>
                      <p>
                        <strong>Hora:</strong> {formatHour(selectedSlot.slot_start)}
                      </p>

                      {selectedService?.location_text && (
                        <p>
                          <strong>
                            {selectedService.location_type === "online"
                              ? "Modalidad"
                              : "Ubicación"}
                            :
                          </strong>{" "}
                          {selectedService.location_text}
                        </p>
                      )}
                    </div>
                  </div>

                  <div>
                    {bookingError && (
                      <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 p-4">
                        <p className="text-sm font-medium text-red-700">
                          {bookingError}
                        </p>

                        {bookingError
                          .toLowerCase()
                          .includes("ya tiene una reserva futura activa") && (
                          <p className="mt-2 text-sm text-red-700">
                            Ya tienes una reserva activa con este correo. Si deseas
                            cambiar el horario, primero debes cancelar tu reserva
                            actual.
                          </p>
                        )}
                      </div>
                    )}

                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                      Paso 4
                    </p>
                    <h3 className="mt-2 text-xl font-semibold text-slate-900">
                      Completa tus datos
                    </h3>

                    <div className="mt-5 space-y-4">
                      <div>
                        <label className="mb-2 block text-sm font-medium text-slate-700">
                          Nombre y apellido
                        </label>
                        <input
                          type="text"
                          placeholder="Ej: Camilo Merino"
                          value={customerName}
                          onChange={(e) => setCustomerName(e.target.value)}
                          className="w-full rounded-2xl border border-slate-300 px-4 py-3.5 outline-none transition focus:border-slate-500"
                        />
                      </div>

                      <div>
                        <label className="mb-2 block text-sm font-medium text-slate-700">
                          Teléfono
                        </label>
                        <input
                          type="tel"
                          value={customerPhone}
                          onChange={(e) => setCustomerPhone(e.target.value)}
                          className="w-full rounded-2xl border border-slate-300 px-4 py-3.5 outline-none transition focus:border-slate-500"
                        />
                      </div>

                      <div>
                        <label className="mb-2 block text-sm font-medium text-slate-700">
                          Email
                        </label>
                        <input
                          type="email"
                          placeholder="correo@ejemplo.com"
                          value={customerEmail}
                          onChange={(e) => setCustomerEmail(e.target.value)}
                          className="w-full rounded-2xl border border-slate-300 px-4 py-3.5 outline-none transition focus:border-slate-500"
                        />
                      </div>

                      <button
                        onClick={handleBooking}
                        disabled={loadingBooking}
                        className="w-full rounded-2xl px-4 py-3.5 font-semibold text-white shadow-lg transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-70"
                        style={{
                          background: `linear-gradient(135deg, ${brandColor}, #0f172a)`,
                        }}
                      >
                        {loadingBooking ? "Reservando..." : "Confirmar reserva"}
                      </button>
                    </div>
                  </div>
                </div>
              </section>
            )}

            {bookingSuccess && (
              <section className="rounded-3xl border border-green-200 bg-green-50 p-8 shadow-sm">
                <h3 className="text-2xl font-semibold text-green-800">
                  Reserva confirmada
                </h3>

                <p className="mt-3 text-sm leading-6 text-green-700">
                  Te enviamos un correo con los detalles de tu reserva y el link
                  para cancelarla si lo necesitas.
                </p>
              </section>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}