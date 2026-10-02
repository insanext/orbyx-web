"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

/** Pantalla amigable cuando no se pudo validar el acceso (Supabase lento o caído). */
export default function AccessCheckError() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [attempted, setAttempted] = useState(false);

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
        <h2 className="text-lg font-semibold">No pudimos cargar tu cuenta</h2>
        <p
          className="mt-1.5 max-w-md text-sm"
          style={{ color: "var(--text-muted)" }}
        >
          El servicio está tardando más de lo normal en responder. Tus datos
          están a salvo — intenta de nuevo en unos segundos.
        </p>
        {attempted && !pending && (
          <p className="mt-2 text-xs" style={{ color: "var(--text-muted)" }}>
            Seguimos sin respuesta. Espera un momento y reintenta.
          </p>
        )}
      </div>
      <button
        type="button"
        disabled={pending}
        onClick={() => {
          setAttempted(true);
          startTransition(() => router.refresh());
        }}
        className="rounded-md px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
        style={{ background: "var(--accent-solid, #4f46e5)" }}
      >
        {pending ? "Reintentando…" : "Reintentar"}
      </button>
    </div>
  );
}
