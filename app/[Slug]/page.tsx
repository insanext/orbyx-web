"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";

export default function Page() {
  const params = useParams();
  const slug =
    ((params as any)?.slug as string) || ((params as any)?.Slug as string);

  const [business, setBusiness] = useState<any>(null);
  const [services, setServices] = useState<any[]>([]);
  const [selectedService, setSelectedService] = useState<any>(null);
  const [selectedDate, setSelectedDate] = useState("");
  const [slots, setSlots] = useState<any[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<any>(null);

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
    if (!slug || !selectedService || !selectedDate) return;

    fetch(
      `/api/public-slots/${slug}/${selectedService.id}?date=${selectedDate}`
    )
      .then((res) => res.json())
      .then((data) => {
        setSlots(data.slots || []);
        setSelectedSlot(null);
      });
  }, [slug, selectedService, selectedDate]);

  function formatDate(date: Date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  return (
    <main style={{ padding: 40 }}>
      <h1>{business?.name}</h1>

      <h2>Servicios</h2>

      {services.map((service) => (
        <button
          key={service.id}
          onClick={() => {
            setSelectedService(service);
            setSelectedSlot(null);
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

      <h2 style={{ marginTop: 30 }}>Fecha</h2>

<Calendar
  onChange={(value: any) => {
    const pickedDate = Array.isArray(value) ? value[0] : value;
    if (!pickedDate) return;

    setSelectedDate(formatDate(new Date(pickedDate)));
    setSelectedSlot(null);
  }}
/>
      {selectedDate && (
        <>
          <h2 style={{ marginTop: 30 }}>Horarios disponibles</h2>

          {slots.length === 0 ? (
            <p>No hay horarios disponibles.</p>
          ) : (
            slots.map((slot, index) => (
              <button
                key={index}
                onClick={() => setSelectedSlot(slot)}
                style={{
                  display: "block",
                  marginBottom: 10,
                  padding: 10,
                  borderRadius: 6,
                  border:
                    selectedSlot?.slot_start === slot.slot_start
                      ? "2px solid white"
                      : "1px solid #444",
                  background: "#111",
                  color: "white",
                  cursor: "pointer",
                }}
              >
                {slot.slot_start}
              </button>
            ))
          )}
        </>
      )}

      {selectedSlot && (
        <div style={{ marginTop: 20 }}>
          <strong>Horario seleccionado:</strong>
          <div>{selectedSlot.slot_start}</div>
        </div>
      )}
    </main>
  );
}