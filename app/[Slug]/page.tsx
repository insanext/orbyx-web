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
  photo_url?: string | null;
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

type PetItem = {
  id: string;
  customer_id?: string | null;
  name?: string | null;
  species_base?: string | null;
  species_custom?: string | null;
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
  business_category?: string;
};

type PublicServicesResponse = {
  business?: BusinessItem;
  branch?: BranchItem | null;
  branches?: BranchItem[];
  calendar_id?: string | null;
  services?: ServiceItem[];
};

type BookingSuccessData = {
  serviceName: string;
  date: string;
  time: string;
  branchName?: string;
  branchAddress?: string;
  staffName?: string;
  customerEmail?: string;
  customerPhone?: string;
  startIso: string;
  endIso: string;
};

const BACKEND_URL = "https://orbyx-backend.onrender.com";


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

function formatFullDate(dateString: string) {
  const text = new Date(dateString).toLocaleDateString("es-CL", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return text.charAt(0).toUpperCase() + text.slice(1);
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

function dedupeSlots(slots: SlotItem[]) {
  const map = new Map<string, SlotItem>();

  for (const slot of slots) {
    const key = slot.slot_start;
    if (!map.has(key)) {
      map.set(key, slot);
    }
  }

  return Array.from(map.values()).sort((a, b) =>
    a.slot_start.localeCompare(b.slot_start)
  );
}

function normalizeEmail(value?: string | null) {
  return String(value || "").trim().toLowerCase();
}

function normalizePhoneDigits(value?: string | null) {
  return String(value || "").replace(/\D/g, "");
}

function normalizeWhatsappNumber(value?: string | null) {
  if (!value) return "";
  return value.replace(/\D/g, "");
}

function buildMapsUrl(address?: string) {
  if (!address) return "";
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    address
  )}`;
}

function formatGoogleCalendarDate(dateString: string) {
  return new Date(dateString)
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\.\d{3}Z$/, "Z");
}

function buildGoogleCalendarUrl({
  title,
  startIso,
  endIso,
  details,
  location,
}: {
  title: string;
  startIso: string;
  endIso: string;
  details?: string;
  location?: string;
}) {
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: title,
    dates: `${formatGoogleCalendarDate(startIso)}/${formatGoogleCalendarDate(
      endIso
    )}`,
  });

  if (details) {
    params.set("details", details);
  }

  if (location) {
    params.set("location", location);
  }

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

function getStaffInitial(name?: string | null) {
  const safeName = String(name || "").trim();
  if (!safeName) return "?";
  return safeName.charAt(0).toUpperCase();
}

function SummaryChip({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
        {label}
      </p>
      <p className="mt-1 text-sm font-semibold text-slate-900">{value}</p>
    </div>
  );
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
  const isVeterinaria =
    business?.business_category === "veterinaria" ||
    business?.business_category === "vet";

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
    pet_name: "",
    pet_species: "",
  });

  const [pets, setPets] = useState<PetItem[]>([]);
  const [selectedPetId, setSelectedPetId] = useState("");
  const [petMode, setPetMode] = useState<"new" | "existing">("new");
  const [loadingPets, setLoadingPets] = useState(false);
  const [existingCustomerFound, setExistingCustomerFound] = useState(false);

  const [loadingPage, setLoadingPage] = useState(true);
  const [loadingServices, setLoadingServices] = useState(false);
  const [loadingStaff, setLoadingStaff] = useState(false);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [submitError, setSubmitError] = useState("");
  const [bookingSuccess, setBookingSuccess] =
    useState<BookingSuccessData | null>(null);

  const formRef = useRef<HTMLDivElement | null>(null);

  const weekDates = useMemo(() => getWeekDates(selectedDate), [selectedDate]);
  const showBranchSelector = branches.length > 1;
  const visibleBookingFields = bookingFields.filter((field) => field.enabled);

  const selectedBranch =
    branches.find((branch) => branch.id === selectedBranchId) || null;

  const visibleAddress = selectedBranch?.address || business?.address || null;
  const visiblePhone = selectedBranch?.phone || business?.phone || null;

  function updateCustomerField(key: string, value: string) {
    setCustomerData((prev) => ({
      ...prev,
      [key]: value,
    }));
  }

  function resetPetSelection() {
    setSelectedPetId("");
    setPetMode("new");
    setPets([]);
    setExistingCustomerFound(false);

    setCustomerData((prev) => ({
      ...prev,
      pet_name: "",
      pet_species: "",
    }));
  }

  function applyPetToForm(pet: PetItem | null) {
    if (!pet) return;

    const resolvedSpecies =
      String(pet.species_custom || "").trim() ||
      String(pet.species_base || "").trim();

    setCustomerData((prev) => ({
      ...prev,
      pet_name: String(pet.name || "").trim(),
      pet_species: resolvedSpecies,
    }));
  }

  function resetAfterBranchChange() {
    setSelectedService(null);
    setStaffOptions([]);
    setSelectedStaffId("");
    setSelectedSlot(null);
    setWeekSlots({});
    setSubmitError("");
    setBookingSuccess(null);
  }

  function resetAfterServiceChange() {
    setStaffOptions([]);
    setSelectedStaffId("");
    setSelectedSlot(null);
    setWeekSlots({});
    setSubmitError("");
    setBookingSuccess(null);
  }

  function validateForm() {
    if (!customerData.name?.trim()) return "Debes ingresar nombre y apellido.";
    if (!customerData.phone?.trim()) return "Debes ingresar teléfono.";
    if (!customerData.email?.trim()) return "Debes ingresar email.";

      if (isVeterinaria) {
        if (petMode === "existing" && pets.length > 0 && !selectedPetId) {
          return "Debes seleccionar una mascota.";
        }

        if (!String(customerData.pet_name || "").trim()) {
          return "Debes ingresar nombre de la mascota.";
        }

        if (!String(customerData.pet_species || "").trim()) {
          return "Debes ingresar especie de la mascota.";
        }
      }

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
    const normalizedPhone = normalizePhoneDigits(customerData.phone);
    const normalizedEmail = normalizeEmail(customerData.email);

    if ((!normalizedPhone || normalizedPhone.length < 6) && !normalizedEmail) {
      setPets([]);
      setSelectedPetId("");
      setPetMode("new");
      setExistingCustomerFound(false);
      setLoadingPets(false);
      return;
    }

    const timeout = setTimeout(async () => {
      try {
        setLoadingPets(true);

        const query = new URLSearchParams();

        if (normalizedPhone && normalizedPhone.length >= 6) {
          query.set("phone", normalizedPhone);
        }

        if (normalizedEmail) {
          query.set("email", normalizedEmail);
        }

        const res = await fetch(`${BACKEND_URL}/pets/${slug}?${query.toString()}`, {
          cache: "no-store",
        });

        const data = await res.json();

        const nextPets: PetItem[] = Array.isArray(data?.pets) ? data.pets : [];
        const customerFound = Boolean(data?.customer_found);

        setPets(nextPets);
        setExistingCustomerFound(customerFound);

        if (nextPets.length > 0) {
          setPetMode((prev) => (prev === "existing" ? prev : "existing"));

          setSelectedPetId((prevSelected) => {
            const stillExists = nextPets.some((pet) => pet.id === prevSelected);

            if (stillExists) {
              const selectedPet =
                nextPets.find((pet) => pet.id === prevSelected) || null;
              applyPetToForm(selectedPet);
              return prevSelected;
            }

            const firstPet = nextPets[0];
            if (firstPet?.id) {
              applyPetToForm(firstPet);
              return firstPet.id;
            }

            return "";
          });
        } else {
          setSelectedPetId("");
          setPetMode("new");

          setCustomerData((prev) => ({
            ...prev,
            pet_name: "",
            pet_species: "",
          }));
        }
      } catch (error) {
        console.error("Error cargando mascotas:", error);
        setPets([]);
        setSelectedPetId("");
        setPetMode("new");
        setExistingCustomerFound(false);
      } finally {
        setLoadingPets(false);
      }
    }, 400);

    return () => clearTimeout(timeout);
  }, [customerData.phone, customerData.email, slug]);

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
            const rawSlots: SlotItem[] = Array.isArray(data.slots)
              ? data.slots
              : [];

            return {
              date,
              slots: dedupeSlots(rawSlots),
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
        staff_id: selectedStaffId || selectedSlot?.staff_id || null,
        date: formatDate(new Date(selectedSlot.slot_start)),
        slot_start: selectedSlot.slot_start,
        customer_name: customerData.name.trim(),
        customer_phone: customerData.phone.trim(),
        customer_email: customerData.email.trim(),
                customer_data: {
          ...visibleBookingFields.reduce<Record<string, string>>((acc, field) => {
            const value = String(customerData[field.key] || "").trim();
            if (value) acc[field.key] = value;
            return acc;
          }, {}),
          pet_id: petMode === "existing" ? selectedPetId || "" : "",
          pet_name: String(customerData.pet_name || "").trim(),
          pet_species: String(customerData.pet_species || "").trim(),
        },
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

      const resolvedStaffId = selectedStaffId || selectedSlot.staff_id || "";
      const selectedStaff =
        staffOptions.find((staff) => staff.id === resolvedStaffId) || null;

      const startDate = new Date(selectedSlot.slot_start);
      const durationMinutes = Number(selectedService.duration_minutes || 0);
      const endDate = new Date(
        startDate.getTime() + durationMinutes * 60 * 1000
      );

      setBookingSuccess({
        serviceName: selectedService.name,
        date: formatFullDate(selectedSlot.slot_start),
        time: formatHour(selectedSlot.slot_start),
        branchName: selectedBranch?.name || undefined,
        branchAddress: selectedBranch?.address || business?.address || undefined,
        staffName: selectedStaff?.name || undefined,
        customerEmail: customerData.email.trim(),
        customerPhone: customerData.phone.trim(),
        startIso: startDate.toISOString(),
        endIso: endDate.toISOString(),
      });

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
        pet_name: "",
        pet_species: "",
        ...clearedExtraFields,
      });

      setSelectedPetId("");
      setPets([]);
      setPetMode("new");
      setExistingCustomerFound(false);

      setSelectedPetId("");
      setPets([]);
    } catch (error: any) {
      setSubmitError(error?.message || "No se pudo crear la reserva.");
    } finally {
      setSubmitting(false);
    }
  }

  if (bookingSuccess) {
    const whatsappNumber = normalizeWhatsappNumber(
      business?.whatsapp || visiblePhone || bookingSuccess.customerPhone
    );

    const mapsUrl = buildMapsUrl(bookingSuccess.branchAddress);

    const googleCalendarUrl = buildGoogleCalendarUrl({
      title: `${bookingSuccess.serviceName} - ${business?.name || "Reserva"}`,
      startIso: bookingSuccess.startIso,
      endIso: bookingSuccess.endIso,
      details: [
        business?.name ? `Reserva en ${business.name}` : "",
        bookingSuccess.staffName ? `Profesional: ${bookingSuccess.staffName}` : "",
        bookingSuccess.branchName ? `Sucursal: ${bookingSuccess.branchName}` : "",
      ]
        .filter(Boolean)
        .join("\n"),
      location: bookingSuccess.branchAddress,
    });

    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-sky-50 px-4 py-10 md:px-8">
        <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-5xl items-center justify-center">
          <div className="w-full overflow-hidden rounded-[34px] border border-emerald-200 bg-white shadow-[0_35px_90px_-45px_rgba(16,185,129,0.42)]">
            <div className="h-2 bg-gradient-to-r from-emerald-500 via-sky-500 to-indigo-500" />

            <div className="p-6 md:p-10">
              <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-emerald-100 to-sky-100 text-5xl shadow-sm ring-8 ring-emerald-50">
                ✅
              </div>

              <div className="mt-6 text-center">
                <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-emerald-600">
                  Reserva online
                </p>

                <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-950 md:text-5xl">
                  Reserva confirmada
                </h1>

                <p className="mx-auto mt-4 max-w-2xl text-sm leading-6 text-slate-600 md:text-base">
                  Tu hora quedó registrada correctamente. Te enviamos la
                  confirmación a tu correo para que tengas todos los detalles a
                  mano.
                </p>
              </div>

              <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <SummaryChip label="Servicio" value={bookingSuccess.serviceName} />
                <SummaryChip
                  label="Fecha y hora"
                  value={`${bookingSuccess.time} · ${bookingSuccess.date}`}
                />
                {bookingSuccess.branchName ? (
                  <SummaryChip label="Sucursal" value={bookingSuccess.branchName} />
                ) : null}
                {bookingSuccess.staffName ? (
                  <SummaryChip label="Profesional" value={bookingSuccess.staffName} />
                ) : null}
              </div>

              <div className="mt-4 grid gap-4 lg:grid-cols-[1.4fr_0.9fr]">
                <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                    Dirección de la sucursal
                  </p>
                  <p className="mt-2 text-base font-semibold text-slate-900">
                    {bookingSuccess.branchAddress || "Dirección no disponible"}
                  </p>

                  {mapsUrl ? (
                    <a
                      href={mapsUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-4 inline-flex h-11 items-center justify-center rounded-2xl border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                    >
                      Ver ruta
                    </a>
                  ) : null}
                </div>

                <div className="rounded-3xl border border-sky-100 bg-sky-50/80 p-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-700">
                    Confirmación enviada
                  </p>
                  <p className="mt-2 text-sm text-slate-700">
                    Enviamos el detalle de tu reserva a:
                  </p>
                  <p className="mt-2 break-all text-base font-semibold text-slate-950">
                    {bookingSuccess.customerEmail || "Correo no disponible"}
                  </p>
                  <p className="mt-3 text-sm text-sky-900">
                    Revisa tu bandeja de entrada y también spam/promociones si
                    no lo ves de inmediato.
                  </p>
                </div>
              </div>

              <div className="mt-8 rounded-3xl border border-emerald-100 bg-gradient-to-r from-emerald-50 to-sky-50 p-5">
                <div className="grid gap-3 md:grid-cols-2">
                  <div className="rounded-2xl border border-white/80 bg-white/80 px-4 py-3 text-sm text-slate-700">
                    Puedes volver a reservar otra hora cuando quieras.
                  </div>
                  <div className="rounded-2xl border border-white/80 bg-white/80 px-4 py-3 text-sm text-slate-700">
                    También puedes guardar esta reserva en tu calendario.
                  </div>
                </div>
              </div>

              <div className="mt-8 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                <button
                  type="button"
                  onClick={() => {
                    setBookingSuccess(null);
                    setSelectedSlot(null);
                    setSubmitError("");
                  }}
                  className="inline-flex h-12 items-center justify-center rounded-2xl bg-gradient-to-r from-slate-950 via-indigo-950 to-slate-900 px-5 text-sm font-semibold text-white transition hover:opacity-95"
                >
                  Agendar otra hora
                </button>

                <a
                  href={googleCalendarUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex h-12 items-center justify-center rounded-2xl border border-slate-300 bg-white px-5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  Agregar a Google Calendar
                </a>

                {whatsappNumber ? (
                  <a
                    href={`https://wa.me/${whatsappNumber}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex h-12 items-center justify-center rounded-2xl border border-slate-300 bg-white px-5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                  >
                    Ir a WhatsApp
                  </a>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setBookingSuccess(null);
                      setSelectedSlot(null);
                      setSubmitError("");
                    }}
                    className="inline-flex h-12 items-center justify-center rounded-2xl border border-slate-300 bg-white px-5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                  >
                    Volver a la agenda
                  </button>
                )}

                {mapsUrl ? (
                  <a
                    href={mapsUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex h-12 items-center justify-center rounded-2xl border border-slate-300 bg-white px-5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                  >
                    Abrir ubicación
                  </a>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setBookingSuccess(null);
                      setSelectedSlot(null);
                      setSubmitError("");
                    }}
                    className="inline-flex h-12 items-center justify-center rounded-2xl border border-slate-300 bg-white px-5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                  >
                    Volver
                  </button>
                )}
              </div>

              {business?.name ? (
                <p className="mt-6 text-center text-sm text-slate-500">
                  Gracias por reservar en {business.name}.
                </p>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    );
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
                  {visiblePhone ? (
                    <span className="rounded-full border border-sky-100 bg-sky-50 px-3 py-1.5 text-sky-700">
                      {visiblePhone}
                    </span>
                  ) : null}

                  {visibleAddress ? (
                    <span className="rounded-full border border-slate-200 bg-slate-100 px-3 py-1.5 text-slate-700">
                      {visibleAddress}
                    </span>
                  ) : null}
                </div>
              </div>
            </div>

            <div className="rounded-[30px] border border-slate-200 bg-white p-5 shadow-[0_20px_60px_-35px_rgba(15,23,42,0.35)]">
              <div className="space-y-4">
                {showBranchSelector ? (
                  <div>
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

                <div>
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
                  <div>
                    <div className="mb-3">
                      <p className="text-sm font-semibold text-slate-900">
                        Profesional
                      </p>
                      <p className="text-xs text-slate-500">
                        Selecciona uno o deja cualquiera disponible.
                      </p>
                    </div>

                    {loadingStaff ? (
                      <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500">
                        Cargando profesionales...
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedStaffId("");
                            setSelectedSlot(null);
                          }}
                          className={`w-full rounded-2xl border p-4 text-left transition ${
                            selectedStaffId === ""
                              ? "border-indigo-500 bg-indigo-50 shadow-sm"
                              : "border-slate-200 bg-white hover:border-slate-300"
                          }`}
                        >
                          <div className="flex items-center gap-4">
                            <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-slate-200 bg-slate-100 text-lg font-semibold text-slate-700">
                              *
                            </div>

                            <div className="min-w-0">
                              <p className="text-sm font-semibold text-slate-900">
                                Cualquiera disponible
                              </p>
                              <p className="mt-1 text-xs text-slate-500">
                                Orbyx asignará un profesional con horario disponible
                              </p>
                            </div>
                          </div>
                        </button>

                        {staffOptions.map((staff) => (
                          <button
                            key={staff.id}
                            type="button"
                            onClick={() => {
                              setSelectedStaffId(staff.id);
                              setSelectedSlot(null);
                            }}
                            className={`w-full rounded-2xl border p-4 text-left transition ${
                              selectedStaffId === staff.id
                                ? "border-indigo-500 bg-indigo-50 shadow-sm"
                                : "border-slate-200 bg-white hover:border-slate-300"
                            }`}
                          >
                            <div className="flex items-center gap-4">
                              {staff.photo_url ? (
                                <img
                                  src={staff.photo_url}
                                  alt={staff.name}
                                  className="h-16 w-16 rounded-2xl object-cover border border-slate-200 bg-slate-100"
                                />
                              ) : (
                                <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-slate-200 bg-slate-100 text-lg font-semibold text-slate-700">
                                  {getStaffInitial(staff.name)}
                                </div>
                              )}

                              <div className="min-w-0">
                                <p className="truncate text-sm font-semibold text-slate-900">
                                  {staff.name}
                                </p>

                                <p className="mt-1 text-xs text-slate-500">
                                  Especialidad / Cargo
                                </p>

                                <p className="mt-1 truncate text-sm text-slate-700">
                                  {staff.role?.trim() || "Profesional"}
                                </p>
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
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
                    onChange={(e) => updateCustomerField("phone", e.target.value)}
                    className="h-12 w-full rounded-2xl border border-slate-300 bg-white px-4 text-sm outline-none transition focus:border-emerald-400"
                  />

                  <input
                    placeholder="Email"
                    type="email"
                    value={customerData.email || ""}
                    onChange={(e) => updateCustomerField("email", e.target.value)}
                    className="h-12 w-full rounded-2xl border border-slate-300 bg-white px-4 text-sm outline-none transition focus:border-emerald-400"
                  />

                  
                  {isVeterinaria && (
                    <>
                      <div className="rounded-2xl border border-emerald-100 bg-emerald-50/70 p-4">
                        <p className="text-sm font-semibold text-emerald-900">
                          Datos de la mascota
                        </p>

                        {loadingPets ? (
                          <p className="mt-2 text-xs text-emerald-700">
                            Buscando mascotas registradas...
                          </p>
                        ) : existingCustomerFound ? (
                          <p className="mt-2 text-xs text-emerald-700">
                            Detectamos un cliente existente con este email o teléfono.
                          </p>
                        ) : (
                          <p className="mt-2 text-xs text-slate-500">
                            Ingresa los datos de la mascota para continuar.
                          </p>
                        )}

                        {pets.length > 0 ? (
                          <div className="mt-4 space-y-3">
                            <div className="grid gap-2 sm:grid-cols-2">
                              <button
                                type="button"
                                onClick={() => {
                                  setPetMode("existing");

                                  const selected =
                                    pets.find((pet) => pet.id === selectedPetId) ||
                                    pets[0] ||
                                    null;

                                  if (selected?.id) {
                                    setSelectedPetId(selected.id);
                                    applyPetToForm(selected);
                                  }
                                }}
                                className={`h-11 rounded-2xl border px-4 text-sm font-medium transition ${
                                  petMode === "existing"
                                    ? "border-emerald-600 bg-emerald-600 text-white"
                                    : "border-slate-300 bg-white text-slate-700 hover:border-emerald-300"
                                }`}
                              >
                                Usar mascota existente
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  setPetMode("new");
                                  setSelectedPetId("");
                                  updateCustomerField("pet_name", "");
                                  updateCustomerField("pet_species", "");
                                }}
                                className={`h-11 rounded-2xl border px-4 text-sm font-medium transition ${
                                  petMode === "new"
                                    ? "border-slate-900 bg-slate-900 text-white"
                                    : "border-slate-300 bg-white text-slate-700 hover:border-slate-400"
                                }`}
                              >
                                Crear mascota nueva
                              </button>
                            </div>

                            {petMode === "existing" ? (
                              <select
                                value={selectedPetId}
                                onChange={(e) => {
                                  const petId = e.target.value;
                                  setSelectedPetId(petId);

                                  const pet =
                                    pets.find((item) => item.id === petId) || null;

                                  applyPetToForm(pet);
                                }}
                                className="h-12 w-full rounded-2xl border border-slate-300 bg-white px-4 text-sm outline-none transition focus:border-emerald-400"
                              >
                                <option value="">Seleccionar mascota</option>

                                {pets.map((pet) => {
                                  const species =
                                    String(pet.species_custom || "").trim() ||
                                    String(pet.species_base || "").trim();

                                  return (
                                    <option key={pet.id} value={pet.id}>
                                      🐶 {pet.name} · {species}
                                    </option>
                                  );
                                })}
                              </select>
                            ) : null}
                          </div>
                        ) : null}
                      </div>

                      <input
                        placeholder="Nombre de la mascota"
                        value={customerData.pet_name || ""}
                        onChange={(e) =>
                          updateCustomerField("pet_name", e.target.value)
                        }
                        disabled={petMode === "existing" && pets.length > 0}
                        className="h-12 w-full rounded-2xl border border-slate-300 bg-white px-4 text-sm outline-none transition disabled:bg-slate-100 disabled:text-slate-500 focus:border-emerald-400"
                      />

                      <input
                        placeholder="Especie (perro, gato, etc)"
                        value={customerData.pet_species || ""}
                        onChange={(e) =>
                          updateCustomerField("pet_species", e.target.value)
                        }
                        disabled={petMode === "existing" && pets.length > 0}
                        className="h-12 w-full rounded-2xl border border-slate-300 bg-white px-4 text-sm outline-none transition disabled:bg-slate-100 disabled:text-slate-500 focus:border-emerald-400"
                      />
                    </>
                  )}

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