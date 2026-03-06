"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function OnboardingInner() {
  const searchParams = useSearchParams();
  const tenantId = searchParams.get("tenant_id");
  const calendarId = searchParams.get("calendar_id");

  const googleAuthUrl = calendarId
    ? `https://orbyx-backend.onrender.com/auth?calendar_id=${calendarId}`
    : null;

  return (
    <div style={{ maxWidth: 700, margin: "40px auto", padding: 16 }}>
      <h1 style={{ fontSize: 30, fontWeight: 700 }}>Onboarding Orbyx</h1>

      <p style={{ marginTop: 12 }}>Tu cuenta fue creada correctamente.</p>
      <p>
        Tenant ID: <b>{tenantId || "no recibido"}</b>
      </p>
      <p>
        Calendar ID: <b>{calendarId || "no recibido"}</b>
      </p>

      <div
        style={{
          marginTop: 24,
          padding: 16,
          border: "1px solid #ddd",
          borderRadius: 12,
        }}
      >
        <h2 style={{ fontSize: 22, fontWeight: 600 }}>Siguiente paso</h2>
        <p style={{ marginTop: 8 }}>
          Conecta Google Calendar para empezar a agendar automáticamente.
        </p>

        {googleAuthUrl ? (
          <a
            href={googleAuthUrl}
            style={{
              display: "inline-block",
              marginTop: 16,
              padding: "12px 18px",
              borderRadius: 10,
              textDecoration: "none",
              border: "1px solid #ccc",
            }}
          >
            Conectar Google Calendar
          </a>
        ) : (
          <p style={{ marginTop: 16, color: "red" }}>
            No se recibió calendar_id.
          </p>
        )}
      </div>
    </div>
  );
}

export default function OnboardingPage() {
  return (
    <Suspense fallback={<div style={{ padding: 16 }}>Cargando onboarding...</div>}>
      <OnboardingInner />
    </Suspense>
  );
}