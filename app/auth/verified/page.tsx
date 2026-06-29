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

export default function VerifiedPage() {
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
        <div style={{ fontSize: 48, marginBottom: 16 }}>✅</div>
        <h1
          style={{
            fontSize: 22,
            fontWeight: 700,
            color: "#f1f5f9",
            margin: "0 0 12px",
          }}
        >
          Cuenta verificada
        </h1>
        <p
          style={{
            fontSize: 15,
            color: "#94a3b8",
            lineHeight: 1.6,
            margin: "0 0 28px",
          }}
        >
          Tu email ha sido confirmado correctamente.
          <br />
          Ya puedes iniciar sesión y configurar tu negocio.
        </p>
        <Link
          href="/login"
          style={{
            display: "inline-block",
            padding: "12px 32px",
            background: `linear-gradient(135deg, ${NEON}, #06b6d4)`,
            color: "#0f172a",
            fontWeight: 700,
            fontSize: 15,
            borderRadius: 10,
            textDecoration: "none",
            boxShadow: `0 0 20px rgba(0, 229, 255, 0.3)`,
          }}
        >
          Iniciar sesión
        </Link>
      </div>
    </div>
  );
}
