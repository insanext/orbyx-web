"use client";

import { useEffect, useMemo, useRef, useState } from "react";
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
  address?: string | null;
  phone?: string | null;
};

type SlotItem = {
  slot_start: string;
  staff_id?: string | null;
};

type BookingField = {
  key: string;
  label: string;
  enabled: boolean;
  required: boolean;
};

type PublicBusinessResponse = {
  business?: {
    id: string;
    name: string;
    slug: string;
    description?: string | null;
    phone?: string | null;
    address?: string | null;
    email?: string | null;
    whatsapp?: string | null;
    instagram_url?: string | null;
    facebook_url?: string | null;
    min_booking_notice_minutes?: number | null;
    max_booking_days_ahead?: number | null;
  };
  calendar_id?: string | null;
  google_connected?: boolean;
};

function formatDate(date: Date) {
  const local = new Date(date);
  const year = local.getFullYear();
  const month = String(local.getMonth() + 1).padStart(2, "0");
  const day = String(local.getDate()).padStart(2, "0");
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

function getStartOfWeek(date: Date) {
  const d = new Date(date);
  const day = d.getDay(); // domingo 0
  const diff = day === 0 ? -6 : 1 - day; // lunes inicio
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function getWeekDates(date: Date) {
  const start = getStartOfWeek(date);
  return Array.from({ length: 7 }, (_, index) => {
    const current = new Date(start);
    current.setDate(start.getDate() + index);
    return current;
  });
}

function getDayShort(date: Date) {
  return date
    .toLocaleDateString("es-CL", { weekday: "short" })
    .replace(".", "")
    .toUpperCase();
}

function getDayNumber(date: Date) {
  return date.getDate();
}

export default function Page() {
  const params = useParams();
  const slug = (params?.slug as string) || "";

  const [business, setBusiness] = useState<PublicBusinessResponse["business"] | null>(null);
  const [calendarId, setCalendarId] = useState("");

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
  const [customerData, setCustomerData] = useState<Record<string, string>>({
    name: "",
    phone: "",
    email: "",
  });

  const [loadingServices, setLoadingServices] = useState(false);
  const [loadingStaff, setLoadingStaff] = useState(false);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [submitOk, setSubmitOk] = useState("");

  const formRef = useRef<HTMLDivElement | null>(null);

  const weekDates = useMemo(() => getWeekDates(selectedDate), [selectedDate]);

  function updateCustomerField(key: string, value: string) {
    setCustomerData((prev) => ({
      ...prev,
      [key]: value,
    }));
  }

  function resetAfterBranchChange() {
    setServices([]);
    setSelectedService(null);
    setStaffOptions([]);
    setSelectedStaffId("");
    setSelectedSlot(null);
    setWeekSlots({});
    setSubmitError("");
    setSubmitOk("");
  }

  function resetAfterServiceChange() {
    setStaffOptions([]);
    setSelectedStaffId("");
    setSelectedSlot(null);
    setWeekSlots({});
    setSubmitError("");
    setSubmitOk("");
  }

  function getVisibleFields() {
    return bookingFields.filter((field) => field.enabled);
  }

  function validateForm() {
    if (!customerData.name?.trim()) {
      return "Debes ingresar nombre y apellido.";
    }

    if (!customerData.phone?.trim()) {
      return "Debes ingresar teléfono.";
    }

    if (!customerData.email?.trim()) {
      return "Debes ingresar email.";
    }

    for (const field of getVisibleFields()) {
      if (field.required && !String(customerData[field.key] || "").trim()) {
        return `Debes completar ${field.label}.`;
      }
    }

    return "";
  }

  useEffect(() => {
    if (!slug) return;

    async function loadInitial() {
      try {
        const [businessRes, servicesRes, fieldsRes] = await Promise.all([
          fetch(`https://orbyx-backend.onrender.com/public/business/${slug}`, {
            cache: "no-store",
          }),
          fetch(`/api/public-services/${slug}`, {
            cache: "no-store",
          }),
          fetch(`https://orbyx-backend.onrender.com/booking-fields/${slug}`, {
            cache: "no-store",
          }),
        ]);

        const businessData: PublicBusinessResponse = await businessRes.json();
        const servicesData = await servicesRes.json();
        const fieldsData = await fieldsRes.json();

        setBusiness(businessData.business || null);
        setCalendarId(String(businessData.calendar_id || ""));

        const branchRows: BranchItem[] = Array.isArray(servicesData.branches)
          ? servicesData.branches
          : [];

        setBranches(branchRows);

        if (branchRows.length === 1) {
          setSelectedBranchId(branchRows[0].id);
        } else {
          setSelectedBranchId("");
        }

        setBookingFields(
          Array.isArray(fieldsData.booking_fields_config)
            ? fieldsData.booking_fields_config
            : []
        );
      } catch (error) {
        console.error("Error cargando página pública:", error);
      }
    }

    loadInitial();
  }, [slug]);

  useEffect(() => {
    if (!slug) return;
    if (branches.length > 1 && !selectedBranchId) return;

    async function loadServices() {
      try {
        setLoadingServices(true);

        const query = selectedBranchId
          ? `?branch_id=${encodeURIComponent(selectedBranchId)}`
          : "";

        const res = await fetch(`/api/public-services/${slug}${query}`, {
          cache: "no-store",
        });
        const data = await res.json();

        const rows: ServiceItem[] = Array.isArray(data.services) ? data.services : [];
        setServices(rows);

        setSelectedService((prev) => {
          if (!prev) return null;
          return rows.find((service) => service.id === prev.id) || null;
        });
      } catch (error) {
        console.error("Error cargando servicios:", error);
        setServices([]);
        setSelectedService(null);
      } finally {
        setLoadingServices(false);
      }
    }

    loadServices();
  }, [slug, selectedBranchId, branches]);

  useEffect(() => {
    const serviceId = selectedService?.id;
    if (!slug || !serviceId) return;

    async function loadStaff() {
      try {
        setLoadingStaff(true);

        const query = selectedBranchId
          ? `?branch_id=${encodeURIComponent(selectedBranchId)}`
          : "";

        const res = await fetch(`/api/public-staff/${slug}/${serviceId}${query}`, {
          cache: "no-store",
        });
        const data = await res.json();

        const rows: StaffItem[] = Array.isArray(data.staff) ? data.staff : [];
        setStaffOptions(rows);

        setSelectedStaffId((prev) => {
          if (!prev) return "";
          return rows.some((staff) => staff.id === prev) ? prev : "";
        });
      } catch (error) {
        console.error("Error cargando staff:", error);
        setStaffOptions([]);
        setSelectedStaffId("");
      } finally {
        setLoadingStaff(false);
      }
    }

    loadStaff();
  }, [slug, selectedService, selectedBranchId]);

  useEffect(() => {
    const serviceId = selectedService?.id;
    if (!slug || !serviceId) return;
    if (branches.length > 1 && !selectedBranchId) return;

    async function loadWeekSlots() {
      try {
        setLoadingSlots(true);

        const results = await Promise.all(
          weekDates.map(async (dateObj) => {
            const date = formatDate(dateObj);

            const query = new URLSearchParams();
            query.set("date", date);

            if (selectedBranchId) {
              query.set("branch_id", selectedBranchId);
            }

            if (selectedStaffId) {
              query.set("staff_id", selectedStaffId);
            }

            const res = await fetch(
              `/api/public-slots/${slug}/${serviceId}?${query.toString()}`,
              {
                cache: "no-store",
              }
            );

            const data = await res.json();
            return {
              date,
              slots: Array.isArray(data.slots) ? data.slots : [],
            };
          })
        );

        const mapped: Record<string, SlotItem[]> = {};
        results.forEach((item) => {
          mapped[item.date] = item.slots;
        });

        setWeekSlots(mapped);

        if (selectedSlot) {
  const stillExists = results.some((item) =>
    item.slots.some(
      (slot: SlotItem) => slot.slot_start === selectedSlot.slot_start
    )
  );

  if (!stillExists) {
    setSelectedSlot(null);
  }
}
      } catch (error) {
        console.error("Error cargando horarios:", error);
        setWeekSlots({});
      } finally {
        setLoadingSlots(false);
      }
    }

    loadWeekSlots();
  }, [
    slug,
    selectedService,
    selectedDate,
    selectedBranchId,
    selectedStaffId,
    branches,
    weekDates,
    selectedSlot,
  ]);

  async function handleSubmitBooking() {
    try {
      setSubmitError("");
      setSubmitOk("");

      if (!selectedService) {
        setSubmitError("Debes seleccionar un servicio.");
        return;
      }

      if (!selectedSlot) {
        setSubmitError("Debes seleccionar un horario.");
        return;
      }

      if (!calendarId) {
        setSubmitError("No se encontró el calendario del negocio.");
        return;
      }

      const validationError = validateForm();
      if (validationError) {
        setSubmitError(validationError);
        return;
      }

      setSubmitting(true);

      const payload = {
        calendar_id: calendarId,
        branch_id: selectedBranchId || null,
        service_id: selectedService.id,
        staff_id: selectedStaffId || null,
        date: formatDate(new Date(selectedSlot.slot_start)),
        slot_start: selectedSlot.slot_start,
        customer_name: customerData.name.trim(),
        customer_phone: customerData.phone.trim(),
        customer_email: customerData.email.trim(),
        customer_data: getVisibleFields().reduce<Record<string, string>>(
          (acc, field) => {
            const value = String(customerData[field.key] || "").trim();
            if (value) {
              acc[field.key] = value;
            }
            return acc;
          },
          {}
        ),
      };

      const res = await fetch("/api/appointments/slot", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "No se pudo crear la reserva.");
      }

      setSubmitOk(
        "Reserva creada correctamente. Revisa tu correo para la confirmación."
      );

      setCustomerData({
        name: "",
        phone: "",
        email: "",
      });

      setSelectedSlot(null);

      if (selectedService?.id) {
        const queryBase = new URLSearchParams();
        queryBase.set("date", formatDate(selectedDate));

        if (selectedBranchId) {
          queryBase.set("branch_id", selectedBranchId);
        }

        if (selectedStaffId) {
          queryBase.set("staff_id", selectedStaffId);
        }
      }
    } catch (error: any) {
      setSubmitError(error?.message || "No se pudo crear la reserva.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-[1600px] px-4 py-8 md:px-6 xl:px-10">
      <div className="grid gap-8 xl:grid-cols-[1.2fr_1.15fr]">
        <div className="space-y-6">
          <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
              Reserva online
            </p>

            <h1 className="mt-2 text-4xl font-bold tracking-tight text-slate-950">
              {business?.name || slug}
            </h1>

            {business?.description ? (
              <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-600">
                {business.description}
              </p>
            ) : null}

            <div className="mt-5 flex flex-wrap gap-3 text-sm text-slate-600">
              {business?.phone ? (
                <span className="rounded-full bg-slate-100 px-3 py-1.5">
                  {business.phone}
                </span>
              ) : null}

              {business?.address ? (
                <span className="rounded-full bg-slate-100 px-3 py-1.5">
                  {business.address}
                </span>
              ) : null}
            </div>
          </div>

          <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="space-y-5">
              {branches.length > 1 ? (
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-slate-700">
                    Sucursal
                  </label>
                  <select
                    value={selectedBranchId}
                    onChange={(e) => {
                      setSelectedBranchId(e.target.value);
                      resetAfterBranchChange();
                    }}
                    className="h-12 w-full rounded-2xl border border-slate-300 bg-white px-4 text-sm outline-none focus:border-slate-400"
                  >
                    <option value="">Selecciona sucursal</option>
                    {branches.map((branch) => (
                      <option key={branch.id} value={branch.id}>
                        {branch.name}
                      </option>
                    ))}
                  </select>
                </div>
              ) : null}

              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-700">
                  Servicio
                </label>
                <select
                  value={selectedService?.id || ""}
                  disabled={loadingServices || (branches.length > 1 && !selectedBranchId)}
                  onChange={(e) => {
                    const service =
                      services.find((s) => s.id === e.target.value) || null;
                    setSelectedService(service);
                    resetAfterServiceChange();
                  }}
                  className="h-12 w-full rounded-2xl border border-slate-300 bg-white px-4 text-sm outline-none disabled:bg-slate-100 focus:border-slate-400"
                >
                  <option value="">
                    {loadingServices
                      ? "Cargando servicios..."
                      : branches.length > 1 && !selectedBranchId
                      ? "Selecciona sucursal"
                      : "Selecciona servicio"}
                  </option>

                  {services.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                      {s.duration_minutes ? ` · ${s.duration_minutes} min` : ""}
                      {typeof s.price === "number" ? ` · ${formatPrice(s.price)}` : ""}
                    </option>
                  ))}
                </select>
              </div>

              {selectedService ? (
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-sm font-semibold text-slate-900">
                    {selectedService.name}
                  </p>

                  <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-600">
                    <span className="rounded-full bg-white px-2.5 py-1">
                      {selectedService.duration_minutes || 0} min
                    </span>
                    <span className="rounded-full bg-white px-2.5 py-1">
                      {formatPrice(selectedService.price)}
                    </span>
                  </div>
                </div>
              ) : null}

              {selectedService ? (
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-slate-700">
                    Profesional
                  </label>

                  <select
                    value={selectedStaffId}
                    disabled={loadingStaff}
                    onChange={(e) => {
                      setSelectedStaffId(e.target.value);
                      setSelectedSlot(null);
                    }}
                    className="h-12 w-full rounded-2xl border border-slate-300 bg-white px-4 text-sm outline-none disabled:bg-slate-100 focus:border-slate-400"
                  >
                    <option value="">
                      {loadingStaff ? "Cargando profesionales..." : "Cualquiera disponible"}
                    </option>

                    {staffOptions.map((staff) => (
                      <option key={staff.id} value={staff.id}>
                        {staff.name}
                        {staff.role ? ` · ${staff.role}` : ""}
                      </option>
                    ))}
                  </select>
                </div>
              ) : null}
            </div>
          </div>

          {selectedSlot ? (
            <div
              ref={formRef}
              className="rounded-[28px] border border-emerald-200 bg-emerald-50 p-6 shadow-sm"
            >
              <p className="text-sm font-semibold text-emerald-800">
                Hora seleccionada: {formatHour(selectedSlot.slot_start)}
              </p>

              <div className="mt-5 space-y-3">
                <input
                  placeholder="Nombre y apellido"
                  value={customerData.name || ""}
                  onChange={(e) => updateCustomerField("name", e.target.value)}
                  className="h-12 w-full rounded-2xl border border-slate-300 bg-white px-4 text-sm outline-none focus:border-slate-400"
                />

                <input
                  placeholder="Teléfono"
                  value={customerData.phone || ""}
                  onChange={(e) => updateCustomerField("phone", e.target.value)}
                  className="h-12 w-full rounded-2xl border border-slate-300 bg-white px-4 text-sm outline-none focus:border-slate-400"
                />

                <input
                  placeholder="Email"
                  type="email"
                  value={customerData.email || ""}
                  onChange={(e) => updateCustomerField("email", e.target.value)}
                  className="h-12 w-full rounded-2xl border border-slate-300 bg-white px-4 text-sm outline-none focus:border-slate-400"
                />

                {getVisibleFields().map((field) => (
                  <input
                    key={field.key}
                    placeholder={field.label}
                    value={customerData[field.key] || ""}
                    onChange={(e) => updateCustomerField(field.key, e.target.value)}
                    className="h-12 w-full rounded-2xl border border-slate-300 bg-white px-4 text-sm outline-none focus:border-slate-400"
                  />
                ))}

                {submitError ? (
                  <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                    {submitError}
                  </div>
                ) : null}

                {submitOk ? (
                  <div className="rounded-2xl border border-emerald-200 bg-white px-4 py-3 text-sm text-emerald-700">
                    {submitOk}
                  </div>
                ) : null}

                <button
                  type="button"
                  onClick={handleSubmitBooking}
                  disabled={submitting}
                  className="inline-flex h-12 w-full items-center justify-center rounded-2xl bg-slate-950 px-5 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {submitting ? "Confirmando..." : "Confirmar reserva"}
                </button>
              </div>
            </div>
          ) : null}
        </div>

        <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-bold text-slate-950">
            Selecciona fecha y hora
          </h2>

          <div className="mt-5 grid gap-6 xl:grid-cols-[360px_1fr]">
            <div className="min-w-0">
              <Calendar
                minDate={new Date()}
                onChange={(value: any) => {
                  const picked = Array.isArray(value) ? value[0] : value;
                  if (!picked) return;
                  setSelectedDate(new Date(picked));
                  setSelectedSlot(null);
                }}
                value={selectedDate}
              />
            </div>

            <div className="min-w-0">
              <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-slate-500">
                Horarios de la semana
              </h3>

              <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                {weekDates.map((dateObj) => {
                  const dateKey = formatDate(dateObj);
                  const slots = weekSlots[dateKey] || [];
                  const isSelectedDay = formatDate(selectedDate) === dateKey;

                  return (
                    <div
                      key={dateKey}
                      className={`rounded-2xl border p-3 ${
                        isSelectedDay
                          ? "border-slate-900 bg-slate-50"
                          : "border-slate-200 bg-white"
                      }`}
                    >
                      <div className="mb-3">
                        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
                          {getDayShort(dateObj)}
                        </p>
                        <p className="mt-1 text-lg font-bold text-slate-900">
                          {getDayNumber(dateObj)}
                        </p>
                      </div>

                      {loadingSlots ? (
                        <p className="text-sm text-slate-500">Cargando...</p>
                      ) : !selectedService ? (
                        <p className="text-sm text-slate-500">
                          Selecciona un servicio.
                        </p>
                      ) : slots.length === 0 ? (
                        <p className="text-sm text-slate-500">
                          Sin horarios.
                        </p>
                      ) : (
                        <div className="flex flex-wrap gap-2">
                          {slots.map((slot, index) => (
                            <button
                              key={`${slot.slot_start}-${index}`}
                              type="button"
                              onClick={() => {
                                setSelectedSlot(slot);
                                setTimeout(() => {
                                  formRef.current?.scrollIntoView({
                                    behavior: "smooth",
                                    block: "start",
                                  });
                                }, 100);
                              }}
                              className={`rounded-xl border px-3 py-2 text-sm font-medium transition ${
                                selectedSlot?.slot_start === slot.slot_start
                                  ? "border-slate-950 bg-slate-950 text-white"
                                  : "border-slate-300 bg-white text-slate-700 hover:border-slate-500"
                              }`}
                            >
                              {formatHour(slot.slot_start)}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}