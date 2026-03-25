"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "next/navigation";
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
  duration_minutes?: number | null;
  price?: number | null;
};

type BranchItem = {
  id: string;
  name: string;
};

type SlotItem = {
  slot_start: string;
  staff_id?: string;
};

type BookingField = {
  key: string;
  label: string;
  enabled: boolean;
  required: boolean;
};

type PublicServicesResponse = {
  business?: {
    id?: string;
    name?: string;
    slug?: string;
    description?: string | null;
    phone?: string | null;
    address?: string | null;
    instagram_url?: string | null;
  };
  branch?: {
    id?: string;
    name?: string;
  };
  branches?: BranchItem[];
  calendar_id?: string | null;
  services?: ServiceItem[];
  error?: string;
};

type CreateAppointmentResponse = {
  ok?: boolean;
  error?: string;
  appointment?: {
    id: string;
  };
  cancel_url?: string;
};

export default function Page() {
  const params = useParams();
  const slug =
    ((params as any)?.slug as string) || ((params as any)?.Slug as string) || "";

  const [businessName, setBusinessName] = useState("");
  const [businessPhone, setBusinessPhone] = useState("");
  const [businessAddress, setBusinessAddress] = useState("");
  const [businessDescription, setBusinessDescription] = useState("");
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

  const [loadingSetup, setLoadingSetup] = useState(true);
  const [loadingServices, setLoadingServices] = useState(false);
  const [loadingStaff, setLoadingStaff] = useState(false);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [loadError, setLoadError] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [submitOk, setSubmitOk] = useState("");

  const formRef = useRef<HTMLDivElement | null>(null);

  const showBranchSelector = branches.length > 1;
  const showStaffSelector = staffOptions.length > 1;
  const canLoadWithoutBranch = branches.length <= 1;
  const canLoadContent = canLoadWithoutBranch || !!selectedBranchId;

  const enabledBookingFields = useMemo(
    () => bookingFields.filter((field) => field.enabled),
    [bookingFields]
  );

  function formatDate(date: Date) {
    const safeDate = new Date(date);
    const year = safeDate.getFullYear();
    const month = String(safeDate.getMonth() + 1).padStart(2, "0");
    const day = String(safeDate.getDate()).padStart(2, "0");
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

  function resetAfterBranchChange() {
    setServices([]);
    setSelectedService(null);
    setSelectedStaffId("");
    setStaffOptions([]);
    setSelectedSlot(null);
    setWeekSlots({});
    setSubmitError("");
    setSubmitOk("");
  }

  function resetAfterServiceChange() {
    setSelectedStaffId("");
    setStaffOptions([]);
    setSelectedSlot(null);
    setWeekSlots({});
    setSubmitError("");
    setSubmitOk("");
  }

  function updateCustomerField(key: string, value: string) {
    setCustomerData((prev) => ({
      ...prev,
      [key]: value,
    }));
  }

  function validateForm() {
    const name = String(customerData.name || "").trim();
    const phone = String(customerData.phone || "").trim();
    const email = String(customerData.email || "").trim();

    if (!name) return "Debes ingresar nombre y apellido.";
    if (!phone) return "Debes ingresar teléfono.";
    if (!email) return "Debes ingresar email.";

    for (const field of enabledBookingFields) {
      const value = String(customerData[field.key] || "").trim();

      if (field.required && !value) {
        return `Debes completar: ${field.label}.`;
      }
    }

    return "";
  }

  useEffect(() => {
    if (!slug) return;

    async function loadInitialData() {
      try {
        setLoadingSetup(true);
        setLoadError("");

        const [servicesRes, bookingFieldsRes] = await Promise.all([
          fetch(`/api/public-services/${slug}`),
          fetch(`https://orbyx-backend.onrender.com/booking-fields/${slug}`),
        ]);

        const servicesData: PublicServicesResponse = await servicesRes.json();
        const bookingFieldsData = await bookingFieldsRes.json();

        if (!servicesRes.ok) {
          throw new Error(
            servicesData?.error || "No se pudo cargar la página pública"
          );
        }

        setBusinessName(servicesData.business?.name || "");
        setBusinessPhone(servicesData.business?.phone || "");
        setBusinessAddress(servicesData.business?.address || "");
        setBusinessDescription(servicesData.business?.description || "");
        setCalendarId(String(servicesData.calendar_id || ""));

        const branchRows = Array.isArray(servicesData.branches)
          ? servicesData.branches
          : servicesData.branch?.id
          ? [
              {
                id: String(servicesData.branch.id),
                name: String(servicesData.branch.name || "Sucursal"),
              },
            ]
          : [];

        setBranches(branchRows);

        if (branchRows.length === 1) {
          setSelectedBranchId(branchRows[0].id);
          setServices(Array.isArray(servicesData.services) ? servicesData.services : []);
        } else {
          setSelectedBranchId("");
          setServices([]);
        }

        setBookingFields(
          Array.isArray(bookingFieldsData.booking_fields_config)
            ? bookingFieldsData.booking_fields_config
            : []
        );
      } catch (error: any) {
        setLoadError(error?.message || "No se pudo cargar la página pública");
      } finally {
        setLoadingSetup(false);
      }
    }

    loadInitialData();
  }, [slug]);

  useEffect(() => {
    if (!slug) return;
    if (showBranchSelector && !selectedBranchId) return;
    if (!showBranchSelector && branches.length === 1) return;

    async function loadServices() {
      try {
        setLoadingServices(true);

        const query = buildQuery({
          branch_id: selectedBranchId || undefined,
        });

        const response = await fetch(`/api/public-services/${slug}${query}`);
        const data: PublicServicesResponse = await response.json();

        if (!response.ok) {
          throw new Error(data?.error || "No se pudieron cargar los servicios");
        }

        setServices(Array.isArray(data.services) ? data.services : []);
        setCalendarId(String(data.calendar_id || calendarId || ""));
      } catch (error) {
        console.error(error);
        setServices([]);
      } finally {
        setLoadingServices(false);
      }
    }

    loadServices();
  }, [slug, selectedBranchId, showBranchSelector]);

  useEffect(() => {
    const serviceId = selectedService?.id;

    if (!slug || !serviceId) return;
    if (!canLoadContent) return;

    async function loadStaff() {
      try {
        setLoadingStaff(true);

        const query = buildQuery({
          branch_id: selectedBranchId || undefined,
        });

        const response = await fetch(
          `/api/public-staff/${slug}/${serviceId}${query}`
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data?.error || "No se pudo cargar el staff");
        }

        setStaffOptions(Array.isArray(data.staff) ? data.staff : []);
      } catch (error) {
        console.error(error);
        setStaffOptions([]);
      } finally {
        setLoadingStaff(false);
      }
    }

    loadStaff();
  }, [slug, selectedService, selectedBranchId, canLoadContent]);

  useEffect(() => {
    const serviceId = selectedService?.id;

    if (!slug || !serviceId) return;
    if (!canLoadContent) return;

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
          `/api/public-slots/${slug}/${serviceId}${query}`
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data?.error || "No se pudieron cargar los horarios");
        }

        setWeekSlots({
          [date]: Array.isArray(data.slots) ? data.slots : [],
        });
      } catch (error) {
        console.error(error);
        setWeekSlots({});
      } finally {
        setLoadingSlots(false);
      }
    }

    loadSlots();
  }, [slug, selectedService, selectedDate, selectedBranchId, selectedStaffId, canLoadContent]);

  async function handleBooking() {
    try {
      setSubmitError("");
      setSubmitOk("");

      const validationError = validateForm();

      if (validationError) {
        setSubmitError(validationError);
        return;
      }

      if (!selectedService?.id) {
        setSubmitError("Debes seleccionar un servicio.");
        return;
      }

      if (!selectedSlot?.slot_start) {
        setSubmitError("Debes seleccionar un horario.");
        return;
      }

      if (!calendarId) {
        setSubmitError("No se encontró el calendario del negocio.");
        return;
      }

      setSubmitting(true);

      const dynamicPayload = enabledBookingFields.reduce<Record<string, string>>(
        (acc, field) => {
          acc[field.key] = String(customerData[field.key] || "").trim();
          return acc;
        },
        {}
      );

      const res = await fetch("/api/appointments/slot", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          calendar_id: calendarId,
          branch_id: selectedBranchId || null,
          service_id: selectedService.id,
          staff_id: selectedStaffId || null,
          date: formatDate(selectedDate),
          slot_start: selectedSlot.slot_start,
          customer_name: String(customerData.name || "").trim(),
          customer_phone: String(customerData.phone || "").trim(),
          customer_email: String(customerData.email || "").trim(),
          customer_data: dynamicPayload,
          source: "public_page",
        }),
      });

      const data: CreateAppointmentResponse = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "No se pudo crear la reserva.");
      }

      setSubmitOk(
        "Reserva creada correctamente. Te enviamos un correo con la confirmación."
      );

      setCustomerData({
        name: "",
        phone: "",
        email: "",
      });

      setSelectedSlot(null);
      setWeekSlots({});
    } catch (error: any) {
      setSubmitError(error?.message || "No se pudo crear la reserva.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-6xl px-4 py-8 md:px-6">
        <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr]">
          <section className="space-y-6">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
                Reserva online
              </p>
              <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">
                {businessName || "Reserva tu hora"}
              </h1>

              {businessDescription ? (
                <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
                  {businessDescription}
                </p>
              ) : null}

              {(businessPhone || businessAddress) && (
                <div className="mt-4 flex flex-wrap gap-3 text-sm text-slate-500">
                  {businessPhone ? (
                    <span className="rounded-full bg-slate-100 px-3 py-1.5">
                      {businessPhone}
                    </span>
                  ) : null}
                  {businessAddress ? (
                    <span className="rounded-full bg-slate-100 px-3 py-1.5">
                      {businessAddress}
                    </span>
                  ) : null}
                </div>
              )}
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="space-y-5">
                {showBranchSelector ? (
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
                      className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-200/60"
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
                    disabled={!canLoadContent || loadingServices}
                    value={selectedService?.id || ""}
                    onChange={(e) => {
                      const service =
                        services.find((item) => item.id === e.target.value) ||
                        null;

                      setSelectedService(service);
                      resetAfterServiceChange();
                    }}
                    className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-200/60 disabled:cursor-not-allowed disabled:bg-slate-100"
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
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-sm font-semibold text-slate-900">
                      {selectedService.name}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2 text-xs text-slate-500">
                      <span className="rounded-full bg-white px-3 py-1.5">
                        {selectedService.duration_minutes || 0} min
                      </span>
                      <span className="rounded-full bg-white px-3 py-1.5">
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

                    {loadingStaff ? (
                      <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500">
                        Cargando profesionales...
                      </div>
                    ) : showStaffSelector ? (
                      <select
                        value={selectedStaffId}
                        onChange={(e) => {
                          setSelectedStaffId(e.target.value);
                          setSelectedSlot(null);
                        }}
                        className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-200/60"
                      >
                        <option value="">Cualquiera disponible</option>
                        {staffOptions.map((staff) => (
                          <option key={staff.id} value={staff.id}>
                            {staff.name}
                            {staff.role ? ` · ${staff.role}` : ""}
                          </option>
                        ))}
                      </select>
                    ) : staffOptions.length === 1 ? (
                      <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
                        {staffOptions[0].name}
                        {staffOptions[0].role ? ` · ${staffOptions[0].role}` : ""}
                      </div>
                    ) : (
                      <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500">
                        Cualquiera disponible
                      </div>
                    )}
                  </div>
                ) : null}
              </div>
            </div>
          </section>

          <aside className="space-y-6">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-slate-900">
                Selecciona fecha y hora
              </h2>

              <div className="mt-5 max-w-sm">
                <Calendar
                  minDate={new Date()}
                  onChange={(value: any) => {
                    const picked = Array.isArray(value) ? value[0] : value;
                    if (!picked) return;

                    setSelectedDate(new Date(picked));
                    setSelectedSlot(null);
                    setSubmitError("");
                    setSubmitOk("");
                  }}
                  value={selectedDate}
                />
              </div>

              <div className="mt-6 space-y-3">
                <h3 className="text-sm font-semibold text-slate-900">
                  Horarios disponibles
                </h3>

                {loadingSetup ? (
                  <p className="text-sm text-slate-500">Cargando...</p>
                ) : loadError ? (
                  <p className="text-sm text-rose-600">{loadError}</p>
                ) : !canLoadContent ? (
                  <p className="text-sm text-slate-500">
                    Selecciona una sucursal.
                  </p>
                ) : !selectedService ? (
                  <p className="text-sm text-slate-500">
                    Selecciona un servicio.
                  </p>
                ) : loadingSlots ? (
                  <p className="text-sm text-slate-500">
                    Cargando horarios...
                  </p>
                ) : (weekSlots[formatDate(selectedDate)] || []).length === 0 ? (
                  <p className="text-sm text-slate-500">
                    No hay horarios disponibles para este día.
                  </p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {(weekSlots[formatDate(selectedDate)] || []).map(
                      (slot, index) => (
                        <button
                          key={`${slot.slot_start}-${index}`}
                          type="button"
                          onClick={() => {
                            setSelectedSlot(slot);
                            setSubmitError("");
                            setSubmitOk("");
                            setTimeout(() => {
                              formRef.current?.scrollIntoView({
                                behavior: "smooth",
                                block: "start",
                              });
                            }, 100);
                          }}
                          className={`rounded-2xl border px-4 py-2 text-sm font-medium transition ${
                            selectedSlot?.slot_start === slot.slot_start
                              ? "border-slate-900 bg-slate-900 text-white"
                              : "border-slate-300 bg-white text-slate-700 hover:border-slate-400"
                          }`}
                        >
                          {formatHour(slot.slot_start)}
                        </button>
                      )
                    )}
                  </div>
                )}
              </div>
            </div>

            {selectedSlot ? (
              <div
                ref={formRef}
                className="rounded-3xl border border-emerald-200 bg-white p-6 shadow-sm"
              >
                <p className="text-sm font-semibold text-emerald-700">
                  Hora seleccionada: {formatHour(selectedSlot.slot_start)}
                </p>

                <div className="mt-5 space-y-3">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">
                      Nombre y apellido
                    </label>
                    <input
                      type="text"
                      value={customerData.name || ""}
                      onChange={(e) =>
                        updateCustomerField("name", e.target.value)
                      }
                      className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-200/60"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">
                      Teléfono
                    </label>
                    <input
                      type="text"
                      value={customerData.phone || ""}
                      onChange={(e) =>
                        updateCustomerField("phone", e.target.value)
                      }
                      className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-200/60"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">
                      Email
                    </label>
                    <input
                      type="email"
                      value={customerData.email || ""}
                      onChange={(e) =>
                        updateCustomerField("email", e.target.value)
                      }
                      className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-200/60"
                    />
                  </div>

                  {enabledBookingFields.map((field) => (
                    <div key={field.key}>
                      <label className="mb-2 block text-sm font-medium text-slate-700">
                        {field.label}
                        {field.required ? " *" : ""}
                      </label>
                      <input
                        type="text"
                        value={customerData[field.key] || ""}
                        onChange={(e) =>
                          updateCustomerField(field.key, e.target.value)
                        }
                        className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-200/60"
                      />
                    </div>
                  ))}

                  {submitError ? (
                    <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                      {submitError}
                    </div>
                  ) : null}

                  {submitOk ? (
                    <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                      {submitOk}
                    </div>
                  ) : null}

                  <button
                    type="button"
                    onClick={handleBooking}
                    disabled={submitting}
                    className="w-full rounded-2xl bg-slate-900 px-5 py-3 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {submitting ? "Confirmando..." : "Confirmar reserva"}
                  </button>
                </div>
              </div>
            ) : null}
          </aside>
        </div>
      </div>
    </div>
  );
}