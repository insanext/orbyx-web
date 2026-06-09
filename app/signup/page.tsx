"use client";

import { Suspense, useRef, useState, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import { Turnstile } from "@marsidev/react-turnstile";

const PLAN_LABELS: Record<string, string> = {
  starter: "Starter",
  pro: "Pro",
  enterprise: "Enterprise",
};

const PLAN_COLORS: Record<string, string> = {
  starter: "#6366f1",
  pro: "#0ea5e9",
  enterprise: "#f59e0b",
};

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

  const plan = useMemo(() => {
    const p = (searchParams.get("plan") || "starter").toLowerCase();
    if (p === "pro" || p === "enterprise" || p === "starter") return p;
    return "starter";
  }, [searchParams]);

  const supabase = useMemo(
    () =>
      createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      ),
    []
  );

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [captchaToken, setCaptchaToken] = useState<string>("");
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

    if (!passwordValid) {
      setMsg("La contraseña no cumple los requisitos mínimos.");
      return;
    }
    if (!passwordsMatch) {
      setMsg("Las contraseñas no coinciden.");
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
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { captchaToken },
      });
      clearTimeout(timeout);
      if (error) throw error;

      const userId = data.user?.id;
      if (!userId) throw new Error("No se pudo obtener user_id del signup");

      const backend = process.env.NEXT_PUBLIC_BACKEND_URL!;
      const resp = await fetch(`${backend}/tenants/provision`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId, email, plan }),
      });

      const json = await resp.json();
      if (!resp.ok) throw new Error(json?.detail || json?.error || "Error provisionando tenant");

      const params = new URLSearchParams({ tenant_id: json.tenant_id, calendar_id: json.calendar_id });
      if (json.branch_id) params.set("branch_id", json.branch_id);
      router.push(`/onboarding?${params.toString()}`);
    } catch (err: any) {
      clearTimeout(timeout);
      setMsg(err?.message || "Error al crear la cuenta");
      turnstileRef.current?.reset();
      setCaptchaToken("");
      setLoading(false);
    }
  }

  const planColor = PLAN_COLORS[plan] ?? "#6366f1";
  const planLabel = PLAN_LABELS[plan] ?? plan;

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
        background: "linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)",
        padding: "24px 16px",
        fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif",
      }}
    >
      {/* Decorative blobs */}
      <div
        style={{
          position: "fixed",
          top: "10%",
          left: "5%",
          width: 300,
          height: 300,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${planColor}22 0%, transparent 70%)`,
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          position: "fixed",
          bottom: "15%",
          right: "8%",
          width: 250,
          height: 250,
          borderRadius: "50%",
          background: "radial-gradient(circle, #818cf822 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />

      <div
        style={{
          width: "100%",
          maxWidth: 440,
          background: "rgba(15, 23, 42, 0.85)",
          backdropFilter: "blur(20px)",
          border: "1px solid rgba(0, 229, 255, 0.4)",
          borderRadius: 20,
          animation: loading ? "orbyx-pulse 1.4s ease-in-out infinite" : "none",
          boxShadow: "0 0 24px rgba(0, 229, 255, 0.25), 0 0 60px rgba(6, 182, 212, 0.15), 0 0 2px rgba(0, 229, 255, 0.6), 0 32px 72px rgba(0,0,0,0.55)",
          padding: "44px 40px",
          position: "relative",
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
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                background: `linear-gradient(135deg, ${planColor}, ${planColor}99)`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 20,
                boxShadow: `0 4px 14px ${planColor}44`,
              }}
            >
              ◆
            </div>
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
          <p style={{ color: "#64748b", fontSize: 13, margin: 0 }}>
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
                background: "rgba(255,255,255,0.09)",
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
                type="password"
                placeholder="Contraseña"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                required
                style={{
                  width: "100%",
                  padding: "12px 14px 12px 40px",
                  background: "rgba(255,255,255,0.04)",
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
              type="password"
              placeholder="Confirmar contraseña"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={loading}
              required
              style={{
                width: "100%",
                padding: "12px 14px 12px 40px",
                background: "rgba(255,255,255,0.09)",
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
            disabled={loading || !passwordValid || !passwordsMatch || !captchaToken}
            style={{
              padding: "14px",
              borderRadius: 10,
              border: "none",
              cursor: loading || !passwordValid || !passwordsMatch || !captchaToken ? "not-allowed" : "pointer",
              fontWeight: 700,
              fontSize: 15,
              background:
                loading || !passwordValid || !passwordsMatch || !captchaToken
                  ? "rgba(255,255,255,0.06)"
                  : `linear-gradient(135deg, ${planColor}ee 0%, ${planColor} 50%, ${planColor}bb 100%)`,
              color:
                loading || !passwordValid || !passwordsMatch || !captchaToken ? "#475569" : "#fff",
              transition: "all 0.2s",
              boxShadow:
                loading || !passwordValid || !passwordsMatch || !captchaToken
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
