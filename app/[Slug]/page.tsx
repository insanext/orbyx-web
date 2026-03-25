"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, usePathname } from "next/navigation";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";

type StaffItem = {
  id: string;
  name: string;
  role?: string | null;
  color?: string | null;
};

type ServiceItem = {
  id: string;
  name: string;
  description?: string | null;
  duration_minutes?: number | null;
  price?: number | null;
};

type BranchItem = {
  id: string;
  tenant_id?: string;
  name: string;
  slug?: string | null;
  address?: string | null;
  phone?: string | null;
  is_active?: boolean;
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

type BusinessItem = {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  address?: string | null;
  phone?: string | null;
  email?: string | null;
  whatsapp?: string | null;
  instagram_url?: string | null;
  facebook_url?: string | null;
  min_booking_notice_minutes?: number | null;
  max_booking_days_ahead?: number | null;
  booking_fields_config?: BookingField[];
};

type PublicServicesResponse = {
  business?: BusinessItem;
  branch?: BranchItem | null;
  branches?: BranchItem[];
  calendar_id?: string | null;
  services?: ServiceItem[];
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
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
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

function getWeekdayLabel(date: Date) {
  const text = date.toLocaleDateString("es-CL", { weekday: "long" });
  return text.charAt(0).toUpperCase() + text.slice(1);
}

export default function Page() {
  const params = useParams();
  const pathname = usePathname();

  const slugFromParams = Array.isArray(params?.slug)
    ? params.slug[0] || ""
    : typeof params?.slug === "string"
    ? params.slug
    : "";

  const slugFromPathname = pathname?.split("/").filter(Boolean)?.[0] || "";
  const slug = slugFromParams || slugFromPathname;

  const [business, setBusiness] = useState<BusinessItem | null>(null);
  const [calendarId, setCalendarId] = useState("");

  const [branches, setBranches] = useState<BranchItem[]>([]);
  const [selectedBranchId, setSelectedBranchId] = useState("");

  const [services, setServices] = useState<ServiceItem[]>([]);
  const [selectedService, setSelectedService] = useState<ServiceItem | null>(
    null
  );

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

  const [loadingPage, setLoadingPage] = useState(true);
  const [loadingServices, setLoadingServices] = useState(false);
  const [loadingStaff, setLoadingStaff] = useState(false);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [submitError, setSubmitError] = useState("");
  const [submitOk, setSubmitOk] = useState("");

  const formRef = useRef<HTMLDivElement | null>(null);

  const weekDates = useMemo(() => getWeekDates(selectedDate), [selectedDate]);
  const showBranchSelector = branches.length > 1;
  const visibleBookingFields = bookingFields.filter((field) => field.enabled);

  function updateCustomerField(key: string, value: string) {
    setCustomerData((prev) => ({
      ...prev,
      [key]: value,
    }));
  }

  function resetAfterBranchChange() {
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

  function validateForm() {
    if (!customerData.name?.trim()) return "Debes ingresar nombre y apellido.";
    if (!customerData.phone?.trim()) return "Debes ingresar teléfono.";
    if (!customerData.email?.trim()) return "Debes ingresar email.";

    for (const field of visibleBookingFields) {
      if (field.required && !String(customerData[field.key] || "").trim()) {
        return `Debes completar ${field.label}.`;
      }
    }

    return "";
  }

  useEffect(() => {
    if (!slug) {
      setLoadingPage(false);
      return;
    }

    async function loadInitial() {
      try {
        setLoadingPage(true);

        const res = await fetch(`/api/public-services/${slug}`, {
          cache: "no-store",
        });

        const data: PublicServicesResponse = await res.json();

        setBusiness(data.business || null);
        setCalendarId(String(data.calendar_id || ""));

        const branchRowsFromArray: BranchItem[] = Array.isArray(data.branches)
          ? data.branches.filter((branch) => branch?.is_active !== false)
          : [];

        const fallbackBranch: BranchItem[] =
          data.branch && data.branch.is_active !== false ? [data.branch] : [];

        const normalizedBranches =
          branchRowsFromArray.length > 0 ? branchRowsFromArray : fallbackBranch;

        const initialBranchId = normalizedBranches[0]?.id || "";

        const initialServices: ServiceItem[] = Array.isArray(data.services)
          ? data.services
          : [];

        setBranches(normalizedBranches);
        setSelectedBranchId(initialBranchId);
        setServices(initialServices);

        const config = Array.isArray(data.business?.booking_fields_config)
          ? data.business.booking_fields_config
          : [];

        setBookingFields(config);
      } catch (error) {
        console.error("Error cargando página pública:", error);
        setBusiness(null);
        setCalendarId("");
        setBranches([]);
        setSelectedBranchId("");
        setServices([]);
      } finally {
        setLoadingPage(false);
      }
    }

    loadInitial();
  }, [slug]);

  useEffect(() => {
    if (!slug || !selectedBranchId) return;

    async function loadServices() {
      try {
        setLoadingServices(true);

        const query = `?branch_id=${encodeURIComponent(selectedBranchId)}`;

        const res = await fetch(`/api/public-services/${slug}${query}`, {
          cache: "no-store",
        });

        const data: PublicServicesResponse = await res.json();

        const rows: ServiceItem[] = Array.isArray(data.services)
          ? data.services
          : [];

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
  }, [slug, selectedBranchId]);

  useEffect(() => {
    const serviceId = selectedService?.id;

    if (!slug || !serviceId) {
      setStaffOptions([]);
      setSelectedStaffId("");
      return;
    }

    async function loadStaff() {
      try {
        setLoadingStaff(true);

        const query = selectedBranchId
          ? `?branch_id=${encodeURIComponent(selectedBranchId)}`
          : "";

        const res = await fetch(
          `/api/public-staff/${slug}/${serviceId}${query}`,
          {
            cache: "no-store",
          }
        );

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
  }, [slug, selectedService?.id, selectedBranchId]);

  useEffect(() => {
    const serviceId = selectedService?.id;

    if (!slug || !serviceId) {
      setWeekSlots({});
      setSelectedSlot(null);
      return;
    }

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
    selectedService?.id,
    selectedDate,
    selectedBranchId,
    selectedStaffId,
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
        customer_data: visibleBookingFields.reduce<Record<string, string>>(
          (acc, field) => {
            const value = String(customerData[field.key] || "").trim();
            if (value) acc[field.key] = value;
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

      const clearedExtraFields = visibleBookingFields.reduce<
        Record<string, string>
      >((acc, field) => {
        acc[field.key] = "";
        return acc;
      }, {});

      setCustomerData({
        name: "",
        phone: "",
        email: "",
        ...clearedExtraFields,
      });

      setSelectedSlot(null);
    } catch (error: any) {
      setSubmitError(error?.message || "No se pudo crear la reserva.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto w-full max-w-[1750px] px-4 py-8 md:px-8 xl:px-12">
        <div className="grid gap-8 xl:grid-cols-[390px_1fr]">
          <div className="space-y-6">
            <div className="overflow-hidden rounded-[30px] border border-slate-200 bg-white shadow-[0_20px_60px_-35px_rgba(15,23,42,0.35)]">
              <div className="h-2 bg-gradient-to-r from-indigo-600 via-sky-500 to-cyan-400" />
              <div className="p-6">
                <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-slate-400">
                  Reserva online
                </p>

                <h1 className="mt-2 text-4xl font-bold tracking-tight text-slate-950">
                  {business?.name || slug || "Reserva"}
                </h1>

                {business?.description ? (
                  <p className="mt-4 text-sm leading-6 text-slate-600">
                    {business.description}
                  </p>
                ) : null}

                <div className="mt-5 flex flex-wrap gap-2 text-sm text-slate-600">
                  {business?.phone ? (
                    <span className="rounded-full border border-sky-100 bg-sky-50 px-3 py-1.5 text-sky-700">
                      {business.phone}
                    </span>
                  ) : null}

                  {business?.address ? (
                    <span className="rounded-full border border-slate-200 bg-slate-100 px-3 py-1.5 text-slate-700">
                      {business.address}
                    </span>
                  ) : null}
                </div>
              </div>
            </div>

            <div className="rounded-[30px] border border-slate-200 bg-white p-5 shadow-[0_20px_60px_-35px_rgba(15,23,42,0.35)]">
              <div className="space-y-4">
                {showBranchSelector ? (
                  <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                      Sucursal
                    </label>
                    <select
                      value={selectedBranchId}
                      onChange={(e) => {
                        const nextBranchId = e.target.value;
                        resetAfterBranchChange();
                        setSelectedBranchId(nextBranchId);
                      }}
                      className="h-12 w-full rounded-2xl border border-slate-300 bg-white px-4 text-sm text-slate-800 outline-none transition focus:border-indigo-400"
                    >
                      {branches.map((branch) => (
                        <option key={branch.id} value={branch.id}>
                          {branch.name}
                        </option>
                      ))}
                    </select>
                  </div>
                ) : null}

                <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Servicio
                  </label>
                  <select
                    value={selectedService?.id || ""}
                    disabled={loadingServices}
                    onChange={(e) => {
                      const service =
                        services.find((item) => item.id === e.target.value) ||
                        null;
                      resetAfterServiceChange();
                      setSelectedService(service);
                    }}
                    className="h-12 w-full rounded-2xl border border-slate-300 bg-white px-4 text-sm text-slate-800 outline-none transition disabled:bg-slate-100 focus:border-indigo-400"
                  >
                    <option value="">
                      {loadingServices
                        ? "Cargando servicios..."
                        : services.length === 0
                        ? "Sin servicios disponibles"
                        : "Selecciona servicio"}
                    </option>

                    {services.map((service) => (
                      <option key={service.id} value={service.id}>
                        {service.name}
                        {service.duration_minutes
                          ? ` · ${service.duration_minutes} min`
                          : ""}
                        {typeof service.price === "number"
                          ? ` · ${formatPrice(service.price)}`
                          : ""}
                      </option>
                    ))}
                  </select>
                </div>

                {selectedService ? (
                  <div className="rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50 to-sky-50 p-4">
                    <p className="text-sm font-semibold text-slate-900">
                      {selectedService.name}
                    </p>

                    <div className="mt-3 flex flex-wrap gap-2 text-xs">
                      <span className="rounded-full border border-white/80 bg-white px-2.5 py-1 text-slate-700 shadow-sm">
                        {selectedService.duration_minutes || 0} min
                      </span>
                      <span className="rounded-full border border-white/80 bg-white px-2.5 py-1 text-slate-700 shadow-sm">
                        {formatPrice(selectedService.price)}
                      </span>
                    </div>
                  </div>
                ) : null}

                {selectedService ? (
                  <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
                    <div className="mb-3">
                      <p className="text-sm font-semibold text-slate-900">
                        Profesional
                      </p>
                      <p className="text-xs text-slate-500">
                        Selecciona uno o deja cualquiera disponible.
                      </p>
                    </div>

                    <select
                      value={selectedStaffId}
                      disabled={loadingStaff}
                      onChange={(e) => {
                        setSelectedStaffId(e.target.value);
                        setSelectedSlot(null);
                      }}
                      className="h-12 w-full rounded-2xl border border-slate-300 bg-white px-4 text-sm text-slate-800 outline-none transition disabled:bg-slate-100 focus:border-indigo-400"
                    >
                      <option value="">
                        {loadingStaff
                          ? "Cargando profesionales..."
                          : "Cualquiera disponible"}
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

                <div className="rounded-[26px] border border-slate-200 bg-white p-4 shadow-inner">
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
              </div>
            </div>

            {selectedSlot ? (
              <div
                ref={formRef}
                className="rounded-[30px] border border-emerald-200 bg-gradient-to-br from-emerald-50 to-white p-6 shadow-[0_20px_60px_-35px_rgba(16,185,129,0.35)]"
              >
                <p className="text-sm font-semibold text-emerald-800">
                  Hora seleccionada: {formatHour(selectedSlot.slot_start)}
                </p>

                <div className="mt-5 space-y-3">
                  <input
                    placeholder="Nombre y apellido"
                    value={customerData.name || ""}
                    onChange={(e) => updateCustomerField("name", e.target.value)}
                    className="h-12 w-full rounded-2xl border border-slate-300 bg-white px-4 text-sm outline-none transition focus:border-emerald-400"
                  />

                  <input
                    placeholder="Teléfono"
                    value={customerData.phone || ""}
                    onChange={(e) =>
                      updateCustomerField("phone", e.target.value)
                    }
                    className="h-12 w-full rounded-2xl border border-slate-300 bg-white px-4 text-sm outline-none transition focus:border-emerald-400"
                  />

                  <input
                    placeholder="Email"
                    type="email"
                    value={customerData.email || ""}
                    onChange={(e) =>
                      updateCustomerField("email", e.target.value)
                    }
                    className="h-12 w-full rounded-2xl border border-slate-300 bg-white px-4 text-sm outline-none transition focus:border-emerald-400"
                  />

                  {visibleBookingFields.map((field) => (
                    <input
                      key={field.key}
                      placeholder={field.label}
                      value={customerData[field.key] || ""}
                      onChange={(e) =>
                        updateCustomerField(field.key, e.target.value)
                      }
                      className="h-12 w-full rounded-2xl border border-slate-300 bg-white px-4 text-sm outline-none transition focus:border-emerald-400"
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
                    className="inline-flex h-12 w-full items-center justify-center rounded-2xl bg-gradient-to-r from-slate-950 via-indigo-950 to-slate-900 px-5 text-sm font-medium text-white transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {submitting ? "Confirmando..." : "Confirmar reserva"}
                  </button>
                </div>
              </div>
            ) : null}
          </div>

          <div className="rounded-[30px] border border-slate-200 bg-white p-5 shadow-[0_20px_60px_-35px_rgba(15,23,42,0.35)]">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-400">
                  Horarios disponibles
                </p>
                <h2 className="mt-1 text-xl font-bold text-slate-950">
                  Agenda semanal
                </h2>
              </div>

              {selectedService ? (
                <div className="rounded-full border border-indigo-100 bg-indigo-50 px-3 py-1.5 text-xs font-medium text-indigo-700">
                  {selectedService.name}
                </div>
              ) : null}
            </div>

            <div className="overflow-x-auto">
              <div className="grid min-w-[980px] grid-cols-7 gap-3">
                {weekDates.map((dateObj) => {
                  const dateKey = formatDate(dateObj);
                  const slots = weekSlots[dateKey] || [];
                  const isSelectedDay = formatDate(selectedDate) === dateKey;

                  return (
                    <div
                      key={dateKey}
                      className={`rounded-2xl border p-3 transition ${
                        isSelectedDay
                          ? "border-sky-300 bg-gradient-to-b from-sky-50 to-white shadow-sm"
                          : "border-slate-200 bg-slate-50/60"
                      }`}
                    >
                      <div className="mb-3 border-b border-slate-200 pb-2">
                        <p className="text-sm font-bold text-slate-900">
                          {getWeekdayLabel(dateObj)}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          {dateObj.getDate()}/{dateObj.getMonth() + 1}
                        </p>
                      </div>

                      {loadingSlots ? (
                        <p className="text-xs text-slate-500">Cargando...</p>
                      ) : !selectedService ? (
                        <p className="text-xs text-slate-500">
                          Selecciona un servicio.
                        </p>
                      ) : slots.length === 0 ? (
                        <p className="text-xs text-slate-500">Sin horarios.</p>
                      ) : (
                        <div className="space-y-1.5">
                          {slots.map((slot, index) => (
                            <button
                              key={`${slot.slot_start}-${index}`}
                              type="button"
                              onClick={() => {
                                setSelectedDate(new Date(dateObj));
                                setSelectedSlot(slot);
                                setTimeout(() => {
                                  formRef.current?.scrollIntoView({
                                    behavior: "smooth",
                                    block: "start",
                                  });
                                }, 100);
                              }}
                              className={`flex min-h-[40px] w-full flex-col items-center justify-center rounded-xl border px-2 py-1 text-center transition ${
                                selectedSlot?.slot_start === slot.slot_start
                                  ? "border-indigo-700 bg-indigo-700 text-white shadow-sm"
                                  : "border-slate-200 bg-white text-slate-700 hover:border-sky-300 hover:bg-sky-50"
                              }`}
                            >
                              <span className="text-[12px] font-semibold leading-none">
                                {formatHour(slot.slot_start)}
                              </span>
                              <span
                                className={`mt-1 text-[9px] leading-none ${
                                  selectedSlot?.slot_start === slot.slot_start
                                    ? "text-indigo-100"
                                    : "text-slate-400"
                                }`}
                              >
                                Libre
                              </span>
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

        {loadingPage ? (
          <div className="mt-6 text-sm text-slate-500">Cargando...</div>
        ) : null}
      </div>
    </div>
  );
}