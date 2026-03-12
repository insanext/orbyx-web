"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";

export default function CancelPage() {
  const { id } = useParams();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const redirect = searchParams.get("redirect");

  const [status, setStatus] = useState<"confirm" | "loading" | "ok" | "error">("confirm");
  const [message, setMessage] = useState("¿Seguro que deseas cancelar tu reserva?");
const [reservation, setReservation] = useState<any>(null);

  const safeRedirect = useMemo(() => {
    if (!redirect) return "https://www.orbyx.cl";
    try {
      const url = new URL(redirect);
      return url.toString();
    } catch {
      return "https://www.orbyx.cl";
    }
  }, [redirect]);

useEffect(() => {

  async function loadReservation() {

    if (!id || !token) return;

    const res = await fetch(
      `https://orbyx-backend.onrender.com/appointments/${id}?token=${token}`
    );

    const data = await res.json();

    if (res.ok) {
      setReservation(data);
    }

  }

  loadReservation();

}, [id, token]);

  async function cancelReservation() {
    try {
      if (!id || !token) {
        setStatus("error");
        setMessage("Link de cancelación inválido.");
        return;
      }

      setStatus("loading");
      setMessage("Estamos cancelando tu reserva...");

      const res = await fetch(
        `https://orbyx-backend.onrender.com/appointments/${id}?token=${token}`,
        {
          method: "POST",
        }
      );

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setStatus("error");
        setMessage(data.error || "No se pudo cancelar la reserva.");
        return;
      }

      setStatus("ok");
      setMessage("Tu reserva fue cancelada correctamente.");
    } catch {
      setStatus("error");
      setMessage("Ocurrió un error al cancelar la reserva.");
    }
  }

  return (
    <main style={styles.page}>
      <div style={styles.backgroundGlowTop} />
      <div style={styles.backgroundGlowBottom} />

      <section style={styles.card}>
        <div style={styles.badge}>
          {status === "confirm" && "Cancelación de reserva"}
          {status === "loading" && "Procesando"}
          {status === "ok" && "Reserva cancelada"}
          {status === "error" && "No se pudo cancelar"}
        </div>

        <h1 style={styles.title}>
          {status === "confirm" && "Cancelar reserva"}
          {status === "loading" && "Cancelando tu reserva..."}
          {status === "ok" && "Reserva cancelada"}
          {status === "error" && "Hubo un problema"}
        </h1>

{reservation && (
  <div style={{marginTop:20, marginBottom:20}}>
    <p><b>Servicio:</b> {reservation.service}</p>
    <p><b>Fecha:</b> {new Date(reservation.start_at).toLocaleString()}</p>
    {reservation.location && (
      <p><b>Dirección:</b> {reservation.location}</p>
    )}
  </div>
)}

        <p style={styles.description}>{message}</p>

        {status === "confirm" && (
          <div style={styles.actions}>
            <button onClick={cancelReservation} style={styles.primaryButton}>
              Cancelar reserva
            </button>

            <Link href={safeRedirect} style={styles.secondaryButton}>
              Volver a reservas
            </Link>
          </div>
        )}

        {status === "loading" && (
          <div style={styles.loadingWrap}>
            <div style={styles.spinner} />
          </div>
        )}

        {status === "ok" && (
          <div style={styles.actions}>
            <a href={safeRedirect} style={styles.primaryButton}>
              Reservar otra hora
            </a>
          </div>
        )}

        {status === "error" && (
          <div style={styles.actions}>
            <a href={safeRedirect} style={styles.secondaryButton}>
              Ir a reservas
            </a>
          </div>
        )}
      </section>
    </main>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "24px",
    background:
      "linear-gradient(180deg, #f8fafc 0%, #eef2ff 50%, #f8fafc 100%)",
    position: "relative",
    overflow: "hidden",
    fontFamily:
      'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },
  backgroundGlowTop: {
    position: "absolute",
    top: "-120px",
    right: "-120px",
    width: "280px",
    height: "280px",
    borderRadius: "999px",
    background: "rgba(99, 102, 241, 0.14)",
    filter: "blur(40px)",
  },
  backgroundGlowBottom: {
    position: "absolute",
    bottom: "-120px",
    left: "-120px",
    width: "280px",
    height: "280px",
    borderRadius: "999px",
    background: "rgba(59, 130, 246, 0.12)",
    filter: "blur(40px)",
  },
  card: {
    width: "100%",
    maxWidth: "560px",
    background: "rgba(255,255,255,0.92)",
    backdropFilter: "blur(10px)",
    border: "1px solid rgba(226,232,240,0.9)",
    borderRadius: "24px",
    padding: "32px",
    boxShadow: "0 20px 60px rgba(15, 23, 42, 0.10)",
    position: "relative",
    zIndex: 1,
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
    fontSize: "32px",
    lineHeight: 1.1,
    fontWeight: 700,
    color: "#0f172a",
  },
  description: {
    marginTop: "14px",
    marginBottom: "28px",
    fontSize: "16px",
    lineHeight: 1.6,
    color: "#475569",
  },
  actions: {
    display: "flex",
    flexWrap: "wrap",
    gap: "12px",
  },
  primaryButton: {
    appearance: "none",
    border: "none",
    borderRadius: "14px",
    padding: "14px 20px",
    background: "linear-gradient(135deg, #4f46e5, #2563eb)",
    color: "#ffffff",
    fontSize: "15px",
    fontWeight: 600,
    cursor: "pointer",
    textDecoration: "none",
    boxShadow: "0 10px 24px rgba(37, 99, 235, 0.25)",
  },
  secondaryButton: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "14px",
    padding: "14px 20px",
    background: "#ffffff",
    color: "#334155",
    fontSize: "15px",
    fontWeight: 600,
    cursor: "pointer",
    textDecoration: "none",
    border: "1px solid #cbd5e1",
  },
  loadingWrap: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
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