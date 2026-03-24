"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { PageHeader } from "../../../components/dashboard/page-header";
import { Panel } from "../../../components/dashboard/panel";
import { StatCard } from "../../../components/dashboard/stat-card";

type BusinessResponse = {
  business: {
    id: string;
    name: string;
    slug: string;
    plan_slug?: string;
  };
};

const BACKEND_URL = "https://orbyx-backend.onrender.com";

export default function DashboardHomePage() {
  const params = useParams();

  const slug =
    ((params as any)?.slug as string) ||
    ((params as any)?.Slug as string);

  const [businessName, setBusinessName] = useState("");
  const [plan, setPlan] = useState("starter");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadBusiness() {
      try {
        setLoading(true);
        setError("");

        const res = await fetch(
          `${BACKEND_URL}/public/business/${slug}`
        );

        const data: BusinessResponse | { error?: string } =
          await res.json();

        if (!res.ok) {
          throw new Error(
            "error" in data && data.error
              ? data.error
              : "No se pudo cargar el negocio"
          );
        }

        if (!("business" in data)) {
          throw new Error("Respuesta inválida del backend");
        }

        setBusinessName(data.business.name || "");
        setPlan(data.business.plan_slug || "starter");
      } catch (err: any) {
        setError(err?.message || "Error cargando dashboard");
      } finally {
        setLoading(false);
      }
    }

    if (slug) {
      loadBusiness();
    }
  }, [slug]);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Resumen"
        title={loading ? "Cargando..." : businessName || "Dashboard"}
        description="Vista general de tu negocio y estado actual."
      />

      {error ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      ) : null}

      {/* Stats principales */}
      <section className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <StatCard
          label="Plan"
          value={loading ? "..." : plan.toUpperCase()}
        />
        <StatCard
          label="Estado"
          value={loading ? "..." : "Activo"}
        />
        <StatCard
          label="Módulos"
          value={loading ? "..." : "Operativos"}
        />
        <StatCard
          label="Sistema"
          value={loading ? "..." : "OK"}
        />
      </section>

      {/* Panel principal */}
      <Panel
        title="Bienvenido a Orbyx"
        description="Tu sistema de reservas ya está funcionando."
      >
        <div className="space-y-3 text-sm text-slate-600">
          <p>
            Desde aquí puedes gestionar tu agenda, staff, servicios y sucursales.
          </p>
          <p>
            Usa el menú lateral para navegar entre los distintos módulos del sistema.
          </p>
        </div>
      </Panel>

      {/* Próximos pasos */}
      <Panel
        title="Siguientes pasos"
        description="Para sacarle el máximo provecho a Orbyx."
      >
        <ul className="space-y-2 text-sm text-slate-600">
          <li>• Configura tu staff por sucursal</li>
          <li>• Define servicios por sucursal</li>
          <li>• Revisa tu agenda y estados de citas</li>
          <li>• Conecta automatizaciones (WhatsApp / IA)</li>
        </ul>
      </Panel>
    </div>
  );
}