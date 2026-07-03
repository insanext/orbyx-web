"use client";

import { CSSProperties, useEffect, useMemo, useRef, useState } from "react";
import { apiFetch } from "@/lib/api";
import { useParams, useRouter } from "next/navigation";
import {
  CalendarDays,
  Check,
  Clock,
  Lock,
  Phone,
  RotateCcw,
  Search,
  UserRound,
  UsersRound,
  X,
  XCircle,
} from "lucide-react";
import { PageHeader } from "../../../../components/dashboard/page-header";
import { Panel } from "../../../../components/dashboard/panel";

type Appointment = {
  id: string;
  branch_id?: string | null;
  service_id?: string | null;
  staff_id?: string | null;
  customer_id?: string | null;
  start_at: string;
  end_at: string;
  customer_name: string;
  customer_phone: string | null;
  customer_email: string | null;
  service_name_snapshot: string | null;
  service_is_group?: boolean | null;
  service_capacity?: number | null;
  status: string;
  notes?: string | null;
  customer_data?: {
    pet_name?: string;
    pet_species?: string;
  } | null;
};

type BusinessResponse = {
  business: {
    id: string;
    name: string;
    slug: string;
    business_category?: string | null;
  };
  calendar_id?: string;
  google_connected?: boolean;
  plan_slug?: string | null;
  slot_minutes?: number | string | null;
};

type BranchItem = {
  id: string;
  tenant_id?: string;
  name: string;
  is_active?: boolean;
  use_global_hours?: boolean;
};

type StaffItem = {
  id: string;
  tenant_id?: string;
  branch_id?: string | null;
  name: string;
  role?: string | null;
  email?: string | null;
  phone?: string | null;
  color?: string | null;
  photo_url?: string | null;
  avatar?: string | null;
  is_active: boolean;
  sort_order?: number;
  use_business_hours?: boolean;
};

type ServiceItem = {
  id: string;
  name: string;
  active?: boolean;
};

type BusinessHourItem = {
  id?: string;
  tenant_id?: string;
  branch_id?: string | null;
  day_of_week: number;
  enabled: boolean;
  start_time: string | null;
  end_time: string | null;
};

type StaffHourItem = {
  id?: string;
  tenant_id?: string;
  branch_id?: string | null;
  staff_id: string;
  day_of_week: number;
  enabled: boolean;
  start_time: string | null;
  end_time: string | null;
};

type BusinessSpecialDateItem = {
  id?: string;
  tenant_id?: string;
  branch_id?: string | null;
  date: string;
  label?: string | null;
  is_closed: boolean;
  start_time: string | null;
  end_time: string | null;
};

type StaffSpecialDateItem = {
  id?: string;
  tenant_id?: string;
  branch_id?: string | null;
  staff_id: string;
  date: string;
  label?: string | null;
  is_closed: boolean;
  start_time: string | null;
  end_time: string | null;
};

type FilterValue =
  | "active"
  | "pending_close"
  | "booked"
  | "completed"
  | "no_show"
  | "canceled";

type HoverCardState = {
  appointment: Appointment;
  x: number;
  y: number;
} | null;

type WeekGroupedAppointmentsPopover = {
  key: string;
  appointmentGroups: Appointment[][];
  dayLabel: string;
  timeLabel: string;
  targetDate: Date;
  x: number;
  y: number;
  lineLeft: number;
  lineTop: number;
  lineWidth: number;
  lineAngle: number;
} | null;

type WeekSlotDisplayGroup = {
  key: string;
  appointmentGroups: Appointment[][];
  appointments: Appointment[];
  isWeekSummary: boolean;
};

type NoticeTone =
  | "info"
  | "success"
  | "warning"
  | "limit"
  | "danger"
  | "neutral";

type VeterinaryNextControlMode =
  | "none"
  | "7_days"
  | "15_days"
  | "30_days"
  | "2_months"
  | "3_months"
  | "6_months"
  | "1_year"
  | "exact_date"
  | "custom";

type VeterinaryCloseForm = {
  control_type: string;
  custom_control_type: string;
  control_note: string;
  diagnosis: string;
  treatment: string;
  symptoms: string;
  medications: string;
  referrals: string;
  follow_up_notes: string;
  next_control_mode: VeterinaryNextControlMode;
  next_control_exact_date: string;
  next_control_custom_value: string;
  next_control_custom_unit: "days" | "months" | "years";
};

type ManualBookingDraft = {
  slot_start: string;
  staff_id: string;
  staff_locked: boolean;
  service_id: string;
  service_locked: boolean;
  customer_name: string;
  customer_phone: string;
  customer_email: string;
  pet_name: string;
  pet_species: string;
  note: string;
};

type FreeSlotActionDraft = {
  slot_start: string;
  staff_id: string;
  mode: "actions" | "schedule_config";
};

type ClosedScheduleDraft = {
  staff_id: string;
  kind: "block" | "day";
};

const BACKEND_URL = "https://orbyx-backend.onrender.com";
const GROUP_ATTENDEE_PREVIEW_LIMIT = 3;

const filterLabels: Record<FilterValue, string> = {
  active: "Activas",
  pending_close: "Pendientes",
  booked: "Agendadas",
  completed: "Atendidas",
  no_show: "No asistió",
  canceled: "Canceladas",
};
const filterValues = Object.keys(filterLabels) as FilterValue[];

function getNoticeStyles(tone: NoticeTone): {
  wrapper: CSSProperties;
  title: CSSProperties;
  description: CSSProperties;
} {
  const tones: Record<
    NoticeTone,
    { border: string; background: string; text: string }
  > = {
    info: {
      border: "rgba(34,197,94,0.34)",
      background:
        "linear-gradient(135deg, rgba(34,197,94,0.12), rgba(34,197,94,0.05))",
      text: "var(--text-main)",
    },
    success: {
      border: "rgba(16,185,129,0.34)",
      background:
        "linear-gradient(135deg, rgba(16,185,129,0.12), rgba(16,185,129,0.05))",
      text: "var(--text-main)",
    },
    warning: {
      border: "rgba(245,158,11,0.34)",
      background:
        "linear-gradient(135deg, rgba(245,158,11,0.12), rgba(245,158,11,0.05))",
      text: "var(--text-main)",
    },
    limit: {
      border: "rgba(249,115,22,0.34)",
      background:
        "linear-gradient(135deg, rgba(249,115,22,0.12), rgba(249,115,22,0.05))",
      text: "var(--text-main)",
    },
    danger: {
      border: "rgba(244,63,94,0.34)",
      background:
        "linear-gradient(135deg, rgba(244,63,94,0.12), rgba(244,63,94,0.05))",
      text: "var(--text-main)",
    },
    neutral: {
      border: "var(--border-color)",
      background: "var(--bg-soft)",
      text: "var(--text-main)",
    },
  };

  const current = tones[tone];

  return {
    wrapper: {
      borderColor: current.border,
      background: current.background,
      boxShadow: `inset 0 1px 0 rgba(255,255,255,0.04), 0 0 0 1px ${current.border}`,
    },
    title: {
      color: current.text,
    },
    description: {
      color: "var(--text-muted)",
    },
  };
}

function Notice({
  tone,
  title,
  description,
  children,
}: {
  tone: NoticeTone;
  title: string;
  description?: string;
  children?: React.ReactNode;
}) {
  const styles = getNoticeStyles(tone);

  return (
    <div
      className="rounded-2xl border px-4 py-4 shadow-sm"
      style={styles.wrapper}
    >
      <p className="text-sm font-semibold" style={styles.title}>
        {title}
      </p>

      {description ? (
        <p className="mt-1 text-sm leading-6" style={styles.description}>
          {description}
        </p>
      ) : null}

      {children ? <div className="mt-3">{children}</div> : null}
    </div>
  );
}

function StatCard({
  title,
  value,
}: {
  title: string;
  value: string | number;
}) {
  return (
    <div
      className="rounded-xl border px-4 py-3"
      style={{
        borderColor: "var(--border-color)",
        background: "var(--bg-card)",
      }}
    >
      <p className="text-xs" style={{ color: "var(--text-muted)" }}>
        {title}
      </p>
      <p
        className="mt-1 text-lg font-semibold"
        style={{ color: "var(--text-main)" }}
      >
        {value}
      </p>
    </div>
  );
}

export default function AgendaPage() {
  const params = useParams();
  const router = useRouter();
  const slug =
    ((params as { slug?: string })?.slug as string) ||
    ((params as { Slug?: string })?.Slug as string);
  const agendaStateStorageKey = slug ? `orbyx-agenda-state-${slug}` : "";

    const [tenantId, setTenantId] = useState("");
const [slotMinutes, setSlotMinutes] = useState(30);
  const [businessName, setBusinessName] = useState("");
  const [businessCategory, setBusinessCategory] = useState("");
const [calendarId, setCalendarId] = useState("");
  const [branches, setBranches] = useState<BranchItem[]>([]);
  const [selectedBranchId, setSelectedBranchId] = useState("");
  const [loadingBranches, setLoadingBranches] = useState(false);

  const [staffList, setStaffList] = useState<StaffItem[]>([]);
  const [selectedStaffId, setSelectedStaffId] = useState("");
  const [loadingStaff, setLoadingStaff] = useState(false);
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [selectedServiceId, setSelectedServiceId] = useState("");
  const [loadingServices, setLoadingServices] = useState(false);
  const [modalServiceIds, setModalServiceIds] = useState<string[] | null>(null);

  const [businessHours, setBusinessHours] = useState<BusinessHourItem[]>([]);
  const [staffHours, setStaffHours] = useState<StaffHourItem[]>([]);
  const [businessSpecialDates, setBusinessSpecialDates] = useState<
    BusinessSpecialDateItem[]
  >([]);
  const [staffSpecialDates, setStaffSpecialDates] = useState<
    StaffSpecialDateItem[]
  >([]);

  const [weekBaseDate, setWeekBaseDate] = useState(new Date());
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [newAppointmentIds, setNewAppointmentIds] = useState<Set<string>>(new Set());
const [pendingCloseAllAppointments, setPendingCloseAllAppointments] = useState<Appointment[]>([]);
const [pendingClinicalNotes, setPendingClinicalNotes] = useState<Appointment[]>([]);
const [showPendingClinicalPanel, setShowPendingClinicalPanel] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedAppointment, setSelectedAppointment] =
    useState<Appointment | null>(null);
  const [customerNote, setCustomerNote] = useState("");
  const [savingNote, setSavingNote] = useState(false);
  const [noteSaved, setNoteSaved] = useState(false);
  const [selectedWeekGroup, setSelectedWeekGroup] =
    useState<WeekGroupedAppointmentsPopover>(null);
  const [selectedEmptySlotKey, setSelectedEmptySlotKey] = useState("");
  const [cancelConfirmAppointment, setCancelConfirmAppointment] =
    useState<Appointment | null>(null);
  const [manualBookingDraft, setManualBookingDraft] =
    useState<ManualBookingDraft | null>(null);
  const [manualBookingStep, setManualBookingStep] =
    useState<"form" | "confirm">("form");
  const [manualBookingSaving, setManualBookingSaving] = useState(false);
  const [manualBookingError, setManualBookingError] = useState("");
  const [freeSlotActionDraft, setFreeSlotActionDraft] =
    useState<FreeSlotActionDraft | null>(null);
  const [closedScheduleDraft, setClosedScheduleDraft] =
    useState<ClosedScheduleDraft | null>(null);
  const [agendaView, setAgendaView] = useState<"week" | "day">("week");
  const [activeFilter, setActiveFilter] = useState<FilterValue>("active");
const [showPendingPanel, setShowPendingPanel] = useState(false);
  const [clinicalPendingModal, setClinicalPendingModal] =
    useState<Appointment | null>(null);
  const [statusSaving, setStatusSaving] = useState(false);
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [closeSaving, setCloseSaving] = useState(false);
  const [closeError, setCloseError] = useState("");
  const [closeForm, setCloseForm] = useState<VeterinaryCloseForm>({
    control_type: "Control general",
    custom_control_type: "",
    control_note: "",
    diagnosis: "",
    treatment: "",
    symptoms: "",
    medications: "",
    referrals: "",
    follow_up_notes: "",
next_control_mode: "none",
next_control_exact_date: "",
next_control_custom_value: "",
next_control_custom_unit: "days",
  });

  const [searchQuery, setSearchQuery] = useState("");
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [searchResults, setSearchResults] = useState<Appointment[]>([]);
  const restoredAgendaStateKeyRef = useRef("");
  const skipNextAgendaStateSaveRef = useRef(false);
  const [hoveredTimeKey, setHoveredTimeKey] = useState("");
  const [hoveredSlotKey, setHoveredSlotKey] = useState("");

  const [isEditingReservation, setIsEditingReservation] = useState(false);
  const [editSaving, setEditSaving] = useState(false);
  const [editForm, setEditForm] = useState({
    customer_name: "",
    customer_phone: "",
    customer_email: "",
  });

  const [hoverCard, setHoverCard] = useState<HoverCardState>(null);

  const detailRef = useRef<HTMLDivElement | null>(null);
  const scrollRestoreRef = useRef<number | null>(null);
  const dayGridScrollRef = useRef<HTMLDivElement | null>(null);
  const dayTopScrollRef = useRef<HTMLDivElement | null>(null);
  const dayHeaderScrollRef = useRef<HTMLDivElement | null>(null);
  const dayGridDragRef = useRef({
    dragging: false,
    moved: false,
    startX: 0,
    scrollLeft: 0,
  });
  const [isDayGridDragging, setIsDayGridDragging] = useState(false);

  const branchStorageKey = useMemo(() => {
    return slug ? `orbyx_active_branch_${slug}` : "";
  }, [slug]);

  const isVeterinaria =
    businessCategory === "veterinaria" || businessCategory === "vet";
  const isClinica = businessCategory === "clinica";
  const isOdontologia = businessCategory === "odontologia";

  const CONTROL_TYPES_VET = [
    "Control general", "Primera consulta", "Control",
    "Vacuna", "Desparasitación", "Urgencia",
    "Cirugía", "Procedimiento", "Revisión post-op", "Otro",
  ];
  const CONTROL_TYPES_CLINICA = [
    "Primera consulta", "Control general", "Control",
    "Urgencia", "Cirugía", "Procedimiento",
    "Revisión post-op", "Teleconsulta",
    "Examen / Diagnóstico", "Resultado de exámenes",
    "Certificado médico", "Otro",
  ];
  const CONTROL_TYPES = isVeterinaria ? CONTROL_TYPES_VET : CONTROL_TYPES_CLINICA;

  function startOfWeek(date: Date) {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    d.setDate(diff);
    d.setHours(0, 0, 0, 0);
    return d;
  }

  function addDays(date: Date, days: number) {
    const d = new Date(date);
    d.setDate(d.getDate() + days);
    return d;
  }

  function formatDateYYYYMMDD(date: Date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }

  function formatHour(dateString: string) {
    return new Date(dateString).toLocaleTimeString("es-CL", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  }

  function getTimeKey(dateString: string) {
    return formatHour(dateString);
  }

  function getAppointmentBlockMinHeight(appt: Appointment) {
    const start = new Date(appt.start_at).getTime();
    const end = new Date(appt.end_at).getTime();
    const durationMinutes = Math.max((end - start) / 60000, 15);
    const rows = Math.max(durationMinutes / 30, 0.5);

    return Math.max(Math.round(rows * 54), 27);
  }

  function getAppointmentBlockDensity(height: number) {
    return {
      showPhone: height >= 56,
      showService: height >= 42,
    };
  }

  function getAppointmentInteractionClass(selected: boolean) {
    return selected
      ? "z-20 cursor-pointer shadow-2xl"
      : "z-10 cursor-pointer hover:z-20";
  }

  function formatLongDate(dateString: string) {
    const text = new Date(dateString).toLocaleDateString("es-CL", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });

    return text.charAt(0).toUpperCase() + text.slice(1);
  }

  function formatPopoverDay(date: Date) {
    const text = date.toLocaleDateString("es-CL", {
      weekday: "long",
      day: "numeric",
      month: "long",
    });

    return text.charAt(0).toUpperCase() + text.slice(1);
  }

function formatDayMonthLabel(date: Date) {
  const text = date.toLocaleDateString("es-CL", {
    day: "numeric",
    month: "long",
  });

  return text.charAt(0).toUpperCase() + text.slice(1);
}

function getWeekdayLabel(date: Date) {
  const text = date.toLocaleDateString("es-CL", {
    weekday: "long",
  });

  return text.charAt(0).toUpperCase() + text.slice(1);
}

  function formatRangeTitle(start: Date, end: Date) {
    const startText = start.toLocaleDateString("es-CL", {
      day: "numeric",
      month: "long",
    });

    const endText = end.toLocaleDateString("es-CL", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });

    return `${startText} – ${endText}`;
  }

  function formatCompactDateTime(dateString: string) {
    return new Date(dateString).toLocaleString("es-CL", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  }

  function timeStringToMinutes(value: string | null | undefined) {
    if (!value) return null;
    const [hours, minutes] = String(value).slice(0, 5).split(":").map(Number);
    if (Number.isNaN(hours) || Number.isNaN(minutes)) return null;
    return hours * 60 + minutes;
  }

  function generateDaySlots(
    day: Date,
    options?: {
      startMinutes?: number | null;
      endMinutes?: number | null;
    }
  ) {
    const slots: string[] = [];

    const startMinutes =
      options?.startMinutes !== undefined && options?.startMinutes !== null
        ? options.startMinutes
        : 9 * 60;

    const endMinutes =
      options?.endMinutes !== undefined && options?.endMinutes !== null
        ? options.endMinutes
        : 18 * 60;

    if (endMinutes <= startMinutes) {
      return slots;
    }

    const start = new Date(day);
    start.setHours(0, 0, 0, 0);
    start.setMinutes(startMinutes);

    const end = new Date(day);
    end.setHours(0, 0, 0, 0);
    end.setMinutes(endMinutes);

    const cursor = new Date(start);

    while (cursor < end) {
      slots.push(cursor.toISOString());
      cursor.setMinutes(cursor.getMinutes() + slotMinutes);
    }

    return slots;
  }

function generateSlotsFromWindows(
  day: Date,
  windows: { start: number; end: number }[]
) {
  return windows.flatMap((window) =>
    generateDaySlots(day, {
      startMinutes: window.start,
      endMinutes: window.end,
    })
  );
}

  function isPastPendingClosure(appt: Appointment) {
    return (
      appt.status === "booked" &&
      new Date(appt.start_at).getTime() < Date.now()
    );
  }

  function isCanceled(appt: Appointment) {
    return appt.status === "canceled";
  }

  function isVisibleAsActive(appt: Appointment) {
    return !isCanceled(appt);
  }

  function getVisualStatus(appt: Appointment) {
    if (isPastPendingClosure(appt)) return "pending_close";
    const now = Date.now();
    const start = new Date(appt.start_at).getTime();
    const end = new Date(appt.end_at).getTime();
    if (appt.status === "booked" && start <= now && now <= end) return "in_progress";
    return appt.status;
  }

  function getStatusLabel(appt: Appointment) {
    const visualStatus = getVisualStatus(appt);

    switch (visualStatus) {
      case "booked":
        return "Agendada";
      case "in_progress":
        return "En curso";
      case "pending":
        return "Pendiente";
      case "completed":
        return "Atendida";
      case "no_show":
        return "No asistió";
      case "rescheduled":
        return "Reagendó";
      case "pending_close":
        return "Pendiente de cierre";
      case "canceled":
        return "Cancelada";
      default:
        return appt.status || "Sin estado";
    }
  }

  function getCalendarBadgeLabel(appt: Appointment) {
    const visualStatus = getVisualStatus(appt);

    switch (visualStatus) {
      case "booked":
        return "Agendada";
      case "in_progress":
        return "En curso";
      case "pending":
        return "Pendiente";
      case "completed":
        return "Atendida";
      case "no_show":
        return "No asistió";
      case "rescheduled":
        return "Reagendó";
      case "pending_close":
        return "Pendiente";
      case "canceled":
        return "Cancelada";
      default:
        return "Estado";
    }
  }

  function getStatusBadgeClass(appt: Appointment) {
    const visualStatus = getVisualStatus(appt);

    switch (visualStatus) {
      case "booked":
        return "border-sky-200 bg-sky-50 text-sky-700";
      case "in_progress":
        return "border-cyan-200 bg-cyan-50 text-cyan-700";
      case "pending":
        return "border-orange-200 bg-orange-50 text-orange-700";
      case "completed":
        return "border-emerald-200 bg-emerald-50 text-emerald-700";
      case "no_show":
        return "border-amber-200 bg-amber-50 text-amber-800";
      case "rescheduled":
        return "border-violet-200 bg-violet-50 text-violet-700";
      case "pending_close":
        return "border-rose-200 bg-rose-50 text-rose-700";
      case "canceled":
        return "border-slate-200 bg-slate-100 text-slate-600";
      default:
        return "border-slate-200 bg-slate-100 text-slate-700";
    }
  }

  function getCardClass(appt: Appointment, selected: boolean) {
    const visualStatus = getVisualStatus(appt);

    if (selected) {
      return "border-cyan-200 bg-[linear-gradient(135deg,rgba(14,116,144,0.92),rgba(8,145,178,0.68))] text-white shadow-[0_0_0_1px_rgba(103,232,249,0.34),0_0_26px_-6px_rgba(34,211,238,0.95),0_14px_26px_-18px_rgba(8,47,73,0.9)]";
    }

    if (visualStatus === "pending_close") {
      return "border-red-300/80 bg-[linear-gradient(135deg,rgba(127,29,29,0.90),rgba(220,38,38,0.58))] text-white shadow-[0_0_18px_-10px_rgba(248,113,113,0.85)] hover:border-red-200 hover:shadow-[0_0_24px_-9px_rgba(248,113,113,0.95)]";
    }

    if (visualStatus === "completed") {
      return "border-emerald-300/80 bg-[linear-gradient(135deg,rgba(6,95,70,0.90),rgba(16,185,129,0.56))] text-white shadow-[0_0_18px_-10px_rgba(52,211,153,0.85)] hover:border-emerald-200 hover:shadow-[0_0_24px_-9px_rgba(52,211,153,0.95)]";
    }

    if (visualStatus === "no_show") {
      return "border-slate-300/65 bg-[linear-gradient(135deg,rgba(51,65,85,0.88),rgba(100,116,139,0.54))] text-white shadow-[0_0_16px_-11px_rgba(148,163,184,0.72)] opacity-90 hover:border-slate-200 hover:shadow-[0_0_22px_-10px_rgba(148,163,184,0.82)]";
    }

    if (visualStatus === "canceled") {
      return "border-slate-400/60 bg-[linear-gradient(135deg,rgba(30,41,59,0.90),rgba(100,116,139,0.45))] text-slate-100 opacity-80 hover:border-slate-300 hover:shadow-[0_0_20px_-11px_rgba(148,163,184,0.7)]";
    }

    if (visualStatus === "rescheduled") {
      return "border-violet-300/80 bg-[linear-gradient(135deg,rgba(91,33,182,0.90),rgba(139,92,246,0.56))] text-white shadow-[0_0_18px_-10px_rgba(167,139,250,0.85)] hover:border-violet-200 hover:shadow-[0_0_24px_-9px_rgba(167,139,250,0.95)]";
    }

    if (visualStatus === "pending") {
      return "border-orange-300/80 bg-[linear-gradient(135deg,rgba(154,52,18,0.90),rgba(245,158,11,0.56))] text-white shadow-[0_0_18px_-10px_rgba(251,146,60,0.85)] hover:border-orange-200 hover:shadow-[0_0_24px_-9px_rgba(251,146,60,0.95)]";
    }

    if (visualStatus === "in_progress") {
      return "border-cyan-200/85 bg-[linear-gradient(135deg,rgba(14,116,144,0.92),rgba(34,211,238,0.54))] text-white shadow-[0_0_20px_-9px_rgba(34,211,238,0.90)] hover:border-cyan-100 hover:shadow-[0_0_26px_-8px_rgba(34,211,238,0.98)]";
    }

    return "border-blue-300/80 bg-[linear-gradient(135deg,rgba(30,64,175,0.90),rgba(59,130,246,0.56))] text-white shadow-[0_0_18px_-10px_rgba(96,165,250,0.85)] hover:border-blue-200 hover:shadow-[0_0_24px_-9px_rgba(96,165,250,0.95)]";
  }

  function getAppointmentGroupKey(appt: Appointment) {
    return [
      new Date(appt.start_at).toISOString(),
      appt.service_id || "no_service",
      appt.staff_id || "no_staff",
      appt.branch_id || "no_branch",
    ].join("|");
  }

  function groupAppointmentsByBlock(items: Appointment[]) {
    const map = new Map<string, Appointment[]>();

    for (const appt of items) {
      const key = getAppointmentGroupKey(appt);
      const current = map.get(key) || [];
      current.push(appt);
      map.set(key, current);
    }

    return Array.from(map.values())
      .map((group) =>
        [...group].sort((a, b) =>
          String(a.customer_name || "").localeCompare(
            String(b.customer_name || ""),
            "es"
          )
        )
      )
      .sort(
        (a, b) =>
          new Date(a[0]?.start_at || 0).getTime() -
          new Date(b[0]?.start_at || 0).getTime()
      );
  }

  function getWeekSlotDisplayGroups(items: Appointment[]): WeekSlotDisplayGroup[] {
    const blockGroups = groupAppointmentsByBlock(items);
    const rangeMap = new Map<string, Appointment[][]>();

    for (const blockGroup of blockGroups) {
      const first = blockGroup[0];
      if (!first) continue;
      const key = `${new Date(first.start_at).toISOString()}|${new Date(
        first.end_at
      ).toISOString()}`;
      const current = rangeMap.get(key) || [];
      current.push(blockGroup);
      rangeMap.set(key, current);
    }

    return Array.from(rangeMap.entries())
      .map(([key, appointmentGroups]) => {
        const firstGroup = appointmentGroups[0] || [];
        const first = firstGroup[0];
        const isSingleGroupBlock =
          appointmentGroups.length === 1 && Boolean(first?.service_is_group);
        const appointments =
          appointmentGroups.length > 1
            ? appointmentGroups.flatMap((group) => {
                const appointment = group[0];
                return appointment ? [appointment] : [];
              })
            : firstGroup;

        return {
          key,
          appointmentGroups,
          appointments,
          isWeekSummary: appointmentGroups.length > 1 || isSingleGroupBlock,
        };
      })
      .filter((group) => group.appointments.length > 0)
      .sort(
        (a, b) =>
          new Date(a.appointments[0]?.start_at || 0).getTime() -
          new Date(b.appointments[0]?.start_at || 0).getTime()
      );
  }

  function isGroupAppointment(appt?: Appointment | null) {
    return appt?.service_is_group === true;
  }

  function getGroupBookingVisualState(group: Appointment[]) {
    const now = Date.now();
    const first = group[0];
    const active = group.filter((appt) => appt.status !== "canceled");
    const reviewed = active.filter((appt) =>
      ["completed", "no_show", "rescheduled"].includes(appt.status)
    );

    if (group.length > 0 && group.every((appt) => appt.status === "canceled")) {
      return {
        key: "canceled",
        label: "Cancelada",
        tooltip: "La actividad fue cancelada.",
      };
    }

    if (active.length > 0 && reviewed.length === active.length) {
      return {
        key: "closed",
        label: "Cerrada",
        tooltip: "La asistencia fue cerrada completamente.",
      };
    }

    if (reviewed.length > 0 && reviewed.length < active.length) {
      return {
        key: "partial",
        label: "Cierre parcial",
        tooltip:
          "La asistencia está parcialmente cerrada. Faltan asistentes por revisar.",
      };
    }

    if (
      first &&
      new Date(first.start_at).getTime() <= now &&
      now <= new Date(first.end_at).getTime()
    ) {
      return {
        key: "in_progress",
        label: "En curso",
        tooltip: "La actividad estÃ¡ en curso.",
      };
    }

    if (first && new Date(first.end_at).getTime() < now) {
      return {
        key: "pending",
        label: "Pendiente de cierre",
        tooltip: "La actividad finalizó y falta cerrar la asistencia.",
      };
    }

    return {
      key: "scheduled",
      label: "Programada",
      tooltip: "Esta actividad aún no comienza.",
    };
  }

  function getGroupBookingStyles(
    key: string,
    selected: boolean
  ): { card: string; icon: string; stateBadge: string; countBadge: string } {
    if (selected) {
      return {
        card: "border-cyan-200 bg-[linear-gradient(135deg,rgba(14,116,144,0.92),rgba(8,145,178,0.68))] text-white shadow-[0_0_0_1px_rgba(103,232,249,0.34),0_0_26px_-6px_rgba(34,211,238,0.95),0_14px_26px_-18px_rgba(8,47,73,0.9)]",
        icon: "text-white",
        stateBadge: "border-white/20 bg-white/10 text-white",
        countBadge: "border-white/20 bg-white/10 text-white",
      };
    }

    const styles: Record<
      string,
      { card: string; icon: string; stateBadge: string; countBadge: string }
    > = {
      scheduled: {
        card: "border-violet-300/80 bg-[linear-gradient(135deg,rgba(91,33,182,0.90),rgba(139,92,246,0.56))] text-white shadow-[0_0_18px_-10px_rgba(167,139,250,0.85)] hover:border-violet-200 hover:shadow-[0_0_24px_-9px_rgba(167,139,250,0.95)]",
        icon: "text-violet-200",
        stateBadge: "border-violet-300/30 bg-violet-400/10 text-violet-100",
        countBadge: "border-violet-300/35 bg-violet-400/15 text-violet-50",
      },
      pending: {
        card: "border-red-300/80 bg-[linear-gradient(135deg,rgba(127,29,29,0.90),rgba(220,38,38,0.58))] text-white shadow-[0_0_18px_-10px_rgba(248,113,113,0.85)] hover:border-red-200 hover:shadow-[0_0_24px_-9px_rgba(248,113,113,0.95)]",
        icon: "text-red-200",
        stateBadge: "border-red-300/30 bg-red-400/10 text-red-100",
        countBadge: "border-red-300/35 bg-red-400/15 text-red-50",
      },
      partial: {
        card: "border-orange-300/80 bg-[linear-gradient(135deg,rgba(154,52,18,0.90),rgba(245,158,11,0.56))] text-white shadow-[0_0_18px_-10px_rgba(251,146,60,0.85)] hover:border-orange-200 hover:shadow-[0_0_24px_-9px_rgba(251,146,60,0.95)]",
        icon: "text-orange-200",
        stateBadge: "border-orange-300/30 bg-orange-400/10 text-orange-100",
        countBadge: "border-orange-300/35 bg-orange-400/15 text-orange-50",
      },
      closed: {
        card: "border-emerald-300/80 bg-[linear-gradient(135deg,rgba(6,95,70,0.90),rgba(16,185,129,0.56))] text-white shadow-[0_0_18px_-10px_rgba(52,211,153,0.85)] hover:border-emerald-200 hover:shadow-[0_0_24px_-9px_rgba(52,211,153,0.95)]",
        icon: "text-emerald-200",
        stateBadge: "border-emerald-300/30 bg-emerald-400/10 text-emerald-100",
        countBadge: "border-emerald-300/35 bg-emerald-400/15 text-emerald-50",
      },
      canceled: {
        card: "border-slate-400/60 bg-[linear-gradient(135deg,rgba(30,41,59,0.90),rgba(100,116,139,0.45))] text-slate-100 opacity-85 hover:border-slate-300 hover:shadow-[0_0_20px_-11px_rgba(148,163,184,0.7)]",
        icon: "text-slate-300",
        stateBadge: "border-slate-300/25 bg-slate-400/10 text-slate-200",
        countBadge: "border-slate-300/25 bg-slate-400/10 text-slate-200",
      },
      in_progress: {
        card: "border-cyan-200/85 bg-[linear-gradient(135deg,rgba(14,116,144,0.92),rgba(34,211,238,0.54))] text-white shadow-[0_0_20px_-9px_rgba(34,211,238,0.90)] hover:border-cyan-100 hover:shadow-[0_0_26px_-8px_rgba(34,211,238,0.98)]",
        icon: "text-cyan-200",
        stateBadge: "border-cyan-300/30 bg-cyan-400/10 text-cyan-100",
        countBadge: "border-cyan-300/35 bg-cyan-400/15 text-cyan-50",
      },
    };

    return styles[key] || styles.scheduled;
  }

  function matchesFilter(appt: Appointment, filter: FilterValue) {
    if (filter === "active") return isVisibleAsActive(appt);
    if (filter === "pending_close") return isPastPendingClosure(appt);
    if (filter === "booked") {
      return appt.status === "booked" && !isPastPendingClosure(appt);
    }
    if (filter === "completed") return appt.status === "completed";
    if (filter === "no_show") return appt.status === "no_show";
    if (filter === "canceled") return appt.status === "canceled";
    return true;
  }

  function getFilterButtonClasses(
    filter: FilterValue,
    active: boolean,
    count: number
  ) {
    if (filter === "pending_close") {
      if (active) {
        return "inline-flex h-9 items-center justify-center rounded-xl border border-rose-600 bg-rose-600 px-3 text-xs font-semibold text-white shadow-sm transition hover:bg-rose-700";
      }

      if (count > 0) {
        return "inline-flex h-9 items-center justify-center rounded-xl border border-rose-300 bg-rose-50 px-3 text-xs font-semibold text-rose-700 shadow-sm transition hover:border-rose-400 hover:bg-rose-100";
      }

      return "inline-flex h-9 items-center justify-center rounded-xl border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 transition hover:bg-slate-50";
    }

    if (filter === "canceled") {
      if (active) {
        return "inline-flex h-9 items-center justify-center rounded-xl border border-slate-700 bg-slate-700 px-3 text-xs font-semibold text-white shadow-sm transition hover:bg-slate-800";
      }

      if (count > 0) {
        return "inline-flex h-9 items-center justify-center rounded-xl border border-slate-300 bg-slate-100 px-3 text-xs font-semibold text-slate-700 shadow-sm transition hover:border-slate-400 hover:bg-slate-200";
      }

      return "inline-flex h-9 items-center justify-center rounded-xl border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 transition hover:bg-slate-50";
    }

    if (active) {
      return "inline-flex h-9 items-center justify-center rounded-xl bg-slate-900 px-3 text-xs font-medium text-white transition hover:bg-slate-800";
    }

    return "inline-flex h-9 items-center justify-center rounded-xl border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 transition hover:bg-slate-50";
  }

  function syncEditForm(appt: Appointment | null) {
    setEditForm({
      customer_name: appt?.customer_name || "",
      customer_phone: appt?.customer_phone || "",
      customer_email: appt?.customer_email || "",
    });
  }

  function resetCloseForm() {
    setCloseForm({
      control_type: "Control general",
      custom_control_type: "",
      control_note: "",
      diagnosis: "",
      treatment: "",
      symptoms: "",
      medications: "",
      referrals: "",
      follow_up_notes: "",
next_control_mode: "none",
next_control_exact_date: "",
next_control_custom_value: "",
next_control_custom_unit: "days",
    });
    setCloseError("");
  }

  function openVeterinaryCloseModal() {
    resetCloseForm();
    setShowCloseModal(true);
  }

  function closeVeterinaryCloseModal() {
    if (closeSaving) return;
    setShowCloseModal(false);
    resetCloseForm();
  }

  function getResolvedControlType() {
    if (closeForm.control_type === "Otro") {
      return closeForm.custom_control_type.trim();
    }

    return closeForm.control_type.trim();
  }

  function handleSelectAppointment(appt: Appointment) {
    setSelectedAppointment(appt);
    setSelectedWeekGroup(null);
    setSelectedEmptySlotKey("");
    setIsEditingReservation(false);
    syncEditForm(appt);

    setTimeout(() => {
      detailRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 80);
  }

  function getEmptySlotKey(slotStart: string, staffId?: string | null) {
    return `${slotStart}|${staffId || selectedStaffId || "no_staff"}`;
  }

  function selectEmptySlot(slotStart: string, staffId?: string | null) {
    setSelectedAppointment(null);
    setSelectedWeekGroup(null);
    setIsEditingReservation(false);
    setHoverCard(null);
    setSelectedEmptySlotKey(getEmptySlotKey(slotStart, staffId));
  }

  function clearCalendarSelection() {
    setSelectedAppointment(null);
    setSelectedWeekGroup(null);
    setSelectedEmptySlotKey("");
    setIsEditingReservation(false);
    setHoverCard(null);
  }

  useEffect(() => {
    function handleDocumentClick(event: MouseEvent) {
      const target = event.target;

      if (!(target instanceof Element)) return;
      if (target.closest("[data-calendar-selectable='true']")) return;
      if (target.closest("[data-calendar-group-popover='true']")) return;

      clearCalendarSelection();
    }

    document.addEventListener("click", handleDocumentClick);
    return () => document.removeEventListener("click", handleDocumentClick);
  }, []);

  function openWeekGroupedAppointments(
    event: React.MouseEvent<HTMLButtonElement>,
    appointmentGroups: Appointment[][]
  ) {
    const first = appointmentGroups[0]?.[0];
    if (!first) return;

    const rect = event.currentTarget.getBoundingClientRect();
    const popoverWidth = 320;
    const popoverHeight = 260;
    const gap = 10;
    const viewportPadding = 12;
    const belowY = rect.bottom + gap;
    const x = Math.min(
      Math.max(viewportPadding, rect.left + rect.width / 2 - popoverWidth / 2),
      window.innerWidth - popoverWidth - viewportPadding
    );
    const y =
      belowY + popoverHeight > window.innerHeight
        ? Math.max(viewportPadding, rect.top - popoverHeight - gap)
        : belowY;
    const sourceX = rect.left + rect.width / 2;
    const sourceY = y < rect.top ? rect.top : rect.bottom;
    const targetX = x + popoverWidth / 2;
    const targetY = y < rect.top ? y + popoverHeight : y;
    const dx = targetX - sourceX;
    const dy = targetY - sourceY;
    const lineWidth = Math.max(Math.sqrt(dx * dx + dy * dy), 1);

    setSelectedAppointment(null);
    setSelectedEmptySlotKey("");
    setIsEditingReservation(false);
    setHoverCard(null);
    setSelectedWeekGroup({
      key: `${new Date(first.start_at).toISOString()}|${new Date(
        first.end_at
      ).toISOString()}`,
      appointmentGroups,
      dayLabel: formatPopoverDay(new Date(first.start_at)),
      timeLabel: `${formatHour(first.start_at)} - ${formatHour(first.end_at)}`,
      targetDate: new Date(first.start_at),
      x,
      y,
      lineLeft: sourceX,
      lineTop: sourceY,
      lineWidth,
      lineAngle: (Math.atan2(dy, dx) * 180) / Math.PI,
    });
  }

  function goToWeekGroupDetail() {
    if (!selectedWeekGroup) return;

    setWeekBaseDate(selectedWeekGroup.targetDate);
    setAgendaView("day");
    setSelectedWeekGroup(null);
    setSelectedAppointment(null);
    setSelectedEmptySlotKey("");
    setHoverCard(null);
  }

  function getEmptySlotClass(isSelected: boolean) {
    return isSelected
      ? "border-cyan-200/85 bg-cyan-400/15 shadow-[inset_0_0_0_1px_rgba(103,232,249,0.34),0_0_22px_-9px_rgba(34,211,238,0.95)]"
      : "";
  }

  function handleOpenSelectedGroup() {
    if (!selectedAppointment || !slug) return;

    const groupKey = encodeURIComponent(getAppointmentGroupKey(selectedAppointment));
    router.push(`/dashboard/${encodeURIComponent(slug)}/agenda/group/${groupKey}`);
  }

  useEffect(() => {
    setCustomerNote(selectedAppointment?.notes ?? "");
    setNoteSaved(false);
  }, [selectedAppointment?.id]);

  async function handleSaveCustomerNote() {
    if (!selectedAppointment?.id || !tenantId || !slug) return;
    if (customerNote.length > 300) return;
    setSavingNote(true);
    try {
      const res = await apiFetch(`${BACKEND_URL}/appointments/${selectedAppointment.id}/session-notes`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes: customerNote, slug }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || "No se pudo guardar la nota");
      }
      if (data?.appointment) {
        applyAppointmentUpdate({ ...selectedAppointment, notes: data.appointment.notes });
      }
      setNoteSaved(true);
      setTimeout(() => setNoteSaved(false), 2500);
    } catch (e) {
      console.error("Error guardando nota sesión:", e);
      setError(e instanceof Error ? e.message : "Error guardando nota");
    } finally {
      setSavingNote(false);
    }
  }

  function handleAppointmentMouseEnter(
  event: React.MouseEvent<HTMLButtonElement>,
  appt: Appointment
) {
  const rect = event.currentTarget.getBoundingClientRect();

  const hoverCardWidth = 290;
  const hoverCardHeight = 360;
  const gap = 12;
  const viewportPadding = 16;

  const nextX = Math.min(
    rect.right + gap,
    window.innerWidth - hoverCardWidth - viewportPadding
  );

  const nextY = Math.min(
    Math.max(viewportPadding, rect.top),
    window.innerHeight - hoverCardHeight - viewportPadding
  );

  setHoverCard({
    appointment: appt,
    x: nextX,
    y: nextY,
  });
}

  function handleAppointmentMouseLeave() {
    setHoverCard(null);
  }

  function readStoredBranchId() {
    if (typeof window === "undefined" || !branchStorageKey) return "";
    return localStorage.getItem(branchStorageKey) || "";
  }

  function applyAppointmentUpdate(updatedAppointment: Appointment) {
    setAppointments((prev) =>
      prev.map((appt) =>
        appt.id === updatedAppointment.id ? updatedAppointment : appt
      )
    );

    setSearchResults((prev) =>
      prev.map((appt) =>
        appt.id === updatedAppointment.id ? updatedAppointment : appt
      )
    );

    setSelectedAppointment((prev) =>
      prev && prev.id === updatedAppointment.id ? updatedAppointment : prev
    );

    setHoverCard((prev) =>
      prev && prev.appointment.id === updatedAppointment.id
        ? { ...prev, appointment: updatedAppointment }
        : prev
    );
  }

  function getStaffName(staffId?: string | null) {
    if (!staffId) return "Sin profesional";
    return (
      staffList.find((staff) => staff.id === staffId)?.name || "Profesional"
    );
  }

  function getStaffItem(staffId?: string | null) {
    if (!staffId) return null;
    return staffList.find((staff) => staff.id === staffId) || null;
  }

  function getStaffAvatar(staffId?: string | null) {
    const staff = getStaffItem(staffId);
    return staff?.photo_url || staff?.avatar || "";
  }

  function getStaffInitials(staffId?: string | null) {
    const name = getStaffName(staffId);
    return name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part.charAt(0).toUpperCase())
      .join("");
  }

  function getWeekdayForAgenda(date: Date) {
    const jsDay = date.getDay();
    return jsDay === 0 ? 0 : jsDay;
  }

  function applySpecialDateRulesToWindow(
    baseWindow: {
      startMinutes: number | null;
      endMinutes: number | null;
      hasConfiguredHours: boolean;
      fullyClosed?: boolean;
      closedLabel?: string;
    },
    specialDates: Array<{
      is_closed: boolean;
      start_time: string | null;
      end_time: string | null;
      label?: string | null;
    }>
  ) {
    if (!specialDates.length) {
      return baseWindow;
    }

    const fullDayClosedRow = specialDates.find(
      (row) => row.is_closed && !row.start_time && !row.end_time
    );

    if (fullDayClosedRow) {
      return {
        startMinutes: null,
        endMinutes: null,
        hasConfiguredHours: true,
        fullyClosed: true,
        closedLabel: (fullDayClosedRow.label || "").trim() || "No disponible",
      };
    }

    const openWindows = specialDates
      .filter((row) => !row.is_closed && row.start_time && row.end_time)
      .map((row) => ({
        start: timeStringToMinutes(row.start_time),
        end: timeStringToMinutes(row.end_time),
      }))
      .filter(
        (row) => row.start !== null && row.end !== null && row.end > row.start
      ) as { start: number; end: number }[];

    let workingWindows: { start: number; end: number }[] = [];

    if (
      baseWindow.startMinutes !== null &&
      baseWindow.endMinutes !== null &&
      baseWindow.endMinutes > baseWindow.startMinutes
    ) {
      workingWindows = [
        {
          start: baseWindow.startMinutes,
          end: baseWindow.endMinutes,
        },
      ];
    }

    if (openWindows.length > 0) {
      workingWindows = openWindows;
    }

    const partialClosedWindows = specialDates
      .filter((row) => row.is_closed && row.start_time && row.end_time)
      .map((row) => ({
        start: timeStringToMinutes(row.start_time),
        end: timeStringToMinutes(row.end_time),
      }))
      .filter(
        (row) => row.start !== null && row.end !== null && row.end > row.start
      ) as { start: number; end: number }[];

    for (const blocked of partialClosedWindows) {
      const nextWindows: { start: number; end: number }[] = [];

      for (const window of workingWindows) {
        if (blocked.end <= window.start || blocked.start >= window.end) {
          nextWindows.push(window);
          continue;
        }

        if (blocked.start > window.start) {
          nextWindows.push({
            start: window.start,
            end: blocked.start,
          });
        }

        if (blocked.end < window.end) {
          nextWindows.push({
            start: blocked.end,
            end: window.end,
          });
        }
      }

      workingWindows = nextWindows.filter((w) => w.end > w.start);
    }

    if (!workingWindows.length) {
      return {
        startMinutes: null,
        endMinutes: null,
        hasConfiguredHours: true,
        fullyClosed: false,
        closedLabel: "",
      };
    }

    workingWindows.sort((a, b) => a.start - b.start);

    return {
      startMinutes: workingWindows[0].start,
      endMinutes: workingWindows[workingWindows.length - 1].end,
      windows: workingWindows,
      hasConfiguredHours: true,
      fullyClosed: false,
      closedLabel: "",
    };
  }

  function getSelectedStaffClosedLabel(day: Date) {
    if (!selectedStaffId) return "";

    const dayKey = formatDateYYYYMMDD(day);

    const matchedRow = staffSpecialDates.find((item) => {
      const sameBranch =
        !item.branch_id || item.branch_id === selectedBranchId;

      return (
        sameBranch &&
        item.staff_id === selectedStaffId &&
        item.date === dayKey &&
        item.is_closed &&
        !item.start_time &&
        !item.end_time
      );
    });

    if (!matchedRow) return "";

    return (matchedRow.label || "").trim() || "No disponible";
  }


function getSelectedStaffDayWindow(day: Date) {
  const dayKey = formatDateYYYYMMDD(day);
  const weekday = getWeekdayForAgenda(day);

  const getFallbackWindow = () => ({
    startMinutes: null as number | null,
    endMinutes: null as number | null,
    hasConfiguredHours: true,
    fullyClosed: false,
    closedLabel: "",
  });

 if (!selectedStaffId) {
  const rows = businessHours.filter((item) => {
    const sameBranch = !item.branch_id || item.branch_id === selectedBranchId;
    return sameBranch && Number(item.day_of_week) === weekday && item.enabled;
  });

  const windows = rows
    .map((row) => ({
      start: timeStringToMinutes(row.start_time),
      end: timeStringToMinutes(row.end_time),
    }))
    .filter(
      (w) => w.start !== null && w.end !== null && w.end > w.start
    ) as { start: number; end: number }[];

  if (windows.length > 0) {
    return {
      windows,
      hasConfiguredHours: true,
      fullyClosed: false,
      closedLabel: "",
    };
  }

  return getFallbackWindow();
}

  const selectedStaff = staffList.find((staff) => staff.id === selectedStaffId);

  if (!selectedStaff) {
    return {
      startMinutes: 9 * 60,
      endMinutes: 18 * 60,
      hasConfiguredHours: false,
      fullyClosed: false,
      closedLabel: "",
    };
  }

  const hasStaffHours = staffHours.some(
    (item) =>
      item.staff_id === selectedStaffId &&
      (!item.branch_id || item.branch_id === selectedBranchId)
  );

  if (selectedStaff.use_business_hours || !hasStaffHours) {
    const row = businessHours.find((item) => {
      const sameBranch = !item.branch_id || item.branch_id === selectedBranchId;
      return sameBranch && Number(item.day_of_week) === weekday;
    });

    let baseWindow = getFallbackWindow();

    if (row?.enabled) {
      baseWindow = {
        startMinutes: timeStringToMinutes(row.start_time),
        endMinutes: timeStringToMinutes(row.end_time),
        hasConfiguredHours: true,
        fullyClosed: false,
        closedLabel: "",
      };
    }

    const businessRows = businessSpecialDates.filter((item) => {
      const sameBranch = !item.branch_id || item.branch_id === selectedBranchId;
      return sameBranch && item.date === dayKey;
    });

    const withBusinessRules = applySpecialDateRulesToWindow(
      baseWindow,
      businessRows
    );

    const staffRows = staffSpecialDates.filter((item) => {
      const sameBranch = !item.branch_id || item.branch_id === selectedBranchId;
      return sameBranch && item.staff_id === selectedStaffId && item.date === dayKey;
    });

    return applySpecialDateRulesToWindow(withBusinessRules, staffRows);
  }

  const row = staffHours.find((item) => {
    const sameBranch = !item.branch_id || item.branch_id === selectedBranchId;
    return (
      sameBranch &&
      item.staff_id === selectedStaffId &&
      Number(item.day_of_week) === weekday
    );
  });

  let baseWindow = getFallbackWindow();

  if (row?.enabled) {
    baseWindow = {
      startMinutes: timeStringToMinutes(row.start_time),
      endMinutes: timeStringToMinutes(row.end_time),
      hasConfiguredHours: true,
      fullyClosed: false,
      closedLabel: "",
    };
  }

  const specialRows = staffSpecialDates.filter((item) => {
    const sameBranch = !item.branch_id || item.branch_id === selectedBranchId;
    return sameBranch && item.staff_id === selectedStaffId && item.date === dayKey;
  });

  return applySpecialDateRulesToWindow(baseWindow, specialRows);
}


  async function loadBranches(currentTenantId: string) {
    try {
      setLoadingBranches(true);

      const response = await apiFetch(
        `${BACKEND_URL}/branches?tenant_id=${currentTenantId}`
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || "No se pudieron cargar las sucursales");
      }

      const rows: BranchItem[] = Array.isArray(data?.branches)
        ? data.branches
        : [];
      const activeRows = rows.filter((branch) => branch.is_active !== false);

      setBranches(activeRows);

      if (activeRows.length === 0) {
        setSelectedBranchId("");
        if (typeof window !== "undefined" && branchStorageKey) {
          localStorage.removeItem(branchStorageKey);
        }
        return;
      }

      const storedBranchId = readStoredBranchId();
      const storedExists = activeRows.some((branch) => branch.id === storedBranchId);

      if (storedExists) {
        setSelectedBranchId(storedBranchId);
        return;
      }

      const fallbackBranchId = activeRows[0].id;
      setSelectedBranchId(fallbackBranchId);

      if (typeof window !== "undefined" && branchStorageKey) {
        localStorage.setItem(branchStorageKey, fallbackBranchId);
      }
    } catch (err) {
      console.error("Error cargando sucursales", err);
      setBranches([]);
      setSelectedBranchId("");
    } finally {
      setLoadingBranches(false);
    }
  }

  async function loadStaff(currentTenantId: string, currentBranchId: string) {
    try {
      setLoadingStaff(true);

      const query = new URLSearchParams({
        tenant_id: currentTenantId,
        branch_id: currentBranchId,
        active: "true",
      });

      const response = await apiFetch(`${BACKEND_URL}/staff?${query.toString()}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || "No se pudo cargar el staff");
      }

      const rows: StaffItem[] = Array.isArray(data?.staff) ? data.staff : [];
      setStaffList(rows);

      setSelectedStaffId((prev) => {
        if (!prev) return "";
        const exists = rows.some((staff) => staff.id === prev);
        return exists ? prev : "";
      });
    } catch (err) {
      console.error("Error cargando staff", err);
      setStaffList([]);
      setSelectedStaffId("");
    } finally {
      setLoadingStaff(false);
    }
  }

  async function loadServices(currentTenantId: string, currentBranchId: string) {
    try {
      setLoadingServices(true);

      const query = new URLSearchParams({
        tenant_id: currentTenantId,
        branch_id: currentBranchId,
        active: "true",
      });

      const response = await apiFetch(`${BACKEND_URL}/services?${query.toString()}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || "No se pudo cargar los servicios");
      }

      const rows: ServiceItem[] = Array.isArray(data?.services)
        ? data.services
        : [];
      setServices(rows);

      setSelectedServiceId((prev) => {
        if (!prev) return "";
        const exists = rows.some((service) => service.id === prev);
        return exists ? prev : "";
      });
    } catch (err) {
      console.error("Error cargando servicios", err);
      setServices([]);
      setSelectedServiceId("");
    } finally {
      setLoadingServices(false);
    }
  }

  async function loadBusinessHours(
  currentTenantId: string,
  currentBranchId: string,
  useGlobal?: boolean
) {
  try {
    if (useGlobal === true) {
      // La sucursal delega al horario global (use_global_hours = true)
      const res = await apiFetch(
        `${BACKEND_URL}/business-hours?tenant_id=${currentTenantId}&scope=global`
      );
      const data = await res.json();
      setBusinessHours(Array.isArray(data?.hours) ? data.hours : []);
      return;
    }

    if (useGlobal === false) {
      // La sucursal tiene horario propio
      const res = await apiFetch(
        `${BACKEND_URL}/business-hours?tenant_id=${currentTenantId}&branch_id=${currentBranchId}`
      );
      const data = await res.json();
      setBusinessHours(Array.isArray(data?.hours) ? data.hours : []);
      return;
    }

    // useGlobal desconocido (branches aún no cargado) — intentar branch, fallback a global
    const branchRes = await apiFetch(
      `${BACKEND_URL}/business-hours?tenant_id=${currentTenantId}&branch_id=${currentBranchId}`
    );
    const branchData = await branchRes.json();
    const branchRows: BusinessHourItem[] = Array.isArray(branchData?.hours) ? branchData.hours : [];
    if (branchRows.length === 0) {
      const globalRes = await apiFetch(
        `${BACKEND_URL}/business-hours?tenant_id=${currentTenantId}&scope=global`
      );
      const globalData = await globalRes.json();
      setBusinessHours(Array.isArray(globalData?.hours) ? globalData.hours : []);
      return;
    }
    setBusinessHours(branchRows);
  } catch (err) {
    console.error("Error cargando business hours", err);
    setBusinessHours([]);
  }
}

  async function loadStaffHours(currentTenantId: string) {
    try {
      const response = await apiFetch(
        `${BACKEND_URL}/staff-hours?tenant_id=${currentTenantId}`
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.error || "No se pudieron cargar los horarios del staff"
        );
      }

      const rows: StaffHourItem[] = Array.isArray(data?.hours) ? data.hours : [];
      setStaffHours(rows);
    } catch (err) {
      console.error("Error cargando staff hours", err);
      setStaffHours([]);
    }
  }

  async function loadBusinessSpecialDates(
  currentTenantId: string,
  currentBranchId: string
) {
  try {
    const response = await apiFetch(
      `${BACKEND_URL}/business-special-dates?tenant_id=${currentTenantId}&branch_id=${currentBranchId}`
    );
    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data?.error ||
          "No se pudieron cargar las fechas especiales del negocio"
      );
    }

    const rows: BusinessSpecialDateItem[] = Array.isArray(data?.special_dates)
      ? data.special_dates
      : [];

    setBusinessSpecialDates(rows);
  } catch (err) {
    console.error("Error cargando business special dates", err);
    setBusinessSpecialDates([]);
  }
}

  async function loadStaffSpecialDates(currentTenantId: string) {
    try {
      const response = await apiFetch(
        `${BACKEND_URL}/staff-special-dates?tenant_id=${currentTenantId}`
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.error || "No se pudieron cargar las fechas especiales del staff"
        );
      }

      const rows: StaffSpecialDateItem[] = Array.isArray(data?.special_dates)
        ? data.special_dates
        : [];

      setStaffSpecialDates(rows);
    } catch (err) {
      console.error("Error cargando staff special dates", err);
      setStaffSpecialDates([]);
    }
  }

  const weekStart = useMemo(() => startOfWeek(weekBaseDate), [weekBaseDate]);
  const weekDays = useMemo(
    () => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)),
    [weekStart]
  );
  const weekEnd = weekDays[6];
  const calendarTimeSlots = useMemo(() => {
    const fallback = generateDaySlots(weekStart, {
      startMinutes: 9 * 60,
      endMinutes: 13 * 60,
    });
    const slots = new Set<string>();

    for (const day of weekDays) {
      const dayWindow = getSelectedStaffDayWindow(day);
      let daySlots: string[] = [];

      if ("windows" in dayWindow && Array.isArray(dayWindow.windows)) {
        const sortedWindows = [...dayWindow.windows].sort(
          (a, b) => a.start - b.start
        );
        const firstWindow = sortedWindows[0];
        const lastWindow = sortedWindows[sortedWindows.length - 1];

        daySlots =
          firstWindow && lastWindow
            ? generateDaySlots(day, {
                startMinutes: firstWindow.start,
                endMinutes: lastWindow.end,
              })
            : [];
      } else if (
        "startMinutes" in dayWindow &&
        "endMinutes" in dayWindow &&
        dayWindow.startMinutes !== null &&
        dayWindow.endMinutes !== null
      ) {
        daySlots = generateDaySlots(day, {
          startMinutes: dayWindow.startMinutes,
          endMinutes: dayWindow.endMinutes,
        });
      }

      for (const slot of daySlots) {
        slots.add(formatHour(slot));
      }
    }

    const source = slots.size
      ? Array.from(slots)
      : fallback.map((slot) => formatHour(slot));

    return source.sort((a, b) => a.localeCompare(b));
  }, [weekDays, selectedStaffId, staffHours, businessHours, staffSpecialDates, businessSpecialDates]);





  async function loadAppointments(options?: { preserveSelected?: boolean }) {
    try {
      setLoading(true);
      setError("");

      if (!selectedBranchId) {
        setAppointments([]);
        setSelectedAppointment(null);
        return;
      }

      const from = formatDateYYYYMMDD(weekStart);
      const to = formatDateYYYYMMDD(weekEnd);

      const query = new URLSearchParams({
        from,
        to,
        branch_id: selectedBranchId,
      });

      if (selectedStaffId) {
        query.set("staff_id", selectedStaffId);
      }

      const res = await apiFetch(
        `${BACKEND_URL}/appointments/by-range/${slug}?${query.toString()}`
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "No se pudo cargar la agenda");
      }

      const rows: Appointment[] = Array.isArray(data.appointments)
        ? data.appointments
        : [];

      setAppointments(rows);

      if (selectedAppointment) {
        const updatedSelected = rows.find(
          (appt) => appt.id === selectedAppointment.id
        );

        if (updatedSelected) {
          setSelectedAppointment(updatedSelected);
          if (!isEditingReservation) {
            syncEditForm(updatedSelected);
          }
        } else if (!options?.preserveSelected) {
          setSelectedAppointment(null);
        }
      }

      if (!options?.preserveSelected && rows.length === 0) {
        setSelectedAppointment(null);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error cargando agenda");
    } finally {
      setLoading(false);
    }
  }


async function loadPendingCloseAppointments() {
  try {
    if (!slug || !selectedBranchId) {
      setPendingCloseAllAppointments([]);
      return;
    }

    const query = new URLSearchParams({
      branch_id: selectedBranchId,
    });

    if (selectedStaffId) {
      query.set("staff_id", selectedStaffId);
    }

    const res = await apiFetch(
      `${BACKEND_URL}/appointments/pending-close/${slug}?${query.toString()}`
    );

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data?.error || "No se pudieron cargar los pendientes");
    }

    setPendingCloseAllAppointments(
      Array.isArray(data.appointments) ? data.appointments : []
    );
  } catch (err) {
    console.error("Error cargando pendientes globales", err);
    setPendingCloseAllAppointments([]);
  }
}


  async function loadPendingClinicalNotes() {
    try {
      if (!slug || !selectedBranchId || !(isVeterinaria || isClinica || isOdontologia)) {
        setPendingClinicalNotes([]);
        return;
      }

      const query = new URLSearchParams({ branch_id: selectedBranchId });
      if (selectedStaffId) query.set("staff_id", selectedStaffId);

      const res = await apiFetch(
        `${BACKEND_URL}/appointments/clinical-pending/${slug}?${query.toString()}`
      );
      const data = await res.json();
      setPendingClinicalNotes(Array.isArray(data.appointments) ? data.appointments : []);
    } catch {
      setPendingClinicalNotes([]);
    }
  }

  async function handleUpdateStatus(
    appointmentId: string,
    newStatus: "completed" | "no_show" | "rescheduled" | "canceled"
  ) {
    try {
      setStatusSaving(true);
      setError("");

      const isGeneric = !(isVeterinaria || isClinica || isOdontologia);
      const body: Record<string, unknown> = { status: newStatus };
      if (isGeneric && customerNote.trim()) {
        body.notes = customerNote.trim();
      }

      const res = await apiFetch(
        `${BACKEND_URL}/appointments/${appointmentId}/status`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(body),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "No se pudo actualizar el estado");
      }

      if (data?.appointment) {
        applyAppointmentUpdate(data.appointment);
      }

      if (isGeneric) {
        setCustomerNote("");
        setNoteSaved(false);
      }
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "Error actualizando estado"
      );
    } finally {
      setStatusSaving(false);
    }
  }

  async function handleAsistioClinico(appt: Appointment) {
    try {
      setStatusSaving(true);
      setError("");

      const res = await apiFetch(
        `${BACKEND_URL}/appointments/${appt.id}/status`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "completed" }),
        }
      );

      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "No se pudo actualizar el estado");

      if (data?.appointment) applyAppointmentUpdate(data.appointment);
      setClinicalPendingModal(appt);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error actualizando estado");
    } finally {
      setStatusSaving(false);
    }
  }

  async function handleCloseVeterinaryAppointment() {
    try {
      if (!selectedAppointment) return;

      const resolvedControlType = getResolvedControlType();

      if (!resolvedControlType) {
        setCloseError("Debes indicar el control realizado.");
        return;
      }

      if (
        closeForm.next_control_mode === "custom" &&
        (!closeForm.next_control_custom_value ||
          Number(closeForm.next_control_custom_value) < 1)
      ) {
        setCloseError("Debes indicar una cantidad válida para el próximo control.");
        return;
      }

      setCloseSaving(true);
      setCloseError("");
      setError("");

      const res = await apiFetch(
        `${BACKEND_URL}/appointments/${selectedAppointment.id}/close`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            control_type: resolvedControlType,
            control_note: closeForm.control_note.trim(),
            diagnosis: closeForm.diagnosis.trim() || null,
            treatment: closeForm.treatment.trim() || null,
            symptoms: closeForm.symptoms.trim() || null,
            medications: closeForm.medications.trim() || null,
            referrals: closeForm.referrals.trim() || null,
            follow_up_notes: closeForm.follow_up_notes.trim() || null,
next_control_mode: closeForm.next_control_mode,
next_control_exact_date:
  closeForm.next_control_mode === "exact_date"
    ? closeForm.next_control_exact_date
    : null,
next_control_custom_value:
              closeForm.next_control_mode === "custom"
                ? Number(closeForm.next_control_custom_value)
                : null,
            next_control_custom_unit:
              closeForm.next_control_mode === "custom"
                ? closeForm.next_control_custom_unit
                : null,
          }),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "No se pudo cerrar la atención");
      }

      if (data?.appointment) {
        applyAppointmentUpdate(data.appointment);
      }

      setShowCloseModal(false);
      resetCloseForm();
      await loadAppointments({ preserveSelected: true });
    } catch (err: unknown) {
      setCloseError(
        err instanceof Error ? err.message : "Error cerrando atención"
      );
    } finally {
      setCloseSaving(false);
    }
  }

  async function handleSearchAppointments() {
    try {
      setSearchLoading(true);
      setSearchError("");

      const trimmedQuery = searchQuery.trim();

      if (trimmedQuery.length < 2) {
        setSearchResults([]);
        setSearchError("Ingresa al menos 2 caracteres para buscar.");
        return;
      }

      const query = new URLSearchParams({
        q: trimmedQuery,
      });

      if (selectedBranchId) {
        query.set("branch_id", selectedBranchId);
      }

      if (selectedStaffId) {
        query.set("staff_id", selectedStaffId);
      }

      const res = await apiFetch(
        `${BACKEND_URL}/appointments/search/${slug}?${query.toString()}`
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "No se pudo buscar reservas");
      }

      const rows: Appointment[] = Array.isArray(data.appointments)
        ? data.appointments
        : [];

      setSearchResults(rows);

      if (rows.length === 0) {
        setSearchError("No encontramos reservas con esa búsqueda.");
      }
    } catch (err: unknown) {
      setSearchResults([]);
      setSearchError(
        err instanceof Error ? err.message : "Error buscando reservas"
      );
    } finally {
      setSearchLoading(false);
    }
  }

  async function handleSaveReservationEdit() {
    try {
      if (!selectedAppointment) return;

      setEditSaving(true);
      setError("");

      const res = await apiFetch(
        `${BACKEND_URL}/appointments/${selectedAppointment.id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            customer_name: editForm.customer_name.trim(),
            customer_phone: editForm.customer_phone.trim(),
            customer_email: editForm.customer_email.trim(),
          }),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "No se pudo actualizar la reserva");
      }

      const updatedAppointment: Appointment = data.appointment;
      applyAppointmentUpdate(updatedAppointment);
      syncEditForm(updatedAppointment);
      setIsEditingReservation(false);
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "Error actualizando reserva"
      );
    } finally {
      setEditSaving(false);
    }
  }

  function closeManualBookingModal() {
    setManualBookingDraft(null);
    setManualBookingStep("form");
    setManualBookingError("");
    setModalServiceIds(null);
    setManualBookingSaving(false);
  }

  function openManualBooking(slotStart: string, staffId?: string | null) {
    setManualBookingDraft({
      slot_start: slotStart,
      staff_id: staffId || selectedStaffId || "",
      staff_locked: Boolean(staffId || selectedStaffId),
      service_id: selectedServiceId || "",
      service_locked: Boolean(selectedServiceId),
      customer_name: "",
      customer_phone: "",
      customer_email: "",
      pet_name: "",
      pet_species: "",
      note: "",
    });
    setManualBookingStep("form");
    setManualBookingError("");
  }

  function openFreeSlotActions(slotStart: string, staffId?: string | null) {
    setFreeSlotActionDraft({
      slot_start: slotStart,
      staff_id: staffId || selectedStaffId || "",
      mode: "actions",
    });
  }

  function openClosedScheduleActions(
    staffId?: string | null,
    kind: "block" | "day" = "day"
  ) {
    setClosedScheduleDraft({
      staff_id: staffId || selectedStaffId || "",
      kind,
    });
  }

  function openManualBookingForGroup(appt: Appointment) {
    setManualBookingDraft({
      slot_start: appt.start_at,
      staff_id: appt.staff_id || "",
      staff_locked: true,
      service_id: appt.service_id || "",
      service_locked: true,
      customer_name: "",
      customer_phone: "",
      customer_email: "",
      pet_name: "",
      pet_species: "",
      note: "",
    });
    setManualBookingStep("form");
    setManualBookingError("");
  }

  function validateManualBookingDraft(draft: ManualBookingDraft) {
    if (!calendarId) return "No se encontró el calendario del negocio.";
    if (!selectedBranchId) return "Debes seleccionar una sucursal.";
    if (!draft.staff_id) return "Debes seleccionar un profesional.";
    if (!draft.service_id) return "Debes seleccionar un servicio.";
    if (!draft.customer_name.trim()) return "Ingresa el nombre del cliente.";
    if (!draft.customer_phone.trim()) return "Ingresa el teléfono del cliente.";
    if (!draft.customer_email.trim()) return "Ingresa el correo del cliente.";
    if (isVeterinaria && !draft.pet_name.trim()) {
      return "Ingresa el nombre de la mascota.";
    }
    if (isVeterinaria && !draft.pet_species.trim()) {
      return "Ingresa la especie de la mascota.";
    }
    return "";
  }

  async function handleConfirmManualBooking() {
    if (!manualBookingDraft) return;

    const validationError = validateManualBookingDraft(manualBookingDraft);
    if (validationError) {
      setManualBookingError(validationError);
      setManualBookingStep("form");
      return;
    }

    try {
      setManualBookingSaving(true);
      setManualBookingError("");

      const note = manualBookingDraft.note.trim();
      const customerData = {
        ...(note ? { manual_note: note } : {}),
        ...(isVeterinaria
          ? {
              pet_name: manualBookingDraft.pet_name.trim(),
              pet_species: manualBookingDraft.pet_species.trim(),
            }
          : {}),
      };

      const payload = {
        calendar_id: calendarId,
        branch_id: selectedBranchId || null,
        service_id: manualBookingDraft.service_id,
        staff_id: manualBookingDraft.staff_id,
        date: formatDateYYYYMMDD(new Date(manualBookingDraft.slot_start)),
        slot_start: manualBookingDraft.slot_start,
        customer_name: manualBookingDraft.customer_name.trim(),
        customer_phone: manualBookingDraft.customer_phone.trim(),
        customer_email: manualBookingDraft.customer_email.trim(),
        customer_data:
          Object.keys(customerData).length > 0 ? customerData : null,
      };

      const res = await apiFetch("/api/appointments/slot", {
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

      closeManualBookingModal();
      await loadAppointments({ preserveSelected: true });
    } catch (err: unknown) {
      setManualBookingError(
        err instanceof Error ? err.message : "Error creando reserva"
      );
      setManualBookingStep("form");
    } finally {
      setManualBookingSaving(false);
    }
  }

  useEffect(() => {
    if (!agendaStateStorageKey || typeof window === "undefined") return;
    if (restoredAgendaStateKeyRef.current === agendaStateStorageKey) return;

    restoredAgendaStateKeyRef.current = agendaStateStorageKey;

    try {
      const raw = sessionStorage.getItem(agendaStateStorageKey);
      if (!raw) return;

      skipNextAgendaStateSaveRef.current = true;
      const parsed = JSON.parse(raw) as {
        agendaView?: "week" | "day";
        weekBaseDate?: string;
        selectedStaffId?: string;
        selectedServiceId?: string;
        activeFilter?: FilterValue;
        searchQuery?: string;
      };

      if (parsed.agendaView === "week" || parsed.agendaView === "day") {
        setAgendaView(parsed.agendaView);
      }

      if (parsed.weekBaseDate) {
        const restoredDate = new Date(parsed.weekBaseDate);
        if (!Number.isNaN(restoredDate.getTime())) {
          setWeekBaseDate(restoredDate);
        }
      }

      if (typeof parsed.selectedStaffId === "string") {
        setSelectedStaffId(parsed.selectedStaffId);
      }

      if (typeof parsed.selectedServiceId === "string") {
        setSelectedServiceId(parsed.selectedServiceId);
      }

      if (parsed.activeFilter && filterValues.includes(parsed.activeFilter)) {
        setActiveFilter(parsed.activeFilter);
      }

      if (typeof parsed.searchQuery === "string") {
        setSearchQuery(parsed.searchQuery);
      }
    } catch {
      sessionStorage.removeItem(agendaStateStorageKey);
    }
  }, [agendaStateStorageKey]);

  useEffect(() => {
    if (!agendaStateStorageKey || typeof window === "undefined") return;
    if (restoredAgendaStateKeyRef.current !== agendaStateStorageKey) return;
    if (skipNextAgendaStateSaveRef.current) {
      skipNextAgendaStateSaveRef.current = false;
      return;
    }

    sessionStorage.setItem(
      agendaStateStorageKey,
      JSON.stringify({
        agendaView,
        weekBaseDate: weekBaseDate.toISOString(),
        selectedStaffId,
        selectedServiceId,
        activeFilter,
        searchQuery,
      })
    );
  }, [
    activeFilter,
    agendaStateStorageKey,
    agendaView,
    searchQuery,
    selectedServiceId,
    selectedStaffId,
    weekBaseDate,
  ]);

  useEffect(() => {
    if (!slug) return;

    async function loadInitial() {
      try {
        const businessRes = await apiFetch(`${BACKEND_URL}/public/business/${slug}`);
        const businessData: BusinessResponse | { error?: string } =
          await businessRes.json();

        if (!businessRes.ok) {
          throw new Error(
            "error" in businessData && businessData.error
              ? businessData.error
              : "No se pudo cargar el negocio"
          );
        }

        if (!("business" in businessData)) {
          throw new Error("Respuesta inválida del backend");
        }

                const currentTenantId = businessData.business.id;
setSlotMinutes(Number(businessData.slot_minutes || 30));
setCalendarId(businessData.calendar_id || "");
setTenantId(currentTenantId);
setBusinessName(businessData.business.name || slug || "");
setBusinessCategory(
  String(businessData.business.business_category || "").trim().toLowerCase()
);

        await Promise.all([
  loadBranches(currentTenantId),
  loadStaffHours(currentTenantId),
  loadStaffSpecialDates(currentTenantId),
]);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "No se pudo cargar agenda");
      }
    }

    loadInitial();
  }, [slug]);

  useEffect(() => {
  if (!tenantId || !selectedBranchId) {
    setStaffList([]);
    setSelectedStaffId("");
    setServices([]);
    setSelectedServiceId("");
    setManualBookingDraft(null);
    setFreeSlotActionDraft(null);
    setBusinessHours([]);
    setBusinessSpecialDates([]);
    return;
  }

  loadStaff(tenantId, selectedBranchId);
  loadServices(tenantId, selectedBranchId);
  loadBusinessSpecialDates(tenantId, selectedBranchId);
}, [tenantId, selectedBranchId]);

  // Efecto separado para horarios de negocio: reacciona a branches para honrar use_global_hours
  // aunque la sucursal tenga rows propios en la BD (legado)
  useEffect(() => {
    if (!tenantId || !selectedBranchId) return;
    const activeBranch = branches.find((b) => b.id === selectedBranchId);
    const useGlobal = branches.length > 0
      ? activeBranch?.use_global_hours !== false
      : undefined; // branches aún no cargado — loadBusinessHours usará fallback seguro
    loadBusinessHours(tenantId, selectedBranchId, useGlobal);
  }, [tenantId, selectedBranchId, branches]);

  useEffect(() => {
    if (!slug) return;
    if (!selectedBranchId) {
      setAppointments([]);
      setSelectedAppointment(null);
      setLoading(false);
      return;
    }

    loadAppointments();
loadPendingCloseAppointments();
loadPendingClinicalNotes();
  }, [slug, weekStart.getTime(), selectedBranchId, selectedStaffId]);

  useEffect(() => {
    function handleBranchChanged(event: Event) {
      const customEvent = event as CustomEvent<{
        slug?: string;
        branchId?: string;
      }>;
      const eventSlug = customEvent.detail?.slug;
      const branchId = customEvent.detail?.branchId || "";

      if (eventSlug !== slug) return;

      setSelectedBranchId(branchId);
      setSelectedStaffId("");
      setSelectedServiceId("");
      setSelectedAppointment(null);
      setSelectedWeekGroup(null);
      setManualBookingDraft(null);
      setFreeSlotActionDraft(null);
      setIsEditingReservation(false);
      setHoverCard(null);
      setSearchResults([]);
      setSearchQuery("");
      setSearchError("");
    }

    function handleStorage(event: StorageEvent) {
      if (event.key !== branchStorageKey) return;

      const nextBranchId = event.newValue || "";
      setSelectedBranchId(nextBranchId);
      setSelectedStaffId("");
      setSelectedServiceId("");
      setSelectedAppointment(null);
      setSelectedWeekGroup(null);
      setManualBookingDraft(null);
      setFreeSlotActionDraft(null);
      setIsEditingReservation(false);
      setHoverCard(null);
      setSearchResults([]);
      setSearchQuery("");
      setSearchError("");
    }

    window.addEventListener(
      "orbyx-branch-changed",
      handleBranchChanged as EventListener
    );
    window.addEventListener("storage", handleStorage);

    return () => {
      window.removeEventListener(
        "orbyx-branch-changed",
        handleBranchChanged as EventListener
      );
      window.removeEventListener("storage", handleStorage);
    };
  }, [slug, branchStorageKey]);

  useEffect(() => {
    function handleAppointmentNew(event: Event) {
      const customEvent = event as CustomEvent<Record<string, any>>;
      const row = customEvent.detail;
      console.log(
        "[DEBUG orbyx-appointment-new] id:",
        row?.id,
        "typeof id:",
        typeof row?.id,
        "branch_id:",
        row?.branch_id,
        "start_at:",
        row?.start_at
      );
      if (!row || !row.id || !row.start_at) return;
      if (row.branch_id !== selectedBranchId) return;
      if (selectedStaffId && row.staff_id !== selectedStaffId) return;

      const dayKey = formatDateYYYYMMDD(new Date(row.start_at));
      const isInCurrentWeek = weekDays.some(
        (d) => formatDateYYYYMMDD(d) === dayKey
      );
      if (!isInCurrentWeek) return;

      setAppointments((prev) => {
        if (prev.some((appt) => appt.id === row.id)) return prev;
        return [...prev, row as Appointment];
      });

      setNewAppointmentIds((prev) => {
        const next = new Set(prev);
        next.add(row.id);
        return next;
      });
      setTimeout(() => {
        setNewAppointmentIds((prev) => {
          const next = new Set(prev);
          next.delete(row.id);
          return next;
        });
      }, 60000);
    }

    function handleAppointmentCanceled(event: Event) {
      const customEvent = event as CustomEvent<{ id?: string }>;
      const id = customEvent.detail?.id;
      if (!id) return;

      setAppointments((prev) =>
        prev.map((appt) =>
          appt.id === id ? { ...appt, status: "canceled" } : appt
        )
      );
    }

    window.addEventListener(
      "orbyx-appointment-new",
      handleAppointmentNew as EventListener
    );
    window.addEventListener(
      "orbyx-appointment-canceled",
      handleAppointmentCanceled as EventListener
    );

    return () => {
      window.removeEventListener(
        "orbyx-appointment-new",
        handleAppointmentNew as EventListener
      );
      window.removeEventListener(
        "orbyx-appointment-canceled",
        handleAppointmentCanceled as EventListener
      );
    };
  }, [slug, selectedBranchId, weekStart.getTime(), selectedStaffId, weekDays]);

  const filteredAppointments = useMemo(() => {
    return appointments.filter(
      (appt) =>
        matchesFilter(appt, activeFilter) &&
        (!selectedServiceId || appt.service_id === selectedServiceId)
    );
  }, [appointments, activeFilter, selectedServiceId]);

  const appointmentsByDay = useMemo(() => {
    const result: Record<string, Appointment[]> = {};

    for (const day of weekDays) {
      result[formatDateYYYYMMDD(day)] = [];
    }

    for (const appt of filteredAppointments) {
      const key = formatDateYYYYMMDD(new Date(appt.start_at));
      if (!result[key]) result[key] = [];
      result[key].push(appt);
    }

    for (const key of Object.keys(result)) {
      result[key].sort(
        (a, b) =>
          new Date(a.start_at).getTime() - new Date(b.start_at).getTime()
      );
    }

    return result;
  }, [filteredAppointments, weekDays]);

  const todayKey = formatDateYYYYMMDD(new Date());
  const appointmentsToday = appointmentsByDay[todayKey] || [];

  const selectedGroupAppointments = useMemo(() => {
    if (!selectedAppointment) return [];

    const selectedKey = getAppointmentGroupKey(selectedAppointment);

    return appointments
      .filter((appt) => getAppointmentGroupKey(appt) === selectedKey)
      .sort((a, b) =>
        String(a.customer_name || "").localeCompare(
          String(b.customer_name || ""),
          "es"
        )
      );
  }, [appointments, selectedAppointment]);
  const selectedGroupVisibleAppointments = selectedGroupAppointments.slice(
    0,
    GROUP_ATTENDEE_PREVIEW_LIMIT
  );
  const selectedGroupVisibleCount = selectedGroupVisibleAppointments.length;

  const isSelectedGroupAppointment = isGroupAppointment(selectedAppointment);
  const selectedGroupActiveCount = selectedGroupAppointments.filter(
    (appt) => appt.status !== "canceled"
  ).length;
  const selectedGroupCapacity =
    Number(selectedAppointment?.service_capacity || 0) ||
    selectedGroupActiveCount ||
    selectedGroupAppointments.length;
  const selectedGroupAvailableSpots = Math.max(
    selectedGroupCapacity - selectedGroupActiveCount,
    0
  );
  const selectedGroupVisualState =
    isSelectedGroupAppointment && selectedGroupAppointments.length > 0
      ? getGroupBookingVisualState(selectedGroupAppointments)
      : null;
  const selectedGroupStyles = selectedGroupVisualState
    ? getGroupBookingStyles(selectedGroupVisualState.key, false)
    : null;

  const nextAppointment = useMemo(() => {
    const now = Date.now();

    return appointments
      .filter(
        (appt) =>
          new Date(appt.start_at).getTime() >= now && appt.status === "booked"
      )
      .sort(
        (a, b) =>
          new Date(a.start_at).getTime() - new Date(b.start_at).getTime()
      )[0];
  }, [appointments]);

  const pendingCloseAppointments = useMemo(() => {
    return appointments
      .filter(isPastPendingClosure)
      .sort(
        (a, b) =>
          new Date(a.start_at).getTime() - new Date(b.start_at).getTime()
      );
  }, [appointments]);

  const canceledAppointments = useMemo(() => {
    return appointments
      .filter((appt) => appt.status === "canceled")
      .sort(
        (a, b) =>
          new Date(a.start_at).getTime() - new Date(b.start_at).getTime()
      );
  }, [appointments]);

const pendingCloseCount = pendingCloseAllAppointments.length;
const hasPendingClose = pendingCloseCount > 0;

  const counts = useMemo(() => {
    return {
      active: appointments.filter(isVisibleAsActive).length,
      pending_close: appointments.filter(isPastPendingClosure).length,
      booked: appointments.filter(
        (appt) => appt.status === "booked" && !isPastPendingClosure(appt)
      ).length,
      completed: appointments.filter((appt) => appt.status === "completed")
        .length,
      no_show: appointments.filter((appt) => appt.status === "no_show").length,
      canceled: appointments.filter((appt) => appt.status === "canceled").length,
    };
  }, [appointments]);

  function goPrevWeek() {
    scrollRestoreRef.current = window.scrollY;
    setWeekBaseDate((prev) => addDays(prev, -7));
    setSelectedAppointment(null);
    setIsEditingReservation(false);
    setHoverCard(null);
  }

  function goNextWeek() {
    scrollRestoreRef.current = window.scrollY;
    setWeekBaseDate((prev) => addDays(prev, 7));
    setSelectedAppointment(null);
    setIsEditingReservation(false);
    setHoverCard(null);
  }

  function goToday() {
    setWeekBaseDate(new Date());
    setSelectedAppointment(null);
    setIsEditingReservation(false);
    setHoverCard(null);
  }

  useEffect(() => {
    if (loading) return;
    if (scrollRestoreRef.current === null) return;

    const targetScrollY = scrollRestoreRef.current;
    scrollRestoreRef.current = null;

    requestAnimationFrame(() => {
      window.scrollTo(0, targetScrollY);
    });
  }, [loading]);

  const selectedBranchName =
    branches.find((branch) => branch.id === selectedBranchId)?.name || "";

  const selectedStaffName =
    staffList.find((staff) => staff.id === selectedStaffId)?.name || "";
  const selectedDayKey = formatDateYYYYMMDD(weekBaseDate);
  const selectedDayAppointments = filteredAppointments.filter(
    (appt) => formatDateYYYYMMDD(new Date(appt.start_at)) === selectedDayKey
  );
  const dayStaffColumns = staffList.filter((staff) => {
    if (selectedStaffId) return staff.id === selectedStaffId;
    return staff.is_active !== false;
  });
  const dayViewSlots = calendarTimeSlots.length
    ? calendarTimeSlots.map((time) =>
        new Date(`${selectedDayKey}T${time}:00`).toISOString()
      )
    : generateDaySlots(weekBaseDate, {
        startMinutes: 9 * 60,
        endMinutes: 20 * 60,
      });
  const selectedDayWindow = getSelectedStaffDayWindow(weekBaseDate);
  const selectedDayClosedBySchedule =
    !!selectedStaffId &&
    selectedDayWindow.hasConfiguredHours &&
    selectedDayWindow.fullyClosed &&
    selectedDayAppointments.length === 0;
  const selectedDayHasNoWorkingWindow =
    !!selectedStaffId &&
    selectedDayWindow.hasConfiguredHours &&
    !selectedDayWindow.fullyClosed &&
    !("windows" in selectedDayWindow) &&
    selectedDayWindow.startMinutes === null &&
    selectedDayWindow.endMinutes === null &&
    selectedDayAppointments.length === 0;
  const selectedDayIsUnavailable =
    selectedDayClosedBySchedule || selectedDayHasNoWorkingWindow;
  const selectedDayAvailableSlots =
    "windows" in selectedDayWindow && Array.isArray(selectedDayWindow.windows)
      ? generateSlotsFromWindows(weekBaseDate, selectedDayWindow.windows)
      : "startMinutes" in selectedDayWindow &&
        "endMinutes" in selectedDayWindow &&
        selectedDayWindow.startMinutes !== null &&
        selectedDayWindow.endMinutes !== null
      ? generateDaySlots(weekBaseDate, {
          startMinutes: selectedDayWindow.startMinutes,
          endMinutes: selectedDayWindow.endMinutes,
        })
      : [];
  const selectedDayAvailableSlotKeys = new Set(
    selectedDayAvailableSlots.map(getTimeKey)
  );
  const dayTitle = new Intl.DateTimeFormat("es-CL", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(weekBaseDate);
  const formattedDayTitle =
    dayTitle.charAt(0).toUpperCase() + dayTitle.slice(1);
  const dayGridWidth = 64 + Math.max(dayStaffColumns.length, 1) * 260;

  function syncDayGridScroll(source: "top" | "grid") {
    const topScroller = dayTopScrollRef.current;
    const headerScroller = dayHeaderScrollRef.current;
    const gridScroller = dayGridScrollRef.current;
    if (!topScroller || !gridScroller) return;

    if (source === "top") {
      gridScroller.scrollLeft = topScroller.scrollLeft;
      if (headerScroller) {
        headerScroller.scrollLeft = topScroller.scrollLeft;
      }
    } else {
      topScroller.scrollLeft = gridScroller.scrollLeft;
      if (headerScroller) {
        headerScroller.scrollLeft = gridScroller.scrollLeft;
      }
    }
  }

  function setDayGridScrollLeft(scrollLeft: number) {
    const topScroller = dayTopScrollRef.current;
    const headerScroller = dayHeaderScrollRef.current;
    const gridScroller = dayGridScrollRef.current;
    if (!topScroller || !gridScroller) return;

    topScroller.scrollLeft = scrollLeft;
    if (headerScroller) {
      headerScroller.scrollLeft = scrollLeft;
    }
    gridScroller.scrollLeft = scrollLeft;
  }

  function handleDayGridMouseDown(event: React.MouseEvent<HTMLDivElement>) {
    const gridScroller = dayGridScrollRef.current;
    if (!gridScroller) return;

    dayGridDragRef.current = {
      dragging: true,
      moved: false,
      startX: event.clientX,
      scrollLeft: gridScroller.scrollLeft,
    };
    setIsDayGridDragging(true);
  }

  function handleDayGridMouseMove(event: React.MouseEvent<HTMLDivElement>) {
    const gridScroller = dayGridScrollRef.current;
    if (!gridScroller || !dayGridDragRef.current.dragging) return;

    event.preventDefault();
    const dragDelta = event.clientX - dayGridDragRef.current.startX;
    if (Math.abs(dragDelta) > 4) {
      dayGridDragRef.current.moved = true;
    }
    setDayGridScrollLeft(dayGridDragRef.current.scrollLeft - dragDelta);
  }

  function handleDayGridWheel(event: React.WheelEvent<HTMLDivElement>) {
    const gridScroller = dayGridScrollRef.current;
    if (!gridScroller) return;

    const horizontalDelta = event.shiftKey
      ? event.deltaY
      : Math.abs(event.deltaX) > Math.abs(event.deltaY)
      ? event.deltaX
      : 0;

    if (!horizontalDelta) return;
    event.preventDefault();
    setDayGridScrollLeft(gridScroller.scrollLeft + horizontalDelta);
  }

  function handleDayGridClickCapture(event: React.MouseEvent<HTMLDivElement>) {
    if (!dayGridDragRef.current.moved) return;
    event.preventDefault();
    event.stopPropagation();
    dayGridDragRef.current.moved = false;
  }

  function stopDayGridDrag(resetMoved = false) {
    if (!dayGridDragRef.current.dragging) return;
    dayGridDragRef.current.dragging = false;
    if (resetMoved) {
      dayGridDragRef.current.moved = false;
    }
    setIsDayGridDragging(false);
  }

  return (
    <div className="orbyx-agenda-page space-y-6 pb-6">
      <style>{`
        .orbyx-agenda-page {
          --agenda-hero-bg: linear-gradient(135deg, rgba(248,251,255,0.98), rgba(224,238,255,0.9) 48%, rgba(241,248,255,0.98));
          --agenda-hero-border: rgba(37,99,235,0.42);
          --agenda-hero-title: #0f172a;
          --agenda-hero-muted: #334155;
          --agenda-filter-bg: linear-gradient(135deg, rgba(248,251,255,0.92), rgba(238,242,248,0.86), rgba(230,236,245,0.82));
          --agenda-filter-label: #1e293b;
          --agenda-filter-control-bg: rgba(255,255,255,0.72);
          --agenda-filter-control-text: #0f172a;
          --agenda-calendar-column-bg: linear-gradient(180deg, #eef2f8, #e6ecf5 52%, #d7e0ec);
          --agenda-calendar-header-bg: linear-gradient(180deg, #eef2f8, #e6ecf5);
          --agenda-calendar-time-bg: linear-gradient(180deg, #eef2f8, #e6ecf5 54%, #dce5f0);
          --agenda-calendar-line: rgba(148,163,184,0.22);
          --agenda-calendar-line-soft: rgba(148,163,184,0.14);
          --agenda-calendar-hover: rgba(59,130,246,0.08);
          --agenda-today-bg: linear-gradient(180deg, rgba(219,234,254,0.98), rgba(226,232,240,0.92), rgba(215,224,236,0.86));
          --agenda-today-header-bg: linear-gradient(180deg, rgba(219,234,254,0.96), rgba(226,232,240,0.86));
          --agenda-closed-bg: repeating-linear-gradient(135deg, rgba(180,30,30,0.07) 0px, rgba(180,30,30,0.07) 8px, transparent 8px, transparent 18px), linear-gradient(180deg, rgba(180,30,30,0.14), rgba(150,20,20,0.10) 48%, rgba(180,30,30,0.12));
          --agenda-closed-bg-hover: repeating-linear-gradient(135deg, rgba(180,30,30,0.10) 0px, rgba(180,30,30,0.10) 8px, transparent 8px, transparent 18px), linear-gradient(180deg, rgba(200,40,40,0.20), rgba(160,25,25,0.16) 48%, rgba(200,40,40,0.18));
          --agenda-closed-border: rgba(180,30,30,0.22);
          --agenda-closed-line: rgba(180,30,30,0.14);
          --agenda-closed-line-soft: rgba(180,30,30,0.08);
          --agenda-closed-text: #c0392b;
          --agenda-closed-muted: rgba(150,30,30,0.70);
        }

        :root[data-theme="nocturno"] .orbyx-agenda-page {
          --agenda-hero-bg: linear-gradient(135deg, rgba(15,23,42,0.96), rgba(12,32,66,0.92) 50%, rgba(17,24,39,0.96));
          --agenda-hero-border: rgba(56,189,248,0.28);
          --agenda-hero-title: #f8fafc;
          --agenda-hero-muted: #cbd5e1;
          --agenda-filter-bg: linear-gradient(135deg, rgba(15,23,42,0.9), rgba(17,24,39,0.86), rgba(30,41,59,0.72));
          --agenda-filter-label: #e2e8f0;
          --agenda-filter-control-bg: rgba(15,23,42,0.62);
          --agenda-filter-control-text: #f8fafc;
          --agenda-calendar-column-bg: linear-gradient(180deg, rgba(15,23,42,0.96), rgba(17,24,39,0.94) 52%, rgba(30,41,59,0.9));
          --agenda-calendar-header-bg: linear-gradient(180deg, rgba(15,23,42,0.98), rgba(17,24,39,0.92));
          --agenda-calendar-time-bg: linear-gradient(180deg, rgba(15,23,42,0.98), rgba(17,24,39,0.94), rgba(30,41,59,0.9));
          --agenda-calendar-line: rgba(148,163,184,0.18);
          --agenda-calendar-line-soft: rgba(148,163,184,0.1);
          --agenda-calendar-hover: rgba(56,189,248,0.08);
          --agenda-today-bg: linear-gradient(180deg, rgba(30,64,175,0.28), rgba(14,116,144,0.14), rgba(15,23,42,0.94));
          --agenda-today-header-bg: linear-gradient(180deg, rgba(30,64,175,0.28), rgba(15,23,42,0.92));
          --agenda-closed-bg: repeating-linear-gradient(135deg, rgba(255,120,120,0.06) 0px, rgba(255,120,120,0.06) 8px, transparent 8px, transparent 18px), linear-gradient(180deg, rgba(160,30,30,0.28), rgba(120,20,20,0.22) 48%, rgba(140,25,25,0.24));
          --agenda-closed-bg-hover: repeating-linear-gradient(135deg, rgba(255,120,120,0.09) 0px, rgba(255,120,120,0.09) 8px, transparent 8px, transparent 18px), linear-gradient(180deg, rgba(180,40,40,0.36), rgba(140,25,25,0.30) 48%, rgba(160,30,30,0.32));
          --agenda-closed-border: rgba(248,113,113,0.42);
          --agenda-closed-line: rgba(254,202,202,0.2);
          --agenda-closed-line-soft: rgba(254,202,202,0.12);
        }
      `}</style>
<div
  className="relative overflow-hidden rounded-2xl border px-5 py-4 shadow-[0_18px_46px_-28px_rgba(37,99,235,0.55),0_0_34px_-24px_rgba(56,189,248,0.48)]"
  style={{
    borderColor: "var(--agenda-hero-border)",
    background: "var(--agenda-hero-bg)",
  }}
>
  <div
    className="pointer-events-none absolute inset-x-8 top-0 h-px"
    style={{
      background:
        "linear-gradient(90deg, transparent, rgba(37,99,235,0.42), rgba(34,211,238,0.35), transparent)",
    }}
  />
  <div className="relative flex items-center">
  <div className="flex items-center gap-4">
    <div
      className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border shadow-[0_18px_32px_-16px_rgba(37,99,235,0.95),0_0_26px_-12px_rgba(56,189,248,0.85)]"
      style={{
        borderColor: "rgba(147,197,253,0.72)",
        background:
          "linear-gradient(135deg, rgb(37 99 235), rgb(14 165 233) 48%, rgb(79 70 229))",
        color: "white",
      }}
    >
      <CalendarDays className="h-5 w-5" />
    </div>
    <div>
    <p
      className="text-[11px] font-semibold uppercase tracking-[0.24em]"
      style={{ color: "#2563eb" }}
    >
      Agenda
    </p>

    <h1
      className="mt-0.5 text-xl font-semibold"
      style={{ color: "var(--agenda-hero-title)" }}
    >
      Agenda semanal
    </h1>

    <p className="mt-0.5 text-sm" style={{ color: "var(--agenda-hero-muted)" }}>
      {selectedBranchName && selectedStaffName
        ? `Vista filtrada por sucursal ${selectedBranchName} y profesional ${selectedStaffName}.`
        : selectedBranchName
        ? `Vista filtrada por sucursal ${selectedBranchName}.`
        : selectedStaffName
        ? `Vista filtrada por profesional ${selectedStaffName}.`
        : `Gestiona las reservas de ${loading ? "tu negocio" : businessName}.`}
    </p>
  </div>
  </div>

  </div>
</div>

      <div className="hidden grid-cols-2 gap-3 xl:grid-cols-4">
        <StatCard
          title="Hoy"
          value={loading ? "..." : appointmentsToday.length}
        />
        <StatCard
          title="Semana"
          value={
            loading
              ? "..."
              : activeFilter === "active"
              ? counts.active
              : activeFilter === "pending_close"
              ? counts.pending_close
              : activeFilter === "booked"
              ? counts.booked
              : activeFilter === "completed"
              ? counts.completed
              : activeFilter === "no_show"
              ? counts.no_show
              : counts.canceled
          }
        />
        <StatCard
          title="Pendientes"
          value={loading ? "..." : pendingCloseCount}
        />
        <StatCard
          title="Próxima"
          value={
            loading
              ? "..."
              : nextAppointment
              ? formatHour(nextAppointment.start_at)
              : "--"
          }
        />
      </div>

      <div
        className="rounded-2xl border p-4 shadow-[0_16px_34px_-28px_rgba(15,23,42,0.45)]"
        style={{
          borderColor: "rgba(148,163,184,0.22)",
          background: "var(--agenda-filter-bg)",
        }}
      >
        <div className="grid gap-4 xl:grid-cols-[minmax(260px,1fr)_220px_220px_220px] xl:items-end">
          <div>
            <label
              className="mb-2 block text-xs font-semibold"
              style={{ color: "var(--agenda-filter-label)" }}
            >
              Buscar
            </label>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleSearchAppointments();
                  }
                }}
                placeholder="Buscar cliente o reserva..."
                className="h-11 w-full rounded-xl border py-2 pl-10 pr-3 text-sm outline-none transition focus:border-blue-300 focus:ring-4 focus:ring-blue-500/10"
                style={{
                  borderColor: "rgba(148,163,184,0.28)",
                  background: "var(--agenda-filter-control-bg)",
                  color: "var(--agenda-filter-control-text)",
                }}
              />
            </div>
          </div>

          <div>
            <label
              className="mb-2 block text-xs font-semibold"
              style={{ color: "var(--agenda-filter-label)" }}
            >
              Profesional
            </label>
            <select
              value={selectedStaffId}
              onChange={(e) => {
                setSelectedStaffId(e.target.value);
                setHoverCard(null);
                setSearchResults([]);
                setSearchError("");
              }}
              disabled={!selectedBranchId || loadingStaff}
              className="orbyx-agenda-filter-select h-11 w-full rounded-xl border px-3 text-sm outline-none transition disabled:cursor-not-allowed disabled:opacity-60"
              style={{
                borderColor: "rgba(148,163,184,0.28)",
                background: "var(--agenda-filter-control-bg)",
                color: "var(--agenda-filter-control-text)",
              }}
            >
              <option value="">Todos los profesionales</option>
              {staffList.map((staff) => (
                <option key={staff.id} value={staff.id}>
                  {staff.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              className="mb-2 block text-xs font-semibold"
              style={{ color: "var(--agenda-filter-label)" }}
            >
              Servicio
            </label>
            <select
              value={selectedServiceId}
              onChange={(e) => {
                setSelectedServiceId(e.target.value);
                setHoverCard(null);
              }}
              disabled={!selectedBranchId || loadingServices}
              className="orbyx-agenda-filter-select h-11 w-full rounded-xl border px-3 text-sm outline-none transition disabled:cursor-not-allowed disabled:opacity-60"
              style={{
                borderColor: "rgba(148,163,184,0.28)",
                background: "var(--agenda-filter-control-bg)",
                color: "var(--agenda-filter-control-text)",
              }}
            >
              <option value="">Todos los servicios</option>
              {services.map((service) => (
                <option key={service.id} value={service.id}>
                  {service.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              className="mb-2 block text-xs font-semibold"
              style={{ color: "var(--agenda-filter-label)" }}
            >
              Estado
            </label>
            <select
              value={activeFilter}
              onChange={(e) => {
                setActiveFilter(e.target.value as FilterValue);
                setHoverCard(null);
              }}
              className="orbyx-agenda-filter-select h-11 w-full rounded-xl border px-3 text-sm outline-none transition"
              style={{
                borderColor: "rgba(148,163,184,0.28)",
                background: "var(--agenda-filter-control-bg)",
                color: "var(--agenda-filter-control-text)",
              }}
            >
              {(Object.keys(filterLabels) as FilterValue[]).map((filter) => (
                <option key={filter} value={filter}>
                  {filterLabels[filter]}
                </option>
              ))}
            </select>
          </div>
        </div>

        {(searchError || searchResults.length > 0) && searchQuery.trim().length > 0 ? (
          <div className="mt-3">
            {searchError ? (
              <p className="text-xs font-medium text-amber-600">{searchError}</p>
            ) : null}

            {searchResults.length > 0 ? (
              <div className="mt-2 grid gap-2 md:grid-cols-2 xl:grid-cols-3">
                {searchResults.slice(0, 6).map((appt) => (
                  <button
                    key={appt.id}
                    type="button"
                    onClick={() => handleSelectAppointment(appt)}
                    className="rounded-xl border p-3 text-left transition hover:shadow-sm"
                    style={{
                      borderColor: "var(--border-color)",
                      background: "var(--bg-soft)",
                    }}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p
                          className="truncate text-sm font-semibold"
                          style={{ color: "var(--text-main)" }}
                        >
                          {appt.customer_name}
                        </p>
                        <p
                          className="mt-1 truncate text-xs"
                          style={{ color: "var(--text-muted)" }}
                        >
                          {appt.service_name_snapshot || "Reserva"} ·{" "}
                          {formatCompactDateTime(appt.start_at)}
                        </p>
                      </div>
                      <span
                        className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-semibold ${getStatusBadgeClass(
                          appt
                        )}`}
                      >
                        {getStatusLabel(appt)}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        ) : null}
      </div>

      {loadingBranches && !selectedBranchId ? (
        <div
          className="rounded-xl border px-4 py-3 text-sm"
          style={{
            borderColor: "var(--border-color)",
            background: "var(--bg-soft)",
            color: "var(--text-muted)",
          }}
        >
          Cargando sucursal activa...
        </div>
      ) : null}

      {!loadingBranches && !selectedBranchId ? (
        <Notice
          tone="warning"
          title="Debes seleccionar una sucursal activa."
          description="Selecciona una sucursal en el sidebar para ver la agenda."
        />
      ) : null}

      {hasPendingClose ? (
        <Notice
          tone="danger"
          title={`Tienes ${pendingCloseCount} cita${
            pendingCloseCount === 1 ? "" : "s"
          } pendiente${pendingCloseCount === 1 ? "" : "s"} de cierre.`}
          description="Revísalas para mantener la agenda actualizada."
        />
      ) : null}

      {(isVeterinaria || isClinica || isOdontologia) && pendingClinicalNotes.length > 0 ? (
        <button
          type="button"
          onClick={() => setShowPendingClinicalPanel(true)}
          className="w-full rounded-2xl border px-4 py-3 text-left transition hover:shadow-sm"
          style={{
            borderColor: "var(--border-color)",
            background: "var(--bg-soft)",
          }}
        >
          <p className="text-sm font-semibold" style={{ color: "var(--text-main)" }}>
            📋 {pendingClinicalNotes.length} ficha{pendingClinicalNotes.length === 1 ? "" : "s"} clínica{pendingClinicalNotes.length === 1 ? "" : "s"} pendiente{pendingClinicalNotes.length === 1 ? "" : "s"}
          </p>
          <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
            Toca para ver los pacientes con ficha sin completar.
          </p>
        </button>
      ) : null}

      {error ? <Notice tone="danger" title={error} /> : null}



{showPendingPanel ? (
  <div
    className="fixed inset-0 z-50 flex items-start justify-end"
    style={{ background: "rgba(0,0,0,0.45)", backdropFilter: "blur(4px)" }}
    onClick={() => setShowPendingPanel(false)}
  >
    <div
      className="relative flex h-full w-full max-w-sm flex-col border-l shadow-[−20px_0_60px_-20px_rgba(0,0,0,0.55)]"
      style={{
        background: "var(--bg-card)",
        borderColor: "var(--border-color)",
        animation: "slideInRight 0.22s cubic-bezier(0.22,1,0.36,1)",
      }}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Header */}
      <div
        className="flex shrink-0 items-center justify-between border-b px-5 py-4"
        style={{ borderColor: "var(--border-color)" }}
      >
        <div>
          <p className="text-[11px] uppercase tracking-widest font-semibold" style={{ color: "var(--text-muted)" }}>Agenda</p>
          <h3 className="mt-0.5 text-base font-bold" style={{ color: "var(--text-main)" }}>Pendientes de cierre</h3>
        </div>
        <button
          onClick={() => setShowPendingPanel(false)}
          className="flex h-8 w-8 items-center justify-center rounded-full border text-sm transition hover:shadow-sm"
          style={{ borderColor: "var(--border-color)", background: "var(--bg-soft)", color: "var(--text-muted)" }}
        >
          ✕
        </button>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {pendingCloseAllAppointments.length === 0 ? (
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>No hay pendientes.</p>
        ) : (
          pendingCloseAllAppointments.map((appt) => (
            <div
              key={appt.id}
              className="rounded-2xl border p-3.5 transition hover:shadow-sm"
              style={{ borderColor: "var(--border-color)", background: "var(--bg-soft)" }}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold" style={{ color: "var(--text-main)" }}>
                    {appt.customer_name}
                  </p>
                  {appt.customer_data?.pet_name ? (
                    <p className="mt-0.5 text-xs font-medium text-emerald-500">
                      🐶 {appt.customer_data.pet_name}
                    </p>
                  ) : null}
                </div>
                <span className="shrink-0 rounded-full border border-amber-400/40 bg-amber-400/10 px-2 py-0.5 text-[10px] font-semibold text-amber-500">
                  Pendiente
                </span>
              </div>

              <div className="mt-2 space-y-0.5">
                <p className="text-xs capitalize" style={{ color: "var(--text-muted)" }}>
                  {formatLongDate(appt.start_at)} · {formatHour(appt.start_at)}
                </p>
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                  {getStaffName(appt.staff_id)}
                </p>
              </div>

              <button
                onClick={() => {
                  setShowPendingPanel(false);
                  const date = new Date(appt.start_at);
                  setWeekBaseDate(date);
                  setTimeout(() => { handleSelectAppointment(appt); }, 100);
                }}
                className="mt-3 inline-flex h-8 w-full items-center justify-center rounded-xl text-xs font-semibold transition hover:opacity-90"
                style={{
                  background: "linear-gradient(135deg, rgba(30,64,175,0.90), rgba(37,99,235,0.70))",
                  color: "#fff",
                  boxShadow: "0 4px 14px -6px rgba(37,99,235,0.55)",
                }}
              >
                Ir a atención →
              </button>
            </div>
          ))
        )}
      </div>

      {/* Footer count */}
      <div
        className="shrink-0 border-t px-5 py-3 text-center text-xs"
        style={{ borderColor: "var(--border-color)", color: "var(--text-muted)" }}
      >
        {pendingCloseAllAppointments.length} atención{pendingCloseAllAppointments.length !== 1 ? "es" : ""} pendiente{pendingCloseAllAppointments.length !== 1 ? "s" : ""}
      </div>
    </div>
    <style>{`@keyframes slideInRight { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }`}</style>
  </div>
) : null}

{showPendingClinicalPanel ? (
  <div
    className="fixed inset-0 z-50 flex items-start justify-end bg-black/40"
    onClick={() => setShowPendingClinicalPanel(false)}
  >
    <div
      className="h-full w-full max-w-md p-5 shadow-xl"
      style={{ background: "var(--bg-card)" }}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold" style={{ color: "var(--text-main)" }}>
          Fichas clínicas pendientes
        </h3>
        <button
          onClick={() => setShowPendingClinicalPanel(false)}
          className="text-sm"
          style={{ color: "var(--text-muted)" }}
        >
          ✕
        </button>
      </div>

      <div className="mt-4 max-h-[80vh] space-y-3 overflow-y-auto">
        {pendingClinicalNotes.length === 0 ? (
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            No hay fichas pendientes.
          </p>
        ) : (
          pendingClinicalNotes.map((appt) => (
            <div
              key={appt.id}
              className="rounded-xl border p-3"
              style={{
                borderColor: "var(--border-color)",
                background: "var(--bg-soft)",
              }}
            >
              <p className="text-sm font-semibold" style={{ color: "var(--text-main)" }}>
                {appt.customer_name}
              </p>

              {appt.customer_data?.pet_name ? (
                <p className="text-xs text-emerald-600">
                  🐶 {appt.customer_data.pet_name}
                </p>
              ) : null}

              <p className="mt-1 text-xs" style={{ color: "var(--text-muted)" }}>
                {formatLongDate(appt.start_at)} · {formatHour(appt.start_at)}
              </p>

              <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                {appt.service_name_snapshot ?? ""}
              </p>

              <button
                onClick={() => {
                  setShowPendingClinicalPanel(false);
                  router.push(`/dashboard/${slug}/customers/${appt.customer_id}?appointment_id=${appt.id}&open_note=true`);
                }}
                className="mt-2 w-full rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700"
              >
                Completar ficha
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  </div>
) : null}

      <div className="relative">
        <section className="space-y-6">
          <div>
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <style>{`
                .orbyx-nav-energy {
                  position: relative;
                  isolation: isolate;
                  cursor: pointer;
                  overflow: hidden;
                  transition:
                    transform 180ms ease,
                    border-color 180ms ease,
                    box-shadow 180ms ease,
                    filter 180ms ease,
                    background 180ms ease;
                }

                .orbyx-nav-energy::after {
                  content: "";
                  position: absolute;
                  inset: -2px;
                  z-index: -1;
                  border-radius: inherit;
                  background: radial-gradient(circle at 50% 50%, rgba(59,130,246,0.32), transparent 62%);
                  opacity: 0;
                  transform: scale(0.78);
                  transition: opacity 180ms ease, transform 180ms ease;
                }

                .orbyx-nav-energy:hover {
                  border-color: rgba(59,130,246,0.62) !important;
                  box-shadow:
                    0 0 0 1px rgba(59,130,246,0.16),
                    0 12px 28px -18px rgba(37,99,235,0.85),
                    0 0 22px -12px rgba(56,189,248,0.8);
                  filter: saturate(1.08);
                  transform: translateY(-1px);
                }

                .orbyx-nav-energy:hover::after {
                  opacity: 1;
                  transform: scale(1);
                }

                .orbyx-nav-energy:active {
                  animation: orbyx-nav-pulse 260ms ease-out;
                  box-shadow:
                    0 0 0 3px rgba(96,165,250,0.22),
                    0 0 26px -8px rgba(59,130,246,0.95),
                    0 10px 24px -18px rgba(37,99,235,0.85);
                  transform: translateY(0) scale(0.98);
                }

                  .orbyx-nav-tab-active {
                  border-color: rgba(147,197,253,0.72) !important;
                  box-shadow:
                    0 0 0 1px rgba(147,197,253,0.2),
                    0 12px 28px -18px rgba(37,99,235,0.9),
                    0 0 24px -12px rgba(56,189,248,0.9);
                  }

                  .orbyx-agenda-filter-select option {
                    background: #0f3fcf;
                    color: #ffffff;
                  }

                  .orbyx-agenda-filter-select option:checked {
                    background: #2563eb;
                    color: #ffffff;
                  }

                @keyframes orbyx-nav-pulse {
                  0% {
                    box-shadow:
                      0 0 0 0 rgba(96,165,250,0.34),
                      0 0 18px -10px rgba(56,189,248,0.9);
                  }
                  70% {
                    box-shadow:
                      0 0 0 7px rgba(96,165,250,0),
                      0 0 30px -8px rgba(59,130,246,0.95);
                  }
                  100% {
                    box-shadow:
                      0 0 0 0 rgba(96,165,250,0),
                      0 0 18px -12px rgba(56,189,248,0.75);
                  }
                }
              `}</style>

              <div className="-mt-1 min-w-0">
              <h2
                className="text-base font-semibold leading-tight"
                style={{ color: "var(--text-main)" }}
              >
                {agendaView === "week" ? "Calendario semanal" : "Día por profesional"}
              </h2>
              <div
                className="mt-1 flex max-w-[520px] flex-wrap items-center gap-x-2.5 gap-y-1 text-[10px] font-medium"
                style={{ color: "var(--text-muted)" }}
              >
                {[
                  ["Confirmado", "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]"],
                  ["Falta cierre", "bg-red-400 shadow-[0_0_8px_rgba(248,113,113,0.8)]"],
                  ["Agendado", "bg-blue-400 shadow-[0_0_8px_rgba(96,165,250,0.8)]"],
                  ["Pendiente", "bg-orange-400 shadow-[0_0_8px_rgba(251,146,60,0.8)]"],
                  ["En curso", "bg-cyan-300 shadow-[0_0_8px_rgba(34,211,238,0.8)]"],
                  ["No-show", "bg-slate-400 shadow-[0_0_8px_rgba(148,163,184,0.55)]"],
                  ["Actividad grupal", "bg-violet-400 shadow-[0_0_8px_rgba(167,139,250,0.8)]"],
                ].map(([label, dotClass]) => (
                  <span key={label} className="inline-flex items-center gap-1.5 leading-none">
                    <span className={`h-2 w-2 rounded-full ${dotClass}`} />
                    {label}
                  </span>
                ))}
              </div>
              </div>

              <div className="flex flex-wrap items-center justify-end gap-2">
                {hasPendingClose ? (
                  <button
                    type="button"
onClick={() => {
  setShowPendingPanel(true);
}}
                    className={`inline-flex h-11 min-w-[128px] items-center justify-center rounded-2xl border border-rose-200 bg-rose-50 px-4 text-sm font-semibold text-rose-700 shadow-sm transition hover:border-rose-300 hover:bg-rose-100 ${
  pendingCloseCount > 0 ? "animate-pulse" : ""
}`}
                  >
                    Pendientes: {pendingCloseCount}
                  </button>
                ) : (
                  <div className="inline-flex h-11 min-w-[128px] items-center justify-center rounded-2xl border border-emerald-200 bg-emerald-50 px-4 text-sm font-semibold text-emerald-700">
                    Sin pendientes
                  </div>
                )}

                <div
                  className="flex items-center gap-2"
                  style={{
                    borderColor: "transparent",
                    background: "transparent",
                  }}
                >
                  <button
                    type="button"
                    onClick={() => {
                      if (agendaView === "day") {
                        scrollRestoreRef.current = window.scrollY;
                        setWeekBaseDate((prev) => addDays(prev, -1));
                        setSelectedAppointment(null);
                        setIsEditingReservation(false);
                        setHoverCard(null);
                        return;
                      }

                      goPrevWeek();
                    }}
                    className="orbyx-nav-energy inline-flex h-11 min-w-[118px] items-center justify-center gap-2 rounded-2xl border px-4 text-sm font-semibold"
                    style={{
                      borderColor: "rgba(37,99,235,0.28)",
                      background: "var(--bg-card)",
                      color: "#2563eb",
                    }}
                  >
                    {agendaView === "day" ? "← Día anterior" : "← Anterior"}
                  </button>

                  <button
                    type="button"
                    onClick={goToday}
                    className="orbyx-nav-energy inline-flex h-11 min-w-[72px] items-center justify-center gap-2 rounded-2xl border px-5 text-sm font-semibold text-white shadow-[0_14px_30px_-18px_rgba(37,99,235,0.9)]"
                    style={{
                      borderColor: "rgba(147,197,253,0.34)",
                      background:
                        "linear-gradient(135deg, rgb(37 99 235), rgb(14 165 233))",
                    }}
                  >
                    Hoy
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (agendaView === "day") {
                        scrollRestoreRef.current = window.scrollY;
                        setWeekBaseDate((prev) => addDays(prev, 1));
                        setSelectedAppointment(null);
                        setIsEditingReservation(false);
                        setHoverCard(null);
                        return;
                      }

                      goNextWeek();
                    }}
                    className="orbyx-nav-energy inline-flex h-11 min-w-[118px] items-center justify-center gap-2 rounded-2xl border px-4 text-sm font-semibold"
                    style={{
                      borderColor: "rgba(37,99,235,0.28)",
                      background: "var(--bg-card)",
                      color: "#2563eb",
                    }}
                  >
                    {agendaView === "day" ? "Día siguiente →" : "Siguiente →"}
                  </button>
                </div>

                <div
                  className="inline-flex h-10 min-w-[210px] items-center justify-center rounded-xl border px-3.5 text-sm font-semibold"
                  style={{
                    borderColor: "var(--border-color)",
                    background: "var(--bg-soft)",
                    color: "var(--text-main)",
                  }}
                >
                  {agendaView === "day"
                    ? formattedDayTitle
                    : formatRangeTitle(weekStart, weekEnd)}
                </div>

                <div
                  className="flex items-center rounded-2xl border p-1"
                  style={{
                    borderColor: "var(--border-color)",
                    background: "var(--agenda-calendar-header-bg)",
                  }}
                >
                  <button
                    type="button"
                    onClick={() => setAgendaView("week")}
                    className={`orbyx-nav-energy inline-flex h-9 items-center justify-center rounded-xl border px-4 text-xs font-semibold ${
                      agendaView === "week" ? "orbyx-nav-tab-active text-white" : ""
                    }`}
                    style={
                      agendaView === "week"
                        ? {
                            borderColor: "rgba(147,197,253,0.72)",
                            background:
                              "linear-gradient(135deg, rgb(37 99 235), rgb(14 165 233))",
                          }
                        : {
                            color: "var(--text-muted)",
                            borderColor: "transparent",
                          }
                    }
                  >
                    Semana
                  </button>
                  <button
                    type="button"
                    onClick={() => setAgendaView("day")}
                    className={`orbyx-nav-energy inline-flex h-9 items-center justify-center rounded-xl border px-4 text-xs font-semibold ${
                      agendaView === "day" ? "orbyx-nav-tab-active text-white" : ""
                    }`}
                    style={
                      agendaView === "day"
                        ? {
                            borderColor: "rgba(147,197,253,0.72)",
                            background:
                              "linear-gradient(135deg, rgb(37 99 235), rgb(14 165 233))",
                          }
                        : {
                            color: "var(--text-muted)",
                            borderColor: "transparent",
                          }
                    }
                  >
                    Día por profesional
                  </button>
                </div>

                <input
                  type="date"
                  value={formatDateYYYYMMDD(weekBaseDate)}
                  onChange={(e) => {
                    if (!e.target.value) return;
                    setWeekBaseDate(new Date(`${e.target.value}T12:00:00`));
                    setSelectedAppointment(null);
                    setIsEditingReservation(false);
                    setHoverCard(null);
                  }}
                  className="h-10 rounded-xl border px-3.5 text-sm outline-none transition"
                  style={{
                    borderColor: "var(--border-color)",
                    background: "var(--bg-card)",
                    color: "var(--text-main)",
                  }}
                />
              </div>
            </div>

            <div className="hidden flex-wrap gap-2">
              {(Object.keys(filterLabels) as FilterValue[]).map((filter) => {
                const count =
                  filter === "active"
                    ? counts.active
                    : filter === "pending_close"
                    ? counts.pending_close
                    : filter === "booked"
                    ? counts.booked
                    : filter === "completed"
                    ? counts.completed
                    : filter === "no_show"
                    ? counts.no_show
                    : counts.canceled;

                return (
                  <button
                    key={filter}
                    type="button"
                    onClick={() => setActiveFilter(filter)}
                    className={getFilterButtonClasses(
                      filter,
                      activeFilter === filter,
                      count
                    )}
                  >
                    {filterLabels[filter]} ({count})
                  </button>
                );
              })}
            </div>

            {!selectedBranchId ? (
              <div
                className="rounded-xl border border-dashed px-4 py-8 text-sm"
                style={{
                  borderColor: "var(--border-color)",
                  background: "var(--bg-soft)",
                  color: "var(--text-muted)",
                }}
              >
                Selecciona una sucursal en el sidebar para ver la agenda.
              </div>
            ) : loading ? (
              <div
                className="rounded-xl border border-dashed px-4 py-8 text-sm"
                style={{
                  borderColor: "var(--border-color)",
                  background: "var(--bg-soft)",
                  color: "var(--text-muted)",
                }}
              >
                Cargando agenda...
              </div>
            ) : agendaView === "day" ? (
              <div className="space-y-4">
                <style>{`
                  .orbyx-day-scrollbar {
                    scrollbar-width: auto;
                    scrollbar-color: color-mix(in srgb, #2563eb 70%, #38bdf8 30%) color-mix(in srgb, var(--bg-soft) 88%, transparent);
                  }

                  .orbyx-day-scrollbar::-webkit-scrollbar {
                    height: 18px;
                  }

                  .orbyx-day-scrollbar::-webkit-scrollbar-track {
                    background: color-mix(in srgb, var(--bg-soft) 88%, transparent);
                    border: 1px solid color-mix(in srgb, var(--border-color) 76%, transparent);
                    border-radius: 7px;
                    box-shadow: inset 0 1px 2px rgba(15,23,42,0.08);
                  }

                  .orbyx-day-scrollbar::-webkit-scrollbar-thumb {
                    background: linear-gradient(90deg, rgba(37,99,235,0.92), rgba(56,189,248,0.88));
                    border: 0;
                    border-radius: 6px;
                    box-shadow: 0 2px 10px rgba(37,99,235,0.22);
                  }

                  .orbyx-day-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: linear-gradient(90deg, rgba(29,78,216,0.92), rgba(14,165,233,0.9));
                  }

                  .orbyx-day-scrollbar::-webkit-scrollbar-button,
                  .orbyx-day-scrollbar::-webkit-scrollbar-button:single-button {
                    display: none;
                    width: 0;
                    height: 0;
                  }

                  .orbyx-day-grid-scroll {
                    scrollbar-width: none;
                    -ms-overflow-style: none;
                  }

                  .orbyx-day-grid-scroll::-webkit-scrollbar {
                    display: none;
                  }
                `}</style>

                <div
                  ref={dayTopScrollRef}
                  onScroll={() => syncDayGridScroll("top")}
                  className="orbyx-day-scrollbar h-[22px] min-w-0 overflow-x-auto overflow-y-hidden rounded-lg border"
                  style={{
                    borderColor: "var(--border-color)",
                    background:
                      "linear-gradient(180deg, color-mix(in srgb, var(--bg-card) 96%, transparent), color-mix(in srgb, var(--bg-soft) 92%, transparent))",
                  }}
                >
                  <div style={{ width: dayGridWidth, height: 1 }} />
                </div>

                <div
                  ref={dayHeaderScrollRef}
                  className="sticky z-20 overflow-x-hidden rounded-t-2xl border border-b-0 shadow-sm"
                  style={{
                    top: "78px",
                    borderColor: "var(--border-color)",
                    background: "var(--bg-card)",
                    backdropFilter: "blur(8px)",
                  }}
                >
                  <div
                    className="grid w-max min-w-max"
                    style={{
                      gridTemplateColumns: `64px repeat(${Math.max(
                        dayStaffColumns.length,
                        1
                      )}, 260px)`,
                      width: dayGridWidth,
                    }}
                  >
                    <div
                      className="sticky left-0 z-[22] flex h-[64px] items-center justify-center border-r px-3 text-xs font-semibold"
                      style={{
                        borderColor: "var(--border-color)",
                        background: "var(--agenda-calendar-time-bg)",
                        color: "var(--text-muted)",
                      }}
                    >
                      Hora
                    </div>

                    {dayStaffColumns.length === 0 ? (
                      <div
                        className="flex h-[64px] items-center px-4 text-sm"
                        style={{ color: "var(--text-muted)" }}
                      >
                        No hay profesionales activos para esta sucursal.
                      </div>
                    ) : (
                      dayStaffColumns.map((staff) => (
                        <div
                          key={staff.id}
                          className="flex h-[64px] items-center gap-3 border-r px-2.5 last:border-r-0"
                          style={{
                            borderColor: "var(--border-color)",
                            background: "var(--agenda-calendar-header-bg)",
                          }}
                        >
                          <div
                            className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl border text-sm font-bold text-white shadow-sm"
                            style={{
                              borderColor: "var(--border-color)",
                              background: staff.color || "#2563eb",
                            }}
                          >
                            {staff.photo_url || staff.avatar ? (
                              <img
                                src={staff.photo_url || staff.avatar || ""}
                                alt={staff.name}
                                className="h-full w-full scale-110 object-cover object-center"
                              />
                            ) : (
                              staff.name
                                .split(" ")
                                .map((part) => part[0])
                                .join("")
                                .slice(0, 2)
                            )}
                          </div>
                          <div className="min-w-0">
                            <p
                              className="truncate text-sm font-semibold"
                              style={{ color: "var(--text-main)" }}
                            >
                              {staff.name}
                            </p>
                            {staff.role ? (
                              <p
                                className="truncate text-xs"
                                style={{ color: "var(--text-muted)" }}
                              >
                                {staff.role}
                              </p>
                            ) : null}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div
                  ref={dayGridScrollRef}
                  onScroll={() => syncDayGridScroll("grid")}
                  onMouseDown={handleDayGridMouseDown}
                  onMouseMove={handleDayGridMouseMove}
                  onMouseUp={() => stopDayGridDrag()}
                  onMouseLeave={() => stopDayGridDrag(true)}
                  onWheel={handleDayGridWheel}
                  onClickCapture={handleDayGridClickCapture}
                  className={`orbyx-day-grid-scroll select-none overflow-x-hidden overflow-y-visible rounded-b-2xl border ${
                    isDayGridDragging ? "cursor-grabbing" : "cursor-grab"
                  }`}
                  style={{
                    borderColor: "var(--border-color)",
                    borderTop: "none",
                  }}
                >
                  <div
                    className="grid w-max min-w-max"
                    style={{
                      gridTemplateColumns: `64px repeat(${Math.max(
                        dayStaffColumns.length,
                        1
                      )}, 260px)`,
                      background: "var(--agenda-calendar-column-bg)",
                    }}
                  >
                    <div
                      className="sticky left-0 z-[2] border-r"
                      style={{
                        borderColor: "var(--border-color)",
                        background: "var(--agenda-calendar-time-bg)",
                      }}
                    >
                      {dayViewSlots.map((slot) => {
                        const timeKey = getTimeKey(slot);
                        return (
                          <div
                            key={slot}
                            className="flex h-[54px] items-start justify-end border-t px-3 pt-1.5 text-[11px]"
                            style={{
                              borderColor: "rgba(148,163,184,0.18)",
                              color:
                                hoveredTimeKey === timeKey
                                  ? "#2563eb"
                                  : "var(--text-muted)",
                              background:
                                hoveredTimeKey === timeKey
                                  ? "rgba(59,130,246,0.08)"
                                  : "transparent",
                            }}
                          >
                            {timeKey}
                          </div>
                        );
                      })}
                    </div>

                    {dayStaffColumns.length === 0 ? (
                      <div
                        className="p-6 text-sm"
                        style={{ color: "var(--text-muted)" }}
                      >
                        No hay profesionales activos para esta sucursal.
                      </div>
                    ) : (
                      dayStaffColumns.map((staff) => {
                        const staffAppointments = selectedDayAppointments.filter(
                          (appt) => appt.staff_id === staff.id
                        );

                        return (
                          <div
                            key={staff.id}
                            onClick={(event) => {
                              if (event.target === event.currentTarget) {
                                clearCalendarSelection();
                              }
                            }}
                            className="w-[260px] border-r last:border-r-0"
                            style={{ borderColor: "var(--border-color)" }}
                          >
                            <div className="space-y-0">
                              {dayViewSlots.map((slot, index) => {
                                const slotTime = new Date(slot).getTime();
                                const slotTimeKey = getTimeKey(slot);
                                const slotAppointments = staffAppointments.filter(
                                  (a) =>
                                    new Date(a.start_at).getTime() === slotTime
                                );
                                const isCoveredByLongAppointment =
                                  staffAppointments.some((a) => {
                                    const start = new Date(a.start_at).getTime();
                                    const end = new Date(a.end_at).getTime();
                                    return start < slotTime && end > slotTime;
                                  });
                                const slotGroups =
                                  groupAppointmentsByBlock(slotAppointments);
                                const isHourStart = index % 2 === 0;
                                const isSlotClosed =
                                  selectedDayIsUnavailable ||
                                  !selectedDayAvailableSlotKeys.has(slotTimeKey);
                                const isEmptySlotSelected =
                                  selectedEmptySlotKey ===
                                  getEmptySlotKey(slot, staff.id);

                                const daySlotKey = slotTimeKey + '|' + staff.id;
                                if (isCoveredByLongAppointment) {
                                  return (
                                    <div
                                      key={slot}
                                      className="h-[54px] border-t"
                                      onMouseEnter={() => { setHoveredTimeKey(slotTimeKey); setHoveredSlotKey(daySlotKey); }}
                                      onMouseLeave={() => { setHoveredTimeKey(""); setHoveredSlotKey(""); }}
                                      style={{
                                        borderColor: isHourStart
                                          ? "rgba(148,163,184,0.22)"
                                          : "rgba(148,163,184,0.14)",
                                        background:
                                          hoveredSlotKey === daySlotKey
                                            ? "rgba(59,130,246,0.14)"
                                            : hoveredTimeKey === slotTimeKey
                                            ? "rgba(59,130,246,0.04)"
                                            : "transparent",
                                      }}
                                    />
                                  );
                                }

                                if (slotGroups.length === 0) {
                                  return (
                                        <div
                                          key={slot}
                                          data-calendar-selectable="true"
                                          role="button"
                                      tabIndex={0}
                                      onClick={() => {
                                        selectEmptySlot(slot, staff.id);
                                        if (isSlotClosed) {
                                          openClosedScheduleActions(
                                            staff.id,
                                            selectedDayIsUnavailable ? "day" : "block"
                                          );
                                        } else {
                                          openFreeSlotActions(slot, staff.id);
                                        }
                                      }}
                                      onKeyDown={(event) => {
                                        if (event.key === "Enter" || event.key === " ") {
                                          event.preventDefault();
                                          if (isSlotClosed) {
                                            selectEmptySlot(slot, staff.id);
                                            openClosedScheduleActions(
                                              staff.id,
                                              selectedDayIsUnavailable ? "day" : "block"
                                            );
                                          } else {
                                            selectEmptySlot(slot, staff.id);
                                            openFreeSlotActions(slot, staff.id);
                                          }
                                        }
                                      }}
                                      onMouseEnter={() => { setHoveredTimeKey(slotTimeKey); setHoveredSlotKey(daySlotKey); }}
                                      onMouseLeave={() => { setHoveredTimeKey(""); setHoveredSlotKey(""); }}
                                      className={`flex h-[54px] cursor-pointer items-center justify-center border-t px-2 text-[10px] font-semibold transition ${getEmptySlotClass(isEmptySlotSelected)}`}
                                      style={{
                                        borderColor: isHourStart
                                          ? isSlotClosed
                                             ? "var(--agenda-closed-line)"
                                            : isEmptySlotSelected
                                            ? "rgba(103,232,249,0.72)"
                                            : "rgba(148,163,184,0.22)"
                                          : isSlotClosed
                                           ? "var(--agenda-closed-line-soft)"
                                          : isEmptySlotSelected
                                          ? "rgba(103,232,249,0.58)"
                                          : "rgba(148,163,184,0.14)",
                                        background:
                                          isSlotClosed
                                            ? hoveredSlotKey === daySlotKey
                                              ? "var(--agenda-closed-bg-hover)"
                                              : "var(--agenda-closed-bg)"
                                            : isEmptySlotSelected
                                            ? "linear-gradient(180deg, rgba(34,211,238,0.22), rgba(37,99,235,0.12))"
                                            : hoveredSlotKey === daySlotKey
                                            ? "rgba(59,130,246,0.14)"
                                            : hoveredTimeKey === slotTimeKey
                                            ? "rgba(59,130,246,0.04)"
                                            : "transparent",
                                        color: "var(--text-muted)",
                                      }}
                                    >
                                      {""}
                                    </div>
                                  );
                                }

                                return (
                                  <div
                                    key={slot}
                                    onMouseEnter={() => { setHoveredTimeKey(slotTimeKey); setHoveredSlotKey(daySlotKey); }}
                                    onMouseLeave={() => { setHoveredTimeKey(""); setHoveredSlotKey(""); }}
                                    className="relative h-[54px] border-t"
                                    style={{
                                      borderColor: isHourStart
                                        ? "rgba(148,163,184,0.22)"
                                        : "rgba(148,163,184,0.14)",
                                      background:
                                        hoveredSlotKey === daySlotKey
                                          ? "rgba(59,130,246,0.14)"
                                          : hoveredTimeKey === slotTimeKey
                                          ? "rgba(59,130,246,0.04)"
                                          : "transparent",
                                    }}
                                  >
                                    {slotGroups.map((group) => {
                                      const appt = group[0];
                                      const isGroupSlot =
                                        isGroupAppointment(appt);
                                      const selectedKey = selectedAppointment
                                        ? getAppointmentGroupKey(
                                            selectedAppointment
                                          )
                                        : "";
                                      const isSelected = Boolean(
                                        selectedKey &&
                                          selectedKey ===
                                            getAppointmentGroupKey(appt)
                                      );
                                      const groupVisualState = isGroupSlot
                                        ? getGroupBookingVisualState(group)
                                        : null;
                                      const groupStyles = groupVisualState
                                        ? getGroupBookingStyles(
                                            groupVisualState.key,
                                            isSelected
                                          )
                                        : null;
                                      const activeGroupCount = group.filter(
                                        (attendee) =>
                                          attendee.status !== "canceled"
                                      ).length;
                                      const groupCapacity =
                                        Number(appt.service_capacity || 0) ||
                                        activeGroupCount ||
                                        group.length;
                                      const appointmentBlockHeight =
                                        getAppointmentBlockMinHeight(appt);
                                      const appointmentDensity =
                                        getAppointmentBlockDensity(
                                          appointmentBlockHeight
                                        );

                                      return (
                                          <button
                                            key={getAppointmentGroupKey(appt)}
                                            type="button"
                                            data-calendar-selectable="true"
                                          onClick={() =>
                                            handleSelectAppointment(appt)
                                          }
                                          onMouseEnter={(e) => {
                                            setHoveredTimeKey(
                                              getTimeKey(appt.start_at)
                                            );
                                            handleAppointmentMouseEnter(e, appt);
                                          }}
                                          onMouseLeave={() => {
                                            setHoveredTimeKey("");
                                            handleAppointmentMouseLeave();
                                          }}
                                          className={`absolute inset-x-0 top-0 z-10 overflow-hidden rounded-sm border py-0.5 text-left transition duration-200 ease-out ${
                                            isGroupSlot ? "px-1" : "px-1.5"
                                          } ${getAppointmentInteractionClass(
                                            isSelected
                                          )} ${
                                            isGroupSlot && groupStyles
                                              ? groupStyles.card
                                              : getCardClass(appt, isSelected)
                                          }`}
                                          style={{
                                            height: appointmentBlockHeight,
                                          }}
                                        >
                                          {isGroupSlot &&
                                          groupVisualState &&
                                          groupStyles ? (
                                            <div className="flex h-full min-w-0 flex-col justify-between gap-px overflow-hidden leading-none">
                                              <p className="truncate text-[10px] font-semibold leading-none text-white">
                                                {appt.service_name_snapshot ||
                                                  "Actividad grupal"}
                                              </p>
                                              <p
                                                className={`inline-flex w-fit max-w-full truncate rounded-full border px-1.5 py-0.5 text-[8px] font-semibold leading-none ${groupStyles.countBadge}`}
                                              >
                                                {activeGroupCount}/{groupCapacity} inscritos
                                              </p>
                                            </div>
                                          ) : (
                                            <div className="flex h-full min-w-0 flex-col justify-between gap-px overflow-hidden leading-none">
                                              <p className="truncate text-[10px] font-semibold leading-none text-white">
                                                {appt.customer_name}
                                              </p>
                                              {appointmentDensity.showPhone ? (
                                              <p className="truncate text-[9px] leading-none text-slate-200">
                                                {appt.customer_phone ||
                                                  "Teléfono no disponible"}
                                              </p>
                                              ) : null}
                                              {appointmentDensity.showService ? (
                                              <p className="truncate text-[9px] leading-none text-slate-300">
                                                {appt.service_name_snapshot ||
                                                  "Reserva"}
                                              </p>
                                              ) : null}
                                            </div>
                                          )}
                                        </button>
                                      );
                                    })}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-[54px_repeat(7,minmax(0,1fr))] xl:gap-0">
                <div
                  className="hidden rounded-l-2xl border xl:block"
                  style={{
                    borderColor: "var(--agenda-calendar-line)",
                    background: "var(--agenda-calendar-time-bg)",
                  }}
                >
                    <div className="h-[58px]" />
                  <div className="space-y-0">
                    {calendarTimeSlots.map((time) => (
                      <div
                        key={time}
                        className="flex h-[54px] items-start justify-end border-t pt-1.5 text-[11px]"
                        style={{
                          borderColor: "rgba(148,163,184,0.18)",
                          color:
                            hoveredTimeKey === time
                              ? "#2563eb"
                              : "var(--text-muted)",
                          background:
                            hoveredTimeKey === time
                              ? "rgba(59,130,246,0.08)"
                              : "transparent",
                        }}
                      >
                        {time}
                      </div>
                    ))}
                  </div>
                </div>
                {weekDays.map((day) => {
                  const dayKey = formatDateYYYYMMDD(day);
                  const dayAppointments = appointmentsByDay[dayKey] || [];
                  const isToday = dayKey === todayKey;

                  const dayWindow = getSelectedStaffDayWindow(day);
                  const dayPendingCount = appointments
                    .filter(
                      (appt) =>
                        formatDateYYYYMMDD(new Date(appt.start_at)) === dayKey
                    )
                    .filter(isPastPendingClosure).length;

                  const dayCanceledCount = appointments
                    .filter(
                      (appt) =>
                        formatDateYYYYMMDD(new Date(appt.start_at)) === dayKey
                    )
                    .filter(isCanceled).length;

                  const closedLabel =
                    dayWindow.closedLabel || getSelectedStaffClosedLabel(day);

                  const showClosedBySchedule =
                    !!selectedStaffId &&
                    dayWindow.hasConfiguredHours &&
                    dayWindow.fullyClosed &&
                    dayAppointments.length === 0;

 const hasNoWorkingWindow =
  !!selectedStaffId &&
  dayWindow.hasConfiguredHours &&
  !dayWindow.fullyClosed &&
  !("windows" in dayWindow) &&
  dayWindow.startMinutes === null &&
  dayWindow.endMinutes === null &&
  dayAppointments.length === 0;

                  let daySlots: string[] = [];

if (!showClosedBySchedule && !hasNoWorkingWindow) {
  if ("windows" in dayWindow && Array.isArray(dayWindow.windows)) {
    daySlots = generateSlotsFromWindows(day, dayWindow.windows);
    } else if (
      "startMinutes" in dayWindow &&
      "endMinutes" in dayWindow &&
      dayWindow.startMinutes !== null &&
      dayWindow.endMinutes !== null
    ) {
    daySlots = generateDaySlots(day, {
      startMinutes: dayWindow.startMinutes,
      endMinutes: dayWindow.endMinutes,
    });
  }
}
                  const renderSlots = calendarTimeSlots.length
                    ? calendarTimeSlots.map((time) =>
                        new Date(`${dayKey}T${time}:00`).toISOString()
                      )
                    : daySlots;
                  const closedVisualSlots = calendarTimeSlots.length
                    ? calendarTimeSlots.map((time) =>
                        new Date(`${dayKey}T${time}:00`).toISOString()
                      )
                    : generateDaySlots(day, {
                        startMinutes: 9 * 60,
                        endMinutes: 20 * 60,
                      });
                  const isClosedScheduleDay =
                    showClosedBySchedule ||
                    hasNoWorkingWindow ||
                    (daySlots.length === 0 && dayAppointments.length === 0);
                  const closedDayTitle = showClosedBySchedule
                    ? "Cerrado"
                    : "Sin horario disponible";
                  const closedDaySubtitle = showClosedBySchedule
                    ? "Sin horario disponible"
                    : "Configura horarios";
                  const availableSlotKeys = new Set(daySlots.map(getTimeKey));

                  return (
                    <div
                      key={dayKey}
                      onClick={(event) => {
                        if (event.target === event.currentTarget) {
                          clearCalendarSelection();
                        }
                      }}
                      className="min-h-[660px] border first:xl:rounded-l-none last:xl:rounded-r-2xl md:rounded-2xl xl:rounded-none xl:border-l-0"
                      style={{
  borderColor: dayPendingCount > 0
    ? "rgba(244,63,94,0.28)"
    : isClosedScheduleDay
    ? "var(--agenda-closed-border)"
    : isToday
    ? "rgba(37,99,235,0.42)"
    : "var(--border-color)",
  background: dayPendingCount > 0
    ? "linear-gradient(180deg, rgba(244,63,94,0.08), var(--bg-card))"
    : isClosedScheduleDay
    ? "var(--agenda-closed-bg)"
    : isToday
    ? "var(--agenda-today-bg)"
    : "var(--agenda-calendar-column-bg)",
  boxShadow: isToday
    ? "0 0 0 1px rgba(37,99,235,0.14), 0 10px 30px -18px rgba(37,99,235,0.45)"
    : "none",
}}
                    >
                      <div
  className="sticky z-20 flex h-[58px] items-center px-2.5"
  style={{
    top: "78px",
    borderBottom: `1px solid ${
      dayPendingCount > 0
        ? "rgba(244,63,94,0.24)"
        : isClosedScheduleDay
        ? "var(--agenda-closed-border)"
        : isToday
        ? "rgba(56,189,248,0.24)"
        : "var(--border-color)"
    }`,
    background: dayPendingCount > 0
      ? "linear-gradient(180deg, rgba(244,63,94,0.08), var(--bg-card))"
      : isClosedScheduleDay
      ? "var(--agenda-closed-bg)"
      : isToday
      ? "var(--agenda-today-header-bg)"
      : "var(--agenda-calendar-header-bg)",
    backdropFilter: "blur(8px)",
  }}
>
                        <div className="flex items-center justify-between gap-2">
  <div className="flex flex-col">
    <span
      className="text-xs font-semibold"
      style={{
        color: isToday ? "#60a5fa" : "var(--text-main)",
        ...(isClosedScheduleDay ? { color: "var(--agenda-closed-text)" } : {}),
      }}
    >
      {getWeekdayLabel(day)}
    </span>

    <span
      className="text-[11px]"
      style={{
        color: isClosedScheduleDay
          ? "var(--agenda-closed-muted)"
          : isToday
          ? "#38bdf8"
          : "var(--text-muted)",
      }}
    >
      {formatDayMonthLabel(day)}
    </span>
  </div>

                          <div className="flex items-center gap-1.5">
                            {dayCanceledCount > 0 ? (
                              <span className="rounded-full bg-slate-600 px-2 py-0.5 text-[10px] font-semibold text-white">
                                {dayCanceledCount} c
                              </span>
                            ) : null}

                            {dayPendingCount > 0 ? (
                              <span className="rounded-full bg-rose-600 px-2 py-0.5 text-[10px] font-semibold text-white">
                                {dayPendingCount}
                              </span>
                            ) : null}

                            {isToday ? (
                              <span
  className="rounded-full px-2.5 py-1 text-[10px] font-semibold text-white"
  style={{
    background: "linear-gradient(135deg, #2563eb, #38bdf8)",
    boxShadow: "0 6px 16px -8px rgba(37,99,235,0.85)",
  }}
>
  Hoy
</span>
                            ) : null}

                          </div>
                        </div>

       
                      </div>

                      <div className="space-y-0">
                        {showClosedBySchedule ? (
                          <button
                            type="button"
                            onClick={() =>
                              openClosedScheduleActions(selectedStaffId, "day")
                            }
                            className="relative block w-full overflow-hidden rounded-lg border text-center transition hover:shadow-[0_18px_40px_-26px_rgba(180,30,30,0.30)]"
                            style={{
                              borderColor: "var(--agenda-closed-border)",
                              background: "var(--agenda-closed-bg)",
                            }}
                          >
                            <div className="space-y-0">
                              {closedVisualSlots.map((slot, index) => {
                                const slotTimeKey = getTimeKey(slot);
                                const isHourStart = index % 2 === 0;

                                return (
                                  <div
                                    key={slot}
                                    onMouseEnter={() => setHoveredTimeKey(slotTimeKey)}
                                    onMouseLeave={() => setHoveredTimeKey("")}
                                    className="h-[54px] border-t transition"
                                    style={{
                                      borderColor: isHourStart
                                        ? "var(--agenda-closed-line)"
                                        : "var(--agenda-closed-line-soft)",
                                      background:
                                        hoveredTimeKey === slotTimeKey
                                          ? "rgba(255,255,255,0.08)"
                                          : "transparent",
                                    }}
                                  />
                                );
                              })}
                            </div>
                            <div className="pointer-events-none absolute inset-0 flex items-center justify-center px-4">
                              <div className="flex flex-col items-center gap-2" style={{ color: "var(--agenda-closed-text)" }}>
                                <Lock className="h-5 w-5" />
                                <div>
                                  <p className="text-sm font-semibold" style={{ color: "var(--agenda-closed-text)" }}>
                                    {closedDayTitle}
                                  </p>
                                  <p className="mt-1 text-xs font-medium" style={{ color: "var(--agenda-closed-muted)" }}>
                                    {closedDaySubtitle}
                                  </p>
                                </div>
                              </div>
                            </div>
                          </button>
                        ) : hasNoWorkingWindow ? (
                          <button
                            type="button"
                            onClick={() =>
                              openClosedScheduleActions(selectedStaffId, "day")
                            }
                            className="relative block w-full overflow-hidden rounded-lg border text-center transition hover:shadow-[0_18px_40px_-26px_rgba(180,30,30,0.30)]"
                            style={{
                              borderColor: "var(--agenda-closed-border)",
                              background: "var(--agenda-closed-bg)",
                            }}
                          >
                            <div className="space-y-0">
                              {closedVisualSlots.map((slot, index) => {
                                const slotTimeKey = getTimeKey(slot);
                                const isHourStart = index % 2 === 0;

                                return (
                                  <div
                                    key={slot}
                                    onMouseEnter={() => setHoveredTimeKey(slotTimeKey)}
                                    onMouseLeave={() => setHoveredTimeKey("")}
                                    className="h-[54px] border-t transition"
                                    style={{
                                      borderColor: isHourStart
                                        ? "var(--agenda-closed-line)"
                                        : "var(--agenda-closed-line-soft)",
                                      background:
                                        hoveredTimeKey === slotTimeKey
                                          ? "rgba(255,255,255,0.08)"
                                          : "transparent",
                                    }}
                                  />
                                );
                              })}
                            </div>
                            <div className="pointer-events-none absolute inset-0 flex items-center justify-center px-4">
                              <div className="flex flex-col items-center gap-2" style={{ color: "var(--agenda-closed-text)" }}>
                                <Lock className="h-5 w-5" />
                                <div>
                                  <p className="text-sm font-semibold" style={{ color: "var(--agenda-closed-text)" }}>
                                    {closedDayTitle}
                                  </p>
                                  <p className="mt-1 text-xs font-medium" style={{ color: "var(--agenda-closed-muted)" }}>
                                    {closedDaySubtitle}
                                  </p>
                                </div>
                              </div>
                            </div>
                          </button>
                        ) : activeFilter === "canceled" ? (
                          dayAppointments.length === 0 ? (
                            <div
                              className="rounded-lg border border-dashed px-2 py-3 text-center text-[11px]"
                              style={{
                                borderColor: "var(--border-color)",
                                background: "var(--bg-card)",
                                color: "var(--text-muted)",
                              }}
                            >
                              Sin canceladas
                            </div>
                          ) : (
                            dayAppointments.map((appt) => {
                              const isSelected =
                                selectedAppointment?.id === appt.id;
                              const appointmentBlockHeight =
                                getAppointmentBlockMinHeight(appt);
                              const appointmentDensity =
                                getAppointmentBlockDensity(
                                  appointmentBlockHeight
                                );

                              return (
                                <button
                                  key={appt.id}
                                  type="button"
                                  data-calendar-selectable="true"
                                  onClick={() => handleSelectAppointment(appt)}
                                  onMouseEnter={(e) => {
                                    setHoveredTimeKey(getTimeKey(appt.start_at));
                                    handleAppointmentMouseEnter(e, appt);
                                  }}
                                  onMouseLeave={() => {
                                    setHoveredTimeKey("");
                                    handleAppointmentMouseLeave();
                                  }}
                                  className={`w-full overflow-hidden rounded-sm border px-1.5 py-0.5 text-left transition duration-200 ease-out ${getAppointmentInteractionClass(
                                    isSelected
                                  )} ${getCardClass(
                                    appt,
                                    isSelected
                                  )}`}
                                  style={{
                                    height: appointmentBlockHeight,
                                  }}
                                >
                                  <div className="flex h-full min-w-0 flex-col justify-between gap-px overflow-hidden leading-none">
                                    {false ? (
                                    <div
                                      className={`text-[11px] font-semibold ${
                                        isSelected
                                          ? "text-slate-200"
                                          : "text-slate-600"
                                      }`}
                                    >
                                      {formatHour(appt.start_at)} -{" "}
                                      {formatHour(appt.end_at)}
                                    </div>
                                    ) : null}

                                    {false ? (
                                    <div>
                                      <span
                                        className={`inline-flex max-w-full rounded-full border px-2 py-0.5 text-[10px] font-semibold ${
                                          isSelected
                                            ? "border-white/20 bg-white/10 text-white"
                                            : getStatusBadgeClass(appt)
                                        }`}
                                      >
                                        {getCalendarBadgeLabel(appt)}
                                      </span>
                                    </div>
                                    ) : null}

                                    <p className="truncate text-[10px] font-semibold leading-none text-white">
                                      {appt.customer_name}
                                    </p>

                                    {appointmentDensity.showPhone ? (
                                    <p className="truncate text-[9px] leading-none text-slate-200">
                                      {appt.customer_phone || "Teléfono no disponible"}
                                    </p>
                                    ) : null}

                                    {false && appt.customer_data?.pet_name ? (
                                      <p
                                        className={`truncate text-[10px] ${
                                          isSelected
                                            ? "text-slate-200"
                                            : "text-emerald-600"
                                        }`}
                                      >
                                        🐶 {appt.customer_data?.pet_name}
                                        {appt.customer_data?.pet_species
                                          ? ` (${appt.customer_data?.pet_species})`
                                          : ""}
                                      </p>
                                    ) : null}

                                    {appointmentDensity.showService ? (
                                    <p className="truncate text-[9px] leading-none text-slate-300">
                                      {appt.service_name_snapshot || "Reserva"}
                                    </p>
                                    ) : null}

                                    {false ? (
                                    <p
                                      className={`truncate text-[11px] ${
                                        isSelected
                                          ? "text-slate-200"
                                          : "text-slate-500"
                                      }`}
                                    >
                                      {getStaffName(appt.staff_id)}
                                    </p>
                                    ) : null}
                                  </div>
                                </button>
                              );
                            })
                          )
                        ) : renderSlots.length === 0 && dayAppointments.length === 0 ? (
                          <button
                            type="button"
                            onClick={() =>
                              openClosedScheduleActions(selectedStaffId, "day")
                            }
                            className="relative block w-full overflow-hidden rounded-lg border text-center transition hover:shadow-[0_18px_40px_-26px_rgba(180,30,30,0.30)]"
                            style={{
                              borderColor: "var(--agenda-closed-border)",
                              background: "var(--agenda-closed-bg)",
                            }}
                          >
                            <div className="space-y-0">
                              {closedVisualSlots.map((slot, index) => {
                                const slotTimeKey = getTimeKey(slot);
                                const isHourStart = index % 2 === 0;

                                return (
                                  <div
                                    key={slot}
                                    onMouseEnter={() => setHoveredTimeKey(slotTimeKey)}
                                    onMouseLeave={() => setHoveredTimeKey("")}
                                    className="h-[54px] border-t transition"
                                    style={{
                                      borderColor: isHourStart
                                        ? "var(--agenda-closed-line)"
                                        : "var(--agenda-closed-line-soft)",
                                      background:
                                        hoveredTimeKey === slotTimeKey
                                          ? "rgba(255,255,255,0.08)"
                                          : "transparent",
                                    }}
                                  />
                                );
                              })}
                            </div>
                            <div className="pointer-events-none absolute inset-0 flex items-center justify-center px-4">
                              <div className="flex flex-col items-center gap-2" style={{ color: "var(--agenda-closed-text)" }}>
                                <Lock className="h-5 w-5" />
                                <div>
                                  <p className="text-sm font-semibold" style={{ color: "var(--agenda-closed-text)" }}>
                                    {closedDayTitle}
                                  </p>
                                  <p className="mt-1 text-xs font-medium" style={{ color: "var(--agenda-closed-muted)" }}>
                                    {closedDaySubtitle}
                                  </p>
                                </div>
                              </div>
                            </div>
                          </button>
                        ) : (
                          renderSlots.map((slot, index) => {
const slotAppointments = dayAppointments.filter(
  (a) =>
    new Date(a.start_at).getTime() ===
    new Date(slot).getTime()
);
const slotTime = new Date(slot).getTime();
const slotTimeKey = getTimeKey(slot);
const isEmptySlotSelected =
  selectedEmptySlotKey === getEmptySlotKey(slot, selectedStaffId);
const isCoveredByLongAppointment = dayAppointments.some((a) => {
  const start = new Date(a.start_at).getTime();
  const end = new Date(a.end_at).getTime();
  return start < slotTime && end > slotTime;
});

const slotDisplayGroups = selectedStaffId
  ? groupAppointmentsByBlock(slotAppointments).map((group) => ({
      key: getAppointmentGroupKey(group[0]),
      appointmentGroups: [group],
      appointments: group,
      isWeekSummary: false,
    }))
  : getWeekSlotDisplayGroups(slotAppointments);
const appt = slotDisplayGroups[0]?.appointments[0];

                            const isHourStart = index % 2 === 0;
                            const isEvenBand = Math.floor(index / 2) % 2 === 0;
                            const isSlotClosed =
                              isClosedScheduleDay ||
                              !availableSlotKeys.has(slotTimeKey);

                                const weekSlotKey = slotTimeKey + '|' + dayKey;
                            if (isCoveredByLongAppointment) {
                              return (
                                <div
                                  key={slot}
                                  className="hidden h-[54px] border-t xl:block"
                                  onMouseEnter={() => { setHoveredTimeKey(slotTimeKey); setHoveredSlotKey(weekSlotKey); }}
                                  onMouseLeave={() => { setHoveredTimeKey(""); setHoveredSlotKey(""); }}
                                  style={{
                                    borderColor: isHourStart
                                      ? "rgba(148,163,184,0.22)"
                                      : "rgba(148,163,184,0.14)",
                                    background:
                                      hoveredSlotKey === weekSlotKey
                                        ? "rgba(59,130,246,0.14)"
                                        : hoveredTimeKey === slotTimeKey
                                        ? "rgba(59,130,246,0.04)"
                                        : "transparent",
                                  }}
                                />
                              );
                            }

                            if (!appt || slotDisplayGroups.length === 0) {
                              return (
                                <div
                                  key={slot}
                                  data-calendar-selectable="true"
                                  role="button"
                                  tabIndex={0}
                                  onClick={() => {
                                    selectEmptySlot(slot, selectedStaffId);
                                    if (isSlotClosed) {
                                      openClosedScheduleActions(
                                        selectedStaffId,
                                        isClosedScheduleDay ? "day" : "block"
                                      );
                                    } else {
                                      openFreeSlotActions(slot, selectedStaffId);
                                    }
                                  }}
                                  onKeyDown={(event) => {
                                    if (event.key === "Enter" || event.key === " ") {
                                      event.preventDefault();
                                      if (isSlotClosed) {
                                        selectEmptySlot(slot, selectedStaffId);
                                        openClosedScheduleActions(
                                          selectedStaffId,
                                          isClosedScheduleDay ? "day" : "block"
                                        );
                                      } else {
                                        selectEmptySlot(slot, selectedStaffId);
                                        openFreeSlotActions(slot, selectedStaffId);
                                      }
                                    }
                                  }}
                                  onMouseEnter={() => { setHoveredTimeKey(slotTimeKey); setHoveredSlotKey(weekSlotKey); }}
                                  onMouseLeave={() => { setHoveredTimeKey(""); setHoveredSlotKey(""); }}
                                  className={`hidden h-[54px] cursor-pointer border-t px-2 text-center text-[10px] font-semibold transition xl:flex xl:items-center xl:justify-center ${getEmptySlotClass(isEmptySlotSelected)}`}
                                  style={{
                                    borderColor: isHourStart
                                      ? isSlotClosed
                                        ? "var(--agenda-closed-line)"
                                        : isEmptySlotSelected
                                        ? "rgba(103,232,249,0.72)"
                                        : "rgba(148,163,184,0.22)"
                                      : isSlotClosed
                                      ? "var(--agenda-closed-line-soft)"
                                      : isEmptySlotSelected
                                      ? "rgba(103,232,249,0.58)"
                                      : "rgba(148,163,184,0.14)",
                                    background:
                                      isSlotClosed
                                        ? hoveredSlotKey === weekSlotKey
                                          ? "var(--agenda-closed-bg-hover)"
                                          : "var(--agenda-closed-bg)"
                                        : isEmptySlotSelected
                                        ? "linear-gradient(180deg, rgba(34,211,238,0.22), rgba(37,99,235,0.12))"
                                        : hoveredSlotKey === weekSlotKey
                                        ? "rgba(59,130,246,0.14)"
                                        : hoveredTimeKey === slotTimeKey
                                        ? "rgba(59,130,246,0.04)"
                                        : "transparent",
                                    color: "var(--text-muted)",
                                  }}
                                >
                                  {""}
                                </div>
                              );
                            }

                            return (
                              <div
                                key={slot}
                                onMouseEnter={() => { setHoveredTimeKey(slotTimeKey); setHoveredSlotKey(weekSlotKey); }}
                                onMouseLeave={() => { setHoveredTimeKey(""); setHoveredSlotKey(""); }}
                                className="relative h-[54px] border-t"
                                style={{
                                  borderColor: isHourStart
                                    ? "rgba(148,163,184,0.22)"
                                    : "rgba(148,163,184,0.14)",
                                  background:
                                    hoveredSlotKey === weekSlotKey
                                      ? "rgba(59,130,246,0.14)"
                                      : hoveredTimeKey === slotTimeKey
                                      ? "rgba(59,130,246,0.04)"
                                      : "transparent",
                                }}
                              >
                                {slotDisplayGroups.map((displayGroup) => {
                                  const group = displayGroup.appointments;
                                  const appt = group[0];
                                  const isWeekAggregate =
                                    !selectedStaffId &&
                                    displayGroup.isWeekSummary;
                                  const isGroupSlot = isGroupAppointment(appt);
                                  const selectedKey = selectedAppointment
                                    ? getAppointmentGroupKey(selectedAppointment)
                                    : "";
                                  const isSelected = Boolean(
                                    selectedKey &&
                                      selectedKey === getAppointmentGroupKey(appt)
                                  );
                                  const groupVisualState = isGroupSlot
                                    ? getGroupBookingVisualState(group)
                                    : null;
                                  const groupStyles = groupVisualState
                                    ? getGroupBookingStyles(
                                        groupVisualState.key,
                                        isSelected
                                      )
                                    : null;
                                  const activeGroupCount = group.filter(
                                    (attendee) => attendee.status !== "canceled"
                                  ).length;
                                  const groupCapacity =
                                    Number(appt.service_capacity || 0) ||
                                    activeGroupCount ||
                                    group.length;
                                  const appointmentBlockHeight =
                                    getAppointmentBlockMinHeight(appt);
                                  const appointmentDensity =
                                    getAppointmentBlockDensity(
                                      appointmentBlockHeight
                                    );

                                  if (isWeekAggregate) {
                                    const aggregateCount =
                                      displayGroup.appointmentGroups.length;
                                    const aggregateKey = `${displayGroup.key}|${aggregateCount}`;
                                    const isAggregateSelected =
                                      selectedWeekGroup?.key ===
                                      displayGroup.key;

                                    return (
                                      <button
                                        key={aggregateKey}
                                        type="button"
                                        data-calendar-selectable="true"
                                        onClick={(event) =>
                                          openWeekGroupedAppointments(
                                            event,
                                            displayGroup.appointmentGroups
                                          )
                                        }
                                        onMouseEnter={() =>
                                          setHoveredTimeKey(
                                            getTimeKey(appt.start_at)
                                          )
                                        }
                                        onMouseLeave={() =>
                                          setHoveredTimeKey("")
                                        }
                                        className={`absolute inset-x-0 top-0 overflow-hidden rounded-sm border px-1.5 py-0.5 text-left text-white transition duration-200 ease-out ${
                                          isAggregateSelected
                                            ? "z-20 cursor-pointer border-blue-200/90 bg-[linear-gradient(135deg,rgba(29,78,216,0.94),rgba(14,165,233,0.62))] shadow-[0_0_28px_-9px_rgba(56,189,248,0.92)]"
                                            : "z-10 cursor-pointer border-blue-300/75 bg-[linear-gradient(135deg,rgba(30,64,175,0.90),rgba(37,99,235,0.58))] shadow-[0_0_18px_-10px_rgba(96,165,250,0.85)] hover:z-20 hover:border-blue-200 hover:shadow-[0_0_24px_-9px_rgba(96,165,250,0.95)]"
                                        }`}
                                        style={{
                                          height: appointmentBlockHeight,
                                        }}
                                      >
                                        <div className="flex h-full min-w-0 flex-col justify-center gap-1 overflow-hidden leading-none">
                                          <div className="flex min-w-0 items-center gap-1.5">
                                            <UsersRound className="h-3 w-3 shrink-0 text-cyan-100" />
                                            <p className="min-w-0 flex-1 truncate text-[10px] font-semibold leading-none text-white">
                                              {aggregateCount} Agendamiento{aggregateCount === 1 ? "" : "s"}
                                            </p>
                                          </div>
                                          <p className="truncate text-[9px] font-medium leading-none text-blue-100">
                                            {formatHour(appt.start_at)} -{" "}
                                            {formatHour(appt.end_at)}
                                          </p>
                                        </div>
                                      </button>
                                    );
                                  }

                                  return (
                              <button
                                key={getAppointmentGroupKey(appt)}
                                type="button"
                                data-calendar-selectable="true"
                                onClick={() => handleSelectAppointment(appt)}
                                onMouseEnter={(e) => {
                                  setHoveredTimeKey(getTimeKey(appt.start_at));
                                  if (selectedStaffId) {
                                    handleAppointmentMouseEnter(e, appt);
                                  }
                                }}
                                onMouseLeave={() => {
                                  setHoveredTimeKey("");
                                  handleAppointmentMouseLeave();
                                }}
                                className={`absolute inset-x-0 top-0 z-10 overflow-hidden rounded-sm border py-0.5 text-left transition duration-200 ease-out ${
                                  isGroupSlot ? "px-1" : "px-1.5"
                                } ${getAppointmentInteractionClass(
                                  isSelected
                                )} ${
                                  isGroupSlot && groupStyles
                                    ? groupStyles.card
                                    : getCardClass(appt, isSelected)
                                }`}
                                style={{
                                  height: appointmentBlockHeight,
                                }}
                              >
                                {(() => {
                                  if (newAppointmentIds.size > 0) {
                                    console.log(
                                      "[DEBUG grid block] appt.id:",
                                      appt.id,
                                      "typeof:",
                                      typeof appt.id,
                                      "newAppointmentIds:",
                                      Array.from(newAppointmentIds),
                                      "has:",
                                      newAppointmentIds.has(appt.id)
                                    );
                                  }
                                  return null;
                                })()}
                                {newAppointmentIds.has(appt.id) ? (
                                  <span className="absolute -right-1 -top-1 z-20 rounded-full bg-rose-500 px-1.5 py-0.5 text-[8px] font-bold leading-none text-white shadow-sm">
                                    Nueva
                                  </span>
                                ) : null}
                                <div className="flex h-full min-w-0 flex-col justify-between gap-px overflow-hidden leading-none">
                                  {false && !isGroupSlot ? (
                                  <div
                                    className={`text-[10px] font-semibold ${
                                      isSelected
                                        ? "text-slate-200"
                                        : "text-slate-600"
                                    }`}
                                  >
                                    {formatHour(appt.start_at)} -{" "}
                                    {formatHour(appt.end_at)}
                                  </div>
                                  ) : null}

                                  {false && !isGroupSlot ? (
                                  <div>
                                    <span
                                      className={`inline-flex max-w-full rounded-full border px-2 py-0.5 text-[10px] font-semibold ${
                                        isSelected
                                          ? "border-white/20 bg-white/10 text-white"
                                          : getStatusBadgeClass(appt)
                                      }`}
                                    >
                                      {getCalendarBadgeLabel(appt)}
                                    </span>
                                  </div>
                                  ) : null}

                                  {isGroupSlot && groupVisualState && groupStyles ? (
  <div className="flex h-full min-w-0 flex-col justify-between gap-px overflow-hidden leading-none">
    <div className="flex min-w-0 items-center gap-1.5">
      <UsersRound className={`h-3 w-3 shrink-0 ${groupStyles.icon}`} />
      <p className="min-w-0 flex-1 truncate text-[10px] font-semibold leading-none text-white">
        {appt.service_name_snapshot || "Clase"}
      </p>
    </div>

    <div className="flex min-w-0 overflow-hidden">
      <span
        className={`inline-flex min-w-0 max-w-full truncate rounded-full border px-1.5 py-0.5 text-[8px] font-semibold leading-none ${groupStyles.countBadge}`}
      >
        {activeGroupCount}/{groupCapacity} inscritos
      </span>
    </div>
  </div>
) : (
  <p className="truncate text-[10px] font-semibold leading-none text-white">
    {appt.customer_name}
  </p>
)}

                                  {!isGroupSlot && appointmentDensity.showPhone ? (
                                  <p className="truncate text-[9px] leading-none text-slate-200">
                                    {appt.customer_phone || "Teléfono no disponible"}
                                  </p>
                                  ) : null}

                                  {false && !isGroupSlot && appt.customer_data?.pet_name ? (
                                    <p
                                      className={`truncate text-[10px] ${
                                        isSelected
                                          ? "text-slate-200"
                                          : "text-emerald-600"
                                      }`}
                                    >
                                      🐶 {appt.customer_data?.pet_name}
                                      {appt.customer_data?.pet_species
                                        ? ` (${appt.customer_data?.pet_species})`
                                        : ""}
                                    </p>
                                  ) : null}

                                  {!isGroupSlot && appointmentDensity.showService ? (
                                  <p className="truncate text-[9px] leading-none text-slate-300">
  {isGroupSlot
    ? getStaffName(appt.staff_id)
    : appt.service_name_snapshot || "Reserva"}
</p>
                                  ) : null}

                                  {false && !isGroupSlot ? (
                                  <p
                                    className={`truncate text-[11px] ${
                                      isSelected
                                        ? "text-slate-200"
                                        : "text-slate-500"
                                    }`}
                                  >
                                    {getStaffName(appt.staff_id)}
                                  </p>
                                  ) : null}

                                </div>
                              </button>
                                  );
                                })}
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        {selectedWeekGroup ? (
          <>
          <div
            className="pointer-events-none fixed z-[77] h-px origin-left rounded-full bg-gradient-to-r from-cyan-300/70 via-blue-400/55 to-transparent shadow-[0_0_14px_rgba(56,189,248,0.55)]"
            style={{
              left: selectedWeekGroup.lineLeft,
              top: selectedWeekGroup.lineTop,
              width: selectedWeekGroup.lineWidth,
              transform: `rotate(${selectedWeekGroup.lineAngle}deg)`,
            }}
          />
          <div
            data-calendar-group-popover="true"
            className="fixed z-[78] w-[320px] max-w-[calc(100vw-24px)] rounded-2xl border p-3 shadow-[0_24px_70px_-28px_rgba(15,23,42,0.72)] backdrop-blur"
            style={{
              left: selectedWeekGroup.x,
              top: selectedWeekGroup.y,
              borderColor: "rgba(96,165,250,0.28)",
              background:
                "color-mix(in srgb, var(--bg-card) 94%, rgba(15,23,42,0.55))",
            }}
          >
            <div className="mb-3 flex items-start justify-between gap-3">
              <div className="flex min-w-0 items-start gap-2.5">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-blue-300/35 bg-blue-500/15 text-blue-200 shadow-[0_0_18px_-9px_rgba(59,130,246,0.9)]">
                  <UsersRound className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <p
                    className="truncate text-sm font-semibold"
                    style={{ color: "var(--text-main)" }}
                  >
                    {selectedWeekGroup.appointmentGroups.length} Agendamiento
                    {selectedWeekGroup.appointmentGroups.length === 1 ? "" : "s"}
                  </p>
                  <p
                    className="mt-0.5 truncate text-[11px]"
                    style={{ color: "var(--text-muted)" }}
                  >
                    {selectedWeekGroup.dayLabel} · {selectedWeekGroup.timeLabel}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedWeekGroup(null)}
                className="rounded-lg border p-1 transition hover:border-blue-300/50 hover:bg-blue-500/10"
                style={{
                  borderColor: "var(--border-color)",
                  color: "var(--text-muted)",
                }}
                aria-label="Cerrar detalle agrupado"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>

            <div
              className="grid grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)_auto] gap-2 border-b pb-2 text-[10px] font-semibold uppercase tracking-[0.08em]"
              style={{
                borderColor: "var(--border-color)",
                color: "var(--text-muted)",
              }}
            >
              <span>Profesional</span>
              <span>Servicio</span>
              <span>Inscritos</span>
            </div>

            <div className="max-h-36 overflow-y-auto py-1">
              {selectedWeekGroup.appointmentGroups.map((group) => {
                const appt = group[0];
                if (!appt) return null;
                const avatarUrl = getStaffAvatar(appt?.staff_id);
                const activeGroupCount = group.filter(
                  (attendee) => attendee.status !== "canceled"
                ).length;
                const groupCapacity =
                  Number(appt?.service_capacity || 0) ||
                  activeGroupCount ||
                  group.length;

                return (
                <div
                  key={getAppointmentGroupKey(appt)}
                  className="grid grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)_auto] items-center gap-2 rounded-lg px-1.5 py-2 text-[11px] transition hover:bg-blue-500/10"
                  style={{ color: "var(--text-main)" }}
                >
                  <span className="flex min-w-0 items-center gap-2">
                    {avatarUrl ? (
                      <img
                        src={avatarUrl}
                        alt=""
                        className="h-6 w-6 shrink-0 rounded-full object-cover"
                      />
                    ) : (
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-500/20 text-[9px] font-semibold text-blue-100">
                        {getStaffInitials(appt?.staff_id) || "PR"}
                      </span>
                    )}
                    <span className="truncate font-semibold">
                      {getStaffName(appt?.staff_id)}
                    </span>
                  </span>
                  <span className="truncate" style={{ color: "var(--text-muted)" }}>
                    {appt?.service_name_snapshot || "Reserva"}
                  </span>
                  <span className="whitespace-nowrap text-right text-[10px]" style={{ color: "var(--text-muted)" }}>
                    {appt?.service_is_group
                      ? `${activeGroupCount}/${groupCapacity}`
                      : "-"}
                  </span>
                </div>
                );
              })}
            </div>

            <button
              type="button"
              onClick={goToWeekGroupDetail}
              className="mt-3 flex w-full items-center justify-between rounded-xl border px-3 py-2 text-left transition hover:border-blue-300/65 hover:bg-blue-500/12"
              style={{
                borderColor: "rgba(96,165,250,0.32)",
                background:
                  "linear-gradient(135deg, rgba(37,99,235,0.13), rgba(14,165,233,0.08))",
              }}
            >
              <span>
                <span className="block text-xs font-semibold text-blue-200">
                  Ir al detalle
                </span>
                <span
                  className="block text-[11px]"
                  style={{ color: "var(--text-muted)" }}
                >
                  Ver en Día por profesional
                </span>
              </span>
              <CalendarDays className="h-4 w-4 text-blue-200" />
            </button>
          </div>
          </>
        ) : null}

        {selectedAppointment ? (
        <div
          ref={detailRef}
          data-calendar-selectable="true"
          className={`fixed inset-x-3 bottom-3 z-[75] max-h-[82vh] max-w-[calc(100vw-32px)] overflow-y-auto rounded-3xl border p-3 shadow-[0_24px_70px_-30px_rgba(15,23,42,0.55)] backdrop-blur md:inset-x-auto md:right-6 md:top-24 md:bottom-auto ${
            isSelectedGroupAppointment ? "md:w-[460px]" : "md:w-[340px]"
          }`}
          style={{
            borderColor: "var(--border-color)",
            background: "color-mix(in srgb, var(--bg-card) 92%, transparent)",
          }}
        >
          <div className="space-y-6">
            <section className="hidden">
              <h2
                className="mb-3 text-base font-semibold"
                style={{ color: "var(--text-main)" }}
              >
                Buscar cliente o reserva
              </h2>

              <div
                className="space-y-3 rounded-xl border p-4"
                style={{
                  borderColor: "var(--border-color)",
                  background: "var(--bg-card)",
                }}
              >
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        handleSearchAppointments();
                      }
                    }}
                    placeholder="Ej: Camilo, gmail.com, +569..."
                    className="h-10 w-full rounded-xl border px-3 text-sm outline-none transition"
                    style={{
                      borderColor: "var(--border-color)",
                      background: "var(--bg-card)",
                      color: "var(--text-main)",
                    }}
                  />
                  <button
                    type="button"
                    onClick={handleSearchAppointments}
                    disabled={searchLoading}
                    className="inline-flex h-10 shrink-0 items-center justify-center rounded-xl px-4 text-sm font-medium text-white transition disabled:cursor-not-allowed disabled:opacity-60"
                    style={{
                      background:
                        "linear-gradient(135deg, rgb(37 99 235), rgb(14 165 233))",
                    }}
                  >
                    {searchLoading ? "Buscando..." : "Buscar"}
                  </button>
                </div>

                {searchError ? (
                  <Notice tone="warning" title={searchError} />
                ) : null}

                {searchResults.length > 0 ? (
                  <div className="max-h-[320px] space-y-2 overflow-y-auto pr-1">
                    {searchResults.map((appt) => {
                      const isSelected = selectedAppointment?.id === appt.id;

                      return (
                        <button
                          key={appt.id}
                          type="button"
                          onClick={() => handleSelectAppointment(appt)}
                          className={`w-full rounded-xl border p-3 text-left transition ${
                            isSelected
                              ? "border-slate-900 bg-slate-900 text-white"
                              : ""
                          }`}
                          style={
                            isSelected
                              ? undefined
                              : {
                                  borderColor: "var(--border-color)",
                                  background: "var(--bg-soft)",
                                }
                          }
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <p
                                className={`truncate text-sm font-semibold ${
                                  isSelected ? "text-white" : ""
                                }`}
                                style={
                                  isSelected
                                    ? undefined
                                    : { color: "var(--text-main)" }
                                }
                              >
                                {appt.customer_name}
                              </p>
                              <p
                                className={`mt-1 truncate text-xs ${
                                  isSelected ? "text-slate-200" : ""
                                }`}
                                style={
                                  isSelected
                                    ? undefined
                                    : { color: "var(--text-muted)" }
                                }
                              >
                                {appt.service_name_snapshot || "Reserva"}
                              </p>
                              <p
                                className={`mt-1 truncate text-xs ${
                                  isSelected ? "text-slate-200" : ""
                                }`}
                                style={
                                  isSelected
                                    ? undefined
                                    : { color: "var(--text-muted)" }
                                }
                              >
                                {getStaffName(appt.staff_id)}
                              </p>
                            </div>

                            <span
                              className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-semibold ${
                                isSelected
                                  ? "border-white/20 bg-white/10 text-white"
                                  : getStatusBadgeClass(appt)
                              }`}
                            >
                              {getStatusLabel(appt)}
                            </span>
                          </div>

                          <p
                            className={`mt-2 text-xs ${
                              isSelected ? "text-slate-200" : ""
                            }`}
                            style={
                              isSelected
                                ? undefined
                                : { color: "var(--text-muted)" }
                            }
                          >
                            {formatCompactDateTime(appt.start_at)}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                ) : null}
              </div>
            </section>

            <section className="hidden">
              <h2
                className="mb-3 text-base font-semibold"
                style={{ color: "var(--text-main)" }}
              >
                Profesional
              </h2>

              <div
                className="space-y-3 rounded-xl border p-4"
                style={{
                  borderColor: "var(--border-color)",
                  background: "var(--bg-card)",
                }}
              >
                <select
                  value={selectedStaffId}
                  onChange={(e) => {
                    setSelectedStaffId(e.target.value);
                    setSelectedAppointment(null);
                    setIsEditingReservation(false);
                    setHoverCard(null);
                    setSearchResults([]);
                    setSearchError("");
                  }}
                  disabled={!selectedBranchId || loadingStaff}
                  className="h-10 w-full rounded-xl border px-3 text-sm outline-none transition disabled:cursor-not-allowed disabled:opacity-60"
                  style={{
                    borderColor: "var(--border-color)",
                    background: "var(--bg-card)",
                    color: "var(--text-main)",
                  }}
                >
                  <option value="">Todos los profesionales</option>
                  {staffList.map((staff) => (
                    <option key={staff.id} value={staff.id}>
                      {staff.name}
                    </option>
                  ))}
                </select>

                <div
                  className="rounded-xl border px-3 py-2 text-xs"
                  style={{
                    borderColor: "var(--border-color)",
                    background: "var(--bg-soft)",
                    color: "var(--text-muted)",
                  }}
                >
                  {loadingStaff
                    ? "Cargando profesionales..."
                    : selectedStaffName
                    ? `Viendo agenda de ${selectedStaffName}.`
                    : "Viendo todos los profesionales de la sucursal."}
                </div>
              </div>
            </section>

            <section>
              <div className="mb-3 flex items-center justify-between gap-3">
                <h2
                  className="text-base font-semibold"
                  style={{ color: "var(--text-main)" }}
                >
                  {isSelectedGroupAppointment ? "Actividad grupal" : "Detalle de reserva"}
                </h2>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedAppointment(null);
                    setIsEditingReservation(false);
                  }}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-xl border transition hover:shadow-sm"
                  style={{
                    borderColor: "var(--border-color)",
                    background: "var(--bg-soft)",
                    color: "var(--text-main)",
                  }}
                  aria-label="Cerrar detalle"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div
                className="rounded-xl border p-4"
                style={{
                  borderColor: "var(--border-color)",
                  background: "var(--bg-card)",
                }}
              >
                {!selectedAppointment ? (
                  <div
                    className="rounded-xl border border-dashed px-4 py-5 text-sm"
                    style={{
                      borderColor: "var(--border-color)",
                      background: "var(--bg-soft)",
                      color: "var(--text-muted)",
                    }}
                  >
                    Haz clic en una reserva para ver el detalle.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {!isSelectedGroupAppointment ? (
                      <div
                        className="space-y-3 rounded-2xl border p-3"
                        style={{
                          borderColor: "var(--border-color)",
                          background: "var(--bg-card)",
                        }}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p
                              className="truncate text-base font-semibold"
                              style={{ color: "var(--text-main)" }}
                            >
                              {selectedAppointment.customer_name}
                            </p>
                            <span className="mt-1 inline-flex max-w-full rounded-full border border-blue-200 bg-blue-50 px-2 py-0.5 text-[10px] font-semibold text-blue-700">
                              {selectedAppointment.service_name_snapshot || "Reserva"}
                            </span>

                            {isVeterinaria && selectedAppointment.customer_data?.pet_name ? (
                              <p className="mt-2 truncate text-xs font-semibold text-emerald-600">
                                {selectedAppointment.customer_data.pet_name}
                                {selectedAppointment.customer_data.pet_species
                                  ? ` (${selectedAppointment.customer_data.pet_species})`
                                  : ""}
                              </p>
                            ) : null}
                          </div>

                        </div>

                        <div className="space-y-1.5 text-xs" style={{ color: "var(--text-muted)" }}>
                          <div className="flex items-center gap-2">
                            <CalendarDays className="h-3.5 w-3.5 shrink-0" />
                            <span className="capitalize">{formatLongDate(selectedAppointment.start_at)}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="h-3.5 w-3.5 shrink-0" />
                            <span>
                              {formatHour(selectedAppointment.start_at)} -{" "}
                              {formatHour(selectedAppointment.end_at)}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <UserRound className="h-3.5 w-3.5 shrink-0" />
                            <span className="truncate">
                              {getStaffName(selectedAppointment.staff_id)}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Phone className="h-3.5 w-3.5 shrink-0" />
                            <span className="truncate">
                              {selectedAppointment.customer_phone || "Teléfono no disponible"}
                            </span>
                          </div>
                        </div>

                        <div
                          className="rounded-xl border px-3 py-2"
                          style={{
                            borderColor: "var(--border-color)",
                            background: "var(--bg-soft)",
                          }}
                        >
                          <div className="flex items-center justify-between">
                            <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>Estado actual</p>
                            <span className={`rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${getStatusBadgeClass(selectedAppointment)}`}>
                              {getStatusLabel(selectedAppointment)}
                            </span>
                          </div>
                        </div>

                        <div
                          className="rounded-xl border p-2.5"
                          style={{
                            borderColor: "var(--border-color)",
                            background: "var(--bg-soft)",
                          }}
                        >
                          <p className="mb-2 text-[11px]" style={{ color: "var(--text-muted)" }}>
                            Acciones rápidas
                          </p>
                          <div className="grid grid-cols-3 gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                if (isVeterinaria || isClinica || isOdontologia) {
                                  handleAsistioClinico(selectedAppointment);
                                  return;
                                }

                                handleUpdateStatus(selectedAppointment.id, "completed");
                              }}
                              disabled={statusSaving || closeSaving || selectedAppointment.status === "completed"}
                              className="inline-flex min-h-14 flex-col items-center justify-center gap-1 rounded-xl border border-emerald-200 bg-emerald-50 px-2 text-[11px] font-semibold text-emerald-700 transition hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              <Check className="h-4 w-4" />
                              Asistió
                            </button>

                            <button
                              type="button"
                              onClick={() => handleUpdateStatus(selectedAppointment.id, "no_show")}
                              disabled={statusSaving || selectedAppointment.status === "no_show"}
                              className="inline-flex min-h-14 flex-col items-center justify-center gap-1 rounded-xl border border-amber-200 bg-amber-50 px-2 text-[11px] font-semibold text-amber-700 transition hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              <XCircle className="h-4 w-4" />
                              No asistió
                            </button>

                            <button
                              type="button"
                              onClick={() => handleUpdateStatus(selectedAppointment.id, "rescheduled")}
                              disabled={statusSaving || selectedAppointment.status === "rescheduled"}
                              className="inline-flex min-h-14 flex-col items-center justify-center gap-1 rounded-xl border border-violet-200 bg-violet-50 px-2 text-[11px] font-semibold text-violet-700 transition hover:bg-violet-100 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              <RotateCcw className="h-4 w-4" />
                              Reagendó
                            </button>
                          </div>

                          <button
                            type="button"
                            onClick={() => setCancelConfirmAppointment(selectedAppointment)}
                            disabled={statusSaving || selectedAppointment.status === "canceled"}
                            className="mt-2 inline-flex h-9 w-full items-center justify-center gap-2 rounded-xl border px-3 text-xs font-semibold transition hover:shadow-sm disabled:cursor-not-allowed disabled:opacity-60"
                            style={{
                              borderColor: "var(--border-color)",
                              background: "var(--bg-card)",
                              color: "var(--text-main)",
                            }}
                          >
                            <X className="h-3.5 w-3.5" />
                            Cancelar reserva
                          </button>
                        </div>

                        {selectedAppointment.customer_id ? (
                          <div
                            className="rounded-xl border px-3 py-2.5"
                            style={{ borderColor: "var(--border-color)", background: "var(--bg-soft)" }}
                          >
                            <p className="mb-2 text-[11px]" style={{ color: "var(--text-muted)" }}>
                              {isVeterinaria || isClinica || isOdontologia ? "Ficha clínica" : "Ficha del cliente"}
                            </p>
                            <button
                              type="button"
                              onClick={() =>
                                router.push(
                                  `/dashboard/${slug}/customers/${selectedAppointment.customer_id}?appointment_id=${selectedAppointment.id}&open_note=true`
                                )
                              }
                              className="inline-flex h-9 w-full cursor-pointer items-center justify-center gap-2 rounded-xl border px-3 text-xs font-semibold transition duration-150 hover:shadow-sm"
                              style={{
                                borderColor: "rgba(37,99,235,0.35)",
                                background: "rgba(37,99,235,0.08)",
                                color: "#2563eb",
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.background = "rgba(37,99,235,0.16)";
                                e.currentTarget.style.borderColor = "rgba(37,99,235,0.55)";
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.background = "rgba(37,99,235,0.08)";
                                e.currentTarget.style.borderColor = "rgba(37,99,235,0.35)";
                              }}
                            >
                              <UserRound className="h-3.5 w-3.5" />
                              {isVeterinaria || isClinica || isOdontologia ? "Llenar ficha / consulta" : "Ver ficha del cliente"}
                            </button>

                            {!(isVeterinaria || isClinica || isOdontologia) && (
                              <div className="mt-3">
                                <p className="mb-1 text-[11px]" style={{ color: "var(--text-muted)" }}>
                                  Nota del cliente
                                </p>
                                <textarea
                                  className="w-full resize-none rounded-lg border px-3 py-2 text-sm outline-none transition focus:border-blue-500/50"
                                  style={{
                                    borderColor: "var(--border-color)",
                                    background: "var(--bg-card)",
                                    color: "var(--text-main)",
                                  }}
                                  rows={3}
                                  maxLength={300}
                                  placeholder="Agregar nota interna..."
                                  value={customerNote}
                                  onChange={(e) => { setCustomerNote(e.target.value); setNoteSaved(false); }}
                                />
                                <p
                                  className="mt-0.5 text-right text-[10px]"
                                  style={{
                                    color: customerNote.length > 300 ? "#ef4444" : "var(--text-muted)",
                                  }}
                                >
                                  {customerNote.length}/300
                                </p>
                                <button
                                  type="button"
                                  onClick={handleSaveCustomerNote}
                                  disabled={savingNote || customerNote.length > 300}
                                  className="mt-1 w-full rounded-lg border py-1.5 text-xs font-medium transition disabled:opacity-50"
                                  style={{
                                    borderColor: "rgba(37,99,235,0.30)",
                                    background: noteSaved ? "rgba(16,185,129,0.15)" : "rgba(37,99,235,0.10)",
                                    color: noteSaved ? "rgb(16 185 129)" : "#60a5fa",
                                  }}
                                >
                                  {savingNote ? "Guardando..." : noteSaved ? "✓ Guardado" : "Guardar nota"}
                                </button>
                              </div>
                            )}
                          </div>
                        ) : null}
                      </div>
                    ) : (
                    <div
                      className="rounded-xl border p-3"
                      style={{
                        borderColor: "var(--border-color)",
                        background:
                          "linear-gradient(135deg, rgba(37,99,235,0.06), var(--bg-soft))",
                      }}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p
                          className="text-sm font-semibold"
                          style={{ color: "var(--text-main)" }}
                        >
                          {selectedAppointment.service_name_snapshot || "Reserva"}
                        </p>

                        <span
                          className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${
                            isSelectedGroupAppointment &&
                            selectedGroupVisualState &&
                            selectedGroupStyles
                              ? selectedGroupStyles.stateBadge
                              : getStatusBadgeClass(selectedAppointment)
                          }`}
                        >
                          {isSelectedGroupAppointment && selectedGroupVisualState
                            ? selectedGroupVisualState.label
                            : getStatusLabel(selectedAppointment)}
                        </span>
                      </div>

                      <p
                        className="mt-1.5 text-sm capitalize"
                        style={{ color: "var(--text-muted)" }}
                      >
                        {formatLongDate(selectedAppointment.start_at)}
                      </p>
                      <p
                        className="mt-1 text-sm"
                        style={{ color: "var(--text-muted)" }}
                      >
                        {formatHour(selectedAppointment.start_at)} -{" "}
                        {formatHour(selectedAppointment.end_at)}
                      </p>
                      <p
                        className="mt-1 text-sm"
                        style={{ color: "var(--text-muted)" }}
                      >
                        Profesional: {getStaffName(selectedAppointment.staff_id)}
                      </p>

                      {selectedGroupAvailableSpots > 0 ? (
                        <button
                          type="button"
                          onClick={() => openManualBookingForGroup(selectedAppointment)}
                          className="mt-3 inline-flex h-9 w-full items-center justify-center rounded-xl bg-slate-950 px-3 text-xs font-semibold text-white transition hover:bg-slate-800"
                        >
                          Agregar inscrito
                        </button>
                      ) : (
                        <div className="mt-3 rounded-xl border px-3 py-2 text-xs font-semibold text-slate-500">
                          Cupos completos
                        </div>
                      )}
                    </div>
                    )}

                    {false && !isSelectedGroupAppointment ? (
                      <div
                        className="rounded-xl border p-3"
                        style={{
                          borderColor: "var(--border-color)",
                          background: "var(--bg-soft)",
                        }}
                      >
                        <p
                          className="mb-2 text-xs font-semibold"
                          style={{ color: "var(--text-muted)" }}
                        >
                          Acciones rápidas
                        </p>
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              if (isVeterinaria || isClinica || isOdontologia) {
                                handleAsistioClinico(selectedAppointment!);
                                return;
                              }

                              handleUpdateStatus(selectedAppointment!.id, "completed");
                            }}
                            disabled={statusSaving || closeSaving || selectedAppointment!.status === "completed"}
                            className="inline-flex h-10 items-center justify-center rounded-xl bg-emerald-600 px-3 text-xs font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            Asistió
                          </button>

                          <button
                            type="button"
                              onClick={() => handleUpdateStatus(selectedAppointment!.id, "no_show")}
                              disabled={statusSaving || selectedAppointment!.status === "no_show"}
                            className="inline-flex h-10 items-center justify-center rounded-xl bg-amber-500 px-3 text-xs font-semibold text-white transition hover:bg-amber-600 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            No asistió
                          </button>

                          <button
                            type="button"
                              onClick={() => handleUpdateStatus(selectedAppointment!.id, "rescheduled")}
                              disabled={statusSaving || selectedAppointment!.status === "rescheduled"}
                            className="inline-flex h-10 items-center justify-center rounded-xl bg-violet-600 px-3 text-xs font-semibold text-white transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            Reagendó
                          </button>

                          <button
                            type="button"
                            onClick={() => setCancelConfirmAppointment(selectedAppointment!)}
                            disabled={statusSaving || selectedAppointment!.status === "canceled"}
                            className="inline-flex h-10 items-center justify-center rounded-xl border px-3 text-xs font-semibold transition hover:shadow-sm disabled:cursor-not-allowed disabled:opacity-60"
                            style={{
                              borderColor: "var(--border-color)",
                              background: "var(--bg-card)",
                              color: "var(--text-main)",
                            }}
                          >
                            Cancelar reserva
                          </button>
                        </div>
                      </div>
                    ) : null}

                    {isSelectedGroupAppointment ? (
                      <div
                        className="rounded-xl border p-3"
                        style={{
                          borderColor: "var(--border-color)",
                          background: "var(--bg-card)",
                        }}
                      >
                        <div className="mb-3 flex items-center justify-between gap-2">
                          <p
                            className="text-sm font-semibold"
                            style={{ color: "var(--text-main)" }}
                          >
                            Inscritos
                          </p>
                          <div className="flex flex-wrap justify-end gap-2">
                            <span
                              className="rounded-full border px-2.5 py-1 text-[11px] font-semibold"
                              style={{
                                borderColor: "var(--border-color)",
                                color: "var(--text-muted)",
                              }}
                            >
                              {selectedGroupActiveCount}/{selectedGroupCapacity} inscritos
                            </span>
                          </div>
                        </div>

                        <p
                          className="mb-2 text-xs"
                          style={{ color: "var(--text-muted)" }}
                        >
                          Mostrando {selectedGroupVisibleCount} de{" "}
                          {selectedGroupAppointments.length} inscritos
                        </p>

                        <div className="max-h-[min(42vh,360px)] space-y-2 overflow-y-auto pb-3 pr-2">
                          {selectedGroupVisibleAppointments.map((attendee) => {
                            const isCanceled = attendee.status === "canceled";
                            const isCompleted = attendee.status === "completed";
                            const isNoShow = attendee.status === "no_show";
                            const isRescheduled = attendee.status === "rescheduled";

                            return (
                              <div
                                key={attendee.id}
                                className="rounded-xl border p-2.5"
                                style={{
                                  borderColor: "var(--border-color)",
                                  background: "var(--bg-soft)",
                                }}
                              >
                                <div className="flex items-start justify-between gap-2">
                                  <div className="min-w-0">
                                    <p
                                      className="truncate text-sm font-semibold"
                                      style={{ color: "var(--text-main)" }}
                                    >
                                      {attendee.customer_name}
                                    </p>
                                    <p
                                      className="mt-0.5 truncate text-xs"
                                      style={{ color: "var(--text-muted)" }}
                                    >
                                      {attendee.customer_email || "Email no disponible"}
                                    </p>
                                    <p
                                      className="mt-0.5 truncate text-xs"
                                      style={{ color: "var(--text-muted)" }}
                                    >
                                      {attendee.customer_phone || "Telefono no disponible"}
                                    </p>
                                  </div>

                                  <span
                                    className={`shrink-0 rounded-full border px-2.5 py-1 text-[11px] font-semibold ${getStatusBadgeClass(
                                      attendee
                                    )}`}
                                  >
                                    {getStatusLabel(attendee)}
                                  </span>
                                </div>

                                {!isCanceled ? (
                                  <div className="mt-2 flex flex-wrap gap-2">
                                    <button
                                      type="button"
                                      onClick={() =>
                                        handleUpdateStatus(attendee.id, "completed")
                                      }
                                      disabled={statusSaving || isCompleted}
                                      className="inline-flex h-8 items-center justify-center rounded-lg bg-emerald-600 px-2.5 text-[11px] font-medium text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                                    >
                                      {isCompleted ? "Asistió" : "Asistió"}
                                    </button>

                                    <button
                                      type="button"
                                      onClick={() =>
                                        handleUpdateStatus(attendee.id, "no_show")
                                      }
                                      disabled={statusSaving || isNoShow}
                                      className="inline-flex h-8 items-center justify-center rounded-lg bg-amber-500 px-2.5 text-[11px] font-medium text-white transition hover:bg-amber-600 disabled:cursor-not-allowed disabled:opacity-60"
                                    >
                                      {isNoShow
                                        ? "No asistió"
                                        : "No asistió"}
                                    </button>

                                    <button
                                      type="button"
                                      onClick={() =>
                                        handleUpdateStatus(attendee.id, "rescheduled")
                                      }
                                      disabled={statusSaving || isRescheduled}
                                      className="inline-flex h-8 items-center justify-center rounded-lg bg-violet-600 px-2.5 text-[11px] font-medium text-white transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-60"
                                    >
                                      Reagendó
                                    </button>

                                    <button
                                      type="button"
                                      onClick={() => setCancelConfirmAppointment(attendee)}
                                      disabled={statusSaving || isCanceled}
                                      className="inline-flex h-8 items-center justify-center gap-1 rounded-lg border px-2.5 text-[11px] font-medium transition hover:shadow-sm disabled:cursor-not-allowed disabled:opacity-60"
                                      style={{
                                        borderColor: "var(--border-color)",
                                        background: "var(--bg-card)",
                                        color: "var(--text-main)",
                                      }}
                                    >
                                      <X className="h-3 w-3" />
                                      Cancelar reserva
                                    </button>
                                  </div>
                                ) : null}
                              </div>
                            );
                          })}
                        </div>

                        <button
                          type="button"
                          onClick={handleOpenSelectedGroup}
                          className="mt-3 inline-flex h-9 w-full items-center justify-center rounded-xl border px-3 text-xs font-semibold transition hover:shadow-sm"
                          style={{
                            borderColor: "var(--border-color)",
                            background: "var(--bg-soft)",
                            color: "var(--text-main)",
                          }}
                          title="Abrir la vista dedicada de gestion del grupo."
                        >
                          Pasar lista
                        </button>
                      </div>
                    ) : null}

                    {false && selectedAppointment && !isSelectedGroupAppointment && isPastPendingClosure(selectedAppointment!) ? (
                      <Notice
                        tone="danger"
                        title="Esta cita ya terminó."
                        description={
                          isVeterinaria
                            ? "Debes cerrar su estado. En veterinaria, al marcar atendida tendrás que registrar el control realizado."
                            : "Debes cerrar su estado para mantener la agenda al día."
                        }
                      >
                        <div className="grid grid-cols-1 gap-2">
                                                    <button
                            type="button"
                            onClick={() => {
                              if (isVeterinaria || isClinica || isOdontologia) {
                                openVeterinaryCloseModal();
                                return;
                              }

                              handleUpdateStatus(
                                selectedAppointment!.id,
                                "completed"
                              );
                            }}
                            disabled={statusSaving || closeSaving}
                            className="inline-flex h-10 items-center justify-center rounded-xl bg-emerald-600 px-4 text-sm font-medium text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {statusSaving || closeSaving
                              ? "Guardando..."
                              : "Marcar atendida"}
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              handleUpdateStatus(
                                selectedAppointment!.id,
                                "no_show"
                              )
                            }
                            disabled={statusSaving}
                            className="inline-flex h-10 items-center justify-center rounded-xl bg-amber-500 px-4 text-sm font-medium text-white transition hover:bg-amber-600 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {statusSaving
                              ? "Guardando..."
                              : "Marcar no asistió"}
                          </button>
                        </div>
                      </Notice>
                    ) : null}

                    {isSelectedGroupAppointment ? null : (
                    <div
                      className="hidden"
                      style={{
                        borderColor: "var(--border-color)",
                        background: "var(--bg-card)",
                      }}
                    >
                      <div className="mb-3 flex items-center justify-between gap-2">
                        <p
                          className="text-sm font-semibold"
                          style={{ color: "var(--text-main)" }}
                        >
                          Datos del cliente
                        </p>

                        {!isEditingReservation ? (
                          <button
                            type="button"
                            onClick={() => {
                              setIsEditingReservation(true);
                              syncEditForm(selectedAppointment);
                            }}
                            className="inline-flex h-9 items-center justify-center rounded-xl border px-3 text-sm font-medium transition"
                            style={{
                              borderColor: "var(--border-color)",
                              background: "var(--bg-card)",
                              color: "var(--text-main)",
                            }}
                          >
                            Editar
                          </button>
                        ) : (
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                setIsEditingReservation(false);
                                syncEditForm(selectedAppointment);
                              }}
                              className="inline-flex h-9 items-center justify-center rounded-xl border px-3 text-sm font-medium transition"
                              style={{
                                borderColor: "var(--border-color)",
                                background: "var(--bg-card)",
                                color: "var(--text-main)",
                              }}
                            >
                              Cancelar
                            </button>
                            <button
                              type="button"
                              onClick={handleSaveReservationEdit}
                              disabled={editSaving}
                              className="inline-flex h-9 items-center justify-center rounded-xl bg-slate-900 px-3 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              {editSaving ? "Guardando..." : "Guardar"}
                            </button>
                          </div>
                        )}
                      </div>

                      {!isEditingReservation ? (
                        <div className="space-y-2">
                          <div
                            className="rounded-xl border p-3"
                            style={{
                              borderColor: "var(--border-color)",
                              background: "var(--bg-soft)",
                            }}
                          >
                            <p
                              className="text-[11px] font-semibold uppercase tracking-[0.16em]"
                              style={{ color: "var(--text-muted)" }}
                            >
                              Cliente
                            </p>
                            <p
                              className="mt-1 text-sm font-medium"
                              style={{ color: "var(--text-main)" }}
                            >
                              {selectedAppointment.customer_name}
                            </p>

                            {selectedAppointment.customer_data?.pet_name ? (
                              <p
                                className="mt-1 text-sm font-medium"
                                style={{ color: "#10b981" }}
                              >
                                🐶 {selectedAppointment.customer_data.pet_name}
                                {selectedAppointment.customer_data.pet_species
                                  ? ` (${selectedAppointment.customer_data.pet_species})`
                                  : ""}
                              </p>
                            ) : null}
                          </div>

                          <div
                            className="rounded-xl border p-3"
                            style={{
                              borderColor: "var(--border-color)",
                              background: "var(--bg-soft)",
                            }}
                          >
                            <p
                              className="text-[11px] font-semibold uppercase tracking-[0.16em]"
                              style={{ color: "var(--text-muted)" }}
                            >
                              Teléfono
                            </p>
                            <p
                              className="mt-1 text-sm font-medium"
                              style={{ color: "var(--text-main)" }}
                            >
                              {selectedAppointment.customer_phone ||
                                "No disponible"}
                            </p>
                          </div>

                          <div
                            className="rounded-xl border p-3"
                            style={{
                              borderColor: "var(--border-color)",
                              background: "var(--bg-soft)",
                            }}
                          >
                            <p
                              className="text-[11px] font-semibold uppercase tracking-[0.16em]"
                              style={{ color: "var(--text-muted)" }}
                            >
                              Email
                            </p>
                            <p
                              className="mt-1 break-all text-sm font-medium"
                              style={{ color: "var(--text-main)" }}
                            >
                              {selectedAppointment.customer_email ||
                                "No disponible"}
                            </p>
                          </div>

                          <div
                            className="rounded-xl border p-3"
                            style={{
                              borderColor: "var(--border-color)",
                              background: "var(--bg-soft)",
                            }}
                          >
                            <p
                              className="text-[11px] font-semibold uppercase tracking-[0.16em]"
                              style={{ color: "var(--text-muted)" }}
                            >
                              Profesional
                            </p>
                            <p
                              className="mt-1 text-sm font-medium"
                              style={{ color: "var(--text-main)" }}
                            >
                              {getStaffName(selectedAppointment.staff_id)}
                            </p>
                          </div>

                          <div
                            className="rounded-xl border p-3"
                            style={{
                              borderColor: "var(--border-color)",
                              background: "var(--bg-soft)",
                            }}
                          >
                            <p
                              className="text-[11px] font-semibold uppercase tracking-[0.16em]"
                              style={{ color: "var(--text-muted)" }}
                            >
                              Estado
                            </p>
                            <p
                              className="mt-1 text-sm font-medium"
                              style={{ color: "var(--text-main)" }}
                            >
                              {getStatusLabel(selectedAppointment)}
                            </p>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <div>
                            <label
                              className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.16em]"
                              style={{ color: "var(--text-muted)" }}
                            >
                              Cliente
                            </label>
                            <input
                              type="text"
                              value={editForm.customer_name}
                              onChange={(e) =>
                                setEditForm((prev) => ({
                                  ...prev,
                                  customer_name: e.target.value,
                                }))
                              }
                              className="h-10 w-full rounded-xl border px-3 text-sm outline-none transition"
                              style={{
                                borderColor: "var(--border-color)",
                                background: "var(--bg-card)",
                                color: "var(--text-main)",
                              }}
                            />
                          </div>

                          <div>
                            <label
                              className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.16em]"
                              style={{ color: "var(--text-muted)" }}
                            >
                              Teléfono
                            </label>
                            <input
                              type="text"
                              value={editForm.customer_phone}
                              onChange={(e) =>
                                setEditForm((prev) => ({
                                  ...prev,
                                  customer_phone: e.target.value,
                                }))
                              }
                              className="h-10 w-full rounded-xl border px-3 text-sm outline-none transition"
                              style={{
                                borderColor: "var(--border-color)",
                                background: "var(--bg-card)",
                                color: "var(--text-main)",
                              }}
                            />
                          </div>

                          <div>
                            <label
                              className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.16em]"
                              style={{ color: "var(--text-muted)" }}
                            >
                              Email
                            </label>
                            <input
                              type="email"
                              value={editForm.customer_email}
                              onChange={(e) =>
                                setEditForm((prev) => ({
                                  ...prev,
                                  customer_email: e.target.value,
                                }))
                              }
                              className="h-10 w-full rounded-xl border px-3 text-sm outline-none transition"
                              style={{
                                borderColor: "var(--border-color)",
                                background: "var(--bg-card)",
                                color: "var(--text-main)",
                              }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                    )}
                  </div>
                )}
              </div>
            </section>
          </div>
        </div>
        ) : null}
      </div>

      {closedScheduleDraft ? (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-950/50 px-4 backdrop-blur-sm">
          <div
            className="w-full max-w-md rounded-3xl border p-6 shadow-[0_24px_80px_-30px_rgba(15,23,42,0.75)]"
            style={{
              borderColor: "var(--border-color)",
              background:
                "linear-gradient(180deg, color-mix(in srgb, var(--bg-card) 96%, transparent), var(--bg-card))",
            }}
          >
            <h3
              className="text-lg font-semibold"
              style={{ color: "var(--text-main)" }}
            >
              {closedScheduleDraft.kind === "block"
                ? "Bloque cerrado"
                : "Día cerrado"}
            </h3>
            <p
              className="mt-2 text-sm leading-6"
              style={{ color: "var(--text-muted)" }}
            >
              {(() => {
                const ab = branches.find((b) => b.id === selectedBranchId);
                const isGlobal = ab?.use_global_hours === true;
                if (closedScheduleDraft.staff_id) return "Configura el horario del profesional o del negocio para habilitar este horario.";
                if (isGlobal) return "Este bloque sigue el horario global del negocio. Configúralo en Negocio.";
                return "Este bloque sigue el horario de la sucursal. Configúralo en Sucursales.";
              })()}
            </p>

            <div className="mt-5 grid gap-2">
              {(() => {
                const ab = branches.find((b) => b.id === selectedBranchId);
                const isGlobal = ab?.use_global_hours === true;
                const label = isGlobal ? "Configurar horario del negocio" : "Configurar horario de la sucursal";
                const route = isGlobal ? `/dashboard/${slug}/business` : `/dashboard/${slug}/branches`;
                return (
                  <button
                    type="button"
                    onClick={() => { setClosedScheduleDraft(null); router.push(route); }}
                    className="inline-flex h-10 items-center justify-center rounded-xl bg-slate-950 px-4 text-sm font-semibold text-white transition hover:bg-slate-800"
                  >
                    {label}
                  </button>
                );
              })()}

              {closedScheduleDraft.staff_id ? (
                <button
                  type="button"
                  onClick={() => {
                    setClosedScheduleDraft(null);
                    router.push(`/dashboard/${slug}/staff`);
                  }}
                  className="inline-flex h-10 items-center justify-center rounded-xl border px-4 text-sm font-semibold transition hover:shadow-sm"
                  style={{
                    borderColor: "var(--border-color)",
                    background: "var(--bg-soft)",
                    color: "var(--text-main)",
                  }}
                >
                  Configurar horario del profesional
                </button>
              ) : null}

              <button
                type="button"
                onClick={() => setClosedScheduleDraft(null)}
                className="inline-flex h-10 items-center justify-center rounded-xl border px-4 text-sm font-semibold transition hover:shadow-sm"
                style={{
                  borderColor: "var(--border-color)",
                  background: "var(--bg-card)",
                  color: "var(--text-main)",
                }}
              >
                Volver
              </button>
            </div>
          </div>
        </div>
      ) : null}


      {freeSlotActionDraft ? (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-950/50 px-4 backdrop-blur-sm">
          <div
            className="w-full max-w-md rounded-3xl border p-6 shadow-[0_24px_80px_-30px_rgba(15,23,42,0.75)]"
            style={{
              borderColor: "var(--border-color)",
              background:
                "linear-gradient(180deg, color-mix(in srgb, var(--bg-card) 96%, transparent), var(--bg-card))",
            }}
          >
            <div className="space-y-1">
              <h3
                className="text-lg font-semibold"
                style={{ color: "var(--text-main)" }}
              >
                {freeSlotActionDraft.mode === "schedule_config"
                  ? "¿Qué deseas configurar?"
                  : "¿Qué quieres hacer en este horario?"}
              </h3>
              <p
                className="text-sm leading-6"
                style={{ color: "var(--text-muted)" }}
              >
                {formatLongDate(freeSlotActionDraft.slot_start)} ·{" "}
                {formatHour(freeSlotActionDraft.slot_start)}
              </p>
            </div>

            <div className="mt-6 grid gap-2.5">
              {freeSlotActionDraft.mode === "actions" ? (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      const nextDraft = freeSlotActionDraft;
                      setFreeSlotActionDraft(null);
                      openManualBooking(nextDraft.slot_start, nextDraft.staff_id);
                    }}
                    className="inline-flex h-11 items-center justify-center rounded-xl bg-slate-950 px-4 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-slate-900 hover:shadow-[0_14px_28px_-16px_rgba(15,23,42,0.85)]"
                  >
                    Agendar cliente
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setFreeSlotActionDraft((prev) =>
                        prev ? { ...prev, mode: "schedule_config" } : prev
                      )
                    }
                    className="inline-flex h-11 items-center justify-center rounded-xl border px-4 text-sm font-semibold transition hover:-translate-y-0.5 hover:shadow-[0_14px_28px_-18px_rgba(59,130,246,0.65)]"
                    style={{
                      borderColor: "var(--border-color)",
                      background: "var(--bg-soft)",
                      color: "var(--text-main)",
                    }}
                  >
                    Configurar horarios
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      setFreeSlotActionDraft(null);
                      router.push(`/dashboard/${slug}/business`);
                    }}
                    className="inline-flex h-11 items-center justify-center rounded-xl bg-slate-950 px-4 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-slate-900 hover:shadow-[0_14px_28px_-16px_rgba(15,23,42,0.85)]"
                  >
                    Horarios del negocio
                  </button>

                  {freeSlotActionDraft.staff_id ? (
                    <button
                      type="button"
                      onClick={() => {
                        setFreeSlotActionDraft(null);
                        router.push(`/dashboard/${slug}/staff`);
                      }}
                      className="inline-flex h-11 items-center justify-center rounded-xl border px-4 text-sm font-semibold transition hover:-translate-y-0.5 hover:shadow-[0_14px_28px_-18px_rgba(59,130,246,0.65)]"
                      style={{
                        borderColor: "var(--border-color)",
                        background: "var(--bg-soft)",
                        color: "var(--text-main)",
                      }}
                    >
                      Horarios del profesional
                    </button>
                  ) : null}
                </>
              )}

              <button
                type="button"
                onClick={() => {
                  if (freeSlotActionDraft.mode === "schedule_config") {
                    setFreeSlotActionDraft((prev) =>
                      prev ? { ...prev, mode: "actions" } : prev
                    );
                    return;
                  }

                  setFreeSlotActionDraft(null);
                }}
                className="inline-flex h-11 items-center justify-center rounded-xl border px-4 text-sm font-semibold transition hover:-translate-y-0.5 hover:shadow-[0_14px_28px_-18px_rgba(15,23,42,0.35)]"
                style={{
                  borderColor: "var(--border-color)",
                  background: "var(--bg-card)",
                  color: "var(--text-main)",
                }}
              >
                Volver
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {manualBookingDraft ? (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-950/50 px-4">
          <div
            className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-3xl border p-5 shadow-2xl"
            style={{
              borderColor: "var(--border-color)",
              background: "var(--bg-card)",
            }}
          >
            <div className="mb-4">
              <h3
                className="text-lg font-semibold"
                style={{ color: "var(--text-main)" }}
              >
                {manualBookingStep === "confirm"
                  ? "¿Confirmar reserva?"
                  : "Nueva reserva"}
              </h3>
              <p
                className="mt-1 text-sm leading-6"
                style={{ color: "var(--text-muted)" }}
              >
                {formatLongDate(manualBookingDraft.slot_start)} ·{" "}
                {formatHour(manualBookingDraft.slot_start)}
              </p>
            </div>

            {manualBookingStep === "confirm" ? (
              <div className="grid gap-2">
                {[
                  ["Cliente", manualBookingDraft.customer_name],
                  [
                    "Servicio",
                    services.find(
                      (service) => service.id === manualBookingDraft.service_id
                    )?.name || "Servicio",
                  ],
                  [
                    "Profesional",
                    staffList.find(
                      (staff) => staff.id === manualBookingDraft.staff_id
                    )?.name || "Profesional",
                  ],
                  ["Fecha", formatLongDate(manualBookingDraft.slot_start)],
                  ["Hora", formatHour(manualBookingDraft.slot_start)],
                ].map(([label, value]) => (
                  <div
                    key={label}
                    className="rounded-xl border p-3"
                    style={{
                      borderColor: "var(--border-color)",
                      background: "var(--bg-soft)",
                    }}
                  >
                    <p
                      className="text-[11px] font-semibold uppercase tracking-[0.16em]"
                      style={{ color: "var(--text-muted)" }}
                    >
                      {label}
                    </p>
                    <p
                      className="mt-1 text-sm font-medium"
                      style={{ color: "var(--text-main)" }}
                    >
                      {value}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {!manualBookingDraft.staff_locked ? (
                  <div>
                    <label
                      className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.16em]"
                      style={{ color: "var(--text-muted)" }}
                    >
                      Profesional *
                    </label>
                    <select
                      value={manualBookingDraft.staff_id}
                      onChange={async (event) => {
                        const newStaffId = event.target.value;
                        setManualBookingDraft((prev) =>
                          prev ? { ...prev, staff_id: newStaffId, service_id: "" } : prev
                        );
                        if (!newStaffId) {
                          setModalServiceIds(null);
                          return;
                        }
                        try {
                          const q = new URLSearchParams({ tenant_id: tenantId, staff_id: newStaffId, branch_id: selectedBranchId });
                          const res = await apiFetch(`${BACKEND_URL}/staff-services?${q.toString()}`);
                          const data = await res.json();
                          const ids: string[] = Array.isArray(data?.staff_services)
                            ? data.staff_services.map((ss: any) => ss.service_id as string)
                            : [];
                          setModalServiceIds(ids);
                        } catch {
                          setModalServiceIds(null);
                        }
                      }}
                      className="h-10 w-full rounded-xl border px-3 text-sm outline-none transition"
                      style={{
                        borderColor: "var(--border-color)",
                        background: "var(--bg-soft)",
                        color: "var(--text-main)",
                      }}
                    >
                      <option value="">Selecciona profesional</option>
                      {staffList.map((staff) => (
                        <option key={staff.id} value={staff.id}>
                          {staff.name}
                        </option>
                      ))}
                    </select>
                  </div>
                ) : null}

                {!manualBookingDraft.service_locked ? (
                  <div>
                    <label
                      className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.16em]"
                      style={{ color: "var(--text-muted)" }}
                    >
                      Servicio *
                    </label>
                    <select
                      value={manualBookingDraft.service_id}
                      onChange={(event) =>
                        setManualBookingDraft((prev) =>
                          prev ? { ...prev, service_id: event.target.value } : prev
                        )
                      }
                      className="h-10 w-full rounded-xl border px-3 text-sm outline-none transition"
                      style={{
                        borderColor: "var(--border-color)",
                        background: "var(--bg-soft)",
                        color: "var(--text-main)",
                      }}
                    >
                      <option value="">Selecciona servicio</option>
                      {(modalServiceIds ? services.filter((s) => modalServiceIds.includes(s.id)) : services).map((service) => (
                        <option key={service.id} value={service.id}>
                          {service.name}
                        </option>
                      ))}
                    </select>
                  </div>
                ) : null}

                <div>
                  <label
                    className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.16em]"
                    style={{ color: "var(--text-muted)" }}
                  >
                    Nombre *
                  </label>
                  <input
                    value={manualBookingDraft.customer_name}
                    onChange={(event) =>
                      setManualBookingDraft((prev) =>
                        prev
                          ? { ...prev, customer_name: event.target.value }
                          : prev
                      )
                    }
                    className="h-10 w-full rounded-xl border px-3 text-sm outline-none transition"
                    style={{
                      borderColor: "var(--border-color)",
                      background: "var(--bg-soft)",
                      color: "var(--text-main)",
                    }}
                  />
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label
                      className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.16em]"
                      style={{ color: "var(--text-muted)" }}
                    >
                      Teléfono *
                    </label>
                    <input
                      value={manualBookingDraft.customer_phone}
                      onChange={(event) =>
                        setManualBookingDraft((prev) =>
                          prev
                            ? { ...prev, customer_phone: event.target.value }
                            : prev
                        )
                      }
                      className="h-10 w-full rounded-xl border px-3 text-sm outline-none transition"
                      style={{
                        borderColor: "var(--border-color)",
                        background: "var(--bg-soft)",
                        color: "var(--text-main)",
                      }}
                    />
                  </div>

                  <div>
                    <label
                      className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.16em]"
                      style={{ color: "var(--text-muted)" }}
                    >
                      Correo *
                    </label>
                    <input
                      type="email"
                      value={manualBookingDraft.customer_email}
                      onChange={(event) =>
                        setManualBookingDraft((prev) =>
                          prev
                            ? { ...prev, customer_email: event.target.value }
                            : prev
                        )
                      }
                      className="h-10 w-full rounded-xl border px-3 text-sm outline-none transition"
                      style={{
                        borderColor: "var(--border-color)",
                        background: "var(--bg-soft)",
                        color: "var(--text-main)",
                      }}
                    />
                  </div>
                </div>

                {isVeterinaria ? (
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <label
                        className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.16em]"
                        style={{ color: "var(--text-muted)" }}
                      >
                        Nombre de mascota *
                      </label>
                      <input
                        value={manualBookingDraft.pet_name}
                        onChange={(event) =>
                          setManualBookingDraft((prev) =>
                            prev ? { ...prev, pet_name: event.target.value } : prev
                          )
                        }
                        className="h-10 w-full rounded-xl border px-3 text-sm outline-none transition"
                        style={{
                          borderColor: "var(--border-color)",
                          background: "var(--bg-soft)",
                          color: "var(--text-main)",
                        }}
                      />
                    </div>

                    <div>
                      <label
                        className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.16em]"
                        style={{ color: "var(--text-muted)" }}
                      >
                        Especie *
                      </label>
                      <input
                        value={manualBookingDraft.pet_species}
                        onChange={(event) =>
                          setManualBookingDraft((prev) =>
                            prev
                              ? { ...prev, pet_species: event.target.value }
                              : prev
                          )
                        }
                        className="h-10 w-full rounded-xl border px-3 text-sm outline-none transition"
                        style={{
                          borderColor: "var(--border-color)",
                          background: "var(--bg-soft)",
                          color: "var(--text-main)",
                        }}
                      />
                    </div>
                  </div>
                ) : null}

                <div>
                  <label
                    className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.16em]"
                    style={{ color: "var(--text-muted)" }}
                  >
                    Nota opcional
                  </label>
                  <textarea
                    rows={3}
                    value={manualBookingDraft.note}
                    onChange={(event) =>
                      setManualBookingDraft((prev) =>
                        prev ? { ...prev, note: event.target.value } : prev
                      )
                    }
                    className="w-full resize-none rounded-xl border px-3 py-2 text-sm outline-none transition"
                    style={{
                      borderColor: "var(--border-color)",
                      background: "var(--bg-soft)",
                      color: "var(--text-main)",
                    }}
                  />
                </div>
              </div>
            )}

            {manualBookingError ? (
              <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                {manualBookingError}
              </div>
            ) : null}

            <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={
                  manualBookingStep === "confirm"
                    ? () => setManualBookingStep("form")
                    : closeManualBookingModal
                }
                disabled={manualBookingSaving}
                className="inline-flex h-10 items-center justify-center rounded-xl border px-4 text-sm font-semibold transition hover:shadow-sm disabled:cursor-not-allowed disabled:opacity-60"
                style={{
                  borderColor: "var(--border-color)",
                  background: "var(--bg-soft)",
                  color: "var(--text-main)",
                }}
              >
                {manualBookingStep === "confirm" ? "Volver" : "Cancelar"}
              </button>
              <button
                type="button"
                onClick={() => {
                  if (manualBookingStep === "confirm") {
                    handleConfirmManualBooking();
                    return;
                  }

                  const validationError =
                    validateManualBookingDraft(manualBookingDraft);
                  if (validationError) {
                    setManualBookingError(validationError);
                    return;
                  }

                  setManualBookingError("");
                  setManualBookingStep("confirm");
                }}
                disabled={manualBookingSaving}
                className="inline-flex h-10 items-center justify-center rounded-xl bg-slate-950 px-4 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {manualBookingSaving
                  ? "Creando..."
                  : manualBookingStep === "confirm"
                  ? "Confirmar reserva"
                  : "Continuar"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {clinicalPendingModal ? (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-950/50 px-4">
          <div
            className="w-full max-w-md rounded-3xl border p-5 shadow-2xl"
            style={{
              borderColor: "var(--border-color)",
              background: "var(--bg-card)",
            }}
          >
            <h3
              className="text-lg font-semibold"
              style={{ color: "var(--text-main)" }}
            >
              ¿Completar ficha / atención?
            </h3>
            <p
              className="mt-2 text-sm leading-6"
              style={{ color: "var(--text-muted)" }}
            >
              La cita fue marcada como atendida. ¿Deseas completar la ficha clínica ahora?
            </p>

            <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={async () => {
                  const appt = clinicalPendingModal;
                  setClinicalPendingModal(null);
                  try {
                    await apiFetch(
                      `${BACKEND_URL}/appointments/${appt.id}/clinical-pending`,
                      {
                        method: "PATCH",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ pending: true, slug }),
                      }
                    );
                  } catch {}
                }}
                className="inline-flex h-10 items-center justify-center rounded-xl border px-4 text-sm font-semibold transition hover:shadow-sm"
                style={{
                  borderColor: "var(--border-color)",
                  background: "var(--bg-soft)",
                  color: "var(--text-main)",
                }}
              >
                Más tarde
              </button>
              <button
                type="button"
                onClick={() => {
                  const appt = clinicalPendingModal;
                  setClinicalPendingModal(null);
                  router.push(`/dashboard/${slug}/customers/${appt.customer_id}?appointment_id=${appt.id}&open_note=true`);
                }}
                className="inline-flex h-10 items-center justify-center rounded-xl bg-emerald-600 px-4 text-sm font-semibold text-white transition hover:bg-emerald-700"
              >
                Completar ficha / atención
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {cancelConfirmAppointment ? (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-950/50 px-4">
          <div
            className="w-full max-w-md rounded-3xl border p-5 shadow-2xl"
            style={{
              borderColor: "var(--border-color)",
              background: "var(--bg-card)",
            }}
          >
            <h3
              className="text-lg font-semibold"
              style={{ color: "var(--text-main)" }}
            >
              ¿Cancelar reserva?
            </h3>
            <p
              className="mt-2 text-sm leading-6"
              style={{ color: "var(--text-muted)" }}
            >
              Esta acción cancelará la reserva del cliente.
            </p>

            <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setCancelConfirmAppointment(null)}
                className="inline-flex h-10 items-center justify-center rounded-xl border px-4 text-sm font-semibold transition hover:shadow-sm"
                style={{
                  borderColor: "var(--border-color)",
                  background: "var(--bg-soft)",
                  color: "var(--text-main)",
                }}
              >
                Volver
              </button>
              <button
                type="button"
                onClick={() => {
                  const appointmentId = cancelConfirmAppointment.id;
                  setCancelConfirmAppointment(null);
                  handleUpdateStatus(appointmentId, "canceled");
                }}
                disabled={statusSaving}
                className="inline-flex h-10 items-center justify-center rounded-xl bg-red-600 px-4 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Sí, cancelar reserva
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {showCloseModal && selectedAppointment ? (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-950/50 px-4">
          <div
            className="w-full max-w-xl rounded-3xl border p-5 shadow-2xl"
            style={{
              borderColor: "var(--border-color)",
              background: "var(--bg-card)",
            }}
          >
            <div className="mb-4">
              <h3
                className="text-lg font-semibold"
                style={{ color: "var(--text-main)" }}
              >
                {isOdontologia ? "Cerrar atención dental" : isClinica ? "Cerrar atención clínica" : "Cerrar atención veterinaria"}
              </h3>
              <p
                className="mt-1 text-sm leading-6"
                style={{ color: "var(--text-muted)" }}
              >
                Registra el control realizado para marcar esta cita como atendida.
              </p>
            </div>

            <div className="space-y-4">
              <div
                className="rounded-2xl border p-3"
                style={{
                  borderColor: "var(--border-color)",
                  background: "var(--bg-soft)",
                }}
              >
                <p
                  className="text-sm font-semibold"
                  style={{ color: "var(--text-main)" }}
                >
                  {selectedAppointment.customer_name}
                </p>

                {selectedAppointment.customer_data?.pet_name ? (
                  <p
                    className="mt-1 text-sm font-medium"
                    style={{ color: "#10b981" }}
                  >
                    🐶 {selectedAppointment.customer_data.pet_name}
                    {selectedAppointment.customer_data.pet_species
                      ? ` (${selectedAppointment.customer_data.pet_species})`
                      : ""}
                  </p>
                ) : null}

                <p
                  className="mt-1 text-xs"
                  style={{ color: "var(--text-muted)" }}
                >
                  {selectedAppointment.service_name_snapshot || "Reserva"} ·{" "}
                  {formatHour(selectedAppointment.start_at)}
                </p>
              </div>

              <div>
                <label
                  className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.16em]"
                  style={{ color: "var(--text-muted)" }}
                >
                  Control realizado *
                </label>

                <select
                  value={closeForm.control_type}
                  onChange={(e) =>
                    setCloseForm((prev) => ({
                      ...prev,
                      control_type: e.target.value,
                    }))
                  }
                  className="h-11 w-full rounded-xl border px-3 text-sm outline-none transition"
                  style={{
                    borderColor: "var(--border-color)",
                    background: "var(--bg-card)",
                    color: "var(--text-main)",
                  }}
                >
                  {CONTROL_TYPES.map((opt) => (
                    <option key={opt}>{opt}</option>
                  ))}
                </select>
              </div>

              {closeForm.control_type === "Otro" ? (
                <div>
                  <label
                    className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.16em]"
                    style={{ color: "var(--text-muted)" }}
                  >
                    Especificar control *
                  </label>

                  <input
                    type="text"
                    value={closeForm.custom_control_type}
                    onChange={(e) =>
                      setCloseForm((prev) => ({
                        ...prev,
                        custom_control_type: e.target.value,
                      }))
                    }
                    placeholder="Ej: Curación, control post operatorio..."
                    className="h-11 w-full rounded-xl border px-3 text-sm outline-none transition"
                    style={{
                      borderColor: "var(--border-color)",
                      background: "var(--bg-card)",
                      color: "var(--text-main)",
                    }}
                  />
                </div>
              ) : null}

              <div>
                <label
                  className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.16em]"
                  style={{ color: "var(--text-muted)" }}
                >
                  Nota breve
                </label>

                <textarea
                  value={closeForm.control_note}
                  onChange={(e) =>
                    setCloseForm((prev) => ({
                      ...prev,
                      control_note: e.target.value,
                    }))
                  }
                  rows={3}
                  placeholder="Opcional"
                  className="w-full rounded-xl border px-3 py-2 text-sm outline-none transition"
                  style={{
                    borderColor: "var(--border-color)",
                    background: "var(--bg-card)",
                    color: "var(--text-main)",
                  }}
                />
              </div>

              <div>
                <label
                  className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.16em]"
                  style={{ color: "var(--text-muted)" }}
                >
                  Diagnóstico
                </label>

                <textarea
                  value={closeForm.diagnosis}
                  onChange={(e) =>
                    setCloseForm((prev) => ({
                      ...prev,
                      diagnosis: e.target.value,
                    }))
                  }
                  rows={2}
                  placeholder="Opcional"
                  className="w-full rounded-xl border px-3 py-2 text-sm outline-none transition"
                  style={{
                    borderColor: "var(--border-color)",
                    background: "var(--bg-card)",
                    color: "var(--text-main)",
                  }}
                />
              </div>

              <div>
                <label
                  className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.16em]"
                  style={{ color: "var(--text-muted)" }}
                >
                  Tratamiento indicado
                </label>

                <textarea
                  value={closeForm.treatment}
                  onChange={(e) =>
                    setCloseForm((prev) => ({
                      ...prev,
                      treatment: e.target.value,
                    }))
                  }
                  rows={2}
                  placeholder="Opcional"
                  className="w-full rounded-xl border px-3 py-2 text-sm outline-none transition"
                  style={{
                    borderColor: "var(--border-color)",
                    background: "var(--bg-card)",
                    color: "var(--text-main)",
                  }}
                />
              </div>

              {/* ── Campos nuevos: síntomas, medicamentos, derivaciones, seguimiento ── */}
              <div className="grid gap-3 sm:grid-cols-2">
                {[
                  { key: "symptoms",       label: "Síntomas",             placeholder: "Síntomas referidos" },
                  { key: "medications",    label: "Medicamentos",         placeholder: "Fármacos, dosis…" },
                  { key: "referrals",      label: "Derivaciones",         placeholder: "Interconsultas, derivaciones…" },
                  { key: "follow_up_notes", label: "Notas de seguimiento", placeholder: "Indicaciones para próximo control…" },
                ].map(({ key, label, placeholder }) => (
                  <div key={key}>
                    <label
                      className="mb-1 block text-sm font-semibold"
                      style={{ color: "var(--text-main)" }}
                    >
                      {label}
                    </label>
                    <textarea
                      value={(closeForm as any)[key]}
                      onChange={(e) => setCloseForm((prev) => ({ ...prev, [key]: e.target.value }))}
                      rows={2}
                      placeholder={placeholder}
                      className="w-full rounded-xl border px-3 py-2 text-sm outline-none transition"
                      style={{
                        borderColor: "var(--border-color)",
                        background: "var(--bg-card)",
                        color: "var(--text-main)",
                      }}
                    />
                  </div>
                ))}
              </div>

              <div
                className="rounded-2xl border p-4"
                style={{
                  borderColor: "var(--border-color)",
                  background: "var(--bg-soft)",
                }}
              >
                <div className="mb-3">
                  <p
                    className="text-sm font-semibold"
                    style={{ color: "var(--text-main)" }}
                  >
                    Próximo control
                  </p>
                  <p
                    className="mt-1 text-sm"
                    style={{ color: "var(--text-muted)" }}
                  >
                    No es obligatorio, pero siempre debes revisarlo antes de cerrar.
                  </p>
                </div>

                <select
                  value={closeForm.next_control_mode}
                  onChange={(e) =>
                    setCloseForm((prev) => ({
                      ...prev,
                      next_control_mode: e.target.value as VeterinaryNextControlMode,
                    }))
                  }
                  className="h-11 w-full rounded-xl border px-3 text-sm outline-none transition"
                  style={{
                    borderColor: "var(--border-color)",
                    background: "var(--bg-card)",
                    color: "var(--text-main)",
                  }}
                >
                  <option value="none">Sin próximo control</option>
                  <option value="7_days">7 días</option>
                  <option value="15_days">15 días</option>
                  <option value="30_days">30 días</option>
                  <option value="2_months">2 meses</option>
                  <option value="3_months">3 meses</option>
                  <option value="6_months">6 meses</option>
<option value="1_year">1 año</option>
<option value="exact_date">Fecha exacta</option>
<option value="custom">Personalizado</option>
                </select>

{closeForm.next_control_mode === "exact_date" ? (
  <div className="mt-3">
    <input
      type="date"
      value={closeForm.next_control_exact_date}
      onChange={(e) =>
        setCloseForm((prev) => ({
          ...prev,
          next_control_exact_date: e.target.value,
        }))
      }
      className="h-11 w-full rounded-xl border px-3 text-sm outline-none transition"
      style={{
        borderColor: "var(--border-color)",
        background: "var(--bg-card)",
        color: "var(--text-main)",
      }}
    />
  </div>
) : null}

                {closeForm.next_control_mode === "custom" ? (
                  <div className="mt-3 grid grid-cols-[1fr_140px] gap-2">
                    <input
                      type="number"
                      min={1}
                      value={closeForm.next_control_custom_value}
                      onChange={(e) =>
                        setCloseForm((prev) => ({
                          ...prev,
                          next_control_custom_value: e.target.value,
                        }))
                      }
                      placeholder="Cantidad"
                      className="h-11 rounded-xl border px-3 text-sm outline-none transition"
                      style={{
                        borderColor: "var(--border-color)",
                        background: "var(--bg-card)",
                        color: "var(--text-main)",
                      }}
                    />

                    <select
                      value={closeForm.next_control_custom_unit}
                      onChange={(e) =>
                        setCloseForm((prev) => ({
                          ...prev,
                          next_control_custom_unit: e.target.value as
                            | "days"
                            | "months"
                            | "years",
                        }))
                      }
                      className="h-11 rounded-xl border px-3 text-sm outline-none transition"
                      style={{
                        borderColor: "var(--border-color)",
                        background: "var(--bg-card)",
                        color: "var(--text-main)",
                      }}
                    >
                      <option value="days">Días</option>
                      <option value="months">Meses</option>
                      <option value="years">Años</option>
                    </select>
                  </div>
                ) : null}
              </div>

              {closeError ? <Notice tone="danger" title={closeError} /> : null}

              <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={closeVeterinaryCloseModal}
                  disabled={closeSaving}
                  className="inline-flex h-11 items-center justify-center rounded-xl border px-4 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-60"
                  style={{
                    borderColor: "var(--border-color)",
                    background: "var(--bg-card)",
                    color: "var(--text-main)",
                  }}
                >
                  Cancelar
                </button>

                <button
                  type="button"
                  onClick={handleCloseVeterinaryAppointment}
                  disabled={closeSaving}
                  className="inline-flex h-11 items-center justify-center rounded-xl bg-emerald-600 px-4 text-sm font-medium text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {closeSaving ? "Guardando..." : "Guardar y cerrar atención"}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {hoverCard ? (() => {
        const hoverAppointment = hoverCard.appointment;
        const hoverIsGroup = isGroupAppointment(hoverAppointment);
        const hoverGroup = hoverIsGroup
          ? appointments.filter(
              (appt) =>
                getAppointmentGroupKey(appt) ===
                getAppointmentGroupKey(hoverAppointment)
            )
          : [];
        const hoverGroupState =
          hoverIsGroup && hoverGroup.length > 0
            ? getGroupBookingVisualState(hoverGroup)
            : null;
        const hoverGroupStyles = hoverGroupState
          ? getGroupBookingStyles(hoverGroupState.key, false)
          : null;
        const hoverActiveCount = hoverGroup.filter(
          (appt) => appt.status !== "canceled"
        ).length;
        const hoverCapacity =
          Number(hoverAppointment.service_capacity || 0) ||
          hoverActiveCount ||
          hoverGroup.length;

        return (
  <div
    className="pointer-events-none fixed z-[80] hidden w-[300px] rounded-2xl border p-4 shadow-[0_20px_50px_-20px_rgba(15,23,42,0.35)] backdrop-blur xl:block"
    style={{
      borderColor: "var(--border-color)",
      background: "var(--bg-card)",
      left: hoverCard.x,
      top: hoverCard.y,
    }}
  >
          {hoverIsGroup && hoverGroupState && hoverGroupStyles ? (
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p
                    className="truncate text-sm font-semibold"
                    style={{ color: "var(--text-main)" }}
                  >
                    {hoverAppointment.service_name_snapshot || "Reserva grupal"}
                  </p>
                  <p
                    className="mt-1 text-xs"
                    style={{ color: "var(--text-muted)" }}
                  >
                    Actividad grupal
                  </p>
                </div>

                <span
                  className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-semibold ${hoverGroupStyles.stateBadge}`}
                >
                  {hoverGroupState.label}
                </span>
              </div>

              <div className="grid gap-2 text-xs">
                <div>
                  <p
                    className="font-semibold uppercase tracking-[0.14em]"
                    style={{ color: "var(--text-muted)" }}
                  >
                    Profesional
                  </p>
                  <p
                    className="mt-1 font-medium"
                    style={{ color: "var(--text-main)" }}
                  >
                    {getStaffName(hoverAppointment.staff_id)}
                  </p>
                </div>

                <div>
                  <p
                    className="font-semibold uppercase tracking-[0.14em]"
                    style={{ color: "var(--text-muted)" }}
                  >
                    Inscritos
                  </p>
                  <p
                    className="mt-1 font-medium"
                    style={{ color: "var(--text-main)" }}
                  >
                    {hoverActiveCount}/{hoverCapacity} inscritos
                  </p>
                </div>

                <div>
                  <p
                    className="font-semibold uppercase tracking-[0.14em]"
                    style={{ color: "var(--text-muted)" }}
                  >
                    Estado
                  </p>
                  <p
                    className="mt-1 leading-5"
                    style={{ color: "var(--text-main)" }}
                  >
                    {hoverGroupState.tooltip}
                  </p>
                </div>
              </div>

            </div>
          ) : (
          <div className="space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-slate-900">
                  {hoverCard.appointment.customer_name}
                </p>
                <p className="mt-1 truncate text-xs text-slate-500">
                  {hoverCard.appointment.service_name_snapshot || "Reserva"}
                </p>
                {hoverCard.appointment.customer_data?.pet_name ? (
                  <p className="mt-1 text-xs font-medium text-emerald-600">
                    🐶 {hoverCard.appointment.customer_data.pet_name}
                    {hoverCard.appointment.customer_data.pet_species
                      ? ` (${hoverCard.appointment.customer_data.pet_species})`
                      : ""}
                  </p>
                ) : null}
              </div>

              <span
                className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-semibold ${getStatusBadgeClass(
                  hoverCard.appointment
                )}`}
              >
                {getStatusLabel(hoverCard.appointment)}
              </span>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                Horario
              </p>
              <p className="mt-1 text-sm font-medium text-slate-900">
                {formatHour(hoverCard.appointment.start_at)} -{" "}
                {formatHour(hoverCard.appointment.end_at)}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                {formatLongDate(hoverCard.appointment.start_at)}
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                Profesional
              </p>
              <p className="mt-1 text-sm font-medium text-slate-900">
                {getStaffName(hoverCard.appointment.staff_id)}
              </p>
            </div>

            <div className="grid gap-2">
              <div className="rounded-xl border border-slate-200 bg-white p-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                  Teléfono
                </p>
                <p className="mt-1 text-sm font-medium text-slate-900">
                  {hoverCard.appointment.customer_phone || "No disponible"}
                </p>
              </div>

              <div className="rounded-xl border border-slate-200 bg-white p-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                  Email
                </p>
                <p className="mt-1 break-all text-sm font-medium text-slate-900">
                  {hoverCard.appointment.customer_email || "No disponible"}
                </p>
              </div>
            </div>
          </div>
          )}
        </div>
        );
      })() : null}
    </div>
  );
}
