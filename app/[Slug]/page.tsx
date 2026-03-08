"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

export default function Page() {
  const params = useParams();
  const slug = (params as any)?.Slug as string;

  const [business, setBusiness] = useState<any>(null);
  const [services, setServices] = useState<any[]>([]);

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
      <h1>{business?.name}</h1>

      <h2>Servicios</h2>

      {services.map((service) => (
        <div key={service.id} style={{ marginBottom: 10 }}>
          <strong>{service.name}</strong>
          <br />
          Duración: {service.duration_minutes} min
          <br />
          Precio: ${service.price}
        </div>
      ))}
    </main>
  );
}