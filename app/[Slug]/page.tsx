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
  const [selectedService, setSelectedService] = useState<ServiceItem | null>(null);

  const [staffOptions, setStaffOptions] = useState<StaffItem[]>([]);
  const [selectedStaffId, setSelectedStaffId] = useState("");

  const [selectedDate, setSelectedDate] = useState(new Date());
  const [weekSlots, setWeekSlots] = useState<Record<string, SlotItem[]>>({});
  const [selectedSlot, setSelectedSlot] = useState<SlotItem | null>(null);

  const [loadingServices, setLoadingServices] = useState(false);
  const [loadingStaff, setLoadingStaff] = useState(false);
  const [loadingSlots, setLoadingSlots] = useState(false);

  const formRef = useRef<HTMLDivElement | null>(null);

  function formatDate(date: Date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  function formatHour(dateString: string) {
    return new Date(dateString).toLocaleTimeString("es-CL", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  }

  function formatPrice(price?: number | null) {
    return new Intl.NumberFormat("es-CL", {
      style: "currency",
      currency: "CLP",
      maximumFractionDigits: 0,
    }).format(price || 0);
  }

  function resetAfterBranchChange() {
    setServices([]);
    setSelectedService(null);
    setSelectedStaffId("");
    setStaffOptions([]);
    setSelectedSlot(null);
    setWeekSlots({});
  }

  function resetAfterServiceChange() {
    setSelectedStaffId("");
    setStaffOptions([]);
    setSelectedSlot(null);
    setWeekSlots({});
  }

  function buildQuery(paramsObj: Record<string, string | undefined>) {
    const query = new URLSearchParams();

    Object.entries(paramsObj).forEach(([key, value]) => {
      if (value && value.trim() !== "") {
        query.set(key, value);
      }
    });

    const queryString = query.toString();
    return queryString ? `?${queryString}` : "";
  }

  const hasBranches = branches.length > 0;
  const showBranchSelector = branches.length > 1;
  const canUseBranchlessMode = branches.length === 0;
  const canLoadContent = canUseBranchlessMode || !!selectedBranchId;

  // Cargar sucursales
  useEffect(() => {
    if (!slug) return;

    async function loadInitialData() {
      try {
        const response = await fetch(`/api/public-services/${slug}`);
        const data = await response.json();

        const branchRows: BranchItem[] = Array.isArray(data.branches) ? data.branches : [];
        setBranches(branchRows);

        if (branchRows.length === 1) {
          setSelectedBranchId(branchRows[0].id);
        } else {
          setSelectedBranchId("");
        }
      } catch {
        setBranches([]);
        setSelectedBranchId("");
      }
    }

    loadInitialData();
  }, [slug]);

  // Cargar servicios
  useEffect(() => {
    if (!slug) return;
    if (hasBranches && !selectedBranchId) return;

    async function loadServices() {
      try {
        setLoadingServices(true);

        const query = buildQuery({
          branch_id: selectedBranchId || undefined,
        });

        const response = await fetch(`/api/public-services/${slug}${query}`);
        const data = await response.json();

        const rows: ServiceItem[] = Array.isArray(data.services) ? data.services : [];
        setServices(rows);

        setSelectedService((prev) => {
          if (!prev) return null;
          return rows.find((service: ServiceItem) => service.id === prev.id) || null;
        });
      } catch {
        setServices([]);
        setSelectedService(null);
      } finally {
        setLoadingServices(false);
      }
    }

    loadServices();
  }, [slug, selectedBranchId, hasBranches]);

  // Cargar staff por servicio
  useEffect(() => {
    if (!slug || !selectedService) return;
    if (hasBranches && !selectedBranchId) return;

    async function loadStaff() {
      try {
        setLoadingStaff(true);

        const query = buildQuery({
          branch_id: selectedBranchId || undefined,
        });

        const response = await fetch(
          `/api/public-staff/${slug}/${selectedService.id}${query}`
        );
        const data = await response.json();

        const rows: StaffItem[] = Array.isArray(data.staff) ? data.staff : [];
        setStaffOptions(rows);
      } catch {
        setStaffOptions([]);
      } finally {
        setLoadingStaff(false);
      }
    }

    loadStaff();
  }, [slug, selectedService, selectedBranchId, hasBranches]);

  // Cargar slots
  useEffect(() => {
    if (!slug || !selectedService) return;
    if (hasBranches && !selectedBranchId) return;

    async function loadSlots() {
      try {
        setLoadingSlots(true);

        const date = formatDate(selectedDate);

        const query = buildQuery({
          date,
          branch_id: selectedBranchId || undefined,
          staff_id: selectedStaffId || undefined,
        });

        const response = await fetch(
          `/api/public-slots/${slug}/${selectedService.id}${query}`
        );
        const data = await response.json();

        setWeekSlots({
          [date]: Array.isArray(data.slots) ? data.slots : [],
        });
      } catch {
        setWeekSlots({});
      } finally {
        setLoadingSlots(false);
      }
    }

    loadSlots();
  }, [slug, selectedService, selectedDate, selectedBranchId, selectedStaffId, hasBranches]);

  return (
    <div className="p-6 space-y-6">
      {showBranchSelector && (
        <div className="space-y-2">
          <label className="block text-sm font-medium text-slate-700">
            Selecciona sucursal
          </label>
          <select
            value={selectedBranchId}
            onChange={(e) => {
              setSelectedBranchId(e.target.value);
              resetAfterBranchChange();
            }}
            className="w-full max-w-sm rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none"
          >
            <option value="">Selecciona sucursal</option>
            {branches.map((branch) => (
              <option key={branch.id} value={branch.id}>
                {branch.name}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="space-y-2">
        <label className="block text-sm font-medium text-slate-700">
          Servicio
        </label>
        <select
          disabled={!canLoadContent || loadingServices}
          value={selectedService?.id || ""}
          onChange={(e) => {
            const service =
              services.find((item: ServiceItem) => item.id === e.target.value) || null;
            setSelectedService(service);
            resetAfterServiceChange();
          }}
          className="w-full max-w-sm rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none disabled:bg-slate-100"
        >
          <option value="">
            {!canLoadContent
              ? "Selecciona sucursal"
              : loadingServices
              ? "Cargando servicios..."
              : "Selecciona servicio"}
          </option>

          {services.map((service) => (
            <option key={service.id} value={service.id}>
              {service.name}
              {service.duration_minutes ? ` · ${service.duration_minutes} min` : ""}
              {typeof service.price === "number" ? ` · ${formatPrice(service.price)}` : ""}
            </option>
          ))}
        </select>
      </div>

      {selectedService && (
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <p className="text-sm font-semibold text-slate-900">{selectedService.name}</p>
          <p className="mt-1 text-sm text-slate-600">
            Duración: {selectedService.duration_minutes || 0} min
          </p>
          <p className="mt-1 text-sm text-slate-600">
            Precio: {formatPrice(selectedService.price)}
          </p>
        </div>
      )}

      {selectedService && (
        <div className="space-y-2">
          <label className="block text-sm font-medium text-slate-700">
            Profesional
          </label>

          {loadingStaff ? (
            <div className="text-sm text-slate-500">Cargando staff...</div>
          ) : (
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm text-slate-700">
                <input
                  type="radio"
                  name="staff"
                  checked={selectedStaffId === ""}
                  onChange={() => {
                    setSelectedStaffId("");
                    setSelectedSlot(null);
                    setWeekSlots({});
                  }}
                />
                Cualquiera disponible
              </label>

              {staffOptions.map((staff) => (
                <label key={staff.id} className="flex items-center gap-2 text-sm text-slate-700">
                  <input
                    type="radio"
                    name="staff"
                    checked={selectedStaffId === staff.id}
                    onChange={() => {
                      setSelectedStaffId(staff.id);
                      setSelectedSlot(null);
                      setWeekSlots({});
                    }}
                  />
                  {staff.name}
                  {staff.role ? ` · ${staff.role}` : ""}
                </label>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="max-w-sm">
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
      </div>

      <div className="space-y-3">
        <h3 className="text-base font-semibold text-slate-900">Horarios disponibles</h3>

        {!canLoadContent ? (
          <p className="text-sm text-slate-500">Selecciona una sucursal.</p>
        ) : !selectedService ? (
          <p className="text-sm text-slate-500">Selecciona un servicio.</p>
        ) : loadingSlots ? (
          <p className="text-sm text-slate-500">Cargando horarios...</p>
        ) : (weekSlots[formatDate(selectedDate)] || []).length === 0 ? (
          <p className="text-sm text-slate-500">No hay horarios disponibles.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {(weekSlots[formatDate(selectedDate)] || []).map((slot, index) => (
              <button
                key={`${slot.slot_start}-${index}`}
                onClick={() => {
                  setSelectedSlot(slot);
                  setTimeout(() => {
                    formRef.current?.scrollIntoView({
                      behavior: "smooth",
                      block: "start",
                    });
                  }, 100);
                }}
                className={`rounded-xl border px-4 py-2 text-sm font-medium ${
                  selectedSlot?.slot_start === slot.slot_start
                    ? "border-slate-900 bg-slate-900 text-white"
                    : "border-slate-300 bg-white text-slate-700"
                }`}
              >
                {formatHour(slot.slot_start)}
              </button>
            ))}
          </div>
        )}
      </div>

      {selectedSlot && (
        <div
          ref={formRef}
          className="rounded-2xl border border-green-200 bg-green-50 p-4"
        >
          <p className="text-sm font-semibold text-green-800">
            Hora seleccionada: {formatHour(selectedSlot.slot_start)}
          </p>
        </div>
      )}
    </div>
  );
}