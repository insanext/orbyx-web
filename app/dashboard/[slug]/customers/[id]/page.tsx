"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
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
  const router = useRouter();
  const slug = params?.slug as string;
  const customerId = params?.id as string;

  const [customer, setCustomer] = useState<Customer | null>(null);
  const [businessCategory, setBusinessCategory] = useState("");
  const isVeterinaria =
    businessCategory === "veterinaria" || businessCategory === "vet";

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

      setTimeout(() => {
        setClinicalMessage("");
      }, 2500);
    } catch (err: any) {
      setClinicalMessage("error: " + (err?.message || "No se pudo guardar la ficha clínica."));
    } finally {
      setSavingClinicalId(null);
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
                description="Agrega mascotas del cliente y construye una ficha veterinaria liviana."
              >
                <form
                  onSubmit={handleCreatePet}
                  className="mb-6 rounded-2xl border p-4"
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
                          setPetForm((prev) => ({
                            ...prev,
                            name: e.target.value,
                          }))
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
                            species_base: e.target.value as
                              | "perro"
                              | "gato"
                              | "otro",
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
                            setPetForm((prev) => ({
                              ...prev,
                              species_custom: e.target.value,
                            }))
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
                          setPetForm((prev) => ({
                            ...prev,
                            breed: e.target.value,
                          }))
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
                          setPetForm((prev) => ({
                            ...prev,
                            sex: e.target.value,
                          }))
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
                          setPetForm((prev) => ({
                            ...prev,
                            weight_kg: e.target.value,
                          }))
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
                          setPetForm((prev) => ({
                            ...prev,
                            is_sterilized: e.target.checked,
                          }))
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
                          setPetForm((prev) => ({
                            ...prev,
                            notes: e.target.value,
                          }))
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




{pets.length === 0 ? (
  <EmptyState
    title="Sin mascotas todavía"
    description="Agrega la primera mascota del cliente."
  />
) : (
  <div className="space-y-4">
    {pets.map((pet) => (
      <div
        key={pet.id}
        className="rounded-2xl border p-3 sm:p-4"
        style={{
          borderColor: "var(--border-color)",
          background: "var(--bg-card)",
        }}
      >
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
      setEditingPetId(null);
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
    onClick={() => {
      if (!clinicalNotes[pet.id]) {
        loadClinicalNotes(pet.id);
      }
      setViewingPetId(pet.id);
      handleOpenEdit(pet.id, validAppointments);
    }}
    className="rounded-xl border px-4 py-2 text-xs font-medium transition hover:bg-slate-100"
    style={{
      borderColor: "var(--border-color)",
      color: "var(--text-main)",
    }}
  >
    Editar
  </button>

  <button
    type="button"
    onClick={() =>
      router.push(
        `/dashboard/${slug}/customers/${customerId}/clinical-report/${pet.id}`
      )
    }
    className="rounded-xl border px-4 py-2 text-center text-xs font-medium transition hover:bg-slate-100"
    style={{
      borderColor: "var(--border-color)",
      color: "var(--text-main)",
    }}
  >
    PDF
  </button>
</div>
</div>


        {viewingPetId === pet.id ? (
          <div
            className="mt-4 rounded-2xl border p-4 sm:p-5"
            style={{ borderColor: "var(--border-color)", background: "var(--bg-soft)" }}
          >
            {/* ── Header mascota ── */}
            <div className="flex items-start justify-between gap-3">
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
                  <div className="mt-1 flex flex-wrap items-center gap-1.5">
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
                  <p className="mt-1 flex items-center gap-1 text-xs" style={{ color: "var(--text-muted)" }}>
                    <span>👤</span>
                    <span>{customer.name}</span>
                    {customer.phone ? <span>· {customer.phone}</span> : null}
                  </p>
                </div>
              </div>
              {/* Botones Editar + PDF */}
              <div className="flex shrink-0 items-center gap-2">
                {editingPetId === pet.id ? null : (
                  <button
                    type="button"
                    onClick={() => handleOpenEdit(pet.id, validAppointments)}
                    className="inline-flex h-10 items-center justify-center rounded-2xl border px-4 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-60"
                    style={{ borderColor: "var(--border-color)", background: "var(--bg-card)", color: "var(--text-main)" }}
                  >
                    Editar
                  </button>
                )}
                <button
                  type="button"
                  onClick={() =>
                    router.push(
                      `/dashboard/${slug}/customers/${customerId}/clinical-report/${pet.id}`
                    )
                  }
                  className="inline-flex h-10 items-center justify-center rounded-2xl border px-4 text-sm font-medium transition"
                  style={{ borderColor: "rgba(29,158,117,0.30)", background: "rgba(29,158,117,0.08)", color: "#1D9E75" }}
                >
                  PDF
                </button>
              </div>
            </div>

            {/* ── Datos de mascota ── */}
            <div
              className="mt-4 rounded-xl border p-3"
              style={{ borderColor: "var(--border-color)", background: "var(--bg-card)" }}
            >
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.14em]" style={{ color: "var(--text-muted)" }}>
                Datos de mascota
              </p>
              <div className="grid grid-cols-2 text-sm">
                {[
                  { label: "Especie",      value: getPetSpeciesLabel(pet) },
                  { label: "Raza",         value: pet.breed || "—" },
                  { label: "Sexo",         value: pet.sex || "—" },
                  { label: "Peso",         value: pet.weight_kg ? `${pet.weight_kg} kg` : "—" },
                  { label: "Esterilizado", value: pet.is_sterilized ? "Sí" : "No" },
                  { label: "Notas",        value: pet.notes || "—" },
                ].map((item, idx) => (
                  <div
                    key={item.label}
                    className={`py-2 ${idx % 2 === 0 ? "pr-3" : "pl-3"}`}
                    style={idx < 4 ? { borderBottom: "0.5px solid var(--border-color)" } : undefined}
                  >
                    <p className="text-[11px] uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>{item.label}</p>
                    <p className="mt-0.5 font-medium" style={{ color: "var(--text-main)" }}>{item.value}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* ── Historial clínico ── */}
            <div className="mt-5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em]" style={{ color: "var(--text-muted)" }}>
                Historial clínico
              </p>
            </div>

            <div className="mt-3 space-y-3">
              {!Array.isArray(clinicalNotes[pet.id]) || clinicalNotes[pet.id].length === 0 ? (
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
                clinicalNotes[pet.id].map((note) => {
                  const accentColor =
                    note.control_type === "Vacuna"          ? "#B4B2A9" :
                    note.control_type === "Desparasitación" ? "#EF9F27" :
                    "#1D9E75";
                  return (
                    <div
                      key={note.id}
                      className="overflow-hidden rounded-xl border"
                      style={{ borderColor: "var(--border-color)", background: "var(--bg-card)", borderLeftWidth: "3px", borderLeftColor: accentColor }}
                    >
                      {/* Header nota */}
                      <div className="flex items-start justify-between gap-2 px-3 pt-3">
                        <div className="flex min-w-0 items-center gap-2">
                          <span
                            className="inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-[11px] font-medium"
                            style={{ background: "rgba(29,158,117,0.12)", color: "#1D9E75" }}
                          >
                            {note.control_type || "Atención"}
                          </span>
                          {note.reason ? (
                            <p className="truncate text-[13px] font-medium" style={{ color: "var(--text-main)" }}>
                              {note.reason}
                            </p>
                          ) : null}
                        </div>
                        <p className="shrink-0 text-xs" style={{ color: "var(--text-muted)" }}>
                          {formatDateLong(note.date)}
                        </p>
                      </div>
                      {/* Cuerpo */}
                      <div className="space-y-2 px-3 pb-3 pt-2">
                        {(note.diagnosis || note.treatment) ? (
                          <div
                            className={`grid gap-2 rounded-lg p-2 ${note.diagnosis && note.treatment ? "grid-cols-2" : "grid-cols-1"}`}
                            style={{ background: "var(--bg-soft)" }}
                          >
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
                          </div>
                        ) : null}
                        {note.observations ? (
                          <div>
                            <p className="text-[11px] uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>Observaciones</p>
                            <p className="mt-0.5 text-xs" style={{ color: "var(--text-main)" }}>{note.observations}</p>
                          </div>
                        ) : null}
                        {note.next_control_at ? (
                          <p className="flex items-center gap-1 text-xs font-medium" style={{ color: "#1D9E75" }}>
                            <span>📅</span>
                            <span>{formatDateLong(note.next_control_at)}</span>
                          </p>
                        ) : null}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* ── Formulario de edición ── */}
            {editingPetId === pet.id
              ? validAppointments.filter((a) => a.pet_id === pet.id).slice(0, 1).map((latestAppt) => (
                <div
                  key="edit-form"
                  className="mt-5 rounded-xl border p-4"
                  style={{ borderColor: "var(--border-color)", background: "var(--bg-soft)" }}
                >
                  <p className="mb-3 text-[13px] font-medium" style={{ color: "var(--text-main)" }}>
                    Editar ficha clínica — {latestAppt.service_name_snapshot || "Atención"}
                  </p>
                  <div className="space-y-3">
                    {[
                      { key: "reason",    label: "Motivo",      rows: 1,  placeholder: "Control realizado / motivo" },
                      { key: "diagnosis", label: "Diagnóstico", rows: 2,  placeholder: "Diagnóstico" },
                      { key: "treatment", label: "Tratamiento", rows: 2,  placeholder: "Tratamiento indicado" },
                      { key: "notes",     label: "Observaciones", rows: 3, placeholder: "Observaciones / notas clínicas..." },
                    ].map(({ key, label, rows, placeholder }) => (
                      <div key={key}>
                        <label className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.14em]" style={{ color: "var(--text-muted)" }}>
                          {label}
                        </label>
                        {rows === 1 ? (
                          <input
                            type="text"
                            placeholder={placeholder}
                            value={(clinicalFormState[latestAppt.id] as any)?.[key] ?? ""}
                            onChange={(e) => setClinicalFormState((prev) => ({ ...prev, [latestAppt.id]: { ...prev[latestAppt.id], [key]: e.target.value } }))}
                            className="w-full rounded-xl border px-3 py-2 text-sm outline-none transition"
                            style={{ borderColor: "var(--border-color)", background: "var(--bg-card)", color: "var(--text-main)" }}
                          />
                        ) : (
                          <textarea
                            rows={rows}
                            placeholder={placeholder}
                            value={(clinicalFormState[latestAppt.id] as any)?.[key] ?? ""}
                            onChange={(e) => setClinicalFormState((prev) => ({ ...prev, [latestAppt.id]: { ...prev[latestAppt.id], [key]: e.target.value } }))}
                            className="w-full resize-none rounded-xl border px-3 py-2 text-sm outline-none transition"
                            style={{ borderColor: "var(--border-color)", background: "var(--bg-card)", color: "var(--text-main)" }}
                          />
                        )}
                      </div>
                    ))}
                    {/* Próximo control */}
                    <div>
                      <label className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.14em]" style={{ color: "var(--text-muted)" }}>
                        Próximo control
                      </label>
                      <div className="mb-2 flex flex-wrap gap-1.5">
                        {[7, 15, 30, 60].map((days) => {
                          const base = latestAppt.start_at ? new Date(latestAppt.start_at) : new Date();
                          const target = new Date(base.getTime());
                          target.setDate(target.getDate() + days);
                          const targetStr = target.toISOString().slice(0, 10);
                          const isSelected = (clinicalFormState[latestAppt.id]?.controlDate ?? "") === targetStr;
                          return (
                            <button
                              key={days}
                              type="button"
                              onClick={() => setClinicalFormState((prev) => ({ ...prev, [latestAppt.id]: { ...prev[latestAppt.id], controlDate: targetStr } }))}
                              className="rounded-full border px-2.5 py-1 text-xs font-medium transition"
                              style={{
                                borderColor: isSelected ? "rgba(29,158,117,0.60)" : "var(--border-color)",
                                background:  isSelected ? "rgba(29,158,117,0.12)" : "transparent",
                                color:       isSelected ? "#1D9E75" : "var(--text-muted)",
                              }}
                            >
                              +{days}d
                            </button>
                          );
                        })}
                      </div>
                      <input
                        type="date"
                        value={clinicalFormState[latestAppt.id]?.controlDate ?? ""}
                        onChange={(e) => setClinicalFormState((prev) => ({ ...prev, [latestAppt.id]: { ...prev[latestAppt.id], controlDate: e.target.value } }))}
                        className="w-full rounded-xl border px-3 py-2 text-sm outline-none"
                        style={{ borderColor: "var(--border-color)", background: "var(--bg-card)", color: "var(--text-main)", colorScheme: "dark" }}
                      />
                    </div>
                  </div>
                  {/* Botones */}
                  <div className="mt-4 flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setEditingPetId(null)}
                      className="inline-flex h-10 items-center justify-center rounded-2xl border px-4 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-60"
                      style={{ borderColor: "var(--border-color)", background: "var(--bg-card)", color: "var(--text-main)" }}
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const form = clinicalFormState[latestAppt.id];
                        handleSaveClinical(latestAppt.id, form?.reason ?? "", form?.notes ?? "", form?.diagnosis ?? "", form?.treatment ?? "", form?.reason ?? "", form?.notes ?? "", form?.controlDate ?? null);
                      }}
                      disabled={savingClinicalId === latestAppt.id}
                      className="inline-flex h-10 items-center justify-center rounded-2xl px-4 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-60"
                      style={{ background: savingClinicalId === latestAppt.id ? "rgba(37,99,235,0.5)" : "linear-gradient(135deg, rgb(37 99 235), rgb(99 102 241))" }}
                    >
                      {savingClinicalId === latestAppt.id ? "Guardando..." : "Guardar"}
                    </button>
                  </div>
                </div>
              ))
              : null}
          </div>
        ) : null}
      </div>
    ))}
  </div>
)}
              </Panel>
            ) : null}

            {!isVeterinaria ? (
              <Panel
                title="Historial de visitas"
                description="Registro simple de atenciones realizadas por este cliente."
              >
                {latestAppointments.length === 0 ? (
                  <EmptyState
                    title="Sin visitas registradas"
                    description="Cuando el cliente tenga atenciones cerradas, aparecerán aquí."
                  />
                ) : (
                  <div className="space-y-3">
                    {latestAppointments
  .filter((appt) => !["canceled", "cancelled"].includes(String(appt.status || "").toLowerCase()))
  .map((appt) => (
                      <div
                        key={appt.id}
                        className="rounded-2xl border p-4"
                        style={{
                          borderColor: "var(--border-color)",
                          background: "var(--bg-card)",
                        }}
                      >
                        <p
                          className="text-sm font-semibold"
                          style={{ color: "var(--text-main)" }}
                        >
                          {appt.service_name_snapshot || "Atención"}
                        </p>

                        <p
                          className="mt-1 text-xs"
                          style={{ color: "var(--text-muted)" }}
                        >
                          {formatDateLong(appt.start_at)}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </Panel>
            ) : null}

          </div>

          <div className="hidden">


          </div>

          <div className={`space-y-4 ${isVeterinaria ? "xl:col-span-2" : ""} ${isVeterinaria && activeVetTab === "pets" ? "hidden" : ""}`}>
            {(!isVeterinaria || activeVetTab === "summary") ? (
            <Panel
              title="Resumen rápido"
              description="Lectura rápida del cliente para operación diaria."
            >
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">

<SummaryCard
  label={isVeterinaria ? "Visitas" : "Visitas válidas"}
  value={validAppointments.length}
  hint={
    isVeterinaria
      ? "Cantidad total de atenciones registradas."
      : "Atenciones no canceladas registradas para este cliente."
  }
/>

{!isVeterinaria ? (
  <SummaryCard
    label="Canceladas"
    value={cancelledAppointments.length}
    hint="Reservas canceladas asociadas a este cliente."
  />
) : null}

<SummaryCard
  label="Última visita"
  value={
    isVeterinaria
      ? formatDate(lastValidAppointment?.start_at)
      : formatDate(lastValidAppointment?.start_at)
  }
  hint={
    isVeterinaria
      ? "Última fecha registrada del cliente."
      : "Última atención no cancelada registrada."
  }
/>
              </div>
            </Panel>
            ) : null}

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
    </div>
  );
}
