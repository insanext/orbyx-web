"use client";

import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import Calendar from "react-calendar";

export default function Page() {
  const params = useParams();
  const slug =
    ((params as any)?.slug as string) || ((params as any)?.Slug as string);

  const [business, setBusiness] = useState<any>(null);
  const [services, setServices] = useState<any[]>([]);
  const [selectedService, setSelectedService] = useState<any>(null);

  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [weekDates, setWeekDates] = useState<Date[]>([]);
  const [weekSlots, setWeekSlots] = useState<any>({});
  const [selectedSlot, setSelectedSlot] = useState<any>(null);

  const [showForm, setShowForm] = useState(false);

  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("+569");
  const [customerEmail, setCustomerEmail] = useState("");

  const [loadingBooking, setLoadingBooking] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [bookingError, setBookingError] = useState("");

  const formRef = useRef<HTMLDivElement | null>(null);

  function formatDate(date: Date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }

  function formatHour(dateString: string) {
    const d = new Date(dateString);
    const h = String(d.getHours()).padStart(2, "0");
    const m = String(d.getMinutes()).padStart(2, "0");
    return `${h}:${m}`;
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

  function formatPrice(price: number) {
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
        headers: { "Content-Type": "application/json" },
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
        setBusiness(data.business);
        setServices(data.services);
      });
  }, [slug]);

  useEffect(() => {
    const week = getWeekDates(selectedDate);
    setWeekDates(week);
  }, [selectedDate]);

  useEffect(() => {
    if (!slug || !selectedService?.id || weekDates.length === 0) return;

    async function loadWeek() {
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

      const result: any = {};
      responses.forEach((r) => {
        result[r.date] = r.slots;
      });

      setWeekSlots(result);
    }

    loadWeek();
  }, [slug, selectedService, weekDates]);

  return (
    <div className="min-h-screen bg-slate-50">

      {/* HEADER */}

      <div
        className="w-full text-white"
        style={{ background: business?.brand_color || "#2563eb" }}
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-6">

          <div className="flex items-center gap-4">

            {business?.logo_url && (
              <img
                src={business.logo_url}
                alt={business?.name}
                className="h-12 w-auto rounded bg-white p-2"
              />
            )}

            <div>
              <h1 className="text-xl font-semibold">{business?.name}</h1>
              <p className="text-xs opacity-90">Reserva online</p>
            </div>

          </div>

          <div className="rounded-lg border border-white/30 bg-white/10 px-4 py-2 backdrop-blur">
            <p className="text-sm font-semibold">
              Rápido, claro y profesional
            </p>
          </div>

        </div>
      </div>

      {/* CONTENT */}

      <div className="mx-auto max-w-7xl px-6 py-10">

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[320px_1fr]">

          {/* LEFT */}

          <div className="space-y-5">

            <div className="rounded-xl border bg-white p-5 shadow-sm">

              <h2 className="mb-4 text-lg font-semibold">
                Elige tu servicio
              </h2>

              <select
                value={selectedService?.id || ""}
                onChange={(e) => {

                  const service =
                    services.find((s) => s.id === e.target.value) || null;

                  setSelectedService(service);
                  setSelectedSlot(null);
                  setShowForm(false);
                  setBookingSuccess(false);
                  setBookingError("");

                }}
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm"
              >
                <option value="">Selecciona un servicio</option>

                {services.map((service) => (
                  <option key={service.id} value={service.id}>
                    {service.name} · {service.duration_minutes} min · {formatPrice(service.price)}
                  </option>
                ))}

              </select>

            </div>

            <div className="rounded-xl border bg-white p-5 shadow-sm">

              <h2 className="mb-4 text-lg font-semibold">
                Selecciona la fecha
              </h2>

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

            </div>

          </div>

          {/* RIGHT */}

          <div className="space-y-5">

            <div className="rounded-xl border bg-white p-5 shadow-sm">

              <h2 className="mb-5 text-xl font-semibold">
                Horarios disponibles
              </h2>

              {!selectedService && (
                <p className="text-gray-500">
                  Selecciona un servicio para ver las horas disponibles
                </p>
              )}

              {selectedService && (

                <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 xl:grid-cols-7">

                  {weekDates.map((day) => {

                    const dateStr = formatDate(day);
                    const slots = weekSlots[dateStr] || [];

                    return (

                      <div key={dateStr} className="rounded-lg border p-2">

                        <div className="mb-2">

                          <div className="text-sm font-semibold">
                            {day.toLocaleDateString("es-CL", {
                              weekday: "short",
                            })}
                          </div>

                          <div className="text-xs text-gray-500">
                            {day.toLocaleDateString("es-CL", {
                              day: "2-digit",
                              month: "2-digit",
                            })}
                          </div>

                        </div>

                        <div className="space-y-1.5">

                          {slots.length === 0 ? (
                            <div className="text-xs text-gray-400">
                              Sin horarios
                            </div>
                          ) : (
                            slots.map((slot: any, i: number) => (

                              <button
                                key={i}
                                onClick={() => {

                                  setSelectedSlot(slot);
                                  setShowForm(true);

                                  setTimeout(() => {
                                    formRef.current?.scrollIntoView({
                                      behavior: "smooth",
                                      block: "start",
                                    });
                                  }, 100);

                                }}
                                className={`w-full rounded-md border py-1.5 text-xs transition ${
                                  selectedSlot?.slot_start === slot.slot_start
                                    ? "border-green-500 bg-green-500 text-white"
                                    : "border-gray-300 bg-white hover:bg-gray-50"
                                }`}
                              >
                                {formatHour(slot.slot_start)}
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
                className="max-w-xl rounded-xl border bg-white p-5 shadow-sm"
              >

                <div className="mb-4 rounded-lg border border-blue-100 bg-blue-50 p-4">

                  <h3 className="text-base font-semibold">
                    Hora seleccionada
                  </h3>

                  <p className="mt-2 text-sm">
                    <strong>Servicio:</strong> {selectedService?.name}
                  </p>

                  <p className="text-sm">
                    <strong>Fecha:</strong> {formatSelectedDate(selectedSlot.slot_start)}
                  </p>

                  <p className="text-sm">
                    <strong>Hora:</strong> {formatHour(selectedSlot.slot_start)}
                  </p>

                </div>

                <h3 className="mb-4 text-lg font-semibold">
                  Completa tus datos
                </h3>

                <div className="space-y-4">

                  <input
                    type="text"
                    placeholder="Nombre y apellido"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full rounded-lg border px-4 py-3"
                  />

                  <input
                    type="tel"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    className="w-full rounded-lg border px-4 py-3"
                  />

                  <input
                    type="email"
                    placeholder="Email"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    className="w-full rounded-lg border px-4 py-3"
                  />

                  <button
                    onClick={handleBooking}
                    disabled={loadingBooking}
                    className="w-full rounded-lg py-3 font-medium text-white"
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

              <div className="max-w-xl rounded-xl border border-green-200 bg-green-50 p-6 shadow-sm">

                <h3 className="text-lg font-semibold text-green-700">
                  ✅ Reserva confirmada
                </h3>

                <p className="mt-2 text-sm text-green-700">
                  Tu reserva fue creada correctamente.
                </p>

                <p className="mt-1 text-sm text-green-700">
                  Te enviamos un correo con los detalles de tu cita.
                </p>

              </div>

            )}

          </div>

        </div>

      </div>

    </div>
  );
}