"use client";

import { useEffect } from "react";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Error en el dashboard:", error);
  }, [error]);

  return (
    <div
      className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-6 py-16 text-center"
      style={{ color: "var(--text-main)" }}
    >
      <div
        className="flex h-14 w-14 items-center justify-center rounded-full text-2xl"
        style={{
          background: "rgba(239,68,68,0.12)",
          border: "1px solid rgba(239,68,68,0.25)",
        }}
        aria-hidden="true"
      >
        ⚠️
      </div>

      <div>
        <h2 className="text-lg font-semibold">Ocurrió un error inesperado</h2>
        <p
          className="mt-1.5 max-w-md text-sm"
          style={{ color: "var(--text-muted)" }}
        >
          Algo falló al cargar esta sección. Puedes intentar de nuevo — si el
          problema sigue, vuelve a intentarlo más tarde o cambia a otra
          sección del menú.
        </p>
      </div>

      <button
        type="button"
        onClick={() => reset()}
        className="mt-2 inline-flex h-10 items-center justify-center rounded-xl px-5 text-sm font-medium text-white transition"
        style={{
          background:
            "linear-gradient(135deg, rgb(37 99 235), rgb(14 165 233))",
        }}
      >
        Reintentar
      </button>
    </div>
  );
}
