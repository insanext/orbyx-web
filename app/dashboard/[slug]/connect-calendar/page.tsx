"use client";

import { useSearchParams, useParams } from "next/navigation";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

export default function ConnectCalendarPage() {
  const params = useParams();
  const searchParams = useSearchParams();

  const slug = params?.slug as string;
  const calendarId = searchParams.get("calendar_id");

  function handleConnect() {
    if (!calendarId) return;

    window.location.href = `${BACKEND_URL}/auth?calendar_id=${calendarId}`;
  }

  return (
    <div
      className="flex min-h-screen items-center justify-center px-4"
      style={{ background: "var(--bg-main)" }}
    >
      <div
        className="w-full max-w-xl rounded-2xl border p-8"
        style={{
          borderColor: "var(--border-color)",
          background: "var(--bg-card)",
        }}
      >
        <h1
          className="text-xl font-semibold text-center"
          style={{ color: "var(--text-main)" }}
        >
          Conectar Google Calendar
        </h1>

        <p
          className="mt-3 text-sm text-center"
          style={{ color: "var(--text-muted)" }}
        >
          Orbyx necesita acceso a tu Google Calendar para crear automáticamente
          las reservas cuando un cliente agenda una cita.
        </p>

        {/* 🔴 WARNING */}
        <div
          className="mt-6 rounded-xl border p-4"
          style={{
            borderColor: "#fecaca",
            background: "#fff1f2",
          }}
        >
          <p className="text-sm font-semibold text-red-700">
            Importante antes de continuar
          </p>

          <p className="mt-2 text-sm text-red-800">
            Google puede mostrar una advertencia indicando que la app aún no
            está verificada. Esto es normal mientras Orbyx está en fase de
            pruebas.
          </p>

          <p className="mt-2 text-sm text-red-800">
            Cuando aparezca, presiona:
          </p>

          <ul className="mt-2 list-disc pl-5 text-sm text-red-800">
            <li>Configuración avanzada</li>
            <li>Ir a orbyx-backend.onrender.com</li>
          </ul>
        </div>

        {/* 🧠 PASOS */}
        <div className="mt-6 space-y-3 text-sm" style={{ color: "var(--text-muted)" }}>
          <p>1. Serás redirigido a Google</p>
          <p>2. Autoriza el acceso a tu calendario</p>
          <p>3. Volverás automáticamente a Orbyx</p>
        </div>

        {/* 🚀 BOTÓN */}
        <button
          onClick={handleConnect}
          disabled={!calendarId}
          className="mt-6 w-full rounded-xl px-4 py-3 text-sm font-semibold text-white transition disabled:opacity-50"
          style={{
            background: "#111827",
          }}
        >
          Continuar a Google
        </button>

        <p className="mt-4 text-center text-xs" style={{ color: "var(--text-muted)" }}>
          {slug}
        </p>
      </div>
    </div>
  );
}