"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

const BACKEND_URL = "https://orbyx-backend.onrender.com";

// Baja de correos de campaña con un clic, sin login (Ley 19.496 art. 28 B,
// auditoría 2026-09-29 sesión 2, I13). El enlace llega en el pie de cada
// correo de campaña; abrirlo ya da de baja (POST idempotente) — no se pide
// ningún paso extra. Mismo estilo que la página de cancelación de reservas
// (app/cancel/[id]/page.tsx).
export default function UnsubscribePage() {
  const params = useParams();
  const token = String((params as { token?: string })?.token || "");

  const [status, setStatus] = useState<"loading" | "ok" | "error">("loading");
  const [businessName, setBusinessName] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    // La ruta dinámica siempre trae token; sin él no hay nada que hacer.
    if (!token) return;

    let cancelled = false;

    async function unsubscribe() {
      try {
        const res = await fetch(
          `${BACKEND_URL}/public/marketing/unsubscribe/${encodeURIComponent(token)}`,
          { method: "POST" }
        );
        const data = await res.json().catch(() => null);
        if (cancelled) return;

        if (!res.ok) {
          setStatus("error");
          setErrorMessage(
            res.status === 404
              ? "El enlace no es válido o ya no existe."
              : data?.error || "No pudimos procesar tu solicitud. Intenta de nuevo en unos minutos."
          );
          return;
        }

        setBusinessName(data?.business_name || null);
        setStatus("ok");
      } catch {
        if (cancelled) return;
        setStatus("error");
        setErrorMessage("No pudimos procesar tu solicitud. Revisa tu conexión e intenta de nuevo.");
      }
    }

    unsubscribe();

    return () => {
      cancelled = true;
    };
  }, [token]);

  return (
    <main style={styles.page}>
      <section style={styles.card}>
        <div style={styles.badge}>Correos de campaña</div>

        {status === "loading" ? (
          <>
            <h1 style={styles.title}>Procesando tu baja…</h1>
            <div style={styles.spinnerWrap}>
              <div style={styles.spinner} />
            </div>
          </>
        ) : null}

        {status === "ok" ? (
          <>
            <h1 style={styles.title}>Listo, te diste de baja</h1>
            <p style={styles.description}>
              No recibirás más correos promocionales
              {businessName ? ` de ${businessName}` : ""}. Seguirás recibiendo los
              correos de tus reservas (confirmaciones y recordatorios).
            </p>
          </>
        ) : null}

        {status === "error" ? (
          <>
            <h1 style={styles.title}>No pudimos darte de baja</h1>
            <p style={styles.description}>{errorMessage}</p>
          </>
        ) : null}
      </section>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </main>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "24px 16px",
    background: "linear-gradient(180deg, #f8fafc 0%, #eef2ff 50%, #f8fafc 100%)",
    fontFamily:
      'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },
  card: {
    width: "100%",
    maxWidth: "560px",
    background: "rgba(255,255,255,0.92)",
    border: "1px solid rgba(226,232,240,0.9)",
    borderRadius: "24px",
    padding: "32px",
    boxShadow: "0 20px 60px rgba(15, 23, 42, 0.10)",
  },
  badge: {
    display: "inline-flex",
    padding: "8px 12px",
    borderRadius: "999px",
    background: "#eef2ff",
    color: "#4338ca",
    fontSize: "13px",
    fontWeight: 600,
    marginBottom: "16px",
  },
  title: {
    margin: 0,
    fontSize: "28px",
    lineHeight: 1.15,
    fontWeight: 700,
    color: "#0f172a",
  },
  description: {
    marginTop: "14px",
    marginBottom: 0,
    fontSize: "16px",
    lineHeight: 1.6,
    color: "#475569",
  },
  spinnerWrap: {
    marginTop: "20px",
    display: "flex",
  },
  spinner: {
    width: "28px",
    height: "28px",
    borderRadius: "999px",
    border: "3px solid #cbd5e1",
    borderTopColor: "#4f46e5",
    animation: "spin 1s linear infinite",
  },
};
