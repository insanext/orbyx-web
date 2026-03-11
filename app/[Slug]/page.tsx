"use client";

import { useEffect, useState } from "react";
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

    if (!customerName.trim() || !customerPhone.trim() || !customerEmail.trim()) {
      alert("Completa nombre, teléfono y email");
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
        alert(data.error || "No se pudo crear la reserva");
        return;
      }

      setBookingSuccess(true);
      setShowForm(false);
    } catch (error) {
      alert("Error al crear la reserva");
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
    if (!slug || !selectedService || weekDates.length === 0) return;

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
    <main className="max-w-7xl mx-auto px-6 py-10">
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[360px_minmax(0,1fr)]">
        <aside className="space-y-6">
          <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-6">
            {business?.logo_url && (
              <img
                src={business.logo_url}
                alt={business?.name || "Logo"}
                className="mb-4 h-20 w-auto max-w-[140px] object-contain"
              />
            )}

            <h1 className="text-3xl font-semibold text-white">
              {business?.name}
            </h1>

            {business?.description && (
              <p className="mt-2 text-sm text-zinc-300">
                {business.description}
              </p>
            )}

            <div className="mt-4 space-y-2 text-sm text-zinc-300">
              {business?.phone && (
                <p>
                  <span className="font-semibold text-white">Teléfono:</span>{" "}
                  {business.phone}
                </p>
              )}

              {business?.address && (
                <p>
                  <span className="font-semibold text-white">Dirección:</span>{" "}
                  {business.address}
                </p>
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-6">
            <h2 className="mb-4 text-xl font-semibold text-white">Servicios</h2>

            <div className="space-y-3">
              {services.map((service) => (
                <button
                  key={service.id}
                  onClick={() => {
                    setSelectedService(service);
                    setSelectedSlot(null);
                    setShowForm(false);
                    setBookingSuccess(false);
                  }}
                  className={`w-full rounded-xl border p-4 text-left transition ${
                    selectedService?.id === service.id
                      ? "border-white bg-zinc-800 text-white"
                      : "border-zinc-700 bg-zinc-900 text-white hover:bg-zinc-800"
                  }`}
                >
                  <div className="font-semibold">{service.name}</div>
                  <div className="mt-1 text-sm text-zinc-300">
                    Duración: {service.duration_minutes} min
                  </div>
                  <div className="text-sm text-zinc-300">
                    Precio: ${service.price}
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-6">
            <h2 className="mb-4 text-xl font-semibold text-white">Fecha</h2>

            <Calendar
              onChange={(value: any) => {
                const picked = Array.isArray(value) ? value[0] : value;
                if (!picked) return;

                setSelectedDate(new Date(picked));
                setSelectedSlot(null);
                setShowForm(false);
                setBookingSuccess(false);
              }}
              value={selectedDate}
            />
          </div>
        </aside>

        <section className="space-y-6">
          <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-6">
            <h2 className="mb-4 text-2xl font-semibold text-white">
              Selecciona un horario
            </h2>

            {!selectedService ? (
              <p className="text-zinc-400">
                Primero selecciona un servicio para ver los horarios
                disponibles.
              </p>
            ) : (
              <div className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-7">
                {weekDates.map((day) => {
                  const dateStr = formatDate(day);
                  const slots = weekSlots[dateStr] || [];

                  return (
                    <div
                      key={dateStr}
                      className="rounded-xl border border-zinc-800 bg-zinc-900 p-3"
                    >
                      <div className="mb-3 border-b border-zinc-800 pb-2">
                        <div className="text-sm font-semibold capitalize text-white">
                          {day.toLocaleDateString("es-CL", {
                            weekday: "short",
                          })}
                        </div>
                        <div className="text-sm text-zinc-400">
                          {day.toLocaleDateString("es-CL", {
                            day: "2-digit",
                            month: "2-digit",
                          })}
                        </div>
                      </div>

                      <div className="space-y-2">
                        {slots.length === 0 ? (
                          <span className="text-xs text-zinc-500">
                            Sin horarios
                          </span>
                        ) : (
                          slots.map((slot: any, i: number) => (
                            <button
                              key={i}
                              onClick={() => {
                                setSelectedSlot(slot);
                                setShowForm(false);
                                setBookingSuccess(false);
                              }}
                              className={`w-full rounded-lg border px-3 py-2 text-sm transition ${
                                selectedSlot?.slot_start === slot.slot_start
                                  ? "border-green-500 bg-green-500/10 text-green-400"
                                  : "border-zinc-700 bg-zinc-950 text-white hover:bg-zinc-800"
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

          {selectedSlot && (
            <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-6">
              <h3 className="text-xl font-semibold text-white">
                Horario seleccionado
              </h3>

              <div className="mt-4 space-y-2 text-sm text-zinc-300">
                <p>
                  Servicio:{" "}
                  <span className="font-semibold text-white">
                    {selectedService?.name}
                  </span>
                </p>
                <p>
                  Fecha:{" "}
                  <span className="font-semibold text-white">
                    {formatSelectedDate(selectedSlot.slot_start)}
                  </span>
                </p>
                <p>
                  Hora:{" "}
                  <span className="font-semibold text-white">
                    {formatHour(selectedSlot.slot_start)}
                  </span>
                </p>
              </div>

              {!showForm && !bookingSuccess && (
                <button
                  onClick={() => setShowForm(true)}
                  className="mt-5 rounded-xl px-5 py-3 font-medium text-white"
                  style={{
                    background: business?.brand_color || "#2563eb",
                  }}
                >
                  Continuar
                </button>
              )}
            </div>
          )}

          {showForm && selectedSlot && !bookingSuccess && (
            <div className="max-w-xl rounded-2xl border border-zinc-800 bg-zinc-950 p-6">
              <h3 className="mb-5 text-xl font-semibold text-white">
                Tus datos
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="mb-2 block text-sm text-zinc-300">
                    Nombre y apellido
                  </label>
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-white outline-none focus:border-zinc-500"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm text-zinc-300">
                    Teléfono
                  </label>
                  <input
                    type="tel"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-white outline-none focus:border-zinc-500"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm text-zinc-300">
                    Email
                  </label>
                  <input
                    type="email"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-white outline-none focus:border-zinc-500"
                  />
                </div>

                <button
                  onClick={handleBooking}
                  disabled={loadingBooking}
                  className="rounded-xl bg-green-600 px-5 py-3 font-medium text-white transition hover:bg-green-500 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {loadingBooking ? "Reservando..." : "Confirmar reserva"}
                </button>
              </div>
            </div>
          )}

          {bookingSuccess && selectedSlot && (
            <div className="rounded-2xl border border-green-700 bg-green-950/30 p-6">
              <h3 className="text-xl font-semibold text-green-400">
                Reserva confirmada ✅
              </h3>

              <div className="mt-4 space-y-2 text-sm text-zinc-200">
                <p>
                  Servicio:{" "}
                  <span className="font-semibold">{selectedService?.name}</span>
                </p>
                <p>
                  Fecha:{" "}
                  <span className="font-semibold">
                    {formatSelectedDate(selectedSlot.slot_start)}
                  </span>
                </p>
                <p>
                  Hora:{" "}
                  <span className="font-semibold">
                    {formatHour(selectedSlot.slot_start)}
                  </span>
                </p>
              </div>

              <p className="mt-4 text-sm text-zinc-300">
                Te enviamos un correo con los detalles.
              </p>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}