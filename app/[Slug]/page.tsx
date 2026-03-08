"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

export default function Page() {
  const params = useParams();
  const slug = params?.slug as string;

  const [services, setServices] = useState<any[]>([]);
  const [business, setBusiness] = useState<any>(null);

  useEffect(() => {
    if (!slug) return;

    fetch(`/api/public-services/${slug}`)
      .then((res) => res.json())
      .then((data) => {
        setBusiness(data.business);
        setServices(data.services);
      });
  }, [slug]);

  return (
    <main style={{ padding: 40 }}>
      <h1>{business ? business.name : "Cargando negocio..."}</h1>

      <h2>Servicios</h2>

      {services.length === 0 ? (
        <p>No hay servicios disponibles</p>
      ) : (
        services.map((service) => (
          <div key={service.id} style={{ marginBottom: 10 }}>
            <strong>{service.name}</strong> – {service.duration_minutes} min – $
            {service.price}
          </div>
        ))
      )}
    </main>
  );
}