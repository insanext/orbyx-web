"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
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
      className="rounded-2xl border p-4"
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
        className="mt-2 text-2xl font-semibold"
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
const [viewingClinicalId, setViewingClinicalId] = useState<string | null>(null);

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
          const resAppointments = await fetch(
            `${BACKEND_URL}/appointments/customer-history/${slug}?customer_id=${customerId}`
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
  }, [slug, customerId]);

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

  const latestPets = useMemo(() => {
    return [...pets].slice(0, 4);
  }, [pets]);

  async function handleSaveClinical(
  appointmentId: string,
  reason: string,
  notes: string,
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
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
  reason,
  notes,
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
              }
            : appt
        )
      );

      setClinicalMessage("Ficha clínica guardada correctamente.");

      setTimeout(() => {
        setClinicalMessage("");
      }, 2500);
    } catch (err: any) {
      setClinicalMessage(err?.message || "No se pudo guardar la ficha clínica.");
    } finally {
      setSavingClinicalId(null);
    }
  }

  return (
    <div className="space-y-6">

      {loading ? (
        <Panel title="Cargando ficha">
          <p style={{ color: "var(--text-muted)" }}>Cargando...</p>
        </Panel>
      ) : !customer ? (
        <Panel title="Cliente">
          <p style={{ color: "var(--text-muted)" }}>No encontrado</p>
        </Panel>
      ) : (



        <div className="grid gap-6 xl:grid-cols-[1.45fr_0.8fr]">
          <div className="space-y-6">
            


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
      🐶 {pets.length} mascotas · 🩺 {customer.total_visits} visitas
    </p>

    <p className="mt-2 text-xs text-slate-400">
      Última visita: {formatDateLong(customer.last_visit_at)}
    </p>
  </div>

  <button
    onClick={() => window.print()}
    className="mt-4 md:mt-0 rounded-xl border border-white/30 px-4 py-2 text-sm hover:bg-white/10"
  >
    🖨️ Imprimir ficha
  </button>
</div>




            {isVeterinaria ? (
              <Panel
                title="Mascotas"
                description="Agrega mascotas del cliente y construye una ficha veterinaria liviana."
              >
                <form
                  onSubmit={handleCreatePet}
                  className="hidden mb-6 rounded-2xl border p-4"
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
        className="rounded-2xl border p-4 flex items-center gap-4"
        style={{
          borderColor: "var(--border-color)",
          background: "var(--bg-card)",
        }}
      >
        <div className="h-16 w-16 rounded-full bg-slate-200 flex items-center justify-center text-lg font-semibold text-slate-600">
          🐾
        </div>

        <div className="flex-1">
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

<button
  type="button"
  onClick={() =>
    setEditingPetId((prev) => (prev === pet.id ? null : pet.id))
  }
  className="rounded-xl border px-3 py-1 text-xs hover:bg-slate-100"
>
  {editingPetId === pet.id ? "Cerrar" : "Editar"}
</button>
        {editingPetId === pet.id ? (
          <div
            className="mt-4 rounded-2xl border p-4"
            style={{
              borderColor: "var(--border-color)",
              background: "var(--bg-soft)",
            }}
          >
            <p
              className="text-sm font-semibold"
              style={{ color: "var(--text-main)" }}
            >
              Ficha clínica de {pet.name}
            </p>

            <p
              className="mt-1 text-xs"
              style={{ color: "var(--text-muted)" }}
            >
              Historial alimentado desde Agenda.
            </p>

            <div className="mt-4 space-y-3">
              {latestAppointments.filter((appt) => appt.pet_id === pet.id).length === 0 ? (
                <EmptyState
                  title="Sin atenciones registradas"
                  description="Cuando cierres una atención desde Agenda para esta mascota, aparecerá aquí."
                />
              ) : (
                latestAppointments
                  .filter((appt) => appt.pet_id === pet.id)
                  .map((appt, index) => {
  const isLatest = index === 0;
  const isViewing = viewingClinicalId === appt.id;

  return (
                    !isLatest ? (
                      <div
                        key={appt.id}
                        className="rounded-xl border px-4 py-3"
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
  {formatDateLong(appt.start_at)}
</p>

<p
  className="text-xs"
  style={{ color: "var(--text-muted)" }}
>
  {appt.service_name_snapshot || "Atención"}
</p>

                            <p
                              className="mt-1 text-xs"
                              style={{ color: "var(--text-muted)" }}
                            >
                              {appt.reason || "Sin motivo registrado"}
                            </p>
                          </div>

                          <button
                            type="button"
                            onClick={() =>
                              setViewingClinicalId((prev) =>
                                prev === appt.id ? null : appt.id
                              )
                            }
                            className="rounded-xl border px-3 py-1 text-xs"
                          >
                            {isViewing ? "Ocultar" : "Ver detalles"}
                          </button>
                        </div>

                        {isViewing ? (
                          <div
                            className="mt-3 rounded-xl border p-3 text-sm"
                            style={{
                              borderColor: "var(--border-color)",
                              background: "var(--bg-soft)",
                              color: "var(--text-muted)",
                            }}
                          >
                            <p>
                              <strong>Notas:</strong>{" "}
                              {appt.notes || "Sin notas clínicas."}
                            </p>

                            <p className="mt-2">
                              <strong>Próximo control:</strong>{" "}
{appt.next_control_at
  ? formatDateLong(appt.next_control_at)
  : "No definido"}{" "}
                              {appt.next_control_at
                                ? formatDateLong(appt.next_control_at)
                                : "Sin próximo control."}
                            </p>
                          </div>
                        ) : null}
                      </div>
                    ) : (
                    <div
                      key={appt.id}
                      className="rounded-2xl border p-4 space-y-3"
                      style={{
                        borderColor: "var(--border-color)",
                        background: "var(--bg-card)",
                      }}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p
                            className="text-sm font-semibold"
                            style={{ color: "var(--text-main)" }}
                          >
                            {appt.service_name_snapshot || "Atención"}
                          </p>

                          <p
                            className="text-xs"
                            style={{ color: "var(--text-muted)" }}
                          >
                            {formatDateLong(appt.start_at)}
                          </p>
                        </div>
                      </div>

                      
<div className="mt-3 space-y-3">
                        <input
                          type="text"
                          placeholder="Control realizado / motivo"
                          defaultValue={appt.reason || ""}
                          id={`pet-reason-${appt.id}`}
                          className="w-full rounded-xl border px-3 py-2 text-sm outline-none"
                          style={{
                            borderColor: "var(--border-color)",
                            background: "var(--bg-card)",
                            color: "var(--text-main)",
                          }}
                        />

                        <textarea
                          placeholder="Notas clínicas..."
                          defaultValue={appt.notes || ""}
                          id={`pet-notes-${appt.id}`}
                          className="min-h-[90px] w-full resize-none rounded-xl border px-3 py-2 text-sm outline-none"
                          style={{
                            borderColor: "var(--border-color)",
                            background: "var(--bg-card)",
                            color: "var(--text-main)",
                          }}
                        />

                        <div className="grid gap-2">
  <p className="text-xs font-semibold" style={{ color: "var(--text-muted)" }}>
    Próximo control
  </p>

  <div className="flex flex-wrap gap-2">
    {[7, 15, 30, 60].map((days) => (
      <button
        key={days}
        type="button"
        onClick={() => {
          const date = new Date();
          date.setDate(date.getDate() + days);

          const input = document.getElementById(
            `pet-control-date-${appt.id}`
          ) as HTMLInputElement | null;

          if (input) {
            input.value = date.toISOString().slice(0, 10);
          }
        }}
        className="rounded-full border px-3 py-1 text-xs hover:bg-slate-100"
      >
        {days} días
      </button>
    ))}
  </div>

  <input
    type="date"
    defaultValue={
      appt.next_control_at
        ? new Date(appt.next_control_at).toISOString().slice(0, 10)
        : ""
    }
    id={`pet-control-date-${appt.id}`}
    className="w-full rounded-xl border px-3 py-2 text-sm outline-none"
    style={{
      borderColor: "var(--border-color)",
      background: "var(--bg-card)",
      color: "var(--text-main)",
    }}
  />
</div>
</div>

                      <div className="mt-4 flex justify-end gap-2">
                        <button
  type="button"
  onClick={() => setEditingPetId(null)}
  className="rounded-xl border px-4 py-2 text-xs font-medium"
>
  Cancelar
</button>

                        <button
                          type="button"
                          onClick={() => {
                            const reasonInput = document.getElementById(
                              `pet-reason-${appt.id}`
                            ) as HTMLInputElement | null;

                            const notesInput = document.getElementById(
                              `pet-notes-${appt.id}`
                            ) as HTMLTextAreaElement | null;

                            const controlDateInput = document.getElementById(
                              `pet-control-date-${appt.id}`
                            ) as HTMLInputElement | null;

                            handleSaveClinical(
                              appt.id,
                              reasonInput?.value || "",
                              notesInput?.value || "",
                              reasonInput?.value || "",
                              notesInput?.value || "",
                              controlDateInput?.value || null
                            );
                          }}
                          disabled={savingClinicalId === appt.id}
                          className="rounded-xl bg-blue-600 px-4 py-2 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-60"
                        >
                          {savingClinicalId === appt.id ? "Guardando..." : "Guardar"}
                        </button>
                                            </div>
                    </div>
                  )
  );
})
              )}
            </div>
          </div>
        ) : null}
      </div>
    ))}
  </div>
)}
              </Panel>
            ) : null}



          </div>

          <div className="space-y-6">
            <Panel
              title="Resumen rápido"
              description="Lectura rápida del cliente para operación diaria."
            >
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">

                <SummaryCard
                  label="Visitas"
                  value={customer.total_visits}
                  hint="Cantidad total de atenciones registradas."
                />

                <SummaryCard
                  label="Última visita"
                  value={formatDate(customer.last_visit_at)}
                  hint="Última fecha registrada del cliente."
                />
              </div>
            </Panel>

            {isVeterinaria ? (
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
            ) : (
              <Panel
                title="Seguimiento"
                description="Espacio preparado para futuras acciones del cliente."
              >
                <EmptyState
                  title="Sin seguimiento adicional"
                  description="Este bloque puede evolucionar después según el rubro del negocio."
                />
              </Panel>
            )}

                      </div>
        </div>
      )}
    </div>
  );
}