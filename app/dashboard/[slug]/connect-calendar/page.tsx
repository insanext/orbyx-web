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

        {/* 🧠 GUÍA VISUAL GOOGLE WARNING */}
<div
  className="mt-6 rounded-2xl border p-5"
  style={{
    borderColor: "#e2e8f0",
    background: "#f8fafc",
  }}
>
  <p className="text-sm font-semibold text-slate-800">
    Si Google muestra una advertencia, es normal
  </p>

  <p className="mt-1 text-sm text-slate-600">
    Nuestra app aún está en proceso de verificación por Google.
  </p>

  <div className="mt-4 space-y-4">

    {/* PASO 1 */}
    <div className="flex gap-3">
      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">
        1
      </div>
      <div>
        <p className="text-sm font-medium text-slate-800">
          Haz clic en "Configuración avanzada"
        </p>
        <p className="text-xs text-slate-500">
          Está debajo del mensaje principal de Google
        </p>
      </div>
    </div>

    {/* PASO 2 */}
    <div className="flex gap-3">
      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">
        2
      </div>
      <div>
        <p className="text-sm font-medium text-slate-800">
          Luego haz clic en "Ir a orbyx-backend.onrender.com"
        </p>
        <p className="text-xs text-slate-500">
          Está al final de la página
        </p>
      </div>
    </div>

    {/* PASO 3 */}
    <div className="flex gap-3">
      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">
        3
      </div>
      <div>
        <p className="text-sm font-medium text-slate-800">
          Autoriza el acceso
        </p>
        <p className="text-xs text-slate-500">
          Serás redirigido automáticamente a Orbyx
        </p>
      </div>
    </div>

  </div>

  {/* INFO */}
  <div
    className="mt-5 rounded-xl p-3 text-sm"
    style={{
      background: "#eef2ff",
      color: "#3730a3",
    }}
  >
    🔒 Tranquilo, es seguro.  
    Tus datos están protegidos y solo se usará tu calendario para crear reservas.
  </div>
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