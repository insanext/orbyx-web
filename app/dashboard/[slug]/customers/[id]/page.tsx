"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { Panel } from "../../../../../components/dashboard/panel";

const BACKEND_URL = "https://orbyx-backend.onrender.com";

/* ================= TYPES ================= */

type Customer = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  last_visit_at: string | null;
  total_visits: number;
  rut?: string | null;
  birth_date?: string | null;
  sex?: string | null;
  occupation?: string | null;
  health_insurance?: string | null;
  emergency_contact_name?: string | null;
  emergency_contact_phone?: string | null;
  known_allergies?: string | null;
  chronic_conditions?: string | null;
  family_history?: string | null;
  habits?: string | null;
};

type Pet = {
  id: string;
  name: string;
  species_base: string;
  species_custom?: string | null;
  breed?: string | null;
  sex?: string | null;
  weight_kg?: number | null;
  is_sterilized?: boolean;
  notes?: string | null;
};

type PetFormState = {
  name: string;
  species_base: "perro" | "gato" | "otro";
  species_custom: string;
  breed: string;
  sex: string;
  weight_kg: string;
  is_sterilized: boolean;
  notes: string;
};

type Appointment = {
  id: string;
  service_name_snapshot?: string;
  start_at: string;
  status?: string | null;

  pet_id?: string | null;
  customer_data?: any;

  reason?: string | null;
  notes?: string | null;
  next_control_at?: string | null;
};

type BusinessResponse = {
  business?: {
    business_category?: string | null;
    name?: string | null;
    logo_url?: string | null;
  };
};

type PetFollowup = {
  id: string;
  control_type: string;
  control_note?: string | null;
  next_control_at?: string | null;
  next_control_label?: string | null;
  pets?: {
    id?: string;
    name?: string;
    species_base?: string | null;
    species_custom?: string | null;
  } | null;
};

type VetCustomerTab = "pets" | "summary" | "followups";

type ClinicalNote = {
  id: string;
  pet_id: string;
  appointment_id?: string | null;
  staff_id?: string | null;
  date: string;
  control_type?: string | null;
  reason?: string | null;
  diagnosis?: string | null;
  treatment?: string | null;
  symptoms?: string | null;
  medications?: string | null;
  referrals?: string | null;
  follow_up_notes?: string | null;
  observations?: string | null;
  next_control_at?: string | null;
  next_control_label?: string | null;
  created_at?: string | null;
};

type ClinicalFormEntry = {
  reason: string;
  notes: string;
  diagnosis: string;
  treatment: string;
  controlDate: string;
  controlType: string;
};

/* ================= HELPERS ================= */

function formatDate(value?: string | null) {
  if (!value) return "Sin información";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Sin información";
  return date.toLocaleDateString("es-CL");
}

function formatDateLong(value?: string | null) {
  if (!value) return "Sin información";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Sin información";

  const text = date.toLocaleDateString("es-CL", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return text.charAt(0).toUpperCase() + text.slice(1);
}

function getPetSpeciesLabel(pet: Pet) {
  if (pet.species_base === "otro") {
    return pet.species_custom || "Otro";
  }

  return pet.species_base || "Sin tipo";
}

function SummaryCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string | number;
  hint?: string;
}) {
  return (
    <div
      className="rounded-2xl border p-3 sm:p-4"
      style={{
        borderColor: "var(--border-color)",
        background:
          "linear-gradient(180deg, rgba(37,99,235,0.05), var(--bg-card))",
      }}
    >
      <p
        className="text-[11px] font-semibold uppercase tracking-[0.18em]"
        style={{ color: "var(--text-muted)" }}
      >
        {label}
      </p>

      <p
        className="mt-2 text-xl font-semibold sm:text-2xl"
        style={{ color: "var(--text-main)" }}
      >
        {value}
      </p>

      {hint ? (
        <p
          className="mt-2 text-sm leading-6"
          style={{ color: "var(--text-muted)" }}
        >
          {hint}
        </p>
      ) : null}
    </div>
  );
}

function EmptyState({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div
      className="rounded-2xl border border-dashed px-4 py-5"
      style={{
        borderColor: "var(--border-color)",
        background: "var(--bg-soft)",
      }}
    >
      <p
        className="text-sm font-semibold"
        style={{ color: "var(--text-main)" }}
      >
        {title}
      </p>
      <p
        className="mt-1 text-sm leading-6"
        style={{ color: "var(--text-muted)" }}
      >
        {description}
      </p>
    </div>
  );
}

/* ================= PAGE ================= */

export default function CustomerDetailPage() {
  const params = useParams();
  const slug = params?.slug as string;
  const customerId = params?.id as string;
  const searchParams = useSearchParams();
  const autoOpenApptId = searchParams?.get("appointment_id") ?? null;
  const autoOpenNote = searchParams?.get("open_note") ?? null;
  const hasAutoOpenedRef = useRef(false);

  const [customer, setCustomer] = useState<Customer | null>(null);
  const [incompleteProfileBanner, setIncompleteProfileBanner] = useState(false);
  const [businessCategory, setBusinessCategory] = useState("");
  const isVeterinaria =
    businessCategory === "veterinaria" || businessCategory === "vet";
  const isVet = isVeterinaria;
  const isClinica = businessCategory === "clinica";

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

  const [pets, setPets] = useState<Pet[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [followups, setFollowups] = useState<PetFollowup[]>([]);
  const [loading, setLoading] = useState(true);

  const [savingPet, setSavingPet] = useState(false);
  const [petError, setPetError] = useState("");
  const [petSuccess, setPetSuccess] = useState("");
  const [savingClinicalId, setSavingClinicalId] = useState<string | null>(null);
  const [clinicalMessage, setClinicalMessage] = useState("");
  const [editingPetId, setEditingPetId] = useState<string | null>(null);
  const [viewingPetId, setViewingPetId] = useState<string | null>(null);
  const [activeVetTab, setActiveVetTab] = useState<VetCustomerTab>("pets");
  const [selectedControlPreset, setSelectedControlPreset] = useState<Record<string, number>>({});
  const [clinicalNotes, setClinicalNotes] = useState<Record<string, ClinicalNote[]>>({});
  const [clinicalFormState, setClinicalFormState] = useState<Record<string, ClinicalFormEntry>>({});
  const [selectedBranchId, setSelectedBranchId] = useState("");
  const [tenant, setTenant] = useState<{ name: string; logo_url?: string | null } | null>(null);
  const [printingPetId, setPrintingPetId] = useState<string | null>(null);

  // Pendiente 1: toggle agregar mascota
  const [showPetForm, setShowPetForm] = useState(false);
  // Sección A: edición de datos de mascota
  const [editingPetDataId, setEditingPetDataId] = useState<string | null>(null);
  const [editPetForm, setEditPetForm] = useState<PetFormState>({
    name: "",
    species_base: "perro",
    species_custom: "",
    breed: "",
    sex: "",
    weight_kg: "",
    is_sterilized: false,
    notes: "",
  });
  // Sección C: edición inline de nota clínica
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [newNoteApptId, setNewNoteApptId] = useState<string | null>(null);
  const [viewingNoteId, setViewingNoteId] = useState<string | null>(null);

  // Clínica humana (isClinica): edición de datos del paciente
  const [editingPatient, setEditingPatient] = useState(false);
  const [showPatientProfile, setShowPatientProfile] = useState(false);
  const [showResumenModal, setShowResumenModal] = useState(false);
  const [editPatientForm, setEditPatientForm] = useState({
    name: "",
    phone: "",
    email: "",
    rut: "",
    birth_date: "",
    sex: "",
    occupation: "",
    health_insurance: "",
    emergency_contact_name: "",
    emergency_contact_phone: "",
    known_allergies: "",
    chronic_conditions: "",
    family_history: "",
    habits: "",
  });
  // Notas clínicas de paciente (clave = "customer_${customerId}")
  const PATIENT_NOTES_KEY = `customer_${customerId}`;

  function todayISO() {
    return new Date().toISOString().split("T")[0];
  }

  const [showNewNoteForm, setShowNewNoteForm] = useState(false);
  const [newNoteForm, setNewNoteForm] = useState({
    date: todayISO(),
    control_type: "Control general",
    reason: "",
    symptoms: "",
    diagnosis: "",
    treatment: "",
    medications: "",
    referrals: "",
    observations: "",
    follow_up_notes: "",
    next_control_at: "",
    next_control_label: "",
  });
  const [savingNewNote, setSavingNewNote] = useState(false);
  const [newNoteError, setNewNoteError] = useState("");

  const [petForm, setPetForm] = useState<PetFormState>({
    name: "",
    species_base: "perro",
    species_custom: "",
    breed: "",
    sex: "",
    weight_kg: "",
    is_sterilized: false,
    notes: "",
  });
  const branchStorageKey = useMemo(() => {
    return slug ? `orbyx_active_branch_${slug}` : "";
  }, [slug]);

  function readStoredBranchId() {
    if (typeof window === "undefined" || !branchStorageKey) return "";
    return localStorage.getItem(branchStorageKey) || "";
  }

  async function loadClinicalNotes(petId: string) {
    try {
      const res = await fetch(
        `${BACKEND_URL}/clinical-notes/${slug}?pet_id=${petId}&limit=50`
      );
      if (!res.ok) return;
      const data = await res.json();
      setClinicalNotes((prev) => ({
        ...prev,
        [petId]: Array.isArray(data.notes) ? data.notes : [],
      }));
    } catch {
      // silencioso
    }
  }

  function handleOpenEdit(petId: string, currentAppointments: Appointment[]) {
    const latestAppt = currentAppointments.filter((a) => a.pet_id === petId)[0];
    if (!latestAppt) {
      setEditingPetId(petId);
      return;
    }
    const existingNote = clinicalNotes[petId]?.[0];
    setClinicalFormState((prev) => ({
      ...prev,
      [latestAppt.id]: {
        reason: String(latestAppt.reason || existingNote?.reason || ""),
        notes: String(latestAppt.notes || existingNote?.observations || ""),
        diagnosis: String(existingNote?.diagnosis || ""),
        treatment: String(existingNote?.treatment || ""),
        controlDate: latestAppt.next_control_at
          ? new Date(latestAppt.next_control_at).toISOString().slice(0, 10)
          : existingNote?.next_control_at
            ? new Date(existingNote.next_control_at).toISOString().slice(0, 10)
            : "",
        controlType: String(existingNote?.control_type || latestAppt.reason || ""),
      },
    }));
    setEditingPetId(petId);
  }

  function handleOpenNoteEdit(note: ClinicalNote) {
    if (!note.appointment_id) return;
    const formKey = note.appointment_id;
    if (editingNoteId === note.id) {
      setEditingNoteId(null);
      return;
    }
    setClinicalFormState((prev) => ({
      ...prev,
      [formKey]: {
        reason: note.reason || "",
        notes: note.observations || "",
        diagnosis: note.diagnosis || "",
        treatment: note.treatment || "",
        controlDate: note.next_control_at
          ? new Date(note.next_control_at).toISOString().slice(0, 10)
          : "",
        controlType: note.control_type || "",
      },
    }));
    setEditingNoteId(note.id);
  }

  async function handleUpdatePet(petId: string) {
    if (!editPetForm.name.trim()) return;
    try {
      setSavingPet(true);
      setPetError("");
      const res = await fetch(`${BACKEND_URL}/pets/${petId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug,
          name: editPetForm.name,
          species_base: editPetForm.species_base,
          species_custom:
            editPetForm.species_base === "otro" ? editPetForm.species_custom : "",
          breed: editPetForm.breed,
          sex: editPetForm.sex,
          weight_kg: editPetForm.weight_kg ? Number(editPetForm.weight_kg) : null,
          is_sterilized: editPetForm.is_sterilized,
          notes: editPetForm.notes,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "No se pudo actualizar");
      // Actualizar estado local: preferir la respuesta del servidor,
      // con fallback a los valores del formulario si el backend no devuelve el objeto.
      setPets((prev) =>
        prev.map((p) => {
          if (p.id !== petId) return p;
          const updated = data?.pet ?? {
            ...p,
            name: editPetForm.name,
            species_base: editPetForm.species_base,
            species_custom:
              editPetForm.species_base === "otro" ? editPetForm.species_custom : "",
            breed: editPetForm.breed,
            sex: editPetForm.sex,
            weight_kg: editPetForm.weight_kg ? Number(editPetForm.weight_kg) : null,
            is_sterilized: editPetForm.is_sterilized,
            notes: editPetForm.notes,
          };
          return updated;
        })
      );
      setEditingPetDataId(null);
    } catch (err: any) {
      setPetError(err?.message || "Error actualizando mascota");
    } finally {
      setSavingPet(false);
    }
  }

  async function loadPatientNotes() {
    try {
      const apptIds = appointments
        .filter((a) => !["canceled", "cancelled"].includes(String(a.status || "").toLowerCase()))
        .map((a) => a.id);
      if (apptIds.length === 0) {
        setClinicalNotes((prev) => ({ ...prev, [PATIENT_NOTES_KEY]: [] }));
        return;
      }
      const res = await fetch(
        `${BACKEND_URL}/clinical-notes/${slug}?customer_id=${customerId}&limit=50`,
        { cache: "no-store" }
      );
      if (!res.ok) return;
      const data = await res.json();
      setClinicalNotes((prev) => ({
        ...prev,
        [PATIENT_NOTES_KEY]: Array.isArray(data.notes) ? data.notes : [],
      }));
    } catch {
      // silencioso
    }
  }

  async function handleUpdateCustomer() {
    if (!customer || !editPatientForm.name.trim()) return;
    try {
      setSavingPet(true);
      const res = await fetch(`${BACKEND_URL}/customers/${customer.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug,
          name: editPatientForm.name,
          phone: editPatientForm.phone,
          email: editPatientForm.email,
          rut: editPatientForm.rut,
          birth_date: editPatientForm.birth_date || null,
          sex: editPatientForm.sex || null,
          occupation: editPatientForm.occupation || null,
          health_insurance: editPatientForm.health_insurance || null,
          emergency_contact_name: editPatientForm.emergency_contact_name || null,
          emergency_contact_phone: editPatientForm.emergency_contact_phone || null,
          known_allergies: editPatientForm.known_allergies || null,
          chronic_conditions: editPatientForm.chronic_conditions || null,
          family_history: editPatientForm.family_history || null,
          habits: editPatientForm.habits || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "No se pudo actualizar");
      setCustomer((prev) =>
        prev
          ? {
              ...prev,
              name: data?.customer?.name ?? editPatientForm.name,
              phone: (data?.customer?.phone ?? editPatientForm.phone) || null,
              email: (data?.customer?.email ?? editPatientForm.email) || null,
              rut: (data?.customer?.rut ?? editPatientForm.rut) || null,
              birth_date: (data?.customer?.birth_date ?? editPatientForm.birth_date) || null,
            }
          : prev
      );
      setEditingPatient(false);
    } catch (err: any) {
      setPetError(err?.message || "Error actualizando paciente");
    } finally {
      setSavingPet(false);
    }
  }

  async function handleCreateNote() {
    if (!customerId || !newNoteForm.date) return;
    try {
      setSavingNewNote(true);
      setNewNoteError("");

      if (newNoteApptId) {
        // Nota ligada a una cita existente: PATCH en vez de POST
        const patchBody = {
          slug,
          reason: newNoteForm.reason || null,
          notes: newNoteForm.observations || null,
          diagnosis: newNoteForm.diagnosis || null,
          treatment: newNoteForm.treatment || null,
          symptoms: newNoteForm.symptoms || null,
          medications: newNoteForm.medications || null,
          referrals: newNoteForm.referrals || null,
          follow_up_notes: newNoteForm.follow_up_notes || null,
          control_type: newNoteForm.control_type || null,
          next_control_at: newNoteForm.next_control_at || null,
          next_control_label: newNoteForm.next_control_label || null,
        };
        console.log("[save] llamando PATCH clinical con apptId:", newNoteApptId);
        console.log("[save] body:", patchBody);
        const res = await fetch(
          `${BACKEND_URL}/appointments/${newNoteApptId}/clinical`,
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(patchBody),
          }
        );
        const data = await res.json();
        console.log("[save] respuesta status:", res.status);
        console.log("[save] respuesta data:", data);
        if (!res.ok) throw new Error(data?.error || "No se pudo guardar la nota");

        try {
          await fetch(`${BACKEND_URL}/appointments/${newNoteApptId}/clinical-pending`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ pending: false, slug }),
          });
        } catch {}

        setNewNoteApptId(null);
        await loadPatientNotes();
      } else {
        const res = await fetch(`${BACKEND_URL}/clinical-notes/${slug}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            customer_id: customerId,
            branch_id: selectedBranchId || null,
            date: newNoteForm.date,
            control_type: newNoteForm.control_type || null,
            reason: newNoteForm.reason || null,
            symptoms: newNoteForm.symptoms || null,
            diagnosis: newNoteForm.diagnosis || null,
            treatment: newNoteForm.treatment || null,
            medications: newNoteForm.medications || null,
            referrals: newNoteForm.referrals || null,
            observations: newNoteForm.observations || null,
            follow_up_notes: newNoteForm.follow_up_notes || null,
            next_control_at: newNoteForm.next_control_at || null,
            next_control_label: newNoteForm.next_control_label || null,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error || "No se pudo crear la nota");

        setClinicalNotes((prev) => ({
          ...prev,
          [PATIENT_NOTES_KEY]: [data.note, ...(prev[PATIENT_NOTES_KEY] ?? [])],
        }));
      }

      setShowNewNoteForm(false);
      setNewNoteForm({
        date: todayISO(),
        control_type: "Control general",
        reason: "",
        symptoms: "",
        diagnosis: "",
        treatment: "",
        medications: "",
        referrals: "",
        observations: "",
        follow_up_notes: "",
        next_control_at: "",
        next_control_label: "",
      });
    } catch (err: any) {
      setNewNoteError(err?.message || "Error guardando la nota");
    } finally {
      setSavingNewNote(false);
    }
  }

  useEffect(() => {
    setSelectedBranchId(readStoredBranchId());
  }, [branchStorageKey]);

  useEffect(() => {
    function handleBranchChanged(event: Event) {
      const customEvent = event as CustomEvent<{ branchId?: string }>;
      setSelectedBranchId(customEvent.detail?.branchId || readStoredBranchId());
    }

    window.addEventListener("orbyx-branch-changed", handleBranchChanged);

    return () => {
      window.removeEventListener("orbyx-branch-changed", handleBranchChanged);
    };
  }, [branchStorageKey]);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);

        try {
          const businessRes = await fetch(`${BACKEND_URL}/public/business/${slug}`);
          const businessData: BusinessResponse = await businessRes.json();

          setBusinessCategory(
            String(businessData?.business?.business_category || "")
              .trim()
              .toLowerCase()
          );
          setTenant({
            name: String(businessData?.business?.name || slug),
            logo_url: businessData?.business?.logo_url || null,
          });
        } catch {
          setBusinessCategory("");
        }

        const resCustomers = await fetch(`${BACKEND_URL}/customers/${slug}`);
        const dataCustomers = await resCustomers.json();

        const found = dataCustomers.customers?.find(
          (c: Customer) => c.id === customerId
        );

        setCustomer(found || null);

        try {
          const resPets = await fetch(
            `${BACKEND_URL}/pets/${slug}?customer_id=${customerId}`
          );
          const dataPets = await resPets.json();
          setPets(dataPets.pets || []);
        } catch {
          setPets([]);
        }

        try {
          const appointmentParams = new URLSearchParams({
            customer_id: customerId,
          });

          if (selectedBranchId) {
            appointmentParams.set("branch_id", selectedBranchId);
          }

          const resAppointments = await fetch(
            `${BACKEND_URL}/appointments/customer-history/${slug}?${appointmentParams.toString()}`
          );
          const dataAppointments = await resAppointments.json();
          setAppointments(dataAppointments.appointments || []);
        } catch {
          setAppointments([]);
        }

        try {
          const resFollowups = await fetch(
            `${BACKEND_URL}/pet-followups/${slug}?customer_id=${customerId}`
          );
          const dataFollowups = await resFollowups.json();
          setFollowups(dataFollowups.followups || []);
        } catch {
          setFollowups([]);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    if (slug && customerId) {
      loadData();
    }
  }, [slug, customerId, selectedBranchId]);

  // Auto-open note form when coming from agenda pending panel
  useEffect(() => {
    console.log("[auto-open] effect fired — loading:", loading, "appointments:", appointments.length, "autoOpenApptId:", autoOpenApptId, "autoOpenNote:", autoOpenNote, "hasAutoOpened:", hasAutoOpenedRef.current);
    if (
      !autoOpenApptId ||
      autoOpenNote !== "true" ||
      loading ||
      appointments.length === 0 ||
      hasAutoOpenedRef.current
    ) return;
    hasAutoOpenedRef.current = true;

    if (customer && !customer.phone && !customer.email) {
      setIncompleteProfileBanner(true);
    }

    (async () => {
      console.log("[auto-open] appointments:", appointments.length);
      console.log("[auto-open] autoOpenApptId:", autoOpenApptId);

      let notes: ClinicalNote[] = [];
      try {
        const res = await fetch(
          `${BACKEND_URL}/clinical-notes/${slug}?customer_id=${customerId}&limit=50`
        );
        if (res.ok) {
          const data = await res.json();
          notes = Array.isArray(data.notes) ? data.notes : [];
          console.log("[auto-open] notes encontradas:", notes);
          setClinicalNotes((prev) => ({ ...prev, [PATIENT_NOTES_KEY]: notes }));
        }
      } catch {}

      const existingNote = notes.find((n) => n.appointment_id === autoOpenApptId);
      console.log("[auto-open] existingNote:", existingNote);
      if (existingNote) {
        console.log("[auto-open] seteando editingNoteId:", existingNote.id);
        setClinicalFormState((prev) => ({
          ...prev,
          [autoOpenApptId]: {
            reason: existingNote.reason || "",
            notes: existingNote.observations || "",
            diagnosis: existingNote.diagnosis || "",
            treatment: existingNote.treatment || "",
            controlDate: existingNote.next_control_at
              ? new Date(existingNote.next_control_at).toISOString().slice(0, 10)
              : "",
            controlType: existingNote.control_type || "",
          },
        }));
        setEditingNoteId(existingNote.id);
      } else {
        console.log("[auto-open] seteando newNoteApptId:", autoOpenApptId);
        setClinicalFormState((prev) => ({
          ...prev,
          [autoOpenApptId]: { reason: "", notes: "", diagnosis: "", treatment: "", controlDate: "", controlType: "" },
        }));
        setNewNoteApptId(autoOpenApptId);
      }

      setTimeout(() => {
        const el = document.getElementById("historial-atenciones");
        if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 400);
    })();
  }, [loading, appointments.length]); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleCreatePet(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!petForm.name.trim()) {
      setPetError("El nombre de la mascota es obligatorio");
      return;
    }

    if (petForm.species_base === "otro" && !petForm.species_custom.trim()) {
      setPetError("Debes especificar el tipo de mascota");
      return;
    }

    try {
      setSavingPet(true);
      setPetError("");
      setPetSuccess("");

      const res = await fetch(`${BACKEND_URL}/pets`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          slug,
          customer_id: customerId,
          name: petForm.name,
          species_base: petForm.species_base,
          species_custom:
            petForm.species_base === "otro" ? petForm.species_custom : "",
          breed: petForm.breed,
          sex: petForm.sex,
          weight_kg: petForm.weight_kg ? Number(petForm.weight_kg) : null,
          is_sterilized: petForm.is_sterilized,
          notes: petForm.notes,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "No se pudo crear la mascota");
      }

      if (data?.pet) {
        setPets((prev) => [data.pet, ...prev]);
      }

      setPetForm({
        name: "",
        species_base: "perro",
        species_custom: "",
        breed: "",
        sex: "",
        weight_kg: "",
        is_sterilized: false,
        notes: "",
      });

      setShowPetForm(false);
      setPetSuccess("Mascota creada correctamente.");

      setTimeout(() => {
        setPetSuccess("");
      }, 2500);
    } catch (err: any) {
      setPetError(err?.message || "Error creando mascota");
    } finally {
      setSavingPet(false);
    }
  }

const latestAppointments = useMemo(() => {
  return [...appointments].sort(
    (a, b) => new Date(b.start_at).getTime() - new Date(a.start_at).getTime()
  );
}, [appointments]);
const validAppointments = useMemo(() => {
  return latestAppointments.filter((appt) => !["canceled", "cancelled"].includes(String(appt.status || "").toLowerCase()));
}, [latestAppointments]);

const cancelledAppointments = useMemo(() => {
  return latestAppointments.filter((appt) => ["canceled", "cancelled"].includes(String(appt.status || "").toLowerCase()));
}, [latestAppointments]);

const lastValidAppointment = validAppointments[0] || null;


  const latestPets = useMemo(() => {
    return [...pets].slice(0, 4);
  }, [pets]);

  async function handleSaveClinical(
    appointmentId: string,
    reason: string,
    notes: string,
    diagnosis: string,
    treatment: string,
    control_type?: string,
    control_note?: string,
    next_control_at?: string | null
  ) {
    try {
      setSavingClinicalId(appointmentId);
      setClinicalMessage("");

      console.log("[save] handleSaveClinical llamado con apptId:", appointmentId);

      const res = await fetch(
        `${BACKEND_URL}/appointments/${appointmentId}/clinical`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            reason,
            notes,
            diagnosis,
            treatment,
            control_type,
            control_note,
            next_control_at,
          }),
        }
      );

      const data = await res.json();
      console.log("[save] respuesta status:", res.status);
      console.log("[save] respuesta data:", data);

      if (!res.ok) {
        throw new Error(data?.error || "No se pudo guardar.");
      }

      setAppointments((prev) =>
        prev.map((appt) =>
          appt.id === appointmentId
            ? {
                ...appt,
                reason: data?.appointment?.reason ?? null,
                notes: data?.appointment?.notes ?? null,
                next_control_at: data?.appointment?.next_control_at ?? null,
              }
            : appt
        )
      );

      const apptForPet = appointments.find((a) => a.id === appointmentId);
      if (apptForPet?.pet_id) {
        await loadClinicalNotes(apptForPet.pet_id);
      }

      setClinicalMessage("success: Ficha clínica guardada correctamente.");
      setEditingPetId(null);
      setEditingNoteId(null);

      try {
        await fetch(`${BACKEND_URL}/appointments/${appointmentId}/clinical-pending`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ pending: false, slug }),
        });
      } catch {}

      await loadPatientNotes();
      if (newNoteApptId === appointmentId) {
        setNewNoteApptId(null);
      }

      setTimeout(() => {
        setClinicalMessage("");
      }, 2500);
    } catch (err: any) {
      setClinicalMessage("error: " + (err?.message || "No se pudo guardar la ficha clínica."));
    } finally {
      setSavingClinicalId(null);
    }
  }

  function buildClinicalReportHTML(
    tenantName: string,
    tenantLogoUrl: string | null | undefined,
    cust: Customer,
    pet: Pet,
    notes: ClinicalNote[]
  ): string {
    function esc(s: string | null | undefined): string {
      if (!s) return "";
      return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
    }
    const now = new Date();
    const emissionDate = (() => {
      const t = now.toLocaleDateString("es-CL", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
      return t.charAt(0).toUpperCase() + t.slice(1);
    })();
    function fmtDate(value?: string | null): string {
      if (!value) return "—";
      const d = new Date(value);
      if (Number.isNaN(d.getTime())) return "—";
      return d.toLocaleDateString("es-CL", { day: "numeric", month: "short", year: "numeric" });
    }
    function speciesLabel(p: Pet): string {
      if (p.species_base === "otro") return esc(p.species_custom) || "Otro";
      return esc(p.species_base) || "—";
    }
    function accentColor(ct?: string | null): string {
      if (ct === "Vacuna") return "#B4B2A9";
      if (ct === "Desparasitación") return "#EF9F27";
      return "#1D9E75";
    }
    function badgeStyle(ct?: string | null): string {
      if (ct === "Vacuna") return "background:#f1f5f9;color:#64748b";
      if (ct === "Desparasitación") return "background:#FAEEDA;color:#854F0B";
      return "background:#E1F5EE;color:#0F6E56";
    }
    function pillStyle(ct?: string | null): string {
      if (ct === "Vacuna") return "background:#f1f5f9;color:#64748b";
      return "background:#E1F5EE;color:#0F6E56";
    }

    const logoHtml = tenantLogoUrl
      ? `<img src="${esc(tenantLogoUrl)}" alt="Logo" style="height:44px;object-fit:contain;border-radius:6px;" />`
      : "";

    const petTagsHtml = [
      `<span style="font-size:10px;font-weight:500;padding:2px 8px;border-radius:99px;background:#E1F5EE;color:#0F6E56;">${speciesLabel(pet)}</span>`,
      (pet.sex || pet.weight_kg)
        ? `<span style="font-size:10px;font-weight:500;padding:2px 8px;border-radius:99px;background:#f1f5f9;color:#64748b;">${[esc(pet.sex), pet.weight_kg ? `${pet.weight_kg} kg` : null].filter(Boolean).join(" · ")}</span>`
        : "",
      pet.is_sterilized
        ? `<span style="font-size:10px;font-weight:500;padding:2px 8px;border-radius:99px;background:#FAEEDA;color:#854F0B;">Esterilizado</span>`
        : "",
    ].join(" ");

    const notesHtml = notes.length === 0
      ? `<p style="font-size:13px;color:#94a3b8;text-align:center;padding:24px 0;margin:0;">Sin atenciones registradas.</p>`
      : notes.map((note, idx) => {
          const isLast = idx === notes.length - 1;
          const accent = accentColor(note.control_type);
          const badge = badgeStyle(note.control_type);
          const pill = pillStyle(note.control_type);
          const diagTreat = (note.diagnosis || note.treatment) ? `
            <div style="display:grid;grid-template-columns:${note.diagnosis && note.treatment ? "1fr 1fr" : "1fr"};gap:16px;margin-bottom:${note.observations || note.next_control_at ? "10px" : "0"};">
              ${note.diagnosis ? `<div><p style="font-size:9px;color:#94a3b8;text-transform:uppercase;letter-spacing:0.1em;margin-bottom:3px;">Diagnóstico</p><p style="font-size:12px;color:#334155;line-height:1.5;margin:0;">${esc(note.diagnosis)}</p></div>` : ""}
              ${note.treatment ? `<div><p style="font-size:9px;color:#94a3b8;text-transform:uppercase;letter-spacing:0.1em;margin-bottom:3px;">Tratamiento</p><p style="font-size:12px;color:#334155;line-height:1.5;margin:0;">${esc(note.treatment)}</p></div>` : ""}
            </div>` : "";
          const obs = note.observations ? `
            <div style="margin-bottom:${note.next_control_at ? "10px" : "0"};">
              <p style="font-size:9px;color:#94a3b8;text-transform:uppercase;letter-spacing:0.1em;margin-bottom:3px;">Observaciones</p>
              <p style="font-size:12px;color:#334155;line-height:1.5;margin:0;">${esc(note.observations)}</p>
            </div>` : "";
          const nextCtrl = note.next_control_at ? `
            <div style="display:inline-flex;align-items:center;gap:5px;font-size:10px;font-weight:500;padding:4px 12px;border-radius:99px;${pill}">
              <span>📅</span>
              <span>Próximo control: ${fmtDate(note.next_control_at)}${note.next_control_label ? ` · ${esc(note.next_control_label)}` : ""}</span>
            </div>` : "";
          return `<div style="border-bottom:${isLast ? "none" : "1px solid #cbd5e1"};padding-bottom:${isLast ? "0" : "20px"};margin-bottom:${isLast ? "0" : "20px"};">
            <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:12px;margin-bottom:10px;">
              <div style="display:flex;align-items:flex-start;gap:10px;">
                <div style="width:3px;height:40px;border-radius:99px;background:${accent};flex-shrink:0;"></div>
                <div>
                  <span style="font-size:10px;font-weight:500;padding:2px 8px;border-radius:99px;display:inline-block;margin-bottom:4px;${badge}">${esc(note.control_type) || "Atención"}</span>
                  ${note.reason ? `<p style="font-size:13px;font-weight:500;color:#0f172a;margin:0;">${esc(note.reason)}</p>` : ""}
                </div>
              </div>
              <div style="text-align:right;flex-shrink:0;">
                <p style="font-size:12px;font-weight:500;color:#334155;margin:0;">${fmtDate(note.date)}</p>
              </div>
            </div>
            <div style="padding-left:13px;">${diagTreat}${obs}${nextCtrl}</div>
          </div>`;
        }).join("");

    return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Ficha clínica — ${esc(pet.name)}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f1f5f9; }
    @media print {
      @page { margin: 0; size: A4 portrait; }
      html, body { margin: 0; padding: 0; background: white; }
    }
  </style>
</head>
<body>
  <div style="padding:32px 16px;background:#f1f5f9;">
    <div style="max-width:760px;margin:0 auto;background:#ffffff;border-radius:12px;box-shadow:0 4px 24px rgba(0,0,0,0.08);overflow:hidden;">
      <div style="background:#0F6E56;padding:22px 32px;display:flex;align-items:center;justify-content:space-between;">
        <div>
          <p style="font-size:9px;color:rgba(255,255,255,0.55);text-transform:uppercase;letter-spacing:0.18em;margin-bottom:4px;">Ficha clínica veterinaria</p>
          <p style="font-size:20px;font-weight:500;color:#ffffff;margin:0;">${esc(tenantName)}</p>
        </div>
        ${logoHtml}
      </div>
      <div style="background:#f8fafc;border-bottom:1px solid #cbd5e1;padding:9px 32px;">
        <span style="font-size:10px;color:#64748b;">Emitida el ${emissionDate}</span>
      </div>
      <div style="padding:24px 32px;">
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:32px;margin-bottom:24px;">
          <div>
            <p style="font-size:9px;color:#64748b;text-transform:uppercase;letter-spacing:0.16em;margin-bottom:6px;">Cliente</p>
            <div style="border-bottom:1px solid #cbd5e1;margin-bottom:10px;"></div>
            <p style="font-size:14px;font-weight:500;color:#0f172a;margin-bottom:6px;">${esc(cust.name) || "—"}</p>
            <p style="font-size:13px;color:#475569;margin:0;">${esc(cust.phone) || "Sin teléfono"} · ${esc(cust.email) || "Sin email"}</p>
          </div>
          <div>
            <p style="font-size:9px;color:#64748b;text-transform:uppercase;letter-spacing:0.16em;margin-bottom:6px;">Paciente</p>
            <div style="border-bottom:1px solid #cbd5e1;margin-bottom:10px;"></div>
            <p style="font-size:15px;font-weight:500;color:#0f172a;margin-bottom:8px;">${esc(pet.name)}</p>
            <div style="display:flex;flex-wrap:wrap;gap:4px;margin-bottom:10px;">${petTagsHtml}</div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:4px 12px;">
              <div>
                <p style="font-size:9px;color:#94a3b8;text-transform:uppercase;letter-spacing:0.1em;margin-bottom:2px;">Raza</p>
                <p style="font-size:12px;color:#334155;margin:0;">${esc(pet.breed) || "—"}</p>
              </div>
              <div>
                <p style="font-size:9px;color:#94a3b8;text-transform:uppercase;letter-spacing:0.1em;margin-bottom:2px;">Responsable</p>
                <p style="font-size:12px;color:#334155;margin:0;">${esc(cust.name) || "—"}</p>
              </div>
            </div>
          </div>
        </div>
        <div style="height:2px;background:#e2e8f0;margin-bottom:24px;"></div>
        <div>
          <p style="font-size:9px;color:#64748b;text-transform:uppercase;letter-spacing:0.16em;margin-bottom:6px;">Historial clínico</p>
          <div style="border-bottom:1px solid #cbd5e1;margin-bottom:20px;"></div>
          ${notesHtml}
        </div>
        <div style="border-top:2px solid #e2e8f0;margin-top:32px;padding-top:14px;display:flex;justify-content:space-between;">
          <span style="font-size:10px;color:#94a3b8;">${esc(tenantName)}</span>
          <span style="font-size:10px;color:#94a3b8;">${emissionDate}</span>
        </div>
      </div>
    </div>
  </div>
</body>
</html>`;
  }

  async function openPrintReport(pet: Pet) {
    if (!customer) return;
    setPrintingPetId(pet.id);
    try {
      const res = await fetch(`${BACKEND_URL}/clinical-notes/${slug}?pet_id=${pet.id}&limit=100`);
      const data = await res.json();
      const notes: ClinicalNote[] = Array.isArray(data?.notes) ? data.notes : [];
      notes.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      const html = buildClinicalReportHTML(
        tenant?.name || slug,
        tenant?.logo_url,
        customer,
        pet,
        notes
      );
      const newWindow = window.open("", "_blank");
      if (!newWindow) return;
      newWindow.document.write(html);
      newWindow.document.close();
      newWindow.focus();
      if (newWindow.document.readyState === "complete") {
        newWindow.print();
      } else {
        newWindow.addEventListener("load", () => newWindow.print());
      }
    } catch {
      // silencioso
    } finally {
      setPrintingPetId(null);
    }
  }

  return (
  <div className="space-y-6">
    {clinicalMessage ? (
      <div
        className="fixed right-6 top-6 z-50 rounded-xl px-4 py-3 text-sm font-medium shadow-lg"
        style={{
          background: clinicalMessage.startsWith("error:")
            ? "rgba(220,38,38,0.95)"
            : "rgba(22,163,74,0.95)",
          color: "white",
        }}
      >
        {clinicalMessage.replace(/^(error:|success:)\s*/, "")}
      </div>
    ) : null}

      {loading ? (
        <Panel title="Cargando ficha">
          <p style={{ color: "var(--text-muted)" }}>Cargando...</p>
        </Panel>
      ) : !customer ? (
        <Panel title="Cliente">
          <p style={{ color: "var(--text-muted)" }}>No encontrado</p>
        </Panel>
      ) : (

        <div className="grid gap-4 xl:grid-cols-[1.45fr_0.8fr]">
          <div className={`space-y-4 ${isVeterinaria ? "xl:col-span-2" : ""}`}>

<div
  className="rounded-3xl p-6 flex flex-col gap-4 md:flex-row md:items-start md:justify-between"
  style={{
    background:
      "linear-gradient(135deg, rgba(15,23,42,1), rgba(30,41,59,1))",
    color: "white",
  }}
>
  <div>
    <h1 className="text-3xl font-bold">
      {customer.name}
    </h1>

    <p className="mt-2 text-sm text-slate-300">
      📞 {customer.phone || "Sin teléfono"} · ✉️ {customer.email || "Sin email"}
    </p>

    <p className="mt-3 text-sm text-slate-400">
      {isVeterinaria ? (
  <>🐶 {pets.length} mascotas · 🩺 {validAppointments.length} visitas</>
) : (
  <>🗓️ {latestAppointments.length} registros</>
)}
    </p>

<p className="mt-2 text-xs text-slate-400">
  Última visita:{" "}
  {isVeterinaria
    ? formatDateLong(lastValidAppointment?.start_at)
    : formatDateLong(lastValidAppointment?.start_at)}
</p>
  </div>
</div>


            {isVeterinaria ? (
              <div
                className="overflow-x-auto rounded-2xl border p-1"
                style={{
                  borderColor: "var(--border-color)",
                  background: "var(--bg-card)",
                }}
              >
                <div className="grid min-w-max grid-cols-3 gap-1 sm:min-w-0">
                  {[
                    { id: "pets", label: "Mascotas" },
                    {
                      id: "summary",
                      label: "Resumen rápido",
                    },
                    {
                      id: "followups",
                      label: "Próximos controles",
                    },
                  ].map((tab) => {
                    const isActive = activeVetTab === tab.id;

                    return (
                      <button
                        key={tab.id}
                        type="button"
                        aria-current={isActive ? "page" : undefined}
                        onClick={() => setActiveVetTab(tab.id as VetCustomerTab)}
                        className="cursor-pointer rounded-xl border px-3 py-2.5 text-center text-xs font-semibold transition focus:outline-none focus:ring-2 focus:ring-blue-500 sm:text-sm"
                        style={{
                          borderColor: isActive
                            ? "rgba(37,99,235,0.38)"
                            : "transparent",
                          background: isActive
                            ? "rgba(37,99,235,0.10)"
                            : "transparent",
                          color: isActive
                            ? "var(--text-main)"
                            : "var(--text-muted)",
                        }}
                        onMouseEnter={(event) => {
                          if (!isActive) {
                            event.currentTarget.style.background =
                              "var(--bg-soft)";
                            event.currentTarget.style.borderColor =
                              "var(--border-color)";
                          }
                        }}
                        onMouseLeave={(event) => {
                          if (!isActive) {
                            event.currentTarget.style.background =
                              "transparent";
                            event.currentTarget.style.borderColor =
                              "transparent";
                          }
                        }}
                      >
                        {tab.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : null}

            {isVeterinaria && activeVetTab === "pets" ? (
              <Panel
                title="Mascotas"
                description="Mascotas registradas y ficha veterinaria del cliente."
              >
                {/* ── Botón toggle agregar mascota ── */}
                <div className="mb-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowPetForm((prev) => !prev);
                      setPetError("");
                    }}
                    className="rounded-xl border px-4 py-2 text-sm font-medium transition-all duration-200"
                    style={
                      showPetForm
                        ? {
                            borderColor: "var(--border-color)",
                            background: "var(--bg-soft)",
                            color: "var(--text-muted)",
                          }
                        : {
                            borderColor: "var(--border-color)",
                            background: "var(--bg-card)",
                            color: "var(--text-main)",
                          }
                    }
                  >
                    {showPetForm ? "✕ Cancelar" : "＋ Agregar mascota"}
                  </button>
                </div>

                {/* ── Formulario agregar mascota (colapsable) ── */}
                <div
                  className="overflow-hidden transition-all duration-200 ease-in-out"
                  style={{ maxHeight: showPetForm ? "600px" : "0" }}
                >
                  <div className="mt-3">
                    <form
                      onSubmit={handleCreatePet}
                      className="rounded-2xl border p-4"
                      style={{
                        borderColor: "var(--border-color)",
                        background:
                          "linear-gradient(180deg, rgba(37,99,235,0.05), var(--bg-soft))",
                      }}
                    >
                      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                        <div>
                          <label
                            className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.16em]"
                            style={{ color: "var(--text-muted)" }}
                          >
                            Nombre
                          </label>
                          <input
                            type="text"
                            value={petForm.name}
                            onChange={(e) =>
                              setPetForm((prev) => ({ ...prev, name: e.target.value }))
                            }
                            className="w-full rounded-xl border px-3 py-2 text-sm outline-none transition"
                            style={{
                              borderColor: "var(--border-color)",
                              background: "var(--bg-card)",
                              color: "var(--text-main)",
                            }}
                            placeholder="Ej: Luna"
                            required
                          />
                        </div>

                        <div>
                          <label
                            className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.16em]"
                            style={{ color: "var(--text-muted)" }}
                          >
                            Tipo
                          </label>
                          <select
                            value={petForm.species_base}
                            onChange={(e) =>
                              setPetForm((prev) => ({
                                ...prev,
                                species_base: e.target.value as "perro" | "gato" | "otro",
                              }))
                            }
                            className="w-full rounded-xl border px-3 py-2 text-sm outline-none transition"
                            style={{
                              borderColor: "var(--border-color)",
                              background: "var(--bg-card)",
                              color: "var(--text-main)",
                            }}
                          >
                            <option value="perro">Perro</option>
                            <option value="gato">Gato</option>
                            <option value="otro">Otro</option>
                          </select>
                        </div>

                        {petForm.species_base === "otro" ? (
                          <div>
                            <label
                              className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.16em]"
                              style={{ color: "var(--text-muted)" }}
                            >
                              Especificar tipo
                            </label>
                            <input
                              type="text"
                              value={petForm.species_custom}
                              onChange={(e) =>
                                setPetForm((prev) => ({ ...prev, species_custom: e.target.value }))
                              }
                              className="w-full rounded-xl border px-3 py-2 text-sm outline-none transition"
                              style={{
                                borderColor: "var(--border-color)",
                                background: "var(--bg-card)",
                                color: "var(--text-main)",
                              }}
                              placeholder="Ej: conejo"
                              required
                            />
                          </div>
                        ) : null}

                        <div>
                          <label
                            className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.16em]"
                            style={{ color: "var(--text-muted)" }}
                          >
                            Raza
                          </label>
                          <input
                            type="text"
                            value={petForm.breed}
                            onChange={(e) =>
                              setPetForm((prev) => ({ ...prev, breed: e.target.value }))
                            }
                            className="w-full rounded-xl border px-3 py-2 text-sm outline-none transition"
                            style={{
                              borderColor: "var(--border-color)",
                              background: "var(--bg-card)",
                              color: "var(--text-main)",
                            }}
                            placeholder="Ej: Labrador"
                          />
                        </div>

                        <div>
                          <label
                            className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.16em]"
                            style={{ color: "var(--text-muted)" }}
                          >
                            Sexo
                          </label>
                          <select
                            value={petForm.sex}
                            onChange={(e) =>
                              setPetForm((prev) => ({ ...prev, sex: e.target.value }))
                            }
                            className="w-full rounded-xl border px-3 py-2 text-sm outline-none transition"
                            style={{
                              borderColor: "var(--border-color)",
                              background: "var(--bg-card)",
                              color: "var(--text-main)",
                            }}
                          >
                            <option value="">Seleccionar</option>
                            <option value="macho">Macho</option>
                            <option value="hembra">Hembra</option>
                          </select>
                        </div>

                        <div>
                          <label
                            className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.16em]"
                            style={{ color: "var(--text-muted)" }}
                          >
                            Peso (kg)
                          </label>
                          <input
                            type="number"
                            step="0.1"
                            min="0"
                            value={petForm.weight_kg}
                            onChange={(e) =>
                              setPetForm((prev) => ({ ...prev, weight_kg: e.target.value }))
                            }
                            className="w-full rounded-xl border px-3 py-2 text-sm outline-none transition"
                            style={{
                              borderColor: "var(--border-color)",
                              background: "var(--bg-card)",
                              color: "var(--text-main)",
                            }}
                            placeholder="Ej: 12.5"
                          />
                        </div>
                      </div>

                      <div className="mt-4 grid gap-4 md:grid-cols-[220px_1fr]">
                        <label
                          className="flex items-center gap-3 rounded-xl border px-3 py-3 text-sm"
                          style={{
                            borderColor: "var(--border-color)",
                            background: "var(--bg-card)",
                            color: "var(--text-main)",
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={petForm.is_sterilized}
                            onChange={(e) =>
                              setPetForm((prev) => ({ ...prev, is_sterilized: e.target.checked }))
                            }
                          />
                          Esterilizado
                        </label>

                        <div>
                          <label
                            className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.16em]"
                            style={{ color: "var(--text-muted)" }}
                          >
                            Notas
                          </label>
                          <textarea
                            value={petForm.notes}
                            onChange={(e) =>
                              setPetForm((prev) => ({ ...prev, notes: e.target.value }))
                            }
                            className="min-h-[110px] w-full rounded-xl border px-3 py-2 text-sm outline-none transition"
                            style={{
                              borderColor: "var(--border-color)",
                              background: "var(--bg-card)",
                              color: "var(--text-main)",
                            }}
                            placeholder="Notas rápidas de la mascota"
                          />
                        </div>
                      </div>

                      {petError ? (
                        <div
                          className="mt-4 rounded-xl border px-3 py-2 text-sm"
                          style={{
                            borderColor: "rgba(244,63,94,0.28)",
                            background: "rgba(244,63,94,0.08)",
                            color: "#be123c",
                          }}
                        >
                          {petError}
                        </div>
                      ) : null}

                      {petSuccess ? (
                        <div
                          className="mt-4 rounded-xl border px-3 py-2 text-sm"
                          style={{
                            borderColor: "rgba(16,185,129,0.28)",
                            background: "rgba(16,185,129,0.08)",
                            color: "#047857",
                          }}
                        >
                          {petSuccess}
                        </div>
                      ) : null}

                      <div className="mt-4">
                        <button
                          type="submit"
                          disabled={savingPet}
                          className="rounded-xl px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
                          style={{
                            background:
                              "linear-gradient(135deg, rgb(37 99 235), rgb(14 165 233))",
                          }}
                        >
                          {savingPet ? "Guardando..." : "Agregar mascota"}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>

                {/* ── Lista de mascotas ── */}
                {pets.length === 0 ? (
                  <EmptyState
                    title="Sin mascotas todavía"
                    description="Agrega la primera mascota del cliente."
                  />
                ) : (
                  <div className="space-y-4">
                    {pets.map((pet) => {
                      const petNotes = clinicalNotes[pet.id] || [];

                      function noteBadgeStyle(ct?: string | null) {
                        if (ct === "Vacuna") return { background: "rgba(100,116,139,0.12)", color: "#64748b" };
                        if (ct === "Desparasitación") return { background: "rgba(239,159,39,0.12)", color: "#EF9F27" };
                        return { background: "rgba(29,158,117,0.12)", color: "#1D9E75" };
                      }

                      function noteAccentColor(ct?: string | null) {
                        if (ct === "Vacuna") return "#B4B2A9";
                        if (ct === "Desparasitación") return "#EF9F27";
                        return "#1D9E75";
                      }

                      return (
                        <div
                          key={pet.id}
                          className="rounded-2xl border p-3 sm:p-4"
                          style={{
                            borderColor: "var(--border-color)",
                            background: "var(--bg-card)",
                          }}
                        >
                          {/* Pet summary row */}
                          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                            <div className="h-16 w-16 rounded-full bg-slate-200 flex items-center justify-center text-lg font-semibold text-slate-600">
                              🐾
                            </div>

                            <div className="min-w-0 flex-1">
                              <p
                                className="text-lg font-semibold"
                                style={{ color: "var(--text-main)" }}
                              >
                                {pet.name}
                              </p>
                              <p
                                className="text-sm"
                                style={{ color: "var(--text-muted)" }}
                              >
                                {getPetSpeciesLabel(pet)}
                                {pet.breed ? ` · ${pet.breed}` : ""}
                                {pet.weight_kg ? ` · ${pet.weight_kg} kg` : ""}
                              </p>
                              <p
                                className="mt-1 text-xs"
                                style={{ color: "var(--text-muted)" }}
                              >
                                {pet.is_sterilized ? "Esterilizado" : "No esterilizado"}
                              </p>
                              {pet.notes ? (
                                <p
                                  className="mt-2 text-xs italic"
                                  style={{ color: "var(--text-muted)" }}
                                >
                                  {pet.notes}
                                </p>
                              ) : null}
                            </div>

                            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                              <button
                                type="button"
                                onClick={() => {
                                  const newId = viewingPetId === pet.id ? null : pet.id;
                                  if (newId && !clinicalNotes[newId]) {
                                    loadClinicalNotes(newId);
                                  }
                                  setViewingPetId(newId);
                                  setEditingPetDataId(null);
                                  setEditingNoteId(null);
                                }}
                                className="rounded-xl px-4 py-2 text-xs font-semibold text-white transition hover:opacity-90"
                                style={{
                                  background:
                                    "linear-gradient(135deg, rgb(37 99 235), rgb(14 165 233))",
                                }}
                              >
                                {viewingPetId === pet.id ? "Cerrar ficha" : "Ver ficha"}
                              </button>

                              <button
                                type="button"
                                onClick={() => openPrintReport(pet)}
                                disabled={printingPetId === pet.id}
                                className="rounded-xl border px-4 py-2 text-center text-xs font-medium transition hover:bg-slate-100 disabled:opacity-60"
                                style={{
                                  borderColor: "var(--border-color)",
                                  color: "var(--text-main)",
                                }}
                              >
                                {printingPetId === pet.id ? "Cargando..." : "PDF"}
                              </button>
                            </div>
                          </div>

                          {/* ── Ficha expandida ── */}
                          {viewingPetId === pet.id ? (
                            <div
                              className="mt-4 rounded-2xl border p-4 sm:p-5"
                              style={{ borderColor: "var(--border-color)", background: "var(--bg-soft)" }}
                            >
                              {/* Top header */}
                              <div className="flex items-start gap-3">
                                <div
                                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xl"
                                  style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)" }}
                                >
                                  {pet.species_base === "perro" ? "🐕" : pet.species_base === "gato" ? "🐈" : "🐾"}
                                </div>
                                <div className="min-w-0">
                                  <p className="text-[15px] font-medium" style={{ color: "var(--text-main)" }}>
                                    {pet.name}
                                  </p>
                                  <p className="mt-1 flex items-center gap-1 text-xs" style={{ color: "var(--text-muted)" }}>
                                    <span>👤</span>
                                    <span>{customer.name}</span>
                                    {customer.phone ? <span>· {customer.phone}</span> : null}
                                  </p>
                                </div>
                              </div>

                              {/* ── Sección A: Datos de la mascota ── */}
                              <div
                                className="mt-4 rounded-xl border p-3"
                                style={{ borderColor: "var(--border-color)", background: "var(--bg-card)" }}
                              >
                                {/* Section A header */}
                                <div className="mb-3 flex items-start justify-between gap-2">
                                  <div className="flex min-w-0 flex-wrap items-center gap-1.5">
                                    <span className="text-[14px] font-semibold" style={{ color: "var(--text-main)" }}>
                                      {pet.name}
                                    </span>
                                    <span
                                      className="inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium"
                                      style={{ background: "rgba(29,158,117,0.12)", color: "#1D9E75" }}
                                    >
                                      {getPetSpeciesLabel(pet)}{pet.breed ? ` · ${pet.breed}` : ""}
                                    </span>
                                    {(pet.sex || pet.weight_kg) ? (
                                      <span
                                        className="inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium"
                                        style={{ borderColor: "var(--border-color)", color: "var(--text-muted)" }}
                                      >
                                        {[pet.sex, pet.weight_kg ? `${pet.weight_kg} kg` : ""].filter(Boolean).join(" · ")}
                                      </span>
                                    ) : null}
                                    {pet.is_sterilized ? (
                                      <span
                                        className="inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium"
                                        style={{ background: "rgba(239,159,39,0.12)", color: "#EF9F27" }}
                                      >
                                        Esterilizado
                                      </span>
                                    ) : null}
                                  </div>
                                  {editingPetDataId !== pet.id ? (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setEditingPetDataId(pet.id);
                                        setEditPetForm({
                                          name: pet.name,
                                          species_base: (pet.species_base as "perro" | "gato" | "otro") || "perro",
                                          species_custom: pet.species_custom || "",
                                          breed: pet.breed || "",
                                          sex: pet.sex || "",
                                          weight_kg: pet.weight_kg ? String(pet.weight_kg) : "",
                                          is_sterilized: pet.is_sterilized || false,
                                          notes: pet.notes || "",
                                        });
                                      }}
                                      className="shrink-0 rounded-xl border px-3 py-1 text-sm font-medium transition"
                                      style={{ borderColor: "var(--border-color)", background: "var(--bg-soft)", color: "var(--text-main)" }}
                                    >
                                      Editar mascota
                                    </button>
                                  ) : null}
                                </div>

                                {/* Read mode */}
                                <div
                                  className="overflow-hidden transition-all duration-200 ease-in-out"
                                  style={{ maxHeight: editingPetDataId === pet.id ? "0" : "400px" }}
                                >
                                  <div className="grid grid-cols-1 gap-x-4 gap-y-3 sm:grid-cols-2">
                                    {[
                                      { label: "Especie",      value: getPetSpeciesLabel(pet) },
                                      { label: "Raza",         value: pet.breed || null },
                                      { label: "Sexo",         value: pet.sex || null },
                                      { label: "Peso",         value: pet.weight_kg ? `${pet.weight_kg} kg` : null },
                                      { label: "Esterilizado", value: pet.is_sterilized ? "Sí" : "No" },
                                    ].map((item) => (
                                      <div key={item.label}>
                                        <p className="text-[11px] uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>
                                          {item.label}
                                        </p>
                                        <p
                                          className="mt-0.5 text-[14px]"
                                          style={{ color: item.value ? "var(--text-main)" : "var(--text-muted)" }}
                                        >
                                          {item.value || "—"}
                                        </p>
                                      </div>
                                    ))}
                                    <div className="sm:col-span-2">
                                      <p className="text-[11px] uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>
                                        Notas
                                      </p>
                                      <p
                                        className="mt-0.5 text-[14px]"
                                        style={{ color: pet.notes ? "var(--text-main)" : "var(--text-muted)" }}
                                      >
                                        {pet.notes || "—"}
                                      </p>
                                    </div>
                                  </div>
                                </div>

                                {/* Edit mode */}
                                <div
                                  className="overflow-hidden transition-all duration-200 ease-in-out"
                                  style={{ maxHeight: editingPetDataId === pet.id ? "700px" : "0" }}
                                >
                                  <div className="space-y-3 pt-1">
                                    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                                      <div>
                                        <label className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.16em]" style={{ color: "var(--text-muted)" }}>
                                          Nombre
                                        </label>
                                        <input
                                          type="text"
                                          value={editPetForm.name}
                                          onChange={(e) => setEditPetForm((prev) => ({ ...prev, name: e.target.value }))}
                                          className="w-full rounded-xl border px-3 py-2 text-sm outline-none transition"
                                          style={{ borderColor: "var(--border-color)", background: "var(--bg-card)", color: "var(--text-main)" }}
                                        />
                                      </div>
                                      <div>
                                        <label className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.16em]" style={{ color: "var(--text-muted)" }}>
                                          Tipo
                                        </label>
                                        <select
                                          value={editPetForm.species_base}
                                          onChange={(e) => setEditPetForm((prev) => ({ ...prev, species_base: e.target.value as "perro" | "gato" | "otro" }))}
                                          className="w-full rounded-xl border px-3 py-2 text-sm outline-none transition"
                                          style={{ borderColor: "var(--border-color)", background: "var(--bg-card)", color: "var(--text-main)" }}
                                        >
                                          <option value="perro">Perro</option>
                                          <option value="gato">Gato</option>
                                          <option value="otro">Otro</option>
                                        </select>
                                      </div>
                                      {editPetForm.species_base === "otro" ? (
                                        <div>
                                          <label className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.16em]" style={{ color: "var(--text-muted)" }}>
                                            Especificar tipo
                                          </label>
                                          <input
                                            type="text"
                                            value={editPetForm.species_custom}
                                            onChange={(e) => setEditPetForm((prev) => ({ ...prev, species_custom: e.target.value }))}
                                            className="w-full rounded-xl border px-3 py-2 text-sm outline-none transition"
                                            style={{ borderColor: "var(--border-color)", background: "var(--bg-card)", color: "var(--text-main)" }}
                                          />
                                        </div>
                                      ) : null}
                                      <div>
                                        <label className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.16em]" style={{ color: "var(--text-muted)" }}>
                                          Raza
                                        </label>
                                        <input
                                          type="text"
                                          value={editPetForm.breed}
                                          onChange={(e) => setEditPetForm((prev) => ({ ...prev, breed: e.target.value }))}
                                          className="w-full rounded-xl border px-3 py-2 text-sm outline-none transition"
                                          style={{ borderColor: "var(--border-color)", background: "var(--bg-card)", color: "var(--text-main)" }}
                                        />
                                      </div>
                                      <div>
                                        <label className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.16em]" style={{ color: "var(--text-muted)" }}>
                                          Sexo
                                        </label>
                                        <select
                                          value={editPetForm.sex}
                                          onChange={(e) => setEditPetForm((prev) => ({ ...prev, sex: e.target.value }))}
                                          className="w-full rounded-xl border px-3 py-2 text-sm outline-none transition"
                                          style={{ borderColor: "var(--border-color)", background: "var(--bg-card)", color: "var(--text-main)" }}
                                        >
                                          <option value="">Seleccionar</option>
                                          <option value="macho">Macho</option>
                                          <option value="hembra">Hembra</option>
                                        </select>
                                      </div>
                                      <div>
                                        <label className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.16em]" style={{ color: "var(--text-muted)" }}>
                                          Peso (kg)
                                        </label>
                                        <input
                                          type="number"
                                          step="0.1"
                                          min="0"
                                          value={editPetForm.weight_kg}
                                          onChange={(e) => setEditPetForm((prev) => ({ ...prev, weight_kg: e.target.value }))}
                                          className="w-full rounded-xl border px-3 py-2 text-sm outline-none transition"
                                          style={{ borderColor: "var(--border-color)", background: "var(--bg-card)", color: "var(--text-main)" }}
                                        />
                                      </div>
                                    </div>
                                    <label
                                      className="flex items-center gap-3 rounded-xl border px-3 py-3 text-sm"
                                      style={{ borderColor: "var(--border-color)", background: "var(--bg-card)", color: "var(--text-main)" }}
                                    >
                                      <input
                                        type="checkbox"
                                        checked={editPetForm.is_sterilized}
                                        onChange={(e) => setEditPetForm((prev) => ({ ...prev, is_sterilized: e.target.checked }))}
                                      />
                                      Esterilizado
                                    </label>
                                    <div>
                                      <label className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.16em]" style={{ color: "var(--text-muted)" }}>
                                        Notas
                                      </label>
                                      <textarea
                                        value={editPetForm.notes}
                                        onChange={(e) => setEditPetForm((prev) => ({ ...prev, notes: e.target.value }))}
                                        className="min-h-[80px] w-full resize-none rounded-xl border px-3 py-2 text-sm outline-none transition"
                                        style={{ borderColor: "var(--border-color)", background: "var(--bg-card)", color: "var(--text-main)" }}
                                      />
                                    </div>
                                    <div className="flex justify-end gap-2 pt-1">
                                      <button
                                        type="button"
                                        onClick={() => setEditingPetDataId(null)}
                                        className="inline-flex h-9 items-center justify-center rounded-xl border px-4 text-sm font-medium transition hover:bg-slate-100 dark:hover:bg-slate-700"
                                        style={{ borderColor: "var(--border-color)", background: "var(--bg-card)", color: "var(--text-main)" }}
                                      >
                                        Cancelar
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => handleUpdatePet(pet.id)}
                                        disabled={savingPet}
                                        className="inline-flex h-9 items-center justify-center rounded-xl px-4 text-sm font-semibold text-white transition hover:opacity-85 disabled:opacity-60"
                                        style={{ background: "linear-gradient(135deg, rgb(37 99 235), rgb(99 102 241))" }}
                                      >
                                        {savingPet ? "Guardando..." : "Guardar cambios"}
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              </div>

                              {/* ── Sección B: Historial clínico ── */}
                              <div className="mt-5">
                                <div className="border-t pt-4" style={{ borderColor: "var(--border-color)" }}>
                                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em]" style={{ color: "var(--text-muted)" }}>
                                    Historial clínico
                                  </p>
                                </div>
                                <div className="mt-3 space-y-3">
                                  {!Array.isArray(petNotes) || petNotes.length === 0 ? (
                                    <div
                                      className="flex flex-col items-center gap-2 rounded-2xl border border-dashed px-4 py-6 text-center"
                                      style={{ borderColor: "var(--border-color)", background: "var(--bg-card)" }}
                                    >
                                      <span className="text-2xl">📋</span>
                                      <p className="text-sm font-medium" style={{ color: "var(--text-main)" }}>Sin atenciones registradas</p>
                                      <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                                        Cuando cierres una atención desde Agenda para esta mascota, aparecerá aquí.
                                      </p>
                                    </div>
                                  ) : (
                                    petNotes.map((note) => {
                                      const accent = noteAccentColor(note.control_type);
                                      const badge = noteBadgeStyle(note.control_type);
                                      const isEditingThisNote = editingNoteId === note.id;
                                      const isViewingThisNote = viewingNoteId === note.id;
                                      const apptForNote = note.appointment_id
                                        ? appointments.find((a) => a.id === note.appointment_id)
                                        : null;
                                      const formKey = note.appointment_id || note.id;

                                      return (
                                        <div key={note.id}>
                                          {/* Note card */}
                                          <div
                                            className="overflow-hidden rounded-xl border transition-all duration-200"
                                            style={{
                                              borderColor: isEditingThisNote
                                                ? "rgba(37,99,235,0.45)"
                                                : "var(--border-color)",
                                              background: "var(--bg-card)",
                                              borderLeftWidth: "3px",
                                              borderLeftColor: accent,
                                              boxShadow: isEditingThisNote
                                                ? "0 0 0 2px rgba(37,99,235,0.10)"
                                                : "none",
                                            }}
                                          >
                                            {/* Header */}
                                            <div className="flex items-center justify-between gap-2 px-3 pb-2 pt-3">
                                              <div className="flex min-w-0 items-center gap-2">
                                                <span
                                                  className="inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-[11px] font-medium"
                                                  style={badge}
                                                >
                                                  {note.control_type || "Atención"}
                                                </span>
                                                <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                                                  {formatDate(note.date)}
                                                </p>
                                              </div>
                                              <div className="flex shrink-0 gap-1.5">
                                                <button
                                                  type="button"
                                                  onClick={() => setViewingNoteId(isViewingThisNote ? null : note.id)}
                                                  className="rounded-lg border px-2.5 py-1 text-xs font-medium transition"
                                                  style={{ borderColor: "var(--border-color)", background: isViewingThisNote ? "var(--bg-soft)" : "transparent", color: "var(--text-muted)" }}
                                                >
                                                  {isViewingThisNote ? "✕ Cerrar" : "Ver detalle"}
                                                </button>
                                                {note.appointment_id ? (
                                                  <button
                                                    type="button"
                                                    onClick={() => {
                                                      setViewingNoteId(null);
                                                      handleOpenNoteEdit(note);
                                                    }}
                                                    className="rounded-lg border px-2.5 py-1 text-xs font-medium transition"
                                                    style={{ borderColor: "var(--border-color)", background: "transparent", color: "var(--text-muted)" }}
                                                  >
                                                    {isEditingThisNote ? "Cerrar" : "Editar"}
                                                  </button>
                                                ) : null}
                                              </div>
                                            </div>

                                            {/* Body */}
                                            <div className="space-y-2 px-3 pb-3">
                                              {(note.reason || note.diagnosis || note.treatment || note.observations) ? (
                                                <div
                                                  className={`grid gap-2 ${note.diagnosis && note.treatment ? "grid-cols-2" : "grid-cols-1"}`}
                                                >
                                                  {note.reason ? (
                                                    <div className={note.diagnosis && note.treatment ? "col-span-2" : ""}>
                                                      <p className="text-[11px] uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>Motivo</p>
                                                      <p className="mt-0.5 text-xs" style={{ color: "var(--text-main)" }}>{note.reason}</p>
                                                    </div>
                                                  ) : null}
                                                  {note.diagnosis ? (
                                                    <div>
                                                      <p className="text-[11px] uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>Diagnóstico</p>
                                                      <p className="mt-0.5 text-xs" style={{ color: "var(--text-main)" }}>{note.diagnosis}</p>
                                                    </div>
                                                  ) : null}
                                                  {note.treatment ? (
                                                    <div>
                                                      <p className="text-[11px] uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>Tratamiento</p>
                                                      <p className="mt-0.5 text-xs" style={{ color: "var(--text-main)" }}>{note.treatment}</p>
                                                    </div>
                                                  ) : null}
                                                  {note.observations ? (
                                                    <div className="col-span-2">
                                                      <p className="text-[11px] uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>Observaciones</p>
                                                      <p className="mt-0.5 text-xs" style={{ color: "var(--text-main)" }}>{note.observations}</p>
                                                    </div>
                                                  ) : null}
                                                </div>
                                              ) : null}
                                              {note.next_control_at ? (
                                                <p className="flex items-center gap-1 text-xs font-medium" style={{ color: "#1D9E75" }}>
                                                  <span>📅</span>
                                                  <span>
                                                    {formatDateLong(note.next_control_at)}
                                                    {note.next_control_label ? ` · ${note.next_control_label}` : ""}
                                                  </span>
                                                </p>
                                              ) : null}
                                            </div>
                                          </div>

                                          {/* Panel de detalle en modo lectura */}
                                          <div
                                            className="overflow-hidden transition-all duration-200 ease-in-out"
                                            style={{ maxHeight: isViewingThisNote && !isEditingThisNote ? "600px" : "0" }}
                                          >
                                            {isViewingThisNote && !isEditingThisNote ? (
                                              <div className="mt-2 rounded-xl border p-4" style={{ borderColor: "rgba(29,158,117,0.25)", background: "var(--bg-soft)" }}>
                                                <div className="grid grid-cols-1 gap-x-4 gap-y-3 sm:grid-cols-2">
                                                  {[
                                                    { label: "Tipo de control", value: note.control_type },
                                                    { label: "Fecha",           value: formatDate(note.date) },
                                                    { label: "Motivo",          value: note.reason, span: true },
                                                    { label: "Síntomas",        value: note.symptoms, span: true },
                                                    { label: "Diagnóstico",     value: note.diagnosis },
                                                    { label: "Tratamiento",     value: note.treatment },
                                                    { label: "Medicamentos",    value: note.medications },
                                                    { label: "Derivaciones",    value: note.referrals },
                                                    { label: "Observaciones",   value: note.observations, span: true },
                                                    { label: "Notas de seguimiento", value: note.follow_up_notes, span: true },
                                                  ].filter((f) => f.value).map((f) => (
                                                    <div key={f.label} className={f.span ? "sm:col-span-2" : ""}>
                                                      <p className="text-[11px] uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>{f.label}</p>
                                                      <p className="mt-0.5 text-sm" style={{ color: "var(--text-main)" }}>{f.value}</p>
                                                    </div>
                                                  ))}
                                                  {note.next_control_at ? (
                                                    <div className="sm:col-span-2">
                                                      <p className="text-[11px] uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>Próximo control</p>
                                                      <p className="mt-0.5 text-sm font-medium" style={{ color: "#1D9E75" }}>
                                                        {formatDateLong(note.next_control_at)}{note.next_control_label ? ` · ${note.next_control_label}` : ""}
                                                      </p>
                                                    </div>
                                                  ) : null}
                                                </div>
                                              </div>
                                            ) : null}
                                          </div>

                                          {/* Sección C: formulario inline de edición clínica */}
                                          <div
                                            className="overflow-hidden transition-all duration-200 ease-in-out"
                                            style={{ maxHeight: isEditingThisNote ? "900px" : "0" }}
                                          >
                                            {isEditingThisNote && note.appointment_id ? (
                                              <div
                                                className="mt-2 rounded-xl border p-4"
                                                style={{
                                                  borderColor: "rgba(37,99,235,0.25)",
                                                  background: "var(--bg-soft)",
                                                }}
                                              >
                                                {/* Form header */}
                                                <div className="mb-3 border-b pb-3" style={{ borderColor: "var(--border-color)" }}>
                                                  <p className="text-[14px] font-medium" style={{ color: "var(--text-main)" }}>
                                                    Editando nota clínica
                                                  </p>
                                                  <p className="mt-0.5 text-[12px]" style={{ color: "var(--text-muted)" }}>
                                                    {apptForNote?.service_name_snapshot || "Atención"} · {formatDate(note.date)}
                                                  </p>
                                                  <p className="mt-0.5 text-[12px]" style={{ color: "var(--text-muted)" }}>
                                                    Estás editando la nota de{" "}
                                                    <span className="font-medium">{pet.name}</span>
                                                  </p>
                                                </div>

                                                {/* Fields */}
                                                <div className="space-y-3">
                                                  {[
                                                    { key: "reason",    label: "Motivo",        rows: 1, placeholder: "Control realizado / motivo" },
                                                    { key: "diagnosis", label: "Diagnóstico",   rows: 2, placeholder: "Diagnóstico" },
                                                    { key: "treatment", label: "Tratamiento",   rows: 2, placeholder: "Tratamiento indicado" },
                                                    { key: "notes",     label: "Observaciones", rows: 3, placeholder: "Observaciones / notas clínicas..." },
                                                  ].map(({ key, label, rows, placeholder }) => (
                                                    <div key={key}>
                                                      <label
                                                        className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.14em]"
                                                        style={{ color: "var(--text-muted)" }}
                                                      >
                                                        {label}
                                                      </label>
                                                      {rows === 1 ? (
                                                        <input
                                                          type="text"
                                                          placeholder={placeholder}
                                                          value={(clinicalFormState[formKey] as any)?.[key] ?? ""}
                                                          onChange={(e) =>
                                                            setClinicalFormState((prev) => ({
                                                              ...prev,
                                                              [formKey]: { ...prev[formKey], [key]: e.target.value },
                                                            }))
                                                          }
                                                          className="w-full rounded-xl border px-3 py-2 text-sm outline-none transition"
                                                          style={{ borderColor: "var(--border-color)", background: "var(--bg-card)", color: "var(--text-main)" }}
                                                        />
                                                      ) : (
                                                        <textarea
                                                          rows={rows}
                                                          placeholder={placeholder}
                                                          value={(clinicalFormState[formKey] as any)?.[key] ?? ""}
                                                          onChange={(e) =>
                                                            setClinicalFormState((prev) => ({
                                                              ...prev,
                                                              [formKey]: { ...prev[formKey], [key]: e.target.value },
                                                            }))
                                                          }
                                                          className="w-full resize-none rounded-xl border px-3 py-2 text-sm outline-none transition"
                                                          style={{ borderColor: "var(--border-color)", background: "var(--bg-card)", color: "var(--text-main)" }}
                                                        />
                                                      )}
                                                    </div>
                                                  ))}

                                                  {/* Próximo control */}
                                                  <div>
                                                    <label
                                                      className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.14em]"
                                                      style={{ color: "var(--text-muted)" }}
                                                    >
                                                      Próximo control
                                                    </label>
                                                    <div className="mb-2 flex flex-wrap gap-1.5">
                                                      {[7, 15, 30, 60].map((days) => {
                                                        const base = note.date ? new Date(note.date) : new Date();
                                                        const target = new Date(base.getTime());
                                                        target.setDate(target.getDate() + days);
                                                        const targetStr = target.toISOString().slice(0, 10);
                                                        const isSelected =
                                                          (clinicalFormState[formKey]?.controlDate ?? "") === targetStr;
                                                        return (
                                                          <button
                                                            key={days}
                                                            type="button"
                                                            onClick={() =>
                                                              setClinicalFormState((prev) => ({
                                                                ...prev,
                                                                [formKey]: { ...prev[formKey], controlDate: targetStr },
                                                              }))
                                                            }
                                                            className="rounded-full border px-2.5 py-1 text-xs font-medium transition"
                                                            style={{
                                                              borderColor: isSelected ? "rgba(29,158,117,0.60)" : "var(--border-color)",
                                                              background: isSelected ? "rgba(29,158,117,0.12)" : "transparent",
                                                              color: isSelected ? "#1D9E75" : "var(--text-muted)",
                                                            }}
                                                          >
                                                            +{days}d
                                                          </button>
                                                        );
                                                      })}
                                                    </div>
                                                    <input
                                                      type="date"
                                                      value={clinicalFormState[formKey]?.controlDate ?? ""}
                                                      onChange={(e) =>
                                                        setClinicalFormState((prev) => ({
                                                          ...prev,
                                                          [formKey]: { ...prev[formKey], controlDate: e.target.value },
                                                        }))
                                                      }
                                                      className="w-full rounded-xl border px-3 py-2 text-sm outline-none"
                                                      style={{
                                                        borderColor: "var(--border-color)",
                                                        background: "var(--bg-card)",
                                                        color: "var(--text-main)",
                                                        colorScheme: "dark",
                                                      }}
                                                    />
                                                  </div>
                                                </div>

                                                {/* Footer */}
                                                <div className="mt-4 flex justify-end gap-2">
                                                  <button
                                                    type="button"
                                                    onClick={() => setEditingNoteId(null)}
                                                    className="inline-flex h-9 items-center justify-center rounded-xl border px-4 text-sm font-medium transition hover:bg-slate-100 dark:hover:bg-slate-700"
                                                    style={{ borderColor: "var(--border-color)", background: "var(--bg-card)", color: "var(--text-main)" }}
                                                  >
                                                    Cancelar
                                                  </button>
                                                  <button
                                                    type="button"
                                                    onClick={() => {
                                                      const form = clinicalFormState[formKey];
                                                      handleSaveClinical(
                                                        note.appointment_id!,
                                                        form?.reason ?? "",
                                                        form?.notes ?? "",
                                                        form?.diagnosis ?? "",
                                                        form?.treatment ?? "",
                                                        form?.reason ?? "",
                                                        form?.notes ?? "",
                                                        form?.controlDate ?? null
                                                      );
                                                    }}
                                                    disabled={savingClinicalId === note.appointment_id}
                                                    className="inline-flex h-9 items-center justify-center rounded-xl px-4 text-sm font-semibold text-white transition hover:opacity-85 disabled:opacity-60"
                                                    style={{
                                                      background:
                                                        savingClinicalId === note.appointment_id
                                                          ? "rgba(37,99,235,0.5)"
                                                          : "linear-gradient(135deg, rgb(37 99 235), rgb(99 102 241))",
                                                    }}
                                                  >
                                                    {savingClinicalId === note.appointment_id ? "Guardando..." : "Guardar"}
                                                  </button>
                                                </div>
                                              </div>
                                            ) : null}
                                          </div>
                                        </div>
                                      );
                                    })
                                  )}
                                </div>
                              </div>
                            </div>
                          ) : null}
                        </div>
                      );
                    })}
                  </div>
                )}
              </Panel>
            ) : null}

            {/* Paso 4: ficha clínica de personas */}
            {isClinica && incompleteProfileBanner ? (
              <div className="mb-1 flex items-start justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 p-3">
                <p className="text-sm" style={{ color: "#92400e" }}>
                  Este paciente no tiene ficha completa. Completa sus datos antes de registrar la atención.
                </p>
                <button
                  type="button"
                  onClick={() => { setIncompleteProfileBanner(false); setEditingPatient(true); }}
                  className="shrink-0 rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-amber-700"
                >
                  Completar consulta
                </button>
              </div>
            ) : null}
            {isClinica ? (
              <Panel
                title="Ficha del paciente"
                description="Datos del paciente e historial de atenciones clínicas."
              >
                {/* ── Sección A: Datos del paciente ── */}
                <div
                  className="rounded-xl border p-3"
                  style={{ borderColor: "var(--border-color)", background: "var(--bg-card)" }}
                >
                  {/* Header sección A */}
                  <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                    <p className="text-[14px] font-semibold" style={{ color: "var(--text-main)" }}>
                      {customer?.name}
                    </p>
                    {!editingPatient ? (
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => setShowPatientProfile((v) => !v)}
                          className="shrink-0 rounded-xl border px-3 py-1 text-sm font-medium transition"
                          style={{ borderColor: "var(--border-color)", background: "var(--bg-soft)", color: "var(--text-main)" }}
                        >
                          {showPatientProfile ? "✕ Cerrar ficha" : "Ver ficha del paciente"}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setShowPatientProfile(false);
                            setEditingPatient(true);
                            setEditPatientForm({
                              name: customer?.name || "",
                              phone: customer?.phone || "",
                              email: customer?.email || "",
                              rut: customer?.rut || "",
                              birth_date: customer?.birth_date
                                ? new Date(customer.birth_date).toISOString().slice(0, 10)
                                : "",
                              sex: customer?.sex || "",
                              occupation: customer?.occupation || "",
                              health_insurance: customer?.health_insurance || "",
                              emergency_contact_name: customer?.emergency_contact_name || "",
                              emergency_contact_phone: customer?.emergency_contact_phone || "",
                              known_allergies: customer?.known_allergies || "",
                              chronic_conditions: customer?.chronic_conditions || "",
                              family_history: customer?.family_history || "",
                              habits: customer?.habits || "",
                            });
                          }}
                          className="shrink-0 rounded-xl border px-3 py-1 text-sm font-medium transition"
                          style={{ borderColor: "var(--border-color)", background: "var(--bg-soft)", color: "var(--text-main)" }}
                        >
                          Editar ficha del paciente
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowResumenModal(true)}
                          className="shrink-0 rounded-xl border px-3 py-1 text-sm font-medium transition"
                          style={{ borderColor: "var(--border-color)", background: "var(--bg-soft)", color: "var(--text-main)" }}
                        >
                          Ver resumen
                        </button>
                      </div>
                    ) : null}
                  </div>

                  {/* Read mode */}
                  <div
                    className="overflow-hidden transition-all duration-200 ease-in-out"
                    style={{ maxHeight: showPatientProfile && !editingPatient ? "900px" : "0" }}
                  >
                    <div className="space-y-4">
                      {/* Datos de contacto */}
                      <div className="grid grid-cols-1 gap-x-4 gap-y-3 sm:grid-cols-2">
                        {[
                          { label: "Nombre",              value: customer?.name || null },
                          { label: "Teléfono",            value: customer?.phone || null },
                          { label: "Email",               value: customer?.email || null },
                          { label: "RUT",                 value: customer?.rut || null },
                          { label: "Fecha de nacimiento", value: customer?.birth_date ? formatDate(customer.birth_date) : null },
                          { label: "Sexo",                value: customer?.sex || null },
                          { label: "Ocupación",           value: customer?.occupation || null },
                          { label: "Previsión",           value: customer?.health_insurance || null },
                        ].map((item) => (
                          <div key={item.label}>
                            <p className="text-[11px] uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>
                              {item.label}
                            </p>
                            <p className="mt-0.5 text-[14px]" style={{ color: item.value ? "var(--text-main)" : "var(--text-muted)" }}>
                              {item.value || "—"}
                            </p>
                          </div>
                        ))}
                      </div>

                      {/* Contacto de emergencia */}
                      {(customer?.emergency_contact_name || customer?.emergency_contact_phone) ? (
                        <div>
                          <p className="text-[11px] uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>
                            Contacto de emergencia
                          </p>
                          <p className="mt-0.5 text-[14px]" style={{ color: "var(--text-main)" }}>
                            {[customer?.emergency_contact_name, customer?.emergency_contact_phone].filter(Boolean).join(" · ")}
                          </p>
                        </div>
                      ) : null}

                      {/* Alergias y patologías */}
                      {(customer?.known_allergies || customer?.chronic_conditions) ? (
                        <div className="grid grid-cols-1 gap-x-4 gap-y-3 sm:grid-cols-2">
                          {customer?.known_allergies ? (
                            <div>
                              <p className="text-[11px] uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>Alergias</p>
                              <p className="mt-0.5 text-[14px]" style={{ color: "var(--text-main)" }}>{customer.known_allergies}</p>
                            </div>
                          ) : null}
                          {customer?.chronic_conditions ? (
                            <div>
                              <p className="text-[11px] uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>Patologías crónicas</p>
                              <p className="mt-0.5 text-[14px]" style={{ color: "var(--text-main)" }}>{customer.chronic_conditions}</p>
                            </div>
                          ) : null}
                        </div>
                      ) : null}
                      {customer?.family_history ? (
                        <div>
                          <p className="text-[11px] uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>Antecedentes familiares</p>
                          <p className="mt-0.5 text-[14px]" style={{ color: "var(--text-main)" }}>{customer.family_history}</p>
                        </div>
                      ) : null}
                      {customer?.habits ? (
                        <div>
                          <p className="text-[11px] uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>Hábitos</p>
                          <p className="mt-0.5 text-[14px]" style={{ color: "var(--text-main)" }}>{customer.habits}</p>
                        </div>
                      ) : null}
                    </div>
                  </div>

                  {/* Edit mode */}
                  <div
                    className="overflow-hidden transition-all duration-200 ease-in-out"
                    style={{ maxHeight: editingPatient ? "2400px" : "0" }}
                  >
                    <div className="space-y-5 pt-1">

                      {/* ── Datos de contacto ── */}
                      <div>
                        <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.16em]" style={{ color: "var(--text-muted)" }}>
                          Datos de contacto
                        </p>
                        <div className="grid gap-3 sm:grid-cols-2">
                          {[
                            { key: "name",  label: "Nombre *",  type: "text",  placeholder: "Nombre completo" },
                            { key: "phone", label: "Teléfono",  type: "text",  placeholder: "+56 9 1234 5678" },
                            { key: "email", label: "Email",     type: "email", placeholder: "correo@ejemplo.com" },
                            { key: "rut",   label: "RUT",       type: "text",  placeholder: "12.345.678-9" },
                          ].map(({ key, label, type, placeholder }) => (
                            <div key={key}>
                              <label className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.16em]" style={{ color: "var(--text-muted)" }}>
                                {label}
                              </label>
                              <input
                                type={type}
                                placeholder={placeholder}
                                value={(editPatientForm as any)[key] ?? ""}
                                onChange={(e) => setEditPatientForm((prev) => ({ ...prev, [key]: e.target.value }))}
                                className="w-full rounded-xl border px-3 py-2 text-sm outline-none transition"
                                style={{ borderColor: "var(--border-color)", background: "var(--bg-card)", color: "var(--text-main)", colorScheme: "dark" }}
                              />
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* ── Datos personales ── */}
                      <div>
                        <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.16em]" style={{ color: "var(--text-muted)" }}>
                          Datos personales
                        </p>
                        <div className="grid gap-3 sm:grid-cols-2">
                          <div>
                            <label className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.16em]" style={{ color: "var(--text-muted)" }}>
                              Fecha de nacimiento
                            </label>
                            <input
                              type="date"
                              value={editPatientForm.birth_date}
                              onChange={(e) => setEditPatientForm((prev) => ({ ...prev, birth_date: e.target.value }))}
                              className="w-full rounded-xl border px-3 py-2 text-sm outline-none transition"
                              style={{ borderColor: "var(--border-color)", background: "var(--bg-card)", color: "var(--text-main)", colorScheme: "dark" }}
                            />
                          </div>
                          <div>
                            <label className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.16em]" style={{ color: "var(--text-muted)" }}>
                              Sexo
                            </label>
                            <select
                              value={editPatientForm.sex}
                              onChange={(e) => setEditPatientForm((prev) => ({ ...prev, sex: e.target.value }))}
                              className="w-full rounded-xl border px-3 py-2 text-sm outline-none transition"
                              style={{ borderColor: "var(--border-color)", background: "var(--bg-card)", color: "var(--text-main)" }}
                            >
                              <option value="">Sin especificar</option>
                              <option value="masculino">Masculino</option>
                              <option value="femenino">Femenino</option>
                              <option value="otro">Otro</option>
                              <option value="prefiero no decir">Prefiero no decir</option>
                            </select>
                          </div>
                          <div>
                            <label className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.16em]" style={{ color: "var(--text-muted)" }}>
                              Ocupación
                            </label>
                            <input
                              type="text"
                              placeholder="ej. profesora"
                              value={editPatientForm.occupation}
                              onChange={(e) => setEditPatientForm((prev) => ({ ...prev, occupation: e.target.value }))}
                              className="w-full rounded-xl border px-3 py-2 text-sm outline-none transition"
                              style={{ borderColor: "var(--border-color)", background: "var(--bg-card)", color: "var(--text-main)" }}
                            />
                          </div>
                          <div>
                            <label className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.16em]" style={{ color: "var(--text-muted)" }}>
                              Previsión de salud
                            </label>
                            <select
                              value={editPatientForm.health_insurance}
                              onChange={(e) => setEditPatientForm((prev) => ({ ...prev, health_insurance: e.target.value }))}
                              className="w-full rounded-xl border px-3 py-2 text-sm outline-none transition"
                              style={{ borderColor: "var(--border-color)", background: "var(--bg-card)", color: "var(--text-main)" }}
                            >
                              <option value="">Sin especificar</option>
                              <option value="Fonasa">Fonasa</option>
                              <option value="Isapre">Isapre</option>
                              <option value="Capredena">Capredena</option>
                              <option value="Dipreca">Dipreca</option>
                              <option value="Particular / Ninguna">Particular / Ninguna</option>
                            </select>
                          </div>
                        </div>
                      </div>

                      {/* ── Contacto de emergencia ── */}
                      <div>
                        <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.16em]" style={{ color: "var(--text-muted)" }}>
                          Contacto de emergencia
                        </p>
                        <div className="grid gap-3 sm:grid-cols-2">
                          <div>
                            <label className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.16em]" style={{ color: "var(--text-muted)" }}>
                              Nombre
                            </label>
                            <input
                              type="text"
                              placeholder="ej. María González"
                              value={editPatientForm.emergency_contact_name}
                              onChange={(e) => setEditPatientForm((prev) => ({ ...prev, emergency_contact_name: e.target.value }))}
                              className="w-full rounded-xl border px-3 py-2 text-sm outline-none transition"
                              style={{ borderColor: "var(--border-color)", background: "var(--bg-card)", color: "var(--text-main)" }}
                            />
                          </div>
                          <div>
                            <label className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.16em]" style={{ color: "var(--text-muted)" }}>
                              Teléfono
                            </label>
                            <input
                              type="tel"
                              placeholder="+56 9 8765 4321"
                              value={editPatientForm.emergency_contact_phone}
                              onChange={(e) => setEditPatientForm((prev) => ({ ...prev, emergency_contact_phone: e.target.value }))}
                              className="w-full rounded-xl border px-3 py-2 text-sm outline-none transition"
                              style={{ borderColor: "var(--border-color)", background: "var(--bg-card)", color: "var(--text-main)" }}
                            />
                          </div>
                        </div>
                      </div>

                      {/* ── Antecedentes médicos ── */}
                      <div>
                        <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.16em]" style={{ color: "var(--text-muted)" }}>
                          Antecedentes médicos
                        </p>
                        <div className="grid gap-3 sm:grid-cols-2">
                          {[
                            { key: "known_allergies",   label: "Alergias conocidas",           placeholder: "ej. penicilina, látex…" },
                            { key: "chronic_conditions", label: "Patologías crónicas",          placeholder: "ej. hipertensión, diabetes…" },
                            { key: "family_history",    label: "Antecedentes familiares",       placeholder: "ej. diabetes materna, cáncer…" },
                            { key: "habits",            label: "Hábitos",                       placeholder: "ej. fumador, sedentario…" },
                          ].map(({ key, label, placeholder }) => (
                            <div key={key}>
                              <label className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.16em]" style={{ color: "var(--text-muted)" }}>
                                {label}
                              </label>
                              <textarea
                                rows={2}
                                placeholder={placeholder}
                                value={(editPatientForm as any)[key] ?? ""}
                                onChange={(e) => setEditPatientForm((prev) => ({ ...prev, [key]: e.target.value }))}
                                className="w-full resize-none rounded-xl border px-3 py-2 text-sm outline-none transition"
                                style={{ borderColor: "var(--border-color)", background: "var(--bg-card)", color: "var(--text-main)" }}
                              />
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* ── Acciones ── */}
                      <div className="flex justify-end gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => setEditingPatient(false)}
                          className="inline-flex h-9 items-center justify-center rounded-xl border px-4 text-sm font-medium transition hover:bg-slate-100 dark:hover:bg-slate-700"
                          style={{ borderColor: "var(--border-color)", background: "var(--bg-card)", color: "var(--text-main)" }}
                        >
                          Cancelar
                        </button>
                        <button
                          type="button"
                          onClick={handleUpdateCustomer}
                          disabled={savingPet}
                          className="inline-flex h-9 items-center justify-center rounded-xl px-4 text-sm font-semibold text-white transition hover:opacity-85 disabled:opacity-60"
                          style={{ background: "linear-gradient(135deg, rgb(37 99 235), rgb(99 102 241))" }}
                        >
                          {savingPet ? "Guardando..." : "Guardar cambios"}
                        </button>
                      </div>

                    </div>
                  </div>
                </div>

                {/* ── Sección B: Historial de atenciones ── */}
                <div id="historial-atenciones" className="mt-5">
                  <div className="border-t pt-4" style={{ borderColor: "var(--border-color)" }}>
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.14em]" style={{ color: "var(--text-muted)" }}>
                        Historial de atenciones
                      </p>
                      <div className="flex items-center gap-2">
                        {!clinicalNotes[PATIENT_NOTES_KEY] ? (
                          <button
                            type="button"
                            onClick={loadPatientNotes}
                            className="rounded-lg border px-2.5 py-1 text-xs font-medium transition"
                            style={{ borderColor: "var(--border-color)", color: "var(--text-muted)" }}
                          >
                            Cargar
                          </button>
                        ) : null}
                        <button
                          type="button"
                          onClick={() => setShowNewNoteForm((v) => !v)}
                          className="rounded-lg border px-2.5 py-1 text-xs font-medium transition"
                          style={{ borderColor: "var(--border-color)", background: showNewNoteForm ? "var(--bg-soft)" : "transparent", color: "var(--text-muted)" }}
                        >
                          {showNewNoteForm ? "Cerrar" : "＋ Nueva atención"}
                        </button>
                      </div>
                    </div>

                    {/* Formulario inline nueva atención */}
                    <div
                      className="overflow-hidden transition-all duration-200 ease-in-out"
                      style={{ maxHeight: showNewNoteForm ? "900px" : "0" }}
                    >
                      {showNewNoteForm ? (
                        <div className="mt-3 rounded-xl border p-4" style={{ borderColor: "rgba(37,99,235,0.25)", background: "var(--bg-soft)" }}>
                          <p className="mb-3 text-[14px] font-medium" style={{ color: "var(--text-main)" }}>Nueva atención clínica</p>

                          <div className="space-y-3">
                            {/* Fecha + Tipo */}
                            <div className="grid gap-3 sm:grid-cols-2">
                              <div>
                                <label className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.14em]" style={{ color: "var(--text-muted)" }}>Fecha de atención</label>
                                <input type="date" value={newNoteForm.date} onChange={(e) => setNewNoteForm((p) => ({ ...p, date: e.target.value }))} className="w-full rounded-xl border px-3 py-2 text-sm outline-none transition" style={{ borderColor: "var(--border-color)", background: "var(--bg-card)", color: "var(--text-main)", colorScheme: "dark" }} />
                              </div>
                              <div>
                                <label className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.14em]" style={{ color: "var(--text-muted)" }}>Tipo de control</label>
                                <select value={newNoteForm.control_type} onChange={(e) => setNewNoteForm((p) => ({ ...p, control_type: e.target.value }))} className="w-full rounded-xl border px-3 py-2 text-sm outline-none transition" style={{ borderColor: "var(--border-color)", background: "var(--bg-card)", color: "var(--text-main)" }}>
                                  {CONTROL_TYPES.map((opt) => (
                                    <option key={opt} value={opt}>{opt}</option>
                                  ))}
                                </select>
                              </div>
                            </div>

                            {/* Motivo + Síntomas */}
                            <div className="grid gap-3 sm:grid-cols-2">
                              <div>
                                <label className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.14em]" style={{ color: "var(--text-muted)" }}>Motivo</label>
                                <textarea rows={2} placeholder="Motivo de la consulta" value={newNoteForm.reason} onChange={(e) => setNewNoteForm((p) => ({ ...p, reason: e.target.value }))} className="w-full resize-none rounded-xl border px-3 py-2 text-sm outline-none transition" style={{ borderColor: "var(--border-color)", background: "var(--bg-card)", color: "var(--text-main)" }} />
                              </div>
                              <div>
                                <label className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.14em]" style={{ color: "var(--text-muted)" }}>Síntomas</label>
                                <textarea rows={2} placeholder="Síntomas referidos" value={newNoteForm.symptoms} onChange={(e) => setNewNoteForm((p) => ({ ...p, symptoms: e.target.value }))} className="w-full resize-none rounded-xl border px-3 py-2 text-sm outline-none transition" style={{ borderColor: "var(--border-color)", background: "var(--bg-card)", color: "var(--text-main)" }} />
                              </div>
                            </div>

                            {/* Diagnóstico col-span-2 */}
                            <div>
                              <label className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.14em]" style={{ color: "var(--text-muted)" }}>Diagnóstico</label>
                              <textarea rows={2} placeholder="Diagnóstico" value={newNoteForm.diagnosis} onChange={(e) => setNewNoteForm((p) => ({ ...p, diagnosis: e.target.value }))} className="w-full resize-none rounded-xl border px-3 py-2 text-sm outline-none transition" style={{ borderColor: "var(--border-color)", background: "var(--bg-card)", color: "var(--text-main)" }} />
                            </div>

                            {/* Tratamiento + Medicamentos */}
                            <div className="grid gap-3 sm:grid-cols-2">
                              <div>
                                <label className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.14em]" style={{ color: "var(--text-muted)" }}>Tratamiento</label>
                                <textarea rows={2} placeholder="Tratamiento indicado" value={newNoteForm.treatment} onChange={(e) => setNewNoteForm((p) => ({ ...p, treatment: e.target.value }))} className="w-full resize-none rounded-xl border px-3 py-2 text-sm outline-none transition" style={{ borderColor: "var(--border-color)", background: "var(--bg-card)", color: "var(--text-main)" }} />
                              </div>
                              <div>
                                <label className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.14em]" style={{ color: "var(--text-muted)" }}>Medicamentos</label>
                                <textarea rows={2} placeholder="Fármacos indicados, dosis…" value={newNoteForm.medications} onChange={(e) => setNewNoteForm((p) => ({ ...p, medications: e.target.value }))} className="w-full resize-none rounded-xl border px-3 py-2 text-sm outline-none transition" style={{ borderColor: "var(--border-color)", background: "var(--bg-card)", color: "var(--text-main)" }} />
                              </div>
                            </div>

                            {/* Derivaciones + Notas de seguimiento */}
                            <div className="grid gap-3 sm:grid-cols-2">
                              <div>
                                <label className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.14em]" style={{ color: "var(--text-muted)" }}>Derivaciones</label>
                                <textarea rows={2} placeholder="Interconsultas, derivaciones…" value={newNoteForm.referrals} onChange={(e) => setNewNoteForm((p) => ({ ...p, referrals: e.target.value }))} className="w-full resize-none rounded-xl border px-3 py-2 text-sm outline-none transition" style={{ borderColor: "var(--border-color)", background: "var(--bg-card)", color: "var(--text-main)" }} />
                              </div>
                              <div>
                                <label className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.14em]" style={{ color: "var(--text-muted)" }}>Notas de seguimiento</label>
                                <textarea rows={2} placeholder="Indicaciones para el próximo control…" value={newNoteForm.follow_up_notes} onChange={(e) => setNewNoteForm((p) => ({ ...p, follow_up_notes: e.target.value }))} className="w-full resize-none rounded-xl border px-3 py-2 text-sm outline-none transition" style={{ borderColor: "var(--border-color)", background: "var(--bg-card)", color: "var(--text-main)" }} />
                              </div>
                            </div>

                            {/* Observaciones col-span-2 */}
                            <div>
                              <label className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.14em]" style={{ color: "var(--text-muted)" }}>Observaciones</label>
                              <textarea rows={2} placeholder="Observaciones adicionales" value={newNoteForm.observations} onChange={(e) => setNewNoteForm((p) => ({ ...p, observations: e.target.value }))} className="w-full resize-none rounded-xl border px-3 py-2 text-sm outline-none transition" style={{ borderColor: "var(--border-color)", background: "var(--bg-card)", color: "var(--text-main)" }} />
                            </div>

                            {/* Próximo control */}
                            <div>
                              <label className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.14em]" style={{ color: "var(--text-muted)" }}>Próximo control</label>
                              <div className="mb-2 flex flex-wrap gap-1.5">
                                {[7, 15, 30, 60].map((days) => {
                                  const base = newNoteForm.date ? new Date(newNoteForm.date) : new Date();
                                  const target = new Date(base.getTime());
                                  target.setDate(target.getDate() + days);
                                  const targetStr = target.toISOString().slice(0, 10);
                                  const isSelected = newNoteForm.next_control_at === targetStr;
                                  return (
                                    <button key={days} type="button" onClick={() => setNewNoteForm((p) => ({ ...p, next_control_at: targetStr }))} className="rounded-full border px-2.5 py-1 text-xs font-medium transition" style={{ borderColor: isSelected ? "rgba(29,158,117,0.60)" : "var(--border-color)", background: isSelected ? "rgba(29,158,117,0.12)" : "transparent", color: isSelected ? "#1D9E75" : "var(--text-muted)" }}>+{days}d</button>
                                  );
                                })}
                              </div>
                              <input type="date" value={newNoteForm.next_control_at} onChange={(e) => setNewNoteForm((p) => ({ ...p, next_control_at: e.target.value }))} className="w-full rounded-xl border px-3 py-2 text-sm outline-none" style={{ borderColor: "var(--border-color)", background: "var(--bg-card)", color: "var(--text-main)", colorScheme: "dark" }} />
                            </div>
                          </div>

                          {newNoteError ? (
                            <p className="mt-2 text-xs font-medium text-red-600">{newNoteError}</p>
                          ) : null}

                          <div className="mt-4 flex justify-end gap-2">
                            <button type="button" onClick={() => { setShowNewNoteForm(false); setNewNoteError(""); }} className="inline-flex h-9 items-center justify-center rounded-xl border px-4 text-sm font-medium transition hover:bg-slate-100 dark:hover:bg-slate-700" style={{ borderColor: "var(--border-color)", background: "var(--bg-card)", color: "var(--text-main)" }}>Cancelar</button>
                            <button type="button" onClick={handleCreateNote} disabled={savingNewNote} className="inline-flex h-9 items-center justify-center rounded-xl px-4 text-sm font-semibold text-white transition hover:opacity-85 disabled:opacity-60" style={{ background: savingNewNote ? "rgba(37,99,235,0.5)" : "linear-gradient(135deg, rgb(37 99 235), rgb(99 102 241))" }}>{savingNewNote ? "Guardando..." : "Guardar atención"}</button>
                          </div>
                        </div>
                      ) : null}
                    </div>
                  </div>

                  <div className="mt-3 space-y-3">
                    {!clinicalNotes[PATIENT_NOTES_KEY] ? (
                      /* Notes not loaded yet — show simple appointment list */
                      validAppointments.length === 0 ? (
                        <div
                          className="flex flex-col items-center gap-2 rounded-2xl border border-dashed px-4 py-6 text-center"
                          style={{ borderColor: "var(--border-color)", background: "var(--bg-card)" }}
                        >
                          <span className="text-2xl">📋</span>
                          <p className="text-sm font-medium" style={{ color: "var(--text-main)" }}>Sin atenciones registradas</p>
                          <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                            Presiona "Cargar" para ver si hay fichas clínicas disponibles.
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {validAppointments.map((appt) => (
                            <div
                              key={appt.id}
                              className="flex items-center justify-between gap-2 rounded-xl border p-3"
                              style={{ borderColor: "var(--border-color)", background: "var(--bg-card)" }}
                            >
                              <div>
                                <p className="text-sm font-semibold" style={{ color: "var(--text-main)" }}>
                                  {appt.service_name_snapshot || "Atención"}
                                </p>
                                <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                                  {formatDateLong(appt.start_at)}
                                </p>
                              </div>
                              <span
                                className="shrink-0 inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium"
                                style={{ background: "rgba(100,116,139,0.10)", color: "#64748b" }}
                              >
                                Sin consulta
                              </span>
                            </div>
                          ))}
                          <p className="text-center text-xs pt-1" style={{ color: "var(--text-muted)" }}>
                            Presiona "Cargar" para ver fichas clínicas.
                          </p>
                        </div>
                      )
                    ) : (() => {
                      /* Notes loaded — build merged view */
                      const notesByApptId = (clinicalNotes[PATIENT_NOTES_KEY] || []).reduce<Record<string, typeof clinicalNotes[string][0]>>(
                        (acc, n) => { if (n.appointment_id) acc[n.appointment_id] = n; return acc; },
                        {}
                      );
                      const notesWithoutAppt = (clinicalNotes[PATIENT_NOTES_KEY] || []).filter((n) => !n.appointment_id);

                      /* appointments with note, appointments without note, notes without appointment */
                      const apptItems = validAppointments.map((appt) => ({
                        type: "appt" as const,
                        appt,
                        note: notesByApptId[appt.id] ?? null,
                      }));
                      const orphanNoteItems = notesWithoutAppt.map((note) => ({
                        type: "orphan" as const,
                        note,
                      }));

                      const allItems = [...apptItems, ...orphanNoteItems];

                      if (allItems.length === 0) {
                        return (
                          <div
                            className="flex flex-col items-center gap-2 rounded-2xl border border-dashed px-4 py-6 text-center"
                            style={{ borderColor: "var(--border-color)", background: "var(--bg-card)" }}
                          >
                            <span className="text-2xl">📋</span>
                            <p className="text-sm font-medium" style={{ color: "var(--text-main)" }}>Sin atenciones registradas</p>
                            <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                              Cuando cierres una atención desde Agenda, aparecerá aquí.
                            </p>
                          </div>
                        );
                      }

                      return (
                        <>
                          {apptItems.map(({ appt, note }) => {
                            if (note) {
                              /* ── Atención CON nota clínica ── */
                              const accentP =
                                note.control_type === "Vacuna"          ? "#B4B2A9" :
                                note.control_type === "Desparasitación" ? "#EF9F27" : "#1D9E75";
                              const badgeP =
                                note.control_type === "Vacuna"          ? { background: "rgba(100,116,139,0.12)", color: "#64748b" } :
                                note.control_type === "Desparasitación" ? { background: "rgba(239,159,39,0.12)",  color: "#EF9F27" } :
                                                                          { background: "rgba(29,158,117,0.12)",  color: "#1D9E75" };
                              const isEditingThisNote = editingNoteId === note.id;
                              const isViewingThisNote = viewingNoteId === note.id;
                              const formKey = note.appointment_id || note.id;

                              return (
                                <div key={appt.id}>
                                  <div
                                    className="overflow-hidden rounded-xl border transition-all duration-200"
                                    style={{
                                      borderColor: isEditingThisNote ? "rgba(37,99,235,0.45)" : "var(--border-color)",
                                      background: "var(--bg-card)",
                                      borderLeftWidth: "3px",
                                      borderLeftColor: accentP,
                                      boxShadow: isEditingThisNote ? "0 0 0 2px rgba(37,99,235,0.10)" : "none",
                                    }}
                                  >
                                    <div className="flex items-center justify-between gap-2 px-3 pb-2 pt-3">
                                      <div className="flex min-w-0 items-center gap-2">
                                        <span className="inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-[11px] font-medium" style={badgeP}>
                                          {note.control_type || "Atención"}
                                        </span>
                                        <p className="text-xs" style={{ color: "var(--text-muted)" }}>{formatDate(note.date)}</p>
                                        {appt.service_name_snapshot ? (
                                          <p className="truncate text-xs" style={{ color: "var(--text-muted)" }}>· {appt.service_name_snapshot}</p>
                                        ) : null}
                                      </div>
                                      <div className="flex shrink-0 gap-1.5">
                                        <button
                                          type="button"
                                          onClick={() => setViewingNoteId(isViewingThisNote ? null : note.id)}
                                          className="rounded-lg border px-2.5 py-1 text-xs font-medium transition"
                                          style={{ borderColor: "var(--border-color)", background: isViewingThisNote ? "var(--bg-soft)" : "transparent", color: "var(--text-muted)" }}
                                        >
                                          {isViewingThisNote ? "✕ Cerrar" : "Ver detalle"}
                                        </button>
                                        {note.appointment_id ? (
                                          <button
                                            type="button"
                                            onClick={() => {
                                              setViewingNoteId(null);
                                              if (isEditingThisNote) { setEditingNoteId(null); return; }
                                              setClinicalFormState((prev) => ({
                                                ...prev,
                                                [formKey]: {
                                                  reason:      note.reason       || "",
                                                  notes:       note.observations || "",
                                                  diagnosis:   note.diagnosis    || "",
                                                  treatment:   note.treatment    || "",
                                                  controlDate: note.next_control_at ? new Date(note.next_control_at).toISOString().slice(0, 10) : "",
                                                  controlType: note.control_type || "",
                                                },
                                              }));
                                              setEditingNoteId(note.id);
                                            }}
                                            className="rounded-lg border px-2.5 py-1 text-xs font-medium transition"
                                            style={{ borderColor: "var(--border-color)", background: "transparent", color: "var(--text-muted)" }}
                                          >
                                            {isEditingThisNote ? "Cerrar" : "Editar"}
                                          </button>
                                        ) : null}
                                      </div>
                                    </div>
                                    <div className="space-y-2 px-3 pb-3">
                                      {(note.reason || note.diagnosis || note.treatment || note.observations) ? (
                                        <div className={`grid gap-2 ${note.diagnosis && note.treatment ? "grid-cols-2" : "grid-cols-1"}`}>
                                          {note.reason ? <div className={note.diagnosis && note.treatment ? "col-span-2" : ""}><p className="text-[11px] uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>Motivo</p><p className="mt-0.5 text-xs" style={{ color: "var(--text-main)" }}>{note.reason}</p></div> : null}
                                          {(note as any).symptoms ? <div className="col-span-2"><p className="text-[11px] uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>Síntomas</p><p className="mt-0.5 text-xs" style={{ color: "var(--text-main)" }}>{(note as any).symptoms}</p></div> : null}
                                          {note.diagnosis ? <div><p className="text-[11px] uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>Diagnóstico</p><p className="mt-0.5 text-xs" style={{ color: "var(--text-main)" }}>{note.diagnosis}</p></div> : null}
                                          {note.treatment ? <div><p className="text-[11px] uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>Tratamiento</p><p className="mt-0.5 text-xs" style={{ color: "var(--text-main)" }}>{note.treatment}</p></div> : null}
                                          {(note as any).medications ? <div><p className="text-[11px] uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>Medicamentos</p><p className="mt-0.5 text-xs" style={{ color: "var(--text-main)" }}>{(note as any).medications}</p></div> : null}
                                          {(note as any).referrals ? <div><p className="text-[11px] uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>Derivaciones</p><p className="mt-0.5 text-xs" style={{ color: "var(--text-main)" }}>{(note as any).referrals}</p></div> : null}
                                          {(note as any).follow_up_notes ? <div className="col-span-2"><p className="text-[11px] uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>Notas de seguimiento</p><p className="mt-0.5 text-xs" style={{ color: "var(--text-main)" }}>{(note as any).follow_up_notes}</p></div> : null}
                                          {note.observations ? <div className="col-span-2"><p className="text-[11px] uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>Observaciones</p><p className="mt-0.5 text-xs" style={{ color: "var(--text-main)" }}>{note.observations}</p></div> : null}
                                        </div>
                                      ) : null}
                                      {note.next_control_at ? (
                                        <p className="flex items-center gap-1 text-xs font-medium" style={{ color: "#1D9E75" }}>
                                          <span>📅</span><span>{formatDateLong(note.next_control_at)}{note.next_control_label ? ` · ${note.next_control_label}` : ""}</span>
                                        </p>
                                      ) : null}
                                    </div>
                                  </div>
                                  {/* Panel detalle lectura */}
                                  <div className="overflow-hidden transition-all duration-200 ease-in-out" style={{ maxHeight: isViewingThisNote && !isEditingThisNote ? "600px" : "0" }}>
                                    {isViewingThisNote && !isEditingThisNote ? (
                                      <div className="mt-2 rounded-xl border p-4" style={{ borderColor: "rgba(29,158,117,0.25)", background: "var(--bg-soft)" }}>
                                        <div className="grid grid-cols-1 gap-x-4 gap-y-3 sm:grid-cols-2">
                                          {[
                                            { label: "Tipo de control", value: note.control_type },
                                            { label: "Fecha",           value: formatDate(note.date) },
                                            { label: "Motivo",          value: note.reason,          span: true },
                                            { label: "Síntomas",        value: note.symptoms,        span: true },
                                            { label: "Diagnóstico",     value: note.diagnosis },
                                            { label: "Tratamiento",     value: note.treatment },
                                            { label: "Medicamentos",    value: note.medications },
                                            { label: "Derivaciones",    value: note.referrals },
                                            { label: "Observaciones",   value: note.observations,    span: true },
                                            { label: "Notas de seguimiento", value: note.follow_up_notes, span: true },
                                          ].filter((f) => f.value).map((f) => (
                                            <div key={f.label} className={f.span ? "sm:col-span-2" : ""}>
                                              <p className="text-[11px] uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>{f.label}</p>
                                              <p className="mt-0.5 text-sm" style={{ color: "var(--text-main)" }}>{f.value}</p>
                                            </div>
                                          ))}
                                          {note.next_control_at ? (
                                            <div className="sm:col-span-2">
                                              <p className="text-[11px] uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>Próximo control</p>
                                              <p className="mt-0.5 text-sm font-medium" style={{ color: "#1D9E75" }}>
                                                {formatDateLong(note.next_control_at)}{note.next_control_label ? ` · ${note.next_control_label}` : ""}
                                              </p>
                                            </div>
                                          ) : null}
                                        </div>
                                      </div>
                                    ) : null}
                                  </div>

                                  {/* Inline edit form */}
                                  <div className="overflow-hidden transition-all duration-200 ease-in-out" style={{ maxHeight: isEditingThisNote ? "900px" : "0" }}>
                                    {isEditingThisNote && note.appointment_id ? (
                                      <div className="mt-2 rounded-xl border p-4" style={{ borderColor: "rgba(37,99,235,0.25)", background: "var(--bg-soft)" }}>
                                        <div className="mb-3 border-b pb-3" style={{ borderColor: "var(--border-color)" }}>
                                          <p className="text-[14px] font-medium" style={{ color: "var(--text-main)" }}>Editando nota clínica</p>
                                          <p className="mt-0.5 text-[12px]" style={{ color: "var(--text-muted)" }}>{appt.service_name_snapshot || "Atención"} · {formatDate(note.date)}</p>
                                        </div>
                                        <div className="space-y-3">
                                          {[
                                            { key: "reason", label: "Motivo", rows: 1, placeholder: "Motivo de la consulta" },
                                            { key: "diagnosis", label: "Diagnóstico", rows: 2, placeholder: "Diagnóstico" },
                                            { key: "treatment", label: "Tratamiento", rows: 2, placeholder: "Tratamiento indicado" },
                                            { key: "notes", label: "Observaciones", rows: 3, placeholder: "Observaciones / notas clínicas..." },
                                          ].map(({ key, label, rows, placeholder }) => (
                                            <div key={key}>
                                              <label className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.14em]" style={{ color: "var(--text-muted)" }}>{label}</label>
                                              {rows === 1 ? (
                                                <input type="text" placeholder={placeholder} value={(clinicalFormState[formKey] as any)?.[key] ?? ""} onChange={(e) => setClinicalFormState((prev) => ({ ...prev, [formKey]: { ...prev[formKey], [key]: e.target.value } }))} className="w-full rounded-xl border px-3 py-2 text-sm outline-none transition" style={{ borderColor: "var(--border-color)", background: "var(--bg-card)", color: "var(--text-main)" }} />
                                              ) : (
                                                <textarea rows={rows} placeholder={placeholder} value={(clinicalFormState[formKey] as any)?.[key] ?? ""} onChange={(e) => setClinicalFormState((prev) => ({ ...prev, [formKey]: { ...prev[formKey], [key]: e.target.value } }))} className="w-full resize-none rounded-xl border px-3 py-2 text-sm outline-none transition" style={{ borderColor: "var(--border-color)", background: "var(--bg-card)", color: "var(--text-main)" }} />
                                              )}
                                            </div>
                                          ))}
                                          <div>
                                            <label className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.14em]" style={{ color: "var(--text-muted)" }}>Próximo control</label>
                                            <div className="mb-2 flex flex-wrap gap-1.5">
                                              {[7, 15, 30, 60].map((days) => {
                                                const base = note.date ? new Date(note.date) : new Date();
                                                const target = new Date(base.getTime());
                                                target.setDate(target.getDate() + days);
                                                const targetStr = target.toISOString().slice(0, 10);
                                                const isSelected = (clinicalFormState[formKey]?.controlDate ?? "") === targetStr;
                                                return (
                                                  <button key={days} type="button" onClick={() => setClinicalFormState((prev) => ({ ...prev, [formKey]: { ...prev[formKey], controlDate: targetStr } }))} className="rounded-full border px-2.5 py-1 text-xs font-medium transition" style={{ borderColor: isSelected ? "rgba(29,158,117,0.60)" : "var(--border-color)", background: isSelected ? "rgba(29,158,117,0.12)" : "transparent", color: isSelected ? "#1D9E75" : "var(--text-muted)" }}>+{days}d</button>
                                                );
                                              })}
                                            </div>
                                            <input type="date" value={clinicalFormState[formKey]?.controlDate ?? ""} onChange={(e) => setClinicalFormState((prev) => ({ ...prev, [formKey]: { ...prev[formKey], controlDate: e.target.value } }))} className="w-full rounded-xl border px-3 py-2 text-sm outline-none" style={{ borderColor: "var(--border-color)", background: "var(--bg-card)", color: "var(--text-main)", colorScheme: "dark" }} />
                                          </div>
                                        </div>
                                        <div className="mt-4 flex justify-end gap-2">
                                          <button type="button" onClick={() => setEditingNoteId(null)} className="inline-flex h-9 items-center justify-center rounded-xl border px-4 text-sm font-medium transition hover:bg-slate-100 dark:hover:bg-slate-700" style={{ borderColor: "var(--border-color)", background: "var(--bg-card)", color: "var(--text-main)" }}>Cancelar</button>
                                          <button type="button" onClick={() => { const form = clinicalFormState[formKey]; handleSaveClinical(note.appointment_id!, form?.reason ?? "", form?.notes ?? "", form?.diagnosis ?? "", form?.treatment ?? "", form?.controlType ?? "Control general", form?.notes ?? "", form?.controlDate ?? null); }} disabled={savingClinicalId === note.appointment_id} className="inline-flex h-9 items-center justify-center rounded-xl px-4 text-sm font-semibold text-white transition hover:opacity-85 disabled:opacity-60" style={{ background: savingClinicalId === note.appointment_id ? "rgba(37,99,235,0.5)" : "linear-gradient(135deg, rgb(37 99 235), rgb(99 102 241))" }}>{savingClinicalId === note.appointment_id ? "Guardando..." : "Guardar"}</button>
                                        </div>
                                      </div>
                                    ) : null}
                                  </div>
                                </div>
                              );
                            } else {
                              /* ── Atención SIN nota clínica ── */
                              const isCreatingNew = newNoteApptId === appt.id;
                              const formKey = appt.id;
                              return (
                                <div key={appt.id}>
                                  <div
                                    className="flex items-center justify-between gap-2 rounded-xl border p-3 transition-all duration-200"
                                    style={{
                                      borderColor: isCreatingNew ? "rgba(37,99,235,0.35)" : "var(--border-color)",
                                      background: "var(--bg-card)",
                                      borderLeftWidth: "3px",
                                      borderLeftColor: "#94a3b8",
                                    }}
                                  >
                                    <div className="flex min-w-0 items-center gap-2">
                                      <span className="inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-[11px] font-medium" style={{ background: "rgba(100,116,139,0.10)", color: "#94a3b8" }}>
                                        Sin consulta
                                      </span>
                                      <p className="text-xs" style={{ color: "var(--text-muted)" }}>{formatDate(appt.start_at)}</p>
                                      {appt.service_name_snapshot ? (
                                        <p className="truncate text-xs" style={{ color: "var(--text-muted)" }}>· {appt.service_name_snapshot}</p>
                                      ) : null}
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        if (isCreatingNew) { setNewNoteApptId(null); return; }
                                        setClinicalFormState((prev) => ({ ...prev, [formKey]: { reason: "", notes: "", diagnosis: "", treatment: "", controlDate: "", controlType: "" } }));
                                        setNewNoteApptId(appt.id);
                                      }}
                                      className="shrink-0 rounded-lg border px-2.5 py-1 text-xs font-medium transition"
                                      style={{ borderColor: "var(--border-color)", background: isCreatingNew ? "var(--bg-soft)" : "transparent", color: "var(--text-muted)" }}
                                    >
                                      {isCreatingNew ? "Cerrar" : "Completar consulta"}
                                    </button>
                                  </div>
                                  {/* Inline create form */}
                                  <div className="overflow-hidden transition-all duration-200 ease-in-out" style={{ maxHeight: isCreatingNew ? "900px" : "0" }}>
                                    {isCreatingNew ? (
                                      <div className="mt-2 rounded-xl border p-4" style={{ borderColor: "rgba(37,99,235,0.25)", background: "var(--bg-soft)" }}>
                                        <div className="mb-3 border-b pb-3" style={{ borderColor: "var(--border-color)" }}>
                                          <p className="text-[14px] font-medium" style={{ color: "var(--text-main)" }}>Nueva nota clínica</p>
                                          <p className="mt-0.5 text-[12px]" style={{ color: "var(--text-muted)" }}>{appt.service_name_snapshot || "Atención"} · {formatDateLong(appt.start_at)}</p>
                                        </div>
                                        <div className="space-y-3">
                                          {[
                                            { key: "reason", label: "Motivo", rows: 1, placeholder: "Motivo de la consulta" },
                                            { key: "diagnosis", label: "Diagnóstico", rows: 2, placeholder: "Diagnóstico" },
                                            { key: "treatment", label: "Tratamiento", rows: 2, placeholder: "Tratamiento indicado" },
                                            { key: "notes", label: "Observaciones", rows: 3, placeholder: "Observaciones / notas clínicas..." },
                                          ].map(({ key, label, rows, placeholder }) => (
                                            <div key={key}>
                                              <label className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.14em]" style={{ color: "var(--text-muted)" }}>{label}</label>
                                              {rows === 1 ? (
                                                <input type="text" placeholder={placeholder} value={(clinicalFormState[formKey] as any)?.[key] ?? ""} onChange={(e) => setClinicalFormState((prev) => ({ ...prev, [formKey]: { ...prev[formKey], [key]: e.target.value } }))} className="w-full rounded-xl border px-3 py-2 text-sm outline-none transition" style={{ borderColor: "var(--border-color)", background: "var(--bg-card)", color: "var(--text-main)" }} />
                                              ) : (
                                                <textarea rows={rows} placeholder={placeholder} value={(clinicalFormState[formKey] as any)?.[key] ?? ""} onChange={(e) => setClinicalFormState((prev) => ({ ...prev, [formKey]: { ...prev[formKey], [key]: e.target.value } }))} className="w-full resize-none rounded-xl border px-3 py-2 text-sm outline-none transition" style={{ borderColor: "var(--border-color)", background: "var(--bg-card)", color: "var(--text-main)" }} />
                                              )}
                                            </div>
                                          ))}
                                          <div>
                                            <label className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.14em]" style={{ color: "var(--text-muted)" }}>Próximo control</label>
                                            <input type="date" value={clinicalFormState[formKey]?.controlDate ?? ""} onChange={(e) => setClinicalFormState((prev) => ({ ...prev, [formKey]: { ...prev[formKey], controlDate: e.target.value } }))} className="w-full rounded-xl border px-3 py-2 text-sm outline-none" style={{ borderColor: "var(--border-color)", background: "var(--bg-card)", color: "var(--text-main)", colorScheme: "dark" }} />
                                          </div>
                                        </div>
                                        <div className="mt-4 flex justify-end gap-2">
                                          <button type="button" onClick={() => setNewNoteApptId(null)} className="inline-flex h-9 items-center justify-center rounded-xl border px-4 text-sm font-medium transition hover:bg-slate-100 dark:hover:bg-slate-700" style={{ borderColor: "var(--border-color)", background: "var(--bg-card)", color: "var(--text-main)" }}>Cancelar</button>
                                          <button type="button" onClick={() => { const form = clinicalFormState[formKey]; handleSaveClinical(appt.id, form?.reason ?? "", form?.notes ?? "", form?.diagnosis ?? "", form?.treatment ?? "", form?.controlType ?? "Control general", form?.notes ?? "", form?.controlDate ?? null); }} disabled={savingClinicalId === appt.id} className="inline-flex h-9 items-center justify-center rounded-xl px-4 text-sm font-semibold text-white transition hover:opacity-85 disabled:opacity-60" style={{ background: savingClinicalId === appt.id ? "rgba(37,99,235,0.5)" : "linear-gradient(135deg, rgb(37 99 235), rgb(99 102 241))" }}>{savingClinicalId === appt.id ? "Guardando..." : "Guardar"}</button>
                                        </div>
                                      </div>
                                    ) : null}
                                  </div>
                                </div>
                              );
                            }
                          })}
                          {orphanNoteItems.map(({ note }) => {
                            const accentP = note.control_type === "Vacuna" ? "#B4B2A9" : note.control_type === "Desparasitación" ? "#EF9F27" : "#1D9E75";
                            const badgeP = note.control_type === "Vacuna" ? { background: "rgba(100,116,139,0.12)", color: "#64748b" } : note.control_type === "Desparasitación" ? { background: "rgba(239,159,39,0.12)", color: "#EF9F27" } : { background: "rgba(29,158,117,0.12)", color: "#1D9E75" };
                            return (
                              <div key={note.id} className="overflow-hidden rounded-xl border" style={{ borderColor: "var(--border-color)", background: "var(--bg-card)", borderLeftWidth: "3px", borderLeftColor: accentP }}>
                                <div className="flex items-center gap-2 px-3 pb-2 pt-3">
                                  <span className="inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-[11px] font-medium" style={badgeP}>{note.control_type || "Atención"}</span>
                                  <p className="text-xs" style={{ color: "var(--text-muted)" }}>{formatDate(note.date)}</p>
                                </div>
                                <div className="space-y-2 px-3 pb-3">
                                  {note.reason ? <div><p className="text-[11px] uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>Motivo</p><p className="mt-0.5 text-xs" style={{ color: "var(--text-main)" }}>{note.reason}</p></div> : null}
                                  {note.next_control_at ? <p className="flex items-center gap-1 text-xs font-medium" style={{ color: "#1D9E75" }}><span>📅</span><span>{formatDateLong(note.next_control_at)}</span></p> : null}
                                </div>
                              </div>
                            );
                          })}
                        </>
                      );
                    })()}
                  </div>
                </div>
              </Panel>
            ) : null}

          </div>

          <div className="hidden">


          </div>

          <div className={`space-y-4 ${isVeterinaria ? "xl:col-span-2" : ""} ${isVeterinaria && activeVetTab === "pets" ? "hidden" : ""}`}>

            {isVeterinaria && activeVetTab === "followups" ? (
              <Panel
                title="Próximos controles"
                description="Seguimientos registrados desde Agenda para este cliente."
              >
                {followups.length === 0 ? (
                  <EmptyState
                    title="Sin próximos controles"
                    description="Cuando registres controles desde Agenda, aparecerán aquí."
                  />
                ) : (
                  <div className="space-y-3">
                    {followups.map((followup) => {
                      const date = followup.next_control_at
                        ? new Date(followup.next_control_at)
                        : null;

                      const now = new Date();

                      let statusColor = "#64748b";

                      if (date) {
                        if (date < now) {
                          statusColor = "#ef4444";
                        } else if (
                          date.getTime() - now.getTime() <
                          1000 * 60 * 60 * 24 * 3
                        ) {
                          statusColor = "#f59e0b";
                        } else {
                          statusColor = "#10b981";
                        }
                      }

                      return (
                        <div
                          key={followup.id}
                          className="rounded-2xl border p-4"
                          style={{
                            borderColor: "var(--border-color)",
                            background: "var(--bg-card)",
                          }}
                        >
                          <div className="flex items-center justify-between gap-3">
                            <div>
                              <p
                                className="text-sm font-semibold"
                                style={{ color: "var(--text-main)" }}
                              >
                                {followup.control_type}
                              </p>

                              {followup.pets?.name ? (
                                <p
                                  className="mt-1 text-xs"
                                  style={{ color: "var(--text-muted)" }}
                                >
                                  🐾 {followup.pets.name}
                                </p>
                              ) : null}
                            </div>

                            {followup.next_control_label ? (
                              <span
                                className="rounded-full px-2.5 py-1 text-[11px] font-semibold"
                                style={{
                                  background: `${statusColor}20`,
                                  color: statusColor,
                                }}
                              >
                                {followup.next_control_label}
                              </span>
                            ) : null}
                          </div>

                          {followup.next_control_at ? (
                            <p
                              className="mt-2 text-sm"
                              style={{ color: "var(--text-muted)" }}
                            >
                              {formatDateLong(followup.next_control_at)}
                            </p>
                          ) : null}


                        </div>
                      );
                    })}
                  </div>
                )}
              </Panel>
            ) : !isVeterinaria ? (
              <Panel
                title="Seguimiento"
                description="Espacio preparado para futuras acciones del cliente."
              >
                <EmptyState
                  title="Sin seguimiento adicional"
                  description="Este bloque puede evolucionar después según el rubro del negocio."
                />
              </Panel>
            ) : null}

                      </div>
        </div>
      )}

      {/* Modal Resumen clínico */}
      {showResumenModal ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          style={{ backdropFilter: "blur(4px)" }}
          onClick={() => setShowResumenModal(false)}
        >
          <div
            className="relative w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden"
            style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)", maxHeight: "90vh", overflowY: "auto" }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: "1px solid var(--border-color)" }}>
              <div>
                <h2 className="text-base font-semibold" style={{ color: "var(--text-main)" }}>{customer?.name}</h2>
                <p className="mt-0.5 text-xs" style={{ color: "var(--text-muted)" }}>Resumen clínico del paciente</p>
              </div>
              <button
                type="button"
                onClick={() => setShowResumenModal(false)}
                className="text-xl font-light transition"
                style={{ color: "var(--text-muted)" }}
              >✕</button>
            </div>

            <div className="space-y-5 p-6">

              {/* Datos personales */}
              <div className="rounded-xl p-4" style={{ background: "var(--bg-soft)", border: "1px solid var(--border-color)" }}>
                <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.18em]" style={{ color: "var(--text-muted)" }}>Datos personales</p>
                <div className="grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
                  {customer?.rut ? <div><span style={{ color: "var(--text-muted)" }}>RUT: </span><span style={{ color: "var(--text-main)" }}>{customer.rut}</span></div> : null}
                  {customer?.birth_date ? <div><span style={{ color: "var(--text-muted)" }}>Fecha nac.: </span><span style={{ color: "var(--text-main)" }}>{new Date(customer.birth_date).toLocaleDateString("es-CL")}</span></div> : null}
                  {customer?.sex ? <div><span style={{ color: "var(--text-muted)" }}>Sexo: </span><span style={{ color: "var(--text-main)" }}>{customer.sex}</span></div> : null}
                  {customer?.occupation ? <div><span style={{ color: "var(--text-muted)" }}>Ocupación: </span><span style={{ color: "var(--text-main)" }}>{customer.occupation}</span></div> : null}
                  {customer?.health_insurance ? <div><span style={{ color: "var(--text-muted)" }}>Previsión: </span><span style={{ color: "var(--text-main)" }}>{customer.health_insurance}</span></div> : null}
                  {customer?.emergency_contact_name ? <div className="sm:col-span-2"><span style={{ color: "var(--text-muted)" }}>Contacto emergencia: </span><span style={{ color: "var(--text-main)" }}>{customer.emergency_contact_name}{customer.emergency_contact_phone ? ` · ${customer.emergency_contact_phone}` : ""}</span></div> : null}
                </div>
              </div>

              {/* Antecedentes médicos */}
              {(customer?.known_allergies || customer?.chronic_conditions || customer?.family_history || customer?.habits) ? (
                <div className="rounded-xl p-4" style={{ background: "var(--bg-soft)", border: "1px solid var(--border-color)" }}>
                  <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.18em]" style={{ color: "var(--text-muted)" }}>Antecedentes médicos</p>
                  <div className="space-y-3">
                    {customer?.known_allergies ? (
                      <div>
                        <p className="text-[11px] font-medium" style={{ color: "#b45309" }}>⚠ Alergias conocidas</p>
                        <p className="mt-0.5 text-sm" style={{ color: "var(--text-main)" }}>{customer.known_allergies}</p>
                      </div>
                    ) : null}
                    {customer?.chronic_conditions ? (
                      <div>
                        <p className="text-[11px] font-medium" style={{ color: "var(--text-muted)" }}>Patologías crónicas</p>
                        <p className="mt-0.5 text-sm" style={{ color: "var(--text-main)" }}>{customer.chronic_conditions}</p>
                      </div>
                    ) : null}
                    {customer?.family_history ? (
                      <div>
                        <p className="text-[11px] font-medium" style={{ color: "var(--text-muted)" }}>Antecedentes familiares</p>
                        <p className="mt-0.5 text-sm" style={{ color: "var(--text-main)" }}>{customer.family_history}</p>
                      </div>
                    ) : null}
                    {customer?.habits ? (
                      <div>
                        <p className="text-[11px] font-medium" style={{ color: "var(--text-muted)" }}>Hábitos</p>
                        <p className="mt-0.5 text-sm" style={{ color: "var(--text-main)" }}>{customer.habits}</p>
                      </div>
                    ) : null}
                  </div>
                </div>
              ) : null}

              {/* Última atención */}
              {(clinicalNotes[PATIENT_NOTES_KEY]?.length ?? 0) > 0 ? (
                <div className="rounded-xl p-4" style={{ background: "var(--bg-soft)", border: "1px solid var(--border-color)" }}>
                  <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.18em]" style={{ color: "var(--text-muted)" }}>Última atención</p>
                  <div className="space-y-1.5 text-sm">
                    <div><span style={{ color: "var(--text-muted)" }}>Fecha: </span><span style={{ color: "var(--text-main)" }}>{new Date(clinicalNotes[PATIENT_NOTES_KEY]![0].date).toLocaleDateString("es-CL")}</span></div>
                    {clinicalNotes[PATIENT_NOTES_KEY]![0].diagnosis ? <div><span style={{ color: "var(--text-muted)" }}>Diagnóstico: </span><span style={{ color: "var(--text-main)" }}>{clinicalNotes[PATIENT_NOTES_KEY]![0].diagnosis}</span></div> : null}
                    {clinicalNotes[PATIENT_NOTES_KEY]![0].treatment ? <div><span style={{ color: "var(--text-muted)" }}>Tratamiento: </span><span style={{ color: "var(--text-main)" }}>{clinicalNotes[PATIENT_NOTES_KEY]![0].treatment}</span></div> : null}
                    {clinicalNotes[PATIENT_NOTES_KEY]![0].medications ? <div><span style={{ color: "var(--text-muted)" }}>Medicamentos: </span><span style={{ color: "var(--text-main)" }}>{clinicalNotes[PATIENT_NOTES_KEY]![0].medications}</span></div> : null}
                    {clinicalNotes[PATIENT_NOTES_KEY]![0].next_control_at ? <div><span style={{ color: "var(--text-muted)" }}>Próximo control: </span><span style={{ color: "#1D9E75", fontWeight: 500 }}>{formatDateLong(clinicalNotes[PATIENT_NOTES_KEY]![0].next_control_at!)}{clinicalNotes[PATIENT_NOTES_KEY]![0].next_control_label ? ` · ${clinicalNotes[PATIENT_NOTES_KEY]![0].next_control_label}` : ""}</span></div> : null}
                  </div>
                </div>
              ) : null}

              {/* Estadísticas */}
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-xl p-4 text-center" style={{ background: "var(--bg-soft)", border: "1px solid var(--border-color)" }}>
                  <p className="text-2xl font-bold" style={{ color: "var(--text-main)" }}>{appointments.length}</p>
                  <p className="mt-1 text-xs" style={{ color: "var(--text-muted)" }}>Total atenciones</p>
                </div>
                <div className="rounded-xl p-4 text-center" style={{ background: "var(--bg-soft)", border: "1px solid var(--border-color)" }}>
                  <p className="text-2xl font-bold" style={{ color: "var(--text-main)" }}>{clinicalNotes[PATIENT_NOTES_KEY]?.length ?? 0}</p>
                  <p className="mt-1 text-xs" style={{ color: "var(--text-muted)" }}>Consultas registradas</p>
                </div>
              </div>

            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
