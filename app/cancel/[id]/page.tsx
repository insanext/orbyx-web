"use client";

import { useState } from "react";
import { useParams, useSearchParams } from "next/navigation";

export default function CancelPage() {
  const { id } = useParams();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [status, setStatus] = useState<"confirm" | "loading" | "ok" | "error">("confirm");
  const [message, setMessage] = useState("¿Seguro que deseas cancelar tu reserva?");

  async function cancelReservation() {
    try {
      if (!id || !token) {
        setStatus("error");
        setMessage("Link de cancelación inválido.");
        return;
      }

      setStatus("loading");
      setMessage("Cancelando reserva...");

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
      setMessage("Reserva cancelada correctamente ✅");
    } catch {
      setStatus("error");
      setMessage("Error al cancelar la reserva.");
    }
  }

  return (
    <div style={{ padding: 40, fontFamily: "Arial, sans-serif", maxWidth: 520 }}>
      <h2>
        {status === "confirm" && "Cancelar reserva"}
        {status === "loading" && "Cancelando reserva..."}
        {status === "ok" && "Reserva cancelada"}
        {status === "error" && "No se pudo cancelar"}
      </h2>

      <p>{message}</p>

      {status === "confirm" && (
        <button
          onClick={cancelReservation}
          style={{
            marginTop: 16,
            padding: "12px 18px",
            borderRadius: 10,
            border: "none",
            cursor: "pointer",
          }}
        >
          Cancelar reserva
        </button>
      )}
    </div>
  );
}