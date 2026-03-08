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

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "320px 1fr",
          gap: 40,
          marginTop: 30,
        }}
      >
        <div>
          <h2>Fecha</h2>

          <Calendar
            onChange={(value: any) => {
              const picked = Array.isArray(value) ? value[0] : value;
              if (!picked) return;

              setSelectedDate(new Date(picked));
              setSelectedSlot(null);
            }}
            value={selectedDate}
          />
        </div>

        <div>
          <h2>Semana</h2>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(7,1fr)",
              gap: 12,
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
                      <span style={{ fontSize: 12 }}>
                        Sin horarios
                      </span>
                    ) : (
                      slots.map((slot: any, i: number) => (
                        <button
                          key={i}
                          onClick={() => setSelectedSlot(slot)}
                          style={{
                            display: "block",
                            width: "100%",
                            marginBottom: 6,
                            padding: 6,
                            borderRadius: 6,
                            border: "1px solid #444",
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
            Hora: <strong>{formatHour(selectedSlot.slot_start)}</strong>
          </p>

          <button
            style={{
              marginTop: 10,
              padding: 12,
              borderRadius: 6,
              background: "#2563eb",
              color: "white",
              border: "none",
              cursor: "pointer",
            }}
          >
            Confirmar
          </button>
        </div>
      )}
    </main>
  );
}