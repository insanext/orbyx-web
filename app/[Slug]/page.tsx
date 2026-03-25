"use client";

import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";

type StaffItem = {
  id: string;
  name: string;
  role?: string | null;
};

type ServiceItem = {
  id: string;
  name: string;
  duration_minutes?: number | null;
  price?: number | null;
};

type BranchItem = {
  id: string;
  name: string;
};

type SlotItem = {
  slot_start: string;
};

type BookingField = {
  key: string;
  label: string;
  enabled: boolean;
  required: boolean;
};

export default function Page() {
  const params = useParams();
  const slug = (params?.slug as string) || "";

  const [branches, setBranches] = useState<BranchItem[]>([]);
  const [selectedBranchId, setSelectedBranchId] = useState("");

  const [services, setServices] = useState<ServiceItem[]>([]);
  const [selectedService, setSelectedService] = useState<ServiceItem | null>(null);

  const [staffOptions, setStaffOptions] = useState<StaffItem[]>([]);
  const [selectedStaffId, setSelectedStaffId] = useState("");

  const [selectedDate, setSelectedDate] = useState(new Date());
  const [weekSlots, setWeekSlots] = useState<Record<string, SlotItem[]>>({});
  const [selectedSlot, setSelectedSlot] = useState<SlotItem | null>(null);

  const [bookingFields, setBookingFields] = useState<BookingField[]>([]);
  const [customerData, setCustomerData] = useState<any>({
    name: "",
    phone: "",
    email: "",
  });

  const formRef = useRef<HTMLDivElement | null>(null);

  function formatDate(date: Date) {
    return date.toISOString().split("T")[0];
  }

  function formatHour(dateString: string) {
    return new Date(dateString).toLocaleTimeString("es-CL", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  }

  function updateCustomerField(key: string, value: string) {
    setCustomerData((prev: any) => ({
      ...prev,
      [key]: value,
    }));
  }

  /* ===============================
     LOAD INICIAL
  ============================== */
  useEffect(() => {
    if (!slug) return;

    async function loadAll() {
      try {
        const res = await fetch(`/api/public-services/${slug}`);
        const data = await res.json();

        setBranches(data.branches || []);

        if (data.branches?.length === 1) {
          setSelectedBranchId(data.branches[0].id);
        }

        // booking fields
        const resFields = await fetch(
          `https://orbyx-backend.onrender.com/booking-fields/${slug}`
        );
        const dataFields = await resFields.json();

        setBookingFields(dataFields.booking_fields_config || []);
      } catch (err) {
        console.error(err);
      }
    }

    loadAll();
  }, [slug]);

  /* ===============================
     LOAD SERVICES
  ============================== */
  useEffect(() => {
    if (!slug) return;
    if (!selectedBranchId) return;

    async function loadServices() {
      const res = await fetch(
        `/api/public-services/${slug}?branch_id=${selectedBranchId}`
      );
      const data = await res.json();

      setServices(data.services || []);
    }

    loadServices();
  }, [slug, selectedBranchId]);

  /* ===============================
     LOAD SLOTS (FIXED)
  ============================== */
  useEffect(() => {
    const serviceId = selectedService?.id;

    if (!slug || !serviceId || !selectedBranchId) return;

    async function loadSlots() {
      try {
        const res = await fetch(
          `/api/public-slots/${slug}/${serviceId}?date=${formatDate(selectedDate)}&branch_id=${selectedBranchId}&staff_id=${selectedStaffId}`
        );

        const data = await res.json();

        setWeekSlots({
          [formatDate(selectedDate)]: data.slots || [],
        });
      } catch (err) {
        console.error(err);
      }
    }

    loadSlots();
  }, [slug, selectedService, selectedDate, selectedBranchId, selectedStaffId]);

  return (
    <div className="p-6 space-y-6">

      {/* Sucursal */}
      {branches.length > 1 && (
        <select
          value={selectedBranchId}
          onChange={(e) => {
            setSelectedBranchId(e.target.value);
            setSelectedService(null);
            setSelectedSlot(null);
          }}
          className="w-full max-w-sm rounded-xl border px-4 py-3"
        >
          <option value="">Selecciona sucursal</option>
          {branches.map((b) => (
            <option key={b.id} value={b.id}>
              {b.name}
            </option>
          ))}
        </select>
      )}

      {/* Servicio */}
      <select
        value={selectedService?.id || ""}
        onChange={(e) => {
          const service =
            services.find((s) => s.id === e.target.value) || null;

          setSelectedService(service);
          setSelectedSlot(null);
        }}
        className="w-full max-w-sm rounded-xl border px-4 py-3"
      >
        <option value="">Selecciona servicio</option>
        {services.map((s) => (
          <option key={s.id} value={s.id}>
            {s.name}
          </option>
        ))}
      </select>

      {/* Calendario */}
      <div className="max-w-sm">
        <Calendar value={selectedDate} onChange={(d: any) => setSelectedDate(d)} />
      </div>

      {/* Horarios */}
      <div className="flex flex-wrap gap-2">
        {(weekSlots[formatDate(selectedDate)] || []).map((slot, i) => (
          <button
            key={i}
            onClick={() => {
              setSelectedSlot(slot);
              setTimeout(() => {
                formRef.current?.scrollIntoView({ behavior: "smooth" });
              }, 100);
            }}
            className={`rounded-xl border px-4 py-2 ${
              selectedSlot?.slot_start === slot.slot_start
                ? "bg-black text-white"
                : "bg-white"
            }`}
          >
            {formatHour(slot.slot_start)}
          </button>
        ))}
      </div>

      {/* FORMULARIO DINÁMICO */}
      {selectedSlot && (
        <div ref={formRef} className="border p-4 rounded-xl space-y-3">
          <input
            placeholder="Nombre y apellido"
            value={customerData.name}
            onChange={(e) => updateCustomerField("name", e.target.value)}
            className="w-full border p-3 rounded-xl"
          />

          <input
            placeholder="Teléfono"
            value={customerData.phone}
            onChange={(e) => updateCustomerField("phone", e.target.value)}
            className="w-full border p-3 rounded-xl"
          />

          <input
            placeholder="Email"
            value={customerData.email}
            onChange={(e) => updateCustomerField("email", e.target.value)}
            className="w-full border p-3 rounded-xl"
          />

          {bookingFields
            .filter((f) => f.enabled)
            .map((field) => (
              <input
                key={field.key}
                placeholder={field.label}
                value={customerData[field.key] || ""}
                onChange={(e) =>
                  updateCustomerField(field.key, e.target.value)
                }
                className="w-full border p-3 rounded-xl"
              />
            ))}

          <button
            className="w-full bg-black text-white py-3 rounded-xl"
            onClick={() => {
              console.log("RESERVA:", {
                slot: selectedSlot,
                service: selectedService,
                data: customerData,
              });

              alert("Listo para conectar backend 🔥");
            }}
          >
            Confirmar reserva
          </button>
        </div>
      )}
    </div>
  );
}