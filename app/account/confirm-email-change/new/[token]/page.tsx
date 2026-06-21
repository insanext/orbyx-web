"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";

const BACKEND_URL = "https://orbyx-backend.onrender.com";

export default function ConfirmNewEmailPage() {
  const params = useParams();
  const token = params?.token as string;
  const router = useRouter();

  const [step, setStep] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!token) return;
    fetch(`${BACKEND_URL}/account/email-change/confirm-new/${token}`)
      .then(async res => {
        const d = await res.json();
        if (!res.ok) throw new Error(d.error ?? "Error al confirmar.");
        setMessage(d.message ?? "Correo actualizado.");
        setStep("success");
        setTimeout(() => router.push("/"), 4000);
      })
      .catch(e => {
        setMessage(e.message);
        setStep("error");
      });
  }, [token]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: "#070d1a" }}>
      <div className="w-full max-w-md">

        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-white">Orbyx</h1>
          <p className="text-sm mt-1" style={{ color: "rgba(147,197,253,0.5)" }}>Cambio de correo electrónico</p>
        </div>

        {step === "loading" && (
          <div className="rounded-2xl border border-blue-900/25 p-8 text-center" style={{ background: "#0f1729" }}>
            <p className="text-sm" style={{ color: "rgba(147,197,253,0.5)" }}>Aplicando cambio de correo...</p>
          </div>
        )}

        {step === "success" && (
          <div className="rounded-2xl border border-green-500/30 p-8 text-center" style={{ background: "#0f1729" }}>
            <p className="text-4xl mb-4">✓</p>
            <h2 className="text-white font-semibold text-lg mb-2">¡Correo actualizado!</h2>
            <p className="text-sm mb-4" style={{ color: "rgba(147,197,253,0.6)" }}>{message}</p>
            <p className="text-xs" style={{ color: "rgba(147,197,253,0.4)" }}>
              Ya puedes iniciar sesión con tu nuevo correo. Redirigiendo...
            </p>
          </div>
        )}

        {step === "error" && (
          <div className="rounded-2xl border border-red-500/20 p-8 text-center" style={{ background: "#0f1729" }}>
            <p className="text-4xl mb-4">✗</p>
            <h2 className="text-white font-semibold text-lg mb-2">No se pudo confirmar</h2>
            <p className="text-sm text-red-400/80">{message}</p>
            <p className="text-xs mt-4" style={{ color: "rgba(147,197,253,0.4)" }}>
              Si el enlace expiró, solicita un nuevo cambio de correo desde tu dashboard.
            </p>
          </div>
        )}

        <div className="text-center mt-6">
          <a href="https://www.orbyx.cl" className="text-xs" style={{ color: "rgba(147,197,253,0.3)" }}>
            Orbyx · Sistema de reservas inteligentes
          </a>
        </div>
      </div>
    </div>
  );
}
