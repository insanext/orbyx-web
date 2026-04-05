"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { PageHeader } from "../../../../../components/dashboard/page-header";
import { Panel } from "../../../../../components/dashboard/panel";

const BACKEND_URL = "https://orbyx-backend.onrender.com";

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
};

export default function CustomerDetailPage() {
  const params = useParams();
  const slug = params?.slug as string;
  const customerId = params?.id as string;

  const [customer, setCustomer] = useState<Customer | null>(null);
  const [pets, setPets] = useState<Pet[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);

        // 🔹 CUSTOMER
        const resCustomer = await fetch(
          `${BACKEND_URL}/customers/${slug}`
        );
        const dataCustomer = await resCustomer.json();

        const found = dataCustomer.customers?.find(
          (c: any) => c.id === customerId
        );

        setCustomer(found || null);

        // 🔹 PETS
        const resPets = await fetch(
          `${BACKEND_URL}/pets/${slug}?customer_id=${customerId}`
        );
        const dataPets = await resPets.json();

        setPets(dataPets.pets || []);
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
        description="Ficha del cliente y sus mascotas"
      />

      {/* INFO CLIENTE */}
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
              <p>
                {customer.last_visit_at
                  ? new Date(customer.last_visit_at).toLocaleDateString()
                  : "Sin visitas"}
              </p>
            </div>
          </div>
        )}
      </Panel>

      {/* MASCOTAS */}
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

                <p className="text-sm text-slate-500 mt-1">
                  {pet.species_base === "otro"
                    ? pet.species_custom
                    : pet.species_base}
                </p>

                {pet.breed && (
                  <p className="text-xs text-slate-400 mt-1">
                    {pet.breed}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </Panel>

      {/* PLACEHOLDER HISTORIAL */}
      <Panel title="Historial">
        <p className="text-sm text-slate-500">
          Próximamente: historial de visitas por mascota.
        </p>
      </Panel>

      {/* PLACEHOLDER VACUNAS */}
      <Panel title="Vacunas">
        <p className="text-sm text-slate-500">
          Próximamente: seguimiento de vacunas.
        </p>
      </Panel>

      {/* PLACEHOLDER NOTAS */}
      <Panel title="Notas">
        <p className="text-sm text-slate-500">
          Próximamente: notas por mascota.
        </p>
      </Panel>
    </div>
  );
}