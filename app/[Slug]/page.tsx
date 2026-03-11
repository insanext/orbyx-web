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
    } catch {
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
    <div className="min-h-screen bg-zinc-100">

      {/* HEADER PROFESIONAL */}

      <div
        className="w-full text-white"
        style={{ background: business?.brand_color || "#2563eb" }}
      >
        <div className="max-w-7xl mx-auto px-6 py-8 flex items-center gap-6">
          {business?.logo_url && (
            <img
              src={business.logo_url}
              className="h-16 w-auto bg-white rounded p-2"
            />
          )}

          <div>
            <h1 className="text-3xl font-semibold">
              Reserva tu hora
            </h1>

            <p className="opacity-90 text-sm">
              {business?.name}
            </p>
          </div>
        </div>
      </div>

      {/* CONTENEDOR PRINCIPAL */}

      <div className="max-w-7xl mx-auto px-6 py-10">

        <div className="grid grid-cols-1 lg:grid-cols-[350px_1fr] gap-8">

          {/* PANEL IZQUIERDO */}

          <div className="space-y-6">

            <div className="bg-white rounded-xl shadow-sm border p-6">

              <h2 className="text-lg font-semibold mb-4">
                Servicios
              </h2>

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
                    className={`w-full text-left p-4 rounded-lg border transition
                    ${
                      selectedService?.id === service.id
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200 hover:bg-gray-50"
                    }`}
                  >

                    <div className="font-semibold">
                      {service.name}
                    </div>

                    <div className="text-sm text-gray-500">
                      Duración: {service.duration_minutes} min
                    </div>

                    <div className="text-sm text-gray-500">
                      Precio: ${service.price}
                    </div>

                  </button>

                ))}

              </div>

            </div>

            <div className="bg-white rounded-xl shadow-sm border p-6">

              <h2 className="text-lg font-semibold mb-4">
                Selecciona fecha
              </h2>

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

          </div>

          {/* HORARIOS */}

          <div className="bg-white rounded-xl shadow-sm border p-6">

            <h2 className="text-xl font-semibold mb-6">
              Horarios disponibles
            </h2>

            {!selectedService && (
              <p className="text-gray-500">
                Selecciona un servicio para ver las horas disponibles
              </p>
            )}

            {selectedService && (

              <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-7 gap-4">

                {weekDates.map((day) => {

                  const dateStr = formatDate(day);
                  const slots = weekSlots[dateStr] || [];

                  return (

                    <div
                      key={dateStr}
                      className="border rounded-lg p-3"
                    >

                      <div className="font-semibold text-sm mb-2">
                        {day.toLocaleDateString("es-CL", {
                          weekday: "short",
                        })}
                      </div>

                      <div className="space-y-2">

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
                                setShowForm(false);
                                setBookingSuccess(false);
                              }}
                              className={`w-full py-2 text-sm rounded border
                              ${
                                selectedSlot?.slot_start === slot.slot_start
                                  ? "bg-green-500 text-white border-green-500"
                                  : "hover:bg-gray-50"
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

        </div>

        {/* FORMULARIO */}

        {selectedSlot && !bookingSuccess && (

          <div className="mt-8 bg-white rounded-xl shadow-sm border p-6 max-w-xl">

            <h3 className="text-lg font-semibold mb-4">
              Completa tus datos
            </h3>

            <div className="space-y-4">

              <input
                type="text"
                placeholder="Nombre y apellido"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="w-full border rounded-lg px-4 py-3"
              />

              <input
                type="tel"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                className="w-full border rounded-lg px-4 py-3"
              />

              <input
                type="email"
                placeholder="Email"
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
                className="w-full border rounded-lg px-4 py-3"
              />

              <button
                onClick={handleBooking}
                disabled={loadingBooking}
                className="w-full py-3 rounded-lg text-white font-medium"
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

          <div className="mt-8 bg-green-50 border border-green-200 p-6 rounded-lg">

            <h3 className="text-green-700 font-semibold text-lg">
              Reserva confirmada
            </h3>

            <p className="text-sm text-green-700 mt-2">
              Te enviamos un correo con los detalles.
            </p>

          </div>

        )}

      </div>

    </div>
  );
}