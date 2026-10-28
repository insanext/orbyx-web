"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useParams, usePathname } from "next/navigation";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import { PhoneCountryInput } from "../../components/auth/PhoneCountryInput";
import { isValidPhoneForCountry, toE164 } from "../../components/auth/countries";
import { BACKEND_URL } from "@/lib/backend-url";
import Select from "@/components/ui/Select";
import {
  applyPublicTemplate,
  getPublicTemplate,
  isKnownPublicTemplate,
} from "@/lib/public-templates";
import { Turnstile } from "@marsidev/react-turnstile";

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
  group_id?: string | null;
  requires_deposit?: boolean | null;
  deposit_amount?: number | null;
  customer_instructions?: string | null;
  // Extras que ofrece el servicio (GET /public/services). Vacío si no tiene.
  extras?: ServiceExtraOption[];
  // Profesionales activos que realizan el servicio (GET /public/services).
  staff_ids?: string[];
};

type ServiceExtraOption = {
  id: string;
  name: string;
  description?: string | null;
  price: number;
  duration_minutes: number;
};

type ServiceGroupItem = {
  id: string;
  name: string;
  sort_order?: number | null;
};

type BusinessHourDay = {
  day_of_week: number;
  enabled: boolean;
  start_time?: string | null;
  end_time?: string | null;
};

type BranchItem = {
  id: string;
  tenant_id?: string;
  name: string;
  slug?: string | null;
  address?: string | null;
  phone?: string | null;
  whatsapp?: string | null;
  email?: string | null;
  description?: string | null;
  commune?: string | null;
  region?: string | null;
  // Calle + comuna + región ya resueltos por el backend (con la herencia
  // use_global_contact aplicada). Es lo que se muestra y se geocodifica.
  full_address?: string | null;
  map_url?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  // Banner de portada ya resuelto por el backend (propio de la sucursal si
  // use_global_banner es false, si no el del negocio).
  effective_banner_url?: string | null;
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
  commune?: string | null;
  region?: string | null;
  full_address?: string | null;
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
  logo_url?: string | null;
  banner_url?: string | null;
  public_template?: string | null;
  deposit_required?: boolean;
  deposit_bank_name?: string | null;
  deposit_account_type?: string | null;
  deposit_account_number?: string | null;
  deposit_holder_rut?: string | null;
  deposit_holder_name?: string | null;
};

type PublicServicesResponse = {
  booking_closed?: boolean;
  business?: BusinessItem;
  branch?: BranchItem | null;
  branches?: BranchItem[];
  calendar_id?: string | null;
  services?: ServiceItem[];
  service_groups?: ServiceGroupItem[];
  business_hours?: BusinessHourDay[];
  // Profesionales activos de la sucursal (aditivo; puede faltar en backends viejos).
  staff?: StaffItem[];
};

type ReviewReplyItem = {
  id: string;
  message: string;
  created_at: string;
};

type ReviewItem = {
  id: string;
  status?: "visible" | "hidden";
  hidden_reason?: string | null;
  client_name?: string | null;
  rating?: number;
  comment?: string | null;
  reaction?: string | null;
  replies?: ReviewReplyItem[];
  created_at: string;
};

type ReviewsSummary = {
  average: number;
  count: number;
  reviews: ReviewItem[];
};

function formatReviewDate(value: string) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return new Intl.DateTimeFormat("es-CL", { dateStyle: "medium" }).format(d);
}

function StarIcon({ filled, className }: { filled: boolean; className?: string }) {
  return (
    <svg
      viewBox="0 0 20 20"
      className={className}
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
    >
      <path
        strokeWidth="1.5"
        strokeLinejoin="round"
        d="M10 1.5l2.6 5.6 6.1.6-4.6 4.2 1.3 6-5.4-3.1-5.4 3.1 1.3-6-4.6-4.2 6.1-.6z"
      />
    </svg>
  );
}

type BookingSuccessData = {
  serviceName: string;
  date: string;
  time: string;
  branchName?: string;
  branchAddress?: string;
  staffName?: string;
  customerEmail?: string;
  customerPhone?: string;
  customerInstructions?: string;
  startIso: string;
  endIso: string;
};

type DepositPendingData = {
  appointmentId: string;
  uploadToken: string;
  holdExpiresAt: string;
  serviceName: string;
  date: string;
  time: string;
};


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

const lockedBookingFieldKeys = new Set([
  "name",
  "phone",
  "email",
  "pet_name",
  "pet_species",
]);

const configurableBookingFieldKeys = new Set([
  "rut",
  "address",
  "company",
  "visit_reason",
]);

const configurableBookingFields: BookingField[] = [
  { key: "rut", label: "RUT", enabled: false, required: false },
  { key: "address", label: "Dirección", enabled: false, required: false },
  { key: "company", label: "Empresa", enabled: false, required: false },
  {
    key: "visit_reason",
    label: "Motivo de consulta",
    enabled: false,
    required: false,
  },
];

function normalizeBookingFieldsConfig(fields?: unknown): BookingField[] {
  const savedFields = Array.isArray(fields) ? fields : [];

  return configurableBookingFields.map((baseField) => {
    const savedField = savedFields.find((item) => {
      if (!item || typeof item !== "object") return false;
      return (item as { key?: unknown }).key === baseField.key;
    }) as Partial<BookingField> | undefined;

    const enabled =
      typeof savedField?.enabled === "boolean"
        ? savedField.enabled
        : baseField.enabled;

    return {
      ...baseField,
      enabled,
      required:
        enabled && typeof savedField?.required === "boolean"
          ? savedField.required
          : false,
    };
  }).filter((field) => configurableBookingFieldKeys.has(field.key));
}


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

// Encabezado de cada día del calendario de reservas: degradado del color
// principal de la plantilla (indigo-600 y sus derivados con color-mix, así
// funciona con cualquier plantilla). El brillo va a la derecha para no restar
// contraste al texto, que va a la izquierda. Sábado y domingo: mismo estilo,
// bastante más oscuro; en plantillas oscuras (texto oscuro en el resto de la
// página) el fin de semana pasa a texto claro sobre fondo oscuro.
const DAY_HEADER_CSS = `
.orbyx-day-head {
  --oh-base: var(--color-indigo-600, #4f46e5);
  background-image:
    radial-gradient(90% 140% at 100% 0%, rgba(255,255,255,0.18), transparent 60%),
    linear-gradient(135deg, var(--oh-base) 0%, color-mix(in srgb, var(--oh-base) 90%, white) 45%, color-mix(in srgb, var(--oh-base) 78%, black) 100%);
  box-shadow: inset 0 1px 0 rgba(255,255,255,0.28);
}
.orbyx-day-head-weekend { --oh-base: color-mix(in srgb, var(--color-indigo-600, #4f46e5) 56%, black); }
html[data-public-dark] .orbyx-day-head-weekend { --oh-base: color-mix(in srgb, var(--color-indigo-600, #4f46e5) 40%, black); }
html[data-public-dark] .orbyx-day-head-weekend,
html[data-public-dark] .orbyx-day-head-weekend * { color: #f8fafc; }
`;

function dayHeaderClass(date: Date) {
  const isWeekend = date.getDay() === 0 || date.getDay() === 6;
  return isWeekend ? "orbyx-day-head orbyx-day-head-weekend" : "orbyx-day-head";
}

// Junta, en orden de hora, los horarios libres con los ocupados del día (si el
// servidor los informa). Los ocupados solo se muestran: no se pueden elegir.
function mergeDaySlots(available: SlotItem[], occupied: SlotItem[]) {
  return [
    ...available.map((slot) => ({ slot, occupied: false })),
    ...occupied.map((slot) => ({ slot, occupied: true })),
  ].sort((a, b) => a.slot.slot_start.localeCompare(b.slot.slot_start));
}

// Horario ya tomado: bloque gris con degradado, igual para todos. El tachado va
// solo en la hora; "Ocupado" queda sin tachar y con texto oscuro (contraste).
function OccupiedSlot({ slot, variant }: { slot: SlotItem; variant: "desktop" | "mobile" }) {
  const isMobile = variant === "mobile";
  return (
    <div
      aria-disabled="true"
      title="Horario ocupado"
      className={
        isMobile
          ? "min-h-[54px] cursor-not-allowed rounded-none border border-slate-300 bg-gradient-to-b from-slate-200 to-slate-300 px-3 py-2.5 text-center text-slate-700"
          : "flex min-h-[40px] w-full cursor-not-allowed flex-row items-center justify-between gap-2 rounded-none border border-slate-300 bg-gradient-to-b from-slate-200 to-slate-300 px-2.5 py-1.5 text-slate-700 md:min-h-[34px] md:flex-col md:justify-center md:px-2 md:py-1 md:text-center"
      }
    >
      <span
        className={
          isMobile
            ? "block text-base font-bold leading-none line-through decoration-slate-500"
            : "text-sm font-semibold leading-none line-through decoration-slate-500 md:text-[11px]"
        }
      >
        {formatHour(slot.slot_start)}
      </span>
      <span
        className={
          isMobile
            ? "mt-1.5 block text-[10px] font-medium leading-tight"
            : "text-[11px] font-medium leading-none md:mt-1 md:text-[9px]"
        }
      >
        Ocupado
      </span>
    </div>
  );
}

// Día sin atención (o sin horarios): aviso compacto dentro de la columna.
function NoAvailabilityNotice() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-1.5 rounded-none bg-slate-100/80 px-2 py-6 text-center text-slate-500">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        className="h-5 w-5"
        aria-hidden="true"
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 3v3M16 3v3M4 9h16M5 5h14a1 1 0 011 1v13a1 1 0 01-1 1H5a1 1 0 01-1-1V6a1 1 0 011-1z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M10 13l4 4M14 13l-4 4" />
      </svg>
      <p className="text-xs font-semibold leading-tight">No disponible</p>
    </div>
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

function buildMapsEmbedUrl(
  address?: string | null,
  latitude?: number | null,
  longitude?: number | null
) {
  if (typeof latitude === "number" && typeof longitude === "number") {
    return `https://www.google.com/maps?q=${latitude},${longitude}&hl=es&z=16&output=embed`;
  }
  if (!address) return "";
  return `https://www.google.com/maps?q=${encodeURIComponent(
    address
  )}&hl=es&z=15&output=embed`;
}

function formatHourLabel(time?: string | null) {
  if (!time) return "";
  const [h, m] = time.split(":").map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return time;
  return `${h}:${String(m).padStart(2, "0")}`;
}

const UNGROUPED_CATEGORY_KEY = "__sin_categoria__";
// Con más servicios que esto (en total) el catálogo parte compacto: solo la
// primera categoría abierta y, al abrir otra, las demás se cierran.
const COMPACT_CATALOG_MIN_SERVICES = 8;

const WEEKDAY_ORDER = [1, 2, 3, 4, 5, 6, 0];
const WEEKDAY_LABELS: Record<number, string> = {
  0: "Domingo",
  1: "Lunes",
  2: "Martes",
  3: "Miércoles",
  4: "Jueves",
  5: "Viernes",
  6: "Sábado",
};

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
      <div className="h-12 w-12 overflow-hidden rounded-none border border-slate-200 bg-slate-100 md:h-14 md:w-14">
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
        <div className="w-[320px] overflow-hidden rounded-none border border-slate-200 bg-white shadow-[0_28px_80px_-35px_rgba(15,23,42,0.45)]">
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
          </div>
        </div>
      </div>
    </div>
  );
}

function DetailRow({
  icon,
  label,
  value,
  href,
}: {
  icon: string;
  label: string;
  value: string;
  href?: string;
}) {
  return (
    <div className="flex items-start justify-between gap-3 py-2.5">
      <span className="flex shrink-0 items-center gap-2 text-sm text-slate-500">
        <span aria-hidden="true">{icon}</span>
        {label}
      </span>

      {href ? (
        <a
          href={href}
          target="_blank"
          rel="noreferrer"
          className="min-w-0 break-words text-right text-sm font-semibold text-indigo-600 underline-offset-2 hover:underline"
        >
          {value}
        </a>
      ) : (
        <span className="min-w-0 break-words text-right text-sm font-semibold text-slate-900">
          {value}
        </span>
      )}
    </div>
  );
}

function InstagramBrandIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
      <defs>
        <linearGradient id="orbyx-ig-gradient" x1="0" y1="1" x2="1" y2="0">
          <stop offset="0%" stopColor="#FEDA75" />
          <stop offset="30%" stopColor="#FA7E1E" />
          <stop offset="55%" stopColor="#D62976" />
          <stop offset="80%" stopColor="#962FBF" />
          <stop offset="100%" stopColor="#4F5BD5" />
        </linearGradient>
      </defs>
      <g fill="none" stroke="url(#orbyx-ig-gradient)" strokeWidth="1.9">
        <rect x="3" y="3" width="18" height="18" rx="5" />
        <circle cx="12" cy="12" r="4" />
      </g>
      <circle cx="17.2" cy="6.8" r="1.15" fill="url(#orbyx-ig-gradient)" />
    </svg>
  );
}

function FacebookBrandIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
      <circle cx="12" cy="12" r="10" fill="#1877F2" />
      <path
        fill="#fff"
        d="M13.5 21v-7.5h2.5l.5-3h-3V8.5c0-.9.3-1.5 1.6-1.5H16.5V4.3c-.3 0-1.2-.1-2.3-.1-2.3 0-3.9 1.4-3.9 4v2.3H8v3h2.3V21h3.2z"
      />
    </svg>
  );
}

// Descripción del negocio: texto compacto con un máximo de líneas (line-clamp).
// "Ver más" aparece solo si el texto realmente se corta (se mide con el alto
// real del párrafo) y abre el texto completo en un cuadro aparte, así la
// tarjeta no crece ni empuja el resto de la página hacia abajo.
function BusinessDescription({ text, name }: { text: string; name: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isTruncated, setIsTruncated] = useState(false);
  const paragraphRef = useRef<HTMLParagraphElement | null>(null);

  useEffect(() => {
    const el = paragraphRef.current;
    if (!el) return;
    const measure = () => setIsTruncated(el.scrollHeight > el.clientHeight + 1);
    measure();
    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, [text]);

  return (
    <div className="mt-1.5 max-w-md">
      <p
        ref={paragraphRef}
        className="line-clamp-7 text-xs leading-snug text-slate-500 sm:line-clamp-5 sm:text-[13px] md:text-sm"
      >
        {text}
      </p>
      {isTruncated ? (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          aria-haspopup="dialog"
          className="mt-1 text-xs font-semibold text-indigo-600 hover:underline md:text-sm"
        >
          Ver más
        </button>
      ) : null}
      {isOpen ? (
        <DescriptionDialog name={name} text={text} onClose={() => setIsOpen(false)} />
      ) : null}
    </div>
  );
}

// Descripción completa en un cuadro aparte (portal sobre la página), mismo
// patrón que HoursDialog: se cierra con la X, tocando fuera o con Escape. Si el
// texto es largo, hace scroll dentro del cuadro.
function DescriptionDialog({
  name,
  text,
  onClose,
}: {
  name: string;
  text: string;
  onClose: () => void;
}) {
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  if (typeof document === "undefined") return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/40 px-4"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="orbyx-description-title"
        className="flex max-h-[80vh] w-full max-w-md flex-col rounded-xl border border-slate-200 bg-white p-4 shadow-[0_30px_80px_-30px_rgba(15,23,42,0.6)]"
      >
        <div className="mb-2 flex shrink-0 items-center justify-between gap-3">
          <p id="orbyx-description-title" className="text-sm font-bold text-slate-950">
            {name || "Sobre nosotros"}
          </p>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar descripción"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>
        <p className="min-h-0 flex-1 overflow-y-auto whitespace-pre-line break-words text-sm leading-relaxed text-slate-600">
          {text}
        </p>
      </div>
    </div>,
    document.body
  );
}

// Selector de sucursal: mismo patrón visual que el selector de sucursal del
// dashboard (punto de estado + nombre + dirección), en versión clara y
// compacta. La lista se pinta en un portal con posición fija para que no la
// recorte el overflow-hidden de la tarjeta ni quede bajo otras tarjetas.
function BranchPicker({
  branches,
  selectedBranchId,
  onBranchChange,
}: {
  branches: BranchItem[];
  selectedBranchId: string;
  onBranchChange: (branchId: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ left: number; top: number; width: number } | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const selected = branches.find((b) => b.id === selectedBranchId) || branches[0];

  function toggle() {
    if (open) {
      setOpen(false);
      return;
    }
    const rect = triggerRef.current?.getBoundingClientRect();
    if (!rect) return;
    setPos({ left: rect.left, top: rect.bottom + 4, width: Math.max(rect.width, 220) });
    setOpen(true);
  }

  useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent) {
      const target = e.target as Node;
      if (triggerRef.current?.contains(target) || menuRef.current?.contains(target)) return;
      setOpen(false);
    }
    function close() {
      setOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    window.addEventListener("scroll", close, true);
    window.addEventListener("resize", close);
    return () => {
      document.removeEventListener("mousedown", onDown);
      window.removeEventListener("scroll", close, true);
      window.removeEventListener("resize", close);
    };
  }, [open]);

  return (
    <div className="mt-3 w-full max-w-[220px] text-left">
      <label className="mb-1 block text-[11px] font-semibold text-slate-500">Sucursal</label>
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={toggle}
        className={`flex h-9 w-full items-center gap-2 rounded-none border bg-white px-2.5 text-left transition ${
          open ? "border-indigo-400" : "border-slate-300 hover:border-indigo-300"
        }`}
      >
        <span className="h-2 w-2 shrink-0 rounded-full bg-emerald-400" />
        <span className="min-w-0 flex-1 truncate text-sm font-semibold text-slate-900">
          {selected?.name}
        </span>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className={`h-4 w-4 shrink-0 text-slate-400 transition-transform ${open ? "rotate-180" : ""}`}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 9l6 6 6-6" />
        </svg>
      </button>

      {open && pos
        ? createPortal(
            <div
              ref={menuRef}
              role="listbox"
              style={{ position: "fixed", left: pos.left, top: pos.top, width: pos.width, zIndex: 1000 }}
              className="max-h-72 overflow-y-auto border border-slate-200 bg-white py-1 shadow-[0_20px_40px_-20px_rgba(15,23,42,0.35)]"
            >
              {branches.map((branch) => {
                const isSelected = branch.id === selected?.id;
                return (
                  <button
                    key={branch.id}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => {
                      onBranchChange(branch.id);
                      setOpen(false);
                    }}
                    className={`flex w-full items-center gap-2.5 px-2.5 py-2 text-left transition ${
                      isSelected ? "bg-indigo-50" : "hover:bg-slate-50"
                    }`}
                  >
                    <span
                      className={`h-2 w-2 shrink-0 rounded-full ${
                        isSelected ? "bg-emerald-400" : "border border-slate-300"
                      }`}
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold text-slate-900">
                        {branch.name}
                      </span>
                      {branch.full_address ? (
                        <span className="block truncate text-[11px] text-slate-500">
                          {branch.full_address}
                        </span>
                      ) : null}
                    </span>
                  </button>
                );
              })}
            </div>,
            document.body
          )
        : null}
    </div>
  );
}

function BusinessBannerCard({
  business,
  slug,
  branches,
  selectedBranchId,
  onBranchChange,
  reviewSummary,
  onOpenReviews,
  contact,
}: {
  business: BusinessItem | null;
  slug: string;
  branches: BranchItem[];
  selectedBranchId: string;
  onBranchChange: (branchId: string) => void;
  reviewSummary: ReviewsSummary | null;
  onOpenReviews: () => void;
  contact: BusinessContactProps;
}) {
  const showBranchSelector = branches.length > 1;
  const selectedBranch = branches.find((b) => b.id === selectedBranchId);
  const bannerUrl =
    (selectedBranch?.effective_banner_url || business?.banner_url || "").trim();
  const showContact = hasBusinessContact(contact);

  // Portada arriba (si existe). Debajo, dos columnas en pantallas anchas:
  // logo + nombre + descripción a la izquierda y mapa + contacto a la
  // derecha, separadas por una línea. En el celular el contacto va debajo.
  return (
    <div className="min-w-0 overflow-hidden rounded-none border border-slate-200 bg-white shadow-[0_16px_45px_-34px_rgba(76,29,149,0.25)]">
      {bannerUrl ? (
        <div className="aspect-[3/1] w-full overflow-hidden bg-slate-200">
          <img src={bannerUrl} alt="" className="h-full w-full object-cover" />
        </div>
      ) : null}

      <div
        className={`grid min-w-0 ${
          showContact ? "grid-cols-2 sm:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]" : ""
        }`}
      >
        <div className={`min-w-0 pb-4 ${showContact ? "pl-3 pr-2.5" : "px-4"} sm:px-6 sm:pb-6 ${bannerUrl ? "" : "pt-4 sm:pt-6"}`}>
          {/* Logo y, a su derecha, las redes sociales. */}
          <div className="flex items-end gap-2 sm:gap-3">
            <div
              className={`relative inline-block rounded-2xl bg-white p-1 shadow-[0_16px_32px_-20px_rgba(15,23,42,0.55)] ${
                bannerUrl ? "-mt-8 sm:-mt-10 md:-mt-14" : ""
              }`}
            >
              {business?.logo_url ? (
                <img
                  src={business.logo_url}
                  alt={business?.name || slug || "Logo"}
                  className="h-16 w-16 rounded-xl object-cover sm:h-20 sm:w-20 md:h-28 md:w-28"
                />
              ) : (
                <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-slate-950 text-xl font-bold text-white sm:h-20 sm:w-20 sm:text-2xl md:h-28 md:w-28 md:text-3xl">
                  {getBusinessInitials(business?.name || slug)}
                </div>
              )}
            </div>
            {contact.instagramUrl || contact.facebookUrl ? (
              <div className="mb-0.5 flex items-center gap-1.5 sm:gap-2">
                {contact.instagramUrl ? (
                  <a
                    href={contact.instagramUrl}
                    target="_blank"
                    rel="noreferrer"
                    aria-label="Instagram"
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:border-indigo-300 hover:text-indigo-600 sm:h-9 sm:w-9"
                  >
                    <InstagramBrandIcon />
                  </a>
                ) : null}
                {contact.facebookUrl ? (
                  <a
                    href={contact.facebookUrl}
                    target="_blank"
                    rel="noreferrer"
                    aria-label="Facebook"
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:border-indigo-300 hover:text-indigo-600 sm:h-9 sm:w-9"
                  >
                    <FacebookBrandIcon />
                  </a>
                ) : null}
              </div>
            ) : null}
          </div>

          <h1 className="mt-2.5 text-lg font-bold leading-tight tracking-tight text-slate-950 sm:mt-3 sm:text-xl md:text-[28px]">
            {business?.name || slug || "Reserva"}
          </h1>

          {business?.description?.trim() ? (
            <BusinessDescription
              text={business.description.trim()}
              name={business?.name || slug || ""}
            />
          ) : null}

          {reviewSummary && reviewSummary.count > 0 ? (
            <button
              type="button"
              onClick={onOpenReviews}
              className="mt-2 flex flex-wrap items-center gap-1.5 text-sm"
            >
              <span className="flex items-center gap-0.5 text-amber-400">
                {[1, 2, 3, 4, 5].map((star) => (
                  <StarIcon
                    key={star}
                    filled={star <= Math.round(reviewSummary.average)}
                    className="h-4 w-4"
                  />
                ))}
              </span>
              <span className="font-semibold text-slate-800">
                {reviewSummary.average.toFixed(1)}
              </span>
              <span className="text-slate-500 underline decoration-slate-300 underline-offset-2">
                (Ver {reviewSummary.count}{" "}
                {reviewSummary.count === 1 ? "reseña" : "reseñas"})
              </span>
            </button>
          ) : null}

          {showBranchSelector ? (
            <div className="mt-4 w-full max-w-xs">
              <BranchPicker
                branches={branches}
                selectedBranchId={selectedBranchId}
                onBranchChange={onBranchChange}
              />
            </div>
          ) : null}
        </div>

        {showContact ? (
          <div className="my-3 min-w-0 border-l border-slate-200 pl-2.5 pr-3 sm:my-5 sm:px-5">
            <BusinessLocationPanel {...contact} />
          </div>
        ) : null}
      </div>
    </div>
  );
}

const CATEGORY_HEADER_GRADIENT = "linear-gradient(90deg, var(--pt-cat-from, #EEF0FF) 0%, var(--pt-cat-mid, #F6F5FF) 55%, var(--color-white, #FFFFFF) 100%)";

type CatalogCategoryOption = {
  key: string;
  name: string;
  totalCount: number;
};

function CatalogSidebar({
  searchQuery,
  onSearchChange,
  categories,
  activeCategoryKey,
  onCategoryChange,
  staff,
  hasSelectedService,
}: {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  categories: CatalogCategoryOption[];
  activeCategoryKey: string;
  onCategoryChange: (key: string) => void;
  staff: StaffItem[];
  hasSelectedService: boolean;
}) {
  return (
    <div className="min-w-0 space-y-3 rounded-none border border-slate-200 bg-white p-3 shadow-[0_16px_45px_-34px_rgba(15,23,42,0.25)] lg:space-y-4 lg:border-0 lg:bg-transparent lg:p-0 lg:shadow-none">
      <div className="relative">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M21 21l-4.35-4.35M10.5 18a7.5 7.5 0 110-15 7.5 7.5 0 010 15z"
          />
        </svg>
        <input
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="¿Qué servicio buscas?"
          className="h-10 w-full rounded-none border border-slate-200 bg-slate-50 pl-10 pr-3 text-sm text-slate-800 outline-none transition focus:border-indigo-400 focus:bg-white lg:h-11"
        />
      </div>

      <div className="flex gap-1.5 overflow-x-auto [scrollbar-width:none] lg:flex-col lg:gap-1 lg:overflow-visible [&::-webkit-scrollbar]:hidden">
        <button
          type="button"
          onClick={() => onCategoryChange("todos")}
          className={`flex shrink-0 items-center gap-2 rounded-none px-3 py-1.5 text-left text-xs transition lg:w-full lg:rounded-l-none lg:rounded-r-none lg:px-3.5 lg:py-2.5 lg:text-sm ${
            activeCategoryKey === "todos"
              ? "border-l-[3px] border-indigo-600 bg-[color:var(--pt-selected-bg,#EDEBFB)] font-semibold text-indigo-700"
              : "border-l-[3px] border-transparent text-slate-600 hover:bg-slate-50"
          }`}
        >
          Todos
        </button>

        {categories.map((category) => (
          <button
            key={category.key}
            type="button"
            onClick={() => onCategoryChange(category.key)}
            className={`flex shrink-0 items-center gap-2 rounded-none px-3 py-1.5 text-left text-xs transition lg:w-full lg:rounded-l-none lg:rounded-r-none lg:px-3.5 lg:py-2.5 lg:text-sm ${
              activeCategoryKey === category.key
                ? "border-l-[3px] border-indigo-600 bg-[color:var(--pt-selected-bg,#EDEBFB)] font-semibold text-indigo-700"
                : "border-l-[3px] border-transparent text-slate-600 hover:bg-slate-50"
            }`}
          >
            {category.name}
          </button>
        ))}
      </div>

      {/* Equipo en móvil (en escritorio va en una tarjeta arriba del catálogo). */}
      {staff.length > 0 ? (
        <div className="border-t border-slate-100 pt-3 lg:hidden">
          <p className="mb-2 text-xs font-semibold text-slate-900">
            {hasSelectedService ? "Profesionales de este servicio" : "Nuestro equipo"}
          </p>
          <TeamStrip staff={staff} size="sm" />
        </div>
      ) : null}
    </div>
  );
}

// Extras del servicio elegido, debajo de su fila en el catálogo.
function ServiceExtrasChooser({
  service,
  selectedExtraIds,
  onToggleExtra,
}: {
  service: ServiceItem;
  selectedExtraIds: string[];
  onToggleExtra: (extraId: string) => void;
}) {
  const extras = service.extras || [];
  if (extras.length === 0) return null;
  const chosen = extras.filter((e) => selectedExtraIds.includes(e.id));
  const totalPrice = Number(service.price || 0) + chosen.reduce((sum, e) => sum + Number(e.price || 0), 0);
  const totalMinutes =
    Number(service.duration_minutes || 0) + chosen.reduce((sum, e) => sum + Number(e.duration_minutes || 0), 0);

  return (
    <div className="border-l-4 border-indigo-600 bg-indigo-50/60 px-3 pb-4 pt-1 md:px-5">
      <p className="mb-2 text-xs font-semibold text-indigo-900">¿Quieres agregar algo?</p>
      <div className="flex flex-wrap gap-2">
        {extras.map((extra) => {
          const selected = selectedExtraIds.includes(extra.id);
          return (
            <button
              key={extra.id}
              type="button"
              onClick={() => onToggleExtra(extra.id)}
              aria-pressed={selected}
              className={`rounded-full border px-3 py-1.5 text-left text-xs font-medium transition ${
                selected
                  ? "border-indigo-600 bg-indigo-600 text-white shadow-sm"
                  : "border-indigo-200 bg-white text-slate-700 hover:border-indigo-400"
              }`}
            >
              {selected ? "✓ " : "+ "}
              {extra.name}
              <span className={selected ? "text-indigo-100" : "text-slate-500"}>
                {" "}
                · {formatPrice(extra.price)}
                {extra.duration_minutes > 0 ? ` · +${extra.duration_minutes} min` : ""}
              </span>
            </button>
          );
        })}
      </div>
      {chosen.length > 0 ? (
        <p className="mt-3 text-sm font-semibold text-slate-900">
          Total: {formatPrice(totalPrice)} · {totalMinutes} min
        </p>
      ) : null}
    </div>
  );
}

function ServiceCatalogAccordion({
  categories,
  selectedServiceId,
  onSelect,
  collapsedKeys,
  onToggleCategory,
  selectedExtraIds,
  onToggleExtra,
}: {
  categories: { key: string; name: string; totalCount: number; services: ServiceItem[] }[];
  selectedServiceId: string;
  onSelect: (service: ServiceItem) => void;
  collapsedKeys: Set<string>;
  onToggleCategory: (key: string) => void;
  selectedExtraIds: string[];
  onToggleExtra: (extraId: string) => void;
}) {
  if (categories.length === 0) {
    return (
      <div className="rounded-none border border-slate-100 bg-white px-4 py-6 text-center text-sm text-slate-500 shadow-sm">
        No hay servicios disponibles.
      </div>
    );
  }

  return (
    <>
    <style>{`
      @keyframes orbyxCatalogOpen { from { opacity: 0; transform: translateY(-4px); } to { opacity: 1; transform: none; } }
      .orbyx-catalog-open { animation: orbyxCatalogOpen 0.18s ease-out; }
      @media (prefers-reduced-motion: reduce) { .orbyx-catalog-open { animation: none; } }
    `}</style>
    <div className="space-y-3">
      {categories.map((category) => {
        const open = !collapsedKeys.has(category.key);

        return (
          <div
            key={category.key}
            data-catalog-category={category.key}
            className="scroll-mt-3 overflow-hidden rounded-none border border-slate-100 shadow-[0_16px_45px_-34px_rgba(15,23,42,0.2)]"
          >
            <button
              type="button"
              aria-expanded={open}
              onClick={(event) => {
                const section = event.currentTarget.closest(
                  "[data-catalog-category]"
                ) as HTMLElement | null;
                onToggleCategory(category.key);
                // Al abrir una categoría las demás se cierran y la página se
                // acorta: si su encabezado queda arriba de la pantalla, se trae a la vista.
                if (section && !open) {
                  requestAnimationFrame(() => {
                    if (section.getBoundingClientRect().top < 0) {
                      section.scrollIntoView({ behavior: "smooth", block: "start" });
                    }
                  });
                }
              }}
              className="flex w-full items-center justify-between gap-2 border-b border-indigo-100 border-l-4 border-l-indigo-600 px-3 py-3.5 text-left transition hover:brightness-[0.98] md:px-5"
              style={{ background: CATEGORY_HEADER_GRADIENT }}
            >
              <span className="flex items-center gap-2 text-sm font-bold text-indigo-950 md:text-base">
                {category.name}
                <span className="rounded-full bg-indigo-600/10 px-2 py-0.5 text-xs font-semibold text-indigo-700">
                  {category.totalCount}
                </span>
              </span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className={`h-4 w-4 shrink-0 text-indigo-600 transition-transform ${
                  open ? "rotate-180" : ""
                }`}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 9l6 6 6-6" />
              </svg>
            </button>

            {open ? (
              <div className="orbyx-catalog-open divide-y divide-slate-100 bg-white">
                {category.services.length === 0 ? (
                  <p className="px-4 py-6 text-center text-sm text-slate-500 md:px-5">
                    No encontramos servicios con ese nombre.
                  </p>
                ) : (
                  category.services.map((service) => {
                    const isSelected = selectedServiceId === service.id;

                    return (
                      <div key={service.id}>
                      <button
                        type="button"
                        onClick={() => onSelect(service)}
                        className={`flex w-full items-center justify-between gap-2 border-l-4 px-3 py-3.5 text-left transition sm:gap-3 md:px-5 ${
                          isSelected
                            ? "border-indigo-600 bg-indigo-50 shadow-[inset_0_0_0_1px_rgb(var(--pt-glow-rgb,79_70_229)/0.35)]"
                            : "border-transparent hover:border-slate-300 hover:bg-slate-50"
                        }`}
                      >
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-slate-900 md:text-base">
                            {service.name}
                          </p>
                          {service.description?.trim() ? (
                            <p className="mt-0.5 truncate text-xs text-slate-500 md:text-sm">
                              {service.description.trim()}
                            </p>
                          ) : null}
                        </div>

                        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2.5 md:gap-3">
                          <span className="whitespace-nowrap text-sm font-semibold text-slate-700">
                            {formatPrice(service.price)}
                          </span>
                          {service.duration_minutes ? (
                            <span className="whitespace-nowrap rounded-full bg-white px-2 py-1 text-[11px] font-medium text-slate-500 shadow-sm">
                              {service.duration_minutes} min
                            </span>
                          ) : null}
                          <span
                            className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${
                              isSelected
                                ? "border-indigo-600 bg-indigo-600"
                                : "border-slate-300 bg-white"
                            }`}
                          >
                            {isSelected ? (
                              <span className="h-2 w-2 rounded-full bg-white" />
                            ) : null}
                          </span>
                        </div>
                      </button>
                      {isSelected ? (
                        <ServiceExtrasChooser
                          service={service}
                          selectedExtraIds={selectedExtraIds}
                          onToggleExtra={onToggleExtra}
                        />
                      ) : null}
                      </div>
                    );
                  })
                )}
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
    </>
  );
}

type WeeklyHoursRow = {
  day: number;
  label: string;
  enabled: boolean;
  start_time: string | null;
  end_time: string | null;
};

// Horario en un cuadro aparte (portal sobre la página). Se cierra con la X,
// tocando fuera del cuadro o con Escape.
function HoursDialog({
  weeklyHours,
  onClose,
}: {
  weeklyHours: WeeklyHoursRow[];
  onClose: () => void;
}) {
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  if (typeof document === "undefined") return null;
  const todayDay = new Date().getDay();

  return createPortal(
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/40 px-4"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="orbyx-hours-title"
        className="w-full max-w-xs rounded-xl border border-slate-200 bg-white p-4 shadow-[0_30px_80px_-30px_rgba(15,23,42,0.6)]"
      >
        <div className="mb-2 flex items-center justify-between gap-3">
          <p id="orbyx-hours-title" className="flex items-center gap-2 text-sm font-bold text-slate-950">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4 text-indigo-600" aria-hidden="true">
              <circle cx="12" cy="12" r="9" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 7v5l3 3" />
            </svg>
            Horario de atención
          </p>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar horario"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>

        <div className="divide-y divide-slate-100">
          {weeklyHours.map((row) => {
            const isToday = row.day === todayDay;
            return (
              <div
                key={row.day}
                className={`flex items-center justify-between gap-3 py-2 text-sm ${
                  isToday ? "font-semibold text-indigo-700" : "text-slate-600"
                }`}
              >
                <span>
                  {row.label}
                  {isToday ? <span className="ml-1.5 text-[11px] font-medium text-indigo-500">(hoy)</span> : null}
                </span>
                <span className={row.enabled ? (isToday ? "" : "font-medium text-slate-800") : "text-slate-400"}>
                  {row.enabled
                    ? `${formatHourLabel(row.start_time)} a ${formatHourLabel(row.end_time)} hrs`
                    : "Cerrado"}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>,
    document.body
  );
}

type BusinessContactProps = {
  mapsEmbedUrl: string;
  mapsLinkUrl: string;
  address?: string | null;
  phone?: string | null;
  whatsappNumber: string;
  weeklyHours: WeeklyHoursRow[];
  instagramUrl?: string | null;
  facebookUrl?: string | null;
};

function hasBusinessContact(contact: BusinessContactProps) {
  return Boolean(
    contact.mapsEmbedUrl ||
      contact.address ||
      contact.phone ||
      contact.whatsappNumber ||
      contact.weeklyHours.some((row) => row.enabled)
  );
}

// Mapa + dirección, teléfono, WhatsApp y horario. Va dentro de la tarjeta
// del negocio (columna derecha en pantallas anchas, debajo en el celular).
function BusinessLocationPanel({
  mapsEmbedUrl,
  mapsLinkUrl,
  address,
  phone,
  whatsappNumber,
  weeklyHours,
}: BusinessContactProps) {
  const [hoursOpen, setHoursOpen] = useState(false);
  const hasHours = weeklyHours.some((row) => row.enabled);
  const rowClass = "flex items-start gap-2 py-1.5 text-xs text-slate-700 sm:gap-2.5 sm:py-2.5 sm:text-sm";
  const iconClass = "mt-px h-3.5 w-3.5 shrink-0 text-slate-500 sm:mt-0.5 sm:h-4 sm:w-4";

  return (
    <div className="min-w-0">
      {mapsEmbedUrl ? (
        <div className="mb-1 h-[84px] overflow-hidden rounded-lg border border-slate-200 sm:h-[130px]">
          <iframe
            src={mapsEmbedUrl}
            title="Ubicación"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            className="block h-full w-full border-0"
          />
        </div>
      ) : null}

      <div className="divide-y divide-slate-100">
        {address ? (
          <a
            href={mapsLinkUrl || undefined}
            target={mapsLinkUrl ? "_blank" : undefined}
            rel={mapsLinkUrl ? "noreferrer" : undefined}
            className={`${rowClass} transition hover:text-indigo-700`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={iconClass} aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 21s7-4.35 7-11a7 7 0 10-14 0c0 6.65 7 11 7 11z" />
              <circle cx="12" cy="10" r="2.5" />
            </svg>
            <span className="min-w-0 break-words">{address}</span>
          </a>
        ) : null}

        {phone ? (
          <a href={`tel:${phone.replace(/\s+/g, "")}`} className={`${rowClass} transition hover:text-indigo-700`}>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={iconClass} aria-hidden="true">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M22 16.92v3a2 2 0 01-2.18 2 19.8 19.8 0 01-8.63-3.07 19.5 19.5 0 01-6-6A19.8 19.8 0 012.12 4.2 2 2 0 014.11 2h3a2 2 0 012 1.72c.12.9.32 1.77.59 2.61a2 2 0 01-.45 2.11L8 9.69a16 16 0 006.31 6.31l1.25-1.25a2 2 0 012.11-.45c.84.27 1.71.47 2.61.59A2 2 0 0122 16.92z"
              />
            </svg>
            <span className="min-w-0 break-words">{phone}</span>
          </a>
        ) : null}

        {whatsappNumber ? (
          <a
            href={`https://wa.me/${whatsappNumber}`}
            target="_blank"
            rel="noreferrer"
            className="flex items-start gap-2 py-1.5 text-xs font-semibold text-emerald-600 transition hover:text-emerald-700 sm:gap-2.5 sm:py-2.5 sm:text-sm"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="mt-px h-3.5 w-3.5 shrink-0 sm:mt-0.5 sm:h-4 sm:w-4" aria-hidden="true">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.966-.273-.099-.471-.148-.67.15-.198.297-.768.966-.94 1.164-.173.198-.347.223-.644.074-.297-.149-1.255-.463-2.39-1.475-.883-.787-1.48-1.759-1.653-2.056-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.5-.669-.51l-.57-.01c-.198 0-.52.074-.793.372-.273.297-1.04 1.016-1.04 2.479s1.065 2.875 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.71.306 1.263.489 1.694.625.712.227 1.36.195 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.174-1.413-.075-.124-.273-.198-.57-.347z" />
              <path d="M20.52 3.449A11.94 11.94 0 0 0 12.043 0C5.495 0 .161 5.334.161 11.882c0 2.094.547 4.139 1.587 5.945L0 24l6.356-1.667a11.86 11.86 0 0 0 5.687 1.448h.005c6.548 0 11.882-5.334 11.882-11.882a11.8 11.8 0 0 0-3.41-8.45zm-8.477 18.32h-.004a9.86 9.86 0 0 1-5.026-1.378l-.361-.214-3.772.99 1.007-3.676-.235-.377a9.86 9.86 0 0 1-1.52-5.232c.003-5.44 4.43-9.867 9.875-9.867 2.637 0 5.114 1.027 6.978 2.893a9.82 9.82 0 0 1 2.889 6.983c-.003 5.443-4.43 9.878-9.87 9.878z" />
            </svg>
            <span className="sm:hidden">WhatsApp</span>
            <span className="hidden sm:inline">¡Contáctame por WhatsApp!</span>
          </a>
        ) : null}

        {hasHours ? (
          <button
            type="button"
            onClick={() => setHoursOpen(true)}
            aria-haspopup="dialog"
            className="flex w-full items-center gap-2 py-1.5 text-left text-xs font-semibold text-slate-800 transition hover:text-indigo-700 sm:gap-2.5 sm:py-2.5 sm:text-sm"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-3.5 w-3.5 shrink-0 text-slate-500 sm:h-4 sm:w-4" aria-hidden="true">
              <circle cx="12" cy="12" r="9" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 7v5l3 3" />
            </svg>
            Ver horario
          </button>
        ) : null}

      </div>

      {hoursOpen ? <HoursDialog weeklyHours={weeklyHours} onClose={() => setHoursOpen(false)} /> : null}
    </div>
  );
}

// Foto grande de un profesional (portal). Se cierra con la X, tocando fuera o con Escape.
function StaffPhotoDialog({ member, onClose }: { member: StaffItem; onClose: () => void }) {
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  if (typeof document === "undefined") return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/60 px-4"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={member.name}
        className="relative w-full max-w-sm overflow-hidden rounded-xl bg-white shadow-[0_30px_80px_-30px_rgba(15,23,42,0.7)]"
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Cerrar foto"
          className="absolute right-2 top-2 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-slate-700 shadow-md transition hover:bg-white hover:text-slate-950"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>
        <div className="aspect-square w-full bg-slate-100">
          {member.photo_url ? (
            <img src={member.photo_url} alt={member.name} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-7xl font-semibold text-slate-300">
              {getStaffInitial(member.name)}
            </div>
          )}
        </div>
        <div className="px-5 py-4">
          <p className="text-lg font-bold text-slate-950">{member.name}</p>
          <p className="mt-0.5 text-sm font-medium text-indigo-600">{member.role?.trim() || "Profesional"}</p>
        </div>
      </div>
    </div>,
    document.body
  );
}

// Fila horizontal del equipo (catálogo). Tocar una foto la abre en grande.
function TeamStrip({ staff, size }: { staff: StaffItem[]; size: "sm" | "lg" }) {
  const [openMember, setOpenMember] = useState<StaffItem | null>(null);
  const large = size === "lg";

  return (
    <>
      <div
        className={`overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden ${
          large ? "-mx-4 px-4" : "-mx-3 px-3"
        }`}
      >
        <div className={`flex ${large ? "gap-4 pb-1" : "gap-3"}`}>
          {staff.map((member) => (
            <button
              key={member.id}
              type="button"
              onClick={() => setOpenMember(member)}
              aria-label={`Ver foto de ${member.name}`}
              className={`group flex shrink-0 flex-col items-center text-center ${large ? "w-24" : "w-16"}`}
            >
              <span
                className={`flex items-center justify-center overflow-hidden rounded-lg border border-slate-200 bg-slate-100 transition group-hover:border-indigo-300 group-hover:shadow-md ${
                  large ? "h-20 w-20" : "h-14 w-14"
                }`}
              >
                {member.photo_url ? (
                  <img src={member.photo_url} alt={member.name} className="h-full w-full object-cover" />
                ) : (
                  <span className={`font-semibold text-slate-600 ${large ? "text-xl" : "text-base"}`}>
                    {getStaffInitial(member.name)}
                  </span>
                )}
              </span>
              <span
                className={`mt-1 w-full truncate font-semibold text-slate-900 ${large ? "text-xs" : "text-[11px]"}`}
              >
                {member.name}
              </span>
              {member.role?.trim() ? (
                <span className={`w-full truncate text-slate-500 ${large ? "text-[11px]" : "text-[10px]"}`}>
                  {member.role.trim()}
                </span>
              ) : null}
            </button>
          ))}
        </div>
      </div>
      {openMember ? <StaffPhotoDialog member={openMember} onClose={() => setOpenMember(null)} /> : null}
    </>
  );
}

// Título numerado de cada paso de la reserva (semana, profesional, día y hora).
function BookingStepHeader({
  step,
  title,
  hint,
}: {
  step: number;
  title: string;
  hint?: string;
}) {
  return (
    <div className="mb-2.5 flex items-center gap-2">
      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-xs font-bold text-white">
        {step}
      </span>
      <p className="text-sm font-semibold text-slate-900">
        {title}
        {hint ? <span className="ml-1 font-normal text-slate-500">{hint}</span> : null}
      </p>
    </div>
  );
}

// Carrusel horizontal de profesionales (estilo "stories"), justo arriba de los
// días. Primer ítem "Cualquiera". Solo hace scroll dentro del carrusel.
function StaffCarousel({
  staff,
  selectedStaffId,
  onSelect,
  loading,
}: {
  staff: StaffItem[];
  selectedStaffId: string;
  onSelect: (staffId: string) => void;
  loading: boolean;
}) {
  const ring = (selected: boolean) =>
    selected
      ? "ring-2 ring-indigo-600 ring-offset-2 ring-offset-white"
      : "ring-1 ring-slate-200 group-hover:ring-indigo-300";

  return (
    <div>
      <div
        className="-mx-3 overflow-x-auto px-3 [scrollbar-width:none] md:-mx-4 md:px-4 [&::-webkit-scrollbar]:hidden"
        role="radiogroup"
        aria-label="Elige un profesional"
      >
        <div className="flex snap-x snap-mandatory gap-3 pb-1 pt-1">
          <button
            type="button"
            role="radio"
            aria-checked={selectedStaffId === ""}
            onClick={() => onSelect("")}
            className="group flex w-[72px] shrink-0 snap-start flex-col items-center text-center md:w-20"
          >
            <span
              className={`flex h-14 w-14 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 transition md:h-16 md:w-16 ${ring(
                selectedStaffId === ""
              )}`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-6 w-6" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 20v-1a4 4 0 00-4-4H7a4 4 0 00-4 4v1M10 11a4 4 0 100-8 4 4 0 000 8zM21 20v-1a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
              </svg>
            </span>
            <span className="mt-1.5 w-full truncate text-xs font-semibold text-slate-900">Cualquiera</span>
            <span className="w-full truncate text-[11px] text-slate-500">Primero libre</span>
          </button>

          {loading && staff.length === 0
            ? [0, 1, 2].map((n) => (
                <div key={n} className="flex w-[72px] shrink-0 flex-col items-center md:w-20" aria-hidden="true">
                  <span className="h-14 w-14 animate-pulse rounded-lg bg-slate-200 md:h-16 md:w-16" />
                  <span className="mt-2 h-2.5 w-12 animate-pulse rounded bg-slate-200" />
                </div>
              ))
            : staff.map((member) => {
                const selected = selectedStaffId === member.id;
                return (
                  <button
                    key={member.id}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    onClick={() => onSelect(member.id)}
                    className="group flex w-[72px] shrink-0 snap-start flex-col items-center text-center md:w-20"
                  >
                    <span
                      className={`flex h-14 w-14 items-center justify-center overflow-hidden rounded-lg bg-slate-100 transition md:h-16 md:w-16 ${ring(
                        selected
                      )}`}
                    >
                      {member.photo_url ? (
                        <img src={member.photo_url} alt={member.name} className="h-full w-full object-cover" />
                      ) : (
                        <span className="text-lg font-semibold text-slate-600">{getStaffInitial(member.name)}</span>
                      )}
                    </span>
                    <span
                      className={`mt-1.5 w-full truncate text-xs font-semibold ${
                        selected ? "text-indigo-700" : "text-slate-900"
                      }`}
                    >
                      {member.name}
                    </span>
                    <span className="w-full truncate text-[11px] text-slate-500">
                      {member.role?.trim() || "Profesional"}
                    </span>
                  </button>
                );
              })}
        </div>
      </div>
    </div>
  );
}

function PublicPageSkeleton() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[color:var(--pt-bg-from,#FBFAFF)] to-[color:var(--pt-bg-to,#F1EFFC)]" aria-busy="true">
      <div className="mx-auto w-full max-w-[1280px] px-3 py-4 sm:px-4 md:px-6 md:py-8 xl:px-8">
        <div className="grid animate-pulse gap-4 lg:grid-cols-[1fr_290px] lg:items-start lg:gap-6 xl:grid-cols-[1fr_300px]">
          <div className="min-w-0 space-y-4 md:space-y-6">
            <div className="overflow-hidden border border-slate-200 bg-white">
              <div className="aspect-[3/1] w-full bg-slate-200" />
              <div className="flex flex-col items-center px-4 pb-6 md:px-7">
                <div className="-mt-10 h-20 w-20 rounded-2xl border-4 border-white bg-slate-300 md:-mt-14 md:h-28 md:w-28" />
                <div className="mt-4 h-6 w-48 rounded bg-slate-200" />
                <div className="mt-3 h-4 w-64 max-w-full rounded bg-slate-100" />
              </div>
            </div>
            <div className="grid gap-4 lg:grid-cols-[230px_1fr] lg:gap-5">
              <div className="hidden space-y-3 lg:block">
                <div className="h-10 bg-slate-200" />
                <div className="h-8 bg-slate-100" />
                <div className="h-8 bg-slate-100" />
              </div>
              <div className="space-y-3">
                <div className="h-12 bg-slate-200" />
                <div className="h-20 border border-slate-200 bg-white" />
                <div className="h-20 border border-slate-200 bg-white" />
                <div className="h-20 border border-slate-200 bg-white" />
              </div>
            </div>
          </div>
          <div className="hidden h-64 border border-slate-200 bg-white lg:block" />
        </div>
      </div>
    </div>
  );
}

function OrbyxPromoFooter() {
  return (
    <div className="mt-6 flex flex-col items-center gap-2.5 rounded-none bg-[color:var(--pt-footer-bg,#F0EEFC)] px-5 py-4 text-center shadow-sm sm:flex-row sm:justify-center sm:text-left md:mt-10">
      <img src="/orbyx-mark.png" alt="Orbyx" className="h-6 w-6 shrink-0" />
      <p className="text-xs text-slate-600 sm:text-sm">
        Gestiona tu negocio y reservas con{" "}
        <a
          href="https://orbyx.cl"
          target="_blank"
          rel="noreferrer"
          className="font-semibold text-indigo-600 hover:underline"
        >
          Orbyx.cl →
        </a>
      </p>
    </div>
  );
}

// useLayoutEffect en el navegador (aplica la plantilla antes del primer pintado);
// useEffect en el servidor para no emitir el aviso de SSR.
const useIsomorphicLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;

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

  // Plantilla visual (lib/public-templates.ts). Prioridad: ?template=xxx (solo
  // para mirar, no guarda nada) > la del negocio > la última vista en este
  // navegador (evita el destello "clásica -> plantilla" mientras carga) >
  // "clasica". Se aplica sobre <html>, así también la toman los portales.
  const [previewTemplateId, setPreviewTemplateId] = useState<string | null>(null);
  const [cachedTemplateId, setCachedTemplateId] = useState<string | null>(null);
  // ?embed=1: la página está dentro de la vista previa de "Mi Negocio → Diseño".
  const [isEmbeddedPreview, setIsEmbeddedPreview] = useState(false);
  const templateStorageKey = slug ? `orbyx_public_template_${slug}` : "";
  const loadedTemplateId = business
    ? business.public_template || "clasica"
    : null;
  const templateId = previewTemplateId ?? loadedTemplateId ?? cachedTemplateId ?? "clasica";
  const activeTemplate = getPublicTemplate(templateId);

  useIsomorphicLayoutEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const requested = params.get("template");
      setPreviewTemplateId(isKnownPublicTemplate(requested) ? requested : null);
      setIsEmbeddedPreview(params.get("embed") === "1" && window.parent !== window);
      const cached = templateStorageKey ? window.localStorage.getItem(templateStorageKey) : null;
      setCachedTemplateId(isKnownPublicTemplate(cached) ? cached : null);
    } catch {
      // sin acceso a la URL/localStorage: queda la plantilla del negocio
    }
  }, [templateStorageKey]);

  useIsomorphicLayoutEffect(() => applyPublicTemplate(activeTemplate.id), [activeTemplate.id]);

  // Vista previa en vivo desde el dashboard: el selector de diseños (mismo
  // origen) manda la plantilla a mostrar sin recargar la página. Solo cambia
  // lo que se ve aquí; no guarda nada.
  useEffect(() => {
    if (!isEmbeddedPreview) return;
    function onMessage(event: MessageEvent) {
      if (event.origin !== window.location.origin) return;
      const data = event.data as { type?: string; template?: unknown } | null;
      if (data?.type !== "orbyx-template-preview") return;
      if (isKnownPublicTemplate(data.template)) setPreviewTemplateId(data.template);
    }
    window.addEventListener("message", onMessage);
    try {
      window.parent.postMessage({ type: "orbyx-template-preview-ready" }, window.location.origin);
    } catch {
      // sin acceso al padre: queda la plantilla de la URL
    }
    return () => window.removeEventListener("message", onMessage);
  }, [isEmbeddedPreview]);

  useEffect(() => {
    if (!loadedTemplateId || !templateStorageKey) return;
    try {
      window.localStorage.setItem(templateStorageKey, loadedTemplateId);
    } catch {
      // navegador sin localStorage: solo se pierde el cache anti-destello
    }
  }, [loadedTemplateId, templateStorageKey]);
  const [reviewSummary, setReviewSummary] = useState<ReviewsSummary | null>(null);
  const [showReviewsModal, setShowReviewsModal] = useState(false);
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
  const [serviceGroups, setServiceGroups] = useState<ServiceGroupItem[]>([]);
  const [businessHours, setBusinessHours] = useState<BusinessHourDay[]>([]);
  // Extras elegidos para el servicio seleccionado (se reinician al cambiar de servicio).
  const [selectedExtraIds, setSelectedExtraIds] = useState<string[]>([]);
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
  // Todos los profesionales activos de la sucursal (de GET /public/services).
  const [allStaff, setAllStaff] = useState<StaffItem[]>([]);
  const [viewStep, setViewStep] = useState<"catalog" | "booking">("catalog");
  const [catalogSearchQuery, setCatalogSearchQuery] = useState("");
  const [activeCategoryKey, setActiveCategoryKey] = useState("todos");
  // Acordeón del catálogo (solo presentación). null = vista inicial: con más de
  // COMPACT_CATALOG_MIN_SERVICES servicios solo la primera categoría abierta,
  // si no todas abiertas. `sig` es la firma de las categorías: si cambian (otra
  // sucursal) se vuelve a la vista inicial sin necesidad de un efecto.
  const [collapsedCatalogSections, setCollapsedCatalogSections] = useState<{
    sig: string;
    keys: Set<string>;
  } | null>(null);
  // Cambios manuales del acordeón durante una búsqueda; valen solo para ese texto.
  const [searchToggledSections, setSearchToggledSections] = useState<{
    term: string;
    keys: Set<string>;
  }>({ term: "", keys: new Set() });
  const [weekSlots, setWeekSlots] = useState<Record<string, SlotItem[]>>({});
  // Horarios ya tomados de cada día (`occupied_slots` de /public/slots). Solo se
  // muestran, tachados; es opcional: si el servidor no los informa queda vacío
  // y el calendario se ve como siempre (solo horarios libres).
  const [weekOccupiedSlots, setWeekOccupiedSlots] = useState<Record<string, SlotItem[]>>({});
const [nextAvailableSlots, setNextAvailableSlots] = useState<SlotItem[]>([]);
const [loadingNextSlots, setLoadingNextSlots] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<SlotItem | null>(null);

  const [bookingFields, setBookingFields] = useState<BookingField[]>([]);
  const [phoneIso2, setPhoneIso2] = useState("CL");
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
  // true cuando el backend indica que el negocio no acepta reservas
  // públicas (pausado, o bloqueado por falta de pago hace más de 7 días).
  const [bookingClosed, setBookingClosed] = useState(false);
  // "Modo caído": el backend no respondió o dio 5xx al cargar la página.
  const [serviceDown, setServiceDown] = useState(false);
  const [downContact, setDownContact] = useState<{
    name: string;
    phone: string;
    whatsapp: string;
  } | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [loadingServices, setLoadingServices] = useState(false);
  const [loadingStaff, setLoadingStaff] = useState(false);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Turnstile (captcha) del paso final. El token es de un solo uso: se pide
  // uno nuevo cada vez que se envía la reserva (ver handleSubmitBooking).
  const [captchaToken, setCaptchaToken] = useState("");
  const [captchaWidgetFailed, setCaptchaWidgetFailed] = useState(false);
  const turnstileRef = useRef<any>(null);
  const turnstileSiteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || "";

  const [submitError, setSubmitError] = useState("");
  const [bookingSuccess, setBookingSuccess] =
    useState<BookingSuccessData | null>(null);

  const [depositReceiptFile, setDepositReceiptFile] = useState<File | null>(null);
  // Paso intermedio: la reserva ya existe (hora bloqueada) pero el cliente
  // todavía no sube el comprobante — se muestra la ficha bancaria + el
  // cronómetro real acá, antes de que haya algo que hacer, no después.
  const [depositAwaitingUpload, setDepositAwaitingUpload] =
    useState<DepositPendingData | null>(null);
  // Paso final: comprobante ya subido, esperando que el tenant lo revise.
  // Una vez acá ya no hay ningún plazo real corriendo contra el cliente
  // (ver fix de releaseExpiredDeposits en server.js), así que esta pantalla
  // no muestra cronómetro.
  const [depositPending, setDepositPending] = useState<DepositPendingData | null>(null);
  const [depositUploading, setDepositUploading] = useState(false);
  const [depositUploaded, setDepositUploaded] = useState(false);
  const [depositUploadError, setDepositUploadError] = useState("");
  const [depositRemainingSeconds, setDepositRemainingSeconds] = useState(0);

  // Cronómetro informativo — la ventana de 10 min la libera de verdad el
  // cron del backend (POST /appointments/maintenance/release-expired-deposits),
  // esto solo le muestra al cliente cuánto tiempo le queda para transferir y
  // subir el comprobante. Corre solo mientras el comprobante no se ha
  // subido — una vez subido (depositPending) ya no hay plazo real corriendo.
  useEffect(() => {
    if (!depositAwaitingUpload) return;
    const expiresAt = new Date(depositAwaitingUpload.holdExpiresAt).getTime();

    function tick() {
      setDepositRemainingSeconds(Math.max(0, Math.floor((expiresAt - Date.now()) / 1000)));
    }

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [depositAwaitingUpload]);

  const formRef = useRef<HTMLDivElement | null>(null);

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

  const visibleBookingFields = bookingFields.filter(
    (field) => field.enabled && !lockedBookingFieldKeys.has(field.key)
  );
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

  // full_address ya trae "calle, comuna, región" con la herencia resuelta;
  // el resto es solo respaldo para respuestas viejas sin ese campo.
  const visibleAddress =
    selectedBranch?.full_address ||
    business?.full_address ||
    selectedBranch?.address ||
    business?.address ||
    null;
  const visiblePhone = selectedBranch?.phone || business?.phone || null;
  const mapsEmbedUrl = buildMapsEmbedUrl(
    visibleAddress,
    selectedBranch?.latitude ?? null,
    selectedBranch?.longitude ?? null
  );
  const mapsLinkUrl = buildMapsUrl(visibleAddress || undefined);
  const visibleWhatsappNumber = normalizeWhatsappNumber(
    business?.whatsapp || selectedBranch?.whatsapp || visiblePhone
  );

  const catalogCategories = useMemo(() => {
    const term = catalogSearchQuery.trim().toLowerCase();
    const matchesSearch = (service: ServiceItem) => {
      if (!term) return true;
      const haystack = `${service.name} ${service.description || ""}`.toLowerCase();
      return haystack.includes(term);
    };

    const sortedGroups = [...serviceGroups].sort(
      (a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0)
    );

    const categories = sortedGroups.map((group) => {
      const groupServices = services.filter((s) => s.group_id === group.id);
      return {
        key: group.id,
        name: group.name,
        totalCount: groupServices.length,
        services: groupServices.filter(matchesSearch),
      };
    });

    const ungroupedServices = services.filter((s) => !s.group_id);
    if (ungroupedServices.length > 0) {
      categories.push({
        key: UNGROUPED_CATEGORY_KEY,
        name: "Servicios generales",
        totalCount: ungroupedServices.length,
        services: ungroupedServices.filter(matchesSearch),
      });
    }

    if (categories.length === 0 && services.length > 0) {
      categories.push({
        key: UNGROUPED_CATEGORY_KEY,
        name: "Servicios",
        totalCount: services.length,
        services: services.filter(matchesSearch),
      });
    }

    return categories;
  }, [services, serviceGroups, catalogSearchQuery]);

  // --- Presentación del acordeón (solo UI: no cambia consultas, filtros ni datos) ---
  const catalogSearchTerm = catalogSearchQuery.trim().toLowerCase();
  const isCompactCatalog = services.length > COMPACT_CATALOG_MIN_SERVICES;
  const catalogSignature = catalogCategories.map((category) => category.key).join("|");

  // Categorías contraídas. Con búsqueda: abiertas las que tienen resultados y
  // cerradas las que no (más lo que el usuario cambie para ese texto). Sin
  // búsqueda: lo que el usuario dejó, o la vista inicial.
  const catalogCollapsedKeys = useMemo(() => {
    if (catalogSearchTerm) {
      const next = new Set(
        catalogCategories.filter((c) => c.services.length === 0).map((c) => c.key)
      );
      if (searchToggledSections.term === catalogSearchTerm) {
        searchToggledSections.keys.forEach((key) => {
          if (next.has(key)) next.delete(key);
          else next.add(key);
        });
      }
      return next;
    }
    if (collapsedCatalogSections && collapsedCatalogSections.sig === catalogSignature) {
      return collapsedCatalogSections.keys;
    }
    if (!isCompactCatalog) return new Set<string>();
    const firstOpenKey = catalogCategories.find((c) => c.totalCount > 0)?.key;
    return new Set(
      catalogCategories.filter((c) => c.key !== firstOpenKey).map((c) => c.key)
    );
  }, [
    catalogCategories,
    catalogSearchTerm,
    catalogSignature,
    collapsedCatalogSections,
    isCompactCatalog,
    searchToggledSections,
  ]);

  function toggleCatalogCategory(key: string) {
    if (catalogSearchTerm) {
      setSearchToggledSections((prev) => {
        const keys = new Set<string>(prev.term === catalogSearchTerm ? prev.keys : []);
        if (keys.has(key)) keys.delete(key);
        else keys.add(key);
        return { term: catalogSearchTerm, keys };
      });
      return;
    }

    const next = new Set(catalogCollapsedKeys);
    if (!next.has(key)) {
      next.add(key); // contraer
    } else {
      if (isCompactCatalog) {
        // Acordeón: al abrir una categoría se cierran las demás.
        catalogCategories.forEach((category) => next.add(category.key));
      }
      next.delete(key);
    }
    setCollapsedCatalogSections({ sig: catalogSignature, keys: next });
  }

  // Menú lateral: elegir una categoría muestra directamente sus servicios
  // (la abre); "Todos" vuelve a la vista inicial del catálogo.
  function selectCatalogCategory(key: string) {
    setActiveCategoryKey(key);
    if (key === "todos") {
      if (isCompactCatalog) setCollapsedCatalogSections(null);
      return;
    }
    if (catalogCollapsedKeys.has(key)) toggleCatalogCategory(key);
  }

  const visibleCatalogCategories =
    activeCategoryKey === "todos"
      ? catalogCategories
      : catalogCategories.filter((category) => category.key === activeCategoryKey);

  const weeklyHoursOrdered = WEEKDAY_ORDER.map((day) => {
    const row = businessHours.find((h) => h.day_of_week === day);
    return {
      day,
      label: WEEKDAY_LABELS[day],
      enabled: Boolean(row?.enabled),
      start_time: row?.start_time || null,
      end_time: row?.end_time || null,
    };
  });
  const businessContact: BusinessContactProps = {
    mapsEmbedUrl,
    mapsLinkUrl,
    address: visibleAddress,
    phone: visiblePhone,
    whatsappNumber: visibleWhatsappNumber,
    weeklyHours: weeklyHoursOrdered,
    instagramUrl: business?.instagram_url,
    facebookUrl: business?.facebook_url,
  };
  const weekStartDate = weekDates[0];
  const weekEndDate = weekDates[weekDates.length - 1];
  const todayKey = formatDate(new Date());
  const mobileSelectedDate =
    weekDates.find((dateObj) => formatDate(dateObj) === mobileSelectedDateKey) ||
    weekDates[0];
  const mobileSelectedDateSlots = mobileSelectedDate
    ? weekSlots[formatDate(mobileSelectedDate)] || []
    : [];
  const mobileSelectedDateEntries = mergeDaySlots(
    mobileSelectedDateSlots,
    mobileSelectedDate ? weekOccupiedSlots[formatDate(mobileSelectedDate)] || [] : []
  );
  // Sin servicio: todos los profesionales activos. Con servicio: solo los que
  // lo realizan (staffOptions viene de /public/staff/:slug/:service_id).
  const panelStaff = selectedService ? staffOptions : allStaff;
  const filteredDrawerStaff = panelStaff.filter((staff) => {
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

  // Extras elegidos: solo los que siguen existiendo en el servicio actual.
  const selectedExtras: ServiceExtraOption[] = (selectedService?.extras || []).filter((extra) =>
    selectedExtraIds.includes(extra.id)
  );
  const extrasMinutes = selectedExtras.reduce((sum, e) => sum + Number(e.duration_minutes || 0), 0);
  const extrasPrice = selectedExtras.reduce((sum, e) => sum + Number(e.price || 0), 0);
  const bookingTotalMinutes = Number(selectedService?.duration_minutes || 0) + extrasMinutes;
  const bookingTotalPrice = Number(selectedService?.price || 0) + extrasPrice;
  // Clave estable para pedir horarios con los extras elegidos.
  const extraIdsKey = selectedExtras.map((e) => e.id).sort().join(",");
  const bookingServiceLabel = selectedService
    ? [selectedService.name, ...selectedExtras.map((e) => e.name)].join(" + ")
    : "";

  function toggleSelectedExtra(extraId: string) {
    setSelectedExtraIds((prev) =>
      prev.includes(extraId) ? prev.filter((id) => id !== extraId) : [...prev, extraId]
    );
    setSelectedSlot(null);
  }

  function resetAfterBranchChange() {
    setSelectedExtraIds([]);
    setSelectedService(null);
    setStaffOptions([]);
    setSelectedStaffId("");
    setSelectedSlot(null);
    setWeekSlots({});
    setWeekOccupiedSlots({});
    setSubmitError("");
    setBookingSuccess(null);
  }

  function resetAfterServiceChange() {
    setStaffOptions([]);
    setSelectedStaffId("");
    setSelectedSlot(null);
    setWeekSlots({});
    setWeekOccupiedSlots({});
    setSubmitError("");
    setBookingSuccess(null);
  }

  function selectCatalogService(service: ServiceItem) {
    if (selectedService?.id !== service.id) {
      setSelectedExtraIds([]);
    }
    // El profesional elegido se mantiene si también hace el nuevo servicio;
    // si no (o si no sabemos), vuelve a "Cualquiera".
    const serviceStaffIds = Array.isArray(service.staff_ids) ? service.staff_ids : null;
    const keepStaffId =
      selectedStaffId && serviceStaffIds?.includes(selectedStaffId) ? selectedStaffId : "";
    resetAfterServiceChange();
    if (serviceStaffIds) {
      // Lista inmediata mientras llega /public/staff (que la confirma).
      setStaffOptions(allStaff.filter((staff) => serviceStaffIds.includes(staff.id)));
    }
    setSelectedStaffId(keepStaffId);
    setSelectedService(service);
  }

  function selectStaff(staffId: string) {
    setSelectedStaffId(staffId);
    setSelectedSlot(null);
  }

  function handleBranchChange(nextBranchId: string) {
    resetAfterBranchChange();
    setSelectedBranchId(nextBranchId);
    setViewStep("catalog");
    setActiveCategoryKey("todos");
  }

  function goToBooking() {
    if (!selectedService) return;
    setViewStep("booking");
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  function backToCatalog() {
    setViewStep("catalog");
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
    if (!isValidPhoneForCountry(phoneIso2, customerData.phone || "")) {
      return "Debes ingresar un teléfono válido.";
    }
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
        setServiceDown(false);

        const res = await fetch(`/api/public-services/${slug}`, {
          cache: "no-store",
        });

        if (res.status >= 500) {
          throw new Error(`Backend no disponible (${res.status})`);
        }

        const data: PublicServicesResponse = await res.json();

        setBusiness(data.business || null);
        setBookingClosed(Boolean(data.booking_closed));
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
        setAllStaff(Array.isArray(data.staff) ? data.staff : []);
        setServiceGroups(
          Array.isArray(data.service_groups) ? data.service_groups : []
        );
        setBusinessHours(
          Array.isArray(data.business_hours) ? data.business_hours : []
        );

        setBookingFields(
          normalizeBookingFieldsConfig(data.business?.booking_fields_config)
        );
      } catch (error) {
        console.error("Error cargando página pública:", error);
        setServiceDown(true);
        // Datos de contacto desde una ruta que no depende del backend. Si
        // tampoco responde, igual se muestra el aviso con "Reintentar".
        try {
          const fbRes = await fetch(`/api/public-business-fallback/${slug}`, {
            signal: AbortSignal.timeout(6000),
          });
          if (fbRes.ok) {
            const fb = await fbRes.json();
            setDownContact({
              name: String(fb?.name || ""),
              phone: String(fb?.phone || ""),
              whatsapp: String(fb?.whatsapp || ""),
            });
          }
        } catch {
          // sin datos de contacto: solo mensaje + Reintentar
        }
        setBusiness(null);
        setCalendarId("");
        setBranches([]);
        setSelectedBranchId("");
        setServices([]);
        setServiceGroups([]);
        setBusinessHours([]);
      } finally {
        setLoadingPage(false);
      }
    }

    loadInitial();
  }, [slug, reloadKey]);

  useEffect(() => {
    if (!slug) return;

    async function loadReviewSummary() {
      try {
        const res = await fetch(`/api/public-reviews/${slug}`, {
          cache: "no-store",
        });
        const data: ReviewsSummary = await res.json();
        if (!res.ok) throw new Error();
        setReviewSummary(data);
      } catch {
        setReviewSummary(null);
      }
    }

    loadReviewSummary();
  }, [slug]);

  useEffect(() => {
    const normalizedPhone = normalizePhoneDigits(customerData.phone);
    // El backend solo busca coincidencia exacta de teléfono o correo: no se
    // consulta hasta que el dato esté completo/válido.
    const normalizedEmail = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(
      normalizeEmail(customerData.email)
    )
      ? normalizeEmail(customerData.email)
      : "";
    const phoneComplete = normalizedPhone.length >= 9;

    if (!phoneComplete && !normalizedEmail) {
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

        if (phoneComplete) {
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
        setAllStaff(Array.isArray(data.staff) ? data.staff : []);
        setServiceGroups(
          Array.isArray(data.service_groups) ? data.service_groups : []
        );
        setBusinessHours(
          Array.isArray(data.business_hours) ? data.business_hours : []
        );

        setSelectedService((prev) => {
          if (!prev) return null;
          return rows.find((service) => service.id === prev.id) || null;
        });
      } catch (error) {
        console.error("Error cargando servicios:", error);
        setServices([]);
        setServiceGroups([]);
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
      setWeekOccupiedSlots({});
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

            if (extraIdsKey) {
              query.set("extra_ids", extraIdsKey);
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

            const rawOccupied: SlotItem[] = Array.isArray(data.occupied_slots)
              ? data.occupied_slots
              : [];

            return {
              date,
              slots: dedupeSlots(rawSlots),
              occupied: dedupeSlots(rawOccupied),
            };
          })
        );

        const mapped: Record<string, SlotItem[]> = {};
        const mappedOccupied: Record<string, SlotItem[]> = {};
        results.forEach((item) => {
          mapped[item.date] = item.slots;
          mappedOccupied[item.date] = item.occupied;
        });

        setWeekSlots(mapped);
        setWeekOccupiedSlots(mappedOccupied);

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
        setWeekOccupiedSlots({});
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
      if (extraIdsKey) query.set("extra_ids", extraIdsKey);

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
    extraIdsKey,
  ]);


  async function uploadDepositReceipt(
    appointmentId: string,
    token: string,
    file: File
  ): Promise<boolean> {
    setDepositUploadError("");
    setDepositUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("tenant_id", business?.id || "");
      formData.append("appointment_id", appointmentId);

      const uploadRes = await fetch("/api/upload-deposit-receipt", {
        method: "POST",
        body: formData,
      });
      const uploadData = await uploadRes.json();
      if (!uploadRes.ok) {
        throw new Error(uploadData?.error || "No se pudo subir el comprobante.");
      }

      const attachRes = await fetch(
        `${BACKEND_URL}/appointments/${appointmentId}/deposit-receipt`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token, receipt_path: uploadData.path }),
        }
      );
      const attachData = await attachRes.json();
      if (!attachRes.ok) {
        throw new Error(attachData?.error || "No se pudo asociar el comprobante a tu reserva.");
      }

      setDepositUploaded(true);
      return true;
    } catch (error: unknown) {
      setDepositUploadError(
        error instanceof Error ? error.message : "No se pudo subir el comprobante."
      );
      return false;
    } finally {
      setDepositUploading(false);
    }
  }

  // Paso 2 del flujo de depósito: sube el comprobante contra la reserva ya
  // creada en el paso 1 y, solo si sale bien, pasa a la pantalla final de
  // "Pendiente de confirmación" (ver depositAwaitingUpload/depositPending).
  async function handleSubmitDepositReceipt() {
    if (!depositAwaitingUpload) return;

    if (!depositReceiptFile) {
      setDepositUploadError("Debes adjuntar tu comprobante de transferencia.");
      return;
    }

    const pending = depositAwaitingUpload;
    const ok = await uploadDepositReceipt(
      pending.appointmentId,
      pending.uploadToken,
      depositReceiptFile
    );

    if (ok) {
      setDepositPending(pending);
      setDepositAwaitingUpload(null);
    }
  }

  async function handleSubmitBooking() {
    // true una vez que el token de Turnstile viajó al servidor (ya no sirve).
    let captchaTokenSent = false;
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

      if (turnstileSiteKey && !captchaToken) {
        setSubmitError(
          captchaWidgetFailed
            ? "No pudimos verificar que no eres un robot. Desactiva el bloqueador de anuncios o intenta desde otro navegador."
            : "Espera unos segundos a que termine la verificación de seguridad e intenta de nuevo."
        );
        return;
      }

      setSubmitting(true);


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
        extra_ids: selectedExtras.map((e) => e.id),
        staff_id: selectedStaffId || selectedSlot?.staff_id || null,
        date: formatDate(new Date(selectedSlot.slot_start)),
        slot_start: selectedSlot.slot_start,
        captcha_token: captchaToken || null,
        customer_name: customerData.name.trim(),
        customer_phone: toE164(phoneIso2, customerData.phone.trim()),
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

      captchaTokenSent = true;
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
      const durationMinutes = bookingTotalMinutes;
      const endDate = new Date(
        startDate.getTime() + durationMinutes * 60 * 1000
      );

      if (data?.deposit_required) {
        setDepositUploaded(false);
        setDepositUploadError("");
        setDepositReceiptFile(null);
        setDepositAwaitingUpload({
          appointmentId: data.appointment.id,
          uploadToken: data.deposit_upload_token,
          holdExpiresAt: data.deposit_hold_expires_at,
          serviceName: bookingServiceLabel || selectedService.name,
          date: formatFullDate(selectedSlot.slot_start),
          time: formatHour(selectedSlot.slot_start),
        });
      } else {
        setBookingSuccess({
          serviceName: bookingServiceLabel || selectedService.name,
          date: formatFullDate(selectedSlot.slot_start),
          time: formatHour(selectedSlot.slot_start),
          branchName: selectedBranch?.name || undefined,
          branchAddress: visibleAddress || undefined,
          staffName: selectedStaff?.name || undefined,
          customerEmail: customerData.email.trim(),
          customerPhone: toE164(phoneIso2, customerData.phone.trim()),
          customerInstructions:
            String(selectedService.customer_instructions || "").trim() || undefined,
          startIso: startDate.toISOString(),
          endIso: endDate.toISOString(),
        });
      }

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
      setPhoneIso2("CL");

      setSelectedPetId("");
      setPets([]);
      setPetMode("new");
      setExistingCustomerFound(false);

      setSelectedPetId("");
      setPets([]);
    } catch (error: unknown) {
      setSubmitError(
        error instanceof Error ? error.message : "No se pudo crear la reserva."
      );
    } finally {
      // El token ya se gastó (con éxito o con error): si el cliente reintenta
      // necesita uno nuevo, así que se reinicia el widget.
      if (captchaTokenSent) {
        turnstileRef.current?.reset();
        setCaptchaToken("");
      }
      setSubmitting(false);
    }
  }

  if (serviceDown && !loadingPage) {
    const downName = downContact?.name?.trim() || "el negocio";
    const downWhatsapp = normalizeWhatsappNumber(
      downContact?.whatsapp || downContact?.phone
    );
    const downPhone = (downContact?.phone || "").trim();
    const downPhoneDigits = downPhone.replace(/[^\d+]/g, "");

    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-sky-50 px-3 py-4 sm:px-4 md:px-8 md:py-10">
        <div className="mx-auto flex min-h-[calc(100vh-2rem)] max-w-xl items-center justify-center md:min-h-[calc(100vh-5rem)]">
          <div className="w-full rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm md:p-10">
            <p className="text-base font-semibold text-slate-950 md:text-lg">
              Estamos con problemas técnicos en este momento.
            </p>
            {downContact ? (
              <p className="mt-3 text-sm leading-6 text-slate-600 md:text-base">
                Puedes contactar a <strong>{downName}</strong> directamente:
              </p>
            ) : (
              <p className="mt-3 text-sm leading-6 text-slate-600 md:text-base">
                Intenta de nuevo en unos minutos.
              </p>
            )}

            <div className="mt-6 flex flex-col items-stretch gap-3">
              {downWhatsapp ? (
                <a
                  href={`https://wa.me/${downWhatsapp}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex h-11 items-center justify-center rounded-xl bg-emerald-600 px-4 text-sm font-semibold text-white transition hover:bg-emerald-700"
                >
                  Escribir por WhatsApp
                </a>
              ) : null}
              {downPhone && downPhoneDigits ? (
                <a
                  href={`tel:${downPhoneDigits}`}
                  className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  Llamar al {downPhone}
                </a>
              ) : null}
              <button
                type="button"
                onClick={() => setReloadKey((k) => k + 1)}
                className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Reintentar
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (bookingClosed && !loadingPage) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-sky-50 px-3 py-4 sm:px-4 md:px-8 md:py-10">
        <div className="mx-auto flex min-h-[calc(100vh-2rem)] max-w-xl items-center justify-center md:min-h-[calc(100vh-5rem)]">
          <div className="w-full rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm md:p-10">
            {business?.logo_url ? (
              <img
                src={business.logo_url}
                alt={business.name || "Logo del negocio"}
                className="mx-auto h-20 w-20 rounded-2xl object-cover"
              />
            ) : null}
            {business?.name ? (
              <p className="mt-4 text-lg font-bold text-slate-950">{business.name}</p>
            ) : null}
            <p className="mt-3 text-sm leading-6 text-slate-600 md:text-base">
              Este negocio no está recibiendo reservas por ahora.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (depositAwaitingUpload) {
    const minutes = Math.floor(depositRemainingSeconds / 60);
    const seconds = depositRemainingSeconds % 60;
    const countdownLabel = `${minutes}:${String(seconds).padStart(2, "0")}`;
    const expired = depositRemainingSeconds <= 0;

    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-sky-50 px-3 py-4 sm:px-4 md:px-8 md:py-10">
        <div className="mx-auto flex min-h-[calc(100vh-2rem)] max-w-3xl items-center justify-center md:min-h-[calc(100vh-5rem)]">
          <div className="w-full overflow-hidden rounded-2xl border border-amber-200 bg-white shadow-[0_35px_90px_-45px_rgba(217,119,6,0.42)] md:rounded-[34px]">
            <div className="h-2 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-400" />

            <div className="p-4 md:p-10">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-amber-100 to-orange-100 text-3xl shadow-sm ring-8 ring-amber-50 md:h-24 md:w-24 md:text-5xl">
                ⏳
              </div>

              <div className="mt-6 text-center">
                <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-amber-600">
                  Reserva online
                </p>
                <h1 className="mt-3 text-2xl font-bold tracking-tight text-slate-950 md:text-4xl">
                  Un último paso: sube tu comprobante
                </h1>
                <p className="mx-auto mt-4 max-w-2xl text-sm leading-6 text-slate-600 md:text-base">
                  Reservamos tu hora para <strong>{depositAwaitingUpload.serviceName}</strong> el{" "}
                  {depositAwaitingUpload.date} a las {depositAwaitingUpload.time}. Transfiere el
                  depósito a la cuenta de abajo y sube tu comprobante antes de que se acabe el
                  tiempo.
                </p>
              </div>

              <div className="mt-6 rounded-2xl border border-amber-100 bg-amber-50/80 p-4 text-center md:mt-8 md:rounded-3xl md:p-6">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-700">
                  {expired ? "Tiempo agotado" : "Tiempo restante para subir tu comprobante"}
                </p>
                <p className="mt-2 text-4xl font-bold tabular-nums text-slate-950 md:text-5xl">
                  {expired ? "00:00" : countdownLabel}
                </p>
                <p className="mt-2 text-sm text-slate-600">
                  {expired
                    ? "El tiempo para subir tu comprobante se agotó y tu hora puede haberse liberado. Si ya transferiste, contacta al negocio directamente."
                    : "Es el tiempo que el negocio tiene reservado tu horario mientras transfieres y subes el comprobante."}
                </p>
              </div>

              <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50/70 p-4 md:rounded-3xl md:p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-700">
                  Datos para transferir
                </p>
                <p className="mt-2 text-sm text-slate-700">
                  {Number(selectedService?.deposit_amount) > 0 ? (
                    <>
                      Debes transferir{" "}
                      <strong>{formatPrice(selectedService?.deposit_amount)}</strong> para
                      reservar este servicio.
                    </>
                  ) : (
                    // Servicio marcado con requires_deposit pero sin deposit_amount
                    // (dato legado o el tenant lo dejó vacío) — no se oculta el
                    // depósito por completo, solo el mensaje genérico hasta que se
                    // complete (ver 2026-08-30-services-deposit-amount.sql).
                    <>Este negocio pide un depósito antes de confirmar tu hora en firme.</>
                  )}
                </p>

                <div className="mt-3 grid gap-1.5 rounded-2xl border border-amber-100 bg-white p-3 text-sm text-slate-700 sm:grid-cols-2">
                  {business?.deposit_bank_name ? (
                    <p>
                      <span className="font-semibold text-slate-950">Banco:</span>{" "}
                      {business.deposit_bank_name}
                    </p>
                  ) : null}
                  {business?.deposit_account_type ? (
                    <p>
                      <span className="font-semibold text-slate-950">Tipo de cuenta:</span>{" "}
                      {business.deposit_account_type}
                    </p>
                  ) : null}
                  {business?.deposit_account_number ? (
                    <p>
                      <span className="font-semibold text-slate-950">N° de cuenta:</span>{" "}
                      {business.deposit_account_number}
                    </p>
                  ) : null}
                  {business?.deposit_holder_rut ? (
                    <p>
                      <span className="font-semibold text-slate-950">RUT titular:</span>{" "}
                      {business.deposit_holder_rut}
                    </p>
                  ) : null}
                  {business?.deposit_holder_name ? (
                    <p className="sm:col-span-2">
                      <span className="font-semibold text-slate-950">Nombre titular:</span>{" "}
                      {business.deposit_holder_name}
                    </p>
                  ) : null}
                </div>

                <label className="mt-3 block text-xs font-semibold text-slate-700">
                  Comprobante de transferencia (JPG, PNG o PDF, máx. 5MB) *
                </label>
                <input
                  type="file"
                  accept="image/jpeg,image/png,application/pdf"
                  onChange={(e) => {
                    const file = e.target.files?.[0] || null;
                    setDepositUploadError("");
                    if (
                      file &&
                      !["image/jpeg", "image/png", "application/pdf"].includes(file.type)
                    ) {
                      setDepositUploadError("El comprobante debe ser JPG, PNG o PDF.");
                      setDepositReceiptFile(null);
                      e.target.value = "";
                      return;
                    }
                    if (file && file.size > 5 * 1024 * 1024) {
                      setDepositUploadError("El comprobante no puede superar los 5MB.");
                      setDepositReceiptFile(null);
                      e.target.value = "";
                      return;
                    }
                    setDepositReceiptFile(file);
                  }}
                  className="mt-1.5 block w-full text-sm text-slate-700 file:mr-3 file:rounded-none file:border-0 file:bg-slate-950 file:px-3.5 file:py-2 file:text-sm file:font-semibold file:text-white"
                />
                {depositReceiptFile ? (
                  <p className="mt-1.5 text-xs text-emerald-700">
                    Archivo seleccionado: {depositReceiptFile.name}
                  </p>
                ) : null}
                {depositUploadError ? (
                  <p className="mt-1.5 text-xs font-semibold text-rose-600">
                    {depositUploadError}
                  </p>
                ) : null}
              </div>

              <p className="mt-4 text-center text-xs text-slate-500">
                Te llegará una notificación cuando el negocio confirme tu depósito.
              </p>

              <div className="mt-4 flex justify-center">
                <button
                  type="button"
                  onClick={handleSubmitDepositReceipt}
                  disabled={depositUploading}
                  className="inline-flex h-12 items-center justify-center rounded-2xl bg-gradient-to-r from-slate-950 via-indigo-950 to-slate-900 px-6 text-sm font-semibold text-white transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {depositUploading ? "Subiendo..." : "Subir comprobante"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (depositPending) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-sky-50 px-3 py-4 sm:px-4 md:px-8 md:py-10">
        <div className="mx-auto flex min-h-[calc(100vh-2rem)] max-w-3xl items-center justify-center md:min-h-[calc(100vh-5rem)]">
          <div className="w-full overflow-hidden rounded-2xl border border-amber-200 bg-white shadow-[0_35px_90px_-45px_rgba(217,119,6,0.42)] md:rounded-[34px]">
            <div className="h-2 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-400" />

            <div className="p-4 md:p-10">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-amber-100 to-orange-100 text-3xl shadow-sm ring-8 ring-amber-50 md:h-24 md:w-24 md:text-5xl">
                ⏳
              </div>

              <div className="mt-6 text-center">
                <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-amber-600">
                  Reserva online
                </p>
                <h1 className="mt-3 text-2xl font-bold tracking-tight text-slate-950 md:text-4xl">
                  Pendiente de confirmación
                </h1>
                <p className="mx-auto mt-4 max-w-2xl text-sm leading-6 text-slate-600 md:text-base">
                  Reservamos tu hora para <strong>{depositPending.serviceName}</strong> el{" "}
                  {depositPending.date} a las {depositPending.time}. El negocio va a revisar tu
                  comprobante y confirmar la hora en firme.
                </p>
              </div>

              <div className="mt-6 rounded-2xl border border-amber-100 bg-amber-50/80 p-4 text-center md:mt-8 md:rounded-3xl md:p-6">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-700">
                  Comprobante recibido
                </p>
                <p className="mt-2 text-sm text-slate-600">
                  El negocio va a revisar tu comprobante y te vamos a notificar apenas confirme tu
                  hora — no necesitas hacer nada más.
                </p>
              </div>

              {visibleWhatsappNumber ? (
                <p className="mt-4 text-center text-sm text-slate-500">
                  ¿Tienes dudas o esto está tomando más tiempo del esperado?{" "}
                  <a
                    href={`https://wa.me/${visibleWhatsappNumber}`}
                    target="_blank"
                    rel="noreferrer"
                    className="font-semibold text-emerald-600 underline underline-offset-2 hover:text-emerald-700"
                  >
                    Escríbenos por WhatsApp
                  </a>
                </p>
              ) : null}

              <div className="mt-6 flex justify-center">
                <button
                  type="button"
                  onClick={() => {
                    setDepositPending(null);
                    setDepositReceiptFile(null);
                    setSelectedSlot(null);
                    setSubmitError("");
                  }}
                  className="inline-flex h-12 items-center justify-center rounded-2xl bg-gradient-to-r from-slate-950 via-indigo-950 to-slate-900 px-6 text-sm font-semibold text-white transition hover:opacity-95"
                >
                  Volver al inicio
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
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
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-sky-50 px-3 py-4 sm:px-4 md:px-8 md:py-8">
        <div className="mx-auto flex min-h-[calc(100vh-2rem)] max-w-5xl items-center justify-center md:min-h-[calc(100vh-4rem)]">
          <div className="w-full rounded-2xl bg-gradient-to-br from-sky-400 via-emerald-400 to-indigo-500 p-[2.5px] shadow-[0_35px_90px_-45px_rgba(16,185,129,0.42)] md:rounded-[28px]">
            <div className="grid overflow-hidden rounded-[15px] bg-white md:grid-cols-[1.35fr_1fr] md:rounded-[26px]">
              {/* MASCOTA — arriba en mobile, columna derecha en desktop */}
              {/* El logo ORBYX ya viene dentro de la imagen. Mobile: banner recortado
                  (object-cover). Desktop: la imagen es cuadrada y el panel más alto
                  que ancho, así que ocupa todo el ancho y sus bordes superior/inferior
                  se difuminan hacia el color de borde de la imagen (sin cuadro visible). */}
              <div
                className="relative order-1 h-[200px] overflow-hidden md:order-2 md:flex md:h-auto md:items-center"
                style={{
                  background:
                    "linear-gradient(to bottom, rgb(0,20,47) 50%, rgb(8,13,28) 50%)",
                }}
              >
                <img
                  src="/mascota-confirmacion.png"
                  alt=""
                  className="h-full w-full object-cover object-[center_40%] md:h-auto md:object-contain md:[-webkit-mask-image:linear-gradient(to_bottom,transparent,#000_16%,#000_84%,transparent)] md:[mask-image:linear-gradient(to_bottom,transparent,#000_16%,#000_84%,transparent)]"
                />
              </div>

              {/* CONTENIDO */}
              <div className="order-2 p-5 md:order-1 md:p-8">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border-2 border-emerald-500 text-xl text-emerald-600 md:h-12 md:w-12">
                    ✓
                  </div>
                  <div className="min-w-0">
                    <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-emerald-600">
                      Reserva confirmada
                    </p>
                  </div>
                </div>

                <h1 className="mt-3 text-2xl font-extrabold leading-tight tracking-tight text-slate-950 md:text-3xl">
                  ¡Tu hora está agendada! 🎉
                </h1>

                <p className="mt-2 text-sm leading-5 text-slate-500">
                  Te enviamos la confirmación a tu correo con todos los
                  detalles.
                </p>

                <div className="mt-5 divide-y divide-slate-100">
                  <DetailRow
                    icon="📋"
                    label="Servicio"
                    value={bookingSuccess.serviceName}
                  />
                  <DetailRow
                    icon="📅"
                    label="Fecha y hora"
                    value={`${bookingSuccess.time} · ${bookingSuccess.date}`}
                  />
                  {bookingSuccess.branchName ? (
                    <DetailRow
                      icon="🏢"
                      label="Sucursal"
                      value={bookingSuccess.branchName}
                    />
                  ) : null}
                  {bookingSuccess.staffName ? (
                    <DetailRow
                      icon="🧑‍⚕️"
                      label="Profesional"
                      value={bookingSuccess.staffName}
                    />
                  ) : null}
                  <DetailRow
                    icon="📍"
                    label="Dirección"
                    value={bookingSuccess.branchAddress || "Dirección no disponible"}
                    href={mapsUrl || undefined}
                  />
                  <DetailRow
                    icon="✉️"
                    label="Confirmación enviada a"
                    value={bookingSuccess.customerEmail || "Correo no disponible"}
                  />
                </div>

                {/* Mismas instrucciones y misma condición que el correo de
                    confirmación: solo si el servicio las tiene cargadas. */}
                {bookingSuccess.customerInstructions ? (
                  <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
                    <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-amber-800">
                      Antes de tu visita
                    </p>
                    <p className="mt-1 whitespace-pre-line text-sm leading-6 text-amber-900">
                      {bookingSuccess.customerInstructions}
                    </p>
                  </div>
                ) : null}

                <a
                  href={googleCalendarUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-5 flex items-center justify-between rounded-xl bg-sky-50 px-4 py-3 text-sm font-semibold text-sky-900 transition hover:bg-sky-100"
                >
                  <span className="flex items-center gap-2">
                    📆 Guarda esta reserva en tu Google Calendar
                  </span>
                  <span aria-hidden="true">→</span>
                </a>

                <div className="mt-3 grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => {
                      setBookingSuccess(null);
                      setSelectedSlot(null);
                      setSubmitError("");
                    }}
                    className="inline-flex h-11 items-center justify-center rounded-xl bg-gradient-to-r from-slate-950 via-indigo-950 to-slate-900 px-3 text-sm font-semibold text-white transition hover:opacity-95"
                  >
                    Agendar otra hora
                  </button>

                  {whatsappNumber ? (
                    <a
                      href={`https://wa.me/${whatsappNumber}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex h-11 items-center justify-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                    >
                      <span className="text-emerald-500">●</span>
                      Consultar por WhatsApp
                    </a>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setBookingSuccess(null);
                        setSelectedSlot(null);
                        setSubmitError("");
                      }}
                      className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                    >
                      Volver a la agenda
                    </button>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setBookingSuccess(null);
                    setSelectedSlot(null);
                    setSubmitError("");
                  }}
                  className="mt-2.5 inline-flex h-11 w-full items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
                >
                  <span aria-hidden="true">←</span> Volver
                </button>

                {business?.name ? (
                  <p className="mt-4 text-center text-xs text-slate-500">
                    Gracias por reservar en{" "}
                    <span className="font-semibold text-indigo-600">
                      {business.name}
                    </span>{" "}
                    a través de{" "}
                    <span className="font-semibold text-indigo-600">Orbyx</span>.
                  </p>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (loadingPage) {
    return <PublicPageSkeleton />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[color:var(--pt-bg-from,#FBFAFF)] to-[color:var(--pt-bg-to,#F1EFFC)]">
      {previewTemplateId && !isEmbeddedPreview ? (
        <div className="pointer-events-none fixed bottom-3 left-3 z-[130] rounded-full bg-slate-900/90 px-3 py-1.5 text-[11px] font-semibold text-white shadow-lg">
          Vista previa: {activeTemplate.name} (no guardada)
        </div>
      ) : null}
      {activeTemplate.dark ? (
        // Plantillas oscuras: lo poco que no sale de variables CSS (calendario
        // de react-calendar y las rayas de "día cerrado"). Solo aplica con
        // <html data-public-dark>, así las plantillas claras no cambian.
        <style>{`
          html[data-public-dark] .orbyx-week-calendar .react-calendar { background: transparent; color: var(--color-slate-900); }
          html[data-public-dark] .orbyx-week-calendar .react-calendar__tile,
          html[data-public-dark] .orbyx-week-calendar .react-calendar__month-view__days__day--weekend:enabled { color: var(--color-slate-900); }
          html[data-public-dark] .orbyx-week-calendar .react-calendar__month-view__weekdays { color: var(--color-slate-500); }
          html[data-public-dark] .orbyx-week-calendar .react-calendar__tile:disabled,
          html[data-public-dark] .orbyx-week-calendar .react-calendar__navigation button:disabled { color: var(--color-slate-400); background: transparent; }
          html[data-public-dark] .orbyx-week-calendar .react-calendar__tile:enabled:focus,
          html[data-public-dark] .orbyx-week-calendar .react-calendar__navigation button:enabled:focus { background: var(--pt-cal-hover-bg); }
          html[data-public-dark] .orbyx-week-calendar .react-calendar__tile--active { color: var(--color-white) !important; }
          html[data-public-dark] { color-scheme: dark; }
          html[data-public-dark] input:not([type="checkbox"]):not([type="radio"]),
          html[data-public-dark] textarea { color: var(--color-slate-900); }
          html[data-public-dark] input::placeholder,
          html[data-public-dark] textarea::placeholder { color: var(--color-slate-500); opacity: 1; }
          html[data-public-dark] .orbyx-closed-day { background: repeating-linear-gradient(135deg, rgba(244,63,94,0.10) 0px, rgba(244,63,94,0.10) 9px, rgba(244,63,94,0.04) 9px, rgba(244,63,94,0.04) 18px) !important; }
        `}</style>
      ) : null}
      <div className="mx-auto w-full max-w-[1280px] px-3 py-4 sm:px-4 md:px-6 md:py-8 xl:px-8">
        {viewStep === "catalog" ? (
          <div className="mx-auto grid w-full max-w-[1080px] gap-4 lg:gap-6">
            <div className="min-w-0 space-y-4 md:space-y-6">
              <BusinessBannerCard
                business={business}
                slug={slug}
                branches={branches}
                selectedBranchId={selectedBranchId}
                onBranchChange={handleBranchChange}
                reviewSummary={reviewSummary}
                onOpenReviews={() => setShowReviewsModal(true)}
                contact={businessContact}
              />

              {panelStaff.length > 0 ? (
                <div className="hidden min-w-0 rounded-none border border-slate-200 bg-white p-4 shadow-[0_16px_45px_-34px_rgba(15,23,42,0.25)] lg:block">
                  <p className="mb-3 text-sm font-bold text-slate-950">
                    {selectedService ? "Profesionales de este servicio" : "Nuestro equipo"}
                  </p>
                  <TeamStrip staff={panelStaff} size="lg" />
                </div>
              ) : null}

              <div className="grid gap-4 lg:grid-cols-[230px_1fr] lg:gap-5 xl:gap-6">
                <CatalogSidebar
                  searchQuery={catalogSearchQuery}
                  onSearchChange={setCatalogSearchQuery}
                  categories={catalogCategories.map((category) => ({
                    key: category.key,
                    name: category.name,
                    totalCount: category.totalCount,
                  }))}
                  activeCategoryKey={activeCategoryKey}
                  onCategoryChange={selectCatalogCategory}
                  staff={panelStaff}
                  hasSelectedService={Boolean(selectedService)}
                />

                <div className="min-w-0 space-y-4">
                  {loadingServices ? (
                    <div className="rounded-none border border-slate-100 bg-white px-4 py-6 text-center text-sm text-slate-500 shadow-sm">
                      Cargando servicios...
                    </div>
                  ) : (
                    <ServiceCatalogAccordion
                      categories={visibleCatalogCategories}
                      selectedServiceId={selectedService?.id || ""}
                      onSelect={selectCatalogService}
                      selectedExtraIds={selectedExtraIds}
                      onToggleExtra={toggleSelectedExtra}
                      collapsedKeys={catalogCollapsedKeys}
                      onToggleCategory={toggleCatalogCategory}
                    />
                  )}

                  {selectedService ? (
                    <button
                      type="button"
                      onClick={goToBooking}
                      className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-slate-950 via-indigo-950 to-slate-900 text-sm font-semibold text-white shadow-[0_16px_35px_-22px_rgba(15,23,42,0.9)] transition hover:opacity-95"
                    >
                      Ir a Agendar
                      <span aria-hidden="true">→</span>
                    </button>
                  ) : null}
                </div>
              </div>
            </div>

          </div>
        ) : null}

        {viewStep === "booking" && selectedService ? (
        <>
        <div className="mx-auto w-full max-w-[1080px]">
        <button
          type="button"
          onClick={backToCatalog}
          className="mb-3 inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:underline md:mb-4"
        >
          <span aria-hidden="true">←</span> Volver al catálogo
        </button>
        </div>
        {/* Una sola columna, como el catálogo: el servicio, duración y precio
            van en la franja "Tu servicio" (antes repetidos en una columna derecha). */}
        <div className="mx-auto grid w-full max-w-[1080px] gap-4 md:gap-6">
          <div className="min-w-0 space-y-4 md:space-y-6">
            <BusinessBannerCard
              business={business}
              slug={slug}
              branches={branches}
              selectedBranchId={selectedBranchId}
              onBranchChange={handleBranchChange}
              reviewSummary={reviewSummary}
              onOpenReviews={() => setShowReviewsModal(true)}
              contact={businessContact}
            />

          <div className="min-w-0 flex flex-col rounded-none border border-slate-200 bg-white p-3 shadow-[0_16px_45px_-34px_rgba(15,23,42,0.45)] md:rounded-none md:p-4 md:shadow-[0_20px_60px_-35px_rgba(15,23,42,0.35)]">
            {selectedService ? (
              <div className="-mx-3 -mt-3 mb-3 flex items-center gap-2 border-b border-indigo-100 bg-gradient-to-r from-indigo-50 to-white px-3 py-2.5 md:-mx-4 md:-mt-4 md:mb-4 md:px-4">
                <span className="text-[11px] font-semibold uppercase tracking-wide text-indigo-500">
                  Tu servicio
                </span>
                <span className="min-w-0 truncate text-sm font-semibold text-indigo-900">
                  {bookingServiceLabel || selectedService!.name}
                  <span className="font-normal text-indigo-600">
                    {" "}· {bookingTotalMinutes} min · {formatPrice(bookingTotalPrice)}
                  </span>
                </span>
              </div>
            ) : null}

            {selectedService ? (
              <div className="mb-3 md:mb-4">
                <BookingStepHeader step={1} title="Profesional" hint="(opcional)" />
                <StaffCarousel
                  staff={staffOptions}
                  selectedStaffId={selectedStaffId}
                  onSelect={selectStaff}
                  loading={loadingStaff}
                />
              </div>
            ) : null}

            <div className={selectedService ? "border-t border-slate-200 pt-3 md:pt-4" : ""}>
              <BookingStepHeader step={selectedService ? 2 : 1} title="Elige la semana" />
            </div>
            <div className="mb-3 md:mb-4">
              <div className="relative flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => moveSelectedWeek(-7)}
                  className="flex h-10 w-10 items-center justify-center rounded-none border border-indigo-600 bg-indigo-600 text-lg font-bold text-white shadow-[0_8px_18px_-10px_rgb(var(--pt-glow-rgb,79_70_229)/0.9)] transition hover:bg-indigo-700 md:h-11 md:w-11"
                  aria-label="Semana anterior"
                >
                  ‹
                </button>

                <button
                  type="button"
                  onClick={() => setShowDatePopover((current) => !current)}
                  className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-none border border-indigo-300 bg-indigo-50 px-3 text-xs font-bold text-indigo-900 shadow-sm transition hover:border-indigo-500 hover:bg-indigo-100 sm:flex-none md:h-11 md:px-4 md:text-sm"
                >
                  <span>{weekRangeLabel}</span>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
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
                  className="flex h-10 w-10 items-center justify-center rounded-none border border-indigo-600 bg-indigo-600 text-lg font-bold text-white shadow-[0_8px_18px_-10px_rgb(var(--pt-glow-rgb,79_70_229)/0.9)] transition hover:bg-indigo-700 md:h-11 md:w-11"
                  aria-label="Semana siguiente"
                >
                  ›
                </button>

                {showDatePopover ? (
                  <div className="orbyx-week-calendar absolute left-0 top-14 z-40 w-[310px] max-w-full overflow-hidden rounded-none border border-indigo-200 bg-white p-3 shadow-[0_28px_90px_-38px_rgba(15,23,42,0.55)] [&_.react-calendar]:w-full [&_.react-calendar]:max-w-full [&_.react-calendar]:border-0">
                    {/* Colores del calendario solo para este selector (no toca los estilos globales). */}
                    <style>{`
                      .orbyx-week-calendar .react-calendar { border: 0; padding: 4px; }
                      .orbyx-week-calendar .react-calendar__tile:disabled { background: transparent; color: #cbd5e1; }
                      .orbyx-week-calendar .react-calendar__month-view__days__day--weekend:enabled { color: #0f172a; }
                      .orbyx-week-calendar .react-calendar__navigation button { color: var(--pt-cal-nav, #4338ca); font-weight: 700; }
                      .orbyx-week-calendar .react-calendar__navigation button:enabled:hover { background: var(--pt-cal-hover-bg, #eef2ff); }
                      .orbyx-week-calendar .react-calendar__navigation button:disabled { background: transparent; color: #cbd5e1; }
                      .orbyx-week-calendar .react-calendar__tile:enabled:hover { background: var(--pt-cal-hover-bg, #eef2ff); color: var(--pt-cal-hover-text, #3730a3); }
                      .orbyx-week-calendar .react-calendar__tile--now { background: var(--pt-cal-now-bg, #e0e7ff); color: var(--pt-cal-hover-text, #3730a3); font-weight: 700; }
                      .orbyx-week-calendar .react-calendar__tile--active { background: var(--pt-cal-active, #4f46e5) !important; color: #fff !important; font-weight: 700; }
                    `}</style>
                    <Calendar
                      locale="es-CL"
                      calendarType="iso8601"
                      minDate={new Date()}
                      onChange={(value: unknown) => {
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
            </div>

            <div className="border-t border-slate-200 pt-3 md:pt-4">
              <style>{DAY_HEADER_CSS}</style>
              <BookingStepHeader step={selectedService ? 3 : 2} title="Elige día y hora" />
            </div>

            {!selectedService ? (
              <div className="mb-6 rounded-none border border-amber-200 bg-amber-50 px-4 py-4 shadow-sm">
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
                const occupiedSlots = weekOccupiedSlots[dateKey] || [];
                const daySlotEntries = mergeDaySlots(slots, occupiedSlots);
                const isClosedDay =
                  Boolean(selectedService) &&
                  !loadingSlots &&
                  slots.length === 0 &&
                  occupiedSlots.length === 0;

                return (
                  <div
                    key={dateKey}
                    className={`flex min-w-0 flex-col rounded-none border transition ${
                      isToday
                        ? "border-indigo-600 bg-white shadow-[0_12px_30px_-18px_rgb(var(--pt-glow-rgb,79_70_229)/0.85)] ring-1 ring-indigo-600"
                        : "border-slate-200 bg-slate-50/60"
                    } ${isClosedDay ? "self-stretch" : ""}`}
                  >
                    <div
                      className={`px-3 py-2.5 text-white md:sticky md:top-0 md:z-30 ${dayHeaderClass(dateObj)}`}
                    >
                      <p className="flex items-center gap-2 text-sm font-bold">
                        {getWeekdayLabel(dateObj)}
                        {isToday ? (
                          <span className="rounded-full bg-white/25 px-2 py-0.5 text-[10px] font-semibold text-white ring-1 ring-white/50">
                            Hoy
                          </span>
                        ) : null}
                      </p>
                      <p className="mt-0.5 text-xs text-white/85">
                        {dateObj.toLocaleDateString("es-CL", {
                          day: "numeric",
                          month: "long",
                        })}
                      </p>
                    </div>

                    <div className={`p-3 ${isClosedDay ? "flex flex-1 flex-col" : ""}`}>











{loadingSlots ? (
  <p className="text-xs text-slate-500">Cargando...</p>
) : !selectedService ? (
  <p className="text-xs text-slate-500">
    Selecciona un servicio.
  </p>
) : daySlotEntries.length === 0 ? (
  <NoAvailabilityNotice />
) : (
  <div className="space-y-1.5">
    {daySlotEntries.map(({ slot, occupied }, index) => occupied ? (
      <OccupiedSlot key={`occ-${slot.slot_start}-${index}`} slot={slot} variant="desktop" />
    ) : (
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
className={`flex min-h-[40px] w-full flex-row items-center justify-between gap-2 rounded-none border px-2.5 py-1.5 text-left transition md:min-h-[34px] md:flex-col md:justify-center md:px-2 md:py-1 md:text-center ${
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
                  </div>
                );
              })}
            </div>
            </div>

            <div className="md:hidden">
              <div className="mb-3 grid grid-cols-7 gap-1">
                {weekDates.map((dateObj) => {
                  const dateKey = formatDate(dateObj);
                  const isActiveMobileDay = mobileSelectedDateKey === dateKey;
                  const isToday = todayKey === dateKey;
                  const daySlots = weekSlots[dateKey] || [];
                  const isClosedDay =
                    Boolean(selectedService) &&
                    !loadingSlots &&
                    daySlots.length === 0 &&
                    (weekOccupiedSlots[dateKey] || []).length === 0;

                  return (
                    <button
                      key={dateKey}
                      type="button"
                      onClick={() => {
                        setMobileSelectedDateKey(dateKey);
                        setSelectedDate(dateObj);
                        setSelectedSlot(null);
                      }}
                      aria-label={dateObj.toLocaleDateString("es-CL", {
                        weekday: "long",
                        day: "numeric",
                        month: "long",
                      })}
                      aria-pressed={isActiveMobileDay}
                      className={`relative min-w-0 rounded-md border px-0.5 py-1.5 text-center transition ${
                        isActiveMobileDay
                          ? `border-transparent text-white shadow-[0_10px_20px_-14px_rgb(var(--pt-glow-rgb,79_70_229)/0.9)] ${dayHeaderClass(dateObj)}`
                          : isClosedDay
                          ? "border-slate-200 bg-slate-100 text-slate-500"
                          : isToday
                          ? "border-indigo-300 bg-indigo-50 text-indigo-900"
                          : "border-slate-200 bg-white text-slate-700"
                      }`}
                    >
                      <p className="text-[10px] font-bold uppercase leading-none">
                        {dateObj
                          .toLocaleDateString("es-CL", { weekday: "short" })
                          .replace(".", "")
                          .slice(0, 3)}
                      </p>
                      <p className="mt-1 text-base font-bold leading-none">{dateObj.getDate()}</p>
                      {selectedService ? (
                        <p
                          className={`mt-1 truncate text-[9px] font-medium leading-none ${
                            isActiveMobileDay
                              ? "text-white/85"
                              : "text-slate-400"
                          }`}
                        >
                          {daySlots.length > 0 ? `${daySlots.length} horas` : "Sin horas"}
                        </p>
                      ) : null}
                      {isToday ? (
                        <span
                          className={`absolute left-1/2 top-0.5 h-1 w-1 -translate-x-1/2 rounded-full ${
                            isActiveMobileDay ? "bg-white" : "bg-indigo-600"
                          }`}
                          aria-hidden="true"
                        />
                      ) : null}
                    </button>
                  );
                })}
              </div>

              <div className="overflow-hidden rounded-none border border-slate-200 bg-white shadow-sm">
                <div
                  className={`flex items-start justify-between gap-3 px-3 py-2.5 text-white ${
                    mobileSelectedDate ? dayHeaderClass(mobileSelectedDate) : ""
                  }`}
                >
                  <div>
                    <p className="text-sm font-bold">
                      {mobileSelectedDate ? getWeekdayLabel(mobileSelectedDate) : "Día"}
                    </p>
                    {mobileSelectedDate ? (
                      <p className="mt-0.5 text-xs text-white/85">
                        {mobileSelectedDate.toLocaleDateString("es-CL", {
                          day: "numeric",
                          month: "long",
                        })}
                      </p>
                    ) : null}
                  </div>
                  {selectedService && mobileSelectedDateSlots.length > 0 ? (
                    <span className="rounded-full bg-white/25 px-2.5 py-1 text-[11px] font-semibold text-white ring-1 ring-white/40">
                      {mobileSelectedDateSlots.length} disponibles
                    </span>
                  ) : null}
                </div>

                <div className="p-3">

                {loadingSlots ? (
                  <div className="grid grid-cols-2 gap-2">
                    {[0, 1, 2, 3].map((item) => (
                      <div
                        key={item}
                        className="h-[54px] animate-pulse rounded-none border border-slate-100 bg-slate-100"
                      />
                    ))}
                  </div>
                ) : !selectedService ? (
                  <div className="rounded-none border border-amber-100 bg-amber-50 px-4 py-4 text-sm text-amber-800">
                    Selecciona un servicio para ver horarios disponibles.
                  </div>
                ) : mobileSelectedDateEntries.length === 0 ? (
                  <div className="flex">
                    <NoAvailabilityNotice />
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    {mobileSelectedDateEntries.map(({ slot, occupied }, index) => occupied ? (
                      <OccupiedSlot key={`occ-${slot.slot_start}-${index}`} slot={slot} variant="mobile" />
                    ) : (
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
                        className={`min-h-[54px] rounded-none border px-3 py-2.5 text-center transition ${
                          selectedSlot?.slot_start === slot.slot_start
                            ? "border-indigo-700 bg-indigo-700 text-white shadow-[0_16px_28px_-20px_rgb(var(--pt-glow-rgb,79_70_229)/0.9)]"
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
            </div>

{selectedService && noSlotsThisWeek ? (
  <div className="mt-4 rounded-none border border-indigo-100 bg-gradient-to-br from-indigo-50 via-white to-sky-50 p-3.5 shadow-sm md:mt-6 md:rounded-none md:p-5">

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
          className="rounded-none border border-white bg-white/90 p-3 shadow-sm md:p-4"
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
                className="min-h-10 rounded-none border border-indigo-200 bg-white px-3 py-2 text-xs font-semibold text-indigo-700 transition hover:border-indigo-400 hover:bg-indigo-50"
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
    className="mt-4 inline-flex h-11 w-full items-center justify-center rounded-none bg-slate-950 px-4 text-sm font-semibold text-white transition hover:opacity-90 sm:w-auto"
  >
    Ir a semana con disponibilidad
  </button>
) : null}
  </div>
) : null}


            {selectedSlot ? (
              <div
                ref={formRef}
                className="mt-4 overflow-hidden rounded-none border border-indigo-200 bg-gradient-to-br from-indigo-50 via-white to-emerald-50 shadow-[0_24px_65px_-45px_rgb(var(--pt-glow-rgb,79_70_229)/0.55)] md:mt-6 md:rounded-none md:shadow-[0_30px_80px_-45px_rgb(var(--pt-glow-rgb,79_70_229)/0.5)]"
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
                      <div className="rounded-none border border-white/80 bg-white/90 px-3 py-2 shadow-sm md:rounded-none md:px-4 md:py-3">
                        <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400 md:text-[11px] md:tracking-[0.16em]">
                          Fecha
                        </p>
                        <p className="mt-1 text-sm font-semibold text-slate-900">
                          {formatFullDate(selectedSlot!.slot_start)}
                        </p>
                      </div>

                      <div className="rounded-none border border-white/80 bg-white/90 px-3 py-2 shadow-sm md:rounded-none md:px-4 md:py-3">
                        <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400 md:text-[11px] md:tracking-[0.16em]">
                          Hora
                        </p>
                        <p className="mt-1 text-sm font-semibold text-slate-900">
                          {formatHour(selectedSlot!.slot_start)}
                        </p>
                      </div>

                      {selectedService ? (
                        <div className="rounded-none border border-white/80 bg-white/90 px-3 py-2 shadow-sm md:rounded-none md:px-4 md:py-3">
                          <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400 md:text-[11px] md:tracking-[0.16em]">
                            Servicio
                          </p>
                          <p className="mt-1 text-sm font-semibold text-slate-900">
                            {bookingServiceLabel || selectedService.name}
                          </p>
                          {selectedExtras.length > 0 ? (
                            <p className="mt-0.5 text-xs text-slate-500">
                              Total {formatPrice(bookingTotalPrice)} · {bookingTotalMinutes} min
                            </p>
                          ) : null}
                        </div>
                      ) : null}

                      {selectedStaffId ? (
                        <div className="rounded-none border border-white/80 bg-white/90 px-3 py-2 shadow-sm md:rounded-none md:px-4 md:py-3">
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
                      placeholder="Nombre y Apellido *"
                      required
                      value={customerData.name || ""}
                      onChange={(e) => updateCustomerField("name", e.target.value)}
                      className="h-11 rounded-none border border-indigo-100 bg-white px-3.5 text-sm outline-none transition focus:border-indigo-400 md:h-12 md:rounded-none md:px-4"
                    />

                    <PhoneCountryInput
                      variant="light"
                      allowedCountries={["CL"]}
                      iso2={phoneIso2}
                      onIso2Change={setPhoneIso2}
                      value={customerData.phone || ""}
                      onChange={(v) => updateCustomerField("phone", v)}
                      required
                    />

                    <input
                      placeholder="Correo electrónico *"
                      type="email"
                      required
                      value={customerData.email || ""}
                      onChange={(e) => updateCustomerField("email", e.target.value)}
                      className="h-11 rounded-none border border-indigo-100 bg-white px-3.5 text-sm outline-none transition focus:border-indigo-400 md:col-span-2 md:h-12 md:rounded-none md:px-4"
                    />

                    {isVeterinaria && (
                      <div className="space-y-3 md:col-span-2">
                        <div className="rounded-none border border-emerald-100 bg-emerald-50/80 p-3 md:p-4">
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
                                  className={`min-h-11 rounded-none border px-3 py-2 text-sm font-medium transition md:h-11 md:px-4 md:py-0 ${
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
                                  className={`min-h-11 rounded-none border px-3 py-2 text-sm font-medium transition md:h-11 md:px-4 md:py-0 ${
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
          className={`w-full rounded-none border p-3 text-left transition ${
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
                            placeholder="Nombre de la mascota *"
                            required
                            value={customerData.pet_name || ""}
                            onChange={(e) =>
                              updateCustomerField("pet_name", e.target.value)
                            }
                            disabled={petMode === "existing" && pets.length > 0}
                            className="h-11 rounded-none border border-indigo-100 bg-white px-3.5 text-sm outline-none transition disabled:bg-slate-100 disabled:text-slate-500 focus:border-emerald-400 md:h-12 md:rounded-none md:px-4"
                          />

                          <input
                            placeholder="Especie *"
                            required
                            value={customerData.pet_species || ""}
                            onChange={(e) =>
                              updateCustomerField("pet_species", e.target.value)
                            }
                            disabled={petMode === "existing" && pets.length > 0}
                            className="h-11 rounded-none border border-indigo-100 bg-white px-3.5 text-sm outline-none transition disabled:bg-slate-100 disabled:text-slate-500 focus:border-emerald-400 md:h-12 md:rounded-none md:px-4"
                          />
                        </div>
                      </div>
                    )}

                    {visibleSubtypeBookingFields.length > 0 ? (
                      <div className="space-y-3 rounded-none border border-indigo-100 bg-indigo-50/50 p-4 md:col-span-2">
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
                                <Select
                                  key={field.key}
                                  value={customerData[field.key] || ""}
                                  required={field.required}
                                  onChange={(e) =>
                                    updateCustomerField(field.key, e.target.value)
                                  }
                                  className="h-11 rounded-none border border-indigo-100 bg-white px-3.5 text-sm outline-none transition focus:border-indigo-400 md:h-12 md:rounded-none md:px-4"
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
                                </Select>
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
                                required={field.required}
                                onChange={(e) =>
                                  updateCustomerField(field.key, e.target.value)
                                }
                                className="min-h-[88px] rounded-none border border-indigo-100 bg-white px-3.5 py-3 text-sm outline-none transition focus:border-indigo-400 md:col-span-2 md:min-h-[96px] md:rounded-none md:px-4"
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
                                required={field.required}
                                onChange={(e) =>
                                  updateCustomerField(field.key, e.target.value)
                                }
                                className="h-11 rounded-none border border-indigo-100 bg-white px-3.5 text-sm outline-none transition focus:border-indigo-400 md:h-12 md:rounded-none md:px-4"
                              />
                            );
                          })}
                        </div>
                      </div>
                    ) : null}

                    {visibleBookingFields.map((field) => (
                      <input
                        key={field.key}
                        placeholder={`${field.label}${field.required ? " *" : ""}`}
                        required={field.required}
                        value={customerData[field.key] || ""}
                        onChange={(e) =>
                          updateCustomerField(field.key, e.target.value)
                        }
                        className="h-11 rounded-none border border-indigo-100 bg-white px-3.5 text-sm outline-none transition focus:border-indigo-400 md:col-span-2 md:h-12 md:rounded-none md:px-4"
                      />
                    ))}
                  </div>

                  {turnstileSiteKey ? (
                    <div className="mt-4 flex flex-col items-center gap-2">
                      <Turnstile
                        ref={turnstileRef}
                        siteKey={turnstileSiteKey}
                        onSuccess={(token) => {
                          setCaptchaToken(token);
                          setCaptchaWidgetFailed(false);
                        }}
                        onExpire={() => setCaptchaToken("")}
                        onError={() => {
                          setCaptchaToken("");
                          setCaptchaWidgetFailed(true);
                        }}
                        onUnsupported={() => setCaptchaWidgetFailed(true)}
                        scriptOptions={{ onError: () => setCaptchaWidgetFailed(true) }}
                        options={{ theme: "light" }}
                      />
                      {captchaWidgetFailed && !captchaToken ? (
                        <p className="text-center text-xs text-rose-700">
                          No pudimos verificar que no eres un robot. Desactiva el bloqueador de anuncios o intenta desde otro navegador.
                        </p>
                      ) : null}
                    </div>
                  ) : null}

                  {submitError ? (
                    <div className="mt-4 rounded-none border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                      {submitError}
                    </div>
                  ) : null}

                  <div className="sticky bottom-3 z-20 -mx-1 mt-5 flex flex-col gap-2 rounded-none border border-slate-200 bg-white/95 p-2 shadow-[0_18px_45px_-28px_rgba(15,23,42,0.75)] backdrop-blur md:static md:mx-0 md:flex-row md:items-center md:justify-between md:gap-3 md:border-0 md:bg-transparent md:p-0 md:shadow-none md:backdrop-blur-0">
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


            <div className="mt-5 grid gap-3 rounded-none border border-indigo-100 bg-gradient-to-r from-indigo-50 via-white to-violet-50 px-4 py-4 sm:grid-cols-2 sm:gap-0 sm:divide-x sm:divide-indigo-100 lg:mt-6 lg:px-6">
              <div className="flex items-center gap-3 sm:pr-6">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-indigo-600">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    className="h-5 w-5"
                    aria-hidden="true"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 3l7 4v5c0 4.5-2.8 7.7-7 9-4.2-1.3-7-4.5-7-9V7l7-4z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.5 12l1.7 1.7 3.3-3.4" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900">
                    Tu reserva queda registrada al instante
                  </p>
                  <p className="mt-0.5 text-xs text-slate-500">
                    Datos protegidos y una experiencia segura.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 sm:pl-6">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-violet-100 text-violet-600">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    className="h-5 w-5"
                    aria-hidden="true"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 3L5 13h6l-1 8 8-10h-6l1-8z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900">
                    Confirmación inmediata
                  </p>
                  <p className="mt-0.5 text-xs text-slate-500">
                    Recibirás los detalles de tu reserva apenas confirmes la hora.
                  </p>
                </div>
              </div>
            </div>
          </div>
          </div>
        </div>
        </>
        ) : null}

        <OrbyxPromoFooter />

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
                  className="flex h-10 w-10 items-center justify-center rounded-none border border-slate-200 text-xl text-slate-500 transition hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700"
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
                    className="h-12 w-full rounded-none border border-slate-200 bg-white pl-11 pr-4 text-sm text-slate-800 outline-none transition focus:border-indigo-400"
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
                  className={`w-full rounded-none border p-4 text-left transition ${
                    selectedStaffId === ""
                      ? "border-indigo-500 bg-indigo-50 shadow-sm"
                      : "border-slate-200 bg-white hover:border-indigo-300 hover:bg-indigo-50"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-none border border-indigo-100 bg-indigo-50 text-lg font-bold text-indigo-700">
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
                    className={`rounded-none border bg-white p-4 transition ${
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
                        className="h-10 rounded-none border border-indigo-300 px-4 text-sm font-semibold text-indigo-700 transition hover:bg-indigo-50"
                      >
                        Elegir
                      </button>
                    </div>
                  </div>
                ))}

                {filteredDrawerStaff.length === 0 ? (
                  <div className="rounded-none border border-slate-200 bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
                    No encontramos profesionales con ese nombre.
                  </div>
                ) : null}
              </div>
            </aside>
          </div>
        ) : null}

        {showReviewsModal ? (
          <div className="fixed inset-0 z-50">
            <button
              type="button"
              className="absolute inset-0 bg-slate-950/35 backdrop-blur-sm"
              aria-label="Cerrar reseñas"
              onClick={() => setShowReviewsModal(false)}
            />

            <div className="absolute inset-0 flex items-center justify-center p-4">
              <div className="flex max-h-[80vh] w-full max-w-lg flex-col rounded-2xl border border-slate-200 bg-white shadow-[0_30px_100px_-45px_rgba(15,23,42,0.7)]">
                <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
                  <div>
                    <p className="text-lg font-bold text-slate-950">Reseñas</p>
                    {reviewSummary ? (
                      <p className="mt-1 text-xs text-slate-500">
                        {reviewSummary.average.toFixed(1)} de 5 ·{" "}
                        {reviewSummary.count}{" "}
                        {reviewSummary.count === 1 ? "reseña" : "reseñas"}
                      </p>
                    ) : null}
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowReviewsModal(false)}
                    className="flex h-10 w-10 items-center justify-center rounded-none border border-slate-200 text-xl text-slate-500 transition hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700"
                    aria-label="Cerrar"
                  >
                    ×
                  </button>
                </div>

                <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-5 py-4">
                  {(reviewSummary?.reviews || []).map((review) =>
                    review.status === "hidden" ? (
                      <div
                        key={review.id}
                        className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-3"
                      >
                        <p className="text-sm italic text-slate-500">
                          Reseña oculta por el negocio
                          {review.hidden_reason ? ` — Motivo: ${review.hidden_reason}` : ""}
                        </p>
                      </div>
                    ) : (
                      <div
                        key={review.id}
                        className="rounded-xl border border-slate-100 p-3"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <p className="truncate text-sm font-semibold text-slate-800">
                            {review.client_name?.trim() || "Cliente"}
                          </p>
                          <span className="shrink-0 text-xs text-slate-400">
                            {formatReviewDate(review.created_at)}
                          </span>
                        </div>
                        <div className="mt-1 flex items-center gap-0.5 text-amber-400">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <StarIcon
                              key={star}
                              filled={star <= (review.rating || 0)}
                              className="h-3.5 w-3.5"
                            />
                          ))}
                        </div>
                        {review.comment ? (
                          <p className="mt-1.5 text-sm leading-5 text-slate-600">
                            {review.comment}
                          </p>
                        ) : null}

                        {review.reaction ? (
                          <p className="mt-1.5 text-lg leading-none">{review.reaction}</p>
                        ) : null}

                        {review.replies && review.replies.length > 0 ? (
                          <div className="mt-2 space-y-2 border-l-2 border-indigo-100 pl-3">
                            {review.replies.map((reply) => (
                              <div key={reply.id}>
                                <p className="text-xs font-semibold text-indigo-600">
                                  Respuesta de {business?.name?.trim() || "el negocio"} ·{" "}
                                  {formatReviewDate(reply.created_at)}
                                </p>
                                <p className="mt-0.5 text-sm leading-5 text-slate-600">
                                  {reply.message}
                                </p>
                              </div>
                            ))}
                          </div>
                        ) : null}
                      </div>
                    )
                  )}
                </div>

                <div className="border-t border-slate-100 px-5 py-3">
                  <a
                    href={`/${slug}/opinar`}
                    className="block w-full rounded-none border border-indigo-200 bg-indigo-50 px-4 py-2.5 text-center text-sm font-semibold text-indigo-700 transition hover:bg-indigo-100"
                  >
                    Dejar una reseña
                  </a>
                </div>
              </div>
            </div>
          </div>
        ) : null}

        {loadingPage ? (
          <div className="mt-6 text-sm text-slate-500">Cargando...</div>
        ) : null}
      </div>
    </div>
  );
}
