"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";

export default function CancelPage() {
  const { id } = useParams();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [status, setStatus] = useState<"loading" | "ok" | "error">("loading");
  const [message, setMessage] = useState("Cancelando reserva...");

  useEffect(() => {
    async function cancelReservation() {
      try {
        if (!id || !token) {
          setStatus("error");
          setMessage("Link de cancelación inválido.");
          return;
        }

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

    cancelReservation();
  }, [id, token]);

  return (
    <div style={{ padding: 40, fontFamily: "Arial, sans-serif" }}>
      <h2>
        {status === "loading" && "Cancelando reserva..."}
        {status === "ok" && "Reserva cancelada"}
        {status === "error" && "No se pudo cancelar"}
      </h2>

      <p>{message}</p>
    </div>
  );
}