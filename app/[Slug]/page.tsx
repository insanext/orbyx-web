type Service = {
  id: string;
  name: string;
  duration_minutes: number;
  buffer_before_minutes: number;
  buffer_after_minutes: number;
  price: number;
  active: boolean;
};

type BusinessResponse = {
  business: {
    name: string;
    slug: string;
  };
  services: Service[];
};

async function getBusinessData(slug: string): Promise<BusinessResponse | null> {
  try {
    const res = await fetch(
      `https://orbyx-backend.onrender.com/public/services/${slug}`,
      { cache: "no-store" }
    );

    if (!res.ok) return null;

    return res.json();
  } catch {
    return null;
  }
}

export default async function PublicBookingPage({
  params,
}: {
  params: { slug: string };
}) {
  const data = await getBusinessData(params.slug);

  if (!data) {
    return (
      <main style={{ padding: "40px", fontFamily: "Arial, sans-serif" }}>
        <h1>Negocio no encontrado</h1>
        <p>Revisa el link e inténtalo nuevamente.</p>
      </main>
    );
  }

  return (
    <main style={{ padding: "40px", fontFamily: "Arial, sans-serif" }}>
      <h1>Reserva en {data.business.name}</h1>
      <p>Slug: {data.business.slug}</p>

      <h2 style={{ marginTop: "30px" }}>Servicios disponibles</h2>

      {data.services.length === 0 ? (
        <p>No hay servicios activos.</p>
      ) : (
        <ul>
          {data.services.map((service) => (
            <li key={service.id} style={{ marginBottom: "12px" }}>
              <strong>{service.name}</strong> — {service.duration_minutes} min — $
              {service.price}
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}