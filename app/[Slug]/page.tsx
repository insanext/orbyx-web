"use client";

import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";

type CalendarValue = Date | [Date | null, Date | null] | null;

type StaffItem = {
  id: string;
  name: string;
  role?: string | null;
  color?: string | null;
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

export default function Page() {
  const params = useParams();
  const slug = (params?.slug as string) || "";

  const [branches, setBranches] = useState<BranchItem[]>([]);
  const [selectedBranchId, setSelectedBranchId] = useState("");

  const [services, setServices] = useState<ServiceItem[]>([]);
  const [selectedService, setSelectedService] =
    useState<ServiceItem | null>(null);

  const [staffOptions, setStaffOptions] = useState<StaffItem[]>([]);
  const [selectedStaffId, setSelectedStaffId] = useState("");

  const [selectedDate, setSelectedDate] = useState(new Date());
  const [weekSlots, setWeekSlots] = useState<Record<string, SlotItem[]>>({});
  const [selectedSlot, setSelectedSlot] = useState<SlotItem | null>(null);

  const [loadingSlots, setLoadingSlots] = useState(false);

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

  function resetFlow() {
    setSelectedService(null);
    setSelectedStaffId("");
    setStaffOptions([]);
    setSelectedSlot(null);
    setWeekSlots({});
  }

  // 🔹 Load branches
  useEffect(() => {
    if (!slug) return;

    fetch(`/api/public-services/${slug}`)
      .then((r) => r.json())
      .then((data) => {
        const b = Array.isArray(data.branches) ? data.branches : [];
        setBranches(b);

        if (b.length === 1) {
          setSelectedBranchId(b[0].id);
        }
      });
  }, [slug]);

  // 🔹 Load services by branch
  useEffect(() => {
    if (!slug || !selectedBranchId) return;

    fetch(`/api/public-services/${slug}?branch_id=${selectedBranchId}`)
      .then((r) => r.json())
      .then((data) => {
        const rows: ServiceItem[] = Array.isArray(data.services)
          ? data.services
          : [];

        setServices(rows);

        setSelectedService((prev) => {
          if (!prev) return null;
          return (
            rows.find((service: ServiceItem) => service.id === prev.id) || null
          );
        });
      });
  }, [slug, selectedBranchId]);

  // 🔹 Load staff
  useEffect(() => {
    if (!slug || !selectedService || !selectedBranchId) return;

    fetch(
      `/api/public-staff/${slug}/${selectedService.id}?branch_id=${selectedBranchId}`
    )
      .then((r) => r.json())
      .then((data) => {
        const rows = Array.isArray(data.staff) ? data.staff : [];
        setStaffOptions(rows);
      });
  }, [slug, selectedService, selectedBranchId]);

  // 🔹 Load slots
  useEffect(() => {
    if (!slug || !selectedService || !selectedBranchId) return;

    setLoadingSlots(true);

    const date = formatDate(selectedDate);

    fetch(
      `/api/public-slots/${slug}/${selectedService.id}?date=${date}&branch_id=${selectedBranchId}`
    )
      .then((r) => r.json())
      .then((data) => {
        setWeekSlots({
          [date]: Array.isArray(data.slots) ? data.slots : [],
        });
      })
      .finally(() => setLoadingSlots(false));
  }, [slug, selectedService, selectedDate, selectedBranchId]);

  const showBranchSelector = branches.length > 1;

  return (
    <div className="p-6 space-y-6">
      {/* 🔹 Sucursal */}
      {showBranchSelector && (
        <select
          value={selectedBranchId}
          onChange={(e) => {
            setSelectedBranchId(e.target.value);
            resetFlow();
          }}
        >
          <option value="">Selecciona sucursal</option>
          {branches.map((b) => (
            <option key={b.id} value={b.id}>
              {b.name}
            </option>
          ))}
        </select>
      )}

      {/* 🔹 Servicios */}
      <select
        disabled={!selectedBranchId}
        value={selectedService?.id || ""}
        onChange={(e) => {
          const service =
            services.find((s) => s.id === e.target.value) || null;
          setSelectedService(service);
          resetFlow();
        }}
      >
        <option value="">
          {!selectedBranchId
            ? "Selecciona sucursal"
            : "Selecciona servicio"}
        </option>
        {services.map((s) => (
          <option key={s.id} value={s.id}>
            {s.name}
          </option>
        ))}
      </select>

      {/* 🔹 Calendar */}
      <Calendar
        minDate={new Date()}
        onChange={(value: CalendarValue) => {
          const picked = Array.isArray(value) ? value[0] : value;
          if (!picked) return;

          setSelectedDate(new Date(picked));
          setSelectedSlot(null);
        }}
        value={selectedDate}
      />

      {/* 🔹 Slots */}
      {loadingSlots ? (
        <p>Cargando horarios...</p>
      ) : (
        (weekSlots[formatDate(selectedDate)] || []).map((slot, i) => (
          <button
            key={i}
            onClick={() => {
              setSelectedSlot(slot);
              formRef.current?.scrollIntoView({ behavior: "smooth" });
            }}
          >
            {formatHour(slot.slot_start)}
          </button>
        ))
      )}

      {/* 🔹 Confirmación */}
      {selectedSlot && (
        <div ref={formRef}>
          <p>Hora seleccionada: {formatHour(selectedSlot.slot_start)}</p>
        </div>
      )}
    </div>
  );
}