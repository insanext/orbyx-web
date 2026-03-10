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

<main
  style={{
    padding: 24,
    maxWidth: 1100,
    margin: "0 auto",
    width: "100%",
  }}
>
  <div style={{ marginBottom: 24 }}>

{business?.logo_url && (
  <div style={{ marginBottom: 12 }}>
    <img
      src={business.logo_url}
      alt={business.name || "Logo"}
      style={{
        maxWidth: 140,
        maxHeight: 140,
        objectFit: "contain",
        display: "block"
      }}
    />
  </div>
)}

    <h1 style={{ marginBottom: 8 }}>{business?.name}</h1>

    {business?.description && (
      <p style={{ margin: "0 0 8px 0" }}>{business.description}</p>
    )}

    {business?.phone && (
      <p style={{ margin: "0 0 4px 0" }}>
        <strong>Teléfono:</strong> {business.phone}
      </p>
    )}

    {business?.address && (
      <p style={{ margin: 0 }}>
        <strong>Dirección:</strong> {business.address}
      </p>
    )}
  </div>



     <div
  style={{
    display: "grid",
    gridTemplateColumns: "340px minmax(700px, 1fr)",
    gap: 32,
    alignItems: "start",
    marginTop: 30,
  }}
>       
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>

  <h2>Servicios</h2>

      {services.map((service) => (
        <button
          key={service.id}
          onClick={() => {
            setSelectedService(service);
            setSelectedSlot(null);
            setShowForm(false);
            setBookingSuccess(false);
          }}
          style={{
            display: "block",
            marginBottom: 12,
            padding: 12,
            border:
              selectedService?.id === service.id
                ? "2px solid white"
                : "1px solid #444",
            borderRadius: 6,
            background: "#111",
            color: "white",
            cursor: "pointer",
          }}
        >
          <strong>{service.name}</strong>
          <br />
          Duración: {service.duration_minutes} min
          <br />
          Precio: ${service.price}
        </button>
      ))}

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

        <div style={{ minWidth: 0, maxWidth: 820 }}>
          <h2>Semana</h2>

          <div
  style={{
    display: "grid",
    gridTemplateColumns: "repeat(7, minmax(90px, 1fr))",
    gap: 12,
    alignItems: "start",
  }}
>
            {weekDates.map((day) => {
              const dateStr = formatDate(day);
              const slots = weekSlots[dateStr] || [];

              return (
                <div
                  key={dateStr}
                  style={{
                    border: "1px solid #333",
                    borderRadius: 8,
                    padding: 10,
                  }}
                >
                  <strong>
                    {day.toLocaleDateString("es-CL", {
                      weekday: "short",
                    })}
                  </strong>
                  <br />
                  {day.getDate()}

                  <div style={{ marginTop: 10 }}>
                    {slots.length === 0 ? (
                      <span style={{ fontSize: 12 }}>Sin horarios</span>
                    ) : (
                      slots.map((slot: any, i: number) => (
                        <button
                          key={i}
                          onClick={() => {
                            setSelectedSlot(slot);
                            setShowForm(false);
                            setBookingSuccess(false);
                          }}
                          style={{
                            display: "block",
                            width: "100%",
                            marginBottom: 6,
                            padding: 6,
                            borderRadius: 6,
                            border:
                              selectedSlot?.slot_start === slot.slot_start
                                ? "2px solid #22c55e"
                                : "1px solid #444",
                            background: "#111",
                            color: "white",
                            cursor: "pointer",
                          }}
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
        </div>
      </div>

      {selectedSlot && (
        <div style={{ marginTop: 30 }}>
          <h3>Horario seleccionado</h3>

          <p>
            Servicio: <strong>{selectedService?.name}</strong>
          </p>

          <p>
            Fecha:{" "}
            <strong>{formatSelectedDate(selectedSlot.slot_start)}</strong>
          </p>

          <p>
            Hora: <strong>{formatHour(selectedSlot.slot_start)}</strong>
          </p>

          {!showForm && !bookingSuccess && (
            <button
  onClick={() => setShowForm(true)}
  style={{
    marginTop: 10,
    padding: 12,
    borderRadius: 6,
    background: business?.brand_color || "#2563eb",
    color: "white",
    border: "none",
    cursor: "pointer",
  }}
>
  Continuar
</button>          )}
        </div>
      )}

      {showForm && selectedSlot && !bookingSuccess && (
        <div
          style={{
            marginTop: 20,
            maxWidth: 420,
            border: "1px solid #333",
            borderRadius: 8,
            padding: 16,
          }}
        >
          <h3 style={{ marginBottom: 16 }}>Tus datos</h3>

          <div style={{ marginBottom: 12 }}>
            <label style={{ display: "block", marginBottom: 6 }}>
              Nombre y apellido
            </label>
            <input
              type="text"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              style={{
                width: "100%",
                padding: 10,
                borderRadius: 6,
                border: "1px solid #444",
                background: "#111",
                color: "white",
              }}
            />
          </div>

          <div style={{ marginBottom: 12 }}>
            <label style={{ display: "block", marginBottom: 6 }}>
              Teléfono
            </label>
            <input
              type="tel"
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
              style={{
                width: "100%",
                padding: 10,
                borderRadius: 6,
                border: "1px solid #444",
                background: "#111",
                color: "white",
              }}
            />
          </div>

          <div style={{ marginBottom: 12 }}>
            <label style={{ display: "block", marginBottom: 6 }}>
              Email
            </label>
            <input
              type="email"
              value={customerEmail}
              onChange={(e) => setCustomerEmail(e.target.value)}
              style={{
                width: "100%",
                padding: 10,
                borderRadius: 6,
                border: "1px solid #444",
                background: "#111",
                color: "white",
              }}
            />
          </div>

          <button
            onClick={handleBooking}
            disabled={loadingBooking}
            style={{
              marginTop: 8,
              padding: 12,
              borderRadius: 6,
              background: "#16a34a",
              color: "white",
              border: "none",
              cursor: loadingBooking ? "not-allowed" : "pointer",
              opacity: loadingBooking ? 0.7 : 1,
            }}
          >
            {loadingBooking ? "Reservando..." : "Confirmar reserva"}
          </button>
        </div>
      )}

      {bookingSuccess && selectedSlot && (
        <div style={{ marginTop: 20 }}>
          <h3>Reserva confirmada ✅</h3>

          <p>
            Servicio: <strong>{selectedService?.name}</strong>
          </p>

          <p>
            Fecha: <strong>{formatSelectedDate(selectedSlot.slot_start)}</strong>
          </p>

          <p>
            Hora: <strong>{formatHour(selectedSlot.slot_start)}</strong>
          </p>

          <p>Te enviamos un correo con los detalles.</p>
        </div>
      )}
    </main>
  );
}