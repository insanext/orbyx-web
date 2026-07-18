"use client";

import { Suspense, useState, useEffect, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Turnstile } from "@marsidev/react-turnstile";
import { PasswordVisibilityToggle } from "@/components/ui/password-visibility-toggle";

const BACKEND_URL = "https://orbyx-backend.onrender.com";

function CompletarRegistroInner() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";
  const router = useRouter();

  const [step, setStep] = useState<"loading" | "form" | "already_done" | "pending" | "error" | "success">(
    "loading"
  );
  const [resumeData, setResumeData] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState("");

  const [password, setPassword] = useState("");
  const [confirmPwd, setConfirmPwd] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitMsg, setSubmitMsg] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPwd, setShowConfirmPwd] = useState(false);
  const [captchaToken, setCaptchaToken] = useState("");
  const turnstileRef = useRef<any>(null);

  useEffect(() => {
    if (!token) {
      setErrorMsg("Falta el token de acceso en el enlace.");
      setStep("error");
      return;
    }
    fetch(`${BACKEND_URL}/signup/resume?token=${encodeURIComponent(token)}`)
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Enlace no válido o expirado.");
        return data;
      })
      .then((data) => {
        if (!data.ok && data.status === "tenant_creation_failed") {
          setErrorMsg(data.message);
          setStep("pending");
          return;
        }
        if (!data.ok) {
          setErrorMsg(data.message ?? "Tu registro todavía está en proceso.");
          setStep("pending");
          return;
        }
        if (data.needs_password === false) {
          setStep("already_done");
          return;
        }
        setResumeData(data);
        setStep("form");
      })
      .catch((e) => {
        setErrorMsg(e.message);
        setStep("error");
      });
  }, [token]);

  const handleSubmit = async () => {
    if (password.length < 8) {
      setSubmitMsg("La contraseña debe tener al menos 8 caracteres.");
      return;
    }
    if (password !== confirmPwd) {
      setSubmitMsg("Las contraseñas no coinciden.");
      return;
    }
    if (!captchaToken) {
      setSubmitMsg("Completa la verificación de seguridad.");
      return;
    }
    setSubmitting(true);
    setSubmitMsg("");
    try {
      const res = await fetch(`${BACKEND_URL}/signup/claim-account`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Error al completar el registro.");

      const supabase = createClient();
      const { error: signInErr } = await supabase.auth.signInWithPassword({
        email: resumeData.email,
        password,
        options: { captchaToken },
      });
      if (signInErr) throw new Error(signInErr.message);

      setStep("success");
      setTimeout(() => {
        router.push(data.tenant_slug ? `/dashboard/${data.tenant_slug}` : "/login");
      }, 2000);
    } catch (e: any) {
      setSubmitMsg(e.message);
      turnstileRef.current?.reset();
      setCaptchaToken("");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: "#070d1a" }}>
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-white">Orbyx</h1>
          <p className="text-sm mt-1" style={{ color: "rgba(147,197,253,0.5)" }}>
            Plataforma de reservas
          </p>
        </div>

        {step === "loading" && (
          <div className="rounded-2xl border border-blue-900/25 p-8 text-center" style={{ background: "#0f1729" }}>
            <p className="text-sm" style={{ color: "rgba(147,197,253,0.5)" }}>Verificando tu registro...</p>
          </div>
        )}

        {step === "error" && (
          <div className="rounded-2xl border border-red-500/20 p-8 text-center" style={{ background: "#0f1729" }}>
            <p className="text-4xl mb-3">✗</p>
            <h2 className="text-white font-semibold mb-2">Enlace no válido</h2>
            <p className="text-sm text-red-400/70">{errorMsg}</p>
          </div>
        )}

        {step === "pending" && (
          <div className="rounded-2xl border border-yellow-500/20 p-8 text-center" style={{ background: "#0f1729" }}>
            <p className="text-4xl mb-3">⏳</p>
            <h2 className="text-white font-semibold mb-2">Todavía estamos trabajando en esto</h2>
            <p className="text-sm" style={{ color: "rgba(147,197,253,0.6)" }}>{errorMsg}</p>
          </div>
        )}

        {step === "already_done" && (
          <div className="rounded-2xl border border-blue-900/25 p-8 text-center" style={{ background: "#0f1729" }}>
            <p className="text-4xl mb-3">✓</p>
            <h2 className="text-white font-semibold mb-2">Tu cuenta ya está creada</h2>
            <p className="text-sm mb-5" style={{ color: "rgba(147,197,253,0.6)" }}>
              Ya completaste el registro para este negocio. Inicia sesión para continuar.
            </p>
            <a
              href="/login"
              className="inline-block py-2.5 px-6 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium transition-all"
            >
              Iniciar sesión
            </a>
          </div>
        )}

        {step === "success" && (
          <div className="rounded-2xl border border-green-500/20 p-8 text-center" style={{ background: "#0f1729" }}>
            <p className="text-4xl mb-3">✓</p>
            <h2 className="text-white font-semibold mb-2">¡Bienvenido a Orbyx!</h2>
            <p className="text-sm text-green-400/70">Tu cuenta fue creada. Redirigiendo al dashboard...</p>
          </div>
        )}

        {step === "form" && resumeData && (
          <div className="rounded-2xl border border-blue-900/25 p-6" style={{ background: "#0f1729" }}>
            <h2 className="text-white font-semibold text-lg mb-1">Crea tu contraseña</h2>
            <p className="text-sm mb-6" style={{ color: "rgba(147,197,253,0.5)" }}>
              Tu pago para el plan{" "}
              <span className="text-white font-medium">{resumeData.plan_id}</span> ya está
              confirmado. Crea tu contraseña para acceder al dashboard de{" "}
              <span className="text-white font-medium">{resumeData.business_name || "tu negocio"}</span>.
            </p>

            <div className="space-y-3 mb-5">
              <div>
                <label className="text-xs mb-1.5 block" style={{ color: "rgba(147,197,253,0.6)" }}>
                  Correo electrónico
                </label>
                <input
                  value={resumeData.email}
                  disabled
                  className="w-full rounded-xl border px-3 py-2 text-sm cursor-not-allowed opacity-40 outline-none"
                  style={{ background: "rgba(10,15,30,0.5)", borderColor: "rgba(37,99,235,0.2)", color: "#e2e8f0" }}
                />
              </div>
              <div>
                <label className="text-xs mb-1.5 block" style={{ color: "rgba(147,197,253,0.6)" }}>
                  Nueva contraseña
                </label>
                <div className="relative">
                  <input
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    type={showPassword ? "text" : "password"}
                    placeholder="Mínimo 8 caracteres"
                    className="w-full rounded-xl border pl-3 pr-10 py-2 text-sm text-white outline-none transition-colors"
                    style={{ background: "#0a0f1e", borderColor: "rgba(37,99,235,0.3)" }}
                  />
                  <PasswordVisibilityToggle
                    visible={showPassword}
                    onToggle={() => setShowPassword((v) => !v)}
                    className="text-blue-300/50 hover:text-blue-200"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs mb-1.5 block" style={{ color: "rgba(147,197,253,0.6)" }}>
                  Confirmar contraseña
                </label>
                <div className="relative">
                  <input
                    value={confirmPwd}
                    onChange={(e) => setConfirmPwd(e.target.value)}
                    type={showConfirmPwd ? "text" : "password"}
                    placeholder="Repite la contraseña"
                    className="w-full rounded-xl border pl-3 pr-10 py-2 text-sm text-white outline-none transition-colors"
                    style={{ background: "#0a0f1e", borderColor: "rgba(37,99,235,0.3)" }}
                  />
                  <PasswordVisibilityToggle
                    visible={showConfirmPwd}
                    onToggle={() => setShowConfirmPwd((v) => !v)}
                    className="text-blue-300/50 hover:text-blue-200"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-center mb-5">
              <Turnstile
                ref={turnstileRef}
                siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY!}
                onSuccess={(t) => setCaptchaToken(t)}
                onExpire={() => setCaptchaToken("")}
                onError={() => setCaptchaToken("")}
                options={{ theme: "dark" }}
              />
            </div>

            {submitMsg && <p className="text-xs text-red-400 mb-3">{submitMsg}</p>}

            <button
              onClick={handleSubmit}
              disabled={submitting || !password || !confirmPwd || !captchaToken}
              className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 active:scale-95 text-white text-sm font-medium transition-all disabled:opacity-40"
            >
              {submitting ? "Creando cuenta..." : "Crear cuenta y acceder"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function CompletarRegistroPage() {
  return (
    <Suspense fallback={<div style={{ padding: 16, color: "#f1f5f9" }}>Cargando...</div>}>
      <CompletarRegistroInner />
    </Suspense>
  );
}
