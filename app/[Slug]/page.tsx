"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

export default function Page() {
  const params = useParams();
  const slug = (params as any)?.Slug as string;

  const [business, setBusiness] = useState<any>(null);
  const [services, setServices] = useState<any[]>([]);
  const [selectedService, setSelectedService] = useState<any>(null);
  const [selectedDate, setSelectedDate] = useState("");
  const [slots, setSlots] = useState<any[]>([]);

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
      });
  }, [slug, selectedService, selectedDate]);

  return (
    <main style={{ padding: 40 }}>
      <h1>{business?.name}</h1>

      <h2>Servicios</h2>

      {services.map((service) => (
        <button
          key={service.id}
          onClick={() => setSelectedService(service)}
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

      {selectedService && (
        <>
          <h2 style={{ marginTop: 30 }}>Fecha</h2>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            style={{
              padding: 10,
              borderRadius: 6,
              border: "1px solid #444",
              background: "#111",
              color: "white",
            }}
          />
        </>
      )}

      {selectedDate && (
        <>
          <h2 style={{ marginTop: 30 }}>Horarios disponibles</h2>

          {slots.length === 0 ? (
            <p>No hay horarios disponibles.</p>
          ) : (
            slots.map((slot, index) => (
              <div key={index} style={{ marginBottom: 10 }}>
                {slot.slot_start}
              </div>
            ))
          )}
        </>
      )}
    </main>
  );
}