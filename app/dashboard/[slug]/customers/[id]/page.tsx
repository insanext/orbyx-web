"use client";

import { FormEvent, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { PageHeader } from "../../../../../components/dashboard/page-header";
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
};

/* ================= HELPERS ================= */

function formatDate(value?: string | null) {
  if (!value) return "Sin información";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Sin información";
  return date.toLocaleDateString("es-CL");
}

/* ================= PAGE ================= */

export default function CustomerDetailPage() {
  const params = useParams();
  const slug = params?.slug as string;
  const customerId = params?.id as string;

  const [customer, setCustomer] = useState<Customer | null>(null);
  const [pets, setPets] = useState<Pet[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  const [savingPet, setSavingPet] = useState(false);
  const [petError, setPetError] = useState("");
  const [petSuccess, setPetSuccess] = useState("");

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

        /* ===== CUSTOMER ===== */
        const resCustomers = await fetch(
          `${BACKEND_URL}/customers/${slug}`
        );
        const dataCustomers = await resCustomers.json();

        const found = dataCustomers.customers?.find(
          (c: any) => c.id === customerId
        );

        setCustomer(found || null);

        /* ===== PETS ===== */
        try {
          const resPets = await fetch(
            `${BACKEND_URL}/pets/${slug}?customer_id=${customerId}`
          );
          const dataPets = await resPets.json();
          setPets(dataPets.pets || []);
        } catch {
          setPets([]);
        }

        /* ===== APPOINTMENTS (HISTORIAL) ===== */
        try {
          const resAppointments = await fetch(
            `${BACKEND_URL}/appointments/customer-history/${slug}?customer_id=${customerId}`
          );
          const dataAppointments = await resAppointments.json();
          setAppointments(dataAppointments.appointments || []);
        } catch {
          setAppointments([]);
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

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Cliente"
        title={customer?.name || "Cliente"}
        description="Ficha completa del cliente y sus mascotas"
      />

      {/* ================= INFO CLIENTE ================= */}
      <Panel title="Información del cliente">
        {loading ? (
          <p>Cargando...</p>
        ) : !customer ? (
          <p>No encontrado</p>
        ) : (
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <p className="text-xs text-slate-500">Nombre</p>
              <p className="font-semibold">{customer.name}</p>
            </div>

            <div>
              <p className="text-xs text-slate-500">Email</p>
              <p>{customer.email || "Sin email"}</p>
            </div>

            <div>
              <p className="text-xs text-slate-500">Teléfono</p>
              <p>{customer.phone || "Sin teléfono"}</p>
            </div>

            <div>
              <p className="text-xs text-slate-500">Visitas</p>
              <p>{customer.total_visits}</p>
            </div>

            <div>
              <p className="text-xs text-slate-500">Última visita</p>
              <p>{formatDate(customer.last_visit_at)}</p>
            </div>
          </div>
        )}
      </Panel>

      {/* ================= MASCOTAS ================= */}
      <Panel title="Mascotas" description="Crea mascotas y construye la ficha veterinaria del cliente.">
        <form onSubmit={handleCreatePet} className="mb-6 rounded-2xl border border-slate-200 bg-white/60 p-4 backdrop-blur dark:border-slate-700 dark:bg-slate-900/40">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <div>
              <label className="mb-2 block text-xs text-slate-500">Nombre</label>
              <input
                type="text"
                value={petForm.name}
                onChange={(e) =>
                  setPetForm((prev) => ({ ...prev, name: e.target.value }))
                }
                className="w-full rounded-xl border border-slate-200 bg-white/80 px-3 py-2 text-sm backdrop-blur border-slate-300 dark:border-slate-600 dark:bg-slate-900"
                placeholder="Ej: Luna"
                required
              />
            </div>

            <div>
              <label className="mb-2 block text-xs text-slate-500">Tipo</label>
              <select
                value={petForm.species_base}
                onChange={(e) =>
                  setPetForm((prev) => ({
                    ...prev,
                    species_base: e.target.value as "perro" | "gato" | "otro",
                  }))
                }
                className="w-full rounded-xl border border-slate-200 bg-white/80 px-3 py-2 text-sm backdrop-blur border-slate-300 dark:border-slate-600 dark:bg-slate-900"
              >
                <option value="perro">Perro</option>
                <option value="gato">Gato</option>
                <option value="otro">Otro</option>
              </select>
            </div>

            {petForm.species_base === "otro" ? (
              <div>
                <label className="mb-2 block text-xs text-slate-500">Especificar tipo</label>
                <input
                  type="text"
                  value={petForm.species_custom}
                  onChange={(e) =>
                    setPetForm((prev) => ({
                      ...prev,
                      species_custom: e.target.value,
                    }))
                  }
                  className="w-full rounded-xl border border-slate-200 bg-white/80 px-3 py-2 text-sm backdrop-blur border-slate-300 dark:border-slate-600 dark:bg-slate-900"
                  placeholder="Ej: conejo"
                  required
                />
              </div>
            ) : null}

            <div>
              <label className="mb-2 block text-xs text-slate-500">Raza</label>
              <input
                type="text"
                value={petForm.breed}
                onChange={(e) =>
                  setPetForm((prev) => ({ ...prev, breed: e.target.value }))
                }
                className="w-full rounded-xl border border-slate-200 bg-white/80 px-3 py-2 text-sm backdrop-blur border-slate-300 dark:border-slate-600 dark:bg-slate-900"
                placeholder="Ej: Labrador"
              />
            </div>

            <div>
              <label className="mb-2 block text-xs text-slate-500">Sexo</label>
              <select
                value={petForm.sex}
                onChange={(e) =>
                  setPetForm((prev) => ({ ...prev, sex: e.target.value }))
                }
                className="w-full rounded-xl border border-slate-200 bg-white/80 px-3 py-2 text-sm backdrop-blur border-slate-300 dark:border-slate-600 dark:bg-slate-900"
              >
                <option value="">Seleccionar</option>
                <option value="macho">Macho</option>
                <option value="hembra">Hembra</option>
              </select>
            </div>

            <div>
              <label className="mb-2 block text-xs text-slate-500">Peso (kg)</label>
              <input
                type="number"
                step="0.1"
                min="0"
                value={petForm.weight_kg}
                onChange={(e) =>
                  setPetForm((prev) => ({ ...prev, weight_kg: e.target.value }))
                }
                className="w-full rounded-xl border border-slate-200 bg-white/80 px-3 py-2 text-sm backdrop-blur border-slate-300 dark:border-slate-600 dark:bg-slate-900"
                placeholder="Ej: 12.5"
              />
            </div>
          </div>

          <div className="mt-4 grid gap-4 md:grid-cols-[220px_1fr]">
            <label className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm dark:border-slate-700 dark:bg-slate-950">
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
              <label className="mb-2 block text-xs text-slate-500">Notas</label>
              <textarea
                value={petForm.notes}
                onChange={(e) =>
                  setPetForm((prev) => ({ ...prev, notes: e.target.value }))
                }
                className="min-h-[110px] w-full rounded-xl border border-slate-200 bg-white/80 px-3 py-2 text-sm backdrop-blur border-slate-300 dark:border-slate-600 dark:bg-slate-900"
                placeholder="Notas rápidas de la mascota"
              />
            </div>
          </div>

          {petError ? (
            <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-300">
              {petError}
            </div>
          ) : null}

          {petSuccess ? (
            <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300">
              {petSuccess}
            </div>
          ) : null}

          <div className="mt-4">
            <button
              type="submit"
              disabled={savingPet}
              className="rounded-xl px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
              style={{ background: "var(--text-main)" }}
            >
              {savingPet ? "Guardando..." : "Agregar mascota"}
            </button>
          </div>
        </form>

        {pets.length === 0 ? (
          <p className="text-sm text-slate-500">
            Este cliente no tiene mascotas aún.
          </p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {pets.map((pet) => (
              <div
                key={pet.id}
                className="rounded-xl border border-slate-200 bg-white/80 p-4 backdrop-blur dark:border-slate-700 dark:bg-slate-900"
              >
                <p className="font-semibold text-lg">{pet.name}</p>

                <p className="text-sm text-slate-500">
                  {pet.species_base === "otro"
                    ? pet.species_custom
                    : pet.species_base}
                </p>

                {pet.breed && (
                  <p className="text-xs text-slate-400">
                    {pet.breed}
                  </p>
                )}

                <div className="mt-2 text-xs text-slate-500">
                  {pet.sex && <span>Sexo: {pet.sex} · </span>}
                  {pet.weight_kg !== null && pet.weight_kg !== undefined && (
                    <span>{pet.weight_kg}kg · </span>
                  )}
                  <span>
                    {pet.is_sterilized ? "Esterilizado" : "No esterilizado"}
                  </span>
                </div>

                {pet.notes ? (
                  <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">
                    {pet.notes}
                  </p>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </Panel>

      {/* ================= HISTORIAL ================= */}
      <Panel title="Historial de visitas">
        {appointments.length === 0 ? (
          <p className="text-sm text-slate-500">
            Sin historial aún.
          </p>
        ) : (
          <div className="space-y-3">
            {appointments.slice(0, 10).map((a) => (
              <div
                key={a.id}
                className="rounded-xl border p-3 bg-white"
              >
                <p className="text-sm font-medium">
                  {a.service_name_snapshot || "Servicio"}
                </p>
                <p className="text-xs text-slate-500">
                  {formatDate(a.start_at)}
                </p>
              </div>
            ))}
          </div>
        )}
      </Panel>

      {/* ================= VACUNAS (READY) ================= */}
      <Panel title="Vacunas">
        <p className="text-sm text-slate-500">
          Próximamente: seguimiento de vacunas con alertas y recordatorios.
        </p>
      </Panel>

      {/* ================= NOTAS (READY) ================= */}
      <Panel title="Notas">
        <p className="text-sm text-slate-500">
          Próximamente: notas rápidas por mascota.
        </p>
      </Panel>
    </div>
  );
}