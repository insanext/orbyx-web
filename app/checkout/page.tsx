export default function Checkout({
  searchParams,
}: {
  searchParams: { plan?: string };
}) {
  const plan = (searchParams?.plan || "starter").toLowerCase();

  const planName =
    plan === "enterprise" ? "Enterprise" : plan === "pro" ? "Pro" : "Starter";

  return (
    <main style={{ fontFamily: "Arial", padding: "60px", maxWidth: "900px", margin: "auto" }}>
      <h1 style={{ fontSize: "40px", marginBottom: 10 }}>Checkout</h1>
      <p style={{ opacity: 0.8, marginBottom: 30 }}>
        Plan seleccionado: <b>{planName}</b>
      </p>

      <div style={{ border: "1px solid #ddd", padding: 24, marginBottom: 20 }}>
        <p>
          Aquí irá el pago (Stripe o MercadoPago).
        </p>
        <p style={{ fontSize: 14, opacity: 0.75 }}>
          Por ahora es una pantalla de prueba para el flujo.
        </p>
      </div>

      <a href={`/signup?plan=${plan}`}>
        <button style={{ padding: "12px 18px", cursor: "pointer" }}>
          Continuar a crear cuenta
        </button>
      </a>

      <p style={{ marginTop: 20 }}>
        <a href="/planes">← Volver a planes</a>
      </p>
    </main>
  );
}