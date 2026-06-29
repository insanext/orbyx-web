"use client";

import Link from "next/link";

const NEON = "#00e5ff";

const CARD: React.CSSProperties = {
  width: "100%",
  maxWidth: 480,
  background: "rgba(15, 23, 42, 0.85)",
  backdropFilter: "blur(20px)",
  border: "1px solid rgba(0, 229, 255, 0.4)",
  borderRadius: 20,
  boxShadow:
    "0 0 24px rgba(0, 229, 255, 0.25), 0 0 60px rgba(6, 182, 212, 0.15), 0 0 2px rgba(0, 229, 255, 0.6), 0 32px 72px rgba(0,0,0,0.55)",
  padding: "44px 40px",
  fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif",
  textAlign: "center" as const,
};

export default function CheckEmailPage() {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, #0f172a 0%, #020617 100%)",
        padding: 16,
      }}
    >
      <div style={CARD}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>✉️</div>
        <h1
          style={{
            fontSize: 22,
            fontWeight: 700,
            color: "#f1f5f9",
            margin: "0 0 12px",
          }}
        >
          Revisa tu correo
        </h1>
        <p
          style={{
            fontSize: 15,
            color: "#94a3b8",
            lineHeight: 1.6,
            margin: "0 0 24px",
          }}
        >
          Te enviamos un enlace de confirmación al email que ingresaste.
          <br />
          Haz clic en el enlace para activar tu cuenta.
        </p>
        <div
          style={{
            background: "rgba(0, 229, 255, 0.08)",
            border: "1px solid rgba(0, 229, 255, 0.2)",
            borderRadius: 12,
            padding: "14px 18px",
            fontSize: 13,
            color: "#cbd5e1",
            lineHeight: 1.5,
            marginBottom: 24,
          }}
        >
          Si no ves el correo, revisa tu carpeta de spam o correo no deseado.
        </div>
        <Link
          href="/login"
          style={{
            fontSize: 14,
            color: NEON,
            textDecoration: "none",
          }}
        >
          Volver al inicio de sesión
        </Link>
      </div>
    </div>
  );
}
