"use client";

import { Suspense, useRef, useState, useMemo } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import { Turnstile } from "@marsidev/react-turnstile";
import { PasswordVisibilityToggle } from "../../components/ui/password-visibility-toggle";
import { ParticleBackground } from "../../components/ui/particle-background";
import { TermsAcceptanceCheckbox } from "../../components/auth/TermsAcceptanceCheckbox";

// /signup es solo el onboarding gratuito (starter) — los planes pagos
// (business/premium) van por checkout-premium, no por acá. Ya no lee
// ?plan= de la URL (antes aceptaba pro/premium/vip/platinum): acá solo
// existe un plan real, así que el badge siempre muestra "Starter".
const PLAN_COLOR = "#8b5cf6";

function PasswordRequirement({ met, text }: { met: boolean; text: string }) {
  return (
    <span
      style={{
        display: "flex",
        alignItems: "center",
        gap: 6,
        fontSize: 12,
        color: met ? "#22c55e" : "#94a3b8",
        transition: "color 0.2s",
      }}
    >
      <span style={{ fontSize: 14 }}>{met ? "✓" : "○"}</span>
      {text}
    </span>
  );
}

function SignupInner() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const plan = "starter";

  const supabase = useMemo(
    () =>
      createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      ),
    []
  );

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [accountAlreadyExists, setAccountAlreadyExists] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string>("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const turnstileRef = useRef<any>(null);

  const hasMinLength = password.length >= 8;
  const hasLetter = /[a-zA-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const passwordValid = hasMinLength && hasLetter && hasNumber;
  const passwordsMatch = password === confirmPassword;
  const confirmTouched = confirmPassword.length > 0;

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    setAccountAlreadyExists(false);

    if (!fullName.trim()) {
      setMsg("Ingresa tu nombre completo.");
      return;
    }
    if (!passwordValid) {
      setMsg("La contraseña no cumple los requisitos mínimos.");
      return;
    }
    if (!passwordsMatch) {
      setMsg("Las contraseñas no coinciden.");
      return;
    }
    if (!acceptedTerms) {
      setMsg("Debes aceptar los Términos de Servicio para continuar.");
      return;
    }
    if (!captchaToken) {
      setMsg("Completa la verificación de seguridad.");
      return;
    }

    setLoading(true);

    const timeout = setTimeout(() => {
      setLoading(false);
      setMsg("La solicitud tardó demasiado. Intenta de nuevo.");
      turnstileRef.current?.reset();
      setCaptchaToken("");
    }, 10000);

    try {
      const siteUrl = window.location.origin;
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          captchaToken,
          emailRedirectTo: `${siteUrl}/auth/verified`,
          data: { plan, name: fullName.trim() },
        },
      });
      clearTimeout(timeout);
      if (error) throw error;

      // Supabase responde 200 (sin error) cuando el email ya tiene una
      // cuenta confirmada, para no filtrar si un correo existe — pero
      // no crea nada nuevo. La única señal es identities vacío.
      if (data?.user && Array.isArray(data.user.identities) && data.user.identities.length === 0) {
        setAccountAlreadyExists(true);
        setMsg("Ya existe una cuenta con este correo.");
        setLoading(false);
        return;
      }

      router.push("/auth/check-email");
    } catch (err: any) {
      clearTimeout(timeout);
      setMsg(err?.message || "Error al crear la cuenta");
      turnstileRef.current?.reset();
      setCaptchaToken("");
      setLoading(false);
    }
  }

  const planColor = PLAN_COLOR;
  const planLabel = "Starter";

  return (
    <>
    <style>{`
      @keyframes orbyx-pulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.6; }
      }
      @keyframes orbyx-spin {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
      }
    `}</style>
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(160deg, #0b1220 0%, #131c30 50%, #0b1220 100%)",
        padding: "24px 16px",
        fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif",
      }}
    >
      <ParticleBackground />
      <div
        style={{
          width: "100%",
          maxWidth: 440,
          background: "rgba(17,24,39,0.78)",
          backdropFilter: "blur(16px)",
          border: "1px solid rgba(148,163,184,0.16)",
          borderRadius: 20,
          animation: loading ? "orbyx-pulse 1.4s ease-in-out infinite" : "none",
          boxShadow: "0 24px 64px -24px rgba(2,6,23,0.6), 0 2px 12px -4px rgba(2,6,23,0.4)",
          padding: "44px 40px",
          position: "relative",
          zIndex: 1,
        }}
      >
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 10,
              marginBottom: 8,
            }}
          >
            <img
              src="/orbyx-mark-dark.png"
              alt="Orbyx"
              style={{ width: 36, height: 36 }}
            />
            <span
              style={{
                fontSize: 22,
                fontWeight: 800,
                color: "#f1f5f9",
                letterSpacing: "-0.5px",
              }}
            >
              Orbyx
            </span>
          </div>
          <p style={{ color: "#94a3b8", fontSize: 13, margin: 0 }}>
            Plataforma de reservas inteligente
          </p>
        </div>

        {/* Plan badge */}
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              background: `${planColor}18`,
              border: `1px solid ${planColor}44`,
              color: planColor,
              borderRadius: 999,
              padding: "5px 14px",
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: "0.5px",
              textTransform: "uppercase",
            }}
          >
            <span style={{ fontSize: 10 }}>●</span>
            Plan {planLabel}
          </span>
        </div>

        <h1
          style={{
            fontSize: 22,
            fontWeight: 700,
            color: "#f1f5f9",
            marginBottom: 6,
            textAlign: "center",
          }}
        >
          Crear tu cuenta
        </h1>

        {/* Divider */}
        <div
          style={{
            height: 1,
            background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.08), transparent)",
            marginBottom: 28,
          }}
        />

        <form onSubmit={handleSignup} style={{ display: "grid", gap: 16 }}>
          {/* Nombre completo */}
          <div style={{ position: "relative" }}>
            <span
              style={{
                position: "absolute",
                left: 14,
                top: "50%",
                transform: "translateY(-50%)",
                fontSize: 16,
                opacity: 0.4,
                pointerEvents: "none",
              }}
            >
              👤
            </span>
            <input
              type="text"
              placeholder="Nombre completo"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              disabled={loading}
              required
              autoComplete="name"
              style={{
                width: "100%",
                padding: "12px 14px 12px 40px",
                background: "#1e293b",
                border: "1px solid rgba(255,255,255,0.15)",
                borderRadius: 10,
                color: "#f1f5f9",
                fontSize: 14,
                outline: "none",
                transition: "border-color 0.2s",
                boxSizing: "border-box",
              }}
              onFocus={(e) => (e.target.style.borderColor = `${planColor}80`)}
              onBlur={(e) => (e.target.style.borderColor = "rgba(255,255,255,0.1)")}
            />
          </div>

          {/* Email field */}
          <div style={{ position: "relative" }}>
            <span
              style={{
                position: "absolute",
                left: 14,
                top: "50%",
                transform: "translateY(-50%)",
                fontSize: 16,
                opacity: 0.4,
                pointerEvents: "none",
              }}
            >
              ✉
            </span>
            <input
              type="email"
              placeholder="correo@empresa.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              required
              style={{
                width: "100%",
                padding: "12px 14px 12px 40px",
                background: "#1e293b",
                border: "1px solid rgba(255,255,255,0.15)",
                borderRadius: 10,
                color: "#f1f5f9",
                fontSize: 14,
                outline: "none",
                transition: "border-color 0.2s",
                boxSizing: "border-box",
              }}
              onFocus={(e) => (e.target.style.borderColor = `${planColor}80`)}
              onBlur={(e) => (e.target.style.borderColor = "rgba(255,255,255,0.1)")}
            />
          </div>

          {/* Password field */}
          <div>
            <div style={{ position: "relative" }}>
              <span
                style={{
                  position: "absolute",
                  left: 14,
                  top: "50%",
                  transform: "translateY(-50%)",
                  fontSize: 16,
                  opacity: 0.4,
                  pointerEvents: "none",
                }}
              >
                🔒
              </span>
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Contraseña"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                required
                style={{
                  width: "100%",
                  padding: "12px 40px 12px 40px",
                  background: "#1e293b",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: 10,
                  color: "#f1f5f9",
                  fontSize: 14,
                  outline: "none",
                  transition: "border-color 0.2s",
                  boxSizing: "border-box",
                }}
                onFocus={(e) => (e.target.style.borderColor = `${planColor}80`)}
                onBlur={(e) => (e.target.style.borderColor = "rgba(255,255,255,0.1)")}
              />
              <PasswordVisibilityToggle
                visible={showPassword}
                onToggle={() => setShowPassword((v) => !v)}
                className="text-slate-400 hover:text-slate-200"
              />
            </div>
            {/* Password requirements */}
            {password.length > 0 && (
              <div style={{ display: "flex", gap: 16, marginTop: 8, flexWrap: "wrap" }}>
                <PasswordRequirement met={hasMinLength} text="Mín. 8 caracteres" />
                <PasswordRequirement met={hasLetter} text="Una letra" />
                <PasswordRequirement met={hasNumber} text="Un número" />
              </div>
            )}
          </div>

          {/* Confirm password field */}
          <div>
            <div style={{ position: "relative" }}>
              <span
                style={{
                  position: "absolute",
                  left: 14,
                  top: "50%",
                  transform: "translateY(-50%)",
                  fontSize: 16,
                  opacity: 0.4,
                  pointerEvents: "none",
                }}
              >
                🔒
              </span>
              <input
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Confirmar contraseña"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={loading}
                required
                style={{
                  width: "100%",
                  padding: "12px 40px 12px 40px",
                  background: "#1e293b",
                  border: `1px solid ${
                    confirmTouched && !passwordsMatch
                      ? "#ef4444"
                      : confirmTouched && passwordsMatch
                      ? "#22c55e"
                      : "rgba(255,255,255,0.15)"
                  }`,
                  borderRadius: 10,
                  color: "#f1f5f9",
                  fontSize: 14,
                  outline: "none",
                  transition: "border-color 0.2s",
                  boxSizing: "border-box",
                }}
                onFocus={(e) => {
                  if (!confirmTouched || passwordsMatch)
                    e.target.style.borderColor = `${planColor}80`;
                }}
                onBlur={(e) => {
                  if (confirmTouched && !passwordsMatch)
                    e.target.style.borderColor = "#ef4444";
                }}
              />
              <PasswordVisibilityToggle
                visible={showConfirmPassword}
                onToggle={() => setShowConfirmPassword((v) => !v)}
                className="text-slate-400 hover:text-slate-200"
              />
            </div>
            {confirmTouched && !passwordsMatch && (
              <p style={{ color: "#ef4444", fontSize: 12, marginTop: 5, marginBottom: 0 }}>
                Las contraseñas no coinciden
              </p>
            )}
          </div>

          {/* Turnstile — visible y centrado */}
          <div style={{ display: "flex", justifyContent: "center" }}>
          <Turnstile
            ref={turnstileRef}
            siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY!}
            onSuccess={(token) => setCaptchaToken(token)}
            onExpire={() => setCaptchaToken("")}
            onError={() => setCaptchaToken("")}
            options={{ theme: "dark" }}
          />
          </div>

          <TermsAcceptanceCheckbox
            checked={acceptedTerms}
            onChange={setAcceptedTerms}
            disabled={loading}
          />

          {msg && (
            <p
              style={{
                color: "#f87171",
                fontSize: 13,
                background: "#ef444415",
                border: "1px solid #ef444430",
                borderRadius: 8,
                padding: "10px 14px",
                margin: 0,
              }}
            >
              {msg}
              {accountAlreadyExists && (
                <>
                  {" "}
                  <Link href="/login" style={{ color: "#f87171", textDecoration: "underline" }}>
                    Inicia sesión en su lugar
                  </Link>
                </>
              )}
            </p>
          )}

          {/* Separador antes del botón */}
          <div
            style={{
              height: 1,
              background: "linear-gradient(90deg, transparent, rgba(139,92,246,0.25), transparent)",
              margin: "4px 0",
            }}
          />

          <button
            type="submit"
            disabled={loading || !passwordValid || !passwordsMatch || !captchaToken || !acceptedTerms}
            style={{
              padding: "14px",
              borderRadius: 10,
              border: "none",
              cursor:
                loading || !passwordValid || !passwordsMatch || !captchaToken || !acceptedTerms
                  ? "not-allowed"
                  : "pointer",
              fontWeight: 700,
              fontSize: 15,
              background:
                loading || !passwordValid || !passwordsMatch || !captchaToken || !acceptedTerms
                  ? "rgba(255,255,255,0.06)"
                  : `linear-gradient(135deg, ${planColor}ee 0%, ${planColor} 50%, ${planColor}bb 100%)`,
              color:
                loading || !passwordValid || !passwordsMatch || !captchaToken || !acceptedTerms
                  ? "#475569"
                  : "#fff",
              transition: "all 0.2s",
              boxShadow:
                loading || !passwordValid || !passwordsMatch || !captchaToken || !acceptedTerms
                  ? "none"
                  : `0 6px 28px ${planColor}66, 0 2px 8px ${planColor}33`,
              letterSpacing: "0.3px",
            }}
          >
            {loading ? (
              <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                <svg style={{ animation: "orbyx-spin 0.8s linear infinite", flexShrink: 0 }} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <path d="M12 2a10 10 0 0 1 10 10" />
                </svg>
                Creando cuenta...
              </span>
            ) : "Crear cuenta"}
          </button>
        </form>

        {/* Divider */}
        <div
          style={{
            height: 1,
            background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.08), transparent)",
            margin: "24px 0",
          }}
        />

        <p style={{ textAlign: "center", color: "#64748b", fontSize: 13, margin: 0 }}>
          ¿Ya tienes una cuenta?{" "}
          <a
            href="/login"
            style={{ color: planColor, fontWeight: 600, textDecoration: "none" }}
          >
            Iniciar sesión
          </a>
        </p>
      </div>
    </div>
    </>
  );
}

export default function SignupPage() {
  return (
    <Suspense fallback={<div style={{ padding: 16, color: "#f1f5f9" }}>Cargando...</div>}>
      <SignupInner />
    </Suspense>
  );
}
