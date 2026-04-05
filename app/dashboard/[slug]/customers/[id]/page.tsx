"use client";

import { useEffect, useState } from "react";
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
  species_custom?: string;
  breed?: string;
  sex?: string;
  weight_kg?: number;
  is_sterilized?: boolean;
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
            `${BACKEND_URL}/appointments/${slug}?customer_id=${customerId}`
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
      <Panel title="Mascotas">
        {pets.length === 0 ? (
          <p className="text-sm text-slate-500">
            Este cliente no tiene mascotas aún.
          </p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {pets.map((pet) => (
              <div
                key={pet.id}
                className="rounded-xl border p-4 bg-white"
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
                  {pet.weight_kg && <span>{pet.weight_kg}kg · </span>}
                  <span>
                    {pet.is_sterilized ? "Esterilizado" : "No esterilizado"}
                  </span>
                </div>
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