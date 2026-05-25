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
  is_group?: boolean | null;
  capacity?: number | null;
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
  is_group?: boolean | null;
  capacity?: number | null;
  booked_count?: number | null;
  available_spots?: number | null;
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

type SubtypeBookingField = {
  key: string;
  label: string;
  enabled: boolean;
  required: boolean;
  type?: "text" | "textarea" | "select";
  options?: string[];
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
  business_subtype?: string | null;
  business_subtype_config?: Record<string, unknown> | null;
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

const subtypeFieldKeys = new Set([
  "unit_type",
  "brand",
  "model",
  "year",
  "unit_identifier",
  "usage_value",
  "visit_reason",
  "observations",
]);


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

function getBusinessInitials(name?: string | null) {
  const parts = String(name || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (parts.length === 0) return "O";

  return parts
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}

function getGroupSlotLabel(slot: SlotItem) {
  const capacity = slot.capacity || 0;
  const availableSpots = slot.available_spots || 0;

  if (availableSpots <= 0) return "Completo";
  if (capacity > 1 && availableSpots === 1) return "Último cupo";
  if (capacity <= 1) return "Disponible";
  return `${availableSpots} cupos disponibles`;
}

function getGroupSlotTone(slot: SlotItem) {
  const capacity = slot.capacity || 0;
  const availableSpots = slot.available_spots || 0;

  if (availableSpots <= 0) return "bg-slate-200 text-slate-500";
  if (capacity > 1 && availableSpots === 1) return "bg-rose-100 text-rose-600";
  if (capacity > 1 && availableSpots <= 3) return "bg-amber-100 text-amber-600";
  return "bg-emerald-100 text-emerald-600";
}

function StaffPhotoPreview({
  staff,
  align = "left",
}: {
  staff: StaffItem;
  align?: "left" | "right";
}) {
  return (
    <div className="relative group">
      <div className="h-12 w-12 overflow-hidden rounded-2xl border border-slate-200 bg-slate-100 md:h-14 md:w-14">
        {staff.photo_url ? (
          <img
            src={staff.photo_url}
            alt={staff.name}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-lg font-semibold text-slate-700">
            {getStaffInitial(staff.name)}
          </div>
        )}
      </div>

      <div
        className={`pointer-events-none z-[80] hidden -translate-y-1/2 opacity-0 transition-all duration-200 group-hover:opacity-100 xl:block ${
          align === "right"
            ? "fixed right-[470px] top-1/2"
            : "absolute left-full top-1/2 ml-5"
        }`}
      >
        <div className="w-[320px] overflow-hidden rounded-[26px] border border-slate-200 bg-white shadow-[0_28px_80px_-35px_rgba(15,23,42,0.45)]">
          <div className="h-[220px] bg-slate-100">
            {staff.photo_url ? (
              <img
                src={staff.photo_url}
                alt={staff.name}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-4xl font-semibold text-slate-300">
                {getStaffInitial(staff.name)}
              </div>
            )}
          </div>

          <div className="p-5">
            <p className="text-lg font-bold text-slate-950">{staff.name}</p>
            <p className="mt-1 text-sm font-semibold text-indigo-600">
              {staff.role?.trim() || "Profesional"}
            </p>
            <p className="mt-3 text-sm leading-6 text-slate-500">
              {staff.role?.trim()
                ? `Especialista en ${staff.role.trim().toLowerCase()}.`
                : "Profesional disponible para esta reserva."}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
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
const isGroupBookingBusiness =
  business?.business_category === "fitness" ||
  business?.business_category === "clases" ||
  business?.business_category === "talleres" ||
  business?.business_category === "eventos" ||
  business?.business_category === "group_booking";

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
  const [mobileSelectedDateKey, setMobileSelectedDateKey] = useState(
    formatDate(new Date())
  );
  const [showDatePopover, setShowDatePopover] = useState(false);
  const [showStaffDrawer, setShowStaffDrawer] = useState(false);
  const [staffSearchQuery, setStaffSearchQuery] = useState("");
  const [weekSlots, setWeekSlots] = useState<Record<string, SlotItem[]>>({});
const [nextAvailableSlots, setNextAvailableSlots] = useState<SlotItem[]>([]);
const [loadingNextSlots, setLoadingNextSlots] = useState(false);
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
  const serviceSectionRef = useRef<HTMLDivElement | null>(null);

  const weekDates = useMemo(() => getWeekDates(selectedDate), [selectedDate]);
const noSlotsThisWeek = useMemo(() => {
  return weekDates.every((dateObj) => {
    const key = formatDate(dateObj);
    return (weekSlots[key] || []).length === 0;
  });
}, [weekSlots, weekDates]);

const nextAvailableDays = useMemo(() => {
  const grouped = new Map<string, SlotItem[]>();

  for (const slot of nextAvailableSlots) {
    const key = formatDate(new Date(slot.slot_start));

    if (!grouped.has(key)) {
      grouped.set(key, []);
    }

    grouped.get(key)?.push(slot);
  }

  return Array.from(grouped.entries())
    .slice(0, 2)
    .map(([date, slots]) => ({
      date,
      slots,
    }));
}, [nextAvailableSlots]);

  const showBranchSelector = branches.length > 1;
  const visibleBookingFields = bookingFields.filter((field) => field.enabled);
  const visibleSubtypeBookingFields = useMemo(() => {
    if (
      business?.business_category !== "generic" ||
      business?.business_subtype !== "taller_automotriz"
    ) {
      return [];
    }

    const config = business.business_subtype_config as
      | { booking_fields?: unknown }
      | null
      | undefined;
    const fields = Array.isArray(config?.booking_fields)
      ? config.booking_fields
      : [];

    return fields
      .filter((field): field is SubtypeBookingField => {
        if (!field || typeof field !== "object") return false;

        const item = field as Partial<SubtypeBookingField>;
        return (
          typeof item.key === "string" &&
          subtypeFieldKeys.has(item.key) &&
          item.enabled === true
        );
      })
      .map((field) => ({
        key: field.key,
        label: String(field.label || field.key).trim(),
        enabled: true,
        required: field.required === true,
        type:
          field.type === "textarea" || field.type === "select"
            ? field.type
            : "text",
        options: Array.isArray(field.options)
          ? field.options
              .map((option) => String(option || "").trim())
              .filter(Boolean)
          : [],
      }));
  }, [business]);

  const selectedBranch =
    branches.find((branch) => branch.id === selectedBranchId) || null;

  const visibleAddress = selectedBranch?.address || business?.address || null;
  const visiblePhone = selectedBranch?.phone || business?.phone || null;
  const weekStartDate = weekDates[0];
  const weekEndDate = weekDates[weekDates.length - 1];
  const todayKey = formatDate(new Date());
  const mobileSelectedDate =
    weekDates.find((dateObj) => formatDate(dateObj) === mobileSelectedDateKey) ||
    weekDates[0];
  const mobileSelectedDateSlots = mobileSelectedDate
    ? weekSlots[formatDate(mobileSelectedDate)] || []
    : [];
  const selectedStaff =
    staffOptions.find((staff) => staff.id === selectedStaffId) || null;
  const compactStaffBase = staffOptions.slice(0, 3);
  const visibleStaffOptions =
    selectedStaff && !compactStaffBase.some((staff) => staff.id === selectedStaff.id)
      ? compactStaffBase.length >= 3
        ? [...compactStaffBase.slice(0, 2), selectedStaff]
        : [...compactStaffBase, selectedStaff]
      : compactStaffBase;
  const filteredDrawerStaff = staffOptions.filter((staff) => {
    const term = staffSearchQuery.trim().toLowerCase();
    if (!term) return true;

    return `${staff.name} ${staff.role || ""}`.toLowerCase().includes(term);
  });
  const weekRangeLabel =
    weekStartDate && weekEndDate
      ? weekStartDate.getMonth() === weekEndDate.getMonth() &&
        weekStartDate.getFullYear() === weekEndDate.getFullYear()
        ? `${weekStartDate.getDate()} – ${weekEndDate.getDate()} ${weekEndDate.toLocaleDateString(
            "es-CL",
            { month: "long" }
          )} ${weekEndDate.getFullYear()}`
        : `${weekStartDate.getDate()} ${weekStartDate.toLocaleDateString(
            "es-CL",
            { month: "short" }
          )} – ${weekEndDate.getDate()} ${weekEndDate.toLocaleDateString(
            "es-CL",
            { month: "short" }
          )} ${weekEndDate.getFullYear()}`
      : "";

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

  function moveSelectedWeek(days: number) {
    const nextDate = new Date(selectedDate);
    nextDate.setDate(nextDate.getDate() + days);
    setSelectedDate(nextDate);
    setMobileSelectedDateKey(formatDate(nextDate));
    setSelectedSlot(null);
    setShowDatePopover(false);
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

    for (const field of visibleSubtypeBookingFields) {
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



async function loadNextAvailableSlots() {
  try {
setLoadingNextSlots(true);
    if (!slug || !selectedService?.id) {
      setNextAvailableSlots([]);
      return;
    }

    const today = new Date();
    const results: SlotItem[] = [];
    let daysWithSlots = 0;

    for (let i = 0; i < 45; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);

      const query = new URLSearchParams();
      query.set("date", formatDate(date));

      if (selectedBranchId) query.set("branch_id", selectedBranchId);
      if (selectedStaffId) query.set("staff_id", selectedStaffId);

      const res = await fetch(
        `/api/public-slots/${slug}/${selectedService.id}?${query.toString()}`,
        { cache: "no-store" }
      );

      const data = await res.json();
      const slots: SlotItem[] = Array.isArray(data.slots)
        ? dedupeSlots(data.slots)
        : [];

      if (slots.length > 0) {
        results.push(...slots.slice(0, 4));
        daysWithSlots++;

        if (daysWithSlots >= 2) break;
      }
    }

    setNextAvailableSlots(results);
  } catch (err) {
    console.error("Error buscando próximos slots", err);
    setNextAvailableSlots([]);
  }
finally {
  setLoadingNextSlots(false);
}
}

    loadWeekSlots();
    loadNextAvailableSlots();
  }, [
    slug,
    selectedService?.id,
    selectedDate,
    selectedBranchId,
    selectedStaffId,
    weekDates,
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


const detectedCustomerId =
  existingCustomerFound && selectedPetId
    ? pets.find((p) => p.id === selectedPetId)?.customer_id || null
    : null;
const subtypeFieldsPayload = visibleSubtypeBookingFields.reduce<
  Record<string, string>
>((acc, field) => {
  const value = String(customerData[field.key] || "").trim();
  if (value) acc[field.key] = value;
  return acc;
}, {});

      const payload = {
        calendar_id: calendarId,
        branch_id: selectedBranchId || null,
        service_id: selectedService.id,
        staff_id: selectedStaffId || selectedSlot?.staff_id || null,
        date: formatDate(new Date(selectedSlot.slot_start)),
        slot_start: selectedSlot.slot_start,
	customer_id: detectedCustomerId,
        customer_name: customerData.name.trim(),
        customer_phone: customerData.phone.trim(),
        customer_email: customerData.email.trim(),
                customer_data: {
  ...visibleBookingFields.reduce<Record<string, string>>((acc, field) => {
    const value = String(customerData[field.key] || "").trim();
    if (value) acc[field.key] = value;
    return acc;
  }, {}),
  ...(visibleSubtypeBookingFields.length > 0
    ? { subtype_fields: subtypeFieldsPayload }
    : {}),
  pet_id:
    petMode === "existing" && selectedPetId
      ? selectedPetId
      : null,
  pet_name:
    petMode === "new"
      ? String(customerData.pet_name || "").trim()
      : null,
  pet_species:
    petMode === "new"
      ? String(customerData.pet_species || "").trim()
      : null,
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
      const clearedSubtypeFields = visibleSubtypeBookingFields.reduce<
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
        ...clearedSubtypeFields,
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
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-sky-50 px-3 py-4 sm:px-4 md:px-8 md:py-10">
        <div className="mx-auto flex min-h-[calc(100vh-2rem)] max-w-5xl items-center justify-center md:min-h-[calc(100vh-5rem)]">
          <div className="w-full overflow-hidden rounded-2xl border border-emerald-200 bg-white shadow-[0_35px_90px_-45px_rgba(16,185,129,0.42)] md:rounded-[34px]">
            <div className="h-2 bg-gradient-to-r from-emerald-500 via-sky-500 to-indigo-500" />

            <div className="p-4 md:p-10">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-emerald-100 to-sky-100 text-3xl shadow-sm ring-8 ring-emerald-50 md:h-24 md:w-24 md:text-5xl">
                ✅
              </div>

              <div className="mt-6 text-center">
                <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-emerald-600">
                  Reserva online
                </p>

                <h1 className="mt-3 text-2xl font-bold tracking-tight text-slate-950 md:text-5xl">
                  Reserva confirmada
                </h1>

                <p className="mx-auto mt-4 max-w-2xl text-sm leading-6 text-slate-600 md:text-base">
                  Tu hora quedó registrada correctamente. Te enviamos la
                  confirmación a tu correo para que tengas todos los detalles a
                  mano.
                </p>
              </div>

              <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4 md:mt-8 md:gap-4">
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

              <div className="mt-4 grid gap-3 lg:grid-cols-[1.4fr_0.9fr] md:gap-4">
                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:rounded-3xl md:p-5">
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

                <div className="rounded-2xl border border-sky-100 bg-sky-50/80 p-4 md:rounded-3xl md:p-5">
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

              <div className="mt-6 rounded-2xl border border-emerald-100 bg-gradient-to-r from-emerald-50 to-sky-50 p-4 md:mt-8 md:rounded-3xl md:p-5">
                <div className="grid gap-3 md:grid-cols-2">
                  <div className="rounded-2xl border border-white/80 bg-white/80 px-4 py-3 text-sm text-slate-700">
                    Puedes volver a reservar otra hora cuando quieras.
                  </div>
                  <div className="rounded-2xl border border-white/80 bg-white/80 px-4 py-3 text-sm text-slate-700">
                    También puedes guardar esta reserva en tu calendario.
                  </div>
                </div>
              </div>

              <div className="mt-6 grid gap-3 md:mt-8 md:grid-cols-2 xl:grid-cols-4">
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
      <div className="mx-auto w-full max-w-[1600px] px-3 py-2 sm:px-4 md:px-6 md:py-6 xl:px-8">
        <div className="grid gap-3 md:gap-4 xl:grid-cols-[360px_1fr] xl:gap-6">
          <div className="space-y-3 md:space-y-4 xl:space-y-6">
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_16px_45px_-34px_rgba(15,23,42,0.45)] md:rounded-[30px] md:shadow-[0_20px_60px_-35px_rgba(15,23,42,0.35)]">
              <div className="p-3.5 md:p-5">
                <div className="flex items-center gap-3 md:gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-slate-950 text-base font-bold text-white shadow-[0_16px_32px_-24px_rgba(15,23,42,0.8)] md:h-16 md:w-16 md:rounded-2xl md:text-lg">
                    {getBusinessInitials(business?.name || slug)}
                  </div>

                  <div className="min-w-0">
                    <h1 className="truncate text-lg font-bold tracking-tight text-slate-950 md:text-2xl">
                      {business?.name || slug || "Reserva"}
                    </h1>
                    <span className="mt-1.5 inline-flex w-fit items-center gap-1.5 rounded-full border border-emerald-100 bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700 md:mt-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                      Reserva online
                    </span>
                  </div>
                </div>

                 <div className="mt-3 grid gap-2 text-xs text-slate-600 md:mt-4 md:text-sm">
                  {visibleAddress ? (
                    <span className="inline-flex max-w-full items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-slate-700 md:rounded-2xl">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        className="h-4 w-4 text-slate-500"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M12 21s7-4.35 7-11a7 7 0 10-14 0c0 6.65 7 11 7 11z"
                        />
                        <circle cx="12" cy="10" r="2.5" />
                      </svg>
                      <span className="min-w-0 truncate">{visibleAddress}</span>
                    </span>
                  ) : null}
                  {visiblePhone ? (
                    <span className="inline-flex max-w-full items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-slate-700 md:rounded-2xl">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        className="h-4 w-4 text-slate-500"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M22 16.92v3a2 2 0 01-2.18 2 19.8 19.8 0 01-8.63-3.07 19.5 19.5 0 01-6-6A19.8 19.8 0 012.12 4.2 2 2 0 014.11 2h3a2 2 0 012 1.72c.12.9.32 1.77.59 2.61a2 2 0 01-.45 2.11L8 9.69a16 16 0 006.31 6.31l1.25-1.25a2 2 0 012.11-.45c.84.27 1.71.47 2.61.59A2 2 0 0122 16.92z"
                        />
                      </svg>
                      <span className="min-w-0 truncate">{visiblePhone}</span>
                    </span>
                  ) : null}
                </div>
              </div>
            </div>

            <div className="flex flex-col rounded-2xl border border-slate-200 bg-white p-3 shadow-[0_16px_45px_-34px_rgba(15,23,42,0.45)] md:rounded-[26px] md:p-4 md:shadow-[0_20px_60px_-35px_rgba(15,23,42,0.35)] xl:min-h-[860px]">
              <div className="space-y-2.5 md:space-y-4">
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
                    className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-800 outline-none transition focus:border-indigo-400 md:h-12 md:rounded-2xl md:px-4"
                    >
                      {branches.map((branch) => (
                        <option key={branch.id} value={branch.id}>
                          {branch.name}
                        </option>
                      ))}
                    </select>
                  </div>
                ) : null}

                                <div
                  ref={serviceSectionRef}
                  className="relative"
                >
{!selectedService ? (
  <div className="pointer-events-none absolute -top-3 left-14 z-20 hidden animate-bounce flex-col items-start sm:flex">
    <div className="animate-pulse rounded-full bg-gradient-to-r from-amber-500 via-orange-500 to-yellow-400 px-4 py-1.5 text-xs font-semibold text-white shadow-[0_10px_30px_-12px_rgba(245,158,11,0.9)]">
      Selecciona un servicio aquí
    </div>
    <div className="ml-8 h-0 w-0 border-l-[9px] border-r-[9px] border-t-[12px] border-l-transparent border-r-transparent border-t-amber-500" />
  </div>
) : null}

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
                    className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-800 outline-none transition disabled:bg-slate-100 focus:border-indigo-400 md:h-12 md:rounded-2xl md:px-4"
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
                  <div className="rounded-xl border border-indigo-100 bg-gradient-to-br from-indigo-50 to-sky-50 p-3 md:rounded-2xl md:p-4">
                    <p className="text-sm font-semibold text-slate-900">
                      {selectedService.name}
                    </p>

                    <div className="mt-2 flex flex-wrap gap-2 text-xs md:mt-3">
                      <span className="rounded-full border border-white/80 bg-white px-2.5 py-1 text-slate-700 shadow-sm">
                        {selectedService!.duration_minutes || 0} min
                      </span>
                      <span className="rounded-full border border-white/80 bg-white px-2.5 py-1 text-slate-700 shadow-sm">
                        {formatPrice(selectedService!.price)}
                      </span>
                    </div>
                  </div>
                ) : null}

                                {selectedService ? (
                  <div>
                    <div className="mb-2.5 md:mb-3">
                      <p className="text-sm font-semibold text-slate-900">
  Profesional preferente (opcional)
</p>
                      <p className="text-xs text-slate-500">
  Puedes elegir uno específico o dejar que asignemos cualquiera disponible.
</p>
                    </div>

                    {loadingStaff ? (
                      <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500">
                        Cargando profesionales...
                      </div>
                    ) : (
                      <div className="space-y-2 md:space-y-3">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedStaffId("");
                            setSelectedSlot(null);
                          }}
                          className={`w-full rounded-xl border p-2.5 text-left transition-all duration-200 cursor-pointer md:rounded-2xl md:p-4 ${
  selectedStaffId === ""
    ? "border-indigo-600 bg-indigo-50 shadow-md scale-[1.01]"
    : "border-slate-200 bg-white hover:border-indigo-400 hover:bg-indigo-50 hover:shadow-sm hover:scale-[1.01]"
}`}
                        >
                          <div className="flex items-center gap-3 md:gap-4">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-slate-100 text-base font-semibold text-slate-700 md:h-16 md:w-16 md:rounded-2xl md:text-lg">
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

                        {visibleStaffOptions.map((staff) => (
                          <button
                            key={staff.id}
                            type="button"
                            onClick={() => {
                              setSelectedStaffId(staff.id);
                              setSelectedSlot(null);
                            }}
                            className={`w-full rounded-xl border p-2.5 text-left transition md:rounded-2xl md:p-4 ${
                              selectedStaffId === staff.id
                                ? "border-indigo-500 bg-indigo-50 shadow-sm"
                                : "border-slate-200 bg-white hover:border-slate-300"
                            }`}
                          >
                            <div className="flex items-center gap-3 md:gap-4">



<div className="relative group">
  {/* FOTO BASE */}
  <div className="h-10 w-10 overflow-hidden rounded-xl border border-slate-200 bg-slate-100 md:h-16 md:w-16 md:rounded-2xl">
    {staff.photo_url ? (
      <img
        src={staff.photo_url}
        alt={staff.name}
        className="h-full w-full object-cover"
      />
    ) : (
      <div className="flex h-full w-full items-center justify-center text-lg font-semibold text-slate-700">
        {getStaffInitial(staff.name)}
      </div>
    )}
  </div>

  {/* HOVER GRANDE */}
  <div className="pointer-events-none absolute left-full top-1/2 z-30 ml-5 hidden -translate-y-1/2 opacity-0 transition-all duration-200 group-hover:opacity-100 xl:block">
    <div className="w-[320px] overflow-hidden rounded-[26px] border border-slate-200 bg-white shadow-[0_28px_80px_-35px_rgba(15,23,42,0.45)]">
      <div>
        <div className="h-[220px] w-full overflow-hidden bg-slate-200">
          {staff.photo_url ? (
            <img
              src={staff.photo_url}
              alt={staff.name}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-3xl text-slate-400">
              👤
            </div>
          )}
        </div>

        <div className="p-5">
          <p className="text-lg font-bold text-slate-950">{staff.name}</p>
          <p className="mt-1 text-sm font-semibold text-indigo-600">
            {staff.role?.trim() || "Profesional"}
          </p>
          <p className="mt-3 text-sm leading-6 text-slate-500">
            {staff.role?.trim()
              ? `Especialista en ${staff.role.trim().toLowerCase()}.`
              : "Profesional disponible para esta reserva."}
          </p>
        </div>
      </div>
    </div>
  </div>
</div>

                              <div className="min-w-0">
                                <p className="truncate text-sm font-semibold text-slate-900">
                                  {staff.name}
                                </p>

                                <p className="mt-1 hidden text-xs text-slate-500 sm:block">
                                  Especialidad / Cargo
                                </p>

                                <p className="mt-1 truncate text-sm text-slate-700">
                                  {staff.role?.trim() || "Profesional"}
                                </p>
                              </div>
                            </div>
                          </button>
                        ))}

                        {staffOptions.length > visibleStaffOptions.length ? (
                          <button
                            type="button"
                            onClick={() => {
                              setStaffSearchQuery("");
                              setShowStaffDrawer(true);
                            }}
                            className="flex h-11 w-full items-center justify-center rounded-xl border border-indigo-200 bg-white px-4 text-sm font-semibold text-indigo-700 transition hover:border-indigo-400 hover:bg-indigo-50 hover:shadow-sm md:h-12 md:rounded-2xl"
                          >
                            Ver todos los profesionales ({staffOptions.length})
                          </button>
                        ) : null}
                      </div>
                    )}
                  </div>
                ) : null}

              </div>
            </div>

          </div>

          <div className="flex flex-col rounded-2xl border border-slate-200 bg-white p-3 shadow-[0_16px_45px_-34px_rgba(15,23,42,0.45)] md:rounded-[26px] md:p-4 md:shadow-[0_20px_60px_-35px_rgba(15,23,42,0.35)] xl:min-h-[860px]">
            <div className="mb-3 flex flex-col gap-3 md:mb-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="relative flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => moveSelectedWeek(-7)}
                  className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 transition hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700 md:h-11 md:w-11 md:rounded-2xl"
                  aria-label="Semana anterior"
                >
                  ‹
                </button>

                <button
                  type="button"
                  onClick={() => setShowDatePopover((current) => !current)}
                  className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-xl border border-indigo-200 bg-white px-3 text-xs font-bold text-slate-950 shadow-sm transition hover:border-indigo-400 hover:bg-indigo-50 sm:flex-none md:h-11 md:rounded-2xl md:px-4 md:text-sm"
                >
                  <span>{weekRangeLabel}</span>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    className="h-4 w-4 text-indigo-600"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 012 2v13a2 2 0 01-2 2H5a2 2 0 01-2-2V6a2 2 0 012-2z"
                    />
                  </svg>
                </button>

                <button
                  type="button"
                  onClick={() => moveSelectedWeek(7)}
                  className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 transition hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700 md:h-11 md:w-11 md:rounded-2xl"
                  aria-label="Semana siguiente"
                >
                  ›
                </button>

                {showDatePopover ? (
                  <div className="absolute left-0 top-14 z-40 w-[310px] overflow-hidden rounded-[26px] border border-slate-200 bg-white p-3 shadow-[0_28px_90px_-38px_rgba(15,23,42,0.55)] [&_.react-calendar]:w-full [&_.react-calendar]:max-w-full [&_.react-calendar]:border-0">
                    <Calendar
                      minDate={new Date()}
                      onChange={(value: any) => {
                        const picked = Array.isArray(value) ? value[0] : value;
                        if (!picked) return;
                        const nextPickedDate = new Date(picked);
                        setSelectedDate(nextPickedDate);
                        setMobileSelectedDateKey(formatDate(nextPickedDate));
                        setSelectedSlot(null);
                        setShowDatePopover(false);
                      }}
                      value={selectedDate}
                    />
                  </div>
                ) : null}
              </div>

              {selectedService ? (
                <div className="w-fit max-w-full truncate rounded-full border border-indigo-100 bg-indigo-50 px-3 py-1.5 text-xs font-medium text-indigo-700">
                  {selectedService!.name}
                </div>
              ) : null}
            </div>

            {!selectedService ? (
              <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-4 shadow-sm">
                <div>
                  <p className="text-sm font-semibold text-amber-900">
                    Primero debes seleccionar un servicio
                  </p>
                  <p className="mt-1 text-sm text-amber-800">
                    Los horarios aparecerán aquí cuando elijas un servicio en el panel izquierdo.
                  </p>
                </div>
              </div>
            ) : null}
            <div className="hidden md:block">
            <div className="grid grid-cols-7 items-start gap-2">
              {weekDates.map((dateObj, index) => {
                const dateKey = formatDate(dateObj);
                const slots = weekSlots[dateKey] || [];
                const isToday = todayKey === dateKey;
                const isClosedDay =
                  Boolean(selectedService) && !loadingSlots && slots.length === 0;

                return (
                  <div
                    key={dateKey}
                    className={`rounded-2xl border p-3 transition ${
                      isToday
  ? "border-sky-500 bg-sky-100 shadow-md"
                        : isClosedDay
                        ? "border-rose-100 bg-[repeating-linear-gradient(135deg,rgba(254,226,226,0.9)_0px,rgba(254,226,226,0.9)_9px,rgba(255,241,242,0.75)_9px,rgba(255,241,242,0.75)_18px)]"
                        : "border-slate-200 bg-slate-50/60"
                    }`}
                  >
                    <div
                      className={`-mx-3 mb-3 border-b px-3 pb-2 pt-1 md:sticky md:top-0 md:z-30 ${
                        isClosedDay
                          ? "border-rose-100 bg-rose-50/95"
                          : "border-slate-200 bg-white"
                      }`}
                    >
                      <p
                        className={`text-sm font-bold ${
                          isClosedDay ? "text-rose-900" : "text-slate-900"
                        }`}
                      >
                        {getWeekdayLabel(dateObj)}
                        {isToday ? (
                          <span className="ml-2 rounded-full bg-indigo-600 px-2 py-0.5 text-[10px] font-semibold text-white">
                            Hoy
                          </span>
                        ) : null}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        {dateObj.toLocaleDateString("es-CL", {
  day: "numeric",
  month: "long",
})}
                      </p>
                    </div>











{loadingSlots ? (
  <p className="text-xs text-slate-500">Cargando...</p>
) : !selectedService ? (
  <p className="text-xs text-slate-500">
    Selecciona un servicio.
  </p>
) : slots.length === 0 ? (
  <div className="flex min-h-[360px] items-center justify-center rounded-2xl border border-rose-100 bg-white/35 px-3 text-center">
    <div>
      <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-rose-100 text-rose-500">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          className="h-5 w-5"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M7 11V8a5 5 0 0110 0v3M6 11h12v9H6z"
          />
        </svg>
      </div>
      <p className="text-sm font-bold text-rose-700">Sin horario disponible</p>
    </div>
  </div>
) : (
  <div className="space-y-1.5">
    {slots.map((slot, index) => (
      <button
        key={`${slot.slot_start}-${index}`}
        type="button"
	disabled={Boolean(slot.is_group) && (slot.available_spots || 0) === 0}
        onClick={() => {
          setSelectedSlot(slot);

          setTimeout(() => {
            formRef.current?.scrollIntoView({
              behavior: "smooth",
              block: "start",
            });
          }, 120);
        }}
className={`flex min-h-[40px] w-full flex-row items-center justify-between gap-2 rounded-xl border px-2.5 py-1.5 text-left transition md:min-h-[34px] md:flex-col md:justify-center md:px-2 md:py-1 md:text-center ${
  selectedSlot?.slot_start === slot.slot_start
    ? "border-indigo-700 bg-indigo-700 text-white shadow-sm"
    : slot.is_group && (slot.available_spots || 0) === 0
    ? "border-slate-200 bg-slate-100 text-slate-400 cursor-not-allowed"
    : "border-slate-200 bg-white text-slate-700 hover:border-sky-300 hover:bg-sky-50"
}`}
      >
        <span className="text-sm font-semibold leading-none md:text-[11px]">
          {formatHour(slot.slot_start)}
        </span>
        <span
  className={`text-[11px] leading-none md:mt-1 md:text-[9px] ${
    selectedSlot?.slot_start === slot.slot_start
      ? "text-indigo-100"
      : slot.is_group && isGroupBookingBusiness
      ? "text-emerald-600"
      : "text-slate-400"
  }`}
>
{slot.is_group && isGroupBookingBusiness ? (
  <span
    className={`px-1.5 py-[1px] rounded-full ${
      (slot.available_spots || 0) === 0
        ? "bg-slate-200 text-slate-500"
        : (slot.capacity || 0) > 1 && (slot.available_spots || 0) === 1
        ? "bg-rose-100 text-rose-600"
        : (slot.capacity || 0) > 1 && (slot.available_spots || 0) <= 3
        ? "bg-amber-100 text-amber-600"
        : "bg-emerald-100 text-emerald-600"
    }`}
  >
    {(slot.available_spots || 0) === 0
      ? "Completo"
      : (slot.capacity || 0) > 1 && (slot.available_spots || 0) === 1
      ? "Último cupo"
      : (slot.capacity || 0) <= 1
      ? "Disponible"
      : `${slot.available_spots} cupos disponibles`}
  </span>
) : (
  "Disponible"
)}
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

            <div className="md:hidden">
              <div className="-mx-1 mb-3 flex snap-x gap-2 overflow-x-auto px-1 pb-2">
                {weekDates.map((dateObj) => {
                  const dateKey = formatDate(dateObj);
                  const isActiveMobileDay = mobileSelectedDateKey === dateKey;
                  const isToday = todayKey === dateKey;
                  const daySlots = weekSlots[dateKey] || [];
                  const isClosedDay =
                    Boolean(selectedService) && !loadingSlots && daySlots.length === 0;

                  return (
                    <button
                      key={dateKey}
                      type="button"
                      onClick={() => {
                        setMobileSelectedDateKey(dateKey);
                        setSelectedDate(dateObj);
                        setSelectedSlot(null);
                      }}
                      className={`min-w-[68px] snap-start rounded-2xl border px-2.5 py-2 text-left transition ${
                        isActiveMobileDay
                          ? "border-indigo-600 bg-indigo-600 text-white shadow-[0_14px_28px_-20px_rgba(79,70,229,0.85)]"
                          : isClosedDay
                          ? "border-rose-100 bg-rose-50 text-rose-700"
                          : "border-slate-200 bg-white text-slate-700"
                      }`}
                    >
                      <p className="text-[11px] font-bold uppercase">
                        {dateObj.toLocaleDateString("es-CL", { weekday: "short" })}
                      </p>
                      <p className="mt-1 text-base font-bold leading-none">
                        {dateObj.getDate()}
                        {isToday ? (
                          <span
                            className={`ml-1 rounded-full px-1.5 py-0.5 text-[9px] ${
                              isActiveMobileDay
                                ? "bg-white/20 text-white"
                                : "bg-indigo-600 text-white"
                            }`}
                          >
                            Hoy
                          </span>
                        ) : null}
                      </p>
                      {selectedService ? (
                        <p
                          className={`mt-1 text-[10px] font-medium ${
                            isActiveMobileDay ? "text-indigo-100" : "text-slate-400"
                          }`}
                        >
                          {daySlots.length > 0
                            ? `${daySlots.length} horas`
                            : "Sin horas"}
                        </p>
                      ) : null}
                    </button>
                  );
                })}
              </div>

              <div className="rounded-[22px] border border-slate-200 bg-white p-3 shadow-sm">
                <div className="mb-3 flex items-start justify-between gap-3">
                  <div>
                  <p className="text-sm font-bold text-slate-950">
                    {mobileSelectedDate ? getWeekdayLabel(mobileSelectedDate) : "Día"}
                  </p>
                  {mobileSelectedDate ? (
                    <p className="mt-1 text-xs text-slate-500">
                      {mobileSelectedDate.toLocaleDateString("es-CL", {
                        day: "numeric",
                        month: "long",
                      })}
                    </p>
                  ) : null}
                  </div>
                  {selectedService && mobileSelectedDateSlots.length > 0 ? (
                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-600">
                      {mobileSelectedDateSlots.length} disponibles
                    </span>
                  ) : null}
                </div>

                {loadingSlots ? (
                  <div className="grid grid-cols-2 gap-2">
                    {[0, 1, 2, 3].map((item) => (
                      <div
                        key={item}
                        className="h-[54px] animate-pulse rounded-2xl border border-slate-100 bg-slate-100"
                      />
                    ))}
                  </div>
                ) : !selectedService ? (
                  <div className="rounded-2xl border border-amber-100 bg-amber-50 px-4 py-4 text-sm text-amber-800">
                    Selecciona un servicio para ver horarios disponibles.
                  </div>
                ) : mobileSelectedDateSlots.length === 0 ? (
                  <div className="rounded-2xl border border-rose-100 bg-rose-50 px-4 py-5 text-center">
                    <div className="mx-auto mb-2 h-1.5 w-10 rounded-full bg-rose-200" />
                    <p className="text-sm font-bold text-rose-700">
                      Sin horario disponible
                    </p>
                    <p className="mt-1 text-xs text-rose-600">
                      Prueba otro día o revisa los próximos horarios sugeridos.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    {mobileSelectedDateSlots.map((slot, index) => (
                      <button
                        key={`${slot.slot_start}-${index}`}
                        type="button"
                        disabled={
                          Boolean(slot.is_group) && (slot.available_spots || 0) === 0
                        }
                        onClick={() => {
                          setSelectedSlot(slot);

                          setTimeout(() => {
                            formRef.current?.scrollIntoView({
                              behavior: "smooth",
                              block: "start",
                            });
                          }, 120);
                        }}
                        className={`min-h-[54px] rounded-2xl border px-3 py-2.5 text-center transition ${
                          selectedSlot?.slot_start === slot.slot_start
                            ? "border-indigo-700 bg-indigo-700 text-white shadow-[0_16px_28px_-20px_rgba(79,70,229,0.9)]"
                            : slot.is_group && (slot.available_spots || 0) === 0
                            ? "cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400"
                            : "border-slate-200 bg-slate-50 text-slate-700 hover:border-sky-300 hover:bg-sky-50"
                        }`}
                      >
                        <span className="block text-base font-bold leading-none">
                          {formatHour(slot.slot_start)}
                        </span>
                        <span
                          className={`mt-1.5 block text-[10px] font-medium leading-tight ${
                            selectedSlot?.slot_start === slot.slot_start
                              ? "text-indigo-100"
                              : slot.is_group && isGroupBookingBusiness
                              ? "text-emerald-600"
                              : "text-slate-400"
                          }`}
                        >
                          {slot.is_group && isGroupBookingBusiness
                            ? getGroupSlotLabel(slot)
                            : "Disponible"}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

{selectedService && noSlotsThisWeek ? (
  <div className="mt-4 rounded-[22px] border border-indigo-100 bg-gradient-to-br from-indigo-50 via-white to-sky-50 p-3.5 shadow-sm md:mt-6 md:rounded-[26px] md:p-5">

    {loadingNextSlots ? (
  <div className="flex items-center gap-2 animate-pulse">
    <span className="h-2 w-2 rounded-full bg-indigo-500 animate-ping"></span>
    <p className="text-sm font-semibold text-slate-950">
      Buscando horarios disponibles...
    </p>
  </div>
) : (
      <p className="text-sm font-semibold text-slate-950">
        Sin disponibilidad durante la semana seleccionada.
      </p>
    )}

{!loadingNextSlots && (
  <p className="mt-1 text-sm text-slate-600">
    Tenemos estas fechas y horarios más próximos disponibles.
  </p>
)}

    <div className="mt-4 grid gap-2.5 md:grid-cols-2 md:gap-4">
      {nextAvailableDays.map((day) => (
        <div
          key={day.date}
          className="rounded-2xl border border-white bg-white/90 p-3 shadow-sm md:p-4"
        >
          <p className="text-sm font-semibold text-slate-900">
            {formatFullDate(day.slots[0].slot_start)}
          </p>

          <div className="mt-3 flex flex-wrap gap-2">
            {day.slots.map((slot) => (
              <button
                key={slot.slot_start}
                type="button"
                onClick={() => {
                  const nextSlotDate = new Date(slot.slot_start);
                  setSelectedDate(nextSlotDate);
                  setMobileSelectedDateKey(formatDate(nextSlotDate));
                  setSelectedSlot(slot);

                  setTimeout(() => {
                    formRef.current?.scrollIntoView({
                      behavior: "smooth",
                      block: "start",
                    });
                  }, 120);
                }}
                className="min-h-10 rounded-xl border border-indigo-200 bg-white px-3 py-2 text-xs font-semibold text-indigo-700 transition hover:border-indigo-400 hover:bg-indigo-50"
              >
                {formatHour(slot.slot_start)}
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>

{!loadingNextSlots && nextAvailableSlots.length > 0 ? (
  <button
    type="button"
    onClick={() => {
      const firstSlot = nextAvailableSlots[0];
      if (!firstSlot) return;

      const nextSlotDate = new Date(firstSlot.slot_start);
      setSelectedDate(nextSlotDate);
      setMobileSelectedDateKey(formatDate(nextSlotDate));
      setSelectedSlot(null);
    }}
    className="mt-4 inline-flex h-11 w-full items-center justify-center rounded-xl bg-slate-950 px-4 text-sm font-semibold text-white transition hover:opacity-90 sm:w-auto"
  >
    Ir a semana con disponibilidad
  </button>
) : null}
  </div>
) : null}


            {selectedSlot ? (
              <div
                ref={formRef}
                className="mt-4 overflow-hidden rounded-[22px] border border-indigo-200 bg-gradient-to-br from-indigo-50 via-white to-emerald-50 shadow-[0_24px_65px_-45px_rgba(79,70,229,0.55)] md:mt-6 md:rounded-[30px] md:shadow-[0_30px_80px_-45px_rgba(79,70,229,0.5)]"
              >
                <div className="h-1.5 bg-gradient-to-r from-indigo-600 via-sky-500 to-emerald-500" />

                <div className="p-3.5 md:p-6">
                  <div className="flex flex-col gap-3 md:gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-indigo-500 md:text-[11px] md:tracking-[0.28em]">
                        Reserva en curso
                      </p>
                      <h3 className="mt-1.5 text-lg font-bold tracking-tight text-slate-950 md:mt-2 md:text-2xl">
                        Completa tus datos
                      </h3>
                      <p className="mt-1.5 text-sm text-slate-600 md:mt-2">
                        Ya seleccionaste una hora. Completa tus datos para confirmar la reserva.
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                      <div className="rounded-xl border border-white/80 bg-white/90 px-3 py-2 shadow-sm md:rounded-2xl md:px-4 md:py-3">
                        <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400 md:text-[11px] md:tracking-[0.16em]">
                          Fecha
                        </p>
                        <p className="mt-1 text-sm font-semibold text-slate-900">
                          {formatFullDate(selectedSlot!.slot_start)}
                        </p>
                      </div>

                      <div className="rounded-xl border border-white/80 bg-white/90 px-3 py-2 shadow-sm md:rounded-2xl md:px-4 md:py-3">
                        <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400 md:text-[11px] md:tracking-[0.16em]">
                          Hora
                        </p>
                        <p className="mt-1 text-sm font-semibold text-slate-900">
                          {formatHour(selectedSlot!.slot_start)}
                        </p>
                      </div>

                      {selectedService ? (
                        <div className="rounded-xl border border-white/80 bg-white/90 px-3 py-2 shadow-sm md:rounded-2xl md:px-4 md:py-3">
                          <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400 md:text-[11px] md:tracking-[0.16em]">
                            Servicio
                          </p>
                          <p className="mt-1 text-sm font-semibold text-slate-900">
                            {selectedService.name}
                          </p>
                        </div>
                      ) : null}

                      {selectedStaffId ? (
                        <div className="rounded-xl border border-white/80 bg-white/90 px-3 py-2 shadow-sm md:rounded-2xl md:px-4 md:py-3">
                          <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400 md:text-[11px] md:tracking-[0.16em]">
                            Profesional
                          </p>
                          <p className="mt-1 text-sm font-semibold text-slate-900">
                            {staffOptions.find((staff) => staff.id === selectedStaffId)?.name || "Profesional"}
                          </p>
                        </div>
                      ) : null}
                    </div>
                  </div>


                  <div className="mt-4 grid gap-2.5 md:mt-6 md:grid-cols-2 md:gap-3">
                    <input
                      placeholder="Nombre y apellido"
                      value={customerData.name || ""}
                      onChange={(e) => updateCustomerField("name", e.target.value)}
                      className="h-11 rounded-xl border border-indigo-100 bg-white px-3.5 text-sm outline-none transition focus:border-indigo-400 md:h-12 md:rounded-2xl md:px-4"
                    />

                    <input
                      placeholder="Teléfono"
                      value={customerData.phone || ""}
                      onChange={(e) => updateCustomerField("phone", e.target.value)}
                      className="h-11 rounded-xl border border-indigo-100 bg-white px-3.5 text-sm outline-none transition focus:border-indigo-400 md:h-12 md:rounded-2xl md:px-4"
                    />

                    <input
                      placeholder="Email"
                      type="email"
                      value={customerData.email || ""}
                      onChange={(e) => updateCustomerField("email", e.target.value)}
                      className="h-11 rounded-xl border border-indigo-100 bg-white px-3.5 text-sm outline-none transition focus:border-indigo-400 md:col-span-2 md:h-12 md:rounded-2xl md:px-4"
                    />

                    {isVeterinaria && (
                      <div className="space-y-3 md:col-span-2">
                        <div className="rounded-2xl border border-emerald-100 bg-emerald-50/80 p-3 md:p-4">
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
                                  className={`min-h-11 rounded-2xl border px-3 py-2 text-sm font-medium transition md:h-11 md:px-4 md:py-0 ${
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
                                  className={`min-h-11 rounded-2xl border px-3 py-2 text-sm font-medium transition md:h-11 md:px-4 md:py-0 ${
                                    petMode === "new"
                                      ? "border-slate-900 bg-slate-900 text-white"
                                      : "border-slate-300 bg-white text-slate-700 hover:border-slate-400"
                                  }`}
                                >
                                  Crear mascota nueva
                                </button>
                              </div>

                              {petMode === "existing" ? (
  <div className="grid gap-2">
    {pets.map((pet) => {
      const species =
        String(pet.species_custom || "").trim() ||
        String(pet.species_base || "").trim();

      const isSelected = selectedPetId === pet.id;

      return (
        <button
          key={pet.id}
          type="button"
          onClick={() => {
            setSelectedPetId(pet.id);
            applyPetToForm(pet);
          }}
          className={`w-full rounded-2xl border p-3 text-left transition ${
            isSelected
              ? "border-emerald-600 bg-emerald-50 shadow-sm"
              : "border-slate-200 bg-white hover:border-emerald-300"
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="text-lg">
              {species.toLowerCase().includes("gato") ? "🐱" : "🐶"}
            </div>

            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-slate-900">
                {pet.name}
              </p>
              <p className="text-xs text-slate-500">
                {species}
              </p>
            </div>
          </div>
        </button>
      );
    })}
  </div>
) : null}
                            </div>
                          ) : null}
                        </div>

                        <div className="grid gap-3 md:grid-cols-2">
                          <input
                            placeholder="Nombre de la mascota"
                            value={customerData.pet_name || ""}
                            onChange={(e) =>
                              updateCustomerField("pet_name", e.target.value)
                            }
                            disabled={petMode === "existing" && pets.length > 0}
                            className="h-11 rounded-xl border border-indigo-100 bg-white px-3.5 text-sm outline-none transition disabled:bg-slate-100 disabled:text-slate-500 focus:border-emerald-400 md:h-12 md:rounded-2xl md:px-4"
                          />

                          <input
                            placeholder="Especie (perro, gato, etc)"
                            value={customerData.pet_species || ""}
                            onChange={(e) =>
                              updateCustomerField("pet_species", e.target.value)
                            }
                            disabled={petMode === "existing" && pets.length > 0}
                            className="h-11 rounded-xl border border-indigo-100 bg-white px-3.5 text-sm outline-none transition disabled:bg-slate-100 disabled:text-slate-500 focus:border-emerald-400 md:h-12 md:rounded-2xl md:px-4"
                          />
                        </div>
                      </div>
                    )}

                    {visibleSubtypeBookingFields.length > 0 ? (
                      <div className="space-y-3 rounded-2xl border border-indigo-100 bg-indigo-50/50 p-4 md:col-span-2">
                        <div>
                          <p className="text-sm font-semibold text-slate-900">
                            Datos de unidad/equipo
                          </p>
                          <p className="mt-1 text-xs text-slate-500">
                            Completa la informacion que ayude al negocio a preparar tu atencion.
                          </p>
                        </div>

                        <div className="grid gap-3 md:grid-cols-2">
                          {visibleSubtypeBookingFields.map((field) => {
                            const selectOptions = field.options || [];

                            if (
                              field.type === "select" &&
                              selectOptions.length > 0
                            ) {
                              return (
                                <select
                                  key={field.key}
                                  value={customerData[field.key] || ""}
                                  onChange={(e) =>
                                    updateCustomerField(field.key, e.target.value)
                                  }
                                  className="h-11 rounded-xl border border-indigo-100 bg-white px-3.5 text-sm outline-none transition focus:border-indigo-400 md:h-12 md:rounded-2xl md:px-4"
                                >
                                  <option value="">
                                    {field.required
                                      ? `${field.label} *`
                                      : field.label}
                                  </option>
                                  {selectOptions.map((option) => (
                                    <option key={option} value={option}>
                                      {option}
                                    </option>
                                  ))}
                                </select>
                              );
                            }

                            return field.type === "textarea" ? (
                              <textarea
                                key={field.key}
                                placeholder={
                                  field.required
                                    ? `${field.label} *`
                                    : field.label
                                }
                                value={customerData[field.key] || ""}
                                onChange={(e) =>
                                  updateCustomerField(field.key, e.target.value)
                                }
                                className="min-h-[88px] rounded-xl border border-indigo-100 bg-white px-3.5 py-3 text-sm outline-none transition focus:border-indigo-400 md:col-span-2 md:min-h-[96px] md:rounded-2xl md:px-4"
                              />
                            ) : (
                              <input
                                key={field.key}
                                placeholder={
                                  field.required
                                    ? `${field.label} *`
                                    : field.label
                                }
                                value={customerData[field.key] || ""}
                                onChange={(e) =>
                                  updateCustomerField(field.key, e.target.value)
                                }
                                className="h-11 rounded-xl border border-indigo-100 bg-white px-3.5 text-sm outline-none transition focus:border-indigo-400 md:h-12 md:rounded-2xl md:px-4"
                              />
                            );
                          })}
                        </div>
                      </div>
                    ) : null}

                    {visibleBookingFields.map((field) => (
                      <input
                        key={field.key}
                        placeholder={field.label}
                        value={customerData[field.key] || ""}
                        onChange={(e) =>
                          updateCustomerField(field.key, e.target.value)
                        }
                        className="h-11 rounded-xl border border-indigo-100 bg-white px-3.5 text-sm outline-none transition focus:border-indigo-400 md:col-span-2 md:h-12 md:rounded-2xl md:px-4"
                      />
                    ))}
                  </div>

                  {submitError ? (
                    <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                      {submitError}
                    </div>
                  ) : null}

                  <div className="sticky bottom-3 z-20 -mx-1 mt-5 flex flex-col gap-2 rounded-2xl border border-slate-200 bg-white/95 p-2 shadow-[0_18px_45px_-28px_rgba(15,23,42,0.75)] backdrop-blur md:static md:mx-0 md:flex-row md:items-center md:justify-between md:gap-3 md:border-0 md:bg-transparent md:p-0 md:shadow-none md:backdrop-blur-0">
                    <p className="px-1 text-xs text-slate-500 md:px-0 md:text-sm">
                      Revisa bien tus datos antes de confirmar.
                    </p>

                    <button
                      type="button"
                      onClick={handleSubmitBooking}
                      disabled={submitting}
                      className="inline-flex h-12 w-full items-center justify-center rounded-2xl bg-gradient-to-r from-slate-950 via-indigo-950 to-slate-900 px-6 text-sm font-semibold text-white shadow-[0_16px_35px_-22px_rgba(15,23,42,0.9)] transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60 md:w-auto md:font-medium md:shadow-none"
                    >
                      {submitting ? "Confirmando..." : "Confirmar hora"}
                    </button>
                  </div>
                </div>
              </div>
            ) : null}


            <div className="mt-auto grid gap-3 pt-5 sm:grid-cols-2 lg:grid-cols-4 lg:pt-6">
              <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-white to-slate-50 px-4 py-4 shadow-sm">
                <div className="flex items-start gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-indigo-100 bg-indigo-50 text-indigo-600 shadow-sm">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      className="h-5 w-5"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M12 3l7 4v5c0 4.5-2.8 7.7-7 9-4.2-1.3-7-4.5-7-9V7l7-4z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M9.5 12l1.7 1.7 3.3-3.4"
                      />
                    </svg>
                  </div>

                  <div>
                    <p className="text-sm font-semibold text-slate-900">
                      Reserva segura
                    </p>
                    <p className="mt-1 text-xs leading-5 text-slate-500">
                      Tus datos están protegidos y tu reserva queda registrada al instante.
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-white to-slate-50 px-4 py-4 shadow-sm">
                <div className="flex items-start gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-violet-100 bg-violet-50 text-violet-600 shadow-sm">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      className="h-5 w-5"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M12 6v6l4 2"
                      />
                      <circle cx="12" cy="12" r="9" />
                    </svg>
                  </div>

                  <div>
                    <p className="text-sm font-semibold text-slate-900">
                      Confirmación inmediata
                    </p>
                    <p className="mt-1 text-xs leading-5 text-slate-500">
                      Recibirás el detalle de tu reserva apenas confirmes la hora.
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-white to-slate-50 px-4 py-4 shadow-sm">
                <div className="flex items-start gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-emerald-100 bg-emerald-50 text-emerald-600 shadow-sm">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      className="h-5 w-5"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M8 10h8M8 14h5"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M21 12c0 4.97-4.03 9-9 9a8.96 8.96 0 0 1-4.24-1.06L3 21l1.19-4.01A8.96 8.96 0 0 1 3 12c0-4.97 4.03-9 9-9s9 4.03 9 9z"
                      />
                    </svg>
                  </div>

                  <div>
                    <p className="text-sm font-semibold text-slate-900">
                      ¿Necesitas ayuda?
                    </p>
                    <p className="mt-1 text-xs leading-5 text-slate-500">
                      Puedes escribirnos por WhatsApp si tienes dudas antes de reservar.
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-emerald-100 bg-gradient-to-r from-emerald-50 to-white px-4 py-4 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-500 text-white shadow-sm">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      className="h-5 w-5"
                    >
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.966-.273-.099-.471-.148-.67.15-.198.297-.768.966-.94 1.164-.173.198-.347.223-.644.074-.297-.149-1.255-.463-2.39-1.475-.883-.787-1.48-1.759-1.653-2.056-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.5-.669-.51l-.57-.01c-.198 0-.52.074-.793.372-.273.297-1.04 1.016-1.04 2.479s1.065 2.875 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.71.306 1.263.489 1.694.625.712.227 1.36.195 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.174-1.413-.075-.124-.273-.198-.57-.347z" />
                      <path d="M20.52 3.449A11.94 11.94 0 0 0 12.043 0C5.495 0 .161 5.334.161 11.882c0 2.094.547 4.139 1.587 5.945L0 24l6.356-1.667a11.86 11.86 0 0 0 5.687 1.448h.005c6.548 0 11.882-5.334 11.882-11.882a11.8 11.8 0 0 0-3.41-8.45zm-8.477 18.32h-.004a9.86 9.86 0 0 1-5.026-1.378l-.361-.214-3.772.99 1.007-3.676-.235-.377a9.86 9.86 0 0 1-1.52-5.232c.003-5.44 4.43-9.867 9.875-9.867 2.637 0 5.114 1.027 6.978 2.893a9.82 9.82 0 0 1 2.889 6.983c-.003 5.443-4.43 9.878-9.87 9.878z" />
                    </svg>
                  </div>

                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-900">
                      {business?.whatsapp || visiblePhone || "WhatsApp disponible"}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      Responderemos lo antes posible.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {showStaffDrawer ? (
          <div className="fixed inset-0 z-50">
            <button
              type="button"
              className="absolute inset-0 bg-slate-950/35 backdrop-blur-sm"
              aria-label="Cerrar profesionales"
              onClick={() => setShowStaffDrawer(false)}
            />

            <aside className="absolute bottom-0 right-0 top-0 flex w-full max-w-[460px] flex-col border-l border-slate-200 bg-white shadow-[0_30px_100px_-45px_rgba(15,23,42,0.7)]">
              <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
                <div>
                  <p className="text-lg font-bold text-slate-950">
                    Profesionales disponibles
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    Elige uno o deja que Orbyx asigne automáticamente.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setShowStaffDrawer(false)}
                  className="flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 text-xl text-slate-500 transition hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700"
                  aria-label="Cerrar"
                >
                  ×
                </button>
              </div>

              <div className="space-y-4 px-5 py-4">
                <div className="relative">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M21 21l-4.35-4.35M10.5 18a7.5 7.5 0 110-15 7.5 7.5 0 010 15z"
                    />
                  </svg>
                  <input
                    value={staffSearchQuery}
                    onChange={(e) => setStaffSearchQuery(e.target.value)}
                    placeholder="Buscar profesional..."
                    className="h-12 w-full rounded-2xl border border-slate-200 bg-white pl-11 pr-4 text-sm text-slate-800 outline-none transition focus:border-indigo-400"
                  />
                </div>
              </div>

              <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-5 pb-5">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedStaffId("");
                    setSelectedSlot(null);
                    setShowStaffDrawer(false);
                  }}
                  className={`w-full rounded-2xl border p-4 text-left transition ${
                    selectedStaffId === ""
                      ? "border-indigo-500 bg-indigo-50 shadow-sm"
                      : "border-slate-200 bg-white hover:border-indigo-300 hover:bg-indigo-50"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-indigo-100 bg-indigo-50 text-lg font-bold text-indigo-700">
                      *
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-slate-950">
                        Cualquiera disponible
                      </p>
                      <p className="mt-1 text-xs leading-5 text-slate-500">
                        Te asignaremos el primer profesional disponible.
                      </p>
                    </div>
                  </div>
                </button>

                {filteredDrawerStaff.map((staff) => (
                  <div
                    key={staff.id}
                    className={`rounded-2xl border bg-white p-4 transition ${
                      selectedStaffId === staff.id
                        ? "border-indigo-500 shadow-sm"
                        : "border-slate-200 hover:border-indigo-300"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <StaffPhotoPreview staff={staff} align="right" />

                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-bold text-slate-950">
                          {staff.name}
                        </p>
                        <p className="mt-1 text-xs font-semibold text-indigo-600">
                          {staff.role?.trim() || "Profesional"}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          setSelectedStaffId(staff.id);
                          setSelectedSlot(null);
                          setShowStaffDrawer(false);
                        }}
                        className="h-10 rounded-xl border border-indigo-300 px-4 text-sm font-semibold text-indigo-700 transition hover:bg-indigo-50"
                      >
                        Elegir
                      </button>
                    </div>
                  </div>
                ))}

                {filteredDrawerStaff.length === 0 ? (
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
                    No encontramos profesionales con ese nombre.
                  </div>
                ) : null}
              </div>
            </aside>
          </div>
        ) : null}

        {loadingPage ? (
          <div className="mt-6 text-sm text-slate-500">Cargando...</div>
        ) : null}
      </div>
    </div>
  );
}
