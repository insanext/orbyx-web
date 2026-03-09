"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

export default function CancelPage() {
  const { id } = useParams();
  const [status, setStatus] = useState("cancelando");

  useEffect(() => {
    async function cancel() {
      try {
        const res = await fetch(
          `https://orbyx-backend.onrender.com/appointments/${id}`,
          { method: "POST" }
        );

        if (!res.ok) {
          setStatus("error");
          return;
        }

        setStatus("ok");
      } catch {
        setStatus("error");
      }
    }

    cancel();
  }, [id]);

  return (
    <div style={{ padding: 40 }}>
      {status === "cancelando" && <h2>Cancelando reserva...</h2>}
      {status === "ok" && <h2>Reserva cancelada correctamente ✅</h2>}
      {status === "error" && <h2>Error al cancelar la reserva</h2>}
    </div>
  );
}